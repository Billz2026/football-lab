import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_SUBSTITUTIONS,
  PLAYER_DUTIES,
  advanceInteractiveMatch,
  changeTactics,
  completeInteractiveRound,
  createInteractiveMatch,
  makeSubstitution,
  setPlayerDuty
} from '../matchday-engine-v042.js';

const groups = ['GK', 'DEF', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'ATT', 'ATT', 'ATT', 'MID', 'ATT', 'DEF', 'MID', 'ATT', 'DEF', 'MID'];
const clubs = Array.from({ length: 8 }, (_, index) => ({ id: `club-${index + 1}`, name: `Club ${index + 1}`, reputation: 7000 + index * 60, isPlaceholder: false }));
const players = clubs.flatMap((club, clubIndex) => groups.map((group, playerIndex) => ({
  id: `${club.id}-player-${playerIndex + 1}`,
  clubId: club.id,
  name: `${club.name} Player ${playerIndex + 1}`,
  positionGroup: group,
  primaryPosition: group === 'GK' ? 'GK' : group === 'DEF' ? 'DC' : group === 'MID' ? 'MC' : 'ST',
  currentAbility: 110 + clubIndex * 2 + playerIndex,
  isPlaceholder: false
})));

function fixtures() {
  const ids = clubs.map(club => club.id);
  let rotation = [...ids];
  const rounds = [];
  for (let roundIndex = 0; roundIndex < ids.length - 1; roundIndex += 1) {
    const round = [];
    for (let pairIndex = 0; pairIndex < rotation.length / 2; pairIndex += 1) {
      const first = rotation[pairIndex];
      const second = rotation[rotation.length - 1 - pairIndex];
      round.push({ id: `r${roundIndex + 1}-m${pairIndex + 1}`, round: roundIndex + 1, homeClubId: first, awayClubId: second, played: false, homeGoals: null, awayGoals: null, events: [] });
    }
    rounds.push(round);
    rotation = [rotation[0], rotation.at(-1), ...rotation.slice(1, -1)];
  }
  return rounds;
}

function career() {
  const userPlayers = players.filter(player => player.clubId === clubs[0].id);
  return {
    version: 1,
    clubId: clubs[0].id,
    seed: 'interactive-match-test',
    status: 'active',
    roundIndex: 0,
    fixtures: fixtures(),
    table: clubs.map(club => ({ clubId: club.id, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 })),
    lineupIds: userPlayers.slice(0, 11).map(player => player.id),
    tactics: { formation: '4-3-3', mentality: 'Balanced', pressing: 'Standard' },
    playerStatus: Object.fromEntries(userPlayers.map(player => [player.id, { condition: 100, sharpness: 88, morale: 'Good', appearances: 0, goals: 0 }]))
  };
}

const db = { clubs, players };

test('live engine supports tactical changes, duties and a substitution before finalising the round', () => {
  const original = career();
  let state = createInteractiveMatch(original, db);
  for (let minute = 0; minute < 30; minute += 1) state = advanceInteractiveMatch(state, original, db).state;

  const lineup = state.userClubId === state.homeClubId ? state.homeLineupIds : state.awayLineupIds;
  state = changeTactics(state, { formation: '5-3-2', mentality: 'Defensive', tempo: 'Slow', defensiveLine: 'Low' }).state;
  assert.equal(state.tactics.formation, '5-3-2');
  assert.equal(state.tactics.mentality, 'Defensive');

  const dutyPlayer = lineup.find(id => players.find(player => player.id === id)?.positionGroup === 'MID');
  state = setPlayerDuty(state, dutyPlayer, 'Attack', db).state;
  assert.equal(state.playerDuties[dutyPlayer], 'Attack');
  assert.deepEqual(PLAYER_DUTIES, ['Defend', 'Support', 'Attack']);

  state = makeSubstitution(state, lineup.at(-1), state.userBenchIds[0], db).state;
  assert.equal(state.substitutions.length, 1);
  assert.equal(MAX_SUBSTITUTIONS, 5);

  while (state.minute < 90) state = advanceInteractiveMatch(state, original, db).state;
  const finished = completeInteractiveRound(original, state, db);
  assert.equal(finished.roundIndex, 1);
  assert.ok(finished.table.every(row => row.played === 1));
  assert.equal(finished.lastMatch.substitutions.length, 1);
  assert.equal(finished.lastMatch.tacticsAtFullTime.formation, '5-3-2');
  assert.equal(finished.lastMatch.playerDuties[dutyPlayer], 'Attack');
  assert.ok(finished.lastMatch.commentaryHistory.length >= 30);
  assert.ok(finished.lastMatch.events.length < finished.lastMatch.commentaryHistory.length);
  assert.ok(finished.lastMatch.commentaryHistory.some(event => event.type === 'situation'));
});

test('future minutes change when the manager changes tactical approach', () => {
  const original = career();
  let balanced = createInteractiveMatch(original, db);
  let attacking = createInteractiveMatch(original, db);
  for (let minute = 0; minute < 55; minute += 1) {
    balanced = advanceInteractiveMatch(balanced, original, db).state;
    attacking = advanceInteractiveMatch(attacking, original, db).state;
  }
  attacking = changeTactics(attacking, { formation: '3-4-3', mentality: 'Attacking', pressing: 'High', tempo: 'High', passing: 'Direct', width: 'Wide', defensiveLine: 'High' }).state;
  while (balanced.minute < 90) balanced = advanceInteractiveMatch(balanced, original, db).state;
  while (attacking.minute < 90) attacking = advanceInteractiveMatch(attacking, original, db).state;
  assert.notDeepEqual(
    { score: [balanced.homeGoals, balanced.awayGoals], shots: [balanced.stats.home.shots, balanced.stats.away.shots], events: balanced.events.map(event => event.text) },
    { score: [attacking.homeGoals, attacking.awayGoals], shots: [attacking.stats.home.shots, attacking.stats.away.shots], events: attacking.events.map(event => event.text) }
  );
});
