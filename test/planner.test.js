'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const PL=require('../src/lib/planner.js'),P=require('../src/lib/purchase.js'),R=require('../src/lib/rules.js');
require('../src/data/snapshot.js');const B=globalThis.SHNAKAS_SNAPSHOT;
const byNumber=n=>Object.keys(B.items).find(id=>B.items[id][0]===n);
const id=n=>String(n).padStart(64,'0')+'i0';
function fixture(prices,indexes=[[0],[0],[1]],numbers=[1000,1001,1002],extra={}){
  const names=[['Hair','Red'],['Hair','Blue'],['Body','Tan']];
  const traits=names.map(([type,value],idx)=>{const ps=prices.filter((p,i)=>p!==null&&indexes[i].includes(idx));return [type,value,ps.length?Math.min(...ps):null,ps.length];});
  return {snapshot:{height:100,collectionFloor:Math.min(...prices.filter(p=>p!==null))},collection:{numberStart:0},traits,items:Object.fromEntries(indexes.map((idx,i)=>[id(i),[numbers[i],...idx]])),offers:prices.map((p,i)=>[id(i),p]).filter(([,p])=>p!==null),...extra};
}

test('One removal scores every catalog row exactly like the single-sale model, for buys and reclaims',()=>{
  for(const action of ['sale','cancel']){
    const model=P.create(B,{action});
    for(const [lid] of B.offers.slice(0,40)){
      const a=model.get(lid),b=PL.scenario(B,{remove:[[lid,action]]});
      assert.equal(b.state,'ready');assert.equal(b.floor,a.afterFloor);
      assert.deepEqual(b.programmeUnits(),a.programmeUnits(),`K after ${action} of ${B.items[lid][0]}`);
      // Same rule inputs, written two ways (a pending sale vs the sale folded into the history): compare what they score.
      const view=r=>({lo:r.lo,hi:r.hi,exact:r.exact,unmeasured:r.unmeasured,traits:r.traits.map(t=>[t.type,t.value,t.measured,t.pct,t.pctLo,t.pctHi,t.method,t.floor,t.listed,t.basisPrice])});
      for(const key of [lid,...Object.keys(B.items).filter((x,i)=>i%97===0)])assert.deepEqual(view(b.evaluate(key)),view(a.evaluate(key)));
    }
  }
});

test('Several removals: floors, collection floor and the newest-sales window follow all of them',()=>{
  const s=fixture([100,150,300]);
  const x=PL.scenario(s,{remove:[[id(0),'sale'],[id(1),'sale']]});
  assert.equal(x.floor,300);assert.equal(x.floors.has(0),false);assert.equal(x.evaluate(id(2)).lo.weight,100);
  // Hair Red is now zero-listed with fewer than 20 pieces and no loaded history: the sale basis stays an honest range.
  assert.equal(x.evaluate(id(0)).exact,false);
  const withHistory=fixture([100,150,300],undefined,undefined,{saleHistory:[[0,[]]]});
  const y=PL.scenario(withHistory,{remove:[[id(0),'sale'],[id(1),'sale']]});
  // Two buys at 100 and 150 against floor 300: median of two = mean 125 → 0.41× → +0%.
  assert.equal(y.evaluate(id(0)).lo.weight,100);assert.equal(y.evaluate(id(0)).exact,true);
  assert.throws(()=>PL.scenario(s,{remove:[[id(2),'sale'],[id(2),'cancel']].slice(1).concat([[id(9),'sale']])}),/Not listed/);
  assert.equal(PL.scenario(s,{remove:s.offers.map(([x])=>[x,'sale'])}).state,'no-floor');
});

test('Listing my piece: a new ask lowers trait and collection floors from the next block, never other inputs',()=>{
  const s=fixture([100,null,280],[[0],[0],[2]]);
  // #1001 (Hair Red) unlisted. Listing it at 90 makes it the collection floor: Body Tan 280/100 = 2.8× (+75%) becomes
  // 280/90 ≥ 3× (+100%).
  assert.equal(R.evaluateSnapshot(s,id(2)).lo.weight,175);
  const x=PL.scenario(s,{add:[[id(1),90]]});assert.equal(x.floor,90);assert.equal(x.evaluate(id(2)).lo.weight,200);
  assert.throws(()=>PL.scenario(s,{add:[[id(0),90]]}),/Cannot list/);
  assert.throws(()=>PL.scenario(s,{add:[[id(1),0]]}),/positive integer/);
  const sim=PL.simulate(s,{kind:'list',id:id(1),price:90},[id(1),id(2)]);assert.equal(sim.state,'ready');assert.deepEqual(sim.up.map(r=>r.key),[id(2)]);
  assert.ok(sim.mine.delta.lo<0,'Listing the piece stops its own earnings even though the other holding rises');
  const listedRow=sim.mine.rows.find(r=>r.id===id(1));assert.deepEqual(listedRow.weeklyAfter,{lo:0,hi:0});
  assert.equal(PL.simulate(s,{kind:'list',id:id(0),price:90}).state,'listed');assert.equal(PL.simulate(s,{kind:'sale',id:id(1)}).state,'unlisted');
  // My own listing that sells leaves my holdings; reclaimed it earns again at the steady rate.
  const sold=PL.simulate(s,{kind:'sale',id:id(0)},[id(0),id(1)]);assert.equal(sold.mine.rows.find(r=>r.id===id(0)).after,null);
  const back=PL.simulate(s,{kind:'cancel',id:id(0)},[id(0)]);assert.ok(back.mine.rows[0].weeklyAfter.lo>0);
});

