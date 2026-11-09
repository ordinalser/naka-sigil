# Naka Sigil visual system

## Classic-only audit, v0.13.0

Preserve the published visual grammar and spatial memory: the big current-week reference, a compact statistics row, square NFT tiles, original badge geometry and one continuous planning workspace. New information should replace misleading metrics or reuse existing space; it should not require a new skin or change the meaning of weight percentages.

Historical totals describe completed holding periods, not wallet balances. Estimated weekly and remaining output are capacities frozen at the displayed block. Network output separates the exact theoretical vector, identifiable unrewarded lower bound and receipt totals. Never display these as exact actual eligible owner output. Current milestones remain independent of historical selection. See [projection and evidence contracts](MINING.md).

Original stepped shield/crown/violet gaze, graphite surfaces and restrained amber accents fit Shielded Nakas and Ord Dropz. No external artwork or fonts and no custom cursor. Motion is brief and functional — a found card's reveal on the market, a newly added holding's highlight, the Look up sheet's entrance and a loading pulse — and all of it honours reduced motion. Primary weights and block height use bitmap digits; labels use readable system monospace with Chinese fallbacks.

## Meaning and hierarchy

Every primary figure is **total holding-formula weight including the 100% base**, across grid/list, Activity, Vault, details and queries. Only contribution rows use `+N%`. A formula value does not establish rewards or eligibility. One block/header-age basis accompanies every inspection; the block-weight/accrued-reward distinction stays visible.

Listed grid/list NFTs show **After sale**. The inspection has one large simulated-sale total and a smaller **Before-sale formula** reference. Its amber listing strip says **No rewards while listed**. Unlisted pieces show their selected-block formula, with eligibility unverified. Missing offer data explicitly means status unknown. Activity uses the synced block as things stand, the same as the market: a listing still open shows its weight if bought now, under its own label; the weight at a past sale opens from that sale's block under Past sales.

The market has one integrated desktop context/action row: block, actual header age, source, minimum filter and Compare. Narrow screens use two rows; optional detailed reward scope, assumptions and start planning stay in native hover and focus-accessible descriptions. No separate banner/toolbar stack or launch card.

The primary total is strongest. Changed traits receive quiet amber row emphasis, brighter values and inline before → after contributions or price ratios. Unchanged traits remain visible with subdued type. One compact formula line supplies base, cap and ratio meaning; a separated caution group supplies only relevant limits. No duplicate listed column, data expander, cost-per-weight statistic or purchase urgency.

Each total and range endpoint retains its own band color: 100% gray; 125–175% green; 200–275% blue; 300–375% violet; 400% gold. Bands describe weight, not NFT rarity or reward eligibility. Highest-only filled Sub10/Sub100/Sub1K tickets sit beside primary figures. Their bonus is already included.

## Inspection geometry and interaction

Desktop hover width 420px, clamped to the viewport; inline detail panels at most 520px. A single result column avoids the former wide three-column ledger. The result caption belongs inside its primary tile. Trait names and calculation evidence stay complete. Short screens place unchanged bonuses and ratios on one line, preserving hierarchy rather than clipping rows. Complete English/Chinese number queries remain checked at 380×480. Market inspections preserve the visible origin: the full ledger is shown where space permits, with internal scrolling only when no side can fit it without covering the source badge. The panel stays within the viewport on 320×480 screens.

The inspection bubble shares an edge with its originating badge (no gap, rounded toward the badge), so moving the pointer from badge to bubble never crosses empty space; a selected badge's "✓ Compare" tab counts as part of the badge. A curved speech-bubble tail sits on that shared edge beside the badge (before it when the bubble edge has room, otherwise mirrored after it) and curls toward it, with a quiet matching outline on the active badge. Placement flips between all four sides and shifts within viewport margins. If only a number ticket remains visible, that visible badge region is used. Fully clipped origins close the inspection. Visual viewport changes dismiss it, and content/anchor resizing or SPA layout changes update placement. The pointer is decorative and adds no screen-reader noise.

Hover closes in the same pointer-exit event, with no timeout or fade, including when the badge remains focused. Moving through the pointer into the surface preserves inspection without a close timer. Internal evidence scrolling preserves inspection; scrolling elsewhere dismisses it. Keyboard focus, Enter/Space and touch open it; Escape, outside click, viewport resize, scrolling outside the surface and window blur dismiss it. Focused keyboard inspection does not require mouse motion. Text is always created as text nodes.

## Toolbar popup

*Superseded: the popup became the wallet-style holdings popup in v0.11.0 (below), and Live / Fixed block was removed in v0.11.3. The popup always follows the latest block; a past block is a temporary lookup that never replaces the Live data.*

Primary **Live / Fixed block** controls share one source contract. New installs default to Live, saved explicit modes survive. The two mode buttons lead their own row, clearly apart from the language switch in the header corner, with a short status (pixel square + one line) beside them; failure details and the retained data height are in the status tooltip rather than a diagnostics section. Fixed opens a temporary block-height dialog; Cancel preserves mode/data, and successful confirmation changes both atomically, pausing automatic checks. Query results show the shared mode beside the calculation block; return to Overview to change it. Live receives heartbeats from popup, Compare and market, with 20-second worker keepalive during long batches.

The first screen shows block context, number lookup and one compact Compare entry with the selected numbers. The former weight ladder is removed: a historical price shortlist repeated the comparison catalog and added a second visual table. The lower section now leads to the useful next action instead of filling space. Labels use the normal arrow cursor; interactive entries use a pointer.

Pixel character carries through the popup: 2px pixel-cut corners on controls and cards, pixel-dotted rules, a pixel block before section titles, and bitmap digits for the block height and card stats. The overview Compare entry shows four pixel pips with the n/4 count, matching the Compare page toolbar. Query navigation shows only Overview and language; a read-only Live/Fixed badge sits beside the result block and timestamp. The number field, complete card and comparison action share one vertical layout. The card distributes spare height through readable trait rows, rather than leaving a gap above a separate footer. A short-window layout preserves all calculation and caution text.

The overview distributes available height between the calculation card and Compare entry. Lookup stays between them; Rules finishes the content above the market footer, without an empty spacer. Selected counts from zero to four and both languages fit the 600px view. Short windows use compact spacing; expanded Rules scroll within the same popup height.

The root has intrinsic 600px height so Chrome can size the real action popup correctly; the body adapts to constrained space. Native `chrome.action.openPopup()` checks cover the actual 380×600 view, Rules, English/Chinese queries, rank tickets, long names and Overview. A viewport-relative root previously caused a 36px preferred-size feedback loop.

Reward-start height 971,700, selected-block distance and approximate UTC date use header time plus 600 seconds/block. They are planning context, not a live countdown, buying deadline, a quarterly measurement or eligibility guarantee. Unknown header time supplies no ETA. Time refreshes do not rebuild the ledger or move focus.

## Review and release

Review includes English/Chinese, exact/capped/ranged results, changed and unchanged inputs, long/hostile names, number boundaries, independent colors, keyboard/touch/immediate dismissal, short screens and actual market grid/Activity. Private profiles, helpers, captures and checkpoints are excluded from the allowlisted public release. Fixed extension identities are preserved.


## Tone: Find your Naka. Raise your weight.

**Find your Naka. Raise your weight. / 找到你的 Naka，增加你的权重** is the project's voice. It covers choosing a higher-weight Naka to buy, whether it is the first or the fifth, checking the ones already held and raising their total weight; the second clause uses the same verb as the Raise my weight feature, and it names weight (the protocol term) rather than promising SHNAKAS. Copy names the decision (price, after-sale weight, what changes) and avoids yield, eligibility, scarcity value or guaranteed transaction claims.

## Purchase comparison workspace (0.10.0, revised 0.10.3)

The Compare headline is the project tagline; the secondary line names what is compared: weight, ask and trait bonuses.

A separate extension tab accommodates **four** candidates at desktop widths while leaving the popup compact. Label136px + candidate235px minimum means four columns need1076px; smaller screens scroll the table, never compress it into unreadable columns. The desktop frame is1280px maximum with32px gutters. After-sale totals are the largest original pixel digits; ask prices are the next strongest numeric row; before-sale formula references and evidence ratios stay quiet. Each candidate uses the same base100 metric, same source block, separate sale. Trait names identify the artwork; their bonuses explain how weight differs, while ↑/↓/◆ explain the purchase's effect. There is no fabricated best-buy score.

Monospaced readable text, stepped sigil/artwork, square controls and original pixel totals provide a consistent pixel character without forcing complex Chinese or long trait names into tiny bitmap lettering. Full-screen thumbnails enlarge in a viewport-bounded fixed preview, with immediate pointer exit, focus and Escape. All catalog cards show BTC ask and after-sale weight. The header stays light: height, header age and mode share one line under the headline. Compare follows the popup's mode. There is no manual refresh control: Live follows automatic checks, while Fixed retains the selected block. Header age uses the Bitcoin header time. The add field, selection count (four pips plus "n / 4") and Clear form a toolbar joined to the top of the table they control. Historical/demo data is never labeled current inventory. Opening Compare in Live mode resumes its shared automatic synchronization; Fixed and the portable demo do not poll.

## Comparison selection loop (0.10.3)

Every place that shows an NFT shows whether it is in Compare, and every add control explains its state. One control has three states shared by market inspections and popup lookup: **＋ Compare**; **✓ In Compare**, revealing **✕ Remove** on hover/focus (suppressed right after adding until pointer or focus leaves); and **Full 4/4 · open Compare**, which opens the page where one can be removed. Market badges of selected NFTs get a gold frame and a **✓ Compare** tab (floating badges) or corner check (in-flow badges). The Compare catalog marks selected cards and explains a full selection above the cards. Adding a number that is already selected reports it instead of toggling it off.

中文：项目基调为“找到你的 Naka，增加你的权重”，覆盖挑选买入（第一枚或更多）、查看持仓和增加持仓总权重；后半句与“增加我的权重”功能用同一个动词，说的是协议里的权重，不承诺 SHNAKAS 收益。比较页最多四列，宽屏完整并排，小屏横向查看。优先展示成交后总权重及挂价，成交前公式值与比值降级；属性加成解释差异，高亮解释成交影响，不虚构最佳购买评分。头部只保留一行区块高度、区块时间与模式，比较页跟随弹窗的实时 / 指定区块模式，不设更新按钮或核验时间。加入比较的按钮有三种状态：“＋ 加入比较”“✓ 已加入比较”（悬停显示“✕ 移出比较”）“已满 4/4 · 去比较页 ↗”；已加入的 NFT 在市场徽章上带金色“✓ 比较”标记。

## Standalone wallet

`/wallet` is a separate full-screen wallet. Its collection mosaics represent multiple assets and receive no per-piece score or invented aggregate. Only a known public inscription inside an individual `button.sv-tile > .aspect-square` in `.sv-shell .sv-piece-grid`, or the artwork of a `.ps-wrap[role=dialog]` piece sheet, receives the compact badge. A shared strip immediately before the asset grid identifies the selected block, age and source; block-formula scope remains explicit. Listed pieces use the same after-sale formula as market listings; unlisted pieces show their selected-block holding formula. Inspection retains listed/no-reward status and block/reward limitations. Native staking balances, setup/backup/restore, arriving placeholders and payment-confirmation forms receive no injection. No wallet provider, page storage, private API or owner record is read. The existing public-snapshot engine is reused.

The implementation is based on the publicly served wallet components inspected on 2026-10-15. The logged-out onboarding page was inspected live. Responsive unlocked-view checks use synthetic DOM fixtures, not a user's unlocked wallet; actual holdings remain unverified until checked by the owner.

## Current reward basis and relay credits (2026-10-15)

The current endpoint previews block-specific formulas and the on-chain programme defines 1,008-block reward weeks. Quarterly snapshot heights and their relationship to the preview remain unconfirmed. Same-height official `/rewards/weights/now` trait units are accepted only when their floor, named traits, canonical supply and every known piece total agree with the independent threshold/number/cap engine. A successful but inconsistent response fails synchronization; transport failure preserves valid floor data with explicit rare-trait uncertainty, never inherited stale units. Current zero-listed rare weights use official evidence; a hypothetical sale cannot simply reuse the pre-sale units. The public programme says three recent sales but does not define their aggregation in the published reference source. Unverified rare after-sale cases therefore show bounds.

Relay credits appear as a separate utility row when captured in an active listing, with zero distinct from unavailable. A known balance shows even when it is zero; an unavailable one shows nothing. They do not change weight. Comparison columns can compare these balances next to asks. The wallet's own credit display is not duplicated or extracted from private storage. API-art identities are supported only on the new `/wallet` route, from the two official origins, with exact collection ID and an existing local asset-to-inscription mapping. Original collection-grid/list/Vault slot rules stay intact; pending wallet market tiles are excluded.


## Owner delisting context (v0.11.0)

Standalone owned asset tiles are identified by the public owned-card valuation-caption structure; piece-sheet artwork belongs to the same owner view. A listed owned piece uses a distinct cancellation model and After delisting caption. The native wallet market has plain captions and retains After sale. Source height/mode, tiers, changed rows and immediate hover dismissal remain shared. Cancellation never fabricates a sale record. The captured listing relay-credit balance is omitted from the delisting ledger because cancellation can consume a credit; the extension does not predict a post-cancellation balance or perform the transaction. Unrecognized card structure retains the ordinary market presentation.

## Portfolio workspace / 持仓工作区

The popup remains a compact lookup and block controller. The larger extension workspace contains Compare, My holdings, and Browse anchors. Keep purchase decisions in one source context: candidate ask and after-sale weight, existing holdings change, and my weekly SHNAKAS before → after. Ownership is user-declared; any place showing a Naka (Vault, market inspection, popup lookup) can add it, and numbers typed in My holdings cover other accounts. Cancellation analysis removes the offer without adding an NFT; purchase analysis excludes already-held candidates. Shared-trait counts explain which existing holdings may be affected, while a changed collection denominator can affect other traits too. Formula totals stay percentages. Weekly allocation is labelled **SHNAKAS per week** and always names its basis (official preview split at the selected block; only unlisted holdings; new holdings from the next reward week). **Raise my weight / 增加我的权重** names the user's goal rather than a trading verb; it ranks listings by the conservative weekly gain, then by ask, and shows nothing when no listing helps.

弹窗继续聚焦区块和编号查询；较大的独立页面通过比较、我的持仓和找挂单三个入口组织信息。购买分析保持同一区块，区分挂价、新 NFT 权重、原有持仓变化和成交后合计。持仓由用户维护；撤单不会新增一枚 NFT，已加入持仓的藏品不作为购入候选。共享特征数量解释关联，集合地板价变化也可能影响其他特征。公式合计仍以百分比显示。每周分配标为“SHNAKAS／周”，并注明口径（所选区块的官方预览分配；只计未挂单持仓；新持仓从下一奖励周起计）。“增加我的权重”以用户目标命名，按每周增量下限排序、同值按挂价；没有能提升的挂单时明确说明。

## Holdings first (v0.11.0) / 持仓优先

Users care most about what they earn, so My holdings leads. The popup keeps its upper half (mode, block card, number lookup) unchanged and replaces the old Compare entry with a holdings card: the weekly SHNAKAS figure in the same pixel digits as the block number, wallet-style thumbnails with each weight (listed holdings dimmed), and the read-only promise. Compare becomes a small footer button beside the source link and Open market. The extension page orders My holdings, Compare and Snapshot listings; holdings are tiles with artwork, weight and weekly SHNAKAS. The Vault and `/wallet` bar shows what the pieces on that page earn each week, and its single button states exactly what it will do: add all, add the rest, or that all are already added.

