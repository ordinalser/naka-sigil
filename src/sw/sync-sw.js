/**
 * Background worker. Live sync writes chrome.storage.local and every page redraws from storage changes.
 *
 * Live: while an Ord Dropz page, the extension page or the popup is visible, read /pulse at most once a minute; only on a
 * new block read /listings, the listing records (/state past its end) and the official weights, then rebuild the snapshot
 * (liveSnapshot). The same block is never downloaded twice: within a block only /listings is re-read (a few KB), for the
 * purchases and reclaims sent since (liveClosing), and a missing block time (another host).
 * A failed check records why (shown in the popup), keeps the data it has, and backs off 1/2/4/8/16/30 minutes or as the
 * server's Retry-After says.
 *
 * Also here: this week's and finished weeks' official accumulators, My holdings bookkeeping (anchors, public records,
 * pieces that left), the wallet eligibility import, one-off historical inspections and the popup's chain clock.
 * Storage keys: lib/source.js KEYS, lib/portfolio.js (META, LEFT, EVENTS), lib/rewards.js (KEY, STATUS, OBSERVED, WEEKS).
 */
'use strict';
importScripts('../lib/rules.js', '../lib/snapshot-core.js', '../lib/source.js', '../data/snapshot.js', '../lib/purchase.js', '../lib/explore.js', '../lib/portfolio.js', '../lib/rewards.js');

const CORE = self.ShnakasSnapshot;
const SRC = self.ShnakasSource;
const BUNDLED = self.SHNAKAS_SNAPSHOT;
const K = SRC.KEYS;
const ALARM = 'shn-live';
// Keys of the removed fixed-block mode (its on/off setting included) and its one-off sync; the upgrade step drops them.
const RETIRED = ['snapshot', 'syncStatus', 'liveEnabled'];
let liveBusy = false;

const usable = (s) => SRC.compatibleSnapshot(s, BUNDLED);

// The code version that last ran the upgrade step below.
const BUILT = 'nakaBuild';
// The upgrade step drops only what this version no longer has or cannot read: the retired keys, the last check's status (a
// compatible upgrade retries old schema failures at once) and a live snapshot it cannot read (public data, downloaded again
// by the next check). Holdings with their records and pieces that left, comparisons, added numbers, language and official
// readings belong to the user and survive schema changes, missing catalog rows and failed refetches. It runs once per code
// version, before this worker's first live check, rather than on onInstalled: in Chromium 152, after the files were
// replaced and Chrome restarted, the previous worker kept running, and the reload that then started this one sent no
// install event (validation, v0.12.5). A failed step is recorded like a failed check, and the next check tries it again.
let upgrading = null;
const upgraded = () => (upgrading ??= upgrade().catch((e) => { upgrading = null; throw e; }));
async function upgrade() {
  // A retired key means an older version ran since the last step (a downgrade and back): the step runs again.
  const got = await chrome.storage.local.get([BUILT, ...RETIRED]);
  if (got[BUILT] === SRC.BUILD && RETIRED.every((k) => got[k] === undefined)) return;
  await chrome.storage.local.remove([...RETIRED, K.liveStatus]);
  const live = await chrome.storage.local.get(K.live);
  if (live[K.live] !== undefined && !usable(live[K.live])) await chrome.storage.local.remove(K.live);
  await chrome.storage.local.set({ [BUILT]: SRC.BUILD });
}
chrome.runtime.onInstalled.addListener(ensureAlarm);
chrome.runtime.onStartup.addListener(ensureAlarm);
ensureAlarm();

