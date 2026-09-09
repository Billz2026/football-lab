export const NATIONAL_LEAGUE_STEP_THREE_WORLD_VERSION = 1;
export const ISTHMIAN_PREMIER_ID = 'eng-isthmian-premier';
export const NORTHERN_PREMIER_ID = 'eng-northern-premier';
export const SOUTHERN_PREMIER_CENTRAL_ID = 'eng-southern-premier-central';
export const SOUTHERN_PREMIER_SOUTH_ID = 'eng-southern-premier-south';

export const STEP_THREE_DIVISION_IDS = Object.freeze([
  ISTHMIAN_PREMIER_ID,
  NORTHERN_PREMIER_ID,
  SOUTHERN_PREMIER_CENTRAL_ID,
  SOUTHERN_PREMIER_SOUTH_ID
]);

export const STEP_THREE_RULES = Object.freeze({
  clubCount: 22,
  automaticPromotionPlaces: 1,
  playoffPlaces: Object.freeze([2, 3, 4, 5]),
  relegationPlaces: 4,
  regularSeasonMatchesPerClub: 42,
  regularSeasonMatches: 462,
  playoffFormat: 'single-leg-higher-ranked-home',
  ranking: Object.freeze(['points', 'goalDifference', 'goalsFor', 'wins', 'headToHeadRecord', 'decidingMatchIfRequired'])
});

const make = (competitionId, rows) => Object.freeze(rows.map(([slug, name, strength, geoNorthing]) => Object.freeze({
  id: `${competitionId}-${slug}`,
  slug,
  name,
  strength,
  geoNorthing
})));

// 2026/27 Step 3 memberships verified against The FA NLS Steps 1-4 allocation (14 May 2026).
// Strength/geoNorthing are Football Lab simulation metadata, not FA ratings.
export const ISTHMIAN_PREMIER_2026_27_CLUBS = make(ISTHMIAN_PREMIER_ID, [
  ['afc-whyteleafe','AFC Whyteleafe',49,28],['aveley','Aveley',52,31],['brentwood-town','Brentwood Town',53,33],['burgess-hill-town','Burgess Hill Town',51,24],
  ['carshalton-athletic','Carshalton Athletic',52,28],['chatham-town','Chatham Town',53,27],['cheshunt','Cheshunt',52,37],['cray-wanderers','Cray Wanderers',51,29],
  ['dartford','Dartford',55,29],['dulwich-hamlet','Dulwich Hamlet',54,28],['eastbourne-borough','Eastbourne Borough',55,20],['enfield-town','Enfield Town',53,36],
  ['leatherhead','Leatherhead',50,27],['lewes','Lewes',52,22],['maldon-tiptree','Maldon & Tiptree',49,34],['ramsgate','Ramsgate',51,24],
  ['st-albans-city','St Albans City',55,40],['stanway-rovers-community','Stanway Rovers Community',48,35],['three-bridges','Three Bridges',49,23],['welling-united','Welling United',52,29],
  ['whitehawk','Whitehawk',51,20],['wingate-finchley','Wingate & Finchley',52,35]
]);

export const NORTHERN_PREMIER_2026_27_CLUBS = make(NORTHERN_PREMIER_ID, [
  ['alfreton-town','Alfreton Town',55,68],['ashton-united','Ashton United',54,74],['avro','Avro',50,76],['bamber-bridge','Bamber Bridge',52,79],
  ['bury','Bury',54,78],['cleethorpes-town','Cleethorpes Town',53,72],['curzon-ashton','Curzon Ashton',56,75],['emley','Emley',52,78],
  ['fc-united-manchester','FC United of Manchester',55,76],['gainsborough-trinity','Gainsborough Trinity',54,70],['guiseley','Guiseley',55,81],['hyde-united','Hyde United',53,75],
  ['ilkeston-town','Ilkeston Town',52,68],['lancaster-city','Lancaster City',53,84],['leek-town','Leek Town',52,69],['quorn','Quorn',52,65],
  ['redcar-athletic','Redcar Athletic',51,89],['stockton-town','Stockton Town',53,88],['warrington-rylands','Warrington Rylands',53,78],['warrington-town','Warrington Town',54,78],
  ['whitby-town','Whitby Town',53,89],['workington','Workington',52,92]
]);

