import test from 'node:test';
import assert from 'node:assert/strict';
import { finaliseSeason } from '../season-finalisation-v1.js';
import { rolloverPremierLeagueSeason } from '../premier-league-rollover-v1.js';

function dbFixture() {
  const ids = Array.from({ length: 20 }, (_, index) => `idem-${index + 1}`);
  const clubs = ids.map((id, index) => ({ id, name: `Idempotence Club ${index + 1}`, leagueId: 'eng-premier-league', reputation: 7000, isPlaceholder: false }));
  const shape = [['GK', 'GK'], ['DEF', 'DR'], ['DEF', 'DC'], ['DEF', 'DL'], ['DEF', 'DC'], ['MID', 'MC'], ['MID', 'MC'], ['MID', 'AMC'], ['ATT', 'AMR'], ['ATT', 'ST'], ['ATT', 'AML']];
  const players = clubs.flatMap(club => shape.map(([positionGroup, primaryPosition], index) => ({
    id: `${club.id}-p${index}`,
    name: `${club.name} Player ${index}`,
    clubId: club.id,
    positionGroup,
    primaryPosition,
    currentAbility: 140,
    potentialAbility: 150,
    isPlaceholder: false
  })));
  return { ids, clubs, players };
}

function careerFixture(ids) {
  const table = ids.map((clubId, index) => ({
    clubId,
    played: 38,
    won: 28 - Math.min(index, 20),
    drawn: 4,
    lost: 6 + index,
    goalsFor: 80 - index,
    goalsAgainst: 30 + index,
    goalDifference: 50 - index * 2,
    points: 95 - index * 4
  }));
  const fixtures = [];
  let serial = 0;
  for (let a = 0; a < ids.length; a += 1) {
    for (let b = a + 1; b < ids.length; b += 1) {
      fixtures.push({ id: `i-${++serial}-a`, played: true, homeClubId: ids[a], awayClubId: ids[b], homeGoals: 1, awayGoals: 0 });
      fixtures.push({ id: `i-${++serial}-b`, played: true, homeClubId: ids[b], awayClubId: ids[a], homeGoals: 0, awayGoals: 1 });
    }
  }
  return {
    id: 'idempotence-career',
    clubId: ids[0],
    leagueId: 'eng-premier-league',
    competitionId: 'eng-premier-league',
    competitionName: 'Premier League',
    season: '2026/27',
    seed: 'idempotence',
    status: 'complete',
    roundIndex: 38,
    table,
    fixtures: [fixtures],
    seasonEndDate: '2027-05-30',
    currentDate: '2027-05-30',
    calendar: { currentDate: '2027-05-30' },
    preseason: { phase: 'complete' }
  };
}

test('immediate duplicate rollover call is idempotent', () => {
  const db = dbFixture();
  const career = careerFixture(db.ids);
  finaliseSeason(career, { completedAt: '2027-05-30T18:00:00.000Z' });
  const first = rolloverPremierLeagueSeason(career, { db });
  const snapshot = structuredClone(career);
  const second = rolloverPremierLeagueSeason(career, { db });
  assert.equal(first.status, 'rolled-over');
  assert.equal(second.status, 'already-rolled-over');
  assert.deepEqual(career, snapshot);
  assert.equal(career.seasonRollovers.length, 1);
});
