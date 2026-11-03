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
  const A=globalThis.NakaRewards;let rewardWeek, rewardStatus, officialReadings, rewardWeeks, leftPieces, leftSeen, holdingEvents, holdingsMeta, walletAbsent;
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
  /** A change's direction as its figure is shown (NakaExploreUI.trend): up, down, same or unknown. */
  const trend = (d) => globalThis.NakaExploreUI.trend(d);
  /** Estimated browser-local times, to the minute (header time + 10 minutes a block). */
  const localTime = (ms) => I.localTime(ms);

  // 当前状态：语言、本地同步的快照、同步状态；任一变化都整体重画（弹窗内容很少，重画开销可以忽略）
  const state = {
    lang: I.DEFAULT_LANG, status: undefined, localError: null,
    // sheet: the Look up layer over the tab — null (closed), 'search' or 'result'. resultFrom: where a result was opened,
    // 'search' (Back returns there) or null (a holdings tile: Back closes). opener: that tile's ID, null for the magnifier.
    view: new URLSearchParams(location.search).get('view')==='block'?'block':'home', sheet: null, resultFrom: null, opener: null, holdingsOpen: false, addKind: null, fresh: null,
    lookupRaw: null, lookupSnapshot:null, lookupHistorical:false, historyPending:false, pendingLookup:null,rewardClock:null, live: undefined, liveStatus: undefined, visibleAt: undefined,
    // Whether the worker runs this code (SRC.BUILD): null until it answers.
    workerCurrent: null,
    // The block the worker is reading now (SRC.SESSION_UPDATING), undefined while it reads none.
    updating: undefined,
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
      b.querySelector('.tab-icon').replaceChildren(icon(b.dataset.view));
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
      // The last line: the illustrated guide to the protocol, in the page's language, and the community group on Telegram.
      $('guideLink').textContent = cc.guideLink; $('guideLink').href = globalThis.NakaExploreUI.GUIDE[state.lang];
      $('tgJoin').textContent = cc.tgJoin; $('tgJoin').href = globalThis.NakaExploreUI.TELEGRAM;
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

  /** 与内容脚本同一规则（SRC.choose）：显示的是页面此刻正在用的那份数据。 Block tab hero: the block, how fresh it is, this
   * week's progress and three figures that appear nowhere else (floor, listings, reward week). */
  function renderSnapshot(T) {
    const { snap, source } = SRC.choose({ live: state.live, closing: state.closing }, BUNDLED);
    const s = snap.snapshot, cc = globalThis.NakaExploreUI.pick(state.lang), W = R.RULES;
    $('heightLabel').textContent = cc.blockLabel;
    $('currentHeight').replaceChildren(el('span', 'sr-only', I.int(s.height)), PIXEL.digits(I.int(s.height), 'pixel-height'));
    $('currentHeight').setAttribute('aria-label', I.int(s.height));
    $('snapSource').textContent = T.srcBundled; $('snapSource').hidden = source !== 'bundled'; // Live is the normal case; only bundled data adds information.
    $('blockAge').textContent = I.blockAgeShort(T, s); $('blockAge').title = I.blockTimeTitle(T, s);
    // The chain clock (a newer /pulse height) refines the countdown only while it is in the same reward phase and week as the
    // data shown; otherwise every figure follows the data's own block, so the hero never contradicts itself.
    const own=R.rewardPhase(s),ahead=state.rewardClock?.height>s.height?R.rewardPhase(state.rewardClock):null,same=ahead!==null&&ahead.state===own.state&&ahead.index===own.index;
    const clock=same?state.rewardClock:s,phase=same?ahead:own;
    const active = phase.state === 'active', ended = ['ended', 'closed'].includes(phase.state), into = active ? clock.height - phase.first + 1 : ended ? W.weekBlocks : 0;
    $('weekBar').firstElementChild.style.width = `${Math.min(1, into / W.weekBlocks) * 100}%`;
    // Right of the height: the reward week and how far into it this block is (the bar under both shows the same).
    $('weekNow').textContent = active ? cc.weekOf(phase.week, W.weeks) : ended ? cc.weeksOver : cc.weeksBefore;
    $('weekNow').parentElement.title = [...globalThis.NakaPurchase.renderLaunch(clock, T, I).children].map((n) => n.textContent).join('\n');
    $('weekBlocks').textContent = active || ended ? cc.blocksInto(I.int(into), I.int(W.weekBlocks)) : '';
    $('weekBlocks').title = cc.weekBlocksHint;
    // Three figures of this block: the floor, the listings, and what a 100% weight earns in a week now (the unit every
    // listing's "+38.78 / week" is measured against).
    const K = R.programmeUnits(snap), per100 = globalThis.NakaExploreUI.shn(R.weeklyAllocation({ lo: 4, hi: 4 }, K));
    const stats = [[cc.floorLabel, I.btc(s.collectionFloor), 'BTC', null], [cc.listingsShort, I.int(s.listings), null, null], [cc.per100Week, per100, null, cc.per100Hint]];
    $('snap').replaceChildren(...stats.map(([label, value, unit, hint]) => { const row = el('div', 'bh-stat'), dd = el('dd'); dd.append(el('span', 'sr-only', value), PIXEL.digits(value, 'stat-pixels')); if (unit) dd.append(el('span', 'stat-unit', unit)); row.append(el('dt', '', label), dd); if (hint) row.title = hint; return row; }));
    $('snap').dataset.source = source;
    const note = I.measureNote(T, s.height);
    $('measureNote').textContent = T.inspectProvisional;
    $('measureNote').title = note ?? '';
    $('measureNote').hidden = note === null;
    const now = phase.state === 'active' ? T.rewardWeek(phase.week, W.weeks) : phase.state === 'boundary' ? T.firstRewardAtBlock : phase.state === 'closed' ? T.rewardClosed : T.completedWeeks;
    // Home: one quiet line says which block the figures use, how fresh it is and whether a newer one is on its way; it opens
    // the Block tab. Built once and written in place, so its pixels keep their rhythm through every render.
    const kind = $('liveState').className.match(/live-state--(\w+)/)?.[1] ?? 'muted', strip = $('statusStrip');
    if (!strip.firstChild) { const lead = el('span', 'strip-lead'); lead.append(el('i'), el('b'), el('span'), el('span', 'strip-age'), PIXEL.busy('strip-busy', '')); strip.append(lead, el('span', 'strip-next')); }
    const [dot, mode, chip, age, busy] = strip.firstChild.children;
    dot.className = `strip-dot strip-dot--${kind}`; mode.textContent = source === 'live' ? T.modeLive : T.srcBundled; chip.textContent = cc.blockChip(I.int(s.height)); age.textContent = I.blockAgeShort(T, s);
    paintUpdating(busy, cc); paintUpdating(blockBusy, cc);
    strip.lastChild.textContent = `${phase.state === 'before' ? cc.stripStart(I.int(phase.remaining)) : now} ›`;
    // The word after the pixels shows only while the whole line still fits; otherwise the pixels stay alone (their title
    // keeps the sentence), and only then does the data's label give way.
    const word = busy.querySelector('.naka-busy__text'); word.hidden = false;
    if (!busy.hidden && (mode.scrollWidth > mode.clientWidth || strip.firstChild.scrollWidth > strip.firstChild.clientWidth)) word.hidden = true;
    strip.title = $('liveState').title;
    state.blockClock = clock;
    return snap;
  }

  /** "Updating" pixels beside a block or its age: shown while the worker reads a newer block (state.updating), which the
   * title names; the word after them, where there is one, follows the language. */
  function paintUpdating(node, cc) {
    const height = state.updating?.height;
    node.hidden = height === undefined; node.title = height === undefined ? '' : cc.updatingTip(I.int(height));
    const word = node.querySelector('.naka-busy__text'); if (word) word.textContent = cc.updating;
  }

  /** 实时同步：开关状态、最近一次检查结果；失败时说明原因、多久后重试、页面正在用哪份数据，并给出技术细节。 */
  function renderLive(T) {
    const st = SRC.statusOf(state.liveStatus, 'live'), cc = globalThis.NakaExploreUI.pick(state.lang);
    const now = Date.now();
    const live = SRC.compatibleSnapshot(state.live, BUNDLED) ? state.live : undefined;
    const dataLine = live === undefined ? null : T.liveOk(I.int(live.snapshot.height), I.blockAge(T,live.snapshot,now));
    const visible = state.visibleAt !== undefined && now - state.visibleAt <= SRC.VISIBLE_MS;
    // label: the short line beside the mode buttons; tip: the full explanation on hover.
    let kind, label, tip;
    if (st !== undefined && st.state === 'error') {
      kind = 'error';
      const named = st.kind === 'syncing' || st.kind === 'rate-limit' || st.kind === 'network' || st.kind === 'data' || typeof st.apiError !== 'string';
      label = T.liveFail((named ? T.failReason[st.kind] : st.apiError) + (st.status === null ? '' : T.httpCode(st.status)), st.waitMin);
      tip = st.kind === 'syncing' ? T.liveSyncingTip : T.liveErrorTip;
    } else if (dataLine === null) { kind = 'muted'; label = visible ? cc.liveChecking : cc.livePausedShort; tip = visible ? T.liveWaiting : T.livePaused; }
    // The block hero has room for one word: the full sentence is its tooltip.
    else { kind = visible ? 'ok' : 'muted'; label = visible ? T.modeLive : cc.livePausedShort; tip = visible ? `${T.liveWatching} · ${dataLine}` : `${T.livePaused} · ${dataLine}`; }
    const box = $('liveState');
    box.replaceChildren(document.createTextNode(label));
    if (st !== undefined && st.state === 'error') {
      const retry = el('button', 'live-retry', T.retryNow); retry.type = 'button';
      retry.addEventListener('click', () => chrome.runtime.sendMessage({ type: 'shn-retry' }));
      box.append(retry);
    }
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
      globalThis.NakaPurchase.paintBasis(basis,snap.snapshot,T,I);
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
    // Rebuilt only when its inputs change: the block, the number, language, mode, my holdings, this piece's own records
    // (public events and recorded intervals) and the listings already closing (the single-sale model computes in the next
    // block's world, without them).
    const key = found === null ? '' : `${snap.snapshot.height}|${snap.snapshot.generatedAt}|${state.lookupRaw}|${state.lang}|${state.lookupHistorical}|${rewardWeek?.height}|${JSON.stringify(officialReadings)}|${holdings.join()}|${JSON.stringify(holdingEvents?.rows?.[found.id]??null)}|${JSON.stringify(state.ledger?.runs?.[found.id]??null)}|${JSON.stringify(snap.closing ?? [])}`;
    if (key === lookupKey) {
      for(const n of $('lookupResult').querySelectorAll('.lookup-basis--time')) { n.textContent=T.lookupBasis(I.blockBasis(T,snap.snapshot)); n.title=I.blockTimeTitle(T,snap.snapshot); }
      return;
    }
    lookupKey = key;
    const box = $('lookupResult');
    const previousNumber=box.querySelector('.lookup-card')?.dataset.number,opened=[...box.querySelectorAll('details[open]')].map(d=>d.className);
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
      if (found.outOfRange) { box.append(el('p','lookup-message',T.lookupRange(found.first,found.last))); return; }
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
    // A listing already closing (bought and confirming, or being reclaimed) is said on the card before any figure.
    const closing=(snap.closing??[]).find(([id])=>id===found.id)?.[1]??null;
    const model=globalThis.NakaPurchase.create(snap,{action}),scenario=model.get(found.id);
    card.dataset.listing=found.listing;card.dataset.queryPurpose=state.lookupHistorical?'block':'purchase';
    const notice=scenario.state==='no-floor'?(action==='cancel'?T.cancelNoFloor:T.buyNoFloor):null;
    card.append(head,!state.lookupHistorical&&scenario.state==='ready'?globalThis.NakaPurchase.render(model,found.id,T,I,{explain:A.explainFor(snap,found.id,state.lang,action),closing,snap,id:found.id,sales:!state.lookupHistorical}):globalThis.NakaPurchase.renderCurrent(r,snap.snapshot,T,I,{notice:state.lookupHistorical?null:notice,explain:A.explainFor(snap,found.id,state.lang),listing:found.listing,closing,credits:globalThis.NakaPurchase.relayCredits(snap,found.id),snap,id:found.id,status:held?A.portfolio(snap,[found.id],rewardWeek,officialReadings,holdingEvents,state.ledger).rows[0]??null:null,sales:!state.lookupHistorical}));
    const purchase=card.querySelector('.naka-purchase');
    const mode=el('button','lookup-mode');mode.type='button';mode.addEventListener('click',openHistoryDialog);
    // The mode chip (live, or a historical block) sits beside the listing state at the top of the hero's right column.
    purchase.querySelector('.naka-hero .naka-listing').append(mode);
    // My holdings: a listed NFT shows what buying it does; one of my listed holdings shows what delisting does. Not for a
    // listing already closing — nobody can buy it, and one of mine being bought sells at the next block — except my own
    // reclaim under way, which is what happens.
    const effect=closing===null||closing==='cancel'&&action==='cancel';
    if(!state.lookupHistorical&&holdings.length&&found.listing==='listed'&&effect){const x=HOLD.impact(snap,holdings,found.id,action,model);if(x.state==='ready')card.append(globalThis.NakaExploreUI.holdingsLine(x,globalThis.NakaExploreUI.pick(state.lang)));}
    box.append(card);if(previousNumber===String(found.number))for(const d of box.querySelectorAll('details'))if(opened.includes(d.className))d.open=true;
  }

  /** Home: the weekly SHNAKAS figure is the one hero number; every holding follows as a tile with its number, weight
   * (as the official endpoint reports it) and weekly SHNAKAS (0 while listed). Without holdings, a centred first-run
   * prompt takes the whole view. Adding a number uses a small dialog. */
  const TILE_COLUMNS = 3, TILE_ROWS = 3;
  // One artwork element per NFT, reused by every render: moving it keeps the decoded image, so a data refresh never flashes.
  const artFor = globalThis.NakaExploreUI.artStore();
  let holdingsKey = '';
  // My holdings' order: the one choice the extension page and this popup share (NakaPortfolio, this extension's
  // localStorage). A refresh while the pointer is on the tiles keeps the order shown, new pieces at the end, until it leaves;
  // a choice made in the menu applies at once.
  let holdingsOrder = null, holdingsSortNow = false, holdingsSortWait = null;
  const holdingsSort = () => { let raw = null; try { raw = localStorage.getItem(HOLD.SORT_KEY); } catch { raw = null; } return HOLD.sortChoice(raw); };
  const holdingsSortLater = () => { if (holdingsSortWait) return; holdingsSortWait = setInterval(() => { if ($('holdingsTiles').matches(':hover')) return; clearInterval(holdingsSortWait); holdingsSortWait = null; holdingsKey = ''; render(); }, 400); };
  function renderHoldings(snap) {
    const c = globalThis.NakaExploreUI.pick(state.lang), U = globalThis.NakaExploreUI, own = HOLD.current(snap, holdings);
    let missing=$('holdingsMissing');if(!missing){missing=el('p','hc-how');missing.id='holdingsMissing';missing.setAttribute('role','status');$('holdingsEmpty').before(missing);}missing.hidden=!own.missing;missing.textContent=c.holdingsWaiting(own.missing);
    // Everything the tiles and the hero read: the week's table and readings, finished weeks, left pieces, my holdings'
    // records and anchors (the same block can carry new records for a holding just added), language, data, my listings
    // already closing (their status says so) and layout.
    const mineRows = own.ids.map(id => JSON.stringify([holdingEvents?.rows?.[id] ?? null, holdingsMeta?.[id] ?? null])).join(';');
    const key = `${rewardWeek?.height}|${rewardStatus?.state}|${rewardStatus?.reason}|${JSON.stringify(officialReadings)}|${JSON.stringify(rewardWeeks?.weeks??{})}|${JSON.stringify(leftPieces)}|${JSON.stringify(leftSeen)}|${holdingEvents?.height}|${mineRows}|${state.lang}|${snap.snapshot.height}|${snap.snapshot.generatedAt}|${JSON.stringify(snap.closing ?? [])}|${own.ids.join()}|${state.holdingsOpen}|${state.fresh ? [...state.fresh].join() : ''}|${JSON.stringify([...confirmErrors])}|${JSON.stringify(walletAbsent)}|${[...absentErrors].join()}`;
    if (key + `|${JSON.stringify(holdingsSort())}` === holdingsKey) return;
    holdingsKey = key + `|${JSON.stringify(holdingsSort())}`;
    const empty = !holdings.length, phase = R.rewardPhase(snap.snapshot);
    document.querySelector('.holdings-hero').hidden = empty; $('holdingsList').hidden = empty; $('holdingsEmpty').hidden = !empty;
    const history = A.history(snap, own.ids, leftPieces, holdingEvents, A.weeks(rewardWeeks), phase, holdingsMeta);
    // First run previews the result: the weekly figure at zero and one row of three empty tiles, then the ways to fill them. When the
    // last holding sold, the line about this week's sales stays, above that card.
    if (empty) { const zero = el('span', 'hc-value'); zero.append(PIXEL.digits('0.00', 'hc-pixels'), el('span', 'hc-unit', c.weekUnit)); $('emptyFigure').replaceChildren(zero); paintNotes(c, [], history, phase, true); return; }
    $('holdingsTitle').textContent = c.holdings; $('tilesTitle').textContent = c.tilesTitle(own.ids.length);
    $('holdingsManage').textContent = c.manage; $('holdingsManage').title = c.manageHint;
    const a = own.allocation;
    const ledgerStore={[A.KEY]:rewardWeek,[A.WEEKS]:rewardWeeks,[HOLD.EVENTS]:holdingEvents,[HOLD.META]:holdingsMeta,[HOLD.LEFT]:leftPieces,[NakaLedger.KEY]:state.ledger};
    const rewards = A.render(snap, own.ids, rewardWeek, officialReadings, state.lang, { share: a.share, status: rewardStatus, history, events: holdingEvents, savedIds:holdings, ledger:state.ledger, completed:NakaLedgerUI.completedReport(snap,holdings,ledgerStore) });
    $('holdingsFigure').replaceChildren(rewards.element);
    // A sale only the owner can attribute stays among the holdings, asked about above the tiles; any other sale of a holding
    // moved it to Left already (the worker reads it from the public records), said there while that week lasts.
    const asks = new Map(own.ids.map((id) => [id, HOLD.saleToConfirm(snap, id, holdingEvents?.rows?.[id], holdingsMeta?.[id], A.tile(rewards.data, id, state.lang).row.reason)]).filter(([, x]) => x !== null));
    // Holdings the Wallet page showed no row of at the last sync (maybe sent away privately) are asked about the same way.
    const absent = HOLD.absentOf(walletAbsent), absentIds = absent === null ? [] : absent.ids.filter((id) => own.ids.includes(id) && !absent.dismissed.includes(id));
    paintNotes(c, [...[...asks].map(([id, x]) => confirmNote(c, snap.items[id][0], id, x)), ...absentIds.map((id) => absentNote(c, snap.items[id][0], id))], history, phase, false);
    const cancel = globalThis.NakaPurchase.create(snap, { action: 'cancel' }), limit = TILE_ROWS*TILE_COLUMNS, sort = holdingsSort();
    const sorted = HOLD.sortIds(own.ids, HOLD.sortFacts(snap, own.ids, new Map(rewards.data.rows.map((row) => [row.id, row])), cancel, a.all), sort), kept = holdingsOrder ? holdingsOrder.filter((id) => own.ids.includes(id)) : [];
    const visible = !holdingsSortNow && holdingsOrder && $('holdingsTiles').matches(':hover') ? [...kept, ...sorted.filter((id) => !kept.includes(id))] : sorted;
    if (visible.join() !== sorted.join()) holdingsSortLater(); holdingsSortNow = false; holdingsOrder = visible;
    const folded = !state.holdingsOpen && visible.length > limit;
    // The sort: a button per order, as on the extension page; the shared choice is lit with its direction and pressing it
    // again reverses it. Built once per language and only restated after, so the button just pressed keeps the focus.
    // Shown once there is something to sort.
    const bar = $('holdingsSort');
    if (bar.dataset.lang !== state.lang) {
      bar.replaceChildren(el('span', 'hc-sort-label', c.sortLabel), ...Object.keys(HOLD.SORTS).map((by) => { const b = el('button', 'hc-sort-btn'); b.type = 'button'; b.dataset.sort = by; b.append(el('span', '', c.sortBy[by]), el('span', 'hc-sort-dir')); return b; }));
      bar.setAttribute('aria-label', c.sortLabel); bar.dataset.lang = state.lang;
    }
    for (const b of bar.querySelectorAll('.hc-sort-btn')) {
      const by = b.dataset.sort, on = sort.by === by, dir = on ? sort.dir : HOLD.SORTS[by];
      b.setAttribute('aria-pressed', String(on)); b.querySelector('.hc-sort-dir').textContent = on ? (dir === 'asc' ? '↑' : '↓') : ''; b.title = c.sortHint(by, dir) + (on ? c.sortReverse : '');
    }
    bar.hidden = own.ids.length < 2;
    $('holdingsTiles').replaceChildren(...(folded ? visible.slice(0, limit) : visible).map((id) => {
      const number = snap.items[id][0], listed = globalThis.NakaPurchase.listingStatus(snap, id) === 'listed', r = R.evaluateSnapshot(snap, id);
      const weekly = listed ? null : R.weeklyAllocation(R.units(r), a.all), view = A.tile(rewards.data, id, state.lang), status = view.row.status;
      let delist = '';
      if (listed) { const x = HOLD.impact(snap, holdings, id, 'cancel', cancel); if (x.state === 'ready') delist = `\n${c.afterDelist}: ${R.formatWeight(x.scenario.result)} · ${c.perWeek(U.shn(x.allocation.piece))}`; }
      const tile = el('button', 'hc-tile'); tile.type = 'button'; tile.dataset.id = id; tile.dataset.status = status;
      if (listed) tile.classList.add('is-listed'); if (state.fresh?.has(id)) tile.classList.add('is-new');
      const earnsNone = ['paused', 'gone', 'ended', 'unknown'].includes(status);
      const ask = asks.get(id) ?? null, askLine = ask === null ? '' : `\n${c.confirmSale(number, I.int(ask.listedAt), I.int(ask.soldAt))} ${c.confirmAsk}`;
      const art = el('span', 'hc-art'); art.append(artFor(snap, id, 'hc-fallback', 'tile'));
      if (listed) art.append(el('span', 'hc-tag', c.listedTag));
      // Caption: number and weight, this week's SHNAKAS (or what the week is for this piece), then the two estimates: a full
      // week and the rest of the programme at this block's conditions. Every line is always there, so tiles never change
      // height while figures load.
      const idle = status === 'idle', amount = listed ? 0 : idle ? null : view.amount, earning = !listed && !idle && !earnsNone && status !== 'waiting';
      const earn = el('b', 'hc-earn', listed ? c.noReward : idle ? U.shn(weekly) : earning ? (amount === null ? '0.0000' : A.format(amount)) : view.label || '—');
      if (listed) earn.classList.add('hc-earn--listed'); else if (!earning && !idle) earn.classList.add('hc-earn--state');
      if (earning && amount === null) earn.classList.add('is-blank');
      const caption = el('span', 'hc-caption');
      const forecast = listed || earnsNone ? null : globalThis.NakaMining.forecast(snap, id, { action: 'hold', status: view.row }), ready = forecast?.state === 'ready';
      const perWeek = ready ? U.shn(forecast.weekly) : '—', rest = ready && forecast.remaining !== null ? U.shn(forecast.remaining) : '—';
      const idRow = el('span', 'hc-id'); idRow.append(el('span', 'hc-number', `#${number}`), el('span', `hc-weight naka-tone-${TIER.tierOf(r)}`, R.formatWeight(r)));
      const rates = el('dl', 'hc-rates'), rate = (label, value) => { const d = el('div'); d.append(el('dt', '', label), el('dd', value === '—' ? 'is-none' : '', value)); rates.append(d); };
      rate(c.tileWeekly, perWeek); rate(c.tileRemaining, rest);
      if (ask !== null) art.append(el('span', 'hc-tag hc-tag--ask', c.toConfirm));
      const lines = [`#${number} · ${R.formatWeight(r)}`, earning ? `${c.tileAccrued} ${earn.textContent} SHNAKAS` : listed ? c.noReward : view.label, `${c.tileWeekly} ${perWeek}`, `${c.tileRemaining} ${rest}`].filter(Boolean);
      tile.title = lines.join('\n') + delist + askLine + `\n${c.tileOpen}`;
      caption.append(idRow, earn, rates);
      tile.append(art, caption);
      // The second click of a double click is not a choice: a line above that closed on the first one moved this tile under
      // the pointer.
      tile.addEventListener('click', (ev) => { if (ev.detail > 1) return; state.opener = id; $('lookupNumber').value = String(number); showLookup(String(number)); $('lookupBack').focus(); });
      return tile;
    }));
    $('holdingsMore').hidden = visible.length <= limit;
    $('holdingsMore').textContent = state.holdingsOpen ? c.collapse : c.expandAll(visible.length);
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
  /** A holding the Wallet page showed no row of at the last sync: "It left" moves it to Left (the weeks it kept unknown),
   * "Still mine" keeps it and closes the question (shn-left, as on the extension page). A failed answer says so on its line. */
  const absentErrors = new Set();
  function absentNote(c, number, id) {
    const note = el('div', 'hc-note hc-note--ask'), answers = el('span', 'hc-note-actions');
    note.append(el('span', '', c.absentLine(number)));
    for (const [action, label] of [['gone', c.absentGone], ['keep', c.absentKeep]]) {
      const b = el('button', 'hc-note-btn', label); b.type = 'button'; b.dataset.focus = `${action}-${id}`;
      b.addEventListener('click', async () => { absentErrors.delete(id); let res = null; try { res = await chrome.runtime.sendMessage({ type: 'shn-left', action, id }); } catch { res = null; } if (!res?.ok) absentErrors.add(id); render(); });
      answers.append(b);
    }
    note.append(answers); if (absentErrors.has(id)) note.append(el('small', 'inline-error', c.absentFailed));
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
    const key = `${state.lang}|${snap.snapshot.height}|${snap.snapshot.generatedAt}|${comparisonIds.join()}|${holdings.join()}|${JSON.stringify(snap.closing ?? [])}`;
    if (key === compareKey) return; compareKey = key;
    const c = globalThis.NakaExploreUI.pick(state.lang), U = globalThis.NakaExploreUI, T = I.pick(state.lang), model = globalThis.NakaPurchase.create(snap), list = $('compareList');
    const rows = comparisonIds.map((id) => {
      const action='sale',e = EXP.entry(snap, model, id), row = el('div', 'compare-row');
      if (!e) { row.append(el('span', 'compare-missing', c.missing)); return row; }
      const open = el('button', 'compare-main'); open.type = 'button'; open.title = c.tileHint(e.number);
      open.addEventListener('click', () => { $('lookupNumber').value = String(e.number); showLookup(String(e.number)); });
      const info = el('span', 'compare-info');
      info.append(el('strong', '', `#${e.number}`), el('small', '', e.listing === 'listed' ? `${c.ask.split(' · ')[0]} ${I.btc(e.sale.price)} BTC` : c[e.listing]));
      // A listing already closing (bought, or being reclaimed) is marked as the market marks it and is nobody's to buy: no gain.
      if (e.closing !== null) { const tag = el('span', `compare-tag compare-tag--${e.closing}`, e.closing === 'sale' ? T.closingSaleTag : T.closingCancelTag); tag.title = e.closing === 'sale' ? T.closingSale : T.closingCancel; info.append(tag); }
      if (holdings.length && e.listing === 'listed' && e.closing === null && !holdings.includes(id)) { const x = HOLD.impact(snap, holdings, id, 'sale', model); if (x.state === 'ready') { const d = x.allocation.delta, g = el('small', 'compare-gain', c.forMeShort(U.shn(d, true))); g.dataset.change = trend(d); info.append(g); } }
      const f=NakaMining.forecast(snap,id,{action,scenario:e.sale,status:A.portfolio(snap,[id],null).rows[0]});
      // The piece's own weekly output once bought, and the week it starts: labelled, as the line above is.
      if(f.state==='ready'){const weekly=f.plan?.state==='ended'?'0.00':U.shn(f.weekly),zh=state.lang==='zh';info.append(el('small','compare-output',f.plan?.index===null?(zh?`这一枚每周 ${weekly}`:`This piece ${weekly} / wk`):zh?`这一枚每周 ${weekly} · 第 ${f.plan.index+1} 周起`:`This piece ${weekly} / wk · from week ${f.plan.index+1}`));}
      // After the sale of the market's last listing no collection floor is left: no weight to draw.
      const weight = el('span', 'compare-weight'); weight.append(el('small', '', e.listing === 'listed' ? c.after : c.holding)); const value = el('span');
      if (e.sale.state === 'no-floor') { value.className = 'compare-unavailable'; value.textContent = c.unavailable; value.title = c.noFloor; } else globalThis.NakaPurchase.decorateWeight(value, e.result, true);
      weight.append(value);
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
   * closing rows), and a card is rebuilt only when what it shows changes. While answers are computed every card waits in
   * its place: one on screen stays, dimmed, until its replacement is ready; before any, a placeholder card with blank rows.
   * The pixels after a waiting card's title say it is on its way, and how far its own answer has come. */
  const RAISE_ROWS = 2;
  const rankCache = { key: null, rows: null }, planCache = { key: null, plans: null, lock: null };
  // What the tab shows: a note ('empty', 'ended', 'error'), or 'cards': the four places of the answers (0 Best buy, 1 Reach
  // 400%, 2 Own a trait, 3 the Simulate line), each with the key of what it shows (null: a placeholder waiting for it).
  let raiseShown = { kind: null }, raiseJob = null;
  const raiseBases=new WeakMap();
  const raiseBasis=snap=>{if(!raiseBases.has(snap))raiseBases.set(snap,JSON.stringify(snap));return raiseBases.get(snap);};
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
    put($('raiseTitle'), 'textContent', c.navRaise); put($('raiseFull'), 'textContent', c.raiseFull); put($('raiseFull'), 'title', c.raiseFullHint); put($('raiseBasisText'), 'textContent', c.raiseBasis(I.int(snap.snapshot.height)));
    paintUpdating(raiseBusy, c);
    if (state.view !== 'raise' || state.sheet !== null) return;
    const own = HOLD.current(snap, holdings).ids, extra = extraIds(snap, own), box = $('raiseBody'), s = snap.snapshot;
    const note = !own.length ? 'empty' : ['ended', 'closed'].includes(R.rewardPhase(s).state) ? 'ended' : null;
    // The added numbers the answers count as ours, said under the basis line (the first five by number). One line, so the
    // cards below never move down; the title holds the whole line when it is cut short.
    const mates = note === null ? extra.map((id) => snap.items[id][0]).sort((a, b) => a - b) : [], scope = mates.length ? c.raiseScope(mates.length, mates.slice(0, 5).map((n) => `#${n}`)) : '';
    put($('raiseScope'), 'hidden', !mates.length); put($('raiseScope'), 'textContent', scope); put($('raiseScope'), 'title', scope);
    if (note !== null) {
      raiseJob = null;
      if (raiseShown.kind === note && raiseShown.lang === state.lang) return;
      raiseShown = { kind: note, lang: state.lang };
      if (note === 'ended') { box.replaceChildren(el('p', 'raise-note', c.raiseEnded)); return; }
      const empty = el('div', 'raise-empty'), add = el('button', 'btn', c.emptyAdd); add.type = 'button'; add.addEventListener('click', () => openAdd('holding')); empty.append(el('p', '', c.raiseEmpty), add); box.replaceChildren(empty); return;
    }
    // Every result is computed in the next block's world, without the listings already closing: any of them moves floors or K.
    const ours = new Set([...own, ...extra]), rankKey = `${raiseBasis(snap)}|${own.join()}`, planKey = `${rankKey}|${extra.join()}`;
    if (rankCache.key === rankKey && planCache.key === planKey) { raiseJob = null; showRaise(c, snap, ours); return; }
    const job = `${rankKey}#${planKey}`; if (raiseJob === job) return; raiseJob = job;
    // The answers about to change wait in their places; Best buy, when its ranking is kept, is shown at once.
    if (raiseShown.kind !== 'cards') raisePlaces(c);
    if (rankCache.key === rankKey) fillBuy(c, snap); else waiting(box.children[0]);
    if (planCache.key !== planKey) { waiting(box.children[1]); waiting(box.children[2]); }
    setTimeout(async () => {
      if (raiseJob !== job) return;
      if (state.view !== 'raise' || state.sheet !== null){raiseJob=null;return;}
      try{
      // One disposable derived entry survives popup closure. Hash every snapshot input (including same-height corrections).
      // Neither holdings nor their eligibility records are written or migrated by this cache.
      let cacheKey=null,cached=null;
      try{const bytes=new TextEncoder().encode(JSON.stringify(snap)),hash=await crypto.subtle.digest('SHA-256',bytes);cacheKey='v2|'+Array.from(new Uint8Array(hash),x=>x.toString(16).padStart(2,'0')).join('')+'|'+own.join()+'|'+extra.join();cached=(await chrome.storage.session.get('nakaExpansionView')).nakaExpansionView;}catch{/* Cache failure falls back to calculation. */}
      if(raiseJob!==job)return;
      if(cached?.format===2&&cached.key===cacheKey&&Array.isArray(cached.rows)&&Array.isArray(cached.plans)&&Array.isArray(cached.lock?.can)&&Array.isArray(cached.lock?.have)&&Array.isArray(cached.lock?.far)){
        Object.assign(rankCache,{key:rankKey,rows:cached.rows});Object.assign(planCache,{key:planKey,plans:cached.plans,lock:{...cached.lock,missing:t=>t.wanted.length+t.unminted.length}});
      }else{
        // Each answer goes in its card as soon as it is ready; the cards still waiting say how far theirs has come.
        if(rankCache.key!==rankKey){
          const rows=[],offers=snap.offers??[];
          for(let i=0;i<offers.length;i+=8){
            if(raiseJob!==job||state.view!=='raise'||state.sheet!==null){if(raiseJob===job)raiseJob=null;return;}
            raiseStage(0,c.raiseStageListings(i,offers.length));await new Promise(resolve=>setTimeout(resolve,0));rows.push(...HOLD.rank(snap,own,offers.slice(i,i+8)));
          }
          if(raiseJob!==job)return;Object.assign(rankCache,{key:rankKey,rows:rows.sort(HOLD.rankOrder)});
          fillBuy(globalThis.NakaExploreUI.pick(state.lang),snap);
        }
        if (planCache.key !== planKey){
          const targets=[...own,...extra],plans=[],pause=()=>new Promise(resolve=>setTimeout(resolve,0));
          for(let i=0;i<targets.length;i+=4){
            if(raiseJob!==job||state.view!=='raise'||state.sheet!==null){if(raiseJob===job)raiseJob=null;return;}
            raiseStage(1,c.raiseStagePlans(i,targets.length));
            await pause();plans.push(...PL.targetPlans(snap,{mine:own,mates:extra,targets:targets.slice(i,i+4)}));
          }
          if(raiseJob!==job||state.view!=='raise'||state.sheet!==null){if(raiseJob===job)raiseJob=null;return;}
          plans.sort(PL.targetPlanOrder);fill(1,`${state.lang}|${planKey}`,()=>planCard(globalThis.NakaExploreUI.pick(state.lang),snap,plans));
          const traits=[...new Set(targets.flatMap(id=>snap.items[id].slice(1)))],locks=[];
          for(let i=0;i<traits.length;i+=4){
            if(raiseJob!==job||state.view!=='raise'||state.sheet!==null){if(raiseJob===job)raiseJob=null;return;}
            raiseStage(2,c.raiseStageTraits(i,traits.length));await pause();
            locks.push(...PL.lockTraits(snap,targets,traits.slice(i,i+4)));
          }
          if(raiseJob!==job)return;
          Object.assign(planCache,{key:planKey,plans,lock:PL.lockGroups(locks.sort(PL.lockTraitOrder))});
        }
        if(cacheKey){
          const rows=rankCache.rows.map(x=>({id:x.id,price:x.price,impact:{allocation:x.impact.allocation}})),plans=planCache.plans.map(r=>({id:r.id,number:r.number,side:r.side,state:r.state,before:r.before,auto:r.auto,value:r.value,total:r.total,plan:r.plan?{cost:r.plan.cost,buys:r.plan.buys}:null}));
          const slim=t=>({idx:t.idx,type:t.type,value:t.value,held:t.held,supply:t.supply,wanted:Array(t.wanted.length).fill(0),unminted:Array(t.unminted.length).fill(0),owned:{state:t.owned.state,after:t.owned.after},monopoly:{state:t.monopoly.state,cost:t.monopoly.cost,buy:Array(t.monopoly.buy?.length??0).fill(0),reclaim:Array(t.monopoly.reclaim?.length??0).fill(0),total:t.monopoly.total,keepListed:t.monopoly.keepListed?{number:t.monopoly.keepListed.number,after:t.monopoly.keepListed.after,total:t.monopoly.keepListed.total}:null}}),lock=Object.fromEntries(['can','have','far'].map(k=>[k,planCache.lock[k].map(slim)]));
          try{await chrome.storage.session.set({nakaExpansionView:JSON.parse(JSON.stringify({format:2,key:cacheKey,rows,plans,lock}))});}catch{/* A full optional cache cannot affect user holdings or results. */}
        }
      }
      if(raiseJob!==job)return;raiseJob=null;
      renderRaise(SRC.choose({ live: state.live, closing: state.closing }, BUNDLED).snap);
      }catch{if(raiseJob!==job&&raiseJob!==null)return;raiseJob=null;rankCache.key=null;planCache.key=null;const retry=el('button','btn',state.lang==='zh'?'计算暂不可用 · 重试':'Calculation unavailable · Retry');retry.type='button';retry.addEventListener('click',()=>renderRaise(SRC.choose({live:state.live,closing:state.closing},BUNDLED).snap));box.replaceChildren(retry);raiseShown={kind:'error'};}
    }, 30);
  }
  /** The cards from the kept answers (`ours`: my holdings, then the numbers added), each in its place. */
  function showRaise(c, snap, ours) {
    if (raiseShown.kind !== 'cards') raisePlaces(c);
    fillBuy(c, snap);
    fill(1, `${state.lang}|${planCache.key}`, () => planCard(c, snap, planCache.plans));
    fill(2, `${state.lang}|${planCache.key}`, () => lockCard(c, snap, ours));
    fill(3, state.lang, () => simLink(c));
  }
  /** The four places, each card a placeholder waiting for its answer, and the Simulate line. */
  function raisePlaces(c) {
    $('raiseBody').replaceChildren(waitCard(c.raiseBuyTitle, 'planner-buy'), waitCard(c.raisePlanTitle, 'planner-plan'), waitCard(c.raiseLockTitle, 'planner-lock'), simLink(c));
    raiseShown = { kind: 'cards', keys: [null, null, null, state.lang] };
  }
  /** Puts an answer in its place: one whose key is unchanged stays on screen untouched and stops waiting; any other
   * replaces what is there (its earlier version or its placeholder). Returns the card shown. */
  function fill(i, key, make) {
    const was = $('raiseBody').children[i];
    if (raiseShown.keys[i] === key) { was.removeAttribute('aria-busy'); was.querySelector('.raise-busy')?.remove(); return was; }
    const card = make(); was.replaceWith(card); raiseShown.keys[i] = key; return card;
  }
  /** A card waits for its answer: what it shows dims, and pixels after its title say the answer is on its way. */
  function waiting(card) {
    card.setAttribute('aria-busy', 'true');
    if (!card.querySelector('.raise-busy')) card.querySelector('.raise-card-head h3').after(PIXEL.busy('raise-busy', ''));
    return card;
  }
  /** A placeholder: the card's title and blank rows where its answer goes. */
  function waitCard(title, section) {
    const card = raiseCard(title, null, section);
    for (let i = 0; i < RAISE_ROWS; i++) { const row = el('div', 'raise-row raise-row--wait'); row.setAttribute('aria-hidden', 'true'); row.append(el('span', 'raise-art'), el('span', 'raise-info'), el('span', 'raise-gain')); card.append(row); }
    return waiting(card);
  }
  /** How far a waiting card's answer has come, after its pixels. */
  function raiseStage(i, text) { $('raiseBody').children[i].querySelector('.raise-busy .naka-busy__text').textContent = text; }
  /** Best buy from the kept ranking; it leaves out listings already closing (nobody can buy them). */
  function fillBuy(c, snap) {
    const closing = new Set((snap.closing ?? []).map((r) => r[0])), value = (x) => x.impact.allocation.delta.lo / x.price;
    const buys = rankCache.rows.filter((x) => !closing.has(x.id) && x.impact.allocation.delta.lo > 0).sort((a, b) => value(b) - value(a));
    const card = fill(0, `${state.lang}|${rankCache.key}|${buys.slice(0, RAISE_ROWS).map((x) => x.id).join()}`, () => buyCard(c, snap, buys));
    // With the same top rows only the number of buyable listings can differ: it changes in place.
    if (buys.length) card.querySelector('.raise-card-head .list-link').textContent = c.raiseAllBuys(buys.length);
  }
  function raiseCard(title, more, section) {
    const box = el('section', 'raise-card'+(section==='planner-buy'?' raise-card--buy':'')), head = el('div', 'raise-card-head'); head.append(el('h3', 'px-title', title));
    if (more !== null) { const b = el('button', 'list-link', more); b.type = 'button'; b.addEventListener('click', () => openPage(section)); head.append(b); }
    box.append(head); return box;
  }
  /** One row; `place` keeps one artwork element per card (per row in Own a trait, where two traits can share a piece), so a
   * piece shown twice keeps its image in each. `tone` colours the figure on the right: a weekly change by its direction
   * (trend), or 'missing' for the pieces a trait still lacks. */
  function raiseRow(snap, place, tag, id, top, sub, gain, gainSub, tone) {
    const r = el(tag, 'raise-row'), art = el('span', 'raise-art'), info = el('span', 'raise-info'), right = el('span', 'raise-gain');
    art.append(artFor(snap, id, 'hc-fallback', place)); info.append(top, typeof sub === 'string' ? el('small', '', sub) : sub); right.append(el('b', '', gain), el('small', '', gainSub)); right.dataset.tone = tone;
    r.append(art, info, right); return r;
  }
  /** The second line of a Best buy or Reach 400% row: the number, the weight it reaches (coloured by tier), a mate tag and
   * what each 0.001 BTC brings. */
  function raiseSub(number, weight, mate, per) {
    const line = el('small', 'raise-sub'); line.append(el('b', 'raise-number', number));
    if (weight) line.append(el('span', `raise-to naka-tone-${weight[1]}`, weight[0]));
    if (mate) line.append(el('span', 'raise-tag', mate));
    if (per) line.append(el('span', 'raise-per', per));
    return line;
  }
  /** Best buy: the page's ranking (weekly gain per sat), the top rows. */
  function buyCard(c, snap, buys) {
    const U = globalThis.NakaExploreUI, buy = raiseCard(c.raiseBuyTitle, buys.length ? c.raiseAllBuys(buys.length) : null, 'planner-buy');
    if (!buys.length) buy.append(el('p', 'raise-note', c.raiseBuyNone));
    for (const x of buys.slice(0, RAISE_ROWS)) {
      const number = snap.items[x.id][0], per = x.impact.allocation.delta.lo / x.price * 1e5, ready = x.impact.scenario?.state === 'ready';
      const sub = raiseSub(`#${number}`, ready ? [`→ ${R.formatWeight(x.impact.scenario.result)}`, TIER.tierOf(x.impact.scenario.result)] : null, null, c.raisePer(U.shn({ lo: per, hi: per })));
      const a = raiseRow(snap, 'raise-buy', 'a', x.id, el('strong', '', c.raisePlanCost(I.btc(x.price), 1)), sub, U.shn(x.impact.allocation.delta, true), c.raiseWeek, trend(x.impact.allocation.delta));
      a.href = U.marketFind(snap, x.id); a.target = '_blank'; a.rel = 'noopener noreferrer'; a.title = c.raiseBuyHint(number); buy.append(a);
    }
    return buy;
  }
  /** Reach 400%: each piece's own cheapest plan (my holdings and the numbers added), best value first. */
  function planCard(c, snap, rows) {
    // Plans that need us; one made only of listings already closing (`auto`) is no choice: the piece gets there anyway.
    const U = globalThis.NakaExploreUI, reach = rows.filter((r) => r.state === 'reachable' && !r.auto), auto = rows.filter((r) => r.state === 'reachable' && r.auto);
    const plan = raiseCard(c.raisePlanTitle, rows.length ? c.raiseAllPlans(rows.length) : null, 'planner-plan');
    if (!rows.length) plan.append(el('p', 'raise-note', c.raisePlanDone));
    else if (!reach.length) plan.append(el('p', 'raise-note', auto.length ? c.raisePlanAuto(auto.length) : c.raisePlanNone));
    for (const r of reach.slice(0, RAISE_ROWS)) {
      const sub = raiseSub(`#${r.number}`, [`${r.before.lo.weight}% → ${R.RULES.capPct}%`, 'max'], r.side === 'mates' ? c.raiseMate : null, r.value === null ? null : c.raisePer(U.shn({ lo: r.value, hi: r.value })));
      const b = raiseRow(snap, 'raise-plan', 'button', r.id, el('strong', '', c.raisePlanCost(I.btc(r.plan.cost), r.plan.buys)), sub, U.shn(r.total, true), c.raiseWeek, trend(r.total)); b.type = 'button'; b.title = c.raisePlanHint(r.number); b.addEventListener('click', () => openPage(`plan-${r.number}`)); plan.append(b);
    }
    return plan;
  }
  /** The Simulate line into the page. */
  function simLink(c) {
    const sim = el('button', 'raise-link'); sim.type = 'button'; sim.append(el('strong', '', c.raiseSimTitle), el('span', '', c.raiseSimLine)); sim.addEventListener('click', () => openPage('planner-sim'));
    return sim;
  }
  /** Own a trait: the traits buying listings makes ours, best value first, then the traits all ours where keeping one of
   * ours listed at the +100% line pays (keepListed), then the ones a private deal is still needed for, the fewest pieces
   * missing first (NakaPlanner.lockGroups, the page's order); the other traits already all ours need nothing and stay on
   * the page. A row shows one of our pieces carrying the trait (my holdings first) and opens that tab on the page. */
  function lockCard(c, snap, ours) {
    const U = globalThis.NakaExploreUI, T = I.pick(state.lang), { can, have, far, missing } = planCache.lock, all = can.length + have.length + far.length, rows = [...can, ...have.filter((t) => t.monopoly.keepListed), ...far].slice(0, RAISE_ROWS);
    const card = raiseCard(c.raiseLockTitle, all ? c.raiseAllTraits(all) : null, 'planner-lock'), pct = (b) => b.lo === b.hi ? `+${b.lo}%` : `+${b.lo}–${b.hi}%`;
    if (!rows.length) card.append(el('p', 'raise-note', c.raiseLockNone(have.length)));
    rows.forEach((t, i) => {
      const m = t.monopoly, type = t.type === 'Hair And Headwear' ? T.headwear : t.type, top = el('strong', 'raise-trait');
      top.append(el('span', 'raise-value', t.value), el('span', 'raise-type', type));
      let sub, gain, gainSub, tone;
      if (m.state === 'possible') {
        // Ours once the others' listings are bought and ours reclaimed, or — when the planner found that better — with one
        // of ours kept listed at the +100% line (keepListed: the page's row shows the same way): the cost, the bonus then
        // and our weekly total. With no listing to remove and none to keep there is no total: the trait is all ours already
        // and owning it changes nothing, so the bonus it keeps.
        const k = m.keepListed ?? null, after = k === null ? t.owned.after : k.after, total = k === null ? (Object.hasOwn(m, 'total') ? m.total : null) : k.total;
        sub = [m.buy.length ? c.raisePlanCost(I.btc(m.cost), m.buy.length) : c.raiseFree, ...(k === null ? [] : [c.raiseLockKeep(k.number)]), c.raiseLockOnce(pct(after))].join(' · ');
        [gain, gainSub, tone] = total === null ? [pct(after), c.raiseLockKept, 'same'] : [U.shn(total, true), c.raiseTotalWeek, trend(total)];
      } else {
        // Someone else holds one, one is unminted, or buying leaves no listing to score: what is still missing. The bonus
        // once all ours; owned.state is 'no-floor' instead when buying the listings would leave none on the market.
        const once = t.owned.state === 'ready' ? c.raiseLockOnce(pct(t.owned.after)) : c.raiseLockNoFloor;
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
    // The sigil's eyes scan while a newer block is on its way.
    $('sigil').toggleAttribute('data-busy', state.updating !== undefined);
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
    // The network panel loads only while it can be seen, so it is refreshed after the tab it sits in is shown.
    NakaLedgerUI.network({ snap, lang: state.lang, clock: state.blockClock, parent: $('blockNetwork') });
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
    chrome.storage.local.get([K.live, K.closing, K.liveStatus, I.STORAGE_KEY, EXP.KEY, HOLD.KEY, HOLD.TEAM,A.KEY,A.STATUS,A.OBSERVED,A.WEEKS,HOLD.LEFT,HOLD.LEFT_SEEN,HOLD.EVENTS,HOLD.META,HOLD.ABSENT,NakaLedger.KEY]),
    chrome.storage.session.get([SRC.SESSION_VISIBLE, SRC.SESSION_UPDATING]),
  ]).then(([got, ses]) => {
    rewardWeek=got[A.KEY];rewardStatus=got[A.STATUS];officialReadings=got[A.OBSERVED];rewardWeeks=got[A.WEEKS];leftPieces=got[HOLD.LEFT];leftSeen=got[HOLD.LEFT_SEEN];holdingEvents=got[HOLD.EVENTS];holdingsMeta=got[HOLD.META];walletAbsent=got[HOLD.ABSENT];state.ledger=got[NakaLedger.KEY];comparisonIds=EXP.normalize(got[EXP.KEY]);holdings=HOLD.normalize(got[HOLD.KEY]);team=HOLD.mates(got[HOLD.TEAM]);
    state.lang = I.resolveLang(got[I.STORAGE_KEY]);
    state.live = got[K.live];
    state.closing = got[K.closing];
    state.liveStatus = got[K.liveStatus];
    state.visibleAt = ses[SRC.SESSION_VISIBLE]; state.updating = ses[SRC.SESSION_UPDATING];
    chrome.runtime.sendMessage({type:'shn-reward-clock'}).then(c=>{if(c?.ok){state.rewardClock=c;render();}}).catch(()=>{});
    render();
    setInterval(render, 15000); // 刷新「几分钟前」与暂停状态
    // Which code the worker runs. A worker from before this check leaves the message unanswered (undefined), and a
    // rejected message means no worker took it: neither runs this code.
    chrome.runtime.sendMessage({ type: 'shn-build' }).then((answer) => SRC.sameBuild(answer), () => false).then((same) => { state.workerCurrent = same; if (!same) state.sheet = null; render(); });
  });
  // Built once: the header sigil's eyes switch on as the popup opens (purchase.css, .naka-alive), and the "updating" pixels
  // after the block's age and after the Raise weight basis line keep their rhythm through every render.
  $('sigil').replaceChildren(PIXEL.sigil('pixel-sigil', { turn: true }));
  const blockBusy = Object.assign(PIXEL.busy('bh-busy', ''), { hidden: true }), raiseBusy = Object.assign(PIXEL.busy('raise-basis-busy'), { hidden: true });
  $('blockAge').after(blockBusy); $('raiseBasis').append(raiseBusy);
  // Reload asks the new worker to open the popup again (Chrome closes it on reload), so the update ends on the usual view.
  $('updateSigil').replaceChildren(PIXEL.sigil('pixel-sigil'));
  $('updateReload').addEventListener('click', () => { $('updateReload').disabled = true; chrome.storage.local.set({ [SRC.REOPEN]: { page: 'popup', at: Date.now() } }).then(() => chrome.runtime.reload()); });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'session') {
      if(has(changes,'nakaHistoryProgress')&&state.historyPending){state.status=changes.nakaHistoryProgress.newValue;renderStatus(I.pick(state.lang));}
      if (has(changes, SRC.SESSION_VISIBLE)) { state.visibleAt = changes[SRC.SESSION_VISIBLE].newValue; render(); }
      if (has(changes, SRC.SESSION_UPDATING)) { state.updating = changes[SRC.SESSION_UPDATING].newValue; render(); }
      return;
    }
    if (area !== 'local') return;
    if(has(changes,A.WEEKS))rewardWeeks=changes[A.WEEKS].newValue;if(has(changes,HOLD.LEFT))leftPieces=changes[HOLD.LEFT].newValue;if(has(changes,HOLD.LEFT_SEEN))leftSeen=changes[HOLD.LEFT_SEEN].newValue;if(has(changes,HOLD.EVENTS))holdingEvents=changes[HOLD.EVENTS].newValue;if(has(changes,HOLD.META))holdingsMeta=changes[HOLD.META].newValue;if(has(changes,HOLD.ABSENT))walletAbsent=changes[HOLD.ABSENT].newValue;
    if(has(changes,NakaLedger.KEY)){state.ledger=changes[NakaLedger.KEY].newValue;holdingsKey='';}
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
  // A choice saved here reaches the extension page too (its storage event); storage refused keeps it for this popup.
  // A press picks that order in its usual direction, or reverses the lit one; the arrow keys move between the buttons.
  $('holdingsSort').addEventListener('click',ev=>{const b=ev.target.closest('.hc-sort-btn');if(!b)return;const by=b.dataset.sort,now=holdingsSort(),dir=now.by===by?(now.dir==='asc'?'desc':'asc'):HOLD.SORTS[by];try{localStorage.setItem(HOLD.SORT_KEY,JSON.stringify({by,dir}));}catch{}holdingsSortNow=true;holdingsKey='';render();});
  $('holdingsSort').addEventListener('keydown',ev=>{if(!['ArrowLeft','ArrowRight'].includes(ev.key))return;const list=[...$('holdingsSort').querySelectorAll('.hc-sort-btn')],i=list.indexOf(document.activeElement);if(i<0)return;ev.preventDefault();list[(i+(ev.key==='ArrowRight'?1:list.length-1))%list.length].focus();});
  addEventListener('storage',ev=>{if(ev.key!==HOLD.SORT_KEY)return;holdingsSortNow=true;holdingsKey='';render();});
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
    const key=`${state.lang}|${tip}|${clock?.height}|${I.blockTimestamp(clock??{})}|${Math.floor(Date.now()/60000)}`;if(key===boundaryKey)return;
    // Rebuilding the options closes a list the viewer has open: it waits until they leave the field (the next render).
    if(document.activeElement===$('rewardBoundary'))return;
    boundaryKey=key;
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
  // A sale's block on a lookup card opens the same block lookup, at that block.
  globalThis.NakaPurchase.setLookup((number,height)=>NakaLedgerUI.inspect(SRC.choose({live:state.live,closing:state.closing},BUNDLED).snap,state.lang,number,height));
  $('historyLookup').addEventListener('click',()=>NakaLedgerUI.inspect(SRC.choose({live:state.live,closing:state.closing},BUNDLED).snap,state.lang,LOOKUP.parseNumber($('lookupNumber').value)));
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
