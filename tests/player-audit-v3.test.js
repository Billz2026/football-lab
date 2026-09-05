import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { applyManchesterAuditV2 } from '../player-audit-v2.js';
import { applyPremierLeagueAuditV3 } from '../player-audit-v3.js';

const players = JSON.parse(await readFile(new URL('../data/current/players.json', import.meta.url), 'utf8'));
const LIVERPOOL_ID = 'flm-club-api-football-40';
const CHELSEA_ID = 'flm-club-api-football-49';
const TOTTENHAM_ID = 'flm-club-api-football-47';
const NEWCASTLE_ID = 'flm-club-api-football-34';
const ARSENAL_ID = 'flm-club-api-football-42';

function auditedDb() {
  const db = { players: structuredClone(players), playerAudit: {} };
  applyManchesterAuditV2(db);
  return applyPremierLeagueAuditV3(db);
}

function atClub(db, clubId, pattern) {
  return db.players.find(player => player.clubId === clubId && pattern.test(`${player.name} ${player.lastName || ''}`));
}

function selectable(db, clubId) {
  return db.players.filter(player => player.clubId === clubId && !player.isPlaceholder && !player.unavailableInPremierLeagueDatabase);
}

test('Liverpool audit installs the current post-window spine and correct positions', () => {
  const db = auditedDb();
  const wirtz = atClub(db, LIVERPOOL_ID, /Wirtz/i);
  const isak = atClub(db, LIVERPOOL_ID, /Isak/i);
  const barcola = atClub(db, LIVERPOOL_ID, /Barcola/i);
  const araujo = atClub(db, LIVERPOOL_ID, /Araujo|Araújo/i);
  const jacquet = atClub(db, LIVERPOOL_ID, /Jacquet/i);
  assert.ok(wirtz && isak && barcola && araujo && jacquet);
  assert.equal(wirtz.primaryPosition, 'AMC');
  assert.equal(isak.primaryPosition, 'ST');
  assert.equal(barcola.primaryPosition, 'AML');
  assert.equal(araujo.primaryPosition, 'DC');
  assert.ok(wirtz.importanceScore >= 95);
  assert.ok(isak.currentAbility >= 170);
});

test('Liverpool confirmed departures are not selectable at Liverpool', () => {
  const db = auditedDb();
  const squad = selectable(db, LIVERPOOL_ID);
  for (const surname of ['Salah', 'Konate', 'Konaté']) {
    assert.equal(squad.some(player => new RegExp(surname, 'i').test(`${player.name} ${player.lastName || ''}`)), false, `${surname} remained selectable for Liverpool`);
  }
});

test('Chelsea audit reflects post-window core and removes stale ownership through stacked audits', () => {
  const db = auditedDb();
  const palmer = atClub(db, CHELSEA_ID, /Palmer/i);
  const caicedo = atClub(db, CHELSEA_ID, /Caicedo/i);
  const rogers = atClub(db, CHELSEA_ID, /Morgan Rogers/i);
  const martinez = atClub(db, CHELSEA_ID, /Emiliano Martinez|Emiliano Martínez/i);
  const estevao = atClub(db, CHELSEA_ID, /Estevao|Estêvão/i);
  assert.ok(palmer && caicedo && rogers && martinez && estevao);
  assert.equal(palmer.importanceScore, 100);
  assert.equal(caicedo.primaryPosition, 'DMC');
  assert.equal(rogers.primaryPosition, 'AMC');
  assert.equal(martinez.positionGroup, 'GK');
  assert.equal(estevao.primaryPosition, 'AMR');
  assert.equal(atClub(db, CHELSEA_ID, /Enzo Fern.ndez/i), undefined, 'Enzo Fernández should already have moved to Manchester City in audit v2');
});

test('Tottenham audit moves current arrivals from stale source clubs', () => {
  const db = auditedDb();
  const tonali = atClub(db, TOTTENHAM_ID, /Tonali/i);
  const robertson = atClub(db, TOTTENHAM_ID, /Robertson/i);
  const savio = atClub(db, TOTTENHAM_ID, /Savinho|Savio|Sávio/i);
  const marmoush = atClub(db, TOTTENHAM_ID, /Marmoush/i);
  const tosin = atClub(db, TOTTENHAM_ID, /Adarabioyo|Tosin/i);
  assert.ok(tonali && robertson && savio && marmoush && tosin);
  assert.equal(tonali.primaryPosition, 'DMC');
  assert.ok(tonali.importanceScore >= 95);
  assert.equal(robertson.primaryPosition, 'DL');
  assert.equal(savio.positionGroup, 'ATT');
  assert.equal(marmoush.primaryPosition, 'ST');
  assert.equal(tosin.positionGroup, 'DEF');
});

test('Tottenham confirmed departures and loans are removed from selectable squad', () => {
  const db = auditedDb();
  const squad = selectable(db, TOTTENHAM_ID);
  for (const surname of ['Romero', 'Vicario', 'Pape Matar Sarr', 'Brennan Johnson']) {
    assert.equal(squad.some(player => new RegExp(surname, 'i').test(`${player.name} ${player.lastName || ''}`)), false, `${surname} remained selectable for Tottenham`);
  }
});

test('Newcastle audit reflects rebuild and removes major summer exits', () => {
  const db = auditedDb();
  const botman = atClub(db, NEWCASTLE_ID, /Botman/i);
  const thiaw = atClub(db, NEWCASTLE_ID, /Thiaw/i);
  const dedic = atClub(db, NEWCASTLE_ID, /Dedic|Dedić/i);
  const nico = atClub(db, NEWCASTLE_ID, /Nico Gonzalez|Nico González/i);
  const elanga = atClub(db, NEWCASTLE_ID, /Elanga/i);
  const toure = atClub(db, NEWCASTLE_ID, /Bazoumana Toure|Bazoumana Touré/i);
  assert.ok(botman && thiaw && dedic && nico && elanga && toure);
  assert.equal(dedic.primaryPosition, 'DR');
  assert.equal(nico.primaryPosition, 'DMC');
  assert.equal(elanga.primaryPosition, 'AMR');
  assert.ok(botman.importanceScore >= 90);

  const squad = selectable(db, NEWCASTLE_ID);
  for (const surname of ['Gordon', 'Woltemade', 'Ramsdale', 'Trippier', 'Tonali', 'Bruno Guimaraes', 'Bruno Guimarães']) {
    assert.equal(squad.some(player => new RegExp(surname, 'i').test(`${player.name} ${player.lastName || ''}`)), false, `${surname} remained selectable for Newcastle`);
  }
});

test('Bruno Guimaraes is corrected from Newcastle to Arsenal at runtime', () => {
  const db = auditedDb();
  const bruno = atClub(db, ARSENAL_ID, /Bruno Guimaraes|Bruno Guimarães/i);
  assert.ok(bruno);
  assert.equal(bruno.primaryPosition, 'MC');
  assert.ok(bruno.importanceScore >= 95);
  assert.equal(bruno.shirtNumber, 39);
});
