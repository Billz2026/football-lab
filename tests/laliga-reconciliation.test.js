import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assertPromotionReady,
  normalizeAge,
  normalizeShirtNumber,
  reconcileSpainStage
} from '../scripts/reconcile-api-football-spain-stage.mjs';

const club = { canonicalName: 'FC Barcelona', apiFootballId: 529 };
const squad = players => ({
  leagueId: 'esp-la-liga',
  clubName: 'FC Barcelona',
  apiFootballTeamId: 529,
  providerTeamName: 'Barcelona',
  players
});
const player = (id, name, number, age = 25, position = 'Midfielder') => ({
  apiFootballId: id,
  name,
  shirtNumber: number,
  age,
  position
});
const authority = (players, extras = {}) => ({
  snapshotSeason: '2026/27',
  source: { authority: 'LALIGA', url: 'https://www.laliga.com/' },
  clubs: [{
    clubName: 'FC Barcelona',
    sourceUrl: 'https://www.laliga.com/en-GB/clubs/fc-barcelona/stats',
    players,
    ...extras
  }]
});

function reconcileWithTinyAuthority(options) {
  return reconcileSpainStage({ minimumAuthorityPlayers: 1, ...options });
}

test('normalises invalid ages and shirt numbers without inventing replacements', () => {
  assert.equal(normalizeAge(0), null);
  assert.equal(normalizeAge(46), null);
  assert.equal(normalizeAge(24), 24);
  assert.equal(normalizeShirtNumber(null), null);
  assert.equal(normalizeShirtNumber(0), null);
  assert.equal(normalizeShirtNumber(100), null);
  assert.equal(normalizeShirtNumber(25), 25);
});

test('provider-only fallback is candidate data and can never be promotion-ready', () => {
  const result = reconcileSpainStage({
    clubs: [club],
    squads: [squad([
      player(1, 'Senior One', 8),
      player(2, 'Reserve One', 31, 19),
      player(3, 'Bad Age', 10, 0)
    ])]
  });

  assert.deepEqual(result.reconciledSquads[0].players.map(item => item.apiFootballId), [1, 3]);
  assert.equal(result.reconciledSquads[0].players[1].age, null);
  assert.equal(result.quarantine.length, 1);
  assert.equal(result.quarantine[0].reason, 'outside-first-team-number-range');
  assert.equal(result.report.promotion.ready, false);
  assert.equal(result.report.promotion.blockingIssues[0].type, 'authoritative-first-team-membership-not-provided');
  assert.throws(() => assertPromotionReady(result.report), /promotion blocked/i);
});

test('authoritative membership selects identities, overwrites stale provider shirt numbers, and quarantines contamination', () => {
  const result = reconcileWithTinyAuthority({
    clubs: [club],
    squads: [squad([
      player(1, 'Senior One', 8),
      player(2, 'Reserve One', 9, 19),
      player(3, 'Senior Three', 10, 21)
    ])],
    authority: authority([
      { apiFootballId: 1, name: 'Senior One', shirtNumber: 4 },
      { apiFootballId: 3, name: 'Senior Three', shirtNumber: 18 }
    ])
  });

  assert.deepEqual(result.reconciledSquads[0].players.map(item => item.apiFootballId), [1, 3]);
  assert.deepEqual(result.reconciledSquads[0].players.map(item => item.shirtNumber), [4, 18]);
  assert.equal(result.quarantine.length, 1);
  assert.equal(result.quarantine[0].reason, 'not-in-authoritative-first-team-snapshot');
  assert.equal(result.report.promotion.ready, true);
  assert.doesNotThrow(() => assertPromotionReady(result.report));
});

test('partial authority never silently falls back for a missing club', () => {
  const realMadridSquad = { ...squad([player(9, 'Madrid Player', 9)]), clubName: 'Real Madrid', apiFootballTeamId: 541 };
  const result = reconcileWithTinyAuthority({
    clubs: [club, { canonicalName: 'Real Madrid', apiFootballId: 541 }],
    squads: [squad([player(1, 'Senior One', 8)]), realMadridSquad],
    authority: authority([{ apiFootballId: 1, name: 'Senior One', shirtNumber: 8 }])
  });

  assert.equal(result.reconciledSquads[1].players.length, 0);
  assert.equal(result.reconciledSquads[1].reconciliation.mode, 'authority-missing-blocked');
  assert.equal(result.report.promotion.blockingIssues.some(issue => issue.type === 'club-authority-missing'), true);
  assert.equal(result.quarantine.some(row => row.clubName === 'Real Madrid' && row.reason === 'club-missing-authoritative-first-team-snapshot'), true);
});

