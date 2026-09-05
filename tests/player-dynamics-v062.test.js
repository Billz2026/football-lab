import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createCareer } from '../manager-core.js';
import { ensurePreseason } from '../preseason-v047.js';
import { ensureTransferState } from '../transfers-v050-legacy.js';
import {
  getTransferStance,
  submitContractOffer,
  submitTransferOffer
} from '../transfers-v050.js';
import {
  ensurePlayerDynamics,
  getMoveWillingness,
  getPlayerDynamics,
  getRenewalDemand,
  processPlayerDynamics,
  setSquadRole,
  submitRenewalOffer
} from '../player-dynamics-v062.js';

const [metadata, clubs, players] = await Promise.all([
  readFile(new URL('../data/current/metadata.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../data/current/clubs.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../data/current/players.json', import.meta.url), 'utf8').then(JSON.parse)
]);

function fixture(seed = 'v062-dynamics') {
  const playableIds = new Set(metadata.playableDemo?.clubIds || []);
  const playableClubs = clubs.filter(club => playableIds.has(club.id) && !club.isPlaceholder);
  const userClub = playableClubs.find(club => club.name === 'Arsenal') || playableClubs[0];
  const db = { metadata, clubs: structuredClone(clubs), players: structuredClone(players) };
  const career = createCareer({ clubId: userClub.id, clubs: playableClubs, players: db.players, seed, managerName: 'Dynamics Test' });
  ensurePreseason(career, db);
  ensureTransferState(career, db);
  career.calendar ||= {};
  career.calendar.currentDate ||= career.currentDate || '2026-06-05';
  return { career, db, userClub, playableClubs };
}

function openWindow(career) {
  career.currentDate = '2026-06-15';
  career.calendar ||= {};
  career.calendar.currentDate = '2026-06-15';
  career.worldClock ||= { schemaVersion: 1, totalDaysAdvanced: 0, history: [], acknowledgedMilestones: [] };
}

test('player dynamics initialise deterministically with realistic squad roles and agents', () => {
  const first = fixture('same-seed');
  const second = fixture('same-seed');
  ensurePlayerDynamics(first.career, first.db);
  ensurePlayerDynamics(second.career, second.db);

  const own = first.db.players.filter(player => player.clubId === first.userClub.id && !player.isPlaceholder);
  assert.ok(own.length >= 20, 'expected a full first-team squad');
  const roles = own.map(player => getPlayerDynamics(first.career, first.db, player.id).squadRole);
  assert.ok(roles.includes('Star'), 'a real squad should identify cornerstone stars');
  assert.ok(roles.includes('Important'), 'a real squad should identify important starters');
  assert.ok(roles.includes('Rotation') || roles.includes('Prospect'), 'a real squad should have depth roles');

  const sample = own[0];
  const a = getPlayerDynamics(first.career, first.db, sample.id);
  const b = getPlayerDynamics(second.career, second.db, sample.id);
  assert.deepEqual(a.agent, b.agent, 'agent generation must be deterministic for a career seed');
  assert.equal(a.ambition, b.ambition);
  assert.equal(a.loyalty, b.loyalty);
});

test('broken playing-time promises reduce happiness and can create a transfer request', () => {
  const { career, db, userClub } = fixture('playing-time');
  ensurePlayerDynamics(career, db);
  const own = db.players
    .filter(player => player.clubId === userClub.id && !player.isPlaceholder && player.positionGroup !== 'GK')
    .sort((a, b) => (b.currentAbility || 0) - (a.currentAbility || 0));
  const player = own[0];
  const dynamics = getPlayerDynamics(career, db, player.id);
  setSquadRole(career, db, player.id, 'Star');
  dynamics.happiness = 42;
  dynamics.patience = 30;
  dynamics.ambition = 92;
  dynamics.loyalty = 30;
  career.playerStatus[player.id].appearances = 0;

  for (const [round, date] of [[3, '2026-09-04'], [6, '2026-09-25']]) {
    career.roundIndex = round;
    career.currentDate = date;
    career.calendar.currentDate = date;
    processPlayerDynamics(career, db);
  }

  assert.ok(dynamics.happiness <= 20, `expected sharp happiness fall, got ${dynamics.happiness}`);
  assert.equal(dynamics.transferRequest?.active, true, 'an ambitious unhappy star should eventually ask to leave');
  assert.match(dynamics.transferRequest.reason, /first-team football|challenge/i);
});