// Sections of the extension page a link may open: My holdings (or its pieces that left), Raise weight (one of its tabs, or
// its simulator / 400% plan for one number), Compare or the listings.
const sectionOk = (s) => typeof s === 'string' && (['holdings', 'left', 'planner', 'compare', 'listings'].includes(s) || /^(sim|plan)-\d{1,5}$/.test(s) || /^planner-(buy|plan|lock|sim)$/.test(s));
// A page that found the previous worker still running asked for the reload that started this one: it opens again, now on
// this version, so the reload ends where it began; after the upgrade step, whether that succeeded or not (a failure shows
// on the page as a failed check). The request is read once and only counts within SRC.REOPEN_MS.
upgraded().then(reopen, reopen);
async function reopen() {
  const { [SRC.REOPEN]: want } = await chrome.storage.local.get(SRC.REOPEN);
  if (want === undefined) return;
  await chrome.storage.local.remove(SRC.REOPEN);
  if (!want || typeof want !== 'object' || !Number.isSafeInteger(want.at) || Date.now() - want.at > SRC.REOPEN_MS) return;
  if (want.page === 'workspace') await chrome.tabs.create({ url: chrome.runtime.getURL('workspace/index.html') + (sectionOk(want.section) ? '#' + want.section : '') });
  // Chrome lets an extension open its own popup from version 127, and only with a browser window in front; when it refuses,
  // the extension is current all the same and the popup shows it on the next click.
  else if (want.page === 'popup' && typeof chrome.action.openPopup === 'function') await chrome.action.openPopup().catch(() => {});
}

async function ensureAlarm() {
  if (!(await chrome.alarms.get(ALARM))) await chrome.alarms.create(ALARM, { periodInMinutes: 1 });
}

// ------------------------------------------------------------ Live

/** One live check. Whether it reads the network is SRC.shouldCheck's call (a visible page, once a minute, backoff). */
async function liveTick() {
  if (liveBusy) return;
  liveBusy = true; // Claimed before the first await: alarm and heartbeat can arrive together.
  const keepAlive = setInterval(() => chrome.runtime.getPlatformInfo(), 20000); // Keep longer batches alive.
  try {
    try { await upgraded(); }
    catch (e) { await failed(SRC.statusOf((await chrome.storage.local.get(K.liveStatus))[K.liveStatus], 'live'), Date.now(), e); return; }
    const got = await chrome.storage.local.get([K.liveStatus, K.live]);
    const { [SRC.SESSION_VISIBLE]: visibleAt } = await chrome.storage.session.get(SRC.SESSION_VISIBLE);
    const prev = SRC.statusOf(got[K.liveStatus], 'live');
    const now = Date.now();
    const go = SRC.shouldCheck({
      now, visibleAt,
      lastCheckAt: prev === undefined ? undefined : prev.checkedAt,
      nextAt: prev === undefined || prev.state !== 'error' ? undefined : prev.nextAt,
    });
    if (!go) return;
    const current = usable(got[K.live]) ? got[K.live] : undefined;
    try {
      // Holdings added at or before this instant are anchored to the height this /pulse returns (anchorTick).
      const askedAt = Date.now();
      const pulse = await CORE.fetchJson(`${CORE.API}/pulse`, 1);
      if (prev?.epoch !== undefined && prev.epoch !== pulse.epoch) historyCache.clear();
      if (!Number.isSafeInteger(pulse.lastHeight)) throw new Error(`/pulse 的 lastHeight 非法：${pulse.lastHeight}`);
      // A snapshot whose listing records failed to load (or was written by an older version) is incomplete: rare-trait
      // branches would stay ranges and this week's sales / reclaims would be unknown, so that block is rebuilt.
      if (current !== undefined && current.snapshot.height === pulse.lastHeight && current.saleHistory !== undefined && current.rewardEvents !== undefined && current.listedAt !== undefined && prev?.epoch === pulse.epoch && pulse.epoch !== undefined) {
        // No new block: the data stays. Block time is display metadata from another host; only it is re-read.
        if (current.snapshot.blockTime == null) {
          const blockTime = await CORE.readBlockTime(current.snapshot.height);
          if (blockTime !== null) await chrome.storage.local.set({ [K.live]: { ...current, snapshot: { ...current.snapshot, blockTime } } });
        }
        await closingTick(current, pulse);
        await anchorTick(current, askedAt); await rewardTick(current, pulse.epoch); await weeksTick(current);
        await chrome.storage.local.set({ [K.liveStatus]: { state: 'ok', checkedAt: Date.now(), epoch: pulse.epoch } });
        return;
      }
      const res = await CORE.generateLive({
        before: pulse,
        bases: [BUNDLED, current].filter(usable),
        generatedAt: () => new Date().toISOString(),
      });
      if (res === null) {
        // The indexer moved during the read; keep the previous epoch: this batch was not accepted.
        await chrome.storage.local.set({ [K.liveStatus]: { state: 'ok', checkedAt: now, epoch: prev?.epoch } });
        return;
      }
      if (!usable(res.snapshot)) throw new Error('Invalid generated live snapshot');
      await chrome.storage.local.set({
        [K.live]: res.snapshot,
        [K.liveStatus]: { state: 'ok', checkedAt: Date.now(), epoch: pulse.epoch },
        // The new block's own read: purchases and reclaims already on their way when it was taken.
        [K.closing]: { height: res.snapshot.snapshot.height, rows: res.snapshot.closing ?? [] },
      });
      await anchorTick(res.snapshot, askedAt); await holdingsTick(res.snapshot, res.records);
      await rewardTick(res.snapshot, pulse.epoch); await weeksTick(res.snapshot);
    } catch (e) {
      await failed(prev, now, e);
    }
  } finally {
    clearInterval(keepAlive);
    liveBusy = false;
  }
}

