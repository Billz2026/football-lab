import { createFixtures } from './manager-core.js';
import { CHAMPIONSHIP_2026_27_CLUBS } from './championship-world-v1.js';

export const PREMIER_LEAGUE_ROLLOVER_VERSION = 1;
export const PREMIER_LEAGUE_ID = 'eng-premier-league';
export const ROLLOVER_SOURCE_SEASON = '2026/27';
export const ROLLOVER_TARGET_SEASON = '2027/28';

const DAY_MS = 86400000;
const clone = value => JSON.parse(JSON.stringify(value));

function addDays(value, amount) {
  const parsed = Date.parse(`${value}T12:00:00Z`);
  if (!Number.isFinite(parsed)) throw new Error(`Invalid fixture date: ${value}`);
  return new Date(parsed + amount * DAY_MS).toISOString().slice(0, 10);
}

export function nextSeasonLabel(label) {
  const match = /^(\d{4})\/(\d{2})$/.exec(String(label || ''));
  if (!match) return null;
  const start = Number(match[1]) + 1;
  return `${start}/${String((start + 1) % 100).padStart(2, '0')}`;
}

function blankTable(clubIds) {
  return clubIds.map(clubId => ({
    clubId,
    played: 0,
    won: 0,
    drawn: 0,
    lost: 0,
    goalsFor: 0,
    goalsAgainst: 0,
    goalDifference: 0,
    points: 0
  }));
}

function fixtureMembership(career) {
  if (Array.isArray(career?.seasonClubIds) && career.seasonClubIds.length) return [...career.seasonClubIds];
  if (Array.isArray(career?.seasonOutcome?.finalTable) && career.seasonOutcome.finalTable.length) {
    return career.seasonOutcome.finalTable.map(row => row.clubId).filter(Boolean);
  }
  return (career?.table || []).map(row => row.clubId).filter(Boolean);
}

function compactRealClub(club) {
  return {
    id: club.id,
    name: club.name,
    shortName: club.shortName || club.name,
    providerName: club.providerName || club.name,
    countryCode: club.countryCode || 'ENG',
    leagueId: PREMIER_LEAGUE_ID,
    venue: club.venue || null,
    reputation: Number(club.reputation || 7000),
    isPlaceholder: false,
    backgroundGenerated: false
  };
}

function promotedClubRecord(club) {
  const strength = Number(club.strength);
  const backgroundAbility = Math.round(128 + (strength - 64) * 0.9);
  const reputation = Math.round(6640 + (strength - 64) * 60);
  return {
    id: club.id,
    name: club.name,
    shortName: club.name,
    providerName: club.name,
    countryCode: 'ENG',
    leagueId: PREMIER_LEAGUE_ID,
    venue: null,
    reputation,
    isPlaceholder: false,
    backgroundGenerated: true,
    backgroundSourceCompetitionId: 'eng-championship',
    backgroundStrength: strength,
    backgroundAbility
  };
}

const BACKGROUND_ROSTER_SHAPE = Object.freeze([
  ['GK', 'GK'], ['GK', 'GK'],
  ['DEF', 'DR'], ['DEF', 'DC'], ['DEF', 'DC'], ['DEF', 'DL'], ['DEF', 'DC'], ['DEF', 'DR'], ['DEF', 'DL'], ['DEF', 'DC'],
  ['MID', 'DMC'], ['MID', 'MC'], ['MID', 'MC'], ['MID', 'AMC'], ['MID', 'MC'], ['MID', 'DMC'], ['MID', 'AMC'],
  ['ATT', 'AMR'], ['ATT', 'ST'], ['ATT', 'AML'], ['ATT', 'ST'], ['ATT', 'AMR']
]);

function backgroundRoster(club) {
  const base = Number(club.backgroundAbility || 132);
  return BACKGROUND_ROSTER_SHAPE.map(([positionGroup, primaryPosition], index) => {
    const tier = index < 11 ? 3 : index < 17 ? -1 : -4;
    const spread = ((index * 7) % 5) - 2;
    const currentAbility = Math.max(115, Math.min(155, base + tier + spread));
    return {
      id: `background-${club.id}-p${String(index + 1).padStart(2, '0')}`,
      name: `${club.name} Player ${index + 1}`,
      clubId: club.id,
      positionGroup,
      primaryPosition,
      currentAbility,
      potentialAbility: Math.min(170, currentAbility + 8),
      isPlaceholder: false,
      backgroundGenerated: true,
      unavailableInPremierLeagueDatabase: true
    };
  });
}

function resetPlayerStatus(players, clubIds) {
  const eligible = new Set(clubIds);
  return Object.fromEntries((players || [])
    .filter(player => eligible.has(player.clubId) && !player.isPlaceholder)
    .map(player => [player.id, {
      condition: 100,
      sharpness: 88,
      morale: 'Good',
      appearances: 0,
      goals: 0
    }]));
}

