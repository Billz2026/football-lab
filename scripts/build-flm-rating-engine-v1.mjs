#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const API_BASE = 'https://api.sportmonks.com/v3/football';
const TOKEN = process.env.SPORTMONKS_API_TOKEN;
const LEAGUE_ID = 501;
const REPORT_PATH = process.argv[2] || 'artifacts/flm-rating-engine-v1-report.json';
const DICTIONARY_PATH = 'data/rating/flm-stat-dictionary-v1.json';
const TARGET_SEASONS = [
  { label: '2025/2026', startYear: 2025, weight: 0.65 },
  { label: '2026/2027', startYear: 2026, weight: 1.0, fallbackId: 28275 }
];
const FIXTURE_CONCURRENCY = Math.max(1, Math.min(6, Number(process.env.FLM_FIXTURE_CONCURRENCY || 4)));
const PEER_MIN_WEIGHTED_MINUTES = 450;
const FULL_CONFIDENCE_MINUTES = 1800;
const MAX_FAILURE_SAMPLES = 12;

if (!TOKEN) {
  console.error('SPORTMONKS_API_TOKEN is not available to this workflow.');
  process.exit(1);
}

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const round = (value, digits = 3) => value === null || value === undefined || Number.isNaN(value)
  ? null
  : Number(Number(value).toFixed(digits));

function normalise(value) {
  return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function numericValue(value, depth = 0) {
  if (depth > 5 || value === null || value === undefined) return null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
  if (Array.isArray(value) || typeof value !== 'object') return null;
  for (const key of ['value', 'total', 'count', 'all', 'overall', 'average', 'avg', 'percentage']) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      const nested = numericValue(value[key], depth + 1);
      if (nested !== null) return nested;
    }
  }
  for (const nestedValue of Object.values(value)) {
    const nested = numericValue(nestedValue, depth + 1);
    if (nested !== null) return nested;
  }
  return null;
}

