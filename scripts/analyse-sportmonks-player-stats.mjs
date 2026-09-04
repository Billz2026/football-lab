#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const API_BASE = 'https://api.sportmonks.com/v3/football';
const TOKEN = process.env.SPORTMONKS_API_TOKEN;
const SEASON_ID = 28275;
const LEAGUE_ID = 501;
const REPORT_PATH = process.argv[2] || 'artifacts/sportmonks-player-stats-quality-report.json';

const CLUBS = [
  [309, 'Motherwell'], [180, 'Kilmarnock'], [273, 'Aberdeen'], [770, 'Falkirk'],
  [66, 'Hibernian'], [53, 'Celtic'], [314, 'Hearts'], [284, 'Dundee'],
  [62, 'Rangers'], [282, 'Dundee United'], [496, 'St. Mirren'], [734, 'St. Johnstone']
].map(([id, name]) => ({ id, name }));

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
    let message = text.slice(0, 500), rateLimit = null;
    try {
      const parsed = JSON.parse(text);
      message = parsed.message || parsed.error || message;
      rateLimit = parsed.rate_limit || parsed.meta?.rate_limit || null;
    } catch {}
    const error = new Error(`${response.status} ${response.statusText}: ${message}`);
    error.status = response.status;
    error.rateLimit = rateLimit;
    throw error;
  }
  return text ? JSON.parse(text) : {};
}

function positionGroup(positionId) {
  switch (Number(positionId)) {
    case 24: return 'GK'; case 25: return 'DEF'; case 26: return 'MID'; case 27: return 'ATT'; default: return 'UNK';
  }
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
    const rows = records.filter(record => record.positionGroup === group).sort((a, b) => (b.metrics.minutes || 0) - (a.metrics.minutes || 0));
    const wanted = Math.min(12, rows.length);
    for (let i = 0; i < wanted; i += 1) {
      const index = Math.round(i * (rows.length - 1) / Math.max(1, wanted - 1));
      if (rows[index] && !selected.includes(rows[index])) selected.push(rows[index]);
    }
  }
  return selected.slice(0, target);
}

