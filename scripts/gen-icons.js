/**
 * 图标生成：Original Naka Sigil: charcoal, amber shield and violet gaze.。
 * 24×24 像素格，最近邻缩放；PNG 编码（zlib deflate + CRC32）零第三方依赖。
 * 输出 16/32/48/128 四档到 src/icons/。
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const OUT = path.join(__dirname, '..', 'src', 'icons');
const SIZES = [16, 32, 48, 128];

// ------------------------------------------------------------ PNG 编码

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function encodePNG(size, rgba) {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0; // filter: None
    rgba.copy(raw, y * stride + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

// Rasterize the shared original sigil with nearest-neighbor pixel scaling.
const { SHIELD, GAZE } = require('../src/lib/pixel.js');
function polygons(d) {
  const tokens = d.match(/[MmHhVvZz]|-?\d+/g);
  let x=0,y=0,sx=0,sy=0,i=0,poly=[],all=[];
  while (i<tokens.length) {
    const cmd=tokens[i++];
    if (cmd==='M' || cmd==='m') {
      const a=Number(tokens[i++]), b=Number(tokens[i++]);
      x=cmd==='m' ? x+a : a; y=cmd==='m' ? y+b : b;
      sx=x; sy=y; poly=[[x,y]];
    }
    if (cmd==='H') { x=Number(tokens[i++]); poly.push([x,y]); }
    if (cmd==='V') { y=Number(tokens[i++]); poly.push([x,y]); }
    if (cmd==='h') { x+=Number(tokens[i++]); poly.push([x,y]); }
    if (cmd==='v') { y+=Number(tokens[i++]); poly.push([x,y]); }
    if (cmd==='z' || cmd==='Z') { all.push(poly); x=sx; y=sy; }
  }
  return all;
}
function contains(polys,x,y) {
  let inside=false;
  for (const p of polys) for (let i=0,j=p.length-1;i<p.length;j=i++) {
    const [a,b]=p[i], [c,d]=p[j];
    if ((b>y)!==(d>y) && x<(c-a)*(y-b)/(d-b)+a) inside=!inside;
  }
  return inside;
}
const outline=polygons(SHIELD), gaze=polygons(GAZE);
function render(size) {
  const rgba=Buffer.alloc(size*size*4);
  for (let y=0;y<size;y++) for (let x=0;x<size;x++) {
    const gx=Math.floor(x*24/size)+.5,gy=Math.floor(y*24/size)+.5;
    const color=contains(gaze,gx,gy) ? [196,181,253,255] : contains(outline,gx,gy) ? [255,175,69,255] : [0,0,0,0];
    const i=(y*size+x)*4;
    rgba[i]=color[0];rgba[i+1]=color[1];rgba[i+2]=color[2];rgba[i+3]=color[3];
  }
  return rgba;
}

if (require.main === module) {
  fs.mkdirSync(OUT, { recursive: true });
  for (const s of SIZES) fs.writeFileSync(path.join(OUT, `icon${s}.png`), encodePNG(s, render(s)));
  console.log(`OK icons: ${SIZES.map((s) => `icon${s}.png`).join(', ')} → ${path.relative(process.cwd(), OUT)}`);
}
module.exports = { render, encodePNG };
