'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const {parseNumber,query}=require('../src/lib/lookup.js');
const R=require('../src/lib/rules.js');
const s={};vm.runInNewContext(fs.readFileSync(require.resolve('../src/data/snapshot.js'),'utf8'),s);const snap=s.SHNAKAS_SNAPSHOT;
test('Lookup accepts zero, optional #, whitespace and leading zeroes; rejects unsafe or ambiguous values',()=>{
  for(const [raw,n] of [['0',0],['#0',0],[' # 379 ',379],['00379',379],['3332',3332]])assert.equal(parseNumber(raw),n);
  for(const raw of ['', ' ', '#', '-1', '+1', '1.5', '1e2', '0x10', '12abc', '<script>', '9007199254740992', null, 379])assert.equal(parseNumber(raw),null);
});
test('Any catalog number resolves by snapshot number, not title or array order',()=>{
  for(const n of [0,9,10,99,100,999,1000,3332]) {
    const entry=Object.entries(snap.items).find(([,r])=>r[0]===n);if(!entry)continue;
    const found=query(snap,String(n));assert.equal(found.state,'found');assert.equal(found.id,entry[0]);assert.equal(found.height,snap.snapshot.height);
    const traits=entry[1].slice(1).map(i=>{const [type,value,floor,listed]=snap.traits[i];const history=snap.saleHistory?.find(([idx])=>idx===i);return {type,value,floor,listed,supply:[...Object.values(snap.items),...(snap.pending??[])].filter(r=>r.slice(1).includes(i)).length,...(snap.saleHistory?{saleHistory:history?.[1]??[]}:{}),...(snap.rewardBasis?{officialPct:snap.rewardBasis.traits[i][1],officialSource:snap.rewardBasis.traits[i][2],supply:snap.rewardBasis.traits[i][3]}:{})};});
    assert.equal(R.formatWeight(found.result),R.formatWeight(R.evaluate({number:n,traits},snap.snapshot.collectionFloor)));
  }
});
test('Missing is snapshot absence; invalid does not coerce into number zero',()=>{
  assert.equal(query(snap,'999999').state,'missing');assert.equal(query(snap,'').state,'invalid');assert.equal(query(snap,'#0').state,'found');
});
test('Lookup exposes listed/unlisted at the selected block, with an explicit unknown for legacy snapshots',()=>{
  const offers=new Set(snap.offers.map(([id])=>id));
  for(const [id,[number]]of Object.entries(snap.items))assert.equal(query(snap,String(number)).listing,offers.has(id)?'listed':'unlisted');
  const [listed]=snap.offers[0],number=snap.items[listed][0];
  assert.equal(query({...snap,offers:undefined},String(number)).listing,'unknown');
  const before=query(snap,String(number));
  const after=query({...snap,offers:snap.offers.filter(([id])=>id!==listed)},String(number));
  assert.equal(after.listing,'unlisted');
  assert.equal(R.formatWeight(before.result),R.formatWeight(after.result),'listing status is separate from holding formula');
});
test('Lookup recomputes against selected block/floors, preserving unknown ranges and cap',()=>{
  // Every listing at the collection floor (trait floors follow), no official basis and no sale history at this block.
  const cloned=JSON.parse(JSON.stringify(snap));cloned.snapshot.height=985000;cloned.snapshot.blockTime=null;delete cloned.rewardBasis;delete cloned.saleHistory;cloned.snapshot.indexerHeight=985000;for(const o of cloned.offers)o[1]=cloned.snapshot.collectionFloor;for(const t of cloned.traits)if(t[2]!==null)t[2]=cloned.snapshot.collectionFloor;
  assert.equal(require('../src/lib/source.js').isSnapshot(cloned),true);
  const result=query(cloned,'#0');assert.equal(result.height,985000);
  assert.notEqual(result.result.lo.weight,query(snap,'#0').result.lo.weight);
  for(const [id,row]of Object.entries(cloned.items)){
    const found=query(cloned,String(row[0]));if(found.result.unmeasured){assert.ok(found.result.lo.weight<=found.result.hi.weight);return;}
  }
  assert.fail('Expected unmeasured trait fixture');
});
