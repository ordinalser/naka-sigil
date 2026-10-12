# Naka Sigil visual system

Original stepped shield/crown/violet gaze, graphite surfaces and restrained amber accents fit Shielded Nakas and Ord Dropz. No external artwork, fonts, animation or custom cursor. Primary weights and block height use bitmap digits; labels use readable system monospace with Chinese fallbacks.

## Meaning and hierarchy

Every primary figure is **total holding-formula weight including the 100% base**, across grid/list, Activity, Vault, details and queries. Only contribution rows use `+N%`. A formula value does not establish rewards or eligibility. One block/header-age basis accompanies every inspection; the selected-block/official-quarter distinction stays visible.

Listed grid/list NFTs show **After sale**. The inspection has one large simulated-sale total and a smaller **Before-sale formula** reference. Its amber listing strip says **No rewards while listed**. Unlisted pieces show their selected-block formula, with eligibility unverified. Missing offer data explicitly means status unknown. Activity uses the synced block, without simulating a sale or implying sale-time history.

The market has one integrated desktop context/action row: block, actual header age, source, minimum filter and Compare. Narrow screens use two rows; optional detailed quarterly scope, assumptions and start planning stay in native hover and focus-accessible descriptions. No separate banner/toolbar stack or launch card.

The primary total is strongest. Changed traits receive quiet amber row emphasis, brighter values and inline before → after contributions or price ratios. Unchanged traits remain visible with subdued type. One compact formula line supplies base, cap and ratio meaning; a separated caution group supplies only relevant limits. No duplicate listed column, data expander, cost-per-weight statistic or purchase urgency.

Each total and range endpoint retains its own band color: 100% gray; 125–175% green; 200–275% blue; 300–375% violet; 400% gold. Bands describe weight, not NFT rarity or reward eligibility. Highest-only filled Sub10/Sub100/Sub1K tickets sit beside primary figures. Their bonus is already included.

## Inspection geometry and interaction

Desktop hover width 420px, clamped to the viewport; inline detail panels at most 520px. A single result column avoids the former wide three-column ledger. The result caption belongs inside its primary tile. Trait names and calculation evidence stay complete. Short screens place unchanged bonuses and ratios on one line, preserving hierarchy rather than clipping rows. Complete English/Chinese number queries remain checked at 380×480. Market inspections preserve the visible origin: the full ledger is shown where space permits, with internal scrolling only when no side can fit it without covering the source badge. The panel stays within the viewport on 320×480 screens.

The inspection bubble shares an edge with its originating badge (no gap, rounded toward the badge), so moving the pointer from badge to bubble never crosses empty space; a selected badge's "✓ Compare" tab counts as part of the badge. A curved speech-bubble tail sits on that shared edge beside the badge (before it when the bubble edge has room, otherwise mirrored after it) and curls toward it, with a quiet matching outline on the active badge. Placement flips between all four sides and shifts within viewport margins. If only a number ticket remains visible, that visible badge region is used. Fully clipped origins close the inspection. Visual viewport changes dismiss it, and content/anchor resizing or SPA layout changes update placement. The pointer is decorative and adds no screen-reader noise.

Hover closes in the same pointer-exit event, with no timeout or fade, including when the badge remains focused. Moving through the pointer into the surface preserves inspection without a close timer. Internal evidence scrolling preserves inspection; scrolling elsewhere dismisses it. Keyboard focus, Enter/Space and touch open it; Escape, outside click, viewport resize, scrolling outside the surface and window blur dismiss it. Focused keyboard inspection does not require mouse motion. Text is always created as text nodes.

## Toolbar popup

Primary **Live / Fixed block** controls share one source contract. New installs default to Live, saved explicit modes survive. The two mode buttons lead their own row, clearly apart from the language switch in the header corner, with a short status (pixel square + one line) beside them; failure details and the retained data height are in the status tooltip rather than a diagnostics section. Fixed opens a temporary quarterly height dialog; Cancel preserves mode/data, and successful confirmation changes both atomically, pausing automatic checks. Choosing Fixed from a query opens the same dialog without discarding the query. Live receives heartbeats from popup, Compare and market, with 20-second worker keepalive during long batches.

The first screen is a compact dashboard: the block card (height, header age, collection floor, active listings, blocks to rewards start with an approximate date), then number lookup, then the **Weight ladder**. That list walks snapshot asks upward and keeps a listing only when its conservative after-sale weight beats every cheaper one, so each row answers "what is the least this weight costs at this block". It is deliberately secondary: a muted title (explanation in its tooltip), regular-weight rows of weight (band color), number and ask, pixel-dotted separators and no bars. Rows open the number's full ledger and mark NFTs already in Compare with a small check. It is not a value score or cost-per-weight ratio. Rules stay collapsed below.

