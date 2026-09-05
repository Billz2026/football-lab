export const TRANSFER_SCHEMA_VERSION = 2;
export const SUMMER_TRANSFER_WINDOW = Object.freeze({
  opens: '2026-06-15',
  closes: '2026-09-01',
  deadlineTime: '23:00'
});

const clone = value => JSON.parse(JSON.stringify(value));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const POSITION_MINIMUMS = Object.freeze({ GK: 2, DEF: 5, MID: 4, ATT: 3 });
const POSITION_TARGETS = Object.freeze({ GK: 3, DEF: 8, MID: 7, ATT: 5 });
const PRESEASON_DATES = Object.freeze(['2026-07-11', '2026-07-18', '2026-07-25', '2026-08-01', '2026-08-08', '2026-08-09']);

function hashString(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededUnit(value) {
  return (hashString(value) % 10000) / 10000;
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

function playableClubIds(career, db) {
  const tableIds = (career?.table || []).map(row => row.clubId).filter(Boolean);
  if (tableIds.length >= 2) return [...new Set(tableIds)];
  const metadataIds = (db.metadata?.playableDemo?.clubIds || []).filter(id => clubById(db, id) && !clubById(db, id).isPlaceholder);
  if (metadataIds.length >= 2) return [...new Set(metadataIds)];
  return db.clubs.filter(club => !club.isPlaceholder).map(club => club.id);
}

function moneyRound(value, step = 250000) {
  return Math.max(step, Math.round(value / step) * step);
}

function wageRound(value) {
  return Math.max(1000, Math.round(value / 500) * 500);
}

function isoDayNumber(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return null;
  const [year, month, day] = value.split('-').map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
}

function deriveBudgets(career, db) {
  const club = clubById(db, career.clubId);
  const rep = club?.reputation || 7500;
  const transferBudget = moneyRound(clamp(42000000 + (rep - 7000) * 15500, 22000000, 165000000), 1000000);
  const wageRoom = wageRound(clamp(240000 + (rep - 7000) * 115, 130000, 800000));
  return { transferBudget, wageRoom };
}

function deriveAiBudgets(club) {
  const rep = club?.reputation || 7200;
  const transferBudget = moneyRound(clamp(26000000 + (rep - 6800) * 14500, 15000000, 150000000), 1000000);
  const wageRoom = wageRound(clamp(150000 + (rep - 6800) * 95, 90000, 650000));
  return { transferBudget, wageRoom };
}

function baseTransferState(career, db) {
  const budgets = deriveBudgets(career, db);
  return {
    schemaVersion: TRANSFER_SCHEMA_VERSION,
    initialTransferBudget: budgets.transferBudget,
    transferBudget: budgets.transferBudget,
    initialWageRoom: budgets.wageRoom,
    wageRoom: budgets.wageRoom,
    ownership: {},
    contracts: {},
    negotiations: {},
    completed: [],
    listedPlayerIds: [],
    aiClubs: {},
    incomingOffers: [],
    rumours: [],
    processedWorldPhases: [],
    windowClosedNotified: false
  };
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

export function getPlayerContract(career, player) {
  if (!player) return null;
  const stored = career?.transfers?.contracts?.[player.id] || null;
  const actualEnd = player.contract?.endDate || player.contract?.expires || player.contract?.contractUntil || null;
  const parsedActualYear = typeof actualEnd === 'string' ? Number(String(actualEnd).slice(0, 4)) : null;
  const expiryYear = stored?.expiryYear || (Number.isFinite(parsedActualYear) && parsedActualYear >= 2027
    ? parsedActualYear
    : 2027 + (hashString(`${career?.seed || career?.id || 'career'}:${player.id}:contract`) % 4));
  const weeklyWage = stored?.weeklyWage || estimateWeeklyWage(player);
  const yearsRemaining = Math.max(0, expiryYear - 2026);
  return {
    weeklyWage: wageRound(weeklyWage),
    expiryYear,
    yearsRemaining,
    signedRound: stored?.signedRound ?? null,
    source: stored ? 'career' : actualEnd ? 'database' : 'estimated'
  };
}

export function ensureTransferState(career, db) {
  if (!career || !db) return false;
  let changed = false;
  if (!career.transfers || typeof career.transfers !== 'object') {
    career.transfers = baseTransferState(career, db);
    changed = true;
  }

  const state = career.transfers;
  if (state.schemaVersion !== TRANSFER_SCHEMA_VERSION) {
    state.schemaVersion = TRANSFER_SCHEMA_VERSION;
    changed = true;
  }

  const budgets = deriveBudgets(career, db);
  for (const [key, fallback] of [
    ['initialTransferBudget', budgets.transferBudget],
    ['transferBudget', budgets.transferBudget],
    ['initialWageRoom', budgets.wageRoom],
    ['wageRoom', budgets.wageRoom]
  ]) {
    if (!Number.isFinite(state[key])) {
      state[key] = fallback;
      changed = true;
    }
  }

  for (const key of ['ownership', 'contracts', 'negotiations', 'aiClubs']) {
    if (!state[key] || typeof state[key] !== 'object' || Array.isArray(state[key])) {
      state[key] = {};
      changed = true;
    }
  }
  for (const key of ['completed', 'listedPlayerIds', 'incomingOffers', 'rumours', 'processedWorldPhases']) {
    if (!Array.isArray(state[key])) {
      state[key] = [];
      changed = true;
    }
  }
  if (typeof state.windowClosedNotified !== 'boolean') {
    state.windowClosedNotified = false;
    changed = true;
  }

  for (const clubId of playableClubIds(career, db)) {
    if (clubId === career.clubId) continue;
    if (!state.aiClubs[clubId]) {
      const aiBudget = deriveAiBudgets(clubById(db, clubId));
      state.aiClubs[clubId] = {
        initialTransferBudget: aiBudget.transferBudget,
        transferBudget: aiBudget.transferBudget,
        initialWageRoom: aiBudget.wageRoom,
        wageRoom: aiBudget.wageRoom,
        signedPlayerIds: [],
        soldPlayerIds: []
      };
      changed = true;
    } else {
      const ai = state.aiClubs[clubId];
      const fallback = deriveAiBudgets(clubById(db, clubId));
      if (!Number.isFinite(ai.initialTransferBudget)) ai.initialTransferBudget = fallback.transferBudget;
      if (!Number.isFinite(ai.transferBudget)) ai.transferBudget = fallback.transferBudget;
      if (!Number.isFinite(ai.initialWageRoom)) ai.initialWageRoom = fallback.wageRoom;
      if (!Number.isFinite(ai.wageRoom)) ai.wageRoom = fallback.wageRoom;
      if (!Array.isArray(ai.signedPlayerIds)) ai.signedPlayerIds = [];
      if (!Array.isArray(ai.soldPlayerIds)) ai.soldPlayerIds = [];
    }
  }

  if (applyTransferOwnership(career, db)) changed = true;
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

function groupCount(db, clubId, group) {
  return realSquad(db, clubId).filter(player => player.positionGroup === group).length;
}

function canClubSell(db, player) {
  if (!player?.clubId || !player.positionGroup) return false;
  const minimum = POSITION_MINIMUMS[player.positionGroup] || 2;
  return groupCount(db, player.clubId, player.positionGroup) > minimum;
}

function isSquadSurplus(db, player) {
  if (!player?.clubId || !player.positionGroup) return false;
  const squad = realSquad(db, player.clubId).filter(item => item.positionGroup === player.positionGroup);
  const target = POSITION_TARGETS[player.positionGroup] || 4;
  if (squad.length <= target) return false;
  const average = squad.reduce((sum, item) => sum + (item.currentAbility || 100), 0) / squad.length;
  return (player.currentAbility || 100) < average || (player.reportedAge || 26) >= 30;
}

export function getAskingPrice(player, db, career = null) {
  const value = estimatePlayerValue(player);
  let premium = isSellerKeyPlayer(player, db) ? 1.34 : 1.1;
  if (career) {
    const contract = getPlayerContract(career, player);
    if (contract.expiryYear <= 2027) premium *= .84;
    else if (contract.expiryYear === 2028) premium *= .95;
    else if (contract.expiryYear >= 2030) premium *= 1.06;
    if (player.clubId === career.clubId && career.transfers?.listedPlayerIds?.includes(player.id)) premium *= .91;
    else if (player.clubId !== career.clubId && isSquadSurplus(db, player)) premium *= .94;
  }
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

function leagueDateForRound(career) {
  if (!career?.fixtures?.length) return null;
  const safeIndex = Math.min(Math.max(career.roundIndex || 0, 0), career.fixtures.length - 1);
  const round = career.fixtures[safeIndex] || [];
  return round.find(fixture => fixture.date)?.date || round[0]?.date || null;
}

export function getTransferWindowStatus(career) {
  const preseason = career?.preseason;
  let currentDate;
  if (preseason && preseason.phase !== 'complete') {
    const played = preseason.fixtures?.filter(fixture => fixture.played).length || 0;
    currentDate = PRESEASON_DATES[Math.min(played, PRESEASON_DATES.length - 1)];
  } else {
    currentDate = leagueDateForRound(career) || '2026-08-21';
  }
  const current = isoDayNumber(currentDate);
  const opens = isoDayNumber(SUMMER_TRANSFER_WINDOW.opens);
  const closes = isoDayNumber(SUMMER_TRANSFER_WINDOW.closes);
  const open = current !== null && current >= opens && current <= closes;
  const daysRemaining = current !== null && closes !== null ? closes - current : null;
  return {
    open,
    currentDate,
    opens: SUMMER_TRANSFER_WINDOW.opens,
    closes: SUMMER_TRANSFER_WINDOW.closes,
    deadlineTime: SUMMER_TRANSFER_WINDOW.deadlineTime,
    daysRemaining,
    deadlineWeek: open && daysRemaining !== null && daysRemaining <= 4,
    label: open
      ? `OPEN · CLOSES 1 SEP ${SUMMER_TRANSFER_WINDOW.deadlineTime}`
      : current !== null && current > closes ? 'CLOSED · DEADLINE PASSED' : 'NOT YET OPEN'
  };
}

function requireOpenWindow(career) {
  const status = getTransferWindowStatus(career);
  if (!status.open) throw new Error('The summer transfer window is closed. New registrations cannot be completed.');
  return status;
}

export function searchTransferMarket(career, db, { query = '', position = 'All', clubId = 'All' } = {}) {
  ensureTransferState(career, db);
  const term = String(query).trim().toLowerCase();
  return db.players
    .filter(player => !player.isPlaceholder && player.clubId && player.clubId !== career.clubId)
    .filter(player => playableClubIds(career, db).includes(player.clubId))
    .filter(player => clubId === 'All' || player.clubId === clubId)
    .filter(player => position === 'All' || player.positionGroup === position)
    .filter(player => !term || player.name.toLowerCase().includes(term) || String(player.primaryPosition || '').toLowerCase().includes(term))
    .sort((a, b) => estimatePlayerValue(b) - estimatePlayerValue(a) || a.name.localeCompare(b.name));
}

function negotiationRecord(career, player, db) {
  const askingPrice = getAskingPrice(player, db, career);
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
  requireOpenWindow(career);
  const player = playerById(db, playerId);
  if (!player || player.clubId === career.clubId) throw new Error('Choose a player from another club.');
  const rawOffer = Number(fee);
  if (!Number.isFinite(rawOffer) || rawOffer <= 0) throw new Error('Enter a valid transfer fee.');
  const offer = moneyRound(rawOffer);
  if (offer > career.transfers.transferBudget) throw new Error('That offer is above your remaining transfer budget.');

  const negotiation = getNegotiation(career, db, playerId);
  negotiation.askingPrice = getAskingPrice(player, db, career);
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
  ensureTransferState(career, db);
  requireOpenWindow(career);
  const negotiation = getNegotiation(career, db, playerId);
  if (!negotiation?.counterFee) throw new Error('There is no active counter-offer to accept.');
  if (negotiation.counterFee > career.transfers.transferBudget) throw new Error('The counter-offer is above your remaining transfer budget.');
  const acceptedFee = negotiation.counterFee;
  negotiation.lastOffer = acceptedFee;
  negotiation.counterFee = null;
  negotiation.status = 'fee-accepted';
  negotiation.messages.push(`Counter-offer accepted at £${acceptedFee.toLocaleString('en-GB')}.`);
  return { status: 'accepted', negotiation: clone(negotiation) };
}

function transferDateLabel(career) {
  if (career.preseason?.phase && career.preseason.phase !== 'complete') {
    const played = career.preseason.fixtures?.filter(fixture => fixture.played).length || 0;
    return `PRE-SEASON · WEEK ${Math.min(played + 1, 5)}`;
  }
  return career.status === 'complete' ? 'SEASON END' : `MATCHWEEK ${(career.roundIndex || 0) + 1}`;
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
    priority: transaction.toClubId === career.clubId || transaction.fromClubId === career.clubId ? 'important' : 'normal',
    relatedClubId: transaction.toClubId,
    relatedPlayerId: transaction.playerId,
    order: 50000 + career.transfers.completed.length,
    read: false
  });
}

function addRumourNews(career, db, rumour) {
  career.news ||= { schemaVersion: 1, items: [], generatedRounds: [] };
  career.news.items ||= [];
  const player = playerById(db, rumour.playerId);
  const buyer = clubById(db, rumour.buyerClubId);
  const seller = clubById(db, player?.clubId);
  const id = `news-${career.id}-rumour-${rumour.id}`;
  if (career.news.items.some(item => item.id === id)) return;
  career.news.items.push({
    id,
    key: `rumour-${rumour.id}`,
    round: career.roundIndex || 0,
    period: 'AM',
    dateLabel: transferDateLabel(career),
    category: 'Transfers',
    source: 'Transfer Desk',
    title: `${buyer?.shortName || buyer?.name || 'Club'} track ${player?.name || 'target'}`,
    body: `${buyer?.name || 'The club'} are monitoring ${player?.name || 'a player'} at ${seller?.name || 'another club'}. No agreement has been reached and the clubs have not confirmed formal talks.`,
    priority: 'normal',
    relatedClubId: rumour.buyerClubId,
    relatedPlayerId: rumour.playerId,
    order: 45000 + career.transfers.rumours.length,
    read: false
  });
}

function addIncomingOfferNews(career, db, offer) {
  career.news ||= { schemaVersion: 1, items: [], generatedRounds: [] };
  career.news.items ||= [];
  const player = playerById(db, offer.playerId);
  const buyer = clubById(db, offer.buyerClubId);
  const id = `news-${career.id}-incoming-${offer.id}`;
  if (career.news.items.some(item => item.id === id)) return;
  career.news.items.push({
    id,
    key: `incoming-${offer.id}`,
    round: career.roundIndex || 0,
    period: 'PM',
    dateLabel: transferDateLabel(career),
    category: 'Transfers',
    source: 'Transfer Desk',
    title: `${buyer?.shortName || buyer?.name || 'Club'} bid for ${player?.name || 'your player'}`,
    body: `${buyer?.name || 'The buying club'} have submitted a £${offer.offeredFee.toLocaleString('en-GB')} offer for ${player?.name || 'your player'}. The bid is waiting for your decision in Transfers > Offers.`,
    priority: 'important',
    relatedClubId: offer.buyerClubId,
    relatedPlayerId: offer.playerId,
    order: 60000 + career.transfers.incomingOffers.length,
    read: false
  });
}

function addWindowClosedNews(career) {
  career.news ||= { schemaVersion: 1, items: [], generatedRounds: [] };
  career.news.items ||= [];
  const id = `news-${career.id}-summer-window-closed`;
  if (career.news.items.some(item => item.id === id)) return;
  career.news.items.push({
    id,
    key: 'summer-window-closed',
    round: career.roundIndex || 0,
    period: 'PM',
    dateLabel: '1 SEP · 23:00',
    category: 'Transfers',
    source: 'Transfer Desk',
    title: 'Summer transfer window closed',
    body: 'The summer registration window has closed. No new permanent transfers can be completed until the next registration period.',
    priority: 'important',
    order: 70000,
    read: false
  });
}

export function submitContractOffer(career, db, playerId, weeklyWage, years = 4) {
  ensureTransferState(career, db);
  requireOpenWindow(career);
  const negotiation = getNegotiation(career, db, playerId);
  if (!negotiation || !['fee-accepted', 'contract-countered'].includes(negotiation.status)) throw new Error('Agree a transfer fee before discussing the contract.');

  const rawWage = Number(weeklyWage);
  if (!Number.isFinite(rawWage) || rawWage <= 0) throw new Error('Enter a valid weekly wage.');
  const wage = wageRound(rawWage);
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
    round: career.roundIndex || 0,
    source: 'user-purchase'
  };

  career.transfers.transferBudget -= fee;
  career.transfers.wageRoom -= wage;
  career.transfers.ownership[playerId] = career.clubId;
  career.transfers.contracts[playerId] = {
    weeklyWage: wage,
    years: contractYears,
    expiryYear: 2026 + contractYears,
    signedRound: career.roundIndex || 0
  };
  career.transfers.completed.push(transaction);
  negotiation.status = 'completed';
  negotiation.messages.push(`${player.name} agreed personal terms and completed the move.`);

  player.clubId = career.clubId;
  career.playerStatus ||= {};
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

function squadNeedScores(db, clubId) {
  const result = {};
  for (const group of Object.keys(POSITION_TARGETS)) {
    const players = realSquad(db, clubId).filter(player => player.positionGroup === group);
    const count = players.length;
    const average = count ? players.reduce((sum, player) => sum + (player.currentAbility || 100), 0) / count : 85;
    const shortage = Math.max(0, POSITION_TARGETS[group] - count);
    const qualityGap = Math.max(0, 128 - average);
    result[group] = shortage * 22 + qualityGap * .55;
  }
  return result;
}

function reservedIncomingForBuyer(career, buyerClubId) {
  return (career.transfers.incomingOffers || [])
    .filter(offer => offer.status === 'pending' && offer.buyerClubId === buyerClubId)
    .reduce((sum, offer) => sum + offer.offeredFee, 0);
}

function chooseAiTarget(career, db, buyerClubId, phaseKey) {
  const buyerState = career.transfers.aiClubs[buyerClubId];
  if (!buyerState) return null;
  const reserved = reservedIncomingForBuyer(career, buyerClubId);
  const availableBudget = Math.max(0, buyerState.transferBudget - reserved);
  if (availableBudget < 1000000) return null;
  const needs = squadNeedScores(db, buyerClubId);
  const groups = Object.keys(needs).sort((a, b) => needs[b] - needs[a]);
  const allowedClubs = new Set(playableClubIds(career, db));

  for (const group of groups) {
    const candidates = db.players
      .filter(player => !player.isPlaceholder && player.clubId && player.clubId !== buyerClubId && player.clubId !== career.clubId)
      .filter(player => allowedClubs.has(player.clubId))
      .filter(player => player.positionGroup === group && (player.reportedAge || 26) <= 32)
      .filter(player => canClubSell(db, player))
      .filter(player => getAskingPrice(player, db, career) <= availableBudget * .72)
      .map(player => {
        const value = estimatePlayerValue(player);
        const potential = player.potentialAbility || player.currentAbility || 100;
        const age = player.reportedAge || 26;
        const surplus = isSquadSurplus(db, player) ? 16 : 0;
        const keyPenalty = isSellerKeyPlayer(player, db) ? 18 : 0;
        const contract = getPlayerContract(career, player);
        const contractOpportunity = contract.expiryYear <= 2027 ? 13 : contract.expiryYear === 2028 ? 5 : 0;
        const score = (player.currentAbility || 100) * .72 + potential * .28 + Math.max(0, 27 - age) * 1.3
          + needs[group] + surplus + contractOpportunity - keyPenalty - value / 10000000
          + seededUnit(`${career.id}:${phaseKey}:${buyerClubId}:${player.id}`) * 4;
        return { player, score };
      })
      .sort((a, b) => b.score - a.score);
    if (candidates.length) return candidates[0].player;
  }
  return null;
}

function completeAiTransfer(career, db, buyerClubId, player, phaseKey) {
  const buyerState = career.transfers.aiClubs[buyerClubId];
  const sellerState = career.transfers.aiClubs[player.clubId];
  if (!buyerState || !sellerState) return null;
  const needs = squadNeedScores(db, buyerClubId);
  const need = needs[player.positionGroup] || 0;
  const value = estimatePlayerValue(player);
  let asking = getAskingPrice(player, db, career);
  if (isSquadSurplus(db, player)) asking = moneyRound(asking * .95);
  const maxFee = moneyRound(value * (need >= 25 ? 1.42 : need >= 10 ? 1.3 : 1.2));
  const reserved = reservedIncomingForBuyer(career, buyerClubId);
  const availableBudget = Math.max(0, buyerState.transferBudget - reserved);
  if (asking > maxFee || asking > availableBudget) return null;

  const fee = moneyRound(asking * (.98 + seededUnit(`${phaseKey}:${buyerClubId}:${player.id}:fee`) * .04));
  if (fee > availableBudget) return null;
  const wage = wageRound(estimateWeeklyWage(player) * (1.02 + seededUnit(`${phaseKey}:${player.id}:ai-wage`) * .12));
  if (wage > buyerState.wageRoom) return null;
  const contractYears = (player.reportedAge || 26) >= 30 ? 2 + (hashString(`${player.id}:years`) % 2) : 4 + (hashString(`${player.id}:years`) % 2);
  const fromClubId = player.clubId;
  const transaction = {
    id: `ai-${hashString(`${career.id}:${phaseKey}:${buyerClubId}:${player.id}:${fee}`).toString(16)}`,
    playerId: player.id,
    fromClubId,
    toClubId: buyerClubId,
    fee,
    weeklyWage: wage,
    contractYears,
    round: career.roundIndex || 0,
    source: 'ai'
  };

  buyerState.transferBudget -= fee;
  buyerState.wageRoom -= wage;
  buyerState.signedPlayerIds.push(player.id);
  sellerState.transferBudget += moneyRound(fee * .78);
  sellerState.soldPlayerIds.push(player.id);
  career.transfers.ownership[player.id] = buyerClubId;
  career.transfers.contracts[player.id] = {
    weeklyWage: wage,
    years: contractYears,
    expiryYear: 2026 + contractYears,
    signedRound: career.roundIndex || 0
  };
  career.transfers.completed.push(transaction);
  player.clubId = buyerClubId;
  addTransferNews(career, db, transaction);
  return transaction;
}

function simulateAiMarket(career, db, phaseKey, activity) {
  const clubIds = playableClubIds(career, db).filter(id => id !== career.clubId && career.transfers.aiClubs[id]);
  const ordered = [...clubIds].sort((a, b) => hashString(`${career.id}:${phaseKey}:${a}`) - hashString(`${career.id}:${phaseKey}:${b}`));
  const deals = [];
  for (const buyerClubId of ordered) {
    if (deals.length >= activity) break;
    const target = chooseAiTarget(career, db, buyerClubId, phaseKey);
    if (!target) continue;
    const transaction = completeAiTransfer(career, db, buyerClubId, target, phaseKey);
    if (transaction) deals.push(transaction);
  }
  return deals;
}

function createRumour(career, db, phaseKey) {
  if (career.transfers.rumours.some(item => item.phaseKey === phaseKey)) return null;
  const buyers = playableClubIds(career, db).filter(id => id !== career.clubId && career.transfers.aiClubs[id]);
  if (!buyers.length) return null;
  const buyerClubId = buyers[hashString(`${career.id}:${phaseKey}:rumour-buyer`) % buyers.length];
  const target = chooseAiTarget(career, db, buyerClubId, `${phaseKey}:rumour`);
  if (!target) return null;
  const rumour = {
    id: hashString(`${career.id}:${phaseKey}:${buyerClubId}:${target.id}:rumour`).toString(16),
    phaseKey,
    buyerClubId,
    playerId: target.id,
    round: career.roundIndex || 0
  };
  career.transfers.rumours.push(rumour);
  addRumourNews(career, db, rumour);
  return rumour;
}

function expireOldIncomingOffers(career, phaseKey) {
  let changed = false;
  for (const offer of career.transfers.incomingOffers) {
    if (offer.status === 'pending' && offer.createdPhase !== phaseKey) {
      offer.status = 'withdrawn';
      changed = true;
    }
  }
  return changed;
}

function incomingCandidateOrder(career, db, phaseKey) {
  const listed = new Set(career.transfers.listedPlayerIds || []);
  return realSquad(db, career.clubId)
    .filter(player => player.positionGroup !== 'GK' || groupCount(db, career.clubId, 'GK') > 2)
    .map(player => ({
      player,
      listed: listed.has(player.id),
      score: (listed.has(player.id) ? 1000 : 0)
        + estimatePlayerValue(player) / 1000000
        + (player.currentAbility || 100) * .2
        + seededUnit(`${career.id}:${phaseKey}:${player.id}:incoming`) * 8
    }))
    .sort((a, b) => b.score - a.score);
}

function createIncomingOffer(career, db, phaseKey) {
  if (career.transfers.incomingOffers.some(offer => offer.status === 'pending')) return null;
  const candidates = incomingCandidateOrder(career, db, phaseKey);
  if (!candidates.length) return null;
  const hasListed = candidates.some(item => item.listed);
  if (!hasListed && seededUnit(`${career.id}:${phaseKey}:incoming-roll`) > .34) return null;

  for (const { player, listed } of candidates) {
    if (!listed && isSellerKeyPlayer(player, db) && seededUnit(`${phaseKey}:${player.id}:star-bid`) > .2) continue;
    const buyers = playableClubIds(career, db)
      .filter(id => id !== career.clubId && career.transfers.aiClubs[id])
      .map(id => ({ id, need: squadNeedScores(db, id)[player.positionGroup] || 0 }))
      .filter(item => item.need > 2 || listed)
      .sort((a, b) => b.need - a.need || hashString(`${phaseKey}:${a.id}`) - hashString(`${phaseKey}:${b.id}`));

    for (const buyer of buyers) {
      const ai = career.transfers.aiClubs[buyer.id];
      const value = estimatePlayerValue(player);
      const factor = listed
        ? .94 + seededUnit(`${phaseKey}:${buyer.id}:${player.id}:listed`) * .17
        : 1.14 + seededUnit(`${phaseKey}:${buyer.id}:${player.id}:unlisted`) * .22;
      const offeredFee = moneyRound(value * factor);
      const maxFee = moneyRound(offeredFee * (1.08 + seededUnit(`${phaseKey}:${player.id}:max`) * .12));
      const wage = wageRound(estimateWeeklyWage(player) * (1.04 + seededUnit(`${phaseKey}:${player.id}:incoming-wage`) * .12));
      if (offeredFee > ai.transferBudget || wage > ai.wageRoom) continue;
      const offer = {
        id: `offer-${hashString(`${career.id}:${phaseKey}:${buyer.id}:${player.id}`).toString(16)}`,
        playerId: player.id,
        buyerClubId: buyer.id,
        offeredFee,
        maxFee,
        proposedWage: wage,
        contractYears: (player.reportedAge || 26) >= 30 ? 3 : 4,
        status: 'pending',
        createdPhase: phaseKey,
        round: career.roundIndex || 0,
        listed
      };
      career.transfers.incomingOffers.push(offer);
      addIncomingOfferNews(career, db, offer);
      return offer;
    }
  }
  return null;
}

export function getIncomingOffers(career, { includeResolved = true } = {}) {
  const offers = career?.transfers?.incomingOffers || [];
  return clone(includeResolved ? offers : offers.filter(offer => offer.status === 'pending'));
}

function completeUserSale(career, db, offer, fee) {
  const player = playerById(db, offer.playerId);
  const buyerState = career.transfers.aiClubs[offer.buyerClubId];
  if (!player || player.clubId !== career.clubId) throw new Error('That player is no longer at your club.');
  if (!buyerState || buyerState.transferBudget < fee) throw new Error('The buying club no longer has the budget to complete this deal.');
  if (buyerState.wageRoom < offer.proposedWage) throw new Error('The buying club cannot complete the player contract.');

  const oldContract = getPlayerContract(career, player);
  const reinvestmentRate = .9;
  const reinvested = moneyRound(fee * reinvestmentRate);
  const transaction = {
    id: `sale-${hashString(`${career.id}:${offer.id}:${fee}`).toString(16)}`,
    playerId: player.id,
    fromClubId: career.clubId,
    toClubId: offer.buyerClubId,
    fee,
    weeklyWage: offer.proposedWage,
    contractYears: offer.contractYears,
    round: career.roundIndex || 0,
    source: 'incoming-offer',
    reinvestmentRate
  };

  buyerState.transferBudget -= fee;
  buyerState.wageRoom -= offer.proposedWage;
  buyerState.signedPlayerIds.push(player.id);
  career.transfers.transferBudget += reinvested;
  career.transfers.wageRoom += oldContract.weeklyWage;
  career.transfers.ownership[player.id] = offer.buyerClubId;
  career.transfers.contracts[player.id] = {
    weeklyWage: offer.proposedWage,
    years: offer.contractYears,
    expiryYear: 2026 + offer.contractYears,
    signedRound: career.roundIndex || 0
  };
  career.transfers.completed.push(transaction);
  career.transfers.listedPlayerIds = career.transfers.listedPlayerIds.filter(id => id !== player.id);
  career.lineupIds = (career.lineupIds || []).filter(id => id !== player.id);
  if (career.tacticalSetup?.assignments) career.tacticalSetup.assignments = career.tacticalSetup.assignments.filter(item => item.playerId !== player.id);
  player.clubId = offer.buyerClubId;
  offer.status = 'completed';
  offer.completedFee = fee;
  addTransferNews(career, db, transaction);
  return transaction;
}

export function respondToIncomingOffer(career, db, offerId, action, counterFee = null) {
  ensureTransferState(career, db);
  requireOpenWindow(career);
  const offer = career.transfers.incomingOffers.find(item => item.id === offerId);
  if (!offer || offer.status !== 'pending') throw new Error('That offer is no longer active.');
  const decision = String(action || '').toLowerCase();
  if (decision === 'reject') {
    offer.status = 'rejected';
    return { status: 'rejected', offer: clone(offer) };
  }
  if (decision === 'accept') {
    const transaction = completeUserSale(career, db, offer, offer.offeredFee);
    return { status: 'completed', transaction: clone(transaction), offer: clone(offer) };
  }
  if (decision === 'counter') {
    const raw = Number(counterFee);
    if (!Number.isFinite(raw) || raw <= 0) throw new Error('Enter a valid counter-offer.');
    const counter = moneyRound(raw);
    offer.counterFee = counter;
    if (counter <= offer.maxFee) {
      const transaction = completeUserSale(career, db, offer, counter);
      offer.status = 'completed';
      offer.counterAccepted = true;
      return { status: 'completed', transaction: clone(transaction), offer: clone(offer) };
    }
    offer.status = 'counter-rejected';
    return { status: 'counter-rejected', offer: clone(offer) };
  }
  throw new Error('Choose accept, reject or counter.');
}

function transferWorldPhase(career) {
  if (career.preseason && career.preseason.phase !== 'complete') {
    const played = career.preseason.fixtures?.filter(fixture => fixture.played).length || 0;
    return `P${played}`;
  }
  return `R${career.roundIndex || 0}`;
}

export function processTransferWorld(career, db) {
  const stateChanged = ensureTransferState(career, db);
  const phaseKey = transferWorldPhase(career);
  const window = getTransferWindowStatus(career);
  if (career.transfers.processedWorldPhases.includes(phaseKey)) {
    return { changed: stateChanged, phaseKey, window, aiDeals: [], incomingOffer: null, rumour: null };
  }

  career.transfers.processedWorldPhases.push(phaseKey);
  let changed = true;
  expireOldIncomingOffers(career, phaseKey);

  if (!window.open) {
    const current = isoDayNumber(window.currentDate);
    const closes = isoDayNumber(window.closes);
    if (current !== null && closes !== null && current > closes && !career.transfers.windowClosedNotified) {
      career.transfers.windowClosedNotified = true;
      addWindowClosedNews(career);
    }
    return { changed, phaseKey, window, aiDeals: [], incomingOffer: null, rumour: null };
  }

  const incomingOffer = createIncomingOffer(career, db, phaseKey);
  const rumour = createRumour(career, db, phaseKey);
  let activity = window.deadlineWeek ? 3 : phaseKey.startsWith('P') ? 1 : 2;
  if (phaseKey === 'P1' || phaseKey === 'P3') activity = 0;
  const aiDeals = simulateAiMarket(career, db, phaseKey, activity);
  career.updatedAt = new Date().toISOString();
  return { changed, phaseKey, window, aiDeals: clone(aiDeals), incomingOffer: incomingOffer ? clone(incomingOffer) : null, rumour: rumour ? clone(rumour) : null };
}
