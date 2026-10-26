/* Extension workspace (and its bundled-data demo): My holdings, Compare and snapshot listings on the shared engine. */
(() => {
 'use strict';
 const R=ShnakasRules,P=NakaPurchase,E=NakaExplore,I=ShnakasI18n,S=ShnakasSource,B=SHNAKAS_SNAPSHOT,H=NakaPortfolio,U=NakaExploreUI;
 const demo=document.body.dataset.mode==='demo';
 const version=demo?document.body.dataset.version:chrome.runtime.getManifest().version;
 const $=id=>document.getElementById(id),n=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
 let snap=B,model=P.create(B),lang='en',ids=demo?E.examples(B,model).slice(0,3):[],stored={},minimum=0,showAll=false,message='';
 let holdings=[],fresh=new Set();
 const A=globalThis.NakaRewards;
 const C=()=>U.pick(lang),T=()=>I.pick(lang);
 // Artwork elements are reused across renders (one per place), so a data refresh never reloads or flashes images.
 const sticky=document.querySelector('.ws-top');new ResizeObserver(()=>{document.documentElement.style.scrollPaddingTop=Math.ceil(sticky.getBoundingClientRect().height+16)+'px';}).observe(sticky);
 const artFor=U.artStore(),art=(id,place)=>place?artFor(snap,id,'ws-art-fallback',place):U.art(snap,id,'ws-art-fallback');
 const sequenceModels=new WeakMap();
 const sequenceModel=priors=>{if(!priors.length)return model;let cache=sequenceModels.get(snap);if(!cache){cache=new Map();sequenceModels.set(snap,cache);}const key=priors.join(',');if(!cache.has(key)){cache.set(key,P.create(snap,{priorSales:priors}));while(cache.size>32)cache.delete(cache.keys().next().value);}return cache.get(key);};
 const total=(r,bitmap=false)=>r?P.decorateWeight(n('span'),r,bitmap):n('span','',C().unavailable);
 const trend=d=>U.trend(d);

 // ---------------------------------------------------------------- Floating card: enlarged artwork or an impact summary.
 const float=n('div','ws-float');float.hidden=true;float.id='floatCard';float.setAttribute('role','tooltip');document.body.append(float);
 let floatAnchor=null;
 function hideFloat(){float.hidden=true;if(floatAnchor)floatAnchor.removeAttribute('aria-describedby');floatAnchor=null;}
 function showFloat(anchor,nodes,width){
  hideFloat();floatAnchor=anchor;anchor.setAttribute('aria-describedby','floatCard');float.replaceChildren(...nodes);float.style.width=Math.min(width,innerWidth-32)+'px';float.hidden=false;
  const rect=anchor.getBoundingClientRect(),box=float.getBoundingClientRect();
  let x=rect.right+12;if(x+box.width>innerWidth-16)x=rect.left-box.width-12;
  let y=rect.top;if(y+box.height>innerHeight-16)y=innerHeight-box.height-16;
  float.style.left=Math.max(16,Math.min(x,innerWidth-box.width-16))+'px';float.style.top=Math.max(16,y)+'px';
 }
 /** Show `build()` while the pointer or keyboard focus is on `anchor`. */
 function hoverCard(anchor,build,width){const open=()=>showFloat(anchor,build(),width);anchor.addEventListener('mouseenter',open);anchor.addEventListener('focusin',open);anchor.addEventListener('mouseleave',hideFloat);anchor.addEventListener('focusout',hideFloat);}
 const image=(id,place)=>{const button=n('button','ws-image');button.type='button';button.setAttribute('aria-label',C().preview(snap.items[id][0]));button.append(art(id,place));
  const big=()=>[art(id),n('strong','',`Shielded #${snap.items[id][0]}`)];hoverCard(button,big,Math.min(300,Math.max(80,innerHeight-64)));button.addEventListener('click',()=>showFloat(button,big(),Math.min(300,Math.max(80,innerHeight-64))));return button;};
 document.addEventListener('keydown',ev=>{if(ev.key==='Escape'){hideFloat();closeAsk();}});
 addEventListener('resize',hideFloat);addEventListener('scroll',hideFloat,true);

 /** Hover card for a purchase or delisting: the same holdings block as the market inspection and the popup. */
 function impactCard(x,id,title,lead){
  const c=C(),card=n('div','ws-hc'),head=n('div','ws-hc-head');
  head.append(NakaPixel.sigil('ws-hc-sigil'),n('strong','ws-hc-title',title));card.append(head);if(lead)card.append(n('p','ws-hc-lead',lead));card.append(U.holdingsLine(x,c));
  const changed=x.rows.filter(row=>row.id!==id&&(row.delta.lo!==0||row.delta.hi!==0));
  if(changed.length){card.append(n('small','ws-hc-note',c.affected));for(const row of changed){const line=n('p','ws-hc-row');line.append(n('span','',`#${snap.items[row.id][0]}`),total(row.before),n('span','ws-hc-arrow','→'),total(row.after));card.append(line);}}
  card.append(n('small','ws-hc-note',c.blockBasis(I.int(snap.snapshot.height))));
  return [card];
 }

 /** The market's mark of a listing already closing: Selling (bought, confirming in the next block) or Reclaiming; the full
  * sentence on hover. Such a listing is shown as it is and offered to nobody: no purchase, no gain for my holdings. */
 function closingTag(t,kind){const tag=n('span',`ws-closing-tag ws-closing-tag--${kind}`,kind==='sale'?t.closingSaleTag:t.closingCancelTag);tag.title=kind==='sale'?t.closingSale:t.closingCancel;return tag;}

 // ---------------------------------------------------------------- "+" number entry, shared by My holdings and Compare.
 const ask=n('form','ws-entry');ask.hidden=true;ask.noValidate=true;document.body.append(ask);let askAnchor=null,askSubmit=null;
 function closeAsk(){if(ask.hidden)return;ask.hidden=true;const anchor=askAnchor;askAnchor=null;askSubmit=null;anchor?.focus();}
 function openAsk(anchor,title,submit){
  const c=C(),input=n('input'),error=n('p','ws-entry-error'),actions=n('div','ws-entry-actions'),cancel=n('button','ws-text-btn',c.cancel),ok=n('button','ws-entry-ok',c.confirmAdd);
  input.autocomplete='off';U.listField(input);input.placeholder=c.numberPromptMulti;input.setAttribute('aria-label',c.numberPromptMulti);cancel.type='button';ok.type='submit';cancel.addEventListener('click',closeAsk);
  actions.append(cancel,ok);ask.replaceChildren(n('strong','',title),input,n('p','ws-entry-hint',c.multiHint),error,actions);askAnchor=anchor;askSubmit=async()=>{const out=await submit(input.value);if(!out.message){closeAsk();return;}error.textContent=out.message;if(out.added){input.value='';input.removeAttribute('aria-invalid');}else{input.setAttribute('aria-invalid','true');input.select();}};
  ask.hidden=false;const rect=anchor.getBoundingClientRect(),box=ask.getBoundingClientRect();
  ask.style.left=Math.max(16,Math.min(rect.left,innerWidth-box.width-16))+'px';ask.style.top=(rect.bottom+8+box.height>innerHeight-16?Math.max(16,rect.top-box.height-8):rect.bottom+8)+'px';input.focus();
 }
 ask.addEventListener('submit',ev=>{ev.preventDefault();askSubmit?.();});
 document.addEventListener('pointerdown',ev=>{if(!ask.hidden&&!ask.contains(ev.target)&&!askAnchor?.contains(ev.target))closeAsk();});

 // ---------------------------------------------------------------- Raise weight (best buy, 400%, own a trait, simulate).
 // Numbers added beside my holdings (a teammate's or any) stay on this device: chrome.storage.local in the extension,
 // localStorage in the portable demo, one list of Shielded numbers. Lists saved as named members (0.11.3) become one list
 // of all their numbers; the guard baseline of earlier versions is no longer kept.
 const TEAM_KEY=H.TEAM;let lastRewards=null;
 const teamOf=raw=>({mates:H.mates(raw)});
 const team={
  async get(){if(demo){let raw=null;try{raw=JSON.parse(localStorage.getItem('nakaWebTeam')||'null');}catch{message=C().addError;}return teamOf(raw);}return teamOf((await chrome.storage.local.get(TEAM_KEY))[TEAM_KEY]);},
  async set(value){const clean=teamOf(value);if(demo){try{localStorage.setItem('nakaWebTeam',JSON.stringify(clean));}catch{message=C().addError;}}else await chrome.storage.local.set({[TEAM_KEY]:clean});return clean;},
 };
 const planner=NakaPlannerUI.mount({section:$('planner'),n,PL:NakaPlanner,R,U,I,H,lang:()=>lang,snap:()=>snap,holdings:()=>holdings,image,team,format:A.format,rewardRow:id=>lastRewards?.rows.find(r=>r.id===id)??null});

 // ---------------------------------------------------------------- Data and persistence.
 let source='bundled';
 // Whether the worker runs this code (S.BUILD): null until it answers, and always in the demo, which has no worker.
 let workerCurrent=null;
 function adopt(){const pick=S.choose({live:stored[S.KEYS.live],closing:stored[S.KEYS.closing]},B);source=pick.source;if(snap!==pick.snap){snap=pick.snap;model=P.create(snap);}lang=I.resolveLang(stored[I.STORAGE_KEY]);ids=E.normalize(stored[E.KEY]);holdings=H.normalize(stored[H.KEY]);}
 function persist(){try{localStorage.setItem('nakaWeb',JSON.stringify({portfolio:holdings,compare:ids,lang}));}catch{message=C().addError;}}
 /** Add or remove holdings. In the extension the worker queue writes them together with their anchors (shn-holdings), so a
  * write from this page never overwrites one made meanwhile from another tab. */
 async function saveHoldings(list,remove=false){
  if(demo){holdings=H.update(holdings,list,snap,remove);persist();render();return true;}
  try{const res=await chrome.runtime.sendMessage({type:'shn-holdings',ids:list,remove});if(!res?.ok)throw Error('save');return true;}catch{message=C().addError;render();return false;}
 }
 async function change(id,clear=false){
  if(demo){const out=clear?{ids:[],state:'removed'}:E.toggle(ids,id,snap);ids=out.ids;persist();message=out.state==='full'?C().fullHere:out.state==='missing'?C().missing:'';render();return;}
  try{const res=await chrome.runtime.sendMessage({type:'shn-compare',action:clear?'clear':'toggle',id});if(!res?.ok)throw Error('save');ids=res.ids;message=res.state==='full'?C().fullHere:res.state==='missing'?C().missing:'';render();}catch{message=C().addError;render();}
 }

 // ---------------------------------------------------------------- Top bar: section tabs with counts; the visible section is marked.
 const tabs=$('tabs');
 function renderTabs(){
  const c=C();
  tabs.replaceChildren(...[['holdings',c.holdings,String(H.current(snap,holdings).ids.length)],['planner',planner.tabLabel(),null],['compare',c.compare,`${ids.length}/${E.MAX}`],['listings',c.tabListings,String(snap.offers.length)]].map(([id,label,count])=>{
   const a=n('a','ws-tab');a.href='#'+id;a.dataset.section=id;a.append(n('span','',label));if(count!==null)a.append(n('span','ws-tab-count',count));if(id===activeSection)a.setAttribute('aria-current','true');return a;}));
 }
 let activeSection='holdings';
 // The current section is the one crossing the band 40–45% down the viewport, read from the sections' positions when the
 // observer fires: one batch can hold an old and a new entry for the same section. Between sections the last one stays.
 const SECTIONS=['holdings','planner','compare','listings'];
 const spy=new IntersectionObserver(()=>{if(document.body.dataset.section==='manage'||document.body.dataset.section==='history')return;const top=innerHeight*.4,bottom=innerHeight*.45,hit=SECTIONS.find(id=>{const r=$(id).getBoundingClientRect();return r.top<bottom&&r.bottom>top;});if(hit===undefined)return;activeSection=hit;for(const a of tabs.children)a.toggleAttribute('aria-current',a.dataset.section===activeSection);},{rootMargin:'-40% 0px -55% 0px'});
 for(const id of SECTIONS)spy.observe($(id));

 // ---------------------------------------------------------------- My holdings.
 const portfolio=$('holdings');
 // ---------------------------------------------------------------- Weight badge and bubble, exactly as on the market.
 // The badge on the artwork has the market's classes (content/content.css): weight, or the weight after delisting for a
 // listed holding, plus the Sub-number tag; the bubble is lib/popover.js with the market's inspection inside it.
 const tierClass=r=>`shn-t-${ShnakasTier.tierOf(r)}${r&&!r.exact?' shn-is-range':''}`;
 let cancelFor={snap:null,model:null};
 const cancelModel=()=>{if(cancelFor.snap!==snap)cancelFor={snap,model:P.create(snap,{action:'cancel'})};return cancelFor.model;};
 function holdingBadge(id){
  const t=T(),r=R.evaluateSnapshot(snap,id),cancel=P.listingStatus(snap,id)==='listed'?cancelModel().get(id):null,b=n('span','');
  if(cancel?.state==='ready'){
   b.className=`shn-badge shn-badge--grid shn-badge--buy ${tierClass(cancel.result)}`;
   const preview=n('span',`shn-buy-preview naka-tone-${ShnakasTier.tierOf(cancel.result)}`);preview.append(n('span','shn-badge__label',t.cancelAfter),P.decorateWeight(n('b','shn-badge__txt shn-buy-value'),cancel.result));
   preview.classList.toggle('shn-buy-preview--range',!cancel.result.exact);b.append(preview);
  }else{
   // A listed holding with no listing left after delisting has no after-delisting weight: the market shows "—" there too.
   const noFloor=cancel?.state==='no-floor',w=n('span','shn-badge__weight');b.className=`shn-badge shn-badge--grid ${tierClass(noFloor?null:r)}`;
   w.append(NakaPixel.sigil('shn-badge__icon'),n('span','shn-badge__label',noFloor?t.cancelAfter:t.weightShort),noFloor?n('span','shn-badge__txt','—'):P.decorateWeight(n('span','shn-badge__txt'),r));b.append(w);
  }
  const tag=P.numberBadge(r.number.value,t);if(tag)b.append(tag);
  // An empty title keeps the tile's "click to simulate" hint off the badge: the badge opens its own details instead.
  b.dataset.shnId=id;b.tabIndex=0;b.title='';b.setAttribute('aria-label',C().weightDetail(r.number.value));
  return b;
 }
 function weightPop(id){
  const t=T(),c=C(),r=R.evaluateSnapshot(snap,id),listed=P.listingStatus(snap,id)==='listed',head=n('div','shn-pop__head'),brand=n('span','shn-inspect-brand');
  brand.append(NakaPixel.sigil('shn-badge__icon'),n('span','shn-eyebrow',t.title));head.append(brand,n('span','shn-inspect-number',`#${r.number.value}`));
  const tag=P.numberBadge(r.number.value,t);if(tag)head.append(tag);
  const compare=n('button','shn-compare-add');compare.type='button';U.paintCompare(compare,E.compareState(ids,id),c);compare.addEventListener('click',ev=>{ev.stopPropagation();change(id);});
  const own=n('button','shn-compare-add shn-holding-add',c.inHoldings);own.type='button';own.title=c.holdingRemoveHint;own.setAttribute('aria-pressed','true');own.addEventListener('click',ev=>{ev.stopPropagation();saveHoldings([id],true);});
  head.append(compare,own);const nodes=[head];
  const closing=(snap.closing??[]).find(([x])=>x===id)?.[1]??null;
  const panel=listed?P.render(cancelModel(),id,t,I,{explain:A.explainFor(snap,id,lang,'cancel'),closing,snap,id}):null;
  // What reclaiming does to my holdings — not for a listing someone is already buying: it sells at the next block.
  if(panel){if(closing!=='sale'){const x=H.impact(snap,holdings,id,'cancel');if(x.state==='ready')panel.append(U.holdingsLine(x,c));}nodes.push(panel);}
  else nodes.push(P.renderCurrent(r,snap.snapshot,t,I,{explain:A.explainFor(snap,id,lang),listing:P.listingStatus(snap,id),closing,credits:P.relayCredits(snap,id),snap,id}));
  const row=lastRewards?.rows.find(x=>x.id===id);if(!listed&&Number.isFinite(row?.avg))nodes.push(n('p','ws-wcard-avg',c.avgWeight(row.avg.toFixed(1),R.formatWeight(r))));
  return {className:tierClass(r),nodes};
 }
 const weightPopover=NakaPopover.create({selector:'.ws-holding:not(.ws-listing) .shn-badge',id:'ws-weight-tooltip',build:badge=>weightPop(badge.dataset.shnId),
  target:badge=>badge.querySelector('.shn-buy-preview,.shn-badge__weight'),raise:()=>0,identity:badge=>`${badge.dataset.shnId}|${snap.snapshot.height}|${snap.snapshot.generatedAt}|${JSON.stringify(snap.closing??[])}|${lang}`});
 function listingPop(badge){
  const id=badge.dataset.shnId,priors=(badge.dataset.shnPriors||'').split(',').filter(Boolean),c=C(),t=T();
  if(holdings.includes(id))return weightPop(id);
  const impactModel=sequenceModel(priors),head=n('div','shn-pop__head'),brand=n('span','shn-inspect-brand');brand.append(NakaPixel.sigil('shn-badge__icon'),n('span','shn-eyebrow',t.title));head.append(brand,n('span','shn-inspect-number',`#${snap.items[id][0]}`));
  const tag=P.numberBadge(snap.items[id][0],t);if(tag)head.append(tag);
  // Compare and My holdings as on every other details card; the buy sequence only here, where the listings are.
  const compare=n('button','shn-compare-add');compare.type='button';U.paintCompare(compare,E.compareState(ids,id),c);compare.addEventListener('click',async ev=>{ev.stopPropagation();await change(id);U.paintCompare(compare,E.compareState(ids,id),c);});
  const own=n('button','shn-compare-add shn-holding-add');own.type='button';const paintOwn=()=>{const held=holdings.includes(id);own.textContent=held?c.inHoldings:c.addHolding;own.title=held?c.holdingRemoveHint:c.holdingHint;own.setAttribute('aria-pressed',String(held));};paintOwn();own.addEventListener('click',async ev=>{ev.stopPropagation();await saveHoldings([id],holdings.includes(id));paintOwn();});
  const seq=n('button','shn-compare-add shn-seq-add');seq.type='button';const paintSeq=()=>{const at=basket.indexOf(id),zh=lang==='zh';seq.textContent=at>=0?(zh?`✓ 连买第 ${at+1} 单`:`✓ Buy ${at+1}`):(zh?'＋ 连买':'＋ Sequence');seq.setAttribute('aria-pressed',String(at>=0));seq.disabled=at<0&&basket.length>=E.MAX;seq.title=zh?'按加入的先后假设一起买，后买的按前面成交后的权重计算；最多 4 单。只是本机计算。':'Assume buying several in the order added; each later one is valued after the earlier sales, at most 4. A local calculation.';};paintSeq();seq.addEventListener('click',ev=>{ev.stopPropagation();toggleSequence(id);paintSeq();});
  // A listing already bought (confirming) is nobody's to buy: no buy sequence, no gain for my holdings; its card says so.
  const closing=(snap.closing??[]).find(([x])=>x===id)?.[1]??null;
  const tools=n('div','shn-pop__actions');tools.append(compare,own);if(closing===null)tools.append(seq);const nodes=[head,tools];
  const box=P.render(impactModel,id,t,I,{explain:A.explainFor(snap,id,lang,'sale'),closing,snap,id});if(box)nodes.push(box);
  const impact=closing===null&&holdings.length&&!holdings.includes(id)?H.impact(snap,holdings,id,'sale',impactModel):null;
  const offer=impactModel.get(id);
  if(impact?.state==='ready'&&offer.state==='ready'){if(priors.length)nodes.push(n('p','ws-hc-note',lang==='zh'?`连买累计每周变化 ${U.shn(impact.allocation.delta,true)} SHNAKAS（含前面买入的藏品）`:`Combined weekly change ${U.shn(impact.allocation.delta,true)} SHNAKAS, including earlier purchases`));else nodes.push(...impactCard(impact,id,`${c.buyLead(snap.items[id][0])} · ${I.btc(offer.price)} BTC`,null));}
  if(priors.length)nodes.push(n('p','ws-hc-note',lang==='zh'?`已假设按顺序买下 ${priors.map(x=>`#${snap.items[x][0]}`).join('、')}`:`Assumes buying ${priors.map(x=>`#${snap.items[x][0]}`).join(', ')} first`));
  return nodes.length?{className:tierClass(R.evaluateSnapshot(snap,id)),nodes}:null;
 }
 const listingPopover=NakaPopover.create({selector:'.ws-listing .shn-badge, .ws-pbuy .shn-badge',id:'ws-listing-tooltip',build:listingPop,
  target:badge=>badge.querySelector('.shn-badge__weight'),raise:()=>0,identity:badge=>`${badge.dataset.shnId}|${badge.dataset.shnPriors}|${snap.snapshot.height}|${lang}`});
 // Copy all numbers: plain numbers, ascending, comma-separated, which any "+" number entry here reads, so holders can pass
 // their lists to each other. The section is rebuilt on every render, so the answer (copied or failed, until when) lives
 // here, outside the DOM, and is painted onto whichever button is current.
 let copyAll=null,copyAllSaid=null;
 function paintCopyAll(){if(copyAll===null)return;const c=C(),said=copyAllSaid!==null&&Date.now()<copyAllSaid.until?copyAllSaid:null;copyAll.textContent=said===null?c.copyAll:said.ok?c.copyAllDone(said.count):c.copyAllFailed;}
 function copyAllButton(c,list){
  const b=n('button','ws-copy-all');b.type='button';b.title=c.copyAllHint;
  b.addEventListener('click',async()=>{const numbers=list.map(id=>snap.items[id][0]).sort((x,y)=>x-y);let ok=true;try{await navigator.clipboard.writeText(numbers.join(', '));}catch{ok=false;}
   copyAllSaid={until:Date.now()+1600,ok,count:numbers.length};paintCopyAll();setTimeout(paintCopyAll,1600);});
  return b;
 }
 function portfolioUI(){
  const c=C(),own=H.current(snap,holdings),a=own.allocation;portfolio.replaceChildren();
  const head=n('div','ws-portfolio-head'),title=n('div','ws-portfolio-title'),h2=n('h2','',c.holdings);h2.id='holdingsTitle';
  title.append(h2,n('span','ws-portfolio-count',c.pieces(own.ids.length)));head.append(title);
  copyAll=own.ids.length?copyAllButton(c,own.ids):null;if(copyAll){title.append(copyAll);paintCopyAll();}
  portfolio.append(head);if(own.missing)portfolio.append(n('p','ws-muted',c.holdingsWaiting(own.missing)));
  const left=demo?null:stored[H.LEFT],events=demo?null:stored[H.EVENTS],meta=demo?null:stored[H.META];
  const history=A.history(snap,own.ids,left,events,A.weeks(demo?null:stored[A.WEEKS]),R.rewardPhase(snap.snapshot),meta);
  const rewards=holdings.length||history.left.length?A.render(snap,own.ids,demo?null:stored[A.KEY],demo?null:stored[A.OBSERVED],lang,{share:a.share,network:true,status:demo?null:stored[A.STATUS],history,events,savedIds:holdings,ledger:demo?null:stored[NakaLedger.KEY],completed:demo?null:NakaLedgerUI.completedReport(snap,holdings,stored)}):null;if(rewards)portfolio.append(rewards.element);lastRewards=rewards?.data??null;
  const grid=n('div','ws-holding-grid'),add=n('button','ws-holding ws-holding-add');add.type='button';add.append(n('span','ws-add-mark','+'),n('span','',c.addHoldingTitle));
  add.addEventListener('click',()=>openAsk(add,c.addHoldingTitle,async raw=>{const r=U.resolveNumbers(snap,raw,holdings,c,c.skipHeld);if(r.empty)return {added:0,message:c.invalid};if(r.ids.length){if(!await saveHoldings(r.ids))return {added:0,message:c.addError};fresh=new Set(r.ids);}return {added:r.ids.length,message:r.skipped.length?c.addedSkipped(r.ids.length,r.skipped):null};}));
  grid.append(add);const confirm=[];
  for(const id of own.ids){
   const listed=P.listingStatus(snap,id)==='listed',number=snap.items[id][0],tile=n('article','ws-holding'),r=R.evaluateSnapshot(snap,id);tile.dataset.id=id;
   if(listed)tile.classList.add('is-listed');if(fresh.has(id))tile.classList.add('is-new');
   const media=n('div','ws-holding-art');media.append(art(id,'holding'),holdingBadge(id));if(listed)media.append(n('span','ws-holding-tag',c.listedTag));
   const remove=n('button','ws-holding-remove','×');remove.type='button';remove.title=c.removeHolding(number);remove.setAttribute('aria-label',c.removeHolding(number));remove.addEventListener('click',()=>saveHoldings([id],true));media.append(remove);
   const view=A.tile(rewards.data,id,lang),status=view.row.status,rate=listed?0:R.weeklyAllocation(R.units(r),a.all),idle=status==='idle';tile.dataset.status=status;
   // The badge on the artwork opens the market's inspection bubble; the rest of the tile opens the simulator.
   const info=n('div','ws-holding-info'),top=n('div','ws-holding-top');top.append(n('strong','',`#${number}`));info.append(top);
   // Two fixed lines under the number: this week's SHNAKAS (the weekly rate before rewards start) and the status with the
   // weekly rate. A figure still loading keeps its line and is hidden, so tiles never change height. A piece that left,
   // was paused or has no later week shows no weekly rate: it earns none.
   const now=n('p','ws-holding-weekly'),amount=listed?0:idle?null:view.amount,value=n('b','',listed?c.earnListed:idle?U.shn(rate):amount===null?'0.0000':A.format(amount));
   if(!idle&&amount===null)value.classList.add('is-blank');now.append(value,n('span','',idle?c.weekUnit:c.thisWeekUnit));if(listed||['waiting','gone','paused','ended'].includes(status))now.classList.add('is-zero');
   const forecast=listed||idle?null:NakaMining.forecast(snap,id,{action:'hold',status:view.row}),rest=forecast?.state==='ready'?U.shn(forecast.remaining):'—';
   const line=listed?c.listedShort:idle?c.idleNote:['gone','paused','ended','unknown'].includes(status)?view.label:`${lang==='zh'?'每周':'Per week'} ${U.shn(rate)}\n${lang==='zh'?'剩余':'Remaining'} ${rest}`;
   const sub=n('small',`ws-holding-sub ws-holding-sub--${status}`,line);sub.title=view.label??'';
   info.append(now,sub);tile.append(media,info);
   // A sale the extension cannot attribute (a listing that was open when the piece was added, or a holding saved before
   // anchors existed that sold this week): the owner says whether it was their sale or their purchase.
   if(!demo){const ask=H.saleToConfirm(snap,id,events?.rows?.[id],meta?.[id],view.row.reason);if(ask)confirm.push({id,number,...ask});}
   // Selecting the tile (pointer, Enter or Space) opens the simulator for it; a listed one opens with “Assume reclaimed”.
   const open=()=>planner.openSim(id,listed?'cancel':null);
   tile.classList.add('is-simulable');tile.title=c.simulateHint(number);tile.tabIndex=0;tile.setAttribute('role','button');tile.setAttribute('aria-label',c.simulateHint(number));
   tile.addEventListener('click',ev=>{if(ev.target.closest('.ws-holding-remove,.shn-badge'))return;open();});
   tile.addEventListener('keydown',ev=>{if(ev.target!==tile||!['Enter',' '].includes(ev.key))return;ev.preventDefault();open();});
   grid.append(tile);
  }
  portfolio.append(grid);
  if(!own.ids.length)portfolio.append(n('p','ws-muted ws-holdings-how',`${c.holdingsEmpty} ${demo?c.holdingsHowDemo:c.holdingsHow}`));
  else portfolio.append(n('p','ws-muted ws-holdings-how',lang==='zh'?'悬停图片上的权重看明细。点卡片其它位置，模拟把这一枚挂出去。金库或钱包页可以一次添加整页。':'Hover the weight on a picture for its breakdown. Select the rest of the card to simulate listing it. Vault or Wallet can add the whole page.'));
  if(confirm.length)portfolio.append(confirmBox(c,confirm));
  const absent=demo?[]:absentHoldings(own.ids);if(absent.length)portfolio.append(absentBox(c,absent));
  // Finished weeks and pieces I sold appear once there is something to show; week one alone repeats the hero.
  // Per-week amounts open from the hero's completed total. A second table would repeat that total.
  if(history.left.length)portfolio.append(leftList(c,history));
  if(fresh.size){const added=[...fresh];fresh=new Set();const tiles=added.map(id=>portfolio.querySelector(`[data-id="${id}"]`)).filter(Boolean);tiles[0]?.scrollIntoView({block:'nearest',behavior:'smooth'});setTimeout(()=>{for(const t of tiles)t.classList.remove('is-new');},1200);}
 }
 /** Sales the extension cannot attribute: each line names the sale and offers both answers; a failure is shown on its line. */
 const confirmErrors=new Map();
 function confirmBox(c,list){
  const box=n('div','ws-confirm');box.append(n('strong','',c.confirmTitle));
  for(const x of list){const line=n('div','ws-confirm-line'),answers=n('span','ws-confirm-actions');
   line.append(n('span','',c.confirmSale(x.number,I.int(x.listedAt),I.int(x.soldAt))));
   for(const [action,label] of [['sold',c.markSold],['bought',c.markBought]]){const b=n('button','ws-text-btn',label);b.type='button';
    b.addEventListener('click',async()=>{confirmErrors.delete(x.id);let res=null;try{res=await chrome.runtime.sendMessage({type:'shn-left',action,id:x.id,listedAt:x.listedAt});}catch{res=null;}if(!res?.ok){confirmErrors.set(x.id,res?.error==='no-sale'?'markFailed':'addError');render();}});answers.append(b);}
   line.append(answers);if(confirmErrors.has(x.id))line.append(n('small','ws-confirm-error',c[confirmErrors.get(x.id)]));box.append(line);}
  return box;
 }
 /** Holdings the Wallet page showed no row of at the last sync (H.ABSENT, written by the worker): still here, maybe sent
  * away privately; the owner says which. Ones already answered as still theirs (dismissed) or no longer held are left out. */
 function absentHoldings(ids){const a=H.absentOf(stored[H.ABSENT]);return a===null?[]:a.ids.filter(id=>ids.includes(id)&&!a.dismissed.includes(id)).map(id=>({id,number:snap.items[id][0]}));}
 /** Each line names the piece and offers both answers: "It left" moves it to Left (the weeks it kept unknown), "Still mine"
  * keeps it and closes the question (shn-left, as the sale question). A failed answer is said on its line. */
 const absentErrors=new Set();
 function absentBox(c,list){
  const box=n('div','ws-confirm ws-confirm--absent');box.append(n('strong','',c.absentTitle));
  for(const x of list){const line=n('div','ws-confirm-line'),answers=n('span','ws-confirm-actions');
   line.append(n('span','',c.absentLine(x.number)));
   for(const [action,label] of [['gone',c.absentGone],['keep',c.absentKeep]]){const b=n('button','ws-text-btn',label);b.type='button';
    b.addEventListener('click',async()=>{absentErrors.delete(x.id);let res=null;try{res=await chrome.runtime.sendMessage({type:'shn-left',action,id:x.id});}catch{res=null;}if(!res?.ok){absentErrors.add(x.id);render();}});answers.append(b);}
   line.append(answers);if(absentErrors.has(x.id))line.append(n('small','ws-confirm-error',c.absentFailed));box.append(line);}
  return box;
 }
 /** Pieces that left: one row per run of mine that ended (a sale, or a private move the wallet page showed), with the
  * weeks it kept and their official total; put back (it was not mine to lose) or forget. */
 function leftList(c,history){
  const box=n('section','ws-left');box.id='left';box.append(n('h3','',c.leftTitle(history.left.length)));
  for(const x of history.left){const row=n('div','ws-left-row'),run=x.run;row.append(image(x.id,'left'));const text=n('div','');
   // How it left: my sale (listing and sale blocks), a private move the Wallet page showed, or the owner's answer to the
   // Wallet page showing no row of it (source 'wallet-absent': no weeks known).
   const how=run.source==='wallet-absent'?c.leftAbsent:Number.isSafeInteger(run.listedAt)?c.leftSold(I.int(run.listedAt),A.listedWhen(run.listedAt,lang==='zh'),I.int(run.soldAt)):c.leftWallet;
   const kept=x.kept===null?c.weekUnknown:x.weeks>0?c.leftKeeps(A.rangeText(x.kept,lang),x.amount===null?null:U.shn({lo:x.amount,hi:x.amount})):c.leftNone;
   text.append(n('strong','',`#${x.number}`),n('small','',how),n('small','',kept));
   const actions=n('div','ws-left-actions');for(const [action,label] of [['restore',c.leftRestore],['remove',c.leftRemove]]){const b=n('button','ws-text-btn',label);b.type='button';b.addEventListener('click',()=>chrome.runtime.sendMessage({type:'shn-left',action,id:x.id,listedAt:run.listedAt}));actions.append(b);}
   row.append(text,actions);box.append(row);}
  box.append(n('p','ws-pnote',c.leftNote));return box;
 }

 // ---------------------------------------------------------------- Compare.
 function comparison(){
  const c=C(),t=T(),box=$('comparison');box.replaceChildren();const entries=ids.map(id=>E.entry(snap,model,id));
  if(!ids.length){const empty=n('div','ws-blank');empty.append(n('strong','',c.empty),n('p','',c.emptyHint));const example=n('button','',c.load);example.addEventListener('click',async()=>{for(const id of E.examples(snap,model))await change(id);});empty.append(example);box.append(empty);return;}
  const table=n('table','ws-table');table.style.minWidth=`${Math.max(360,136+ids.length*235)}px`;table.setAttribute('aria-label',c.page);
  const head=n('thead'),tr=n('tr');tr.append(n('td','ws-label'));
  entries.forEach((e,index)=>{const th=n('th'),item=n('div','ws-item'),text=n('div');if(e)item.append(image(e.id,'compare'));text.append(n('strong','',e?`#${e.number}`:c.missing));if(e){const link=n('a','ws-item-link',c.colMarket);link.href=U.marketFind(snap,e.id);link.target='_blank';link.rel='noopener noreferrer';text.append(n('small','',c[e.listing]));if(e.closing!==null)text.append(closingTag(t,e.closing));text.append(link);const rank=P.numberBadge(e.number,t);if(rank)text.append(rank);}const remove=n('button','ws-remove','×');remove.title=c.remove;remove.setAttribute('aria-label',`${c.remove} ${e?'#'+e.number:''}`);remove.addEventListener('click',()=>change(ids[index]));item.append(text,remove);th.append(item);tr.append(th);});head.append(tr);table.append(head);const body=n('tbody');table.append(body);
  const row=(label,fn,cls='')=>{const tr=n('tr',cls);const th=n('th','ws-label',label);th.scope='row';tr.append(th);entries.forEach(e=>{const td=n('td');if(e)fn(td,e);else td.textContent='—';tr.append(td);});body.append(tr);};
  row(c.total,(td,e)=>{td.append(n('span','ws-caption',e.listing==='listed'?c.after:c.holding),total(e.result,true));if(e.sale.state==='no-floor')td.append(n('small','',c.noFloor));},'ws-total');
  row(c.ask,(td,e)=>{td.textContent=e.listing==='listed'?I.btc(e.sale.price):'—';td.title=c.askNote;},'ws-price');
  if(entries.some(e=>e&&P.relayCredits(snap,e.id)!==null))row(t.relayCredits,(td,e)=>{const credits=P.relayCredits(snap,e.id);td.textContent=credits===null?'—':String(credits);td.title=t.relayCreditsMeaning;},'ws-credits');
  row(c.before,(td,e)=>td.append(e.listing==='listed'?total(e.before):n('span','','—')),'ws-before');
  if(holdings.length){
   // A listing already closing is nobody's to buy: no gain for my holdings.
   row(c.forMe,(td,e)=>{if(e.closing!==null){td.textContent='—';return;}const x=H.impact(snap,holdings,e.id,'sale',model);if(x.state!=='ready'){td.textContent='—';return;}const d=x.allocation.delta;td.textContent=c.gainWeek(U.shn(d,true));td.dataset.change=trend(d);},'ws-gain');
   row(c.weeklyAfterBuy,(td,e)=>{if(e.closing!==null){td.textContent='—';return;}const x=H.impact(snap,holdings,e.id,'sale',model);td.textContent=x.state==='ready'?`${U.shn(x.allocation.after.weekly)} SHNAKAS`:'—';},'ws-before');
  }
  const guide=n('tr','ws-trait-guide'),cell=n('th','',c.traitGuide);cell.colSpan=entries.length+1;guide.append(cell);body.append(guide);
  const types=[...new Set(entries.flatMap(e=>e?.before.traits.map(t=>t.type)??[]))];
  for(const type of types)row(type==='Hair And Headwear'?t.headwear:type,(td,e)=>{const a=e.before.traits.find(x=>x.type===type);if(!a){td.textContent='—';return;}if(e.sale.state==='no-floor'){td.append(n('span','ws-trait-name',a.value),n('span','ws-bonus','—'));return;}const b=e.sale.state==='ready'?e.result.traits.find(x=>x.type===type):a;td.append(n('span','ws-trait-name',a.value));const pct=P.traitPct,value=n('span','ws-bonus');const changed=e.sale.state==='ready'?P.traitChange(a,b,e.sale.beforeFloor,e.sale.afterFloor):null;
   if(changed){td.classList.add('ws-changed');td.dataset.change=changed;td.title=t.changedRows;if(pct(a)!==pct(b))value.append(n('span','ws-old',pct(a)+' → '));}value.append(n('span','',pct(b)+(changed?(changed==='up'?' ↑':changed==='down'?' ↓':' ◆'):'')));td.append(value);const shared=holdings.filter(id=>id!==e.id&&snap.items[id]?.slice(1).some(idx=>snap.traits[idx][0]===type&&snap.traits[idx][1]===a.value)).length;if(shared)td.append(n('small','ws-shared',c.sharedTrait(shared)));
   const floor=e.sale.state==='ready'?e.sale.afterFloor:snap.snapshot.collectionFloor;const ratio=(v,f)=>P.traitRatio(v,f,t);const now=ratio(b,floor),old=ratio(a,e.sale.state==='ready'?e.sale.beforeFloor:floor);td.append(n('small','',changed&&old!==now?old+' → '+now:now));
  });
  if(entries.some(e=>e?.before.number.pct))row(c.number,(td,e)=>{td.textContent=`+${e.before.number.pct}%`;});
  box.append(table);
 }
 $('compareAdd').addEventListener('click',()=>{const c=C();openAsk($('compareAdd'),c.addCompareTitle,async raw=>{const r=U.resolveNumbers(snap,raw,ids,c,c.skipCompared);if(r.empty)return {added:0,message:c.invalid};let added=0;for(const id of r.ids){if(ids.length===E.MAX){r.skipped.push(c.skipFull(snap.items[id][0]));continue;}await change(id);added++;}return {added,message:r.skipped.length?c.addedSkipped(added,r.skipped):null};});});

 // ---------------------------------------------------------------- Snapshot listings; which ones raise my weekly SHNAKAS is Raise weight's Best buy.
 let catalogJob=0,basket=[],catalogSnap=null,catalogKey='';
 async function catalog(){
  const key=JSON.stringify([holdings,ids,basket,minimum,showAll,lang]);if(catalogSnap===snap&&catalogKey===key)return;catalogSnap=snap;catalogKey=key;
  const job=++catalogJob,basis=snap,saved=[...holdings],c=C();
  const valid=()=>job===catalogJob&&snap===basis&&JSON.stringify(saved)===JSON.stringify(holdings);
  let entries;
  try{entries=E.candidates(snap,model,minimum);}
  catch{if(valid()){const error=n('p','mx-state-note',lang==='zh'?'候选计算暂不可用，请重试。':'Candidate comparison unavailable. Try again.'),retry=n('button','mx-classic-link',lang==='zh'?'重试':'Retry');retry.addEventListener('click',()=>{catalogKey='';catalog();});$('catalog').replaceChildren(error,retry);}return;}
  if(!valid())return;
  basket=basket.filter(id=>!holdings.includes(id)&&(snap.offers??[]).some(([x])=>x===id)&&!(snap.closing??[]).some(([x])=>x===id));
  $('catalogCount').textContent=String(entries.length);sequenceBar(c);
  $('catalog').replaceChildren(...entries.slice(0,showAll?entries.length:12).map(e=>{
   // A listing is a tile like a holding above it: the artwork with the weight after the sale on it (its Sub tier inline),
   // then the number with the buy link, the ask in gold, and one figure — what buying adds to my holdings each week (or,
   // with no holdings, what the piece earns) — with its relay credits. When it starts earning is the same for every
   // listing, so it is said once above the cards. Compare, My holdings and the buy sequence are in the badge's details.
   const tile=n('article','ws-holding ws-listing'),media=n('div','ws-holding-art'),info=n('div','ws-holding-info');tile.dataset.id=e.id;
   if(ids.includes(e.id))tile.classList.add('is-selected');if(e.closing!==null)tile.classList.add('is-closing');
   const step=basket.indexOf(e.id),priors=step<0?basket:basket.slice(0,step),zh=lang==='zh',mine=holdings.includes(e.id);
   media.append(art(e.id,'listing'));
   const top=n('div','ws-holding-top');top.append(n('strong','',`#${e.number}`));
   const ask=n('p','ws-listing-ask',I.btc(e.sale.price));ask.append(n('span','',' BTC'));
   const gain=n('p','ws-holding-weekly ws-listing-gain'),label=n('span',''),value=n('b','');gain.append(value,label);
   const credits=P.relayCredits(snap,e.id),sub=n('small','ws-holding-sub',credits?`${T().relayCredits} ${credits}`:'');if(credits)sub.title=T().relayCreditsMeaning;
   if(e.closing===null){
    // One of my own listings shows what reclaiming it does (as on My holdings), anyone else's what buying it does.
    const reclaim=mine?cancelModel().get(e.id):null,scenario=mine?reclaim:priors.length?sequenceModel(priors).get(e.id):e.sale,next=scenario.state==='ready'?scenario.result:null,shown=mine||priors.length?next:e.result;
    media.append(listingBadge(e,mine?T().cancelAfter:c.after,shown,priors,c));
    if(step>=0)media.append(n('span','ws-holding-tag ws-listing-step',zh?`连买 ${step+1}`:`Buy ${step+1}`));
    const own=mine?H.impact(snap,holdings,e.id,'cancel',cancelModel()):null,impact=!mine&&holdings.length?H.impact(snap,holdings,e.id,'sale',sequenceModel(priors)):null;
    if(mine){label.textContent=zh?'撤单后我的持仓每周':'Reclaimed · mine / week';value.textContent=own?.state==='ready'?U.shn(own.allocation.delta,true):'—';gain.dataset.change=own?.state==='ready'?trend(own.allocation.delta):'unknown';}
    else if(impact?.state==='ready'){label.textContent=priors.length?(zh?`含连买前 ${priors.length} 单 · 我的持仓每周`:`After ${priors.length} bought · mine / week`):(zh?'我的持仓每周':'My holdings / week');value.textContent=U.shn(impact.allocation.delta,true);gain.dataset.change=trend(impact.allocation.delta);}
    else{const f=NakaMining.forecast(snap,e.id,{action:'sale',scenario});label.textContent=zh?'这一枚每周':'This piece / week';value.textContent=f.state==='ready'&&f.plan.state!=='ended'?U.shn(f.weekly,true):'—';gain.dataset.change=f.state==='ready'?'up':'unknown';}
    if(!mine){const buy=n('a','ws-listing-buy',c.buyNow);buy.title=c.buyHint;buy.href=U.marketFind(snap,e.id);buy.target='_blank';buy.rel='noopener noreferrer';top.append(buy);}
   }else if(e.closing==='sale'){
    // Bought and confirming: nobody can buy it now, but what it produces after that sale is what its buyer looked at — the
    // weight after the sale on the artwork (with its details) and this piece's week, beside the market's tag; no buy link.
    const tag=closingTag(T(),e.closing);tag.classList.add('ws-listing-closing');media.append(tag,listingBadge(e,c.after,e.result,[],c));
    const f=NakaMining.forecast(snap,e.id,{action:'sale',scenario:e.sale,asIs:true});label.textContent=zh?'这一枚每周':'This piece / week';value.textContent=f.state==='ready'&&f.plan.state!=='ended'?U.shn(f.weekly,true):'—';gain.dataset.change=f.state==='ready'?'up':'unknown';
   }else{
    // Being reclaimed: it goes back to its seller, so there is no sale to show; the market's tag and what it means.
    const tag=closingTag(T(),e.closing);tag.classList.add('ws-listing-closing');media.append(tag);
    label.textContent=zh?'现在':'Now';value.textContent=T().closingCancelShort;gain.dataset.change='closing';
   }
   info.append(top,ask,gain,sub);tile.append(media,info);return tile;
  }));
  $('catalogFull').hidden=ids.length<E.MAX;$('catalogFull').textContent=c.fullHere;$('more').hidden=showAll||entries.length<=12;$('more').textContent=c.showAll;
 }

 /** A listing tile's weight badge: the weight in the world it names (after a sale or my reclaim), its Sub tier, and the
  * listings assumed bought before it, which its details read. */
 function listingBadge(e,caption,shown,priors,c){
  const badge=n('span',`shn-badge shn-badge--grid ${tierClass(shown)}`),weight=n('span','shn-badge__weight');
  weight.append(NakaPixel.sigil('shn-badge__icon'),n('span','shn-badge__label',caption),shown?P.decorateWeight(n('span','shn-badge__txt'),shown):n('span','shn-badge__txt','—'));badge.append(weight);
  const tier=P.numberBadge(e.number,T());if(tier)badge.append(tier);
  badge.dataset.shnId=e.id;badge.dataset.shnPriors=priors.join(',');badge.tabIndex=0;badge.setAttribute('aria-label',c.weightDetail(e.number));
  return badge;
 }

 /** Buy sequence: listings assumed bought together in the order added (each one changes the weights after it). One line above
  * the cards says what the whole sequence costs and does to my holdings each week, with a way to clear it. */
 function sequenceBar(c){
  let bar=$('sequenceBar');if(!bar){bar=n('div','ws-sequence');bar.id='sequenceBar';bar.setAttribute('role','status');$('catalog').before(bar);}
  bar.hidden=!basket.length;if(!basket.length){bar.replaceChildren();return;}
  const cost=basket.reduce((a,id)=>a+(snap.offers.find(([x])=>x===id)?.[1]??0),0),last=basket[basket.length-1];
  const x=holdings.length?H.impact(snap,holdings,last,'sale',sequenceModel(basket.slice(0,-1))):null,zh=lang==='zh';
  const text=n('span','ws-sequence__text');text.append(n('b','',zh?`连买 ${basket.length} 单`:`Buy sequence · ${basket.length}`),n('span','',basket.map(id=>`#${snap.items[id][0]}`).join(' → ')),n('span','',`${zh?'合计':'Total'} ${I.btc(cost)} BTC`));
  if(x?.state==='ready'){const g=n('span','ws-sequence__gain',`${zh?'我的持仓每周':'Mine / week'} ${U.shn(x.allocation.delta,true)}`);g.dataset.change=trend(x.allocation.delta);text.append(g);}
  const clear=n('button','ws-text-btn',zh?'清空':'Clear');clear.type='button';clear.addEventListener('click',()=>{basket=[];catalog();});
  bar.title=zh?'按加入的先后假设一起买下，后买的按前面成交后的权重计算。只是本机计算，不会下单。':'Assumes buying these together in the order added; each later one is valued after the earlier sales. A local calculation, never an order.';
  bar.replaceChildren(text,clear);
 }
 function toggleSequence(id){if(basket.includes(id))basket=basket.filter(x=>x!==id);else if(basket.length<E.MAX)basket.push(id);catalogKey='';catalog();}
 // ---------------------------------------------------------------- About: read-only promise, allocation arithmetic, rules and data, folded.
 function about(){
  const c=C(),open=new Set([...$('aboutItems').querySelectorAll('details[open]')].map(d=>d.dataset.key)),parts=U.about(c,R,version);
  const item=(key,title,body,card)=>{const content=n('div','ws-about-body');content.append(...body);if(card){const box=n('section','ws-about-card');box.dataset.key=key;box.append(n('h3','',title),content);return box;}const d=n('details','ws-about-item');d.dataset.key=key;if(open.has(key))d.setAttribute('open','');d.append(n('summary','',title),content);return d;};
  $('aboutItems').replaceChildren(item('safe',c.aboutSafe,parts.safe,false),item('cases',c.aboutCases,parts.cases,false),item('alloc',c.aboutAlloc,parts.alloc,false),item('rules',c.aboutRules,parts.rules,false),item('data',c.aboutData,parts.data,false));
 }

 let manageMsg='',manageRemove=null;
 function paintManage(){
  const c=C(),box=$('manage');box.replaceChildren();
  const head=n('div','mg-head'),title=n('div','');
  const back=n('a','mg-back',lang==='zh'?'返回持仓':'Back to holdings');back.href='#holdings';
  title.append(back,n('h2','',lang==='zh'?'持仓管理':'Manage holdings'));title.lastChild.id='manageTitle';
  const tools=n('div','mg-tools');
  tools.append(n('p','mg-count',`${lang==='zh'?'区块':'Block'} ${I.int(snap.snapshot.height)} · ${c.pieces(holdings.length)}`));
  if(holdings.length){copyAll=copyAllButton(c,holdings);tools.append(copyAll);paintCopyAll();}
  const add=n('button','mg-add-btn',lang==='zh'?'＋ 添加持仓':'＋ Add');add.type='button';
  add.addEventListener('click',()=>openAsk(add,c.addHoldingTitle,async raw=>{const r=U.resolveNumbers(snap,raw,holdings,c,c.skipHeld);if(r.empty)return {added:0,message:c.invalid};if(!r.ids.length)return {added:0,message:r.skipped.join(lang==='zh'?'；':'; ')};const ok=await saveHoldings(r.ids);if(!ok)return {added:0,message:c.addError};fresh=new Set(r.ids);manageMsg=r.skipped.length?c.addedSkipped(r.ids.length,r.skipped):(lang==='zh'?`已添加 ${r.ids.length} 枚`:`Added ${r.ids.length}`);render();return {added:r.ids.length,message:r.skipped.length?manageMsg:null};}));
  tools.append(add);head.append(title,tools);box.append(head);
  if(manageMsg){const msg=n('p','mg-msg',manageMsg);msg.setAttribute('role','status');box.append(msg);}
  const list=n('div','mg-grid');
  const own=H.current(snap,holdings);
  if(!own.ids.length)list.append(n('p','mg-empty',lang==='zh'?'还没有持仓。点「添加持仓」输入编号。':'No holdings yet. Use Add to enter numbers.'));
  for(const id of own.ids){
    const number=snap.items[id][0],listed=P.listingStatus(snap,id)==='listed',result=R.evaluateSnapshot(snap,id);
    const row=n('article','mg-card');row.dataset.id=id;
    const media=n('div','mg-art');media.append(image(id,'manage'));
    const info=n('div','mg-info');
    const held=n('span','mg-weight');held.append(n('small','',listed?(lang==='zh'?'挂单中':'Listed'):(lang==='zh'?'持有':'Held')),total(result,true));const top=n('div','mg-card-top');top.append(n('strong','',`#${number}`),held);info.append(top);
    const view=lastRewards?A.tile(lastRewards,id,lang):null;
    if(listed)info.append(n('small','',c.listedShort));
    else if(view){
      const rate=R.weeklyAllocation(R.units(result),own.allocation.all);
      const forecast=NakaMining.forecast(snap,id,{action:'hold',status:view.row});
      const rest=forecast.state==='ready'?U.shn(forecast.remaining):'—';
      info.append(n('span','mg-k',lang==='zh'?'本周已产出':'Accrued this week'));
      info.append(n('b','mg-earn',view.amount===null?'—':A.format(view.amount)));
      info.append(n('small','',`${lang==='zh'?'每周':'Per week'} ${U.shn(rate)}`));
      info.append(n('small','',`${lang==='zh'?'剩余':'Remaining'} ${rest}`));
    }
    const x=n('button','mg-x','×');x.type='button';x.title=lang==='zh'?`移出 #${number}`:`Remove #${number}`;x.setAttribute('aria-label',x.title);
    x.addEventListener('click',ev=>{ev.stopPropagation();manageRemove=manageRemove===id?null:id;paintManage();});
    media.append(x);
    row.append(media,info);
    if(manageRemove===id){const ask=n('div','mg-ask'),yes=n('button','mg-remove',lang==='zh'?'确认移出':'Remove'),no=n('button','mg-cancel',c.cancel);yes.type=no.type='button';yes.addEventListener('click',async()=>{const ok=await saveHoldings([id],true);manageRemove=null;manageMsg=ok?(lang==='zh'?`已移出 #${number}`:`Removed #${number}`):c.addError;render();});no.addEventListener('click',()=>{manageRemove=null;paintManage();});ask.append(n('span','',lang==='zh'?`移出 #${number}？`:`Remove #${number}?`),yes,no);row.append(ask);}
    list.append(row);
  }
  box.append(list);
  const left=demo?null:stored[H.LEFT],events=demo?null:stored[H.EVENTS],meta=demo?null:stored[H.META];
  const history=A.history(snap,own.ids,left,events,A.weeks(demo?null:stored[A.WEEKS]),R.rewardPhase(snap.snapshot),meta);
  if(history.left.length){
    const gone=n('section','mg-left');gone.append(n('h3','',c.leftTitle(history.left.length)));
    for(const x of history.left){
      const run=x.run,line=n('div','mg-left-row');
      const how=run.source==='wallet-absent'?c.leftAbsent:Number.isSafeInteger(run.listedAt)?c.leftSold(I.int(run.listedAt),A.listedWhen(run.listedAt,lang==='zh'),I.int(run.soldAt)):c.leftWallet;
      const text=n('div','');text.append(n('strong','',`#${x.number}`),n('small','',how));
      line.append(image(x.id,'manage-left'),text);
      const actions=n('div','mg-actions');
      for(const [action,label] of [['restore',c.leftRestore],['remove',c.leftRemove]]){
        const b=n('button','',label);b.type='button';
        b.addEventListener('click',()=>chrome.runtime.sendMessage({type:'shn-left',action,id:x.id,listedAt:run.listedAt}));
        actions.append(b);
      }
      line.append(actions);gone.append(line);
    }
    gone.append(n('p','mg-hint',c.leftNote));box.append(gone);
  }
 }
 function render(){hideFloat();const c=C(),t=T();document.documentElement.lang=lang==='zh'?'zh-CN':'en';document.title=`Naka Sigil · ${c.page}`;for(const b of document.querySelectorAll('[data-lang]'))b.setAttribute('aria-pressed',String(b.dataset.lang===lang));
  for(const [id,key]of Object.entries({heading:'heading',intro:'intro',clear:'clear',browseTitle:'browse',filterLabel:'filter',compareTitle:'compare',compareAddLabel:'addCompareTitle',aboutTitle:'aboutTitle'}))$(id).textContent=c[key];
  // When a listing bought now starts earning is the same for every card: said once, in the section's note.
  {const w=R.startWeek(snap.snapshot.height+1);$('browseNote').textContent=c.browseNote+(w<R.RULES.weeks?(lang==='zh'?` · 现在买入，第 ${w+1} 周起有奖励`:` · bought now, it earns from week ${w+1}`):'');}
  $('version').textContent=version?`v${version}`:'';$('version').hidden=!version;
  // The previous worker still runs (files replaced, extension not reloaded): one card in place of the page's sections.
  document.body.classList.toggle('is-stale',workerCurrent===false);$('updateCard').hidden=workerCurrent!==false;
  $('updateTitle').textContent=t.updateTitle;$('updateText').replaceChildren(n('span','',t.updateText(S.BUILD)),n('span','',t.updateKeep));$('updateReload').textContent=t.updateReload;$('updateHint').textContent=t.updateHint;
  const height=n('span','ws-block-number');height.append(n('span','ws-height-text',I.int(snap.snapshot.height)),NakaPixel.digits(I.int(snap.snapshot.height),'ws-block-digits'));$('block').replaceChildren(n('span','ws-block-label',t.snapBlock('')),height);$('block').setAttribute('aria-label',t.snapBlock(I.int(snap.snapshot.height)));$('age').textContent=I.blockAgeShort(t,snap.snapshot);$('age').title=I.blockTimeTitle(t,snap.snapshot);$('source').title=lang==='zh'?'产量按所示数据区块测算':'Output is estimated at the shown data block';$('source').textContent=demo?c.local:source==='live'?t.modeLive:t.srcBundled;
  $('pips').replaceChildren(...Array.from({length:E.MAX},(_,i)=>n('i',i<ids.length?'is-on':'')));
  $('scrollHint').textContent=c.scroll;$('legend').textContent=c.legend;$('demoNote').hidden=!demo;$('demoNote').textContent=demo?c.bundledNote:'';$('selectionCount').textContent=c.count(ids.length);$('clear').disabled=!ids.length;$('compareAdd').disabled=ids.length===E.MAX;$('compareAdd').title=ids.length===E.MAX?c.fullHere:c.addHint;$('status').textContent=message;$('assumption').textContent=c.independent;const phase=R.rewardPhase(snap.snapshot);$('limits').textContent=c.limits+' '+(['before','boundary'].includes(phase.state)?t.phaseNotStarted:phase.state==='active'?(phase.week===R.RULES.weeks?t.noFutureWeekNote:t.buyEligibilityNote):phase.state==='closed'?t.rewardClosed:t.phaseEnded)+(ids.some(id=>E.entry(snap,model,id)?.result?.unmeasured)?' '+c.unknownNote:'');$('filter').options[0].textContent=c.any;$('filter').title=c.filterNote;$('filter').value=String(minimum);
  $('market').textContent=c.market;$('market').href=`https://ord-dropz.xyz/secondary/collections/${snap.collection.slug}`;
  applyClassicSection();
  renderTabs();portfolioUI();planner.render();comparison();catalog();about();weightPopover.validate();listingPopover.validate();if(classicRepaint&&classicContextLang!==lang)classicRepaint();
  document.body.classList.remove('is-manage');
  {let notes=$('compareNotes');if(!notes){notes=n('details','ws-notes');notes.id='compareNotes';const sum=n('summary','');sum.id='compareNotesSum';notes.append(sum,$('legend'),$('assumption'),$('limits'));$('compare').append(notes);}$('compareNotesSum').textContent=lang==='zh'?'这些比较怎么读':'How to read this comparison';}
  if(document.body.dataset.section==='history'&&!$('history').querySelector('.nl-select'))paintHistory();
 }

 $('catalog').addEventListener('click',ev=>{if($('catalog').getAttribute('aria-busy')==='true'){ev.preventDefault();ev.stopImmediatePropagation();}},true);

 $('brand').append(NakaPixel.sigil(''),n('span','','Naka Sigil'));$('updateSigil').append(NakaPixel.sigil(''));
 $('clear').addEventListener('click',()=>change(null,true));$('filter').addEventListener('change',()=>{minimum=Number($('filter').value);showAll=false;catalog();});$('more').addEventListener('click',()=>{showAll=true;catalog();});
 document.querySelector('.ws-lang').addEventListener('click',ev=>{const b=ev.target.closest('[data-lang]');if(!b)return;if(demo){lang=b.dataset.lang;message='';persist();render();}else chrome.storage.local.set({[I.STORAGE_KEY]:b.dataset.lang});});
 // Where the popup or a link sends this page: a section, one Raise weight tab, or the simulator or the 400% plan for one
 // number. The page renders after its data loads, so it scrolls there itself.
 const hash=location.hash,wantSim=/^#sim-(\d+)$/.exec(hash),wantPlan=/^#plan-(\d+)$/.exec(hash),wantTab=/^#planner-(buy|plan|lock|sim)$/.exec(hash),wantSection=/^#(holdings|planner|compare|listings|left|about)$/.exec(hash);
 function scrollSection(section){document.documentElement.style.scrollPaddingTop=Math.ceil(sticky.getBoundingClientRect().height+16)+'px';if(section==='holdings'){window.scrollTo(0,0);return;}$(section)?.scrollIntoView({block:'start'});}
 function arrive(){
  if(location.hash==='#manage'){history.replaceState(history.state,'',location.pathname+location.search+'#holdings');applyClassicSection();}
  if(showClassicContext())return;
  const byNumber=x=>Object.keys(snap.items).find(id=>snap.items[id][0]===Number(x));
  if(wantSim){const id=byNumber(wantSim[1]);if(id)planner.openSim(id);else $('planner').scrollIntoView();return;}
  if(wantPlan){const id=byNumber(wantPlan[1]);if(id)planner.openPlan(id).then(()=>$('planner').scrollIntoView());else $('planner').scrollIntoView();return;}
  if(wantTab){planner.openTab(wantTab[1]);scrollSection('planner');return;}
  // Left is the end of My holdings and exists only while some piece has left: without it the page opens at My holdings.
  if(wantSection)scrollSection(wantSection[1]==='left'&&!$('left')?'holdings':wantSection[1]);}
 function applyClassicSection(){if(location.hash==='#manage')history.replaceState(history.state,'',location.pathname+location.search+'#holdings');const raw=location.hash.replace('#','');const known=['holdings','planner','compare','listings','about','history'];const section=raw==='left'||raw==='manage'?'holdings':known.includes(raw)?raw:(/^(planner-(buy|plan|lock|sim)|plan-\d+|sim-\d+)$/.test(raw)?'planner':'holdings');document.body.dataset.section=section;document.body.classList.remove('is-manage');activeSection=section==='history'||section==='about'?'':section;for(const a of tabs.children)a.toggleAttribute('aria-current',a.dataset.section===activeSection);}
 // The holding history page: a header like every other section (back to holdings, the title, the week select on the right),
 // then the report.
 function paintHistory(){const box=$('history');box.replaceChildren();const head=n('div','ws-section-head nl-page-head'),back=n('a','ws-back',lang==='zh'?'我的持仓':'My holdings'),title=n('h2','',lang==='zh'?'持仓历史':'Holding history'),tools=n('div','nl-page-tools');back.href='#holdings';title.id='historyTitle';head.append(back,title,tools);box.append(head,n('div','mg-history'));NakaLedgerUI.history(snap,lang,'fleet',box.lastChild,tools);}
 addEventListener('hashchange',()=>{applyClassicSection();const section=document.body.dataset.section;if(section==='history'){document.title=`Naka Sigil · ${lang==='zh'?'持仓历史':'Holding history'}`;paintHistory();window.scrollTo(0,0);}else{document.title='Naka Sigil';scrollSection(section);}});
 let classicContextStarted=false,classicContextLang=null,classicRepaint=null;
 function showClassicContext(){
  const params=new URLSearchParams(location.search);if(params.get('skin')!=='classic'||(!params.has('inspect')&&!params.has('history')))return false;if(classicContextStarted)return true;classicContextStarted=true;document.body.classList.add('has-classic-context');const panel=n('section','ws-classic-context');panel.id='classicContext';document.querySelector('main').prepend(panel);
  const heading=n('h1','',lang==='zh'?'经典详情':'Classic details'),back=n('button','ws-text-btn',lang==='zh'?'关闭':'Close');back.type='button';back.addEventListener('click',()=>window.close());panel.append(heading,back);const status=n('p','ws-muted');status.setAttribute('role','status');const body=n('div');panel.append(status,body);
  let ticket=0,lastContext=null;classicContextLang=lang;classicRepaint=()=>{classicContextLang=lang;heading.textContent=lang==='zh'?'经典详情':'Classic details';back.textContent=lang==='zh'?'关闭':'Close';if(lastContext)show(...lastContext);};
  const show=async(id,height,action)=>{lastContext=[id,height,action];const request=++ticket;status.textContent=lang==='zh'?'正在读取该区块…':'Reading this block…';body.replaceChildren();let basis=snap;try{if(height!==snap.snapshot.height){if(demo)throw Error('demo');const response=await chrome.runtime.sendMessage({type:'shn-history',height});if(!response?.ok)throw Error('history');basis=response.snapshot;}if(request!==ticket)return;if(!basis.items[id])throw Error('missing');const t=T(),r=R.evaluateSnapshot(basis,id),model=action==='hold'?null:P.create(basis,{action}),scenario=model?.get(id)??null;status.textContent=`#${basis.items[id][0]} · ${lang==='zh'?'依据区块':'BLOCK'} ${I.int(basis.snapshot.height)} · ${action==='cancel'?t.cancelAfter:action==='sale'?t.buyAfter:t.formulaColumn}`;body.append(scenario?.state==='ready'?P.render(model,id,t,I,{explain:A.explainFor(basis,id,lang,action),snap:basis,id}):P.renderCurrent(r,basis.snapshot,t,I,{listing:P.listingStatus(basis,id),notice:scenario?.state==='no-floor'?t.buyNoFloor:null,explain:A.explainFor(basis,id,lang),snap:basis,id}));}catch{if(request!==ticket)return;status.textContent=lang==='zh'?'该区块数据暂不可用，实时数据未改变。':'Block data unavailable; Live data is unchanged.';}};
  if(params.has('history')){const form=n('form','mx-history-form'),number=n('input'),height=n('input'),submit=n('button','',lang==='zh'?'查询':'Inspect');number.type=height.type='number';number.min=height.min='0';number.placeholder=lang==='zh'?'编号':'Number';height.placeholder=lang==='zh'?'历史区块':'Historical block';number.setAttribute('aria-label',number.placeholder);height.setAttribute('aria-label',height.placeholder);number.value=params.get('number')??(snap.items[params.get('inspect')]?.[0]??'');height.value=params.get('basis')??String(snap.snapshot.height);form.append(number,height,submit);panel.insertBefore(form,status);form.addEventListener('submit',ev=>{ev.preventDefault();const num=Number(number.value),h=Number(height.value),id=Object.keys(snap.items).find(id=>snap.items[id][0]===num);if(!id||!Number.isSafeInteger(h)||h<0||!number.value||!height.value){status.textContent=lang==='zh'?'请输入有效编号与区块':'Enter a valid number and block';return;}show(id,h,'hold');});number.focus();}
  else {const id=params.get('inspect'),height=Number(params.get('basis')),action=['sale','cancel','hold'].includes(params.get('action'))?params.get('action'):'hold';show(id,Number.isSafeInteger(height)?height:snap.snapshot.height,action);}return true;
 }
 /** Demo only: the example holdings of the README's screenshots (fixed public numbers chosen for illustration, no one's
  * wallet), each one that this block has. None is picked from the data: a piece picked by rule could be anyone's. */
 const EXAMPLE_NUMBERS=[6,314,888,1500,2700];
 function exampleHoldings(snap){
  const byNumber=new Map(Object.entries(snap.items).map(([id,row])=>[row[0],id]));
  return EXAMPLE_NUMBERS.map(x=>byNumber.get(x)).filter(id=>id!==undefined);
 }
 if(demo){
  let data=null;try{data=JSON.parse(localStorage.getItem('nakaWeb')||'null');}catch{message=C().addError;}
  if(data){holdings=H.normalize(data.portfolio);ids=E.normalize(data.compare);lang=I.resolveLang(data.lang);}
  else holdings=exampleHoldings(snap);
  render();arrive();
 }else{
  const KEYS=[S.KEYS.live,S.KEYS.closing,I.STORAGE_KEY,E.KEY,H.KEY,A.KEY,A.STATUS,A.OBSERVED,A.WEEKS,H.LEFT,H.EVENTS,H.META,H.ABSENT,NakaLedger.KEY];
  // A worker from before shn-build leaves it unanswered (undefined); a rejection means no worker took it: neither runs this code.
  chrome.storage.local.get(KEYS).then(got=>{stored=got;adopt();render();arrive();chrome.runtime.sendMessage({type:'shn-build'}).then(a=>S.sameBuild(a),()=>false).then(same=>{workerCurrent=same;render();});});
  // Reload asks the new worker to open this page again at the same section (Chrome closes it on reload).
  $('updateReload').addEventListener('click',()=>{$('updateReload').disabled=true;chrome.storage.local.set({[S.REOPEN]:{page:'workspace',section:location.hash.slice(1),at:Date.now()}}).then(()=>chrome.runtime.reload());});
  chrome.storage.onChanged.addListener((changes,area)=>{if(area!=='local')return;if(Object.hasOwn(changes,TEAM_KEY))planner.extrasChanged(teamOf(changes[TEAM_KEY].newValue));let relevant=false;for(const key of KEYS)if(Object.hasOwn(changes,key)){stored[key]=changes[key].newValue;relevant=true;}if(relevant){adopt();render();}});
  const beat=()=>{if(document.visibilityState==='visible'&&chrome.runtime.id)chrome.runtime.sendMessage({type:'shn-visible'}).catch(()=>{});};
  beat();setInterval(beat,S.HEARTBEAT_MS);document.addEventListener('visibilitychange',beat);
 }
 setInterval(()=>{$('age').textContent=I.blockAgeShort(T(),snap.snapshot);},15000);
})();
