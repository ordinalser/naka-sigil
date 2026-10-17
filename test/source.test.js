'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const SRC = require('../src/lib/source.js');

const ID = 'a'.repeat(64)+'i0';
const fixture = height => ({ format:1, collection:{slug:'shielded-nakas-mupv6wja',name:'Shielded Nakas',cid:'public',rulesInscriptionId:'rules',numberStart:0}, snapshot:{height,indexerHeight:200,collectionFloor:100,listings:1,generatedAt:'2026-10-09T00:00:00Z'},traits:[['Hair','Red',100,1]],items:{[ID]:[0,0]},offers:[[ID,100]] });
const BUNDLED = fixture(100), LIVE=fixture(200);

test('显示哪份数据：有可用的实时数据 → 实时；否则内置；格式不符或另一个集合的不用', () => {
  assert.equal(SRC.choose({ live: LIVE }, BUNDLED).source, 'live');
  assert.equal(SRC.choose({ live: LIVE }, BUNDLED).snap, LIVE);
  assert.equal(SRC.choose({ live: undefined }, BUNDLED).source, 'bundled');
  assert.equal(SRC.choose({ live: { format: 0 } }, BUNDLED).source, 'bundled');
  assert.equal(SRC.choose({ live: { ...LIVE, offers: undefined } }, BUNDLED).source, 'bundled', 'listings are required');
});

test('要不要检查：100 秒内有页面可见、距上次满 1 分钟、不在退避期', () => {
  const now = 1_000_000;
  const base = { now, visibleAt: now - 10_000, lastCheckAt: now - 61_000, nextAt: undefined };
  assert.equal(SRC.shouldCheck(base), true);
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
    s => s.items['b'.repeat(64)+'i0']=[0,0], s => s.traits[0][1]='x'.repeat(513), s => delete s.offers,
  ];
  for (const mutate of mutations) {
    const s=structuredClone(BUNDLED); mutate(s);
    assert.equal(SRC.isSnapshot(s),false);
    assert.equal(SRC.choose({live:s},BUNDLED).source,'bundled');
  }
  for (const s of [null,undefined,{},[],1,'bad',{format:1}]) assert.equal(SRC.isSnapshot(s),false);
});


test('Malformed progress and backoff records are ignored rather than crashing UI', () => {
  for (const value of [null,1,'bad',{}, {state:'done'}, {state:'running',stage:'meta',done:2,total:1}, {state:'error',message:null}]) assert.equal(SRC.statusOf(value,'history'),undefined);
  for (const value of [null,{}, {state:'ok'}, {state:'error',failures:NaN}, {state:'error',checkedAt:1,nextAt:2,waitMin:1,failures:1,kind:'invalid',status:null,message:'x'}]) assert.equal(SRC.statusOf(value,'live'),undefined);
  assert.equal(SRC.statusOf({state:'done',height:0},'history').height,0);
});


test('A matching slug does not allow a different collection identity to replace data', () => {
  const wrong=structuredClone(LIVE);wrong.collection.cid='another';
  assert.equal(SRC.choose({live:wrong},BUNDLED).source,'bundled');
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
  const s=structuredClone(BUNDLED);
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
  // Only traits under 20 catalog pieces are priced from sales, so only they may carry a history.
  const big=structuredClone(s);for(let i=1;i<20;i++)big.items[String(i).padStart(64,'c')+'i0']=[i,0];
  assert.equal(SRC.isSnapshot({...big,saleHistory:[[0,[[125,h]]]]}),false);
  const ties=Array.from({length:25},(_,i)=>[125+i,h]);assert.equal(SRC.isSnapshot({...s,saleHistory:[[0,ties]]}),true,'any number of sales tied in one block');
  assert.equal(SRC.isSnapshot({...s,sales:[[0,125,99]]}),false,'the former single-sale basis is replaced by a fresh sync');
});
test('Pending catalog rows use valid traits and never repeat a minted number',()=>{
  const sb={};require('node:vm').runInNewContext(require('node:fs').readFileSync(require.resolve('../src/data/snapshot.js'),'utf8'),sb);
  const s=structuredClone(sb.SHNAKAS_SNAPSHOT);const minted=Object.values(s.items)[0][0];
  assert.equal(SRC.isSnapshot(s),true);assert.ok(Array.isArray(s.pending)&&s.pending.length>0);
  for(const pending of [[],[[minted,0]],[[s.pending[0][0],99999]],[[s.pending[0][0],0,0]],[[-1,0]],'x'])assert.equal(SRC.isSnapshot({...s,pending}),false);
});

test('Persisted official trait basis is height-bound and credits require an active listing',()=>{
  const s=structuredClone(BUNDLED),id=Object.keys(s.items)[0];
  s.rewardBasis={height:100,traits:[[0,0,'ask',1]]};s.credits=[[id,0]];assert.equal(SRC.isSnapshot(s),true);
  for(const mutate of [x=>x.rewardBasis.height++,x=>x.rewardBasis.traits[0][1]=12,x=>x.rewardBasis.traits[0][2]='sales',x=>x.rewardBasis.traits[0][3]=0,x=>x.rewardBasis.extra='no',x=>x.credits[0][1]=-1,x=>x.credits.push(x.credits[0]),x=>x.credits[0][0]='b'.repeat(64)+'i0']){
    const bad=structuredClone(s);mutate(bad);assert.equal(SRC.isSnapshot(bad),false);
  }
});

