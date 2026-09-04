#!/usr/bin/env node

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const API_BASE = 'https://api.sportmonks.com/v3/football';
const TOKEN = process.env.SPORTMONKS_API_TOKEN;
const SEASON_ID = 28275;
const LEAGUE_ID = 501;
const REPORT_PATH = process.argv[2] || 'artifacts/sportmonks-fixture-player-stats-report.json';
const FIXTURE_SAMPLE_SIZE = 6;

if (!TOKEN) {
  console.error('SPORTMONKS_API_TOKEN is not available to this workflow.');
  process.exit(1);
}

async function getJson(endpoint, params = {}) {
  const url = new URL(`${API_BASE}${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  }
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

function normalise(value) {
  return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function numericValue(value, depth = 0) {
  if (depth > 4 || value === null || value === undefined) return null;
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

async function getSeasonFixtures() {
  const fixtures = [];
  let page = 1;
  while (page <= 5 && fixtures.filter(f => Number(f.state_id) === 5).length < FIXTURE_SAMPLE_SIZE) {
    const payload = await getJson(`/fixtures/seasons/${SEASON_ID}`, { per_page: 50, page });
    fixtures.push(...(payload.data || []));
    if (!payload.pagination?.has_more) break;
    page += 1;
  }
  return fixtures;
}

async function main() {
  const reportBase = {
    provider: 'sportmonks',
    generatedAt: new Date().toISOString(),
    scope: 'FLM Data Quality Test v2b - Scottish Premiership 2026/27 fixture-level player statistics',
    seasonId: SEASON_ID,
    leagueId: LEAGUE_ID,
    publicationPolicy: {
      rawFixturePayloadsCommitted: false,
      rawFixturePayloadsUploadedAsArtifact: false,
      apiTokenPersisted: false
    }
  };

  let fixtures;
  try {
    fixtures = await getSeasonFixtures();
  } catch (error) {
    const report = {
      ...reportBase,
      fixtureDiscovery: { accessible: false, status: error.status || null, reason: error.message, rateLimit: error.rateLimit || null },
      verdict: { fixturePlayerStatsPass: false, reason: 'Could not discover current-season fixtures.' }
    };
    await mkdir(path.dirname(REPORT_PATH), { recursive: true });
    await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    return;
  }

  const finished = fixtures
    .filter(fixture => Number(fixture.state_id) === 5)
    .sort((a, b) => String(b.starting_at || '').localeCompare(String(a.starting_at || '')))
    .slice(0, FIXTURE_SAMPLE_SIZE);

  const fixtureReports = [];
  const typeCoverage = new Map();
  const playerFixtureRows = [];

  for (const fixture of finished) {
    try {
      const payload = await getJson(`/fixtures/${fixture.id}`, { include: 'lineups.details.type;lineups.player' });
      const lineups = payload.data?.lineups || [];
      let rowsWithDetails = 0;
      for (const lineup of lineups) {
        const details = lineup.details || [];
        if (details.length) rowsWithDetails += 1;
        const typeNames = [];
        for (const detail of details) {
          const type = detail.type || {};
          const developerName = normalise(type.developer_name || type.code || type.name || `TYPE_${detail.type_id || 'UNKNOWN'}`);
          if (!developerName) continue;
          typeNames.push(developerName);
          const entry = typeCoverage.get(developerName) || {
            developerName,
            displayName: type.name || type.code || developerName,
            typeId: detail.type_id ?? type.id ?? null,
            playerFixtureRows: 0,
            numericRows: 0
          };
          entry.playerFixtureRows += 1;
          if (numericValue(detail.data ?? detail.value) !== null) entry.numericRows += 1;
          typeCoverage.set(developerName, entry);
        }
        playerFixtureRows.push({
          fixtureId: fixture.id,
          playerId: lineup.player_id,
          playerName: lineup.player?.display_name || lineup.player_name || null,
          positionId: lineup.position_id ?? lineup.player?.position_id ?? null,
          starter: Number(lineup.type_id) === 11,
          detailTypeNames: [...new Set(typeNames)]
        });
      }
      fixtureReports.push({
        fixtureId: fixture.id,
        name: payload.data?.name || fixture.name || null,
        startingAt: payload.data?.starting_at || fixture.starting_at || null,
        accessible: true,
        lineupRows: lineups.length,
        lineupRowsWithDetails: rowsWithDetails,
        uniqueDetailTypes: [...new Set(lineups.flatMap(lineup => (lineup.details || []).map(detail => normalise(detail.type?.developer_name || detail.type?.code || detail.type?.name || `TYPE_${detail.type_id || 'UNKNOWN'}`))))].filter(Boolean).length,
        rateLimit: payload.rate_limit || payload.meta?.rate_limit || null
      });
    } catch (error) {
      fixtureReports.push({ fixtureId: fixture.id, name: fixture.name || null, startingAt: fixture.starting_at || null, accessible: false, status: error.status || null, reason: error.message, rateLimit: error.rateLimit || null });
    }
  }

  const successfulFixtures = fixtureReports.filter(item => item.accessible);
  const rowsWithAnyDetail = playerFixtureRows.filter(row => row.detailTypeNames.length > 0).length;
  const typeRows = [...typeCoverage.values()].sort((a, b) => b.playerFixtureRows - a.playerFixtureRows || a.developerName.localeCompare(b.developerName));
  const totalRows = playerFixtureRows.length;
  const coverageFor = developerName => {
    const entry = typeCoverage.get(developerName);
    return {
      rows: entry?.playerFixtureRows || 0,
      percentOfPlayerFixtureRows: totalRows ? Number((((entry?.playerFixtureRows || 0) / totalRows) * 100).toFixed(1)) : 0
    };
  };

  const keyCoverage = {
    rating: coverageFor('RATING'),
    minutes: coverageFor('MINUTES_PLAYED'),
    shotsTotal: coverageFor('SHOTS_TOTAL'),
    shotsOnTarget: coverageFor('SHOTS_ON_TARGET'),
    passesTotal: coverageFor('PASSES_TOTAL'),
    passesAccurate: coverageFor('PASSES_ACCURATE'),
    keyPasses: coverageFor('KEY_PASSES'),
    tackles: coverageFor('TACKLES'),
    interceptions: coverageFor('INTERCEPTIONS'),
    duelsTotal: coverageFor('DUELS_TOTAL'),
    duelsWon: coverageFor('DUELS_WON'),
    dribblesAttempts: coverageFor('DRIBBLES_ATTEMPTS'),
    dribblesSuccess: coverageFor('DRIBBLES_SUCCESS'),
    aerialsWon: coverageFor('AERIALS_WON'),
    crossesTotal: coverageFor('CROSSES_TOTAL'),
    crossesAccurate: coverageFor('CROSSES_ACCURATE')
  };

  const richTypes = ['RATING','SHOTS_TOTAL','SHOTS_ON_TARGET','PASSES_TOTAL','PASSES_ACCURATE','KEY_PASSES','TACKLES','INTERCEPTIONS','DUELS_TOTAL','DUELS_WON','DRIBBLES_ATTEMPTS','DRIBBLES_SUCCESS','AERIALS_WON','CROSSES_TOTAL','CROSSES_ACCURATE'];
  const availableRichTypes = richTypes.filter(type => typeCoverage.has(type));

  const report = {
    ...reportBase,
    fixtureDiscovery: {
      accessible: true,
      fixturesReturned: fixtures.length,
      finishedFixturesReturned: fixtures.filter(f => Number(f.state_id) === 5).length,
      sampledFixtures: finished.length
    },
    requestSummary: {
      fixtureDetailRequestsAttempted: finished.length,
      successfulFixtureDetailRequests: successfulFixtures.length,
      failedFixtureDetailRequests: finished.length - successfulFixtures.length,
      fixtureReports
    },
    playerFixtureStatistics: {
      playerFixtureRows: totalRows,
      rowsWithAnyDetail,
      percentRowsWithAnyDetail: totalRows ? Number(((rowsWithAnyDetail / totalRows) * 100).toFixed(1)) : 0,
      uniqueStatisticTypes: typeRows.length,
      availableRichTypes,
      availableRichTypeCount: availableRichTypes.length,
      keyCoverage,
      statisticTypeCoverage: typeRows.map(entry => ({
        ...entry,
        percentOfPlayerFixtureRows: totalRows ? Number(((entry.playerFixtureRows / totalRows) * 100).toFixed(1)) : 0,
        numericPercentOfPlayerFixtureRows: totalRows ? Number(((entry.numericRows / totalRows) * 100).toFixed(1)) : 0
      }))
    },
    verdict: {
      fixturePlayerStatsPass: successfulFixtures.length >= 3 && rowsWithAnyDetail / Math.max(1, totalRows) >= 0.6 && availableRichTypes.length >= 8,
      enoughForDataDrivenTechnicalAttributes: availableRichTypes.length >= 8,
      enoughForAllThirtyFLMAttributes: false,
      nextGate: 'If fixture-level detail is rich enough, aggregate completed-match lineup details across the prior and current seasons for supported technical/output attributes; keep physical and most mental attributes on separate calibrated models.'
    }
  };

  await mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`Fixture details: ${successfulFixtures.length}/${finished.length} successful.`);
  console.log(`Player-fixture rows: ${totalRows}; rows with details: ${rowsWithAnyDetail}.`);
  console.log(`Unique detail types: ${typeRows.length}; rich types available: ${availableRichTypes.length}/${richTypes.length}.`);
  console.log(`Sanitised report written to ${REPORT_PATH}.`);
}

main().catch(error => { console.error(error.stack || error.message || error); process.exit(1); });
