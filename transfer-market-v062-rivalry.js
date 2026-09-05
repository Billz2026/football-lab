import * as market from './transfer-market-v061-realism.js';
import { rivalryDecision } from './transfer-rivalries-v1.js';

const clone = value => JSON.parse(JSON.stringify(value));
const moneyRound = (value, step = 250000) => Math.max(step, Math.round(Number(value || 0) / step) * step);

function playerById(db, id) {
  return db?.players?.find(player => player.id === id) || null;
}

function snapshotMarket(career, db) {
  return {
    transfers: clone(career.transfers || {}),
    news: clone(career.news || null),
    updatedAt: career.updatedAt,
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

function decisionForPlayer(player, db, career, buyerClubId, stance = null) {
  if (!player || !buyerClubId || player.clubId === buyerClubId) return { blocked: false, rule: null, multiplier: 1 };
  const baseStance = stance || market.getTransferStance(player, db, career, buyerClubId);
  return rivalryDecision(db, player.clubId, buyerClubId, player, baseStance, career);
}

export const estimatePlayerValue = market.estimatePlayerValue;
export const estimateWeeklyWage = market.estimateWeeklyWage;
export const searchTransferMarket = market.searchTransferMarket;

export function getTransferStance(player, db, career = null, buyerClubId = career?.clubId || null) {
  const stance = market.getTransferStance(player, db, career, buyerClubId);
  if (!stance || !buyerClubId || player?.clubId === buyerClubId) return stance;
  const decision = rivalryDecision(db, player.clubId, buyerClubId, player, stance, career);
  if (!decision.rule) return stance;

  const askingPrice = moneyRound(Math.max(stance.askingPrice, stance.value * decision.multiplier));
  const minimumAcceptable = decision.blocked
    ? askingPrice
    : moneyRound(Math.max(stance.minimumAcceptable, stance.value * Math.max(1.25, decision.multiplier - .2)));

  return {
    ...stance,
    askingPrice,
    minimumAcceptable,
    rivalry: decision.rule.label,
    rivalryLevel: decision.rule.level,
    rivalryBlocked: decision.blocked,
    rivalryRareException: Boolean(decision.rareException),
    label: decision.blocked ? 'Rival club — direct transfer effectively unavailable' : `${stance.label} · rivalry premium`,
    tone: decision.blocked ? 'resistant' : stance.tone
  };
}

export function getAskingPrice(player, db, career = null) {
  return getTransferStance(player, db, career, career?.clubId)?.askingPrice || market.getAskingPrice(player, db, career);
}

export function getNegotiation(career, db, playerId) {
  const player = playerById(db, playerId);
  if (!player) return null;
  const stance = getTransferStance(player, db, career, career?.clubId);
  const negotiation = market.getNegotiation(career, db, playerId);
  if (!negotiation) return null;
  negotiation.sellerStance = stance.label;
  negotiation.sellerTone = stance.tone;
  negotiation.rivalry = stance.rivalry || null;
  negotiation.rivalryBlocked = Boolean(stance.rivalryBlocked);
  if (!['fee-accepted', 'contract-countered', 'completed'].includes(negotiation.status)) {
    negotiation.askingPrice = stance.askingPrice;
    negotiation.minimumAcceptable = stance.minimumAcceptable;
  }
  return negotiation;
}

export function submitTransferOffer(career, db, playerId, fee) {
  const player = playerById(db, playerId);
  if (!player) throw new Error('Choose a valid player.');
  const stance = getTransferStance(player, db, career, career?.clubId);
  if (stance?.rivalryBlocked) {
    throw new Error(`${stance.rivalry}: the selling club will not sanction a direct move to this rival under normal circumstances.`);
  }
  return market.submitTransferOffer(career, db, playerId, fee);
}

export function acceptSellerCounter(career, db, playerId) {
  const player = playerById(db, playerId);
  const stance = player ? getTransferStance(player, db, career, career?.clubId) : null;
  if (stance?.rivalryBlocked) {
    throw new Error(`${stance.rivalry}: this direct rival transfer is no longer available.`);
  }
  return market.acceptSellerCounter(career, db, playerId);
}

export function submitContractOffer(career, db, playerId, weeklyWage, years = 4) {
  const player = playerById(db, playerId);
  const stance = player ? getTransferStance(player, db, career, career?.clubId) : null;
  if (stance?.rivalryBlocked) {
    throw new Error(`${stance.rivalry}: the transfer cannot proceed between these clubs.`);
  }
  return market.submitContractOffer(career, db, playerId, weeklyWage, years);
}

export function processTransferWorld(career, db) {
  const before = snapshotMarket(career, db);
  const result = market.processTransferWorld(career, db);

  const forbiddenAiDeal = (result.aiDeals || []).find(deal => {
    const player = playerById(db, deal.playerId) || (db?.players || []).find(item => item.id === deal.playerId);
    if (!player) return false;
    const originalClubId = before.playerClubs.get(player.id) || deal.fromClubId;
    const shadowPlayer = { ...player, clubId: originalClubId };
    const baseStance = market.getTransferStance(shadowPlayer, db, career, deal.toClubId);
    return rivalryDecision(db, originalClubId, deal.toClubId, shadowPlayer, baseStance, career).blocked;
  });

  const forbiddenIncoming = result.incomingOffer && (() => {
    const player = playerById(db, result.incomingOffer.playerId);
    if (!player) return false;
    const originalClubId = before.playerClubs.get(player.id) || career.clubId;
    const shadowPlayer = { ...player, clubId: originalClubId };
    const baseStance = market.getTransferStance(shadowPlayer, db, career, result.incomingOffer.buyerClubId);
    return rivalryDecision(db, originalClubId, result.incomingOffer.buyerClubId, shadowPlayer, baseStance, career).blocked;
  })();

  if (!forbiddenAiDeal && !forbiddenIncoming) return result;

  const dateKey = career.currentDate || career.calendar?.currentDate || null;
  restoreMarket(career, db, before);
  career.transfers.marketV61 ||= { schemaVersion: 1, processedDates: [], aiDealsByDate: {}, rumoursByDate: {}, incomingByDate: {} };
  if (dateKey && !career.transfers.marketV61.processedDates.includes(dateKey)) career.transfers.marketV61.processedDates.push(dateKey);
  if (dateKey) career.transfers.marketV61.aiDealsByDate[dateKey] = [];
  career.updatedAt = new Date().toISOString();

  return {
    changed: true,
    phaseKey: result.phaseKey,
    window: result.window,
    aiDeals: [],
    incomingOffer: null,
    rumour: null,
    rivalryBlocked: true
  };
}
