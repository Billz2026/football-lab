import test from 'node:test';
import assert from 'node:assert/strict';
import { finaliseSeason } from '../season-finalisation-v1.js';
import {
  rolloverPremierLeagueSeason,
  validatePremierLeagueRollover
} from '../premier-league-rollover-v3.js';

function clubIds() {
  return Array.from({ length: 20 }, (_, index) => `v4-pl-${String(index + 1).padStart(2, '0')}`);
}

function completedFixtures(ids) {
  const fixtures = [];
  let serial = 0;
  for (let first = 0; first < ids.length; first += 1) {
    for (let second = first + 1; second < ids.length; second += 1) {
      fixtures.push({ id: `v4-${++serial}-a`, played: true, homeClubId: ids[first], awayClubId: ids[second], homeGoals: 1, awayGoals: 0 });
      fixtures.push({ id: `v4-${++serial}-b`, played: true, homeClubId: ids[second], awayClubId: ids[first], homeGoals: 0, awayGoals: 1 });
    }
  }
  return [fixtures];
}

function completedTable(ids, protectedClubId) {
  const ordered = ids.includes(protectedClubId)
    ? [protectedClubId, ...ids.filter(id => id !== protectedClubId)]
    : [...ids];
  return ordered.map((clubId, index) => ({
    clubId,
    played: 38,
    won: Math.max(1, 29 - index),
    drawn: 3,
    lost: 6 + index,
    goalsFor: 90 - index,
    goalsAgainst: 30 + index,
    goalDifference: 60 - index * 2,
    points: 100 - index * 4
  }));
}

function dbFixture() {
  const ids = clubIds();
  const clubs = ids.map((id, index) => ({
    id,
    name: `V4 Premier Club ${index + 1}`,
    shortName: `V4 PL ${index + 1}`,
    providerName: `V4 Premier Club ${index + 1}`,
    countryCode: 'ENG',
    leagueId: 'eng-premier-league',
    venue: `V4 Ground ${index + 1}`,
    reputation: 7100 - index * 20,
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
    currentAbility: 137 + (20 - clubIndex) + (playerIndex % 3),
    potentialAbility: 165,
    isPlaceholder: false
  })));
  return { clubs, players };
}

function completedCareer() {
  const ids = clubIds();
  return {
    version: 2,
    id: 'pyramid-v4-career',
    seed: 'pyramid-v4-seed',
    managerName: 'V4 Test Manager',
    clubId: ids[0],
    leagueId: 'eng-premier-league',
    competitionId: 'eng-premier-league',
    competitionName: 'Premier League',
    season: '2026/27',
    status: 'complete',
    roundIndex: 38,
    fixtures: completedFixtures(ids),
    table: completedTable(ids, ids[0]),
    seasonClubs: ids.map((id, index) => ({ id, name: `V4 Premier Club ${index + 1}`, strength: 82 - index * 0.4 })),
    seasonClubIds: ids,
    seasonHistory: [],
    worldHistory: [],
    lowerLeagueHistory: [],
    worldMemberships: [],
    worldBoundaries: [],
    seasonEndDate: '2027-05-30',
    currentDate: '2027-05-30',
    lastMatch: { date: '2027-05-30' },
    calendar: { currentDate: '2027-05-30', fixturesReleased: true },
    preseason: { phase: 'complete' },
    worldClock: { schemaVersion: 2, season: '2026/27', acknowledgedMilestones: [], history: [], totalDaysAdvanced: 300 },
    tactics: { formation: '4-3-3', mentality: 'Balanced', pressing: 'Standard' },
    lineupIds: Array.from({ length: 11 }, (_, index) => `${ids[0]}-p${index + 1}`),
    playerStatus: {}
  };
}

function completeActiveSeason(career) {
  const ids = [...career.seasonClubIds];
  career.table = completedTable(ids, career.clubId);
  career.fixtures = career.fixtures.map(round => round.map(fixture => ({
    ...fixture,
    played: true,
    homeGoals: 1,
    awayGoals: 0
  })));
  career.status = 'complete';
  career.roundIndex = 38;
  career.currentDate = career.seasonEndDate;
  career.calendar.currentDate = career.seasonEndDate;
  career.lastMatch = { date: career.seasonEndDate };
  const result = finaliseSeason(career, { completedAt: `${career.seasonEndDate}T18:00:00.000Z` });
  assert.equal(result.status, 'finalised');
  return result;
}

