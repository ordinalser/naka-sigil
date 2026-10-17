'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const SRC=require('../src/lib/source.js');
const sb={};vm.runInNewContext(fs.readFileSync(require.resolve('../src/data/snapshot.js'),'utf8'),sb);
const BUNDLED=JSON.parse(JSON.stringify(sb.SHNAKAS_SNAPSHOT));
const clone=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));
const flush=async()=>{for(let i=0;i<12;i++)await new Promise(setImmediate);};
const POPUP={id:'test',url:'chrome-extension://test/popup/popup.html'},PAGE={id:'test',url:'https://ord-dropz.xyz/secondary/collections/shielded-nakas-mupv6wja'},WALLET={id:'test',url:'https://ord-dropz.xyz/wallet'};
/** A live snapshot at another block: the bundled data with that height. */
function at(height){const s=clone(BUNDLED);if(height!==s.snapshot.height)delete s.rewardBasis;s.snapshot.height=height;s.snapshot.indexerHeight=height;s.snapshot.blockTime=null;s.rewardEvents=[];return s;}
/**
 * The worker in a VM with storage that behaves like Chrome's: values are copied in and out, every listener of an event is
 * kept, and a set dispatches onChanged (asynchronously) with old and new values. The calculation core is a test double.
 */
function harness(initial={},overrides={}){
  // This code already ran its upgrade step unless the test says otherwise (nakaBuild undefined: a first start).
  const local=clone({nakaBuild:SRC.BUILD,...initial}),session={visibleAt:Date.now()},listeners={change:[],installed:[],startup:[],message:[],alarm:[]},alarms=new Map();
  const event=name=>({addListener:fn=>listeners[name].push(fn)});
  const area=(data,name)=>({
    get:async keys=>{const list=keys===undefined?Object.keys(data):Array.isArray(keys)?keys:[keys];return Object.fromEntries(list.filter(k=>data[k]!==undefined).map(k=>[k,clone(data[k])]));},
    // overrides.failSet(values): true makes this write fail as a full storage would.
    set:async values=>{if(overrides.failSet?.(values))throw new Error('QUOTA_BYTES quota exceeded');const changes={};for(const [k,v] of Object.entries(values)){if(JSON.stringify(data[k])!==JSON.stringify(v))changes[k]={oldValue:clone(data[k]),newValue:clone(v)};data[k]=clone(v);}if(Object.keys(changes).length)setImmediate(()=>{for(const fn of listeners.change)fn(changes,name);});},
    remove:async keys=>{for(const k of [].concat(keys))delete data[k];},
  });
  let pulses=0,listingReads=0,popups=0;const pulse=overrides.pulse??{lastHeight:BUNDLED.snapshot.height,epoch:1};
  // /listings between blocks: by default the stored snapshot's own listings, none closing.
  const listingsOf=snap=>{const at=new Map(snap.listedAt);return snap.offers.map(([id,price])=>({nf:id,inscriptionId:id,assetId:snap.items[id][0]-snap.collection.numberStart,price:String(price),listedAt:at.get(id),pending:false,cancelling:false}));};
  const core={FORMAT:1,API:'https://example.invalid',closingRows:require('../src/lib/snapshot-core.js').closingRows,
    fetchJson:async url=>{if(url.endsWith('/pulse')){pulses++;return typeof pulse==='function'?pulse():pulse;}if(url.endsWith('/listings')){listingReads++;return overrides.listings?overrides.listings(listingsOf(local.liveSnapshot)):listingsOf(local.liveSnapshot);}if(overrides.weights)return overrides.weights(url);throw Object.assign(new Error('offline'),{isFetch:true,status:null});},
    generateLive:async()=>({snapshot:at(BUNDLED.snapshot.height),records:[]}),generate:async()=>({snapshot:clone(BUNDLED)}),readBlockTime:async()=>null,...overrides.core};
  const context={self:{ShnakasRules:require('../src/lib/rules.js'),NakaRewards:require('../src/lib/rewards.js'),NakaPortfolio:require('../src/lib/portfolio.js'),ShnakasSnapshot:core,ShnakasSource:SRC,SHNAKAS_SNAPSHOT:BUNDLED,NakaExplore:require('../src/lib/explore.js')},importScripts(){},
    // The worker's keep-alive intervals must not hold the test process open: work left pending fails the test instead of hanging it.
    setInterval:(fn,ms)=>setInterval(fn,ms).unref(),clearInterval,setTimeout,Date,
    chrome:{storage:{local:area(local,'local'),session:area(session,'session'),onChanged:event('change')},tabs:{create:async options=>{context.created=options;}},action:{openPopup:async()=>{popups++;}},runtime:{getURL:rel=>'chrome-extension://test/'+rel,id:'test',onInstalled:event('installed'),onStartup:event('startup'),onMessage:event('message'),getPlatformInfo:async()=>({})},alarms:{get:async n=>alarms.get(n),create:async(n,a)=>alarms.set(n,a),clear:async n=>alarms.delete(n),onAlarm:event('alarm')}}};
  vm.createContext(context);vm.runInContext(fs.readFileSync(require.resolve('../src/sw/sync-sw.js'),'utf8'),context);
  const send=(msg,sender={id:'test'})=>new Promise(resolve=>{let done=false;const back=listeners.message[0](msg,sender,r=>{done=true;resolve(r);});if(back===false&&!done)setImmediate(()=>resolve(undefined));});
  return {local,session,alarms,listeners,pulses:()=>pulses,listingReads:()=>listingReads,popups:()=>popups,send,created:()=>context.created,
    // A check now: a page is visible and the last check (if it succeeded) was over a minute ago; its epoch is kept.
    tick:async()=>{session.visibleAt=Date.now();if(local.liveStatus?.state==='ok')local.liveStatus={...local.liveStatus,checkedAt:Date.now()-61000};else delete local.liveStatus;await vm.runInContext('liveTick()',context);await flush();},
    installed:async()=>{for(const fn of listeners.installed)await fn();await flush();}};
}
const piece=n=>Object.keys(BUNDLED.items).find(id=>BUNDLED.items[id][0]===n);
const unlisted=Object.keys(BUNDLED.items).filter(id=>!BUNDLED.offers.some(o=>o[0]===id));
const asset=id=>BUNDLED.items[id][0]-BUNDLED.collection.numberStart;

