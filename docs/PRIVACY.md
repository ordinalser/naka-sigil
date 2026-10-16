# Privacy and public release scope

The public release is **Naka Sigil** (`naka-sigil`). It is assembled from an explicit file allowlist, separately from the surrounding development workspace.

## Included

- Extension runtime source and generated original sigil icons.
- Public snapshot: collection ID/name, block heights, creation time, public block header hash/timestamp, aggregate listing counts/floors, trait definitions, public inscription-to-trait mappings and `[inscription ID, price in sats]` listing pairs, plus optional numeric history summaries, active-listing `[inscription ID, relay credits]` pairs, optional latest public `[inscription ID, sale/cancellation height, kind]` exit records, and same-height `[trait index, bonus, source, canonical supply]` official reward-basis rows. No seller scripts, return keys, owner addresses or complete raw protocol events are retained.
- Build, snapshot, icon and download-packaging scripts; unit tests; documentation and license. Four reviewed documentation screenshots show only public listings in an isolated browser, without accounts, wallets, addresses or local browser chrome.
- The current ready-to-use Chrome ZIP in `release/`, its generated install guide and SHA-256 checksum. Its runtime is byte-identical to the audited build.
- A public-only Chrome manifest key with the public distribution’s existing ID. It grants no access to a private key or account.

## Excluded

- Surrounding repositories and their history/remotes/authors.
- Browser profiles, wallets, addresses belonging to the developer, notes, telemetry and local storage exports.
- Environment files, tokens, private signing keys, cookies, local automation credentials and browser-path configuration.
- Private browser automation integrations, private screenshots, logs, OS metadata, `node_modules`, old distribution archives and temporary files.

Public inscription IDs are collection identifiers, not a list of the developer’s holdings. The snapshot contains no owner addresses, seller addresses, credentials or wallet secrets. Standalone collection artwork files are not bundled; the reviewed documentation screenshots include public artwork.

## Runtime permissions and network

`storage` stores snapshots/settings and up to four comparison inscription IDs locally. Clear removes the comparison list. Live status stores a check time, indexer epoch and generic status. Number lookup text is not persisted. `alarms` schedules minute checks in Live mode (the new-install default); Fixed mode clears the alarm. Saved explicit modes are preserved. Background API host permissions are `shielded-api.ord-dropz.xyz` for public collection and reward-basis data and `blockstream.info` for block header time. Content scripts match only `ord-dropz.xyz`. Blockstream requests contain only a block height; no NFT lookup, wallet address or ownership data is transmitted. The bundled timestamp works offline. Time requests occur during fixed-height loads or Live updates. When Live sees a new block it also reads the public listing records (`/state`, about 2.6 MB, no notes), as the official market page does on each block, and keeps only each trait's three newest sale prices and heights. A visible popup, Compare or market can trigger a Live check by default. The number itself is not sent; queries and comparison calculations add no API call. Fixed mode pauses automatic requests. Compare has no manual refresh message handler.

The comparison workspace and standalone demo optionally request NFT thumbnails from `ordinals.com/content/` with no referrer; inscription IDs and ordinary request metadata reach that public host. An offline pixel fallback is supplied. The demo makes no collection API requests or uploads and does not use extension storage.

There are no analytics or telemetry endpoints. Network traffic happens after an explicit fixed-height load or while Live mode has a visible market, Compare or popup. New installs use Live by default; choose Fixed to pause automatic checks. Ordinary HTTP request metadata, including IP address, is visible to the public API operator. The extension cannot control that operator’s retention policy.

## Release checks

Run `npm run privacy` before packaging or publication. The checker rejects unexpected files, symlinks, local paths, credential patterns, private extension identity, and suspicious snapshot fields. It also checks the built runtime and ready-to-use download, requires the current version/block filename, verifies the checksum and generated guide, and rejects ZIP comments, extra fields, trailing bytes and embedded gaps that could carry private metadata. The build omits ZIP extra fields, including local UID/GID information. It never prints matched secret values.

A static scan can verify the release’s known file types and patterns; it cannot prove the absence of every possible hidden encoding or future personal edit. `npm run package:chrome` rebuilds the public download and runs these checks. `npm run release` also creates the allowlisted source ZIP, including the ready-to-use download. Only the current generated install package is retained in `release/`; `dist/` remains ignored by Git. Regenerate release archives only from this directory and repeat the scan after changes. No GitHub submission is performed by these scripts.

## Standalone wallet DOM annotations