test('Safe ask: exact intervals between breakpoints, each checked against every other piece',()=>{
  const F=B.snapshot.collectionFloor,unlisted=Object.keys(B.items).filter(x=>!B.offers.some(o=>o[0]===x));
  const moves=(id,p)=>PL.scenario(B,{add:[[id,p]]}).changed().some(x=>x.key!==id);let ready=0,none=0;
  for(const id of unlisted.filter((x,i)=>i%53===0)){
    const a=PL.safeAsk(B,id);assert.ok(['ready','none','range'].includes(a.state));
    if(a.state==='none'){none++;continue;}if(a.state!=='ready')continue;ready++;
    for(const {min,below} of a.runs){assert.ok(min>=F);assert.equal(moves(id,min),false,`${B.items[id][0]} at ${min}`);if(below!==null){assert.equal(moves(id,below-1),false);}else assert.equal(moves(id,100*F),false);}
  }
  assert.ok(ready>0&&none>0,'both outcomes occur in the bundled block');
  // A price below the collection floor moves every ratio: never inside a safe interval.
  assert.equal(PL.scenario(B,{add:[[unlisted[0],F-1]]}).floor,F-1);
});

test('Plans reach the goal exactly, settle against the floor they leave and list reclaims before purchases',()=>{
  for(const n of [888,379,640,1200,1500,2100,3000]){
    const target=byNumber(n),p=PL.plan(B,target);
    assert.ok(['done','reachable','capped'].includes(p.state));
    if(p.state!=='reachable')continue;
    for(const x of p.plans){
      const again=PL.scenario(B,{remove:x.steps.map(st=>[st.id,st.action])});
      assert.equal(again.floor,x.floor);assert.ok(again.evaluate(target).lo.weight>=400);
      assert.equal(x.cost,x.steps.filter(st=>st.action==='sale').reduce((a,st)=>a+st.price,0));
    }
    for(let i=1;i<p.plans.length;i++)assert.ok(p.plans[i-1].cost<=p.plans[i].cost,'cheapest first');
  }
  // Owning a listing the cheapest plan needs turns it into a free reclaim, listed before every purchase.
  const piece=byNumber(1200),free=PL.plan(B,piece);assert.equal(free.state,'reachable');
  const ownedId=free.plans[0].steps.find(st=>st.action==='sale').id,p=PL.plan(B,piece,{own:new Set([ownedId])});
  assert.equal(p.state,'reachable');const x=p.plans.find(pl=>pl.steps.some(st=>st.id===ownedId));assert.ok(x,'a plan uses the owned listing');
  assert.equal(x.steps[0].action,'cancel');assert.equal(x.steps[0].id,ownedId);assert.ok(x.steps.slice(1).every(st=>st.action==='sale'));
  assert.equal(x.cost,x.steps.filter(st=>st.action==='sale').reduce((a,st)=>a+st.price,0),'the reclaim costs nothing');
});

test('Out-of-reach pieces report the highest weight they can reach and why',()=>{
  // Two traits and no number bonus: 100 + 2 × 100 = 300% at most.
  const s=fixture([100,400,500],[[0,2],[0],[1]],[1000,1001,1002]);
  const p=PL.plan(s,id(0));assert.equal(p.ceiling,300);assert.equal(p.state,'capped');assert.ok(p.why.some(w=>w.kind==='ceiling'));
  assert.ok(p.best<=300);
});

