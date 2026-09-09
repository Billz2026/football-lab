import * as base from './premier-league-rollover-v2.js';
import {
  canRolloverCareer,
  ensureCareerLifecycleState,
  finaliseCareerIfLimitReached
} from './career-lifecycle-v1.js';

export * from './premier-league-rollover-v2.js';

function currentRollover(career) {
  const latest = (career?.seasonRollovers || []).at(-1) || null;
  if (!latest || career?.season !== latest.toSeason) return null;
  if (career?.seasonOutcome || Number(career?.roundIndex || 0) > 0) return null;
  return latest;
}

function careerLimitValidation(career) {
  ensureCareerLifecycleState(career);
  if (career?.status === 'complete' && career?.seasonOutcome) finaliseCareerIfLimitReached(career);
  return canRolloverCareer(career);
}

export function validatePremierLeagueRollover(career, db) {
  const lifecycle = careerLimitValidation(career);
  if (!lifecycle.ok) return lifecycle;
  return base.validatePremierLeagueRollover(career, db);
}

export function rolloverPremierLeagueSeason(career, options = {}) {
  const lifecycle = careerLimitValidation(career);
  if (!lifecycle.ok) return { status: lifecycle.status, reason: lifecycle.reason, career };

  const existing = currentRollover(career);
  if (existing) {
    return {
      status: 'already-rolled-over',
      career,
      rollover: JSON.parse(JSON.stringify(existing))
    };
  }
  const result = base.rolloverPremierLeagueSeason(career, options);
  if (result?.career) ensureCareerLifecycleState(result.career);
  return result;
}