/** A failed check (or upgrade step): record why and back off; the data in storage stays and pages keep working with it. */
async function failed(prev, now, e) {
  const failures = prev?.state === 'error' && Number.isSafeInteger(prev.failures) && prev.failures > 0 ? Math.min(prev.failures + 1, 1000) : 1;
  const retryAfterSec = e.isFetch === true ? e.retryAfterSec : null;
  const wait = SRC.backoffMinutes(failures, retryAfterSec);
  await chrome.storage.local.set({
    [K.liveStatus]: {
      state: 'error', kind: SRC.classify(e), status: e.isFetch === true ? e.status : null, message: e.message,
      failures, waitMin: wait, nextAt: now + wait * 60000, checkedAt: now,
    },
  });
}

/**
 * Between blocks: purchases (confirming in the next block) and reclaims are sent at any time, and /listings marks them.
 * Re-read it for the stored block and keep that block's closing set apart from the snapshot, written only when it
 * changes. A read whose /pulse around it shows another block or epoch, or whose active listings differ, is left to the
 * next block's rebuild.
 */
async function closingTick(snap, pulse) {
  const listings = await CORE.fetchJson(`${CORE.API}/listings`, 1);
  const after = await CORE.fetchJson(`${CORE.API}/pulse`, 1);
  if (after.lastHeight !== snap.snapshot.height || after.epoch !== pulse.epoch) return;
  const rows = CORE.closingRows(listings, snap);
  if (rows === null) return;
  const next = { height: snap.snapshot.height, rows }, got = await chrome.storage.local.get(K.closing);
  if (JSON.stringify(got[K.closing]) !== JSON.stringify(next)) await chrome.storage.local.set({ [K.closing]: next });
}

chrome.alarms.onAlarm.addListener((a) => {
  if (a.name === ALARM) liveTick();
});

// ------------------------------------------------------------ Reward weeks

// Serializes every read-modify-write of shared storage across tabs and ticks. A job that fails rejects only its own
// promise, which its caller reports; the queue goes on with the next job.
let queue = Promise.resolve();
const serial = (job) => { const run = queue.then(job); queue = run.catch(() => {}); return run; };
let rewardClockPromise = null, rewardClockCache = null;
async function rewardClock() {
  if (rewardClockCache && Date.now() - rewardClockCache.checkedAt < 60000) return rewardClockCache;
  if (rewardClockPromise) return rewardClockPromise;
  rewardClockPromise = (async () => { const pulse = await CORE.fetchJson(`${CORE.API}/pulse`, 1); if (!Number.isSafeInteger(pulse.lastHeight) || pulse.lastHeight < 0) throw new Error('Invalid clock height'); const height = pulse.lastHeight, blockTime = await CORE.readBlockTime(height); return rewardClockCache = { height, blockTime, checkedAt: Date.now() }; })().finally(() => { rewardClockPromise = null; });
  return rewardClockPromise;
}