test('The extension page opens at a section, a Raise weight tab, or one number’s plan or simulator; nothing else',async()=>{
  const h=harness();await flush();
  for(const section of [undefined,'holdings','left','planner','planner-buy','planner-plan','planner-lock','planner-sim','plan-888','sim-6','compare','listings']){
    // Replies are objects of the worker's own realm: compare their fields.
    assert.equal((await h.send({type:'shn-open-compare',...(section===undefined?{}:{section})},POPUP)).ok,true);
    assert.equal(h.created().url,'chrome-extension://test/workspace/index.html'+(section===undefined?'':'#'+section));
  }
  for(const section of ['planner-team','plan-','plan-123456','#planner','planner-lock2']){const res=await h.send({type:'shn-open-compare',section},POPUP);assert.equal(res.ok,false);assert.equal(res.error,'bad-section');}
});
test('Concurrent alarm and heartbeat ticks claim the lock before any storage await',async()=>{
  let resolve;const gate=new Promise(r=>resolve=r);let generated=0;
  const h=harness({},{core:{generateLive:()=>{generated++;return gate;}},pulse:{lastHeight:BUNDLED.snapshot.height+1,epoch:2}});await flush();
  const ticks=[h.tick(),h.tick(),h.tick()];await flush();assert.equal(h.pulses(),1);
  resolve({snapshot:at(BUNDLED.snapshot.height+1),records:[]});await Promise.all(ticks);assert.equal(generated,1);assert.equal(h.local.liveSnapshot.snapshot.height,BUNDLED.snapshot.height+1);
});
test('Bad server data and failures keep the last good snapshot and back off',async()=>{
  for(const generateLive of [async()=>({snapshot:{format:1}}),async()=>{throw new TypeError('Invalid response');}]){
    const h=harness({liveSnapshot:at(BUNDLED.snapshot.height)},{core:{generateLive},pulse:{lastHeight:BUNDLED.snapshot.height+1,epoch:2}});await flush();
    await h.tick();assert.equal(h.local.liveSnapshot.snapshot.height,BUNDLED.snapshot.height);assert.equal(h.local.liveStatus.state,'error');assert.equal(h.local.liveStatus.waitMin,1);
  }
});
test('The same block is never downloaded twice; a missing block time is the only thing read again',async()=>{
  let generated=0,times=0;const H=BUNDLED.snapshot.height;
  const h=harness({liveSnapshot:at(H),liveStatus:{state:'ok',epoch:1,checkedAt:Date.now()-61000}},{core:{generateLive:async()=>{generated++;return {snapshot:at(H),records:[]};},readBlockTime:async height=>{times++;return {height,hash:'a'.repeat(64),timestamp:1791471100};}},pulse:{lastHeight:H,epoch:1}});
  await flush();await h.tick();assert.equal(generated,0,'no rebuild of the same block');assert.equal(times,1);assert.equal(h.local.liveSnapshot.snapshot.blockTime.timestamp,1791471100);
  await h.tick();assert.equal(times,1,'block time known: nothing to read');assert.equal(generated,0);
});
test('Between blocks /listings is re-read for purchases and reclaims on their way, kept apart and written only on change',async()=>{
  const H=BUNDLED.snapshot.height,[a,b]=BUNDLED.offers.map(o=>o[0]),flags=new Map();let drop=false;
  const listings=rows=>rows.filter(l=>!(drop&&l.inscriptionId===a)).map(l=>({...l,pending:flags.get(l.inscriptionId)==='sale',cancelling:flags.get(l.inscriptionId)==='cancel'}));
  const h=harness({liveSnapshot:at(H),liveStatus:{state:'ok',epoch:1,checkedAt:Date.now()-61000}},{listings,pulse:{lastHeight:H,epoch:1}});
  await flush();await h.tick();assert.deepEqual(h.local.liveClosing,{height:H,rows:[]});assert.equal(h.listingReads(),1);
  flags.set(a,'sale');flags.set(b,'cancel');const stored=h.local.liveSnapshot;await h.tick();
  const rows=[[a,'sale'],[b,'cancel']].sort((x,y)=>x[0].localeCompare(y[0]));
  assert.deepEqual(h.local.liveClosing,{height:H,rows});assert.equal(h.local.liveSnapshot,stored,'the snapshot itself is not rewritten');
  // The shared chooser applies the record to its own block only.
  assert.deepEqual(SRC.choose({live:h.local.liveSnapshot,closing:h.local.liveClosing},BUNDLED).snap.closing,rows);
  assert.equal(SRC.choose({live:h.local.liveSnapshot,closing:{height:H-1,rows}},BUNDLED).snap,h.local.liveSnapshot);
  // A listing gone without a new block: the read does not match this block, so the record stays as it was.
  drop=true;flags.delete(a);await h.tick();assert.deepEqual(h.local.liveClosing,{height:H,rows});
});
test('Same height with another epoch, or an incomplete snapshot, is rebuilt',async()=>{
  // An older version's snapshot (v0.11.1 wrote neither listing blocks nor this week's events) counts as incomplete.
  const H=BUNDLED.snapshot.height,incomplete=at(H),noEvents=at(H),noListedAt=at(H);delete incomplete.saleHistory;delete noEvents.rewardEvents;delete noListedAt.listedAt;
  assert.equal(SRC.compatibleSnapshot(noListedAt,BUNDLED),true,'still valid, only incomplete');
  for(const [stored,epoch] of [[at(H),2],[incomplete,1],[noEvents,1],[noListedAt,1]]){let generated=0;
    const h=harness({liveSnapshot:stored,liveStatus:{state:'ok',epoch:1,checkedAt:Date.now()-61000}},{core:{generateLive:async()=>{generated++;return {snapshot:at(H),records:[]};}},pulse:{lastHeight:H,epoch}});
    await flush();await h.tick();assert.equal(generated,1);}
});
test('Upgrade clears retired fixed-mode keys and broken caches, never user data, once per code version as the worker starts',async()=>{
  const holdings=[...unlisted.slice(0,20),'f'.repeat(64)+'i999'],compare=unlisted.slice(20,24),failed={state:'error',kind:'network',status:null,message:'x',failures:2,waitMin:2,nextAt:Date.now()+120000,checkedAt:Date.now()};
  // No onInstalled: a reload after the files were replaced and Chrome restarted reports none.
  for(const before of [undefined,'0.11.1']){
   const h=harness({nakaBuild:before,liveEnabled:false,snapshot:{format:999},syncStatus:{state:'done',height:1},liveSnapshot:null,liveStatus:failed,nakaPortfolio:holdings,nakaComparison:compare,lang:'zh'});
   await flush();
   for(const k of ['liveEnabled','snapshot','syncStatus','liveSnapshot','liveStatus'])assert.equal(h.local[k],undefined,k);
   assert.equal(h.local.nakaBuild,SRC.BUILD);assert.deepEqual(h.local.nakaPortfolio,holdings);assert.deepEqual(h.local.nakaComparison,compare);assert.equal(h.local.lang,'zh');assert.equal(h.alarms.size,1);
  }
  // The same version starting again keeps its backoff and its data.
  const again=harness({nakaBuild:SRC.BUILD,liveSnapshot:at(BUNDLED.snapshot.height),liveStatus:failed});await flush();await again.installed();
  assert.deepEqual(again.local.liveStatus,failed);assert.equal(again.local.liveSnapshot.snapshot.height,BUNDLED.snapshot.height);
  assert.equal(SRC.BUILD,require('../package.json').version,'the version the step is keyed on is this release');
});
test('Upgrade keeps a snapshot this version can read and every key of the user, deep-equal; it drops a damaged snapshot without throwing',async()=>{
  const H=BUNDLED.snapshot.height,user={nakaPortfolio:unlisted.slice(0,3),nakaHoldingsMeta:{[unlisted[0]]:{anchor:H,listedAt:null}},nakaLeft:{[unlisted[5]]:{number:1001,runs:[{listedAt:H-9,soldAt:H-1,weeks:[[0,0]],source:'sale'}]}},nakaHoldingEvents:{height:H,rows:{}},nakaComparison:unlisted.slice(6,8),nakaTeam:{mates:[379,640]},lang:'zh',nakaLeftSeen:['x@1'],nakaOfficialReadings:{rows:{}},nakaRewardWeeks:{format:1,weeks:{}},liveClosing:{height:H,rows:[]},someFutureKey:{a:[1]}};
  const kept=harness({nakaBuild:'0.11.1',liveSnapshot:at(H),liveStatus:{state:'ok',checkedAt:1,epoch:1},liveEnabled:true,...user});await flush();
  assert.equal(kept.local.liveSnapshot.snapshot.height,H,'a snapshot this version reads stays');
  for(const [k,v] of Object.entries(user))assert.deepEqual(kept.local[k],v,k);
  for(const k of ['liveEnabled','liveStatus'])assert.equal(kept.local[k],undefined,k);
  const damaged=harness({nakaBuild:'0.11.1',liveSnapshot:{...at(H),saleHistory:[],pending:[null]},...user});await flush();
  assert.equal(damaged.local.liveSnapshot,undefined);assert.equal(damaged.local.nakaBuild,SRC.BUILD);for(const [k,v] of Object.entries(user))assert.deepEqual(damaged.local[k],v,k);
});
test('A check arriving before the upgrade step ends waits for it; a failed step is recorded like a failed check and retried',async()=>{
  const H=BUNDLED.snapshot.height;
  const early=harness({nakaBuild:'0.11.1',liveStatus:{state:'ok',checkedAt:1,epoch:1}},{pulse:{lastHeight:H,epoch:1}});await early.tick();
  assert.equal(early.local.nakaBuild,SRC.BUILD);assert.equal(early.local.liveStatus.state,'ok','the check after the step kept its status');assert.ok(early.local.liveStatus.checkedAt>1);
  let full=true;const h=harness({nakaBuild:'0.11.1'},{failSet:values=>full&&Object.hasOwn(values,'nakaBuild'),pulse:{lastHeight:H,epoch:1}});await flush();
  await h.tick();assert.equal(h.local.nakaBuild,'0.11.1');assert.equal(h.local.liveStatus.state,'error');assert.equal(h.local.liveStatus.kind,'data');assert.match(h.local.liveStatus.message,/QUOTA/);
  full=false;await h.tick();assert.equal(h.local.nakaBuild,SRC.BUILD,'tried again');assert.equal(h.local.liveStatus.state,'ok');
});
test('After a downgrade and back, the upgrade step runs again: a retired key shows an older version ran',async()=>{
  const failed={state:'error',kind:'data',status:null,message:'x',failures:5,waitMin:16,nextAt:Date.now()+16*60000,checkedAt:Date.now()};
  const h=harness({nakaBuild:SRC.BUILD,liveEnabled:false,snapshot:{format:999},liveStatus:failed,nakaPortfolio:unlisted.slice(0,2),lang:'zh'});await flush();
  for(const k of ['liveEnabled','snapshot','liveStatus'])assert.equal(h.local[k],undefined,k);
  assert.deepEqual(h.local.nakaPortfolio,unlisted.slice(0,2));assert.equal(h.local.lang,'zh');
});
test('A failed write rejects only its own request: the next one is saved',async()=>{
  let fail=1;const h=harness({},{failSet:values=>Object.hasOwn(values,'nakaComparison')&&fail-->0});await flush();
  const first=await h.send({type:'shn-compare',action:'toggle',id:unlisted[0]});assert.equal(first.ok,false);
  const second=await h.send({type:'shn-compare',action:'toggle',id:unlisted[1]});assert.equal(second.ok,true);assert.deepEqual(h.local.nakaComparison,[unlisted[1]]);
  const third=await h.send({type:'shn-holdings',ids:[unlisted[2]]});assert.equal(third.ok,true);assert.deepEqual(h.local.nakaPortfolio,[unlisted[2]]);
});
test('A holdings list this version cannot read keeps every anchor; a damaged record row is not a sale to settle',async()=>{
  const H=BUNDLED.snapshot.height,meta={[unlisted[0]]:{anchor:H,listedAt:null},[unlisted[1]]:{anchor:H-5,listedAt:null}};
  for(const raw of ['not-an-array',{ids:[unlisted[0]]}]){
   const h=harness({nakaPortfolio:raw,nakaHoldingsMeta:meta},{pulse:{lastHeight:H,epoch:1}});await flush();await h.tick();
   assert.deepEqual(h.local.nakaHoldingsMeta,meta,JSON.stringify(raw));assert.deepEqual(h.local.nakaPortfolio,raw,'and the list itself stays');
  }
  const id=unlisted[3],h=harness({nakaPortfolio:[id],nakaHoldingEvents:{height:H,rows:{[id]:[null,[asset(id),H-9,H-2,'sale']]}}});await flush();
  const res=await h.send({type:'shn-left',action:'sold',id,listedAt:H-1},POPUP);assert.equal(res.ok,false);
  assert.equal((await h.send({type:'shn-compare',action:'toggle',id:unlisted[4]})).ok,true,'the queue goes on');
});
test('The worker names the code it runs; a page accepts only this release, not another one or no answer',async()=>{
  const h=harness();await flush();
  const answer=await h.send({type:'shn-build'},POPUP);
  assert.deepEqual({...answer},{ok:true,build:SRC.BUILD});assert.equal(SRC.sameBuild(answer),true);
  for(const other of [undefined,null,{ok:true,build:'0.11.1'},{ok:false,build:SRC.BUILD},{build:SRC.BUILD},SRC.BUILD])assert.equal(SRC.sameBuild(other),false,JSON.stringify(other));
});
test('After a reload a page asked for, the new worker opens that page again: once, within a minute, at a known section only',async()=>{
  const now=Date.now();
  const ws=harness({nakaReopen:{page:'workspace',section:'planner-lock',at:now}});await flush();
  assert.equal(ws.created().url,'chrome-extension://test/workspace/index.html#planner-lock');assert.equal(ws.local.nakaReopen,undefined);assert.equal(ws.popups(),0);
  for(const section of ['','javascript:alert(1)',['left'],'sim-123456']){const h=harness({nakaReopen:{page:'workspace',section,at:now}});await flush();assert.equal(h.created().url,'chrome-extension://test/workspace/index.html',JSON.stringify(section));}
  const pop=harness({nakaReopen:{page:'popup',at:now}});await flush();assert.equal(pop.popups(),1);assert.equal(pop.created(),undefined);assert.equal(pop.local.nakaReopen,undefined);
  for(const want of [{page:'popup',at:now-SRC.REOPEN_MS-1000},{page:'workspace',at:'x'},{page:'other',at:now},'popup',null]){
   const h=harness({nakaReopen:want});await flush();
   assert.equal(h.popups(),0,JSON.stringify(want));assert.equal(h.created(),undefined,JSON.stringify(want));assert.equal(h.local.nakaReopen,undefined,JSON.stringify(want));
  }
  const none=harness();await flush();assert.equal(none.popups(),0);assert.equal(none.created(),undefined);
});
test('Messages from other extensions are ignored; retired one-off sync messages get no answer',async()=>{
  const h=harness();await flush();
  assert.equal(h.listeners.message[0]({type:'shn-compare',action:'clear'},{id:'other'},()=>{}),false);
  for(const type of ['shn-sync','shn-set-fixed'])assert.equal(await h.send({type,height:1}),undefined);
});
test('Comparison edits serialize, cap at four and never call the network',async()=>{
  const h=harness();await flush();const ids=unlisted.slice(0,5);
  const results=await Promise.all(ids.map(id=>h.send({type:'shn-compare',action:'toggle',id})));
  assert.equal(h.local.nakaComparison.length,4);assert.equal(results[4].state,'full');assert.equal(h.pulses(),0);
  assert.equal((await h.send({type:'shn-compare',action:'toggle',id:'bad'})).state,'missing');
  await h.send({type:'shn-compare',action:'clear'});assert.equal(h.local.nakaComparison.length,0);
});
test('Historical inspection is popup-only, cached and changes nothing stored',async()=>{
  let generated=0;const h=harness({liveSnapshot:at(BUNDLED.snapshot.height)},{core:{generate:async()=>{generated++;return {snapshot:clone(BUNDLED)};}}});await flush();
  const before=JSON.stringify(h.local);
  const first=await h.send({type:'shn-history',height:BUNDLED.snapshot.height},POPUP);assert.equal(first.ok,true);assert.equal((await h.send({type:'shn-history',height:BUNDLED.snapshot.height},POPUP)).ok,true);
  assert.equal(generated,1);assert.equal(JSON.stringify(h.local),before);
  assert.equal((await h.send({type:'shn-history',height:BUNDLED.snapshot.height},WALLET)).ok,false);
  for(const generate of [async()=>{throw Error('Failed');},async()=>({snapshot:{...clone(BUNDLED),snapshot:{...BUNDLED.snapshot,height:1}}})]){
    const g=harness({liveSnapshot:at(BUNDLED.snapshot.height)},{core:{generate}});await flush();assert.equal((await g.send({type:'shn-history',height:BUNDLED.snapshot.height},POPUP)).ok,false);}
});
test('The chain clock is popup-only and cached for a minute',async()=>{
  const h=harness({},{pulse:{lastHeight:BUNDLED.snapshot.height+5,epoch:1}});await flush();
  const [a,b]=await Promise.all([h.send({type:'shn-reward-clock'},POPUP),h.send({type:'shn-reward-clock'},POPUP)]);assert.equal(a.ok,true);assert.equal(a.height,b.height);assert.equal(h.pulses(),1);
  await h.send({type:'shn-reward-clock'},POPUP);assert.equal(h.pulses(),1);
  assert.equal(h.listeners.message[0]({type:'shn-reward-clock'},WALLET,()=>{}),false);
});

