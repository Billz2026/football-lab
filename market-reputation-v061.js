// Football Lab's API-Football squad feed does not provide a trustworthy market-value field
// and its imported CA is explicitly low-confidence. These reviewed reputation floors stop
// globally established stars being priced like ordinary squad players when the baseline CA
// underrates them. They are GBP gameplay calibration floors, not copied transfer fees.
// Review date: 2026-09-05. Re-review when the player database is refreshed.

export const MARKET_REPUTATION_REVIEW_DATE = '2026-09-05';

const REFERENCES = [
  { aliases: ['Haaland'], floor: 175_000_000, tier: 'global-superstar' },
  { aliases: ['Rice'], floor: 105_000_000, tier: 'elite' },
  { aliases: ['Saka'], floor: 100_000_000, tier: 'global-superstar' },
  { aliases: ['Saliba'], floor: 88_000_000, tier: 'elite' },
  { aliases: ['Palmer'], floor: 88_000_000, tier: 'elite' },
  { aliases: ['Caicedo'], floor: 88_000_000, tier: 'elite' },
  { aliases: ['Wirtz'], floor: 88_000_000, tier: 'elite' },
  { aliases: ['Szoboszlai'], floor: 88_000_000, tier: 'elite' },
  { aliases: ['Fernandez', 'Fernández'], floor: 78_000_000, tier: 'star' },
  { aliases: ['Rogers'], floor: 78_000_000, tier: 'star' },
  { aliases: ['Isak'], floor: 74_000_000, tier: 'star' },
  { aliases: ['Ekitike', 'Ekitiké'], floor: 70_000_000, tier: 'star' }
];

function normalise(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function matches(player, aliases) {
  const name = normalise(player?.name);
  const lastName = normalise(player?.lastName);
  return aliases.some(alias => {
    const token = normalise(alias);
    return token && (lastName === token || name === token || name.endsWith(` ${token}`));
  });
}

export function marketReputationReference(player) {
  if (!player) return null;
  const found = REFERENCES.find(reference => matches(player, reference.aliases));
  return found ? { ...found } : null;
}

export function marketValueFloor(player) {
  return marketReputationReference(player)?.floor || 0;
}

export function marketReputationTier(player) {
  return marketReputationReference(player)?.tier || null;
}