export const SOUTHERN_PREMIER_CENTRAL_2026_27_CLUBS = make(SOUTHERN_PREMIER_CENTRAL_ID, [
  ['alvechurch','Alvechurch',53,58],['anstey-nomads','Anstey Nomads',50,65],['banbury-united','Banbury United',54,54],['bishops-stortford','Bishop’s Stortford',54,43],
  ['bromsgrove-sporting','Bromsgrove Sporting',52,57],['bury-town','Bury Town',51,47],['halesowen-town','Halesowen Town',54,58],['hitchin-town','Hitchin Town',52,43],
  ['kettering-town','Kettering Town',54,56],['leamington','Leamington',56,55],['leighton-town','Leighton Town',51,47],['leiston','Leiston',52,43],
  ['needham-market','Needham Market',53,45],['peterborough-sports','Peterborough Sports',55,58],['racing-club-warwick','Racing Club Warwick',50,54],['real-bedford','Real Bedford',52,48],
  ['redditch-united','Redditch United',53,57],['rushall-olympic','Rushall Olympic',53,61],['stamford','Stamford',52,60],['stourbridge','Stourbridge',53,59],
  ['stratford-town','Stratford Town',53,54],['worcester-city','Worcester City',54,56]
]);

export const SOUTHERN_PREMIER_SOUTH_2026_27_CLUBS = make(SOUTHERN_PREMIER_SOUTH_ID, [
  ['basingstoke-town','Basingstoke Town',52,31],['bath-city','Bath City',56,34],['berkhamsted','Berkhamsted',51,42],['bracknell-town','Bracknell Town',53,34],
  ['chertsey-town','Chertsey Town',52,30],['chichester-city','Chichester City',53,19],['chippenham-town','Chippenham Town',55,37],['evesham-united','Evesham United',52,51],
  ['frome-town','Frome Town',51,35],['gloucester-city','Gloucester City',55,48],['gosport-borough','Gosport Borough',52,24],['hanwell-town','Hanwell Town',51,32],
  ['hanworth-villa','Hanworth Villa',49,30],['havant-waterlooville','Havant & Waterlooville',54,22],['malvern-town','Malvern Town',50,51],['plymouth-parkway','Plymouth Parkway',51,8],
  ['poole-town','Poole Town',52,19],['sholing','Sholing',51,24],['taunton-town','Taunton Town',54,29],['uxbridge','Uxbridge',51,33],
  ['wimborne-town','Wimborne Town',51,20],['yate-town','Yate Town',51,40]
]);

export const STEP_THREE_2026_27_MEMBERSHIPS = Object.freeze({
  [ISTHMIAN_PREMIER_ID]: ISTHMIAN_PREMIER_2026_27_CLUBS,
  [NORTHERN_PREMIER_ID]: NORTHERN_PREMIER_2026_27_CLUBS,
  [SOUTHERN_PREMIER_CENTRAL_ID]: SOUTHERN_PREMIER_CENTRAL_2026_27_CLUBS,
  [SOUTHERN_PREMIER_SOUTH_ID]: SOUTHERN_PREMIER_SOUTH_2026_27_CLUBS
});

const DIVISION_NAMES = Object.freeze({
  [ISTHMIAN_PREMIER_ID]: 'Isthmian League Premier',
  [NORTHERN_PREMIER_ID]: 'Northern Premier League Premier',
  [SOUTHERN_PREMIER_CENTRAL_ID]: 'Southern League Premier Central',
  [SOUTHERN_PREMIER_SOUTH_ID]: 'Southern League Premier South'
});

const clone = value => JSON.parse(JSON.stringify(value));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function hashString(value) {
  let hash = 2166136261;
  for (const character of String(value)) { hash ^= character.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return hash >>> 0;
}
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
  if (!Array.isArray(clubs) || clubs.length !== 22) throw new Error('Step 3 background simulation requires exactly 22 clubs.');
  if (new Set(clubs.map(club => club?.id)).size !== 22) throw new Error('Step 3 club ids must be unique.');
  if (clubs.some(club => !Number.isFinite(Number(club.strength)))) throw new Error('Every Step 3 club requires numeric strength.');
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
    firstLeg.push(round); rotation = [rotation[0], rotation.at(-1), ...rotation.slice(1, -1)];
  }
  const returnOrder = [...firstLeg.slice(1), firstLeg[0]];
  return [...firstLeg, ...returnOrder.map(round => round.map(f => ({ homeClubId: f.awayClubId, awayClubId: f.homeClubId })))]
    .map((round, ri) => round.map((fixture, mi) => ({ id: `s3-mw${ri + 1}-m${mi + 1}`, round: ri + 1, ...fixture, played: false, homeGoals: null, awayGoals: null })));
}

