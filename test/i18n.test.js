'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { pick, resolveLang, DEFAULT_LANG, btc, int, measureNote, ZH, EN } = require('../src/lib/i18n.js');

test('语言：没选过默认英文；zh / en 各取一套；损坏设置恢复英文', () => {
  assert.equal(DEFAULT_LANG, 'en');
  assert.equal(resolveLang(undefined), 'en');
  assert.equal(resolveLang('en'), 'en');
  assert.equal(pick('zh'), ZH);
  assert.equal(pick('en'), EN);
  assert.equal(resolveLang('fr'), 'en');
  assert.equal(resolveLang(null), 'en');
  assert.throws(() => pick('zh-CN'));
});

test('中英文案键一一对应，函数参数个数一致', () => {
  assert.deepEqual(Object.keys(ZH).sort(), Object.keys(EN).sort());
  for (const k of Object.keys(ZH)) {
    assert.equal(typeof ZH[k], typeof EN[k], k);
    if (typeof ZH[k] === 'function') assert.equal(ZH[k].length, EN[k].length, k);
    if (typeof ZH[k] === 'object') assert.deepEqual(Object.keys(ZH[k]).sort(), Object.keys(EN[k]).sort(), k);
  }
});

test('聪转 BTC 去掉末尾的 0，整数加千分位', () => {
  assert.equal(btc(111000), '0.00111');
  assert.equal(btc(100000000), '1');
  assert.equal(btc(1), '0.00000001');
  assert.equal(btc(123456789), '1.23456789');
  assert.equal(int(970493), '970,493');
});

test('All heights distinguish per-block weight from accrued rewards', () => {
  for (const height of [970000, 971699, 971700, 985000]) {
    assert.match(measureNote(ZH, height), /非官方结算或累计奖励/);
    assert.ok(measureNote(ZH, height).includes(int(height)));
    assert.match(measureNote(EN, height), /not an official settlement or accrued rewards/);
  }
});

test('Block age uses only height-bound header time, handles days, future clocks and absent metadata',()=>{
  const I=require('../src/lib/i18n.js'), timestamp=1791471100;
  const s={height:970502,generatedAt:new Date().toISOString(),blockTime:{height:970502,hash:'a'.repeat(64),timestamp}};
  assert.equal(I.blockAge(EN,s,timestamp*1000+180000),'Block time: 3 min ago');
  assert.equal(I.blockAge(ZH,s,timestamp*1000+180000),'区块时间：3 分钟前');
  assert.equal(I.blockAge(EN,s,timestamp*1000+2*86400000),'Block time: 2 d ago');
  assert.equal(I.blockAge(EN,s,timestamp*1000-1000),EN.blockTimeFuture);
  assert.equal(I.blockAge(EN,{...s,height:970503}),EN.blockTimeUnknown);
  assert.equal(I.blockAge(EN,{height:970502,generatedAt:s.generatedAt}),EN.blockTimeUnknown);
  assert.match(I.blockTimeTitle(EN,s),/UTC.*not check time/);
  assert.match(I.measureNote(EN,s.height,s),/970,502 \(Block time:.*not an official settlement or accrued rewards/);
});
