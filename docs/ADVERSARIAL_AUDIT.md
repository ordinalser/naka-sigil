# Adversarial implementation audit

Version 0.8.0, 2026-10-09. This review covers the extension's calculation inputs, persisted state, synchronization and injected UI. It does not establish official quarterly weights or independently verify the indexer.

| Finding | Effect before hardening | Resolution and verification |
| --- | --- | --- |
| Format-only persisted-data check | A `null` or incomplete snapshot could crash a consumer; malformed values could reach calculation | Validate collection identity, heights, timestamp, prices/counts, trait references, duplicate numbers/traits and inscription keys before selection. Corrupt sources fall back to the bundled snapshot. Node mutations and browser storage injection verify this. |
| Live lock acquired after storage awaits | An alarm and visible-page heartbeat could start duplicate checks | Claim the lock synchronously before the first await; concurrent worker tests verify a single request. |
| Live switch disabled during request | A pending request could still replace live data | Check the persisted switch before accepting the batch; a deferred-response test verifies discard. |
| Same-height epoch change | A revised indexer epoch could be mistaken for unchanged listings | Record the accepted epoch and require both height and epoch to match before skipping. A worker test changes only the epoch. |
| Inscription / asset mismatch | An unknown inscription could borrow a known asset number and corrupt floors | Require each accepted listing's inscription ID to equal the collection mapping, including newly fetched mappings. An adversarial fixture verifies rejection. |
| Floating ratio presentation | Very large integers could round a below-threshold ratio into a displayed qualifying value even when the bonus was correctly zero | Display ratios with exact BigInt division/truncation, shared by query and market; a near-MAX_SAFE_INTEGER test verifies 1.24× below 1.25×. |
| Coerced prices / duplicated active assets | Boolean or hexadecimal prices could become numeric floors; duplicated assets could inflate aggregates | Accept only positive safe-integer numbers or decimal digit strings; reject duplicate active asset/nf entries and negative confirmation heights. |
| Damaged progress or preferences | Null/incomplete status records could crash rendering or produce invalid retries | Validate progress/backoff records, default malformed language to English and malformed live preferences to off. |
| Rate limiting / invalid JSON | Immediate manual retries could disregard a 429; malformed JSON could be called a network failure | Stop immediate retries for 429 or a server Retry-After; support seconds and HTTP-date forms. Invalid JSON is classified as data failure. |
| Unscrollable / untouchable tooltip | Long explanations could be clipped; tapping a badge inside a link could navigate away | Keep the tooltip pointer-accessible, keep the complete known-catalog ledger visible, prevent parent activation only when inspecting the badge, support keyboard Enter/Space/Escape, constrain placement to the viewport. Short touch-screen browser checks verify bounds and scrolling. |
| Hostile metadata text | HTML-like traits could become script-bearing UI if inserted as markup | All dynamic text uses `textContent`; the browser injects an image/onerror string and confirms literal rendering without script execution. Long traits wrap in rows; reviewed catalog names remain complete. |

## Calculation semantics

The most consequential risk is misunderstanding a correct formula. The popup, collection banner and each detail retain the synced height and provisional warning at every block, including blocks after reward launch. Activity adds a sale-time disclaimer. Every primary card value and detail uses total holding weight including the 100% base; only contribution rows use a signed bonus. Listed cards label their single-sale formula **After sale**; the shared block/quarter notice carries its provisional scope. Unknown-floor bounds remain theoretical. Listed/delisted reward eligibility is disclosed separately from the holding estimate.

## Popup number lookup

Lookup accepts a non-negative safe integer with an optional `#`, including zero, and rejects decimal/exponent/hex/HTML-like inputs. It searches the selected snapshot's stored number rather than relying on title text or item order. Results use the shared rule engine; source changes recalculate both height and value. Editing the input removes stale results. Missing entries are described as snapshot absence, not proof of nonexistence. Query text stays in popup memory and does not initiate network traffic. Browser tests cover Enter submission, exact/capped/ranged results, Chinese/English, missing/invalid input, exact inscription links, source changes and clearing.

## Residual limits

- Schema validation cannot authenticate a malicious but internally consistent API response. No consensus/proof verification or payout engine is implemented.
- The official quarterly measurement block, rare-trait sale aggregation and numbering convention remain unresolved as documented in RULES_AUDIT.md.
- A network request already sent cannot be unsent when live sync is disabled; the returned batch is discarded. A fully completed write before disable remains cached but is not the selected source while disabled.
- Browser/OS termination can interrupt a fixed-block load; the next worker detects the interrupted record. Existing good snapshots remain available.
- DOM fixtures exercise Vault placement without connecting a real wallet. Real market layout can change; reconciliation handles the inspected structures and removes out-of-scope annotations.
- Privacy scanning uses explicit file/field allowlists and known patterns. It is not a proof against arbitrary steganography or future edits.

## Block time and toolbar regression (0.7.1)

The former icon rasterizer silently dropped absolute SVG commands and relative subpath moves, and painted an opaque dark background. Its canonical-byte check reused that parser and could not detect incorrect artwork. The parser now handles the complete command subset used by the shared icon, restores subpath coordinates on close, and leaves unused pixels transparent. Independent decoded-PNG checks require visible amber/violet and transparent margins at all four sizes; browser rasterization supplies an independent SVG/PNG comparison.

