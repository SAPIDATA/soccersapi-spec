#!/usr/bin/env node
// Probe every documented SoccersAPI operation with the credentials in .env and
// record the HTTP status, timing and response shape of each one.
//
//   node scripts/probe.mjs                # run every operation
//   node scripts/probe.mjs --only=fixtures  # substring filter on id/route
//   node scripts/probe.mjs --dry           # print the URLs (token masked)
//   node scripts/probe.mjs --delay=500     # ms between requests (default 250)
//
// Responses are written to tmp/probe/<id>.json (git-ignored) together with
// summary.json and summary.md. The token is never printed.

import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.SOCCERSAPI_BASE_URL || 'https://api.soccersapi.com';

function loadEnv() {
  const file = resolve(root, '.env');
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (!m || m[1] in process.env) continue;
    process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}

function args() {
  const out = { only: '', dry: false, delay: 250 };
  for (const a of process.argv.slice(2)) {
    if (a === '--dry') out.dry = true;
    else if (a.startsWith('--only=')) out.only = a.slice(7);
    else if (a.startsWith('--delay=')) out.delay = Number(a.slice(8)) || 0;
  }
  return out;
}

function typeOf(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return `array(${v.length})`;
  return typeof v;
}

function shape(payload) {
  const data = payload?.data;
  const meta = payload?.meta ?? {};
  const out = { dataType: typeOf(data), count: null, keys: [], itemKeys: [] };
  if (Array.isArray(data)) {
    out.count = data.length;
    const first = data.find((x) => x && typeof x === 'object');
    if (first) out.itemKeys = Object.entries(first).map(([k, v]) => `${k}:${typeOf(v)}`);
  } else if (data && typeof data === 'object') {
    out.keys = Object.entries(data).map(([k, v]) => `${k}:${typeOf(v)}`);
  }
  out.meta = Object.fromEntries(
    Object.entries(meta).filter(([k]) => k !== 'user').map(([k, v]) => [k, typeOf(v) === 'string' || typeof v === 'number' ? v : typeOf(v)])
  );
  out.msg = payload?.msg ?? meta?.msg ?? null;
  return out;
}

async function main() {
  loadEnv();
  const { only, dry, delay } = args();
  const user = process.env.SOCCERSAPI_USER;
  const token = process.env.SOCCERSAPI_TOKEN;
  if (!dry && (!user || !token)) {
    console.error('Missing SOCCERSAPI_USER / SOCCERSAPI_TOKEN (see .env.example).');
    process.exit(1);
  }
  const ops = JSON.parse(readFileSync(resolve(root, 'scripts/operations.json'), 'utf8'))
    .filter((op) => !only || op.id.includes(only) || op.route.includes(only));
  const outDir = resolve(root, 'tmp/probe');
  mkdirSync(outDir, { recursive: true });
  const results = [];

  for (const op of ops) {
    const url = new URL(op.route, BASE);
    for (const [k, v] of Object.entries(op.query || {})) url.searchParams.set(k, String(v));
    const shown = `${url.pathname}${url.search}`;
    if (dry) {
      console.log(`${op.id.padEnd(34)} ${shown}`);
      continue;
    }
    url.searchParams.set('user', user);
    url.searchParams.set('token', token);
    const started = Date.now();
    const row = { id: op.id, request: shown, status: null, ms: null, error: null, shape: null };
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
      row.status = res.status;
      row.ms = Date.now() - started;
      const text = await res.text();
      let body;
      try { body = JSON.parse(text); } catch { body = { _raw: text.slice(0, 500) }; }
      writeFileSync(resolve(outDir, `${op.id}.json`), JSON.stringify(body, null, 2));
      row.shape = shape(body);
    } catch (err) {
      row.ms = Date.now() - started;
      row.error = String(err?.message || err).replace(token, '***');
    }
    results.push(row);
    const s = row.shape;
    console.log(
      `${String(row.status ?? 'ERR').padEnd(4)} ${String(row.ms).padStart(5)}ms ${op.id.padEnd(34)} ` +
        (s ? `${s.dataType}${s.count != null ? ` n=${s.count}` : ''}${s.msg ? ` msg="${s.msg}"` : ''}` : row.error)
    );
    if (delay) await new Promise((r) => setTimeout(r, delay));
  }
  if (dry) return;

  writeFileSync(resolve(outDir, 'summary.json'), JSON.stringify(results, null, 2));
  const md = ['| Operation | Request | Status | ms | data | count | msg |', '| --- | --- | --- | --- | --- | --- | --- |'];
  for (const r of results) {
    md.push(`| ${r.id} | \`${r.request}\` | ${r.status ?? 'ERR'} | ${r.ms} | ${r.shape?.dataType ?? ''} | ${r.shape?.count ?? ''} | ${r.shape?.msg ?? r.error ?? ''} |`);
  }
  writeFileSync(resolve(outDir, 'summary.md'), md.join('\n') + '\n');
  const ok = results.filter((r) => r.status === 200).length;
  console.log(`\n${ok}/${results.length} operations returned 200. Details in tmp/probe/summary.md`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
