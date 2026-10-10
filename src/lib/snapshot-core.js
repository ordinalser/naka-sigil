/**
 * 快照核心：从 shielded 协议的链上状态生成「每个特征的地板价」数据。
 * 命令行（scripts/snapshot.js）与扩展后台的「同步」（sw/sync-sw.js）共用这一份，两条路径产出同一格式、同一结果。
 *
 * 规则（推文）：每个特征的地板价在季度初按链上数据测一次，与集合地板价相比定档，季度内不变。据此：
 *   1. 从完整事件日志（/state）还原「区块 H 确认之后仍有效」的挂单集合——挂单的上架高度在 listing.height，
 *      成交/取回交易的高度在 notes 里，用现有事件字段重建；历史价格仍取决于协议是否保留原价，不能宣称官方结算。
 *   2. 每件藏品的美术特征取自官方元数据（/meta/<assetId>）；编号 = global.start + assetId。
 *      元数据里的 "Shielded #" 属性就是编号本身，号码加成另有规则（只取最高一档），不能再当特征计入。
 *      美术特征铸造后不会变：已知藏品直接复用已有快照里的特征，只给新铸造的藏品拉元数据。
 *   3. 特征地板价 = 带该特征的有效挂单的最低价；集合地板价 = 全部有效挂单的最低价。
 * 任何数据不一致都直接抛错，不产出半成品快照。
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ShnakasSnapshot = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const FORMAT = 1;
  const API = 'https://shielded-mint-server-production.up.railway.app/api/shielded';
  const COLLECTION = Object.freeze({ slug: 'shielded-nakas-mupv6wja', name: 'Shielded Nakas' });
  const NUMBER_TRAIT_TYPE = 'Shielded #';
  const META_CONCURRENCY = 8;
  const FETCH_ATTEMPTS = 3;
  const SEP = '\u0000';

  // ------------------------------------------------------------ 链上状态还原

  /** notes 里每笔交易的确认高度。同一交易产生的多个 note 必然同高，不同则说明数据有误。 */
  function txHeights(notes) {
    const m = new Map();
    for (const n of notes) {
      if (!Number.isSafeInteger(n.height) || n.height < 0) throw new Error(`note ${n.txid}:${n.pos} 缺少确认高度`);
      const prev = m.get(n.txid);
      if (prev !== undefined && prev !== n.height) throw new Error(`交易 ${n.txid} 的 note 高度不一致：${prev} / ${n.height}`);
      m.set(n.txid, n.height);
    }
    return m;
  }

  // 每种挂单状态对应唯一的关闭字段（2026-10-08 实测 /state 只有这三种：SOLD 由买单 note 关闭、CLAIMED 由卖家取回 note 关闭）。
  // 出现其它状态、或 closedTxid 非空，说明协议有了新的关闭方式，要先核实语义再改这里，而不是猜。
  const CLOSE_FIELD = Object.freeze({ ACTIVE: null, SOLD: 'soldTxid', CLAIMED: 'claimTxid' });
  const CLOSE_FIELDS = ['soldTxid', 'claimTxid', 'closedTxid'];

  /** 挂单的关闭高度；仍有效的挂单返回 null。 */
  function closeHeight(listing, heights) {
    if (!Object.prototype.hasOwnProperty.call(CLOSE_FIELD, listing.state)) {
      throw new Error(`挂单 ${listing.nf} 的状态 ${listing.state} 未知，需要先确认它的关闭语义`);
    }
    const field = CLOSE_FIELD[listing.state];
    for (const f of CLOSE_FIELDS) {
      if (f !== field && listing[f]) throw new Error(`挂单 ${listing.nf} 状态为 ${listing.state}，却带有 ${f}`);
    }
    if (field === null) return null;
    const txid = listing[field];
    if (!txid) throw new Error(`挂单 ${listing.nf} 状态为 ${listing.state}，但缺少 ${field}`);
    const h = heights.get(txid);
    if (h === undefined) throw new Error(`挂单 ${listing.nf} 的关闭交易 ${txid} 不在 notes 里，无法确定关闭高度`);
    return h;
  }

  /** 区块 H 确认之后仍在链上有效的挂单：上架高度 ≤ H，且尚未关闭或关闭高度 > H。 */
  function activeListingsAt(listings, notes, H) {
    if (!Number.isSafeInteger(H) || H < 0) throw new Error(`快照高度非法：${H}`);
    const heights = txHeights(notes);
    const out = [];
    for (const l of listings) {
      if (!Number.isSafeInteger(l.height) || l.height < 0) throw new Error(`挂单 ${l.nf} 缺少上架高度`);
      const closed = closeHeight(l, heights);
      if (closed !== null && closed < l.height) throw new Error(`挂单 ${l.nf} 的关闭高度 ${closed} 早于上架高度 ${l.height}`);
      if (l.height <= H && (closed === null || closed > H)) out.push(l);
    }
    return out;
  }

  function priceSats(listing) {
    if (!(typeof listing.price === 'number' || (typeof listing.price === 'string' && /^\d+$/.test(listing.price)))) throw new Error(`挂单 ${listing.nf} 的价格非法`);
    const p = Number(listing.price);
    if (!Number.isSafeInteger(p) || p <= 0) throw new Error(`挂单 ${listing.nf} 的价格非法：${listing.price}`);
    return p;
  }

  /** Last confirmed trait sale at H. Conflicting prices in the same block have no proven order. */
  function lastSalesAt(listings,notes,H,traitsByAsset) {
    const heights=txHeights(notes),latest=new Map();
    for(const l of listings) {
      if(!Number.isSafeInteger(l.height)||l.height<0)throw new Error('Listing height missing');
      const height=closeHeight(l,heights);
      if(l.state!=='SOLD')continue;
      if(height>H)continue;
      if(height<l.height)throw new Error('Sale precedes listing');
      const price=priceSats(l),traits=traitsByAsset.get(l.assetId);
      if(!traits)throw new Error('Sold asset missing metadata');
      for(const [type,value]of traits) {
        const key=type+SEP+value,prev=latest.get(key);
        if(!prev||height>prev.height)latest.set(key,{height,prices:new Set([price])});
        else if(height===prev.height)prev.prices.add(price);
      }
    }
    return new Map([...latest].filter(([,s])=>s.prices.size===1).map(([key,s])=>[key,{height:s.height,price:[...s.prices][0]}]));
  }

  /**
   * 汇总地板价。
   * @param active 有效挂单
   * @param traitsByAsset Map<assetId, Array<[type, value]>>
   * @returns {{collectionFloor:number, floors:Map<string,{floor:number, listed:number}>}} key 为 type + SEP + value
   */
  function floorsOf(active, traitsByAsset) {
    if (active.length === 0) throw new Error('快照高度上没有任何有效挂单，集合地板价不存在，无法定档');
    let collectionFloor = Infinity;
    const floors = new Map(), assets = new Set(), nfs = new Set();
    for (const l of active) {
      if (assets.has(l.assetId) || nfs.has(l.nf)) throw new Error('Duplicate active listing');
      assets.add(l.assetId); nfs.add(l.nf);
      const price = priceSats(l);
      const traits = traitsByAsset.get(l.assetId);
      if (!traits) throw new Error(`挂单 ${l.nf} 的资产 ${l.assetId} 没有元数据（未铸造的资产不可能挂单）`);
      collectionFloor = Math.min(collectionFloor, price);
      for (const [type, value] of traits) {
        const key = type + SEP + value;
        const cur = floors.get(key);
        if (cur) { cur.floor = Math.min(cur.floor, price); cur.listed += 1; }
        else floors.set(key, { floor: price, listed: 1 });
      }
    }
    return { collectionFloor, floors };
  }

  // ------------------------------------------------------------ 特征

  /**
   * 元数据 → 美术特征。"Shielded #" 属性与 shielded.number 若存在，必须等于编号，然后剔除出特征列表。
   * @returns {Array<[string, string]>}
   */
  function artTraits(meta, assetId, number) {
    if (!meta || !Array.isArray(meta.attributes)) throw new Error(`资产 ${assetId} 的元数据缺少 attributes`);
    if (meta.shielded && meta.shielded.number !== number) {
      throw new Error(`资产 ${assetId} 的 shielded.number=${meta.shielded.number} 与编号 ${number} 不符`);
    }
    const out = [];
    const seen = new Set();
    for (const a of meta.attributes) {
      if (typeof a.trait_type !== 'string' || typeof a.value !== 'string') throw new Error(`资产 ${assetId} 有非字符串属性`);
      if (a.trait_type === NUMBER_TRAIT_TYPE) {
        if (Number(a.value) !== number) throw new Error(`资产 ${assetId} 的 "${NUMBER_TRAIT_TYPE}"=${a.value} 与编号 ${number} 不符`);
        continue;
      }
      if (!a.trait_type || !a.value || a.trait_type.includes(SEP) || a.value.includes(SEP)) throw new Error(`资产 ${assetId} 的属性为空或含分隔符`);
      const key = JSON.stringify([a.trait_type, a.value]);
      if (seen.has(key)) throw new Error(`资产 ${assetId} 的重复特征：${a.trait_type} / ${a.value}`);
      seen.add(key);
      out.push([a.trait_type, a.value]);
    }
    if (out.length === 0) throw new Error(`资产 ${assetId} 没有任何美术特征`);
    return out;
  }

  /**
   * 已有快照里的特征：铭文 ID → { number, traits }。几份快照对同一铭文给出不同的编号或特征，说明数据有误，直接抛错。
   */
  function knownTraits(bases) {
    const m = new Map();
    for (const b of bases) {
      if (b.format !== FORMAT) throw new Error(`已有快照格式是 ${b.format}，当前只认 ${FORMAT}`);
      for (const [id, row] of Object.entries(b.items)) {
        const [number, ...idx] = row;
        const traits = idx.map((i) => [b.traits[i][0], b.traits[i][1]]);
        const prev = m.get(id);
        if (prev && (prev.number !== number || JSON.stringify(prev.traits) !== JSON.stringify(traits))) {
          throw new Error(`铭文 ${id} 在两份快照里的编号或特征不一致`);
        }
        m.set(id, { number, traits });
      }
    }
    return m;
  }

  /** 组装快照数据（与插件运行时读取的格式一致）。 */
  function buildSnapshot({ collection, height, indexerHeight, generatedAt, active, traitsByAsset, numberStart, inscriptionByAsset, lastSales }) {
    const { collectionFloor, floors } = floorsOf(active, traitsByAsset);
    const keys = new Set();
    for (const traits of traitsByAsset.values()) for (const [t, v] of traits) keys.add(t + SEP + v);
    const sorted = [...keys].sort();
    const index = new Map(sorted.map((k, i) => [k, i]));
    const traits = sorted.map((k) => {
      const [type, value] = k.split(SEP);
      const f = floors.get(k);
      return f ? [type, value, f.floor, f.listed] : [type, value, null, 0];
    });
    const items = {};
    const assets = [...traitsByAsset.keys()].sort((a, b) => a - b);
    for (const assetId of assets) {
      const id = inscriptionByAsset.get(assetId);
      if (!id) throw new Error(`资产 ${assetId} 没有铭文 ID`);
      if (Object.prototype.hasOwnProperty.call(items, id)) throw new Error(`铭文 ${id} 同时对应多个资产`);
      items[id] = [numberStart + assetId, ...traitsByAsset.get(assetId).map(([t, v]) => index.get(t + SEP + v))];
    }
    return {
      format: FORMAT,
      collection,
      snapshot: { height, indexerHeight, generatedAt, blockTime: null, listings: active.length, collectionFloor },
      traits,
      items,
      offers: active.map(l => [inscriptionByAsset.get(l.assetId), priceSats(l)]).sort((a,b) => a[0].localeCompare(b[0])),
      ...(lastSales?{sales:[...lastSales].map(([key,s])=>[index.get(key),s.price,s.height]).sort((a,b)=>a[0]-b[0])}:{}),
    };
  }

  // ------------------------------------------------------------ 网络

  /**
   * 读 JSON。attempts：手动同步用默认 3 次（间隔 1.5s、3s）；实时轮询传 1，失败交给调用方的指数退避，不连着猛试。
   * 失败抛出的错误带 status（HTTP 状态码，网络错误时为 null）与 retryAfterSec（服务端 Retry-After 秒数，没有时为 null）。
   */
  async function fetchJson(url, attempts = FETCH_ATTEMPTS) {
    let lastErr;
    let status = null;
    let retryAfterSec = null;
    let tries = 0;
    while (tries < attempts) {
      tries += 1;
      try {
        const r = await fetch(url, { signal: AbortSignal.timeout(90000) });
        if (r.ok) return await r.json();
        status = r.status;
        const raw = r.headers.get('retry-after');
        const ra = raw !== null && /^\d+$/.test(raw) ? Number(raw) : Math.ceil((Date.parse(raw) - Date.now()) / 1000);
        retryAfterSec = Number.isFinite(ra) && ra > 0 ? ra : null;
        lastErr = new Error(`HTTP ${r.status}`);
        if (r.status < 500 || retryAfterSec !== null) break; // 4xx（除限流）重试也不会变，直接失败
      } catch (e) {
        lastErr = e;
        status = null;
      }
      if (tries < attempts) await new Promise((s) => setTimeout(s, 1500 * tries));
    }
    const err = new Error(`请求失败（试了 ${tries} 次）：${url}：${lastErr.message}`);
    err.isFetch = lastErr.name !== 'SyntaxError'; // 与数据校验抛出的错误区分开，便于给用户分类说明
    err.status = status;
    err.retryAfterSec = retryAfterSec;
    throw err;
  }

  async function mapLimit(items, limit, fn, onEach) {
    const out = new Array(items.length);
    let next = 0;
    let done = 0;
    const worker = async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
        done += 1;
        onEach(done);
      }
    };
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
    return out;
  }

  // ------------------------------------------------------------ 编排

  /**
   * 生成快照。
   * @param {{height:'tip'|number, bases:Array<object>, onProgress:function, generatedAt:function}} opts
   *   bases：已有快照（复用其中已知藏品的特征）；传空数组则所有藏品都拉官方元数据。
   *   onProgress({stage:'state'|'meta'|'build', done?, total?})
   * @returns {Promise<{snapshot:object, metaFetched:number}>}
   */
  async function generate({ height, bases, onProgress, generatedAt }) {
    onProgress({ stage: 'state' });
    const [col, state] = await Promise.all([fetchJson(`${API}/collection`), fetchJson(`${API}/state`)]);
    if (!col.global || !Number.isSafeInteger(col.global.start)) throw new Error('/collection 缺少 global.start，无法确定编号');
    if (!col.children || typeof col.children !== 'object') throw new Error('/collection 缺少 children（资产号 → 铭文 ID）');
    if (bases[0]?.collection && col.cid !== bases[0].collection.cid) throw new Error('Collection identity differs from bundled data');
    if (col.cid !== state.cid) throw new Error(`/collection 与 /state 的 cid 不一致：${col.cid} / ${state.cid}`);
    const indexerHeight = state.lastHeight;
    if (!Number.isSafeInteger(indexerHeight)) throw new Error(`/state 的 lastHeight 非法：${indexerHeight}`);
    const H = height === 'tip' ? indexerHeight : height;
    if (!Number.isSafeInteger(H) || H < 0) throw new Error(`快照高度非法：${height}`);
    if (H > indexerHeight) throw new Error(`区块 ${H} 还没被索引（索引器当前在 ${indexerHeight}），等区块确认后再同步`);

    const active = activeListingsAt(state.listings, state.notes, H);
    if (H === indexerHeight) {
      // 在索引器最新高度上，还原结果必须与服务端标记的 ACTIVE 集合完全一致，否则还原逻辑有误
      const want = new Set(state.listings.filter((l) => l.state === 'ACTIVE').map((l) => l.nf));
      const got = new Set(active.map((l) => l.nf));
      if (want.size !== got.size || [...want].some((nf) => !got.has(nf))) {
        throw new Error(`最新高度上还原出 ${got.size} 条有效挂单，服务端 ACTIVE 为 ${want.size} 条，两者不一致`);
      }
    }

    const inscriptionByAsset = new Map(Object.entries(col.children).map(([k, v]) => [Number(k), v]));
    const known = knownTraits(bases);
    const traitsByAsset = new Map();
    const missing = [];
    for (const [assetId, id] of inscriptionByAsset) {
      const number = col.global.start + assetId;
      const k = known.get(id);
      if (!k) { missing.push(assetId); continue; }
      if (k.number !== number) throw new Error(`铭文 ${id} 在已有快照里的编号是 ${k.number}，链上推算是 ${number}`);
      traitsByAsset.set(assetId, k.traits);
    }
    missing.sort((a, b) => a - b);
    onProgress({ stage: 'meta', done: 0, total: missing.length });
    const metas = await mapLimit(missing, META_CONCURRENCY, (a) => fetchJson(`${API}/meta/${a}?c=${col.cid}`),
      (done) => onProgress({ stage: 'meta', done, total: missing.length }));
    missing.forEach((a, i) => traitsByAsset.set(a, artTraits(metas[i], a, col.global.start + a)));

    onProgress({ stage: 'build' });
    const snapshot = buildSnapshot({
      collection: { slug: COLLECTION.slug, name: COLLECTION.name, cid: col.cid, rulesInscriptionId: col.rulesInscriptionId, numberStart: col.global.start },
      height: H,
      indexerHeight,
      generatedAt: generatedAt(),
      active,
      traitsByAsset,
      numberStart: col.global.start,
      inscriptionByAsset,
      lastSales:lastSalesAt(state.listings,state.notes,H,traitsByAsset),
    });
    snapshot.snapshot.blockTime = await readBlockTime(H);
    return { snapshot, metaFetched: missing.length };
  }

  // ------------------------------------------------------------ 实时（跟最新区块）

  const ID_RE = /^[0-9a-f]{64}i\d+$/;

  /**
   * 实时快照：当前有效挂单（/listings，约 13KB）+ 已知特征，不读几 MB 的完整事件日志。
   * 2026-10-08 实测 /listings 与事件日志在同一高度还原出的有效挂单逐条一致（214 条）。
   * 调用方先读一次 /pulse 发现出了新块（before），这里读完挂单后再读一次 /pulse：
   * 两次高度不同说明读取期间索引器又前进了，挂单集合对应哪个高度不确定，返回 null，下一轮再取。
   * 只计入确认高度 ≤ lastHeight 的挂单（规则按链上数据测量）。
   * @returns {Promise<null | {snapshot:object, metaFetched:number}>}
   */
  async function generateLive({ before, bases, generatedAt }) {
    if (!Number.isSafeInteger(before.lastHeight)) throw new Error(`/pulse 的 lastHeight 非法：${before.lastHeight}`);
    const listings = await fetchJson(`${API}/listings`, 1);
    const after = await fetchJson(`${API}/pulse`, 1);
    if (after.lastHeight !== before.lastHeight || after.epoch !== before.epoch) return null;
    if (!Array.isArray(listings)) throw new Error('/listings 返回的不是数组');
    const H = after.lastHeight;
    const base = bases[0];
    const numberStart = base.collection.numberStart;
    const known = knownTraits(bases);

    // 已知藏品：铭文 ID → 资产号（编号 − 起始号）
    const inscriptionByAsset = new Map();
    const traitsByAsset = new Map();
    for (const [id, k] of known) {
      inscriptionByAsset.set(k.number - numberStart, id);
      traitsByAsset.set(k.number - numberStart, k.traits);
    }

    const active = [];
    let unknownListed = false;
    for (const l of listings) {
      if (!Number.isSafeInteger(l.assetId) || l.assetId < 0) throw new Error(`挂单 ${l.nf} 的资产号非法：${l.assetId}`);
      if (typeof l.inscriptionId !== 'string' || !ID_RE.test(l.inscriptionId)) throw new Error(`挂单 ${l.nf} 的铭文 ID 非法`);
      if (!Number.isSafeInteger(l.listedAt) || l.listedAt < 0) throw new Error(`挂单 ${l.nf} 缺少确认高度 listedAt`);
      priceSats(l);
      const k = known.get(l.inscriptionId);
      if (k && k.number !== numberStart + l.assetId) throw new Error(`挂单 ${l.nf} 的资产号 ${l.assetId} 与已知编号 ${k.number} 不符`);
      if (!k) unknownListed = true;
      if (l.listedAt <= H) active.push(l);
    }

    // 有新铸造的藏品（挂单里出现未知铭文，或已铭刻数多于已知藏品数）时，才读 /collection（约 38KB）并补拉它们的元数据
    // /pulse 没给已铭刻数时无法判断有没有新藏品，按「可能有」处理去核对 /collection（多 38KB，但结果一定对）
    let metaFetched = 0;
    if (unknownListed || !Number.isSafeInteger(after.inscribed) || after.inscribed > known.size) {
      const col = await fetchJson(`${API}/collection`, 1);
      if (col.cid !== base.collection.cid) throw new Error(`/collection 的 cid ${col.cid} 与已有数据 ${base.collection.cid} 不一致`);
      if (!col.global || col.global.start !== numberStart) throw new Error('/collection 的 global.start 与已有数据不一致');
      const missing = [];
      for (const [k, id] of Object.entries(col.children)) {
        const assetId = Number(k);
        const prev = inscriptionByAsset.get(assetId);
        if (prev !== undefined && prev !== id) throw new Error(`资产 ${assetId} 的铭文 ID 与已有数据不一致`);
        if (prev === undefined) { inscriptionByAsset.set(assetId, id); missing.push(assetId); }
      }
      missing.sort((a, b) => a - b);
      const metas = await mapLimit(missing, META_CONCURRENCY, (a) => fetchJson(`${API}/meta/${a}?c=${col.cid}`), () => {});
      missing.forEach((a, i) => traitsByAsset.set(a, artTraits(metas[i], a, numberStart + a)));
      metaFetched = missing.length;
    }
    for (const l of active) {
      if (inscriptionByAsset.get(l.assetId) !== l.inscriptionId) throw new Error('Listing inscription differs from collection mapping');
      if (!traitsByAsset.has(l.assetId)) throw new Error(`挂单 ${l.nf} 的资产 ${l.assetId} 不在 /collection 里`);
    }

    // Zero-listing rare traits require sale history; a failed optional read leaves explicit uncertainty.
    let lastSales;
    try {
      const state=await fetchJson(`${API}/state`,1);
      if(state.cid===base.collection.cid && Number.isSafeInteger(state.lastHeight) && state.lastHeight>=H)
        lastSales=lastSalesAt(state.listings,state.notes,H,traitsByAsset);
    } catch { /* Keep valid floors; no inherited stale sale prices. */ }
    const snapshot = buildSnapshot({
      collection: base.collection, height: H, indexerHeight: H, generatedAt: generatedAt(),
      active, traitsByAsset, numberStart, inscriptionByAsset,
      lastSales,
    });
    snapshot.snapshot.blockTime = await readBlockTime(H);
    return { snapshot, metaFetched };
  }

  // Optional display metadata, never a dependency of weight calculation.
  // /blocks/:height is height-bound; service time and generatedAt are not block time.
  const BLOCK_API = 'https://blockstream.info/api';
  async function readBlockTime(height) {
    if (!Number.isSafeInteger(height) || height < 0) return null;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(`${BLOCK_API}/blocks/${height}`, {signal:controller.signal, credentials:'omit', cache:'no-store'});
      if (!response.ok) return null;
      const rows = await response.json();
      const b = Array.isArray(rows) ? rows[0] : null;
      if (!b || b.height !== height || !/^[0-9a-f]{64}$/.test(b.id) || !Number.isSafeInteger(b.timestamp) || b.timestamp < 1231006505 || b.timestamp > 0xffffffff) return null;
      return {height, hash:b.id, timestamp:b.timestamp};
    } catch { return null; } finally { clearTimeout(timer); }
  }

  return {
    readBlockTime, BLOCK_API, FORMAT, API, COLLECTION, NUMBER_TRAIT_TYPE,
    txHeights, closeHeight, activeListingsAt, lastSalesAt, floorsOf, artTraits, knownTraits, buildSnapshot, fetchJson, mapLimit, generate, generateLive,
  };
});
