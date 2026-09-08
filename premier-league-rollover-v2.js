import { createFixtures } from './manager-core.js';
import { resetPreseasonForSeason } from './preseason-v047.js';
import { deriveSeasonCalendar } from './season-calendar-v1.js';
import { startTransferSeason } from './transfers-v050.js';
import { getChampionshipMembership } from './english-pyramid-world-v2.js';

export const PREMIER_LEAGUE_ROLLOVER_VERSION = 2;
export const PREMIER_LEAGUE_ID = 'eng-premier-league';
// Compatibility exports for UI/tests that still display the first supported handoff.
export const ROLLOVER_SOURCE_SEASON = '2026/27';
export const ROLLOVER_TARGET_SEASON = '2027/28';

const DAY_MS = 86400000;
const BASE_SEASON_START_YEAR = 2026;
const clone = value => JSON.parse(JSON.stringify(value));

function addDays(value, amount) {
  const parsed = Date.parse(`${value}T12:00:00Z`);
  if (!Number.isFinite(parsed)) throw new Error(`Invalid fixture date: ${value}`);
  return new Date(parsed + amount * DAY_MS).toISOString().slice(0, 10);
}

function seasonStartYear(label) {
  const match = /^(\d{4})\/(\d{2})$/.exec(String(label || ''));
  return match ? Number(match[1]) : null;
}

export function nextSeasonLabel(label) {
  const start = seasonStartYear(label);
  if (!Number.isInteger(start)) return null;
  const next = start + 1;
  return `${next}/${String((next + 1) % 100).padStart(2, '0')}`;
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

function compactSeasonClub(club) {
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
    backgroundGenerated: Boolean(club.backgroundGenerated),
    backgroundSourceCompetitionId: club.backgroundSourceCompetitionId || null,
    backgroundStrength: Number.isFinite(Number(club.backgroundStrength)) ? Number(club.backgroundStrength) : null,
    backgroundAbility: Number.isFinite(Number(club.backgroundAbility)) ? Number(club.backgroundAbility) : null
  };
}

