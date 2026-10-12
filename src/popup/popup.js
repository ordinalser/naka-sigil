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
  const K = SRC.KEYS, EXP=globalThis.NakaExplore;
  let comparisonIds=[];
  const $ = (id) => document.getElementById(id);
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };
  const has = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

  // 当前状态：语言、本地同步的快照、同步状态；任一变化都整体重画（弹窗内容很少，重画开销可以忽略）
  const state = {
    lang: I.DEFAULT_LANG, manual: undefined, status: undefined, localError: null,
    lookupRaw: null, lookupFocus:false, fixedPending:false, liveEnabled: SRC.LIVE_DEFAULT, live: undefined, liveStatus: undefined, visibleAt: undefined,
  };

  function renderStatic(T) {
    document.documentElement.lang = state.lang === 'zh' ? 'zh-CN' : 'en';
    for (const b of $('langSwitch').querySelectorAll('button')) b.setAttribute('aria-pressed', String(b.dataset.lang === state.lang));
    $('title').textContent = T.title;
    $('tagline').textContent = T.tagline;
    // Compare count: four pixel pips (filled = selected) beside the label, matching the Compare page toolbar.
    const cc = globalThis.NakaExploreUI.pick(state.lang), pips = el('span', 'foot-pips');
    pips.setAttribute('aria-hidden', 'true');
    pips.append(...Array.from({ length: EXP.MAX }, (_, i) => el('i', i < comparisonIds.length ? 'is-on' : '')));
    $('compare').replaceChildren(pips, el('span', '', cc.compare), el('span', 'foot-count', `${comparisonIds.length}/${EXP.MAX}`), el('span', 'foot-go', '↗'));
    $('compare').setAttribute('aria-label', `${cc.open} · ${cc.count(comparisonIds.length)}`);
    $('sigil').replaceChildren(PIXEL.sigil('pixel-sigil'));
    $('liveTitle').textContent = T.modeTitle;
    $('modeLive').textContent=T.modeLive;$('modeFixed').textContent=T.modeFixed;
    $('modeLive').setAttribute('aria-pressed',String(state.liveEnabled));$('modeFixed').setAttribute('aria-pressed',String(!state.liveEnabled));
    $('modeLive').title = T.liveHint;
    $('modeFixed').title = T.syncHint();
    $('fixedTitle').textContent=T.fixedTitle;$('fixedCancel').textContent=T.cancel;
    $('snapTitle').textContent = T.popupSnapshot;
    $('rulesTitle').textContent = T.popupRules;
    $('lookupTitle').textContent = T.lookupTitle;
    $('lookupBack').textContent=T.lookupBack;
    $('lookupNumber').placeholder = T.lookupPlaceholder;
    $('lookupBtn').textContent = T.lookupButton;
    $('syncHeight').placeholder = T.syncPlaceholder;
    $('syncHeight').setAttribute('aria-label', T.syncPlaceholder);
    $('syncBtn').textContent = T.fixedConfirm;
    $('syncHint').textContent = T.syncHint();

    const tile = (top, bottom) => {
      const n = el('div', 'tile');
      n.append(el('b', '', top), el('span', '', bottom));
      return n;
    };
    $('traitLabel').textContent = T.popupTrait;
    $('traitTiers').replaceChildren(...[...R.RULES.traitTiers].reverse().map((t) => tile(`+${t.pct}%`, `≥${t.num / t.den}×`)));
    $('numberLabel').textContent = T.popupNumber;
    $('numberTiers').replaceChildren(...R.RULES.numberTiers.map((t) => tile(`+${t.pct}%`, t.label)));
    $('capLabel').textContent = T.popupCap;
    $('capValue').textContent = `${R.RULES.capPct}%`;

    $('rulesCaveat').textContent = T.rulesCaveat;
    $('listedNote').textContent = T.listedZero;
    $('zeroSource').textContent=T.popupZeroSource;$('zeroSource').href=R.RULES.zeroListingSource;

    $('open').textContent = T.popupOpen;
    $('open').href = `https://ord-dropz.xyz/secondary/collections/${BUNDLED.collection.slug}`;
    $('source').textContent = `${T.popupSource} · ${R.RULES.publishedAt}`;
    $('source').href = R.RULES.source;
  }

  /** 与内容脚本同一规则（SRC.choose）：显示的是页面此刻正在用的那份数据。 */
  function renderSnapshot(T) {
    const { snap, source } = SRC.choose({ liveEnabled: state.liveEnabled, live: state.live, manual: state.manual }, BUNDLED);
    const s = snap.snapshot;
    const sourceText = { live: T.srcLive, synced: T.srcSynced, bundled: T.srcBundled }[source];
    $('heightLabel').textContent = T.popupHeight;
    $('currentHeight').replaceChildren(el('span', 'sr-only', I.int(s.height)), PIXEL.digits(I.int(s.height), 'pixel-height'));
    $('currentHeight').setAttribute('aria-label', I.int(s.height));
    $('snapSource').textContent = sourceText;
    // Reward start is planning context for the selected block: remaining blocks plus a header-time date.
    const launch = R.launchStatus(s);
    const launchSub = launch.state === 'reached' ? T.launchAt(I.int(launch.height))
      : launch.eta === null ? T.launchUnknown : T.launchDate(new Date(launch.eta).toISOString().slice(0, 10));
    // Numbers use the block height's bitmap digits; a reached start is a word, so it stays text.
    const stats = [
      { label: T.popupFloor, value: I.btc(s.collectionFloor), pixels: true, unit: 'BTC', sub: null },
      { label: T.popupListings, value: I.int(s.listings), pixels: true, unit: null, sub: null },
      launch.state === 'reached'
        ? { label: T.launchStat, value: T.launchReachedShort, pixels: false, unit: null, sub: launchSub }
        : { label: T.launchStat, value: I.int(launch.remaining), pixels: true, unit: T.blocksUnit, sub: launchSub },
    ];
    const rows = stats.map(({ label, value, pixels, unit, sub }) => {
      const row = el('div', 'row'), dd = el('dd');
      if (pixels) dd.append(el('span', 'sr-only', value), PIXEL.digits(value, 'stat-pixels'));
      else dd.textContent = value;
      if (unit !== null) dd.append(el('span', 'stat-unit', unit));
      row.append(el('dt', '', label), dd);
      if (sub !== null) row.append(el('dd', 'stat-sub', sub));
      return row;
    });
    rows[2].title = `${T.launchTitle(I.int(launch.height))}\n${T.launchMethod}`;
    $('snap').replaceChildren(...rows);
    $('snap').dataset.source = source;
    $('blockAge').textContent = I.blockAge(T,s);
    $('blockAge').title = I.blockTimeTitle(T,s);
    const note = I.measureNote(T, s.height);
    $('measureNote').textContent = T.inspectProvisional;
    $('measureNote').title = note ?? ''; 
    $('measureNote').hidden = note === null;
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
    $('syncHeight').disabled = running;
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
      chip.title=$('liveState').title;
      chip.dataset.state=$('liveState').dataset.state;
    }
  }
  let lookupRendered = null;
  function renderLookup(T, snap) {
    document.body.classList.toggle('has-lookup',state.lookupFocus);$('lookupBack').hidden=!state.lookupFocus;
    if (lookupRendered?.snap === snap && lookupRendered.raw === state.lookupRaw && lookupRendered.lang === state.lang) {
      for(const n of $('lookupResult').querySelectorAll('.lookup-basis--time')) { n.textContent=T.lookupBasis(I.blockBasis(T,snap.snapshot)); n.title=I.blockTimeTitle(T,snap.snapshot); }
      return;
    }
    lookupRendered = {snap, raw:state.lookupRaw, lang:state.lang};
    const box = $('lookupResult');
    box.replaceChildren(); box.hidden = state.lookupRaw === null;
    $('lookupCompare').hidden = true; // shown again only for a found NFT
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
    $('lookupCompare').dataset.id=found.id;$('lookupCompare').hidden=false;
    head.append(el('strong','',`Shielded #${found.number}`),link);
    const rank=globalThis.NakaPurchase.numberBadge(found.number,T);if(rank)head.insertBefore(rank,link);
    const model=globalThis.NakaPurchase.create(snap),scenario=model.get(found.id);
    card.dataset.listing=found.listing;
    const notice=scenario.state==='no-floor'?T.buyNoFloor:null;
    card.append(head,scenario.state==='ready'?globalThis.NakaPurchase.render(model,found.id,T,I):globalThis.NakaPurchase.renderCurrent(r,snap.snapshot,T,I,{notice,listing:found.listing}));
    const purchase=card.querySelector('.naka-purchase'),context=el('div','lookup-context');
    context.append(purchase.querySelector('.naka-purchase__basis'),el('span','lookup-mode'));
    purchase.prepend(context);
    box.append(card);
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
    if (!$('lookupCompare').hidden) paintLookupCompare($('lookupCompare'));
    $('discoveryHint').textContent=T.discoveryHint;const numbers=comparisonIds.map(id=>snap.items[id]?.[0]).filter(n=>n!==undefined);$('selectedNumbers').replaceChildren(...numbers.map(n=>el('span','selected-number','#'+n)));$('selectedNumbers').hidden=!numbers.length;
    renderStatus(T);
  }

  Promise.all([
    chrome.storage.local.get([K.manual, K.live, K.liveEnabled, K.liveStatus, 'syncStatus', I.STORAGE_KEY, EXP.KEY]),
    chrome.storage.session.get(SRC.SESSION_VISIBLE),
  ]).then(([got, ses]) => {
    comparisonIds=EXP.normalize(got[EXP.KEY]);
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
    if (has(changes, I.STORAGE_KEY)) state.lang = I.resolveLang(changes[I.STORAGE_KEY].newValue);
    if (has(changes, K.manual)) state.manual = changes[K.manual].newValue;
    if (has(changes, K.live)) state.live = changes[K.live].newValue;
    if (has(changes, K.liveEnabled)) state.liveEnabled = SRC.resolveLive(changes[K.liveEnabled].newValue);
    if (has(changes, K.liveStatus)) state.liveStatus = changes[K.liveStatus].newValue;
    if (has(changes, 'syncStatus')) { state.status = changes.syncStatus.newValue; state.localError = null;if(state.fixedPending&&['done','error','interrupted'].includes(state.status?.state)){state.fixedPending=false;if(state.status.state==='done'){$('fixedDialog').close();$('modeFixed').focus();}} }
    render();
  });

  $('compare').addEventListener('click',()=>chrome.runtime.sendMessage({type:'shn-open-compare'}));
  $('lookupCompare').addEventListener('click', async () => {
    const button = $('lookupCompare'), c = globalThis.NakaExploreUI.pick(state.lang);
    if (button.dataset.compare === 'full') { chrome.runtime.sendMessage({ type: 'shn-open-compare' }); return; }
    button.disabled = true;
    try {
      const res = await chrome.runtime.sendMessage({ type: 'shn-compare', action: 'toggle', id: button.dataset.id }); if (!res?.ok) throw Error('save');
      comparisonIds = res.ids; render();
      if (res.state === 'missing') { button.textContent = c.missing; delete button.dataset.compare; }
    } catch { button.textContent = c.addError; button.disabled = false; delete button.dataset.compare; }
  });

  $('modeLive').addEventListener('click',async()=>{state.liveEnabled=true;state.localError=null;render();await chrome.storage.local.set({[K.liveEnabled]:true});beat();});
  $('modeFixed').addEventListener('click',()=>{state.localError=null;state.status=undefined;const selected=SRC.choose({liveEnabled:state.liveEnabled,live:state.live,manual:state.manual},BUNDLED).snap;$('syncHeight').value=String(selected.snapshot.height);$('fixedDialog').showModal();render();$('syncHeight').focus();$('syncHeight').select();});
  $('fixedCancel').addEventListener('click',()=>{if(!state.fixedPending){$('fixedDialog').close();$('modeFixed').focus();}});
  $('fixedDialog').addEventListener('cancel',e=>{if(state.fixedPending)e.preventDefault();});

  function beat(){if(document.visibilityState==='visible'&&chrome.runtime.id)chrome.runtime.sendMessage({type:'shn-visible'}).catch(()=>{});}
  beat();setInterval(beat,SRC.HEARTBEAT_MS);document.addEventListener('visibilitychange',beat);

  $('langSwitch').addEventListener('click', (e) => {
    const b = e.target instanceof Element ? e.target.closest('button[data-lang]') : null;
    if (b && b.dataset.lang !== state.lang) chrome.storage.local.set({ [I.STORAGE_KEY]: b.dataset.lang });
  });

  function showLookup(raw) {
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
  $('lookupBack').addEventListener('click',()=>{state.lookupFocus=false;state.lookupRaw=null;$('lookupNumber').value='';render();});
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
    state.fixedPending=true;state.status={state:'running',stage:'state'};state.localError=null;render();
    let res;try{res=await chrome.runtime.sendMessage({ type: 'shn-set-fixed', height: Number(raw) });}catch{res={ok:false,error:'busy'};}
    if (res.ok) return;
    state.fixedPending=false; // 进度由 syncStatus 的存储变化驱动
    if (res.error === 'busy') state.localError = 'syncBusy';
    else if (res.error === 'live-mode') state.localError='fixedRequired';
    else if (res.error === 'bad-height') state.localError = 'syncBadHeight';
    else throw new Error(`后台返回了未知错误：${res.error}`);
    render();
  });

})();
