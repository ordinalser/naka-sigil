# SHNAKAS rules audit

Reviewed 2026-10-17 for v0.12.2 (owning a trait, and a listing of ours being bought), v0.12.0 (listings closing between blocks, the latest block's payout), v0.11.4 (every calculation, display and operation) and v0.11.3 (eligibility, claims and the per-block basis); earlier sections from 2026-10-15. Current evidence corrects the single-sale proxy. The announcement's quarterly wording is not in the deployed engine: weights are scored every block, and neither the engine nor the official accumulator has a weekly or quarterly snapshot block (v0.11.3). A weight is a block-specific formula, not an accrued reward balance or a claim-eligibility certificate.

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
| Timing | Weights scored every block;1,008-block reward weeks; no weekly or quarterly snapshot block in the engine or the official accumulator |
| Common zero-listed traits | Canonical programme supply≥20 adds100% |
| Rare zero-listed traits | Current same-block official units replace the incorrect most-recent-single-sale proxy |
| Hypothetical / historical rare traits | Median of the three most recent confirmed sales (two sales: their mean; one: that sale; none: 0%) against the collection floor; a hypothetical sale is the newest. Agrees with every official sales/none-sourced trait at971546 and971547. Same-block order ambiguity keeps per-trait bounds; no sale history keeps0–100% |
| Weekly allocation | Official split (the endpoint has reported `preview: false` since launch): poolPerWeek266,640 SHNAKAS ÷ all3,333 catalog pieces' units (100% =4 units) × my units. Not-yet-minted catalog pieces are included; matches official K and v |
| Listing / eligibility | Formula remains distinct from rewards; listing stops accrual, delisting waits for the next reward week; completed held weeks remain claimable |
| Private / revealed claim | Private claim pays base100%; full weight requires revealing the piece. Weight is not a payout balance |
| Relay credits | Public current-listing tickets only, separate from weight. Unknown unlisted balance is not inferred |
| Activity | Selected-block formula, not the weight at each historical sale |

At block **971484**, independently reconstructed **214** active listings and **150000sats** floor match the official endpoint. Before correction,60 of3327 minted catalog pieces differed, involving16 rare zero-listed trait branches. After attaching a validated same-height public basis, **3327/3327** totals agree. The official programme contains3333 catalog entries; canonical trait supply includes the six not yet minted in this snapshot. Per-piece details requested by the user are retained only in private local audit materials.

## Validation contract

The official basis is accepted only if height/floor/traits agree, sources and units are well formed, canonical supplies cover known items, and every known piece total matches independently applied thresholds, number bonus and cap. A successful inconsistent response fails synchronization and preserves prior data. An unavailable endpoint keeps independently valid floors with explicit rare-trait uncertainty. Historical blocks never borrow current-tip units. No collection or wallet query is added when selecting, filtering or looking up a number.

## Remaining limits

The immutable programme specifies three sales but no published aggregation. The median rule is inferred from complete agreement with official data at two blocks while every tested alternative misses at least one trait; it is evidence, not a published specification. A same-block order of tied sales is not public, so such windows keep bounds. Weekly allocation uses the official split. Eligibility follows the official engine's note weeks read from public listing records (v0.11.3, v0.11.4); private transfers, private claims, claimed amounts and where unclaimable shares go are not modelled. Historical ask reconstruction still depends on event completeness and immutable prices. API state is not an independently replayed Bitcoin consensus proof. No wallet ownership, private balance or claimed amount is inferred: a holding's week comes from public records and stays a reference until the official Wallet page sync confirms it.

## 中文

本轮依据当前链上规则和官方钱包／API核对：权重逐块计算，奖励周为1,008块，引擎和官方累计表都没有周或季度快照块；挂单停止新增，撤单等待下一奖励周，此前完整持有周仍可领取。隐私领取为基础100%，全部权重需展示藏品领取。

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

At block reuses the fixed-block dialog: a number and height are entered together. The result prioritizes the actual block formula, not the after-sale estimate. Confirmation switches the shared mode/data and query atomically; cancel/failure preserves the previous mode and result. Reached reward-week shortcuts are newest first; future points are disabled and include remaining blocks/ETA. A source's current height/mode remains visible across popup, market, wallet and Compare. (Since v0.11.3 Fixed mode is gone: a lookup at a past block is temporary and never replaces the Live data.)

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


## v0.11.3 — eligibility, claims and the per-block basis (official engine and wallet)

### Evidence

- **Engine.** The engine the official wallet loads, `https://shielded-api.ord-dropz.xyz/api/shielded/engine/shielded-browser.js` (SHA-256 `4bacffa7480dc06d7d0a0d2167785b1b06255aac9f9ba952d654029a15a013aa`). In `rewardsOf` and the claim builder: a note created at block h by a mint, purchase, reclaim or transfer earns from week index `ceil((h − 971700) ÷ 1008)` (0 when h ≤ 971700); a reward claim's change note continues in the week it is created; a note spent at block t keeps only the weeks up to index `floor((t − 1 − 971700) ÷ 1008) − 1`, and claiming its spend week fails with “week N was not over when the piece was spent”. Claims cover whole weeks only.
- **Listing spends the note.** In the public `/state` at 971783, every one of the 4,159 listing records' nullifiers was published exactly at its listing block.
- **Official wallet text** (Staking): “A listed piece earns nothing from that block on. The full weeks it held before are still yours to claim, even after a sale. Cancel the listing and it earns again from the next week.” · “a week is paid once it is over” · “A piece you receive or buy starts earning the week after it lands.” · “Held weeks a–b before it left: still yours to claim” · “Weekly, or let it build and claim once.” · “Claim privately for the 100% part, or show your piece for its full weight.” · showing reveals “that it was not listed, sold or sent from the start of the first claimed week until now”.
- **Per-block weights.** `/rewards/week/0` at 971,726 (26 blocks): for all 3,333 pieces the accumulated amount differs from 26 × current units × current v, and the average base per block was 3,627,032 against a current 3,482,064. Weights are re-scored every block from the listings active after it (small zero-listed traits from their last three sales); a week pays the sum of its 1,008 blocks. There is no weekly or quarterly snapshot block.
- **Accumulator.** `/rewards/weights/0` is per piece and does not depend on the holder. A piece listed and sold inside week 1 still accumulated all 83 blocks of week 1 by 971,783 (its average weight over them was above 300%); by the rules above neither the seller's note (spent in week 1) nor the buyer's (created in week 1) can claim week 1.

### Answers

- *Do the blocks before a listing in the same week pay the seller?* No. The seller keeps only full weeks before the listing week; the listing week, earlier blocks included, is paid to nobody. The wallet's “from that block on” is about accrual stopping; its next sentence and the engine both pay full weeks only.
- *Can unclaimed weeks wait?* Yes: one claim pays every week earned so far, until block 1,102,740 (programme `claimUntil`). A sold piece's earlier full weeks stay claimable by the seller.
- *Who receives the pool?* Each block's pool is split over the units of all 3,333 catalogue pieces (listed and unminted pieces included). A share no note can claim is not handed to anyone else. Whether it is burned, kept or reissued is not stated in the programme or the wallet: not determinable from public sources.
- *Is “weight share” the week's share?* No. Units ÷ K is the share of one block's pool at the current weights. The hero now shows **week share** = accrued this week ÷ (266,640 × blocks so far ÷ 1,008), from the official accumulator; units ÷ K stays in its tooltip.

### Every case

| What happened | This week | Later |
| --- | --- | --- |
| Held from before the week; not listed or sent this week | earns the whole week | claimable once the week ends |
| Bought this week (sale) | nothing, for anyone | earns from next week |
| Received privately this week | nothing | earns from next week (not public) |
| Listed this week, even if reclaimed at once | nothing, earlier blocks of the week included | nothing in any week while listed |
| Reclaimed this week (listed earlier) | nothing | resumes next week |
| Sold this week | nothing | full weeks before the listing week stay claimable |
| Sent privately this week | nothing | full weeks before the send stay claimable |
| Bought in the last block of a week | that week: nothing | earns from the next week |
| Held at launch (≤ 971,700) | earns from week 1 | — |
| Claiming | keeps earning, no gap | weekly or all at once, until 1,102,740 |
| Private claim / showing the piece | private claim pays the 100% base | showing collects the trait bonus, now or later |
| Listed or unminted pieces | units counted in K, claimed by nobody, not redistributed | destination not stated |

### What the extension does with it

Live snapshots carry each piece's latest public sale or reclaim inside the current week together with its listing block, and the listing block of every active listing. Every inspection, tile and lookup names the piece's own blocks and weeks (for example “listed at block L (week 1), sold at block S: … the buyer earns from week 2 (block 972,709)”). Finished weeks are read from the official weekly tables only; a holding counts from the week after its newest public purchase or reclaim, and a piece the user sold counts the weeks it kept. Private transfers are not public; the Wallet page sync confirms them.

中文：v0.11.3 依据官方引擎、钱包文案和公开数据核实。引擎：铸造、买入、撤单取回、转入产生的记录从下一周开始计；领取奖励产生的找零记录当周继续；被花掉的记录只保留花掉那一周之前的完整周，领取花掉那一周会直接报错（“week N was not over when the piece was spent”）。971783 区块 `/state` 的 4,159 条挂单，nullifier 全部恰好在挂单那一块公开：挂单就是在那一块花掉原记录。钱包文案原文：挂单后“从那一块起不再累计”，“之前的完整周仍归你，卖出后也能领”，“一周结束才发放”，“买入或收到的从落地后的下一周开始”，“可以每周领，也可以攒着一次领”，“隐私领取付 100% 部分，展示藏品领全部权重”。累计表按藏品累计、与持有人无关：一枚在第 1 周内挂单并成交的 Naka，第 1 周 83 块照样累计（平均权重超过 300%），但按上述规则卖家和买家都领不到第 1 周。权重逐块计算（971,726 区块的本周累计与“块数 × 当前权重”全部不等），不存在周或季度快照块。所以挂单那一周、包括挂单前的区块都不归卖家；没领的周可以一直攒到区块 1,102,740 一次领；每块奖池按全部 3,333 枚的权重单位分，挂单中和未铸造的份额没人能领、也不分给别人，去向官方没有说明，目前无法确认。原来的“权重占比”（单位 ÷ K）只是当前区块的份额，横幅改为“本周占比 = 本周已累计 ÷ 本周已过区块的奖池”。各种操作的结果见上表，插件的说明页列出同样的表。


## v0.11.4 — every calculation, display and operation (2026-10-17)

Ten parallel reviews re-derived each calculation from the official engine, the programme and public data, checked every screen against it, and walked through every operation a holder can make. The corrections are listed in [VALIDATION](VALIDATION.md); the rules evidence is here.

### Evidence

- **Weights, K and v are exact without official help.** At block 971,787 the extension's units and percentages equal `/rewards/weights/now` for all 3,333 catalogue pieces (3,327 minted, 6 not yet minted): K = 32,950, v = 802,803, every `perBlock` and weekly allocation equal. With the official trait basis removed, the local engine alone still matches 3,333/3,333 with no ranges. The endpoint has reported `preview: false` since launch (seen at 971,725).
- **Week 1 replayed block by block.** Scoring each block 971,701–971,787 (87 blocks) with the extension's own pipeline and summing units × v reproduces the official `/rewards/weights/0` base sum (303,748,412) and each of the 3,333 per-piece sums. In 59 of those blocks the median and the mean of a trait's last three sales fall in different tiers, so the data confirms the median rule.
- **Listings already closing.** `/listings` flags a listing whose purchase is confirming (`pending`) and one being reclaimed (`cancelling`); the official item page shows the first as “Sold · confirming in the next block. It comes back here only if that purchase fails.” Such a listing still counts at this block, but nobody else can buy it: Live snapshots mark it `closing`, and the planner counts it as gone at no cost instead of suggesting it.
- **Wallet operations.** The official wallet builds **Add relay credits** as a transfer of the piece to the vault's own address (`buildTransfer(…, vault.address, …)`): the note is spent and a new one made, so that week earns nothing and the piece earns again from the next week, with no public record. **Edit price** “replaces the old one in place — no delist, the listing keeps its place on the book”. **Prove I hold a piece** is “Free, nothing goes on-chain”. A collection offer is one “anyone holding a piece can sell into”: accepting it is a sale.
- **Late mints.** 1612, 1613, 2816, 2817, 2881 and 2889 were unminted at 971,547 and still at 971,787; their units count in K from the programme's piece table. A mint makes a note, so such a piece earns from the week after its mint. The listing records carry no mint height, so the extension shows its week as undecided until a public purchase or reclaim of it, or the Wallet page sync, settles it.
- **The programme's ask filter.** `weights.asks` sets `minPrice` 546 and the scripts `p2tr, p2wsh, p2wpkh, p2sh, p2pkh`. Public `/listings` carries no seller script, so the extension cannot apply the script part. In the 4,170 listing records read for this audit the seller scripts were only p2tr (3,666), p2sh (289) and p2wpkh (215), and the lowest ask was 1,000 sats: the filter excludes nothing today. Whether the server applies it is not visible in public code. A listing it excluded that set a floor would make the official basis disagree at the same block; the extension then keeps the last good block instead of showing different numbers.

### Not determinable from public sources

- Whether a `lastBlock` source carries the previous block's value. At 971,787 all 10 `lastBlock` traits have no sales and 0% (they were `none` at 971,547), and week 1 has no event that tells the two readings apart. Without an official basis the extension shows such a trait as an exact 0%, which would be wrong if a value is carried.
- The official order of sales inside one block. The only tie at a window edge (Purple Dread, 970,281) gives 0% in every order, and the 87-block replay had no range to resolve; such windows stay ranges.
- The 8 decimals used to show SHNAKAS: no divisibility field in the public data read confirms them.
- Whether a claim in block 1,102,740 itself is still accepted (`claimUntil`), whether a sale into a collection offer appears in the public listing records, and the mint block of a late mint.
- Where shares nobody can claim go (v0.11.3).

### Every case (the same table as About)

| What you do | This week | Later | How Naka Sigil knows |
| --- | --- | --- | --- |
| **Public actions** | | | |
| Hold it, do nothing | earns the whole week | every week; claimable once each week ends | no listing or sale record of it |
| List it (even if reclaimed at once) | nothing: the listing week earns nothing, its earlier blocks included | nothing while listed; weeks completed before the listing stay claimable | public listing record |
| Edit the price (no delist) | no change: still listed | still listed | the new ask in the listings |
| Reclaim (cancel the listing) | nothing in the reclaim week either | resumes the week after | public reclaim record |
| Sell | nobody earns that week for the piece | the seller keeps the full weeks before the listing week; the buyer starts next week | public sale record |
| Buy | nothing, even when bought in a week's last block | from next week | public sale record |
| **Private actions** | | | |
| Send it to someone | nothing | full weeks before the send stay claimable | Wallet page sync: “Held weeks a–b before it left” moves it to Left your vault |
| Receive it privately | nothing | from next week | Wallet sync shows it starting next week |
| Send to yourself, or Add relay credits | nothing: adding credits sends the piece to yourself | from next week, as before | Wallet sync shows it starting next week; that week is left out of past totals |
| **No effect on eligibility** | | | |
| Claim (weekly, or let weeks build and claim once) | keeps earning, no gap | claim deadline: block 1,102,740 | nothing to do |
| Private claim / claim with the piece shown | a private claim pays the 100% base | show the piece to collect its trait bonus, now or later | nothing to do |
| Prove you hold a piece; withdraw sale proceeds | no effect (the proof is off-chain; proceeds are BTC, not the piece) | no effect | nothing to do |
| **When** | | | |
| Held unlisted at block 971,700 or earlier | — | from week 1 (block 971,701) | a piece listed before launch starts once it is reclaimed |
| Any block of a week, first to last | the rules above apply to that week | a new holding starts the next week | — |
| Week 78, the last | the same rules | a purchase, reclaim or receipt then has no later week | — |
| After block 1,050,324 | accrual has ended | claim completed weeks before the deadline | — |
| **Other** | | | |
| Sell into an offer | like a sale: nothing that week | the seller keeps earlier full weeks; the buyer starts next week | not confirmed whether offer sales appear in the public records: sync from the Wallet page if unsure |
| A Naka minted after launch | nothing in its mint week | from the week after | its mint block is not in the listing records: shown as undecided |
| Listed and unminted Nakas | their units still count in K | nobody claims those shares and nobody else gets them; where they go is not stated | — |

中文：v0.11.4 用 10 路并行审查，按官方引擎、链上程序和公开数据重新推导每个算法，逐屏核对显示，并走查持有人可能做的每种操作。证据：971,787 区块插件的权重单位和百分比与官方 `/rewards/weights/now` 3,333/3,333 完全一致（K = 32,950、v = 802,803，每枚 `perBlock` 和每周分配都相等），去掉官方特征依据后本地引擎仍 3,333/3,333 精确、无区间；官方接口自启动后一直是 `preview: false`。按插件自己的流程逐块重放第 1 周 971,701–971,787 共 87 块、累加“单位 × v”，与官方 `/rewards/weights/0` 的基数合计（303,748,412）及 3,333 枚的累计逐件相等；其中 59 块“三笔中位数”和“三笔均值”落在不同档位，数据上确认了中位数规则。`/listings` 用 `pending` 标出正在成交确认的挂单、用 `cancelling` 标出正在撤单的挂单，官方商品页对前者显示“Sold · confirming in the next block”：这类挂单本区块仍计入地板，但别人买不到，实时快照记为 `closing`，计算器按“已移除、零成本”处理，不再推荐购买。官方钱包的“Add relay credits（加中继额度）”实际是把这一枚转给自己金库地址（`buildTransfer(…, vault.address, …)`）：原记录被花掉、生成新记录，这一周不计、下一周起恢复，且没有公开记录；“Edit price（改价）”原地替换旧挂单、不撤单；“Prove I hold a piece（证明持有）”免费、不上链；集合报价“任何持有者都能卖给它”，接受报价就是成交。1612、1613、2816、2817、2881、2889 六枚在 971,547 和 971,787 都未铸造，它们的权重单位按程序藏品表计入 K；铸造会生成记录，所以铸造那一周不计、之后计入，但挂单记录里没有铸造区块，插件显示“本周无法确认”，直到出现公开买入或撤单、或钱包页同步。链上程序的 `weights.asks` 规定最低价 546 聪、卖方脚本限 p2tr/p2wsh/p2wpkh/p2sh/p2pkh；公开 `/listings` 不含卖方脚本，插件无法按脚本过滤。本次读到的 4,170 条挂单记录卖方脚本只有 p2tr 3,666、p2sh 289、p2wpkh 215 三种，最低价 1,000 聪，当前不会过滤掉任何挂单；服务端是否真的按它过滤，公开代码里看不到，目前无法确认。若将来被过滤的挂单恰好是某个地板，同一区块的官方依据会对不上，插件会保留上一个正确的区块，不显示不同的数字。

目前无法确认：`lastBlock` 是否沿用上一块的数值（971,787 的 10 个 `lastBlock` 特征都是零成交、0%，第 1 周没有能区分两种解释的事件；没有官方依据时插件把这类特征显示为精确 0%，若确有沿用则会不对）；官方同一区块内成交的先后顺序（唯一落在窗口边界的并列是 970,281 的 Purple Dread，各种顺序都是 0%，87 块重放没有区间可反推，这类窗口保留区间）；SHNAKAS 显示用的 8 位小数没有公开的精度字段印证；区块 1,102,740 当块是否还能领取；接受集合报价的成交是否出现在公开挂单记录里；晚铸造藏品的铸造区块；没人能领的份额去向（见 v0.11.3）。各种操作的完整结果见上表，与插件说明页的表一致。

## v0.12.0 — listings closing between blocks, and the latest block's payout (2026-10-17)

- **What the market shows while a purchase confirms.** The official collection page keeps a set of inscriptions with a purchase in progress: it reads `/events/pending` from its secondary-market API when the page loads, adds each `listing_pending` event from that API's event stream, and drops an entry five minutes after it arrives. Such a card shows a spinning cart titled “Purchase in progress — just sold”. The item page says “Sold · confirming in the next block. It comes back here only if that purchase fails.”
- **What the extension reads.** The public `/listings` of the shielded API flags the same listings (`pending`, and `cancelling` for a reclaim on its way). Live now re-reads it on each check within a block, at most once a minute while a page is visible, and keeps the block's closing set beside the snapshot. On the live collection page (2026-10-17, block 971,810) the three cards with the official spinner (#1486, #2182, #1710) were exactly the ones the extension marked Selling.
- **Effect on the rules.** None: a closing listing still counts in this block's floors (it is still listed), and the official weights move only when the next block confirms it. Plans count it as gone at no cost, Best buy never suggests it, and a listing of mine that someone is buying says it will leave my vault at the next block.
- **The latest block's payout.** Each block pays every piece units × v base units (the official `perBlock`). For the holdings that count this week that is units × v ÷ 10⁸ SHNAKAS, the per-block rate behind the weekly projection; the popup and the extension page now show it instead of a full-week rate at today's weights.

中文：官方集合页会维护一组“购买进行中”的铭文：页面加载时读二级市场接口的 `/events/pending`，再接收该接口事件流里的 `listing_pending`，每条五分钟后移除；这样的卡片右上角显示转圈的购物车，标题是“Purchase in progress — just sold”，商品页显示“Sold · confirming in the next block”。插件读的是 shielded 接口的公开 `/listings`，它对同样的挂单标出 `pending`（以及撤单中的 `cancelling`）。实时同步现在在同一区块内每次检查时重读它（页面可见时最多每分钟一次），把这一块的成交中集合存在快照旁边。2026-10-17 在真实集合页（区块 971,810）上，带官方转圈的三张卡（#1486、#2182、#1710）正是插件标为“成交中”的三枚。对规则没有影响：成交确认中的挂单这一块仍计入地板，官方权重要到下一块确认后才变；方案把它当作已移除、零成本，买哪单划算不推荐它，我自己被买下的挂单会写明下一块离开金库。最新一块：每块按单位 × v 分给每一枚（官方 `perBlock`），换算成 SHNAKAS 是单位 × v ÷ 10⁸，也就是本周预计往后外推用的每块速率；弹窗和独立页用它代替了按当前权重算的整周速率。

## v0.12.2 — owning a trait, and a listing of ours being bought (2026-10-17)

- **The zero-listing supplement counts the catalog.** For all 351 traits at blocks 971,547, 971,815 and 971,827 the official trait supply equals the catalog count, minted and unminted, which is the count Own a trait uses: a trait of 20 or more such pieces with no listing holds +100% whatever the floors do; a smaller one is scored on its last three sales against the collection floor, so its bonus holds only while that floor stays in a range.
- **A listing of ours someone is buying leaves us.** It closes at the next block like any closing listing, so plans and Own a trait take it as sold, not as a free reclaim, and the piece no longer counts as ours. Before this, at block 971,827 Own a trait misjudged 34 of the 50 traits carrying a closing listing when all their minted pieces were ours (971,815: 6 of 9).

中文：零挂单补充规则按目录件数计：971,547、971,815、971,827 三个区块的 351 个特征，官方的特征件数都等于目录件数（已铸造加未铸造），垄断特征用的也是这个数：20 件以上且没有挂单的特征，无论地板怎么变都是 +100%；少于 20 件的按最近 3 笔成交与集合地板之比计，只在集合地板处在某个区间内时保持。我方挂单正被别人买走时，它和其它成交中的挂单一样在下一块关闭，方案和垄断特征把它当作卖出，而不是免费撤回，这一枚也不再算我们的。修正前，在“这些特征的已铸造件全是我们的”这一检验下，971,827 区块带成交中挂单的 50 个特征里，垄断特征判错了 34 个（971,815 区块 9 个中错 6 个）。

