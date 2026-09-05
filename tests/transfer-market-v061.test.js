import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createCareer } from '../manager-core.js';
import { ensurePreseason } from '../preseason-v047.js';
import {
  ensureTransferState,
  estimatePlayerValue,
  getAskingPrice,
  getTransferStance,
  processTransferWorld
} from '../transfers-v050.js';

const [metadata, clubs, players] = await Promise.all([
  readFile(new URL('../data/current/metadata.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../data/current/clubs.json', import.meta.url), 'utf8').then(JSON.parse),
  readFile(new URL('../data/current/players.json', import.meta.url), 'utf8').then(JSON.parse)
]);

function syntheticPlayer(overrides = {}) {
  return {
    id: 'elite', name: 'Elite Forward', clubId: 'b', primaryPosition: 'ST', positionGroup: 'ATT',
    reportedAge: 25, currentAbility: 190, potentialAbility: 195, secondaryPositions: [], isPlaceholder: false,
    contract: {}, ...overrides
  };
}

function marketFixture() {
  const playableIds = new Set(metadata.playableDemo?.clubIds || []);
  const playableClubs = clubs.filter(club => playableIds.has(club.id) && !club.isPlaceholder);
  const userClub = playableClubs.find(club => club.name === 'Arsenal') || playableClubs[0];
  const db = { metadata, clubs: structuredClone(clubs), players: structuredClone(players) };
  const career = createCareer({
    clubId: userClub.id,
    clubs: db.clubs.filter(club => playableIds.has(club.id) && !club.isPlaceholder),
    players: db.players,
    seed: 'v061-transfer-market',
    managerName: 'Market Test'
  });
  ensurePreseason(career, db);
  career.currentDate = '2026-06-15';
  career.calendar ||= {};
  career.calendar.currentDate = '2026-06-15';
  career.worldClock ||= { schemaVersion: 1, totalDaysAdvanced: 0, history: [], acknowledgedMilestones: [] };
  ensureTransferState(career, db);
  return { career, db, playableClubs };
}

test('elite market values use a steep scarcity curve instead of the old £145m ceiling', () => {
  const elite = syntheticPlayer();
  const star = syntheticPlayer({ id: 'star', currentAbility: 180, potentialAbility: 188, reportedAge: 24 });
  const good = syntheticPlayer({ id: 'good', currentAbility: 150, potentialAbility: 158, reportedAge: 25 });
  const eliteValue = estimatePlayerValue(elite);
  const starValue = estimatePlayerValue(star);
  const goodValue = estimatePlayerValue(good);
  assert.ok(eliteValue >= 180_000_000, `expected elite value >= £180m, got ${eliteValue}`);
  assert.ok(starValue >= 120_000_000, `expected star value >= £120m, got ${starValue}`);
  assert.ok(eliteValue > goodValue * 3, 'top-end value should rise much faster than ordinary first-team quality');
  assert.ok(eliteValue > 145_000_000, 'the old £145m hard ceiling must be gone');
});

test('cornerstone players are expensive to prise away and can be marked not for sale', () => {
  const db = {
    clubs: [
      { id: 'a', name: 'Buyer', reputation: 8700, leagueId: 'pl' },
      { id: 'b', name: 'Seller', reputation: 9000, leagueId: 'pl' }
    ],
    players: [
      syntheticPlayer(),
      syntheticPlayer({ id: 'b2', name: 'Second Star', currentAbility: 175, potentialAbility: 180, positionGroup: 'MID', primaryPosition: 'MC' }),
      syntheticPlayer({ id: 'b3', name: 'Third Star', currentAbility: 168, potentialAbility: 172, positionGroup: 'DEF', primaryPosition: 'DC' }),
      syntheticPlayer({ id: 'b4', name: 'Depth', currentAbility: 135, potentialAbility: 140, positionGroup: 'ATT' })
    ]
  };
  const career = { id: 'stance', clubId: 'a', seed: 'stance', transfers: { listedPlayerIds: [], contracts: {} } };
  const stance = getTransferStance(db.players[0], db, career, 'a');
  assert.equal(stance.tone, 'resistant');
  assert.equal(stance.label, 'Not for sale');
  assert.ok(stance.askingPrice >= stance.value * 1.6, 'elite seller should demand a major premium');
  assert.ok(stance.minimumAcceptable > stance.value * 1.35, 'elite player should not be obtainable around market value');
});

test('real database stars receive materially higher values and asking prices', () => {
  const { career, db } = marketFixture();
  const saka = db.players.find(player => /(^|\s)Saka$/i.test(player.name));
  const haaland = db.players.find(player => /Haaland/i.test(player.name));
  assert.ok(saka, 'expected Saka in the Premier League database');
  assert.ok(haaland, 'expected Haaland in the Premier League database');
  const sakaValue = estimatePlayerValue(saka);
  const haalandValue = estimatePlayerValue(haaland);
  const sakaAsk = getAskingPrice(saka, db, career);
  const haalandAsk = getAskingPrice(haaland, db, career);
  console.log(`V0.6.1 star values: ${saka.name} £${sakaValue.toLocaleString()} ask £${sakaAsk.toLocaleString()} | ${haaland.name} £${haalandValue.toLocaleString()} ask £${haalandAsk.toLocaleString()}`);
  assert.ok(sakaValue >= 90_000_000, `Saka should be a nine-figure-class asset or close to it; got ${sakaValue}`);
  assert.ok(haalandValue >= 130_000_000, `Haaland should be an elite nine-figure asset; got ${haalandValue}`);
  assert.ok(sakaAsk > sakaValue, 'Saka asking price should exceed estimated value');
  assert.ok(haalandAsk > haalandValue, 'Haaland asking price should exceed estimated value');
});

test('AI market processes real calendar dates without producing a transfer on every day', () => {
  const { career, db } = marketFixture();
  const start = Date.parse('2026-06-15T00:00:00Z');
  for (let day = 0; day < 45; day += 1) {
    const date = new Date(start + day * 86400000).toISOString().slice(0, 10);
    career.currentDate = date;
    career.calendar.currentDate = date;
    processTransferWorld(career, db);
  }
  const aiDeals = career.transfers.completed.filter(item => item.source === 'ai-v61' || item.source === 'ai');
  assert.ok(aiDeals.length >= 1, 'expected some intelligent AI business across 45 transfer-window days');
  assert.ok(aiDeals.length < 25, `AI market is too frantic: ${aiDeals.length} deals in 45 days`);
  assert.equal(new Set(aiDeals.map(item => item.playerId)).size, aiDeals.length, 'a player should not bounce between clubs repeatedly in the same short window');
  assert.ok(career.transfers.marketV61.processedDates.length >= 40, 'daily market processing should be date driven');
});
