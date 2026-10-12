/** Offline candidate selection and conservative after-sale filtering. No API or DOM. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./rules.js'):root.ShnakasRules,typeof module==='object'&&module.exports?require('./purchase.js'):root.NakaPurchase);if(typeof module==='object'&&module.exports)module.exports=api;else root.NakaExplore=api;})(typeof globalThis!=='undefined'?globalThis:this,function(R,P){
  'use strict';
  const KEY='nakaComparison',MAX=4,ID=/^[0-9a-f]{64}i\d+$/;
  function normalize(raw){return Array.isArray(raw)?[...new Set(raw.filter(id=>typeof id==='string'&&ID.test(id)))].slice(0,MAX):[];}
  // Control state for one NFT: already selected, blocked by a full selection, or addable.
  function compareState(ids,id){return ids.includes(id)?'selected':ids.length>=MAX?'full':'add';}
  function toggle(raw,id,snap){const ids=normalize(raw);if(ids.includes(id))return {ids:ids.filter(x=>x!==id),state:'removed'};if(typeof id!=='string'||!ID.test(id)||!Object.hasOwn(snap.items,id))return {ids,state:'missing'};if(ids.length===MAX)return {ids,state:'full'};return {ids:[...ids,id],state:'added'};}
  function entry(snap,model,id){if(!Object.hasOwn(snap.items,id))return null;const before=R.evaluateSnapshot(snap,id),sale=model.get(id);return {id,number:before.number.value,listing:P.listingStatus(snap,id),before,sale,result:sale.state==='ready'?sale.result:sale.state==='no-floor'?null:before};}
  function matches(e,minimum){return minimum===0||Number.isFinite(minimum)&&minimum>0&&Boolean(e&&e.sale.state==='ready'&&e.result.lo.weight>=minimum);}
  function candidates(snap,model,minimum=0){return (snap.offers??[]).map(([id])=>entry(snap,model,id)).filter(e=>e&&matches(e,minimum)).sort((a,b)=>a.sale.price-b.sale.price||a.number-b.number);}
  function examples(snap,model){const all=candidates(snap,model).filter(e=>e.sale.state==='ready'&&e.result.exact&&e.before.exact);all.sort((a,b)=>(b.result.lo.weight-b.before.lo.weight)-(a.result.lo.weight-a.before.lo.weight)||a.number-b.number);const out=[];for(const e of all){if(!out.some(x=>x.result.lo.weight===e.result.lo.weight)){out.push(e);if(out.length===MAX)break;}}return out.map(e=>e.id);}
  // Lowest ask for each reachable after-sale weight: walking asks upward, keep a listing only when its
  // conservative (lower-bound) after-sale weight beats every cheaper listing. Equal asks keep the lower number.
  function ladder(snap,model){
    const out=[];let best=0;
    for(const e of candidates(snap,model)){if(e.sale.state==='ready'&&e.result.lo.weight>best){best=e.result.lo.weight;out.push(e);}}
    return out;
  }
  return {KEY,MAX,normalize,compareState,toggle,entry,matches,candidates,examples,ladder};
});