test('Optional reward events reject future, foreign, duplicate and private-shaped data',()=>{
  const fs=require('fs'),vm=require('vm'),c={};vm.runInNewContext(fs.readFileSync(require.resolve('../src/data/snapshot.js'),'utf8'),c);const s=JSON.parse(JSON.stringify(c.SHNAKAS_SNAPSHOT)),SRC=require('../src/lib/source'),id=Object.keys(s.items)[0];
  const good={...s,rewardEvents:[[id,s.snapshot.height,'cancel',s.snapshot.height-3]]};assert.equal(SRC.isSnapshot(good),true);
  for(const row of [[id,s.snapshot.height+1,'cancel',1],['foreign',1,'sale',1],[id,1,'owner',1],[id,1,'cancel','private'],[id,1,'cancel'],[id,5,'sale',6]])assert.equal(SRC.isSnapshot({...s,rewardEvents:[row]}),false);
  assert.equal(SRC.isSnapshot({...s,rewardEvents:[good.rewardEvents[0],good.rewardEvents[0]]}),false);
});

test('Listings already closing must be active listings, each once, as a sale or a reclaim',()=>{
  const s=structuredClone(BUNDLED);assert.equal(SRC.isSnapshot({...s,closing:[[ID,'sale']]}),true);assert.equal(SRC.isSnapshot({...s,closing:[[ID,'cancel']]}),true);
  for(const closing of [null,[[ID,'sold']],[['b'.repeat(64)+'i0','sale']],[[ID,'sale'],[ID,'cancel']],[[ID]]])assert.equal(SRC.isSnapshot({...s,closing}),false);
});

test('A between-block closing record applies to its own block only, names active listings once, and reuses one merged object',()=>{
  const live=structuredClone(LIVE),h=live.snapshot.height;
  const a=SRC.withClosing(live,{height:h,rows:[[ID,'sale']]});assert.deepEqual(a.closing,[[ID,'sale']]);assert.notEqual(a,live);
  assert.equal(SRC.withClosing(live,{height:h,rows:[[ID,'sale']]}),a,'same content, same object: page caches survive');
  assert.deepEqual(SRC.withClosing(live,{height:h,rows:[]}).closing,[],'nothing closing any more replaces the block read');
  for(const record of [undefined,null,{height:h-1,rows:[[ID,'sale']]},{height:h,rows:[['b'.repeat(64)+'i0','sale']]},{height:h,rows:[[ID,'sold']]},{height:h,rows:[[ID,'sale'],[ID,'cancel']]},{height:h,rows:'x'}])
    assert.equal(SRC.withClosing(live,record),live);
  assert.equal(SRC.choose({live,closing:{height:h,rows:[[ID,'cancel']]}},BUNDLED).snap.closing[0][1],'cancel');
  assert.equal(SRC.choose({live:undefined,closing:{height:100,rows:[[ID,'sale']]}},BUNDLED).snap,BUNDLED,'the bundled data takes no live record');
});

test('Any damaged field of a real snapshot is refused or read, never thrown on (the worker’s upgrade step checks stored data)',()=>{
  const sb={};require('node:vm').runInNewContext(require('node:fs').readFileSync(require.resolve('../src/data/snapshot.js'),'utf8'),sb);
  const real=sb.SHNAKAS_SNAPSHOT;assert.equal(SRC.isSnapshot(real),true);
  const bad=[undefined,null,-1,1.5,'x',{},[null],[[null]]],variants=[];
  for(const [k,v] of Object.entries(real)){
    for(const b of bad)variants.push([`${k}`,s=>{s[k]=b;}]);
    if(Array.isArray(v)&&v.length){
      for(const b of bad)variants.push([`${k}[0]`,s=>{s[k][0]=b;}]);
      if(Array.isArray(v[0]))for(const i of [0,v[0].length-1])for(const b of bad)variants.push([`${k}[0][${i}]`,s=>{s[k][0][i]=b;}]);
    }else if(v&&typeof v==='object')for(const sub of Object.keys(v).slice(0,6))for(const b of bad)variants.push([`${k}.${sub}`,s=>{s[k][sub]=b;}]);
  }
  assert.ok(variants.length>300,String(variants.length));
  for(const [at,mutate] of variants){
    const s=structuredClone(real);mutate(s);let out;
    assert.doesNotThrow(()=>{out=SRC.isSnapshot(s);},at);assert.equal(typeof out,'boolean',at);
    assert.doesNotThrow(()=>SRC.choose({live:s,closing:{height:s?.snapshot?.height,rows:[[null,'sale']]}},real),at);
  }
  // The one that threw before: a pending row that is not a row, with a sale history to count.
  assert.equal(SRC.isSnapshot({...structuredClone(real),saleHistory:[],pending:[null]}),false);
});