test('2026/27 National League feeder completes the 2027/28 League Two membership and exposes the Step 2 boundary', () => {
  const career = completedCareer();
  const result = finaliseSeason(career, { completedAt: '2027-05-30T18:00:00.000Z' });

  assert.equal(result.status, 'finalised');
  assert.equal(result.nationalLeague.status, 'finalised');
  assert.equal(result.nationalLeague.outcome.promotedClubIds.length, 2);
  assert.equal(result.nationalLeague.outcome.relegatedClubIds.length, 4);

  const leagueTwoMembership = career.worldMemberships.find(record => record.key === 'eng-league-two:2027/28');
  assert.ok(leagueTwoMembership);
  assert.equal(leagueTwoMembership.status, 'complete');
  assert.equal(leagueTwoMembership.clubCount, 24);
  assert.equal(new Set(leagueTwoMembership.clubs.map(club => club.id)).size, 24);
  assert.equal(leagueTwoMembership.promotedFromNationalLeagueClubIds.length, 2);
  assert.equal(leagueTwoMembership.relegatedFromLeagueOneClubIds.length, 4);

  const nationalLeagueBoundary = career.worldMemberships.find(record => record.key === 'eng-national-league:2027/28');
  assert.ok(nationalLeagueBoundary);
  assert.equal(nationalLeagueBoundary.status, 'incomplete-lower-pyramid');
  assert.equal(nationalLeagueBoundary.clubCount, 20);
  assert.equal(nationalLeagueBoundary.missingPromotionSlots, 4);
  assert.match(nationalLeagueBoundary.reason, /National League North\/South/i);

  const boundary = career.worldBoundaries.find(record => record.key === 'english-pyramid:2027/28');
  assert.equal(boundary.leagueTwoStatus, 'complete');
  assert.equal(boundary.nationalLeagueStatus, 'incomplete-lower-pyramid');
  assert.equal(boundary.status, 'league-two-ready-step-two-boundary');
});

test('National League feeder survives real rollovers and unlocks START 2030/31', () => {
  const db = dbFixture();
  const career = completedCareer();

  const final2026 = finaliseSeason(career, { completedAt: '2027-05-30T18:00:00.000Z' });
  assert.equal(final2026.nationalLeague.status, 'finalised');
  assert.equal(career.worldMemberships.find(record => record.key === 'eng-league-two:2027/28')?.status, 'complete');

  assert.equal(rolloverPremierLeagueSeason(career, { db, rolledAt: '2027-05-31T09:00:00.000Z' }).status, 'rolled-over');
  assert.equal(career.season, '2027/28');

  const final2027 = completeActiveSeason(career);
  assert.equal(final2027.leagueTwo.status, 'finalised');
  const leagueOne2028 = career.worldMemberships.find(record => record.key === 'eng-league-one:2028/29');
  assert.ok(leagueOne2028);
  assert.equal(leagueOne2028.status, 'complete');
  assert.equal(leagueOne2028.clubCount, 24);

  assert.equal(rolloverPremierLeagueSeason(career, { db, rolledAt: '2028-05-29T09:00:00.000Z' }).status, 'rolled-over');
  assert.equal(career.season, '2028/29');

  const final2028 = completeActiveSeason(career);
  assert.equal(final2028.leagueOne.status, 'finalised');
  const championship2029 = career.worldMemberships.find(record => record.key === 'eng-championship:2029/30');
  assert.ok(championship2029);
  assert.equal(championship2029.status, 'complete');
  assert.equal(championship2029.clubCount, 24);

  assert.equal(rolloverPremierLeagueSeason(career, { db, rolledAt: '2029-05-28T09:00:00.000Z' }).status, 'rolled-over');
  assert.equal(career.season, '2029/30');

  const final2029 = completeActiveSeason(career);
  assert.equal(final2029.championship.status, 'finalised');
  assert.equal(career.nextSeasonContext.promotedFromChampionshipClubIds.length, 3);

  const validation = validatePremierLeagueRollover(career, db);
  assert.equal(validation.ok, true);
  assert.equal(validation.sourceSeason, '2029/30');
  assert.equal(validation.targetSeason, '2030/31');

  const rollover2030 = rolloverPremierLeagueSeason(career, { db, rolledAt: '2030-05-27T09:00:00.000Z' });
  assert.equal(rollover2030.status, 'rolled-over');
  assert.equal(career.season, '2030/31');
  assert.equal(career.seasonClubIds.length, 20);
  assert.equal(new Set(career.seasonClubIds).size, 20);
});
