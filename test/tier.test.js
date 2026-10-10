'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { RULES, evaluate } = require('../src/lib/rules.js');
const { tierOf, legend } = require('../src/lib/tier.js');

const CF = 100000;
const t = (floor, i) => ({ type: `Trait ${i}`, value: String(floor), floor, listed: floor === null ? 0 : 1 });
const piece = (number, floors) => evaluate({ number, traits: floors.map(t) }, CF);

test('按理论下限分档：0 灰、25~75 绿、100~175 蓝、200~275 紫、封顶金', () => {
  assert.equal(tierOf(null), 'unknown');
  assert.equal(tierOf(piece(5000, [CF])), 'zero');
  assert.equal(tierOf(piece(5000, [CF * 1.25])), 't1');            // +25
  assert.equal(tierOf(piece(500, [CF])), 't1');                    // +50（Sub 1K）
  assert.equal(tierOf(piece(500, [CF * 1.25])), 't1');             // +75
  assert.equal(tierOf(piece(50, [CF])), 't2');                     // +100（Sub 100）
  assert.equal(tierOf(piece(50, [CF * 2])), 't2');                 // +175
  assert.equal(tierOf(piece(5, [CF])), 't3');                      // +200（Sub 10）
  assert.equal(tierOf(piece(5, [CF * 2])), 't3');                  // +275
  assert.equal(tierOf(piece(5, [CF * 3])), 'max');                 // +300 封顶
  assert.equal(tierOf(piece(5, [CF * 3, CF * 3])), 'max');         // 超出上限仍是封顶
});

test('区间按下限分档：+0~100% 是灰，+100~200% 是蓝', () => {
  assert.equal(tierOf(piece(5000, [null])), 'zero');
  assert.equal(tierOf(piece(50, [null])), 't2');
});

test('图例的起点从规则推导', () => {
  assert.deepEqual(legend(RULES).map((x) => [x.key, x.from]), [['t1', 25], ['t2', 100], ['t3', 200], ['max', 300]]);
});

test('Each exact value and range endpoint retains its own total-weight color tier',()=>{
  const {boundTier}=require('../src/lib/tier.js');
  const a=piece(500,[CF*2+1]),b=piece(5,[CF*2+1]);
  assert.equal(a.lo.weight,225);assert.equal(b.lo.weight,375);
  assert.equal(boundTier(a.lo),'t2');assert.equal(boundTier(b.lo),'t3');
  const range=piece(50,[null]);assert.equal(range.lo.weight,200);assert.equal(range.hi.weight,300);
  assert.equal(boundTier(range.lo),'t2');assert.equal(boundTier(range.hi),'t3');
});
