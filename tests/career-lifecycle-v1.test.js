import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_CAREER_SEASONS,
  buildCareerSummary,
  canRolloverCareer,
  careerSeasonNumber,
  ensureCareerLifecycleState,
  finalCareerSeasonLabel,
  finaliseCareerIfLimitReached
} from '../career-lifecycle-v1.js';
import { validatePremierLeagueRollover } from '../premier-league-rollover-v1.js';

function row(clubId, { position = 1, won = 20, drawn = 8, lost = 10 } = {}) {
  return {
    clubId,
    played: won + drawn + lost,
    won,
    drawn,
    lost,
    goalsFor: 60 - position,
    goalsAgainst: 35 + position,
    goalDifference: 25 - position,
    points: won * 3 + drawn
  };
}

function seasonRecord(index, clubId = 'arsenal') {
  const start = 2026 + index;
  const season = `${start}/${String((start + 1) % 100).padStart(2, '0')}`;
  const managed = row(clubId, { position: index % 5 === 0 ? 1 : 3, won: 20 + (index % 3), drawn: 8, lost: 10 - (index % 3) });
  const other = row('other-club', { position: managed.points > 70 ? 2 : 1, won: 19, drawn: 9, lost: 10 });
  return {
    key: `eng-premier-league:${season}`,
    season,
    competitionId: 'eng-premier-league',
    championClubId: index % 5 === 0 ? clubId : 'other-club',
    relegatedClubIds: [],
    finalTable: index % 5 === 0 ? [managed, other] : [other, managed]
  };
}

test('a 2026/27 career starts at season 1 with a hard 40-season limit ending in 2065/66', () => {
  const career = { season: '2026/27' };
  ensureCareerLifecycleState(career);
  assert.equal(MAX_CAREER_SEASONS, 40);
  assert.equal(career.careerStartSeason, '2026/27');
  assert.equal(careerSeasonNumber(career), 1);
  assert.equal(career.careerSeasonNumber, 1);
  assert.equal(career.remainingSeasons, 40);
  assert.equal(career.rolloversRemaining, 39);
  assert.equal(career.isFinalCareerSeason, false);
  assert.equal(finalCareerSeasonLabel(career), '2065/66');
});

test('legacy saves without lifecycle metadata migrate from the original 2026/27 career start', () => {
  const career = { season: '2031/32', seasonHistory: [] };
  ensureCareerLifecycleState(career);
  assert.equal(career.careerStartSeason, '2026/27');
  assert.equal(career.careerSeasonNumber, 6);
  assert.equal(career.remainingSeasons, 35);
  assert.equal(career.rolloversRemaining, 34);
});

test('2064/65 can roll into the final season but 2065/66 cannot create season 41', () => {
  const penultimate = { season: '2064/65' };
  const final = { season: '2065/66' };
  assert.equal(canRolloverCareer(penultimate).ok, true);
  const blocked = canRolloverCareer(final);
  assert.equal(blocked.ok, false);
  assert.equal(blocked.status, 'career-limit-reached');
  assert.match(blocked.reason, /40th and final playable season/i);
});

test('completing season 40 retires the manager and builds a permanent career summary', () => {
  const seasonHistory = Array.from({ length: 40 }, (_, index) => seasonRecord(index));
  const career = {
    managerName: 'Test Manager',
    clubId: 'arsenal',
    season: '2065/66',
    status: 'complete',
    seasonHistory,
    seasonOutcome: seasonHistory.at(-1),
    careerStats: { domesticCups: 3, europeanTrophies: 2, promotions: 0 }
  };
  const result = finaliseCareerIfLimitReached(career, { completedAt: '2066-05-30T18:00:00.000Z' });
  assert.equal(result.status, 'retired');
  assert.equal(career.careerLifecycle.status, 'retired');
  assert.equal(career.careerRetired, true);
  assert.equal(career.remainingSeasons, 0);
  assert.equal(career.rolloversRemaining, 0);
  assert.equal(career.careerSummary.seasonsCompleted, 40);
  assert.equal(career.careerSummary.matches, 1520);
  assert.equal(career.careerSummary.leagueTitles, 8);
  assert.equal(career.careerSummary.domesticCups, 3);
  assert.equal(career.careerSummary.europeanTrophies, 2);
  assert.ok(career.careerSummary.hallOfFameScore > 0);
  assert.equal(career.careerSummary.finalSeason, '2065/66');
});

test('career summary derives match record and win percentage from permanent final tables', () => {
  const career = {
    managerName: 'Summary Manager',
    clubId: 'arsenal',
    season: '2027/28',
    careerStartSeason: '2026/27',
    seasonHistory: [seasonRecord(0), seasonRecord(1)]
  };
  const summary = buildCareerSummary(career);
  const managedRows = career.seasonHistory.map(record => record.finalTable.find(item => item.clubId === 'arsenal'));
  const expectedWins = managedRows.reduce((sum, item) => sum + item.won, 0);
  assert.equal(summary.seasonsCompleted, 2);
  assert.equal(summary.matches, 76);
  assert.equal(summary.wins, expectedWins);
  assert.equal(summary.winPercentage, Number(((expectedWins / 76) * 100).toFixed(1)));
  assert.deepEqual(summary.clubsManaged, ['arsenal']);
});

test('Premier League rollover API refuses to generate 2066/67 even when called directly', () => {
  const career = {
    season: '2065/66',
    status: 'complete',
    competitionId: 'eng-premier-league',
    leagueId: 'eng-premier-league',
    seasonHistory: [],
    seasonOutcome: { championClubId: 'arsenal', relegatedClubIds: ['a', 'b', 'c'], finalTable: [] }
  };
  const validation = validatePremierLeagueRollover(career, { clubs: [], players: [] });
  assert.equal(validation.ok, false);
  assert.equal(validation.status, 'career-complete');
  assert.equal(career.careerLifecycle.status, 'retired');
  assert.equal(career.careerSummary.finalSeason, '2065/66');
});
