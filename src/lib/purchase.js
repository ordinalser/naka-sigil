/** Single-listing sale scenario. Offline, height-bound, no price/market forecast or payout model. */
(function(root,factory) {
  const api=factory(typeof module==='object' && module.exports ? require('./rules.js') : root.ShnakasRules,root);
  if(typeof module==='object' && module.exports) module.exports=api;
  else root.NakaPurchase=api;
})(typeof globalThis!=='undefined' ? globalThis : this,function(R,root) {
  'use strict';
  function premium(price,floor) {
    const tenths=((BigInt(price)-BigInt(floor))*1000n+BigInt(floor)/2n)/BigInt(floor);
    return `${tenths/10n}.${tenths%10n}%`;
  }
  /** Only a complete per-item listing snapshot can establish absence of a listing. */
  function listingStatus(snap,id) {
    if(!Object.hasOwn(snap.items,id) || !Array.isArray(snap.offers))return 'unknown';
    return snap.offers.some(([other])=>other===id)?'listed':'unlisted';
  }
  function create(snap) {
    if(!Array.isArray(snap.offers)) return {snapshot:snap.snapshot,get:()=>({state:'unavailable'})};
    const offers=new Map(snap.offers), cache=new Map();
    function get(id) {
      if(cache.has(id)) return cache.get(id);
      if(!offers.has(id)) return {state:'unlisted'};
      const price=offers.get(id), remaining=snap.offers.filter(([other])=>other!==id);
      const common={price,premium:premium(price,snap.snapshot.collectionFloor),beforeFloor:snap.snapshot.collectionFloor,remaining:remaining.length};
      if(!remaining.length) {const r={state:'no-floor',...common};cache.set(id,r);return r;}
      let floor=Infinity;const floors=new Map();
      for(const [other,p] of remaining) {
        floor=Math.min(floor,p);
        for(const idx of snap.items[other].slice(1)) {const t=floors.get(idx);floors.set(idx,{floor:Math.min(t?.floor??Infinity,p),listed:(t?.listed||0)+1});}
      }
      const [number,...indexes]=snap.items[id];
      const traits=R.snapshotTraits(snap,indexes).map((t,i)=>{const f=floors.get(indexes[i]);return {...t,floor:f?.floor??null,listed:f?.listed??0,lastSale:price};});
      const result=R.evaluate({number,traits},floor);
      const before=R.evaluateSnapshot(snap,id);
      const r={state:'ready',...common,afterFloor:floor,result,before};
      cache.set(id,r);return r;
    }
    return {snapshot:snap.snapshot,get};
  }
  const node=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  function renderLaunch(snapshot,T,I,compact=false) {
    const launch=R.launchStatus(snapshot),box=node('aside',`naka-launch${compact?' naka-launch--compact':''}`);
    box.dataset.state=launch.state;box.dataset.basis=String(snapshot.height);box.title=T.launchMethod;
    const utc=launch.eta===null?null:new Date(launch.eta).toISOString().slice(0,10);
    if(compact)box.append(node('span','',utc?T.launchCompact(I.int(launch.height),utc.slice(0,10)):T.launchTitle(I.int(launch.height))+' · '+(launch.state==='reached'?T.launchReached:T.launchUnknown)));
    else box.append(node('strong','',T.launchTitle(I.int(launch.height))),node('p','',launch.state==='reached'?T.launchReached:T.launchBefore(I.int(launch.remaining),utc?T.launchEta(utc):T.launchUnknown,I.int(snapshot.height))),node('small','',T.launchMethod));
    return box;
  }
  function numberTag(number) {
    const tier=R.numberTier(number);
    return tier.label ? {key:`n${tier.pct}`,label:tier.label.replace(/\s/g,''),pct:tier.pct} : null;
  }
  function numberBadge(number,T) {
    const tag=numberTag(number);if(!tag)return null;
    const badge=node('span',`naka-number-badge naka-number-badge--${tag.key}`);
    badge.append(node('span','naka-number-badge__prefix','Sub'),node('b','naka-number-badge__value',tag.label.slice(3)));
    badge.title=T.numberBadge(tag.label,tag.pct);badge.setAttribute('aria-label',badge.title);return badge;
  }
  function tierApi() {return typeof module==='object' && module.exports ? require('./tier.js') : root.ShnakasTier;}
  function decorateWeight(n,r,bitmap=false) {
    const tier=tierApi(),pixel=root.NakaPixel;
    n.classList.add('naka-weight');n.dataset.tier=tier.boundTier(r.lo);n.dataset.hiTier=tier.boundTier(r.hi);
    n.replaceChildren();
    if(bitmap)n.append(node('span','naka-sr-only',R.formatWeight(r)));
    const part=(text,bound)=>{
      const span=node('span',`naka-weight__part naka-tone-${tier.boundTier(bound)}`,bitmap?undefined:text);
      if(bitmap){const svg=pixel.digits(text,'naka-weight__pixels');svg.setAttribute('width',pixel.digitsPath(text).width*3);svg.setAttribute('height','20');span.style.width=`${pixel.digitsPath(text).width*3}px`;span.append(svg);}n.append(span);
    };
    if(r.exact)part(`${r.lo.weight}%`,r.lo);
    else {
      part(String(r.lo.weight),r.lo);
      const dash=node('span','naka-weight__dash',bitmap?undefined:'–');
      if(bitmap)dash.append(node('span','naka-weight__rule'));n.append(dash);
      part(`${r.hi.weight}%`,r.hi);
    }
    return n;
  }
  /** Changes are exact input comparisons, including floor/listing changes below a bonus threshold. */
  function traitChange(a,b,beforeFloor,afterFloor) {
    if(a.measured!==b.measured)return b.measured?'known':'unknown';
    if(a.measured && a.pct!==b.pct)return b.pct>a.pct?'up':'down';
    if(a.method!==b.method)return 'market';
    if(a.floor!==b.floor)return 'market';
    const ap=a.basisPrice??a.floor,bp=b.basisPrice??b.floor;
    if(ap!==null && bp!==null && a.measured && BigInt(ap)*BigInt(afterFloor)!==BigInt(bp)*BigInt(beforeFloor))return 'market';
    return null;
  }
  const SYMBOL={up:'↑',down:'↓',market:'◆',unknown:'?',known:'◆'};
  function inspection(before,after,snapshot,T,I,options={}) {
    const paired=Boolean(after),box=node('section',`naka-purchase${paired?'':' naka-current'}`);
    box.dataset.state=paired?'ready':'current';box.dataset.metric='total-holding-weight';
    const listing=paired?'listed':(options.listing??'unknown'),status=T.listing[listing];
    box.dataset.listing=listing;
    const basis=node('p','naka-purchase__basis',T.snapBlock(I.blockBasis(T,snapshot)));
    basis.title=I.blockTimeTitle(T,snapshot);box.append(basis);
    const state=node('p','naka-listing');state.dataset.listing=listing;
    state.append(node('strong','naka-listing__badge',status.label),node('span','naka-listing__meaning',status.meaning));box.append(state);
    if(paired)box.append(node('p','naka-purchase__assumption',T.buyAssumptionShort));
    const table=node('table','naka-compare');table.setAttribute('aria-label',paired?T.buyTitle:T.weight);
    const cols=node('colgroup','');cols.append(node('col','naka-compare__label-col'),node('col','naka-compare__value-col'));
    const thead=node('thead',''),head=node('tr','');head.append(node('td','naka-compare__formula',T.formulaTitle));
    for(const title of [paired?T.buyAfter:T.formulaColumn]){const th=node('th','',title);th.scope='col';head.append(th);}thead.append(head);
    const body=node('tbody','');table.append(cols,thead,body);
    const row=(label,a,b,cls='')=>{
      const tr=node('tr',cls),th=node('th','',label);th.scope='row';
      tr.append(th,node('td',paired?'naka-compare__after':'naka-compare__before',paired?b:a));body.append(tr);return tr;
    };
    const total=row(T.totalWeight,undefined,undefined,'naka-compare__total');
    decorateWeight(total.children[1],after??before,true);total.children[1].dataset.caption=paired?T.buyAfter:T.formulaColumn;
    if(paired){const reference=node('small','naka-compare__reference');reference.append(node('span','',T.formulaBefore+' '),decorateWeight(node('span','naka-compare__original'),before));total.children[0].append(reference);}
    const pct=t=>t.measured?`+${t.pct}%`:`+0–${R.MAX_TRAIT_PCT}%`,changes=new Set();
    for(let i=0;i<before.traits.length;i++) {
      const a=before.traits[i],b=paired?after.traits[i]:a;
      const tr=row('',undefined,undefined,'naka-compare__calculation naka-compare__trait');
      tr.children[0].append(node('small','naka-compare__type',a.type==='Hair And Headwear'?T.headwear:a.type),node('span','naka-compare__name',a.value));
      const changed=paired?traitChange(a,b,options.beforeFloor,options.afterFloor):null;
      if(changed){tr.dataset.change=changed;changes.add(changed);}
      const ratio=(t,floor)=>t.method==='held'?T.heldTrait(t.supply):t.measured?`${t.method==='last-sale'?T.lastSaleShort+' ':''}${R.formatRatio(t.basisPrice??t.floor,floor)}`:T.saleUnknown;
      const basis=t=>t.method==='held'?T.heldRule:t.method==='last-sale'?T.lastSaleBasis(I.btc(t.basisPrice)):t.measured?T.floorOf(I.btc(t.floor),t.listed):T.saleUnknown;
      const cell=tr.children[1],value=node('span','naka-compare__value');
      const oldRatio=ratio(a,options.beforeFloor??snapshot.collectionFloor),newRatio=ratio(b,options.afterFloor??snapshot.collectionFloor);
      // Only changed inputs need a baseline. The primary value always belongs to the displayed scenario.
      if(changed && pct(a)!==pct(b))value.append(node('span','naka-compare__old',pct(a)),node('span','naka-compare__arrow',' → '));
      value.append(node('b','naka-compare__pct',pct(b)));cell.append(value);
      if(changed){const mark=node('span',`naka-change naka-change--${changed}`,SYMBOL[changed]);mark.setAttribute('aria-label',T.change[changed]);cell.append(mark);}
      const ratios=node('small','naka-compare__ratio');
      if(changed && oldRatio!==newRatio)ratios.append(node('span','naka-compare__old',oldRatio),node('span','naka-compare__arrow',' → '));
      ratios.append(node('span','',newRatio));cell.append(ratios);
      cell.title=changed?`${T.formulaBefore}: ${pct(a)} · ${basis(a)}\n${T.buyAfter}: ${pct(b)} · ${basis(b)}`:basis(b);
    }
    if(before.number.pct)row(`${T.number} ${before.number.value}`,`+${before.number.pct}%`,`+${before.number.pct}%`,'naka-compare__calculation');
    const floor=row(T.collectionFloorBTC,I.btc(options.beforeFloor??snapshot.collectionFloor),I.btc(options.afterFloor??snapshot.collectionFloor),'naka-compare__floor');
    if(paired && options.beforeFloor!==options.afterFloor){floor.dataset.change='market';changes.add('market');floor.children[1].prepend(node('span','naka-compare__old',I.btc(options.beforeFloor)),node('span','naka-compare__arrow',' → '));floor.children[1].append(node('span','naka-change naka-change--market','◆'));}
    box.append(table);
    if(changes.size)table.title=T.changedRows;
    box.append(node('p','naka-purchase__formula',`${T.buyRatioNote} · ${T.base} ${R.RULES.basePct}% · ${T.capShort} ${R.RULES.capPct}%`));
    const caution=node('div','naka-purchase__caution');
    caution.append(node('p','naka-purchase__provisional',T.inspectProvisional));
    if(before.unmeasured || after?.unmeasured)caution.append(node('p','naka-purchase__note naka-purchase__range-note',T.buyRangeNote));
    caution.append(node('p','naka-purchase__eligibility',status.note));
    if(options.activity)caution.append(node('p','naka-purchase__activity',T.activityShort));
    if(options.notice)caution.append(node('p','naka-purchase__note',options.notice));
    box.append(caution);
    return box;
  }
  function renderCurrent(result,snapshot,T,I,options={}) {return inspection(result,null,snapshot,T,I,options);}
  function render(model,id,T,I) {
    const scenario=model.get(id);if(scenario.state!=='ready')return null;
    const box=inspection(scenario.before,scenario.result,model.snapshot,T,I,scenario);box.dataset.id=id;return box;
  }
  return {create,premium,listingStatus,renderLaunch,render,renderCurrent,numberTag,numberBadge,decorateWeight,traitChange};
});
