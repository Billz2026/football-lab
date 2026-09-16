// Football Lab Manager — player audit compatibility pass v4.
//
// API-Football's current snapshot stores Moises Caicedo with the full paternal /
// maternal surname "Caicedo Corozo". Audit v3 deliberately uses strict identity
// matching, so the expanded provider surname can cause v3 to create a synthetic
// duplicate. Keep the strict matcher in v3, prefer the real provider-backed record
// here, and suppress only the synthetic duplicate created by that missed identity.

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
  if (!player || player.clubId !== CHELSEA_ID) return false;
  const name = normalise(player.name);
  const lastName = normalise(player.lastName);
  return lastName === 'caicedo' || lastName === 'caicedo corozo' ||
    name.endsWith(' caicedo') || name.endsWith(' caicedo corozo') ||
    /(^| )moises( isaac)? caicedo( corozo)?$/.test(name);
}

function isProviderBacked(player) {
  return Boolean(player?.externalIds?.apiFootball || player?.dataQuality?.source === 'api-football');
}

function isAuditV3Synthetic(player) {
  return String(player?.id || '').startsWith('flm-audit-v3-') || Boolean(player?.externalIds?.curatedAuditV3);
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

function suppressSyntheticDuplicate(player, canonicalId) {
  if (!isAuditV3Synthetic(player)) return false;
  player.unavailableInPremierLeagueDatabase = true;
  player.isPlaceholder = true;
  player.importanceScore = 0;
  player.squadImportance = 'duplicate-suppressed';
  player.duplicateOfPlayerId = canonicalId;
  player.audit = {
    reviewDate: REVIEW_DATE,
    club: 'Chelsea',
    importance: 0,
    role: 'duplicate-suppressed',
    source: 'provider-full-surname-compatibility-audit'
  };
  return true;
}

export function applyPremierLeagueAuditV4(db) {
  if (!db?.players || db.__premierLeagueAuditV4 === REVIEW_DATE) return db;
  db.playerAudit ||= {};

  const matches = db.players.filter(isCaicedo);
  const providerMatches = matches.filter(isProviderBacked);
  const canonical = providerMatches.length === 1
    ? providerMatches[0]
    : matches.length === 1
      ? matches[0]
      : null;

  if (canonical) {
    applyCaicedoCalibration(canonical);
    const suppressedIds = matches
      .filter(player => player.id !== canonical.id)
      .filter(player => suppressSyntheticDuplicate(player, canonical.id))
      .map(player => player.id);

    db.playerAudit.v4CaicedoIdentity = {
      reviewDate: REVIEW_DATE,
      status: 'corrected',
      playerId: canonical.id,
      providerLastName: canonical.lastName,
      suppressedDuplicateIds: suppressedIds
    };
  } else {
    db.playerAudit.v4CaicedoIdentity = {
      reviewDate: REVIEW_DATE,
      status: matches.length === 0 ? 'not-found' : 'ambiguous',
      matches: matches.map(player => player.id),
      providerMatches: providerMatches.map(player => player.id)
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
