export const NEWS_SCHEMA_VERSION = 1;
export const NEWS_CATEGORIES = ['All', 'Messages', 'Competitions', 'Injuries & Bans', 'Board', 'Transfers'];

const clone = value => JSON.parse(JSON.stringify(value));

function clubById(db, id) {
  return db.clubs.find(club => club.id === id);
}

function playerById(db, id) {
  return db.players.find(player => player.id === id);
}

function clubName(db, id) {
  const club = clubById(db, id);
  return club?.shortName || club?.name || 'Unknown club';
}

function playableClubs(db) {
  const configured = new Set(db.metadata?.playableDemo?.clubIds || []);
  const selected = db.clubs.filter(club => configured.has(club.id) && !club.isPlaceholder);
  return selected.length ? selected : db.clubs.filter(club => !club.isPlaceholder).slice(0, 8);
}

function expectationFor(career, db) {
  const ranked = playableClubs(db).sort((a, b) => (b.reputation || 0) - (a.reputation || 0));
  const rank = ranked.findIndex(club => club.id === career.clubId) + 1;
  if (rank > 0 && rank <= 2) return 'challenge for the title';
  if (rank > 0 && rank <= 4) return 'finish in the top half and remain in the European places conversation';
  return 'build a competitive side and finish as high as possible';
}

function labelForRound(round, period = 'PM') {
  return round > 0 ? `R${round} ${period}` : 'PRE-SEASON';
}

function makeItem(career, {
  key,
  round = 0,
  period = 'PM',
  category,
  source,
  title,
  body,
  priority = 'normal',
  relatedClubId = null,
  relatedPlayerId = null,
  order = 0
}) {
  return {
    id: `news-${career.id}-${key}`,
    key,
    round,
    period,
    dateLabel: labelForRound(round, period),
    category,
    source,
    title,
    body,
    priority,
    relatedClubId,
    relatedPlayerId,
    order,
    read: false
  };
}

function pushUnique(career, item) {
  if (career.news.items.some(existing => existing.id === item.id)) return false;
  career.news.items.push(item);
  return true;
}

function initialiseState(career) {
  let changed = false;
  if (!career.news || typeof career.news !== 'object') {
    career.news = { schemaVersion: NEWS_SCHEMA_VERSION, items: [], generatedRounds: [] };
    changed = true;
  }
  if (!Array.isArray(career.news.items)) { career.news.items = []; changed = true; }
  if (!Array.isArray(career.news.generatedRounds)) { career.news.generatedRounds = []; changed = true; }
  if (career.news.schemaVersion !== NEWS_SCHEMA_VERSION) { career.news.schemaVersion = NEWS_SCHEMA_VERSION; changed = true; }
  return changed;
}

function addInitialNews(career, db) {
  const club = clubById(db, career.clubId);
  const manager = career.managerName || 'Manager';
  const expectation = expectationFor(career, db);
  let changed = false;

  changed = pushUnique(career, makeItem(career, {
    key: 'welcome', category: 'Messages', source: 'Club Secretary', period: 'AM', order: 10,
    title: `Welcome to ${club?.name || 'the club'}`,
    body: `${manager}, you are now in control of ${club?.name || 'the club'}. The board expects decisive squad management, a clear tactical identity and steady progress through the ${career.season || 'current'} season.`,
    priority: 'important', relatedClubId: career.clubId
  })) || changed;

  changed = pushUnique(career, makeItem(career, {
    key: 'board-expectation', category: 'Board', source: 'Board of Directors', period: 'AM', order: 20,
    title: 'Board sets season expectations',
    body: `The board wants the team to ${expectation}. Results, league position and the manner of performances will shape board confidence as the season develops.`,
    priority: 'important', relatedClubId: career.clubId
  })) || changed;

  changed = pushUnique(career, makeItem(career, {
    key: 'competition-briefing', category: 'Competitions', source: 'Competition Office', period: 'PM', order: 30,
    title: `${career.competitionName || 'Competition'} fixtures confirmed`,
    body: `${career.fixtures?.length || 0} rounds are scheduled. Every result affects the live table, with goal difference used as the first tie-break after points.`,
    relatedClubId: career.clubId
  })) || changed;

  return changed;
}

function userResultForRound(career, roundIndex) {
  const fixtures = career.fixtures?.[roundIndex] || [];
  return fixtures.find(fixture => fixture.homeClubId === career.clubId || fixture.awayClubId === career.clubId) || null;
}

function resultText(result, career, db) {
  const atHome = result.homeClubId === career.clubId;
  const gf = atHome ? result.homeGoals : result.awayGoals;
  const ga = atHome ? result.awayGoals : result.homeGoals;
  const outcome = gf > ga ? 'won' : gf < ga ? 'lost' : 'drew';
  return `${clubName(db, result.homeClubId)} ${result.homeGoals}–${result.awayGoals} ${clubName(db, result.awayClubId)}. ${clubName(db, career.clubId)} ${outcome} the match ${gf}–${ga}.`;
}

