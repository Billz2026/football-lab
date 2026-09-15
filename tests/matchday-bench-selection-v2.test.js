import test from 'node:test';
import assert from 'node:assert/strict';
import { createInteractiveMatch } from '../matchday-engine-v069.js';

const positions = ['GK','DR','DC','DC','DL','MC','MC','AMC','AMR','ST','AML','DMC','ST','DC','MC','ST','DR','ML','MR','DC','GK','ST','MC','DL'];
const groups = ['GK','DEF','DEF','DEF','DEF','MID','MID','MID','ATT','ATT','ATT','MID','ATT','DEF','MID','ATT','DEF','MID','MID','DEF','GK','ATT','MID','DEF'];
const clubs = [
  { id: 'home', name: 'Home FC', reputation: 7000 },
  { id: 'away', name: 'Away FC', reputation: 7000 }
];
const players = clubs.flatMap((club, clubIndex) => positions.map((primaryPosition, index) => ({
  id: `${club.id}-${index}`,
  clubId: club.id,
  name: `${club.name} ${index}`,
  primaryPosition,
  positionGroup: groups[index],
  currentAbility: 140 - index + clubIndex,
  isPlaceholder: false
})));
const db = { clubs, players };

function career() {
  const user = players.filter(player => player.clubId === 'home');
  return {
    id: 'career-selected-bench',
    version: 1,
    clubId: 'home',
    seed: 'selected-bench-seed',
    status: 'active',
    roundIndex: 0,
    competitionName: 'Premier League',
    fixtures: [[{
      id: 'fixture-league',
      round: 1,
      type: 'league',
      competitionName: 'Premier League',
      homeClubId: 'home',
      awayClubId: 'away',
      played: false,
      events: []
    }]],
    table: clubs.map(club => ({
      clubId: club.id,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0
    })),
    lineupIds: user.slice(0, 11).map(player => player.id),
    tactics: { formation: '4-3-3', mentality: 'Balanced', pressing: 'Standard' },
    playerStatus: Object.fromEntries(user.map(player => [player.id, { condition: 90, sharpness: 80, morale: 'Good' }]))
  };
}

test('Premier League live match uses the manager-selected nine-player bench in the same order', () => {
  const c = career();
  c.benchIds = ['home-20', 'home-19', 'home-18', 'home-17', 'home-16', 'home-15', 'home-14', 'home-13', 'home-12'];

  const state = createInteractiveMatch(c, db);

  assert.deepEqual(state.userBenchIds, c.benchIds);
  assert.equal(state.userBenchIds.length, 9);
  for (const id of c.benchIds) {
    assert.equal(state.conditions[id], 90);
    assert.equal(state.ratings[id], 6.5);
    assert.equal(state.minutesPlayed[id], 0);
  }
});

test('legacy Premier League save without benchIds still receives the automatic nine-player fallback bench', () => {
  const c = career();
  const state = createInteractiveMatch(c, db);

  assert.equal(state.userBenchIds.length, 9);
  assert.equal(new Set(state.userBenchIds).size, 9);
  assert.equal(state.userBenchIds.some(id => c.lineupIds.includes(id)), false);
});