用户最关心自己能分到多少，所以“我的持仓”放在最前。弹窗上半部分（模式、区块卡、编号查询）不变，原来的比较入口换成持仓卡：每周 SHNAKAS 用与区块号相同的像素数字，下方是钱包式小图和各自权重（挂单中的变暗），最后是只读说明。比较降为底部小按钮，与开源链接、打开市场并列。独立页面顺序为 我的持仓、比较、快照中的挂单，持仓以宫格展示图片、权重和每周 SHNAKAS。金库和 `/wallet` 的持仓条显示本页藏品每周分配，按钮文案明确说明会做什么：全部加入、加入其余几枚，或已全部加入。

## Wallet-style popup and extension page (v0.11.0) / 钱包式弹窗与独立页面

The popup follows the familiar wallet pattern without wallet features: a header (sigil, name and version, the read-only promise, a block chip that opens the Block tab, language), one view at a time, and a bottom bar with four jobs only: Holdings, Look up, Compare, Block. There is no swap, buy, send or account switcher, because the extension never transacts. Holdings is the default: the weekly SHNAKAS figure in pixel digits, then every holding as a 6-column thumbnail grid (three rows visible, the rest unfold); a thumbnail looks that Naka up; a “+” tile starts a lookup. A lookup result is a full page with Back, which keeps the complete ledger on one screen. Compare dots are round. The read-only explanation, rules and source link live in the folded About section of the Block tab; the header keeps a one-line reminder.

The extension page has a sticky top bar with brand, version, segmented section tabs with live counts (the visible section is marked), language and market. My holdings comes first: the pixel weekly figure, an add tile that opens a small number popover (Enter or Add; duplicates and unknown numbers explain themselves), tiles with weight and weekly SHNAKAS, and a one-second highlight on a newly added holding. A listed holding explains on hover what delisting would change; a listing card explains on hover what buying it would change. Compare uses the same “+” popover. Read-only, allocation arithmetic, rules and data notes are folded at the end. Export / import was removed: real use is the extension and its own page.

弹窗借用钱包的结构而不做钱包功能：顶部是标志、名称版本、只读说明、区块标签（点开区块页）和语言；中间一次只显示一个页面；底部只有四个功能：持仓、查询、比较、区块。插件从不交易，所以没有兑换、购买、转账或账户切换。默认打开持仓：像素大字的每周 SHNAKAS，下方 6 列小图展示全部持仓（先显示三行，其余可展开），点小图查询该枚，“+”格开始查询。查询结果是带“返回”的整页，完整明细保持一屏。比较的圆点为圆形。只读说明、规则和开源链接放在区块页折叠的说明里，顶部保留一行提示。

独立页面顶部是吸顶栏：品牌、版本、带实时计数的分段导航（自动标出当前区域）、语言和市场。我的持仓在最前：像素大字每周分配，“+”格弹出编号输入（回车或点加入；重复或不存在的编号会说明原因），每枚显示权重和每周 SHNAKAS，新加入的一枚高亮 1 秒。挂单中的持仓悬停即显示撤单后的变化；挂单卡片悬停即显示买入后的变化。比较使用同样的“+”输入。只读安全、分配算法、规则和数据说明折叠在页末。导出导入已移除：实际使用以插件和插件页面为准。

## Three tabs and one holdings language (v0.11.0) / 三个功能栏与统一的持仓表达

The popup has three tabs: **Holdings** (the block card on top, then My holdings), **Look up & compare**, and **About**. The block sits above holdings because the weekly figure is computed at that block. Adding a holding or a comparison happens in place through a small “#number” field; nothing jumps to another tab. Holding tiles are three to a row with number, weight and weekly SHNAKAS under each image; empty states keep a full layout (a wide “+ Add” row, four comparison slots that each start an entry). Comparison is shown in the popup itself; the extension page keeps the full trait table.

What a purchase or delisting does to my holdings is shown the same way everywhere (market hover, the market item page, popup lookup, extension page hover): this Naka with its weight and weekly SHNAKAS, my other holdings, and the total before → after in pixel figures. **Raise my weight** opens the extension page's listings ranked by that gain, each with **Buy ↗** to the item page, where the same block confirms the gain. Hover targets use the pointer cursor.

弹窗三个功能栏：**持仓**（上方区块卡，下方我的持仓）、**查询·比较**、**说明**。区块放在持仓上方，因为每周分配就是按这个区块计算的。添加持仓或比较都在原地输入编号，不跳转。持仓方块一行三个，图片下标出编号、权重和每周 SHNAKAS；空状态也保持完整布局（整行的“＋ 添加”、四个可点击的比较空位）。比较直接在弹窗显示，完整特征表留在独立页面。

买入或撤单对持仓的影响在各处用同一种表达（市场悬浮、市场详情页、弹窗查询、独立页面悬停）：这一枚的权重与每周 SHNAKAS、原有持仓变化、合计变化前 → 变化后（像素数字）。“增加我的权重”打开独立页面中按增量排序的挂单，每枚都有“去购买 ↗”直达详情页，详情页再用同样的表达确认增量。可悬停的元素统一使用手指指针。

## Weight and allocation are two dimensions / 权重与分配是两个维度

