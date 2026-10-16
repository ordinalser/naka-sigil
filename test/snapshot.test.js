'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { activeListingsAt, floorsOf, artTraits, knownTraits, buildSnapshot, generate, generateLive, fetchJson } = require('../src/lib/snapshot-core.js');

const note = (txid, height) => ({ txid, height, pos: 0, kind: 'buy' });
const listing = (nf, assetId, price, height, extra = {}) => ({
  nf, assetId, price: String(price), height, state: 'ACTIVE', soldTxid: null, claimTxid: null, closedTxid: null, ...extra,
});
test('Trait sale history keeps the three newest confirmed sales, ties with the third, and excludes future sales and withdrawals',()=>{
  const C=require('../src/lib/snapshot-core.js'),traits=new Map([[1,[['Hair','Rare']]],[2,[['Hair','Rare'],['Body','Ape']]]]);
  const sold=(name,asset,p,h)=>listing(name,asset,p,1,{state:'SOLD',soldTxid:name,soldHeight:h});
  const ls=[sold('a',1,100,10),sold('b',2,200,20),sold('c',1,300,30),sold('d',2,400,40),sold('future',1,999,90),listing('withdraw',1,900,1,{state:'CLAIMED',claimTxid:'claim',claimHeight:21})];
  assert.deepEqual(C.saleHistoryAt(ls,50,traits).get('Hair\0Rare'),[[400,40],[300,30],[200,20]]);
  assert.deepEqual(C.saleHistoryAt(ls,50,traits).get('Body\0Ape'),[[400,40],[200,20]]);
  assert.deepEqual(C.saleHistoryAt(ls,25,traits).get('Hair\0Rare'),[[200,20],[100,10]]);
  assert.equal(C.saleHistoryAt(ls,9,traits).size,0);
  assert.deepEqual(C.saleHistoryAt([...ls,sold('tie',1,250,20)],35,traits).get('Hair\0Rare'),[[300,30],[200,20],[250,20]],'a same-block tie at the third sale stays');
  assert.throws(()=>C.saleHistoryAt([listing('x',1,100,5,{state:'SOLD',soldTxid:'x',soldHeight:4})],50,traits));
  assert.throws(()=>C.saleHistoryAt([listing('x',1,100,5,{state:'SOLD',soldTxid:'x'})],50,traits));
});

test('还原指定高度的有效挂单：上架高度 ≤ H，关闭高度 > H', () => {
  const notes = [note('buy1', 20), note('claim1', 30)];
  const ls = [
    listing('a', 1, 1000, 10, { state: 'SOLD', soldTxid: 'buy1' }),     // [10, 20)
    listing('b', 2, 2000, 15, { state: 'CLAIMED', claimTxid: 'claim1' }), // [15, 30)
    listing('c', 3, 3000, 25),                                            // [25, ∞)
  ];
  const at = (H) => activeListingsAt(ls, notes, H).map((l) => l.nf).join(',');
  assert.equal(at(9), '');
  assert.equal(at(10), 'a');
  assert.equal(at(19), 'a,b');
  assert.equal(at(20), 'b');        // 成交所在区块确认后即已关闭
  assert.equal(at(25), 'b,c');
  assert.equal(at(30), 'c');
});

test('数据不一致时抛错，不产出半成品', () => {
  assert.throws(() => activeListingsAt([listing('x', 1, 1, 5, { state: 'SOLD', soldTxid: 'missing' })], [], 10), /不在 notes 里/);
  assert.throws(() => activeListingsAt([listing('x', 1, 1, 5, { state: 'CLOSED', closedTxid: 't' })], [note('t', 6)], 10), /未知/);
  assert.throws(() => activeListingsAt([listing('x', 1, 1, 5, { closedTxid: 't' })], [note('t', 6)], 10), /却带有 closedTxid/);
  assert.throws(() => activeListingsAt([listing('x', 1, 1, 5, { state: 'SOLD' })], [], 10), /缺少 soldTxid/);
  assert.throws(() => activeListingsAt([listing('x', 1, 1, null)], [], 10), /缺少上架高度/);
  assert.throws(() => activeListingsAt([], [note('t', 1), note('t', 2)], 10), /高度不一致/);
  assert.throws(() => activeListingsAt([listing('x', 1, 1, 9, { state: 'SOLD', soldTxid: 'early' })], [note('early', 8)], 10), /早于上架高度/);
});

