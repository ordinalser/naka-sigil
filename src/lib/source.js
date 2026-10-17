/**
 * 数据来源与实时同步的纯逻辑（内容脚本、弹窗、后台、单测共用）：
 *   - 页面显示哪份数据（实时，或内置快照）
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
    live: 'liveSnapshot',        // 实时同步得到的数据
    liveStatus: 'liveStatus',    // 实时同步最近一次检查的结果
    closing: 'liveClosing',      // 同一区块内重读 /listings 得到的成交确认中 / 撤单中挂单 {height, rows}
  });
  const SESSION_VISIBLE = 'visibleAt'; // chrome.storage.session：最近一次有 ord-dropz 页面可见的时间

  /** This code's version (package.json; the build refuses a mismatch). The worker runs its upgrade step once per version.
   * After the folder's files are replaced, Chrome loads the new pages at once but keeps running the previous worker until
   * the extension is reloaded: a page asks the worker which version it runs (shn-build), and a worker from before this
   * check does not answer at all. */
  const BUILD = '0.12.5';
  /** Whether the worker runs this code, from its answer to shn-build (undefined when it sent none). */
  function sameBuild(answer) { return answer !== null && typeof answer === 'object' && answer.ok === true && answer.build === BUILD; }
  /** chrome.storage.local: the page that asked for that reload, {page: 'popup' | 'workspace', section, at}. Chrome closes
   * every extension page on reload; the new worker opens it again, if asked within REOPEN_MS. */
  const REOPEN = 'nakaReopen', REOPEN_MS = 60 * 1000;

  const CHECK_MS = 60 * 1000;           // 每分钟最多检查一次 /pulse
  const HEARTBEAT_MS = 45 * 1000;       // 页面可见时每 45 秒报一次心跳
  const VISIBLE_MS = 100 * 1000;        // 100 秒内收到过心跳才算「有页面在看」（容得下一次心跳延迟）
  const BACKOFF_MAX_MIN = 30;


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
    // Pending catalog rows first: the sale-history check below counts their traits.
    if(s.pending!==undefined) {
      if(!Array.isArray(s.pending)||!s.pending.length||s.pending.length+keys.length>10000)return false;
      for(const row of s.pending){
        if(!Array.isArray(row)||row.length<2||!uint(row[0])||row[0]<c.numberStart||numbers.has(row[0]))return false;
        numbers.add(row[0]);const used=new Set();
        for(const i of row.slice(1)){if(!uint(i)||i>=s.traits.length||used.has(i))return false;used.add(i);}
      }
    }
    // The former single-sale field is a different rule basis; such data is replaced by a fresh sync.
    if(s.sales!==undefined)return false;
    if(s.saleHistory!==undefined) {
      if(!Array.isArray(s.saleHistory)||s.saleHistory.length>s.traits.length)return false;
      // Only traits under 20 catalog pieces (minted and pending) are priced from sales, so only they carry a history.
      const supply=new Array(s.traits.length).fill(0);for(const row of [...Object.values(s.items),...(Array.isArray(s.pending)?s.pending:[])])for(const i of row.slice(1))if(uint(i)&&i<supply.length)supply[i]++;
      const seen=new Set();
      for(const entry of s.saleHistory){
        if(!Array.isArray(entry)||entry.length!==2||!uint(entry[0])||entry[0]>=s.traits.length||seen.has(entry[0])||supply[entry[0]]>=20||!Array.isArray(entry[1])||!entry[1].length)return false;
        seen.add(entry[0]);let prev=Infinity;
        for(const sale of entry[1]){if(!Array.isArray(sale)||sale.length!==2||!uint(sale[0])||sale[0]===0||!uint(sale[1])||sale[1]>h.height||sale[1]>prev)return false;prev=sale[1];}
        // Beyond three, only sales tied with the third (same block) may remain.
        if(entry[1].length>3&&entry[1].some(([,height])=>height<entry[1][2][1]))return false;
      }
    }
    if(s.rewardBasis!==undefined) {
      const b=s.rewardBasis;
      if(!b||typeof b!=='object'||Array.isArray(b)||Object.keys(b).sort().join()!=='height,traits'||b.height!==h.height||!Array.isArray(b.traits)||b.traits.length!==s.traits.length)return false;
      const counts=new Array(s.traits.length).fill(0);for(const row of Object.values(s.items))for(const idx of row.slice(1))counts[idx]++;
      const seen=new Set();for(const row of b.traits){if(!Array.isArray(row)||row.length!==4)return false;const[idx,pct,source,supply]=row;
        if(!uint(idx)||idx>=s.traits.length||seen.has(idx)||![0,25,50,75,100].includes(pct)||!['ask','sales','zeroListed','none','lastBlock'].includes(source)||!uint(supply)||supply<counts[idx]||supply>10000)return false;
        const floor=s.traits[idx][2];if(floor!==null?source!=='ask':source==='ask'||source==='zeroListed'&&(supply<20||pct!==100)||['sales','none','lastBlock'].includes(source)&&supply>=20||source==='none'&&pct!==0)return false;
        seen.add(idx);
      }
    }
    if(s.rewardEvents!==undefined){
      if(!Array.isArray(s.rewardEvents)||s.rewardEvents.length>Object.keys(s.items).length)return false;
      const seen=new Set();for(const e of s.rewardEvents){if(!Array.isArray(e)||e.length!==4||!Object.hasOwn(s.items,e[0])||seen.has(e[0])||!uint(e[1])||e[1]>h.height||!['sale','cancel','exit'].includes(e[2])||!uint(e[3])||e[3]>e[1])return false;seen.add(e[0]);}
    }
    if(s.listedAt!==undefined){
      if(!Array.isArray(s.listedAt)||!Array.isArray(s.offers)||s.listedAt.length!==s.offers.length)return false;
      const listed=new Set(s.offers.filter(Array.isArray).map(o=>o[0])),seen=new Set();
      for(const row of s.listedAt){if(!Array.isArray(row)||row.length!==2||!listed.has(row[0])||seen.has(row[0])||!uint(row[1])||row[1]>h.height)return false;seen.add(row[0]);}
    }
    if(s.credits!==undefined){
      if(!Array.isArray(s.credits)||!Array.isArray(s.offers)||s.credits.length>s.offers.length)return false;
      const listed=new Set(s.offers.filter(Array.isArray).map(o=>o[0])),seen=new Set();
      for(const credit of s.credits){if(!Array.isArray(credit)||credit.length!==2||!listed.has(credit[0])||seen.has(credit[0])||!uint(credit[1]))return false;seen.add(credit[0]);}
    }
    if(s.closing!==undefined){
      if(!Array.isArray(s.closing)||!Array.isArray(s.offers)||s.closing.length>s.offers.length)return false;
      const listed=new Set(s.offers.filter(Array.isArray).map(o=>o[0])),seen=new Set();
      for(const row of s.closing){if(!Array.isArray(row)||row.length!==2||!listed.has(row[0])||seen.has(row[0])||!['sale','cancel'].includes(row[1]))return false;seen.add(row[0]);}
    }
    // Every active listing at the block: listing status, floors and the rule inputs all depend on the complete set.
    {
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

  /**
   * Listings already closing, re-read between blocks: purchases confirming (sale) and reclaims under way (cancel) appear
   * as they are sent, minutes before the next block. A record replaces the snapshot's own `closing` only for the same
   * block and only when it names that block's active listings, each once; another block's record says nothing about
   * this one. The merged snapshot is reused while the record's content is unchanged, so pages keep their caches.
   */
  const merged = new WeakMap();
  function withClosing(snap, record) {
    if (!record || typeof record !== 'object' || record.height !== snap.snapshot.height || !Array.isArray(record.rows)) return snap;
    const offers = new Set(snap.offers.map(o => o[0])), seen = new Set();
    for (const row of record.rows) {
      if (!Array.isArray(row) || row.length !== 2 || !offers.has(row[0]) || seen.has(row[0]) || !['sale', 'cancel'].includes(row[1])) return snap;
      seen.add(row[0]);
    }
    const key = JSON.stringify(record.rows), hit = merged.get(snap);
    if (hit?.key === key) return hit.snap;
    const next = { ...snap, closing: record.rows.map(([id, kind]) => [id, kind]) };
    merged.set(snap, { key, snap: next });
    return next;
  }

  /** The newest live data when it is usable (with its between-block closing record), otherwise the bundled snapshot;
   * corrupt or incompatible data is never used. */
  function choose({ live, closing }, bundled) {
    return compatibleSnapshot(live, bundled) ? { snap: withClosing(live, closing), source: 'live' } : { snap: bundled, source: 'bundled' };
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

  /** 后台这一轮要不要读 /pulse：最近有可见的 Ord Dropz 页面、插件页面或弹窗，距上次检查满一分钟，不在退避等待期内。 */
  function shouldCheck({ now, visibleAt, lastCheckAt, nextAt }) {
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

  return { KEYS, SESSION_VISIBLE, BUILD, sameBuild, REOPEN, REOPEN_MS, CHECK_MS, HEARTBEAT_MS, VISIBLE_MS, isSnapshot, compatibleSnapshot, statusOf, withClosing, choose, shouldCheck, backoffMinutes, classify };
});
