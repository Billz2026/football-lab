import * as legacy from './transfers-v050-legacy.js';
import * as market from './transfer-market-v062-rivalry.js';

export * from './transfers-v050-legacy.js';

const MS_PER_DAY = 86400000;
const WORLD_PHASE_EPOCH = '2026-01-01';

function validDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''));
}

function worldClockCareer(career) {
  return Boolean(career?.worldClock?.schemaVersion && validDate(career?.currentDate || career?.calendar?.currentDate));
}

function dayNumber(value) {
  if (!validDate(value)) return null;
  return Math.floor(Date.parse(`${value}T00:00:00Z`) / MS_PER_DAY);
}

function shortDate(value) {
  if (!validDate(value)) return value || '—';
  const date = new Date(`${value}T12:00:00Z`);
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
    .format(date)
    .toUpperCase();
}

function patchRound(item, round) {
  if (item && typeof item === 'object' && 'round' in item) item.round = round;
}

function patchResult(result, round) {
  if (!result || typeof result !== 'object') return result;
  patchRound(result.transaction, round);
  patchRound(result.offer, round);
  patchRound(result.incomingOffer, round);
  patchRound(result.rumour, round);
  if (Array.isArray(result.aiDeals)) result.aiDeals.forEach(item => patchRound(item, round));
  return result;
}

function patchNewTransferState(career, before, currentDate, realRound) {
  const state = career.transfers;
  if (!state) return;
  (state.completed || []).slice(before.completed).forEach(item => patchRound(item, realRound));
  (state.incomingOffers || []).slice(before.offers).forEach(item => patchRound(item, realRound));
  (state.rumours || []).slice(before.rumours).forEach(item => patchRound(item, realRound));
  (career.news?.items || []).slice(before.news).forEach(item => {
    if (item.category === 'Transfers' && /^(PRE-SEASON|MATCHWEEK)/.test(String(item.dateLabel || ''))) item.dateLabel = shortDate(currentDate);
    patchRound(item, realRound);
  });
}

function withCalendarDate(career, callback, { uniquePhase = false } = {}) {
  if (!worldClockCareer(career)) return callback();

  const currentDate = career.currentDate || career.calendar.currentDate;
  const original = {
    preseason: career.preseason,
    roundIndex: career.roundIndex,
    fixtures: career.fixtures
  };
  const realRound = Number.isFinite(original.roundIndex) ? original.roundIndex : 0;
  const epoch = dayNumber(WORLD_PHASE_EPOCH) || 0;
  const current = dayNumber(currentDate) || epoch;
  const syntheticRound = uniquePhase ? 500 + Math.max(0, current - epoch) : Math.max(0, realRound);
  const fakeFixtures = [];
  fakeFixtures.length = syntheticRound + 1;
  fakeFixtures[syntheticRound] = [{ date: currentDate }];
  const before = {
    completed: career.transfers?.completed?.length || 0,
    offers: career.transfers?.incomingOffers?.length || 0,
    rumours: career.transfers?.rumours?.length || 0,
    news: career.news?.items?.length || 0
  };

  career.preseason = original.preseason ? { ...original.preseason, phase: 'complete' } : null;
  career.roundIndex = syntheticRound;
  career.fixtures = fakeFixtures;

  try {
    const result = callback();
    patchNewTransferState(career, before, currentDate, realRound);
    return patchResult(result, realRound);
  } finally {
    career.preseason = original.preseason;
    career.roundIndex = original.roundIndex;
    career.fixtures = original.fixtures;
  }
}

// V0.6.2 explicit exports override the legacy star exports while preserving the proven
// ownership, contract and budget infrastructure underneath. Rivalry rules are enforced
// by the market wrapper for user, incoming and AI-to-AI business.
export const estimatePlayerValue = market.estimatePlayerValue;
export const estimateWeeklyWage = market.estimateWeeklyWage;
export const getTransferStance = market.getTransferStance;
export const getAskingPrice = market.getAskingPrice;
export const searchTransferMarket = market.searchTransferMarket;
export const getNegotiation = market.getNegotiation;

export function getTransferWindowStatus(career) {
  return withCalendarDate(career, () => legacy.getTransferWindowStatus(career));
}

export function processTransferWorld(career, db) {
  return withCalendarDate(career, () => market.processTransferWorld(career, db), { uniquePhase: true });
}

export function submitTransferOffer(career, db, playerId, fee) {
  return withCalendarDate(career, () => market.submitTransferOffer(career, db, playerId, fee));
}

export function acceptSellerCounter(career, db, playerId) {
  return withCalendarDate(career, () => market.acceptSellerCounter(career, db, playerId));
}

export function submitContractOffer(career, db, playerId, weeklyWage, years = 4) {
  return withCalendarDate(career, () => market.submitContractOffer(career, db, playerId, weeklyWage, years));
}

export function respondToIncomingOffer(career, db, offerId, action, counterFee = null) {
  return withCalendarDate(career, () => legacy.respondToIncomingOffer(career, db, offerId, action, counterFee));
}

export function migrateExistingRivalTransfers(career, db) {
  return market.migrateExistingRivalTransfers(career, db);
}

// Load transfer interaction in the browser and immediately repair old AI-only hard-rival
// transfers when a saved career opens. User-completed deals are never auto-reverted.
if (typeof window !== 'undefined') {
  import('./career-transfer-negotiation-v061.js').catch(error => console.error('V0.6.2 transfer negotiation UI:', error));
  import('./career-transfer-negotiation-v061-finish.js').catch(error => console.error('V0.6.2 transfer completion UI:', error));

  const checkedCareers = new WeakSet();
  let migrationQueued = false;
  const runRivalryMigration = async () => {
    const career = window.FLMManager?.activeCareer;
    if (!career || checkedCareers.has(career) || !window.FLMManager?.loadDatabase) return;
    checkedCareers.add(career);
    try {
      const db = await window.FLMManager.loadDatabase();
      const reverted = market.migrateExistingRivalTransfers(career, db);
      if (reverted.length) {
        localStorage.setItem('flm-career-save', JSON.stringify(career));
        window.dispatchEvent(new CustomEvent('flm:rivalry-migration', { detail: { reverted } }));
      }
    } catch (error) {
      checkedCareers.delete(career);
      console.error('V0.6.2 rivalry save migration:', error);
    }
  };
  const queueRivalryMigration = () => {
    if (migrationQueued) return;
    migrationQueued = true;
    queueMicrotask(() => {
      migrationQueued = false;
      runRivalryMigration();
    });
  };
  new MutationObserver(queueRivalryMigration).observe(document.body, { childList: true, subtree: true });
  document.addEventListener('click', queueRivalryMigration, true);
  queueRivalryMigration();
}
