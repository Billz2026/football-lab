import {
  SAVE_KEY,
  autoPickLineup,
  createCareer,
  getNextFixture,
  parseCareer,
  serializeCareer,
  simulateNextRound,
  sortedTable,
  updateLineup,
  updateTactics,
  validateLineup
} from './manager-core.js?v=0.3.0';

const DATA_VERSION = '60';
const modal = document.getElementById('appModal');
const modalCard = modal.querySelector('.modal-card');
const modalTitle = document.getElementById('modalTitle');
const modalEyebrow = document.getElementById('modalEyebrow');
const modalCopy = document.getElementById('modalCopy');
const modalBody = document.getElementById('modalBody');
const modalActions = document.getElementById('modalActions');
const settingsTemplate = document.getElementById('settingsTemplate');
let databasePromise;
let activeCareer;
let activeCareerTab = 'overview';

const settings = {
  autosave: localStorage.getItem('flm-autosave') !== 'false',
  reducedMotion: localStorage.getItem('flm-reduced-motion') === 'true',
  compact: localStorage.getItem('flm-compact') === 'true'
};

function esc(value) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');
}

function button(label, className = '', handler) {
  const element = document.createElement('button');
  element.type = 'button';
  element.textContent = label;
  if (className) element.className = className;
  if (handler) element.addEventListener('click', handler);
  return element;
}

function applySettings() {
  document.body.classList.toggle('reduced-motion', settings.reducedMotion);
  document.body.classList.toggle('compact', settings.compact);
}

function openModal({ eyebrow = 'FOOTBALL LAB MANAGER', title, copy = '', body, actions = [], wide = false }) {
  modalEyebrow.textContent = eyebrow;
  modalTitle.textContent = title;
  modalCopy.textContent = copy;
  modalBody.replaceChildren();
  modalActions.replaceChildren();
  modalCard.classList.toggle('modal-wide', wide);
  if (typeof body === 'string') modalBody.innerHTML = body;
  else if (body) modalBody.appendChild(body);
  actions.forEach(action => modalActions.appendChild(button(action.label, action.primary ? 'action-gold' : '', action.onClick)));
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  modalCard.classList.remove('modal-wide');
  document.body.style.overflow = '';
}

function notice(title, message) {
  const panel = document.createElement('div');
  panel.className = 'notice-panel';
  panel.innerHTML = `<strong>${esc(title)}</strong><p>${esc(message)}</p>`;
  return panel;
}

async function loadDatabase() {
  if (!databasePromise) {
    const names = ['metadata', 'leagues', 'clubs', 'players', 'managers'];
    databasePromise = Promise.all(names.map(name => fetch(`./data/current/${name}.json?v=${DATA_VERSION}`, { cache: 'no-store' }).then(response => {
      if (!response.ok) throw new Error(`Could not load ${name}.json (${response.status})`);
      return response.json();
    }))).then(([metadata, leagues, clubs, players, managers]) => ({ metadata, leagues, clubs, players, managers }));
  }
  return databasePromise;
}

function getClub(db, clubId) {
  return db.clubs.find(club => club.id === clubId);
}

function playableClubs(db) {
  const ids = new Set(db.metadata.playableDemo?.clubIds || []);
  const selected = db.clubs.filter(club => ids.has(club.id) && !club.isPlaceholder);
  return selected.length ? selected : db.clubs.filter(club => !club.isPlaceholder).slice(0, 8);
}

function clubName(db, clubId) {
  const club = getClub(db, clubId);
  return club?.shortName || club?.name || 'Unknown club';
}

function saveCareer() {
  if (!activeCareer) return;
  activeCareer.updatedAt = new Date().toISOString();
  localStorage.setItem(SAVE_KEY, serializeCareer(activeCareer));
  const status = document.querySelector('[data-career-save-status]');
  if (status) status.textContent = 'SAVED';
}

