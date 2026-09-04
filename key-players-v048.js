// V0.4.8 key-player markers are deliberately curated rather than derived from
// Football Lab's low-confidence baseline CA values. A marker is only shown when
// a named player is present in the current squad snapshot; there is no ability
// fallback, because fewer accurate stars are better than three incorrect ones.
// Review date: 2026-09-04.

export const KEY_PLAYER_REVIEW_DATE = '2026-09-04';

const CURATED = {
  'flm-club-api-football-35': [
    ['Kluivert'], ['Evanilson'], ['Tavernier']
  ],
  'flm-club-api-football-42': [
    ['Saka'], ['Rice'], ['Odegaard', 'Ødegaard']
  ],
  'flm-club-api-football-66': [
    ['Tielemans'], ['Onana'], ['McGinn']
  ],
  'flm-club-api-football-55': [
    ['Thiago'], ['Kelleher'], ['Damsgaard']
  ],
  'flm-club-api-football-51': [
    ['Kadioglu', 'Kadıoğlu'], ['Verbruggen'], ['Gross', 'Groß']
  ],
  'flm-club-api-football-49': [
    ['Palmer'], ['Caicedo'], ['Fernandez', 'Fernández']
  ],
  'flm-club-api-football-1346': [
    ['Rudoni'], ['Wright'], ['Grimes']
  ],
  'flm-club-api-football-52': [
    ['Wharton'], ['Mateta'], ['Henderson']
  ]
};

function normalise(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function playerMatches(player, aliases) {
  const name = normalise(player?.name);
  const lastName = normalise(player?.lastName);
  return aliases.some(alias => {
    const token = normalise(alias);
    return token && (lastName === token || name === token || name.endsWith(` ${token}`) || name.includes(token));
  });
}

export function curatedKeyPlayers(database, clubId) {
  const squad = (database?.players || []).filter(player => player.clubId === clubId && !player.isPlaceholder);
  const rules = CURATED[clubId] || [];
  const chosen = [];
  for (const aliases of rules) {
    const match = squad.find(player => !chosen.some(item => item.id === player.id) && playerMatches(player, aliases));
    if (match) chosen.push(match);
  }
  return chosen;
}

export function curatedKeyPlayerIds(database, clubId) {
  return new Set(curatedKeyPlayers(database, clubId).map(player => player.id));
}

export function isCuratedKeyPlayer(database, player) {
  return Boolean(player && curatedKeyPlayerIds(database, player.clubId).has(player.id));
}
