'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const SRC = require('../src/lib/source.js');

const fixture = height => ({ format:1, collection:{slug:'shielded-nakas-mupv6wja',name:'Shielded Nakas',cid:'public',rulesInscriptionId:'rules',numberStart:0}, snapshot:{height,indexerHeight:200,collectionFloor:100,listings:1,generatedAt:'2026-10-09T00:00:00Z'},traits:[['Hair','Red',125,1]],items:{['a'.repeat(64)+'i0']:[0,0]} });
const BUNDLED = fixture(100), LIVE=fixture(200), MANUAL=fixture(150);

test('实时开关：没设置过默认实时；非布尔值安全关闭', () => {
  assert.equal(SRC.LIVE_DEFAULT, true);
  assert.equal(SRC.resolveLive(undefined), true);
  assert.equal(SRC.resolveLive(false), false);
  assert.equal(SRC.resolveLive('yes'), false);
  assert.equal(SRC.resolveLive(null), false);
});

test('显示哪份数据：实时开且有实时数据 → 实时；否则手动；都没有 → 内置；格式不符的不用', () => {
  assert.equal(SRC.choose({ liveEnabled: true, live: LIVE, manual: MANUAL }, BUNDLED).source, 'live');
  assert.equal(SRC.choose({ liveEnabled: false, live: LIVE, manual: MANUAL }, BUNDLED).source, 'synced');
  // 实时刚开、第一份实时数据还没到：先用手上已有的数据
  assert.equal(SRC.choose({ liveEnabled: true, live: undefined, manual: MANUAL }, BUNDLED).source, 'synced');
  assert.equal(SRC.choose({ liveEnabled: true, live: undefined, manual: undefined }, BUNDLED).source, 'bundled');
  assert.equal(SRC.choose({ liveEnabled: true, live: { format: 0 }, manual: undefined }, BUNDLED).source, 'bundled');
  assert.equal(SRC.choose({ liveEnabled: true, live: LIVE, manual: undefined }, BUNDLED).snap, LIVE);
});

test('要不要检查：开关开、100 秒内有页面可见、距上次满 1 分钟、不在退避期', () => {
  const now = 1_000_000;
  const base = { enabled: true, now, visibleAt: now - 10_000, lastCheckAt: now - 61_000, nextAt: undefined };
  assert.equal(SRC.shouldCheck(base), true);
  assert.equal(SRC.shouldCheck({ ...base, enabled: false }), false);
  assert.equal(SRC.shouldCheck({ ...base, visibleAt: undefined }), false);
  assert.equal(SRC.shouldCheck({ ...base, visibleAt: now - 101_000 }), false);
  assert.equal(SRC.shouldCheck({ ...base, lastCheckAt: now - 30_000 }), false);
  assert.equal(SRC.shouldCheck({ ...base, lastCheckAt: undefined }), true);
  assert.equal(SRC.shouldCheck({ ...base, nextAt: now + 1 }), false);
  assert.equal(SRC.shouldCheck({ ...base, nextAt: now }), true);
});

test('退避：1, 2, 4, 8, 16, 30, 30 分钟；Retry-After 更长时照办', () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7].map((n) => SRC.backoffMinutes(n, null)), [1, 2, 4, 8, 16, 30, 30]);
  assert.equal(SRC.backoffMinutes(1, 600), 10);
  assert.equal(SRC.backoffMinutes(5, 60), 16);
  assert.throws(() => SRC.backoffMinutes(0, null));
});

test('失败原因分类：限流 / 服务端 / 其它 HTTP / 网络 / 数据校验', () => {
  const f = (status) => Object.assign(new Error('x'), { isFetch: true, status });
  assert.equal(SRC.classify(f(429)), 'rate-limit');
  assert.equal(SRC.classify(f(503)), 'server');
  assert.equal(SRC.classify(f(404)), 'http');
  assert.equal(SRC.classify(f(null)), 'network');
  assert.equal(SRC.classify(new Error('挂单 x 的资产号非法')), 'data');
});


