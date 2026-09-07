import { createCareer } from './manager-core.js';

function realClubs(db) {
  return (db?.clubs || []).filter(club => !club.isPlaceholder);
}

export function leagueForClub(db, clubId) {
  const club = realClubs(db).find(item => item.id === clubId);
  if (!club) throw new Error('Choose a real club from the football database.');
  if (!club.leagueId) throw new Error('The selected club is not assigned to a competition.');
  const league = (db?.leagues || []).find(item => item.id === club.leagueId);
  if (!league) throw new Error('The selected club competition is missing from leagues.json.');
  return league;
}

export function clubsForLeague(db, leagueId) {
  return realClubs(db).filter(club => club.leagueId === leagueId);
}

export function playableLeagues(db) {
  return (db?.leagues || []).filter(league => {
    const clubs = clubsForLeague(db, league.id);
    return clubs.length >= 4 && clubs.length % 2 === 0;
  });
}

export function createLeagueCareer({ clubId, db, seed = Date.now(), managerName = 'The Gaffer' }) {
  if (!db || !Array.isArray(db.clubs) || !Array.isArray(db.players) || !Array.isArray(db.leagues)) {
    throw new Error('A complete football database is required to start a league career.');
  }

  const league = leagueForClub(db, clubId);
  const clubs = clubsForLeague(db, league.id);
  if (clubs.length < 4 || clubs.length % 2 !== 0) {
    throw new Error(`${league.name} is not ready for a playable career.`);
  }

  const career = createCareer({ clubId, clubs, players: db.players, seed, managerName });
  return {
    ...career,
    leagueId: league.id,
    competitionId: league.id,
    competitionName: league.name,
    countryCode: league.countryCode || clubs.find(club => club.id === clubId)?.countryCode || null,
    season: league.season || career.season
  };
}
