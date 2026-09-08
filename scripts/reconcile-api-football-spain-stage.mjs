#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const DEFAULT_STAGE_DIR = 'artifacts/api-football-spain-stage-v1';
const DEFAULT_CURRENT_PLAYERS = 'data/current/players.json';
const DEFAULT_CURRENT_CLUBS = 'data/current/clubs.json';
const FIRST_TEAM_MIN_NUMBER = 1;
const FIRST_TEAM_MAX_NUMBER = 25;
const MIN_VALID_AGE = 15;
const MAX_VALID_AGE = 45;
const DEFAULT_MIN_AUTHORITY_PLAYERS = 15;
const EXPECTED_SEASON = '2026/27';

export function normalizeName(value) {
  return String(value || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function normalizeAge(value) {
  const age = Number(value);
  return Number.isInteger(age) && age >= MIN_VALID_AGE && age <= MAX_VALID_AGE ? age : null;
}

export function normalizeShirtNumber(value) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 && number <= 99 ? number : null;
}

export function normalizePlayer(player) {
  return {
    ...player,
    apiFootballId: Number(player?.apiFootballId),
    name: player?.name || null,
    age: normalizeAge(player?.age),
    shirtNumber: normalizeShirtNumber(player?.shirtNumber),
    position: player?.position || null
  };
}

function firstTeamNumber(player) {
  return Number.isInteger(player.shirtNumber)
    && player.shirtNumber >= FIRST_TEAM_MIN_NUMBER
    && player.shirtNumber <= FIRST_TEAM_MAX_NUMBER;
}

function indexCurrentPlayers(players = []) {
  const map = new Map();
  for (const player of players) {
    const providerId = Number(player?.externalIds?.apiFootball);
    if (!Number.isFinite(providerId)) continue;
    if (!map.has(providerId)) map.set(providerId, []);
    map.get(providerId).push(player);
  }
  return map;
}

function indexClubs(clubs = []) {
  return new Map(clubs.map(club => [club.id, club]));
}

function authorityClubMap(authority) {
  if (!authority?.clubs || !Array.isArray(authority.clubs)) return new Map();
  return new Map(authority.clubs.map(club => [normalizeName(club.clubName), club]));
}

function authorityEntryMatchesPlayer(entry, player) {
  const providerId = Number(entry?.apiFootballId);
  if (Number.isFinite(providerId)) return player.apiFootballId === providerId;
  const name = normalizeName(entry?.name);
  return Boolean(name && normalizeName(player.name) === name);
}

function authorityEntryKey(entry) {
  const providerId = Number(entry?.apiFootballId);
  if (Number.isFinite(providerId)) return `id:${providerId}`;
  const name = normalizeName(entry?.name);
  return name ? `name:${name}` : null;
}

function validateAuthorityClub(authorityClub, clubName, minimumAuthorityPlayers) {
  const issues = [];
  const players = Array.isArray(authorityClub?.players) ? authorityClub.players : [];
  if (players.length < minimumAuthorityPlayers || players.length > FIRST_TEAM_MAX_NUMBER) {
    issues.push({
      type: 'authority-squad-size-out-of-range',
      clubName,
      players: players.length,
      expectedMin: minimumAuthorityPlayers,
      expectedMax: FIRST_TEAM_MAX_NUMBER
    });
  }

  const seen = new Map();
  for (const entry of players) {
    const key = authorityEntryKey(entry);
    if (!key) {
      issues.push({ type: 'authority-player-identity-missing', clubName, player: entry });
      continue;
    }
    if (seen.has(key)) {
      issues.push({ type: 'authority-duplicate-player-identity', clubName, key, players: [seen.get(key), entry] });
    } else {
      seen.set(key, entry);
    }

    const shirtNumber = normalizeShirtNumber(entry?.shirtNumber);
    if (!Number.isInteger(shirtNumber) || shirtNumber < FIRST_TEAM_MIN_NUMBER || shirtNumber > FIRST_TEAM_MAX_NUMBER) {
      issues.push({
        type: 'authoritative-first-team-shirt-number-invalid',
        clubName,
        player: { apiFootballId: entry?.apiFootballId ?? null, name: entry?.name ?? null, shirtNumber: entry?.shirtNumber ?? null }
      });
    }
  }
  return issues;
}

export function reconcileSpainStage({
  clubs = [],
  squads = [],
  currentPlayers = [],
  currentClubs = [],
  authority = null,
  minimumAuthorityPlayers = DEFAULT_MIN_AUTHORITY_PLAYERS
} = {}) {
  const currentByApiId = indexCurrentPlayers(currentPlayers);
  const clubsById = indexClubs(currentClubs);
  const authorityByClub = authorityClubMap(authority);
  const authorityConfigured = authority?.source?.authority === 'LALIGA' && authorityByClub.size > 0;

  const reconciledSquads = [];
  const quarantine = [];
  const ownershipMoves = [];
  const candidateCrossLeagueConflicts = [];
  const blockingIssues = [];
  const seenSelectedProviderIds = new Map();
  const normalizedAnomalies = [];

  if (authorityConfigured && authority?.snapshotSeason !== EXPECTED_SEASON) {
    blockingIssues.push({
      type: 'authority-season-invalid',
      expected: EXPECTED_SEASON,
      actual: authority?.snapshotSeason ?? null
    });
  }

  for (const squad of squads) {
    const clubKey = normalizeName(squad.clubName);
    const authorityClub = authorityByClub.get(clubKey) || null;
    const normalized = (squad.players || [])
      .map(player => {
        const clean = normalizePlayer(player);
        if (player?.age !== clean.age || player?.shirtNumber !== clean.shirtNumber) {
          normalizedAnomalies.push({
            clubName: squad.clubName,
            apiFootballId: clean.apiFootballId,
            name: clean.name,
            from: { age: player?.age ?? null, shirtNumber: player?.shirtNumber ?? null },
            to: { age: clean.age, shirtNumber: clean.shirtNumber }
          });
        }
        return clean;
      })
      .filter(player => Number.isFinite(player.apiFootballId));

    let selected = [];
    let membershipVerified = false;

    if (authorityConfigured) {
      if (!authorityClub || !Array.isArray(authorityClub.players)) {
        blockingIssues.push({ type: 'club-authority-missing', clubName: squad.clubName });
        for (const player of normalized) {
          quarantine.push({
            clubName: squad.clubName,
            apiFootballTeamId: squad.apiFootballTeamId,
            player,
            reason: 'club-missing-authoritative-first-team-snapshot'
          });
        }
      } else {
        membershipVerified = true;
        blockingIssues.push(...validateAuthorityClub(authorityClub, squad.clubName, minimumAuthorityPlayers));
        const usedProviderIds = new Set();

        for (const entry of authorityClub.players) {
          const matches = normalized.filter(player => authorityEntryMatchesPlayer(entry, player));
          if (matches.length === 0) {
            blockingIssues.push({
              type: 'authority-player-not-found-in-provider-stage',
              clubName: squad.clubName,
              player: entry
            });
            continue;
          }
          if (matches.length > 1) {
            blockingIssues.push({
              type: 'authority-player-match-ambiguous',
              clubName: squad.clubName,
              player: entry,
              matches: matches.map(player => ({ apiFootballId: player.apiFootballId, name: player.name }))
            });
            continue;
          }

          const matched = matches[0];
          usedProviderIds.add(matched.apiFootballId);
          selected.push({
            ...matched,
            shirtNumber: normalizeShirtNumber(entry.shirtNumber),
            position: entry.position || matched.position || null,
            reconciliationSource: {
              membership: 'LALIGA',
              sourceUrl: authorityClub.sourceUrl || authority?.source?.url || null,
              providerIdentity: 'API-Football'
            }
          });
        }

        for (const player of normalized) {
          if (!usedProviderIds.has(player.apiFootballId)) {
            quarantine.push({
              clubName: squad.clubName,
              apiFootballTeamId: squad.apiFootballTeamId,
              player,
              reason: 'not-in-authoritative-first-team-snapshot'
            });
          }
        }
      }
    } else {
      // Candidate mode only: useful for auditing provider contamination, never for promotion.
      selected = normalized.filter(firstTeamNumber);
      for (const player of normalized) {
        if (!firstTeamNumber(player)) {
          quarantine.push({
            clubName: squad.clubName,
            apiFootballTeamId: squad.apiFootballTeamId,
            player,
            reason: player.shirtNumber == null ? 'missing-or-invalid-shirt-number' : 'outside-first-team-number-range'
          });
        }
      }
    }

    const numberGroups = new Map();
    for (const player of selected) {
      if (!Number.isInteger(player.shirtNumber)) continue;
      if (!numberGroups.has(player.shirtNumber)) numberGroups.set(player.shirtNumber, []);
      numberGroups.get(player.shirtNumber).push(player);
    }
    for (const [shirtNumber, players] of [...numberGroups.entries()].filter(([, rows]) => rows.length > 1)) {
      blockingIssues.push({
        type: 'duplicate-first-team-shirt-number',
        clubName: squad.clubName,
        shirtNumber,
        players: players.map(player => ({ apiFootballId: player.apiFootballId, name: player.name, age: player.age, position: player.position }))
      });
    }

    const dedupedSelected = [];
    const selectedIds = new Set();
    for (const player of selected) {
      if (selectedIds.has(player.apiFootballId)) continue;
      selectedIds.add(player.apiFootballId);
      dedupedSelected.push(player);

      const otherSpainClub = seenSelectedProviderIds.get(player.apiFootballId);
      if (otherSpainClub && otherSpainClub !== squad.clubName) {
        blockingIssues.push({
          type: 'cross-spain-player-identity-conflict',
          apiFootballId: player.apiFootballId,
          name: player.name,
          clubs: [otherSpainClub, squad.clubName]
        });
      } else {
        seenSelectedProviderIds.set(player.apiFootballId, squad.clubName);
      }

      const existing = currentByApiId.get(player.apiFootballId) || [];
      const targetClubId = `flm-club-api-football-${squad.apiFootballTeamId}`;
      if (existing.length > 1 && membershipVerified) {
        blockingIssues.push({
          type: 'current-database-duplicate-api-football-identity',
          apiFootballId: player.apiFootballId,
          playerIds: existing.map(record => record.id || null)
        });
      }

      for (const record of existing) {
        if (!record.clubId || record.clubId === targetClubId) continue;
        const move = {
          apiFootballId: player.apiFootballId,
          playerId: record.id || `flm-player-api-football-${player.apiFootballId}`,
          name: player.name || record.name || null,
          fromClubId: record.clubId,
          fromClubName: clubsById.get(record.clubId)?.name || null,
          toClubId: targetClubId,
          toClubName: squad.clubName,
          action: membershipVerified ? 'move-existing-identity' : 'candidate-ownership-conflict',
          duplicateCreateAllowed: false
        };
        if (membershipVerified) ownershipMoves.push(move);
        else candidateCrossLeagueConflicts.push(move);
      }
    }

    reconciledSquads.push({
      ...squad,
      reconciliation: {
        mode: membershipVerified ? 'authoritative-membership' : (authorityConfigured ? 'authority-missing-blocked' : 'provider-number-candidate-only'),
        authority: authorityClub?.sourceUrl || authority?.source?.url || null,
        stagedPlayers: normalized.length,
        selectedPlayers: dedupedSelected.length,
        quarantinedPlayers: normalized.length - dedupedSelected.length
      },
      players: dedupedSelected
    });
  }

  if (!authorityConfigured) {
    blockingIssues.unshift({
      type: 'authoritative-first-team-membership-not-provided',
      message: 'API-Football /players/squads mixes first-team and reserve/youth identities and its shirt numbers are not authoritative. A complete 2026/27 LaLiga first-team membership snapshot is required before promotion.'
    });
  }

  const expectedClubKeys = new Set(clubs.map(club => normalizeName(club.canonicalName || club.officialName || club.providerName)));
  const stagedClubKeys = new Set(reconciledSquads.map(squad => normalizeName(squad.clubName)));
  if (clubs.length && reconciledSquads.length !== clubs.length) {
    blockingIssues.push({ type: 'club-squad-coverage-mismatch', clubs: clubs.length, squads: reconciledSquads.length });
  }
  for (const key of expectedClubKeys) {
    if (key && !stagedClubKeys.has(key)) blockingIssues.push({ type: 'club-missing-reconciled-squad', clubKey: key });
  }

  if (authorityConfigured) {
    for (const [key, authorityClub] of authorityByClub) {
      if (key && !stagedClubKeys.has(key)) {
        blockingIssues.push({ type: 'authority-club-not-in-stage', clubName: authorityClub.clubName || key });
      }
    }
  }

  const duplicateOwnershipMoves = ownershipMoves
    .map(move => `${move.apiFootballId}:${move.fromClubId}:${move.toClubId}`)
    .filter((key, index, all) => all.indexOf(key) !== index);
  if (duplicateOwnershipMoves.length) {
    blockingIssues.push({ type: 'duplicate-ownership-move', keys: [...new Set(duplicateOwnershipMoves)] });
  }

  const report = {
    generatedAt: new Date().toISOString(),
    policy: {
      expectedSeason: EXPECTED_SEASON,
      firstTeamRegistrationNumbers: [FIRST_TEAM_MIN_NUMBER, FIRST_TEAM_MAX_NUMBER],
      providerSquadEndpointTrustedForFirstTeamMembership: false,
      authoritativeMembershipRequiredForPromotion: true,
      authorityShirtNumberOverridesProvider: true,
      minimumAuthorityPlayers,
      invalidAgeRange: { min: MIN_VALID_AGE, max: MAX_VALID_AGE, replacement: null }
    },
    authority: {
      configured: authorityConfigured,
      authority: authority?.source?.authority || null,
      snapshotSeason: authority?.snapshotSeason || null,
      clubsProvided: authorityByClub.size
    },
    result: {
      clubsReconciled: reconciledSquads.length,
      playersStaged: squads.reduce((sum, squad) => sum + (squad.players || []).length, 0),
      playersSelected: reconciledSquads.reduce((sum, squad) => sum + squad.players.length, 0),
      playersQuarantined: quarantine.length,
      ownershipMoves: ownershipMoves.length,
      candidateCrossLeagueConflicts: candidateCrossLeagueConflicts.length,
      normalizedAnomalies: normalizedAnomalies.length
    },
    promotion: {
      ready: blockingIssues.length === 0,
      blockingIssues
    },
    safety: {
      writesCurrentDatabase: false,
      duplicateIdentityCreationAllowed: false,
      preservesQuarantinedProviderRows: true,
      candidateOwnershipConflictsAreActionable: false
    }
  };

  return { reconciledSquads, quarantine, ownershipMoves, candidateCrossLeagueConflicts, normalizedAnomalies, report };
}

export function assertPromotionReady(report) {
  if (!report?.promotion?.ready) {
    const issues = report?.promotion?.blockingIssues || [];
    throw new Error(`La Liga promotion blocked by ${issues.length} reconciliation issue(s): ${issues.map(issue => issue.type).join(', ')}`);
  }
}

async function readJson(file, fallback = undefined) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch (error) {
    if (fallback !== undefined && error?.code === 'ENOENT') return fallback;
    throw error;
  }
}