On `/wallet`, content scripts match already-rendered individual artwork against the public snapshot's inscription IDs, entirely locally. They do not enumerate wallet providers, access page local/session storage, read backup words/PINs/addresses, call wallet endpoints or connect/sign/submit transactions. Wallet collection summaries, official reward rows, arriving placeholders and setup/payment screens are excluded. No private wallet screenshot or automation fixture is bundled in this repository.

Current reward-basis requests contain no selected NFT numbers, ownership data or lookup text; the public endpoint returns the whole collection. Only whitelisted numeric/trait-source fields are persisted. Raw programme responses, owner records, seller scripts, encrypted notes and wallet screenshots are never bundled. Active-listing credits are public output data; no attempt is made to reconstruct a private unlisted balance.


Owner-context detection uses the presence of a native owned-card valuation-caption element or the owned-piece sheet, without reading its text or title value. No ownership map is saved or sent. The calculation merely removes a known public ask; it never cancels a listing, signs or submits a wallet operation. Synthetic owner-view tests and real public-trade replay records stay in the private local review folder.

Historical lookup numbers remain local and are not sent to the API or saved as a search history. Only the requested height is sent to the existing public historical generator. Public exit records do not contain owners, seller scripts, private note bodies or holding identities; they establish negative waiting evidence only. Live reads the public listing records once per new block for recent trait sales; the request carries no NFT number, holding or lookup text.

Opening the block dialog explicitly requests a public boundary reference height and block-header time, cached in worker memory for one minute and restricted to the extension popup. This does not load a new weight snapshot, change Live/Fixed mode, persist a lookup number or add a background poll. Failed clock requests preserve the selected data; absent/overdue estimates are shown as unavailable.

### Local holdings / 本机持仓

Only explicitly added public inscription IDs are stored in `nakaPortfolio`. Adding visible Vault cards, a market inspection's or popup lookup's **＋ My holdings** are user actions; weekly allocation and **Raise my weight** rankings are computed locally from the selected snapshot and send no holding to any server; the extension does not read wallet labels, balances, secret storage, or hidden holdings. The standalone demo has separate local storage. There is no export or import of holdings. No external website bridge, analytics, remote upload, or new host permission is added.

仅保存用户主动加入的公开铭文 ID。金库一键加入、市场明细或弹窗查询的“＋ 我的持仓”都是用户主动操作；每周分配与“增加我的权重”排序都在本机按所选快照计算，不向任何服务器发送持仓。一键加入只读取当前已显示且能核实身份的藏品，不读取钱包名称、余额、秘密存储或隐藏持仓。演示页使用独立的本地存储。没有持仓导出或导入功能。没有新增网站桥接、统计、上传或主机权限。

### Read-only by design / 只读观察

The extension never connects to a wallet, never asks for login, approval or a signature, and holds no keys. On the collection Vault and `/wallet` it only reads artwork identities already rendered on the page; the weekly figure shown there is computed locally from the selected snapshot. Holding thumbnails in the popup and the extension page load the public art URL for each piece (`/api/shielded/art/<asset>`, then Ordinals), the same images the official site shows; such a request contains the piece number but no wallet address, holding list or lookup text, and ordinary request metadata such as the IP address is visible to that server.

插件从不连接钱包，不要求登录、授权或签名，也不持有任何私钥。在集合金库和 `/wallet` 页面只读取页面上已显示的藏品图片身份，页面上的每周数字在本机按所选快照计算。弹窗和独立页面的持仓缩略图按藏品编号加载公开图片地址（`/api/shielded/art/<资产号>`，失败时用 Ordinals），与官方网站显示的是同一图片；请求只含藏品编号，不含钱包地址、持仓清单或查询内容，IP 等普通请求信息对该服务器可见。

### Reward accrual and explicit eligibility readings

`nakaRewardWeek` is a compact public weekly accumulator. `nakaOfficialReadings` is private local user data: an explicit click on the official staking page imports only the shown inscription IDs, earning state, reward week, and displayed progress height. No vault address, label, balance, private note, claim amount or wallet storage is read. It is not included in source, demos, screenshots or installation archives. Historical inspections are ephemeral worker-memory results and never overwrite the user's Live source or NFT lists. Updates never delete user holdings or comparison selections to fix an API cache.

`nakaRewardWeek` 保存公开周累计向量；`nakaOfficialReadings` 为私人本机数据，只有用户主动点击时才导入官方页面已显示的铭文 ID、计奖状态、奖励周与进度高度。不读取保险库地址、名称、余额、私人持有记录、领取金额或钱包存储，不进入源码、演示、截图或安装包。历史查询结果只在后台内存临时复用，不覆盖实时来源或 NFT 清单。API 缓存修复不会删除用户持仓和比较。
