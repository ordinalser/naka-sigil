# Validation record

## v0.10.3 — reviewed 2026-10-12

- **99/99 unit tests** pass. The Compare refresh path (button, background message and per-batch verification record) is removed with its six tests; new tests cover the lowest-ask-per-weight list (monotonic asks and weights, no cheaper listing reaching a listed weight, every listing matched or beaten, empty without individual listings or a post-sale floor), the shared comparison control state and English/Chinese key parity of the comparison copy. Formula rules, snapshot data and source selection are unchanged.
- Popup, Compare and market changes were checked as rendered screenshots of the real page files with a stubbed `chrome.*` API in headless Chrome: popup at 380×600 and 380×480 in EN/ZH, Live, Fixed block and failed-check states, number query with add / selected / full controls and list markers; Compare at 1440px and in a 390px frame with four, two and no selections; a minimal collection-grid fixture loading the real content scripts for badge markers and the three inspection control states. These were **not** run against the live Ord Dropz site or the native `chrome.action` popup in this revision.
- First popup screen: mode buttons lead their row apart from the language switch; the block card adds blocks to rewards start with an approximate date; number lookup stays on the first screen at 380×480; the lowest-ask list scrolls below it. The former diagnostics section and "restore bundled snapshot" are removed; failure details remain in the status tooltip.
- Comparison loop: full selections explain themselves and open Compare instead of greying out; selected NFTs can be removed from the market inspection and popup; market badges, popup list rows and Compare catalog cards mark selected NFTs; adding an already-selected number on Compare reports it instead of removing it.
- Follow-up in the same version: compare tab spans the full badge width; inspections share an edge with their badge and use a curved speech-bubble tail (checked at 3× in the market fixture, bubble below and beside the badge); popup query mode uses one toolbar row and a footer compare action; card stats use bitmap digits (decimal point glyph added and tested); the weight ladder is a quiet regular-weight list without bars; the footer Compare entry uses pixel pips and an n/4 count. Screenshots: overview EN/ZH with marked ladder rows, query add/selected/full at 380×600 and 380×480.
- Copy follows **Find your Naka / 找到你的 Naka**; text that referred to removed controls (manual sync, sync settings, update latest) is rewritten, and 27 unreferenced popup/inspection strings are removed.

## v0.10.2 — reviewed 2026-10-12

- **101/101 unit tests** pass, including atomic confirmed Fixed selection and failure/wrong-height retention. Opening or cancelling the height dialog does not change the shared mode or snapshot; confirmation activates Fixed only after the requested snapshot loads successfully.
- Live and Fixed share the same overview geometry: mode, block card, number lookup. The transient dialog has an accessible title, focused height input, Cancel, loading/error status and confirmation. During a confirmed load, dismissal is disabled until completion; failure keeps the previous mode/data and allows retry.
- Runtime calculation rules and pixel-height rendering are unchanged. The prior records below describe their own versions. New screenshots-only review and packages are prepared locally.

## v0.10.1 — reviewed 2026-10-12

- **99/99 unit tests** pass. Live is the new-install default; explicit saved preferences are preserved. Tests cover visible-workspace heartbeats, same-height batch verification, Fixed-mode latest rejection without API calls, mode changes during requests, queued fixed-height synchronization and failure retention. Formula rules are unchanged.
- The isolated browser verifies automatic next-height updates without clicking Update latest, disabled Up to date for a freshly verified batch, disabled Fixed block in Compare and backend rejection, historical-height loading, matching source/height across popup and Compare, aligned input focus, and first-screen lookup at 380×480 and 380×600.
- Prominent popup and Compare heights use the same original pixel digit paths, gold color and grouped number format. EN/ZH Compare headers fit 320/390/800/1440px without clipping the block or update control. The real native Chrome action popup remains 380×600 through rules, number queries, language changes and Overview.
- All **6,654 EN/ZH catalog query layouts** fit 380×480. Query results omit the overview-only launch line; all calculation evidence remains visible. Quarter wording refers to the official snapshot block without treating a user-entered height or reward-start height as certified.
- Actual public-market screenshots use **H971094**, 205 listings and a 125,000 sat floor. The integrated market toolbar fits one desktop row and two narrow-screen rows. Comparison screenshots show actual listed candidates, prices, after-sale totals and trait changes. **Screenshots only** are prepared for this revision, outside the public project.
- The reproducible bundled snapshot remains **H971025**. Prior v0.10.0 pointer and Activity checks below document unchanged geometry/calculation behavior; their counts are not new v0.10.1 runs.
- Public/private runtime and test files are synchronized byte-for-byte with distinct fixed extension IDs. Packaging validates 88 allowlisted release files and a 59-file exact-byte source archive, including the bilingual installation guide and SHA-256. Local screenshots, browser helpers, profiles, credentials and the private checkpoint are excluded.

The record below describes the prior release, including its former Live-off workflow and video. Those media are superseded by the v0.10.1 screenshots-only local review.

## v0.10.0 — reviewed 2026-10-12

