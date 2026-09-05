import test from 'node:test';
import assert from 'node:assert/strict';
import {
  XG_MODEL,
  advanceInteractiveMatch,
  completeInteractiveRound,
  createInteractiveMatch
} from '../matchday-engine-v0431.js';

const groups = ['GK','DEF','DEF','DEF','DEF','MID','MID','MID','ATT','ATT','ATT','MID','ATT','DEF','MID','ATT','DEF','MID'];
const positions = ['GK','DR','DC','DC','DL','MC','MC','AMC','AMR','ST','AML','DMC','ST','DC','MC','ST','DR','ML'];
const clubs = Array.from({ length: 4 }, (_, index) => ({
  id: `xg-club-${index + 1}`,
  name: `xG Club ${index + 1}`,
  reputation: 7600 + index * 80,
  isPlaceholder: false
}));
const players = clubs.flatMap((club, clubIndex) => groups.map((group, playerIndex) => ({
  id: `${club.id}-player-${playerIndex + 1}`,
  clubId: club.id,
  name: `${club.name} Player ${playerIndex + 1}`,
  positionGroup: group,
  primaryPosition: positions[playerIndex],
  currentAbility: 135 + clubIndex * 2 + playerIndex,
  isPlaceholder: false
})));
const db = { clubs, players };

function fixtures() {
  return [[
    { id:'xg-r1-m1', round:1, homeClubId:clubs[0].id, awayClubId:clubs[1].id, played:false, homeGoals:null, awayGoals:null, events:[] },
    { id:'xg-r1-m2', round:1, homeClubId:clubs[2].id, awayClubId:clubs[3].id, played:false, homeGoals:null, awayGoals:null, events:[] }
  ]];
}

function career() {
  const own = players.filter(player => player.clubId === clubs[0].id);
  return {
    version:2,
    id:'xg-career',
    clubId:clubs[0].id,
    seed:'xg-regression-seed',
    status:'active',
    roundIndex:0,
    fixtures:fixtures(),
    table:clubs.map(club => ({ clubId:club.id, played:0, won:0, drawn:0, lost:0, goalsFor:0, goalsAgainst:0, goalDifference:0, points:0 })),
    lineupIds:own.slice(0,11).map(player => player.id),
    tactics:{ formation:'4-3-3', mentality:'Balanced', pressing:'Standard' },
    playerStatus:Object.fromEntries(own.map(player => [player.id, { condition:100, sharpness:88, morale:'Good', appearances:0, goals:0 }]))
  };
}

test('new live matches initialise persistent xG counters', () => {
  const state = createInteractiveMatch(career(), db);
  assert.equal(state.stats.home.xG, 0);
  assert.equal(state.stats.away.xG, 0);
  assert.equal(state.stats.home.bigChances, 0);
  assert.equal(state.xgModel.method, 'shot-derived-contextual');
  assert.equal(XG_MODEL.spatial, false);
});

test('xG only rises when the underlying engine records actual shots', () => {
  const c = career();
  let state = createInteractiveMatch(c, db);
  for (let i = 0; i < 90; i += 1) {
    const beforeShots = state.stats.home.shots + state.stats.away.shots;
    const beforeXg = state.stats.home.xG + state.stats.away.xG;
    state = advanceInteractiveMatch(state, c, db).state;
    const afterShots = state.stats.home.shots + state.stats.away.shots;
    const afterXg = state.stats.home.xG + state.stats.away.xG;
    if (afterShots === beforeShots) assert.equal(afterXg, beforeXg, `xG changed without a shot at minute ${state.minute}`);
    if (afterShots > beforeShots) assert.ok(afterXg > beforeXg, `shot did not add xG at minute ${state.minute}`);
  }
  assert.equal(state.stats.home.xgShots, state.stats.home.shots);
  assert.equal(state.stats.away.xgShots, state.stats.away.shots);
  assert.ok(state.stats.home.xG >= 0 && state.stats.away.xG >= 0);
});

test('full-time match stats persist xG into career results', () => {
  const c = career();
  let state = createInteractiveMatch(c, db);
  while (state.minute < 90) state = advanceInteractiveMatch(state, c, db).state;
  const finished = completeInteractiveRound(c, state, db);
  assert.ok(Number.isFinite(finished.lastMatch.matchStats.home.xG));
  assert.ok(Number.isFinite(finished.lastMatch.matchStats.away.xG));
  assert.equal(finished.lastMatch.matchStats.home.xgShots, finished.lastMatch.matchStats.home.shots);
  assert.equal(finished.lastMatch.matchStats.away.xgShots, finished.lastMatch.matchStats.away.shots);
});
