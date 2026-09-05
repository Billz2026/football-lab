// Football Lab real-world curation layer — Premier League audit pass 3.
// Liverpool, Chelsea, Tottenham Hotspur and Newcastle United reviewed 2026-09-05
// against the post-window 2026/27 Premier League squad registrations and current
// official club material. CA/PA, importance and GBP values are Football Lab
// gameplay calibration, not copied from another game or claimed market values.

const REVIEW_DATE = '2026-09-05';
const LIVERPOOL_ID = 'flm-club-api-football-40';
const CHELSEA_ID = 'flm-club-api-football-49';
const TOTTENHAM_ID = 'flm-club-api-football-47';
const NEWCASTLE_ID = 'flm-club-api-football-34';
const ARSENAL_ID = 'flm-club-api-football-42';

const R = (aliases, primaryPosition, positionGroup, ca, pa, importance, role, value, extras = {}) => ({
  aliases: Array.isArray(aliases) ? aliases : [aliases],
  primaryPosition,
  positionGroup,
  ca,
  pa,
  importance,
  role,
  value,
  ...extras
});

export const LIVERPOOL_AUDIT = [
  // Goalkeepers
  R(['Alisson Becker','Alisson'], 'GK', 'GK', 169, 169, 95, 'cornerstone', 38_000_000),
  R(['Giorgi Mamardashvili','Mamardashvili'], 'GK', 'GK', 162, 170, 82, 'first-team', 45_000_000),
  R(['Vitezslav Jaros','Jaros'], 'GK', 'GK', 142, 154, 43, 'backup', 9_000_000),
  R(['Freddie Woodman','Woodman'], 'GK', 'GK', 136, 136, 28, 'backup', 4_000_000),

  // Defenders
  R(['Virgil van Dijk','Van Dijk'], 'DC', 'DEF', 174, 174, 98, 'cornerstone', 28_000_000, { secondaryPositions:[] }),
  R(['Ronald Araujo','Araujo','Araújo'], 'DC', 'DEF', 168, 169, 92, 'key-player', 58_000_000, { secondaryPositions:['DR'], forceClub:true, shirtNumber:33 }),
  R(['Jeremy Jacquet','Jérémy Jacquet','Jacquet'], 'DC', 'DEF', 154, 180, 82, 'first-team-development', 48_000_000, { forceClub:true }),
  R(['Giovanni Leoni','Leoni'], 'DC', 'DEF', 147, 180, 61, 'elite-prospect', 34_000_000),
  R(['Joe Gomez','Gomez'], 'DC', 'DEF', 151, 151, 66, 'rotation', 18_000_000, { secondaryPositions:['DR'] }),
  R(['Jeremie Frimpong','Frimpong'], 'DR', 'DEF', 165, 167, 91, 'key-player', 62_000_000, { secondaryPositions:['WBR','AMR'] }),
  R(['Conor Bradley','Bradley'], 'DR', 'DEF', 157, 170, 76, 'rotation-first-team', 38_000_000, { secondaryPositions:['WBR'] }),
  R(['Milos Kerkez','Kerkez'], 'DL', 'DEF', 161, 171, 90, 'key-player', 58_000_000, { secondaryPositions:['WBL'] }),
  R(['Kostas Tsimikas','Tsimikas'], 'DL', 'DEF', 150, 151, 52, 'rotation', 15_000_000, { secondaryPositions:['WBL'] }),
  R(['Luke Chambers','Chambers'], 'DL', 'DEF', 142, 164, 39, 'development', 12_000_000, { secondaryPositions:['DC'] }),
  R(['Isaac Mabaya','Mabaya'], 'DR', 'DEF', 130, 160, 24, 'academy-depth', 5_000_000, { secondaryPositions:['MR'] }),

  // Midfielders
  R(['Florian Wirtz','Wirtz'], 'AMC', 'MID', 177, 185, 100, 'global-superstar', 145_000_000, { secondaryPositions:['AML','MC'], marketTier:'world-icon' }),
  R(['Alexis Mac Allister','Mac Allister'], 'MC', 'MID', 170, 172, 96, 'cornerstone', 95_000_000, { secondaryPositions:['DMC','AMC'], marketTier:'elite' }),
  R(['Ryan Gravenberch','Gravenberch'], 'DMC', 'MID', 168, 174, 94, 'key-player', 88_000_000, { secondaryPositions:['MC'], marketTier:'elite' }),
  R(['Dominik Szoboszlai','Szoboszlai'], 'AMC', 'MID', 168, 173, 93, 'key-player', 85_000_000, { secondaryPositions:['MC','AMR'], marketTier:'elite' }),
  R(['Wataru Endo','Endo'], 'DMC', 'MID', 148, 148, 52, 'rotation', 10_000_000, { secondaryPositions:['DC','MC'] }),
  R(['James McConnell','McConnell'], 'DMC', 'MID', 141, 169, 42, 'development', 16_000_000, { secondaryPositions:['MC'] }),
  R(['Trey Nyoni','Nyoni'], 'MC', 'MID', 144, 181, 60, 'elite-prospect', 28_000_000, { secondaryPositions:['AMC'] }),

  // Attackers
  R(['Alexander Isak','Isak'], 'ST', 'ATT', 175, 177, 99, 'global-superstar', 125_000_000, { marketTier:'world-icon' }),
  R(['Bradley Barcola','Barcola'], 'AML', 'ATT', 167, 175, 92, 'key-player', 90_000_000, { secondaryPositions:['AMR','ST'], forceClub:true, shirtNumber:29, marketTier:'elite' }),
  R(['Hugo Ekitike','Ekitike'], 'ST', 'ATT', 164, 176, 89, 'key-player', 78_000_000, { secondaryPositions:['AML'] }),
  R(['Cody Gakpo','Gakpo'], 'AML', 'ATT', 162, 165, 86, 'first-team', 60_000_000, { secondaryPositions:['ST','AMC'] }),
  R(['Federico Chiesa','Chiesa'], 'AMR', 'ATT', 157, 160, 63, 'rotation', 28_000_000, { secondaryPositions:['AML','ST'] }),
  R(['Victor Munoz','Víctor Muñoz','Munoz','Muñoz'], 'AMR', 'ATT', 154, 174, 72, 'first-team-development', 42_000_000, { secondaryPositions:['AML','AMC'], forceClub:true, shirtNumber:23 }),
  R(['Rio Ngumoha','Ngumoha'], 'AML', 'ATT', 148, 185, 66, 'elite-prospect', 35_000_000, { secondaryPositions:['AMR'] }),
  R(['Jayden Danns','Danns'], 'ST', 'ATT', 138, 169, 37, 'development', 12_000_000)
];

