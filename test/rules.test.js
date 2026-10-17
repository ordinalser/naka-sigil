'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { RULES, MAX_TRAIT_PCT, traitTier, numberTier, evaluate, formatBonus, formatWeight } = require('../src/lib/rules.js');
test('Zero-listed common traits get 100%; rare traits require same-block official basis instead of one sale',()=>{
  const t={type:'Hair',value:'X',floor:null,listed:0};
  const calc=x=>evaluate({number:1000,traits:[{...t,...x}]},100);
  assert.equal(calc({supply:20}).lo.weight,200);assert.equal(calc({supply:20,saleHistory:[[1,90]]}).traits[0].method,'held','20+ pieces never read sales');
  assert.equal(calc({supply:19,officialPct:25,officialSource:'sales'}).lo.weight,125);
  assert.equal(calc({supply:19,officialPct:0,officialSource:'none'}).lo.weight,100);
  const one=calc({supply:19,saleHistory:[[124,90]]});assert.equal(one.exact,true);assert.equal(one.lo.weight,100,'one sale at 1.24× is +0%');
  const high=calc({supply:1,saleHistory:[[300,90]]});assert.equal(high.exact,true);assert.equal(high.lo.weight,200,'one sale at 3× is +100%');
  assert.equal(calc({supply:1,officialPct:100,officialSource:'sales'}).lo.weight,200);
  assert.equal(calc({supply:19}).exact,false);assert.equal(calc({supply:19}).traits[0].method,'missing-sale');
  assert.equal(calc({supply:20,floor:100,listed:1}).lo.weight,100,'active floor takes priority over supply');
  assert.throws(()=>calc({supply:-1}));assert.throws(()=>calc({supply:19,officialPct:12,officialSource:'sales'}));
});
test('Reward-start planning uses the selected block, not the wall clock or an invented measurement height',()=>{
  const R=require('../src/lib/rules.js');
  const s={height:971699,blockTime:{height:971699,timestamp:1791471100}};
  assert.deepEqual(R.launchStatus(s),{height:971700,remaining:1,state:'before',eta:1791471700000});
  assert.equal(R.launchStatus({height:971700}).state,'reached');assert.equal(R.launchStatus({height:971701}).remaining,0);
  assert.equal(R.launchStatus({...s,blockTime:{...s.blockTime,height:970000}}).eta,null);
  assert.equal(R.RULES.measureHeight,null);
});

const CF = 100000; // 集合地板 0.001 BTC
const trait = (type, value, floor) => ({ type, value, floor, listed: floor === null ? 0 : 1 });
const plain = (type) => trait(type, 'Plain', CF); // 1.00x，不加成

test('特征门槛：恰好命中门槛算命中，低 1 聪不算', () => {
  const cases = [
    [CF * 1.25 - 1, 0], [CF * 1.25, 25],
    [CF * 1.5 - 1, 25], [CF * 1.5, 50],
    [CF * 2 - 1, 50], [CF * 2, 75],
    [CF * 3 - 1, 75], [CF * 3, 100],
    [CF * 952, 100], [CF, 0],
  ];
  for (const [floor, pct] of cases) assert.equal(traitTier(floor, CF).pct, pct, `floor=${floor}`);
});

test('特征门槛用整数比较：不能整除的地板价也按精确比值判档', () => {
  // 131249 / 105000 = 1.24999… → 0；131250 / 105000 = 1.25 → 25
  assert.equal(traitTier(131249, 105000).pct, 0);
  assert.equal(traitTier(131250, 105000).pct, 25);
  assert.equal(traitTier(314999, 105000).pct, 75);
  assert.equal(traitTier(315000, 105000).pct, 100);
});

test('无挂单特征：measured=false，不给任何默认档位', () => {
  assert.deepEqual(traitTier(null, CF), { measured: false });
});

test('非法输入直接抛错', () => {
  assert.throws(() => traitTier(100, 0));
  assert.throws(() => traitTier(0, CF));
  assert.throws(() => traitTier(1.5, CF));
  assert.throws(() => numberTier(-1));
  assert.throws(() => numberTier(1.5));
});

test('号码档位：只取最高一档', () => {
  const cases = [[0, 200], [9, 200], [10, 100], [99, 100], [100, 50], [999, 50], [1000, 0], [3332, 0]];
  for (const [n, pct] of cases) assert.equal(numberTier(n).pct, pct, `#${n}`);
  assert.equal(numberTier(5).label, 'Sub 10');
  assert.equal(numberTier(1000).label, null);
});

