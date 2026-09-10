/* Football Lab Manager — game economy integrity v1
 * Canonical player market values + sane manager wages.
 * Runs entirely against the already-loaded in-memory database so player cards stay instant.
 */
(() => {
  'use strict';

  const VERSION = '1.0.0';
  const SAVE_KEY = 'flm-career-save';
  const REVIEW_DATE = '2026-09-10';
  const VALUE_CURVE = Object.freeze([
    [70, 100_000], [80, 250_000], [90, 500_000], [100, 1_000_000],
    [110, 2_000_000], [120, 4_000_000], [130, 8_000_000], [140, 15_000_000],
    [150, 28_000_000], [160, 48_000_000], [170, 80_000_000], [180, 125_000_000],
    [190, 180_000_000]
  ]);

  let wrapped = false;
  let dbCache = null;
  let repairQueued = false;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const manager = () => window.FLMManager || null;
  const career = () => manager()?.activeCareer || null;

  function numeric(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value !== 'string') return null;
    const cleaned = value.trim().toUpperCase().replace(/[£,$\s]/g, '');
    const match = cleaned.match(/^([\d.]+)([KMB])?$/);
    if (!match) return null;
    const amount = Number(match[1]);
    if (!Number.isFinite(amount)) return null;
    const multiplier = match[2] === 'B' ? 1_000_000_000 : match[2] === 'M' ? 1_000_000 : match[2] === 'K' ? 1_000 : 1;
    return amount * multiplier;
  }

  function ageFor(player, snapshot = '2026-09-04') {
    if (player?.dateOfBirth) {
      const dob = new Date(`${player.dateOfBirth}T00:00:00Z`);
      const ref = new Date(`${snapshot}T00:00:00Z`);
      if (!Number.isNaN(dob.getTime()) && !Number.isNaN(ref.getTime())) {
        let age = ref.getUTCFullYear() - dob.getUTCFullYear();
        if (ref.getUTCMonth() < dob.getUTCMonth() || (ref.getUTCMonth() === dob.getUTCMonth() && ref.getUTCDate() < dob.getUTCDate())) age -= 1;
        return age;
      }
    }
    const reported = Number(player?.reportedAge);
    return Number.isFinite(reported) ? reported : 25;
  }

  function abilityFallback(player) {
    const values = Object.values(player?.attributes || {})
      .flatMap(group => Object.values(group || {}))
      .map(Number)
      .filter(Number.isFinite);
    if (!values.length) return 100;
    return clamp((values.reduce((sum, value) => sum + value, 0) / values.length) * 10, 60, 190);
  }

  function abilityFor(player) {
    const current = Number(player?.currentAbility);
    return Number.isFinite(current) && current > 0 ? clamp(current, 40, 200) : abilityFallback(player);
  }

  function potentialFor(player, current) {
    const potential = Number(player?.potentialAbility);
    return Number.isFinite(potential) && potential > 0 ? clamp(Math.max(current, potential), current, 200) : current;
  }

  function curveValue(ability) {
    if (ability <= VALUE_CURVE[0][0]) {
      return VALUE_CURVE[0][1] * (0.65 + 0.35 * clamp(ability, 0, VALUE_CURVE[0][0]) / VALUE_CURVE[0][0]);
    }
    if (ability >= VALUE_CURVE.at(-1)[0]) {
      return VALUE_CURVE.at(-1)[1] * (1 + 0.015 * (ability - VALUE_CURVE.at(-1)[0]));
    }
    for (let i = 0; i < VALUE_CURVE.length - 1; i += 1) {
      const [a0, v0] = VALUE_CURVE[i];
      const [a1, v1] = VALUE_CURVE[i + 1];
      if (ability >= a0 && ability <= a1) {
        const t = (ability - a0) / (a1 - a0);
        return v0 + (v1 - v0) * t;
      }
    }
    return 1_000_000;
  }

  function ageMultiplier(age) {
    if (age <= 19) return 1.15;
    if (age <= 22) return 1.25;
    if (age <= 25) return 1.15;
    if (age <= 28) return 1.00;
    if (age <= 30) return 0.85;
    if (age <= 32) return 0.65;
    if (age <= 34) return 0.45;
    return 0.25;
  }

  function potentialMultiplier(age, current, potential) {
    const gap = Math.max(0, potential - current);
    if (age <= 22) return 1 + Math.min(0.75, gap / 60);
    if (age <= 25) return 1 + Math.min(0.35, gap / 90);
    if (age <= 27) return 1 + Math.min(0.15, gap / 120);
    return 1;
  }

  function positionMultiplier(player) {
    const group = String(player?.positionGroup || '').toUpperCase();
    if (group === 'GK') return 0.78;
    if (group === 'DEF') return 0.92;
    if (group === 'ATT') return 1.08;
    return 1;
  }

  function roundValue(value) {
    const safe = clamp(value, 100_000, 200_000_000);
    const step = safe < 1_000_000 ? 50_000 : safe < 10_000_000 ? 250_000 : safe < 50_000_000 ? 500_000 : 1_000_000;
    return Math.round(safe / step) * step;
  }

  function explicitValue(player) {
    const candidates = [
      ['audited', player?.auditedMarketValue],
      ['existing', player?.marketValueGBP],
      ['existing', player?.marketValue],
      ['existing', player?.transfer?.marketValue],
      ['audit-floor', player?.audit?.valueFloor]
    ];
    for (const [source, raw] of candidates) {
      const value = numeric(raw);
      if (Number.isFinite(value) && value > 0) return { value, source };
    }
    return null;
  }

  function estimatePlayerValue(player, metadata = {}) {
    const exact = explicitValue(player);
    if (exact) return { value: roundValue(exact.value), source: exact.source };

    const current = abilityFor(player);
    const potential = potentialFor(player, current);
    const age = ageFor(player, metadata.snapshotDate || '2026-09-04');
    const raw = curveValue(current)
      * ageMultiplier(age)
      * potentialMultiplier(age, current, potential)
      * positionMultiplier(player);

    return { value: roundValue(raw), source: 'football-lab-valuation-engine' };
  }

  function formatMarketValue(value) {
    const amount = Math.max(0, Number(value) || 0);
    if (amount >= 1_000_000) {
      const millions = amount / 1_000_000;
      const digits = millions < 10 && Math.abs(millions - Math.round(millions)) > 0.001 ? 1 : 0;
      return `£${millions.toFixed(digits)}M`;
    }
    return `£${Math.round(amount / 1_000)}K`;
  }

  function valueTier(value) {
    if (value >= 110_000_000) return 'elite';
    if (value >= 70_000_000) return 'star';
    if (value >= 35_000_000) return 'high-value';
    if (value >= 15_000_000) return 'established';
    if (value >= 5_000_000) return 'squad-value';
    return 'development';
  }

  function applyPlayerValues(db) {
    if (!db?.players) return db;
    for (const player of db.players) {
      if (!player || player.isPlaceholder) continue;
      const estimate = estimatePlayerValue(player, db.metadata || {});
      player.marketValueGBP = estimate.value;
      // The current profile renderer treats estimatedValue as its display label.
      player.estimatedValue = formatMarketValue(estimate.value);
      player.marketValueTier = valueTier(estimate.value);
      player.valuation = {
        ...(player.valuation || {}),
        currency: 'GBP',
        amount: estimate.value,
        display: player.estimatedValue,
        source: estimate.source,
        modelVersion: VERSION,
        calibratedAt: REVIEW_DATE
      };
    }
    db.__flmEconomyValues = VERSION;
    return db;
  }

  function normalizedClubReputation(club) {
    const raw = Number(club?.reputation);
    if (!Number.isFinite(raw) || raw <= 0) return 50;
    return clamp(raw > 100 ? raw / 100 : raw, 25, 100);
  }

  function managerWeeklyWage(c, db) {
    const club = db?.clubs?.find(item => item.id === c?.clubId);
    const clubScore = normalizedClubReputation(club);
    const experience = clamp(Number(c?.managerProfile?.startingReputation) || 50, 20, 85);
    // Deliberately conservative: manager salary is flavour, not a club-finance exploit.
    // Typical starting range lands around £15k–£35k/week instead of seven figures.
    return Math.round(clamp(9_000 + clubScore * 120 + experience * 140, 15_000, 40_000) / 500) * 500;
  }

  function fullDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return value || '30 June 2029';
    return new Intl.DateTimeFormat('en-GB', { day:'numeric', month:'long', year:'numeric', timeZone:'UTC' })
      .format(new Date(`${value}T12:00:00Z`));
  }

  function formatMoney(value) {
    return new Intl.NumberFormat('en-GB', { style:'currency', currency:'GBP', maximumFractionDigits:0 }).format(Number(value) || 0);
  }

  function repairManagerEconomy(db) {
    const c = career();
    if (!c || !db) return false;

    const wage = managerWeeklyWage(c, db);
    let changed = false;
    const sourceDate = String(c.currentDate || c.createdAt || '2026-06-05').slice(0, 10);
    const year = /^\d{4}/.test(sourceDate) ? Number(sourceDate.slice(0, 4)) : 2026;

    if (!c.managerContract) {
      c.managerContract = {
        weeklyWage: wage,
        startDate: /^\d{4}-\d{2}-\d{2}$/.test(sourceDate) ? sourceDate : `${year}-06-05`,
        endDate: `${year + 3}-06-30`,
        years: 3
      };
      changed = true;
    } else if (Number(c.managerContract.weeklyWage) !== wage) {
      c.managerContract.weeklyWage = wage;
      changed = true;
    }

    if (c.managerProfile?.contract && Number(c.managerProfile.contract.weeklyWage) !== wage) {
      c.managerProfile.contract.weeklyWage = wage;
      changed = true;
    }

    const welcome = c.news?.items?.find(item => item?.key === 'welcome');
    if (welcome && typeof welcome.body === 'string') {
      const club = db.clubs?.find(item => item.id === c.clubId);
      const managerName = c.managerProfile?.name || c.managerName || 'Manager';
      const endDate = c.managerContract?.endDate || `${year + 3}-06-30`;
      const nextBody = `On behalf of the board, welcome to ${club?.name || 'the club'}, ${managerName}. We are delighted to have you as our manager and believe you are the right person to lead the team forward. Your contract has been signed until ${fullDate(endDate)} on a salary of ${formatMoney(wage)} per week. The board looks forward to seeing your plans take shape on the pitch.`;
      if (welcome.body !== nextBody) {
        welcome.body = nextBody;
        changed = true;
      }
    }

    const salaryPattern = /salary of £[\d,]+(?:\.\d+)? per week/gi;
    document.querySelectorAll('.career-inbox-detail p').forEach(node => {
      const next = node.textContent.replace(salaryPattern, `salary of ${formatMoney(wage)} per week`);
      if (next !== node.textContent) node.textContent = next;
    });

    if (changed) {
      try {
        c.updatedAt = new Date().toISOString();
        localStorage.setItem(SAVE_KEY, JSON.stringify(c));
      } catch (error) {
        console.warn('FLM economy save repair failed:', error);
      }
    }
    return changed;
  }

  function queueRepair() {
    if (repairQueued) return;
    repairQueued = true;
    requestAnimationFrame(() => {
      repairQueued = false;
      if (dbCache) repairManagerEconomy(dbCache);
    });
  }

  function install() {
    const mgr = manager();
    if (!mgr?.loadDatabase || wrapped) return false;
    const baseLoadDatabase = mgr.loadDatabase.bind(mgr);
    mgr.loadDatabase = async (...args) => {
      const db = applyPlayerValues(await baseLoadDatabase(...args));
      dbCache = db;
      repairManagerEconomy(db);
      return db;
    };
    wrapped = true;
    mgr.loadDatabase().then(db => {
      dbCache = db;
      repairManagerEconomy(db);
    }).catch(error => console.error('FLM economy init failed:', error));
    return true;
  }

  if (!install()) {
    const wait = setInterval(() => {
      if (install()) clearInterval(wait);
    }, 25);
    setTimeout(() => clearInterval(wait), 10_000);
  }

  new MutationObserver(queueRepair).observe(document.body, { childList:true, subtree:true });
  ['flm:career-opened','flm:career-created','flm:career-data-refresh','flm:career-sync-complete']
    .forEach(name => document.addEventListener(name, queueRepair));

  window.FLMGameEconomy = Object.freeze({
    version: VERSION,
    estimatePlayerValue,
    formatMarketValue,
    managerWeeklyWage,
    refresh: queueRepair
  });
})();