function resultSummary(result, db) {
  if (!result) return '';
  const isHome = result.homeClubId === activeCareer.clubId;
  const forGoals = isHome ? result.homeGoals : result.awayGoals;
  const againstGoals = isHome ? result.awayGoals : result.homeGoals;
  const outcome = forGoals > againstGoals ? 'WIN' : forGoals < againstGoals ? 'LOSS' : 'DRAW';
  return `${outcome} · ${clubName(db, result.homeClubId)} ${result.homeGoals}–${result.awayGoals} ${clubName(db, result.awayClubId)}`;
}

function toast(message, error = false) {
  document.querySelector('.career-toast')?.remove();
  const element = document.createElement('div');
  element.className = `career-toast${error ? ' is-error' : ''}`;
  element.textContent = message;
  document.body.appendChild(element);
  requestAnimationFrame(() => element.classList.add('is-visible'));
  setTimeout(() => element.remove(), 2600);
}

function shell() {
  let element = document.getElementById('careerApp');
  if (!element) {
    element = document.createElement('section');
    element.id = 'careerApp';
    element.className = 'career-app';
    element.setAttribute('aria-label', 'Football Lab career');
    document.body.appendChild(element);
  }
  return element;
}

function navigation() {
  return [['overview', 'Overview'], ['squad', 'Squad'], ['tactics', 'Tactics'], ['matchday', 'Matchday'], ['table', 'Table']]
    .map(([id, label]) => `<button type="button" class="career-nav-button ${activeCareerTab === id ? 'is-active' : ''}" data-career-tab="${id}">${label}</button>`).join('');
}

function overviewView(db) {
  const club = getClub(db, activeCareer.clubId);
  const next = getNextFixture(activeCareer);
  const rows = sortedTable(activeCareer.table);
  const row = rows.find(item => item.clubId === activeCareer.clubId);
  const position = rows.indexOf(row) + 1;
  return `
    <div class="career-page-heading"><div><p class="eyebrow">MANAGER DASHBOARD</p><h2>${esc(club.name)}</h2></div><span class="career-round">${activeCareer.status === 'complete' ? 'SEASON COMPLETE' : `ROUND ${activeCareer.roundIndex + 1} OF ${activeCareer.fixtures.length}`}</span></div>
    <div class="career-kpi-grid">
      <article><small>POSITION</small><strong>${row.played ? position : '—'}</strong><span>${row.points} points</span></article>
      <article><small>RECORD</small><strong>${row.won}-${row.drawn}-${row.lost}</strong><span>W-D-L</span></article>
      <article><small>GOAL DIFFERENCE</small><strong>${row.goalDifference > 0 ? '+' : ''}${row.goalDifference}</strong><span>${row.goalsFor} scored</span></article>
      <article><small>FORMATION</small><strong>${esc(activeCareer.tactics.formation)}</strong><span>${esc(activeCareer.tactics.mentality)}</span></article>
    </div>
    <div class="career-dashboard-grid">
      <article class="career-panel career-next-match"><p class="eyebrow">NEXT FIXTURE</p>${next ? `<div class="fixture-teams"><strong>${esc(clubName(db, next.homeClubId))}</strong><span>VS</span><strong>${esc(clubName(db, next.awayClubId))}</strong></div><small>${next.homeClubId === activeCareer.clubId ? club.venue || 'Home' : 'Away'} · Round ${next.round}</small><button class="career-primary" type="button" data-career-tab="matchday">GO TO MATCHDAY</button>` : '<h3>INVITATIONAL COMPLETE</h3><p>Your seven-match demo season is finished.</p><button class="career-primary" type="button" data-career-tab="table">FINAL TABLE</button>'}</article>
      <article class="career-panel"><p class="eyebrow">LAST RESULT</p>${activeCareer.lastMatch ? `<h3>${esc(resultSummary(activeCareer.lastMatch, db))}</h3><p>${activeCareer.lastMatch.events.length} key events recorded.</p>` : '<h3>NO MATCHES PLAYED</h3><p>Select your team and begin the Invitational.</p>'}</article>
    </div>`;
}