- **94/94 unit tests** pass in public and private projects. New checks cover four-candidate corruption/cap recovery and serialized additions, independent sale evaluation order, conservative minimum endpoints, final-listing unavailability, exact-batch verification expiry, explicit-refresh source selection without changing live preference, unstable-batch retry, synchronization locks, failure retention and interrupted-refresh retry recovery.
- The shared snapshot is **H971025**, 3,327 items, 197 offers, collection floor150,000 sats. Every offered candidate uses the unchanged shared rules/purchase engine. The supported rule revision remains2026-10-08; only public schema fields are retained.
- New comparison/browser checks pass four columns, fifth-selection rejection, removal/re-addition, cross-tab popup persistence, catalog BTC asks ordered from lowest to highest, explicit latest refresh with Live still off, enlarged artwork/Escape/viewport bounds, conservative filtering, EN/ZH and390/800/1280/1440 widths without document overflow. The portable single-file demo is verified independent of extension storage and makes zero collection API calls.
- **6,654 catalog query layouts** pass in EN/ZH at380×480. No-floor after-sale total and trait values remain unavailable, with the before-sale formula retained.
- Final full isolated browser suite passes defaults/offline startup, all listing/source/query/failure states, keyboard/touch/mobile and route cleanup. The actual market verifies **63 badges and2,052 Activity rows** against the selected-block engine, with no React DOM conflicts.
- The pointer matrix passes **314 cases**, all four sides and64 constrained-scroll cases, partial/ancestor clipping, exact transformed tip alignment, origin identity, immediate dismissal, bridge, SPA shift and Escape.
- Market screenshots and the local video use actual isolated browser interaction and an explicitly refreshed public snapshot; the recording basis is kept in the local review folder, outside this public project. Historical demonstration prices are not presented as executable orders.
- Public packaging validates both fixed identities, synchronized runtime/test bytes, canonical shared portable demo, public-only snapshot schema, allowlists, current install/source ZIP bytes and SHA-256. Browser helpers/profiles/credentials/media/checkpoints remain excluded. No commit, push, deployment or posting is part of this local revision.

The record below is the **prior v0.9.5 validation**, not a claim that its historical counts describe the current bundle.

## Prior v0.9.5 — reviewed 2026-10-10.

## Calculation and state

- **83/83 unit tests** in each private/public project cover exact thresholds/cap, highest-only number tiers, source validation, lookup, block time, sync races/backoff, listing state and the official zero-listing supplement.
- Eight calculation/data/source/sync files and the pure single-sale model are byte-identical to 0.9.4. This release changes presentation and interaction, not rules, snapshot data, selected source or sale assumptions. All 205 bundled sale scenarios remain independently reconstructed in the test suite.
- Zero-listed traits are tested at 19/20 catalog pieces, with active-floor precedence, last-sale threshold equality/one sat below, missing/conflicting sale evidence and cap. Confirmed sale reconstruction excludes withdrawals/future sales. Live history failure cannot inherit stale sale data.
- Listing status is always at the selected block. Missing offers never establish unlisted status. Every primary/reference value is total holding-formula weight including base 100, never active earnings or verified eligibility.
- Reward-start planning uses header time plus remaining blocks × 600 seconds. It supplies an approximate UTC date, not a countdown, buying deadline, quarterly snapshot or eligibility guarantee.

## Browser and visual review

The preceding 0.9.3 full real-market regression passed **49/49** at **H970748**, with 246 listings and a 122,800 sat collection floor. Grid/list identity, placement, scrolling, detail switching, Activity, Vault fixtures, manual/live synchronization, source/language changes, failure retention/backoff and recovery pass. No extension errors or React conflicts were observed. Unrelated external inscription-mirror CORS failures remain the market's own network errors.

The preceding 0.9.4 real visual run checked **105 grid values and 1,927 Activity records**. Desktop/mobile market captures and the 420px hover inspection were reviewed. Listed cards lead with **After sale** weight; Activity/Vault badges remain synced-block holding formula. Inline details are capped at 520px.

Isolated fixtures pass English default/live off/no lookup network or automatic alarm, exact/capped/ranged queries, input clearing, source/height/value replacement, all listing states, corruption, literal hostile text, independent endpoint colors, rank alignment, keyboard, touch and route/viewport dismissal. Pointer exit is checked synchronously in the same event, including a focused originating badge; no timeout or fade remains.

The preceding 0.9.3 sweep confirmed all **3,327 catalog queries in each language: 6,654 layouts** fit 380×480 without horizontal overflow or content scrolling. The prior unanchored long-name/range market inspections fit 320×480; the 0.9.5 pointer now keeps the source badge visible and uses internal evidence scrolling if no adjacent space fits the complete table. Listed inspections use one primary after-sale total, a smaller before-sale formula reference and inline before → after evidence only for changed inputs. Unchanged contributions stay visible once. Redundant zero number-bonus rows are omitted; applicable number bonuses remain explicit. No calculation-data expander is used.

