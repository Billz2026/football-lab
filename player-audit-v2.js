// Football Lab real-world curation layer — Premier League audit pass 2.
// Manchester United and Manchester City reviewed 2026-09-05 against current
// official club squad pages, confirmed deadline-day business and first-team usage.
// CA/PA, importance and GBP values are Football Lab gameplay calibration — they
// are not copied from another game or presented as objective transfer valuations.

const REVIEW_DATE = '2026-09-05';
const UNITED_ID = 'flm-club-api-football-33';
const CITY_ID = 'flm-club-api-football-50';
const CHELSEA_ID = 'flm-club-api-football-49';
const EVERTON_ID = 'flm-club-api-football-45';

export const MANCHESTER_UNITED_AUDIT = [
  // Goalkeepers
  { aliases:['Lammens'], primaryPosition:'GK', positionGroup:'GK', ca:154, pa:172, importance:86, role:'first-team', value:45_000_000 },
  { aliases:['Darlow'], primaryPosition:'GK', positionGroup:'GK', ca:132, pa:133, importance:35, role:'backup', value:4_000_000 },
  { aliases:['Heaton'], primaryPosition:'GK', positionGroup:'GK', ca:110, pa:110, importance:18, role:'emergency-backup', value:500_000 },
  { aliases:['William Mee','Mee'], primaryPosition:'GK', positionGroup:'GK', ca:112, pa:145, importance:18, role:'development-goalkeeper', value:1_000_000 },

  // Defenders
  { aliases:['Yoro'], primaryPosition:'DC', secondaryPositions:['DR'], positionGroup:'DEF', ca:160, pa:183, importance:89, role:'key-development', value:70_000_000, marketTier:'star' },
  { aliases:['de Ligt','De Ligt'], primaryPosition:'DC', secondaryPositions:[], positionGroup:'DEF', ca:164, pa:167, importance:88, role:'key-player', value:55_000_000 },
  { aliases:['Martinez','Martínez'], primaryPosition:'DC', secondaryPositions:['DL'], positionGroup:'DEF', ca:163, pa:165, importance:87, role:'key-player', value:50_000_000 },
  { aliases:['Dorgu'], primaryPosition:'DL', secondaryPositions:['WBL','AML','DR'], positionGroup:'DEF', ca:153, pa:172, importance:84, role:'first-team', value:50_000_000 },
  { aliases:['Dalot'], primaryPosition:'DR', secondaryPositions:['DL'], positionGroup:'DEF', ca:157, pa:160, importance:80, role:'first-team', value:42_000_000 },
  { aliases:['Mazraoui'], primaryPosition:'DR', secondaryPositions:['DL','DC'], positionGroup:'DEF', ca:155, pa:156, importance:73, role:'rotation', value:30_000_000 },
  { aliases:['Shaw'], primaryPosition:'DL', secondaryPositions:['DC'], positionGroup:'DEF', ca:153, pa:154, importance:65, role:'rotation', value:22_000_000 },
  { aliases:['Maguire'], primaryPosition:'DC', secondaryPositions:[], positionGroup:'DEF', ca:150, pa:150, importance:67, role:'rotation', value:15_000_000 },
  { aliases:['Heaven'], primaryPosition:'DC', secondaryPositions:['DL'], positionGroup:'DEF', ca:143, pa:178, importance:58, role:'first-team-development', value:25_000_000 },
  { aliases:['Amass'], primaryPosition:'DL', secondaryPositions:['WBL'], positionGroup:'DEF', ca:139, pa:177, importance:48, role:'development', value:20_000_000 },
  { aliases:['Kukonki'], primaryPosition:'DC', secondaryPositions:['DL'], positionGroup:'DEF', ca:128, pa:170, importance:31, role:'academy-prospect', value:9_000_000 },
  { aliases:['Kamason'], primaryPosition:'DR', secondaryPositions:['DC'], positionGroup:'DEF', ca:126, pa:166, importance:28, role:'academy-prospect', value:7_000_000 },

  // Midfielders
  { aliases:['Bruno Fernandes','Fernandes'], firstName:'bruno', primaryPosition:'AMC', secondaryPositions:['MC'], positionGroup:'MID', ca:171, pa:172, importance:99, role:'cornerstone', value:60_000_000, marketTier:'elite' },
  { aliases:['Baleba'], primaryPosition:'DMC', secondaryPositions:['MC'], positionGroup:'MID', ca:165, pa:182, importance:93, role:'key-player', value:85_000_000, marketTier:'star' },
  { aliases:['Tielemans'], primaryPosition:'MC', secondaryPositions:['AMC','DMC'], positionGroup:'MID', ca:160, pa:161, importance:86, role:'first-team', value:40_000_000 },
  { aliases:['Andrey Santos','Santos'], firstName:'andrey', primaryPosition:'MC', secondaryPositions:['DMC'], positionGroup:'MID', ca:159, pa:178, importance:84, role:'first-team-development', value:60_000_000 },
  { aliases:['Mainoo'], primaryPosition:'MC', secondaryPositions:['DMC'], positionGroup:'MID', ca:156, pa:179, importance:78, role:'first-team-development', value:55_000_000 },
  { aliases:['Ugarte'], primaryPosition:'DMC', secondaryPositions:['MC'], positionGroup:'MID', ca:155, pa:158, importance:72, role:'rotation', value:35_000_000 },
  { aliases:['Mount'], primaryPosition:'AMC', secondaryPositions:['MC','AML'], positionGroup:'MID', ca:153, pa:156, importance:70, role:'rotation', value:30_000_000 },
  { aliases:['Jack Fletcher','J. Fletcher'], firstName:'j', primaryPosition:'MC', secondaryPositions:['AMC'], positionGroup:'MID', ca:131, pa:172, importance:35, role:'academy-prospect', value:12_000_000 },
  { aliases:['Tyler Fletcher','T. Fletcher'], firstName:'t', primaryPosition:'MC', secondaryPositions:['DMC'], positionGroup:'MID', ca:127, pa:170, importance:30, role:'academy-prospect', value:10_000_000 },

  // Attackers
  { aliases:['Mbeumo'], primaryPosition:'AMR', secondaryPositions:['ST'], positionGroup:'ATT', ca:164, pa:166, importance:92, role:'key-player', value:75_000_000, marketTier:'star' },
  { aliases:['Cunha'], primaryPosition:'AMC', secondaryPositions:['ST','AML'], positionGroup:'ATT', ca:162, pa:164, importance:89, role:'key-player', value:65_000_000 },
  { aliases:['Sesko','Šeško'], primaryPosition:'ST', secondaryPositions:[], positionGroup:'ATT', ca:161, pa:180, importance:87, role:'first-team', value:80_000_000, marketTier:'star' },
  { aliases:['Diallo'], primaryPosition:'AMR', secondaryPositions:['AMC'], positionGroup:'ATT', ca:159, pa:174, importance:85, role:'first-team', value:55_000_000 },
  { aliases:['Rashford'], primaryPosition:'AML', secondaryPositions:['ST','AMR'], positionGroup:'ATT', ca:158, pa:160, importance:80, role:'first-team', value:45_000_000 },
  { aliases:['Zirkzee'], primaryPosition:'ST', secondaryPositions:['AMC'], positionGroup:'ATT', ca:152, pa:162, importance:67, role:'rotation', value:35_000_000 },
  { aliases:['Lacey'], primaryPosition:'AMR', secondaryPositions:['AML','AMC'], positionGroup:'ATT', ca:140, pa:185, importance:52, role:'elite-prospect', value:30_000_000 },
  { aliases:['Chido Obi','Obi'], primaryPosition:'ST', secondaryPositions:[], positionGroup:'ATT', ca:133, pa:180, importance:40, role:'elite-prospect', value:20_000_000 }
];

