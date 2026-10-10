/**
 * 生成内置快照 src/data/snapshot.js（随插件打包，安装后在用户点「同步」之前使用它）。
 *
 *   node scripts/snapshot.js --height tip      以索引器最新高度为快照点
 *   node scripts/snapshot.js --height 970502   以「区块 970502 确认之后」的链上状态为快照点
 *
 * 逻辑全部在 src/lib/snapshot-core.js（扩展后台的「同步」也用它）。命令行版本不复用已有快照，
 * 所有藏品的特征都重新从官方元数据拉取（约 3300 次请求、3 分钟），作为权威的全量基线。
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { RULES, traitTier } = require('../src/lib/rules.js');
const { generate } = require('../src/lib/snapshot-core.js');

const OUT = path.join(__dirname, '..', 'src', 'data', 'snapshot.js');

function parseArgs(argv) {
  const i = argv.indexOf('--height');
  if (i < 0 || !argv[i + 1]) throw new Error('用法：node scripts/snapshot.js --height <区块高度|tip>');
  const v = argv[i + 1];
  if (v === 'tip') return { height: 'tip' };
  if (!/^\d+$/.test(v)) throw new Error(`--height 必须是区块高度或 tip，实际是 ${v}`);
  return { height: Number(v) };
}

const STAGE_TEXT = { state: '读取集合与链上状态…', build: '汇总地板价…' };

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { snapshot: snap } = await generate({
    height: args.height,
    bases: [],
    generatedAt: () => new Date().toISOString(),
    onProgress: (p) => {
      if (p.stage === 'meta') {
        if (p.done === 0) console.log(`拉取 ${p.total} 件藏品的官方元数据…`);
        else if (p.done % 500 === 0 || p.done === p.total) console.log(`  元数据 ${p.done}/${p.total}`);
      } else console.log(STAGE_TEXT[p.stage]);
    },
  });

  const header = `// 由 scripts/snapshot.js 生成（--height ${args.height}），请勿手改。\n`;
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, header + 'globalThis.SHNAKAS_SNAPSHOT = ' + JSON.stringify(snap) + ';\n');

  const s = snap.snapshot;
  const measured = snap.traits.filter((t) => t[2] !== null);
  const tiers = {};
  for (const t of measured) {
    const k = `+${traitTier(t[2], s.collectionFloor).pct}%`;
    tiers[k] = (tiers[k] || 0) + 1;
  }
  console.log(`OK ${path.relative(process.cwd(), OUT)}`);
  console.log(`   快照高度 ${s.height}（索引器 ${s.indexerHeight}）· 有效挂单 ${s.listings} · 集合地板 ${s.collectionFloor} 聪`);
  console.log(`   特征 ${snap.traits.length} 个：有挂单 ${measured.length}（${Object.entries(tiers).map(([k, v]) => `${k}×${v}`).join('，')}），无挂单 ${snap.traits.length - measured.length}`);
  console.log(`   藏品 ${Object.keys(snap.items).length} 件`);
  console.log(`   区块 ${s.height} 的权重估算，不是官方季度最终权重`);
}

main().catch((e) => { console.error('快照失败：' + e.message); process.exit(1); });