test('Locking a trait: a monopoly only when every piece can be ours',()=>{
  // Hair Red: three pieces; #1000 is mine, #1001 listed by someone else at 100, #1002 (Body Tan) listed at 280.
  const s=fixture([null,100,280],[[0],[0],[2]],[1000,1001,1002],{saleHistory:[[0,[]],[2,[]]]});
  s.items[id(3)]=[1003,0];s.traits[0]=['Hair','Red',100,1];
  const rows=PL.lockTraits(s,[id(0)]),red=rows.find(r=>r.value==='Red');
  assert.equal(red.supply,3);assert.equal(red.held,1);assert.equal(red.others,1);assert.equal(red.othersHeld,1,'#1003 is held by someone else, unlisted');
  assert.equal(red.monopoly.state,'held-elsewhere');
  // What stands in the way, by number: the listing to buy and the piece only a private deal gets.
  assert.deepEqual(red.buyable.map(x=>[x.number,x.price]),[[1001,100]]);assert.deepEqual(red.wanted.map(x=>[x.number,x.closing]),[[1003,false]]);assert.deepEqual(red.unminted,[]);
  const mine=PL.lockTraits(s,[id(0),id(3)]).find(r=>r.value==='Red');assert.equal(mine.monopoly.state,'possible');
  assert.deepEqual(mine.monopoly.buy.map(x=>x.number),[1001]);assert.equal(mine.monopoly.cost,100);
  // Three pieces, no listing left: scored on the last three sales, here only this purchase at 100 against floor 280.
  assert.ok(mine.monopoly.after.lo<100);assert.equal(mine.monopoly.keepListed.after.lo,100,'one of ours listed at the line keeps +100%');
  assert.equal(mine.monopoly.keepListed.price,PL.threshold(R.RULES.traitTiers[0],280));
  // Groups: still held elsewhere → far, one piece missing; all ours once the listing is bought → can.
  const far=PL.lockGroups(rows);assert.ok(far.far.includes(red));assert.equal(far.missing(red),1);assert.ok(!far.can.includes(red)&&!far.have.includes(red));
  assert.ok(PL.lockGroups(PL.lockTraits(s,[id(0),id(3)])).can.some(t=>t.value==='Red'));
  // Every piece ours, one of them listed: free, by reclaiming it, so it leads the group.
  const owned=PL.lockTraits(s,[id(0),id(1),id(3)]).find(r=>r.value==='Red');
  assert.equal(owned.monopoly.state,'possible');assert.deepEqual(owned.monopoly.reclaim.map(x=>x.number),[1001]);assert.equal(owned.monopoly.cost,0);
  assert.ok(PL.lockGroups([owned]).can.includes(owned));
  // What the purchase of #1001 earns us from the next week: 100% (Red 0% on that sale, no number bonus) = 4 units of K 16
  // (all four pieces at 100% once Red is sale-scored and Body Tan is the 280 floor itself); the total adds it to our change.
  const m=mine.monopoly;assert.deepEqual(m.bought,R.weeklyAllocation({lo:4,hi:4},{lo:16,hi:16}));
  assert.deepEqual(m.total,{lo:m.change.delta.lo+m.bought.lo,hi:m.change.delta.hi+m.bought.hi});
  // In the last reward week a purchase has no later week to earn in.
  const last={...s,snapshot:{...s.snapshot,height:R.RULES.startBlock+R.RULES.weeks*R.RULES.weekBlocks-10}};
  assert.deepEqual(PL.lockTraits(last,[id(0),id(3)]).find(r=>r.value==='Red').monopoly.bought,{lo:0,hi:0});
});

test('Owning a trait: a listing of ours someone is buying leaves us; one being reclaimed needs no step',()=>{
  // Hair Red: #1000 (mine, listed at 300) and #1001 (mine, unlisted); Body Tan: #1002, someone else's, listed at 100.
  const base={snapshot:{height:100,collectionFloor:100},collection:{numberStart:0},traits:[['Hair','Red',300,1],['Hair','Blue',null,0],['Body','Tan',100,1]],
    items:{[id(0)]:[1000,0],[id(1)]:[1001,0],[id(2)]:[1002,2]},offers:[[id(0),300],[id(2),100]],saleHistory:[]};
  // Someone is buying #1000: it leaves us at the next block, so Red is held elsewhere and #1000 is no reclaim of ours.
  const sold=PL.lockTraits({...base,closing:[[id(0),'sale']]},[id(0),id(1)]).find(r=>r.idx===0);
  assert.deepEqual([sold.held,sold.ownListed,sold.others,sold.othersHeld,sold.closingAway],[1,0,0,0,1]);assert.equal(sold.monopoly.state,'held-elsewhere');
  assert.deepEqual(sold.wanted.map(x=>[x.number,x.closing,x.own]),[[1000,true,true]]);
  // Once all ours again (bought back privately: no public sale), Red's last sale is that one at 300 = 3× the floor 100:
  // +100% while the collection floor stays at or under 300 ÷ 3 = 100.
  assert.deepEqual(sold.owned,{state:'ready',floor:100,after:{lo:100,hi:100,method:'sales-median'},stable:false,holds:{min:null,max:100}});
  // #1000 being reclaimed instead (Red sold once, at 300): nothing to do. From the next block Red has no listing and scores
  // that sale, 3× → +100% (now its floor 250 gives +75%): all ours, so it is in `have`.
  const back={...base,traits:[['Hair','Red',250,1],['Hair','Blue',null,0],['Body','Tan',100,1]],offers:[[id(0),250],[id(2),100]],saleHistory:[[0,[[300,90]]]],closing:[[id(0),'cancel']]};
  const t=PL.lockTraits(back,[id(0),id(1)]).find(r=>r.idx===0),m=t.monopoly;
  assert.deepEqual([t.held,t.ownListed,t.bonus.lo,m.state,m.cost,m.after.lo],[2,1,75,'possible',0,100]);
  assert.deepEqual(m.reclaim,[]);assert.deepEqual(m.reclaiming.map(x=>[x.number,x.action,x.closing]),[[1000,'cancel',true]]);assert.equal(m.keepListed,undefined);
  const g=PL.lockGroups([t]);assert.deepEqual([g.can.length,g.have.length,g.far.length],[0,1,0]);
});

