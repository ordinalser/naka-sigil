/* Extension workspace (and its bundled-data demo): My holdings, Compare and snapshot listings on the shared engine. */
(() => {
 'use strict';
 const R=ShnakasRules,P=NakaPurchase,E=NakaExplore,I=ShnakasI18n,S=ShnakasSource,B=SHNAKAS_SNAPSHOT,H=NakaPortfolio,U=NakaExploreUI;
 const demo=document.body.dataset.mode==='demo';
 const version=demo?document.body.dataset.version:chrome.runtime.getManifest().version;
 const $=id=>document.getElementById(id),n=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
 let snap=B,model=P.create(B),lang='en',ids=demo?E.examples(B,model).slice(0,3):[],stored={},minimum=0,showAll=false,message='';
 let holdings=[],boost=false,boostSort='ask',fresh=new Set();
 const A=globalThis.NakaRewards;
 const C=()=>U.pick(lang),T=()=>I.pick(lang);
 const art=id=>U.art(snap,id,'ws-art-fallback');
 const total=(r,bitmap=false)=>r?P.decorateWeight(n('span'),r,bitmap):n('span','',C().unavailable);
 const trend=d=>d.lo>0?'up':d.hi<0?'down':d.lo===0&&d.hi===0?'same':'unknown';

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
 const image=id=>{const button=n('button','ws-image');button.type='button';button.setAttribute('aria-label',C().preview(snap.items[id][0]));button.append(art(id));
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

 // ---------------------------------------------------------------- "+" number entry, shared by My holdings and Compare.
 const ask=n('form','ws-entry');ask.hidden=true;ask.noValidate=true;document.body.append(ask);let askAnchor=null,askSubmit=null;
 function closeAsk(){if(ask.hidden)return;ask.hidden=true;const anchor=askAnchor;askAnchor=null;askSubmit=null;anchor?.focus();}
 function openAsk(anchor,title,submit){
  const c=C(),input=n('input'),error=n('p','ws-entry-error'),actions=n('div','ws-entry-actions'),cancel=n('button','ws-text-btn',c.cancel),ok=n('button','ws-entry-ok',c.confirmAdd);
  input.autocomplete='off';input.maxLength=400;input.placeholder=c.numberPromptMulti;input.setAttribute('aria-label',c.numberPromptMulti);cancel.type='button';ok.type='submit';cancel.addEventListener('click',closeAsk);
  actions.append(cancel,ok);ask.replaceChildren(n('strong','',title),input,n('p','ws-entry-hint',c.multiHint),error,actions);askAnchor=anchor;askSubmit=async()=>{const out=await submit(input.value);if(!out.message){closeAsk();return;}error.textContent=out.message;if(out.added){input.value='';input.removeAttribute('aria-invalid');}else{input.setAttribute('aria-invalid','true');input.select();}};
  ask.hidden=false;const rect=anchor.getBoundingClientRect(),box=ask.getBoundingClientRect();
  ask.style.left=Math.max(16,Math.min(rect.left,innerWidth-box.width-16))+'px';ask.style.top=(rect.bottom+8+box.height>innerHeight-16?Math.max(16,rect.top-box.height-8):rect.bottom+8)+'px';input.focus();
 }
 ask.addEventListener('submit',ev=>{ev.preventDefault();askSubmit?.();});
 document.addEventListener('pointerdown',ev=>{if(!ask.hidden&&!ask.contains(ev.target)&&!askAnchor?.contains(ev.target))closeAsk();});

 // ---------------------------------------------------------------- Data and persistence.
 function adopt(){const pick=S.choose({manual:stored[S.KEYS.manual],live:stored[S.KEYS.live],liveEnabled:stored[S.KEYS.liveEnabled]},B);if(snap!==pick.snap){snap=pick.snap;model=P.create(snap);}lang=I.resolveLang(stored[I.STORAGE_KEY]);ids=E.normalize(stored[E.KEY]);holdings=H.normalize(stored[H.KEY]);}
 function persist(){try{localStorage.setItem('nakaWeb',JSON.stringify({portfolio:holdings,compare:ids,lang}));}catch{message=C().addError;}}
 async function saveHoldings(next){if(demo){holdings=next;persist();render();}else await chrome.storage.local.set({[H.KEY]:next});}
 async function change(id,clear=false){
  if(demo){const out=clear?{ids:[],state:'removed'}:E.toggle(ids,id,snap);ids=out.ids;persist();message=out.state==='full'?C().fullHere:out.state==='missing'?C().missing:'';render();return;}
  try{const res=await chrome.runtime.sendMessage({type:'shn-compare',action:clear?'clear':'toggle',id});if(!res?.ok)throw Error('save');ids=res.ids;message=res.state==='full'?C().fullHere:res.state==='missing'?C().missing:'';render();}catch{message=C().addError;render();}
 }

 // ---------------------------------------------------------------- Top bar: section tabs with counts; the visible section is marked.
 const tabs=$('tabs');
 function renderTabs(){
  const c=C();
  tabs.replaceChildren(...[['holdings',c.holdings,String(H.current(snap,holdings).ids.length)],['compare',c.compare,`${ids.length}/${E.MAX}`],['listings',c.tabListings,String(snap.offers.length)]].map(([id,label,count])=>{
   const a=n('a','ws-tab');a.href='#'+id;a.dataset.section=id;a.append(n('span','',label),n('span','ws-tab-count',count));if(id===activeSection)a.setAttribute('aria-current','true');return a;}));
 }
 let activeSection='holdings';
 const spy=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting){activeSection=e.target.id;for(const a of tabs.children)a.toggleAttribute('aria-current',a.dataset.section===activeSection);}},{rootMargin:'-40% 0px -55% 0px'});
 for(const id of ['holdings','compare','listings'])spy.observe($(id));

 // ---------------------------------------------------------------- My holdings.
 const portfolio=$('holdings');let expanded=false;
 function portfolioUI(){
  const c=C(),own=H.current(snap,holdings),a=own.allocation;portfolio.replaceChildren();
  const head=n('div','ws-portfolio-head'),title=n('div','ws-portfolio-title'),h2=n('h2','',c.holdings);h2.id='holdingsTitle';
  title.append(h2,n('span','ws-portfolio-count',c.pieces(own.ids.length)));head.append(title);
  portfolio.append(head);if(own.missing)portfolio.append(n('p','ws-muted',lang==='zh'?`${own.missing} 枚已保存持仓正在等待数据更新，编号不会移除`:`${own.missing} saved Nakas await public data; their IDs are retained`));if(own.ids.length)portfolio.append(A.render(snap,own.ids,demo?null:stored[A.KEY],demo?null:stored[A.OBSERVED],lang,a.weekly,demo?null:stored[A.STATUS]).element);
  const grid=n('div','ws-holding-grid'),add=n('button','ws-holding ws-holding-add');add.type='button';add.append(n('span','ws-add-mark','+'),n('span','',c.addHoldingTitle));
  add.addEventListener('click',()=>openAsk(add,c.addHoldingTitle,async raw=>{const r=U.resolveNumbers(snap,raw,holdings,c,c.skipHeld);if(r.empty)return {added:0,message:c.invalid};if(r.ids.length){fresh=new Set(r.ids);await saveHoldings(H.update(holdings,r.ids,snap));}return {added:r.ids.length,message:r.skipped.length?c.addedSkipped(r.ids.length,r.skipped):null};}));
  grid.append(add);
  for(const id of own.ids){
   const listed=P.listingStatus(snap,id)==='listed',number=snap.items[id][0],tile=n('article','ws-holding'),r=R.evaluateSnapshot(snap,id);tile.dataset.id=id;
   // Two dimensions: the piece's weight, and what it earns each week (zero while listed); delisting's effect is on hover.
   if(listed)tile.classList.add('is-listed');if(fresh.has(id))tile.classList.add('is-new');
   const media=n('div','ws-holding-art');media.append(art(id));if(listed)media.append(n('span','ws-holding-tag',c.listedTag));
   const remove=n('button','ws-holding-remove','×');remove.type='button';remove.title=c.removeHolding(number);remove.setAttribute('aria-label',c.removeHolding(number));remove.addEventListener('click',()=>saveHoldings(H.update(holdings,[id],snap,true)));media.append(remove);
   const info=n('div','ws-holding-info'),top=n('div','ws-holding-top');top.append(n('strong','',`#${number}`),total(r));info.append(top);
   const weekly=n('p','ws-holding-weekly');
   weekly.append(n('b',listed?'ws-holding-zero':'',listed?'0':U.shn(R.weeklyAllocation(R.units(r),a.all))),n('span','',c.weekUnit));if(listed)weekly.classList.add('is-zero');
   info.append(weekly);const accrued=A.portfolio(snap,[id],demo?null:stored[A.KEY],demo?null:stored[A.OBSERVED]).rows[0];if(accrued?.amount!==null&&accrued?.amount!==undefined){weekly.querySelector('b').textContent=A.format(accrued.amount);weekly.querySelector('span').textContent=lang==='zh'?(accrued.verified?'本周已累计':'本周累计参考'):(accrued.verified?'Accrued this week':'This week · reference');info.append(n('small','ws-accrued',`${lang==='zh'?(accrued.paused&&!listed?'下个符合条件周':'当前周速率'):(accrued.paused&&!listed?'Next eligible week':'Current weekly rate')} ${listed?'0':U.shn(R.weeklyAllocation(R.units(r),a.all))} / ${lang==='zh'?'周':'week'}`));}tile.append(media,info);
   // A listed holding explains itself on hover: what delisting would change, next to the NFT itself.
   if(listed){tile.tabIndex=0;hoverCard(tile,()=>{const x=H.impact(snap,holdings,id,'cancel');return x.state==='ready'?impactCard(x,id,`#${number} · ${c.listedTag}`,c.cancelLead):[n('p','',c.listedNoEarn)];},320);}
   grid.append(tile);
  }
  portfolio.append(grid);
  if(!own.ids.length)portfolio.append(n('p','ws-muted ws-holdings-how',`${c.holdingsEmpty} ${c.holdingsHow}`));
  else portfolio.append(n('p','ws-muted ws-holdings-how',own.listed?`${c.holdingsHow} ${c.hoverMore}`:c.holdingsHow));
  if(own.missing)portfolio.append(n('p','ws-muted',c.holdingsMissing));
  if(fresh.size){const added=[...fresh];fresh=new Set();const tiles=added.map(id=>portfolio.querySelector(`[data-id="${id}"]`)).filter(Boolean);tiles[0]?.scrollIntoView({block:'nearest',behavior:'smooth'});setTimeout(()=>{for(const t of tiles)t.classList.remove('is-new');},1200);}
 }

 // ---------------------------------------------------------------- Compare.
 function comparison(){
  const c=C(),t=T(),box=$('comparison');box.replaceChildren();const entries=ids.map(id=>E.entry(snap,model,id));
  if(!ids.length){const empty=n('div','ws-blank');empty.append(n('strong','',c.empty),n('p','',c.emptyHint));const example=n('button','',c.load);example.addEventListener('click',async()=>{for(const id of E.examples(snap,model))await change(id);});empty.append(example);box.append(empty);return;}
  const table=n('table','ws-table');table.style.minWidth=`${Math.max(360,136+ids.length*235)}px`;table.setAttribute('aria-label',c.page);
  const head=n('thead'),tr=n('tr');tr.append(n('td','ws-label'));
  entries.forEach((e,index)=>{const th=n('th'),item=n('div','ws-item'),text=n('div');if(e)item.append(image(e.id));text.append(n('strong','',e?`#${e.number}`:c.missing));if(e){const link=n('a','ws-item-link',c.colMarket);link.href=`https://ord-dropz.xyz/secondary/item/${e.id}?collection=${snap.collection.slug}`;link.target='_blank';link.rel='noopener noreferrer';text.append(n('small','',c[e.listing]),link);const rank=P.numberBadge(e.number,t);if(rank)text.append(rank);}const remove=n('button','ws-remove','×');remove.title=c.remove;remove.setAttribute('aria-label',`${c.remove} ${e?'#'+e.number:''}`);remove.addEventListener('click',()=>change(ids[index]));item.append(text,remove);th.append(item);tr.append(th);});head.append(tr);table.append(head);const body=n('tbody');table.append(body);
  const row=(label,fn,cls='')=>{const tr=n('tr',cls);const th=n('th','ws-label',label);th.scope='row';tr.append(th);entries.forEach(e=>{const td=n('td');if(e)fn(td,e);else td.textContent='—';tr.append(td);});body.append(tr);};
  row(c.total,(td,e)=>{td.append(n('span','ws-caption',e.listing==='listed'?c.after:c.holding),total(e.result,true));if(e.sale.state==='no-floor')td.append(n('small','',c.noFloor));},'ws-total');
  row(c.ask,(td,e)=>{td.textContent=e.listing==='listed'?I.btc(e.sale.price):'—';td.title=c.askNote;},'ws-price');
  if(entries.some(e=>e&&P.relayCredits(snap,e.id)!==null))row(t.relayCredits,(td,e)=>{const credits=P.relayCredits(snap,e.id);td.textContent=credits===null?'—':String(credits);td.title=t.relayCreditsMeaning;},'ws-credits');
  row(c.before,(td,e)=>td.append(e.listing==='listed'?total(e.before):n('span','','—')),'ws-before');
  if(holdings.length){
   row(c.forMe,(td,e)=>{const x=H.impact(snap,holdings,e.id,'sale',model);if(x.state!=='ready'){td.textContent='—';return;}const d=x.allocation.delta;td.textContent=c.gainWeek(U.shn(d,true));td.dataset.change=trend(d);},'ws-gain');
   row(c.weeklyAfterBuy,(td,e)=>{const x=H.impact(snap,holdings,e.id,'sale',model);td.textContent=x.state==='ready'?`${U.shn(x.allocation.after.weekly)} SHNAKAS`:'—';},'ws-before');
  }
  const guide=n('tr','ws-trait-guide'),cell=n('th','',c.traitGuide);cell.colSpan=entries.length+1;guide.append(cell);body.append(guide);
  const types=[...new Set(entries.flatMap(e=>e?.before.traits.map(t=>t.type)??[]))];
  for(const type of types)row(type==='Hair And Headwear'?t.headwear:type,(td,e)=>{const a=e.before.traits.find(x=>x.type===type);if(!a){td.textContent='—';return;}if(e.sale.state==='no-floor'){td.append(n('span','ws-trait-name',a.value),n('span','ws-bonus','—'));return;}const b=e.sale.state==='ready'?e.result.traits.find(x=>x.type===type):a;td.append(n('span','ws-trait-name',a.value));const pct=x=>x.measured?`+${x.pct}%`:'+0–100%',value=n('span','ws-bonus');const changed=e.sale.state==='ready'?P.traitChange(a,b,e.sale.beforeFloor,e.sale.afterFloor):null;
   if(changed){td.classList.add('ws-changed');td.dataset.change=changed;td.title=t.changedRows;if(pct(a)!==pct(b))value.append(n('span','ws-old',pct(a)+' → '));}value.append(n('span','',pct(b)+(changed?(changed==='up'?' ↑':changed==='down'?' ↓':' ◆'):'')));td.append(value);const shared=holdings.filter(id=>id!==e.id&&snap.items[id]?.slice(1).some(idx=>snap.traits[idx][0]===type&&snap.traits[idx][1]===a.value)).length;if(shared)td.append(n('small','ws-shared',c.sharedTrait(shared)));
   const floor=e.sale.state==='ready'?e.sale.afterFloor:snap.snapshot.collectionFloor;const ratio=(v,f)=>v.method==='official-sales'?t.officialSales:v.method==='official-none'?t.officialNoSales:v.method==='official-lastBlock'?t.officialLastBlock:v.method==='carry-unverified'?t.carryUnknown:v.method==='held'?t.heldTrait(v.supply):v.method==='sales-median'?t.salesMedianShort+' '+R.formatRatio(v.basisPrice,f):v.method==='no-sales'?t.noSales:v.method==='sales-ambiguous'?t.salesTied:v.method==='floor'?R.formatRatio(v.floor,f):t.saleUnknown;const now=ratio(b,floor),old=ratio(a,e.sale.beforeFloor??floor);td.append(n('small','',changed&&old!==now?old+' → '+now:now));
  });
  if(entries.some(e=>e?.before.number.pct))row(c.number,(td,e)=>{td.textContent=`+${e.before.number.pct}%`;});
  box.append(table);
 }
 $('compareAdd').addEventListener('click',()=>{const c=C();openAsk($('compareAdd'),c.addCompareTitle,async raw=>{const r=U.resolveNumbers(snap,raw,ids,c,c.skipCompared);if(r.empty)return {added:0,message:c.invalid};let added=0;for(const id of r.ids){if(ids.length===E.MAX){r.skipped.push(c.skipFull(snap.items[id][0]));continue;}await change(id);added++;}return {added,message:r.skipped.length?c.addedSkipped(added,r.skipped):null};});});

 // ---------------------------------------------------------------- Snapshot listings, optionally ranked by what they add to my holdings.
 const boostOption=n('option');boostOption.value='boost';$('filter').append(boostOption);
 const sortBox=n('span','ws-sort');sortBox.hidden=true;for(const key of ['ask','gain']){const b=n('button');b.type='button';b.dataset.sort=key;b.addEventListener('click',()=>{boostSort=key;showAll=false;catalog();});sortBox.append(b);}
 document.querySelector('.ws-filter').after(sortBox);
 function catalog(){
  const c=C();let entries=E.candidates(snap,model,minimum),gains=null;
  if(boost){
   const ranked=H.rank(snap,holdings).filter(x=>x.impact.allocation.delta.lo>0);
   if(boostSort==='ask')ranked.sort((a,b)=>a.price-b.price);
   gains=new Map(ranked.map(x=>[x.id,x.impact]));entries=ranked.map(x=>E.entry(snap,model,x.id));
  }
  $('catalogCount').textContent=String(entries.length);$('browseNote').textContent=boost?c.boostNote:c.browseNote;
  sortBox.hidden=!boost;for(const b of sortBox.children)b.setAttribute('aria-pressed',String(b.dataset.sort===boostSort));
  if(boost&&!entries.length){$('catalog').replaceChildren(n('p','ws-muted',c.noGain));$('more').hidden=true;$('catalogFull').hidden=true;return;}
  $('catalog').replaceChildren(...entries.slice(0,showAll?entries.length:12).map(e=>{
   const picked=ids.includes(e.id),card=n('article',picked?'ws-candidate is-selected':'ws-candidate'),info=n('div');
   // Now: number, ask and the listing's relay credits. After sale: the weight it would have and what it adds for me.
   const now=n('div','ws-card-now');now.append(n('span','ws-ask',I.btc(e.sale.price)+' BTC'));
   const after=n('div','ws-card-after');after.append(n('small','',c.after),total(e.result));
   info.append(n('strong','',`#${e.number}`),now,after);
   const buy=n('a','ws-buy',c.buyNow);buy.title=c.buyHint;buy.href=`https://ord-dropz.xyz/secondary/item/${e.id}?collection=${snap.collection.slug}`;buy.target='_blank';buy.rel='noopener noreferrer';
   const credits=P.relayCredits(snap,e.id);if(credits!==null){const label=n('small','ws-credits',`${T().relayCredits} ${credits}`);label.title=T().relayCreditsMeaning;now.append(label);}
   if(holdings.length&&!holdings.includes(e.id)){
    const impact=gains?.get(e.id)??H.impact(snap,holdings,e.id,'sale',model);
    if(impact.state==='ready'){const d=impact.allocation.delta,gain=n('small','ws-impact',c.forMeShort(U.shn(d,true)));gain.dataset.change=trend(d);after.append(gain);
     card.tabIndex=0;hoverCard(card,()=>impactCard(impact,e.id,`${c.buyLead(e.number)} · ${I.btc(e.sale.price)} BTC`,null),320);}
   }
   const b=n('button','',picked?'✓':'+');b.setAttribute('aria-label',`${picked?c.remove:c.add} #${e.number}`);b.setAttribute('aria-pressed',String(picked));b.title=picked?c.removeHint:ids.length===E.MAX?c.fullHere:c.addHint;b.disabled=!picked&&ids.length===E.MAX;b.addEventListener('click',()=>change(e.id));
   const actions=n('div','ws-card-actions');actions.append(b,buy);card.append(image(e.id),info,actions);return card;
  }));
  $('catalogFull').hidden=ids.length<E.MAX;$('catalogFull').textContent=c.fullHere;$('more').hidden=showAll||entries.length<=12;$('more').textContent=c.showAll;
 }

 // ---------------------------------------------------------------- About: read-only promise, allocation arithmetic, rules and data, folded.
 function about(){
  const c=C(),open=new Set([...$('aboutItems').querySelectorAll('details[open]')].map(d=>d.dataset.key)),parts=U.about(c,R,version);
  const item=(key,title,body)=>{const d=n('details','ws-about-item');d.dataset.key=key;d.open=open.has(key);const content=n('div','ws-about-body');content.append(...body);d.append(n('summary','',title),content);return d;};
  $('aboutItems').replaceChildren(item('safe',c.aboutSafe,parts.safe),item('alloc',c.aboutAlloc,parts.alloc),item('rules',c.aboutRules,parts.rules),item('data',c.aboutData,parts.data));
 }

 function render(){hideFloat();const c=C(),t=T();document.documentElement.lang=lang==='zh'?'zh-CN':'en';document.title=`Naka Sigil · ${c.page}`;for(const b of document.querySelectorAll('[data-lang]'))b.setAttribute('aria-pressed',String(b.dataset.lang===lang));
  for(const [id,key]of Object.entries({heading:'heading',intro:'intro',clear:'clear',browseTitle:'browse',filterLabel:'filter',browseNote:'browseNote',compareTitle:'compare',compareAddLabel:'addCompareTitle',aboutTitle:'aboutTitle'}))$(id).textContent=c[key];
  $('version').textContent=version?`v${version}`:'';$('version').hidden=!version;
  const height=n('span','ws-block-number');height.append(n('span','ws-height-text',I.int(snap.snapshot.height)),NakaPixel.digits(I.int(snap.snapshot.height),'ws-block-digits'));$('block').replaceChildren(n('span','ws-block-label',t.snapBlock('')),height);$('block').setAttribute('aria-label',t.snapBlock(I.int(snap.snapshot.height)));$('age').textContent=I.blockAge(t,snap.snapshot);$('age').title=I.blockTimeTitle(t,snap.snapshot);$('source').title=[...P.renderLaunch(snap.snapshot,t,I).children].map(e=>e.textContent).join('\n');$('source').textContent=demo?c.local:S.resolveLive(stored[S.KEYS.liveEnabled])?t.modeLive:t.modeFixed;
  $('pips').replaceChildren(...Array.from({length:E.MAX},(_,i)=>n('i',i<ids.length?'is-on':'')));
  $('scrollHint').textContent=c.scroll;$('legend').textContent=c.legend;$('demoNote').hidden=!demo;$('demoNote').textContent=demo?c.bundledNote:'';$('selectionCount').textContent=c.count(ids.length);$('clear').disabled=!ids.length;$('compareAdd').disabled=ids.length===E.MAX;$('compareAdd').title=ids.length===E.MAX?c.fullHere:c.addHint;$('status').textContent=message;$('assumption').textContent=c.independent;const phase=R.rewardPhase(snap.snapshot);$('limits').textContent=c.limits+' '+(['before','boundary'].includes(phase.state)?t.phaseNotStarted:phase.state==='active'?(phase.week===R.RULES.weeks?t.noFutureWeekNote:t.buyEligibilityNote):phase.state==='closed'?t.rewardClosed:t.phaseEnded)+(ids.some(id=>E.entry(snap,model,id)?.result?.unmeasured)?' '+c.unknownNote:'');$('filter').options[0].textContent=c.any;$('filter').title=c.filterNote;boostOption.textContent=c.boost;boostOption.disabled=!holdings.length;boostOption.title=holdings.length?c.boostHint:c.boostEmpty;if(boost&&!holdings.length)boost=false;$('filter').value=boost?'boost':String(minimum);sortBox.children[0].textContent=c.sortAsk;sortBox.children[1].textContent=c.sortGain;
  $('market').textContent=c.market;$('market').href=`https://ord-dropz.xyz/secondary/collections/${snap.collection.slug}`;
  renderTabs();portfolioUI();comparison();catalog();about();
 }

 $('brand').append(NakaPixel.sigil(''),n('span','','Naka Sigil'));
 $('clear').addEventListener('click',()=>change(null,true));$('filter').addEventListener('change',()=>{boost=$('filter').value==='boost';minimum=boost?0:Number($('filter').value);showAll=false;catalog();});$('more').addEventListener('click',()=>{showAll=true;catalog();});
 document.querySelector('.ws-lang').addEventListener('click',ev=>{const b=ev.target.closest('[data-lang]');if(!b)return;if(demo){lang=b.dataset.lang;message='';persist();render();}else chrome.storage.local.set({[I.STORAGE_KEY]:b.dataset.lang});});
 // The popup's Raise my weight opens the listings already ranked by what they add to my holdings.
 const wantBoost=location.hash==='#boost';
 function arrive(){if(!wantBoost)return;if(holdings.length){boost=true;showAll=false;$('filter').value='boost';catalog();}$('listings').scrollIntoView();}
 /** Demo only: a fixed set of example holdings from the bundled block, one unlisted Naka for each weight from 400% down
  * to 100% (the lowest number with that weight) plus one listed Naka, so the page shows every holding state. */
 function exampleHoldings(snap){
  const listed=new Set(snap.offers.map(o=>o[0])),byNumber=Object.keys(snap.items).sort((a,b)=>snap.items[a][0]-snap.items[b][0]),picked=[];
  for(const weight of [400,300,250,200,150,125,100]){const id=byNumber.find(x=>!listed.has(x)&&!picked.includes(x)&&R.evaluateSnapshot(snap,x).lo.weight===weight&&R.evaluateSnapshot(snap,x).exact);if(id)picked.push(id);}
  const offer=snap.offers.find(o=>!ids.includes(o[0]));if(offer)picked.push(offer[0]);
  return picked;
 }
 if(demo){
  let data=null;try{data=JSON.parse(localStorage.getItem('nakaWeb')||'null');}catch{message=C().addError;}
  if(data){holdings=H.normalize(data.portfolio);ids=E.normalize(data.compare);lang=I.resolveLang(data.lang);}
  else holdings=exampleHoldings(snap);
  render();arrive();
 }else{
  chrome.storage.local.get([S.KEYS.manual,S.KEYS.live,S.KEYS.liveEnabled,I.STORAGE_KEY,E.KEY,H.KEY,A.KEY,A.STATUS,A.OBSERVED]).then(got=>{stored=got;adopt();render();arrive();});
  chrome.storage.onChanged.addListener((changes,area)=>{if(area!=='local')return;let relevant=false;for(const key of [S.KEYS.manual,S.KEYS.live,S.KEYS.liveEnabled,I.STORAGE_KEY,E.KEY,H.KEY,A.KEY,A.STATUS,A.OBSERVED])if(Object.hasOwn(changes,key)){stored[key]=changes[key].newValue;relevant=true;}if(relevant){adopt();render();}});
  const beat=()=>{if(document.visibilityState==='visible'&&chrome.runtime.id)chrome.runtime.sendMessage({type:'shn-visible'}).catch(()=>{});};
  beat();setInterval(beat,S.HEARTBEAT_MS);document.addEventListener('visibilitychange',beat);
 }
 setInterval(()=>{$('age').textContent=I.blockAge(T(),snap.snapshot);},15000);
})();
