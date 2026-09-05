export const TRANSFER_SCHEMA_VERSION = 1;

const clone = value => JSON.parse(JSON.stringify(value));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function hashString(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function clubById(db, id) {
  return db.clubs.find(club => club.id === id);
}

function playerById(db, id) {
  return db.players.find(player => player.id === id);
}

function realSquad(db, clubId) {
  return db.players.filter(player => player.clubId === clubId && !player.isPlaceholder);
}

function moneyRound(value, step = 250000) {
  return Math.max(step, Math.round(value / step) * step);
}

function wageRound(value) {
  return Math.max(1000, Math.round(value / 500) * 500);
}

export function estimatePlayerValue(player) {
  if (!player) return 0;
  const ability = clamp(player.currentAbility || 100, 70, 200);
  const potential = clamp(player.potentialAbility || ability, ability, 200);
  const age = player.reportedAge || 26;
  const abilityFactor = Math.pow(ability / 120, 3.05);
  const potentialBonus = Math.max(0, potential - ability) * 175000;
  const ageFactor = age <= 21 ? 1.22 : age <= 24 ? 1.13 : age <= 28 ? 1 : age <= 31 ? .78 : .52;
  return moneyRound(clamp((14500000 * abilityFactor + potentialBonus) * ageFactor, 750000, 145000000));
}

export function estimateWeeklyWage(player) {
  if (!player) return 0;
  if (Number.isFinite(player.contract?.weeklyWage) && player.contract.weeklyWage > 0) return wageRound(player.contract.weeklyWage);
  const ability = clamp(player.currentAbility || 100, 70, 200);
  const age = player.reportedAge || 26;
  const ageFactor = age < 22 ? .8 : age > 31 ? .88 : 1;
  return wageRound(clamp(6500 * Math.pow(ability / 95, 3.1) * ageFactor, 3500, 375000));
}

function deriveBudgets(career, db) {
  const club = clubById(db, career.clubId);
  const rep = club?.reputation || 7500;
  const transferBudget = moneyRound(clamp(42000000 + (rep - 7000) * 15500, 22000000, 165000000), 1000000);
  const wageRoom = wageRound(clamp(240000 + (rep - 7000) * 115, 130000, 800000));
  return { transferBudget, wageRoom };
}

export function ensureTransferState(career, db) {
  if (!career || !db) return false;
  let changed = false;
  if (!career.transfers || career.transfers.schemaVersion !== TRANSFER_SCHEMA_VERSION) {
    const budgets = deriveBudgets(career, db);
    career.transfers = {
      schemaVersion: TRANSFER_SCHEMA_VERSION,
      initialTransferBudget: budgets.transferBudget,
      transferBudget: budgets.transferBudget,
      initialWageRoom: budgets.wageRoom,
      wageRoom: budgets.wageRoom,
      ownership: {},
      contracts: {},
      negotiations: {},
      completed: [],
      listedPlayerIds: []
    };
    changed = true;
  }
  for (const key of ['ownership', 'contracts', 'negotiations']) {
    if (!career.transfers[key] || typeof career.transfers[key] !== 'object') {
      career.transfers[key] = {};
      changed = true;
    }
  }
  for (const key of ['completed', 'listedPlayerIds']) {
    if (!Array.isArray(career.transfers[key])) {
      career.transfers[key] = [];
      changed = true;
    }
  }
  applyTransferOwnership(career, db);
  return changed;
}

export function applyTransferOwnership(career, db) {
  const ownership = career?.transfers?.ownership || {};
  let changed = false;
  for (const [playerId, clubId] of Object.entries(ownership)) {
    const player = playerById(db, playerId);
    if (player && player.clubId !== clubId) {
      player.clubId = clubId;
      changed = true;
    }
  }
  return changed;
}

function isSellerKeyPlayer(player, db) {
  if (!player?.clubId) return false;
  const ranked = realSquad(db, player.clubId)
    .sort((a, b) => (b.currentAbility || 0) - (a.currentAbility || 0))
    .slice(0, 3);
  return ranked.some(item => item.id === player.id);
}

export function getAskingPrice(player, db) {
  const value = estimatePlayerValue(player);
  const premium = isSellerKeyPlayer(player, db) ? 1.34 : 1.1;
  return moneyRound(value * premium);
}

export function getTransferBudget(career) {
  const state = career?.transfers;
  return {
    transferBudget: state?.transferBudget || 0,
    wageRoom: state?.wageRoom || 0,
    spent: Math.max(0, (state?.initialTransferBudget || 0) - (state?.transferBudget || 0)),
    committedWages: Math.max(0, (state?.initialWageRoom || 0) - (state?.wageRoom || 0))
  };
}

export function searchTransferMarket(career, db, { query = '', position = 'All', clubId = 'All' } = {}) {
  ensureTransferState(career, db);
  const term = String(query).trim().toLowerCase();
  return db.players
    .filter(player => !player.isPlaceholder && player.clubId && player.clubId !== career.clubId)
    .filter(player => clubId === 'All' || player.clubId === clubId)
    .filter(player => position === 'All' || player.positionGroup === position)
    .filter(player => !term || player.name.toLowerCase().includes(term) || String(player.primaryPosition || '').toLowerCase().includes(term))
    .sort((a, b) => estimatePlayerValue(b) - estimatePlayerValue(a) || a.name.localeCompare(b.name));
}

function negotiationRecord(career, player, db) {
  const askingPrice = getAskingPrice(player, db);
  const wageDemand = wageRound(estimateWeeklyWage(player) * (1.04 + (hashString(`${career.id}:${player.id}:wage`) % 9) / 100));
  return {
    playerId: player.id,
    sellingClubId: player.clubId,
    askingPrice,
    wageDemand,
    status: 'idle',
    lastOffer: 0,
    counterFee: null,
    contractYears: null,
    wageOffer: null,
    messages: []
  };
}

export function getNegotiation(career, db, playerId) {
  ensureTransferState(career, db);
  const player = playerById(db, playerId);
  if (!player || player.clubId === career.clubId) return null;
  if (!career.transfers.negotiations[playerId]) career.transfers.negotiations[playerId] = negotiationRecord(career, player, db);
  return career.transfers.negotiations[playerId];
}

export function submitTransferOffer(career, db, playerId, fee) {
  ensureTransferState(career, db);
  const player = playerById(db, playerId);
  if (!player || player.clubId === career.clubId) throw new Error('Choose a player from another club.');
  const offer = moneyRound(Number(fee) || 0);
  if (offer <= 0) throw new Error('Enter a valid transfer fee.');
  if (offer > career.transfers.transferBudget) throw new Error('That offer is above your remaining transfer budget.');

  const negotiation = getNegotiation(career, db, playerId);
  negotiation.lastOffer = offer;
  const ratio = offer / negotiation.askingPrice;
  const seller = clubById(db, player.clubId)?.shortName || clubById(db, player.clubId)?.name || 'The selling club';

  if (ratio >= .98) {
    negotiation.status = 'fee-accepted';
    negotiation.counterFee = null;
    negotiation.messages.push(`${seller} accepted a fee of £${offer.toLocaleString('en-GB')}.`);
    return { status: 'accepted', negotiation: clone(negotiation) };
  }
  if (ratio >= .8) {
    const discount = .99 - (hashString(`${career.id}:${player.id}:counter`) % 4) / 100;
    negotiation.counterFee = moneyRound(negotiation.askingPrice * discount);
    negotiation.status = 'countered';
    negotiation.messages.push(`${seller} rejected the offer and countered at £${negotiation.counterFee.toLocaleString('en-GB')}.`);
    return { status: 'countered', negotiation: clone(negotiation) };
  }

  negotiation.status = 'rejected';
  negotiation.counterFee = null;
  negotiation.messages.push(`${seller} rejected the offer as substantially below their valuation.`);
  return { status: 'rejected', negotiation: clone(negotiation) };
}

export function acceptSellerCounter(career, db, playerId) {
  const negotiation = getNegotiation(career, db, playerId);
  if (!negotiation?.counterFee) throw new Error('There is no active counter-offer to accept.');
  return submitTransferOffer(career, db, playerId, negotiation.counterFee);
}

function transferDateLabel(career) {
  if (career.preseason?.phase && career.preseason.phase !== 'complete') return 'PRE-SEASON';
  return career.roundIndex > 0 ? `R${career.roundIndex} PM` : 'PRE-SEASON';
}

function addTransferNews(career, db, transaction) {
  career.news ||= { schemaVersion: 1, items: [], generatedRounds: [] };
  career.news.items ||= [];
  career.news.generatedRounds ||= [];
  const player = playerById(db, transaction.playerId);
  const seller = clubById(db, transaction.fromClubId);
  const buyer = clubById(db, transaction.toClubId);
  const id = `news-${career.id}-transfer-${transaction.id}`;
  if (career.news.items.some(item => item.id === id)) return;
  career.news.items.push({
    id,
    key: `transfer-${transaction.id}`,
    round: career.roundIndex || 0,
    period: 'PM',
    dateLabel: transferDateLabel(career),
    category: 'Transfers',
    source: 'Transfer Desk',
    title: `${buyer?.shortName || buyer?.name || 'Club'} sign ${player?.name || 'player'}`,
    body: `${buyer?.name || 'The club'} have completed the signing of ${player?.name || 'the player'} from ${seller?.name || 'the selling club'} for £${transaction.fee.toLocaleString('en-GB')}. The player has agreed a ${transaction.contractYears}-year contract worth £${transaction.weeklyWage.toLocaleString('en-GB')} per week.`,
    priority: 'important',
    relatedClubId: transaction.toClubId,
    relatedPlayerId: transaction.playerId,
    order: 50000 + career.transfers.completed.length,
    read: false
  });
}

export function submitContractOffer(career, db, playerId, weeklyWage, years = 4) {
  ensureTransferState(career, db);
  const negotiation = getNegotiation(career, db, playerId);
  if (!negotiation || negotiation.status !== 'fee-accepted') throw new Error('Agree a transfer fee before discussing the contract.');

  const wage = wageRound(Number(weeklyWage) || 0);
  const contractYears = clamp(Math.round(Number(years) || 4), 2, 5);
  if (wage > career.transfers.wageRoom) throw new Error('That salary is above your remaining wage room.');

  negotiation.wageOffer = wage;
  negotiation.contractYears = contractYears;
  if (wage < negotiation.wageDemand * .9) {
    negotiation.status = 'contract-countered';
    negotiation.messages.push(`The player's representatives want closer to £${negotiation.wageDemand.toLocaleString('en-GB')} per week.`);
    return { status: 'countered', wageDemand: negotiation.wageDemand, negotiation: clone(negotiation) };
  }

  const player = playerById(db, playerId);
  const fromClubId = player.clubId;
  const fee = negotiation.lastOffer;
  const transaction = {
    id: `${hashString(`${career.id}:${playerId}:${career.transfers.completed.length}:${fee}`).toString(16)}`,
    playerId,
    fromClubId,
    toClubId: career.clubId,
    fee,
    weeklyWage: wage,
    contractYears,
    round: career.roundIndex || 0
  };

  career.transfers.transferBudget -= fee;
  career.transfers.wageRoom -= wage;
  career.transfers.ownership[playerId] = career.clubId;
  career.transfers.contracts[playerId] = { weeklyWage: wage, years: contractYears, signedRound: career.roundIndex || 0 };
  career.transfers.completed.push(transaction);
  negotiation.status = 'completed';
  negotiation.messages.push(`${player.name} agreed personal terms and completed the move.`);

  player.clubId = career.clubId;
  career.playerStatus[playerId] ||= { condition: 96, sharpness: 72, morale: 'Good', appearances: 0, goals: 0 };
  addTransferNews(career, db, transaction);
  career.updatedAt = new Date().toISOString();

  return { status: 'completed', transaction: clone(transaction), negotiation: clone(negotiation) };
}

export function listOwnPlayersForTransfer(career, db) {
  ensureTransferState(career, db);
  return realSquad(db, career.clubId).sort((a, b) => a.name.localeCompare(b.name));
}

export function toggleTransferListed(career, db, playerId) {
  ensureTransferState(career, db);
  const player = playerById(db, playerId);
  if (!player || player.clubId !== career.clubId) throw new Error('Only your own players can be transfer listed.');
  const listed = career.transfers.listedPlayerIds;
  const index = listed.indexOf(playerId);
  if (index >= 0) listed.splice(index, 1);
  else listed.push(playerId);
  return index < 0;
}