export const CHELSEA_AUDIT = [
  // Goalkeepers
  R(['Emiliano Martinez','Emiliano Martínez','E. Martinez'], 'GK', 'GK', 165, 165, 90, 'key-player', 32_000_000, { forceClub:true }),
  R(['Teddy Sharman-Lowe','Sharman-Lowe'], 'GK', 'GK', 136, 160, 35, 'backup-development', 8_000_000),
  R(['Gabriel Slonina','Gaga Slonina','Slonina'], 'GK', 'GK', 139, 168, 38, 'development-goalkeeper', 10_000_000),
  R(['Mike Penders','Penders'], 'GK', 'GK', 149, 179, 58, 'elite-prospect', 25_000_000),

  // Defenders
  R(['Reece James','James'], 'DR', 'DEF', 165, 168, 91, 'key-player', 55_000_000, { secondaryPositions:['WBR','DMC'] }),
  R(['Levi Colwill','Colwill'], 'DC', 'DEF', 164, 173, 90, 'key-player', 65_000_000, { secondaryPositions:['DL'] }),
  R(['Wesley Fofana','Fofana'], 'DC', 'DEF', 159, 166, 78, 'first-team', 40_000_000, { secondaryPositions:['DR'] }),
  R(['Maxence Lacroix','Lacroix'], 'DC', 'DEF', 161, 164, 84, 'first-team', 45_000_000, { forceClub:true }),
  R(['Malo Gusto','Gusto'], 'DR', 'DEF', 159, 170, 78, 'rotation-first-team', 45_000_000, { secondaryPositions:['WBR'] }),
  R(['Valentin Barco','Barco'], 'DL', 'DEF', 155, 172, 74, 'rotation-first-team', 40_000_000, { secondaryPositions:['WBL','MC'], forceClub:true }),
  R(['Pep Chavarria','Josep Chavarria','Chavarria','Chavarría'], 'DL', 'DEF', 151, 159, 62, 'rotation', 25_000_000, { secondaryPositions:['WBL'], forceClub:true }),
  R(['Jorrel Hato','Hato'], 'DC', 'DEF', 159, 181, 82, 'first-team-development', 65_000_000, { secondaryPositions:['DL'] }),
  R(['Josh Acheampong','Acheampong'], 'DC', 'DEF', 148, 179, 63, 'elite-prospect', 32_000_000, { secondaryPositions:['DR'] }),
  R(['Marco Palestra','Palestra'], 'DR', 'DEF', 152, 175, 68, 'first-team-development', 35_000_000, { secondaryPositions:['WBR'], forceClub:true }),
  R(['Aaron Anselmino','Anselmino'], 'DC', 'DEF', 147, 178, 55, 'elite-prospect', 30_000_000),

  // Midfielders
  R(['Moises Caicedo','Moisés Caicedo','Caicedo'], 'DMC', 'MID', 173, 179, 100, 'cornerstone', 125_000_000, { secondaryPositions:['MC'], marketTier:'world-icon' }),
  R(['Cole Palmer','Palmer'], 'AMC', 'MID', 178, 186, 100, 'global-superstar', 145_000_000, { secondaryPositions:['AMR'], marketTier:'world-icon' }),
  R(['Morgan Rogers','Rogers'], 'AMC', 'MID', 166, 175, 92, 'key-player', 90_000_000, { secondaryPositions:['AML','AMR'], forceClub:true, marketTier:'elite' }),
  R(['Romeo Lavia','Lavia'], 'DMC', 'MID', 156, 174, 73, 'rotation-first-team', 42_000_000, { secondaryPositions:['MC'] }),
  R(['Jordan Henderson','Henderson'], 'DMC', 'MID', 150, 150, 62, 'rotation-leader', 6_000_000, { secondaryPositions:['MC'], forceClub:true, firstName:'jordan' }),
  R(['Kendry Paez','Kendry Páez','Paez','Páez'], 'AMC', 'MID', 150, 183, 58, 'elite-prospect', 32_000_000, { secondaryPositions:['AMR'], forceClub:true }),

  // Attackers
  R(['Joao Pedro','João Pedro'], 'ST', 'ATT', 166, 171, 93, 'key-player', 78_000_000, { secondaryPositions:['AMC','AML'] }),
  R(['Pedro Neto','Neto'], 'AMR', 'ATT', 164, 166, 88, 'key-player', 62_000_000, { secondaryPositions:['AML'] }),
  R(['Estevao','Estêvão','Estevao Willian','Estêvão Willian'], 'AMR', 'ATT', 163, 186, 91, 'key-development', 95_000_000, { secondaryPositions:['AMC','AML'], marketTier:'elite' }),
  R(['Jamie Gittens','Bynoe-Gittens','Gittens'], 'AML', 'ATT', 159, 179, 81, 'first-team-development', 62_000_000, { secondaryPositions:['AMR'] }),
  R(['Emmanuel Emegha','Emegha'], 'ST', 'ATT', 159, 173, 78, 'first-team', 48_000_000, { forceClub:true }),
  R(['Danny Welbeck','Welbeck'], 'ST', 'ATT', 149, 149, 55, 'rotation', 4_000_000, { secondaryPositions:['AML'], forceClub:true }),
  R(['Geovany Quenda','Quenda'], 'AMR', 'ATT', 156, 182, 74, 'first-team-development', 55_000_000, { secondaryPositions:['WBR','AML'], forceClub:true })
];