test('Plans: a listing of ours someone is buying is no step of ours, no target, and leaves our weekly total',()=>{
  // Hair Red's floor is my listing #1000 at the collection floor 100; someone is buying it, so it sells and Red's floor
  // becomes #1003 at 300 = 3×: #1001 reaches 200% at no cost, and #1000 leaves us.
  const t={snapshot:{height:100,collectionFloor:100},collection:{numberStart:0},traits:[['Hair','Red',100,2],['Body','Tan',100,1]],
   items:{[id(0)]:[1000,0],[id(1)]:[1001,0],[id(2)]:[1002,1],[id(3)]:[1003,0]},offers:[[id(0),100],[id(2),100],[id(3),300]],saleHistory:[],closing:[[id(0),'sale']]};
  const rows=PL.targetPlans(t,{mine:[id(0),id(1)],goal:200});assert.deepEqual(rows.map(r=>r.number),[1001],'the piece being sold is no target');
  const r=rows[0];assert.deepEqual(r.plan.steps.map(st=>[st.number,st.action,st.closing,st.owned]),[[1000,'sale',true,true]]);assert.equal(r.plan.cost,0);assert.deepEqual(r.plan.bought,[]);
  // By hand: before, #1001 alone earns, 4 units of K 16 (#1000 is listed); after, 8 units of K 28 (#1000, #1001 and #1003 at
  // 200%, #1002 at 100%), and #1000 is no longer ours.
  const week=(u,K)=>u*R.unitRate(K)*R.RULES.weekBlocks/1e8;assert.equal(r.change.lo,r.change.hi);assert.ok(Math.abs(r.change.lo-(week(8,28)-week(4,16)))<1e-6);
  const j=PL.jointPlan(t,{mine:[id(0),id(1)],goal:200});assert.deepEqual(j.targets.map(x=>[x.number,x.state]),[[1001,'reached']]);
  assert.deepEqual(j.steps.map(st=>[st.number,st.action,st.closing,st.owner,st.payer]),[[1000,'sale',true,'me',null]]);assert.equal(j.cost,0);assert.deepEqual(j.change.me.delta,r.change);
  assert.deepEqual(PL.weeklyChange(t,[id(0)],PL.scenario(t,{remove:[[id(0),'sale']]})).after,{lo:0,hi:0},'a sale of a piece of ours takes it out of our holdings');
  // A listing of ours already being reclaimed: a free step that is happening anyway.
  const p=PL.plan({...t,closing:[[id(0),'cancel']]},id(1),{own:new Set([id(0),id(1)]),goal:200});
  assert.deepEqual(p.plans[0].steps.map(st=>[st.number,st.action,st.closing,st.owned]),[[1000,'cancel',true,true]]);assert.deepEqual([p.plans[0].cost,p.plans[0].closing,p.plans[0].cancels],[0,1,0]);
});

