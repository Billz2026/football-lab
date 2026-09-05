import { ensureTransferState, estimateWeeklyWage, getPlayerContract } from './transfers-v050-legacy.js';

export const PLAYER_DYNAMICS_SCHEMA_VERSION = 1;
export const SQUAD_ROLES = Object.freeze(['Star', 'Important', 'Rotation', 'Prospect']);
export const AGENT_STYLES = Object.freeze(['Pragmatic', 'Demanding', 'Ambitious', 'Loyal']);

const ROLE_START_SHARE = Object.freeze({ Star: .78, Important: .60, Rotation: .30, Prospect: .12 });
const ROLE_WAGE_MULTIPLIER = Object.freeze({ Star: 1.28, Important: 1.12, Rotation: .98, Prospect: .82 });
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const moneyRound = (value, step = 500) => Math.max(step, Math.round(Number(value || 0) / step) * step);

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

function playerById(db, id) {
  return db?.players?.find(player => player.id === id) || null;
}

function clubById(db, id) {
  return db?.clubs?.find(club => club.id === id) || null;
}

function clubReputation(db, clubId) {
  return Number(clubById(db, clubId)?.reputation) || 7000;
}

function realSquad(db, clubId) {
  return (db?.players || []).filter(player => player.clubId === clubId && !player.isPlaceholder);
}

function rankAtClub(player, db) {
  if (!player?.clubId) return 99;
  const ranked = realSquad(db, player.clubId)
    .sort((a, b) => (Number(b.currentAbility) || 0) - (Number(a.currentAbility) || 0));
  const index = ranked.findIndex(item => item.id === player.id);
  return index < 0 ? 99 : index + 1;
}

function defaultRole(player, db) {
  const age = Number(player?.reportedAge) || 26;
  const rank = rankAtClub(player, db);
  const ability = Number(player?.currentAbility) || 100;
  if (rank <= 2 || (rank <= 3 && ability >= 166)) return 'Star';
  if (rank <= 7) return 'Important';
  if (age <= 21 && rank > 13) return 'Prospect';
  if (rank <= 17) return 'Rotation';
  return age <= 23 ? 'Prospect' : 'Rotation';
}

function agentFor(career, player) {
  const seed = `${career?.seed || career?.id || 'career'}:${player.id}:agent`;
  const style = AGENT_STYLES[hashString(seed) % AGENT_STYLES.length];
  const influence = 42 + Math.floor(seededUnit(`${seed}:influence`) * 48);
  const first = ['Alex', 'Marco', 'Samir', 'Daniel', 'Leon', 'Victor', 'Rafael', 'Theo'][hashString(`${seed}:first`) % 8];
  const last = ['Cole', 'Silva', 'Ward', 'Moretti', 'Khan', 'Bennett', 'Costa', 'Reed'][hashString(`${seed}:last`) % 8];
  return { name: `${first} ${last}`, style, influence };
}

function initialDynamics(career, player, db) {
  const role = defaultRole(player, db);
  const seed = `${career?.seed || career?.id || 'career'}:${player.id}:dynamics`;
  const ambition = 38 + Math.floor(seededUnit(`${seed}:ambition`) * 57);
  const loyalty = 32 + Math.floor(seededUnit(`${seed}:loyalty`) * 63);
  const patience = 30 + Math.floor(seededUnit(`${seed}:patience`) * 66);
  const happiness = 67 + Math.floor(seededUnit(`${seed}:happiness`) * 17);
  return {
    squadRole: role,
    expectedStartShare: ROLE_START_SHARE[role],
    happiness,
    morale: 72,
    ambition,
    loyalty,
    patience,
    agent: agentFor(career, player),
    transferRequest: null,
    lastRoleChangeDate: null,
    lastReviewDate: career?.currentDate || null,
    lastReviewedRound: Number(career?.roundIndex) || 0,
    appearancesAtReview: Number(career?.playerStatus?.[player.id]?.appearances) || 0
  };
}