// ---------------------------------------------------------------- My holdings: anchors, sales, left pieces.
test('A holding added before the first live check is anchored to the chain height read after it, never to old data',async()=>{
  // The piece's newest public record is the purchase that made it mine, listed after the bundled block.
  const H=BUNDLED.snapshot.height,id=unlisted[0],records=[[asset(id),H+30,H+40,'sale']];
  const h=harness({},{core:{generateLive:async()=>({snapshot:at(H+50),records})},pulse:{lastHeight:H+50,epoch:2}});await flush();
  const added=await h.send({type:'shn-holdings',ids:[id]},PAGE);assert.equal(added.ok,true);assert.ok(Number.isSafeInteger(h.local.nakaHoldingsMeta[id].added));
  await h.tick();
  assert.deepEqual(h.local.nakaPortfolio,[id],'still mine: the sale is my purchase');assert.equal(h.local.nakaLeft,undefined);
  assert.deepEqual(h.local.nakaHoldingsMeta[id],{anchor:H+50,listedAt:null});
  assert.deepEqual(h.local.nakaHoldingEvents.rows[id],records);
});
test('My listing that sells after the anchor moves the piece to Left with its run; a holding missing from the data stays',async()=>{
  const H=BUNDLED.snapshot.height,id=unlisted[1],missing='f'.repeat(64)+'i999';let height=H,records=[];
  const h=harness({nakaPortfolio:[id,missing],nakaHoldingsMeta:{[id]:{anchor:H,listedAt:null}}},{core:{generateLive:async()=>({snapshot:at(height),records})},pulse:()=>({lastHeight:height,epoch:height})});await flush();
  height=H+9;records=[[asset(id),H+3,H+8,'sale']];await h.tick();
  assert.deepEqual(h.local.nakaPortfolio,[missing],'the saved id absent from the data is kept');
  assert.deepEqual(h.local.nakaLeft[id],{number:BUNDLED.items[id][0],runs:[{listedAt:H+3,soldAt:H+8,weeks:[],source:'sale'}]});
  assert.equal(h.local.nakaHoldingsMeta[id],undefined);
});
test('Writing Left keeps every entry and run this version cannot read, untouched',async()=>{
  const H=BUNDLED.snapshot.height,id=unlisted[1],other=unlisted[2],old=unlisted[3];let height=H,records=[];
  const odd={number:BUNDLED.items[other][0],runs:[{listedAt:H-50,soldAt:H-40,weeks:'v2',source:'sale'}]},legacyPrivate={number:BUNDLED.items[old][0],listedAt:null,firstWeek:0,lastWeek:1,source:'wallet'};
  const h=harness({nakaPortfolio:[id],nakaHoldingsMeta:{[id]:{anchor:H,listedAt:null}},nakaLeft:{[other]:odd,[old]:legacyPrivate,someday:{x:1}}},{core:{generateLive:async()=>({snapshot:at(height),records})},pulse:()=>({lastHeight:height,epoch:height})});await flush();
  height=H+9;records=[[asset(id),H+3,H+8,'sale']];await h.tick();
  assert.equal(h.local.nakaLeft[id].runs.length,1,'the sale moved in');
  assert.deepEqual(h.local.nakaLeft[other],odd);assert.deepEqual(h.local.nakaLeft[old],legacyPrivate);assert.deepEqual(h.local.nakaLeft.someday,{x:1});
});
test('A listing already open when the piece was added stays unattributed until the owner answers either way',async()=>{
  const H=BUNDLED.snapshot.height,[lid,L]=BUNDLED.listedAt[0];let height=H,records=[[asset(lid),L,null,'active']];
  const h=harness({},{core:{generateLive:async()=>({snapshot:at(height),records})},pulse:()=>({lastHeight:height,epoch:height})});await flush();
  await h.send({type:'shn-holdings',ids:[lid]},PAGE);await h.tick();
  assert.deepEqual(h.local.nakaHoldingsMeta[lid],{anchor:H,listedAt:L});
  // The listing sells: my sale, or my purchase of that seller's listing? Nothing moves on its own.
  height=H+4;records=[[asset(lid),L,H+3,'sale']];await h.tick();assert.deepEqual(h.local.nakaPortfolio,[lid]);
  const P=require('../src/lib/portfolio.js');assert.equal(P.attribution(at(H+4),lid,h.local.nakaHoldingEvents.rows[lid],h.local.nakaHoldingsMeta[lid]).state,'unclear');
  // "I bought it": anchored at the purchase block.
  assert.equal((await h.send({type:'shn-left',action:'bought',id:lid,listedAt:L})).ok,true);assert.deepEqual(h.local.nakaHoldingsMeta[lid],{anchor:H+3,listedAt:null});
  // Or "I sold it": the piece moves to Left.
  const g=harness({nakaPortfolio:[lid],nakaHoldingsMeta:{[lid]:{anchor:H,listedAt:L}},nakaHoldingEvents:{height:H+4,rows:{[lid]:records}}});await flush();
  assert.equal((await g.send({type:'shn-left',action:'sold',id:lid,listedAt:L})).ok,true);assert.deepEqual(g.local.nakaPortfolio,[]);assert.equal(g.local.nakaLeft[lid].runs[0].source,'manual');
  assert.equal((await g.send({type:'shn-left',action:'sold',id:lid,listedAt:L+1})).ok,false,'only a recorded sale can be answered');
});
test('Pieces added from my own vault or wallet page: a listing open then is mine, so its sale is my sale',async()=>{
  const H=BUNDLED.snapshot.height,[lid,L]=BUNDLED.listedAt[0];let height=H,records=[[asset(lid),L,null,'active']];
  const h=harness({},{core:{generateLive:async()=>({snapshot:at(height),records})},pulse:()=>({lastHeight:height,epoch:height})});await flush();
  await h.send({type:'shn-holdings',ids:[lid],vault:true},PAGE);await h.tick();assert.equal(h.local.nakaHoldingsMeta[lid].seller,true);
  height=H+4;records=[[asset(lid),L,H+3,'sale']];await h.tick();assert.deepEqual(h.local.nakaPortfolio,[]);assert.equal(h.local.nakaLeft[lid].runs[0].soldAt,H+3);
});
test('Putting a left piece back re-anchors it, so the sale it left with is read as a purchase; prototype keys are refused',async()=>{
  const H=BUNDLED.snapshot.height,id=unlisted[2],records=[[asset(id),H-20,H-10,'sale']];
  const h=harness({nakaLeft:{[id]:{number:BUNDLED.items[id][0],runs:[{listedAt:H-20,soldAt:H-10,weeks:[],source:'sale'}]}}},{core:{generateLive:async()=>({snapshot:at(H+1),records})},pulse:{lastHeight:H+1,epoch:3}});await flush();
  assert.equal((await h.send({type:'shn-left',action:'restore',id,listedAt:H-20})).ok,true);assert.deepEqual(h.local.nakaPortfolio,[id]);assert.equal(h.local.nakaLeft[id],undefined);
  await h.tick();assert.deepEqual(h.local.nakaPortfolio,[id]);assert.equal(h.local.nakaHoldingsMeta[id].anchor,H+1);
  assert.equal((await h.send({type:'shn-left',action:'restore',id:'__proto__',listedAt:null})).ok,false);
});
test('Wallet sync: a piece shown as left with no public sale of mine moves to Left with its weeks; waiting marks a private-move week',async()=>{
  const R=require('../src/lib/rules.js'),S=R.RULES.startBlock,W=R.RULES.weekBlocks,H=S+3*W+20,live=at(H),[a,b]=unlisted;
  const h=harness({liveSnapshot:live,nakaPortfolio:[a,b],nakaHoldingsMeta:{[a]:{anchor:S-5,listedAt:null},[b]:{anchor:S-5,listedAt:null}},nakaHoldingEvents:{height:H,rows:{[a]:[],[b]:[]}}});await flush();
  const out=await h.send({type:'shn-import-eligibility',week:3,height:H,rows:[{id:a,state:'past',through:1},{id:b,state:'waiting'}]},WALLET);
  assert.deepEqual(clone(out),{ok:true,moved:1});assert.deepEqual(h.local.nakaPortfolio,[b]);
  assert.deepEqual(h.local.nakaLeft[a].runs,[{listedAt:null,soldAt:null,weeks:[[0,1]],source:'wallet'}]);
  assert.deepEqual(h.local.nakaHoldingsMeta[b].gaps,[3]);assert.equal(h.local.nakaOfficialReadings.rows[b].state,'waiting');
  assert.equal((await h.send({type:'shn-import-eligibility',week:3,height:H+1,rows:[]},WALLET)).error,'ahead');
  assert.equal((await h.send({type:'shn-import-eligibility',week:3,height:H,rows:[]},PAGE)).error,'bad-reading','only the wallet page');
});
test('Finished reward weeks: two reads a check in turn, failures retried later, invalid stored rows replaced',async()=>{
  const R=require('../src/lib/rules.js'),A=require('../src/lib/rewards.js'),S=R.RULES.startBlock,W=R.RULES.weekBlocks,H=S+4*W+5,reads=[];
  const raw=w=>({w,height:S+w*W,blocks:W,complete:true,base:'100000000',pieces:Array(3333).fill('100000000')});
  const h=harness({liveSnapshot:at(H),liveStatus:{state:'ok',epoch:1,checkedAt:Date.now()-61000},nakaRewardWeeks:{format:1,weeks:{0:{...A.normalize(raw(0)),acc:'bad'}}}},
    {pulse:{lastHeight:H,epoch:1},weights:url=>{const w=Number(url.split('/').at(-1));reads.push(w);if(w===4)return {...raw(4),complete:false,blocks:5};if(w===1&&reads.filter(x=>x===1).length===1)throw Object.assign(new Error('x'),{isFetch:true,status:503});return raw(w);}});
  await flush();await h.tick();assert.deepEqual(reads.filter(w=>w<4),[0,1]);assert.deepEqual(Object.keys(h.local.nakaRewardWeeks.weeks),['0']);
  await h.tick();assert.deepEqual(Object.keys(h.local.nakaRewardWeeks.weeks).sort(),['0','2','3']);
  await h.tick();assert.deepEqual(Object.keys(h.local.nakaRewardWeeks.weeks).sort(),['0','1','2','3']);
  const before=reads.length;await h.tick();assert.equal(reads.filter(w=>w<4).length,before-reads.filter(w=>w===4).length,'all finished weeks stored: no more reads of them');
});

