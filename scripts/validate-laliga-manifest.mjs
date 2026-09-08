#!/usr/bin/env node

import { readFile } from 'node:fs/promises';

const MANIFEST_PATH = process.argv[2] || 'data/import/api-football-spain-2026-27.json';
const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
const errors = [];
const assert = (condition, message) => { if (!condition) errors.push(message); };
const norm = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');

assert(manifest.snapshotSeason === '2026/27', 'snapshotSeason must be 2026/27');
assert(manifest.country === 'Spain', 'country must be Spain');
assert(manifest.countryCode === 'ESP', 'countryCode must be ESP');
assert(manifest.currency === 'EUR', 'currency must be EUR');
assert(manifest.membershipAuthority?.name === 'LALIGA', 'membershipAuthority must be LALIGA');
assert(/^https:\/\/www\.laliga\.com\//.test(manifest.membershipAuthority?.url || ''), 'membershipAuthority URL must point to laliga.com');
assert(manifest.providerPolicy?.provider === 'API-Football', 'providerPolicy must identify API-Football');
assert(manifest.providerPolicy?.badgesIncluded === false, 'official badges must not be imported');
assert(manifest.providerPolicy?.playerPhotosIncluded === false, 'player photos must not be imported');

const league = manifest.leagues?.find(item => item.id === 'esp-la-liga');
assert(Boolean(league), 'esp-la-liga league block is required');
assert(league?.level === 1, 'esp-la-liga must be level 1');
assert(league?.clubs?.length === 20, 'esp-la-liga manifest must contain exactly 20 clubs');

const clubs = league?.clubs || [];
const names = clubs.map(club => club.name);
const officialNames = clubs.map(club => club.officialName);
assert(new Set(names.map(norm)).size === names.length, 'club canonical names must be unique');
assert(new Set(officialNames.map(norm)).size === officialNames.length, 'official club names must be unique');

for (const club of clubs) {
  assert(Boolean(club.name), 'every club needs a canonical name');
  assert(Boolean(club.officialName), `${club.name || 'unknown club'} needs officialName`);
  assert(Array.isArray(club.aliases), `${club.name || 'unknown club'} aliases must be an array`);
  const protectedNames = new Set([norm(club.name), norm(club.officialName)].filter(Boolean));
  const aliasTokens = (club.aliases || []).map(norm).filter(Boolean);
  assert(new Set(aliasTokens).size === aliasTokens.length, `${club.name || 'unknown club'} contains duplicate aliases`);
  assert(aliasTokens.every(alias => !protectedNames.has(alias)), `${club.name || 'unknown club'} contains an alias that duplicates its canonical/official name`);
}

const expectedOfficialNames = [
  'Athletic Club','Atlético de Madrid','CA Osasuna','Celta','Deportivo Alavés','Elche CF','FC Barcelona','Getafe CF','Levante UD','Málaga CF','R. Racing Club','Rayo Vallecano','RC Deportivo','RCD Espanyol de Barcelona','Real Betis','Real Madrid','Real Sociedad','Sevilla FC','Valencia CF','Villarreal CF'
];
assert(JSON.stringify([...officialNames].sort((a,b) => a.localeCompare(b))) === JSON.stringify([...expectedOfficialNames].sort((a,b) => a.localeCompare(b))), 'manifest membership does not match the locked official 2026/27 LALIGA list');

if (errors.length) {
  console.error(`La Liga manifest validation failed with ${errors.length} error(s):`);
  errors.forEach(error => console.error(` - ${error}`));
  process.exit(1);
}

console.log('La Liga 2026/27 manifest validation passed.');
console.log(`Authority: ${manifest.membershipAuthority.name}`);
console.log(`Clubs: ${clubs.length}`);
console.log(`Provider staging: ${manifest.providerPolicy.provider}`);
