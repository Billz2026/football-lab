#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';

const API_BASE = 'https://api.sportmonks.com/v3/football';
const TOKEN = process.env.SPORTMONKS_API_TOKEN;
const REPORT_PATH = process.argv[2] || 'artifacts/flm-rating-engine-v1-1-report.json';
const BASE_REPORT_PATH = process.argv[3] || 'artifacts/flm-rating-engine-v1-base.json';
const BASE_SCRIPT = 'scripts/build-flm-rating-engine-v1-rounds.mjs';
const SEASONS = [
  { id: 25598, label: '2025/2026', weight: 0.65 },
  { id: 28275, label: '2026/2027', weight: 1.0 }
];
const AS_OF = new Date('2026-09-04T00:00:00Z');
const GLOBAL_SCALE = {
  competition: 'Scottish Premiership',
  mean: 10.4,
  spread: 0.72,
  min: 4,
  max: 17,
  rationale: 'FLM calibration prior: Scottish Premiership ratings are compressed from competition-relative percentiles onto a global 1-20 scale. This is a game-design prior, not a provider-supplied strength rating.'
};

if (!TOKEN) throw new Error('SPORTMONKS_API_TOKEN is required.');

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const round = (v, d = 3) => v == null || !Number.isFinite(Number(v)) ? null : Number(Number(v).toFixed(d));
const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;

async function runBaseEngine() {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [BASE_SCRIPT, BASE_REPORT_PATH], {
      stdio: 'inherit',
      env: process.env
    });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`Base FLM Rating Engine exited with code ${code}`)));
  });
  const report = JSON.parse(await readFile(BASE_REPORT_PATH, 'utf8'));
  if (!report?.qualityGate?.pass) throw new Error('Base FLM Rating Engine quality gate did not pass.');
  return report;
}