function squadView(db) {
  const order = { GK: 0, DEF: 1, MID: 2, ATT: 3 };
  const squad = db.players.filter(player => player.clubId === activeCareer.clubId && !player.isPlaceholder)
    .sort((a, b) => order[a.positionGroup] - order[b.positionGroup] || (b.currentAbility || 0) - (a.currentAbility || 0));
  const selected = new Set(activeCareer.lineupIds);
  return `
    <div class="career-page-heading"><div><p class="eyebrow">TEAM SELECTION</p><h2>Starting XI</h2></div><div class="lineup-counter ${selected.size === 11 ? 'is-valid' : ''}" data-lineup-counter>${selected.size} / 11 SELECTED</div></div>
    <div class="career-squad-actions"><button type="button" class="career-secondary" data-auto-pick>AUTO PICK BEST XI</button><span>Select exactly 11 players, including a goalkeeper.</span></div>
    <div class="career-squad-list">${squad.map(player => {
      const status = activeCareer.playerStatus[player.id] || { condition: 100, sharpness: 88, morale: 'Good' };
      return `<label class="career-player-row ${selected.has(player.id) ? 'is-selected' : ''}"><input type="checkbox" value="${esc(player.id)}" ${selected.has(player.id) ? 'checked' : ''} data-lineup-player><span class="career-player-position">${esc(player.primaryPosition)}</span><span class="career-player-name"><strong>${esc(player.name)}</strong><small>${esc(status.morale)} · ${status.sharpness}% sharp</small></span><span><small>CON</small><strong>${status.condition}%</strong></span><span><small>CA</small><strong>${player.currentAbility || '—'}</strong></span><button type="button" class="career-profile-link" data-player-profile="${esc(player.id)}" aria-label="Open ${esc(player.name)} profile">PROFILE</button></label>`;
    }).join('')}</div>`;
}

