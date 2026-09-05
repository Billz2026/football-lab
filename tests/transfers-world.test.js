import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createCareer } from '../manager-core.js';
import { ensurePreseason } from '../preseason-v047.js';
import {
  TRANSFER_SCHEMA_VERSION,
  ensureTransferState,
  getIncomingOffers,
  getTransferWindowStatus,
  processTransferWorld,
  respondToIncomingOffer,
  toggleTransferListed
} from '../transfers-v050.js';

const [metadata, clubs, players] = await Promise.all([
  readFile(new URL('../data/current/metadata.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../data/current/clubs.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../data/current/players.json', import.meta.url), 'utf8').then(JSON.parse)
]);

function fixture() {
  const playableIds = new Set(metadata.playableDemo?.clubIds || []);
  const playable = clubs.filter(club => playableIds.has(club.id) && !club.isPlaceholder);
  const userClub = playable.find(club => club.name === 'Arsenal') || playable[0];
  const db = {
    metadata,
    clubs: structuredClone(clubs),
    players: structuredClone(players)
  };
  const career = createCareer({
    clubId: userClub.id,
    clubs: db.clubs.filter(club => playableIds.has(club.id) && !club.isPlaceholder),
    players: db.players,
    seed: 'transfer-world-regression',
    managerName: 'Transfer Test'
  });
  ensurePreseason(career, db);
  return { career, db, playable };
}

test('V0.5.2 initializes one persistent transfer world with AI budgets, rumours and completed AI deals', () => {
  const { career, db, playable } = fixture();
  assert.equal(ensureTransferState(career, db), true);
  const result = processTransferWorld(career, db);
  assert.equal(result.phaseKey, 'P0');
  assert.equal(result.window.open, true);
  assert.equal(Object.keys(career.transfers.aiClubs).length, playable.length - 1);
  const aiDeals = career.transfers.completed.filter(item => item.source === 'ai');
  assert.ok(aiDeals.length >= 1, 'expected at least one deterministic AI transfer at market initialization');
  assert.ok(career.transfers.rumours.length >= 1, 'expected at least one transfer rumour');
  const completed = aiDeals[0];
  assert.equal(career.transfers.ownership[completed.playerId], completed.toClubId);
  assert.ok(career.news.items.some(item => item.category === 'Transfers'));
});

test('transfer-listed players attract bids that can be accepted without silently auto-picking a replacement', () => {
  const { career, db } = fixture();
  ensureTransferState(career, db);
  const squad = db.players
    .filter(player => player.clubId === career.clubId && !player.isPlaceholder)
    .sort((a, b) => (a.currentAbility || 0) - (b.currentAbility || 0));
  const listed = squad.find(player => player.positionGroup !== 'GK') || squad[0];
  assert.ok(listed);
  toggleTransferListed(career, db, listed.id);
  processTransferWorld(career, db);
  const pending = getIncomingOffers(career, { includeResolved: false });
  assert.ok(pending.length >= 1, 'expected a pending offer after listing a player');
  const offer = pending.find(item => item.playerId === listed.id) || pending[0];
  const before = career.transfers.transferBudget;
  const wasSelected = career.lineupIds.includes(offer.playerId);
  const result = respondToIncomingOffer(career, db, offer.id, 'accept');
  assert.equal(result.status, 'completed');
  assert.equal(career.transfers.ownership[result.transaction.playerId], result.transaction.toClubId);
  assert.ok(career.transfers.transferBudget > before);
  assert.equal(getIncomingOffers(career).find(item => item.id === offer.id).status, 'completed');
  assert.equal(career.lineupIds.includes(offer.playerId), false);
  assert.equal(career.lineupIds.length, wasSelected ? 10 : 11);
});

test('counter-offers are constrained by the buying club maximum and can complete a sale', () => {
  const { career, db } = fixture();
  ensureTransferState(career, db);
  const listed = db.players.find(player => player.clubId === career.clubId && !player.isPlaceholder && player.positionGroup !== 'GK');
  toggleTransferListed(career, db, listed.id);
  processTransferWorld(career, db);
  const offer = getIncomingOffers(career, { includeResolved: false })[0];
  assert.ok(offer);
  const result = respondToIncomingOffer(career, db, offer.id, 'counter', offer.maxFee);
  assert.equal(result.status, 'completed');
  assert.equal(result.offer.counterAccepted, true);
  assert.equal(result.transaction.fee, offer.maxFee);
});

test('the real 2026 summer deadline closes the market once the career calendar passes 1 September', () => {
  const { career, db } = fixture();
  ensureTransferState(career, db);
  processTransferWorld(career, db);
  career.preseason.phase = 'complete';
  const closedIndex = career.fixtures.findIndex(round => round.some(fixture => fixture.date > '2026-09-01'));
  assert.ok(closedIndex >= 0, 'expected a league matchweek after the transfer deadline');
  career.roundIndex = closedIndex;
  const status = getTransferWindowStatus(career);
  assert.equal(status.open, false);
  assert.equal(status.closes, '2026-09-01');
  processTransferWorld(career, db);
  assert.equal(career.transfers.windowClosedNotified, true);
  assert.ok(career.news.items.some(item => /window closed/i.test(item.title)));
});

test('V0.5 transfer saves migrate to schema 2 without losing completed business', () => {
  const { career, db } = fixture();
  ensureTransferState(career, db);
  career.transfers.schemaVersion = 1;
  career.transfers.completed.push({ id: 'legacy-deal', playerId: 'legacy', fee: 1000000 });
  delete career.transfers.aiClubs;
  delete career.transfers.incomingOffers;
  const changed = ensureTransferState(career, db);
  assert.equal(changed, true);
  assert.equal(career.transfers.schemaVersion, TRANSFER_SCHEMA_VERSION);
  assert.ok(career.transfers.completed.some(item => item.id === 'legacy-deal'));
  assert.ok(career.transfers.aiClubs && typeof career.transfers.aiClubs === 'object');
  assert.ok(Array.isArray(career.transfers.incomingOffers));
});
