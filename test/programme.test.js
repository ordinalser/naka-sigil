'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const R=require('../src/lib/rules.js'),P=require('../src/lib/purchase.js');
const sb={};vm.runInNewContext(fs.readFileSync(require.resolve('../src/data/snapshot.js'),'utf8'),sb);const snap=sb.SHNAKAS_SNAPSHOT;
// Official weights endpoint captured at the bundled block 971547: K (all catalog units) and v (base units per unit per block).
const OFFICIAL={height:971547,K:28881,v:915909};

test('Recent-sales median reproduces every official sales-sourced and zero-sale trait at the bundled block',()=>{
  const history=new Map(snap.saleHistory);let checked=0;
  for(const [idx,pct,source] of snap.rewardBasis.traits){
    if(!['sales','none'].includes(source))continue;checked++;
    const r=R.recentSalesTier(history.get(idx)??[],undefined,snap.snapshot.collectionFloor);
    assert.equal(r.measured,true,snap.traits[idx][1]);assert.equal(r.pct,pct,snap.traits[idx][1]);
  }
  assert.ok(checked>=80,'the bundled block carries the official rare-trait basis');
});
test('Recent-sales tier: median of three, mean of two, a single sale, no sales, a pending sale and same-block ambiguity',()=>{
  const F=100;
  assert.equal(R.recentSalesTier([[300,9],[100,8],[200,7]],undefined,F).pct,75,'median 200 = 2x');
  assert.equal(R.recentSalesTier([[300,9],[150,8]],undefined,F).pct,75,'two sales: mean 225 = 2.25x');
  assert.equal(R.recentSalesTier([[299,9],[300,8]],undefined,F).pct,75,'mean 299.5 stays below 3x: no rounding up');
  assert.equal(R.recentSalesTier([[125,9]],undefined,F).pct,25);
  assert.deepEqual(R.recentSalesTier([],undefined,F),{measured:true,pct:0,ratio:null,method:'no-sales',basisPrice:null});
  assert.equal(R.recentSalesTier([[100,9],[100,8],[100,7]],300,F).pct,0,'pending sale is newest; median of 300,100,100');
  assert.equal(R.recentSalesTier([[300,9],[100,8],[100,7]],300,F).pct,100,'only the two newest prior sales join a pending sale');
  const tied=R.recentSalesTier([[300,9],[100,8],[400,8],[110,8]],undefined,F);
  assert.equal(tied.measured,false);assert.equal(tied.method,'sales-ambiguous');assert.equal(tied.pctLo,0);assert.equal(tied.pctHi,100);
  assert.throws(()=>R.recentSalesTier([[0,9]],undefined,F));assert.throws(()=>R.recentSalesTier(null,undefined,F));
});
test('Programme units equal the official K, including not-yet-minted catalog pieces, and reproduce v',()=>{
  assert.equal(snap.snapshot.height,OFFICIAL.height);
  const K=R.programmeUnits(snap);assert.deepEqual(K,{lo:OFFICIAL.K,hi:OFFICIAL.K});
  assert.equal(Object.keys(snap.items).length+snap.pending.length,R.RULES.catalogPieces);
  assert.equal(R.unitRate(K.lo),OFFICIAL.v);
  // A 100% piece earns the official basePerBlock (4v) each block; a week is 1,008 blocks.
  const w=R.weeklyAllocation({lo:4,hi:4},K);assert.equal(w.lo,w.hi);assert.equal(w.lo,4*OFFICIAL.v*1008/1e8);
  // Official values at 971553: K 28947, v 913821; a 150% piece (6 units) has perBlock 5,482,926.
  assert.equal(R.unitRate(28947),913821);assert.equal(R.weeklyAllocation({lo:6,hi:6},{lo:28947,hi:28947}).lo,5482926*1008/1e8);
  assert.throws(()=>R.weeklyAllocation({lo:1,hi:1},{lo:0,hi:0}));assert.throws(()=>R.weeklyAllocation({lo:1.5,hi:1.5},K));
});
test('Scenario programme units match a full re-evaluation, with or without a collection-floor change',()=>{
  const model=P.create(snap),floorId=snap.offers.reduce((a,b)=>b[1]<a[1]?b:a)[0];
  const ids=[floorId,...snap.offers.filter(([id])=>id!==floorId).slice(0,12).map(([id])=>id)];
  for(const id of ids){
    const sc=model.get(id);if(sc.state!=='ready')continue;
    const full={lo:0,hi:0};
    for(const other of Object.keys(snap.items)){const u=R.units(sc.evaluate(other));full.lo+=u.lo;full.hi+=u.hi;}
    for(const row of snap.pending){const u=R.units(sc.evaluateRow(row));full.lo+=u.lo;full.hi+=u.hi;}
    assert.deepEqual(sc.programmeUnits(),full,id);
  }
});