Pixel character carries through the popup: 2px pixel-cut corners on controls and cards, pixel-dotted rules, a pixel block before section titles, and bitmap digits for the block height and card stats. The footer's Compare entry shows four pixel pips for the selection with the n/4 count, matching the Compare page toolbar. Query mode is one toolbar row (‹ Overview, mode, language; equal 30px height), the number field at full size, the complete ledger, and a full-width compare action in the footer instead of a crowded card header.

The root has intrinsic 600px height so Chrome can size the real action popup correctly; the body adapts to constrained space. Native `chrome.action.openPopup()` checks cover the actual 380×600 view, Rules, English/Chinese queries, rank tickets, long names and Overview. A viewport-relative root previously caused a 36px preferred-size feedback loop.

Reward-start height 971,700, selected-block distance and approximate UTC date use header time plus 600 seconds/block. They are planning context, not a live countdown, buying deadline, quarter measurement or eligibility guarantee. Unknown header time supplies no ETA. Time refreshes do not rebuild the ledger or move focus.

## Review and release

Review includes English/Chinese, exact/capped/ranged results, changed and unchanged inputs, long/hostile names, number boundaries, independent colors, keyboard/touch/immediate dismissal, short screens and actual market grid/Activity. Private profiles, helpers, captures and checkpoints are excluded from the allowlisted public release. Fixed extension identities are preserved.


## Tone: Find your Naka

**Find your Naka / 找到你的 Naka** is the project's voice. It covers choosing a higher-weight Naka to buy, whether it is the first or the fifth, checking the ones already held and following candidates. Copy names the decision (price, after-sale weight, what changes) and avoids yield, eligibility, scarcity value or guaranteed transaction claims.

## Purchase comparison workspace (0.10.0, revised 0.10.3)

The Compare headline is the project tagline; the secondary line names what is compared: weight, ask and trait bonuses.

A separate extension tab accommodates **four** candidates at desktop widths while leaving the popup compact. Label136px + candidate235px minimum means four columns need1076px; smaller screens scroll the table, never compress it into unreadable columns. The desktop frame is1280px maximum with32px gutters. After-sale totals are the largest original pixel digits; ask prices are the next strongest numeric row; before-sale formula references and evidence ratios stay quiet. Each candidate uses the same base100 metric, same source block, separate sale. Trait names identify the artwork; their bonuses explain how weight differs, while ↑/↓/◆ explain the purchase's effect. There is no fabricated best-buy score.

Monospaced readable text, stepped sigil/artwork, square controls and original pixel totals provide a consistent pixel character without forcing complex Chinese or long trait names into tiny bitmap lettering. Full-screen thumbnails enlarge in a viewport-bounded fixed preview, with immediate pointer exit, focus and Escape. All catalog cards show BTC ask and after-sale weight. The header stays light: height, header age and mode share one line under the headline. Compare follows the popup's Live / Fixed block mode and has no update button or check-time indicator; header age already says how recent the data is, and the one-minute polling is background behavior. The add field, selection count (four pips plus "n / 4") and Clear form a toolbar joined to the top of the table they control. Historical/demo data is never labeled current inventory. Opening Compare in Live mode resumes its shared automatic synchronization; Fixed and the portable demo do not poll.

## Comparison selection loop (0.10.3)

Every place that shows an NFT shows whether it is in Compare, and every add control explains its state. One control has three states shared by market inspections and popup lookup: **＋ Compare**; **✓ In Compare**, revealing **✕ Remove** on hover/focus (suppressed right after adding until pointer or focus leaves); and **Full 4/4 · open Compare**, which opens the page where one can be removed. Market badges of selected NFTs get a gold frame and a **✓ Compare** tab (floating badges) or corner check (in-flow badges). The Compare catalog marks selected cards and explains a full selection above the cards. Adding a number that is already selected reports it instead of toggling it off.

中文：项目基调为“找到你的 Naka”，覆盖挑选买入（第一枚或更多）、查看持仓和关注候选。比较页最多四列，宽屏完整并排，小屏横向查看。优先展示成交后总权重及挂价，成交前公式值与比值降级；属性加成解释差异，高亮解释成交影响，不虚构最佳购买评分。头部只保留一行区块高度、区块时间与模式，比较页跟随弹窗的实时 / 指定区块模式，不设更新按钮或核验时间。加入比较的按钮有三种状态：“＋ 加入比较”“✓ 已加入比较”（悬停显示“✕ 移出比较”）“已满 4/4 · 去比较页 ↗”；已加入的 NFT 在市场徽章上带金色“✓ 比较”标记。
