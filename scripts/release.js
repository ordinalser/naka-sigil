/** Package only audited source files; never walk the surrounding workspace. */
'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { releaseFiles } = require('./privacy.js');
const ROOT = path.join(__dirname, '..');
const version = require('../package.json').version;
const output = path.join(ROOT, '..', `naka-sigil-source-v${version}.zip`);
const stage = fs.mkdtempSync(path.join(os.tmpdir(), 'nakas-public-source-'));
try {
  for (const rel of releaseFiles) {
    const dest = path.join(stage, 'naka-sigil', rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(path.join(ROOT, rel), dest);
  }
  const archive = path.join(stage, 'source.zip');
  const names = releaseFiles.map(rel => `naka-sigil/${rel}`);
  execFileSync('zip', ['-Xq', archive, ...names], { cwd:stage });
  const actual = execFileSync('unzip', ['-Z1', archive], { encoding:'utf8' }).trim().split('\n').sort();
  if (JSON.stringify(actual)!==JSON.stringify([...names].sort())) throw new Error('Source archive allowlist mismatch');
  for (const rel of releaseFiles) {
    const content = execFileSync('unzip', ['-p', archive, `naka-sigil/${rel}`]);
    if (!content.equals(fs.readFileSync(path.join(ROOT,rel)))) throw new Error(`Source archive mismatch: ${rel}`);
  }
  fs.copyFileSync(archive, output);
  console.log(`PASS: ${names.length} allowlisted source files, byte-for-byte verified in ${path.basename(output)}`);
} finally {
  fs.rmSync(stage, { recursive:true, force:true });
}
