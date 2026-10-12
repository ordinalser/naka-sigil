# Naka Sigil

**Find your Naka**

See **after-sale weight directly on [Ord Dropz](https://ord-dropz.xyz/secondary/collections/shielded-nakas-mupv6wja)**, then compare the Nakas you like by ask price and trait changes.

- **Browse:** weight badges on market listings, with a pointed inspection showing what changes after that listing sells.
- **Compare:** up to four Nakas at the same block, with BTC asks, after-sale totals, before-sale references and highlighted trait bonuses. Hover a thumbnail for a larger image.
- **Look up:** enter any Shielded number in the popup. Listed NFTs show after-sale weight; unlisted NFTs show their holding formula. Selected Nakas stay marked on the market.

English by default · 中文 available · no wallet connection · no API key required

## See it in action

Actual public-data screenshots. The displayed block identifies each calculation; pictured asks are captured examples, not current quotes.

### On the market

![After-sale weight and changed traits on Ord Dropz](docs/screenshots/market.png)

### Compare four Nakas

![Four Nakas with price, after-sale total and trait changes](docs/screenshots/compare.png)

<table><tr><th>Block overview and lookup</th><th>Complete number result</th></tr><tr><td><img src="docs/screenshots/popup.png" width="380" alt="Popup block overview and comparison selection"></td><td><img src="docs/screenshots/lookup.png" width="380" alt="Number query with listing status and full calculation"></td></tr></table>

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
4. Use **Fixed block** for a specified height, such as an official quarterly snapshot. Its temporary dialog changes nothing on Cancel. A successful confirmed load switches mode/data together; failure retains the previous state. Fixed disables automatic updates and retains the selected height across all views.

The popup places block context above number lookup, followed by a compact Compare entry with your selected numbers. It avoids a second price-ranking table. Lookup uses a quiet return/language bar, a mode badge beside its block, a complete ledger and a comparison action directly below the result. Change block mode from Overview; the calculation stays on one screen without expanders. The comparison opens in a bundled extension tab: **no separate deployment is needed**.

The [portable demo](demo/naka-sigil-demo.html) uses the same engine and bundled historical data. Download the source and open it locally; it is not a live market. Public artwork falls back to the sigil offline.

## What the figures mean

Every primary percentage is **total holding-formula weight**, including base **100%**. **After sale** removes only that listing and recalculates the snapshot floors; other listings remain unchanged. Before/after values use the same units and block. A range's lower bound is used for minimum filters.

Quarterly weights use the **official quarterly snapshot block**. Entering a height, reaching a date or passing rewards-start block **971,700** does not certify a quarterly snapshot or eligibility. Listed NFTs earn no rewards while listed. A formula value is not a payout prediction. Activity shows the selected-block formula, **not historical sale-time weight**.

The shared engine applies trait thresholds, highest-only number bonuses and the 400% cap, including the published zero-listing supplement. Missing/conflicting evidence produces a range or an unavailable result rather than invented certainty. Rules and their implementation limits are documented in the [rule audit](docs/RULES_AUDIT.md) and [reproducible examples](docs/REPRODUCIBILITY.md).

## Development and privacy

```sh
npm test                 # Calculation, synchronization and state checks
npm run release          # Build download, SHA-256, privacy scan and source ZIP
```

Snapshots, settings and up to four comparison IDs stay in browser-local storage. Lookup text is not saved or sent. Live/fixed loading uses the public collection API and block timestamps; optional artwork comes from Ordinals. There is no wallet access or telemetry. Public screenshots contain isolated public-market data only. See [privacy scope](docs/PRIVACY.md), [validation](docs/VALIDATION.md), [design](docs/DESIGN.md) and [adversarial audit](docs/ADVERSARIAL_AUDIT.md).

Community-built, unaffiliated with Shielded Nakas or Ord Dropz. [Unlicense](LICENSE).

## 中文说明

**找到你的 Naka**

在 Ord Dropz 直接查看**成交后权重**，按挂价和属性变化比较你感兴趣的 Naka。市场徽章展示权重，悬浮明细指向对应 NFT 并突出变化；比较页最多四枚，同一区块并排查看挂价、成交后总权重、成交前参考及属性加成，缩略图可放大。弹窗可按任意 Shielded 编号查询：已挂单显示成交后权重，未挂单显示持有公式值。已选候选会在市场上标记。

上面的四张截图来自隔离浏览器中的公共市场数据，展示市场明细、四枚比较、弹窗首页及完整查询结果；区块和挂价为截图时的数据，并非当前报价。默认英文，可切换中文；无需连接钱包或配置 API key。

### 安装与 SHA-256

**强烈建议先审查源码，再自行编译。** 需要 Chrome 105+、Node.js 18+ 和 macOS/Linux 的系统 `zip`。在项目目录运行 `npm test`、`npm run build`；打开 **chrome://extensions**，启用开发者模式，点击“加载已解压的扩展程序”，选择 `dist/chrome/`，固定插件后打开集合页面。

便捷方式：[下载现成 ZIP](release/README.md#中文说明)，解压到长期保留的目录，再加载包含 `manifest.json` 的文件夹；无需 Node.js。双语下载说明列出版本、内置区块和 SHA-256。在安装包目录运行 `shasum -a 256 -c SHA256SUMS` 校验。更新时替换文件、重新加载插件并刷新市场页。公开插件 ID 保持 `bcihombccpheaimcgldamaggokpgpidl`，设置保留；卸载会删除本地数据。

### 使用与数据含义

悬停市场“成交后”徽章查看明细，点击“＋ 加入比较”；弹窗编号结果也可加入。比较页内置插件，最多四枚独立成交情景，挂价不含费用，**无需单独部署**。首页区块在上、编号查询在下；简洁比较入口展示已选编号，避免重复价格排名列表。查询页顶部只放返回和语言；模式与区块并列显示，完整明细下方直接加入比较。区块模式在概览中设置，查询无需展开。免安装演示共用引擎，使用历史内置数据，不是实时市场。

新安装默认**实时**，保留明确保存的旧设置。市场、弹窗或比较页可见时最多每分钟检查一次。比较页跟随同一模式，不设手动更新入口。区块头时间与接口检测时间分开。**指定区块**通过临时设置弹层输入，取消不改状态；加载成功后才一起切换模式与数据，失败保留原状态。指定模式禁止自动更新，所有页面保持所选高度。

所有主要百分比均为含基础 **100%** 的**总持有权重公式值**。“成交后”只移除对应挂单、重算地板，其他挂单不变；前后统一口径和区块。筛选区间使用下限。季度权重取官方季度快照区块，输入高度、跨过日期或奖励启动 **971,700** 不代表自动确认季度快照或资格。挂单期间无奖励；公式值不是收益预测。Activity 显示所选区块公式值，**不是历史成交时的权重**。

规则包含特征档位、仅最高编号加成、400% 上限及零挂单补充；缺失或冲突依据显示区间或无法计算。详见规则审计与复现文档。开发者可运行 `npm test` 和 `npm run release`，后者生成安装包、SHA-256、隐私检查和源码 ZIP，不自动发布。

快照、设置与最多四枚比较 ID 仅在本地保存，输入编号不保存或发送。同步访问公共集合 API 和区块时间服务，图片可选访问 Ordinals；没有钱包访问和遥测。公开截图仅含隔离环境公共数据。社区项目，与 Shielded Nakas、Ord Dropz 无官方隶属关系，采用 Unlicense。
