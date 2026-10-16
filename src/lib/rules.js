/**
 * SHNAKAS 奖励权重规则：纯函数，无 DOM、无网络。内容脚本、弹窗、快照脚本、构建校验、单测与 E2E 共用这一份。
 *
 * Current block-formula evidence: rewardsSource below; quarterly snapshot heights remain unconfirmed.
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
   * block make the window ambiguous, every possible window is evaluated and the trait keeps those bounds.
   */
  function recentSalesTier(history,pendingSale,collectionFloorSats) {
    if(!Array.isArray(history))throw new Error('Invalid sale history');
    for(const [price,height] of history){assertSats(price,'成交价');if(!Number.isSafeInteger(height)||height<0)throw new Error('Invalid sale height');}
    if(pendingSale!==undefined)assertSats(pendingSale,'假设成交价');
    const fixed=pendingSale===undefined?[]:[pendingSale],need=RULES.recentSales-fixed.length;
    const windows=[];
    if(history.length<=need)windows.push([...fixed,...history.map(([p])=>p)]);
    else {
      const edge=history[need-1][1],newer=history.filter(([,h])=>h>edge).map(([p])=>p),tied=history.filter(([,h])=>h===edge).map(([p])=>p),take=need-newer.length;
      const pick=(start,chosen)=>{if(chosen.length===take){windows.push([...fixed,...newer,...chosen]);return;}for(let i=start;i<tied.length;i++)pick(i+1,[...chosen,tied[i]]);};
      if(tied.length>12)throw new Error('Too many same-block sales for one trait');
      pick(0,[]);
    }
    const c=BigInt(collectionFloorSats);
    const tierOf=(sum,count)=>{const hit=RULES.traitTiers.find(t=>sum*BigInt(t.den)>=c*BigInt(t.num)*BigInt(count));return hit?hit.pct:0;};
    const results=windows.map(w=>{
      if(!w.length)return {pct:0,price:null};
      const v=[...w].sort((a,b)=>a-b),mid=v.length===2?[v[0],v[1]]:[v[(v.length-1)/2]];
      return {pct:tierOf(mid.reduce((s,x)=>s+BigInt(x),0n),mid.length),price:Math.floor(mid.reduce((s,x)=>s+x,0)/mid.length)};
    });
    const pcts=results.map(r=>r.pct),lo=Math.min(...pcts),hi=Math.max(...pcts);
    if(lo!==hi)return {measured:false,method:'sales-ambiguous',basisPrice:null,pctLo:lo,pctHi:hi};
    const r=results[0];
    return r.price===null?{measured:true,pct:0,ratio:null,method:'no-sales',basisPrice:null}
      :{measured:true,pct:r.pct,ratio:r.price/collectionFloorSats,method:'sales-median',basisPrice:r.price};
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
  function unitRate(K){
    if(!Number.isSafeInteger(K)||K<=0)throw new Error('Programme units must be a positive integer');
    return Number(BigInt(RULES.poolPerWeekBase)/(BigInt(RULES.weekBlocks)*BigInt(K)));
  }
  /** Weekly SHNAKAS for `mine` units out of `all` units (both {lo,hi}): units × v × weekBlocks, exactly the official
   * perBlock × 1008. Bounds widen for ranges. */
  function weeklyAllocation(mine,all){
    const week=(u,K)=>{if(!Number.isSafeInteger(u)||u<0)throw new Error('Holding units must be a non-negative integer');return u*unitRate(K)*RULES.weekBlocks/10**RULES.tokenDecimals;};
    return {lo:week(mine.lo,all.hi),hi:week(mine.hi,all.lo)};
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
    const next=state==='before'?start:state==='boundary'?start+1:state==='active'?start+(index+1)*W+1:null;
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
      if(snap.snapshot.height<eligibleAt)return {state:'waiting',phase,event:event[2],eventHeight:event[1],eligibleAt};
    }
    return {state:'unverified',phase};
  }
  /** A block-anchored planning estimate, never a live tip or eligibility deadline. */
  function launchStatus(snapshot) {
    const remaining=Math.max(0,RULES.startBlock-snapshot.height),time=snapshot.blockTime;
    const eta=remaining && time?.height===snapshot.height && Number.isSafeInteger(time.timestamp)?(time.timestamp+remaining*600)*1000:null;
    return {height:RULES.startBlock,remaining,state:remaining?'before':'reached',eta};
  }

  return { RULES, MAX_TRAIT_PCT, traitTier, formatRatio, numberTier, evaluate, evaluateSnapshot, snapshotTraits, recentSalesTier, units, programmeUnits, unitRate, weeklyAllocation, rewardPhase, rewardBoundaries, rewardContext, launchStatus, formatBonus, formatWeight };
});
