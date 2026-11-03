# Classic projections · v0.13.1

Classic is the only interface. The former mining skin and selector are removed. The internal `mining.js` module retains pure projection helpers for compatibility; it does not change weights into hashrate.

## What each number means

- **本周已产出 · 参考 / Accrued this week · reference** uses the official cumulative vector through the displayed block, after identifiable ineligible weeks are excluded. It is not the current rate multiplied by elapsed blocks, a claimable balance, or verified wallet ownership. Public transfers do not reveal every NFT identity.
- **历史累计 / Past total** sums eligible completed weeks from saved holding records, including departed pieces and already claimed portions. It excludes the open week. Inferred portions are visibly marked as references; incomplete records stay unknown.
- **预计每周产量 / Estimated weekly output** freezes the displayed block's weight, listings and integer unit rate for a full eligible week. Waiting pieces count from their own eligible start; listed pieces do not count.
- **预计剩余产量 / Estimated remaining output** applies the same scenario to each piece's remaining eligible blocks through programme end. It excludes accrued output and is an estimate, not promised issuance.
- **全网占比 / Network share** (extension page) is per week ÷ the weekly pool of 266,640, on the same pieces as per week, so share × 266,640 = per week. The hero reads past → share → per week → remaining: each figure follows from the one before it.

Weekly output = units × floor(26,664,000,000,000 ÷ 1,008 ÷ all catalogue units) × 1,008 ÷ 10⁸. All 3,333 catalogue pieces contribute to the denominator, including listed and unminted pieces. A 100% weight is four units. There is no TH/s conversion, quarterly snapshot or adjustable reward basis.

A newly created note at height h starts at week ceil((h − 971,700) ÷ 1,008), zero-based after launch. Spending keeps only weeks before floor((h − 1 − 971,700) ÷ 1,008). A listing, purchase, reclaim or transfer inside a week makes that entire week ineligible. Completed earlier weeks stay attributable to their entitled holder. The earliest simulated confirmation is the next block. A transaction during the last reward week has no later eligible week.

## Network statistics

The Block tab's hero gives the block (large, with its age and live state), the reward week and how far into it the block is, the week bar, then three figures of that block: floor, listings and what a 100% weight earns in a full week now (the unit every listing's weekly gain is measured in). Three dates follow — blocks left first, the estimated local date beside it (marked as approximate: the protocol fixes the height, the date assumes about 10 minutes a block) — then the selected week's network output, read top down as one sum: full output on one line, a 1 px muted split under it, earnable under its left half and forfeited under its right; claimed is a separate fact, on its own line below. An open week's range says where its figures stop ("Blocks 972,709 – 973,161 so far"; in Chinese the full range and "累计至 973,161"): they run to the block shown, not the full week. The tab fits the popup without scrolling. The open week's progress is shown once, in the hero; figures keep their places while a week loads; meanings are on the About tab and exact bases in tooltips.

- **满额产出 / Full output** is the week's output if all 3,333 pieces earned: the exact official per-NFT accrual vector summed, listed and unminted pieces included. The rule's issuance minus this sum is per-block rounding.
- **流失 / Forfeited (≥)** sums that vector for the listings and moves public records identify, still-unminted pieces and the six known-unminted pieces in week 1: output nobody can claim and nobody else receives; what becomes of it is not stated in the programme or the wallet (see the rules audit). Its share of the full output sits beside it. Both are lower bounds: an encrypted transfer cannot be matched to a piece publicly.
- **可产出 / Earnable (≤)** is the full output less forfeited, the most holders can claim. A hairline is split in these two parts, earnable on the left and forfeited on the right, the same sides as their figures.
- **已领取 / Claimed** comes from the complete set of public claim receipts, attributed to the week earned. It can grow after the week ends and is neither a claimable maximum nor an unclaimed balance. An open week says when it shows.

Actual total owner output cannot be established from these public endpoints alone. 

## Personal history and storage

Record only intervals you can confirm; the extension does not infer private ownership. A recorded interval replaces the public-record reading for the current holding, but never removes a past run that a public sale proves (Left); a public sale inside a recorded interval leaves the later weeks undecided until the interval is closed at that sale. At a week's last block that week is still this week (the hero shows it), so the past total counts it only from the next block. An open interval received this week can narrow current eligibility, but cannot turn a reference into wallet proof. Closed intervals are historical records and do not remove a currently saved NFT. Editing an interval preserves unrelated fields and IDs. Unsupported user-data formats are retained and writes are refused rather than guessed.

Completed official vectors are cached persistently. Sanitized public records are reused per block and epoch in session storage, including after service-worker suspension. In-flight reads are deduplicated. Corrupt derived cache data can be downloaded again; user-maintained holdings are not cleared. Progress and a retry control accompany historical reads.

## Listings and comparisons

Each comparison column assumes one independent purchase. A listing's details (hover its weight badge, or click to keep them open) carry the same actions as every other details card, Compare and My holdings, plus the optional buy sequence: listings assumed bought together in the order added. A line above the cards then gives the sequence's pieces, total ask and the weekly change of my holdings once all are bought; later cards are valued after the earlier sales, with their denominator, and their personal change includes the pieces bought before them. Closing listings cannot be bought again; a listing already selling cannot be reclaimed. Simulations are local calculations, never transactions.

## Details cards and past sales

Every details card (look-up, a holding's or a listing's weight on the extension page and the market page) opens with the artwork large on the left and, beside it, one column as tall as the artwork on the same two edges as the trait table under it — words on the left, figures on the right: the listing state in a word (with the live / historical chip in the look-up) and the block every figure is computed at (bold, with its age) on top; at the bottom the weight, right-aligned under one caption naming its world and start week ("after sale · from week 3", "after delisting", "formula" for a listing shown as it stands, nothing for a piece earning now), then per week and remaining as label-left, figure-right rows. A piece that produces nothing knowable shows the reason in their place. The weight before a sale is not repeated; changed trait rows show both sides. A number outside the collection's range says the number does not exist.

Past sales open on request: the worker reads the public listing records once per block (shared with other readers in session storage) and the block times of the newest six sales from a public block explorer, cached on this machine. Only price, block and time are shown; recipients, scripts and wallet notes are never read.