function selectField(label, key, values) {
  return `<label class="career-tactic-field"><span>${label}</span><select data-tactic="${key}">${values.map(value => `<option ${activeCareer.tactics[key] === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label>`;
}

function tacticsView() {
  return `
    <div class="career-page-heading"><div><p class="eyebrow">MATCH PLAN</p><h2>Tactics</h2></div><span class="career-round">SIMPLE CHOICES. REAL TRADE-OFFS.</span></div>
    <div class="career-tactics-grid">
      <div class="career-pitch formation-${activeCareer.tactics.formation.replaceAll('-', '')}"><div class="career-pitch-box top"></div><div class="career-pitch-circle"></div><div class="career-pitch-box bottom"></div>${Array.from({ length: 11 }, (_, index) => `<i class="career-dot dot-${index + 1}">${index + 1}</i>`).join('')}</div>
      <div class="career-panel career-tactic-controls">${selectField('FORMATION', 'formation', ['4-3-3', '4-2-3-1', '4-4-2'])}${selectField('MENTALITY', 'mentality', ['Defensive', 'Balanced', 'Attacking'])}${selectField('PRESSING', 'pressing', ['Low', 'Standard', 'High'])}<div class="career-tactic-note"><strong>TRADE-OFF</strong><p>Attacking creates more threat but exposes your defence. High pressing adds intensity and fatigue.</p></div><button type="button" class="career-primary" data-save-tactics>SAVE MATCH PLAN</button></div>
    </div>`;
}

function matchdayView(db) {
  const next = getNextFixture(activeCareer);
  if (!next) return `<div class="career-complete"><p class="eyebrow">FULL TIME</p><h2>Invitational complete.</h2><p>You completed Football Lab's first playable management loop.</p><button class="career-primary" type="button" data-career-tab="table">VIEW FINAL TABLE</button></div>`;
  const home = getClub(db, next.homeClubId);
  const away = getClub(db, next.awayClubId);
  const lineup = validateLineup(activeCareer.lineupIds, db.players, activeCareer.clubId);
  return `
    <div class="career-page-heading"><div><p class="eyebrow">ROUND ${next.round}</p><h2>Matchday</h2></div><span class="career-round">KEY EVENTS SIMULATION</span></div>
    <div class="career-match-card"><div class="career-match-team"><span>${esc((home.shortName || home.name).slice(0, 3).toUpperCase())}</span><strong>${esc(home.name)}</strong><small>${esc(home.venue || 'Home')}</small></div><div class="career-match-vs"><span>VS</span><small>${esc(activeCareer.tactics.formation)} · ${esc(activeCareer.tactics.mentality)}</small></div><div class="career-match-team"><span>${esc((away.shortName || away.name).slice(0, 3).toUpperCase())}</span><strong>${esc(away.name)}</strong><small>Away</small></div></div>
    <div class="career-match-actions"><div><strong>${lineup.valid ? 'TEAM READY' : 'TEAM NOT READY'}</strong><span>${lineup.valid ? 'Starting XI and match plan locked.' : esc(lineup.errors.join(' '))}</span></div><button class="career-primary career-play-button" type="button" data-play-match ${lineup.valid ? '' : 'disabled'}>PLAY MATCH</button></div>
    ${activeCareer.lastMatch ? `<div class="career-commentary"><p class="eyebrow">PREVIOUS MATCH</p><h3>${esc(resultSummary(activeCareer.lastMatch, db))}</h3>${activeCareer.lastMatch.events.map(event => `<div><b>${event.minute}'</b><span>${esc(event.text)}</span></div>`).join('') || '<p>No major incidents.</p>'}</div>` : ''}`;
}

function tableView(db) {
  return `
    <div class="career-page-heading"><div><p class="eyebrow">FOOTBALL LAB INVITATIONAL</p><h2>League Table</h2></div><span class="career-round">${activeCareer.roundIndex} / ${activeCareer.fixtures.length} ROUNDS</span></div>
    <div class="career-table-wrap"><table class="career-table"><thead><tr><th>#</th><th>Club</th><th>P</th><th>W</th><th>D</th><th>L</th><th>GF</th><th>GA</th><th>GD</th><th>PTS</th></tr></thead><tbody>${sortedTable(activeCareer.table).map((row, index) => `<tr class="${row.clubId === activeCareer.clubId ? 'is-user' : ''}"><td>${index + 1}</td><td>${esc(clubName(db, row.clubId))}</td><td>${row.played}</td><td>${row.won}</td><td>${row.drawn}</td><td>${row.lost}</td><td>${row.goalsFor}</td><td>${row.goalsAgainst}</td><td>${row.goalDifference > 0 ? '+' : ''}${row.goalDifference}</td><td><strong>${row.points}</strong></td></tr>`).join('')}</tbody></table></div>`;
}

async function renderCareer() {
  const db = await loadDatabase();
  const element = shell();
  const club = getClub(db, activeCareer.clubId);
  const views = { overview: () => overviewView(db), squad: () => squadView(db), tactics: tacticsView, matchday: () => matchdayView(db), table: () => tableView(db) };
  element.innerHTML = `
    <header class="career-header"><button type="button" class="career-brand" data-exit-career><span>FL</span><strong>FOOTBALL LAB <em>MANAGER</em></strong></button><div class="career-club"><small>${esc(activeCareer.competitionName)}</small><strong>${esc(club.name)}</strong></div><div class="career-header-actions"><span data-career-save-status>${settings.autosave ? 'AUTOSAVE ON' : 'MANUAL SAVE'}</span><button type="button" data-save-career>SAVE</button><button type="button" data-exit-career>EXIT</button></div></header>
    <div class="career-layout"><nav class="career-nav" aria-label="Career sections">${navigation()}</nav><main class="career-content">${views[activeCareerTab]()}</main></div>`;
  element.classList.add('is-open');
  element.removeAttribute('aria-hidden');
  document.body.style.overflow = 'hidden';

  element.querySelectorAll('[data-career-tab]').forEach(control => control.addEventListener('click', () => { activeCareerTab = control.dataset.careerTab; renderCareer(); }));
  element.querySelectorAll('[data-exit-career]').forEach(control => control.addEventListener('click', () => { if (settings.autosave) saveCareer(); element.classList.remove('is-open'); element.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; }));
  element.querySelector('[data-save-career]')?.addEventListener('click', () => { saveCareer(); toast('Career saved on this device.'); });
  element.querySelector('[data-auto-pick]')?.addEventListener('click', () => { activeCareer = updateLineup(activeCareer, autoPickLineup(db.players, activeCareer.clubId), db.players); if (settings.autosave) saveCareer(); renderCareer(); });
  element.querySelectorAll('[data-lineup-player]').forEach(input => input.addEventListener('change', () => {
    const selected = [...element.querySelectorAll('[data-lineup-player]:checked')].map(item => item.value);
    if (selected.length > 11) { input.checked = false; toast('A starting XI can only contain 11 players.', true); return; }
    const valid = validateLineup(selected, db.players, activeCareer.clubId);
    const counter = element.querySelector('[data-lineup-counter]');
    counter.textContent = `${selected.length} / 11 SELECTED`;
    counter.classList.toggle('is-valid', valid.valid);
    input.closest('.career-player-row').classList.toggle('is-selected', input.checked);
    if (valid.valid) { activeCareer = updateLineup(activeCareer, selected, db.players); if (settings.autosave) saveCareer(); toast('Starting XI saved.'); }
  }));
  element.querySelectorAll('[data-player-profile]').forEach(control => control.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); window.FLMPlayerProfile?.open(control.dataset.playerProfile); }));
  element.querySelector('[data-save-tactics]')?.addEventListener('click', () => { const tactics = Object.fromEntries([...element.querySelectorAll('[data-tactic]')].map(field => [field.dataset.tactic, field.value])); activeCareer = updateTactics(activeCareer, tactics); if (settings.autosave) saveCareer(); toast('Match plan saved.'); renderCareer(); });
  element.querySelector('[data-play-match]')?.addEventListener('click', () => { try { activeCareer = simulateNextRound(activeCareer, db); if (settings.autosave) saveCareer(); renderCareer(); toast(resultSummary(activeCareer.lastMatch, db)); } catch (error) { toast(error.message, true); } });
}

