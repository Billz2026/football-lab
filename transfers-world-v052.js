import { autoPickLineup } from './manager-core.js?v=0.3.0';
import {
  ensureTransferState,
  estimatePlayerValue,
  estimateWeeklyWage
} from './transfers-v050.js?v=0.5.0';

export const TRANSFER_WORLD_SCHEMA_VERSION = 1;
export const TRANSFER_WINDOW_CLOSE_ROUND = 2;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const clone = value => JSON.parse(JSON.stringify(value));

function hashString(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed) {
  let state = hashString(seed) || 1;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const moneyRound = (value, step = 250000) => Math.max(step, Math.round(value / step) * step);
const wageRound = value => Math.max(1000, Math.round(value / 500) * 500);

function clubById(db, id) {
  return db.clubs.find(club => club.id === id);
}

function playerById(db, id) {
  return db.players.find(player => player.id === id);
}

function realClubs(db) {
  return db.clubs.filter(club => !club.isPlaceholder);
}

function realSquad(db, clubId) {
  return db.players.filter(player => player.clubId === clubId && !player.isPlaceholder);
}

function minimumGroupSize(group) {
  return { GK: 2, DEF: 6, MID: 5, ATT: 3 }[group] || 2;
}

function canSellPlayer(db, player) {
  if (!player?.clubId) return false;
  const group = player.positionGroup || 'MID';
  const sameGroup = realSquad(db, player.clubId).filter(item => item.positionGroup === group);
  if (sameGroup.length <= minimumGroupSize(group)) return false;
  const ranked = realSquad(db, player.clubId)
    .sort((a, b) => (b.currentAbility || 0) - (a.currentAbility || 0));
  const rank = ranked.findIndex(item => item.id === player.id);
  return rank < 0 || rank >= 2;
}

function deriveAiBudget(club) {
  const reputation = club?.reputation || 7200;
  return moneyRound(clamp(28000000 + (reputation - 7000) * 22000, 18000000, 210000000), 1000000);
}

function checkpointKey(career) {
  const preseason = career.preseason;
  if (preseason && preseason.phase !== 'complete') {
    const played = preseason.fixtures?.filter(fixture => fixture.played).length || 0;
    return `ps-${played}`;
  }
  return `mw-${career.roundIndex || 0}`;
}

function checkpointOrder(key) {
  if (key.startsWith('ps-')) return Number(key.slice(3)) || 0;
  return 100 + (Number(key.slice(3)) || 0);
}

function currentWindowStatus(career) {
  if (career.preseason && career.preseason.phase !== 'complete') return 'open';
  return (career.roundIndex || 0) < TRANSFER_WINDOW_CLOSE_ROUND ? 'open' : 'closed';
}

export function isTransferWindowOpen(career) {
  return currentWindowStatus(career) === 'open';
}

function ensureNews(career) {
  career.news ||= { schemaVersion: 1, items: [], generatedRounds: [] };
  career.news.items ||= [];
  career.news.generatedRounds ||= [];
}

function addNews(career, item) {
  ensureNews(career);
  if (career.news.items.some(existing => existing.id === item.id)) return false;
  career.news.items.push(item);
  return true;
}

function transferDateLabel(career) {
  const preseason = career.preseason;
  if (preseason && preseason.phase !== 'complete') {
    const played = preseason.fixtures?.filter(fixture => fixture.played).length || 0;
    return played ? `PRE-SEASON · W${played}` : 'PRE-SEASON';
  }
  return career.roundIndex ? `MW ${career.roundIndex}` : 'PRE-SEASON';
}

function addCompletedTransferNews(career, db, transaction) {
  const player = playerById(db, transaction.playerId);
  const seller = clubById(db, transaction.fromClubId);
  const buyer = clubById(db, transaction.toClubId);
  return addNews(career, {
    id: `news-${career.id}-world-transfer-${transaction.id}`,
    key: `world-transfer-${transaction.id}`,
    round: career.roundIndex || 0,
    period: 'PM',
    dateLabel: transferDateLabel(career),
    category: 'Transfers',
    source: transaction.deadlineDay ? 'Deadline Day' : 'Transfer Desk',
    title: `${buyer?.shortName || buyer?.name || 'Club'} complete ${player?.name || 'signing'}`,
    body: `${buyer?.name || 'The buying club'} have signed ${player?.name || 'the player'} from ${seller?.name || 'the selling club'} for £${transaction.fee.toLocaleString('en-GB')}.`,
    priority: transaction.deadlineDay ? 'important' : 'normal',
    relatedClubId: transaction.toClubId,
    relatedPlayerId: transaction.playerId,
    order: 61000 + (career.transfers.world?.aiTransactions?.length || 0),
    read: false
  });
}

function addRumourNews(career, db, rumour) {
  const player = playerById(db, rumour.playerId);
  const buyer = clubById(db, rumour.buyerClubId);
  const seller = clubById(db, rumour.sellerClubId);
  return addNews(career, {
    id: `news-${career.id}-rumour-${rumour.id}`,
    key: `rumour-${rumour.id}`,
    round: career.roundIndex || 0,
    period: 'AM',
    dateLabel: transferDateLabel(career),
    category: 'Transfers',
    source: 'Transfer Rumours',
    title: `${buyer?.shortName || buyer?.name || 'Club'} linked with ${player?.name || 'player'}`,
    body: `${buyer?.name || 'The club'} are monitoring ${player?.name || 'the player'} at ${seller?.name || 'his current club'}. Interest is rated ${rumour.confidence.toLowerCase()}; no deal has been agreed.`,
    priority: 'normal',
    relatedClubId: rumour.buyerClubId,
    relatedPlayerId: rumour.playerId,
    order: 60000 + (career.transfers.world?.rumours?.length || 0),
    read: false
  });
}

function addIncomingOfferNews(career, db, offer) {
  const player = playerById(db, offer.playerId);
  const buyer = clubById(db, offer.buyerClubId);
  return addNews(career, {
    id: `news-${career.id}-incoming-${offer.id}`,
    key: `incoming-${offer.id}`,
    round: career.roundIndex || 0,
    period: 'AM',
    dateLabel: transferDateLabel(career),
    category: 'Transfers',
    source: 'Transfer Desk',
    title: `${buyer?.shortName || buyer?.name || 'Club'} bid for ${player?.name || 'your player'}`,
    body: `${buyer?.name || 'The buying club'} have submitted a £${offer.fee.toLocaleString('en-GB')} offer for ${player?.name || 'your player'}. The bid is awaiting your decision.`,
    priority: 'important',
    relatedClubId: career.clubId,
    relatedPlayerId: offer.playerId,
    order: 62000 + (career.transfers.world?.incomingOffers?.length || 0),
    read: false
  });
}

export function ensureTransferWorld(career, db) {
  if (!career || !db) return false;
  let changed = ensureTransferState(career, db);
  const current = career.transfers.world;
  if (!current || current.schemaVersion !== TRANSFER_WORLD_SCHEMA_VERSION) {
    career.transfers.world = {
      schemaVersion: TRANSFER_WORLD_SCHEMA_VERSION,
      initialized: false,
      processedCheckpoints: [],
      clubBudgets: Object.fromEntries(realClubs(db).map(club => [club.id, deriveAiBudget(club)])),
      aiTransactions: [],
      incomingOffers: [],
      rumours: [],
      deadlineDay: { triggered: false, deals: 0, closedAtCheckpoint: null },
      windowStatus: currentWindowStatus(career),
      windowLabel: 'Summer 2026 · closes after Matchweek 2'
    };
    changed = true;
  }
  const world = career.transfers.world;
  for (const key of ['processedCheckpoints', 'aiTransactions', 'incomingOffers', 'rumours']) {
    if (!Array.isArray(world[key])) {
      world[key] = [];
      changed = true;
    }
  }
  if (!world.clubBudgets || typeof world.clubBudgets !== 'object') {
    world.clubBudgets = Object.fromEntries(realClubs(db).map(club => [club.id, deriveAiBudget(club)]));
    changed = true;
  }
  world.windowStatus = currentWindowStatus(career);
  return changed;
}

function buyerNeedScore(db, clubId, group) {
  const squad = realSquad(db, clubId);
  const grouped = squad.filter(player => player.positionGroup === group);
  const target = { GK: 3, DEF: 8, MID: 7, ATT: 5 }[group] || 5;
  const countNeed = Math.max(0, target - grouped.length) * 20;
  const average = grouped.length
    ? grouped.reduce((sum, player) => sum + (player.currentAbility || 100), 0) / grouped.length
    : 90;
  return countNeed + Math.max(0, 132 - average);
}

function chooseBuyerAndGroup(career, db, random) {
  const world = career.transfers.world;
  const options = realClubs(db)
    .filter(club => club.id !== career.clubId)
    .filter(club => (world.clubBudgets[club.id] || 0) >= 6000000)
    .flatMap(club => ['GK', 'DEF', 'MID', 'ATT'].map(group => ({
      club,
      group,
      score: buyerNeedScore(db, club.id, group) + random() * 18
    })))
    .sort((a, b) => b.score - a.score);
  return options[0] || null;
}

function chooseAiTarget(career, db, buyerId, group, random) {
  const budget = career.transfers.world.clubBudgets[buyerId] || 0;
  const buyer = clubById(db, buyerId);
  const buyerRep = buyer?.reputation || 7500;
  const candidates = db.players
    .filter(player => !player.isPlaceholder && player.clubId && player.clubId !== buyerId && player.clubId !== career.clubId)
    .filter(player => player.positionGroup === group)
    .filter(player => canSellPlayer(db, player))
    .map(player => {
      const value = estimatePlayerValue(player);
      const sellerRep = clubById(db, player.clubId)?.reputation || 7000;
      const age = player.reportedAge || 27;
      const ambitionFit = buyerRep + 900 >= sellerRep ? 12 : -6;
      const ageFit = age <= 24 ? 15 : age <= 28 ? 9 : age <= 31 ? 2 : -10;
      const abilityFit = (player.currentAbility || 100) - 105;
      const fee = moneyRound(value * (1.02 + random() * .22));
      const affordable = fee <= budget * .78;
      return { player, fee, score: ambitionFit + ageFit + abilityFit + random() * 22, affordable };
    })
    .filter(item => item.affordable)
    .sort((a, b) => b.score - a.score);
  return candidates[0] || null;
}

function completeAiTransfer(career, db, buyerId, target, checkpoint, deadlineDay = false) {
  const world = career.transfers.world;
  const player = target.player;
  const fromClubId = player.clubId;
  const fee = target.fee;
  if (!fromClubId || fromClubId === buyerId) return null;
  if ((world.clubBudgets[buyerId] || 0) < fee) return null;

  const transaction = {
    id: `ai-${hashString(`${career.id}:${checkpoint}:${buyerId}:${player.id}:${world.aiTransactions.length}`).toString(16)}`,
    playerId: player.id,
    fromClubId,
    toClubId: buyerId,
    fee,
    weeklyWage: wageRound(estimateWeeklyWage(player) * (1.04 + (hashString(`${buyerId}:${player.id}:wage`) % 8) / 100)),
    contractYears: (player.reportedAge || 26) >= 30 ? 2 : 4,
    checkpoint,
    round: career.roundIndex || 0,
    ai: true,
    deadlineDay
  };

  world.clubBudgets[buyerId] = Math.max(0, (world.clubBudgets[buyerId] || 0) - fee);
  world.clubBudgets[fromClubId] = (world.clubBudgets[fromClubId] || deriveAiBudget(clubById(db, fromClubId))) + Math.round(fee * .75);
  career.transfers.ownership[player.id] = buyerId;
  career.transfers.contracts[player.id] = {
    weeklyWage: transaction.weeklyWage,
    years: transaction.contractYears,
    signedRound: career.roundIndex || 0,
    ai: true
  };
  career.transfers.completed.push(transaction);
  world.aiTransactions.push(transaction);
  player.clubId = buyerId;
  addCompletedTransferNews(career, db, transaction);
  return transaction;
}

function tryAiTransfer(career, db, checkpoint, random, deadlineDay = false) {
  const buyerNeed = chooseBuyerAndGroup(career, db, random);
  if (!buyerNeed) return null;
  const target = chooseAiTarget(career, db, buyerNeed.club.id, buyerNeed.group, random);
  if (!target) return null;
  return completeAiTransfer(career, db, buyerNeed.club.id, target, checkpoint, deadlineDay);
}

function createRumour(career, db, checkpoint, random) {
  const buyerNeed = chooseBuyerAndGroup(career, db, random);
  if (!buyerNeed) return null;
  const target = chooseAiTarget(career, db, buyerNeed.club.id, buyerNeed.group, random);
  if (!target) return null;
  const world = career.transfers.world;
  if (world.rumours.some(item => item.playerId === target.player.id && item.buyerClubId === buyerNeed.club.id && item.status === 'active')) return null;
  const confidenceRoll = random();
  const rumour = {
    id: `rum-${hashString(`${career.id}:${checkpoint}:${buyerNeed.club.id}:${target.player.id}:${world.rumours.length}`).toString(16)}`,
    playerId: target.player.id,
    buyerClubId: buyerNeed.club.id,
    sellerClubId: target.player.clubId,
    estimatedFee: target.fee,
    confidence: confidenceRoll > .72 ? 'Strong' : confidenceRoll > .35 ? 'Moderate' : 'Speculative',
    checkpoint,
    status: 'active'
  };
  world.rumours.push(rumour);
  addRumourNews(career, db, rumour);
  return rumour;
}

function chooseIncomingBuyer(career, db, player, random) {
  const playerValue = estimatePlayerValue(player);
  return realClubs(db)
    .filter(club => club.id !== career.clubId && club.id !== player.clubId)
    .filter(club => (career.transfers.world.clubBudgets[club.id] || 0) >= playerValue * 1.05)
    .map(club => ({
      club,
      score: buyerNeedScore(db, club.id, player.positionGroup) + (club.reputation || 7000) / 800 + random() * 20
    }))
    .sort((a, b) => b.score - a.score)[0]?.club || null;
}

function maybeCreateIncomingOffer(career, db, checkpoint, random) {
  const world = career.transfers.world;
  if (world.incomingOffers.some(offer => offer.status === 'pending')) return null;
  const listed = (career.transfers.listedPlayerIds || [])
    .map(id => playerById(db, id))
    .filter(player => player?.clubId === career.clubId);
  let candidates = listed;
  if (!candidates.length && random() > .72) {
    candidates = realSquad(db, career.clubId)
      .filter(player => (player.reportedAge || 28) <= 27)
      .sort((a, b) => estimatePlayerValue(b) - estimatePlayerValue(a))
      .slice(0, 3);
  }
  if (!candidates.length) return null;
  const player = candidates[Math.floor(random() * candidates.length) % candidates.length];
  const buyer = chooseIncomingBuyer(career, db, player, random);
  if (!buyer) return null;
  const baseValue = estimatePlayerValue(player);
  const listedPremium = listed.some(item => item.id === player.id) ? .98 : 1.12;
  const fee = moneyRound(baseValue * listedPremium * (1 + random() * .18));
  if ((world.clubBudgets[buyer.id] || 0) < fee) return null;
  const offer = {
    id: `offer-${hashString(`${career.id}:${checkpoint}:${player.id}:${buyer.id}`).toString(16)}`,
    playerId: player.id,
    buyerClubId: buyer.id,
    fee,
    status: 'pending',
    checkpoint,
    expiresAfter: checkpointOrder(checkpoint) + 2
  };
  world.incomingOffers.push(offer);
  addIncomingOfferNews(career, db, offer);
  return offer;
}

function expireOffers(career, checkpoint) {
  const order = checkpointOrder(checkpoint);
  let changed = false;
  for (const offer of career.transfers.world.incomingOffers) {
    if (offer.status === 'pending' && Number.isFinite(offer.expiresAfter) && order > offer.expiresAfter) {
      offer.status = 'expired';
      changed = true;
    }
  }
  return changed;
}

function runDeadlineDay(career, db, checkpoint, random) {
  const world = career.transfers.world;
  if (world.deadlineDay?.triggered) return 0;
  let deals = 0;
  const attempts = 4;
  for (let index = 0; index < attempts; index += 1) {
    if (tryAiTransfer(career, db, `${checkpoint}-dd${index + 1}`, random, true)) deals += 1;
  }
  world.deadlineDay = { triggered: true, deals, closedAtCheckpoint: checkpoint };
  for (const offer of world.incomingOffers) {
    if (offer.status === 'pending') offer.status = 'expired';
  }
  addNews(career, {
    id: `news-${career.id}-deadline-day-close`,
    key: 'deadline-day-close',
    round: career.roundIndex || 0,
    period: 'PM',
    dateLabel: 'DEADLINE DAY',
    category: 'Transfers',
    source: 'Deadline Day',
    title: 'Summer transfer window closed',
    body: `Deadline Day is complete. ${deals} AI-controlled deals were completed in the final market push. No new transfer bids can be submitted until the next window.`,
    priority: 'important',
    relatedClubId: career.clubId,
    order: 62999,
    read: false
  });
  return deals;
}

export function processTransferWorld(career, db) {
  if (!career || !db) return { changed: false, checkpoint: null };
  let changed = ensureTransferWorld(career, db);
  const world = career.transfers.world;
  const checkpoint = checkpointKey(career);
  if (world.processedCheckpoints.includes(checkpoint)) {
    const status = currentWindowStatus(career);
    if (world.windowStatus !== status) {
      world.windowStatus = status;
      changed = true;
    }
    return { changed, checkpoint };
  }

  const random = seededRandom(`${career.seed}:${career.id}:transfer-world:${checkpoint}`);
  expireOffers(career, checkpoint);
  const windowOpenBeforeCheckpoint = checkpoint.startsWith('ps-') || (career.roundIndex || 0) < TRANSFER_WINDOW_CLOSE_ROUND;
  if (windowOpenBeforeCheckpoint) {
    const preseasonPlayed = checkpoint.startsWith('ps-') ? Number(checkpoint.slice(3)) || 0 : 99;
    const dealAttempts = preseasonPlayed === 0 ? 2 : preseasonPlayed <= 3 ? 1 : random() > .55 ? 1 : 0;
    for (let index = 0; index < dealAttempts; index += 1) {
      if (tryAiTransfer(career, db, `${checkpoint}-${index + 1}`, random)) changed = true;
    }
    if (createRumour(career, db, checkpoint, random)) changed = true;
    if (maybeCreateIncomingOffer(career, db, checkpoint, random)) changed = true;
  }

  if (!checkpoint.startsWith('ps-') && (career.roundIndex || 0) >= TRANSFER_WINDOW_CLOSE_ROUND) {
    if (runDeadlineDay(career, db, checkpoint, random) >= 0) changed = true;
  }

  world.processedCheckpoints.push(checkpoint);
  world.windowStatus = currentWindowStatus(career);
  world.initialized = true;
  career.updatedAt = new Date().toISOString();
  return { changed: true, checkpoint };
}

export function getIncomingOffers(career, { includeResolved = true } = {}) {
  const offers = career?.transfers?.world?.incomingOffers || [];
  return clone(includeResolved ? offers : offers.filter(offer => offer.status === 'pending'));
}

export function acceptIncomingOffer(career, db, offerId) {
  ensureTransferWorld(career, db);
  const world = career.transfers.world;
  const offer = world.incomingOffers.find(item => item.id === offerId);
  if (!offer || offer.status !== 'pending') throw new Error('That offer is no longer available.');
  if (!isTransferWindowOpen(career)) throw new Error('The transfer window is closed.');
  const player = playerById(db, offer.playerId);
  if (!player || player.clubId !== career.clubId) throw new Error('The player is no longer at your club.');
  if ((world.clubBudgets[offer.buyerClubId] || 0) < offer.fee) throw new Error('The buying club has withdrawn because the deal is no longer affordable.');

  const wage = career.transfers.contracts[player.id]?.weeklyWage || estimateWeeklyWage(player);
  const budgetCredit = moneyRound(offer.fee * .85);
  career.transfers.transferBudget += budgetCredit;
  career.transfers.wageRoom += wage;
  world.clubBudgets[offer.buyerClubId] = Math.max(0, (world.clubBudgets[offer.buyerClubId] || 0) - offer.fee);
  career.transfers.ownership[player.id] = offer.buyerClubId;
  delete career.transfers.contracts[player.id];
  career.transfers.listedPlayerIds = (career.transfers.listedPlayerIds || []).filter(id => id !== player.id);

  const transaction = {
    id: `sale-${hashString(`${career.id}:${offer.id}:${offer.fee}`).toString(16)}`,
    playerId: player.id,
    fromClubId: career.clubId,
    toClubId: offer.buyerClubId,
    fee: offer.fee,
    budgetCredit,
    weeklyWage: wageRound(estimateWeeklyWage(player) * 1.05),
    contractYears: (player.reportedAge || 27) >= 30 ? 2 : 4,
    round: career.roundIndex || 0,
    ai: true,
    userSale: true
  };
  career.transfers.completed.push(transaction);
  world.aiTransactions.push(transaction);
  offer.status = 'accepted';
  offer.resolvedAt = checkpointKey(career);
  player.clubId = offer.buyerClubId;
  career.lineupIds = autoPickLineup(db.players, career.clubId);
  addCompletedTransferNews(career, db, transaction);
  career.updatedAt = new Date().toISOString();
  return clone(transaction);
}

export function rejectIncomingOffer(career, db, offerId) {
  ensureTransferWorld(career, db);
  const offer = career.transfers.world.incomingOffers.find(item => item.id === offerId);
  if (!offer || offer.status !== 'pending') throw new Error('That offer is no longer available.');
  offer.status = 'rejected';
  offer.resolvedAt = checkpointKey(career);
  career.updatedAt = new Date().toISOString();
  return clone(offer);
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
