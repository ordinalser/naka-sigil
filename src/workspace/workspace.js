/* Shared local demo and extension workspace. Formula engine is the extension's engine. */
(() => {
 'use strict';
 const R=ShnakasRules,P=NakaPurchase,E=NakaExplore,I=ShnakasI18n,S=ShnakasSource,B=SHNAKAS_SNAPSHOT;
 const demo=document.body.dataset.mode==='demo'||!globalThis.chrome?.storage?.local;
 const $=id=>document.getElementById(id),n=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
 let snap=B,model=P.create(B),lang='en',ids=demo?E.examples(B,model).slice(0,3):[],stored={},minimum=0,showAll=false,message='';
 const C=()=>NakaExploreUI.pick(lang),T=()=>I.pick(lang);
 let previewAnchor=null;
 const preview=n('div','ws-preview');preview.hidden=true;preview.setAttribute('role','tooltip');preview.id='imagePreview';document.body.append(preview);
 function hideImage(){preview.hidden=true;if(previewAnchor)previewAnchor.removeAttribute('aria-describedby');previewAnchor=null;}
 function showImage(button,id){
  hideImage();previewAnchor=button;button.setAttribute('aria-describedby','imagePreview');preview.replaceChildren(art(id),n('strong','',`Shielded #${snap.items[id][0]}`));preview.hidden=false;
  const rect=button.getBoundingClientRect(),size=Math.min(300,innerWidth-32,Math.max(80,innerHeight-64));preview.style.width=size+'px';
  const height=preview.getBoundingClientRect().height;
  let x=rect.right+12;if(x+size>innerWidth-16)x=rect.left-size-12;
  let y=rect.top;if(y+height>innerHeight-16)y=innerHeight-height-16;
  preview.style.left=Math.max(16,Math.min(x,innerWidth-size-16))+'px';preview.style.top=Math.max(16,y)+'px';
 }
 const art=id=>{const img=n('img');img.src=`https://ordinals.com/content/${id}`;img.alt=`Shielded #${snap.items[id][0]}`;img.loading='lazy';img.referrerPolicy='no-referrer';img.addEventListener('error',()=>{img.replaceWith(NakaPixel.sigil('ws-art-fallback'));});return img;};
 const image=id=>{const button=n('button','ws-image');button.type='button';button.dataset.artId=id;button.setAttribute('aria-label',C().preview(snap.items[id][0]));button.append(art(id));button.addEventListener('mouseenter',()=>showImage(button,id));button.addEventListener('mouseleave',hideImage);button.addEventListener('focus',()=>showImage(button,id));button.addEventListener('blur',hideImage);button.addEventListener('click',()=>showImage(button,id));return button;};
 document.addEventListener('keydown',ev=>{if(ev.key==='Escape')hideImage();});document.addEventListener('pointerdown',ev=>{if(!ev.target.closest('.ws-image'))hideImage();});addEventListener('resize',hideImage);addEventListener('scroll',()=>{if(previewAnchor&&previewAnchor.matches(':focus-visible')){const anchor=previewAnchor;showImage(anchor,anchor.dataset.artId);}else hideImage();},true);
 const itemLink=id=>{const a=n('a','ws-item-link',C().colMarket);a.href=`https://ord-dropz.xyz/secondary/item/${id}?collection=${snap.collection.slug}`;a.target='_blank';a.rel='noopener noreferrer';return a;};
 const total=(r,bitmap=false)=>r?P.decorateWeight(n('span'),r,bitmap):n('span','',C().unavailable);
 function adopt(){const pick=S.choose({manual:stored[S.KEYS.manual],live:stored[S.KEYS.live],liveEnabled:stored[S.KEYS.liveEnabled]},B);snap=pick.snap;model=P.create(snap);lang=I.resolveLang(stored[I.STORAGE_KEY]);ids=E.normalize(stored[E.KEY]);}
 async function change(id,clear=false){
  if(demo){const out=clear?{ids:[],state:'removed'}:E.toggle(ids,id,snap);ids=out.ids;message=out.state==='full'?C().fullHere:out.state==='missing'?C().missing:'';render();return;}
  try{const res=await chrome.runtime.sendMessage({type:'shn-compare',action:clear?'clear':'toggle',id});if(!res?.ok)throw Error('save');ids=res.ids;message=res.state==='full'?C().fullHere:res.state==='missing'?C().missing:'';render();}catch{message=C().addError;render();}
 }
 function comparison(){
  const c=C(),t=T(),box=$('comparison');box.replaceChildren();const entries=ids.map(id=>E.entry(snap,model,id));
  if(!ids.length){const empty=n('div','ws-blank');empty.append(n('strong','',c.empty),n('p','',c.emptyHint));const example=n('button','',c.load);example.addEventListener('click',async()=>{for(const id of E.examples(snap,model))await change(id);});empty.append(example);box.append(empty);return;}
  const table=n('table','ws-table');table.style.minWidth=`${Math.max(360,136+ids.length*235)}px`;table.setAttribute('aria-label',c.page);
  const head=n('thead'),tr=n('tr');tr.append(n('td','ws-label'));
  entries.forEach((e,index)=>{const th=n('th'),item=n('div','ws-item'),text=n('div');if(e)item.append(image(e.id));text.append(n('strong','',e?`#${e.number}`:c.missing));if(e){text.append(n('small','',c[e.listing]),itemLink(e.id));const rank=P.numberBadge(e.number,t);if(rank)text.append(rank);}const remove=n('button','ws-remove', '×');remove.title=c.remove;remove.setAttribute('aria-label',`${c.remove} ${e?'#'+e.number:''}`);remove.addEventListener('click',()=>change(ids[index]));item.append(text,remove);th.append(item);tr.append(th);});head.append(tr);table.append(head);const body=n('tbody');table.append(body);
  const row=(label,fn,cls='')=>{const tr=n('tr',cls);const th=n('th','ws-label',label);th.scope='row';tr.append(th);entries.forEach(e=>{const td=n('td');if(e)fn(td,e);else td.textContent='—';tr.append(td);});body.append(tr);};
  row(c.total,(td,e)=>{td.append(n('span','ws-caption',e.listing==='listed'?c.after:c.holding),total(e.result,true));if(e.sale.state==='no-floor')td.append(n('small','',c.noFloor));},'ws-total');
  row(c.ask,(td,e)=>{td.textContent=e.listing==='listed'?I.btc(e.sale.price):'—';td.title=c.askNote;},'ws-price');
  row(c.before,(td,e)=>td.append(e.listing==='listed'?total(e.before):n('span','','—')),'ws-before');
  const guide=n('tr','ws-trait-guide'),cell=n('th','',c.traitGuide);cell.colSpan=entries.length+1;guide.append(cell);body.append(guide);
  const types=[...new Set(entries.flatMap(e=>e?.before.traits.map(t=>t.type)??[]))];
  for(const type of types)row(type==='Hair And Headwear'?t.headwear:type,(td,e)=>{const a=e.before.traits.find(x=>x.type===type);if(!a){td.textContent='—';return;}if(e.sale.state==='no-floor'){td.append(n('span','ws-trait-name',a.value),n('span','ws-bonus','—'));return;}const b=e.sale.state==='ready'?e.result.traits.find(x=>x.type===type):a;td.append(n('span','ws-trait-name',a.value));const pct=x=>x.measured?`+${x.pct}%`:'+0–100%',value=n('span','ws-bonus');const changed=e.sale.state==='ready'?P.traitChange(a,b,e.sale.beforeFloor,e.sale.afterFloor):null;
   if(changed){td.classList.add('ws-changed');td.dataset.change=changed;td.title=t.changedRows;if(pct(a)!==pct(b))value.append(n('span','ws-old',pct(a)+' → '));}value.append(n('span','',pct(b)+(changed?(changed==='up'?' ↑':changed==='down'?' ↓':' ◆'):'')));td.append(value);
   const floor=e.sale.state==='ready'?e.sale.afterFloor:snap.snapshot.collectionFloor;const ratio=(v,f)=>v.method==='held'?t.heldTrait(v.supply):v.measured?R.formatRatio(v.basisPrice??v.floor,f):t.saleUnknown;const now=ratio(b,floor),old=ratio(a,e.sale.beforeFloor??floor);td.append(n('small','',changed&&old!==now?old+' → '+now:now));
  });
  if(entries.some(e=>e?.before.number.pct))row(c.number,(td,e)=>{td.textContent=`+${e.before.number.pct}%`;});
  box.append(table);
 }
 function catalog(){const c=C(),entries=E.candidates(snap,model,minimum);$('catalogCount').textContent=String(entries.length);$('catalog').replaceChildren(...entries.slice(0,showAll?entries.length:12).map(e=>{const picked=ids.includes(e.id),card=n('article',picked?'ws-candidate is-selected':'ws-candidate'),info=n('div');info.append(n('strong','',`#${e.number}`),n('span','ws-ask',I.btc(e.sale.price)+' BTC'),n('small','',c.after),total(e.result));const b=n('button','',picked?'✓':'+');b.setAttribute('aria-label',`${picked?c.remove:c.add} #${e.number}`);b.setAttribute('aria-pressed',String(picked));b.title=picked?c.removeHint:ids.length===E.MAX?c.fullHere:c.addHint;b.disabled=!picked&&ids.length===E.MAX;b.addEventListener('click',()=>change(e.id));card.append(image(e.id),info,b);return card;}));$('catalogFull').hidden=ids.length<E.MAX;$('catalogFull').textContent=c.fullHere;$('more').hidden=showAll||entries.length<=12;$('more').textContent=lang==='zh'?'显示全部':'Show all';}
 function render(){hideImage();const c=C(),t=T();document.documentElement.lang=lang==='zh'?'zh-CN':'en';document.title=`Naka Sigil · ${c.page}`;for(const b of document.querySelectorAll('[data-lang]'))b.setAttribute('aria-pressed',String(b.dataset.lang===lang));
  for(const [id,key]of Object.entries({heading:'heading',intro:'intro',lookupLabel:'lookup',add:'find',clear:'clear',browseTitle:'browse',filterLabel:'filter',browseNote:'browseNote',basisTitle:'basis',proof:'proof',version:'version',share:'share'}))$(id).textContent=c[key];
  $('mode').textContent=demo?c.demo:c.page;const height=n('span','ws-block-number');height.append(n('span','ws-height-text',I.int(snap.snapshot.height)),NakaPixel.digits(I.int(snap.snapshot.height),'ws-block-digits'));$('block').replaceChildren(n('span','ws-block-label',t.snapBlock('')),height);$('block').setAttribute('aria-label',t.snapBlock(I.int(snap.snapshot.height)));$('age').textContent=I.blockAge(t,snap.snapshot);$('age').title=I.blockTimeTitle(t,snap.snapshot);$('source').textContent=demo?c.local:S.resolveLive(stored[S.KEYS.liveEnabled])?t.modeLive:t.modeFixed;
  $('number').placeholder=c.placeholder;$('pips').replaceChildren(...Array.from({length:E.MAX},(_,i)=>n('i',i<ids.length?'is-on':'')));
  $('scrollHint').textContent=c.scroll;$('legend').textContent=c.legend;$('demoNote').hidden=!demo;$('demoNote').textContent=c.demoNote;$('selectionCount').textContent=c.count(ids.length);$('clear').disabled=!ids.length;$('status').textContent=message;$('assumption').textContent=c.independent;$('limits').textContent=c.limits+(ids.some(id=>E.entry(snap,model,id)?.result?.unmeasured)?' '+c.unknownNote:'');$('filter').options[0].textContent=c.any;$('filter').title=c.filterNote;
  $('market').textContent=c.market;$('market').href=`https://ord-dropz.xyz/secondary/collections/${snap.collection.slug}`;
  $('rules').textContent=c.rules;$('rules').href=R.RULES.source;$('supplement').textContent=lang==='zh'?'零挂单补充规则':'Zero-listing supplement';$('supplement').href=R.RULES.zeroListingSource;comparison();catalog();
 }
 $('brand').append(NakaPixel.sigil(''),n('span','','Naka Sigil'));
 $('lookupForm').addEventListener('submit',async ev=>{ev.preventDefault();const q=ShnakasLookup.query(snap,$('number').value);if(q.state!=='found'){message=q.state==='invalid'?C().invalid:C().missing;$('number').setAttribute('aria-invalid','true');render();return;}$('number').removeAttribute('aria-invalid');if(ids.includes(q.id)){message=C().already(q.number);render();return;}await change(q.id);});
 $('clear').addEventListener('click',()=>change(null,true));$('filter').addEventListener('change',()=>{minimum=Number($('filter').value);showAll=false;catalog();});$('more').addEventListener('click',()=>{showAll=true;catalog();});
 document.querySelector('.ws-lang').addEventListener('click',ev=>{const b=ev.target.closest('[data-lang]');if(!b)return;if(demo){lang=b.dataset.lang;message='';render();}else chrome.storage.local.set({[I.STORAGE_KEY]:b.dataset.lang});});
 if(demo)render();else{chrome.storage.local.get([S.KEYS.manual,S.KEYS.live,S.KEYS.liveEnabled,I.STORAGE_KEY,E.KEY]).then(got=>{stored=got;adopt();render();});chrome.storage.onChanged.addListener((changes,area)=>{if(area!=='local')return;let relevant=false;for(const key of [S.KEYS.manual,S.KEYS.live,S.KEYS.liveEnabled,I.STORAGE_KEY,E.KEY])if(Object.hasOwn(changes,key)){stored[key]=changes[key].newValue;relevant=true;}if(relevant){adopt();render();}});}
 function beat(){if(!demo&&document.visibilityState==='visible'&&chrome.runtime.id)chrome.runtime.sendMessage({type:'shn-visible'}).catch(()=>{});}
 if(!demo){beat();setInterval(beat,S.HEARTBEAT_MS);document.addEventListener('visibilitychange',beat);}
 setInterval(()=>{$('age').textContent=I.blockAge(T(),snap.snapshot);},15000);
})();
