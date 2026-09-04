#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const API_BASE = 'https://v3.football.api-sports.io';
const API_KEY = process.env.API_FOOTBALL_KEY;
const SEASON = Number(process.env.API_FOOTBALL_SEASON || 2026);
const REPORT_PATH = process.argv[2] || 'artifacts/api-football-free-probe.json';

if (!API_KEY) throw new Error('API_FOOTBALL_KEY is required.');

const TARGET_LEAGUES = [
  'Premier League',
  'Championship',
  'League One',
  'League Two',
  'National League'
];

const EURO_SEARCHES = [
  { label: 'UEFA Champions League', search: 'Champions League' },
  { label: 'UEFA Europa League', search: 'Europa League' },
  { label: 'UEFA Conference League', search: 'Conference League' }
];

let callCount = 0;
const quotaSnapshots = [];
const endpointErrors = [];

function cleanErrors(errors) {
  if (!errors) return [];
  if (Array.isArray(errors)) return errors.map(String).filter(Boolean);
  if (typeof errors === 'object') return Object.entries(errors).map(([k, v]) => `${k}: ${String(v)}`);
  return [String(errors)];
}

async function api(endpoint, params = {}, retries = 1) {
  const url = new URL(`${API_BASE}${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  }

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    callCount += 1;
    const response = await fetch(url, {
      headers: { Accept: 'application/json', 'x-apisports-key': API_KEY },
      signal: AbortSignal.timeout(30000)
    });
    const remaining = response.headers.get('x-ratelimit-requests-remaining') || response.headers.get('x-ratelimit-remaining');
    const limit = response.headers.get('x-ratelimit-requests-limit') || response.headers.get('x-ratelimit-limit');
    quotaSnapshots.push({ endpoint, remaining: remaining == null ? null : Number(remaining), limit: limit == null ? null : Number(limit) });

    const text = await response.text();
    let payload = {};
    try { payload = text ? JSON.parse(text) : {}; } catch { payload = { rawParseError: true }; }
    const apiErrors = cleanErrors(payload.errors);

    if (response.ok && apiErrors.length === 0) return payload;

    const message = apiErrors.join('; ') || payload.message || `${response.status} ${response.statusText}`;
    if ((response.status === 429 || response.status >= 500) && attempt < retries) {
      await new Promise(resolve => setTimeout(resolve, response.status === 429 ? 2500 : 1000));
      continue;
    }
    const error = new Error(`${endpoint}: ${message}`);
    error.status = response.status;
    error.apiErrors = apiErrors;
    throw error;
  }
}

function latestSeason(row) {
  return (row?.seasons || []).find(s => Number(s.year) === SEASON) || null;
}

function chooseLeague(rows, target) {
  const normalise = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const wanted = normalise(target);
  return rows.find(row => normalise(row?.league?.name) === wanted)
    || rows.find(row => normalise(row?.league?.name).includes(wanted))
    || null;
}

function chooseTeam(rows) {
  const sorted = [...rows].sort((a, b) => String(a?.team?.name || '').localeCompare(String(b?.team?.name || '')));
  return sorted[Math.floor(sorted.length / 2)] || sorted[0] || null;
}

function sanitiseSquad(payload) {
  const block = payload?.response?.[0];
  const players = block?.players || [];
  return {
    teamId: block?.team?.id ?? null,
    team: block?.team?.name ?? null,
    playerCount: players.length,
    withAge: players.filter(p => p.age != null).length,
    withNumber: players.filter(p => p.number != null).length,
    withPosition: players.filter(p => p.position).length,
    positionCounts: players.reduce((acc, p) => {
      const key = p.position || 'Unknown';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {}),
    sample: players.slice(0, 8).map(p => ({ id: p.id, name: p.name, age: p.age ?? null, number: p.number ?? null, position: p.position ?? null }))
  };
}

function sanitisePlayerStats(payload) {
  const rows = payload?.response || [];
  return {
    results: Number(payload?.results || rows.length || 0),
    page: payload?.paging?.current ?? null,
    totalPages: payload?.paging?.total ?? null,
    sample: rows.slice(0, 6).map(row => {
      const stat = row.statistics?.[0] || {};
      return {
        id: row.player?.id ?? null,
        name: row.player?.name ?? null,
        age: row.player?.age ?? null,
        nationality: row.player?.nationality ?? null,
        height: row.player?.height ?? null,
        weight: row.player?.weight ?? null,
        injured: row.player?.injured ?? null,
        competition: stat.league?.name ?? null,
        appearances: stat.games?.appearences ?? null,
        starts: stat.games?.lineups ?? null,
        minutes: stat.games?.minutes ?? null,
        position: stat.games?.position ?? null,
        rating: stat.games?.rating ?? null,
        goals: stat.goals?.total ?? null,
        assists: stat.goals?.assists ?? null,
        shots: stat.shots?.total ?? null,
        shotsOn: stat.shots?.on ?? null,
        passes: stat.passes?.total ?? null,
        keyPasses: stat.passes?.key ?? null,
        passAccuracy: stat.passes?.accuracy ?? null,
        tackles: stat.tackles?.total ?? null,
        interceptions: stat.tackles?.interceptions ?? null,
        duels: stat.duels?.total ?? null,
        duelsWon: stat.duels?.won ?? null,
        dribbleAttempts: stat.dribbles?.attempts ?? null,
        dribbleSuccess: stat.dribbles?.success ?? null,
        yellow: stat.cards?.yellow ?? null,
        red: stat.cards?.red ?? null
      };
    })
  };
}

function sanitiseCoaches(payload) {
  const rows = payload?.response || [];
  return rows.slice(0, 4).map(c => ({ id: c.id, name: c.name, age: c.age ?? null, nationality: c.nationality ?? null, currentTeam: c.team?.name ?? null }));
}

function sanitiseTransfers(payload) {
  const rows = payload?.response || [];
  let transferCount = 0;
  const sample = [];
  for (const row of rows) {
    for (const transfer of row.transfers || []) {
      transferCount += 1;
      if (sample.length < 8) {
        sample.push({ player: row.player?.name ?? null, date: transfer.date ?? null, type: transfer.type ?? null, from: transfer.teams?.out?.name ?? null, to: transfer.teams?.in?.name ?? null });
      }
    }
  }
  return { playerRows: rows.length, transferCount, sample };
}

function sanitiseInjuries(payload) {
  const rows = payload?.response || [];
  return { count: rows.length, sample: rows.slice(0, 8).map(r => ({ player: r.player?.name ?? null, type: r.player?.type ?? null, reason: r.player?.reason ?? null, team: r.team?.name ?? null, date: r.fixture?.date ?? null })) };
}

function sanitiseLineups(payload) {
  const rows = payload?.response || [];
  return rows.map(row => ({ team: row.team?.name ?? null, formation: row.formation ?? null, coach: row.coach?.name ?? null, starters: row.startXI?.length || 0, substitutes: row.substitutes?.length || 0 }));
}

async function safe(label, fn) {
  try {
    return { ok: true, data: await fn() };
  } catch (error) {
    endpointErrors.push({ label, status: error.status || null, message: error.message });
    return { ok: false, error: error.message };
  }
}

async function main() {
  const leaguePayload = await api('/leagues', { country: 'England', season: SEASON });
  const englishRows = leaguePayload.response || [];
  const selected = TARGET_LEAGUES.map(name => ({ name, row: chooseLeague(englishRows, name) }));

  const leagueReports = [];
  for (const selection of selected) {
    if (!selection.row) {
      leagueReports.push({ requested: selection.name, found: false });
      continue;
    }

    const leagueId = Number(selection.row.league.id);
    const seasonInfo = latestSeason(selection.row);
    const teamsResult = await safe(`${selection.name}:teams`, () => api('/teams', { league: leagueId, season: SEASON }));
    const teams = teamsResult.ok ? (teamsResult.data.response || []) : [];
    const representative = chooseTeam(teams);

    const report = {
      requested: selection.name,
      found: true,
      leagueId,
      apiName: selection.row.league.name,
      season: SEASON,
      coverage: seasonInfo?.coverage || null,
      teamCount: teams.length,
      representativeTeam: representative ? { id: representative.team.id, name: representative.team.name, city: representative.venue?.city ?? null, venue: representative.venue?.name ?? null } : null,
      endpoints: {}
    };

    if (representative?.team?.id) {
      const teamId = Number(representative.team.id);

      const squad = await safe(`${selection.name}:squad`, () => api('/players/squads', { team: teamId }));
      report.endpoints.squad = squad.ok ? { ok: true, ...sanitiseSquad(squad.data) } : { ok: false, error: squad.error };

      const stats = await safe(`${selection.name}:players`, () => api('/players', { team: teamId, season: SEASON, page: 1 }));
      report.endpoints.playerStats = stats.ok ? { ok: true, ...sanitisePlayerStats(stats.data) } : { ok: false, error: stats.error };

      const coaches = await safe(`${selection.name}:coaches`, () => api('/coachs', { team: teamId }));
      report.endpoints.coaches = coaches.ok ? { ok: true, coaches: sanitiseCoaches(coaches.data) } : { ok: false, error: coaches.error };

      const transfers = await safe(`${selection.name}:transfers`, () => api('/transfers', { team: teamId }));
      report.endpoints.transfers = transfers.ok ? { ok: true, ...sanitiseTransfers(transfers.data) } : { ok: false, error: transfers.error };

      const injuries = await safe(`${selection.name}:injuries`, () => api('/injuries', { team: teamId, season: SEASON }));
      report.endpoints.injuries = injuries.ok ? { ok: true, ...sanitiseInjuries(injuries.data) } : { ok: false, error: injuries.error };

      const fixtures = await safe(`${selection.name}:fixture`, () => api('/fixtures', { team: teamId, season: SEASON, last: 1 }));
      if (fixtures.ok && fixtures.data.response?.length) {
        const fixture = fixtures.data.response[0];
        report.endpoints.latestFixture = {
          ok: true,
          fixtureId: fixture.fixture?.id ?? null,
          date: fixture.fixture?.date ?? null,
          status: fixture.fixture?.status?.short ?? null,
          home: fixture.teams?.home?.name ?? null,
          away: fixture.teams?.away?.name ?? null
        };
        if (fixture.fixture?.id) {
          const lineups = await safe(`${selection.name}:lineups`, () => api('/fixtures/lineups', { fixture: fixture.fixture.id }));
          report.endpoints.lineups = lineups.ok ? { ok: true, lineups: sanitiseLineups(lineups.data) } : { ok: false, error: lineups.error };
        }
      } else {
        report.endpoints.latestFixture = { ok: false, error: fixtures.ok ? 'No fixture returned' : fixtures.error };
      }
    }

    leagueReports.push(report);
  }

  const europeanCompetitions = [];
  for (const target of EURO_SEARCHES) {
    const result = await safe(`europe:${target.label}`, () => api('/leagues', { search: target.search, season: SEASON }));
    if (!result.ok) {
      europeanCompetitions.push({ requested: target.label, found: false, error: result.error });
      continue;
    }
    const rows = result.data.response || [];
    const norm = value => String(value || '').toLowerCase();
    const best = rows.find(r => norm(r.league?.name) === norm(target.label))
      || rows.find(r => norm(r.league?.name).includes(norm(target.search)))
      || rows[0];
    europeanCompetitions.push(best ? {
      requested: target.label,
      found: true,
      leagueId: best.league?.id ?? null,
      apiName: best.league?.name ?? null,
      country: best.country?.name ?? null,
      coverage: latestSeason(best)?.coverage || null
    } : { requested: target.label, found: false });
  }

  const coreFound = leagueReports.filter(r => r.found).length;
  const teamCoverage = leagueReports.filter(r => (r.teamCount || 0) >= 10).length;
  const squadCoverage = leagueReports.filter(r => r.endpoints?.squad?.ok && r.endpoints.squad.playerCount >= 15).length;
  const statsCoverage = leagueReports.filter(r => r.endpoints?.playerStats?.ok && r.endpoints.playerStats.results > 0).length;
  const lineupCoverage = leagueReports.filter(r => r.endpoints?.lineups?.ok && r.endpoints.lineups.lineups?.some(l => l.formation)).length;
  const euroFound = europeanCompetitions.filter(r => r.found).length;
  const lastQuota = [...quotaSnapshots].reverse().find(q => Number.isFinite(q.remaining));

  const pass = coreFound === 5 && teamCoverage === 5 && squadCoverage >= 4;
  const report = {
    probe: 'API-Football Free Plan — FLM English Data Quality Probe',
    generatedAt: new Date().toISOString(),
    provider: 'API-Football / API-Sports',
    season: SEASON,
    purpose: 'Validate free-plan access to FLM core English competitions and management-game data before any paid subscription.',
    usage: { callsMade: callCount, lastKnownRemainingDailyRequests: lastQuota?.remaining ?? null, reportedLimit: lastQuota?.limit ?? null },
    englishLeagues: leagueReports,
    europeanCompetitions,
    coverageSummary: {
      targetEnglishLeaguesFound: `${coreFound}/5`,
      leaguesWithAtLeastTenTeams: `${teamCoverage}/5`,
      representativeSquadsWithAtLeastFifteenPlayers: `${squadCoverage}/5`,
      representativeTeamsWithSeasonPlayerStats: `${statsCoverage}/5`,
      representativeTeamsWithFormationLineups: `${lineupCoverage}/5`,
      europeanCompetitionsFound: `${euroFound}/3`
    },
    endpointErrors,
    qualityGate: {
      pass,
      requirements: {
        allFiveEnglishLeaguesFound: coreFound === 5,
        allFiveHaveTeamLists: teamCoverage === 5,
        atLeastFourRepresentativeSquadsUsable: squadCoverage >= 4
      },
      note: 'Player-stat, injury, transfer and lineup coverage is reported separately because API coverage legitimately varies by competition and fixture. Passing this gate means API-Football is viable for a full English squad import test, not that every FLM attribute can be sourced directly.'
    },
    security: {
      apiKeyPersisted: false,
      apiKeyPrinted: false,
      rawApiPayloadsCommitted: false,
      artifactContains: 'sanitised competition, squad, player-stat, coach, transfer, injury and formation samples only'
    }
  };

  await mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  console.log(`API-Football calls: ${callCount}; English leagues ${coreFound}/5; usable squads ${squadCoverage}/5; stats ${statsCoverage}/5; formations ${lineupCoverage}/5; Europe ${euroFound}/3.`);
  console.log(`Quality gate: ${pass ? 'PASS' : 'FAIL'}.`);
  if (!pass) process.exitCode = 2;
}

main().catch(async error => {
  console.error(error.stack || error.message || error);
  await mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, `${JSON.stringify({ probe: 'API-Football Free Plan — FLM English Data Quality Probe', generatedAt: new Date().toISOString(), season: SEASON, fatalError: { message: error.message, status: error.status || null }, callsMade: callCount, qualityGate: { pass: false }, security: { apiKeyPersisted: false, apiKeyPrinted: false } }, null, 2)}\n`, 'utf8');
  process.exit(1);
});
