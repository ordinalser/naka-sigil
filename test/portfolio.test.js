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

test('Notes from public records match the official engine: purchase, reclaim, launch holders, listing weeks',()=>{
  const R=require('../src/lib/rules.js'),S=R.RULES.startBlock,W=R.RULES.weekBlocks;
  const weeks=n=>n.map(x=>[x.firstWeek,x.lastWeek]);
  assert.deepEqual(weeks(R.notesOf([])),[[0,null]],'minted before the start: from week 1 (index 0)');
  assert.deepEqual(weeks(R.notesOf([[1001,S+10,S+19,'sale']])),[[0,-1],[1,null]],'listed in week 1: the seller keeps nothing; bought in week 1: from week 2');
  assert.deepEqual(weeks(R.notesOf([[1001,S-90,S,'cancel']])),[[0,-2],[0,null]],'reclaimed at the anchor block: from week 1');
  assert.deepEqual(weeks(R.notesOf([[1001,S+W,S+W,'cancel']])),[[0,-1],[1,null]],'last block of week 1: that week is gone, week 2 on');
  assert.deepEqual(weeks(R.notesOf([[1001,S+W+1,S+W+1,'cancel']])),[[0,0],[2,null]],'first block of week 2: week 1 kept, week 3 on');
  assert.deepEqual(weeks(R.notesOf([],true)),[[null,null]],'a late mint starts at an unknown week');
  assert.throws(()=>R.notesOf([[1001,S+5,null,'active'],[1001,S+9,S+10,'sale']]),/chain order/,'nothing follows an open listing');
  assert.throws(()=>R.notesOf([[1001,S+50,S+60,'sale'],[1001,S+55,S+70,'sale']]),/chain order/,'a listing cannot spend a note before it exists');
});

test('Whose run: a purchase starts a new owner, a reclaim continues the lister; the anchor picks mine',()=>{
  const R=require('../src/lib/rules.js'),S=R.RULES.startBlock,W=R.RULES.weekBlocks;
  const runs=o=>({state:o.state,weeks:o.notes.map(n=>[n.firstWeek,n.lastWeek]),sale:o.sale});
  // Bought before the start, held weeks 1–2, listed in week 3 and sold.
  const sold=[[1001,S-90,S-80,'sale'],[1001,S+2*W+7,S+2*W+9,'sale']];
  assert.deepEqual(runs(R.ownership(sold,{height:S-50,listedAt:null})),{state:'sold',weeks:[[0,1]],sale:{listedAt:S+2*W+7,soldAt:S+2*W+9}},'mine before the listing: my sale keeps weeks 1–2');
  assert.deepEqual(runs(R.ownership(sold,{height:S+2*W+20,listedAt:null})),{state:'held',weeks:[[3,null]],sale:null},'mine after the sale: my purchase, from week 4');
  assert.equal(R.ownership(sold,{height:S+2*W+8,listedAt:S+2*W+7}).state,'unclear','listed when I added it, then sold: either side');
  assert.equal(R.ownership(sold,{height:S+2*W+8,listedAt:S+2*W+7,seller:true}).state,'sold','known to be my listing (my vault)');
  // Listed in week 3, reclaimed in week 4, listed again in week 6 and still open: weeks 1–2 and 5 are mine.
  const cycle=[[1001,S+2*W+5,S+3*W+7,'cancel'],[1001,S+5*W+3,null,'active']];
  assert.deepEqual(runs(R.ownership(cycle,{height:S+4*W,listedAt:null})),{state:'listed',weeks:[[0,1],[4,4]],sale:null});
  assert.deepEqual(runs(R.ownership(cycle,{height:S+5*W+9,listedAt:S+5*W+3})),{state:'listed',weeks:[[0,1],[4,4]],sale:null},'added while listed: my listing');
  // Sold, then bought back: the run is the one holding the piece at the anchor.
  const back=[[1001,S+W+5,S+W+9,'sale'],[1001,S+3*W+1,S+3*W+4,'sale']];
  assert.deepEqual(runs(R.ownership(back,{height:S+10,listedAt:null})),{state:'sold',weeks:[[0,0]],sale:{listedAt:S+W+5,soldAt:S+W+9}});
  assert.deepEqual(runs(R.ownership(back,{height:S+3*W+10,listedAt:null})),{state:'held',weeks:[[4,null]],sale:null});
});

