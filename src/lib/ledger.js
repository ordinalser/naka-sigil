/* Weekly accounting over official cumulative vectors; personal intervals are local user records, never wallet proof. */
(function(root,factory){const node=typeof module==='object'&&module.exports;const api=factory(node?require('./rules.js'):root.ShnakasRules,node?require('./rewards.js'):root.NakaRewards,node?require('./portfolio.js'):root.NakaPortfolio);if(node)module.exports=api;else root.NakaLedger=api;})(globalThis,function(R,A,H){
 'use strict';
 const KEY='nakaHoldingLedger',W=R.RULES.weekBlocks,S=R.RULES.startBlock,D=10**R.RULES.tokenDecimals;
 const height=h=>Number.isSafeInteger(h)&&h>=0;
 const period=w=>{if(!Number.isInteger(w)||w<0||w>=R.RULES.weeks)throw Error('Invalid reward week');return {week:w,first:S+w*W+1,last:S+(w+1)*W};};
 function intervals(raw,id){const rows=raw?.format===1&&raw.runs&&typeof raw.runs==='object'?raw.runs[id]:null;return Array.isArray(rows)?rows.filter(r=>r&&height(r.from)&&(r.to===null||height(r.to)&&r.to>r.from)&&r.confirmed===true).map(r=>({...r})):[];}
 function save(raw,ids,run){
  if(raw!==undefined&&raw!==null&&(!raw||typeof raw!=='object'||Array.isArray(raw)||raw.format!==1||!raw.runs||typeof raw.runs!=='object'||Array.isArray(raw.runs)))throw Error('Unrecognized holding ledger; original data preserved');
  if(!height(run?.from)||!(run.to===null||height(run.to)&&run.to>run.from)||run.confirmed!==true)throw Error('Invalid holding interval');
  const base=raw??{format:1,runs:{}},runs={...base.runs};
  for(const id of H.normalize(ids)){if(runs[id]!==undefined&&!Array.isArray(runs[id]))throw Error('Unrecognized NFT interval; original data preserved');const rows=Array.isArray(runs[id])?[...runs[id]]:[];const at=rows.findIndex(r=>r?.from===run.from);const value={...(at>=0?rows[at]:{}),from:run.from,to:run.to,confirmed:true};if(at>=0)rows[at]=value;else rows.push(value);runs[id]=rows;}
  return {...base,format:1,runs};
 }
 function remove(raw,id,from){if(raw?.format!==1||!raw.runs||!Array.isArray(raw.runs[id])||!height(from))throw Error('Unrecognized holding ledger; original data preserved');return {...raw,runs:{...raw.runs,[id]:raw.runs[id].filter(r=>r?.from!==from)}};}
 function overlaps(record,first,last){return record[1]<=last&&(record[2]===null||record[2]>=first);}
 function validRecords(records,through){return height(through)&&Array.isArray(records)&&records.every(r=>Array.isArray(r)&&r.length===4&&Number.isInteger(r[0])&&r[0]>=0&&r[0]<3333&&height(r[1])&&(r[2]===null||height(r[2])&&r[2]>=r[1])&&['active','sale','cancel'].includes(r[3]));}
 /** Sanitized claim records: no nullifiers, addresses, note ciphertext or wallet identity leave the worker. */
 function claims(raw){
  if(!Array.isArray(raw))return null;const out=[],seen=new Set();
  for(const lot of raw){if(!lot||!Number.isSafeInteger(lot.id)||seen.has(lot.id)||!['reward','bonus'].includes(lot.kind)||!height(lot.height)||typeof lot.size!=='string'||!/^\d{1,24}$/.test(lot.size))return null;seen.add(lot.id);
   const list=lot.batch===true?lot.claims:[lot];if(!Array.isArray(list)||!list.length)return null;
   const clean=[];for(const c of list){if(!c||!Number.isInteger(c.a)||!Number.isInteger(c.t)||c.a<0||c.t<c.a||c.t>=R.RULES.weeks||lot.kind==='bonus'&&(!Number.isInteger(c.assetId)||c.assetId<0||c.assetId>=3333))return null;clean.push({first:c.a,last:c.t,asset:Number.isInteger(c.assetId)?c.assetId:null});}
   out.push({id:lot.id,kind:lot.kind,height:lot.height,size:lot.size,claims:clean});
  }return out;
 }
 function claimed(row,lots,asOf){
  const data=A.table(row);if(!data||!Array.isArray(lots))return null;let value=0n;const base=BigInt(row.base);
  for(const lot of lots){if(lot.height>asOf)continue;for(const c of lot.claims){if(row.week<c.first||row.week>c.last)continue;if(lot.kind==='reward')value+=base;else if(c.asset!==null){const bonus=data.getBigUint64(c.asset*8,true)-base;if(bonus<0n)return null;value+=bonus;}else return null;}}
  return Number(value)/D;
 }
 function network(snap,row,records,recordsHeight,lots=null){
  if(!A.table(row)||row.height>recordsHeight||!validRecords(records,recordsHeight))return {state:'unavailable'};
  const p=period(row.week),end=row.height,data=A.table(row),excluded=new Set(),origin=snap.collection.numberStart;
  for(const r of records)if(overlaps(r,p.first,end))excluded.add(r[0]);
  // Still unminted now, so every reward week so far is unrewarded for that catalogue row.
  for(const r of snap.pending??[])excluded.add(r[0]-origin);
  // These six were still unminted at block 971,787, inside week 0. A later mint in that week
  // forfeits the week, and a mint afterwards means the week never had a note. Either way week 0
  // is unrewarded. Their later weeks stay inside the upper bound: the mint block is not public.
  if(row.week===0)for(const num of R.RULES.lateMintNumbers)excluded.add(num-origin);
  let total=0n,missed=0n;for(let i=0;i<3333;i++){const v=data.getBigUint64(i*8,true);total+=v;if(excluded.has(i))missed+=v;}
  return {state:'ready',week:row.week,first:p.first,last:p.last,through:end,blocks:row.blocks,complete:row.complete,
   theoretical:Number(total)/D,scheduled:Number(BigInt(R.RULES.poolPerWeekBase)*BigInt(row.blocks)/BigInt(W))/D,
   knownUnrewarded:Number(missed)/D,eligibleUpper:Number(total-missed)/D,
   excluded:excluded.size,claimed:row.complete?claimed(row,lots,recordsHeight):0,claimHeight:recordsHeight,exactEligibility:false};
 }
 function eligibility(snap,id,w,through,records,meta,ledger,leftRaw,current=true,prepared=null){
  const p=period(w),asset=snap.items[id][0]-snap.collection.numberStart,own=prepared?.own??records.filter(r=>r[0]===asset),manual=prepared?.manual??intervals(ledger,id);
  const listed=own.some(r=>overlaps(r,p.first,Math.min(p.last,through))),left=prepared?prepared.left:H.leftOf(leftRaw)[id];
  // Runs that ended in a public sale (Left): the weeks they kept, from the records of that sale.
  const leftRanges=prepared?.leftRanges??[];let leftUnknown=prepared?.leftUnknown??false;
  if(!prepared&&left)for(const run of left.runs){if(run.weeks===null)leftUnknown=true;else leftRanges.push(...run.weeks);}
  if(manual.length){
   // A recorded interval stands for the current holding (it says when it began and ended), but never removes a past run a
   // public sale proves. A public sale inside the interval before this week contradicts it (the piece changed hands): that
   // week is undecided until the interval is recorded as closed at the sale.
   const cover=manual.find(r=>w>=R.startWeek(r.from)&&(r.to===null||w<R.spendWeek(r.to)));
   if(cover){
    if(own.some(r=>r[3]==='sale'&&Number.isSafeInteger(r[2])&&r[2]>=cover.from&&r[2]<p.first))return {state:'unknown',recorded:false};
    return {state:listed?'unrewarded':'earning',recorded:true};
   }
   // A Left run whose weeks are not known adds nothing here: the recorded intervals are the better account of this piece.
   if(H.covers(leftRanges,w))return {state:listed?'unrewarded':'earning',recorded:false};
   return {state:'outside',recorded:true};
  }
  const ranges=prepared?[...prepared.ranges]:[...leftRanges];let unknown=prepared?prepared.unknown:leftUnknown;
  if(!prepared&&current)try{const a=H.attribution(snap,id,own,meta?.[id]);if(a.state==='held'||a.state==='listed'||a.state==='sold')ranges.push(...H.runWeeks(a.notes,a.gaps));else unknown=true;}catch{unknown=true;}
  const covered=H.covers(ranges,w);if(covered===null||unknown&&!covered)return {state:'unknown',recorded:false};
  if(!covered)return {state:'outside',recorded:false};
  return {state:listed?'unrewarded':'earning',recorded:false};
 }
 function fleet(snap,ids,rows,records,recordsHeight,meta,ledger,leftRaw,options={}){
  const currentIds=new Set(H.normalize(ids)),saved=[...new Set([...H.normalize(ids),...Object.keys(ledger?.format===1?ledger.runs??{}:{}),...Object.keys(H.leftOf(leftRaw))])],weeks=[];
  if(!validRecords(records,recordsHeight))return {state:'unavailable',weeks:[],total:null};
  const groups=new Map(),prepared=new Map(),left=H.leftOf(leftRaw);for(const r of records){if(!groups.has(r[0]))groups.set(r[0],[]);groups.get(r[0]).push(r);}for(const id of saved){if(!snap.items[id])continue;const own=groups.get(snap.items[id][0]-snap.collection.numberStart)??[],leftRanges=[];let leftUnknown=false;if(left[id])for(const run of left[id].runs){if(run.weeks===null)leftUnknown=true;else leftRanges.push(...run.weeks);}const ranges=[...leftRanges];let unknown=leftUnknown;if(currentIds.has(id)){const a=H.attribution(snap,id,own,meta?.[id]);if(['held','listed','sold'].includes(a.state))ranges.push(...H.runWeeks(a.notes,a.gaps));else unknown=true;}prepared.set(id,{own,manual:intervals(ledger,id),left:left[id],leftRanges,leftUnknown,ranges,unknown});}
  for(const row of rows){if(!A.table(row)||row.height>recordsHeight)continue;const p=period(row.week),pieces=[],table=A.table(row),detail=options.details===undefined||options.details===row.week;let amountBase=0n,unknown=0,reference=false;
   for(const id of saved){if(!Object.hasOwn(snap.items,id)){unknown++;if(detail)pieces.push({id,number:null,state:'unknown',amount:null,recorded:false});continue;}
    const e=eligibility(snap,id,row.week,row.height,records,meta,ledger,leftRaw,currentIds.has(id),prepared.get(id)),value=e.state==='unknown'?null:e.state==='earning'?Number(table.getBigUint64((snap.items[id][0]-snap.collection.numberStart)*8,true))/D:0;
    if(value===null)unknown++;else if(e.state==='earning')amountBase+=table.getBigUint64((snap.items[id][0]-snap.collection.numberStart)*8,true);if(e.state!=='outside'&&!e.recorded)reference=true;
    if(detail)pieces.push({id,number:snap.items[id][0],...e,amount:value});}
   weeks.push({week:row.week,first:p.first,last:p.last,through:row.height,complete:row.complete,amount:unknown?null:Number(amountBase)/D,amountBase:unknown?null:String(amountBase),knownAmount:Number(amountBase)/D,unknown,reference,pieces});
  }
  // The week the hero calls this week stays out of the past total, also at its own last block (complete by then), so one
  // week is never both "this week" and past. Once the next block is in, it counts.
  weeks.sort((a,b)=>b.week-a.week);const phase=R.rewardPhase(snap.snapshot),open=phase.state==='active'?phase.index:null,expected=open!==null?open:Math.max(0,Math.min(R.RULES.weeks,Math.floor((snap.snapshot.height-S)/W)));
  for(const w of weeks)w.counted=w.complete&&w.week!==open;const complete=weeks.filter(w=>w.counted),total=complete.length<expected||complete.some(w=>w.amount===null)?null:Number(complete.reduce((s,w)=>s+BigInt(w.amountBase),0n))/D;
  return {state:'ready',weeks,total,reference:complete.some(w=>w.reference),current:weeks.find(w=>w.week===open)??weeks.find(w=>!w.complete)??null,recordedIds:saved.filter(id=>intervals(ledger,id).length).length,savedCount:saved.length};
 }
 return {KEY,period,intervals,save,remove,overlaps,validRecords,claims,claimed,network,eligibility,fleet};
});
