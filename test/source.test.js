'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const SRC = require('../src/lib/source.js');

const fixture = height => ({ format:1, collection:{slug:'shielded-nakas-mupv6wja',name:'Shielded Nakas',cid:'public',rulesInscriptionId:'rules',numberStart:0}, snapshot:{height,indexerHeight:200,collectionFloor:100,listings:1,generatedAt:'2026-10-09T00:00:00Z'},traits:[['Hair','Red',125,1]],items:{['a'.repeat(64)+'i0']:[0,0]} });
const BUNDLED = fixture(100), LIVE=fixture(200), MANUAL=fixture(150);

test('实时开关：没设置过默认关闭；非布尔值安全关闭', () => {
  assert.equal(SRC.LIVE_DEFAULT, false);
  assert.equal(SRC.resolveLive(undefined), false);
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
test('Optional trait sale history rejects future heights, invalid prices, duplicate or absent trait indices',()=>{
  const s=structuredClone(BUNDLED);s.sales=[[0,125,99]];assert.equal(SRC.isSnapshot(s),true);
  for(const sales of [null,[[0,0,99]],[[0,'125',99]],[[0,125,s.snapshot.height+1]],[[99999,125,99]],[[0,125,99],[0,126,98]]])assert.equal(SRC.isSnapshot({...s,sales}),false);
});
