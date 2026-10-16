# SHNAKAS rules audit

Reviewed 2026-10-15 for v0.11.0. Current evidence corrects the single-sale proxy. Earlier quarterly wording remains unresolved; no quarterly snapshot heights have been confirmed. A weight is a block-specific formula, not an accrued reward balance or a claim-eligibility certificate.

## Primary evidence

- [On-chain reward programme](https://ordinals.com/content/30adf5233d1a0eec4d3c836f195e3966acf634cf96634444358ccfe8c7c961a9i0): start971700, weekBlocks1008, weeks78, base4/cap16 in25%units; three-sale parameter for rare zero-listed traits. Inscribed programme indexed at971338.
- [Official current weights](https://shielded-api.ord-dropz.xyz/api/shielded/rewards/weights/now): per-piece percentage/rate and per-trait source/units/canonical supply, with a height and collection floor.
- [Official wallet](https://ord-dropz.xyz/wallet) and its publicly served engine: per-block weighting; listed pieces stop accruing; completed held weeks remain claimable even after a sale; delisting resumes at a reward-week boundary. Private claim pays the base; revealing a piece enables its full weight. Claims pay network fees without consuming relay credits.
- [Developer documentation](https://ord-dropz.xyz/developers), [public protocol source](https://github.com/Fl1ntstowned/shielded-ordinals) and its API docs: public listing tickets; private sends hide asset/balance details. The inspected main revision3cdbdfd predates reward implementation, so it does not resolve the three-sale aggregation.
- The [original announcement](https://x.com/Ob1_Wan_Satoshi/status/2108018318141755694) and [zero-listing reply](https://x.com/Ob1_Wan_Satoshi/status/2108032971617997133) remain historical sources. Their quarterly timing must not override the current chain/API/wallet evidence.

## Findings and corrections

| Area | Current rule / implementation |
| --- | --- |
| Base, cap, trait thresholds | 100% base;400% cap;1.25/1.5/2/3 inclusive ratios add25/50/75/100%; integer cross-products |
| Number bonus | Shielded global.start +assetId; strictly below10/100/1000 adds200/100/50%; highest tier only |
| Timing | Block-formula previews;1,008-block reward weeks; quarterly snapshot heights unconfirmed |
| Common zero-listed traits | Canonical programme supply≥20 adds100% |
| Rare zero-listed traits | Current same-block official units replace the incorrect most-recent-single-sale proxy |
| Hypothetical / historical rare traits | Median of the three most recent confirmed sales (two sales: their mean; one: that sale; none: 0%) against the collection floor; a hypothetical sale is the newest. Agrees with every official sales/none-sourced trait at971546 and971547. Same-block order ambiguity keeps per-trait bounds; no sale history keeps0–100% |
| Weekly allocation | Official preview split: poolPerWeek266,640 SHNAKAS ÷ all3,333 catalog pieces' units (100% =4 units) × my units. Not-yet-minted catalog pieces are included; matches official K and v |
| Listing / eligibility | Formula remains distinct from rewards; listing stops accrual, delisting waits for the next reward week; completed held weeks remain claimable |
| Private / revealed claim | Private claim pays base100%; full weight requires revealing the piece. Weight is not a payout balance |
| Relay credits | Public current-listing tickets only, separate from weight. Unknown unlisted balance is not inferred |
| Activity | Selected-block formula, not the weight at each historical sale |

At block **971484**, independently reconstructed **214** active listings and **150000sats** floor match the official endpoint. Before correction,60 of3327 minted catalog pieces differed, involving16 rare zero-listed trait branches. After attaching a validated same-height public basis, **3327/3327** totals agree. The official programme contains3333 catalog entries; canonical trait supply includes the six not yet minted in this snapshot. Per-piece details requested by the user are retained only in private local audit materials.

## Validation contract

The official basis is accepted only if height/floor/traits agree, sources and units are well formed, canonical supplies cover known items, and every known piece total matches independently applied thresholds, number bonus and cap. A successful inconsistent response fails synchronization and preserves prior data. An unavailable endpoint keeps independently valid floors with explicit rare-trait uncertainty. Fixed historical blocks never borrow current-tip units. No collection or wallet query is added when selecting, filtering or looking up a number.

## Remaining limits

The immutable programme specifies three sales but no published aggregation. The median rule is inferred from complete agreement with official data at two blocks while every tested alternative misses at least one trait; it is evidence, not a published specification. A same-block order of tied sales is not public, so such windows keep bounds. Weekly allocation uses the official preview split; eligibility waiting, listing during the week, private claims and the pool actually distributed are not modelled. Historical ask reconstruction still depends on event completeness and immutable prices. API state is not an independently replayed Bitcoin consensus proof. No wallet ownership, private balance, accrued rewards, partial-week retention or individual claim eligibility is inferred by the extension.

## 中文

本轮依据当前链上规则和官方钱包／API核对区块公式预览，奖励周为1,008块；季度快照高度未确认；挂单停止新增，撤单等待下一奖励周，此前完整持有周仍可领取。隐私领取为基础100%，全部权重需展示藏品领取。

同区块971484的214笔挂单、150000聪地板已独立复原；旧单笔成交代理导致60枚差异，改为经过完整校验的同高度官方特征依据后3327枚全部一致。小型零挂单特征在假设成交、撤单或历史区块中，按最近三笔成交价的中位数（两笔取平均、一笔取该笔、无成交为0%）计算；该口径在971546与971547两个区块与官方全部按成交计分的特征一致，但官方未公开说明。同一区块成交顺序不确定时保留该特征的上下界。中继额度是随藏品转移的预付中继次数，和权重、奖励余额分开；只显示公开当前挂单余额，不推断未挂单隐私余额。用户指定持仓及截图不进入开源目录。


## Listing-removal and real-trade audit — v0.11.0

The official current-weight endpoint reports formula percentages for both listed and unlisted pieces; it does not make listed pieces eligible for rewards. At971484 the3327 matches comprise214 listed and3113 unlisted pieces. A second independently reconstructed capture at971509 matches all3327 known totals, including198 listed and3129 unlisted pieces.

Sale and cancellation both remove the selected ask and can change collection/trait floors. A sale adds a sale record; cancellation does not. They are separate action models and must not share invented sale evidence or imply identical rare-trait results. Missing authoritative rare zero-listing aggregation remains a range. Owned standalone wallet cards/detail artwork show After delisting and Listed formula; wallet market cards remain After sale. This matches public component structure without reading wallet labels, balances, providers or storage. A structure change falls back to the ordinary market view rather than guessing ownership. Delisting weight is not immediate rewards: accrual resumes at the next reward week.

Real-event replay reconstructs the prior block's active asks and removes only the sold listing. It compares against separately captured official weights while checking relevant floors and individual trait contributions. **#1035 sold in971484:125% predicted,125% official at the same block**, with all relevant inputs equal after accounting for the other block events. A second same-input comparison is #2270:200% predicted at971461,200% official at971484; its observation is later, not an immediate post-sale API sample. Recent #1028 (971508) and #2529 (971505) predict300% and250%, matching official971509 totals and each trait contribution, but collection floors changed meanwhile; these are supporting observations, not isolated same-block proofs. Samples with changed inputs or merely overlapping ranges are not counted as exact validation. The public endpoint supplies current weights; the attempted numeric suffix reports week sums, not arbitrary historical block weights. No exact three-sale aggregation is inferred from coincidental matches.

中文：全目录核对包含已挂单与未挂单的当前公式值，未证明挂单有收益。成交／撤单都移除挂单，但只有成交新增成交记录；自己的钱包卡片显示撤单后，钱包市场保持成交后。真实交易验证严格区分同区块、输入相同的核对与稍后观察，不能用之后地板变化造成的差异判定算法错误，也不能把范围包含实际值算作精确验证。小型零挂单特征仍有未公开的聚合细节，保持范围。


## v0.11.0 — programme phases, weekly waiting and historical lookup

Official X search on2026-10-15 found the original quarterly re-reading wording in the October8 announcement, but no confirmed quarterly snapshot heights. Current wallet text and block-formula previews do not alone settle whether future quarterly settlement exists. The plugin therefore supplies **no invented quarter selectors**. Confirmed **reward-week starts are not weight snapshots**.

The immutable programme sets start971700, weekBlocks1008, weeks78 and claimUntil1102740. Independent extraction of the deployed client's weekAt / firstWeekOf / lastClaimableWeek matches316 boundary cases: first counted block971701; week1 spans971701–972708; week2 and the first claim boundary start972709. Final counted block1050324; all78weeks complete at1050325. Header-time plus600seconds/block is only an ETA, never a fixed wall-clock start.

Public sales/cancellations can establish a minimum waiting boundary for a new holding record. A same-week public exit and current unlisted status mean no accrual that week; the earliest next boundary is shown. At the final reward week no later eligible week is promised. No known exit means weekly eligibility is unverified: private transfers and ownership cannot be inferred. Listed state remains a selected-block fact, not a fabricated weekly payout balance. Historical loading retains only the latest public exit ID/height/kind. Live reads listing records from /state on each new block for sale history (see the v0.11.0 sale-history section) and still never infers absence of private transfers.

At block reuses the fixed-block dialog: a number and height are entered together. The result prioritizes the actual block formula, not the after-sale estimate. Confirmation switches the shared mode/data and query atomically; cancel/failure preserves the previous mode and result. Reached reward-week shortcuts are newest first; future points are disabled and include remaining blocks/ETA. A source's current height/mode remains visible across popup, market, wallet and Compare.

中文：季度快照高度未确认，不把周界当季度快照。启动锚点971700，首个计奖971701；每周1008块，第一周到972708，首次领取及第二周边界972709。按当前官方客户端函数核对316个边界案例；本轮重新下载的新客户端函数虽更名，周界算法仍一致。当前挂单显示本区块不累计；公开事件证明同周等待时才显示本周不累计及最早边界。未挂单不自动证明周资格，最后一周不会承诺不存在的下周收益。历史查询一次输入编号与区块，确认才同步切换指定模式；失败或取消保持原状。

## v0.11.0 — recent-sales rule, sale history and weekly allocation basis

**Rare zero-listed traits.** For every trait the official current-weight endpoint marks as `sales` or `none`, the three most recent confirmed sales (from public `/state` listing records) were compared with the official bonus. At971546 all83 sales-sourced traits agree with the median; mean, minimum, latest-only and maximum miss1,1,8 and9 respectively. Traits with two sales agree with the mean of the two (for example599,000 and150,000 sats give374,500, a75% tier, the official value); one sale uses that sale; all9 zero-sale traits are0%. At the bundled block971547 all92 sales/none traits agree again; this is a fixed regression test. Any aggregation within the three prices would lie between their lowest and highest tier; that bound held for all77 traits with three sales at971546.

**Sale history.** `/state` SOLD records carry `soldHeight`; it equals the buying note height for all2,232 sales, and `claimHeight` equals the claim note height for all1,554 cancellations. Snapshots keep each trait's three newest sales plus any tied with the third in the same block. The official market page itself loads `/state` and `/listings` on each new block; Live does the same once per new block (about2.6 MB, listing records only, no notes). A different height or a failed read leaves the history absent, so affected hypothetical branches stay ranges instead of going stale.

**Allocation basis.** The endpoint reports `K` (the sum of every catalog piece's units), `v` (base units per unit per block) and each piece's `perBlock = units × v`; `v = floor(poolPerWeek ÷1008 ÷ K)`. The plugin's units for the3,327 minted pieces equal the official per-piece units exactly; the other50 units at971546 belong to six catalog pieces not yet minted (1612, 1613, 2816, 2817, 2881, 2889), whose traits come from the programme's piece table. Including them, the plugin reproduces K =28,881 and v =915,909 at971546 and971547. Weekly allocation = my units ÷ K ×266,640 SHNAKAS. Only holdings not listed at the block count. A purchase or delisting re-evaluates my holdings and K together.

**Effect.** In the bundled block, after-sale and after-delisting results for all183 listings are exact numbers; previously rare-trait branches showed ranges for about a third of listings.

中文：v0.11.0 用公开 `/state` 成交记录核对官方按成交计分的稀有特征：971546 区块 83 个全部与“最近三笔成交价中位数”一致（两笔取平均、一笔取该笔、零成交为0%），平均数、最低价、最近一笔、最高价分别有 1、1、8、9 个不符；971547 区块 92 个按成交／零成交计分的特征再次全部一致，并写入回归测试。成交高度直接取自 `soldHeight`，与 notes 推算结果 2,232 笔全部一致。分配口径按官方预览：全部 3,333 枚的权重单位平分每周 266,640 SHNAKAS；插件计入尚未铸造的 6 枚后，K 与 v 与官方完全一致。内置区块 183 个挂单的成交后和撤单后结果全部为确定值。

## v0.11.0 — exact weekly figure

The weights endpoint reports `v` as an integer: v = floor(poolPerWeek ÷ 1008 ÷ K), and `perBlock = units × v`. Weekly allocation now uses exactly that integer rate (units × v × 1008 ÷ 10⁸) instead of pool × units ÷ K, which differed by up to 0.001 SHNAKAS. At block 971,553 the plugin's K = 28,947 equals the official K, v = 913,821 equals the official v, and every 150% piece (6 units) gives 5,482,926 per block, the official `perBlock` for such pieces. A live snapshot whose sale history failed to load, or was written by an older version, is rebuilt on the next check at the same height instead of keeping ranges for the whole block.

中文：官方接口的 `v` 是整数，v = floor(每周奖池 ÷ 1008 ÷ K)，每枚 `perBlock = 单位 × v`。每周分配改为按这个整数速率计算（单位 × v × 1008 ÷ 10⁸），不再用 奖池 × 单位 ÷ K（两者最多相差 0.001 SHNAKAS）。971,553 区块插件 K = 28,947、v = 913,821 与官方一致，150% 的藏品（6 单位）每块 5,482,926，与官方对这类藏品给出的 `perBlock` 相同。实时快照若成交记录加载失败或由旧版本写入，同一区块下次检查时会重新生成，不再整块保留范围。

## Post-launch verification · block 971704

The non-preview official endpoint reports K=29065 and v=910111. Independent floor/number/cap recomputation plus height-bound official fallback evidence matches all3327 inscribed pieces, and every perBlock×1008 weekly rate. This is not a quarter-freeze result: actual listing changes after the launch changed both K and individual weights. The endpoint now uses `lastBlock` for certain rare zero-listed traits. It is accepted only within the existing valid tier/supply/block/floor constraints; unknown source types remain errors.

The current-week endpoint returns w=0, anchor971700, blocks4, base14566968, and3333 accumulated amounts. The100% piece sum is0.14566968 SHNAKAS. Its current per-block rate is0.03640444, whose naive four-block multiplication is0.14561776; the difference proves why actual accumulation must use the integrated table. Personal eligibility and paid claims require the official holder record and cannot be inferred from inscription identity alone. The plugin imports visible earning-state evidence only after an explicit action, not wallet secrets.

奖励启动后在区块971704核对：官方非预览接口K=29065、v=910111，3327枚已铭刻藏品的权重和每周速率全部对齐。当前周100%藏品的累计为0.14566968，而当前每块速率乘4为0.14561776，因此必须使用实际累计表。上市变化仍改变每块权重，不能推断季度冻结。个人资格和已领取情况不能只靠编号证明。
