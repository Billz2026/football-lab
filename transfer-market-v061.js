import * as legacy from './transfers-v050-legacy.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const clone = value => JSON.parse(JSON.stringify(value));
const POSITION_TARGETS = Object.freeze({ GK: 3, DEF: 8, MID: 7, ATT: 5 });
const POSITION_MINIMUMS = Object.freeze({ GK: 2, DEF: 5, MID: 4, ATT: 3 });

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

function moneyRound(value, step = 250000) {
  return Math.max(step, Math.round(Number(value || 0) / step) * step);
}

function wageRound(value) {
  return Math.max(1000, Math.round(Number(value || 0) / 500) * 500);
}

function clubById(db, id) {
  return db?.clubs?.find(club => club.id === id) || null;
}

function playerById(db, id) {
  return db?.players?.find(player => player.id === id) || null;
}

function realSquad(db, clubId) {
  return (db?.players || []).filter(player => player.clubId === clubId && !player.isPlaceholder);
}

function playableClubIds(career, db) {
  const table = (career?.table || []).map(row => row.clubId).filter(Boolean);
  if (table.length >= 2) return [...new Set(table)];
  const metadata = (db?.metadata?.playableDemo?.clubIds || []).filter(id => clubById(db, id));
  if (metadata.length >= 2) return [...new Set(metadata)];
  return (db?.clubs || []).filter(club => !club.isPlaceholder).map(club => club.id);
}

function ageFactor(age) {
  if (age <= 20) return 1.08;
  if (age <= 23) return 1.16;
  if (age <= 26) return 1.13;
  if (age <= 28) return 1.04;
  if (age <= 30) return .9;
  if (age <= 32) return .72;
  if (age <= 34) return .52;
  return .36;
}

function positionPremium(player) {
  const primary = String(player?.primaryPosition || '').toUpperCase();
  const group = player?.positionGroup;
  if (group === 'ATT' || /ST|CF|RW|LW/.test(primary)) return 1.08;
  if (group === 'MID' || /AM|DM|CM/.test(primary)) return 1.04;
  if (group === 'GK') return .88;
  return 1;
}

function eliteMultiplier(ability) {
  if (ability < 165) return 1;
  return 1 + Math.min(1.15, (ability - 165) * .025);
}

export function estimatePlayerValue(player) {
  if (!player) return 0;
  const ability = clamp(Number(player.currentAbility) || 100, 70, 200);
  const potential = clamp(Number(player.potentialAbility) || ability, ability, 200);
  const age = clamp(Number(player.reportedAge) || 26, 16, 40);

  // A deliberately steep top-end curve: elite footballers are scarce assets, not linear upgrades.
  const abilityValue = 11000000 * Math.pow(ability / 120, 5.7) * eliteMultiplier(ability);
  const potentialGap = Math.max(0, potential - ability);
  const potentialValue = potentialGap * (ability >= 160 ? 1400000 : ability >= 140 ? 900000 : 500000);
  const youthUpside = age <= 22 && potential >= 165 ? 1.08 : 1;
  const value = (abilityValue + potentialValue) * ageFactor(age) * positionPremium(player) * youthUpside;

  return moneyRound(clamp(value, 500000, 275000000));
}

export function estimateWeeklyWage(player) {
  if (!player) return 0;
  if (Number.isFinite(player.contract?.weeklyWage) && player.contract.weeklyWage > 0) {
    return wageRound(player.contract.weeklyWage);
  }
  const ability = clamp(Number(player.currentAbility) || 100, 70, 200);
  const age = Number(player.reportedAge) || 26;
  let wage = 6000 * Math.pow(ability / 92, 3.35);
  if (ability >= 170) wage *= 1 + (ability - 170) * .025;
  if (age < 21) wage *= .74;
  if (age >= 32) wage *= .9;
  return wageRound(clamp(wage, 3500, 650000));
}

function rankAtClub(player, db) {
  if (!player?.clubId) return 99;
  const ranked = realSquad(db, player.clubId)
    .sort((a, b) => (Number(b.currentAbility) || 0) - (Number(a.currentAbility) || 0));
  const index = ranked.findIndex(item => item.id === player.id);
  return index < 0 ? 99 : index + 1;
}

function groupPlayers(db, clubId, group) {
  return realSquad(db, clubId).filter(player => player.positionGroup === group);
}

function groupCount(db, clubId, group) {
  return groupPlayers(db, clubId, group).length;
}

