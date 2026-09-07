#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';

const API_BASE = 'https://v3.football.api-sports.io';
const API_KEY = process.env.API_FOOTBALL_KEY;
const MANIFEST_PATH = process.env.FLM_IMPORT_MANIFEST || 'data/import/api-football-spain-2026-27.json';
const OUT_DIR = process.argv[2] || 'artifacts/api-football-spain-free';
const BATCH_OFFSET = Math.max(0, Number(process.env.FLM_BATCH_OFFSET || 0));
const BATCH_COUNT = Math.max(1, Math.min(20, Number(process.env.FLM_BATCH_COUNT || 5)));
const REQUEST_DELAY_MS = Math.max(6500, Number(process.env.FLM_REQUEST_DELAY_MS || 7000));
const DAILY_RESERVE = Math.max(1, Number(process.env.FLM_DAILY_RESERVE || 3));

if (!API_KEY) throw new Error('API_FOOTBALL_KEY is required.');

let calls = 0;
let lastRemaining = null;
let reportedLimit = null;
let lastCallAt = 0;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const norm = value => String(value || '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');

async function api(endpoint, params = {}) {
  if (lastRemaining != null && lastRemaining <= DAILY_RESERVE) {
    const error = new Error(`Daily request reserve reached (${lastRemaining} remaining).`);
    error.code = 'DAILY_RESERVE';
    throw error;
  }

  const since = Date.now() - lastCallAt;
  if (lastCallAt && since < REQUEST_DELAY_MS) await sleep(REQUEST_DELAY_MS - since);

  const url = new URL(`${API_BASE}${endpoint}`);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  });

  calls += 1;
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'x-apisports-key': API_KEY },
    signal: AbortSignal.timeout(30000)
  });
  lastCallAt = Date.now();

  const remainingHeader = response.headers.get('x-ratelimit-requests-remaining') || response.headers.get('x-ratelimit-remaining');
  const limitHeader = response.headers.get('x-ratelimit-requests-limit') || response.headers.get('x-ratelimit-limit');
  if (remainingHeader != null && Number.isFinite(Number(remainingHeader))) lastRemaining = Number(remainingHeader);
  if (limitHeader != null && Number.isFinite(Number(limitHeader))) reportedLimit = Number(limitHeader);

  const payload = await response.json().catch(() => ({}));
  const errors = payload?.errors && typeof payload.errors === 'object'
    ? Object.entries(payload.errors).map(([key, value]) => `${key}: ${value}`)
    : [];
  if (!response.ok || errors.length) {
    const error = new Error(`${endpoint}: ${errors.join('; ') || payload?.message || `${response.status} ${response.statusText}`}`);
    error.status = response.status;
    throw error;
  }
  return payload;
}

function findTeam(allTeams, club) {
  const wanted = [club.name, club.officialName, ...(club.aliases || [])].map(norm).filter(Boolean);
  const exact = allTeams.find(row => wanted.includes(norm(row?.team?.name)));
  if (exact) return exact;

  const fuzzy = allTeams.filter(row => {
    const provider = norm(row?.team?.name);
    return provider && wanted.some(name => name.includes(provider) || provider.includes(name));
  });
  return fuzzy.length === 1 ? fuzzy[0] : null;
}

function sanitiseClub(target, row, manifest) {
  const team = row?.team || {};
  const venue = row?.venue || {};
  return {
    leagueId: target.leagueId,
    leagueLevel: target.leagueLevel,
    canonicalName: target.name,
    officialName: target.officialName,
    provider: 'API-Football',
    apiFootballId: Number(team.id),
    providerName: team.name || null,
    providerCode: team.code || null,
    countryCode: manifest.countryCode,
    founded: Number.isInteger(team.founded) ? team.founded : null,
    national: Boolean(team.national),
    venue: {
      id: Number.isFinite(Number(venue.id)) ? Number(venue.id) : null,
      name: venue.name || null,
      city: venue.city || null,
      capacity: Number.isFinite(Number(venue.capacity)) ? Number(venue.capacity) : null,
      surface: venue.surface || null
    },
    sourcePolicy: {
      membership: 'LALIGA official 2026/27 manifest',
      identity: 'API-Football current team lookup',
      badgesIncluded: false
    }
  };
}

function sanitisePlayer(player) {
  return {
    apiFootballId: Number(player?.id),
    name: player?.name || null,
    age: Number.isFinite(Number(player?.age)) ? Number(player.age) : null,
    shirtNumber: Number.isInteger(player?.number) ? player.number : null,
    position: player?.position || null
  };
}

