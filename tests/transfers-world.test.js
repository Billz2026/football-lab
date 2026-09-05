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
  career.currentDate = '2026-06-15';
  career.calendar ||= {};
  career.calendar.currentDate = '2026-06-15';
  career.worldClock ||= { schemaVersion: 1, totalDaysAdvanced: 0, history: [], acknowledgedMilestones: [] };
  return { career, db, playable };
}

function setDate(career, value) {
  career.currentDate = value;
  career.calendar.currentDate = value;
}

function advanceMarketDays(career, db, days = 30, stop = () => false) {
  const start = Date.parse(`${career.currentDate}T00:00:00Z`);
  const results = [];
  for (let offset = 0; offset < days; offset += 1) {
    const date = new Date(start + offset * 86400000).toISOString().slice(0, 10);
    setDate(career, date);
    results.push(processTransferWorld(career, db));
    if (stop()) break;
  }
  return results;
}

test('V0.6.1 keeps one persistent date-driven transfer world with restrained AI business', () => {
  const { career, db, playable } = fixture();
  assert.equal(ensureTransferState(career, db), true);
  const results = advanceMarketDays(career, db, 35, () => career.transfers.completed.some(item => item.source === 'ai') && career.transfers.rumours.length > 0);
  assert.ok(results.every(result => /^D:\d{4}-\d{2}-\d{2}$/.test(result.phaseKey)));
  assert.equal(Object.keys(career.transfers.aiClubs).length, playable.length - 1);
  const aiDeals = career.transfers.completed.filter(item => item.source === 'ai');
  assert.ok(aiDeals.length >= 1, 'expected intelligent AI business across several transfer-window days');
  assert.ok(aiDeals.length < 20, 'the market should not manufacture a transfer every day');
  assert.ok(career.transfers.rumours.length >= 1, 'expected transfer rumours across an active market period');
  const completed = aiDeals[0];
  assert.equal(career.transfers.ownership[completed.playerId], completed.toClubId);
  assert.equal(completed.marketVersion, 61);
  assert.ok(career.news.items.some(item => item.category === 'Transfers'));
});

test('transfer-listed players attract interest over time and accepted bids do not silently auto-pick a replacement', () => {
  const { career, db } = fixture();
  ensureTransferState(career, db);
  const squad = db.players
    .filter(player => player.clubId === career.clubId && !player.isPlaceholder)
    .sort((a, b) => (a.currentAbility || 0) - (b.currentAbility || 0));
  const listed = squad.find(player => player.positionGroup !== 'GK') || squad[0];
  assert.ok(listed);
  toggleTransferListed(career, db, listed.id);
  advanceMarketDays(career, db, 30, () => getIncomingOffers(career, { includeResolved: false }).some(item => item.playerId === listed.id));
  const pending = getIncomingOffers(career, { includeResolved: false });
  const offer = pending.find(item => item.playerId === listed.id) || pending[0];
  assert.ok(offer, 'expected a listed player to attract a bid during the transfer window, not necessarily instantly');
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

test('incoming counter-offers respect the buying club maximum and can complete a sale', () => {
  const { career, db } = fixture();
  ensureTransferState(career, db);
  const listed = db.players.find(player => player.clubId === career.clubId && !player.isPlaceholder && player.positionGroup !== 'GK');
  toggleTransferListed(career, db, listed.id);
  advanceMarketDays(career, db, 30, () => getIncomingOffers(career, { includeResolved: false }).length > 0);
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
  setDate(career, '2026-09-02');
  career.preseason.phase = 'complete';
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
