import test from 'node:test';
import assert from 'node:assert/strict';
import { finaliseSeason } from '../season-finalisation-v1.js';
import { finaliseChampionshipBackground } from '../championship-world-v1.js';
import { simulateNextRound } from '../manager-core.js';
import {
  ROLLOVER_TARGET_SEASON,
  augmentDatabaseForCareer,
  nextSeasonLabel,
  rolloverPremierLeagueSeason,
  validatePremierLeagueRollover
} from '../premier-league-rollover-v1.js';

function clubIds() {
  return Array.from({ length: 20 }, (_, index) => `club-${String(index + 1).padStart(2, '0')}`);
}

function dbFixture() {
  const ids = clubIds();
  const clubs = ids.map((id, index) => ({
    id,
    name: `Premier Club ${index + 1}`,
    shortName: `Club ${index + 1}`,
    countryCode: 'ENG',
    leagueId: 'eng-premier-league',
    venue: `Ground ${index + 1}`,
    reputation: 7000 + (20 - index) * 45,
    isPlaceholder: false
  }));
  const shape = [
    ['GK', 'GK'],
    ['DEF', 'DR'], ['DEF', 'DC'], ['DEF', 'DC'], ['DEF', 'DL'],
    ['MID', 'DMC'], ['MID', 'MC'], ['MID', 'AMC'],
    ['ATT', 'AMR'], ['ATT', 'ST'], ['ATT', 'AML']
  ];
  const players = clubs.flatMap((club, clubIndex) => shape.map(([positionGroup, primaryPosition], playerIndex) => ({
    id: `${club.id}-p${playerIndex + 1}`,
    name: `${club.name} Player ${playerIndex + 1}`,
    clubId: club.id,
    positionGroup,
    primaryPosition,
    currentAbility: 136 + (20 - clubIndex) + (playerIndex % 3),
    potentialAbility: 165,
    isPlaceholder: false
  })));
  return { clubs, players };
}

function completedFixtures(ids = clubIds()) {
  const fixtures = [];
  let serial = 0;
  for (let a = 0; a < ids.length; a += 1) {
    for (let b = a + 1; b < ids.length; b += 1) {
      fixtures.push({ id: `f-${++serial}-a`, played: true, homeClubId: ids[a], awayClubId: ids[b], homeGoals: 1, awayGoals: 0 });
      fixtures.push({ id: `f-${++serial}-b`, played: true, homeClubId: ids[b], awayClubId: ids[a], homeGoals: 0, awayGoals: 1 });
    }
  }
  return [fixtures];
}

function completedTable(ids = clubIds()) {
  return ids.map((clubId, index) => ({
    clubId,
    played: 38,
    won: Math.max(1, 28 - index),
    drawn: 4,
    lost: Math.max(0, 6 + index),
    goalsFor: 82 - index,
    goalsAgainst: 30 + index,
    goalDifference: 52 - index * 2,
    points: 94 - index * 4
  }));
}

function completedCareer({ managedClubId = 'club-01' } = {}) {
  const career = {
    version: 2,
    id: 'career-rollover-test',
    managerName: 'Test Manager',
    clubId: managedClubId,
    leagueId: 'eng-premier-league',
    competitionId: 'eng-premier-league',
    competitionName: 'Football Lab Premier League',
    competitionFormat: 'double-round-robin',
    season: '2026/27',
    seed: 'rollover-seed',
    status: 'complete',
    roundIndex: 38,
    fixtures: completedFixtures(),
    table: completedTable(),
    tactics: { formation: '4-3-3', mentality: 'Balanced', pressing: 'Standard' },
    lineupIds: Array.from({ length: 11 }, (_, index) => `${managedClubId}-p${index + 1}`),
    playerStatus: {},
    lastMatch: { date: '2027-05-30' },
    seasonEndDate: '2027-05-30',
    currentDate: '2027-05-30',
    calendar: { currentDate: '2027-05-30', fixturesReleased: true },
    preseason: { phase: 'complete' },
    worldClock: { schemaVersion: 1, acknowledgedMilestones: ['old'], history: [{ old: true }], totalDaysAdvanced: 300 }
  };
  const finalised = finaliseSeason(career, { completedAt: '2027-05-30T18:00:00.000Z' });
  assert.equal(finalised.status, 'finalised');
  assert.equal(career.nextSeasonContext.promotedFromChampionshipClubIds.length, 3);
  return career;
}

