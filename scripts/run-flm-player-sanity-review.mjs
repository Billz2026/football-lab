#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';

const REPORT_PATH = process.argv[2] || 'artifacts/flm-player-sanity-review.json';
const V11_REPORT_PATH = process.argv[3] || 'artifacts/flm-rating-engine-v1-1-sanity-base.json';
const BASE_REPORT_PATH = process.argv[4] || 'artifacts/flm-rating-engine-v1-sanity-base.json';
const V11_SCRIPT = 'scripts/build-flm-rating-engine-v1-1-calibration.mjs';

const SCALE = {
  mean: 10.1,
  directSpread: 0.64,
  proxySpread: 0.56,
  directContextWeight: 0.35,
  proxyContextWeight: 0.45,
  min: 4,
  max: 16
};

const REVIEW_NAMES = [
  'Kasper Schmeichel',
  'Cameron Carter-Vickers',
  'Connor Barron',
  'Jamie McGrath',
  'Luke McCowan',
  'Youssef Chermiti',
  'Brian Graham',
  'Nicky Cadden'
];

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const round = (v, d = 3) => v == null || !Number.isFinite(Number(v)) ? null : Number(Number(v).toFixed(d));
const avg = arr => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
const normaliseName = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');

async function runV11() {
  await new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [V11_SCRIPT, V11_REPORT_PATH, BASE_REPORT_PATH], {
      stdio: 'inherit',
      env: process.env
    });
    child.on('error', reject);
    child.on('exit', code => code === 0 ? resolve() : reject(new Error(`FLM Rating Engine v1.1 exited with code ${code}`)));
  });
  const [v11, base] = await Promise.all([
    readFile(V11_REPORT_PATH, 'utf8').then(JSON.parse),
    readFile(BASE_REPORT_PATH, 'utf8').then(JSON.parse)
  ]);
  if (!v11?.qualityGate?.pass) throw new Error('FLM Rating Engine v1.1 quality gate did not pass.');
  if (!base?.qualityGate?.pass) throw new Error('Base FLM Rating Engine quality gate did not pass.');
  return { v11, base };
}

function pointsRank(table = []) {
  const rows = [...table]
    .filter(row => row?.team)
    .sort((a, b) => (Number(b.points) || 0) - (Number(a.points) || 0) || String(a.team).localeCompare(String(b.team)));
  const n = rows.length;
  return new Map(rows.map((row, index) => [normaliseName(row.team), {
    team: row.team,
    points: Number(row.points) || 0,
    rank: index + 1,
    percentile: n > 1 ? (n - 1 - index) / (n - 1) : 0.5
  }]));
}

function seasonProgress(base) {
  const prior = base.seasons?.find(s => s.label === '2025/2026');
  const current = base.seasons?.find(s => s.label === '2026/2027');
  const denominator = Number(prior?.finishedFixtures) || Number(prior?.fixturesInSchedule) || 1;
  const numerator = Number(current?.finishedFixtures) || 0;
  return clamp(numerator / denominator, 0, 1);
}

function buildStrengthContext(v11, base) {
  const prior = pointsRank(v11.standings?.['2025/2026']?.table || []);
  const current = pointsRank(v11.standings?.['2026/2027']?.table || []);
  const progress = seasonProgress(base);
  const currentWeight = clamp(0.20 + 0.65 * progress, 0.20, 0.85);
  const priorWeight = 1 - currentWeight;
  return { prior, current, progress, currentWeight, priorWeight };
}

function playerContext(teamName, strength) {
  const key = normaliseName(teamName);
  const prior = strength.prior.get(key) || null;
  const current = strength.current.get(key) || null;
  let percentile = 0.5;
  if (prior && current) percentile = prior.percentile * strength.priorWeight + current.percentile * strength.currentWeight;
  else if (current) percentile = current.percentile;
  else if (prior) percentile = prior.percentile;
  return {
    team: teamName || null,
    priorPointsRank: prior?.rank ?? null,
    currentPointsRank: current?.rank ?? null,
    priorPoints: prior?.points ?? null,
    currentPoints: current?.points ?? null,
    strengthPercentile: round(percentile),
    currentSeasonEvidenceWeight: round(strength.currentWeight),
    clubBias: round((percentile - 0.5) * 1.2)
  };
}

