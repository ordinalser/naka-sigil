'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const PL=require('../src/lib/planner.js'),P=require('../src/lib/purchase.js'),R=require('../src/lib/rules.js');
require('../src/data/snapshot.js');const B=globalThis.SHNAKAS_SNAPSHOT;
const byNumber=n=>Object.keys(B.items).find(id=>B.items[id][0]===n);
const id=n=>String(n).padStart(64,'0')+'i0';
// The official split by hand: one unit earns ⌊26,664,000,000,000 ÷ (1,008 × K)⌋ base units a block, 1,008 blocks a week, 8 decimals.
const rate=K=>Number(26664000000000n/(1008n*BigInt(K))),week=(u,K)=>u*rate(K)*1008/1e8,close=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} vs ${b}`);
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
  // Both buys are sales at the block after the snapshot (100 + 1), the newest of the trait — the pendingSale of purchase.js.
  assert.deepEqual(y.evaluate(id(0)).traits[0].saleHistory,[[100,101],[150,101]]);
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
  // My own listing that sells leaves my holdings; reclaimed it earns again at the steady rate. Listed now, it earns nothing
  // before either way.
  const sold=PL.simulate(s,{kind:'sale',id:id(0)},[id(0),id(1)]);assert.equal(sold.mine.rows.find(r=>r.id===id(0)).after,null);
  assert.deepEqual(sold.mine.rows.find(r=>r.id===id(0)).weeklyBefore,{lo:0,hi:0});
  const back=PL.simulate(s,{kind:'cancel',id:id(0)},[id(0)]);assert.ok(back.mine.rows[0].weeklyAfter.lo>0);assert.deepEqual(back.mine.rows[0].weeklyBefore,{lo:0,hi:0});
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
  // Three pieces, no listing left: scored on the last three sales, here only this purchase at 100 against floor 280 → 0%.
  // Keeping one of ours listed at the line (3 × 280 = 840) would hold +100% for the other, but loses: by hand, bought, all
  // four at 100% are 4 units each of K 16, ours (#1000, #1003) and the piece bought 12 ÷ 16 of the pool; with #1000 listed at
  // the line #1003 and #1001 are 200% (8 units) and #1000 8 more in K 28, earning 16 ÷ 28 — less, so no keepListed advice.
  assert.deepEqual(mine.monopoly.after,{lo:0,hi:0,method:'sales-median'});assert.equal(mine.monopoly.keepListed,undefined);
  // Groups: still held elsewhere → far, one piece missing; all ours once the listing is bought → can.
  const far=PL.lockGroups(rows);assert.ok(far.far.includes(red));assert.equal(far.missing(red),1);assert.ok(!far.can.includes(red)&&!far.have.includes(red));
  assert.ok(PL.lockGroups(PL.lockTraits(s,[id(0),id(3)])).can.some(t=>t.value==='Red'));
  // Every piece ours, one of them listed: free, by reclaiming it, so it leads the group.
  const owned=PL.lockTraits(s,[id(0),id(1),id(3)]).find(r=>r.value==='Red');
  assert.equal(owned.monopoly.state,'possible');assert.deepEqual(owned.monopoly.reclaim.map(x=>x.number),[1001]);assert.equal(owned.monopoly.cost,0);
  assert.ok(PL.lockGroups([owned]).can.includes(owned));
  // What the purchase of #1001 earns us from the next week: 100% (Red 0% on that sale, no number bonus) = 4 units of K 16
  // (all four pieces at 100% once Red is sale-scored and Body Tan is the 280 floor itself): 4 × ⌊26,664,000,000,000 ÷
  // (1,008 × 16)⌋ × 1,008 ÷ 10⁸ = 66,659.99997888. Our change: 8 units of K 19 now (#1002 at 175%) → 8 of K 16, +21,050.53;
  // the total adds the two.
  const m=mine.monopoly;assert.deepEqual(m.bought,{lo:66659.99997888,hi:66659.99997888});
  close(m.change.delta.lo,21050.52630912);assert.equal(m.change.delta.hi,m.change.delta.lo);close(m.total.lo,87710.526288);assert.equal(m.total.hi,m.total.lo);
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
  // Red under +100% once ours: one of ours listed at the exact +100% line, 3 × 140 = 420 (419 gives +75%), would hold +100%
  // for the other two — but it earns nothing while listed: +1 unit for each of the two against the 7 units it earned, a
  // loss, so no advice; nothing to buy or reclaim either, so Red is all ours (`have`).
  assert.equal(R.traitTier(420,140).pct,100);assert.equal(R.traitTier(419,140).pct,75);
  assert.equal(red.monopoly.keepListed,undefined);assert.deepEqual(PL.lockGroups(rows).have.map(t=>t.value),['Red']);assert.deepEqual(PL.lockGroups(rows).can,[]);
  // Red's one sale at 100 instead: 0% now and once ours (100 < 1.25 × 140). Kept at the line, #1000 lifts #1001 and #1002 from
  // 100% to 200%: by hand, ours now 3 × 4 + Tan #1111's 4 = 16 units of K 96 (Red 12, the 20 Tan 80, Blue 4) = 44,439.99985152 a
  // week; with #1000 at 420: #1001, #1002 at 8 and Tan 4 = 20 of K 108 (Red 24) = 49,377.7777248 → +4,937.77787328, so
  // the advice stands, with no listing to remove (without 0) and nothing bought; the trait is still `have`: nothing to buy.
  const w={...s,saleHistory:[[0,[[100,95]]]]},wr=PL.lockTraits(w,[id(0),id(1),id(2),id(11)]),wred=wr.find(r=>r.value==='Red'),k=wred.monopoly.keepListed;
  assert.deepEqual(wred.owned.after,{lo:0,hi:0,method:'sales-median'});
  assert.deepEqual([k.number,k.price,k.floor,k.multiple,k.listed,k.after],[1000,420,140,{num:3,den:1},null,{lo:100,hi:100,method:'floor'}]);
  assert.deepEqual(k.total,{lo:4937.77787328,hi:4937.77787328});assert.deepEqual(k.without.delta,{lo:0,hi:0});assert.deepEqual(k.bought,{lo:0,hi:0});
  close(week(20,108)-week(16,96),4937.77787328);
  assert.deepEqual(PL.lockGroups(wr).have.map(t=>t.value),['Red']);assert.equal(PL.lockGroups(wr).can.length,0);
  // Every listing of Red ours: #1000 at 400 (already over the line 300: kept as it is) and #1001 at 150 (raised to 300 by
  // an edit); #1003–#1005 ours unlisted. Either holds +100% for the other four, so the lower number, kept at its ask.
  const u={snapshot:{height:100,collectionFloor:100},collection:{numberStart:0},traits:[['Hair','Red',150,2],['Hair','Blue',null,0],['Body','Tan',100,1]],
   items:{[id(0)]:[1000,0],[id(1)]:[1001,0],[id(2)]:[1002,2],[id(3)]:[1003,0],[id(4)]:[1004,0],[id(5)]:[1005,0]},offers:[[id(0),400],[id(1),150],[id(2),100]],saleHistory:[]};
  const v=PL.lockTraits(u,[id(0),id(1),id(3),id(4),id(5)]).find(r=>r.idx===0);
  // Reclaimed, Red has no sale: whether its last ask is carried is unknown (0–100%), so no floor range, and the plain total
  // (reclaim both) is a range whose low bound loses; kept listed it is exact: now 3 × 6 = 18 units of K 34 (five Red at
  // 150%, Tan 4) = 141,162.35285376; after, #1001 and #1003–#1005 at 200% = 32 of K 44 = 193,919.99993856 → +52,757.6470848.
  assert.deepEqual(v.owned,{state:'ready',floor:100,after:{lo:0,hi:100,method:'carry-unverified'},stable:false,holds:null});
  assert.ok(v.monopoly.total.lo<0&&v.monopoly.total.hi>0);
  assert.deepEqual([v.monopoly.keepListed.number,v.monopoly.keepListed.price,v.monopoly.keepListed.listed,v.monopoly.keepListed.after.lo],[1000,300,400,100]);
  assert.deepEqual(v.monopoly.keepListed.total,{lo:52757.6470848,hi:52757.6470848});close(week(32,44)-week(18,34),52757.6470848);
  assert.deepEqual(v.monopoly.keepListed.without,v.monopoly.change);
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
  // Nothing to buy or reclaim: all ours (`have`), whether or not a kept listing is advised.
  const held=(idx,extra={})=>({idx,held:3,supply:3,wanted:[],unminted:[],monopoly:{state:'possible',buy:[],reclaim:[],cost:0,...extra}});
  const g=PL.lockGroups([held(8,{keepListed:{total:{lo:9,hi:9}}}),held(9),row(10,500,1)]);assert.deepEqual([g.have.map(t=>t.idx),g.can.map(t=>t.idx)],[[8,9],[10]]);
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
  for(const x of t.targets){if(x.state==='conflict')assert.ok(['self','others','no-floor'].includes(x.reason));else assert.equal(x.reason,null);}
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
   // The same plan as plan() alone, scored in its own world by the official split: this piece's weekly before (its units of
   // K now) and after (its units of the plan's K), the pieces bought (their units of the plan's K: the bundled block is
   // before the last week), total = change + bought and value per 0.001 BTC.
   assert.deepEqual(r.plan.steps.map(st=>st.id),p.plans[0].steps.map(st=>st.id));assert.equal(r.plan.cost,p.plans[0].cost);
   const K0=R.programmeUnits(B),K1=r.plan.K,after=r.plan.scenario.evaluate(r.id);assert.ok(K1.lo!==K0.lo||K1.hi!==K0.hi,'a purchase moves K');
   assert.ok(!B.offers.some(o=>o[0]===r.id),'these targets are unlisted: each earns now');
   assert.deepEqual(r.piece.before,{lo:week(r.before.lo.weight/25,K0.hi),hi:week(r.before.hi.weight/25,K0.lo)});
   assert.deepEqual(r.piece.after,{lo:week(after.lo.weight/25,K1.hi),hi:week(after.hi.weight/25,K1.lo)});
   const units=r.plan.bought.reduce((u,b)=>({lo:u.lo+b.result.lo.weight/25,hi:u.hi+b.result.hi.weight/25}),{lo:0,hi:0});
   assert.deepEqual(r.bought,{lo:week(units.lo,K1.hi),hi:week(units.hi,K1.lo)});
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

test('Every scenario is the next block’s world: the listings already closing are gone from its floors and K, needed or not',()=>{
  // The collection floor 100 is someone else’s #1000 (Body Tan), already being bought; Tan’s other listing #1003 is at 150.
  // Hair Red (4 pieces): mine #1001, unlisted; #1002 at 250, #1004 at 300, #1005 at 450. Now #1001 is 250 ÷ 100 = 2.5× → +75% → 175%.
  const t={snapshot:{height:100,collectionFloor:100},collection:{numberStart:0},traits:[['Body','Tan',100,2],['Hair','Red',250,3]],
   items:{[id(0)]:[1000,0],[id(1)]:[1001,1],[id(2)]:[1002,1],[id(3)]:[1003,0],[id(4)]:[1004,1],[id(5)]:[1005,1]},
   offers:[[id(0),100],[id(2),250],[id(3),150],[id(4),300],[id(5),450]],saleHistory:[],closing:[[id(0),'sale']]};
  assert.equal(R.evaluateSnapshot(t,id(1)).lo.weight,175);assert.deepEqual(R.programmeUnits(t),{lo:36,hi:36});
  // With nothing of ours changed the next block has #1000 gone: floor 150, Red 250 ÷ 150 = 1.67× → +50% → 150%; K 32 (#1000 and
  // #1003 at 100%, the four Red at 150%).
  const base=PL.scenario(t,{});assert.equal(base.floor,150);assert.deepEqual(base.floors.get(0),{floor:150,listed:1});assert.deepEqual([...base.remove],[[id(0),'sale']]);
  assert.equal(base.evaluate(id(1)).lo.weight,150);assert.deepEqual(base.programmeUnits(),{lo:32,hi:32});
  // Buying #1002 alone (Red’s floor 300 = 3 × 100 at this block) is no plan: at the next block 300 ÷ 150 = 2× → +75% → 175%.
  assert.equal(PL.scenario(t,{remove:[[id(2),'sale']]}).evaluate(id(1)).lo.weight,175);
  // The plan buys #1002 and #1004 (550): Red’s floor 450 = 3 × 150 → 200%, K 40; the closing #1000 is no step (under no Red line).
  const p=PL.plan(t,id(1),{goal:200});assert.equal(p.state,'reachable');const x=p.plans[0];
  assert.deepEqual(x.steps.map(st=>[st.number,st.action,st.closing]),[[1002,'sale',false],[1004,'sale',false]]);assert.deepEqual([x.cost,x.floor,x.result.lo.weight,x.K],[550,150,200,{lo:40,hi:40}]);
  for(const y of p.plans)assert.ok(PL.scenario(t,{remove:y.steps.map(st=>[st.id,st.action])}).evaluate(id(1)).lo.weight>=200,'every plan holds in the world where every closing listing is gone');
  const rows=PL.targetPlans(t,{mine:[id(1)],goal:200});assert.deepEqual([rows[0].state,rows[0].auto,rows[0].plan.cost],['reachable',false,550]);
  const j=PL.jointPlan(t,{mine:[id(1)],goal:200});assert.deepEqual([j.state,j.cost,j.steps.map(st=>st.number),j.targets[0].state,j.targets[0].reason,j.targets[0].after.lo.weight],['ready',550,[1002,1004],'reached',null,200]);
  // A closing listing closes only the way it is closing.
  assert.throws(()=>PL.scenario(t,{remove:[[id(0),'cancel']]}),/closing as sale/);
  assert.deepEqual(PL.simulate(t,{kind:'cancel',id:id(0)},[id(1)]),{state:'closing',closing:'sale'});
  assert.deepEqual(PL.simulate({...t,closing:[[id(0),'cancel']]},{kind:'sale',id:id(0)},[id(1)]),{state:'closing',closing:'cancel'});
  // The same kind is the base world itself; the change is still measured from this block: #1001 7 units of K 36 → 6 of K 32,
  // 51,846.66661104 → 49,994.99995392 a week.
  const sim=PL.simulate(t,{kind:'sale',id:id(0)},[id(1)]);assert.deepEqual([sim.state,sim.floor,sim.K],['ready',150,{before:{lo:36,hi:36},after:{lo:32,hi:32}}]);
  assert.deepEqual(sim.mine.rows[0].weeklyAfter,{lo:49994.99995392,hi:49994.99995392});close(sim.mine.delta.lo,-1851.66665712);assert.equal(sim.mine.delta.hi,sim.mine.delta.lo);
  assert.deepEqual([week(7,36),week(6,32)],[51846.66661104,49994.99995392]);
  // Safe asks for #1001 are judged in that world: from 225 (Red’s floor 225 ÷ 150 = 1.5× keeps +50%; from 250 its floor stays
  // 250) nothing else moves; under 225 Red drops. At this block (floor 100) 200 would already be safe.
  assert.deepEqual(PL.safeAsk(t,id(1)),{state:'ready',runs:[{min:225,below:null}]});
  // Every listing closing: nothing is left to price against.
  const one={snapshot:{height:100,collectionFloor:100},collection:{numberStart:0},traits:[['Hair','Red',100,1]],items:{[id(0)]:[1000,0],[id(1)]:[1001,0]},offers:[[id(0),100]],saleHistory:[],closing:[[id(0),'sale']]};
  assert.deepEqual(PL.safeAsk(one,id(1)),{state:'no-floor'});assert.equal(PL.simulate(one,{kind:'sale',id:id(0)}).state,'no-floor');
  // A closing record must name an open listing.
  assert.throws(()=>PL.index({...one,closing:[[id(1),'sale']]}),/not an open listing/);
});

test('In the last reward week a piece that starts earning (reclaimed or bought) adds nothing: plans, simulate, owning a trait',()=>{
  // Hair Red’s floor is my listing #1000 at the collection floor 100 (1×); reclaimed, Red’s floor is #1003 at 300 = 3× → +100%,
  // so #1001 (mine, unlisted) goes 100% → 200% and #1000 earns again. By hand: K 16 → 28 (#1000, #1001, #1003 at 200%, #1002 at
  // 100%); #1001 4 units of K 16 = 66,659.99997888 → 8 of K 28 = 76,182.85713024 (+9,522.85715136); #1000 would add
  // 76,182.85713024 a week — only when a reward week follows. Week 78 (the last) starts at 971,700 + 77 × 1,008 + 1: ten blocks
  // before its end a note made at the next block has no week left.
  const t={snapshot:{height:100,collectionFloor:100},collection:{numberStart:0},traits:[['Hair','Red',100,2],['Body','Tan',100,1]],
   items:{[id(0)]:[1000,0],[id(1)]:[1001,0],[id(2)]:[1002,1],[id(3)]:[1003,0]},offers:[[id(0),100],[id(2),100],[id(3),300]],saleHistory:[]};
  const H=971700+78*1008-10,last={...t,snapshot:{...t.snapshot,height:H}};assert.equal(R.startWeek(H+1),78);
  const own=[id(0),id(1)],piece={before:{lo:66659.99997888,hi:66659.99997888},after:{lo:76182.85713024,hi:76182.85713024}};
  assert.deepEqual([week(4,16),week(8,28)],[66659.99997888,76182.85713024]);
  assert.deepEqual(PL.weeklyChange(t,[id(1)],PL.scenario(t,{remove:[[id(0),'cancel']]})),{...piece,delta:{lo:9522.85715136,hi:9522.85715136}},'after is this piece’s units of the K after');
  for(const [s,start] of [[t,76182.85713024],[last,0]]){
   const rows=PL.targetPlans(s,{mine:own,goal:200}),r1=rows.find(r=>r.number===1001),r0=rows.find(r=>r.number===1000);
   assert.deepEqual(r1.plan.steps.map(st=>[st.number,st.action]),[[1000,'cancel']]);assert.deepEqual(r1.piece,piece);
   close(r1.change.lo,9522.85715136+start);assert.equal(r1.change.hi,r1.change.lo);assert.deepEqual(r1.bought,{lo:0,hi:0});assert.deepEqual(r1.total,r1.change);assert.equal(r1.value,null);
   assert.deepEqual(r0.piece,{before:{lo:0,hi:0},after:{lo:start,hi:start}});
   const sim=PL.simulate(s,{kind:'cancel',id:id(0)},own);
   assert.deepEqual(sim.mine.rows.map(r=>[r.weeklyBefore,r.weeklyAfter]),[[{lo:0,hi:0},{lo:start,hi:start}],[piece.before,piece.after]]);
   assert.deepEqual(sim.mine.after,{lo:piece.after.lo+start,hi:piece.after.hi+start});close(sim.mine.delta.lo,9522.85715136+start);assert.equal(sim.mine.delta.hi,sim.mine.delta.lo);
   // Owning Red: buy #1003 (300, scored as Red’s sale 3 × 100 → +100%) and reclaim #1000; what #1003 earns us, 8 units of K 28,
   // counts from the next week only.
   const m=PL.lockTraits(s,own).find(r=>r.idx===0).monopoly;assert.deepEqual([m.state,m.cost,m.buy.map(b=>b.number),m.reclaim.map(b=>b.number),m.after.lo],['possible',300,[1003],[1000],100]);
   close(m.change.delta.lo,9522.85715136+start);assert.deepEqual(m.bought,{lo:start,hi:start});close(m.total.lo,9522.85715136+2*start);
   // Buying #1000 instead (#1001 alone ours): the piece bought is in `bought`, so total and value follow the same week rule.
   const buy=PL.targetPlans(s,{mine:[id(1)],goal:200})[0];assert.deepEqual(buy.plan.steps.map(st=>[st.number,st.action]),[[1000,'sale']]);
   assert.deepEqual(buy.piece,piece);close(buy.change.lo,9522.85715136);assert.deepEqual(buy.bought,{lo:start,hi:start});close(buy.total.lo,9522.85715136+start);close(buy.value,(9522.85715136+start)/100*1e5);
   const j=PL.jointPlan(s,{mine:own,goal:200});close(j.change.me.delta.lo,9522.85715136+start);assert.deepEqual(j.weekly[id(0)],{before:{lo:0,hi:0},after:{lo:start,hi:start}});assert.deepEqual(j.weekly[id(1)],piece);
  }
});

test('Joint plan: a target refused beside the first picks is tried again beside later ones; a conflict says why',()=>{
  // The collection floor 95 is #1003 (Hair X). Targets, all mine and unlisted: #1000 (X and Body Y), #1001 (Eyes V), #1002 (Y).
  // Listings, all someone else’s: X #1003 at 95, #1004 at 440; V #1005 at 100, #1006 at 450; Y #1007 at 160, #1008 at 1000;
  // Back Tan #1009 at 150. Goal 200%. Alone: #1000 buys #1003 (X’s floor 440 ≥ 3 × the floor 100 left) for 95; #1001 buys
  // #1005 (V 450 = 4.7 × 95) for 100; #1002 buys #1007 (Y 1000) for 160.
  const mk=v2=>({snapshot:{height:100,collectionFloor:95},collection:{numberStart:0},traits:[['Hair','X',95,2],['Eyes','V',100,2],['Body','Y',160,2],['Back','Tan',150,1]],
   items:{[id(0)]:[1000,0,2],[id(1)]:[1001,1],[id(2)]:[1002,2],[id(3)]:[1003,0],[id(4)]:[1004,0],[id(5)]:[1005,1],[id(6)]:[1006,1],[id(7)]:[1007,2],[id(8)]:[1008,2],[id(9)]:[1009,3]},
   offers:[[id(3),95],[id(4),440],[id(5),100],[id(6),v2],[id(7),160],[id(8),1000],[id(9),150]],saleHistory:[]});
  const s=mk(450);
  assert.deepEqual([id(0),id(1),id(2)].map(x=>{const p=PL.plan(s,x,{goal:200,limit:5});return [p.state,p.plans[0].cost,p.plans[0].steps.map(st=>st.number)];}),[['reachable',95,[1003]],['reachable',100,[1005]],['reachable',160,[1007]]]);
  // Cheapest first: #1000 is taken (buy #1003; the floor becomes 100). #1001’s only plan beside it buys #1005 too: the floor
  // rises to 150 (Tan), X 440 ÷ 150 = 2.9× → +75% and Y 160 ÷ 150 → 0%, so #1000 falls to 175% — refused. #1002 is taken (buy
  // #1007: Y 1000). Beside both, #1001 fits: #1000 keeps 275% (X +75%, Y +100%) at floor 150, #1001 V 450 = 3 × 150 → 200%.
  const j=PL.jointPlan(s,{mine:[id(0),id(1),id(2)],goal:200});
  assert.deepEqual(j.targets.map(x=>[x.number,x.state,x.reason,x.after.lo.weight]),[[1000,'reached',null,275],[1001,'reached',null,200],[1002,'reached',null,200]]);
  assert.deepEqual([j.cost,j.scenario.floor,j.steps.map(st=>[st.number,st.price,st.serves.map(y=>y.number)])],[355,150,[[1003,95,[1000]],[1005,100,[1001]],[1007,160,[1002]]]]);
  // Without #1002 nothing lifts #1000 again: #1001’s plan reaches 200% itself but pulls #1000 under the goal.
  const two=PL.jointPlan(s,{mine:[id(0),id(1),id(2)],targets:[id(0),id(1)],goal:200});
  assert.deepEqual(two.targets.map(x=>[x.number,x.state,x.reason,x.after.lo.weight]),[[1000,'reached',null,250],[1001,'conflict','others',100]]);assert.deepEqual([two.cost,two.steps.map(st=>st.number)],[95,[1003]]);
  // V’s second listing at 299: beside #1000’s plan the floor 150 puts it under V’s +100% line (450), so #1001’s plan buys both
  // and V scores its two sales, 100 and 299, mean 199.5 ÷ 150 = 1.33× → +25%: #1001 itself stops at 125%.
  const self=PL.jointPlan(mk(299),{mine:[id(0),id(1)],goal:200});
  assert.deepEqual(self.targets.map(x=>[x.number,x.state,x.reason]),[[1000,'reached',null],[1001,'conflict','self']]);
  // Two listings in the market: #1000 (Hair X, 22 pieces) needs the floor #1002 bought (X zero-listed: +100%); #1001 (Eyes V,
  // 3 pieces, one sale at 900) needs #1003 bought (V scores 250 and 900, mean 575 = 5.75 × 100). Together nothing is left to
  // price against.
  const items={[id(0)]:[1000,0],[id(1)]:[1001,1],[id(2)]:[1002,0],[id(3)]:[1003,1],[id(4)]:[1004,1]};for(let i=0;i<20;i++)items[id(10+i)]=[1100+i,0];
  const n={snapshot:{height:100,collectionFloor:100},collection:{numberStart:0},traits:[['Hair','X',100,1],['Eyes','V',250,1]],items,offers:[[id(2),100],[id(3),250]],saleHistory:[[1,[[900,90]]]]};
  assert.deepEqual([id(0),id(1)].map(x=>{const p=PL.plan(n,x,{goal:200});return [p.state,p.plans[0].cost,p.plans[0].floor];}),[['reachable',100,250],['reachable',250,100]]);
  const nf=PL.jointPlan(n,{mine:[id(0),id(1)],goal:200});
  assert.deepEqual(nf.targets.map(x=>[x.number,x.state,x.reason]),[[1000,'reached',null],[1001,'conflict','no-floor']]);assert.deepEqual([nf.cost,nf.steps.map(st=>st.number)],[100,[1002]]);
});

test('Tier lines round up, unminted catalog rows are indexed and move K, an official value needs an unmoved floor',()=>{
  // The smallest ask meeting a tier rounds up: at floor 101, 1.25× is 126.25 → 127 (126 misses), 1.5× 151.5 → 152, 2× 202, 3× 303.
  const tiers=Object.fromEntries(R.RULES.traitTiers.map(t=>[t.pct,t]));
  assert.deepEqual([25,50,75,100].map(pct=>PL.threshold(tiers[pct],101)),[127,152,202,303]);assert.deepEqual([25,50,75,100].map(pct=>PL.threshold(tiers[pct],100)),[125,150,200,300]);
  assert.equal(R.traitTier(127,101).pct,25);assert.equal(R.traitTier(126,101).pct,0);
  // Not-yet-minted catalog rows are indexed and move K: Hair Red #1000 at 100 (the floor, with Body Tan #1002 at 100), #1001 at
  // 150 and the unminted #1500. Buying #1000: Red’s floor 150 = 1.5× → +50%, the three Red rows 4 → 6 units each, K 16 → 22.
  const fx={snapshot:{height:100,collectionFloor:100},collection:{numberStart:0},traits:[['Hair','Red',100,2],['Hair','Blue',null,0],['Body','Tan',100,1]],
   items:{[id(0)]:[1000,0],[id(1)]:[1001,0],[id(2)]:[1002,2]},offers:[[id(0),100],[id(1),150],[id(2),100]],pending:[[1500,0]],saleHistory:[]};
  assert.ok(PL.index(fx).rows.has('pending:0'));assert.deepEqual(R.programmeUnits(fx),{lo:16,hi:16});
  const x=PL.scenario(fx,{remove:[[id(0),'sale']]});assert.deepEqual(x.programmeUnits(),{lo:22,hi:22});assert.deepEqual(x.unitChange(),{lo:6,hi:6});
  assert.deepEqual(x.changed().map(c=>c.key).sort(),[id(0),id(1),'pending:0'].sort());assert.equal(x.evaluate('pending:0').lo.weight,150);
  // An official rare-trait value holds only while the collection floor and the trait’s inputs are unchanged: Hair Blue (#1003
  // alone, unlisted, no sale history loaded) is +75% by the official basis; buying #1001 (not the floor) keeps it, buying the
  // floor #1000 (floor 100 → 150) drops it to the unknown 0–100%.
  const o={snapshot:{height:100,collectionFloor:100},collection:{numberStart:0},traits:[['Hair','Red',100,2],['Hair','Blue',null,0],['Body','Tan',300,1]],
   items:{[id(0)]:[1000,0],[id(1)]:[1001,0],[id(2)]:[1002,2],[id(3)]:[1003,1]},offers:[[id(0),100],[id(1),150],[id(2),300]],rewardBasis:{height:100,traits:[[1,75,'sales',1]]}};
  assert.equal(R.evaluateSnapshot(o,id(3)).lo.weight,175);
  const keep=PL.scenario(o,{remove:[[id(1),'sale']]}).evaluate(id(3));assert.deepEqual([keep.traits[0].method,keep.traits[0].pct,keep.lo.weight],['official-sales',75,175]);
  const drop=PL.scenario(o,{remove:[[id(0),'sale']]}).evaluate(id(3));assert.deepEqual([drop.traits[0].method,drop.traits[0].measured,drop.lo.weight,drop.hi.weight],['missing-sale',false,100,200]);
});

test('Owning a trait with no listing is scored in the next block’s world, and a kept listing must beat doing nothing there',()=>{
  // Hair Blue is #1002 alone, mine, unlisted, one sale at 300. The collection floor 100 is Hair Red #1000, already being bought;
  // Body Tan #1001 at 150 stays. Now Blue is 3× → +100%; from the next block the floor is 150: 2× → +75%, held from 101 (at
  // 100, 3×) to 150 (at 151, under 2×). Nothing to buy or reclaim, and listing the only piece earns nothing: no advice.
  const a={snapshot:{height:100,collectionFloor:100},collection:{numberStart:0},traits:[['Hair','Red',100,1],['Body','Tan',150,1],['Hair','Blue',null,0]],
   items:{[id(0)]:[1000,0],[id(1)]:[1001,1],[id(2)]:[1002,2]},offers:[[id(0),100],[id(1),150]],saleHistory:[[2,[[300,90]]]],closing:[[id(0),'sale']]};
  const la=PL.lockTraits(a,[id(2)]).find(r=>r.idx===2);
  assert.deepEqual([la.bonus,la.maxNow],[{lo:100,hi:100,method:'sales-median'},true]);
  assert.deepEqual(la.owned,{state:'ready',floor:150,after:{lo:75,hi:75,method:'sales-median'},stable:false,holds:{min:101,max:150}});
  assert.deepEqual(la.monopoly,{state:'possible',buy:[],reclaim:[],reclaiming:[],cost:0,after:{lo:75,hi:75,method:'sales-median'}});
  // Hair Blue: nine pieces, all mine, unlisted, one sale at 250 = 2.5× the floor 100 (Body Tan #1000, open): +75% now and at the
  // next block. Eyes Purple (19 pieces, others’) has its listing #1200 at 300 being reclaimed: from the next block Purple scores
  // its sale at 100 → 0%, its pieces 200% → 100%, and K falls from 455 (Blue 63, Purple 152, 60 Tan 240) to 379, lifting what
  // our 63 units earn by 7,403.36 a week with nothing done. #1002 kept listed at 300 (3×) puts the other eight at 200%: 64
  // units of K 388, +7,062.47 against now — a gain, but less than doing nothing, so no advice; Blue is all ours (`have`).
  const items={[id(0)]:[1000,0]};for(let i=0;i<59;i++)items[id(100+i)]=[1100+i,0];for(let i=2;i<=10;i++)items[id(i)]=[1000+i,1];for(let i=0;i<19;i++)items[id(200+i)]=[1200+i,2];
  const b={snapshot:{height:100,collectionFloor:100},collection:{numberStart:0},traits:[['Body','Tan',100,1],['Hair','Blue',null,0],['Eyes','Purple',300,1]],items,
   offers:[[id(0),100],[id(200),300]],saleHistory:[[1,[[250,90]]],[2,[[100,90]]]],closing:[[id(200),'cancel']]};
  const own=Object.keys(items).filter(k=>items[k][1]===1),rows=PL.lockTraits(b,own),lb=rows.find(r=>r.idx===1);
  assert.deepEqual([R.programmeUnits(b),PL.scenario(b,{}).programmeUnits()],[{lo:455,hi:455},{lo:379,hi:379}]);
  assert.deepEqual([lb.held,lb.bonus.lo,lb.owned.after,lb.owned.holds,lb.monopoly.state,lb.monopoly.keepListed],[9,75,{lo:75,hi:75,method:'sales-median'},{min:84,max:125},'possible',undefined]);
  const nothing=PL.weeklyChange(b,own,PL.scenario(b,{})).delta,kept=PL.weeklyChange(b,own,PL.scenario(b,{add:[[id(2),300]]})).delta;
  assert.deepEqual([nothing,kept],[{lo:7403.359824,hi:7403.359824},{lo:7062.47131968,hi:7062.47131968}]);
  close(week(63,379)-week(63,455),7403.359824);close(week(64,388)-week(63,455),7062.47131968);
  assert.deepEqual(PL.lockGroups(rows).have.map(t=>t.value),['Blue']);
});

test('Incremental target batches preserve the complete planner order and exact shared result',()=>{
 const s=fixture([100,160,300,null],[[0],[0],[1],[0,2]],[1000,1001,1002,1003]);s.snapshot.height=971800;
 const mine=[id(0),id(1),id(2),id(3)],opts={mine,goal:200};
 const full=PL.targetPlans(s,opts),batched=mine.flatMap(target=>PL.targetPlans(s,{...opts,targets:[target]})).sort(PL.targetPlanOrder);
 const view=rows=>rows.map(r=>({id:r.id,state:r.state,auto:r.auto,best:r.best,total:r.total,value:r.value,cost:r.plan?.cost,buys:r.plan?.buys}));
 assert.deepEqual(view(batched),view(full));
});

test('Incremental component batches retain full-trait ownership, advice, values and ordering',()=>{
 const s=fixture([100,160,300,null],[[0],[0],[1],[0,2]],[1000,1001,1002,1003]);s.snapshot.height=971800;const own=[id(1),id(3)];
 const full=PL.lockTraits(s,own),chunks=[0,1,2].flatMap(idx=>PL.lockTraits(s,own,[idx])).sort(PL.lockTraitOrder);
 assert.deepEqual(JSON.parse(JSON.stringify(chunks)),JSON.parse(JSON.stringify(full)));
});