test('Adversarial persisted snapshots fail closed without dereferencing corrupt data', () => {
  assert.equal(SRC.isSnapshot(BUNDLED), true);
  const mutations = [
    s => s.snapshot=null, s => s.items=null, s => s.collection=null, s => s.traits=null,
    s => s.snapshot.collectionFloor=0, s => s.snapshot.collectionFloor=NaN,
    s => s.snapshot.height=201, s => s.snapshot.generatedAt='bad',
    s => s.snapshot.listings=2, s => s.collection.slug='other',
    s => s.traits[0][2]=99, s => s.traits[0][3]=0, s => s.traits[0][2]=null,
    s => s.traits.push([...s.traits[0]]), s => s.traits[0][0]='Shielded #',
    s => s.items[Object.keys(s.items)[0]]=[0,99], s => s.items[Object.keys(s.items)[0]]=[0,0,0],
    s => s.items[Object.keys(s.items)[0]]=[-1,0], s => s.items.bad=[1,0],
    s => s.items['b'.repeat(64)+'i0']=[0,0], s => s.traits[0][1]='x'.repeat(513),
  ];
  for (const mutate of mutations) {
    const s=structuredClone(BUNDLED); mutate(s);
    assert.equal(SRC.isSnapshot(s),false);
    assert.equal(SRC.choose({liveEnabled:true,live:s,manual:s},BUNDLED).source,'bundled');
  }
  for (const s of [null,undefined,{},[],1,'bad',{format:1}]) assert.equal(SRC.isSnapshot(s),false);
});


test('Malformed progress and backoff records are ignored rather than crashing UI', () => {
  for (const value of [null,1,'bad',{}, {state:'done'}, {state:'running',stage:'meta',done:2,total:1}, {state:'error',message:null}]) assert.equal(SRC.statusOf(value,'manual'),undefined);
  for (const value of [null,{}, {state:'ok'}, {state:'error',failures:NaN}, {state:'error',checkedAt:1,nextAt:2,waitMin:1,failures:1,kind:'invalid',status:null,message:'x'}]) assert.equal(SRC.statusOf(value,'live'),undefined);
  assert.equal(SRC.statusOf({state:'done',height:0},'manual').height,0);
});


test('A matching slug does not allow a different collection identity to replace data', () => {
  const wrong=structuredClone(LIVE);wrong.collection.cid='another';
  assert.equal(SRC.choose({liveEnabled:true,live:wrong,manual:wrong},BUNDLED).source,'bundled');
});

test('Optional block metadata is bound to the selected height; legacy and unavailable timestamps remain valid',()=>{
  const s=structuredClone(BUNDLED);assert.equal(SRC.isSnapshot(s),true);
  s.snapshot.blockTime=null;assert.equal(SRC.isSnapshot(s),true);
  const b={height:s.snapshot.height,hash:'a'.repeat(64),timestamp:1791471100};
  s.snapshot.blockTime=b;assert.equal(SRC.isSnapshot(s),true);
  for(const bad of [{...b,height:101},{...b,hash:'bad'},{...b,timestamp:'1791471100'},{...b,timestamp:0},{...b,timestamp:0x100000000},[],true]) {
    s.snapshot.blockTime=bad;assert.equal(SRC.isSnapshot(s),false);
  }
});

