#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const BATCH_DIR = process.argv[2] || 'artifacts/api-football-english-db-v1';
const CURRENT_DIR = process.argv[3] || 'data/current';
const OUT_DIR = process.argv[4] || path.join(BATCH_DIR, 'merged-current');

const readJson = async file => JSON.parse(await readFile(file, 'utf8'));
const writeJson = async (name, value) => writeFile(path.join(OUT_DIR, name), JSON.stringify(value, null, 2) + '\n');

function byName(a,b) { return String(a.name || '').localeCompare(String(b.name || '')); }

async function main() {
  const [metadata, leagues, clubs, players, managers, batchClubs, batchPlayers, report] = await Promise.all([
    readJson(path.join(CURRENT_DIR,'metadata.json')),
    readJson(path.join(CURRENT_DIR,'leagues.json')),
    readJson(path.join(CURRENT_DIR,'clubs.json')),
    readJson(path.join(CURRENT_DIR,'players.json')),
    readJson(path.join(CURRENT_DIR,'managers.json')),
    readJson(path.join(BATCH_DIR,'clubs-batch.json')),
    readJson(path.join(BATCH_DIR,'players-batch.json')),
    readJson(path.join(BATCH_DIR,'report.json'))
  ]);

  const incomingApiIds = new Set(batchClubs.map(c => String(c.externalIds?.apiFootball ?? '')));
  const incomingNames = new Set(batchClubs.map(c => c.name));
  const keptClubs = clubs.filter(c => {
    const apiId = String(c.externalIds?.apiFootball ?? '');
    return !(apiId && incomingApiIds.has(apiId)) && !incomingNames.has(c.name);
  });
  const mergedClubs = [...keptClubs, ...batchClubs].sort((a,b) => a.leagueId.localeCompare(b.leagueId) || byName(a,b));

  const incomingPlayerApiIds = new Set(batchPlayers.map(p => String(p.externalIds?.apiFootball ?? '')));
  const importedClubIds = new Set(batchClubs.map(c => c.id));
  const keptPlayers = players.filter(p => {
    const apiId = String(p.externalIds?.apiFootball ?? '');
    return !(apiId && incomingPlayerApiIds.has(apiId)) && !importedClubIds.has(p.clubId);
  });
  const mergedPlayers = [...keptPlayers, ...batchPlayers].sort((a,b) => a.clubId.localeCompare(b.clubId) || byName(a,b));

  const realCounts = new Map();
  for (const club of mergedClubs.filter(c => !c.isPlaceholder)) realCounts.set(club.leagueId, (realCounts.get(club.leagueId) || 0) + 1);
  const mergedLeagues = leagues.map(league => {
    const count = realCounts.get(league.id) || 0;
    const status = count >= league.expectedClubCount ? 'complete' : count > 0 ? 'partial' : league.importStatus || 'pending';
    const externalIds = { ...(league.externalIds || {}) };
    if (league.id === 'eng-premier-league') externalIds.apiFootball = 39;
    if (league.id === 'eng-championship') externalIds.apiFootball = 40;
    return { ...league, externalIds, importStatus:status };
  });

  const mergedMetadata = {
    ...metadata,
    databaseVersion: `${metadata.snapshotDate || '2026.09.04'}-api-football-dev`,
    status: 'partial-current-squad-development',
    generatedAt: report.generatedAt,
    provider: 'API-Football Free + Football Lab Manager baseline engine',
    warning: 'Development snapshot: imported names, broad positions, reported ages and squad membership come from API-Football seasonless squad endpoints. 2026/27 season statistics are not available on the free tier, so attributes are clearly marked low-confidence FLM positional baselines rather than claimed real-world ratings.',
    licensing: {
      ...(metadata.licensing || {}),
      officialBadgesIncluded:false,
      playerPhotosIncluded:false,
      notes:'Development database only. No provider logos or player photos are stored. Publication/competition-rights requirements must be reviewed before a commercial release.'
    },
    importProgress: Object.fromEntries(mergedLeagues.map(l => [l.id, { realClubs:realCounts.get(l.id) || 0, expectedClubs:l.expectedClubCount, status:l.importStatus }]))
  };

  await mkdir(OUT_DIR, { recursive:true });
  await Promise.all([
    writeJson('metadata.json', mergedMetadata),
    writeJson('leagues.json', mergedLeagues),
    writeJson('clubs.json', mergedClubs),
    writeJson('players.json', mergedPlayers),
    writeJson('managers.json', managers)
  ]);

  console.log(`Merged preview: ${mergedClubs.filter(c => !c.isPlaceholder).length} real clubs, ${mergedPlayers.filter(p => !p.isPlaceholder).length} real players.`);
}

main().catch(error => { console.error(error.stack || error); process.exit(1); });
