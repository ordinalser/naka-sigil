/**
 * 构建：src → dist/chrome（MV3），并打一个可安装 zip。
 * 依赖：node 内置模块 + 系统 zip。任何必需文件缺失、快照数据不合规都直接抛错（不产出半成品包）。
 *
 * 权限：storage（存放同步得到的数据与设置）、alarms（实时同步每分钟检查一次新区块）、
 * shielded 协议接口的主机权限（后台读取链上状态）。内容脚本只匹配 ord-dropz.xyz，自身不发网络请求；
 * 后台只在实时模式且有市场、比较页或弹窗可见时，或在弹窗确认载入指定区块时联网。
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { evaluateSnapshot } = require('../src/lib/rules.js');
const { FORMAT, API, BLOCK_API } = require('../src/lib/snapshot-core.js');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');
fs.mkdirSync(DIST, { recursive: true });
const VERSION = require('../package.json').version;

// 固定扩展 ID（公钥，非机密）。未打包扩展的 ID 默认按加载目录路径推导，换目录解压新版本 ID 就变，
// 而 storage.local 按 ID 分区——ID 一变，之前「同步」得到的数据就看不到了。钉住 key 让升级、换目录都复用同一份数据。
// 对应 ID：bcihombccpheaimcgldamaggokpgpidl（私钥不在仓库里，也不参与运行）。
const CHROME_KEY = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA3tu1nQGAx5m1/hAnepAKkW2IM/pVrJ9+uDcjZIxDPADSvj53lE0gCZCviV4prx56Mkqv7Wz31aG9XFywCBs7+x/atkNtQyZpy2O2nM1E6qMA6ieNEMpdvp+11WudBdqBYjFx6DGtiQmNQZhLRFY/WW5FxtlmUNQ77MDFxYoGr2HPvZW8cjNW8cA5kpdLquO4ZszYghL2JFiDIWc25VmZn0RMrJVgPtNZ0/4xCafIPCSmcnbHkCpLkyQmeyxixsH0O0UiAJ4gjVSP79c3JL4lodwD+H8SLx3jzmNL0QihNr5v4+WoSjqbYHKn1pkGcFIZRbpYn+9WX342wgygop6ZmwIDAQAB';
const EXTENSION_ID = 'bcihombccpheaimcgldamaggokpgpidl';

const ICONS = { 16: 'icons/icon16.png', 32: 'icons/icon32.png', 48: 'icons/icon48.png', 128: 'icons/icon128.png' };

const manifest = {
  manifest_version: 3,
  key: CHROME_KEY,
  minimum_chrome_version: '105', // 金库卡片的徽章定位用到 CSS :has() 与容器单位 cqw，均自 Chrome 105 起可用
  name: '__MSG_extName__',
  description: '__MSG_extDesc__',
  version: VERSION,
  default_locale: 'en',
  icons: ICONS,
  permissions: ['storage', 'alarms'],
  host_permissions: [`${new URL(API).origin}/*`, `${new URL(BLOCK_API).origin}/*`],
  background: { service_worker: 'sw/sync-sw.js' },
  action: { default_popup: 'popup/popup.html', default_title: '__MSG_extName__', default_icon: ICONS },
  content_scripts: [{
    // 整站匹配：站点是 Next.js 单页应用，从首页点进集合页不会重新注入脚本，脚本自己按路由决定是否工作
    matches: ['https://ord-dropz.xyz/*'],
    js: ['data/snapshot.js', 'lib/rules.js', 'lib/purchase.js','lib/portfolio.js', 'lib/pixel.js', 'lib/i18n.js', 'lib/tier.js', 'lib/source.js','lib/explore.js', 'lib/explore-ui.js', 'content/content.js'],
    css: ['content/content.css', 'lib/purchase.css'],
    run_at: 'document_idle',
  }],
};

const FILES = [
  'lib/portfolio.js','lib/explore.js', 'lib/explore-ui.js', 'workspace/index.html', 'workspace/workspace.js', 'workspace/workspace.css',
  'data/snapshot.js', 'lib/rules.js', 'lib/purchase.js', 'lib/purchase.css', 'lib/lookup.js', 'lib/pixel.js', 'lib/i18n.js', 'lib/tier.js', 'lib/source.js', 'lib/snapshot-core.js', 'sw/sync-sw.js',
  'content/content.js', 'content/content.css',
  'popup/popup.html', 'popup/popup.js', 'popup/popup.css',
  '_locales/zh_CN/messages.json', '_locales/en/messages.json',
  ...Object.values(ICONS),
];

/** 在沙箱里加载快照，校验结构并把每件藏品都按规则算一遍。 */
function checkSnapshot() {
  const file = path.join(SRC, 'data', 'snapshot.js');
  if (!fs.existsSync(file)) throw new Error('构建失败：缺少 src/data/snapshot.js，先运行 npm run snapshot');
  const sandbox = {};
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file });
  const snap = sandbox.SHNAKAS_SNAPSHOT;
  if (!snap || snap.format !== FORMAT) throw new Error(`构建失败：快照格式不是 ${FORMAT}`);
  if (snap.collection.slug !== 'shielded-nakas-mupv6wja') throw new Error(`构建失败：快照集合是 ${snap.collection.slug}`);
  if (!require('../src/lib/source.js').isSnapshot(snap, FORMAT)) throw new Error('Invalid snapshot schema or inconsistent values');
  const { height, collectionFloor } = snap.snapshot;
  if (!Number.isSafeInteger(height) || !Number.isSafeInteger(collectionFloor)) throw new Error('构建失败：快照高度或集合地板缺失');
  const ids = Object.keys(snap.items);
  if (ids.length === 0) throw new Error('构建失败：快照里没有藏品');
  for (const id of ids) {
    const [number, ...idx] = snap.items[id];
    const traits = idx.map((i) => {
      const t = snap.traits[i];
      if (!t) throw new Error(`构建失败：${id} 引用了不存在的特征下标 ${i}`);
      return { type: t[0], value: t[1], floor: t[2], listed: t[3] };
    });
    evaluateSnapshot(snap, id); // 非法数据在这里抛错
  }
  return { height, items: ids.length };
}

