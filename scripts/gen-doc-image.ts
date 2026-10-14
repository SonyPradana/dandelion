// Generates placeholder .webp screenshots for the docs pages. Each image is a
// dark card with a mock browser window and a caption, meant to be replaced by
// a real screenshot with the same filename later.
//
// Usage:
//   bun scripts/gen-doc-image.ts            # only missing files
//   bun scripts/gen-doc-image.ts --force    # overwrite all
//   bun scripts/gen-doc-image.ts <file…>    # specific files
//
// Encoding uses the system libwebp via Bun's FFI — no dependencies.

import { existsSync, writeFileSync } from 'node:fs';
import { dlopen, FFIType, ptr } from 'bun:ffi';
import { join } from 'node:path';

const ASSETS_DIR = join(import.meta.dir, '..', 'public', 'doc', 'v1', 'assets');

const WIDTH = 960;
const HEIGHT = 540;

// ── webp encoding (libwebp) ──

const libwebp = dlopen('libwebp.so.7', {
  WebPEncodeRGBA: {
    args: [FFIType.ptr, FFIType.i32, FFIType.i32, FFIType.i32, FFIType.f32, FFIType.ptr],
    returns: FFIType.u64,
  },
  WebPFree: { args: [FFIType.ptr], returns: FFIType.void },
});

const libc = dlopen('libc.so.6', {
  memcpy: {
    args: [FFIType.ptr, FFIType.ptr, FFIType.u64],
    returns: FFIType.ptr,
  },
});

const webpFree = libwebp.symbols.WebPFree;
const webpEncodeRgba = libwebp.symbols.WebPEncodeRGBA;
const memcpy = libc.symbols.memcpy;

function encodeWebp(rgba: Uint8Array, quality = 0.9): Uint8Array {
  const outPtr = new BigUint64Array(1);
  const size = Number(webpEncodeRgba(ptr(rgba), WIDTH, HEIGHT, WIDTH * 4, quality, ptr(outPtr)));
  if (size === 0) throw new Error('WebPEncodeRGBA failed');
  const bytes = new Uint8Array(size);
  memcpy(ptr(bytes), Number(outPtr[0]), size);
  webpFree(Number(outPtr[0]));
  return bytes;
}

// ── tiny rasterizer ──

type Rgba = readonly [number, number, number, number];

const BG: Rgba = [10, 10, 15, 255];
const CARD: Rgba = [20, 20, 31, 255];
const BORDER: Rgba = [42, 42, 58, 255];
const ACCENT: Rgba = [99, 102, 241, 255];
const ACCENT_SOFT: Rgba = [30, 27, 75, 255];
const TEXT: Rgba = [228, 228, 231, 255];
const MUTED: Rgba = [113, 113, 122, 255];

