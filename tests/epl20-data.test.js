import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createCareer } from '../manager-core.js';

const [metadata, clubs, players] = await Promise.all([
  readFile(new URL('../data/current/metadata.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../data/current/clubs.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../data/current/players.json', import.meta.url), 'utf8').then(JSON.parse)
]);

const expectedNames = [
  'AFC Bournemouth', 'Arsenal', 'Aston Villa', 'Brentford', 'Brighton & Hove Albion',
  'Chelsea', 'Coventry City', 'Crystal Palace', 'Everton', 'Fulham', 'Hull City',
  'Ipswich Town', 'Leeds United', 'Liverpool', 'Manchester City', 'Manchester United',
  'Newcastle United', 'Nottingham Forest', 'Sunderland', 'Tottenham Hotspur'
];

function playableClubs() {
  const ids = new Set(metadata.playableDemo?.clubIds || []);
  return clubs.filter(club => ids.has(club.id) && !club.isPlaceholder);
}

test('current database contains exactly the 20 playable Premier League clubs', () => {
  const playable = playableClubs();
  assert.equal(playable.length, 20);
  assert.deepEqual(playable.map(club => club.name).sort(), [...expectedNames].sort());
  assert.ok(playable.every(club => club.leagueId === 'eng-premier-league'));
  assert.equal(metadata.importProgress?.['eng-premier-league']?.realClubs, 20);
  assert.equal(metadata.importProgress?.['eng-premier-league']?.status, 'complete');
});

test('every playable Premier League club has a viable imported squad', () => {
  for (const club of playableClubs()) {
    const squad = players.filter(player => player.clubId === club.id && !player.isPlaceholder);
    assert.ok(squad.length >= 18, `${club.name} has only ${squad.length} real players`);
    assert.ok(squad.some(player => player.positionGroup === 'GK'), `${club.name} has no goalkeeper`);
    assert.ok(squad.filter(player => player.positionGroup === 'DEF').length >= 4, `${club.name} has fewer than four defenders`);
    assert.ok(squad.filter(player => player.positionGroup === 'MID').length >= 3, `${club.name} has fewer than three midfielders`);
    assert.ok(squad.filter(player => player.positionGroup === 'ATT').length >= 2, `${club.name} has fewer than two attackers`);
  }
});

test('20-club beta career creates a complete 19-round single round-robin', () => {
  const playable = playableClubs();
  const career = createCareer({
    clubId: playable[0].id,
    clubs: playable,
    players,
    seed: 'epl20-regression',
    managerName: 'Regression Manager'
  });
  assert.equal(career.table.length, 20);
  assert.equal(career.fixtures.length, 19);
  assert.ok(career.fixtures.every(round => round.length === 10));
  const fixtureCount = career.fixtures.flat().length;
  assert.equal(fixtureCount, 190);
});
