# Validation record

Version 0.9.5, reviewed 2026-10-10.

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
