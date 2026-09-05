// Football Lab's API-Football squad feed does not provide a trustworthy market-value field
// and its imported CA is explicitly low-confidence. These reviewed reputation floors stop
// globally established stars being priced like ordinary squad players when the baseline CA
// underrates them. Runtime club audits can also supply a reviewed GBP gameplay value floor.
// These are gameplay calibrations, not copied transfer fees.
// Review date: 2026-09-05. Re-review when the player database is refreshed.

export const MARKET_REPUTATION_REVIEW_DATE = '2026-09-05';

const REFERENCES = [
  { aliases: ['Haaland'], floor: 175_000_000, tier: 'world-icon' },
  { aliases: ['Saka'], floor: 130_000_000, tier: 'global-superstar' },
  { aliases: ['Rice'], floor: 105_000_000, tier: 'elite' },
  { aliases: ['Palmer'], floor: 100_000_000, tier: 'elite' },
  { aliases: ['Isak'], floor: 100_000_000, tier: 'elite' },
  { aliases: ['Rodri'], floor: 95_000_000, tier: 'elite' },
  { aliases: ['Mac Allister'], floor: 88_000_000, tier: 'elite' },
  { aliases: ['Foden'], floor: 88_000_000, tier: 'elite' },
  { aliases: ['Saliba'], floor: 82_000_000, tier: 'elite' },
  { aliases: ['Caicedo'], floor: 80_000_000, tier: 'elite' },
  { aliases: ['Wirtz'], floor: 88_000_000, tier: 'elite' },
  { aliases: ['Szoboszlai'], floor: 72_000_000, tier: 'star' },
  { aliases: ['Odegaard', 'Ødegaard'], floor: 74_000_000, tier: 'star' },
  { aliases: ['Guimaraes', 'Guimarães'], floor: 70_000_000, tier: 'star' },
  { aliases: ['Gravenberch'], floor: 66_000_000, tier: 'star' },
  { aliases: ['Fernandez', 'Fernández'], floor: 66_000_000, tier: 'star' },
  { aliases: ['Rogers'], floor: 62_000_000, tier: 'star' },
  { aliases: ['Ekitike', 'Ekitiké'], floor: 62_000_000, tier: 'star' },
  { aliases: ['Yoro'], floor: 48_000_000, tier: 'star' },
  { aliases: ['Eze'], floor: 48_000_000, tier: 'star' },
  { aliases: ['Murillo'], floor: 48_000_000, tier: 'star' }
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

function staticReference(player) {
  return REFERENCES.find(reference => matches(player, reference.aliases)) || null;
}

export function marketReputationReference(player) {
  if (!player) return null;
  const staticRef = staticReference(player);
  const auditedTier = player?.audit?.marketTier || null;
  if (!staticRef && !auditedTier) return null;

  return {
    ...(staticRef || { aliases: [player.lastName || player.name] }),
    floor: Math.max(Number(staticRef?.floor || 0), Number(player?.auditedMarketValue || player?.audit?.valueFloor || 0)),
    tier: auditedTier || staticRef?.tier || null,
    audited: Boolean(auditedTier)
  };
}

export function marketValueFloor(player) {
  return Math.max(
    Number(player?.auditedMarketValue || player?.audit?.valueFloor || 0),
    Number(staticReference(player)?.floor || 0)
  );
}

export function marketReputationTier(player) {
  return player?.audit?.marketTier || staticReference(player)?.tier || null;
}