function ratingCap(tier, confidence) {
  if (tier === 'proxy') {
    if (confidence < 0.40) return 13;
    if (confidence < 0.55) return 14;
    return 15;
  }
  if (tier === 'direct') {
    if (confidence < 0.45) return 14;
    if (confidence < 0.60) return 15;
    return 16;
  }
  return 20;
}

function globalise(relativeRating, tier, clubBias, confidence) {
  if (!Number.isFinite(Number(relativeRating))) return null;
  if (tier === 'tendency') return clamp(Math.round(Number(relativeRating)), 1, 20);
  const spread = tier === 'direct' ? SCALE.directSpread : SCALE.proxySpread;
  const contextWeight = tier === 'direct' ? SCALE.directContextWeight : SCALE.proxyContextWeight;
  const raw = SCALE.mean + (Number(relativeRating) - 10) * spread + Number(clubBias || 0) * contextWeight;
  const rating = clamp(Math.round(raw), SCALE.min, SCALE.max);
  return Math.min(rating, ratingCap(tier, Number(confidence) || 0));
}

function ageSpeed(age) {
  if (age == null) return 0;
  if (age <= 23) return 0.8;
  if (age <= 27) return 0.4;
  if (age <= 30) return 0;
  if (age <= 32) return -0.8;
  if (age <= 34) return -1.5;
  if (age <= 36) return -2.2;
  if (age <= 38) return -2.8;
  return -3.2;
}

function recalibrateFamilies(player, context) {
  const out = { technical: {}, mental: {}, goalkeeping: {} };
  for (const [family, rows] of Object.entries(player.calibratedRatings || {})) {
    out[family] ||= {};
    for (const [name, row] of Object.entries(rows || {})) {
      const tier = row.evidenceTier || 'proxy';
      out[family][name] = {
        ...row,
        rating: globalise(row.relativeRating, tier, context.clubBias, row.confidence)
      };
    }
  }
  return out;
}

function physicalBaselines(player, context, calibrated) {
  const group = player.positionGroup;
  const age = player.age;
  const height = Number(player.heightCm) || null;
  const weight = Number(player.weightKg) || null;
  const minutes = Number(player.actualMinutes) || 0;
  const heading = calibrated.technical?.heading?.rating ?? 10;
  const workRate = calibrated.mental?.workRate?.rating ?? 10;
  const completeness = [age, height, weight].filter(v => v != null).length / 3;
  const paceBase = { GK: 8, DEF: 10, MID: 11, ATT: 12 }[group] ?? 10;
  const accelerationBase = paceBase;
  const agilityBase = { GK: 9, DEF: 10, MID: 12, ATT: 12 }[group] ?? 10;
  const balanceBase = { GK: 10, DEF: 11, MID: 11, ATT: 11 }[group] ?? 10;
  const strengthBase = { GK: 11, DEF: 12, MID: 10, ATT: 11 }[group] ?? 10;
  const staminaBase = { GK: 9, DEF: 11, MID: 12, ATT: 11 }[group] ?? 10;
  const speedAge = ageSpeed(age);
  const heightAgility = height == null ? 0 : height <= 174 ? 1 : height >= 193 ? -1 : height >= 188 ? -0.5 : 0;
  const heightJump = height == null ? 0 : height >= 193 ? 2.4 : height >= 188 ? 1.4 : height >= 183 ? 0.6 : height <= 174 ? -1 : 0;
  const weightStrength = weight == null ? 0 : weight >= 88 ? 1.4 : weight >= 82 ? 0.8 : weight <= 66 ? -0.8 : 0;
  const minutesStamina = minutes >= 4500 ? 1.3 : minutes >= 3000 ? 0.7 : minutes < 1000 ? -0.8 : 0;
  const ageFitness = age == null ? 0 : age <= 27 ? 0.5 : age <= 31 ? 0 : age <= 34 ? -0.8 : -1.4;
  const club = context.clubBias * 0.35;
  const r = value => clamp(Math.round(value), 1, 20);
  const confidenceBase = clamp(0.28 + completeness * 0.16 + Math.min(1, minutes / 3600) * 0.10, 0, 0.56);
  return {
    acceleration: { rating: r(accelerationBase + speedAge + heightAgility * 0.2 + club), confidence: round(confidenceBase), source: 'position-age-body baseline; no speed telemetry' },
    agility: { rating: r(agilityBase + heightAgility + speedAge * 0.25 + club), confidence: round(confidenceBase), source: 'position-height-age baseline; no movement telemetry' },
    balance: { rating: r(balanceBase + weightStrength * 0.35 - (heightAgility < 0 ? 0.2 : 0) + club), confidence: round(confidenceBase * 0.85), source: 'position-body baseline' },
    jumping: { rating: r(10 + heightJump + (heading - 10) * 0.25 + club), confidence: round(clamp(confidenceBase + (height ? 0.08 : 0), 0, 0.64)), source: 'height plus aerial-performance proxy' },
    naturalFitness: { rating: r(10 + ageFitness + (minutes >= 3600 ? 0.5 : 0) + club * 0.3), confidence: round(confidenceBase * 0.72), source: 'age/availability prior; not a medical assessment' },
    pace: { rating: r(paceBase + speedAge + heightAgility * 0.25 + club), confidence: round(confidenceBase), source: 'position-age-body baseline; no speed telemetry' },
    stamina: { rating: r(staminaBase + minutesStamina + (workRate - 10) * 0.16 + club), confidence: round(clamp(confidenceBase + 0.08, 0, 0.66)), source: 'workload/minutes/work-rate proxy' },
    strength: { rating: r(strengthBase + weightStrength + heightJump * 0.25 + (heading - 10) * 0.12 + club), confidence: round(clamp(confidenceBase + (weight ? 0.07 : 0), 0, 0.64)), source: 'body profile plus aerial-performance proxy' }
  };
}

