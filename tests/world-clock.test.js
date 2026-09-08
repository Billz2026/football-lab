import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createCareer } from '../manager-core.js';
import { ensurePreseason, resetPreseasonForSeason } from '../preseason-v047.js';
import { getTransferWindowStatus, processTransferWorld } from '../transfers-v050.js';
import {
  continueCareer,
  ensureWorldClock,
  getCareerSeasonCalendar,
  getCurrentAttention,
  getNextPreseasonDate
} from '../world-clock-v060.js';

const [metadata, clubs, players] = await Promise.all([
  readFile(new URL('../data/current/metadata.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../data/current/clubs.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../data/current/players.json', import.meta.url), 'utf8').then(JSON.parse)
]);

function fixture(seed = 'world-clock-regression') {
  const playableIds = new Set(metadata.playableDemo?.clubIds || []);
  const db = {
    metadata,
    clubs: structuredClone(clubs),
    players: structuredClone(players)
  };
  const leagueClubs = db.clubs.filter(club => playableIds.has(club.id) && !club.isPlaceholder);
  const userClub = leagueClubs.find(club => club.name === 'Arsenal') || leagueClubs[0];
  const career = createCareer({
    clubId: userClub.id,
    clubs: leagueClubs,
    players: db.players,
    seed,
    managerName: 'Calendar Test'
  });
  career.news = { schemaVersion: 1, items: [], generatedRounds: [] };
  ensurePreseason(career, db);
  ensureWorldClock(career);
  return { career, db };
}

function continueWithoutMarket(career, db) {
  return continueCareer(career, db, { processTransfers: false });
}

test('V0.6 starts on 5 June and Continue Game advances day by day to real calendar milestones', () => {
  const { career, db } = fixture();
  assert.equal(career.currentDate, '2026-06-05');
  assert.equal(career.calendar.schemaVersion, 3);
  assert.equal(career.worldClock.schemaVersion, 2);

  const windowOpen = continueWithoutMarket(career, db);
  assert.equal(windowOpen.toDate, '2026-06-15');
  assert.equal(windowOpen.daysAdvanced, 10);
  assert.equal(windowOpen.reason.type, 'transfer-window-open');
  assert.ok(career.news.items.some(item => item.key === 'summer-window-opens'));

  const fixtureRelease = continueWithoutMarket(career, db);
  assert.equal(fixtureRelease.toDate, '2026-06-19');
  assert.equal(fixtureRelease.daysAdvanced, 4);
  assert.equal(fixtureRelease.reason.type, 'fixture-release');
  assert.equal(career.calendar.fixturesReleased, true);
  assert.ok(career.news.items.some(item => item.key === 'fixture-release'));

  const firstFriendly = continueWithoutMarket(career, db);
  assert.equal(firstFriendly.toDate, '2026-07-11');
  assert.equal(firstFriendly.reason.type, 'friendly');
  assert.equal(getNextPreseasonDate(career), '2026-07-11');

  const blocked = continueWithoutMarket(career, db);
  assert.equal(blocked.daysAdvanced, 0);
  assert.equal(blocked.toDate, '2026-07-11');
  assert.equal(blocked.reason.type, 'friendly');
});

test('completed friendlies unlock the next dated pre-season event instead of auto-jumping the calendar', () => {
  const { career, db } = fixture('world-clock-friendlies');
  career.currentDate = '2026-07-11';
  career.calendar.currentDate = '2026-07-11';
  career.calendar.fixturesReleased = true;
  career.worldClock.acknowledgedMilestones = ['summer-window-open', 'fixture-release'];
  career.preseason.fixtures[0].played = true;

  const result = continueWithoutMarket(career, db);
  assert.equal(result.toDate, '2026-07-18');
  assert.equal(result.reason.type, 'friendly');
  assert.equal(career.preseason.fixtures[1].played, false);
});

test('pre-season ready is a hard stop and opening day is only reached after the manager starts the competitive season', () => {
  const { career, db } = fixture('world-clock-opening-day');
  career.preseason.fixtures.forEach(fixtureItem => { fixtureItem.played = true; });
  career.preseason.phase = 'ready';
  career.currentDate = '2026-08-08';
  career.calendar.currentDate = '2026-08-08';
  career.calendar.fixturesReleased = true;
  career.worldClock.acknowledgedMilestones = ['summer-window-open', 'fixture-release'];

  const attention = getCurrentAttention(career);
  assert.equal(attention.type, 'preseason-ready');
  const blocked = continueWithoutMarket(career, db);
  assert.equal(blocked.daysAdvanced, 0);

  career.preseason.phase = 'complete';
  const openingDay = continueWithoutMarket(career, db);
  assert.equal(openingDay.toDate, '2026-08-21');
  assert.equal(openingDay.reason.type, 'matchday');
  assert.equal(openingDay.reason.fixtureId, career.fixtures[0].find(item => item.homeClubId === career.clubId || item.awayClubId === career.clubId).id);
});