function squadAverageAbility(db, clubId, group = null) {
  let squad = realSquad(db, clubId);
  if (group) squad = squad.filter(player => player.positionGroup === group);
  if (!squad.length) return 100;
  return squad.reduce((sum, player) => sum + (Number(player.currentAbility) || 100), 0) / squad.length;
}

function isSquadSurplus(player, db) {
  if (!player?.clubId || !player.positionGroup) return false;
  const sameGroup = groupPlayers(db, player.clubId, player.positionGroup);
  const target = POSITION_TARGETS[player.positionGroup] || 4;
  if (sameGroup.length <= target) return false;
  const sorted = [...sameGroup].sort((a, b) => (Number(b.currentAbility) || 0) - (Number(a.currentAbility) || 0));
  return sorted.findIndex(item => item.id === player.id) >= Math.max(2, target - 2);
}

function canSellWithoutBreakingSquad(player, db) {
  if (!player?.clubId || !player.positionGroup) return false;
  return groupCount(db, player.clubId, player.positionGroup) > (POSITION_MINIMUMS[player.positionGroup] || 2);
}

function contractYears(career, player) {
  try {
    return legacy.getPlayerContract(career, player)?.yearsRemaining ?? 2;
  } catch {
    return 2;
  }
}

function clubReputation(db, clubId) {
  return Number(clubById(db, clubId)?.reputation) || 7000;
}

export function getTransferStance(player, db, career = null, buyerClubId = career?.clubId || null) {
  if (!player) return null;
  const value = estimatePlayerValue(player);
  const rank = rankAtClub(player, db);
  const ability = Number(player.currentAbility) || 100;
  const years = career ? contractYears(career, player) : 2;
  const sellerRep = clubReputation(db, player.clubId);
  const buyerRep = clubReputation(db, buyerClubId);
  const listed = Boolean(career?.transfers?.listedPlayerIds?.includes(player.id));
  const surplus = isSquadSurplus(player, db);
  const thinPosition = !canSellWithoutBreakingSquad(player, db);
  const elite = ability >= 176 || (rank === 1 && ability >= 168);
  const key = rank <= 3;

  let multiplier = 1.12;
  let label = 'Open to offers';
  let tone = 'open';

  if (listed || surplus) {
    multiplier = years <= 1 ? .92 : 1.02;
    label = listed ? 'Available for transfer' : 'Could be sold';
    tone = 'available';
  } else if (elite) {
    multiplier = 1.72 + Math.min(.32, Math.max(0, years - 2) * .08);
    label = 'Not for sale';
    tone = 'resistant';
  } else if (key) {
    multiplier = 1.42 + Math.min(.18, Math.max(0, years - 2) * .06);
    label = 'Key player — reluctant to sell';
    tone = 'reluctant';
  } else if (years <= 1) {
    multiplier = 1.02;
    label = 'Contract situation creates an opportunity';
    tone = 'open';
  } else {
    multiplier = 1.18 + Math.min(.12, Math.max(0, years - 2) * .04);
  }

  if (thinPosition && !listed) multiplier += elite ? .18 : .12;
  if (buyerClubId && buyerClubId !== player.clubId && buyerRep < sellerRep - 900 && key) multiplier += .12;
  if (buyerClubId && buyerClubId !== player.clubId && clubById(db, buyerClubId)?.leagueId === clubById(db, player.clubId)?.leagueId) multiplier += .06;

  const askingPrice = moneyRound(value * multiplier);
  let minimumMultiplier = listed ? .9 : surplus ? .96 : elite ? 1.48 : key ? 1.24 : 1.04;
  if (years <= 1) minimumMultiplier -= elite ? .16 : .12;
  if (thinPosition && !listed) minimumMultiplier += .08;
  const minimumAcceptable = moneyRound(value * Math.max(.78, minimumMultiplier));

  return {
    label,
    tone,
    value,
    askingPrice,
    minimumAcceptable: Math.min(askingPrice, minimumAcceptable),
    rank,
    elite,
    key,
    listed,
    surplus,
    thinPosition,
    contractYears: years,
    sellerReputation: sellerRep,
    buyerReputation: buyerRep
  };
}

export function getAskingPrice(player, db, career = null) {
  return getTransferStance(player, db, career)?.askingPrice || estimatePlayerValue(player);
}