const GLYPHS: Record<string, readonly string[]> = {
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  '0': ['01110', '10011', '10101', '10101', '10101', '11001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  ',': ['00000', '00000', '00000', '00000', '01100', '01100', '00100'],
  ':': ['00000', '01100', '01100', '00000', '00000', '01100', '01100'],
  ';': ['00000', '01100', '01100', '00000', '01100', '00100', '01000'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  '+': ['00000', '00100', '00100', '11111', '00100', '00100', '00000'],
  '(': ['00010', '00100', '01000', '01000', '01000', '00100', '00010'],
  ')': ['01000', '00100', '00010', '00010', '00010', '00100', '01000'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
  '&': ['01100', '10010', '10100', '01000', '10101', '10010', '01101'],
  '%': ['11001', '11010', '00010', '00100', '01000', '01011', '10011'],
  '!': ['00100', '00100', '00100', '00100', '00100', '00000', '00100'],
  '?': ['01110', '10001', '00001', '00010', '00100', '00000', '00100'],
  '=': ['00000', '00000', '11111', '00000', '11111', '00000', '00000'],
  '>': ['10000', '01000', '00100', '00010', '00100', '01000', '10000'],
  '<': ['00001', '00010', '00100', '01000', '00100', '00010', '00001'],
};

function putPixel(bm: Uint8Array, x: number, y: number, [r, g, b, a]: Rgba): void {
  if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) return;
  const i = (y * WIDTH + x) * 4;
  // source-over blending
  const sa = a / 255;
  bm[i] = Math.round(r * sa + bm[i] * (1 - sa));
  bm[i + 1] = Math.round(g * sa + bm[i + 1] * (1 - sa));
  bm[i + 2] = Math.round(b * sa + bm[i + 2] * (1 - sa));
  bm[i + 3] = 255;
}

function fillRect(bm: Uint8Array, x: number, y: number, w: number, h: number, color: Rgba): void {
  for (let dy = 0; dy < h; dy++) {
    for (let dx = 0; dx < w; dx++) putPixel(bm, x + dx, y + dy, color);
  }
}

function strokeRect(
  bm: Uint8Array,
  x: number,
  y: number,
  w: number,
  h: number,
  color: Rgba,
  dashes = false,
): void {
  for (let i = 0; i < w; i++) {
    if (!dashes || i % 16 < 10) {
      putPixel(bm, x + i, y, color);
      putPixel(bm, x + i, y + h - 1, color);
    }
  }
  for (let i = 0; i < h; i++) {
    if (!dashes || i % 16 < 10) {
      putPixel(bm, x, y + i, color);
      putPixel(bm, x + w - 1, y + i, color);
    }
  }
}

function measureText(text: string, scale: number): number {
  return text.length * 6 * scale - scale;
}

function drawText(
  bm: Uint8Array,
  x: number,
  y: number,
  text: string,
  scale: number,
  color: Rgba,
): void {
  text
    .toUpperCase()
    .split('')
    .forEach((char, col) => {
      const glyph = GLYPHS[char] ?? GLYPHS['?'];
      glyph.forEach((row, rowIndex) => {
        const bits = Number.parseInt(row, 2);
        for (let bit = 0; bit < 5; bit++) {
          if ((bits >> (4 - bit)) & 1) {
            fillRect(bm, x + (col * 6 + bit) * scale, y + rowIndex * scale, scale, scale, color);
          }
        }
      });
    });
}

function drawCenteredText(
  bm: Uint8Array,
  centerY: number,
  text: string,
  scale: number,
  color: Rgba,
): void {
  drawText(bm, Math.round((WIDTH - measureText(text, scale)) / 2), centerY, text, scale, color);
}

function drawArrow(bm: Uint8Array, cx: number, cy: number, size: number, color: Rgba): void {
  fillRect(bm, cx - size, cy - size / 6, size * 2, Math.max(1, Math.floor(size / 3)), color);
  for (let i = 0; i < size; i++) {
    fillRect(bm, cx + size - i, cy - i, Math.max(1, Math.floor(i / 2)) + 1, i * 2 + 1, color);
  }
}

// ── image specs ──

interface ImageSpec {
  file: string;
  title: string;
  lines: string[];
}

const SPECS: ImageSpec[] = [
  {
    file: 'brave-drag-drop.webp',
    title: 'Brave',
    lines: ['DRAG & DROP BERKAS .ZIP', 'KE HALAMAN EKSTENSI'],
  },
  {
    file: 'chrome-drag-drop.webp',
    title: 'Chrome',
    lines: ['DRAG & DROP BERKAS .ZIP', 'KE HALAMAN EKSTENSI'],
  },
  {
    file: 'firefox-install-from-file.webp',
    title: 'Firefox',
    lines: ['INSTALL ADD-ON FROM FILE', 'PILIH BERKAS .XPI'],
  },
  {
    file: 'edge-drag-drop.webp',
    title: 'Edge',
    lines: ['DRAG & DROP BERKAS .ZIP', 'KE HALAMAN EKSTENSI'],
  },
  {
    file: 'firefox-android-debug-menu.webp',
    title: 'Firefox Android',
    lines: ['KETUK LOGO 5 KALI', 'PENGATURAN -> TENTANG FIREFOX'],
  },
  {
    file: 'firefox-android-install-from-file.webp',
    title: 'Firefox Android',
    lines: ['PENGATURAN ->', 'INSTALL EXTENSION FROM FILE'],
  },
  {
    file: 'token-generator-form.webp',
    title: 'Token Generator',
    lines: ['PRIVATE KEY + PENGATURAN TOKEN'],
  },
  {
    file: 'share-page-apply.webp',
    title: 'Halaman Share',
    lines: ['TOMBOL TERAPKAKAN DANDELION'],
  },
  {
    file: 'extension-token-panel.webp',
    title: 'Panel Dandelion',
    lines: ['AKTIFKAN TOKEN'],
  },
  {
    file: 'skrining-radio-fill.webp',
    title: 'Skrining',
    lines: ['HALAMAN SKRINING + TOMBOL', 'ISI RADIO OTOMATIS'],
  },
  {
    file: 'skrining-form-auto-fill.webp',
    title: 'Skrining Form',
    lines: ['FORMULIR + TOMBOL AUTO-FILL', 'KIRIM MUNCUL SETELAH TERISI'],
  },
  {
    file: 'register-form-flow.webp',
    title: 'Registration Form',
    lines: ['TOMBOL MULAI + STATUS ALUR', 'MULAI 1/4 SAMPAI SELESAI'],
  },
  {
    file: 'zen-zero-panel.webp',
    title: 'Zen & Zero Mode',
    lines: ['PANEL KONTROL ZEN (TOMBOL) DAN', 'ZERO DI HALAMAN DAFTAR'],
  },
  {
    file: 'flash-data-panel.webp',
    title: 'Flash Data',
    lines: ['PANEL DATA SEMENTARA', 'DI HALAMAN KERJA'],
  },
];

function render(spec: ImageSpec): Uint8Array {
  const bm = new Uint8Array(WIDTH * HEIGHT * 4);
  fillRect(bm, 0, 0, WIDTH, HEIGHT, BG);

  // dropped-file card on the left, browser window on the right, arrow between
  const winX = 460;
  const winY = 120;
  const winW = 440;
  const winH = 300;
  const fileX = 90;
  const fileY = 210;
  const fileW = 150;
  const fileH = 190;

  strokeRect(bm, 24, 24, WIDTH - 48, HEIGHT - 48, ACCENT, true);

  // file card (.zip)
  fillRect(bm, fileX, fileY, fileW, fileH, CARD);
  strokeRect(bm, fileX, fileY, fileW, fileH, BORDER);
  fillRect(bm, fileX + 16, fileY + 16, fileW - 32, 10, ACCENT);
  drawText(bm, fileX + 30, fileY + 52, '.ZIP', 4, TEXT);
  fillRect(bm, fileX + 22, fileY + 90, fileW - 44, 8, BORDER);
  fillRect(bm, fileX + 22, fileY + 108, fileW - 70, 8, BORDER);
  fillRect(bm, fileX + 22, fileY + 126, fileW - 58, 8, BORDER);

  // arrow
  drawArrow(bm, 330, 300, 34, ACCENT);

  // mock browser window
  fillRect(bm, winX, winY, winW, winH, CARD);
  strokeRect(bm, winX, winY, winW, winH, BORDER);
  fillRect(bm, winX, winY, winW, 34, [26, 26, 38, 255]);
  fillRect(bm, winX + 14, winY + 12, 10, 10, MUTED);
  fillRect(bm, winX + 32, winY + 12, 10, 10, MUTED);
  fillRect(bm, winX + 50, winY + 12, 10, 10, MUTED);
  fillRect(bm, winX + 76, winY + 8, winW - 160, 18, BG);
  fillRect(bm, winX + 86, winY + 13, 60, 8, ACCENT_SOFT);

  // extension card inside the window
  const cardX = winX + 40;
  const cardY = winY + 70;
  fillRect(bm, cardX, cardY, winW - 80, 90, BG);
  strokeRect(bm, cardX, cardY, winW - 80, 90, BORDER);
  fillRect(bm, cardX + 16, cardY + 24, 40, 40, ACCENT);
  drawText(bm, cardX + 72, cardY + 24, 'DANDELION', 3, TEXT);
  fillRect(bm, cardX + 72, cardY + 44, 120, 6, BORDER);
  fillRect(bm, cardX + 72, cardY + 58, 90, 6, BORDER);
  drawText(bm, cardX + 16, cardY + 116, 'DEVELOPER MODE AKTIF', 2, ACCENT);

  drawCenteredText(bm, 452, `PLACEHOLDER: ${spec.title}`, 3, TEXT);
  spec.lines.forEach((line, i) => drawCenteredText(bm, 478 + i * 14, line, 2, MUTED));

  return encodeWebp(bm);
}

// ── main ──

function main(): void {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const only = args.filter((arg) => !arg.startsWith('--'));

  const specs = SPECS.filter((spec) => only.length === 0 || only.includes(spec.file));
  if (specs.length === 0) {
    console.error(`No matching specs. Available: ${SPECS.map((s) => s.file).join(', ')}`);
    process.exit(1);
  }

  console.log('\n  Dandelion Doc Images');
  for (const spec of specs) {
    const file = join(ASSETS_DIR, spec.file);
    if (existsSync(file) && !force && !only.includes(spec.file)) {
      console.log(`  skip ${spec.file} (already exists, use --force)`);
      continue;
    }
    writeFileSync(file, render(spec));
    console.log(`  ${spec.file}`);
  }
  console.log('');
}

main();