A holding has a weight (its formula value at the block, which the official endpoint reports whether it is listed or not) and an allocation (the SHNAKAS it earns each week, zero while listed). Owners care most about the allocation, so it leads: the weekly total is the largest figure, in warm gold, and every tile shows the number, the weight and its weekly SHNAKAS; a listed tile keeps its weight, shows 0 for the week and carries a Listed tag. What delisting would bring (that piece's new weight and weekly SHNAKAS, and the effect on other holdings) is on hover. The block card has no title: its mode switch sits on the left, the block in pixel digits, then the stats. Repeated labels were removed (no separate “estimated weekly allocation” caption above a figure already labelled SHNAKAS / week; no block number repeated under the holdings figure). The About content is generated from the rule constants: a read-only checklist, the weekly formula, rule tiles for trait and number bonuses, the zero-listing rule and the reward schedule.

持仓有两个维度：权重（该区块的公式值，官方接口对挂单中的藏品也照常给出）和分配（每周分到的 SHNAKAS，挂单期间为 0）。用户最关心的是分配，所以它是主角：每周合计是最大的数字，用暖金色；每个方块都显示编号、权重和每周 SHNAKAS；挂单中的方块保留权重，每周显示 0，并带“挂单中”标签；撤单后能得到什么（这一枚的新权重和每周 SHNAKAS，以及对其他持仓的影响）在悬停时显示。区块卡去掉标题，模式切换放在左侧，下面是像素区块号和统计。去掉了重复描述（数字已带“SHNAKAS / 周”就不再有“预计每周分配”标签，持仓数字下不再重复区块号）。说明内容直接由规则常量生成：只读清单、每周公式、特征与编号加成表、零挂单规则和奖励时间表。

## Holdings home, Block tab and one hero colour (v0.11.0) / 持仓首页、区块页与单一主色

Review of the stacked home (block card above holdings) found two hero numbers of the same size and colour competing, warm-on-warm cards blurring into each other, an add tile as large as an NFT pushing holdings below the fold, and cards narrower than the header because of the scrollbar. The popup now has four tabs ordered by use: **Holdings** (home), **Find & compare**, **Block**, **About**. Home opens with one status line (mode, block, age, reward start) that leads to the Block tab, then the weekly SHNAKAS as the only gold figure, then holdings four to a row with number, weight and weekly SHNAKAS, an “＋ Add” button beside the list title, and Raise my weight. Without holdings, home is a centred first-run prompt with one primary action. The Block tab always has data (the bundled snapshot at least): mode, block card, reward schedule, history lookup. Cards share one neutral charcoal; orange-gold marks actions, green means live or gain, violet means read-only or information. In the extension page, listing cards keep the listing's current facts (ask, relay credits) apart from the after-sale facts (weight, gain for my holdings) with a divider, so relay credits are not read as after-sale values.

此前首页把区块卡叠在持仓上方，审视发现：两个同样大小、同样颜色的主数字互相争夺视线，暖色卡片相互糊在一起，“添加”方块和 NFT 一样大，把持仓挤出首屏，滚动条又让卡片比顶部窄。现在弹窗四个功能栏按使用频率排列：**持仓**（首页）、**查询·比较**、**区块**、**说明**。首页先是一行状态（模式、区块、时间、距奖励启动，点击进入区块页），然后是唯一的金色数字——每周 SHNAKAS，再是一行四个的持仓方块（编号、权重、每周 SHNAKAS），“＋ 添加”在列表标题旁，最后是“增加我的权重”。没有持仓时首页是居中的引导，只有一个主操作。区块页始终有数据（至少是内置快照）：模式、区块卡、奖励时间表、按区块查历史。卡片统一用中性深灰；橙金色表示操作，绿色表示实时或增加，紫色表示只读或说明。独立页面的挂单卡用分隔线把挂单当前信息（挂价、中继额度）和成交后信息（权重、对我的持仓增量）分开，避免把中继额度误读为成交后的数值。

## No repeated facts (v0.11.0) / 不重复同一事实

Each fact appears once per view. Home drops the “My holdings · 7” head (the view is the holdings): the count belongs to “All holdings (7)”. The Block tab keeps its learned top (mode, block card with the countdown) and below it shows only facts the top does not: what one unit of weight is worth at this block (100% and 400% per week, K, the pool, the per-unit rate v) and the reward period (current or first week range, completed weeks, last rewarded block, claim deadline). Estimated times are local time to the minute of the estimate (header time plus 10 minutes a block), marked “about”. Adding a holding or a comparison opens a small dialog, so the page underneath never shifts. Tab order: Holdings, Block, Find & compare, About. Raise my weight lists the lowest ask first; Largest gain is one click away.

每个视图里同一事实只出现一次。首页去掉“我的持仓 · 7 枚”（这一页本身就是持仓），数量放到“全部持仓 (7)”。区块页保持用户已熟悉的上半部分（模式、带倒计时的区块卡），下面只展示上面没有的信息：本区块一个权重单位值多少（100% 与 400% 每周可分多少、K、奖池、每单位每块速率 v），以及奖励周期（当前或第 1 周的区块范围、已完成周数、最后计奖区块、领取截止区块）。预计时间显示为本地时间，按区块头时间加每块 10 分钟推算并精确到分钟，前面标“约”。添加持仓或比较时弹出小对话框，下方页面不跳动。功能栏顺序：持仓、区块、查询·比较、说明。“增加我的权重”默认按挂价从低到高，一键可切换为“增加最多”。

## Calm screens (v0.11.0) / 不拥挤的界面

Number entry takes several comma-separated numbers; valid ones are added in input order, and every skipped entry is named with its reason (not a number, not in this block's data, already added, Compare full). The weekly-figure card holds only the reward (the figure and its share of the pool); the list head carries everything else on one row: its title, then two identical quiet links, Raise my weight ↗ and Manage ↗ (both open the extension page), then the one framed action ＋ Add; the list ends with a full-width “Show all” row. About keeps only the read-only card open; the allocation arithmetic, weight rules and data notes are rows that unfold one at a time. An empty comparison is one panel that is itself the add button; a partial one shows a single “＋ N more” slot. The Block tab spaces its cards evenly within one screen.

编号输入支持用逗号一次输入多个；有效编号按输入顺序添加，每个被跳过的条目都写明原因（不是编号、不在当前区块数据中、已添加、比较已满）。每周分配卡片只放奖励本身（数字和占奖池比例）；其余操作都在列表头这一行：标题，然后是样式完全相同的两个浅色文字链接“增加我的权重 ↗”“管理 ↗”（都打开插件独立页面），最后是唯一带框的“＋ 添加”；列表末尾是整行的“展开全部”。说明页只展开只读卡片，分配算法、权重规则和数据说明收成可逐个展开的行。比较为空时是一整块可点击的添加面板，部分选中时只显示一条“＋ 还可加入 N 枚”。区块页的卡片在一屏内均匀留白。

## Focused reward card (v0.11.1) / 精简奖励卡

The popup keeps a34px pixel amount, a short week label/progress, and three secondary metrics. The desktop workspace uses a compact horizontal card: accrued amount left, current rate/projected week/claimable right. Narrow screens stack naturally. No Vault/Showcase actions or repeated explanation paragraphs; reference assumptions and accumulation height are hover details. Pending/error feedback stays visible. Amount formatting does not change calculation precision.

弹窗使用34px像素累计数字，搭配短周标签、进度及三个辅助指标。独立工作台采用紧凑横向卡：累计在左，当前速率、本周预计、可领取在右；窄屏自然纵排。移除保险库、截图展示按钮与重复说明，参考假设和累计区块放到悬停提示；等待和错误反馈仍可见。显示位数调整不改变计算精度。

## Compact amount and weight share (v0.11.2) / 累计与算力占比

Popup amount30px, desktop40px. Weight share is restored beside the primary amount using the existing allocation: unlisted holding units / all catalogue units, not private confirmed reward entitlement. Per-block, projected-week and claimable metrics are compact inline label/value pairs rather than three stacked columns; longer ranges wrap as whole metric groups. No balance or NFT storage changes.

弹窗30px、桌面40px累计数字，旁边恢复总算力占比（未挂单持仓权重单位÷全目录权重单位，非个人已确认奖励份额）。三个辅助指标用紧凑同行标签和数字，较长范围按指标组自然换行。不改变奖励精度或用户NFT存储。


## One-band reward hero (v0.11.3) / 单条奖励横幅

The hero is one band: this week's SHNAKAS (pixel figure) on the left; Projected, Weekly and Week share as three equal stats with the same type size on the right (there is no Claimable stat: what is still claimable only the official wallet knows); a 2px week bar; one status line (“5 earning this week · 1 starts next week · 1 listed”). Weight share is one stat among equals instead of a second headline. The extension page header shrank to one band as well: title and intro left, block basis right. Popup 30px figure, desktop 40px.

横幅只有一条：左边本周 SHNAKAS 像素数字；右边“本周预计”“每周”“本周占比”三个等宽、同字号的指标（不设“可领取”：还有多少可领只有官方钱包知道）；下方 2px 周进度条和一行状态（“5 枚计入本周 · 1 枚下周起计 · 1 枚挂单中”）。权重占比不再作为第二个大标题，与其它指标同级。独立页顶部也压成一条：左边标题和简介，右边区块信息。弹窗数字 30px，桌面 40px。

## No layout jumps (v0.11.3) / 加载不抖动

Every state renders the same parts in the same order. A value that cannot be computed yet keeps its slot and is hidden (the figure, its unit, a stat, a tile's amount); the status line says what is loading. Holding tiles always have three caption lines. Artwork elements are cached per place and reused across renders, so refreshes never reload images. A newer block without a newer accumulator keeps the last figure instead of blanking it. Measured: every hero and tile box is identical across loading, failed and loaded states in the popup and on the extension page.

所有状态按相同顺序渲染相同部件。暂时算不出的数值保留位置、隐藏显示（大数字及单位、指标、瓦片金额），状态行说明正在读取。持仓瓦片始终是三行说明。图片元素按位置缓存、跨渲染复用，刷新不会重新加载图片。新块已到但累计表未更新时保留上一块的数字，不清空。实测弹窗和独立页在“读取中/失败/已加载”三种状态下，横幅和每个瓦片的位置尺寸完全一致。

## Every reason names the NFT (v0.11.3) / 原因精确到这一枚

No generic eligibility sentence remains. A tile tooltip, a lookup, a market inspection and the weight card all say what happened to that piece and from which week it counts, with blocks: “listed at block L (week 1), sold at block S: nobody earns that week for this piece; the buyer earns from week 2 (block 972,709)”. A purchase or reclaim inspection says what doing it now means for this week and the next. About lists every case as one row (what happened · this week · later).

不再有笼统的资格说明。瓦片提示、查询页、市场明细和权重卡片都说这一枚发生了什么、从哪一周开始计，并写出区块号；购买或撤单的明细说明“现在做”对本周和下周意味着什么。说明页把每种操作列成一行（发生了什么 · 本周 · 之后）。

## Holdings: weight card, weekly totals, left your vault (v0.11.3) / 持仓：权重卡片、每周收益、已离手

On the extension page a holding's weight opens the market's breakdown card (traits, ratios, number bonus, this NFT's eligibility) plus its average weight over this week from the official accumulator; the rest of the tile opens the listing simulator. Finished weeks appear as a small table once there is one; pieces sold appear under “Left your vault” with the weeks they keep. A holding added while it was listed (not from your own Vault or Wallet page) whose listing then sold asks once whether that was your sale or a listing you bought.

独立页上，持仓的权重数字悬停显示与市场一致的明细卡片（特征、倍数、编号加成、这一枚的资格），并附本周平均权重（官方累计表）；点瓦片其它位置打开挂单模拟。有已结束的周时才显示“每周收益”小表；卖出的 Naka 放在“已离手”，写明保留哪几周。加入时正在挂单（且不是从自己的金库或钱包页加入）的持仓，之后这个挂单成交时只问一次：是你卖出的，还是你买入的。

## Planner by goal (v0.11.3) / 计算器按目标组织

Five tabs, each opening with one line of “I want …” and one of “how”: Best buy (listings that raise my weekly SHNAKAS, best value per 0.001 BTC first, gain split into my holdings now and the bought piece from next week), Reach 400% (select holdings; steps with buy links; my own or a teammate's listing reads “reclaim your listing (free)” automatically), Lock a trait (this block's +100% with the exact listings to buy, and whether a monopoly is possible, with advice once it is), Simulate (my holdings listed with an ask field each and results as you type; any number can be listed, sold or reclaimed; results show K, how many pieces rise or fall, my weekly total and each of my pieces before → after), Team (a name and numbers per teammate, a shared plan with a buyer per purchase and guard lines). The popup's list head links to it as “Planner ↗”.

五个分页，每页先写一行“我想……”和一行“怎么做”：买哪单划算（只列能让我每周增加的挂单，默认按每 0.001 BTC 换来多少排序，增量拆成“现有持仓（成交后立即）”和“买到的这一枚（下周起）”）、冲 400%（点选持仓，按清单购买；自己或队友的挂单自动写成“撤掉自己的挂单（免费）”）、锁定特征（本区块冲 +100% 要买的具体挂单，以及能否垄断、垄断后的建议）、模拟（持仓逐行带挂价输入框，输入即算；也可输入任意编号假设挂单、成交或撤单；结果给出全网 K、多少枚升降、我的每周合计和每一枚前后对比）、组队（每个队友一个名字和编号，队伍方案给出每单购买人和守护线）。弹窗列表头的“特征计算器 ↗”直接打开它。

## Planner, market jumps and readable results (v0.11.4) / 计算器、市场定位与结果可读性

**Jump to the market, not the item page.** Every link to one Naka, buy links above all, opens the collection page with `#naka-find=<number>`: the number goes into the page's own search box, the card is scrolled to and outlined, and a small note at the top says what to look for. When many people are buying, an item page can still offer a piece that was just bought and fail at checkout; the collection grid shows it as sold. Link labels say “View on market ↗” / “Buy ↗”.

**Reach 400%.** Holdings below 400% start selected as blue ✓ chips; other numbers go into one field (commas or spaces). Each card leads with that Naka's weekly SHNAKAS before → after in large type (“▲ 88.35 → 103.53 / week (+14.98)”), then cost, gain per 0.001 BTC, numbered steps, the change across all my holdings and what the pieces bought earn from next week. Listings already being bought appear as muted “no need to buy” steps.

**Lock a trait.** Only traits where acting now raises our weekly SHNAKAS, best gain per 0.001 BTC first. Each card: the trait and tier change, the steps with links, the effect (“▲ Ours +18.82 / week (#2700 gain)”) and the ask below which a later listing undoes it. Every other trait is one line under “Out of reach for now” with its reason: nothing to buy and its sales too low, ours with it already at the 400% cap, or the bonus cancelled by the rise in K.

**Simulate.** Each holding has an ask field and quick asks Floor / 1.5× / 2× / 3× (the chosen one stays pressed). Results use ▲ / ▼ with green / red for rises and falls, give K and how many Nakas move, the safe ask ranges that move nobody (or why none exists), and each of my pieces before → after.

**Team.** One box for every teammate's numbers, no names. Targets are chips marked Me / Teammates. The result reads top-down: how many reach 400% and the total cost; the weekly change of my and my teammates' current holdings; what the pieces bought earn, split by who pays; the steps in order, each tagged I buy / Teammates buy / Shared with the targets it serves; each target before → after (or why it was left out); the K change; guard lines with an optional baseline.

**About.** The cases table has five groups (public actions read automatically, private actions, no effect on eligibility, timing, other), each row giving this week, later and how Naka Sigil knows; a coloured edge marks earns (green), does not earn (red) and context (violet). The popup stacks each row as a card; the extension page shows four columns.

**Market inspection head.** When Compare is full its button reads “Full 4/4 · open Compare ↗”; both buttons then move together to a second row instead of breaking the brand.

**单枚跳转到市场，而不是商品页。** 所有指向某一枚的链接（尤其是去购买）都打开带 `#naka-find=<编号>` 的集合页：编号填进页面自己的搜索框，滚到那张卡片并描边，顶部一条小提示说明看什么。扫货时商品页可能还在卖一枚刚被买走的 Naka，结账才失败；集合网格会直接显示已售。链接文字为“前往市场 ↗”“去购买 ↗”。

**冲 400%。** 未满 400% 的持仓默认选中（蓝色 ✓）；其它编号填在一个框里（逗号或空格分隔）。每张卡片先用大字写这一枚的每周 SHNAKAS 前后对比（“▲ 每周 88.35 → 103.53（+14.98）”），再写花费、每 0.001 BTC 换来的增量、编号步骤、我的全部持仓变化，以及买到的枚数下周起的收益。正在成交确认的挂单以灰色“不用买”步骤显示。

**锁定特征。** 只列现在操作能让我方每周增加的特征，按每 0.001 BTC 的增量排序。每张卡片：特征与档位变化、带链接的步骤、效果（“▲ 我方每周 +18.82（#2700 受益）”）以及之后别人挂出低于多少会打回去。其余特征在“暂时做不到”下各占一行写明原因：没有挂单可买且成交价不够、我方带它的已到 400% 封顶、或加成被 K 的增长抵消。

**模拟。** 每枚持仓有挂价输入框和“地板 / 1.5× / 2× / 3×”快捷挂价（选中的保持按下）。结果用 ▲ / ▼ 和绿 / 红表示升降，给出全网 K 和多少枚变化、不影响任何人的安全挂价区间（没有时说明原因）以及我每一枚的前后对比。

**组队。** 所有队友的编号填进一个框，不需要名字。目标以“我 / 队友”标签的芯片显示。结果自上而下：几枚能到 400% 和总花费；我和队友现有持仓的每周变化；买到的枚数按出钱方拆分的收益；按顺序的步骤，每步标明“我买 / 队友买 / 一起出钱”和帮到哪些目标；每个目标的前后对比（或为什么这次不冲）；K 的变化；可记录基线的守护线。

**说明页。** 情形表分五组（插件自动识别的公开操作、私下操作、不影响资格的操作、时间点、其它），每行写本周、之后和插件怎么知道；左侧色条区分计入（绿）、不计（红）和说明（紫）。弹窗里每行是一张卡片，独立页是四列表格。

**市场明细标题。** 比较已满时按钮写“已满 4/4 · 去比较页 ↗”，两个按钮一起换到第二行，不把品牌名挤断。

## Raise weight, the market card reveal and the block in view (v0.12.0) / 增加权重、市场卡牌揭示与常驻区块

**Last block instead of Weekly.** The hero's third figure was the weekly rate at the current weights: nearly the projection again, and a forecast further out. It is now what the latest block paid the holdings that count this week (units × v ÷ 10⁸), a fact that moves block by block and is the rate the projection extends. Before rewards start the week-1 rate stays, since no block pays yet.

**Raise weight.** The Trait planner is named for its purpose, in the popup link and on the extension page, and keeps four tabs. *Best buy* is for my holdings. *Reach 400%* starts with every holding below 400% selected, with quiet All / None links that never outshine the chips; numbers added beside my holdings (a teammate's or any) are kept on this device, shared with Lock a trait and used nowhere else. The pieces selected get one plan, shown as one table: a row per step in order (buy links, reclaims, listings already closing in grey), a column per piece it takes to 400% with that piece's weight and weekly change in the head, and ● where a step lifts a piece (the traits in its tooltip). Above it: how many reach 400%, the cost, the gain per 0.001 BTC, and the weekly change of my holdings, of the added numbers and of the pieces bought; below it, each piece left out with its reason. *Lock a trait* means owning a trait outright: the traits we can own with the listings to buy, the cost, the bonus after and the weekly change; the traits already ours on one line each; the rest as a table of numbers (bonus now, all, ours, to buy, held by others, unminted, missing). *Simulate* lays each holding out on one line (number and weight, ask with a × to clear it, quick asks) with the result under it, and has Clear all. The Team tab and guard lines are gone: their purpose is covered by the added numbers in Reach 400% and Lock a trait.

**The market reveals the card.** A link to one Naka no longer filters the grid to that card. The page scrolls from the top down to it (loading on the way) and the card is revealed like a drawn card: a turning gold-to-violet rim, a wave of light, sparks, a sweep of shine, and a ribbon with what buying it gives (after-sale weight, my weekly change). Its cheaper and dearer neighbours stay in view. A card someone is already buying gets a grey rim and a note instead of a celebration. With reduced motion the card is framed without movement.

**Listings closing.** A listing already being bought or reclaimed carries a small Selling / Reclaiming tag on its badge and a note at the top of its inspection; my own listing in that state says so in its holding line.

**The block stays in view.** The extension page's sticky top bar carries the block, its age and Live, so the block every figure follows stays visible while scrolling through Raise weight. The listings section no longer has its own Raise my weight filter: Best buy does that job (the market page keeps its filter).

**最新一块代替每周。** 横幅第三个数原来是按当前权重算的每周速率：几乎就是“本周预计”的另一种说法，而且预测得更远。现在显示最新一块分给本周计入持仓的数量（单位 × v ÷ 10⁸），是事实，每块随挂单变化，也正是“本周预计”往后外推用的速率。奖励开始前没有区块在发，仍显示第 1 周起的每周速率。

**增加权重。** 特征计算器按用途改名为“增加权重”（弹窗链接和独立页都改），保留四个分页。买哪单划算针对我的持仓。冲 400% 默认选中所有未满 400% 的持仓，旁边是不抢眼的“全选 / 全不选”；“增加任意（队友）编号”保存在本机，与锁定特征共用，不影响其它页面。选中的几枚合起来算一份方案，用一张表展示：每行一步（购买链接、撤单、灰色的已在成交或撤单中的挂单），每列一枚能冲到 400% 的 Naka，表头写它的权重和每周变化，● 表示这一步帮到它（悬停看特征）。表上方是几枚可到 400%、花多少、每 0.001 BTC 换来多少，以及我的持仓、添加的编号、买到的枚数各自的每周变化；表下方逐条写这次没冲的及原因。锁定特征就是整个垄断一个特征：能垄断的写出要买的挂单、花费、垄断后的加成和每周变化；已经垄断的各占一行；其余用数字表格列出现在加成、共、我们、可买、别人持有、未铸造和还差。模拟每枚持仓一行（编号和权重、带 × 清空的挂价框、快捷挂价），结果在下方，并有“全部清空”。组队分页和守护线去掉：用途已经由冲 400% 和锁定特征里的添加编号覆盖。

**市场页揭示卡片。** 跳到某一枚不再把网格筛成一张卡。页面从顶部滑到那张卡片（边滑边加载），像抽到一张卡一样揭示：金到紫的旋转边框、一圈光波、火花、一道扫光，以及写着买入后权重和我每周增量的横幅；前后便宜和更贵的挂单都还在眼前。别人正在买的卡片用灰色边框和提示代替庆祝。开启“减少动态效果”时只显示静止的边框。

**成交中的挂单。** 正在被买或正在撤单的挂单，徽章上有“成交中 / 撤单中”小标签，明细顶部有说明；我自己处在这种状态的挂单，持仓说明里也会写明。

**区块常驻。** 独立页的常驻顶栏里放区块号、出块时间和“实时”，滚动到增加权重时也能看到所有数字依据的区块。“市场挂单”去掉自己的“增加我的权重”筛选：买哪单划算已经做这件事（市场页上的筛选保留）。


## The popup's four tabs, Raise weight as answers, and plans one row per piece (v0.12.1) / 弹窗四个分页、增加权重给结论、冲 400% 一枚一行

**Four tabs, Look up in the header.** The popup's tabs are Holdings, Raise weight, Block and About. Looking up a number is used often but is not a tab of its own: a magnifier beside the language switch opens it as a page of its own, with Back and its title in place of the brand. Compare lives on that page under the lookup, with its way to the full comparison. A result opened from the search page goes Back to it with the number kept and selected; one opened from a holding tile goes Back to Holdings.

**Raise weight in the popup gives answers, the page does the work.** The tab shows two cards and two lines, each leading to its place on the extension page. *Best buy*: the three listings adding the most weekly SHNAKAS per 0.001 BTC, each opening its card on the market. *Reach 400%*: the three pieces whose own plan gives most per BTC (weight before → 400%, cost and purchases, our weekly gain), each opening that plan, unfolded, on the page. *Lock a trait*: one line (how many traits buying listings makes ours and from what cost, or the closest one and how many pieces it still lacks). *Simulate*: one line. Everything is computed only while the tab is shown, after it has painted, and kept per block, holdings, added numbers and language. Without holdings the tab asks for one, with the same Add button as Holdings.

**Reach 400%: one row per piece.** Each piece below 400% (holdings and added numbers) is one row with its own cheapest plan: weight before → 400% (or the most it can reach), cost with the number of purchases and reclaims, this piece's weekly SHNAKAS before → after, ours in all per week (the change of our pieces plus what the pieces bought earn from next week) and that total per 0.001 BTC; rows are sorted by that value, free plans first and pieces out of reach last. A row unfolds its numbered steps (each with the traits it lifts) and what the plan changes. Nothing is ticked at first; ticking two or more shows one combined plan above the table, its steps numbered with chips naming the pieces each one lifts, how many reach 400%, the cost beside the plans one by one added up, and the weekly changes. All / None are quiet text. The numbers added beside my holdings sit in one compact bar: label, field, Add, the numbers with ×, and a short note.

**Lock a trait: the way, not only the gap.** Three groups. *Ours once the listings are bought*: cards with the listings to buy, the cost, the bonus after and the weekly change. *Already ours*. *Needs a private deal too*: one card per trait, fewest missing first, with the listings to buy, the numbers others hold unlisted (or just bought) as a wanted list with **Copy numbers** (written as `#379, #1025`, which the number fields here and most chats read), and unminted numbers. A long wanted list shows its first 24 with Show all; only the first 12 traits show until asked. The traits are those of our pieces: at block 971,815 no trait had every piece listed, so a trait none of ours carries cannot be owned by buying listings alone.

**Hero order and the cursor.** The hero reads Last block → Projected → Week share. Help text no longer turns the cursor into a question mark: things that can be clicked show a pointer and everything else the ordinary arrow, as on the extension page; hover text stays.

**About: what to do and what it means.** The cases drop the column that said how the extension knows. Each row is the action, this week and later weeks, marked by a small square (green counts, red does not, violet explains); the popup stacks the two answers with small labels, the extension page uses three columns with one header row.

**四个分页，查询放顶栏。** 弹窗分页为持仓、增加权重、区块、说明。查询编号常用但不单独占一个分页：语言切换旁的放大镜打开查询页（二级页，左上角返回，标题代替品牌名），比较放在查询页里查询的下方，并能跳到完整比较。从查询页打开的结果返回查询页并保留、选中编号；从持仓卡片打开的结果返回持仓。

**弹窗里的增加权重只给结论，独立页做完整规划。** 两张卡片加两行入口，各自通往独立页对应位置。买哪单划算：每 0.001 BTC 换来每周增量最多的 3 单，点开就是市场上的那张卡。冲 400%：单独冲最划算的 3 枚（现在权重 → 400%、花费和买几单、我们每周合计），点开就是独立页上展开的那一行。锁定特征一行（买下挂单就能垄断的有几个、最低多少钱；或者最接近的一个还差几枚）。模拟一行。只在打开这个分页时、画完之后才计算，按区块、持仓、添加的编号和语言缓存。没有持仓时提示先添加，按钮与持仓页相同。

**冲 400%：一枚一行。** 每枚未满 400% 的（持仓和添加的编号）一行，是它单独冲的最省钱做法：现在权重 → 400%（够不到的写最高多少），花费和买几单、撤几单，这一枚每周前后，我们每周合计（持仓的变化加上买到的几枚下周起的收益）和每 0.001 BTC 换来多少；按性价比排序，免费的在前，够不到的在最后。点一行展开带编号的步骤（每步写提升哪些特征）和效果。默认不勾选；勾选两枚以上，表格上方出现合并方案：带编号的步骤，每步用小标签写帮到哪几枚，几枚可到 400%，花费旁写单独方案相加的花费，以及每周变化。“全选 / 全不选”是不抢眼的文字。添加编号收成一行：标签、输入框、添加、带 × 的编号、短说明。

**锁定特征：给办法，不只摆差距。** 分三组。买下挂单就能垄断：卡片写要买的挂单、花费、垄断后加成和每周变化。已经垄断。还要私下收购才能垄断：每个特征一张卡片，差得最少的在前，列出要买的挂单、别人手里没挂单（或刚被买走）的编号（求购清单，带“复制编号”，格式 `#379, #1025`，本插件的编号输入框和大多数聊天都能直接用），以及未铸造的编号。求购清单长时先显示 24 个，可展开；特征先显示 12 个。列出的特征来自我们的 Naka：971,815 区块没有任何特征全部在挂单里，所以我们没有的特征不可能只靠买挂单垄断。

**横幅顺序与光标。** 横幅顺序为最新一块 → 本周预计 → 本周占比。提示文字不再把光标变成问号：能点的显示手指，其它都是普通箭头，与独立页一致；悬停提示照常显示。

**说明：做什么、意味着什么。** 情形表去掉“插件怎么知道”一列。每行是操作、本周、之后各周，用小方块标记（绿计入、红不计、紫说明）；弹窗里两项结果上下排列并带小标签，独立页三列加一行表头。

## Look up as a sheet, Own a trait and copying numbers (v0.12.2) / 查询浮层、垄断特征与复制编号

**Look up is a sheet over the middle.** The magnifier opens Look up and Compare as a sheet between the header and the tab bar; both stay exactly where they are and the tab underneath stays as it was, so nothing jumps. Back closes it (a result opened on the search page goes back to it with the number selected; one opened from a holding tile closes the sheet); a tab closes it and switches; Escape closes it. **Look up at a block** asks for the number itself, filled from the search field or empty, before the reward week and the height, so the dialog works on its own.

**Own a trait** (formerly Lock a trait) says what owning gives and how to get there in two lines, with the tip that adding all holdings and teammates' numbers finds the closest traits. Three groups, each one grid: the trait across, then a label column (buy listed, reclaim, once ours, private deal) and the content; quiet dividers instead of boxes, neutral number chips, an amber-outlined **Copy numbers** in front of "Private deal for N", gold only for the figure that matters. Every row says how long its bonus lasts once owned: 20+ pieces with no listing hold +100% whatever the floors do; a smaller trait holds while the collection floor stays in a stated range (or its sales give no exact range). The keep-listed advice names the line as 3× the collection floor (it moves with the floor), whether to list, keep or reprice, that the piece earns nothing while listed and that anyone can buy it, which ends the monopoly, and our weekly total with and without it. Rows that need a private deal also show the bonus once owned and whether it is stable; a listing of ours that someone is buying shows as "ours · selling".

**Numbers added are never missed.** The bar holds the field, Add and "Saved separately; My holdings are unchanged", then the numbers with × and Remove all (with Undo); every result starts with what it counts ("Counting my 5 holdings + 3 added numbers"), and the popup's Raise weight lists the added numbers under its basis.

**Copying numbers.** Copy all numbers (My holdings, in the popup and on the page) and Copy numbers (a wanted list) give the same text: plain numbers, ascending, comma and space ("6, 314, 888"), which every Add box reads — lists pass between holders and teammates as they are. The control is a quiet text link; it says "Copied N numbers" for a moment.

**Nothing flickers within a block.** The only change within a block is a listing starting to close. Best buy's ranking does not depend on it (its card just leaves such listings out); Reach 400% and Own a trait recompute only when a listing of ours, or one carrying a trait of our pieces, changes, and keep the previous result on screen (dimmed after a moment) until the new one replaces it in place; a lookup result rebuilds only for its own piece.

**The card reveal leaves the card alone.** A 2 px gold rim drawn once around the card in the gutter, one short glow outside it, four tiny sparks in the gutters and the ribbon above; nothing is drawn over the artwork and the card itself is not scaled or brightened. A piece someone is buying gets a grey rim; reduced motion shows the rim and ribbon still.

**查询改成浮层。** 放大镜在顶栏和底部分页之间打开“查询 · 比较”浮层，顶栏和分页位置完全不变，下面的分页保持原样，不再跳动。返回关闭浮层（从查询页打开的结果返回查询页并选中编号；从持仓卡片打开的结果直接关闭）；点任一分页先关浮层再切换；按 Esc 关闭。**按区块查询**的弹窗第一项就是编号，带入查询框的编号，没有就留空，然后才是奖励周和区块高度，弹窗可以单独完成查询。

**垄断特征**（原“锁定特征”）用两句话说明垄断的好处和做法，并提示持仓和队友编号加得越全，越能找到最接近垄断的特征。分三组，每组一张网格：特征名占一行，下面左列是标签（买下挂单、撤单、垄断后、需私下收购），右列是内容；行间只用细线，不再用方框；编号块用中性深灰；“复制编号”是琥珀描边按钮，放在“需私下收购 N 枚”前面；只有关键数字用金色。每一行都写明垄断后加成能维持多久：20 件以上且没人挂单，始终 +100%，与地板无关；少于 20 件的写明集合地板在什么区间内保持（成交依据给不出精确区间时如实说明）。守线建议写明线是集合地板的 3 倍（随地板变）、是新挂、保留还是改价、这枚挂着不计奖且谁都能买走（买走就不再垄断），以及挂和不挂时我们的每周合计。需要私下收购的行也写出垄断后加成和是否稳定；我方正被买走的挂单标“我方·成交中”。

**添加的编号不会被忽略。** 编号栏是输入框、“添加”和“独立保存，不影响我的持仓”，下面是带 × 的编号和“全部移除”（可撤销）；每个结果区开头写明按什么计算（“按我的持仓 5 枚 + 添加的编号 3 枚计算”），弹窗“增加权重”也在依据行下列出添加的编号。

**复制编号。** “复制全部编号”（弹窗和独立页的我的持仓）与“复制编号”（求购清单）格式相同：纯数字、从小到大、逗号加空格（“6, 314, 888”），任何“添加”框都能直接读入，持有人和队友之间可以原样互传。按钮是低调的文字链接，复制后短暂显示“已复制 N 个编号”。

**同一区块内不再闪动。** 区块内唯一的变化是有挂单开始成交或撤单。买哪单划算的排序与它无关（只在显示时去掉这些挂单）；冲 400% 和垄断特征只在我方挂单或带我方特征的挂单状态变化时才重算，并且旧结果一直显示（稍后变暗），算完原地替换；查询结果只在这一枚自己的状态变化时重建。

**卡牌揭示不碰卡片。** 卡缝里一圈 2px 金边描一遍、卡片外一次短暂柔光、卡缝里四颗小火花，横幅在卡片上方；画面上不加任何光效，卡片本身不缩放、不变亮。别人正在买的卡是灰色边框；减少动态效果时只显示静止的边框和横幅。

## Own a trait as a table, wanted posts and the Telegram group (v0.12.3) / 垄断特征改成表格、求购信息与 Telegram 群

**Own a trait reads like Reach 400%.** One table with the same rows, hover, ▸ and unfolded detail: the trait (its value, the type in small grey under it), ours / all, listed, missing (gold), bonus now → once owned (green when it rises, with "stable" or "moves with the collection floor" under it), cost (to own by buying: the listings' total and how many; needing private deals: the listings to buy first), and ours per week. The groups are rows inside the table — ours once the listings are bought, already ours (only when some trait is), needs private deals — and the nearest trait needing private deals starts unfolded. No boxes, no violet; number chips are quiet charcoal.

**Copy → join → paste.** An unfolded trait that needs private deals has one action line: **Copy wanted post** ("求购 87, 826, 1466" / "Want to buy 87, 826, 1466") and right beside it **Post it in the Naka Telegram group ↗**. After copying, the line says the post is copied and the group link turns into the filled amber action for a few seconds, so the next step is the obvious one. Pasted into any Add box, the same post imports its numbers.

**The popup's three answers fit one screen.** Best buy, Reach 400% and Own a trait each show two rows in the same card pattern; Own a trait lists the traits buying makes ours first, then the nearest ones, the number still missing in gold on the right. At 380×600 all three cards are fully visible without scrolling; Simulate is a line below them. The About tab ends with **Join the Telegram group ↗**.

**Number fields.** Every field that takes several numbers reads commas (, ， 、), spaces and line breaks; a pasted multi-line list keeps its breaks as separators, and the field holds all 3,333 numbers.

**垄断特征和冲 400% 一个样子。** 一张表，行高、悬停、▸ 和展开行都与冲 400% 相同：特征（特征值，类型用灰色小字写在下面）、我们 / 共、在售、还差（金色）、加成（现在 → 垄断后，上升为绿色，下面写“稳定”或“随集合地板变”）、花费（买下就能垄断的写挂单合计和单数；需要私下收购的写先买哪几单）、我们每周。三个分组是表里的分组行：买下挂单就能垄断、已经垄断（有才显示）、需要私下收购才能垄断；差得最少的那个默认展开。不再有方框和紫色，编号块是安静的深灰。

**复制 → 进群 → 粘贴。** 需要私下收购的特征展开后只有一行操作：**复制求购信息**（“求购 87, 826, 1466” / “Want to buy 87, 826, 1466”），紧挨着 **进入 Naka Telegram 群求购 ↗**。复制后这一行提示已复制，群链接在几秒内变成实心琥珀色按钮，下一步一眼可见。同一段文字粘贴进任何“添加”框，都能导入这些编号。

**弹窗三个结论一屏可见。** 买哪单划算、冲 400%、垄断特征三张卡片样式相同，各显示两行；垄断特征先列买下就能垄断的，再列最接近的，右侧用金色写还差几枚。380×600 下三张卡片不用滚动就能完整看到，模拟放在下面一行。说明页最后一行是 **进入 Telegram 交流群 ↗**。

**编号输入。** 所有可以输入多个编号的地方都接受逗号（, ， 、）、空格和换行；粘贴多行清单时换行会变成分隔符，输入框能容纳全部 3,333 个编号。

## A holding that sells (v0.12.4) / 持仓卖出之后

**Sold holdings leave on their own, and the popup says so.** Each new block the worker reads the public listing records; a holding listed after it was added and then sold is the owner's sale and moves to Left with the full weeks it held before listing (nothing to delete by hand). While that reward week lasts, a quiet line above the tiles names it: "Sold this week: #888 (block S). Moved to Left", with the weeks still claimable mentioned only when it kept any, and View ↗ to Left on the extension page.

**A sale the records cannot attribute is asked where it shows.** When a piece was added while its listing was already open (not from your own Vault or Wallet page) and that listing sells, the public records look the same whether you sold your listing or bought it. The tile then reads "Confirm sale" instead of a next-week start, and the line above the tiles asks "#1500: listed at block L, sold at block S. Did you sell it or buy it?" with both answers; I sold it moves it to Left, I bought it keeps it. The extension page asks the same through the same rule.

**卖出的持仓自动移走，弹窗会告诉你。** 每出一个新区块，后台都会读公开挂单记录；加入后才挂出、随后成交的持仓就是你卖出的，会自动移到“已离手”，并保留挂单前完整持有的周（不用手动删除）。这一奖励周内，持仓卡片上方用一行灰字写明：“本周卖出 #888（区块 S），已移到已离手”，只有确实保留了完整周时才加上“挂单前完整持有的周仍可领取”，并可点“查看 ↗”到独立页的已离手。

**分不清的成交就地问你。** 如果加入时那一单就已经在挂（不是从你自己的金库或钱包页加入的），之后成交了，公开记录看起来一样，分不清是你卖出了自己的挂单还是你买下了这单。这时卡片显示“待确认”，不再写“下周起”，卡片上方问：“#1500：区块 L 挂单，区块 S 成交。是你卖出还是买入？”并给出两个按钮；选“是我卖出的”就移到已离手，选“是我买入的”就保留。独立页用同一条规则询问。


## Tab order, a line you can dismiss, and updating in place (v0.12.5) / 分页顺序、可关掉的提示与原地升级

**Tabs.** The popup's tabs read Holdings, Block, Raise weight, About again: Block sits where it was in the released v0.11, before the newer Raise weight.

**This week's sales, once.** The line above the tiles is now one short muted line without a box: "Sold this week: #888, #1500. Moved to Left", then View ↗ and ×. It names each piece once (one sold twice this week too) and three at most ("#888, #1500, #2700 and 2 more"), in sale order; its tooltip keeps each sale's block and whether full weeks stay claimable, which Left on the extension page also shows. View (it opens the extension page at Left) or × marks this week's sales as seen, so the line stays away until a sale not seen yet, and then names only that one. When the last holding sold, the line stands above the first-run card. Closing it hands the keyboard to the next line, or to Manage; the second click of a double click on × never opens the tile that moved up under it. A question about a sale the records cannot attribute is different: it needs an answer, so it keeps its box until answered. "Left your vault" in the weekly band counts pieces, not sales.

**Updating in place.** Replacing the folder's files and pressing Reload is the way to update; every holding, comparison, added number and setting is kept. If Chrome is only restarted instead, it loads the new pages but keeps running the previous background worker, which cannot produce the data they read. Each page asks the worker which version it runs; when it is not the page's own, the popup and the extension page show one centred Finish the update card (the sigil, one sentence, a Reload the extension button) in place of their content, rather than numbers this version cannot read. The button asks the new worker to open the same page again, since Chrome closes every extension page on reload: the popup reopens on its usual view (Chrome allows that from version 127; earlier it shows on the next click), the extension page at the same section. The upgrade step (drop the retired fixed-mode keys, the last check's status and a public snapshot the new version cannot read, which the next check downloads again) touches no data of the user's, and runs once per version when the new worker first starts, rather than only on Chrome's install event, which a reload after such a restart does not send.

**A reward or none, said plainly.** The Chinese interface no longer says a piece 计入 or 不计 (counts or not) in a week, which read as bookkeeping: the cases table, the line under the weekly figure ("5 枚本周有奖励"), every piece's explanation and the planner's notes now say 有奖励 or 没有奖励 (gets a reward or not), and the schedule names 最后有奖励的区块 (the last block with rewards). English already said earns or nothing.

**分页。** 弹窗分页恢复为持仓、区块、增加权重、说明：区块回到已发布的 v0.11 里的位置，排在后加的增加权重前面。

**本周卖出，只提示一次。** 持仓卡片上方那一行改成没有边框的一行灰字：“本周卖出 #888、#1500，已移到已离手”，后面是“查看 ↗”和“×”（关闭）。每一枚只写一次（本周卖出两次的也一样），最多写出三枚（“本周卖出 #888、#1500、#2700 等 5 枚”），按成交先后排列；悬停仍能看到每笔的成交区块，以及是否还有可领取的完整周，独立页的已离手里也都有。点“查看”（直接打开独立页的已离手）或“×”后，本周这些成交记为已看过，这一行不再出现；之后有还没看过的成交才会重新出现，并且只写新的那一笔。最后一枚持仓也卖出时，这一行显示在首次使用卡片上方。关掉后键盘焦点移到下一条提示或“管理”；双击“×”时第二下不会打开上移到指针下的那张卡片。分不清买卖、需要你回答的那种提示不同，回答之前一直带框显示。本周概览里的“已离手 N 枚”按枚数计，不按成交笔数。

**原地升级。** 升级方法是替换目录里的文件后点“重新加载”，持仓、比较、添加的编号和设置都会保留。如果只是重启了 Chrome，Chrome 会加载新的页面，却继续运行旧版本的后台，新页面需要的数据它给不出来。现在每个页面都会问后台在运行哪个版本；版本不一致时，弹窗和独立页不再显示读不了的数字，而是在中间显示一张“完成更新”卡片（徽记、一句说明、“重新加载插件”按钮）。重新加载时 Chrome 会关闭插件的所有页面，所以按钮会请新后台把同一个页面再打开：弹窗回到平常的界面（Chrome 127 起支持；更早的版本下次点图标时就是正常界面），独立页回到原来的位置。升级步骤只删除早已停用的固定区块模式留下的键、上次检查的状态，以及新版本读不了的公开快照（下次检查会重新下载），不碰任何用户数据；它在新版本后台第一次启动时执行一次，不再只依赖 Chrome 的安装事件，因为这种重启之后再重新加载时 Chrome 不会发出安装事件。

**有没有奖励，直接说。** 中文界面不再用“计入 / 不计”这种像记账的说法：各种操作表、本周概览那一行（“5 枚本周有奖励”）、每一枚的说明和增加权重里的提示，都直接写“有奖励”或“没有奖励”；奖励时间表写“最后有奖励的区块”。英文原本就写 earns / nothing。

## v0.13.0 — what changed since v0.12.5 / 相对 v0.12.5 的变化

v0.13.0 follows the published v0.12.5. The work had three aims: answer the three questions a holder or buyer actually asks (what do I earn this week and later, which listing is worth buying for me, will this figure still hold at the next block), make every screen readable in one look, and never let a layout or a word suggest something the data does not say. An optional mining skin was built and removed during development: v0.13.0 has one interface (an old `nakaSkin` preference is kept untouched, as all user data is). Every screen was checked in a real browser at the popup's 380 × 600 and on the page, in both languages.

**Principles.** One leading figure per screen; explanations on the About tab and exact bases in tooltips. Figures add up or follow from one another (the holdings totals are the sum of the tiles; network share = per week ÷ the weekly pool 266,640; full output = earnable + forfeited). Related figures sit together and a figure's place says what it belongs to. Bounds are written as bounds (≤, ≥) when public data cannot identify a piece. One place does one thing, and the same data looks the same on every page. Figures keep their places while data loads.

### Rules and data

- **Every scenario is the next block's world.** A listing already closing (someone's purchase confirming, or a reclaim on its way) is gone at the next block whatever we do. Every scenario — Best buy, Reach 400%, Own a trait, Simulate, and the single-sale model behind the market card, look-up and Compare — first removes all closing listings at no cost. Before, a closing floor listing could prop up a plan that fell to 375% once the block came.
- **Advice only when it pays.** Own a trait suggests keeping one of our pieces listed on the tier line only when that beats not keeping it and leaves us ahead; each row shows the plan it is ranked by. Combined plans retry rejected targets until nothing changes and say why a target stays out.
- **Holdings the Wallet page does not show.** The Wallet page lists a piece that left only while it has unclaimed full weeks; one sent away earlier, or after its weeks were claimed, has no row, so it used to be counted as held. After a sync the popup and the extension page ask about such holdings ("It left" / "Still mine").
- **Market badges.** The market's collection cards now show the official snapshot image (`assets.ord-dropz.xyz/snapshots/<inscription ID>.webp`) instead of the inscription content URL. v0.12.5 did not recognise it, so the collection grid showed no badges. Both addresses are recognised; with `?shn-debug=1` the page shows how many images it recognised and why any card took no badge.
- **Audit.** Every formula and rule was checked against the programme inscription, the official engine and the public endpoints (240 checks; a block-by-block replay of the first reward week with zero difference). Tests pin the values a wrong formula would change.

### Holdings

- **Popup.** One big figure, this week's SHNAKAS so far, with the week's progress under it; then past total (it opens the holding history), per week and remaining. Tiles are three a row; each shows its number and weight, this week's SHNAKAS, and its own per week and remaining, so the totals add up from the tiles.
- **Extension page.** Past total → network share → per week → remaining: each figure follows from the one before. Before rewards start the share is shown like per week, as "once started". A label too long for its column wraps upward and every figure stays on one line; at phone width the four figures sit two by two. The weight badge on a tile opens its details; the rest of the tile simulates listing it, and only the rest shows that hint.
- **Holding history.** A page head like every other section, a hero with one bar per week, and each week's pieces with their artwork, sorted by output; an earning piece shows its share of the week, the others are dimmed with their reason. A recorded interval replaces the public-record reading for the current holding but never removes a past run a public sale proves; at a week's last block the week is still this week, so the past total counts it from the next block.

### Block

- **Hero.** The block in amber pixels with its age and live state, the reward week and how far into it the block is, then three figures of that block: collection floor, listings, and what a 100% weight earns in a full week (the unit every listing's weekly gain is measured in).
- **Schedule.** This week's end, the last rewarded block and the claim deadline: the exact blocks left first, the estimated local date beside them.
- **Network output.** Read top down as one sum: **full output** (the week's output if all 3,333 pieces earned) on one line; a 1 px split under it; **earnable ≤** under its left half and **forfeited ≥** under its right, with its share (lost to listing, moving or not minting; nobody else receives it, and what becomes of it is not stated officially). **Claimed** comes from the public claim receipts, a separate fact, so it has its own line under a dotted rule. An earlier layout put claimed beside full output above the split, where it read as half of the line.
- The tab fits the popup without scrolling, in both languages and for any week, and loads when it is shown.

### Details cards (market popover, look-up, extension page)

- The artwork large on the left. On the right: the state in one word, the block every figure is computed at, the weight with one caption naming its world and start week ("after sale · from week 3"), then per week and remaining with their unit, SHNAKAS. Words keep the left edge and figures the right, as in the trait table.
- Relay credits and the collection floor are a two-cell strip under the trait table; the ratio formula and the private-claim rule are one line of fine print; past sales open on request and are read once per block.
- A listing already bought and confirming says **Selling**, explains why it cannot be bought, and still shows the per week and remaining its buyer looked at; it offers no buy sequence and no gain for my holdings. A listing being reclaimed goes back to its seller and shows no sale.
- One badge opens one popover; opening the past-sales fold no longer pins a market popover.

### Listings and Raise weight

- **Listings (page).** Tiles like the holdings: artwork with the after-sale weight (its Sub tier inline), the number with a small buy link, the ask in gold, what buying adds to my holdings each week (or what the piece earns, with no holdings) and relay credits. Compare, My holdings and the buy sequence (up to four listings, each valued after the earlier ones) are in the badge's details; a line above the cards gives the sequence's total. My own listing shows what reclaiming does.
- **Raise weight (popup).** Best buy and Reach 400% share one layout: the cost first, then the number, the weight it reaches and the gain per 0.001 BTC, the weekly change of my holdings on the right.

### Words

Plain names instead of ledger terms: **full output**, **earnable**, **forfeited**, **claimed**. Every figure carries its unit; every tooltip is one short sentence.

中文：

v0.13.0 接在已发布的 v0.12.5 之后。目标有三个：回答持有人和买家真正关心的三个问题（这周和以后能产出多少、哪单值得我买、这个数字到下一块还成立吗）；每个界面一眼读完；版面和用词都不暗示数据没有说的东西。开发中做过一个可选的矿机皮肤，发布前删掉了，v0.13.0 只有一套界面（旧的 `nakaSkin` 设置和所有用户数据一样原样保留）。每个界面都在真实浏览器里按弹窗 380 × 600 和独立页、中英文核对过。

**原则。** 每屏一个主数字；说明放在“说明”页，精确依据放在悬停提示。数字能加起来、能互相推出来（持仓合计 = 各卡片之和；全网占比 = 预计每周 ÷ 每周奖池 266,640；满额产出 = 可产出 + 流失）。相关的数字放在一起，位置本身说明它属于什么。公开数据认不出是哪一枚时，按上下限写（≤、≥）。一个位置只做一件事，同一份数据在每个页面显示得一样。读取数据时数字位置不变。

### 规则与数据

- **所有情景都是“下一块的世界”。** 正在成交或撤单中的挂单，不管我们做什么，下一块都会离开市场。买哪单划算、冲 400%、垄断特征、模拟，以及市场卡片、查询和比较背后的单笔成交模型，都先把全部成交中 / 撤单中的挂单零成本移走。以前一张正在成交的地板单，可能撑起一个到了下一块只剩 375% 的方案。
- **只给划算的建议。** 垄断特征只有在守线确实好于不守、而且净收益为正时，才建议把我方一枚按线挂出；每一行显示的就是它排序所依据的方案。合并方案会重试被拒的目标直到没有变化，仍被排除的写明原因。
- **钱包页没有显示的持仓。** 钱包页只在离手的 Naka 还有未领取的完整周时才列出它；更早转走的、或领取之后转走的没有任何一行，以前会一直按持有计算。现在同步后，弹窗和独立页会问你（“已离手” / “仍持有”）。
- **市场标签。** 官方市场的集合页卡片改用官方快照图（`assets.ord-dropz.xyz/snapshots/<铭文 ID>.webp`），不再用铭文内容地址。v0.12.5 认不出新地址，集合页上就没有标签。现在两种地址都能识别；地址后加 `?shn-debug=1`，页面会显示认出了多少张图、哪张卡为什么没挂上标签。
- **审计。** 对照规则铭文、官方引擎和公开接口核对了全部公式与规则（240 条；第 1 周逐块重放，零偏差）。测试固定了改错公式就会变的数值。

### 持仓

- **弹窗。** 一个大数：本周已产出，下面是本周进度；再是历史累计（点开看持仓历史）、预计每周、预计剩余。卡片一行三枚，每枚写编号、权重、本周已产出和它自己的每周、剩余，合计由卡片加出来。
- **独立页。** 历史累计 → 全网占比 → 预计每周 → 预计剩余，每一项都能由前一项推出。奖励开始前，全网占比和每周一样写“开始后”。标签放不下时向上换行，四个数字始终在同一条线上；手机宽度下四个数字两行两列。卡片上的权重标签打开它的详情；卡片其它位置是模拟挂单，也只有这些位置显示这条提示。
- **持仓历史。** 页头和其他模块一致；主卡片带每周柱状图；每周的藏品带头像、按产出排序，有奖励的写占本周比例，其余变暗并写原因。补录区间替代对当前持仓的公开记录推断，但不会抹掉公开成交证实的过去持有段；一周的最后一块仍属本周，历史累计从下一块起才计入。

### 区块

- **主卡片。** 橙色像素字的区块号，旁边是区块时间和实时状态；奖励周和本周进度；再是这一区块的三个数字：集合地板、挂单数、权重 100% 一整周的产出（衡量每单周增量的单位）。
- **奖励时间表。** 本周结束、最后有奖励的区块、领取截止：先写准确的剩余块数，旁边是估计的本地日期。
- **网络产出。** 从上往下读成一道加法：**满额产出**（3,333 枚都有资格时这一周的产出）一行；下面一条 1 像素分隔线；左半段下面是**可产出 ≤**，右半段下面是**流失 ≥** 和它的占比（因挂单、转移或未铸造而没人能领，也不分给别人，去向官方没有说明）。**已领取**来自公开领取回执，是另一回事，所以单独一行、用虚线隔开。早先的版面把已领取和满额产出并排放在线条上方，读起来像是线条的一段。
- 中英文、任何一周，这一页在弹窗里都不用滚动；切到这一页时才读取。

### 详情卡片（市场浮层、查询、独立页）

- 左边大头像。右边依次是一词状态、所有数字所依据的区块、权重及一行说明（是哪种情形、第几周起，如“成交后 · 第 3 周起”），再是带单位 SHNAKAS 的每周和剩余。文字靠左、数字靠右，和特征表一致。
- 集合地板放在特征表下（挂单读到中继额度时在它旁边，0 也显示）；比值公式和隐私领取规则合成一行小字；历史成交点开才读，每个区块只读一次。
- 已被买下、等待确认的挂单写“成交中”，说明为什么买不了，仍显示买家下单前看到的每周和剩余；不进连买，也不算我的持仓变化。撤单中的挂单会回到卖家手里，不显示成交数字。
- 一个标签只开一个浮层；在市场页点开历史成交不再把浮层固定住。

### 挂单与增加权重

- **市场挂单（独立页）。** 和持仓一样的卡片：头像加成交后权重（Sub 档在同一行）、编号和小的购买链接、金色挂价、买入后我的持仓每周增加多少（没有持仓时是这一枚每周）和中继额度。比较、我的持仓和连买（最多 4 单，后买的按前面成交后的权重计算）都在标签的详情里；卡片上方一行写连买合计。我自己的挂单显示撤单后的效果。
- **增加权重（弹窗）。** “买哪单划算”和“冲 400%”同一种布局：先写花费，再写编号、达到的权重和每 0.001 BTC 的收益，右侧是我的持仓每周变化。

### 用词

用直白的名字代替记账术语：**满额产出**、**可产出**、**流失**、**已领取**。每个数字带单位；每条悬停提示只有一句。

## v0.13.1 — what changed since v0.13.0 / 相对 v0.13.0 的变化

v0.13.1 follows the published v0.13.0 and gathers six rounds of work, each below with what prompted it: a review of v0.13.0; cards that moved or closed while in use; hover cards that stayed open, and the way from a badge to its card; saying what is still on its way, a living sigil, and Compare by value; Activity reading like the market, and My holdings sorted four ways; and relay credits at zero shown again, with the start week said against this week.

中文：v0.13.1 接在已发布的 v0.13.0 之后，合并了六轮工作，下面每节写明起因：v0.13.0 的审查意见；卡片在使用中移位或消失；悬停卡片不关闭，以及从标签到卡片的路；说清还在路上的数据、会动的标志、按性价比比较；动态页与市场页同一口径、我的持仓可排序；中继额度 0 也显示、起算周对着当前周说。

### One reading of each holding, pages that follow their data, honest wording / 每枚持仓只有一种读法、页面跟着数据更新、用词有依据

From a review of v0.13.0, each point checked against the code before changing it.

- **One status per holding.** The details card (look-up, extension page, market popover) read a holding's eligibility from the public records alone, while the holdings hero also used the wallet's readings and recorded intervals. A holding recorded as received this week showed the hero's "from week 3" but the card's remaining included the rest of this week. Every card now takes the same status as the hero, and a change in it rebuilds the card.
- **History page.** It was painted once; switching language, a new block, a holding or a recorded interval left it as it was. It now repaints when any of them changes, on the week that was selected.
- **Chain epoch.** Completed weeks read in an earlier epoch are read again by the automatic sync and are left out of the past total meanwhile, as the history reader already did; one test (`weeksAt`) serves all three.
- **Shared public-record read.** Each caller checks the read reaches its own block; a read started for an earlier block is followed by one more, and an older set never replaces a newer one.
- **Open week.** Its range says where the figures stop ("Blocks 972,709 – 973,161 so far"; Chinese, with more room, keeps the full range and adds "累计至 973,161"); the full output's tooltip says "so far".
- **Past total** says "· reference" when it includes public-record estimates, as the history page does.
- **Page tiles.** A holding that starts later shows "Week 3+" where this week's figure would be, as the popup tile does.
- **Dates** in the schedule are marked approximate ("~"); the tooltip says they assume about 10 minutes a block.
- **Words with a basis.** What nobody can claim "goes to no one else; what becomes of it is not stated officially" (the rules audit), not "never issued". Private moves are public events whose piece cannot be told. The zero-listing rule separates the official bonus now from the inferred median after an assumed sale. Compare says closing listings count as gone; listing forfeits the whole week and rewards resume the week after a reclaim. Remaining starts at the week a piece starts earning. A week's last block reads "final block", as the hero still calls it this week.
- **Totals** in the holdings line wrap instead of running past a narrow card.

Not taken: renaming the short labels (per week, remaining, full output, earnable, forfeited) to longer ones, a smaller block hero and the layout suggestions; they reverse choices made in the earlier rounds.

中文：
- **每枚持仓只有一种读法**：详情卡片（查询、独立页、市场浮层）以前只按公开记录判断持仓资格，持仓主面板却还用了钱包读数和补录区间。补录为“本周收到”的持仓，主面板写“第 3 周起”，卡片的剩余却把本周剩下的部分也算进去。现在所有卡片和主面板用同一份状态，状态变了卡片也会重建。
- **持仓历史页**：以前只画一次，切换语言、新区块、持仓或补录变了都不更新；现在任一变化都会重画，并停在原来选的周。
- **链 epoch**：自动同步会重新读取旧 epoch 读到的已结束周，期间历史累计不计入这些周，和历史页原来的做法一致；三处共用同一个判断（`weeksAt`）。
- **公开记录共用一次读取**：每个调用者各自检查读到的区块够不够；为较早区块发起的读取不够时再读一次，旧数据不会覆盖新数据。
- **进行中的周**：范围后面写明累计到哪一块（“· 累计至 973,161”）；满额产出的提示写“到目前为止”。
- **历史累计**含按公开记录推算的部分时写“· 参考”，和持仓历史页一致。
- **独立页卡片**：下周才开始的持仓，在本周数字的位置写“第 3 周起”，和弹窗卡片一致。
- **时间表日期**前加“约”，悬停说明按每块约 10 分钟估算。
- **用词有依据**：没人能领的部分写“也不分给别人，去向官方没有说明”（规则审计的结论），不再写“不会发行”；私下转移是公开事件，只是认不出是哪一枚；零挂单规则分开写当前的官方加成和假设成交后的推算中位数；比较页写明成交中或撤单中的挂单按离开市场计算；挂单那一周整周没有奖励，撤单后下一周起恢复；剩余从开始有奖励的那周算起；一周的最后一块写“最后一块”，和主面板仍称“本周”一致。
- **持仓合计**一行放不下时换行，不再超出卡片。

未采纳：把“每周、剩余、满额产出、可产出、流失”改成更长的名字、缩小区块主卡片，以及其它版式建议；这些和前几轮定下的设计相反。


### A card stays where it is while you use it / 在卡片里操作，卡片不动、不消失

Reported: on the market's Activity tab, a card opened by hovering a badge moved when 历史成交 was clicked, and closed because the pointer was no longer over its new place. Reproduced with the real mouse on the real Activity tab, and on a stand-in market page at three viewport sizes and eight badge positions. The same causes reached every hover card, and a search for the same kind of fault (what the viewer is pointing at, reading or typing into moving away or vanishing) found more.

- **A press inside a hover card no longer moves it.** Opening a fold was the one press that left a card a hover preview; the rows arriving made it grow and, short of room on its side, flip to another side, away from the pointer. A press now keeps the card where it is and leaves it a hover card (next section).
- **Pinning moves nothing.** The close button's room was made only on pinning, so ＋ Compare and ＋ My holdings moved 24 px between press and release; on a phone the button wrapped to the next line and the click was lost. The room is kept in every state.
- **A hover card keeps its side** while its content changes size (artwork decoding, rows arriving).
- **A data refresh no longer closes cards.** On the market, any data write (a new block, reward readings, a holdings change) closed the open card, clicked or not, so ＋ My holdings closed the card it was pressed in. A clicked card stays and offers "Data updated · refresh this card"; a hover card stays with its piece when the page redraws the badge in place. That notice and "No longer in this list" sit at the card's bottom edge instead of pushing its content down. ＋ My holdings repaints itself, and a second press undoes the first.
- **A clicked card survives the window losing focus** (switching apps, a link opened in a new tab).
- **Card buttons show what they did.** On the extension page, ＋ Compare and ✓ My holdings on a holding's card kept their label after a press (the card is not rebuilt), so a second press repeated the first instead of undoing it. Every redraw now repaints the buttons of the open card from the current selection and holdings, on the holdings and the listing cards alike.
- **Compare button width.** "✓ In Compare" became "✕ Remove" under the pointer, 24 px narrower, so near its edge the two labels swapped back and forth. Both labels now share one cell.
- **What is being read or typed into survives a refresh**: the market's filter list (relabelled, not rebuilt), the item page's panel (redrawn in place with its open fold and focus), the extension page's history (read off-screen and swapped in with the chosen week, the open weeks, the scroll place and the focus) and the popup's historical block list (not rebuilt while it is being chosen in).

中文：
- **在悬停卡片里按下不再让卡片移位**：以前只有展开折叠这一下不会固定，成交记录读回来后卡片变高，原来那一侧放不下就换到另一侧，离开了鼠标。现在按下后卡片原地不动，仍是悬停卡片（见下一节）。
- **固定时不挪动任何东西**：关闭按钮的位置以前只在固定时才让出，“＋ 加入比较”“＋ 我的持仓”在按下和松开之间左移 24 像素；手机宽度下按钮换到下一行，点击落空。现在任何状态都预留这个位置。
- **悬停卡片内容变化时保持在原来那一侧**（作品图解码、成交记录读回）。
- **数据刷新不再关闭卡片**：市场页以前每次写入数据（新区块、奖励读数、持仓变化）都会关闭打开的卡片，不论是否已固定，所以在卡片里点“＋ 我的持仓”会把这张卡关掉。现在固定的卡片保留，并提供“数据已更新 · 刷新此卡”；徽章在原位重画时，悬停卡片跟着同一枚继续显示。这条提示和“已离开当前列表”放在卡片底边，不再把内容往下推。“＋ 我的持仓”会立即更新按钮，再点一次就撤销。
- **切到别的程序或在新标签打开链接，固定的卡片不关闭。**
- **卡片按钮显示操作结果**：独立页持仓卡片上的“＋ 加入比较”“✓ 我的持仓”按下后文字不变（卡片不会重建），再按一次是重复操作而不是撤销。现在每次重画都按当前的比较和持仓重画打开的卡片上的按钮，持仓卡片和挂单卡片一样。
- **“加入比较”按钮宽度不变**：“✓ 已加入比较”在鼠标下换成“✕ 移出比较”，变窄 24 像素，鼠标在边缘时两种文字来回切换。现在两种文字共用同一宽度。
- **正在看或正在输入的东西不被刷新冲掉**：市场页的筛选下拉（只改文字，不重建）、详情页的面板（原位重画，保留展开的折叠和焦点）、独立页的持仓历史（后台读完再整体替换，保留所选周、展开的周、滚动位置和焦点）、弹窗历史区块查询的区块下拉（正在选时不重建）。

### A hover card is for a look, a clicked card is kept / 悬停是看一眼，点击才留下

Reported on a test build of this release (one that pinned a card on any press inside it): once 历史成交 had been opened in a hover card, the card no longer closed when the pointer left it and no other badge opened its card, which 0.13.0 had fixed once already ("opening 历史成交 no longer pins the card"). Also reported: a far button in the card could only be reached by first crossing the edge the card shares with its badge; cutting across beside the badge closed the card on the way.

- **Using a hover card does not keep it.** A press, an opened fold, a button, the focus inside: the card stays a hover card. It closes once the pointer has left both the card and its badge, and the next badge the pointer reaches opens its own card. Only clicking the badge itself (or Enter or Space on it) keeps a card until ×, Escape or a click outside.
- **The card the pointer is on does not move.** From the moment the pointer is on the card (or a press or the focus is in it) it keeps its place: a fold opening, rows arriving, a button relabelled, the page redrawing its list or newer data change its content, never its place. It grows downward, so what was clicked stays under the pointer, and only once its content grows: reaching a card changes nothing about it. Newer data waits behind "Data updated · refresh this card" at its bottom edge instead of replacing what is being read. The tail goes once the card no longer meets its badge as it did.
- **The way from the badge to the card.** Nothing static was added. A longer shared edge (the card wrapping more of the badge) covers the badge being read and its neighbours; an invisible bridge around the card keeps it open when the pointer leaves sideways and covers neighbouring badges; a close delay makes every leave lag (0.13.0 removed one for that reason) and still loses a slow or long way. Instead, as Radix Tooltip (its grace area) and Floating UI (`safePolygon`) do: when the pointer leaves the badge other than onto the card, the card stays while the pointer is inside the corridor from where it left to the card, the convex hull of that exit point, widened 5 px along the badge's edge, and the card. Heading anywhere else closes the card at once, so leaving never lags; resting on the way for 100 ms closes it (Floating UI closes after 40 ms at rest, Radix never while inside). A badge the pointer passes over on its way does not open; one it stops on opens after those 100 ms. The corridor starts where the pointer crossed the badge's edge, found from its last place inside the badge, since the leave event's point lies already one move further.
- **The focus counts as holding a card only while it is there.** The focus leaving a hover card closes it, unless the pointer is still on the card or its badge. On the market, ＋ Compare disabled itself while saving, which took the focus away and closed the card it was pressed in; it is marked busy instead and keeps the focus, for keyboard users too.

中文：
- **用悬停卡片不会把它留住**：在卡片里按下、展开折叠、点按钮、焦点在卡片里，卡片都还是悬停卡片。鼠标离开卡片和标签就关闭，鼠标到达的下一个标签照常弹出它自己的卡片。只有点标签本身（或在标签上按 Enter、空格）才把卡片留住，直到点 ×、按 Esc 或点卡片外。
- **鼠标所在的卡片不移动**：鼠标一进卡片（或在卡片里按下、焦点进入），卡片就停在原位。展开折叠、成交记录读回、按钮改字、页面重画列表、数据更新，都只改内容，不改位置。卡片向下长，点过的地方留在鼠标下；只在内容真的变多时才长，鼠标进入本身不改变卡片。新数据放在底边“数据已更新 · 刷新此卡”后面，不替换正在看的内容。卡片不再贴着原来的标签时，去掉指向标签的小尾巴。
- **从标签到卡片的路**：不加任何静态区域。加长贴合边（卡片多包住标签）会挡住正在看的标签和相邻标签；卡片周围加透明桥，鼠标往旁边离开时卡片也不关，还会挡住相邻标签；延迟消失让每次离开都慢半拍（0.13.0 正是因此去掉的），走得慢或路长时照样会丢。改用 Radix Tooltip（宽限区）和 Floating UI（`safePolygon`）的做法：鼠标离开标签但没进卡片时，只要还在“离开点到卡片”的通道里，卡片就保持打开。通道是离开点（沿标签边缘左右各放宽 5 像素）和卡片的凸包。往其他方向走，卡片立即关闭，所以离开从不拖延；在通道里停住 100 毫秒，卡片关闭（Floating UI 停住 40 毫秒就关，Radix 只要在通道内就不关）。去卡片的路上经过的其他标签不会弹出；停在它上面，100 毫秒后弹出它的卡片。通道起点取鼠标真正穿过标签边缘的位置（由它在标签内的最后位置算出），因为离开事件的坐标已经多走了一步。
- **焦点只在卡片里时才算“在用”**：焦点离开悬停卡片时卡片关闭，但鼠标还在卡片或标签上时不关。市场页“＋ 加入比较”保存期间会把自己设为禁用，焦点因此丢失，按下它的卡片随之关闭；现在改为“忙碌中”标记，焦点留在按钮上，键盘用户同样受益。

### Saying what is still on its way, a living sigil, and Compare by value / 说清还在路上的数据、会动的标志、按性价比比较

Asked for while testing this release: while the popup's block data is being updated, a small animation after the last update's time, so it is clear the figures are not the latest until it finishes; the same for the Block tab's network output and for Raise weight while it computes; the sigil beside the name animated in the popup and on the extension page (then a turn of the head, both ways, with the two sides told apart); relay credits left out at zero; Compare's example selection taken from Best buy, the before-sale formula row reconsidered, and the piece's own weekly output added above For my holdings and the value per 0.001 BTC beside it.

- **"Updating" means a newer block is being read.** The worker marks the block it reads (session storage) from the read of a new block until that block's holdings and reward records are in; a failed read ends the mark and says why, and a worker that starts clears a mark left by one that stopped mid-read. Three pixels lit in turn, then the word, follow the block's age: the popup's Home line, the Block tab's hero and the extension page's header; after Raise weight's basis line the pixels alone. Their title names the block being read. The once-a-minute check that finds the same block shows nothing: the figures already are the latest, and a blink every minute would only say "not current" when they are. On the Home line the word shows only while the whole line fits; otherwise the pixels stay alone, and when even that is short of room the data's label gives way, never the age.
- **The network output says it is reading.** Pixels follow the card's title while the selected week is read. Its figures stay where they are, dimmed, and the line under the title keeps the blocks they cover while the same week is read again (a newer block); it says it is reading when another week is chosen or when there are no figures yet. The pixels appear only if the read takes over a quarter of a second, so a week read from memory does not flicker.
- **Raise weight: every answer waits in its own card.** Before any answers, three cards with their titles and blank rows (shapes where the answer goes, breathing) take their places at once, so nothing moves when the answers come. Pixels after a waiting card's title say it is on its way and how far its own answer has come (listings 8/115, plans 4/5, traits 8/21); each card is replaced as soon as its answer is ready. On a newer block the cards on screen stay, their rows dimmed, until each replacement is ready. This also fixes a fault found while checking, present in the released 0.13.0: a refresh while the tab was shown replaced the cards halfway and then wrote the answers into the cards it had taken away, leaving Reach 400% empty and Own a trait at "计算中…" until the popup was reopened.
- **The sigil is alive.** In the popup's header and on the extension page's brand its eyes switch on as the page opens and glance left, then right; the head turns to the right, holds its profile a moment and turns back; a blink, the eyes glance left, and the head turns to the left the same way (about 3.7 s and 6.7 s after opening; then once every 30 s, never in quick succession). The turns are drawn as a character turns its head in a flat cartoon, in the logo's own two colours: the head keeps its outline, the face (its hole, the goggles and the mouth) slides round it like a label round a cylinder and narrows toward the edge, the goggles stand a little forward so at the profile they show past the outline like a nose, the chin follows the face, the crest's spikes ride round on a smaller ring, and the goggles' strap runs round the head. Each side has its own mark, so the two profiles differ: a square earpiece on the side the right turn shows, a cross-shaped bolt on the side the left turn shows (one mark a side; two side by side read as a second pair of eyes). Four views to each profile (22.5° steps), 65–90 ms each, the profile held 380 ms, about 0.8 s a turn; the sigil hops one unit as it sets off and as it comes back. The views come from scripts/gen-sigil-turn.js (a test checks pixel.js holds its output); the front view stays the original artwork. Tried and dropped: squeezing the flat front about the upright axis (a sheet of paper flipping); a shaded 3D helmet turned a full round (its outline twisted and its mottled shading and spiky crest read as a pineapple being wrenched round, a little unsettling); going on to the back (the plainest view, and a logo turning its back on the user). While a newer block is read the eyes scan from side to side and the head does not turn; once the block is in, the look-round plays again, which says the update has finished. The eyes move in whole pixels only: held steps and moves of one grid unit.
- **Relay credits.** This round left the line out at zero; the last round of this release put it back (below), so, as in v0.13.0, every known balance shows, zero included.
- **Compare by value.** The example selection is Best buy's first four: the listings that add most to my week per BTC (with no holdings, the pieces that earn most on their own per BTC); the demo's first visit compares the first three for its example holdings. The before-sale formula row is gone: the official current-weight endpoint reports a formula for a listed piece, but a listed piece earns nothing (the official wallet: "A listed piece earns nothing from that block on"), so it was a figure no one earns, and what the sale changes in the piece's own weight is in the trait rows. Above For my holdings, **This NFT per week**: what the piece earns on its own once bought; the two differ by what the sale does to my other pieces. Under For my holdings, the figure it divides, **Per 0.001 BTC**: my weekly gain per 0.001 BTC of the ask (Best buy's measure); with no holdings it follows This NFT per week and divides that. Each of these rows names its unit in its label (SHNAKAS, per week), so the cells hold the figures alone.

中文：
- **“更新中”表示正在读取更新的区块**：后台读取新区块时在会话存储里标出它，从开始读取一直到这一区块的持仓和奖励记录读完；读取失败也结束标记并说明原因，后台重新启动时清掉上一次中途停下留下的标记。区块时间后面跟三个依次点亮的像素点和“更新中”：弹窗首页状态行、区块页主卡片、独立页顶部；增加权重的依据行后面只有像素点。悬停说明写着正在读取哪个区块。每分钟一次、发现还是同一区块的检查不显示：这时数字已经是最新的，每分钟闪一下只会误导。首页状态行放得下才显示“更新中”这个词，放不下只留像素点；再不够时先省略数据标签，时间始终完整。
- **网络产出说明正在读取**：读取所选周时，卡片标题后面出现像素点。数字留在原位变暗；同一周重新读取（新区块）时标题下的区块范围不变，换了周或还没有数字时写“正在读取…”。读取超过四分之一秒才出现像素点，从内存读出的周不会闪。
- **增加权重：每个答案在自己的卡片里等**：还没有答案时，三张卡片带着标题和空白行（答案位置上的占位块，轻微呼吸）立刻就位，答案到了也不挪动。等待中的卡片标题后面有像素点和各自的进度（挂单 8/115、方案 4/5、特征 8/21），哪张算好就换哪张。新区块时屏幕上的卡片保留、行变暗，各自算好再替换。检查时还发现并修好一个已发布的 0.13.0 就有的问题：这一页开着时遇到刷新，会中途替换卡片，最后把结果写进已经被换掉的旧卡片，“冲 400%”变成空卡，“垄断特征”一直停在“计算中…”，直到重新打开弹窗。
- **标志会动**：弹窗顶部和独立页左上角的标志，打开时眼睛“开机”亮起，先往左看再往右看；头向右转，在侧面停一下再转回来；眨一下眼、眼睛往左看，头再向左转一次（打开后约 3.7 秒和 6.7 秒；之后每 30 秒一轮，不会频繁连转）。转头按扁平卡通角色扭头来画，只用标志原有的两种颜色：头型轮廓不变，脸（开口、护目镜、嘴）像贴在圆柱上的标签一样滑向一侧并逐渐变窄；护目镜略微凸出，转到正侧面时伸出轮廓，像鼻梁；下巴跟着脸走，头顶的刺在小一圈的环上跟着转，护目镜带子绕头一圈。左右两侧各有自己的标记，所以两个侧面不同：右转露出的一侧是方形耳扣，左转露出的一侧是十字螺栓（每侧只放一个，两个并排会被看成第二双眼睛）。每边 4 个视角（每 22.5° 一个），每帧 65–90 毫秒，侧面停 380 毫秒，一次转头约 0.8 秒；出发和回来时各轻跳 1 像素。视角由 scripts/gen-sigil-turn.js 生成（测试核对 pixel.js 里就是它的输出），正面仍是原图。试过并放弃的做法：把正面图沿竖轴压扁（像纸片翻转）；带明暗的 3D 头盔转整圈（轮廓被扭曲，斑驳的阴影加上尖刺像菠萝被强行扭转，有点吓人）；转到背面（最单调的一面，像标志背对用户）。读取新区块时眼睛左右扫动、不转头；读完后再完整做一遍，表示更新完成。眼睛只用整像素：逐格跳变、每次移动一个网格单位。
- **中继额度**：这一轮曾改成额度为 0 时不显示；本版最后一轮又改回（见下文），和 v0.13.0 一样，读到的余额 0 也显示。
- **按性价比比较**：“载入示例”取“买哪单划算”的前四单，即每 BTC 给我的持仓每周加得最多的挂单（没有持仓时，按这一枚自己每 BTC 的每周产量）；演示页第一次打开比较示例持仓下的前三单。去掉“成交前公式值”：官方当前权重接口对挂单中的藏品也给出公式值，但挂单中的藏品没有奖励（官方钱包原文：“A listed piece earns nothing from that block on”），这是一个谁也拿不到的数字；成交对这一枚自身权重的改变，下面各特征行已逐项写出。“对我的持仓”上方新增 **该 NFT 每周产量**（买下后这一枚自己每周的产量），两者的差额是成交对我其他持仓的影响；“对我的持仓”下方紧跟由它算出的 **每 0.001 BTC**（挂单价格每 0.001 BTC 换来的我的持仓每周增量，即“买哪单划算”的排序依据）；没有持仓时这一行紧跟“该 NFT 每周产量”，按这一枚自己的产量算。这几行的单位（SHNAKAS、每周）写在行标题里，单元格只写数字。

### Activity shows a piece as it stands, the same as the market / 动态页按现状显示，和市场页一样

Reported: one piece at one block showed two figures. A piece sold earlier and listed again carried, in Activity, its formula value as listed (no rewards while listed); on the market it carried its weight after a sale. Side by side they read as two answers to one question, and neither was the weight at the row's own sale.

- Activity now asks the market's question. A listing still open is shown as if bought now, the same figure and the same card as on the market at the same block, under its own label, **If bought now**: the row is a past event, and "After sale" beside it read as after that sale. Everything else shows its total weight now.
- The weight at a past sale is a separate question, answered on request. Under **Past sales** on any details card, a sale's block opens the block lookup for that piece at that block: in place on the extension page and in the popup; from the market, the worker opens the extension page with the lookup, which runs it and drops the address parameters.
- The bar and the card's note say the figures are the shown block as things stand, not the time of the row.

中文：起因是同一枚、同一区块出现了两个数。一枚卖出后又挂出的作品，动态页显示它挂着时的公式值（挂单期间没有奖励），市场页显示成交后的权重；放在一起像是同一个问题的两个答案，而且哪个都不是那条记录成交当时的权重。现在动态页问的和市场页一样：还在挂单的按“现在买入”显示，数字和卡片与同一区块的市场页相同，标签写 **现在买入后**（这一行是过去的事，旁边写“成交后”会被读成那笔成交之后）；其余显示现在的总权重。某笔成交当时的权重另外查：任何详情卡的 **历史成交** 里点那一笔的区块，就按那一块还原这一枚（扩展页和弹窗里就地打开；在市场页点，会打开扩展页自动查询，然后去掉地址里的参数）。顶部条和卡片底部都写明这是所示区块的现状，不是记录当时。

### My holdings sorts four ways / 我的持仓四种排序

Asked for: switching the order of My holdings quickly, by the order added, weight, this week's output and Sub 1K.

- Four choices above the tiles: **Added**, **Number**, **Weight**, **This week**; the lit one shows its direction, and selecting it again reverses it. Sub 1K is not a separate sort: Number from low already puts Sub 10, Sub 100 and Sub 1K first, in that order, and also finds a piece by its number.
- Weight is the figure on the tile's badge (after delisting, for a listed holding). This week is the tile's large figure; listed and waiting pieces earn nothing this week and go last. Ties go to the lower number; a figure not read yet goes after the rest.
- The choice stays on this device (localStorage `nakaHoldingsSort`; no stored key is changed or removed).
- A new block re-sorts only while the pointer is away from the holdings and their card. While it is on them the order shown holds and a new piece joins at the end; the new order follows once the pointer leaves. A sort the viewer chooses applies at once and keeps the focus; the arrow keys move between the choices.

中文：用户要求“我的持仓”能快捷切换排序。卡片上方四个选项：**添加**、**编号**、**权重**、**本周**，选中的显示方向，再点一次反过来。Sub1K 不单列：编号从小到大，Sub10、Sub100、Sub1K 本来就依次排在最前，还能按编号找某一枚。权重按卡片徽章上的数（挂单中的按撤单后）；本周按卡片上的大数字，挂单中和还在等待的本周没有奖励，排在最后；相同时编号小的在前，还没读到数字的排在最后。选择存在本机（localStorage `nakaHoldingsSort`，不改动、不删除任何已有数据）。新区块只在鼠标不在持仓区、也没开着持仓卡片时重排；鼠标在上面时保持现有顺序，新加的排在末尾，鼠标离开后再按新顺序排。自己点的排序立即生效并保留焦点，左右方向键可在选项间移动。

### Relay credits at zero show again / 中继额度为 0 也显示

Reported: a listing with no credits left showed no credits line at all, which reads as a fault; the figure still tells a buyer what comes with the piece. Every known balance shows again, zero included, on the details card, the Listings tiles and the Compare row; a balance the data doesn't have shows nothing.

中文：起因是没有中继额度的挂单整行不显示，看起来像出错了；这个数对买家仍有用。现在详情卡、挂单卡片和比较表里，读到的余额 0 也显示；数据里没有的不显示。

### The week it starts earning, said against this week / 起算周对着当前周说

Reported: "After sale · from week 4" read as three weeks of waiting, when week 4 was next week. The caption now says **from next week (week 4)** / **下周起（第 4 周）**, and a later week carries the current one beside it, **from week 5 (now week 3)** / **第 5 周起（现在第 3 周）**; hovering the caption gives the week's first block and how many blocks and days away it is. Listings' note and Raise weight's buy note say it the same way (Raise weight used to turn "next week" into "week 4"), and a holding tile waiting for next week says **Next week** / **下周起**.

中文：起因是“成交后 · 第 4 周起”会被读成要等三周，而第 4 周就是下周。卡片标题改成 **下周起（第 4 周）**；更晚的周带上现在第几周，如 **第 5 周起（现在第 3 周）**；悬停标题可以看到那一周从哪一块开始、还差多少块、约几天。挂单区的说明和增加权重页“买哪单划算”的说明同样这样写（原来会把“下周起”换成“第 4 周起”）；持仓卡片里下一周开始有奖励的写 **下周起**。

### The illustrated guide, linked from About / 说明页链接原理图解

Asked for: Naka Sigil shows the figures, the illustrated guide explains the protocol behind them, and each should point to the other. About's last line now carries **How SHORD works ↗** / **协议原理图解 ↗** beside the Telegram link, kept to a link so the tab stays short; it follows the popup's language (the Chinese page, or `en.html`) on this repository's GitHub Pages, `learn/shord/`. The guide links back to Naka Sigil beside its QR code and in its common questions on mining. The group is named the same everywhere, **Naka Telegram Chinese group** / **Naka Telegram 中文交流群**: About, the wanted-post button, Own a trait's note, the README, and a second QR code on the guide's last page.

中文：用户要求插件和原理图解互相引流：一个看数值，一个讲原理。“说明”页最后一行在 Telegram 链接旁加 **协议原理图解 ↗**，只放链接、不加介绍，页面保持简短；链接跟着弹窗语言走（中文页或 `en.html`），地址在本仓库 GitHub Pages 的 `learn/shord/`。原理图解在二维码旁的说明和常见问题的挖矿一组里链回 Naka Sigil。这个群各处统一叫 **Naka Telegram 中文交流群**：说明页、求购按钮、垄断特征的说明、README，以及原理图解结尾页的第二个二维码。

### Network output reads again by itself; one caption for per week; the sort shared with the popup / 网络产出自己重读、每周只有一个标题、排序和弹窗共用

Reported: Network output kept saying the block had changed, and Retry, pressed again and again, failed the same way. The panel asked the worker for the week at the block it was drawn with; the worker answers only at the block it holds, and a newer block or chain epoch (an indexer resyncing) during the read ends it the same way. Retry asked again at the same old block.

- A changed block is not shown as a failure. The panel reads again at the block the worker holds now, up to three times, then says the indexer is updating and that it reads again on the next block (which the popup's own refresh does); Retry reads at the latest block too. The line under the title says Not read yet instead of Loading after a failure.
- The holdings figures have one caption each, **Per week** / **预计每周** and **Network share** / **全网占比**, whether or not some pieces start next week; they always counted every holding that earns now or from a later week (listed ones not, since a listing earns nothing and reclaiming is the owner's choice), and the hints now say so.
- The sort's first choice is **Date added** / **加入时间**: "Added" read as a button to add a piece. The choice is one setting for the extension page and the popup (NakaPortfolio sortChoice/sortFacts/sortIds, this extension's localStorage). The popup has the same choices above its tiles (at first a small menu, since a row of buttons, see the next section); a choice made in either reaches the other. Both sort by the same figures: weight after delisting for a listed holding, this week's SHNAKAS so far (0 for listed or waiting pieces). A refresh while the pointer is on the tiles keeps the order shown until it leaves.

中文：起因是“网络产出”一直显示“区块已更新”，连点重试也一样失败。面板按自己画出时的区块向后台要这一周，后台只按它手里的区块回答，读取中途来了新块或索引器换了 epoch（索引器在重同步）也会这样结束；重试仍用那个旧区块去要。现在区块变了不当作失败：面板按后台当前的区块重读，最多三次，还不行就说明索引器正在更新、新区块到了会自动重读（弹窗自己刷新时就会重读），重试也按最新区块读；失败后标题下面写“暂未读到”，不再写“正在读取”。持仓汇总的两个数各只用一个标题：**预计每周**、**全网占比**，不再因为有作品下周才开始而改成“开始后…”；口径本来就是持有的都算（下周才开始有奖励的也算），挂单中的不算，提示里写明。排序的第一项改叫**加入时间**（“添加”像是要添加作品的按钮）。排序是独立页和弹窗共用的一个设置：弹窗卡片上方也有这几个选项（起初是一个小菜单，后来改成一排按钮，见下一节）；在哪一边改，另一边都跟着变。两边按同样的数排：挂单中的按撤单后的权重，本周按本周已产出（挂单中、等待中的为 0）。鼠标停在卡片上时，刷新不打乱顺序，离开后再排。

### The popup's sort as a row of buttons / 弹窗排序改成一排按钮

Reported: the popup's sort menu opened the system's own list, long and in another style, over the tiles, and the menu sat alone at the right of its row, out of line with the rest of the popup.

- The popup now has the extension page's four buttons, in one row as wide as the tiles: **Sort** · **Date added** · **Number** · **Weight** · **This week**. The lit one carries its direction, pressing it again reverses it, and each button's hint says the order. The row fits the popup in both languages with nothing cut.
- The row is built once per language and only restated after, so a refresh leaves it alone and the button just pressed keeps the focus; the arrow keys move between the buttons. The choice is still the one setting shared with the extension page.

中文：起因是弹窗的排序菜单一打开就是系统自己的长列表，样式和弹窗不一样，还盖在卡片上；菜单本身单独占一行、靠右，和弹窗的版面对不齐。现在弹窗也用独立页那四个按钮，排成一行、和卡片一样宽：**排序** · **加入时间** · **编号** · **权重** · **本周**。选中的亮起并显示方向，再点一次反过来，每个按钮的悬停提示写明顺序；中英文在弹窗宽度下都放得下，不截字。按钮每种语言只建一次，之后只改状态，刷新不重建，刚点的按钮保留焦点；左右方向键在按钮间移动。选择仍是和独立页共用的那一个设置。

## v0.14.0 — what changed since v0.13.2 / 相对 v0.13.2 的变化

### SHNAKAS pouches: the dollars the site leaves out / SHNAKAS 钱袋：官网没写的美元价

- **In the site's terms, only what it leaves out.** The site writes a price per SHNAKAS in sats and puts the fees in its totals (it never shows a price per SHNAKAS with the fees in), and it never compares a pouch with the floor: what a buyer gets for the price is the point, the fees are in the total. The extension keeps to that and adds only the dollars the site does not write: a price per SHNAKAS, a single pouch's total, a balance or a pouch not listed at the floor (as the vault's home values a collection), the new price in the change-price dialog. Not shown, on purpose: a price per SHNAKAS with the fees in (the total over the size: a measure the site does not use) and any percentage against the floor or the last sale (with few listings a gap of a few sats reads as a large one and only makes buying harder). The one comparison is a seller's safeguard: a price per SHNAKAS under half the floor in the list or change-price dialog gets "Under half the floor: the price is for the whole pouch, in BTC. A zero missing?", without a figure.
- **Marked lightly, named once.** A figure is written as the site writes its own dollars beside a price, in Naka Sigil's monospace face and soft gold, nothing more; its title names Naka Sigil. Where the site writes a price per SHNAKAS as words ("169 sats 每 SHNAKAS"), the extension's line uses the same words ("$0.1276 每 SHNAKAS"). No sigil beside a number: right after it, it reads as the number's unit (as "5 元", or the site's own coin after "0.0004"), before it as a currency sign; a dotted underline would read as a link or a note to hover for, and a legend line over each list would push the list down. How eight well-used extensions mark what they add was read in their source before choosing: none puts its logo beside a figure; repeated figures carry no mark (CSFloat's "Float:" rows, Return YouTube Dislike, BetterTTV's emotes, SponsorBlock's segments) or show it only on hover (DeArrow, BetterTTV, SponsorBlock); a block or a list names its source once (SteamDB's and Augmented Steam's logo at the start of their price box, CSFloat's "Powered by CSFloat", SteamDB's "SteamDB Rating:"); Refined GitHub marks nothing, as its figures are the site's own facts. The figures here are conversions of the site's own prices, so a figure taken for the site's misleads no one.
- **Market.** The pouch list, its grid, the phone cards and the activity list show the price per SHNAKAS in sats only (the whole pouch also in dollars). The dollar price of one SHNAKAS is added beside the sats in a row, as the site puts a whole pouch's dollars beside its BTC; a grid tile and a phone card get it on a line of their own, since the site cuts their sats line off. The vault's own pouch market gets it on each tile. The market page names Naka Sigil once, small, in the free end of its own tab bar (钱袋 · 动态 · 简介).
- **Exact, not the rounded figure.** The site writes the price per SHNAKAS rounded (whole sats from 100 up: 266.67 reads "267 sats") but works its own dollars from exact prices (a whole pouch's dollars, the floor's). The dollars per SHNAKAS are therefore those of the pouch's exact price: its listing (found by the "#id" the row, tile or card shows; a phone card of a pouch someone is buying shows a cart instead, so by its price and size as written), or in the activity list its sale (by its pouch and its price as written; the activity list's phone card shows no pouch, so by its price and size). A tag is shown only where the site writes that exact price as the figure beside it, and where more than one pouch matches a look, only if they all have the same exact price (two pouches of the same size at the same price do); otherwise none, until the next read. On 2026-11-08, converting the rounded figure would have given other dollars (by $0.0001 to $0.0004 a SHNAKAS) for 151 of 203 listings and 167 of 216 sales, so a pouch's dollars per SHNAKAS would not have matched the site's own dollars for the same pouch divided by its size.
- **Market header.** Left as the site writes it: the market cap and the volume in BTC only.
- **Buy panel and buy dialog.** The buy panel shows the price per SHNAKAS (a sweep: the average) in sats and a single pouch's "total before network fee" in BTC only (a sweep's total also in dollars); both get their dollars, as the site does for a sweep's total: the price per SHNAKAS from the pouch's listing (a sweep: the prices over the sizes of the pouches ticked, as the site works the average out, only when their prices add up to the price shown), the total from the listing's exact total (the site's own sum: price, platform fee, seller payout fee capped at 20,000 sats), only when it is exactly the panel's total, so a listing kept from before a change or a panel the site reworked shows none. The buy dialog (a listing's 购买 button, known by the site's `.pp-modal-art`) writes "143 sats 每 SHNAKAS" on a line of its own beside the price: that line gets the dollars of the listing's exact price at its end; its table's total (in BTC only there) gets the dollars of the listing's exact total, on the same condition.
- **Vault dialogs and sheets.** The list dialog (the site writes "≈ $x · 500 sats 每 SHNAKAS" under the price, the fee the buyer adds on a line within it): the price per SHNAKAS in dollars right after "每 SHNAKAS", before that inner line, from the site's own figure (worked out from the pouch's exact size, then rounded), marked "≈", since the pouch is not listed yet and its exact size is nowhere public; under the site's minimum the site shows no such line, only its own warning, and nothing is added. The change-price dialog (the site shows the old price only): the new price per SHNAKAS (over the exact size of the pouch's listing, found by the number in the head; no listing kept, nothing) and the whole new price in dollars, following what is typed. A listed pouch's sheet: its listing's price per SHNAKAS in dollars. A pouch not listed: its worth at the floor (marked "≈": the size is written rounded and the floor is the cheapest on offer, not a price it would sell at). The vault market's buy sheet already writes every fee and the total in dollars: only the price per SHNAKAS in dollars, when the pouch's listing has the price its head shows. On these three the line is the last of the head's column (the pouch's picture, then its lines), lined up with the site's own lines.
- **Tokens tab.** The balance gets its worth at the floor, the sigil before its label (the page's one mark); a pouch not listed its worth at the floor; a listed pouch its listing's price per SHNAKAS in dollars (the tab shows a listed pouch's price and size, not its number, so its listing is the one kept listing with that price and size as written; none or two alike give no mark). A pouch on its way gets nothing.
- **Where the figures come from.** Sizes, prices and the price typed are read off the page. The listings and the sales come from the site's public pouch API (each listing kept with its pouch, price per SHNAKAS, whether someone is buying it, its price, its total before network fee and its size; each sale with its pouch, block, price and size, the newest 3,000 by block, all of them read on the first read and then the last few blocks each minute), the dollar price from the same three sources the site asks, in its order (coingecko, coinbase, mempool.space); the worker reads them only while a pouch page is visible. No fresh price: no dollars, never a stand-in (the site itself falls back to a fixed 95,000). Pouch data of an older shape (kept by a pre-release build) is read as it is: what needs a newer field waits for the next read, which reads all the sales when none were kept.
- **A site change never stops the page.** Everything is found by the site's own class names and by where the parts sit: the list dialog is the one whose decimal input has the payout choices beside it, the change-price one the one with the "listed" badge and a decimal input right above its two buttons, a pouch's sheet the one with the pouch actions or the "listed" badge and no input; the split and send dialogs, and anything reshaped so it no longer reads this way, are left alone. A pass that throws turns the pouch marks off for that page and leaves the rest of the extension running; marks the page and the extension keep rewriting stop the page's marks as before (v0.13.2). An unchanged pass writes nothing; text the site adds after a mark moves the mark back to the end. The site rewrites a price's text in place, which the page's observer does not see: on a page with pouch elements a light pass runs every 2 seconds, and typing a price runs one at once.

中文：只补官网没写的美元，照官网的口径。官网每枚只写聪，费用放在合计里（从不显示含费的每枚价），也从不拿一袋去和地板价比：买家花这个价格得到什么是重点，费用在合计里看。插件照这个意图，只补官网没写的美元：每枚价、单个钱袋的总计、余额和没挂单的钱袋按地板价估值（和官网金库首页按地板价估值同一个思路）、改价弹窗里的新价格。有意不显示：含费的每枚价（合计除以数量，官网不用这个口径），以及任何比地板价、比最新成交的百分比（挂单稀薄，几聪的差距看起来百分比很大，只会增加买家的心理负担）。只留一处和地板价有关的：上架或改价时每枚不到地板价的一半，提醒“不到地板价的一半：价格是整袋的（BTC），少打了一个 0？”，不写百分比，只为防卖家手误。标注要轻、只署名一次：数字照官网在价格后面写美元的办法写，用插件的等宽字体和柔金色，不加别的，悬停提示写明 Naka Sigil；官网用文字写每枚价的地方（“169 sats 每 SHNAKAS”），插件那一行也用同样的说法（“$0.1276 每 SHNAKAS”）。数字旁边不放印记：放在后面会被读成单位（像“5 元”，也像官网在“0.0004”后面放的币图标），放在前面像货币符号；虚下划线像链接或“悬停有解释”，每个列表上方加一行图例会把列表往下挤，都不用。交易页只在官网标签栏（钱袋 · 动态 · 简介）右端空白处放一个很小的“印记 + Naka Sigil”。定之前读了八个常用插件的源码：没有一家把标志贴在数字旁边；重复的数字不加标记（CSFloat 的“Float:”、Return YouTube Dislike、BetterTTV 的表情、SponsorBlock 的色段）或悬停才露出来（DeArrow、BetterTTV、SponsorBlock）；一块或一个列表只署名一次（SteamDB、Augmented Steam 价格框开头的标志，CSFloat 的“Powered by CSFloat”，SteamDB 的“SteamDB Rating:”）；Refined GitHub 完全不标，因为它加的都是官网本身的事实。这里的数字都是官网价格的换算，被当成官网的也不会误导人。市场的钱袋列表、网格、手机卡片和动态列表每枚只写聪，插件在列表行里把每枚美元放在聪的后面（和官网把整袋美元放在 BTC 后面一样），网格和手机卡片那一行会被截断，美元单独放一行，金库里的钱袋市场格子也加。每枚美元按这一袋的精确价格算（在售取挂单，动态取那一笔成交），只有精确价格按官网写法正好是旁边那个数时才显示；2026-11-08 核对，按取整后的数换算，203 条挂单里有 151 条、216 笔成交里有 167 笔会差 $0.0001 到 $0.0004。市场顶部的市值和交易量照官网写法，只写 BTC。购买侧栏：每枚价格（扫货是均价）和单个钱袋的“网络费前总计”后面加美元，总计取挂单的精确总计（官网自己的算法：价格、平台费、卖家收款网络费，收款网络费最多算 20,000 sats），和侧栏上的总计一字不差才显示。市场点“购买”弹出的确认框里，价格旁边单独一行“143 sats 每 SHNAKAS”，插件在这一行末尾补每枚美元；费用表的总计只写 BTC，按挂单精确总计补美元（条件同上）。金库各弹窗：上架弹窗在官网那一行“≈ $x · 500 sats 每 SHNAKAS”的“每 SHNAKAS”后面、里面那句平台费之前补每枚美元（取官网自己写的每枚聪；钱袋还没上架，精确数量查不到，标“≈”；低于最低价时官网不显示那一行、只显示自己的提醒，插件也不加）；改价弹窗随输入写新价的每枚美元和整袋美元（按头部编号找挂单的精确数量，找不到就不加）；挂着的钱袋详情写挂单的每枚美元；没挂的写按地板价估值（带“≈”）；金库钱袋市场的购买弹窗官网已经把各项费用和合计都写了美元，插件只补每枚美元（挂单价格和头部一致时）。这三处（已挂、没挂的详情和购买弹窗）那一行放在头部文字列的最后，和官网的几行左对齐。代币页：余额按地板价估值，印记放在标签前面，是这一页唯一的标记；没挂的钱袋按地板价估值；挂着的钱袋写挂单的每枚美元（代币页不显示编号，按官网写法价格和数量都相同的挂单正好一条才算找到）；处理中的钱袋不加。数据来源：数量、价格、输入的价格从页面读；挂单和成交来自官网公开的钱袋接口，美元价按官网同样的三个来源和顺序取，后台只在钱袋页面可见时读；没有新鲜价格就不显示美元，不用替代价；预发布版本存下的旧格式数据照样能读，缺新字段的部分等下一次读取（没存成交时那一次读全部成交）。官网改版不会让页面卡住：元素都按官网自己的类名和位置找，认不出来的一概不碰；钱袋标注出错时只关掉这一页的钱袋标注；页面和插件反复改同一处时照 v0.13.2 的办法停止标注；没变化的扫描不写页面；有钱袋元素的页面每 2 秒轻扫一遍，输入价格时立即扫一遍。

## v0.13.2 — what changed since v0.13.1 / 相对 v0.13.1 的变化

### The Vault tab's detail dialog no longer freezes the collection page / 合集页金库详情浮层不再卡死

- **Cause.** On the collection page the Vault tab opens a piece in the official detail dialog, and the extension puts its weight panel under the dialog's title. Since v0.13.0 the panel shows the piece's artwork from the official snapshot address, which the collection page reads as a piece. The next scan took the panel's own artwork for the dialog's and put a panel inside the panel, and so on at every scan, inside the MutationObserver's microtasks: the page never painted or answered a click again. The standalone wallet was not affected: its dialog takes a badge, not a panel.
- **Fix.** Scans read only the site's images. Everything the extension adds sits under an element with an `shn-` class (badges, panels, cards, the scope bar, tools, notes), and images there are skipped.
- **The page is never frozen.** A scan that changed the page runs again at once to confirm, and that run normally changes nothing. Still changing after six runs in a row, or after 60 changing runs before the page gets a turn, means the page and the extension keep rewriting each other (a site change the extension reads wrongly). The extension then stops marking that page, takes its marks off and says so in a note that stays until closed; reloading the page starts it again.

中文：合集页的“金库”标签点开一件藏品，会弹出官方详情浮层，插件在浮层标题下面插一块权重面板。v0.13.0 起面板里有这件作品的图，用的是官方快照地址，而合集页会把这种地址认成藏品图；下一次扫描就把面板自己的图当成浮层的图，在面板里再插一块面板，每次扫描多一层，一直在 MutationObserver 的微任务里跑，页面再也画不出来、点不动。独立钱包页不受影响：那里的浮层挂的是标签，不是面板。修复：扫描只认站点自己的图，插件加的东西都在带 `shn-` 类名的元素下面（标签、面板、卡片、范围栏、工具条、提示），里面的图一律跳过。另外加了一道保护：一次扫描改了页面，就立刻再扫一遍确认，正常第二遍什么都不改；连续六遍还在改，或在页面轮到下一个任务之前改了 60 遍，说明页面和插件在反复改同一处（比如站点改版后插件认错了位置），插件就停止标注这一页、撤掉已加的标注，并留一条提示（关掉前一直在）；刷新页面会重新开始。
