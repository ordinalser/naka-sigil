'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const E=require('../src/lib/explore.js'),P=require('../src/lib/purchase.js'),R=require('../src/lib/rules.js');
const box={};vm.runInNewContext(fs.readFileSync(require.resolve('../src/data/snapshot.js'),'utf8'),box);
const snap=JSON.parse(JSON.stringify(box.SHNAKAS_SNAPSHOT)),model=P.create(snap),ids=Object.keys(snap.items);
test('Selection rejects corrupt data and unknown additions, allows removing a missing candidate',()=>{
 assert.deepEqual(E.normalize([null,'bad',ids[0],ids[0],...ids.slice(1,5)]),ids.slice(0,4));
 assert.equal(E.toggle([], 'f'.repeat(64)+'i0',snap).state,'missing');
 assert.deepEqual(E.toggle([ids[0]],ids[0],{items:{}}).ids,[]);
 assert.equal(E.toggle(ids.slice(0,4),ids[4],snap).state,'full');
 assert.deepEqual(E.toggle(ids.slice(0,4),ids[1],snap).ids,[ids[0],ids[2],ids[3]]);
});
test('Conservative minimum excludes uncertain upper-end matches and unavailable sale scenarios',()=>{
 const range={sale:{state:'ready'},result:{lo:{weight:250},hi:{weight:350}}};
 assert.equal(E.matches(range,250),true);assert.equal(E.matches(range,300),false);
 for(const minimum of [NaN,Infinity,-1])assert.equal(E.matches(range,minimum),false);
 for(const state of ['unlisted','no-floor','unavailable'])assert.equal(E.matches({sale:{state}},150),false);
 assert.equal(E.matches(null,0),true);
});
test('Every listed candidate equals the shared sale engine and meets the selected minimum',()=>{
 const original=JSON.stringify(snap);
 for(const minimum of [0,150,200,250,300,350,400]){const entries=E.candidates(snap,model,minimum);for(let i=1;i<entries.length;i++)assert.ok(entries[i-1].sale.price<=entries[i].sale.price,'Buy candidates show lowest asks first');}assert.equal(E.candidates(snap,model)[0].sale.price,snap.snapshot.collectionFloor);
 for(const minimum of [0,150,200,250,300,350,400])for(const e of E.candidates(snap,model,minimum)){
  assert.equal(e.listing,'listed');assert.deepEqual(e.before,R.evaluateSnapshot(snap,e.id));
  if(e.sale.state==='ready'){assert.deepEqual(e.result,model.get(e.id).result);if(minimum)assert.ok(e.result.lo.weight>=minimum);}
 }
 assert.equal(JSON.stringify(snap),original);
});
test('Comparison scenarios remain independent, including reverse evaluation order',()=>{
 const chosen=E.examples(snap,model);assert.equal(chosen.length,4);
 const expected=chosen.map(id=>E.entry(snap,P.create(snap),id));
 const shared=P.create(snap);chosen.slice().reverse().forEach(id=>shared.get(id));
 assert.deepEqual(chosen.map(id=>E.entry(snap,shared,id)),expected);
 assert.equal(new Set(expected.map(e=>e.result.lo.weight)).size,4);
 const held=ids.find(id=>!snap.offers.some(o=>o[0]===id));assert.equal(E.entry(snap,model,held).listing,'unlisted');assert.deepEqual(E.entry(snap,model,held).result,R.evaluateSnapshot(snap,held));
});

test('Removing the final listing leaves no after-sale total, never a borrowed before-sale value',()=>{
 const one={...snap,offers:[snap.offers[0]]},e=E.entry(one,P.create(one),snap.offers[0][0]);
 assert.equal(e.sale.state,'no-floor');assert.equal(e.result,null);assert.equal(E.matches(e,100),false);assert.equal(e.listing,'listed');assert.ok(e.before.lo.weight>=100);
});

test('Ladder lists the lowest ask for each strictly higher conservative after-sale weight',()=>{
 const ladder=E.ladder(snap,model),ready=E.candidates(snap,model).filter(e=>e.sale.state==='ready');
 assert.ok(ladder.length>1);
 for(let i=1;i<ladder.length;i++){assert.ok(ladder[i-1].sale.price<=ladder[i].sale.price);assert.ok(ladder[i-1].result.lo.weight<ladder[i].result.lo.weight);}
 for(const e of ladder){
  assert.equal(e.listing,'listed');assert.deepEqual(e.result,model.get(e.id).result);
  const order=x=>x.sale.price-e.sale.price||x.number-e.number;
  assert.ok(ready.filter(x=>order(x)<0).every(x=>x.result.lo.weight<e.result.lo.weight),'No earlier ask reaches this weight');
 }
 for(const x of ready)assert.ok(ladder.some(e=>e.sale.price<=x.sale.price&&e.result.lo.weight>=x.result.lo.weight),'Every listing is matched or beaten by a ladder step');
});
test('Ladder is empty without individual listings or without a post-sale floor',()=>{
 const legacy={...snap};delete legacy.offers;
 assert.deepEqual(E.ladder(legacy,P.create(legacy)),[]);
 const one={...snap,offers:[snap.offers[0]]};assert.deepEqual(E.ladder(one,P.create(one)),[]);
 const none={...snap,offers:[]};assert.deepEqual(E.ladder(none,P.create(none)),[]);
});

test('Comparison control: selected stays removable, a full selection explains itself, otherwise addable',()=>{
 const four=ids.slice(0,4);
 assert.equal(E.compareState(four,ids[0]),'selected');
 assert.equal(E.compareState(four,ids[4]),'full');
 assert.equal(E.compareState(four.slice(0,3),ids[4]),'add');
 assert.equal(E.compareState([],ids[0]),'add');
});
test('Comparison copy has identical English/Chinese keys and function arities',()=>{
 require('../src/lib/explore-ui.js');const en=globalThis.NakaExploreUI.pick('en'),zh=globalThis.NakaExploreUI.pick('zh');
 assert.deepEqual(Object.keys(en).sort(),Object.keys(zh).sort());
 for(const k of Object.keys(en)){assert.equal(typeof en[k],typeof zh[k],k);if(typeof en[k]==='function')assert.equal(en[k].length,zh[k].length,k);}
});
