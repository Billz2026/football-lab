export const PRESEASON_SCHEMA_VERSION = 1;
export const PRESEASON_FRIENDLY_COUNT = 5;
export const PRESEASON_TRAINING_FOCI = {
  Balanced: { condition: 5, sharpness: 3, familiarity: 7, description: 'Steady work across fitness, sharpness and tactical understanding.' },
  Fitness: { condition: 8, sharpness: 2, familiarity: 3, description: 'Prioritise physical recovery and conditioning.' },
  'Match Sharpness': { condition: 4, sharpness: 6, familiarity: 4, description: 'Use match-intensity work to get players up to speed.' },
  Tactical: { condition: 3, sharpness: 2, familiarity: 12, description: 'Prioritise shape, roles and tactical familiarity.' }
};

const clone = value => JSON.parse(JSON.stringify(value));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function hashString(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function playableClubs(db) {
  const ids = new Set(db.metadata?.playableDemo?.clubIds || []);
  const selected = db.clubs.filter(club => ids.has(club.id) && !club.isPlaceholder);
  return selected.length ? selected : db.clubs.filter(club => !club.isPlaceholder).slice(0, 8);
}

function tableRow(clubId) {
  return { clubId, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 };
}

function buildFixtures(career, db) {
  const opponents = playableClubs(db).filter(club => club.id !== career.clubId);
  if (!opponents.length) return [];
  const start = hashString(`${career.seed}:${career.clubId}:preseason`) % opponents.length;
  const ordered = Array.from({ length: Math.min(PRESEASON_FRIENDLY_COUNT, Math.max(1, opponents.length)) }, (_, index) => opponents[(start + index) % opponents.length]);
  const dates = ['11 Jul 2026', '18 Jul 2026', '25 Jul 2026', '1 Aug 2026', '8 Aug 2026'];
  return ordered.map((opponent, index) => {
    const userHome = index % 2 === 0;
    return {
      id: `ps-${career.id}-${index + 1}`,
      round: index + 1,
      dateLabel: dates[index] || `Week ${index + 1}`,
      homeClubId: userHome ? career.clubId : opponent.id,
      awayClubId: userHome ? opponent.id : career.clubId,
      played: false,
      homeGoals: null,
      awayGoals: null,
      events: [],
      type: 'friendly'
    };
  });
}

function prepareUserSquad(career, db) {
  const squad = db.players.filter(player => player.clubId === career.clubId && !player.isPlaceholder);
  for (const player of squad) {
    const status = career.playerStatus[player.id];
    if (!status) continue;
    const roll = hashString(`${career.seed}:${player.id}:preseason-readiness`);
    status.condition = Math.min(status.condition ?? 100, 93 + (roll % 4));
    status.sharpness = Math.min(status.sharpness ?? 88, 59 + ((roll >>> 3) % 9));
    status.morale ||= 'Good';
  }
}

export function ensurePreseason(career, db) {
  if (!career || !db) return false;
  if (career.preseason?.schemaVersion === PRESEASON_SCHEMA_VERSION) return false;

  const oldCareerAlreadyUnderway = (career.roundIndex || 0) > 0 || Boolean(career.lastMatch);
  if (oldCareerAlreadyUnderway) {
    career.preseason = {
      schemaVersion: PRESEASON_SCHEMA_VERSION,
      phase: 'complete',
      fixtures: [],
      trainingFocus: 'Balanced',
      tacticalFamiliarity: 90,
      trainingSessions: 0,
      legacyBypass: true,
      completedAt: career.updatedAt || new Date().toISOString()
    };
    return true;
  }

  prepareUserSquad(career, db);
  career.preseason = {
    schemaVersion: PRESEASON_SCHEMA_VERSION,
    phase: 'active',
    fixtures: buildFixtures(career, db),
    trainingFocus: 'Balanced',
    tacticalFamiliarity: 42,
    trainingSessions: 0,
    trainingLog: [],
    startedAt: new Date().toISOString(),
    completedAt: null,
    legacyBypass: false
  };
  return true;
}

export function getNextPreseasonFixture(career) {
  if (!career?.preseason || career.preseason.phase === 'complete') return null;
  return career.preseason.fixtures.find(fixture => !fixture.played) || null;
}

export function setPreseasonTrainingFocus(career, focus) {
  if (!career?.preseason || !PRESEASON_TRAINING_FOCI[focus]) return false;
  if (career.preseason.trainingFocus === focus) return false;
  career.preseason.trainingFocus = focus;
  return true;
}

export function getPreseasonReadiness(career, db) {
  const squad = db.players.filter(player => player.clubId === career.clubId && !player.isPlaceholder);
  const statuses = squad.map(player => career.playerStatus?.[player.id]).filter(Boolean);
  const average = key => statuses.length ? Math.round(statuses.reduce((sum, status) => sum + (status[key] ?? 0), 0) / statuses.length) : 0;
  return {
    condition: average('condition'),
    sharpness: average('sharpness'),
    familiarity: Math.round(career.preseason?.tacticalFamiliarity ?? 90),
    friendliesPlayed: career.preseason?.fixtures?.filter(fixture => fixture.played).length || 0,
    totalFriendlies: career.preseason?.fixtures?.length || 0
  };
}

export function buildPreseasonFriendlyCareer(career, fixture) {
  const pseudo = clone(career);
  pseudo.competitionName = 'Pre-Season Friendly';
  pseudo.status = 'active';
  pseudo.roundIndex = 0;
  pseudo.fixtures = [[clone(fixture)]];
  pseudo.table = [tableRow(fixture.homeClubId), tableRow(fixture.awayClubId)];
  pseudo.lastMatch = null;
  pseudo.seed = `${career.seed}:preseason:${fixture.id}`;
  return pseudo;
}

function applyTraining(career, db, fixtureIndex) {
  const focusName = career.preseason.trainingFocus || 'Balanced';
  const focus = PRESEASON_TRAINING_FOCI[focusName] || PRESEASON_TRAINING_FOCI.Balanced;
  const squad = db.players.filter(player => player.clubId === career.clubId && !player.isPlaceholder);
  for (const player of squad) {
    const status = career.playerStatus[player.id];
    if (!status) continue;
    status.condition = Math.round(clamp((status.condition ?? 90) + focus.condition, 1, 100));
    status.sharpness = Math.round(clamp((status.sharpness ?? 60) + focus.sharpness, 1, 100));
  }
  career.preseason.tacticalFamiliarity = Math.round(clamp((career.preseason.tacticalFamiliarity ?? 42) + focus.familiarity, 1, 100));
  career.preseason.trainingSessions += 1;
  career.preseason.trainingLog ||= [];
  career.preseason.trainingLog.push({
    afterFriendly: fixtureIndex + 1,
    focus: focusName,
    conditionGain: focus.condition,
    sharpnessGain: focus.sharpness,
    familiarityGain: focus.familiarity
  });
}

export function completePreseasonFriendly(career, friendlyCareer, db) {
  if (!career?.preseason) throw new Error('Pre-season is not active.');
  const result = friendlyCareer?.lastMatch;
  if (!result?.played) throw new Error('The friendly has not been completed.');
  const index = career.preseason.fixtures.findIndex(fixture => fixture.id === result.id);
  if (index < 0) throw new Error('The completed friendly does not belong to this pre-season.');

  const fixture = career.preseason.fixtures[index];
  Object.assign(fixture, clone(result), { type: 'friendly', dateLabel: fixture.dateLabel, round: fixture.round });

  const userSquad = new Set(db.players.filter(player => player.clubId === career.clubId && !player.isPlaceholder).map(player => player.id));
  for (const [playerId, status] of Object.entries(friendlyCareer.playerStatus || {})) {
    if (userSquad.has(playerId)) career.playerStatus[playerId] = clone(status);
  }
  career.tactics = clone(friendlyCareer.tactics || career.tactics);
  if (friendlyCareer.tacticalSetup) career.tacticalSetup = clone(friendlyCareer.tacticalSetup);
  career.preseason.lastMatch = clone(result);

  applyTraining(career, db, index);
  if (career.preseason.fixtures.every(item => item.played)) career.preseason.phase = 'ready';
  career.updatedAt = new Date().toISOString();
  return career;
}

export function beginCompetitiveSeason(career) {
  if (!career?.preseason) throw new Error('Pre-season has not been initialised.');
  if (career.preseason.phase !== 'ready' && career.preseason.phase !== 'complete') throw new Error('Complete every pre-season friendly before starting the competitive season.');
  if (career.preseason.phase === 'complete') return false;
  career.preseason.phase = 'complete';
  career.preseason.completedAt = new Date().toISOString();
  career.updatedAt = career.preseason.completedAt;
  return true;
}
