import test from 'node:test';
import assert from 'node:assert/strict';
import {
  NATIONAL_LEAGUE_NORTH_2026_27_CLUBS,
  NATIONAL_LEAGUE_SOUTH_2026_27_CLUBS,
  simulateNationalLeagueNorthSeason,
  simulateNationalLeagueSouthSeason
} from '../national-league-step-two-world-v1.js';

for (const [label, clubs] of [
  ['North', NATIONAL_LEAGUE_NORTH_2026_27_CLUBS],
  ['South', NATIONAL_LEAGUE_SOUTH_2026_27_CLUBS]
]) {
  test(`National League ${label} has 24 unique 2026/27 clubs`, () => {
    assert.equal(clubs.length, 24);
    assert.equal(new Set(clubs.map(club => club.id)).size, 24);
  });
}

test('North and South deterministic simulations produce two promoted and four relegated clubs each', () => {
  for (const simulate of [simulateNationalLeagueNorthSeason, simulateNationalLeagueSouthSeason]) {
    const first = simulate({ seed: 'step-two-deterministic' });
    const second = simulate({ seed: 'step-two-deterministic' });
    assert.deepEqual(first, second);
    assert.equal(first.status, 'complete');
    assert.equal(first.finalTable.length, 24);
    assert.ok(first.finalTable.every(row => row.played === 46));
    assert.equal(first.regularSeasonMatches, 552);
    assert.equal(first.promotedClubIds.length, 2);
    assert.equal(first.relegatedClubIds.length, 4);
    assert.equal(new Set(first.promotedClubIds).size, 2);
  }
});

test('Step 2 playoffs use 5v6 and 4v7, then 2nd and 3rd host semi-finals', () => {
  const outcome = simulateNationalLeagueNorthSeason({ seed: 'step-two-playoff-shape' });
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
});

test('Step 2 promotion final is hosted by the higher-ranked finalist', () => {
  const outcome = simulateNationalLeagueSouthSeason({ seed: 'step-two-final-host' });
  const position = new Map(outcome.finalTable.map(row => [row.clubId, row.position]));
  const final = outcome.playoffs.final;
  assert.equal(final.neutral, false);
  assert.equal(final.venueRule, 'ground-of-higher-placed-club');
  assert.equal(final.hostClubId, final.homeClubId);
  assert.ok(position.get(final.homeClubId) < position.get(final.awayClubId));
});
