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
  // Listing status is not a rule input: the same piece listed or not has the same holding formula.
  assert.deepEqual(R.evaluateSnapshot({...s,offers:s.offers.slice(1)},id(0)),R.evaluateSnapshot(s,id(0)),'listing state must not zero or change the holding formula');
});
function fixture(prices, indexes=[[0],[0],[1]],numbers=[1000,1001,1002]) {
  const traits=[['Hair','Red'],['Hair','Blue']].map(([type,value],idx)=>{const ps=prices.filter((p,i)=>indexes[i].includes(idx));return [type,value,ps.length?Math.min(...ps):null,ps.length];});
  return {snapshot:{height:100,collectionFloor:Math.min(...prices)},traits,items:Object.fromEntries(indexes.map((idx,i)=>[id(i),[numbers[i],...idx]])),offers:prices.map((p,i)=>[id(i),p])};
}
test('A prior simulated purchase stays out of the next listing and can change its after-sale weight',()=>{
  const s=fixture([100,150,125]);
  const alone=P.create(s).get(id(0));
  const next=P.create(s,{priorSales:[id(1)]}).get(id(0));
  assert.equal(P.create(s,{priorSales:[]}).get(id(0)).result.lo.weight,alone.result.lo.weight);
  assert.equal(next.afterFloor,125);
  assert.equal(next.remaining,1);
  assert.equal(alone.result.hi.weight,100);
  assert.equal(next.result.hi.weight,200);
  assert.equal(next.result.traits[0].floor,null);
  assert.equal(JSON.stringify(s),JSON.stringify(fixture([100,150,125])));
  assert.throws(()=>P.create(s,{priorSales:[1]}));
});
test('Removing the unique collection floor recalculates both floors before applying exact weight tiers',()=>{
  const s=fixture([100,150,125]);const before=JSON.stringify(s);
  const x=P.create(s).get(id(0));
  assert.equal(x.state,'ready');assert.equal(x.beforeFloor,100);assert.equal(x.afterFloor,125);
  assert.equal(x.result.traits[0].floor,150);assert.equal(x.result.lo.weight,100); // 150/125=1.2, not old 1.5
  assert.equal(x.result.hi.weight,100);assert.equal(x.premium,'0.0%');assert.equal(JSON.stringify(s),before);
});
test('Trait floor can rise after sale; one simulated sale cannot determine the three-sale aggregation',()=>{
  const s=fixture([150,200,100]);let x=P.create(s).get(id(0));
  assert.equal(x.afterFloor,100);assert.equal(x.result.traits[0].floor,200);assert.equal(x.result.lo.weight,175);
  x=P.create(s).get(id(2));assert.equal(x.afterFloor,150);assert.equal(x.result.traits[0].floor,null);
  assert.equal(x.result.lo.weight,100);assert.equal(x.result.hi.weight,200);assert.equal(x.result.unmeasured,1);assert.equal(x.result.traits[0].method,'missing-sale');
});
test('Tied collection/trait floors retain the remaining listing and include exact equality thresholds',()=>{
  const s=fixture([125,125,100]);const x=P.create(s).get(id(0));
  assert.equal(x.afterFloor,100);assert.equal(x.result.traits[0].listed,1);assert.equal(x.result.lo.weight,125);
  const tied=fixture([100,100,200]);assert.equal(P.create(tied).get(id(0)).afterFloor,100);
});
test('Unknown traits retain cap and highest-only number bonus; unavailable/unlisted/no-floor are distinct',()=>{
  const s=fixture([100,200],[[0,1],[0]],[0,1000]);const x=P.create(s).get(id(0));
  assert.equal(x.result.lo.weight,300);assert.equal(x.result.hi.weight,400);assert.equal(x.result.number.pct,200);
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
    const traits=indexes.map(idx=>{const [type,value]=s.traits[idx],prices=remaining.filter(([other])=>s.items[other].slice(1).includes(idx)).map(([,p])=>p);return {type,value,floor:prices.length?Math.min(...prices):null,listed:prices.length,supply:[...Object.values(s.items),...(s.pending??[])].filter(row=>row.slice(1).includes(idx)).length,saleHistory:s.saleHistory.find(([i])=>i===idx)?.[1]??[],pendingSale:price};});
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


test('Relay credits preserve known zero, never infer an unlisted balance or count as weight',()=>{
  const s=fixture([100,200]);s.credits=[[id(0),0],[id(1),3]];
  assert.equal(P.relayCredits(s,id(0)),0);assert.equal(P.create(s).get(id(1)).credits,3);
  assert.equal(P.relayCredits(s,id(2)),null);assert.equal(P.relayCredits({...s,credits:undefined},id(0)),null);
  assert.equal(R.formatWeight(P.create(s).get(id(1)).result),R.formatWeight(P.create({...s,credits:undefined}).get(id(1)).result));
});


test('Cancellation removes only an owned listing without inventing a sale or reusing rare official units',()=>{
  const s=fixture([100,200],[[0],[1],...Array.from({length:19},()=>[0])]);
  const cancel=P.create(s,{action:'cancel'}),sale=P.create(s),a=cancel.get(id(0)),b=sale.get(id(0));
  assert.equal(a.action,'cancel');assert.equal(b.action,'sale');
  assert.equal(a.before.lo.weight,100);assert.equal(a.result.lo.weight,200);
  assert.equal(a.afterFloor,200);assert.equal(a.result.traits[0].method,'held');
  assert.equal(a.result.traits[0].pendingSale,undefined,'delisting is not a trade');
  assert.equal(b.result.traits[0].pendingSale,100);
  assert.equal(cancel.get(id(0)),a);assert.notEqual(a,b,'distinct action caches');
  const rare=fixture([100,200],[[0],[1]]);rare.rewardBasis={height:100,traits:[[0,0,'ask',1],[1,0,'ask',1]]};
  const r=P.create(rare,{action:'cancel'}).get(id(0));assert.equal(r.result.exact,false);assert.equal(r.result.traits[0].officialPct,undefined);assert.equal(r.result.traits[0].pendingSale,undefined);
  assert.equal(P.create(fixture([100],[[0]]),{action:'cancel'}).get(id(0)).state,'no-floor');
  assert.throws(()=>P.create(s,{action:'unknown'}));
});

test('Delisting a rare final ask without sales cannot invent a zero in place of a carry-forward bonus',()=>{
 const s=fixture([150,100],[[0],[1],[0]],[1000,1001,1002]);s.saleHistory=[];
 const out=P.create(s,{action:'cancel'}).get(id(0));assert.equal(out.state,'ready');assert.equal(out.before.lo.weight,150);assert.equal(out.result.traits[0].method,'carry-unverified');assert.equal(out.result.exact,false);assert.equal(out.result.lo.weight,100);assert.equal(out.result.hi.weight,200);
});

test('Other closing listings leave the single-listing world at the next block: floors, sales and K as planner.scenario',()=>{
  const PL=require('../src/lib/planner.js'),scored=r=>({weight:R.formatWeight(r),traits:r.traits.map(t=>[t.method,t.measured?t.pct:[t.pctLo,t.pctHi]])});
  // The floor listing (id 0 @100) is being bought: buying id 2 @125 leaves only id 1 @150, so the after-sale floor is 150.
  const s=fixture([100,150,125]);s.closing=[[id(0),'sale']];
  const x=P.create(s).get(id(2));
  assert.equal(x.state,'ready');assert.equal(x.remaining,1);assert.equal(x.afterFloor,150);assert.equal(x.beforeFloor,100);
  const sc=PL.scenario(s,{remove:[[id(2),'sale'],[id(0),'sale']]});
  assert.equal(sc.floor,x.afterFloor);assert.deepEqual(x.programmeUnits(),sc.programmeUnits());assert.deepEqual(x.unitChange(),sc.unitChange());
  for(const other of Object.keys(s.items))assert.deepEqual(scored(x.evaluate(other)),scored(sc.evaluate(other)),other);
  assert.equal(P.create(fixture([100,150,125])).get(id(2)).afterFloor,100,'without closing rows the world is this block minus the operated listing');
  // The only other listing is closing: nothing is left to score.
  const two=fixture([100,150]);two.closing=[[id(1),'cancel']];assert.equal(P.create(two).get(id(0)).state,'no-floor');
  // A closing listing bought is a sale of its traits at the next block (the operated purchase stays the hypothetical newest
  // sale); one being reclaimed is no trade and leaves a bonus-tier trait's carry unverified, as planner.scenario scores both.
  const sold=fixture([100,150,200],[[1],[0],[1]]);sold.saleHistory=[[0,[]],[1,[]]];sold.closing=[[id(1),'sale']];
  const a=P.create(sold).get(id(2)),at=PL.scenario(sold,{remove:[[id(2),'sale'],[id(1),'sale']]});
  const red=a.evaluate(id(1)).traits[0]; // the trait of the closing listing, no listing left: scored on that sale
  assert.equal(red.method,'sales-median');assert.equal(red.pct,50);assert.deepEqual(red.saleHistory,[[150,101]]);assert.equal(red.pendingSale,undefined);
  assert.equal(a.result.traits[0].method,'floor');assert.equal(a.result.traits[0].pendingSale,200,'the operated purchase stays the hypothetical newest sale of its own trait');
  for(const other of [id(0),id(1),id(2)])assert.deepEqual(scored(a.evaluate(other)),scored(at.evaluate(other)),other);
  const reclaimed={...sold,closing:[[id(1),'cancel']]};
  const b=P.create(reclaimed).get(id(2)),bt=PL.scenario(reclaimed,{remove:[[id(2),'sale'],[id(1),'cancel']]});
  const reclaimedRed=b.evaluate(id(1)).traits[0];assert.equal(reclaimedRed.method,'carry-unverified');assert.deepEqual(reclaimedRed.saleHistory,[]);for(const other of [id(0),id(1),id(2)])assert.deepEqual(scored(b.evaluate(other)),scored(bt.evaluate(other)),other);
  // A trait losing a reclaimed listing and a bought one at once is scored on that sale, not carried.
  const both=fixture([100,150,160,120],[[1],[0],[0],[1]],[1000,1001,1002,1003]);both.saleHistory=[[0,[]],[1,[]]];both.closing=[[id(1),'cancel'],[id(2),'sale']];
  const o=P.create(both).get(id(0)),ot=PL.scenario(both,{remove:[[id(0),'sale']]});
  assert.equal(o.afterFloor,120);const bothRed=o.evaluate(id(1)).traits[0];assert.equal(bothRed.method,'sales-median');assert.equal(bothRed.pct,25);assert.deepEqual(bothRed.saleHistory,[[160,101]]);
  for(const other of Object.keys(both.items))assert.deepEqual(scored(o.evaluate(other)),scored(ot.evaluate(other)),other);
});

test('Trait text: unmeasured bounds as the rules engine sets them; the sales basis ratio is exact, not the rounded basis price',()=>{
  const T=require('../src/lib/i18n.js').pick('en');
  assert.equal(P.traitPct({measured:true,pct:25}),'+25%');
  assert.equal(P.traitPct({measured:false,method:'missing-sale',pctLo:0,pctHi:100}),'+0–100%');
  const tied=R.recentSalesTier([[130000,500],[100000,500],[90000,500],[140000,500]],undefined,100000);
  assert.equal(tied.method,'sales-ambiguous');assert.equal(P.traitPct(tied),'+0–25%');
  // Two sales 125002 and 125001 against a floor of 100001: their mean 125001.5 meets 1.25×, the rounded basis price does not.
  const mean=R.recentSalesTier([[125002,9],[125001,8]],undefined,100001);
  assert.equal(mean.pct,25);assert.equal(R.formatRatio(mean.basisPrice,100001),'1.24×');
  assert.equal(P.traitRatio({...mean,supply:5},100001,T),`${T.salesMedianShort} 1.25×`);
  assert.equal(P.traitRatio({method:'floor',floor:150,measured:true,pct:50},100,T),'1.50×');
  assert.equal(P.traitRatio({method:'held',supply:21,measured:true,pct:100},100,T),T.heldTrait(21));
  assert.equal(P.traitRatio({method:'sales-ambiguous',measured:false},100,T),T.salesTied);
  assert.throws(()=>P.traitRatio({method:'unknown-method'},100,T),/Unknown trait method/);
});

test('Sequential previews reject phantom purchases and cannot reclaim a listing already selling',()=>{
 const fs=require('node:fs'),vm=require('node:vm'),sandbox={};vm.runInNewContext(fs.readFileSync(require.resolve('../src/data/snapshot.js'),'utf8'),sandbox);const s=sandbox.SHNAKAS_SNAPSHOT,id=s.offers[0][0];assert.throws(()=>P.create(s,{priorSales:['unknown']}),/active listing/);const selling={...s,closing:[[id,'sale']]};assert.equal(P.create(selling,{action:'cancel'}).get(id).state,'closing');
});
