/**
 * The sigil turning its head to look aside and back, drawn as a character turns in a flat cartoon, in the logo's own two
 * colours. Run `node scripts/gen-sigil-turn.js` to write the frames into src/lib/pixel.js (between its turn-frames
 * markers); test/pixel.test.js checks that the frames there are this script's.
 *
 * The head keeps its outline at every angle. The face (its hole, the visor and the mouth) is wrapped round the head like a
 * label round a cylinder and slides round as the head turns, narrowing toward the edge; the lenses stand a little forward
 * of the face, so near the profile they show past the outline; the chin, at the front, follows the face; the crest's four
 * spikes ride round on a smaller ring; the visor's strap leaves each lens at its outer edge and runs round the head. Frames come every 22.5° from the
 * front (excluded: pixel.js draws it from the original artwork) to the profile, the face moving to the viewer's right; the
 * turn stops at the profile, where the lenses stand out like a nose, rather than going on to the back, the plainest view. Afterwards
 * a fragment of the face hole under 3 pixels inside the head is filled and a lone visor pixel takes the head's colour:
 * slivers at a steep angle read as specks. Frame characters: '.' empty, 'o' the sigil colour, 'v' visor.
 */
'use strict';
const fs = require('fs'), path = require('path');

const CX = 12, STEPS = 4, RING = 6, LENS = 1.4, STRAP = Math.asin(6 / 9);
/** The front artwork (pixel.js SHIELD, EYES, MOUTH) by row: the head's span, its hole, the visor and the mouth. */
function span(y) {
  if (y === 5 || y === 6) return [5, 19];
  if (y >= 7 && y <= 16) return [3, 21];
  if (y >= 17 && y <= 19) return [5, 19];
  if (y === 20 || y === 21) return [8, 16];
  if (y === 22 || y === 23) return [11, 13];
  return null;
}
function hole(x, y) {
  if (y >= 9 && y <= 15) return x >= 7 && x < 18;
  if (y >= 16 && y <= 18) return x >= 9 && x < 16;
  if (y >= 19 && y <= 20) return x >= 12 && x < 13;
  return false;
}
const eye = (x, y) => (y >= 10 && y <= 12 && ((x >= 6 && x < 11) || (x >= 13 && x < 18))) || (y === 11 && x >= 11 && x < 13);
const mouth = (x, y) => y >= 16 && y <= 17 && x >= 11 && x < 14;
function front(x, y) {
  const s = span(y);
  if (s === null || x < s[0] || x >= s[1]) return '.';
  if (eye(x, y) || mouth(x, y)) return 'v';
  return hole(x, y) ? '.' : 'o';
}
// The crest's spikes in the front view: [left column of the 2-wide spike, top row].
const SPIKES = [[7, 3], [9, 1], [13, 0], [17, 2]];
// How far forward the middle of each lower row sits: the chin is at the front, so it follows the face round.
const FORWARD = { 17: 0.6, 18: 0.8, 19: 1, 20: 1.4, 21: 1.6, 22: 2, 23: 2 };
/** The two sides differ: an earpiece (a 3×3 visor-coloured square under the strap) on the side a right turn shows, a bolt
 * (a visor-coloured cross) on the side a left turn shows. One mark a side: two marks side by side read as
 * a second pair of eyes. ph is the place on the head, a the row's half-width; null where neither is. */
