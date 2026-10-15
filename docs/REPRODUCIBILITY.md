# Reproducing Naka Sigil calculations

## Current rule revision

Version 0.11.0 follows the [on-chain reward programme](https://ordinals.com/content/30adf5233d1a0eec4d3c836f195e3966acf634cf96634444358ccfe8c7c961a9i0), the current official wallet, and the [public current-weight endpoint](https://shielded-api.ord-dropz.xyz/api/shielded/rewards/weights/now). These establish block-formula previews and correct the old single-sale proxy. The original quarterly wording has no confirmed snapshot heights; per-block previews alone do not prove that quarterly settlement was abolished. Base100% + trait bonuses + highest number bonus, capped400%; inclusive ratios1.25/1.5/2/3 yield25/50/75/100%. Number cutoffs are strictly below10/100/1000. Reward weeks are1,008blocks.

The bundled block is **971547** with **183** active listings and **159000 sats** floor. Its official trait units are accepted only after matching the same block, floor, catalog and all **3327** known piece totals. Canonical trait supplies include the six unminted catalog pieces from the programme's piece table. Including them, all programme units are **28,881** and the per-unit block rate is **915,909** base units, both equal to the official endpoint. The snapshot keeps each trait's three newest public sales (price and block). Raw notes, seller scripts and wallet data are excluded.

## Independent sale scenarios

Remove only the selected listing, recompute collection/trait floors, apply the common zero-listing threshold, number bonus and cap. Columns are independent, not a combined basket purchase. For a rare trait (fewer than 20 items) losing its last listing, the assumed sale becomes its newest sale and the bonus uses the median of the three most recent sales against the after-sale collection floor (two sales: their mean; one: that sale; none: 0%). This rule agrees with every official sales-sourced trait at971546 and971547 but is not a published specification (see RULES_AUDIT). Same-block sales whose order decides the window keep bounds. Current official trait units cannot be reused as after-sale evidence when inputs change.

| Shielded number | Ask (sats) | Before-sale formula | After sale | Listing relay credits |
| --- | ---: | ---: | ---: | ---: |
| 2543 | 160000 | 100% | 175% | 0 |
| 2599 | 165000 | 100% | 150% | 0 |
| 1810 | 168000 | 100% | 125% | 1 |

Each example also passes through the recent-sales branch: buying #2543 makes 160,000 sats the newest Orange Skinbyrd sale; with 155,000 and 120,000 the median is 155,000 ÷ 159,000 = 0.97×, so that trait stays +0%. The same branch gives Green Swoop 165,000 (#2599) and Red Dread 132,500 (#1810).

## Weekly allocation

Weekly SHNAKAS for a set of holdings = units of the holdings not listed at the block × v × 1,008 ÷ 10⁸, where v = floor(26,664,000,000,000 ÷ 1,008 ÷ K) and K is all programme units (100% = 4 units). This is the official endpoint's integer per-block rate; at the bundled block K = 28,881 and v = 915,909. A purchase or delisting recomputes both my units and all programme units in the scenario. A new holding counts from the next reward week; listing during a week, private claims and the pool actually distributed are not modelled.

All examples are historical block calculations, excluding fees. A range passes a minimum filter only when its lower bound qualifies. No remaining collection floor gives Unavailable. Relay credits are captured active-listing output balances; zero is known zero, not unknown. Private sends can change unlisted balances, which are not inferred from old records.

## Local reproduction

Run npm test and npm run package:chrome. Open demo/naka-sigil-demo.html to inspect the same historical engine without a wallet, API key or extension installation. The optional artwork uses public inscription URLs. Live and Fixed share one source across popup, market and Compare; Compare has no manual refresh. SHA-256 is in release/SHA256SUMS.

## 中文

v0.11.0 以当前链上奖励规则、官方钱包和当前权重接口为依据，修正单笔成交代理。季度快照高度尚未确认，不能仅凭区块预览认定季度安排已取消。公式按所选区块计算，奖励周为1,008块；基础100%，特征加成与最高编号加成叠加，封顶400%。比值门槛含等号，编号门槛严格小于。内置区块971547、183挂单、地板159000聪；接受官方特征依据前先核对区块、地板、目录及全部3327枚总权重。计入6枚尚未铸造的目录藏品后，全目录权重单位28,881、每单位每块915,909基础单位，均与官方接口一致。

上表各列独立移除一笔挂单，重算地板。小型特征失去最后挂单时，假设成交作为最新一笔，按最近三笔成交价中位数（两笔取平均、一笔取该笔、无成交为0%）对比成交后集合地板；该口径与971546、971547两个区块官方按成交计分的特征全部一致，但官方未公布算法。同区块成交顺序会改变窗口时保留范围。每周分配 = 区块时未挂单持仓的权重单位 × v × 1,008 ÷ 10⁸，v = floor(26,664,000,000,000 ÷ 1,008 ÷ 全目录权重单位)，即官方接口的整数每块速率；买入或撤单会同时重算两者。新持仓从下一奖励周起计。所有主要百分比含基础100%；未挂单不自动证明完整周资格。隐私领取为基础100%，展示藏品可领取全部权重。完整持有周可在挂单／卖出后领取；未完整的本周不能保证保留。

中继额度单独显示 API 提供的当前挂单余额，零与未知区分；不计入权重，不推断未挂单的隐私余额。运行 npm test、npm run package:chrome；演示文件为同引擎历史数据，可直接本地打开。中英文安装与 SHA-256 均在 release/README.md、release/SHA256SUMS。
