/*
 * Football Lab Manager player-name normalizer.
 *
 * The API-Football seasonless squad endpoint often returns abbreviated display
 * names (for example "S. Lammens").  The manager UI consistently renders the
 * player `name` field, so normalising the database response here fixes every
 * squad/profile/tactics surface without duplicating presentation logic.
 *
 * Prefer real firstName/lastName data whenever a provider supplies it.  The
 * current Manchester United development squad is seeded with verified display
 * names because the free squad endpoint only exposes initials for those rows.
 */

const nativeFetch = window.fetch.bind(window);

const UNITED_CLUB_KEYS = new Set([
  'flm-club-api-football-33',
  'Manchester United'
]);

const UNITED_FULL_NAMES = new Map([
  ['S. Lammens', 'Senne Lammens'],
  ['K. Darlow', 'Karl Darlow'],
  ['T. Heaton', 'Tom Heaton'],
  ['D. Mee', 'Dermot Mee'],
  ['A. Bayindir', 'Altay Bayindir'],
  ['A. Bayındır', 'Altay Bayındır'],
  ['A. Onana', 'Andre Onana'],
  ['D. Dalot', 'Diogo Dalot'],
  ['N. Mazraoui', 'Noussair Mazraoui'],
  ['M. de Ligt', 'Matthijs de Ligt'],
  ['H. Maguire', 'Harry Maguire'],
  ['L. Martinez', 'Lisandro Martínez'],
  ['L. Martínez', 'Lisandro Martínez'],
  ['P. Dorgu', 'Patrick Dorgu'],
  ['L. Yoro', 'Leny Yoro'],
  ['L. Shaw', 'Luke Shaw'],
  ['A. Heaven', 'Ayden Heaven'],
  ['H. Amass', 'Harry Amass'],
  ['D. Armer', 'Daniel Armer'],
  ['M. Mount', 'Mason Mount'],
  ['B. Fernandes', 'Bruno Fernandes'],
  ['A. Santos', 'Andrey Santos'],
  ['Y. Tielemans', 'Youri Tielemans'],
  ['C. Baleba', 'Carlos Baleba'],
  ['M. Ugarte', 'Manuel Ugarte'],
  ['K. Mainoo', 'Kobbie Mainoo'],
  ['J. Fletcher', 'Jack Fletcher'],
  ['T. Fletcher', 'Tyler Fletcher'],
  ['J. Thwaites', 'Jim Thwaites'],
  ['M. Cunha', 'Matheus Cunha'],
  ['A. Diallo', 'Amad Diallo'],
  ['Amad', 'Amad Diallo'],
  ['B. Mbeumo', 'Bryan Mbeumo'],
  ['M. Rashford', 'Marcus Rashford'],
  ['B. Sesko', 'Benjamin Šeško'],
  ['B. Šeško', 'Benjamin Šeško'],
  ['J. Zirkzee', 'Joshua Zirkzee'],
  ['S. Lacey', 'Shea Lacey']
]);

function hasRealFirstName(value) {
  const name = String(value || '').trim();
  return Boolean(name) && !/^[A-Za-zÀ-ÖØ-öø-ÿ]\.?$/.test(name);
}

function normalisePlayerName(player) {
  if (!player || typeof player !== 'object') return player;

  const firstName = String(player.firstName || '').trim();
  const lastName = String(player.lastName || '').trim();
  let fullName = null;

  if (hasRealFirstName(firstName) && lastName) {
    fullName = `${firstName} ${lastName}`.replace(/\s+/g, ' ').trim();
  }

  const clubKey = player.clubId || player.club || '';
  if (!fullName && UNITED_CLUB_KEYS.has(clubKey)) {
    fullName = UNITED_FULL_NAMES.get(String(player.name || '').trim()) || null;
  }

  if (!fullName || fullName === player.name) return player;

  const parts = fullName.split(/\s+/);
  return {
    ...player,
    name: fullName,
    firstName: hasRealFirstName(firstName) ? player.firstName : parts[0],
    lastName: lastName && hasRealFirstName(firstName) ? player.lastName : parts.slice(1).join(' '),
    dataQuality: {
      ...(player.dataQuality || {}),
      displayNameNormalised: true
    }
  };
}

function isPlayersDatabaseRequest(input) {
  const value = typeof input === 'string' ? input : input?.url;
  if (!value) return false;
  try {
    const url = new URL(value, window.location.href);
    return /\/data\/current\/players\.json$/i.test(url.pathname);
  } catch {
    return false;
  }
}

window.fetch = async (...args) => {
  const response = await nativeFetch(...args);
  if (!response.ok || !isPlayersDatabaseRequest(args[0])) return response;

  try {
    const players = await response.clone().json();
    if (!Array.isArray(players)) return response;

    const normalised = players.map(normalisePlayerName);
    const headers = new Headers(response.headers);
    headers.delete('content-length');
    headers.delete('content-encoding');
    headers.set('content-type', 'application/json; charset=utf-8');

    return new Response(JSON.stringify(normalised), {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  } catch (error) {
    console.warn('[FLM] Player-name normalisation skipped:', error);
    return response;
  }
};
