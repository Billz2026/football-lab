import test from 'node:test';
import assert from 'node:assert/strict';
import {
  LEAGUE_ONE_2026_27_CLUBS,
  LEAGUE_ONE_ID,
  simulateLeagueOneSeason
} from '../league-one-world-v1.js';

test('2026/27 League One membership contains the verified 24-club field', () => {
  assert.equal(LEAGUE_ONE_2026_27_CLUBS.length, 24);
  assert.equal(new Set(LEAGUE_ONE_2026_27_CLUBS.map(club => club.id)).size, 24);
  const names = new Set(LEAGUE_ONE_2026_27_CLUBS.map(club => club.name));
  for (const name of ['Leicester City', 'Sheffield Wednesday', 'Luton Town', 'Oxford United', 'Huddersfield Town', 'Stockport County']) {
    assert.ok(names.has(name));
  }
});

test('League One simulation is deterministic with three promoted and four relegated clubs', () => {
  const first = simulateLeagueOneSeason({ seed: 'league-one-deterministic' });
  const second = simulateLeagueOneSeason({ seed: 'league-one-deterministic' });
  assert.deepEqual(first, second);
  assert.equal(first.competitionId, LEAGUE_ONE_ID);
  assert.equal(first.status, 'complete');
  assert.equal(first.finalTable.length, 24);
  assert.ok(first.finalTable.every(row => row.played === 46));
  assert.equal(first.regularSeasonMatches, 552);
  assert.equal(first.automaticPromotionClubIds.length, 2);
  assert.equal(first.playoffClubIds.length, 4);
  assert.equal(first.promotedClubIds.length, 3);
  assert.equal(new Set(first.promotedClubIds).size, 3);
  assert.equal(first.relegatedClubIds.length, 4);
  assert.equal(new Set(first.relegatedClubIds).size, 4);
  assert.equal(first.promotedClubIds.some(id => first.relegatedClubIds.includes(id)), false);
  assert.ok(first.playoffClubIds.includes(first.playoffWinnerClubId));
});

test('League One outcome retains club strength metadata for pyramid handoffs', () => {
  const outcome = simulateLeagueOneSeason({ seed: 'league-one-metadata' });
  assert.equal(outcome.clubs.length, 24);
  assert.ok(outcome.clubs.every(club => club.id && club.name && Number.isFinite(club.strength)));
  for (const id of outcome.promotedClubIds) assert.ok(outcome.clubs.some(club => club.id === id));
});
