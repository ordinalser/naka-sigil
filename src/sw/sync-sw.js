/**
 * 后台：两种同步，结果写进 chrome.storage.local，内容脚本监听存储变化原地刷新页面。
 *
 * 1. 手动同步（弹窗按钮，可填区块高度）：从完整事件日志还原指定高度的挂单 → snapshot
 * 2. 实时同步（默认模式）：市场、比较页或插件弹窗可见时，每分钟读一次 /pulse（164 字节）；
 *    出了新块才读 /listings（约 13KB）重算地板价 → liveSnapshot。和站点自己的前端同一思路，频率只有它的几分之一。
 *
 * 健壮性：任何一次同步失败都只记录原因（弹窗里显示），已有数据原封不动，页面继续按旧数据工作；
 * 实时同步失败后按 1/2/4/8/16/30 分钟退避，服务端给了 Retry-After 时照办。
 *
 * 存储键：见 lib/source.js 的 KEYS；另有 syncStatus（手动同步状态）、lang（界面语言）。
 */
'use strict';
importScripts('../lib/snapshot-core.js', '../lib/source.js', '../data/snapshot.js', '../lib/explore.js');

const CORE = self.ShnakasSnapshot;
const SRC = self.ShnakasSource;
const BUNDLED = self.SHNAKAS_SNAPSHOT;
const K = SRC.KEYS;
const ALARM = 'shn-live';
let running = false;   // 手动同步进行中
let liveFinished=Promise.resolve(),finishLive=()=>{};
let liveBusy = false;  // 实时检查进行中

const usable = (s) => SRC.compatibleSnapshot(s, BUNDLED);

// 新起的后台实例里不可能有手动同步在跑；存储里还标着 running，说明上一个实例在同步途中被浏览器回收了
const startupReady = chrome.storage.local.get('syncStatus').then(({ syncStatus }) => {
  if (syncStatus && syncStatus.state === 'running' && !running) {
    chrome.storage.local.set({ syncStatus: { state: 'interrupted', at: Date.now() } });
  }
});

// 升级后本地数据的格式若与当前版本不符，它是不兼容旧版本写的，清掉，让页面回到内置快照直到重新同步
chrome.runtime.onInstalled.addListener(async () => {
  const got = await chrome.storage.local.get([K.manual, K.live]);
  const stale = [K.manual, K.live].filter((k) => got[k] !== undefined && !usable(got[k]));
  if (stale.length) await chrome.storage.local.remove(stale);
  await ensureAlarm();
});
chrome.runtime.onStartup.addListener(ensureAlarm);
ensureAlarm();

// ------------------------------------------------------------ 手动同步

function setStatus(status) {
  return chrome.storage.local.set({ syncStatus: { ...status, at: Date.now() } });
}

async function sync(height,activate=false) {
  running = true;
  // 后台空闲 30 秒会被回收；同步期间每 20 秒调一次扩展 API 重置空闲计时（拉 /state 是几 MB 的单个请求）
  const keepAlive = setInterval(() => chrome.runtime.getPlatformInfo(), 20000);
  try {
    await startupReady;
    await setStatus({ state: 'running', stage: 'state' });
    await liveFinished; // A fixed-height request queues behind the preceding live check.
    const got = await chrome.storage.local.get([K.manual, K.live]);
    const { snapshot } = await CORE.generate({
      height: height === null ? 'tip' : height,
      bases: [BUNDLED, got[K.manual], got[K.live]].filter(usable),
      generatedAt: () => new Date().toISOString(),
      onProgress: (p) => {
        // 元数据进度每 10 件写一次，避免频繁写存储
        if (p.stage !== 'meta' || p.done === 0 || p.done === p.total || p.done % 10 === 0) setStatus({ state: 'running', ...p });
      },
    });
    if (!usable(snapshot) || activate && snapshot.snapshot.height!==height) throw new Error('Invalid generated snapshot');
    await chrome.storage.local.set({ ...(activate?{[K.liveEnabled]:false}:{}), [K.manual]: snapshot, syncStatus: { state: 'done', height: snapshot.snapshot.height, at: Date.now() } });
  } catch (e) {
    await setStatus({ state: 'error', kind: SRC.classify(e), message: e.message });
  } finally {
    clearInterval(keepAlive);
    running = false;
  }
}

// ------------------------------------------------------------ 实时同步

async function ensureAlarm() {
  const got = await chrome.storage.local.get(K.liveEnabled);
  if (SRC.resolveLive(got[K.liveEnabled])) {
    if (!(await chrome.alarms.get(ALARM))) await chrome.alarms.create(ALARM, { periodInMinutes: 1 });
  } else {
    await chrome.alarms.clear(ALARM);
  }
}