function pairingAudit(fixtures) {
  const pairs = new Map();
  for (const fixture of fixtures.flat()) {
    const key = [fixture.homeClubId, fixture.awayClubId].sort().join('|');
    const record = pairs.get(key) || [];
    record.push(`${fixture.homeClubId}>${fixture.awayClubId}`);
    pairs.set(key, record);
  }
  return pairs;
}

test('season label advances from 2026/27 to 2027/28', () => {
  assert.equal(nextSeasonLabel('2026/27'), '2027/28');
  assert.equal(nextSeasonLabel('bad-label'), null);
});

test('2026/27 completion rolls into a clean 20-club 2027/28 Premier League offseason', () => {
  const db = dbFixture();
  const career = completedCareer();
  const previousHistory = structuredClone(career.seasonHistory);
  const relegated = [...career.seasonOutcome.relegatedClubIds];
  const promoted = [...career.nextSeasonContext.promotedFromChampionshipClubIds];
  const result = rolloverPremierLeagueSeason(career, { db, rolledAt: '2027-05-31T09:00:00.000Z' });

  assert.equal(result.status, 'rolled-over');
  assert.equal(career.season, ROLLOVER_TARGET_SEASON);
  assert.equal(career.status, 'active');
  assert.equal(career.roundIndex, 0);
  assert.equal(career.seasonClubIds.length, 20);
  assert.equal(new Set(career.seasonClubIds).size, 20);
  assert.equal(relegated.some(id => career.seasonClubIds.includes(id)), false);
  assert.ok(promoted.every(id => career.seasonClubIds.includes(id)));
  assert.equal(career.table.length, 20);
  assert.ok(career.table.every(row => row.played === 0 && row.points === 0 && row.goalsFor === 0 && row.goalsAgainst === 0));
  assert.equal(career.fixtures.length, 38);
  assert.equal(career.fixtures.flat().length, 380);
  assert.ok(career.fixtures.flat().every(fixture => fixture.played === false));
  assert.equal(career.seasonStartDate, '2027-08-20');
  assert.equal(career.seasonEndDate, '2028-05-28');
  assert.equal(career.currentDate, '2027-05-31');
  assert.equal(career.previousSeasonEndDate, '2027-05-30');
  assert.equal(career.calendar.schemaVersion, 3);
  assert.equal(career.calendar.fixturesReleased, false);
  assert.equal(career.calendar.transferWindowOpenDate, '2027-06-15');
  assert.equal(career.calendar.fixtureReleaseDate, '2027-06-19');
  assert.equal(career.calendar.transferDeadlineDate, '2027-09-01');
  assert.equal(career.calendar.transferClosedDate, '2027-09-02');
  assert.deepEqual(career.calendar.preseasonFriendlyDates, ['2027-07-10', '2027-07-17', '2027-07-24', '2027-07-31', '2027-08-07']);
  assert.equal(career.worldClock.schemaVersion, 2);
  assert.equal(career.worldClock.season, '2027/28');
  assert.equal(career.preseason.schemaVersion, 2);
  assert.equal(career.preseason.season, '2027/28');
  assert.equal(career.preseason.phase, 'active');
  assert.deepEqual(career.preseason.fixtures.map(fixture => fixture.date), ['2027-07-10', '2027-07-17', '2027-07-24', '2027-07-31', '2027-08-07']);
  assert.equal(career.transfers.activeWindowSeason, '2027/28');
  assert.equal(career.seasonOutcome, null);
  assert.equal(career.seasonResolution, null);
  assert.equal(career.nextSeasonContext, null);
  assert.equal(career.lastMatch, null);
  assert.deepEqual(career.seasonHistory, previousHistory);
  assert.equal(career.defendingChampionClubId, previousHistory[0].championClubId);
  assert.equal(career.seasonRollovers.length, 1);
  assert.equal(career.seasonRollovers[0].fromSeason, '2026/27');
  assert.equal(career.seasonRollovers[0].toSeason, '2027/28');
  assert.equal(career.seasonRollovers[0].previousSeasonEndDate, '2027-05-30');
});

test('2027/28 fixtures contain every pairing exactly home and away once', () => {
  const db = dbFixture();
  const career = completedCareer();
  rolloverPremierLeagueSeason(career, { db });
  const pairs = pairingAudit(career.fixtures);
  assert.equal(pairs.size, 190);
  for (const games of pairs.values()) {
    assert.equal(games.length, 2);
    const [firstHome, firstAway] = games[0].split('>');
    assert.ok(games.includes(`${firstAway}>${firstHome}`));
  }
});

