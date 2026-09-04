#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const API_BASE = 'https://api.sportmonks.com/v3/football';
const TOKEN = process.env.SPORTMONKS_API_TOKEN;
const SEASON_ID = 28275;
const LEAGUE_ID = 501;
const STAGING_PATH = process.argv[2] || 'data/staging/private/sportmonks-scottish-premiership-2026-27.json';
const REPORT_PATH = process.argv[3] || 'artifacts/sportmonks-player-stats-quality-report.json';

if (!TOKEN) {
  console.error('SPORTMONKS_API_TOKEN is not available to this workflow.');
  process.exit(1);
}

const ALL_ATTRIBUTES = [
  'crossing', 'dribbling', 'finishing', 'firstTouch', 'heading', 'longShots', 'passing', 'setPieces', 'tackling', 'technique',
  'aggression', 'anticipation', 'composure', 'decisions', 'determination', 'flair', 'leadership', 'offTheBall', 'positioning', 'teamwork', 'vision', 'workRate',
  'acceleration', 'agility', 'balance', 'jumping', 'naturalFitness', 'pace', 'stamina', 'strength'
];
const MODELLED_ATTRIBUTES = ['crossing', 'dribbling', 'finishing', 'heading', 'passing', 'tackling', 'technique', 'positioning', 'vision', 'workRate'];
const UNMODELLED_ATTRIBUTES = ALL_ATTRIBUTES.filter(attribute => !MODELLED_ATTRIBUTES.includes(attribute));

const METRIC_ALIASES = {
  minutes: ['MINUTES_PLAYED', 'MINUTES'], appearances: ['APPEARANCES', 'APPEARANCE'], starts: ['STARTS', 'LINEUPS'],
  goals: ['GOALS'], assists: ['ASSISTS'], shotsTotal: ['SHOTS_TOTAL', 'TOTAL_SHOTS'], shotsOnTarget: ['SHOTS_ON_TARGET', 'SHOTS_ONTARGET', 'ON_TARGET'],
  passesTotal: ['PASSES_TOTAL', 'TOTAL_PASSES'], passesAccurate: ['PASSES_ACCURATE', 'ACCURATE_PASSES', 'PASSES_SUCCESSFUL'], keyPasses: ['KEY_PASSES', 'PASSES_KEY'],
  dribblesAttempts: ['DRIBBLES_ATTEMPTS', 'DRIBBLES_TOTAL', 'TOTAL_DRIBBLES'], dribblesSuccess: ['DRIBBLES_SUCCESS', 'DRIBBLES_WON', 'SUCCESSFUL_DRIBBLES'],
  tackles: ['TACKLES', 'TACKLES_TOTAL'], interceptions: ['INTERCEPTIONS'], duelsTotal: ['DUELS_TOTAL', 'TOTAL_DUELS'], duelsWon: ['DUELS_WON'],
  aerialsTotal: ['AERIALS_TOTAL', 'AERIAL_DUELS_TOTAL', 'TOTAL_AERIALS'], aerialsWon: ['AERIALS_WON', 'AERIAL_DUELS_WON'],
  crossesTotal: ['CROSSES_TOTAL', 'TOTAL_CROSSES'], crossesAccurate: ['CROSSES_ACCURATE', 'ACCURATE_CROSSES', 'CROSSES_SUCCESSFUL'],
  fouls: ['FOULS'], yellowCards: ['YELLOW_CARDS', 'YELLOWCARDS'], redCards: ['RED_CARDS', 'REDCARDS'], saves: ['SAVES'], cleanSheets: ['CLEAN_SHEETS', 'CLEANSHEETS'],
  xg: ['EXPECTED_GOALS', 'XG'], xa: ['EXPECTED_ASSISTS', 'XA'], rating: ['RATING', 'PLAYER_RATING'], touches: ['TOUCHES']
};

async function getJson(endpoint, params = {}) {
  const url = new URL(`${API_BASE}${endpoint}`);
  for (const [key, value] of Object.entries(params)) if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  const response = await fetch(url, {
    headers: { Accept: 'application/json', Authorization: TOKEN },
    signal: AbortSignal.timeout(30000)
  });
  const text = await response.text();
  if (!response.ok) {
    let message = text.slice(0, 500);
    try { const parsed = JSON.parse(text); message = parsed.message || parsed.error || message; } catch {}
    const error = new Error(`${response.status} ${response.statusText}: ${message}`);
    error.status = response.status;
    throw error;
  }
  return text ? JSON.parse(text) : {};
}

