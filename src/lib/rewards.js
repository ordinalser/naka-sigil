/**
 * This week's SHNAKAS for My holdings, from the public per-week accumulator (/rewards/weights/{week}).
 * The accumulator is per piece and holder-independent; who may claim it follows the official engine (shielded-browser.js):
 * a note created at block h > start (mint, buy, reclaim, transfer) earns from week ceil((h − start) ÷ 1008), and a note spent
 * in a week (listed, sold, sent) only keeps the weeks before it. So any move inside a week zeroes that week for the piece, and
 * the new holder starts the week after. Public sale / reclaim heights mark that wait; a private transfer is not public, so a
 * holding without a public exit is a reference until the official wallet page confirms it. Not a claimable balance.
 */
(function(root,factory){const node=typeof module==='object'&&module.exports;const api=factory(node?require('./rules.js'):root.ShnakasRules,node?require('./portfolio.js'):root.NakaPortfolio);if(node)module.exports=api;else root.NakaRewards=api;})(globalThis,function(R,H){
 'use strict';const KEY='nakaRewardWeek',STATUS='nakaRewardStatus',OBSERVED='nakaOfficialReadings',WEEKS='nakaRewardWeeks';
 function normalize(raw){
  const W=R.RULES.weekBlocks,start=R.RULES.startBlock;
  if(!raw||!Number.isSafeInteger(raw.w)||raw.w<0||raw.w>=R.RULES.weeks||raw.height!==start+raw.w*W||!Number.isSafeInteger(raw.blocks)||raw.blocks<0||raw.blocks>W||typeof raw.complete!=='boolean'||raw.complete&&raw.blocks!==W||typeof raw.base!=='string'||!/^\d{1,20}$/.test(raw.base)||!Array.isArray(raw.pieces)||raw.pieces.length!==3333||BigInt(raw.base)>BigInt(R.RULES.poolPerWeekBase)||raw.pieces.some(v=>typeof v!=='string'||!/^\d{1,20}$/.test(v)||BigInt(v)>BigInt(R.RULES.poolPerWeekBase)||BigInt(v)<BigInt(raw.base)))throw Error('Invalid public reward accumulator');
  const bytes=new Uint8Array(raw.pieces.length*8),view=new DataView(bytes.buffer);raw.pieces.forEach((v,i)=>view.setBigUint64(i*8,BigInt(v),true));
  const acc=typeof Buffer!=='undefined'?Buffer.from(bytes).toString('base64'):btoa(Array.from(bytes,b=>String.fromCharCode(b)).join(''));
  return {format:1,week:raw.w,height:raw.height+raw.blocks,blocks:raw.blocks,complete:raw.complete,base:raw.base,acc};
 }
 const decoded=new WeakMap();
 function table(row){if(!row||row.format!==1||typeof row.complete!=='boolean'||typeof row.base!=='string'||!/^\d{1,20}$/.test(row.base)||BigInt(row.base)>BigInt(R.RULES.poolPerWeekBase)||!Number.isSafeInteger(row.week)||row.week<0||row.week>=R.RULES.weeks||!Number.isSafeInteger(row.blocks)||row.blocks<0||row.blocks>R.RULES.weekBlocks||row.height!==R.RULES.startBlock+row.week*R.RULES.weekBlocks+row.blocks||typeof row.acc!=='string'||row.acc.length!==35552||!/^[A-Za-z0-9+/]+={0,2}$/.test(row.acc))return null;if(decoded.has(row))return decoded.get(row);try{const bytes=typeof Buffer!=='undefined'?new Uint8Array(Buffer.from(row.acc,'base64')):Uint8Array.from(atob(row.acc),c=>c.charCodeAt(0));if(bytes.length!==3333*8)return null;const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);for(let i=0;i<3333;i++){const value=view.getBigUint64(i*8,true);if(value>BigInt(R.RULES.poolPerWeekBase)||value<BigInt(row.base))return null;}decoded.set(row,view);return view;}catch{return null;}}
 function piece(row,asset){const data=table(row);return data&&Number.isSafeInteger(asset)&&asset>=0&&asset<3333?Number(data.getBigUint64(asset*8,true))/10**R.RULES.tokenDecimals:null;}
 const W=R.RULES.weekBlocks,START=R.RULES.startBlock,int=n=>n.toLocaleString('en-US');
 /** 1-based reward week of a block after the start, and a week's first and last block. */
 const weekNo=h=>Math.floor((h-START-1)/W)+1,firstBlock=n=>START+(n-1)*W+1,lastBlock=n=>START+n*W;
 /** When a listing was made: its reward week, or before rewards started (no week number exists then). */
 const listedWhen=(h,zh)=>h<=START?(zh?'奖励启动前':'before rewards started'):(zh?`第 ${weekNo(h)} 周`:`week ${weekNo(h)}`);
 /** Completed-week tables kept by the worker: {weekIndex: row}, valid complete rows only (an invalid row is left out). */
 function weeks(raw){
  if(!raw||raw.format!==1||!raw.weeks||typeof raw.weeks!=='object'||Array.isArray(raw.weeks))return null;
  const out={};for(const [k,row] of Object.entries(raw.weeks)){const w=Number(k);if(Number.isInteger(w)&&row?.week===w&&row.complete===true&&table(row))out[w]=row;}
  return out;
 }
 /**
  * Why one NFT does or does not count this week, from public data at the snapshot block: its listing (with the listing
  * block), an exit inside this week (sale, reclaim or both, with blocks), or nothing public. `held` holds only if no
  * private transfer happened this week, which is not public. Without this week's records ('no-events') or for a piece
  * minted after the start at a block the records do not show ('late-mint') the week cannot be decided.
  */
 function reason(snap,id){
  const phase=R.rewardPhase(snap.snapshot);
  if(['ended','closed'].includes(phase.state))return {kind:'ended',phase};
  if(snap.offers.some(o=>o[0]===id)){const L=new Map(snap.listedAt??[]).get(id),c=(snap.closing??[]).find(row=>row[0]===id);return {kind:'listed',phase,listedAt:Number.isSafeInteger(L)?L:null,closing:c?c[1]:null};}
  if(['before','boundary'].includes(phase.state))return {kind:'before',phase};
  if(snap.rewardEvents===undefined)return {kind:'no-events',phase};
  const c=R.rewardContext(snap,id,'unlisted');
  if(c.state==='waiting')return {kind:c.event,phase,height:c.eventHeight,listedAt:Number.isSafeInteger(c.listHeight)?c.listHeight:null,startsWeek:weekNo(c.eligibleAt),eligibleAt:c.eligibleAt};
  if(c.state==='no-future-week')return {kind:'no-future-week',phase};
  if(R.RULES.lateMintNumbers.includes(snap.items[id][0]))return {kind:'late-mint',phase};
  return {kind:'held',phase};
 }
 /**
  * Per holding: status 'earning' (counts this week), 'waiting' (moved this week: starts next week), 'listed', 'paused' or
  * 'gone' (the official wallet page showed it paused or left), 'ended', 'idle' (before rewards start, unlisted) or
  * 'unknown' (this week cannot be decided). amount is this week's accumulator for an earning holding, 0 for one that
  * earns nothing, null while the week's table is not loaded or the status is unknown; avg is the piece's average weight
  * over the week so far (its accumulator ÷ the base 100% accumulator), holder-independent. events (My holdings records)
  * settle a late mint that changed hands publicly after its mint.
  */
 function portfolio(snap,ids,row,observed,events=null){
  const phase=R.rewardPhase(snap.snapshot),active=phase.state==='active';
  const valid=active&&row?.week===phase.index&&row.height<=snap.snapshot.height&&!!table(row);
  const count={earning:0,waiting:0,listed:0,paused:0,gone:0,ended:0,idle:0,unknown:0};let reference=0,confirmed=0,unverified=0,readings=0;const rows=[];
  for(const id of ids){if(!Object.hasOwn(snap.items,id))continue;
   const asset=snap.items[id][0]-snap.collection.numberStart;let why=reason(snap,id);
   if(why.kind==='late-mint'&&Array.isArray(events?.rows?.[id])){try{const now=R.notesOf(events.rows[id],true).at(-1);if(now.by!=='mint'&&now.spent===null&&now.firstWeek<=phase.index)why={kind:'held',phase};}catch{/* records out of order: stays undecided */}}
   const ob=observed?.rows?.[id],seen=ob&&ob.week===phase.index&&ob.height<=snap.snapshot.height?ob.state:null;
   let status=why.kind==='listed'?'listed':why.kind==='before'?'idle':['ended','no-future-week'].includes(why.kind)?'ended':['sale','cancel','exit'].includes(why.kind)?'waiting':['no-events','late-mint'].includes(why.kind)?'unknown':'earning',detail=why,used=false;
   // A wallet reading only narrows a public "held" (it sees private transfers); it never overrides a public exit.
   // 'before' during the programme means the wallet had not loaded its reward data: no reading.
   if(status==='earning'&&seen==='waiting'){used=true;if(phase.index+1>=R.RULES.weeks){status='ended';detail={kind:'no-future-week',phase};}else{status='waiting';detail={kind:'wallet-waiting',phase,height:ob.height,startsWeek:phase.week+1};}}
   else if(status==='earning'&&seen==='paused'){used=true;status='paused';detail={kind:'wallet-paused',phase,height:ob.height};}
   else if(status==='earning'&&seen==='past'){used=true;status='gone';detail={kind:'wallet-past',phase,height:ob.height};}
   else if(status==='earning'&&['earning','claimable'].includes(seen))used=true;
   if(used)readings++;
   const amount=valid&&status!=='unknown'?(status==='earning'?piece(row,asset):0):null,verified=status==='earning'?['earning','claimable'].includes(seen):status!=='unknown';
   const avg=valid&&row.blocks>0?piece(row,asset)/(Number(row.base)/10**R.RULES.tokenDecimals)*R.RULES.basePct:null;
   count[status]++;if(amount!==null){reference+=amount;if(verified)confirmed+=amount;}if(!verified)unverified++;
   rows.push({id,status,reason:detail,startsWeek:detail.startsWeek??null,amount,avg,verified,paused:status!=='earning'});
  }
  const verified=valid&&unverified===0;
  return {state:['before','boundary'].includes(phase.state)?'before':['ended','closed'].includes(phase.state)?'ended':valid?'ready':'loading',
   height:valid?row.height:null,blocks:valid?row.blocks:active?snap.snapshot.height-phase.first+1:0,week:phase.week,phase,count,
   reference:valid?reference:null,confirmed:verified?confirmed:null,verified,unverified,readings,rows};
 }
 const unitsOf=(snap,rows)=>rows.reduce((sum,row)=>{const u=R.units(R.evaluateSnapshot(snap,row.id));return {lo:sum.lo+u.lo,hi:sum.hi+u.hi};},{lo:0,hi:0});
 /** Weekly SHNAKAS at this block's weights for the holdings that count this week. */
 function currentRate(snap,data){
  if(data.phase.state!=='active')return {lo:0,hi:0};
  return R.weeklyAllocation(unitsOf(snap,data.rows.filter(row=>row.status==='earning')),R.programmeUnits(snap));
 }
 /** SHNAKAS the latest block paid the holdings that count this week, at that block's weights (exact per-block figure). */
 function blockRate(snap,data){
  if(data.phase.state!=='active')return {lo:0,hi:0};
  return R.blockAllocation(unitsOf(snap,data.rows.filter(row=>row.status==='earning')),R.programmeUnits(snap));
 }
 /** Weekly SHNAKAS once every holding that counts or will count does: this week's, next week's and (before launch)
  * unlisted ones; listed, paused, left, ended and undecided holdings are out. */
 function steadyRate(snap,data){return R.weeklyAllocation(unitsOf(snap,data.rows.filter(row=>['earning','waiting','idle'].includes(row.status))),R.programmeUnits(snap));}
 /** Units of the holdings that count this week ÷ all programme units: this block's split of each block's reward. */
 function shareNow(snap,data){const u=unitsOf(snap,data.rows.filter(row=>row.status==='earning')),K=R.programmeUnits(snap);return {lo:u.lo/K.hi,hi:u.hi/K.lo};}
 /** This week: accrued plus the current rate for the blocks still to come (assumes today's weights hold). */
 function projection(data,rate){
  if(data.state!=='ready')return null;const amount=data.verified?data.confirmed:data.reference,left=(W-data.blocks)/W;
  return {lo:amount+rate.lo*left,hi:amount+rate.hi*left};
 }
 /** Share of the SHNAKAS issued so far this week: accrued ÷ (weekly pool × blocks so far ÷ 1,008). */
 function weekShare(data){
  if(data.state!=='ready'||data.blocks<=0)return null;const amount=data.verified?data.confirmed:data.reference;
  return amount/(R.RULES.poolPerWeek*data.blocks/W);
 }
 /** Week ranges as text: [[0,1],[4,4]] → "1–2, 5" (1-based). */
 function rangeText(ranges,lang){return ranges.map(([a,b])=>a===b?String(a+1):`${a+1}–${b+1}`).join(lang==='zh'?'、':', ');}
 /**
  * Completed weeks, from the official tables only. A holding counts the weeks of its run (portfolio.attribution: from its
  * purchase or the mint, through my reclaims, minus weeks the wallet showed it moved privately); a piece that left counts
  * each of my runs that ended. Records must reach the last completed week's last block (later records cannot change
  * finished weeks); until then, for a holding without records, an unclear sale, or a start that is not public, the week is
  * unknown instead of guessed. left: my runs of pieces that left, with their kept weeks and amounts.
  */
 function history(snap,ids,leftRaw,events,weekRows,phase,metaRaw){
  const last=phase.state==='active'?phase.index-1:['ended','closed'].includes(phase.state)?R.RULES.weeks-1:-1;
  const asset=id=>snap.items[id][0]-snap.collection.numberStart,known=ids.filter(id=>Object.hasOwn(snap.items,id));
  const ready=!!events&&Number.isSafeInteger(events.height)&&events.height>=START+(last+1)*W,meta=metaRaw&&typeof metaRaw==='object'?metaRaw:{};
  const mine=known.map(id=>{
   if(!ready)return {id,ranges:null};
   const a=H.attribution(snap,id,events.rows?.[id],meta[id]);
   if(a.state==='unknown')return {id,ranges:null};
   if(a.state==='unclear'){
    // Until the owner answers, a week of either side's run may be mine: both runs' weeks are unknown.
    const lm=R.RULES.lateMintNumbers.includes(snap.items[id][0]),rec=events.rows[id];
    const seller=R.ownership(rec,{height:a.sale.listedAt,listedAt:a.sale.listedAt,seller:true},lm),buyer=R.ownership(rec,{height:a.sale.soldAt,listedAt:null},lm);
    return {id,ranges:[...H.runWeeks(seller.notes,a.gaps),...H.runWeeks(buyer.notes,a.gaps)],uncertain:true};
   }
   return {id,ranges:H.runWeeks(a.notes,a.gaps)};
  });
  const left=Object.entries(H.leftOf(leftRaw)).filter(([id])=>Object.hasOwn(snap.items,id)).flatMap(([id,e])=>e.runs.map(run=>({id,number:snap.items[id][0],run,ranges:run.weeks})));
  const out=[];
  for(let w=0;w<=last;w++){
   const tab=weekRows?.[w]??null;let amount=0,pieces=0,unknown=0;
   for(const m of [...mine,...left]){const c=m.ranges===null?null:H.covers(m.ranges,w),v=m.uncertain&&c!==false?null:c;if(v===null){unknown++;continue;}if(!v)continue;pieces++;if(tab)amount+=piece(tab,asset(m.id));}
   out.push({week:w+1,amount:tab&&!unknown?amount:null,pieces,unknown,loaded:!!tab});
  }
  const sold=left.map(x=>{
   if(x.ranges===null)return {...x,kept:null,weeks:null,amount:null};
   const kept=x.ranges.filter(([a,b])=>a!==null&&b!==null&&b>=a),span=[];for(const [a,b] of kept)for(let w=a;w<=Math.min(b,last);w++)span.push(w);
   const unknownStart=x.ranges.some(([a])=>a===null),missing=unknownStart||span.some(w=>!weekRows?.[w]);
   return {...x,kept,weeks:kept.reduce((n,[a,b])=>n+b-a+1,0),amount:missing?null:span.reduce((s,w)=>s+piece(weekRows[w],asset(x.id)),0)};
  });
  const total=out.every(x=>x.amount!==null)?out.reduce((a,x)=>a+x.amount,0):null;
  return {weeks:out,left:sold,total:out.length?total:null};
 }
 const copy=lang=>lang==='zh'?{
  accrued:'本周已累计',reference:'本周累计 · 参考',projected:'本周预计',toLaunch:'距第 1 周',blocksLeft:n=>`${n} 块`,weekly:'每周',lastBlock:'最新一块',share:'本周占比',unitShare:'权重占比',past:'往周合计',
  week:(n,b)=>`第 ${n} 周 · ${b} / 1008 块`,weekOnly:n=>`第 ${n} 周`,before:'奖励启动前',ended:'奖励已结束',launchAt:h=>`第 1 周起点 区块 ${h}`,claimBy:h=>`领取截止区块 ${h}`,
  loading:'正在读取本周累计…',error:'累计读取失败，下次检查时重试',endedNote:h=>`78 周奖励已结束；已完成的周在官方钱包领取，协议领取截止区块 ${h}`,closedNote:h=>`已过协议领取截止区块 ${h}`,
  counts:c=>[c.earning?`${c.earning} 枚本周有奖励`:'',c.idle?`${c.idle} 枚第 1 周起有奖励`:'',c.waiting?`${c.waiting} 枚下周起有奖励`:'',c.listed?`${c.listed} 枚挂单中`:'',c.paused?`${c.paused} 枚暂停`:'',c.gone?`${c.gone} 枚已转出（钱包页）`:'',c.ended?`${c.ended} 枚没有后续周`:'',c.unknown?`${c.unknown} 枚本周无法确认`:''].filter(Boolean).join(' · ')||'本周没有持仓有奖励',
  leftCount:n=>`已离手 ${n} 枚`,
  shareHint:cur=>`本周已累计 ÷ 本周已过区块的奖池（每周 266,640 SHNAKAS × 已过块数 ÷ 1,008）。当前区块本周有奖励的持仓占全部 3,333 枚权重单位 K 的 ${cur}，之后每块按这个比例分。`,
  unitShareHint:'未挂单持仓的权重单位 ÷ 全部 3,333 枚的权重单位 K；第 1 周起每块按这个比例分',
  weeklyHint:'奖励开始前：按当前区块的权重，第 1 周起有奖励的持仓一整周能分到的 SHNAKAS（挂单中的没有奖励，不算在内）',
  lastBlockHint:(h,n)=>`区块 ${h} 按当时的权重分给本周有奖励的持仓的 SHNAKAS，每一块都会随挂单变化。本周预计 = 本周累计 + 它 × 剩余 ${n} 块（假设权重不再变）`,
  projectedHint:n=>`本周已累计 + 当前每块速率 × 剩余 ${n} 块：假设剩余区块的权重不变；只算本周有奖励的持仓`,
  pastHint:'已结束各周的合计（按官方周累计表），含已经领取的部分；领取状态以官方钱包为准',
  note:'本周开始前持有、本周没有挂单或转出的 Naka 整周有奖励；本周买入、撤单或收到的从下一周开始有奖励；挂单、卖出或转出的那一周没有奖励。插件按公开挂单和成交记录判断；私下转账（含加中继额度）不公开，可在钱包页点“将当前奖励资格同步到插件”确认。',
  tracked:'已用钱包页显示的资格核对；转移藏品后请重新同步',
  status:{earning:'本周',waiting:'下周起',listed:'挂单中',paused:'暂停',gone:'已转出',ended:'无后续周',idle:'',unknown:'无法确认'},startsWeek:n=>`第 ${n} 周起`,
 }:{
  accrued:'Accrued this week',reference:'This week · reference',projected:'Projected',toLaunch:'To week 1',blocksLeft:n=>`${n} block${n==='1'?'':'s'}`,weekly:'Weekly',lastBlock:'Last block',share:'Week share',unitShare:'Weight share',past:'Past weeks',
  week:(n,b)=>`Week ${n} · ${b} / 1008 blocks`,weekOnly:n=>`Week ${n}`,before:'Before rewards start',ended:'Accrual ended',launchAt:h=>`Week 1 starts at block ${h}`,claimBy:h=>`Claim deadline block ${h}`,
  loading:'Reading this week’s accumulator…',error:'Reward data unavailable; retried at the next check',endedNote:h=>`The 78 reward weeks are over; claim completed weeks in the official wallet (programme claim deadline: block ${h})`,closedNote:h=>`Past the programme claim deadline, block ${h}`,
  counts:c=>[c.earning?`${c.earning} earning this week`:'',c.idle?`${c.idle} count${c.idle===1?'s':''} from week 1`:'',c.waiting?`${c.waiting} start${c.waiting===1?'s':''} next week`:'',c.listed?`${c.listed} listed`:'',c.paused?`${c.paused} paused`:'',c.gone?`${c.gone} sent away (Wallet)`:'',c.ended?`${c.ended} with no later week`:'',c.unknown?`${c.unknown} undecided this week`:''].filter(Boolean).join(' · ')||'No holding earns this week',
  leftCount:n=>`${n} left your vault`,
  shareHint:cur=>`Accrued this week ÷ the pool issued so far this week (266,640 SHNAKAS a week × blocks so far ÷ 1,008). At the current block the holdings earning this week hold ${cur} of all 3,333 pieces’ units K, so each block is split that way.`,
  unitShareHint:'Weight units of unlisted holdings ÷ all 3,333 pieces’ units K; from week 1 each block is split this way',
  weeklyHint:'Before rewards start: at this block’s weights, what the holdings counting from week 1 earn in a full week (listed ones excluded)',
  lastBlockHint:(h,n)=>`What block ${h} paid the holdings that count this week, at its weights; it changes block by block with the listings. Projected = accrued this week + this × ${n} block${n==='1'?'':'s'} left, assuming weights stay`,
  projectedHint:n=>`Accrued this week + the current per-block rate × ${n} block${n==='1'?'':'s'} left: assumes weights stay as now; only holdings that count this week`,
  pastHint:'Total of the finished weeks from the official weekly tables, claimed parts included; the official wallet shows what is still claimable',
  note:'A Naka held from before the week began and not listed or sent this week earns the whole week; one bought, reclaimed or received this week starts next week; the week in which a piece is listed, sold or sent earns nothing. Read from public listings and sales; a private transfer (adding relay credits included) is not public, so confirm with “Sync displayed eligibility to Naka Sigil” on the Wallet page.',
  tracked:'Checked against the eligibility shown on your Wallet page; sync again after moving pieces',
  status:{earning:'This week',waiting:'Next week',listed:'Listed',paused:'Paused',gone:'Sent away',ended:'No later week',idle:'',unknown:'Undecided'},startsWeek:n=>`Week ${n}+`,
 };
 /** English sentences start with a capital whether or not a listing clause leads them. */
 const cap=(parts,...values)=>{const text=parts.reduce((out,part,i)=>out+part+(i<values.length?values[i]:''),'');return text.charAt(0).toUpperCase()+text.slice(1);};
 /** One sentence for one NFT: what happened, when, and from which week it counts. */
 function explain(r,lang){
  const zh=lang==='zh',p=r.phase,wk=p.week,[a,b]=wk?[firstBlock(wk),lastBlock(wk)]:[0,0],claim=int(R.RULES.claimUntil);
  const listedPart=Number.isSafeInteger(r.listedAt)?(zh?`区块 ${int(r.listedAt)} 挂单（${listedWhen(r.listedAt,true)}）、`:`Listed at block ${int(r.listedAt)} (${listedWhen(r.listedAt,false)}), `):'';
  const lastWeek=p.state==='active'&&p.index+1>=R.RULES.weeks;
  switch(r.kind){
   case 'before':return zh?{short:'第 1 周起有奖励',full:`区块 ${int(START)}（含）之前持有且没有挂单，就从第 1 周（区块 ${int(START+1)} 起）开始有奖励；之后买入、撤单或收到的从下一周起有奖励。`}:{short:'From week 1',full:`Held unlisted at block ${int(START)} or earlier, it earns from week 1 (block ${int(START+1)}); bought, reclaimed or received later, it starts the following week.`};
   case 'ended':return zh?{short:'奖励已结束',full:p.state==='closed'?`78 周奖励已结束，已过协议领取截止区块 ${claim}。`:`78 周奖励已结束；已完成的周在官方钱包领取，协议领取截止区块 ${claim}。`}:{short:'Accrual ended',full:p.state==='closed'?`The 78 weeks are over and the programme claim deadline, block ${claim}, has passed.`:`The 78 weeks are over; claim completed weeks in the official wallet (programme claim deadline: block ${claim}).`};
   case 'no-future-week':return zh?{short:'无后续完整周',full:'本期已没有后续完整奖励周。'}:{short:'No later week',full:'No later full reward week in this programme.'};
   case 'no-events':return zh?{short:'本周无法确认',full:'本周的公开成交和撤单记录还没读到，暂时无法判断这一枚本周有没有奖励；下次检查读到后自动更新。'}:{short:'Undecided this week',full:'This week’s public sales and reclaims are not loaded yet, so whether this piece counts this week is not known; it updates once the next check reads them.'};
   case 'late-mint':return zh?{short:'本周无法确认',full:`这一枚在奖励开始后才铸造（区块 971,787 时仍未铸造），铸造区块不在公开挂单记录里：铸造那一周没有奖励、之后每周都有，插件无法确定从哪一周开始。`}:{short:'Undecided this week',full:`Minted after rewards started (still unminted at block 971,787); the mint block is not in the public listing records: the mint week earns nothing and later weeks do, so its first week is not known here.`};
   case 'listed':{
    const head=Number.isSafeInteger(r.listedAt)?(zh?`区块 ${int(r.listedAt)} 挂单（${listedWhen(r.listedAt,true)}）：`:`Listed at block ${int(r.listedAt)} (${listedWhen(r.listedAt,false)}): `):(zh?'挂单中：':'Listed: ');
    const early=Number.isSafeInteger(r.listedAt)&&r.listedAt<=START;
    if(p.state==='before')return zh?{short:'挂单中 · 没有奖励',full:`${head}挂单期间每周都没有奖励。在区块 ${int(START)}（含）之前撤单，从第 1 周起有奖励；之后撤单，从撤单的下一周起有奖励。`}:{short:'Listed · not earning',full:`${head}no week earns while it is listed. Reclaimed by block ${int(START)}, it earns from week 1; reclaimed later, from the week after the reclaim.`};
    if(p.state==='boundary')return zh?{short:'挂单中 · 没有奖励',full:`${head}挂单期间每周都没有奖励；现在撤单最早在区块 ${int(START+1)} 确认，从第 2 周（区块 ${int(firstBlock(2))} 起）开始有奖励。`}:{short:'Listed · not earning',full:`${head}no week earns while it is listed; a reclaim now confirms at block ${int(START+1)} at the earliest and earns from week 2 (block ${int(firstBlock(2))}).`};
    const resume=lastWeek?(zh?'这是最后一个奖励周，撤单后也没有能拿奖励的完整周。':'this is the last reward week, so a reclaim has no full week left to earn.'):(zh?'撤单后从撤单的下一周恢复奖励。':'a reclaim resumes the week after it.');
    // Already closing: someone's purchase or my reclaim is confirming in the next block.
    if(r.closing==='sale')return zh?{short:'成交中 · 下一块确认',full:`${head}已有人买下，正在等下一块确认：确认后这一枚离开你的金库，挂单那一周没有奖励；挂单前已完成的周仍可领取。`}
     :{short:'Selling · confirming',full:`${head}someone has bought it and it confirms in the next block: then it leaves your vault and the listing week earns nothing; weeks completed before the listing stay claimable.`};
    if(r.closing==='cancel')return zh?{short:'撤单中 · 下一块确认',full:`${head}撤单正在等下一块确认；${resume}`}:{short:'Reclaiming · confirming',full:`${head}the reclaim confirms in the next block; ${resume}`};
    if(early)return zh?{short:'挂单中 · 没有奖励',full:`${head}挂单期间每周都没有奖励；${resume}`}:{short:'Listed · not earning',full:`${head}no week earns while it is listed; ${resume}`};
    return zh?{short:'挂单中 · 没有奖励',full:`${head}挂单那一周整周没有奖励（挂单前的区块也没有），挂单期间每周都没有奖励；${resume}挂单前已完成的周仍可领取。`}
     :{short:'Listed · not earning',full:`${head}the listing week earns nothing (its earlier blocks included), nor does any week while listed; ${resume} Weeks completed before the listing stay claimable.`};
   }
   case 'sale':return zh?{short:`本周成交 · 第 ${r.startsWeek} 周起有奖励`,full:`${listedPart}区块 ${int(r.height)} 成交：成交那一周这一枚谁都没有奖励。买家从第 ${r.startsWeek} 周（区块 ${int(r.eligibleAt)} 起）开始有奖励；卖家保留挂单前已完成的周。`}
    :{short:`Sold this week · from week ${r.startsWeek}`,full:cap`${listedPart}sold at block ${int(r.height)}: nobody earns that week for this piece. The buyer earns from week ${r.startsWeek} (block ${int(r.eligibleAt)}); the seller keeps the weeks completed before the listing.`};
   case 'cancel':return zh?{short:`本周撤单 · 第 ${r.startsWeek} 周起有奖励`,full:`${listedPart}区块 ${int(r.height)} 撤单：从挂单那一周起没有奖励，撤单那一周也没有，从第 ${r.startsWeek} 周（区块 ${int(r.eligibleAt)} 起）恢复奖励。`}
    :{short:`Reclaimed this week · from week ${r.startsWeek}`,full:cap`${listedPart}reclaimed at block ${int(r.height)}: no reward from the listing week through the reclaim week; it resumes in week ${r.startsWeek} (block ${int(r.eligibleAt)}).`};
   case 'exit':return zh?{short:`本周换手 · 第 ${r.startsWeek} 周起有奖励`,full:`区块 ${int(r.height)} 同时有成交和撤单：这一周没有奖励，从第 ${r.startsWeek} 周（区块 ${int(r.eligibleAt)} 起）开始有奖励。`}
    :{short:`Moved this week · from week ${r.startsWeek}`,full:`A sale and a reclaim closed at block ${int(r.height)}: nothing this week; it earns from week ${r.startsWeek} (block ${int(r.eligibleAt)}).`};
   case 'wallet-waiting':return zh?{short:'下周起（钱包页）',full:`官方钱包页显示“下周开始”：本周这一枚有一次私下转移（转入、转给自己或加中继额度），本周没有奖励，从第 ${r.startsWeek} 周起有奖励。`}:{short:'Next week (Wallet)',full:`The official Wallet page shows it starting next week: this piece moved privately this week (received, sent to yourself or relay credits added), so it earns nothing this week and counts from week ${r.startsWeek}.`};
   case 'wallet-paused':return zh?{short:'暂停（钱包页）',full:'官方钱包页显示“暂停”：本周没有奖励。'}:{short:'Paused (Wallet)',full:'The official Wallet page shows it paused: nothing this week.'};
   case 'wallet-past':return zh?{short:'已转出（钱包页）',full:'官方钱包页显示它已离开你的金库：离开前完整的周仍可领取，本周没有奖励。'}:{short:'Sent away (Wallet)',full:'The official Wallet page shows it left your vault: earlier full weeks stay claimable; nothing this week.'};
   default:return zh?{short:'本周有奖励',full:`本周（第 ${wk} 周，区块 ${int(a)}–${int(b)}）这一枚没有公开的挂单、成交或撤单：本周开始前就在持有人手里、本周也没有私下转出的话，整周有奖励，周结束后可领取。私下转账不公开，插件看不到。`}
    :{short:'Counts this week',full:`No public listing, sale or reclaim of this piece this week (week ${wk}, blocks ${int(a)}–${int(b)}): held from before the week and not sent privately, it earns the whole week, claimable once the week ends. Private transfers are not public.`};
  }
 }
 /** The eligibility line for an inspection: the NFT as it is, or the outcome of buying it ('sale') or reclaiming my own
  * listing ('cancel') now. A transaction sent now confirms at the next block at the earliest, so its note starts at
  * startWeek(height + 1). */
 function explainFor(snap,id,lang,action=null){
  const r=reason(snap,id),zh=lang==='zh',p=r.phase,h=snap.snapshot.height;
  if(action===null||!['sale','cancel'].includes(action))return explain(r,lang);
  if(['ended','closed'].includes(p.state))return explain(r,lang);
  const k=R.startWeek(h+1),next=k+1,at=firstBlock(next);
  if(k>=R.RULES.weeks)return zh?{short:'无后续完整周',full:'现在买入或撤单，最早在下一块确认，已经没有后续能拿奖励的完整周。'}:{short:'No later week',full:'Bought or reclaimed now, it confirms at the next block at the earliest, with no full reward week left to earn.'};
  const listed=Number.isSafeInteger(r.listedAt)?(zh?`区块 ${int(r.listedAt)} 挂单（${listedWhen(r.listedAt,true)}），`:`Listed at block ${int(r.listedAt)} (${listedWhen(r.listedAt,false)}); `):'',early=Number.isSafeInteger(r.listedAt)&&r.listedAt<=START;
  if(k===0)return action==='sale'
   ?(zh?{short:'买入后第 1 周起有奖励',full:`${listed}在区块 ${int(START)}（含）之前买入确认，就从第 1 周（区块 ${int(START+1)} 起）开始有奖励。`}:{short:'Bought now · from week 1',full:cap`${listed}bought and confirmed by block ${int(START)}, it earns from week 1 (block ${int(START+1)}).`})
   :(zh?{short:'撤单后第 1 周起有奖励',full:`${listed}在区块 ${int(START)}（含）之前撤单确认，就从第 1 周（区块 ${int(START+1)} 起）开始有奖励。`}:{short:'Reclaimed now · from week 1',full:cap`${listed}reclaimed and confirmed by block ${int(START)}, it earns from week 1 (block ${int(START+1)}).`});
  // The week the transaction lands in: this week, or the next one when the snapshot is the last block of a week.
  const land=weekNo(h+1),when=zh?(land===p.week?`在本周（第 ${land} 周）`:`现在（最早区块 ${int(h+1)}，属第 ${land} 周）`):(land===p.week?`this week (week ${land})`:`now (block ${int(h+1)} at the earliest, week ${land})`);
  return action==='sale'
   ?(zh?{short:`买入后第 ${next} 周起有奖励`,full:`${listed}如果${when}买入：这一周这一枚谁都没有奖励，你从第 ${next} 周（区块 ${int(at)} 起）开始有奖励。`}:{short:`Bought now · from week ${next}`,full:cap`${listed}bought ${when}: nobody earns that week for it; you earn from week ${next} (block ${int(at)}).`})
   :(zh?{short:`撤单后第 ${next} 周起有奖励`,full:`${listed}如果${when}撤单：${early?'挂单期间':'挂单那一周起'}到撤单这一周都没有奖励，从第 ${next} 周（区块 ${int(at)} 起）恢复奖励。`}:{short:`Reclaimed now · from week ${next}`,full:cap`${listed}reclaimed ${when}: nothing from ${early?'the listing':'the listing week'} through that week; it resumes in week ${next} (block ${int(at)}).`});
 }
 const format=x=>Number.isFinite(x)?new Intl.NumberFormat('en-US',{minimumFractionDigits:4,maximumFractionDigits:4}).format(x):'—';
 const amountText=x=>new Intl.NumberFormat('en-US',{minimumFractionDigits:2,maximumFractionDigits:x>0&&x<.0001?8:4}).format(x);
 const pct=x=>`${(x*100).toFixed(3)}%`;
 /**
  * The holdings hero. Every state renders the same parts in the same order (label, week, figure, stats, bar, note), so a
  * refresh only changes text: a value that cannot be computed yet keeps its slot and is hidden instead of collapsing.
  * options: {share: {lo,hi} unit share of unlisted holdings (before launch), status: stored fetch status, history: from
  * history(), events: My holdings records}.
  */
 function render(snap,ids,row,observed,lang,options={}){
  const c=copy(lang),U=globalThis.NakaExploreUI,P=globalThis.NakaPixel,data=portfolio(snap,ids,row,observed,options.events??null),rate=currentRate(snap,data),steady=steadyRate(snap,data),phase=data.phase;
  const n=(tag,cls,text)=>{const el=document.createElement(tag);el.className=cls;if(text!==undefined)el.textContent=text;return el;};
  const box=n('section','naka-reward');box.dataset.state=data.state;box.dataset.verified=String(data.verified);box.dataset.height=String(data.height??'');
  const before=['before','boundary'].includes(phase.state),ended=['ended','closed'].includes(phase.state),claim=int(R.RULES.claimUntil);
  const head=n('div','naka-reward__head'),label=n('span','naka-reward__label',before?c.before:ended?c.ended:data.verified?c.accrued:c.reference);label.title=data.readings>0&&data.verified?c.tracked:c.note;
  head.append(label,n('span','naka-reward__week',phase.state==='active'?(data.state==='ready'?c.week(phase.week,data.blocks):c.weekOnly(phase.week)):before?c.launchAt(int(START+1)):c.claimBy(claim)));box.append(head);
  const amount=data.state==='before'?0:data.state==='ready'?(data.verified?data.confirmed:data.reference):null;
  const main=n('div','naka-reward__main'),figure=n('div','naka-reward__figure'),text=amount===null?'0.0000':amountText(amount);
  figure.setAttribute('aria-live','polite');const digits=P.digits(text.replace(/[^0-9.,]/g,''),'naka-reward__digits');if(amount===null)digits.classList.add('is-blank');
  figure.append(n('span','naka-sr-only',amount!==null?`${text} SHNAKAS`:ended?c.ended:c.loading),digits,n('span','naka-reward__unit','SHNAKAS'));
  const stats=n('dl','naka-reward__stats'),stat=(key,title,value,hint)=>{const d=n('div','naka-reward__stat');d.dataset.key=key;if(hint)d.title=hint;const dd=n('dd','',value??'0.00');if(value===null)dd.classList.add('is-blank');d.append(n('dt','',title),dd);stats.append(d);};
  const projected=projection(data,rate),share=weekShare(data),unit=options.share?U.percent(options.share):null;
  // Before launch no block pays yet: the distance to week 1 and the week-1 rate. Once blocks pay: what the latest block paid,
  // then the week it projects to, then this week's share, so the two figures about this week stand together.
  if(before){stat('launch',c.toLaunch,c.blocksLeft(int(START+1-snap.snapshot.height)));stat('weekly',c.weekly,U.shn(steady),c.weeklyHint);}
  else{const b=blockRate(snap,data),f=x=>amountText(x);stat('block',c.lastBlock,phase.state==='active'?(b.lo===b.hi?f(b.lo):`${f(b.lo)}–${f(b.hi)}`):null,c.lastBlockHint(int(snap.snapshot.height),int(Math.max(0,W-data.blocks))));
   stat('projected',c.projected,phase.state==='active'&&projected?U.shn(projected):null,c.projectedHint(int(Math.max(0,W-data.blocks))));}
  if(before)stat('share',c.unitShare,unit,c.unitShareHint);else stat('share',c.share,share===null?null:pct(share),c.shareHint(phase.state==='active'?U.percent(shareNow(snap,data)):'—'));
  // Past weeks exist only after the first full week; the slot never appears mid-session.
  if(phase.index!==null&&phase.index>0||ended)stat('past',c.past,options.history?.total===null||options.history?.total===undefined?null:U.shn({lo:options.history.total,hi:options.history.total}),c.pastHint);
  main.append(figure,stats);box.append(main);
  const bar=n('div','naka-reward__bar'),fill=n('i','');fill.style.width=(phase.state==='active'?Math.min(1,data.blocks/W)*100:ended?100:0)+'%';
  bar.setAttribute('role','progressbar');bar.setAttribute('aria-valuemin','0');bar.setAttribute('aria-valuemax',String(W));bar.setAttribute('aria-valuenow',String(phase.state==='active'?data.blocks:ended?W:0));bar.append(fill);box.append(bar);
  // Pieces, not sales: one sold twice this week left once.
  const status=options.status,leftCount=options.history?new Set(options.history.left.map(x=>x.id)).size:0;
  const line=(before||data.state==='ready'?c.counts(data.count):phase.state==='closed'?c.closedNote(claim):ended?c.endedNote(claim):status?.state==='error'?c.error:c.loading)+(leftCount?` · ${c.leftCount(leftCount)}`:'');
  const note=n('p','naka-reward__note',line);note.title=c.note;note.setAttribute('role','status');if(data.state==='loading')note.dataset.pending='true';box.append(note);
  return {element:box,data};
 }
 /** Caption parts for one holding tile: amount this week (null while loading), its status words and the exact reason. */
 function tile(data,id,lang){const c=copy(lang),row=data.rows.find(r=>r.id===id);if(!row)return null;const e=explain(row.reason,lang);return {row,amount:row.amount,label:row.status==='waiting'&&row.startsWeek?c.startsWeek(row.startsWeek):c.status[row.status],explain:e};}
 return {KEY,STATUS,OBSERVED,WEEKS,normalize,table,piece,weeks,reason,explain,explainFor,portfolio,currentRate,blockRate,steadyRate,shareNow,projection,weekShare,history,rangeText,render,tile,format,copy,weekNo,listedWhen};
});