test('promoted Championship clubs receive isolated background simulation squads at the correct ability scale', () => {
  const db = dbFixture();
  const career = completedCareer();
  const promoted = [...career.nextSeasonContext.promotedFromChampionshipClubIds];
  rolloverPremierLeagueSeason(career, { db });

  assert.equal(career.backgroundPlayers.length, 66);
  assert.equal(career.seasonClubs.filter(club => club.backgroundGenerated).length, 3);
  for (const clubId of promoted) {
    const squad = career.backgroundPlayers.filter(player => player.clubId === clubId);
    assert.equal(squad.length, 22);
    assert.ok(squad.every(player => player.currentAbility >= 115 && player.currentAbility <= 155));
    assert.ok(db.clubs.some(club => club.id === clubId));
    assert.equal(db.players.filter(player => player.clubId === clubId).length, 22);
  }
});

test('rolled-over career can simulate a Premier League matchweek containing promoted clubs after preseason is complete', () => {
  const db = dbFixture();
  const career = completedCareer();
  const promoted = [...career.nextSeasonContext.promotedFromChampionshipClubIds];
  rolloverPremierLeagueSeason(career, { db });
  augmentDatabaseForCareer(career, db);
  career.preseason.phase = 'complete';
  career.currentDate = career.seasonStartDate;
  career.calendar.currentDate = career.seasonStartDate;
  career.calendar.fixturesReleased = true;

  const roundWithPromoted = career.fixtures.findIndex(round => round.some(fixture => promoted.includes(fixture.homeClubId) || promoted.includes(fixture.awayClubId)));
  assert.ok(roundWithPromoted >= 0);
  while (career.roundIndex <= roundWithPromoted) {
    const next = simulateNextRound(career, db);
    Object.assign(career, next);
  }
  assert.equal(career.roundIndex, roundWithPromoted + 1);
  assert.ok(career.fixtures[roundWithPromoted].every(fixture => fixture.played));
  assert.ok(career.fixtures[roundWithPromoted].every(fixture => Number.isInteger(fixture.homeGoals) && Number.isInteger(fixture.awayGoals)));
});

test('2027/28 Championship history is explicitly blocked instead of reusing stale 2026/27 membership', () => {
  const db = dbFixture();
  const career = completedCareer();
  rolloverPremierLeagueSeason(career, { db, rolledAt: '2027-05-31T09:00:00.000Z' });
  const guard = career.worldHistory.find(record => record.key === 'eng-championship:2027/28');

  assert.ok(guard);
  assert.equal(guard.status, 'unsupported-membership');
  assert.deepEqual(guard.promotedClubIds, []);
  assert.match(guard.reason, /will not reuse the 2026\/27 Championship membership/i);

  const countBefore = career.worldHistory.length;
  career.nextSeasonContext = {};
  const result = finaliseChampionshipBackground(career, { completedAt: '2028-05-28T18:00:00.000Z' });
  assert.equal(result.status, 'already-finalised');
  assert.equal(result.outcome.status, 'unsupported-membership');
  assert.equal(career.worldHistory.length, countBefore);
  assert.equal(career.nextSeasonContext.championshipStatus, 'unsupported-membership');
  assert.deepEqual(career.nextSeasonContext.promotedFromChampionshipClubIds, []);
});

test('a relegated user club is blocked instead of being silently retained in the Premier League', () => {
  const db = dbFixture();
  const career = completedCareer({ managedClubId: 'club-20' });
  const snapshot = structuredClone(career);
  const validation = validatePremierLeagueRollover(career, db);
  const result = rolloverPremierLeagueSeason(career, { db });

  assert.equal(validation.status, 'managed-club-relegated');
  assert.equal(result.status, 'managed-club-relegated');
  assert.deepEqual(career, snapshot);
});

test('rollover is idempotent and cannot duplicate the 2027/28 season', () => {
  const db = dbFixture();
  const career = completedCareer();
  const first = rolloverPremierLeagueSeason(career, { db, rolledAt: '2027-05-31T09:00:00.000Z' });
  const snapshot = structuredClone(career);
  const second = rolloverPremierLeagueSeason(career, { db, rolledAt: '2027-06-01T09:00:00.000Z' });

  assert.equal(first.status, 'rolled-over');
  assert.equal(second.status, 'already-rolled-over');
  assert.deepEqual(career, snapshot);
  assert.equal(career.seasonRollovers.length, 1);
});
