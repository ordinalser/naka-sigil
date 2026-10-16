# Naka Sigil visual system

Original stepped shield/crown/violet gaze, graphite surfaces and restrained amber accents fit Shielded Nakas and Ord Dropz. No external artwork, fonts, animation or custom cursor. Primary weights and block height use bitmap digits; labels use readable system monospace with Chinese fallbacks.

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