function normaliseStatName(value) {
  return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function numberFromValue(value, depth = 0) {
  if (depth > 4 || value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) return Number(value);
  if (Array.isArray(value) || typeof value !== 'object') return null;
  for (const key of ['total', 'count', 'value', 'all', 'overall', 'average', 'avg', 'percentage']) {
    if (Object.prototype.hasOwnProperty.call(value, key)) {
      const nested = numberFromValue(value[key], depth + 1);
      if (nested !== null) return nested;
    }
  }
  for (const nestedValue of Object.values(value)) {
    const nested = numberFromValue(nestedValue, depth + 1);
    if (nested !== null) return nested;
  }
  return null;
}

function flattenDetails(details = []) {
  return details.map(detail => {
    const type = detail?.type || {};
    const developerName = type.developer_name || type.code || type.name || `TYPE_${detail?.type_id || 'UNKNOWN'}`;
    return {
      typeId: detail?.type_id ?? type.id ?? null,
      developerName: normaliseStatName(developerName),
      displayName: type.name || type.code || developerName,
      numericValue: numberFromValue(detail?.value)
    };
  });
}

function statMap(rows) {
  const map = new Map();
  for (const row of rows) if (row.developerName && (!map.has(row.developerName) || (map.get(row.developerName).numericValue === null && row.numericValue !== null))) map.set(row.developerName, row);
  return map;
}

function metricFromMap(map, aliases) {
  const names = aliases.map(normaliseStatName);
  for (const alias of names) {
    const exact = map.get(alias);
    if (exact?.numericValue !== null && exact?.numericValue !== undefined) return exact.numericValue;
  }
  for (const alias of names) for (const [name, row] of map.entries()) if ((name.includes(alias) || alias.includes(name)) && row.numericValue !== null && row.numericValue !== undefined) return row.numericValue;
  return null;
}

function buildMetrics(map) {
  return Object.fromEntries(Object.entries(METRIC_ALIASES).map(([key, aliases]) => [key, metricFromMap(map, aliases)]));
}

const per90 = (value, minutes) => Number.isFinite(value) && Number.isFinite(minutes) && minutes > 0 ? (value / minutes) * 90 : null;
const ratio = (a, b) => Number.isFinite(a) && Number.isFinite(b) && b > 0 ? a / b : null;
const round = (value, decimals = 2) => Number.isFinite(value) ? Number(value.toFixed(decimals)) : null;
const confidenceFromMinutes = minutes => !Number.isFinite(minutes) ? 'none' : minutes >= 720 ? 'medium' : minutes >= 450 ? 'limited' : minutes >= 180 ? 'low' : minutes > 0 ? 'very-low' : 'none';

function weighted(pairs) {
  const available = pairs.filter(([value]) => Number.isFinite(value));
  if (!available.length) return null;
  const totalWeight = available.reduce((sum, [, weight]) => sum + weight, 0);
  return available.reduce((sum, [value, weight]) => sum + value * weight, 0) / totalWeight;
}

function derivedFeatures(metrics, group) {
  const minutes = metrics.minutes;
  const passAccuracy = ratio(metrics.passesAccurate, metrics.passesTotal);
  const dribbleSuccess = ratio(metrics.dribblesSuccess, metrics.dribblesAttempts);
  const aerialWinRate = ratio(metrics.aerialsWon, metrics.aerialsTotal);
  const crossAccuracy = ratio(metrics.crossesAccurate, metrics.crossesTotal);
  const shotAccuracy = ratio(metrics.shotsOnTarget, metrics.shotsTotal);
  const goalConversion = ratio(metrics.goals, metrics.shotsTotal);
  const features = {
    finishing: weighted([[per90(metrics.goals, minutes), .55], [shotAccuracy, .25], [goalConversion, .20]]),
    passing: weighted([[passAccuracy, .45], [per90(metrics.keyPasses, minutes), .35], [per90(metrics.assists, minutes), .20]]),
    dribbling: weighted([[dribbleSuccess, .45], [per90(metrics.dribblesSuccess, minutes), .55]]),
    tackling: weighted([[per90(metrics.tackles, minutes), .62], [per90(metrics.interceptions, minutes), .38]]),
    crossing: weighted([[crossAccuracy, .40], [per90(metrics.crossesAccurate, minutes), .60]]),
    heading: weighted([[aerialWinRate, .45], [per90(metrics.aerialsWon, minutes), .55]]),
    vision: weighted([[per90(metrics.keyPasses, minutes), .60], [per90(metrics.assists, minutes), .40]]),
    workRate: weighted([[per90(metrics.duelsTotal, minutes), .45], [per90(metrics.tackles, minutes), .25], [per90(metrics.interceptions, minutes), .20], [Number.isFinite(metrics.appearances) && metrics.appearances > 0 && Number.isFinite(minutes) ? minutes / metrics.appearances : null, .10]]),
    positioning: group === 'DEF' ? weighted([[per90(metrics.interceptions, minutes), .60], [per90(metrics.duelsWon, minutes), .40]]) : weighted([[per90(metrics.goals, minutes), .35], [per90(metrics.shotsOnTarget, minutes), .35], [per90(metrics.keyPasses, minutes), .30]]),
    technique: weighted([[passAccuracy, .40], [dribbleSuccess, .35], [per90(metrics.keyPasses, minutes), .25]])
  };
  if (group === 'GK') {
    features.finishing = features.dribbling = features.tackling = features.crossing = features.heading = features.vision = null;
    features.positioning = weighted([[per90(metrics.saves, minutes), .70], [per90(metrics.cleanSheets, minutes), .30]]);
    features.workRate = Number.isFinite(minutes) && Number.isFinite(metrics.appearances) && metrics.appearances > 0 ? minutes / metrics.appearances : null;
    features.technique = features.passing = passAccuracy;
  }
  return features;
}

function percentile(values, value) {
  if (!Number.isFinite(value)) return null;
  const sorted = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (sorted.length < 5) return null;
  let below = 0, equal = 0;
  for (const item of sorted) { if (item < value) below += 1; else if (item === value) equal += 1; }
  return (below + Math.max(0, equal - 1) / 2) / Math.max(1, sorted.length - 1);
}
const ratingFromPercentile = p => Number.isFinite(p) ? Math.max(3, Math.min(19, Math.round(4 + p * 14))) : null;

function ageOn(dateOfBirth) {
  if (!dateOfBirth) return null;
  const dob = new Date(`${dateOfBirth}T00:00:00Z`), onDate = new Date('2026-09-04T00:00:00Z');
  if (Number.isNaN(dob.getTime())) return null;
  let age = onDate.getUTCFullYear() - dob.getUTCFullYear();
  if (onDate.getUTCMonth() < dob.getUTCMonth() || (onDate.getUTCMonth() === dob.getUTCMonth() && onDate.getUTCDate() < dob.getUTCDate())) age -= 1;
  return age;
}

function selectSamples(records, target = 48) {
  const selected = [];
  for (const group of ['GK', 'DEF', 'MID', 'ATT']) {
    const rows = records.filter(r => r.player.positionGroup === group).sort((a, b) => (b.metrics.minutes || 0) - (a.metrics.minutes || 0));
    const wanted = Math.min(12, rows.length);
    for (let i = 0; i < wanted; i += 1) {
      const index = Math.round(i * (rows.length - 1) / Math.max(1, wanted - 1));
      if (rows[index] && !selected.includes(rows[index])) selected.push(rows[index]);
    }
  }
  return selected.slice(0, target);
}

async function main() {
  const staging = JSON.parse(await readFile(STAGING_PATH, 'utf8'));
  const players = staging.players || [];
  const clubs = staging.clubs || [];
  if (!players.length || !clubs.length) throw new Error(`No staged Scottish data found at ${STAGING_PATH}.`);

  const playerBySportmonksId = new Map(players.map(player => [Number(player.externalIds?.sportmonks), player]));
  const clubNames = new Map(clubs.map(club => [club.id, club.name]));
  const recordsByPlayerId = new Map();
  const teamReports = [];

  console.log(`Fetching season squad statistics for ${clubs.length} Scottish Premiership clubs...`);
  for (const club of clubs) {
    const teamId = Number(club.externalIds?.sportmonks);
    if (!teamId) continue;
    try {
      const payload = await getJson(`/squads/seasons/${SEASON_ID}/teams/${teamId}`, { include: 'details.type' });
      const rows = payload.data || [];
      let matched = 0;
      for (const row of rows) {
        const player = playerBySportmonksId.get(Number(row.player_id));
        if (!player) continue;
        const statRows = flattenDetails(row.details || []);
        recordsByPlayerId.set(Number(row.player_id), { ok: true, player, statRows, metrics: buildMetrics(statMap(statRows)) });
        matched += 1;
      }
      teamReports.push({ teamId, teamName: club.name, returnedPlayerStatisticRows: rows.length, matchedActivePlayers: matched, accessible: true });
      console.log(`${club.name}: ${rows.length} player-stat rows, ${matched} matched to active staging squad.`);
    } catch (error) {
      teamReports.push({ teamId, teamName: club.name, returnedPlayerStatisticRows: 0, matchedActivePlayers: 0, accessible: false, status: error.status || null, reason: error.message });
      console.warn(`${club.name}: statistics request failed: ${error.message}`);
    }
  }

  const results = players.map(player => recordsByPlayerId.get(Number(player.externalIds?.sportmonks)) || { ok: true, player, statRows: [], metrics: buildMetrics(new Map()) });
  const successfulTeams = teamReports.filter(team => team.accessible);
  const withStats = results.filter(result => result.statRows.length > 0);

  const statTypeSummary = new Map();
  for (const result of results) {
    const seen = new Set();
    for (const row of result.statRows) {
      if (!row.developerName || seen.has(row.developerName)) continue;
      seen.add(row.developerName);
      const entry = statTypeSummary.get(row.developerName) || { developerName: row.developerName, displayName: row.displayName, typeId: row.typeId, players: 0, numericPlayers: 0 };
      entry.players += 1;
      if (row.numericValue !== null) entry.numericPlayers += 1;
      statTypeSummary.set(row.developerName, entry);
    }
  }

  const metricCoverage = {};
  for (const metric of Object.keys(METRIC_ALIASES)) {
    const count = results.filter(result => Number.isFinite(result.metrics[metric])).length;
    metricCoverage[metric] = { players: count, percentOfStaged: Number(((count / players.length) * 100).toFixed(1)) };
  }

  const modelRecords = results.map(result => ({ ...result, features: derivedFeatures(result.metrics, result.player.positionGroup), ratings: {} }));
  for (const group of ['GK', 'DEF', 'MID', 'ATT']) for (const attribute of MODELLED_ATTRIBUTES) {
    const peers = modelRecords.filter(record => record.player.positionGroup === group).map(record => record.features[attribute]).filter(Number.isFinite);
    for (const record of modelRecords.filter(record => record.player.positionGroup === group)) record.ratings[attribute] = ratingFromPercentile(percentile(peers, record.features[attribute]));
  }

  const samples = selectSamples(modelRecords).map(record => ({
    name: record.player.name, club: clubNames.get(record.player.clubId) || null, positionGroup: record.player.positionGroup,
    detailedPositionId: record.player.sportmonksDetailedPositionId ?? null, age: ageOn(record.player.dateOfBirth),
    minutes: round(record.metrics.minutes, 0), appearances: round(record.metrics.appearances, 0), dataConfidence: confidenceFromMinutes(record.metrics.minutes),
    observed: { goals: round(record.metrics.goals, 0), assists: round(record.metrics.assists, 0), passAccuracy: round(ratio(record.metrics.passesAccurate, record.metrics.passesTotal) * 100, 1), tacklesPer90: round(per90(record.metrics.tackles, record.metrics.minutes), 2), interceptionsPer90: round(per90(record.metrics.interceptions, record.metrics.minutes), 2), dribblesWonPer90: round(per90(record.metrics.dribblesSuccess, record.metrics.minutes), 2), keyPassesPer90: round(per90(record.metrics.keyPasses, record.metrics.minutes), 2) },
    provisionalRatings: Object.fromEntries(Object.entries(record.ratings).filter(([, value]) => value !== null))
  }));

  const minutesValues = results.map(result => result.metrics.minutes).filter(Number.isFinite).sort((a,b) => a-b);
  const coreMetrics = ['minutes','appearances','goals','assists','shotsTotal','shotsOnTarget','passesTotal','passesAccurate','keyPasses','tackles','interceptions','duelsTotal','duelsWon','dribblesAttempts','dribblesSuccess','aerialsTotal','aerialsWon','crossesTotal','crossesAccurate'];
  const coreCoverageAverage = coreMetrics.reduce((sum, metric) => sum + metricCoverage[metric].percentOfStaged, 0) / coreMetrics.length;

  const report = {
    provider: 'sportmonks', generatedAt: new Date().toISOString(),
    scope: 'FLM Data Quality Test v2 - Scottish Premiership 2026/27 player statistics and provisional ratings',
    seasonId: SEASON_ID, leagueId: LEAGUE_ID, stagedPlayerCount: players.length,
    requestSummary: { strategy: '12 team-season squad-statistic requests using /squads/seasons/{season}/teams/{team}?include=details.type', teamRequestsAttempted: teamReports.length, successfulTeamRequests: successfulTeams.length, failedTeamRequests: teamReports.length - successfulTeams.length, teamReports },
    statisticsAccess: { accessible: successfulTeams.length > 0 && withStats.length > 0, playersWithSeasonStatistics: withStats.length, percentOfStagedWithStats: Number(((withStats.length / players.length) * 100).toFixed(1)), uniqueStatisticTypes: statTypeSummary.size, coreMetricCoverageAveragePercent: Number(coreCoverageAverage.toFixed(1)) },
    currentSeasonSampleSize: { playersWithMinutes: minutesValues.length, medianMinutes: minutesValues.length ? round(minutesValues[Math.floor(minutesValues.length / 2)], 0) : null, atLeast90Minutes: results.filter(r => (r.metrics.minutes || 0) >= 90).length, atLeast180Minutes: results.filter(r => (r.metrics.minutes || 0) >= 180).length, atLeast450Minutes: results.filter(r => (r.metrics.minutes || 0) >= 450).length, atLeast720Minutes: results.filter(r => (r.metrics.minutes || 0) >= 720).length },
    keyMetricCoverage: metricCoverage,
    statisticTypeCoverage: [...statTypeSummary.values()].sort((a,b) => b.players - a.players || a.developerName.localeCompare(b.developerName)).map(entry => ({ ...entry, percentOfStaged: Number(((entry.players / players.length) * 100).toFixed(1)), numericPercentOfStaged: Number(((entry.numericPlayers / players.length) * 100).toFixed(1)) })),
    ratingEngineV1: { status: 'experimental-calibration-only', scale: '1-20', modelledAttributes: MODELLED_ATTRIBUTES, unmodelledAttributes: UNMODELLED_ATTRIBUTES, methodology: 'Position-group percentile model using current-season Sportmonks data. It intentionally leaves unmeasurable physical and mental attributes unmodelled rather than inventing them.', caveats: ['2026/27 is still early in the season, so low-minute players have weak statistical confidence.','Ratings are relative to Scottish Premiership positional peers and are not yet calibrated to an absolute cross-league FLM scale.','League strength, club strength, prior-season performance, scouting input and manual calibration are not yet applied.','A missing provisional rating means the required statistic inputs were not available in sufficient peer coverage.'], samplePlayerCount: samples.length, samplePlayers: samples },
    verdict: { squadPipelineAlreadyPassed: true, statisticsPipelinePass: successfulTeams.length === clubs.length && withStats.length / Math.max(1, players.length) >= .8, ratingEngineReadyForProduction: false, nextGate: 'Calibrate supported attributes with prior-season data and league-strength factors, then define separate models for physical/mental attributes before publishing ratings in Football Lab Manager.' },
    publicationPolicy: { rawPlayerStatisticsCommitted: false, rawPlayerStatisticsUploadedAsArtifact: false, reportContains: 'coverage aggregates plus a 48-player calibration sample only', apiTokenPersisted: false }
  };

  await mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`Stats access: ${successfulTeams.length}/${clubs.length} teams.`);
  console.log(`Players with current-season statistics: ${withStats.length}/${players.length}.`);
  console.log(`Unique player statistic types: ${statTypeSummary.size}.`);
  console.log(`Core metric average coverage: ${report.statisticsAccess.coreMetricCoverageAveragePercent}%.`);
  console.log(`Calibration sample: ${samples.length} players.`);
  console.log(`Sanitised report written to ${REPORT_PATH}.`);
}

main().catch(error => { console.error(error.stack || error.message || error); process.exit(1); });
