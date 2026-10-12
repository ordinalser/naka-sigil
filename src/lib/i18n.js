/**
 * 界面文案：中文 / 英文两套，由用户在弹窗顶部切换，选择存在 chrome.storage.local 的 lang 键，没选过时用英文。
 * 需要拼接数字的文案写成函数，避免在 messages.json 里维护占位符。
 * （扩展在 chrome://extensions 里的名称由 _locales 按浏览器界面语言决定，插件无法切换。）
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ShnakasI18n = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const ZH = {
    heldTrait: n=>`零挂单 · ≥${n} 件`,
    heldRule: '该特征至少 20 件且零挂单：官方加成 +100%。件数来自所选快照目录。',
    lastSaleShort: '成交',
    lastSaleBasis: btc=>`最近成交价 ${btc} BTC ÷ 集合地板；不足 20 件且零挂单时适用`,
    saleUnknown: '成交依据缺失',
    launchTitle: h=>`奖励启动 · ${h}`,
    launchBefore: (blocks,eta,basis)=>`以区块 ${basis} 为准：还需 ${blocks} 块 · ${eta}`,
    launchReached: '所选区块已达到启动高度',
    launchUnknown: '预计时间未知',
    launchEta: utc=>`预计 ${utc} UTC`,
    launchStat: '距奖励启动',
    blocksUnit: '块',
    launchDate: (d)=>`约 ${d} UTC`,
    launchReachedShort: '已到达',
    launchAt: (h)=>`启动区块 ${h}`,
    launchMethod: '按区块头时间、10 分钟/块估算，非买入截止。准备参与：持有且未挂单；资格未核实。',
    scopeNote: '区块公式值 · 季度按官方快照',
    scopeActivity: '所示区块公式值 · 非成交时权重',
    scopeTimeUnknown: '时间未知',
    scopeTimeFuture: '时间超前',
    scopeSource: {live:'实时',synced:'指定',bundled:'内置'},
    fixedTitle:'设置指定区块',fixedConfirm:'使用此区块',cancel:'取消',fixedWatching:'保持所选区块 · 点击指定区块可修改',liveWatching:'随新区块自动更新',modeTitle:'区块模式',modeLive:'实时',modeFixed:'指定区块',fixedRequired:'请填写季度快照区块高度',
    headwear: 'Hair / headwear',
    collectionFloorBTC: '集合地板 · BTC',
    inspectProvisional: '季度权重按官方快照区块',
    formulaTitle: '持有权重公式',
    formulaColumn: '该区块',
    listing: {
      listed: {label:'该区块已挂单',meaning:'挂单期间奖励为零',note:'奖励资格未核实；撤单后下个每周奖励边界恢复。'},
      unlisted: {label:'该区块未挂单',meaning:'奖励资格未核实',note:'撤单等待期可能持续至下个每周奖励边界。'},
      unknown: {label:'挂单状态未知',meaning:'奖励资格未核实',note:'快照缺少逐笔挂单，请同步核实；公式值不代表奖励。'}
    },
    activityShort: '基于同步区块，非成交时的历史权重。',
    numberBadge: (label,pct) => `${label} · 编号加成 +${pct}%，已包含在总权重中`,
    lookupBack: '返回概览',
    change: {up:'加成上升',down:'加成下降',market:'计价依据变化',unknown:'价格依据缺失',known:'价格依据已知'},

    buyTitle: '成交后持有权重',
    formulaBefore: '成交前公式值',
    changedRows: '高亮行：成交前 → 成交后',
    buyAfter: '成交后',
    buyRangeNote: '小型零挂单特征缺少成交依据，区间仅为理论估算。',
    buyRatioNote: '比值：特征价格 ÷ 集合地板',
    buyAfterShort: '成交后',
    totalWeight: '总权重',
    buyAssumptionShort: '仅此挂单成交，其他挂单不变。',
    buyNoFloor: '移除此挂单后已无挂单，集合地板不存在，无法计算权重。',
    buyBadgeNote: '持有公式值，含基础 100%，不代表奖励。成交前公式值 / 成交后：仅此挂单成交，其他挂单不变。挂单期间奖励为零；成交不保证立即获奖。区间仅为理论估算。',
    title: 'Naka Sigil',
    tagline: '找到你的 Naka · SHNAKAS 权重',
    weight: '总持有权重',
    bonus: '加成',
    weightMeaning: '总权重是含基础 100% 的持有公式值，不代表奖励或奖励资格。',
    capShort: '上限',
    weightShort: '总权重',
    details: '特征明细',
    activityNote: '总权重为含基础 100% 的持有公式值，不代表奖励。交易记录旁的数据与挂单状态基于上方同步区块，不是成交时的历史状态。',
    rulesCaveat: '基础 100% + 特征加成 + 号码加成，最高 400%。零挂单特征：至少 20 件加 +100%；不足 20 件参考最近成交价。季度测量高度与号码口径未核实。',
    base: '基础',
    number: 'Shielded 编号',
    atCap: (cap) => `已封顶 ${cap}%`,
    unmeasured: (k, max) => `${k} 个小型零挂单特征缺少成交依据；每个 +0%～+${max}% 仅为理论区间。`,
    snapshot: (h, btc) => `快照：区块 ${h} · 集合地板 ${btc} BTC`,
    snapBlock: (h) => `区块 ${h}`,
    beforeMeasure: (h) => `区块 ${h} 公式值；季度结算使用官方快照区块。`,
    listedZero: '挂单收益为 0；撤单后需等到下一个每周奖励边界恢复。这里显示持有时的权重公式值，不代表当前收益。',
    notInSnapshot: '所选区块快照未收录这件藏品；实时模式会随新区块补入新铸造的藏品。',
    floorOf: (btc, n) => `特征地板 ${btc} BTC · ${n} 个挂单`,
    noFloor: '快照时没有挂单，测不出地板价',
    // 弹窗
    popupRules: '计算规则与限制',
    popupTrait: '特征地板 ÷ 集合地板',
    popupNumber: '号码（只取最高一档）',
    popupCap: '总权重上限',
    popupSource: '规则原文',
    popupZeroSource: '零挂单补充规则',
    popupOpen: '打开市场 ↗',
    lookupTitle: '按 Shielded 编号查询',
    lookupPlaceholder: '输入编号，例如 379',
    lookupButton: '查权重',
    lookupInvalid: '请输入有效的非负整数编号，支持 #0、#379。',
    lookupMissing: (n) => `所选区块快照未收录 Shielded #${n}，不代表这件 NFT 不存在；实时模式会随新区块补入新铸造的藏品。`,
    lookupBasis: (h) => `区块 ${h} 公式值；季度结算使用官方快照区块。`,
    lookupView: '查看藏品 ↗',
    popupSnapshot: '当前计算依据',
    popupHeight: '已同步区块',
    popupFloor: '集合地板',
    popupListings: '有效挂单',
    ladderTitle: '权重阶梯',
    ladderSub: '达到每档成交后权重的最低挂价',
    ladderUnit: '挂价 · BTC',
    ladderNote: '所选区块挂价，不含费用；每行仅该挂单成交、其他挂单不变。点击查看明细。',
    ladderNoOffers: '该快照缺少逐项挂单，无法按权重列出挂价。',
    ladderNone: '该区块没有可计算成交后权重的挂单。',
    ladderRowTitle: (n)=>`查看 Shielded #${n} 的计算明细`,
    ladderRowLabel: (w,n,p)=>`成交后 ${w}：Shielded #${n}，挂价 ${p} BTC`,
    srcBundled: '内置快照',
    srcSynced: '指定区块',
    syncPlaceholder: '季度快照区块高度',
    syncHint: () => '填写官方季度快照高度；载入后保持该区块。',
    syncStage: { state: '读取链上状态…', build: '汇总地板价…' },
    syncMeta: (done, total) => `补充新铸造藏品的特征 ${done}/${total}…`,
    syncDone: (h) => `同步完成：区块 ${h}`,
    syncError: (msg) => `同步失败：${msg}`,
    syncInterrupted: '上次同步被中断（后台被浏览器回收），请重新同步',
    syncBadHeight: '区块高度只能填数字',
    syncBusy: '已有同步在进行中',
    srcLive: '实时',
    liveHint: '市场、比较页或弹窗可见时自动检查；指定区块模式暂停更新。',
    liveOff: '指定区块模式：保持所选区块，不随新区块更新',
    liveWaiting: '正在检查最新区块',
    livePaused: '未在使用，自动检查暂停',
    liveOk: (h, age) => `已同步区块 ${h} · ${age}`,
    liveFail: (reason, min) => `最近一次检查失败：${reason}。${min} 分钟后自动重试`,
    liveKeep: (h) => `页面继续使用区块 ${h} 的数据`,
    liveKeepNone: '页面继续使用指定区块或内置快照',
    failReason: {
      'rate-limit': '接口限流',
      server: '接口服务端出错',
      http: '接口返回错误',
      network: '网络不通或请求超时',
      data: '数据校验没通过',
    },
    httpCode: (n) => `（HTTP ${n}）`,
    blockTimeUnknown: '区块时间未知',
    blockTimeFuture: '区块时间晚于本机时间',
    blockTimeAge: (ago) => `区块时间：${ago}`,
    blockTimeExact: (utc) => `Bitcoin 区块头时间 · ${utc} · Blockstream；并非检测时间`,
    ago: (ms) => (ms < 60000 ? '不足 1 分钟前' : ms < 3600000 ? `${Math.floor(ms / 60000)} 分钟前` : ms < 86400000 ? `${Math.floor(ms / 3600000)} 小时前` : `${Math.floor(ms / 86400000)} 天前`),
  };

  const EN = {
    heldTrait: n=>`Zero listed · ≥${n} items`,
    heldRule: 'At least 20 items and none listed: official +100% bonus. Count uses the selected catalog.',
    lastSaleShort: 'Sale',
    lastSaleBasis: btc=>`Last sale ${btc} BTC ÷ collection floor; for zero-listed traits with fewer than 20 items`,
    saleUnknown: 'Sale basis missing',
    launchTitle: h=>`Rewards start · ${h}`,
    launchBefore: (blocks,eta,basis)=>`${blocks} blocks from #${basis} · ${eta}`,
    launchReached: 'Selected block has reached the start height',
    launchUnknown: 'ETA unavailable',
    launchEta: utc=>`Est. ${utc} UTC`,
    launchStat: 'To rewards start',
    blocksUnit: 'blocks',
    launchDate: (d)=>`~${d} UTC`,
    launchReachedShort: 'Reached',
    launchAt: (h)=>`Start block ${h}`,
    launchMethod: 'Header time + 10 min/block; not a buying deadline. Hold unlisted; eligibility unverified.',
    scopeNote: 'Block formula · Quarters use the official snapshot',
    scopeActivity: 'Selected-block formula · Not sale-time weight',
    scopeTimeUnknown: 'Time unknown',
    scopeTimeFuture: 'Time ahead',
    scopeSource: {live:'Live',synced:'Fixed',bundled:'Bundled'},
    fixedTitle:'Set fixed block',fixedConfirm:'Use block',cancel:'Cancel',fixedWatching:'Block held · select Fixed block to edit',liveWatching:'Follows new blocks automatically',modeTitle:'Block mode',modeLive:'Live',modeFixed:'Fixed block',fixedRequired:'Enter a quarterly snapshot block',
    headwear: 'Hair / headwear',
    collectionFloorBTC: 'Floor · BTC',
    inspectProvisional: 'Quarterly weights use the official snapshot block',
    formulaTitle: 'Holding formula',
    formulaColumn: 'At this block',
    listing: {
      listed: {label:'Listed at this block',meaning:'No rewards while listed',note:'Eligibility unverified. Delisting resumes at the next weekly reward boundary.'},
      unlisted: {label:'Unlisted at this block',meaning:'Eligibility unverified',note:'A delisting cooldown may apply until the next weekly reward boundary.'},
      unknown: {label:'Listing status unknown',meaning:'Eligibility unverified',note:'Individual listings are missing; sync to verify. Formula weight is not rewards.'}
    },
    activityShort: 'Selected-block formula, not sale-time weight.',
    numberBadge: (label,pct) => `${label} · number bonus +${pct}%, already included in total weight`,
    lookupBack: 'Overview',
    change: {up:'Bonus up',down:'Bonus down',market:'Price basis changed',unknown:'Price basis missing',known:'Price basis known'},

    buyTitle: 'Holding weight after sale',
    formulaBefore: 'Before-sale formula',
    changedRows: 'Highlighted: before → after sale',
    buyAfter: 'After sale',
    buyRangeNote: 'Small zero-listed traits lack sale data; ranges are theoretical.',
    buyRatioNote: 'Trait price ÷ collection floor',
    buyAfterShort: 'After sale',
    totalWeight: 'Total weight',
    buyAssumptionShort: 'Only this listing sells; others unchanged.',
    buyNoFloor: 'No listings remain after this sale. The collection floor is undefined, so weight cannot be calculated.',
    buyBadgeNote: 'Holding formula, including the 100% base, not rewards. Before-sale formula / After sale: only this listing sells; others unchanged. No rewards while listed; buying does not confirm eligibility. Ranges are theoretical.',
    title: 'Naka Sigil',
    tagline: 'Find your Naka · SHNAKAS weights',
    weight: 'Total holding weight',
    bonus: 'Bonus',
    weightMeaning: 'Total weight is the holding formula including the 100% base, not rewards or eligibility.',
    capShort: 'Cap',
    weightShort: 'Weight',
    details: 'Trait breakdown',
    activityNote: 'Holding-formula values include the 100% base, not rewards. Activity values and listing status use the synced block above, not the historical state at the time of sale.',
    rulesCaveat: '100% base + trait + number bonuses, capped at 400%. Zero-listed traits: ≥20 items get +100%; smaller traits use last sales. Quarter height and numbering remain unverified.',
    base: 'Base',
    number: 'Shielded #',
    atCap: (cap) => `Capped at ${cap}%`,
    unmeasured: (k, max) => `${k} small zero-listed trait(s) lack sale data. +0%–+${max}% each is theoretical.`,
    snapshot: (h, btc) => `Snapshot: block ${h} · collection floor ${btc} BTC`,
    snapBlock: (h) => `Block ${h}`,
    beforeMeasure: (h) => `Formula at block ${h}; quarterly weights use the official snapshot block.`,
    listedZero: 'Earnings are zero while listed. Delisting resumes rewards at the next weekly boundary. Holding weight is not current earnings.',
    notInSnapshot: 'Not in the selected snapshot. Live mode adds newly minted pieces as new blocks arrive.',
    floorOf: (btc, n) => `Trait floor ${btc} BTC · ${n} listed`,
    noFloor: 'No listings at the snapshot; floor unknown',
    popupRules: 'Rules & limitations',
    popupTrait: 'Trait floor ÷ collection floor',
    popupNumber: 'Number (highest tier only)',
    popupCap: 'Total weight cap',
    popupSource: 'Source',
    popupZeroSource: 'Zero-listing supplement',
    popupOpen: 'Open market ↗',
    lookupTitle: 'Find by Shielded number',
    lookupPlaceholder: 'Enter number, e.g. 379',
    lookupButton: 'Check weight',
    lookupInvalid: 'Enter a non-negative whole number, e.g. #0 or #379.',
    lookupMissing: (n) => `Shielded #${n} is not in the selected snapshot. This does not mean it does not exist; Live mode adds newly minted pieces as new blocks arrive.`,
    lookupBasis: (h) => `Formula at block ${h}; quarterly weights use the official snapshot block.`,
    lookupView: 'View item ↗',
    popupSnapshot: 'Calculation snapshot',
    popupHeight: 'Synced block',
    popupFloor: 'Collection floor',
    popupListings: 'Active listings',
    ladderTitle: 'Weight ladder',
    ladderSub: 'Lowest ask reaching each after-sale weight',
    ladderUnit: 'Ask · BTC',
    ladderNote: 'Selected-block asks, excluding fees. Each row: only that listing sells. Select for details.',
    ladderNoOffers: 'This snapshot lacks individual listings, so asks cannot be ranked by weight.',
    ladderNone: 'No listing at this block has a computable after-sale weight.',
    ladderRowTitle: (n)=>`Show the calculation for Shielded #${n}`,
    ladderRowLabel: (w,n,p)=>`After sale ${w}: Shielded #${n}, ask ${p} BTC`,
    srcBundled: 'Bundled snapshot',
    srcSynced: 'Fixed block',
    syncPlaceholder: 'Quarterly snapshot block',
    syncHint: () => 'Enter the official quarterly snapshot height. Data stays at that block.',
    syncStage: { state: 'Reading on-chain state…', build: 'Computing floors…' },
    syncMeta: (done, total) => `Fetching traits of newly minted pieces ${done}/${total}…`,
    syncDone: (h) => `Synced: block ${h}`,
    syncError: (msg) => `Sync failed: ${msg}`,
    syncInterrupted: 'The last sync was interrupted (background worker was stopped); please sync again',
    syncBadHeight: 'Block height must be a number',
    syncBusy: 'A sync is already running',
    srcLive: 'Live',
    liveHint: 'Checks while the market, Compare or popup is visible. Fixed mode pauses automatic updates.',
    liveOff: 'Fixed block: holds the selected block without automatic updates',
    liveWaiting: 'Checking the latest block',
    livePaused: 'Checks pause when the tool is not in use',
    liveOk: (h, age) => `Synced block ${h} · ${age}`,
    liveFail: (reason, min) => `Last check failed: ${reason}. Retrying in ${min} min`,
    liveKeep: (h) => `Pages keep using block ${h} data`,
    liveKeepNone: 'Pages keep using the fixed-block or bundled snapshot',
    failReason: {
      'rate-limit': 'rate limited',
      server: 'server error',
      http: 'the API returned an error',
      network: 'network unreachable or timed out',
      data: 'data validation failed',
    },
    httpCode: (n) => ` (HTTP ${n})`,
    blockTimeUnknown: 'Block time unknown',
    blockTimeFuture: 'Block timestamp ahead of local clock',
    blockTimeAge: (ago) => `Block time: ${ago}`,
    blockTimeExact: (utc) => `Bitcoin header timestamp · ${utc} · Blockstream; not check time`,
    ago: (ms) => (ms < 60000 ? '<1 min ago' : ms < 3600000 ? `${Math.floor(ms / 60000)} min ago` : ms < 86400000 ? `${Math.floor(ms / 3600000)} h ago` : `${Math.floor(ms / 86400000)} d ago`),
  };

  const LANGS = Object.freeze({ zh: ZH, en: EN });
  const DEFAULT_LANG = 'en'; // New installations default to English; preserve an explicit saved preference.
  const STORAGE_KEY = 'lang';

  /** 存储里的语言值 → 语言代码。没选过（undefined）用默认英文；损坏的设置回到默认英文。 */
  function resolveLang(stored) {
    return typeof stored === 'string' && Object.prototype.hasOwnProperty.call(LANGS, stored) ? stored : DEFAULT_LANG;
  }

  function pick(lang) {
    if (!Object.prototype.hasOwnProperty.call(LANGS, lang)) throw new Error(`不认识的语言：${lang}`);
    return LANGS[lang];
  }

  /** 聪 → BTC 字符串，去掉末尾的 0（111000 → "0.00111"）。 */
  function btc(sats) {
    return (sats / 1e8).toFixed(8).replace(/0+$/, '').replace(/\.$/, '');
  }

  function int(n) {
    return n.toLocaleString('en-US');
  }

  /** Formula inputs are height-bound; use the official quarter block for quarterly measurement. */
  function blockTimestamp(s) {
    const b=s?.blockTime;
    return b && b.height === s?.height && typeof b.hash === 'string' && /^[0-9a-f]{64}$/.test(b.hash) && Number.isSafeInteger(b.timestamp) && b.timestamp >= 1231006505 && b.timestamp <= 0xffffffff ? b.timestamp : null;
  }
  function blockAge(T, s, now=Date.now()) {
    const ts=blockTimestamp(s);
    if(ts === null) return T.blockTimeUnknown;
    const delta=now-ts*1000;
    return delta < 0 ? T.blockTimeFuture : T.blockTimeAge(T.ago(delta));
  }
  function blockTimeTitle(T, s) {
    const ts=blockTimestamp(s);
    return ts === null ? T.blockTimeUnknown : T.blockTimeExact(new Date(ts*1000).toISOString().replace('T',' ').replace('.000Z',' UTC'));
  }
  function blockBasis(T, s, now=Date.now()) { return `${int(s.height)} (${blockAge(T,s,now)})`; }
  function measureNote(T, snapshotHeight, s) {
    return T.beforeMeasure(s ? blockBasis(T,s) : int(snapshotHeight));
  }

  return { LANGS, DEFAULT_LANG, STORAGE_KEY, resolveLang, pick, btc, int, blockTimestamp, blockAge, blockTimeTitle, blockBasis, measureNote, ZH, EN };
});