// Historical inspection is ephemeral: it never changes Live data, holdings or market state.
const historyCache = new Map(); let historyRunning = false, rewardBusy = false;
async function inspectHistory(height) {
  if (historyCache.has(height)) return historyCache.get(height); if (historyRunning) throw Error('busy'); historyRunning = true; const keepAlive = setInterval(() => chrome.runtime.getPlatformInfo(), 20000);
  try { const got = await chrome.storage.local.get(K.live); const { snapshot } = await CORE.generate({ height, bases: [BUNDLED, got[K.live]].filter(usable), generatedAt: () => new Date().toISOString(), onProgress: p => chrome.storage.session.set({ nakaHistoryProgress: { state: 'running', ...p } }) }); if (!usable(snapshot) || snapshot.snapshot.height !== height) throw Error('Invalid historical result'); historyCache.set(height, snapshot); while (historyCache.size > 2) historyCache.delete(historyCache.keys().next().value); return snapshot; } finally { clearInterval(keepAlive); historyRunning = false; }
}
/** This week's accumulator at the live block: read once per block and epoch. */
async function rewardTick(snap, epoch) {
  const A = self.NakaRewards, phase = self.ShnakasRules.rewardPhase(snap.snapshot); if (rewardBusy || phase.state !== 'active') return; rewardBusy = true;
  try {
    const got = await chrome.storage.local.get([A.KEY, A.STATUS]); if (got[A.KEY]?.height === snap.snapshot.height && got[A.KEY].epoch === epoch && A.table(got[A.KEY])) return;
    if (got[A.STATUS]?.state !== 'loading' || got[A.STATUS].height !== snap.snapshot.height) await chrome.storage.local.set({ [A.STATUS]: { state: 'loading', height: snap.snapshot.height } });
    const raw = await CORE.fetchJson(`${CORE.API}/rewards/weights/${phase.index}`, 1), week = { ...A.normalize(raw), epoch }; if (week.height !== snap.snapshot.height) throw Error('Reward block advanced; waiting for the next sync');
    await chrome.storage.local.set({ [A.KEY]: week, [A.STATUS]: { state: 'done', height: week.height } });
  } catch (e) { await chrome.storage.local.set({ [A.STATUS]: { state: 'error', height: snap.snapshot.height, at: Date.now() } }); } finally { rewardBusy = false; }
}
/**
 * Completed reward weeks are final: read each one's accumulator once and keep it, so past totals and the weeks a piece that
 * left still owns come from official tables. Two reads per check at most, taken in turn after the last week tried, so a
 * week that is not served complete (or fails) is retried later without holding back the others. Stored rows are checked
 * one by one; an invalid row is dropped and read again. Once every finished week is stored, checks skip storage.
 */
let weeksCursor = -1, weeksDone = -1;
async function weeksTick(snap) {
  const A = self.NakaRewards, R = self.ShnakasRules, phase = R.rewardPhase(snap.snapshot);
  const last = phase.state === 'active' ? phase.index - 1 : ['ended', 'closed'].includes(phase.state) ? R.RULES.weeks - 1 : -1; if (last < 0 || last <= weeksDone) return;
  const got = await chrome.storage.local.get(A.WEEKS), raw = got[A.WEEKS]?.format === 1 && got[A.WEEKS].weeks && typeof got[A.WEEKS].weeks === 'object' && !Array.isArray(got[A.WEEKS].weeks) ? got[A.WEEKS].weeks : {};
  const weeks = A.weeks({ format: 1, weeks: raw }); let changed = Object.keys(weeks).length !== Object.keys(raw).length;
  const missing = []; for (let w = 0; w <= last; w++) if (!weeks[w]) missing.push(w);
  for (const w of [...missing.filter(w => w > weeksCursor), ...missing.filter(w => w <= weeksCursor)].slice(0, 2)) {
    weeksCursor = w;
    try { const row = A.normalize(await CORE.fetchJson(`${CORE.API}/rewards/weights/${w}`, 1)); if (row.week === w && row.complete) { weeks[w] = row; changed = true; } }
    catch (e) { /* retried in a later check; pages show this week as reading */ }
  }
  if (changed) await chrome.storage.local.set({ [A.WEEKS]: { format: 1, weeks } });
  let done = -1; while (weeks[done + 1]) done++; weeksDone = Math.min(done, last);
}

