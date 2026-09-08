import test from 'node:test';
import assert from 'node:assert/strict';
import { finaliseSeason } from '../season-finalisation-v1.js';
import { CHAMPIONSHIP_2026_27_CLUBS } from '../championship-world-v1.js';
import {
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

function tableFor(ids, preferredFirst = null) {
  const ordered = preferredFirst && ids.includes(preferredFirst)
    ? [preferredFirst, ...ids.filter(id => id !== preferredFirst)]
    : [...ids];
  return ordered.map((clubId, index) => ({
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
  const ids = clubIds();
  const career = {
    version: 2,
    id: 'career-rollover-v2-test',
    managerName: 'Test Manager',
    clubId: managedClubId,
    leagueId: 'eng-premier-league',
    competitionId: 'eng-premier-league',
    competitionName: 'Football Lab Premier League',
    competitionFormat: 'double-round-robin',
    season: '2026/27',
    seed: 'rollover-v2-seed',
    status: 'complete',
    roundIndex: 38,
    fixtures: completedFixtures(ids),
    table: tableFor(ids),
    tactics: { formation: '4-3-3', mentality: 'Balanced', pressing: 'Standard' },
    lineupIds: Array.from({ length: 11 }, (_, index) => `${managedClubId}-p${index + 1}`),
    playerStatus: {},
    lastMatch: { date: '2027-05-30' },
    seasonEndDate: '2027-05-30',
    currentDate: '2027-05-30',
    calendar: { currentDate: '2027-05-30', fixturesReleased: true },
    preseason: { phase: 'complete' },
    worldClock: { schemaVersion: 2, season: '2026/27', acknowledgedMilestones: [], history: [], totalDaysAdvanced: 300 }
  };
  const finalised = finaliseSeason(career, { completedAt: '2027-05-30T18:00:00.000Z' });
  assert.equal(finalised.status, 'finalised');
  return career;
}

function completeActiveSeason(career, { completedAt, protectBackground = true } = {}) {
  const ids = [...career.seasonClubIds];
  const protectedClub = protectBackground
    ? career.seasonClubs.find(club => club.backgroundGenerated)?.id || null
    : null;
  career.table = tableFor(ids, protectedClub);
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
  return { result, protectedClub };
}

test('season labels advance generically beyond the first rollover', () => {
  assert.equal(nextSeasonLabel('2026/27'), '2027/28');
  assert.equal(nextSeasonLabel('2027/28'), '2028/29');
  assert.equal(nextSeasonLabel('2034/35'), '2035/36');
  assert.equal(nextSeasonLabel('bad-label'), null);
});

test('2026/27 finalisation creates complete 2027/28 Championship, League One and League Two memberships', () => {
  const career = completedCareer();
  const championship = career.worldHistory.find(record => record.key === 'eng-championship:2026/27');
  const leagueOne = career.lowerLeagueHistory.find(record => record.key === 'eng-league-one:2026/27');
  const leagueTwo = career.lowerLeagueHistory.find(record => record.key === 'eng-league-two:2026/27');
  const nationalLeague = career.lowerLeagueHistory.find(record => record.key === 'eng-national-league:2026/27');
  const membership = career.worldMemberships.find(record => record.key === 'eng-championship:2027/28');
  const leagueOneMembership = career.worldMemberships.find(record => record.key === 'eng-league-one:2027/28');
  const leagueTwoMembership = career.worldMemberships.find(record => record.key === 'eng-league-two:2027/28');
  const nationalLeagueBoundary = career.worldMemberships.find(record => record.key === 'eng-national-league:2027/28');

  assert.equal(championship.status, 'complete');
  assert.equal(leagueOne.status, 'complete');
  assert.equal(leagueTwo.status, 'complete');
  assert.equal(nationalLeague.status, 'complete');
  assert.equal(leagueOne.promotedClubIds.length, 3);
  assert.equal(leagueOne.relegatedClubIds.length, 4);
  assert.equal(leagueTwo.promotedClubIds.length, 4);
  assert.equal(leagueTwo.relegatedClubIds.length, 2);
  assert.equal(nationalLeague.promotedClubIds.length, 2);
  assert.equal(nationalLeague.relegatedClubIds.length, 4);

  assert.equal(membership.status, 'complete');
  assert.equal(membership.clubCount, 24);
  assert.equal(new Set(membership.clubs.map(club => club.id)).size, 24);
  assert.equal(membership.relegatedFromPremierLeagueClubIds.length, 3);
  assert.equal(membership.promotedFromLeagueOneClubIds.length, 3);
  assert.equal(membership.relegatedToLeagueOneClubIds.length, 3);

  assert.equal(leagueOneMembership.status, 'complete');
  assert.equal(leagueOneMembership.clubCount, 24);
  assert.equal(leagueOneMembership.promotedFromLeagueTwoClubIds.length, 4);
  assert.equal(leagueOneMembership.relegatedFromChampionshipClubIds.length, 3);
  assert.equal(new Set(leagueOneMembership.clubs.map(club => club.id)).size, 24);

  assert.equal(leagueTwoMembership.status, 'complete');
  assert.equal(leagueTwoMembership.clubCount, 24);
  assert.equal(leagueTwoMembership.promotedFromNationalLeagueClubIds.length, 2);
  assert.equal(leagueTwoMembership.relegatedFromLeagueOneClubIds.length, 4);
  assert.equal(new Set(leagueTwoMembership.clubs.map(club => club.id)).size, 24);

  assert.equal(nationalLeagueBoundary.status, 'incomplete-lower-pyramid');
  assert.equal(nationalLeagueBoundary.clubCount, 20);
  assert.equal(nationalLeagueBoundary.missingPromotionSlots, 4);
  assert.match(nationalLeagueBoundary.reason, /National League North\/South/i);

  const sourceIds = new Set(CHAMPIONSHIP_2026_27_CLUBS.map(club => club.id));
  const leaving = new Set([...championship.promotedClubIds, ...championship.relegatedClubIds]);
  const expectedSurvivors = [...sourceIds].filter(id => !leaving.has(id));
  assert.equal(expectedSurvivors.length, 18);
  assert.ok(expectedSurvivors.every(id => membership.clubs.some(club => club.id === id)));
});

test('first rollover enters the 2027/28 offseason with 20 clubs and preserved pyramid state', () => {
  const db = dbFixture();
  const career = completedCareer();
  const promoted = [...career.nextSeasonContext.promotedFromChampionshipClubIds];
  const validation = validatePremierLeagueRollover(career, db);
  assert.equal(validation.ok, true);
  assert.equal(validation.targetSeason, '2027/28');

  const result = rolloverPremierLeagueSeason(career, { db, rolledAt: '2027-05-31T09:00:00.000Z' });
  assert.equal(result.status, 'rolled-over');
  assert.equal(career.season, '2027/28');
  assert.equal(career.currentDate, '2027-05-31');
  assert.equal(career.seasonStartDate, '2027-08-20');
  assert.equal(career.seasonEndDate, '2028-05-28');
  assert.equal(career.seasonClubIds.length, 20);
  assert.ok(promoted.every(id => career.seasonClubIds.includes(id)));
  assert.equal(career.backgroundPlayers.length, 66);
  assert.ok(career.worldMemberships.some(record => record.key === 'eng-championship:2027/28' && record.status === 'complete'));
});

test('2027/28 Championship simulates from its derived membership and creates a complete 2028/29 Championship handoff', () => {
  const db = dbFixture();
  const career = completedCareer();
  rolloverPremierLeagueSeason(career, { db, rolledAt: '2027-05-31T09:00:00.000Z' });
  const { result } = completeActiveSeason(career, { completedAt: '2028-05-28T18:00:00.000Z' });

  assert.equal(result.championship.status, 'finalised');
  assert.equal(result.leagueOne.status, 'finalised');
  assert.equal(result.leagueTwo.status, 'finalised');
  assert.equal(career.championshipOutcome.season, '2027/28');
  assert.equal(career.championshipOutcome.status, 'complete');
  assert.match(career.championshipOutcome.membershipSource, /derived English pyramid membership/);
  assert.equal(career.championshipOutcome.clubs.length, 24);
  assert.equal(career.nextSeasonContext.promotedFromChampionshipClubIds.length, 3);
  assert.equal(career.worldHistory.filter(record => record.competitionId === 'eng-championship').length, 2);
  const nextMembership = career.worldMemberships.find(record => record.key === 'eng-championship:2028/29');
  assert.equal(nextMembership.status, 'complete');
  assert.equal(nextMembership.clubCount, 24);
  assert.equal(nextMembership.promotedFromLeagueOneClubIds.length, 3);
  const nextLeagueOne = career.worldMemberships.find(record => record.key === 'eng-league-one:2028/29');
  assert.equal(nextLeagueOne.status, 'complete');
  assert.equal(nextLeagueOne.clubCount, 24);
  assert.equal(nextLeagueOne.promotedFromLeagueTwoClubIds.length, 4);
});

test('second rollover creates 2028/29 and carries an existing background squad across the save boundary', () => {
  const db = dbFixture();
  const career = completedCareer();
  rolloverPremierLeagueSeason(career, { db, rolledAt: '2027-05-31T09:00:00.000Z' });
  const firstBackgroundClub = career.seasonClubs.find(club => club.backgroundGenerated)?.id;
  assert.ok(firstBackgroundClub);
  const originalBackgroundIds = career.backgroundPlayers.filter(player => player.clubId === firstBackgroundClub).map(player => player.id);
  assert.equal(originalBackgroundIds.length, 22);

  completeActiveSeason(career, { completedAt: '2028-05-28T18:00:00.000Z', protectBackground: true });
  assert.ok(!career.seasonOutcome.relegatedClubIds.includes(firstBackgroundClub));
  const validation = validatePremierLeagueRollover(career, db);
  assert.equal(validation.ok, true);
  assert.equal(validation.targetSeason, '2028/29');

  const result = rolloverPremierLeagueSeason(career, { db, rolledAt: '2028-05-29T09:00:00.000Z' });
  assert.equal(result.status, 'rolled-over');
  assert.equal(career.season, '2028/29');
  assert.equal(career.currentDate, '2028-05-29');
  assert.equal(career.seasonStartDate, '2028-08-18');
  assert.equal(career.seasonEndDate, '2029-05-27');
  assert.equal(career.seasonClubIds.length, 20);
  assert.equal(new Set(career.seasonClubIds).size, 20);
  assert.ok(career.seasonClubIds.includes(firstBackgroundClub));
  const carriedIds = new Set(career.backgroundPlayers.filter(player => player.clubId === firstBackgroundClub).map(player => player.id));
  assert.equal(carriedIds.size, 22);
  assert.ok(originalBackgroundIds.every(id => carriedIds.has(id)));
});

test('2028/29 finalisation creates a complete 2029/30 Championship while the League One Step 4 feeder boundary remains explicit', () => {
  const db = dbFixture();
  const career = completedCareer();
  rolloverPremierLeagueSeason(career, { db });
  completeActiveSeason(career, { completedAt: '2028-05-28T18:00:00.000Z' });
  rolloverPremierLeagueSeason(career, { db });
  const { result } = completeActiveSeason(career, { completedAt: '2029-05-27T18:00:00.000Z' });

  assert.equal(career.season, '2028/29');
  assert.equal(result.championship.status, 'finalised');
  assert.equal(result.leagueOne.status, 'finalised');
  assert.equal(career.championshipOutcome.status, 'complete');
  assert.equal(career.nextSeasonContext.championshipStatus, 'complete');
  assert.equal(career.nextSeasonContext.promotedFromChampionshipClubIds.length, 3);

  const nextChampionship = career.worldMemberships.find(record => record.key === 'eng-championship:2029/30');
  assert.ok(nextChampionship);
  assert.equal(nextChampionship.status, 'complete');
  assert.equal(nextChampionship.clubCount, 24);
  assert.equal(nextChampionship.promotedFromLeagueOneClubIds.length, 3);

  const nextLeagueOne = career.worldMemberships.find(record => record.key === 'eng-league-one:2029/30');
  assert.ok(nextLeagueOne);
  assert.equal(nextLeagueOne.status, 'incomplete-lower-pyramid');
  assert.equal(nextLeagueOne.clubCount, 20);
  assert.equal(nextLeagueOne.missingPromotionSlots, 4);

  const validation = validatePremierLeagueRollover(career, db);
  assert.equal(validation.ok, true);
  assert.equal(validation.sourceSeason, '2028/29');
  assert.equal(validation.targetSeason, '2029/30');
});

test('a relegated managed club is still blocked from a fake Premier League survival', () => {
  const db = dbFixture();
  const career = completedCareer({ managedClubId: 'club-20' });
  const snapshot = structuredClone(career);
  const validation = validatePremierLeagueRollover(career, db);
  const result = rolloverPremierLeagueSeason(career, { db });
  assert.equal(validation.status, 'managed-club-relegated');
  assert.equal(result.status, 'managed-club-relegated');
  assert.deepEqual(career, snapshot);
});

test('rolled background records can repopulate an empty database copy after reload', () => {
  const db = dbFixture();
  const career = completedCareer();
  rolloverPremierLeagueSeason(career, { db });
  const saved = structuredClone(career);
  const freshDb = dbFixture();
  augmentDatabaseForCareer(saved, freshDb);
  for (const club of saved.seasonClubs.filter(item => item.backgroundGenerated)) {
    assert.ok(freshDb.clubs.some(item => item.id === club.id));
    assert.equal(freshDb.players.filter(player => player.clubId === club.id && player.backgroundGenerated).length, 22);
  }
});