test('地板价：集合地板取全体最低价，特征地板取带该特征挂单的最低价', () => {
  const traits = new Map([
    [1, [['Hoodie', 'White'], ['Eyes', 'VR']]],
    [2, [['Hoodie', 'White'], ['Eyes', 'Visor']]],
    [3, [['Hoodie', 'Red'], ['Eyes', 'VR']]],
  ]);
  const { collectionFloor, floors } = floorsOf([listing('a', 1, 5000, 1), listing('b', 2, 3000, 1), listing('c', 3, 1000, 1)], traits);
  assert.equal(collectionFloor, 1000);
  assert.deepEqual(floors.get('Hoodie\u0000White'), { floor: 3000, listed: 2 });
  assert.deepEqual(floors.get('Eyes\u0000VR'), { floor: 1000, listed: 2 });
  assert.equal(floors.get('Eyes\u0000Visor').floor, 3000);
  assert.throws(() => floorsOf([], traits), /没有任何有效挂单/);
  assert.throws(() => floorsOf([listing('d', 99, 1, 1)], traits), /没有元数据/);
  assert.throws(() => floorsOf([listing('e', 1, '1.5', 1)], traits), /价格非法/);
});

test('美术特征：剔除与编号一致的 "Shielded #"，编号不符直接抛错', () => {
  const meta = { attributes: [{ trait_type: 'Body', value: 'Pepe' }, { trait_type: 'Shielded #', value: '567' }], shielded: { number: 567 } };
  assert.deepEqual(artTraits(meta, 567, 567), [['Body', 'Pepe']]);
  assert.deepEqual(artTraits({ attributes: [{ trait_type: 'Body', value: 'Pepe' }] }, 0, 0), [['Body', 'Pepe']]);
  assert.throws(() => artTraits(meta, 567, 568), /不符/);
  assert.throws(() => artTraits({ attributes: [{ trait_type: 'Shielded #', value: '1' }] }, 1, 1), /没有任何美术特征/);
});

test('组装快照：无挂单特征 floor 为 null，藏品行 = [编号, 特征下标…]', () => {
  const traitsByAsset = new Map([[0, [['Body', 'Pepe'], ['Eyes', 'VR']]], [1, [['Body', 'Ape'], ['Eyes', 'VR']]]]);
  const snap = buildSnapshot({
    collection: { slug: 's' }, height: 100, indexerHeight: 101, generatedAt: 'T',
    active: [listing('a', 1, 2000, 50)], traitsByAsset, numberStart: 0,
    inscriptionByAsset: new Map([[0, 'aaai0'], [1, 'bbbi0']]),
  });
  assert.equal(snap.snapshot.collectionFloor, 2000);
  assert.equal(snap.snapshot.listings, 1);
  const byName = Object.fromEntries(snap.traits.map((t, i) => [t[0] + ':' + t[1], { i, t }]));
  assert.deepEqual(byName['Body:Pepe'].t, ['Body', 'Pepe', null, 0]);
  assert.deepEqual(byName['Body:Ape'].t, ['Body', 'Ape', 2000, 1]);
  assert.deepEqual(snap.items.aaai0, [0, byName['Body:Pepe'].i, byName['Eyes:VR'].i]);
  assert.deepEqual(snap.items.bbbi0, [1, byName['Body:Ape'].i, byName['Eyes:VR'].i]);
});