export const TOTTENHAM_AUDIT = [
  // Goalkeepers
  R(['Antonin Kinsky','Kinsky'], 'GK', 'GK', 150, 169, 74, 'first-team', 28_000_000),
  R(['Martin Dubravka','Dúbravka','Dubravka'], 'GK', 'GK', 146, 146, 58, 'rotation', 4_000_000, { forceClub:true }),
  R(['Brandon Austin','Austin'], 'GK', 'GK', 126, 134, 25, 'backup', 2_000_000),
  R(['Jacob Knightbridge','Knightbridge'], 'GK', 'GK', 121, 153, 18, 'development-goalkeeper', 2_000_000),

  // Defenders
  R(['Micky van de Ven','Van de Ven'], 'DC', 'DEF', 165, 173, 96, 'cornerstone', 78_000_000, { secondaryPositions:['DL'], marketTier:'elite' }),
  R(['Pedro Porro','Porro'], 'DR', 'DEF', 163, 167, 91, 'key-player', 58_000_000, { secondaryPositions:['WBR'] }),
  R(['Destiny Udogie','Udogie'], 'DL', 'DEF', 161, 175, 89, 'key-player', 62_000_000, { secondaryPositions:['WBL'] }),
  R(['Jan Paul van Hecke','van Hecke'], 'DC', 'DEF', 161, 165, 87, 'first-team', 48_000_000, { forceClub:true }),
  R(['Marcos Senesi','Senesi'], 'DC', 'DEF', 159, 161, 82, 'first-team', 38_000_000, { forceClub:true }),
  R(['Tosin Adarabioyo','Adarabioyo','Tosin'], 'DC', 'DEF', 155, 155, 76, 'rotation-first-team', 24_000_000, { forceClub:true }),
  R(['Andy Robertson','Andrew Robertson','Robertson'], 'DL', 'DEF', 157, 157, 79, 'first-team', 20_000_000, { secondaryPositions:['WBL'], forceClub:true }),
  R(['Ben Davies','Davies'], 'DC', 'DEF', 145, 145, 48, 'rotation', 6_000_000, { secondaryPositions:['DL'] }),
  R(['Archie Gray','Gray'], 'DMC', 'MID', 158, 182, 88, 'key-development', 72_000_000, { secondaryPositions:['DC','MC','DR'] }),

  // Midfielders
  R(['Sandro Tonali','Tonali'], 'DMC', 'MID', 171, 173, 98, 'cornerstone', 95_000_000, { secondaryPositions:['MC'], forceClub:true, marketTier:'elite' }),
  R(['Xavi Simons','Simons'], 'AMC', 'MID', 167, 180, 96, 'cornerstone', 95_000_000, { secondaryPositions:['AML','AMR'], marketTier:'elite' }),
  R(['Dejan Kulusevski','Kulusevski'], 'AMC', 'MID', 164, 169, 91, 'key-player', 68_000_000, { secondaryPositions:['AMR'] }),
  R(['Mohammed Kudus','Kudus'], 'AMR', 'ATT', 165, 170, 92, 'key-player', 72_000_000, { secondaryPositions:['AMC','ST'] }),
  R(['James Maddison','Maddison'], 'AMC', 'MID', 160, 161, 82, 'first-team', 38_000_000, { secondaryPositions:['MC'] }),
  R(['Conor Gallagher','Gallagher'], 'MC', 'MID', 160, 163, 84, 'first-team', 45_000_000, { secondaryPositions:['AMC'], forceClub:true }),
  R(['Mateus Fernandes','Fernandes'], 'MC', 'MID', 159, 171, 82, 'first-team-development', 52_000_000, { secondaryPositions:['DMC'], firstName:'mateus' }),
  R(['Rodrigo Bentancur','Bentancur'], 'MC', 'MID', 158, 161, 76, 'rotation-first-team', 30_000_000, { secondaryPositions:['DMC'] }),
  R(['Lucas Bergvall','Bergvall'], 'MC', 'MID', 157, 180, 82, 'first-team-development', 58_000_000, { secondaryPositions:['AMC'] }),

  // Attackers
  R(['Dominic Solanke','Solanke'], 'ST', 'ATT', 162, 164, 87, 'key-player', 55_000_000),
  R(['Omar Marmoush','Marmoush'], 'ST', 'ATT', 165, 169, 91, 'key-player', 70_000_000, { secondaryPositions:['AML','AMC'], forceClub:true }),
  R(['Savinho','Sávio','Savio'], 'AMR', 'ATT', 163, 173, 88, 'key-player', 68_000_000, { secondaryPositions:['AML'], forceClub:true }),
  R(['Mykhailo Mudryk','Mudryk'], 'AML', 'ATT', 155, 169, 72, 'rotation-first-team', 38_000_000, { secondaryPositions:['AMR'], forceClub:true }),
  R(['Wilson Odobert','Odobert'], 'AML', 'ATT', 152, 172, 68, 'rotation-development', 34_000_000, { secondaryPositions:['AMR'] }),
  R(['Mathys Tel','Tel'], 'ST', 'ATT', 157, 180, 80, 'first-team-development', 58_000_000, { secondaryPositions:['AML'] })
];

