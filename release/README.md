# Download Naka Sigil

[English](#install) · [中文](#中文说明)

[**Download Naka Sigil v0.10.6 for Chrome**](./naka-sigil-chrome-v0.10.6-h971025.zip)

No Node.js or compilation required. Requires Chrome 105 or later.

## Install

1. Download the ZIP above. On GitHub, use the file's download button if its file page opens.
2. Extract it into a permanent folder.
3. Open **chrome://extensions** and enable **Developer mode**.
4. Click **Load unpacked** and select the extracted folder containing **manifest.json**.
5. Pin Naka Sigil in the toolbar, then open the Shielded Nakas market or query a Shielded number in the popup.

The ZIP is loaded after extraction; do not drag the ZIP onto the extensions page. Keep the extracted folder in place while the extension is installed.

## Update

Replace the files in your existing extension folder with the new extracted files, click **Reload** on chrome://extensions, then reload open market tabs. The public extension ID stays the same, preserving browser-local settings and snapshots.

## Package details

- Version: **0.10.6**
- Bundled snapshot: **block 971,025**, not the current chain tip. Live mode is the default while the market, Compare or popup is visible. Fixed block mode pauses automatic updates; enter the official quarterly snapshot height. Saved explicit modes are preserved.
- SHA-256 checksum: [SHA256SUMS](./SHA256SUMS)
- Public extension ID: **bcihombccpheaimcgldamaggokpgpidl**

The download is generated from this project's runtime. It contains no browser profile, wallet data, credentials or development tools. This directory contains only the current version; do not edit generated files by hand. Maintainers regenerate it with **npm run package:chrome** or **npm run release**.

## 中文说明

[**下载适用于 Chrome 的 Naka Sigil v0.10.6**](./naka-sigil-chrome-v0.10.6-h971025.zip)

无需 Node.js 或自行编译。需要 Chrome 105 或更新版本。

### 安装

1. 下载上方 ZIP；如果在 GitHub 上打开了文件页面，请点击该文件的下载按钮。
2. 将 ZIP 解压到准备长期保留的文件夹。
3. 打开 **chrome://extensions**，启用“**开发者模式**”。
4. 点击“**加载已解压的扩展程序**”，选择包含 **manifest.json** 的解压文件夹。
5. 将 Naka Sigil 固定到工具栏，再打开 Shielded Nakas 市场，或在插件弹窗中输入 Shielded 编号查询。

需要先解压再加载，不能直接将 ZIP 拖入扩展管理页。安装期间请保留该解压文件夹。

### 更新

将新版解压文件替换到原扩展文件夹，在 **chrome://extensions** 点击该扩展的“**重新加载**”，然后刷新已打开的市场网页。公开版扩展 ID 保持不变，浏览器本地设置和快照可以继续使用。

### 安装包信息

- 版本：**0.10.6**
- 内置快照：**区块 971,025**，不是当前链上最新高度。默认实时模式，市场、比较页或弹窗可见时自动检查；指定区块模式暂停自动更新，可填写官方季度快照高度。已有明确模式选择会保留。
- SHA-256 校验文件：[SHA256SUMS](./SHA256SUMS)
- 公开版扩展 ID：**bcihombccpheaimcgldamaggokpgpidl**

安装包由本项目的运行时代码生成，不包含浏览器资料、钱包数据、凭据或开发工具。此目录仅保留当前版本，请勿手动修改生成文件。维护者可运行 **npm run package:chrome** 或 **npm run release** 重新生成安装包、说明和校验文件。