test('组装快照：同一铭文对应多个资产时抛错', () => {
  assert.throws(() => buildSnapshot({
    collection: { slug: 's' }, height: 1, indexerHeight: 1, generatedAt: 'T',
    active: [listing('a', 0, 1000, 1)], traitsByAsset: new Map([[0, [['Body', 'A']]], [1, [['Body', 'B']]]]), numberStart: 0,
    inscriptionByAsset: new Map([[0, 'dupi0'], [1, 'dupi0']]),
  }), /同时对应多个资产/);
});

test('已有快照的特征索引：同一铭文在两份快照里不一致时抛错', () => {
  const base = { format: 1, traits: [['Body', 'Pepe', null, 0], ['Eyes', 'VR', 1000, 1]], items: { aai0: [0, 0, 1] } };
  assert.deepEqual(knownTraits([base]).get('aai0'), { number: 0, traits: [['Body', 'Pepe'], ['Eyes', 'VR']] });
  const other = { format: 1, traits: [['Body', 'Ape', null, 0]], items: { aai0: [0, 0] } };
  assert.throws(() => knownTraits([base, other]), /不一致/);
  assert.throws(() => knownTraits([{ ...base, format: 2 }]), /格式/);
});

// 用假的 fetch 跑一遍完整编排：集合 3 件，其中 2 件的特征来自已有快照，只有新铸造的 1 件去拉元数据
function fakeChain({ lastHeight = 100 } = {}) {
  const calls = [];
  const col = { cid: 'c1', rulesInscriptionId: 'r', global: { start: 0 }, children: { 0: 'aai0', 1: 'bbi0', 2: 'cci0' } };
  const state = {
    cid: 'c1', lastHeight,
    listings: [
      { nf: 'L1', assetId: 0, price: '1000', height: 10, state: 'ACTIVE', soldTxid: null, claimTxid: null, closedTxid: null },
      { nf: 'L2', assetId: 2, price: '3000', height: 20, state: 'SOLD', soldTxid: 'buy', claimTxid: null, closedTxid: null, soldHeight: 50 },
    ],
    notes: [{ txid: 'buy', height: 50, pos: 0 }],
  };
  const meta = { attributes: [{ trait_type: 'Body', value: 'Alien' }, { trait_type: 'Shielded #', value: '2' }], shielded: { number: 2 } };
  const fetch = async (url) => {
    calls.push(url);
    const body = url.endsWith('/collection') ? col : url.endsWith('/state') ? state : url.includes('/meta/2?') ? meta : null;
    return { ok: body !== null, status: body ? 200 : 404, headers: { get: () => null }, json: async () => body };
  };
  return { fetch, calls };
}
const BASE = { format: 1, traits: [['Body', 'Pepe', null, 0], ['Body', 'Ape', null, 0]], items: { aai0: [0, 0], bbi0: [1, 1] } };

test('同步编排：复用已知特征，只给新藏品拉元数据，按指定高度还原挂单', async () => {
  const { fetch, calls } = fakeChain();
  const saved = globalThis.fetch;
  globalThis.fetch = fetch;
  try {
    const stages = [];
    const { snapshot, metaFetched } = await generate({ height: 30, bases: [BASE], generatedAt: () => 'T', onProgress: (p) => stages.push(p.stage) });
    assert.equal(metaFetched, 1);
    assert.equal(calls.filter((u) => u.includes('/meta/')).length, 1);
    assert.deepEqual([...new Set(stages)], ['state', 'meta', 'build']);
    // 高度 30：L1（10 上架、未关闭）与 L2（20 上架、50 才成交）都有效 → 集合地板 1000，Alien 地板 3000
    assert.equal(snapshot.snapshot.collectionFloor, 1000);
    assert.equal(snapshot.snapshot.listings, 2);
    const alien = snapshot.traits.find((t) => t[1] === 'Alien');
    assert.deepEqual(alien, ['Body', 'Alien', 3000, 1]);
    assert.equal(snapshot.items.cci0[0], 2);
    // 高度 60：L2 已成交，只剩 L1
    const later = await generate({ height: 60, bases: [BASE], generatedAt: () => 'T', onProgress: () => {} });
    assert.equal(later.snapshot.snapshot.listings, 1);
    assert.deepEqual(later.snapshot.traits.find((t) => t[1] === 'Alien'), ['Body', 'Alien', null, 0]);
  } finally {
    globalThis.fetch = saved;
  }
});