function addRoundNews(career, db, roundIndex) {
  const result = userResultForRound(career, roundIndex);
  if (!result?.played) return false;
  const round = roundIndex + 1;
  let changed = false;

  changed = pushUnique(career, makeItem(career, {
    key: `match-r${round}`, round, category: 'Competitions', source: 'Match Report', order: round * 100 + 10,
    title: `${clubName(db, result.homeClubId)} ${result.homeGoals}–${result.awayGoals} ${clubName(db, result.awayClubId)}`,
    body: resultText(result, career, db),
    priority: 'important', relatedClubId: career.clubId
  })) || changed;

  const userGoals = (result.events || []).filter(event => event.type === 'goal' && event.clubId === career.clubId && event.playerId);
  if (userGoals.length) {
    const counts = new Map();
    userGoals.forEach(event => counts.set(event.playerId, (counts.get(event.playerId) || 0) + 1));
    const [playerId, goals] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    const scorer = playerById(db, playerId);
    changed = pushUnique(career, makeItem(career, {
      key: `player-r${round}-${playerId}`, round, category: 'Messages', source: 'Assistant Manager', order: round * 100 + 20,
      title: `${scorer?.name || 'A key player'} catches the eye`,
      body: `${scorer?.name || 'The player'} scored ${goals} ${goals === 1 ? 'goal' : 'goals'} in Round ${round}. The performance will be reflected in the player's season record and form conversation.`,
      relatedPlayerId: playerId, relatedClubId: career.clubId
    })) || changed;
  }

  for (const [index, event] of (result.events || []).filter(event => event.type === 'injury' || event.type === 'red').entries()) {
    const person = playerById(db, event.playerId);
    const injury = event.type === 'injury';
    changed = pushUnique(career, makeItem(career, {
      key: `${event.type}-r${round}-${event.playerId || index}`, round,
      category: 'Injuries & Bans', source: injury ? 'Medical Team' : 'Disciplinary Update', order: round * 100 + 30 + index,
      title: injury ? `${person?.name || 'Player'} suffers match injury` : `${person?.name || 'Player'} sent off`,
      body: injury
        ? `${person?.name || 'A player'} was forced into an injury incident during Round ${round}. The medical team will continue to assess availability.`
        : `${person?.name || 'A player'} was dismissed during Round ${round}. The incident has been logged in the career record and disciplinary news feed.`,
      priority: 'important', relatedPlayerId: event.playerId || null, relatedClubId: event.clubId || null
    })) || changed;
  }

  const otherResults = (career.fixtures?.[roundIndex] || []).filter(fixture => fixture.played && fixture !== result);
  if (otherResults.length) {
    const headline = [...otherResults].sort((a, b) => Math.abs((b.homeGoals || 0) - (b.awayGoals || 0)) - Math.abs((a.homeGoals || 0) - (a.awayGoals || 0)))[0];
    changed = pushUnique(career, makeItem(career, {
      key: `roundup-r${round}`, round, category: 'Competitions', source: 'Competition Desk', order: round * 100 + 40,
      title: `Round ${round} competition roundup`,
      body: `Elsewhere, ${clubName(db, headline.homeClubId)} ${headline.homeGoals}–${headline.awayGoals} ${clubName(db, headline.awayClubId)}. The result has been applied to the same live table as your fixture.`
    })) || changed;
  }

  if (!career.news.generatedRounds.includes(round)) {
    career.news.generatedRounds.push(round);
    changed = true;
  }
  return changed;
}

function addCurrentBoardUpdate(career, db) {
  if (!career.roundIndex) return false;
  const sorted = [...(career.table || [])].sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference || b.goalsFor - a.goalsFor || a.clubId.localeCompare(b.clubId));
  const row = sorted.find(item => item.clubId === career.clubId);
  const position = sorted.indexOf(row) + 1;
  const latest = userResultForRound(career, career.roundIndex - 1);
  if (!row || !latest) return false;
  const atHome = latest.homeClubId === career.clubId;
  const gf = atHome ? latest.homeGoals : latest.awayGoals;
  const ga = atHome ? latest.awayGoals : latest.homeGoals;
  const mood = gf > ga ? 'positive after the latest win' : gf < ga ? 'under review after the latest defeat' : 'steady after the latest draw';

  return pushUnique(career, makeItem(career, {
    key: `board-r${career.roundIndex}`, round: career.roundIndex, category: 'Board', source: 'Board of Directors', order: career.roundIndex * 100 + 90,
    title: 'Board Confidence Update',
    body: `The board is ${mood}. ${clubName(db, career.clubId)} currently sits ${position}${position === 1 ? 'st' : position === 2 ? 'nd' : position === 3 ? 'rd' : 'th'} with ${row.points} points and a goal difference of ${row.goalDifference > 0 ? '+' : ''}${row.goalDifference}.`,
    relatedClubId: career.clubId
  }));
}

export function syncCareerNews(career, db) {
  if (!career || !db) return false;
  let changed = initialiseState(career);
  changed = addInitialNews(career, db) || changed;
  for (let roundIndex = 0; roundIndex < (career.roundIndex || 0); roundIndex += 1) {
    if (!career.news.generatedRounds.includes(roundIndex + 1)) changed = addRoundNews(career, db, roundIndex) || changed;
  }
  changed = addCurrentBoardUpdate(career, db) || changed;
  return changed;
}

export function getNewsItems(career, category = 'All') {
  const items = Array.isArray(career?.news?.items) ? career.news.items : [];
  return items
    .filter(item => category === 'All' || item.category === category)
    .sort((a, b) => (b.order || 0) - (a.order || 0) || a.id.localeCompare(b.id));
}

export function getUnreadNewsCount(career, category = 'All') {
  return getNewsItems(career, category).filter(item => !item.read).length;
}

export function markNewsRead(career, id) {
  const item = career?.news?.items?.find(entry => entry.id === id);
  if (!item || item.read) return false;
  item.read = true;
  return true;
}

export function markAllNewsRead(career, category = 'All') {
  let changed = false;
  for (const item of career?.news?.items || []) {
    if ((category === 'All' || item.category === category) && !item.read) {
      item.read = true;
      changed = true;
    }
  }
  return changed;
}

export function cloneNewsState(career) {
  return clone(career?.news || { schemaVersion: NEWS_SCHEMA_VERSION, items: [], generatedRounds: [] });
}
