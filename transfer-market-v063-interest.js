/* Football Lab Manager — transfer market interest v0.6.3
 * Adds player willingness on top of seller realism and rivalry rules.
 */
import * as market from './transfer-market-v062-rivalry.js';
import { evaluatePlayerInterest, ensureClubReputationState } from './club-reputation-v1.js';

const clone = value => JSON.parse(JSON.stringify(value));

function playerById(db, id) {
  return db?.players?.find(player => player.id === id) || null;
}

function snapshotMarket(career, db) {
  return {
    transfers: clone(career?.transfers || {}),
    news: clone(career?.news || null),
    updatedAt: career?.updatedAt,
    playerClubs: new Map((db?.players || []).map(player => [player.id, player.clubId]))
  };
}

function restoreMarket(career, db, snapshot) {
  career.transfers = snapshot.transfers;
  if (snapshot.news == null) delete career.news;
  else career.news = snapshot.news;
  career.updatedAt = snapshot.updatedAt;
  for (const player of db?.players || []) {
    if (snapshot.playerClubs.has(player.id)) player.clubId = snapshot.playerClubs.get(player.id);
  }
}

function blockedInterest(player, buyerClubId, career, db) {
  if (!player || !buyerClubId || player.clubId === buyerClubId) return null;
  const interest = evaluatePlayerInterest(player, buyerClubId, career, db);
  return interest.canApproach ? null : interest;
}

export const estimatePlayerValue = market.estimatePlayerValue;
export const estimateWeeklyWage = market.estimateWeeklyWage;
export const searchTransferMarket = market.searchTransferMarket;
export const getAskingPrice = market.getAskingPrice;
export const migrateExistingRivalTransfers = market.migrateExistingRivalTransfers;

export function getPlayerInterest(player, db, career = null, buyerClubId = career?.clubId || null) {
  if (!player || !buyerClubId) return null;
  ensureClubReputationState(career, db);
  return evaluatePlayerInterest(player, buyerClubId, career, db);
}

export function getTransferStance(player, db, career = null, buyerClubId = career?.clubId || null) {
  const stance = market.getTransferStance(player, db, career, buyerClubId);
  if (!stance || !buyerClubId || player?.clubId === buyerClubId) return stance;
  const interest = getPlayerInterest(player, db, career, buyerClubId);
  return { ...stance, playerInterest: interest };
}

export function getNegotiation(career, db, playerId) {
  const negotiation = market.getNegotiation(career, db, playerId);
  if (!negotiation) return null;
  const player = playerById(db, playerId);
  const interest = player ? getPlayerInterest(player, db, career, career?.clubId) : null;
  negotiation.playerInterest = interest;
  return negotiation;
}

export function submitTransferOffer(career, db, playerId, fee) {
  const player = playerById(db, playerId);
  if (!player) throw new Error('Choose a valid player.');
  const interest = getPlayerInterest(player, db, career, career?.clubId);
  if (interest && !interest.canApproach) {
    throw new Error(`PLAYER NOT INTERESTED — ${interest.message}`);
  }
  return market.submitTransferOffer(career, db, playerId, fee);
}

export function acceptSellerCounter(career, db, playerId) {
  const player = playerById(db, playerId);
  const interest = player ? getPlayerInterest(player, db, career, career?.clubId) : null;
  if (interest && !interest.canApproach) {
    throw new Error(`PLAYER NOT INTERESTED — ${interest.message}`);
  }
  return market.acceptSellerCounter(career, db, playerId);
}

export function submitContractOffer(career, db, playerId, weeklyWage, years = 4) {
  const player = playerById(db, playerId);
  const interest = player ? getPlayerInterest(player, db, career, career?.clubId) : null;
  if (interest && !interest.canApproach) {
    throw new Error(`PLAYER NOT INTERESTED — ${interest.message}`);
  }
  return market.submitContractOffer(career, db, playerId, weeklyWage, years);
}

export function processTransferWorld(career, db) {
  ensureClubReputationState(career, db);
  const before = snapshotMarket(career, db);
  const result = market.processTransferWorld(career, db);

  const invalidDeal = (result?.aiDeals || []).find(deal => {
    const current = playerById(db, deal.playerId);
    if (!current) return false;
    const shadow = { ...current, clubId: deal.fromClubId || before.playerClubs.get(current.id) };
    return Boolean(blockedInterest(shadow, deal.toClubId, career, db));
  });

  const invalidIncoming = result?.incomingOffer && (() => {
    const current = playerById(db, result.incomingOffer.playerId);
    if (!current) return false;
    const originalClub = before.playerClubs.get(current.id) || career.clubId;
    const shadow = { ...current, clubId: originalClub };
    return Boolean(blockedInterest(shadow, result.incomingOffer.buyerClubId, career, db));
  })();

  if (!invalidDeal && !invalidIncoming) return result;

  const dateKey = career.currentDate || career.calendar?.currentDate || null;
  restoreMarket(career, db, before);
  career.transfers.marketV61 ||= { schemaVersion: 1, processedDates: [], aiDealsByDate: {}, rumoursByDate: {}, incomingByDate: {} };
  if (dateKey && !career.transfers.marketV61.processedDates.includes(dateKey)) career.transfers.marketV61.processedDates.push(dateKey);
  if (dateKey) {
    career.transfers.marketV61.aiDealsByDate[dateKey] = [];
    delete career.transfers.marketV61.incomingByDate[dateKey];
  }
  career.updatedAt = new Date().toISOString();

  return {
    changed: true,
    phaseKey: result?.phaseKey || (dateKey ? `D:${dateKey}` : null),
    window: result?.window || null,
    aiDeals: [],
    incomingOffer: null,
    rumour: null,
    interestBlocked: true
  };
}
