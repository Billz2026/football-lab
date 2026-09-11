#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const API_BASE = 'https://v3.football.api-sports.io';
const API_KEY = process.env.API_FOOTBALL_KEY;
const PLAYERS_PATH = process.env.FLM_PLAYERS_PATH || 'data/current/players.json';
const REPORT_PATH = process.env.FLM_NAME_ENRICH_REPORT || 'artifacts/player-name-enrichment-report.json';
const MAX_REQUESTS = Math.max(1, Math.min(95, Number(process.env.FLM_NAME_ENRICH_MAX_REQUESTS || 90)));
const DAILY_RESERVE = Math.max(1, Number(process.env.FLM_DAILY_RESERVE || 5));
const REQUEST_DELAY_MS = Math.max(6500, Number(process.env.FLM_REQUEST_DELAY_MS || 7000));

if (!API_KEY) throw new Error('API_FOOTBALL_KEY is required.');

let lastCallAt = 0;
let lastRemaining = null;
let requestLimit = null;
let apiCalls = 0;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function clean(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function isInitial(value) {
  return /^\p{L}\.?$/u.test(clean(value));
}

function looksAbbreviated(player) {
  const name = clean(player?.name);
  const firstName = clean(player?.firstName);

  if (!name) return false;
  if (isInitial(firstName)) return true;

  // Covers provider forms such as "S. Lammens" and "J. P. Smith".
  const firstToken = name.split(/\s+/)[0] || '';
  return isInitial(firstToken);
}

function fullNameFromProfile(profile) {
  const firstName = clean(profile?.firstname);
  const lastName = clean(profile?.lastname);

  // We only replace an abbreviated display name when the profile endpoint gives
  // us an actual first name and surname. Mononyms are left untouched.
  if (!firstName || isInitial(firstName) || !lastName) return null;

  return {
    firstName,
    lastName,
    name: `${firstName} ${lastName}`.replace(/\s+/g, ' ').trim()
  };
}

async function readStatus() {
  try {
    const response = await fetch(`${API_BASE}/status`, {
      headers: { Accept: 'application/json', 'x-apisports-key': API_KEY },
      signal: AbortSignal.timeout(30000)
    });
    if (!response.ok) return null;
    const payload = await response.json().catch(() => null);
    const requests = payload?.response?.requests;
    const current = Number(requests?.current);
    const limit = Number(requests?.limit_day);
    if (Number.isFinite(current) && Number.isFinite(limit)) {
      requestLimit = limit;
      lastRemaining = Math.max(0, limit - current);
      return { current, limit, remaining: lastRemaining };
    }
  } catch (error) {
    console.warn(`[FLM] Could not read API status: ${error.message}`);
  }
  return null;
}

async function api(endpoint, params = {}) {
  if (lastRemaining != null && lastRemaining <= DAILY_RESERVE) {
    const error = new Error(`Daily request reserve reached (${lastRemaining} remaining).`);
    error.code = 'DAILY_RESERVE';
    throw error;
  }

  const since = Date.now() - lastCallAt;
  if (lastCallAt && since < REQUEST_DELAY_MS) await sleep(REQUEST_DELAY_MS - since);

  const url = new URL(`${API_BASE}${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  }

  apiCalls += 1;
  const response = await fetch(url, {
    headers: { Accept: 'application/json', 'x-apisports-key': API_KEY },
    signal: AbortSignal.timeout(30000)
  });
  lastCallAt = Date.now();

  const remainingHeader = response.headers.get('x-ratelimit-requests-remaining') || response.headers.get('x-ratelimit-remaining');
  const limitHeader = response.headers.get('x-ratelimit-requests-limit') || response.headers.get('x-ratelimit-limit');
  if (remainingHeader != null && Number.isFinite(Number(remainingHeader))) lastRemaining = Number(remainingHeader);
  if (limitHeader != null && Number.isFinite(Number(limitHeader))) requestLimit = Number(limitHeader);

  const payload = await response.json().catch(() => ({}));
  const errors = payload?.errors && typeof payload.errors === 'object'
    ? Object.entries(payload.errors).filter(([, value]) => value).map(([key, value]) => `${key}: ${value}`)
    : [];

  if (!response.ok || errors.length) {
    const message = errors.join('; ') || payload?.message || `${response.status} ${response.statusText}`;
    const error = new Error(`${endpoint}: ${message}`);
    error.status = response.status;
    throw error;
  }

  return payload;
}

async function main() {
  const players = JSON.parse(await readFile(PLAYERS_PATH, 'utf8'));
  if (!Array.isArray(players)) throw new Error(`${PLAYERS_PATH} must contain a player array.`);

  const candidates = players
    .filter(player => !player?.isPlaceholder)
    .filter(player => Number.isFinite(Number(player?.externalIds?.apiFootball)))
    .filter(looksAbbreviated)
    .sort((a, b) => String(a.clubId || '').localeCompare(String(b.clubId || '')) || clean(a.name).localeCompare(clean(b.name)));

  const statusBefore = await readStatus();
  const allowanceFromQuota = lastRemaining == null
    ? MAX_REQUESTS
    : Math.max(0, lastRemaining - DAILY_RESERVE);
  const requestBudget = Math.min(MAX_REQUESTS, allowanceFromQuota, candidates.length);

  const byId = new Map(players.map((player, index) => [player.id, index]));
  const resolved = [];
  const unresolved = [];
  let stoppedForQuota = false;

  for (const player of candidates.slice(0, requestBudget)) {
    const apiId = Number(player.externalIds.apiFootball);

    try {
      const payload = await api('/players/profiles', { player: apiId });
      const profile = payload?.response?.[0]?.player || null;
      const full = fullNameFromProfile(profile);

      if (!full) {
        unresolved.push({
          id: player.id,
          apiFootballId: apiId,
          clubId: player.clubId,
          previousName: player.name,
          reason: profile ? 'profile-missing-usable-firstname-or-lastname' : 'profile-not-found'
        });
        continue;
      }

      const index = byId.get(player.id);
      if (index == null) continue;

      const previousName = players[index].name;
      players[index] = {
        ...players[index],
        name: full.name,
        firstName: full.firstName,
        lastName: full.lastName,
        dataQuality: {
          ...(players[index].dataQuality || {}),
          identitySource: 'api-football-players-profiles',
          fullNameEnriched: true,
          fullNameEnrichedAt: new Date().toISOString()
        }
      };

      resolved.push({
        id: player.id,
        apiFootballId: apiId,
        clubId: player.clubId,
        previousName,
        fullName: full.name
      });
    } catch (error) {
      if (error.code === 'DAILY_RESERVE') {
        stoppedForQuota = true;
        break;
      }

      unresolved.push({
        id: player.id,
        apiFootballId: apiId,
        clubId: player.clubId,
        previousName: player.name,
        reason: error.message
      });
    }
  }

  if (resolved.length) {
    await writeFile(PLAYERS_PATH, JSON.stringify(players, null, 2) + '\n');
  }

  const remainingCandidates = players
    .filter(player => !player?.isPlaceholder)
    .filter(player => Number.isFinite(Number(player?.externalIds?.apiFootball)))
    .filter(looksAbbreviated);

  const report = {
    generatedAt: new Date().toISOString(),
    playersPath: PLAYERS_PATH,
    totalPlayers: players.length,
    candidatesBefore: candidates.length,
    requestBudget,
    apiCalls,
    resolvedCount: resolved.length,
    unresolvedAttemptedCount: unresolved.length,
    remainingAbbreviatedCount: remainingCandidates.length,
    stoppedForQuota,
    quota: {
      statusBefore,
      requestLimit,
      lastKnownRemaining: lastRemaining,
      dailyReserve: DAILY_RESERVE,
      maxRequestsThisRun: MAX_REQUESTS
    },
    resolved,
    unresolved
  };

  await mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, JSON.stringify(report, null, 2) + '\n');

  console.log(`Player-name enrichment: ${resolved.length} resolved, ${unresolved.length} attempted but unresolved, ${remainingCandidates.length} abbreviated names remain.`);
  console.log(`API calls used: ${apiCalls}; remaining daily requests: ${lastRemaining ?? 'unknown'}.`);

  if (!candidates.length) console.log('No abbreviated API-Football player names require enrichment.');
  if (stoppedForQuota || candidates.length > requestBudget) console.log('Not all candidates were attempted because the request budget/reserve was reached. Run the workflow again after the API quota resets.');
}

main().catch(error => {
  console.error(error.stack || error);
  process.exit(1);
});
