'use strict';
// lib/pouch.js: the numbers read off the page, the worker's readings and the dialog's line. The page marks themselves
// are checked in a browser (the private release checks).
const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../src/lib/pouch.js');

test('pouch: the site\'s figures read back, anything else refused', () => {
  assert.equal(P.parseSats('266 sats'), 266);
  assert.equal(P.parseSats(' 1,179.5 sats '), 1179.5);
  assert.equal(P.parseSats('267 sats / SHNAKAS'), 267);
  for (const bad of ['', 'sats', '0 sats', '266', '0.0009 BTC$68.44', '266 sats$0.2023', '1,2,3 sats', null, 42]) assert.equal(P.parseSats(bad), null, String(bad));
  assert.equal(P.parseBtc('0.005'), 500000);
  assert.equal(P.parseBtc('.001'), 100000);
  assert.equal(P.parseBtc('1'), 100000000);
  assert.equal(P.parseBtc('0.00028965'), 28965);
  for (const bad of ['', '.', '0', '0.0', '0.000000001', '1.2.3', 'abc', '-1', '1e-3', null]) assert.equal(P.parseBtc(bad), null, String(bad));
  // example pouches (#6, #314, #888, #1500, #2700) with made-up sizes and prices, not anyone's pouch or a real sale
  assert.equal(P.parseSize('400 SHNAKAS钱袋 #888 · 领取'), 400);
  assert.equal(P.parseSize('1,250 SHNAKAS'), 1250);
  assert.equal(P.parseSize('40.5 SHNAKAS'), 40.5);
  for (const bad of ['SHNAKAS 400', '400SHNAKAS', '0 SHNAKAS', '']) assert.equal(P.parseSize(bad), null, bad);
  assert.equal(P.pouchId('400 SHNAKAS钱袋 #888 · 领取'), 888);
  assert.equal(P.pouchId('Pouch # 1,500 · Trait bonus'), 1500);
  assert.equal(P.pouchId('no number'), null);
});

test('pouch: dollars and sats written as the site writes them', () => {
  // the site's formatUsdPrice: whole dollars from 1,000, cents from 1, four decimals under
  assert.equal(P.formatUsd(1234.6), '$1,235');
  assert.equal(P.formatUsd(12.934), '$12.93');
  assert.equal(P.formatUsd(0.20234), '$0.2023');
  assert.throws(() => P.formatUsd(NaN));
  assert.equal(P.formatSats(512.4), '512');
  assert.equal(P.formatSats(1179.5), '1,180');
  assert.equal(P.formatSats(40.567), '40.57');
});

test('pouch: the market kept from the site\'s listings and sales; the floor leaves out one being bought and the pouch itself', () => {
  const listings = [
    { assetId: 6, price: '30000', saleFee: '1000', lotSize: '10000000000', pending: false, offchain: true, settleFee: '330' }, // 300 a SHNAKAS
    { assetId: 1500, price: '25000', saleFee: '1000', lotSize: '10000000000', pending: true },       // 250, being bought
    { assetId: 2700, price: '28000', lotSize: '10000000000' },                                       // 280, no platform fee of its own
    { assetId: 5, price: '1000', lotSize: '100000000', cancelling: true },                           // being cancelled: left out
    { assetId: 'x', price: '1', lotSize: '1' }, { assetId: 7, price: '0', lotSize: '1' }, null,      // malformed: left out
  ];
  const sales = { lastHeight: 974020, sales: [
    { assetId: 314, price: '9000', lotSize: '3000000000', at: 1000, height: 974000 },
    { assetId: 888, price: '27000', lotSize: '10000000000', at: 3000, height: 974010 }, // the newest by `at`
    { price: '20000', lotSize: '10000000000', at: 2000, height: 974020 },              // no pouch: not kept as a sale
    { price: 'bad', lotSize: '1', at: 9000 },
  ] };
  const m = P.marketOf(listings, sales, 42);
  assert.deepEqual(m.listings, [[6, 300, false, 30000, 31330, 100], [1500, 250, true, 25000, 26000, 100], [2700, 280, false, 28000, null, 100]]);
  assert.equal(m.fetchedAt, 42);
  assert.equal(m.lastHeight, 974020);
  assert.equal('last' in m, false, 'the newest sale is no longer kept: nothing shows it');
  assert.deepEqual(m.sold, [[314, 974000, 9000, 3000000000], [888, 974010, 27000, 10000000000]]);
  assert.equal(P.floorOf(m, null), 280, 'the cheapest nobody is buying (#1500 left out)');
  assert.equal(P.floorOf(m, 2700), 300, 'the pouch being repriced left out');
  assert.equal(P.floorOf({ listings: [[1, 100, true]] }, null), null);
  assert.throws(() => P.marketOf({}, sales, 0), /not a list/);
  assert.throws(() => P.marketOf([], { sales: 'x' }, 0), /no sales list/);
});