export const NEWCASTLE_AUDIT = [
  // Goalkeepers
  R(['Nick Pope','Pope'], 'GK', 'GK', 154, 155, 69, 'first-team', 16_000_000),
  R(['Lukas Hornicek','Lukáš Horníček','Hornicek','Horníček'], 'GK', 'GK', 148, 166, 72, 'first-team-development', 22_000_000, { forceClub:true }),
  R(['Mark Gillespie','Gillespie'], 'GK', 'GK', 130, 130, 25, 'backup', 1_000_000),
  R(['Ewen Jaouen','Jaouen'], 'GK', 'GK', 136, 168, 35, 'development-goalkeeper', 8_000_000, { forceClub:true }),

  // Defenders
  R(['Sven Botman','Botman'], 'DC', 'DEF', 163, 168, 94, 'cornerstone', 52_000_000, { marketTier:'star' }),
  R(['Malick Thiaw','Thiaw'], 'DC', 'DEF', 161, 170, 90, 'key-player', 52_000_000),
  R(['Lewis Hall','Hall'], 'DL', 'DEF', 160, 174, 89, 'key-player', 58_000_000, { secondaryPositions:['WBL','MC'], firstName:'lewis' }),
  R(['Tino Livramento','Valentino Livramento','Livramento'], 'DR', 'DEF', 161, 174, 90, 'key-player', 62_000_000, { secondaryPositions:['DL','WBR'] }),
  R(['Amar Dedic','Amar Dedić','Dedic','Dedić'], 'DR', 'DEF', 157, 169, 85, 'first-team', 42_000_000, { secondaryPositions:['WBR','DL'], forceClub:true }),
  R(['Fabian Schar','Fabian Schär','Schar','Schär'], 'DC', 'DEF', 151, 151, 64, 'rotation', 10_000_000),
  R(['Dan Burn','Burn'], 'DC', 'DEF', 149, 149, 60, 'rotation', 8_000_000, { secondaryPositions:['DL'] }),

  // Midfielders
  R(['Nico Gonzalez','Nico González','Gonzalez','González'], 'DMC', 'MID', 160, 166, 89, 'key-player', 52_000_000, { secondaryPositions:['MC'], forceClub:true, firstName:'nico' }),
  R(['Joelinton'], 'MC', 'MID', 158, 159, 82, 'first-team', 30_000_000, { secondaryPositions:['AML','DMC'] }),
  R(['Jacob Ramsey','Ramsey'], 'MC', 'MID', 159, 168, 84, 'first-team', 45_000_000, { secondaryPositions:['AML'] }),
  R(['Joe Willock','Willock'], 'MC', 'MID', 153, 158, 67, 'rotation', 25_000_000, { secondaryPositions:['AMC'] }),
  R(['Lewis Miley','Miley'], 'MC', 'MID', 155, 179, 78, 'first-team-development', 48_000_000, { secondaryPositions:['DMC'] }),

  // Attackers
  R(['Yoane Wissa','Wissa'], 'ST', 'ATT', 160, 161, 90, 'key-player', 38_000_000, { secondaryPositions:['AML'] }),
  R(['Anthony Elanga','Elanga'], 'AMR', 'ATT', 160, 166, 88, 'key-player', 48_000_000, { secondaryPositions:['AML'] }),
  R(['Harvey Barnes','Barnes'], 'AML', 'ATT', 157, 159, 75, 'rotation-first-team', 32_000_000),
  R(['William Osula','Will Osula','Osula'], 'ST', 'ATT', 147, 168, 61, 'first-team-development', 24_000_000),
  R(['Jacob Murphy','Murphy'], 'AMR', 'ATT', 150, 151, 62, 'rotation', 14_000_000),
  R(['Bazoumana Toure','Bazoumana Touré','Toure','Touré'], 'AML', 'ATT', 150, 181, 72, 'elite-prospect', 38_000_000, { secondaryPositions:['AMR'], forceClub:true }),
  R(['Matias Fernandez-Pardo','Matias Fernandez Pardo','Fernandez-Pardo'], 'AML', 'ATT', 151, 174, 68, 'first-team-development', 34_000_000, { secondaryPositions:['ST'], forceClub:true })
];

