# Naka Sigil

**Find your Naka. Raise your weight.**

Know **how much SHNAKAS your Nakas earn each week**, see **after-sale weight directly on [Ord Dropz](https://ord-dropz.xyz/secondary/collections/shielded-nakas-mupv6wja)**, then compare the Nakas you like by ask price and trait changes.

> **Read-only by design.** Naka Sigil is an observer: it never connects to a wallet, never asks you to log in, approve or sign, and holds no keys. It reads public market data and the Shielded numbers you add yourself; your holdings list stays on your device. [Open source](https://github.com/ordinalser/naka-sigil), Unlicense.

- **My holdings:** your weekly SHNAKAS allocation as an exact figure, with wallet-style thumbnails in the popup and the extension page, and on both official holdings pages (collection Vault and `/wallet`). Add a whole page with one click, a single Naka from a market inspection or lookup, or several numbers at once (including other accounts). See how each purchase or delisting changes your allocation, and use **Raise my weight** to list the listings that lift it, each with a Buy link.
- **Browse:** weight badges on market listings, with a pointed inspection showing what changes after that listing sells.
- **Compare:** up to four Nakas at the same block, with BTC asks, after-sale totals, before-sale references and highlighted trait bonuses. Hover a thumbnail for a larger image.
- **Relay credits:** remaining prepaid uses on public listings, shown separately from weight; known zero stays visible.
- **Vault:** compact weights on individual Naka tiles and piece artwork in `/wallet`, with a shared block/mode strip. Owned listed-piece cards show **After delisting**; the wallet market keeps **After sale**. Collection totals, official reward screens and wallet setup/payment forms remain native.
- **Look up:** enter any Shielded number in the popup. Listed NFTs show after-sale weight; unlisted NFTs show their holding formula. Selected Nakas stay marked on the market.

English by default · 中文 available · no wallet connection, login, approval or signature · no API key required

## See it in action

Actual public-data screenshots from an isolated browser with no wallet connected; holdings shown are examples. The displayed block identifies each calculation; pictured asks are captured examples, not current quotes.

### On the market

![After-sale weight, changed traits and the effect on my holdings on Ord Dropz](docs/screenshots/market.png)

### Compare four Nakas

![Four Nakas with price, after-sale total and trait changes](docs/screenshots/compare.png)

<table><tr><th>Popup: Holdings tab (example holdings)</th><th>Complete number result</th></tr><tr><td><img src="docs/screenshots/popup.png" width="380" alt="Popup Holdings tab: weekly SHNAKAS in pixel digits, holding thumbnails and the bottom tab bar"></td><td><img src="docs/screenshots/lookup.png" width="380" alt="Number query with listing status and full calculation"></td></tr></table>

## Install

**Strongly recommended: review the source and build it yourself.** Requires Chrome 105+, Node.js 18+ and the system `zip` command on macOS/Linux.

```sh
npm test
npm run build
```

In **chrome://extensions**, enable **Developer mode**, choose **Load unpacked**, and select `dist/chrome/`. Pin Naka Sigil and open the collection page.

**Convenience option:** [download the ready ZIP](release/README.md), extract it into a permanent folder, then load the folder containing `manifest.json`. No Node.js is needed. The bilingual download guide includes version, bundled block and SHA-256.

Verify the downloaded package from its folder:

```sh
shasum -a 256 -c SHA256SUMS
```

Keep the loaded folder. To update, replace its contents, reload the extension and refresh market tabs. The fixed public extension ID is `bcihombccpheaimcgldamaggokpgpidl`; existing settings remain. Uninstalling removes local data.

## Use it

1. Browse a listing and hover its **After sale** badge. The pointer identifies the NFT; changed traits explain the new total.
2. Choose **＋ Compare** in an inspection or number result. Open Compare to see up to four independent sale scenarios at one block. Prices exclude fees.
3. Use **Live** for current browsing. A visible market, popup or Compare checks for updates at most once per minute. Compare follows the same mode and has no manual refresh control. Bitcoin block age and API check time are separate.
4. Use **Fixed block** for a specified height, for historical inspection. Its temporary dialog changes nothing on Cancel. A successful confirmed load switches mode/data together; failure retains the previous state. Fixed disables automatic updates and retains the selected height across all views. **At block** opens one dialog for a number and height; confirmation queries and switches all views to Fixed together. This inspection shows the actual formula and listing state at that block, rather than an after-sale scenario. You can then query other numbers at the same height. Returning from the result restores ordinary lookup; the chosen block mode remains explicit. Confirmed reward-week starts are shortcuts, newest reached first; upcoming starts are disabled and show remaining blocks and a header-based ETA. They are not weight snapshots. The dialog checks a separate reference chain height without changing the fixed calculation block.

The popup works like a wallet: a header with the version and the read-only promise, one view at a time, and a bottom bar with four tabs: Holdings, Block, Find & compare, About. **Holdings** (the default) opens with one status line (mode, block, age, reward start; it opens the Block tab), then your weekly SHNAKAS as the one gold figure and every holding as a tile with its number, weight and weekly SHNAKAS (0 while listed); ＋ Add opens a small number dialog (several numbers at once, comma-separated), a tile looks that Naka up, and **Raise my weight** opens the extension page with listings ranked by what they add, each with a **Buy ↗** link to its market page. **Find & compare** takes a Shielded number (the result opens as a full page with a back button and the complete ledger) and shows the comparison right in the popup: each selected Naka with its ask, after-sale weight and what it does for your holdings, plus empty slots that add a number. **Block** holds Live / Fixed block, the block card, what weight is worth at this block (100% and 400% per week, all units K, the pool and the per-unit rate) and the reward period (current week, last rewarded block, claim deadline). **About** explains the read-only design, the weekly arithmetic and the weight rules, with the source link and version. The extension page opens in a bundled tab: **no separate deployment is needed**.

The [portable demo](demo/naka-sigil-demo.html) uses the same engine and bundled historical data. Download the source and open it locally; it is not a live market. Public artwork falls back to the sigil offline.

## What the figures mean

Every primary percentage is **total holding-formula weight**, including base **100%**. **After sale** removes only that listing and recalculates the snapshot floors; other listings remain unchanged. Before/after values use the same units and block. A range's lower bound is used for minimum filters.

The official endpoint provides **block-specific formula previews**. The programme defines **1,008-block reward weeks** and start anchor **971,700** (first counted block **971,701**). Earlier posts mention quarterly re-reading; **no quarterly snapshot heights are confirmed**, so none are invented here. Listed pieces stop earning; previously completed held weeks remain claimable. Private claims pay the base 100%; revealing the piece enables its full weight. Fixed heights inspect history, not quarterly snapshots. A formula value is not an accrued reward balance. A current listing means no accrual at that block. A verified same-week public sale/cancellation can establish a waiting period; an unlisted flag alone never certifies weekly eligibility. The overview changes from launch distance to the current week/next boundary, then completed weeks and the claim-height limit. Activity shows the selected-block formula, **not historical sale-time weight**.

The shared engine applies trait thresholds, highest-only number bonuses and the 400% cap. Current rare zero-listed traits use same-block official trait units, validated against independent floors and every known piece total. When a sale or delisting changes such a trait, its bonus uses the **median of its three most recent sales** against the collection floor (two sales: their mean; one: that sale; none: +0%). The programme names three sales but publishes no aggregation; the median agrees with every official sales-sourced trait at blocks 971,546 and 971,547, while mean, minimum, latest-only and maximum each miss. Same-block sales whose order decides the window keep that trait's bounds. Missing/conflicting evidence produces a range or an unavailable result rather than invented certainty. Rules and their implementation limits are documented in the [rule audit](docs/RULES_AUDIT.md) and [reproducible examples](docs/REPRODUCIBILITY.md).

## Development and privacy

```sh
npm test                 # Calculation, synchronization and state checks
npm run release          # Build download, SHA-256, privacy scan and source ZIP
```

**Relay credits** are shown when the active listing API provides them, including known zero. They are remaining prepaid relay uses carried with the piece, not a weight bonus or a promise of fee-free transactions. Private sends can change an unlisted piece’s balance, so an old mint/listing count is never presented as its current balance. The native wallet already displays its owned-piece credits.

Snapshots, settings, up to four comparison IDs and your holdings list stay in browser-local storage. Lookup text is not saved or sent. Live/fixed loading uses the public collection API and block timestamps; Live also reads the public listing records (about 2.6 MB) once per new block for recent trait sales, as the official market page does. Optional artwork comes from Ordinals. There is no wallet access or telemetry. Public screenshots contain isolated public-market data only. See [privacy scope](docs/PRIVACY.md), [validation](docs/VALIDATION.md), [design](docs/DESIGN.md) and [adversarial audit](docs/ADVERSARIAL_AUDIT.md).

Community-built, unaffiliated with Shielded Nakas or Ord Dropz. [Unlicense](LICENSE).

## 中文说明

**找到你的 Naka，增加你的权重**

**清楚知道你的 Naka 每周能分到多少 SHNAKAS**，在 Ord Dropz 直接查看**成交后权重**，按挂价和属性变化比较你感兴趣的 Naka。

> **只读观察，天生安全。** Naka Sigil 只是观察者：从不连接钱包，不要求登录、授权或签名，不接触任何私钥。它只读取公开市场数据和你自己加入的 Shielded 编号，持仓清单只保存在本机。[开源代码](https://github.com/ordinalser/naka-sigil)，Unlicense 许可。

**我的持仓**以确定数字显示每周 SHNAKAS 分配：插件弹窗和独立页面用钱包式宫格小图展示，两种官方持仓页面（集合金库与 `/wallet`）也直接显示本页藏品每周能分到多少；可一键添加整页、在市场明细或查询结果中单枚添加，也可一次输入多个编号（含其他账号的持仓）；买入或撤单对分配的影响一目了然，“增加我的权重”列出能提升分配的挂单并可直接去购买。

市场徽章展示权重，悬浮明细指向对应 NFT 并突出变化；比较页最多四枚，同一区块并排查看挂价、成交后总权重、成交前参考及属性加成，缩略图可放大。弹窗可按任意 Shielded 编号查询：已挂单显示成交后权重，未挂单显示持有公式值。已选候选会在市场上标记。新钱包 `/wallet` 的独立藏品卡片和详情也显示权重：自己的已挂单藏品显示“撤单后”，钱包市场仍显示“成交后”；公开挂单的剩余中继额度单列展示，零与未知区分，不推断未挂单隐私余额。

上面的截图来自未连接钱包的隔离浏览器和公共市场数据，持仓均为示例：市场明细（含对我的持仓的影响）、四枚比较、弹窗持仓首页及完整查询结果；区块和挂价为截图时的数据，并非当前报价。默认英文，可切换中文；无需连接钱包或配置 API key。

### 安装与 SHA-256

**强烈建议先审查源码，再自行编译。** 需要 Chrome 105+、Node.js 18+ 和 macOS/Linux 的系统 `zip`。在项目目录运行 `npm test`、`npm run build`；打开 **chrome://extensions**，启用开发者模式，点击“加载已解压的扩展程序”，选择 `dist/chrome/`，固定插件后打开集合页面。

便捷方式：[下载现成 ZIP](release/README.md#中文说明)，解压到长期保留的目录，再加载包含 `manifest.json` 的文件夹；无需 Node.js。双语下载说明列出版本、内置区块和 SHA-256。在安装包目录运行 `shasum -a 256 -c SHA256SUMS` 校验。更新时替换文件、重新加载插件并刷新市场页。公开插件 ID 保持 `bcihombccpheaimcgldamaggokpgpidl`，设置保留；卸载会删除本地数据。

### 使用与数据含义

悬停市场“成交后”徽章查看明细，点击“＋ 加入比较”；弹窗编号结果也可加入。比较页内置插件，最多四枚独立成交情景，挂价不含费用，**无需单独部署**。弹窗采用钱包式结构：顶部显示版本和只读说明，中间一次只显示一个页面，底部四个功能栏：持仓、区块、查询·比较、说明。**持仓**（默认）顶部一行状态（模式、区块、时间、距奖励启动，点击进入区块页），下面是唯一的金色大数字——每周 SHNAKAS，以及带编号、权重、每周 SHNAKAS 的持仓方块（挂单中为 0）；“＋ 添加”弹出编号输入框（可一次输入多个编号，用英文逗号分隔），点方块查询该枚，“增加我的权重”打开插件独立页面，挂单已按增量排序，每枚都有“去购买 ↗”直达市场详情页。**查询·比较**输入编号查权重（结果以带“返回”的整页显示完整明细），比较直接在弹窗里显示：每枚的挂价、成交后权重和对持仓的影响，空位点一下即可输入编号加入。**区块**放实时／指定区块、区块卡、本区块分配（100% 与 400% 每周可分多少、全目录权重单位 K、奖池、每单位每块速率）和奖励周期（当前周、最后计奖区块、领取截止）。**说明**介绍只读设计、每周分配算法和权重规则，并附开源链接与版本。免安装演示共用引擎，使用历史内置数据，不是实时市场。

新安装默认**实时**，保留明确保存的旧设置。市场、弹窗或比较页可见时最多每分钟检查一次。比较页跟随同一模式，不设手动更新入口。区块头时间与接口检测时间分开。**指定区块**通过临时设置弹层输入，取消不改状态；加载成功后才一起切换模式与数据，失败保留原状态。指定模式禁止自动更新，所有页面保持所选高度。

所有主要百分比均为含基础 **100%** 的**总持有权重公式值**。“成交后”只移除对应挂单、重算地板，其他挂单不变；前后统一口径和区块。筛选区间使用下限。官方接口提供所选区块的公式预览。奖励周为 **1,008 个区块**，启动锚点 **971,700**、首个计奖区块 **971,701**。早期推文提过季度重读，但**季度快照高度尚未确认**，插件不推算或编造季度日程。挂单期间无新增奖励，此前完整持有周仍可领取；隐私领取为基础100%，展示藏品才领取全部权重。“查历史”可一次填写编号和区块，显示该区块实际公式及挂单状态，而不是成交后情景；确认后所有页面同步为指定模式，取消不改变当前状态。同一区块可连续查询编号；返回后恢复普通查询，区块模式仍明确保留。奖励周起点可快捷选择，已到达的按高度倒序，未来项禁用并显示剩余区块及预计时间；它们不是权重快照。弹层单独检查周界参考链高，不改变已固定的计算区块。公式值不是累计奖励。当前挂单说明本区块不累计；同周公开成交／撤单记录可证明等待期，单凭未挂单不能证明周资格。首页会随阶段显示距启动、当前周／下周边界，结束后显示已完成周数和领取上限。Activity 显示所选区块公式值，**不是历史成交时的权重**。

规则包含特征档位、仅最高编号加成及400%上限。小型零挂单特征使用同高度官方加成，并核对地板及全目录总权重。成交或撤单改变这类特征时，按**最近三笔成交价的中位数**对比集合地板（两笔取平均、一笔取该笔、无成交为 +0%）。链上规则只写明三笔成交、未公布聚合方式；中位数与 971,546、971,547 两个区块官方全部按成交计分的特征一致，平均数、最低价、仅最近一笔和最高价都有不符。同区块成交顺序会影响取值时保留该特征的范围。挂单 API 提供的中继额度作为预付中继次数显示，包括已知零；随藏品转移，不计入权重。未挂单余额可能因隐私发送改变，不使用旧挂单／铸造次数冒充当前余额；原生钱包已经显示自己的余额。缺失或冲突依据显示区间或无法计算。详见规则审计与复现文档。开发者可运行 `npm test` 和 `npm run release`，后者生成安装包、SHA-256、隐私检查和源码 ZIP，不自动发布。

快照、设置、最多四枚比较 ID 和持仓清单仅在本地保存，输入编号不保存或发送。实时模式每个新区块读取一次公开挂单记录（约 2.6 MB，与官方市场页相同），用于特征最近成交价。独立 `/wallet` 的单枚 Naka 卡片及详情大图也显示紧凑权重，列表旁标明区块与模式；集合汇总、官方奖励及钱包创建／恢复／支付界面保持原样。同步访问公共集合 API 和区块时间服务，图片可选访问 Ordinals；没有钱包访问和遥测。公开截图仅含隔离环境公共数据。社区项目，与 Shielded Nakas、Ord Dropz 无官方隶属关系，采用 Unlicense。

### Standalone workspace

My holdings and comparison on historical public data, using the same engine as the extension (example holdings).

![Standalone page: My holdings tiles with weekly SHNAKAS, then Compare](docs/screenshots/workspace.png)

## Local portfolio analysis

The popup shows the weekly figure in large pixel digits with thumbnails of your holdings; the extension page lists every holding as a tile with its weight and weekly SHNAKAS; the collection Vault and `/wallet` show what the Nakas on that page earn each week, with one button to add them (it adds only the ones not yet added). Thumbnails come from the same public art URLs the official site uses.

Add holdings wherever you see a Naka: **Add these Nakas to My holdings** on the collection Vault or `/wallet` page (the popup's first-run screen links to both; open Vault or Holdings there, then press the add button), **＋ My holdings** in a market inspection or popup lookup, or use **＋ Add** in the popup or **＋ Add a holding** on the extension page to type numbers (comma-separated) for pieces held in other accounts. The list is maintained by you, stored locally, and does not prove ownership.

**My holdings** shows your weekly SHNAKAS allocation at the selected block with the official endpoint's arithmetic: one unit earns v = floor(26,664,000,000,000 ÷ 1,008 ÷ K) base units per block, where K is the units of all 3,333 catalog pieces (100% = 4 units), and a week is 1,008 blocks (1 SHNAKAS = 10⁸ base units). Only holdings not listed at the block count. Example at block 971,553: K = 28,947, v = 913,821; a 150% Naka (6 units) earns 5,482,926 per block, 55.27 SHNAKAS a week, the official per-block figure exactly. Listed holdings earn nothing and are marked; each one offers its delisting analysis. For each purchase or delisting the same block appears everywhere (market inspection, item page, popup lookup, extension page hover): **this Naka** with its weight and weekly SHNAKAS, **your other holdings**, and the **total** before → after. Every holding is recalculated against the same remaining listings and collection floor, with its own 400% cap; a rising collection floor or a rare trait's new sale can lower other holdings, and all programme units are recalculated too.

**Raise my weight** (the extension page's Market listings, opened from the popup, and a market filter) shows only listings that raise your weekly SHNAKAS, lowest ask first; one click sorts by largest gain instead. Each card has **Buy ↗** to its market page. The figure is the official preview split at that block, not a payout promise: a new holding counts from the next reward week, and listing during a week, private claims (base 100%) and the pool actually distributed are not modelled.

The standalone [demo](demo/index.html) uses the same engine and displays historical block data, not live listings. It needs no extension or API key. Its holdings and selection stay in that page's own browser storage. Real use is the extension and its own page, which read the public API directly.

Current same-block official evidence produces exact formula values; after-sale and after-delisting scenarios are exact at the bundled block. A range remains only where public data cannot decide the input, such as several sales in one block. No confirmed quarterly snapshot heights are built in; manually selected heights are historical calculations, not certified quarterly settlements.

## 本机持仓分析

弹窗用像素大字显示每周分配并附持仓小图；独立页面把每枚持仓列成宫格，标出权重和每周 SHNAKAS；集合金库和 `/wallet` 页面显示本页藏品每周能分到多少，并提供一键添加（只添加尚未添加的部分）。缩略图来自官方网站使用的同一公开图片地址。

看到 Naka 的地方都能加入持仓：集合金库或 `/wallet` 钱包页的 **添加到我的持仓**（弹窗首次使用时有这两个页面的跳转按钮，打开后进入“金库”或“持仓”，再点添加按钮）、市场明细或弹窗查询中的 **＋ 我的持仓**，也可用弹窗的 **＋ 添加** 或独立页面的 **＋ 添加持仓** 输入其他账号持有的编号（多个用英文逗号分隔）。清单由你维护，只保存在本机，不验证所有权。

**我的持仓** 按官方接口的算法显示所选区块的每周 SHNAKAS 分配：每个权重单位每块得到 v = floor(26,664,000,000,000 ÷ 1,008 ÷ K) 个最小单位，K 为全目录 3,333 枚的权重单位合计（100% = 4 单位），一周 1,008 块（1 SHNAKAS = 10⁸ 最小单位），只计区块时未挂单的持仓。例：971,553 区块 K = 28,947、v = 913,821，150% 的 Naka（6 单位）每块 5,482,926，每周 55.27 SHNAKAS，与官方每块数字完全一致。已挂单持仓不获得奖励并单独标出，可直接查看撤单影响。每次购买或撤单在各处用同一种表达（市场明细、详情页、弹窗查询、独立页面悬停）：**这一枚**的权重与每周 SHNAKAS、**原有持仓**变化、**合计**变化前 → 变化后。每枚持仓都使用同一情景下剩余挂单与集合地板价重新计算，并分别应用 400% 上限；集合地板价上涨或稀有特征新增成交都可能降低其他持仓，全目录权重单位也同步重算。

**增加我的权重**（从弹窗打开独立页面的“市场挂单”，也可作为市场筛选）只显示能增加你每周 SHNAKAS 的挂单，默认挂价从低到高，一键可改为“增加最多”；每张卡都有“去购买 ↗”。该数字是所选区块的官方预览分配口径，不是发放承诺：新持仓从下一奖励周起计；周内挂单、隐私领取（只领基础 100%）以及实际发放的奖池未计入。

独立[演示页](demo/index.html)共用计算引擎，使用历史区块数据，非实时挂单，无需安装插件或配置 API key。其中的持仓和选择只保存在该页面自己的浏览器存储里。实际使用以插件和插件打开的独立页面为准，它们直接读取公开接口。

同区块官方依据充分时，公式权重显示确定数值；内置区块的成交后和撤单后情景全部为确定值。只有公开数据无法确定输入时（例如同一区块多笔成交）才保留范围。目前未内置未经确认的季度快照高度；手动选择高度用于历史复算，不代表已认证的季度结算。
