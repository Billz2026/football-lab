export const COMPETITION_RULES_VERSION = 1;

export const PREMIER_LEAGUE_RULES = Object.freeze({
  id: 'eng-premier-league',
  name: 'Premier League',
  countryCode: 'ENG',
  level: 1,
  clubCount: 20,
  relegationPlaces: 3,
  ranking: Object.freeze([
    'points',
    'goalDifference',
    'goalsFor',
    'headToHeadPoints',
    'headToHeadAwayGoals'
  ]),
  consequentialPlayoff: Object.freeze(['title', 'europe', 'relegation'])
});

const RULES_BY_ID = Object.freeze({
  [PREMIER_LEAGUE_RULES.id]: PREMIER_LEAGUE_RULES
});

const clone = value => JSON.parse(JSON.stringify(value));

function inferredCompetitionId(career = {}) {
  const explicit = career.competitionId || career.leagueId;
  if (explicit) return explicit;
  const name = String(career.competitionName || '').toLowerCase();
  if ((name.includes('premier league') || name.includes('football lab premier league')) && career.table?.length === 20) {
    return PREMIER_LEAGUE_RULES.id;
  }
  return null;
}

export function competitionRulesFor(career = {}) {
  const id = inferredCompetitionId(career);
  return id && RULES_BY_ID[id] ? RULES_BY_ID[id] : null;
}

function baseCompare(a, b) {
  return Number(b.points || 0) - Number(a.points || 0) ||
    Number(b.goalDifference || 0) - Number(a.goalDifference || 0) ||
    Number(b.goalsFor || 0) - Number(a.goalsFor || 0);
}

function sameBaseRank(a, b) {
  return Number(a.points || 0) === Number(b.points || 0) &&
    Number(a.goalDifference || 0) === Number(b.goalDifference || 0) &&
    Number(a.goalsFor || 0) === Number(b.goalsFor || 0);
}

function playedFixtures(fixtures = []) {
  return (fixtures || []).flat().filter(fixture => fixture?.played && Number.isFinite(Number(fixture.homeGoals)) && Number.isFinite(Number(fixture.awayGoals)));
}

function headToHeadStats(clubIds, fixtures) {
  const wanted = new Set(clubIds);
  const stats = Object.fromEntries(clubIds.map(clubId => [clubId, { points: 0, awayGoals: 0 }]));
  for (const fixture of playedFixtures(fixtures)) {
    if (!wanted.has(fixture.homeClubId) || !wanted.has(fixture.awayClubId)) continue;
    const homeGoals = Number(fixture.homeGoals);
    const awayGoals = Number(fixture.awayGoals);
    stats[fixture.awayClubId].awayGoals += awayGoals;
    if (homeGoals > awayGoals) stats[fixture.homeClubId].points += 3;
    else if (homeGoals < awayGoals) stats[fixture.awayClubId].points += 3;
    else {
      stats[fixture.homeClubId].points += 1;
      stats[fixture.awayClubId].points += 1;
    }
  }
  return stats;
}

function consequenceForRange(startPosition, endPosition, rules) {
  const consequences = [];
  if (startPosition === 1 && endPosition > 1) consequences.push('title');
  const lastSafePosition = rules.clubCount - rules.relegationPlaces;
  if (startPosition <= lastSafePosition && endPosition > lastSafePosition) consequences.push('relegation');
  return consequences;
}

export function rankCompetitionTable(career = {}) {
  const rules = competitionRulesFor(career);
  if (!rules) {
    const rows = [...(career.table || [])]
      .sort((a, b) => baseCompare(a, b) || String(a.clubId).localeCompare(String(b.clubId)))
      .map((row, index) => ({ ...clone(row), position: index + 1 }));
    return { rules: null, rows, unresolvedGroups: [], playoffRequired: false };
  }

  const baseSorted = [...(career.table || [])].sort((a, b) => baseCompare(a, b));
  const baseGroups = [];
  for (const row of baseSorted) {
    const current = baseGroups.at(-1);
    if (current && sameBaseRank(current[0], row)) current.push(row);
    else baseGroups.push([row]);
  }

  const rows = [];
  const unresolvedGroups = [];
  for (const group of baseGroups) {
    if (group.length === 1) {
      rows.push({ ...clone(group[0]), position: rows.length + 1 });
      continue;
    }

    const stats = headToHeadStats(group.map(row => row.clubId), career.fixtures);
    const rankedGroup = group
      .map(row => ({ row, h2h: stats[row.clubId] || { points: 0, awayGoals: 0 } }))
      .sort((a, b) =>
        b.h2h.points - a.h2h.points ||
        b.h2h.awayGoals - a.h2h.awayGoals ||
        String(a.row.clubId).localeCompare(String(b.row.clubId))
      );

    let index = 0;
    while (index < rankedGroup.length) {
      const first = rankedGroup[index];
      let end = index + 1;
      while (
        end < rankedGroup.length &&
        rankedGroup[end].h2h.points === first.h2h.points &&
        rankedGroup[end].h2h.awayGoals === first.h2h.awayGoals
      ) end += 1;

      const startPosition = rows.length + 1;
      const tied = rankedGroup.slice(index, end);
      for (const item of tied) {
        rows.push({
          ...clone(item.row),
          position: rows.length + 1,
          tiebreak: {
            headToHeadPoints: item.h2h.points,
            headToHeadAwayGoals: item.h2h.awayGoals,
            unresolved: tied.length > 1
          }
        });
      }
      if (tied.length > 1) {
        const endPosition = rows.length;
        unresolvedGroups.push({
          clubIds: tied.map(item => item.row.clubId),
          positions: [startPosition, endPosition],
          consequences: consequenceForRange(startPosition, endPosition, rules)
        });
      }
      index = end;
    }
  }

  return {
    rules,
    rows,
    unresolvedGroups,
    playoffRequired: unresolvedGroups.some(group => group.consequences.length > 0)
  };
}