const CLUB_AUDITS = [
  { clubId:LIVERPOOL_ID, clubName:'Liverpool', key:'liverpool', records:LIVERPOOL_AUDIT },
  { clubId:CHELSEA_ID, clubName:'Chelsea', key:'chelsea', records:CHELSEA_AUDIT },
  { clubId:TOTTENHAM_ID, clubName:'Tottenham Hotspur', key:'tottenham', records:TOTTENHAM_AUDIT },
  { clubId:NEWCASTLE_ID, clubName:'Newcastle United', key:'newcastle', records:NEWCASTLE_AUDIT }
];

// Confirmed moves needed to clean stale ownership in the imported snapshot.
// These records are processed after the four target squads, so a player cannot
// remain selectable at his old club simply because the static import predates
// the final summer business.
const CONFIRMED_MOVES_OUT = [
  { fromClubId:LIVERPOOL_ID, aliases:['Mohamed Salah','Salah'], externalClub:'Trabzonspor' },
  { fromClubId:LIVERPOOL_ID, aliases:['Ibrahima Konate','Konaté','Konate'], externalClub:'Free Agent' },

  { fromClubId:TOTTENHAM_ID, aliases:['Cristian Romero','Romero'], externalClub:'Atletico Madrid' },
  { fromClubId:TOTTENHAM_ID, aliases:['Guglielmo Vicario','Vicario'], externalClub:'Juventus', loan:true },
  { fromClubId:TOTTENHAM_ID, aliases:['Pape Matar Sarr','Pape Sarr','Sarr'], externalClub:'Juventus', loan:true },
  { fromClubId:TOTTENHAM_ID, aliases:['Brennan Johnson','Johnson'], externalClub:'Crystal Palace' },

  { fromClubId:NEWCASTLE_ID, aliases:['Anthony Gordon','Gordon'], externalClub:'Barcelona' },
  { fromClubId:NEWCASTLE_ID, aliases:['Nick Woltemade','Woltemade'], externalClub:'Juventus', loan:true },
  { fromClubId:NEWCASTLE_ID, aliases:['Aaron Ramsdale','Ramsdale'], externalClub:'Southampton' },
  { fromClubId:NEWCASTLE_ID, aliases:['Kieran Trippier','Trippier'], externalClub:'Wolverhampton Wanderers' },
  { fromClubId:NEWCASTLE_ID, aliases:['Emil Krafth','Krafth'], externalClub:'Free Agent' }
];

