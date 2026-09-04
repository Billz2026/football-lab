#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const BASE = 'https://v3.football.api-sports.io';
const KEY = process.env.API_FOOTBALL_KEY;
const REPORT = process.argv[2] || 'artifacts/api-football-free-probe-v3.json';
const CURRENT = 2026;
const FREE = 2024;

if (!KEY) throw new Error('API_FOOTBALL_KEY is required.');

const targets = [
  ['Premier League', 'Arsenal'],
  ['Championship', 'Norwich'],
  ['League One', 'Bolton'],
  ['League Two', 'Walsall'],
  ['National League', 'York']
];

let calls = 0;
const failures = [];
const quota = [];
const norm = v => String(v || '').toLowerCase().replace(/[^a-z0-9]/g, '');

function normaliseErrors(errors) {
  if (!errors) return [];
  if (Array.isArray(errors)) return errors.map(String).filter(Boolean);
  if (typeof errors === 'object') return Object.entries(errors).map(([k, v]) => `${k}: ${String(v)}`);
  return [String(errors)];
}

async function request(endpoint, params = {}) {
  const url = new URL(`${BASE}${endpoint}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== null && v !== undefined && v !== '') url.searchParams.set(k, String(v));
  });
  calls += 1;
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'x-apisports-key': KEY },
    signal: AbortSignal.timeout(30000)
  });
  const remaining = response.headers.get('x-ratelimit-requests-remaining');
  const limit = response.headers.get('x-ratelimit-requests-limit');
  quota.push({ endpoint, remaining: remaining == null ? null : Number(remaining), limit: limit == null ? null : Number(limit) });
  const payload = JSON.parse(await response.text() || '{}');
  const errs = normaliseErrors(payload.errors);
  if (!response.ok || errs.length) {
    const e = new Error(`${endpoint}: ${errs.join('; ') || response.statusText}`);
    e.status = response.status;
    throw e;
  }
  return payload;
}

async function safe(label, fn) {
  try { return { ok: true, data: await fn() }; }
  catch (e) {
    failures.push({ label, status: e.status || null, message: e.message });
    return { ok: false, error: e.message };
  }
}

function leagueRow(rows, name) {
  const n = norm(name);
  return rows.find(r => norm(r.league?.name) === n) || rows.find(r => norm(r.league?.name).includes(n)) || null;
}

function teamRow(rows, name) {
  const n = norm(name);
  return rows.find(r => norm(r.team?.name) === n) || rows.find(r => norm(r.team?.name).includes(n)) || rows[0] || null;
}

function squadSummary(payload) {
  const block = payload.response?.[0] || {};
  const players = block.players || [];
  return {
    team: block.team?.name ?? null,
    count: players.length,
    withAge: players.filter(p => p.age != null).length,
    withNumber: players.filter(p => p.number != null).length,
    withPosition: players.filter(p => p.position).length,
    sample: players.slice(0, 8).map(p => ({ name: p.name, age: p.age ?? null, number: p.number ?? null, position: p.position ?? null }))
  };
}

function playerStatsSummary(payload) {
  const rows = payload.response || [];
  return {
    countOnPage: rows.length,
    totalPages: payload.paging?.total ?? null,
    sample: rows.slice(0, 5).map(r => {
      const s = r.statistics?.[0] || {};
      return {
        name: r.player?.name ?? null,
        age: r.player?.age ?? null,
        nationality: r.player?.nationality ?? null,
        height: r.player?.height ?? null,
        weight: r.player?.weight ?? null,
        position: s.games?.position ?? null,
        appearances: s.games?.appearences ?? null,
        minutes: s.games?.minutes ?? null,
        rating: s.games?.rating ?? null,
        goals: s.goals?.total ?? null,
        assists: s.goals?.assists ?? null,
        shots: s.shots?.total ?? null,
        passes: s.passes?.total ?? null,
        keyPasses: s.passes?.key ?? null,
        passAccuracy: s.passes?.accuracy ?? null,
        tackles: s.tackles?.total ?? null,
        interceptions: s.tackles?.interceptions ?? null,
        duels: s.duels?.total ?? null,
        duelsWon: s.duels?.won ?? null,
        dribbles: s.dribbles?.attempts ?? null,
        dribblesWon: s.dribbles?.success ?? null
      };
    })
  };
}

function transferSummary(payload) {
  let count = 0;
  let latestDate = null;
  const sample = [];
  for (const row of payload.response || []) {
    for (const t of row.transfers || []) {
      count += 1;
      if (t.date && (!latestDate || t.date > latestDate)) latestDate = t.date;
      if (sample.length < 6) sample.push({ player: row.player?.name ?? null, date: t.date ?? null, type: t.type ?? null, from: t.teams?.out?.name ?? null, to: t.teams?.in?.name ?? null });
    }
  }
  return { count, latestDate, sample };
}

async function main() {
  const currentSeason = await safe('current-2026-access', () => request('/leagues', { country: 'England', season: CURRENT }));
  const discovery = await safe('free-2024-discovery', () => request('/leagues', { country: 'England', season: FREE }));
  if (!discovery.ok) throw new Error(discovery.error);
  const leagueRows = discovery.data.response || [];

  const leagues = [];
  for (const [leagueName, preferredTeam] of targets) {
    const l = leagueRow(leagueRows, leagueName);
    if (!l) {
      leagues.push({ league: leagueName, found: false });
      continue;
    }
    const leagueId = l.league.id;
    const teamsRes = await safe(`${leagueName}-teams`, () => request('/teams', { league: leagueId, season: FREE }));
    const teams = teamsRes.ok ? teamsRes.data.response || [] : [];
    const chosen = teamRow(teams, preferredTeam);
    const entry = {
      league: leagueName,
      found: true,
      leagueId,
      freeSeasonTeamCount: teams.length,
      representativeTeam: chosen ? { id: chosen.team.id, name: chosen.team.name } : null,
      endpoints: {}
    };
    if (chosen?.team?.id) {
      const teamId = chosen.team.id;
      const squad = await safe(`${leagueName}-current-squad`, () => request('/players/squads', { team: teamId }));
      entry.endpoints.currentSquad = squad.ok ? { ok: true, ...squadSummary(squad.data) } : { ok: false, error: squad.error };

      const stats = await safe(`${leagueName}-2024-player-stats`, () => request('/players', { team: teamId, season: FREE, page: 1 }));
      entry.endpoints.playerStats2024 = stats.ok ? { ok: true, ...playerStatsSummary(stats.data) } : { ok: false, error: stats.error };

      const coach = await safe(`${leagueName}-current-coach`, () => request('/coachs', { team: teamId }));
      entry.endpoints.currentCoach = coach.ok ? { ok: true, coaches: (coach.data.response || []).slice(0, 3).map(c => ({ name: c.name, nationality: c.nationality ?? null, team: c.team?.name ?? null })) } : { ok: false, error: coach.error };

      const transfers = await safe(`${leagueName}-transfers`, () => request('/transfers', { team: teamId }));
      entry.endpoints.transfers = transfers.ok ? { ok: true, ...transferSummary(transfers.data) } : { ok: false, error: transfers.error };

      const fixture = await safe(`${leagueName}-2024-fixture`, () => request('/fixtures', { team: teamId, season: FREE, last: 1 }));
      const fixtureId = fixture.ok ? fixture.data.response?.[0]?.fixture?.id : null;
      if (fixtureId) {
        const lineup = await safe(`${leagueName}-2024-lineup`, () => request('/fixtures/lineups', { fixture: fixtureId }));
        entry.endpoints.formation2024 = lineup.ok ? {
          ok: true,
          teams: (lineup.data.response || []).map(x => ({ team: x.team?.name ?? null, formation: x.formation ?? null, coach: x.coach?.name ?? null, starters: x.startXI?.length || 0 }))
        } : { ok: false, error: lineup.error };
      } else {
        entry.endpoints.formation2024 = { ok: false, error: fixture.ok ? 'No fixture returned' : fixture.error };
      }
    }
    leagues.push(entry);
  }

  const european = [];
  for (const search of ['Champions League', 'Europa League', 'Conference League']) {
    const res = await safe(`europe-${search}`, () => request('/leagues', { search, season: FREE }));
    const match = res.ok ? (res.data.response || []).find(r => norm(r.league?.name).includes(norm(search))) : null;
    european.push(match ? { search, found: true, leagueId: match.league.id, name: match.league.name } : { search, found: false, error: res.ok ? null : res.error });
  }

  const found = leagues.filter(x => x.found).length;
  const currentSquads = leagues.filter(x => x.endpoints?.currentSquad?.ok && x.endpoints.currentSquad.count >= 15).length;
  const stats2024 = leagues.filter(x => x.endpoints?.playerStats2024?.ok && x.endpoints.playerStats2024.countOnPage > 0).length;
  const formations2024 = leagues.filter(x => x.endpoints?.formation2024?.ok && x.endpoints.formation2024.teams?.some(t => t.formation)).length;
  const transfersWith2026 = leagues.filter(x => String(x.endpoints?.transfers?.latestDate || '').startsWith('2026')).length;
  const lastQuota = [...quota].reverse().find(q => Number.isFinite(q.remaining));

  const developmentPass = found === 5 && currentSquads >= 4 && stats2024 >= 4;
  const output = {
    probe: 'API-Football Free Plan — FLM Capability Probe v3',
    generatedAt: new Date().toISOString(),
    currentSeasonTest: {
      season: CURRENT,
      accessible: currentSeason.ok,
      error: currentSeason.ok ? null : currentSeason.error
    },
    freeSeasonTested: FREE,
    usage: { callsMade: calls, lastKnownRemaining: lastQuota?.remaining ?? null, reportedLimit: lastQuota?.limit ?? null },
    leagues,
    european,
    summary: {
      englishLeaguesFound: `${found}/5`,
      seasonlessSquadsUsable: `${currentSquads}/5`,
      detailed2024PlayerStatsUsable: `${stats2024}/5`,
      formation2024Usable: `${formations2024}/5`,
      transferFeedsWith2026Records: `${transfersWith2026}/5`,
      europeanCompetitionsFound2024: `${european.filter(x => x.found).length}/3`
    },
    verdict: {
      developmentPass,
      fullyCurrentDatabasePossibleOnFreeTier: currentSeason.ok,
      conclusion: currentSeason.ok
        ? 'Current-season access unexpectedly succeeded; proceed to full 2026/27 English import testing.'
        : developmentPass
          ? 'Free API-Football is useful for FLM development and can provide seasonless squad/coach/transfer data plus detailed 2024 statistics, but it cannot directly provide 2026/27 competition membership or 2026/27 player statistics on this free subscription.'
          : 'Free API-Football is too restricted for the planned FLM workflow.'
    },
    failures,
    security: { apiKeyPersisted: false, apiKeyPrinted: false, rawPayloadsCommitted: false, reportIsSanitised: true }
  };

  await mkdir(path.dirname(REPORT), { recursive: true });
  await writeFile(REPORT, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(`Calls ${calls}; current 2026 access ${currentSeason.ok}; leagues ${found}/5; squads ${currentSquads}/5; 2024 stats ${stats2024}/5; formations ${formations2024}/5.`);
  console.log(`Development gate: ${developmentPass ? 'PASS' : 'FAIL'}.`);
  if (!developmentPass) process.exitCode = 2;
}

main().catch(async e => {
  console.error(e.stack || e.message || e);
  await mkdir(path.dirname(REPORT), { recursive: true });
  await writeFile(REPORT, `${JSON.stringify({ probe: 'API-Football Free Plan — FLM Capability Probe v3', generatedAt: new Date().toISOString(), fatalError: { message: e.message }, callsMade: calls, security: { apiKeyPersisted: false, apiKeyPrinted: false } }, null, 2)}\n`, 'utf8');
  process.exit(1);
});
