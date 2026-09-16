// Football Lab Manager — player audit compatibility pass v4.
//
// API-Football's current snapshot stores Moises Caicedo with the full paternal /
// maternal surname "Caicedo Corozo". Audit v3 deliberately uses strict identity
// matching, so the expanded provider surname stopped the Chelsea calibration from
// applying. Keep the strict matcher in v3 and repair this known provider identity
// here rather than broadening surname matching for every player.

const REVIEW_DATE = '2026-09-16';
const CHELSEA_ID = 'flm-club-api-football-49';

function normalise(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function isCaicedo(player) {
  if (!player || player.clubId !== CHELSEA_ID || player.isPlaceholder) return false;
  const name = normalise(player.name);
  const lastName = normalise(player.lastName);
  return lastName === 'caicedo' || lastName === 'caicedo corozo' ||
    name.endsWith(' caicedo') || name.endsWith(' caicedo corozo') ||
    /(^| )moises( isaac)? caicedo( corozo)?$/.test(name);
}

function applyCaicedoCalibration(player) {
  player.primaryPosition = 'DMC';
  player.secondaryPositions = ['MC'];
  player.positionGroup = 'MID';
  player.currentAbility = 173;
  player.potentialAbility = 179;
  player.potential = Math.round(179 / 2);
  player.auditedMarketValue = 125_000_000;
  player.marketValue = Math.max(Number(player.marketValue || 0), 125_000_000);
  player.importanceScore = 100;
  player.squadImportance = 'cornerstone';
  player.unavailableInPremierLeagueDatabase = false;
  player.isPlaceholder = false;
  player.audit = {
    reviewDate: REVIEW_DATE,
    club: 'Chelsea',
    importance: 100,
    role: 'cornerstone',
    marketTier: 'world-icon',
    valueFloor: 125_000_000,
    source: 'provider-full-surname-compatibility-audit'
  };
  player.contract ||= {};
  player.contract.squadStatus = 'cornerstone';
  return player;
}

export function applyPremierLeagueAuditV4(db) {
  if (!db?.players || db.__premierLeagueAuditV4 === REVIEW_DATE) return db;
  db.playerAudit ||= {};

  const matches = db.players.filter(isCaicedo);
  if (matches.length === 1) {
    applyCaicedoCalibration(matches[0]);
    db.playerAudit.v4CaicedoIdentity = {
      reviewDate: REVIEW_DATE,
      status: 'corrected',
      playerId: matches[0].id,
      providerLastName: matches[0].lastName
    };
  } else {
    db.playerAudit.v4CaicedoIdentity = {
      reviewDate: REVIEW_DATE,
      status: matches.length === 0 ? 'not-found' : 'ambiguous',
      matches: matches.map(player => player.id)
    };
  }

  db.__premierLeagueAuditV4 = REVIEW_DATE;
  return db;
}

if (typeof window !== 'undefined') {
  const manager = window.FLMManager;
  if (manager?.loadDatabase) {
    const baseLoadDatabase = manager.loadDatabase.bind(manager);
    manager.loadDatabase = async (...args) => applyPremierLeagueAuditV4(await baseLoadDatabase(...args));
    manager.loadDatabase().catch(error => console.error('Premier League player audit v4 failed', error));
  }
  window.FLMPlayerAuditV4 = {
    version: 4,
    reviewDate: REVIEW_DATE,
    applyPremierLeagueAuditV4
  };
}