function blankTable(clubs) { return clubs.map(club => ({ clubId: club.id, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 })); }
function simulateFixture(fixture, clubMap, seed) {
  const random = seededRandom(`${seed}:${fixture.id}`); const home = clubMap.get(fixture.homeClubId), away = clubMap.get(fixture.awayClubId);
  const diff = clamp(((Number(home.strength) + 2.1) - Number(away.strength)) / 15.5, -1.3, 1.3);
  return { ...fixture, played: true, homeGoals: poisson(clamp(1.43 + diff, .28, 3.2), random), awayGoals: poisson(clamp(1.05 - diff, .22, 2.8), random) };
}
function apply(table, result) {
  const h = table.find(r => r.clubId === result.homeClubId), a = table.find(r => r.clubId === result.awayClubId);
  h.played++; a.played++; h.goalsFor += result.homeGoals; h.goalsAgainst += result.awayGoals; a.goalsFor += result.awayGoals; a.goalsAgainst += result.homeGoals;
  if (result.homeGoals > result.awayGoals) { h.won++; h.points += 3; a.lost++; } else if (result.homeGoals < result.awayGoals) { a.won++; a.points += 3; h.lost++; } else { h.drawn++; a.drawn++; h.points++; a.points++; }
  h.goalDifference = h.goalsFor - h.goalsAgainst; a.goalDifference = a.goalsFor - a.goalsAgainst;
}
function h2h(ids, fixtures) {
  const set = new Set(ids); const out = Object.fromEntries(ids.map(id => [id, { points: 0, gd: 0, gf: 0 }]));
  for (const f of fixtures.flat()) {
    if (!f.played || !set.has(f.homeClubId) || !set.has(f.awayClubId)) continue;
    const h = out[f.homeClubId], a = out[f.awayClubId]; h.gf += f.homeGoals; a.gf += f.awayGoals; h.gd += f.homeGoals - f.awayGoals; a.gd += f.awayGoals - f.homeGoals;
    if (f.homeGoals > f.awayGoals) h.points += 3; else if (f.homeGoals < f.awayGoals) a.points += 3; else { h.points++; a.points++; }
  }
  return out;
}
function consequences(start, end) {
  const out = []; if (start <= 1 && end > 1) out.push('automatic-promotion'); if (start <= 5 && end > 5) out.push('playoff-qualification'); if (start <= 18 && end > 18) out.push('relegation');
  for (const boundary of [2,3,4]) if (start <= boundary && end > boundary) { out.push('playoff-seeding'); break; }
  return out;
}
export function rankStepThreeTable(table, fixtures, { seed = 'step-three-ranking' } = {}) {
  const sorted = [...table].sort((a,b) => b.points-a.points || b.goalDifference-a.goalDifference || b.goalsFor-a.goalsFor || b.won-a.won);
  const groups = [];
  for (const row of sorted) { const g = groups.at(-1); if (g && ['points','goalDifference','goalsFor','won'].every(k => Number(g[0][k]) === Number(row[k]))) g.push(row); else groups.push([row]); }
  const rows = [], unresolvedGroups = [], administrativeResolutions = [];
  for (const group of groups) {
    if (group.length === 1) { rows.push({ ...clone(group[0]), position: rows.length + 1 }); continue; }
    const records = h2h(group.map(r => r.clubId), fixtures);
    let ranked = group.map(row => ({ row, h: records[row.clubId] })).sort((a,b) => b.h.points-a.h.points || b.h.gd-a.h.gd || b.h.gf-a.h.gf);
    let i = 0;
    while (i < ranked.length) {
      const first = ranked[i]; let end = i + 1;
      while (end < ranked.length && ranked[end].h.points === first.h.points && ranked[end].h.gd === first.h.gd && ranked[end].h.gf === first.h.gf) end++;
      let tied = ranked.slice(i,end); const startPos = rows.length + 1, endPos = startPos + tied.length - 1; const cons = tied.length > 1 ? consequences(startPos,endPos) : [];
      const unresolved = tied.length > 1 && cons.length > 0;
      if (tied.length > 1 && !unresolved) { tied = tied.sort((a,b) => hashString(`${seed}:${a.row.clubId}`)-hashString(`${seed}:${b.row.clubId}`)); administrativeResolutions.push({ clubIds:tied.map(x=>x.row.clubId), positions:[startPos,endPos], method:'simulated-administrative-lot' }); }
      for (const item of tied) rows.push({ ...clone(item.row), position: rows.length + 1, tiebreak:{ headToHeadPoints:item.h.points, headToHeadGoalDifference:item.h.gd, headToHeadGoalsFor:item.h.gf, unresolved } });
      if (unresolved) unresolvedGroups.push({ clubIds:tied.map(x=>x.row.clubId), positions:[startPos,endPos], consequences:cons, method:'deciding-league-match-required' });
      i = end;
    }
  }
  return { rows, unresolvedGroups, administrativeResolutions, decidingMatchRequired: unresolvedGroups.length > 0 };
}
function simulateKnockout(home, away, seed) {
  const random = seededRandom(seed); const diff = clamp(((Number(home.strength)+1.8)-Number(away.strength))/17,-1.1,1.1);
  let hg = poisson(clamp(1.34+diff,.24,2.9),random), ag = poisson(clamp(1.06-diff,.22,2.7),random), method = '90-minutes', extraTime = null, penalties = null;
  if (hg === ag) { const er = seededRandom(`${seed}:et`); const eh = poisson(.3,er), ea = poisson(.27,er); extraTime = {homeGoals:eh,awayGoals:ea}; if (eh !== ea) { hg += eh; ag += ea; method='extra-time'; } else { const pr=seededRandom(`${seed}:pens`); const homeWins=pr()<clamp(.5+(home.strength-away.strength)/300,.43,.57); penalties=homeWins?{home:5,away:4}:{home:4,away:5}; method='penalties'; return {homeClubId:home.id,awayClubId:away.id,homeGoals:hg,awayGoals:ag,extraTime,penalties,method,winnerClubId:homeWins?home.id:away.id}; } }
  return {homeClubId:home.id,awayClubId:away.id,homeGoals:hg,awayGoals:ag,extraTime,penalties,method,winnerClubId:hg>ag?home.id:away.id};
}

