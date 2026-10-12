# Naka Sigil

**Find your Naka.** A community Chrome extension that shows **block-specific SHNAKAS holding weights** for [Shielded Nakas at Ord Dropz](https://ord-dropz.xyz/secondary/collections/shielded-nakas-mupv6wja) right where you browse: choose a higher-weight Naka to buy, check the ones you hold, and keep the ones you follow in view.

**We strongly recommend reviewing the source and building the extension yourself.** See [Install](#install). For convenience, you can also [download the ready-to-use Chrome package](release/README.md). [中文下载与安装](#中文说明)

Every formula value belongs to a **specific block**. Quarterly weights use the **official quarterly snapshot block**; a date or the rewards-start height alone does not identify it. Formula weights do not establish current reward eligibility, and Activity does not reconstruct sale-time weights. English is the default; 中文 is available. New installs default to **Live**; an explicit saved Fixed preference is preserved.

## What it is for

- **Choosing a Naka to buy:** every listed NFT on the market shows its **After sale** total weight, the formula result if only that listing sells. Inspect it to see which traits change, compare up to four candidates side by side, and use the popup's **Weight ladder** to see the cheapest snapshot listing that reaches each after-sale weight.
- **Checking what you hold:** Vault cards show the holding weight of your Nakas at the selected block, and the popup looks up any Shielded number without opening the market.
- **Following the ones you care about:** add them to Compare. They stay marked on every market badge until you remove them.

## Try before installing

Download the source and open [demo/naka-sigil-demo.html](demo/naka-sigil-demo.html) in your browser for an interactive, installation-free demo. It uses the bundled snapshot and the extension's actual calculation engine; it is clearly labeled as non-live. No API key or wallet connection is needed. Optional public NFT thumbnails fall back to the pixel sigil offline. See [reproducible examples and rule revision](docs/REPRODUCIBILITY.md).

**Compare** opens a dedicated browser tab, preserving the compact popup and market inspection. Columns show the selected-block ask, total weight, smaller before-sale formula and highlighted changes. Each column is an independent sale against the same snapshot, not a combined purchase. Selection (up to four inscription IDs) stays in browser-local storage and can be cleared. Hover or focus a thumbnail to enlarge the artwork; Escape closes it. Columns keep a readable minimum width and scroll horizontally on small screens.

Add candidates with **＋ Compare** in a market inspection or popup lookup, or by number on the Compare page. A selected NFT shows **✓ In Compare**; hovering or focusing it reveals **✕ Remove**, and selecting it removes the NFT. Its market badges carry a gold **✓ Compare** tag, so the selection is visible without opening an inspection. With four selected, the control reads **Full 4/4 · open Compare** and opens the page where one can be removed, instead of silently greying out. Adding a number that is already selected reports it rather than removing it. The market toolbar and popup footer show the **Compare (n/4)** count.

**Live / Fixed block** are mutually exclusive modes shared by popup, market and Compare. In **Live**, a visible market, Compare tab or popup sends a heartbeat; the background checks at most once per minute and updates every surface. In **Fixed block**, automatic checks pause, and only a successful confirmed height selection in the popup replaces that snapshot. Compare has no separate update control; it follows the selected mode. Switching modes during an outstanding live request discards its result. Failures retain existing data.

Workspace listings start with the lowest snapshot asks. The market's compact **After sale ≥** filter covers the loaded grid/list only; the workspace can filter every listing in the selected snapshot. Ranges pass only when their lower endpoint meets the minimum. Filtering and comparing make no API requests. Prices are snapshot asks excluding fees, not live quotes.

The workspace is a page **inside the installed extension**, sharing its local snapshot and selection; it needs no hosted site. The portable demo is separate and deliberately offline. A static project demonstration could be hosted on GitHub Pages, but this release does not deploy anything or expose a shared API key.

## What you see

- **Market grid and item list:** snapshot-listed NFTs lead with **After sale** total holding weight; the inspection shows that result with a smaller before-sale formula reference. Other pieces and Vault badges show the same total-weight metric, e.g. `Weight 250%`. Each total and each range endpoint has its own gray / green / blue / purple / gold weight-band color. A high-contrast filled Sub10 / Sub100 / Sub1K ticket identifies the highest number tier, already included in the total. NFTs in Compare carry a gold frame and **✓ Compare** tag.
- **Activity:** the same estimate beside each traded item. It uses the currently selected snapshot, **not the block when that trade happened**. Lazy thumbnails and reused row links are supported.
- **Market toolbar:** one integrated desktop row shows block/header age/source, minimum filter and **Compare (n/4)**; narrow screens use two rows. Detailed quarterly scope and assumptions are available on hover/focus.
- **Hover, keyboard focus or touch:** listed NFTs show one primary simulated-sale result, one block/time basis and concise reward limits. All trait bonuses and ratios remain visible. Changed rows show inline before → after evidence; unchanged rows stay quiet. Other pieces show their snapshot holding estimate. `250%` always means total holding weight, including the 100% base. The header holds the add/remove Compare control.
- **Item details and Vault detail dialogs:** the same complete table without expanders.
- **Popup:** the **Live / Fixed block** buttons lead the first row, with a short status beside them; hover the status for details such as a failed check and the data still in use. The block card shows height, header age, collection floor, active listings and the blocks remaining until rewards start, with an approximate date. Below it are Shielded number lookup and the **Weight ladder**: for each reachable after-sale weight, the cheapest snapshot listing that reaches it, using the conservative lower bound of a range. It is a quiet list (weight in its band color, number, ask), with the explanation on the title tooltip. Selecting a row opens that number's full calculation. Query mode puts **‹ Overview**, the mode buttons and the language switch on one row, keeps the complete ledger, and moves **＋ Compare** to a full-width footer button. Rules stay collapsed. Fixed block opens a temporary height dialog; Cancel preserves mode/data, and only a successful confirmed load activates Fixed.

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

A result is automatically recalculated when the selected live/fixed/bundled snapshot changes. Its own basis identifies the block and quarterly snapshot meaning. Editing the input clears the previous result, preventing a stale result from being mistaken for the new number. **Not in this snapshot** does not mean the NFT does not exist; use **Live** or load the required **Fixed block**, then retry. **View item** links to the exact mapped inscription on Ord Dropz.

## Listing status and rewards

Every inspection identifies **Listed at this block**, **Unlisted at this block**, or **Listing status unknown**, directly below its block/time basis. These are facts about the selected snapshot, not live marketplace status or the listing state at a past Activity sale.

- **Listed:** a prominent **No rewards while listed** notice accompanies the **After sale** estimate. A smaller **Before-sale formula** reference explains the starting total; only changed traits show both inputs. Both totals include the 100% base and describe the same holding formula. Neither is active earnings, verified eligibility or a payout forecast.
- **Unlisted:** one holding-formula column; **Eligibility unverified** is visible. Not being listed alone does not establish that rewards are active: after delisting, the next weekly reward boundary must be reached. This extension does not reconstruct that eligibility history.
- **Unknown:** legacy snapshots without individual listings cannot prove an NFT is unlisted. They show an unknown-status notice and ask for Live or a fixed-block load, without a simulated sale or eligibility claim.

A listed NFT whose sale would leave no collection floor keeps its listed/no-rewards notice and current formula estimate; the sale calculation is explicitly unavailable. No reward amount, effective eligible weight, ownership claim or payout qualification is computed.

## Displayed metric contract

Every headline, badge and comparison cell uses **total holding weight**, including the **100% base**. This applies to grid/list, Activity, Vault, item details and popup number lookup. Before-sale references and simulated-sale totals describe the same NFT using the same metric, units, height and precision. For example, 100% before and 175% after means two total-weight estimates, not +0% bonus compared with 175% total.

**Bonuses** appear only in labeled calculation details and rule tiers, with a `+` sign. 100% is the base per NFT; it is not a minimum change size. Weight is not earnings: listed NFTs earn zero, and a purchase does not establish immediate eligibility or final quarterly weight. Zero-listed traits use the official supplement below. Missing rare-trait sale data remains explicitly uncertain.

## Purchase scenario

For an NFT listed **in the selected snapshot**, grid/list badges lead with the **After sale** estimate. Number lookup and inspections emphasize that simulated result, with a smaller before-sale formula reference and inline before → after evidence only for changed traits. Both values are this NFT’s **total holding weight**, including the 100% base. Listed uses the selected block’s listings; After sale assumes only this listing sells, with all others unchanged. **After sale / 成交后** is the formula value under these stated inputs, not a forecast of the actual sale block. The block and quarter limitations appear once in the shared notice. Neither value is current earnings. Activity never adds a purchase preview. Popup number queries, item details and non-Activity tooltips share one compact result ledger. There is no full listed column, duplicate primary total or data expander. The inspection bubble touches its badge, so the pointer moves straight from badge into the inspection; a curved speech-bubble tail beside the badge and an active-badge outline identify the exact origin. The bubble flips between four sides and stays inside the viewport; constrained space uses internal scrolling to keep the origin visible. Hover inspections close immediately once the pointer leaves both badge and bubble; keyboard focus, touch and Escape remain supported.

The model removes only that NFT’s snapshot listing, keeps all other listings unchanged, recomputes the collection floor and each of its trait floors, then applies the same rule engine. A **100% / 175%** comparison describes holding weight under those two assumptions. 100% is the base per NFT, not a minimum change size; individual trait tiers differ by 25 percentage points. If a trait loses its final listing, the result retains the official zero-listing rule: +100% for traits with at least 20 catalog items, or the simulated sale price as the latest sale for smaller traits. If no collection listings remain, calculation is unavailable. A higher purchase weight is not guaranteed.

One shared block/time label applies to the result and its references. All trait bonuses/ratios, any applicable number bonus and collection floor are visible together; the constant 100% base appears once in the formula note without expanding anything. Changed rows use a highlight plus ↑ / ↓ / ◆ / ? and inline before → after evidence. Listing-count changes alone are not highlighted. Snapshot listing price/premium are omitted to keep the inspection focused. The native pointer, keyboard focus and touch support inspection; Escape dismisses it. We deliberately omit cost-per-weight, annualized yield, earnings predictions and value scores; the popup's weight ladder states only the cheapest snapshot ask that reaches each weight. Legacy snapshots without per-item listings keep working and ask for Live or a fixed-block load before offering this scenario.

Snapshot prices may differ from the live market. Other sales, new listings, fees, ownership changes and later quarterly measurements are outside this single-sale model. Listed pieces earn zero; buying does not certify immediate reward eligibility or the final quarter’s weight.

## Data and sync

The bundled snapshot is at **block 971,025**, covering **3,327 pieces**, **197 listings**, and a collection floor of **150,000 sats**. These are snapshot facts, not current market facts.

**Fixed block:** select this first-page mode and enter the official quarterly snapshot height. The form requires a whole non-negative height; it does not silently interpret an empty value as latest. The current data stays visible while loading. On success all surfaces use that exact height, with automatic checks paused. The temporary dialog does not change mode/data when opened or cancelled. Confirmation loads the requested height; mode and data change together only on success. Failure keeps the previous mode and data. Historical listings are reconstructed as active after the chosen block: listing height ≤ H and closing height > H (or no closing transaction).

**Live:** the default for new installs. While a market, Compare or popup is visible, the extension checks `/pulse` at most once a minute. New blocks or changed indexer epochs trigger reconstruction. A pulse check before and after listings rejects inconsistent batches. Live follows the indexer, not an independently verified Bitcoin tip. Closing all surfaces pauses checks; opening any one resumes them.

Sale history is reconstructed from confirmed SOLD events in `/state` at or before the selected height; withdrawals and later sales do not count. Conflicting latest prices within one block have no proven transaction order and remain unknown. Fixed-block loads include this history. Live sync additionally attempts `/state`; failure preserves valid listing floors and explicitly unknown sale-dependent bonuses rather than inheriting stale prices.

Source priority: Live snapshot (in Live mode) → fixed-block snapshot → bundled snapshot. Leaving Live returns to the fixed-block or bundled source. The popup always shows the **height actually used by the page**, rather than the most recently checked tip. Existing valid explicit language/live preferences survive upgrades. Malformed preferences fail safely to English and live off; corrupt/incompatible snapshots are ignored in favor of a validated fallback.

Failures preserve the last good snapshot. Same-height epoch changes also refresh the data. Disabling live sync discards a pending response. Live failures back off 1 / 2 / 4 / 8 / 16 / 30 minutes, respecting a longer server `Retry-After`. Errors and the retained data height remain visible.

**Block time:** the popup, query result and market notices show the selected height’s Bitcoin **header timestamp**, with relative age and an exact UTC timestamp on hover. This is separate from generation/check time. New syncs read [Blockstream’s Esplora API](https://github.com/Blockstream/esplora/blob/master/API.md#blocks) at `/blocks/:height`; the returned height, hash and integer timestamp are validated. The bundled header timestamp is included for offline display. A failed time request does not fail weight sync; legacy data without a timestamp shows **Block time unknown** until synchronized. Time labels refresh while open. A timestamp ahead of the local clock is explicitly labeled instead of being called fresh. The miner-provided header time is approximate, and neither its age nor this API certifies the latest chain tip, the indexer’s consistency or final quarterly weight.

The popup stays **600px tall**. Its header, mode row and footer remain visible; query results, the weight ladder and rules scroll within the central pane without resizing the popup. Toolbar icons use a transparent background and the same amber/violet artwork as the interface.

**Syncing any height does not certify a quarter.** The announcement specifies measurement at the start of a quarter but does not establish an exact measurement block. This extension does not infer one from the rewards start block or automatically label a later snapshot final.

## Reward-start planning

**Rewards start at block 971,700**, according to the announcement. The popup's block card and the market toolbar's optional hover description show blocks remaining **from the selected snapshot**, plus an approximate UTC date calculated from that block's header time at **10 minutes per block**. An unknown header time gives no ETA; a snapshot at or above the start says only that the selected block has reached it.

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
src/sw/sync-sw.js         Fixed-height and visible-tool live sync
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

**找到你的 Naka。** Naka Sigil 在 Ord Dropz 的 Shielded Nakas 页面上直接显示**所选区块的 SHNAKAS 持有权重**：挑一枚权重更高的 Naka 买入，查看自己持有的，关注自己在意的。

- **挑选买入：** 市场里每枚挂单 NFT 都显示“成交后”总权重，即仅此挂单成交、其他挂单不变时的公式值。悬停查看哪些特征发生变化，把至多四枚候选加入比较；弹窗里的“权重阶梯”列出达到每个成交后权重档位的最低快照挂价。
- **查看持仓：** 金库卡片显示你持有的 Naka 在所选区块的持有权重；弹窗可按 Shielded 编号查询任意一枚，不需要打开市场。
- **关注候选：** 加入比较后，这些 NFT 在市场的每个徽章上都会带金色“✓ 比较”标记，直到你移出。

Naka Sigil 显示的是**所选区块下的持有权重公式值**。季度结算使用官方季度快照区块，不能仅凭奖励启动高度或日期认定。公式值不代表当前可领取收益。默认英文，可切换中文；新安装默认实时模式，保留已明确保存的指定区块模式。

**比较**打开插件内的独立标签页，不挤占弹窗，也不需要部署网站，和市场及弹窗共用本地快照。最多四枚，各列独立计算，不是组合购买。并排显示所选区块挂价、总权重、较小的成交前公式值与突出标注的变化；属性加成说明总权重从哪里来。宽屏并排，小屏横向查看。缩略图支持鼠标悬停或键盘聚焦放大，Escape 关闭。至多四枚铭文 ID 仅保存在浏览器本地，可清空。

在市场悬浮明细或弹窗查询结果中点击“＋ 加入比较”，或在比较页输入编号加入。已加入的显示“✓ 已加入比较”，悬停或聚焦时变为“✕ 移出比较”，点击即可移出。已满四枚时按钮显示“已满 4/4 · 去比较页 ↗”，点击打开比较页移除一枚，而不是无说明地变灰。比较页输入已在比较中的编号会提示“已在比较中”，不会把它移出。市场顶部栏和弹窗底部显示“比较 (n/4)”。

**实时 / 指定区块**在弹窗、市场和比较页共用。实时模式下，市场、比较页或弹窗可见时每分钟最多检查一次，新区块到来后所有页面一起更新；指定区块模式暂停自动检查，只有在弹窗中确认加载成功的高度才会替换数据。比较页不设单独的更新按钮，跟随所选模式。失败保留旧快照并显示错误。

比较页候选按快照挂价从低到高排列。市场“成交后 ≥”只筛选当前已加载的网格/列表；比较页可筛选快照内全部挂单。区间按下限判断，筛选和比较不发起 API 请求。挂价不含费用，不是实时报价。

下载源码后用浏览器打开 [demo/naka-sigil-demo.html](demo/naka-sigil-demo.html)，无需安装插件、API key 或连接钱包。演示使用内置快照与插件同一套计算引擎，明确标注非实时；公开铭文缩略图离线时显示像素备用图。详见[可复现示例与规则版本](docs/REPRODUCIBILITY.md#中文)。

**弹窗**首行左侧是“实时 / 指定区块”按钮，右侧是简短状态，悬停可看检查失败原因和仍在使用的数据。区块卡片显示高度、区块时间、集合地板、有效挂单和距奖励启动的块数及大致日期。下方是编号查询（支持 `#0`、`#379`）和“权重阶梯”：低调的文字列表，每行是权重（按档位着色）、编号和挂价，说明放在标题的悬停提示里；点击任一行即可查看该编号的完整计算。查询页顶部一行放“‹ 返回概览”、模式按钮和语言切换，“＋ 加入比较”移到底部整宽按钮。编号查询本身不联网、不保存编号；结果随所选快照自动重算；未收录不等于 NFT 不存在。点击“指定区块”打开临时设置弹层，填写季度快照高度；取消不改变模式和数据，确认加载成功后一起切换，失败保留原状态。弹窗固定 600px 高，内部滚动，展开规则不会改变外框。区块时间是该高度区块头时间距今多久，可悬停查看 UTC；这不是检测时间。

所有主显示统一为含基础 100% 的总持有权重；已挂单藏品显示“成交后”，明细保留较弱的成交前公式值参考，只在变化的特征中并列显示前后依据。100% 是基础权重，不是最小变化；特征档位相差 25 个百分点。未挂单藏品显示所选区块下的持有公式值。加成只在计算明细中标明。不显示单位权重成本、收益预测或价值评分；最低挂价列表只说明达到各权重档位的最低快照挂价。Activity 使用当前所选区块，**不是成交时的历史权重**。市场悬浮明细的气泡直接贴住触发的徽章，鼠标可从徽章直接移入；徽章旁的弯曲气泡尾指示来源，气泡会按可用空间自动切换方向。零挂单特征按官方补充规则处理：至少 20 件的特征 +100%，较小特征采用最近成交价格作为实现口径；缺少或冲突的成交依据显示理论区间。挂单收益为零，撤单后需等到下一个每周奖励边界恢复资格。

**强烈建议先查看源码，再自行编译安装。** 需要 Chrome 105 或更新版本；编译需要 Node.js 18+，以及 macOS/Linux 上的系统 `zip` 命令。在项目目录中运行：

```sh
npm test
npm run build
```

生成的扩展位于 `dist/chrome/`。

**想省事也可以直接下载 [release/ 中的安装包](release/README.md#中文说明)**，解压后使用，无需 Node.js 或自行编译。

两种方式均需在 Chrome 扩展管理页启用“开发者模式”，选择“加载已解压的扩展程序”：自行编译选择 `dist/chrome/`，下载安装包则选择包含 `manifest.json` 的解压文件夹。安装后请保留所加载的文件夹。更新时替换其中的文件，点击扩展卡片上的“重新加载”，再刷新市场网页；公开版扩展 ID 保持不变，本地设置和快照可以继续使用。卸载扩展会清除其浏览器本地数据。

安装包版本、内置快照区块、公开版扩展 ID 和维护说明均见[中文下载说明](release/README.md#中文说明)；[SHA-256 校验文件](release/SHA256SUMS)与英文说明使用同一份。内置快照不是当前链上最新高度，默认实时，市场、比较页或弹窗可见时每分钟检查；指定区块模式暂停自动检查。安装包不包含浏览器资料、钱包数据、凭据或开发工具。

维护者可运行 `npm run package:chrome` 重新生成安装包；`npm run release` 会同时更新安装包、双语说明和校验文件，并生成通过隐私检查的源码包，不会自动提交或发布。
