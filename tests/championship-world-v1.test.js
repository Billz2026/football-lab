import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CHAMPIONSHIP_2026_27_CLUBS,
  createChampionshipFixtures,
  finaliseChampionshipBackground,
  rankChampionshipTable,
  simulateChampionshipSeason
} from '../championship-world-v1.js';

test('membership contains 24 unique 2026/27 clubs', () => {
  assert.equal(CHAMPIONSHIP_2026_27_CLUBS.length, 24);
  assert.equal(new Set(CHAMPIONSHIP_2026_27_CLUBS.map(club => club.id)).size, 24);
  const names = new Set(CHAMPIONSHIP_2026_27_CLUBS.map(club => club.name));
  for (const name of ['West Ham United', 'Wolverhampton Wanderers', 'Burnley', 'Southampton', 'Wrexham']) assert.ok(names.has(name));
});

test('fixture generator gives 46 rounds and 552 matches with every pairing home and away', () => {
  const rounds = createChampionshipFixtures();
  assert.equal(rounds.length, 46);
  assert.ok(rounds.every(round => round.length === 12));
  assert.equal(rounds.flat().length, 552);
  const seen = new Map();
  for (const fixture of rounds.flat()) {
    const key = [fixture.homeClubId, fixture.awayClubId].sort().join('|');
    const list = seen.get(key) || [];
    list.push(fixture);
    seen.set(key, list);
  }
  assert.equal(seen.size, 276);
  for (const pair of seen.values()) {
    assert.equal(pair.length, 2);
    assert.equal(pair[0].homeClubId, pair[1].awayClubId);
    assert.equal(pair[0].awayClubId, pair[1].homeClubId);
  }
});

test('simulation is deterministic and returns a complete promotion outcome', () => {
  const first = simulateChampionshipSeason({ seed: 'same-seed' });
  const second = simulateChampionshipSeason({ seed: 'same-seed' });
  assert.deepEqual(first, second);
  assert.equal(first.status, 'complete');
  assert.equal(first.finalTable.length, 24);
  assert.ok(first.finalTable.every(row => row.played === 46));
  assert.equal(first.regularSeasonMatches, 552);
  assert.equal(first.automaticPromotionClubIds.length, 2);
  assert.equal(first.playoffClubIds.length, 4);
  assert.equal(first.promotedClubIds.length, 3);
  assert.equal(new Set(first.promotedClubIds).size, 3);
  assert.equal(first.relegatedClubIds.length, 3);
  assert.ok(first.playoffClubIds.includes(first.playoffWinnerClubId));
  assert.equal(first.promotedClubIds.some(id => first.relegatedClubIds.includes(id)), false);
});

test('playoffs are 3v6 and 4v5 with higher seed at home in second leg', () => {
  const outcome = simulateChampionshipSeason({ seed: 'playoff-shape' });
  const [third, fourth, fifth, sixth] = outcome.playoffClubIds;
  const [semi36, semi45] = outcome.playoffs.semiFinals;
  assert.equal(semi36.higherSeedClubId, third);
  assert.equal(semi36.lowerSeedClubId, sixth);
  assert.equal(semi36.firstLeg.homeClubId, sixth);
  assert.equal(semi36.secondLeg.homeClubId, third);
  assert.equal(semi45.higherSeedClubId, fourth);
  assert.equal(semi45.lowerSeedClubId, fifth);
  assert.equal(semi45.firstLeg.homeClubId, fifth);
  assert.equal(semi45.secondLeg.homeClubId, fourth);
  assert.equal(outcome.playoffs.final.neutral, true);
  assert.equal(outcome.playoffs.final.venue, 'Wembley Stadium');
});

function tiedRow(clubId, extra = {}) {
  return {
    clubId,
    played: 46,
    won: 20,
    drawn: 10,
    lost: 16,
    goalsFor: 60,
    goalsAgainst: 50,
    goalDifference: 10,
    points: 70,
    awayGoals: 28,
    disciplinePenaltyPoints: 300,
    severeSendingOffs: 1,
    ...extra
  };
}

test('EFL tiebreak uses head-to-head goal difference after head-to-head points', () => {
  const a = tiedRow('a');
  const b = tiedRow('b');
  const fixtures = [[
    { played: true, homeClubId: 'a', awayClubId: 'b', homeGoals: 2, awayGoals: 0 },
    { played: true, homeClubId: 'b', awayClubId: 'a', homeGoals: 1, awayGoals: 0 }
  ]];
  const ranking = rankChampionshipTable([a, b], fixtures);
  assert.equal(ranking.rows[0].clubId, 'a');
  assert.equal(ranking.rows[0].tiebreak.headToHeadPoints, 3);
  assert.equal(ranking.rows[1].tiebreak.headToHeadPoints, 3);
  assert.equal(ranking.rows[0].tiebreak.headToHeadGoalDifference, 1);
});

test('exact tie crossing automatic promotion boundary requires deciding league match', () => {
  const table = Array.from({ length: 24 }, (_, index) => tiedRow(`club-${index + 1}`, {
    points: 100 - index * 3,
    goalDifference: 50 - index,
    goalsFor: 80 - index,
    won: 25 - Math.floor(index / 3),
    awayGoals: 35 - Math.floor(index / 2),
    disciplinePenaltyPoints: 250 + index,
    severeSendingOffs: index % 3
  }));
  Object.assign(table[1], tiedRow('club-2', { points: 94, goalDifference: 48, goalsFor: 78 }));
  Object.assign(table[2], tiedRow('club-3', { points: 94, goalDifference: 48, goalsFor: 78 }));
  const ranking = rankChampionshipTable(table, []);
  assert.equal(ranking.decidingMatchRequired, true);
  assert.ok(ranking.unresolvedGroups.some(group => group.consequences.includes('automatic-promotion')));
});

test('background finalisation is idempotent and attaches promotion to next season context', () => {
  const career = {
    id: 'career-test',
    seed: 'world-seed',
    season: '2026/27',
    leagueId: 'eng-premier-league',
    competitionId: 'eng-premier-league',
    competitionName: 'Premier League',
    table: Array.from({ length: 20 }, (_, index) => ({ clubId: `pl-${index}` })),
    nextSeasonContext: { sourceSeason: '2026/27', relegatedClubIds: ['pl-17', 'pl-18', 'pl-19'] }
  };
  const first = finaliseChampionshipBackground(career, { completedAt: '2027-05-30T18:00:00.000Z' });
  const second = finaliseChampionshipBackground(career, { completedAt: '2027-05-31T18:00:00.000Z' });
  assert.equal(first.status, 'finalised');
  assert.equal(second.status, 'already-finalised');
  assert.equal(career.worldHistory.length, 1);
  assert.equal(career.nextSeasonContext.promotedFromChampionshipClubIds.length, 3);
  assert.equal(career.nextSeasonContext.championshipStatus, 'complete');
});
