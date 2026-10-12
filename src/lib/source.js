/**
 * 数据来源与实时同步的纯逻辑（内容脚本、弹窗、后台、单测共用）：
 *   - 页面显示哪份数据（实时 / 手动同步 / 内置快照）
 *   - 后台这一轮要不要检查新区块、失败后等多久再试
 *   - 失败原因分类（弹窗里给用户看）
 * 任何一次同步失败都不会动已有数据：页面始终按手上最新的一份数据工作。
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ShnakasSource = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  /** chrome.storage.local 的键 */
  const KEYS = Object.freeze({
    manual: 'snapshot',          // 弹窗「手动同步」得到的数据
    live: 'liveSnapshot',        // 实时同步得到的数据
    liveEnabled: 'liveEnabled',  // 实时同步开关
    liveStatus: 'liveStatus',    // 实时同步最近一次检查的结果
  });
  const SESSION_VISIBLE = 'visibleAt'; // chrome.storage.session：最近一次有 ord-dropz 页面可见的时间

  const LIVE_DEFAULT = true;            // New installs follow live blocks; explicit saved fixed mode is preserved.
  const CHECK_MS = 60 * 1000;           // 每分钟最多检查一次 /pulse
  const HEARTBEAT_MS = 45 * 1000;       // 页面可见时每 45 秒报一次心跳
  const VISIBLE_MS = 100 * 1000;        // 100 秒内收到过心跳才算「有页面在看」（容得下一次心跳延迟）
  const BACKOFF_MAX_MIN = 30;

  /** Missing preferences use the live default; malformed values fall back to fixed mode. */
  function resolveLive(stored) { return stored === undefined ? LIVE_DEFAULT : stored === true; }

  /** Validate persisted data before any consumer dereferences it. Storage is not a trust boundary. */
  function isSnapshot(s, format = 1) {
    const uint = n => Number.isSafeInteger(n) && n >= 0;
    const text = v => typeof v === 'string' && v.length > 0 && v.length <= 512 && !v.includes('\0');
    if (!s || s.format !== format || !s.collection || !s.snapshot || !Array.isArray(s.traits) || !s.items || typeof s.items !== 'object' || Array.isArray(s.items)) return false;
    const c = s.collection, h = s.snapshot;
    if (c.slug !== 'shielded-nakas-mupv6wja' || !text(c.name) || !text(c.cid) || !text(c.rulesInscriptionId) || !uint(c.numberStart)) return false;
    if (h.blockTime != null && ((typeof h.blockTime !== 'object' || Array.isArray(h.blockTime)) || h.blockTime.height !== h.height || typeof h.blockTime.hash !== 'string' || !/^[0-9a-f]{64}$/.test(h.blockTime.hash) || !Number.isSafeInteger(h.blockTime.timestamp) || h.blockTime.timestamp < 1231006505 || h.blockTime.timestamp > 0xffffffff)) return false;
    if (!uint(h.height) || !uint(h.indexerHeight) || h.indexerHeight < h.height || !uint(h.listings) || h.listings === 0 || !uint(h.collectionFloor) || h.collectionFloor === 0 || typeof h.generatedAt !== 'string' || !Number.isFinite(Date.parse(h.generatedAt))) return false;
    const keys = Object.keys(s.items);
    if (!keys.length || keys.length > 10000 || h.listings > keys.length || s.traits.length > 10000) return false;
    const traits = new Set();
    for (const t of s.traits) {
      if (!Array.isArray(t) || t.length !== 4 || !text(t[0]) || !text(t[1]) || t[0] === 'Shielded #' || !uint(t[3]) || t[3] > h.listings) return false;
      if (t[2] === null ? t[3] !== 0 : (!uint(t[2]) || t[2] < h.collectionFloor || t[3] === 0)) return false;
      const key = JSON.stringify(t.slice(0, 2));
      if (traits.has(key)) return false;
      traits.add(key);
    }
    const numbers = new Set();
    for (const id of keys) {
      const row = s.items[id];
      if (!/^[0-9a-f]{64}i\d+$/.test(id) || !Array.isArray(row) || !row.length || !uint(row[0]) || row[0] < c.numberStart || numbers.has(row[0])) return false;
      numbers.add(row[0]);
      const used = new Set();
      for (const i of row.slice(1)) {
        if (!uint(i) || i >= s.traits.length || used.has(i)) return false;
        used.add(i);
      }
    }
    if(s.sales!==undefined) {
      if(!Array.isArray(s.sales)||s.sales.length>s.traits.length)return false;
      const seen=new Set();
      for(const sale of s.sales){if(!Array.isArray(sale)||sale.length!==3||!uint(sale[0])||sale[0]>=s.traits.length||seen.has(sale[0])||!uint(sale[1])||sale[1]===0||!uint(sale[2])||sale[2]>h.height)return false;seen.add(sale[0]);}
    }
    if (s.offers !== undefined) {
      if(!Array.isArray(s.offers) || s.offers.length !== h.listings) return false;
      const seen=new Set(), floors=new Map();let floor=Infinity;
      for(const offer of s.offers) {
        if(!Array.isArray(offer) || offer.length!==2 || typeof offer[0]!=='string' || !Object.prototype.hasOwnProperty.call(s.items,offer[0]) || seen.has(offer[0]) || !uint(offer[1]) || offer[1]===0) return false;
        seen.add(offer[0]);floor=Math.min(floor,offer[1]);
        for(const idx of s.items[offer[0]].slice(1)) { const f=floors.get(idx);floors.set(idx,{floor:Math.min(f?.floor??Infinity,offer[1]),listed:(f?.listed||0)+1}); }
      }
      if(floor!==h.collectionFloor) return false;
      for(let i=0;i<s.traits.length;i++) {const f=floors.get(i);if(s.traits[i][2] !== (f?.floor??null) || s.traits[i][3] !== (f?.listed??0))return false;}
    }
    return true;
  }

  function compatibleSnapshot(s, bundled) {
    return isSnapshot(s, bundled.format) && s.collection.cid === bundled.collection.cid && s.collection.numberStart === bundled.collection.numberStart;
  }

  /** Prefer enabled live, then manual, then bundled; reject corrupt/incompatible persisted data. */
  function choose({ liveEnabled, live, manual }, bundled) {
    const usable = s => compatibleSnapshot(s, bundled);
    if (resolveLive(liveEnabled) && usable(live)) return { snap: live, source: 'live' };
    if (usable(manual)) return { snap: manual, source: 'synced' };
    return { snap: bundled, source: 'bundled' };
  }

  /** Invalid progress records must not crash the popup or create NaN backoff delays. */
  function statusOf(s, type) {
    const uint = n => Number.isSafeInteger(n) && n >= 0;
    if (!s || typeof s !== 'object') return undefined;
    if (type === 'live') {
      if (!uint(s.checkedAt)) return undefined;
      if (s.state === 'ok') return s;
      if (s.state !== 'error' || !uint(s.nextAt) || !uint(s.waitMin) || !uint(s.failures) || s.failures < 1) return undefined;
      if (!['rate-limit','server','http','network','data'].includes(s.kind) || !(s.status === null || uint(s.status)) || typeof s.message !== 'string') return undefined;
      return s;
    }
    if (s.state === 'done' && uint(s.height)) return s;
    if (s.state === 'interrupted') return s;
    if (s.state === 'error' && typeof s.message === 'string') return s;
    if (s.state === 'running' && ['state','meta','build'].includes(s.stage) && (s.stage !== 'meta' || (uint(s.done) && uint(s.total) && s.done <= s.total))) return s;
    return undefined;
  }

  /** 后台这一轮要不要读 /pulse：开关开着、最近有可见的 ord-dropz 页面、距上次检查满一分钟、不在退避等待期内。 */
  function shouldCheck({ enabled, now, visibleAt, lastCheckAt, nextAt }) {
    if (!enabled) return false;
    if (visibleAt === undefined || now - visibleAt > VISIBLE_MS) return false;
    if (lastCheckAt !== undefined && now - lastCheckAt < CHECK_MS) return false;
    if (nextAt !== undefined && now < nextAt) return false;
    return true;
  }

  /** 连续失败 n 次后等几分钟再试：1, 2, 4, 8, 16, 30, 30…；服务端给了 Retry-After 时取两者较大者。 */
  function backoffMinutes(failures, retryAfterSec) {
    if (!Number.isSafeInteger(failures) || failures < 1) throw new Error(`失败次数非法：${failures}`);
    const exp = Math.min(BACKOFF_MAX_MIN, 2 ** (failures - 1));
    return retryAfterSec === null ? exp : Math.max(exp, Math.ceil(retryAfterSec / 60));
  }

  /**
   * 失败原因分类：
   *   rate-limit 被限流（HTTP 429） · server 服务端出错（5xx） · http 其它 HTTP 错误 · network 网络不通或超时 · data 数据校验没通过
   * 只有 snapshot-core.fetchJson 抛出的错误带 isFetch；其余都是数据校验抛出的。
   */
  function classify(err) {
    if (err.isFetch !== true) return 'data';
    if (err.status === 429) return 'rate-limit';
    if (err.status !== null && err.status >= 500) return 'server';
    if (err.status !== null) return 'http';
    return 'network';
  }

  return { KEYS, SESSION_VISIBLE, LIVE_DEFAULT, CHECK_MS, HEARTBEAT_MS, VISIBLE_MS, resolveLive, isSnapshot, compatibleSnapshot, statusOf, choose, shouldCheck, backoffMinutes, classify };
});