test('player willingness reflects club stature, happiness and an active transfer request', () => {
  const { career, db, userClub, playableClubs } = fixture('willingness');
  ensurePlayerDynamics(career, db);
  const sellerClub = playableClubs
    .filter(club => club.id !== userClub.id)
    .sort((a, b) => (b.reputation || 0) - (a.reputation || 0))[0];
  const target = db.players
    .filter(player => player.clubId === sellerClub.id && !player.isPlaceholder)
    .sort((a, b) => (b.currentAbility || 0) - (a.currentAbility || 0))[0];
  assert.ok(target);

  const settled = getPlayerDynamics(career, db, target.id);
  settled.happiness = 88;
  settled.loyalty = 92;
  settled.transferRequest = null;
  const before = getMoveWillingness(career, db, target.id, userClub.id);

  settled.happiness = 18;
  settled.loyalty = 25;
  settled.transferRequest = { active: true, requestedDate: career.currentDate, reason: 'Wants a new challenge' };
  const after = getMoveWillingness(career, db, target.id, userClub.id);
  assert.ok(after.score >= before.score + 20, `transfer request should materially improve willingness (${before.score} -> ${after.score})`);
});

test('an active transfer request materially softens the selling club stance', () => {
  const { career, db, userClub, playableClubs } = fixture('requested-sale');
  ensurePlayerDynamics(career, db);
  const sellerClub = playableClubs
    .filter(club => club.id !== userClub.id)
    .sort((a, b) => (b.reputation || 0) - (a.reputation || 0))[0];
  const target = db.players
    .filter(player => player.clubId === sellerClub.id && !player.isPlaceholder)
    .sort((a, b) => (b.currentAbility || 0) - (a.currentAbility || 0))[0];
  const dynamics = getPlayerDynamics(career, db, target.id);
  dynamics.happiness = 86;
  dynamics.transferRequest = null;
  const settled = getTransferStance(target, db, career, userClub.id);

  dynamics.happiness = 18;
  dynamics.transferRequest = { active: true, requestedDate: career.currentDate, reason: 'Wants a new challenge' };
  const requested = getTransferStance(target, db, career, userClub.id);
  assert.ok(requested.minimumAcceptable <= settled.minimumAcceptable * .85, `request should lower minimum fee (${settled.minimumAcceptable} -> ${requested.minimumAcceptable})`);
  assert.match(requested.label, /transfer requested/i);
});

test('a settled star can refuse personal terms even after the clubs agree a fee', () => {
  const { career, db, userClub, playableClubs } = fixture('player-refusal');
  openWindow(career);
  ensurePlayerDynamics(career, db);
  const sellerClub = playableClubs
    .filter(club => club.id !== userClub.id)
    .sort((a, b) => (b.reputation || 0) - (a.reputation || 0))[0];
  const target = db.players
    .filter(player => player.clubId === sellerClub.id && !player.isPlaceholder)
    .sort((a, b) => (b.currentAbility || 0) - (a.currentAbility || 0))[0];
  const dynamics = getPlayerDynamics(career, db, target.id);
  dynamics.squadRole = 'Star';
  dynamics.happiness = 100;
  dynamics.loyalty = 100;
  dynamics.ambition = 95;
  dynamics.transferRequest = null;
  const interest = getMoveWillingness(career, db, target.id, userClub.id);
  assert.ok(interest.score < 25, `test needs a genuine refusal state, got ${interest.score}`);

  career.transfers.transferBudget = 1_000_000_000;
  career.transfers.wageRoom = 2_000_000;
  const stance = getTransferStance(target, db, career, userClub.id);
  const feeResult = submitTransferOffer(career, db, target.id, stance.minimumAcceptable);
  assert.equal(feeResult.status, 'accepted');
  const contractResult = submitContractOffer(career, db, target.id, 1_000_000, 4);
  assert.equal(contractResult.status, 'player-refused');
  assert.match(contractResult.negotiation.messages.at(-1), /not interested/i);
});

test('renewal demands use squad role, agent and current wage; accepted deals persist', () => {
  const { career, db, userClub } = fixture('renewal');
  ensurePlayerDynamics(career, db);
  const player = db.players
    .filter(item => item.clubId === userClub.id && !item.isPlaceholder)
    .sort((a, b) => (b.currentAbility || 0) - (a.currentAbility || 0))[4];
  const dynamics = getPlayerDynamics(career, db, player.id);
  setSquadRole(career, db, player.id, 'Important');
  dynamics.happiness = 72;

  const demand = getRenewalDemand(career, db, player.id);
  assert.ok(demand.weeklyWage > 0);
  assert.ok(demand.currentWage > 0);
  assert.ok(demand.agent?.name);

  career.transfers.wageRoom = Math.max(career.transfers.wageRoom, demand.weeklyWage * 2);
  const result = submitRenewalOffer(career, db, player.id, demand.weeklyWage, 4);
  assert.equal(result.status, 'accepted');
  assert.equal(career.transfers.contracts[player.id].weeklyWage, demand.weeklyWage);
  assert.equal(career.transfers.contracts[player.id].expiryYear, 2030);
});
