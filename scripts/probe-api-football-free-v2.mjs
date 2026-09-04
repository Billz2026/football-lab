#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const API_BASE = 'https://v3.football.api-sports.io';
const KEY = process.env.API_FOOTBALL_KEY;
const CURRENT_SEASON = 2026;
const FREE_SEASON = 2024;
const REPORT_PATH = process.argv[2] || 'artifacts/api-football-free-probe-v2.json';

if (!KEY) throw new Error('API_FOOTBALL_KEY is required.');

const TARGETS = [
  { league: 'Premier League', preferredTeam: 'Arsenal' },
  { league: 'Championship', preferredTeam: 'Norwich' },
  { league: 'League One', preferredTeam: 'Bolton' },
  { league: 'League Two', preferredTeam: 'Walsall' },
  { league: 'National League', preferredTeam: 'York' }
];

let calls = 0;
const errors = [];
const quota = [];

const norm = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

function errorList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === 'object') return Object.entries(value).map(([k, v]) => `${k}: ${String(v)}`);
  return [String(value)];
}

async function api(endpoint, params = {}) {
  const url = new URL(`${API_BASE}${endpoint}`);
  for (const [k, v] of Object.entries(params)) if (v !== null && v !== undefined && v !== '') url.searchParams.set(k, String(v));
  calls += 1;
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'x-apisports-key': KEY },
    signal: AbortSignal.timeout(30000)
  });
  quota.push({ endpoint, remaining: Number(response.headers.get('x-ratelimit-requests-remaining')), limit: Number(response.headers.get('x-ratelimit-requests-limit')) });
  const text = await response.text();
  let payload = {};
  try { payload = text ? JSON.parse(text) : {}; } catch { throw new Error(`${endpoint}: invalid JSON response`); }
  const apiErrors = errorList(payload.errors);
  if (!response.ok || apiErrors.length) {
    const err = new Error(`${endpoint}: ${apiErrors.join('; ') || response.statusText}`);
    err.status = response.status;
    throw err;
  }
  return payload;
}

async function safe(label, fn) {
  try { return { ok: true, data: await fn() }; }
  catch (error) {
    errors.push({ label, status: error.status || null, message: error.message });
    return { ok: false, error: error.message };
  }
}

function chooseLeague(rows, name) {
  const wanted = norm(name);
  return rows.find(r => norm(r.league?.name) === wanted) || rows.find(r => norm(r.league?.name).includes(wanted)) || null;
}

function chooseTeam(rows, preferred) {
  const wanted = norm(preferred);
  return rows.find(r => norm(r.team?.name) === wanted)
    || rows.find(r => norm(r.team?.name).includes(wanted))
    || [...rows].sort((a, b) => String(a.team?.name || '').localeCompare(String(b.team?.name || '')))[0]
    || null;
}

function seasonInfo(row, year) {
  return (row?.seasons || []).find(s => Number(s.year) === year) || null;
}

function squadSummary(payload) {
  const block = payload.response?.[0] || {};
  const players = block.players || [];
  return {
    teamId: block.team?.id ?? null,
    team: block.team?.name ?? null,
    playerCount: players.length,
    withAge: players.filter(p => p.age != null).length,
    withNumber: players.filter(p => p.number != null).length,
    withPosition: players.filter(p => p.position).length,
    sample: players.slice(0, 10).map(p => ({ id: p.id, name: p.name, age: p.age ?? null, number: p.number ?? null, position: p.position ?? null }))
  };
}