test('Owning a trait: the bonus once owned on every row, the floors it holds at, and one of ours kept listed at the line',()=>{
  // Hair Red (3 pieces, all mine, none listed): last sales 600 (block 95), 300 (94), then 280 and 320 both in block 93, so the
  // window is [600, 300, 280] or [600, 300, 320], median 300 or 320. Body Tan: 20 pieces, #1100 listed by someone else at
  // 140 (the collection floor), one mine. Hair Blue: #1003, someone else's, listed at 150.
  const items={[id(0)]:[1000,0],[id(1)]:[1001,0],[id(2)]:[1002,0],[id(3)]:[1003,1]};for(let i=0;i<20;i++)items[id(10+i)]=[1100+i,2];
  const s={snapshot:{height:100,collectionFloor:140},collection:{numberStart:0},traits:[['Hair','Red',null,0],['Hair','Blue',150,1],['Body','Tan',140,1]],items,
   offers:[[id(3),150],[id(10),140]],saleHistory:[[0,[[600,95],[300,94],[280,93],[320,93]]]]};
  const rows=PL.lockTraits(s,[id(0),id(1),id(2),id(11)]),red=rows.find(r=>r.value==='Red'),tan=rows.find(r=>r.value==='Tan');
  // Red at 140: 300 and 320 are both ≥ 2× and < 3× → +75%. Both windows stay +75% from 107 (at 106, 320 ≥ 3 × 106 = 318 gives
  // +100% for one of them) up to 150 (at 151, 300 < 2 × 151 drops one to +50%). Only the median-300 window would say 101–150.
  assert.deepEqual(red.owned,{state:'ready',floor:140,after:{lo:75,hi:75,method:'sales-median'},stable:false,holds:{min:107,max:150}});
  const tier=f=>R.recentSalesTier(s.saleHistory[0][1],undefined,f);assert.equal(tier(107).pct,75);assert.equal(tier(150).pct,75);assert.equal(tier(106).measured,false);assert.equal(tier(151).measured,false);
  // Body Tan is held elsewhere; once ours (#1100 bought, the rest by private deal) it has 20 pieces and no listing: +100%
  // whatever the floors do; the collection floor left is Blue's 150.
  assert.equal(tan.monopoly.state,'held-elsewhere');assert.equal(tan.maxNow,false);
  assert.deepEqual(tan.owned,{state:'ready',floor:150,after:{lo:100,hi:100,method:'held'},stable:true,holds:{min:null,max:null}});
  // Red under +100% once ours: keep one listed at the exact +100% line, 3 × 140 = 420 (419 gives +75%). The three are equal,
  // so the lowest number; it earns nothing while listed and anyone can buy it.
  const k=red.monopoly.keepListed;assert.deepEqual([k.number,k.price,k.floor,k.multiple,k.listed,k.after.lo],[1000,420,140,{num:3,den:1},null,100]);
  assert.equal(R.traitTier(420,140).pct,100);assert.equal(R.traitTier(419,140).pct,75);
  assert.deepEqual(k.without.delta,{lo:0,hi:0},'no listing to remove: the trait is already all ours');
  assert.deepEqual(PL.lockGroups(rows).can.map(t=>t.value),['Red']);
  // Every piece of ours listed: #1000 at 400 (already over the line 300: kept as it is) and #1001 at 150 (raised to 300 by
  // an edit); either holds +100% for the other, so the lower number, kept at its ask.
  const u={snapshot:{height:100,collectionFloor:100},collection:{numberStart:0},traits:[['Hair','Red',150,2],['Hair','Blue',null,0],['Body','Tan',100,1]],
   items:{[id(0)]:[1000,0],[id(1)]:[1001,0],[id(2)]:[1002,2]},offers:[[id(0),400],[id(1),150],[id(2),100]],saleHistory:[]};
  const v=PL.lockTraits(u,[id(0),id(1)]).find(r=>r.idx===0);
  // Reclaimed, Red has no sale: whether its last ask is carried is unknown (0–100%), so no floor range.
  assert.deepEqual(v.owned,{state:'ready',floor:100,after:{lo:0,hi:100,method:'carry-unverified'},stable:false,holds:null});
  assert.deepEqual([v.monopoly.keepListed.number,v.monopoly.keepListed.price,v.monopoly.keepListed.listed,v.monopoly.keepListed.after.lo],[1000,300,400,100]);
  // An edited ask keeps the listing: Red's floor follows the new price.
  const e=PL.scenario(u,{reprice:[[id(1),300]]});assert.deepEqual(e.floors.get(0),{floor:300,listed:2});assert.equal(e.trait(0).lo.weight,200);
  assert.throws(()=>PL.scenario(u,{reprice:[[id(2),300]],remove:[[id(2),'sale']]}),/Cannot edit/);assert.throws(()=>PL.scenario(u,{reprice:[[id(9),300]]}),/Cannot edit/);
  assert.throws(()=>PL.scenario({...u,closing:[[id(1),'sale']]},{reprice:[[id(1),300]]}),/Cannot edit/);assert.throws(()=>PL.scenario(u,{reprice:[[id(1),0]]}),/positive integer/);
});

