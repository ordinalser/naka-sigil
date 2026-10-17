'use strict';
// Every element a page script looks up by a literal ID exists in each template that loads the script (the extension page
// and the portable demo share workspace.js), unless the script creates that element itself.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const read=rel=>fs.readFileSync(path.join(__dirname,'..',rel),'utf8');
const looked=js=>[...new Set([...js.matchAll(/\$\(\s*'([A-Za-z][\w-]*)'\s*\)/g)].map(m=>m[1]))];
const created=js=>new Set([...js.matchAll(/\.id\s*=\s*'([A-Za-z][\w-]*)'/g)].map(m=>m[1]));
const ids=html=>new Set([...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]));
// The portable demo's template exists where this checkout builds the demo (package.json "demo").
const demo=require('../package.json').scripts.demo!==undefined;
for(const [script,templates] of [['src/workspace/workspace.js',['src/workspace/index.html',...(demo?['demo/index.html']:[])]],['src/popup/popup.js',['src/popup/popup.html']]]){
 test(`${script} finds every element it looks up in ${templates.join(' and ')}`,()=>{
  const js=read(script),own=created(js),wanted=looked(js);assert.ok(wanted.length>20,'the lookups were found');
  for(const t of templates){const have=ids(read(t));assert.deepEqual(wanted.filter(id=>!have.has(id)&&!own.has(id)),[],t);}
 });
}
