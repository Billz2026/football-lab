import {
  NEWS_CATEGORIES,
  cloneNewsState,
  getNewsItems,
  getUnreadNewsCount,
  markAllNewsRead,
  markNewsRead,
  syncCareerNews as baseSyncCareerNews
} from './career-news-v046.js?v=0.4.6';

export { NEWS_CATEGORIES, cloneNewsState, getNewsItems, getUnreadNewsCount, markAllNewsRead, markNewsRead };

function clubName(db, id) {
  const club = db.clubs.find(item => item.id === id);
  return club?.shortName || club?.name || 'Unknown club';
}

function playerName(db, id) {
  return db.players.find(player => player.id === id)?.name || 'Player';
}

function pushUnique(career, item) {
  if (!career.news?.items || career.news.items.some(existing => existing.id === item.id)) return false;
  career.news.items.push(item);
  return true;
}

function makeItem(career, key, data) {
  return {
    id: `news-${career.id}-${key}`,
    key,
    round: 0,
    period: 'PM',
    dateLabel: data.dateLabel || 'PRE-SEASON',
    category: data.category,
    source: data.source,
    title: data.title,
    body: data.body,
    priority: data.priority || 'normal',
    relatedClubId: data.relatedClubId ?? career.clubId,
    relatedPlayerId: data.relatedPlayerId ?? null,
    order: data.order || 0,
    read: false
  };
}

function addPreseasonNews(career, db) {
  const preseason = career.preseason;
  if (!preseason || preseason.legacyBypass) return false;
  let changed = false;

  changed = pushUnique(career, makeItem(career, 'preseason-programme', {
    category: 'Competitions', source: 'Club Secretary', dateLabel: 'PRE-SEASON', order: 35,
    title: 'Pre-season programme confirmed',
    body: `${preseason.fixtures.length} friendlies have been arranged before the competitive season. Use the schedule to build fitness, match sharpness and tactical familiarity.`,
    priority: 'important'
  })) || changed;

  preseason.fixtures.forEach((fixture, index) => {
    if (!fixture.played) return;
    const userHome = fixture.homeClubId === career.clubId;
    const gf = userHome ? fixture.homeGoals : fixture.awayGoals;
    const ga = userHome ? fixture.awayGoals : fixture.homeGoals;
    changed = pushUnique(career, makeItem(career, `preseason-friendly-${index + 1}`, {
      category: 'Competitions', source: 'Match Report', dateLabel: `PS W${index + 1}`, order: 40 + index * 3,
      title: `${clubName(db, fixture.homeClubId)} ${fixture.homeGoals}–${fixture.awayGoals} ${clubName(db, fixture.awayClubId)}`,
      body: `${clubName(db, career.clubId)} ${gf > ga ? 'won' : gf < ga ? 'lost' : 'drew'} the pre-season friendly ${gf}–${ga}. The result does not affect the league table, but player condition, sharpness and tactical preparation carry forward.`,
      relatedClubId: career.clubId
    })) || changed;

    (fixture.events || []).filter(event => event.type === 'injury' && event.playerId).forEach((event, eventIndex) => {
      changed = pushUnique(career, makeItem(career, `preseason-injury-${index + 1}-${event.playerId}-${eventIndex}`, {
        category: 'Injuries & Bans', source: 'Medical Team', dateLabel: `PS W${index + 1}`, order: 41 + index * 3,
        title: `${playerName(db, event.playerId)} suffers pre-season knock`,
        body: `${playerName(db, event.playerId)} was involved in an injury incident during the friendly. The player's condition has been updated and will need monitoring through the remaining pre-season programme.`,
        priority: 'important', relatedPlayerId: event.playerId, relatedClubId: event.clubId
      })) || changed;
    });
  });

  if (preseason.phase === 'ready' || preseason.phase === 'complete') {
    const squad = db.players.filter(player => player.clubId === career.clubId && !player.isPlaceholder);
    const statuses = squad.map(player => career.playerStatus?.[player.id]).filter(Boolean);
    const avg = key => statuses.length ? Math.round(statuses.reduce((sum, status) => sum + (status[key] || 0), 0) / statuses.length) : 0;
    changed = pushUnique(career, makeItem(career, 'preseason-complete', {
      category: 'Messages', source: 'Assistant Manager', dateLabel: 'PRE-SEASON', order: 80,
      title: 'Pre-season programme complete',
      body: `The squad finishes pre-season at ${avg('condition')}% average condition, ${avg('sharpness')}% average match sharpness and ${Math.round(preseason.tacticalFamiliarity || 0)}% tactical familiarity. The competitive season can now begin.`,
      priority: 'important'
    })) || changed;
  }

  if (preseason.phase === 'complete') {
    changed = pushUnique(career, makeItem(career, 'competitive-season-begins', {
      category: 'Competitions', source: 'Club Secretary', dateLabel: 'SEASON START', order: 95,
      title: 'Competitive season begins',
      body: `Pre-season is over. ${clubName(db, career.clubId)} now turns its attention to Round 1 of the ${career.competitionName}.`,
      priority: 'important'
    })) || changed;
  }
  return changed;
}

export function syncCareerNews(career, db) {
  let changed = baseSyncCareerNews(career, db);
  changed = addPreseasonNews(career, db) || changed;
  return changed;
}
