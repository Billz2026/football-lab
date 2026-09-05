import * as base from './transfer-market-v061.js';
import * as legacy from './transfers-v050-legacy.js';
import { marketReputationReference, marketValueFloor } from './market-reputation-v061.js';

const clone = value => JSON.parse(JSON.stringify(value));
const moneyRound = (value, step = 250000) => Math.max(step, Math.round(Number(value || 0) / step) * step);

function clubById(db, id) {
  return db?.clubs?.find(club => club.id === id) || null;
}

function playerById(db, id) {
  return db?.players?.find(player => player.id === id) || null;
}

function reputation(db, clubId) {
  return Number(clubById(db, clubId)?.reputation) || 7000;
}

function calibratedAbility(reference) {
  switch (reference?.tier) {
    case 'world-icon': return { currentAbility: 185, potentialAbility: 195 };
    case 'global-superstar': return { currentAbility: 175, potentialAbility: 188 };
    case 'elite': return { currentAbility: 170, potentialAbility: 182 };
    case 'star': return { currentAbility: 165, potentialAbility: 178 };
    default: return null;
  }
}

function transferredThisWindow(career) {
  return new Set((career?.transfers?.completed || []).map(transaction => transaction.playerId).filter(Boolean));
}

function marketSimulationDb(career, db) {
  const moved = transferredThisWindow(career);
  const players = (db?.players || [])
    .filter(player => !moved.has(player.id))
    .map(player => {
      const reference = marketReputationReference(player);
      const calibration = calibratedAbility(reference);
      return calibration ? { ...player, ...calibration } : player;
    });
  return { ...db, players };
}

function addWindowClosedNews(career) {
  if (career.transfers.windowClosedNotified) return false;
  career.transfers.windowClosedNotified = true;
  career.news ||= { schemaVersion: 1, items: [], generatedRounds: [] };
  career.news.items ||= [];
  const id = `news-${career.id}-summer-window-closed-2026`;
  if (!career.news.items.some(item => item.id === id)) {
    career.news.items.push({
      id,
      key: 'summer-window-closed-2026',
      round: career.roundIndex || 0,
      period: 'PM',
      dateLabel: '2 SEP',
      category: 'Transfers',
      source: 'Transfer Desk',
      title: 'Summer transfer window closed',
      body: 'The summer transfer window has closed. Permanent registrations are no longer available until the next registration period.',
      priority: 'normal',
      order: 69900,
      read: false
    });
  }
  return true;
}

export function estimatePlayerValue(player) {
  return Math.max(base.estimatePlayerValue(player), marketValueFloor(player));
}

export const estimateWeeklyWage = base.estimateWeeklyWage;

export function getTransferStance(player, db, career = null, buyerClubId = career?.clubId || null) {
  const ordinary = base.getTransferStance(player, db, career, buyerClubId);
  const reference = marketReputationReference(player);
  if (!reference || !ordinary) return ordinary;

  const value = estimatePlayerValue(player);
  const listed = Boolean(career?.transfers?.listedPlayerIds?.includes(player.id));
  if (listed) {
    return {
      ...ordinary,
      value,
      askingPrice: moneyRound(value * 1.08),
      minimumAcceptable: moneyRound(value * .96),
      listed: true,
      key: true,
      label: 'Available for transfer',
      tone: 'available',
      marketReputationTier: reference.tier
    };
  }

  const years = ordinary.contractYears || 2;
  const sameLeague = Boolean(buyerClubId && buyerClubId !== player.clubId && clubById(db, buyerClubId)?.leagueId === clubById(db, player.clubId)?.leagueId);
  const repGap = buyerClubId ? reputation(db, player.clubId) - reputation(db, buyerClubId) : 0;
  const tier = reference.tier;
  const settings = {
    'world-icon': { ask: 1.88, min: 1.66, tone: 'resistant', label: 'Not for sale' },
    'global-superstar': { ask: 1.76, min: 1.54, tone: 'resistant', label: 'Not for sale' },
    elite: { ask: 1.54, min: 1.32, tone: 'reluctant', label: 'Key player — extremely reluctant to sell' },
    star: { ask: 1.36, min: 1.17, tone: 'reluctant', label: 'Key player — reluctant to sell' }
  }[tier] || { ask: 1.25, min: 1.08, tone: 'reluctant', label: 'Key player — reluctant to sell' };

  let askingMultiplier = settings.ask + Math.max(0, years - 2) * .04;
  let minimumMultiplier = settings.min + Math.max(0, years - 2) * .025;
  if (years <= 1) {
    askingMultiplier -= .16;
    minimumMultiplier -= .15;
  }
  if (sameLeague) {
    askingMultiplier += .06;
    minimumMultiplier += .04;
  }
  if (repGap > 600) {
    askingMultiplier += .08;
    minimumMultiplier += .06;
  }

  return {
    ...ordinary,
    value,
    askingPrice: moneyRound(value * askingMultiplier),
    minimumAcceptable: moneyRound(value * minimumMultiplier),
    key: true,
    elite: ['world-icon', 'global-superstar', 'elite'].includes(tier),
    label: settings.label,
    tone: settings.tone,
    marketReputationTier: tier
  };
}

export function getAskingPrice(player, db, career = null) {
  return getTransferStance(player, db, career)?.askingPrice || estimatePlayerValue(player);
}

export function searchTransferMarket(career, db, filters = {}) {
  return base.searchTransferMarket(career, db, filters)
    .sort((a, b) => estimatePlayerValue(b) - estimatePlayerValue(a) || a.name.localeCompare(b.name));
}

