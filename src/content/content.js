/**
 * 内容脚本：在 ord-dropz 的 Shielded Nakas 集合页与藏品详情页标注 SHNAKAS 奖励权重。
 * 数据（lib/source.js 的 choose）：实时模式且已有实时数据 → 实时；否则指定区块的数据；都没有 → 内置快照。
 * 监听存储变化，同步完成后已打开的页面原地刷新。同步失败时存储里的旧数据不变，页面照旧工作。
 * 内容脚本自身不发网络请求；页面可见时给后台发心跳（实时同步只在有页面在看时才检查新区块）。
 *
 * 落点（2026-10-08 实测 DOM）：
 *   - 网格卡片：图片框 .aspect-square 是卡片根 .group 的第一个子元素 → 徽章放图片框右下角
 *     （左上稀有度、右上溢价/成交中、左下扫货按钮，右下是唯一空位）
 *   - 列表行：.group[grid-cols-…] 的名称格 = 缩略图(.flex-shrink-0) + .min-w-0 > p[title] → 徽章追加在名称格末尾
 *     列表是虚拟滚动，行节点可能被复用给别的藏品，所以每次扫描都按图片 src 校验徽章归属
 *   - 金库卡片（集合页 Vault 标签，钱包解锁后可见，2026-10-09 DOM 结构核对）：
 *     button > img.aspect-square（图片自己就是方形、是按钮第一个子元素）+ 编号/档位行 → 徽章追加在按钮末尾，
 *     样式里用 :has() 给按钮定位上下文，徽章落在图片右下角，与市场卡片一致（小 / 中 / 大三档网格同一结构）
 *   - 金库「我的挂单」卡片 .sv-card.sv-listed = 小图 + 信息列（#N、Listed at）+ 取消按钮 → 徽章追加在信息列末尾
 *   - 金库藏品详情浮层 [role=dialog].sv-detail = 左栏大图 + 右栏（标题区、信息行、Traits）→ 明细面板插在标题区之后
 *   金库视图（卡片 / 挂单 / 浮层）是 shielded 专属组件：本集合页上照常标注，其它页面只标注快照里的藏品；
 *   市场视图（网格 / 列表）只在本集合页标注，其它页面上同样结构的卡片属于别的集合。
 *   - 详情页 /secondary/item/<铭文ID>：右栏是 h1 所在 .surface 卡片的父容器 → 明细面板插在标题卡之后
 * 独立 /wallet：新版 button.sv-tile > .aspect-square 与 .ps-art 大图，仅按已知铭文 ID 标注。
 * 集合拼图、奖励、待到账、创建/恢复、支付确认界面不注入；资产列表前显示统一区块依据。
 * 卡片名称上的编号不可靠（站点把资产 0/1/2 显示成 #1/#2/#3），一律按铭文 ID 查快照。
 *
 * 每次扫描都是「对账」：该有的徽章/面板补上或改对，扫描里没认领的一律删掉（离开集合页、节点被复用到
 * 别处、图片换成非铭文地址、跳到别的集合的详情页），保证页面上不残留归属错误的标注。
 */
