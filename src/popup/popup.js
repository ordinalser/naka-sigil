/**
 * 弹窗：顶部「中文 | EN」切换语言（默认英文）；「实时 / 指定区块」模式（默认实时）与最近一次检查的结果 / 失败原因；
 * 当前显示的数据与奖励启动规划；编号查询；已选比较；规则。指定区块在弹层里设置（交给后台 sw/sync-sw.js 执行）。
 * 弹窗本身不发网络请求，关掉弹窗也不会打断同步；任何同步失败都只显示原因，页面继续按已有数据工作。
 */
(() => {
  'use strict';
  const BUNDLED = globalThis.SHNAKAS_SNAPSHOT;
  const R = globalThis.ShnakasRules;
  const I = globalThis.ShnakasI18n;
  const SRC = globalThis.ShnakasSource;
  const PIXEL = globalThis.NakaPixel;
  const LOOKUP = globalThis.ShnakasLookup;
  const TIER = globalThis.ShnakasTier;
  const K = SRC.KEYS, EXP=globalThis.NakaExplore, HOLD=globalThis.NakaPortfolio;
  let holdings=[];
  const VERSION = chrome.runtime.getManifest().version;
  // Tab icons: original 9×9 pixel glyphs drawn on the same integer grid as the sigil.
  const ICONS = {
    home:    ['111101111','100101001','100101001','111101111','000000000','111101111','100101001','100101001','111101111'],
    explore: ['011110000','110011000','100001000','100001000','110011000','011111000','000001100','000000110','000000011'],
    block:   ['001111111','010000011','111111101','100000101','100000101','100000101','100000110','111111100','000000000'],
    about:   ['001111100','010000010','100010001','100000001','100010001','100010001','100010001','010000010','001111100'],
  };
  function icon(name) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'), path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    let d = ''; ICONS[name].forEach((row, y) => [...row].forEach((bit, x) => { if (bit === '1') d += `M${x} ${y}h1v1h-1z`; }));
    svg.setAttribute('viewBox', '0 0 9 9'); svg.setAttribute('shape-rendering', 'crispEdges'); svg.setAttribute('aria-hidden', 'true');
    path.setAttribute('d', d); path.setAttribute('fill', 'currentColor'); svg.append(path); return svg;
  }
  let comparisonIds=[];
  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };
  const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
  /** Estimated times are shown in the viewer's local time, to the hour: block times are ~10-minute estimates. */
  const localHour = (ms) => { const d = new Date(ms), p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:00`; };

  // 当前状态：语言、本地同步的快照、同步状态；任一变化都整体重画（弹窗内容很少，重画开销可以忽略）
  const state = {
    lang: I.DEFAULT_LANG, manual: undefined, status: undefined, localError: null,
    view: 'home', returnView: 'home', holdingsOpen: false, addKind: null, fresh: null,
    lookupRaw: null, lookupHistorical:false, lookupFocus:false, fixedPending:false, fixedRequestHeight:null, historyDialog:false, pendingLookup:null,rewardClock:null, liveEnabled: SRC.LIVE_DEFAULT, live: undefined, liveStatus: undefined, visibleAt: undefined,
  };

  function renderStatic(T) {
    document.documentElement.lang = state.lang === 'zh' ? 'zh-CN' : 'en';
    for (const b of $('langSwitch').querySelectorAll('button')) b.setAttribute('aria-pressed', String(b.dataset.lang === state.lang));
    const cc = globalThis.NakaExploreUI.pick(state.lang);
    $('title').replaceChildren(document.createTextNode(T.title), el('span', 'version', `v${VERSION}`));
    $('tagline').textContent = cc.readOnlyTag; $('tagline').title = cc.readOnlyDetail;
    // Bottom navigation: one tab per job, the current one marked.
    for (const b of $('tabbar').querySelectorAll('button[data-view]')) {
      b.querySelector('.tab-label').textContent = cc[{ home: 'navHome', explore: 'navExplore', block: 'navBlock', about: 'navAbout' }[b.dataset.view]];
      if (!b.querySelector('.tab-icon svg')) b.querySelector('.tab-icon').append(icon(b.dataset.view));
      b.setAttribute('aria-current', String(b.dataset.view === state.view));
    }
    $('compareBadge').textContent = String(comparisonIds.length); $('compareBadge').hidden = !comparisonIds.length;
    // Compare: four dots (filled = selected) and the way into the Compare page.
    $('compareTitle').textContent = cc.compare; $('compareCount').textContent = `${comparisonIds.length}/${EXP.MAX}`;
    $('comparePips').replaceChildren(...Array.from({ length: EXP.MAX }, (_, i) => el('i', i < comparisonIds.length ? 'is-on' : '')));
    $('compare').textContent = cc.compareOpen; $('compare').hidden = !comparisonIds.length;
    $('compareAdd').textContent = cc.compareAddShort; $('compareAdd').disabled = comparisonIds.length === EXP.MAX; $('compareAdd').title = comparisonIds.length === EXP.MAX ? cc.fullHere : cc.addHint;
    $('holdingsAdd').textContent = cc.listAdd; $('holdingsAdd').title = cc.addHoldingTitle;
    $('emptyTitle').textContent = cc.emptyTitle; $('emptyText').textContent = cc.emptyText; $('emptyAdd').textContent = cc.emptyAdd;
    // The two places on Ord Dropz where a whole page of Nakas can be added in one click.
    const jump = (text, href) => { const a = el('a', 'empty-jump', `${text} ↗`); a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer'; return a; };
    $('emptyOr').textContent = cc.emptyOr; $('emptyNote').textContent = cc.emptyJumpNote;
    $('emptyJumps').replaceChildren(jump(cc.vaultLink, `https://ord-dropz.xyz/secondary/collections/${BUNDLED.collection.slug}`), jump(cc.walletLink, 'https://ord-dropz.xyz/wallet'));
    $('lookupHow').textContent = cc.lookupHow;
    // About tab: the read-only promise first, then the allocation arithmetic, the weight rules and the data sources.
    const about = globalThis.NakaExploreUI.about(cc, R, VERSION);
    $('safeTitle').textContent = cc.safeTitle; $('aboutSafe').replaceChildren(...about.safe);
    $('allocTitle').textContent = cc.aboutAlloc; $('aboutAlloc').replaceChildren(...about.alloc);
    $('aboutRules').replaceChildren(...about.rules);
    $('dataTitle').textContent = cc.aboutData; $('aboutData').replaceChildren(...about.data);
    $('sigil').replaceChildren(PIXEL.sigil('pixel-sigil'));
    $('liveTitle').textContent = T.modeTitle;
    $('modeLive').textContent=T.modeLive;$('modeFixed').textContent=T.modeFixed;
    $('modeLive').setAttribute('aria-pressed',String(state.liveEnabled));$('modeFixed').setAttribute('aria-pressed',String(!state.liveEnabled));
    $('modeLive').title = T.liveHint;
    $('modeFixed').title = T.syncHint();
    $('fixedTitle').textContent=state.historyDialog?T.historyTitle:T.fixedTitle;$('fixedCancel').textContent=T.cancel;
    $('snapTitle').textContent = T.popupSnapshot;
    $('rulesTitle').textContent = cc.aboutRules;
    $('lookupTitle').textContent = T.lookupTitle;
    $('lookupBack').textContent=T.lookupBack;
    $('lookupNumber').placeholder = T.lookupPlaceholder;
    $('lookupBtn').textContent = state.lookupHistorical?T.historyCheck:T.lookupButton;
    $('syncHeight').placeholder = T.syncPlaceholder;
    $('syncHeight').setAttribute('aria-label', T.syncPlaceholder);
    $('syncBtn').textContent = state.historyDialog?T.historyConfirm:T.fixedConfirm;
    $('historyLookup').textContent=T.historyLookup;$('historyNumberLabel').textContent=T.historyNumber;
    $('historyNumberRow').hidden=!state.historyDialog;$('boundaryLabel').textContent=T.boundaryChoose;$('boundaryLabel').title=T.quarterUnconfirmed;
    if($('fixedDialog').open){$('syncHint').textContent=state.historyDialog?T.historyModeHint:T.quarterUnconfirmed;renderBoundaries(T);}
    $('syncHint').textContent = state.historyDialog?T.historyModeHint:T.quarterUnconfirmed;$('fixedHeightLabel').textContent=T.syncPlaceholder;

    $('listedNote').textContent = T.listedZero;

    $('open').textContent = T.popupOpen;
    $('open').href = `https://ord-dropz.xyz/secondary/collections/${BUNDLED.collection.slug}`;
  }

  /** 与内容脚本同一规则（SRC.choose）：显示的是页面此刻正在用的那份数据。 */
  function renderSnapshot(T) {
    const { snap, source } = SRC.choose({ liveEnabled: state.liveEnabled, live: state.live, manual: state.manual }, BUNDLED);
    const s = snap.snapshot;
    const sourceText = { live: T.srcLive, synced: T.srcSynced, bundled: T.srcBundled }[source];
    $('heightLabel').textContent = T.popupHeight;
    $('currentHeight').replaceChildren(el('span', 'sr-only', I.int(s.height)), PIXEL.digits(I.int(s.height), 'pixel-height'));
    $('currentHeight').setAttribute('aria-label', I.int(s.height));
    $('snapSource').textContent = sourceText; $('snapSource').hidden = source !== 'bundled'; // Live / Fixed are already shown by the mode switch; only bundled data adds information.
    // Reward start is planning context for the selected block: remaining blocks plus a header-time date.
    const phase=R.rewardPhase(s);
    const date=phase.eta===null?T.launchUnknown:T.launchDate(localHour(phase.eta));
    const cycle=phase.state==='before'?{label:source==='live'?T.launchStat:T.launchStatAtBlock,value:I.int(phase.remaining),pixels:true,unit:T.blocksUnit,sub:date}
      :phase.state==='boundary'?{label:source==='live'?T.firstRewardBlock:T.firstRewardAtBlock,value:'1',pixels:true,unit:T.blocksUnit,sub:T.nextBoundary(I.int(phase.next))}
      :phase.state==='active'?{label:source==='live'?T.weekRemaining:T.weekRemainingAtBlock,value:I.int(phase.remaining),pixels:true,unit:T.blocksUnit,sub:T.rewardWeek(phase.week,R.RULES.weeks)}
      :{label:phase.state==='closed'?T.rewardClosed:T.completedWeeks,value:phase.state==='closed'?'—':I.int(R.RULES.weeks),pixels:phase.state!=='closed',unit:phase.state==='closed'?null:T.weeksUnit,sub:T.claimLimit(I.int(phase.claimUntil))};
    const stats=[{label:T.popupFloor,value:I.btc(s.collectionFloor),pixels:true,unit:'BTC',sub:null},{label:T.popupListings,value:I.int(s.listings),pixels:true,unit:null,sub:null},cycle];
    const rows = stats.map(({ label, value, pixels, unit, sub }) => {
      const row = el('div', 'row'), dd = el('dd');
      if (pixels) dd.append(el('span', 'sr-only', value), PIXEL.digits(value, 'stat-pixels'));
      else dd.textContent = value;
      if (unit !== null) dd.append(el('span', 'stat-unit', unit));
      row.append(el('dt', '', label), dd);
      if (sub !== null) row.append(el('dd', 'stat-sub', sub));
      return row;
    });
    rows[2].title = [...globalThis.NakaPurchase.renderLaunch(s,T,I).children].map(n=>n.textContent).join('\n');
    $('snap').replaceChildren(...rows);
    $('snap').dataset.source = source;
    $('blockAge').textContent = I.blockAge(T,s);
    $('blockAge').title = I.blockTimeTitle(T,s);
    const note = I.measureNote(T, s.height);
    $('measureNote').textContent = T.inspectProvisional;
    $('measureNote').title = note ?? ''; 
    $('measureNote').hidden = note === null;
    // Block tab, below the block card: what one unit of weight is worth at this block, and where the reward period
    // stands. Neither repeats the countdown above.
    const cc = globalThis.NakaExploreUI.pick(state.lang), U = globalThis.NakaExploreUI, W = R.RULES, K = R.programmeUnits(snap);
    $('allocTitleBlock').textContent = cc.allocTitleBlock;
    const stat = (label, value, unit, cls) => { const row = el('div', cls ? `row ${cls}` : 'row'), dd = el('dd'); dd.append(el('span', 'sr-only', value), PIXEL.digits(value, 'stat-pixels')); if (unit) dd.append(el('span', 'stat-unit', unit)); row.append(el('dt', '', label), dd); return row; };
    const kText = K.lo === K.hi ? I.int(K.lo) : `${I.int(K.lo)}–${I.int(K.hi)}`;
    $('allocStats').replaceChildren(stat(cc.perFull, U.shn(R.weeklyAllocation({ lo: 4, hi: 4 }, K)), 'SHNAKAS', 'is-key'), stat(cc.perCap, U.shn(R.weeklyAllocation({ lo: 16, hi: 16 }, K)), 'SHNAKAS'),
      stat(cc.unitsK, kText), stat(cc.poolWeek, I.int(W.poolPerWeek), 'SHNAKAS'));
    const rate = K.lo === K.hi ? I.int(R.unitRate(K.lo)) : `${I.int(R.unitRate(K.hi))}–${I.int(R.unitRate(K.lo))}`;
    $('allocNote').textContent = `v = ${rate}`; $('allocNote').title = cc.allocNote(rate);
    $('scheduleTitle').textContent = cc.scheduleTitle;
    const done = phase.state === 'active' ? phase.week - 1 : ['ended', 'closed'].includes(phase.state) ? W.weeks : 0;
    $('weekBar').firstElementChild.style.width = `${(phase.state === 'active' ? (s.height - W.startBlock) / (W.weeks * W.weekBlocks) : done / W.weeks) * 100}%`;
    const range = (a, b) => `${I.int(a)} – ${I.int(b)}`;
    const current = phase.state === 'active' ? [cc.scheduleWeekN(`${phase.week}/${W.weeks}`), range(phase.first, phase.last)] : [cc.scheduleWeekN(1), range(W.startBlock + 1, W.startBlock + W.weekBlocks)];
    $('weeksDone').textContent = `${cc.progressLabel} ${cc.weeksDone(done, W.weeks)}`;
    $('schedule').replaceChildren(...[current, [cc.scheduleEndBlock, I.int(phase.end)], [cc.scheduleClaim, I.int(phase.claimUntil)]]
      .map(([k, v]) => { const row = el('div', 'schedule-row'); row.append(el('dt', '', k), el('dd', '', v)); return row; }));
    const now = phase.state === 'active' ? T.rewardWeek(phase.week, W.weeks) : phase.state === 'boundary' ? T.firstRewardAtBlock : phase.state === 'closed' ? T.rewardClosed : T.completedWeeks;
    // Home: one quiet line says which block the figures use and how fresh it is; it opens the Block tab.
    const kind = $('liveState').className.match(/live-state--(\w+)/)?.[1] ?? 'muted', strip = $('statusStrip');
    const ts = I.blockTimestamp(s), age = ts === null ? T.blockTimeUnknown : Date.now() < ts * 1000 ? T.blockTimeFuture : T.ago(Date.now() - ts * 1000);
    const lead = el('span', 'strip-lead'); lead.append(el('i', `strip-dot strip-dot--${kind}`), el('b', '', state.liveEnabled ? T.modeLive : T.modeFixed), el('span', '', cc.blockChip(I.int(s.height))), el('span', 'strip-age', age));
    strip.replaceChildren(lead, el('span', 'strip-next', `${phase.state === 'before' ? cc.stripStart(I.int(phase.remaining)) : now} ›`));
    strip.title = $('liveState').title;
    return snap;
  }

  /** 实时同步：开关状态、最近一次检查结果；失败时说明原因、多久后重试、页面正在用哪份数据，并给出技术细节。 */
  function renderLive(T) {
    const st = SRC.statusOf(state.liveStatus, 'live');
    const now = Date.now();
    const live = SRC.compatibleSnapshot(state.live, BUNDLED) ? state.live : undefined;
    const dataLine = live === undefined ? null : T.liveOk(I.int(live.snapshot.height), I.blockAge(T,live.snapshot,now));
    const visible = state.visibleAt !== undefined && now - state.visibleAt <= SRC.VISIBLE_MS;
    // label: the short line beside the mode buttons; tip: the full explanation on hover.
    let kind, label, tip;
    if (!state.liveEnabled) { kind = 'muted'; label = T.fixedWatching; tip = T.liveOff; }
    else if (st !== undefined && st.state === 'error') {
      kind = 'error';
      label = T.liveFail(T.failReason[st.kind] + (st.status === null ? '' : T.httpCode(st.status)), st.waitMin);
      tip = [label, live === undefined ? T.liveKeepNone : T.liveKeep(I.int(live.snapshot.height)), st.message].join('\n');
    } else if (dataLine === null) { kind = 'muted'; label = visible ? T.liveWaiting : T.livePaused; tip = label; }
    else { kind = visible ? 'ok' : 'muted'; label = T.liveWatching; tip = visible ? dataLine : `${T.livePaused} · ${dataLine}`; }
    const box = $('liveState');
    box.textContent = label;
    box.title = tip;
    box.className = `live-state live-state--${kind}`;
    box.dataset.state = !state.liveEnabled ? 'off' : st === undefined ? 'none' : st.state;
  }

  function showStatus(kind, text) {
    const box = $('syncStatus');
    box.replaceChildren(...(kind === 'running' ? [el('span', 'spinner')] : []), el('span', '', text));
    box.className = `footnote status status--${kind}`;
    box.dataset.state = kind;
    box.title = '';
    box.hidden = false;
  }

  function renderStatus(T) {
    if(!$('fixedDialog').open){$('syncStatus').hidden=true;return;}
    const st = SRC.statusOf(state.status, 'manual');
    const running = state.fixedPending;$('fixedCancel').disabled=running;
    // Fixed-block loading progress stays in its dialog; it never relabels the mode line.
    $('syncBtn').disabled = running;
    $('syncHeight').disabled = running;$('historyNumber').disabled=running;$('rewardBoundary').disabled=running;
    if (state.localError !== null) { showStatus('error', T[state.localError]); return; }
    if (!state.fixedPending && state.localError===null && (!st || st.state!=='error')) { $('syncStatus').hidden = true; return; }
    if (st.state === 'running') showStatus('running', st.stage === 'meta' ? T.syncMeta(st.done, st.total) : T.syncStage[st.stage]);
    else if (st.state === 'done') showStatus('done', T.syncDone(I.int(st.height)));
    else if (st.state === 'error') { showStatus('error', T.syncError(T.failReason[st.kind] || T.failReason.data)); $('syncStatus').title = st.message; }
    else if (st.state === 'interrupted') showStatus('interrupted', T.syncInterrupted);
    else throw new Error(`未知的同步状态：${st.state}`);
  }

  function timedBasis(T,snap) { const n=el('p','lookup-basis lookup-basis--time',T.lookupBasis(I.blockBasis(T,snap.snapshot))); n.title=I.blockTimeTitle(T,snap.snapshot); return n; }
  function renderLookupContext(T,snap) {
    for(const basis of $('lookupResult').querySelectorAll('.naka-purchase__basis')) {
      basis.replaceChildren(el('span','lookup-height',T.snapBlock(I.int(snap.snapshot.height))),el('span','lookup-time',I.blockAge(T,snap.snapshot)));
      basis.title=I.blockTimeTitle(T,snap.snapshot);
    }
    for(const chip of $('lookupResult').querySelectorAll('.lookup-mode')) {
      chip.textContent=state.liveEnabled?T.modeLive:T.modeFixed;
      chip.setAttribute('aria-label',`${T.modeTitle}: ${chip.textContent}`);
      chip.title=T.historyLookup+' · '+$('liveState').title;
      chip.dataset.state=$('liveState').dataset.state;
    }
  }
  let lookupRendered = null;
  function renderLookup(T, snap) {
    document.body.classList.toggle('has-lookup',state.lookupFocus);$('lookupBack').hidden=!state.lookupFocus;
    if (lookupRendered?.snap === snap && lookupRendered.raw === state.lookupRaw && lookupRendered.lang === state.lang && lookupRendered.historical===state.lookupHistorical) {
      for(const n of $('lookupResult').querySelectorAll('.lookup-basis--time')) { n.textContent=T.lookupBasis(I.blockBasis(T,snap.snapshot)); n.title=I.blockTimeTitle(T,snap.snapshot); }
      return;
    }
    lookupRendered = {snap, raw:state.lookupRaw, lang:state.lang,historical:state.lookupHistorical};
    const box = $('lookupResult');
    box.replaceChildren(); box.hidden = state.lookupRaw === null;
    $('lookupActions').hidden = true; // shown again only for a found NFT
    $('lookupNumber').removeAttribute('aria-invalid');
    if (box.hidden) return;
    const found = LOOKUP.query(snap, state.lookupRaw);
    box.dataset.state = found.state;
    box.dataset.height = String(found.height);
    if (found.state === 'invalid') {
      $('lookupNumber').setAttribute('aria-invalid','true');
      box.append(el('p','lookup-message lookup-message--error',T.lookupInvalid)); return;
    }
    if (found.state === 'missing') {
      box.append(el('p','lookup-message',T.lookupMissing(found.number)),timedBasis(T,snap)); return;
    }
    const r=found.result, card=el('article','lookup-card');
    card.dataset.number=String(found.number); card.dataset.id=found.id;
    const head=el('div','lookup-head'), link=el('a','lookup-link',T.lookupView);
    link.href=`https://ord-dropz.xyz/secondary/item/${found.id}?collection=${snap.collection.slug}`;
    link.target='_blank'; link.rel='noopener noreferrer';
    // The action follows the full result, in the same layout flow as its evidence.
    $('lookupCompare').dataset.id=found.id;$('lookupHolding').dataset.id=found.id;$('lookupActions').hidden=false;
    head.append(el('strong','',`Shielded #${found.number}`),link);
    const rank=globalThis.NakaPurchase.numberBadge(found.number,T);if(rank)head.insertBefore(rank,link);
    const model=globalThis.NakaPurchase.create(snap),scenario=model.get(found.id);
    card.dataset.listing=found.listing;card.dataset.queryPurpose=state.lookupHistorical?'block':'purchase';
    const notice=scenario.state==='no-floor'?T.buyNoFloor:null;
    card.append(head,!state.lookupHistorical&&scenario.state==='ready'?globalThis.NakaPurchase.render(model,found.id,T,I):globalThis.NakaPurchase.renderCurrent(r,snap.snapshot,T,I,{notice:state.lookupHistorical?null:notice,rewardContext:R.rewardContext(snap,found.id,found.listing),listing:found.listing,credits:globalThis.NakaPurchase.relayCredits(snap,found.id)}));
    const purchase=card.querySelector('.naka-purchase'),context=el('div','lookup-context');
    const mode=el('button','lookup-mode');mode.type='button';mode.addEventListener('click',()=>openFixedDialog(true));
    context.append(purchase.querySelector('.naka-purchase__basis'),mode);
    purchase.prepend(context);
    // My holdings: a listed NFT shows what buying it does; one of my listed holdings shows what delisting does.
    if(holdings.length&&found.listing==='listed'){const held=holdings.includes(found.id),x=HOLD.impact(snap,holdings,found.id,held?'cancel':'sale');if(x.state==='ready')card.append(globalThis.NakaExploreUI.holdingsLine(x,globalThis.NakaExploreUI.pick(state.lang)));}
    box.append(card);
  }

  /** Home: the weekly SHNAKAS figure is the one hero number; every holding follows as a tile with its number, weight
   * (as the official endpoint reports it) and weekly SHNAKAS (0 while listed). Without holdings, a centred first-run
   * prompt takes the whole view. Adding a number uses a small dialog. */
  const TILE_COLUMNS = 4, TILE_ROWS = 3;
  let holdingsKey = '';
  function renderHoldings(snap) {
    const c = globalThis.NakaExploreUI.pick(state.lang), U = globalThis.NakaExploreUI, own = HOLD.current(snap, holdings);
    const key = `${state.lang}|${snap.snapshot.height}|${snap.snapshot.generatedAt}|${own.ids.join()}|${state.holdingsOpen}|${state.fresh ? [...state.fresh].join() : ''}`;
    if (key === holdingsKey) return;
    holdingsKey = key;
    const empty = !own.ids.length;
    document.querySelector('.holdings-hero').hidden = empty; $('holdingsList').hidden = empty; $('holdingsEmpty').hidden = !empty;
    // First run previews the result: the weekly figure at zero and four empty tiles, then the ways to fill them.
    if (empty) { const zero = el('span', 'hc-value'); zero.append(PIXEL.digits('0.00', 'hc-pixels'), el('span', 'hc-unit', c.weekUnit)); $('emptyFigure').replaceChildren(zero); return; }
    $('holdingsTitle').textContent = c.holdings; $('tilesTitle').textContent = c.tilesTitle(own.ids.length);
    $('holdingsManage').textContent = c.manage; $('holdingsManage').title = c.openHoldings;
    $('raiseOpen').textContent = c.raiseLink; $('raiseOpen').title = c.raiseHint;
    const a = own.allocation, value = U.shn(a.weekly), figure = el('span', 'hc-value');
    figure.append(el('span', 'sr-only', value), PIXEL.digits(value, 'hc-pixels'), el('span', 'hc-unit', c.weekUnit));
    $('holdingsFigure').replaceChildren(figure, el('span', 'hc-share', [c.sharePool(U.percent(a.share)), ...(own.listed ? [c.listedCount(own.listed)] : [])].join(' · ')));
    $('holdingsFigure').title = c.allocationBasis;
    const cancel = globalThis.NakaPurchase.create(snap, { action: 'cancel' }), limit = TILE_ROWS * TILE_COLUMNS, folded = !state.holdingsOpen && own.ids.length > limit;
    $('holdingsTiles').replaceChildren(...(folded ? own.ids.slice(0, limit) : own.ids).map((id) => {
      const number = snap.items[id][0], listed = globalThis.NakaPurchase.listingStatus(snap, id) === 'listed', r = R.evaluateSnapshot(snap, id);
      const weekly = listed ? null : R.weeklyAllocation(R.units(r), a.all);
      let delist = '';
      if (listed) { const x = HOLD.impact(snap, holdings, id, 'cancel', cancel); if (x.state === 'ready') delist = `\n${c.afterDelist}: ${R.formatWeight(x.scenario.result)} · ${c.perWeek(U.shn(x.allocation.piece))}`; }
      const tile = el('button', 'hc-tile'); tile.type = 'button'; tile.dataset.id = id;
      if (listed) tile.classList.add('is-listed'); if (state.fresh?.has(id)) tile.classList.add('is-new');
      tile.title = `#${number} · ${R.formatWeight(r)} · ${listed ? c.listedNoEarn : c.perWeek(U.shn(weekly))}${delist}\n${c.tileHint(number)}`;
      const art = el('span', 'hc-art'); art.append(globalThis.NakaExploreUI.art(snap, id, 'hc-fallback'));
      if (listed) art.append(el('span', 'hc-tag', c.listedTag));
      const caption = el('span', 'hc-caption');
      caption.append(el('span', 'hc-number', `#${number}`), el('span', `hc-weight naka-tone-${TIER.tierOf(r)}`, R.formatWeight(r)), el('b', listed ? 'hc-earn hc-earn--listed' : 'hc-earn', listed ? c.earnListed : U.shn(weekly)));
      tile.append(art, caption);
      tile.addEventListener('click', () => { $('lookupNumber').value = String(number); showLookup(String(number)); });
      return tile;
    }));
    $('holdingsMore').hidden = own.ids.length <= limit;
    $('holdingsMore').textContent = state.holdingsOpen ? c.collapse : c.expandAll(own.ids.length);
    $('holdingsMore').setAttribute('aria-expanded', String(state.holdingsOpen));
  }
  /** Compare inside the popup: each selected Naka with its after-sale weight, ask and what it does for my holdings.
   * Four slots stay visible so an empty or partial selection still reads as a complete layout. */
  function renderCompareList(snap) {
    const c = globalThis.NakaExploreUI.pick(state.lang), U = globalThis.NakaExploreUI, model = globalThis.NakaPurchase.create(snap), list = $('compareList');
    const rows = comparisonIds.map((id) => {
      const e = EXP.entry(snap, model, id), row = el('div', 'compare-row');
      if (!e) { row.append(el('span', 'compare-missing', c.missing)); return row; }
      const open = el('button', 'compare-main'); open.type = 'button'; open.title = c.tileHint(e.number);
      open.addEventListener('click', () => { $('lookupNumber').value = String(e.number); showLookup(String(e.number)); });
      const info = el('span', 'compare-info');
      info.append(el('strong', '', `#${e.number}`), el('small', '', e.listing === 'listed' ? `${c.ask.split(' · ')[0]} ${I.btc(e.sale.price)} BTC` : c[e.listing]));
      if (holdings.length && e.listing === 'listed' && !holdings.includes(id)) { const x = HOLD.impact(snap, holdings, id, 'sale', model); if (x.state === 'ready') { const g = el('small', 'compare-gain', c.forMeShort(U.shn(x.allocation.delta, true))); g.dataset.change = x.allocation.delta.lo > 0 ? 'up' : x.allocation.delta.hi < 0 ? 'down' : 'same'; info.append(g); } }
      const weight = el('span', 'compare-weight'); weight.append(el('small', '', e.listing === 'listed' ? c.after : c.holding)); const value = el('span'); globalThis.NakaPurchase.decorateWeight(value, e.result, true); weight.append(value);
      const art = el('span', 'compare-art'); art.append(globalThis.NakaExploreUI.art(snap, id, 'hc-fallback'));
      open.append(art, info, weight);
      const remove = el('button', 'compare-remove', '×'); remove.type = 'button'; remove.setAttribute('aria-label', `${c.remove} #${e.number}`); remove.title = c.remove;
      remove.addEventListener('click', async () => { const res = await chrome.runtime.sendMessage({ type: 'shn-compare', action: 'toggle', id }); if (res?.ok) { comparisonIds = res.ids; render(); } });
      row.append(open, remove);
      return row;
    });
    // Empty: one calm panel that is itself the add button. Partial: the rows, then a single slot for the rest.
    const slot = el('button', comparisonIds.length ? 'compare-slot' : 'compare-slot compare-slot--empty'); slot.type = 'button'; slot.title = c.addCompareTitle;
    slot.addEventListener('click', () => openAdd('compare'));
    if (!comparisonIds.length) { slot.append(el('span', 'slot-plus', '+'), el('strong', '', c.compareEmptyPopup), el('span', 'hc-how', c.compareHowPopup)); list.replaceChildren(slot); }
    else list.replaceChildren(...rows, ...(comparisonIds.length < EXP.MAX ? [Object.assign(slot, { textContent: c.compareSlotsLeft(EXP.MAX - comparisonIds.length) })] : []));
  }
  function setView(view) {
    state.view = view; state.lookupFocus = false; state.lookupRaw = null; state.lookupHistorical = false;
    render(); document.querySelector('.popup-scroll').scrollTop = 0;
  }
  /** Inline "#number" forms: add to My holdings, or to Compare, without leaving the current tab. */
  /** Add one or more comma-separated numbers. Returns { added, message }: message explains skipped entries (or why
   * nothing was added); the dialog stays open with it, and closes when everything went in. */
  async function addHolding(raw) {
    const c = globalThis.NakaExploreUI.pick(state.lang), snap = SRC.choose({ liveEnabled: state.liveEnabled, live: state.live, manual: state.manual }, BUNDLED).snap;
    const { ids, skipped, empty } = globalThis.NakaExploreUI.resolveNumbers(snap, raw, holdings, c, c.skipHeld);
    if (empty) return { added: 0, message: c.invalid };
    if (ids.length) {
      const res = await chrome.runtime.sendMessage({ type: 'shn-holdings', ids });
      if (!res?.ok) return { added: 0, message: c.addError };
      holdings = res.ids; state.fresh = new Set(ids); render();
      setTimeout(() => { state.fresh = null; for (const id of ids) document.querySelector(`.hc-tile[data-id="${id}"]`)?.classList.remove('is-new'); }, 1100);
    }
    return { added: ids.length, message: skipped.length ? c.addedSkipped(ids.length, skipped) : null };
  }
  async function addCompare(raw) {
    const c = globalThis.NakaExploreUI.pick(state.lang), snap = SRC.choose({ liveEnabled: state.liveEnabled, live: state.live, manual: state.manual }, BUNDLED).snap;
    const { ids, skipped, empty } = globalThis.NakaExploreUI.resolveNumbers(snap, raw, comparisonIds, c, c.skipCompared);
    if (empty) return { added: 0, message: c.invalid };
    let added = 0;
    for (const id of ids) {
      if (comparisonIds.length === EXP.MAX) { skipped.push(c.skipFull(snap.items[id][0])); continue; }
      const res = await chrome.runtime.sendMessage({ type: 'shn-compare', action: 'toggle', id });
      if (!res?.ok) return { added, message: c.addError };
      comparisonIds = res.ids; added++;
    }
    render();
    return { added, message: skipped.length ? c.addedSkipped(added, skipped) : null };
  }
  /** One small dialog takes a Shielded number for My holdings or for Compare; the page underneath does not move. */
  function openAdd(kind) {
    const c = globalThis.NakaExploreUI.pick(state.lang);
    state.addKind = kind;
    $('addTitle').textContent = kind === 'holding' ? c.addHoldingTitle : c.addCompareTitle;
    $('addSubmit').textContent = kind === 'holding' ? c.confirmAdd : c.add.replace('＋ ', '');
    $('addCancel').textContent = c.cancel; $('addInput').placeholder = c.numberPromptMulti; $('addHint').textContent = c.multiHint; $('addInput').value = '';
    $('addInput').removeAttribute('aria-invalid'); $('addError').textContent = '';
    $('addDialog').showModal(); $('addInput').focus();
  }

  /** Toggle the queried NFT in My holdings; the label follows the stored list. */
  function paintLookupHolding(button) {
    const c = globalThis.NakaExploreUI.pick(state.lang), held = holdings.includes(button.dataset.id);
    button.textContent = held ? c.inHoldings : c.addHolding;button.title = held ? c.holdingRemoveHint : c.holdingHint;
    button.setAttribute('aria-pressed', String(held));button.disabled = false;
  }
  /** Add, remove (when selected) or explain a full selection, repainted in place so focus and pointer state survive. */
  function paintLookupCompare(button) {
    const st = EXP.compareState(comparisonIds, button.dataset.id);
    if (button.dataset.compare === st && button.dataset.lang === state.lang) return;
    globalThis.NakaExploreUI.paintCompare(button, st, globalThis.NakaExploreUI.pick(state.lang));
    button.dataset.lang = state.lang;
  }

  function render() {
    const T = I.pick(state.lang);
    renderStatic(T);
    renderLive(T);
    const snap = renderSnapshot(T);
    renderLookup(T, snap);
    renderLookupContext(T,snap);
    if (!$('lookupActions').hidden) { paintLookupCompare($('lookupCompare')); paintLookupHolding($('lookupHolding')); }
    renderHoldings(snap);
    renderCompareList(snap);
    for (const view of ['home', 'explore', 'block', 'about']) $('view' + view[0].toUpperCase() + view.slice(1)).hidden = !(state.lookupFocus ? view === 'explore' : view === state.view);
    document.body.dataset.view = state.lookupFocus ? 'detail' : state.view;
    renderStatus(T);
  }

  Promise.all([
    chrome.storage.local.get([K.manual, K.live, K.liveEnabled, K.liveStatus, 'syncStatus', I.STORAGE_KEY, EXP.KEY, HOLD.KEY]),
    chrome.storage.session.get(SRC.SESSION_VISIBLE),
  ]).then(([got, ses]) => {
    comparisonIds=EXP.normalize(got[EXP.KEY]);holdings=HOLD.normalize(got[HOLD.KEY]);
    state.lang = I.resolveLang(got[I.STORAGE_KEY]);
    state.manual = got[K.manual];
    if(SRC.compatibleSnapshot(state.manual,BUNDLED))$('syncHeight').value=String(state.manual.snapshot.height);
    state.live = got[K.live];
    state.liveEnabled = SRC.resolveLive(got[K.liveEnabled]);
    state.liveStatus = got[K.liveStatus];
    state.status = got.syncStatus;
    state.visibleAt = ses[SRC.SESSION_VISIBLE];
    render();
    setInterval(render, 15000); // 刷新「几分钟前」与暂停状态
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'session') {
      if (has(changes, SRC.SESSION_VISIBLE)) { state.visibleAt = changes[SRC.SESSION_VISIBLE].newValue; render(); }
      return;
    }
    if (area !== 'local') return;
    if(has(changes,EXP.KEY)) comparisonIds=EXP.normalize(changes[EXP.KEY].newValue);
    if(has(changes,HOLD.KEY)) holdings=HOLD.normalize(changes[HOLD.KEY].newValue);
    if (has(changes, I.STORAGE_KEY)) state.lang = I.resolveLang(changes[I.STORAGE_KEY].newValue);
    if (has(changes, K.manual)) state.manual = changes[K.manual].newValue;
    if (has(changes, K.live)) state.live = changes[K.live].newValue;
    if (has(changes, K.liveEnabled)) state.liveEnabled = SRC.resolveLive(changes[K.liveEnabled].newValue);
    if (has(changes, K.liveStatus)) state.liveStatus = changes[K.liveStatus].newValue;
    if (has(changes, 'syncStatus')) { state.status = changes.syncStatus.newValue; state.localError = null;if(state.fixedPending&&['done','error','interrupted'].includes(state.status?.state)&&(state.status.state!=='done'||state.status.height===state.fixedRequestHeight)){state.fixedPending=false;if(state.status.state==='done'){if(state.pendingLookup!==null){state.lookupHistorical=state.historyDialog;state.lookupRaw=String(state.pendingLookup);$('lookupNumber').value=state.lookupRaw;state.lookupFocus=true;}state.pendingLookup=null;$('fixedDialog').close();if(state.lookupRaw===null)$('modeFixed').focus();else $('lookupNumber').focus();}else state.pendingLookup=null;} }
    render();
  });

  $('compare').addEventListener('click',()=>chrome.runtime.sendMessage({type:'shn-open-compare',section:'compare'}));
  $('holdingsManage').addEventListener('click',()=>chrome.runtime.sendMessage({type:'shn-open-compare',section:'holdings'}));
  $('holdingsMore').addEventListener('click',()=>{state.holdingsOpen=!state.holdingsOpen;render();});
  $('tabbar').addEventListener('click',(e)=>{const b=e.target instanceof Element?e.target.closest('button[data-view]'):null;if(b)setView(b.dataset.view);});
  $('raiseOpen').addEventListener('click',()=>chrome.runtime.sendMessage({type:'shn-open-compare',section:'boost'}));
  for(const button of [$('holdingsAdd'),$('emptyAdd')])button.addEventListener('click',()=>openAdd('holding'));
  $('addForm').addEventListener('submit',async(e)=>{e.preventDefault();const out=await(state.addKind==='holding'?addHolding:addCompare)($('addInput').value);if(!out.message){$('addDialog').close();return;}$('addError').textContent=out.message;if(out.added){$('addInput').value='';$('addInput').removeAttribute('aria-invalid');}else{$('addInput').setAttribute('aria-invalid','true');$('addInput').select();}});
  $('addCancel').addEventListener('click',()=>$('addDialog').close());
  $('statusStrip').addEventListener('click',()=>setView('block'));
  $('compareAdd').addEventListener('click',()=>openAdd('compare'));
  $('lookupHolding').addEventListener('click', async () => {
    const button = $('lookupHolding'), c = globalThis.NakaExploreUI.pick(state.lang), held = holdings.includes(button.dataset.id);
    button.disabled = true;
    try { const res = await chrome.runtime.sendMessage({ type: 'shn-holdings', ids: [button.dataset.id], remove: held }); if (!res?.ok) throw Error('save'); holdings = res.ids; render(); }
    catch { button.textContent = c.addError; button.disabled = false; }
  });
  $('lookupCompare').addEventListener('click', async () => {
    const button = $('lookupCompare'), c = globalThis.NakaExploreUI.pick(state.lang);
    if (button.dataset.compare === 'full') { chrome.runtime.sendMessage({ type: 'shn-open-compare', section: 'compare' }); return; }
    button.disabled = true;
    try {
      const res = await chrome.runtime.sendMessage({ type: 'shn-compare', action: 'toggle', id: button.dataset.id }); if (!res?.ok) throw Error('save');
      comparisonIds = res.ids; render();
      if (res.state === 'missing') { button.textContent = c.missing; delete button.dataset.compare; }
    } catch { button.textContent = c.addError; button.disabled = false; delete button.dataset.compare; }
  });

  $('modeLive').addEventListener('click',async()=>{state.liveEnabled=true;state.localError=null;render();await chrome.storage.local.set({[K.liveEnabled]:true});beat();});
  let boundaryKey='';
  function renderBoundaries(T){
    const valid=[state.live,state.manual,BUNDLED].filter(s=>SRC.compatibleSnapshot(s,BUNDLED));
    const tip=state.rewardClock?.height??Math.max(...valid.map(s=>s.snapshot.indexerHeight)),clock=state.rewardClock??valid.filter(s=>I.blockTimestamp(s.snapshot)!==null).sort((a,b)=>b.snapshot.height-a.snapshot.height)[0]?.snapshot;
    $('boundaryClock').textContent=T.boundaryReference(I.int(tip));
    const key=`${state.lang}|${tip}|${clock?.height}|${I.blockTimestamp(clock??{})}|${Math.floor(Date.now()/60000)}`;if(key===boundaryKey)return;boundaryKey=key;
    const select=$('rewardBoundary'),value=select.value,placeholder=el('option','',T.boundaryChoose);placeholder.value='';
    const past=el('optgroup',''),future=el('optgroup','');past.label=T.boundaryPast;future.label=T.boundaryFuture;
    const points=R.rewardBoundaries();
    for(const b of [...points.filter(b=>b.height<=tip).sort((a,b)=>b.height-a.height),...points.filter(b=>b.height>tip)]){
      const label=b.kind==='launch'?T.boundaryLaunch:T.boundaryWeek(b.week),o=el('option','',`${label} · ${I.int(b.height)}`);o.value=String(b.height);
      if(b.height>tip){o.disabled=true;const ts=I.blockTimestamp(clock??{}),time=ts===null?null:(ts+(b.height-clock.height)*600)*1000,eta=time===null||time<Date.now()?T.launchUnknown:T.launchDate(localHour(time));o.textContent+=` · ${T.boundaryDistance(I.int(b.height-tip),eta)}`;future.append(o);}else past.append(o);
    }
    select.replaceChildren(placeholder,past,future);select.title=T.quarterUnconfirmed;select.value=value;
  }
  function openFixedDialog(history=false){state.localError=null;state.status=undefined;state.historyDialog=history;state.pendingLookup=null;const selected=SRC.choose({liveEnabled:state.liveEnabled,live:state.live,manual:state.manual},BUNDLED).snap;$('syncHeight').value=String(selected.snapshot.height);$('historyNumber').value=$('lookupNumber').value;boundaryKey='';$('fixedDialog').showModal();render();$('syncHeight').focus();$('syncHeight').select();chrome.runtime.sendMessage({type:'shn-reward-clock'}).then(c=>{if(c?.ok&&Number.isSafeInteger(c.height)&&c.height>=0){state.rewardClock=c;boundaryKey='';if($('fixedDialog').open)renderBoundaries(I.pick(state.lang));}}).catch(()=>{});}
  $('modeFixed').addEventListener('click',()=>openFixedDialog());
  $('historyLookup').addEventListener('click',()=>openFixedDialog(true));
  $('rewardBoundary').addEventListener('change',()=>{if($('rewardBoundary').value)$('syncHeight').value=$('rewardBoundary').value;});
  $('fixedCancel').addEventListener('click',()=>{if(!state.fixedPending){state.pendingLookup=null;$('fixedDialog').close();$('modeFixed').focus();}});
  $('fixedDialog').addEventListener('cancel',e=>{if(state.fixedPending)e.preventDefault();});

  function beat(){if(document.visibilityState==='visible'&&chrome.runtime.id)chrome.runtime.sendMessage({type:'shn-visible'}).catch(()=>{});}
  beat();setInterval(beat,SRC.HEARTBEAT_MS);document.addEventListener('visibilitychange',beat);

  $('langSwitch').addEventListener('click', (e) => {
    const b = e.target instanceof Element ? e.target.closest('button[data-lang]') : null;
    if (b && b.dataset.lang !== state.lang) chrome.storage.local.set({ [I.STORAGE_KEY]: b.dataset.lang });
  });

  function showLookup(raw) {
    if (!state.lookupFocus) state.returnView = state.view;
    state.lookupFocus = true;
    state.lookupRaw = raw;
    render(); document.querySelector('.popup-scroll').scrollTop = 0;
  }
  $('lookupForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const raw = $('lookupNumber').value, number = LOOKUP.parseNumber(raw);
    if (number !== null) $('lookupNumber').value = String(number);
    showLookup(number === null ? raw : String(number));
  });
  $('lookupBack').addEventListener('click',()=>{state.lookupFocus=false;state.lookupHistorical=false;state.lookupRaw=null;$('lookupNumber').value='';state.view=state.returnView;render();});
  $('lookupNumber').addEventListener('input', () => {
    state.lookupRaw=null;
    renderLookup(I.pick(state.lang),SRC.choose({liveEnabled:state.liveEnabled,live:state.live,manual:state.manual},BUNDLED).snap);
  });

  $('syncForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const raw = $('syncHeight').value.trim();
    if (raw === '') {state.localError='fixedRequired';render();return;}
    if (!/^\d+$/.test(raw)) { state.localError = 'syncBadHeight'; render(); return; }
    if(!Number.isSafeInteger(Number(raw))){state.localError='syncBadHeight';render();return;}
    if(state.historyDialog){const n=LOOKUP.parseNumber($('historyNumber').value);if(n===null){state.localError='lookupInvalid';render();return;}state.pendingLookup=n;}
    state.fixedRequestHeight=Number(raw);state.fixedPending=true;state.status={state:'running',stage:'state'};state.localError=null;render();
    let res;try{res=await chrome.runtime.sendMessage({ type: 'shn-set-fixed', height: Number(raw) });}catch{res={ok:false,error:'busy'};}
    if (res.ok) return;
    state.fixedPending=false;state.pendingLookup=null; // 进度由 syncStatus 的存储变化驱动
    if (res.error === 'busy') state.localError = 'syncBusy';
    else if (res.error === 'live-mode') state.localError='fixedRequired';
    else if (res.error === 'bad-height') state.localError = 'syncBadHeight';
    else throw new Error(`后台返回了未知错误：${res.error}`);
    render();
  });

})();
