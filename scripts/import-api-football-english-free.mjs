#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const API_BASE = 'https://v3.football.api-sports.io';
const API_KEY = process.env.API_FOOTBALL_KEY;
const MANIFEST_PATH = process.env.FLM_IMPORT_MANIFEST || 'data/import/api-football-english-2026-27.json';
const OUT_DIR = process.argv[2] || 'artifacts/api-football-english-free';
const BATCH_OFFSET = Math.max(0, Number(process.env.FLM_BATCH_OFFSET || 0));
const BATCH_COUNT = Math.max(1, Math.min(44, Number(process.env.FLM_BATCH_COUNT || 8)));
const REQUEST_DELAY_MS = Math.max(6500, Number(process.env.FLM_REQUEST_DELAY_MS || 7000));
const DAILY_RESERVE = Math.max(1, Number(process.env.FLM_DAILY_RESERVE || 3));

if (!API_KEY) throw new Error('API_FOOTBALL_KEY is required.');

const ATTRIBUTE_KEYS = {
  technical: ['corners','crossing','dribbling','finishing','firstTouch','heading','longShots','passing','tackling','technique'],
  mental: ['aggression','anticipation','composure','decisions','determination','flair','leadership','offTheBall','positioning','teamwork','vision','workRate'],
  physical: ['acceleration','agility','balance','jumping','naturalFitness','pace','stamina','strength']
};

const POSITION_TEMPLATES = {
  GK: {
    technical: { corners:3,crossing:3,dribbling:5,finishing:2,firstTouch:8,heading:5,longShots:3,passing:9,tackling:4,technique:7 },
    mental: { aggression:7,anticipation:11,composure:11,decisions:11,determination:10,flair:5,leadership:10,offTheBall:4,positioning:12,teamwork:10,vision:8,workRate:8 },
    physical: { acceleration:8,agility:11,balance:10,jumping:11,naturalFitness:11,pace:8,stamina:9,strength:11 }
  },
  DEF: {
    technical: { corners:5,crossing:8,dribbling:7,finishing:5,firstTouch:9,heading:12,longShots:6,passing:9,tackling:12,technique:8 },
    mental: { aggression:11,anticipation:11,composure:10,decisions:10,determination:10,flair:6,leadership:9,offTheBall:7,positioning:12,teamwork:11,vision:8,workRate:11 },
    physical: { acceleration:10,agility:9,balance:11,jumping:12,naturalFitness:11,pace:10,stamina:11,strength:12 }
  },
  MID: {
    technical: { corners:9,crossing:10,dribbling:10,finishing:8,firstTouch:12,heading:7,longShots:9,passing:12,tackling:9,technique:12 },
    mental: { aggression:9,anticipation:11,composure:11,decisions:11,determination:10,flair:10,leadership:8,offTheBall:10,positioning:9,teamwork:11,vision:12,workRate:11 },
    physical: { acceleration:10,agility:11,balance:10,jumping:8,naturalFitness:11,pace:10,stamina:12,strength:9 }
  },
  ATT: {
    technical: { corners:7,crossing:9,dribbling:12,finishing:12,firstTouch:11,heading:10,longShots:10,passing:9,tackling:5,technique:11 },
    mental: { aggression:8,anticipation:11,composure:11,decisions:10,determination:10,flair:11,leadership:7,offTheBall:12,positioning:7,teamwork:9,vision:9,workRate:9 },
    physical: { acceleration:12,agility:11,balance:10,jumping:10,naturalFitness:11,pace:12,stamina:10,strength:10 }
  }
};

