export const SEASON_CALENDAR_SCHEMA_VERSION = 1;
export const BASE_SEASON = '2026/27';
export const BASE_TAKEOVER_DATE = '2026-06-05';
export const FIXTURE_RELEASE_TIME = '10:00 BST';
export const TRANSFER_DEADLINE_TIME = '23:00';
export const PRESEASON_FRIENDLY_COUNT = 5;

const DAY_MS = 86400000;

function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
}

export function seasonStartYear(season) {
  const match = /^(\d{4})\/(\d{2})$/.exec(String(season || ''));
  return match ? Number(match[1]) : null;
}

export function seasonLabelFromYear(year) {
  const start = Number(year);
  if (!Number.isInteger(start) || start < 1900 || start > 2200) return null;
  return `${start}/${String((start + 1) % 100).padStart(2, '0')}`;
}

export function addCalendarDays(value, amount = 1) {
  if (!validDate(value)) return null;
  const parsed = Date.parse(`${value}T12:00:00Z`);
  if (!Number.isFinite(parsed)) return null;
  return new Date(parsed + Number(amount || 0) * DAY_MS).toISOString().slice(0, 10);
}

function iso(year, month, day) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function firstWeekdayOnOrAfter(year, month, day, weekday) {
  const start = iso(year, month, day);
  const parsed = new Date(`${start}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return start;
  const offset = (weekday - parsed.getUTCDay() + 7) % 7;
  return addCalendarDays(start, offset);
}

export function deriveSeasonCalendar({
  season = BASE_SEASON,
  previousSeasonEndDate = null,
  seasonStartDate = null
} = {}) {
  const startYear = seasonStartYear(season);
  if (!Number.isInteger(startYear)) throw new Error(`Invalid season label: ${season}`);

  const transferWindowOpenDate = iso(startYear, 6, 15);
  const fixtureReleaseDate = iso(startYear, 6, 19);
  const transferDeadlineDate = iso(startYear, 9, 1);
  const transferClosedDate = iso(startYear, 9, 2);
  const firstFriendly = firstWeekdayOnOrAfter(startYear, 7, 10, 6);
  const preseasonFriendlyDates = Array.from(
    { length: PRESEASON_FRIENDLY_COUNT },
    (_, index) => addCalendarDays(firstFriendly, index * 7)
  );

  let offseasonStartDate = season === BASE_SEASON ? BASE_TAKEOVER_DATE : iso(startYear, 6, 1);
  if (validDate(previousSeasonEndDate)) {
    const nextDay = addCalendarDays(previousSeasonEndDate, 1);
    if (nextDay && Number(nextDay.slice(0, 4)) === startYear) offseasonStartDate = nextDay;
  }

  return {
    schemaVersion: SEASON_CALENDAR_SCHEMA_VERSION,
    season,
    startYear,
    offseasonStartDate,
    takeoverDate: season === BASE_SEASON ? BASE_TAKEOVER_DATE : offseasonStartDate,
    transferWindowOpenDate,
    fixtureReleaseDate,
    fixtureReleaseTime: FIXTURE_RELEASE_TIME,
    preseasonFriendlyDates,
    seasonStartDate: validDate(seasonStartDate) ? seasonStartDate : null,
    transferDeadlineDate,
    transferClosedDate,
    transferDeadlineTime: TRANSFER_DEADLINE_TIME
  };
}

export function deriveCalendarForCareer(career) {
  const previousSeasonEndDate = career?.seasonRollovers?.at?.(-1)?.previousSeasonEndDate
    || career?.previousSeasonEndDate
    || null;
  const seasonStartDate = career?.seasonStartDate
    || career?.fixtures?.[0]?.find?.(fixture => validDate(fixture?.date))?.date
    || null;
  return deriveSeasonCalendar({
    season: career?.season || BASE_SEASON,
    previousSeasonEndDate,
    seasonStartDate
  });
}