async function main() {
  const records = [];
  const teamReports = [];
  console.log(`Fetching ${CLUBS.length} Scottish Premiership team-season squad-statistic feeds...`);

  for (const club of CLUBS) {
    try {
      const payload = await getJson(`/squads/seasons/${SEASON_ID}/teams/${club.id}`, { include: 'player;details.type' });
      const rows = payload.data || [];
      for (const row of rows) {
        const player = row.player || {};
        const statRows = flattenDetails(row.details || []);
        records.push({
          playerId: Number(row.player_id),
          name: player.display_name || player.common_name || player.name || `Player ${row.player_id}`,
          clubId: club.id,
          clubName: club.name,
          positionGroup: positionGroup(row.position_id || player.position_id),
          detailedPositionId: player.detailed_position_id ?? null,
          dateOfBirth: player.date_of_birth || null,
          statRows,
          metrics: buildMetrics(statMap(statRows)),
          features: null,
          ratings: {}
        });
      }
      teamReports.push({ teamId: club.id, teamName: club.name, accessible: true, playerStatisticRows: rows.length, rateLimit: payload.rate_limit || payload.meta?.rate_limit || null });
      console.log(`${club.name}: ${rows.length} player-statistic rows.`);
    } catch (error) {
      teamReports.push({ teamId: club.id, teamName: club.name, accessible: false, playerStatisticRows: 0, status: error.status || null, reason: error.message, rateLimit: error.rateLimit || null });
      console.warn(`${club.name}: failed: ${error.message}`);
    }
  }

  if (!records.length) {
    const report = {
      provider: 'sportmonks', generatedAt: new Date().toISOString(), scope: 'FLM Data Quality Test v2 - Scottish Premiership 2026/27 player statistics',
      seasonId: SEASON_ID, leagueId: LEAGUE_ID, statisticsAccess: { accessible: false }, requestSummary: { teamReports },
      verdict: { statisticsPipelinePass: false, ratingEngineReadyForProduction: false, nextGate: 'Retry after the Sportmonks rate-limit window resets or confirm plan access.' },
      publicationPolicy: { rawPlayerStatisticsCommitted: false, rawPlayerStatisticsUploadedAsArtifact: false, apiTokenPersisted: false }
    };
    await mkdir(path.dirname(REPORT_PATH), { recursive: true });
    await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    console.log(`No statistics rows were returned. Sanitised failure report written to ${REPORT_PATH}.`);
    return;
  }

  const uniquePlayerIds = new Set(records.map(record => record.playerId));
  const withStats = records.filter(record => record.statRows.length > 0);
  const statTypeSummary = new Map();
  for (const record of records) {
    const seen = new Set();
    for (const row of record.statRows) {
      if (!row.developerName || seen.has(row.developerName)) continue;
      seen.add(row.developerName);
      const entry = statTypeSummary.get(row.developerName) || { developerName: row.developerName, displayName: row.displayName, typeId: row.typeId, rows: 0, numericRows: 0 };
      entry.rows += 1; if (row.numericValue !== null) entry.numericRows += 1; statTypeSummary.set(row.developerName, entry);
    }
  }

  const metricCoverage = {};
  for (const metric of Object.keys(METRIC_ALIASES)) {
    const count = records.filter(record => Number.isFinite(record.metrics[metric])).length;
    metricCoverage[metric] = { rows: count, percentOfRows: Number(((count / records.length) * 100).toFixed(1)) };
  }

  for (const record of records) record.features = derivedFeatures(record.metrics, record.positionGroup);
  for (const group of ['GK', 'DEF', 'MID', 'ATT']) for (const attribute of MODELLED_ATTRIBUTES) {
    const peers = records.filter(record => record.positionGroup === group).map(record => record.features[attribute]).filter(Number.isFinite);
    for (const record of records.filter(record => record.positionGroup === group)) record.ratings[attribute] = ratingFromPercentile(percentile(peers, record.features[attribute]));
  }

  const samples = selectSamples(records).map(record => ({
    name: record.name, club: record.clubName, positionGroup: record.positionGroup, detailedPositionId: record.detailedPositionId, age: ageOn(record.dateOfBirth),
    minutes: round(record.metrics.minutes, 0), appearances: round(record.metrics.appearances, 0), dataConfidence: confidenceFromMinutes(record.metrics.minutes),
    observed: { goals: round(record.metrics.goals, 0), assists: round(record.metrics.assists, 0), passAccuracy: round(ratio(record.metrics.passesAccurate, record.metrics.passesTotal) * 100, 1), tacklesPer90: round(per90(record.metrics.tackles, record.metrics.minutes), 2), interceptionsPer90: round(per90(record.metrics.interceptions, record.metrics.minutes), 2), dribblesWonPer90: round(per90(record.metrics.dribblesSuccess, record.metrics.minutes), 2), keyPassesPer90: round(per90(record.metrics.keyPasses, record.metrics.minutes), 2) },
    provisionalRatings: Object.fromEntries(Object.entries(record.ratings).filter(([, value]) => value !== null))
  }));

  const minutesValues = records.map(record => record.metrics.minutes).filter(Number.isFinite).sort((a,b) => a-b);
  const coreMetrics = ['minutes','appearances','goals','assists','shotsTotal','shotsOnTarget','passesTotal','passesAccurate','keyPasses','tackles','interceptions','duelsTotal','duelsWon','dribblesAttempts','dribblesSuccess','aerialsTotal','aerialsWon','crossesTotal','crossesAccurate'];
  const coreCoverageAverage = coreMetrics.reduce((sum, metric) => sum + metricCoverage[metric].percentOfRows, 0) / coreMetrics.length;
  const successfulTeams = teamReports.filter(team => team.accessible).length;

  const report = {
    provider: 'sportmonks', generatedAt: new Date().toISOString(),
    scope: 'FLM Data Quality Test v2 - Scottish Premiership 2026/27 player statistics and provisional ratings', seasonId: SEASON_ID, leagueId: LEAGUE_ID,
    requestSummary: { strategy: '12 team-season squad-statistic requests using include=player;details.type', teamRequestsAttempted: CLUBS.length, successfulTeamRequests: successfulTeams, failedTeamRequests: CLUBS.length - successfulTeams, teamReports },
    population: { playerStatisticRows: records.length, uniquePlayers: uniquePlayerIds.size, duplicatePlayerTeamStints: records.length - uniquePlayerIds.size },
    statisticsAccess: { accessible: successfulTeams > 0 && withStats.length > 0, rowsWithStatistics: withStats.length, percentOfRowsWithStats: Number(((withStats.length / records.length) * 100).toFixed(1)), uniqueStatisticTypes: statTypeSummary.size, coreMetricCoverageAveragePercent: Number(coreCoverageAverage.toFixed(1)) },
    currentSeasonSampleSize: { rowsWithMinutes: minutesValues.length, medianMinutes: minutesValues.length ? round(minutesValues[Math.floor(minutesValues.length / 2)], 0) : null, atLeast90Minutes: records.filter(r => (r.metrics.minutes || 0) >= 90).length, atLeast180Minutes: records.filter(r => (r.metrics.minutes || 0) >= 180).length, atLeast450Minutes: records.filter(r => (r.metrics.minutes || 0) >= 450).length, atLeast720Minutes: records.filter(r => (r.metrics.minutes || 0) >= 720).length },
    keyMetricCoverage: metricCoverage,
    statisticTypeCoverage: [...statTypeSummary.values()].sort((a,b) => b.rows - a.rows || a.developerName.localeCompare(b.developerName)).map(entry => ({ ...entry, percentOfRows: Number(((entry.rows / records.length) * 100).toFixed(1)), numericPercentOfRows: Number(((entry.numericRows / records.length) * 100).toFixed(1)) })),
    ratingEngineV1: { status: 'experimental-calibration-only', scale: '1-20', modelledAttributes: MODELLED_ATTRIBUTES, unmodelledAttributes: UNMODELLED_ATTRIBUTES, methodology: 'Position-group percentile model using current-season Sportmonks statistics. Physical and mental attributes that cannot be inferred reliably are left unmodelled.', caveats: ['The season is still early, so low-minute player ratings have weak confidence.','Ratings are relative to Scottish Premiership positional peers, not yet an absolute cross-league FLM scale.','Prior-season form, league strength, club strength, scouting/manual calibration and age curves are not yet applied.','A missing rating means the required statistical inputs were unavailable or peer coverage was insufficient.'], samplePlayerCount: samples.length, samplePlayers: samples },
    verdict: { squadPipelineAlreadyPassed: true, statisticsPipelinePass: successfulTeams === CLUBS.length && withStats.length / Math.max(1, records.length) >= .8, ratingEngineReadyForProduction: false, nextGate: 'Add prior-season and league-strength calibration for data-driven attributes, then build separate physical/mental attribute models rather than deriving them from match stats.' },
    publicationPolicy: { rawPlayerStatisticsCommitted: false, rawPlayerStatisticsUploadedAsArtifact: false, reportContains: 'coverage aggregates plus a 48-player calibration sample only', apiTokenPersisted: false }
  };

  await mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`Stats access: ${successfulTeams}/${CLUBS.length} teams.`);
  console.log(`Player-statistic rows: ${records.length}; unique players: ${uniquePlayerIds.size}.`);
  console.log(`Unique statistic types: ${statTypeSummary.size}; core metric average coverage: ${report.statisticsAccess.coreMetricCoverageAveragePercent}%.`);
  console.log(`Calibration sample: ${samples.length} players.`);
  console.log(`Sanitised report written to ${REPORT_PATH}.`);
}

main().catch(error => { console.error(error.stack || error.message || error); process.exit(1); });
