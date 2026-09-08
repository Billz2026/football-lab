import { getTransferWindowStatus, processTransferWorld } from './transfers-v050.js';
import {
  BASE_SEASON,
  BASE_TAKEOVER_DATE,
  deriveCalendarForCareer,
  deriveSeasonCalendar
} from './season-calendar-v1.js';

export const WORLD_CLOCK_SCHEMA_VERSION = 2;
export const CAREER_CALENDAR_SCHEMA_VERSION = 3;

const BASE_CALENDAR = deriveSeasonCalendar({ season: BASE_SEASON });
export const TAKEOVER_DATE = BASE_TAKEOVER_DATE;
export const TRANSFER_OPEN_DATE = BASE_CALENDAR.transferWindowOpenDate;
export const FIXTURE_RELEASE_DATE = BASE_CALENDAR.fixtureReleaseDate;
export const TRANSFER_DEADLINE_DATE = BASE_CALENDAR.transferDeadlineDate;
export const TRANSFER_CLOSED_DATE = BASE_CALENDAR.transferClosedDate;
export const PRESEASON_FIXTURE_DATES = Object.freeze([...BASE_CALENDAR.preseasonFriendlyDates]);

const MS_PER_DAY = 86400000;
const clone = value => value == null ? value : JSON.parse(JSON.stringify(value));

function dayNumber(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return null;
  const [year, month, day] = value.split('-').map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / MS_PER_DAY);
}

export function addDays(value, amount = 1) {
  const day = dayNumber(value);
  if (day === null) return null;
  return new Date((day + amount) * MS_PER_DAY).toISOString().slice(0, 10);
}

export function compareDates(a, b) {
  const left = dayNumber(a);
  const right = dayNumber(b);
  if (left === null || right === null) return 0;
  return Math.sign(left - right);
}

export function formatCareerDate(value) {
  if (!value) return '—';
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'
  }).format(date).toUpperCase();
}

function shortDate(value) {
  if (!value) return '—';
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
    .format(date)
    .toUpperCase();
}

export function getCareerSeasonCalendar(career) {
  const derived = deriveCalendarForCareer(career);
  const existing = career?.calendar || {};
  return {
    ...derived,
    ...Object.fromEntries(Object.entries(existing).filter(([key]) => [
      'offseasonStartDate',
      'takeoverDate',
      'transferWindowOpenDate',
      'fixtureReleaseDate',
      'fixtureReleaseTime',
      'preseasonFriendlyDates',
      'seasonStartDate',
      'transferDeadlineDate',
      'transferClosedDate',
      'transferDeadlineTime'
    ].includes(key)))
  };
}

function inferLegacyDate(career, model) {
  if (!career) return model.takeoverDate;
  if (career.currentDate && dayNumber(career.currentDate) !== null) return career.currentDate;
  if (career.calendar?.currentDate && dayNumber(career.calendar.currentDate) !== null) return career.calendar.currentDate;
  if (career.preseason?.phase === 'complete') {
    const lastMatchDate = career.lastMatch?.date;
    if (lastMatchDate && dayNumber(lastMatchDate) !== null) return lastMatchDate;
    const round = Math.max(0, Math.min(career.roundIndex || 0, Math.max(0, (career.fixtures?.length || 1) - 1)));
    return career.fixtures?.[round]?.find(fixture => fixture.date)?.date || career.seasonStartDate || model.seasonStartDate || model.takeoverDate;
  }
  const played = career.preseason?.fixtures?.filter(fixture => fixture.played).length || 0;
  if (played > 0) return model.preseasonFriendlyDates[Math.min(played - 1, model.preseasonFriendlyDates.length - 1)];
  return model.takeoverDate;
}

function seasonScopedKey(career, base) {
  return (career?.season || BASE_SEASON) === BASE_SEASON ? base : `${career.season}:${base}`;
}

