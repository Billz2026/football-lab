import { resetPreseasonForSeason } from './preseason-v047.js';
import { deriveSeasonCalendar } from './season-calendar-v1.js';
import { startTransferSeason } from './transfers-v050.js';

export const ROLLOVER_CALENDAR_MIGRATION_VERSION = 1;
const SOURCE_SEASON = '2026/27';
const TARGET_SEASON = '2027/28';
const SOURCE_FINAL_DAY = '2027-05-30';

function hasPlayedLeagueMatch(career) {
  return (career?.roundIndex || 0) > 0 || Boolean(career?.fixtures?.flat?.().some(fixture => fixture?.played));
}

function rolloverRecord(career) {
  return (career?.seasonRollovers || []).find(record => record?.fromSeason === SOURCE_SEASON && record?.toSeason === TARGET_SEASON) || null;
}

export function needsRolloverCalendarMigration(career) {
  if (!career || career.season !== TARGET_SEASON || career.status !== 'active') return false;
  if (career.rolloverCalendarMigration?.schemaVersion >= ROLLOVER_CALENDAR_MIGRATION_VERSION) return false;
  if (!rolloverRecord(career) || hasPlayedLeagueMatch(career)) return false;
  if (career.preseason?.season === TARGET_SEASON && career.preseason?.phase !== 'complete') return false;
  const startDate = career.seasonStartDate || career.fixtures?.[0]?.find?.(fixture => fixture?.date)?.date || null;
  const current = career.currentDate || career.calendar?.currentDate || null;
  const legacyCalendar = Number(career.calendar?.schemaVersion || 0) < 3;
  const legacyDirectStart = Boolean(startDate && current === startDate && career.preseason?.phase === 'complete');
  return legacyCalendar || legacyDirectStart;
}

export function migrateRolloverCalendar(career, db, { migratedAt = new Date().toISOString() } = {}) {
  if (!needsRolloverCalendarMigration(career)) return { status: 'not-needed', career };
  if (!db?.clubs || !db?.players) throw new Error('Football database is required to migrate the rollover calendar.');

  const rollover = rolloverRecord(career);
  const previousSeasonEndDate = rollover?.previousSeasonEndDate || career.previousSeasonEndDate || SOURCE_FINAL_DAY;
  const calendar = deriveSeasonCalendar({
    season: TARGET_SEASON,
    previousSeasonEndDate,
    seasonStartDate: career.seasonStartDate
  });

  career.previousSeasonEndDate = previousSeasonEndDate;
  career.currentDate = calendar.offseasonStartDate;
  career.calendar = {
    ...calendar,
    schemaVersion: 3,
    currentDate: calendar.offseasonStartDate,
    fixturesReleased: false
  };
  career.worldClock = {
    schemaVersion: 2,
    season: TARGET_SEASON,
    acknowledgedMilestones: [],
    history: [],
    totalDaysAdvanced: 0,
    lastContinueFrom: calendar.offseasonStartDate,
    lastContinueTo: calendar.offseasonStartDate,
    lastStopReason: null,
    lastProcessedDate: calendar.offseasonStartDate
  };

  resetPreseasonForSeason(career, db, { startedAt: migratedAt });
  startTransferSeason(career, db);
  career.rolloverCalendarMigration = {
    schemaVersion: ROLLOVER_CALENDAR_MIGRATION_VERSION,
    migratedAt,
    fromState: 'legacy-direct-opening-day',
    restoredToDate: calendar.offseasonStartDate
  };
  career.updatedAt = migratedAt;

  return {
    status: 'migrated',
    career,
    offseasonStartDate: calendar.offseasonStartDate,
    transferWindowOpenDate: calendar.transferWindowOpenDate,
    fixtureReleaseDate: calendar.fixtureReleaseDate
  };
}
