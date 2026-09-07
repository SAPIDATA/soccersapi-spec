#!/usr/bin/env node
// Data coverage sweep: for every league the account can read, fetch the
// current season's fixtures with every dataset included and measure which
// datasets the matches actually carry.
//
//   node scripts/coverage.mjs                 # every league of the plan
//   node scripts/coverage.mjs --limit=25      # first N leagues (pilot)
//   node scripts/coverage.mjs --resume        # skip leagues already in tmp/coverage/
//   node scripts/coverage.mjs --env=.env.odds --out=tmp/coverage-odds
//
// Two requests per league (league profile, season fixtures). Results:
//   tmp/coverage/<leagueId>.json   per-league summary
//   tmp/coverage/coverage.json     all leagues
//   tmp/coverage/coverage.csv      spreadsheet-friendly

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = process.env.SOCCERSAPI_BASE_URL || 'https://api.soccersapi.com';
const args = Object.fromEntries(process.argv.slice(2).map((a) => { const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [m[1], m[2] ?? true] : [a, true]; }));
const OUT = resolve(root, args.out || 'tmp/coverage');
const DELAY = Number(args.delay || 200);
const LIMIT = Number(args.limit || 0);

function loadEnv() {
  for (const name of [args.env, '.env.local', '.env'].filter(Boolean)) {
    const file = resolve(root, name);
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
      const m = line.match(/^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
    }
  }
}
loadEnv();
const USER = process.env.SOCCERSAPI_USER, TOKEN = process.env.SOCCERSAPI_TOKEN;
if (!USER || !TOKEN) { console.error('Missing SOCCERSAPI_USER / SOCCERSAPI_TOKEN'); process.exit(1); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let requests = 0;
async function call(route, query) {
  const url = new URL(route, BASE);
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, String(v));
  url.searchParams.set('user', USER); url.searchParams.set('token', TOKEN);
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      requests++;
      const res = await fetch(url, { signal: AbortSignal.timeout(90000) });
      const body = await res.json().catch(() => ({}));
      if (res.status === 429) { await sleep(30000 * attempt); continue; }
      return { status: res.status, body };
    } catch (err) {
      if (attempt === 3) return { status: 0, body: { error: String(err.message || err) } };
      await sleep(2000 * attempt);
    }
  }
}

// The unfiltered league list omits id_current_season, the per-country list
// carries it, so discover leagues country by country (continents are listed
// as countries too, which covers the international competitions).
async function allLeagues() {
  const countries = [];
  for (let page = 1, pages = 1; page <= pages; page++) {
    const { status, body } = await call('/v2.2/countries/', { t: 'list', page });
    if (status !== 200) throw new Error(`countries page ${page}: ${status} ${body?.meta?.msg || ''}`);
    countries.push(...body.data); pages = body.meta.pages; await sleep(DELAY);
  }
  const out = new Map();
  for (const c of countries) {
    for (let page = 1, pages = 1; page <= pages; page++) {
      const { status, body } = await call('/v2.2/leagues/', { t: 'list', country_id: c.id, page });
      if (status !== 200) break;
      for (const l of body.data) out.set(String(l.id), { ...l, country: l.country || { id: c.id, name: c.name } });
      pages = body.meta.pages; await sleep(DELAY);
    }
  }
  return [...out.values()];
}

const pct = (n, d) => (d ? Math.round((100 * n) / d) : null);
const nonEmpty = (v) => Array.isArray(v) ? v.length > 0 : v && typeof v === 'object' ? Object.keys(v).length > 0 : false;

