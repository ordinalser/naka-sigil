/** Public-release allowlist and privacy checks. Matched data is never echoed. */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const downloads = require('./package-chrome.js');
const ROOT = path.join(__dirname, '..');
const files = [
  'demo/index.html', 'demo/naka-sigil-demo.html', 'scripts/package-demo.js', 'docs/REPRODUCIBILITY.md', 'test/explore.test.js',
  '.gitignore', 'LICENSE', 'README.md', 'package.json',
  'docs/DESIGN.md', 'docs/ADVERSARIAL_AUDIT.md', 'docs/RULES_AUDIT.md', 'docs/PRIVACY.md', 'docs/VALIDATION.md',
  'scripts/build.js', 'scripts/snapshot.js', 'scripts/gen-icons.js', 'scripts/privacy.js', 'scripts/release.js', 'scripts/package-chrome.js',
  'test/purchase.test.js', 'test/lookup.test.js', 'test/worker.test.js', 'test/pixel.test.js', 'test/i18n.test.js', 'test/rules.test.js', 'test/snapshot.test.js', 'test/source.test.js', 'test/tier.test.js',
];
const source = [
  'lib/explore.js', 'lib/explore-ui.js', 'workspace/index.html', 'workspace/workspace.js', 'workspace/workspace.css',
  'lib/purchase.js', 'lib/purchase.css', 'lib/lookup.js', 'lib/pixel.js', 'data/snapshot.js', 'lib/rules.js', 'lib/snapshot-core.js', 'lib/source.js', 'lib/i18n.js', 'lib/tier.js',
  'content/content.js', 'content/content.css', 'popup/popup.html', 'popup/popup.css', 'popup/popup.js',
  'sw/sync-sw.js', '_locales/en/messages.json', '_locales/zh_CN/messages.json',
  ...[16,32,48,128].map(n => `icons/icon${n}.png`),
];
const allowed = new Set([...files, ...source.map(f => `src/${f}`), ...downloads.downloadFiles]);
const built = new Set(['manifest.json', ...source]);
const patterns = [
  /\/(?:Users|home)\/[A-Za-z0-9_.-]+\//,
  /[A-Z]:\\Users\\[^\\\s]+\\/i,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{24,}|AKIA[A-Z0-9]{16})\b/,
  /(?:password|secret|access_token|api_token)\s*[:=]\s*["'][A-Za-z0-9_+\/-]{16,}["']/i,
  /(?:https?:\/\/)[^\s/:]+:[^\s/@]+@/i,
  /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
];
let count = 0;
function walk(dir, prefix = '') {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = prefix + entry.name;
    // A user can install dependencies or initialize their own repository after release.
    // They are excluded from source archives; this checker never reads their content.
    if (!prefix && ['node_modules', '.git'].includes(entry.name)) continue;
    if (entry.isSymbolicLink()) throw new Error(`Symlink forbidden: ${rel}`);
    if (entry.isDirectory()) { walk(path.join(dir, entry.name), `${rel}/`); continue; }
    const isBuild = rel.startsWith('dist/chrome/');
    const isZip = rel === `dist/${downloads.zipName}` || rel === `release/${downloads.zipName}`;
    if (isZip) {
      const zipPath = path.join(dir, entry.name);
      checkZipMetadata(zipPath);
      const entries = execFileSync('unzip', ['-Z1', zipPath], { encoding:'utf8' }).trim().split('\n').filter(f => !f.endsWith('/'));
      assert(entries.length===built.size && entries.every(f => built.has(f)), 'Unexpected installation archive content');
      for (const f of entries) assert(execFileSync('unzip', ['-p', zipPath, f]).equals(fs.readFileSync(path.join(ROOT,'dist/chrome',f))), 'Archive differs from validated build');
    }
    if (!allowed.has(rel) && !(isBuild && built.has(rel.slice('dist/chrome/'.length))) && !isZip) throw new Error(`Unexpected file: ${rel}`);
    if (!rel.endsWith('.png') && !isZip) {
      const text = fs.readFileSync(path.join(dir, entry.name), 'utf8');
      for (let i=0; i<patterns.length; i++) if (patterns[i].test(text)) throw new Error(`Privacy pattern ${i+1} in ${rel}; value withheld`);
    }
    count++;
  }
}
function validateSnapshot() {
  const sandbox = {};
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'src/data/snapshot.js'), 'utf8'), sandbox, { timeout: 1000 });
  const s = sandbox.SHNAKAS_SNAPSHOT;
  const exact = (o, keys) => assert(Object.keys(o).sort().join() === [...keys].sort().join(), 'Unexpected snapshot fields');
  exact(s, ['format','collection','snapshot','traits','items','offers','sales']);
  exact(s.collection, ['slug','name','cid','rulesInscriptionId','numberStart']);
  exact(s.snapshot, ['height','indexerHeight','generatedAt','blockTime','listings','collectionFloor']);
  exact(s.snapshot.blockTime, ['height','hash','timestamp']);
  assert(require('../src/lib/source.js').isSnapshot(s), 'Invalid public snapshot');
  assert(s.offers.every(o=>o.length===2 && typeof o[0]==='string' && Number.isSafeInteger(o[1])), 'Unexpected listing fields');
  assert(s.sales.every(sale=>sale.length===3 && sale.every(Number.isSafeInteger)), 'Unexpected sale history fields');
  assert(s.collection.slug === 'shielded-nakas-mupv6wja', 'Unexpected collection');
  assert(s.traits.every(t => t.length===4 && typeof t[0]==='string' && typeof t[1]==='string' && (t[2]===null || Number.isSafeInteger(t[2])) && Number.isSafeInteger(t[3])), 'Unexpected trait data');
  assert(Object.entries(s.items).every(([id,row]) => /^[0-9a-f]{64}i\d+$/.test(id) && row.every(Number.isSafeInteger)), 'Unexpected item data');
}
function assert(ok, message) { if (!ok) throw new Error(message); }
walk(ROOT);
for (const rel of allowed) assert(fs.existsSync(path.join(ROOT,rel)), `Missing release file: ${rel}`);
const downloadBytes = fs.readFileSync(path.join(ROOT,'release',downloads.zipName));
assert(downloadBytes.equals(fs.readFileSync(path.join(ROOT,'dist',downloads.zipName))), 'Download differs from validated installation archive');
assert(fs.readFileSync(path.join(ROOT,'release/README.md'),'utf8')===downloads.readme, 'Download guide differs from generated content');
assert(fs.readFileSync(path.join(ROOT,'release/SHA256SUMS'),'utf8')===downloads.checksum(downloadBytes), 'Download checksum mismatch');
assert(JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'))).name === 'naka-sigil', 'Unexpected package identity');
validateSnapshot();
assert(fs.readFileSync(path.join(ROOT,'demo/naka-sigil-demo.html'),'utf8')===require('./package-demo.js').render(), 'Portable demo differs from shared runtime');
// Canonical bytes reject PNG metadata, extra chunks and hidden alternate pixel data.
const { render, encodePNG } = require('./gen-icons.js');
for (const size of [16,32,48,128]) {
  const canonical=encodePNG(size,render(size));
  assert(fs.readFileSync(path.join(ROOT,`src/icons/icon${size}.png`)).equals(canonical), 'Noncanonical icon content');
}
const build = fs.readFileSync(path.join(ROOT, 'scripts/build.js'), 'utf8');
const key = build.match(/const CHROME_KEY = '([^']+)'/)[1];
const expectedId = 'bcihombccpheaimcgldamaggokpgpidl';
const id = [...crypto.createHash('sha256').update(Buffer.from(key,'base64')).digest('hex').slice(0,32)].map(c => String.fromCharCode(97+parseInt(c,16))).join('');
assert(id===expectedId, 'Public extension identity mismatch');
const manifestPath = path.join(ROOT,'dist/chrome/manifest.json');
if (fs.existsSync(manifestPath)) {
  const m = JSON.parse(fs.readFileSync(manifestPath));
  assert(m.key===key, 'Built extension identity mismatch');
  for (const f of source) assert(fs.readFileSync(path.join(ROOT,'dist/chrome',f)).equals(fs.readFileSync(path.join(ROOT,'src',f))), 'Built runtime differs from audited source');
  const manifestKeys=['manifest_version','key','minimum_chrome_version','name','description','version','default_locale','icons','permissions','host_permissions','background','action','content_scripts'];
  assert(Object.keys(m).sort().join()===manifestKeys.sort().join(), 'Unexpected manifest fields');
  assert(m.manifest_version===3 && m.minimum_chrome_version==='105' && m.default_locale==='en' && m.name==='__MSG_extName__' && m.description==='__MSG_extDesc__' && m.version===require('../package.json').version, 'Unexpected manifest metadata');
  assert(JSON.stringify(m.background)===JSON.stringify({service_worker:'sw/sync-sw.js'}), 'Unexpected background entry');
  const scripts=[{matches:['https://ord-dropz.xyz/*'],js:['data/snapshot.js','lib/rules.js','lib/purchase.js','lib/pixel.js','lib/i18n.js','lib/tier.js','lib/source.js','lib/explore.js','lib/explore-ui.js','content/content.js'],css:['content/content.css','lib/purchase.css'],run_at:'document_idle'}];
  assert(JSON.stringify(m.content_scripts)===JSON.stringify(scripts), 'Unexpected content script configuration');

  assert(JSON.stringify(m.permissions)===JSON.stringify(['storage','alarms']), 'Unexpected permissions');
  assert(JSON.stringify(m.host_permissions)===JSON.stringify(['https://shielded-mint-server-production.up.railway.app/*','https://blockstream.info/*']), 'Unexpected API host permissions');
}
console.log(`PASS: ${count} release files; allowlist, privacy patterns, snapshot fields and public identity verified.`);