test('同步编排：高度超过索引器、已有快照编号与链上不符，都直接报错', async () => {
  const saved = globalThis.fetch;
  globalThis.fetch = fakeChain({ lastHeight: 100 }).fetch;
  try {
    await assert.rejects(generate({ height: 101, bases: [BASE], generatedAt: () => 'T', onProgress: () => {} }), /还没被索引/);
    const wrong = { ...BASE, items: { aai0: [5, 0], bbi0: [1, 1] } };
    await assert.rejects(generate({ height: 30, bases: [wrong], generatedAt: () => 'T', onProgress: () => {} }), /编号是 5/);
  } finally {
    globalThis.fetch = saved;
  }
});

// ------------------------------------------------------------ 实时：/listings + /pulse
const BASE_LIVE = {
  format: 1, collection: { slug: 's', cid: 'c1', numberStart: 0 },
  traits: [['Body', 'Pepe', null, 0], ['Body', 'Ape', null, 0]], items: { aai0: [0, 0], bbi0: [1, 1] },
};
const ID = (c) => c.repeat(64) + 'i0';
const BASE_REAL = { ...BASE_LIVE, items: { [ID('a')]: [0, 0], [ID('b')]: [1, 1] } };
function liveFetch({ heights = [100], listings, inscribed = 2, children, meta, state, weights }) {
  const calls = [];
  let pulseN = 0;
  const fetch = async (url) => {
    calls.push(url.replace(/^.*\/api\/shielded/, ''));
    let body = null;
    if (url.endsWith('/pulse')) { body = { lastHeight: heights[Math.min(pulseN, heights.length - 1)], epoch: 'e', inscribed }; pulseN += 1; }
    else if (url.endsWith('/listings')) body = listings;
    else if (url.endsWith('/collection')) body = { cid: 'c1', global: { start: 0 }, children };
    else if (url.includes('/state')) body = state??null;
    else if (url.endsWith('/rewards/weights/now')) body = weights??null;
    else if (url.includes('/meta/')) body = meta;
    return { ok: body !== null, status: body ? 200 : 404, headers: { get: () => null }, json: async () => body };
  };
  return { fetch, calls };
}
const L = (nf, id, assetId, price, listedAt) => ({ nf, inscriptionId: id, assetId, price: String(price), listedAt, pending: false, cancelling: false });
async function withFetch(f, fn) {
  const saved = globalThis.fetch;
  globalThis.fetch = f;
  try { return await fn(); } finally { globalThis.fetch = saved; }
}

test('实时快照：挂单按确认高度计入；补读成交历史失败时保留有效地板', async () => {
  const chain = liveFetch({ heights: [100], listings: [L('x', ID('a'), 0, 1000, 90), L('y', ID('b'), 1, 3000, 100), L('z', ID('b'), 1, 500, 101)] });
  const res = await withFetch(chain.fetch, () => generateLive({ before: { lastHeight: 100, epoch: 'e', inscribed: 2 }, bases: [BASE_REAL], generatedAt: () => 'T' }));
  assert.deepEqual(chain.calls, ['/listings', '/pulse', '/state?since=999999999', 'https://blockstream.info/api/blocks/100', '/rewards/weights/now']);
  assert.equal(res.metaFetched, 0);
  assert.equal(res.snapshot.saleHistory, undefined, 'failed history read leaves sale-dependent branches unknown');
  assert.equal(res.snapshot.snapshot.height, 100);
  assert.equal(res.snapshot.snapshot.listings, 2);          // 101 上架的那条还没确认，不计入
  assert.equal(res.snapshot.snapshot.collectionFloor, 1000);
  assert.deepEqual(res.snapshot.traits.find((t) => t[1] === 'Ape'), ['Body', 'Ape', 3000, 1]);
});

