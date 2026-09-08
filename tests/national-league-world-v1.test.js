import test from 'node:test';
import assert from 'node:assert/strict';
import {
  NATIONAL_LEAGUE_2026_27_CLUBS,
  rankNationalLeagueTable,
  simulateNationalLeagueSeason
} from '../national-league-world-v1.js';

test('National League membership contains the verified 24-club 2026/27 Step 1 field', () => {
  assert.equal(NATIONAL_LEAGUE_2026_27_CLUBS.length, 24);
  assert.equal(new Set(NATIONAL_LEAGUE_2026_27_CLUBS.map(club => club.id)).size, 24);
  const names = new Set(NATIONAL_LEAGUE_2026_27_CLUBS.map(club => club.name));
  for (const name of ['AFC Fylde', 'Barrow', 'Harrogate Town', 'Hornchurch', 'Kidderminster Harriers', 'Worthing']) {
    assert.ok(names.has(name));
  }
  assert.equal(names.has('York City'), false);
  assert.equal(names.has('Rochdale'), false);
});

test('National League simulation is deterministic with two promoted and four relegated clubs', () => {
  const first = simulateNationalLeagueSeason({ seed: 'national-league-deterministic' });
  const second = simulateNationalLeagueSeason({ seed: 'national-league-deterministic' });
  assert.deepEqual(first, second);
  assert.equal(first.status, 'complete');
  assert.equal(first.finalTable.length, 24);
  assert.ok(first.finalTable.every(row => row.played === 46));
  assert.equal(first.regularSeasonMatches, 552);
  assert.equal(first.automaticPromotionClubIds.length, 1);
  assert.equal(first.playoffClubIds.length, 6);
  assert.equal(first.promotedClubIds.length, 2);
  assert.equal(new Set(first.promotedClubIds).size, 2);
  assert.equal(first.promotedClubIds[0], first.championClubId);
  assert.equal(first.promotedClubIds[1], first.playoffWinnerClubId);
  assert.equal(first.relegatedClubIds.length, 4);
  assert.equal(first.promotedClubIds.some(id => first.relegatedClubIds.includes(id)), false);
});

test('National League playoffs use 5v6 and 4v7 eliminators before 2nd and 3rd enter the semi-finals', () => {
  const outcome = simulateNationalLeagueSeason({ seed: 'national-league-playoff-shape' });
  const [second, third, fourth, fifth, sixth, seventh] = outcome.playoffClubIds;
  const [elimA, elimB] = outcome.playoffs.eliminators;
  const [semiA, semiB] = outcome.playoffs.semiFinals;

  assert.equal(elimA.homeClubId, fifth);
  assert.equal(elimA.awayClubId, sixth);
  assert.equal(elimB.homeClubId, fourth);
  assert.equal(elimB.awayClubId, seventh);
  assert.equal(semiA.homeClubId, second);
  assert.equal(semiA.awayClubId, elimA.winnerClubId);
  assert.equal(semiB.homeClubId, third);
  assert.equal(semiB.awayClubId, elimB.winnerClubId);
  assert.equal(outcome.playoffs.final.neutral, true);
  assert.equal(outcome.playoffs.final.venue, 'Wembley Stadium');
});

function row(clubId, index) {
  return {
    clubId,
    played: 46,
    won: Math.max(1, 28 - index),
    drawn: 6,
    lost: 12 + index,
    goalsFor: 84 - index,
    goalsAgainst: 34 + index,
    goalDifference: 50 - index * 2,
    points: 100 - index * 4
  };
}

test('an exact tie crossing the title boundary requires a deciding match', () => {
  const table = Array.from({ length: 24 }, (_, index) => row(`club-${index + 1}`, index));
  const tied = {
    played: 46,
    won: 27,
    drawn: 8,
    lost: 11,
    goalsFor: 82,
    goalsAgainst: 32,
    goalDifference: 50,
    points: 101
  };
  Object.assign(table[0], tied);
  Object.assign(table[1], tied);
  const ranking = rankNationalLeagueTable(table, []);
  assert.equal(ranking.decidingMatchRequired, true);
  const group = ranking.unresolvedGroups.find(item => item.consequences.includes('automatic-promotion'));
  assert.ok(group);
  assert.deepEqual(group.positions, [1, 2]);
});

test('an exact tie across 20th and 21st requires a relegation deciding match', () => {
  const table = Array.from({ length: 24 }, (_, index) => row(`club-${index + 1}`, index));
  const tied = {
    played: 46,
    won: 7,
    drawn: 4,
    lost: 35,
    goalsFor: 38,
    goalsAgainst: 69,
    goalDifference: -31,
    points: 25
  };
  Object.assign(table[19], tied);
  Object.assign(table[20], tied);
  table.slice(21).forEach((item, offset) => Object.assign(item, {
    points: 18 - offset * 3,
    goalDifference: -35 - offset * 2,
    goalsFor: 35 - offset,
    won: 5 - offset
  }));
  const ranking = rankNationalLeagueTable(table, []);
  assert.equal(ranking.decidingMatchRequired, true);
  const group = ranking.unresolvedGroups.find(item => item.consequences.includes('relegation'));
  assert.ok(group);
  assert.deepEqual(group.positions, [20, 21]);
});