async function beginCareer(clubId) {
  const db = await loadDatabase();
  activeCareer = createCareer({ clubId, clubs: playableClubs(db), players: db.players });
  activeCareerTab = 'overview';
  saveCareer();
  closeModal();
  await renderCareer();
}

async function showNewGame() {
  openModal({ eyebrow: '01 · NEW CAREER', title: 'CHOOSE YOUR CLUB', copy: 'Begin a seven-match playable career. Choosing a club replaces the current local save.', body: notice('LOADING PLAYABLE CLUBS', 'Preparing the Football Lab Invitational.'), wide: true, actions: [{ label: 'CANCEL', onClick: closeModal }] });
  try {
    const db = await loadDatabase();
    const grid = document.createElement('div');
    grid.className = 'career-club-grid';
    grid.innerHTML = playableClubs(db).map(club => `<button type="button" data-start-club="${esc(club.id)}"><span>${esc((club.shortName || club.name).slice(0, 3).toUpperCase())}</span><strong>${esc(club.name)}</strong><small>${esc(club.venue || 'Stadium pending')}</small><em>TAKE CONTROL →</em></button>`).join('');
    modalBody.replaceChildren(grid);
    grid.querySelectorAll('[data-start-club]').forEach(control => control.addEventListener('click', () => beginCareer(control.dataset.startClub)));
  } catch (error) { modalBody.innerHTML = `<div class="db-empty"><strong>CAREER COULD NOT START</strong><br>${esc(error.message)}</div>`; }
}

async function showQuickStart() {
  try {
    const db = await loadDatabase();
    const club = playableClubs(db).find(item => item.name === 'Arsenal') || playableClubs(db)[0];
    await beginCareer(club.id);
  } catch (error) { openModal({ eyebrow: '02 · FAST TRACK', title: 'QUICK START FAILED', copy: error.message, body: notice('DATABASE REQUIRED', 'The playable club database could not be loaded.'), actions: [{ label: 'CLOSE', onClick: closeModal }] }); }
}