test('Anchors and attribution: pending, legacy, unclear and wallet gaps; left pieces read old and new entries',()=>{
  const R=require('../src/lib/rules.js'),S=R.RULES.startBlock,W=R.RULES.weekBlocks,snap={items:{[id(1)]:[1001,0]}};
  const sold=[[1001,S+50,S+60,'sale']];
  assert.equal(H.anchorOf({added:5}).state,'pending');assert.equal(H.anchorOf(undefined).state,'legacy-unanchored');assert.equal(H.anchorOf({since:S,listed:S+1}).state,'legacy-unanchored','0.11.3 meta is not an anchor');
  assert.deepEqual(H.anchorOf({anchor:S+40,listedAt:null,gaps:[3,1,1,99]}),{state:'anchored',anchor:{height:S+40,listedAt:null,seller:false},legacy:false,gaps:[1,3]});
  assert.equal(H.attribution(snap,id(1),sold,{anchor:S+40,listedAt:null}).state,'sold','added before the listing: my sale');
  assert.equal(H.attribution(snap,id(1),sold,{anchor:S+61,listedAt:null}).state,'held','added after the sale: my purchase');
  assert.equal(H.attribution(snap,id(1),sold,{anchor:S+55,listedAt:S+50}).state,'unclear');
  assert.equal(H.attribution(snap,id(1),sold,{added:1}).state,'held','not anchored yet: mine at the newest record, never my sale');
  assert.equal(H.attribution(snap,id(1),undefined,{anchor:S}).state,'unknown','no records: unknown');
  assert.equal(H.attribution(snap,id(1),sold,undefined).legacy,true);
  // Which sales the owner is asked about: only the unclear one, and a legacy holding's sale this week.
  const noSale={kind:'held'};
  assert.deepEqual(H.saleToConfirm(snap,id(1),sold,{anchor:S+55,listedAt:S+50},noSale),{listedAt:S+50,soldAt:S+60},'listed when added, then sold');
  assert.equal(H.saleToConfirm(snap,id(1),sold,{anchor:S+55,listedAt:S+50,seller:true},noSale),null,'my own listing (added from my vault): moved to Left on its own');
  assert.equal(H.saleToConfirm(snap,id(1),sold,{anchor:S+40,listedAt:null},noSale),null,'listed after it was added: my sale, moved on its own');
  assert.deepEqual(H.saleToConfirm(snap,id(1),sold,undefined,{kind:'sale',listedAt:S+50,height:S+60}),{listedAt:S+50,soldAt:S+60},'saved before anchors, sold this week');
  assert.equal(H.saleToConfirm(snap,id(1),sold,undefined,noSale),null);
  // Gap weeks (private moves the wallet showed) leave holes in a run.
  assert.deepEqual(H.runWeeks([{firstWeek:0,lastWeek:null}],[2,5]),[[0,1],[3,4],[6,null]]);
  assert.deepEqual(H.runWeeks([{firstWeek:0,lastWeek:4},{firstWeek:6,lastWeek:null}],[6]),[[0,4],[7,null]]);
  assert.equal(H.covers([[0,1],[3,null]],2),false);assert.equal(H.covers([[0,1],[3,null]],7),true);assert.equal(H.covers([[null,4]],2),null);
  const left=H.leftOf({[id(1)]:{number:1001,listedAt:S+50,soldAt:S+60,firstWeek:0,lastWeek:0,source:'sale'},[id(2)]:{number:1002,runs:[{listedAt:null,soldAt:null,weeks:[[0,2]],source:'wallet'}]},bad:{}});
  assert.deepEqual(left,{[id(1)]:{number:1001,runs:[{listedAt:S+50,soldAt:S+60,weeks:null,source:'sale'}]},[id(2)]:{number:1002,runs:[{listedAt:null,soldAt:null,weeks:[[0,2]],source:'wallet'}]}});
  const sale=H.saleRun(snap,id(1),[[1001,S+2*W+7,S+2*W+9,'sale']],S+2*W+7,[1],'manual');assert.deepEqual(sale,{listedAt:S+2*W+7,soldAt:S+2*W+9,weeks:[[0,0]],source:'manual'});
  assert.deepEqual(H.privateRun(snap,id(1),[],{anchor:S+5,listedAt:null},3),{listedAt:null,soldAt:null,weeks:[[0,3]],source:'wallet'});
});

