import {
  SOUTHERN_COMBINATION_PREMIER_ID,
  STEP_FIVE_2026_27_MEMBERSHIPS
} from './national-league-step-five-world-v1.js';

// The FA's initial 14 May 2026 allocation listed this slot as
// “Guernsey OR Peacehaven & Telscombe” because the SCFL play-off final
// had not yet been played. Peacehaven won that final and moved to Step 4,
// leaving Guernsey in the 2026/27 Southern Combination Premier Division.
const southernCombination = Object.freeze(
  STEP_FIVE_2026_27_MEMBERSHIPS[SOUTHERN_COMBINATION_PREMIER_ID].map(club => {
    if (club.name !== 'Peacehaven & Telscombe') return club;
    return Object.freeze({
      ...club,
      id: `${SOUTHERN_COMBINATION_PREMIER_ID}-guernsey`,
      slug: 'guernsey',
      name: 'Guernsey',
      strength: 44,
      geoNorthing: 20,
      geoEasting: 74
    });
  })
);

export const RESOLVED_STEP_FIVE_2026_27_MEMBERSHIPS = Object.freeze({
  ...STEP_FIVE_2026_27_MEMBERSHIPS,
  [SOUTHERN_COMBINATION_PREMIER_ID]: southernCombination
});

export const RESOLVED_STEP_FIVE_2026_27_TOTAL_CLUBS = Object.values(
  RESOLVED_STEP_FIVE_2026_27_MEMBERSHIPS
).reduce((sum, clubs) => sum + clubs.length, 0);

if (!southernCombination.some(club => club.name === 'Guernsey')) {
  throw new Error('Resolved 2026/27 Southern Combination membership must contain Guernsey.');
}
if (southernCombination.some(club => club.name === 'Peacehaven & Telscombe')) {
  throw new Error('Peacehaven & Telscombe were promoted to Step 4 and must not remain in Step 5.');
}