function ensureNegotiationMeta(career) {
  career.transfers ||= {};
  career.transfers.negotiations ||= {};
  career.transfers.marketV61 ||= {
    schemaVersion: 1,
    processedDates: [],
    aiDealsByDate: {},
    rumoursByDate: {},
    incomingByDate: {}
  };
  return career.transfers.marketV61;
}

export function getNegotiation(career, db, playerId) {
  legacy.ensureTransferState(career, db);
  ensureNegotiationMeta(career);
  const player = playerById(db, playerId);
  if (!player || player.clubId === career.clubId) return null;
  const stance = getTransferStance(player, db, career, career.clubId);
  let record = career.transfers.negotiations[playerId];
  if (!record || record.marketVersion !== 61 || record.sellingClubId !== player.clubId) {
    const wageDemand = wageRound(estimateWeeklyWage(player) * (1.05 + seededUnit(`${career.id}:${player.id}:v61-wage`) * .14));
    record = {
      marketVersion: 61,
      playerId: player.id,
      sellingClubId: player.clubId,
      askingPrice: stance.askingPrice,
      minimumAcceptable: stance.minimumAcceptable,
      sellerStance: stance.label,
      sellerTone: stance.tone,
      wageDemand,
      status: 'idle',
      lastOffer: 0,
      counterFee: null,
      contractYears: null,
      wageOffer: null,
      offerRounds: 0,
      maxOfferRounds: 4,
      messages: []
    };
    career.transfers.negotiations[playerId] = record;
  } else if (!['fee-accepted', 'contract-countered', 'completed'].includes(record.status)) {
    record.askingPrice = stance.askingPrice;
    record.minimumAcceptable = stance.minimumAcceptable;
    record.sellerStance = stance.label;
    record.sellerTone = stance.tone;
  }
  return record;
}

