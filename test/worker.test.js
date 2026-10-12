'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const SRC=require('../src/lib/source.js');
const sb={};vm.runInNewContext(fs.readFileSync(require.resolve('../src/data/snapshot.js'),'utf8'),sb);
const snapshot=JSON.parse(JSON.stringify(sb.SHNAKAS_SNAPSHOT));
const flush=async()=>{for(let i=0;i<8;i++) await new Promise(setImmediate);};
function harness(initial={}, overrides={}) {
  const local={...initial}, session={visibleAt:Date.now()}, events={}, alarms=new Map();
  const event=name=>({addListener:fn=>events[name]=fn});
  const area=data=>({get:async keys=>Object.fromEntries((Array.isArray(keys)?keys:[keys]).map(k=>[k,data[k]])),set:async values=>Object.assign(data,values),remove:async keys=>{for(const k of Array.isArray(keys)?keys:[keys])delete data[k];}});
  let calls=0;
  const core={FORMAT:1,API:'https://example.invalid',fetchJson:async()=>{calls++;return {lastHeight:snapshot.snapshot.height+1,epoch:2};},generateLive:async()=>({snapshot}),...overrides};
  const context={self:{ShnakasSnapshot:core,ShnakasSource:SRC,SHNAKAS_SNAPSHOT:snapshot,NakaExplore:require('../src/lib/explore.js')},importScripts(){},setInterval,clearInterval,Date,
    chrome:{storage:{local:area(local),session:area(session),onChanged:event('change')},tabs:{create:async options=>{events.created=options;}},runtime:{getURL:rel=>'chrome-extension://test/'+rel,id:'test',onInstalled:event('installed'),onStartup:event('startup'),onMessage:event('message'),getPlatformInfo:async()=>({})},alarms:{get:async n=>alarms.get(n),create:async(n,a)=>alarms.set(n,a),clear:async n=>alarms.delete(n),onAlarm:event('alarm')}}};
  vm.createContext(context);vm.runInContext(fs.readFileSync(require.resolve('../src/sw/sync-sw.js'),'utf8'),context);
  return {local,context,events,alarms,calls:()=>calls,tick:()=>vm.runInContext('liveTick()',context)};
}
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};}

test('Explicit fixed mode and corrupt stored preferences do not poll',async()=>{
  for(const liveEnabled of [null,'true',false]) {
    const h=harness({liveEnabled});await flush();await h.tick();
    assert.equal(h.calls(),0);assert.equal(h.alarms.size,0);
  }
});
test('Concurrent alarm/heartbeat claim the lock before storage awaits',async()=>{
  const gate=deferred();const h=harness({liveEnabled:true},{generateLive:()=>gate.promise});await flush();
  const ticks=[h.tick(),h.tick(),h.tick()];await flush();assert.equal(h.calls(),1);
  gate.resolve({snapshot});await Promise.all(ticks);assert.equal(h.local.liveSnapshot,snapshot);
});
test('Disabling live during a pending response discards the result',async()=>{
  const gate=deferred();const h=harness({liveEnabled:true},{generateLive:()=>gate.promise});await flush();
  const pending=h.tick();await flush();h.local.liveEnabled=false;gate.resolve({snapshot});await pending;
  assert.equal(h.local.liveSnapshot,undefined);
});
test('Bad server data and failures retain the last good snapshot and back off',async()=>{
  for(const generateLive of [async()=>({snapshot:{format:1}}),async()=>{throw new TypeError('Invalid response');}]) {
    const h=harness({liveEnabled:true,liveSnapshot:snapshot,liveStatus:null},{generateLive});await flush();await h.tick();
    assert.equal(h.local.liveSnapshot,snapshot);assert.equal(h.local.liveStatus.state,'error');assert.equal(h.local.liveStatus.waitMin,1);
  }
});
test('Same height with a changed epoch refreshes instead of trusting stale listings',async()=>{
  let refreshed=0;
  const h=harness({liveEnabled:true,liveSnapshot:snapshot,liveStatus:{state:'ok',epoch:1,checkedAt:Date.now()-61000}}, {fetchJson:async()=>({lastHeight:snapshot.snapshot.height,epoch:2}),generateLive:async()=>{refreshed++;return {snapshot};}});
  await flush();await h.tick();assert.equal(refreshed,1);assert.equal(h.local.liveStatus.epoch,2);
});
test('Upgrade removes malformed and null snapshots without crashing',async()=>{
  const h=harness({snapshot:null,liveSnapshot:{format:1}});await flush();await h.events.installed();
  assert.equal(h.local.snapshot,undefined);assert.equal(h.local.liveSnapshot,undefined);
});
test('Message validation rejects untrusted sender and unsafe heights before any sync',async()=>{
  const h=harness();await flush();let response;
  assert.equal(h.events.message({type:'shn-sync',height:0},{id:'other'},r=>response=r),false);assert.equal(response,undefined);
  for(const height of [null,-1,NaN,Infinity,'tip',Number.MAX_SAFE_INTEGER+1]) {
    h.events.message({type:'shn-sync',height},{id:'test'},r=>response=r);assert.equal(response.error,'bad-height');
  }
  assert.equal(h.calls(),0);
});

