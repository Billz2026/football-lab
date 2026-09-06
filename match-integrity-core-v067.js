export const COMPETITIVE_SUBSTITUTION_LIMIT = 5;
export const FRIENDLY_SUBSTITUTION_LIMIT = 9;

export function isFriendlyFixture(fixture = {}) {
  const text = `${fixture.type || ''} ${fixture.competitionName || ''} ${fixture.name || ''}`.toLowerCase();
  return /friendly|pre[- ]?season/.test(text);
}

export function substitutionLimitForFixture(fixture = {}) {
  return isFriendlyFixture(fixture) ? FRIENDLY_SUBSTITUTION_LIMIT : COMPETITIVE_SUBSTITUTION_LIMIT;
}

export function scaledConditionAfterMinute(before, engineAfter, fixture = {}) {
  const start = Number(before);
  const after = Number(engineAfter);
  if (!Number.isFinite(start) || !Number.isFinite(after)) return engineAfter;
  const friendly = isFriendlyFixture(fixture);
  // Legacy engine clamps at 48. If a player has already reached that level,
  // continue natural fatigue rather than pinning or artificially restoring him.
  if (start <= 48.08 && after >= start) return Math.max(20, start - (friendly ? 0.045 : 0.075));
  const loss = Math.max(0, start - after);
  if (!friendly || loss <= 0) return after;
  return Math.max(20, start - loss * 0.65);
}
