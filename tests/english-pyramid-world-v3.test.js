import test from 'node:test';
import assert from 'node:assert/strict';
import { finaliseSeason } from '../season-finalisation-v1.js';
import { validatePremierLeagueRollover } from '../premier-league-rollover-v3.js';

function clubIds() {
  return Array.from({ length: 20 }, (_, index) => `pl-${String(index + 1).padStart(2, '0')}`);
}

function completeFixtures(ids = clubIds()) {
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

function completeTable(ids = clubIds()) {
  return ids.map((clubId, index) => ({
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

function completedCareer(season = '2026/27') {
  return {
    version: 2,
    id: 'pyramid-v3-career',
    seed: 'pyramid-v3-seed',
    managerName: 'Test Manager',
    clubId: 'pl-01',
    leagueId: 'eng-premier-league',
    competitionId: 'eng-premier-league',
    competitionName: 'Premier League',
    season,
    status: 'complete',
    roundIndex: 38,
    fixtures: completeFixtures(),
    table: completeTable(),
    seasonClubs: clubIds().map((id, index) => ({ id, name: `Premier Club ${index + 1}`, strength: 82 - index * 0.4 })),
    seasonHistory: [],
    worldHistory: [],
    lowerLeagueHistory: [],
    worldMemberships: [],
    worldBoundaries: []
  };
}

function resetAsCompletedSeason(career, season) {
  career.season = season;
  career.status = 'complete';
  career.roundIndex = 38;
  career.fixtures = completeFixtures();
  career.table = completeTable();
  career.seasonOutcome = null;
  career.seasonResolution = null;
  career.nextSeasonContext = null;
}

test('2026/27 finalisation uses League Two to create a complete 2027/28 League One membership', () => {
  const career = completedCareer();
  const result = finaliseSeason(career, { completedAt: '2027-05-30T18:00:00.000Z' });
  assert.equal(result.status, 'finalised');
  assert.equal(result.leagueOne.status, 'finalised');
  assert.equal(result.leagueTwo.status, 'finalised');

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
  assert.equal(leagueTwoMembership.status, 'incomplete-lower-pyramid');
  assert.equal(leagueTwoMembership.clubCount, 22);
  assert.equal(leagueTwoMembership.missingPromotionSlots, 2);
  assert.match(leagueTwoMembership.reason, /National League/i);

  const boundary = career.worldBoundaries.find(record => record.key === 'english-pyramid:2027/28');
  assert.equal(boundary.leagueOneStatus, 'complete');
  assert.equal(boundary.leagueTwoStatus, 'incomplete-lower-pyramid');
  assert.match(boundary.status, /league-one-ready/);
});

test('League Two feeder unlocks the Championship chain required for a 2029/30 Premier League rollover', () => {
  const career = completedCareer();
  finaliseSeason(career, { completedAt: '2027-05-30T18:00:00.000Z' });

  resetAsCompletedSeason(career, '2027/28');
  const second = finaliseSeason(career, { completedAt: '2028-05-28T18:00:00.000Z' });
  assert.equal(second.status, 'finalised');
  assert.equal(second.championship.status, 'finalised');
  assert.equal(second.leagueOne.status, 'finalised');
  const championship2028 = career.worldMemberships.find(record => record.key === 'eng-championship:2028/29');
  assert.ok(championship2028);
  assert.equal(championship2028.status, 'complete');
  assert.equal(championship2028.clubCount, 24);

  resetAsCompletedSeason(career, '2028/29');
  const third = finaliseSeason(career, { completedAt: '2029-05-27T18:00:00.000Z' });
  assert.equal(third.status, 'finalised');
  assert.equal(third.championship.status, 'finalised');
  assert.equal(career.nextSeasonContext.promotedFromChampionshipClubIds.length, 3);

  const db = {
    clubs: clubIds().map((id, index) => ({ id, name: `Premier Club ${index + 1}`, leagueId: 'eng-premier-league', reputation: 7000 })),
    players: []
  };
  const validation = validatePremierLeagueRollover(career, db);
  assert.equal(validation.ok, true);
  assert.equal(validation.sourceSeason, '2028/29');
  assert.equal(validation.targetSeason, '2029/30');
});