async function sweepLeague(l) {
  const summary = { league_id: l.id, league: l.name, country: l.country?.name || null, is_cup: l.is_cup, season_id: l.id_current_season || null, season: null };
  if (!summary.season_id) {
    // Fall back to the league profile: seasons[] is newest first.
    const info = await call('/v2.2/leagues/', { t: 'info', id: l.id }); await sleep(DELAY);
    const seasons = info.body?.data?.seasons || [];
    summary.season_id = info.body?.data?.id_current_season || seasons[0]?.id || null;
    if (!summary.season_id) { summary.note = 'no season'; return summary; }
    summary.season_fallback = true;
  }
  const fx = await call('/v2.2/fixtures/', { t: 'season', season_id: summary.season_id, include: 'events,stats,broadcast,odds_prematch' });
  await sleep(DELAY);
  if (fx.status !== 200) { summary.note = `fixtures ${fx.status} ${fx.body?.meta?.msg || ''}`.trim(); return summary; }
  const matches = fx.body.data || [];
  const finished = matches.filter((m) => [3, 31, 32, '3', '31', '32'].includes(m.status));
  const started = matches.filter((m) => !['0', 0, 4, '4', 5, '5', 17, '17'].includes(m.status));
  summary.season = matches[0]?.season_name || null;
  summary.matches = matches.length;
  summary.finished = finished.length;
  summary.seasons_known = Array.isArray(l.seasons) ? l.seasons.length : null;
  summary.flags = {
    has_lineups: pct(matches.filter((m) => m.coverage?.has_lineups == 1).length, matches.length),
    has_tvs: pct(matches.filter((m) => m.coverage?.has_tvs == 1).length, matches.length),
    has_standings: pct(matches.filter((m) => m.coverage?.has_standings == 1).length, matches.length),
  };
  summary.datasets = {
    events: pct(finished.filter((m) => nonEmpty(m.events)).length, finished.length),
    stats: pct(finished.filter((m) => nonEmpty(m.stats)).length, finished.length),
    broadcast: pct(matches.filter((m) => nonEmpty(m.broadcast)).length, matches.length),
    odds_prematch: pct(matches.filter((m) => nonEmpty(m.odds_prematch)).length, matches.length),
    scores_ht: pct(finished.filter((m) => m.scores?.ht_score).length, finished.length),
    venue: pct(matches.filter((m) => m.venue_id).length, matches.length),
    referee: pct(started.filter((m) => m.referee_id).length, started.length),
    weather: pct(matches.filter((m) => nonEmpty(m.weather_report)).length, matches.length),
    kit_colors: pct(matches.filter((m) => nonEmpty(m.teams?.home?.kit_colors)).length, matches.length),
  };
  return summary;
}

async function main() {
  mkdirSync(OUT, { recursive: true });
  // Cache the discovery (142 requests) so --resume runs go straight to the leagues.
  const cache = resolve(OUT, 'leagues.json');
  let leagues;
  if (args.resume && existsSync(cache)) leagues = JSON.parse(readFileSync(cache, 'utf8'));
  else { leagues = await allLeagues(); writeFileSync(cache, JSON.stringify(leagues)); }
  const todo = (LIMIT ? leagues.slice(0, LIMIT) : leagues).filter((l) => !(args.resume && existsSync(resolve(OUT, `${l.id}.json`))));
  console.log(`${leagues.length} leagues in the plan; sweeping ${todo.length} (${requests} requests so far)`);
  const started = Date.now();
  for (const [i, l] of todo.entries()) {
    let s;
    try { s = await sweepLeague(l); } catch (err) { s = { league_id: l.id, league: l.name, note: String(err.message || err) }; }
    writeFileSync(resolve(OUT, `${l.id}.json`), JSON.stringify(s, null, 2));
    const d = s.datasets || {};
    console.log(`${String(i + 1).padStart(4)}/${todo.length} ${String(l.id).padEnd(6)} ${(l.name || '').slice(0, 34).padEnd(34)} ${s.note ? s.note : `m=${s.matches} fin=${s.finished} ev=${d.events}% st=${d.stats}% tv=${d.broadcast}% odds=${d.odds_prematch}% lineups=${s.flags.has_lineups}%`}`);
  }
  const all = readdirSync(OUT).filter((f) => /^\d+\.json$/.test(f)).map((f) => JSON.parse(readFileSync(resolve(OUT, f), 'utf8'))).sort((a, b) => String(a.country).localeCompare(String(b.country)) || String(a.league).localeCompare(String(b.league)));
  writeFileSync(resolve(OUT, 'coverage.json'), JSON.stringify({ generated: new Date().toISOString(), plan: null, leagues: all }, null, 1));
  const cols = ['league_id', 'league', 'country', 'is_cup', 'season_id', 'season', 'matches', 'finished', 'lineups%', 'tvs%', 'standings%', 'events%', 'stats%', 'broadcast%', 'odds%', 'ht_score%', 'venue%', 'referee%', 'weather%', 'kit%', 'note'];
  const csv = [cols.join(',')].concat(all.map((s) => [s.league_id, JSON.stringify(s.league || ''), JSON.stringify(s.country || ''), s.is_cup, s.season_id, JSON.stringify(s.season || ''), s.matches, s.finished, s.flags?.has_lineups, s.flags?.has_tvs, s.flags?.has_standings, s.datasets?.events, s.datasets?.stats, s.datasets?.broadcast, s.datasets?.odds_prematch, s.datasets?.scores_ht, s.datasets?.venue, s.datasets?.referee, s.datasets?.weather, s.datasets?.kit_colors, JSON.stringify(s.note || '')].map((v) => v ?? '').join(','))).join('\n');
  writeFileSync(resolve(OUT, 'coverage.csv'), csv + '\n');
  console.log(`\n${all.length} leagues summarised in ${Math.round((Date.now() - started) / 60000)} min, ${requests} requests. ${OUT}/coverage.csv`);
}
main().catch((e) => { console.error(e); process.exit(1); });