test('Owning a trait: groups by weekly gain per sat, a free gain first and a free loss last; far by pieces missing',()=>{
  const row=(idx,cost,total,extra={})=>({idx,held:1,supply:3,wanted:[],unminted:[],monopoly:{state:'possible',buy:cost?[{}]:[],reclaim:cost?[]:[{}],cost,total:{lo:total,hi:total},...extra}});
  // Free with +5 and free with +4 (kept listed; plain −3) lead, larger gain first; then 10 per 1000 sats, 50 per 10000;
  // the free one that changes nothing; −2 per 100 sats; the free one that loses last.
  const can=PL.lockGroups([row(1,0,-1),row(2,1000,10),row(3,0,5),row(4,10000,50),row(5,100,-2),row(6,0,0,{keepListed:{total:{lo:0,hi:0}}}),row(7,0,-3,{keepListed:{total:{lo:4,hi:4}}})]).can;
  assert.deepEqual(can.map(t=>t.idx),[3,7,2,4,6,5,1]);
  const far=(idx,wanted,unminted,held)=>({idx,held,supply:30,wanted:Array(wanted).fill({}),unminted:Array(unminted).fill(1200),monopoly:{state:wanted?'held-elsewhere':'unminted'}});
  assert.deepEqual(PL.lockGroups([far(1,3,0,1),far(2,0,1,1),far(3,1,1,1),far(4,2,0,2)]).far.map(t=>t.idx),[2,4,3,1]);
});

test('Owning a trait on the bundled block: counts from the raw data and the bonus once owned rescored by hand',()=>{
  const F=B.snapshot.collectionFloor,H=B.snapshot.height,offers=new Map(B.offers),history=new Map(B.saleHistory),pieces=new Map();
  for(const [key,row] of [...Object.entries(B.items),...B.pending.map((row,i)=>['pending:'+i,row])])for(const idx of row.slice(1)){if(!pieces.has(idx))pieces.set(idx,[]);pieces.get(idx).push([key,row[0]]);}
  const small=[...pieces].filter(([,list])=>list.length<R.RULES.heldSupply).map(([idx])=>idx);let possible=0;
  for(const idx of small.filter((x,i)=>i%12===0)){
   // Ours: every unlisted minted piece of the trait; the listed ones are someone else's.
   const minted=pieces.get(idx).filter(([key])=>!key.startsWith('pending:')),ours=minted.filter(([key])=>!offers.has(key)).map(([key])=>key);if(!ours.length)continue;
   const t=PL.lockTraits(B,ours).find(r=>r.idx===idx),listed=minted.filter(([key])=>offers.has(key)),unminted=pieces.get(idx).length-minted.length;
   assert.deepEqual([t.supply,t.pending,t.held,t.others,t.othersHeld],[pieces.get(idx).length,unminted,ours.length,listed.length,0]);
   assert.deepEqual(t.buyable.map(x=>[x.number,x.price]),listed.map(([key,n])=>[n,offers.get(key)]).sort((a,b)=>a[1]-b[1]||a[0]-b[0]));
   assert.equal(t.monopoly.state,unminted?'unminted':'possible');
   // Once ours: no listing of the trait; every purchase a sale at the next block; the floor the other listings leave.
   const rest=B.offers.filter(([key])=>!B.items[key].slice(1).includes(idx)),floor=Math.min(...rest.map(([,p])=>p));
   const [type,value]=B.traits[idx],sales=listed.map(([key])=>[offers.get(key),H+1]);
   const input=listed.length?{type,value,floor:null,listed:0,supply:pieces.get(idx).length,saleHistory:[...sales,...(history.get(idx)??[])]}:R.snapshotTraits(B,[idx])[0];
   const r=R.evaluate({number:9999,traits:[input]},listed.length?floor:F);
   assert.deepEqual(t.owned.after,{lo:r.lo.weight-100,hi:r.hi.weight-100,method:r.traits[0].method});assert.equal(t.owned.floor,listed.length?floor:F);
   if(t.monopoly.state==='possible'){possible++;assert.equal(t.monopoly.cost,listed.reduce((a,[key])=>a+offers.get(key),0));}
  }
  assert.ok(possible>=5,'the bundled block has small traits to own');
});

