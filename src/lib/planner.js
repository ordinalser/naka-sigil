/**
 * Trait planner: exact what-if for several listing changes at one block, and the plans built on it. Pure: no DOM, no network.
 *
 * Basis (official engine and /rewards/weights): every block re-scores every piece from the listings active after that block
 * (trait floor ÷ collection floor), the last three sales of small zero-listed traits, and the number tier; a week pays the
 * sum over its 1,008 blocks. A change therefore moves other holders' weights from the block it confirms in. The piece that
 * changes hands itself earns from the next week, and the week in which a holding is listed earns nothing for it.
 *
 * A scenario removes listings (bought: a new newest sale for each of its traits; reclaimed: no sale) and adds listings
 * (one of my unlisted pieces at a price). Rows are re-evaluated with the same rules engine as the single-sale model in
 * purchase.js; official rare-trait values are kept only while every input of that trait is unchanged.
 *
 * Listings the market already marks as closing (snap.closing: bought and confirming, or being reclaimed) close at the
 * next block whatever we do: a plan that needs one gone takes it at no cost and nobody can buy it. That holds for ours
 * too: one someone is buying can no longer be reclaimed, it sells and leaves our holdings at that block. Closing listings
 * a plan does not need still count in its floors, as they do at this block.
 */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./rules.js'):root.ShnakasRules);if(typeof module==='object'&&module.exports)module.exports=api;else root.NakaPlanner=api;})(typeof globalThis!=='undefined'?globalThis:this,function(R){
 'use strict';
 const GOAL=R.RULES.capPct,TIERS=[...R.RULES.traitTiers].reverse(); // ascending: +25 … +100
 /** Smallest ask that still meets a tier (num/den × collection floor), exactly as rules.traitTier compares. */
 const threshold=(tier,F)=>Number((BigInt(F)*BigInt(tier.num)+BigInt(tier.den)-1n)/BigInt(tier.den));
 const tierOf=pct=>TIERS.find(t=>t.pct===pct)??null;

 // ---------------------------------------------------------------- Indexes shared by every scenario of one snapshot.
 const indexes=new WeakMap();
 function index(snap){
  if(indexes.has(snap))return indexes.get(snap);
  const rows=[...Object.entries(snap.items),...(snap.pending??[]).map((row,i)=>['pending:'+i,row])];
  const byTrait=new Map(),offersByTrait=new Map(),offers=new Map(snap.offers),closing=new Map(snap.closing??[]);
  for(const [key,row] of rows)for(const idx of row.slice(1)){if(!byTrait.has(idx))byTrait.set(idx,[]);byTrait.get(idx).push(key);}
  for(const [id,price] of snap.offers)for(const idx of snap.items[id].slice(1)){if(!offersByTrait.has(idx))offersByTrait.set(idx,[]);offersByTrait.get(idx).push([id,price]);}
  for(const list of offersByTrait.values())list.sort((a,b)=>a[1]-b[1]||a[0].localeCompare(b[0]));
  const before=new Map(rows.map(([key,row])=>[key,R.evaluate({number:row[0],traits:R.snapshotTraits(snap,row.slice(1))},snap.snapshot.collectionFloor)]));
  const units=new Map([...before].map(([key,r])=>[key,R.units(r)]));
  const value={rows:new Map(rows),byTrait,offersByTrait,offers,closing,before,units};indexes.set(snap,value);return value;
 }
 const rowOf=(snap,key)=>index(snap).rows.get(key);
 const numberOf=(snap,id)=>snap.items[id][0];
 /** A listing someone is already buying (confirming in the next block): for its lister the piece leaves at that block. */
 const sold=(snap,id)=>index(snap).closing.get(id)==='sale';
 /** Whether a piece bought now (its note made at the next block) still has a reward week to earn in. */
 const laterWeek=snap=>R.startWeek(snap.snapshot.height+1)<R.RULES.weeks;

 // ---------------------------------------------------------------- Scenario: several removals and additions at once.
 /**
  * changes: {remove:[[id,'sale'|'cancel'],…], add:[[id,price],…], reprice:[[id,price],…]}. Removed ids must be listed;
  * added ids must be unlisted catalog pieces; repriced ids are open listings that stay listed at a new ask (the wallet's
  * Edit price: no delist; a listing already closing cannot be edited). Prices are positive integers in sats. Buys are new
  * sales one block after the snapshot, all in that same block: when their order changes a small trait's last-three-sales
  * window, the rules engine keeps both bounds.
  */
 function scenario(snap,changes={}){
  const I=index(snap),H=snap.snapshot.height,F=snap.snapshot.collectionFloor;
  const remove=new Map(changes.remove??[]),add=new Map(changes.add??[]),reprice=new Map(changes.reprice??[]);
  const ask=p=>{if(!Number.isSafeInteger(p)||p<=0)throw new Error('Listing price must be a positive integer in sats');};
  for(const [id,action] of remove){if(!I.offers.has(id))throw new Error(`Not listed: ${id}`);if(!['sale','cancel'].includes(action))throw new Error('Unknown removal');}
  for(const [id,price] of add){if(!Object.hasOwn(snap.items,id)||I.offers.has(id)||remove.has(id))throw new Error(`Cannot list: ${id}`);ask(price);}
  for(const [id,price] of reprice){if(!I.offers.has(id)||remove.has(id)||I.closing.has(id))throw new Error(`Cannot edit the price: ${id}`);ask(price);}
  const offers=[...snap.offers.filter(([id])=>!remove.has(id)).map(([id,p])=>[id,reprice.has(id)?reprice.get(id):p]),...add];
  if(!offers.length)return {state:'no-floor',remove,add,reprice};
  let floor=Infinity;const floors=new Map();
  for(const [id,price] of offers){floor=Math.min(floor,price);for(const idx of snap.items[id].slice(1)){const t=floors.get(idx);floors.set(idx,{floor:Math.min(t?.floor??Infinity,price),listed:(t?.listed??0)+1});}}
  const touched=new Set(),cancelled=new Set(),pending=new Map();
  for(const [id,action] of remove)for(const idx of snap.items[id].slice(1)){touched.add(idx);if(action==='cancel')cancelled.add(idx);else{if(!pending.has(idx))pending.set(idx,[]);pending.get(idx).push(I.offers.get(id));}}
  for(const id of [...add.keys(),...reprice.keys()])for(const idx of snap.items[id].slice(1))touched.add(idx);
  const moved=new Set([...touched].filter(idx=>(floors.get(idx)?.floor??null)!==snap.traits[idx][2]));
  /** One trait's rule inputs in this scenario: new floor and listing count, buys as the newest sales, official values only
   * while untouched under the same collection floor, and the unknown carry of a small sale-less trait whose last ask went. */
  function traitInput(t,idx){
   const f=floors.get(idx),preserve=floor===F&&!touched.has(idx),sales=pending.get(idx);
   const history=sales&&t.saleHistory!==undefined?[...sales.map(p=>[p,H+1]),...t.saleHistory]:t.saleHistory;
   const carryUnknown=t.supply<R.RULES.heldSupply&&!f&&t.saleHistory?.length===0&&!sales&&((cancelled.has(idx)&&t.floor!==null&&R.traitTier(t.floor,F).pct>0)||(!preserve&&t.officialSource==='lastBlock'&&t.officialPct>0));
   const row={...t,floor:f?.floor??null,listed:f?.listed??0,...(carryUnknown?{carryUnknown:true}:{}),...(history!==undefined?{saleHistory:history}:{})};
   if(!preserve){delete row.officialPct;delete row.officialSource;}
   return row;
  }
  function evaluateRow([number,...ids]){return R.evaluate({number,traits:R.snapshotTraits(snap,ids).map((t,i)=>traitInput(t,ids[i]))},floor);}
  /** A trait value alone (a number with no bonus) in this scenario: its bonus as the rules engine scores it. */
  function trait(idx){return R.evaluate({number:9999,traits:[traitInput(R.snapshotTraits(snap,[idx])[0],idx)]},floor);}
  const cache=new Map();
  function evaluate(key){if(cache.has(key))return cache.get(key);const row=rowOf(snap,key);if(!row)return null;const r=evaluateRow(row);cache.set(key,r);return r;}
  /** Catalog rows whose weight can differ from the snapshot: all of them when the collection floor moves, otherwise rows
   * sharing a trait whose floor moved. Everything else keeps its snapshot result. */
  function affected(){if(floor!==F)return [...I.rows.keys()];const out=new Set();for(const idx of moved)for(const key of I.byTrait.get(idx)??[])out.add(key);return [...out];}
  let total=null,change=null;
  /** Programme units K after the scenario, and K after − K before row by row in one world (rules.weightChange). */
  function programmeUnits(){
   if(total)return total;const t={...R.programmeUnits(snap)},d={lo:0,hi:0};
   for(const key of affected()){const before=I.units.get(key),r=evaluate(key),after=R.units(r),w=R.weightChange(I.before.get(key),r,floor===F);
    t.lo+=after.lo-before.lo;t.hi+=after.hi-before.hi;d.lo+=w.lo/R.RULES.unitPct;d.hi+=w.hi/R.RULES.unitPct;}
   change=d;return total=t;
  }
  function unitChange(){if(!change)programmeUnits();return change;}
  /** Rows whose weight changes, with before and after results. */
  function changed(){const out=[];for(const key of affected()){const a=I.before.get(key),b=evaluate(key);if(a.lo.weight!==b.lo.weight||a.hi.weight!==b.hi.weight)out.push({key,before:a,after:b});}return out;}
  return {state:'ready',floor,beforeFloor:F,remove,add,reprice,floors,moved,evaluate,trait,programmeUnits,unitChange,changed};
 }

 // ---------------------------------------------------------------- Holdings arithmetic on a scenario.
 const sum=(a,b)=>({lo:a.lo+b.lo,hi:a.hi+b.hi}),zero={lo:0,hi:0};
 /** Pieces listed after a scenario (listed now and not removed, plus the ones it lists; a repriced one stays listed). */
 const listedAfter=(snap,s)=>new Set([...snap.offers.map(o=>o[0]).filter(id=>!s?.remove?.has(id)),...(s?.add?.keys()??[])]);
 /** Which of my pieces earn: at the snapshot (s null) the unlisted ones; after a scenario the ones neither listed then nor
  * sold in it (`ids` are ours, so a sale among them is someone buying our listing: the piece leaves us). */
 function earning(snap,s){const listed=listedAfter(snap,s);return s===null?id=>!listed.has(id):id=>!listed.has(id)&&s.remove.get(id)!=='sale';}
 /** Units that earn among `ids`, at the snapshot (s null) or after a scenario. */
 function earningUnits(snap,ids,s){const earns=earning(snap,s);return ids.filter(earns).reduce((u,id)=>sum(u,R.units(s?s.evaluate(id):R.evaluateSnapshot(snap,id))),{lo:0,hi:0});}
 /**
  * Weekly SHNAKAS of `ids` (pieces of ours) before and after a scenario, and the change in one world: a holding that earns
  * on both sides adds its own one-world weight change, one that starts or stops earning (listed, reclaimed, or sold away)
  * adds or drops all its units, and K moves by the scenario's one-world unit change (rules.weeklyChangeBounds).
  */
 function weeklyChange(snap,ids,s){
  const K0=R.programmeUnits(snap),before=R.weeklyAllocation(earningUnits(snap,ids,null),K0),after=R.weeklyAllocation(earningUnits(snap,ids,s),s.programmeUnits());
  const earnsNow=earning(snap,null),earnsThen=earning(snap,s),sameFloor=s.floor===snap.snapshot.collectionFloor;let dU={lo:0,hi:0};
  for(const id of ids){
   const earnsBefore=earnsNow(id),earnsAfter=earnsThen(id),b=R.evaluateSnapshot(snap,id);
   if(earnsBefore&&earnsAfter){const w=R.weightChange(b,s.evaluate(id),sameFloor);dU=sum(dU,{lo:w.lo/R.RULES.unitPct,hi:w.hi/R.RULES.unitPct});}
   else if(earnsAfter)dU=sum(dU,R.units(s.evaluate(id)));
   else if(earnsBefore){const u=R.units(b);dU=sum(dU,{lo:-u.hi,hi:-u.lo});}
  }
  return {before,after,delta:R.weeklyChangeBounds(earningUnits(snap,ids,null),dU,K0,s.unitChange())};
 }

 // ---------------------------------------------------------------- Trait bonuses.
 /** One trait value on its own (number with no bonus), so its bonus comes from exactly the rules engine. */
 function traitBonus(snap,idx){return R.evaluate({number:9999,traits:R.snapshotTraits(snap,[idx])},snap.snapshot.collectionFloor);}
 const pctOf=r=>({lo:r.lo.weight-R.RULES.basePct,hi:r.hi.weight-R.RULES.basePct,method:r.traits[0].method});

 // ---------------------------------------------------------------- Plans to raise one piece.
 /** Listings of a trait priced under `line`. */
 const below=(snap,idx,line)=>(index(snap).offersByTrait.get(idx)??[]).filter(([,p])=>p<line).map(([id])=>id);
 /**
  * Options for one trait at collection floor F: each tier (the listings priced under its line), and clearing every
  * listing (the bonus then comes from the zero-listing rules: +100% from 20 pieces, a smaller trait its last three sales).
  * Every tier stays an option, even one at or below today's: once purchases raise the collection floor every line moves
  * up, and a lower tier can then be the cheaper way to the goal.
  */
 function traitOptions(snap,idx,F){
  const list=index(snap).offersByTrait.get(idx)??[];if(!list.length)return [];
  const out=TIERS.map(t=>({idx,pct:t.pct,ids:below(snap,idx,threshold(t,F))})).filter(o=>o.ids.length<list.length);
  out.push({idx,pct:null,ids:list.map(([id])=>id)});return out;
 }
 /** How a listing leaves in a plan: one already closing as it closes, whoever's it is (a listing of ours someone is buying
  * can no longer be reclaimed: it sells and leaves us), any other of ours reclaimed, any other bought. */
 const removal=(snap,id,own)=>{const c=index(snap).closing;return c.has(id)?c.get(id):own.has(id)?'cancel':'sale';};
 /** Grow a removal set until every chosen trait clears its line at the collection floor that the set itself leaves. */
 function settle(snap,choice,own){
  const remove=new Map();let F=snap.snapshot.collectionFloor;
  for(let round=0;round<=snap.offers.length;round++){
   for(const o of choice)for(const id of o.pct===null?o.ids:below(snap,o.idx,threshold(tierOf(o.pct),F)))if(!remove.has(id))remove.set(id,removal(snap,id,own));
   const rest=snap.offers.filter(([id])=>!remove.has(id));if(!rest.length)return {remove,F:null};
   const next=Math.min(...rest.map(o=>o[1]));if(next===F)return {remove,F};F=next;
  }
  throw new Error('Removal set did not settle');
 }
 /** What a removal set (from `removal`) costs me: purchases of open listings; reclaims and listings already closing (ours
  * included) are free. */
 const costOf=(snap,remove)=>{let cost=0,buys=0,cancels=0,closing=0;const I=index(snap);for(const [id,a] of remove){if(I.closing.has(id))closing++;else if(a==='sale'){cost+=I.offers.get(id);buys++;}else cancels++;}return {cost,buys,cancels,closing};};
 /**
  * Cheapest ways to bring `id` to `goal` weight (default the 400% cap) at this block, buying listings (or reclaiming the
  * ones in `own`). Combinations of trait tiers are tried from the lowest estimated cost (the asks under each line at the
  * current collection floor); each is settled against the floor it leaves and scored exactly. Settling only adds listings,
  * so once `limit` plans are found, no cheaper estimate is left unchecked; a plan that only adds listings to a cheaper one
  * is no alternative and is left out. When the goal is out of reach, the highest weight any combination reaches is found
  * the same way (estimates bound the settled result), and each trait that stops short is explained.
  */
 function plan(snap,id,{own=new Set(),goal=GOAL,limit=3}={}){
  if(!Object.hasOwn(snap.items,id))return {state:'missing'};
  const before=R.evaluateSnapshot(snap,id),number=before.number.pct,traitIdx=snap.items[id].slice(1),F=snap.snapshot.collectionFloor,I=index(snap);
  const ceiling=Math.min(R.RULES.capPct,R.RULES.basePct+number+traitIdx.length*R.MAX_TRAIT_PCT);
  const base={id,number:numberOf(snap,id),before,ceiling,goal};
  if(before.lo.weight>=goal)return {...base,state:'done',best:before.lo.weight,plans:[],why:[]};
  const now=i=>before.traits[i].measured?before.traits[i].pct:before.traits[i].pctLo;
  const per=traitIdx.map(idx=>[null,...traitOptions(snap,idx,F)]);
  const optimistic=(o,i)=>o===null?now(i):o.pct??R.MAX_TRAIT_PCT;
  const score=choice=>{const {remove,F:after}=settle(snap,choice,own);if(after===null)return {remove,state:'no-floor'};const sc=scenario(snap,{remove:[...remove]});if(sc.state!=='ready')return {remove,state:sc.state};return {remove,state:'ready',result:sc.evaluate(id),s:sc,picked:choice,...costOf(snap,remove)};};
  const estimate=picked=>{const ids=new Set(picked.flatMap(o=>o.ids));let cost=0;for(const x of ids)if(!own.has(x)&&!I.closing.has(x))cost+=I.offers.get(x);return cost;};
  const found=[],seen=new Set();
  if(goal<=ceiling){
   const combos=[];const walk=(i,picked,est)=>{if(i===per.length){if(R.RULES.basePct+number+est>=goal)combos.push({picked,cost:estimate(picked)});return;}for(const o of per[i])walk(i+1,o?[...picked,o]:picked,est+optimistic(o,i));};
   walk(0,[],0);combos.sort((a,b)=>a.cost-b.cost);
   for(const c of combos){
    if(found.length>=limit&&c.cost>found[limit-1].cost)break;
    const o=score(c.picked),key=[...o.remove.keys()].sort().join();if(seen.has(key))continue;seen.add(key);
    if(o.state!=='ready'||o.result.lo.weight<goal)continue;
    if(found.some(f=>[...f.remove.keys()].every(x=>o.remove.has(x))))continue; // a cheaper plan plus more listings
    found.push(o);found.sort((a,b)=>a.cost-b.cost||a.buys+a.cancels-(b.buys+b.cancels)||a.cancels-b.cancels);
   }
  }
  if(found.length)return {...base,state:'reachable',best:goal,why:[],plans:found.slice(0,limit).map(o=>describe(snap,id,o,own))};
  // Out of reach: the highest weight any combination reaches. An estimate bounds what its settled set scores, so the walk
  // stops once estimates fall below the best found; among equal weights the cheapest wins.
  const all=[];const walkAll=(i,picked,est)=>{if(i===per.length){all.push({picked,est:Math.min(R.RULES.capPct,R.RULES.basePct+number+est)});return;}for(const o of per[i])walkAll(i+1,o?[...picked,o]:picked,est+optimistic(o,i));};
  walkAll(0,[],0);all.sort((a,b)=>b.est-a.est);let top=null;const tried=new Set();
  for(const c of all){if(top&&c.est<top.result.lo.weight)break;const o=score(c.picked),key=[...o.remove.keys()].sort().join();if(tried.has(key))continue;tried.add(key);if(o.state!=='ready')continue;
   if(!top||o.result.lo.weight>top.result.lo.weight||o.result.lo.weight===top.result.lo.weight&&o.cost<top.cost)top=o;}
  const tops=per.map((options,i)=>{let t={o:null,pct:now(i)};for(const o of options){if(!o)continue;const x=score([o]);if(x.state!=='ready')continue;const r=x.result.traits[i],pct=r.measured?r.pct:r.pctLo;if(pct>t.pct)t={o,pct};}return t;});
  const best=top?Math.max(before.lo.weight,top.result.lo.weight):before.lo.weight;
  return {...base,state:'capped',best,why:limits(snap,id,before,ceiling,tops),plans:top&&top.result.lo.weight>before.lo.weight?[describe(snap,id,top,own)]:[]};
 }
 /** Why a piece stops below the goal: too few traits for the cap, or a trait whose best reachable bonus stays under +100%. */
 function limits(snap,id,before,ceiling,tops){
  const out=[];if(ceiling<GOAL)out.push({kind:'ceiling',ceiling,traits:before.traits.length,number:before.number.pct});
  before.traits.forEach((t,i)=>{
   if(tops[i].pct>=R.MAX_TRAIT_PCT)return;const idx=snap.items[id][1+i],list=index(snap).offersByTrait.get(idx)??[];
   out.push({kind:'trait',idx,type:t.type,value:t.value,top:tops[i].pct,supply:t.supply,listings:list.length,rare:t.supply<R.RULES.heldSupply});
  });
  return out;
 }
 /** A plan as steps: listings already closing (ours too: nothing to do) and reclaims first (free), then purchases from the
  * lowest ask; each with the target's traits it lifts and whether the listing is ours (`owned`). */
 function describe(snap,id,o,own){
  const I=index(snap),traits=new Set(snap.items[id].slice(1));
  const steps=[...o.remove].map(([lid,action])=>({id:lid,number:numberOf(snap,lid),price:I.offers.get(lid),action,closing:I.closing.has(lid),traits:snap.items[lid].slice(1).filter(idx=>traits.has(idx)),owned:own.has(lid)}))
   .sort((a,b)=>(b.closing-a.closing)||(a.action===b.action?0:a.action==='cancel'?-1:1)||a.price-b.price||a.number-b.number);
  const bought=steps.filter(x=>x.action==='sale'&&!x.closing).map(x=>({id:x.id,result:o.s.evaluate(x.id)}));
  return {steps,cost:o.cost,buys:o.buys,cancels:o.cancels,closing:o.closing,result:o.result,floor:o.s.floor,K:o.s.programmeUnits(),bought,scenario:o.s,picked:o.picked};
 }

 // ---------------------------------------------------------------- One market change: list, sale or reclaim.
 /**
  * One market change and what it does: an unlisted piece listed at a price, or a listing closing by a sale or a reclaim.
  * Effects: programme units K, every other minted piece whose weight moves, and my holdings piece by piece (weight and
  * weekly SHNAKAS before → after). A piece I list stops earning; a listing of mine that sells leaves my holdings; one I
  * reclaim earns again from the next week (shown at the steady weekly rate).
  */
 function simulate(snap,change,mine=[]){
  const I=index(snap),ids=[...new Set(mine)].filter(id=>Object.hasOwn(snap.items,id));
  if(!change||!Object.hasOwn(snap.items,change.id))return {state:'missing'};
  let s;
  if(change.kind==='list'){if(I.offers.has(change.id))return {state:'listed'};if(!Number.isSafeInteger(change.price)||change.price<=0)return {state:'invalid'};s=scenario(snap,{add:[[change.id,change.price]]});}
  else if(change.kind==='sale'||change.kind==='cancel'){if(!I.offers.has(change.id))return {state:'unlisted'};s=scenario(snap,{remove:[[change.id,change.kind]]});}
  else throw new Error('Unknown market change');
  if(s.state!=='ready')return {state:s.state};
  // Not-yet-minted catalog rows move K too, but nobody holds them: the up / down lists name minted pieces only.
  const others=s.changed().filter(x=>x.key!==change.id&&!x.key.startsWith('pending:')),K0=R.programmeUnits(snap),K1=s.programmeUnits();
  const listedNow=new Set(I.offers.keys()),after=listedAfter(snap,s);
  const keeps=id=>!(change.kind==='sale'&&id===change.id);
  const rows=ids.map(id=>{const b=R.evaluateSnapshot(snap,id),a=keeps(id)?s.evaluate(id):null;
   return {id,before:b,after:a,weeklyBefore:listedNow.has(id)?zero:R.weeklyAllocation(R.units(b),K0),weeklyAfter:a===null||after.has(id)?zero:R.weeklyAllocation(R.units(a),K1)};});
  const total=list=>list.reduce((x,y)=>sum(x,y),zero);
  // A sold piece of mine was listed, so it earned nothing before and leaves: the change is the rest's one-world change.
  const delta=weeklyChange(snap,ids.filter(keeps),s).delta;
  return {state:'ready',change,floor:s.floor,beforeFloor:snap.snapshot.collectionFloor,K:{before:K0,after:K1},
   up:others.filter(x=>x.after.lo.weight>x.before.hi.weight),down:others.filter(x=>x.after.hi.weight<x.before.lo.weight),
   mine:{rows,before:total(rows.map(r=>r.weeklyBefore)),after:total(rows.map(r=>r.weeklyAfter)),delta},safe:change.kind==='list'?safeAsk(snap,change.id):null,scenario:s};
 }
 /**
  * Asks at which listing `id` moves no other piece's weight, exactly: within the collection floor F (a lower ask moves
  * the collection floor and every ratio). Between consecutive breakpoints — F, the four tier lines and the floors of this
  * piece's traits above F — every trait keeps the same tier, so one ask per interval decides it. Returns {state:'range'}
  * when a trait of the piece is itself a range, {state:'none'} when no ask is safe (two traits ask for different tiers),
  * or {state:'ready', runs:[{min, below|null}]} (min ≤ ask < below; below null: no upper end).
  */
 function safeAsk(snap,id){
  const F=snap.snapshot.collectionFloor,traits=snap.items[id].slice(1);
  for(const idx of traits){const b=pctOf(traitBonus(snap,idx));if(b.lo!==b.hi)return {state:'range'};}
  const cuts=[...new Set([F,...TIERS.map(t=>threshold(t,F)),...traits.map(idx=>snap.traits[idx][2]).filter(f=>f!==null&&f>F)])].sort((a,b)=>a-b);
  const moves=p=>scenario(snap,{add:[[id,p]]}).changed().some(x=>x.key!==id),runs=[];
  cuts.forEach((p,i)=>{if(moves(p))return;const to=cuts[i+1]??null,last=runs.at(-1);if(last&&last.below===p)last.below=to;else runs.push({min:p,below:to});});
  return runs.length?{state:'ready',runs}:{state:'none'};
 }

 // ---------------------------------------------------------------- Locking a trait: a monopoly.
 /**
  * Collection floors at which a trait with no listing keeps the bonus `r` (that trait evaluated alone at floor F) has, its
  * other inputs fixed: every floor for +100% from 20+ pieces or for 0% with no sale; for a smaller trait scored on its last
  * three sales, the floors at which every possible window of them (same-block ties kept) stays at that tier. {min, max}
  * inclusive, null = no bound. null when the bonus is no exact tier of known sales: no sale history loaded, an unverified
  * carry, a same-block order that changes the tier, or an official value its sales do not reproduce.
  */
 function floorRange(r,F){
  const t=r.traits[0];if(t.method==='held')return {min:null,max:null};
  if(t.carryUnknown||t.saleHistory===undefined)return null;
  const pct=r.lo.weight-R.RULES.basePct,w=R.recentSalesTier(t.saleHistory,undefined,F);if(!w.measured||w.pct!==pct)return null;
  if(w.method==='no-sales')return {min:null,max:null};
  // Each window's tier only falls as the floor rises, so the floors keeping all of them at `pct` are one interval around
  // F; its ends are found exactly by bisection on the engine's own integer test. A lower floor never drops a tier (no
  // lower end at +100%), a higher one never lifts one (no upper end at 0%); above the dearest sale every tier is 0%.
  const holds=f=>{const x=R.recentSalesTier(t.saleHistory,undefined,f);return x.measured&&x.pct===pct;};
  let min=null,max=null;
  if(pct<R.MAX_TRAIT_PCT){let lo=1,hi=F;while(lo<hi){const m=Math.floor((lo+hi)/2);if(holds(m))hi=m;else lo=m+1;}min=lo;}
  if(pct>0){let lo=F,hi=Math.max(...t.saleHistory.map(([p])=>p));while(lo<hi){const m=Math.ceil((lo+hi)/2);if(holds(m))lo=m;else hi=m-1;}max=lo;}
  return {min,max};
 }
 /** Our weekly SHNAKAS once a way to own a trait is done: our pieces after it plus the pieces bought. */
 const weekAfter=k=>sum(k.change.after,k.bought);
 /** keepListed pick: the higher weekly total (low bound, then high), a piece already listed (no new listing), the lower number. */
 const better=(a,b)=>{const x=weekAfter(a),y=weekAfter(b);return x.lo!==y.lo?x.lo>y.lo:x.hi!==y.hi?x.hi>y.hi:(a.listed===null)!==(b.listed===null)?a.listed!==null:a.number<b.number;};
 /**
  * Every trait our pieces carry (my holdings and the numbers added; a listing of ours someone is already buying leaves us
  * at the next block, so that piece counts as someone else's) and whether we can own all of it.
  *
  * Row: supply (catalog pieces, minted and unminted: the count the zero-listing rule reads), pending (unminted), held
  * (ours), ownListed (our listings, open or being reclaimed), others (others' listings), othersHeld (others' unlisted
  * pieces), closingAway (listings closing into someone else's hands: others' bought or reclaimed, ours being bought), bonus
  * (now), maxNow (exactly +100% now: owning it protects that rather than raises it), and what stands in the way: buyable
  * (others' open listings, cheapest first), wanted (pieces only a private deal brings: others' unlisted ones and the
  * listings closing into someone else's hands, `own` marking ours being bought; by number) and unminted numbers.
  *
  * owned — the trait once all ours, every listing of it gone (others' open ones bought, ours reclaimed, closing ones as
  * they close; pieces held elsewhere come by private deal and unminted ones stay unlisted, which adds no public sale):
  * {state:'ready', floor (collection floor then), after (its bonus), stable (20+ pieces, no listing: +100% whatever the
  * floors do), holds (floorRange: the collection floors at which a smaller trait keeps `after`, its sales fixed)}, or
  * {state:'no-floor'} when no listing would be left on the market. Purchases are new sales at the next block; closing
  * listings of other traits still count in `floor`.
  *
  * monopoly.state: 'possible' (nobody else holds one, none unminted), 'held-elsewhere', 'unminted' or 'no-floor'. Possible:
  * buy (the others' listings), reclaim (our open listings: free steps), reclaiming (ours already being reclaimed: no
  * step), cost (sats), after (= owned.after) and, when a listing goes, change (weeklyChange of our pieces), bought (what the
  * pieces bought earn from the next week; zero when no reward week follows) and total (change.delta + bought). A smaller
  * trait under +100% once ours gets keepListed when one of ours can stay listed at the +100% line: {id, number, price (the
  * line: the lowest ask at +100% for `floor`), floor (the collection floor it is computed for: if the floor rises the line
  * rises), multiple ({num, den}: line = ⌈floor × num ÷ den⌉), listed (its ask when already listed: kept, raised to the line
  * when under it; null: newly listed), after, change, without (the change with none kept listed), bought, total}. That
  * piece earns nothing while listed and anyone can buy it, which ends the monopoly; the pick leaves our weekly total highest.
  */
 function lockTraits(snap,ours){
  const I=index(snap),F=snap.snapshot.collectionFloor,own=new Set(ours.filter(id=>Object.hasOwn(snap.items,id))),later=laterWeek(snap),top=TIERS.at(-1);
  const leaves=id=>own.has(id)&&sold(snap,id),count=new Map();
  for(const id of own)if(!leaves(id))for(const idx of snap.items[id].slice(1))count.set(idx,(count.get(idx)??0)+1);
  const step=(id,action)=>({id,number:numberOf(snap,id),price:I.offers.get(id),action,closing:I.closing.has(id)});
  // What the pieces bought earn for us from the week after the purchase, at the scenario's weights and K.
  const boughtWeekly=(s,ids)=>later?R.weeklyAllocation(ids.reduce((u,id)=>sum(u,R.units(s.evaluate(id))),zero),s.programmeUnits()):zero;
  return [...count].map(([idx,held])=>{
   const keys=I.byTrait.get(idx),supply=keys.length,pending=keys.filter(k=>k.startsWith('pending:')).length,listings=I.offersByTrait.get(idx)??[];
   const others=listings.filter(([id])=>!own.has(id)),open=others.filter(([id])=>!I.closing.has(id)),leaving=listings.filter(([id])=>leaves(id));
   const ownOpen=listings.filter(([id])=>own.has(id)&&!I.closing.has(id)),reclaiming=listings.filter(([id])=>own.has(id)&&I.closing.get(id)==='cancel');
   const othersHeld=supply-pending-held-leaving.length-others.length,closingAway=others.length-open.length+leaving.length,bonus=pctOf(traitBonus(snap,idx));
   const buyable=open.map(([id])=>step(id,'sale')).sort((a,b)=>a.price-b.price||a.number-b.number);
   const wanted=[...keys.filter(k=>!k.startsWith('pending:')&&!own.has(k)&&!I.offers.has(k)).map(id=>({id,number:numberOf(snap,id),closing:false,own:false})),
    ...[...others,...leaving].filter(([id])=>I.closing.has(id)).map(([id])=>({id,number:numberOf(snap,id),closing:true,own:own.has(id)}))].sort((a,b)=>a.number-b.number);
   const unminted=keys.filter(k=>k.startsWith('pending:')).map(k=>snap.pending[Number(k.slice(8))][0]).sort((a,b)=>a-b);
   const remove=listings.map(([id])=>[id,removal(snap,id,own)]),sc=remove.length?scenario(snap,{remove}):null;
   let owned;
   if(sc!==null&&sc.state!=='ready')owned={state:sc.state};
   else{const r=sc===null?traitBonus(snap,idx):sc.trait(idx),floor=sc===null?F:sc.floor;owned={state:'ready',floor,after:pctOf(r),stable:r.traits[0].method==='held',holds:floorRange(r,floor)};}
   const state=pending?'unminted':wanted.length?'held-elsewhere':owned.state==='ready'?'possible':owned.state;
   let monopoly={state};
   if(state==='possible'){
    const buys=open.map(([id])=>id);
    monopoly={state,buy:buyable,reclaim:ownOpen.map(([id])=>step(id,'cancel')),reclaiming:reclaiming.map(([id])=>step(id,'cancel')),cost:open.reduce((a,[,p])=>a+p,0),after:owned.after};
    if(sc!==null){const change=weeklyChange(snap,[...own],sc),bought=boughtWeekly(sc,buys);Object.assign(monopoly,{change,bought,total:sum(change.delta,bought)});}
    if(owned.after.lo<R.MAX_TRAIT_PCT&&!owned.stable){
     const line=threshold(top,owned.floor),without=sc===null?weeklyChange(snap,[...own],scenario(snap,{})):monopoly.change;let best=null;
     for(const id of [...own].filter(x=>!I.closing.has(x)&&snap.items[x].slice(1).includes(idx))){
      const ask=I.offers.has(id)?I.offers.get(id):null;
      const sk=scenario(snap,ask===null?{remove,add:[[id,line]]}:{remove:remove.filter(([x])=>x!==id),reprice:ask<line?[[id,line]]:[]});
      const change=weeklyChange(snap,[...own],sk),bought=boughtWeekly(sk,buys);
      const k={id,number:numberOf(snap,id),price:line,floor:owned.floor,multiple:{num:top.num,den:top.den},listed:ask,after:pctOf(sk.trait(idx)),change,without,bought,total:sum(change.delta,bought)};
      if(best===null||better(k,best))best=k;
     }
     if(best!==null)monopoly.keepListed=best;
    }
   }
   return {idx,type:snap.traits[idx][0],value:snap.traits[idx][1],supply,pending,held,ownListed:ownOpen.length+reclaiming.length,others:others.length,othersHeld,closingAway,bonus,maxNow:bonus.lo===R.MAX_TRAIT_PCT,buyable,wanted,unminted,owned,monopoly};
  }).sort((a,b)=>(a.monopoly.state==='possible'?0:1)-(b.monopoly.state==='possible'?0:1)||a.othersHeld-b.othersHeld||b.held-a.held||a.bonus.lo-b.bonus.lo||a.idx-b.idx);
 }
 /**
  * lockTraits rows in three groups. `can`: ours once the others' listings are bought and ours reclaimed (or one of ours is
  * kept listed at the line), by weekly gain per sat — the better of the two ways, the pieces bought included (with no
  * listing to remove nothing changes) — so a free one that gains leads and a free one that loses comes last; equal value:
  * the cheaper, the larger gain, the trait index. `have`: all ours, nothing to do (a reclaim of ours already confirming
  * included: owned.after is its bonus from the next block). `far`: someone else holds one (unlisted, or a listing closing
  * into their hands), one is unminted, or buying leaves no listing to score; `missing` = pieces a private deal must bring
  * plus unminted ones, the fewest first.
  */
 function lockGroups(rows){
  const can=[],have=[],far=[];
  for(const t of rows){const m=t.monopoly;if(m.state!=='possible')far.push(t);else if(m.buy.length||m.reclaim.length||m.keepListed)can.push(t);else have.push(t);}
  const gain=t=>{const m=t.monopoly,plain=m.total?m.total.lo:0;return m.keepListed?Math.max(plain,m.keepListed.total.lo):plain;};
  const value=t=>{const g=gain(t),c=t.monopoly.cost;return c>0?g/c:g>0?Infinity:g<0?-Infinity:0;},missing=t=>t.wanted.length+t.unminted.length;
  can.sort((a,b)=>{const x=value(a),y=value(b);return x!==y?y-x:a.monopoly.cost-b.monopoly.cost||gain(b)-gain(a)||a.idx-b.idx;});
  far.sort((a,b)=>missing(a)-missing(b)||b.held-a.held||a.supply-b.supply||a.idx-b.idx);
  return {can,have,far,missing};
 }

 // ---------------------------------------------------------------- One plan for several targets.
 /**
  * One plan toward `targets` (pieces of ours below the goal): `mine` are my holdings, `mates` the numbers added beside
  * them (teammates' or any others). Targets are taken from the cheapest: each of its candidate plans is settled together
  * with the trait tiers of the targets already taken, and the cheapest whose joint result keeps every taken target at the
  * goal is kept; a target no plan of which fits is left out (conflict), so every purchase serves a target that reaches
  * the goal. Our listings are reclaimed (free); one of ours someone is already buying leaves us at the next block, so it is
  * no target and its sale is no step of ours. Each step says which targets' traits it serves and whose listing it is.
  */
 function jointPlan(snap,{mine=[],mates=[],targets=null,goal=GOAL}={}){
  const has=id=>Object.hasOwn(snap.items,id),me=[...new Set(mine)].filter(has),them=[...new Set(mates)].filter(id=>has(id)&&!me.includes(id)),own=new Set([...me,...them]);
  const wanted=[...new Set(targets??[...own])].filter(id=>own.has(id)&&!sold(snap,id)&&R.evaluateSnapshot(snap,id).lo.weight<goal);
  const plans=new Map(wanted.map(id=>[id,plan(snap,id,{own,goal,limit:5})]));
  const open=wanted.filter(id=>plans.get(id).state==='reachable').sort((a,b)=>plans.get(a).plans[0].cost-plans.get(b).plans[0].cost);
  let picks=[],accepted=[],current=new Map(),floor=snap.snapshot.collectionFloor;
  for(const id of open){let best=null;
   for(const x of plans.get(id).plans){const choice=[...picks,...x.picked.map(o=>({...o,target:id}))],{remove,F}=settle(snap,choice,own);if(F===null)continue;const sc=scenario(snap,{remove:[...remove]});if(sc.state!=='ready')continue;
    if(![...accepted,id].every(t=>sc.evaluate(t).lo.weight>=goal))continue;const c=costOf(snap,remove).cost;if(!best||c<best.c)best={c,choice,remove,F};}
   if(best){picks=best.choice;accepted.push(id);current=best.remove;floor=best.F;}
  }
  const side=id=>me.includes(id)?'me':'mates';
  const result=wanted.map(id=>{const p=plans.get(id);return {id,number:numberOf(snap,id),side:side(id),before:R.evaluateSnapshot(snap,id),state:accepted.includes(id)?'reached':p.state==='reachable'?'conflict':p.state,best:p.best??null,why:p.why??[]};});
  if(!current.size)return {state:accepted.length?'ready':'none',targets:result,steps:[],cost:0,goal};
  const s=scenario(snap,{remove:[...current]});if(s.state!=='ready')return {state:s.state,targets:result,steps:[],cost:0,goal};
  for(const t of result)t.after=s.evaluate(t.id);
  // What each step serves: every taken tier choice whose listings at the final collection floor include it (lines only rise
  // with the floor, so every listing in the set is needed by at least one).
  const needs=picks.map(o=>({target:o.target,idx:o.idx,ids:new Set(o.pct===null?o.ids:below(snap,o.idx,threshold(tierOf(o.pct),floor)))}));
  const steps=[...current].map(([lid,action])=>{
   const by=new Map();for(const n of needs)if(n.ids.has(lid)){if(!by.has(n.target))by.set(n.target,[]);by.get(n.target).push(snap.traits[n.idx].slice(0,2));}
   const sides=[...new Set([...by.keys()].map(side))],closing=index(snap).closing.has(lid),buy=action==='sale'&&!closing;
   if(buy&&!sides.length)throw new Error(`Listing ${lid} serves no target`);
   // owner: whose listing it is when it is ours ('me' or 'mates'; a reclaim, or one of ours already closing), else null.
   return {id:lid,number:numberOf(snap,lid),price:index(snap).offers.get(lid),action,closing,owner:own.has(lid)?side(lid):null,
    serves:[...by].map(([t,traits])=>({id:t,number:numberOf(snap,t),traits})),payer:buy?(sides.length===2?'both':sides[0]):null};
  }).sort((a,b)=>(b.closing-a.closing)||(a.action===b.action?0:a.action==='cancel'?-1:1)||a.price-b.price||a.number-b.number);
  // Pieces bought (not the ones already closing): each earns for whoever receives it from the week after the sale.
  const bought=steps.filter(x=>x.payer!==null).map(x=>({id:x.id,payer:x.payer,result:s.evaluate(x.id)}));
  return {state:'ready',goal,targets:result,steps,bought,cost:costOf(snap,current).cost,scenario:s,K:{before:R.programmeUnits(snap),after:s.programmeUnits()},
   change:{me:weeklyChange(snap,me,s),mates:weeklyChange(snap,them,s)},weekly:Object.fromEntries(result.map(t=>{const w=weeklyChange(snap,[t.id],s);return [t.id,{before:w.before,after:w.after}];}))};
 }

 // ---------------------------------------------------------------- Each target alone, by what it gives per BTC.
 /**
  * Each target's own cheapest plan to the goal (`mine` my holdings, `mates` the numbers added beside them; listings of
  * either are reclaimed free; one someone is already buying leaves us and is no target) and what it gives us: this
  * piece's weekly SHNAKAS before → after, the one-world weekly change of all our pieces (`change`), the pieces bought
  * (`bought`: they count from the week after the sale, so nothing in the last reward week), `total` = change + bought,
  * and `value` = total per 0.001 BTC (null for a plan that costs nothing). `auto`: the plan has nothing for us to do —
  * every listing it needs gone is already closing (someone else's purchase or reclaim, or ours on its way) — so the piece
  * gets there at the next block anyway and its figures are what those closings do, not a choice. A target out of reach
  * carries its plan to the highest weight it can reach, or none when nothing raises it.
  * Order: reachable plans that need us first — free ones by total, then by value, then cost —, then the automatic ones by
  * number; the others by the highest weight they reach.
  */
 function targetPlans(snap,{mine=[],mates=[],targets=null,goal=GOAL}={}){
  const has=id=>Object.hasOwn(snap.items,id),me=[...new Set(mine)].filter(has),them=[...new Set(mates)].filter(id=>has(id)&&!me.includes(id)),own=new Set([...me,...them]);
  const wanted=[...new Set(targets??[...own])].filter(id=>own.has(id)&&!sold(snap,id)&&R.evaluateSnapshot(snap,id).lo.weight<goal);
  const later=laterWeek(snap);
  const rows=wanted.map(id=>{
   const p=plan(snap,id,{own,goal,limit:1}),x=p.plans[0]??null;
   const base={id,number:numberOf(snap,id),side:me.includes(id)?'me':'mates',state:p.state,before:p.before,best:p.best,why:p.why,plan:x};
   if(x===null)return {...base,auto:false,piece:null,change:null,bought:zero,total:null,value:null};
   const piece=weeklyChange(snap,[id],x.scenario),change=weeklyChange(snap,[...own],x.scenario).delta;
   const bought=later?R.weeklyAllocation(x.bought.reduce((u,b)=>sum(u,R.units(b.result)),zero),x.K):zero,total=sum(change,bought);
   return {...base,auto:x.buys===0&&x.cancels===0,piece:{before:piece.before,after:piece.after},change,bought,total,value:x.cost>0?total.lo/x.cost*1e5:null};
  });
  const order=(a,b)=>{
   if(a.state!==b.state)return a.state==='reachable'?-1:1;
   if(a.state!=='reachable')return b.best-a.best||a.number-b.number;
   if(a.auto!==b.auto)return a.auto?1:-1;
   if(a.auto)return a.number-b.number;
   if((a.value===null)!==(b.value===null))return a.value===null?-1:1;
   if(a.value===null)return b.total.lo-a.total.lo||a.number-b.number;
   return b.value-a.value||a.plan.cost-b.plan.cost||a.number-b.number;
  };
  return rows.sort(order);
 }
 return {GOAL,threshold,index,scenario,weeklyChange,traitOptions,plan,simulate,safeAsk,lockTraits,lockGroups,jointPlan,targetPlans};
});