function addNewsOnce(career, { key, dateLabel, category = 'Competitions', source = 'Club Secretary', title, body, priority = 'normal', order = 0 }) {
  if (!Array.isArray(career?.news?.items)) return false;
  const id = `news-${career.id}-${key}`;
  if (career.news.items.some(item => item.id === id || item.key === key)) return false;
  career.news.items.push({
    id,
    key,
    round: career.roundIndex || 0,
    period: 'AM',
    dateLabel,
    category,
    source,
    title,
    body,
    priority,
    relatedClubId: career.clubId,
    relatedPlayerId: null,
    order,
    read: false
  });
  return true;
}

export function syncWorldCalendarNews(career) {
  if (!career?.calendar) return false;
  const model = getCareerSeasonCalendar(career);
  const current = career.calendar.currentDate;
  const season = career.season || BASE_SEASON;
  const opening = career.seasonStartDate || model.seasonStartDate;
  let changed = false;

  if (compareDates(current, model.transferWindowOpenDate) >= 0) {
    changed = addNewsOnce(career, {
      key: seasonScopedKey(career, 'summer-window-opens'),
      dateLabel: shortDate(model.transferWindowOpenDate),
      category: 'Transfers', source: 'Football Operations',
      title: 'Summer transfer window opens',
      body: `Premier League clubs can now complete permanent transfers. The ${season} summer window remains open until ${model.transferDeadlineTime} on ${shortDate(model.transferDeadlineDate)}.`,
      priority: 'important', order: 33000
    }) || changed;
  }
  if (compareDates(current, model.fixtureReleaseDate) >= 0) {
    changed = addNewsOnce(career, {
      key: seasonScopedKey(career, 'fixture-release'),
      dateLabel: shortDate(model.fixtureReleaseDate),
      category: 'Competitions', source: 'Premier League',
      title: 'Premier League fixtures released',
      body: `The full 38-match ${season} league schedule has been published. Every club will play 19 home matches and 19 away matches${opening ? `, with the opening round beginning on ${shortDate(opening)}` : ''}.`,
      priority: 'important', order: 38000
    }) || changed;
  }
  if (compareDates(current, model.transferDeadlineDate) >= 0) {
    changed = addNewsOnce(career, {
      key: seasonScopedKey(career, 'transfer-deadline-day'),
      dateLabel: shortDate(model.transferDeadlineDate),
      category: 'Transfers', source: 'Transfer Desk',
      title: 'Transfer deadline day',
      body: `The ${season} summer transfer window closes tonight at ${model.transferDeadlineTime}. Any permanent transfer business must be completed before the deadline.`,
      priority: 'important', order: 69000
    }) || changed;
  }
  return changed;
}

