'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {digitsPath,SHIELD,GAZE}=require('../src/lib/pixel.js');
test('Pixel artwork uses bounded integer geometry and preserves every height digit',()=>{
  const n=digitsPath('970,502');assert.equal(n.width,38);assert.match(n.d,/^M/);
  assert.equal(digitsPath('1').width,5);assert.throws(()=>digitsPath('<script>'));
  assert.equal(digitsPath('0.0013').width,31); // BTC prices: five 5-wide digits, a 1-wide point, five 1px gaps
  assert.match(SHIELD,/^M/);assert.match(GAZE,/^M/);assert.doesNotMatch(SHIELD+GAZE,/[CQSAcqsa.]/);
});

test('Toolbar PNG has visible amber and violet artwork with transparent margins at every size',()=>{
  const fs=require('node:fs'),zlib=require('node:zlib');
  for(const size of [16,32,48,128]) {
    const png=fs.readFileSync(require.resolve(`../src/icons/icon${size}.png`));
    let offset=8,idat=[];
    while(offset<png.length) { const n=png.readUInt32BE(offset),type=png.toString('ascii',offset+4,offset+8);if(type==='IDAT')idat.push(png.subarray(offset+8,offset+8+n));offset+=n+12; }
    const raw=zlib.inflateSync(Buffer.concat(idat));
    const colors=new Map();
    for(let y=0;y<size;y++) { assert.equal(raw[y*(size*4+1)],0); for(let x=0;x<size;x++) { const i=y*(size*4+1)+1+x*4,key=[...raw.subarray(i,i+4)].join(',');colors.set(key,(colors.get(key)||0)+1); } }
    assert.ok(colors.get('255,175,69,255')>size*size*.2,'amber must be visible');
    assert.ok(colors.get('196,181,253,255')>size*size*.02,'violet gaze must be visible');
    assert.ok(colors.get('0,0,0,0')>size*size*.3,'transparent margin and shield opening');
    assert.equal(colors.size,3,'no opaque black background');
  }
  const {render}=require('../scripts/gen-icons.js');const pixels=render(24);
  const at=(x,y)=>[...pixels.subarray((y*24+x)*4,(y*24+x)*4+4)];
  assert.deepEqual(at(13,0),[255,175,69,255]);
  assert.deepEqual(at(6,10),[196,181,253,255]);
  assert.deepEqual(at(13,10),[196,181,253,255]); // relative subpath after close
  assert.deepEqual(at(7,9),[0,0,0,0]); // inner shield cutout
  assert.deepEqual(at(0,0),[0,0,0,0]);
});

test('The sigil turn views are the generator’s: four to each profile, two colours, the lenses forward, each side its own mark',()=>{
 const {TURN}=require('../src/lib/pixel.js'),{frames}=require('../scripts/gen-sigil-turn.js');
 assert.deepEqual(TURN,frames());assert.equal(TURN.length,8);
 const grid=TURN.map(f=>f.split('/'));
 for(const rows of grid){assert.equal(rows.length,24);for(const r of rows){assert.equal(r.length,24);assert.match(r,/^[.ov]+$/);}}
 // At each profile the lenses stand past the head's outline (columns 3–20) on the side the face turned to.
 assert.match(grid[3][10].slice(21),/v/);assert.match(grid[7][10].slice(0,3),/v/);
 // The sides differ: the right turn shows a square earpiece, the left a cross (rows 13–15 under the strap).
 const mark=rows=>rows.slice(13,16).map(r=>r.slice(3,21).replace(/o/g,'.')).join('/');
 assert.notEqual(mark(grid[3]),mark(grid[7]).split('/').map(r=>[...r].reverse().join('')).join('/'));
 assert.match(mark(grid[3]),/vv/);assert.match(mark(grid[7]).split('/')[1],/vvvv/);
});