test('实时快照：读取期间又出了新块 → 返回 null，不产出数据', async () => {
  const chain = liveFetch({ heights: [101], listings: [L('x', ID('a'), 0, 1000, 90)] });
  const res = await withFetch(chain.fetch, () => generateLive({ before: { lastHeight: 100, epoch: 'e', inscribed: 2 }, bases: [BASE_REAL], generatedAt: () => 'T' }));
  assert.equal(res, null);
});
test('Live sale history comes only from same-height /state; another height or a failed read leaves it absent',async()=>{
  const sold=listing('sale',1,1250,10,{state:'SOLD',soldTxid:'tx',soldHeight:90});
  for(const [state,expected] of [[{cid:'c1',lastHeight:100,listings:[sold]},[[1250,90]]],[{cid:'c1',lastHeight:99,listings:[sold]},undefined],[undefined,undefined]]) {
    const chain=liveFetch({listings:[L('x',ID('a'),0,1000,90)],state});
    const res=await withFetch(chain.fetch,()=>generateLive({before:{lastHeight:100,epoch:'e'},bases:[BASE_REAL],generatedAt:()=> 'T'}));
    assert.equal(res.snapshot.snapshot.collectionFloor,1000);
    assert.equal(res.snapshot.sales,undefined,'the former single-sale field is never produced');
    const idx=res.snapshot.traits.findIndex(t=>t[1]==='Ape');
    assert.deepEqual(res.snapshot.saleHistory?.find(([i])=>i===idx)?.[1],expected);
  }
});
test('实时快照：有新铸造的藏品才读 /collection 并补拉元数据', async () => {
  const chain = liveFetch({
    heights: [100], inscribed: 3,
    listings: [L('x', ID('c'), 2, 700, 99)],
    children: { 0: ID('a'), 1: ID('b'), 2: ID('c') },
    meta: { attributes: [{ trait_type: 'Body', value: 'Alien' }], shielded: { number: 2 } },
  });
  const res = await withFetch(chain.fetch, () => generateLive({ before: { lastHeight: 100, epoch: 'e', inscribed: 3 }, bases: [BASE_REAL], generatedAt: () => 'T' }));
  assert.deepEqual(chain.calls, ['/listings', '/pulse', '/collection', '/meta/2?c=c1', '/state?since=999999999', 'https://blockstream.info/api/blocks/100', '/rewards/weights/now']);
  assert.equal(res.metaFetched, 1);
  assert.deepEqual(res.snapshot.items[ID('c')].slice(0, 1), [2]);
  assert.equal(res.snapshot.snapshot.collectionFloor, 700);
});

test('实时快照：挂单的资产号与已知编号不符、字段缺失时报错', async () => {
  const bad = liveFetch({ heights: [100], listings: [L('x', ID('a'), 5, 1000, 90)] });
  await assert.rejects(withFetch(bad.fetch, () => generateLive({ before: { lastHeight: 100, epoch: 'e', inscribed: 2 }, bases: [BASE_REAL], generatedAt: () => 'T' })), /不符/);
  const noHeight = liveFetch({ heights: [100], listings: [{ ...L('x', ID('a'), 0, 1000, 90), listedAt: null }] });
  await assert.rejects(withFetch(noHeight.fetch, () => generateLive({ before: { lastHeight: 100, epoch: 'e', inscribed: 2 }, bases: [BASE_REAL], generatedAt: () => 'T' })), /listedAt/);
});

test('请求失败：实时只试 1 次；错误带 isFetch、状态码与 Retry-After', async () => {
  let n = 0;
  const limited = async () => { n += 1; return { ok: false, status: 429, headers: { get: (h) => (h === 'retry-after' ? '120' : null) }, json: async () => null }; };
  const err = await withFetch(limited, () => fetchJson('https://x/api/shielded/pulse', 1).catch((e) => e));
  assert.equal(n, 1);
  assert.equal(err.isFetch, true);
  assert.equal(err.status, 429);
  assert.equal(err.retryAfterSec, 120);
  const down = async () => { throw new TypeError('fetch failed'); };
  const err2 = await withFetch(down, () => fetchJson('https://x/api/shielded/pulse', 1).catch((e) => e));
  assert.equal(err2.status, null);
  assert.equal(err2.retryAfterSec, null);
});