async function showLoadGame() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) {
    openModal({ eyebrow: '03 · CONTINUE', title: 'LOAD GAME', copy: 'There are no careers saved on this device yet.', body: notice('NO SAVES YET', 'Start a career and progress will appear here.'), actions: [{ label: 'START NEW GAME', primary: true, onClick: showNewGame }, { label: 'CLOSE', onClick: closeModal }] });
    return;
  }
  try {
    const db = await loadDatabase();
    activeCareer = parseCareer(raw, db);
    const club = getClub(db, activeCareer.clubId);
    openModal({ eyebrow: '03 · CONTINUE', title: 'LOAD GAME', copy: 'A playable V0.3 career was found on this device.', body: notice(`${club.name} · ${activeCareer.season}`, `Round ${Math.min(activeCareer.roundIndex + 1, activeCareer.fixtures.length)} of ${activeCareer.fixtures.length}`), actions: [{ label: 'CONTINUE CAREER', primary: true, onClick: () => { closeModal(); activeCareerTab = 'overview'; renderCareer(); } }, { label: 'CLOSE', onClick: closeModal }] });
  } catch (error) { openModal({ eyebrow: '03 · CONTINUE', title: 'SAVE UNAVAILABLE', copy: error.message, body: notice('SAVE SAFETY CHECK FAILED', 'Start a new V0.3 career.'), actions: [{ label: 'START NEW GAME', primary: true, onClick: showNewGame }, { label: 'CLOSE', onClick: closeModal }] }); }
}

function showSettings() {
  const container = document.createElement('div');
  container.appendChild(settingsTemplate.content.cloneNode(true));
  const autosave = container.querySelector('#settingAutosave');
  const motion = container.querySelector('#settingMotion');
  const compact = container.querySelector('#settingCompact');
  autosave.checked = settings.autosave; motion.checked = settings.reducedMotion; compact.checked = settings.compact;
  openModal({ eyebrow: '04 · CONFIGURATION', title: 'GAME SETTINGS', copy: 'Settings are stored locally on this device.', body: container, actions: [{ label: 'SAVE SETTINGS', primary: true, onClick: () => { settings.autosave = autosave.checked; settings.reducedMotion = motion.checked; settings.compact = compact.checked; localStorage.setItem('flm-autosave', String(settings.autosave)); localStorage.setItem('flm-reduced-motion', String(settings.reducedMotion)); localStorage.setItem('flm-compact', String(settings.compact)); applySettings(); closeModal(); } }, { label: 'CANCEL', onClick: closeModal }] });
}

function showHallOfFame() {
  openModal({ eyebrow: '05 · LEGACY', title: 'HALL OF FAME', copy: 'Permanent managerial records arrive after the full-season foundation.', body: notice('YOUR FIRST CAREER IS PLAYABLE', 'Finish the seven-match Invitational and prove the core loop.'), actions: [{ label: 'CLOSE', onClick: closeModal }] });
}