function normalizeRecord(career, player, db, record) {
  const fallback = initialDynamics(career, player, db);
  const next = record && typeof record === 'object' ? record : {};
  if (!SQUAD_ROLES.includes(next.squadRole)) next.squadRole = fallback.squadRole;
  next.expectedStartShare = ROLE_START_SHARE[next.squadRole];
  for (const key of ['happiness', 'morale', 'ambition', 'loyalty', 'patience']) {
    if (!Number.isFinite(Number(next[key]))) next[key] = fallback[key];
    next[key] = clamp(Math.round(Number(next[key])), 0, 100);
  }
  if (!next.agent || !AGENT_STYLES.includes(next.agent.style)) next.agent = fallback.agent;
  if (!Number.isFinite(Number(next.agent.influence))) next.agent.influence = fallback.agent.influence;
  next.agent.influence = clamp(Math.round(Number(next.agent.influence)), 0, 100);
  if (next.transferRequest && typeof next.transferRequest !== 'object') next.transferRequest = null;
  if (!Number.isFinite(Number(next.lastReviewedRound))) next.lastReviewedRound = Number(career?.roundIndex) || 0;
  if (!Number.isFinite(Number(next.appearancesAtReview))) next.appearancesAtReview = Number(career?.playerStatus?.[player.id]?.appearances) || 0;
  next.lastReviewDate ||= career?.currentDate || null;
  return next;
}

export function ensurePlayerDynamics(career, db) {
  if (!career || !db) return false;
  let changed = false;
  if (!career.playerDynamics || typeof career.playerDynamics !== 'object') {
    career.playerDynamics = { schemaVersion: PLAYER_DYNAMICS_SCHEMA_VERSION, players: {}, processedDates: [] };
    changed = true;
  }
  const state = career.playerDynamics;
  if (state.schemaVersion !== PLAYER_DYNAMICS_SCHEMA_VERSION) {
    state.schemaVersion = PLAYER_DYNAMICS_SCHEMA_VERSION;
    changed = true;
  }
  if (!state.players || typeof state.players !== 'object' || Array.isArray(state.players)) {
    state.players = {};
    changed = true;
  }
  if (!Array.isArray(state.processedDates)) {
    state.processedDates = [];
    changed = true;
  }

  for (const player of db.players || []) {
    if (!player.clubId || player.isPlaceholder) continue;
    const before = state.players[player.id];
    state.players[player.id] = normalizeRecord(career, player, db, before);
    if (!before) changed = true;
  }
  return changed;
}

export function getPlayerDynamics(career, db, playerId) {
  ensurePlayerDynamics(career, db);
  const player = playerById(db, playerId);
  if (!player) return null;
  career.playerDynamics.players[playerId] = normalizeRecord(career, player, db, career.playerDynamics.players[playerId]);
  return career.playerDynamics.players[playerId];
}

export function happinessLabel(score) {
  const value = Number(score) || 0;
  if (value >= 82) return 'Very Happy';
  if (value >= 65) return 'Happy';
  if (value >= 48) return 'Content';
  if (value >= 32) return 'Unsettled';
  return 'Unhappy';
}

export function moraleLabel(score) {
  const value = Number(score) || 0;
  if (value >= 82) return 'Superb';
  if (value >= 65) return 'Good';
  if (value >= 48) return 'Okay';
  if (value >= 32) return 'Low';
  return 'Very Low';
}

export function setSquadRole(career, db, playerId, role) {
  if (!SQUAD_ROLES.includes(role)) throw new Error('Choose a valid squad role.');
  const player = playerById(db, playerId);
  if (!player || player.clubId !== career?.clubId) throw new Error('You can only set roles for your own players.');
  const dynamics = getPlayerDynamics(career, db, playerId);
  const oldRole = dynamics.squadRole;
  if (oldRole === role) return { changed: false, dynamics };
  const oldShare = ROLE_START_SHARE[oldRole];
  const newShare = ROLE_START_SHARE[role];
  const delta = newShare > oldShare ? 5 : newShare < oldShare ? -8 : 0;
  dynamics.squadRole = role;
  dynamics.expectedStartShare = newShare;
  dynamics.happiness = clamp(dynamics.happiness + delta, 0, 100);
  dynamics.lastRoleChangeDate = career.currentDate || null;
  return { changed: true, oldRole, role, dynamics };
}

function maybeCreateTransferRequest(career, player, dynamics) {
  if (dynamics.transferRequest?.active) return false;
  const pressure = (100 - dynamics.happiness) * .56 + dynamics.ambition * .25 + (100 - dynamics.loyalty) * .19;
  const threshold = 61 + dynamics.patience * .12;
  if (dynamics.happiness > 30 || pressure < threshold) return false;
  dynamics.transferRequest = {
    active: true,
    requestedDate: career.currentDate || null,
    reason: dynamics.squadRole === 'Star' || dynamics.squadRole === 'Important'
      ? 'Frustrated by a lack of first-team football'
      : 'Wants a new challenge'
  };
  return true;
}