test('推文示例：A Black Hoodie: 200%（Black Hoodie 处在 3x 档，编号 1000 以上）', () => {
  const r = evaluate({ number: 2000, traits: [trait('Hoodie', 'Black', CF * 3), plain('Body'), plain('Eyes'), plain('Mouth')] }, CF);
  assert.equal(r.lo.weight, 200);
  assert.equal(r.exact, true);
  assert.equal(formatBonus(r), '+100%');
});

test('推文示例：A Red Cap on a Sub 1K: 250%', () => {
  const r = evaluate({ number: 500, traits: [trait('Hair And Headwear', 'Red Cap', CF * 3), plain('Body')] }, CF);
  assert.equal(r.lo.weight, 250);
  assert.equal(formatBonus(r), '+150%');
});

test('推文示例：A White Hoodie with 3D Glasses on a Sub 100: capped at 400%', () => {
  const r = evaluate({ number: 50, traits: [trait('Hoodie', 'White', CF * 3), trait('Eyes', '3D Glasses', CF * 3)] }, CF);
  assert.equal(r.lo.weight, 400);
  assert.equal(r.lo.atCap, true);
  assert.equal(r.lo.cutPct, 0);
  // 号码换到 Sub 10（+200%）后原始权重 500%，超出上限的 100% 截掉
  const r2 = evaluate({ number: 5, traits: [trait('Hoodie', 'White', CF * 3), trait('Eyes', '3D Glasses', CF * 3)] }, CF);
  assert.equal(r2.lo.weight, 400);
  assert.equal(r2.lo.cutPct, 100);
  assert.equal(formatBonus(r2), '+300%');
});

test('推文示例：A plain Naka in the 1000s: 100%', () => {
  const r = evaluate({ number: 1500, traits: ['Body', 'Outfit', 'Hair And Headwear', 'Eyes', 'Mouth'].map(plain) }, CF);
  assert.equal(r.lo.weight, 100);
  assert.equal(formatBonus(r), '+0%');
});

test('配图示例：100% base + 100% trait + 50% number = 250% weight', () => {
  const r = evaluate({ number: 999, traits: [trait('Outfit', 'X', CF * 3)] }, CF);
  assert.equal(r.lo.weight, 250);
});

test('配图：不同特征的加成相加', () => {
  const r = evaluate({ number: 1234, traits: [trait('Hoodie', 'Red', CF * 1.25), trait('Eyes', '3D Glasses', CF * 1.5), trait('Mouth', 'Pipe', CF * 2)] }, CF);
  assert.equal(r.lo.weight, 100 + 25 + 50 + 75);
});

test('无挂单特征：下限按 +0%、上限按单特征最高档，两端都受 400% 上限约束', () => {
  assert.equal(MAX_TRAIT_PCT, 100);
  const r = evaluate({ number: 500, traits: [trait('Hair And Headwear', 'Blue Skinbyrd', null), trait('Eyes', 'Visor', CF * 1.71)] }, CF);
  assert.equal(r.unmeasured, 1);
  assert.equal(r.exact, false);
  assert.equal(r.lo.weight, 100 + 50 + 50);
  assert.equal(r.hi.weight, 100 + 50 + 50 + 100);
  assert.equal(formatBonus(r), '+100~200%');

  const capped = evaluate({ number: 5, traits: [trait('A', 'a', null), trait('B', 'b', null)] }, CF);
  assert.equal(capped.lo.weight, 300);
  assert.equal(capped.hi.weight, 400);
  assert.equal(formatBonus(capped), '+200~300%');
});

test('规则常量与推文一致', () => {
  assert.equal(RULES.basePct, 100);
  assert.equal(RULES.capPct, 400);
  assert.equal(RULES.startBlock, 971700);
  assert.equal(RULES.weekBlocks,1008);assert.equal(RULES.recentSales,3);
  assert.equal(RULES.measureHeight, null); // no fixed quarterly measurement is inferred from rewards start
  assert.deepEqual(RULES.traitTiers.map((t) => [t.num / t.den, t.pct]), [[3, 100], [2, 75], [1.5, 50], [1.25, 25]]);
  assert.deepEqual(RULES.numberTiers.map((t) => [t.below, t.pct]), [[10, 200], [100, 100], [1000, 50]]);
});

// Prevent overstatement from malformed metadata, and keep weight distinct from its bonus.
test('重复特征、把号码当美术特征、空集合地板拒绝计算', () => {
  const t = trait('Eyes', '3D Glasses', CF * 3);
  assert.throws(() => evaluate({ number: 50, traits: [t, t] }, CF), /重复特征/);
  assert.throws(() => evaluate({ number: 50, traits: [trait('Shielded #', '50', CF)] }, CF), /Shielded/);
  assert.throws(() => evaluate({ number: 50, traits: [] }, 0), /集合地板价/);
});
test('总权重与额外加成分别展示；理论区间受上限限制', () => {
  const exact = evaluate({ number: 500, traits: [trait('Eyes', '3D Glasses', CF * 3)] }, CF);
  assert.equal(formatWeight(exact), '250%');
  assert.equal(formatBonus(exact), '+150%');
  const range = evaluate({ number: 5, traits: [trait('Eyes', 'Unknown', null)] }, CF);
  assert.equal(formatWeight(range), '300–400%');
  assert.equal(formatBonus(range), '+200~300%');
});