test('元数据重复特征与分隔符拒绝入库，避免重复加成或错误合并', () => {
  const a = { trait_type: 'Eyes', value: '3D Glasses' };
  assert.throws(() => artTraits({ attributes: [a, a] }, 1, 1), /重复特征/);
  assert.throws(() => artTraits({ attributes: [{ trait_type: 'Eyes', value: 'A\u0000B' }] }, 1, 1), /分隔符/);
});


test('Adversarial prices and duplicate active assets cannot fabricate a collection floor', () => {
  const traits=new Map([[1,[['Body','A']]]]);
  for (const price of [true,false,null,{},[], ' 1 ', '0x10', '1e3', 'Infinity', '-1', 0, Number.MAX_SAFE_INTEGER+1]) {
    assert.throws(()=>floorsOf([{...listing('x',1,1,1),price}],traits));
  }
  assert.throws(()=>floorsOf([listing('x',1,100,1),listing('y',1,1,1)],traits),/Duplicate/);
  assert.throws(()=>activeListingsAt([listing('x',1,1,-1)],[],1));
  assert.throws(()=>activeListingsAt([],[note('x',-1)],1));
});


test('429 is not retried immediately; Retry-After dates and malformed JSON are classified safely', async () => {
  let calls=0;const retry=new Date(Date.now()+180000).toUTCString();
  const e=await withFetch(async()=>{calls++;return {ok:false,status:429,headers:{get:()=>retry}};},()=>fetchJson('https://example.invalid').catch(e=>e));
  assert.equal(calls,1);assert.equal(e.status,429);assert.ok(e.retryAfterSec>=178&&e.retryAfterSec<=180);
  const bad=await withFetch(async()=>({ok:true,json:async()=>{throw new SyntaxError('Invalid JSON');}}),()=>fetchJson('https://example.invalid',1).catch(e=>e));
  assert.equal(bad.isFetch,false);
});


test('An unknown inscription cannot borrow an existing asset number and corrupt floors', async () => {
  const chain=liveFetch({heights:[100],listings:[L('spoof',ID('c'),0,1,90)],children:{0:ID('a'),1:ID('b')}});
  await assert.rejects(withFetch(chain.fetch,()=>generateLive({before:{lastHeight:100,epoch:'e',inscribed:2},bases:[BASE_REAL],generatedAt:()=> 'T'})),/inscription differs/);
});

test('Block time lookup validates height, hash and seconds; API failure remains optional',async()=>{
  const {readBlockTime,BLOCK_API}=require('../src/lib/snapshot-core.js');
  const block={height:970502,id:'a'.repeat(64),timestamp:1791471100};let calls=0;
  const result=await withFetch(async(url,opts)=>{calls++;assert.equal(url,`${BLOCK_API}/blocks/970502`);assert.equal(opts.credentials,'omit');assert.equal(opts.cache,'no-store');return {ok:true,json:async()=>[block]};},()=>readBlockTime(970502));
  assert.deepEqual(result,{height:block.height,hash:block.id,timestamp:block.timestamp});assert.equal(calls,1);
  for(const rows of [[],{},[{...block,height:970501}],[{...block,id:'bad'}],[{...block,timestamp:NaN}],[{...block,timestamp:0x100000000}]]) {
    assert.equal(await withFetch(async()=>({ok:true,json:async()=>rows}),()=>readBlockTime(970502)),null);
  }
  assert.equal(await withFetch(async()=>{throw new TypeError('network');},()=>readBlockTime(970502)),null);
  assert.equal(await withFetch(async()=>({ok:false,status:429}),()=>readBlockTime(970502)),null);
  assert.equal(await readBlockTime(-1),null);
});

