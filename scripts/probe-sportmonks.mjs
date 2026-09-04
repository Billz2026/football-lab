#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const API_BASE = 'https://api.sportmonks.com/v3/football';
const TOKEN = process.env.SPORTMONKS_API_TOKEN;
const OUTPUT_PATH = process.argv[2] || 'artifacts/sportmonks-access-report.json';

if (!TOKEN) {
  console.error('SPORTMONKS_API_TOKEN is not available to this workflow.');
  process.exit(1);
}

async function getJson(endpoint, params = {}) {
  const url = new URL(`${API_BASE}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  });

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      Authorization: TOKEN
    }
  });

  const text = await response.text();
  if (!response.ok) {
    let message = text.slice(0, 500);
    try {
      const parsed = JSON.parse(text);
      message = parsed.message || parsed.error || message;
    } catch {}
    const error = new Error(`${response.status} ${response.statusText}: ${message}`);
    error.status = response.status;
    throw error;
  }

  return text ? JSON.parse(text) : {};
}

async function getAllLeagues() {
  const leagues = [];
  let page = 1;
  while (true) {
    const payload = await getJson('/leagues', {
      include: 'currentSeason;country',
      per_page: 50,
      page
    });
    leagues.push(...(payload.data || []));
    if (!payload.pagination?.has_more) break;
    page += 1;
    if (page > 20) throw new Error('League pagination safety limit reached.');
  }
  return leagues;
}

function currentSeasonOf(league) {
  return league.currentseason || league.currentSeason || league.current_season || null;
}

function countryOf(league) {
  return league.country || null;
}

function chooseCandidate(leagues) {
  const preferred = [
    'Premiership',
    'Scottish Premiership',
    'Superliga',
    'Danish Superliga'
  ];

  for (const name of preferred) {
    const match = leagues.find(league => String(league.name || '').toLowerCase() === name.toLowerCase() && currentSeasonOf(league)?.id);
    if (match) return match;
  }

  return leagues.find(league => currentSeasonOf(league)?.id) || null;
}

async function probeCandidate(candidate) {
  if (!candidate) return { status: 'skipped', reason: 'No accessible league with a current season was returned.' };

  const season = currentSeasonOf(candidate);
  const result = {
    status: 'started',
    leagueId: candidate.id,
    leagueName: candidate.name,
    seasonId: season.id,
    seasonName: season.name || null,
    teamEndpoint: null,
    squadEndpoint: null
  };

  try {
    const teamsPayload = await getJson(`/teams/seasons/${season.id}`, { per_page: 50, page: 1 });
    const teams = teamsPayload.data || [];
    result.teamEndpoint = {
      accessible: true,
      returnedTeamsOnFirstPage: teams.length,
      paginationHasMore: Boolean(teamsPayload.pagination?.has_more)
    };

    const team = teams[0];
    if (!team?.id) {
      result.squadEndpoint = { accessible: false, reason: 'No team was returned to test.' };
      result.status = 'partial';
      return result;
    }

    try {
      const squadPayload = await getJson(`/squads/teams/${team.id}/extended`, { per_page: 50, page: 1 });
      const squad = squadPayload.data || [];
      result.squadEndpoint = {
        accessible: true,
        returnedRowsOnFirstPage: squad.length,
        activeSquadRows: squad.filter(row => row.in_squad !== false).length,
        sampleFieldNames: squad[0] ? Object.keys(squad[0]).sort().slice(0, 40) : []
      };
      result.status = 'complete';
    } catch (error) {
      result.squadEndpoint = {
        accessible: false,
        statusCode: error.status || null,
        reason: error.message
      };
      result.status = 'partial';
    }
  } catch (error) {
    result.teamEndpoint = {
      accessible: false,
      statusCode: error.status || null,
      reason: error.message
    };
    result.status = 'failed';
  }

  return result;
}

async function main() {
  console.log('Checking Sportmonks subscription access without exposing the API token...');
  const leagues = await getAllLeagues();
  const candidate = chooseCandidate(leagues);
  const endpointProbe = await probeCandidate(candidate);

  const report = {
    provider: 'sportmonks',
    generatedAt: new Date().toISOString(),
    authentication: 'GitHub Actions repository secret via Authorization header',
    accessibleLeagueCount: leagues.length,
    leagues: leagues.map(league => {
      const season = currentSeasonOf(league);
      const country = countryOf(league);
      return {
        id: league.id,
        name: league.name || null,
        country: country?.name || null,
        countryId: league.country_id ?? country?.id ?? null,
        currentSeason: season ? {
          id: season.id,
          name: season.name || null,
          startingAt: season.starting_at || null,
          endingAt: season.ending_at || null,
          isCurrent: season.is_current ?? true
        } : null
      };
    }),
    endpointProbe
  };

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  console.log(`Accessible leagues returned: ${report.accessibleLeagueCount}`);
  if (candidate) console.log(`Test league: ${candidate.name} (season ${currentSeasonOf(candidate)?.name || currentSeasonOf(candidate)?.id})`);
  console.log(`Team endpoint: ${endpointProbe.teamEndpoint?.accessible === true ? 'accessible' : 'not confirmed'}`);
  console.log(`Extended squad endpoint: ${endpointProbe.squadEndpoint?.accessible === true ? 'accessible' : 'not confirmed'}`);
  console.log(`Sanitised report written to ${OUTPUT_PATH}.`);
}

main().catch(error => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});
