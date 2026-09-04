#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const API_BASE = 'https://api.sportmonks.com/v3/football';
const TOKEN = process.env.SPORTMONKS_API_TOKEN;
const REPORT_PATH = process.argv[2] || 'artifacts/flm-rating-engine-v1-report.json';
const DICTIONARY_PATH = 'data/rating/flm-stat-dictionary-v1.json';
const LEAGUE_ID = 501;
const SEASONS = [
  { id: 25598, label: '2025/2026', weight: 0.65 },
  { id: 28275, label: '2026/2027', weight: 1.0 }
];
const PEER_MINUTES = 450;
const FULL_CONFIDENCE_MINUTES = 1800;

if (!TOKEN) throw new Error('SPORTMONKS_API_TOKEN is required.');

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const round = (v, d = 3) => v == null || !Number.isFinite(Number(v)) ? null : Number(Number(v).toFixed(d));
const normalise = v => String(v || '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');

function numericValue(value, depth = 0) {
  if (depth > 5 || value == null) return null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) return Number(value);
  if (Array.isArray(value) || typeof value !== 'object') return null;
  for (const key of ['value', 'total', 'count', 'all', 'overall', 'average', 'avg', 'percentage']) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      const nested = numericValue(value[key], depth + 1);
      if (nested != null) return nested;
    }
  }
  for (const nested of Object.values(value)) {
    const parsed = numericValue(nested, depth + 1);
    if (parsed != null) return parsed;
  }
  return null;
}

async function getJson(endpoint, params = {}, retries = 2) {
  const url = new URL(`${API_BASE}${endpoint}`);
  for (const [key, value] of Object.entries(params)) if (value != null && value !== '') url.searchParams.set(key, String(value));
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const response = await fetch(url, { headers: { Accept: 'application/json', Authorization: TOKEN }, signal: AbortSignal.timeout(60000) });
    const text = await response.text();
    if (response.ok) return text ? JSON.parse(text) : {};
    let message = text.slice(0, 500), rateLimit = null;
    try {
      const parsed = JSON.parse(text);
      message = parsed.message || parsed.error || message;
      rateLimit = parsed.rate_limit || parsed.meta?.rate_limit || null;
    } catch {}
    if ((response.status === 429 || response.status >= 500) && attempt < retries) {
      await new Promise(resolve => setTimeout(resolve, response.status === 429 ? 4000 * (attempt + 1) : 1200 * (attempt + 1)));
      continue;
    }
    const error = new Error(`${response.status} ${response.statusText}: ${message}`);
    error.status = response.status;
    error.rateLimit = rateLimit;
    throw error;
  }
}