function shiftFixtureCalendar(fixtures, days = 364) {
  return fixtures.map(round => round.map(fixture => ({
    ...fixture,
    date: addDays(fixture.date, days)
  })));
}

function championshipClubMap() {
  return new Map(CHAMPIONSHIP_2026_27_CLUBS.map(club => [club.id, club]));
}

function rolloverRecord(career) {
  return (career?.seasonRollovers || []).find(record =>
    record?.schemaVersion === PREMIER_LEAGUE_ROLLOVER_VERSION &&
    record?.fromSeason === ROLLOVER_SOURCE_SEASON &&
    record?.toSeason === ROLLOVER_TARGET_SEASON
  ) || null;
}

export function augmentDatabaseForCareer(career, db) {
  if (!career || !db || !Array.isArray(db.clubs) || !Array.isArray(db.players)) return db;
  const clubIds = new Set(db.clubs.map(club => club.id));
  for (const club of career.seasonClubs || []) {
    if (!club?.backgroundGenerated || clubIds.has(club.id)) continue;
    db.clubs.push(clone(club));
    clubIds.add(club.id);
  }
  const playerIds = new Set(db.players.map(player => player.id));
  for (const player of career.backgroundPlayers || []) {
    if (!player?.backgroundGenerated || playerIds.has(player.id)) continue;
    db.players.push(clone(player));
    playerIds.add(player.id);
  }
  return db;
}

export function validatePremierLeagueRollover(career, db) {
  if (!career || typeof career !== 'object') return { ok: false, status: 'invalid-career', reason: 'A career save is required.' };
  if ((career.competitionId || career.leagueId) !== PREMIER_LEAGUE_ID) return { ok: false, status: 'not-premier-league', reason: 'Only Premier League careers can use this rollover.' };
  if (rolloverRecord(career) && career.season === ROLLOVER_TARGET_SEASON) return { ok: false, status: 'already-rolled-over', reason: 'The 2027/28 rollover has already been applied.' };
  if (career.season !== ROLLOVER_SOURCE_SEASON) return { ok: false, status: 'unsupported-source-season', reason: `Rollover v1 supports ${ROLLOVER_SOURCE_SEASON} → ${ROLLOVER_TARGET_SEASON} only.` };
  if (career.status !== 'complete') return { ok: false, status: 'season-not-complete', reason: 'Finish the current league season before rolling over.' };
  if (!career.seasonOutcome?.championClubId || !Array.isArray(career.seasonOutcome?.relegatedClubIds)) return { ok: false, status: 'season-not-finalised', reason: 'The completed season must be finalised first.' };

  const relegatedClubIds = [...career.seasonOutcome.relegatedClubIds];
  const promotedClubIds = [...(career.nextSeasonContext?.promotedFromChampionshipClubIds || [])];
  if (relegatedClubIds.length !== 3) return { ok: false, status: 'invalid-relegation', reason: 'Premier League rollover requires exactly three relegated clubs.' };
  if (promotedClubIds.length !== 3 || new Set(promotedClubIds).size !== 3) return { ok: false, status: 'championship-not-ready', reason: 'Championship promotion must produce exactly three unique promoted clubs.' };
  if (relegatedClubIds.includes(career.clubId)) return { ok: false, status: 'managed-club-relegated', reason: 'Your club was relegated. Championship careers are not playable yet, so the save cannot be silently kept in the Premier League.' };

  const currentClubIds = fixtureMembership(career);
  if (currentClubIds.length !== 20 || new Set(currentClubIds).size !== 20) return { ok: false, status: 'invalid-current-membership', reason: 'The source Premier League must contain exactly 20 unique clubs.' };
  const survivors = currentClubIds.filter(id => !relegatedClubIds.includes(id));
  if (survivors.length !== 17) return { ok: false, status: 'invalid-survivors', reason: 'The rollover must retain exactly 17 Premier League clubs.' };
  if (survivors.some(id => promotedClubIds.includes(id))) return { ok: false, status: 'membership-collision', reason: 'A promoted club already exists among the 17 Premier League survivors.' };

  const champMap = championshipClubMap();
  if (promotedClubIds.some(id => !champMap.has(id))) return { ok: false, status: 'unknown-promoted-club', reason: 'A promoted Championship club is missing from the background world database.' };
  if (!db || !Array.isArray(db.clubs) || !Array.isArray(db.players)) return { ok: false, status: 'database-required', reason: 'The football database is required to build the next season.' };
  const dbClubIds = new Set(db.clubs.map(club => club.id));
  if (survivors.some(id => !dbClubIds.has(id))) return { ok: false, status: 'missing-survivor-data', reason: 'At least one surviving Premier League club is missing from the football database.' };

  return {
    ok: true,
    status: 'ready',
    currentClubIds,
    survivors,
    relegatedClubIds,
    promotedClubIds
  };
}

