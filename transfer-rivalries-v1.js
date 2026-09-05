const normalise = value => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/&/g, 'and')
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

const CLUB_ALIASES = Object.freeze({
  arsenal: ['arsenal'],
  tottenham: ['tottenham hotspur', 'tottenham', 'spurs'],
  manchesterUnited: ['manchester united', 'man utd', 'man united'],
  manchesterCity: ['manchester city', 'man city'],
  liverpool: ['liverpool'],
  everton: ['everton'],
  newcastle: ['newcastle united', 'newcastle'],
  sunderland: ['sunderland'],
  leeds: ['leeds united', 'leeds'],
  chelsea: ['chelsea'],
  westHam: ['west ham united', 'west ham'],
  crystalPalace: ['crystal palace', 'palace'],
  brighton: ['brighton and hove albion', 'brighton hove albion', 'brighton']
});

const RIVALRY_RULES = Object.freeze([
  { clubs: ['arsenal', 'tottenham'], level: 'hard', label: 'North London derby' },
  { clubs: ['manchesterUnited', 'manchesterCity'], level: 'hard', label: 'Manchester derby' },
  { clubs: ['manchesterUnited', 'liverpool'], level: 'hard', label: 'North-West rivalry' },
  { clubs: ['liverpool', 'everton'], level: 'hard', label: 'Merseyside derby' },
  { clubs: ['newcastle', 'sunderland'], level: 'hard', label: 'Tyne-Wear derby' },
  { clubs: ['leeds', 'manchesterUnited'], level: 'hard', label: 'Leeds-Manchester United rivalry' },
  { clubs: ['chelsea', 'tottenham'], level: 'major', label: 'London rivalry' },
  { clubs: ['arsenal', 'chelsea'], level: 'major', label: 'London rivalry' },
  { clubs: ['westHam', 'tottenham'], level: 'major', label: 'London rivalry' },
  { clubs: ['crystalPalace', 'brighton'], level: 'major', label: 'Palace-Brighton rivalry' },
  { clubs: ['liverpool', 'manchesterCity'], level: 'major', label: 'Modern title rivalry' }
]);

function canonicalClubKey(club) {
  if (!club) return null;
  const names = [club.name, club.shortName, club.providerName].map(normalise).filter(Boolean);
  for (const [key, aliases] of Object.entries(CLUB_ALIASES)) {
    const normalisedAliases = aliases.map(normalise);
    if (names.some(name => normalisedAliases.includes(name))) return key;
  }
  return null;
}

function clubById(db, id) {
  return db?.clubs?.find(club => club.id === id) || null;
}

export function getRivalryRule(db, sellerClubId, buyerClubId) {
  if (!sellerClubId || !buyerClubId || sellerClubId === buyerClubId) return null;
  const sellerKey = canonicalClubKey(clubById(db, sellerClubId));
  const buyerKey = canonicalClubKey(clubById(db, buyerClubId));
  if (!sellerKey || !buyerKey) return null;
  return RIVALRY_RULES.find(rule => rule.clubs.includes(sellerKey) && rule.clubs.includes(buyerKey)) || null;
}

export function rareRivalException(player, stance, career = null) {
  if (!player || !stance) return false;
  const listed = Boolean(career?.transfers?.listedPlayerIds?.includes(player.id));
  const importance = Number(player.importanceScore);
  const rank = Number(stance.rank || 99);
  const ability = Number(player.currentAbility || 100);
  const age = Number(player.reportedAge || 26);
  const years = Number(stance.contractYears ?? 2);
  const clearlyFringe = Number.isFinite(importance) && importance > 0
    ? importance <= 30
    : rank >= 12 && ability < 140;

  // Direct rival transfers should only survive in very unusual circumstances:
  // fringe player, explicitly available, almost out of contract and not a prime-age star.
  return listed && clearlyFringe && years <= 1 && (age >= 29 || ability < 135);
}

export function rivalryDecision(db, sellerClubId, buyerClubId, player, stance, career = null) {
  const rule = getRivalryRule(db, sellerClubId, buyerClubId);
  if (!rule) return { blocked: false, rule: null, multiplier: 1 };

  const rare = rareRivalException(player, stance, career);
  if (rule.level === 'hard') {
    return {
      blocked: !rare,
      rule,
      rareException: rare,
      multiplier: rare ? 1.8 : 4,
      reason: rare
        ? `${rule.label}: exceptional fringe-player circumstances apply.`
        : `${rule.label}: direct transfer is considered effectively unavailable.`
    };
  }

  const importance = Number(player?.importanceScore || 0);
  const keyPlayer = Boolean(stance?.key || stance?.elite || importance >= 65 || Number(player?.currentAbility || 0) >= 155);
  return {
    blocked: keyPlayer && !rare,
    rule,
    rareException: rare,
    multiplier: rare ? 1.45 : keyPlayer ? 2.6 : 1.65,
    reason: keyPlayer && !rare
      ? `${rule.label}: the selling club will not strengthen a major rival with an important player.`
      : `${rule.label}: a substantial rivalry premium applies.`
  };
}

export function isRivalTransferBlocked(db, sellerClubId, buyerClubId, player, stance, career = null) {
  return rivalryDecision(db, sellerClubId, buyerClubId, player, stance, career).blocked;
}

export const rivalryRules = RIVALRY_RULES.map(rule => ({ ...rule, clubs: [...rule.clubs] }));
