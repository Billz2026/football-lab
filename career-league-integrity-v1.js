import { CAREER_VERSION, createFixtures } from './manager-core.js?v=0.3.0';

const SAVE_KEY = 'flm-career-save';
const TARGET_CLUB_COUNT = 20;
const TARGET_ROUND_COUNT = 38;
const TARGET_LEAGUE_ID = 'eng-premier-league';
const TARGET_COMPETITION_NAME = 'Football Lab Premier League';

function readSavedCareer() {
  try {
    return JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
  } catch {
    return null;
  }
}

function hasPlayedFixture(career) {
  return (career?.fixtures || []).flat().some(fixture => fixture?.played);
}

function isUntouchedCareer(career) {
  if (!career || career.status === 'complete') return false;
  if (Number(career.roundIndex || 0) !== 0) return false;
  if (hasPlayedFixture(career)) return false;
  return !(career.table || []).some(row => Number(row?.played || 0) > 0);
}

function alreadyFullLeague(career) {
  return career?.table?.length === TARGET_CLUB_COUNT &&
    career?.fixtures?.length === TARGET_ROUND_COUNT &&
    career.fixtures.every(round => Array.isArray(round) && round.length === TARGET_CLUB_COUNT / 2);
}

function initialStatus(player, existing) {
  return existing || {
    condition: 100,
    sharpness: 88,
    morale: 'Good',
    appearances: 0,
    goals: 0
  };
}

function validateTargetClubs(db) {
  const ids = [...new Set(db?.metadata?.playableDemo?.clubIds || [])];
  if (ids.length !== TARGET_CLUB_COUNT) return null;

  const clubs = ids.map(id => db.clubs.find(club => club.id === id));
  if (clubs.some(club => !club || club.isPlaceholder)) return null;
  if (clubs.some(club => club.leagueId !== TARGET_LEAGUE_ID)) return null;
  return clubs;
}

export function auditLeagueCareer(career) {
  const rounds = career?.fixtures || [];
  const fixtures = rounds.flat();
  const clubIds = (career?.table || []).map(row => row.clubId);
  const appearances = Object.fromEntries(clubIds.map(id => [id, { total: 0, home: 0, away: 0 }]));
  const pairings = new Map();

  for (const fixture of fixtures) {
    if (appearances[fixture.homeClubId]) {
      appearances[fixture.homeClubId].total += 1;
      appearances[fixture.homeClubId].home += 1;
    }
    if (appearances[fixture.awayClubId]) {
      appearances[fixture.awayClubId].total += 1;
      appearances[fixture.awayClubId].away += 1;
    }
    const key = [fixture.homeClubId, fixture.awayClubId].sort().join('|');
    const value = pairings.get(key) || { total: 0, homes: new Set() };
    value.total += 1;
    value.homes.add(fixture.homeClubId);
    pairings.set(key, value);
  }

  const expectedPairs = TARGET_CLUB_COUNT * (TARGET_CLUB_COUNT - 1) / 2;
  const validAppearances = clubIds.length === TARGET_CLUB_COUNT && clubIds.every(id =>
    appearances[id]?.total === TARGET_ROUND_COUNT &&
    appearances[id]?.home === TARGET_ROUND_COUNT / 2 &&
    appearances[id]?.away === TARGET_ROUND_COUNT / 2
  );
  const validPairings = pairings.size === expectedPairs && [...pairings.values()].every(value =>
    value.total === 2 && value.homes.size === 2
  );

  return {
    ok: rounds.length === TARGET_ROUND_COUNT &&
      fixtures.length === 380 &&
      rounds.every(round => round.length === 10) &&
      validAppearances &&
      validPairings,
    clubs: clubIds.length,
    rounds: rounds.length,
    fixtures: fixtures.length,
    validAppearances,
    validPairings
  };
}

export async function migrateUntouchedLegacyLeagueSave() {
  const career = readSavedCareer();
  if (!career) return { status: 'no-save' };
  if (alreadyFullLeague(career)) return { status: 'already-full-league', audit: auditLeagueCareer(career) };
  if (!isUntouchedCareer(career)) return { status: 'preserved-existing-progress' };

  const manager = window.FLMManager;
  if (!manager?.loadDatabase) return { status: 'manager-unavailable' };
  const db = await manager.loadDatabase();
  const clubs = validateTargetClubs(db);
  if (!clubs) return { status: 'target-league-unavailable' };
  if (!clubs.some(club => club.id === career.clubId)) return { status: 'managed-club-outside-target-league' };

  const clubIds = clubs.map(club => club.id);
  const fixtures = createFixtures(clubIds);
  const playerStatus = { ...(career.playerStatus || {}) };
  const eligible = new Set(clubIds);
  for (const player of db.players.filter(player => eligible.has(player.clubId) && !player.isPlaceholder)) {
    playerStatus[player.id] = initialStatus(player, playerStatus[player.id]);
  }

  Object.assign(career, {
    version: CAREER_VERSION,
    leagueId: TARGET_LEAGUE_ID,
    competitionId: TARGET_LEAGUE_ID,
    competitionName: TARGET_COMPETITION_NAME,
    competitionFormat: 'double-round-robin',
    seasonStartDate: fixtures[0]?.[0]?.date || null,
    seasonEndDate: fixtures.at(-1)?.[0]?.date || null,
    roundIndex: 0,
    status: 'active',
    fixtures,
    table: clubIds.map(clubId => ({
      clubId,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0
    })),
    playerStatus,
    lastMatch: null,
    updatedAt: new Date().toISOString()
  });

  const audit = auditLeagueCareer(career);
  if (!audit.ok) throw new Error('20-club league migration failed fixture integrity checks.');

  localStorage.setItem(SAVE_KEY, JSON.stringify(career));
  window.dispatchEvent(new CustomEvent('flm:league-save-migrated', { detail: audit }));
  return { status: 'migrated', audit };
}

window.FLMLeagueIntegrity = Object.freeze({
  audit: auditLeagueCareer,
  migrateUntouchedLegacyLeagueSave
});

migrateUntouchedLegacyLeagueSave().catch(error => console.error('[FLM] league save migration failed', error));
