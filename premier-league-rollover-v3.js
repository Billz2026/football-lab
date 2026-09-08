import * as base from './premier-league-rollover-v2.js';

export * from './premier-league-rollover-v2.js';

function currentRollover(career) {
  const latest = (career?.seasonRollovers || []).at(-1) || null;
  if (!latest || career?.season !== latest.toSeason) return null;
  if (career?.seasonOutcome || Number(career?.roundIndex || 0) > 0) return null;
  return latest;
}

export function rolloverPremierLeagueSeason(career, options = {}) {
  const existing = currentRollover(career);
  if (existing) {
    return {
      status: 'already-rolled-over',
      career,
      rollover: JSON.parse(JSON.stringify(existing))
    };
  }
  return base.rolloverPremierLeagueSeason(career, options);
}