async function getJson(endpoint, params = {}, retries = 2) {
  const url = new URL(`${API_BASE}${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  }

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const response = await fetch(url, {
      headers: { Accept: 'application/json', Authorization: TOKEN },
      signal: AbortSignal.timeout(45000)
    });
    const text = await response.text();
    if (response.ok) return text ? JSON.parse(text) : {};

    let message = text.slice(0, 500);
    let rateLimit = null;
    try {
      const parsed = JSON.parse(text);
      message = parsed.message || parsed.error || message;
      rateLimit = parsed.rate_limit || parsed.meta?.rate_limit || null;
    } catch {}

    if ((response.status === 429 || response.status >= 500) && attempt < retries) {
      const waitMs = response.status === 429 ? Math.min(20000, 5000 * (attempt + 1)) : 1500 * (attempt + 1);
      await sleep(waitMs);
      continue;
    }

    const error = new Error(`${response.status} ${response.statusText}: ${message}`);
    error.status = response.status;
    error.rateLimit = rateLimit;
    error.endpoint = endpoint;
    throw error;
  }
  throw new Error(`Unreachable request state for ${endpoint}`);
}

async function getAll(endpoint, params = {}) {
  const rows = [];
  let page = 1;
  while (true) {
    const payload = await getJson(endpoint, { ...params, per_page: 50, page });
    rows.push(...(payload.data || []));
    if (!payload.pagination?.has_more) break;
    page += 1;
    if (page > 30) throw new Error(`Pagination safety limit reached for ${endpoint}`);
  }
  return rows;
}

function flattenSchedule(payload) {
  const fixtures = [];
  for (const stage of payload.data || []) {
    for (const round of stage.rounds || []) {
      for (const fixture of round.fixtures || []) fixtures.push(fixture);
    }
  }
  return fixtures;
}

function seasonMatchesTarget(season, target) {
  const name = String(season.name || season.code || '').replace(/\s+/g, '');
  if (name.includes(String(target.startYear)) && name.includes(String(target.startYear + 1))) return true;
  const startingYear = Number(String(season.starting_at || season.start_date || '').slice(0, 4));
  return startingYear === target.startYear;
}

async function discoverSeasons() {
  let seasons = [];
  const attempts = [];

  try {
    const league = await getJson(`/leagues/${LEAGUE_ID}`, { include: 'seasons' });
    const candidate = league.data?.seasons || league.data?.season || [];
    seasons = Array.isArray(candidate) ? candidate : [candidate].filter(Boolean);
    attempts.push({ endpoint: `/leagues/${LEAGUE_ID}?include=seasons`, rows: seasons.length, success: true });
  } catch (error) {
    attempts.push({ endpoint: `/leagues/${LEAGUE_ID}?include=seasons`, success: false, status: error.status || null, reason: error.message });
  }

  if (seasons.length < 2) {
    try {
      const candidate = await getAll('/seasons', { filters: `leagueIds:${LEAGUE_ID}` });
      const merged = new Map(seasons.map(item => [item.id, item]));
      for (const season of candidate) merged.set(season.id, season);
      seasons = [...merged.values()];
      attempts.push({ endpoint: `/seasons?filters=leagueIds:${LEAGUE_ID}`, rows: candidate.length, success: true });
    } catch (error) {
      attempts.push({ endpoint: `/seasons?filters=leagueIds:${LEAGUE_ID}`, success: false, status: error.status || null, reason: error.message });
    }
  }

  const resolved = [];
  for (const target of TARGET_SEASONS) {
    let season = seasons.find(item => seasonMatchesTarget(item, target));
    if (!season && target.fallbackId) {
      try {
        const payload = await getJson(`/seasons/${target.fallbackId}`);
        season = payload.data || { id: target.fallbackId, name: target.label };
        attempts.push({ endpoint: `/seasons/${target.fallbackId}`, success: true, fallbackFor: target.label });
      } catch (error) {
        attempts.push({ endpoint: `/seasons/${target.fallbackId}`, success: false, fallbackFor: target.label, status: error.status || null, reason: error.message });
      }
    }
    if (!season) throw new Error(`Could not resolve Sportmonks season for ${target.label}.`);
    resolved.push({
      id: season.id,
      name: season.name || target.label,
      startingAt: season.starting_at || null,
      endingAt: season.ending_at || null,
      finished: season.finished ?? null,
      isCurrent: season.is_current ?? null,
      weight: target.weight,
      targetLabel: target.label
    });
  }
  return { resolved, attempts };
}

function positionGroup(positionId) {
  switch (Number(positionId)) {
    case 24: return 'GK';
    case 25: return 'DEF';
    case 26: return 'MID';
    case 27: return 'ATT';
    default: return 'UNK';
  }
}

function getTeamNames(fixture) {
  const map = new Map();
  for (const participant of fixture.participants || []) {
    if (participant?.id) map.set(Number(participant.id), participant.name || participant.short_code || `Team ${participant.id}`);
  }
  return map;
}

function buildAliasResolver(dictionary) {
  const canonical = dictionary.stats || {};
  const aliasSets = new Map();
  for (const [key, aliases] of Object.entries(canonical)) aliasSets.set(key, aliases.map(normalise));
  return {
    canonical,
    resolve(details) {
      const byType = new Map();
      for (const detail of details || []) {
        const providerName = normalise(detail.type?.developer_name || detail.type?.code || detail.type?.name || `TYPE_${detail.type_id || 'UNKNOWN'}`);
        if (!providerName) continue;
        const value = numericValue(detail.data ?? detail.value);
        if (value !== null && !byType.has(providerName)) byType.set(providerName, value);
      }
      const result = {};
      const matches = {};
      for (const [key, aliases] of aliasSets.entries()) {
        for (const alias of aliases) {
          if (byType.has(alias)) {
            result[key] = byType.get(alias);
            matches[key] = alias;
            break;
          }
        }
      }
      return { values: result, matches, observedProviderTypes: [...byType.keys()] };
    }
  };
}

function emptyPlayer(playerId, name) {
  return {
    playerId: Number(playerId),
    name: name || `Player ${playerId}`,
    weightedMinutes: 0,
    actualMinutes: 0,
    appearanceRows: 0,
    statSums: {},
    ratingNumerator: 0,
    ratingDenominator: 0,
    positionMinutes: { GK: 0, DEF: 0, MID: 0, ATT: 0, UNK: 0 },
    teamMinutes: {},
    currentSeasonTeamMinutes: {},
    seasons: {}
  };
}

function add(map, key, amount) {
  if (amount === null || amount === undefined || !Number.isFinite(Number(amount))) return;
  map[key] = (map[key] || 0) + Number(amount);
}

function metricPer90(player, stat) {
  const minutes = player.weightedMinutes;
  if (!minutes) return null;
  return ((player.statSums[stat] || 0) / minutes) * 90;
}

function ratio(player, successStat, attemptStat, minimumAttempts = 1) {
  const attempts = player.statSums[attemptStat] || 0;
  if (attempts < minimumAttempts) return null;
  return clamp((player.statSums[successStat] || 0) / attempts, 0, 1);
}

function buildMetrics(player) {
  const shots = player.statSums.shots || 0;
  const saves = player.statSums.saves || 0;
  const goalsConceded = player.statSums.goalsConceded || 0;
  return {
    passesP90: metricPer90(player, 'passes'),
    passAccuracy: ratio(player, 'accuratePasses', 'passes', 20),
    finalThirdPassesP90: metricPer90(player, 'finalThirdPasses'),
    keyPassesP90: metricPer90(player, 'keyPasses'),
    chancesCreatedP90: metricPer90(player, 'chancesCreated'),
    bigChancesCreatedP90: metricPer90(player, 'bigChancesCreated'),
    longBallAccuracy: ratio(player, 'longBallsWon', 'longBalls', 10),
    touchesP90: metricPer90(player, 'touches'),
    possessionLostP90: metricPer90(player, 'possessionLost'),
    recoveriesP90: metricPer90(player, 'ballRecoveries'),
    shotsP90: metricPer90(player, 'shots'),
    shotsOnTargetPct: ratio(player, 'shotsOnTarget', 'shots', 6),
    goalsP90: metricPer90(player, 'goals'),
    goalsPerShot: shots >= 6 ? clamp((player.statSums.goals || 0) / shots, 0, 1) : null,
    bigChancesMissedP90: metricPer90(player, 'bigChancesMissed'),
    tacklesP90: metricPer90(player, 'tackles'),
    tackleWinPct: ratio(player, 'tacklesWon', 'tackles', 8),
    interceptionsP90: metricPer90(player, 'interceptions'),
    clearancesP90: metricPer90(player, 'clearances'),
    lastManTacklesP90: metricPer90(player, 'lastManTackles'),
    duelsP90: metricPer90(player, 'duels'),
    duelWinPct: ratio(player, 'duelsWon', 'duels', 15),
    aerialsWonP90: metricPer90(player, 'aerialsWon'),
    aerialWinPct: ratio(player, 'aerialsWon', 'aerials', 8),
    dribbleAttemptsP90: metricPer90(player, 'dribbleAttempts'),
    successfulDribblesP90: metricPer90(player, 'successfulDribbles'),
    dispossessedP90: metricPer90(player, 'dispossessed'),
    crossesP90: metricPer90(player, 'crosses'),
    crossAccuracy: ratio(player, 'accurateCrosses', 'crosses', 6),
    foulsP90: metricPer90(player, 'fouls'),
    foulsDrawnP90: metricPer90(player, 'foulsDrawn'),
    offsidesP90: metricPer90(player, 'offsides'),
    errorsP90: player.weightedMinutes ? (((player.statSums.errorsLeadToShot || 0) + (player.statSums.errorsLeadToGoal || 0)) / player.weightedMinutes) * 90 : null,
    ratingAvg: player.ratingDenominator ? player.ratingNumerator / player.ratingDenominator : null,
    captainShare: player.appearanceRows ? clamp((player.statSums.captain || 0) / player.appearanceRows, 0, 1) : null,
    savesP90: metricPer90(player, 'saves'),
    savePct: (saves + goalsConceded) >= 5 ? clamp(saves / (saves + goalsConceded), 0, 1) : null,
    goalsConcededP90: metricPer90(player, 'goalsConceded'),
    highClaimsP90: metricPer90(player, 'highClaims'),
    punchesP90: metricPer90(player, 'punches')
  };
}

function percentile(value, values) {
  if (value === null || value === undefined || !Number.isFinite(value) || values.length < 2) return null;
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (sorted.length < 2) return null;
  let lower = 0;
  let equal = 0;
  for (const candidate of sorted) {
    if (candidate < value) lower += 1;
    else if (candidate === value) equal += 1;
  }
  return clamp((lower + Math.max(0, equal - 1) / 2) / (sorted.length - 1), 0, 1);
}

const ATTRIBUTE_MODELS = {
  technical: {
    passing: { confidence: 0.95, metrics: [['passAccuracy', 0.40, 1], ['passesP90', 0.15, 1], ['finalThirdPassesP90', 0.20, 1], ['keyPassesP90', 0.25, 1]] },
    crossing: { confidence: 0.90, metrics: [['crossAccuracy', 0.55, 1], ['crossesP90', 0.45, 1]] },
    dribbling: { confidence: 0.88, metrics: [['successfulDribblesP90', 0.55, 1], ['dribbleAttemptsP90', 0.20, 1], ['dispossessedP90', 0.25, -1]] },
    finishing: { confidence: 0.92, allowedGroups: ['MID', 'ATT'], metrics: [['goalsP90', 0.40, 1], ['shotsOnTargetPct', 0.30, 1], ['goalsPerShot', 0.20, 1], ['bigChancesMissedP90', 0.10, -1]] },
    firstTouch: { confidence: 0.62, metrics: [['possessionLostP90', 0.45, -1], ['dispossessedP90', 0.25, -1], ['passAccuracy', 0.30, 1]] },
    heading: { confidence: 0.90, metrics: [['aerialWinPct', 0.60, 1], ['aerialsWonP90', 0.40, 1]] },
    tackling: { confidence: 0.94, allowedGroups: ['DEF', 'MID'], metrics: [['tackleWinPct', 0.50, 1], ['tacklesP90', 0.25, 1], ['interceptionsP90', 0.25, 1]] },
    technique: { confidence: 0.68, metrics: [['passAccuracy', 0.25, 1], ['keyPassesP90', 0.20, 1], ['successfulDribblesP90', 0.25, 1], ['crossAccuracy', 0.15, 1], ['chancesCreatedP90', 0.15, 1]] }
  },
  mental: {
    aggression: { confidence: 0.78, metrics: [['foulsP90', 0.35, 1], ['tacklesP90', 0.30, 1], ['duelsP90', 0.35, 1]], note: 'Tendency attribute: higher is not automatically better.' },
    anticipation: { confidence: 0.72, allowedGroups: ['DEF', 'MID'], metrics: [['interceptionsP90', 0.40, 1], ['recoveriesP90', 0.35, 1], ['duelWinPct', 0.15, 1], ['errorsP90', 0.10, -1]] },
    composure: { confidence: 0.56, metrics: [['ratingAvg', 0.35, 1], ['passAccuracy', 0.25, 1], ['errorsP90', 0.20, -1], ['shotsOnTargetPct', 0.20, 1]] },
    decisions: { confidence: 0.62, metrics: [['passAccuracy', 0.35, 1], ['possessionLostP90', 0.30, -1], ['errorsP90', 0.20, -1], ['keyPassesP90', 0.15, 1]] },
    offTheBall: { confidence: 0.66, allowedGroups: ['MID', 'ATT'], metrics: [['shotsP90', 0.38, 1], ['goalsP90', 0.32, 1], ['chancesCreatedP90', 0.20, 1], ['offsidesP90', 0.10, 1]] },
    positioning: { confidence: 0.74, allowedGroups: ['DEF', 'MID'], metrics: [['interceptionsP90', 0.35, 1], ['recoveriesP90', 0.30, 1], ['clearancesP90', 0.20, 1], ['errorsP90', 0.15, -1]] },
    vision: { confidence: 0.84, allowedGroups: ['MID', 'ATT'], metrics: [['keyPassesP90', 0.35, 1], ['chancesCreatedP90', 0.30, 1], ['bigChancesCreatedP90', 0.20, 1], ['finalThirdPassesP90', 0.15, 1]] },
    workRate: { confidence: 0.70, allowedGroups: ['DEF', 'MID', 'ATT'], metrics: [['duelsP90', 0.30, 1], ['recoveriesP90', 0.30, 1], ['tacklesP90', 0.20, 1], ['touchesP90', 0.20, 1]] }
  },
  goalkeeping: {
    reflexes: { confidence: 0.80, allowedGroups: ['GK'], metrics: [['savePct', 0.65, 1], ['savesP90', 0.20, 1], ['ratingAvg', 0.15, 1]] },
    handling: { confidence: 0.60, allowedGroups: ['GK'], metrics: [['savePct', 0.45, 1], ['highClaimsP90', 0.35, 1], ['errorsP90', 0.20, -1]] },
    aerialReach: { confidence: 0.58, allowedGroups: ['GK'], metrics: [['highClaimsP90', 0.60, 1], ['punchesP90', 0.20, 1], ['aerialWinPct', 0.20, 1]] },
    distribution: { confidence: 0.72, allowedGroups: ['GK'], metrics: [['passAccuracy', 0.45, 1], ['longBallAccuracy', 0.35, 1], ['passesP90', 0.20, 1]] },
    positioning: { confidence: 0.60, allowedGroups: ['GK'], metrics: [['savePct', 0.35, 1], ['goalsConcededP90', 0.35, -1], ['errorsP90', 0.30, -1]] }
  }
};

const UNSUPPORTED_ATTRIBUTES = {
  technical: ['longShots', 'setPieces'],
  mental: ['determination', 'flair', 'leadership', 'teamwork'],
  physical: ['acceleration', 'agility', 'balance', 'jumping', 'naturalFitness', 'pace', 'stamina', 'strength'],
  goalkeeping: ['communication', 'eccentricity', 'oneOnOnes']
};

function dominantKey(map) {
  let best = null;
  let bestValue = -1;
  for (const [key, value] of Object.entries(map || {})) {
    if (value > bestValue) { best = key; bestValue = value; }
  }
  return best;
}

function confidenceFromMinutes(weightedMinutes) {
  return clamp(Math.sqrt(Math.max(0, weightedMinutes) / FULL_CONFIDENCE_MINUTES), 0, 1);
}

function calculateAttribute(model, player, metricPools) {
  if (model.allowedGroups && !model.allowedGroups.includes(player.positionGroup)) return null;
  let score = 0;
  let validWeight = 0;
  let totalWeight = 0;
  for (const [metricName, weight, direction] of model.metrics) {
    totalWeight += weight;
    const value = player.metrics[metricName];
    const pool = metricPools[player.positionGroup]?.[metricName] || [];
    let p = percentile(value, pool);
    if (p === null) continue;
    if (direction < 0) p = 1 - p;
    score += p * weight;
    validWeight += weight;
  }
  if (!validWeight || validWeight / totalWeight < 0.45) return null;
  const percentileScore = score / validWeight;
  const rawRating = 3 + percentileScore * 16;
  const coverage = validWeight / totalWeight;
  const confidence = confidenceFromMinutes(player.weightedMinutes) * coverage * model.confidence;
  const shrunk = 10 + (rawRating - 10) * (0.35 + 0.65 * confidence);
  return {
    rating: clamp(Math.round(shrunk), 1, 20),
    confidence: round(confidence, 3),
    evidenceCoverage: round(coverage, 3),
    relativePercentile: round(percentileScore, 3)
  };
}

function buildMetricPools(players) {
  const pools = {};
  for (const group of ['GK', 'DEF', 'MID', 'ATT']) pools[group] = {};
  for (const player of players) {
    if (!pools[player.positionGroup] || player.weightedMinutes < PEER_MIN_WEIGHTED_MINUTES) continue;
    for (const [metricName, value] of Object.entries(player.metrics || {})) {
      if (value === null || value === undefined || !Number.isFinite(value)) continue;
      (pools[player.positionGroup][metricName] ||= []).push(value);
    }
  }
  return pools;
}

function addAttributes(players, pools) {
  for (const player of players) {
    player.ratings = { technical: {}, mental: {}, goalkeeping: {} };
    for (const [family, models] of Object.entries(ATTRIBUTE_MODELS)) {
      for (const [name, model] of Object.entries(models)) {
        const value = calculateAttribute(model, player, pools);
        if (value) player.ratings[family][name] = value;
      }
    }
    const supported = Object.values(player.ratings).flatMap(group => Object.values(group)).filter(Boolean);
    player.performanceIndex = supported.length
      ? round(supported.reduce((sum, item) => sum + item.rating, 0) / supported.length, 2)
      : null;
    player.overallConfidence = round(confidenceFromMinutes(player.weightedMinutes), 3);
  }
}

function selectCalibration(players, perGroup = 12) {
  const selected = [];
  for (const group of ['GK', 'DEF', 'MID', 'ATT']) {
    const candidates = players
      .filter(player => player.positionGroup === group && player.performanceIndex !== null && player.weightedMinutes >= PEER_MIN_WEIGHTED_MINUTES)
      .sort((a, b) => b.performanceIndex - a.performanceIndex || b.weightedMinutes - a.weightedMinutes);
    if (!candidates.length) continue;
    const used = new Set();
    const teamCounts = new Map();
    for (let i = 0; i < perGroup; i += 1) {
      const target = perGroup === 1 ? 0 : i / (perGroup - 1);
      const ideal = Math.round(target * (candidates.length - 1));
      let choice = null;
      for (let radius = 0; radius < candidates.length && !choice; radius += 1) {
        for (const index of [ideal - radius, ideal + radius]) {
          const candidate = candidates[index];
          if (!candidate || used.has(candidate.playerId)) continue;
          const team = candidate.currentTeamName || candidate.primaryTeamName || 'Unknown';
          if ((teamCounts.get(team) || 0) >= 2 && candidates.length >= perGroup * 2) continue;
          choice = candidate;
          break;
        }
      }
      if (!choice) choice = candidates.find(candidate => !used.has(candidate.playerId));
      if (!choice) break;
      used.add(choice.playerId);
      const team = choice.currentTeamName || choice.primaryTeamName || 'Unknown';
      teamCounts.set(team, (teamCounts.get(team) || 0) + 1);
      selected.push(choice);
    }
  }
  return selected;
}

function sanitisePlayer(player) {
  const seasonMinutes = {};
  for (const [season, data] of Object.entries(player.seasons || {})) seasonMinutes[season] = Math.round(data.actualMinutes || 0);
  const simplify = family => Object.fromEntries(Object.entries(player.ratings[family] || {}).map(([key, value]) => [key, value.rating]));
  const confidence = family => Object.fromEntries(Object.entries(player.ratings[family] || {}).map(([key, value]) => [key, value.confidence]));
  return {
    playerId: player.playerId,
    name: player.name,
    positionGroup: player.positionGroup,
    currentTeam: player.currentTeamName || null,
    primaryTeam: player.primaryTeamName || null,
    actualMinutes: Math.round(player.actualMinutes),
    weightedMinutes: Math.round(player.weightedMinutes),
    seasonMinutes,
    overallConfidence: player.overallConfidence,
    performanceIndex: player.performanceIndex,
    ratings: {
      technical: simplify('technical'),
      mental: simplify('mental'),
      goalkeeping: simplify('goalkeeping')
    },
    ratingConfidence: {
      technical: confidence('technical'),
      mental: confidence('mental'),
      goalkeeping: confidence('goalkeeping')
    }
  };
}

async function processFixtures(seasons, resolver) {
  const fixtureJobs = [];
  const seasonReports = [];
  for (const season of seasons) {
    const schedule = await getJson(`/schedules/seasons/${season.id}`);
    const fixtures = flattenSchedule(schedule);
    const finished = fixtures.filter(fixture => Number(fixture.state_id) === 5);
    seasonReports.push({
      id: season.id,
      name: season.name,
      targetLabel: season.targetLabel,
      weight: season.weight,
      fixturesInSchedule: fixtures.length,
      finishedFixtures: finished.length
    });
    for (const fixture of finished) fixtureJobs.push({ fixture, season });
  }

  fixtureJobs.sort((a, b) => String(a.fixture.starting_at || '').localeCompare(String(b.fixture.starting_at || '')));
  const players = new Map();
  const observedTypes = new Set();
  const aliasMatches = {};
  const failures = [];
  let successfulFixtures = 0;
  let rateLimitHit = null;
  let nextIndex = 0;

  async function worker() {
    while (true) {
      if (rateLimitHit) return;
      const index = nextIndex;
      nextIndex += 1;
      if (index >= fixtureJobs.length) return;
      const { fixture, season } = fixtureJobs[index];
      try {
        const payload = await getJson(`/fixtures/${fixture.id}`, { include: 'lineups.details.type;lineups.player;participants' });
        const detailFixture = payload.data || {};
        const teamNames = getTeamNames(detailFixture);
        const lineups = detailFixture.lineups || [];
        for (const lineup of lineups) {
          const playerId = lineup.player_id || lineup.player?.id;
          if (!playerId) continue;
          const { values, matches, observedProviderTypes } = resolver.resolve(lineup.details || []);
          for (const type of observedProviderTypes) observedTypes.add(type);
          for (const [canonical, alias] of Object.entries(matches)) {
            aliasMatches[canonical] ||= {};
            aliasMatches[canonical][alias] = (aliasMatches[canonical][alias] || 0) + 1;
          }
          const minutes = Number(values.minutesPlayed || 0);
          if (!Number.isFinite(minutes) || minutes <= 0) continue;
          const name = lineup.player?.display_name || lineup.player?.common_name || lineup.player?.name || lineup.player_name || `Player ${playerId}`;
          const player = players.get(Number(playerId)) || emptyPlayer(playerId, name);
          if (/^Player \d+$/.test(player.name) && name) player.name = name;
          const group = positionGroup(lineup.position_id ?? lineup.player?.position_id);
          const teamId = Number(lineup.team_id || 0);
          const weightedMinutes = minutes * season.weight;
          player.actualMinutes += minutes;
          player.weightedMinutes += weightedMinutes;
          player.appearanceRows += 1;
          player.positionMinutes[group] = (player.positionMinutes[group] || 0) + weightedMinutes;
          if (teamId) {
            player.teamMinutes[teamId] = (player.teamMinutes[teamId] || 0) + weightedMinutes;
            if (season.targetLabel === '2026/2027') player.currentSeasonTeamMinutes[teamId] = (player.currentSeasonTeamMinutes[teamId] || 0) + minutes;
          }
          const seasonKey = season.targetLabel;
          player.seasons[seasonKey] ||= { actualMinutes: 0, weightedMinutes: 0, appearances: 0 };
          player.seasons[seasonKey].actualMinutes += minutes;
          player.seasons[seasonKey].weightedMinutes += weightedMinutes;
          player.seasons[seasonKey].appearances += 1;

          for (const [key, value] of Object.entries(values)) {
            if (key === 'minutesPlayed' || key === 'rating') continue;
            add(player.statSums, key, value * season.weight);
          }
          if (Number.isFinite(values.rating)) {
            player.ratingNumerator += values.rating * weightedMinutes;
            player.ratingDenominator += weightedMinutes;
          }
          if (teamId && teamNames.has(teamId)) {
            player._teamNames ||= {};
            player._teamNames[teamId] = teamNames.get(teamId);
          }
          players.set(Number(playerId), player);
        }
        successfulFixtures += 1;
      } catch (error) {
        if (failures.length < MAX_FAILURE_SAMPLES) failures.push({ fixtureId: fixture.id, season: season.targetLabel, status: error.status || null, reason: error.message });
        if (error.status === 429) {
          rateLimitHit = { fixtureId: fixture.id, season: season.targetLabel, rateLimit: error.rateLimit || null, reason: error.message };
          return;
        }
      }
      if (index % 10 === 0) await sleep(60);
    }
  }

  await Promise.all(Array.from({ length: FIXTURE_CONCURRENCY }, () => worker()));

  const playerRows = [...players.values()];
  for (const player of playerRows) {
    player.positionGroup = dominantKey(player.positionMinutes) || 'UNK';
    const currentTeamId = Number(dominantKey(player.currentSeasonTeamMinutes) || 0);
    const primaryTeamId = Number(dominantKey(player.teamMinutes) || 0);
    player.currentTeamName = currentTeamId ? player._teamNames?.[currentTeamId] || `Team ${currentTeamId}` : null;
    player.primaryTeamName = primaryTeamId ? player._teamNames?.[primaryTeamId] || `Team ${primaryTeamId}` : null;
    player.metrics = buildMetrics(player);
    delete player._teamNames;
  }

  return {
    players: playerRows,
    seasonReports,
    requestSummary: {
      fixtureRequestsPlanned: fixtureJobs.length,
      successfulFixtures,
      failedFixtures: fixtureJobs.length - successfulFixtures,
      successRate: fixtureJobs.length ? round(successfulFixtures / fixtureJobs.length, 4) : 0,
      rateLimitHit,
      failureSamples: failures
    },
    observedTypes: [...observedTypes].sort(),
    aliasMatches
  };
}

async function main() {
  const dictionary = JSON.parse(await readFile(DICTIONARY_PATH, 'utf8'));
  const resolver = buildAliasResolver(dictionary);
  const discovery = await discoverSeasons();
  const processed = await processFixtures(discovery.resolved, resolver);

  const players = processed.players.filter(player => ['GK', 'DEF', 'MID', 'ATT'].includes(player.positionGroup));
  const pools = buildMetricPools(players);
  addAttributes(players, pools);
  const calibration = selectCalibration(players, 12).map(sanitisePlayer);

  const supportedAttributes = Object.fromEntries(Object.entries(ATTRIBUTE_MODELS).map(([family, models]) => [family, Object.entries(models).map(([name, model]) => ({
    name,
    evidenceConfidence: model.confidence,
    note: model.note || null,
    allowedGroups: model.allowedGroups || ['GK', 'DEF', 'MID', 'ATT']
  }))]));

  const peerCounts = Object.fromEntries(['GK', 'DEF', 'MID', 'ATT'].map(group => [group, players.filter(player => player.positionGroup === group && player.weightedMinutes >= PEER_MIN_WEIGHTED_MINUTES).length]));
  const canonicalCoverage = Object.fromEntries(Object.keys(dictionary.stats || {}).map(key => [key, Object.values(processed.aliasMatches[key] || {}).reduce((sum, count) => sum + count, 0)]));
  const pass = discovery.resolved.length === 2
    && processed.requestSummary.successRate >= 0.95
    && !processed.requestSummary.rateLimitHit
    && Object.values(peerCounts).every(count => count >= 8)
    && calibration.length >= 40;

  const report = {
    engine: 'FLM Rating Engine v1',
    engineVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    provider: 'sportmonks',
    competition: { leagueId: LEAGUE_ID, name: 'Scottish Premiership', purpose: 'calibration laboratory; ratings are competition-relative, not yet globally league-strength adjusted' },
    seasonDiscovery: { attempts: discovery.attempts, resolved: discovery.resolved },
    seasonAggregation: processed.seasonReports,
    requestSummary: processed.requestSummary,
    population: {
      playersWithMinutes: players.length,
      peerMinimumWeightedMinutes: PEER_MIN_WEIGHTED_MINUTES,
      peerCounts,
      calibrationPlayerCount: calibration.length
    },
    statisticDictionary: {
      version: dictionary.version,
      observedProviderTypeCount: processed.observedTypes.length,
      observedProviderTypes: processed.observedTypes,
      canonicalCoverage,
      aliasMatches: processed.aliasMatches
    },
    ratingPolicy: {
      scale: '1-20',
      currentSeasonWeight: 1.0,
      priorSeasonWeight: 0.65,
      normalisation: 'position-group peer percentiles',
      rateNormalisation: 'weighted per-90 plus success percentages where denominators are available',
      confidence: `minute-based shrinkage toward 10 until approximately ${FULL_CONFIDENCE_MINUTES} weighted minutes, multiplied by evidence coverage and model confidence`,
      competitionStrengthAdjustment: 'not applied in v1; required before cross-league/global database release',
      caPaGenerated: false,
      note: 'These ratings are calibration outputs. They are not copied from Football Manager and do not claim to infer unsupported physical/personality traits from match statistics.'
    },
    supportedAttributes,
    unsupportedAttributes: UNSUPPORTED_ATTRIBUTES,
    calibrationSample: calibration,
    qualityGate: {
      pass,
      requirements: {
        twoSeasonsResolved: discovery.resolved.length === 2,
        fixtureSuccessAtLeast95Pct: processed.requestSummary.successRate >= 0.95,
        noRateLimitAbort: !processed.requestSummary.rateLimitHit,
        atLeastEightPeersPerPositionGroup: Object.values(peerCounts).every(count => count >= 8),
        atLeastFortyCalibrationPlayers: calibration.length >= 40
      },
      nextStep: pass
        ? 'Manually sanity-check the 40-50 player calibration sample, then add league-strength/club-context calibration and the separate physical/mental baseline model before using the engine for England.'
        : 'Fix the failed quality gate before treating Rating Engine v1 outputs as usable calibration data.'
    },
    publicationPolicy: {
      apiTokenPersisted: false,
      rawFixturePayloadsCommitted: false,
      rawFixturePayloadsUploaded: false,
      rawAggregatedPlayerStatsUploaded: false,
      artifactContains: 'sanitised coverage metadata plus a 40-50 player derived calibration sample only'
    }
  };

  await mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`Resolved seasons: ${discovery.resolved.map(season => `${season.targetLabel}=${season.id}`).join(', ')}`);
  console.log(`Fixture aggregation: ${processed.requestSummary.successfulFixtures}/${processed.requestSummary.fixtureRequestsPlanned} successful.`);
  console.log(`Players with minutes: ${players.length}; peer counts: ${JSON.stringify(peerCounts)}.`);
  console.log(`Calibration sample: ${calibration.length}; quality gate: ${pass ? 'PASS' : 'FAIL'}.`);
  console.log(`Sanitised report written to ${REPORT_PATH}.`);
}

main().catch(async error => {
  console.error(error.stack || error.message || error);
  try {
    await mkdir(path.dirname(REPORT_PATH), { recursive: true });
    await writeFile(REPORT_PATH, `${JSON.stringify({
      engine: 'FLM Rating Engine v1',
      engineVersion: '1.0.0',
      generatedAt: new Date().toISOString(),
      fatalError: { message: error.message, status: error.status || null, rateLimit: error.rateLimit || null },
      qualityGate: { pass: false },
      publicationPolicy: { apiTokenPersisted: false, rawFixturePayloadsCommitted: false, rawFixturePayloadsUploaded: false }
    }, null, 2)}\n`, 'utf8');
  } catch {}
  process.exit(1);
});