function sellerName(db, clubId) {
  const club = clubById(db, clubId);
  return club?.shortName || club?.name || 'The selling club';
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
  const seller = sellerName(db, player.clubId);
  negotiation.offerRounds = (negotiation.offerRounds || 0) + 1;
  negotiation.lastOffer = offer;
  negotiation.askingPrice = stance.askingPrice;
  negotiation.minimumAcceptable = stance.minimumAcceptable;

  if (negotiation.offerRounds > negotiation.maxOfferRounds) {
    negotiation.status = 'walked-away';
    negotiation.counterFee = null;
    negotiation.messages.push(`${seller} have ended negotiations after repeated offers failed to meet their valuation.`);
    return { status: 'walked-away', negotiation: clone(negotiation), stance: clone(stance) };
  }

  const acceptance = stance.minimumAcceptable;
  if (offer >= acceptance) {
    negotiation.status = 'fee-accepted';
    negotiation.counterFee = null;
    negotiation.messages.push(`${seller} accepted your £${offer.toLocaleString('en-GB')} bid. You can now negotiate personal terms.`);
    return { status: 'accepted', negotiation: clone(negotiation), stance: clone(stance) };
  }

  const ratio = offer / Math.max(1, acceptance);
  const counterThreshold = stance.tone === 'resistant' ? .82 : stance.tone === 'reluctant' ? .76 : .68;
  if (ratio >= counterThreshold) {
    const firmness = stance.tone === 'resistant' ? .78 : stance.tone === 'reluctant' ? .67 : .58;
    const counter = moneyRound(Math.max(acceptance, offer + (stance.askingPrice - offer) * firmness));
    negotiation.status = 'countered';
    negotiation.counterFee = Math.min(stance.askingPrice, counter);
    negotiation.messages.push(`${seller} rejected £${offer.toLocaleString('en-GB')} and countered at £${negotiation.counterFee.toLocaleString('en-GB')}.`);
    return { status: 'countered', negotiation: clone(negotiation), stance: clone(stance) };
  }

  negotiation.status = 'rejected';
  negotiation.counterFee = null;
  negotiation.messages.push(stance.tone === 'resistant'
    ? `${seller} immediately rejected the bid. ${player.name} is considered unavailable unless an exceptional offer changes their position.`
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

export function submitContractOffer(career, db, playerId, weeklyWage, years = 4) {
  // Completion remains delegated to the proven V0.5 transaction path after V0.6.1 agrees the fee.
  return legacy.submitContractOffer(career, db, playerId, weeklyWage, years);
}

function needProfile(db, clubId) {
  const result = {};
  for (const group of Object.keys(POSITION_TARGETS)) {
    const players = groupPlayers(db, clubId, group);
    const target = POSITION_TARGETS[group];
    const countGap = Math.max(0, target - players.length);
    const average = squadAverageAbility(db, clubId, group);
    const best = [...players].sort((a, b) => (Number(b.currentAbility) || 0) - (Number(a.currentAbility) || 0))[0];
    const qualityGap = Math.max(0, 145 - average);
    const starterGap = Math.max(0, 158 - (Number(best?.currentAbility) || 100));
    result[group] = {
      score: countGap * 30 + qualityGap * .55 + starterGap * .28,
      countGap,
      average,
      bestAbility: Number(best?.currentAbility) || 100
    };
  }
  return result;
}

function addNews(career, item) {
  career.news ||= { schemaVersion: 1, items: [], generatedRounds: [] };
  career.news.items ||= [];
  if (career.news.items.some(existing => existing.id === item.id)) return;
  career.news.items.push({
    round: career.roundIndex || 0,
    period: 'PM',
    order: 52000 + career.news.items.length,
    read: false,
    ...item
  });
}

function currentDate(career) {
  return career.currentDate || career.calendar?.currentDate || '2026-06-15';
}

function shortDate(value) {
  const date = new Date(`${value}T12:00:00Z`);
  return new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(date).toUpperCase();
}

function aiCanAfford(career, buyerClubId, fee, wage) {
  const ai = career.transfers.aiClubs?.[buyerClubId];
  return Boolean(ai && ai.transferBudget >= fee && ai.wageRoom >= wage);
}

function playerWouldConsiderMove(player, db, buyerClubId, career) {
  const sellerRep = clubReputation(db, player.clubId);
  const buyerRep = clubReputation(db, buyerClubId);
  const ability = Number(player.currentAbility) || 100;
  const years = contractYears(career, player);
  const surplus = isSquadSurplus(player, db);
  if (ability >= 170 && buyerRep < sellerRep - 500 && years > 1 && !surplus) return false;
  if (buyerRep < sellerRep - 1100 && years > 1 && !surplus) return false;
  return true;
}

function candidateScore(career, db, buyerClubId, player, need, dateKey) {
  const ability = Number(player.currentAbility) || 100;
  const potential = Number(player.potentialAbility) || ability;
  const age = Number(player.reportedAge) || 26;
  const value = estimatePlayerValue(player);
  const buyerRep = clubReputation(db, buyerClubId);
  const sellerRep = clubReputation(db, player.clubId);
  const squadAverage = squadAverageAbility(db, buyerClubId, player.positionGroup);
  const improvement = ability - squadAverage;
  const ageScore = age <= 23 ? 12 : age <= 27 ? 8 : age <= 30 ? 2 : -8;
  const potentialScore = Math.max(0, potential - ability) * .35;
  const moveFit = Math.max(-18, Math.min(14, (buyerRep - sellerRep) / 90));
  const valueEfficiency = Math.max(-22, 16 - value / 9000000);
  const starterQuality = improvement * 1.15;
  const randomTieBreak = seededUnit(`${career.id}:${dateKey}:${buyerClubId}:${player.id}:target`) * 3;
  return need.score + starterQuality + ageScore + potentialScore + moveFit + valueEfficiency + randomTieBreak;
}

function chooseAiTarget(career, db, buyerClubId, dateKey) {
  const ai = career.transfers.aiClubs?.[buyerClubId];
  if (!ai || ai.transferBudget < 2500000) return null;
  const needs = needProfile(db, buyerClubId);
  const groups = Object.keys(needs).sort((a, b) => needs[b].score - needs[a].score);
  const allowed = new Set(playableClubIds(career, db));
  const buyerAverage = squadAverageAbility(db, buyerClubId);

  for (const group of groups) {
    const need = needs[group];
    const candidates = (db.players || [])
      .filter(player => !player.isPlaceholder && player.clubId && player.clubId !== buyerClubId && player.clubId !== career.clubId)
      .filter(player => allowed.has(player.clubId) && player.positionGroup === group)
      .filter(player => (Number(player.reportedAge) || 26) <= 32)
      .filter(player => canSellWithoutBreakingSquad(player, db))
      .filter(player => playerWouldConsiderMove(player, db, buyerClubId, career))
      .map(player => {
        const stance = getTransferStance(player, db, career, buyerClubId);
        const wage = estimateWeeklyWage(player);
        const ability = Number(player.currentAbility) || 100;
        const minimumQuality = need.countGap >= 2 ? buyerAverage - 14 : buyerAverage - 5;
        if (ability < minimumQuality) return null;
        if (stance.askingPrice > ai.transferBudget * .82 || wage > ai.wageRoom * .7) return null;
        return { player, stance, wage, score: candidateScore(career, db, buyerClubId, player, need, dateKey) };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score);
    if (candidates.length) return candidates[0];
  }
  return null;
}

function addAiTransferNews(career, db, transaction) {
  const player = playerById(db, transaction.playerId);
  const buyer = clubById(db, transaction.toClubId);
  const seller = clubById(db, transaction.fromClubId);
  addNews(career, {
    id: `news-${career.id}-v61-transfer-${transaction.id}`,
    key: `v61-transfer-${transaction.id}`,
    dateLabel: shortDate(currentDate(career)),
    category: 'Transfers',
    source: 'Transfer Desk',
    title: `${buyer?.shortName || buyer?.name || 'Club'} sign ${player?.name || 'player'}`,
    body: `${buyer?.name || 'The buying club'} have signed ${player?.name || 'the player'} from ${seller?.name || 'the selling club'} for £${transaction.fee.toLocaleString('en-GB')}. The deal followed a squad-needs assessment rather than random market activity.`,
    priority: 'normal',
    relatedClubId: transaction.toClubId,
    relatedPlayerId: transaction.playerId
  });
}

function completeAiDeal(career, db, buyerClubId, candidate, dateKey) {
  const { player, stance } = candidate;
  const buyer = career.transfers.aiClubs?.[buyerClubId];
  const seller = career.transfers.aiClubs?.[player.clubId];
  if (!buyer || !seller) return null;

  // AI clubs negotiate: they normally land between the seller's minimum and asking price, never at a cheap flat value multiple.
  const fee = moneyRound(stance.minimumAcceptable + (stance.askingPrice - stance.minimumAcceptable) * (.3 + seededUnit(`${dateKey}:${buyerClubId}:${player.id}:fee`) * .35));
  const wage = wageRound(estimateWeeklyWage(player) * (1.04 + seededUnit(`${dateKey}:${buyerClubId}:${player.id}:wage`) * .14));
  if (!aiCanAfford(career, buyerClubId, fee, wage)) return null;
  if (stance.tone === 'resistant' && fee < stance.minimumAcceptable) return null;

  const fromClubId = player.clubId;
  const years = (Number(player.reportedAge) || 26) >= 30 ? 2 + (hashString(`${player.id}:v61-years`) % 2) : 4 + (hashString(`${player.id}:v61-years`) % 2);
  const transaction = {
    id: `v61-ai-${hashString(`${career.id}:${dateKey}:${buyerClubId}:${player.id}:${fee}`).toString(16)}`,
    playerId: player.id,
    fromClubId,
    toClubId: buyerClubId,
    fee,
    weeklyWage: wage,
    contractYears: years,
    round: career.roundIndex || 0,
    source: 'ai-v61',
    date: currentDate(career)
  };

  buyer.transferBudget -= fee;
  buyer.wageRoom -= wage;
  buyer.signedPlayerIds ||= [];
  buyer.signedPlayerIds.push(player.id);
  seller.transferBudget += moneyRound(fee * .82);
  seller.soldPlayerIds ||= [];
  seller.soldPlayerIds.push(player.id);
  career.transfers.ownership[player.id] = buyerClubId;
  career.transfers.contracts[player.id] = { weeklyWage: wage, years, expiryYear: 2026 + years, signedRound: career.roundIndex || 0 };
  career.transfers.completed.push(transaction);
  player.clubId = buyerClubId;
  addAiTransferNews(career, db, transaction);
  return transaction;
}

function addRumour(career, db, buyerClubId, player, dateKey) {
  const id = `v61-rumour-${hashString(`${career.id}:${dateKey}:${buyerClubId}:${player.id}`).toString(16)}`;
  if (career.transfers.rumours?.some(item => item.id === id)) return null;
  const rumour = { id, phaseKey: `D:${dateKey}`, buyerClubId, playerId: player.id, round: career.roundIndex || 0, date: dateKey };
  career.transfers.rumours ||= [];
  career.transfers.rumours.push(rumour);
  const buyer = clubById(db, buyerClubId);
  const seller = clubById(db, player.clubId);
  addNews(career, {
    id: `news-${career.id}-${id}`,
    key: id,
    dateLabel: shortDate(dateKey),
    category: 'Transfers',
    source: 'Transfer Desk',
    title: `${buyer?.shortName || buyer?.name || 'Club'} consider move for ${player.name}`,
    body: `${buyer?.name || 'The club'} are assessing ${player.name} as a possible addition. ${seller?.name || 'The selling club'} currently view him as ${getTransferStance(player, db, career, buyerClubId).label.toLowerCase()}. No fee has been agreed.`,
    priority: 'normal',
    relatedClubId: buyerClubId,
    relatedPlayerId: player.id
  });
  return rumour;
}

function candidateForIncomingOffer(career, db, dateKey) {
  const own = realSquad(db, career.clubId);
  const listed = new Set(career.transfers.listedPlayerIds || []);
  const userRep = clubReputation(db, career.clubId);
  const candidates = own
    .filter(player => canSellWithoutBreakingSquad(player, db))
    .map(player => {
      const rank = rankAtClub(player, db);
      const listedBonus = listed.has(player.id) ? 120 : 0;
      const value = estimatePlayerValue(player);
      const starPenalty = rank <= 3 ? 18 : 0;
      return { player, listed: listed.has(player.id), score: listedBonus + value / 2500000 - starPenalty + seededUnit(`${dateKey}:${player.id}:incoming`) * 7 };
    })
    .sort((a, b) => b.score - a.score);

  for (const item of candidates) {
    const buyerCandidates = playableClubIds(career, db)
      .filter(id => id !== career.clubId && career.transfers.aiClubs?.[id])
      .map(id => ({ id, need: needProfile(db, id)[item.player.positionGroup]?.score || 0, rep: clubReputation(db, id) }))
      .filter(buyer => buyer.need > 12 && (item.listed || buyer.rep >= userRep - 700))
      .sort((a, b) => b.need - a.need || b.rep - a.rep);
    const buyer = buyerCandidates[0];
    if (!buyer) continue;
    const ai = career.transfers.aiClubs[buyer.id];
    const stance = getTransferStance(item.player, db, career, buyer.id);
    const value = stance.value;
    const baseFactor = item.listed ? .94 : stance.key ? 1.3 : 1.12;
    const offeredFee = moneyRound(value * (baseFactor + seededUnit(`${dateKey}:${buyer.id}:${item.player.id}:bid`) * (item.listed ? .12 : .18)));
    const maxFee = moneyRound(Math.max(offeredFee, stance.minimumAcceptable) * (1.03 + seededUnit(`${dateKey}:${item.player.id}:max`) * .1));
    const wage = wageRound(estimateWeeklyWage(item.player) * (1.05 + seededUnit(`${dateKey}:${item.player.id}:iw`) * .12));
    if (offeredFee > ai.transferBudget || wage > ai.wageRoom) continue;
    return { ...item, buyerClubId: buyer.id, offeredFee, maxFee, wage };
  }
  return null;
}

function createIncomingOffer(career, db, dateKey) {
  if ((career.transfers.incomingOffers || []).some(offer => offer.status === 'pending')) return null;
  const hasListed = (career.transfers.listedPlayerIds || []).length > 0;
  const roll = seededUnit(`${career.id}:${dateKey}:v61-incoming-roll`);
  if (roll > (hasListed ? .32 : .1)) return null;
  const candidate = candidateForIncomingOffer(career, db, dateKey);
  if (!candidate) return null;
  const offer = {
    id: `v61-offer-${hashString(`${career.id}:${dateKey}:${candidate.buyerClubId}:${candidate.player.id}`).toString(16)}`,
    playerId: candidate.player.id,
    buyerClubId: candidate.buyerClubId,
    offeredFee: candidate.offeredFee,
    maxFee: candidate.maxFee,
    proposedWage: candidate.wage,
    contractYears: (Number(candidate.player.reportedAge) || 26) >= 30 ? 3 : 4,
    status: 'pending',
    createdPhase: `D:${dateKey}`,
    round: career.roundIndex || 0,
    listed: candidate.listed,
    date: dateKey
  };
  career.transfers.incomingOffers.push(offer);
  const buyer = clubById(db, offer.buyerClubId);
  addNews(career, {
    id: `news-${career.id}-incoming-${offer.id}`,
    key: `incoming-${offer.id}`,
    dateLabel: shortDate(dateKey),
    category: 'Transfers',
    source: 'Transfer Desk',
    title: `${buyer?.shortName || buyer?.name || 'Club'} bid for ${candidate.player.name}`,
    body: `${buyer?.name || 'The buying club'} have submitted a £${offer.offeredFee.toLocaleString('en-GB')} bid for ${candidate.player.name}. Review the proposal in Transfers > Offers.`,
    priority: 'important',
    relatedClubId: offer.buyerClubId,
    relatedPlayerId: offer.playerId
  });
  return offer;
}

export function processTransferWorld(career, db) {
  const changedState = legacy.ensureTransferState(career, db);
  const meta = ensureNegotiationMeta(career);
  const window = legacy.getTransferWindowStatus(career);
  const dateKey = currentDate(career);
  if (meta.processedDates.includes(dateKey)) {
    return { changed: changedState, phaseKey: `D:${dateKey}`, window, aiDeals: [], incomingOffer: null, rumour: null };
  }
  meta.processedDates.push(dateKey);
  if (!window.open) return { changed: changedState, phaseKey: `D:${dateKey}`, window, aiDeals: [], incomingOffer: null, rumour: null };

  // Pending user bids remain live for several days rather than being withdrawn at the next arbitrary UI phase.
  for (const offer of career.transfers.incomingOffers || []) {
    if (offer.status !== 'pending' || !offer.date) continue;
    const ageDays = Math.floor((Date.parse(`${dateKey}T00:00:00Z`) - Date.parse(`${offer.date}T00:00:00Z`)) / 86400000);
    if (ageDays >= 4) offer.status = 'withdrawn';
  }

  const incomingOffer = createIncomingOffer(career, db, dateKey);
  const deadlineWeek = Boolean(window.deadlineWeek);
  const marketRoll = seededUnit(`${career.id}:${dateKey}:v61-market`);
  const activeMarket = marketRoll < (deadlineWeek ? .72 : .34);
  const maxDeals = activeMarket ? (deadlineWeek && marketRoll < .26 ? 2 : 1) : 0;
  const aiDeals = [];
  let rumour = null;

  const buyers = playableClubIds(career, db)
    .filter(id => id !== career.clubId && career.transfers.aiClubs?.[id])
    .sort((a, b) => hashString(`${dateKey}:${a}`) - hashString(`${dateKey}:${b}`));

  for (const buyerClubId of buyers) {
    const target = chooseAiTarget(career, db, buyerClubId, dateKey);
    if (!target) continue;
    if (!rumour && seededUnit(`${dateKey}:${buyerClubId}:rumour-roll`) < .55) rumour = addRumour(career, db, buyerClubId, target.player, dateKey);
    if (aiDeals.length >= maxDeals) continue;
    if (seededUnit(`${dateKey}:${buyerClubId}:${target.player.id}:deal-roll`) > (deadlineWeek ? .72 : .5)) continue;
    const deal = completeAiDeal(career, db, buyerClubId, target, dateKey);
    if (deal) aiDeals.push(deal);
  }

  meta.aiDealsByDate[dateKey] = aiDeals.map(deal => deal.id);
  if (rumour) meta.rumoursByDate[dateKey] = rumour.id;
  if (incomingOffer) meta.incomingByDate[dateKey] = incomingOffer.id;
  career.updatedAt = new Date().toISOString();
  return { changed: true, phaseKey: `D:${dateKey}`, window, aiDeals: clone(aiDeals), incomingOffer: incomingOffer ? clone(incomingOffer) : null, rumour: rumour ? clone(rumour) : null };
}

export function searchTransferMarket(career, db, filters = {}) {
  legacy.ensureTransferState(career, db);
  const { query = '', position = 'All', clubId = 'All' } = filters;
  const term = String(query).trim().toLowerCase();
  return (db.players || [])
    .filter(player => !player.isPlaceholder && player.clubId && player.clubId !== career.clubId)
    .filter(player => playableClubIds(career, db).includes(player.clubId))
    .filter(player => clubId === 'All' || player.clubId === clubId)
    .filter(player => position === 'All' || player.positionGroup === position)
    .filter(player => !term || player.name.toLowerCase().includes(term) || String(player.primaryPosition || '').toLowerCase().includes(term))
    .sort((a, b) => estimatePlayerValue(b) - estimatePlayerValue(a) || a.name.localeCompare(b.name));
}