const WORLD_MOVES = [
  R(['Bruno Guimaraes','Bruno Guimarães','Guimaraes','Guimarães'], 'MC', 'MID', 170, 172, 97, 'cornerstone', 82_000_000, {
    secondaryPositions:['DMC'], forceClub:true, targetClubId:ARSENAL_ID, targetClubName:'Arsenal', firstName:'bruno', shirtNumber:39, marketTier:'elite'
  })
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
  const name = normalise(player.name);
  const lastName = normalise(player.lastName);
  const aliasMatch = record.aliases.some(alias => {
    const token = normalise(alias);
    return token && (name === token || lastName === token || name.endsWith(` ${token}`));
  });
  if (!aliasMatch) return false;
  if (record.firstName && !playerFirstToken(player).startsWith(normalise(record.firstName))) return false;
  return true;
}

function slug(value) {
  return normalise(value).replaceAll(' ', '-');
}

function externalId(name) {
  return `flm-external-${slug(name)}`;
}

function setOwnership(player, clubId, clubName) {
  if (player.clubId !== clubId) player.previousClubId = player.clubId;
  player.clubId = clubId;
  player.currentClubName = clubName;
  player.parentClubId = null;
  player.loanClubName = null;
  player.unavailableInPremierLeagueDatabase = false;
  player.isPlaceholder = false;
}

