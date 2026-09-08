import test from 'node:test';
import assert from 'node:assert/strict';
import { rankCompetitionTable } from '../competition-rules-v1.js';
import { finaliseSeason } from '../season-finalisation-v1.js';
import { createCareer, simulateNextRound } from '../manager-core.js';

function clubIds() {
  return Array.from({ length: 20 }, (_, index) => `club-${String(index + 1).padStart(2, '0')}`);
}

function blankTable(ids = clubIds()) {
  return ids.map((clubId, index) => ({
    clubId,
    played: 38,
    won: 20 - Math.min(index, 19),
    drawn: 5,
    lost: 13 + Math.min(index, 19),
    goalsFor: 80 - index,
    goalsAgainst: 35 + index,
    goalDifference: 45 - index * 2,
    points: 90 - index * 3
  }));
}

function completeFixtures(ids = clubIds()) {
  const fixtures = [];
  let serial = 0;
  for (let a = 0; a < ids.length; a += 1) {
    for (let b = a + 1; b < ids.length; b += 1) {
      fixtures.push({
        id: `f-${++serial}-a`, played: true,
        homeClubId: ids[a], awayClubId: ids[b], homeGoals: 0, awayGoals: 0
      });
      fixtures.push({
        id: `f-${++serial}-b`, played: true,
        homeClubId: ids[b], awayClubId: ids[a], homeGoals: 0, awayGoals: 0
      });
    }
  }
  return [fixtures];
}

function completePremierLeagueCareer(table = blankTable(), fixtures = completeFixtures()) {
  return {
    id: 'career-test',
    season: '2026/27',
    leagueId: 'eng-premier-league',
    competitionId: 'eng-premier-league',
    competitionName: 'Premier League',
    status: 'complete',
    table,
    fixtures
  };
}

test('Premier League finalisation records champion, bottom three and defending champion context', () => {
  const career = completePremierLeagueCareer();
  const result = finaliseSeason(career, { completedAt: '2027-05-30T18:00:00.000Z' });

  assert.equal(result.status, 'finalised');
  assert.equal(career.seasonHistory.length, 1);
  assert.equal(career.seasonOutcome.championClubId, 'club-01');
  assert.equal(career.seasonOutcome.runnerUpClubId, 'club-02');
  assert.deepEqual(career.seasonOutcome.relegatedClubIds, ['club-18', 'club-19', 'club-20']);
  assert.equal(career.nextSeasonContext.defendingChampionClubId, 'club-01');
  assert.equal(career.nextSeasonContext.sourceSeason, '2026/27');
  assert.equal(career.seasonOutcome.europeanQualification.status, 'pending');
  assert.equal(career.seasonOutcome.finalTable[0].position, 1);
  assert.equal(career.seasonOutcome.finalTable[19].position, 20);
});

test('season finalisation is idempotent', () => {
  const career = completePremierLeagueCareer();
  finaliseSeason(career, { completedAt: '2027-05-30T18:00:00.000Z' });
  const second = finaliseSeason(career, { completedAt: '2027-05-31T10:00:00.000Z' });
  assert.equal(second.status, 'already-finalised');
  assert.equal(career.seasonHistory.length, 1);
  assert.equal(career.seasonHistory[0].completedAt, '2027-05-30T18:00:00.000Z');
});

test('Premier League ranking uses head-to-head points after points, goal difference and goals scored', () => {
  const table = blankTable();
  const a = table[0];
  const b = table[1];
  Object.assign(a, { points: 88, goalDifference: 40, goalsFor: 75 });
  Object.assign(b, { points: 88, goalDifference: 40, goalsFor: 75 });
  const fixtures = completeFixtures();
  for (const fixture of fixtures[0]) {
    if (fixture.homeClubId === a.clubId && fixture.awayClubId === b.clubId) {
      fixture.homeGoals = 2; fixture.awayGoals = 0;
    }
    if (fixture.homeClubId === b.clubId && fixture.awayClubId === a.clubId) {
      fixture.homeGoals = 1; fixture.awayGoals = 1;
    }
  }
  const ranking = rankCompetitionTable(completePremierLeagueCareer(table, fixtures));
  assert.equal(ranking.rows[0].clubId, a.clubId);
  assert.equal(ranking.rows[0].tiebreak.headToHeadPoints, 4);
  assert.equal(ranking.rows[1].tiebreak.headToHeadPoints, 1);
  assert.equal(ranking.playoffRequired, false);
});