export function ensureWorldClock(career) {
  if (!career) return false;
  let changed = false;
  if (!career.calendar || typeof career.calendar !== 'object') {
    career.calendar = {};
    changed = true;
  }
  const calendar = career.calendar;
  const model = deriveCalendarForCareer(career);
  const defaults = {
    schemaVersion: CAREER_CALENDAR_SCHEMA_VERSION,
    season: career.season || BASE_SEASON,
    offseasonStartDate: model.offseasonStartDate,
    takeoverDate: model.takeoverDate,
    transferWindowOpenDate: model.transferWindowOpenDate,
    fixtureReleaseDate: model.fixtureReleaseDate,
    fixtureReleaseTime: model.fixtureReleaseTime,
    preseasonFriendlyDates: [...model.preseasonFriendlyDates],
    seasonStartDate: career.seasonStartDate || model.seasonStartDate,
    transferDeadlineDate: model.transferDeadlineDate,
    transferClosedDate: model.transferClosedDate,
    transferDeadlineTime: model.transferDeadlineTime
  };
  for (const [key, value] of Object.entries(defaults)) {
    const same = Array.isArray(value)
      ? Array.isArray(calendar[key]) && JSON.stringify(calendar[key]) === JSON.stringify(value)
      : calendar[key] === value;
    if (!same) {
      calendar[key] = clone(value);
      changed = true;
    }
  }
  if (dayNumber(calendar.currentDate) === null) {
    calendar.currentDate = inferLegacyDate(career, model);
    changed = true;
  }
  const released = compareDates(calendar.currentDate, calendar.fixtureReleaseDate) >= 0
    || Boolean(career.preseason?.fixtures?.some(fixture => fixture.played))
    || (career.roundIndex || 0) > 0;
  if (calendar.fixturesReleased !== released) {
    calendar.fixturesReleased = released;
    changed = true;
  }
  if (career.currentDate !== calendar.currentDate) {
    career.currentDate = calendar.currentDate;
    changed = true;
  }

  if (!career.worldClock || typeof career.worldClock !== 'object') {
    career.worldClock = {
      schemaVersion: WORLD_CLOCK_SCHEMA_VERSION,
      season: career.season || BASE_SEASON,
      acknowledgedMilestones: [],
      history: [],
      totalDaysAdvanced: 0,
      lastContinueFrom: calendar.currentDate,
      lastContinueTo: calendar.currentDate,
      lastStopReason: null,
      lastProcessedDate: calendar.currentDate
    };
    changed = true;
  } else {
    const clock = career.worldClock;
    if (clock.schemaVersion !== WORLD_CLOCK_SCHEMA_VERSION) { clock.schemaVersion = WORLD_CLOCK_SCHEMA_VERSION; changed = true; }
    if (clock.season !== (career.season || BASE_SEASON)) { clock.season = career.season || BASE_SEASON; changed = true; }
    if (!Array.isArray(clock.acknowledgedMilestones)) { clock.acknowledgedMilestones = []; changed = true; }
    if (!Array.isArray(clock.history)) { clock.history = []; changed = true; }
    if (!Number.isFinite(clock.totalDaysAdvanced)) { clock.totalDaysAdvanced = 0; changed = true; }
    if (!clock.lastContinueFrom) { clock.lastContinueFrom = calendar.currentDate; changed = true; }
    if (!clock.lastContinueTo) { clock.lastContinueTo = calendar.currentDate; changed = true; }
    if (!clock.lastProcessedDate) { clock.lastProcessedDate = calendar.currentDate; changed = true; }
  }
  changed = syncWorldCalendarNews(career) || changed;
  return changed;
}

export function getNextPreseasonDate(career) {
  if (!career?.preseason || career.preseason.phase === 'complete') return null;
  const index = career.preseason.fixtures?.findIndex(fixture => !fixture.played) ?? -1;
  if (index < 0) return null;
  const fixtureDate = career.preseason.fixtures?.[index]?.date;
  if (dayNumber(fixtureDate) !== null) return fixtureDate;
  const model = getCareerSeasonCalendar(career);
  return model.preseasonFriendlyDates[index] || null;
}

export function getUserLeagueFixture(career) {
  if (!career || career.status === 'complete' || career.preseason?.phase !== 'complete') return null;
  return career.fixtures?.[career.roundIndex]?.find(fixture => fixture.homeClubId === career.clubId || fixture.awayClubId === career.clubId) || null;
}

function pendingOffer(career) {
  return (career?.transfers?.incomingOffers || []).find(offer => offer.status === 'pending') || null;
}

export function getCurrentAttention(career) {
  ensureWorldClock(career);
  const current = career.currentDate;
  if (career.status === 'complete') return { type: 'season-complete', blocking: true, date: current, title: 'Season complete', detail: 'Review the final table and season records.' };
  if (career.preseason?.phase === 'ready') return { type: 'preseason-ready', blocking: true, date: current, title: 'Pre-season complete', detail: 'Confirm the start of the competitive season before advancing.' };
  const friendlyDate = getNextPreseasonDate(career);
  if (friendlyDate && compareDates(current, friendlyDate) >= 0) return { type: 'friendly', blocking: true, date: friendlyDate, title: 'Pre-season friendly today', detail: 'Play or quick-sim this friendly before continuing.' };
  const leagueFixture = getUserLeagueFixture(career);
  if (leagueFixture?.date && compareDates(current, leagueFixture.date) >= 0 && !leagueFixture.played) {
    return { type: 'matchday', blocking: true, date: leagueFixture.date, title: `Premier League Matchweek ${leagueFixture.matchweek || leagueFixture.round}`, detail: 'Your competitive fixture is due. Complete Matchday before continuing.', fixtureId: leagueFixture.id };
  }
  const offer = pendingOffer(career);
  if (offer) return { type: 'transfer-offer', blocking: false, date: current, title: 'Transfer offer awaiting response', detail: 'An incoming bid is waiting in Transfers > Offers.', offerId: offer.id };
  return null;
}

