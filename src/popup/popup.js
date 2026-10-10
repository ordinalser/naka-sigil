/**
 * 弹窗：顶部「中文 | EN」切换语言（默认英文）；「实时同步」开关（默认关闭）与最近一次检查的结果 / 失败原因；
 * 当前显示的数据；「手动同步」按钮（交给后台 sw/sync-sw.js 执行）；规则与颜色图例。
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
  const K = SRC.KEYS;
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
    lookupRaw: null, lookupFocus:false, liveEnabled: SRC.LIVE_DEFAULT, live: undefined, liveStatus: undefined, visibleAt: undefined,
  };

  function renderStatic(T) {
    document.documentElement.lang = state.lang === 'zh' ? 'zh-CN' : 'en';
    for (const b of $('langSwitch').querySelectorAll('button')) b.setAttribute('aria-pressed', String(b.dataset.lang === state.lang));
    $('title').textContent = T.title;
    $('sigil').replaceChildren(PIXEL.sigil('pixel-sigil'));
    $('liveTitle').textContent = T.liveTitle;
    $('liveDiagnosticTitle').textContent = T.diagnostics;
    $('syncDiagnosticTitle').textContent = T.diagnostics;
    $('liveSub').textContent = T.liveSub;
    $('liveHint').textContent = T.liveHint;
    $('liveHint').hidden = !state.liveEnabled;
    $('liveToggle').checked = state.liveEnabled;
    $('snapTitle').textContent = T.popupSnapshot;
    $('rulesTitle').textContent = T.popupRules;
    $('lookupTitle').textContent = T.lookupTitle;
    $('lookupBack').textContent=T.lookupBack;
    $('lookupNumber').placeholder = T.lookupPlaceholder;
    $('lookupBtn').textContent = T.lookupButton;
    $('syncSettingsTitle').textContent = T.syncSettings;
    $('syncMode').textContent = state.liveEnabled ? T.liveShortOn : T.liveShortOff;
    $('syncMode').dataset.enabled = String(state.liveEnabled);
    $('syncTitle').textContent = T.syncTitle;
    $('syncHeight').placeholder = T.syncPlaceholder;
    $('syncHeight').setAttribute('aria-label', T.syncPlaceholder);
    $('syncBtn').textContent = T.syncButton;
    $('syncHint').textContent = T.syncHint();
    $('restore').textContent = T.restore;

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
    const kv = [
      [T.popupFloor, `${I.btc(s.collectionFloor)} BTC`],
      [T.popupListings, I.int(s.listings)],
    ];
    $('snap').replaceChildren(...kv.map(([k, v]) => {
      const row = el('div', 'row');
      row.append(el('dt', '', k), el('dd', '', v));
      return row;
    }));
    $('snap').dataset.source = source;
    $('blockAge').textContent = I.blockAge(T,s);
    $('blockAge').title = I.blockTimeTitle(T,s);
    const note = I.measureNote(T, s.height);
    $('measureNote').textContent = T.inspectProvisional;
    $('measureNote').title = note ?? ''; 
    $('measureNote').hidden = note === null;
    $('restore').hidden = !(SRC.compatibleSnapshot(state.manual, BUNDLED));
    return snap;
  }

  /** 实时同步：开关状态、最近一次检查结果；失败时说明原因、多久后重试、页面正在用哪份数据，并给出技术细节。 */
  function renderLive(T) {
    const st = SRC.statusOf(state.liveStatus, 'live');
    const now = Date.now();
    const live = SRC.compatibleSnapshot(state.live, BUNDLED) ? state.live : undefined;
    const dataLine = live === undefined ? null : T.liveOk(I.int(live.snapshot.height), I.blockAge(T,live.snapshot,now));
    const visible = state.visibleAt !== undefined && now - state.visibleAt <= SRC.VISIBLE_MS;
    let kind;
    let text;
    let keep = null;
    let detail = null;
    if (!state.liveEnabled) { kind = 'muted'; text = T.liveOff; }
    else if (st !== undefined && st.state === 'error') {
      kind = 'error';
      text = T.liveFail(T.failReason[st.kind] + (st.status === null ? '' : T.httpCode(st.status)), st.waitMin);
      keep = live === undefined ? T.liveKeepNone : T.liveKeep(I.int(live.snapshot.height));
      detail = st.message;
    } else if (!visible) { kind = 'muted'; text = dataLine === null ? T.livePaused : `${T.livePaused} · ${dataLine}`; }
    else if (dataLine === null) { kind = 'muted'; text = T.liveWaiting; }
    else { kind = 'ok'; text = dataLine; }
    if(state.liveEnabled && kind === 'error') { $('syncMode').textContent=T.liveShortError; $('syncMode').dataset.error='true'; }
    else delete $('syncMode').dataset.error;
    $('liveToggle').title = text;
    $('syncMode').title = text;
    const box = $('liveState');
    box.textContent = text;
    box.hidden = !state.liveEnabled;
    box.className = `live-state live-state--${kind}`;
    box.dataset.state = !state.liveEnabled ? 'off' : st === undefined ? 'none' : st.state;
    $('liveKeep').textContent = keep === null ? '' : keep;
    $('liveKeep').hidden = keep === null;
    $('liveDetail').textContent = detail === null ? '' : detail;
    $('liveDiagnostic').hidden = detail === null;
  }

  function showStatus(kind, text) {
    const box = $('syncStatus');
    box.replaceChildren(...(kind === 'running' ? [el('span', 'spinner')] : []), el('span', '', text));
    box.className = `footnote status status--${kind}`;
    box.dataset.state = kind;
    box.hidden = false;
  }

  function renderStatus(T) {
    const st = SRC.statusOf(state.status, 'manual');
    $('syncDiagnostic').hidden = !st || st.state !== 'error';
    $('syncDetail').textContent = st?.state === 'error' ? st.message : '';
    const running = st !== undefined && st.state === 'running';
    // Manual progress belongs to its own status; never relabel the live switch.
    $('syncBtn').disabled = running;
    $('syncHeight').disabled = running;
    if (state.localError !== null) { showStatus('error', T[state.localError]); return; }
    if (st === undefined) { $('syncStatus').hidden = true; return; }
    if (st.state === 'running') showStatus('running', st.stage === 'meta' ? T.syncMeta(st.done, st.total) : T.syncStage[st.stage]);
    else if (st.state === 'done') showStatus('done', T.syncDone(I.int(st.height)));
    else if (st.state === 'error') showStatus('error', T.syncError(T.failReason[st.kind] || T.failReason.data));
    else if (st.state === 'interrupted') showStatus('interrupted', T.syncInterrupted);
    else throw new Error(`未知的同步状态：${st.state}`);
  }

  function timedBasis(T,snap) { const n=el('p','lookup-basis lookup-basis--time',T.lookupBasis(I.blockBasis(T,snap.snapshot))); n.title=I.blockTimeTitle(T,snap.snapshot); return n; }
  let lookupRendered = null;
  function renderLookup(T, snap) {
    document.body.classList.toggle('has-lookup',state.lookupFocus);$('lookupBack').hidden=!state.lookupFocus;
    if (lookupRendered?.snap === snap && lookupRendered.raw === state.lookupRaw && lookupRendered.lang === state.lang) {
      for(const n of $('lookupResult').querySelectorAll('.lookup-basis--time')) { n.textContent=T.lookupBasis(I.blockBasis(T,snap.snapshot)); n.title=I.blockTimeTitle(T,snap.snapshot); }
      for(const n of $('lookupResult').querySelectorAll('.naka-purchase__basis')) {n.textContent=T.snapBlock(I.blockBasis(T,snap.snapshot));n.title=I.blockTimeTitle(T,snap.snapshot);}
      return;
    }
    lookupRendered = {snap, raw:state.lookupRaw, lang:state.lang};
    const box = $('lookupResult');
    box.replaceChildren(); box.hidden = state.lookupRaw === null;
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
    head.append(el('strong','',`Shielded #${found.number}`),link);
    const rank=globalThis.NakaPurchase.numberBadge(found.number,T);if(rank)head.insertBefore(rank,link);
    const model=globalThis.NakaPurchase.create(snap),scenario=model.get(found.id);
    card.dataset.listing=found.listing;
    const notice=scenario.state==='no-floor'?T.buyNoFloor:null;
    card.append(head,scenario.state==='ready'?globalThis.NakaPurchase.render(model,found.id,T,I):globalThis.NakaPurchase.renderCurrent(r,snap.snapshot,T,I,{notice,listing:found.listing}));
    box.append(card);
  }

  function render() {
    const T = I.pick(state.lang);
    renderStatic(T);
    renderLive(T);
    const snap = renderSnapshot(T);
    renderLookup(T, snap);
    $('launchInfo').replaceChildren(globalThis.NakaPurchase.renderLaunch(snap.snapshot,T,I,state.lookupFocus));
    renderStatus(T);
  }

  Promise.all([
    chrome.storage.local.get([K.manual, K.live, K.liveEnabled, K.liveStatus, 'syncStatus', I.STORAGE_KEY]),
    chrome.storage.session.get(SRC.SESSION_VISIBLE),
  ]).then(([got, ses]) => {
    state.lang = I.resolveLang(got[I.STORAGE_KEY]);
    state.manual = got[K.manual];
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
    if (has(changes, I.STORAGE_KEY)) state.lang = I.resolveLang(changes[I.STORAGE_KEY].newValue);
    if (has(changes, K.manual)) state.manual = changes[K.manual].newValue;
    if (has(changes, K.live)) state.live = changes[K.live].newValue;
    if (has(changes, K.liveEnabled)) state.liveEnabled = SRC.resolveLive(changes[K.liveEnabled].newValue);
    if (has(changes, K.liveStatus)) state.liveStatus = changes[K.liveStatus].newValue;
    if (has(changes, 'syncStatus')) { state.status = changes.syncStatus.newValue; state.localError = null; }
    render();
  });

  $('liveToggle').addEventListener('change', (e) => chrome.storage.local.set({ [K.liveEnabled]: e.target.checked }));

  $('langSwitch').addEventListener('click', (e) => {
    const b = e.target instanceof Element ? e.target.closest('button[data-lang]') : null;
    if (b && b.dataset.lang !== state.lang) chrome.storage.local.set({ [I.STORAGE_KEY]: b.dataset.lang });
  });

  $('lookupForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const raw = $('lookupNumber').value, number = LOOKUP.parseNumber(raw);
    state.lookupFocus=true;
    state.lookupRaw = number === null ? raw : String(number);
    if(number !== null) $('lookupNumber').value = String(number);
    render(); document.querySelector('.popup-scroll').scrollTop=0;
  });
  $('lookupBack').addEventListener('click',()=>{state.lookupFocus=false;state.lookupRaw=null;$('lookupNumber').value='';render();});
  $('lookupNumber').addEventListener('input', () => {
    state.lookupRaw=null;
    renderLookup(I.pick(state.lang),SRC.choose({liveEnabled:state.liveEnabled,live:state.live,manual:state.manual},BUNDLED).snap);
  });

  $('syncForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const raw = $('syncHeight').value.trim();
    if (raw !== '' && !/^\d+$/.test(raw)) { state.localError = 'syncBadHeight'; render(); return; }
    const res = await chrome.runtime.sendMessage({ type: 'shn-sync', height: raw === '' ? null : Number(raw) });
    if (res.ok) return; // 进度由 syncStatus 的存储变化驱动
    if (res.error === 'busy') state.localError = 'syncBusy';
    else if (res.error === 'bad-height') state.localError = 'syncBadHeight';
    else throw new Error(`后台返回了未知错误：${res.error}`);
    render();
  });

  $('restore').addEventListener('click', () => chrome.storage.local.remove([K.manual, 'syncStatus']));
})();
