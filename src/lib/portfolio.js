/**
 * User-maintained local holdings: what they earn, what a purchase or delisting does to them, and which public notes are
 * mine. Weekly allocation follows the official split: the weekly pool is shared by every catalog piece's units, so
 * mine = my units ÷ all programme units × pool. Only holdings not listed at the block count: listed pieces earn nothing.
 * A new holding still waits for the next reward week; this is the weekly rate once it counts.
 */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./rules.js'):root.ShnakasRules,typeof module==='object'&&module.exports?require('./purchase.js'):root.NakaPurchase);if(typeof module==='object'&&module.exports)module.exports=api;else root.NakaPortfolio=api;})(typeof globalThis!=='undefined'?globalThis:this,function(R,P){
 'use strict';
 const KEY='nakaPortfolio',MAX=3333,ID=/^[0-9a-f]{64}i\d+$/;
 const normalize=raw=>Array.isArray(raw)?[...new Set(raw.filter(x=>typeof x==='string'&&ID.test(x)))].slice(0,MAX):[];
 /** Numbers added beside my holdings (a teammate's or any), stored as {mates:[number…]}: valid, unique, at most 3,333. A
  * list saved as named members (0.11.3) becomes one list of all their numbers; the guard baseline of 0.11.x is not kept. */
 const TEAM='nakaTeam';
 function mates(raw){
  const pool=Array.isArray(raw?.mates)?raw.mates:Array.isArray(raw?.members)?raw.members.flatMap(m=>Array.isArray(m?.numbers)?m.numbers:[]):[];
  return [...new Set(pool.filter(x=>Number.isSafeInteger(x)&&x>=0))].slice(0,MAX);
 }
 function update(raw,ids,snap,remove=false){const set=new Set(normalize(raw));for(const id of normalize(ids)){if(remove)set.delete(id);else if(Object.hasOwn(snap.items,id))set.add(id);}return [...set].slice(0,MAX);}
 const sum=rows=>({lo:rows.reduce((v,x)=>v+x.lo.weight,0),hi:rows.reduce((v,x)=>v+x.hi.weight,0)});
 const addUnits=(a,b)=>({lo:a.lo+b.lo,hi:a.hi+b.hi});
 /** Units that earn: holdings not listed at the block. */
 const earning=(snap,ids,result,unlisted)=>ids.filter(id=>unlisted(id)).reduce((u,id)=>addUnits(u,R.units(result(id))),{lo:0,hi:0});
 function allocationOf(units,all){const weekly=R.weeklyAllocation(units,all);return {units,all,weekly,share:{lo:units.lo/all.hi,hi:units.hi/all.lo}};}
 function current(snap,raw){
  const ids=normalize(raw),known=ids.filter(id=>Object.hasOwn(snap.items,id)),listed=known.filter(id=>P.listingStatus(snap,id)==='listed');
  const units=earning(snap,known,id=>R.evaluateSnapshot(snap,id),id=>!listed.includes(id));
  return {ids:known,missing:ids.length-known.length,total:sum(known.map(id=>R.evaluateSnapshot(snap,id))),listed:listed.length,allocation:allocationOf(units,R.programmeUnits(snap))};
 }
 /**
  * What buying (or delisting my own) listing `id` does to My holdings. rows[].delta: each holding's weight change
  * (rules.weightChange). allocation: weekly SHNAKAS before and after, the change split into the piece itself (from
  * the week after the action) and every other holding (from the next block). With no later reward week the piece adds
  * nothing (pieceCounts false).
  */
 function impact(snap,raw,id,action='sale',model=P.create(snap,{action})){
  const phase=R.rewardPhase(snap.snapshot);if(['ended','closed'].includes(phase.state))return {state:'ended'};
  const own=current(snap,raw),already=own.ids.includes(id);
  if((action==='sale'&&already)||(action==='cancel'&&!already))return {state:action==='sale'?'already-held':'not-held'};
  const scenario=model.get(id);if(scenario.state!=='ready')return {state:scenario.state};
  const sameFloor=scenario.afterFloor===snap.snapshot.collectionFloor;
  const rows=own.ids.map(other=>{const before=R.evaluateSnapshot(snap,other),after=scenario.evaluate(other);return {id:other,before,after,delta:R.weightChange(before,after,sameFloor)};});
  const existing=sum(rows.map(x=>x.after)),delta=rows.reduce((d,x)=>({lo:d.lo+x.delta.lo,hi:d.hi+x.delta.hi}),{lo:0,hi:0});
  const added=action==='sale'?{lo:scenario.result.lo.weight,hi:scenario.result.hi.weight}:{lo:0,hi:0};
  // A note created after this block earns from startWeek(height + 1); past the last week the piece earns nothing.
  const pieceCounts=R.startWeek(snap.snapshot.height+1)<R.RULES.weeks;
  // After the action the selected NFT is held and unlisted; other holdings keep their listing status.
  const listedAfter=new Set(own.ids.filter(other=>other!==id&&P.listingStatus(snap,other)==='listed'));
  const others=earning(snap,own.ids.filter(other=>other!==id),other=>scenario.evaluate(other),other=>!listedAfter.has(other));
  const piece=pieceCounts?R.units(scenario.result):{lo:0,hi:0},all=scenario.programmeUnits(),before=own.allocation,after=allocationOf(addUnits(others,piece),all);
  // One-world change of the units of other earning holdings (the delisted piece itself earned nothing before).
  const dOthers=rows.filter(x=>x.id!==id&&!listedAfter.has(x.id)).reduce((d,x)=>({lo:d.lo+x.delta.lo/R.RULES.unitPct,hi:d.hi+x.delta.hi/R.RULES.unitPct}),{lo:0,hi:0});
  const K0=R.programmeUnits(snap),dK=scenario.unitChange();
  const allocation={before,after,delta:R.weeklyChangeBounds(before.units,addUnits(dOthers,piece),K0,dK),piece:R.weeklyAllocation(piece,all),pieceCounts,
   others:{after:R.weeklyAllocation(others,all),delta:R.weeklyChangeBounds(before.units,dOthers,K0,dK)}};
  return {state:'ready',action,before:own.total,existing,delta,added,after:{lo:existing.lo+added.lo,hi:existing.hi+added.hi},net:{lo:delta.lo+added.lo,hi:delta.hi+added.hi},allocation,rows,scenario,missing:own.missing};
 }
 /** Listings ranked by how much buying each raises my weekly allocation (conservative lower bound), then by ask. */
 function rank(snap,raw){const model=P.create(snap);return (snap.offers??[]).map(([id,price])=>({id,price,impact:impact(snap,raw,id,'sale',model)})).filter(x=>x.impact.state==='ready').sort((a,b)=>b.impact.allocation.delta.lo-a.impact.allocation.delta.lo||a.price-b.price);}

 // ---------------------------------------------------------------- Which public notes are mine (local only).
 // META {id: anchor}: {added: ms[, seller]} until the worker anchors it to the first chain height read after it was
 // added, then {anchor: height, listedAt: listing height open at that block | null[, seller][, legacy][, gaps]}.
 // seller: added from my own vault or wallet page, so a listing open then is mine. legacy: saved before anchors existed,
 // anchored at the first check after the update. gaps: weeks the official wallet showed it waiting (a private move).
 // LEFT {id: {number, runs: [{listedAt, soldAt, weeks: [[first, last]…] | null, source}]}}: my runs of a piece that left.
 // EVENTS {height, rows: {id: [[asset, listing, close, kind]…]}}: public listing records of my holdings and of left pieces.
 // LEFT_SEEN ["<id>@<sale block>"…]: this week's sales the owner already opened or dismissed in the popup's note.
 const META='nakaHoldingsMeta',LEFT='nakaLeft',EVENTS='nakaHoldingEvents',LEFT_SEEN='nakaLeftSeen';
 const lateMint=(snap,id)=>R.RULES.lateMintNumbers.includes(snap.items[id][0]);
 const weekList=raw=>Array.isArray(raw)?[...new Set(raw.filter(w=>Number.isInteger(w)&&w>=0&&w<R.RULES.weeks))].sort((a,b)=>a-b):[];
 /** The anchor stored for a holding: {state:'anchored', anchor}, {state:'pending'} or {state:'legacy-unanchored'}. */
 function anchorOf(meta){
  if(meta&&Number.isSafeInteger(meta.anchor)&&(meta.listedAt===null||Number.isSafeInteger(meta.listedAt)))
   return {state:'anchored',anchor:{height:meta.anchor,listedAt:meta.listedAt,seller:meta.seller===true},legacy:meta.legacy===true,gaps:weekList(meta.gaps)};
  if(meta&&Number.isSafeInteger(meta.added))return {state:'pending'};
  return {state:'legacy-unanchored'};
 }
 /**
  * Which run of a holding is mine. anchored: from its anchor. Otherwise (pending, or saved before anchors existed) the
  * piece is taken as mine at the newest record block, exactly what the anchor will record unless a new block arrives.
  * Returns rules.ownership's result plus legacy and gaps, or {state:'unknown'} without records.
  */
 function attribution(snap,id,records,meta){
  // Stored records are read only when every row is one; anything else counts as no records until the next block's batch.
  if(!Array.isArray(records)||!records.every(Array.isArray))return {state:'unknown'};
  const a=anchorOf(meta);let anchor=a.anchor;
  if(a.state!=='anchored'){const open=records.find(r=>r[3]==='active');anchor={height:Infinity,listedAt:open?open[1]:null,seller:false};}
  try{return {...R.ownership(records,anchor,lateMint(snap,id)),legacy:a.legacy===true||a.state==='legacy-unanchored',gaps:a.gaps??[]};}
  catch{return {state:'unknown'};}
 }
 /**
  * A sale only the owner can attribute, or null. The public records cannot tell whether a listing that was open when the
  * holding was added, and later sold, was the owner's own sale or a listing the owner bought (attribution 'unclear'); a
  * holding saved before anchors existed that sold this week is asked the same way (`reason`: its rewards reason, kind
  * 'sale' with listedAt and height). Any other sale of a holding is the owner's and moves it to Left on its own.
  */
 function saleToConfirm(snap,id,records,meta,reason){
  const own=attribution(snap,id,records,meta);
  if(own.state==='unclear')return {listedAt:own.sale.listedAt,soldAt:own.sale.soldAt};
  if(own.legacy&&reason.kind==='sale'&&Number.isSafeInteger(reason.listedAt))return {listedAt:reason.listedAt,soldAt:reason.height};
  return null;
 }
 /** Week ranges a run earns, minus gap weeks: [[first, last|null]…]; first null is an unknown start (late mint). */
 function runWeeks(notes,gaps=[]){
  const out=[];
  for(const n of notes){if(n.lastWeek!==null&&n.firstWeek!==null&&n.lastWeek<n.firstWeek)continue;let a=n.firstWeek;
   for(const g of gaps){if(a!==null&&g<a)continue;if(n.lastWeek!==null&&g>n.lastWeek)break;if(a===null){out.push([null,g-1]);a=g+1;continue;}if(g>a)out.push([a,g-1]);a=g+1;}
   if(n.lastWeek===null||a===null||a<=n.lastWeek)out.push([a,n.lastWeek]);}
  return out;
 }
 /** Whether week ranges cover week w: true, false, or null when a range's start is unknown. */
 function covers(ranges,w){let unknown=false;for(const [a,b] of ranges){if(b!==null&&w>b)continue;if(a===null){unknown=true;continue;}if(w>=a)return true;}return unknown?null:false;}
 const runOk=r=>!!r&&typeof r==='object'&&(r.listedAt===null||Number.isSafeInteger(r.listedAt))&&(r.weeks===null||Array.isArray(r.weeks)&&r.weeks.every(x=>Array.isArray(x)&&x.length===2));
 /** Left pieces as {id: {number, runs}}; entries saved before runs existed become one run whose weeks are re-read. */
 function leftOf(raw){
  const out={};if(!raw||typeof raw!=='object'||Array.isArray(raw))return out;
  for(const [id,e] of Object.entries(raw)){
   if(!ID.test(id)||!e||typeof e!=='object')continue;
   const runs=Array.isArray(e.runs)?e.runs:Number.isSafeInteger(e.listedAt)?[{listedAt:e.listedAt,soldAt:Number.isSafeInteger(e.soldAt)?e.soldAt:null,weeks:null,source:typeof e.source==='string'?e.source:'sale'}]:[];
   const valid=runs.filter(runOk);
   if(valid.length)out[id]={number:Number.isSafeInteger(e.number)?e.number:null,runs:valid};
  }
  return out;
 }
 /** Left as stored after a write: `left` (read by leftOf, then changed) and everything leftOf could not read in the stored
  * table, kept as it was: a whole entry, or an entry's runs beside the readable ones. A write never deletes what this
  * version cannot read (an older or newer format, or damage); pages only leave it out. A removed piece keeps such runs. */
 function leftSave(raw,left){
  const stored=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{},read=leftOf(stored),out={};
  const odd=id=>Array.isArray(stored[id]?.runs)?stored[id].runs.filter(r=>!runOk(r)):[];
  for(const [id,e] of Object.entries(stored)){
   if(id==='__proto__')continue;
   if(!Object.hasOwn(read,id))out[id]=e;
   else if(!Object.hasOwn(left,id)&&odd(id).length)out[id]={number:read[id].number,runs:odd(id)};
  }
  for(const [id,e] of Object.entries(left))out[id]=odd(id).length?{...e,runs:[...e.runs,...odd(id)]}:e;
  return out;
 }
 /** Runs of Left (as rewards.history lists them) sold during this reward week, in sale order, for the popup's note:
  * `keys` names every one, `fresh` the ones not in LEFT_SEEN yet. A private move has no sale block, so it is not dated and
  * not listed; a stored value that is not a list of keys marks nothing as seen. */
 function soldThisWeek(left,phase,seenRaw){
  const sold=phase.state==='active'?left.filter(x=>Number.isSafeInteger(x.run.soldAt)&&x.run.soldAt>=phase.first).sort((a,b)=>a.run.soldAt-b.run.soldAt||a.number-b.number):[];
  const key=x=>`${x.id}@${x.run.soldAt}`,seen=new Set(Array.isArray(seenRaw)?seenRaw.filter(k=>typeof k==='string'):[]);
  return {keys:sold.map(key),fresh:sold.filter(x=>!seen.has(key(x)))};
 }
 /** A sale run for Left: the run whose note my listing `listedAt` spent. */
 function saleRun(snap,id,records,listedAt,gaps,source){
  const own=R.ownership(records,{height:listedAt,listedAt,seller:true},lateMint(snap,id));
  return {listedAt,soldAt:own.sale.soldAt,weeks:runWeeks(own.notes,gaps),source};
 }
 /** A run that left privately (official wallet: held weeks …–through, then left), from my current run. */
 function privateRun(snap,id,records,meta,through){
  const own=attribution(snap,id,records,meta);if(own.state!=='held')return null;
  const notes=own.notes.map((n,i)=>i===own.notes.length-1?{...n,lastWeek:through}:n);
  return {listedAt:null,soldAt:null,weeks:runWeeks(notes,own.gaps),source:'wallet'};
 }
 return {KEY,MAX,META,LEFT,EVENTS,LEFT_SEEN,TEAM,normalize,mates,update,current,impact,rank,anchorOf,attribution,saleToConfirm,runWeeks,covers,leftOf,leftSave,soldThisWeek,saleRun,privateRun,weekList};
});
