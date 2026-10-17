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
    officialSales: '官方 · 近3笔成交',
    officialNoSales: '暂无成交记录',
    officialLastBlock: '官方沿用前块加成',
    carryUnknown: '撤单沿用值未核实',
    officialBasis: '同一区块的官方奖励接口；不足20件且零挂单的特征采用官方加成。',
    relayCredits: '中继额度',
    relayCreditsMeaning: '此挂单在该区块的剩余预付中继次数，随藏品转移；发送、上架、撤单可消耗额度。奖励领取另付网络费。',
    salesMedianShort: '成交中位',
    salesMedianBasis: btc=>`最近 3 笔成交价中位数 ${btc} BTC ÷ 集合地板（两笔取平均、一笔取该笔）；不足 20 件且零挂单时适用`,
    noSales: '无成交',
    noSalesBasis: '不足 20 件、零挂单且无成交记录：+0%',
    salesTied: '同块成交顺序未定',
    salesTiedBasis: '同一区块有多笔成交，公开数据无法确定哪几笔属于最近 3 笔；显示该特征的上下界。',
    saleUnknown: '成交依据缺失',
    rewardWeek:(n,total)=>`第 ${n}/${total} 奖励周`,accrualRemaining:'距奖励结束',accrualRemainingAtBlock:'该块距奖励结束',lastRewardBlock:h=>`最后有奖励的区块 ${h}`,workerUnreachable:'无法连接后台，请重新打开弹窗',
    completedWeeks:'已完成奖励周',weeksUnit:'周',claimLimit:h=>`领取上限 ${h}`,rewardClosed:'超过领取上限',rewardClosedNote:'已超过协议领取高度上限；区块公式仍可历史查询。',
    launchStatAtBlock:'该块距第 1 周',firstRewardAtBlock:'该块距奖励开始',weekRemainingAtBlock:'该块距周界',weekRemaining:'距下周边界',firstRewardBlock:'距第一个有奖励的区块',rewardEnded:'累计已结束',rewardBoundary:'奖励启动边界',
    weekRange:(a,b)=>`${a}–${b}`,nextBoundary:h=>`下周起点 ${h}`,finalBoundary:h=>`最终边界 ${h}`,
    phaseNotStarted:'奖励尚未启动',phaseBoundary:'下一块开始有奖励',phaseEnded:'奖励累计已结束',
    
    rewardEndNote:h=>`完整合资格周可领取；协议领取上限 ${h}。`,
    noFutureWeekNote:'本期已无后续完整奖励周。',
    
    quarterUnconfirmed:'按区块动态计权；以下仅为每周奖励边界。',
    boundaryReference:h=>`周界参考链高 ${h}`,boundaryChoose:'选择奖励周起点',boundaryPast:'已到达 · 倒序',boundaryFuture:'尚未到达',boundaryLaunch:'启动前最后一块',boundaryWeek:n=>`第${n}周`,
    boundaryDistance:(n,date)=>`还需${n}块 · ${date}`,historyCheck:'查该区块',historyLookup:'查历史 ↗',historyTitle:'按区块查藏品',historyNumber:'Shielded 编号',historyConfirm:'查询历史',historyModeHint:'仅查看此次历史记录，不改变实时持仓、比较或市场数据。',
    launchTitle: h=>`第 1 周起点 · ${h}`,
    launchBefore: (blocks,eta,basis)=>`以区块 ${basis} 为准：还需 ${blocks} 块 · ${eta}`,
    
    launchUnknown: '预计时间未知',
    
    launchStat: '距第 1 周',
    blocksUnit: '块',
    launchDate: (d)=>`约 ${d}`,
    
    launchAt: (h)=>`启动区块 ${h}`,
    launchMethod: '按区块头时间、10分钟/块估算。奖励周为1008块；未挂单持有，完整周可领取。',
    scopeNote: '区块权重 · 非累计奖励',
    scopeActivity: '所示区块公式值 · 非成交时权重',
    scopeTimeUnknown: '时间未知',
    scopeTimeFuture: '时间超前',
    scopeSource: {live:'实时',bundled:'内置'},
    cancel:'取消',liveWatching:'随新区块自动更新',modeTitle:'区块模式',modeLive:'实时',fixedRequired:'请填写区块高度',
    headwear: 'Hair / headwear',
    collectionFloorBTC: '集合地板 · BTC',
    inspectProvisional: '隐私领取100% · 展示藏品可领全部权重',
    formulaTitle: '持有权重公式',
    formulaColumn: '该区块',
    listing: {
      listed: {label:'该区块已挂单'},
      unlisted: {label:'该区块未挂单'},
      unknown: {label:'挂单状态未知'}
    },
    activityShort: '基于同步区块，非成交时的历史权重。',
    numberBadge: (label,pct) => `${label} · 编号加成 +${pct}%，已包含在总权重中`,
    lookupBack: '返回',
    change: {up:'加成上升',down:'加成下降',market:'计价依据变化',unknown:'价格依据缺失',known:'价格依据已知'},
    pastRewardNote:'既有奖励属于此前持有记录，不随藏品转移。',buyEligibilityNote:'成交确认后从下个奖励周起有奖励；成交当周这一枚买卖双方都没有奖励。',
    closingSaleTag:'成交中',closingCancelTag:'撤单中',
    closingSale:'已有人买下这单，正在等下一块确认：现在去买会失败，只有那笔购买失败它才会回到市场。',
    closingCancel:'卖家正在撤单，下一块确认后下架。',
    cancelScopeNote:'自己的挂单显示撤单后权重，仅移除对应挂单；奖励从下一奖励周恢复。',cancelBefore:'挂单中公式值',cancelAfter:'撤单后',cancelTitle:'撤单后持有权重',cancelAssumption:'仅撤销此挂单，其他挂单不变。',cancelNoFloor:'撤销后无剩余挂单，无法计算集合地板及权重。',
    buyTitle: '成交后持有权重',
    formulaBefore: '成交前公式值',
    changedRows: '高亮行：成交前 → 成交后',
    buyAfter: '成交后',
    buyRangeNote: '小型零挂单特征依据未核实，加成显示范围。',
    buyRatioNote: '比值：特征价格 ÷ 集合地板',
    buyAfterShort: '成交后',
    totalWeight: '总权重',
    buyAssumptionShort: '仅此挂单成交，其他挂单不变。',
    buyNoFloor: '移除此挂单后已无挂单，集合地板不存在，无法计算权重。',
    buyBadgeNote: '持有公式值，含基础 100%，不代表奖励。成交前公式值 / 成交后：仅此挂单成交，其他挂单不变。挂单期间没有奖励；买入后从下一奖励周起有奖励，成交当周这一枚谁都没有奖励。缺少特征依据时显示范围。',
    title: 'Naka Sigil',
    weight: '总持有权重',
    bonus: '加成',
    weightMeaning: '总权重是含基础 100% 的持有公式值，不代表奖励或奖励资格。',
    capShort: '上限',
    weightShort: '总权重',
    details: '特征明细',
    activityNote: '总权重为含基础 100% 的持有公式值，不代表奖励。交易记录旁的数据与挂单状态基于上方同步区块，不是成交时的历史状态。',
    
    base: '基础',
    number: 'Shielded 编号',
    atCap: (cap) => `已封顶 ${cap}%`,
    unmeasured: (k, max) => `${k} 个小型零挂单特征缺少成交依据；每个 +0%～+${max}% 仅为理论区间。`,
    snapshot: (h, btc) => `快照：区块 ${h} · 集合地板 ${btc} BTC`,
    snapBlock: (h) => `区块 ${h}`,
    beforeMeasure: (h) => `区块 ${h} 公式值；非官方结算或累计奖励。`,
    listedZero: '挂单收益为 0；撤单后需等到下一个每周奖励边界恢复。这里显示持有时的权重公式值，不代表当前收益。',
    notInSnapshot: '所选区块快照未收录这件藏品；实时模式会随新区块补入新铸造的藏品。',
    floorOf: (btc, n) => `特征地板 ${btc} BTC · ${n} 个挂单`,
    noFloor: '快照时没有挂单，测不出地板价',
    // 弹窗
    
    
    
    
    
    
    popupOpen: '打开市场 ↗',
    lookupTitle: '按 Shielded 编号查询',
    lookupPlaceholder: '输入编号，例如 379',
    lookupButton: '查权重',
    lookupInvalid: '请输入有效的非负整数编号，支持 #0、#379。',
    lookupMissing: (n) => `所选区块快照未收录 Shielded #${n}，不代表这件 NFT 不存在；实时模式会随新区块补入新铸造的藏品。`,
    lookupBasis: (h) => `区块 ${h} 公式值；非官方结算或累计奖励。`,
    lookupView: '前往市场 ↗',
    popupSnapshot: '当前计算依据',
    popupHeight: '已同步区块',
    popupFloor: '集合地板',
    popupListings: '有效挂单',
    
    
    
    
    
    
    
    
    srcBundled: '内置快照',
    
    syncPlaceholder: '区块高度',
    
    syncStage: { state: '读取链上状态…', build: '汇总地板价…' },
    syncMeta: (done, total) => `补充新铸造藏品的特征 ${done}/${total}…`,
    syncDone: (h) => `查询完成：区块 ${h}`,
    syncError: (msg) => `查询失败：${msg}`,
    syncInterrupted: '上次查询被中断（后台被浏览器回收），请重新查询',
    syncBadHeight: '区块高度只能填数字',
    syncBusy: '已有一个历史查询在进行中',
    srcLive: '实时',
    
    
    liveWaiting: '正在检查最新区块',
    livePaused: '未在使用，自动检查暂停',
    updateTitle: '完成更新',
    updateText: (v) => `v${v} 的文件已经就位，重新加载插件后即可使用。`,
    updateKeep: '持仓、比较和设置都会保留。',
    updateReload: '重新加载插件',
    updateHint: '在扩展管理页点“重新加载”效果相同。',
    liveOk: (h, age) => `已同步区块 ${h} · ${age}`,
    liveFail: (reason, min) => `最近一次检查失败：${reason}。${min} 分钟后自动重试`,
    liveKeep: (h) => `页面继续使用区块 ${h} 的数据`,
    liveKeepNone: '页面继续使用内置快照',
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
    officialSales: 'Official · recent 3 sales',
    officialNoSales: 'No recorded sales',
    officialLastBlock: 'Official carried bonus',
    carryUnknown: 'Delisting carry unverified',
    officialBasis: 'Official reward API at this block; rare zero-listed trait bonus.',
    relayCredits: 'Relay credits',
    relayCreditsMeaning: 'Remaining prepaid relay uses on this listing at this block, carried with the piece. Sending, listing or cancelling may consume credits. Reward claims pay network fees separately.',
    salesMedianShort: 'Sales median',
    salesMedianBasis: btc=>`Median of the last 3 sales ${btc} BTC ÷ collection floor (two sales: their mean; one: that sale); for zero-listed traits with fewer than 20 items`,
    noSales: 'No sales',
    noSalesBasis: 'Fewer than 20 items, none listed and no recorded sale: +0%',
    salesTied: 'Same-block sale order unknown',
    salesTiedBasis: 'Several sales share one block, so public data cannot tell which belong to the last 3; the trait shows its bounds.',
    saleUnknown: 'Sale basis missing',
    rewardWeek:(n,total)=>`Reward week ${n}/${total}`,accrualRemaining:'To the end of accrual',accrualRemainingAtBlock:'This block to the end of accrual',lastRewardBlock:h=>`Last rewarded block ${h}`,workerUnreachable:'Could not reach the background worker; reopen the popup',
    completedWeeks:'Completed weeks',weeksUnit:'weeks',claimLimit:h=>`Claim limit ${h}`,rewardClosed:'Claim limit passed',rewardClosedNote:'Past the protocol claim-height limit; historical formulas remain inspectable.',
    launchStatAtBlock:'This block to week 1',firstRewardAtBlock:'To accrual at block',weekRemainingAtBlock:'Next week at block',weekRemaining:'To next week',firstRewardBlock:'To first reward block',rewardEnded:'Accrual ended',rewardBoundary:'Reward start boundary',
    weekRange:(a,b)=>`${a}–${b}`,nextBoundary:h=>`Next week: ${h}`,finalBoundary:h=>`Final boundary: ${h}`,
    phaseNotStarted:'Rewards not started',phaseBoundary:'Accrual starts next block',phaseEnded:'Reward accrual ended',
    
    rewardEndNote:h=>`Completed eligible weeks are claimable; protocol claim limit ${h}.`,
    noFutureWeekNote:'No later full reward week in this programme.',
    
    quarterUnconfirmed:'Weights follow each block. These are reward-week boundaries only.',
    boundaryReference:h=>`Boundary reference: block ${h}`,boundaryChoose:'Choose reward-week start',boundaryPast:'Reached · newest first',boundaryFuture:'Upcoming',boundaryLaunch:'Last block before rewards',boundaryWeek:n=>`Week ${n}`,
    boundaryDistance:(n,date)=>`${n} block${n==='1'?'':'s'} · ${date}`,historyCheck:'Inspect block',historyLookup:'At block ↗',historyTitle:'Look up at block',historyNumber:'Shielded number',historyConfirm:'Inspect history',historyModeHint:'One-time inspection. Live holdings, comparisons and market data stay unchanged.',
    launchTitle: h=>`Week 1 starts · ${h}`,
    launchBefore: (blocks,eta,basis)=>`${blocks} block${blocks==='1'?'':'s'} from #${basis} · ${eta}`,
    
    launchUnknown: 'ETA unavailable',
    
    launchStat: 'To week 1',
    blocksUnit: 'blocks',
    launchDate: (d)=>`~${d}`,
    
    launchAt: (h)=>`Start block ${h}`,
    launchMethod: 'Header time + 10 min/block. Reward weeks are 1,008 blocks; hold unlisted and claim completed weeks.',
    scopeNote: 'Block weight · Not accrued rewards',
    scopeActivity: 'Selected-block formula · Not sale-time weight',
    scopeTimeUnknown: 'Time unknown',
    scopeTimeFuture: 'Time ahead',
    scopeSource: {live:'Live',bundled:'Bundled'},
    cancel:'Cancel',liveWatching:'Follows new blocks automatically',modeTitle:'Block mode',modeLive:'Live',fixedRequired:'Enter a block height',
    headwear: 'Hair / headwear',
    collectionFloorBTC: 'Floor · BTC',
    inspectProvisional: 'Private claim: 100% · Reveal for full weight',
    formulaTitle: 'Holding formula',
    formulaColumn: 'At this block',
    listing: {
      listed: {label:'Listed at this block'},
      unlisted: {label:'Unlisted at this block'},
      unknown: {label:'Listing status unknown'}
    },
    activityShort: 'Selected-block formula, not sale-time weight.',
    numberBadge: (label,pct) => `${label} · number bonus +${pct}%, already included in total weight`,
    lookupBack: 'Back',
    change: {up:'Bonus up',down:'Bonus down',market:'Price basis changed',unknown:'Price basis missing',known:'Price basis known'},
    pastRewardNote:'Past rewards belong to the prior holding record and do not transfer with the piece.',buyEligibilityNote:'A new holding starts the reward week after confirmation; in the sale week the piece earns nothing for either side.',
    closingSaleTag:'Selling',closingCancelTag:'Reclaiming',
    closingSale:'Someone has bought this listing and it is confirming in the next block: buying it now fails; it comes back only if that purchase fails.',
    closingCancel:'The seller is reclaiming this listing; it leaves the market at the next block.',
    cancelScopeNote:'Owned listings show weight after delisting: only that ask is removed. Rewards resume next reward week.',cancelBefore:'Listed formula',cancelAfter:'After delisting',cancelTitle:'Holding weight after delisting',cancelAssumption:'Only this listing is cancelled; others unchanged.',cancelNoFloor:'No listings remain after cancellation; floor and weight are unavailable.',
    buyTitle: 'Holding weight after sale',
    formulaBefore: 'Before-sale formula',
    changedRows: 'Highlighted: before → after sale',
    buyAfter: 'After sale',
    buyRangeNote: 'Unverified rare-trait sale basis: bonus shown as a range.',
    buyRatioNote: 'Trait price ÷ collection floor',
    buyAfterShort: 'After sale',
    totalWeight: 'Total weight',
    buyAssumptionShort: 'Only this listing sells; others unchanged.',
    buyNoFloor: 'No listings remain after this sale. The collection floor is undefined, so weight cannot be calculated.',
    buyBadgeNote: 'Holding formula, base 100% included, not a reward. Before / after sale: only this listing sells, others unchanged. Nothing is earned while listed; a purchase earns from the next reward week, and nobody earns the sale week for the piece. Missing trait evidence shows a range.',
    title: 'Naka Sigil',
    weight: 'Total holding weight',
    bonus: 'Bonus',
    weightMeaning: 'Total weight is the holding formula including the 100% base, not rewards or eligibility.',
    capShort: 'Cap',
    weightShort: 'Weight',
    details: 'Trait breakdown',
    activityNote: 'Holding-formula values include the 100% base, not rewards. Activity values and listing status use the synced block above, not the historical state at the time of sale.',
    
    base: 'Base',
    number: 'Shielded #',
    atCap: (cap) => `Capped at ${cap}%`,
    unmeasured: (k, max) => `${k} small zero-listed trait(s) lack sale data. +0%–+${max}% each is theoretical.`,
    snapshot: (h, btc) => `Snapshot: block ${h} · collection floor ${btc} BTC`,
    snapBlock: (h) => `Block ${h}`,
    beforeMeasure: (h) => `Formula at block ${h}; not an official settlement or accrued rewards.`,
    listedZero: 'Earnings are zero while listed. Delisting resumes rewards at the next weekly boundary. Holding weight is not current earnings.',
    notInSnapshot: 'Not in the selected snapshot. Live mode adds newly minted pieces as new blocks arrive.',
    floorOf: (btc, n) => `Trait floor ${btc} BTC · ${n} listed`,
    noFloor: 'No listings at the snapshot; floor unknown',
    
    
    
    
    
    
    popupOpen: 'Open market ↗',
    lookupTitle: 'Find by Shielded number',
    lookupPlaceholder: 'Enter number, e.g. 379',
    lookupButton: 'Check weight',
    lookupInvalid: 'Enter a non-negative whole number, e.g. #0 or #379.',
    lookupMissing: (n) => `Shielded #${n} is not in the selected snapshot. This does not mean it does not exist; Live mode adds newly minted pieces as new blocks arrive.`,
    lookupBasis: (h) => `Formula at block ${h}; not an official settlement or accrued rewards.`,
    lookupView: 'View on market ↗',
    popupSnapshot: 'Calculation snapshot',
    popupHeight: 'Synced block',
    popupFloor: 'Collection floor',
    popupListings: 'Active listings',
    
    
    
    
    
    
    
    
    srcBundled: 'Bundled snapshot',
    
    syncPlaceholder: 'Block height',
    
    syncStage: { state: 'Reading on-chain state…', build: 'Computing floors…' },
    syncMeta: (done, total) => `Fetching traits of newly minted pieces ${done}/${total}…`,
    syncDone: (h) => `Inspection done: block ${h}`,
    syncError: (msg) => `Inspection failed: ${msg}`,
    syncInterrupted: 'The last inspection was interrupted (the background worker was stopped); run it again',
    syncBadHeight: 'Block height must be a number',
    syncBusy: 'Another historical inspection is running',
    srcLive: 'Live',
    
    
    liveWaiting: 'Checking the latest block',
    livePaused: 'Checks pause when the tool is not in use',
    updateTitle: 'Finish the update',
    updateText: (v) => `The files of v${v} are in place: reload the extension to start using it.`,
    updateKeep: 'Holdings, comparisons and settings stay.',
    updateReload: 'Reload the extension',
    updateHint: 'Reload on chrome://extensions does the same.',
    liveOk: (h, age) => `Synced block ${h} · ${age}`,
    liveFail: (reason, min) => `Last check failed: ${reason}. Retrying in ${min} min`,
    liveKeep: (h) => `Pages keep using block ${h} data`,
    liveKeepNone: 'Pages keep using the bundled snapshot',
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

  /** Formula inputs and official trait units are height-bound; do not confuse a rate with accrued rewards. */
  function blockTimestamp(s) {
    const b=s?.blockTime;
    return b && b.height === s?.height && typeof b.hash === 'string' && /^[0-9a-f]{64}$/.test(b.hash) && Number.isSafeInteger(b.timestamp) && b.timestamp >= 1231006505 && b.timestamp <= 0xffffffff ? b.timestamp : null;
  }
  /** How old the block is, alone ("6 min ago"), for places that already say which block. */
  function blockAgeShort(T, s, now=Date.now()) {
    const ts=blockTimestamp(s);
    if(ts === null) return T.blockTimeUnknown;
    const delta=now-ts*1000;
    return delta < 0 ? T.blockTimeFuture : T.ago(delta);
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
  /** A moment in the viewer's local time with its UTC offset, to the minute: "2026-10-23 18:47 UTC+8". */
  function localTime(ms) {
    const d=new Date(ms),p=n=>String(n).padStart(2,'0'),off=-d.getTimezoneOffset(),h=Math.trunc(Math.abs(off)/60),m=Math.abs(off)%60;
    return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())} UTC${off<0?'−':'+'}${h}${m?':'+p(m):''}`;
  }
  function measureNote(T, snapshotHeight, s) {
    return T.beforeMeasure(s ? blockBasis(T,s) : int(snapshotHeight));
  }

  return { LANGS, DEFAULT_LANG, STORAGE_KEY, resolveLang, pick, btc, int, blockTimestamp, blockAge, blockAgeShort, blockTimeTitle, blockBasis, localTime, measureNote, ZH, EN };
});
