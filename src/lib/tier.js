/**
 * 徽章配色分级：按「理论区间下限」（不代表保证收益）分档。
 * 色阶沿用站点稀有度的色系 灰 → 绿 → 蓝 → 紫 → 金（Common → Uncommon → Rare → Epic → Legendary），
 * 用户不用学新的颜色语言；最高档 = 总权重已达上限（加成 = 上限 − 基础），用静态金色。
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ShnakasTier = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // 按下限从高到低；最高档 max 不在表里，由 atCap 单独判定
  const BANDS = Object.freeze([
    Object.freeze({ key: 't3', min: 200 }),
    Object.freeze({ key: 't2', min: 100 }),
    Object.freeze({ key: 't1', min: 1 }),
  ]);

  /**
   * @param result rules.evaluate 的结果；快照里没有这件藏品时为 null
   * @returns {'unknown'|'max'|'t3'|'t2'|'t1'|'zero'}
   */
  function tierOf(result) {
    if (result === null) return 'unknown';
    return boundTier(result.lo);
  }

  /** A range endpoint has its own tier; never reuse the other endpoint's color. */
  function boundTier(bound) {
    if(bound.atCap) return 'max';
    return BANDS.find(b=>bound.bonus>=b.min)?.key || 'zero';
  }

  /**
   * 图例（弹窗用）：每档实际能出现的最小加成。t1 是规则里最小的单项加成；最高档是上限 − 基础。
   * @param RULES rules.js 的 RULES
   */
  function legend(RULES) {
    const smallest = Math.min(...RULES.traitTiers.map((t) => t.pct), ...RULES.numberTiers.map((t) => t.pct));
    return [
      { key: 't1', from: smallest },
      { key: 't2', from: BANDS[1].min },
      { key: 't3', from: BANDS[0].min },
      { key: 'max', from: RULES.capPct - RULES.basePct },
    ];
  }

  return { BANDS, tierOf, boundTier, legend };
});
