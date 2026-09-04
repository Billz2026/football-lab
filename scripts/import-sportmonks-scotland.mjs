#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const API_BASE = 'https://api.sportmonks.com/v3/football';
const TOKEN = process.env.SPORTMONKS_API_TOKEN;
const SEASON_ID = 28275;
const LEAGUE_ID = 501;
const LEAGUE_NAME = 'Scottish Premiership';
const COUNTRY_CODE = 'SCO';
const STAGING_PATH = process.argv[2] || 'data/staging/private/sportmonks-scottish-premiership-2026-27.json';
const REPORT_PATH = process.argv[3] || 'artifacts/sportmonks-scotland-quality-report.json';

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

async function getAll(endpoint, params = {}) {
  const rows = [];
  let page = 1;
  while (true) {
    const payload = await getJson(endpoint, { ...params, per_page: 50, page });
    rows.push(...(payload.data || []));
    if (!payload.pagination?.has_more) break;
    page += 1;
    if (page > 20) throw new Error(`Pagination safety limit reached for ${endpoint}`);
  }
  return rows;
}

function normalisePosition(positionId) {
  switch (Number(positionId)) {
    case 24: return { group: 'GK', primaryPosition: 'GK' };
    case 25: return { group: 'DEF', primaryPosition: 'DEF' };
    case 26: return { group: 'MID', primaryPosition: 'MID' };
    case 27: return { group: 'ATT', primaryPosition: 'ST' };
    default: return { group: 'UNK', primaryPosition: 'UNK' };
  }
}

function mapTeam(team) {
  return {
    id: `flm-club-sm-${team.id}`,
    externalIds: { sportmonks: team.id },
    name: team.name || team.short_code || `Team ${team.id}`,
    shortName: team.short_code || team.name || null,
    countryCode: COUNTRY_CODE,
    leagueId: 'sco-premiership-test',
    founded: team.founded ?? null,
    venueId: team.venue_id ?? null,
    isPlaceholder: false
  };
}

function mapPlayer(row, clubId) {
  const sportmonksId = row.id ?? row.player_id;
  if (!sportmonksId) return null;
  const position = normalisePosition(row.position_id);
  return {
    id: `flm-player-sm-${sportmonksId}`,
    externalIds: { sportmonks: sportmonksId },
    name: row.display_name || row.common_name || row.name || `Player ${sportmonksId}`,
    firstName: row.firstname || null,
    lastName: row.lastname || null,
    dateOfBirth: row.date_of_birth || null,
    nationalityId: row.nationality_id ?? null,
    countryId: row.country_id ?? null,
    clubId,
    shirtNumber: row.jersey_number ?? null,
    primaryPosition: position.primaryPosition,
    secondaryPositions: [],
    positionGroup: position.group,
    sportmonksPositionId: row.position_id ?? null,
    sportmonksDetailedPositionId: row.detailed_position_id ?? null,
    heightCm: row.height ?? null,
    weightKg: row.weight ?? null,
    inSquad: row.in_squad !== false,
    isPlaceholder: false
  };
}

function completeness(players, field) {
  if (!players.length) return 0;
  const present = players.filter(player => player[field] !== null && player[field] !== undefined && player[field] !== '').length;
  return Number(((present / players.length) * 100).toFixed(1));
}

function qualityFlags(teamReports) {
  const flags = [];
  for (const team of teamReports) {
    if (team.activeSquadCount < 18) flags.push(`${team.teamName}: active squad below 18 (${team.activeSquadCount})`);
    if (team.activeSquadCount > 40) flags.push(`${team.teamName}: active squad above 40 (${team.activeSquadCount})`);
    if (team.missingNameCount > 0) flags.push(`${team.teamName}: ${team.missingNameCount} players missing a usable name`);
  }
  return flags;
}

