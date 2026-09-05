// Football Lab real-world curation layer.
// Arsenal pass reviewed 2026-09-05 against the final 2026/27 Premier League
// squad registration, confirmed summer business and recent first-team usage.
// Values are GBP gameplay calibration floors: they are not presented as an
// objective transfer fee or copied from a single valuation website.

const ARSENAL_ID = 'flm-club-api-football-42';
const REVIEW_DATE = '2026-09-05';

const ARSENAL_AUDIT = [
  // Goalkeepers
  { aliases:['Raya'], primaryPosition:'GK', positionGroup:'GK', ca:166, pa:168, importance:91, role:'key-player', value:35_000_000 },
  { aliases:['Kepa'], primaryPosition:'GK', positionGroup:'GK', ca:148, pa:150, importance:58, role:'backup', value:15_000_000 },
  { aliases:['Meslier'], primaryPosition:'GK', positionGroup:'GK', shirtNumber:30, ca:139, pa:150, importance:45, role:'third-choice', value:18_000_000 },
  { aliases:['Setford'], primaryPosition:'GK', positionGroup:'GK', ca:122, pa:154, importance:28, role:'development', value:4_000_000 },

  // Defenders
  { aliases:['Saliba'], primaryPosition:'DC', secondaryPositions:['DR'], positionGroup:'DEF', ca:172, pa:178, importance:97, role:'cornerstone', value:82_000_000, marketTier:'elite' },
  { aliases:['Magalhaes','Magalhães'], primaryPosition:'DC', secondaryPositions:['DL'], positionGroup:'DEF', ca:169, pa:171, importance:94, role:'key-player', value:70_000_000, marketTier:'star' },
  { aliases:['Timber'], primaryPosition:'DR', secondaryPositions:['DC','DL'], positionGroup:'DEF', ca:163, pa:169, importance:88, role:'first-team', value:55_000_000 },
  { aliases:['Calafiori'], primaryPosition:'DL', secondaryPositions:['DC'], positionGroup:'DEF', ca:159, pa:168, importance:84, role:'first-team', value:55_000_000 },
  { aliases:['Hincapie','Hincapié'], primaryPosition:'DL', secondaryPositions:['DC'], positionGroup:'DEF', ca:158, pa:166, importance:80, role:'rotation', value:50_000_000 },
  { aliases:['Konsa'], primaryPosition:'DC', secondaryPositions:['DR'], positionGroup:'DEF', ca:157, pa:159, importance:79, role:'rotation', value:45_000_000 },
  { aliases:['White'], primaryPosition:'DR', secondaryPositions:['DC'], positionGroup:'DEF', ca:155, pa:157, importance:78, role:'rotation', value:35_000_000 },
  { aliases:['Mosquera'], primaryPosition:'DC', secondaryPositions:['DR'], positionGroup:'DEF', ca:151, pa:170, importance:74, role:'rotation-development', value:45_000_000 },
  { aliases:['Lewis-Skelly'], primaryPosition:'DL', secondaryPositions:['MC','DMC'], positionGroup:'DEF', ca:154, pa:184, importance:77, role:'first-team-development', value:60_000_000 },
  { aliases:['Clarke'], primaryPosition:'DC', secondaryPositions:['DL'], positionGroup:'DEF', ca:116, pa:158, importance:25, role:'u21-prospect', value:3_000_000 },
  { aliases:['Dixon'], primaryPosition:'DC', secondaryPositions:['DR'], positionGroup:'DEF', ca:113, pa:154, importance:22, role:'u21-prospect', value:2_000_000 },
  { aliases:['Salmon'], primaryPosition:'DC', secondaryPositions:[], positionGroup:'DEF', ca:108, pa:160, importance:20, role:'academy-prospect', value:2_000_000 },

  // Midfielders
  { aliases:['Rice'], primaryPosition:'DMC', secondaryPositions:['MC'], positionGroup:'MID', ca:174, pa:177, importance:98, role:'cornerstone', value:105_000_000, marketTier:'elite' },
  { aliases:['Odegaard','Ødegaard'], primaryPosition:'AMC', secondaryPositions:['MC'], positionGroup:'MID', ca:168, pa:170, importance:93, role:'key-player', value:74_000_000, marketTier:'star' },
  { aliases:['Guimaraes','Guimarães'], primaryPosition:'MC', secondaryPositions:['DMC'], positionGroup:'MID', ca:168, pa:170, importance:92, role:'key-player', value:85_000_000, marketTier:'star' },
  { aliases:['Zubimendi'], primaryPosition:'DMC', secondaryPositions:['MC'], positionGroup:'MID', ca:164, pa:168, importance:88, role:'first-team', value:65_000_000 },
  { aliases:['Eze'], primaryPosition:'AMC', secondaryPositions:['AML','MC'], positionGroup:'MID', ca:162, pa:164, importance:87, role:'first-team', value:55_000_000 },
  { aliases:['Merino'], primaryPosition:'MC', secondaryPositions:['DMC','AMC'], positionGroup:'MID', ca:153, pa:155, importance:75, role:'rotation', value:30_000_000 },
  { aliases:['Dowman'], primaryPosition:'AMC', secondaryPositions:['AMR','MC'], positionGroup:'MID', ca:141, pa:190, importance:55, role:'elite-prospect', value:35_000_000 },
  { aliases:['Ibrahim'], primaryPosition:'MC', secondaryPositions:['DMC'], positionGroup:'MID', ca:112, pa:157, importance:22, role:'u21-prospect', value:2_000_000 },
  { aliases:['George Copley','Copley'], primaryPosition:'MC', secondaryPositions:['AMC'], positionGroup:'MID', ca:114, pa:154, importance:22, role:'u21-prospect', value:2_000_000 },

  // Attackers
  { aliases:['Saka'], primaryPosition:'AMR', secondaryPositions:['AML'], positionGroup:'ATT', ca:178, pa:183, importance:100, role:'cornerstone', value:130_000_000, marketTier:'global-superstar' },
  { aliases:['Havertz'], primaryPosition:'ST', secondaryPositions:['AMC'], positionGroup:'ATT', ca:160, pa:162, importance:86, role:'first-team', value:55_000_000 },
  { aliases:['Gyokeres','Gyökeres'], primaryPosition:'ST', secondaryPositions:[], positionGroup:'ATT', ca:161, pa:163, importance:85, role:'first-team', value:55_000_000 },
  { aliases:['Tzolis'], primaryPosition:'AML', secondaryPositions:['AMR','ST'], positionGroup:'ATT', ca:156, pa:164, importance:82, role:'first-team', value:45_000_000 },
  { aliases:['Madueke'], primaryPosition:'AMR', secondaryPositions:['AML'], positionGroup:'ATT', ca:155, pa:166, importance:77, role:'rotation', value:45_000_000 },
  { aliases:['Annous'], primaryPosition:'ST', secondaryPositions:['AML'], positionGroup:'ATT', ca:114, pa:160, importance:24, role:'u21-prospect', value:3_000_000 },

  // Not available to Arsenal in 2026/27. Kept in the data object for save safety,
  // but removed from the selectable Arsenal squad at runtime.
  { aliases:['Nwaneri'], primaryPosition:'AMC', secondaryPositions:['AMR'], positionGroup:'MID', ca:150, pa:183, importance:65, role:'season-loan', value:34_000_000, externalClub:'Borussia Dortmund', loan:true },
  { aliases:['Vieira'], primaryPosition:'AMC', secondaryPositions:['MC'], positionGroup:'MID', ca:149, pa:156, importance:0, role:'departed', value:22_000_000, externalClub:'Hamburger SV' },
  { aliases:['Jesus'], primaryPosition:'ST', secondaryPositions:['AMR','AML'], positionGroup:'ATT', ca:151, pa:153, importance:0, role:'departed', value:10_000_000, externalClub:'Barcelona' },
  { aliases:['Martinelli'], primaryPosition:'AML', secondaryPositions:['ST'], positionGroup:'ATT', ca:157, pa:161, importance:0, role:'departed', value:60_000_000, externalClub:'Al-Hilal' }
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

function externalId(name) {
  return `flm-external-${normalise(name).replaceAll(' ', '-')}`;
}

function applyRecord(player, record) {
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
    club: 'Arsenal',
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
    arsenalAudit: `reviewed-${REVIEW_DATE}`,
    positionDetail: 'curated-real-world-review',
    ratingEngine: 'Football Lab audited CA/PA calibration',
    confidence: record.role.includes('prospect') || record.role === 'development' ? 'medium' : 'high'
  };

  if (record.externalClub) {
    player.parentClubId = record.loan ? ARSENAL_ID : null;
    player.loanClubName = record.loan ? record.externalClub : null;
    player.previousClubId = ARSENAL_ID;
    player.clubId = externalId(record.externalClub);
    player.currentClubName = record.externalClub;
    player.unavailableInPremierLeagueDatabase = true;
    player.isPlaceholder = true;
  }
}