async function getJson(endpoint, params = {}, retries = 2) {
  const url = new URL(`${API_BASE}${endpoint}`);
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== '') url.searchParams.set(key, String(value));
  }
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const response = await fetch(url, {
      headers: { Accept: 'application/json', Authorization: TOKEN },
      signal: AbortSignal.timeout(30000)
    });
    const text = await response.text();
    if (response.ok) return text ? JSON.parse(text) : {};
    let message = text.slice(0, 400), rateLimit = null;
    try {
      const parsed = JSON.parse(text);
      message = parsed.message || parsed.error || message;
      rateLimit = parsed.rate_limit || parsed.meta?.rate_limit || null;
    } catch {}
    if ((response.status === 429 || response.status >= 500) && attempt < retries) {
      await new Promise(resolve => setTimeout(resolve, response.status === 429 ? 3500 * (attempt + 1) : 1000 * (attempt + 1)));
      continue;
    }
    const error = new Error(`${response.status} ${response.statusText}: ${message}`);
    error.status = response.status;
    error.rateLimit = rateLimit;
    throw error;
  }
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  async function worker() {
    while (true) {
      const index = next++;
      if (index >= items.length) return;
      out[index] = await fn(items[index], index);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

function ageOn(dateOfBirth) {
  if (!dateOfBirth) return null;
  const dob = new Date(`${dateOfBirth}T00:00:00Z`);
  if (Number.isNaN(dob.getTime())) return null;
  let age = AS_OF.getUTCFullYear() - dob.getUTCFullYear();
  const m = AS_OF.getUTCMonth() - dob.getUTCMonth();
  if (m < 0 || (m === 0 && AS_OF.getUTCDate() < dob.getUTCDate())) age -= 1;
  return age;
}

async function getStandings() {
  const out = {};
  for (const season of SEASONS) {
    const payload = await getJson(`/standings/seasons/${season.id}`, { include: 'participant' });
    const rows = payload.data || [];
    const map = {};
    for (const row of rows) {
      const id = Number(row.participant_id);
      if (!id) continue;
      const candidate = {
        teamId: id,
        team: row.participant?.name || row.participant?.short_code || `Team ${id}`,
        position: Number(row.position) || null,
        points: Number(row.points) || 0,
        stageId: row.stage_id ?? null,
        roundId: row.round_id ?? null
      };
      const current = map[id];
      if (!current || candidate.points > current.points || (candidate.points === current.points && (candidate.position || 99) < (current.position || 99))) map[id] = candidate;
    }
    const sorted = Object.values(map).filter(r => r.position).sort((a, b) => a.position - b.position);
    const n = sorted.length;
    for (const row of sorted) row.strengthPercentile = n > 1 ? round((n - row.position) / (n - 1)) : 0.5;
    out[season.label] = { seasonId: season.id, teams: sorted };
  }
  return out;
}

function teamContext(player, standings) {
  const teamName = player.currentTeam || player.primaryTeam;
  if (!teamName) return { team: null, priorRank: null, currentRank: null, strengthPercentile: 0.5, clubBias: 0 };
  const norm = v => String(v || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const find = season => standings[season]?.teams?.find(r => norm(r.team) === norm(teamName));
  const prior = find('2025/2026');
  const current = find('2026/2027');
  const usable = current || prior;
  const strengthPercentile = usable?.strengthPercentile ?? 0.5;
  return {
    team: teamName,
    priorRank: prior?.position ?? null,
    currentRank: current?.position ?? null,
    strengthPercentile,
    clubBias: round((strengthPercentile - 0.5) * 1.0)
  };
}

const EVIDENCE = {
  technical: {
    passing: 'direct', crossing: 'direct', dribbling: 'direct', finishing: 'direct', heading: 'direct', tackling: 'direct',
    firstTouch: 'proxy', technique: 'proxy'
  },
  mental: {
    aggression: 'tendency', anticipation: 'proxy', composure: 'proxy', decisions: 'proxy', offTheBall: 'proxy', positioning: 'proxy', vision: 'proxy', workRate: 'proxy'
  },
  goalkeeping: {
    reflexes: 'direct', distribution: 'direct', handling: 'proxy', aerialReach: 'proxy', positioning: 'proxy'
  }
};

function globalise(relative, tier, clubBias = 0) {
  if (!Number.isFinite(Number(relative))) return null;
  if (tier === 'tendency') return clamp(Math.round(Number(relative)), 1, 20);
  const contextWeight = tier === 'direct' ? 0.25 : tier === 'proxy' ? 0.5 : 0.75;
  const raw = GLOBAL_SCALE.mean + (Number(relative) - 10) * GLOBAL_SCALE.spread + clubBias * contextWeight;
  return clamp(Math.round(raw), GLOBAL_SCALE.min, GLOBAL_SCALE.max);
}

function confidenceFor(base, tier) {
  if (!Number.isFinite(Number(base))) return 0;
  const multiplier = tier === 'direct' ? 1 : tier === 'proxy' ? 0.72 : tier === 'tendency' ? 0.85 : 0.5;
  return round(clamp(Number(base) * multiplier, 0, 1));
}

function calibratedStatFamilies(player, context) {
  const out = { technical: {}, mental: {}, goalkeeping: {} };
  for (const family of Object.keys(out)) {
    for (const [name, relative] of Object.entries(player.ratings?.[family] || {})) {
      const tier = EVIDENCE[family]?.[name] || 'proxy';
      if (player.positionGroup === 'GK' && family === 'technical' && ['firstTouch', 'technique'].includes(name)) continue;
      if (family === 'technical' && name === 'technique' && !['MID', 'ATT'].includes(player.positionGroup)) continue;
      const baseConfidence = player.ratingConfidence?.[family]?.[name] ?? 0;
      out[family][name] = {
        rating: globalise(relative, tier, context.clubBias),
        relativeRating: relative,
        evidenceTier: tier,
        confidence: confidenceFor(baseConfidence, tier)
      };
    }
  }
  return out;
}

function profileCompleteness(profile) {
  const fields = [profile?.date_of_birth, profile?.height, profile?.weight];
  return fields.filter(v => v != null && v !== '').length / fields.length;
}

function physicalBaselines(player, profile, context, calibrated) {
  const group = player.positionGroup;
  const age = ageOn(profile?.date_of_birth);
  const height = Number(profile?.height) || null;
  const weight = Number(profile?.weight) || null;
  const minutes = Number(player.actualMinutes) || 0;
  const heading = calibrated.technical?.heading?.rating ?? 10;
  const workRate = calibrated.mental?.workRate?.rating ?? 10;
  const completeness = profileCompleteness(profile);
  const paceBase = { GK: 8, DEF: 10, MID: 11, ATT: 12 }[group] ?? 10;
  const accelBase = { GK: 8, DEF: 10, MID: 11, ATT: 12 }[group] ?? 10;
  const agilityBase = { GK: 9, DEF: 10, MID: 12, ATT: 12 }[group] ?? 10;
  const balanceBase = { GK: 10, DEF: 11, MID: 11, ATT: 11 }[group] ?? 10;
  const strengthBase = { GK: 11, DEF: 12, MID: 10, ATT: 11 }[group] ?? 10;
  const staminaBase = { GK: 9, DEF: 11, MID: 12, ATT: 11 }[group] ?? 10;
  const ageSpeed = age == null ? 0 : age <= 23 ? 0.8 : age <= 27 ? 0.4 : age <= 30 ? 0 : age <= 33 ? -1.2 : -2.2;
  const heightAgility = height == null ? 0 : height <= 174 ? 1.0 : height >= 193 ? -1.0 : height >= 188 ? -0.5 : 0;
  const heightJump = height == null ? 0 : height >= 193 ? 2.4 : height >= 188 ? 1.4 : height >= 183 ? 0.6 : height <= 174 ? -1.0 : 0;
  const weightStrength = weight == null ? 0 : weight >= 88 ? 1.4 : weight >= 82 ? 0.8 : weight <= 66 ? -0.8 : 0;
  const minutesStamina = minutes >= 4500 ? 1.5 : minutes >= 3000 ? 0.8 : minutes < 1000 ? -0.8 : 0;
  const ageFitness = age == null ? 0 : age <= 27 ? 0.5 : age <= 31 ? 0 : age <= 34 ? -0.8 : -1.5;
  const club = context.clubBias * 0.45;
  const r = v => clamp(Math.round(v), 1, 20);
  const confidenceBase = clamp(0.30 + completeness * 0.15 + Math.min(1, minutes / 3600) * 0.10, 0, 0.58);
  return {
    acceleration: { rating: r(accelBase + ageSpeed + heightAgility * 0.2 + club), confidence: round(confidenceBase), source: 'position-age-body-profile baseline; no speed telemetry' },
    agility: { rating: r(agilityBase + heightAgility + ageSpeed * 0.25 + club), confidence: round(confidenceBase), source: 'position-height-age baseline; no movement telemetry' },
    balance: { rating: r(balanceBase + (weightStrength * 0.35) - (heightAgility < 0 ? 0.2 : 0) + club), confidence: round(confidenceBase * 0.85), source: 'position-body-profile baseline' },
    jumping: { rating: r(10 + heightJump + (heading - 10) * 0.25 + club), confidence: round(clamp(confidenceBase + (height ? 0.08 : 0), 0, 0.65)), source: 'height plus aerial-performance proxy' },
    naturalFitness: { rating: r(10 + ageFitness + (minutes >= 3600 ? 0.6 : 0) + club * 0.3), confidence: round(confidenceBase * 0.72), source: 'age/availability prior; not a medical assessment' },
    pace: { rating: r(paceBase + ageSpeed + heightAgility * 0.25 + club), confidence: round(confidenceBase), source: 'position-age-body-profile baseline; no speed telemetry' },
    stamina: { rating: r(staminaBase + minutesStamina + (workRate - 10) * 0.18 + club), confidence: round(clamp(confidenceBase + 0.08, 0, 0.66)), source: 'workload/minutes/work-rate proxy' },
    strength: { rating: r(strengthBase + weightStrength + heightJump * 0.25 + (heading - 10) * 0.12 + club), confidence: round(clamp(confidenceBase + (weight ? 0.07 : 0), 0, 0.64)), source: 'body profile plus aerial-performance proxy' }
  };
}

function mentalBaselines(player, profile, context, calibrated) {
  const age = ageOn(profile?.date_of_birth);
  const minutes = Number(player.actualMinutes) || 0;
  const get = (...paths) => paths.map(([f, n]) => calibrated[f]?.[n]?.rating).filter(Number.isFinite);
  const flairInputs = get(['technical', 'dribbling'], ['technical', 'technique'], ['mental', 'vision']);
  const teamworkInputs = get(['mental', 'workRate'], ['technical', 'passing'], ['mental', 'decisions']);
  const leadership = 10 + (age != null && age >= 32 ? 2 : age != null && age >= 28 ? 1 : 0) + (minutes >= 4500 ? 1 : 0) + context.clubBias * 0.25;
  return {
    determination: { rating: 10, confidence: 0.15, source: 'neutral prior only; not inferable reliably from match-event data' },
    flair: { rating: clamp(Math.round(flairInputs.length >= 2 ? avg(flairInputs) : 10 + context.clubBias * 0.25), 1, 20), confidence: flairInputs.length >= 2 ? 0.46 : 0.20, source: flairInputs.length >= 2 ? 'dribbling/technique/vision proxy' : 'neutral positional prior' },
    leadership: { rating: clamp(Math.round(leadership), 1, 20), confidence: age != null ? 0.30 : 0.22, source: 'age/seniority/minutes prior; captaincy history not yet modelled' },
    teamwork: { rating: clamp(Math.round(teamworkInputs.length >= 2 ? avg(teamworkInputs) : 10 + context.clubBias * 0.2), 1, 20), confidence: teamworkInputs.length >= 2 ? 0.44 : 0.20, source: teamworkInputs.length >= 2 ? 'work-rate/passing/decision proxy' : 'neutral positional prior' }
  };
}

function ratingDistribution(players, family, tier = null) {
  const values = [];
  for (const p of players) {
    for (const row of Object.values(p.calibratedRatings?.[family] || {})) {
      if (!row || !Number.isFinite(row.rating)) continue;
      if (tier && row.evidenceTier !== tier) continue;
      values.push(row.rating);
    }
  }
  return { count: values.length, mean: round(avg(values), 2), min: values.length ? Math.min(...values) : null, max: values.length ? Math.max(...values) : null };
}

function physicalDistribution(players) {
  const values = players.flatMap(p => Object.values(p.physicalBaselines || {}).map(x => x.rating).filter(Number.isFinite));
  return { count: values.length, mean: round(avg(values), 2), min: values.length ? Math.min(...values) : null, max: values.length ? Math.max(...values) : null };
}

async function main() {
  const base = await runBaseEngine();
  const standings = await getStandings();
  const sample = base.calibrationSample || [];
  const profileResults = await mapLimit(sample, 6, async player => {
    try {
      const payload = await getJson(`/players/${player.playerId}`);
      return { playerId: player.playerId, success: true, profile: payload.data || null };
    } catch (error) {
      return { playerId: player.playerId, success: false, status: error.status || null, reason: error.message, profile: null };
    }
  });
  const profileById = new Map(profileResults.map(r => [r.playerId, r]));
  const calibratedPlayers = sample.map(player => {
    const profile = profileById.get(player.playerId)?.profile;
    const context = teamContext(player, standings);
    const calibratedRatings = calibratedStatFamilies(player, context);
    return {
      playerId: player.playerId, name: player.name, positionGroup: player.positionGroup, team: player.currentTeam || player.primaryTeam || null,
      age: ageOn(profile?.date_of_birth), heightCm: Number(profile?.height) || null, weightKg: Number(profile?.weight) || null, profileLoaded: !!profile,
      actualMinutes: player.actualMinutes, weightedMinutes: player.weightedMinutes, performanceIndexRelative: player.performanceIndex,
      clubContext: context, calibratedRatings,
      physicalBaselines: physicalBaselines(player, profile, context, calibratedRatings),
      mentalBaselines: mentalBaselines(player, profile, context, calibratedRatings)
    };
  });
  const successfulProfiles = profileResults.filter(r => r.success && r.profile).length;
  const directDistribution = { technical: ratingDistribution(calibratedPlayers, 'technical', 'direct'), goalkeeping: ratingDistribution(calibratedPlayers, 'goalkeeping', 'direct') };
  const proxyDistribution = { technical: ratingDistribution(calibratedPlayers, 'technical', 'proxy'), mental: ratingDistribution(calibratedPlayers, 'mental', 'proxy'), goalkeeping: ratingDistribution(calibratedPlayers, 'goalkeeping', 'proxy') };
  const physicalStats = physicalDistribution(calibratedPlayers);
  const noGkWeakTechnical = calibratedPlayers.filter(p => p.positionGroup === 'GK').every(p => !p.calibratedRatings.technical.firstTouch && !p.calibratedRatings.technical.technique);
  const allGlobalInBounds = calibratedPlayers.every(p =>
    Object.values(p.calibratedRatings).every(f => Object.values(f).every(r => Number.isFinite(r.rating) && r.rating >= 1 && r.rating <= 20)) &&
    Object.values(p.physicalBaselines).every(r => r.rating >= 1 && r.rating <= 20) && Object.values(p.mentalBaselines).every(r => r.rating >= 1 && r.rating <= 20)
  );
  const directMaxSafe = [directDistribution.technical.max, directDistribution.goalkeeping.max].filter(Number.isFinite).every(v => v <= GLOBAL_SCALE.max);
  const profileCoverageGood = successfulProfiles >= Math.ceil(sample.length * 0.8);
  const standingsGood = (standings['2025/2026']?.teams?.length || 0) >= 10 && (standings['2026/2027']?.teams?.length || 0) >= 10;
  const baseStillPasses = !!base.qualityGate?.pass;
  const pass = baseStillPasses && sample.length >= 40 && profileCoverageGood && standingsGood && noGkWeakTechnical && allGlobalInBounds && directMaxSafe;
  const report = {
    engine: 'FLM Rating Engine v1.1 Calibration', engineVersion: '1.1.0', generatedAt: new Date().toISOString(), provider: 'sportmonks',
    basedOn: { engineVersion: base.engineVersion, baseQualityGatePass: baseStillPasses, baseCalibrationPlayers: sample.length },
    calibrationPolicy: {
      globalScale: GLOBAL_SCALE,
      evidenceTiers: {
        direct: 'event data is closely tied to the football skill; strongest statistical contribution',
        proxy: 'event data is informative but cannot identify the attribute directly; confidence reduced',
        tendency: 'behavioural tendency, kept competition-relative rather than strength-adjusted',
        baseline: 'position/age/body/seniority prior only; never presented internally as directly measured'
      },
      clubContext: 'standing percentile is a soft prior only. It has small influence on direct attributes and more influence on low-confidence baselines.',
      goalkeeperPolicy: 'Do not infer goalkeeper First Touch or Technique from generic possession proxies.',
      determinationPolicy: 'Neutral prior of 10 with very low confidence until scouting/personality evidence exists.', caPaGenerated: false
    },
    standings: Object.fromEntries(Object.entries(standings).map(([label, data]) => [label, { seasonId: data.seasonId, teamCount: data.teams.length, table: data.teams.map(r => ({ team: r.team, position: r.position, points: r.points, strengthPercentile: r.strengthPercentile })) }])),
    profileCoverage: { attempted: sample.length, successful: successfulProfiles, percent: sample.length ? round(successfulProfiles / sample.length * 100, 1) : 0, withDateOfBirth: calibratedPlayers.filter(p => p.age != null).length, withHeight: calibratedPlayers.filter(p => p.heightCm != null).length, withWeight: calibratedPlayers.filter(p => p.weightKg != null).length },
    distributions: { direct: directDistribution, proxy: proxyDistribution, physicalBaselines: physicalStats }, players: calibratedPlayers,
    qualityGate: {
      pass,
      requirements: { baseRatingEngineStillPasses: baseStillPasses, atLeastFortyCalibrationPlayers: sample.length >= 40, atLeastEightyPercentPlayerProfiles: profileCoverageGood, standingsAvailableForBothSeasons: standingsGood, noGoalkeeperFirstTouchOrTechniqueProxy: noGkWeakTechnical, allRatingsWithinScale: allGlobalInBounds, competitionAdjustedDirectRatingsRespectScottishCeiling: directMaxSafe },
      nextStep: pass ? 'Review recognisable player profiles, tune only football-sanity outliers, then freeze v1.1 and use it as the English import calibration template.' : 'Do not freeze v1.1; fix failed calibration gate(s) first.'
    },
    caveats: ['Competition-strength constants are FLM game-design priors, not Sportmonks ratings.', 'Pace and acceleration are not measured speed data; they remain low-confidence baselines.', 'Strength/agility/balance/jumping use body-profile and performance proxies where available.', 'Determination is deliberately not reverse-engineered from goals, wins or form.', 'Club standing is a weak prior and must never overpower direct player evidence.'],
    publicationPolicy: { apiTokenPersisted: false, rawSportmonksPayloadsCommitted: false, rawSportmonksPayloadsUploaded: false, baseRawAggregatesUploaded: false, artifactContains: 'sanitised standings, profile fields and 48-player derived calibration output only' }
  };
  await mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`Profiles: ${successfulProfiles}/${sample.length}; standings ${standings['2025/2026'].teams.length}/${standings['2026/2027'].teams.length}.`);
  console.log(`Direct technical distribution: ${JSON.stringify(directDistribution.technical)}.`);
  console.log(`Physical baseline distribution: ${JSON.stringify(physicalStats)}.`);
  console.log(`FLM Rating Engine v1.1 quality gate: ${pass ? 'PASS' : 'FAIL'}.`);
  if (!pass) process.exitCode = 2;
}

main().catch(async error => {
  console.error(error.stack || error.message || error);
  await mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, `${JSON.stringify({ engine: 'FLM Rating Engine v1.1 Calibration', engineVersion: '1.1.0', generatedAt: new Date().toISOString(), fatalError: { message: error.message, status: error.status || null, rateLimit: error.rateLimit || null }, qualityGate: { pass: false } }, null, 2)}\n`, 'utf8');
  process.exit(1);
});
