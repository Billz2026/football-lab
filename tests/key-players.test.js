import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { curatedKeyPlayers } from '../key-players-v048.js';

const players = JSON.parse(await readFile(new URL('../data/current/players.json', import.meta.url), 'utf8'));
const database = { players };

test('Arsenal key-player markers use curated real-world names rather than CA ranking', () => {
  const names = curatedKeyPlayers(database, 'flm-club-api-football-42').map(player => player.lastName);
  assert.deepEqual(names, ['Saka', 'Rice', 'Ødegaard']);
});

test('Chelsea key-player markers identify Palmer, Caicedo and Fernandez when present', () => {
  // Identity must survive provider updates from short to compound surnames.
  const ids = curatedKeyPlayers(database, 'flm-club-api-football-49').map(player => player.id);
  assert.deepEqual(ids, ['flm-player-api-football-152982', 'flm-player-api-football-116117', 'flm-player-api-football-5996']);
});

test('curated markers never fill missing names from low-confidence ability values', () => {
  const reduced = { players: database.players.filter(player => player.lastName !== 'Saka') };
  const chosen = curatedKeyPlayers(reduced, 'flm-club-api-football-42');
  assert.equal(chosen.length, 2);
  assert.equal(chosen.some(player => player.lastName === 'Saka'), false);
});
