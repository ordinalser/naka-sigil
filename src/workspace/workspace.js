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
 const artFor=U.artStore(),art=(id,place)=>place?artFor(snap,id,'ws-art-fallback',place):U.art(snap,id,'ws-art-fallback');
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
 const spy=new IntersectionObserver(()=>{const top=innerHeight*.4,bottom=innerHeight*.45,hit=SECTIONS.find(id=>{const r=$(id).getBoundingClientRect();return r.top<bottom&&r.bottom>top;});if(hit===undefined)return;activeSection=hit;for(const a of tabs.children)a.toggleAttribute('aria-current',a.dataset.section===activeSection);},{rootMargin:'-40% 0px -55% 0px'});
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
  b.dataset.shnId=id;b.tabIndex=0;b.setAttribute('aria-label',C().weightDetail(r.number.value));
  return b;
 }
 function weightPop(id){
  const t=T(),c=C(),r=R.evaluateSnapshot(snap,id),listed=P.listingStatus(snap,id)==='listed',head=n('div','shn-pop__head'),brand=n('span','shn-inspect-brand');
  brand.append(NakaPixel.sigil('shn-badge__icon'),n('span','shn-eyebrow',t.title));head.append(brand,n('span','shn-inspect-number',`#${r.number.value}`));
  const tag=P.numberBadge(r.number.value,t);if(tag)head.append(tag);
  const compare=n('button','shn-compare-add');compare.type='button';U.paintCompare(compare,E.compareState(ids,id),c);compare.addEventListener('click',ev=>{ev.stopPropagation();change(id);});
  const own=n('button','shn-compare-add shn-holding-add',c.inHoldings);own.type='button';own.title=c.holdingRemoveHint;own.setAttribute('aria-pressed','true');own.addEventListener('click',ev=>{ev.stopPropagation();saveHoldings([id],true);});
  head.append(compare,own);const nodes=[head];
  const panel=listed?P.render(cancelModel(),id,t,I,{explain:A.explainFor(snap,id,lang,'cancel')}):null;
  if(panel){const x=H.impact(snap,holdings,id,'cancel');if(x.state==='ready')panel.append(U.holdingsLine(x,c));nodes.push(panel);}
  else nodes.push(P.renderCurrent(r,snap.snapshot,t,I,{explain:A.explainFor(snap,id,lang),listing:P.listingStatus(snap,id),credits:P.relayCredits(snap,id)}));
  const row=lastRewards?.rows.find(x=>x.id===id);if(!listed&&Number.isFinite(row?.avg))nodes.push(n('p','ws-wcard-avg',c.avgWeight(row.avg.toFixed(1),R.formatWeight(r))));
  return {className:tierClass(r),nodes};
 }
 const weightPopover=NakaPopover.create({selector:'.ws-holding .shn-badge',id:'ws-weight-tooltip',build:badge=>weightPop(badge.dataset.shnId),
  target:badge=>badge.querySelector('.shn-buy-preview,.shn-badge__weight'),raise:()=>0,identity:badge=>`${badge.dataset.shnId}|${snap.snapshot.height}|${lang}`});
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
  const rewards=own.ids.length||history.left.length?A.render(snap,own.ids,demo?null:stored[A.KEY],demo?null:stored[A.OBSERVED],lang,{share:a.share,status:demo?null:stored[A.STATUS],history,events}):null;if(rewards)portfolio.append(rewards.element);lastRewards=rewards?.data??null;
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
   const sub=n('small',`ws-holding-sub ws-holding-sub--${status}`,listed?c.listedShort:idle?c.idleNote:status==='earning'?c.perWeekLine(U.shn(rate)):['gone','paused','ended','unknown'].includes(status)?view.label:`${view.label} · ${c.perWeekLine(U.shn(rate))}`);sub.title=view.explain.full;
   info.append(now,sub);tile.append(media,info);
   // A sale the extension cannot attribute (a listing that was open when the piece was added, or a holding saved before
   // anchors existed that sold this week): the owner says whether it was their sale or their purchase.
   if(!demo){const ask=H.saleToConfirm(snap,id,events?.rows?.[id],meta?.[id],view.row.reason);if(ask)confirm.push({id,number,...ask});}
   // Selecting the tile (pointer, Enter or Space) opens the simulator for it; a listed one opens with “Assume reclaimed”.
   const open=()=>{planner.openSim(id,listed?'cancel':null);};
   tile.classList.add('is-simulable');tile.title=c.simulateHint(number);tile.tabIndex=0;tile.setAttribute('role','button');tile.setAttribute('aria-label',c.simulateHint(number));
   tile.addEventListener('click',ev=>{if(ev.target.closest('.ws-holding-remove,.shn-badge'))return;open();});
   tile.addEventListener('keydown',ev=>{if(ev.target!==tile||!['Enter',' '].includes(ev.key))return;ev.preventDefault();open();});
   grid.append(tile);
  }
  portfolio.append(grid);
  if(!own.ids.length)portfolio.append(n('p','ws-muted ws-holdings-how',`${c.holdingsEmpty} ${demo?c.holdingsHowDemo:c.holdingsHow}`));
  else portfolio.append(n('p','ws-muted ws-holdings-how',`${demo?c.holdingsHowDemo:c.holdingsHow} ${c.hoverWeight}`));
  if(confirm.length)portfolio.append(confirmBox(c,confirm));
  // Finished weeks and pieces I sold appear once there is something to show; week one alone repeats the hero.
  if(history.weeks.length)portfolio.append(weekTable(c,history));
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
 function weekTable(c,history){
  const box=n('section','ws-weeks'),table=n('table','ws-ptable'),head=n('tr','');for(const k of ['week','pieces','amount'])head.append(n('th','',c.weekCols[k]));const thead=n('thead','');thead.append(head);table.append(thead);const body=n('tbody','');
  for(const w of [...history.weeks].reverse()){const tr=n('tr','');tr.append(n('td','',c.weekName(w.week)),n('td','',w.unknown?c.weekUnknown:String(w.pieces)),n('td','ws-pmine',w.amount===null?(w.loaded?c.weekUnknown:c.weekReading):`${U.shn({lo:w.amount,hi:w.amount})} SHNAKAS`));body.append(tr);}
  table.append(body);box.append(n('h3','',c.weeksTitle),table,n('p','ws-pnote',c.weeksNote));return box;
 }
 /** Pieces that left: one row per run of mine that ended (a sale, or a private move the wallet page showed), with the
  * weeks it kept and their official total; put back (it was not mine to lose) or forget. */
 function leftList(c,history){
  const box=n('section','ws-left');box.id='left';box.append(n('h3','',c.leftTitle(history.left.length)));
  for(const x of history.left){const row=n('div','ws-left-row'),run=x.run;row.append(image(x.id,'left'));const text=n('div','');
   const how=Number.isSafeInteger(run.listedAt)?c.leftSold(I.int(run.listedAt),A.listedWhen(run.listedAt,lang==='zh'),I.int(run.soldAt)):c.leftWallet;
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
  entries.forEach((e,index)=>{const th=n('th'),item=n('div','ws-item'),text=n('div');if(e)item.append(image(e.id,'compare'));text.append(n('strong','',e?`#${e.number}`:c.missing));if(e){const link=n('a','ws-item-link',c.colMarket);link.href=U.marketFind(snap,e.id);link.target='_blank';link.rel='noopener noreferrer';text.append(n('small','',c[e.listing]),link);const rank=P.numberBadge(e.number,t);if(rank)text.append(rank);}const remove=n('button','ws-remove','×');remove.title=c.remove;remove.setAttribute('aria-label',`${c.remove} ${e?'#'+e.number:''}`);remove.addEventListener('click',()=>change(ids[index]));item.append(text,remove);th.append(item);tr.append(th);});head.append(tr);table.append(head);const body=n('tbody');table.append(body);
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

 // ---------------------------------------------------------------- Snapshot listings; which ones raise my weekly SHNAKAS is Raise weight's Best buy.
 function catalog(){
  const c=C(),entries=E.candidates(snap,model,minimum);
  $('catalogCount').textContent=String(entries.length);$('browseNote').textContent=c.browseNote;
  $('catalog').replaceChildren(...entries.slice(0,showAll?entries.length:12).map(e=>{
   const picked=ids.includes(e.id),card=n('article',picked?'ws-candidate is-selected':'ws-candidate'),info=n('div');
   // Now: number, ask and the listing's relay credits. After sale: the weight it would have and what it adds for me.
   const now=n('div','ws-card-now');now.append(n('span','ws-ask',I.btc(e.sale.price)+' BTC'));
   const after=n('div','ws-card-after');after.append(n('small','',c.after),total(e.result));
   info.append(n('strong','',`#${e.number}`),now,after);
   const buy=n('a','ws-buy',c.buyNow);buy.title=c.buyHint;buy.href=U.marketFind(snap,e.id);buy.target='_blank';buy.rel='noopener noreferrer';
   const credits=P.relayCredits(snap,e.id);if(credits!==null){const label=n('small','ws-credits',`${T().relayCredits} ${credits}`);label.title=T().relayCreditsMeaning;now.append(label);}
   if(holdings.length&&!holdings.includes(e.id)){
    const impact=H.impact(snap,holdings,e.id,'sale',model);
    if(impact.state==='ready'){const d=impact.allocation.delta,gain=n('small','ws-impact',c.forMeShort(U.shn(d,true)));gain.dataset.change=trend(d);after.append(gain);
     card.tabIndex=0;hoverCard(card,()=>impactCard(impact,e.id,`${c.buyLead(e.number)} · ${I.btc(e.sale.price)} BTC`,null),320);}
   }
   const b=n('button','',picked?'✓':'+');b.setAttribute('aria-label',`${picked?c.remove:c.add} #${e.number}`);b.setAttribute('aria-pressed',String(picked));b.title=picked?c.removeHint:ids.length===E.MAX?c.fullHere:c.addHint;b.disabled=!picked&&ids.length===E.MAX;b.addEventListener('click',()=>change(e.id));
   const actions=n('div','ws-card-actions');actions.append(b,buy);card.append(image(e.id,'listing'),info,actions);return card;
  }));
  $('catalogFull').hidden=ids.length<E.MAX;$('catalogFull').textContent=c.fullHere;$('more').hidden=showAll||entries.length<=12;$('more').textContent=c.showAll;
 }

 // ---------------------------------------------------------------- About: read-only promise, allocation arithmetic, rules and data, folded.
 function about(){
  const c=C(),open=new Set([...$('aboutItems').querySelectorAll('details[open]')].map(d=>d.dataset.key)),parts=U.about(c,R,version);
  const item=(key,title,body)=>{const d=n('details','ws-about-item');d.dataset.key=key;d.open=open.has(key);const content=n('div','ws-about-body');content.append(...body);d.append(n('summary','',title),content);return d;};
  $('aboutItems').replaceChildren(item('safe',c.aboutSafe,parts.safe),item('cases',c.aboutCases,parts.cases),item('alloc',c.aboutAlloc,parts.alloc),item('rules',c.aboutRules,parts.rules),item('data',c.aboutData,parts.data));
 }

 function render(){hideFloat();const c=C(),t=T();document.documentElement.lang=lang==='zh'?'zh-CN':'en';document.title=`Naka Sigil · ${c.page}`;for(const b of document.querySelectorAll('[data-lang]'))b.setAttribute('aria-pressed',String(b.dataset.lang===lang));
  for(const [id,key]of Object.entries({heading:'heading',intro:'intro',clear:'clear',browseTitle:'browse',filterLabel:'filter',browseNote:'browseNote',compareTitle:'compare',compareAddLabel:'addCompareTitle',aboutTitle:'aboutTitle'}))$(id).textContent=c[key];
  $('version').textContent=version?`v${version}`:'';$('version').hidden=!version;
  // The previous worker still runs (files replaced, extension not reloaded): one card in place of the page's sections.
  document.body.classList.toggle('is-stale',workerCurrent===false);$('updateCard').hidden=workerCurrent!==false;
  $('updateTitle').textContent=t.updateTitle;$('updateText').replaceChildren(n('span','',t.updateText(S.BUILD)),n('span','',t.updateKeep));$('updateReload').textContent=t.updateReload;$('updateHint').textContent=t.updateHint;
  const height=n('span','ws-block-number');height.append(n('span','ws-height-text',I.int(snap.snapshot.height)),NakaPixel.digits(I.int(snap.snapshot.height),'ws-block-digits'));$('block').replaceChildren(n('span','ws-block-label',t.snapBlock('')),height);$('block').setAttribute('aria-label',t.snapBlock(I.int(snap.snapshot.height)));$('age').textContent=I.blockAgeShort(t,snap.snapshot);$('age').title=I.blockTimeTitle(t,snap.snapshot);$('source').title=[...P.renderLaunch(snap.snapshot,t,I).children].map(e=>e.textContent).join('\n');$('source').textContent=demo?c.local:source==='live'?t.modeLive:t.srcBundled;
  $('pips').replaceChildren(...Array.from({length:E.MAX},(_,i)=>n('i',i<ids.length?'is-on':'')));
  $('scrollHint').textContent=c.scroll;$('legend').textContent=c.legend;$('demoNote').hidden=!demo;$('demoNote').textContent=demo?c.bundledNote:'';$('selectionCount').textContent=c.count(ids.length);$('clear').disabled=!ids.length;$('compareAdd').disabled=ids.length===E.MAX;$('compareAdd').title=ids.length===E.MAX?c.fullHere:c.addHint;$('status').textContent=message;$('assumption').textContent=c.independent;const phase=R.rewardPhase(snap.snapshot);$('limits').textContent=c.limits+' '+(['before','boundary'].includes(phase.state)?t.phaseNotStarted:phase.state==='active'?(phase.week===R.RULES.weeks?t.noFutureWeekNote:t.buyEligibilityNote):phase.state==='closed'?t.rewardClosed:t.phaseEnded)+(ids.some(id=>E.entry(snap,model,id)?.result?.unmeasured)?' '+c.unknownNote:'');$('filter').options[0].textContent=c.any;$('filter').title=c.filterNote;$('filter').value=String(minimum);
  $('market').textContent=c.market;$('market').href=`https://ord-dropz.xyz/secondary/collections/${snap.collection.slug}`;
  renderTabs();portfolioUI();planner.render();comparison();catalog();about();weightPopover.validate();
 }

 $('brand').append(NakaPixel.sigil(''),n('span','','Naka Sigil'));$('updateSigil').append(NakaPixel.sigil(''));
 $('clear').addEventListener('click',()=>change(null,true));$('filter').addEventListener('change',()=>{minimum=Number($('filter').value);showAll=false;catalog();});$('more').addEventListener('click',()=>{showAll=true;catalog();});
 document.querySelector('.ws-lang').addEventListener('click',ev=>{const b=ev.target.closest('[data-lang]');if(!b)return;if(demo){lang=b.dataset.lang;message='';persist();render();}else chrome.storage.local.set({[I.STORAGE_KEY]:b.dataset.lang});});
 // Where the popup or a link sends this page: a section, one Raise weight tab, or the simulator or the 400% plan for one
 // number. The page renders after its data loads, so it scrolls there itself.
 const hash=location.hash,wantSim=/^#sim-(\d+)$/.exec(hash),wantPlan=/^#plan-(\d+)$/.exec(hash),wantTab=/^#planner-(buy|plan|lock|sim)$/.exec(hash),wantSection=/^#(holdings|planner|compare|listings|left)$/.exec(hash);
 function arrive(){
  const byNumber=x=>Object.keys(snap.items).find(id=>snap.items[id][0]===Number(x));
  if(wantSim){const id=byNumber(wantSim[1]);if(id)planner.openSim(id);else $('planner').scrollIntoView();return;}
  if(wantPlan){const id=byNumber(wantPlan[1]);if(id)planner.openPlan(id).then(()=>$('planner').scrollIntoView());else $('planner').scrollIntoView();return;}
  if(wantTab){planner.openTab(wantTab[1]);$('planner').scrollIntoView();return;}
  // Left is the end of My holdings and exists only while some piece has left: without it the page opens at My holdings.
  if(wantSection)(wantSection[1]==='left'&&!$('left')?$('holdings'):$(wantSection[1])).scrollIntoView();}
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
  const KEYS=[S.KEYS.live,S.KEYS.closing,I.STORAGE_KEY,E.KEY,H.KEY,A.KEY,A.STATUS,A.OBSERVED,A.WEEKS,H.LEFT,H.EVENTS,H.META];
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
