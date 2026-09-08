import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createCareer } from '../manager-core.js';
import { ensurePreseason } from '../preseason-v047.js';
import { ensureTransferState } from '../transfers-v050.js';
import {
  migrateRolloverCalendar,
  needsRolloverCalendarMigration
} from '../season-rollover-calendar-migration-v1.js';

const [metadata, clubs, players] = await Promise.all([
  readFile(new URL('../data/current/metadata.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../data/current/clubs.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../data/current/players.json', import.meta.url), 'utf8').then(JSON.parse)
]);

function legacyRolledCareer() {
  const playableIds = new Set(metadata.playableDemo?.clubIds || []);
  const db = { metadata, clubs: structuredClone(clubs), players: structuredClone(players) };
  const leagueClubs = db.clubs.filter(club => playableIds.has(club.id) && !club.isPlaceholder);
  const career = createCareer({
    clubId: leagueClubs[0].id,
    clubs: leagueClubs,
    players: db.players,
    seed: 'legacy-rollover-calendar',
    managerName: 'Migration Test'
  });
  ensurePreseason(career, db);
  ensureTransferState(career, db);

  career.season = '2027/28';
  career.status = 'active';
  career.roundIndex = 0;
  career.seasonStartDate = '2027-08-20';
  career.seasonEndDate = '2028-05-28';
  career.fixtures.flat().forEach(fixture => {
    fixture.played = false;
    if (fixture.date) fixture.date = fixture.date.replace(/^2026/, '2027').replace(/^2027-0[1-5]/, match => match.replace(/^2027/, '2028'));
  });
  career.currentDate = '2027-08-20';
  career.calendar = {
    schemaVersion: 2,
    currentDate: '2027-08-20',
    fixturesReleased: true,
    transferWindowOpenDate: '2026-06-15',
    fixtureReleaseDate: '2026-06-19'
  };
  career.preseason = {
    schemaVersion: 1,
    phase: 'complete',
    fixtures: [],
    trainingFocus: 'Balanced',
    tacticalFamiliarity: 90,
    trainingSessions: 0,
    legacyBypass: false
  };
  career.worldClock = {
    schemaVersion: 1,
    acknowledgedMilestones: [],
    history: [],
    totalDaysAdvanced: 0,
    lastProcessedDate: '2027-08-20'
  };
  career.seasonRollovers = [{
    schemaVersion: 1,
    fromSeason: '2026/27',
    toSeason: '2027/28',
    rolledAt: '2027-05-31T09:00:00.000Z'
  }];
  career.transfers.activeWindowSeason = '2026/27';
  career.transfers.completed.push({ id: 'old-window-deal', playerId: 'p-old', fee: 1000000, season: '2026/27' });
  return { career, db };
}

test('untouched direct-opening-day 2027/28 saves are restored to the offseason once', () => {
  const { career, db } = legacyRolledCareer();
  assert.equal(needsRolloverCalendarMigration(career), true);

  const result = migrateRolloverCalendar(career, db, { migratedAt: '2027-06-01T08:00:00.000Z' });
  assert.equal(result.status, 'migrated');
  assert.equal(career.currentDate, '2027-05-31');
  assert.equal(career.calendar.schemaVersion, 3);
  assert.equal(career.calendar.fixturesReleased, false);
  assert.equal(career.calendar.transferWindowOpenDate, '2027-06-15');
  assert.equal(career.calendar.fixtureReleaseDate, '2027-06-19');
  assert.equal(career.preseason.schemaVersion, 2);
  assert.equal(career.preseason.season, '2027/28');
  assert.equal(career.preseason.phase, 'active');
  assert.equal(career.preseason.fixtures.length, 5);
  assert.equal(career.transfers.activeWindowSeason, '2027/28');
  assert.equal(career.transfers.completed.length, 0);
  assert.ok(career.transfers.history.some(item => item.id === 'old-window-deal'));
  assert.equal(career.rolloverCalendarMigration.schemaVersion, 1);

  const snapshot = structuredClone(career);
  assert.equal(migrateRolloverCalendar(career, db).status, 'not-needed');
  assert.deepEqual(career, snapshot);
});

test('a 2027/28 career that has already played a league match is never rewound', () => {
  const { career, db } = legacyRolledCareer();
  career.roundIndex = 1;
  career.fixtures[0][0].played = true;
  const snapshot = structuredClone(career);

  assert.equal(needsRolloverCalendarMigration(career), false);
  assert.equal(migrateRolloverCalendar(career, db).status, 'not-needed');
  assert.deepEqual(career, snapshot);
});
