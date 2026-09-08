import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createCareer } from '../manager-core.js';
import { ensurePreseason } from '../preseason-v047.js';
import {
  ensureTransferState,
  getTransferWindowStatus,
  startTransferSeason
} from '../transfers-v050.js';

const [metadata, clubs, players] = await Promise.all([
  readFile(new URL('../data/current/metadata.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../data/current/clubs.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../data/current/players.json', import.meta.url), 'utf8').then(JSON.parse)
]);

function fixture() {
  const playableIds = new Set(metadata.playableDemo?.clubIds || []);
  const db = { metadata, clubs: structuredClone(clubs), players: structuredClone(players) };
  const leagueClubs = db.clubs.filter(club => playableIds.has(club.id) && !club.isPlaceholder);
  const userClub = leagueClubs.find(club => club.name === 'Arsenal') || leagueClubs[0];
  const career = createCareer({
    clubId: userClub.id,
    clubs: leagueClubs,
    players: db.players,
    seed: 'transfer-season-reset',
    managerName: 'Window Reset Test'
  });
  career.news = { schemaVersion: 1, items: [], generatedRounds: [] };
  ensurePreseason(career, db);
  ensureTransferState(career, db);
  return { career, db };
}

test('a new season archives last summer business and opens a clean operational transfer window', () => {
  const { career, db } = fixture();
  career.transfers.activeWindowSeason = '2026/27';
  career.transfers.completed.push({
    id: 'deal-2026',
    playerId: 'historic-player',
    fromClubId: 'club-a',
    toClubId: career.clubId,
    fee: 20000000,
    source: 'user-purchase',
    season: '2026/27'
  });
  career.transfers.rumours.push({ id: 'rumour-2026' });
  career.transfers.incomingOffers.push({ id: 'offer-2026', status: 'pending' });
  career.transfers.negotiations.old = { status: 'countered' };
  career.transfers.processedWorldPhases.push('D:2026-08-01');
  career.transfers.windowClosedNotified = true;
  career.transfers.transferBudget = 1000000;
  career.transfers.wageRoom = 5000;
  const initialBudget = career.transfers.initialTransferBudget;
  const initialWageRoom = career.transfers.initialWageRoom;

  career.season = '2027/28';
  career.previousSeasonEndDate = '2027-05-30';
  career.seasonStartDate = '2027-08-20';
  career.currentDate = '2027-06-15';
  career.calendar = { currentDate: '2027-06-15', fixturesReleased: false };
  career.worldClock = { schemaVersion: 2, season: '2027/28', acknowledgedMilestones: [], history: [], totalDaysAdvanced: 0 };

  assert.equal(startTransferSeason(career, db), true);
  assert.equal(career.transfers.activeWindowSeason, '2027/28');
  assert.equal(career.transfers.completed.length, 0);
  assert.equal(career.transfers.rumours.length, 0);
  assert.equal(career.transfers.incomingOffers.length, 0);
  assert.deepEqual(career.transfers.negotiations, {});
  assert.deepEqual(career.transfers.processedWorldPhases, []);
  assert.equal(career.transfers.windowClosedNotified, false);
  assert.equal(career.transfers.transferBudget, initialBudget);
  assert.equal(career.transfers.wageRoom, initialWageRoom);
  assert.ok(career.transfers.history.some(item => item.id === 'deal-2026' && item.season === '2026/27'));

  const status = getTransferWindowStatus(career);
  assert.equal(status.open, true);
  assert.equal(status.opens, '2027-06-15');
  assert.equal(status.closes, '2027-09-01');
});

test('starting the same transfer season twice is idempotent and does not duplicate history', () => {
  const { career, db } = fixture();
  career.transfers.activeWindowSeason = '2026/27';
  career.transfers.completed.push({ id: 'one-old-deal', playerId: 'p1', fee: 1000000, season: '2026/27' });
  career.season = '2027/28';
  career.currentDate = '2027-06-15';
  career.calendar = { currentDate: '2027-06-15' };
  career.worldClock = { schemaVersion: 2, season: '2027/28' };

  assert.equal(startTransferSeason(career, db), true);
  const snapshot = structuredClone(career.transfers);
  assert.equal(startTransferSeason(career, db), false);
  assert.deepEqual(career.transfers, snapshot);
  assert.equal(career.transfers.history.filter(item => item.id === 'one-old-deal').length, 1);
});