export function processPlayerDynamics(career, db) {
  ensurePlayerDynamics(career, db);
  const date = career?.currentDate || career?.calendar?.currentDate || null;
  if (!date || career.playerDynamics.processedDates.includes(date)) return { changed: false, requests: [] };
  career.playerDynamics.processedDates.push(date);
  if (career.playerDynamics.processedDates.length > 180) career.playerDynamics.processedDates.splice(0, career.playerDynamics.processedDates.length - 180);

  let changed = false;
  const requests = [];
  const round = Number(career.roundIndex) || 0;
  const ownPlayers = realSquad(db, career.clubId);
  for (const player of ownPlayers) {
    const dynamics = getPlayerDynamics(career, db, player.id);
    const status = career.playerStatus?.[player.id] || {};
    const appearances = Number(status.appearances) || 0;
    const roundsSince = Math.max(0, round - (Number(dynamics.lastReviewedRound) || 0));
    const appsSince = Math.max(0, appearances - (Number(dynamics.appearancesAtReview) || 0));
    if (roundsSince < 3) continue;

    const actualShare = appsSince / Math.max(1, roundsSince);
    const expected = ROLE_START_SHARE[dynamics.squadRole];
    const gap = actualShare - expected;
    let happinessDelta = 0;
    if (gap >= .18) happinessDelta = 4;
    else if (gap >= -.10) happinessDelta = 1;
    else if (gap >= -.28) happinessDelta = -5;
    else happinessDelta = dynamics.squadRole === 'Star' ? -12 : dynamics.squadRole === 'Important' ? -10 : -7;

    const resultMorale = String(status.morale || '').toLowerCase();
    if (resultMorale.includes('very') && resultMorale.includes('good')) happinessDelta += 2;
    if (resultMorale.includes('poor') || resultMorale.includes('low')) happinessDelta -= 2;
    dynamics.happiness = clamp(dynamics.happiness + happinessDelta, 0, 100);
    dynamics.morale = clamp(dynamics.morale + Math.sign(happinessDelta) * Math.min(4, Math.abs(happinessDelta)), 0, 100);
    dynamics.lastReviewedRound = round;
    dynamics.appearancesAtReview = appearances;
    dynamics.lastReviewDate = date;
    changed = true;

    if (maybeCreateTransferRequest(career, player, dynamics)) {
      requests.push({ playerId: player.id, playerName: player.name, reason: dynamics.transferRequest.reason });
      changed = true;
    }
  }
  return { changed, requests };
}

export function withdrawTransferRequest(career, db, playerId) {
  const dynamics = getPlayerDynamics(career, db, playerId);
  if (!dynamics?.transferRequest?.active) return false;
  if (dynamics.happiness < 58) return false;
  dynamics.transferRequest = { ...dynamics.transferRequest, active: false, withdrawnDate: career.currentDate || null };
  return true;
}

export function getMoveWillingness(career, db, playerId, buyerClubId = career?.clubId) {
  const player = playerById(db, playerId);
  if (!player || !buyerClubId) return null;
  const dynamics = getPlayerDynamics(career, db, playerId);
  const currentRep = clubReputation(db, player.clubId);
  const buyerRep = clubReputation(db, buyerClubId);
  const repGap = buyerRep - currentRep;
  let score = 48;
  score += clamp(repGap / 55, -32, 30);
  score += (dynamics.ambition - 50) * (repGap >= 0 ? .18 : -.10);
  score += (60 - dynamics.happiness) * .34;
  score += dynamics.transferRequest?.active ? 18 : 0;
  score += dynamics.squadRole === 'Prospect' ? 3 : dynamics.squadRole === 'Star' ? -4 : 0;
  score += (100 - dynamics.loyalty) * .06;
  const age = Number(player.reportedAge) || 26;
  if (age <= 23 && buyerRep > currentRep) score += 5;
  if (buyerClubId === player.clubId) score = 100;
  score = clamp(Math.round(score), 0, 100);

  let label = 'Open to move';
  if (score >= 76) label = 'Very interested';
  else if (score >= 58) label = 'Interested';
  else if (score >= 40) label = 'Needs convincing';
  else label = 'Not interested';

  let reason = 'The player would consider the sporting project.';
  if (repGap < -800 && score < 50) reason = 'The player sees this as too large a step down.';
  else if (dynamics.transferRequest?.active) reason = 'The player is actively looking for a move.';
  else if (dynamics.happiness < 40) reason = 'Unhappiness at his current club makes a move more attractive.';
  else if (repGap > 700) reason = 'The player is attracted by the step up in club stature.';
  else if (dynamics.loyalty > 78 && dynamics.happiness > 65) reason = 'The player is settled and loyal to his current club.';

  return { score, label, reason, currentClubReputation: currentRep, buyerClubReputation: buyerRep };
}