Block freshness no longer uses `generatedAt` or check time. Optional public header metadata is bound to height/hash, missing timestamps remain unknown, and future timestamps have an explicit clock warning. Provider failure cannot prevent a valid weight sync. Header timestamps come from a public API; no proof-of-work, reorganization or chain-tip verification is implied.

## Single-sale simulation (0.8.0)

Individual public listing pairs must exactly reproduce every stored trait floor/count and collection floor/count. Duplicate, missing, malformed and inconsistent offers fail source validation. Legacy snapshots without offers remain valid and disclose that scenarios require a sync. Each model/cache belongs to one selected snapshot. Simulations remove only the selected ID, preserve tied floors, recompute all relevant aggregates and use the existing exact rule engine. Last trait listing, last collection listing, missing floors, number tiers, cap and unchanged input data are tested. All 197 current bundled listing scenarios are cross-checked against an independently reconstructed remaining-listing model.

The scenario is a conditional estimate at its own block, never a trade quote, payout or quarter forecast. Unknown-floor ranges are not confidence intervals. Holding weight changes are expressed in percentage points only for two exact results; ranges are shown as ranges without a guessed point change. Activity does not show purchase badges or panels.

## Display metric invariant (0.8.1)

Primary figures consistently show total holding weight including the 100% base. Grid/list, Activity, Vault, popup lookup, item details and before-sale formula references use the same weight formatter. A bonus is confined to the explicitly labeled calculation breakdown or rule tiers. The result and smaller reference share snapshot height, units and range semantics. Changed inputs retain inline before → after evidence; unchanged evidence is displayed once. DOM bounds use named total-weight attributes; old display-metric nodes are rebuilt. This avoids comparing +0% bonus with 100% total, and prevents source or layout changes from silently changing the meaning of a primary figure. No reward-eligibility or finalized-quarter claim was added.

## Listing state, official supplement and launch (0.9.2)

Missing offers never imply unlisted; status is selected-block status, including Activity. Listed zero rewards and holding formula are separate concepts. Supply20/19 boundaries, active-floor priority, last-sale thresholds, simulated sale price, missing sale data, same-block price ambiguity and future sales are tested. Optional sale arrays reject duplicates, invalid prices/indices and future heights. Live history failures do not inherit older sale records; floor synchronization remains usable. Trait counts are catalog counts, not historical mint proofs; the short official reply leaves exact rare-trait sale aggregation unspecified. No new-buyer waiting period, purchase deadline, quarterly finality, ownership or payout qualification is invented. Reward-start ETA stays anchored to the selected header and uses no wall-clock countdown.

## Primary controls and instant dismissal (0.9.3)

Live is the new-install default; an explicit saved Fixed preference remains intact. Both mode controls are visible without expanding settings. Fixed pauses automatic checks and discards in-flight live results; Compare has no separate refresh path. Heartbeats from all three visible surfaces prevent Compare-only stale data. Query mode combines modes with language controls. Manual progress never replaces the live control's state label. Pointer exit dismisses inspection synchronously, even if the originating badge retains focus; there is no timer or fade. Keyboard focus/Enter/Space, touch, Escape and viewport/outside dismissal remain supported. The listed state always explains zero rewards while listing; its one prominent simulated-sale total and smaller before-sale formula reference use the same total-weight metric. Zero number-bonus rows are omitted as redundant; applicable number bonuses remain explicit.

## Concise market context (0.9.4)

Labels use **After sale / 成交后** consistently; the result is the same total holding formula under the stated single-sale inputs. Scope is supplied once by the shared block/quarter notice rather than repeated in each caption. The two-line collection strip retains block age/source and the provisional notice, with an explicit sale-time exclusion on Activity. Reward-start planning and detailed assumptions remain optional hover text and a focus-accessible description. Missing/future block time is never called fresh. A legacy expanded strip is replaced; geometry is checked in both languages down to 320px. Formula, source selection and payout limitations are unchanged.

## Explicit hover origin (0.9.5)

A decorative stepped pointer and active-badge outline associate each inspection with its precise origin; rank tickets do not displace the normal weight target. Four-side placement uses visible viewport bounds and clipped ancestors. Frame corner clearance is independent of pointer-tip alignment, including partially visible badges. If the weight tile is entirely clipped but a ticket remains visible, the visible badge region is used; a fully clipped origin is dismissed.

The frame never covers its originating badge. When no adjacent side can fit the complete ledger, evidence scrolls inside a bounded surface while the source and primary total remain visible. A pointer hover bridge preserves inspection without adding a close delay. Resizing and SPA changes re-evaluate geometry; stale viewport notifications are ignored when their geometry already matches the positioned panel. The pointer is hidden from assistive technology. Calculation inputs, sale model, block basis and reward limits remain unchanged.

## Comparison selection and Compare refresh removal (0.10.3)

The separate Compare refresh path (button, background message and per-batch verification record) was removed; Compare follows the shared Live / Fixed block mode, so there is one data path to reason about. Adding a number on Compare previously toggled an already-selected NFT off; it now reports the existing selection. A full selection no longer disables add controls without explanation: market and popup controls state the limit and open Compare, and the Compare catalog explains it above the cards. Selection state is derived from one pure function (`compareState`) shared by every surface, and badge markers update in place without rebuilding inspections, so focus and pointer state survive.

The inspection used to sit 12px from its badge, so moving the pointer into it crossed empty space and closed it unless the path went through the stepped pointer. The bubble now shares an edge with the badge (rounded toward it, and above a selected badge's tab, which is part of the badge's hover area), replacing the pointer bridge; the decorative curved tail never intercepts the pointer.