test('pouch: the sales kept for the activity list: each once, the newest by block, an earlier version\'s market read whole', () => {
  // made-up sales of the example pouches, not anyone's
  assert.deepEqual(P.saleOf([314, 974000, 40000, 15000000000]), { id: 314, height: 974000, price: 40000, perToken: 40000 * 1e8 / 15000000000, size: 150 });
  for (const bad of [null, [], [314, 974000, 40000], ['314', 974000, 40000, 1], [314, -1, 40000, 1], [314, 974000, 0, 1], [314, 974000, 1.5, 1], [314, 974000, 40000, 0], [314, 974000, 40000, 1, 9]]) assert.equal(P.saleOf(bad), null, JSON.stringify(bad));
  const kept = [[6, 973990, 30000, 10000000000], [314, 974000, 40000, 15000000000]];
  const fresh = [[314, 974000, 40000, 15000000000], [888, 974010, 27000, 10000000000], ['x', 1, 1, 1]];
  assert.deepEqual(P.mergeSold(kept, fresh), [[888, 974010, 27000, 10000000000], [314, 974000, 40000, 15000000000], [6, 973990, 30000, 10000000000]], 'a sale read again is kept once; newest block first; a malformed row left out');
  assert.deepEqual(P.mergeSold(undefined, fresh), [[888, 974010, 27000, 10000000000], [314, 974000, 40000, 15000000000]], 'an earlier version kept no sales: only those just read');
  const many = Array.from({ length: P.MAX_SOLD + 5 }, (_, i) => [6, 900000 + i, 30000, 10000000000]);
  const capped = P.mergeSold([], many);
  assert.equal(capped.length, P.MAX_SOLD);
  assert.equal(capped[capped.length - 1][1], 900005, 'the oldest five left out');
  // a market kept by an earlier version (no sales): none to look up, never a throw
  assert.deepEqual(P.freshMarket({ listings: [], fetchedAt: 5 }, 5).sold, []);
  assert.deepEqual(P.freshMarket({ listings: [], fetchedAt: 5, sold: kept }, 5).sold, kept);
});

test('pouch: a price per SHNAKAS used only when the site writes it as the figure shown; the dollars are the exact price\'s', () => {
  // #314: 40,000 sats for 150 SHNAKAS = 266.67 a SHNAKAS, which the site writes "267 sats"
  const per = 40000 * 1e8 / 15000000000;
  assert.equal(P.asShown(per, 267), per);
  assert.equal(P.asShown(per, 266), null);
  assert.equal(P.asShown(null, 267), null);
  assert.equal(P.asShown(per, null), null);
  assert.equal(P.asShown(40.567, 40.57), 40.567, 'under 100: two decimals, as the site writes them');
  assert.notEqual(P.formatUsd(per / 1e8 * 76050), P.formatUsd(267 / 1e8 * 76050), 'the rounded figure would give other dollars');
  assert.equal(P.samePer([{ perToken: 300 }, { perToken: 300 }]), 300, 'two alike (same price, same size): the same price per SHNAKAS');
  assert.equal(P.samePer([{ perToken: 300 }, { perToken: 301 }]), null);
  assert.equal(P.samePer([]), null);
  assert.equal(P.samePer(undefined), null);
  // the index: a pouch listed twice is not trusted; listings and sales by their look
  const market = P.freshMarket({ fetchedAt: 9, listings: [[6, 300, false, 30000, 31330, 100], [2700, 280, false, 112000, 114570, 400], [2700, 290, false, 116000, 118650, 400]], sold: [[314, 974000, 40000, 15000000000], [314, 974100, 40000, 15000000000], ['bad']] }, 9);
  const ix = P.indexOf(market);
  assert.equal(ix.byId.get(6).perToken, 300);
  assert.equal(ix.byId.get(2700), null);
  assert.equal(ix.byLook.get('0.0003|100').length, 1);
  assert.equal(ix.soldById.get(314).length, 2);
  assert.equal(P.samePer(ix.soldByLook.get('0.0004|150')), per, 'the same pouch sold twice at one price: one price per SHNAKAS');
  assert.equal(P.indexOf(market), ix, 'built once per kept market');
});