export function getRenewalDemand(career, db, playerId) {
  ensureTransferState(career, db);
  const player = playerById(db, playerId);
  if (!player) return null;
  const dynamics = getPlayerDynamics(career, db, playerId);
  const contract = getPlayerContract(career, player);
  const currentWage = contract?.weeklyWage || estimateWeeklyWage(player);
  const agentPremium = { Pragmatic: 1.00, Demanding: 1.14, Ambitious: 1.09, Loyal: .96 }[dynamics.agent.style] || 1;
  const ambitionPremium = 1 + Math.max(0, dynamics.ambition - 55) / 500;
  const happinessPremium = dynamics.happiness < 40 ? 1.14 : dynamics.happiness > 80 ? .97 : 1;
  const rolePremium = ROLE_WAGE_MULTIPLIER[dynamics.squadRole] || 1;
  const abilityFloor = estimateWeeklyWage(player);
  const demand = moneyRound(Math.max(currentWage * 1.04, abilityFloor) * rolePremium * agentPremium * ambitionPremium * happinessPremium);
  return {
    currentWage: moneyRound(currentWage),
    weeklyWage: demand,
    years: (Number(player.reportedAge) || 26) >= 31 ? 3 : 4,
    squadRole: dynamics.squadRole,
    agent: dynamics.agent,
    happiness: dynamics.happiness
  };
}

export function submitRenewalOffer(career, db, playerId, weeklyWage, years = 4) {
  ensureTransferState(career, db);
  const player = playerById(db, playerId);
  if (!player || player.clubId !== career.clubId) throw new Error('You can only renew contracts for your own players.');
  const demand = getRenewalDemand(career, db, playerId);
  const wage = moneyRound(weeklyWage);
  const contractYears = clamp(Math.round(Number(years) || 4), 2, 5);
  if (!Number.isFinite(wage) || wage <= 0) throw new Error('Enter a valid weekly wage.');
  const increase = Math.max(0, wage - demand.currentWage);
  if (increase > (career.transfers.wageRoom || 0)) throw new Error('That renewal would exceed your remaining wage room.');
  if (wage < demand.weeklyWage * .82) {
    return { status: 'rejected', demand, message: `${demand.agent.name} considers the offer too far below expectations.` };
  }
  if (wage < demand.weeklyWage * .96) {
    return { status: 'countered', demand, counterWage: demand.weeklyWage, message: `${demand.agent.name} wants closer to the requested terms.` };
  }

  const previous = getPlayerContract(career, player);
  career.transfers.contracts[playerId] = {
    weeklyWage: wage,
    expiryYear: 2026 + contractYears,
    signedRound: career.roundIndex || 0,
    renewedDate: career.currentDate || null
  };
  career.transfers.wageRoom = Math.max(0, career.transfers.wageRoom - Math.max(0, wage - (previous?.weeklyWage || 0)));
  const dynamics = getPlayerDynamics(career, db, playerId);
  dynamics.happiness = clamp(dynamics.happiness + 6, 0, 100);
  if (dynamics.transferRequest?.active && dynamics.happiness >= 58) withdrawTransferRequest(career, db, playerId);
  return { status: 'accepted', weeklyWage: wage, years: contractYears, expiryYear: 2026 + contractYears, demand };
}

export function personalTermsDemand(career, db, playerId, buyerClubId = career?.clubId) {
  const player = playerById(db, playerId);
  if (!player) return null;
  const dynamics = getPlayerDynamics(career, db, playerId);
  const willingness = getMoveWillingness(career, db, playerId, buyerClubId);
  const base = estimateWeeklyWage(player);
  const agentPremium = { Pragmatic: 1.02, Demanding: 1.18, Ambitious: 1.10, Loyal: 1.08 }[dynamics.agent.style] || 1;
  const reluctancePremium = willingness.score < 40 ? 1.28 : willingness.score < 58 ? 1.14 : willingness.score >= 76 ? .96 : 1;
  return {
    weeklyWage: moneyRound(base * ROLE_WAGE_MULTIPLIER[dynamics.squadRole] * agentPremium * reluctancePremium),
    willingness,
    agent: dynamics.agent,
    squadRole: dynamics.squadRole
  };
}
