/** Original Naka Sigil artwork. Integer-grid SVGs; no collection images or external fonts. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.NakaPixel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  // A crest, shield and narrow gaze. All edges follow the same pixel grid.
  const SHIELD = 'M5 5h2V3h2V1h2v4h2V0h2v5h2V2h2v5h2v10h-2v3h-3v2h-3v2h-2v-2H8v-2H5v-3H3V7h2V5zm2 4v7h2v3h3v2h1v-2h3v-3h2V9H7z';
  const GAZE = 'M6 10h5v3H6v-3zm7 0h5v3h-5v-3zm-2 1h2v1h-2v-1zm0 5h3v2h-3v-2z';
  const DIGITS = {
    '0':['01110','11011','11011','11011','11011','11011','01110'],
    '1':['00100','01100','00100','00100','00100','00100','01110'],
    '2':['01110','11011','00011','00110','01100','11000','11111'],
    '3':['11110','00011','00011','01110','00011','00011','11110'],
    '4':['00011','00111','01111','11011','11111','00011','00011'],
    '5':['11111','11000','11000','11110','00011','00011','11110'],
    '6':['01110','11000','11000','11110','11011','11011','01110'],
    '7':['11111','00011','00011','00110','01100','01100','01100'],
    '8':['01110','11011','11011','01110','11011','11011','01110'],
    '9':['01110','11011','11011','01111','00011','00011','01110'],
    '%':['11001','11010','00010','00100','01000','01011','10011'],
    '–':['00000','00000','00000','11111','00000','00000','00000'],
    ',':['00','00','00','00','00','01','10'],
  };
  function node(tag, attrs) {
    const n = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attrs)) n.setAttribute(key, value);
    return n;
  }
  function sigil(cls) {
    const svg = node('svg', { viewBox:'0 0 24 24', fill:'currentColor', 'shape-rendering':'crispEdges', 'aria-hidden':'true', class:cls });
    svg.append(node('path', { d:SHIELD, 'fill-rule':'evenodd' }), node('path', { d:GAZE, fill:'#c4b5fd' }));
    return svg;
  }
  function digitsPath(text) {
    let x = 0, d = '';
    for (const c of text) {
      const rows = DIGITS[c];
      if (!rows) throw new Error('Unsupported pixel digit');
      rows.forEach((row,y) => [...row].forEach((bit,dx) => { if (bit==='1') d += `M${x+dx} ${y}h1v1h-1z`; }));
      x += rows[0].length + 1;
    }
    return { d, width:Math.max(0,x-1) };
  }
  function digits(text, cls) {
    const {d,width} = digitsPath(text);
    const svg = node('svg', { viewBox:`0 0 ${width} 7`, 'aria-hidden':'true', 'shape-rendering':'crispEdges', class:cls });
    svg.append(node('path', { d, fill:'currentColor' }));
    return svg;
  }
  return { sigil, digits, digitsPath, SHIELD, GAZE };
});