test('pouch: a listing\'s total before network fee as the site\'s buy panel works it out', () => {
  // price + its own platform fee + an instant listing's seller payout fee (a positive whole number, at most 20,000)
  // made-up listings, not anyone's
  assert.equal(P.totalOf({ price: '45000', saleFee: '1000', offchain: true, settleFee: '410' }), 46410);
  assert.equal(P.totalOf({ price: '45000', saleFee: '1000', offchain: true, settleFee: '25000' }), 66000);
  assert.equal(P.totalOf({ price: '45000', saleFee: '1000', offchain: false, settleFee: '410' }), 46000, 'a listing on chain: no payout fee');
  for (const settleFee of [undefined, '0', '-5', '1.5', 'x']) assert.equal(P.totalOf({ price: '45000', saleFee: '1000', offchain: true, settleFee }), 46000, String(settleFee));
  // no platform fee of its own (the site would work one out from the collection's rules), or a price not whole: none
  for (const l of [{ price: '45000' }, { price: '45000', saleFee: '0' }, { price: '45000', saleFee: '12.5' }, { price: '4.5e4', saleFee: '1000' }, { price: '0', saleFee: '1000' }]) assert.equal(P.totalOf(l), null, JSON.stringify(l));
});

test('pouch: a kept price or market used only while fresh; a price only if positive; kept rows read as data', () => {
  const now = 10_000_000;
  assert.equal(P.usdOf({ usd: 76050, at: now - P.PRICE_FRESH_MS }, now), 76050);
  assert.equal(P.usdOf({ usd: 76050, at: now - P.PRICE_FRESH_MS - 1 }, now), null);
  assert.equal(P.usdOf({ usd: 76050, at: now + 120_000 }, now), null, 'a time ahead of the clock');
  for (const bad of [null, undefined, {}, { usd: 0, at: now }, { usd: -1, at: now }, { usd: '76050', at: now }, { usd: 76050 }]) assert.equal(P.usdOf(bad, now), null);
  assert.equal(P.freshMarket({ listings: [], fetchedAt: now - 1 }, now) !== null, true);
  assert.equal(P.freshMarket({ listings: [], fetchedAt: now - P.MARKET_FRESH_MS - 1 }, now), null);
  assert.equal(P.freshMarket({ fetchedAt: now }, now), null);
  // kept data written wrong (another version, a damaged store): no newest sale, odd listing rows skipped, never a throw
  const odd = P.freshMarket({ listings: [[1, '279', false], [2, Infinity, false], 'x', [3, 300, false]], fetchedAt: now, last: { perToken: 270 } }, now);
  assert.equal('last' in odd, false, 'a newest sale kept by an earlier build is not read');
  assert.equal(P.floorOf(odd, null), 300);
  assert.equal(P.lowWarning('zh', { perToken: 140, market: odd, exceptId: 9 }), P.TEXT.zh.low, 'odd rows skipped: the floor is 300');
  assert.equal(P.lowWarning('zh', { perToken: 150, market: odd, exceptId: 9 }), null);
  // a row kept by the earlier version (three fields): its price, total and size unknown
  assert.deepEqual(P.rowOf([6, 300, false]), { id: 6, perToken: 300, pending: false, price: null, total: null, size: null });
  assert.deepEqual(P.rowOf([6, 300, true, 30000, 31330, 100]), { id: 6, perToken: 300, pending: true, price: 30000, total: 31330, size: 100 });
  assert.deepEqual(P.rowOf([6, 300, false, 1.5, -1, 'x']), { id: 6, perToken: 300, pending: false, price: null, total: null, size: null });
  for (const bad of [null, [], ['6', 300], [6, 0], [6, NaN]]) assert.equal(P.rowOf(bad), null, JSON.stringify(bad));
  const [gecko, coinbase, mempool] = P.PRICE_SOURCES;
  assert.equal(P.priceFrom(gecko, { bitcoin: { usd: 76050 } }), 76050);
  assert.equal(P.priceFrom(coinbase, { data: { amount: '76050.12' } }), 76050.12);
  assert.equal(P.priceFrom(mempool, { USD: 76049 }), 76049);
  for (const bad of [null, {}, { bitcoin: { usd: 0 } }, { bitcoin: { usd: 'x' } }]) assert.equal(P.priceFrom(gecko, bad), null);
  assert.equal(P.priceFrom(coinbase, { data: { amount: 'abc' } }), null);
  assert.deepEqual(P.PRICE_SOURCES.map((s) => s.name), ['coingecko', 'coinbase', 'mempool'], 'the site\'s own order');
});