test('Concurrent selection messages serialize, cap at four and never invoke APIs',async()=>{
 const h=harness();await flush();const ids=Object.keys(snapshot.items).slice(0,5);
 const request=msg=>new Promise(resolve=>h.events.message(msg,{id:'test'},resolve));
 const results=await Promise.all(ids.map(id=>request({type:'shn-compare',action:'toggle',id})));
 assert.equal(h.local.nakaComparison.length,4);assert.equal(results[4].state,'full');assert.equal(h.calls(),0);
 const missing=await request({type:'shn-compare',action:'toggle',id:'bad'});assert.equal(missing.state,'missing');
 await request({type:'shn-compare',action:'clear'});assert.equal(h.local.nakaComparison.length,0);
 await request({type:'shn-open-compare',url:'https://untrusted.invalid'});assert.equal(h.events.created.url,'chrome-extension://test/workspace/index.html');
 let response;assert.equal(h.events.message({type:'shn-compare',action:'clear'},{id:'other'},r=>response=r),false);assert.equal(response,undefined);
});

test('Default live starts from a tool heartbeat even without a visible market tab',async()=>{
 const h=harness();await flush();let response;
 h.events.message({type:'shn-visible'},{id:'test',url:'chrome-extension://test/workspace/index.html'},r=>response=r);await flush();
 assert.equal(response.ok,true);assert.equal(h.calls(),1);assert.equal(h.local.liveSnapshot,snapshot);assert.equal(h.alarms.size,1);
 assert.equal(h.local.liveStatus.state,'ok');
});

test('Fixed height loads cannot run in live mode; historical success preserves the mode and exact height',async()=>{
 for(const enabled of [false,true]){
  let generated=0;const h=harness({liveEnabled:enabled},{generate:async()=>{generated++;return {snapshot};}});await flush();let response;
  h.events.message({type:'shn-sync',height:snapshot.snapshot.height},{id:'test'},r=>response=r);await flush();
  if(enabled){assert.equal(response.error,'live-mode');assert.equal(generated,0);assert.equal(h.local.snapshot,undefined);}
  else{assert.equal(response.ok,true);assert.equal(generated,1);assert.equal(h.local.snapshot.snapshot.height,snapshot.snapshot.height);assert.equal(h.local.syncStatus.state,'done');assert.equal(h.local.liveEnabled,false);}
 }
});
test('A no-change automatic pulse keeps the exact batch without rebuilding it',async()=>{
 const before=Date.now()-61000;let generated=0;const h=harness({liveEnabled:true,liveSnapshot:snapshot,liveStatus:{state:'ok',epoch:7,checkedAt:before}}, {fetchJson:async()=>({lastHeight:snapshot.snapshot.height,epoch:7}),generateLive:async()=>{generated++;return {snapshot};}});await flush();await h.tick();
 assert.equal(generated,0);assert.equal(h.local.liveSnapshot,snapshot);assert.equal(h.local.liveStatus.state,'ok');assert.equal(h.local.liveStatus.epoch,7);assert.ok(h.local.liveStatus.checkedAt>before);
});
test('A fixed-height load queues behind an in-flight live request instead of rejecting the mode switch',async()=>{
 const gate=deferred();let manual=0;const h=harness({liveEnabled:true},{generateLive:()=>gate.promise,generate:async()=>{manual++;return {snapshot};}});await flush();const live=h.tick();await flush();
 h.local.liveEnabled=false;let response;h.events.message({type:'shn-sync',height:snapshot.snapshot.height},{id:'test'},r=>response=r);await flush();assert.equal(response.ok,true);assert.equal(manual,0);
 gate.resolve({snapshot});await live;await flush();assert.equal(manual,1);assert.equal(h.local.snapshot,snapshot);assert.equal(h.local.liveSnapshot,undefined);assert.equal(h.local.liveEnabled,false);
});

test('Confirmed fixed selection changes mode and data atomically only after a valid load',async()=>{
 for(const enabled of [true,false]){
  const gate=deferred(),old={...snapshot,snapshot:{...snapshot.snapshot,height:snapshot.snapshot.height-1}};
  const h=harness({liveEnabled:enabled,snapshot:old},{generate:()=>gate.promise});await flush();let response;
  h.events.message({type:'shn-set-fixed',height:snapshot.snapshot.height},{id:'test'},r=>response=r);await flush();
  assert.equal(response.ok,true);assert.equal(h.local.liveEnabled,enabled);assert.equal(h.local.snapshot,old);
  h.events.message({type:'shn-set-fixed',height:snapshot.snapshot.height},{id:'test'},r=>response=r);assert.equal(response.error,'busy');
  gate.resolve({snapshot});await flush();assert.equal(h.local.liveEnabled,false);assert.equal(h.local.snapshot,snapshot);assert.equal(h.local.syncStatus.state,'done');
 }
});
test('Failed or mismatched fixed selection preserves the original mode and data',async()=>{
 for(const generate of [async()=>{throw Error('Failed');},async()=>({snapshot:{...snapshot,snapshot:{...snapshot.snapshot,height:1}}})]){
  const h=harness({liveEnabled:true,snapshot},{generate});await flush();
  h.events.message({type:'shn-set-fixed',height:snapshot.snapshot.height},{id:'test'},()=>{});await flush();
  assert.equal(h.local.liveEnabled,true);assert.equal(h.local.snapshot,snapshot);assert.equal(h.local.syncStatus.state,'error');
 }
});