function applyRecord(player, record, clubId, clubName) {
  setOwnership(player, clubId, clubName);
  player.primaryPosition = record.primaryPosition;
  player.secondaryPositions = [...(record.secondaryPositions || [])];
  player.positionGroup = record.positionGroup;
  player.currentAbility = record.ca;
  player.potentialAbility = record.pa;
  player.potential = Math.round(record.pa / 2);
  if (record.shirtNumber != null) player.shirtNumber = record.shirtNumber;
  player.auditedMarketValue = record.value;
  player.marketValue = Math.max(Number(player.marketValue || 0), record.value);
  player.importanceScore = record.importance;
  player.squadImportance = record.role;
  player.audit = {
    reviewDate: REVIEW_DATE,
    club: clubName,
    importance: record.importance,
    role: record.role,
    marketTier: record.marketTier || null,
    valueFloor: record.value,
    source: 'official-post-window-squad-plus-football-lab-calibration'
  };
  player.contract ||= {};
  player.contract.squadStatus = record.role;
  player.dataQuality = {
    ...(player.dataQuality || {}),
    premierLeagueAudit: `reviewed-${REVIEW_DATE}-v3`,
    positionDetail: 'curated-real-world-review',
    ratingEngine: 'Football Lab audited CA/PA calibration',
    confidence: /prospect|development|academy/.test(record.role) ? 'medium' : 'high'
  };
  return player;
}

function syntheticPlayer(record, clubId, clubName) {
  const name = record.aliases[0];
  const parts = name.split(' ');
  return applyRecord({
    id: `flm-audit-v3-${slug(clubName)}-${slug(name)}`,
    externalIds: { curatedAuditV3: `2026-09-05:${clubName}:${name}` },
    name,
    firstName: parts.slice(0, -1).join(' ') || parts[0],
    lastName: parts.at(-1) || name,
    dateOfBirth: null,
    reportedAge: record.age ?? null,
    nationalityCode: null,
    clubId,
    shirtNumber: record.shirtNumber ?? null,
    positionGroup: record.positionGroup,
    primaryPosition: record.primaryPosition,
    secondaryPositions: [...(record.secondaryPositions || [])],
    currentAbility: record.ca,
    potentialAbility: record.pa,
    potential: Math.round(record.pa / 2),
    marketValue: record.value,
    wageEstimate: null,
    contract: { expires:null, status:'active' },
    isPlaceholder: false,
    dataQuality: { source:'curated-audit-v3', confidence:'high' }
  }, record, clubId, clubName);
}

function moveOut(player, record) {
  const fromClubId = record.fromClubId || player.clubId;
  player.previousClubId = fromClubId;
  player.parentClubId = record.loan ? fromClubId : null;
  player.loanClubName = record.loan ? record.externalClub : null;
  player.clubId = externalId(record.externalClub);
  player.currentClubName = record.externalClub;
  player.unavailableInPremierLeagueDatabase = true;
  player.isPlaceholder = true;
  player.importanceScore = 0;
  player.squadImportance = record.loan ? 'loan-out' : 'departed';
  player.audit = {
    reviewDate: REVIEW_DATE,
    club: record.externalClub,
    importance: 0,
    role: record.loan ? 'loan-out' : 'departed',
    source: 'confirmed-2026-squad-movement'
  };
}

function findRecordPlayer(db, record, clubId) {
  const atClub = db.players.find(player => player.clubId === clubId && matches(player, record));
  if (atClub) return atClub;
  if (record.forceClub) return db.players.find(player => matches(player, record));
  return null;
}

