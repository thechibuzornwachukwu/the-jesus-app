/**
 * generate-icons.js
 * Pure Node.js script — no external dependencies.
 * Generates /public/icons/icon-192.png and icon-512.png
 * using a minimal PNG encoder with zlib compression.
 *
 * Design: brand orange cross (#f47521) on near-black (#040503) background.
 * Run: node scripts/generate-icons.js
 */

const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');

// ── CRC32 ─────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

// ── PNG chunk builder ─────────────────────────────────────
function pngChunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const lenBuf    = Buffer.allocUnsafe(4);
  const crcBuf    = Buffer.allocUnsafe(4);
  lenBuf.writeUInt32BE(data.length, 0);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])), 0);
  return Buffer.concat([lenBuf, typeBytes, data, crcBuf]);
}

// ── Build PNG from pixel getter ───────────────────────────
function buildPNG(size, getPixel) {
  // IHDR
  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8]  = 8; // bit depth
  ihdr[9]  = 2; // RGB
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // filter adaptive
  ihdr[12] = 0; // no interlace

  // Scanlines (filter byte 0 = None per row)
  const raw = Buffer.allocUnsafe(size * (1 + size * 3));
  let pos = 0;
  for (let y = 0; y < size; y++) {
    raw[pos++] = 0; // filter none
    for (let x = 0; x < size; x++) {
      const [r, g, b] = getPixel(x, y, size);
      raw[pos++] = r;
      raw[pos++] = g;
      raw[pos++] = b;
    }
  }

  const compressed = zlib.deflateSync(raw, { level: 9 });

  const PNG_SIG = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    PNG_SIG,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', compressed),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Icon design ───────────────────────────────────────────
// Orange cross on near-black, with a soft orange glow circle in centre.
const BG  = [4,  5,  3];    // #040503
const FG  = [244, 117, 33]; // #f47521
const MID = [23, 22, 56];   // #171638  (inner rounded square)

function getPixel(x, y, size) {
  const cx = size / 2;
  const cy = size / 2;
  const dx = x - cx;
  const dy = y - cy;

  // Rounded inner square (surface)
  const squareHalf = size * 0.42;
  const squareR    = size * 0.12;
  const inSquare   =
    Math.abs(dx) < squareHalf && Math.abs(dy) < squareHalf &&
    !(Math.abs(dx) > squareHalf - squareR && Math.abs(dy) > squareHalf - squareR &&
      Math.hypot(Math.abs(dx) - (squareHalf - squareR), Math.abs(dy) - (squareHalf - squareR)) > squareR);

  // Cross arms
  const armW  = size * 0.115;
  const armH  = size * 0.55;
  const armVY = size * 0.06; // vertical arm shifted slightly up
  const inCross =
    (Math.abs(dx) < armW / 2 && Math.abs(dy - (-armVY)) < armH / 2) ||
    (Math.abs(dx) < armH / 2 && Math.abs(dy) < armW / 2);

  if (inCross && inSquare) return FG;
  if (inSquare)            return MID;
  return BG;
}

// ── Write icons ───────────────────────────────────────────
const outDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

for (const size of [192, 512]) {
  const buf  = buildPNG(size, getPixel);
  const file = path.join(outDir, `icon-${size}.png`);
  fs.writeFileSync(file, buf);
  console.log(`✓ ${file}  (${(buf.length / 1024).toFixed(1)} KB)`);
}

console.log('Icons generated.');
