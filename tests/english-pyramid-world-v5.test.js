import test from 'node:test';
import assert from 'node:assert/strict';
import { finaliseSeason } from '../season-finalisation-v5.js';
import { rolloverPremierLeagueSeason, validatePremierLeagueRollover } from '../premier-league-rollover-v3.js';

const clubIds = () => Array.from({ length: 20 }, (_, index) => `v5-pl-${String(index + 1).padStart(2, '0')}`);

function fixtures(ids) {
  const matches = [];
  let serial = 0;
  for (let a = 0; a < ids.length; a += 1) for (let b = a + 1; b < ids.length; b += 1) {
    matches.push({ id: `v5-${++serial}-a`, played: true, homeClubId: ids[a], awayClubId: ids[b], homeGoals: 1, awayGoals: 0 });
    matches.push({ id: `v5-${++serial}-b`, played: true, homeClubId: ids[b], awayClubId: ids[a], homeGoals: 0, awayGoals: 1 });
  }
  return [matches];
}

function table(ids, protectedId) {
  const ordered = [protectedId, ...ids.filter(id => id !== protectedId)];
  return ordered.map((clubId, index) => ({ clubId, played: 38, won: Math.max(1, 29 - index), drawn: 3, lost: 6 + index, goalsFor: 90 - index, goalsAgainst: 30 + index, goalDifference: 60 - index * 2, points: 100 - index * 4 }));
}

function dbFixture() {
  const ids = clubIds();
  const clubs = ids.map((id, index) => ({ id, name: `V5 Premier Club ${index + 1}`, shortName: `V5 ${index + 1}`, providerName: `V5 Premier Club ${index + 1}`, countryCode: 'ENG', leagueId: 'eng-premier-league', venue: `Ground ${index + 1}`, reputation: 7100 - index * 20, isPlaceholder: false }));
  const shape = [['GK','GK'],['DEF','DR'],['DEF','DC'],['DEF','DC'],['DEF','DL'],['MID','DMC'],['MID','MC'],['MID','AMC'],['ATT','AMR'],['ATT','ST'],['ATT','AML']];
  const players = clubs.flatMap((club, ci) => shape.map(([positionGroup, primaryPosition], pi) => ({ id: `${club.id}-p${pi + 1}`, name: `${club.name} Player ${pi + 1}`, clubId: club.id, positionGroup, primaryPosition, currentAbility: 137 + (20 - ci) + (pi % 3), potentialAbility: 165, isPlaceholder: false })));
  return { clubs, players };
}

function careerFixture() {
  const ids = clubIds();
  return { version: 2, id: 'pyramid-v5-career', seed: 'pyramid-v5-seed', managerName: 'V5 Manager', clubId: ids[0], leagueId: 'eng-premier-league', competitionId: 'eng-premier-league', competitionName: 'Premier League', season: '2026/27', status: 'complete', roundIndex: 38, fixtures: fixtures(ids), table: table(ids, ids[0]), seasonClubs: ids.map((id, index) => ({ id, name: `V5 Premier Club ${index + 1}`, strength: 82 - index * 0.4 })), seasonClubIds: ids, seasonHistory: [], worldHistory: [], lowerLeagueHistory: [], worldMemberships: [], worldBoundaries: [], seasonEndDate: '2027-05-30', currentDate: '2027-05-30', lastMatch: { date: '2027-05-30' }, calendar: { currentDate: '2027-05-30', fixturesReleased: true }, preseason: { phase: 'complete' }, worldClock: { schemaVersion: 2, season: '2026/27', acknowledgedMilestones: [], history: [], totalDaysAdvanced: 300 }, tactics: { formation: '4-3-3', mentality: 'Balanced', pressing: 'Standard' }, lineupIds: Array.from({ length: 11 }, (_, index) => `${ids[0]}-p${index + 1}`), playerStatus: {} };
}

function completeActiveSeason(career) {
  const ids = [...career.seasonClubIds];
  career.table = table(ids, career.clubId);
  career.fixtures = career.fixtures.map(round => round.map(match => ({ ...match, played: true, homeGoals: 1, awayGoals: 0 })));
  career.status = 'complete'; career.roundIndex = 38; career.currentDate = career.seasonEndDate; career.calendar.currentDate = career.seasonEndDate; career.lastMatch = { date: career.seasonEndDate };
  const result = finaliseSeason(career, { completedAt: `${career.seasonEndDate}T18:00:00.000Z` });
  assert.equal(result.status, 'finalised');
  return result;
}

test('2026/27 Step 2 completes the 2027/28 National League and exposes the Step 3 boundary', () => {
  const career = careerFixture();
  const result = finaliseSeason(career, { completedAt: '2027-05-30T18:00:00.000Z' });
  assert.equal(result.nationalLeagueNorth.status, 'finalised');
  assert.equal(result.nationalLeagueSouth.status, 'finalised');
  assert.equal(result.nationalLeagueNorth.outcome.promotedClubIds.length, 2);
  assert.equal(result.nationalLeagueSouth.outcome.promotedClubIds.length, 2);
  const nl = career.worldMemberships.find(record => record.key === 'eng-national-league:2027/28');
  assert.equal(nl.status, 'complete'); assert.equal(nl.clubCount, 24);
  assert.equal(nl.promotedFromNationalLeagueNorthClubIds.length, 2);
  assert.equal(nl.promotedFromNationalLeagueSouthClubIds.length, 2);
  const stepTwo = career.worldMemberships.find(record => record.key === 'eng-national-league-step-two:2027/28');
  assert.equal(stepTwo.status, 'incomplete-step-three-feeder');
  assert.equal(stepTwo.clubCount, 40); assert.equal(stepTwo.targetClubCount, 48); assert.equal(stepTwo.missingPromotionSlots, 8);
  assert.equal(stepTwo.unallocatedRelegatedFromNationalLeagueClubIds.length, 4);
  const boundary = career.worldBoundaries.find(record => record.key === 'english-pyramid:2027/28');
  assert.equal(boundary.status, 'national-league-ready-step-three-boundary');
  assert.equal(boundary.nationalLeagueStatus, 'complete');
});

test('Step 2 feeder unlocks a legitimate Premier League rollover into START 2031/32', () => {
  const career = careerFixture(); const db = dbFixture();
  finaliseSeason(career, { completedAt: '2027-05-30T18:00:00.000Z' });
  for (const expectedSeason of ['2027/28', '2028/29', '2029/30', '2030/31']) {
    assert.equal(rolloverPremierLeagueSeason(career, { db }).status, 'rolled-over');
    assert.equal(career.season, expectedSeason);
    completeActiveSeason(career);
  }
  assert.equal(career.nextSeasonContext.promotedFromChampionshipClubIds.length, 3);
  const validation = validatePremierLeagueRollover(career, db);
  assert.equal(validation.ok, true);
  assert.equal(validation.sourceSeason, '2030/31');
  assert.equal(validation.targetSeason, '2031/32');
  assert.equal(rolloverPremierLeagueSeason(career, { db }).status, 'rolled-over');
  assert.equal(career.season, '2031/32');
  assert.equal(career.seasonClubIds.length, 20);
  assert.equal(new Set(career.seasonClubIds).size, 20);
});