// Exercise the deployed classic-worker imports, not the test doubles.
test('Classic worker imports load every library it uses in dependency order, and the real rules check an official basis',()=>{
  const context={};context.self=context;context.globalThis=context;vm.createContext(context);
  const source=fs.readFileSync(require.resolve('../src/sw/sync-sw.js'),'utf8'),statement=source.match(/importScripts\([^;]+;/)[0];
  context.importScripts=(...files)=>{for(const file of files)vm.runInContext(fs.readFileSync(path.resolve(__dirname,'../src/sw',file),'utf8'),context);};
  vm.runInContext(statement,context);
  const snap=BUNDLED,R=context.ShnakasRules;
  assert.doesNotThrow(()=>context.NakaExplore.entry(snap,context.NakaPurchase.create(snap),snap.offers[0][0]),'explore.js sees purchase.js');
  const basis=snap.rewardBasis,counts=new Map(basis.traits.map(([i,pct,source,pieces])=>[i,{pct,source,pieces}])),K=R.programmeUnits(snap).lo,v=R.unitRate(K);
  const rows=[...Object.values(snap.items),...(snap.pending??[])],pieces=rows.map(row=>{const r=R.evaluate({number:row[0],traits:R.snapshotTraits(snap,row.slice(1))},snap.snapshot.collectionFloor);return {p:row[0]-snap.collection.numberStart,pct:r.lo.weight,weight:r.lo.weight/25,perBlock:String(r.lo.weight/25*v)};});
  const data={height:snap.snapshot.height,F:snap.snapshot.collectionFloor,K,v:String(v),basePerBlock:String(4*v),values:snap.traits.map(([type,value,floor],i)=>({type,value,floor,...counts.get(i)})),pieces};
  assert.equal(context.ShnakasSnapshot.attachRewardBasis(snap,data).rewardBasis.height,snap.snapshot.height);
});
