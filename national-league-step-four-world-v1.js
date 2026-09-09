import {
  ISTHMIAN_PREMIER_ID,
  NORTHERN_PREMIER_ID,
  SOUTHERN_PREMIER_CENTRAL_ID,
  SOUTHERN_PREMIER_SOUTH_ID,
  rankStepThreeTable
} from './national-league-step-three-world-v1.js';

export const NATIONAL_LEAGUE_STEP_FOUR_WORLD_VERSION = 1;
export const ISTHMIAN_SOUTH_CENTRAL_ID = 'eng-isthmian-south-central';
export const ISTHMIAN_NORTH_ID = 'eng-isthmian-north';
export const ISTHMIAN_SOUTH_EAST_ID = 'eng-isthmian-south-east';
export const NORTHERN_PREMIER_EAST_ID = 'eng-northern-premier-east';
export const NORTHERN_PREMIER_WEST_ID = 'eng-northern-premier-west';
export const NORTHERN_PREMIER_MIDLANDS_ID = 'eng-northern-premier-midlands';
export const SOUTHERN_LEAGUE_CENTRAL_ID = 'eng-southern-league-central';
export const SOUTHERN_LEAGUE_SOUTH_ID = 'eng-southern-league-south';

export const STEP_FOUR_DIVISION_IDS = Object.freeze([
  ISTHMIAN_SOUTH_CENTRAL_ID,
  ISTHMIAN_NORTH_ID,
  ISTHMIAN_SOUTH_EAST_ID,
  NORTHERN_PREMIER_EAST_ID,
  NORTHERN_PREMIER_WEST_ID,
  NORTHERN_PREMIER_MIDLANDS_ID,
  SOUTHERN_LEAGUE_CENTRAL_ID,
  SOUTHERN_LEAGUE_SOUTH_ID
]);

export const STEP_FOUR_RULES = Object.freeze({
  clubCount: 22,
  automaticPromotionPlaces: 1,
  playoffPlaces: Object.freeze([2, 3, 4, 5]),
  relegationPlaces: 4,
  regularSeasonMatchesPerClub: 42,
  regularSeasonMatches: 462,
  playoffFormat: 'single-leg-higher-ranked-home',
  ranking: Object.freeze(['points', 'goalDifference', 'goalsFor', 'wins', 'headToHeadRecord', 'decidingMatchIfRequired'])
});

export const STEP_FOUR_TO_STEP_THREE_PREFERENCES = Object.freeze({
  [ISTHMIAN_SOUTH_CENTRAL_ID]: Object.freeze([ISTHMIAN_PREMIER_ID, SOUTHERN_PREMIER_SOUTH_ID, SOUTHERN_PREMIER_CENTRAL_ID, NORTHERN_PREMIER_ID]),
  [ISTHMIAN_NORTH_ID]: Object.freeze([ISTHMIAN_PREMIER_ID, SOUTHERN_PREMIER_CENTRAL_ID, NORTHERN_PREMIER_ID, SOUTHERN_PREMIER_SOUTH_ID]),
  [ISTHMIAN_SOUTH_EAST_ID]: Object.freeze([ISTHMIAN_PREMIER_ID, SOUTHERN_PREMIER_SOUTH_ID, SOUTHERN_PREMIER_CENTRAL_ID, NORTHERN_PREMIER_ID]),
  [NORTHERN_PREMIER_EAST_ID]: Object.freeze([NORTHERN_PREMIER_ID, SOUTHERN_PREMIER_CENTRAL_ID, ISTHMIAN_PREMIER_ID, SOUTHERN_PREMIER_SOUTH_ID]),
  [NORTHERN_PREMIER_WEST_ID]: Object.freeze([NORTHERN_PREMIER_ID, SOUTHERN_PREMIER_CENTRAL_ID, SOUTHERN_PREMIER_SOUTH_ID, ISTHMIAN_PREMIER_ID]),
  [NORTHERN_PREMIER_MIDLANDS_ID]: Object.freeze([NORTHERN_PREMIER_ID, SOUTHERN_PREMIER_CENTRAL_ID, ISTHMIAN_PREMIER_ID, SOUTHERN_PREMIER_SOUTH_ID]),
  [SOUTHERN_LEAGUE_CENTRAL_ID]: Object.freeze([SOUTHERN_PREMIER_CENTRAL_ID, ISTHMIAN_PREMIER_ID, SOUTHERN_PREMIER_SOUTH_ID, NORTHERN_PREMIER_ID]),
  [SOUTHERN_LEAGUE_SOUTH_ID]: Object.freeze([SOUTHERN_PREMIER_SOUTH_ID, SOUTHERN_PREMIER_CENTRAL_ID, ISTHMIAN_PREMIER_ID, NORTHERN_PREMIER_ID])
});