test('authoritative invalid or duplicate first-team shirt numbers block promotion instead of guessing', () => {
  const result = reconcileWithTinyAuthority({
    clubs: [club],
    squads: [squad([player(1, 'Player A', 11), player(2, 'Player B', 12), player(3, 'Player C', 13)])],
    authority: authority([
      { apiFootballId: 1, name: 'Player A', shirtNumber: 11 },
      { apiFootballId: 2, name: 'Player B', shirtNumber: 11 },
      { apiFootballId: 3, name: 'Player C', shirtNumber: 31 }
    ])
  });

  assert.equal(result.report.promotion.ready, false);
  assert.equal(result.report.promotion.blockingIssues.some(issue => issue.type === 'duplicate-first-team-shirt-number'), true);
  assert.equal(result.report.promotion.blockingIssues.some(issue => issue.type === 'authoritative-first-team-shirt-number-invalid'), true);
});

test('authoritative squad size defaults to a 15-25 safety gate', () => {
  const result = reconcileSpainStage({
    clubs: [club],
    squads: [squad([player(1, 'Only Player', 1)])],
    authority: authority([{ apiFootballId: 1, name: 'Only Player', shirtNumber: 1 }])
  });
  assert.equal(result.report.promotion.blockingIssues.some(issue => issue.type === 'authority-squad-size-out-of-range'), true);
});

test('cross-league provider identity becomes an authoritative ownership move, never a duplicate create', () => {
  const currentPlayers = [{
    id: 'flm-player-api-football-643',
    externalIds: { apiFootball: 643 },
    name: 'Gabriel Jesus',
    clubId: 'flm-club-api-football-42'
  }];
  const currentClubs = [{ id: 'flm-club-api-football-42', name: 'Arsenal' }];
  const result = reconcileWithTinyAuthority({
    clubs: [club],
    squads: [squad([player(643, 'Gabriel Jesus', 9, 28, 'Attacker')])],
    currentPlayers,
    currentClubs,
    authority: authority([{ apiFootballId: 643, name: 'Gabriel Jesus', shirtNumber: 9 }])
  });

  assert.equal(result.ownershipMoves.length, 1);
  assert.equal(result.candidateCrossLeagueConflicts.length, 0);
  assert.deepEqual(result.ownershipMoves[0], {
    apiFootballId: 643,
    playerId: 'flm-player-api-football-643',
    name: 'Gabriel Jesus',
    fromClubId: 'flm-club-api-football-42',
    fromClubName: 'Arsenal',
    toClubId: 'flm-club-api-football-529',
    toClubName: 'FC Barcelona',
    action: 'move-existing-identity',
    duplicateCreateAllowed: false
  });
});

test('provider-only cross-league overlap is flagged as candidate, never as an actionable move', () => {
  const result = reconcileSpainStage({
    clubs: [club],
    squads: [squad([player(643, 'Gabriel Jesus', 9)])],
    currentPlayers: [{ id: 'flm-player-api-football-643', externalIds: { apiFootball: 643 }, clubId: 'flm-club-api-football-42' }]
  });
  assert.equal(result.ownershipMoves.length, 0);
  assert.equal(result.candidateCrossLeagueConflicts.length, 1);
  assert.equal(result.candidateCrossLeagueConflicts[0].action, 'candidate-ownership-conflict');
});

test('same API-Football identity selected by two Spanish clubs is a hard blocker', () => {
  const realMadridClub = { canonicalName: 'Real Madrid', apiFootballId: 541 };
  const realMadridSquad = { ...squad([player(9, 'Shared', 9)]), clubName: 'Real Madrid', apiFootballTeamId: 541 };
  const fullAuthority = {
    snapshotSeason: '2026/27',
    source: { authority: 'LALIGA' },
    clubs: [
      { clubName: 'FC Barcelona', players: [{ apiFootballId: 9, name: 'Shared', shirtNumber: 9 }] },
      { clubName: 'Real Madrid', players: [{ apiFootballId: 9, name: 'Shared', shirtNumber: 9 }] }
    ]
  };
  const result = reconcileSpainStage({
    clubs: [club, realMadridClub],
    squads: [squad([player(9, 'Shared', 9)]), realMadridSquad],
    authority: fullAuthority,
    minimumAuthorityPlayers: 1
  });

  assert.equal(result.report.promotion.ready, false);
  assert.equal(result.report.promotion.blockingIssues.some(issue => issue.type === 'cross-spain-player-identity-conflict'), true);
});
