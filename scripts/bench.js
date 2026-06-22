#!/usr/bin/env node
/**
 * bench.js — Mikro-benchmark untuk membandingkan Node vs Bun per-script.
 *
 * Cara pakai:
 *   node bench.js --script scripts/build-chrome-manifest.js --runs 20 --warmup 3
 *   node bench.js --all                # jalankan semua script yang terdaftar di CONFIG
 *   node bench.js --startup-only        # cuma ukur overhead cold-start bun vs node
 *
 * Prinsip:
 *  1. Pisahkan overhead cold-start proses dari waktu eksekusi logic script.
 *  2. Buang N run pertama (warm-up) sebelum mulai mencatat.
 *  3. Catat median & stddev, bukan cuma average (average gampang dirusak outlier).
 *  4. Bandingkan runtime yang sama persis dieksekusi lewat node dan bun,
 *     biar variabel yang berubah HANYA runtime-nya.
 */

import { spawnSync } from 'child_process';
import path from 'path';

// ---- Daftar script yang mau diuji. Sesuaikan args kalau script butuh argumen. ----
const CONFIG = [
  { name: 'build-chrome-manifest', file: 'scripts/build-chrome-manifest.js', args: [] },
  { name: 'build-firefox-manifest', file: 'scripts/build-firefox-manifest.js', args: [] },
  { name: 'remove-static', file: 'scripts/remove-static.js', args: ['dist/chrome'] },
  { name: 'package', file: 'scripts/package.js', args: ['chrome'] },
];

const RUNTIMES = ['node', 'bun'];

function parseArgs(argv) {
  const out = { runs: 15, warmup: 3, all: false, startupOnly: false, script: null, cwd: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--runs') out.runs = parseInt(argv[++i], 10);
    else if (a === '--warmup') out.warmup = parseInt(argv[++i], 10);
    else if (a === '--all') out.all = true;
    else if (a === '--startup-only') out.startupOnly = true;
    else if (a === '--script') out.script = argv[++i];
    else if (a === '--cwd') out.cwd = argv[++i];
  }
  return out;
}

function median(arr) {
  const s = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
}

function stddev(arr, mean) {
  const variance = arr.reduce((acc, v) => acc + (v - mean) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

/**
 * Menjalankan satu proses dan mengukur wall-clock time dari sisi luar
 * (bukan dari dalam script). Ini menangkap TOTAL waktu termasuk cold-start
 * proses runtime itu sendiri (node/bun startup, module resolution, dll).
 */
function runOnce(cmd, args, cwd) {
  const start = process.hrtime.bigint();
  const result = spawnSync(cmd, args, { cwd, stdio: 'ignore' });
  const end = process.hrtime.bigint();
  const ms = Number(end - start) / 1e6;
  return { ms, status: result.status, error: result.error };
}

/**
 * Jalankan N kali, buang `warmup` run pertama, lalu hitung statistik
 * dari sisa run yang "sudah panas" (disk cache, OS scheduler stabil).
 */
function benchmark(cmd, args, cwd, runs, warmup) {
  const all = [];
  for (let i = 0; i < runs + warmup; i++) {
    const r = runOnce(cmd, args, cwd);
    if (r.error || (r.status !== 0 && r.status !== null)) {
      return { error: r.error?.message ?? `exit code ${r.status}`, raw: all };
    }
    all.push(r.ms);
  }
  const warm = all.slice(warmup); // buang warm-up run
  return {
    raw: all,
    warm,
    median: median(warm),
    mean: mean(warm),
    stddev: stddev(warm, mean(warm)),
    min: Math.min(...warm),
    max: Math.max(...warm),
  };
}

function printStats(label, stats) {
  if (stats.error) {
    console.log(`  ${label}: ERROR — ${stats.error}`);
    return;
  }
  console.log(
    `  ${label}: median=${stats.median.toFixed(2)}ms  mean=${stats.mean.toFixed(2)}ms  ` +
      `stddev=${stats.stddev.toFixed(2)}ms  range=[${stats.min.toFixed(2)}, ${stats.max.toFixed(2)}]`,
  );
}

/**
 * Ukur overhead cold-start murni: proses kosong yang langsung exit.
 * Ini mengisolasi "biaya nyalain runtime" dari "biaya logic script".
 */
function benchStartupOnly(runs, warmup) {
  console.log(`\n=== Cold-start overhead (proses kosong, ${runs} run + ${warmup} warmup dibuang) ===`);
  for (const rt of RUNTIMES) {
    const stats = benchmark(rt, ['-e', ''], process.cwd(), runs, warmup);
    printStats(rt, stats);
  }
}

function compareScript(scriptConf, cwd, runs, warmup) {
  console.log(`\n=== ${scriptConf.name} (${scriptConf.file}) ===`);
  const results = {};
  for (const rt of RUNTIMES) {
    const stats = benchmark(rt, [scriptConf.file, ...scriptConf.args], cwd, runs, warmup);
    printStats(rt, stats);
    results[rt] = stats;
  }
  if (!results.node.error && !results.bun.error) {
    const delta = results.bun.median - results.node.median;
    const pct = (delta / results.node.median) * 100;
    const verdict = delta < 0 ? 'Bun lebih cepat' : 'Node lebih cepat';
    console.log(`  -> Selisih median: ${delta.toFixed(2)}ms (${pct.toFixed(1)}%) — ${verdict}`);
  }
  return results;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const cwd = opts.cwd ? path.resolve(opts.cwd) : process.cwd();

  console.log(`Working dir: ${cwd}`);
  console.log(`Runs efektif: ${opts.runs}, warm-up dibuang: ${opts.warmup}`);
  console.log('Catatan: tutup aplikasi berat & disable AV real-time scan dulu untuk hasil stabil.\n');

  if (opts.startupOnly) {
    benchStartupOnly(opts.runs, opts.warmup);
    return;
  }

  if (opts.all) {
    const allResults = CONFIG.map((c) => compareScript(c, cwd, opts.runs, opts.warmup));
    console.log('\n=== Ringkasan ===');
    CONFIG.forEach((c, i) => {
      const r = allResults[i];
      if (r.node.error || r.bun.error) {
        console.log(`  ${c.name}: gagal dijalankan, lihat detail di atas`);
        return;
      }
      const delta = r.bun.median - r.node.median;
      console.log(`  ${c.name}: ${delta < 0 ? 'Bun' : 'Node'} lebih cepat oleh ${Math.abs(delta).toFixed(2)}ms`);
    });
    return;
  }

  if (opts.script) {
    const conf = CONFIG.find((c) => c.file === opts.script) ?? {
      name: path.basename(opts.script),
      file: opts.script,
      args: [],
    };
    compareScript(conf, cwd, opts.runs, opts.warmup);
    return;
  }

  console.log('Pakai --all, --script <path>, atau --startup-only. Lihat komentar di atas file untuk contoh.');
}

main();
