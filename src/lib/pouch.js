/**
 * SHNAKAS pouches on Ord Dropz: what the market and the vault leave out, added beside the site's own figures, in the
 * site's own terms. The site writes a price per SHNAKAS in sats and puts the fees in its totals, not in a price per
 * SHNAKAS; it never compares a pouch with the floor. So the extension adds only the dollars the site does not write (a
 * price per SHNAKAS, a single pouch's total, a balance at the floor), never a figure of its own making (no "what you pay
 * per SHNAKAS", no percentage against the floor or the last sale: with few listings a small gap reads as a large one and
 * only makes buying harder). A figure is written as the site writes its own dollars beside a price, in Naka Sigil's
 * monospace face and soft gold, nothing more (no sigil beside a number: it would read as its unit; its title names
 * Naka Sigil); the market page names Naka Sigil once, small, in the free end of its own tab bar.
 *   - Market (its pouch list, grid, phone cards and activity list; the vault's pouch market grid): the dollar price per
 *     SHNAKAS beside its sats (a row) or under them (a tile or card, whose sats line the site cuts off), from the
 *     pouch's exact price (its listing; in the activity list, its sale), shown only when the site writes that price as
 *     the figure beside it.
 *   - Market buy panel and buy dialog: the price per SHNAKAS (a sweep's average) and a single pouch's total in dollars,
 *     from the listings, the total only when the listing's total is the one shown. The vault market's buy sheet already
 *     writes every fee in dollars: only the price per SHNAKAS, in its own words ("$x 每 SHNAKAS"), as the last line of its
 *     head, lined up with the site's lines there (so are a pouch's own sheets).
 *   - Vault "list SHNAKAS" dialog: the price per SHNAKAS in dollars right after the site's own "N sats 每 SHNAKAS" (marked
 *     "≈": the pouch is not listed yet, so only the site's rounded figures are there to work it out from; under the
 *     site's minimum the site shows no such line, and nothing is added); "change price": the new price per
 *     SHNAKAS and the whole pouch in dollars (the site shows neither for the new price). Either warns when the price per
 *     SHNAKAS is under half the floor (a zero dropped, or the price taken for one SHNAKAS instead of the whole pouch): it
 *     keeps a seller from a mistake and adds nothing to a buyer's view.
 *   - Vault tokens tab: the balance and each pouch not listed at the floor (an estimate, as the vault's home values a
 *     collection); each listed pouch's price per SHNAKAS in dollars. A pouch's own sheet: listed, the same; not listed,
 *     its worth at the floor.
 * The figures come from the page itself (a pouch's size, its price, the price typed in), the market's listings and its
 * sales from the site's public pouch API, and the dollar price from the same three sources the site uses, in
 * the same order (coingecko, coinbase, mempool.space); the worker reads them while a pouch page is visible and keeps them
 * in chrome.storage.local (KEY, PRICE_KEY). No price, or one older than PRICE_FRESH_MS: no dollars (never a stand-in
 * price). Market data older than MARKET_FRESH_MS: no floor, nothing taken from a listing or a sale.
 *
 * Where it lands (2026-11-08, the site's DOM and code): the pouch list and the activity list are table.pp-table, the price
 * per SHNAKAS the row's first td.pp-num reading "266 sats", the pouch a cell "#id", a listing's row with its .pp-rowbuy,
 * a sale's with its .pp-type; a grid tile's .pp-tile-sub reads "267 sats / SHNAKAS", its pouch in .pp-tile-id; a phone
 * card's .pp-card-main > span the same, the size in .pp-card-main > strong and the price in .pp-card-price > strong, a
 * listing's "#id" in a .pp-card-price span (a cart .pp-card-pend instead while someone is buying it), a sale's card
 * (data-static) no pouch; the vault market's tiles .pm-grid .sv-tile-caption > span "266 sats 每 SHNAKAS", the pouch in
 * .sv-tile-number. The buy panel is .pp-trade-body with dl.pp-sum (the price per SHNAKAS first, the total in
 * div[data-total]) and the pouch's "#id" in .pp-unit small (a sweep shows a count there, its price in the .pp-field
 * whose unit is .pp-btc, the pouches ticked marked data-on). A pouch dialog is [role=dialog] with .pm-sheet-head (the pouch's
 * size first, then "#id"); the list dialog has a decimal input and the payout choices .pk-choices; the change-price
 * dialog the head's .pk-badge and a decimal input over its two buttons; a pouch's sheet .pk-actions (not listed) or the
 * head's .pk-badge (listed). The tokens tab: .tk-balance, button.tk-lot (strong: the size; the last span: the listed
 * badge and .sv-money, or the kind and "#id"). The site writes a pouch's size rounded (whole SHNAKAS from 100 up), so a
 * figure worked out from it is marked "≈"; a listed pouch's figures come from its listing instead. Anything not found as
 * described is left alone: no mark, no error. Every node added has the class shn-pouch (so the content script's halt
 * takes it off too) and is checked on every pass: wrong or orphaned, it is corrected or removed.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NakaPouch = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // {fetchedAt, lastHeight, listings: [[pouch, satsPerToken, pending, price, totalBeforeNetworkFee | null, size]],
  //  sold: [[pouch, block, price, lotSize]]}
  const KEY = 'nakaPouchMarket';
  const PRICE_KEY = 'nakaBtcUsd';                // {usd, at, source}
  const SESSION_VISIBLE = 'pouchVisibleAt';      // chrome.storage.session: the last heartbeat from a pouch page
  const MARKET_EVERY_MS = 60 * 1000;             // listings and sales read at most once a minute
  const PRICE_EVERY_MS = 5 * 60 * 1000;          // the dollar price at most every 5 minutes (the site's own cadence)
  const MARKET_FRESH_MS = 10 * 60 * 1000;
  const PRICE_FRESH_MS = 30 * 60 * 1000;
  const LOW_SHARE = 0.5;                         // under half the floor per SHNAKAS: warned
  const UNIT = 100000000;                        // rune units in one SHNAKAS; sats in one BTC
  const MAX_ROWS = 3000;                         // rows, tiles and pouches looked at in one pass, at most
  const MAX_SOLD = 3000;                         // public sales kept (the newest by block) for the activity list's rows
  const SETTLE_FEE_CAP = 20000;                  // the site's settleFeeOf: a seller payout fee counts up to 20,000 sats

  const PRICE_SOURCES = Object.freeze([
    Object.freeze({ name: 'coingecko', url: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd', read: (j) => j?.bitcoin?.usd }),
    Object.freeze({ name: 'coinbase', url: 'https://api.coinbase.com/v2/prices/BTC-USD/spot', read: (j) => parseFloat(j?.data?.amount) }),
    Object.freeze({ name: 'mempool', url: 'https://mempool.space/api/v1/prices', read: (j) => j?.USD }),
  ]);

  // The site's own words where it has them (its zh copy: 每 SHNAKAS, 地板价, 整袋).
  const TEXT = Object.freeze({
    zh: Object.freeze({
      brand: 'Naka Sigil',
      by: 'Naka Sigil：',
      perUnit: '每 SHNAKAS',
      whole: '整袋',
      atFloor: '按地板价',
      low: '不到地板价的一半：价格是整袋的（BTC），少打了一个 0？',
      usdTitle: '每枚的美元价，按这一袋的精确价格算',
      totalTitle: '总计的美元价',
      atFloorTitle: '数量 × 地板价，估算',
      markTitle: '金色的美元价来自 Naka Sigil',
    }),
    en: Object.freeze({
      brand: 'Naka Sigil',
      by: 'Naka Sigil: ',
      perUnit: 'per SHNAKAS',
      whole: 'whole pouch',
      atFloor: 'At floor',
      low: 'Under half the floor: the price is for the whole pouch, in BTC. A zero missing?',
      usdTitle: 'the dollar price per SHNAKAS, from the pouch\'s exact price',
      totalTitle: 'the total in dollars',
      atFloorTitle: 'amount × floor, an estimate',
      markTitle: 'The dollar prices in gold come from Naka Sigil',
    }),
  });

  // ------------------------------------------------------------ numbers

  /** "1,234.5" → 1234.5; anything else → null. */
  function num(text) {
    if (typeof text !== 'string') return null;
    const m = /^\s*(\d{1,3}(?:,\d{3})+|\d+)(\.\d+)?\s*$/.exec(text);
    if (!m) return null;
    const v = Number(m[1].replace(/,/g, '') + (m[2] || ''));
    return Number.isFinite(v) ? v : null;
  }

  /** A price per SHNAKAS as the site writes it: "266 sats", "267 sats / SHNAKAS", "1,179.5 sats" → sats; else null. */
  function parseSats(text) {
    if (typeof text !== 'string') return null;
    const m = /^\s*([\d,]+(?:\.\d+)?)\s*sats(?:\s*\/\s*\S+)?\s*$/.exec(text);
    if (!m) return null;
    const v = num(m[1]);
    return v !== null && v > 0 ? v : null;
  }

  /** The vault market tile's caption: "266 sats 每 SHNAKAS" / "266 sats per SHNAKAS" (the site's zh and en) → sats; else null. */
  function parseSatsEach(text) {
    if (typeof text !== 'string') return null;
    const m = /^\s*([\d,]+(?:\.\d+)?)\s*sats\s+(?:每 SHNAKAS|per SHNAKAS)\s*$/.exec(text);
    if (!m) return null;
    const v = num(m[1]);
    return v !== null && v > 0 ? v : null;
  }

  /** The price typed in (BTC, at most 8 decimals, as the site's input keeps it) → whole sats, positive; else null. */
  function parseBtc(value) {
    if (typeof value !== 'string' || !/^\d*\.?\d{1,8}$/.test(value.trim()) || !/\d/.test(value)) return null;
    const [whole, frac = ''] = value.trim().split('.');
    const sats = Number(whole || '0') * UNIT + Number((frac + '00000000').slice(0, 8));
    return Number.isSafeInteger(sats) && sats > 0 ? sats : null;
  }

  /** A BTC amount as the site writes it, leading its text: "0.00045 BTC", "0.00045 BTC ($34.22)" → sats; else null. */
  function parseBtcText(text) {
    if (typeof text !== 'string') return null;
    const m = /^\s*(\d+(?:\.\d{1,8})?)\s*BTC\b/.exec(text);
    return m ? parseBtc(m[1]) : null;
  }

  /** A size as the site writes it first in a line ("400 SHNAKAS…", "1,234 SHNAKAS", "40.5 SHNAKAS…") → SHNAKAS; else null. */
  function parseSize(text) {
    if (typeof text !== 'string') return null;
    const m = /^\s*([\d,]+(?:\.\d+)?)\s/.exec(text);
    if (!m) return null;
    const v = num(m[1]);
    return v !== null && v > 0 ? v : null;
  }

  /** The pouch's number ("钱袋 #888 · 领取", "Pouch #888", "#888") → 888; else null. */
  function pouchId(text) {
    if (typeof text !== 'string') return null;
    const m = /#\s?(\d[\d,]*)/.exec(text);
    if (!m) return null;
    const v = Number(m[1].replace(/,/g, ''));
    return Number.isSafeInteger(v) ? v : null;
  }

  /** Dollars as the site writes them (its formatUsdPrice): "$1,234", "$12.93", "$0.2023". */
  function formatUsd(v) {
    if (!Number.isFinite(v) || v < 0) throw new Error(`formatUsd: not a dollar amount: ${v}`);
    if (v >= 1000) return `$${Math.round(v).toLocaleString('en-US')}`;
    if (v >= 1) return `$${v.toFixed(2)}`;
    return `$${v.toFixed(4)}`;
  }

  /** Sats per SHNAKAS as the site writes them: whole from 100 up, two decimals under. */
  function formatSats(v) {
    if (!Number.isFinite(v) || v < 0) throw new Error(`formatSats: not an amount: ${v}`);
    return v >= 100 ? Math.round(v).toLocaleString('en-US') : v.toLocaleString('en-US', { maximumFractionDigits: 2 });
  }

  /** BTC as the site writes it (its formatBtcPrice): 8 decimals under 0.01, 6 under 1, else 4; trailing zeros dropped. */
  function formatBtc(sats) {
    if (!Number.isFinite(sats) || sats < 0) throw new Error(`formatBtc: not an amount: ${sats}`);
    const r = sats / UNIT;
    return (r >= 1 ? r.toFixed(4) : r >= 0.01 ? r.toFixed(6) : r.toFixed(8)).replace(/\.?0+$/, '');
  }

  /** A pouch's size as the site writes it (its fmtTokens): two decimals under 100, whole from 100 up. */
  function formatTokens(size) {
    if (!Number.isFinite(size) || size < 0) throw new Error(`formatTokens: not a size: ${size}`);
    const d = size < 100 ? 2 : 0;
    return size.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  }

  /** Sats per SHNAKAS of a pouch priced `price` sats holding `lotSize` units; null if either is not a positive number. */
  function perTokenOf(price, lotSize) {
    const p = Number(price), l = Number(lotSize);
    if (!Number.isFinite(p) || !Number.isFinite(l) || p <= 0 || l <= 0) return null;
    return (p * UNIT) / l;
  }

  /** A whole number of sats written as a string or number: the number if a safe integer ≥ 0; else null. */
  function satsOf(v) {
    if (typeof v !== 'string' && typeof v !== 'number') return null;
    if (typeof v === 'string' && !/^\d+$/.test(v)) return null;
    const n = Number(v);
    return Number.isSafeInteger(n) && n >= 0 ? n : null;
  }

  /**
   * A listing's "total before network fee" as the site's buy panel works it out (price + saleFee + settleFee): the
   * listing's own platform fee (saleFee) and, for an instant listing, its seller payout fee as the site counts it
   * (settleFeeOf: a positive whole number of sats, at most SETTLE_FEE_CAP; anything else counts as none). A listing
   * without its own positive platform fee (the site would work one out from the collection's rules, which the worker does
   * not read) or without a whole positive price: null.
   */
  function totalOf(l) {
    const price = satsOf(l.price), sale = satsOf(l.saleFee);
    if (price === null || price === 0 || sale === null || sale === 0) return null;
    let settle = 0;
    if (l.offchain === true) {
      const a = Number(l.settleFee ?? 0);
      settle = Number.isSafeInteger(a) && a > 0 ? Math.min(a, SETTLE_FEE_CAP) : 0;
    }
    return price + sale + settle;
  }

  // ------------------------------------------------------------ the worker's readings

  /**
   * The market as kept: from /rewards/rune/listings (an array) and /rewards/rune/sales ({lastHeight, sales}), the
   * listings by pouch with their price per SHNAKAS, whether someone is buying them, their price, their total before
   * network fee and their size; and the sales read (`sold`: each sale's pouch, block, price and size in units, whole numbers as the API gives
   * them, for the activity list's rows; mergeSold adds those kept before). Listings or sales not as described: an error
   * (the worker keeps what it had).
   */
  function marketOf(listings, sales, fetchedAt) {
    if (!Array.isArray(listings)) throw new Error('pouch listings: not a list');
    if (!sales || !Array.isArray(sales.sales)) throw new Error('pouch sales: no sales list');
    const rows = [];
    for (const l of listings) {
      if (!l || l.cancelling === true) continue;
      const per = perTokenOf(l.price, l.lotSize);
      if (!Number.isSafeInteger(l.assetId) || per === null) continue;
      rows.push([l.assetId, per, l.pending === true, Number(l.price), totalOf(l), Number(l.lotSize) / UNIT]);
    }
    const sold = [];
    for (const s of sales.sales) {
      const per = s ? perTokenOf(s.price, s.lotSize) : null;
      if (per === null) continue;
      const row = [s.assetId, s.height, satsOf(s.price), satsOf(s.lotSize)];
      if (saleOf(row) !== null) sold.push(row);
    }
    return { fetchedAt, lastHeight: Number.isSafeInteger(sales.lastHeight) ? sales.lastHeight : null, listings: rows, sold };
  }

  /**
   * One kept sale read as data: {id, height, price, perToken, size}; null when its pouch, block, price or size is not a
   * whole number as written (a positive price and size).
   */
  function saleOf(row) {
    if (!Array.isArray(row) || row.length !== 4) return null;
    const [id, height, price, lot] = row;
    if (!Number.isSafeInteger(id) || !Number.isSafeInteger(height) || height < 0 || !Number.isSafeInteger(price) || price <= 0 || !Number.isSafeInteger(lot) || lot <= 0) return null;
    return { id, height, price, perToken: (price * UNIT) / lot, size: lot / UNIT };
  }

  /**
   * The sales to keep: those kept before and those just read, each once (a block read again holds the same sales), the
   * newest MAX_SOLD by block. Kept data from an earlier version has no sales (`kept` not a list): the worker then reads
   * them all, and only those just read are kept.
   */
  function mergeSold(kept, fresh) {
    const all = new Map();
    for (const row of [...(Array.isArray(kept) ? kept : []), ...fresh]) {
      const s = saleOf(row);
      if (s !== null) all.set(row.join(':'), row);
    }
    return [...all.values()].sort((a, b) => b[1] - a[1]).slice(0, MAX_SOLD);
  }

  /** A dollar price read from one source's answer: positive and finite, else null. */
  function priceFrom(source, json) {
    const v = source.read(json);
    return typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : null;
  }

  // ------------------------------------------------------------ what the page shows from them

  /** The kept dollar price, if read within PRICE_FRESH_MS of now; else null. */
  function usdOf(kept, now) {
    if (!kept || typeof kept.usd !== 'number' || !(kept.usd > 0) || !Number.isFinite(kept.at)) return null;
    return now - kept.at <= PRICE_FRESH_MS && kept.at - now <= 60 * 1000 ? kept.usd : null;
  }

  const NO_SALES = Object.freeze([]);

  /**
   * The kept market, if read within MARKET_FRESH_MS of now; else null. Read as kept data, not trusted (rowOf reads each
   * listing row, saleOf each sale). A market kept by an earlier build may carry the newest sale (`last`), no longer shown:
   * it is not read, and the worker's next read writes the market without it (it is the site's public data, read again).
   */
  function freshMarket(kept, now) {
    if (!kept || !Array.isArray(kept.listings) || !Number.isFinite(kept.fetchedAt)) return null;
    if (!(now - kept.fetchedAt <= MARKET_FRESH_MS && kept.fetchedAt - now <= 60 * 1000)) return null;
    // a market kept by an earlier version has no sales: the activity list's rows wait for the next read (one shared empty
    // list, so the index built from this market is kept between passes)
    return { listings: kept.listings, sold: Array.isArray(kept.sold) ? kept.sold : NO_SALES };
  }

  const positive = (v) => typeof v === 'number' && Number.isFinite(v) && v > 0;

  /**
   * One kept listing row read as data: {id, perToken, pending, price, total, size}, the last three null when missing or
   * not as written (a row kept by an earlier version has only the first three); a row whose pouch or price per SHNAKAS is
   * not as written: null.
   */
  function rowOf(row) {
    if (!Array.isArray(row) || !Number.isSafeInteger(row[0]) || !positive(row[1])) return null;
    const whole = (v) => Number.isSafeInteger(v) && v > 0;
    return { id: row[0], perToken: row[1], pending: row[2] === true, price: whole(row[3]) ? row[3] : null, total: whole(row[4]) ? row[4] : null, size: positive(row[5]) ? row[5] : null };
  }

  /** The floor per SHNAKAS among the listings nobody is buying, this pouch left out; null when there is none. */
  function floorOf(market, exceptId) {
    let floor = null;
    for (const raw of market.listings) {
      const row = rowOf(raw);
      if (row === null || row.pending || row.id === exceptId) continue;
      if (floor === null || row.perToken < floor) floor = row.perToken;
    }
    return floor;
  }

  /** The pouch's listing, read with rowOf; null when it has none, or more than one (the kept data is then not trusted). */
  function listingOf(market, id) {
    let found = null;
    for (const raw of market.listings) {
      const row = rowOf(raw);
      if (row === null || row.id !== id) continue;
      if (found !== null) return null;
      found = row;
    }
    return found;
  }

  /**
   * A listed pouch in the tokens tab, which shows its price and its size as the site writes them but not its number: the
   * one listing with that price and that size as written; null when none or more than one has them.
   */
  function listingByLook(market, btcText, sizeText) {
    let found = null;
    for (const raw of market.listings) {
      const row = rowOf(raw);
      if (row === null || row.price === null || row.size === null) continue;
      if (formatBtc(row.price) !== btcText || formatTokens(row.size) !== sizeText) continue;
      if (found !== null) return null;
      found = row;
    }
    return found;
  }

  // The market's lists, looked up row by row: built once per kept market (a pass can look at thousands of rows).
  const indexes = new WeakMap();
  const lookOf = (price, size) => `${formatBtc(price)}|${formatTokens(size)}`;
  const push = (map, key, v) => { const list = map.get(key); if (list) list.push(v); else map.set(key, [v]); };

  /**
   * The kept market by pouch and by look: listings by pouch (null for a pouch listed twice: not trusted), listings and
   * sales by their price and size as the site writes them, sales by pouch. market: a fresh market (freshMarket).
   */
  function indexOf(market) {
    const known = indexes.get(market.listings);
    if (known && known.sold === market.sold) return known;
    const byId = new Map(), byLook = new Map(), soldById = new Map(), soldByLook = new Map();
    for (const raw of market.listings) {
      const row = rowOf(raw);
      if (row === null) continue;
      byId.set(row.id, byId.has(row.id) ? null : row);
      if (row.price !== null && row.size !== null) push(byLook, lookOf(row.price, row.size), row);
    }
    for (const raw of market.sold) {
      const s = saleOf(raw);
      if (s === null) continue;
      push(soldById, s.id, s);
      push(soldByLook, lookOf(s.price, s.size), s);
    }
    const index = { sold: market.sold, byId, byLook, soldById, soldByLook };
    indexes.set(market.listings, index);
    return index;
  }

  /** The price per SHNAKAS all of `rows` have, exactly; null when there are none or they differ (it is then not known). */
  function samePer(rows) {
    if (rows === undefined || rows.length === 0) return null;
    const per = rows[0].perToken;
    return rows.every((r) => r.perToken === per) ? per : null;
  }

  /**
   * An exact price per SHNAKAS, kept only if the site writes it as the figure the page shows (`shown`, read with
   * parseSats or parseSatsEach): the figure is then that pouch's, and its dollars are the exact price's, as the site's
   * own dollars are (it writes the sats rounded, whole from 100 up). null otherwise.
   */
  function asShown(per, shown) {
    return per !== null && shown !== null && num(formatSats(per)) === shown ? per : null;
  }

  const usdText = (sats, usd) => formatUsd((sats / UNIT) * usd);

  function words(lang) {
    const t = TEXT[lang];
    if (!t) throw new Error(`pouch: no words for ${lang}`);
    return t;
  }

  /**
   * A price per SHNAKAS in dollars, followed by the site's own words for "per SHNAKAS"; approx: marked "≈" (worked out
   * from figures the site writes rounded). null without a dollar price.
   */
  function perView(lang, { perToken, usd, approx = false }) {
    const t = words(lang);
    if (usd === null) return null;
    return { value: `${approx ? '≈ ' : ''}${usdText(perToken, usd)}`, unit: t.perUnit, title: t.usdTitle };
  }

  /** The change-price dialog's new price (the site shows only the old one): per SHNAKAS and the whole pouch in dollars. */
  function repriceView(lang, { sats, perToken, usd }) {
    const t = words(lang);
    if (usd === null) return null;
    return { value: usdText(perToken, usd), unit: `${t.perUnit} · ${t.whole} ≈ ${usdText(sats, usd)}`, title: t.usdTitle };
  }

  /** A balance or a pouch not listed, at the floor: size × floor, an estimate. null without a dollar price or a floor. */
  function worthView(lang, { size, usd, market }) {
    const t = words(lang);
    if (usd === null || market === null) return null;
    const floor = floorOf(market, null);
    if (floor === null) return null;
    return { label: t.atFloor, value: `≈ ${usdText(size * floor, usd)}`, title: t.atFloorTitle };
  }

  /**
   * The list and change-price dialogs' warning: a price per SHNAKAS under LOW_SHARE of the floor (this pouch left out),
   * most likely a dropped zero or the price taken for one SHNAKAS. No percentage: the seller needs the hint, not a figure.
   */
  function lowWarning(lang, { perToken, market, exceptId }) {
    const t = words(lang);
    if (market === null) return null;
    const floor = floorOf(market, exceptId);
    return floor !== null && perToken < floor * LOW_SHARE ? t.low : null;
  }

  // ------------------------------------------------------------ the page

  /** An element's own text, without what this script added. */
  function ownText(el) {
    let s = '';
    for (const n of el.childNodes) {
      if (n.nodeType === 3) s += n.nodeValue;
      else if (n.nodeType === 1 && !n.classList.contains('shn-pouch')) s += n.textContent;
    }
    return s;
  }

  /** This script's node of `kind` inside `parent`, kept its last child (made if missing, moved back if the site added after it). */
  function inside(parent, kind, tag, cls, keep) {
    let node = null;
    for (const c of parent.children) if (c.classList.contains('shn-pouch') && c.dataset.shnPouch === kind) { node = c; break; }
    if (node === null) {
      node = parent.ownerDocument.createElement(tag);
      node.dataset.shnPouch = kind;
      parent.appendChild(node);
    } else if (!trailing(node)) parent.appendChild(node);
    if (node.className !== `shn-pouch ${cls}`) node.className = `shn-pouch ${cls}`;
    keep.add(node);
    return node;
  }

  /** Whether only this script's nodes follow `node` (the site's own text or elements after it would put it out of place). */
  function trailing(node) {
    for (let n = node.nextSibling; n !== null; n = n.nextSibling) if (!(n.nodeType === 1 && n.classList.contains('shn-pouch'))) return false;
    return true;
  }

  /** This script's node of `kind` right after `anchor` (a sibling), made if missing. */
  function after(anchor, kind, tag, cls, keep) {
    let node = anchor.nextElementSibling;
    if (!(node && node.classList.contains('shn-pouch') && node.dataset.shnPouch === kind)) {
      node = anchor.ownerDocument.createElement(tag);
      node.dataset.shnPouch = kind;
      anchor.after(node);
    }
    if (node.className !== `shn-pouch ${cls}`) node.className = `shn-pouch ${cls}`;
    keep.add(node);
    return node;
  }

  /** Rebuilds `node`'s content with build() only when what it shows (key) changed, so an unchanged pass writes nothing. */
  function fill(node, key, title, build) {
    if (node.dataset.shnKey !== key) {
      node.replaceChildren(...build());
      node.dataset.shnKey = key;
    }
    if ((node.title || '') !== title) node.title = title;
  }

  function span(doc, cls, text) {
    const s = doc.createElement('span');
    s.className = cls;
    s.textContent = text;
    return s;
  }

  /**
   * A figure's parts: an optional label, the figure (soft gold), an optional unit or remark. No sigil beside a figure:
   * right after a number it reads as its unit (as "5 元", or the site's own coin after "0.0004"), before one as a currency
   * sign; the font, the colour and the title naming Naka Sigil say whose it is, and the page names Naka Sigil once (the
   * market page's mark in its tab bar). lead: the sigil before the label (the tokens tab's balance, the one mark of its
   * page; a label follows it, not a figure).
   */
  function tagParts(doc, icon, { label = '', value, unit = '', lead = false }) {
    const body = doc.createElement('span');
    body.className = 'shn-pouch-tag__body';
    body.append(...(lead ? [icon()] : []), ...(label ? [span(doc, 'shn-pouch-tag__label', label)] : []), span(doc, 'shn-pouch-tag__value', value), ...(unit ? [span(doc, 'shn-pouch-tag__unit', unit)] : []));
    return [body];
  }

  /** A figure in this script's node, its title naming Naka Sigil. */
  function tag(node, t, o, icon = null) {
    if (o.lead && typeof icon !== 'function') throw new Error('pouch: a lead sigil needs the icon');
    fill(node, `${o.lead ? 'S|' : ''}${o.label || ''}|${o.value}|${o.unit || ''}`, `${t.by}${o.title}`, () => tagParts(node.ownerDocument, icon, o));
  }

  /**
   * The market page's one mark: the sigil and "Naka Sigil", small and muted, in the free end of the page's own tab bar
   * (钱袋 · 动态 · 简介), so the gold figures in its lists are named once without a line of their own; what the gold
   * means is its title. As CSFloat writes "Powered by CSFloat" once over the Steam market rather than on every row, and
   * SteamDB and Augmented Steam put their logo once at the start of a block. Hidden from screen readers (the figures'
   * titles name Naka Sigil), never focusable or clickable.
   */
  function brandMark(tabs, t, icon, keep) {
    const node = inside(tabs, 'mark', 'span', 'shn-pouch-mark', keep);
    if (node.getAttribute('aria-hidden') !== 'true') node.setAttribute('aria-hidden', 'true');
    fill(node, t.brand, t.markTitle, () => [icon(), span(node.ownerDocument, 'shn-pouch-mark__name', t.brand)]);
  }

  /** A warning line in this script's node. */
  function warning(node, text) {
    fill(node, text, '', () => [node.ownerDocument.createTextNode(text)]);
  }

  /** An element's own text nodes only (a pouch's "#", 1157 without the time the site puts in an element beside it). */
  function textOnly(el) {
    let s = '';
    for (const n of el.childNodes) if (n.nodeType === 3) s += n.nodeValue;
    return s;
  }

  const ID_TEXT = /^\s*#\s?\d[\d,]*\s*$/;
  const BTC_TEXT = /^\s*(\d+(?:\.\d{1,8})?)\s*BTC\s*$/;

  /** A list row's pouch: its cell reading "#id" and nothing else; null without one. */
  function rowId(tr) {
    const cell = [...tr.cells].find((c) => ID_TEXT.test(textOnly(c)) && c.children.length === 0);
    return cell ? pouchId(textOnly(cell)) : null;
  }

  /** A grid tile's pouch: its .pp-tile-id ("#", id, then the time in an element of its own); null without one. */
  function tileId(tile) {
    const el = tile.querySelector('.pp-tile-id');
    return el && ID_TEXT.test(textOnly(el)) ? pouchId(textOnly(el)) : null;
  }

  /** A pouch's listing kept, from the index; null when it has none, or two (byId holds null then: not trusted). */
  function listedRow(index, id) {
    const row = id === null ? undefined : index.byId.get(id);
    return row === undefined ? null : row;
  }

  /** A listing's exact price per SHNAKAS by its pouch; null when the pouch has no listing kept, or two. */
  function listedPer(index, id) {
    const row = listedRow(index, id);
    return row === null ? null : row.perToken;
  }

  /**
   * A list row's exact price per SHNAKAS: a listing's (the row has its buy button) by its pouch; a sale's (the activity
   * list: the row names the sale's type) by its pouch and its price as the site writes it, the price per SHNAKAS every
   * such sale kept has. null for anything else.
   */
  function rowPer(tr, index) {
    const id = rowId(tr);
    if (id === null) return null;
    if (tr.querySelector('.pp-rowbuy') !== null) return listedPer(index, id);
    if (tr.querySelector('.pp-type') === null) return null;
    const strong = [...tr.cells].map((c) => c.querySelector(':scope > strong')).find((x) => x !== null && BTC_TEXT.test(ownText(x)));
    const sales = strong ? index.soldById.get(id) : undefined;
    if (sales === undefined) return null;
    const btc = BTC_TEXT.exec(ownText(strong))[1];
    return samePer(sales.filter((s) => formatBtc(s.price) === btc));
  }

  /**
   * A phone card's exact price per SHNAKAS. The activity list's card (data-static) shows no pouch: by its price and size
   * as written, among the sales kept. A listing's card shows its "#id", or for one being bought a cart (.pp-card-pend)
   * instead: then by its price and size among the listings. Either way, the price per SHNAKAS all those have; else null.
   */
  function cardPer(card, index) {
    const price = card.querySelector('.pp-card-price > strong');
    const amount = card.querySelector('.pp-card-main > strong');
    const btc = price ? BTC_TEXT.exec(ownText(price)) : null;
    const size = amount ? /^\s*([\d,]+(?:\.\d+)?)\s/.exec(ownText(amount)) : null;
    const look = btc && size ? `${btc[1]}|${size[1]}` : null;
    if (card.hasAttribute('data-static')) return look === null ? null : samePer(index.soldByLook.get(look));
    const idSpan = [...card.querySelectorAll('.pp-card-price > span')].find((x) => ID_TEXT.test(textOnly(x)));
    if (idSpan) return listedPer(index, pouchId(textOnly(idSpan)));
    if (card.querySelector('.pp-card-pend') !== null && look !== null) return samePer(index.byLook.get(look));
    return null;
  }

  /**
   * The market's rows, tiles and cards, and the vault market's tiles: the dollar price of one SHNAKAS beside or under its
   * sats, from the pouch's exact price (its listing, or for the activity list its sale), shown only when the site writes
   * that price as the figure beside it: a pouch not kept (listed since the last read) or kept with another price gets
   * none until the worker's next read. The header (the market cap, the volume) is left as the site writes it.
   */
  function markMarket(doc, state, keep, budget) {
    const t = TEXT[state.lang], usd = state.usd, icon = state.icon;
    if (usd === null || state.market === null) return;
    const index = indexOf(state.market);
    const marked = new Set();   // the lists with a figure marked
    const mark = (list, node, o) => { tag(node, t, o); if (list) marked.add(list); };
    try {
      for (const table of doc.querySelectorAll('table.pp-table')) {
        for (const tr of table.rows) {
          if (!budget()) return;
          // the first price per SHNAKAS in the row (the next pp-num is the whole pouch): its dollars beside it
          const td = [...tr.cells].find((c) => c.classList.contains('pp-num') && parseSats(ownText(c)) !== null);
          const per = td ? asShown(rowPer(tr, index), parseSats(ownText(td))) : null;
          if (per !== null) mark(table, inside(td, 'row', 'span', 'shn-pouch-tag shn-pouch-tag--row', keep), { value: usdText(per, usd), title: t.usdTitle });
        }
      }
      // a tile's sats line is one cut-off line: the figure goes on a line of its own under it
      for (const sub of doc.querySelectorAll('.pp-tile .pp-tile-sub')) {
        if (sub.classList.contains('shn-pouch') || !budget()) continue;
        const tile = sub.closest('.pp-tile');
        const per = asShown(listedPer(index, tileId(tile)), parseSats(ownText(sub)));
        if (per !== null) mark(tile.closest('.pp-tiles'), after(sub, 'tile', 'span', 'shn-pouch-tag shn-pouch-tag--line', keep), { value: usdText(per, usd), title: t.usdTitle });
      }
      // a phone card's sats line also cuts off: the figure as the card's next line
      for (const line of doc.querySelectorAll('.pp-card .pp-card-main > span')) {
        if (line.classList.contains('shn-pouch') || !budget()) continue;
        const card = line.closest('.pp-card');
        const per = asShown(cardPer(card, index), parseSats(ownText(line)));
        if (per !== null) mark(card.closest('.pp-cards'), after(line, 'card', 'span', 'shn-pouch-tag shn-pouch-tag--line', keep), { value: usdText(per, usd), title: t.usdTitle });
      }
      // the vault's pouch market: a tile's caption, its pouch named in the tile's number line ("钱袋 #id")
      for (const cap of doc.querySelectorAll('.pm-grid .sv-tile-caption')) {
        if (!budget()) return;
        const line = [...cap.children].find((c) => !c.classList.contains('shn-pouch'));
        const number = cap.parentElement ? cap.parentElement.querySelector(':scope > .sv-tile-number') : null;
        const per = line && number ? asShown(listedPer(index, pouchId(textOnly(number))), parseSatsEach(ownText(line))) : null;
        if (per !== null) mark(cap.closest('.pm-grid'), inside(cap, 'caption', 'span', 'shn-pouch-tag shn-pouch-tag--caption', keep), { value: usdText(per, usd), title: t.usdTitle });
      }
    } finally {
      // a page with a list marked so far (a pass cut short by the row budget included) and shown at this width (the site
      // hides the phone cards on a wide screen, the table on a phone) gets the mark in its tab bar; a list with no such bar
      // above it (the vault's pouch market) gets none: its figures' titles name Naka Sigil
      const bars = new Set();
      for (const list of marked) {
        if (list.getClientRects().length === 0) continue;
        const board = list.closest('.pp-board');
        const tabs = board ? board.querySelector(':scope > .pp-tabs[role="tablist"]') : null;
        if (tabs) bars.add(tabs);
      }
      for (const tabs of bars) brandMark(tabs, t, icon, keep);
    }
  }

  /**
   * A sweep's average price per SHNAKAS as the site works it out (the prices over the sizes of the pouches ticked: the
   * list's rows or the grid's tiles marked data-on; the list and the grid are never on the page together), from their
   * listings; null unless every pouch ticked has its listing kept and their prices add up to the price the panel shows.
   */
  function sweepPer(doc, panel, index) {
    const ids = new Set();
    for (const el of doc.querySelectorAll('table.pp-table tr[data-on], .pp-tiles > .pp-tile[data-on]')) {
      const id = el.tagName === 'TR' ? rowId(el) : tileId(el);
      if (id === null) return null;
      ids.add(id);
    }
    if (ids.size < 2) return null;
    let price = 0, size = 0;
    for (const id of ids) {
      const row = listedRow(index, id);
      if (row === null || row.price === null || row.size === null) return null;
      price += row.price;
      size += row.size;
    }
    const field = [...panel.querySelectorAll('.pp-field')].find((f) => f.querySelector('.pp-btc') !== null);
    const strong = field ? field.querySelector(':scope > strong') : null;
    return strong !== null && formatBtc(price) === ownText(strong).trim() ? price / size : null;
  }

  /**
   * The market's buy panel (the selected pouch, or a sweep): the price per SHNAKAS (or the sweep's average) in dollars,
   * from the pouch's listing (a sweep: the listings ticked); a single pouch's total, which the site shows in BTC only, in
   * dollars from its listing's exact total, only when that total is exactly the one the panel shows (so a listing kept
   * from before a change, or a panel the site reworked, shows none).
   */
  function markBuy(doc, state, keep) {
    const t = TEXT[state.lang], usd = state.usd;
    if (state.market === null || usd === null) return;
    const index = indexOf(state.market);
    for (const dl of doc.querySelectorAll('.pp-trade-body > dl.pp-sum')) {
      const rows = [...dl.children].filter((c) => c.tagName === 'DIV' && !c.classList.contains('shn-pouch'));
      const firstDd = rows[0] && rows[0].querySelector(':scope > dd');
      const totalDd = dl.querySelector(':scope > div[data-total] > dd');
      // one pouch: its "#id" beside the amount; a sweep: a count there
      const unit = dl.parentElement.querySelector('.pp-unit small');
      const id = unit ? pouchId(ownText(unit)) : null;
      const row = listedRow(index, id);
      if (firstDd) {
        const per = asShown(id !== null ? listedPer(index, id) : sweepPer(doc, dl.parentElement, index), parseSats(ownText(firstDd)));
        if (per !== null) tag(inside(firstDd, 'buy-each', 'span', 'shn-pouch-tag shn-pouch-tag--row', keep), t, { value: usdText(per, usd), title: t.usdTitle });
      }
      if (row === null || row.total === null || !totalDd || totalDd.querySelector('.pp-usd') || formatBtc(row.total) !== ownText(totalDd).replace(/\s*BTC\s*$/, '').trim()) continue;
      tag(inside(totalDd, 'buy-total', 'span', 'shn-pouch-tag shn-pouch-tag--row', keep), t, { value: usdText(row.total, usd), title: t.totalTitle });
    }
  }

  /**
   * The market's buy dialog (a pouch's 购买 button; not a [role=dialog]: known by the site's .pp-modal-art, the pouch's
   * picture, in the row of the price; above it the head naming the pouch "钱袋 #id", under it the table of costs whose
   * last row is the total). Beside the price it writes the price per SHNAKAS on a line of its own ("143 sats 每
   * SHNAKAS"): that line gets the dollars of the listing's exact price, when the listing has that price as written; the
   * total (in BTC only there) gets the dollars of the listing's exact total, when the listing has that total as written.
   */
  function markBuyDialog(doc, state, keep) {
    const t = TEXT[state.lang], usd = state.usd;
    if (state.market === null || usd === null) return;
    const index = indexOf(state.market);
    for (const art of doc.querySelectorAll('.pp-modal-art')) {
      const top = art.parentElement;
      const surface = top ? top.closest('.surface') : null;
      if (!surface) continue;
      const head = surface.firstElementChild;
      if (!head || head.contains(art)) continue;
      const row = listedRow(index, pouchId(ownText(head)));
      if (row === null) continue;
      // the price per SHNAKAS line beside the picture
      for (const p of top.querySelectorAll('p')) {
        if (p.classList.contains('shn-pouch')) continue;
        const per = asShown(row.perToken, parseSatsEach(ownText(p)));
        if (per !== null) { tag(inside(p, 'dialog-each', 'span', 'shn-pouch-tag shn-pouch-tag--row shn-pouch-tag--small', keep), t, { value: usdText(per, usd), title: t.usdTitle }); break; }
      }
      let rows = top.nextElementSibling;
      while (rows && rows.classList.contains('shn-pouch')) rows = rows.nextElementSibling;
      if (!rows) continue;
      const last = [...rows.children].filter((c) => !c.classList.contains('shn-pouch')).pop();
      const cell = last ? [...last.children].filter((c) => c.tagName === 'SPAN' && !c.classList.contains('shn-pouch')).pop() : undefined;
      const m = cell ? BTC_TEXT.exec(ownText(cell)) : null;
      if (m === null || row.total === null || formatBtc(row.total) !== m[1]) continue;
      tag(inside(cell, 'dialog-total', 'span', 'shn-pouch-tag shn-pouch-tag--row', keep), t, { value: usdText(row.total, usd), title: t.totalTitle });
    }
  }

  /** The elements after `input` among its siblings, this script's own left out. */
  function following(input) {
    const out = [];
    for (const el of input.parentElement ? input.parentElement.children : []) {
      if (el !== input && !el.classList.contains('shn-pouch') && input.compareDocumentPosition(el) & 4) out.push(el); // 4: following
    }
    return out;
  }

  /**
   * This script's node of `kind` inside `parent`, right before `ref` (one of parent's children; null: last), made if
   * missing, moved back if the site put something between.
   */
  function insideBefore(parent, ref, kind, tag, cls, keep) {
    let node = null;
    for (const c of parent.children) if (c.classList.contains('shn-pouch') && c.dataset.shnPouch === kind) { node = c; break; }
    if (node === null) {
      node = parent.ownerDocument.createElement(tag);
      node.dataset.shnPouch = kind;
    }
    if (ref === null) { if (node.parentElement !== parent || !trailing(node)) parent.appendChild(node); } else if (node.nextSibling !== ref) parent.insertBefore(node, ref);
    if (node.className !== `shn-pouch ${cls}`) node.className = `shn-pouch ${cls}`;
    keep.add(node);
    return node;
  }

  /**
   * A pouch sheet's head (.pm-sheet-head): the pouch's picture, then the column of its lines (size or price, "钱袋 #id ·
   * kind" or "N sats 每 SHNAKAS · 钱袋 #id", the listed badge). The column: the head's last child with words in it; none,
   * null.
   */
  function headColumn(head) {
    const cols = [...head.children].filter((c) => !c.classList.contains('shn-pouch') && c.textContent.trim() !== '');
    return cols.length ? cols[cols.length - 1] : null;
  }

  /** A figure as the last line of a sheet's head, lined up with the site's own lines there. */
  function lineInHead(head, t, view, keep) {
    const col = headColumn(head);
    if (col === null || view === null) return;
    tag(inside(col, 'sheet', 'span', 'shn-pouch-tag shn-pouch-tag--head', keep), t, view);
  }

  /** A figure on a line of its own right after `anchor` (the change-price dialog's input), and the warning (if any) after it. */
  function lineAfter(anchor, kind, t, view, warn, keep) {
    if (view === null) return;
    const node = after(anchor, kind, 'span', 'shn-pouch-tag shn-pouch-tag--sheet', keep);
    tag(node, t, view);
    if (warn) warning(after(node, `${kind}-warn`, 'div', 'shn-pouch-warn', keep), warn);
  }

  /**
   * The vault's pouch dialogs and sheets. With a price typed in, two are marked, each known by where its parts sit: the
   * list dialog (a decimal input with the payout choices .pk-choices further down beside it; the send dialog's choices
   * have no decimal input) and the change-price one (the head's "listed" badge .pk-badge, a decimal input right above its
   * two buttons, Back and Set price). The split dialog's decimal input (a custom split) is neither, and is left alone; so
   * is any dialog the site reshapes so it no longer reads this way. Without an input, a pouch's own sheet: listed (the
   * head's badge), its listing's price per SHNAKAS in dollars; not listed (its actions .pk-actions), its worth at the
   * floor; and the vault market's buy sheet (its head leading with a price in BTC, every fee already in dollars), the
   * price per SHNAKAS in dollars: each as the last line of the head's column, lined up with the site's lines there.
   */
  function markDialogs(doc, state, keep) {
    const t = TEXT[state.lang], usd = state.usd;
    for (const dlg of doc.querySelectorAll('[role="dialog"]')) {
      const head = dlg.querySelector('.pm-sheet-head');
      if (!head) continue;
      const input = dlg.querySelector('input[inputmode="decimal"]');
      const size = parseSize(head.textContent);
      const id = pouchId(head.textContent);
      if (input === null) {
        if (head.querySelector('.pk-badge') !== null && id !== null && state.market !== null) {
          const row = listingOf(state.market, id);
          if (row) lineInHead(head, t, perView(state.lang, { perToken: row.perToken, usd }), keep);
        } else if (dlg.querySelector('.pk-actions') !== null && size !== null) {
          lineInHead(head, t, worthView(state.lang, { size, usd, market: state.market }), keep);
        } else if (id !== null && state.market !== null) {
          // the vault market's buy sheet: its head leads with the pouch's price in BTC; only when the pouch's listing has
          // that price as the site writes it
          const btc = /^\s*(\d+(?:\.\d{1,8})?)\s*BTC\b/.exec(head.textContent);
          const row = btc ? listingOf(state.market, id) : null;
          if (row && row.price !== null && formatBtc(row.price) === btc[1]) lineInHead(head, t, perView(state.lang, { perToken: row.perToken, usd }), keep);
        }
        continue;
      }
      if (head.contains(input)) continue;
      const next = following(input);
      const listing = next.some((el) => el.classList.contains('pk-choices'));
      const repricing = !listing && head.querySelector('.pk-badge') !== null && next.length > 0 && next[0].querySelectorAll('button').length === 2;
      if (!listing && !repricing) continue;
      const sats = parseBtc(input.value);
      if (sats === null) continue;
      if (repricing) {
        // the change-price dialog: a listed pouch, so its listing (by the number in the head) has its exact size; the new
        // price over it is the exact price per SHNAKAS. No listing kept for it: nothing
        const row = id === null || state.market === null ? null : listingOf(state.market, id);
        if (row === null || row.size === null) continue;
        const perToken = sats / row.size;
        lineAfter(input, 'line', t, repriceView(state.lang, { sats, perToken, usd }), lowWarning(state.lang, { perToken, market: state.market, exceptId: id }), keep);
        continue;
      }
      // the list dialog: the pouch is not listed yet, so its exact size is nowhere public. The site writes the price per
      // SHNAKAS itself on the line right under the price ("≈ $x · 500 sats 每 SHNAKAS", from the pouch's exact size,
      // rounded, once the price is at least the minimum), with a line of its own inside it (the fee the buyer adds): the
      // dollars go right after "每 SHNAKAS", before that inner line, marked "≈" (worked out from the rounded figure); the
      // warning (if any) under the site's line. Under the minimum the site shows no such line but its own warning: nothing.
      const shown = next.length > 0 ? /·\s*([\d,]+(?:\.\d+)?)\s*sats\b/.exec(ownText(next[0])) : null;
      const perToken = shown ? num(shown[1]) : null;
      if (perToken === null || !(perToken > 0)) continue;
      const view = perView(state.lang, { perToken, usd, approx: true });
      const siteLine = next[0];
      if (view !== null) {
        const inner = [...siteLine.children].find((c) => c.tagName === 'DIV' && !c.classList.contains('shn-pouch')) || null;
        tag(insideBefore(siteLine, inner, 'line', 'span', 'shn-pouch-tag shn-pouch-tag--row', keep), t, { ...view, unit: '' });
      }
      const warn = lowWarning(state.lang, { perToken, market: state.market, exceptId: id });
      if (warn) warning(after(siteLine, 'line-warn', 'div', 'shn-pouch-warn', keep), warn);
    }
  }

  /**
   * The vault's tokens tab: the balance at the floor (inside the balance, so the site's wide layout keeps it in the
   * balance's place; the sigil before it, the page's one mark); each pouch inside its last line: listed, its listing's
   * price per SHNAKAS in dollars (the listing found by its price and size as written; none or two alike: no mark); not
   * listed, its worth at the floor; a pouch on its way (data-pending) or reading otherwise: no mark.
   */
  function markTokens(doc, state, keep, budget) {
    const t = TEXT[state.lang], usd = state.usd, market = state.market;
    if (usd === null || market === null) return;
    for (const bal of doc.querySelectorAll('.tk-card .tk-balance')) {
      const size = parseSize(ownText(bal));
      const view = size === null ? null : worthView(state.lang, { size, usd, market });
      if (view) tag(inside(bal, 'balance', 'span', 'shn-pouch-tag shn-pouch-tag--balance', keep), t, { ...view, lead: true }, state.icon);
    }
    for (const lot of doc.querySelectorAll('.tk-lots > button.tk-lot')) {
      if (!budget()) return;
      if (lot.hasAttribute('data-pending')) continue;
      const strong = lot.querySelector(':scope > strong');
      const line = [...lot.children].filter((c) => c.tagName === 'SPAN' && !c.classList.contains('shn-pouch')).pop();
      if (!strong || !line || line === lot.firstElementChild) continue;
      const sizeText = ownText(strong).trim();
      if (lot.hasAttribute('data-listed')) {
        const money = line.querySelector('.sv-money');
        const btc = money ? /^\s*(\d+(?:\.\d{1,8})?)\s*BTC\b/.exec(ownText(money)) : null;
        const row = btc ? listingByLook(market, btc[1], sizeText) : null;
        if (row !== null) tag(inside(line, 'lot', 'span', 'shn-pouch-tag shn-pouch-tag--lot', keep), t, perView(state.lang, { perToken: row.perToken, usd }));
      } else {
        const size = num(sizeText);
        const view = size === null || size <= 0 || pouchId(ownText(line)) === null ? null : worthView(state.lang, { size, usd, market });
        if (view) tag(inside(line, 'lot', 'span', 'shn-pouch-tag shn-pouch-tag--lot', keep), t, view);
      }
    }
  }

  /**
   * One pass over the page: the marks that belong are added or corrected, every other shn-pouch node is removed. state:
   * {lang, usd (number | null), market (kept market | null), icon (() => a fresh sigil element)}.
   */
  function decorate(doc, state) {
    if (!TEXT[state.lang]) throw new Error(`pouch: no words for ${state.lang}`);
    if (typeof state.icon !== 'function') throw new Error('pouch: no sigil');
    const keep = new Set();
    let seen = 0;
    const budget = () => ++seen <= MAX_ROWS;
    markMarket(doc, state, keep, budget);
    markBuy(doc, state, keep);
    markBuyDialog(doc, state, keep);
    markDialogs(doc, state, keep);
    markTokens(doc, state, keep, budget);
    for (const n of doc.querySelectorAll('.shn-pouch')) if (!keep.has(n)) n.remove();
  }

  /** Whether this page is one the worker should keep the pouch figures fresh for. */
  function pouchPage(pathname) {
    return /^\/secondary\/collections\/shnakas\/?$/.test(pathname) || /^\/wallet\/?$/.test(pathname);
  }

  return {
    KEY, PRICE_KEY, SESSION_VISIBLE, MARKET_EVERY_MS, PRICE_EVERY_MS, MARKET_FRESH_MS, PRICE_FRESH_MS, LOW_SHARE, UNIT, MAX_ROWS, MAX_SOLD, SETTLE_FEE_CAP, PRICE_SOURCES, TEXT,
    num, parseSats, parseSatsEach, parseBtc, parseBtcText, parseSize, pouchId, formatUsd, formatSats, formatBtc, formatTokens, perTokenOf, totalOf,
    marketOf, saleOf, mergeSold, priceFrom, usdOf, freshMarket, rowOf, floorOf, listingOf, listingByLook, indexOf, samePer, asShown, perView, repriceView, worthView, lowWarning,
    ownText, decorate, pouchPage,
  };
});
