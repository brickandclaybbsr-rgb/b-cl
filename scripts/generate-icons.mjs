// Generates placeholder PWA icons (no external deps) using zlib + raw PNG.
// Draws a warm flame mark on the near-black brand background.
// Replace public/icons/*.png with real branded art whenever ready.
import { deflateSync } from "node:zlib";
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "icons");
mkdirSync(outDir, { recursive: true });

const BG = [0x0f, 0x0d, 0x0b];
const FIRE = [0xe8, 0x62, 0x0a];
const WARM = [0xf5, 0xa6, 0x23];

const crcTable = (() => {
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
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function lerp(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

function makePng(size, pad) {
  const raw = Buffer.alloc(size * (size * 3 + 1));
  const cx = size / 2;
  const inner = size * (1 - pad * 2);
  const top = size * pad + inner * 0.16;
  const bottom = size * pad + inner * 0.9;
  const r = inner * 0.27; // flame bulb radius
  const bulbY = bottom - r;

  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 3 + 1);
    raw[rowStart] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      let color = BG;
      const dx = x - cx;
      const dy = y - bulbY;
      const inBulb = dx * dx + dy * dy <= r * r;
      // teardrop tip: triangle narrowing toward `top`
      let inTip = false;
      if (y >= top && y <= bulbY) {
        const tProg = (y - top) / (bulbY - top);
        const halfW = r * tProg;
        inTip = Math.abs(dx) <= halfW;
      }
      if (inBulb || inTip) {
        const g = Math.min(1, Math.max(0, (y - top) / (bottom - top)));
        color = lerp(WARM, FIRE, g);
      }
      const o = rowStart + 1 + x * 3;
      raw[o] = color[0];
      raw[o + 1] = color[1];
      raw[o + 2] = color[2];
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type: RGB
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

writeFileSync(join(outDir, "icon-192.png"), makePng(192, 0.18));
writeFileSync(join(outDir, "icon-512.png"), makePng(512, 0.18));
writeFileSync(join(outDir, "icon-maskable-512.png"), makePng(512, 0.28));
writeFileSync(join(outDir, "apple-touch-icon.png"), makePng(180, 0.16));
console.log("✓ Generated PWA icons in public/icons/");
