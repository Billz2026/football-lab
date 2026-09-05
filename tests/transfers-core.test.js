import test from 'node:test';
import assert from 'node:assert/strict';
import {
  acceptSellerCounter,
  ensureTransferState,
  estimatePlayerValue,
  getAskingPrice,
  getNegotiation,
  searchTransferMarket,
  submitContractOffer,
  submitTransferOffer,
  toggleTransferListed
} from '../transfers-v050.js';

function fixture() {
  const db = {
    clubs: [
      { id: 'a', name: 'Alpha FC', shortName: 'Alpha', reputation: 8500, isPlaceholder: false },
      { id: 'b', name: 'Bravo FC', shortName: 'Bravo', reputation: 8000, isPlaceholder: false }
    ],
    players: [
      { id: 'a1', name: 'Alpha Keeper', clubId: 'a', primaryPosition: 'GK', positionGroup: 'GK', reportedAge: 28, currentAbility: 122, potentialAbility: 122, secondaryPositions: [], isPlaceholder: false, contract: {} },
      { id: 'a2', name: 'Alpha Mid', clubId: 'a', primaryPosition: 'MC', positionGroup: 'MID', reportedAge: 25, currentAbility: 130, potentialAbility: 134, secondaryPositions: [], isPlaceholder: false, contract: {} },
      { id: 'b1', name: 'Bravo Star', clubId: 'b', primaryPosition: 'ST', positionGroup: 'ATT', reportedAge: 23, currentAbility: 145, potentialAbility: 158, secondaryPositions: ['AMR'], isPlaceholder: false, contract: {} },
      { id: 'b2', name: 'Bravo Defender', clubId: 'b', primaryPosition: 'DC', positionGroup: 'DEF', reportedAge: 27, currentAbility: 118, potentialAbility: 120, secondaryPositions: [], isPlaceholder: false, contract: {} },
      { id: 'b3', name: 'Bravo Mid', clubId: 'b', primaryPosition: 'MC', positionGroup: 'MID', reportedAge: 26, currentAbility: 121, potentialAbility: 124, secondaryPositions: [], isPlaceholder: false, contract: {} },
      { id: 'b4', name: 'Bravo Keeper', clubId: 'b', primaryPosition: 'GK', positionGroup: 'GK', reportedAge: 29, currentAbility: 110, potentialAbility: 110, secondaryPositions: [], isPlaceholder: false, contract: {} }
    ]
  };
  const career = {
    id: 'career-test', clubId: 'a', roundIndex: 0, seed: 'seed', updatedAt: '',
    playerStatus: { a1: { condition: 100, sharpness: 88, morale: 'Good', appearances: 0, goals: 0 }, a2: { condition: 100, sharpness: 88, morale: 'Good', appearances: 0, goals: 0 } },
    news: { schemaVersion: 1, items: [], generatedRounds: [] },
    preseason: { phase: 'active' }
  };
  return { db, career };
}

function fundNegotiation(career, db) {
  ensureTransferState(career, db);
  career.transfers.transferBudget = 500_000_000;
  career.transfers.wageRoom = 2_000_000;
}

test('transfer state creates budgets and the market excludes the user club', () => {
  const { db, career } = fixture();
  assert.equal(ensureTransferState(career, db), true);
  assert.ok(career.transfers.transferBudget > 0);
  assert.ok(career.transfers.wageRoom > 0);
  const market = searchTransferMarket(career, db);
  assert.ok(market.length >= 4);
  assert.ok(market.every(player => player.clubId !== career.clubId));
  assert.ok(estimatePlayerValue(market[0]) > 0);
});

test('selling club rejects a low bid and accepts a sufficiently strong asking-price bid', () => {
  const { db, career } = fixture();
  fundNegotiation(career, db);
  const target = db.players.find(player => player.id === 'b1');
  const asking = getAskingPrice(target, db, career);
  const rejected = submitTransferOffer(career, db, target.id, asking * .5);
  assert.equal(rejected.status, 'rejected');
  const accepted = submitTransferOffer(career, db, target.id, asking);
  assert.equal(accepted.status, 'accepted');
  assert.equal(getNegotiation(career, db, target.id).status, 'fee-accepted');
});

test('counter-offers can be accepted before contract talks', () => {
  const { db, career } = fixture();
  fundNegotiation(career, db);
  const target = db.players.find(player => player.id === 'b2');
  const asking = getAskingPrice(target, db, career);
  const response = submitTransferOffer(career, db, target.id, asking * .85);
  assert.equal(response.status, 'countered');
  const accepted = acceptSellerCounter(career, db, target.id);
  assert.equal(accepted.status, 'accepted');
});

test('completed contract changes ownership, budgets and transfer news', () => {
  const { db, career } = fixture();
  fundNegotiation(career, db);
  const target = db.players.find(player => player.id === 'b1');
  const asking = getAskingPrice(target, db, career);
  submitTransferOffer(career, db, target.id, asking);
  const negotiation = getNegotiation(career, db, target.id);
  const low = submitContractOffer(career, db, target.id, negotiation.wageDemand * .5, 4);
  assert.equal(low.status, 'countered');
  const beforeBudget = career.transfers.transferBudget;
  const beforeWage = career.transfers.wageRoom;
  const completed = submitContractOffer(career, db, target.id, negotiation.wageDemand, 4);
  assert.equal(completed.status, 'completed');
  assert.equal(target.clubId, 'a');
  assert.equal(career.transfers.ownership[target.id], 'a');
  assert.ok(career.transfers.transferBudget < beforeBudget);
  assert.ok(career.transfers.wageRoom < beforeWage);
  assert.ok(career.playerStatus[target.id]);
  assert.ok(career.news.items.some(item => item.category === 'Transfers' && item.relatedPlayerId === target.id));
});

test('own players can be transfer listed and removed again', () => {
  const { db, career } = fixture();
  ensureTransferState(career, db);
  assert.equal(toggleTransferListed(career, db, 'a2'), true);
  assert.deepEqual(career.transfers.listedPlayerIds, ['a2']);
  assert.equal(toggleTransferListed(career, db, 'a2'), false);
  assert.deepEqual(career.transfers.listedPlayerIds, []);
});