test('Premier League ranking uses head-to-head away goals when head-to-head points are equal', () => {
  const table = blankTable();
  const a = table[0];
  const b = table[1];
  Object.assign(a, { points: 88, goalDifference: 40, goalsFor: 75 });
  Object.assign(b, { points: 88, goalDifference: 40, goalsFor: 75 });
  const fixtures = completeFixtures();
  for (const fixture of fixtures[0]) {
    if (fixture.homeClubId === a.clubId && fixture.awayClubId === b.clubId) {
      fixture.homeGoals = 2; fixture.awayGoals = 1;
    }
    if (fixture.homeClubId === b.clubId && fixture.awayClubId === a.clubId) {
      fixture.homeGoals = 3; fixture.awayGoals = 2;
    }
  }
  const ranking = rankCompetitionTable(completePremierLeagueCareer(table, fixtures));
  assert.equal(ranking.rows[0].clubId, a.clubId);
  assert.equal(ranking.rows[0].tiebreak.headToHeadPoints, 3);
  assert.equal(ranking.rows[1].tiebreak.headToHeadPoints, 3);
  assert.equal(ranking.rows[0].tiebreak.headToHeadAwayGoals, 2);
  assert.equal(ranking.rows[1].tiebreak.headToHeadAwayGoals, 1);
});

test('an unresolved tie affecting the title requires a playoff instead of an arbitrary club-id winner', () => {
  const table = blankTable();
  Object.assign(table[0], { points: 90, goalDifference: 50, goalsFor: 80 });
  Object.assign(table[1], { points: 90, goalDifference: 50, goalsFor: 80 });
  const career = completePremierLeagueCareer(table, completeFixtures());
  const result = finaliseSeason(career);

  assert.equal(result.status, 'playoff-required');
  assert.equal(career.seasonHistory.length, 0);
  assert.equal(career.seasonOutcome, null);
  assert.equal(career.seasonResolution.status, 'playoff-required');
  assert.deepEqual(career.seasonResolution.unresolvedGroups[0].consequences, ['title']);
});

test('an unresolved tie across 17th and 18th requires a relegation playoff', () => {
  const table = blankTable();
  Object.assign(table[16], { points: 39, goalDifference: -20, goalsFor: 40 });
  Object.assign(table[17], { points: 39, goalDifference: -20, goalsFor: 40 });
  const career = completePremierLeagueCareer(table, completeFixtures());
  const result = finaliseSeason(career);

  assert.equal(result.status, 'playoff-required');
  assert.equal(career.seasonHistory.length, 0);
  assert.ok(career.seasonResolution.unresolvedGroups.some(group => group.consequences.includes('relegation')));
});

test('unknown leagues do not inherit Premier League rules', () => {
  const career = completePremierLeagueCareer();
  career.leagueId = 'esp-la-liga';
  career.competitionId = 'esp-la-liga';
  career.competitionName = 'La Liga';
  const result = finaliseSeason(career);
  assert.equal(result.status, 'unsupported-competition');
  assert.equal(career.seasonHistory.length, 0);
});

function simulatedDb() {
  const ids = clubIds();
  const clubs = ids.map((id, index) => ({
    id,
    name: `Club ${index + 1}`,
    leagueId: 'eng-premier-league',
    reputation: 7000 + (20 - index) * 10,
    isPlaceholder: false
  }));
  const shape = [
    ['GK', 'GK'],
    ['DEF', 'RB'], ['DEF', 'CB'], ['DEF', 'CB'], ['DEF', 'LB'],
    ['MID', 'CM'], ['MID', 'CM'], ['MID', 'AM'],
    ['ATT', 'RW'], ['ATT', 'ST'], ['ATT', 'LW']
  ];
  const players = clubs.flatMap((club, clubIndex) => shape.map(([positionGroup, primaryPosition], playerIndex) => ({
    id: `${club.id}-p${playerIndex + 1}`,
    name: `${club.name} Player ${playerIndex + 1}`,
    clubId: club.id,
    positionGroup,
    primaryPosition,
    currentAbility: 120 + (20 - clubIndex),
    potentialAbility: 145,
    isPlaceholder: false
  })));
  return { clubs, players };
}

test('manager core automatically finalises a full 38-round Premier League season', () => {
  const db = simulatedDb();
  let career = createCareer({ clubId: 'club-01', clubs: db.clubs, players: db.players, seed: 'season-finalisation-integration' });
  assert.equal(career.leagueId, 'eng-premier-league');
  assert.equal(career.fixtures.length, 38);

  while (career.status !== 'complete') career = simulateNextRound(career, db);

  assert.equal(career.roundIndex, 38);
  assert.equal(career.fixtures.flat().length, 380);
  assert.ok(career.fixtures.flat().every(fixture => fixture.played));
  assert.equal(career.seasonHistory.length, 1);
  assert.ok(career.seasonOutcome?.championClubId);
  assert.equal(career.seasonOutcome.relegatedClubIds.length, 3);
  assert.equal(career.nextSeasonContext.defendingChampionClubId, career.seasonOutcome.championClubId);
});
