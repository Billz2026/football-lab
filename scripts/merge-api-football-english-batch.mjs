#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const BATCH_DIR = process.argv[2] || 'artifacts/api-football-english-db-v1';
const CURRENT_DIR = process.argv[3] || 'data/current';
const OUT_DIR = process.argv[4] || path.join(BATCH_DIR, 'merged-current');

const readJson = async file => JSON.parse(await readFile(file, 'utf8'));
const writeJson = async (name, value) => writeFile(path.join(OUT_DIR, name), JSON.stringify(value, null, 2) + '\n');

function byName(a,b) { return String(a.name || '').localeCompare(String(b.name || '')); }

function resolvePlayerDuplicates(records) {
  const byId = new Map();
  const conflicts = [];

  for (const player of records) {
    const existing = byId.get(player.id);
    if (!existing) {
      byId.set(player.id, player);
      continue;
    }

    if (existing.clubId === player.clubId) {
      const preferred = existing.shirtNumber == null && player.shirtNumber != null ? player : existing;
      byId.set(player.id, preferred);
      continue;
    }

    let preferred = player;
    if (existing.shirtNumber != null && player.shirtNumber == null) preferred = existing;
    else if (existing.shirtNumber == null && player.shirtNumber != null) preferred = player;

    const conflictingClubIds = [...new Set([
      ...(existing.dataQuality?.conflictingClubIds || []),
      ...(player.dataQuality?.conflictingClubIds || []),
      existing.clubId,
      player.clubId
    ])];

    preferred = {
      ...preferred,
      dataQuality: {
        ...(preferred.dataQuality || {}),
        squadMembershipConflict: true,
        conflictingClubIds,
        squadMembershipResolution: 'Prefer record with a shirt number; otherwise prefer the newer incoming batch record.',
        confidence: 'low'
      }
    };
    byId.set(player.id, preferred);
    conflicts.push({ playerId:player.externalIds?.apiFootball ?? player.id, playerName:player.name, conflictingClubIds, selectedClubId:preferred.clubId });
  }

  return {
    players:[...byId.values()],
    conflicts:[...new Map(conflicts.map(item => [String(item.playerId), item])).values()]
  };
}

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
  const resolved = resolvePlayerDuplicates([...keptPlayers, ...batchPlayers]);
  const mergedPlayers = resolved.players.sort((a,b) => a.clubId.localeCompare(b.clubId) || byName(a,b));

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
    importProgress: Object.fromEntries(mergedLeagues.map(l => [l.id, { realClubs:realCounts.get(l.id) || 0, expectedClubs:l.expectedClubCount, status:l.importStatus }])),
    dataQuality: {
      ...(metadata.dataQuality || {}),
      latestBatchMembershipConflicts: report.result?.squadMembershipConflicts || 0,
      crossBatchMembershipConflictsResolved: resolved.conflicts.length
    }
  };

  await mkdir(OUT_DIR, { recursive:true });
  await Promise.all([
    writeJson('metadata.json', mergedMetadata),
    writeJson('leagues.json', mergedLeagues),
    writeJson('clubs.json', mergedClubs),
    writeJson('players.json', mergedPlayers),
    writeJson('managers.json', managers),
    writeJson('membership-conflicts.json', resolved.conflicts)
  ]);

  console.log(`Merged preview: ${mergedClubs.filter(c => !c.isPlaceholder).length} real clubs, ${mergedPlayers.filter(p => !p.isPlaceholder).length} unique real players.`);
  if (resolved.conflicts.length) console.log(`Resolved ${resolved.conflicts.length} cross-batch player membership conflict(s).`);
}

main().catch(error => { console.error(error.stack || error); process.exit(1); });