function applyClubAudit(db, audit) {
  const matchedIds = new Set();
  const syntheticIds = [];

  for (const record of audit.records) {
    let player = findRecordPlayer(db, record, audit.clubId);
    if (!player) {
      player = syntheticPlayer(record, audit.clubId, audit.clubName);
      db.players.push(player);
      syntheticIds.push(player.id);
    } else {
      applyRecord(player, record, audit.clubId, audit.clubName);
    }
    matchedIds.add(player.id);
  }

  // Any remaining current-club records are retained as low-importance academy/depth
  // rather than silently deleted. Senior departures that materially affect the game
  // are handled explicitly by CONFIRMED_MOVES_OUT below.
  const unmatched = db.players.filter(player => player.clubId === audit.clubId && !matchedIds.has(player.id) && !player.isPlaceholder);
  for (const player of unmatched) {
    if (player.importanceScore == null || player.importanceScore > 20) player.importanceScore = 15;
    player.squadImportance = 'academy-depth-unreviewed';
    player.audit = {
      reviewDate: REVIEW_DATE,
      club: audit.clubName,
      importance: 15,
      role: 'academy-depth-unreviewed',
      source: 'database-depth-outside-curated-first-team-list'
    };
  }

  return {
    reviewDate: REVIEW_DATE,
    officialFirstTeamRecords: audit.records.length,
    reviewedRuntimePlayers: matchedIds.size,
    syntheticPlayersAdded: syntheticIds,
    unmatchedDepthPlayers: unmatched.map(player => player.name),
    methodology: 'post-window roster + real position + CA/PA + importance + gameplay market-value floor'
  };
}

function processConfirmedMoves(db) {
  const moved = [];
  for (const record of CONFIRMED_MOVES_OUT) {
    const player = db.players.find(item => item.clubId === record.fromClubId && matches(item, record));
    if (!player) continue;
    moveOut(player, record);
    moved.push(player.name);
  }
  return moved;
}

function processWorldMoves(db) {
  const moved = [];
  for (const record of WORLD_MOVES) {
    let player = db.players.find(item => matches(item, record));
    if (!player) {
      player = syntheticPlayer(record, record.targetClubId, record.targetClubName);
      db.players.push(player);
    } else {
      applyRecord(player, record, record.targetClubId, record.targetClubName);
    }
    moved.push(player.name);
  }
  return moved;
}

function refreshClubSquadIds(db) {
  if (!Array.isArray(db.clubs)) return;
  for (const club of db.clubs) {
    if (!CLUB_AUDITS.some(audit => audit.clubId === club.id) && club.id !== ARSENAL_ID) continue;
    if ('squadPlayerIds' in club) {
      club.squadPlayerIds = db.players
        .filter(player => player.clubId === club.id && !player.isPlaceholder)
        .map(player => player.id);
    }
  }
}

export function applyPremierLeagueAuditV3(db) {
  if (!db?.players || db.__premierLeagueAuditV3 === REVIEW_DATE) return db;
  db.playerAudit ||= {};

  // World moves first removes stale ownership; club audits then restore/curate the
  // exact current squads, including players moved out by an earlier runtime layer.
  db.playerAudit.v3WorldMoves = processWorldMoves(db);
  for (const audit of CLUB_AUDITS) {
    db.playerAudit[audit.key] = applyClubAudit(db, audit);
  }
  db.playerAudit.v3ConfirmedDepartures = processConfirmedMoves(db);
  refreshClubSquadIds(db);
  db.__premierLeagueAuditV3 = REVIEW_DATE;
  return db;
}

if (typeof window !== 'undefined') {
  const manager = window.FLMManager;
  if (manager?.loadDatabase) {
    const baseLoadDatabase = manager.loadDatabase.bind(manager);
    manager.loadDatabase = async (...args) => applyPremierLeagueAuditV3(await baseLoadDatabase(...args));
    manager.loadDatabase().catch(error => console.error('Premier League player audit v3 failed', error));
  }
  window.FLMPlayerAuditV3 = {
    version: 3,
    reviewDate: REVIEW_DATE,
    liverpool: LIVERPOOL_AUDIT.map(record => ({ ...record, aliases:[...record.aliases] })),
    chelsea: CHELSEA_AUDIT.map(record => ({ ...record, aliases:[...record.aliases] })),
    tottenham: TOTTENHAM_AUDIT.map(record => ({ ...record, aliases:[...record.aliases] })),
    newcastle: NEWCASTLE_AUDIT.map(record => ({ ...record, aliases:[...record.aliases] })),
    applyPremierLeagueAuditV3
  };
}