export const MANCHESTER_CITY_AUDIT = [
  // Goalkeepers
  { aliases:['Donnarumma'], primaryPosition:'GK', positionGroup:'GK', ca:177, pa:180, importance:95, role:'cornerstone', value:75_000_000, marketTier:'elite' },
  { aliases:['Rulli'], primaryPosition:'GK', positionGroup:'GK', ca:146, pa:147, importance:42, role:'backup', value:6_000_000 },
  { aliases:['Bettinelli'], primaryPosition:'GK', positionGroup:'GK', ca:118, pa:118, importance:18, role:'emergency-backup', value:1_000_000 },

  // Defenders
  { aliases:['Dias'], firstName:'ruben', primaryPosition:'DC', secondaryPositions:[], positionGroup:'DEF', ca:173, pa:174, importance:97, role:'cornerstone', value:70_000_000, marketTier:'elite' },
  { aliases:['Gvardiol'], primaryPosition:'DC', secondaryPositions:['DL'], positionGroup:'DEF', ca:171, pa:178, importance:95, role:'key-player', value:85_000_000, marketTier:'elite' },
  { aliases:['Guehi','Guéhi'], primaryPosition:'DC', secondaryPositions:[], positionGroup:'DEF', ca:168, pa:171, importance:94, role:'key-player', value:75_000_000, marketTier:'star' },
  { aliases:['Khusanov'], primaryPosition:'DC', secondaryPositions:['DR'], positionGroup:'DEF', ca:156, pa:177, importance:84, role:'first-team', value:55_000_000 },
  { aliases:['Ait-Nouri','Aït-Nouri'], primaryPosition:'DL', secondaryPositions:['WBL'], positionGroup:'DEF', ca:159, pa:164, importance:78, role:'rotation-first-team', value:45_000_000 },
  { aliases:['Lewis'], firstName:'r', primaryPosition:'DR', secondaryPositions:['DMC','MC'], positionGroup:'DEF', ca:154, pa:173, importance:82, role:'first-team-development', value:50_000_000 },
  { aliases:['Matheus Nunes','Nunes'], firstName:'matheus', primaryPosition:'DR', secondaryPositions:['MC','DMC'], positionGroup:'DEF', ca:158, pa:160, importance:75, role:'rotation', value:40_000_000 },
  { aliases:['Vitor Reis','Reis'], primaryPosition:'DC', secondaryPositions:[], positionGroup:'DEF', ca:145, pa:178, importance:48, role:'development', value:30_000_000 },

  // Midfield / attack
  { aliases:['Haaland'], primaryPosition:'ST', secondaryPositions:[], positionGroup:'ATT', ca:188, pa:191, importance:100, role:'global-superstar', value:185_000_000, marketTier:'world-icon' },
  { aliases:['Foden'], primaryPosition:'AMC', secondaryPositions:['AMR','AML','MC'], positionGroup:'MID', ca:173, pa:178, importance:96, role:'cornerstone', value:95_000_000, marketTier:'elite' },
  { aliases:['Fernandez','Fernández'], firstName:'e', sourceClubId:CHELSEA_ID, forceClub:true, shirtNumber:17, primaryPosition:'MC', secondaryPositions:['DMC','AMC'], positionGroup:'MID', ca:172, pa:174, importance:95, role:'key-player', value:110_000_000, marketTier:'elite' },
  { aliases:['Anderson'], firstName:'e', primaryPosition:'MC', secondaryPositions:['DMC'], positionGroup:'MID', ca:166, pa:177, importance:93, role:'key-player', value:85_000_000, marketTier:'star' },
  { aliases:['Cherki'], primaryPosition:'AMC', secondaryPositions:['AMR','AML'], positionGroup:'MID', ca:164, pa:179, importance:90, role:'key-player', value:80_000_000, marketTier:'star' },
  { aliases:['Semenyo'], primaryPosition:'AML', secondaryPositions:['AMR','ST'], positionGroup:'ATT', ca:163, pa:166, importance:89, role:'first-team', value:70_000_000 },
  { aliases:['Ndiaye'], firstName:'i', sourceClubId:EVERTON_ID, forceClub:true, shirtNumber:7, primaryPosition:'AML', secondaryPositions:['AMR','AMC','ST'], positionGroup:'ATT', ca:160, pa:163, importance:82, role:'first-team', value:50_000_000 },
  { aliases:['Doku'], primaryPosition:'AML', secondaryPositions:['AMR'], positionGroup:'ATT', ca:163, pa:171, importance:84, role:'rotation-first-team', value:60_000_000 },
  { aliases:["O'Reilly",'O’Reilly'], primaryPosition:'MC', secondaryPositions:['DL','DMC'], positionGroup:'MID', ca:155, pa:178, importance:85, role:'first-team-development', value:55_000_000 },
  { aliases:['Kovacic','Kovačić'], primaryPosition:'MC', secondaryPositions:['DMC'], positionGroup:'MID', ca:156, pa:157, importance:65, role:'rotation', value:22_000_000 },
  { aliases:['Bouaddi'], primaryPosition:'MC', secondaryPositions:['DMC'], positionGroup:'MID', ca:150, pa:187, importance:64, role:'elite-prospect', value:45_000_000 },
  { aliases:['Allan'], exactName:'allan', shirtNumber:37, primaryPosition:'AMR', secondaryPositions:['AML'], positionGroup:'ATT', ca:149, pa:181, importance:65, role:'high-potential-development', value:45_000_000 },
  { aliases:['Monga'], primaryPosition:'AML', secondaryPositions:['AMR'], positionGroup:'ATT', ca:135, pa:186, importance:45, role:'elite-prospect', value:28_000_000 },
  { aliases:['Echeverri'], primaryPosition:'AMC', secondaryPositions:['AMR'], positionGroup:'MID', ca:148, pa:178, importance:52, role:'development', value:35_000_000 },
  { aliases:['McAidoo'], primaryPosition:'AMR', secondaryPositions:['ST'], positionGroup:'ATT', ca:126, pa:173, importance:27, role:'academy-prospect', value:10_000_000 }
];