test('pouch: BTC and sizes written as the site writes them; a listing found by its number or by its look', () => {
  // the site's formatBtcPrice and fmtTokens
  assert.equal(P.formatBtc(45000), '0.00045');
  assert.equal(P.formatBtc(46410), '0.0004641');
  assert.equal(P.formatBtc(1234567), '0.012346');
  assert.equal(P.formatBtc(150000000), '1.5');
  assert.equal(P.formatTokens(40.5), '40.50');
  assert.equal(P.formatTokens(181.37), '181');
  assert.equal(P.formatTokens(1250), '1,250');
  assert.equal(P.parseBtcText('0.00045 BTC ($34.22)'), 45000);
  assert.equal(P.parseBtcText(' 0.0004641 BTC'), 46410);
  for (const bad of ['BTC 0.0006', '$45.63', '0.000000001 BTC', '']) assert.equal(P.parseBtcText(bad), null, bad);
  assert.equal(P.parseSatsEach('266 sats 每 SHNAKAS'), 266);
  assert.equal(P.parseSatsEach('1,180 sats per SHNAKAS'), 1180);
  for (const bad of ['266 sats', '266 sats / SHNAKAS', '266 sats 每枚', 'sats 每 SHNAKAS']) assert.equal(P.parseSatsEach(bad), null, bad);
  const market = { listings: [[6, 300, false, 30000, 31330, 100], [314, 400, false, 80000, 82000, 200], [888, 400, false, 80000, 82000, 200.4], [2700, 280, false, 28000, null, 100], [2700, 290, false, 29000, null, 100]], last: null };
  assert.equal(P.listingOf(market, 6).total, 31330);
  assert.equal(P.listingOf(market, 1500), null);
  assert.equal(P.listingOf(market, 2700), null, 'two listings for one pouch: not trusted');
  assert.equal(P.listingByLook(market, '0.0003', '100').id, 6);
  assert.equal(P.listingByLook(market, '0.0008', '200'), null, 'two alike (#314 and #888 both read 200 at 0.0008 BTC): none');
  assert.equal(P.listingByLook(market, '0.0004', '100'), null);
});

test('pouch: only the dollars the site leaves out, in its own words; no figure of the extension\'s making', () => {
  const market = { listings: [[6, 279, false, 27900, 29230, 100], [314, 100, false]] };
  // a price per SHNAKAS in dollars, the site's own "per SHNAKAS" after it; the list dialog's marked "≈"
  assert.deepEqual(P.perView('zh', { perToken: 500, usd: 76050, approx: true }), { value: '≈ $0.3803', unit: '每 SHNAKAS', title: P.TEXT.zh.usdTitle });
  assert.deepEqual(P.perView('en', { perToken: 1250, usd: 76050 }), { value: '$0.9506', unit: 'per SHNAKAS', title: P.TEXT.en.usdTitle });
  assert.equal(P.perView('zh', { perToken: 500, usd: null }), null, 'no dollar price: nothing (the site already writes the sats)');
  // the change-price dialog's new price: per SHNAKAS and the whole pouch
  assert.deepEqual(P.repriceView('zh', { sats: 500000, perToken: 1250, usd: 76050 }), { value: '$0.9506', unit: '每 SHNAKAS · 整袋 ≈ $380.25', title: P.TEXT.zh.usdTitle });
  assert.equal(P.repriceView('en', { sats: 500000, perToken: 1250, usd: null }), null);
  // a balance or a pouch not listed, at the floor
  const shop = { listings: [[6, 279, false, 27900, 29230, 100], [2700, 300, false]] };
  assert.deepEqual(P.worthView('zh', { size: 200, usd: 76050, market: shop }), { label: '按地板价', value: '≈ $42.44', title: P.TEXT.zh.atFloorTitle });
  assert.equal(P.worthView('zh', { size: 200, usd: 76050, market }).value, '≈ $15.21', 'the floor counts every pouch on offer (#314 at 100)');
  assert.equal(P.worthView('zh', { size: 200, usd: null, market: shop }), null);
  assert.equal(P.worthView('zh', { size: 200, usd: 76050, market: { listings: [] } }), null);
  // the warning: under half the floor (this pouch left out), no percentage; at or over half, nothing
  assert.equal(P.lowWarning('zh', { perToken: 50, market, exceptId: 314 }), '不到地板价的一半：价格是整袋的（BTC），少打了一个 0？');
  assert.equal(P.lowWarning('en', { perToken: 50, market, exceptId: 314 }), 'Under half the floor: the price is for the whole pouch, in BTC. A zero missing?');
  assert.equal(P.lowWarning('zh', { perToken: 140, market, exceptId: 314 }), null);
  assert.equal(P.lowWarning('zh', { perToken: 50, market: null, exceptId: 314 }), null);
  assert.throws(() => P.perView('fr', { perToken: 1, usd: 1 }), /no words/);
  // nothing compares a pouch with the floor or the last sale, or works out a price per SHNAKAS with the fees in
  for (const lang of ['zh', 'en']) for (const words of Object.values(P.TEXT[lang])) assert.doesNotMatch(String(words), /比地板|比最新|实付|vs floor|Against|You pay/);
  assert.equal(typeof P.percent, 'undefined');
});

test('pouch: the pages the worker keeps the figures fresh for', () => {
  assert.equal(P.pouchPage('/secondary/collections/shnakas'), true);
  assert.equal(P.pouchPage('/wallet'), true);
  assert.equal(P.pouchPage('/secondary/collections/shielded-nakas-mupv6wja'), false);
  assert.equal(P.pouchPage('/secondary/collections/shnakas/x'), false);
});
