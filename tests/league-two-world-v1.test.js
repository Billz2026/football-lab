import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LEAGUE_TWO_2026_27_CLUBS,
  rankLeagueTwoTable,
  simulateLeagueTwoSeason
} from '../league-two-world-v1.js';

test('League Two membership contains 24 unique 2026/27 clubs', () => {
  assert.equal(LEAGUE_TWO_2026_27_CLUBS.length, 24);
  assert.equal(new Set(LEAGUE_TWO_2026_27_CLUBS.map(club => club.id)).size, 24);
  const names = new Set(LEAGUE_TWO_2026_27_CLUBS.map(club => club.name));
  for (const name of ['Walsall', 'York City', 'Rochdale', 'Rotherham United', 'Bristol Rovers']) assert.ok(names.has(name));
});

test('League Two simulation is deterministic with three automatic places, four playoff clubs and two relegated', () => {
  const first = simulateLeagueTwoSeason({ seed: 'league-two-deterministic' });
  const second = simulateLeagueTwoSeason({ seed: 'league-two-deterministic' });
  assert.deepEqual(first, second);
  assert.equal(first.status, 'complete');
  assert.equal(first.finalTable.length, 24);
  assert.ok(first.finalTable.every(row => row.played === 46));
  assert.equal(first.regularSeasonMatches, 552);
  assert.equal(first.automaticPromotionClubIds.length, 3);
  assert.equal(first.playoffClubIds.length, 4);
  assert.equal(first.promotedClubIds.length, 4);
  assert.equal(new Set(first.promotedClubIds).size, 4);
  assert.equal(first.relegatedClubIds.length, 2);
  assert.ok(first.playoffClubIds.includes(first.playoffWinnerClubId));
  assert.equal(first.promotedClubIds.some(id => first.relegatedClubIds.includes(id)), false);
});

test('League Two playoffs are 4v7 and 5v6 with the higher seed home in the second leg', () => {
  const outcome = simulateLeagueTwoSeason({ seed: 'league-two-playoff-shape' });
  const [fourth, fifth, sixth, seventh] = outcome.playoffClubIds;
  const [semi47, semi56] = outcome.playoffs.semiFinals;
  assert.equal(semi47.higherSeedClubId, fourth);
  assert.equal(semi47.lowerSeedClubId, seventh);
  assert.equal(semi47.firstLeg.homeClubId, seventh);
  assert.equal(semi47.secondLeg.homeClubId, fourth);
  assert.equal(semi56.higherSeedClubId, fifth);
  assert.equal(semi56.lowerSeedClubId, sixth);
  assert.equal(semi56.firstLeg.homeClubId, sixth);
  assert.equal(semi56.secondLeg.homeClubId, fifth);
  assert.equal(outcome.playoffs.final.neutral, true);
  assert.equal(outcome.playoffs.final.venue, 'Wembley Stadium');
});

function row(clubId, index) {
  return {
    clubId,
    played: 46,
    won: 25 - Math.floor(index / 3),
    drawn: 8,
    lost: 13 + index,
    goalsFor: 82 - index,
    goalsAgainst: 35 + index,
    goalDifference: 47 - index * 2,
    points: 100 - index * 3,
    awayGoals: 32 - Math.floor(index / 2),
    disciplinePenaltyPoints: 250 + index,
    severeSendingOffs: index % 3
  };
}

test('an exact tie crossing third place requires a deciding league match instead of using Championship boundaries', () => {
  const table = Array.from({ length: 24 }, (_, index) => row(`club-${index + 1}`, index));
  const tied = {
    played: 46,
    won: 20,
    drawn: 10,
    lost: 16,
    goalsFor: 70,
    goalsAgainst: 45,
    goalDifference: 25,
    points: 80,
    awayGoals: 28,
    disciplinePenaltyPoints: 280,
    severeSendingOffs: 1
  };
  Object.assign(table[2], tied);
  Object.assign(table[3], tied);
  const ranking = rankLeagueTwoTable(table, []);
  assert.equal(ranking.decidingMatchRequired, true);
  assert.ok(ranking.unresolvedGroups.some(group => group.consequences.includes('automatic-promotion')));
  assert.deepEqual(ranking.unresolvedGroups.find(group => group.consequences.includes('automatic-promotion')).positions, [3, 4]);
});
