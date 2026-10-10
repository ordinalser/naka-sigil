'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const P=require('../src/lib/purchase.js'),R=require('../src/lib/rules.js');
const id=n=>String(n).padStart(64,'0')+'i0';
test('Listing status is an exact selected-block fact, never inferred from weight or missing offers',()=>{
  const s=fixture([100,200]);
  assert.equal(P.listingStatus(s,id(0)),'listed');
  assert.equal(P.listingStatus(s,id(2)),'unlisted');
  assert.equal(P.listingStatus({...s,offers:undefined},id(2)),'unknown');
  assert.equal(P.listingStatus(s,'missing'),'unknown');
  assert.equal(P.listingStatus(s,'toString'),'unknown');
  assert.equal(P.listingStatus({...s,offers:s.offers.slice(1)},id(0)),'unlisted');
  assert.equal(P.listingStatus(fixture([100],[[0]],[0]),id(0)),'listed','last listing is still listed when sale weight is unavailable');
  const listed=R.evaluate({number:1000,traits:[]},100);
  assert.equal(listed.lo.weight,100,'listing state must not zero or change the holding formula');
});
function fixture(prices, indexes=[[0],[0],[1]],numbers=[1000,1001,1002]) {
  const traits=[['Hair','Red'],['Hair','Blue']].map(([type,value],idx)=>{const ps=prices.filter((p,i)=>indexes[i].includes(idx));return [type,value,ps.length?Math.min(...ps):null,ps.length];});
  return {snapshot:{height:100,collectionFloor:Math.min(...prices)},traits,items:Object.fromEntries(indexes.map((idx,i)=>[id(i),[numbers[i],...idx]])),offers:prices.map((p,i)=>[id(i),p])};
}
test('Removing the unique collection floor recalculates both floors before applying exact weight tiers',()=>{
  const s=fixture([100,150,125]);const before=JSON.stringify(s);
  const x=P.create(s).get(id(0));
  assert.equal(x.state,'ready');assert.equal(x.beforeFloor,100);assert.equal(x.afterFloor,125);
  assert.equal(x.result.traits[0].floor,150);assert.equal(x.result.lo.weight,100); // 150/125=1.2, not old 1.5
  assert.equal(x.result.hi.weight,100);assert.equal(x.premium,'0.0%');assert.equal(JSON.stringify(s),before);
});
test('Trait floor can rise after sale; rare zero-listed traits use the simulated sale price',()=>{
  const s=fixture([150,200,100]);let x=P.create(s).get(id(0));
  assert.equal(x.afterFloor,100);assert.equal(x.result.traits[0].floor,200);assert.equal(x.result.lo.weight,175);
  x=P.create(s).get(id(2));assert.equal(x.afterFloor,150);assert.equal(x.result.traits[0].floor,null);
  assert.equal(x.result.lo.weight,100);assert.equal(x.result.hi.weight,100);assert.equal(x.result.unmeasured,0);assert.equal(x.result.traits[0].method,'last-sale');
});
test('Tied collection/trait floors retain the remaining listing and include exact equality thresholds',()=>{
  const s=fixture([125,125,100]);const x=P.create(s).get(id(0));
  assert.equal(x.afterFloor,100);assert.equal(x.result.traits[0].listed,1);assert.equal(x.result.lo.weight,125);
  const tied=fixture([100,100,200]);assert.equal(P.create(tied).get(id(0)).afterFloor,100);
});
test('Unknown traits retain cap and highest-only number bonus; unavailable/unlisted/no-floor are distinct',()=>{
  const s=fixture([100,200],[[0,1],[0]],[0,1000]);const x=P.create(s).get(id(0));
  assert.equal(x.result.lo.weight,300);assert.equal(x.result.hi.weight,300);assert.equal(x.result.number.pct,200);
  assert.equal(P.create({...s,offers:undefined}).get(id(0)).state,'unavailable');
  assert.equal(P.create(s).get('missing').state,'unlisted');
  assert.equal(P.create(fixture([100],[[0]],[0])).get(id(0)).state,'no-floor');
});
test('Snapshot premium uses integer arithmetic; scenario compares holding totals without treating 100% as a step',()=>{
  assert.equal(P.premium(150,100),'50.0%');assert.equal(P.premium(100,100),'0.0%');
  assert.equal(P.premium(Number.MAX_SAFE_INTEGER,Number.MAX_SAFE_INTEGER),'0.0%');
  const x=P.create(fixture([150,200,100])).get(id(0));
  assert.equal(x.before.lo.weight,150);assert.equal(x.result.lo.weight,175);
  assert.equal(x.result.lo.weight-x.before.lo.weight,25);
});
test('Sale of the last common-trait listing gets official +100%; supply counts include unlisted catalog items',()=>{
  const s=fixture([100,200],[[0],[1]],[1000,1001]);
  for(let i=2;i<21;i++)s.items[id(i)]=[1000+i,0];
  const x=P.create(s).get(id(0));
  assert.equal(x.result.traits[0].supply,20);assert.equal(x.result.traits[0].method,'held');assert.equal(x.result.lo.weight,200);assert.equal(x.result.exact,true);
});
test('All bundled purchase scenarios match independently rebuilt remaining-listing floors',()=>{
  const fs=require('node:fs'),vm=require('node:vm'),sb={};vm.runInNewContext(fs.readFileSync(require.resolve('../src/data/snapshot.js'),'utf8'),sb);const s=sb.SHNAKAS_SNAPSHOT,model=P.create(s);
  for(const [id,price]of s.offers) {
    const remaining=s.offers.filter(([other])=>other!==id),floor=Math.min(...remaining.map(([,p])=>p));
    const [number,...indexes]=s.items[id];
    const traits=indexes.map(idx=>{const [type,value]=s.traits[idx],prices=remaining.filter(([other])=>s.items[other].slice(1).includes(idx)).map(([,p])=>p);return {type,value,floor:prices.length?Math.min(...prices):null,listed:prices.length,supply:Object.values(s.items).filter(row=>row.slice(1).includes(idx)).length,lastSale:price};});
    const expected=R.evaluate({number,traits},floor),actual=model.get(id);
    assert.equal(actual.price,price);assert.equal(actual.afterFloor,floor);assert.equal(R.formatWeight(actual.result),R.formatWeight(expected));
    assert.equal(model.get(id),actual,'cache is tied to one snapshot model');
  }
});

test('Trait changes distinguish bonus direction, lost floors and market changes below a tier boundary',()=>{
  const a={measured:true,pct:0,floor:100,listed:2};
  assert.equal(P.traitChange(a,{...a,pct:25,floor:125},100,100),'up');
  assert.equal(P.traitChange({...a,pct:25},{...a,pct:0},100,100),'down');
  assert.equal(P.traitChange(a,{...a,measured:false,floor:null,listed:0},100,100),'unknown');
  assert.equal(P.traitChange(a,{...a,listed:1},100,100),null);
  assert.equal(P.traitChange(a,{...a},100,101),'market');
  assert.equal(P.traitChange(a,{...a},100,100),null);
  const huge=Number.MAX_SAFE_INTEGER;
  assert.equal(P.traitChange({...a,floor:huge},{...a,floor:huge},huge,huge-1),'market','ratio changes use exact integers');
});
test('Number chips show only the highest qualifying tier, including zero and strict upper boundaries',()=>{
  for(const [number,label]of [[0,'Sub10'],[9,'Sub10'],[10,'Sub100'],[99,'Sub100'],[100,'Sub1K'],[999,'Sub1K']])assert.equal(P.numberTag(number).label,label);
  assert.equal(P.numberTag(1000),null);
});
