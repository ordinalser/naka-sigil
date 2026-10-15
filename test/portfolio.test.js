'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),H=require('../src/lib/portfolio.js'),P=require('../src/lib/purchase.js'),R=require('../src/lib/rules.js');
const id=n=>String(n).padStart(64,'0')+'i0';
const fixture=()=>({snapshot:{height:100,collectionFloor:100},traits:[['Body','Red',100,2],['Body','Blue',125,1]],items:{[id(1)]:[1001,0],[id(2)]:[1002,0],[id(3)]:[1003,1],[id(4)]:[1004,0],[id(5)]:[1005,1]},offers:[[id(1),100],[id(2),150],[id(3),125]]});
test('Portfolio removal recomputes every holding with the same denominator, including losses',()=>{
 const s=fixture(),original=JSON.stringify(s),x=H.impact(s,[id(4),id(5)],id(1));
 assert.equal(x.state,'ready');assert.deepEqual(x.before,{lo:225,hi:225});assert.deepEqual(x.delta,{lo:-25,hi:-25});assert.deepEqual(x.added,{lo:100,hi:100});assert.deepEqual(x.after,{lo:300,hi:300});assert.deepEqual(x.net,{lo:75,hi:75});assert.equal(JSON.stringify(s),original);
});
test('A shared trait gains for existing holdings; selected NFT is counted once after sale',()=>{
 const s=fixture();s.offers[0][1]=125;s.snapshot.collectionFloor=125;s.traits[0][2]=125;s.offers[1][1]=250;
 const x=H.impact(s,[id(4)],id(1));assert.deepEqual(x.delta,{lo:75,hi:75});assert.deepEqual(x.added,{lo:175,hi:175});assert.deepEqual(x.after,{lo:350,hi:350});
 assert.equal(H.impact(s,[id(1)],id(1)).state,'already-held');assert.equal(H.rank(s,[id(1)]).some(x=>x.id===id(1)),false);
});
test('Cancellation affects a held NFT without buying or duplicating it',()=>{
 const s=fixture(),x=H.impact(s,[id(1),id(4)],id(1),'cancel');assert.equal(x.state,'ready');assert.deepEqual(x.added,{lo:0,hi:0});assert.deepEqual(x.after,{lo:200,hi:200});assert.equal(x.rows.length,2);
 assert.equal(H.impact(s,[id(4)],id(1),'cancel').state,'not-held');
});
test('Unchanged rare official units survive a scenario; affected rare traits retain uncertainty',()=>{
 const s=fixture();s.traits.push(['Eyes','Rare',null,0]);s.items[id(4)].push(2);s.rewardBasis={height:100,traits:[]};
 // Use a large canonical supply for the removed trait; rare unrelated official basis is validated in snapshot tests.
 const x=P.create(s).get(id(1));assert.equal(x.state,'ready');assert.equal(typeof x.evaluate,'function');assert.equal(x.evaluate('unknown'),null);
 assert.equal(x.evaluate(id(4)).unmeasured,1);assert.equal(x.evaluate(id(4)).hi.weight-x.evaluate(id(4)).lo.weight,100);
});
test('Formula totals retain per-NFT caps and listed weights without claiming eligibility',()=>{
 const s=fixture();s.items[id(4)][0]=1;s.items[id(5)][0]=2;
 assert.deepEqual(H.current(s,[id(4),id(5),id(4)]).total,{lo:625,hi:625});assert.equal(H.current(s,[id(1)]).listed,1);assert.equal(H.current(s,[id(1)]).total.lo,100);
 assert.equal(H.current(s,[id(99)]).missing,1);
});
test('Local holdings accept only known IDs on addition, support explicit removal, and normalize duplicates',()=>{
 const s=fixture();assert.deepEqual(H.update([], [id(4),id(4),'bad',id(99)],s),[id(4)]);assert.deepEqual(H.update([id(4)], [id(4)],s,true),[]);assert.deepEqual(H.normalize(null),[]);
});
test('No collection floor after removal is unavailable, never a zero-weight purchase',()=>{
 const s=fixture();s.offers=s.offers.slice(0,1);assert.equal(H.impact(s,[id(4)],id(1)).state,'no-floor');
});

test('Unrelated rare sales bonuses retain same-block official units only with an unchanged denominator',()=>{
 const s=fixture();s.offers[0][1]=125;s.snapshot.collectionFloor=125;s.traits[0][2]=125;s.traits.push(['Eyes','Rare',null,0]);s.items[id(4)].push(2);s.rewardBasis={height:100,traits:[[2,75,'sales',1]]};
 const result=P.create(s).get(id(1)).evaluate(id(4));assert.equal(result.exact,true);assert.equal(result.traits[1].pct,75);
 const changed=fixture();changed.traits.push(['Eyes','Rare',null,0]);changed.items[id(4)].push(2);changed.rewardBasis={height:100,traits:[[2,75,'sales',1]]};
 assert.equal(P.create(changed).get(id(1)).evaluate(id(4)).traits[1].measured,false,'A changed denominator cannot reuse an old sales tier');
});

test('A purchase or delisting splits into the piece itself and every other holding, adding up to the new total',()=>{
 const vm=require('node:vm'),fs=require('node:fs'),sb={};vm.runInNewContext(fs.readFileSync(require.resolve('../src/data/snapshot.js'),'utf8'),sb);
 const s=sb.SHNAKAS_SNAPSHOT,listed=s.offers.map(o=>o[0]),unlisted=Object.keys(s.items).filter(id=>!listed.includes(id)).slice(0,3);
 const close=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} vs ${b}`);
 for(const [raw,id,action] of [[unlisted,listed[0],'sale'],[[...unlisted,listed[1]],listed[1],'cancel']]){
  const x=H.impact(s,raw,id,action);assert.equal(x.state,'ready');const a=x.allocation;
  close(a.piece.lo+a.others.after.lo,a.after.weekly.lo);close(a.others.delta.lo+a.piece.lo,a.delta.lo);
  assert.ok(a.piece.lo>0,'the bought or delisted piece earns once held and unlisted');
 }
});
