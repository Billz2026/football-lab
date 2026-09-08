import {
  augmentDatabaseForCareer,
  nextSeasonLabel,
  rolloverPremierLeagueSeason,
  validatePremierLeagueRollover
} from './premier-league-rollover-v1.js';
import { migrateRolloverCalendar } from './season-rollover-calendar-migration-v1.js';

const SAVE_KEY = 'flm-career-save';
const STYLE_ID = 'flm-season-rollover-v2-style';
let queued = false;
let running = false;
let browserDb = null;

const manager = () => window.FLMManager || null;
const career = () => manager()?.activeCareer || null;
const esc = value => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .flm-rollover-panel{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:center;margin:16px 0 0;padding:16px 18px;border:1px solid #2b63a4;background:linear-gradient(135deg,#071c38,#061326);box-shadow:inset 4px 0 #55dc7c}
    .flm-rollover-panel small{display:block;color:#55dc7c;font-size:8px;font-weight:950;letter-spacing:.12em}.flm-rollover-panel strong{display:block;margin-top:5px;color:#f2f6f8;font-size:15px}.flm-rollover-panel p{margin:5px 0 0;color:#91a8ba;font-size:10px;line-height:1.55}.flm-rollover-panel button{min-height:42px;padding:0 16px;border:1px solid #f4c342;background:#f4c342;color:#071326;font-size:9px;font-weight:950;letter-spacing:.04em;cursor:pointer}.flm-rollover-panel button:hover,.flm-rollover-panel button:focus-visible{background:#ffd75e;outline:none}.flm-rollover-panel button:disabled{opacity:.45;cursor:not-allowed}.flm-rollover-panel.is-blocked{box-shadow:inset 4px 0 #de6f78;border-color:#7b3945}.flm-rollover-panel.is-blocked small{color:#ff8f98}.flm-rollover-toast{position:fixed;left:50%;bottom:28px;z-index:10000;transform:translateX(-50%);padding:11px 15px;border:1px solid #55dc7c;background:#071c38;color:#eef3f6;font-size:10px;font-weight:850;box-shadow:0 12px 40px #0008}.flm-rollover-toast.is-error{border-color:#de6f78;color:#ffb0b5}@media(max-width:700px){.flm-rollover-panel{grid-template-columns:1fr}.flm-rollover-panel button{width:100%}}
  `;
  document.head.appendChild(style);
}

function toast(message, error = false) {
  document.querySelector('.flm-rollover-toast')?.remove();
  const node = document.createElement('div');
  node.className = `flm-rollover-toast${error ? ' is-error' : ''}`;
  node.textContent = message;
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 3600);
}

async function loadDb() {
  if (browserDb) return browserDb;
  const api = manager();
  if (!api?.loadDatabase) return null;
  browserDb = await api.loadDatabase();
  return browserDb;
}

function savedCareer() {
  try {
    return JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
  } catch {
    return null;
  }
}

async function primeSavedBackground() {
  const saved = savedCareer();
  if (!saved?.backgroundPlayers?.length && !saved?.seasonClubs?.some?.(club => club?.backgroundGenerated)) return;
  const db = await loadDb();
  if (db) augmentDatabaseForCareer(saved, db);
}

function persist(c) {
  if (!c) return;
  c.updatedAt = new Date().toISOString();
  localStorage.setItem(SAVE_KEY, JSON.stringify(c));
  const status = document.querySelector('[data-career-save-status]');
  if (status) status.textContent = 'SAVED';
}

function panelCopy(c, validation) {
  const source = c?.season || 'Current season';
  const target = nextSeasonLabel(c?.season) || 'Next season';
  if (validation.ok) {
    return {
      eyebrow: 'SEASON ROLLOVER READY',
      title: `${source} → ${target}`,
      body: 'Replace the bottom three with the Championship promoted clubs, preserve background squads, reset the table and create the next Premier League offseason.',
      button: `START ${target}`,
      blocked: false
    };
  }
  if (validation.status === 'managed-club-relegated') {
    return {
      eyebrow: 'CAREER PATH BLOCKED',
      title: 'Your club has been relegated',
      body: 'The save will not cheat by keeping your club in the Premier League. Playable Championship careers must be built before this path can continue.',
      button: 'CHAMPIONSHIP NOT PLAYABLE YET',
      blocked: true
    };
  }
  if (validation.status === 'lower-pyramid-not-ready') {
    return {
      eyebrow: 'LOWER PYRAMID BOUNDARY',
      title: `${target} membership is not complete`,
      body: validation.reason || 'The lower divisions need another feeder layer before this Premier League rollover can be generated honestly.',
      button: 'LOWER PYRAMID NOT READY',
      blocked: true
    };
  }
  return {
    eyebrow: 'SEASON ROLLOVER UNAVAILABLE',
    title: 'Next season is not ready',
    body: validation.reason || 'The season rollover prerequisites have not been met.',
    button: 'ROLLOVER UNAVAILABLE',
    blocked: true
  };
}

async function performRollover() {
  if (running) return;
  const c = career();
  const db = await loadDb();
  if (!c || !db) return;
  running = true;
  try {
    const source = c.season;
    const target = nextSeasonLabel(source);
    const result = rolloverPremierLeagueSeason(c, { db });
    if (result.status !== 'rolled-over' && result.status !== 'already-rolled-over') {
      toast(result.reason || 'Season rollover could not be completed.', true);
      return;
    }
    augmentDatabaseForCareer(c, db);
    persist(c);
    toast(result.status === 'rolled-over' ? `${target} offseason created.` : `${c.season} is already active.`);
    document.querySelector('.career-nav [data-career-tab="overview"]')?.click();
    queueSync();
  } catch (error) {
    console.error(error);
    toast(error?.message || 'Season rollover failed.', true);
  } finally {
    running = false;
  }
}

async function sync() {
  ensureStyles();
  const c = career();
  const existing = document.querySelector('.flm-rollover-panel');
  if (!c) {
    existing?.remove();
    return;
  }
  const db = await loadDb();
  if (!db) return;
  augmentDatabaseForCareer(c, db);

  // One-time compatibility migration for untouched saves created by the original
  // 2027/28 direct-to-opening-day rollover build.
  const migration = migrateRolloverCalendar(c, db);
  if (migration.status === 'migrated') {
    persist(c);
    toast(`${c.season} offseason calendar restored.`);
  }

  if ((c.competitionId || c.leagueId) !== 'eng-premier-league' || c.status !== 'complete') {
    existing?.remove();
    return;
  }
  const content = document.querySelector('.career-content');
  if (!content) return;

  const validation = validatePremierLeagueRollover(c, db);
  const copy = panelCopy(c, validation);
  const signature = [c.season, validation.status, copy.title, copy.body, copy.button, copy.blocked].join('|');
  let panel = existing;
  if (!panel || !panel.isConnected) {
    panel = document.createElement('section');
    panel.className = 'flm-rollover-panel';
    panel.dataset.flmRollover = '1';
    content.appendChild(panel);
  } else if (panel.parentElement !== content) {
    content.appendChild(panel);
  }
  if (panel.dataset.signature === signature) return;

  panel.dataset.signature = signature;
  panel.className = `flm-rollover-panel${copy.blocked ? ' is-blocked' : ''}`;
  panel.innerHTML = `<div><small>${esc(copy.eyebrow)}</small><strong>${esc(copy.title)}</strong><p>${esc(copy.body)}</p></div><button type="button" ${copy.blocked ? 'disabled' : ''}>${esc(copy.button)}</button>`;
  if (!copy.blocked) panel.querySelector('button')?.addEventListener('click', performRollover);
}

function queueSync() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    sync().catch(error => console.error(error));
  });
}

primeSavedBackground().catch(error => console.error(error));
queueSync();
new MutationObserver(queueSync).observe(document.body, { childList: true, subtree: true });
