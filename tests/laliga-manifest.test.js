import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const manifest = JSON.parse(await readFile(new URL('../data/import/api-football-spain-2026-27.json', import.meta.url), 'utf8'));
const leagues = JSON.parse(await readFile(new URL('../data/current/leagues.json', import.meta.url), 'utf8'));
const norm = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');

const official2026 = [
  'Athletic Club','Atlético de Madrid','CA Osasuna','Celta','Deportivo Alavés','Elche CF','FC Barcelona','Getafe CF','Levante UD','Málaga CF','R. Racing Club','Rayo Vallecano','RC Deportivo','RCD Espanyol de Barcelona','Real Betis','Real Madrid','Real Sociedad','Sevilla FC','Valencia CF','Villarreal CF'
];

test('La Liga manifest locks the authoritative 20-club 2026/27 membership', () => {
  assert.equal(manifest.snapshotSeason, '2026/27');
  assert.equal(manifest.country, 'Spain');
  assert.equal(manifest.countryCode, 'ESP');
  assert.equal(manifest.membershipAuthority.name, 'LALIGA');
  assert.match(manifest.membershipAuthority.url, /^https:\/\/www\.laliga\.com\//);

  const league = manifest.leagues.find(item => item.id === 'esp-la-liga');
  assert.ok(league);
  assert.equal(league.clubs.length, 20);
  assert.deepEqual(
    league.clubs.map(club => club.officialName).sort((a,b) => a.localeCompare(b)),
    official2026.sort((a,b) => a.localeCompare(b))
  );
});

test('La Liga canonical names and provider aliases are collision-free inside each club', () => {
  const clubs = manifest.leagues.find(item => item.id === 'esp-la-liga').clubs;
  assert.equal(new Set(clubs.map(club => norm(club.name))).size, 20);
  for (const club of clubs) {
    const tokens = [club.name, club.officialName, ...club.aliases].map(norm).filter(Boolean);
    assert.equal(new Set(tokens).size, tokens.length, `${club.name} has duplicate normalized aliases`);
  }
});

test('La Liga registry target agrees with the locked import manifest', () => {
  const registry = leagues.find(league => league.id === 'esp-la-liga');
  const manifestLeague = manifest.leagues.find(league => league.id === 'esp-la-liga');
  assert.ok(registry);
  assert.equal(registry.countryCode, 'ESP');
  assert.equal(registry.season, manifest.snapshotSeason);
  assert.equal(registry.expectedClubCount, manifestLeague.clubs.length);
  assert.equal(registry.importStatus, 'pending');
});

test('Spain provider policy forbids badge and player-photo ingestion', () => {
  assert.equal(manifest.providerPolicy.provider, 'API-Football');
  assert.equal(manifest.providerPolicy.badgesIncluded, false);
  assert.equal(manifest.providerPolicy.playerPhotosIncluded, false);
  assert.equal(manifest.providerPolicy.squadEndpoint, '/players/squads');
});
