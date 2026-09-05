import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createCareer } from '../manager-core.js';
import { ensurePreseason } from '../preseason-v047.js';
import { toggleTransferListed } from '../transfers-v050.js';
import {
  acceptIncomingOffer,
  ensureTransferWorld,
  getIncomingOffers,
  getTransferWorldSnapshot,
  isTransferWindowOpen,
  processTransferWorld
} from '../transfers-world-v052.js';

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
  return { career, db };
}

test('V0.5.2 initializes a living AI transfer market with persistent club budgets and activity', () => {
  const { career, db } = fixture();
  assert.equal(ensureTransferWorld(career, db), true);
  const result = processTransferWorld(career, db);
  const snapshot = getTransferWorldSnapshot(career);
  assert.equal(result.checkpoint, 'ps-0');
  assert.equal(snapshot.windowStatus, 'open');
  assert.equal(Object.keys(snapshot.clubBudgets).length, clubs.filter(club => !club.isPlaceholder).length);
  assert.ok(snapshot.aiTransactions.length >= 1, 'expected at least one deterministic AI transfer at market initialization');
  assert.ok(snapshot.rumours.length >= 1, 'expected at least one transfer rumour');
  const completed = snapshot.aiTransactions[0];
  assert.equal(career.transfers.ownership[completed.playerId], completed.toClubId);
  assert.ok(career.news.items.some(item => item.category === 'Transfers'));
});

test('transfer-listed players attract bids that can be accepted into the career budget', () => {
  const { career, db } = fixture();
  ensureTransferWorld(career, db);
  const squad = db.players
    .filter(player => player.clubId === career.clubId && !player.isPlaceholder)
    .sort((a, b) => (a.currentAbility || 0) - (b.currentAbility || 0));
  const listed = squad.find(player => player.positionGroup !== 'GK') || squad[0];
  assert.ok(listed);
  toggleTransferListed(career, db, listed.id);
  processTransferWorld(career, db);
  const pending = getIncomingOffers(career, { includeResolved: false });
  assert.ok(pending.length >= 1, 'expected a pending offer for a transfer-listed player');
  const offer = pending.find(item => item.playerId === listed.id) || pending[0];
  const before = career.transfers.transferBudget;
  const transaction = acceptIncomingOffer(career, db, offer.id);
  assert.equal(transaction.userSale, true);
  assert.equal(career.transfers.ownership[transaction.playerId], transaction.toClubId);
  assert.ok(career.transfers.transferBudget > before);
  assert.equal(getIncomingOffers(career).find(item => item.id === offer.id).status, 'accepted');
  assert.equal(career.lineupIds.length, 11);
});

test('deadline day closes the summer window and resolves the final AI market push', () => {
  const { career, db } = fixture();
  ensureTransferWorld(career, db);
  processTransferWorld(career, db);
  career.preseason.phase = 'complete';
  career.roundIndex = 2;
  const result = processTransferWorld(career, db);
  const snapshot = getTransferWorldSnapshot(career);
  assert.equal(result.checkpoint, 'mw-2');
  assert.equal(isTransferWindowOpen(career), false);
  assert.equal(snapshot.windowStatus, 'closed');
  assert.equal(snapshot.deadlineDay.triggered, true);
  assert.ok(snapshot.deadlineDay.deals >= 0);
  assert.ok(career.news.items.some(item => item.source === 'Deadline Day' && /window closed/i.test(item.title)));
});