test('Joint plan: targets taken together still all reach the goal; every step names what it serves and whose it is',()=>{
  const listed=B.offers[0][0];
  const mine=[byNumber(1200),byNumber(640)],mates=[byNumber(379),listed,byNumber(888)];
  const t=PL.jointPlan(B,{mine,mates});assert.equal(t.state,'ready');assert.ok(t.steps.length>0,'the bundled block needs purchases for these targets');
  const below=[...mine,...mates].filter(x=>R.evaluateSnapshot(B,x).lo.weight<400);
  assert.deepEqual(t.targets.map(x=>x.id).sort(),[...below].sort(),'targets: our pieces below 400%, each once');
  for(const x of t.targets.filter(x=>x.state==='reached'))assert.ok(t.scenario.evaluate(x.id).lo.weight>=400,`#${x.number} reaches 400% in the joint plan`);
  assert.equal(t.targets.filter(x=>x.state==='reached').length<=t.targets.length,true);
  for(const st of t.steps){
   if(st.action==='cancel'){assert.ok([...mine,...mates].includes(st.id));assert.ok(['me','mates'].includes(st.owner));}
   else if(!st.closing){assert.ok(st.serves.length>0,'every purchase serves a target');assert.ok(['me','mates','both'].includes(st.payer));}
  }
  assert.equal(t.cost,t.steps.filter(st=>st.action==='sale'&&!st.closing).reduce((a,st)=>a+st.price,0));
  // What the pieces bought earn goes to whoever pays: every purchase once, scored in the plan's world.
  const buys=t.steps.filter(st=>st.action==='sale'&&!st.closing);
  assert.deepEqual(t.bought.map(b=>[b.id,b.payer]),buys.map(st=>[st.id,st.payer]));
  for(const b of t.bought)assert.deepEqual(b.result,t.scenario.evaluate(b.id));
});

test('Each target alone: its own cheapest plan, what it gives us, ordered by weekly gain per BTC',()=>{
  const mine=[byNumber(1200),byNumber(640),byNumber(1500)],mates=[byNumber(379)];
  const rows=PL.targetPlans(B,{mine,mates}),own=new Set([...mine,...mates]);
  assert.deepEqual(rows.map(r=>r.id).sort(),[...own].filter(x=>R.evaluateSnapshot(B,x).lo.weight<400).sort(),'targets: our pieces below 400%');
  for(const r of rows){
   assert.equal(r.side,mates.includes(r.id)?'mates':'me');
   const p=PL.plan(B,r.id,{own,limit:1});assert.equal(r.state,p.state);
   if(r.plan===null){assert.equal(p.plans.length,0);assert.equal(r.value,null);continue;}
   // The same plan as plan() alone, scored in its own world: this piece, all our pieces, and the pieces bought.
   assert.deepEqual(r.plan.steps.map(st=>st.id),p.plans[0].steps.map(st=>st.id));assert.equal(r.plan.cost,p.plans[0].cost);
   const s=r.plan.scenario,w=PL.weeklyChange(B,[r.id],s);assert.deepEqual(r.piece,{before:w.before,after:w.after});
   assert.deepEqual(r.change,PL.weeklyChange(B,[...own],s).delta);
   const units=r.plan.bought.reduce((u,b)=>{const v=R.units(b.result);return {lo:u.lo+v.lo,hi:u.hi+v.hi};},{lo:0,hi:0});
   assert.deepEqual(r.bought,R.weeklyAllocation(units,r.plan.K),'bought pieces count from next week (the bundled block is before the last week)');
   assert.deepEqual(r.total,{lo:r.change.lo+r.bought.lo,hi:r.change.hi+r.bought.hi});
   assert.equal(r.value,r.plan.cost>0?r.total.lo/r.plan.cost*1e5:null);
  }
  const reach=rows.filter(r=>r.state==='reachable');assert.ok(reach.length>=2,'the bundled block has several reachable targets');
  assert.ok(rows.slice(0,reach.length).every(r=>r.state==='reachable'),'reachable targets first');
  for(let i=1;i<reach.length;i++){const a=reach[i-1],b=reach[i];if(a.value!==null&&b.value!==null)assert.ok(a.value>=b.value,'best value first');if(a.value!==null)assert.notEqual(b.value,null,'free plans lead');}
  // A plan that only reclaims our own listing costs nothing: no value, ahead of every paid plan. Hair Red's floor is my
  // listing #1000 at the collection floor (1×); reclaimed, Red's floor is #1003 at 300 = 3× → +100%, so #1001 reaches 200%.
  const t={snapshot:{height:100,collectionFloor:100},collection:{numberStart:0},traits:[['Hair','Red',100,2],['Body','Tan',100,1]],
   items:{[id(0)]:[1000,0],[id(1)]:[1001,0],[id(2)]:[1002,1],[id(3)]:[1003,0]},offers:[[id(0),100],[id(2),100],[id(3),300]],saleHistory:[]};
  const free=PL.targetPlans(t,{mine:[id(0),id(1)],goal:200}),one=free.find(r=>r.id===id(1));
  assert.equal(one.state,'reachable');assert.deepEqual(one.plan.steps.map(st=>[st.number,st.action]),[[1000,'cancel']]);assert.equal(one.plan.cost,0);assert.equal(one.value,null);
  // My listing #1000 is a target too, with the same reclaim: one world, the same total, so the lower number leads.
  assert.deepEqual(free.map(r=>[r.number,r.value]),[[1000,null],[1001,null]]);assert.deepEqual(free[0].total,free[1].total);assert.ok(free[0].total.lo>0);
});

