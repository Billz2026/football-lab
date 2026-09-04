#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const API_BASE = 'https://api.sportmonks.com/v3/football';
const TOKEN = process.env.SPORTMONKS_API_TOKEN;
const CONFIG_PATH = process.argv[2] || 'data/provider/sportmonks.seasons.json';
const OUTPUT_PATH = process.argv[3] || 'data/staging/sportmonks-2026-27.json';

if (!TOKEN) {
  console.error('Missing SPORTMONKS_API_TOKEN. Store it as an environment variable or GitHub secret; never commit it.');
  process.exit(1);
}

const positionMap = new Map([
  [24, { group: 'GK', position: 'GK' }],
  [25, { group: 'DEF', position: 'DEF' }],
  [26, { group: 'MID', position: 'MID' }],
  [27, { group: 'ATT', position: 'ST' }]
]);

function slugPart(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function apiUrl(endpoint, params = {}) {
  const url = new URL(`${API_BASE}${endpoint}`);
  url.searchParams.set('api_token', TOKEN);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  });
  return url;
}

async function getJson(endpoint, params = {}) {
  const response = await fetch(apiUrl(endpoint, params), {
    headers: { Accept: 'application/json' }
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${response.status} ${response.statusText} for ${endpoint}: ${body.slice(0, 400)}`);
  }
  return response.json();
}

async function getAllTeamsForSeason(seasonId) {
  const teams = [];
  let page = 1;
  while (true) {
    const payload = await getJson(`/teams/seasons/${seasonId}`, { per_page: 50, page });
    teams.push(...(payload.data || []));
    if (!payload.pagination?.has_more) break;
    page += 1;
  }
  return teams;
}

function mapTeam(team, leagueId) {
  return {
    id: `flm-club-sm-${team.id}`,
    externalIds: { sportmonks: team.id },
    name: team.name,
    shortName: team.short_code || team.name,
    countryCode: 'ENG',
    leagueId,
    founded: team.founded ?? null,
    venue: null,
    preferredFormation: null,
    reputation: null,
    isPlaceholder: false
  };
}

function mapPlayer(row, clubId) {
  const player = row.player || row;
  const sportmonksId = player.id ?? row.player_id;
  if (!sportmonksId) return null;

  const positionId = player.position_id ?? row.position_id ?? null;
  const mappedPosition = positionMap.get(Number(positionId)) || { group: 'MID', position: 'MID' };

  return {
    id: `flm-player-sm-${sportmonksId}`,
    externalIds: { sportmonks: sportmonksId },
    name: player.display_name || player.name || player.common_name || `Sportmonks Player ${sportmonksId}`,
    firstName: player.firstname || null,
    lastName: player.lastname || null,
    dateOfBirth: player.date_of_birth || player.dateofbirth || null,
    nationalityCode: null,
    clubId,
    shirtNumber: row.jersey_number ?? player.jersey_number ?? null,
    primaryPosition: mappedPosition.position,
    secondaryPositions: [],
    positionGroup: mappedPosition.group,
    preferredFoot: 'unknown',
    heightCm: player.height ?? null,
    weightKg: player.weight ?? null,
    currentAbility: null,
    potentialAbility: null,
    attributes: null,
    contract: {
      weeklyWage: null,
      currency: 'GBP',
      startDate: row.start || null,
      endDate: row.end || null,
      squadStatus: null
    },
    isPlaceholder: false,
    staging: {
      detailedPositionId: player.detailed_position_id ?? row.detailed_position_id ?? null,
      positionId,
      nationalityId: player.nationality_id ?? null,
      inSquad: row.in_squad ?? true
    }
  };
}

async function main() {
  const config = JSON.parse(await readFile(CONFIG_PATH, 'utf8'));
  const missing = (config.leagues || []).filter(item => !Number.isInteger(item.seasonId));
  if (missing.length) {
    throw new Error(`Missing seasonId for: ${missing.map(item => item.internalLeagueId).join(', ')}`);
  }

  const output = {
    source: 'sportmonks',
    importedAt: new Date().toISOString(),
    season: config.season || '2026/27',
    clubs: [],
    players: [],
    leagues: []
  };

  for (const league of config.leagues) {
    console.log(`Importing ${league.internalLeagueId} (season ${league.seasonId})...`);
    const teams = await getAllTeamsForSeason(league.seasonId);
    output.leagues.push({
      internalLeagueId: league.internalLeagueId,
      sportmonksSeasonId: league.seasonId,
      teamCount: teams.length
    });

    for (const team of teams) {
      const mappedTeam = mapTeam(team, league.internalLeagueId);
      output.clubs.push(mappedTeam);

      const squadPayload = await getJson(`/squads/teams/${team.id}/extended`);
      const squad = (squadPayload.data || []).filter(row => row.in_squad !== false);
      squad.forEach(row => {
        const mappedPlayer = mapPlayer(row, mappedTeam.id);
        if (mappedPlayer) output.players.push(mappedPlayer);
      });
    }
  }

  const uniquePlayers = new Map(output.players.map(player => [player.id, player]));
  output.players = [...uniquePlayers.values()];

  await mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(`Imported ${output.clubs.length} clubs and ${output.players.length} active squad players.`);
  console.log(`Staging file written to ${OUTPUT_PATH}. No API token was persisted.`);
}

main().catch(error => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});
