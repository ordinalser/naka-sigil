/**
 * User-maintained local holdings and what a purchase or delisting does to them.
 * Weekly allocation follows the official preview split: the weekly pool is shared by every catalog piece's units,
 * so mine = my units ÷ all programme units × pool. Only holdings not listed at the block count: listed pieces earn
 * nothing. A new holding still waits for the next reward week; this is the weekly rate once it counts.
 */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./rules.js'):root.ShnakasRules,typeof module==='object'&&module.exports?require('./purchase.js'):root.NakaPurchase);if(typeof module==='object'&&module.exports)module.exports=api;else root.NakaPortfolio=api;})(typeof globalThis!=='undefined'?globalThis:this,function(R,P){
 'use strict';
 const KEY='nakaPortfolio',MAX=3333,ID=/^[0-9a-f]{64}i\d+$/;
 const normalize=raw=>Array.isArray(raw)?[...new Set(raw.filter(x=>typeof x==='string'&&ID.test(x)))].slice(0,MAX):[];
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
 function impact(snap,raw,id,action='sale',model=P.create(snap,{action})){
  const own=current(snap,raw),already=own.ids.includes(id);
  if((action==='sale'&&already)||(action==='cancel'&&!already))return {state:action==='sale'?'already-held':'not-held'};
  const scenario=model.get(id);if(scenario.state!=='ready')return {state:scenario.state};
  const rows=own.ids.map(other=>{const before=R.evaluateSnapshot(snap,other),after=scenario.evaluate(other);
   const same=JSON.stringify(before)===JSON.stringify(after)||before.exact&&after.exact&&before.lo.weight===after.lo.weight;
   return {id:other,before,after,delta:same?{lo:0,hi:0}:{lo:after.lo.weight-before.hi.weight,hi:after.hi.weight-before.lo.weight}};
  });
  const existing=sum(rows.map(x=>x.after)),delta=rows.reduce((d,x)=>({lo:d.lo+x.delta.lo,hi:d.hi+x.delta.hi}),{lo:0,hi:0});
  const added=action==='sale'?{lo:scenario.result.lo.weight,hi:scenario.result.hi.weight}:{lo:0,hi:0};
  // After the action the selected NFT is held and unlisted; other holdings keep their listing status.
  const listedAfter=new Set(own.ids.filter(other=>other!==id&&P.listingStatus(snap,other)==='listed'));
  const others=earning(snap,own.ids.filter(other=>other!==id),other=>scenario.evaluate(other),other=>!listedAfter.has(other)),piece=R.units(scenario.result);
  const all=scenario.programmeUnits(),before=own.allocation,after=allocationOf(addUnits(others,piece),all);
  // Split the new weekly total: the bought (or delisted) piece itself, and every other holding together.
  const pieceWeekly=R.weeklyAllocation(piece,all),othersAfter=R.weeklyAllocation(others,all);
  const allocation={before,after,delta:{lo:after.weekly.lo-before.weekly.hi,hi:after.weekly.hi-before.weekly.lo},
   piece:pieceWeekly,others:{after:othersAfter,delta:{lo:othersAfter.lo-before.weekly.hi,hi:othersAfter.hi-before.weekly.lo}}};
  return {state:'ready',action,before:own.total,existing,delta,added,after:{lo:existing.lo+added.lo,hi:existing.hi+added.hi},net:{lo:delta.lo+added.lo,hi:delta.hi+added.hi},allocation,rows,scenario,missing:own.missing};
 }
 /** Listings ranked by how much buying each raises my weekly allocation (conservative lower bound), then by ask. */
 function rank(snap,raw){const model=P.create(snap);return (snap.offers??[]).map(([id,price])=>({id,price,impact:impact(snap,raw,id,'sale',model)})).filter(x=>x.impact.state==='ready').sort((a,b)=>b.impact.allocation.delta.lo-a.impact.allocation.delta.lo||a.price-b.price);}
 return {KEY,MAX,normalize,update,current,impact,rank};
});