let calls = 0;
let lastRemaining = null;
let reportedLimit = null;
let lastCallAt = 0;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function norm(value) {
  return String(value || '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
}

function hash(value) {
  let h = 2166136261;
  for (const c of String(value)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return Math.abs(h >>> 0);
}

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

async function api(endpoint, params = {}) {
  if (lastRemaining != null && lastRemaining <= DAILY_RESERVE) {
    const err = new Error(`Daily request reserve reached (${lastRemaining} remaining).`);
    err.code = 'DAILY_RESERVE';
    throw err;
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
    ? Object.entries(payload.errors).map(([k,v]) => `${k}: ${v}`)
    : [];
  if (!response.ok || errors.length) {
    const message = errors.join('; ') || payload?.message || `${response.status} ${response.statusText}`;
    const err = new Error(`${endpoint}: ${message}`);
    err.status = response.status;
    throw err;
  }
  return payload;
}

function findTeam(allTeams, club) {
  const wanted = [club.name, ...(club.aliases || [])].map(norm);
  const exact = allTeams.find(row => wanted.includes(norm(row?.team?.name)));
  if (exact) return exact;
  return allTeams.find(row => wanted.some(name => norm(row?.team?.name).includes(name) || name.includes(norm(row?.team?.name)))) || null;
}

function positionInfo(apiPosition) {
  const value = String(apiPosition || '').toLowerCase();
  if (value.includes('goal')) return { primaryPosition:'GK', positionGroup:'GK' };
  if (value.includes('def')) return { primaryPosition:'DC', positionGroup:'DEF' };
  if (value.includes('mid')) return { primaryPosition:'MC', positionGroup:'MID' };
  return { primaryPosition:'ST', positionGroup:'ATT' };
}

function ratingJitter(playerId, group, key) {
  return (hash(`${playerId}:${group}:${key}`) % 5) - 2;
}

function buildAttributes(playerId, positionGroup, leagueLevel, age) {
  const template = POSITION_TEMPLATES[positionGroup] || POSITION_TEMPLATES.MID;
  const leagueOffset = leagueLevel === 1 ? 1 : 0;
  const output = { technical:{}, mental:{}, physical:{} };

  for (const group of Object.keys(ATTRIBUTE_KEYS)) {
    for (const key of ATTRIBUTE_KEYS[group]) {
      let value = (template[group]?.[key] ?? 10) + leagueOffset + ratingJitter(playerId, group, key);
      if (group === 'physical' && ['pace','acceleration','agility'].includes(key) && Number.isFinite(age)) {
        if (age >= 34) value -= 3;
        else if (age >= 31) value -= 2;
        else if (age >= 29) value -= 1;
        else if (age <= 21) value += 1;
      }
      if (group === 'physical' && key === 'naturalFitness' && Number.isFinite(age) && age >= 33) value -= 1;
      output[group][key] = clamp(Math.round(value), 3, 15);
    }
  }
  return output;
}

function roleAbility(attributes, positionGroup, leagueLevel) {
  const keys = positionGroup === 'GK'
    ? [['mental','positioning'],['mental','decisions'],['physical','agility'],['technical','passing']]
    : positionGroup === 'DEF'
      ? [['technical','tackling'],['technical','heading'],['mental','positioning'],['mental','anticipation'],['physical','strength']]
      : positionGroup === 'MID'
        ? [['technical','passing'],['technical','firstTouch'],['technical','technique'],['mental','vision'],['mental','decisions'],['physical','stamina']]
        : [['technical','finishing'],['technical','dribbling'],['technical','firstTouch'],['mental','offTheBall'],['physical','pace'],['physical','acceleration']];
  const average = keys.reduce((sum,[g,k]) => sum + attributes[g][k], 0) / keys.length;
  return clamp(Math.round(average * 10 + (leagueLevel === 1 ? 4 : 0)), 65, 155);
}

function potentialFromAge(currentAbility, age, playerId) {
  const n = Number(age);
  let room = 5;
  if (Number.isFinite(n) && n <= 18) room = 30;
  else if (Number.isFinite(n) && n <= 21) room = 22;
  else if (Number.isFinite(n) && n <= 24) room = 14;
  else if (Number.isFinite(n) && n <= 27) room = 8;
  else if (Number.isFinite(n) && n >= 31) room = 2;
  return clamp(currentAbility + Math.round(room * (0.55 + (hash(`${playerId}:pa`) % 45) / 100)), currentAbility, 175);
}

function splitName(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  return { firstName: parts[0] || null, lastName: parts.length > 1 ? parts.slice(1).join(' ') : null };
}

function makePlayer(raw, clubId, leagueLevel) {
  const apiId = Number(raw.id);
  const id = `flm-player-api-football-${apiId}`;
  const { primaryPosition, positionGroup } = positionInfo(raw.position);
  const age = Number.isFinite(Number(raw.age)) ? Number(raw.age) : null;
  const attributes = buildAttributes(id, positionGroup, leagueLevel, age);
  const currentAbility = roleAbility(attributes, positionGroup, leagueLevel);
  const potentialAbility = potentialFromAge(currentAbility, age, id);
  const names = splitName(raw.name);

  return {
    id,
    externalIds: { apiFootball: apiId },
    name: raw.name,
    firstName: names.firstName,
    lastName: names.lastName,
    dateOfBirth: null,
    reportedAge: age,
    nationalityCode: null,
    clubId,
    shirtNumber: Number.isInteger(raw.number) && raw.number >= 1 && raw.number <= 99 ? raw.number : null,
    primaryPosition,
    secondaryPositions: [],
    positionGroup,
    preferredFoot: 'unknown',
    heightCm: null,
    weightKg: null,
    currentAbility,
    potentialAbility,
    attributes,
    personality: {
      visibleId: 'balanced',
      source: 'neutral-prior',
      confidence: 'very-low',
      history: []
    },
    contract: { weeklyWage:null, currency:'GBP', startDate:null, endDate:null, squadStatus:null },
    transfer: { listed:false, loanListed:false, interest:'None' },
    seasonStats: [],
    careerHistory: [],
    dataQuality: {
      identitySource: 'api-football-current-squad',
      squadMembership: 'current-seasonless-endpoint',
      positionDetail: 'broad-only',
      biography: 'not-loaded-free-tier',
      attributes: 'flm-low-confidence-positional-baseline',
      ratingEngine: 'FLM v1.1.1-compatible baseline; not current-season statistical evidence',
      confidence: 'low'
    },
    isPlaceholder: false
  };
}

function makeClub(manifestClub, row, leagueId, leagueLevel) {
  const team = row.team || {};
  const venue = row.venue || {};
  const apiId = Number(team.id);
  return {
    id: `flm-club-api-football-${apiId}`,
    externalIds: { apiFootball: apiId },
    name: manifestClub.name,
    providerName: team.name || manifestClub.name,
    shortName: manifestClub.name.length <= 18 ? manifestClub.name : manifestClub.name.replace(/ (City|United|Hotspur|Wanderers|Rovers|Albion)$/,'').slice(0,18),
    countryCode: 'ENG',
    leagueId,
    founded: Number.isInteger(team.founded) ? team.founded : null,
    venue: venue.name || null,
    preferredFormation: null,
    reputation: leagueLevel === 1 ? 7600 + (hash(apiId) % 1200) : 5400 + (hash(apiId) % 1200),
    isPlaceholder: false,
    dataQuality: { membershipSource:'official-2026-27-manifest', identitySource:'api-football', badgesIncluded:false }
  };
}

function dedupePlayers(records) {
  const byId = new Map();
  const conflicts = [];

  for (const player of records) {
    const existing = byId.get(player.id);
    if (!existing) {
      byId.set(player.id, player);
      continue;
    }

    if (existing.clubId === player.clubId) {
      const preferred = existing.shirtNumber == null && player.shirtNumber != null ? player : existing;
      byId.set(player.id, preferred);
      continue;
    }

    let preferred = player;
    if (existing.shirtNumber != null && player.shirtNumber == null) preferred = existing;
    else if (existing.shirtNumber == null && player.shirtNumber != null) preferred = player;

    const conflictingClubIds = [...new Set([
      ...(existing.dataQuality?.conflictingClubIds || []),
      existing.clubId,
      player.clubId
    ])];

    preferred = {
      ...preferred,
      dataQuality: {
        ...(preferred.dataQuality || {}),
        squadMembershipConflict: true,
        conflictingClubIds,
        squadMembershipResolution: 'Prefer record with a shirt number; otherwise prefer the later manifest squad record.',
        confidence: 'low'
      }
    };
    byId.set(player.id, preferred);
    conflicts.push({
      playerId: player.externalIds?.apiFootball ?? player.id,
      playerName: player.name,
      conflictingClubIds,
      selectedClubId: preferred.clubId
    });
  }

  const uniqueConflicts = [...new Map(conflicts.map(item => [String(item.playerId), item])).values()];
  return { players:[...byId.values()], conflicts:uniqueConflicts };
}

async function main() {
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
  const flat = manifest.leagues.flatMap(league => league.clubs.map(club => ({ ...club, leagueId:league.id, leagueLevel:league.level })));
  const selection = flat.slice(BATCH_OFFSET, BATCH_OFFSET + BATCH_COUNT);

  await mkdir(OUT_DIR, { recursive:true });
  const allTeamsPayload = await api('/teams', { country:'England' });
  const allTeams = allTeamsPayload.response || [];

  const clubs = [];
  const players = [];
  const missing = [];
  const failures = [];

  for (const target of selection) {
    const row = findTeam(allTeams, target);
    if (!row?.team?.id) {
      missing.push({ club:target.name, leagueId:target.leagueId });
      continue;
    }

    const club = makeClub(target, row, target.leagueId, target.leagueLevel);
    try {
      const squadPayload = await api('/players/squads', { team: row.team.id });
      const block = squadPayload.response?.[0];
      const rawPlayers = Array.isArray(block?.players) ? block.players : [];
      if (!rawPlayers.length) {
        failures.push({ club:target.name, apiTeamId:row.team.id, error:'No current squad returned.' });
        continue;
      }
      clubs.push(club);
      players.push(...rawPlayers.map(player => makePlayer(player, club.id, target.leagueLevel)));
    } catch (error) {
      failures.push({ club:target.name, apiTeamId:row.team.id, error:error.message });
      if (error.code === 'DAILY_RESERVE') break;
    }
  }

  const clubIds = new Set(clubs.map(c => c.id));
  const eligiblePlayers = players.filter(p => clubIds.has(p.clubId));
  const deduped = dedupePlayers(eligiblePlayers);
  const validPlayers = deduped.players;
  const report = {
    importer: 'FLM API-Football Free English Database v1',
    generatedAt: new Date().toISOString(),
    seasonLabel: manifest.snapshotSeason,
    requestedBatch: { offset:BATCH_OFFSET, count:BATCH_COUNT, selected:selection.map(x => ({club:x.name,leagueId:x.leagueId})) },
    result: {
      clubsImported: clubs.length,
      rawSquadRecords: eligiblePlayers.length,
      playersImported: validPlayers.length,
      duplicatePlayerRecordsRemoved: eligiblePlayers.length - validPlayers.length,
      squadMembershipConflicts: deduped.conflicts.length,
      averageSquadSize: clubs.length ? Number((validPlayers.length / clubs.length).toFixed(1)) : 0,
      missingClubMappings: missing.length,
      failedSquads: failures.length
    },
    usage: { callsMade:calls, lastKnownRemainingDailyRequests:lastRemaining, reportedDailyLimit:reportedLimit, requestDelayMs:REQUEST_DELAY_MS, reserve:DAILY_RESERVE },
    missing,
    failures,
    playerMembershipConflicts: deduped.conflicts,
    policy: {
      officialBadgesIncluded:false,
      playerPhotosIncluded:false,
      currentSeasonStatisticsClaimed:false,
      attributeMethod:'Low-confidence FLM positional baselines until current statistical evidence is lawfully available.',
      duplicateMembershipPolicy:'No player ID may appear twice. Cross-club squad conflicts are flagged and resolved deterministically rather than silently duplicated.',
      apiKeyPersisted:false
    }
  };

  await Promise.all([
    writeFile(path.join(OUT_DIR,'clubs-batch.json'), JSON.stringify(clubs,null,2) + '\n'),
    writeFile(path.join(OUT_DIR,'players-batch.json'), JSON.stringify(validPlayers,null,2) + '\n'),
    writeFile(path.join(OUT_DIR,'report.json'), JSON.stringify(report,null,2) + '\n')
  ]);

  console.log(`API-Football English batch: ${clubs.length} clubs / ${validPlayers.length} unique players / ${calls} calls.`);
  if (deduped.conflicts.length) console.log(`Resolved ${deduped.conflicts.length} cross-club player membership conflict(s).`);
  if (missing.length) console.log(`Missing club mappings: ${missing.map(x => x.club).join(', ')}`);
  if (failures.length) console.log(`Squad failures: ${failures.map(x => x.club).join(', ')}`);
  if (!clubs.length) process.exitCode = 2;
}

main().catch(error => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});