function positionGroup(id) {
  return ({ 24: 'GK', 25: 'DEF', 26: 'MID', 27: 'ATT' })[Number(id)] || 'UNK';
}
function dominant(map) {
  return Object.entries(map || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}
function newPlayer(id, name) {
  return {
    playerId: Number(id), name: name || `Player ${id}`, actualMinutes: 0, weightedMinutes: 0, appearances: 0,
    stats: {}, ratingNum: 0, ratingDen: 0,
    positions: { GK: 0, DEF: 0, MID: 0, ATT: 0, UNK: 0 }, teams: {}, currentTeams: {}, teamNames: {}, seasons: {}
  };
}
function add(obj, key, value) {
  if (value == null || !Number.isFinite(Number(value))) return;
  obj[key] = (obj[key] || 0) + Number(value);
}

function buildResolver(dictionary) {
  const aliases = Object.fromEntries(Object.entries(dictionary.stats || {}).map(([key, values]) => [key, values.map(normalise)]));
  return details => {
    const provider = new Map();
    for (const detail of details || []) {
      const name = normalise(detail.type?.developer_name || detail.type?.code || detail.type?.name || `TYPE_${detail.type_id || 'UNKNOWN'}`);
      const value = numericValue(detail.data ?? detail.value);
      if (name && value != null && !provider.has(name)) provider.set(name, value);
    }
    const values = {}, matches = {};
    for (const [key, names] of Object.entries(aliases)) {
      for (const name of names) if (provider.has(name)) { values[key] = provider.get(name); matches[key] = name; break; }
    }
    return { values, matches, observed: [...provider.keys()] };
  };
}

function p90(player, key) {
  return player.weightedMinutes ? ((player.stats[key] || 0) / player.weightedMinutes) * 90 : null;
}
function ratio(player, yes, total, min = 1) {
  const denominator = player.stats[total] || 0;
  return denominator >= min ? clamp((player.stats[yes] || 0) / denominator, 0, 1) : null;
}
function metrics(player) {
  const shots = player.stats.shots || 0, saves = player.stats.saves || 0, conceded = player.stats.goalsConceded || 0;
  return {
    passesP90: p90(player, 'passes'), passAccuracy: ratio(player, 'accuratePasses', 'passes', 20), finalThirdPassesP90: p90(player, 'finalThirdPasses'),
    keyPassesP90: p90(player, 'keyPasses'), chancesCreatedP90: p90(player, 'chancesCreated'), bigChancesCreatedP90: p90(player, 'bigChancesCreated'),
    longBallAccuracy: ratio(player, 'longBallsWon', 'longBalls', 10), touchesP90: p90(player, 'touches'), possessionLostP90: p90(player, 'possessionLost'),
    recoveriesP90: p90(player, 'ballRecoveries'), shotsP90: p90(player, 'shots'), shotsOnTargetPct: ratio(player, 'shotsOnTarget', 'shots', 6),
    goalsP90: p90(player, 'goals'), goalsPerShot: shots >= 6 ? clamp((player.stats.goals || 0) / shots, 0, 1) : null, bigChancesMissedP90: p90(player, 'bigChancesMissed'),
    tacklesP90: p90(player, 'tackles'), tackleWinPct: ratio(player, 'tacklesWon', 'tackles', 8), interceptionsP90: p90(player, 'interceptions'), clearancesP90: p90(player, 'clearances'),
    duelsP90: p90(player, 'duels'), duelWinPct: ratio(player, 'duelsWon', 'duels', 15), aerialsWonP90: p90(player, 'aerialsWon'), aerialWinPct: ratio(player, 'aerialsWon', 'aerials', 8),
    dribbleAttemptsP90: p90(player, 'dribbleAttempts'), successfulDribblesP90: p90(player, 'successfulDribbles'), dispossessedP90: p90(player, 'dispossessed'),
    crossesP90: p90(player, 'crosses'), crossAccuracy: ratio(player, 'accurateCrosses', 'crosses', 6), foulsP90: p90(player, 'fouls'), offsidesP90: p90(player, 'offsides'),
    errorsP90: player.weightedMinutes ? (((player.stats.errorsLeadToShot || 0) + (player.stats.errorsLeadToGoal || 0)) / player.weightedMinutes) * 90 : null,
    ratingAvg: player.ratingDen ? player.ratingNum / player.ratingDen : null,
    savesP90: p90(player, 'saves'), savePct: saves + conceded >= 5 ? clamp(saves / (saves + conceded), 0, 1) : null,
    goalsConcededP90: p90(player, 'goalsConceded'), highClaimsP90: p90(player, 'highClaims'), punchesP90: p90(player, 'punches')
  };
}

const MODELS = {
  technical: {
    passing: { c: .95, m: [['passAccuracy', .40, 1], ['passesP90', .15, 1], ['finalThirdPassesP90', .20, 1], ['keyPassesP90', .25, 1]] },
    crossing: { c: .90, g: ['DEF','MID','ATT'], m: [['crossAccuracy', .55, 1], ['crossesP90', .45, 1]] },
    dribbling: { c: .88, g: ['DEF','MID','ATT'], m: [['successfulDribblesP90', .55, 1], ['dribbleAttemptsP90', .20, 1], ['dispossessedP90', .25, -1]] },
    finishing: { c: .92, g: ['MID','ATT'], m: [['goalsP90', .40, 1], ['shotsOnTargetPct', .30, 1], ['goalsPerShot', .20, 1], ['bigChancesMissedP90', .10, -1]] },
    firstTouch: { c: .62, m: [['possessionLostP90', .45, -1], ['dispossessedP90', .25, -1], ['passAccuracy', .30, 1]] },
    heading: { c: .90, g: ['DEF','MID','ATT'], m: [['aerialWinPct', .60, 1], ['aerialsWonP90', .40, 1]] },
    tackling: { c: .94, g: ['DEF','MID'], m: [['tackleWinPct', .50, 1], ['tacklesP90', .25, 1], ['interceptionsP90', .25, 1]] },
    technique: { c: .68, m: [['passAccuracy', .25, 1], ['keyPassesP90', .20, 1], ['successfulDribblesP90', .25, 1], ['crossAccuracy', .15, 1], ['chancesCreatedP90', .15, 1]] }
  },
  mental: {
    aggression: { c: .78, g: ['DEF','MID','ATT'], tendency: true, m: [['foulsP90', .35, 1], ['tacklesP90', .30, 1], ['duelsP90', .35, 1]] },
    anticipation: { c: .72, g: ['DEF','MID'], m: [['interceptionsP90', .40, 1], ['recoveriesP90', .35, 1], ['duelWinPct', .15, 1], ['errorsP90', .10, -1]] },
    composure: { c: .56, m: [['ratingAvg', .35, 1], ['passAccuracy', .25, 1], ['errorsP90', .20, -1], ['shotsOnTargetPct', .20, 1]] },
    decisions: { c: .62, m: [['passAccuracy', .35, 1], ['possessionLostP90', .30, -1], ['errorsP90', .20, -1], ['keyPassesP90', .15, 1]] },
    offTheBall: { c: .66, g: ['MID','ATT'], m: [['shotsP90', .38, 1], ['goalsP90', .32, 1], ['chancesCreatedP90', .20, 1], ['offsidesP90', .10, 1]] },
    positioning: { c: .74, g: ['DEF','MID'], m: [['interceptionsP90', .35, 1], ['recoveriesP90', .30, 1], ['clearancesP90', .20, 1], ['errorsP90', .15, -1]] },
    vision: { c: .84, g: ['MID','ATT'], m: [['keyPassesP90', .35, 1], ['chancesCreatedP90', .30, 1], ['bigChancesCreatedP90', .20, 1], ['finalThirdPassesP90', .15, 1]] },
    workRate: { c: .70, g: ['DEF','MID','ATT'], m: [['duelsP90', .30, 1], ['recoveriesP90', .30, 1], ['tacklesP90', .20, 1], ['touchesP90', .20, 1]] }
  },
  goalkeeping: {
    reflexes: { c: .80, g: ['GK'], m: [['savePct', .65, 1], ['savesP90', .20, 1], ['ratingAvg', .15, 1]] },
    handling: { c: .60, g: ['GK'], m: [['savePct', .45, 1], ['highClaimsP90', .35, 1], ['errorsP90', .20, -1]] },
    aerialReach: { c: .58, g: ['GK'], m: [['highClaimsP90', .60, 1], ['punchesP90', .20, 1], ['aerialWinPct', .20, 1]] },
    distribution: { c: .72, g: ['GK'], m: [['passAccuracy', .45, 1], ['longBallAccuracy', .35, 1], ['passesP90', .20, 1]] },
    positioning: { c: .60, g: ['GK'], m: [['savePct', .35, 1], ['goalsConcededP90', .35, -1], ['errorsP90', .30, -1]] }
  }
};

const UNSUPPORTED = {
  technical: ['longShots','setPieces'], mental: ['determination','flair','leadership','teamwork'],
  physical: ['acceleration','agility','balance','jumping','naturalFitness','pace','stamina','strength'],
  goalkeeping: ['communication','eccentricity','oneOnOnes']
};

function percentile(value, pool) {
  if (value == null || !Number.isFinite(value) || pool.length < 2) return null;
  const sorted = pool.slice().sort((a,b) => a-b);
  let lower = 0, equal = 0;
  for (const x of sorted) { if (x < value) lower += 1; else if (x === value) equal += 1; }
  return clamp((lower + Math.max(0, equal - 1) / 2) / (sorted.length - 1), 0, 1);
}
function makePools(players) {
  const pools = { GK: {}, DEF: {}, MID: {}, ATT: {} };
  for (const p of players) {
    if (!pools[p.positionGroup] || p.weightedMinutes < PEER_MINUTES) continue;
    for (const [key, value] of Object.entries(p.metrics)) if (value != null && Number.isFinite(value)) (pools[p.positionGroup][key] ||= []).push(value);
  }
  return pools;
}
function rate(model, player, pools) {
  if (model.g && !model.g.includes(player.positionGroup)) return null;
  let sum = 0, valid = 0, total = 0;
  for (const [metric, weight, direction] of model.m) {
    total += weight;
    let p = percentile(player.metrics[metric], pools[player.positionGroup]?.[metric] || []);
    if (p == null) continue;
    if (direction < 0) p = 1 - p;
    sum += p * weight; valid += weight;
  }
  if (!valid || valid / total < .45) return null;
  const pct = sum / valid;
  const minutesConfidence = clamp(Math.sqrt(player.weightedMinutes / FULL_CONFIDENCE_MINUTES), 0, 1);
  const confidence = minutesConfidence * (valid / total) * model.c;
  const raw = 3 + pct * 16;
  const rating = clamp(Math.round(10 + (raw - 10) * (.35 + .65 * confidence)), 1, 20);
  return { rating, confidence: round(confidence), evidenceCoverage: round(valid / total), relativePercentile: round(pct) };
}
function buildRatings(players) {
  const pools = makePools(players);
  for (const player of players) {
    player.ratings = { technical: {}, mental: {}, goalkeeping: {} };
    const performance = [];
    for (const [family, models] of Object.entries(MODELS)) {
      for (const [name, model] of Object.entries(models)) {
        const result = rate(model, player, pools);
        if (!result) continue;
        player.ratings[family][name] = result;
        if (!model.tendency) performance.push(result.rating);
      }
    }
    player.performanceIndex = performance.length ? round(performance.reduce((a,b) => a+b, 0) / performance.length, 2) : null;
    player.overallConfidence = round(clamp(Math.sqrt(player.weightedMinutes / FULL_CONFIDENCE_MINUTES), 0, 1));
  }
}
function samplePlayers(players) {
  const out = [];
  for (const group of ['GK','DEF','MID','ATT']) {
    const rows = players.filter(p => p.positionGroup === group && p.performanceIndex != null && p.weightedMinutes >= PEER_MINUTES)
      .sort((a,b) => b.performanceIndex - a.performanceIndex || b.weightedMinutes - a.weightedMinutes);
    const used = new Set(), teamCounts = new Map();
    for (let i = 0; i < 12 && rows.length; i += 1) {
      const ideal = Math.round((i / 11) * (rows.length - 1));
      let pick = null;
      for (let radius = 0; radius < rows.length && !pick; radius += 1) {
        for (const idx of [ideal - radius, ideal + radius]) {
          const p = rows[idx]; if (!p || used.has(p.playerId)) continue;
          const team = p.currentTeamName || p.primaryTeamName || 'Unknown';
          if ((teamCounts.get(team) || 0) >= 2 && rows.length >= 24) continue;
          pick = p; break;
        }
      }
      if (!pick) pick = rows.find(p => !used.has(p.playerId));
      if (!pick) break;
      used.add(pick.playerId);
      const team = pick.currentTeamName || pick.primaryTeamName || 'Unknown'; teamCounts.set(team, (teamCounts.get(team) || 0) + 1);
      out.push(pick);
    }
  }
  return out;
}
function sanitise(p) {
  const ratings = family => Object.fromEntries(Object.entries(p.ratings[family] || {}).map(([k,v]) => [k, v.rating]));
  const confidence = family => Object.fromEntries(Object.entries(p.ratings[family] || {}).map(([k,v]) => [k, v.confidence]));
  return {
    playerId: p.playerId, name: p.name, positionGroup: p.positionGroup, currentTeam: p.currentTeamName || null, primaryTeam: p.primaryTeamName || null,
    actualMinutes: Math.round(p.actualMinutes), weightedMinutes: Math.round(p.weightedMinutes), seasonMinutes: Object.fromEntries(Object.entries(p.seasons).map(([k,v]) => [k, Math.round(v.minutes)])),
    overallConfidence: p.overallConfidence, performanceIndex: p.performanceIndex,
    ratings: { technical: ratings('technical'), mental: ratings('mental'), goalkeeping: ratings('goalkeeping') },
    ratingConfidence: { technical: confidence('technical'), mental: confidence('mental'), goalkeeping: confidence('goalkeeping') }
  };
}

async function main() {
  const dictionary = JSON.parse(await readFile(DICTIONARY_PATH, 'utf8'));
  const resolve = buildResolver(dictionary);
  const roundJobs = [], seasonReports = [], expectedFixtureIds = new Set();

  for (const season of SEASONS) {
    const schedule = await getJson(`/schedules/seasons/${season.id}`);
    let total = 0, finished = 0, roundsWithFinishedFixtures = 0;
    for (const stage of schedule.data || []) {
      for (const roundRow of stage.rounds || []) {
        const fixtures = roundRow.fixtures || [];
        total += fixtures.length;
        const finishedRows = fixtures.filter(f => Number(f.state_id) === 5);
        finished += finishedRows.length;
        if (!finishedRows.length) continue;
        roundsWithFinishedFixtures += 1;
        for (const f of finishedRows) expectedFixtureIds.add(Number(f.id));
        roundJobs.push({ roundId: Number(roundRow.id), season, expectedFixtureIds: finishedRows.map(f => Number(f.id)) });
      }
    }
    seasonReports.push({ ...season, fixturesInSchedule: total, finishedFixtures: finished, roundsWithFinishedFixtures });
  }

  const players = new Map(), observedTypes = new Set(), aliasMatches = {}, returnedFixtureIds = new Set(), roundReports = [];
  for (let i = 0; i < roundJobs.length; i += 1) {
    const job = roundJobs[i];
    try {
      const payload = await getJson(`/rounds/${job.roundId}`, { include: 'fixtures.lineups.details.type;fixtures.lineups.player;fixtures.participants' });
      const fixtures = payload.data?.fixtures || [];
      const finishedFixtures = fixtures.filter(f => job.expectedFixtureIds.includes(Number(f.id)));
      for (const fixture of finishedFixtures) {
        returnedFixtureIds.add(Number(fixture.id));
        const teamNames = new Map((fixture.participants || []).map(t => [Number(t.id), t.name || t.short_code || `Team ${t.id}`]));
        for (const lineup of fixture.lineups || []) {
          const playerId = lineup.player_id || lineup.player?.id; if (!playerId) continue;
          const { values, matches, observed } = resolve(lineup.details || []);
          for (const t of observed) observedTypes.add(t);
          for (const [canonical, alias] of Object.entries(matches)) { aliasMatches[canonical] ||= {}; aliasMatches[canonical][alias] = (aliasMatches[canonical][alias] || 0) + 1; }
          const minutes = Number(values.minutesPlayed || 0); if (!Number.isFinite(minutes) || minutes <= 0 || minutes > 130) continue;
          const name = lineup.player?.display_name || lineup.player?.common_name || lineup.player?.name || lineup.player_name || `Player ${playerId}`;
          const p = players.get(Number(playerId)) || newPlayer(playerId, name);
          if (/^Player \d+$/.test(p.name) && name) p.name = name;
          const group = positionGroup(lineup.position_id ?? lineup.player?.position_id), teamId = Number(lineup.team_id || 0), wm = minutes * job.season.weight;
          p.actualMinutes += minutes; p.weightedMinutes += wm; p.appearances += 1; p.positions[group] += wm;
          if (teamId) { p.teams[teamId] = (p.teams[teamId] || 0) + wm; if (job.season.label === '2026/2027') p.currentTeams[teamId] = (p.currentTeams[teamId] || 0) + minutes; if (teamNames.has(teamId)) p.teamNames[teamId] = teamNames.get(teamId); }
          p.seasons[job.season.label] ||= { minutes: 0, weightedMinutes: 0, appearances: 0 }; p.seasons[job.season.label].minutes += minutes; p.seasons[job.season.label].weightedMinutes += wm; p.seasons[job.season.label].appearances += 1;
          for (const [key, value] of Object.entries(values)) if (!['minutesPlayed','rating'].includes(key)) add(p.stats, key, value * job.season.weight);
          if (Number.isFinite(values.rating)) { p.ratingNum += values.rating * wm; p.ratingDen += wm; }
          players.set(Number(playerId), p);
        }
      }
      roundReports.push({ roundId: job.roundId, season: job.season.label, expectedFixtures: job.expectedFixtureIds.length, returnedFinishedFixtures: finishedFixtures.length, success: true });
    } catch (error) {
      roundReports.push({ roundId: job.roundId, season: job.season.label, expectedFixtures: job.expectedFixtureIds.length, returnedFinishedFixtures: 0, success: false, status: error.status || null, reason: error.message, rateLimit: error.rateLimit || null });
      if (error.status === 429) break;
    }
  }

  const rows = [...players.values()];
  for (const p of rows) {
    p.positionGroup = dominant(p.positions) || 'UNK';
    const currentId = Number(dominant(p.currentTeams) || 0), primaryId = Number(dominant(p.teams) || 0);
    p.currentTeamName = currentId ? p.teamNames[currentId] || `Team ${currentId}` : null;
    p.primaryTeamName = primaryId ? p.teamNames[primaryId] || `Team ${primaryId}` : null;
    p.metrics = metrics(p);
  }
  const validPlayers = rows.filter(p => ['GK','DEF','MID','ATT'].includes(p.positionGroup));
  buildRatings(validPlayers);
  const calibration = samplePlayers(validPlayers).map(sanitise);
  const peerCounts = Object.fromEntries(['GK','DEF','MID','ATT'].map(g => [g, validPlayers.filter(p => p.positionGroup === g && p.weightedMinutes >= PEER_MINUTES).length]));
  const successfulRounds = roundReports.filter(r => r.success).length;
  const fullFixtureCoverage = returnedFixtureIds.size === expectedFixtureIds.size;
  const pass = fullFixtureCoverage && successfulRounds === roundJobs.length && Object.values(peerCounts).every(n => n >= 8) && calibration.length >= 40;

  const report = {
    engine: 'FLM Rating Engine v1', engineVersion: '1.2.0', generatedAt: new Date().toISOString(), provider: 'sportmonks',
    competition: { leagueId: LEAGUE_ID, name: 'Scottish Premiership', purpose: 'calibration laboratory; competition-relative ratings only' },
    seasons: seasonReports,
    retrieval: {
      method: 'Sportmonks Round by ID with fixtures.lineups.details.type nested include', requestedEntity: 'Round', roundsPlanned: roundJobs.length,
      successfulRounds, expectedFinishedFixtures: expectedFixtureIds.size, returnedFinishedFixtures: returnedFixtureIds.size, fullFixtureCoverage,
      roundReports
    },
    population: { playersWithMinutes: validPlayers.length, peerMinimumWeightedMinutes: PEER_MINUTES, peerCounts, calibrationPlayerCount: calibration.length },
    statisticDictionary: { version: dictionary.version, observedProviderTypeCount: observedTypes.size, observedProviderTypes: [...observedTypes].sort(), aliasMatches },
    ratingPolicy: {
      scale: '1-20', priorSeasonWeight: .65, currentSeasonWeight: 1, normalisation: 'position-group peer percentiles', rateNormalisation: 'weighted per-90 plus success rates',
      confidence: `minute-based shrinkage toward 10 until about ${FULL_CONFIDENCE_MINUTES} weighted minutes, then multiplied by evidence coverage/model confidence`,
      competitionStrengthAdjustment: 'not yet applied', caPaGenerated: false,
      note: 'Calibration output only. Unsupported physical/personality attributes are deliberately not invented from match statistics.'
    },
    supportedAttributes: Object.fromEntries(Object.entries(MODELS).map(([family, models]) => [family, Object.entries(models).map(([name, model]) => ({ name, evidenceConfidence: model.c, allowedGroups: model.g || ['GK','DEF','MID','ATT'], tendency: !!model.tendency }))])),
    unsupportedAttributes: UNSUPPORTED,
    calibrationSample: calibration,
    qualityGate: {
      pass,
      requirements: { complete253FixtureCoverage: fullFixtureCoverage, allRoundRequestsSuccessful: successfulRounds === roundJobs.length, atLeastEightPeersPerGroup: Object.values(peerCounts).every(n => n >= 8), atLeastFortyCalibrationPlayers: calibration.length >= 40 },
      nextStep: pass ? 'Sanity-check the 48-player calibration sample, then add league-strength and separate physical/mental baseline models.' : 'Do not use ratings yet; resolve failed retrieval/coverage gate.'
    },
    publicationPolicy: { apiTokenPersisted: false, rawFixturePayloadsCommitted: false, rawFixturePayloadsUploaded: false, rawAggregatedPlayerStatsUploaded: false, artifactContains: 'sanitised metadata and 48-player derived calibration sample only' }
  };

  await mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`Rounds: ${successfulRounds}/${roundJobs.length}; fixtures ${returnedFixtureIds.size}/${expectedFixtureIds.size}.`);
  console.log(`Players: ${validPlayers.length}; peers ${JSON.stringify(peerCounts)}; calibration ${calibration.length}.`);
  console.log(`Quality gate: ${pass ? 'PASS' : 'FAIL'}.`);
  if (!pass) process.exitCode = 2;
}

main().catch(async error => {
  console.error(error.stack || error.message || error);
  await mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, `${JSON.stringify({ engine: 'FLM Rating Engine v1', engineVersion: '1.2.0', generatedAt: new Date().toISOString(), fatalError: { message: error.message, status: error.status || null, rateLimit: error.rateLimit || null }, qualityGate: { pass: false } }, null, 2)}\n`, 'utf8');
  process.exit(1);
});