export function getNegotiation(career, db, playerId) {
  const negotiation = base.getNegotiation(career, db, playerId);
  const player = playerById(db, playerId);
  if (!negotiation || !player) return negotiation;
  const stance = getTransferStance(player, db, career, career.clubId);
  negotiation.marketVersion = 611;
  negotiation.sellerStance = stance.label;
  negotiation.sellerTone = stance.tone;
  if (!['fee-accepted', 'contract-countered', 'completed'].includes(negotiation.status)) {
    negotiation.askingPrice = stance.askingPrice;
    negotiation.minimumAcceptable = stance.minimumAcceptable;
  }
  return negotiation;
}

export function submitTransferOffer(career, db, playerId, fee) {
  legacy.ensureTransferState(career, db);
  const window = legacy.getTransferWindowStatus(career);
  if (!window.open) throw new Error('The transfer window is closed.');
  const player = playerById(db, playerId);
  if (!player || player.clubId === career.clubId) throw new Error('Choose a player from another club.');
  const raw = Number(fee);
  if (!Number.isFinite(raw) || raw <= 0) throw new Error('Enter a valid transfer fee.');
  const offer = moneyRound(raw);
  if (offer > (career.transfers.transferBudget || 0)) throw new Error('That bid is above your remaining transfer budget.');

  const negotiation = getNegotiation(career, db, playerId);
  const stance = getTransferStance(player, db, career, career.clubId);
  const seller = clubById(db, player.clubId)?.shortName || clubById(db, player.clubId)?.name || 'The selling club';
  negotiation.offerRounds = (negotiation.offerRounds || 0) + 1;
  negotiation.lastOffer = offer;
  negotiation.askingPrice = stance.askingPrice;
  negotiation.minimumAcceptable = stance.minimumAcceptable;

  if (negotiation.offerRounds > (negotiation.maxOfferRounds || 4)) {
    negotiation.status = 'walked-away';
    negotiation.counterFee = null;
    negotiation.messages.push(`${seller} have ended negotiations after repeated offers failed to meet their valuation.`);
    return { status: 'walked-away', negotiation: clone(negotiation), stance: clone(stance) };
  }

  if (offer >= stance.minimumAcceptable) {
    negotiation.status = 'fee-accepted';
    negotiation.counterFee = null;
    negotiation.messages.push(`${seller} accepted your £${offer.toLocaleString('en-GB')} bid. You can now negotiate personal terms.`);
    return { status: 'accepted', negotiation: clone(negotiation), stance: clone(stance) };
  }

  const ratio = offer / Math.max(1, stance.minimumAcceptable);
  const threshold = stance.tone === 'resistant' ? .84 : stance.tone === 'reluctant' ? .76 : .68;
  if (ratio >= threshold) {
    const firmness = stance.tone === 'resistant' ? .82 : stance.tone === 'reluctant' ? .68 : .58;
    const counter = moneyRound(Math.max(stance.minimumAcceptable, offer + (stance.askingPrice - offer) * firmness));
    negotiation.status = 'countered';
    negotiation.counterFee = Math.min(stance.askingPrice, counter);
    negotiation.messages.push(`${seller} rejected £${offer.toLocaleString('en-GB')} and countered at £${negotiation.counterFee.toLocaleString('en-GB')}.`);
    return { status: 'countered', negotiation: clone(negotiation), stance: clone(stance) };
  }

  negotiation.status = 'rejected';
  negotiation.counterFee = null;
  negotiation.messages.push(stance.tone === 'resistant'
    ? `${seller} immediately rejected the bid. ${player.name} is not for sale unless an exceptional offer changes their position.`
    : `${seller} rejected the bid as well below their valuation.`);
  return { status: 'rejected', negotiation: clone(negotiation), stance: clone(stance) };
}

export function acceptSellerCounter(career, db, playerId) {
  legacy.ensureTransferState(career, db);
  const window = legacy.getTransferWindowStatus(career);
  if (!window.open) throw new Error('The transfer window is closed.');
  const negotiation = getNegotiation(career, db, playerId);
  if (!negotiation?.counterFee) throw new Error('There is no seller counter-offer to accept.');
  if (negotiation.counterFee > career.transfers.transferBudget) throw new Error('The counter-offer is above your remaining transfer budget.');
  negotiation.lastOffer = negotiation.counterFee;
  negotiation.messages.push(`You accepted the £${negotiation.counterFee.toLocaleString('en-GB')} counter-offer. Personal terms are next.`);
  negotiation.counterFee = null;
  negotiation.status = 'fee-accepted';
  return { status: 'accepted', negotiation: clone(negotiation) };
}

export const submitContractOffer = base.submitContractOffer;

export function processTransferWorld(career, db) {
  legacy.ensureTransferState(career, db);
  const window = legacy.getTransferWindowStatus(career);
  if (!window.open) {
    const changed = String(window.currentDate || '') > String(window.closes || '2026-09-01') ? addWindowClosedNews(career) : false;
    return { changed, phaseKey: `D:${window.currentDate || career.currentDate || 'closed'}`, window, aiDeals: [], incomingOffer: null, rumour: null };
  }

  const before = career.transfers.completed.length;
  const simulationDb = marketSimulationDb(career, db);
  const result = base.processTransferWorld(career, simulationDb);
  const newTransactions = career.transfers.completed.slice(before);

  for (const transaction of newTransactions) {
    if (transaction.source === 'ai-v61') {
      transaction.source = 'ai';
      transaction.marketVersion = 61;
      transaction.date ||= career.currentDate || career.calendar?.currentDate || null;
    }
    const realPlayer = playerById(db, transaction.playerId);
    if (realPlayer && transaction.toClubId) realPlayer.clubId = transaction.toClubId;
  }

  const aiDeals = (result.aiDeals || []).map(deal => ({ ...deal, source: deal.source === 'ai-v61' ? 'ai' : deal.source, marketVersion: 61 }));
  return { ...result, aiDeals };
}
