/** Public per-week accumulators, not wallet entitlement or claimed balances. */
(function(root,factory){const api=factory(typeof module==='object'&&module.exports?require('./rules.js'):root.ShnakasRules);if(typeof module==='object'&&module.exports)module.exports=api;else root.NakaRewards=api;})(globalThis,function(R){
 'use strict';const KEY='nakaRewardWeek',STATUS='nakaRewardStatus',OBSERVED='nakaOfficialReadings';
 function normalize(raw){
  const W=R.RULES.weekBlocks,start=R.RULES.startBlock;
  if(!raw||!Number.isSafeInteger(raw.w)||raw.w<0||raw.w>=R.RULES.weeks||raw.height!==start+raw.w*W||!Number.isSafeInteger(raw.blocks)||raw.blocks<0||raw.blocks>W||typeof raw.complete!=='boolean'||raw.complete&&raw.blocks!==W||typeof raw.base!=='string'||!/^\d{1,20}$/.test(raw.base)||!Array.isArray(raw.pieces)||raw.pieces.length!==3333||BigInt(raw.base)>BigInt(R.RULES.poolPerWeekBase)||raw.pieces.some(v=>typeof v!=='string'||!/^\d{1,20}$/.test(v)||BigInt(v)>BigInt(R.RULES.poolPerWeekBase)||BigInt(v)<BigInt(raw.base)))throw Error('Invalid public reward accumulator');
  const bytes=new Uint8Array(raw.pieces.length*8),view=new DataView(bytes.buffer);raw.pieces.forEach((v,i)=>view.setBigUint64(i*8,BigInt(v),true));
  const acc=typeof Buffer!=='undefined'?Buffer.from(bytes).toString('base64'):btoa(Array.from(bytes,b=>String.fromCharCode(b)).join(''));
  return {format:1,week:raw.w,height:raw.height+raw.blocks,blocks:raw.blocks,complete:raw.complete,base:raw.base,acc};
 }
 const decoded=new WeakMap();
 function table(row){if(!row||row.format!==1||typeof row.complete!=='boolean'||typeof row.base!=='string'||!/^\d{1,20}$/.test(row.base)||BigInt(row.base)>BigInt(R.RULES.poolPerWeekBase)||!Number.isSafeInteger(row.week)||row.week<0||row.week>=R.RULES.weeks||!Number.isSafeInteger(row.blocks)||row.blocks<0||row.blocks>R.RULES.weekBlocks||row.height!==R.RULES.startBlock+row.week*R.RULES.weekBlocks+row.blocks||typeof row.acc!=='string'||row.acc.length!==35552||!/^[A-Za-z0-9+/]+={0,2}$/.test(row.acc))return null;if(decoded.has(row))return decoded.get(row);try{const bytes=typeof Buffer!=='undefined'?new Uint8Array(Buffer.from(row.acc,'base64')):Uint8Array.from(atob(row.acc),c=>c.charCodeAt(0));if(bytes.length!==3333*8)return null;const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);for(let i=0;i<3333;i++){const value=view.getBigUint64(i*8,true);if(value>BigInt(R.RULES.poolPerWeekBase)||value<BigInt(row.base))return null;}decoded.set(row,view);return view;}catch{return null;}}
 function piece(row,asset){const data=table(row);return data&&Number.isSafeInteger(asset)&&asset>=0&&asset<3333?Number(data.getBigUint64(asset*8,true))/10**R.RULES.tokenDecimals:null;}
 function portfolio(snap,ids,row,observed){
  const phase=R.rewardPhase(snap.snapshot),valid=phase.state==='active'&&row?.week===phase.index&&row.height<=snap.snapshot.height&&table(row),offers=new Set(snap.offers?.map(x=>x[0])??[]);
  let reference=0,confirmed=0,known=0,unverified=0,claimable=0,claimsKnown=0;const rows=[];
  for(const id of ids){if(!Object.hasOwn(snap.items,id))continue;const asset=snap.items[id][0]-snap.collection.numberStart,ob=observed?.rows?.[id];const active=ob&&ob.week===phase.index&&['earning','claimable'].includes(ob.state)&&ob.height<=snap.snapshot.height;
   const context=R.rewardContext(snap,id,offers.has(id)?'listed':'unlisted'),observedPaused=ob?.week===phase.index&&['waiting','paused','before'].includes(ob.state),paused=observedPaused||offers.has(id)||['waiting','no-future-week','ended'].includes(context.state);
   const amount=valid?paused?0:piece(row,asset):null;
   if(amount!==null)reference+=amount;if(paused){known++;}else if(active&&amount!==null){confirmed+=amount;known++;}else unverified++;
   const claim=phase.index===0||['before','boundary'].includes(phase.state)?0:ob&&Number.isFinite(ob.claimable)&&ob.claimable>=0?ob.claimable:null;
   if(claim!==null){claimable+=claim;claimsKnown++;}
   rows.push({id,amount,verified:paused||!!active,paused,claimable:claim});
  }
  const exact=valid&&unverified===0;return {state:['before','boundary'].includes(phase.state)?'before':['ended','closed'].includes(phase.state)?'ended':valid?'ready':'loading',height:valid?row.height:null,blocks:valid?row.blocks:0,week:phase.week,phase,reference:valid?reference:null,confirmed:exact?confirmed:null,verified:exact,unverified,known,claimable:claimsKnown===rows.length?claimable:null,rows};
 }

 function currentRate(snap,data){
  if(data.phase.state!=='active')return {lo:0,hi:0};
  const mine=data.rows.filter(row=>!row.paused).reduce((sum,row)=>{const u=R.units(R.evaluateSnapshot(snap,row.id));return {lo:sum.lo+u.lo,hi:sum.hi+u.hi};},{lo:0,hi:0});
  return R.weeklyAllocation(mine,R.programmeUnits(snap));
 }
 const copy=lang=>lang==='zh'?{accrued:'本周已累计',reference:'本周累计参考',rate:'当前每块',projected:'本周预计',claim:'可领取',loading:'正在读取本周累计…',error:'累计读取失败，稍后重试',blocks:(n,w)=>`第 ${n} 周 · ${w}/1008 块`,basis:h=>`累计区块 ${h.toLocaleString('en-US')}`,note:'参考值按本周开始前持有且未挂单计算；个人资格由保险库确认',vault:'在保险库确认资格 ↗',claimVault:'前往保险库查看可领取 ↗',before:'奖励尚未开始',ended:'计奖已结束',sync:'同步后更新',tracked:'按已同步资格跟踪；转移藏品后请重新同步',share:'截图展示 ↗',close:'关闭',shareNote:'本周累计，非可领取余额 · 区块确认后更新'}:{accrued:'Accrued this week',reference:'This week · reference',rate:'Rate / block',projected:'Projected this week',claim:'Claimable',loading:'Reading this week’s accumulator…',error:'Reward data unavailable; retrying',blocks:(n,w)=>`Week ${n} · ${w}/1008 blocks`,basis:h=>`Accrual block ${h.toLocaleString('en-US')}`,note:'Reference assumes held, unlisted since this week began. Confirm personal eligibility in the Vault.',vault:'Confirm eligibility in Vault ↗',claimVault:'View claimable rewards in Vault ↗',before:'Rewards have not started',ended:'Accrual has ended',sync:'Updates after sync',tracked:'Tracked from your Vault reading. Resync eligibility after transfers.',share:'Showcase ↗',close:'Close',shareNote:'This week’s accrual, not a claimable balance · updates on confirmed blocks'};
 const format=x=>Number.isFinite(x)?new Intl.NumberFormat('en-US',{minimumFractionDigits:4,maximumFractionDigits:8}).format(x):'—';
 function render(snap,ids,row,observed,lang,weekly,status){
  const c=copy(lang),data=portfolio(snap,ids,row,observed);weekly=currentRate(snap,data);const n=(tag,cls,text)=>{const el=document.createElement(tag);el.className=cls;if(text!==undefined)el.textContent=text;return el;},box=n('section','naka-reward-miner');
  box.dataset.state=data.state;box.dataset.verified=String(data.verified);box.dataset.height=String(data.height??'');
  const head=n('div','naka-reward-head');head.append(n('span','naka-reward-label',data.verified?c.accrued:c.reference),n('span','naka-reward-badge',data.phase.state==='active'?c.blocks(data.week,data.blocks):data.phase.state==='before'||data.phase.state==='boundary'?c.before:c.ended));head.firstElementChild.title=data.verified?c.tracked:c.note;box.append(head);
  const amount=data.state==='before'?0:data.verified?data.confirmed:data.reference,figure=n('div','naka-reward-figure'),value=Number.isFinite(amount)?new Intl.NumberFormat('en-US',{minimumFractionDigits:2,maximumFractionDigits:amount>0&&amount<.0001?8:4}).format(amount):'—';figure.setAttribute('aria-live','polite');figure.append(n('span','naka-sr-only',value),amount===null?n('strong','naka-reward-placeholder','—'):globalThis.NakaPixel.digits(value.replace(/[^0-9.,]/g,''),'naka-reward-digits'),n('span','naka-reward-unit','SHNAKAS'));box.append(figure);
  const progress=n('div','naka-reward-progress');progress.title=[data.height!==null?c.basis(data.height):'',data.verified?c.tracked:c.note].filter(Boolean).join(' · ');progress.setAttribute('role','progressbar');progress.setAttribute('aria-label',c.blocks(data.week??0,data.blocks));progress.setAttribute('aria-valuemin','0');progress.setAttribute('aria-valuemax','1008');progress.setAttribute('aria-valuenow',String(data.blocks));const bar=n('i','');bar.style.width=(data.blocks/1008*100)+'%';progress.append(bar);box.append(progress);
  const metrics=n('div','naka-reward-metrics');const projection=amount!==null&&data.height===snap.snapshot.height&&data.phase.state==='active'?{lo:amount+weekly.lo*(1008-data.blocks)/1008,hi:amount+weekly.hi*(1008-data.blocks)/1008}:null;
  for(const [label,text]of [[c.rate,new Intl.NumberFormat('en-US',{maximumFractionDigits:4}).format(weekly.lo/1008)+(weekly.lo===weekly.hi?'':'–'+new Intl.NumberFormat('en-US',{maximumFractionDigits:4}).format(weekly.hi/1008))],[c.projected,projection?globalThis.NakaExploreUI.shn(projection):'—'],[c.claim,data.claimable===null?'—':globalThis.NakaExploreUI.shn({lo:data.claimable,hi:data.claimable})]]){const metric=n('div','');metric.append(n('small','',label),n('strong','',text));metrics.append(metric);}box.append(metrics);
  if(data.state==='loading'||status?.state==='loading'||status?.state==='error'){const basis=n('p','naka-reward-basis',status?.state==='error'?c.error:c.loading);basis.setAttribute('role','status');box.append(basis);}
  return {element:box,data};
 }
 return {KEY,STATUS,OBSERVED,normalize,table,piece,portfolio,currentRate,render,format,copy};
});
