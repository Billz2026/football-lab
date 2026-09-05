#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const root = process.cwd();
const auditDir = path.join(root, 'data', 'audit', 'england', '2026-09-05');
const overlayPath = path.join(auditDir, 'qa', 'market-values-2026-09-05.json');
const reportPath = path.join(auditDir, 'qa', 'premier-league-validation-report.json');

const POSITION_CODES = new Set(['GK','DC','DL','DR','WBL','WBR','DMC','MC','AMC','ML','MR','AML','AMR','SS','ST']);
const GROUP_ALLOWED = {
  GK: new Set(['GK']),
  DEF: new Set(['DC','DL','DR','WBL','WBR']),
  MID: new Set(['DMC','MC','AMC','ML','MR','AML','AMR']),
  ATT: new Set(['AML','AMR','SS','ST'])
};

function normalizeName(value) {
  return String(value || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]/g, '');
}

function loadJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function isLoanOut(player) {
  return String(player?.loanStatus || '').toLowerCase().startsWith('loan-out');
}

function activePlayers(doc) {
  if (Array.isArray(doc.players)) return doc.players.filter(p => !isLoanOut(p));
  return [
    ...(Array.isArray(doc.seniorPlayers) ? doc.seniorPlayers : []),
    ...(Array.isArray(doc.firstTeamRelevantU21) ? doc.firstTeamRelevantU21 : [])
  ].filter(p => !isLoanOut(p));
}

function playerAliases(player) {
  return [player.name, ...(Array.isArray(player.aliases) ? player.aliases : [])].filter(Boolean);
}

function marketLookup(overlay, clubName, player) {
  if (Object.prototype.hasOwnProperty.call(player, 'referenceMarketValueEur')) {
    return { found: true, value: player.referenceMarketValueEur, source: 'club-file' };
  }
  const record = overlay?.clubs?.[clubName]?.players?.[player.name];
  if (record && Object.prototype.hasOwnProperty.call(record, 'referenceMarketValueEur')) {
    return { found: true, value: record.referenceMarketValueEur, source: 'overlay', status: record.status, note: record.note };
  }
  return { found: false };
}

function main() {
  if (!fs.existsSync(auditDir)) throw new Error(`Audit directory not found: ${auditDir}`);
  const overlay = fs.existsSync(overlayPath) ? loadJson(overlayPath) : { clubs: {} };
  const files = fs.readdirSync(auditDir)
    .filter(name => name.endsWith('.json') && name !== 'premier-league-audit-status.json')
    .sort();

  const errors = [];
  const warnings = [];
  const clubs = [];
  const identityIndex = new Map();
  let activePlayerCount = 0;
  let verifiedValueCount = 0;
  let explicitNullValueCount = 0;
  let missingValueCount = 0;

  for (const fileName of files) {
    const filePath = path.join(auditDir, fileName);
    const doc = loadJson(filePath);
    if (!doc.clubName) continue;
    const players = activePlayers(doc);
    activePlayerCount += players.length;
    clubs.push({ club: doc.clubName, file: fileName, activePlayers: players.length });

    const shirtIndex = new Map();
    for (const player of players) {
      if (!player.name) {
        errors.push({ type: 'missing-name', club: doc.clubName, file: fileName });
        continue;
      }

      const aliases = playerAliases(player);
      const canonical = normalizeName(player.name);
      for (const alias of aliases) {
        const key = normalizeName(alias);
        if (!key) continue;
        const prior = identityIndex.get(key);
        if (prior && prior.club !== doc.clubName) {
          errors.push({ type: 'cross-club-active-identity', identity: alias, clubs: [prior.club, doc.clubName], players: [prior.name, player.name] });
        } else if (!prior) {
          identityIndex.set(key, { club: doc.clubName, name: player.name });
        }
      }

      if (player.shirtNumber !== null && player.shirtNumber !== undefined) {
        const shirt = String(player.shirtNumber);
        const prior = shirtIndex.get(shirt);
        if (prior && normalizeName(prior) !== canonical) {
          errors.push({ type: 'duplicate-shirt-number', club: doc.clubName, shirtNumber: player.shirtNumber, players: [prior, player.name] });
        } else {
          shirtIndex.set(shirt, player.name);
        }
      }

      const allPositions = [player.primaryPosition, ...(Array.isArray(player.secondaryPositions) ? player.secondaryPositions : [])].filter(Boolean);
      for (const pos of allPositions) {
        if (!POSITION_CODES.has(pos)) errors.push({ type: 'invalid-position-code', club: doc.clubName, player: player.name, position: pos });
      }
      if (!player.positionGroup || !GROUP_ALLOWED[player.positionGroup]) {
        errors.push({ type: 'invalid-position-group', club: doc.clubName, player: player.name, positionGroup: player.positionGroup ?? null });
      } else if (player.primaryPosition && !GROUP_ALLOWED[player.positionGroup].has(player.primaryPosition)) {
        errors.push({ type: 'position-group-mismatch', club: doc.clubName, player: player.name, primaryPosition: player.primaryPosition, positionGroup: player.positionGroup });
      }

      const value = marketLookup(overlay, doc.clubName, player);
      if (!value.found) {
        missingValueCount++;
        errors.push({ type: 'missing-market-benchmark', club: doc.clubName, player: player.name });
      } else if (value.value === null) {
        explicitNullValueCount++;
        warnings.push({ type: 'explicit-unvalued-market-benchmark', club: doc.clubName, player: player.name, note: value.note || 'Benchmark provider lists no current value.' });
      } else if (typeof value.value !== 'number' || value.value < 0 || !Number.isFinite(value.value)) {
        errors.push({ type: 'invalid-market-benchmark', club: doc.clubName, player: player.name, value: value.value });
      } else {
        verifiedValueCount++;
      }
    }
  }

  if (clubs.length !== 20) errors.push({ type: 'club-count', expected: 20, actual: clubs.length });

  const report = {
    generatedAt: new Date().toISOString(),
    auditDate: '2026-09-05',
    season: '2026/27',
    status: errors.length === 0 ? 'pass' : 'fail',
    summary: {
      clubFiles: clubs.length,
      activePlayers: activePlayerCount,
      verifiedMarketValues: verifiedValueCount,
      explicitUnvaluedMarketValues: explicitNullValueCount,
      missingMarketValues: missingValueCount,
      errors: errors.length,
      warnings: warnings.length
    },
    clubs,
    errors,
    warnings
  };

  const argWrite = process.argv.includes('--write-report');
  if (argWrite) {
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');
  }
  console.log(JSON.stringify(report, null, 2));
  process.exitCode = errors.length === 0 ? 0 : 1;
}

main();