const CITY_DEPARTURES = [
  { aliases:['Rodri','Rodrigo'], externalClub:'Barcelona' },
  { aliases:['Reijnders'], externalClub:'Al Qadsiah' },
  { aliases:['Savinho'], externalClub:'Tottenham Hotspur' },
  { aliases:['Nico Gonzalez','Gonzalez','González'], firstName:'n', externalClub:'Newcastle United' },
  { aliases:['Marmoush'], externalClub:'Tottenham Hotspur', loan:true },
  { aliases:['Ake','Aké'], externalClub:'Fenerbahce' },
  { aliases:['Trafford'], externalClub:'Leeds United' },
  { aliases:['Akanji'], externalClub:'Inter Milan' },
  { aliases:['Stones'], externalClub:'Inter Milan' }
];

const UNITED_LOANS = [
  { aliases:['Onana'], externalClub:'On loan', loan:true },
  { aliases:['Bayindir','Bayındır'], externalClub:'On loan', loan:true }
];

function normalise(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function playerFirstToken(player) {
  return normalise(player?.firstName || player?.name).split(' ')[0];
}

function matches(player, record) {
  if (!player) return false;
  if (record.sourceClubId && player.clubId !== record.sourceClubId && !record.forceClub) return false;
  if (record.exactName && normalise(player.name) !== normalise(record.exactName)) return false;
  const name = normalise(player.name);
  const lastName = normalise(player.lastName);
  const aliasMatch = record.aliases.some(alias => {
    const token = normalise(alias);
    return token && (lastName === token || name === token || name.endsWith(` ${token}`));
  });
  if (!aliasMatch) return false;
  if (record.firstName && !playerFirstToken(player).startsWith(normalise(record.firstName))) return false;
  return true;
}

function externalId(name) {
  return `flm-external-${normalise(name).replaceAll(' ', '-')}`;
}

function applyRecord(player, record, clubId, clubName) {
  if (record.forceClub && player.clubId !== clubId) {
    player.previousClubId = player.clubId;
    player.clubId = clubId;
    player.currentClubName = clubName;
    player.isPlaceholder = false;
    player.unavailableInPremierLeagueDatabase = false;
  }
  player.primaryPosition = record.primaryPosition;
  player.secondaryPositions = [...(record.secondaryPositions || [])];
  player.positionGroup = record.positionGroup;
  player.currentAbility = record.ca;
  player.potentialAbility = record.pa;
  if (record.shirtNumber) player.shirtNumber = record.shirtNumber;
  player.auditedMarketValue = record.value;
  player.importanceScore = record.importance;
  player.squadImportance = record.role;
  player.audit = {
    reviewDate: REVIEW_DATE,
    club: clubName,
    importance: record.importance,
    role: record.role,
    marketTier: record.marketTier || null,
    valueFloor: record.value,
    source: 'curated-real-world-review'
  };
  player.contract ||= {};
  player.contract.squadStatus = record.role;
  player.dataQuality = {
    ...(player.dataQuality || {}),
    premierLeagueAudit: `reviewed-${REVIEW_DATE}`,
    positionDetail: 'curated-real-world-review',
    ratingEngine: 'Football Lab audited CA/PA calibration',
    confidence: /prospect|development/.test(record.role) ? 'medium' : 'high'
  };
}

function moveOut(player, record, parentClubId, clubName) {
  player.previousClubId = parentClubId;
  player.parentClubId = record.loan ? parentClubId : null;
  player.loanClubName = record.loan ? record.externalClub : null;
  player.clubId = externalId(record.externalClub);
  player.currentClubName = record.externalClub;
  player.unavailableInPremierLeagueDatabase = true;
  player.isPlaceholder = true;
  player.importanceScore = 0;
  player.squadImportance = record.loan ? 'loan-out' : 'departed';
  player.audit = {
    reviewDate: REVIEW_DATE,
    club: clubName,
    importance: 0,
    role: record.loan ? 'loan-out' : 'departed',
    source: 'confirmed-squad-movement'
  };
}

function applyClubAudit(db, { clubId, clubName, records, departures = [] }) {
  const matchedIds = new Set();
  const missingRecords = [];

  // Current registrations already belonging to the club.
  for (const player of db.players.filter(item => item.clubId === clubId)) {
    const record = records.find(item => !item.sourceClubId && matches(player, item));
    if (record) {
      applyRecord(player, record, clubId, clubName);
      matchedIds.add(player.id);
    }
  }

  // Deadline-day arrivals can still carry the previous club in the static import.
  for (const record of records.filter(item => item.forceClub)) {
    const player = db.players.find(item => item.clubId === record.sourceClubId && matches(item, { ...record, forceClub:false }));
    if (!player) {
      missingRecords.push(record.aliases[0]);
      continue;
    }
    applyRecord(player, record, clubId, clubName);
    matchedIds.add(player.id);
  }

  // Confirmed departures/loans are removed from selectable runtime squads without
  // deleting the underlying identity, which keeps older saves recoverable.
  for (const record of departures) {
    const player = db.players.find(item => item.clubId === clubId && matches(item, record));
    if (player) moveOut(player, record, clubId, clubName);
  }

  const unmatched = db.players.filter(item => item.clubId === clubId && !item.isPlaceholder && !matchedIds.has(item.id));
  for (const player of unmatched) {
    if (player.importanceScore == null || player.importanceScore > 20) player.importanceScore = 15;
    player.squadImportance ||= 'academy-depth-unreviewed';
    player.audit ||= {
      reviewDate: REVIEW_DATE,
      club: clubName,
      importance: 15,
      role: 'academy-depth-unreviewed',
      source: 'current-database-membership-only'
    };
  }

  return {
    reviewDate: REVIEW_DATE,
    expectedRecords: records.length,
    reviewedRuntimePlayers: matchedIds.size,
    unmatchedRuntimePlayers: unmatched.map(player => player.name),
    missingForcedArrivalRecords: missingRecords,
    methodology: 'real position + squad role + CA/PA + importance + gameplay market-value floor'
  };
}

export function applyManchesterAuditV2(db) {
  if (!db?.players || db.__manchesterAuditV2 === REVIEW_DATE) return db;
  db.playerAudit ||= {};
  db.playerAudit.manchesterUnited = applyClubAudit(db, {
    clubId: UNITED_ID,
    clubName: 'Manchester United',
    records: MANCHESTER_UNITED_AUDIT,
    departures: UNITED_LOANS
  });
  db.playerAudit.manchesterCity = applyClubAudit(db, {
    clubId: CITY_ID,
    clubName: 'Manchester City',
    records: MANCHESTER_CITY_AUDIT,
    departures: CITY_DEPARTURES
  });
  db.__manchesterAuditV2 = REVIEW_DATE;
  return db;
}

if (typeof window !== 'undefined') {
  const manager = window.FLMManager;
  if (manager?.loadDatabase) {
    const baseLoadDatabase = manager.loadDatabase.bind(manager);
    manager.loadDatabase = async (...args) => applyManchesterAuditV2(await baseLoadDatabase(...args));
    manager.loadDatabase().catch(error => console.error('Manchester player audit failed', error));
  }
  window.FLMPlayerAuditV2 = {
    version: 2,
    reviewDate: REVIEW_DATE,
    manchesterUnited: MANCHESTER_UNITED_AUDIT.map(record => ({ ...record, aliases:[...record.aliases] })),
    manchesterCity: MANCHESTER_CITY_AUDIT.map(record => ({ ...record, aliases:[...record.aliases] })),
    applyManchesterAuditV2
  };
}
