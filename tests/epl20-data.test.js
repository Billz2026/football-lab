import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createCareer, PREMIER_LEAGUE_2026_27_MATCHWEEK_DATES } from '../manager-core.js';

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

function longestVenueRun(fixtures, clubId) {
  const sequence = fixtures.map(round => {
    const fixture = round.find(item => item.homeClubId === clubId || item.awayClubId === clubId);
    return fixture.homeClubId === clubId ? 'H' : 'A';
  });
  let longest = 1;
  let current = 1;
  for (let index = 1; index < sequence.length; index += 1) {
    if (sequence[index] === sequence[index - 1]) {
      current += 1;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }
  return longest;
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

test('20-club career creates a complete 38-match home-and-away league season', () => {
  const playable = playableClubs();
  const career = createCareer({
    clubId: playable[0].id,
    clubs: playable,
    players,
    seed: 'epl20-regression',
    managerName: 'Regression Manager'
  });

  assert.equal(career.competitionFormat, 'double-round-robin');
  assert.equal(career.table.length, 20);
  assert.equal(career.fixtures.length, 38);
  assert.ok(career.fixtures.every(round => round.length === 10));
  assert.equal(career.fixtures.flat().length, 380);
  assert.equal(career.fixtures[0][0].date, '2026-08-21');
  assert.equal(career.fixtures.at(-1)[0].date, '2027-05-30');
  assert.deepEqual(career.fixtures.map(round => round[0].date), PREMIER_LEAGUE_2026_27_MATCHWEEK_DATES);

  const pairings = new Map();
  for (const fixture of career.fixtures.flat()) {
    const key = [fixture.homeClubId, fixture.awayClubId].sort().join(':');
    const list = pairings.get(key) || [];
    list.push(fixture);
    pairings.set(key, list);
  }
  assert.equal(pairings.size, 190);
  for (const matches of pairings.values()) {
    assert.equal(matches.length, 2);
    assert.equal(matches[0].homeClubId, matches[1].awayClubId);
    assert.equal(matches[0].awayClubId, matches[1].homeClubId);
    assert.ok(matches[1].round - matches[0].round >= 18, 'return fixture is scheduled too soon');
  }

  for (const club of playable) {
    const clubFixtures = career.fixtures.flat().filter(fixture => fixture.homeClubId === club.id || fixture.awayClubId === club.id);
    assert.equal(clubFixtures.length, 38);
    assert.equal(clubFixtures.filter(fixture => fixture.homeClubId === club.id).length, 19);
    assert.equal(clubFixtures.filter(fixture => fixture.awayClubId === club.id).length, 19);
    assert.ok(longestVenueRun(career.fixtures, club.id) <= 2, `${club.name} has an unrealistic home/away streak`);
  }

  const midweeks = career.fixtures.filter(round => new Date(`${round[0].date}T12:00:00Z`).getUTCDay() === 3);
  assert.equal(midweeks.length, 5);
  assert.equal(career.fixtures.at(-1)[0].kickoffTime, '16:00');
});