function milestoneForDate(career, date) {
  const model = getCareerSeasonCalendar(career);
  const acknowledged = new Set(career.worldClock?.acknowledgedMilestones || []);
  const milestones = [
    { key: seasonScopedKey(career, 'summer-window-open'), date: model.transferWindowOpenDate, type: 'transfer-window-open', title: 'Summer transfer window open', detail: 'Permanent transfer business can now be completed.' },
    { key: seasonScopedKey(career, 'fixture-release'), date: model.fixtureReleaseDate, type: 'fixture-release', title: 'Premier League fixtures released', detail: 'The full 38-match league schedule is now available.' },
    { key: seasonScopedKey(career, 'deadline-day'), date: model.transferDeadlineDate, type: 'deadline-day', title: 'Transfer deadline day', detail: `The summer transfer window closes tonight at ${model.transferDeadlineTime}.` },
    { key: seasonScopedKey(career, 'window-closed'), date: model.transferClosedDate, type: 'transfer-window-closed', title: 'Summer transfer window closed', detail: 'Permanent registrations are now closed.' }
  ];
  return milestones.find(item => item.date === date && !acknowledged.has(item.key)) || null;
}

function acknowledgeMilestone(career, milestone) {
  if (!milestone) return;
  career.worldClock.acknowledgedMilestones ||= [];
  if (!career.worldClock.acknowledgedMilestones.includes(milestone.key)) career.worldClock.acknowledgedMilestones.push(milestone.key);
}

export function shouldProcessTransferDate(date, career = null) {
  const current = dayNumber(date);
  if (current === null) return false;
  const model = career
    ? getCareerSeasonCalendar(career)
    : deriveSeasonCalendar({ season: `${String(date).slice(0, 4)}/${String(Number(String(date).slice(0, 4)) + 1).slice(-2)}` });
  const opens = dayNumber(model.transferWindowOpenDate);
  const closes = dayNumber(model.transferDeadlineDate);
  const afterClose = dayNumber(model.transferClosedDate);
  if (current === afterClose) return true;
  if (current < opens || current > closes) return false;
  const daysOpen = current - opens;
  return daysOpen % 4 === 0 || closes - current <= 4;
}

export function processWorldDay(career, db, date, { processTransfers = true } = {}) {
  ensureWorldClock(career);
  if (dayNumber(date) === null) throw new Error('World clock received an invalid date.');
  const model = getCareerSeasonCalendar(career);
  career.calendar.currentDate = date;
  career.currentDate = date;
  career.calendar.fixturesReleased = compareDates(date, model.fixtureReleaseDate) >= 0;
  career.worldClock.lastProcessedDate = date;
  let transfer = null;
  if (processTransfers && db && shouldProcessTransferDate(date, career)) transfer = processTransferWorld(career, db);
  const newsChanged = syncWorldCalendarNews(career);
  career.updatedAt = new Date().toISOString();
  return { date, transfer, newsChanged };
}

function recordStop(career, { fromDate, toDate, daysAdvanced, reason }) {
  const clock = career.worldClock;
  clock.totalDaysAdvanced += daysAdvanced;
  clock.lastContinueFrom = fromDate;
  clock.lastContinueTo = toDate;
  clock.lastStopReason = reason ? clone(reason) : null;
  clock.history.push({ fromDate, toDate, daysAdvanced, reason: reason ? clone(reason) : null });
  if (clock.history.length > 80) clock.history.splice(0, clock.history.length - 80);
  career.updatedAt = new Date().toISOString();
  return { fromDate, toDate, daysAdvanced, reason: reason ? clone(reason) : null, career };
}