function renderDatabase(browser, db) {
  const realClubs = db.clubs.filter(club => !club.isPlaceholder);
  const realPlayers = db.players.filter(player => !player.isPlaceholder);
  browser.innerHTML = `<div class="db-warning">${esc(db.metadata.warning)}</div><div class="db-summary"><div class="db-summary-card"><small>DATABASE</small><strong>${esc(db.metadata.databaseVersion)}</strong></div><div class="db-summary-card"><small>PLAYABLE CLUBS</small><strong>${realClubs.length}</strong></div><div class="db-summary-card"><small>REAL PLAYERS</small><strong>${realPlayers.length}</strong></div></div><div class="db-toolbar"><input type="search" data-db-search placeholder="Search clubs or players" aria-label="Search football database"></div><div class="db-layout"><div class="db-club-list" data-db-clubs></div><div class="db-detail" data-db-detail></div></div>`;
  const search = browser.querySelector('[data-db-search]');
  const list = browser.querySelector('[data-db-clubs]');
  const detail = browser.querySelector('[data-db-detail]');
  let selectedId = realClubs[0]?.id;
  const showClub = id => {
    selectedId = id;
    const club = db.clubs.find(item => item.id === id);
    const squad = db.players.filter(player => player.clubId === id).sort((a, b) => ({ GK: 0, DEF: 1, MID: 2, ATT: 3 }[a.positionGroup] - { GK: 0, DEF: 1, MID: 2, ATT: 3 }[b.positionGroup] || a.name.localeCompare(b.name)));
    detail.innerHTML = `<div class="db-detail-head"><div><p class="eyebrow">${club.isPlaceholder ? 'DEVELOPMENT CLUB' : 'PLAYABLE CLUB'}</p><h3>${esc(club.name)}</h3><span class="db-club-meta">${squad.length} players loaded</span></div></div><div class="db-squad">${squad.map(player => `<div class="db-player-row"><span class="db-player-pos">${esc(player.primaryPosition)}</span><div><strong>${esc(player.name)}</strong><small>${esc(player.nationalityCode || '—')} · #${esc(player.shirtNumber || '—')}</small></div><div class="db-player-rating"><small>CA</small><b>${player.currentAbility || '—'}</b></div></div>`).join('')}</div>`;
    list.querySelectorAll('button').forEach(item => item.classList.toggle('is-active', item.dataset.clubId === selectedId));
  };
  const draw = () => {
    const term = search.value.toLowerCase();
    const playerClubIds = new Set(db.players.filter(player => player.name.toLowerCase().includes(term)).map(player => player.clubId));
    const filtered = db.clubs.filter(club => !term || club.name.toLowerCase().includes(term) || playerClubIds.has(club.id));
    list.replaceChildren();
    filtered.forEach(club => { const item = button('', 'db-club-button', () => showClub(club.id)); item.dataset.clubId = club.id; item.innerHTML = `<strong>${esc(club.name)}</strong><span>${db.players.filter(player => player.clubId === club.id).length} players${club.isPlaceholder ? ' · placeholder' : ''}</span>`; list.appendChild(item); });
    if (!filtered.some(club => club.id === selectedId)) selectedId = filtered[0]?.id;
    if (selectedId) showClub(selectedId); else detail.innerHTML = '<div class="db-empty">No matching clubs or players.</div>';
  };
  search.addEventListener('input', draw); draw();
}

async function showDatabase() {
  const browser = document.createElement('div');
  browser.className = 'database-browser';
  browser.innerHTML = '<div class="db-loading">Loading database…</div>';
  openModal({ eyebrow: '06 · FOOTBALL WORLD', title: 'FOOTBALL DATABASE', copy: 'Development squads powering the V0.3 Invitational.', body: browser, wide: true, actions: [{ label: 'CLOSE', onClick: closeModal }] });
  try { renderDatabase(browser, await loadDatabase()); } catch (error) { browser.innerHTML = `<div class="db-empty"><strong>DATABASE LOAD FAILED</strong><br>${esc(error.message)}</div>`; }
}

const actions = { 'new-game': showNewGame, 'quick-start': showQuickStart, 'load-game': showLoadGame, settings: showSettings, 'hall-of-fame': showHallOfFame, database: showDatabase };
document.addEventListener('click', event => {
  const trigger = event.target.closest('[data-action]');
  if (trigger && actions[trigger.dataset.action]) actions[trigger.dataset.action]();
  if (event.target.closest('[data-close-modal]')) closeModal();
});
document.getElementById('headerSettings').addEventListener('click', showSettings);
document.getElementById('brandHome').addEventListener('click', () => window.scrollTo({ top: 0, behavior: settings.reducedMotion ? 'auto' : 'smooth' }));
document.addEventListener('keydown', event => { if (event.key === 'Escape' && modal.classList.contains('is-open')) closeModal(); });
applySettings();
window.FLMManager = { loadDatabase, showDatabase, get activeCareer() { return activeCareer; } };
