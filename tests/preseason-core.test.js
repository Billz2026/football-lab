import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCareer } from '../manager-core.js';
import {
  beginCompetitiveSeason,
  buildPreseasonFriendlyCareer,
  completePreseasonFriendly,
  ensurePreseason,
  getNextPreseasonFixture,
  getPreseasonReadiness,
  setPreseasonTrainingFocus
} from '../preseason-v047.js';
import { advanceInteractiveMatch, completeInteractiveRound, createInteractiveMatch } from '../matchday-engine-v0431.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const data = name => JSON.parse(fs.readFileSync(path.join(here, '..', 'data', 'current', `${name}.json`), 'utf8'));
const db = { metadata: data('metadata'), clubs: data('clubs'), players: data('players'), leagues: data('leagues'), managers: data('managers') };
const playable = db.clubs.filter(club => db.metadata.playableDemo.clubIds.includes(club.id) && !club.isPlaceholder);

function career() {
  return createCareer({ clubId: playable[0].id, clubs: playable, players: db.players, seed: 'preseason-test' });
}

function quickFriendly(c, fixture) {
  const pseudo = buildPreseasonFriendlyCareer(c, fixture);
  let state = createInteractiveMatch(pseudo, db);
  while (state.minute < 90) state = advanceInteractiveMatch(state, pseudo, db).state;
  return completeInteractiveRound(pseudo, state, db);
}

test('new careers receive five deterministic friendlies before Round 1', () => {
  const c = career();
  assert.equal(ensurePreseason(c, db), true);
  assert.equal(c.preseason.phase, 'active');
  assert.equal(c.preseason.fixtures.length, 5);
  assert.equal(c.roundIndex, 0);
  assert.equal(c.table.every(row => row.played === 0), true);
  assert.ok(getNextPreseasonFixture(c));
  assert.equal(getPreseasonReadiness(c, db).friendliesPlayed, 0);
});

test('training focus changes the readiness trade-off and friendlies do not alter league table', () => {
  const c = career();
  ensurePreseason(c, db);
  const before = getPreseasonReadiness(c, db);
  assert.equal(setPreseasonTrainingFocus(c, 'Tactical'), true);
  const fixture = getNextPreseasonFixture(c);
  const completed = quickFriendly(c, fixture);
  completePreseasonFriendly(c, completed, db);
  const after = getPreseasonReadiness(c, db);
  assert.equal(c.preseason.fixtures[0].played, true);
  assert.equal(c.table.every(row => row.played === 0), true);
  assert.ok(after.familiarity >= before.familiarity + 12);
  assert.ok(after.friendliesPlayed === 1);
});

test('competitive season stays locked until every friendly is complete', () => {
  const c = career();
  ensurePreseason(c, db);
  assert.throws(() => beginCompetitiveSeason(c), /Complete every pre-season friendly/);
  while (getNextPreseasonFixture(c)) {
    const fixture = getNextPreseasonFixture(c);
    completePreseasonFriendly(c, quickFriendly(c, fixture), db);
  }
  assert.equal(c.preseason.phase, 'ready');
  assert.equal(beginCompetitiveSeason(c), true);
  assert.equal(c.preseason.phase, 'complete');
  assert.equal(c.roundIndex, 0);
});

test('existing careers already underway are not forced backwards into pre-season', () => {
  const c = career();
  c.roundIndex = 1;
  assert.equal(ensurePreseason(c, db), true);
  assert.equal(c.preseason.phase, 'complete');
  assert.equal(c.preseason.legacyBypass, true);
  assert.deepEqual(c.preseason.fixtures, []);
});
