#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const BASE = 'https://v3.football.api-sports.io';
const KEY = process.env.API_FOOTBALL_KEY;
const REPORT = process.argv[2] || 'artifacts/api-football-free-probe-v5.json';
const FREE = 2024;
const MIN_GAP_MS = 12000;

if (!KEY) throw new Error('API_FOOTBALL_KEY is required.');

let lastCallAt = 0;
let calls = 0;
const failures = [];
const quota = [];
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const norm = v => String(v || '').toLowerCase().replace(/[^a-z0-9]/g, '');

function errs(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === 'object') return Object.entries(value).map(([k, v]) => `${k}: ${String(v)}`);
  return [String(value)];
}

async function once(endpoint, params) {
  const elapsed = Date.now() - lastCallAt;
  const wait = lastCallAt === 0 ? 20000 : Math.max(0, MIN_GAP_MS - elapsed);
  if (wait) await sleep(wait);
  lastCallAt = Date.now();

  const url = new URL(`${BASE}${endpoint}`);
  for (const [k, v] of Object.entries(params || {})) if (v !== null && v !== undefined && v !== '') url.searchParams.set(k, String(v));
  calls += 1;
  const response = await fetch(url, { headers: { Accept: 'application/json', 'x-apisports-key': KEY }, signal: AbortSignal.timeout(30000) });
  const remaining = response.headers.get('x-ratelimit-requests-remaining');
  const limit = response.headers.get('x-ratelimit-requests-limit');
  quota.push({ endpoint, remaining: remaining == null ? null : Number(remaining), limit: limit == null ? null : Number(limit) });
  const payload = JSON.parse(await response.text() || '{}');
  const errors = errs(payload.errors);
  if (!response.ok || errors.length) {
    const e = new Error(`${endpoint}: ${errors.join('; ') || response.statusText}`);
    e.status = response.status;
    e.rateLimited = response.status === 429 || /ratelimit|too many requests/i.test(e.message);
    throw e;
  }
  return payload;
}

async function request(endpoint, params = {}) {
  try { return await once(endpoint, params); }
  catch (e) {
    if (!e.rateLimited) throw e;
    await sleep(65000);
    return once(endpoint, params);
  }
}

async function safe(label, fn) {
  try { return { ok: true, data: await fn() }; }
  catch (e) {
    failures.push({ label, status: e.status || null, message: e.message });
    return { ok: false, error: e.message };
  }
}

function chooseTeam(rows, wanted) {
  const n = norm(wanted);
  return rows.find(r => norm(r.team?.name) === n) || rows.find(r => norm(r.team?.name).includes(n)) || rows[0] || null;
}

function squad(payload) {
  const block = payload.response?.[0] || {};
  const players = block.players || [];
  return { team: block.team?.name ?? null, count: players.length, sample: players.slice(0, 10).map(p => ({ name: p.name, age: p.age ?? null, number: p.number ?? null, position: p.position ?? null })) };
}

function stats(payload) {
  const rows = payload.response || [];
  return { countOnPage: rows.length, totalPages: payload.paging?.total ?? null, sample: rows.slice(0, 5).map(r => {
    const s = r.statistics?.[0] || {};
    return { name: r.player?.name ?? null, age: r.player?.age ?? null, nationality: r.player?.nationality ?? null, height: r.player?.height ?? null, weight: r.player?.weight ?? null, position: s.games?.position ?? null, appearances: s.games?.appearences ?? null, minutes: s.games?.minutes ?? null, rating: s.games?.rating ?? null, goals: s.goals?.total ?? null, assists: s.goals?.assists ?? null, passes: s.passes?.total ?? null, tackles: s.tackles?.total ?? null, duels: s.duels?.total ?? null };
  }) };
}

async function lowerLeague(leagueId, leagueName, preferredTeam) {
  const teams = await safe(`${leagueName}-teams`, () => request('/teams', { league: leagueId, season: FREE }));
  const rows = teams.ok ? teams.data.response || [] : [];
  const chosen = chooseTeam(rows, preferredTeam);
  const out = { leagueId, leagueName, teamCount: rows.length, representativeTeam: chosen ? { id: chosen.team.id, name: chosen.team.name } : null, endpoints: {} };
  if (!chosen?.team?.id) return out;
  const teamId = chosen.team.id;

  const sq = await safe(`${leagueName}-current-squad`, () => request('/players/squads', { team: teamId }));
  out.endpoints.currentSquad = sq.ok ? { ok: true, ...squad(sq.data) } : { ok: false, error: sq.error };

  const st = await safe(`${leagueName}-2024-stats`, () => request('/players', { team: teamId, season: FREE, page: 1 }));
  out.endpoints.playerStats2024 = st.ok ? { ok: true, ...stats(st.data) } : { ok: false, error: st.error };
  return out;
}

