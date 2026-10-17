/**
 * SHNAKAS 奖励权重规则：纯函数，无 DOM、无网络。内容脚本、弹窗、快照脚本、构建校验、单测与 E2E 共用这一份。
 *
 * Weights are scored every block by the on-chain programme (rewardsSource below); there is no weekly or quarterly snapshot block.
 * 原始规则出处：https://x.com/Ob1_Wan_Satoshi/status/2108018318141755694（2026-10-08，正文 + 配图）
 *   - 权重 = 100% 基础 + 各特征加成之和 + 号码加成，总权重封顶 400%（配图 "400% TOTAL CAP"）
 *   - 特征加成：特征地板 ÷ 集合地板 ≥1.25x +25%、≥1.5x +50%、≥2x +75%、≥3x +100%；每个特征都算
 *   - 号码加成：Sub 10 +200%、Sub 100 +100%、Sub 1K +50%，只取最高一档（配图 "Highest number tier only"）
 *   - 官方零挂单补充：status/2108032971617997133，至少20件的特征+100%；小型特征用最近成交依据。
 *
 * 规则变动时只改 RULES 与 test/rules.test.js，不动其它文件。
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ShnakasRules = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const RULES = Object.freeze({
    source: 'https://x.com/Ob1_Wan_Satoshi/status/2108018318141755694',
    zeroListingSource: 'https://x.com/Ob1_Wan_Satoshi/status/2108032971617997133',
    heldSupply: 20,
    recentSales: 3,
    weekBlocks: 1008,
    weeks: 78,
    claimUntil: 1102740,
    rewardsSource: 'https://ordinals.com/content/30adf5233d1a0eec4d3c836f195e3966acf634cf96634444358ccfe8c7c961a9i0',
    publishedAt: '2026-10-08',
    startBlock: 971700,
    // On-chain programme (rewardsSource): poolPerWeek 26,664,000,000,000 base units at 8 decimals, split over
    // every catalog piece's units (3333 pieces, minted or not). One unit is 25% of weight.
    poolPerWeek: 266640,
    poolPerWeekBase: 26664000000000,
    tokenDecimals: 8,
    catalogPieces: 3333,
    // Catalog pieces still unminted at block 971,787, after rewards started (/pulse: minted 3,327, pending 6; the same six
    // are pending in the bundled snapshot at 971,547). Any later mint of one is after the start, at a block the listing
    // records do not show.
    lateMintNumbers: Object.freeze([1612, 1613, 2816, 2817, 2881, 2889]),
    unitPct: 25,
    // Legacy field retained for compatibility; current weights update per block.
    measureHeight: null,
    basePct: 100,
    capPct: 400,
    // 比值门槛用分数表示（num/den），比较时走整数运算，避免浮点在门槛上下抖动。按门槛从高到低排列。
    traitTiers: Object.freeze([
      Object.freeze({ num: 3, den: 1, pct: 100 }),
      Object.freeze({ num: 2, den: 1, pct: 75 }),
      Object.freeze({ num: 3, den: 2, pct: 50 }),
      Object.freeze({ num: 5, den: 4, pct: 25 }),
    ]),
    // 编号 < below 即命中；按 below 从小到大排列，第一个命中的就是最高一档。
    numberTiers: Object.freeze([
      Object.freeze({ below: 10, pct: 200, label: 'Sub 10' }),
      Object.freeze({ below: 100, pct: 100, label: 'Sub 100' }),
      Object.freeze({ below: 1000, pct: 50, label: 'Sub 1K' }),
    ]),
  });

  // 排列顺序是 traitTier / numberTier 取"第一个命中"的前提，改 RULES 时写错顺序直接在加载期报错。
  for (let i = 1; i < RULES.traitTiers.length; i++) {
    const a = RULES.traitTiers[i - 1];
    const b = RULES.traitTiers[i];
    if (a.num * b.den <= b.num * a.den || a.pct <= b.pct) throw new Error('RULES.traitTiers 必须按门槛与加成严格降序排列');
  }
  for (let i = 1; i < RULES.numberTiers.length; i++) {
    const a = RULES.numberTiers[i - 1];
    const b = RULES.numberTiers[i];
    if (a.below >= b.below || a.pct <= b.pct) throw new Error('RULES.numberTiers 必须按上限升序、加成降序排列');
  }

  /** 单个特征能拿到的最高加成：无挂单特征的区间上限就取这个值。 */
  const MAX_TRAIT_PCT = RULES.traitTiers[0].pct;

  function assertSats(v, name) {
    if (!Number.isSafeInteger(v) || v <= 0) throw new Error(`${name} 必须是正整数聪，实际是 ${v}`);
  }

  /**
   * 特征档位。floorSats 为 null 表示快照时这个特征零挂单、测不出地板价。
   * @returns {{measured:false} | {measured:true, ratio:number, pct:number}}
   */
  function traitTier(floorSats, collectionFloorSats) {
    assertSats(collectionFloorSats, '集合地板价');
    if (floorSats === null) return { measured: false };
    assertSats(floorSats, '特征地板价');
    const f = BigInt(floorSats);
    const c = BigInt(collectionFloorSats);
    const hit = RULES.traitTiers.find((t) => f * BigInt(t.den) >= c * BigInt(t.num));
    return { measured: true, ratio: floorSats / collectionFloorSats, pct: hit ? hit.pct : 0 };
  }

  /** Truncate a displayed ratio using exact integers, including near MAX_SAFE_INTEGER. */
  function formatRatio(floor, collectionFloor) {
    assertSats(floor, '特征地板价'); assertSats(collectionFloor, '集合地板价');
    const f=BigInt(floor), c=BigInt(collectionFloor), hundredths=f*100n/c;
    if(hundredths>=10000n) return `${f/c}×`;
    return `${hundredths/100n}.${String(hundredths%100n).padStart(2,'0')}×`;
  }

  /** Ratio of a trait's basis to the collection floor, truncated exactly: the trait floor, or a sales median / mean. */
  function basisRatio(trait, collectionFloor) {
    if(trait.method==='sales-median')return formatRatio(trait.basis[0],trait.basis[1]*collectionFloor);
    if(trait.method==='floor')return formatRatio(trait.floor,collectionFloor);
    throw new Error(`No price basis for ${trait.method}`);
  }

  /** 号码档位：只取最高一档；不在任何档内则为 0。 */
  function numberTier(number) {
    if (!Number.isSafeInteger(number) || number < 0) throw new Error(`编号必须是非负整数，实际是 ${number}`);
    const hit = RULES.numberTiers.find((t) => number < t.below);
    return hit ? { pct: hit.pct, label: hit.label } : { pct: 0, label: null };
  }

  function bound(rawWeight) {
    const weight = Math.min(rawWeight, RULES.capPct);
    return { weight, bonus: weight - RULES.basePct, atCap: weight === RULES.capPct, cutPct: rawWeight - weight };
  }

  /**
   * 计算一件藏品的权重。
   * @param {{number:number, traits:Array<{type:string, value:string, floor:number|null, listed:number}>}} piece
   * @param {number} collectionFloorSats
   * @returns 仅缺少成交依据的小型零挂单特征采用0..100理论区间；exact表示公式端点相等，不代表官方最终权重。
   */
  function evaluate(piece, collectionFloorSats) {
    assertSats(collectionFloorSats, '集合地板价');
    const seen = new Set();
    for (const t of piece.traits) {
      if (typeof t.type !== 'string' || !t.type || typeof t.value !== 'string' || !t.value || t.type === 'Shielded #') throw new Error('美术特征非法或重复计入 Shielded 编号');
      const key = JSON.stringify([t.type, t.value]);
      if (seen.has(key)) throw new Error(`重复特征：${t.type} / ${t.value}`);
      seen.add(key);
    }
    const traits = piece.traits.map((t) => {
      if(t.supply!==undefined && (!Number.isSafeInteger(t.supply)||t.supply<1))throw new Error('Invalid trait supply');
      if(t.floor!==null)return {...t,...traitTier(t.floor,collectionFloorSats),method:'floor',basisPrice:t.floor};
      if(t.supply>=RULES.heldSupply)return {...t,measured:true,pct:100,ratio:null,method:'held',basisPrice:null};
      if(t.supply<RULES.heldSupply && t.officialPct!==undefined && ['sales','none','lastBlock'].includes(t.officialSource)){
        if(![0,25,50,75,100].includes(t.officialPct))throw new Error('Invalid official trait bonus');
        return {...t,measured:true,pct:t.officialPct,ratio:null,method:'official-'+t.officialSource,basisPrice:null};
      }
      if(t.carryUnknown)return {...t,measured:false,method:'carry-unverified',basisPrice:null,pctLo:0,pctHi:MAX_TRAIT_PCT};
      // Without sale history the three-sale basis is unknown: 0..100%.
      if(t.saleHistory===undefined)return {...t,measured:false,method:'missing-sale',basisPrice:null,pctLo:0,pctHi:MAX_TRAIT_PCT};
      return {...t,...recentSalesTier(t.saleHistory,t.pendingSale,collectionFloorSats)};
    });
    const number = Object.assign({ value: piece.number }, numberTier(piece.number));
    const measuredPct = traits.reduce((s, t) => s + (t.measured ? t.pct : 0), 0);
    const unmeasured = traits.filter((t) => !t.measured).length;
    const loRaw = RULES.basePct + measuredPct + number.pct + traits.reduce((s,t)=>s+(t.measured?0:t.pctLo),0);
    const hiRaw = RULES.basePct + measuredPct + number.pct + traits.reduce((s,t)=>s+(t.measured?0:t.pctHi),0);
    const lo = bound(loRaw);
    const hi = bound(hiRaw);
    return { traits, number, unmeasured, lo, hi, exact: lo.weight === hi.weight };
  }

  /**
   * Small zero-listed trait: the programme uses the trait's three most recent sales against the collection floor.
   * Its aggregation is not published; the median (two sales: their mean; one: that sale) matches every official
   * sales-sourced trait checked (83/83 at block 971546), and every alternative tested misses at least one.
   * No sales gives 0%, matching every official zero-sale trait. history: [[price, height], ...] newest first,
   * including all sales tied at the window boundary; pendingSale is a hypothetical newest sale. If tied sales in one
   * block make the window ambiguous, the trait keeps the bounds of every possible window: the median (two: the mean) never
   * falls when one sale is dearer, so the cheapest and the dearest choice of tied sales bound all the others.
   * basis [sum, count] is the exact median or mean of a measured window, for an exact ratio against the floor.
   */
  function recentSalesTier(history,pendingSale,collectionFloorSats) {
    if(!Array.isArray(history))throw new Error('Invalid sale history');
    for(const [price,height] of history){assertSats(price,'成交价');if(!Number.isSafeInteger(height)||height<0)throw new Error('Invalid sale height');}
    if(pendingSale!==undefined)assertSats(pendingSale,'假设成交价');
    const fixed=pendingSale===undefined?[]:[pendingSale],need=RULES.recentSales-fixed.length;
    const windows=[];
    if(history.length<=need)windows.push([...fixed,...history.map(([p])=>p)]);
    else {
      const edge=history[need-1][1],newer=history.filter(([,h])=>h>edge).map(([p])=>p),tied=history.filter(([,h])=>h===edge).map(([p])=>p).sort((a,b)=>a-b),take=need-newer.length;
      windows.push([...fixed,...newer,...tied.slice(0,take)]);
      if(tied.length>take)windows.push([...fixed,...newer,...tied.slice(tied.length-take)]);
    }
    const c=BigInt(collectionFloorSats);
    const tierOf=(sum,count)=>{const hit=RULES.traitTiers.find(t=>sum*BigInt(t.den)>=c*BigInt(t.num)*BigInt(count));return hit?hit.pct:0;};
    const results=windows.map(w=>{
      if(!w.length)return {pct:0,price:null};
      const v=[...w].sort((a,b)=>a-b),mid=v.length===2?[v[0],v[1]]:[v[(v.length-1)/2]],sum=mid.reduce((s,x)=>s+x,0);
      return {pct:tierOf(mid.reduce((s,x)=>s+BigInt(x),0n),mid.length),price:Math.floor(sum/mid.length),basis:[sum,mid.length]};
    });
    const pcts=results.map(r=>r.pct),lo=Math.min(...pcts),hi=Math.max(...pcts);
    if(lo!==hi)return {measured:false,method:'sales-ambiguous',basisPrice:null,pctLo:lo,pctHi:hi};
    const r=results[0];
    return r.price===null?{measured:true,pct:0,ratio:null,method:'no-sales',basisPrice:null}
      :{measured:true,pct:r.pct,ratio:r.basis[0]/(r.basis[1]*collectionFloorSats),method:'sales-median',basisPrice:r.price,basis:r.basis};
  }

  /** What evaluate() reads for one trait, branch by branch: a listed trait its floor, a large zero-listed trait nothing
   * more, a small one its official basis, carry flag and sales (history and a hypothetical newest sale). */
  function traitInput(t){
    if(t.floor!==null)return JSON.stringify(['floor',t.floor]);
    if(t.supply>=RULES.heldSupply)return JSON.stringify(['held']);
    return JSON.stringify(['sales',t.officialPct??null,t.officialSource??null,t.carryUnknown===true,t.saleHistory??null,t.pendingSale??null]);
  }
  /**
   * Bounds of one piece's weight change between two evaluations (before → after an action), never mixing worlds: with the
   * same collection floor and the same inputs for every trait the change is exactly 0; when every unmeasured trait keeps
   * its inputs, both results move with the same unknown sum and the change is monotone in it, so it lies between the
   * low-with-low and high-with-high differences; otherwise the cross differences bound it.
   */
  function weightChange(before,after,sameFloor){
    if(before.traits.length!==after.traits.length||before.number.value!==after.number.value)throw new Error('weightChange compares one piece');
    const pairs=before.traits.map((t,i)=>[t,after.traits[i]]),same=([a,b])=>traitInput(a)===traitInput(b);
    if(sameFloor&&pairs.every(same))return {lo:0,hi:0};
    const dl=after.lo.weight-before.lo.weight,dh=after.hi.weight-before.hi.weight;
    if(sameFloor&&pairs.every(([a,b])=>a.measured&&b.measured||!a.measured&&!b.measured&&same([a,b])))return {lo:Math.min(dl,dh),hi:Math.max(dl,dh)};
    return {lo:after.lo.weight-before.hi.weight,hi:after.hi.weight-before.lo.weight};
  }

  /** Units (25% each) a result contributes; bounds stay separate for ranges. */
  function units(result){return {lo:result.lo.weight/RULES.unitPct,hi:result.hi.weight/RULES.unitPct};}
  /**
   * Official preview split: every catalog piece's units share the weekly pool, so K sums minted pieces and the
   * not-yet-minted catalog rows in snap.pending. Matches the official weights endpoint (K and v) at block 971546.
   */
  const unitTotals=new WeakMap();
  function programmeUnits(snap){
    if(unitTotals.has(snap))return unitTotals.get(snap);
    const total={lo:0,hi:0};
    const add=row=>{const u=units(evaluate({number:row[0],traits:snapshotTraits(snap,row.slice(1))},snap.snapshot.collectionFloor));total.lo+=u.lo;total.hi+=u.hi;};
    for(const row of Object.values(snap.items))add(row);
    for(const row of snap.pending??[])add(row);
    unitTotals.set(snap,total);return total;
  }
  /** Official per-block rate of one unit (base units): v = floor(poolPerWeek ÷ weekBlocks ÷ K), as the weights endpoint reports. */
  const rates=new Map();
  function unitRate(K){
    if(!Number.isSafeInteger(K)||K<=0)throw new Error('Programme units must be a positive integer');
    let v=rates.get(K);if(v===undefined){v=Number(BigInt(RULES.poolPerWeekBase)/(BigInt(RULES.weekBlocks)*BigInt(K)));rates.set(K,v);}
    return v;
  }
  /** Weekly SHNAKAS for `mine` units out of `all` units (both {lo,hi}): units × v × weekBlocks, exactly the official
   * perBlock × 1008. Bounds widen for ranges. */
  function weeklyAllocation(mine,all){
    const week=(u,K)=>{if(!Number.isSafeInteger(u)||u<0)throw new Error('Holding units must be a non-negative integer');return u*unitRate(K)*RULES.weekBlocks/10**RULES.tokenDecimals;};
    return {lo:week(mine.lo,all.hi),hi:week(mine.hi,all.lo)};
  }
  /** SHNAKAS one block pays `mine` units out of all programme units: units × v ÷ 10^8, the official per-block figure. */
  function blockAllocation(mine,all){
    const block=(u,K)=>{if(!Number.isSafeInteger(u)||u<0)throw new Error('Holding units must be a non-negative integer');return u*unitRate(K)/10**RULES.tokenDecimals;};
    return {lo:block(mine.lo,all.hi),hi:block(mine.hi,all.lo)};
  }

  /**
   * Bounds of a weekly change in one world: before U0 of K0 programme units, after U0 + dU of K0 + dK (units, {lo,hi} each),
   * so the change is c·[U0·(r(K0 + dK) − r(K0)) + dU·r(K0 + dK)] with r the per-unit rate. It is linear in U0 and monotone in
   * dU and dK, so their bounds give its extremes; K0 is scanned over its integer range (one value when exact).
   */
  function weeklyChangeBounds(U0,dU,K0,dK){
    const c=RULES.weekBlocks/10**RULES.tokenDecimals;let lo=Infinity,hi=-Infinity;
    for(let k=K0.lo;k<=K0.hi;k++)for(const u of [U0.lo,U0.hi])for(const du of [dU.lo,dU.hi])for(const dk of [dK.lo,dK.hi]){
      const v=c*(u*(unitRate(k+dk)-unitRate(k))+du*unitRate(k+dk));if(v<lo)lo=v;if(v>hi)hi=v;}
    return {lo,hi};
  }

  /** 徽章文字：确定值 "+150%"，区间 "+50~150%"。 */
  function formatBonus(result) {
    return result.exact ? `+${result.lo.bonus}%` : `+${result.lo.bonus}~${result.hi.bonus}%`;
  }

  function formatWeight(result) {
    return result.exact ? `${result.lo.weight}%` : `${result.lo.weight}–${result.hi.weight}%`;
  }

  const catalogs=new WeakMap();
  /** Trait inputs for catalog rows. Supply counts minted and not-yet-minted catalog pieces, like the programme.
   * saleHistory is undefined when the snapshot carries no sale history; a known trait with no sales gets []. */
  function snapshotTraits(snap,indexes) {
    let catalog=catalogs.get(snap);
    if(!catalog){
      const counts=new Array(snap.traits.length).fill(0);
      for(const row of [...Object.values(snap.items),...(snap.pending??[])])for(const idx of row.slice(1))counts[idx]++;
      catalog={counts,history:snap.saleHistory===undefined?null:new Map(snap.saleHistory),
        official:new Map((snap.rewardBasis?.height===snap.snapshot.height?snap.rewardBasis.traits:[]).map(([idx,pct,source,supply])=>[idx,{pct,source,supply}]))};
      catalogs.set(snap,catalog);
    }
    const {counts,history,official}=catalog;
    return indexes.map(idx=>{const [type,value,floor,listed]=snap.traits[idx],o=official.get(idx);
      return {type,value,floor,listed,supply:o?.supply??counts[idx],...(history?{saleHistory:history.get(idx)??[]}:{}),...(o?{officialPct:o.pct,officialSource:o.source}:{})};});
  }
  function evaluateSnapshot(snap,id) {
    const [number,...indexes]=snap.items[id];return evaluate({number,traits:snapshotTraits(snap,indexes)},snap.snapshot.collectionFloor);
  }
  /** Programme boundary is start; rewarded blocks are start+1 .. start+weeks*weekBlocks.
   * Mirrors official weekAt/lastClaimableWeek indexing, including the one-block boundary. */
  function rewardPhase(snapshot) {
    const h=snapshot.height,start=RULES.startBlock,W=RULES.weekBlocks,end=start+RULES.weeks*W;
    if(!Number.isSafeInteger(h)||h<0)throw new Error('Invalid reward-context height');
    const state=h<start?'before':h===start?'boundary':h<=end?'active':h<=RULES.claimUntil?'ended':'closed';
    const index=state==='active'?Math.floor((h-start-1)/W):null;
    // Next boundary: the first rewarded block (week 1) before and at the start, the next week's first block while active.
    const next=state==='before'||state==='boundary'?start+1:state==='active'?start+(index+1)*W+1:null;
    const remaining=next===null?0:next-h,t=snapshot.blockTime;
    const eta=next!==null&&t?.height===h&&Number.isSafeInteger(t.timestamp)?(t.timestamp+remaining*600)*1000:null;
    return {state,start,end,claimUntil:RULES.claimUntil,index,week:index===null?null:index+1,first:index===null?null:start+index*W+1,last:index===null?null:start+(index+1)*W,next,remaining,eta};
  }
  function rewardBoundaries() {
    return [{kind:'launch',week:null,height:RULES.startBlock},...Array.from({length:RULES.weeks},(_,i)=>({kind:'week',week:i+1,height:RULES.startBlock+i*RULES.weekBlocks+1}))];
  }
  /** Public exits establish a minimum waiting boundary, never a positive eligibility certificate. */
  function rewardContext(snap,id,listing) {
    const phase=rewardPhase(snap.snapshot);
    if(phase.state==='before'||phase.state==='boundary')return {state:'not-started',phase};
    if(['ended','closed'].includes(phase.state))return {state:'ended',phase};
    if(listing==='listed')return {state:'listed',phase};
    const event=snap.rewardEvents?.find(e=>e[0]===id);
    if(event&&event[1]<=snap.snapshot.height){
      const firstWeek=Math.max(0,Math.ceil((event[1]-RULES.startBlock)/RULES.weekBlocks));
      if(firstWeek>=RULES.weeks)return {state:'no-future-week',phase,event:event[2],eventHeight:event[1]};
      const eligibleAt=RULES.startBlock+firstWeek*RULES.weekBlocks+1;
      if(snap.snapshot.height<eligibleAt)return {state:'waiting',phase,event:event[2],eventHeight:event[1],listHeight:event[3],eligibleAt};
    }
    return {state:'unverified',phase};
  }
  // Note weeks (official engine): a note created at block h — mint, buy, reclaim or transfer — earns from week index
  // ceil((h − start) ÷ 1008), 0 when h ≤ start; a note spent at block t — listing or sending — keeps only the weeks before
  // index floor((t − 1 − start) ÷ 1008). Listing records are [assetId, listing height, close height | null, kind].
  const startWeek=h=>h<=RULES.startBlock?0:Math.ceil((h-RULES.startBlock)/RULES.weekBlocks);
  const spendWeek=t=>Math.floor((t-1-RULES.startBlock)/RULES.weekBlocks);
  const byListing=records=>[...records].sort((a,b)=>a[1]-b[1]||(a[2]??Infinity)-(b[2]??Infinity));
  /**
   * A piece's notes from its public listing records, oldest first: the mint note, then one per close (a purchase creates
   * the buyer's note, a reclaim the lister's new one); each listing spends the note before it. A note earns weeks
   * firstWeek … lastWeek (week indexes; lastWeek null while unspent). Every piece minted so far was minted before rewards
   * started, so the mint note earns from index 0; a late mint (RULES.lateMintNumbers) was minted after the start at a block
   * the records do not show, so its mint note's firstWeek is null (unknown). Records out of chain order are rejected.
   */
  function notesOf(records,lateMint=false){
    if(!Array.isArray(records))throw new Error('Listing records must be an array');
    const notes=[{created:null,by:'mint',firstWeek:lateMint?null:0,lastWeek:null,spent:null}];
    for(const [,listing,close,kind] of byListing(records)){
      const note=notes.at(-1);
      if(!['active','sale','cancel'].includes(kind)||note.spent||note.created!==null&&listing<note.created||kind!=='active'&&!(close>=listing))throw new Error('Listing records out of chain order');
      note.spent={listing,close,kind};note.lastWeek=Math.min(RULES.weeks-1,spendWeek(listing)-1);
      if(kind!=='active')notes.push({created:close,by:kind,firstWeek:startWeek(close),lastWeek:null,spent:null});
    }
    return notes;
  }
  /**
   * One owner's run of notes: from the mint or a purchase, through that owner's reclaims (only the lister reclaims), up to
   * a sale, an open listing or the present. Private transfers are not public: a note received privately looks like part
   * of the sender's run.
   * anchor {height, listedAt, seller}: the piece was mine at block `height`, unlisted (listedAt null) or in my listing made
   * at listedAt. A listing open at the anchor that later sold is unclear — my sale, or the seller's listing I bought —
   * unless seller is true (that listing is known to be mine).
   * Returns {state:'held'|'listed'|'sold'|'unclear', notes: the run, sale: {listedAt, soldAt} | null}.
   */
  function ownership(records,anchor,lateMint=false){
    const notes=notesOf(records,lateMint);let at;
    if(anchor.listedAt!==null){
      at=notes.findIndex(n=>n.spent?.listing===anchor.listedAt);if(at<0)throw new Error('The anchor listing is not in the records');
      const l=notes[at].spent;if(l.kind==='sale'&&anchor.seller!==true)return {state:'unclear',notes:[],sale:{listedAt:l.listing,soldAt:l.close}};
    } else at=notes.findLastIndex(n=>n.created===null||n.created<=anchor.height);
    let s=at,e=at;while(notes[s].by==='cancel')s--;while(notes[e].spent?.kind==='cancel')e++;
    const run=notes.slice(s,e+1),end=run.at(-1).spent;
    return end===null?{state:'held',notes:run,sale:null}:end.kind==='active'?{state:'listed',notes:run,sale:null}
     :{state:'sold',notes:run,sale:{listedAt:end.listing,soldAt:end.close}};
  }
  /** A block-anchored planning estimate, never a live tip or eligibility deadline. */
  function launchStatus(snapshot) {
    const remaining=Math.max(0,RULES.startBlock-snapshot.height),time=snapshot.blockTime;
    const eta=remaining && time?.height===snapshot.height && Number.isSafeInteger(time.timestamp)?(time.timestamp+remaining*600)*1000:null;
    return {height:RULES.startBlock,remaining,state:remaining?'before':'reached',eta};
  }

  return { startWeek, spendWeek, notesOf, ownership, RULES, MAX_TRAIT_PCT, traitTier, formatRatio, basisRatio, numberTier, evaluate, evaluateSnapshot, snapshotTraits, recentSalesTier, traitInput, weightChange, units, programmeUnits, unitRate, weeklyAllocation, blockAllocation, weeklyChangeBounds, rewardPhase, rewardBoundaries, rewardContext, launchStatus, formatBonus, formatWeight };
});
