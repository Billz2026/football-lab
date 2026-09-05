import {
  ensureTransferState,
  getTransferWindowStatus,
  processTransferWorld as processMarketWorld,
  respondToIncomingOffer
} from './transfers-v050.js?v=0.5.0';

export const TRANSFER_WORLD_SCHEMA_VERSION = 2;
export const TRANSFER_WINDOW_CLOSE_ROUND = 2; // retained for old consumers; the real window is date-driven.

const clone = value => JSON.parse(JSON.stringify(value));

function playerById(db, id) {
  return db?.players?.find(player => player.id === id) || null;
}

function currentDate(career) {
  return career?.currentDate || career?.calendar?.currentDate || '2026-06-15';
}

function syncCompatibilityWorld(career, db) {
  if (!career?.transfers) return null;
  const window = getTransferWindowStatus(career);
  const aiTransactions = (career.transfers.completed || []).filter(transaction =>
    transaction.source === 'ai-v61' || transaction.source === 'ai' || transaction.ai === true
  );
  const incomingOffers = (career.transfers.incomingOffers || []).map(offer => ({
    ...offer,
    fee: offer.offeredFee ?? offer.fee ?? 0,
    checkpoint: offer.createdPhase || offer.date || currentDate(career)
  }));
  const rumours = (career.transfers.rumours || []).map(rumour => ({
    ...rumour,
    sellerClubId: rumour.sellerClubId || playerById(db, rumour.playerId)?.clubId || null,
    estimatedFee: rumour.estimatedFee || 0,
    confidence: rumour.confidence || 'Moderate',
    status: rumour.status || 'active'
  }));
  const clubBudgets = Object.fromEntries(
    Object.entries(career.transfers.aiClubs || {}).map(([clubId, state]) => [clubId, state.transferBudget || 0])
  );

  career.transfers.world = {
    schemaVersion: TRANSFER_WORLD_SCHEMA_VERSION,
    initialized: true,
    processedCheckpoints: [...(career.transfers.marketV61?.processedDates || [])],
    clubBudgets,
    aiTransactions,
    incomingOffers,
    rumours,
    deadlineDay: {
      triggered: currentDate(career) >= '2026-09-01',
      deals: aiTransactions.filter(transaction => transaction.date === '2026-09-01').length,
      closedAtCheckpoint: currentDate(career) >= '2026-09-01' ? '2026-09-01' : null
    },
    windowStatus: window.open ? 'open' : 'closed',
    windowLabel: window.open
      ? `Summer 2026 · closes 1 Sep ${window.deadlineTime || '23:00'}`
      : currentDate(career) < window.opens ? 'Summer 2026 · not yet open' : 'Summer 2026 · closed'
  };
  return career.transfers.world;
}

export function isTransferWindowOpen(career) {
  return Boolean(getTransferWindowStatus(career)?.open);
}

export function ensureTransferWorld(career, db) {
  if (!career || !db) return false;
  const before = JSON.stringify(career.transfers?.world || null);
  ensureTransferState(career, db);
  syncCompatibilityWorld(career, db);
  return before !== JSON.stringify(career.transfers.world);
}

export function processTransferWorld(career, db) {
  if (!career || !db) return { changed: false, checkpoint: null };
  ensureTransferState(career, db);
  const result = processMarketWorld(career, db);
  syncCompatibilityWorld(career, db);
  return {
    changed: Boolean(result.changed),
    checkpoint: result.phaseKey || `D:${currentDate(career)}`,
    aiDeals: result.aiDeals || [],
    incomingOffer: result.incomingOffer || null,
    rumour: result.rumour || null
  };
}

export function getIncomingOffers(career, { includeResolved = true } = {}) {
  const offers = career?.transfers?.incomingOffers || [];
  const selected = includeResolved ? offers : offers.filter(offer => offer.status === 'pending');
  return clone(selected.map(offer => ({ ...offer, fee: offer.offeredFee ?? offer.fee ?? 0 })));
}

export function acceptIncomingOffer(career, db, offerId) {
  ensureTransferState(career, db);
  const result = respondToIncomingOffer(career, db, offerId, 'accept');
  syncCompatibilityWorld(career, db);
  return clone(result.transaction || result.offer || result);
}

export function rejectIncomingOffer(career, db, offerId) {
  ensureTransferState(career, db);
  const result = respondToIncomingOffer(career, db, offerId, 'reject');
  syncCompatibilityWorld(career, db);
  return clone(result.offer || result);
}

export function getTransferWorldSnapshot(career) {
  const world = career?.transfers?.world;
  if (!world) return null;
  return clone({
    windowStatus: world.windowStatus,
    windowLabel: world.windowLabel,
    aiTransactions: world.aiTransactions || [],
    incomingOffers: world.incomingOffers || [],
    rumours: world.rumours || [],
    clubBudgets: world.clubBudgets || {},
    deadlineDay: world.deadlineDay || { triggered: false, deals: 0 }
  });
}