// ------------------------------------------------------------ My holdings: anchors, public records, pieces that left
// See lib/portfolio.js for META / LEFT / EVENTS. Every writer of My holdings (shn-holdings, shn-left, the eligibility
// import, holdingsTick) writes META in the same storage.set, through the queue. The newest listing records also stay in
// session storage, so a holding added between blocks gets its records without a new download, even after a restart.
const RECORDS = 'nakaRecords';
/** Anchor holdings added at or before askedAt to the height /pulse returned after it (every listing at or below it
 * already existed when the piece was added), with the listing open then; holdings saved before anchors existed too. */
function anchorTick(snap, askedAt) {
  return serial(async () => {
    const H = self.NakaPortfolio, got = await chrome.storage.local.get([H.KEY, H.META]), ids = H.normalize(got[H.KEY]), meta = { ...(got[H.META] ?? {}) }, listedAt = new Map(snap.listedAt ?? []);
    let changed = false;
    for (const id of ids) {
      if (!Object.hasOwn(snap.items, id)) continue;
      const a = H.anchorOf(meta[id]); if (a.state === 'anchored') continue;
      if (a.state === 'pending' && !(meta[id].added <= askedAt)) continue;
      meta[id] = { anchor: snap.snapshot.height, listedAt: listedAt.get(id) ?? null, ...(meta[id]?.seller === true ? { seller: true } : {}), ...(a.state === 'legacy-unanchored' ? { legacy: true } : {}) };
      changed = true;
    }
    // The anchor of a piece no longer in the stored list goes; a list this version cannot read removes none.
    if (Array.isArray(got[H.KEY])) for (const id of Object.keys(meta)) if (!got[H.KEY].includes(id)) { delete meta[id]; changed = true; }
    if (changed) await chrome.storage.local.set({ [H.META]: meta });
  }).catch(() => {});
}
/** Records of my holdings and left pieces; a holding whose run ended in a sale (my sale) moves to Left with the weeks it
 * kept. Old Left entries get their weeks from the records. Writes only what changed. */
function holdingsTick(snap, records) {
  return serial(async () => {
    let batch = records ? { height: snap.snapshot.height, records } : null;
    if (records) await chrome.storage.session.set({ [RECORDS]: batch });
    else { batch = (await chrome.storage.session.get(RECORDS))[RECORDS] ?? null; if (batch?.height !== snap.snapshot.height) return; }
    const H = self.NakaPortfolio, got = await chrome.storage.local.get([H.KEY, H.META, H.LEFT, H.EVENTS]), ids = H.normalize(got[H.KEY]);
    const meta = { ...(got[H.META] ?? {}) }, left = H.leftOf(got[H.LEFT]), write = {};
    const want = new Map([...ids, ...Object.keys(left)].filter(id => Object.hasOwn(snap.items, id)).map(id => [snap.items[id][0] - snap.collection.numberStart, id]));
    const rows = Object.fromEntries([...want.values()].map(id => [id, []])); for (const r of batch.records) { const id = want.get(r[0]); if (id) rows[id].push(r); }
    const sold = [];
    for (const id of ids) {
      if (!Object.hasOwn(rows, id) || H.anchorOf(meta[id]).state !== 'anchored') continue;
      const own = H.attribution(snap, id, rows[id], meta[id]); if (own.state !== 'sold') continue;
      const run = { listedAt: own.sale.listedAt, soldAt: own.sale.soldAt, weeks: H.runWeeks(own.notes, own.gaps), source: 'sale' };
      left[id] = { number: snap.items[id][0], runs: [...(left[id]?.runs ?? []).filter(r => r.listedAt !== run.listedAt), run] }; delete meta[id]; sold.push(id);
    }
    // Entries saved before runs existed carry no weeks: read them from the records of their sale.
    for (const [id, e] of Object.entries(left)) e.runs = e.runs.map(r => r.weeks !== null || r.listedAt === null || !Object.hasOwn(rows, id) ? r : (() => { try { return H.saleRun(snap, id, rows[id], r.listedAt, [], r.source); } catch { return r; } })());
    const events = { height: snap.snapshot.height, rows };
    if (JSON.stringify(got[H.EVENTS]) !== JSON.stringify(events)) write[H.EVENTS] = events;
    const saved = H.leftSave(got[H.LEFT], left);
    if (JSON.stringify(got[H.LEFT]) !== JSON.stringify(saved) && (sold.length || Object.keys(saved).length)) write[H.LEFT] = saved;
    if (sold.length) { write[H.KEY] = ids.filter(id => !sold.includes(id)); write[H.META] = meta; }
    if (Object.keys(write).length) await chrome.storage.local.set(write);
  }).catch(() => {});
}