test('A weekly change is bounded in one world: unchanged rows add nothing even when weights are ranges',()=>{
  const R=require('../src/lib/rules.js');
  // Exact inputs: the bound is the single exact change.
  const K={lo:1000,hi:1000},U0={lo:40,hi:40},d=R.weeklyChangeBounds(U0,{lo:4,hi:4},K,{lo:4,hi:4});
  const exact=R.weeklyAllocation({lo:44,hi:44},{lo:1004,hi:1004}).lo-R.weeklyAllocation(U0,K).lo;assert.ok(Math.abs(d.lo-exact)<1e-9&&Math.abs(d.hi-exact)<1e-9);
  // A range elsewhere (K unknown within 1000–1010, my units 40–44) cannot turn a certain gain negative.
  const r=R.weeklyChangeBounds({lo:40,hi:44},{lo:4,hi:4},{lo:1000,hi:1010},{lo:4,hi:4});assert.ok(r.lo>0,'buying a piece that adds 4 units and 4 to K is a gain in every world');
  // weightChange: identical inputs give exactly 0; the same unknown trait moves both sides together.
  const t=(floor,extra={})=>({type:'Hair',value:'X',floor,listed:floor===null?0:1,supply:5,...extra});
  const a=R.evaluate({number:5000,traits:[t(150),t(null,{value:'Y',saleHistory:undefined})]},100),b=R.evaluate({number:5000,traits:[t(150),t(null,{value:'Y',saleHistory:undefined})]},100);
  assert.deepEqual(R.weightChange(a,b,true),{lo:0,hi:0});
  const c=R.evaluate({number:5000,traits:[t(200),t(null,{value:'Y',saleHistory:undefined})]},100);assert.deepEqual(R.weightChange(a,c,true),{lo:25,hi:25},'+50% → +75% on the known trait, same unknown on both sides');
  const cross=R.weightChange(a,c,false);assert.ok(cross.lo<25&&cross.hi>25,'another collection floor: the worlds may differ');
});
test("This week's sales for the popup line: dated sales of the active week only, minus the ones already seen",()=>{
  const phase={state:'active',first:2000},run=(soldAt,listedAt=1900)=>({listedAt,soldAt,weeks:[[0,1]],source:'sale'});
  const left=[{id:id(1),number:1001,run:run(2005)},{id:id(2),number:1002,run:run(1999)},{id:id(3),number:1003,run:{listedAt:null,soldAt:null,weeks:[[0,1]],source:'wallet'}},{id:id(4),number:1004,run:run(2000)},{id:id(1),number:1001,run:run(1950,1940)}];
  const all=H.soldThisWeek(left,phase,undefined);
  assert.deepEqual(all.keys,[`${id(4)}@2000`,`${id(1)}@2005`],'in sale order; a sale before this week, a private move and an older run of the same piece are left out');
  assert.deepEqual(all.fresh.map(x=>x.number),[1004,1001]);
  assert.deepEqual(H.soldThisWeek(left,phase,[`${id(4)}@2000`]).fresh.map(x=>x.number),[1001],'a seen sale stays out');
  assert.deepEqual(H.soldThisWeek(left,phase,all.keys).fresh,[],'everything seen: no line');
  assert.deepEqual(H.soldThisWeek(left,phase,[`${id(1)}@1950`]).fresh.map(x=>x.number),[1004,1001],'the same piece sold again later is a new sale');
  assert.deepEqual(H.soldThisWeek([{id:id(5),number:1005,run:run(2003)},{id:id(2),number:1002,run:run(2003)}],phase).keys,[`${id(2)}@2003`,`${id(5)}@2003`],'same block: by number');
  for(const raw of [null,'x',{},[1,null,{}]])assert.equal(H.soldThisWeek(left,phase,raw).fresh.length,2,JSON.stringify(raw));
  for(const state of ['before','boundary','ended','closed'])assert.deepEqual(H.soldThisWeek(left,{state,first:2000},undefined),{keys:[],fresh:[]},state);
  assert.deepEqual(H.soldThisWeek(left,phase,[`${id(4)}@2000`]).keys,all.keys,'seen or not, every sale of this week is named in keys (what View and × store)');
  for(const soldAt of ['2005',2005.5,null,undefined,-1])assert.deepEqual(H.soldThisWeek([{id:id(6),number:1006,run:run(soldAt)}],phase).keys,[],String(soldAt));
});

test('A write to Left keeps what this version cannot read: whole entries and odd runs; a removed piece keeps only those',()=>{
  const ok={listedAt:10,soldAt:20,weeks:[[0,1]],source:'sale'},odd={listedAt:'x',weeks:{}},added={listedAt:30,soldAt:40,weeks:[[2,2]],source:'sale'};
  const raw={[id(1)]:{number:1001,runs:[ok,odd]},[id(2)]:{number:1002,runs:[ok]},[id(3)]:{number:1003,runs:[{listedAt:5,soldAt:6,weeks:'v2'}]},[id(4)]:{number:1004,listedAt:null,firstWeek:0,lastWeek:2,source:'wallet'},someday:{x:1}};
  const left=H.leftOf(raw);assert.deepEqual(Object.keys(left).sort(),[id(1),id(2)].sort());
  assert.deepEqual(H.leftSave(raw,left),raw,'nothing changed: stored as it was');
  const changed=structuredClone(left);changed[id(2)].runs.push(added);delete changed[id(1)];
  const out=H.leftSave(raw,changed);
  assert.deepEqual(out[id(2)].runs,[ok,added]);assert.deepEqual(out[id(1)],{number:1001,runs:[odd]},'removed: only the run this version cannot read stays');
  assert.deepEqual(out[id(3)],raw[id(3)]);assert.deepEqual(out[id(4)],raw[id(4)]);assert.deepEqual(out.someday,{x:1});
  const hostile=JSON.parse('{"__proto__":{"polluted":1}}');assert.equal(H.leftSave(hostile,{}).polluted,undefined);assert.equal({}.polluted,undefined);
  for(const bad of [undefined,null,[],'x'])assert.deepEqual(H.leftSave(bad,{[id(1)]:{number:1001,runs:[ok]}}),{[id(1)]:{number:1001,runs:[ok]}});
});

test('Stored records with a row that is not a row read as no records, never thrown on',()=>{
  const snap={items:{[id(1)]:[1001,0]}};
  for(const records of [[null],[[1001,1,2,'sale'],null],[undefined],['x'],[{}]]){
   assert.deepEqual(H.attribution(snap,id(1),records,undefined),{state:'unknown'},JSON.stringify(records));
   assert.equal(H.saleToConfirm(snap,id(1),records,undefined,{kind:'held'}),null);
  }
});