async function cli() {
  const args = process.argv.slice(2);
  const strictIndex = args.indexOf('--require-promotion-ready');
  const strict = strictIndex !== -1;
  if (strict) args.splice(strictIndex, 1);

  const stageDir = args[0] || DEFAULT_STAGE_DIR;
  const outDir = args[1] || path.join(stageDir, 'reconciled');
  const authorityPath = process.env.FLM_LALIGA_SQUAD_AUTHORITY || null;
  const currentPlayersPath = process.env.FLM_CURRENT_PLAYERS || DEFAULT_CURRENT_PLAYERS;
  const currentClubsPath = process.env.FLM_CURRENT_CLUBS || DEFAULT_CURRENT_CLUBS;

  const [clubs, squads, currentPlayers, currentClubs, authority] = await Promise.all([
    readJson(path.join(stageDir, 'clubs-stage.json')),
    readJson(path.join(stageDir, 'squads-stage.json')),
    readJson(currentPlayersPath, []),
    readJson(currentClubsPath, []),
    authorityPath ? readJson(authorityPath) : Promise.resolve(null)
  ]);

  const result = reconcileSpainStage({ clubs, squads, currentPlayers, currentClubs, authority });
  await mkdir(outDir, { recursive: true });
  await Promise.all([
    writeFile(path.join(outDir, 'squads-reconciled.json'), `${JSON.stringify(result.reconciledSquads, null, 2)}\n`),
    writeFile(path.join(outDir, 'quarantine.json'), `${JSON.stringify(result.quarantine, null, 2)}\n`),
    writeFile(path.join(outDir, 'ownership-moves.json'), `${JSON.stringify(result.ownershipMoves, null, 2)}\n`),
    writeFile(path.join(outDir, 'candidate-cross-league-conflicts.json'), `${JSON.stringify(result.candidateCrossLeagueConflicts, null, 2)}\n`),
    writeFile(path.join(outDir, 'normalized-anomalies.json'), `${JSON.stringify(result.normalizedAnomalies, null, 2)}\n`),
    writeFile(path.join(outDir, 'reconciliation-report.json'), `${JSON.stringify(result.report, null, 2)}\n`)
  ]);

  console.log(`Reconciled ${result.report.result.clubsReconciled} La Liga squads.`);
  console.log(`Selected ${result.report.result.playersSelected}/${result.report.result.playersStaged} staged players; quarantined ${result.report.result.playersQuarantined}.`);
  console.log(`Authoritative ownership moves: ${result.report.result.ownershipMoves}. Candidate cross-league conflicts: ${result.report.result.candidateCrossLeagueConflicts}.`);
  console.log(`Promotion ready: ${result.report.promotion.ready ? 'YES' : 'NO'} (${result.report.promotion.blockingIssues.length} blocker(s)).`);

  if (strict) assertPromotionReady(result.report);
}

const isMain = process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url;
if (isMain) {
  cli().catch(error => {
    console.error(error.stack || error.message || error);
    process.exit(1);
  });
}
