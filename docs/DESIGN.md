# Naka Sigil visual system

Original stepped shield/crown/violet gaze, graphite surfaces and restrained amber accents fit Shielded Nakas and Ord Dropz. No external artwork or fonts and no custom cursor. Motion is brief and functional — a found card's reveal on the market, a newly added holding's highlight, the Look up sheet's entrance and a loading pulse — and all of it honours reduced motion. Primary weights and block height use bitmap digits; labels use readable system monospace with Chinese fallbacks.

## Meaning and hierarchy

Every primary figure is **total holding-formula weight including the 100% base**, across grid/list, Activity, Vault, details and queries. Only contribution rows use `+N%`. A formula value does not establish rewards or eligibility. One block/header-age basis accompanies every inspection; the block-weight/accrued-reward distinction stays visible.

Listed grid/list NFTs show **After sale**. The inspection has one large simulated-sale total and a smaller **Before-sale formula** reference. Its amber listing strip says **No rewards while listed**. Unlisted pieces show their selected-block formula, with eligibility unverified. Missing offer data explicitly means status unknown. Activity uses the synced block, without simulating a sale or implying sale-time history.

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

Relay credits appear as a separate utility row when captured in an active listing, with zero distinct from unavailable. They do not change weight. Comparison columns can compare these balances next to asks. The wallet's own credit display is not duplicated or extracted from private storage. API-art identities are supported only on the new `/wallet` route, from the two official origins, with exact collection ID and an existing local asset-to-inscription mapping. Original collection-grid/list/Vault slot rules stay intact; pending wallet market tiles are excluded.


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