(() => {
  'use strict';
  const BUNDLED = globalThis.SHNAKAS_SNAPSHOT;
  const R = globalThis.ShnakasRules;
  const I = globalThis.ShnakasI18n;
  const TIER = globalThis.ShnakasTier;
  const SRC = globalThis.ShnakasSource;
  if (!BUNDLED || !R || !I || !TIER || !SRC) throw new Error('SHNAKAS：快照、规则、文案、分级或数据来源模块未加载（检查 manifest 的脚本顺序）');
  const K = SRC.KEYS, EXP=globalThis.NakaExplore;
  const HOLD=globalThis.NakaPortfolio;let holdings=[], boostOnly=false;const impactCache=new Map();
  function portfolioImpact(id,action='sale'){const key=action+id;if(!impactCache.has(key))impactCache.set(key,HOLD.impact(SNAP,holdings,id,action,action==='cancel'?CANCELLATION:PURCHASE));return impactCache.get(key);}
  let comparisonIds=[], minimum=0, exploreLang='en';
  const exploreCopy=()=>globalThis.NakaExploreUI.pick(exploreLang);

  const DISPLAY_METRIC = 'total-holding-weight';
  const CONTENT_PREFIX = 'https://ordinals.com/content/';
  const ID_RE = /^[0-9a-f]{64}i\d+$/;
  const COLLECTION_PATH = /^\/secondary\/collections\/([^/]+)\/?$/;
  const WALLET_PATH = /^\/wallet\/?$/;
  const ITEM_PATH = /^\/secondary\/item\/([0-9a-f]{64}i\d+)\/?$/;
  const SLUG = BUNDLED.collection.slug;

  // ------------------------------------------------------------ 当前数据（本地同步优先）

  let SNAP = BUNDLED;
  let PURCHASE = globalThis.NakaPurchase.create(BUNDLED);
  let CANCELLATION = globalThis.NakaPurchase.create(BUNDLED,{action:'cancel'});
  let SOURCE = 'bundled'; // 'live' | 'synced' | 'bundled'
  const stored = { liveEnabled: SRC.LIVE_DEFAULT, live: undefined, manual: undefined };
  let T = I.pick(I.DEFAULT_LANG); // 读到存储里的语言设置前不会渲染任何东西，这里只是占位
  let GEN = 0; // 代号：换数据或换语言后递增，徽章/面板按代号判断是否需要重画
  const cache = new Map();

  /** 按 SRC.choose 选出要显示的数据（格式不符的本地数据来自不兼容的旧版本，升级时后台会清掉，不使用）。 */
  function useData() {
    const picked = SRC.choose(stored, BUNDLED);
    SNAP = picked.snap;
    PURCHASE = globalThis.NakaPurchase.create(SNAP);
    CANCELLATION = globalThis.NakaPurchase.create(SNAP,{action:'cancel'});
    SOURCE = picked.source;
    cache.clear();
    refresh();
  }

  /** 弹窗顶部切换的界面语言；没选过时为英文。 */
  function useLang(stored) {
    exploreLang=I.resolveLang(stored);
    T = I.pick(exploreLang);
    refresh();
  }

  function refresh() {
    GEN += 1;impactCache.clear();
  }

  // ------------------------------------------------------------ 计算（按铭文 ID 缓存）

  /** 快照里没有这件藏品时返回 null（快照之后才铸造的）。 */
  function resultFor(id) {
    if (cache.has(id)) return cache.get(id);
    const row = SNAP.items[id];
    let r = null;
    if (row) r = R.evaluateSnapshot(SNAP,id);
    cache.set(id, r);
    return r;
  }

  /** 样式类：分级颜色 shn-t-*，区间再加 shn-is-range（虚线框）。 */
  function classesOf(r) {
    return `shn-t-${TIER.tierOf(r)}${r && !r.exact ? ' shn-is-range' : ''}`;
  }

  // ------------------------------------------------------------ DOM 小工具

  function el(tag, cls, text) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function refreshScopeClock(bar) {
    const snapshot=SNAP.snapshot,ts=I.blockTimestamp(snapshot),delta=ts===null?null:Date.now()-ts*1000;
    const age=delta===null?T.scopeTimeUnknown:delta<0?T.scopeTimeFuture:T.ago(delta);
    const time=bar.querySelector('.shn-scope__age');
    if(time.textContent!==age)time.textContent=age;
    time.title=I.blockTimeTitle(T,snapshot);
    const activity=bar.dataset.shnActivity==='true';
    const launch=globalThis.NakaPurchase.renderLaunch(snapshot,T,I);
    const detail=[I.measureNote(T,snapshot.height,snapshot),I.blockTimeTitle(T,snapshot),activity?T.activityNote:bar.dataset.shnOwner==='true'?T.cancelScopeNote:Array.isArray(SNAP.offers)?T.buyBadgeNote:T.weightMeaning,...[...launch.children].map(n=>n.textContent)].join('\n');
    if(bar.title!==detail)bar.title=detail;
    const note=bar.querySelector('.shn-scope__detail');
    if(note.textContent!==detail)note.textContent=detail;
  }
  function refreshBlockClock() {
    for(const n of document.querySelectorAll('.naka-purchase__basis')) {
      const basis=T.snapBlock(I.blockBasis(T,SNAP.snapshot));
      if(n.textContent!==basis)n.textContent=basis;
      n.title=I.blockTimeTitle(T,SNAP.snapshot);
    }
    for(const bar of document.querySelectorAll('.shn-scope[data-shn-layout=compact-v1]')) refreshScopeClock(bar);
  }

  const lockIcon = cls => globalThis.NakaPixel.sigil(cls);

  function inspectionFor(id,activity=false,action='sale') {
    const model=action==='cancel'?CANCELLATION:PURCHASE;
    const r=resultFor(id);if(!r)return el('p','shn-pop__missing',T.notInSnapshot);
    const scenario=activity?null:model.get(id);
    if(scenario?.state==='ready'){const panel=globalThis.NakaPurchase.render(model,id,T,I);if(holdings.length){const x=portfolioImpact(id,action);if(x.state==='ready')panel.append(globalThis.NakaExploreUI.holdingsLine(x,exploreCopy()));}return panel;}
    const notice=scenario?.state==='no-floor'?(action==='cancel'?T.cancelNoFloor:T.buyNoFloor):null;
    return globalThis.NakaPurchase.renderCurrent(r,SNAP.snapshot,T,I,{activity,notice,action,rewardContext:R.rewardContext(SNAP,id,globalThis.NakaPurchase.listingStatus(SNAP,id)),listing:globalThis.NakaPurchase.listingStatus(SNAP,id),credits:action==='cancel'?null:globalThis.NakaPurchase.relayCredits(SNAP,id)});
  }
  function inspectionHead(id,cls) {
    const head=el('div',cls),brand=el('span','shn-inspect-brand');brand.append(lockIcon('shn-badge__icon'),el('span','shn-eyebrow',T.title));
    head.append(brand);
    const r=resultFor(id);if(r){const number=el('span','shn-inspect-number',`#${r.number.value}`),tag=globalThis.NakaPurchase.numberBadge(r.number.value,T);head.append(number);if(tag)head.append(tag);}
    if(r){
      const c=exploreCopy(),held=holdings.includes(id),own=el('button','shn-compare-add shn-holding-add',held?c.inHoldings:c.addHolding);
      own.type='button';own.title=held?c.holdingRemoveHint:c.holdingHint;own.setAttribute('aria-pressed',String(held));
      own.addEventListener('click',ev=>{ev.stopPropagation();ev.preventDefault();chrome.runtime.sendMessage({type:'shn-holdings',ids:[id],remove:held});});
      head.append(compareButton(id),own);
    }
    return head;
  }

  // ------------------------------------------------------------ 徽章（网格 / 列表）

  function fillBadge(b, id, kind, action='sale') {
    const model=action==='cancel'?CANCELLATION:PURCHASE,afterLabel=action==='cancel'?T.cancelAfter:T.buyAfterShort;
    const r = resultFor(id);
    const scenario=(kind==='grid' || kind==='list' || kind==='wallet'||kind==='vault'||kind==='listed') ? model.get(id) : null;
    const primary=scenario?.state==='ready'?scenario.result:scenario?.state==='no-floor'?null:r;
    b.className = `shn-badge shn-badge--${kind} ${classesOf(primary)}`;
    b.dataset.shnId = id;
    b.dataset.shnMetric = DISPLAY_METRIC;
    const listing=globalThis.NakaPurchase.listingStatus(SNAP,id);b.dataset.shnListing=listing;
    b.dataset.shnGen = String(GEN);b.dataset.shnAction=action;
    b.dataset.shnScenario=scenario?.state==='ready'?action:scenario?.state==='no-floor'?action+'-unavailable':'holding';
    if (primary) { b.dataset.shnWeightLo = String(primary.lo.weight); b.dataset.shnWeightHi = String(primary.hi.weight); }
    else { delete b.dataset.shnWeightLo; delete b.dataset.shnWeightHi; }
    const text = primary ? R.formatWeight(primary) : '—';
    const currentWeight=el('span','shn-badge__weight');
    const value=primary?globalThis.NakaPurchase.decorateWeight(el('span','shn-badge__txt'),primary):el('span','shn-badge__txt','—');
    currentWeight.append(lockIcon('shn-badge__icon'),el('span','shn-badge__label',scenario?.state==='no-floor'?afterLabel:T.weightShort),value);
    b.replaceChildren(currentWeight);
    if(scenario?.state==='ready') {
      b.classList.add('shn-badge--buy');
      const preview=el('span',`shn-buy-preview naka-tone-${TIER.tierOf(scenario.result)}`);preview.append(el('span','shn-badge__label',afterLabel),globalThis.NakaPurchase.decorateWeight(el('b','shn-badge__txt shn-buy-value'),scenario.result));
      preview.classList.toggle('shn-buy-preview--range',!scenario.result.exact);
      b.replaceChildren(preview);b.removeAttribute('title');
    } else b.removeAttribute('title');
    const numberTag=r?globalThis.NakaPurchase.numberBadge(r.number.value,T):null;if(numberTag)b.append(numberTag);
    b.tabIndex = 0;
    b.dataset.shnHeight = String(SNAP.snapshot.height);
    const description=scenario?.state==='ready' ? `${action==='cancel'?T.cancelTitle:T.buyTitle}: ${action==='cancel'?T.cancelBefore:T.formulaBefore} ${R.formatWeight(scenario.before)}, ${afterLabel} ${R.formatWeight(scenario.result)}. ${action==='cancel'?T.cancelAssumption:T.buyBadgeNote}` : scenario?.state==='no-floor'?`${afterLabel} —. ${action==='cancel'?T.cancelNoFloor:T.buyNoFloor}`:`${T.weight} ${text}.`;
    // markCompared() composes the accessible name from this description and the comparison selection.
    b.dataset.shnDescription = `${description} ${T.listing[listing].label}: ${T.listing[listing].meaning}. ${T.weightMeaning}${numberTag?' '+numberTag.getAttribute('aria-label')+'.':''} ${I.measureNote(T,SNAP.snapshot.height)}`;
  }

  /** 让槽位里恰好有一个归属正确的徽章，返回它。 */
  function ensureBadge(slot, id, kind, action='sale') {
    const all = slot.querySelectorAll(':scope > .shn-badge');
    for (let i = 1; i < all.length; i++) all[i].remove();
    const b = all[0];
    if (b) {
      if (b.dataset.shnMetric !== DISPLAY_METRIC || b.dataset.shnId !== id || b.dataset.shnGen !== String(GEN) || !b.classList.contains(`shn-badge--${kind}`) || b.dataset.shnAction!==action) fillBadge(b, id, kind, action);
      markCompared(b);
      return b;
    }
    const nb = el('span');
    fillBadge(nb, id, kind, action);
    markCompared(nb);
    slot.appendChild(nb);
    return nb;
  }

  const walletArtMaps=new WeakMap();
  function idFromSrc(src) {
    if (!src) return null;
    if(src.startsWith(CONTENT_PREFIX)){const id=src.slice(CONTENT_PREFIX.length).split(/[?#]/)[0];return ID_RE.test(id)?id:null;}
    // The standalone wallet loads its own API art first, with Ordinals only as fallback.
    if(!WALLET_PATH.test(location.pathname)&&COLLECTION_PATH.exec(location.pathname)?.[1]!==SLUG)return null;
    let url;try{url=new URL(src,location.origin);}catch{return null;}
    if(url.username||url.password||!['https://shielded-api.ord-dropz.xyz','https://shielded-mint-server-production.up.railway.app'].includes(url.origin))return null;
    const match=/^\/api\/shielded\/art\/(0|[1-9]\d*)$/.exec(url.pathname);
    if(!match||url.searchParams.getAll('c').length!==1||url.searchParams.get('c')!==SNAP.collection.cid)return null;
    const asset=Number(match[1]);if(!Number.isSafeInteger(asset))return null;
    let ids=walletArtMaps.get(SNAP);if(!ids){ids=new Map(Object.entries(SNAP.items).map(([id,row])=>[row[0]-SNAP.collection.numberStart,id]));walletArtMaps.set(SNAP,ids);}
    return ids.get(asset)??null;
  }

  /** 网格卡片的图片框；不是网格卡片返回 null。 */
  function gridSlot(img) {
    const box = img.closest('.aspect-square');
    if (!box) return null;
    const card = box.parentElement;
    return card && card.classList.contains('group') && card.firstElementChild === box ? box : null;
  }

  /** 金库卡片的按钮；不是金库卡片返回 null。详情页顶部缩略图条是 button > div > img，不会命中。 */
  function vaultSlot(img) {
    const btn = img.parentElement;
    return btn && btn.tagName === 'BUTTON' && btn.firstElementChild === img && img.classList.contains('aspect-square') ? btn : null;
  }

  /** Standalone wallet: individual tiles / piece artwork only, never collection mosaics,
   * staking rows or payment/backup screens. Identity remains inscription-based. A market tile whose sale is pending
   * (dimmed artwork with a SOLD tag until the page refreshes) is still that piece: it keeps a badge like the market grid. */
  function walletSlot(img) {
    if (!WALLET_PATH.test(location.pathname)) return null;
    const box = img.parentElement;
    const card = box?.parentElement;
    if (box?.classList.contains('aspect-square') && box.firstElementChild === img
      && card?.matches('button.sv-tile') && card.firstElementChild === box
      && card.closest('.sv-piece-grid')?.closest('.sv-shell')) return box;
    if (box?.classList.contains('ps-art') && box.firstElementChild === img
      && box.closest('.ps-wrap[role="dialog"]')?.querySelector('.ps-head')) return box;
    return null;
  }

  /** Owner asset cards have a titled truncated valuation caption; the wallet market uses plain captions.
   * Match component structure only, never read wallet labels, balances or private storage. */
  function ownWalletSlot(slot) {
    if(!WALLET_PATH.test(location.pathname))return false;
    if(slot.classList.contains('ps-art'))return Boolean(slot.closest('.ps-wrap[role="dialog"]')?.querySelector('.ps-head'));
    return Boolean(slot.parentElement?.matches('button.sv-tile') && slot.parentElement.querySelector('.sv-tile-meta .sv-tile-caption > span.truncate[title]'));
  }

  /** 金库「我的挂单」卡片的信息列；不是挂单卡片返回 null。 */
  function listedSlot(img) {
    const card = img.parentElement;
    if (!card || !card.classList.contains('sv-listed') || card.firstElementChild !== img) return null;
    const info = img.nextElementSibling;
    return info && info.tagName === 'DIV' ? info : null;
  }

  /** 金库藏品详情浮层右栏的标题区（面板插在它后面）；不是详情浮层的大图返回 null。 */
  function modalHead(img) {
    if (!img.closest('[role="dialog"].sv-detail')) return null;
    const pane = img.parentElement;
    const info = pane && pane.nextElementSibling;
    return info ? info.firstElementChild : null;
  }

  /** 列表行的名称格；不是列表行返回 null（详情页顶部缩略图条会落到这里）。 */
  function listSlot(img) {
    const thumb = img.closest('.flex-shrink-0');
    const cell = thumb && thumb.parentElement;
    if (!cell || !cell.querySelector(':scope > .min-w-0 > p[title]')) return null;
    const rowEl = cell.parentElement;
    return rowEl && rowEl.classList.contains('group') && rowEl.className.includes('grid-cols-') ? cell : null;
  }

  /**
   * 扫描页面上的藏品图，认领到的徽章 / 面板记进 keepBadges / keepPanels。
   * 一个槽位只认文档顺序里的第一张铭文图，避免两张图来回改写同一个徽章。
   */
  function scanImages(onCollection, keepBadges, keepPanels) {
    const slots = new Set();
    const images=new Set(document.querySelectorAll(`img[src^="${CONTENT_PREFIX}"]`));
    if(onCollection)for(const img of document.querySelectorAll('img[src*="/api/shielded/art/"]'))images.add(img);
    if(WALLET_PATH.test(location.pathname))for(const img of document.querySelectorAll('.sv-shell .sv-piece-grid button.sv-tile > .aspect-square > img,.ps-wrap[role="dialog"] .ps-art > img'))images.add(img);
    for (const img of images) {
      const id = idFromSrc(img.getAttribute('src'));
      if (id === null) continue;
      const vaultOk = onCollection || Boolean(SNAP.items[id]);
      let kind = null;
      let slot = null;
      if (SNAP.items[id] && (slot = walletSlot(img))) kind = 'wallet';
      else if (onCollection && (slot = gridSlot(img))) kind = 'grid';
      else if (vaultOk && (slot = vaultSlot(img))) kind = 'vault';
      else if (vaultOk && (slot = listedSlot(img))) kind = 'listed';
      else if (onCollection && (slot = listSlot(img))) kind = 'list';
      else if (vaultOk && (slot = modalHead(img))) kind = 'modal';
      if (!slot || slots.has(slot)) continue;
      slots.add(slot);
      if (kind === 'modal') keepPanels.add(ensurePanelAfter(slot, id, 'modal'));
      else keepBadges.add(ensureBadge(slot, id, kind,kind==='vault'||kind==='listed'||kind==='wallet'&&ownWalletSlot(slot)?'cancel':'sale'));
    }
  }

  /** Activity uses inscription IDs from row links; thumbnails can still be lazy/unloaded. */
  function activityIdentity(link) {
    if (!link.classList.contains('grid') || !link.className.includes('grid-cols-')) return null;
    const url = new URL(link.getAttribute('href'), location.origin);
    const match = ITEM_PATH.exec(url.pathname);
    if (url.origin !== location.origin || !match || (url.searchParams.has('collection') && url.searchParams.get('collection') !== SLUG)) return null;
    const cell = link.firstElementChild;
    const slot = cell?.querySelector(':scope > .min-w-0');
    return slot ? { id: match[1], slot } : null;
  }

  function scanActivity(onCollection, keepBadges) {
    if (!onCollection) return false;
    let found = false;
    for (const link of document.querySelectorAll('main a.grid[href*="/secondary/item/"]')) {
      const identity = activityIdentity(link);
      if (!identity) continue;
      found = true;
      keepBadges.add(ensureBadge(identity.slot, identity.id, 'activity'));
    }
    return found;
  }

  // ------------------------------------------------------------ 详情页面板

  function buildPanel(id, variant) {
    const r = resultFor(id);
    const p = el('section', `shn-panel shn-panel--${variant} ${classesOf(r)}`);
    p.dataset.shnId = id;
    p.dataset.shnMetric = DISPLAY_METRIC;
    p.dataset.shnGen = String(GEN);
    p.dataset.shnHeight = String(SNAP.snapshot.height);
    if (r) { p.dataset.shnWeightLo = String(r.lo.weight); p.dataset.shnWeightHi = String(r.hi.weight); }
    p.append(inspectionHead(id,'shn-panel__head'),inspectionFor(id));
    return p;
  }

  /**
   * 详情页：返回本次认领的面板（不是本集合的藏品、或页面还没渲染完时返回 null）。
   * 本集合的判定：铭文在快照里；或者 URL 带 ?collection=<本集合>——站点从集合页点进详情页时会带上这个参数，
   * 快照之后才铸造的藏品靠它识别，面板显示「不在快照中」。
   */
  function scanItem(id) {
    const ours = Boolean(SNAP.items[id]) || new URLSearchParams(location.search).get('collection') === SLUG;
    if (!ours) return null;
    const h1 = document.querySelector('main h1');
    const card = h1 && h1.closest('.surface');
    if (!card || !card.parentElement) return null; // 还没渲染完，等下一次变更
    return ensurePanelAfter(card, id, 'item');
  }

  /** 让 anchor 后面紧跟一块归属正确的面板，返回它。 */
  function ensurePanelAfter(anchor, id, variant) {
    const cur = anchor.nextElementSibling;
    if (cur && cur.classList.contains('shn-panel') && cur.dataset.shnMetric === DISPLAY_METRIC && cur.dataset.shnId === id && cur.dataset.shnGen === String(GEN)) return cur;
    const p = buildPanel(id, variant);
    anchor.after(p);
    return p;
  }

  // ------------------------------------------------------------ 悬浮明细

  let pop = null;
  let popFor = null;
  let popGen = null;
  let popId = null; // 列表节点复用时徽章会换成别的藏品，悬浮层要跟着失效
  let popViewport = null;
  const popResize = new ResizeObserver(() => { if (popFor) positionPop(); });

  function hidePop() {
    if (!pop || !popFor) return;
    pop.classList.remove('shn-pop--show');
    popFor.removeAttribute('aria-describedby');
    popFor.removeAttribute('data-shn-open');
    popResize.disconnect();
    popFor = null;
    popId = null;
    popGen = null;
    popViewport = null;
  }

  function showPop(badge) {
    if(popFor && popFor !== badge) hidePop();
    const r = resultFor(badge.dataset.shnId);
    if (!pop) { pop = el('div', 'shn-pop'); pop.id = 'shn-weight-tooltip'; pop.setAttribute('role', 'tooltip'); pop.tabIndex = 0; document.body.appendChild(pop); }
    badge.setAttribute('aria-describedby', pop.id);
    popFor = badge;
    popId = badge.dataset.shnId;
    popGen = badge.dataset.shnGen;
    const surface=el('div','shn-pop__surface');
    surface.append(inspectionHead(badge.dataset.shnId,'shn-pop__head'),inspectionFor(badge.dataset.shnId,badge.classList.contains('shn-badge--activity'),badge.dataset.shnAction));
    const pointer=el('span','shn-pop__pointer');pointer.setAttribute('aria-hidden','true');
    const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
    const group=document.createElementNS(svg.namespaceURI,'g');
    for(const cls of ['shn-pop__pointer-fill','shn-pop__pointer-edge']) {
      const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('class',cls);group.append(path);
    }
    svg.append(group);pointer.append(svg);pop.replaceChildren(surface,pointer);
    pop.className = `shn-pop ${classesOf(r)}`;
    badge.setAttribute('data-shn-open','true');
    if (!positionPop()) return;
    pop.classList.add('shn-pop--show');
    popResize.disconnect();popResize.observe(surface);popResize.observe(badge);
  }

  function viewportRect() {
    const view=window.visualViewport;
    const v={left:view?.offsetLeft??0,top:view?.offsetTop??0,
      width:Math.min(document.documentElement.clientWidth,innerWidth,view?.width??Infinity),
      height:Math.min(document.documentElement.clientHeight,innerHeight,view?.height??Infinity)};
    v.right=v.left+v.width;v.bottom=v.top+v.height;return v;
  }
  function closeOnViewportChange() {
    if(!popFor || !popViewport)return;
    const v=viewportRect();
    if(['left','top','width','height'].some(k=>v[k]!==popViewport[k]))hidePop();
  }
  function positionPop() {
    // The bubble touches its badge (G=0), so the pointer moves straight from badge to inspection with no gap to cross.
    const M=8,G=0,v=viewportRect();popViewport=v;
    const clamp=(n,lo,hi)=>Math.max(lo,Math.min(n,hi));
    const visibleRect=node=>{
      const r=node.getBoundingClientRect(),out={left:Math.max(r.left,v.left),right:Math.min(r.right,v.right),top:Math.max(r.top,v.top),bottom:Math.min(r.bottom,v.bottom)};
      for(let parent=node.parentElement;parent && parent!==document.documentElement;parent=parent.parentElement) {
        const css=getComputedStyle(parent),p=parent.getBoundingClientRect();
        if(/auto|scroll|hidden|clip/.test(css.overflowX)){out.left=Math.max(out.left,p.left+parent.clientLeft);out.right=Math.min(out.right,p.left+parent.clientLeft+parent.clientWidth);}
        if(/auto|scroll|hidden|clip/.test(css.overflowY)){out.top=Math.max(out.top,p.top+parent.clientTop);out.bottom=Math.min(out.bottom,p.top+parent.clientTop+parent.clientHeight);}
      }
      return out;
    };
    const a=visibleRect(popFor);let target=visibleRect(popFor.querySelector('.shn-buy-preview,.shn-badge__weight')??popFor);
    if(a.right<=a.left || a.bottom<=a.top){hidePop();return false;}
    // A selected badge's "✓ Compare" tab sits on top of it and belongs to its hover area; the bubble clears it.
    if(popFor.matches('.shn-badge--grid[data-shn-compared],.shn-badge--vault[data-shn-compared],.shn-badge--wallet[data-shn-compared]')) a.top=Math.max(v.top,a.top-parseFloat(getComputedStyle(popFor,'::before').height));
    if(target.right<=target.left || target.bottom<=target.top)target=a;
    const surface=pop.querySelector('.shn-pop__surface');
    pop.style.width=`${Math.max(1,Math.floor(Math.min(420,v.width-2*M)))}px`;
    const w=pop.offsetWidth,css=getComputedStyle(surface);
    const natural=Math.ceil(surface.scrollHeight+parseFloat(css.borderTopWidth)+parseFloat(css.borderBottomWidth));
    const room={bottom:a.top-v.top-M-G,top:v.bottom-M-a.bottom-G,right:a.left-v.left-M-G,left:v.right-M-a.right-G};
    let side=natural<=room.bottom?'bottom':natural<=room.top?'top':
      w<=room.right?'right':w<=room.left?'left':room.bottom>=room.top?'bottom':'top';
    const limit=Math.max(1,Math.floor(Math.min(v.height-2*M,side==='top'||side==='bottom'?room[side]:v.height-2*M)));
    surface.style.maxHeight=`${limit}px`;
    const h=pop.offsetHeight,cx=(target.left+target.right)/2,cy=(target.top+target.bottom)/2;
    // Round toward the badge so the shared edge never opens a sub-pixel gap.
    const left=side==='right'?Math.ceil(a.left-w):side==='left'?Math.floor(a.right):Math.round(clamp(cx-w/2,v.left+M,v.right-w-M));
    const top=side==='bottom'?Math.ceil(a.top-h):side==='top'?Math.floor(a.bottom):Math.round(clamp(cy-h/2,v.top+M,v.bottom-h-M));
    pop.style.left=`${left}px`;pop.style.top=`${top}px`;pop.dataset.shnSide=side;
    drawTail(side,a,w,h);
    return true;
  }

  /**
   * Speech-bubble tail beside the badge on the shared edge, curling toward it. Canonical shape in (u along the edge,
   * n outward) units: base u 0..11 on the edge, tip at u 17, n 12. It goes before the badge when the bubble edge has
   * room there, otherwise after it (mirrored); with no room on either side the bubble needs no tail.
   */
  function drawTail(side,a,w,h) {
    const pointer=pop.querySelector('.shn-pop__pointer'),svg=pointer.firstChild,[fill,edge]=svg.firstChild.children;
    const rect=pop.getBoundingClientRect(),vertical=side==='top'||side==='bottom',span=vertical?w:h,CLEAR=10;
    const near=vertical?a.left-rect.left:a.top-rect.top,far=vertical?a.right-rect.left:a.bottom-rect.top;
    const before=near-19,after=far+19;
    let s0,dir;
    if(before>=CLEAR){s0=before;dir=1;}
    else if(after<=span-CLEAR){s0=after;dir=-1;}
    else {pointer.style.display='none';pop.dataset.shnTail='none';return;}
    const map=(u,n)=>{const p=s0+dir*u;return side==='bottom'?[p,h+n]:side==='top'?[p,-n]:side==='right'?[w+n,p]:[-n,p];};
    const pt=(u,n)=>map(u,n).map(x=>Math.round(x*10)/10).join(' ');
    const curve=`M${pt(0,0)}C${pt(2,6)} ${pt(8,11)} ${pt(17,12)}C${pt(12,8)} ${pt(11,4)} ${pt(11,0)}`;
    fill.setAttribute('d',`M${pt(0,-2.5)}L${curve.slice(1)}L${pt(11,-2.5)}Z`);
    edge.setAttribute('d',curve);
    pointer.style.display='';
    pointer.style.left='0px';pointer.style.top='0px';pointer.style.width=`${w}px`;pointer.style.height=`${h}px`;
    svg.setAttribute('viewBox',`0 0 ${w} ${h}`);
    pop.dataset.shnTail=dir===1?'before':'after';
  }

  document.addEventListener('mouseover', (e) => {
    if (pop?.contains(e.target)) return;
    const b = e.target instanceof Element ? e.target.closest('.shn-badge') : null;
    if (b === popFor) return;
    if (b) showPop(b);
    else hidePop();
  }, true);
  document.addEventListener('mouseout', (e) => {
    if (e.relatedTarget === null) { hidePop(); return; }
    const fromBadge=e.target instanceof Element && e.target.closest('.shn-badge')===popFor;
    if ((fromBadge || pop?.contains(e.target)) && !popFor?.contains(e.relatedTarget) && !pop?.contains(e.relatedTarget)) hidePop();
  }, true);
  document.addEventListener('focusin', (e) => { if (e.target.matches?.('.shn-badge')) showPop(e.target); });
  document.addEventListener('focusout', (e) => {
    if ((e.target.matches?.('.shn-badge') || pop?.contains(e.target)) && !pop?.contains(e.relatedTarget)) hidePop();
  });
  // The badge is a separate inspection target, including inside a card link/button.
  document.addEventListener('click', (e) => {
    const b = e.target instanceof Element ? e.target.closest('.shn-badge') : null;
    if (b) { e.preventDefault(); e.stopPropagation(); showPop(b); }
    else if (!pop?.contains(e.target)) hidePop();
  }, true);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hidePop();
    if (e.target.matches?.('.shn-badge') && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); e.stopPropagation(); showPop(e.target); }
  }, true);
  window.addEventListener('scroll', (e) => { if (!pop?.contains(e.target)) hidePop(); }, true);
  window.addEventListener('blur', hidePop);
  window.addEventListener('resize', closeOnViewportChange);
  window.visualViewport?.addEventListener('resize',closeOnViewportChange);
  window.visualViewport?.addEventListener('scroll',closeOnViewportChange);

  // ------------------------------------------------------------ 调度

  function scanScope(onCollection, onActivity) {
    const existing = [...document.querySelectorAll('.shn-scope')];
    const heading = onCollection ? document.querySelector('main h1') : null;
    const walletGrid = WALLET_PATH.test(location.pathname) ? [...document.querySelectorAll('.sv-shell .sv-piece-grid')].find(g => g.querySelector('.shn-badge--wallet')) : null;
    const ownerContext=Boolean(walletGrid?.querySelector('[data-shn-action=cancel]'));
    const anchor = walletGrid || heading?.closest('.mb-3') || heading?.parentElement;
    if (!anchor) { existing.forEach((n) => n.remove()); return; }
    const current = existing.find((n) => walletGrid ? n.nextElementSibling === anchor : n.previousElementSibling === anchor);
    if (current && current.dataset.shnLayout === 'compact-v1' && current.dataset.shnMetric === DISPLAY_METRIC && current.dataset.shnGen === String(GEN) && current.dataset.shnActivity === String(onActivity) && current.dataset.shnOwner===String(ownerContext)) {
      existing.filter((n) => n !== current).forEach((n) => n.remove());
      return;
    }
    existing.forEach((n) => n.remove());
    const bar = el('aside', walletGrid ? 'shn-scope shn-scope--wallet' : 'shn-scope');
    bar.dataset.shnGen = String(GEN);
    bar.dataset.shnMetric = DISPLAY_METRIC;
    bar.dataset.shnActivity = String(onActivity);bar.dataset.shnOwner=String(ownerContext);
    bar.dataset.shnHeight = String(SNAP.snapshot.height);
    bar.dataset.shnLayout='compact-v1';
    bar.tabIndex=0;
    bar.setAttribute('aria-label', `${T.title} · ${T.popupSnapshot}`);
    bar.setAttribute('aria-describedby','shn-scope-details');
    const line = el('div', 'shn-scope__head');
    line.append(lockIcon('shn-badge__icon'),el('span','shn-scope__brand',T.title),el('b','shn-scope__block',T.snapBlock(I.int(SNAP.snapshot.height))),el('span','shn-scope__age'),el('span','shn-scope__source',T.scopeSource[SOURCE]));
    const detail=el('span','shn-sr-only shn-scope__detail');detail.id='shn-scope-details';
    bar.append(line,el('p','shn-scope__note',onActivity?T.scopeActivity:T.scopeNote),detail);
    refreshScopeClock(bar);
    if (walletGrid) anchor.before(bar); else anchor.after(bar);
  }

  // ------------------------------------------------------------ 比较选择：按钮、徽章标记与工具栏计数同步显示

  /** Selection changed (here, in the popup or in Compare): repaint every control, badge marker and the count. */
  function updateCompare() {
    for(const b of document.querySelectorAll('.shn-compare-add')) paintCompareButton(b);
    for(const b of document.querySelectorAll('.shn-badge')) markCompared(b);
    updateCompareCount();
  }
  function updateCompareCount() {
    const open=document.querySelector('.shn-tools__open');if(!open)return;
    const text=`${exploreCopy().compare} (${comparisonIds.length}/${EXP.MAX}) ↗`;if(open.textContent!==text)open.textContent=text;
  }
  /** Add, remove (when selected) or explain a full selection; never a silent disabled state. */
  function paintCompareButton(b) {
    const state=EXP.compareState(comparisonIds,b.dataset.id);
    if(b.dataset.compare===state && b.dataset.lang===exploreLang) return;
    globalThis.NakaExploreUI.paintCompare(b,state,exploreCopy());b.dataset.lang=exploreLang;
  }
  /** Selected NFTs are marked on every badge, so the selection is visible without opening an inspection. */
  function markCompared(b) {
    const selected=comparisonIds.includes(b.dataset.shnId),c=exploreCopy();
    if(!selected) { if(b.dataset.shnCompared!==undefined) delete b.dataset.shnCompared; }
    else if(b.dataset.shnCompared!==c.inCompareTag) b.dataset.shnCompared=c.inCompareTag;
    const label=selected?`${b.dataset.shnDescription} ${c.inCompare}.`:b.dataset.shnDescription;
    if(b.getAttribute('aria-label')!==label) b.setAttribute('aria-label',label);
  }
  function compareButton(id) {
    const b=el('button','shn-compare-add');
    b.type='button';b.dataset.id=id;paintCompareButton(b);
    b.addEventListener('click',async ev=>{
      ev.preventDefault();ev.stopPropagation();
      if(b.dataset.compare==='full'){chrome.runtime.sendMessage({type:'shn-open-compare',section:'compare'});return;}
      b.disabled=true;
      try{
        const res=await chrome.runtime.sendMessage({type:'shn-compare',action:'toggle',id});if(!res?.ok)throw Error('save');
        comparisonIds=res.ids;updateCompare();
        if(res.state==='missing'){b.textContent=exploreCopy().missing;delete b.dataset.compare;}
      }catch{b.textContent=exploreCopy().addError;b.disabled=false;delete b.dataset.compare;}
    });return b;
  }
  function scanTools(onCollection,onActivity) {
    const active=onCollection&&!onActivity,scope=document.querySelector('.shn-scope');
    let tools=document.querySelector('.shn-tools');
    if(!active||!scope){tools?.remove();for(const n of document.querySelectorAll('.shn-filtered'))n.classList.remove('shn-filtered');return;}
    const c=exploreCopy();
    if(!tools||tools.dataset.gen!==String(GEN)){
      tools?.remove();tools=el('div','shn-tools');tools.dataset.gen=String(GEN);
      const label=el('label','',c.filter),select=el('select','shn-tools__filter');
      for(const v of [0,150,200,250,300,350,400]){const o=el('option','',v?`${v}%`:c.any);o.value=String(v);select.append(o);}const boost=el('option','',c.boost);boost.value='portfolio';boost.disabled=!holdings.length;boost.title=holdings.length?c.boostHint:c.boostEmpty;select.append(boost);select.value=boostOnly?'portfolio':String(minimum);select.title=c.filterNote;select.setAttribute('aria-label',c.filter);
      select.addEventListener('change',()=>{boostOnly=select.value==='portfolio';minimum=boostOnly?0:Number(select.value);scan();});label.append(select);
      const count=el('span','shn-tools__count'),open=el('button','shn-tools__open');open.type='button';open.title=c.open;
      open.addEventListener('click',()=>chrome.runtime.sendMessage({type:'shn-open-compare',section:'compare'}));tools.append(label,count,open);scope.append(tools);
    }
    const roots=new Set();let total=0,shown=0;
    for(const b of document.querySelectorAll('.shn-badge--grid,.shn-badge--list')){
      const root=b.parentElement?.parentElement;if(!root||roots.has(root))continue;roots.add(root);total++;
      const impact=boostOnly?portfolioImpact(b.dataset.shnId):null;const matches=EXP.matches(EXP.entry(SNAP,PURCHASE,b.dataset.shnId),minimum)&&(!boostOnly||impact?.state==='ready'&&impact.allocation.delta.lo>0);
      root.classList.toggle('shn-filtered',!matches);if(matches)shown++;
    }
    for(const root of document.querySelectorAll('.shn-filtered'))if(!roots.has(root))root.classList.remove('shn-filtered');
    const count=tools.querySelector('.shn-tools__count'),text=minimum&&shown===0?c.noMatches:c.shown(shown,total);if(count.textContent!==text)count.textContent=text;
    tools.title=c.filterNote;updateCompareCount();
  }

  /** Holdings bar on the Vault and the standalone wallet: the weekly SHNAKAS the pieces shown here earn (official
   * preview split), one action to keep them in My holdings, and the read-only promise. Ownership is never read from the
   * wallet: only the artwork identities already on the page, and nothing leaves the device. */
  function scanHoldings(){
    const badges=[...document.querySelectorAll('.shn-badge--vault,.shn-badge--wallet[data-shn-action=cancel]')];
    const ids=[...new Set(badges.map(b=>b.dataset.shnId).filter(id=>Object.hasOwn(SNAP.items,id)))];let bar=document.querySelector('.shn-holdings-import');
    const first=badges[0],anchor=first?.classList.contains('shn-badge--wallet')?first.closest('.sv-piece-grid'):first?.parentElement?.parentElement?.parentElement;
    if(!ids.length||!anchor){bar?.remove();return;}
    const c=exploreCopy(),U=globalThis.NakaExploreUI,state=`${ids.join()}|${exploreLang}|${holdings.join()}|${SNAP.snapshot.height}|${SNAP.snapshot.generatedAt}`;
    if(bar&&bar.dataset.state===state)return;
    bar?.remove();bar=el('section','shn-holdings-import');bar.dataset.state=state;
    const page=HOLD.current(SNAP,ids),mine=HOLD.current(SNAP,holdings),added=ids.filter(id=>holdings.includes(id)).length,rest=ids.length-added;
    const summary=el('div','shn-hb-summary'),figure=el('div','shn-hb-figure'),value=U.shn(page.allocation.weekly);
    figure.append(el('span','shn-hb-label',`${c.pageHoldings} · ${c.weekly}`),el('span','shn-sr',value));
    const big=el('span','shn-hb-value');big.append(globalThis.NakaPixel.digits(value,'shn-hb-digits'),el('span','shn-hb-unit',c.weekUnit));figure.append(big);
    figure.append(el('span','shn-hb-sub',`${c.pageWeekly(ids.length)} · ${c.ofPool(U.percent(page.allocation.share))} · ${c.blockBasis(I.int(SNAP.snapshot.height))}`));
    figure.title=c.allocationBasis;summary.append(lockIcon('shn-hb-sigil'),figure);
    const actions=el('div','shn-hb-actions');
    const button=el('button','shn-compare-add shn-hb-add',rest===0?c.addedVisible(ids.length):rest===ids.length?c.addVisible(ids.length):c.addRest(rest,added));
    button.type='button';button.disabled=rest===0;button.dataset.state=rest===0?'all':rest===ids.length?'none':'some';button.title=c.holdingsNote;
    button.addEventListener('click',async()=>{button.disabled=true;const out=await chrome.runtime.sendMessage({type:'shn-holdings',ids});if(!out?.ok){button.disabled=false;button.textContent=c.addError;}});
    const open=el('button','shn-compare-add shn-hb-open',c.openHoldings);open.type='button';open.addEventListener('click',()=>chrome.runtime.sendMessage({type:'shn-open-compare',section:'holdings'}));
    actions.append(button,open);
    bar.append(summary,actions);
    // My holdings can include other accounts: show its own total when it is not exactly this page.
    if(mine.ids.length&&(mine.ids.length!==ids.length||mine.ids.some(id=>!ids.includes(id)))){const foot=el('div','shn-hb-foot');foot.append(el('span','shn-hb-mine',c.myHoldingsLine(mine.ids.length,U.shn(mine.allocation.weekly))));bar.append(foot);}
    anchor.before(bar);
  }

  // Explicit import of visible official staking eligibility. No amounts, wallet secrets or hidden state are read.
  function scanRewardEligibility(){
    const progress=document.querySelector('.sv-shell .st-week[role="progressbar"]'),rows=[...document.querySelectorAll('.sv-shell .st-rows .st-row[data-state]')];let bar=document.querySelector('.shn-reward-import');
    if(!WALLET_PATH.test(location.pathname)||!progress||!rows.length){bar?.remove();return;}
    const list=[];for(const row of rows){const image=row.querySelector('img'),id=idFromSrc(image?.getAttribute('src')),label=row.querySelector('.st-row-title')?.textContent?.trim();if(!id||!SNAP.items[id]||label!==`#${SNAP.items[id][0]}`||!['earning','claimable','waiting','paused','past','before'].includes(row.dataset.state))continue;list.push({id,state:row.dataset.state});}
    if(!list.length){bar?.remove();return;}if(bar&&bar.dataset.lang===exploreLang)return;bar?.remove();
    bar=el('div','shn-reward-import');bar.dataset.lang=exploreLang;const button=el('button','shn-compare-add',exploreLang==='zh'?'将当前奖励资格同步到插件':'Sync displayed eligibility to Naka Sigil');button.type='button';button.title=exploreLang==='zh'?'只读取已显示藏品的计奖状态，不操作领取':'Reads visible earning states only. Does not claim rewards.';
    button.addEventListener('click',async()=>{const week=Number(progress.getAttribute('aria-label')?.match(/\d+/)?.[0]),numbers=(progress.querySelector('.st-week-foot')?.textContent?.match(/\d[\d,]*/g)??[]).map(v=>Number(v.replaceAll(',','')));if(!Number.isInteger(week)||week<1||week>78||numbers.length<2||numbers[1]!==1008||numbers[0]<0||numbers[0]>1008)return;
      const entries=[];for(const row of document.querySelectorAll('.sv-shell .st-rows .st-row[data-state]')){const id=idFromSrc(row.querySelector('img')?.getAttribute('src'));if(id&&SNAP.items[id]&&row.querySelector('.st-row-title')?.textContent.trim()===`#${SNAP.items[id][0]}`)entries.push({id,state:row.dataset.state});}
      button.disabled=true;try{const out=await chrome.runtime.sendMessage({type:'shn-import-eligibility',height:ShnakasRules.RULES.startBlock+(week-1)*1008+numbers[0],week:week-1,rows:entries});button.textContent=out?.ok?(exploreLang==='zh'?'✓ 已同步到本机':'✓ Synced locally'):(exploreLang==='zh'?'请先等待最新区块同步':'Wait for the latest block sync');}finally{button.disabled=false;}});bar.append(button);progress.closest('.st-hero')?.after(bar);
  }

  function scan() {
    const path = location.pathname;
    const c = COLLECTION_PATH.exec(path);
    const keepBadges = new Set();
    const keepPanels = new Set();
    const onCollection = Boolean(c) && c[1] === SLUG;
    const onActivity = scanActivity(onCollection, keepBadges);
    scanImages(onCollection, keepBadges, keepPanels);
    scanScope(onCollection, onActivity);
    const m = ITEM_PATH.exec(path);
    if (m) {
      const p = scanItem(m[1]);
      if (p) keepPanels.add(p);
    }
    for (const b of document.querySelectorAll('.shn-badge')) if (!keepBadges.has(b)) b.remove();
    for (const p of document.querySelectorAll('.shn-panel')) if (!keepPanels.has(p)) p.remove();
    scanTools(onCollection,onActivity);scanRewardEligibility();scanHoldings();
    if (popFor && (!popFor.isConnected || popFor.dataset.shnId !== popId || popFor.dataset.shnGen !== popGen)) hidePop();
    else if(popFor) positionPop();
  }

  // 直接在 MutationObserver 回调（微任务，React 提交之后）里扫描，徽章与站点内容同帧出现。
  // 不用 requestAnimationFrame：站点加载大数据时帧会停摆十几秒（2026-10-08 实测 rAF 12 秒只跑了 6 次），
  // 期间重渲染出来的卡片会一直没有徽章。实测滚到 1743 张卡片时单次全量扫描约 1.5ms，
  // 页面空闲时 10 秒内没有任何变更批次，逐批全量扫描的开销可以忽略。
  // 自己写 DOM 也会触发一次回调，但那次扫描发现一切已就位，不再写 DOM，不会循环。
  // 先读本地数据与语言设置再开始标注，避免先画内置数据 / 默认语言、再闪成别的
  chrome.storage.local.get([K.manual, K.live, K.liveEnabled, I.STORAGE_KEY, EXP.KEY,HOLD.KEY]).then((got) => {
    comparisonIds=EXP.normalize(got[EXP.KEY]);holdings=HOLD.normalize(got[HOLD.KEY]);
    useLang(got[I.STORAGE_KEY]);
    stored.liveEnabled = SRC.resolveLive(got[K.liveEnabled]);
    stored.live = got[K.live];
    stored.manual = got[K.manual];
    useData();
    new MutationObserver(scan).observe(document.documentElement, {
      childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'href'],
    });
    scan();
  });
  // 实时数据更新、载入指定区块、切换模式或语言：换数据 / 文案并原地重画（GEN 变了，所有徽章/面板都会重画）
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    const has = (k) => Object.prototype.hasOwnProperty.call(changes, k);
    const dataChanged = has(K.manual) || has(K.live) || has(K.liveEnabled);
    if(has(EXP.KEY)){comparisonIds=EXP.normalize(changes[EXP.KEY].newValue);updateCompare();}
    if(has(HOLD.KEY)){holdings=HOLD.normalize(changes[HOLD.KEY].newValue);if(!holdings.length)boostOnly=false;refresh();}
    if (!dataChanged && !has(I.STORAGE_KEY)&&!has(HOLD.KEY)) return;
    if (has(I.STORAGE_KEY)) useLang(changes[I.STORAGE_KEY].newValue);
    if (has(K.liveEnabled)) stored.liveEnabled = SRC.resolveLive(changes[K.liveEnabled].newValue);
    if (has(K.live)) stored.live = changes[K.live].newValue;
    if (has(K.manual)) stored.manual = changes[K.manual].newValue;
    if (dataChanged) useData();
    hidePop();
    scan();
  });

  // 心跳：页面可见时告诉后台「有人在看」，实时同步据此决定要不要检查新区块。
  // 扩展被重新加载后，旧页面里的这份脚本与扩展失联（chrome.runtime.id 变为 undefined），此时停掉心跳，不再报错。
  let beatTimer = null;
  function beat() {
    if (chrome.runtime.id === undefined) { clearInterval(beatTimer); return; }
    if (document.visibilityState === 'visible') chrome.runtime.sendMessage({ type: 'shn-visible' });
  }
  beatTimer = setInterval(beat, SRC.HEARTBEAT_MS);
  setInterval(refreshBlockClock, 30000);
  document.addEventListener('visibilitychange', refreshBlockClock);
  document.addEventListener('visibilitychange', beat);
  beat();
})();