test('transfer window status uses the actual world-clock date rather than friendly count or next fixture date', () => {
  const { career } = fixture('world-clock-transfer-status');
  career.preseason.phase = 'complete';
  career.roundIndex = 1;

  career.currentDate = '2026-08-29';
  career.calendar.currentDate = '2026-08-29';
  let status = getTransferWindowStatus(career);
  assert.equal(status.currentDate, '2026-08-29');
  assert.equal(status.open, true);
  assert.equal(status.deadlineWeek, true);

  career.currentDate = '2026-09-01';
  career.calendar.currentDate = '2026-09-01';
  status = getTransferWindowStatus(career);
  assert.equal(status.currentDate, '2026-09-01');
  assert.equal(status.open, true);

  career.currentDate = '2026-09-02';
  career.calendar.currentDate = '2026-09-02';
  status = getTransferWindowStatus(career);
  assert.equal(status.currentDate, '2026-09-02');
  assert.equal(status.open, false);
});

test('transfer-world phases become date based once V0.6 world clock is active', () => {
  const { career, db } = fixture('world-clock-transfer-phases');
  career.currentDate = '2026-06-15';
  career.calendar.currentDate = '2026-06-15';
  const first = processTransferWorld(career, db);
  assert.equal(first.window.currentDate, '2026-06-15');
  assert.equal(first.phaseKey, 'D:2026-06-15');
  const firstPhase = first.phaseKey;

  career.currentDate = '2026-06-19';
  career.calendar.currentDate = '2026-06-19';
  const second = processTransferWorld(career, db);
  assert.equal(second.window.currentDate, '2026-06-19');
  assert.equal(second.phaseKey, 'D:2026-06-19');
  assert.notEqual(second.phaseKey, firstPhase);
  assert.equal(career.roundIndex, 0, 'the real league matchweek must not be changed by transfer processing');
  assert.equal(career.preseason.phase, 'active', 'the real pre-season phase must be restored after transfer processing');
});

test('2027/28 derives a fresh offseason, window, fixture release and Saturday preseason instead of reusing 2026', () => {
  const { career, db } = fixture('world-clock-2027');
  career.season = '2027/28';
  career.previousSeasonEndDate = '2027-05-30';
  career.seasonStartDate = '2027-08-20';
  career.currentDate = '2027-05-31';
  career.calendar = { currentDate: '2027-05-31', fixturesReleased: false };
  career.worldClock = { schemaVersion: 1, acknowledgedMilestones: [], history: [], totalDaysAdvanced: 0 };
  career.news.items.push({ id: 'old-open', key: 'summer-window-opens' }, { id: 'old-release', key: 'fixture-release' });
  resetPreseasonForSeason(career, db, { startedAt: '2027-05-31T09:00:00.000Z' });
  ensureWorldClock(career);

  const calendar = getCareerSeasonCalendar(career);
  assert.equal(calendar.offseasonStartDate, '2027-05-31');
  assert.equal(calendar.transferWindowOpenDate, '2027-06-15');
  assert.equal(calendar.fixtureReleaseDate, '2027-06-19');
  assert.deepEqual(calendar.preseasonFriendlyDates, ['2027-07-10', '2027-07-17', '2027-07-24', '2027-07-31', '2027-08-07']);
  assert.equal(calendar.transferDeadlineDate, '2027-09-01');
  assert.equal(career.preseason.fixtures[0].date, '2027-07-10');
  assert.match(career.preseason.fixtures[0].dateLabel, /2027/);

  const windowOpen = continueWithoutMarket(career, db);
  assert.equal(windowOpen.toDate, '2027-06-15');
  assert.equal(windowOpen.reason.type, 'transfer-window-open');
  assert.ok(career.news.items.some(item => item.key === '2027/28:summer-window-opens'));

  const fixtureRelease = continueWithoutMarket(career, db);
  assert.equal(fixtureRelease.toDate, '2027-06-19');
  assert.equal(fixtureRelease.reason.type, 'fixture-release');
  assert.ok(career.news.items.some(item => item.key === '2027/28:fixture-release'));

  const firstFriendly = continueWithoutMarket(career, db);
  assert.equal(firstFriendly.toDate, '2027-07-10');
  assert.equal(firstFriendly.reason.type, 'friendly');
});

test('2027 transfer processing remains open on the real 2027 dates and returns actual date phase keys', () => {
  const { career, db } = fixture('world-clock-2027-market');
  career.season = '2027/28';
  career.previousSeasonEndDate = '2027-05-30';
  career.seasonStartDate = '2027-08-20';
  career.currentDate = '2027-06-15';
  career.calendar = { currentDate: '2027-06-15', fixturesReleased: false };
  career.worldClock = { schemaVersion: 2, season: '2027/28', acknowledgedMilestones: [], history: [], totalDaysAdvanced: 0 };
  resetPreseasonForSeason(career, db);
  ensureWorldClock(career);

  const status = getTransferWindowStatus(career);
  assert.equal(status.open, true);
  assert.equal(status.currentDate, '2027-06-15');
  assert.equal(status.opens, '2027-06-15');
  assert.equal(status.closes, '2027-09-01');

  const result = processTransferWorld(career, db);
  assert.equal(result.phaseKey, 'D:2027-06-15');
  assert.equal(result.window.currentDate, '2027-06-15');
  assert.equal(result.window.open, true);
});