test('Displayed ratio cannot round a below-threshold floor into a qualifying tier',()=>{
  const {formatRatio}=require('../src/lib/rules.js');
  assert.equal(formatRatio(124999,100000),'1.24×');assert.equal(formatRatio(125000,100000),'1.25×');
  assert.equal(formatRatio(9007199254740988,7205759403792791),'1.24×');
  assert.equal(traitTier(9007199254740988,7205759403792791).pct,0);
  assert.equal(formatRatio(123456789,1000000),'123×');assert.equal(formatRatio(1,3),'0.33×');
});

test('Reward phases match official start+1 and 1008-block week boundaries',()=>{
  const {rewardPhase,RULES}=require('../src/lib/rules');const S=RULES.startBlock,W=RULES.weekBlocks,E=S+W*RULES.weeks;
  const p=h=>rewardPhase({height:h,blockTime:{height:h,timestamp:1000000}});
  // Before and at the start the next boundary is the first rewarded block (week 1).
  assert.equal(p(S-1).state,'before');assert.equal(p(S-1).next,S+1);assert.equal(p(S-1).remaining,2);
  assert.equal(p(S).state,'boundary');assert.equal(p(S).next,S+1);
  assert.deepEqual([p(S+1).week,p(S+1).first,p(S+1).last,p(S+1).next],[1,S+1,S+W,S+W+1]);
  assert.equal(p(S+W).week,1);assert.equal(p(S+W).remaining,1);
  assert.equal(p(S+W+1).week,2);assert.equal(p(S+W+1).remaining,W);
  assert.equal(p(E).week,78);assert.equal(p(E+1).state,'ended');assert.equal(p(RULES.claimUntil+1).state,'closed');
  assert.equal(p(S+1).eta,(1000000+W*600)*1000);
  assert.equal(rewardPhase({height:S+1,blockTime:{height:S,timestamp:1}}).eta,null);
});
test('Every reward week is contiguous; shortcuts are boundaries rather than quarterly snapshots',()=>{
  const {rewardBoundaries,rewardPhase,RULES}=require('../src/lib/rules'),points=rewardBoundaries();
  assert.equal(points.length,79);assert.equal(points[0].height,RULES.startBlock);
  for(let n=1;n<=78;n++){const b=points[n],p=rewardPhase({height:b.height});assert.equal(b.week,n);assert.equal(p.week,n);assert.equal(p.last-p.first+1,1008);if(n<78)assert.equal(points[n+1].height,p.last+1);}
  assert.ok(points.every(p=>!Object.hasOwn(p,'quarter')));
});
test('Public exits establish waiting only; current unlisted state never certifies weekly eligibility',()=>{
  const {rewardContext,RULES}=require('../src/lib/rules');const S=RULES.startBlock,W=RULES.weekBlocks;
  const snap={snapshot:{height:S+500},rewardEvents:[['known',S+200,'cancel']]};
  assert.equal(rewardContext(snap,'known','unlisted').state,'waiting');assert.equal(rewardContext(snap,'known','unlisted').eligibleAt,S+W+1);
  assert.equal(rewardContext(snap,'known','listed').state,'listed');assert.equal(rewardContext(snap,'private','unlisted').state,'unverified');
  assert.equal(rewardContext({...snap,snapshot:{height:S+W+1}},'known','unlisted').state,'unverified');
  assert.equal(rewardContext({...snap,snapshot:{height:S}},'known','listed').state,'not-started');
  for(const kind of ['sale','cancel','exit'])assert.equal(rewardContext({...snap,rewardEvents:[['known',S+W+1,kind]],snapshot:{height:S+W+1}},'known','unlisted').eligibleAt,S+W*2+1);
  assert.equal(rewardContext({...snap,rewardEvents:[['known',S,'cancel']]},'known','unlisted').state,'unverified');
});


test('An exit in the final reward week must not promise a restart beyond the programme',()=>{
 const {RULES,rewardContext}=require('../src/lib/rules'),h=RULES.startBlock+(RULES.weeks-1)*RULES.weekBlocks+2;
 assert.equal(rewardContext({snapshot:{height:h},rewardEvents:[['piece',h-1,'cancel']]},'piece','unlisted').state,'no-future-week');
});
