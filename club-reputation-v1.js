/* Football Lab Manager — club reputation & player interest v1
 * Dynamic 0–100 club stature used by transfer willingness.
 * Raw provider reputation is kept untouched; career reputation lives in the save.
 */
import { marketReputationTier } from './market-reputation-v061.js';

export const CLUB_REPUTATION_VERSION = 1;

const SAVE_KEY = 'flm-career-save';
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

// Audited starting stature for the current 2026/27 Premier League world.
// These are game-design ratings, not hidden ability and not provider rankings.
const PREMIER_START = Object.freeze({
  'AFC Bournemouth': 70,
  'Arsenal': 93,
  'Aston Villa': 83,
  'Brentford': 72,
  'Brighton & Hove Albion': 77,
  'Chelsea': 89,
  'Coventry City': 65,
  'Crystal Palace': 76,
  'Everton': 75,
  'Fulham': 71,
  'Hull City': 63,
  'Ipswich Town': 66,
  'Leeds United': 74,
  'Liverpool': 95,
  'Manchester City': 94,
  'Manchester United': 90,
  'Newcastle United': 85,
  'Nottingham Forest': 79,
  'Sunderland': 68,
  'Tottenham Hotspur': 85
});

function clubById(db, clubId) {
  return db?.clubs?.find(club => club.id === clubId) || null;
}

function initialScore(club) {
  if (!club) return 60;
  if (Number.isFinite(PREMIER_START[club.name])) return PREMIER_START[club.name];
  const raw = Number(club.reputation);
  if (Number.isFinite(raw)) {
    return Math.round(clamp(25 + ((raw - 2500) / 7000) * 67, 25, 92));
  }
  return 60;
}

function seasonLabel(career) {
  return String(career?.season || career?.seasonLabel || career?.currentSeason || '2026/27');
}

function tableSnapshot(career) {
  const table = Array.isArray(career?.table) ? career.table : [];
  return table.map((row, index) => ({
    clubId: row.clubId,
    position: Number(row.position || row.pos || row.rank) || index + 1,
    played: Number(row.played || row.p || row.matchesPlayed || 0),
    points: Number(row.points || row.pts || 0)
  })).filter(row => row.clubId);
}

function tableFingerprint(snapshot) {
  return snapshot.map(row => `${row.clubId}:${row.position}:${row.played}:${row.points}`).join('|');
}

function positionDelta(position, size) {
  const pos = Number(position) || size;
  if (pos === 1) return 8;
  if (pos === 2) return 6.5;
  if (pos === 3) return 5.5;
  if (pos === 4) return 4.5;
  if (pos === 5) return 3.5;
  if (pos === 6) return 2.5;
  if (pos === 7) return 1.5;
  if (pos <= Math.ceil(size * .5)) return .5;
  if (pos <= Math.max(14, Math.ceil(size * .7))) return 0;
  if (pos <= size - 3) return -1;
  if (pos === size - 2) return -3;
  if (pos === size - 1) return -4;
  return -5;
}

function persist(career) {
  if (typeof localStorage === 'undefined' || !career || localStorage.getItem('flm-autosave') === 'false') return;
  try {
    career.updatedAt = new Date().toISOString();
    localStorage.setItem(SAVE_KEY, JSON.stringify(career));
  } catch (_) {}
}

export function ensureClubReputationState(career, db) {
  if (!career || !db) return null;
  let changed = false;
  let state = career.clubReputation;
  if (!state || state.schemaVersion !== CLUB_REPUTATION_VERSION) {
    state = career.clubReputation = {
      schemaVersion: CLUB_REPUTATION_VERSION,
      currentSeason: seasonLabel(career),
      clubs: {},
      history: [],
      lastTable: [],
      lastTableFingerprint: ''
    };
    changed = true;
  }

  for (const club of db.clubs || []) {
    if (club.isPlaceholder) continue;
    if (!state.clubs[club.id]) {
      const score = initialScore(club);
      state.clubs[club.id] = { score, base: score, lastDelta: 0, updatedSeason: state.currentSeason };
      changed = true;
    }
  }

  const season = seasonLabel(career);
  if (state.currentSeason !== season) {
    const previous = Array.isArray(state.lastTable) ? state.lastTable : [];
    if (previous.length >= 2) {
      const size = previous.length;
      const changes = [];
      for (const row of previous) {
        const entry = state.clubs[row.clubId];
        if (!entry) continue;
        const delta = positionDelta(row.position, size);
        const before = Number(entry.score) || Number(entry.base) || 60;
        const after = Math.round(clamp(before + delta, 25, 98) * 10) / 10;
        entry.score = after;
        entry.lastDelta = Math.round((after - before) * 10) / 10;
        entry.updatedSeason = season;
        changes.push({ clubId: row.clubId, position: row.position, before, after, delta: entry.lastDelta });
      }
      state.history.push({ season: state.currentSeason, changes });
      if (state.history.length > 12) state.history = state.history.slice(-12);
    }
    state.currentSeason = season;
    state.lastTable = [];
    state.lastTableFingerprint = '';
    changed = true;
  }

  const snapshot = tableSnapshot(career);
  const fingerprint = tableFingerprint(snapshot);
  if (snapshot.length >= 2 && fingerprint !== state.lastTableFingerprint) {
    state.lastTable = snapshot;
    state.lastTableFingerprint = fingerprint;
    changed = true;
  }

  if (changed) persist(career);
  return state;
}

