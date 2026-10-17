# Privacy and public release scope

The public release is **Naka Sigil** (`naka-sigil`). It is assembled from an explicit file allowlist, separately from the surrounding development workspace.

## Included

- Extension runtime source and generated original sigil icons.
- Public snapshot: collection ID/name, block heights, creation time, public block header hash/timestamp, aggregate listing counts/floors, trait definitions, public inscription-to-trait mappings (plus the traits of the few numbers not yet minted), `[inscription ID, price in sats]` listing pairs with each listing's opening height, active-listing `[inscription ID, relay credits]` pairs, the newest sale prices and heights of traits held by fewer than 20 pieces (three, plus same-block ties), optional latest public `[inscription ID, sale/cancellation height, kind, listing height]` exit records, and same-height `[trait index, bonus, source, canonical supply]` official reward-basis rows. A Live snapshot also marks listings already closing as `[inscription ID, sale | cancel]`. No seller scripts, return keys, owner addresses or complete raw protocol events are retained.
- Build, snapshot, icon and download-packaging scripts; unit tests; documentation and license. Eight reviewed documentation screenshots come from an isolated browser profile with example holdings chosen from public numbers (#6, #314, #888, #1500, #2700; added numbers #379, #640, #1200) and public listings, without accounts, wallets, addresses or local browser chrome. The portable demo starts with the same example holdings and nothing else.
- The current ready-to-use Chrome ZIP in `release/`, its generated install guide and SHA-256 checksum. Its runtime is byte-identical to the audited build.
- A public-only Chrome manifest key with the public distribution’s existing ID. It grants no access to a private key or account.

## Excluded

- Surrounding repositories and their history/remotes/authors.
- Browser profiles, wallets, addresses belonging to the developer, notes, telemetry and local storage exports.
- Environment files, tokens, private signing keys, cookies, local automation credentials and browser-path configuration.
- Private browser automation integrations, private screenshots, logs, OS metadata, `node_modules`, old distribution archives and temporary files.

Public inscription IDs are collection identifiers, not a list of the developer’s holdings. The snapshot contains no owner addresses, seller addresses, credentials or wallet secrets. Standalone collection artwork files are not bundled; the reviewed documentation screenshots include public artwork.

## Runtime permissions and network

`storage` keeps snapshots, settings, up to four comparison inscription IDs and the local holdings data below. Clear removes the comparison list. Live status stores a check time, indexer epoch and generic status. Number lookup text is not persisted. `alarms` wakes the worker once a minute; a check reads the network only if the popup, the extension page or an `ord-dropz.xyz` page sent a visibility heartbeat in the last 100 seconds, at most once a minute, with backoff after failures. Background API host permissions are `shielded-api.ord-dropz.xyz` for public collection and reward data and `blockstream.info` for block header time. Content scripts match only `ord-dropz.xyz`. Blockstream requests contain only a block height; no NFT lookup, wallet address or ownership data is transmitted. The bundled timestamp works offline. Time requests occur during historical lookups or Live updates. When Live sees a new block it reads the public listing records (`/state`, about 2.6 MB, no notes), as the official market page does on each block; from them it keeps the sale prices and heights of traits under 20 pieces, each piece's latest public exit, each active listing's opening height and the records of your own holdings (below). Within a block each check re-reads only `/listings` (a few KB) for the purchases and reclaims sent since, kept as `liveClosing` (the block height and `[inscription ID, sale | cancel]` rows); the request carries nothing about you. The number itself is not sent; queries and comparison calculations add no API call. Compare has no manual refresh message handler.

The popup, the extension page and the standalone demo load NFT thumbnails from the public art endpoint the official site uses (`shielded-api.ord-dropz.xyz/api/shielded/art/<asset>`), then from `ordinals.com/content/<inscription ID>` if that fails, with no referrer; each request carries that piece's number or inscription ID and ordinary request metadata. A pixel sigil is drawn when both fail. The demo makes no collection API requests or uploads and does not use extension storage.

Two links lead to the Naka community group on Telegram (`t.me`): the popup's About and, in Own a trait, the one beside **Copy wanted post**. They open only when clicked, in a new tab, with no referrer; the extension sends nothing there, and a wanted post is pasted by you. Telegram's own privacy terms apply to the group.

There are no analytics or telemetry endpoints. Network traffic happens while the popup, the extension page or an `ord-dropz.xyz` page is visible, or for an explicit historical lookup. Ordinary HTTP request metadata, including IP address, is visible to the public API operator. The extension cannot control that operator’s retention policy.

## Release checks

Run `npm run privacy` before packaging or publication. The checker rejects unexpected files, symlinks, local paths, credential patterns, private extension identity, and suspicious snapshot fields. It also checks the built runtime and ready-to-use download, requires the current version/block filename, verifies the checksum and generated guide, and rejects ZIP comments, extra fields, trailing bytes and embedded gaps that could carry private metadata. The build omits ZIP extra fields, including local UID/GID information. It never prints matched secret values.

A static scan can verify the release’s known file types and patterns; it cannot prove the absence of every possible hidden encoding or future personal edit. `npm run package:chrome` rebuilds the public download and runs these checks. `npm run release` also creates the allowlisted source ZIP, including the ready-to-use download. Only the current generated install package is retained in `release/`; `dist/` remains ignored by Git. Regenerate release archives only from this directory and repeat the scan after changes. No GitHub submission is performed by these scripts.

## Standalone wallet DOM annotations

On `/wallet`, content scripts match already-rendered individual artwork against the public snapshot's inscription IDs, entirely locally. They do not enumerate wallet providers, access page local/session storage, read backup words/PINs/addresses, call wallet endpoints or connect/sign/submit transactions. Wallet collection summaries, official reward rows, arriving placeholders and setup/payment screens are excluded. No private wallet screenshot or automation fixture is bundled in this repository.

Current reward-basis requests contain no selected NFT numbers, ownership data or lookup text; the public endpoint returns the whole collection. Only whitelisted numeric/trait-source fields are persisted. Raw programme responses, owner records, seller scripts, encrypted notes and wallet screenshots are never bundled. Active-listing credits are public output data; no attempt is made to reconstruct a private unlisted balance.


Owner-context detection uses the presence of a native owned-card valuation-caption element or the owned-piece sheet, without reading its text or title value. No ownership map is saved or sent. The calculation merely removes a known public ask; it never cancels a listing, signs or submits a wallet operation. Synthetic owner-view tests and real public-trade replay records stay in the private local review folder.

Historical lookup numbers remain local and are not sent to the API or saved as a search history. Only the requested height is sent to the existing public historical generator. Public listing records do not contain owners, seller scripts, private note bodies or holding identities. On this device, together with the block each holding was anchored at, they tell which run of a piece is yours, the week it starts and whether it sold; nothing about this is sent anywhere. Live reads the public listing records once per new block; the request carries no NFT number, holding or lookup text.

Opening the block dialog explicitly requests a public boundary reference height and block-header time, cached in worker memory for one minute and restricted to the extension popup. This does not load a new weight snapshot, change the Live data, persist a lookup number or add a background poll. Failed clock requests preserve the selected data; absent/overdue estimates are shown as unavailable.

### Local holdings / 本机持仓

Only explicitly added public inscription IDs are stored in `nakaPortfolio`. Adding visible Vault cards, a market inspection's or popup lookup's **＋ My holdings** are user actions; weekly allocation and **Raise my weight** rankings are computed locally from the selected snapshot and send no holding to any server; the extension does not read wallet labels, balances, secret storage, or hidden holdings. The standalone demo has separate local storage. There is no export or import of holdings. No external website bridge, analytics, remote upload, or new host permission is added.

仅保存用户主动加入的公开铭文 ID。金库一键加入、市场明细或弹窗查询的“＋ 我的持仓”都是用户主动操作；每周分配与“增加我的权重”排序都在本机按所选快照计算，不向任何服务器发送持仓。一键加入只读取当前已显示且能核实身份的藏品，不读取钱包名称、余额、秘密存储或隐藏持仓。演示页使用独立的本地存储。没有持仓导出或导入功能。没有新增网站桥接、统计、上传或主机权限。

### Read-only by design / 只读观察

The extension never connects to a wallet, never asks for login, approval or a signature, and holds no keys. On the collection Vault and `/wallet` it only reads artwork identities already rendered on the page; the weekly figure shown there is computed locally from the selected snapshot. Holding thumbnails in the popup and the extension page load the public art URL for each piece (`/api/shielded/art/<asset>`, then Ordinals), the same images the official site shows; such a request contains the piece number but no wallet address, holding list or lookup text, and ordinary request metadata such as the IP address is visible to that server.

插件从不连接钱包，不要求登录、授权或签名，也不持有任何私钥。在集合金库和 `/wallet` 页面只读取页面上已显示的藏品图片身份，页面上的每周数字在本机按所选快照计算。弹窗和独立页面的持仓缩略图按藏品编号加载公开图片地址（`/api/shielded/art/<资产号>`，失败时用 Ordinals），与官方网站显示的是同一图片；请求只含藏品编号，不含钱包地址、持仓清单或查询内容，IP 等普通请求信息对该服务器可见。

### Reward accrual and explicit eligibility readings

`nakaRewardWeek` is a compact public weekly accumulator, and `nakaRewardStatus` says whether it is loading, read or failed, with the block. `nakaOfficialReadings` is private local user data: an explicit click on the official staking page imports only the shown inscription IDs, earning state, reward week, and displayed progress height. No vault address, label, balance, private note, claim amount or wallet storage is read. It is not included in source, demos, screenshots or installation archives. Historical inspections are ephemeral worker-memory results and never overwrite the user's Live source or NFT lists; session storage keeps only their progress (`nakaHistoryProgress`: stage and counts, no number). Updates never delete user holdings or comparison selections to fix an API cache.

`nakaRewardWeek` 保存公开周累计向量，`nakaRewardStatus` 记录它正在读取、已读取还是失败，以及对应区块；`nakaOfficialReadings` 为私人本机数据，只有用户主动点击时才导入官方页面已显示的铭文 ID、奖励状态、奖励周与进度高度。不读取保险库地址、名称、余额、私人持有记录、领取金额或钱包存储，不进入源码、演示、截图或安装包。历史查询结果只在后台内存临时复用，不覆盖实时来源或 NFT 清单；会话存储只保存它的进度（`nakaHistoryProgress`：阶段和计数，不含编号）。API 缓存修复不会删除用户持仓和比较。


## Holdings history, planner and team (local only)

Local keys, never uploaded: `nakaHoldingsMeta` (for each holding, the first block read after it was added and the listing open then, whether it was added from your own Vault or Wallet page, and weeks the official wallet showed it waiting), `nakaHoldingEvents` (public listing records of your holdings and of pieces that left: asset, listing block, close block and kind), `nakaLeft` (pieces that left your vault, each run with the weeks it kept), `nakaLeftSeen` (this week's sales the popup's line named and you opened or dismissed, as inscription ID and sale block), `nakaBuild` (the extension version that last ran its upgrade step; nothing of yours), `nakaReopen` (which page to open again after a reload you asked for on the Finish the update card; read once and removed), `nakaRewardWeeks` (official tables of finished weeks) and `nakaTeam` (numbers added beside your holdings, a teammate's or any, in one list; used only by Raise weight: Reach 400% and Own a trait on the extension page, and the popup's Raise weight tab that summarises them). **Copy all numbers** (My holdings) and **Copy numbers** (a wanted list in Own a trait) put plain numbers on your clipboard only when you press them (the wanted list as “Want to buy …”); nothing is sent. The Telegram link beside it opens the Naka group only when clicked. Session storage, cleared when the browser closes, keeps `visibleAt` (when a page of Naka Sigil or Ord Dropz was last visible, since checks run only then) and `nakaRecords`: the newest public listing records, so a holding added between blocks gets its records without a new download. The only added network request is one `/rewards/weights/{week}` read per finished week, the same public endpoint already read for the current week; it carries no NFT number. The planner computes from the snapshot already on the device. A team is a list the user types in; nothing is shared by the extension, and it cannot verify who holds which numbers. A static public site is not used to store team data: it cannot accept writes without a token and would publish the numbers.

本地键（从不上传）：`nakaHoldingsMeta`（每枚持仓加入后读到的第一个区块及当时开着的挂单、是否从自己的金库或钱包页加入、官方钱包显示它等待的周）、`nakaHoldingEvents`（只含我的持仓和已离手藏品的公开挂单记录：资产号、挂单区块、关闭区块和类型）、`nakaLeft`（离开金库的 Naka，每段持有及其保留的周）、`nakaLeftSeen`（弹窗“本周卖出”那一行里你已点开或关掉的成交：铭文 ID 和成交区块）、`nakaBuild`（最近一次执行升级步骤的插件版本，不含你的任何数据）、`nakaReopen`（你在“完成更新”卡片上点重新加载后，要重新打开哪个页面；读取一次即删除）、`nakaRewardWeeks`（已结束周的官方累计表）、`nakaTeam`（在持仓之外添加的编号清单，队友的或任意的；只在增加权重里使用：独立页的冲 400% 和垄断特征，以及弹窗里汇总它们的“增加权重”分页）。“复制全部编号”（我的持仓）和垄断特征的“复制编号”（求购清单）只在你点击时把纯数字编号放进剪贴板（求购清单为“求购 …”），不发送任何内容。旁边的 Telegram 链接只在你点击时打开 Naka 群，插件不向那里发送任何内容。会话存储（关闭浏览器即清空）保存 `visibleAt`（最近一次有本插件页面或 Ord Dropz 页面可见的时间，只在那时检查新区块）和 `nakaRecords`：最新一批公开挂单记录，使两个区块之间加入的持仓不用重新下载就能拿到记录。唯一新增的网络请求是每个已结束的周读一次 `/rewards/weights/{week}`，与当前周用的是同一个公开接口，不带任何 NFT 编号。计算器只用本机已有的快照计算。队伍是用户自己填写的名单，插件不分享任何内容，也无法验证谁持有哪些编号。组队数据不放公开网站：静态网站没有令牌无法写入，而且会公开编号。

### Finding a Naka on the market / 在市场上定位一枚

Every link to a particular Naka opens the collection page with `#naka-find=<number>`. For a listed Naka the content script scrolls the page from the top to its card, which the page loads as it would for any visitor scrolling, and draws the card effect in its own overlay; for one not for sale it types the number into the page's own search box, which then runs exactly as when you type it yourself. The hash is removed once read. Nothing is stored and the extension sends no request of its own.

所有指向某一枚 Naka 的链接都打开带 `#naka-find=<编号>` 的集合页。挂单中的 Naka，内容脚本把页面从顶部滑到那张卡片（页面像普通访客往下滑一样加载卡片），在自己的覆盖层里画卡牌特效；未挂单的把编号填进页面自己的搜索框，之后的搜索和你手动输入完全一样。读取后地址里的 hash 会被去掉。不保存任何内容，插件自己不发请求。