export function simulateStepThreeDivisionSeason({ competitionId, season='2026/27', clubs=STEP_THREE_2026_27_MEMBERSHIPS[competitionId], seed='football-lab-step-three', completedAt=null }={}) {
  if (!STEP_THREE_DIVISION_IDS.includes(competitionId)) throw new Error('Unsupported Step 3 division.'); validateMembership(clubs);
  const clubMap = new Map(clubs.map(c=>[c.id,c])); const fixtures = createFixtures(clubs).map((round,ri)=>round.map((f,mi)=>simulateFixture({...f,id:`${competitionId}-mw${ri+1}-m${mi+1}`},clubMap,`${seed}:${season}:${competitionId}`)));
  const table = blankTable(clubs); fixtures.flat().forEach(r=>apply(table,r)); const ranking = rankStepThreeTable(table,fixtures,{seed:`${seed}:${season}:${competitionId}:rank`});
  const base = {schemaVersion:NATIONAL_LEAGUE_STEP_THREE_WORLD_VERSION,key:`${competitionId}:${season}`,competitionId,competitionName:DIVISION_NAMES[competitionId],season,completedAt,membershipSource:season==='2026/27'?'2026/27 verified FA Step 3 allocation':'derived English pyramid membership',clubs:clubs.map(c=>({id:c.id,slug:c.slug,name:c.name,strength:c.strength,geoNorthing:c.geoNorthing})),clubCount:clubs.length,regularSeasonMatches:fixtures.flat().length,rankingRules:[...STEP_THREE_RULES.ranking],finalTable:ranking.rows,rankingResolution:{decidingMatchRequired:ranking.decidingMatchRequired,unresolvedGroups:ranking.unresolvedGroups,administrativeResolutions:ranking.administrativeResolutions}};
  if (ranking.decidingMatchRequired) return {...base,status:'resolution-required',championClubId:ranking.rows[0]?.clubId||null,promotedClubIds:[],playoffClubIds:[],playoffWinnerClubId:null,relegatedClubIds:[],playoffs:null};
  const championClubId = ranking.rows[0].clubId; const po = ranking.rows.slice(1,5); const byId=id=>clubMap.get(id); const second=byId(po[0].clubId),third=byId(po[1].clubId),fourth=byId(po[2].clubId),fifth=byId(po[3].clubId);
  const semiA=simulateKnockout(second,fifth,`${seed}:${season}:${competitionId}:2v5`), semiB=simulateKnockout(third,fourth,`${seed}:${season}:${competitionId}:3v4`); const pos=new Map(ranking.rows.map(r=>[r.clubId,r.position])); const fa=byId(semiA.winnerClubId),fb=byId(semiB.winnerClubId); const home=pos.get(fa.id)<pos.get(fb.id)?fa:fb,away=home.id===fa.id?fb:fa; const final=simulateKnockout(home,away,`${seed}:${season}:${competitionId}:final`);
  return {...base,status:'complete',championClubId,automaticPromotionClubIds:[championClubId],playoffClubIds:po.map(r=>r.clubId),playoffWinnerClubId:final.winnerClubId,promotedClubIds:[championClubId,final.winnerClubId],relegatedClubIds:ranking.rows.slice(-4).map(r=>r.clubId),playoffs:{semiFinals:[semiA,semiB],final:{...final,hostClubId:home.id,venueRule:'higher-ranked-finalist-home'}}};
}

export function simulateAllStepThreeDivisions({ season='2026/27', seed='football-lab-step-three', memberships=STEP_THREE_2026_27_MEMBERSHIPS, completedAt=null }={}) {
  return Object.fromEntries(STEP_THREE_DIVISION_IDS.map(id=>[id,simulateStepThreeDivisionSeason({competitionId:id,season,clubs:memberships[id],seed,completedAt})]));
}