// ------------------------------------------------------------ Messages

const ownPage = (sender, path) => sender.url === chrome.runtime.getURL(path);
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || !msg) return false;
  if (msg.type === 'shn-import-eligibility') {
    if (!sender.url?.startsWith('https://ord-dropz.xyz/wallet') || !Array.isArray(msg.rows) || msg.rows.length > 3333 || !Number.isInteger(msg.week) || msg.week < 0 || msg.week >= 78 || !Number.isSafeInteger(msg.height) || msg.height <= self.ShnakasRules.RULES.startBlock + msg.week * 1008 || msg.height > self.ShnakasRules.RULES.startBlock + (msg.week + 1) * 1008) { sendResponse({ ok: false, error: 'bad-reading' }); return false; }
    serial(async () => {
      const A = self.NakaRewards, H = self.NakaPortfolio, R = self.ShnakasRules;
      const got = await chrome.storage.local.get([A.OBSERVED, K.live, H.KEY, H.LEFT, H.EVENTS, H.META]); const snap = got[K.live];
      if (!usable(snap)) { sendResponse({ ok: false, error: 'no-live' }); return; }
      if (msg.height > snap.snapshot.height) { sendResponse({ ok: false, error: 'ahead' }); return; }
      const rows = { ...(got[A.OBSERVED]?.rows ?? {}) }, selected = new Map(), rank = ['earning', 'claimable', 'waiting', 'paused', 'before', 'past'];
      for (const row of msg.rows) { if (!row || typeof row.id !== 'string' || !Object.hasOwn(snap.items, row.id) || !rank.includes(row.state)) continue; if (!selected.has(row.id) || rank.indexOf(row.state) < rank.indexOf(selected.get(row.id).state)) selected.set(row.id, row); }
      for (const row of selected.values()) if (!rows[row.id] || rows[row.id].height <= msg.height) rows[row.id] = { state: row.state, week: msg.week, height: msg.height };
      const hold = H.normalize(got[H.KEY]), left = H.leftOf(got[H.LEFT]), meta = { ...(got[H.META] ?? {}) }, events = got[H.EVENTS]?.rows ?? {}, gone = [];
      for (const row of selected.values()) {
        if (!hold.includes(row.id)) continue;
        // Waiting this week with no public exit: a private move this week (received, sent to self, relay credits added);
        // that week earns nothing for the piece.
        if (row.state === 'waiting' && self.NakaRewards.reason(snap, row.id).kind === 'held' && H.anchorOf(meta[row.id]).state === 'anchored') meta[row.id] = { ...meta[row.id], gaps: H.weekList([...(meta[row.id].gaps ?? []), msg.week]) };
        // Left the vault ("Held weeks a–b before it left"): when no public sale of mine explains it, it was sent away
        // privately after week `through`; it moves to Left with the weeks of my run up to then.
        if (row.state === 'past' && Number.isInteger(row.through) && row.through >= 0 && row.through < msg.week) {
          const run = H.privateRun(snap, row.id, events[row.id], meta[row.id], row.through);
          if (run) { left[row.id] = { number: snap.items[row.id][0], runs: [...(left[row.id]?.runs ?? []), run] }; delete meta[row.id]; gone.push(row.id); }
        }
      }
      await chrome.storage.local.set({ [A.OBSERVED]: { rows }, [H.META]: meta, ...(gone.length ? { [H.LEFT]: H.leftSave(got[H.LEFT], left), [H.KEY]: hold.filter(id => !gone.includes(id)) } : {}) });
      sendResponse({ ok: true, moved: gone.length });
    }).catch(() => sendResponse({ ok: false, error: 'failed' })); return true;
  }
  if (msg.type === 'shn-left') {
    // The owner settles a sale the extension cannot attribute ('sold' / 'bought'), puts a left run back ('restore') or
    // forgets it ('remove').
    if (!['sold', 'bought', 'restore', 'remove'].includes(msg.action) || typeof msg.id !== 'string' || (['sold', 'bought'].includes(msg.action) ? !Number.isSafeInteger(msg.listedAt) : !(msg.listedAt === null || Number.isSafeInteger(msg.listedAt)))) { sendResponse({ ok: false }); return false; }
    serial(async () => {
      const H = self.NakaPortfolio, got = await chrome.storage.local.get([H.KEY, H.LEFT, H.EVENTS, H.META, K.live]);
      const { snap } = SRC.choose({ live: got[K.live] }, BUNDLED), ids = H.normalize(got[H.KEY]), left = H.leftOf(got[H.LEFT]), meta = { ...(got[H.META] ?? {}) }, rows = got[H.EVENTS]?.rows?.[msg.id];
      if (!Object.hasOwn(snap.items, msg.id)) { sendResponse({ ok: false }); return; }
      if (msg.action === 'sold' || msg.action === 'bought') {
        const sale = Array.isArray(rows) ? rows.find(r => Array.isArray(r) && r[1] === msg.listedAt && r[3] === 'sale') : null;
        if (!ids.includes(msg.id) || !sale) { sendResponse({ ok: false, error: 'no-sale' }); return; }
        const gaps = H.anchorOf(meta[msg.id]).gaps ?? [];
        if (msg.action === 'sold') {
          left[msg.id] = { number: snap.items[msg.id][0], runs: [...(left[msg.id]?.runs ?? []).filter(r => r.listedAt !== msg.listedAt), H.saleRun(snap, msg.id, rows, msg.listedAt, gaps, 'manual')] }; delete meta[msg.id];
          await chrome.storage.local.set({ [H.LEFT]: H.leftSave(got[H.LEFT], left), [H.KEY]: ids.filter(id => id !== msg.id), [H.META]: meta });
        } else {
          // Bought: the piece was mine at the purchase block, unlisted.
          meta[msg.id] = { anchor: sale[2], listedAt: null, ...(gaps.length ? { gaps } : {}) };
          await chrome.storage.local.set({ [H.META]: meta });
        }
      } else {
        const runs = left[msg.id]?.runs ?? [], keep = runs.filter(r => r.listedAt !== msg.listedAt);
        if (keep.length === runs.length) { sendResponse({ ok: false }); return; }
        if (keep.length) left[msg.id] = { ...left[msg.id], runs: keep }; else delete left[msg.id];
        if (msg.action === 'restore' && !ids.includes(msg.id)) {
          // Back in My holdings now: anchored like a new holding to the next /pulse height, so every sale up to now
          // (that one included) is a purchase, not my sale.
          meta[msg.id] = { added: Date.now() };
          await chrome.storage.local.set({ [H.LEFT]: H.leftSave(got[H.LEFT], left), [H.KEY]: [...ids, msg.id], [H.META]: meta });
        } else await chrome.storage.local.set({ [H.LEFT]: H.leftSave(got[H.LEFT], left) });
      }
      sendResponse({ ok: true });
    }).catch(() => sendResponse({ ok: false })); return true;
  }
  if (msg.type === 'shn-history') {
    if (!ownPage(sender, 'popup/popup.html') || !Number.isSafeInteger(msg.height) || msg.height < 0) { sendResponse({ ok: false }); return false; }
    inspectHistory(msg.height).then(snapshot => sendResponse({ ok: true, snapshot }), e => sendResponse({ ok: false, error: e.message === 'busy' ? 'busy' : SRC.classify(e), message: e.message })); return true;
  }
  if (msg.type === 'shn-reward-clock') {
    if (!ownPage(sender, 'popup/popup.html')) return false;
    rewardClock().then(clock => sendResponse({ ok: true, ...clock }), () => sendResponse({ ok: false })); return true;
  }
  if (msg.type === 'shn-open-compare') {
    // Optional section of the workspace to open (sectionOk).
    if (msg.section !== undefined && !sectionOk(msg.section)) { sendResponse({ ok: false, error: 'bad-section' }); return false; }
    chrome.tabs.create({ url: chrome.runtime.getURL('workspace/index.html') + (msg.section === undefined ? '' : '#' + msg.section) }).then(() => sendResponse({ ok: true }), () => sendResponse({ ok: false }));
    return true;
  }
  if (msg.type === 'shn-holdings') {
    // The only writer of additions and removals (content script, popup and workspace all send this): META in the same set.
    // vault: added from my own vault or wallet page, where an open listing is mine.
    serial(async () => {
      const H = self.NakaPortfolio, got = await chrome.storage.local.get([H.KEY, H.META, K.live]), { snap } = SRC.choose({ live: got[K.live] }, BUNDLED);
      const before = H.normalize(got[H.KEY]), ids = H.update(got[H.KEY], msg.ids, snap, msg.remove === true), meta = { ...(got[H.META] ?? {}) }, now = Date.now();
      for (const id of ids) if (!before.includes(id)) meta[id] = { added: now, ...(msg.vault === true && sender.url?.startsWith('https://ord-dropz.xyz/') ? { seller: true } : {}) };
      for (const id of before) if (!ids.includes(id)) delete meta[id];
      await chrome.storage.local.set({ [H.KEY]: ids, [H.META]: meta }); sendResponse({ ok: true, ids, count: ids.length });
      // New holdings get their public records at once from the newest batch; attribution waits for their anchor.
      if (usable(got[K.live])) holdingsTick(got[K.live], null);
    }).catch(() => sendResponse({ ok: false })); return true;
  }
  if (msg.type === 'shn-compare') {
    if (!['clear', 'toggle'].includes(msg.action)) { sendResponse({ ok: false }); return false; }
    serial(async () => {
      const E = self.NakaExplore;
      const got = await chrome.storage.local.get([E.KEY, K.live]);
      const { snap } = SRC.choose({ live: got[K.live] }, BUNDLED);
      const out = msg.action === 'clear' ? { ids: [], state: 'removed' } : E.toggle(got[E.KEY], msg.id, snap);
      await chrome.storage.local.set({ [E.KEY]: out.ids });
      sendResponse({ ok: true, ...out });
    }).catch(() => sendResponse({ ok: false }));
    return true;
  }
  if (msg.type === 'shn-build') {
    // Which code this worker runs: a page compares it with its own (SRC.BUILD) and asks for a reload when it differs.
    sendResponse({ ok: true, build: SRC.BUILD });
    return false;
  }
  if (msg.type === 'shn-visible') {
    // Heartbeat from a visible page: remember the time and check now (a page opening does not wait for the alarm).
    // Answer at once, or the page's sendMessage fails with "message port closed before a response was received".
    sendResponse({ ok: true });
    chrome.storage.session.set({ [SRC.SESSION_VISIBLE]: Date.now() }).then(liveTick);
    return false;
  }
  return false;
});