function mentalBaselines(player, context, calibrated) {
  const age = player.age;
  const minutes = Number(player.actualMinutes) || 0;
  const read = (...paths) => paths.map(([family, name]) => calibrated[family]?.[name]?.rating).filter(Number.isFinite);
  const flairInputs = read(['technical', 'dribbling'], ['technical', 'technique'], ['mental', 'vision']);
  const teamworkInputs = read(['mental', 'workRate'], ['technical', 'passing'], ['mental', 'decisions']);
  const leadership = 10 + (age != null && age >= 32 ? 2 : age != null && age >= 28 ? 1 : 0) + (minutes >= 4500 ? 1 : 0) + context.clubBias * 0.2;
  return {
    determination: { rating: 10, confidence: 0.15, source: 'neutral prior only; not inferable reliably from match-event data' },
    flair: { rating: clamp(Math.round(flairInputs.length >= 2 ? avg(flairInputs) : 10 + context.clubBias * 0.2), 1, 20), confidence: flairInputs.length >= 2 ? 0.44 : 0.20, source: flairInputs.length >= 2 ? 'dribbling/technique/vision proxy' : 'neutral prior' },
    leadership: { rating: clamp(Math.round(leadership), 1, 20), confidence: age != null ? 0.30 : 0.22, source: 'age/seniority/minutes prior; captaincy history not yet modelled' },
    teamwork: { rating: clamp(Math.round(teamworkInputs.length >= 2 ? avg(teamworkInputs) : 10 + context.clubBias * 0.15), 1, 20), confidence: teamworkInputs.length >= 2 ? 0.42 : 0.20, source: teamworkInputs.length >= 2 ? 'work-rate/passing/decision proxy' : 'neutral prior' }
  };
}

function recalibratePlayer(player, strength) {
  const context = playerContext(player.team, strength);
  const calibratedRatings = recalibrateFamilies(player, context);
  return {
    ...player,
    clubContext: context,
    calibratedRatings,
    physicalBaselines: physicalBaselines(player, context, calibratedRatings),
    mentalBaselines: mentalBaselines(player, context, calibratedRatings)
  };
}

function allRatingRows(player) {
  const rows = [];
  for (const [family, attrs] of Object.entries(player.calibratedRatings || {})) {
    for (const [name, row] of Object.entries(attrs || {})) rows.push({ family, name, ...row });
  }
  return rows;
}