async function historicalFormation() {
  const fixtures = await safe('premier-league-2024-fixtures', () => request('/fixtures', { league: 39, season: FREE }));
  if (!fixtures.ok) return { ok: false, error: fixtures.error };
  const rows = fixtures.data.response || [];
  const finished = rows.filter(r => ['FT', 'AET', 'PEN'].includes(r.fixture?.status?.short));
  const match = finished[finished.length - 1] || rows[rows.length - 1];
  if (!match?.fixture?.id) return { ok: false, error: 'No fixture id returned' };
  const lineups = await safe('premier-league-2024-lineup', () => request('/fixtures/lineups', { fixture: match.fixture.id }));
  return lineups.ok ? { ok: true, fixtureId: match.fixture.id, date: match.fixture.date, teams: (lineups.data.response || []).map(x => ({ team: x.team?.name ?? null, formation: x.formation ?? null, coach: x.coach?.name ?? null, starters: x.startXI?.length || 0 })) } : { ok: false, error: lineups.error };
}

async function europeanSearch(search) {
  const res = await safe(`europe-${search}`, () => request('/leagues', { search }));
  if (!res.ok) return { search, found: false, error: res.error };
  const matches = (res.data.response || []).filter(r => norm(r.league?.name).includes(norm(search)));
  const selected = matches[0] || null;
  return selected ? {
    search,
    found: true,
    leagueId: selected.league.id,
    name: selected.league.name,
    has2024: (selected.seasons || []).some(s => Number(s.year) === 2024),
    has2026Metadata: (selected.seasons || []).some(s => Number(s.year) === 2026)
  } : { search, found: false };
}

async function main() {
  const leagueTwo = await lowerLeague(42, 'League Two', 'Walsall');
  const nationalLeague = await lowerLeague(43, 'National League', 'York');
  const formation = await historicalFormation();
  const europe = [];
  for (const name of ['Champions League', 'Europa League', 'Conference League']) europe.push(await europeanSearch(name));

  const last = [...quota].reverse().find(q => Number.isFinite(q.remaining));
  const output = {
    probe: 'API-Football Free Plan — FLM Focused Lower-League Probe v5',
    generatedAt: new Date().toISOString(),
    usage: { callsMade: calls, lastKnownRemaining: last?.remaining ?? null, reportedLimit: last?.limit ?? null },
    leagueTwo,
    nationalLeague,
    historicalFormation: formation,
    europeanCompetitions: europe,
    verdict: {
      leagueTwoCurrentSquadUsable: !!(leagueTwo.endpoints?.currentSquad?.ok && leagueTwo.endpoints.currentSquad.count >= 15),
      nationalLeagueCurrentSquadUsable: !!(nationalLeague.endpoints?.currentSquad?.ok && nationalLeague.endpoints.currentSquad.count >= 15),
      leagueTwo2024StatsUsable: !!(leagueTwo.endpoints?.playerStats2024?.ok && leagueTwo.endpoints.playerStats2024.countOnPage > 0),
      nationalLeague2024StatsUsable: !!(nationalLeague.endpoints?.playerStats2024?.ok && nationalLeague.endpoints.playerStats2024.countOnPage > 0),
      historicalFormationUsable: !!(formation.ok && formation.teams?.some(t => t.formation)),
      europeanMetadataFound: europe.filter(x => x.found).length
    },
    failures,
    security: { apiKeyPersisted: false, apiKeyPrinted: false, rawPayloadsCommitted: false, sanitisedReportOnly: true }
  };

  await mkdir(path.dirname(REPORT), { recursive: true });
  await writeFile(REPORT, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(`Calls ${calls}; League Two squad ${output.verdict.leagueTwoCurrentSquadUsable}; National squad ${output.verdict.nationalLeagueCurrentSquadUsable}; formation ${output.verdict.historicalFormationUsable}; Europe ${output.verdict.europeanMetadataFound}/3.`);
}

main().catch(async e => {
  console.error(e.stack || e.message || e);
  await mkdir(path.dirname(REPORT), { recursive: true });
  await writeFile(REPORT, `${JSON.stringify({ probe: 'API-Football Free Plan — FLM Focused Lower-League Probe v5', generatedAt: new Date().toISOString(), fatalError: { message: e.message }, callsMade: calls, security: { apiKeyPersisted: false, apiKeyPrinted: false } }, null, 2)}\n`, 'utf8');
  process.exit(1);
});
