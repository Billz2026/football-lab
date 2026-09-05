import { getTransferWindowStatus, processTransferWorld } from './transfers-v050.js';

export const WORLD_CLOCK_SCHEMA_VERSION = 1;
export const CAREER_CALENDAR_SCHEMA_VERSION = 2;
export const TAKEOVER_DATE = '2026-06-05';
export const TRANSFER_OPEN_DATE = '2026-06-15';
export const FIXTURE_RELEASE_DATE = '2026-06-19';
export const TRANSFER_DEADLINE_DATE = '2026-09-01';
export const TRANSFER_CLOSED_DATE = '2026-09-02';
export const PRESEASON_FIXTURE_DATES = Object.freeze([
  '2026-07-11',
  '2026-07-18',
  '2026-07-25',
  '2026-08-01',
  '2026-08-08'
]);

const MS_PER_DAY = 86400000;
const clone = value => JSON.parse(JSON.stringify(value));

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

function inferLegacyDate(career) {
  if (!career) return TAKEOVER_DATE;
  if (career.currentDate && dayNumber(career.currentDate) !== null) return career.currentDate;
  if (career.calendar?.currentDate && dayNumber(career.calendar.currentDate) !== null) return career.calendar.currentDate;
  if (career.preseason?.phase === 'complete') {
    const lastMatchDate = career.lastMatch?.date;
    if (lastMatchDate && dayNumber(lastMatchDate) !== null) return lastMatchDate;
    const round = Math.max(0, Math.min(career.roundIndex || 0, Math.max(0, (career.fixtures?.length || 1) - 1)));
    return career.fixtures?.[round]?.find(fixture => fixture.date)?.date || career.seasonStartDate || '2026-08-21';
  }
  const played = career.preseason?.fixtures?.filter(fixture => fixture.played).length || 0;
  if (played > 0) return PRESEASON_FIXTURE_DATES[Math.min(played - 1, PRESEASON_FIXTURE_DATES.length - 1)];
  return TAKEOVER_DATE;
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
  const current = career.calendar.currentDate;
  let changed = false;
  if (compareDates(current, TRANSFER_OPEN_DATE) >= 0) {
    changed = addNewsOnce(career, {
      key: 'summer-window-opens', dateLabel: '15 JUN', category: 'Transfers', source: 'Football Operations',
      title: 'Summer transfer window opens',
      body: 'Premier League clubs can now complete permanent transfers. The summer window remains open until 23:00 BST on 1 September.',
      priority: 'important', order: 33000
    }) || changed;
  }
  if (compareDates(current, FIXTURE_RELEASE_DATE) >= 0) {
    changed = addNewsOnce(career, {
      key: 'fixture-release', dateLabel: '19 JUN', category: 'Competitions', source: 'Premier League',
      title: 'Premier League fixtures released',
      body: 'The full 38-match 2026/27 league schedule has been published. Every club will play 19 home matches and 19 away matches, with the opening round beginning on 21 August.',
      priority: 'important', order: 38000
    }) || changed;
  }
  if (compareDates(current, TRANSFER_DEADLINE_DATE) >= 0) {
    changed = addNewsOnce(career, {
      key: 'transfer-deadline-day', dateLabel: '1 SEP', category: 'Transfers', source: 'Transfer Desk',
      title: 'Transfer deadline day',
      body: 'The summer transfer window closes tonight at 23:00 BST. Any permanent transfer business must be completed before the deadline.',
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
  const defaults = {
    schemaVersion: CAREER_CALENDAR_SCHEMA_VERSION,
    takeoverDate: TAKEOVER_DATE,
    transferWindowOpenDate: TRANSFER_OPEN_DATE,
    fixtureReleaseDate: FIXTURE_RELEASE_DATE,
    fixtureReleaseTime: '10:00 BST'
  };
  for (const [key, value] of Object.entries(defaults)) {
    if (calendar[key] !== value) {
      calendar[key] = value;
      changed = true;
    }
  }
  if (dayNumber(calendar.currentDate) === null) {
    calendar.currentDate = inferLegacyDate(career);
    changed = true;
  }
  const released = compareDates(calendar.currentDate, FIXTURE_RELEASE_DATE) >= 0 || Boolean(career.preseason?.fixtures?.some(fixture => fixture.played)) || (career.roundIndex || 0) > 0;
  if (calendar.fixturesReleased !== released) {
    calendar.fixturesReleased = released;
    changed = true;
  }
  if (career.currentDate !== calendar.currentDate) {
    career.currentDate = calendar.currentDate;
    changed = true;
  }
  if (!career.worldClock || career.worldClock.schemaVersion !== WORLD_CLOCK_SCHEMA_VERSION) {
    career.worldClock = {
      schemaVersion: WORLD_CLOCK_SCHEMA_VERSION,
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
  return index >= 0 ? PRESEASON_FIXTURE_DATES[index] || null : null;
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
  if (friendlyDate && compareDates(current, friendlyDate) >= 0) return { type: 'friendly', blocking: true, date: friendlyDate, title: 'Pre-season friendly today', detail: 'Play or quick-sim the scheduled friendly before continuing.' };
  const leagueFixture = getUserLeagueFixture(career);
  if (leagueFixture?.date && compareDates(current, leagueFixture.date) >= 0 && !leagueFixture.played) {
    return { type: 'matchday', blocking: true, date: leagueFixture.date, title: `Premier League Matchweek ${leagueFixture.matchweek || leagueFixture.round}`, detail: 'Your competitive fixture is due. Complete Matchday before continuing.', fixtureId: leagueFixture.id };
  }
  const offer = pendingOffer(career);
  if (offer) return { type: 'transfer-offer', blocking: false, date: current, title: 'Transfer offer awaiting response', detail: 'An incoming bid is waiting in Transfers > Offers.', offerId: offer.id };
  return null;
}

function milestoneForDate(career, date) {
  const acknowledged = new Set(career.worldClock?.acknowledgedMilestones || []);
  const milestones = [
    { key: 'summer-window-open', date: TRANSFER_OPEN_DATE, type: 'transfer-window-open', title: 'Summer transfer window open', detail: 'Permanent transfer business can now be completed.' },
    { key: 'fixture-release', date: FIXTURE_RELEASE_DATE, type: 'fixture-release', title: 'Premier League fixtures released', detail: 'The full 38-match league schedule is now available.' },
    { key: 'deadline-day', date: TRANSFER_DEADLINE_DATE, type: 'deadline-day', title: 'Transfer deadline day', detail: 'The summer transfer window closes tonight at 23:00 BST.' },
    { key: 'window-closed', date: TRANSFER_CLOSED_DATE, type: 'transfer-window-closed', title: 'Summer transfer window closed', detail: 'Permanent registrations are now closed.' }
  ];
  return milestones.find(item => item.date === date && !acknowledged.has(item.key)) || null;
}

function acknowledgeMilestone(career, milestone) {
  if (!milestone) return;
  career.worldClock.acknowledgedMilestones ||= [];
  if (!career.worldClock.acknowledgedMilestones.includes(milestone.key)) career.worldClock.acknowledgedMilestones.push(milestone.key);
}

export function shouldProcessTransferDate(date) {
  const current = dayNumber(date);
  const opens = dayNumber(TRANSFER_OPEN_DATE);
  const closes = dayNumber(TRANSFER_DEADLINE_DATE);
  const afterClose = dayNumber(TRANSFER_CLOSED_DATE);
  if (current === null || opens === null || closes === null) return false;
  if (current === afterClose) return true;
  if (current < opens || current > closes) return false;
  const daysOpen = current - opens;
  return daysOpen % 4 === 0 || closes - current <= 4;
}

export function processWorldDay(career, db, date, { processTransfers = true } = {}) {
  ensureWorldClock(career);
  if (dayNumber(date) === null) throw new Error('World clock received an invalid date.');
  career.calendar.currentDate = date;
  career.currentDate = date;
  career.calendar.fixturesReleased = compareDates(date, FIXTURE_RELEASE_DATE) >= 0;
  career.worldClock.lastProcessedDate = date;
  let transfer = null;
  if (processTransfers && db && shouldProcessTransferDate(date)) transfer = processTransferWorld(career, db);
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
  const attention = getCurrentAttention(career);
  if (attention) return attention;
  const candidates = [];
  if (compareDates(current, TRANSFER_OPEN_DATE) < 0) candidates.push({ type: 'transfer-window-open', date: TRANSFER_OPEN_DATE, title: 'Summer transfer window opens' });
  if (compareDates(current, FIXTURE_RELEASE_DATE) < 0) candidates.push({ type: 'fixture-release', date: FIXTURE_RELEASE_DATE, title: 'Premier League fixture release' });
  const friendly = getNextPreseasonDate(career);
  if (friendly && compareDates(current, friendly) < 0) candidates.push({ type: 'friendly', date: friendly, title: 'Pre-season friendly' });
  const fixture = getUserLeagueFixture(career);
  if (fixture?.date && compareDates(current, fixture.date) < 0) candidates.push({ type: 'matchday', date: fixture.date, title: `Premier League Matchweek ${fixture.matchweek || fixture.round}`, fixtureId: fixture.id });
  if (compareDates(current, TRANSFER_DEADLINE_DATE) < 0 && compareDates(current, TRANSFER_OPEN_DATE) >= 0) candidates.push({ type: 'deadline-day', date: TRANSFER_DEADLINE_DATE, title: 'Transfer deadline day' });
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
