import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { applyManchesterAuditV2 } from '../player-audit-v2.js';

const players = JSON.parse(await readFile(new URL('../data/current/players.json', import.meta.url), 'utf8'));
const UNITED_ID = 'flm-club-api-football-33';
const CITY_ID = 'flm-club-api-football-50';

function auditedDb() {
  return applyManchesterAuditV2({ players: structuredClone(players), playerAudit: {} });
}

function byLastName(db, clubId, pattern) {
  return db.players.find(player => player.clubId === clubId && pattern.test(`${player.name} ${player.lastName || ''}`));
}

test('Manchester United audit corrects structurally wrong imported positions', () => {
  const db = auditedDb();
  const dorgu = byLastName(db, UNITED_ID, /Dorgu/i);
  const mbeumo = byLastName(db, UNITED_ID, /Mbeumo/i);
  const rashford = byLastName(db, UNITED_ID, /Rashford/i);
  assert.ok(dorgu && mbeumo && rashford);
  assert.equal(dorgu.primaryPosition, 'DL');
  assert.ok(dorgu.secondaryPositions.includes('WBL'));
  assert.equal(mbeumo.primaryPosition, 'AMR');
  assert.equal(mbeumo.positionGroup, 'ATT');
  assert.equal(rashford.primaryPosition, 'AML');
  assert.equal(rashford.positionGroup, 'ATT');
  assert.ok(dorgu.importanceScore >= 80);
});

test('Manchester United key-player hierarchy is explicitly calibrated', () => {
  const db = auditedDb();
  const bruno = byLastName(db, UNITED_ID, /Fernandes/i);
  const baleba = byLastName(db, UNITED_ID, /Baleba/i);
  const yoro = byLastName(db, UNITED_ID, /Yoro/i);
  assert.ok(bruno && baleba && yoro);
  assert.equal(bruno.primaryPosition, 'AMC');
  assert.ok(bruno.importanceScore >= 95);
  assert.ok(baleba.currentAbility >= 160);
  assert.ok(yoro.potentialAbility >= 180);
});

test('Manchester City audit corrects wide-player and full-back position errors', () => {
  const db = auditedDb();
  const semenyo = byLastName(db, CITY_ID, /Semenyo/i);
  const aitNouri = byLastName(db, CITY_ID, /A.t-Nouri|Aït-Nouri/i);
  const doku = byLastName(db, CITY_ID, /Doku/i);
  assert.ok(semenyo && aitNouri && doku);
  assert.equal(semenyo.primaryPosition, 'AML');
  assert.equal(semenyo.positionGroup, 'ATT');
  assert.equal(aitNouri.primaryPosition, 'DL');
  assert.equal(doku.primaryPosition, 'AML');
});

test('deadline-day City arrivals are moved from stale source-club ownership at runtime', () => {
  const db = auditedDb();
  const enzo = byLastName(db, CITY_ID, /Fern.ndez/i);
  const ndiaye = byLastName(db, CITY_ID, /Ndiaye/i);
  assert.ok(enzo, 'Enzo Fernández should be assigned to Manchester City');
  assert.ok(ndiaye, 'Iliman Ndiaye should be assigned to Manchester City');
  assert.equal(enzo.shirtNumber, 17);
  assert.equal(enzo.primaryPosition, 'MC');
  assert.equal(ndiaye.shirtNumber, 7);
  assert.equal(ndiaye.positionGroup, 'ATT');
});

test('confirmed City departures are not selectable in the current City squad', () => {
  const db = auditedDb();
  const citySelectable = db.players.filter(player => player.clubId === CITY_ID && !player.isPlaceholder);
  for (const surname of ['Rodri', 'Reijnders', 'Savinho', 'Marmoush', 'Trafford', 'Akanji', 'Stones']) {
    assert.equal(citySelectable.some(player => new RegExp(surname, 'i').test(`${player.name} ${player.lastName || ''}`)), false, `${surname} remained selectable for City`);
  }
});

test('Haaland and Foden remain calibrated as genuine City cornerstone players', () => {
  const db = auditedDb();
  const haaland = byLastName(db, CITY_ID, /Haaland/i);
  const foden = byLastName(db, CITY_ID, /Foden/i);
  assert.ok(haaland && foden);
  assert.ok(haaland.currentAbility >= 185);
  assert.equal(haaland.importanceScore, 100);
  assert.ok(haaland.auditedMarketValue >= 175_000_000);
  assert.ok(foden.importanceScore >= 95);
});