export function rolloverPremierLeagueSeason(career, { db, rolledAt = new Date().toISOString() } = {}) {
  const existing = rolloverRecord(career);
  if (existing && career?.season === ROLLOVER_TARGET_SEASON) {
    return { status: 'already-rolled-over', career, rollover: clone(existing) };
  }

  const validation = validatePremierLeagueRollover(career, db);
  if (!validation.ok) return { status: validation.status, reason: validation.reason, career };

  const champMap = championshipClubMap();
  const survivorRecords = validation.survivors.map(id => compactRealClub(db.clubs.find(club => club.id === id)));
  const promotedRecords = validation.promotedClubIds.map(id => promotedClubRecord(champMap.get(id)));
  const seasonClubs = [...survivorRecords, ...promotedRecords];
  const seasonClubIds = seasonClubs.map(club => club.id);
  if (seasonClubIds.length !== 20 || new Set(seasonClubIds).size !== 20) throw new Error('Next-season Premier League membership failed its 20-club invariant.');

  const fixtures = shiftFixtureCalendar(createFixtures(seasonClubIds));
  if (fixtures.length !== 38 || fixtures.flat().length !== 380) throw new Error('Next-season Premier League fixture generation failed its 38-matchweek invariant.');
  const backgroundPlayers = promotedRecords.flatMap(backgroundRoster);
  const allSeasonPlayers = [
    ...db.players.filter(player => seasonClubIds.includes(player.clubId) && !player.isPlaceholder),
    ...backgroundPlayers
  ];

  const sourceSeason = career.season;
  const sourceOutcome = clone(career.seasonOutcome);
  const previousSeed = String(career.seed ?? 'football-lab');
  const rollover = {
    schemaVersion: PREMIER_LEAGUE_ROLLOVER_VERSION,
    fromSeason: sourceSeason,
    toSeason: ROLLOVER_TARGET_SEASON,
    rolledAt,
    defendingChampionClubId: sourceOutcome.championClubId,
    relegatedClubIds: [...validation.relegatedClubIds],
    promotedClubIds: [...validation.promotedClubIds],
    sourceOutcomeKey: sourceOutcome.key || `${PREMIER_LEAGUE_ID}:${sourceSeason}`
  };

  career.seasonRollovers ||= [];
  career.seasonRollovers.push(rollover);
  career.previousSeasonOutcomeKey = rollover.sourceOutcomeKey;
  career.defendingChampionClubId = sourceOutcome.championClubId;
  career.season = ROLLOVER_TARGET_SEASON;
  career.status = 'active';
  career.roundIndex = 0;
  career.seed = `${previousSeed}:${ROLLOVER_TARGET_SEASON}`;
  career.seasonClubIds = seasonClubIds;
  career.seasonClubs = seasonClubs;
  career.backgroundPlayers = backgroundPlayers;
  career.fixtures = fixtures;
  career.table = blankTable(seasonClubIds);
  career.seasonStartDate = fixtures[0]?.[0]?.date || null;
  career.seasonEndDate = fixtures.at(-1)?.[0]?.date || null;
  career.lastMatch = null;
  career.playerStatus = resetPlayerStatus(allSeasonPlayers, seasonClubIds);
  career.seasonOutcome = null;
  career.seasonResolution = null;
  career.nextSeasonContext = null;
  career.currentDate = career.seasonStartDate;
  if (career.calendar && typeof career.calendar === 'object') {
    career.calendar.currentDate = career.seasonStartDate;
    career.calendar.fixturesReleased = true;
  }
  if (career.worldClock && typeof career.worldClock === 'object') {
    career.worldClock.acknowledgedMilestones = [];
    career.worldClock.history = [];
    career.worldClock.totalDaysAdvanced = 0;
    career.worldClock.lastContinueFrom = career.seasonStartDate;
    career.worldClock.lastContinueTo = career.seasonStartDate;
    career.worldClock.lastStopReason = null;
    career.worldClock.lastProcessedDate = career.seasonStartDate;
  }
  if (career.preseason && typeof career.preseason === 'object') career.preseason.phase = 'complete';
  career.updatedAt = rolledAt;

  augmentDatabaseForCareer(career, db);
  return {
    status: 'rolled-over',
    career,
    rollover: clone(rollover),
    seasonClubIds: [...seasonClubIds],
    promotedClubIds: [...validation.promotedClubIds],
    relegatedClubIds: [...validation.relegatedClubIds]
  };
}