const DIVISION_NAMES = Object.freeze({
  [ISTHMIAN_SOUTH_CENTRAL_ID]: 'Isthmian League South Central',
  [ISTHMIAN_NORTH_ID]: 'Isthmian League North',
  [ISTHMIAN_SOUTH_EAST_ID]: 'Isthmian League South East',
  [NORTHERN_PREMIER_EAST_ID]: 'Northern Premier League East',
  [NORTHERN_PREMIER_WEST_ID]: 'Northern Premier League West',
  [NORTHERN_PREMIER_MIDLANDS_ID]: 'Northern Premier League Midlands',
  [SOUTHERN_LEAGUE_CENTRAL_ID]: 'Southern League Division One Central',
  [SOUTHERN_LEAGUE_SOUTH_ID]: 'Southern League Division One South'
});

const clone = value => JSON.parse(JSON.stringify(value));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function hashString(value) {
  let hash = 2166136261;
  for (const character of String(value)) { hash ^= character.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return hash >>> 0;
}
function slugify(value) {
  return String(value)
    .normalize('NFKD')
    .replace(/[’']/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}
function make(competitionId, names, { geoNorthing, geoEasting }) {
  return Object.freeze(names.map(name => {
    const hash = hashString(`${competitionId}:${name}`);
    return Object.freeze({
      id: `${competitionId}-${slugify(name)}`,
      slug: slugify(name),
      name,
      strength: 45 + (hash % 8),
      geoNorthing: geoNorthing + (((hash >>> 8) % 7) - 3),
      geoEasting: geoEasting + (((hash >>> 12) % 7) - 3),
      preferredStepThreeDivisionIds: [...STEP_FOUR_TO_STEP_THREE_PREFERENCES[competitionId]]
    });
  }));
}

// 2026/27 Step 4 memberships verified against The FA NLS Steps 1-4 allocation,
// with Peacehaven & Telscombe confirmed by the Isthmian League after the provisional FA slot was resolved.
// Strength/geography fields are Football Lab simulation metadata, not FA ratings.
export const ISTHMIAN_SOUTH_CENTRAL_2026_27_CLUBS = make(ISTHMIAN_SOUTH_CENTRAL_ID, [
    'AFC Portchester',
    'AFC Stoneham',
    'Ascot United',
    'Ashford Town (Middx)',
    'Bedfont Sports',
    'Binfield',
    'Bognor Regis Town',
    'Cobham',
    'Egham Town',
    'Harrow Borough',
    'Hartley Wintney',
    'Hayes & Yeading United',
    'Hendon',
    'Jersey Bulls',
    'Kingstonian',
    'Littlehampton Town',
    'Moneyfields',
    'Raynes Park Vale',
    'Southall',
    'Westfield',
    'Winchester City',
    'Windsor & Eton'
  ], { geoNorthing: 30, geoEasting: 38 });
export const ISTHMIAN_NORTH_2026_27_CLUBS = make(ISTHMIAN_NORTH_ID, [
    'AFC Sudbury',
    'Bowers & Pitsea',
    'Brightlingsea Regent',
    'Buckhurst Hill',
    'Cambridge City',
    'Canvey Island',
    'Concord Rangers',
    'Fakenham Town',
    'Felixstowe & Walton United',
    'Gorleston',
    'Grays Athletic',
    'Hashtag United',
    'Little Oakley',
    'Lowestoft Town',
    'Mulbarton Wanderers',
    'Newmarket Town',
    'Redbridge',
    'Takeley',
    'Tilbury',
    'Walthamstow',
    'Witham Town',
    'Wroxham'
  ], { geoNorthing: 49, geoEasting: 74 });
export const ISTHMIAN_SOUTH_EAST_2026_27_CLUBS = make(ISTHMIAN_SOUTH_EAST_ID, [
    'AFC Croydon Athletic',
    'Ashford United',
    'Broadbridge Heath',
    'Cray Valley PM',
    'Crowborough Athletic',
    'Deal Town',
    'Eastbourne Town',
    'Erith Town',
    'Faversham Town',
    'Hastings United',
    'Herne Bay',
    'Horley Town',
    'Margate',
    'Merstham',
    'Peacehaven & Telscombe',
    'Punjab United',
    'Sevenoaks Town',
    'Sheppey United',
    'Sittingbourne',
    'South Park (Reigate)',
    'Steyning Town',
    'Whitstable Town'
  ], { geoNorthing: 24, geoEasting: 84 });
export const NORTHERN_PREMIER_EAST_2026_27_CLUBS = make(NORTHERN_PREMIER_EAST_ID, [
    'Ashington',
    'Beverley Town',
    'Blyth Spartans',
    'Bradford (Park Avenue)',
    'Bridlington Town',
    'Consett',
    'Dunston',
    'Garforth Town',
    'Grimsby Borough',
    'Guisborough Town',
    'Hallam',
    'Heaton Stannington',
    'Lincoln United',
    'Liversedge',
    'Matlock Town',
    'Morpeth Town',
    'North Ferriby',
    'Ossett United',
    'Pontefract Collieries',
    'Silsden',
    'Stocksbridge Park Steels',
    'West Auckland Town'
  ], { geoNorthing: 76, geoEasting: 62 });
export const NORTHERN_PREMIER_WEST_2026_27_CLUBS = make(NORTHERN_PREMIER_WEST_ID, [
    '1874 Northwich',
    'Atherton Collieries',
    'Bootle',
    'Chasetown',
    'Clitheroe',
    'Congleton Town',
    'Hanley Town',
    'Kidsgrove Athletic',
    'Lichfield City',
    'Lower Breck',
    'Mossley',
    'Nantwich Town',
    'Newcastle Town',
    'Padiham',
    'Prescot Cables',
    'Runcorn Linnets',
    'Shifnal Town',
    'Stafford Rangers',
    'Stalybridge Celtic',
    'Vauxhall Motors',
    'Witton Albion',
    'Wythenshawe'
  ], { geoNorthing: 76, geoEasting: 28 });
export const NORTHERN_PREMIER_MIDLANDS_2026_27_CLUBS = make(NORTHERN_PREMIER_MIDLANDS_ID, [
    'AFC Rushden & Diamonds',
    'Barwell',
    'Basford United',
    'Bedworth United',
    'Belper Town',
    'Boldmere St Michael’s',
    'Boston Town',
    'Bourne Town',
    'Carlton Town',
    'Coleshill Town',
    'Corby Town',
    'Coventry United',
    'Grantham Town',
    'Long Eaton United',
    'Loughborough Students',
    'Mickleover',
    'Nuneaton Town',
    'Rugby Borough',
    'Shepshed Dynamo',
    'St Ives Town',
    'Sutton Coldfield Town',
    'Wellingborough Town'
  ], { geoNorthing: 63, geoEasting: 50 });
export const SOUTHERN_LEAGUE_CENTRAL_2026_27_CLUBS = make(SOUTHERN_LEAGUE_CENTRAL_ID, [
    'Aylesbury United',
    'Barton Rovers',
    'Beaconsfield Town',
    'Biggleswade',
    'Biggleswade Town',
    'Didcot Town',
    'Flackwell Heath',
    'Hadley',
    'Haringey Borough',
    'Hertford Town',
    'Leverstock Green',
    'London Lions',
    'Marlow',
    'Milton Keynes Irish',
    'Potters Bar Town',
    'Royston Town',
    'Stotfold',
    'Thame United',
    'Waltham Abbey',
    'Ware',
    'Welwyn Garden City',
    'Winslow United'
  ], { geoNorthing: 45, geoEasting: 58 });
export const SOUTHERN_LEAGUE_SOUTH_2026_27_CLUBS = make(SOUTHERN_LEAGUE_SOUTH_ID, [
    'Barnstaple Town',
    'Bideford',
    'Bishops Cleeve',
    'Bristol Manor Farm',
    'Dorchester Town',
    'Exmouth Town',
    'Falmouth Town',
    'Hartpury',
    'Hungerford Town',
    'Larkhall Athletic',
    'Melksham Town',
    'Paulton Rovers',
    'Portland United',
    'Shaftesbury',
    'Slimbridge',
    'Sporting Club Inkberrow',
    'Swindon Supermarine',
    'Tiverton Town',
    'Westbury United',
    'Weymouth',
    'Willand Rovers',
    'Worcester Raiders'
  ], { geoNorthing: 24, geoEasting: 42 });

export const STEP_FOUR_2026_27_MEMBERSHIPS = Object.freeze({
  [ISTHMIAN_SOUTH_CENTRAL_ID]: ISTHMIAN_SOUTH_CENTRAL_2026_27_CLUBS,
  [ISTHMIAN_NORTH_ID]: ISTHMIAN_NORTH_2026_27_CLUBS,
  [ISTHMIAN_SOUTH_EAST_ID]: ISTHMIAN_SOUTH_EAST_2026_27_CLUBS,
  [NORTHERN_PREMIER_EAST_ID]: NORTHERN_PREMIER_EAST_2026_27_CLUBS,
  [NORTHERN_PREMIER_WEST_ID]: NORTHERN_PREMIER_WEST_2026_27_CLUBS,
  [NORTHERN_PREMIER_MIDLANDS_ID]: NORTHERN_PREMIER_MIDLANDS_2026_27_CLUBS,
  [SOUTHERN_LEAGUE_CENTRAL_ID]: SOUTHERN_LEAGUE_CENTRAL_2026_27_CLUBS,
  [SOUTHERN_LEAGUE_SOUTH_ID]: SOUTHERN_LEAGUE_SOUTH_2026_27_CLUBS
});

function seededRandom(seed) {
  let state = hashString(seed) || 1;
  return () => { state += 0x6D2B79F5; let value = state; value = Math.imul(value ^ (value >>> 15), value | 1); value ^= value + Math.imul(value ^ (value >>> 7), value | 61); return ((value ^ (value >>> 14)) >>> 0) / 4294967296; };
}
function poisson(lambda, random) {
  const limit = Math.exp(-lambda); let product = 1; let count = 0;
  do { count += 1; product *= random(); } while (product > limit && count < 10);
  return clamp(count - 1, 0, 7);
}
function validateMembership(clubs) {
  if (!Array.isArray(clubs) || clubs.length !== 22) throw new Error('Step 4 background simulation requires exactly 22 clubs.');
  if (new Set(clubs.map(club => club?.id)).size !== 22) throw new Error('Step 4 club ids must be unique.');
  if (clubs.some(club => !Number.isFinite(Number(club.strength)))) throw new Error('Every Step 4 club requires numeric strength.');
}
function createFixtures(clubs) {
  validateMembership(clubs);
  const firstLeg = []; let rotation = clubs.map(club => club.id);
  for (let roundIndex = 0; roundIndex < rotation.length - 1; roundIndex += 1) {
    const round = [];
    for (let pair = 0; pair < rotation.length / 2; pair += 1) {
      const first = rotation[pair], second = rotation[rotation.length - 1 - pair];
      const flip = pair === 0 ? roundIndex % 2 === 1 : pair % 2 === 1;
      round.push({ homeClubId: flip ? second : first, awayClubId: flip ? first : second });
    }
    firstLeg.push(round);
    rotation = [rotation[0], rotation.at(-1), ...rotation.slice(1, -1)];
  }
  const returnOrder = [...firstLeg.slice(1), firstLeg[0]];
  return [...firstLeg, ...returnOrder.map(round => round.map(f => ({ homeClubId: f.awayClubId, awayClubId: f.homeClubId })))]
    .map((round, ri) => round.map((fixture, mi) => ({ id: `s4-mw${ri + 1}-m${mi + 1}`, round: ri + 1, ...fixture, played: false, homeGoals: null, awayGoals: null })));
}
function blankTable(clubs) {
  return clubs.map(club => ({ clubId: club.id, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 }));
}
function simulateFixture(fixture, clubMap, seed) {
  const random = seededRandom(`${seed}:${fixture.id}`);
  const home = clubMap.get(fixture.homeClubId), away = clubMap.get(fixture.awayClubId);
  const diff = clamp(((Number(home.strength) + 2.0) - Number(away.strength)) / 15.5, -1.3, 1.3);
  return { ...fixture, played: true, homeGoals: poisson(clamp(1.42 + diff, .28, 3.2), random), awayGoals: poisson(clamp(1.04 - diff, .22, 2.8), random) };
}
function apply(table, result) {
  const h = table.find(r => r.clubId === result.homeClubId), a = table.find(r => r.clubId === result.awayClubId);
  h.played++; a.played++; h.goalsFor += result.homeGoals; h.goalsAgainst += result.awayGoals; a.goalsFor += result.awayGoals; a.goalsAgainst += result.homeGoals;
  if (result.homeGoals > result.awayGoals) { h.won++; h.points += 3; a.lost++; }
  else if (result.homeGoals < result.awayGoals) { a.won++; a.points += 3; h.lost++; }
  else { h.drawn++; a.drawn++; h.points++; a.points++; }
  h.goalDifference = h.goalsFor - h.goalsAgainst;
  a.goalDifference = a.goalsFor - a.goalsAgainst;
}
function simulateKnockout(home, away, seed) {
  const random = seededRandom(seed);
  const diff = clamp(((Number(home.strength) + 1.8) - Number(away.strength)) / 17, -1.1, 1.1);
  let hg = poisson(clamp(1.34 + diff, .24, 2.9), random), ag = poisson(clamp(1.06 - diff, .22, 2.7), random), method = '90-minutes', extraTime = null, penalties = null;
  if (hg === ag) {
    const er = seededRandom(`${seed}:et`), eh = poisson(.3, er), ea = poisson(.27, er);
    extraTime = { homeGoals: eh, awayGoals: ea };
    if (eh !== ea) { hg += eh; ag += ea; method = 'extra-time'; }
    else {
      const pr = seededRandom(`${seed}:pens`);
      const homeWins = pr() < clamp(.5 + (home.strength - away.strength) / 300, .43, .57);
      penalties = homeWins ? { home: 5, away: 4 } : { home: 4, away: 5 };
      method = 'penalties';
      return { homeClubId: home.id, awayClubId: away.id, homeGoals: hg, awayGoals: ag, extraTime, penalties, method, winnerClubId: homeWins ? home.id : away.id };
    }
  }
  return { homeClubId: home.id, awayClubId: away.id, homeGoals: hg, awayGoals: ag, extraTime, penalties, method, winnerClubId: hg > ag ? home.id : away.id };
}

export function simulateStepFourDivisionSeason({ competitionId, season = '2026/27', clubs = STEP_FOUR_2026_27_MEMBERSHIPS[competitionId], seed = 'football-lab-step-four', completedAt = null } = {}) {
  if (!STEP_FOUR_DIVISION_IDS.includes(competitionId)) throw new Error('Unsupported Step 4 division.');
  validateMembership(clubs);
  const clubMap = new Map(clubs.map(c => [c.id, c]));
  const fixtures = createFixtures(clubs).map((round, ri) => round.map((fixture, mi) => simulateFixture({ ...fixture, id: `${competitionId}-mw${ri + 1}-m${mi + 1}` }, clubMap, `${seed}:${season}:${competitionId}`)));
  const table = blankTable(clubs);
  fixtures.flat().forEach(result => apply(table, result));
  const ranking = rankStepThreeTable(table, fixtures, { seed: `${seed}:${season}:${competitionId}:rank` });
  const base = {
    schemaVersion: NATIONAL_LEAGUE_STEP_FOUR_WORLD_VERSION,
    key: `${competitionId}:${season}`,
    competitionId,
    competitionName: DIVISION_NAMES[competitionId],
    season,
    completedAt,
    membershipSource: season === '2026/27' ? '2026/27 verified FA Step 4 allocation' : 'derived English pyramid membership',
    clubs: clubs.map(c => clone(c)),
    clubCount: clubs.length,
    regularSeasonMatches: fixtures.flat().length,
    rankingRules: [...STEP_FOUR_RULES.ranking],
    finalTable: ranking.rows,
    rankingResolution: { decidingMatchRequired: ranking.decidingMatchRequired, unresolvedGroups: ranking.unresolvedGroups, administrativeResolutions: ranking.administrativeResolutions }
  };
  if (ranking.decidingMatchRequired) return { ...base, status: 'resolution-required', championClubId: ranking.rows[0]?.clubId || null, promotedClubIds: [], playoffClubIds: [], playoffWinnerClubId: null, relegatedClubIds: [], playoffs: null };
  const championClubId = ranking.rows[0].clubId;
  const playoffRows = ranking.rows.slice(1, 5);
  const byId = id => clubMap.get(id);
  const [second, third, fourth, fifth] = playoffRows.map(row => byId(row.clubId));
  const semiA = simulateKnockout(second, fifth, `${seed}:${season}:${competitionId}:2v5`);
  const semiB = simulateKnockout(third, fourth, `${seed}:${season}:${competitionId}:3v4`);
  const positions = new Map(ranking.rows.map(row => [row.clubId, row.position]));
  const finalistA = byId(semiA.winnerClubId), finalistB = byId(semiB.winnerClubId);
  const home = positions.get(finalistA.id) < positions.get(finalistB.id) ? finalistA : finalistB;
  const away = home.id === finalistA.id ? finalistB : finalistA;
  const final = simulateKnockout(home, away, `${seed}:${season}:${competitionId}:final`);
  return {
    ...base,
    status: 'complete',
    championClubId,
    automaticPromotionClubIds: [championClubId],
    playoffClubIds: playoffRows.map(row => row.clubId),
    playoffWinnerClubId: final.winnerClubId,
    promotedClubIds: [championClubId, final.winnerClubId],
    relegatedClubIds: ranking.rows.slice(-4).map(row => row.clubId),
    playoffs: { semiFinals: [semiA, semiB], final: { ...final, hostClubId: home.id, venueRule: 'higher-ranked-finalist-home' } }
  };
}

export function simulateAllStepFourDivisions({ season = '2026/27', seed = 'football-lab-step-four', memberships = STEP_FOUR_2026_27_MEMBERSHIPS, completedAt = null } = {}) {
  return Object.fromEntries(STEP_FOUR_DIVISION_IDS.map(id => [id, simulateStepFourDivisionSeason({ competitionId: id, season, clubs: memberships[id], seed, completedAt })]));
}
