import test from 'node:test';
import assert from 'node:assert/strict';
import {
  autoPickLineup,
  createCareer,
  createFixtures,
  getNextFixture,
  parseCareer,
  serializeCareer,
  simulateNextRound,
  sortedTable,
  updateLineup,
  validateLineup
} from '../manager-core.js';

const groups = ['GK', 'DEF', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'ATT', 'ATT', 'ATT', 'MID'];
const clubs = Array.from({ length: 8 }, (_, index) => ({
  id: `club-${index + 1}`,
  name: `Club ${index + 1}`,
  reputation: 7000 + index * 60,
  isPlaceholder: false
}));
const players = clubs.flatMap((club, clubIndex) => groups.map((group, playerIndex) => ({
  id: `${club.id}-player-${playerIndex + 1}`,
  clubId: club.id,
  name: `${club.name} Player ${playerIndex + 1}`,
  positionGroup: group,
  primaryPosition: group === 'GK' ? 'GK' : group === 'DEF' ? 'DC' : group === 'MID' ? 'MC' : 'ST',
  currentAbility: 110 + clubIndex * 2 + playerIndex,
  isPlaceholder: false
})));
const db = { clubs, players };

test('double round robin gives eight clubs 14 matchweeks and every pairing home and away', () => {
  const rounds = createFixtures(clubs.map(club => club.id));
  assert.equal(rounds.length, 14);
  assert.ok(rounds.every(round => round.length === 4));
  const pairings = new Map();
  for (const fixture of rounds.flat()) {
    const key = [fixture.homeClubId, fixture.awayClubId].sort().join(':');
    const list = pairings.get(key) || [];
    list.push(fixture);
    pairings.set(key, list);
  }
  assert.equal(pairings.size, 28);
  for (const matches of pairings.values()) {
    assert.equal(matches.length, 2);
    assert.equal(matches[0].homeClubId, matches[1].awayClubId);
    assert.equal(matches[0].awayClubId, matches[1].homeClubId);
  }
});

test('auto pick creates a legal balanced XI', () => {
  const lineup = autoPickLineup(players, clubs[0].id);
  const validation = validateLineup(lineup, players, clubs[0].id);
  assert.equal(lineup.length, 11);
  assert.equal(validation.valid, true);
});

test('invalid lineup cannot be saved', () => {
  const career = createCareer({ clubId: clubs[0].id, clubs, players, seed: 'lineup-test' });
  assert.throws(() => updateLineup(career, career.lineupIds.slice(0, 10), players), /exactly 11/);
});

test('a deterministic 14-matchweek season updates every club and completes', () => {
  let first = createCareer({ clubId: clubs[0].id, clubs, players, seed: 'fixed-season' });
  let second = createCareer({ clubId: clubs[0].id, clubs, players, seed: 'fixed-season' });
  assert.ok(getNextFixture(first));
  for (let round = 0; round < 14; round += 1) {
    first = simulateNextRound(first, db);
    second = simulateNextRound(second, db);
  }
  assert.equal(first.status, 'complete');
  assert.equal(getNextFixture(first), null);
  assert.deepEqual(first.fixtures, second.fixtures);
  assert.ok(first.table.every(row => row.played === 14));
  assert.equal(first.table.reduce((total, row) => total + row.won, 0), first.table.reduce((total, row) => total + row.lost, 0));
  const totalPoints = first.table.reduce((total, row) => total + row.points, 0);
  assert.ok(totalPoints >= 112 && totalPoints <= 168);
  assert.equal(sortedTable(first.table).length, 8);
});

test('career saves round trip and reject unknown versions', () => {
  const career = createCareer({ clubId: clubs[2].id, clubs, players, seed: 'save-test' });
  assert.deepEqual(parseCareer(serializeCareer(career), db), career);
  assert.throws(() => parseCareer({ ...career, version: 99 }, db), /unsupported/);
});

test('legacy single-round saves are upgraded with a return leg', () => {
  const career = createCareer({ clubId: clubs[1].id, clubs, players, seed: 'legacy-test' });
  const legacy = { ...career, version: 1, fixtures: career.fixtures.slice(0, 7) };
  const upgraded = parseCareer(legacy, db);
  assert.equal(upgraded.version, 2);
  assert.equal(upgraded.fixtures.length, 14);
  assert.equal(upgraded.competitionFormat, 'double-round-robin');
});