async function main() {
  console.log(`Importing ${LEAGUE_NAME} ${SEASON_ID} into ephemeral FLM staging...`);

  const teams = await getAll(`/teams/seasons/${SEASON_ID}`);
  if (teams.length !== 12) {
    console.warn(`Expected 12 Scottish Premiership clubs; Sportmonks returned ${teams.length}.`);
  }

  const staging = {
    source: 'sportmonks',
    importedAt: new Date().toISOString(),
    competition: {
      externalLeagueId: LEAGUE_ID,
      seasonId: SEASON_ID,
      name: LEAGUE_NAME,
      season: '2026/2027',
      countryCode: COUNTRY_CODE
    },
    clubs: [],
    players: []
  };

  const teamReports = [];

  for (const team of teams) {
    const mappedTeam = mapTeam(team);
    staging.clubs.push(mappedTeam);

    const squadRows = await getAll(`/squads/teams/${team.id}/extended`);
    const activeRows = squadRows.filter(row => row.in_squad !== false);
    const mappedPlayers = activeRows.map(row => mapPlayer(row, mappedTeam.id)).filter(Boolean);
    staging.players.push(...mappedPlayers);

    teamReports.push({
      teamId: team.id,
      teamName: mappedTeam.name,
      totalExtendedRows: squadRows.length,
      activeSquadCount: mappedPlayers.length,
      inactiveRowsExcluded: squadRows.length - activeRows.length,
      missingNameCount: mappedPlayers.filter(player => !player.name || /^Player \d+$/.test(player.name)).length,
      samplePlayers: mappedPlayers.slice(0, 5).map(player => ({
        name: player.name,
        dateOfBirth: player.dateOfBirth,
        positionId: player.sportmonksPositionId,
        detailedPositionId: player.sportmonksDetailedPositionId,
        nationalityId: player.nationalityId
      }))
    });

    console.log(`${mappedTeam.name}: ${mappedPlayers.length} active players (${squadRows.length} extended rows)`);
  }

  const uniquePlayers = new Map();
  for (const player of staging.players) {
    if (!uniquePlayers.has(player.id)) uniquePlayers.set(player.id, player);
  }
  const duplicateRowsRemoved = staging.players.length - uniquePlayers.size;
  staging.players = [...uniquePlayers.values()];

  const report = {
    provider: 'sportmonks',
    generatedAt: new Date().toISOString(),
    scope: `${LEAGUE_NAME} 2026/27 free-tier staging test`,
    seasonId: SEASON_ID,
    leagueId: LEAGUE_ID,
    clubCount: staging.clubs.length,
    uniqueActivePlayerCount: staging.players.length,
    duplicateRowsRemoved,
    completenessPercent: {
      name: completeness(staging.players, 'name'),
      dateOfBirth: completeness(staging.players, 'dateOfBirth'),
      nationalityId: completeness(staging.players, 'nationalityId'),
      positionId: completeness(staging.players, 'sportmonksPositionId'),
      detailedPositionId: completeness(staging.players, 'sportmonksDetailedPositionId'),
      heightCm: completeness(staging.players, 'heightCm'),
      weightKg: completeness(staging.players, 'weightKg')
    },
    teamReports,
    qualityFlags: qualityFlags(teamReports),
    stagingPolicy: {
      fullDatasetCommitted: false,
      fullDatasetUploadedAsArtifact: false,
      fullDatasetLifetime: 'GitHub Actions runner only; destroyed when the job ends',
      publishedReportContains: 'aggregate completeness, squad counts and five sample player identities per club only'
    }
  };

  await mkdir(path.dirname(STAGING_PATH), { recursive: true });
  await mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await writeFile(STAGING_PATH, `${JSON.stringify(staging, null, 2)}\n`, 'utf8');
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  console.log(`Imported ${staging.clubs.length} clubs and ${staging.players.length} unique active squad players.`);
  console.log('Completeness:', report.completenessPercent);
  if (report.qualityFlags.length) console.log('Quality flags:', report.qualityFlags);
  console.log(`Full staging dataset written to ${STAGING_PATH} for this runner only.`);
  console.log(`Sanitised quality report written to ${REPORT_PATH}.`);
}

main().catch(error => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});
