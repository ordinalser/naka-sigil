# Naka Sigil visual system

Original stepped shield/crown/violet gaze, graphite surfaces and restrained amber accents fit Shielded Nakas and Ord Dropz. No external artwork, fonts, animation or custom cursor. Primary weights and block height use bitmap digits; labels use readable system monospace with Chinese fallbacks.

## Meaning and hierarchy

Every primary figure is **total holding-formula weight including the 100% base**, across grid/list, Activity, Vault, details and queries. Only contribution rows use `+N%`. A formula value does not establish rewards or eligibility. One block/header-age basis accompanies every inspection; the final-quarter warning stays visible.

Listed grid/list NFTs show **After sale**. The inspection has one large simulated-sale total and a smaller **Before-sale formula** reference. Its amber listing strip says **No rewards while listed**. Unlisted pieces show their selected-block formula, with eligibility unverified. Missing offer data explicitly means status unknown. Activity uses the synced block, without simulating a sale or implying sale-time history.

The collection banner occupies two quiet lines (45px in checked layouts): block, actual header age and source, then the provisional notice. Detailed assumptions and reward-start planning are optional native hover text and a focus-accessible screen-reader description. No launch card is injected into the banner. Narrow screens hide only the brand text, keeping height, age, source and the warning. Activity retains an explicit sale-time/final-quarter disclaimer.

The primary total is strongest. Changed traits receive quiet amber row emphasis, brighter values and inline before → after contributions or price ratios. Unchanged traits remain visible with subdued type. One compact formula line supplies base, cap and ratio meaning; a separated caution group supplies only relevant limits. No duplicate listed column, data expander, cost-per-weight statistic or purchase urgency.

Each total and range endpoint retains its own band color: 100% gray; 125–175% green; 200–275% blue; 300–375% violet; 400% gold. Bands describe weight, not NFT rarity or reward eligibility. Highest-only filled Sub10/Sub100/Sub1K tickets sit beside primary figures. Their bonus is already included.

## Inspection geometry and interaction

Desktop hover width 420px, clamped to the viewport; inline detail panels at most 520px. A single result column avoids the former wide three-column ledger. The result caption belongs inside its primary tile. Trait names and calculation evidence stay complete. Short screens place unchanged bonuses and ratios on one line, preserving hierarchy rather than clipping rows. Complete English/Chinese number queries remain checked at 380×480. Market inspections preserve the visible origin: the full ledger is shown where space permits, with internal scrolling only when no side can fit it without covering the source badge. The panel stays within the viewport on 320×480 screens.

A stepped gold pointer joins the frame to the originating weight tile, with a quiet matching outline on the active badge. Placement flips between all four sides and shifts within viewport margins. The tip follows the visible weight region independently of the frame’s corner clearance; it does not drift when the frame is clamped at an edge. If only a number ticket remains visible, that visible badge region is used. Fully clipped origins close the inspection. Visual viewport changes dismiss it, and content/anchor resizing or SPA layout changes update placement. The pointer is decorative and adds no screen-reader noise.

Hover closes in the same pointer-exit event, with no timeout or fade, including when the badge remains focused. Moving through the pointer into the surface preserves inspection without a close timer. Internal evidence scrolling preserves inspection; scrolling elsewhere dismisses it. Keyboard focus, Enter/Space and touch open it; Escape, outside click, viewport resize, scrolling outside the surface and window blur dismiss it. Focused keyboard inspection does not require mouse motion. Text is always created as text nodes.

## Toolbar popup

A fixed primary **Live sync** switch stays visible above the scrolling workspace and in lookup mode. It defaults off, indicates On/Off/error and saves the existing preference. The overview places block/age, concise provisional meaning, launch planning and offline number lookup ahead of optional manual sync, diagnostics and rules. Lookup is visible on the first overview screen. Query mode combines the live switch and language buttons into one utility row; the stationary number input leads into one complete ledger. **Overview** returns to general controls.

The root has intrinsic 600px height so Chrome can size the real action popup correctly; the body adapts to constrained space. Native `chrome.action.openPopup()` checks cover the actual 380×600 view, Rules, English/Chinese queries, rank tickets, long names and Overview. A viewport-relative root previously caused a 36px preferred-size feedback loop.

Reward-start height 971,700, selected-block distance and approximate UTC date use header time plus 600 seconds/block. They are planning context, not a live countdown, buying deadline, quarter measurement or eligibility guarantee. Unknown header time supplies no ETA. Time refreshes do not rebuild the ledger or move focus.

## Review and release

Review includes English/Chinese, exact/capped/ranged results, changed and unchanged inputs, long/hostile names, number boundaries, independent colors, keyboard/touch/immediate dismissal, short screens and actual market grid/Activity. Private profiles, helpers, captures and checkpoints are excluded from the allowlisted public release. Fixed extension identities are preserved.
