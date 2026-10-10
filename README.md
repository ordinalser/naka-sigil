# Naka Sigil

A community Chrome extension for **provisional SHNAKAS holding weight estimates** on [Shielded Nakas at Ord Dropz](https://ord-dropz.xyz/secondary/collections/shielded-nakas-mupv6wja).

**We strongly recommend reviewing the source and building the extension yourself.** See [Install](#install). For convenience, you can also [download the ready-to-use Chrome package](release/README.md). [中文下载与安装](#中文说明)

Every value belongs to a **specific synced block**. It is **not the latest quarter’s final weight**, a historical weight at the time of a sale, or a statement of current reward eligibility. English is the default; 中文 is available in the popup. Live sync is **off by default**.

## What you see

- **Market grid and item list:** snapshot-listed NFTs lead with **After sale** total holding weight; the inspection shows that result with a smaller before-sale formula reference. Other pieces and Vault badges show the same total-weight metric, e.g. `Weight 250%`. Each total and each range endpoint has its own gray / green / blue / purple / gold weight-band color. A high-contrast filled Sub10 / Sub100 / Sub1K ticket identifies the highest number tier, already included in the total.
- **Activity:** the same estimate beside each traded item. It uses the currently selected snapshot, **not the block when that trade happened**. Lazy thumbnails and reused row links are supported.
- **Collection banner:** a quiet two-line strip shows synced block, header age, source and the provisional notice. Activity explicitly excludes sale-time and final quarterly weight. Hover exposes detailed assumptions and reward-start planning; the same description is available to assistive technology on focus.
- **Hover, keyboard focus or touch:** listed NFTs show one primary simulated-sale result, one block/time basis and concise reward limits. All trait bonuses and ratios remain visible. Changed rows show inline before → after evidence; unchanged rows stay quiet. Other pieces show their snapshot holding estimate. `250%` always means total holding weight, including the 100% base.
- **Item details and Vault detail dialogs:** the same complete table without expanders.
- **Popup:** a **Live sync** switch fixed at the top (off by default), followed by the synced height and **lookup by Shielded number**. Both the switch and lookup are visible on the first overview screen. Enter `379` or `#379` and press Enter or **Check weight**. Lookup works without a market page and uses the selected local snapshot. It shows selected-block listing status, one appropriate primary weight with compact change evidence, total holding weight, block basis and missing-sale-data caveats, with every trait visible in a compact query workspace. **Overview** returns to general controls. The live switch remains accessible in query mode. Manual synchronization, diagnostics and general rules are optional overview controls.

The original stepped shield, crown and violet gaze echo the NFT’s pixel geometry. Charcoal surfaces and amber emphasis fit the market; original bitmap digits give the block height and total weight a distinct pixel character. See [the visual system](docs/DESIGN.md). Sheet thumbnails and the canvas-based 3D Gallery are too small or inaccessible for DOM badges.

## Install

Requires **Chrome 105 or later**.

**Strongly recommended: review the source and build the extension yourself.** Building requires Node.js 18+ and a system `zip` command on macOS/Linux. From the project directory, run:

```sh
npm test
npm run build
```

The extension is generated in `dist/chrome/`.

**Convenience option:** if you prefer to skip building, [download the ready-to-use ZIP](release/README.md) and extract it into a permanent folder. This option needs no Node.js or compilation. The [download guide](release/README.md) includes a SHA-256 checksum and the bundled snapshot height.

For either option:

1. Open **chrome://extensions**, enable **Developer mode**, and click **Load unpacked**.
2. Select `dist/chrome/` for your own build, or the extracted download folder containing **manifest.json**. Pin Naka Sigil in the toolbar.

Keep the loaded folder in place. To update, replace its files, click **Reload** on the extension card, then refresh open market tabs. Removing the extension clears its browser-local data.

The manifest uses a fixed **public** extension key to preserve local storage across directory changes. The public distribution’s extension ID is `bcihombccpheaimcgldamaggokpgpidl`. No private signing key is included. A separately installed development build has its own ID and storage.

## Number lookup

Use the **Shielded number**, including `#0`, rather than a possibly different number in the market title. The collection mapping is the same one used by market badges. No lookup request is sent to an API, and the entered number is not saved to local storage.

A result is automatically recalculated when the selected manual/live/bundled snapshot changes. Its own notice repeats the block and provisional meaning. Editing the input clears the previous result, preventing a stale result from being mistaken for the new number. **Not in this snapshot** does not mean the NFT does not exist; open **Sync settings**, update and retry. **View item** links to the exact mapped inscription on Ord Dropz.

## Listing status and rewards

Every inspection identifies **Listed at this block**, **Unlisted at this block**, or **Listing status unknown**, directly below its block/time basis. These are facts about the selected snapshot, not live marketplace status or the listing state at a past Activity sale.

- **Listed:** a prominent **No rewards while listed** notice accompanies the **After sale** estimate. A smaller **Before-sale formula** reference explains the starting total; only changed traits show both inputs. Both totals include the 100% base and describe the same holding formula. Neither is active earnings, verified eligibility or a payout forecast.
- **Unlisted:** one holding-formula column; **Eligibility unverified** is visible. Not being listed alone does not establish that rewards are active: after delisting, the next weekly reward boundary must be reached. This extension does not reconstruct that eligibility history.
- **Unknown:** legacy snapshots without individual listings cannot prove an NFT is unlisted. They show an unknown-status notice and ask for a sync, without a simulated sale or eligibility claim.

A listed NFT whose sale would leave no collection floor keeps its listed/no-rewards notice and current formula estimate; the sale calculation is explicitly unavailable. No reward amount, effective eligible weight, ownership claim or payout qualification is computed.

## Displayed metric contract

Every headline, badge and comparison cell uses **total holding weight**, including the **100% base**. This applies to grid/list, Activity, Vault, item details and popup number lookup. Before-sale references and simulated-sale totals describe the same NFT using the same metric, units, height and precision. For example, 100% before and 175% after means two total-weight estimates, not +0% bonus compared with 175% total.

**Bonuses** appear only in labeled calculation details and rule tiers, with a `+` sign. 100% is the base per NFT; it is not a minimum change size. Weight is not earnings: listed NFTs earn zero, and a purchase does not establish immediate eligibility or final quarterly weight. Zero-listed traits use the official supplement below. Missing rare-trait sale data remains explicitly uncertain.

## Purchase scenario

For an NFT listed **in the selected snapshot**, grid/list badges lead with the **After sale** estimate. Number lookup and inspections emphasize that simulated result, with a smaller before-sale formula reference and inline before → after evidence only for changed traits. Both values are this NFT’s **total holding weight**, including the 100% base. Listed uses the selected block’s listings; After sale assumes only this listing sells, with all others unchanged. **After sale / 成交后** is the formula value under these stated inputs, not a forecast of the actual sale block. The block and quarter limitations appear once in the shared notice. Neither value is current earnings. Activity never adds a purchase preview. Popup number queries, item details and non-Activity tooltips share one compact result ledger. There is no full listed column, duplicate primary total or data expander. A pixel pointer and active-badge outline identify the exact origin. The frame flips between four sides and stays inside the viewport; constrained space uses internal scrolling to keep the origin visible. Hover inspections close immediately on pointer exit; the pointer bridge, keyboard focus, touch and Escape remain supported.

The model removes only that NFT’s snapshot listing, keeps all other listings unchanged, recomputes the collection floor and each of its trait floors, then applies the same rule engine. A **100% / 175%** comparison describes holding weight under those two assumptions. 100% is the base per NFT, not a minimum change size; individual trait tiers differ by 25 percentage points. If a trait loses its final listing, the result retains the official zero-listing rule: +100% for traits with at least 20 catalog items, or the simulated sale price as the latest sale for smaller traits. If no collection listings remain, calculation is unavailable. A higher purchase weight is not guaranteed.

One shared block/time label applies to the result and its references. All trait bonuses/ratios, any applicable number bonus and collection floor are visible together; the constant 100% base appears once in the formula note without expanding anything. Changed rows use a highlight plus ↑ / ↓ / ◆ / ? and inline before → after evidence. Listing-count changes alone are not highlighted. Snapshot listing price/premium are omitted to keep the inspection focused. The native pointer, keyboard focus and touch support inspection; Escape dismisses it. We deliberately omit cost-per-weight, annualized yield, earnings predictions and rankings. Legacy snapshots without per-item listings keep working and ask for a sync before offering this scenario.

Snapshot prices may differ from the live market. Other sales, new listings, fees, ownership changes and later quarterly measurements are outside this single-sale model. Listed pieces earn zero; buying does not certify immediate reward eligibility or the final quarter’s weight.

## Data and sync

The bundled snapshot is at **block 970,502**, covering **3,327 pieces**, **205 listings**, and a collection floor of **110,000 sats**. These are snapshot facts, not current market facts.

**Manual sync:** enter a block height or leave it empty to use the indexer’s latest processed block. Sync runs in the background; closing the popup does not interrupt it. Historical listings are reconstructed as active after the chosen block: listing height ≤ H and closing height > H (or no closing transaction).

**Live sync:** deliberately opt in with the first-page popup switch, which remains visible while the workspace scrolls and in number-query mode. While an Ord Dropz page is visible, the extension checks `/pulse` at most once a minute. New blocks trigger `/listings`; new pieces may require `/collection` and metadata. A pulse check before and after listings rejects a batch if its height or epoch changed. Live sync follows the indexer, not an independently verified Bitcoin tip.

Sale history is reconstructed from confirmed SOLD events in `/state` at or before the selected height; withdrawals and later sales do not count. Conflicting latest prices within one block have no proven transaction order and remain unknown. Manual sync includes this history. Live sync additionally attempts `/state`; failure preserves valid listing floors and explicitly unknown sale-dependent bonuses rather than inheriting stale prices.

Source priority: enabled live snapshot → manual snapshot → bundled snapshot. Disabling live sync restores the manual/bundled source. The popup always shows the **height actually used by the page**, rather than the most recently checked tip. Existing valid explicit language/live preferences survive upgrades. Malformed preferences fail safely to English and live off; corrupt/incompatible snapshots are ignored in favor of a validated fallback.

Failures preserve the last good snapshot. Same-height epoch changes also refresh the data. Disabling live sync discards a pending response. Live failures back off 1 / 2 / 4 / 8 / 16 / 30 minutes, respecting a longer server `Retry-After`. Errors and retained data height remain visible. “Restore bundled snapshot” clears manual data; while live sync is enabled, the live source still takes priority.

**Block time:** the popup, query result and market notices show the selected height’s Bitcoin **header timestamp**, with relative age and an exact UTC timestamp on hover. This is separate from generation/check time. New syncs read [Blockstream’s Esplora API](https://github.com/Blockstream/esplora/blob/master/API.md#blocks) at `/blocks/:height`; the returned height, hash and integer timestamp are validated. The bundled header timestamp is included for offline display. A failed time request does not fail weight sync; legacy data without a timestamp shows **Block time unknown** until synchronized. Time labels refresh while open. A timestamp ahead of the local clock is explicitly labeled instead of being called fresh. The miner-provided header time is approximate, and neither its age nor this API certifies the latest chain tip, the indexer’s consistency or final quarterly weight.

The popup stays **600px tall**. Its header and footer remain visible; query results, sync settings and rules scroll within the central pane without resizing the popup. Toolbar icons use a transparent background and the same amber/violet artwork as the interface.

**Syncing any height does not certify a quarter.** The announcement specifies measurement at the start of a quarter but does not establish an exact measurement block. This extension does not infer one from the rewards start block or automatically label a later snapshot final.

## Reward-start planning

**Rewards start at block 971,700**, according to the announcement. Overview and the collection banner’s optional hover description show blocks remaining **from the selected snapshot**, plus an approximate UTC date calculated from that block's header time at **10 minutes per block**. Number queries retain a compact start/date line. An unknown header time gives no ETA; a snapshot at or above the start says only that the selected block has reached it.

This is a planning reference, not a live chain-tip countdown, buying deadline, official quarterly measurement height or promise of eligibility. Mining time varies; the ETA deliberately shows a date rather than a precise minute. To prepare, hold unlisted; no rewards accrue while listed, and a prior delisting can have a weekly-boundary cooldown. The original post does not explicitly establish a special pre-start purchase cutoff or a new-buyer eligibility timing rule.

## Rules and limitations

The [announcement by @Ob1_Wan_Satoshi](https://x.com/Ob1_Wan_Satoshi/status/2108018318141755694), including its graphic, defines the formula:

| Component | Rule |
| --- | --- |
| Base | 100% |
| Trait floor / collection floor | ≥1.25× → +25%; ≥1.5× → +50%; ≥2× → +75%; ≥3× → +100% |
| Multiple traits | Calculate each separately, then add |
| Number | Sub 10 → +200%; Sub 100 → +100%; Sub 1K → +50%; highest tier only |
| Total cap | 400% total, equivalent to +300% bonus |
| Listed pieces | Earn zero; delisting restores eligibility at the next weekly reward boundary |

Thresholds use exact integer comparisons, including equality. The model computes **holding weight**, not whether a particular piece can earn this week.

Implementation assumptions are separate from the announcement:

- **Number:** use `global.start + assetId`, matching the market’s Shielded numbering. Titles can differ, particularly for the first pieces. The announcement does not explicitly settle that numbering convention.
- **Floor:** take the minimum confirmed active listing price for the whole collection and for each trait. The `Shielded #` metadata field is excluded from art traits to prevent double counting.
- **No listings for a trait:** the [official supplement](https://x.com/Ob1_Wan_Satoshi/status/2108032971617997133) specifies +100% for traits with at least 20 pieces, and last sales for smaller traits. The extension counts traits in the selected catalog. For smaller traits it uses the latest confirmed trait sale price as a proxy price against the collection floor; the post does not specify multi-sale aggregation. Missing sale history or conflicting prices at the latest sale block retain a theoretical +0% to +100% range, capped with the rest. Neither missing data nor a numerical cap establishes official certainty. Catalog counts do not independently certify historical mint availability or the complete intended collection supply.
- **Historical prices:** reconstruction uses the price currently stored on each listing record. Price history cannot be certified without confirming whether a listing can be repriced in place.
- **Mint history:** the item catalog uses the available collection mapping; this is not a historical inventory or ownership reconstruction.
- **Trust:** public protocol APIs are used, not an independent Bitcoin node or proof verifier. No official quarterly snapshot or payout engine is implemented.

See [the adversarial audit](docs/ADVERSARIAL_AUDIT.md), [the rule audit](docs/RULES_AUDIT.md) for evidence and remaining uncertainty, and [the validation record](docs/VALIDATION.md) for test coverage.

## Privacy

No wallet access, accounts, analytics, telemetry, or backend operated by this extension. Only snapshot/settings data are stored locally. Permissions: `storage`, `alarms`, and the public Shielded and Blockstream API hosts. Content scripts run only on `https://ord-dropz.xyz/*` and read rendered item IDs/links; they make no network requests of their own. Background sync contacts the public Shielded API and, for block time, Blockstream. Both operators can observe ordinary request metadata such as IP address. Blockstream receives only the requested block height, never an NFT query or wallet address.

See [privacy and release scope](docs/PRIVACY.md). The source archive excludes browser profiles, test captures, local automation integrations, credentials, personal paths and repository history.

## Development

```sh
npm test                                 # Zero dependency Node unit tests
npm run build                            # Validate snapshot/key, stage MV3 build, create ZIP
npm run package:chrome                   # Rebuild release/ ZIP, guide and checksum; run privacy checks
npm run privacy                          # Verify source, build, download ZIP and checksum
npm run release                          # Refresh verified download, then create the source ZIP
npm run icons                            # Recreate integer-scaled pixel icons
node scripts/snapshot.js --height tip    # Full metadata refresh (thousands of public requests)
node scripts/snapshot.js --height 970502 # Rebuild a historical floor snapshot
```

```text
src/lib/purchase.js       Single-sale scenario with recalculated floors and holding weight
src/lib/lookup.js         Offline number lookup using the selected snapshot
src/lib/pixel.js          Original shared sigil and bitmap digits
src/lib/rules.js          Pure weight calculation and formatting
src/lib/snapshot-core.js  Listing reconstruction, metadata, floors and network orchestration
src/lib/source.js         Snapshot selection, live default, scheduling and failure backoff
src/lib/i18n.js           English/Chinese UI strings and formatting
src/lib/tier.js           Static badge color bands
src/data/snapshot.js      Public collection/trait snapshot; generated file
src/sw/sync-sw.js         Manual and opt-in live sync
src/content/              Market, Activity, Vault, detail and tooltip UI
src/popup/                Extension popup
scripts/                 Snapshot, build, icons and release privacy checks
release/                 Ready-to-use Chrome ZIP, installation guide and SHA-256 checksum
test/                    Rules, source priority, metadata and sync regression tests
```

Content script reconciliation handles SPA navigation and reused DOM nodes by inscription ID. A changed `src` or Activity `href` updates the badge; annotations are removed when their nodes leave scope. No animation frame dependency is required.

## License

[The Unlicense](LICENSE). Unofficial community tool; no affiliation with Ord Dropz or the Shielded Nakas team. The original collection artwork is not redistributed.

## 中文说明

Naka Sigil显示的是**指定同步区块下的临时持有权重估算**，不是最近一季度的最终权重，也不代表当前可领取收益。默认英文，可切换中文；实时同步默认关闭。

弹窗可输入 Shielded 编号（支持 `#0`、`#379`）查询，不需要打开市场页面，也不会联网或保存查询编号。结果随所选快照自动重算；未收录不等于 NFT 不存在。挂单 NFT 显示“成交后”总权重，并以较小文字保留“成交前公式值”：仅移除该快照挂单、其他挂单不变，再重新计算地板和持有权重。100% 是基础权重，不是最小变化；特征档位相差 25 个百分点。不会显示容易混淆的单位权重成本，也不预测收益。特征加成、价格比值与计算依据直接展示，均标明快照区块。市场悬浮明细通过像素尖角指向触发的权重标签，并轻微高亮该标签；会按可用空间自动切换方向。空间不足时仅明细区域内部滚动，保持来源标签可见。同步设置默认折叠。弹窗固定 600px 高，内部滚动，展开规则不会改变外框。区块旁显示该高度的区块头时间距今多久，可悬停查看 UTC；这不是检测时间。旧数据或时间读取失败显示“区块时间未知”，不影响权重同步。

所有主显示统一为含基础 100% 的总持有权重；已挂单藏品显示“成交后”，即仅此挂单成交、其他挂单不变时的公式值。明细保留较弱的成交前公式值参考，只在变化的特征中并列显示前后依据。未挂单藏品显示同步区块下的持有公式值。加成只在计算明细中标明。Activity 使用当前同步区块，**不是成交时的历史权重**。顶部压缩为两行：区块高度、区块年龄、来源及临时口径；启动规划和详细假设可悬停查看。弹窗和明细保留高度与季度限制。零挂单特征按官方补充规则处理：至少 20 件的特征 +100%，较小特征采用最近成交价格作为实现口径；缺少或冲突的成交依据显示理论区间。挂单收益为零，撤单后需等到下一个每周奖励边界恢复资格。

**强烈建议先查看源码，再自行编译安装。** 需要 Chrome 105 或更新版本；编译需要 Node.js 18+，以及 macOS/Linux 上的系统 `zip` 命令。在项目目录中运行：

```sh
npm test
npm run build
```

生成的扩展位于 `dist/chrome/`。

**想省事也可以直接下载 [release/ 中的安装包](release/README.md#中文说明)**，解压后使用，无需 Node.js 或自行编译。

两种方式均需在 Chrome 扩展管理页启用“开发者模式”，选择“加载已解压的扩展程序”：自行编译选择 `dist/chrome/`，下载安装包则选择包含 `manifest.json` 的解压文件夹。安装后请保留所加载的文件夹。更新时替换其中的文件，点击扩展卡片上的“重新加载”，再刷新市场网页；公开版扩展 ID 保持不变，本地设置和快照可以继续使用。卸载扩展会清除其浏览器本地数据。

安装包版本、内置快照区块、公开版扩展 ID 和维护说明均见[中文下载说明](release/README.md#中文说明)；[SHA-256 校验文件](release/SHA256SUMS)与英文说明使用同一份。内置快照不是当前链上最新高度，可手动同步，实时同步默认关闭。安装包不包含浏览器资料、钱包数据、凭据或开发工具。

维护者可运行 `npm run package:chrome` 重新生成安装包；`npm run release` 会同时更新安装包、双语说明和校验文件，并生成通过隐私检查的源码包，不会自动提交或发布。
