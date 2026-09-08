import { simulateChampionshipSeason } from './championship-world-v1.js';

export const LEAGUE_ONE_WORLD_VERSION = 1;
export const LEAGUE_ONE_ID = 'eng-league-one';

export const LEAGUE_ONE_RULES = Object.freeze({
  id: LEAGUE_ONE_ID,
  name: 'League One',
  clubCount: 24,
  automaticPromotionPlaces: 2,
  playoffPlaces: Object.freeze([3, 4, 5, 6]),
  relegationPlaces: 4
});

// Verified against the EFL's published 2026/27 League One fixture membership.
// Strength is an internal background-world rating, not a public EFL metric.
export const LEAGUE_ONE_2026_27_CLUBS = Object.freeze([
  ['afc-wimbledon', 'AFC Wimbledon', 66],
  ['barnsley', 'Barnsley', 70],
  ['blackpool', 'Blackpool', 70],
  ['bradford-city', 'Bradford City', 69],
  ['bromley', 'Bromley', 64],
  ['burton-albion', 'Burton Albion', 65],
  ['cambridge-united', 'Cambridge United', 64],
  ['doncaster-rovers', 'Doncaster Rovers', 66],
  ['huddersfield-town', 'Huddersfield Town', 74],
  ['leicester-city', 'Leicester City', 81],
  ['leyton-orient', 'Leyton Orient', 68],
  ['luton-town', 'Luton Town', 76],
  ['mansfield-town', 'Mansfield Town', 67],
  ['mk-dons', 'MK Dons', 68],
  ['notts-county', 'Notts County', 68],
  ['oxford-united', 'Oxford United', 73],
  ['peterborough-united', 'Peterborough United', 70],
  ['plymouth-argyle', 'Plymouth Argyle', 69],
  ['reading', 'Reading', 69],
  ['sheffield-wednesday', 'Sheffield Wednesday', 75],
  ['stevenage', 'Stevenage', 67],
  ['stockport-county', 'Stockport County', 73],
  ['wigan-athletic', 'Wigan Athletic', 69],
  ['wycombe-wanderers', 'Wycombe Wanderers', 71]
].map(([slug, name, strength]) => Object.freeze({
  id: `eng-league-one-${slug}`,
  slug,
  name,
  strength
})));

function validateMembership(clubs) {
  if (!Array.isArray(clubs) || clubs.length !== LEAGUE_ONE_RULES.clubCount) {
    throw new Error(`League One background simulation requires exactly ${LEAGUE_ONE_RULES.clubCount} clubs.`);
  }
  const ids = clubs.map(club => club?.id).filter(Boolean);
  if (new Set(ids).size !== LEAGUE_ONE_RULES.clubCount) throw new Error('League One club ids must be unique.');
  if (clubs.some(club => !Number.isFinite(Number(club.strength)))) throw new Error('Every League One club requires a numeric background strength.');
}

export function simulateLeagueOneSeason({
  seed = 'football-lab-league-one',
  season = '2026/27',
  clubs = LEAGUE_ONE_2026_27_CLUBS,
  completedAt = null
} = {}) {
  validateMembership(clubs);

  // Championship and League One share the same 24-club, 46-match regular-season
  // topology and 3rd-v-6th / 4th-v-5th promotion play-off shape. Reuse that proven
  // deterministic engine, then apply League One's own identity and four relegation spots.
  const base = simulateChampionshipSeason({
    seed: `${seed}:${LEAGUE_ONE_ID}`,
    season,
    clubs,
    completedAt
  });

  const relegatedClubIds = base.status === 'complete'
    ? base.finalTable.slice(-LEAGUE_ONE_RULES.relegationPlaces).map(row => row.clubId)
    : [];

  return {
    ...base,
    schemaVersion: LEAGUE_ONE_WORLD_VERSION,
    key: `${LEAGUE_ONE_ID}:${season}`,
    competitionId: LEAGUE_ONE_ID,
    competitionName: LEAGUE_ONE_RULES.name,
    membershipSource: season === '2026/27'
      ? '2026/27 verified EFL League One membership'
      : 'derived English pyramid membership',
    clubs: clubs.map(({ id, name, slug, strength }) => ({ id, name, slug, strength })),
    relegatedClubIds
  };
}