function audit(players) {
  const failures = [];
  const warnings = [];
  for (const player of players) {
    for (const row of allRatingRows(player)) {
      if (!Number.isFinite(row.rating) || row.rating < 1 || row.rating > 20) failures.push(`${player.name}: ${row.family}.${row.name} outside 1-20`);
      if (row.evidenceTier === 'proxy' && row.rating > ratingCap('proxy', row.confidence || 0)) failures.push(`${player.name}: low-confidence proxy escaped confidence cap`);
      if (row.evidenceTier === 'direct' && row.rating > ratingCap('direct', row.confidence || 0)) failures.push(`${player.name}: low-confidence direct rating escaped confidence cap`);
      if (row.evidenceTier === 'proxy' && row.confidence < 0.40 && row.rating >= 13) warnings.push(`${player.name}: ${row.family}.${row.name} is low-confidence proxy at ${row.rating}`);
    }
    if (player.positionGroup === 'GK' && (player.calibratedRatings?.technical?.firstTouch || player.calibratedRatings?.technical?.technique)) failures.push(`${player.name}: goalkeeper weak First Touch/Technique proxy returned`);
    if (player.mentalBaselines?.determination?.rating !== 10 || player.mentalBaselines?.determination?.confidence > 0.15) failures.push(`${player.name}: Determination neutral-prior policy broken`);
    if (Object.values(player.physicalBaselines || {}).some(row => row.confidence > 0.66)) failures.push(`${player.name}: physical baseline confidence exceeds evidence ceiling`);
    if (player.age >= 35 && player.positionGroup !== 'GK') {
      if ((player.physicalBaselines?.pace?.rating || 0) > 9 || (player.physicalBaselines?.acceleration?.rating || 0) > 9) failures.push(`${player.name}: veteran outfield speed baseline too high`);
    }
    if (player.age >= 34 && player.positionGroup === 'GK') {
      if ((player.physicalBaselines?.pace?.rating || 0) > 7 || (player.physicalBaselines?.acceleration?.rating || 0) > 7) failures.push(`${player.name}: veteran goalkeeper speed baseline too high`);
    }
  }
  const proxyRows = players.flatMap(allRatingRows).filter(row => row.evidenceTier === 'proxy');
  const directRows = players.flatMap(allRatingRows).filter(row => row.evidenceTier === 'direct');
  if (Math.max(...proxyRows.map(r => r.rating), 0) > 15) failures.push('Proxy rating distribution exceeds 15');
  if (Math.max(...directRows.map(r => r.rating), 0) > 16) failures.push('Direct rating distribution exceeds global 16 ceiling');
  return { pass: failures.length === 0, failures, warnings };
}

function distribution(players, tier) {
  const values = players.flatMap(allRatingRows).filter(row => row.evidenceTier === tier).map(row => row.rating).filter(Number.isFinite);
  return { count: values.length, mean: round(avg(values), 2), min: values.length ? Math.min(...values) : null, max: values.length ? Math.max(...values) : null };
}

function physicalDistribution(players) {
  const values = players.flatMap(p => Object.values(p.physicalBaselines || {}).map(row => row.rating).filter(Number.isFinite));
  return { count: values.length, mean: round(avg(values), 2), min: values.length ? Math.min(...values) : null, max: values.length ? Math.max(...values) : null };
}

function spotlight(players) {
  const byName = new Map(players.map(player => [normaliseName(player.name), player]));
  const selected = REVIEW_NAMES.map(name => byName.get(normaliseName(name))).filter(Boolean);
  return selected.map(player => {
    const rows = allRatingRows(player).filter(row => row.evidenceTier !== 'tendency').sort((a, b) => b.rating - a.rating || b.confidence - a.confidence);
    return {
      name: player.name,
      team: player.team,
      positionGroup: player.positionGroup,
      age: player.age,
      strongestEvidenceRatings: rows.slice(0, 6).map(row => ({ attribute: `${row.family}.${row.name}`, rating: row.rating, tier: row.evidenceTier, confidence: row.confidence })),
      physical: Object.fromEntries(Object.entries(player.physicalBaselines || {}).map(([name, row]) => [name, row.rating])),
      context: player.clubContext
    };
  });
}

