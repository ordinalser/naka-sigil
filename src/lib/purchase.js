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
  /** Credits belong to the selected active listing, not immutable NFT metadata. */
  function relayCredits(snap,id) { if(!snap.offers?.some(([other])=>other===id))return null;const value=snap.credits?.find(([other])=>other===id)?.[1];return Number.isSafeInteger(value)&&value>=0?value:null; }
  // Units of every catalog row at the snapshot itself, shared by all scenarios of that snapshot.
  const unitCache=new WeakMap();
  function currentUnits(snap){
    if(unitCache.has(snap))return unitCache.get(snap);
    const rows=[...Object.entries(snap.items),...(snap.pending??[]).map((row,i)=>['pending:'+i,row])];
    const units=new Map(rows.map(([key,row])=>[key,R.units(R.evaluate({number:row[0],traits:R.snapshotTraits(snap,row.slice(1))},snap.snapshot.collectionFloor))]));
    const value={rows,units};unitCache.set(snap,value);return value;
  }
  function create(snap,{action='sale'}={}) {
    if(!['sale','cancel'].includes(action))throw new Error('Unknown listing-removal action');
    if(!Array.isArray(snap.offers)) return {snapshot:snap.snapshot,get:()=>({state:'unavailable'})};
    const offers=new Map(snap.offers), cache=new Map();
    function get(id) {
      if(cache.has(id)) return cache.get(id);
      if(!offers.has(id)) return {state:'unlisted'};
      const price=offers.get(id), remaining=snap.offers.filter(([other])=>other!==id);
      const common={action,rewardContext:R.rewardContext(snap,id,'listed'),price,premium:premium(price,snap.snapshot.collectionFloor),beforeFloor:snap.snapshot.collectionFloor,remaining:remaining.length,credits:relayCredits(snap,id)};
      if(!remaining.length) {const r={state:'no-floor',...common};cache.set(id,r);return r;}
      let floor=Infinity;const floors=new Map();
      for(const [other,p] of remaining) {
        floor=Math.min(floor,p);
        for(const idx of snap.items[other].slice(1)) {const t=floors.get(idx);floors.set(idx,{floor:Math.min(t?.floor??Infinity,p),listed:(t?.listed||0)+1});}
      }
      // Re-evaluate each affected holding against the SAME removal scenario, including
      // a changed collection denominator. Preserve official rare units only when all
      // their inputs (floor and sale history) are unchanged.
      const evaluated=new Map(),removedIndexes=new Set(snap.items[id].slice(1));
      // A sale is the newest sale of each removed trait; a cancellation is not a trade.
      function evaluateRow([number,...indexes]) {
        const traits=R.snapshotTraits(snap,indexes).map((t,i)=>{
          const f=floors.get(indexes[i]),changed=removedIndexes.has(indexes[i]);
          const preserve=floor===snap.snapshot.collectionFloor && (!changed || (action==='cancel' && t.floor===null));
          const carryUnknown=t.supply<R.RULES.heldSupply&&(f?.floor??null)===null&&t.saleHistory?.length===0&&((action==='cancel'&&changed&&t.floor!==null&&R.traitTier(t.floor,snap.snapshot.collectionFloor).pct>0)||(!preserve&&t.officialSource==='lastBlock'&&t.officialPct>0));
          return {...t,carryUnknown,floor:f?.floor??null,listed:f?.listed??0,...(action==='sale'&&changed?{pendingSale:price}:{}),
            ...(!preserve?{officialPct:undefined,officialSource:undefined}:{})};
        });
        return R.evaluate({number,traits},floor);
      }
      function evaluate(other) {
        if(evaluated.has(other))return evaluated.get(other);
        if(!Object.hasOwn(snap.items,other))return null;
        const result=evaluateRow(snap.items[other]);evaluated.set(other,result);return result;
      }
      // Programme units after this action. With an unchanged collection floor only rows sharing a removed trait can
      // change; otherwise every catalog row (minted and pending) is re-evaluated.
      let unitsAfter=null;
      function programmeUnits() {
        if(unitsAfter)return unitsAfter;
        const total={...R.programmeUnits(snap)},current=currentUnits(snap);
        // A removed trait matters only when its floor changes (including to zero listings); otherwise rows keep
        // the same floor-tier result.
        const moved=new Set([...removedIndexes].filter(idx=>(floors.get(idx)?.floor??null)!==snap.traits[idx][2]));
        const affected=floor===snap.snapshot.collectionFloor?current.rows.filter(([,row])=>row.slice(1).some(idx=>moved.has(idx))):current.rows;
        for(const [key,row] of affected){
          const before=current.units.get(key);
          const after=R.units(key.startsWith('pending:')?evaluateRow(row):evaluate(key));
          total.lo+=after.lo-before.lo;total.hi+=after.hi-before.hi;
        }
        unitsAfter=total;return total;
      }
      const result=evaluate(id),before=R.evaluateSnapshot(snap,id);
      const r={state:'ready',...common,afterFloor:floor,result,before};
      Object.defineProperty(r,'evaluate',{value:evaluate});Object.defineProperty(r,'evaluateRow',{value:evaluateRow});Object.defineProperty(r,'programmeUnits',{value:programmeUnits});
      cache.set(id,r);return r;
    }
    return {snapshot:snap.snapshot,get};
  }
  const node=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  function renderLaunch(snapshot,T,I) {
    const phase=R.rewardPhase(snapshot),box=node('aside','naka-launch');
    box.dataset.state=phase.state;box.dataset.basis=String(snapshot.height);box.title=T.launchMethod;
    const date=phase.eta===null?T.launchUnknown:T.launchEta(new Date(phase.eta).toISOString().slice(0,16).replace('T',' '));
    const title=phase.state==='before'?T.launchTitle(I.int(phase.start)):phase.state==='boundary'?T.rewardBoundary:phase.state==='active'?T.rewardWeek(phase.week,R.RULES.weeks):phase.state==='closed'?T.rewardClosed:T.rewardEnded;
    const line=phase.state==='before'?T.launchBefore(I.int(phase.remaining),date,I.int(snapshot.height)):phase.state==='boundary'?T.phaseBoundary:phase.state==='active'?`${T.weekRange(I.int(phase.first),I.int(phase.last))} · ${T.nextBoundary(I.int(phase.next))} · ${date}`:T.finalBoundary(I.int(phase.end+1));
    box.append(node('strong','',title),node('p','',line),node('small','',phase.state==='closed'?T.rewardClosedNote:phase.state==='ended'?T.rewardEndNote(I.int(phase.claimUntil)):T.launchMethod));
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
  const SYMBOL={up:'↑',down:'↓',market:'◆',unknown:'↔',known:'◆'};
  function inspection(before,after,snapshot,T,I,options={}) {
    const paired=Boolean(after),beforeLabel=options.action==='cancel'?T.cancelBefore:T.formulaBefore,afterLabel=options.action==='cancel'?T.cancelAfter:T.buyAfter,box=node('section',`naka-purchase${paired?'':' naka-current'}`);
    box.dataset.action=options.action??'sale';box.dataset.state=paired?'ready':'current';box.dataset.metric='total-holding-weight';
    const listing=paired?'listed':(options.listing??'unknown'),status=T.listing[listing];
    box.dataset.listing=listing;
    const basis=node('p','naka-purchase__basis',T.snapBlock(I.blockBasis(T,snapshot)));
    basis.title=I.blockTimeTitle(T,snapshot);box.append(basis);
    const state=node('p','naka-listing');state.dataset.listing=listing;
    const context=options.rewardContext??R.rewardContext({snapshot},'',listing);
    const meaning=context.state==='not-started'?(context.phase.state==='boundary'?T.phaseBoundary:T.phaseNotStarted):context.state==='ended'?(context.phase.state==='closed'?T.rewardClosed:T.phaseEnded):context.state==='waiting'?T.weekWaiting:context.state==='no-future-week'?T.noFutureWeek:status.meaning;
    state.append(node('strong','naka-listing__badge',status.label),node('span','naka-listing__meaning',meaning));
    if(context.phase.state==='active')state.title=T.weekContext(context.phase.week,I.int(context.phase.first),I.int(context.phase.last));box.append(state);

    if(paired)box.append(node('p','naka-purchase__assumption',options.action==='cancel'?T.cancelAssumption:T.buyAssumptionShort));
    const table=node('table','naka-compare');table.setAttribute('aria-label',paired?(options.action==='cancel'?T.cancelTitle:T.buyTitle):T.weight);
    const cols=node('colgroup','');cols.append(node('col','naka-compare__label-col'),node('col','naka-compare__value-col'));
    const thead=node('thead',''),head=node('tr','');head.append(node('td','naka-compare__formula',T.formulaTitle));
    for(const title of [paired?afterLabel:T.formulaColumn]){const th=node('th','',title);th.scope='col';head.append(th);}thead.append(head);
    const body=node('tbody','');table.append(cols,thead,body);
    const row=(label,a,b,cls='')=>{
      const tr=node('tr',cls),th=node('th','',label);th.scope='row';
      tr.append(th,node('td',paired?'naka-compare__after':'naka-compare__before',paired?b:a));body.append(tr);return tr;
    };
    const total=row(T.totalWeight,undefined,undefined,'naka-compare__total');
    decorateWeight(total.children[1],after??before,true);total.children[1].dataset.caption=paired?afterLabel:T.formulaColumn;
    if(paired){const reference=node('small','naka-compare__reference');reference.append(node('span','',beforeLabel+' '),decorateWeight(node('span','naka-compare__original'),before));total.children[0].append(reference);}
    const pct=t=>t.measured?`+${t.pct}%`:`+0–${R.MAX_TRAIT_PCT}%`,changes=new Set();
    for(let i=0;i<before.traits.length;i++) {
      const a=before.traits[i],b=paired?after.traits[i]:a;
      const tr=row('',undefined,undefined,'naka-compare__calculation naka-compare__trait');
      tr.children[0].append(node('small','naka-compare__type',a.type==='Hair And Headwear'?T.headwear:a.type),node('span','naka-compare__name',a.value));
      const changed=paired?traitChange(a,b,options.beforeFloor,options.afterFloor):null;
      if(changed){tr.dataset.change=changed;changes.add(changed);}
      const ratio=(t,floor)=>t.method==='official-sales'?T.officialSales:t.method==='official-none'?T.officialNoSales:t.method==='official-lastBlock'?T.officialLastBlock:t.method==='carry-unverified'?T.carryUnknown:t.method==='held'?T.heldTrait(t.supply):t.method==='sales-median'?`${T.salesMedianShort} ${R.formatRatio(t.basisPrice,floor)}`:t.method==='no-sales'?T.noSales:t.method==='sales-ambiguous'?T.salesTied:t.method==='floor'?R.formatRatio(t.floor,floor):T.saleUnknown;
      const basis=t=>t.method.startsWith('official-')?T.officialBasis:t.method==='held'?T.heldRule:t.method==='sales-median'?T.salesMedianBasis(I.btc(t.basisPrice)):t.method==='no-sales'?T.noSalesBasis:t.method==='sales-ambiguous'?T.salesTiedBasis:t.method==='floor'?T.floorOf(I.btc(t.floor),t.listed):T.saleUnknown;
      const cell=tr.children[1],value=node('span','naka-compare__value');
      const oldRatio=ratio(a,options.beforeFloor??snapshot.collectionFloor),newRatio=ratio(b,options.afterFloor??snapshot.collectionFloor);
      // Only changed inputs need a baseline. The primary value always belongs to the displayed scenario.
      if(changed && pct(a)!==pct(b))value.append(node('span','naka-compare__old',pct(a)),node('span','naka-compare__arrow',' → '));
      value.append(node('b','naka-compare__pct',pct(b)));cell.append(value);
      if(changed){const mark=node('span',`naka-change naka-change--${changed}`,SYMBOL[changed]);mark.setAttribute('aria-label',T.change[changed]);cell.append(mark);}
      const ratios=node('small','naka-compare__ratio');
      if(changed && oldRatio!==newRatio)ratios.append(node('span','naka-compare__old',oldRatio),node('span','naka-compare__arrow',' → '));
      ratios.append(node('span','',newRatio));cell.append(ratios);
      cell.title=changed?`${beforeLabel}: ${pct(a)} · ${basis(a)}\n${afterLabel}: ${pct(b)} · ${basis(b)}`:basis(b);
    }
    if(before.number.pct)row(`${T.number} ${before.number.value}`,`+${before.number.pct}%`,`+${before.number.pct}%`,'naka-compare__calculation');
    if(options.action!=='cancel' && options.credits!==null && options.credits!==undefined){const credit=row(T.relayCredits,String(options.credits),String(options.credits),'naka-compare__credits');credit.title=T.relayCreditsMeaning;}
    const floor=row(T.collectionFloorBTC,I.btc(options.beforeFloor??snapshot.collectionFloor),I.btc(options.afterFloor??snapshot.collectionFloor),'naka-compare__floor');
    if(paired && options.beforeFloor!==options.afterFloor){floor.dataset.change='market';changes.add('market');floor.children[1].prepend(node('span','naka-compare__old',I.btc(options.beforeFloor)),node('span','naka-compare__arrow',' → '));floor.children[1].append(node('span','naka-change naka-change--market','◆'));}
    box.append(table);
    if(changes.size)table.title=T.changedRows;
    box.append(node('p','naka-purchase__formula',`${T.buyRatioNote} · ${T.base} ${R.RULES.basePct}% · ${T.capShort} ${R.RULES.capPct}%`));
    const caution=node('div','naka-purchase__caution');
    caution.append(node('p','naka-purchase__provisional',T.inspectProvisional));
    if(before.unmeasured || after?.unmeasured)caution.append(node('p','naka-purchase__note naka-purchase__range-note',T.buyRangeNote));
    const note=context.state==='not-started'?T.beforeRewardNote(I.int(context.phase.start)):context.state==='ended'?(context.phase.state==='closed'?T.rewardClosedNote:T.rewardEndNote(I.int(context.phase.claimUntil))):context.state==='waiting'?T.weekWaitNote(context.phase.week,I.int(context.phase.first),I.int(context.phase.last),I.int(context.eligibleAt)):context.state==='no-future-week'||paired&&context.phase.week===R.RULES.weeks?T.noFutureWeekNote:paired?(options.action==='cancel'?T.cancelEligibilityNote:T.buyEligibilityNote):status.note;
    const eligibility=node('p','naka-purchase__eligibility',note);if(paired&&options.action!=='cancel')eligibility.title=T.pastRewardNote;caution.append(eligibility);
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
  return {relayCredits,create,premium,listingStatus,renderLaunch,render,renderCurrent,numberTag,numberBadge,decorateWeight,traitChange};
});