export function continueCareer(career, db, { maxDays = 180, processTransfers = true } = {}) {
  ensureWorldClock(career);
  const fromDate = career.currentDate;
  const blocking = getCurrentAttention(career);
  if (blocking?.blocking) return recordStop(career, { fromDate, toDate: fromDate, daysAdvanced: 0, reason: blocking });

  const currentMilestone = milestoneForDate(career, fromDate);
  if (currentMilestone) {
    acknowledgeMilestone(career, currentMilestone);
    return recordStop(career, { fromDate, toDate: fromDate, daysAdvanced: 0, reason: currentMilestone });
  }

  let currentDate = fromDate;
  for (let offset = 1; offset <= maxDays; offset += 1) {
    currentDate = addDays(currentDate, 1);
    const dayResult = processWorldDay(career, db, currentDate, { processTransfers });

    const milestone = milestoneForDate(career, currentDate);
    if (milestone) {
      acknowledgeMilestone(career, milestone);
      return recordStop(career, { fromDate, toDate: currentDate, daysAdvanced: offset, reason: milestone });
    }

    const attention = getCurrentAttention(career);
    if (attention?.blocking) return recordStop(career, { fromDate, toDate: currentDate, daysAdvanced: offset, reason: attention });

    if (dayResult.transfer?.incomingOffer) {
      const offerReason = {
        type: 'transfer-offer', blocking: false, date: currentDate,
        title: 'Transfer offer received', detail: 'A club has submitted a bid for one of your players. Review it in Transfers > Offers.',
        offerId: dayResult.transfer.incomingOffer.id
      };
      return recordStop(career, { fromDate, toDate: currentDate, daysAdvanced: offset, reason: offerReason });
    }
  }

  return recordStop(career, {
    fromDate,
    toDate: currentDate,
    daysAdvanced: maxDays,
    reason: { type: 'horizon', blocking: false, date: currentDate, title: 'Calendar horizon reached', detail: 'No mandatory event was reached inside the continue horizon.' }
  });
}

export function getNextScheduledEvent(career) {
  ensureWorldClock(career);
  const current = career.currentDate;
  const model = getCareerSeasonCalendar(career);
  const attention = getCurrentAttention(career);
  if (attention) return attention;
  const candidates = [];
  if (compareDates(current, model.transferWindowOpenDate) < 0) candidates.push({ type: 'transfer-window-open', date: model.transferWindowOpenDate, title: 'Summer transfer window opens' });
  if (compareDates(current, model.fixtureReleaseDate) < 0) candidates.push({ type: 'fixture-release', date: model.fixtureReleaseDate, title: 'Premier League fixture release' });
  const friendly = getNextPreseasonDate(career);
  if (friendly && compareDates(current, friendly) < 0) candidates.push({ type: 'friendly', date: friendly, title: 'Pre-season friendly' });
  const fixture = getUserLeagueFixture(career);
  if (fixture?.date && compareDates(current, fixture.date) < 0) candidates.push({ type: 'matchday', date: fixture.date, title: `Premier League Matchweek ${fixture.matchweek || fixture.round}`, fixtureId: fixture.id });
  if (compareDates(current, model.transferDeadlineDate) < 0 && compareDates(current, model.transferWindowOpenDate) >= 0) candidates.push({ type: 'deadline-day', date: model.transferDeadlineDate, title: 'Transfer deadline day' });
  return candidates.sort((a, b) => compareDates(a.date, b.date))[0] || null;
}

export function getWorldClockSnapshot(career) {
  ensureWorldClock(career);
  return {
    currentDate: career.currentDate,
    calendar: clone(career.calendar),
    worldClock: clone(career.worldClock),
    attention: clone(getCurrentAttention(career)),
    nextEvent: clone(getNextScheduledEvent(career)),
    transferWindow: getTransferWindowStatus(career)
  };
}
