import test from 'node:test';
import assert from 'node:assert/strict';
import { getRivalryRule, rivalryDecision } from '../transfer-rivalries-v1.js';
import { migrateExistingRivalTransfers } from '../transfer-market-v062-rivalry.js';
import { getTransferStance, submitTransferOffer } from '../transfers-v050.js';

function fixture() {
  const clubs = [
    { id: 'mu', name: 'Manchester United', shortName: 'Manchester United', leagueId: 'eng-premier-league', reputation: 8200 },
    { id: 'mc', name: 'Manchester City', shortName: 'Manchester City', leagueId: 'eng-premier-league', reputation: 9000 },
    { id: 'ars', name: 'Arsenal', shortName: 'Arsenal', leagueId: 'eng-premier-league', reputation: 8900 },
    { id: 'tot', name: 'Tottenham Hotspur', shortName: 'Tottenham', leagueId: 'eng-premier-league', reputation: 8400 }
  ];
  const dorgu = {
    id: 'dorgu', name: 'Patrick Dorgu', clubId: 'mu', primaryPosition: 'DL', positionGroup: 'DEF',
    reportedAge: 21, currentAbility: 151, potentialAbility: 170, importanceScore: 82,
    secondaryPositions: ['AML'], isPlaceholder: false, contract: {}
  };
  const players = [
    dorgu,
    { ...dorgu, id: 'mu2', name: 'United Defender 2', currentAbility: 160, importanceScore: 90 },
    { ...dorgu, id: 'mu3', name: 'United Defender 3', currentAbility: 148, importanceScore: 70 },
    { ...dorgu, id: 'mu4', name: 'United Defender 4', currentAbility: 142, importanceScore: 60 },
    { ...dorgu, id: 'mu5', name: 'United Defender 5', currentAbility: 136, importanceScore: 45 },
    { ...dorgu, id: 'mu6', name: 'United Defender 6', currentAbility: 132, importanceScore: 35 }
  ];
  const career = {
    id: 'rivalry-test', clubId: 'mc', currentDate: '2026-06-20',
    transfers: { transferBudget: 500_000_000, wageBudget: 5_000_000, wageCommitted: 0, listedPlayerIds: [], contracts: {}, negotiations: {} }
  };
  return { db: { clubs, players }, career, dorgu };
}

test('Manchester United to Manchester City is a hard rivalry in both directions', () => {
  const { db } = fixture();
  assert.equal(getRivalryRule(db, 'mu', 'mc')?.level, 'hard');
  assert.equal(getRivalryRule(db, 'mc', 'mu')?.level, 'hard');
});

test('established first-team players are blocked from direct hard-rival moves', () => {
  const { db, career, dorgu } = fixture();
  const stance = getTransferStance(dorgu, db, career, 'mc');
  assert.equal(stance.rivalryBlocked, true);
  assert.match(stance.rivalry, /Manchester derby/i);
  assert.throws(() => submitTransferOffer(career, db, dorgu.id, 150_000_000), /Manchester derby/i);
});

test('hard-rival exception is deliberately narrow for fringe, listed, expiring players', () => {
  const { db, career, dorgu } = fixture();
  const fringe = { ...dorgu, id: 'fringe', reportedAge: 31, currentAbility: 128, importanceScore: 22 };
  db.players.push(fringe);
  career.transfers.listedPlayerIds.push(fringe.id);
  career.transfers.contracts[fringe.id] = { years: 1, yearsRemaining: 1, expiryYear: 2027 };
  const baseStance = { rank: 15, key: false, elite: false, contractYears: 1 };
  const decision = rivalryDecision(db, 'mu', 'mc', fringe, baseStance, career);
  assert.equal(decision.blocked, false);
  assert.equal(decision.rareException, true);
  assert.ok(decision.multiplier >= 1.8);
});

test('Arsenal to Tottenham is also treated as a hard direct-rival move', () => {
  const { db, dorgu } = fixture();
  const player = { ...dorgu, clubId: 'ars', currentAbility: 160, importanceScore: 88 };
  const decision = rivalryDecision(db, 'ars', 'tot', player, { rank: 3, key: true, elite: false, contractYears: 3 }, { transfers: { listedPlayerIds: [] } });
  assert.equal(decision.blocked, true);
  assert.match(decision.rule.label, /North London/i);
});

test('existing AI-only Dorgu-style Manchester derby transfer is reverted in old saves', () => {
  const { db, dorgu } = fixture();
  dorgu.clubId = 'mc';
  const career = {
    id: 'arsenal-old-save', clubId: 'ars', currentDate: '2026-07-20',
    transfers: {
      completed: [{ id: 'old-dorgu-city', playerId: 'dorgu', fromClubId: 'mu', toClubId: 'mc', fee: 55_000_000, weeklyWage: 110_000, source: 'ai', round: 0 }],
      ownership: { dorgu: 'mc' },
      contracts: { dorgu: { weeklyWage: 110_000, years: 5, expiryYear: 2031 } },
      listedPlayerIds: [],
      aiClubs: {
        mu: { transferBudget: 90_100_000, wageRoom: 350_000, signedPlayerIds: [], soldPlayerIds: ['dorgu'] },
        mc: { transferBudget: 70_000_000, wageRoom: 390_000, signedPlayerIds: ['dorgu'], soldPlayerIds: [] }
      }
    },
    news: { items: [{ id: 'news-x-v61-transfer-old-dorgu-city', key: 'v61-transfer-old-dorgu-city', category: 'Transfers', relatedPlayerId: 'dorgu' }] }
  };

  const reverted = migrateExistingRivalTransfers(career, db);
  assert.equal(reverted.length, 1);
  assert.equal(reverted[0].playerId, 'dorgu');
  assert.equal(dorgu.clubId, 'mu');
  assert.equal(career.transfers.ownership.dorgu, 'mu');
  assert.equal(career.transfers.completed.length, 0);
  assert.equal(career.transfers.aiClubs.mc.signedPlayerIds.includes('dorgu'), false);
  assert.equal(career.transfers.aiClubs.mu.soldPlayerIds.includes('dorgu'), false);
  assert.equal(career.news.items.length, 0);
});
