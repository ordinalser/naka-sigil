/** Prepare a public download from the explicit build, never from a browser profile. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const ROOT = path.join(__dirname, '..');
const version = require('../package.json').version;
const sandbox = {};
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'src/data/snapshot.js'), 'utf8'), sandbox, { timeout:1000 });
const height = sandbox.SHNAKAS_SNAPSHOT.snapshot.height;
if (!/^\d+\.\d+\.\d+$/.test(version) || !Number.isSafeInteger(height) || height < 0) throw new Error('Invalid download version or block');
const zipName = `naka-sigil-chrome-v${version}-h${height}.zip`;
const downloadFiles = ['release/README.md', 'release/SHA256SUMS', `release/${zipName}`];
const readme = `# Download Naka Sigil

[English](#install) · [中文](#中文说明)

[**Download Naka Sigil v${version} for Chrome**](./${zipName})

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

- Version: **${version}**
- Bundled snapshot: **block ${height.toLocaleString('en-US')}**, not the current chain tip. Live mode is the default while the market, Compare or popup is visible. Fixed block mode pauses automatic updates; enter a block height for historical inspection. Saved explicit modes are preserved.
- SHA-256 checksum: [SHA256SUMS](./SHA256SUMS)
- Public extension ID: **bcihombccpheaimcgldamaggokpgpidl**

The download is generated from this project's runtime. It contains no browser profile, wallet data, credentials or development tools. This directory contains only the current version; do not edit generated files by hand. Maintainers regenerate it with **npm run package:chrome** or **npm run release**.

## 中文说明

[**下载适用于 Chrome 的 Naka Sigil v${version}**](./${zipName})

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

- 版本：**${version}**
- 内置快照：**区块 ${height.toLocaleString('en-US')}**，不是当前链上最新高度。默认实时模式，市场、比较页或弹窗可见时自动检查；指定区块模式暂停自动更新，可填写指定高度进行历史复算。已有明确模式选择会保留。
- SHA-256 校验文件：[SHA256SUMS](./SHA256SUMS)
- 公开版扩展 ID：**bcihombccpheaimcgldamaggokpgpidl**

安装包由本项目的运行时代码生成，不包含浏览器资料、钱包数据、凭据或开发工具。此目录仅保留当前版本，请勿手动修改生成文件。维护者可运行 **npm run package:chrome** 或 **npm run release** 重新生成安装包、说明和校验文件。
`;
const checksum = bytes => `${crypto.createHash('sha256').update(bytes).digest('hex')}  ${zipName}\n`;

function packageChrome() {
  const dir = path.join(ROOT, 'release');
  if (fs.existsSync(dir) && (!fs.lstatSync(dir).isDirectory() || fs.lstatSync(dir).isSymbolicLink())) throw new Error('Invalid release directory');
  const bytes = fs.readFileSync(path.join(ROOT, 'dist', zipName));
  fs.mkdirSync(dir, { recursive:true });
  const temp = fs.mkdtempSync(path.join(dir, '.stage-'));
  try {
    fs.writeFileSync(path.join(temp, zipName), bytes);
    fs.writeFileSync(path.join(temp, 'README.md'), readme);
    fs.writeFileSync(path.join(temp, 'SHA256SUMS'), checksum(bytes));
    // Retire only this tool's versioned packages; unexpected files remain for the audit to reject.
    for (const name of fs.readdirSync(dir)) {
      if (/^naka-sigil-chrome-v\d+\.\d+\.\d+-h\d+\.zip$/.test(name)) fs.unlinkSync(path.join(dir,name));
    }
    for (const name of [zipName, 'README.md', 'SHA256SUMS']) fs.renameSync(path.join(temp,name), path.join(dir,name));
    console.log(`Prepared release/${zipName} with installation guide and SHA-256 checksum.`);
  } finally { fs.rmSync(temp, { recursive:true, force:true }); }
}
if (require.main === module) packageChrome();
module.exports = { zipName, downloadFiles, readme, checksum };
