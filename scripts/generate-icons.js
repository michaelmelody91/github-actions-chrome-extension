// Generates icons/icon{16,48,128}.png using only built-in Node.js modules.
// Run: node scripts/generate-icons.js

const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

function crc32(buf) {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    table[i] = c;
  }
  let crc = 0xFFFFFFFF;
  for (const b of buf) crc = table[(crc ^ b) & 0xFF] ^ (crc >>> 8);
  return ((crc ^ 0xFFFFFFFF) >>> 0);
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const t = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crcBuf]);
}

function solidPNG(size, r, g, b) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 2;  // RGB color type

  const row = Buffer.alloc(1 + size * 3);
  row[0] = 0; // filter: None
  for (let x = 0; x < size; x++) {
    row[1 + x * 3] = r;
    row[2 + x * 3] = g;
    row[3 + x * 3] = b;
  }
  const rawData = Buffer.concat(Array.from({ length: size }, () => row));

  return Buffer.concat([
    sig,
    makeChunk('IHDR', ihdrData),
    makeChunk('IDAT', zlib.deflateSync(rawData)),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

const iconsDir = path.resolve(__dirname, '..', 'icons');
fs.mkdirSync(iconsDir, { recursive: true });

// GitHub Actions green
for (const size of [16, 48, 128]) {
  const dest = path.join(iconsDir, `icon${size}.png`);
  fs.writeFileSync(dest, solidPNG(size, 35, 134, 54));
  console.log(`icons/icon${size}.png`);
}
