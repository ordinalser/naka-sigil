/** Classic reward projections. Percentages remain programme weights; projections freeze this block's inputs. There is no second skin. */
(function(root,factory){const api=factory(root,typeof module==='object'&&module.exports?require('./rules.js'):root.ShnakasRules);if(typeof module==='object'&&module.exports)module.exports=api;else root.NakaMining=api;})(globalThis,function(root,R){
 'use strict';
 const W=R.RULES.weekBlocks,START=R.RULES.startBlock,END=START+W*R.RULES.weeks;
 const actionFor=(snap,id,owned=false)=>(snap.offers??[]).some(row=>row[0]===id)?(owned?'cancel':'sale'):'hold';
 /** A transaction can confirm no earlier than h+1. startWeek is zero-based, and intentionally skips the landing week. */
 function schedule(snapshot,action='sale',status=null){
  const h=snapshot.height,phase=R.rewardPhase(snapshot);
  if(!['sale','cancel','hold'].includes(action))throw Error('Unknown mining action');
  if(['ended','closed'].includes(phase.state))return {state:'ended',index:null,at:null,blocks:0,weeks:0,eta:null};
  let index;
  if(action!=='hold')index=R.startWeek(h+1);
  else if(['before','boundary'].includes(phase.state))index=0;
  else if(status?.status==='earning')index=phase.index;
  else if(status?.status==='waiting'&&Number.isSafeInteger(status.startsWeek))index=status.startsWeek-1;
  else return {state:'unknown',index:null,at:null,blocks:null,weeks:null,eta:null};
  if(index>=R.RULES.weeks)return {state:'ended',index:null,at:null,blocks:0,weeks:0,eta:null};
  const at=START+index*W+1,blocks=Math.max(0,END-Math.max(h,at-1)),t=snapshot.blockTime;
  const eta=t?.height===h&&Number.isSafeInteger(t.timestamp)?(t.timestamp+Math.max(0,at-h)*600)*1000:null;
  return {state:at<=h?'running':'waiting',index,at,blocks,weeks:blocks/W,eta};
 }
 function output(units,all,blocks){
  if(!Number.isSafeInteger(blocks)||blocks<0||blocks>W*R.RULES.weeks)throw Error('Invalid mining duration');
  const value=(u,K)=>Number(BigInt(u)*BigInt(R.unitRate(K))*BigInt(blocks))/10**R.RULES.tokenDecimals;
  return {lo:value(units.lo,all.hi),hi:value(units.hi,all.lo)};
 }
 /** Same sale/cancellation world and K as the classic calculator. Pending listings cannot be bought again. */
 const holdingForecasts=new WeakMap();
 /** asIs: the scenario's figures even for a listing already closing (what the piece produces once sold, for a viewer). */
 function forecast(snap,id,{action='sale',scenario=null,status=null,asIs=false}={}){
  if(!Object.hasOwn(snap.items,id))return {state:'missing'};
  const closing=new Map(snap.closing??[]).get(id);
  if(action!=='hold'&&closing&&!asIs)return {state:'closing',closing};
  if(action!=='hold'&&scenario?.state!=='ready')return {state:scenario?.state??'unavailable'};
  // Snapshots are immutable. Cache only holding calculations; purchase worlds keep their own scenario cache.
  let cache,key;if(action==='hold'){cache=holdingForecasts.get(snap);if(!cache){cache=new Map();holdingForecasts.set(snap,cache);}key=id+'|'+(status?.status??'')+'|'+(status?.startsWeek??'');if(cache.has(key))return cache.get(key);}
  const result=action==='hold'?R.evaluateSnapshot(snap,id):scenario.result,all=action==='hold'?R.programmeUnits(snap):scenario.programmeUnits();
  const units=R.units(result),plan=schedule(snap.snapshot,action,status);
  const value={state:'ready',result,plan,weekly:R.weeklyAllocation(units,all),block:R.blockAllocation(units,all),remaining:plan.blocks===null?null:output(units,all,plan.blocks)};
  if(cache){if(cache.size>=4096)cache.delete(cache.keys().next().value);cache.set(key,value);}return value;
 }
 /** Only this week's accrual can be forfeited by listing now; completed weeks are never a loss. Stale sums are unknown. */
 function listingLoss(snap,id,week,observed=null,events=null){
  const A=root.NakaRewards??(typeof require==='function'?require('./rewards.js'):null);
  const data=A.portfolio(snap,[id],week,observed,events),r=data.rows[0];
  if(!r||data.state!=='ready'||data.height!==snap.snapshot.height)return {amount:null,reference:true};
  if(r.status==='unknown')return {amount:null,reference:true};
  return {amount:r.status==='earning'?r.amount:0,reference:!r.verified};
 }

 // A single calculation scope for both prominent estimates; it never certifies wallet earnings.
 function projection(snap,savedIds,data){
  const A=root.NakaRewards??(typeof require==='function'?require('./rewards.js'):null),ids=[...new Set(savedIds)],phase=R.rewardPhase(snap.snapshot),rows=data?.rows??A.portfolio(snap,ids,null).rows,map=new Map(rows.map(r=>[r.id,r]));
  const scopeIds=[],excludedIds=[],unknownIds=[];let weekly={lo:0,hi:0},remaining={lo:0,hi:0},waiting=0;
  for(const id of ids){if(!Object.hasOwn(snap.items,id)){unknownIds.push(id);continue;}const r=map.get(id);if(!r||r.status==='unknown'){unknownIds.push(id);continue;}if(!['earning','waiting','idle'].includes(r.status)){excludedIds.push(id);continue;}
   const f=forecast(snap,id,{action:'hold',status:r});if(f.state!=='ready'||f.remaining===null){unknownIds.push(id);continue;}scopeIds.push(id);if(f.plan.state==='waiting')waiting++;weekly.lo+=f.weekly.lo;weekly.hi+=f.weekly.hi;remaining.lo+=f.remaining.lo;remaining.hi+=f.remaining.hi;
  }
  const ended=['ended','closed'].includes(phase.state),unknown=!ended&&unknownIds.length>0;
  return {state:ended?'ended':unknown?'unknown':'ready',savedIds:ids,scopeIds,excludedIds,unknownIds,waiting,basisHeight:snap.snapshot.height,weekly:unknown?null:ended?{lo:0,hi:0}:weekly,remaining:unknown?null:ended?{lo:0,hi:0}:remaining};
 }
 function capacityChange(snap,savedIds,id,action='sale',data,model){
  const H=root.NakaPortfolio??(typeof require==='function'?require('./portfolio.js'):null),base=projection(snap,savedIds,data);
  if(base.state!=='ready')return {state:base.state};if(action==='sale'&&base.savedIds.includes(id)||action==='cancel'&&!base.savedIds.includes(id))return {state:'wrong-action'};
  if((snap.closing??[]).some(r=>r[0]===id))return {state:'closing'};
  if(schedule(snap.snapshot,action).state==='ended')return {state:'ended'};
  // Keep ownership separate from the pre-action earning scope: a reclaimed rig is excluded before, added after.
  const ids=action==='cancel'?[...new Set([...base.scopeIds,id])]:base.scopeIds,x=H.impact(snap,ids,id,action,model);
  return x.state==='ready'?{...x,scopeIds:base.scopeIds,savedIds:base.savedIds,basisHeight:base.basisHeight}:x;
 }
 function formatOutput(value,signed=false){
  if(value===null||value===undefined)return '—';const f=x=>{if(!Number.isFinite(x))return '—';if(x!==0&&Math.abs(x)<.01)return (x<0?'−':signed?'+':'')+'<0.01';return (signed&&x>0?'+':'')+x.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});};
  return typeof value==='number'?f(value):value.lo===value.hi?f(value.lo):f(value.lo)+'–'+f(value.hi);
 }
 function validCandidateCache(snap,rows,savedIds=[]){
  if(!Array.isArray(rows)||rows.length>(snap.offers?.length??0))return false;const asks=new Map(snap.offers),seen=new Set(),own=new Set(savedIds),closing=new Set((snap.closing??[]).map(r=>r[0]));
  const range=(r,max)=>r&&Number.isFinite(r.lo)&&Number.isFinite(r.hi)&&r.lo>=0&&r.hi>=r.lo&&r.hi<=max;
  return rows.every(r=>{if(!r||seen.has(r.id)||own.has(r.id)||closing.has(r.id)||snap.items[r.id]?.[0]!==r.number||asks.get(r.id)!==r.price)return false;seen.add(r.id);return range(r.weekly,R.RULES.poolPerWeek)&&range(r.remaining,R.RULES.poolPerWeek*R.RULES.weeks)&&range({lo:r.result?.lo?.weight,hi:r.result?.hi?.weight},400)&&r.result.lo.weight>=100;});
 }
 function networkModel(snap,clock=snap.snapshot){
  const phase=R.rewardPhase(clock),ids=Object.keys(snap.items),offers=snap.offers??[],listed=new Set(offers.map(r=>r[0])),valid=listed.size===offers.length&&[...listed].every(id=>Object.hasOwn(snap.items,id));
  const time=clock.blockTime?.height===clock.height&&Number.isSafeInteger(clock.blockTime.timestamp)?clock.blockTime.timestamp:null;
  const nodes=phase.state==='closed'?[]:phase.state==='ended'?[['claim',R.RULES.claimUntil]]:['before','boundary'].includes(phase.state)?[['launch',START+1],['end',END],['claim',R.RULES.claimUntil]]:phase.week===R.RULES.weeks?[['end',END],['claim',R.RULES.claimUntil]]:[['week',phase.last],['end',END],['claim',R.RULES.claimUntil]];
  return {phase,basisHeight:snap.snapshot.height,clockHeight:clock.height,pool:R.RULES.poolPerWeek,listed:valid?listed.size:null,unlisted:valid?ids.length-listed.size:null,nodes:nodes.map(([kind,height])=>({kind,height,reached:clock.height>=height,blocks:Math.max(0,height-clock.height),eta:time===null?null:(time+Math.max(0,height-clock.height)*600)*1000}))};
 }
 function init(){
  if(typeof document==='undefined')return;
  const surface=location.protocol==='chrome-extension:'?(location.pathname.includes('/popup/')?'popup':'workspace'):document.body?.dataset.mode==='demo'?'workspace':'market';
  document.documentElement.dataset.nakaSurface=surface;
  delete document.documentElement.dataset.nakaSkin;
 }
 /** Lifetime formula sums are not personal balances. Public listing intervals prove whole-week losses, regardless of
  * recipient; an encrypted private transfer need not name its asset publicly, so proved losses are a lower bound. */
 function lifetime(snap,id,rows,records,recordsHeight){
  const A=root.NakaRewards??(typeof require==='function'?require('./rewards.js'):null),h=snap.snapshot.height,asset=snap.items[id][0]-snap.collection.numberStart,phase=R.rewardPhase(snap.snapshot);
  const last=phase.state==='active'?phase.index:['ended','closed'].includes(phase.state)?R.RULES.weeks-1:-1;
  let loaded=0,formula=0,lost=0,offlineWeeks=0,asOf=h,completedFormula=0,completedLoss=0,currentFormula=0,currentLoss=0,sawCurrent=false;
  const recordOk=Number.isSafeInteger(recordsHeight)&&recordsHeight>=h&&Array.isArray(records)&&records.every(r=>Array.isArray(r)&&r.length===4&&Number.isSafeInteger(r[0])&&Number.isSafeInteger(r[1])&&r[1]>=0&&['active','sale','cancel'].includes(r[3])&&(r[3]==='active'?r[2]===null:Number.isSafeInteger(r[2])&&r[2]>=r[1]));
  const mine=recordOk?records.filter(r=>r[0]===asset&&r[1]<=h):[];
  for(let w=0;w<=last;w++){
   const row=rows?.[w];if(!row||row.week!==w||row.height>h||!A.table(row)||w<last&&!row.complete)continue;
   loaded++;asOf=Math.min(asOf,w===last?row.height:h);const value=A.piece(row,asset);formula+=value;
   const first=START+w*W+1,end=Math.min(h,START+(w+1)*W),open=w===last&&!row.complete,hit=mine.some(r=>r[1]<=end&&(r[2]===null||r[2]>=first));
   if(open){sawCurrent=true;currentFormula+=value;if(hit)currentLoss+=value;}else{completedFormula+=value;if(hit)completedLoss+=value;}
   if(hit){lost+=value;offlineWeeks++;}
  }
  const complete=loaded===last+1;
  return {loaded,total:last+1,complete,recordsKnown:recordOk,asOf:complete?asOf:null,formula:complete?formula:null,publicLoss:complete&&recordOk?lost:null,offlineWeeks:complete&&recordOk?offlineWeeks:null,completedFormula:complete?completedFormula:null,completedLoss:complete&&recordOk?completedLoss:null,currentFormula:complete&&sawCurrent?currentFormula:null,currentLoss:complete&&recordOk&&sawCurrent?currentLoss:null};
 }
 /** Only a newer official accumulator with unchanged eligibility can produce a reward-update receipt. */
 function accrualChange(previous,next){
  if(!previous||!next||!Number.isSafeInteger(next.week)||typeof next.signature!=='string'||!next.signature||!Number.isSafeInteger(previous.height)||!Number.isSafeInteger(next.height)||next.height<=previous.height||previous.week!==next.week||previous.signature!==next.signature||!Number.isFinite(previous.value)||!Number.isFinite(next.value)||previous.value<0||next.value<=previous.value)return null;
  return {amount:next.value-previous.value,first:previous.height+1,last:next.height};
 }
 /** Public marketplace sales, deliberately excluding recipient, scripts and wallet notes. */
 function publicTrades(listings,height){
  if(!Array.isArray(listings)||!Number.isSafeInteger(height)||height<0)throw Error('Invalid public sales');
  const out=[],seen=new Set();
  for(const r of listings){if(r?.state!=='SOLD')continue;
   const price=typeof r.price==='string'&&/^\d+$/.test(r.price)?Number(r.price):r.price;
   if(!Number.isSafeInteger(r.assetId)||r.assetId<0||r.assetId>=3333||!Number.isSafeInteger(r.soldHeight)||r.soldHeight<0||!Number.isSafeInteger(price)||price<=0)throw Error('Invalid public sale');
   if(r.soldHeight>height)continue;
   const txid=typeof r.soldTxid==='string'&&/^[0-9a-f]{64}$/.test(r.soldTxid)?r.soldTxid:null,key=[r.assetId,r.soldHeight,r.nf??txid??''].join('|');
   if(seen.has(key))continue;seen.add(key);out.push({asset:r.assetId,height:r.soldHeight,price,txid});
  }
  return out.sort((a,b)=>b.height-a.height||a.asset-b.asset);
 }
 const api={validCandidateCache,projection,capacityChange,formatOutput,networkModel,accrualChange,actionFor,init,schedule,output,forecast,listingLoss,lifetime,publicTrades};
 if(typeof document!=='undefined')queueMicrotask(init);return api;
});
