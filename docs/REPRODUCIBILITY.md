# Reproducing Naka Sigil calculations

## Current rule revision

Version 0.12.5 follows the [on-chain reward programme](https://ordinals.com/content/30adf5233d1a0eec4d3c836f195e3966acf634cf96634444358ccfe8c7c961a9i0), the official wallet and the engine it loads, and the [public current-weight endpoint](https://shielded-api.ord-dropz.xyz/api/shielded/rewards/weights/now). Together they correct the old single-sale proxy and show that weights are scored every block: neither the engine nor the official accumulator has a weekly or quarterly snapshot block (rules audit, v0.11.3). Base100% + trait bonuses + highest number bonus, capped400%; inclusive ratios1.25/1.5/2/3 yield25/50/75/100%. Number cutoffs are strictly below10/100/1000. Reward weeks are1,008blocks.

The bundled block is **971547** with **183** active listings and **159000 sats** floor. Its official trait units are accepted only after matching the same block, floor, catalog and all **3327** known piece totals. Canonical trait supplies include the six unminted catalog pieces from the programme's piece table. Including them, all programme units are **28,881** and the per-unit block rate is **915,909** base units, both equal to the official endpoint. For traits held by fewer than 20 pieces, the only ones scored from sales, the snapshot keeps the newest public sales (price and block): three, plus any tied with the third in the same block (173 traits in the bundled block). Raw notes, seller scripts and wallet data are excluded.

## Independent sale scenarios

Remove only the selected listing, recompute collection/trait floors, apply the common zero-listing threshold, number bonus and cap. Columns are independent, not a combined basket purchase. For a rare trait (fewer than 20 items) losing its last listing, the assumed sale becomes its newest sale and the bonus uses the median of the three most recent sales against the after-sale collection floor (two sales: their mean; one: that sale; none: 0%). This rule agrees with every official sales-sourced trait at971546 and971547 but is not a published specification (see RULES_AUDIT). Same-block sales whose order decides the window keep bounds. Current official trait units cannot be reused as after-sale evidence when inputs change.

| Shielded number | Ask (sats) | Before-sale formula | After sale | Listing relay credits |
| --- | ---: | ---: | ---: | ---: |
| 2543 | 160000 | 100% | 175% | 0 |
| 2599 | 165000 | 100% | 150% | 0 |
| 1810 | 168000 | 100% | 125% | 1 |

Each example also passes through the recent-sales branch: buying #2543 makes 160,000 sats the newest Orange Skinbyrd sale; with 155,000 and 120,000 the median is 155,000 ÷ 159,000 = 0.97×, so that trait stays +0%. The same branch gives Green Swoop 165,000 (#2599) and Red Dread 132,500 (#1810).

## Weekly allocation

Weekly SHNAKAS for a set of holdings = units of the holdings not listed at the block × v × 1,008 ÷ 10⁸, where v = floor(26,664,000,000,000 ÷ 1,008 ÷ K) and K is all programme units (100% = 4 units). This is the official endpoint's integer per-block rate; at the bundled block K = 28,881 and v = 915,909. One block pays the same holdings units × v ÷ 10⁸ (`ShnakasRules.blockAllocation`), the “last block” figure. A purchase or delisting recomputes both my units and all programme units in the scenario. A new holding counts from the next reward week, and a week in which a piece is listed, sold or sent earns nothing for it (rules audit, v0.11.3); private transfers, private claims and where unclaimable shares go are not modelled.

All examples are historical block calculations, excluding fees. A range passes a minimum filter only when its lower bound qualifies. No remaining collection floor gives Unavailable. Relay credits are captured active-listing output balances; zero is known zero, not unknown. Private sends can change unlisted balances, which are not inferred from old records.

## Local reproduction

Run npm test and npm run package:chrome. Open demo/naka-sigil-demo.html to inspect the same historical engine without a wallet, API key or extension installation. Artwork comes from the public art endpoint the official site uses, then the inscription on Ordinals. The popup, market and extension page share one Live source; a past block is a temporary lookup, and Compare has no manual refresh. The ZIP is reproducible: entries sorted, fixed file modes, every time set to the snapshot's creation time, no extra fields. SHA-256 is in release/SHA256SUMS.

## 中文

v0.12.5 以链上奖励规则、官方钱包及其加载的引擎和当前权重接口为依据，修正单笔成交代理；权重逐块计算，引擎和官方累计表都没有周或季度快照块（见规则核对 v0.11.3）。公式按所选区块计算，奖励周为1,008块；基础100%，特征加成与最高编号加成叠加，封顶400%。比值门槛含等号，编号门槛严格小于。内置区块971547、183挂单、地板159000聪；接受官方特征依据前先核对区块、地板、目录及全部3327枚总权重。计入6枚尚未铸造的目录藏品后，全目录权重单位28,881、每单位每块915,909基础单位，均与官方接口一致。快照只为不足20件、按成交计分的特征保存最新公开成交（价格和区块）：三笔，加上与第三笔同区块的并列成交（内置区块共173个特征）。

上表各列独立移除一笔挂单，重算地板。小型特征失去最后挂单时，假设成交作为最新一笔，按最近三笔成交价中位数（两笔取平均、一笔取该笔、无成交为0%）对比成交后集合地板；该口径与971546、971547两个区块官方按成交计分的特征全部一致，但官方未公布算法。同区块成交顺序会改变窗口时保留范围。每周分配 = 区块时未挂单持仓的权重单位 × v × 1,008 ÷ 10⁸，v = floor(26,664,000,000,000 ÷ 1,008 ÷ 全目录权重单位)，即官方接口的整数每块速率；买入或撤单会同时重算两者。新持仓从下一奖励周起有奖励；挂单、卖出或转出的那一周这一枚整周没有奖励（见规则核对 v0.11.3），私下转账、隐私领取和没人能领的份额去向不建模。所有主要百分比含基础100%；未挂单不自动证明完整周资格。隐私领取为基础100%，展示藏品可领取全部权重。挂单或卖出之前的完整周仍可领取。

中继额度单独显示 API 提供的当前挂单余额，零与未知区分；不计入权重，不推断未挂单的隐私余额。运行 npm test、npm run package:chrome；演示文件为同引擎历史数据，可直接本地打开。安装包可复现：条目排序、文件权限固定、所有时间取快照生成时间、不含额外字段。中英文安装与 SHA-256 均在 release/README.md、release/SHA256SUMS。


## Eligibility and Raise weight (v0.11.3–v0.12.5)

Holding status follows the official engine's note weeks (see the rules audit, v0.11.3): a note made at block h (mint, purchase, reclaim, transfer) earns from week `ceil((h − 971700) ÷ 1008)` (week 0 at or before 971700), and a note spent at block t (listed, sold, sent) keeps only the weeks before `floor((t − 1 − 971700) ÷ 1008)`. Reproduce it from `/state?since=999999999` listing records (`height`, `soldHeight`, `claimHeight`) with `ShnakasRules.startWeek`, `spendWeek`, `notesOf` and `ownership` (one owner's run of notes from an anchor block) and `NakaPortfolio.attribution` / `runWeeks`; `saleToConfirm` names the one sale the records cannot attribute (a listing already open when the piece was added, later sold), which the owner settles. Finished weeks use `/rewards/weights/{week}` tables with `complete: true`.