The live switch is visible with settings closed and remains above workspace scrolling. Number lookup is visible on the first overview screen. Query mode combines live and language controls; concise error status does not displace the ledger, and full status is accessible to assistive technology and on hover. Keyboard opt-in/out preserves the saved setting. Manual progress never relabels live state.

## Anchored pixel inspection (0.9.5)

The current complete isolated browser suite and actual market visual run pass: **105 grid values and 1,927 Activity records**, English/Chinese exact/range queries, touch, keyboard, immediate dismissal, source changes, corruption and failure states. Actual market and isolated captures were visually reviewed with the new pointer and active-badge outline.

A dedicated geometry matrix passes **314 cases** across both languages, exact and range results, and viewports 1440×1000, 1100×600, 768×480, 390×844, 320×568 and 320×480. It verifies all four pointer directions, corners/edges/center, partial clipping, actual transformed SVG tip alignment (within 0.6 CSS px), viewport bounds, originating NFT identity/ARIA association and no frame overlap with its badge. **64 constrained cases** use internal evidence scrolling while preserving the source and primary total. Additional checks cover overflow-clipped ancestors, fully clipped origin dismissal, SPA movement, pointer bridging, synchronous exit and Escape.

Returning to a tab restores its focused badge and may reopen that badge's inspection. Touch regression dismisses that visible inspection before tapping a different covered badge, and explicitly verifies the resulting NFT identity. No close delay or fade was introduced. Only content presentation/positioning changes; popup geometry, calculation rules, selected snapshot, source/sync and sale model remain unchanged.

## Compact market banner and naming (0.9.4)

The preceding 0.9.4 isolated browser suite checked **After sale / 成交后** consistently in card captions, inspection headings, query results and accessible descriptions. English/Chinese banners at 1100, 390 and 320px remain two lines, **45px high**, with no horizontal overflow or visible launch card. A legacy expanded banner is replaced. The shared notice retains provisional/quarter meaning; Activity explicitly excludes historical sale-time weight. Optional native hover text and the focus-accessible description retain full assumptions and reward-start planning.

A separate isolated-world clock check confirms actual-header ages from 3 to 4 minutes, explicit future/unknown states and invariant 45px height. Neither generated time nor check time substitutes for block time. Calculation/data, pure purchase model, sync and popup geometry are unchanged. English/Chinese exact/range/long queries, 480px/600px layouts, touch, keyboard and immediate pointer-exit dismissal passed in the 0.9.4 browser run.

## Native toolbar popup

The preceding 0.9.3 true `chrome.action.openPopup()` check through CDP confirms the real extension view and **380×600 viewport/root/body**, rather than an emulated tab. Rules, English/Chinese queries, number tickets, long names, listed/unlisted queries and Overview preserve height. Complete query evidence fits. Intrinsic root height 600 prevents the previous 36px bootstrap-size feedback; the body still adapts to constrained space.

## Release checks and limits

Private/public runtime and tests are byte-identical, with both fixed extension IDs preserved. Explicit allowlists cover 73 release files, canonical icon bytes, typed snapshot fields, expected manifest and exact source/build/install bytes. Ten current synthetic negative checks reject unexpected/private files, credential patterns, symlinks, hidden PNG payloads, bad download checksums, edited generated guides, stale downloads, ZIP comments/extra fields and modified download runtime without printing matched values. Upgrade and build-failure checks confirm that the workflow replaces old versions and preserves the last complete download on a build failure. The source archive contains **49 reviewed files**, including the ready-to-use public download. Private browser helpers, profiles, captures, automation integrations and checkpoints are excluded.

Vault checks use fixtures without connecting a wallet. Catalog counts do not prove historical mint availability or complete intended supply. Latest confirmed trait sale is an implementation proxy; the official reply does not specify multiple-sale aggregation. Tests establish implementation consistency, not quarterly measurement, ownership, consensus proof, reward eligibility or payouts. Every weight remains provisional at its selected block.

## Ready-to-use public download (0.9.4 packaging follow-up)

Runtime (22 files), tests (9 files) and shared snapshot/icon scripts remain byte-identical to the private development project. Public-only differences are package identity, public Chrome key/ID, archive names and the publication/privacy/download workflow. Private browser integrations, profiles, screenshots and checkpoints are intentionally excluded.

`npm run package:chrome` rebuilds the public runtime, generates the version/block ZIP in `release/`, its canonical English/Chinese installation guide and SHA-256 checksum, then audits every allowed file. `npm run release` repeats that workflow and packages all 49 allowlisted files. The download has the fixed public ID and exact audited runtime; ZIP extra fields/comments and embedded payload gaps are rejected. Only the current generated installation ZIP is retained, and the Git ignore exception makes it available for a future repository submission without including `dist/`. No Git operation or publication is performed.

The generated download guide gives both languages the same installation/update steps, Chrome requirement, version, bundled block/sync defaults, SHA-256 link, public extension ID, package contents and regeneration commands. Both sections use the same generated version/height and the same checksum file.