test('Listing details must exactly reproduce snapshot floors/counts; malformed or inconsistent quotes fail closed',()=>{
  const s=structuredClone(BUNDLED);s.offers=[['a'.repeat(64)+'i0',100]];s.traits[0][2]=100;
  assert.equal(SRC.isSnapshot(s),true);
  const bad=[x=>x.offers=null,x=>x.offers=[],x=>x.offers.push(x.offers[0]),x=>x.offers[0][0]='b'.repeat(64)+'i0',x=>x.offers[0][1]=0,x=>x.offers[0][1]='100',x=>x.offers[0][1]=101,x=>x.traits[0][2]=125];
  for(const mutate of bad){const x=structuredClone(s);mutate(x);assert.equal(SRC.isSnapshot(x),false);}
});
test('Optional trait sale history rejects future heights, invalid prices, wrong order, extra old sales and duplicate or absent traits',()=>{
  const s=structuredClone(BUNDLED);delete s.saleHistory;const h=s.snapshot.height;
  assert.equal(SRC.isSnapshot({...s,saleHistory:[[0,[[125,h],[124,h-5],[200,h-9]]]]}),true);
  assert.equal(SRC.isSnapshot({...s,saleHistory:[[0,[[125,h],[124,h-5],[200,h-9],[201,h-9]]]]}),true,'same-block ties with the third sale may remain');
  for(const saleHistory of [null,[[0,[]]],[[0,[[0,h]]]],[[0,[['125',h]]]],[[0,[[125,h+1]]]],[[99999,[[125,h]]]],[[0,[[125,h]]],[0,[[126,h]]]],[[0,[[125,h-5],[124,h]]]],[[0,[[125,h],[124,h-5],[200,h-9],[201,h-10]]]]])
    assert.equal(SRC.isSnapshot({...s,saleHistory}),false);
  assert.equal(SRC.isSnapshot({...s,sales:[[0,125,99]]}),false,'the former single-sale basis is replaced by a fresh sync');
});
test('Pending catalog rows use valid traits and never repeat a minted number',()=>{
  const sb={};require('node:vm').runInNewContext(require('node:fs').readFileSync(require.resolve('../src/data/snapshot.js'),'utf8'),sb);
  const s=structuredClone(sb.SHNAKAS_SNAPSHOT);const minted=Object.values(s.items)[0][0];
  assert.equal(SRC.isSnapshot(s),true);assert.ok(Array.isArray(s.pending)&&s.pending.length>0);
  for(const pending of [[],[[minted,0]],[[s.pending[0][0],99999]],[[s.pending[0][0],0,0]],[[-1,0]],'x'])assert.equal(SRC.isSnapshot({...s,pending}),false);
});

test('Persisted official trait basis is height-bound and credits require an active listing',()=>{
  const s=structuredClone(BUNDLED),id=Object.keys(s.items)[0];s.offers=[[id,100]];s.traits[0][2]=100;
  s.rewardBasis={height:100,traits:[[0,0,'ask',1]]};s.credits=[[id,0]];assert.equal(SRC.isSnapshot(s),true);
  for(const mutate of [x=>x.rewardBasis.height++,x=>x.rewardBasis.traits[0][1]=12,x=>x.rewardBasis.traits[0][2]='sales',x=>x.rewardBasis.traits[0][3]=0,x=>x.rewardBasis.extra='no',x=>x.credits[0][1]=-1,x=>x.credits.push(x.credits[0]),x=>x.credits[0][0]='b'.repeat(64)+'i0']){
    const bad=structuredClone(s);mutate(bad);assert.equal(SRC.isSnapshot(bad),false);
  }
});

test('Optional reward events reject future, foreign, duplicate and private-shaped data',()=>{
  const fs=require('fs'),vm=require('vm'),c={};vm.runInNewContext(fs.readFileSync(require.resolve('../src/data/snapshot.js'),'utf8'),c);const s=JSON.parse(JSON.stringify(c.SHNAKAS_SNAPSHOT)),SRC=require('../src/lib/source'),id=Object.keys(s.items)[0];
  const good={...s,rewardEvents:[[id,s.snapshot.height,'cancel']]};assert.equal(SRC.isSnapshot(good),true);
  for(const row of [[id,s.snapshot.height+1,'cancel'],['foreign',1,'sale'],[id,1,'owner'],[id,1,'cancel','private']])assert.equal(SRC.isSnapshot({...s,rewardEvents:[row]}),false);
  assert.equal(SRC.isSnapshot({...s,rewardEvents:[good.rewardEvents[0],good.rewardEvents[0]]}),false);
});
