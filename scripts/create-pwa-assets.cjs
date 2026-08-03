const fs = require('fs');
const path = require('path');
const { zlib } = require('zlib');

// Create public directory
const publicDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Generate SVG Icon
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="50%" stop-color="#1e1b4b" />
      <stop offset="100%" stop-color="#090d16" />
    </linearGradient>
    <linearGradient id="redGlow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f87171" />
      <stop offset="50%" stop-color="#ef4444" />
      <stop offset="100%" stop-color="#dc2626" />
    </linearGradient>
    <linearGradient id="playGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#fecdd3" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#ef4444" flood-opacity="0.5"/>
    </filter>
  </defs>

  <!-- Rounded Squircle Background -->
  <rect x="16" y="16" width="480" height="480" rx="108" fill="url(#bg)" stroke="#334155" stroke-width="8"/>
  
  <!-- Outer Ring Accent -->
  <rect x="40" y="40" width="432" height="432" rx="88" fill="none" stroke="url(#redGlow)" stroke-width="4" opacity="0.6"/>

  <!-- Film Strip Track Accents -->
  <path d="M80 140 H432 M80 372 H432" stroke="#334155" stroke-width="4" stroke-dasharray="12 12" />

  <!-- Playhead & Film Reel Center Container -->
  <circle cx="256" cy="256" r="140" fill="url(#redGlow)" filter="url(#shadow)" />
  
  <!-- Play Icon Triangle -->
  <polygon points="230,196 320,256 230,316" fill="url(#playGradient)" />

  <!-- Sparkle AI Stars -->
  <path d="M370 120 L376 138 L394 144 L376 150 L370 168 L364 150 L346 144 L364 138 Z" fill="#fbbf24"/>
  <path d="M140 360 L144 372 L156 376 L144 380 L140 392 L136 380 L124 376 L136 372 Z" fill="#38bdf8"/>
</svg>`;

fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.svg'), svgContent);

// Helper function to create a simple valid uncompressed PNG file in raw Node JS
function createPngBuffer(width, height, r, g, b) {
  // A minimal raw RGBA PNG encoder
  const p = 8; // Bit depth
  // Signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // 8 bit
  ihdr[9] = 6; // Color type 6 = RGBA
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw image data with scanline filter bytes
  const rowSize = width * 4 + 1;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // None filter
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      
      // Draw background gradient / circle
      const cx = width / 2;
      const cy = height / 2;
      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      const maxDist = width / 2;

      let pr = 15, pg = 23, pb = 42, pa = 255; // #0f172a
      
      if (dist < maxDist * 0.55) {
        // Red center circle
        pr = 239; pg = 68; pb = 68; // #ef4444
      } else if (dist < maxDist * 0.85) {
        // Dark indigo ring
        pr = 30; pg = 27; pb = 75; // #1e1b4b
      }

      rawData[pixelOffset] = pr;
      rawData[pixelOffset + 1] = pg;
      rawData[pixelOffset + 2] = pb;
      rawData[pixelOffset + 3] = pa;
    }
  }

  const compressedData = require('zlib').deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  
  const crc = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crc, 0);

  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let j = 0; j < 8; j++) {
      c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

// Generate PNG icons
const png192 = createPngBuffer(192, 192, 239, 68, 68);
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), png192);

const png512 = createPngBuffer(512, 512, 239, 68, 68);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), png512);

const pngApple = createPngBuffer(180, 180, 239, 68, 68);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), pngApple);

console.log('PWA icon assets created in /public directory!');