Raise weight's figures are pure functions of a snapshot in `src/lib/planner.js`: `plan(snap, id, {own, goal, limit})`, `targetPlans(snap, {mine, mates, targets, goal})` (Reach 400%, one row per piece: its own cheapest plan, this piece's weekly SHNAKAS before → after, the one-world change of all our pieces, what the pieces bought earn from next week, and the total per 0.001 BTC; `mates` being the numbers added beside my holdings), `jointPlan(snap, {mine, mates, targets, goal})` (one plan for the pieces ticked), `lockTraits(snap, ours)` and `lockGroups(rows)` (owning a trait outright: the listings to buy, the numbers others hold unlisted or just bought, unminted ones, and `owned`: the bonus once the trait is all ours, whether it is stable — 20+ pieces with no listing — and for a smaller trait the collection-floor range it holds in, found by bisection on the engine's own tier test), `simulate(snap, {kind:'list'|'sale'|'cancel', id, price}, mine)` and `safeAsk(snap, id)`. The popup's Raise weight tab shows the first rows of the same functions. `test/planner.test.js` checks the multi-change scenario against the single-sale model row by row (K included), that every tier is tried, that a joint plan keeps every reached target at 400%, that each purchase names the pieces it serves, that each row of `targetPlans` is `plan()`'s cheapest plan scored in its own world, and how lock rows are grouped. A listing already closing is removed as it closes, whoever's it is, at no cost; a listing of ours that someone is buying leaves us at the next block, so it is no target and no longer counts as ours.

中文：持仓状态按官方引擎的 note 周次（见规则核对 v0.11.3）：在区块 h 生成的记录（铸造、买入、撤单取回、转入）从第 `ceil((h − 971700) ÷ 1008)` 周起有奖励（971700 及之前为第 0 周），在区块 t 被花掉的记录（挂单、卖出、转出）只保留 `floor((t − 1 − 971700) ÷ 1008)` 之前的周；可用 `/state?since=999999999` 的 `height`、`soldHeight`、`claimHeight` 与 `startWeek`、`spendWeek`、`notesOf`、`ownership`（从锚定区块取一位持有人的连续记录）以及 `attribution`、`runWeeks` 复算（`saleToConfirm` 给出公开记录无法归属、需要持有人确认的那一笔：加入时已开着、后来成交的挂单），已结束周用 `complete: true` 的 `/rewards/weights/{week}`。增加权重的结果都是快照的纯函数（`plan`、`targetPlans`（冲 400% 一枚一行：它单独冲的最省方案、这一枚每周前后、我们所有 Naka 在同一情景下的变化、买到的几枚下周起的收益、每 0.001 BTC 的合计，`mates` 是在持仓之外添加的编号）、`jointPlan`（勾选几枚的合并方案）、`lockTraits` 与 `lockGroups`（垄断：要买的挂单、别人手里没挂单或刚被买走的编号、未铸造的编号，以及 `owned`：全归我们后的加成、是否稳定（20 件以上且没有挂单），少于 20 件时在什么集合地板区间内保持，区间用规则引擎自身的档位判断二分求得）、`simulate`、`safeAsk`），弹窗的“增加权重”分页显示的是同一组函数的前几行。`test/planner.test.js` 逐行核对多挂单情景与单笔成交模型（含 K），并检查每一档都被尝试、合并方案中达成的目标都保持 400%、每笔购买都写明帮到哪几枚、`targetPlans` 每一行都是 `plan()` 最省的方案并在它自己的情景里计算，以及垄断分组。已在成交或撤单中的挂单按它关闭的方式移除、不花钱，不论是谁的；我方挂单正被别人买走时，下一块就不是我们的了，不再作为目标，也不再算进我们的每周数字。最新一块的数量 = 单位 × v ÷ 10⁸（`blockAllocation`）。