function statSummary(payload) {
  const rows = payload.response || [];
  return {
    resultsOnPage: rows.length,
    currentPage: payload.paging?.current ?? null,
    totalPages: payload.paging?.total ?? null,
    sample: rows.slice(0, 5).map(row => {
      const s = row.statistics?.[0] || {};
      return {
        name: row.player?.name ?? null,
        age: row.player?.age ?? null,
        nationality: row.player?.nationality ?? null,
        height: row.player?.height ?? null,
        weight: row.player?.weight ?? null,
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

function coachSummary(payload) {
  return (payload.response || []).slice(0, 3).map(c => ({ name: c.name, age: c.age ?? null, nationality: c.nationality ?? null, currentTeam: c.team?.name ?? null }));
}

function transferSummary(payload) {
  let count = 0;
  let latestDate = null;
  const sample = [];
  for (const row of payload.response || []) {
    for (const t of row.transfers || []) {
      count += 1;
      if (t.date && (!latestDate || t.date > latestDate)) latestDate = t.date;
      if (sample.length < 8) sample.push({ player: row.player?.name ?? null, date: t.date ?? null, type: t.type ?? null, from: t.teams?.out?.name ?? null, to: t.teams?.in?.name ?? null });
    }
  }
  return { transferCount: count, latestDate, sample };
}

function lineupSummary(payload) {
  return (payload.response || []).map(row => ({ team: row.team?.name ?? null, formation: row.formation ?? null, coach: row.coach?.name ?? null, starters: row.startXI?.length || 0, substitutes: row.substitutes?.length || 0 }));
}

async function main() {
  const currentAccess = await safe('current-season-access', () => api('/leagues', { country: 'England', season: CURRENT_SEASON }));
  const metadataAccess = await safe('seasonless-league-metadata', () => api('/leagues', { country: 'England' }));
  const historical = await safe('free-season-league-discovery', () => api('/leagues', { country: 'England', season: FREE_SEASON }));
  if (!historical.ok) throw new Error(`Cannot discover free-season English leagues: ${historical.error}`);

  const historyRows = historical.data.response || [];
  const metadataRows = metadataAccess.ok ? (metadataAccess.data.response || []) : [];
  const leagueReports = [];

  for (const target of TARGETS) {
    const row = chooseLeague(historyRows, target.league);
    if (!row) {
      leagueReports.push({ requested: target.league, foundInFreeSeason: false });
      continue;
    }

    const leagueId = Number(row.league.id);
    const metaRow = chooseLeague(metadataRows, target.league);
    const teamsResult = await safe(`${target.league}:teams-${FREE_SEASON}`, () => api('/teams', { league: leagueId, season: FREE_SEASON }));
    const teams = teamsResult.ok ? (teamsResult.data.response || []) : [];
    const representative = chooseTeam(teams, target.preferredTeam);
    const report = {
      requested: target.league,
      foundInFreeSeason: true,
      leagueId,
      apiName: row.league.name,
      freeSeasonCoverage: seasonInfo(row, FREE_SEASON)?.coverage || null,
      seasonlessMetadataShowsCurrentSeason: !!seasonInfo(metaRow, CURRENT_SEASON),
      freeSeasonTeamCount: teams.length,
      representativeTeam: representative ? { id: representative.team.id, name: representative.team.name } : null,
      endpoints: {}
    };

    if (representative?.team?.id) {
      const teamId = representative.team.id;
      const squad = await safe(`${target.league}:current-squad`, () => api('/players/squads', { team: teamId }));
      report.endpoints.currentSquadSeasonless = squad.ok ? { ok: true, ...squadSummary(squad.data) } : { ok: false, error: squad.error };

      const stats = await safe(`${target.league}:player-stats-${FREE_SEASON}`, () => api('/players', { team: teamId, season: FREE_SEASON, page: 1 }));
      report.endpoints.playerStatsFreeSeason = stats.ok ? { ok: true, ...statSummary(stats.data) } : { ok: false, error: stats.error };

      const coach = await safe(`${target.league}:coach-current`, () => api('/coachs', { team: teamId }));
      report.endpoints.currentCoachSeasonless = coach.ok ? { ok: true, coaches: coachSummary(coach.data) } : { ok: false, error: coach.error };

      const transfers = await safe(`${target.league}:transfers`, () => api('/transfers', { team: teamId }));
      report.endpoints.transfersSeasonless = transfers.ok ? { ok: true, ...transferSummary(transfers.data) } : { ok: false, error: transfers.error };

      const fixtures = await safe(`${target.league}:fixture-${FREE_SEASON}`, () => api('/fixtures', { team: teamId, season: FREE_SEASON, last: 1 }));
      if (fixtures.ok && fixtures.data.response?.[0]?.fixture?.id) {
        const fixture = fixtures.data.response[0];
        report.endpoints.freeSeasonFixture = { ok: true, fixtureId: fixture.fixture.id, date: fixture.fixture.date, home: fixture.teams?.home?.name ?? null, away: fixture.teams?.away?.name ?? null };
        const lineups = await safe(`${target.league}:lineups-${FREE_SEASON}`, () => api('/fixtures/lineups', { fixture: fixture.fixture.id }));
        report.endpoints.freeSeasonLineups = lineups.ok ? { ok: true, lineups: lineupSummary(lineups.data) } : { ok: false, error: lineups.error };
      } else {
        report.endpoints.freeSeasonFixture = { ok: false, error: fixtures.ok ? 'No fixture returned' : fixtures.error };
      }
    }

    leagueReports.push(report);
  }

  const euros = [];
  for (const target of ['Champions League', 'Europa League', 'Conference League']) {
    const result = await safe(`europe-${target}-${FREE_SEASON}`, () => api('/leagues', { search: target, season: FREE_SEASON }));
    const row = result.ok ? (result.data.response || []).find(r => norm(r.league?.name).includes(norm(target))) : null;
    euros.push(row ? { search: target, found: true, leagueId: row.league.id, apiName: row.league.name, coverage: seasonInfo(row, FREE_SEASON)?.coverage || null } : { search: target, found: false, error: result.ok ? null : result.error });
  }

  const found = leagueReports.filter(r => r.foundInFreeSeason).length;
  const currentSquads = leagueReports.filter(r => r.endpoints?.currentSquadSeasonless?.ok && r.endpoints.currentSquadSeasonless.playerCount >= 15).length;
  const historicalStats = leagueReports.filter(r => r.endpoints?.playerStatsFreeSeason?.ok && r.endpoints.playerStatsFreeSeason.resultsOnPage > 0).length;
  const formations = leagueReports.filter(r => r.endpoints?.freeSeasonLineups?.ok && r.endpoints.freeSeasonLineups.lineups?.some(l => l.formation)).length;
  const currentTransfers = leagueReports.filter(r => String(r.endpoints?.transfersSeasonless?.latestDate || '').startsWith('2026')).length;
  const lastQuota = [...quota].reverse().find(q => Number.isFinite(q.remaining));

  const developmentPass = found === 5 && currentSquads >= 4 && historicalStats >= 4;
  const report = {
    probe: 'API-Football Free Plan — FLM Fallback Capability Test',
    generatedAt: new Date().toISOString(),
    provider: 'API-Football / API-Sports',
    planFinding: {
      requestedCurrentSeason: CURRENT_SEASON,
      currentSeasonDirectAccess: currentAccess.ok,
      currentSeasonError: currentAccess.ok ? null : currentAccess.error,
      documentedByLiveResponseAsAvailableFreeRange: currentAccess.ok ? null : 'The API response states the free plan is restricted to seasons 2022–2024.',
      freeSeasonUsedForStructuralTesting: FREE_SEASON
    },
    usage: { callsMade: calls, lastKnownRemainingDailyRequests: lastQuota?.remaining ?? null, reportedLimit: lastQuota?.limit ?? null },
    englishLeagues: leagueReports,
    europeanCompetitionsFreeSeason: euros,
    coverageSummary: {
      fiveEnglishCompetitionsDiscoverableIn2024: `${found}/5`,
      seasonlessCurrentSquadEndpointsUsable: `${currentSquads}/5`,
      2024DetailedPlayerStatsUsable: `${historicalStats}/5`,
      2024FormationLineupsUsable: `${formations}/5`,
      representativeTransferFeedsContaining2026Records: `${currentTransfers}/5`,
      europeanCompetitionsDiscoverableIn2024: `${euros.filter(x => x.found).length}/3`
    },
    verdict: {
      developmentPass,
      freeForCurrentFullDatabase: false,
      explanation: developmentPass
        ? 'The free plan is useful for building and testing FLM because seasonless squad/coach/transfer endpoints and 2024 detailed data can be exercised. It cannot directly supply 2026/27 league membership or 2026/27 season statistics on the free tier, so a fully current production database still needs a paid current-season source or a separate lawful current-season data source.'
        : 'The free tier is too restricted even for the planned FLM development workflow; inspect endpoint failures before proceeding.'
    },
    errors,
    security: { apiKeyPersisted: false, apiKeyPrinted: false, rawPayloadsCommitted: false, artifactContains: 'sanitised derived samples only' }
  };

  await mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`Calls ${calls}; leagues ${found}/5; current squads ${currentSquads}/5; 2024 stats ${historicalStats}/5; formations ${formations}/5; 2026 transfer evidence ${currentTransfers}/5.`);
  console.log(`Development gate: ${developmentPass ? 'PASS' : 'FAIL'}; full current database free: NO.`);
  if (!developmentPass) process.exitCode = 2;
}

main().catch(async error => {
  console.error(error.stack || error.message || error);
  await mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, `${JSON.stringify({ probe: 'API-Football Free Plan — FLM Fallback Capability Test', generatedAt: new Date().toISOString(), fatalError: { message: error.message }, callsMade: calls, verdict: { developmentPass: false, freeForCurrentFullDatabase: false }, security: { apiKeyPersisted: false, apiKeyPrinted: false } }, null, 2)}\n`, 'utf8');
  process.exit(1);
});