module.exports = { releaseFiles: [...allowed].sort() };

// Reject comments, extra fields, trailing bytes and gaps that could carry private metadata.
function checkZipMetadata(file) {
  const b=fs.readFileSync(file),end=b.length-22;
  assert(end>=0 && b.readUInt32LE(end)===0x06054b50 && b.readUInt16LE(end+20)===0, 'Unexpected ZIP trailer or comment');
  const total=b.readUInt16LE(end+10),start=b.readUInt32LE(end+16),size=b.readUInt32LE(end+12);
  assert(b.readUInt16LE(end+4)===0 && b.readUInt16LE(end+6)===0 && b.readUInt16LE(end+8)===total && start+size===end, 'Unexpected ZIP directory');
  let cursor=start;const entries=[];
  for(let i=0;i<total;i++) {
    assert(cursor+46<=end && b.readUInt32LE(cursor)===0x02014b50, 'Invalid ZIP entry');
    const nameLength=b.readUInt16LE(cursor+28),extra=b.readUInt16LE(cursor+30),comment=b.readUInt16LE(cursor+32),offset=b.readUInt32LE(cursor+42),compressed=b.readUInt32LE(cursor+20);
    assert(extra===0 && comment===0 && b.readUInt16LE(cursor+34)===0, 'Unexpected ZIP metadata');
    assert(cursor+46+nameLength<=end && offset+30<=start && b.readUInt32LE(offset)===0x04034b50, 'Invalid ZIP local entry');
    const localName=b.readUInt16LE(offset+26),localExtra=b.readUInt16LE(offset+28),flags=b.readUInt16LE(offset+6);
    assert(localExtra===0 && flags===0 && b.readUInt16LE(cursor+8)===flags, 'Unexpected ZIP local metadata');
    assert(localName===nameLength && b.subarray(offset+30,offset+30+localName).equals(b.subarray(cursor+46,cursor+46+nameLength)), 'ZIP name mismatch');
    assert(b.readUInt32LE(offset+18)===compressed && b.readUInt32LE(offset+14)===b.readUInt32LE(cursor+16) && b.readUInt32LE(offset+22)===b.readUInt32LE(cursor+24), 'ZIP size or CRC mismatch');
    entries.push({offset,end:offset+30+localName+compressed});cursor+=46+nameLength;
  }
  assert(cursor===end && entries.length>0, 'Unexpected ZIP directory payload');
  entries.sort((a,c)=>a.offset-c.offset);
  assert(entries[0].offset===0 && entries.every((e,i)=>e.end===(entries[i+1]?.offset??start)), 'Unexpected ZIP embedded payload');
}