/** 一轮实时检查。是否真的发请求由 SRC.shouldCheck 决定（开关、页面可见、每分钟一次、退避期）。 */
async function liveTick() {
  if (liveBusy || running) return;
  liveBusy = true;
  liveFinished=new Promise(resolve=>{finishLive=resolve;});
  const keepAlive=setInterval(()=>chrome.runtime.getPlatformInfo(),20000); // Keep longer live batches alive.
  // Claim before the first await: alarm and heartbeat can arrive together.
  try {
    const got = await chrome.storage.local.get([K.liveEnabled, K.liveStatus, K.live, K.manual]);
    const { [SRC.SESSION_VISIBLE]: visibleAt } = await chrome.storage.session.get(SRC.SESSION_VISIBLE);
    const prev = SRC.statusOf(got[K.liveStatus], 'live');
    const now = Date.now();
    const go = SRC.shouldCheck({
      enabled: SRC.resolveLive(got[K.liveEnabled]), now, visibleAt,
      lastCheckAt: prev === undefined ? undefined : prev.checkedAt,
      nextAt: prev === undefined || prev.state !== 'error' ? undefined : prev.nextAt,
    });
    if (!go) return;
    const current = usable(got[K.live]) ? got[K.live] : undefined;
    try {
      const pulse = await CORE.fetchJson(`${CORE.API}/pulse`, 1);
      if (!Number.isSafeInteger(pulse.lastHeight)) throw new Error(`/pulse 的 lastHeight 非法：${pulse.lastHeight}`);
      if (current !== undefined && current.snapshot.height === pulse.lastHeight && current.snapshot.blockTime != null && prev?.epoch === pulse.epoch && pulse.epoch !== undefined) {
        // 没出新块：数据不用动，只记一下检查时间
        await chrome.storage.local.set({ [K.liveStatus]: { state: 'ok', checkedAt: Date.now(), epoch: pulse.epoch } });
        return;
      }
      const res = await CORE.generateLive({
        before: pulse,
        bases: [BUNDLED, got[K.manual], current].filter(usable),
        generatedAt: () => new Date().toISOString(),
      });
      if (res === null) {
        // Keep the previous epoch: this batch was not accepted.
        await chrome.storage.local.set({ [K.liveStatus]: { state: 'ok', checkedAt: now, epoch: prev?.epoch } });
        return;
      }
      if (!usable(res.snapshot)) throw new Error('Invalid generated live snapshot');
      // A user may disable sync while the network request is pending. Discard that batch.
      const latest = await chrome.storage.local.get(K.liveEnabled);
      if (!SRC.resolveLive(latest[K.liveEnabled])) return;
      await chrome.storage.local.set({
        [K.live]: res.snapshot,
        [K.liveStatus]: { state: 'ok', checkedAt: Date.now(), epoch: pulse.epoch },
      });
    } catch (e) {
      // 只记录原因并退避，已有数据不动，页面继续按旧数据工作
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
  } finally {
    clearInterval(keepAlive);
    liveBusy = false;
    finishLive();
  }
}

chrome.alarms.onAlarm.addListener((a) => {
  if (a.name === ALARM) liveTick();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !Object.prototype.hasOwnProperty.call(changes, K.liveEnabled)) return;
  ensureAlarm().then(() => {
    // 刚打开开关：清掉旧的退避，立刻试一次（仍要求有页面可见）
    if (SRC.resolveLive(changes[K.liveEnabled].newValue)) chrome.storage.local.remove(K.liveStatus).then(liveTick);
  });
});

// ------------------------------------------------------------ 消息

let comparisonQueue = Promise.resolve();

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (sender.id !== chrome.runtime.id || !msg) return false;
  if (msg.type === 'shn-open-compare') {
    chrome.tabs.create({url:chrome.runtime.getURL('workspace/index.html')}).then(()=>sendResponse({ok:true}),()=>sendResponse({ok:false}));
    return true;
  }
  if (msg.type === 'shn-compare') {
    if (!['clear','toggle'].includes(msg.action)) { sendResponse({ok:false}); return false; }
    // Serialize read/modify/write across tabs, including simultaneous additions.
    comparisonQueue = comparisonQueue.then(async()=>{
      const E=self.NakaExplore;
      const got=await chrome.storage.local.get([E.KEY,K.manual,K.live,K.liveEnabled]);
      const {snap}=SRC.choose({manual:got[K.manual],live:got[K.live],liveEnabled:got[K.liveEnabled]},BUNDLED);
      const out=msg.action==='clear'?{ids:[],state:'removed'}:E.toggle(got[E.KEY],msg.id,snap);
      await chrome.storage.local.set({[E.KEY]:out.ids});
      sendResponse({ok:true,...out});
    }).catch(()=>sendResponse({ok:false}));
    return true;
  }
  if (msg.type === 'shn-visible') {
    // 内容脚本心跳：有 ord-dropz 页面可见。记下时间，顺手检查一次（打开页面时不用等到下一分钟）。
    // 立即回应：不回应的话页面那边的 sendMessage 会以「消息端口在回应前关闭」失败，在页面控制台报错
    sendResponse({ ok: true });
    chrome.storage.session.set({ [SRC.SESSION_VISIBLE]: Date.now() }).then(liveTick);
    return false;
  }
  if (!['shn-sync','shn-set-fixed'].includes(msg.type)) return false;
  if (!(Number.isSafeInteger(msg.height) && msg.height >= 0)) {
    sendResponse({ ok: false, error: 'bad-height' });
    return false;
  }
  if (running) {
    sendResponse({ ok: false, error: 'busy' });
    return false;
  }
  if(msg.type==='shn-set-fixed'){sync(msg.height,true);sendResponse({ok:true});return false;}
  chrome.storage.local.get(K.liveEnabled).then(got=>{
    if(SRC.resolveLive(got[K.liveEnabled])){sendResponse({ok:false,error:'live-mode'});return;}
    if(running){sendResponse({ok:false,error:'busy'});return;}
    sync(msg.height);sendResponse({ok:true});
  });return true;
});
