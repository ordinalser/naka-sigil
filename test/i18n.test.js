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

test('零挂单特征写实际件数与门槛；lastBlock 官方依据只作中性描述', () => {
  assert.equal(ZH.heldTrait(21), '零挂单 · 21 件（≥20 件 +100%）');
  assert.equal(EN.heldTrait(21), 'Zero listed · 21 pieces (≥20 → +100%)');
  assert.doesNotMatch(ZH.officialLastBlock, /沿用/);
  assert.doesNotMatch(EN.officialLastBlock, /carr(y|ied)/);
  assert.match(ZH.officialLastBlock, /lastBlock/);
  assert.match(EN.officialLastBlock, /lastBlock/);
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
  assert.ok(I.blockTimeTitle(EN,s).includes(I.localTime(timestamp*1000)));
  assert.doesNotMatch(I.blockTimeTitle(EN,s),/UTC|GMT/);
  assert.equal(I.localTime(null),'—');
  assert.equal(I.localTime(NaN),'—');
  assert.match(I.measureNote(EN,s.height,s),/970,502 \(Block time:.*not an official settlement or accrued rewards/);
});


test('Short local times use calendar days across year boundaries without fixed timezone text',()=>{
 const I=require('../src/lib/i18n.js'),now=new Date(2026,11,31,23,45).getTime();
 assert.equal(I.localTimeShort(new Date(2026,11,31,23,55).getTime(),'zh',now),'今天 23:55');
 assert.equal(I.localTimeShort(new Date(2027,0,1,1,5).getTime(),'en',now),'Tomorrow 01:05');
 assert.equal(I.localTimeShort(new Date(2027,2,1,12,0).getTime(),'zh',now),'2027-03-01 12:00');
 assert.equal(I.localTimeShort(new Date(2026,10,1,12,0).getTime(),'en',now),'11-01 12:00');
 assert.equal(I.localTimeShort(null,'zh',now),'—');assert.equal(I.localTimeShort(Infinity,'en',now),'—');
 assert.doesNotMatch(I.localTimeShort(now,'en',now),/UTC|GMT/);
});

test('起算周对着当前周说：下一周写“下周起”，更晚的周带上现在第几周，启动前只写周数', () => {
  assert.equal(ZH.rateFrom(4, 3), '下周起（第 4 周）');
  assert.equal(ZH.rateFrom(5, 3), '第 5 周起（现在第 3 周）');
  assert.equal(ZH.rateFrom(1, null), '第 1 周起');
  assert.equal(EN.rateFrom(4, 3), 'from next week (week 4)');
  assert.equal(EN.rateFrom(5, 3), 'from week 5 (now week 3)');
  assert.equal(EN.rateFrom(1, null), 'from week 1');
  assert.equal(ZH.activityAfter, '现在买入后');
  assert.equal(EN.activityAfter, 'If bought now');
});
