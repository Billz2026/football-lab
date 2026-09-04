#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
import process from 'node:process';

const ROOT = process.argv[2] || 'data/current';

async function readJson(name) {
  return JSON.parse(await readFile(`${ROOT}/${name}`, 'utf8'));
}

function assert(condition, message, errors) {
  if (!condition) errors.push(message);
}

function uniqueIds(items, label, errors) {
  const seen = new Set();
  items.forEach(item => {
    assert(Boolean(item.id), `${label} record missing id`, errors);
    assert(!seen.has(item.id), `${label} duplicate id: ${item.id}`, errors);
    seen.add(item.id);
  });
  return seen;
}

function validateAttributes(player, errors) {
  const blocks = player.attributes || {};
  ['technical', 'mental', 'physical'].forEach(blockName => {
    const block = blocks[blockName];
    assert(block && typeof block === 'object', `${player.id} missing ${blockName} attributes`, errors);
    if (!block || typeof block !== 'object') return;
    Object.entries(block).forEach(([name, value]) => {
      assert(Number.isInteger(value) && value >= 1 && value <= 20, `${player.id} ${blockName}.${name} must be 1-20`, errors);
    });
  });
}

async function main() {
  const [metadata, leagues, clubs, players, managers] = await Promise.all([
    readJson('metadata.json'),
    readJson('leagues.json'),
    readJson('clubs.json'),
    readJson('players.json'),
    readJson('managers.json')
  ]);

  const errors = [];
  const leagueIds = uniqueIds(leagues, 'league', errors);
  const clubIds = uniqueIds(clubs, 'club', errors);
  uniqueIds(players, 'player', errors);
  uniqueIds(managers, 'manager', errors);
  const externalPlayerIds = new Set();

  assert(metadata.schemaVersion === '1.0.0', 'metadata.schemaVersion must be 1.0.0', errors);
  assert(metadata.scope?.targetClubCount === 116, 'metadata targetClubCount must be 116 for the England v1 scope', errors);
  assert(leagues.length === 5, 'England v1 must define exactly five target leagues', errors);

  clubs.forEach(club => {
    assert(leagueIds.has(club.leagueId), `${club.id} references unknown league ${club.leagueId}`, errors);
  });

  players.forEach(player => {
    assert(clubIds.has(player.clubId), `${player.id} references unknown club ${player.clubId}`, errors);
    assert(['GK', 'DEF', 'MID', 'ATT'].includes(player.positionGroup), `${player.id} has invalid positionGroup ${player.positionGroup}`, errors);
    assert(Boolean(player.primaryPosition), `${player.id} is missing a primary position`, errors);
    assert(Number.isInteger(player.currentAbility) && player.currentAbility >= 1 && player.currentAbility <= 200, `${player.id} currentAbility must be 1-200`, errors);
    assert(Number.isInteger(player.potentialAbility) && player.potentialAbility >= 1 && player.potentialAbility <= 200, `${player.id} potentialAbility must be 1-200`, errors);
    assert(player.potentialAbility >= player.currentAbility - 20, `${player.id} potentialAbility is implausibly below currentAbility`, errors);
    validateAttributes(player, errors);
    const externalId = player.externalIds?.apiFootball;
    if (externalId != null) {
      assert(!externalPlayerIds.has(externalId), `duplicate API-Football player id: ${externalId}`, errors);
      externalPlayerIds.add(externalId);
    }
  });

  const playableIds = metadata.playableDemo?.clubIds || [];
  assert(playableIds.length === 8, 'V0.3 playableDemo must freeze exactly eight clubs', errors);
  assert(new Set(playableIds).size === playableIds.length, 'playableDemo contains duplicate club ids', errors);
  playableIds.forEach(clubId => {
    const club = clubs.find(item => item.id === clubId);
    const squad = players.filter(player => player.clubId === clubId && !player.isPlaceholder);
    assert(Boolean(club) && !club?.isPlaceholder, `playableDemo references missing or placeholder club ${clubId}`, errors);
    assert(squad.length >= 18, `${clubId} needs at least 18 real players for the playable demo`, errors);
    assert(squad.filter(player => player.positionGroup === 'GK').length >= 1, `${clubId} needs a goalkeeper`, errors);
    assert(squad.filter(player => player.positionGroup === 'DEF').length >= 4, `${clubId} needs at least four defenders`, errors);
    assert(squad.filter(player => player.positionGroup === 'MID').length >= 3, `${clubId} needs at least three midfielders`, errors);
    assert(squad.filter(player => player.positionGroup === 'ATT').length >= 2, `${clubId} needs at least two attackers`, errors);
  });

  managers.forEach(manager => {
    if (manager.clubId !== null) assert(clubIds.has(manager.clubId), `${manager.id} references unknown club ${manager.clubId}`, errors);
  });

  if (errors.length) {
    console.error(`FLM database validation failed with ${errors.length} error(s):`);
    errors.forEach(error => console.error(` - ${error}`));
    process.exit(1);
  }

  console.log('Football Lab Manager database validation passed.');
  console.log(`Schema: ${metadata.schemaVersion}`);
  console.log(`Database: ${metadata.databaseVersion}`);
  console.log(`Leagues: ${leagues.length}`);
  console.log(`Clubs: ${clubs.length} (${clubs.filter(club => club.isPlaceholder).length} placeholders)`);
  console.log(`Players: ${players.length} (${players.filter(player => player.isPlaceholder).length} placeholders)`);
  console.log(`Managers: ${managers.length}`);
}

main().catch(error => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});