function side(ph, a, y) {
  const along = (centre) => a * wrap(ph - centre);
  const ear = along(-Math.PI / 2), bolt = along(Math.PI / 2);
  if (y >= 13 && y <= 15 && Math.abs(ear) < 1.5) return 'v';
  // The head's middle falls between two columns, so the cross's upright is two pixels wide.
  if ((y === 14 && Math.abs(bolt) < 2) || ((y === 13 || y === 15) && Math.abs(bolt) < 1)) return 'v';
  return null;
}
const wrap = (a) => ((a + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI;

/** One view, the head turned by theta (radians; the face moving to the viewer's right): 24 rows of 24 characters. */
function render(theta) {
  const g = Array.from({ length: 24 }, () => Array(24).fill('.')), st = Math.sin(theta);
  for (let y = 5; y < 24; y++) {
    const [x0, x1] = span(y), a = (x1 - x0) / 2, mid = CX + (FORWARD[y] ?? 0) * st;
    for (let u = 0; u < 24; u++) {
      const s = (u + 0.5 - mid) / a;
      if (Math.abs(s) > 1) continue;
      // The place on the head this pixel shows (0: the middle of the face), and the same place on the front artwork.
      const ph = wrap(Math.asin(s) - theta);
      // The strap leaves each lens at its outer edge and runs round the head; each side has its own mark (side()).
      g[y][u] = y === 11 && Math.abs(ph) > STRAP ? 'v' : side(ph, a, y) ?? (Math.abs(ph) <= Math.PI / 2 ? front(Math.floor(CX + a * Math.sin(ph)), y) : 'o');
    }
  }
  // The lenses: every quarter-pixel of them drawn where it lands, LENS forward of the face.
  for (let y = 10; y <= 12; y++) {
    const [x0, x1] = span(y), a = (x1 - x0) / 2;
    for (let q = 6 * 4; q < 18 * 4; q++) {
      const xt = q / 4;
      if (!eye(Math.floor(xt), y)) continue;
      const ph = Math.asin((xt + 0.125 - CX) / a) + theta;
      if (Math.cos(ph) < -0.05) continue;
      const u = Math.floor(CX + a * Math.sin(ph) + LENS * st);
      if (u >= 0 && u < 24) g[y][u] = 'v';
    }
  }
  // The crest: each spike where its place on the ring lands.
  for (const [x0, top] of SPIKES) {
    const c = CX + RING * Math.sin(Math.asin((x0 + 1 - CX) / RING) + theta);
    for (let y = top; y < 5; y++) for (const u of [Math.floor(c - 0.5), Math.floor(c + 0.5)]) if (u >= 0 && u < 24) g[y][u] = 'o';
  }
  return tidy(g);
}
/** Clean-up, on the view as rendered: a fragment of the face hole under 3 pixels enclosed by the head is filled; a lone
 * visor pixel takes the head's colour where it touches the head and goes where it does not; a fragment of the head's colour under 3 pixels touching no visor (a sliver of the
 * face's rim at a steep angle) goes. Each part is a maximal 4-connected run of one character, so the empty space round
 * the head is one part touching the edge of the grid. */
function tidy(g) {
  const out = g.map((r) => [...r]), seen = new Set(), key = (x, y) => y * 24 + x, steps = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let y = 0; y < 24; y++) for (let x = 0; x < 24; x++) {
    if (seen.has(key(x, y))) continue;
    const c = g[y][x], part = [[x, y]];
    let edge = false, visor = false;
    seen.add(key(x, y));
    for (let i = 0; i < part.length; i++) {
      const [px, py] = part[i];
      if (px === 0 || px === 23 || py === 0 || py === 23) edge = true;
      for (const [dx, dy] of steps) {
        const nx = px + dx, ny = py + dy;
        if (nx < 0 || nx > 23 || ny < 0 || ny > 23) continue;
        if (g[ny][nx] === c && !seen.has(key(nx, ny))) { seen.add(key(nx, ny)); part.push([nx, ny]); }
        if (g[ny][nx] === 'v') visor = true;
      }
    }
    const paint = (to) => { for (const [px, py] of part) out[py][px] = to; };
    if (c === '.' && !edge && part.length < 3) paint('o');
    else if (c === 'v' && part.length === 1) paint(part.some(([px, py]) => steps.some(([dx, dy]) => g[py + dy]?.[px + dx] === 'o')) ? 'o' : '.');
    else if (c === 'o' && part.length < 3 && !visor) paint('.');
  }
  return out.map((r) => r.join(''));
}
/** The turns: views at 22.5°, 45°, 67.5° and 90° to the right, then the same to the left (the front view is pixel.js's own
 * artwork), rows joined by '/'. */
const frames = () => [1, -1].flatMap((way) => Array.from({ length: STEPS }, (_, i) => render((way * Math.PI * (i + 1)) / 8).join('/')));
module.exports = { frames, render };

if (require.main === module) {
  const file = path.join(__dirname, '..', 'src', 'lib', 'pixel.js'), src = fs.readFileSync(file, 'utf8');
  const start = '  // <turn-frames> generated by scripts/gen-sigil-turn.js; do not edit by hand\n', end = '  // </turn-frames>\n';
  const a = src.indexOf(start), b = src.indexOf(end);
  if (a < 0 || b < a) throw new Error('turn-frames markers missing in src/lib/pixel.js');
  const block = `${start}  const TURN = [\n${frames().map((f) => `    '${f}',`).join('\n')}\n  ];\n${end}`;
  fs.writeFileSync(file, src.slice(0, a) + block + src.slice(b + end.length));
  console.log(`Wrote ${2 * STEPS} turn frames into src/lib/pixel.js`);
}