function applyArsenalAudit(db) {
  if (!db?.players || db.__arsenalAuditV1 === REVIEW_DATE) return db;
  const arsenalPlayers = db.players.filter(player => player.clubId === ARSENAL_ID);
  const unmatched = [];

  for (const player of arsenalPlayers) {
    const record = ARSENAL_AUDIT.find(item => matches(player, item.aliases));
    if (!record) {
      unmatched.push(player.name);
      player.audit = {
        reviewDate: REVIEW_DATE,
        club: 'Arsenal',
        importance: 15,
        role: 'academy-depth-unreviewed',
        marketTier: null,
        valueFloor: 0,
        source: 'official-squad-membership-only'
      };
      player.importanceScore = 15;
      player.squadImportance = 'academy-depth-unreviewed';
    } else {
      applyRecord(player, record);
    }
  }

  db.playerAudit ||= {};
  db.playerAudit.arsenal = {
    version: 1,
    reviewDate: REVIEW_DATE,
    expectedRecords: ARSENAL_AUDIT.length,
    reviewedRuntimePlayers: arsenalPlayers.length - unmatched.length,
    unmatchedRuntimePlayers: unmatched,
    methodology: 'real position + squad role + CA/PA + gameplay market-value floor'
  };
  db.__arsenalAuditV1 = REVIEW_DATE;
  return db;
}

const manager = window.FLMManager;
if (manager?.loadDatabase) {
  const baseLoadDatabase = manager.loadDatabase.bind(manager);
  manager.loadDatabase = async (...args) => applyArsenalAudit(await baseLoadDatabase(...args));
  // Start the audit immediately so manager-base's internal cached database is also
  // curated before the user enters Squad, Tactics, Matchday or Transfers.
  manager.loadDatabase().catch(error => console.error('Arsenal audit failed', error));
}

window.FLMPlayerAudit = {
  version: 1,
  reviewDate: REVIEW_DATE,
  arsenal: ARSENAL_AUDIT.map(record => ({ ...record, aliases:[...record.aliases] })),
  applyArsenalAudit
};