async function main() {
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
  if (manifest.country !== 'Spain' || manifest.countryCode !== 'ESP') throw new Error('Spain importer requires the locked Spain manifest.');
  const flat = (manifest.leagues || []).flatMap(league =>
    (league.clubs || []).map(club => ({ ...club, leagueId: league.id, leagueLevel: league.level }))
  );
  if (flat.length !== 20) throw new Error(`Expected 20 La Liga clubs in manifest, found ${flat.length}.`);

  const selection = flat.slice(BATCH_OFFSET, BATCH_OFFSET + BATCH_COUNT);
  if (!selection.length) throw new Error(`Batch offset ${BATCH_OFFSET} is outside the 20-club manifest.`);

  await mkdir(OUT_DIR, { recursive: true });
  const teamsPayload = await api('/teams', { country: manifest.country });
  const allTeams = teamsPayload.response || [];

  const clubs = [];
  const squads = [];
  const missing = [];
  const failures = [];

  for (const target of selection) {
    const row = findTeam(allTeams, target);
    if (!row?.team?.id) {
      missing.push({ name: target.name, officialName: target.officialName, aliases: target.aliases || [] });
      continue;
    }

    const club = sanitiseClub(target, row, manifest);
    clubs.push(club);

    try {
      const squadPayload = await api('/players/squads', { team: row.team.id });
      const block = squadPayload.response?.[0];
      const players = Array.isArray(block?.players) ? block.players.map(sanitisePlayer).filter(player => Number.isFinite(player.apiFootballId)) : [];
      if (!players.length) {
        failures.push({ club: target.name, apiFootballId: row.team.id, error: 'No current squad returned.' });
        continue;
      }
      squads.push({
        leagueId: target.leagueId,
        clubName: target.name,
        apiFootballTeamId: Number(row.team.id),
        providerTeamName: block?.team?.name || row.team.name || null,
        players
      });
    } catch (error) {
      failures.push({ club: target.name, apiFootballId: row.team.id, error: error.message });
      if (error.code === 'DAILY_RESERVE') break;
    }
  }

  const duplicateTeamIds = clubs
    .map(club => club.apiFootballId)
    .filter((id, index, all) => all.indexOf(id) !== index);
  const duplicatePlayerIds = [];
  const seenPlayers = new Map();
  for (const squad of squads) {
    for (const player of squad.players) {
      const existing = seenPlayers.get(player.apiFootballId);
      if (existing && existing !== squad.clubName) duplicatePlayerIds.push({ playerId: player.apiFootballId, clubs: [existing, squad.clubName] });
      else seenPlayers.set(player.apiFootballId, squad.clubName);
    }
  }

  const report = {
    generatedAt: new Date().toISOString(),
    manifest: MANIFEST_PATH,
    membershipAuthority: manifest.membershipAuthority,
    batch: { offset: BATCH_OFFSET, requested: BATCH_COUNT, selected: selection.map(club => club.name) },
    result: {
      clubsResolved: clubs.length,
      squadsResolved: squads.length,
      playersStaged: squads.reduce((sum, squad) => sum + squad.players.length, 0),
      missing,
      failures,
      duplicateTeamIds: [...new Set(duplicateTeamIds)],
      crossSquadPlayerConflicts: duplicatePlayerIds
    },
    usage: {
      calls,
      reportedDailyLimit: reportedLimit,
      lastKnownRemainingDailyRequests: lastRemaining
    },
    safety: {
      writesCurrentDatabase: false,
      badgesIncluded: false,
      playerPhotosIncluded: false,
      ratingsGenerated: false
    }
  };

  await Promise.all([
    writeFile(`${OUT_DIR}/clubs-stage.json`, `${JSON.stringify(clubs, null, 2)}\n`),
    writeFile(`${OUT_DIR}/squads-stage.json`, `${JSON.stringify(squads, null, 2)}\n`),
    writeFile(`${OUT_DIR}/report.json`, `${JSON.stringify(report, null, 2)}\n`),
    writeFile(`${OUT_DIR}/membership-selection.json`, `${JSON.stringify(selection, null, 2)}\n`)
  ]);

  console.log(`Staged ${clubs.length}/${selection.length} club identities and ${squads.length} current squads.`);
  console.log(`Players staged: ${report.result.playersStaged}. API calls: ${calls}. Remaining: ${lastRemaining ?? 'unknown'}.`);

  if (missing.length || failures.length || duplicateTeamIds.length) {
    throw new Error(`Spain staging incomplete: ${missing.length} missing club(s), ${failures.length} squad failure(s), ${duplicateTeamIds.length} duplicate team id(s).`);
  }
}

main().catch(error => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});
