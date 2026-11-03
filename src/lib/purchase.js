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
  function create(snap,{action='sale',priorSales=[]}={}) {
    if(!['sale','cancel'].includes(action))throw new Error('Unknown listing-removal action');
    if(!Array.isArray(priorSales)||priorSales.some(id=>typeof id!=='string'))throw new Error('priorSales must be listing ids');
    if(!Array.isArray(snap.offers)) return {snapshot:snap.snapshot,get:()=>({state:'unavailable'})};
    if(priorSales.some(id=>!snap.offers.some(([other])=>other===id)))throw new Error('priorSales must be active listing ids');
    const prior=new Set(priorSales);
    // The world of every scenario is the next block: the listings already closing (snap.closing) leave then whatever is
    // done — a bought one as a new sale of its traits, a reclaimed one as no trade — exactly as planner.scenario removes them.
    const offers=new Map(snap.offers), closing=new Map(snap.closing??[]), cache=new Map(), H=snap.snapshot.height, F=snap.snapshot.collectionFloor;
    function get(id) {
      if(cache.has(id)) return cache.get(id);
      if(!offers.has(id)) return {state:'unlisted'};
      if(closing.has(id)&&closing.get(id)!==action)return {state:'closing',closing:closing.get(id),price:offers.get(id)};
      const price=offers.get(id), remaining=snap.offers.filter(([other])=>other!==id&&!closing.has(other)&&!prior.has(other));
      const common={action,rewardContext:R.rewardContext(snap,id,'listed'),price,premium:premium(price,F),beforeFloor:F,remaining:remaining.length,credits:relayCredits(snap,id)};
      if(!remaining.length) {const r={state:'no-floor',...common};cache.set(id,r);return r;}
      let floor=Infinity;const floors=new Map();
      for(const [other,p] of remaining) {
        floor=Math.min(floor,p);
        for(const idx of snap.items[other].slice(1)) {const t=floors.get(idx);floors.set(idx,{floor:Math.min(t?.floor??Infinity,p),listed:(t?.listed||0)+1});}
      }
      // Every listing that leaves: this one by `action`, the other closing ones as they close. A bought listing is the
      // newest sale of each of its traits at the next block — this one as the hypothetical newest sale (pendingSale), a
      // closing one as a sale in the trait's history; a reclaimed one is no trade.
      const removed=new Map([...closing].filter(([other])=>other!==id));
      for(const pid of priorSales)if(pid!==id&&offers.has(pid))removed.set(pid,'sale');
      removed.set(id,action);
      const removedIndexes=new Set(),cancelled=new Set(),sales=new Map(),operated=new Set(snap.items[id].slice(1));
      for(const [other,how] of removed)for(const idx of snap.items[other].slice(1)){removedIndexes.add(idx);if(how==='cancel')cancelled.add(idx);else if(other!==id){if(!sales.has(idx))sales.set(idx,[]);sales.get(idx).push(offers.get(other));}}
      // Re-evaluate each affected holding against the SAME removal scenario, including a changed collection denominator.
      // Official rare units are preserved only while all their inputs (floor and sale history) are unchanged.
      const evaluated=new Map();
      function evaluateRow([number,...indexes]) {
        const traits=R.snapshotTraits(snap,indexes).map((t,i)=>{
          const idx=indexes[i],f=floors.get(idx),changed=removedIndexes.has(idx),preserve=floor===F&&!changed;
          const others=sales.get(idx),sold=action==='sale'&&operated.has(idx);
          const history=others&&t.saleHistory!==undefined?[...others.map(p=>[p,H+1]),...t.saleHistory]:t.saleHistory;
          // A small sale-less trait whose last ask goes with no sale to score it keeps an unverified carry (reclaimed from
          // a bonus tier, or officially carried), not 0%.
          const carryUnknown=t.supply<R.RULES.heldSupply&&(f?.floor??null)===null&&t.saleHistory?.length===0&&!others&&!sold&&((cancelled.has(idx)&&t.floor!==null&&R.traitTier(t.floor,F).pct>0)||(!preserve&&t.officialSource==='lastBlock'&&t.officialPct>0));
          const row={...t,floor:f?.floor??null,listed:f?.listed??0,...(history!==undefined?{saleHistory:history}:{}),...(carryUnknown?{carryUnknown:true}:{}),...(sold?{pendingSale:price}:{})};
          if(!preserve){delete row.officialPct;delete row.officialSource;}
          return row;
        });
        return R.evaluate({number,traits},floor);
      }
      function evaluate(other) {
        if(evaluated.has(other))return evaluated.get(other);
        if(!Object.hasOwn(snap.items,other))return null;
        const result=evaluateRow(snap.items[other]);evaluated.set(other,result);return result;
      }
      // Programme units after this action. With an unchanged collection floor only rows sharing a removed trait can
      // change; otherwise every catalog row (minted and pending) is re-evaluated. programmeUnits() bounds K after the
      // action; unitChange() bounds K after − K before row by row in one world (rules.weightChange), so unchanged rows
      // add exactly 0 even when their weight is a range.
      let unitsAfter=null,change=null;
      function programmeUnits() {
        if(unitsAfter)return unitsAfter;
        const total={...R.programmeUnits(snap)},current=currentUnits(snap),delta={lo:0,hi:0},same=floor===snap.snapshot.collectionFloor;
        // A removed trait matters only when its floor changes (including to zero listings); otherwise rows keep
        // the same floor-tier result.
        const moved=new Set([...removedIndexes].filter(idx=>(floors.get(idx)?.floor??null)!==snap.traits[idx][2]));
        const affected=same?current.rows.filter(([,row])=>row.slice(1).some(idx=>moved.has(idx))):current.rows;
        for(const [key,row] of affected){
          const before=current.units.get(key),result=key.startsWith('pending:')?evaluateRow(row):evaluate(key),after=R.units(result);
          total.lo+=after.lo-before.lo;total.hi+=after.hi-before.hi;
          const w=R.weightChange(key.startsWith('pending:')?R.evaluate({number:row[0],traits:R.snapshotTraits(snap,row.slice(1))},snap.snapshot.collectionFloor):R.evaluateSnapshot(snap,key),result,same);
          delta.lo+=w.lo/R.RULES.unitPct;delta.hi+=w.hi/R.RULES.unitPct;
        }
        unitsAfter=total;change=delta;return total;
      }
      function unitChange(){if(!change)programmeUnits();return change;}
      const result=evaluate(id),before=R.evaluateSnapshot(snap,id);
      const r={state:'ready',...common,afterFloor:floor,result,before};
      Object.defineProperty(r,'evaluate',{value:evaluate});Object.defineProperty(r,'evaluateRow',{value:evaluateRow});Object.defineProperty(r,'programmeUnits',{value:programmeUnits});Object.defineProperty(r,'unitChange',{value:unitChange});
      cache.set(id,r);return r;
    }
    return {snapshot:snap.snapshot,get,priorSales:[...prior],closing:[...closing]};
  }
  const node=(tag,cls,text)=>{const n=document.createElement(tag);n.className=cls;if(text!==undefined)n.textContent=text;return n;};
  function renderLaunch(snapshot,T,I) {
    const phase=R.rewardPhase(snapshot),box=node('aside','naka-launch');
    box.dataset.state=phase.state;box.dataset.basis=String(snapshot.height);box.title=T.launchMethod;
    const date=phase.eta===null?T.launchUnknown:T.launchDate(I.localTime(phase.eta)),last=phase.state==='active'&&phase.index+1>=R.RULES.weeks;
    const title=phase.state==='before'?T.launchTitle(I.int(phase.start+1)):phase.state==='boundary'?T.rewardBoundary:phase.state==='active'?T.rewardWeek(phase.week,R.RULES.weeks):phase.state==='closed'?T.rewardClosed:T.rewardEnded;
    const line=phase.state==='before'?T.launchBefore(I.int(phase.remaining),date,I.int(snapshot.height)):phase.state==='boundary'?T.phaseBoundary:phase.state==='active'?`${T.weekRange(I.int(phase.first),I.int(phase.last))} · ${last?T.lastRewardBlock(I.int(phase.end)):T.nextBoundary(I.int(phase.next))} · ${date}`:T.finalBoundary(I.int(phase.end+1));
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
  /** A trait's bonus as shown: exact, or the bounds of an unmeasured one (rules.evaluate sets pctLo–pctHi for every unmeasured method). */
  const traitPct=t=>t.measured?`+${t.pct}%`:`+${t.pctLo}–${t.pctHi}%`;
  /** A trait's price basis in short: its official source, the zero-listing rule, or its exact ratio to the collection
   * floor (rules.basisRatio: the trait floor, or the sales median / mean itself, never the rounded basis price). */
  function traitRatio(t,floor,T) {
    switch(t.method) {
      case 'official-sales':return T.officialSales;
      case 'official-none':return T.officialNoSales;
      case 'official-lastBlock':return T.officialLastBlock;
      case 'carry-unverified':return T.carryUnknown;
      case 'held':return T.heldTrait(t.supply);
      case 'sales-median':return `${T.salesMedianShort} ${R.basisRatio(t,floor)}`;
      case 'no-sales':return T.noSales;
      case 'sales-ambiguous':return T.salesTied;
      case 'floor':return R.basisRatio(t,floor);
      case 'missing-sale':return T.saleUnknown;
    }
    throw new Error(`Unknown trait method: ${t.method}`);
  }
  /** The piece's output at the shown weight: a full week and the rest of the programme. After a sale or reclaim it starts
   * the week after the transaction (NakaMining.forecast); held, from this week if it earns now. null when not knowable. */
  function heroRates(paired,options) {
    const M=root.NakaMining,A=root.NakaRewards,snap=options.snap,id=options.id;
    if(!M||!snap||!id||!snap.items?.[id])return null;
    if(paired){const f=M.forecast(snap,id,{action:options.action==='cancel'?'cancel':'sale',scenario:options.scenario,asIs:Boolean(options.closing)});return f.state==='ready'?{weekly:f.weekly,remaining:f.remaining,from:f.plan.index===null?null:f.plan.index+1}:null;}
    if(options.listing==='listed')return {weekly:null,remaining:null,from:null};
    // A holding's own status when the caller knows it; otherwise the public records' reading of this piece.
    let status=options.status??null;
    if(!status&&A){const r=A.reason(snap,id);status=r.kind==='held'?{status:'earning'}:r.kind==='before'?{status:'idle'}:Number.isSafeInteger(r.startsWeek)?{status:'waiting',startsWeek:r.startsWeek}:null;}
    if(!status)return null;
    const f=M.forecast(snap,id,{action:'hold',status});
    return f.state==='ready'?{weekly:f.weekly,remaining:f.remaining,from:f.plan.state==='waiting'&&f.plan.index!==null?f.plan.index+1:null}:null;
  }
  const shn=v=>v===null||v===undefined?'—':root.NakaExploreUI?root.NakaExploreUI.shn(v):String(v.lo);
  /** The block line of a details card: "Block 973,091" in front, its age after it; the pages refresh it as time passes. */
  function paintBasis(n,snapshot,T,I) {
    n.replaceChildren(node('b','naka-hero__height',T.snapBlock(I.int(snapshot.height))),node('span','naka-hero__age',I.blockAgeShort(T,snapshot)));
    n.title=I.blockTimeTitle(T,snapshot);return n;
  }
  /** Public sales of the piece, read when opened: price, block and the block's local time, newest first. One read per piece
   * and block, shared by every card that shows it (a card rebuilt while reading picks up the same answer). */
  const salesReads=new Map();
  // A sale's block opens that piece at that block: in place where a page offers the lookup (setLookup), otherwise on the
  // extension page, which opens the lookup for it.
  let lookupAt=null;
  function setLookup(fn){lookupAt=fn;}
  function openAt(number,height){if(lookupAt)lookupAt(number,height);else chrome.runtime.sendMessage({type:'shn-open-compare',lookup:{number,height}});}
  function readSales(id,height){
    const key=`${id}|${height}`;if(salesReads.has(key))return salesReads.get(key);
    const job=chrome.runtime.sendMessage({type:'shn-sales',id,height}).then(r=>{if(!r?.ok)throw Error(r?.error??'unavailable');return r.sales;});
    salesReads.set(key,job);job.catch(()=>salesReads.delete(key));while(salesReads.size>64)salesReads.delete(salesReads.keys().next().value);return job;
  }
  function salesBox(snapshot,id,number,T,I) {
    const box=node('details','naka-sales'),sum=node('summary','naka-sales__summary'),list=node('div','naka-sales__list');
    sum.append(node('span','',T.salesTitle),node('span','naka-sales__count',''));box.append(sum,list);let loaded=false;
    const load=()=>{loaded=true;list.replaceChildren(node('p','naka-sales__note',T.salesLoading));
      readSales(id,snapshot.height).then(({total,rows})=>{
        sum.lastChild.textContent=T.salesCount(I.int(total));
        if(!rows.length){list.replaceChildren(node('p','naka-sales__note',T.salesNone));return;}
        list.replaceChildren(...rows.map(x=>{const row=node('div','naka-sales__row'),at=node('button','naka-sales__at',T.salesAt(I.int(x.height)));at.type='button';at.title=T.salesAtHint;at.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();openAt(number,x.height);});row.append(node('b','',`${I.btc(x.price)} BTC`),at,node('span','naka-sales__time',x.time===null?'—':I.localTime(x.time*1000)));return row;}));
        if(total>rows.length)list.append(node('p','naka-sales__note',T.salesMore(I.int(total))));
      }).catch(()=>{loaded=false;const retry=node('button','naka-sales__retry',T.salesRetry);retry.type='button';retry.addEventListener('click',load);const p=node('p','naka-sales__note',T.salesFailed+' ');p.append(retry);list.replaceChildren(p);});};
    box.addEventListener('toggle',()=>{if(box.open&&!loaded)load();});
    return box;
  }
  function inspection(before,after,snapshot,T,I,options={}) {
    const paired=Boolean(after),afterLabel=options.action==='cancel'?T.cancelAfter:options.activity?T.activityAfter:T.buyAfter,box=node('section',`naka-purchase${paired?'':' naka-current'}`);
    box.dataset.action=options.action??'sale';box.dataset.state=paired?'ready':'current';box.dataset.metric='total-holding-weight';
    const listing=paired?'listed':(options.listing??'unknown'),status=T.listing[listing];
    box.dataset.listing=listing;
    // Hero: the artwork large on the left. On the right, one left-aligned column: the listing state in a word, the block every
    // figure here is computed at, then the weight under one caption that says which world it is (after a sale or reclaim,
    // the formula of a listing as it stands) and from which week it earns, and last the piece's output at that weight: per
    // week and remaining, side by side, label over figure as everywhere else.
    const hero=node('div','naka-hero'),side=node('div','naka-hero__side');
    if(options.snap&&options.id&&root.NakaExploreUI&&options.snap.items?.[options.id]){const art=node('div','naka-hero__art'),img=root.NakaExploreUI.art(options.snap,options.id,'naka-hero__img');img.classList.add('naka-hero__img');art.append(img);hero.append(art);}
    const state=node('p','naka-listing');state.dataset.listing=listing;
    // The eligibility line names this NFT's own blocks and weeks (NakaRewards.explainFor); callers always supply it.
    const explained=options.explain;if(!explained||typeof explained.short!=='string'||typeof explained.full!=='string')throw new Error('Inspection needs the NFT-specific eligibility text');
    // A listing already closing says so in the market's word (Selling, Reclaiming), as its tile does.
    if(options.closing&&!['sale','cancel'].includes(options.closing))throw new Error('Unknown closing kind');
    state.append(node('strong','naka-listing__badge',options.closing==='sale'?T.closingSaleTag:options.closing==='cancel'?T.closingCancelTag:status.short??status.label));
    state.title=`${status.label} · ${explained.full}`;
    const basis=node('p','naka-purchase__basis');paintBasis(basis,snapshot,T,I);
    // The week it starts earning, against the current week ("next week (week 4)"), so "week 4" never reads as three weeks
    // away; the caption's hint gives that week's first block and how far off it is.
    const rates=heroRates(paired,{...options,listing}),phase=R.rewardPhase(snapshot),now=phase.state==='active'?phase.week:null,from=rates?.from?T.rateFrom(rates.from,now):null;
    const caption=[paired?afterLabel:listing==='listed'?T.formulaOnly:null,from].filter(Boolean).join(' · ');
    const weight=node('div','naka-hero__weight'),captionNode=node('span','naka-hero__caption',caption);weight.append(captionNode);
    if(rates?.from){const first=phase.start+(rates.from-1)*R.RULES.weekBlocks+1,blocks=first-snapshot.height;if(blocks>0)captionNode.title=T.rateFromTitle(rates.from,I.int(first),I.int(blocks),(blocks*10/1440).toFixed(1));}weight.title=[paired?(options.action==='cancel'?T.cancelAssumption:T.buyAssumptionShort):null,explained.full].filter(Boolean).join('\n');weight.append(decorateWeight(node('span','naka-hero__value'),after??before,true));
    side.append(state,basis,weight);
    if(rates&&rates.weekly!==null){const dl=node('dl','naka-hero__rates'),cell=(label,value)=>{const d=node('div',''),dd=node('dd',value==='—'?'is-none':'',value);if(value!=='—')dd.append(node('span','naka-hero__unit','SHNAKAS'));d.append(node('dt','',label),dd);dl.append(d);};
      cell(T.rateWeek,shn(rates.weekly));cell(T.rateRest,shn(rates.remaining));dl.title=`${T.rateHint}\n${explained.full}`;side.append(dl);}
    // A piece that produces nothing knowable here (listed, undecided, no later week) says why in the figures' place; a
    // closing listing says so in its own box under the hero instead.
    else if(!options.closing)side.append(node('p','naka-hero__note',explained.short));
    hero.append(side);box.append(hero);
    // A listing already closing (bought and confirming, or being reclaimed): said before any figure, nobody else can buy it.
    if(options.closing){const note=node('p','naka-closing',options.closing==='sale'?T.closingSale:T.closingCancel);note.dataset.kind=options.closing;box.append(note);}

    const beforeLabel=options.action==='cancel'?T.cancelBefore:T.formulaBefore;
    const table=node('table','naka-compare');table.setAttribute('aria-label',paired?(options.action==='cancel'?T.cancelTitle:T.buyTitle):T.weight);
    const cols=node('colgroup','');cols.append(node('col','naka-compare__label-col'),node('col','naka-compare__value-col'));
    const thead=node('thead',''),head=node('tr','');head.append(node('td','naka-compare__formula',T.formulaTitle));
    for(const title of [paired?afterLabel:T.formulaColumn]){const th=node('th','',title);th.scope='col';head.append(th);}thead.append(head);
    const body=node('tbody','');table.append(cols,thead,body);
    const row=(label,a,b,cls='')=>{
      const tr=node('tr',cls),th=node('th','',label);th.scope='row';
      tr.append(th,node('td',paired?'naka-compare__after':'naka-compare__before',paired?b:a));body.append(tr);return tr;
    };
    const pct=traitPct,changes=new Set();
    for(let i=0;i<before.traits.length;i++) {
      const a=before.traits[i],b=paired?after.traits[i]:a;
      const tr=row('',undefined,undefined,'naka-compare__calculation naka-compare__trait');
      tr.children[0].append(node('small','naka-compare__type',a.type==='Hair And Headwear'?T.headwear:a.type),node('span','naka-compare__name',a.value));
      const changed=paired?traitChange(a,b,options.beforeFloor,options.afterFloor):null;
      if(changed){tr.dataset.change=changed;changes.add(changed);}
      const ratio=(t,floor)=>traitRatio(t,floor,T);
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
    box.append(table);
    if(changes.size)table.title=T.changedRows;
    // Context under the weight table, not part of it: the collection floor every ratio is measured against (and how the
    // sale moves it), and the listing's relay credits when it has any (most have none, and the market is retiring them).
    const facts=node('dl','naka-facts'),fact=(label,value,hint)=>{const d=node('div','naka-facts__item');d.append(node('dt','',label));const dd=node('dd','');dd.append(...value);d.append(dd);if(hint)d.title=hint;facts.append(d);return d;};
    const floorBefore=options.beforeFloor??snapshot.collectionFloor,floorAfter=options.afterFloor??snapshot.collectionFloor,moved=paired&&floorBefore!==floorAfter;
    const floorItem=fact(T.collectionFloorBTC,moved?[node('span','naka-compare__old',I.btc(floorBefore)),node('span','naka-compare__arrow',' → '),node('b','',I.btc(floorAfter)),node('span','naka-change naka-change--market','◆')]:[node('b','',I.btc(floorAfter))]);
    if(moved){floorItem.dataset.change='market';changes.add('market');}
    if(options.action!=='cancel' && Number.isSafeInteger(options.credits))fact(T.relayCredits,[node('b','',String(options.credits))],T.relayCreditsMeaning);
    box.append(facts);
    if(options.sales!==false&&root.chrome?.runtime?.sendMessage&&options.id&&options.snap?.items?.[options.id])box.append(salesBox(snapshot,options.id,options.snap.items[options.id][0],T,I));
    // Fine print, one line: how a ratio is read and what a private claim pays. Notes only when they apply.
    // Each part stays whole when the line wraps in a narrow card.
    const caution=node('div','naka-purchase__caution'),formula=node('p','naka-purchase__formula');[T.buyRatioNote,`${T.base} ${R.RULES.basePct}%`,`${T.capShort} ${R.RULES.capPct}%`,T.claimShort].forEach((part,i)=>{if(i)formula.append(' · ');formula.append(node('span','naka-purchase__part',part));});
    formula.title=T.inspectProvisional;caution.append(formula);
    if(before.unmeasured || after?.unmeasured)caution.append(node('p','naka-purchase__note naka-purchase__range-note',T.buyRangeNote));
    if(options.activity)caution.append(node('p','naka-purchase__activity',T.activityShort));
    if(options.notice)caution.append(node('p','naka-purchase__note',options.notice));
    box.append(caution);
    return box;
  }
  function renderCurrent(result,snapshot,T,I,options={}) {return inspection(result,null,snapshot,T,I,options);}
  function render(model,id,T,I,options={}) {
    const scenario=model.get(id);if(scenario.state!=='ready')return null;
    const box=inspection(scenario.before,scenario.result,model.snapshot,T,I,{...scenario,scenario,...options});box.dataset.id=id;return box;
  }
  return {relayCredits,create,premium,listingStatus,renderLaunch,render,renderCurrent,paintBasis,numberTag,numberBadge,decorateWeight,traitChange,traitPct,traitRatio,setLookup};
});
