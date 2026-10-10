# SHNAKAS rules audit

Review date: 2026-10-10. Scope: formula, data provenance, displayed meaning, source selection and privacy. This is an implementation review, not certification of quarterly rewards.

## Evidence

1. [Original weight announcement and graphic](https://x.com/Ob1_Wan_Satoshi/status/2108018318141755694), retrieved through X search with image understanding. A focused follow-up confirmed the delisting cooldown is in the same announcement. No explicit correction to the numerical thresholds was found in the returned author posts; search completeness cannot be guaranteed.
2. [Live market](https://ord-dropz.xyz/secondary/collections/shielded-nakas-mupv6wja): collection header, listing grid and Activity DOM inspected directly. Item identity comes from inscription IDs, not title numbers.
3. [Public collection API](https://shielded-mint-server-production.up.railway.app/api/shielded/collection): `global.start = 0`, range ending 3332, collection ID `a1e7879252940f5e`. Its referenced [collection rules inscription](https://ordinals.com/content/896803ff66162b1956ccaa3a15723e9c3acd3cbfd81acadbc94812c3ad4fb3cci0) is identified by the API; the API-returned `rules` object concerns minting/collection parameters and does not contain the SHNAKAS quarterly weight formula. This is not proof of a reward snapshot.
4. [Official zero-listing supplement](https://x.com/Ob1_Wan_Satoshi/status/2108032971617997133), rechecked on 2026-10-10 through X search with image understanding: traits with 20+ pieces and zero listings receive +100%; smaller traits use last sales. The earlier audit missed this reply and incorrectly treated every zero-listed trait as an unresolved range.
5. Public `/state` retrieved for historical reconstruction. It is an indexer response, not an independently verified consensus proof.

## Formula: confirmed vs inferred

| Area | Result | Implementation |
| --- | --- | --- |
| Base and cap | Announcement specifies 100% base, 400% total cap | Bound after summing; bonus = total minus base |
| Trait thresholds | 1.25 / 1.5 / 2 / 3× yield 25 / 50 / 75 / 100% | Descending tiers; `BigInt` cross-products; equality qualifies |
| Trait stacking | Each trait counts | Sum distinct art traits; reject duplicates |
| Number tiers | Sub 10 / 100 / 1K; highest tier only | `<10`, `<100`, `<1000`; first qualifying tier |
| Number convention | Announcement does not explicitly resolve title vs Shielded asset number | Match market `global.start + assetId`; label Shielded # and disclose assumption |
| Quarter timing | Measured at quarter start; exact block unspecified | `measureHeight = null`; no inferred official measurement height |
| Reward start | Announcement gives block 971700 | Keep `startBlock`; never derive snapshot finality from it |
| Listed / delisted | Listed pieces earn zero; eligibility resumes at the next weekly boundary after delisting | Explicit selected-block listing status and zero-reward strip; holding formula is separate from eligibility/payout |
| Zero-listed trait | Supplement: ≥20 pieces +100%; smaller traits use last sales | Catalog count; most recent confirmed trait sale proxy; missing/ambiguous sale data alone retain theoretical bounds |
| Historical trade row | No historical calculation is performed per sale | Activity explicitly uses the currently synced block |

## Findings fixed

- **False quarterly finality:** the previous implementation stopped its estimate warning at an inferred block 971699. Every snapshot now retains a provisional/unverified-quarter notice, including much later heights. Manual sync is no longer called “Quarterly sync.”
- **Silent market drift:** live sync now defaults off; opting in remains possible. The source and actual data height update together.
- **Bonus vs total confusion:** listed grid/list badges lead with simulated-sale total holding weight; a smaller before-sale formula total remains in inspections; all other primary values also show total weight including the base. Bonuses are confined to the labeled calculation breakdown. Detail comparisons never mix a bonus with a total.
- **Listing/formula ambiguity:** every inspection marks listed/unlisted/unknown at the selected block. Listed nonzero totals are explicitly holding-formula estimates, with a prominent no-rewards status; the primary total and its smaller before-sale reference retain the same metric. Unlisted does not certify eligibility, and legacy snapshots lacking individual offers cannot establish unlisted status. Activity status is synced-block status, not historical trade-time status.
- **Earnings eligibility omitted:** the delisting weekly-boundary condition is now displayed with the zero-income listing condition. Formula output is not labeled current earnings.
- **Missed zero-listing supplement (fixed in 0.9.2):** common zero-listed traits now receive +100%; rare traits use confirmed last-sale data. A hypothetical single sale supplies its own sale price, so removing its last listing is calculable. Only missing/ambiguous sale evidence retains a theoretical interval. Catalog supply and single-most-recent-sale aggregation are implementation assumptions; the latter is not explicitly specified by the short reply.
- **Potential duplicate counting:** duplicate art attributes and reintroduced `Shielded #` art traits are rejected. Metadata containing the internal trait-key separator is rejected.
- **Missing Activity coverage:** use row link inscription IDs, including unloaded thumbnails; observe changed links to handle row reuse. A persistent notice distinguishes snapshot estimates from historical sale-time weights.

Additional hardening and adversarial cases are documented in [ADVERSARIAL_AUDIT.md](ADVERSARIAL_AUDIT.md).

## Data checks

Using the public state response whose `lastHeight` was **970646**, reconstruction at the bundled height **970502** matched:

| Check | Bundled | Reconstructed |
| --- | --- | --- |
| Effective listings | 205 | 205 |
| Collection floor | 110000 sats | 110000 sats |
| All trait floors and listing counts | — | Exact equality |
| All item numbers and trait mappings | 3327 pieces | Exact equality |

This establishes consistency for that tested point. It does not prove every historic price is immutable, quarterly measurement timing, current ownership, reward eligibility, or final payouts. The raw event log was used locally for verification and is not bundled.

Unit tests cover thresholds exactly on and one sat below each boundary, non-divisible ratios, number boundaries 0/9/10/99/100/999/1000, trait sums, cap overflow, absent floors, duplicate traits, source priority, default settings, all-height provisional notices, historical listing close boundaries, metadata identity checks, live read races, request failures and backoff.

## Remaining limits

- Exact official quarter measurement heights and the exact sale aggregation used for small zero-listed traits remain unresolved. Numbering convention is the market-compatible implementation assumption.
- Historical price accuracy depends on immutable prices or complete repricing history. No unsupported “exact historical official weight” claim is made.
- APIs can lag, reorganize or change schema. Mismatches fail closed and preserve previous data; snapshots are not independently verified against Bitcoin.
- The collection catalog uses the available mapping and cannot establish historical mint availability or ownership.
- The extension has no weekly eligibility state machine, payout distribution, or verified official-quarter data import. Until authoritative data is implemented, it never labels its estimates final.

## Listing status and launch (0.9.2)

A nonzero listed holding-formula score is never active reward weight. Query/inspection status explicitly says listed earns no rewards; unlisted does not certify eligibility. Market cards lead with simulated-sale holding weight, while the inspection retains a smaller before-sale formula total and inline changed-input evidence with the same metric. Activity remains synced-block holding formula, without a sale preview. Legacy snapshots without offers show unknown status.

971700 is the rewards start, not a verified quarterly measurement or buying cutoff. Planning uses selected header time plus remaining blocks ×600 seconds, rounded to an approximate UTC date. It never reads a wall clock as chain height or certifies eligibility before/after that date. Official delisting cooldown is not silently extended to new buyers.
