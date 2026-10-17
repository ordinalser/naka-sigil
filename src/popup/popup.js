/**
 * 弹窗：顶部「中文 | EN」切换语言（默认英文）与查询按钮；底部四个分页：持仓、区块（实时数据与最近一次检查的结果 /
 * 失败原因、奖励时间表）、增加权重（结论与去独立页的入口）、说明。查询是盖在中间区域上的一层：编号查询（也可按历史区块
 * 一次性查询，交给后台 sw/sync-sw.js 执行）与已选比较；顶栏、底部分页和下面的分页都不动，左上角返回。
 * 弹窗本身不发网络请求，关掉弹窗也不会打断检查；任何检查失败都只显示原因，页面继续按已有数据工作。
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
  const A=globalThis.NakaRewards;let rewardWeek, rewardStatus, officialReadings, rewardWeeks, leftPieces, leftSeen, holdingEvents, holdingsMeta;
  const K = SRC.KEYS, EXP=globalThis.NakaExplore, HOLD=globalThis.NakaPortfolio, PL=globalThis.NakaPlanner;
  let holdings=[],team=[];
  const VERSION = chrome.runtime.getManifest().version;
  // Tab and header icons: original 9×9 pixel glyphs drawn on the same integer grid as the sigil.
  const ICONS = {
    home:    ['111101111','100101001','100101001','111101111','000000000','111101111','100101001','100101001','111101111'],
    raise:   ['000010000','000111000','001010100','010010010','000010000','000010000','000010000','000000000','111111111'],
    search:  ['011110000','110011000','100001000','100001000','110011000','011111000','000001100','000000110','000000011'],
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
  /** A change's direction from its bounds: both above zero up, both below down, exactly zero same, otherwise unknown. */
  const trend = (d) => d.lo > 0 ? 'up' : d.hi < 0 ? 'down' : d.lo === 0 && d.hi === 0 ? 'same' : 'unknown';
  /** Estimated times in the viewer's local time with its UTC offset, to the minute (header time + 10 minutes a block). */
  const localTime = (ms) => I.localTime(ms);

  // 当前状态：语言、本地同步的快照、同步状态；任一变化都整体重画（弹窗内容很少，重画开销可以忽略）
  const state = {
    lang: I.DEFAULT_LANG, status: undefined, localError: null,
    // sheet: the Look up layer over the tab — null (closed), 'search' or 'result'. resultFrom: where a result was opened,
    // 'search' (Back returns there) or null (a holdings tile: Back closes). opener: that tile's ID, null for the magnifier.
    view: 'home', sheet: null, resultFrom: null, opener: null, holdingsOpen: false, addKind: null, fresh: null,
    lookupRaw: null, lookupSnapshot:null, lookupHistorical:false, historyPending:false, pendingLookup:null,rewardClock:null, live: undefined, liveStatus: undefined, visibleAt: undefined,
    // Whether the worker runs this code (SRC.BUILD): null until it answers.
    workerCurrent: null,
  };

  let staticLang = '';
  function renderStatic(T) {
    document.documentElement.lang = state.lang === 'zh' ? 'zh-CN' : 'en';
    for (const b of $('langSwitch').querySelectorAll('button')) b.setAttribute('aria-pressed', String(b.dataset.lang === state.lang));
    const cc = globalThis.NakaExploreUI.pick(state.lang);
    $('title').replaceChildren(document.createTextNode(T.title), el('span', 'version', `v${VERSION}`));
    $('tagline').textContent = cc.readOnlyTag; $('tagline').title = cc.readOnlyDetail;
    // Bottom navigation: one tab per job, the current one marked. Look up (with Compare) opens from the header as a sheet
    // over the tab and closes with Back.
    for (const b of $('tabbar').querySelectorAll('button[data-view]')) {
      b.querySelector('.tab-label').textContent = cc[{ home: 'navHome', raise: 'navRaise', block: 'navBlock', about: 'navAbout' }[b.dataset.view]];
      if (!b.querySelector('.tab-icon svg')) b.querySelector('.tab-icon').append(icon(b.dataset.view));
      b.setAttribute('aria-current', String(b.dataset.view === state.view));
    }
    if (!$('searchOpen').firstChild) $('searchOpen').append(icon('search'));
    $('searchOpen').title = cc.searchOpen; $('searchOpen').setAttribute('aria-label', cc.searchOpen); $('subTitle').textContent = cc.subSearch;
    // Compare: four dots (filled = selected) and the way into the Compare page.
    $('compareTitle').textContent = cc.compare; $('compareCount').textContent = `${comparisonIds.length}/${EXP.MAX}`;
    $('comparePips').replaceChildren(...Array.from({ length: EXP.MAX }, (_, i) => el('i', i < comparisonIds.length ? 'is-on' : '')));
    $('compare').textContent = cc.compareOpen; $('compare').hidden = !comparisonIds.length;
    $('compareAdd').textContent = cc.compareAddShort; $('compareAdd').disabled = comparisonIds.length === EXP.MAX; $('compareAdd').title = comparisonIds.length === EXP.MAX ? cc.fullHere : cc.addHint;
    $('holdingsAdd').textContent = cc.listAdd; $('holdingsAdd').title = cc.addHoldingTitle; paintCopy(cc);
    $('emptyTitle').textContent = cc.emptyTitle; $('emptyText').textContent = cc.emptyText; $('emptyAdd').textContent = cc.emptyAdd;
    // Built once per language, so a refresh never replaces links or folds under the pointer or keyboard focus.
    if (staticLang !== state.lang) {
      staticLang = state.lang;
      // The two places on Ord Dropz where a whole page of Nakas can be added in one click.
      const jump = (text, href) => { const a = el('a', 'empty-jump', `${text} ↗`); a.href = href; a.target = '_blank'; a.rel = 'noopener noreferrer'; return a; };
      $('emptyOr').textContent = cc.emptyOr; $('emptyNote').textContent = cc.emptyJumpNote;
      $('emptyJumps').replaceChildren(jump(cc.vaultLink, `https://ord-dropz.xyz/secondary/collections/${BUNDLED.collection.slug}`), jump(cc.walletLink, 'https://ord-dropz.xyz/wallet'));
      // About tab: the read-only promise first, then every action's eligibility, the allocation arithmetic, the weight rules
      // and the data sources.
      const about = globalThis.NakaExploreUI.about(cc, R, VERSION);
      $('safeTitle').textContent = cc.safeTitle; $('aboutSafe').replaceChildren(...about.safe);
      $('casesTitle').textContent = cc.aboutCases; $('aboutCases').replaceChildren(...about.cases);
      $('allocTitle').textContent = cc.aboutAlloc; $('aboutAlloc').replaceChildren(...about.alloc);
      $('aboutRules').replaceChildren(...about.rules);
      $('dataTitle').textContent = cc.aboutData; $('aboutData').replaceChildren(...about.data);
      // The last line: the community group on Telegram.
      $('tgJoin').textContent = cc.tgJoin; $('tgJoin').href = globalThis.NakaExploreUI.TELEGRAM;
      $('sigil').replaceChildren(PIXEL.sigil('pixel-sigil'));
      $('tabbar').setAttribute('aria-label', cc.navSections);
    }
    $('lookupHow').textContent = cc.lookupHow;
    $('liveTitle').textContent = T.modeTitle;
    $('fixedTitle').textContent=T.historyTitle;$('fixedCancel').textContent=T.cancel;
    $('snapTitle').textContent = T.popupSnapshot;
    $('rulesTitle').textContent = cc.aboutRules;
    $('lookupTitle').textContent = T.lookupTitle;
    $('lookupBack').textContent=T.lookupBack;
    $('lookupNumber').placeholder = T.lookupPlaceholder;
    $('lookupBtn').textContent = state.lookupHistorical?T.historyCheck:T.lookupButton;
    $('syncHeight').placeholder = T.syncPlaceholder;
    $('syncHeight').setAttribute('aria-label', T.syncPlaceholder);
    $('syncBtn').textContent = T.historyConfirm;
    $('historyLookup').textContent=T.historyLookup;$('historyNumberLabel').textContent=T.historyNumber;$('historyNumber').placeholder=T.lookupPlaceholder;
    $('boundaryLabel').textContent=T.boundaryChoose;$('boundaryLabel').title=T.quarterUnconfirmed;
    if($('fixedDialog').open)renderBoundaries(T);
    $('syncHint').textContent = T.historyModeHint;$('fixedHeightLabel').textContent=T.syncPlaceholder;

    $('listedNote').textContent = T.listedZero;

    $('open').textContent = T.popupOpen;
    $('open').href = `https://ord-dropz.xyz/secondary/collections/${BUNDLED.collection.slug}`;
  }

  /** 与内容脚本同一规则（SRC.choose）：显示的是页面此刻正在用的那份数据。 */
  function renderSnapshot(T) {
    const { snap, source } = SRC.choose({ live: state.live, closing: state.closing }, BUNDLED);
    const s = snap.snapshot;
    const sourceText = { live: T.srcLive, bundled: T.srcBundled }[source];
    $('heightLabel').textContent = T.popupHeight;
    $('currentHeight').replaceChildren(el('span', 'sr-only', I.int(s.height)), PIXEL.digits(I.int(s.height), 'pixel-height'));
    $('currentHeight').setAttribute('aria-label', I.int(s.height));
    $('snapSource').textContent = sourceText; $('snapSource').hidden = source !== 'bundled'; // Live is the normal case; only bundled data adds information.
    // The chain clock (a newer /pulse height) refines the countdown only while it is in the same reward phase and week as the
    // data shown; otherwise every figure follows the data's own block, so the strip never contradicts the hero.
    const own=R.rewardPhase(s),ahead=state.rewardClock?.height>s.height?R.rewardPhase(state.rewardClock):null,same=ahead!==null&&ahead.state===own.state&&ahead.index===own.index;
    const clock=same?state.rewardClock:s,phase=same?ahead:own;
    const date=phase.eta===null?T.launchUnknown:T.launchDate(localTime(phase.eta));
    const cycle=phase.state==='before'?{label:source==='live'?T.launchStat:T.launchStatAtBlock,value:I.int(phase.remaining),pixels:true,unit:T.blocksUnit,sub:date}
      :phase.state==='boundary'?{label:source==='live'?T.firstRewardBlock:T.firstRewardAtBlock,value:'1',pixels:true,unit:T.blocksUnit,sub:T.nextBoundary(I.int(phase.next))}
      :phase.state==='active'?{label:phase.index+1>=R.RULES.weeks?(source==='live'?T.accrualRemaining:T.accrualRemainingAtBlock):source==='live'?T.weekRemaining:T.weekRemainingAtBlock,value:I.int(phase.remaining),pixels:true,unit:T.blocksUnit,sub:T.rewardWeek(phase.week,R.RULES.weeks)}
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
    rows[2].title = [...globalThis.NakaPurchase.renderLaunch(clock,T,I).children].map(n=>n.textContent).join('\n');
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
    $('weekBar').firstElementChild.style.width = `${(phase.state === 'active' ? (clock.height - W.startBlock) / (W.weeks * W.weekBlocks) : done / W.weeks) * 100}%`;
    const range = (a, b) => `${I.int(a)} – ${I.int(b)}`;
    const current = phase.state === 'active' ? [cc.scheduleWeekN(`${phase.week}/${W.weeks}`), range(phase.first, phase.last)] : [cc.scheduleWeekN(1), range(W.startBlock + 1, W.startBlock + W.weekBlocks)];
    $('weeksDone').textContent = `${cc.progressLabel} ${cc.weeksDone(done, W.weeks)}`;
    $('schedule').replaceChildren(...[current, [cc.scheduleEndBlock, I.int(phase.end)], [cc.scheduleClaim, I.int(phase.claimUntil)]]
      .map(([k, v]) => { const row = el('div', 'schedule-row'); row.append(el('dt', '', k), el('dd', '', v)); return row; }));
    const now = phase.state === 'active' ? T.rewardWeek(phase.week, W.weeks) : phase.state === 'boundary' ? T.firstRewardAtBlock : phase.state === 'closed' ? T.rewardClosed : T.completedWeeks;
    // Home: one quiet line says which block the figures use and how fresh it is; it opens the Block tab.
    const kind = $('liveState').className.match(/live-state--(\w+)/)?.[1] ?? 'muted', strip = $('statusStrip');
    const age = I.blockAgeShort(T, s);
    const lead = el('span', 'strip-lead'); lead.append(el('i', `strip-dot strip-dot--${kind}`), el('b', '', source === 'live' ? T.modeLive : T.srcBundled), el('span', '', cc.blockChip(I.int(s.height))), el('span', 'strip-age', age));
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
    if (st !== undefined && st.state === 'error') {
      kind = 'error';
      label = T.liveFail(T.failReason[st.kind] + (st.status === null ? '' : T.httpCode(st.status)), st.waitMin);
      tip = [label, live === undefined ? T.liveKeepNone : T.liveKeep(I.int(live.snapshot.height)), st.message].join('\n');
    } else if (dataLine === null) { kind = 'muted'; label = visible ? T.liveWaiting : T.livePaused; tip = label; }
    else { kind = visible ? 'ok' : 'muted'; label = T.liveWatching; tip = visible ? dataLine : `${T.livePaused} · ${dataLine}`; }
    const box = $('liveState');
    box.textContent = label;
    box.title = tip;
    box.className = `live-state live-state--${kind}`;
    box.dataset.state = st === undefined ? 'none' : st.state;
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
    const st = SRC.statusOf(state.status, 'history');
    const running = state.historyPending;$('fixedCancel').disabled=running;
    // History loading progress stays in its dialog; it never relabels the live line.
    $('syncBtn').disabled = running;
    $('syncHeight').disabled = running;$('historyNumber').disabled=running;$('rewardBoundary').disabled=running;
    if (state.localError !== null) { showStatus('error', T[state.localError]); return; }
    if (!state.historyPending && state.localError===null && (!st || st.state!=='error')) { $('syncStatus').hidden = true; return; }
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
      chip.textContent=state.lookupHistorical?T.historyTitle:T.modeLive;
      chip.setAttribute('aria-label',`${T.modeTitle}: ${chip.textContent}`);
      chip.title=T.historyLookup+' · '+$('liveState').title;
      chip.dataset.state=$('liveState').dataset.state;
    }
  }
  let lookupKey = '';
  function renderLookup(T, snap) {
    const found = state.lookupRaw === null ? null : LOOKUP.query(snap, state.lookupRaw);
    // Rebuilt only when its own inputs change: the block, the number, language, mode, my holdings and this piece's own
    // closing row. Another listing closing within the block leaves the card (and the focus in it) as it is.
    const key = found === null ? '' : `${snap.snapshot.height}|${snap.snapshot.generatedAt}|${state.lookupRaw}|${state.lang}|${state.lookupHistorical}|${holdings.join()}|${found.state === 'found' ? JSON.stringify((snap.closing ?? []).filter(([id]) => id === found.id)) : ''}`;
    if (key === lookupKey) {
      for(const n of $('lookupResult').querySelectorAll('.lookup-basis--time')) { n.textContent=T.lookupBasis(I.blockBasis(T,snap.snapshot)); n.title=I.blockTimeTitle(T,snap.snapshot); }
      return;
    }
    lookupKey = key;
    const box = $('lookupResult');
    box.replaceChildren(); box.hidden = found === null;
    $('lookupActions').hidden = true; // shown again only for a found NFT
    $('lookupNumber').removeAttribute('aria-invalid');
    if (box.hidden) return;
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
    link.href=globalThis.NakaExploreUI.marketFind(snap,found.id);
    link.target='_blank'; link.rel='noopener noreferrer';
    // The action follows the full result, in the same layout flow as its evidence.
    $('lookupCompare').dataset.id=found.id;$('lookupHolding').dataset.id=found.id;$('lookupActions').hidden=state.lookupHistorical;
    Object.assign($('lookupPlan').dataset,{id:found.id,number:String(found.number),listing:found.listing,capped:String(r.lo.weight>=R.RULES.capPct)});
    head.append(el('strong','',`Shielded #${found.number}`),link);
    const rank=globalThis.NakaPurchase.numberBadge(found.number,T);if(rank)head.insertBefore(rank,link);
    // My own listing shows what reclaiming it does; anyone else's what buying it does.
    const held=holdings.includes(found.id),action=found.listing==='listed'&&held?'cancel':'sale';
    const model=globalThis.NakaPurchase.create(snap,{action}),scenario=model.get(found.id);
    card.dataset.listing=found.listing;card.dataset.queryPurpose=state.lookupHistorical?'block':'purchase';
    const notice=scenario.state==='no-floor'?(action==='cancel'?T.cancelNoFloor:T.buyNoFloor):null;
    card.append(head,!state.lookupHistorical&&scenario.state==='ready'?globalThis.NakaPurchase.render(model,found.id,T,I,{explain:A.explainFor(snap,found.id,state.lang,action)}):globalThis.NakaPurchase.renderCurrent(r,snap.snapshot,T,I,{notice:state.lookupHistorical?null:notice,explain:A.explainFor(snap,found.id,state.lang),listing:found.listing,credits:globalThis.NakaPurchase.relayCredits(snap,found.id)}));
    const purchase=card.querySelector('.naka-purchase'),context=el('div','lookup-context');
    const mode=el('button','lookup-mode');mode.type='button';mode.addEventListener('click',openHistoryDialog);
    context.append(purchase.querySelector('.naka-purchase__basis'),mode);
    purchase.prepend(context);
    // My holdings: a listed NFT shows what buying it does; one of my listed holdings shows what delisting does.
    if(!state.lookupHistorical&&holdings.length&&found.listing==='listed'){const x=HOLD.impact(snap,holdings,found.id,action,model);if(x.state==='ready')card.append(globalThis.NakaExploreUI.holdingsLine(x,globalThis.NakaExploreUI.pick(state.lang)));}
    box.append(card);
  }

  /** Home: the weekly SHNAKAS figure is the one hero number; every holding follows as a tile with its number, weight
   * (as the official endpoint reports it) and weekly SHNAKAS (0 while listed). Without holdings, a centred first-run
   * prompt takes the whole view. Adding a number uses a small dialog. */
  const TILE_COLUMNS = 4, TILE_ROWS = 3;
  // One artwork element per NFT, reused by every render: moving it keeps the decoded image, so a data refresh never flashes.
  const artFor = globalThis.NakaExploreUI.artStore();
  let holdingsKey = '';
  function renderHoldings(snap) {
    const c = globalThis.NakaExploreUI.pick(state.lang), U = globalThis.NakaExploreUI, own = HOLD.current(snap, holdings);
    let missing=$('holdingsMissing');if(!missing){missing=el('p','hc-how');missing.id='holdingsMissing';missing.setAttribute('role','status');$('holdingsEmpty').before(missing);}missing.hidden=!own.missing;missing.textContent=c.holdingsWaiting(own.missing);
    // Everything the tiles and the hero read: the week's table and readings, finished weeks, left pieces, my holdings'
    // records and anchors (the same block can carry new records for a holding just added), language, data, my listings
    // already closing (their status says so) and layout.
    const mineRows = own.ids.map(id => JSON.stringify([holdingEvents?.rows?.[id] ?? null, holdingsMeta?.[id] ?? null])).join(';');
    const key = `${rewardWeek?.height}|${rewardStatus?.state}|${JSON.stringify(officialReadings)}|${Object.keys(rewardWeeks?.weeks??{}).join()}|${JSON.stringify(leftPieces)}|${JSON.stringify(leftSeen)}|${holdingEvents?.height}|${mineRows}|${state.lang}|${snap.snapshot.height}|${snap.snapshot.generatedAt}|${JSON.stringify((snap.closing ?? []).filter(([id]) => own.ids.includes(id)))}|${own.ids.join()}|${state.holdingsOpen}|${state.fresh ? [...state.fresh].join() : ''}|${JSON.stringify([...confirmErrors])}`;
    if (key === holdingsKey) return;
    holdingsKey = key;
    const empty = !own.ids.length, phase = R.rewardPhase(snap.snapshot);
    document.querySelector('.holdings-hero').hidden = empty; $('holdingsList').hidden = empty; $('holdingsEmpty').hidden = !empty;
    const history = A.history(snap, own.ids, leftPieces, holdingEvents, A.weeks(rewardWeeks), phase, holdingsMeta);
    // First run previews the result: the weekly figure at zero and four empty tiles, then the ways to fill them. When the
    // last holding sold, the line about this week's sales stays, above that card.
    if (empty) { const zero = el('span', 'hc-value'); zero.append(PIXEL.digits('0.00', 'hc-pixels'), el('span', 'hc-unit', c.weekUnit)); $('emptyFigure').replaceChildren(zero); paintNotes(c, [], history, phase, true); return; }
    $('holdingsTitle').textContent = c.holdings; $('tilesTitle').textContent = c.tilesTitle(own.ids.length);
    $('holdingsManage').textContent = c.manage; $('holdingsManage').title = c.openHoldings;
    const a = own.allocation;
    const rewards = A.render(snap, own.ids, rewardWeek, officialReadings, state.lang, { share: a.share, status: rewardStatus, history, events: holdingEvents });
    $('holdingsFigure').replaceChildren(rewards.element);
    // A sale only the owner can attribute stays among the holdings, asked about above the tiles; any other sale of a holding
    // moved it to Left already (the worker reads it from the public records), said there while that week lasts.
    const asks = new Map(own.ids.map((id) => [id, HOLD.saleToConfirm(snap, id, holdingEvents?.rows?.[id], holdingsMeta?.[id], A.tile(rewards.data, id, state.lang).row.reason)]).filter(([, x]) => x !== null));
    paintNotes(c, [...asks].map(([id, x]) => confirmNote(c, snap.items[id][0], id, x)), history, phase, false);
    const cancel = globalThis.NakaPurchase.create(snap, { action: 'cancel' }), limit = TILE_ROWS * TILE_COLUMNS, folded = !state.holdingsOpen && own.ids.length > limit;
    $('holdingsTiles').replaceChildren(...(folded ? own.ids.slice(0, limit) : own.ids).map((id) => {
      const number = snap.items[id][0], listed = globalThis.NakaPurchase.listingStatus(snap, id) === 'listed', r = R.evaluateSnapshot(snap, id);
      const weekly = listed ? null : R.weeklyAllocation(R.units(r), a.all), view = A.tile(rewards.data, id, state.lang), status = view.row.status;
      let delist = '';
      if (listed) { const x = HOLD.impact(snap, holdings, id, 'cancel', cancel); if (x.state === 'ready') delist = `\n${c.afterDelist}: ${R.formatWeight(x.scenario.result)} · ${c.perWeek(U.shn(x.allocation.piece))}`; }
      const tile = el('button', 'hc-tile'); tile.type = 'button'; tile.dataset.id = id; tile.dataset.status = status;
      if (listed) tile.classList.add('is-listed'); if (state.fresh?.has(id)) tile.classList.add('is-new');
      const earnsNone = ['paused', 'gone', 'ended', 'unknown'].includes(status);
      const ask = asks.get(id) ?? null, askLine = ask === null ? '' : `\n${c.confirmSale(number, I.int(ask.listedAt), I.int(ask.soldAt))} ${c.confirmAsk}`;
      tile.title = `#${number} · ${R.formatWeight(r)} · ${listed ? c.listedNoEarn : earnsNone ? view.label : c.perWeek(U.shn(weekly))}${askLine}\n${view.explain.full}${view.amount ? `\n${c.thisWeek} ${A.format(view.amount)} SHNAKAS` : ''}${delist}\n${c.tileHint(number)}`;
      const art = el('span', 'hc-art'); art.append(artFor(snap, id, 'hc-fallback', 'tile'));
      if (listed) art.append(el('span', 'hc-tag', c.listedTag));
      // Three fixed caption lines: number and weight, this week's SHNAKAS (the weekly rate before rewards start), status.
      // A figure that is still loading keeps its line and is hidden, so tiles never change height.
      const idle = status === 'idle', amount = listed ? 0 : idle ? null : view.amount, earn = el('b', listed ? 'hc-earn hc-earn--listed' : 'hc-earn', listed ? c.earnListed : idle ? U.shn(weekly) : amount === null ? '0.0000' : A.format(amount));
      if (!idle && amount === null) earn.classList.add('is-blank');
      const caption = el('span', 'hc-caption');
      // A sale awaiting the owner's answer is not yet a purchase that "starts next week": it says so instead.
      caption.append(el('span', 'hc-number', `#${number}`), el('span', `hc-weight naka-tone-${TIER.tierOf(r)}`, R.formatWeight(r)), earn, ask !== null ? el('small', 'hc-sub hc-sub--confirm', c.toConfirm) : el('small', `hc-sub hc-sub--${status}`, idle ? c.perWeekShort : view.label));
      tile.append(art, caption);
      // The second click of a double click is not a choice: a line above that closed on the first one moved this tile under
      // the pointer.
      tile.addEventListener('click', (ev) => { if (ev.detail > 1) return; state.opener = id; $('lookupNumber').value = String(number); showLookup(String(number)); $('lookupBack').focus(); });
      return tile;
    }));
    $('holdingsMore').hidden = own.ids.length <= limit;
    $('holdingsMore').textContent = state.holdingsOpen ? c.collapse : c.expandAll(own.ids.length);
    $('holdingsMore').setAttribute('aria-expanded', String(state.holdingsOpen));
  }
  /** A sale the owner must attribute, answered in place: "I sold it" moves the piece to Left with the weeks it kept, "I
   * bought it" keeps it (as on the extension page). A failed answer says why on its line. */
  const confirmErrors = new Map();
  function confirmNote(c, number, id, x) {
    const note = el('div', 'hc-note hc-note--ask'), answers = el('span', 'hc-note-actions');
    note.append(el('span', '', `${c.confirmSale(number, I.int(x.listedAt), I.int(x.soldAt))} ${c.confirmAsk}`));
    for (const [action, label] of [['sold', c.markSold], ['bought', c.markBought]]) {
      const b = el('button', 'hc-note-btn', label); b.type = 'button'; b.dataset.focus = `${action}-${id}`;
      b.addEventListener('click', async () => { confirmErrors.delete(id); let res = null; try { res = await chrome.runtime.sendMessage({ type: 'shn-left', action, id, listedAt: x.listedAt }); } catch { res = null; } if (!res?.ok) confirmErrors.set(id, res?.error === 'no-sale' ? 'markFailed' : 'addError'); render(); });
      answers.append(b);
    }
    note.append(answers); if (confirmErrors.has(id)) note.append(el('small', 'inline-error', c[confirmErrors.get(id)]));
    return note;
  }
  /** The lines above the tiles, or above the first-run card when no holding is left: questions first, then this week's
   * sales. A rebuilt line keeps the keyboard focus where it was; a line that went away (closed or answered) hands it to the
   * next line, or to Manage (to the first-run card's Add when no holding is left). */
  function paintNotes(c, asks, history, phase, empty) {
    const notes = $('holdingsNotes'), had = notes.contains(document.activeElement) ? document.activeElement.dataset.focus : null;
    (empty ? $('holdingsEmpty') : $('holdingsTiles')).before(notes);
    notes.replaceChildren(...asks, ...leftNote(c, history.left, phase));
    if (had !== null) (notes.querySelector(`[data-focus="${had}"]`) ?? notes.querySelector('button') ?? (empty ? $('emptyAdd') : $('holdingsManage'))).focus({ preventScroll: true });
  }
  /** Pieces sold during this reward week, moved to Left on their own: one short line until the owner opens Left from it
   * (View) or closes it (×); a later sale brings it back with that sale only. It names each piece once (one sold twice this
   * week too); the tooltip keeps every sale's block and whether full weeks stay claimable. A run with no public sale block
   * (a private move) is not dated, so it is not listed here. */
  const LEFT_NAMED = 3;
  function leftNote(c, left, phase) {
    const { keys, fresh } = HOLD.soldThisWeek(left, phase, leftSeen);
    if (!fresh.length) return [];
    // Seen: every sale of this week's list is stored, so the line returns only for a sale not in it yet (a later one, or an
    // earlier one the owner settles afterwards).
    const seen = () => chrome.storage.local.set({ [HOLD.LEFT_SEEN]: keys });
    const note = el('p', 'hc-note hc-note--left'), view = el('button', 'list-link', c.leftView), close = el('button', 'hc-note-close', '×');
    view.type = 'button'; close.type = 'button'; close.title = c.leftDismiss; close.setAttribute('aria-label', c.leftDismiss);
    view.dataset.focus = 'left-view'; close.dataset.focus = 'left-close';
    view.addEventListener('click', () => { seen(); chrome.runtime.sendMessage({ type: 'shn-open-compare', section: 'left' }); });
    close.addEventListener('click', seen);
    // Weeks still claimable are mentioned only when one of them kept a full week (one listed in its first week kept none).
    note.title = c.leftThisWeek(fresh.map((x) => c.leftItem(x.number, I.int(x.run.soldAt))), fresh.some((x) => x.weeks !== null && x.weeks > 0));
    const pieces = [...new Map(fresh.map((x) => [x.id, x.number])).values()];
    note.append(el('span', 'hc-note-text', c.leftSoldWeek(pieces.slice(0, LEFT_NAMED).map((n) => `#${n}`), pieces.length)), view, close);
    return [note];
  }
  /** Compare inside the popup: each selected Naka with its after-sale weight, ask and what it does for my holdings.
   * Four slots stay visible so an empty or partial selection still reads as a complete layout. */
  let compareKey = '';
  function renderCompareList(snap) {
    const key = `${state.lang}|${snap.snapshot.height}|${snap.snapshot.generatedAt}|${comparisonIds.join()}|${holdings.join()}`;
    if (key === compareKey) return; compareKey = key;
    const c = globalThis.NakaExploreUI.pick(state.lang), U = globalThis.NakaExploreUI, model = globalThis.NakaPurchase.create(snap), list = $('compareList');
    const rows = comparisonIds.map((id) => {
      const e = EXP.entry(snap, model, id), row = el('div', 'compare-row');
      if (!e) { row.append(el('span', 'compare-missing', c.missing)); return row; }
      const open = el('button', 'compare-main'); open.type = 'button'; open.title = c.tileHint(e.number);
      open.addEventListener('click', () => { $('lookupNumber').value = String(e.number); showLookup(String(e.number)); });
      const info = el('span', 'compare-info');
      info.append(el('strong', '', `#${e.number}`), el('small', '', e.listing === 'listed' ? `${c.ask.split(' · ')[0]} ${I.btc(e.sale.price)} BTC` : c[e.listing]));
      if (holdings.length && e.listing === 'listed' && !holdings.includes(id)) { const x = HOLD.impact(snap, holdings, id, 'sale', model); if (x.state === 'ready') { const d = x.allocation.delta, g = el('small', 'compare-gain', c.forMeShort(U.shn(d, true))); g.dataset.change = trend(d); info.append(g); } }
      const weight = el('span', 'compare-weight'); weight.append(el('small', '', e.listing === 'listed' ? c.after : c.holding)); const value = el('span'); globalThis.NakaPurchase.decorateWeight(value, e.result, true); weight.append(value);
      const art = el('span', 'compare-art'); art.append(artFor(snap, id, 'hc-fallback', 'compare'));
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
  /** Raise weight in the popup: the answers in three cards of RAISE_ROWS rows each, so all three fit one screen, each with
   * its way to the extension page. Best buy: the listings adding the most weekly SHNAKAS per 0.001 BTC (a row opens that
   * card on the market). Reach 400%: the pieces whose own plan gives us most per BTC (a row opens that plan). Own a trait:
   * the traits buying listings makes ours, then the nearest ones a private deal is still needed for (a row opens that tab).
   * Simulate: one line under them. Computed only while the tab is shown, after it has painted. Within a block only the
   * closing listings change (purchases and reclaims on their way): the ranking behind Best buy never reads them (its card
   * just leaves them out), and Reach 400% and Own a trait read them only for our own listings and listings that carry a
   * trait of one of our pieces (planner.js). So the answers are kept per block and holdings (and added numbers and those
   * closing rows), a card is rebuilt only when what it shows changes, and cards on screen stay, dimmed, until their
   * replacement is ready. */
  const RAISE_ROWS = 2;
  const rankCache = { key: null, rows: null }, planCache = { key: null, plans: null, lock: null };
  let raiseShown = { kind: null }, raiseJob = null;
  const openPage = (section) => chrome.runtime.sendMessage({ type: 'shn-open-compare', section });
  /** Numbers added beside my holdings (a teammate's or any) as IDs of this block, my own holdings left out. */
  function extraIds(snap, own) {
    const byNumber = new Map(Object.entries(snap.items).map(([id, row]) => [row[0], id])), mine = new Set(own);
    return [...new Set(team.map((x) => byNumber.get(x)).filter((id) => id !== undefined && !mine.has(id)))];
  }
  // The tab's own lines are written only when they change, so a refresh that changes nothing leaves the tab untouched.
  const put = (node, prop, value) => { if (node[prop] !== value) node[prop] = value; };
  function renderRaise(snap) {
    const c = globalThis.NakaExploreUI.pick(state.lang);
    put($('raiseTitle'), 'textContent', c.navRaise); put($('raiseFull'), 'textContent', c.raiseFull); put($('raiseFull'), 'title', c.raiseFullHint); put($('raiseBasis'), 'textContent', c.raiseBasis(I.int(snap.snapshot.height)));
    if (state.view !== 'raise' || state.sheet !== null) return;
    const own = HOLD.current(snap, holdings).ids, extra = extraIds(snap, own), box = $('raiseBody'), s = snap.snapshot;
    const note = !own.length ? 'empty' : ['ended', 'closed'].includes(R.rewardPhase(s).state) ? 'ended' : null;
    // The added numbers the answers count as ours, said under the basis line (the first five by number). One line, so the
    // cards below never move down; the title holds the whole line when it is cut short.
    const mates = note === null ? extra.map((id) => snap.items[id][0]).sort((a, b) => a - b) : [], scope = mates.length ? c.raiseScope(mates.length, mates.slice(0, 5).map((n) => `#${n}`)) : '';
    put($('raiseScope'), 'hidden', !mates.length); put($('raiseScope'), 'textContent', scope); put($('raiseScope'), 'title', scope);
    if (note !== null) {
      raiseJob = null; box.removeAttribute('aria-busy');
      if (raiseShown.kind === note && raiseShown.lang === state.lang) return;
      raiseShown = { kind: note, lang: state.lang };
      if (note === 'ended') { box.replaceChildren(el('p', 'raise-note', c.raiseEnded)); return; }
      const empty = el('div', 'raise-empty'), add = el('button', 'btn', c.emptyAdd); add.type = 'button'; add.addEventListener('click', () => openAdd('holding')); empty.append(el('p', '', c.raiseEmpty), add); box.replaceChildren(empty); return;
    }
    const ours = new Set([...own, ...extra]), traits = new Set([...ours].flatMap((id) => snap.items[id].slice(1)));
    const rankKey = `${s.height}|${s.generatedAt}|${own.join()}`, planKey = `${rankKey}|${extra.join()}|${JSON.stringify((snap.closing ?? []).filter(([id]) => ours.has(id) || snap.items[id].slice(1).some((idx) => traits.has(idx))))}`;
    if (rankCache.key === rankKey && planCache.key === planKey) { raiseJob = null; showRaise(c, snap, ours); return; }
    const job = `${rankKey}#${planKey}`; if (raiseJob === job) return; raiseJob = job;
    if (raiseShown.kind === 'cards') box.setAttribute('aria-busy', 'true');
    else { box.replaceChildren(el('p', 'raise-note', c.raiseRunning)); raiseShown = { kind: 'running' }; }
    setTimeout(() => {
      if (raiseJob !== job) return;
      raiseJob = null; if (state.view !== 'raise' || state.sheet !== null) return; // left meanwhile: computed when shown again
      if (rankCache.key !== rankKey) Object.assign(rankCache, { key: rankKey, rows: HOLD.rank(snap, own) });
      if (planCache.key !== planKey) Object.assign(planCache, { key: planKey, plans: PL.targetPlans(snap, { mine: own, mates: extra }), lock: PL.lockGroups(PL.lockTraits(snap, [...own, ...extra])) });
      renderRaise(SRC.choose({ live: state.live, closing: state.closing }, BUNDLED).snap);
    }, 30);
  }
  /** The cards from the kept answers (`ours`: my holdings, then the numbers added). Best buy leaves out listings already
   * closing (nobody can buy them). A card whose content is unchanged stays on screen untouched. */
  function showRaise(c, snap, ours) {
    const box = $('raiseBody'), closing = new Set((snap.closing ?? []).map((r) => r[0])), value = (x) => x.impact.allocation.delta.lo / x.price;
    const buys = rankCache.rows.filter((x) => !closing.has(x.id) && x.impact.allocation.delta.lo > 0).sort((a, b) => value(b) - value(a));
    const top = `${state.lang}|${rankCache.key}|${buys.slice(0, RAISE_ROWS).map((x) => x.id).join()}`, plan = `${state.lang}|${planCache.key}`;
    box.removeAttribute('aria-busy');
    const was = raiseShown.kind === 'cards' ? raiseShown : null, keepBuy = was !== null && was.top === top, keepPlan = was !== null && was.plan === plan;
    // With the same top rows only the number of buyable listings can differ: it changes in place.
    if (keepBuy && was.count !== buys.length) was.nodes[0].querySelector('.raise-card-head .list-link').textContent = c.raiseAllBuys(buys.length);
    const nodes = [keepBuy ? was.nodes[0] : buyCard(c, snap, buys), ...(keepPlan ? was.nodes.slice(1) : planCards(c, snap, ours))];
    if (was === null) box.replaceChildren(...nodes); else nodes.forEach((n, i) => { if (n !== was.nodes[i]) was.nodes[i].replaceWith(n); });
    raiseShown = { kind: 'cards', top, count: buys.length, plan, nodes };
  }
  function raiseCard(title, more, section) {
    const box = el('section', 'raise-card'), head = el('div', 'raise-card-head'); head.append(el('h3', 'px-title', title));
    if (more !== null) { const b = el('button', 'list-link', more); b.type = 'button'; b.addEventListener('click', () => openPage(section)); head.append(b); }
    box.append(head); return box;
  }
  /** One row; `place` keeps one artwork element per card (per row in Own a trait, where two traits can share a piece), so a
   * piece shown twice keeps its image in each. `tone` colours the figure on the right: a weekly change by its direction
   * (trend), or 'missing' for the pieces a trait still lacks. */
  function raiseRow(snap, place, tag, id, top, sub, gain, gainSub, tone) {
    const r = el(tag, 'raise-row'), art = el('span', 'raise-art'), info = el('span', 'raise-info'), right = el('span', 'raise-gain');
    art.append(artFor(snap, id, 'hc-fallback', place)); info.append(top, el('small', '', sub)); right.append(el('b', '', gain), el('small', '', gainSub)); right.dataset.tone = tone;
    r.append(art, info, right); return r;
  }
  /** Best buy: the page's ranking (weekly gain per sat), the top rows. */
  function buyCard(c, snap, buys) {
    const U = globalThis.NakaExploreUI, buy = raiseCard(c.raiseBuyTitle, buys.length ? c.raiseAllBuys(buys.length) : null, 'planner-buy');
    if (!buys.length) buy.append(el('p', 'raise-note', c.raiseBuyNone));
    for (const x of buys.slice(0, RAISE_ROWS)) {
      const number = snap.items[x.id][0], per = x.impact.allocation.delta.lo / x.price * 1e5;
      const a = raiseRow(snap, 'raise-buy', 'a', x.id, el('strong', '', `#${number} · ${I.btc(x.price)} BTC`), c.raisePer(U.shn({ lo: per, hi: per })), U.shn(x.impact.allocation.delta, true), c.raiseWeek, trend(x.impact.allocation.delta));
      a.href = U.marketFind(snap, x.id); a.target = '_blank'; a.rel = 'noopener noreferrer'; a.title = c.raiseBuyHint(number); buy.append(a);
    }
    return buy;
  }
  /** Reach 400%: each piece's own cheapest plan (my holdings and the numbers added), best value first; then Own a trait and
   * the Simulate line into the page. */
  function planCards(c, snap, ours) {
    // Plans that need us; one made only of listings already closing (`auto`) is no choice: the piece gets there anyway.
    const U = globalThis.NakaExploreUI, rows = planCache.plans, reach = rows.filter((r) => r.state === 'reachable' && !r.auto), auto = rows.filter((r) => r.state === 'reachable' && r.auto);
    const plan = raiseCard(c.raisePlanTitle, rows.length ? c.raiseAllPlans(rows.length) : null, 'planner-plan');
    if (!rows.length) plan.append(el('p', 'raise-note', c.raisePlanDone));
    else if (!reach.length) plan.append(el('p', 'raise-note', auto.length ? c.raisePlanAuto(auto.length) : c.raisePlanNone));
    for (const r of reach.slice(0, RAISE_ROWS)) {
      const top = el('strong', '', `#${r.number}`); top.append(el('span', 'raise-to', `${r.before.lo.weight}% → ${R.RULES.capPct}%`)); if (r.side === 'mates') top.append(el('span', 'raise-tag', c.raiseMate));
      const cost = c.raisePlanCost(I.btc(r.plan.cost), r.plan.buys), sub = r.value === null ? cost : `${cost} · ${c.raisePer(U.shn({ lo: r.value, hi: r.value }))}`;
      const b = raiseRow(snap, 'raise-plan', 'button', r.id, top, sub, U.shn(r.total, true), c.raiseWeek, trend(r.total)); b.type = 'button'; b.title = c.raisePlanHint(r.number); b.addEventListener('click', () => openPage(`plan-${r.number}`)); plan.append(b);
    }
    const sim = el('button', 'raise-link'); sim.type = 'button'; sim.append(el('strong', '', c.raiseSimTitle), el('span', '', c.raiseSimLine)); sim.addEventListener('click', () => openPage('planner-sim'));
    return [plan, lockCard(c, snap, ours), sim];
  }
  /** Own a trait: the traits buying listings makes ours, best value first, then the ones a private deal is still needed
   * for, the fewest pieces missing first (NakaPlanner.lockGroups); the traits already all ours need nothing and stay on
   * the page. A row shows one of our pieces carrying the trait (my holdings first) and opens that tab on the page. */
  function lockCard(c, snap, ours) {
    const U = globalThis.NakaExploreUI, T = I.pick(state.lang), { can, have, far, missing } = planCache.lock, all = can.length + have.length + far.length, rows = [...can, ...far].slice(0, RAISE_ROWS);
    const card = raiseCard(c.raiseLockTitle, all ? c.raiseAllTraits(all) : null, 'planner-lock'), pct = (b) => b.lo === b.hi ? `+${b.lo}%` : `+${b.lo}–${b.hi}%`;
    if (!rows.length) card.append(el('p', 'raise-note', c.raiseLockNone(have.length)));
    rows.forEach((t, i) => {
      const m = t.monopoly, type = t.type === 'Hair And Headwear' ? T.headwear : t.type, top = el('strong', 'raise-trait');
      top.append(el('span', 'raise-value', t.value), el('span', 'raise-type', type));
      // The bonus once all ours; owned.state is 'no-floor' instead when buying the listings would leave none on the market.
      const once = t.owned.state === 'ready' ? c.raiseLockOnce(pct(t.owned.after)) : c.raiseLockNoFloor;
      let sub, gain, gainSub, tone;
      if (m.state === 'possible') {
        // Ours once the others' listings are bought and ours reclaimed: the cost and our weekly total then. With no listing
        // to remove there is no total: the trait is all ours already and owning it changes nothing, so the bonus it keeps.
        sub = `${m.buy.length ? c.raisePlanCost(I.btc(m.cost), m.buy.length) : c.raiseFree} · ${once}`;
        [gain, gainSub, tone] = m.total ? [U.shn(m.total, true), c.raiseWeek, trend(m.total)] : [pct(t.owned.after), c.raiseLockKept, 'same'];
      } else {
        // Someone else holds one, one is unminted, or buying leaves no listing to score: what is still missing.
        sub = [c.raiseLockOurs(t.held, t.supply), ...(t.wanted.length ? [c.raiseLockDeal(t.wanted.length)] : []), ...(t.unminted.length ? [c.raiseLockUnminted(t.unminted.length)] : []), once].join(' · ');
        [gain, gainSub, tone] = [String(missing(t)), c.raiseLockMissing, 'missing'];
      }
      const piece = [...ours].find((id) => snap.items[id].slice(1).includes(t.idx));
      const b = raiseRow(snap, `raise-lock-${i}`, 'button', piece, top, sub, gain, gainSub, tone); b.type = 'button'; b.title = c.raiseLockHint(`${type} · ${t.value}`); b.addEventListener('click', () => openPage('planner-lock')); card.append(b);
    });
    return card;
  }
  /** A tab from the bar. With the sheet open the click closes it first; on the tab already in use that is all it does, and
   * the tab keeps its scroll position. */
  function setView(view) {
    const covered = state.sheet !== null, same = view === state.view;
    state.view = view;
    if (covered) closeSheet(); else render();
    if (!(covered && same)) $('views').scrollTop = 0;
  }
  /** Look up and Compare: a sheet over the middle of the popup; the header, the tab bar and the tab underneath stay put.
   * The search page with its number field focused and the number selected: from the magnifier (also while a result is
   * shown) and from Back on a result opened here. */
  function showSearch() {
    if (state.sheet === null) state.opener = null;
    state.sheet = 'search'; state.lookupRaw = null; state.lookupHistorical = false; state.lookupSnapshot = null;
    render(); $('sheetScroll').scrollTop = 0; $('lookupNumber').focus(); $('lookupNumber').select();
  }
  /** Close the sheet. Focus inside it goes back to what opened it: its holdings tile, or the magnifier (also when that tile
   * is gone because its piece left My holdings from the sheet). */
  function closeSheet() {
    const inside = $('sheet').contains(document.activeElement);
    state.sheet = null; state.lookupRaw = null; state.lookupHistorical = false; state.lookupSnapshot = null; $('lookupNumber').value = '';
    render();
    if (!inside) return;
    const tile = state.opener === null ? null : $('holdingsTiles').querySelector(`.hc-tile[data-id="${state.opener}"]`);
    (tile === null ? $('searchOpen') : tile).focus({ preventScroll: true });
  }
  /** Inline "#number" forms: add to My holdings, or to Compare, without leaving the current tab. */
  /** Add one or more comma- or space-separated numbers. Returns { added, message }: message explains skipped entries (or why
   * nothing was added); the dialog stays open with it, and closes when everything went in. */
  async function addHolding(raw) {
    const c = globalThis.NakaExploreUI.pick(state.lang), snap = SRC.choose({ live: state.live, closing: state.closing }, BUNDLED).snap;
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
    const c = globalThis.NakaExploreUI.pick(state.lang), snap = SRC.choose({ live: state.live, closing: state.closing }, BUNDLED).snap;
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
  /** Raise weight link: my unlisted holding opens the listing simulator; any other Naka opens its plan to the 400% cap. */
  function paintLookupPlan(button) {
    const c = globalThis.NakaExploreUI.pick(state.lang), sim = holdings.includes(button.dataset.id) && button.dataset.listing === 'unlisted';
    button.textContent = sim ? c.simLink : c.planLink; button.title = sim ? c.simLinkHint : c.planLinkHint; button.dataset.section = `${sim ? 'sim' : 'plan'}-${button.dataset.number}`;
    // A Naka already at 400% has no plan to make; the simulator still applies to my unlisted holding.
    button.hidden = !sim && button.dataset.capped === 'true';
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
    const querySnap=state.lookupHistorical&&state.lookupSnapshot?state.lookupSnapshot:snap;
    renderLookup(T,querySnap);
    renderLookupContext(T,querySnap);
    if (!$('lookupActions').hidden) { paintLookupCompare($('lookupCompare')); paintLookupHolding($('lookupHolding')); paintLookupPlan($('lookupPlan')); }
    renderHoldings(snap);
    renderRaise(snap);
    renderCompareList(snap);
    // The tab in use stays rendered under the sheet (inert while covered), so opening or closing the sheet moves nothing.
    for (const view of ['home', 'raise', 'block', 'about']) $('view' + view[0].toUpperCase() + view.slice(1)).hidden = view !== state.view;
    // The previous worker still runs (files replaced, extension not reloaded): one card in place of the views, tabs and
    // search, which would all show data this version cannot read.
    const stale = state.workerCurrent === false;
    $('updateCard').hidden = !stale; $('views').hidden = stale; $('tabbar').hidden = stale; $('searchOpen').hidden = stale;
    $('updateTitle').textContent = T.updateTitle; $('updateText').replaceChildren(el('span', '', T.updateText(SRC.BUILD)), el('span', '', T.updateKeep)); $('updateReload').textContent = T.updateReload; $('updateHint').textContent = T.updateHint;
    $('sheet').hidden = state.sheet === null; $('sheet').classList.toggle('has-lookup', state.sheet === 'result');
    $('views').inert = state.sheet !== null; $('searchOpen').setAttribute('aria-expanded', String(state.sheet !== null));
    renderStatus(T);
  }

  Promise.all([
    chrome.storage.local.get([K.live, K.closing, K.liveStatus, I.STORAGE_KEY, EXP.KEY, HOLD.KEY, HOLD.TEAM,A.KEY,A.STATUS,A.OBSERVED,A.WEEKS,HOLD.LEFT,HOLD.LEFT_SEEN,HOLD.EVENTS,HOLD.META]),
    chrome.storage.session.get(SRC.SESSION_VISIBLE),
  ]).then(([got, ses]) => {
    rewardWeek=got[A.KEY];rewardStatus=got[A.STATUS];officialReadings=got[A.OBSERVED];rewardWeeks=got[A.WEEKS];leftPieces=got[HOLD.LEFT];leftSeen=got[HOLD.LEFT_SEEN];holdingEvents=got[HOLD.EVENTS];holdingsMeta=got[HOLD.META];comparisonIds=EXP.normalize(got[EXP.KEY]);holdings=HOLD.normalize(got[HOLD.KEY]);team=HOLD.mates(got[HOLD.TEAM]);
    state.lang = I.resolveLang(got[I.STORAGE_KEY]);
    state.live = got[K.live];
    state.closing = got[K.closing];
    state.liveStatus = got[K.liveStatus];
    state.visibleAt = ses[SRC.SESSION_VISIBLE];
    chrome.runtime.sendMessage({type:'shn-reward-clock'}).then(c=>{if(c?.ok){state.rewardClock=c;render();}}).catch(()=>{});
    render();
    setInterval(render, 15000); // 刷新「几分钟前」与暂停状态
    // Which code the worker runs. A worker from before this check leaves the message unanswered (undefined), and a
    // rejected message means no worker took it: neither runs this code.
    chrome.runtime.sendMessage({ type: 'shn-build' }).then((answer) => SRC.sameBuild(answer), () => false).then((same) => { state.workerCurrent = same; if (!same) state.sheet = null; render(); });
  });
  // Reload asks the new worker to open the popup again (Chrome closes it on reload), so the update ends on the usual view.
  $('updateSigil').replaceChildren(PIXEL.sigil('pixel-sigil'));
  $('updateReload').addEventListener('click', () => { $('updateReload').disabled = true; chrome.storage.local.set({ [SRC.REOPEN]: { page: 'popup', at: Date.now() } }).then(() => chrome.runtime.reload()); });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'session') {
      if(has(changes,'nakaHistoryProgress')&&state.historyPending){state.status=changes.nakaHistoryProgress.newValue;renderStatus(I.pick(state.lang));}
      if (has(changes, SRC.SESSION_VISIBLE)) { state.visibleAt = changes[SRC.SESSION_VISIBLE].newValue; render(); }
      return;
    }
    if (area !== 'local') return;
    if(has(changes,A.WEEKS))rewardWeeks=changes[A.WEEKS].newValue;if(has(changes,HOLD.LEFT))leftPieces=changes[HOLD.LEFT].newValue;if(has(changes,HOLD.LEFT_SEEN))leftSeen=changes[HOLD.LEFT_SEEN].newValue;if(has(changes,HOLD.EVENTS))holdingEvents=changes[HOLD.EVENTS].newValue;if(has(changes,HOLD.META))holdingsMeta=changes[HOLD.META].newValue;
    if(has(changes,A.KEY))rewardWeek=changes[A.KEY].newValue;if(has(changes,A.STATUS))rewardStatus=changes[A.STATUS].newValue;if(has(changes,A.OBSERVED))officialReadings=changes[A.OBSERVED].newValue;
    if(has(changes,EXP.KEY)) comparisonIds=EXP.normalize(changes[EXP.KEY].newValue);
    if(has(changes,HOLD.KEY)) holdings=HOLD.normalize(changes[HOLD.KEY].newValue);
    if(has(changes,HOLD.TEAM)) team=HOLD.mates(changes[HOLD.TEAM].newValue);
    if (has(changes, I.STORAGE_KEY)) state.lang = I.resolveLang(changes[I.STORAGE_KEY].newValue);
    if (has(changes, K.live)) state.live = changes[K.live].newValue;
    if (has(changes, K.closing)) state.closing = changes[K.closing].newValue;
    if (has(changes, K.liveStatus)) state.liveStatus = changes[K.liveStatus].newValue;
    render();
  });

  $('compare').addEventListener('click',()=>chrome.runtime.sendMessage({type:'shn-open-compare',section:'compare'}));
  $('holdingsManage').addEventListener('click',()=>chrome.runtime.sendMessage({type:'shn-open-compare',section:'holdings'}));
  $('holdingsMore').addEventListener('click',()=>{state.holdingsOpen=!state.holdingsOpen;render();});
  $('tabbar').addEventListener('click',(e)=>{const b=e.target instanceof Element?e.target.closest('button[data-view]'):null;if(b)setView(b.dataset.view);});
  $('raiseFull').addEventListener('click',()=>chrome.runtime.sendMessage({type:'shn-open-compare',section:'planner'}));
  $('searchOpen').addEventListener('click',showSearch);
  for(const button of [$('holdingsAdd'),$('emptyAdd')])button.addEventListener('click',()=>openAdd('holding'));
  /** Copy all numbers: every holding's number, ascending and comma-separated, ready to paste into Add elsewhere. The label
   * shows the outcome for a moment; a render in between keeps it. */
  let copyNote = null, copyTimer = 0;
  function paintCopy(c) { const b = $('holdingsCopy'); b.textContent = copyNote === null ? c.copyAll : copyNote.ok ? c.copyAllDone(copyNote.n) : c.copyAllFailed; b.title = c.copyAllHint; }
  $('holdingsCopy').addEventListener('click', async () => {
    const snap = SRC.choose({ live: state.live, closing: state.closing }, BUNDLED).snap, numbers = HOLD.current(snap, holdings).ids.map((id) => snap.items[id][0]).sort((a, b) => a - b);
    try { await navigator.clipboard.writeText(numbers.join(', ')); copyNote = { ok: true, n: numbers.length }; } catch { copyNote = { ok: false }; }
    paintCopy(globalThis.NakaExploreUI.pick(state.lang)); clearTimeout(copyTimer);
    copyTimer = setTimeout(() => { copyNote = null; paintCopy(globalThis.NakaExploreUI.pick(state.lang)); }, 1600);
  });
  $('addForm').addEventListener('submit',async(e)=>{e.preventDefault();const out=await(state.addKind==='holding'?addHolding:addCompare)($('addInput').value);if(!out.message){$('addDialog').close();return;}$('addError').textContent=out.message;if(out.added){$('addInput').value='';$('addInput').removeAttribute('aria-invalid');}else{$('addInput').setAttribute('aria-invalid','true');$('addInput').select();}});
  $('addCancel').addEventListener('click',()=>$('addDialog').close());
  // Add takes several numbers at once: room for all of them, and the line breaks of a pasted list become separators.
  globalThis.NakaExploreUI.listField($('addInput'));
  $('statusStrip').addEventListener('click',()=>setView('block'));
  $('compareAdd').addEventListener('click',()=>openAdd('compare'));
  $('lookupPlan').addEventListener('click', () => chrome.runtime.sendMessage({ type: 'shn-open-compare', section: $('lookupPlan').dataset.section }));
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

  let boundaryKey='';
  function renderBoundaries(T){
    const valid=[state.live,BUNDLED].filter(s=>SRC.compatibleSnapshot(s,BUNDLED));
    const tip=state.rewardClock?.height??Math.max(...valid.map(s=>s.snapshot.indexerHeight)),clock=state.rewardClock??valid.filter(s=>I.blockTimestamp(s.snapshot)!==null).sort((a,b)=>b.snapshot.height-a.snapshot.height)[0]?.snapshot;
    $('boundaryClock').textContent=T.boundaryReference(I.int(tip));
    const key=`${state.lang}|${tip}|${clock?.height}|${I.blockTimestamp(clock??{})}|${Math.floor(Date.now()/60000)}`;if(key===boundaryKey)return;boundaryKey=key;
    const select=$('rewardBoundary'),value=select.value,placeholder=el('option','',T.boundaryChoose);placeholder.value='';
    const past=el('optgroup',''),future=el('optgroup','');past.label=T.boundaryPast;future.label=T.boundaryFuture;
    const points=R.rewardBoundaries();
    for(const b of [...points.filter(b=>b.height<=tip).sort((a,b)=>b.height-a.height),...points.filter(b=>b.height>tip)]){
      const label=b.kind==='launch'?T.boundaryLaunch:T.boundaryWeek(b.week),o=el('option','',`${label} · ${I.int(b.height)}`);o.value=String(b.height);
      if(b.height>tip){o.disabled=true;const ts=I.blockTimestamp(clock??{}),time=ts===null?null:(ts+(b.height-clock.height)*600)*1000,eta=time===null||time<Date.now()?T.launchUnknown:T.launchDate(localTime(time));o.textContent+=` · ${T.boundaryDistance(I.int(b.height-tip),eta)}`;future.append(o);}else past.append(o);
    }
    select.replaceChildren(placeholder,past,future);select.title=T.quarterUnconfirmed;select.value=value;
  }
  /** One-time lookup of a number at a past block: the worker rebuilds that block locally; Live data stays as it is. The
   * dialog is complete on its own: the number comes over from the lookup field (empty when that is) and can be changed
   * here; focus goes to the number while it is not a valid one, otherwise to the block height (the current block, so no
   * reward week is chosen). */
  function openHistoryDialog(){state.localError=null;state.status=undefined;state.pendingLookup=null;const selected=SRC.choose({live:state.live,closing:state.closing},BUNDLED).snap,raw=$('lookupNumber').value,n=LOOKUP.parseNumber(raw);$('syncHeight').value=String(selected.snapshot.height);$('rewardBoundary').value='';$('historyNumber').value=n===null?raw.trim():String(n);$('historyNumber').removeAttribute('aria-invalid');boundaryKey='';$('fixedDialog').showModal();render();const first=n===null?$('historyNumber'):$('syncHeight');first.focus();first.select();chrome.runtime.sendMessage({type:'shn-reward-clock'}).then(c=>{if(c?.ok&&Number.isSafeInteger(c.height)&&c.height>=0){state.rewardClock=c;boundaryKey='';if($('fixedDialog').open)renderBoundaries(I.pick(state.lang));}}).catch(()=>{});}
  $('historyLookup').addEventListener('click',openHistoryDialog);
  $('rewardBoundary').addEventListener('change',()=>{if($('rewardBoundary').value)$('syncHeight').value=$('rewardBoundary').value;});
  $('fixedCancel').addEventListener('click',()=>{if(!state.historyPending){state.pendingLookup=null;$('fixedDialog').close();$('historyLookup').focus();}});
  $('fixedDialog').addEventListener('cancel',e=>{if(state.historyPending)e.preventDefault();});

  function beat(){if(document.visibilityState==='visible'&&chrome.runtime.id)chrome.runtime.sendMessage({type:'shn-visible'}).catch(()=>{});}
  beat();setInterval(beat,SRC.HEARTBEAT_MS);document.addEventListener('visibilitychange',beat);

  $('langSwitch').addEventListener('click', (e) => {
    const b = e.target instanceof Element ? e.target.closest('button[data-lang]') : null;
    if (b && b.dataset.lang !== state.lang) chrome.storage.local.set({ [I.STORAGE_KEY]: b.dataset.lang });
  });

  /** One result in the sheet. Opened on the search page, Back returns there; opened from a holdings tile, Back closes. */
  function showLookup(raw) {
    if (state.sheet !== 'result') state.resultFrom = state.sheet;
    state.sheet = 'result'; state.lookupHistorical = false; state.lookupSnapshot = null; state.lookupRaw = raw;
    render(); $('sheetScroll').scrollTop = 0;
  }
  $('lookupForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const raw = $('lookupNumber').value, number = LOOKUP.parseNumber(raw), text = number === null ? raw : String(number);
    if (number !== null) $('lookupNumber').value = String(number);
    // After a past-block lookup the button reads “Inspect block”: the next number is looked up at that same block.
    if (state.lookupHistorical && state.lookupSnapshot) { state.lookupRaw = text; render(); return; }
    showLookup(text);
  });
  // Back: a result opened on the search page returns there (its number kept, ready to change); otherwise the sheet closes.
  $('lookupBack').addEventListener('click', () => { if (state.sheet === 'result' && state.resultFrom === 'search') showSearch(); else closeSheet(); });
  // Escape closes the sheet; an open dialog takes its own Escape, and text being composed keeps it.
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !e.isComposing && state.sheet !== null && !$('addDialog').open && !$('fixedDialog').open) { e.preventDefault(); closeSheet(); } });
  $('lookupNumber').addEventListener('input', () => {
    state.lookupRaw=null;
    renderLookup(I.pick(state.lang),state.lookupHistorical&&state.lookupSnapshot?state.lookupSnapshot:SRC.choose({live:state.live,closing:state.closing},BUNDLED).snap);
  });

  $('syncForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    // Checked in the order shown: the number, then the block height; the field in error takes focus.
    const n = LOOKUP.parseNumber($('historyNumber').value), raw = $('syncHeight').value.trim(), wrong = (error, field) => { state.localError = error; render(); field.focus(); field.select(); };
    if (n === null) { $('historyNumber').setAttribute('aria-invalid', 'true'); wrong('lookupInvalid', $('historyNumber')); return; }
    $('historyNumber').value = String(n); $('historyNumber').removeAttribute('aria-invalid');
    if (raw === '') { wrong('fixedRequired', $('syncHeight')); return; }
    if (!/^\d+$/.test(raw) || !Number.isSafeInteger(Number(raw))) { wrong('syncBadHeight', $('syncHeight')); return; }
    state.pendingLookup=n;
    state.historyPending=true;state.status={state:'running',stage:'state'};state.localError=null;render();
    let res;try{res=await chrome.runtime.sendMessage({ type: 'shn-history', height: Number(raw) });}catch{res={ok:false,error:'unreachable'};}
    if(res.ok&&SRC.compatibleSnapshot(res.snapshot,BUNDLED)){state.historyPending=false;state.lookupSnapshot=res.snapshot;state.lookupHistorical=true;state.lookupRaw=String(state.pendingLookup);$('lookupNumber').value=state.lookupRaw;if(state.sheet!=='result')state.resultFrom=state.sheet;state.sheet='result';state.pendingLookup=null;$('fixedDialog').close();render();$('sheetScroll').scrollTop=0;
      // The dialog returns focus to its opener, which the result has hidden or rebuilt: the number field takes it, ready for the next number at this block.
      $('lookupNumber').focus({preventScroll:true});return;}
    state.historyPending=false;state.pendingLookup=null;
    if (res.error === 'busy') state.localError = 'syncBusy';
    else if (res.error === 'unreachable') state.localError = 'workerUnreachable';
    else{state.localError=null;state.status={state:'error',kind:res.error??'data',message:res.message??''};}
    render();
  });

})();