function promotedClubRecord(club) {
  const strength = Number(club.strength || 70);
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

function shiftFixtureCalendar(fixtures, targetSeason) {
  const start = seasonStartYear(targetSeason);
  if (!Number.isInteger(start)) throw new Error(`Invalid target season: ${targetSeason}`);
  const days = Math.max(0, start - BASE_SEASON_START_YEAR) * 364;
  return fixtures.map(round => round.map(fixture => ({
    ...fixture,
    date: addDays(fixture.date, days)
  })));
}

function rolloverRecord(career, sourceSeason, targetSeason) {
  return (career?.seasonRollovers || []).find(record =>
    record?.fromSeason === sourceSeason && record?.toSeason === targetSeason
  ) || null;
}

function championshipClubMap(career, season) {
  const records = [
    ...(getChampionshipMembership(career, season) || []),
    ...(career?.championshipOutcome?.season === season ? career.championshipOutcome.clubs || [] : [])
  ];
  return new Map(records.map(club => [club.id, club]));
}

function carriedBackgroundPlayers(db, seasonClubs) {
  const backgroundClubIds = new Set(seasonClubs.filter(club => club.backgroundGenerated).map(club => club.id));
  const players = (db.players || []).filter(player => backgroundClubIds.has(player.clubId) && player.backgroundGenerated);
  const byClub = new Map();
  for (const player of players) {
    const list = byClub.get(player.clubId) || [];
    list.push(player);
    byClub.set(player.clubId, list);
  }
  const generated = [];
  for (const club of seasonClubs.filter(item => item.backgroundGenerated)) {
    if ((byClub.get(club.id) || []).length) continue;
    generated.push(...backgroundRoster(club));
  }
  const unique = new Map([...players, ...generated].map(player => [player.id, player]));
  return [...unique.values()].map(clone);
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
  const sourceSeason = career.season;
  const targetSeason = nextSeasonLabel(sourceSeason);
  if (!targetSeason) return { ok: false, status: 'invalid-season', reason: 'The active season label is invalid.' };
  if (rolloverRecord(career, sourceSeason, targetSeason)) return { ok: false, status: 'already-rolled-over', reason: `The ${targetSeason} rollover has already been applied.` };
  if (career.status !== 'complete') return { ok: false, status: 'season-not-complete', reason: 'Finish the current league season before rolling over.' };
  if (!career.seasonOutcome?.championClubId || !Array.isArray(career.seasonOutcome?.relegatedClubIds)) return { ok: false, status: 'season-not-finalised', reason: 'The completed season must be finalised first.' };

  const relegatedClubIds = [...career.seasonOutcome.relegatedClubIds];
  const promotedClubIds = [...(career.nextSeasonContext?.promotedFromChampionshipClubIds || [])];
  if (relegatedClubIds.length !== 3) return { ok: false, status: 'invalid-relegation', reason: 'Premier League rollover requires exactly three relegated clubs.' };
  if (promotedClubIds.length !== 3 || new Set(promotedClubIds).size !== 3) {
    const status = career.nextSeasonContext?.championshipStatus === 'unsupported-membership' ? 'lower-pyramid-not-ready' : 'championship-not-ready';
    return { ok: false, status, reason: `Championship ${sourceSeason} has not produced exactly three promoted clubs.` };
  }
  if (relegatedClubIds.includes(career.clubId)) return { ok: false, status: 'managed-club-relegated', reason: 'Your club was relegated. Championship careers are not playable yet, so the save cannot be silently kept in the Premier League.' };

  const currentClubIds = fixtureMembership(career);
  if (currentClubIds.length !== 20 || new Set(currentClubIds).size !== 20) return { ok: false, status: 'invalid-current-membership', reason: 'The source Premier League must contain exactly 20 unique clubs.' };
  const survivors = currentClubIds.filter(id => !relegatedClubIds.includes(id));
  if (survivors.length !== 17) return { ok: false, status: 'invalid-survivors', reason: 'The rollover must retain exactly 17 Premier League clubs.' };
  if (survivors.some(id => promotedClubIds.includes(id))) return { ok: false, status: 'membership-collision', reason: 'A promoted club already exists among the 17 Premier League survivors.' };

  if (!db || !Array.isArray(db.clubs) || !Array.isArray(db.players)) return { ok: false, status: 'database-required', reason: 'The football database is required to build the next season.' };
  const dbClubIds = new Set(db.clubs.map(club => club.id));
  if (survivors.some(id => !dbClubIds.has(id))) return { ok: false, status: 'missing-survivor-data', reason: 'At least one surviving Premier League club is missing from the football database.' };
  const champMap = championshipClubMap(career, sourceSeason);
  if (promotedClubIds.some(id => !champMap.has(id) && !dbClubIds.has(id))) {
    return { ok: false, status: 'unknown-promoted-club', reason: 'A promoted Championship club is missing from both the football database and the background pyramid membership.' };
  }

  return {
    ok: true,
    status: 'ready',
    sourceSeason,
    targetSeason,
    currentClubIds,
    survivors,
    relegatedClubIds,
    promotedClubIds,
    championshipClubMap: champMap
  };
}

export function rolloverPremierLeagueSeason(career, { db, rolledAt = new Date().toISOString() } = {}) {
  const validation = validatePremierLeagueRollover(career, db);
  if (!validation.ok) {
    if (validation.status === 'already-rolled-over') {
      const target = nextSeasonLabel(career?.season);
      const latest = (career?.seasonRollovers || []).at(-1) || null;
      if (latest && career?.season === latest.toSeason) return { status: 'already-rolled-over', career, rollover: clone(latest) };
      return { status: validation.status, reason: validation.reason, career };
    }
    return { status: validation.status, reason: validation.reason, career };
  }

  const dbMap = new Map(db.clubs.map(club => [club.id, club]));
  const survivorRecords = validation.survivors.map(id => compactSeasonClub(dbMap.get(id)));
  const promotedRecords = validation.promotedClubIds.map(id => {
    const existing = dbMap.get(id);
    return existing ? compactSeasonClub(existing) : promotedClubRecord(validation.championshipClubMap.get(id));
  });
  const seasonClubs = [...survivorRecords, ...promotedRecords];
  const seasonClubIds = seasonClubs.map(club => club.id);
  if (seasonClubIds.length !== 20 || new Set(seasonClubIds).size !== 20) throw new Error('Next-season Premier League membership failed its 20-club invariant.');

  const fixtures = shiftFixtureCalendar(createFixtures(seasonClubIds), validation.targetSeason);
  if (fixtures.length !== 38 || fixtures.flat().length !== 380) throw new Error('Next-season Premier League fixture generation failed its 38-matchweek invariant.');

  const backgroundPlayers = carriedBackgroundPlayers(db, seasonClubs);
  for (const player of backgroundPlayers) {
    if (!db.players.some(existing => existing.id === player.id)) db.players.push(clone(player));
  }
  const allSeasonPlayers = db.players.filter(player => seasonClubIds.includes(player.clubId) && !player.isPlaceholder);

  const sourceOutcome = clone(career.seasonOutcome);
  const previousSeed = String(career.seed ?? 'football-lab');
  const previousSeasonEndDate = career.seasonEndDate || career.lastMatch?.date || career.currentDate || null;
  const rollover = {
    schemaVersion: PREMIER_LEAGUE_ROLLOVER_VERSION,
    fromSeason: validation.sourceSeason,
    toSeason: validation.targetSeason,
    rolledAt,
    previousSeasonEndDate,
    defendingChampionClubId: sourceOutcome.championClubId,
    relegatedClubIds: [...validation.relegatedClubIds],
    promotedClubIds: [...validation.promotedClubIds],
    sourceOutcomeKey: sourceOutcome.key || `${PREMIER_LEAGUE_ID}:${validation.sourceSeason}`
  };

  career.seasonRollovers ||= [];
  career.seasonRollovers.push(rollover);
  career.previousSeasonOutcomeKey = rollover.sourceOutcomeKey;
  career.previousSeasonEndDate = previousSeasonEndDate;
  career.defendingChampionClubId = sourceOutcome.championClubId;
  career.season = validation.targetSeason;
  career.status = 'active';
  career.roundIndex = 0;
  career.seed = `${previousSeed}:${validation.targetSeason}`;
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

  const calendar = deriveSeasonCalendar({
    season: validation.targetSeason,
    previousSeasonEndDate,
    seasonStartDate: career.seasonStartDate
  });
  career.currentDate = calendar.offseasonStartDate;
  career.calendar = {
    ...calendar,
    schemaVersion: 3,
    currentDate: calendar.offseasonStartDate,
    fixturesReleased: false
  };
  career.worldClock = {
    schemaVersion: 2,
    season: validation.targetSeason,
    acknowledgedMilestones: [],
    history: [],
    totalDaysAdvanced: 0,
    lastContinueFrom: calendar.offseasonStartDate,
    lastContinueTo: calendar.offseasonStartDate,
    lastStopReason: null,
    lastProcessedDate: calendar.offseasonStartDate
  };

  augmentDatabaseForCareer(career, db);
  resetPreseasonForSeason(career, db, { startedAt: rolledAt });
  startTransferSeason(career, db);
  career.updatedAt = rolledAt;

  return {
    status: 'rolled-over',
    career,
    rollover: clone(rollover),
    seasonClubIds: [...seasonClubIds],
    promotedClubIds: [...validation.promotedClubIds],
    relegatedClubIds: [...validation.relegatedClubIds],
    offseasonStartDate: calendar.offseasonStartDate,
    transferWindowOpenDate: calendar.transferWindowOpenDate,
    fixtureReleaseDate: calendar.fixtureReleaseDate
  };
}