export function effectiveClubReputation(career, db, clubId) {
  const state = ensureClubReputationState(career, db);
  const stored = Number(state?.clubs?.[clubId]?.score);
  if (Number.isFinite(stored)) return stored;
  return initialScore(clubById(db, clubId));
}

export function reputationLabel(score) {
  const value = Number(score) || 0;
  if (value >= 92) return 'Global elite';
  if (value >= 86) return 'Elite';
  if (value >= 80) return 'Champions League level';
  if (value >= 74) return 'European contender';
  if (value >= 68) return 'Established top-flight club';
  if (value >= 60) return 'Top-flight club';
  if (value >= 50) return 'Strong domestic club';
  return 'Developing club';
}

function requiredReputation(player, career, db) {
  const ability = clamp(Number(player?.currentAbility) || 100, 70, 200);
  const potential = clamp(Number(player?.potentialAbility) || ability, ability, 200);
  const age = clamp(Number(player?.reportedAge) || 26, 16, 40);
  const currentClubRep = effectiveClubReputation(career, db, player?.clubId);
  const listed = Boolean(career?.transfers?.listedPlayerIds?.includes(player?.id));
  const personality = String(player?.personality || player?.personalityLabel || '').toLowerCase();
  const reviewedTier = marketReputationTier(player);

  let required;
  if (ability >= 185) required = 92;
  else if (ability >= 178) required = 89;
  else if (ability >= 171) required = 86;
  else if (ability >= 164) required = 82;
  else if (ability >= 157) required = 78;
  else if (ability >= 150) required = 73;
  else if (ability >= 142) required = 68;
  else if (ability >= 134) required = 63;
  else if (ability >= 124) required = 58;
  else required = 52;

  const tierFloor = {
    'world-icon': 93,
    'global-superstar': 90,
    'elite': 86,
    'star': 80,
    'squad-key': 75
  }[reviewedTier] || 0;
  required = Math.max(required, tierFloor);

  if (age <= 23 && potential >= 180) required += 4;
  else if (age <= 23 && potential >= 170) required += 2;

  if (currentClubRep >= 84 && (ability >= 160 || tierFloor >= 86)) required = Math.max(required, currentClubRep - 4);
  else if (currentClubRep >= 78 && (ability >= 150 || tierFloor >= 80)) required = Math.max(required, currentClubRep - 6);

  if (/ambitious|high ambition|driven/.test(personality)) required += 2;
  if (listed) required -= 4;
  if (age >= 32) required -= 4;
  else if (age >= 30) required -= 2;

  return clamp(Math.round(required), 45, 96);
}

export function evaluatePlayerInterest(player, buyerClubId, career, db) {
  const buyer = clubById(db, buyerClubId);
  const buyerScore = effectiveClubReputation(career, db, buyerClubId);
  const required = requiredReputation(player, career, db);
  const gap = Math.round((buyerScore - required) * 10) / 10;

  let key = 'interested';
  let label = 'Interested';
  let canApproach = true;
  let wagePremium = 1;
  if (gap < -8) {
    key = 'not-interested';
    label = 'Not interested';
    canApproach = false;
    wagePremium = 1.35;
  } else if (gap < -4) {
    key = 'unlikely';
    label = 'Unlikely';
    wagePremium = 1.25;
  } else if (gap < 0) {
    key = 'open-to-move';
    label = 'Open to persuasion';
    wagePremium = 1.12;
  }

  const playerName = player?.name || 'The player';
  const clubName = buyer?.shortName || buyer?.name || 'your club';
  let message = `${playerName} would be interested in discussing a move to ${clubName}.`;
  if (key === 'open-to-move') message = `${playerName} is open to the move, but may need convincing by the sporting project and contract terms.`;
  if (key === 'unlikely') message = `${playerName} currently views ${clubName} as a step below his preferred level. Exceptional terms may be needed.`;
  if (key === 'not-interested') message = `${playerName} has no interest in joining ${clubName} at this stage. Your club's current stature does not match his career expectations.`;

  return {
    key,
    label,
    canApproach,
    wagePremium,
    clubReputation: buyerScore,
    requiredReputation: required,
    gap,
    marketTier: reviewedTier,
    message
  };
}

if (typeof window !== 'undefined') {
  let queued = false;
  const sync = async () => {
    queued = false;
    const career = window.FLMManager?.activeCareer;
    if (!career || !window.FLMManager?.loadDatabase) return;
    try {
      const db = await window.FLMManager.loadDatabase();
      ensureClubReputationState(career, db);
    } catch (_) {}
  };
  const queue = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(sync);
  };
  new MutationObserver(queue).observe(document.body, { childList: true, subtree: true });
  ['flm:career-opened','flm:career-created','flm:career-data-refresh','flm:career-sync-complete']
    .forEach(name => document.addEventListener(name, queue));
  queue();
}
