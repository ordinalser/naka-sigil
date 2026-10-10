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
  const context={self:{ShnakasSnapshot:core,ShnakasSource:SRC,SHNAKAS_SNAPSHOT:snapshot},importScripts(){},setInterval,clearInterval,Date,
    chrome:{storage:{local:area(local),session:area(session),onChanged:event('change')},runtime:{id:'test',onInstalled:event('installed'),onStartup:event('startup'),onMessage:event('message'),getPlatformInfo:async()=>({})},alarms:{get:async n=>alarms.get(n),create:async(n,a)=>alarms.set(n,a),clear:async n=>alarms.delete(n),onAlarm:event('alarm')}}};
  vm.createContext(context);vm.runInContext(fs.readFileSync(require.resolve('../src/sw/sync-sw.js'),'utf8'),context);
  return {local,context,events,alarms,calls:()=>calls,tick:()=>vm.runInContext('liveTick()',context)};
}
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};}

test('Worker default is offline; corrupt stored preferences do not opt in',async()=>{
  for(const liveEnabled of [undefined,null,'true',false]) {
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
  for(const height of [-1,NaN,Infinity,'tip',Number.MAX_SAFE_INTEGER+1]) {
    h.events.message({type:'shn-sync',height},{id:'test'},r=>response=r);assert.equal(response.error,'bad-height');
  }
  assert.equal(h.calls(),0);
});