test('A plan made only of listings already closing needs nothing from us: it comes after the plans that do',()=>{
  // Hair Red: #1001 is ours at 100%; its floor is someone else's #1000 at 100 (1×), already being bought — once it closes
  // Red's floor is #1003 at 300 (3×), so #1001 reaches 200% at the next block whatever we do. Body Tan: 20 pieces held by
  // others, our #1004, and our own listing #1002 at 100 — reclaiming it leaves Tan unlisted (22 pieces: +100%).
  const items={[id(0)]:[1000,0],[id(1)]:[1001,0],[id(2)]:[1002,1],[id(3)]:[1003,0],[id(4)]:[1004,1]};for(let i=0;i<20;i++)items[id(10+i)]=[1100+i,1];
  const t={snapshot:{height:100,collectionFloor:100},collection:{numberStart:0},traits:[['Hair','Red',100,2],['Body','Tan',100,1]],items,
   offers:[[id(0),100],[id(2),100],[id(3),300]],closing:[[id(0),'sale']],saleHistory:[]};
  const rows=PL.targetPlans(t,{mine:[id(1),id(2),id(4)],goal:200}),auto=rows.find(r=>r.id===id(1)),act=rows.find(r=>r.id===id(4));
  assert.equal(auto.state,'reachable');assert.equal(auto.auto,true);assert.deepEqual(auto.plan.steps.map(st=>[st.number,st.action,st.closing]),[[1000,'sale',true]]);
  assert.equal(auto.plan.cost,0);assert.equal(auto.value,null);
  assert.equal(act.auto,false);assert.deepEqual(act.plan.steps.map(st=>[st.number,st.action]),[[1002,'cancel']]);
  assert.ok(rows.indexOf(act)<rows.indexOf(auto),'the plan that needs us comes first');
});

test('Plans try every tier: a cheaper lower tier can win once purchases raise the collection floor',()=>{
  // Body A: 22 pieces; buying the floor listing (#1000) alone lifts the collection floor so that every other trait of X
  // reaches its tier: one purchase of 100 takes X to 400% (an earlier version only kept the highest tier per removal set).
  const items={[id(0)]:[888,0,1,2],[id(1)]:[1000,0],[id(2)]:[1001,0,2],[id(3)]:[1002,1],[id(4)]:[1003,3]};for(let i=0;i<19;i++)items[id(10+i)]=[1100+i,0];
  const s={snapshot:{height:100,collectionFloor:100},collection:{numberStart:0},traits:[['Body','A',100,2],['Outfit','B',330,1],['Hair','C',310,1],['Eyes','D',110,1]],items,offers:[[id(1),100],[id(2),310],[id(3),330],[id(4),110]],saleHistory:[[2,[[50,99],[50,98]]]],pending:[]};
  const p=PL.plan(s,id(0));assert.equal(p.state,'reachable');assert.equal(p.plans[0].cost,100);assert.deepEqual(p.plans[0].steps.map(st=>st.number),[1000]);
  assert.equal(PL.scenario(s,{remove:[[id(1),'sale']]}).evaluate(id(0)).lo.weight,400);
  for(const x of p.plans.slice(1))assert.ok(!p.plans[0].steps.every(st=>x.steps.some(y=>y.id===st.id)),'no alternative is the cheapest plan plus more listings');
});

test('Clearing a large trait never trips the same-block sales limit; only small traits score sales',()=>{
  const big=Array.from({length:14},()=>[0]),prices=Array.from({length:14},(_,i)=>100+i);
  const names=[...big,[1]],s={snapshot:{height:100,collectionFloor:100},collection:{numberStart:0},traits:[['Body','Tan',100,14],['Hair','Red',500,1]],
    items:Object.fromEntries([...names,...Array.from({length:10},()=>[0])].map((idx,i)=>[id(i),[1000+i,...idx]])),offers:[...prices.map((p,i)=>[id(i),p]),[id(14),500]],saleHistory:[]};
  const x=PL.scenario(s,{remove:prices.map((p,i)=>[id(i),'sale'])});assert.equal(x.state,'ready');
  assert.equal(x.trait(0).lo.weight,200,'24 pieces with no listing: +100%');
  const clear=PL.traitOptions(s,0,s.snapshot.collectionFloor).find(o=>o.pct===null);assert.equal(clear.ids.length,14,'clearing takes every listing of the trait');
});
