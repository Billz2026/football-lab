import test from 'node:test';
import assert from 'node:assert/strict';
import {
  SOUTHERN_COMBINATION_PREMIER_ID,
  STEP_FIVE_DIVISION_IDS
} from '../national-league-step-five-world-v1.js';
import {
  RESOLVED_STEP_FIVE_2026_27_MEMBERSHIPS,
  RESOLVED_STEP_FIVE_2026_27_TOTAL_CLUBS
} from '../national-league-step-five-membership-resolved-v1.js';
import {
  STEP_FOUR_DIVISION_IDS,
  STEP_FOUR_2026_27_MEMBERSHIPS
} from '../national-league-step-four-world-v1.js';

test('resolved 2026/27 Southern Combination keeps Guernsey after Peacehaven promotion', () => {
  const clubs = RESOLVED_STEP_FIVE_2026_27_MEMBERSHIPS[SOUTHERN_COMBINATION_PREMIER_ID];
  const names = clubs.map(club => club.name);
  assert.equal(clubs.length, 20);
  assert.ok(names.includes('Guernsey'));
  assert.ok(!names.includes('Peacehaven & Telscombe'));
});

test('resolved Step 5 still contains 320 unique clubs and no Step 4 duplicate club names', () => {
  const stepFive = STEP_FIVE_DIVISION_IDS.flatMap(id => RESOLVED_STEP_FIVE_2026_27_MEMBERSHIPS[id]);
  const stepFour = STEP_FOUR_DIVISION_IDS.flatMap(id => STEP_FOUR_2026_27_MEMBERSHIPS[id]);
  assert.equal(RESOLVED_STEP_FIVE_2026_27_TOTAL_CLUBS, 320);
  assert.equal(stepFive.length, 320);
  assert.equal(new Set(stepFive.map(club => club.id)).size, 320);
  assert.equal(new Set(stepFive.map(club => club.name)).size, 320);
  const stepFourNames = new Set(stepFour.map(club => club.name));
  const duplicates = stepFive.filter(club => stepFourNames.has(club.name)).map(club => club.name);
  assert.deepEqual(duplicates, []);
});