async function main() {
  const { v11, base } = await runV11();
  const strength = buildStrengthContext(v11, base);
  const before = v11.players || [];
  const players = before.map(player => recalibratePlayer(player, strength));
  const review = audit(players);
  const changedStatRatings = players.reduce((sum, player, index) => {
    const prior = before[index];
    let changed = 0;
    for (const [family, attrs] of Object.entries(player.calibratedRatings || {})) {
      for (const [name, row] of Object.entries(attrs || {})) if (prior.calibratedRatings?.[family]?.[name]?.rating !== row.rating) changed += 1;
    }
    return sum + changed;
  }, 0);
  const freezeCandidate = review.pass && v11.qualityGate?.pass && base.qualityGate?.pass && players.length >= 40;
  const report = {
    engine: 'FLM Player Sanity Review',
    engineVersion: '1.1.1',
    generatedAt: new Date().toISOString(),
    basedOn: { v11QualityGatePass: !!v11.qualityGate?.pass, baseQualityGatePass: !!base.qualityGate?.pass, calibrationPlayers: players.length },
    formulaChanges: {
      globalScaling: SCALE,
      teamStrength: {
        method: 'rank clubs by points across the whole league, then blend prior and current season strength',
        currentSeasonProgress: round(strength.progress),
        priorSeasonWeight: round(strength.priorWeight),
        currentSeasonWeight: round(strength.currentWeight),
        reason: 'split-stage position numbers and very early current tables are too unstable to use directly'
      },
      confidenceCaps: {
        proxy: { below040: 13, below055: 14, otherwise: 15 },
        direct: { below045: 14, below060: 15, otherwise: 16 }
      },
      veteranSpeedCurve: 'steeper age decline after 32; no player-specific exceptions',
      manualPlayerOverrides: false
    },
    distributions: { direct: distribution(players, 'direct'), proxy: distribution(players, 'proxy'), tendency: distribution(players, 'tendency'), physicalBaselines: physicalDistribution(players) },
    changedStatRatings,
    audit: review,
    spotlight: spotlight(players),
    players,
    freezeDecision: {
      freezeCandidate,
      target: 'FLM Rating Engine v1.1 compatibility line',
      frozenVersionIfApproved: '1.1.1',
      reason: freezeCandidate ? 'Automated football-sanity constraints passed without player-specific rating edits.' : 'One or more sanity constraints failed; do not freeze.'
    },
    caveats: [
      'This remains a calibration model, not ground-truth scouting data.',
      'Pace/acceleration remain low-confidence baselines until speed telemetry or curated scouting evidence is available.',
      'Personality attributes remain governed by the separate FLM personality engine and are not reverse-engineered from results.',
      'The Scottish competition scale is a game-design prior and must be recalibrated when cross-league English data becomes available.'
    ],
    publicationPolicy: { apiTokenPersisted: false, rawSportmonksPayloadsCommitted: false, rawSportmonksPayloadsUploaded: false, artifactContains: 'sanitised derived player calibration and audit data only' }
  };
  await mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  console.log(`Sanity review players: ${players.length}; changed stat ratings: ${changedStatRatings}.`);
  console.log(`Direct ${JSON.stringify(report.distributions.direct)}; proxy ${JSON.stringify(report.distributions.proxy)}.`);
  console.log(`Sanity gate: ${review.pass ? 'PASS' : 'FAIL'}; freeze candidate: ${freezeCandidate ? 'YES' : 'NO'}.`);
  if (!freezeCandidate) process.exitCode = 2;
}

main().catch(async error => {
  console.error(error.stack || error.message || error);
  await mkdir(path.dirname(REPORT_PATH), { recursive: true });
  await writeFile(REPORT_PATH, `${JSON.stringify({ engine: 'FLM Player Sanity Review', engineVersion: '1.1.1', generatedAt: new Date().toISOString(), fatalError: { message: error.message }, freezeDecision: { freezeCandidate: false } }, null, 2)}\n`, 'utf8');
  process.exit(1);
});