test('Official current reward basis reconciles trait units, canonical supply and every piece at the same block',()=>{
  const C=require('../src/lib/snapshot-core.js'),R=require('../src/lib/rules.js');
  const s={...BASE_REAL,collection:{...BASE_REAL.collection,numberStart:1000},snapshot:{height:100,collectionFloor:1000},traits:[['Body','Pepe',1000,1],['Body','Ape',null,0]],items:{[ID('a')]:[1000,0],[ID('b')]:[1001,1]}};
  const data={height:100,F:'1000',values:[{type:'Body',value:'Pepe',floor:'1000',pct:0,source:'ask',pieces:3},{type:'Body',value:'Ape',floor:null,pct:50,source:'sales',pieces:4}],pieces:[{p:0,pct:100,weight:4},{p:1,pct:150,weight:6}]};
  const verified=C.attachRewardBasis(s,data);
  assert.equal(R.evaluateSnapshot(verified,ID('b')).lo.weight,150);assert.equal(R.evaluateSnapshot(verified,ID('b')).traits[0].method,'official-sales');
  assert.equal(s.rewardBasis,undefined,'does not mutate an accepted snapshot');
  const carried=structuredClone(data);carried.values[1].source='lastBlock';
  assert.equal(R.evaluateSnapshot(C.attachRewardBasis(s,carried),ID('b')).traits[0].method,'official-lastBlock');
  for(const change of [v=>v.source='unknownFutureSource',v=>v.pieces=20,v=>v.pct=101]){const bad=structuredClone(carried);change(bad.values[1]);assert.throws(()=>C.attachRewardBasis(s,bad),'Keep strict checks around the newly supported source');}

  for(const mutate of [x=>x.height++,x=>x.F='999',x=>x.values[0].pct=25,x=>x.values[1].source='ask',x=>x.values[1].pieces=0,x=>x.pieces[1].pct=200,x=>x.pieces[1].weight='6',x=>x.pieces.push(x.pieces[0])]){
    const bad=structuredClone(data);mutate(bad);assert.throws(()=>C.attachRewardBasis(s,bad));
  }
  const none=structuredClone(data);none.values[1]={...none.values[1],source:'none',pct:0};none.pieces[1]={p:1,weight:4,pct:100};assert.equal(R.evaluateSnapshot(C.attachRewardBasis(s,none),ID('b')).exact,true);
});

test('Listing credits are optional output metadata: known zero survives while unavailable values are omitted',()=>{
  const snap=buildSnapshot({collection:{},height:100,indexerHeight:100,generatedAt:'T',active:[{assetId:0,price:'1000',tickets:0}],traitsByAsset:new Map([[0,[['Body','Pepe']]]]),numberStart:0,inscriptionByAsset:new Map([[0,ID('a')]])});
  assert.deepEqual(snap.credits,[[ID('a'),0]]);
  const absent=buildSnapshot({collection:{},height:100,indexerHeight:100,generatedAt:'T',active:[{assetId:0,price:'1000'}],traitsByAsset:new Map([[0,[['Body','Pepe']]]]),numberStart:0,inscriptionByAsset:new Map([[0,ID('a')]])});
  assert.equal(absent.credits,undefined);
});

test('Public reward exits retain only known IDs, closed heights and kinds at the selected block',()=>{
  const C=require('../src/lib/snapshot-core'),a=ID('a'),b=ID('b'),ids=new Map([[1,a],[2,b]]);
  const ls=[listing('sale',1,100,1,{state:'SOLD',soldTxid:'buy'}),listing('cancel',1,200,2,{state:'CLAIMED',claimTxid:'return'}),listing('unknown',3,100,1,{state:'SOLD',soldTxid:'other'}),listing('active',2,100,1)];
  const notes=[note('buy',10),note('return',20),note('other',9)];
  assert.deepEqual(C.rewardEventsAt(ls,notes,15,ids),[[a,10,'sale']]);
  assert.deepEqual(C.rewardEventsAt(ls,notes,20,ids),[[a,20,'cancel']]);
  assert.deepEqual(C.rewardEventsAt(ls,notes,8,ids),[]);
});