const STAGE = path.join(DIST, '.stage-chrome');
const STAGE_ZIP = path.join(DIST, '.stage.zip');

function copy(rel) {
  const from = path.join(SRC, rel);
  if (!fs.existsSync(from)) throw new Error(`构建失败：缺少 ${rel}（不产出半成品包）`);
  const to = path.join(STAGE, rel);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

// 先在暂存目录里组装并打包，全部成功后才替换 dist/chrome 与旧 zip；中途失败时旧产物原样保留。
/** 清单里的 key 必须推导出 EXTENSION_ID（Chromium：公钥 DER 的 SHA-256 前 16 字节，十六进制逐位映射到 a–p）。 */
function checkKey() {
  const hex = crypto.createHash('sha256').update(Buffer.from(CHROME_KEY, 'base64')).digest('hex').slice(0, 32);
  const id = [...hex].map((c) => String.fromCharCode(97 + parseInt(c, 16))).join('');
  if (id !== EXTENSION_ID) throw new Error(`构建失败：key 推导出的 ID 是 ${id}，与 EXTENSION_ID ${EXTENSION_ID} 不符`);
}

checkKey();
const snap = checkSnapshot();
fs.rmSync(STAGE, { recursive: true, force: true });
fs.rmSync(STAGE_ZIP, { force: true });
try {
  for (const f of FILES) copy(f);
  fs.writeFileSync(path.join(STAGE, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  execFileSync('zip', ['-Xqr', STAGE_ZIP, '.'], { cwd: STAGE });
} catch (e) {
  fs.rmSync(STAGE, { recursive: true, force: true });
  fs.rmSync(STAGE_ZIP, { force: true });
  throw e;
}

// 文件名带上快照高度：同一版本号换了快照也能一眼分清
const zipName = `naka-sigil-chrome-v${VERSION}-h${snap.height}.zip`;
fs.rmSync(path.join(DIST, 'chrome'), { recursive: true, force: true });
for (const old of fs.readdirSync(DIST)) if (/^naka-sigil-chrome-.*\.zip$/.test(old)) fs.rmSync(path.join(DIST, old));
fs.renameSync(STAGE, path.join(DIST, 'chrome'));
fs.renameSync(STAGE_ZIP, path.join(DIST, zipName));
console.log(`OK chrome: dist/chrome/ 与 dist/${zipName}`);
console.log(`   快照高度 ${snap.height} · 藏品 ${snap.items} 件`);
