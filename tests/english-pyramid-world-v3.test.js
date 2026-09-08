import test from 'node:test';
import assert from 'node:assert/strict';
import { finaliseSeason } from '../season-finalisation-v4.js';
import {
  rolloverPremierLeagueSeason,
  validatePremierLeagueRollover
} from '../premier-league-rollover-v3.js';

function clubIds() {
  return Array.from({ length: 20 }, (_, index) => `pl-${String(index + 1).padStart(2, '0')}`);
}

function completedFixtures(ids = clubIds()) {
  const fixtures = [];
  let serial = 0;
  for (let first = 0; first < ids.length; first += 1) {
    for (let second = first + 1; second < ids.length; second += 1) {
      fixtures.push({ id: `m-${++serial}-a`, played: true, homeClubId: ids[first], awayClubId: ids[second], homeGoals: 1, awayGoals: 0 });
      fixtures.push({ id: `m-${++serial}-b`, played: true, homeClubId: ids[second], awayClubId: ids[first], homeGoals: 0, awayGoals: 1 });
    }
  }
  return [fixtures];
}

function completedTable(ids = clubIds(), protectedClubId = 'pl-01') {
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
    name: `Premier Club ${index + 1}`,
    shortName: `PL ${index + 1}`,
    providerName: `Premier Club ${index + 1}`,
    countryCode: 'ENG',
    leagueId: 'eng-premier-league',
    venue: `Ground ${index + 1}`,
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
    id: 'pyramid-v3-career',
    seed: 'pyramid-v3-seed',
    managerName: 'Test Manager',
    clubId: 'pl-01',
    leagueId: 'eng-premier-league',
    competitionId: 'eng-premier-league',
    competitionName: 'Premier League',
    season: '2026/27',
    status: 'complete',
    roundIndex: 38,
    fixtures: completedFixtures(ids),
    table: completedTable(ids),
    seasonClubs: ids.map((id, index) => ({ id, name: `Premier Club ${index + 1}`, strength: 82 - index * 0.4 })),
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
    lineupIds: Array.from({ length: 11 }, (_, index) => `pl-01-p${index + 1}`),
    playerStatus: {}
  };
}

function completeActiveSeason(career, completedAt) {
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
  const result = finaliseSeason(career, { completedAt });
  assert.equal(result.status, 'finalised');
  return result;
}

test('2026/27 finalisation uses League Two and National League to create complete 2027/28 League One and League Two memberships', () => {
  const career = completedCareer();
  const result = finaliseSeason(career, { completedAt: '2027-05-30T18:00:00.000Z' });
  assert.equal(result.status, 'finalised');
  assert.equal(result.leagueOne.status, 'finalised');
  assert.equal(result.leagueTwo.status, 'finalised');
  assert.equal(result.nationalLeague.status, 'finalised');

  const leagueOneMembership = career.worldMemberships.find(record => record.key === 'eng-league-one:2027/28');
  assert.ok(leagueOneMembership);
  assert.equal(leagueOneMembership.status, 'complete');
  assert.equal(leagueOneMembership.clubCount, 24);
  assert.equal(leagueOneMembership.clubs.length, 24);
  assert.equal(new Set(leagueOneMembership.clubs.map(club => club.id)).size, 24);
  assert.equal(leagueOneMembership.promotedFromLeagueTwoClubIds.length, 4);
  assert.equal(leagueOneMembership.relegatedFromChampionshipClubIds.length, 3);
  assert.equal(leagueOneMembership.relegatedToLeagueTwoClubIds.length, 4);

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
  assert.equal(boundary.leagueOneStatus, 'complete');
  assert.equal(boundary.leagueTwoStatus, 'complete');
  assert.equal(boundary.nationalLeagueStatus, 'incomplete-lower-pyramid');
  assert.equal(boundary.status, 'league-two-ready-step-two-boundary');
});

test('League Two feeder survives real Premier League rollovers and reaches the 2029/30 season', () => {
  const db = dbFixture();
  const career = completedCareer();
  const firstFinal = finaliseSeason(career, { completedAt: '2027-05-30T18:00:00.000Z' });
  assert.equal(firstFinal.status, 'finalised');

  const firstRollover = rolloverPremierLeagueSeason(career, { db, rolledAt: '2027-05-31T09:00:00.000Z' });
  assert.equal(firstRollover.status, 'rolled-over');
  assert.equal(career.season, '2027/28');

  const secondFinal = completeActiveSeason(career, '2028-05-28T18:00:00.000Z');
  assert.equal(secondFinal.championship.status, 'finalised');
  assert.equal(secondFinal.leagueOne.status, 'finalised');
  const championship2028 = career.worldMemberships.find(record => record.key === 'eng-championship:2028/29');
  assert.ok(championship2028);
  assert.equal(championship2028.status, 'complete');
  assert.equal(championship2028.clubCount, 24);

  const secondRollover = rolloverPremierLeagueSeason(career, { db, rolledAt: '2028-05-29T09:00:00.000Z' });
  assert.equal(secondRollover.status, 'rolled-over');
  assert.equal(career.season, '2028/29');

  const thirdFinal = completeActiveSeason(career, '2029-05-27T18:00:00.000Z');
  assert.equal(thirdFinal.championship.status, 'finalised');
  assert.equal(career.nextSeasonContext.promotedFromChampionshipClubIds.length, 3);

  const validation = validatePremierLeagueRollover(career, db);
  assert.equal(validation.ok, true);
  assert.equal(validation.sourceSeason, '2028/29');
  assert.equal(validation.targetSeason, '2029/30');

  const thirdRollover = rolloverPremierLeagueSeason(career, { db, rolledAt: '2029-05-28T09:00:00.000Z' });
  assert.equal(thirdRollover.status, 'rolled-over');
  assert.equal(career.season, '2029/30');
  assert.equal(career.seasonClubIds.length, 20);
  assert.equal(new Set(career.seasonClubIds).size, 20);
});
