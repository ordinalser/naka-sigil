/**
 * SHNAKAS 奖励权重规则：纯函数，无 DOM、无网络。内容脚本、弹窗、快照脚本、构建校验、单测与 E2E 共用这一份。
 *
 * 规则出处：https://x.com/Ob1_Wan_Satoshi/status/2108018318141755694（2026-10-08，正文 + 配图）
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
    publishedAt: '2026-10-08',
    startBlock: 971700,
    // 官方只说明季度初测量，未公布确切测量高度。不能把 startBlock - 1 当作官方测量点。
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
      if(t.supply<RULES.heldSupply && t.lastSale!=null){assertSats(t.lastSale,'Last sale');return {...t,...traitTier(t.lastSale,collectionFloorSats),method:'last-sale',basisPrice:t.lastSale};}
      return {...t,measured:false,method:'missing-sale',basisPrice:null};
    });
    const number = Object.assign({ value: piece.number }, numberTier(piece.number));
    const measuredPct = traits.reduce((s, t) => s + (t.measured ? t.pct : 0), 0);
    const unmeasured = traits.filter((t) => !t.measured).length;
    const loRaw = RULES.basePct + measuredPct + number.pct;
    const hiRaw = loRaw + unmeasured * MAX_TRAIT_PCT;
    const lo = bound(loRaw);
    const hi = bound(hiRaw);
    return { traits, number, unmeasured, lo, hi, exact: lo.weight === hi.weight };
  }

  /** 徽章文字：确定值 "+150%"，区间 "+50~150%"。 */
  function formatBonus(result) {
    return result.exact ? `+${result.lo.bonus}%` : `+${result.lo.bonus}~${result.hi.bonus}%`;
  }

  function formatWeight(result) {
    return result.exact ? `${result.lo.weight}%` : `${result.lo.weight}–${result.hi.weight}%`;
  }

  const catalogs=new WeakMap();
  function snapshotTraits(snap,indexes) {
    let catalog=catalogs.get(snap);
    if(!catalog){const counts=new Array(snap.traits.length).fill(0);for(const row of Object.values(snap.items))for(const idx of row.slice(1))counts[idx]++;catalog={counts,sales:new Map((snap.sales??[]).map(([idx,price])=>[idx,price]))};catalogs.set(snap,catalog);}
    const {counts,sales}=catalog;
    return indexes.map(idx=>{const [type,value,floor,listed]=snap.traits[idx];return {type,value,floor,listed,supply:counts[idx],lastSale:sales.get(idx)??null};});
  }
  function evaluateSnapshot(snap,id) {
    const [number,...indexes]=snap.items[id];return evaluate({number,traits:snapshotTraits(snap,indexes)},snap.snapshot.collectionFloor);
  }
  /** A block-anchored planning estimate, never a live tip or eligibility deadline. */
  function launchStatus(snapshot) {
    const remaining=Math.max(0,RULES.startBlock-snapshot.height),time=snapshot.blockTime;
    const eta=remaining && time?.height===snapshot.height && Number.isSafeInteger(time.timestamp)?(time.timestamp+remaining*600)*1000:null;
    return {height:RULES.startBlock,remaining,state:remaining?'before':'reached',eta};
  }

  return { RULES, MAX_TRAIT_PCT, traitTier, formatRatio, numberTier, evaluate, evaluateSnapshot, snapshotTraits, launchStatus, formatBonus, formatWeight };
});
