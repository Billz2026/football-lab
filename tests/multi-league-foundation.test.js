import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clubsForLeague,
  createLeagueCareer,
  leagueForClub,
  playableLeagues
} from '../league-career-v1.js';

const leagues = [
  { id: 'eng-premier-league', name: 'Premier League', countryCode: 'ENG', season: '2026/27' },
  { id: 'esp-la-liga', name: 'La Liga', countryCode: 'ESP', season: '2026/27' }
];

const groups = ['GK', 'DEF', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'ATT', 'ATT', 'ATT', 'MID'];
const makeClubs = (leagueId, countryCode, prefix) => Array.from({ length: 4 }, (_, index) => ({
  id: `${prefix}-${index + 1}`,
  name: `${prefix.toUpperCase()} Club ${index + 1}`,
  shortName: `${prefix.toUpperCase()} ${index + 1}`,
  countryCode,
  leagueId,
  reputation: 7000 + index * 100,
  isPlaceholder: false
}));

const englishClubs = makeClubs('eng-premier-league', 'ENG', 'eng');
const spanishClubs = makeClubs('esp-la-liga', 'ESP', 'esp');
const clubs = [...englishClubs, ...spanishClubs];
const players = clubs.flatMap((club, clubIndex) => groups.map((group, playerIndex) => ({
  id: `${club.id}-player-${playerIndex + 1}`,
  clubId: club.id,
  name: `${club.name} Player ${playerIndex + 1}`,
  positionGroup: group,
  primaryPosition: group === 'GK' ? 'GK' : group === 'DEF' ? 'DC' : group === 'MID' ? 'MC' : 'ST',
  currentAbility: 110 + clubIndex + playerIndex,
  isPlaceholder: false
})));
const db = { leagues, clubs, players };

test('resolves a club to exactly one league', () => {
  assert.equal(leagueForClub(db, englishClubs[0].id).id, 'eng-premier-league');
  assert.equal(leagueForClub(db, spanishClubs[0].id).id, 'esp-la-liga');
});

test('league club selection never mixes countries or competitions', () => {
  assert.deepEqual(clubsForLeague(db, 'eng-premier-league').map(club => club.id), englishClubs.map(club => club.id));
  assert.deepEqual(clubsForLeague(db, 'esp-la-liga').map(club => club.id), spanishClubs.map(club => club.id));
});

test('only structurally playable leagues are exposed', () => {
  assert.deepEqual(playableLeagues(db).map(league => league.id), ['eng-premier-league', 'esp-la-liga']);
  const broken = { ...db, clubs: clubs.filter(club => club.id !== spanishClubs[3].id) };
  assert.deepEqual(playableLeagues(broken).map(league => league.id), ['eng-premier-league']);
});

test('an English career contains only English league clubs', () => {
  const career = createLeagueCareer({ clubId: englishClubs[0].id, db, seed: 'eng-career' });
  assert.equal(career.leagueId, 'eng-premier-league');
  assert.equal(career.competitionId, 'eng-premier-league');
  assert.equal(career.competitionName, 'Premier League');
  assert.equal(career.countryCode, 'ENG');
  assert.equal(career.table.length, 4);
  assert.deepEqual(new Set(career.table.map(row => row.clubId)), new Set(englishClubs.map(club => club.id)));
  assert.ok(career.fixtures.flat().every(fixture => englishClubs.some(club => club.id === fixture.homeClubId) && englishClubs.some(club => club.id === fixture.awayClubId)));
});

test('a Spanish career contains only Spanish league clubs', () => {
  const career = createLeagueCareer({ clubId: spanishClubs[0].id, db, seed: 'esp-career' });
  assert.equal(career.leagueId, 'esp-la-liga');
  assert.equal(career.competitionId, 'esp-la-liga');
  assert.equal(career.competitionName, 'La Liga');
  assert.equal(career.countryCode, 'ESP');
  assert.equal(career.table.length, 4);
  assert.deepEqual(new Set(career.table.map(row => row.clubId)), new Set(spanishClubs.map(club => club.id)));
  assert.ok(career.fixtures.flat().every(fixture => spanishClubs.some(club => club.id === fixture.homeClubId) && spanishClubs.some(club => club.id === fixture.awayClubId)));
});

test('clubs without a league assignment are rejected', () => {
  const unassigned = { id: 'orphan', name: 'Orphan FC', countryCode: 'ESP', isPlaceholder: false };
  assert.throws(
    () => createLeagueCareer({ clubId: unassigned.id, db: { ...db, clubs: [...clubs, unassigned] } }),
    /not assigned to a competition/
  );
});
