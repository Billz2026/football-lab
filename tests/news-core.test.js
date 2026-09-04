import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getNewsItems,
  getUnreadNewsCount,
  markAllNewsRead,
  markNewsRead,
  syncCareerNews
} from '../career-news-v046.js';

function fixtureCareer() {
  return {
    id: 'career-news-test',
    managerName: 'Test Manager',
    clubId: 'club-a',
    season: '2026/27',
    competitionName: 'Test League',
    roundIndex: 0,
    fixtures: [[
      { id: 'r1-a', round: 1, homeClubId: 'club-a', awayClubId: 'club-b', played: false, homeGoals: null, awayGoals: null, events: [] },
      { id: 'r1-b', round: 1, homeClubId: 'club-c', awayClubId: 'club-d', played: false, homeGoals: null, awayGoals: null, events: [] }
    ]],
    table: [
      { clubId: 'club-a', played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 },
      { clubId: 'club-b', played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 },
      { clubId: 'club-c', played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 },
      { clubId: 'club-d', played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0, goalDifference: 0, points: 0 }
    ]
  };
}

const db = {
  metadata: { playableDemo: { clubIds: ['club-a', 'club-b', 'club-c', 'club-d'] } },
  clubs: [
    { id: 'club-a', name: 'Alpha FC', shortName: 'Alpha', reputation: 9000 },
    { id: 'club-b', name: 'Bravo FC', shortName: 'Bravo', reputation: 8000 },
    { id: 'club-c', name: 'Charlie FC', shortName: 'Charlie', reputation: 7000 },
    { id: 'club-d', name: 'Delta FC', shortName: 'Delta', reputation: 6000 }
  ],
  players: [
    { id: 'player-a', name: 'Alex Striker', clubId: 'club-a' },
    { id: 'player-b', name: 'Ben Defender', clubId: 'club-a' }
  ]
};

test('new careers receive persistent opening messages without fabricating transfers', () => {
  const career = fixtureCareer();
  assert.equal(syncCareerNews(career, db), true);
  assert.equal(career.news.items.length, 3);
  assert.equal(getUnreadNewsCount(career), 3);
  assert.equal(getNewsItems(career, 'Transfers').length, 0);
  assert.match(getNewsItems(career, 'Board')[0].body, /challenge for the title/i);
  const count = career.news.items.length;
  assert.equal(syncCareerNews(career, db), false);
  assert.equal(career.news.items.length, count);
});

test('completed rounds generate match, player, disciplinary, roundup and board stories once', () => {
  const career = fixtureCareer();
  syncCareerNews(career, db);
  career.roundIndex = 1;
  career.fixtures[0][0] = {
    ...career.fixtures[0][0], played: true, homeGoals: 2, awayGoals: 0,
    events: [
      { minute: 20, type: 'goal', clubId: 'club-a', playerId: 'player-a' },
      { minute: 50, type: 'goal', clubId: 'club-a', playerId: 'player-a' },
      { minute: 67, type: 'injury', clubId: 'club-a', playerId: 'player-b' },
      { minute: 82, type: 'red', clubId: 'club-a', playerId: 'player-b' }
    ]
  };
  career.fixtures[0][1] = { ...career.fixtures[0][1], played: true, homeGoals: 1, awayGoals: 3 };
  career.table[0] = { clubId: 'club-a', played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 2, goalsAgainst: 0, goalDifference: 2, points: 3 };
  career.table[1] = { clubId: 'club-b', played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 0, goalsAgainst: 2, goalDifference: -2, points: 0 };
  career.table[2] = { clubId: 'club-c', played: 1, won: 0, drawn: 0, lost: 1, goalsFor: 1, goalsAgainst: 3, goalDifference: -2, points: 0 };
  career.table[3] = { clubId: 'club-d', played: 1, won: 1, drawn: 0, lost: 0, goalsFor: 3, goalsAgainst: 1, goalDifference: 2, points: 3 };

  assert.equal(syncCareerNews(career, db), true);
  assert.deepEqual(career.news.generatedRounds, [1]);
  assert.equal(getNewsItems(career, 'Injuries & Bans').length, 2);
  assert.ok(getNewsItems(career, 'Messages').some(item => /Alex Striker/.test(item.title)));
  assert.ok(getNewsItems(career, 'Competitions').some(item => /Alpha 2–0 Bravo/.test(item.title)));
  assert.ok(getNewsItems(career, 'Board').some(item => item.key === 'board-r1'));
  const count = career.news.items.length;
  assert.equal(syncCareerNews(career, db), false);
  assert.equal(career.news.items.length, count);
});

test('read state and category mark-all are deterministic', () => {
  const career = fixtureCareer();
  syncCareerNews(career, db);
  const first = getNewsItems(career)[0];
  assert.equal(markNewsRead(career, first.id), true);
  assert.equal(markNewsRead(career, first.id), false);
  const boardUnread = getUnreadNewsCount(career, 'Board');
  assert.ok(boardUnread > 0);
  assert.equal(markAllNewsRead(career, 'Board'), true);
  assert.equal(getUnreadNewsCount(career, 'Board'), 0);
  assert.ok(getUnreadNewsCount(career) > 0);
});
