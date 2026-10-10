/** Offline Shielded-number lookup. Uses exactly the selected snapshot and shared rule engine. */
(function(root,factory) {
  const api=factory(typeof module==='object' && module.exports ? require('./rules.js') : root.ShnakasRules,
    typeof module==='object' && module.exports ? require('./purchase.js') : root.NakaPurchase);
  if (typeof module==='object' && module.exports) module.exports=api;
  else root.ShnakasLookup=api;
})(typeof globalThis!=='undefined' ? globalThis : this, function(R,P) {
  'use strict';
  function parseNumber(raw) {
    if (typeof raw!=='string') return null;
    const match=raw.trim().match(/^#?\s*(\d{1,16})$/);
    if (!match) return null;
    const n=Number(match[1]);
    return Number.isSafeInteger(n) && n>=0 ? n : null;
  }
  function query(snap,raw) {
    const number=parseNumber(raw), height=snap.snapshot.height;
    if (number===null) return {state:'invalid',height};
    const entry=Object.entries(snap.items).find(([,row])=>row[0]===number);
    if (!entry) return {state:'missing',number,height};
    const [id,[, ...indexes]]=entry;
    return {state:'found',number,height,id,listing:P.listingStatus(snap,id),result:R.evaluateSnapshot(snap,id)};
  }
  return {parseNumber,query};
});
