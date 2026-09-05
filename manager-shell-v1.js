// Football Lab Manager Shell V1
// Presentation/navigation layer only: existing career systems remain authoritative.

const SHELL_VERSION = '1.0.1';
const STYLE_HREF = `./manager-shell-v1.css?v=${SHELL_VERSION}`;
const MILESTONES = [
  { date: '2026-06-15', label: 'CONTINUE TO 15 JUNE', detail: 'Summer transfer window opens' },
  { date: '2026-06-19', label: 'CONTINUE TO 19 JUNE', detail: 'Premier League fixture release' }
];
const PRESEASON_DATES = ['2026-07-11','2026-07-18','2026-07-25','2026-08-01','2026-08-08'];

let queued = false;
let enhancing = false;
let databasePromise = null;

const manager = () => window.FLMManager;
const career = () => manager()?.activeCareer || null;
const app = () => document.getElementById('careerApp');
const esc = value => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function ensureStylesheet() {
  if (document.querySelector('link[data-flm-shell-v1]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = STYLE_HREF;
  link.dataset.flmShellV1 = SHELL_VERSION;
  document.head.appendChild(link);
}

function database() {
  if (!databasePromise && manager()?.loadDatabase) databasePromise = manager().loadDatabase();
  return databasePromise || Promise.resolve(null);
}

function isoDate(c) {
  return c?.currentDate
    || c?.calendar?.currentDate
    || c?.fixtures?.[c?.roundIndex || 0]?.[0]?.date
    || c?.seasonStartDate
    || null;
}

function formatDate(value) {
  if (!value) return 'CAREER DATE';
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return String(value).toUpperCase();
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'
  }).format(date).toUpperCase();
}

function weekday(value) {
  if (!value) return 'FL';
  const date = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return 'FL';
  return new Intl.DateTimeFormat('en-GB', { weekday: 'short', timeZone: 'UTC' })
    .format(date).slice(0, 3).toUpperCase();
}

function currentMilestone(c) {
  const date = isoDate(c);
  if (!date) return null;
  return MILESTONES.find(item => date < item.date) || null;
}

function nextLeagueFixture(c) {
  const round = c?.fixtures?.[c?.roundIndex || 0];
  if (!Array.isArray(round)) return null;
  return round.find(fixture => fixture.homeClubId === c.clubId || fixture.awayClubId === c.clubId) || round[0] || null;
}

function nextFriendly(c) {
  return c?.preseason?.fixtures?.find(fixture => !fixture.played) || null;
}

function nextFriendlyDate(c) {
  const played = c?.preseason?.fixtures?.filter(fixture => fixture.played).length || 0;
  return PRESEASON_DATES[Math.min(played, PRESEASON_DATES.length - 1)] || null;
}

function dateReady(current, target) {
  return !target || String(current || '') >= String(target);
}

function stageText(c) {
  if (!c) return 'CAREER';
  const milestone = currentMilestone(c);
  if (milestone) return 'PRE-SEASON';
  if (c.preseason && c.preseason.phase !== 'complete') return 'PRE-SEASON';
  if (c.status === 'complete') return 'SEASON COMPLETE';
  return c.season || 'COMPETITIVE SEASON';
}

function clubName(db, id) {
  const club = db?.clubs?.find(item => item.id === id);
  return club?.shortName || club?.name || 'Unknown';
}

function shellState(c, db) {
  if (!c) return { label: 'CONTINUE', detail: 'Career', disabled: true, action: 'none' };
  if (document.querySelector('[data-live-match]')) {
    return { label: 'MATCH IN PROGRESS', detail: 'Use the match controls', disabled: true, action: 'none' };
  }
  const milestone = currentMilestone(c);
  if (milestone) return { ...milestone, disabled: false, action: 'milestone' };
  if (c.preseason && c.preseason.phase !== 'complete') {
    const friendly = nextFriendly(c);
    if (!friendly) return { label: 'PRE-SEASON', detail: 'Complete season preparation', disabled: false, action: 'preseason' };
    const targetDate = nextFriendlyDate(c);
    const ready = dateReady(isoDate(c), targetDate);
    return {
      label: ready ? 'PLAY FRIENDLY' : 'CONTINUE GAME',
      detail: ready
        ? `${clubName(db, friendly.homeClubId)} vs ${clubName(db, friendly.awayClubId)}`
        : `Next friendly · ${targetDate || friendly.dateLabel || 'date pending'}`,
      disabled: false,
      action: ready ? 'friendly' : 'calendar'
    };
  }
  if (c.status === 'complete') {
    return { label: 'SEASON COMPLETE', detail: 'View the final table', disabled: false, action: 'table' };
  }
  const fixture = nextLeagueFixture(c);
  if (fixture) {
    const opponentId = fixture.homeClubId === c.clubId ? fixture.awayClubId : fixture.homeClubId;
    const ready = dateReady(isoDate(c), fixture.date);
    return {
      label: ready ? 'PLAY MATCH' : 'CONTINUE GAME',
      detail: `${clubName(db, opponentId)} · ${fixture.date || `Round ${fixture.round || c.roundIndex + 1}`}`,
      disabled: false,
      action: ready ? 'play-match' : 'calendar'
    };
  }
  return { label: 'CONTINUE', detail: 'Return to overview', disabled: false, action: 'overview' };
}

function activateBaseTab(name) {
  const button = document.querySelector(`.career-nav [data-career-tab="${name}"]`);
  if (button && !button.disabled) {
    button.click();
    return true;
  }
  return false;
}

function activatePreseason() {
  const button = document.querySelector('.career-nav [data-v047-preseason-tab]');
  if (button && !button.disabled) {
    button.click();
    return true;
  }
  return activateBaseTab('overview');
}

function waitAndClick(selector, attempts = 20) {
  const target = document.querySelector(selector);
  if (target && !target.disabled) {
    target.click();
    return;
  }
  if (attempts > 0) setTimeout(() => waitAndClick(selector, attempts - 1), 45);
}

function playFriendlyDirect() {
  activatePreseason();
  setTimeout(() => waitAndClick('[data-v047-play]'), 25);
}

function playMatchDirect() {
  activateBaseTab('matchday');
  setTimeout(() => waitAndClick('[data-play-match]'), 25);
}

function runMilestoneAdvance() {
  const direct = document.querySelector('[data-v054-advance]');
  if (direct) {
    direct.click();
    return;
  }
  activateBaseTab('overview');
  let attempts = 0;
  const tryClick = () => {
    const target = document.querySelector('[data-v054-advance]');
    if (target) {
      target.click();
      return;
    }
    attempts += 1;
    if (attempts < 12) setTimeout(tryClick, 45);
  };
  setTimeout(tryClick, 25);
}

async function openDatabaseSearch() {
  if (!manager()?.showDatabase) return;
  await manager().showDatabase();
  elevateModal();
  let attempts = 0;
  const focusSearch = () => {
    const field = document.querySelector('[data-db-search]');
    if (field) {
      field.focus();
      field.select?.();
      return;
    }
    attempts += 1;
    if (attempts < 12) setTimeout(focusSearch, 50);
  };
  setTimeout(focusSearch, 30);
}

function elevateModal() {
  const modal = document.getElementById('appModal');
  const careerOpen = app()?.classList.contains('is-open');
  if (!modal) return;
  if (careerOpen && modal.classList.contains('is-open')) modal.style.zIndex = '1400';
  else if (!modal.classList.contains('is-open')) modal.style.removeProperty('z-index');
}

function clickOriginal(selector) {
  const target = document.querySelector(selector);
  if (target && !target.disabled) target.click();
}

function handleContinue(control) {
  const action = control?.dataset.shellAction;
  if (!action || control.disabled) return;
  if (action === 'milestone') runMilestoneAdvance();
  else if (action === 'calendar') clickOriginal('.career-header [data-v060-continue]');
  else if (action === 'friendly') playFriendlyDirect();
  else if (action === 'play-match') playMatchDirect();
  else if (action === 'preseason') activatePreseason();
  else if (action === 'matchday') activateBaseTab('matchday');
  else if (action === 'table') activateBaseTab('table');
  else activateBaseTab('overview');
}

function buildSidebar(layout, nav) {
  const sidebar = document.createElement('aside');
  sidebar.className = 'flm-cm-sidebar';
  sidebar.setAttribute('aria-label', 'Football Lab career navigation');
  sidebar.innerHTML = `
    <div class="flm-shell-brand">
      <span class="flm-shell-brand-mark">FL</span>
      <div><strong>FOOTBALL LAB</strong><span>MANAGER</span></div>
    </div>
    <div class="flm-shell-date" data-shell-date>
      <div><small>CAREER DATE</small><strong data-shell-date-value>—</strong><em data-shell-stage>CAREER</em></div>
      <span class="flm-shell-date-badge" data-shell-weekday>FL</span>
    </div>
    <button type="button" class="flm-shell-continue" data-shell-continue>
      <span><strong data-shell-continue-label>CONTINUE</strong><small data-shell-continue-detail>Career</small></span><b>›</b>
    </button>
    <div class="flm-shell-nav-label">MANAGEMENT</div>
    <div data-shell-nav-slot></div>
    <div class="flm-shell-fixture" data-shell-fixture>
      <small>NEXT FIXTURE</small><strong data-shell-fixture-teams>—</strong><span data-shell-fixture-meta>Schedule pending</span>
    </div>
    <div class="flm-shell-utilities">
      <button type="button" data-shell-search title="Search football world">FIND</button>
      <button type="button" data-shell-save title="Save career">SAVE</button>
      <button type="button" data-shell-settings title="Game settings">SET</button>
      <button type="button" data-shell-exit title="Exit career">EXIT</button>
    </div>`;
  sidebar.querySelector('[data-shell-nav-slot]').replaceWith(nav);
  layout.prepend(sidebar);

  sidebar.querySelector('[data-shell-continue]')?.addEventListener('click', event => handleContinue(event.currentTarget));
  sidebar.querySelector('[data-shell-search]')?.addEventListener('click', openDatabaseSearch);
  sidebar.querySelector('[data-shell-save]')?.addEventListener('click', () => clickOriginal('.career-header [data-save-career]'));
  sidebar.querySelector('[data-shell-settings]')?.addEventListener('click', () => {
    document.getElementById('headerSettings')?.click();
    setTimeout(elevateModal, 0);
  });
  sidebar.querySelector('[data-shell-exit]')?.addEventListener('click', () => clickOriginal('.career-header [data-exit-career]'));
  return sidebar;
}

function buildTopTools(header) {
  if (header.querySelector('[data-shell-top-tools]')) return;
  const tools = document.createElement('div');
  tools.className = 'flm-shell-top-tools';
  tools.dataset.shellTopTools = '1';
  tools.innerHTML = `<button type="button" class="flm-shell-search" data-shell-search-top aria-label="Search football world"><span>Search football world</span><kbd>/</kbd></button>`;
  const actions = header.querySelector('.career-header-actions');
  if (actions) actions.before(tools);
  else header.appendChild(tools);
  tools.querySelector('[data-shell-search-top]')?.addEventListener('click', openDatabaseSearch);
}

async function syncShell(root = app()) {
  const c = career();
  const sidebar = root?.querySelector('.flm-cm-sidebar');
  if (!root || !c || !sidebar) return;
  const db = await database().catch(() => null);
  if (!sidebar.isConnected || app() !== root) return;

  const date = isoDate(c);
  const dateValue = sidebar.querySelector('[data-shell-date-value]');
  const stage = sidebar.querySelector('[data-shell-stage]');
  const day = sidebar.querySelector('[data-shell-weekday]');
  if (dateValue) dateValue.textContent = formatDate(date);
  if (stage) stage.textContent = stageText(c);
  if (day) day.textContent = weekday(date);

  const state = shellState(c, db);
  const continueButton = sidebar.querySelector('[data-shell-continue]');
  const continueLabel = sidebar.querySelector('[data-shell-continue-label]');
  const continueDetail = sidebar.querySelector('[data-shell-continue-detail]');
  if (continueButton) {
    continueButton.disabled = Boolean(state.disabled);
    continueButton.dataset.shellAction = state.action;
  }
  if (continueLabel) continueLabel.textContent = state.label;
  if (continueDetail) continueDetail.textContent = state.detail;

  const fixture = nextLeagueFixture(c);
  const fixtureTeams = sidebar.querySelector('[data-shell-fixture-teams]');
  const fixtureMeta = sidebar.querySelector('[data-shell-fixture-meta]');
  if (fixture && db && (!c.preseason || c.preseason.phase === 'complete')) {
    if (fixtureTeams) fixtureTeams.textContent = `${clubName(db, fixture.homeClubId)} vs ${clubName(db, fixture.awayClubId)}`;
    if (fixtureMeta) fixtureMeta.textContent = `${fixture.date || 'Date pending'} · ${fixture.homeClubId === c.clubId ? 'HOME' : 'AWAY'}`;
  } else if (c.preseason && c.preseason.phase !== 'complete') {
    const friendly = nextFriendly(c);
    const targetDate = nextFriendlyDate(c);
    if (fixtureTeams) fixtureTeams.textContent = friendly && db
      ? `${clubName(db, friendly.homeClubId)} vs ${clubName(db, friendly.awayClubId)}`
      : (friendly ? 'Pre-season friendly' : 'Pre-season programme');
    if (fixtureMeta) fixtureMeta.textContent = friendly
      ? `${friendly.dateLabel || targetDate || 'Date pending'} · FRIENDLY`
      : 'Preparation in progress';
  } else {
    if (fixtureTeams) fixtureTeams.textContent = c.status === 'complete' ? 'Season complete' : 'Schedule pending';
    if (fixtureMeta) fixtureMeta.textContent = c.status === 'complete' ? 'View final table' : 'No fixture available';
  }

  const active = root.querySelector('.career-nav-button.is-active');
  root.dataset.shellActiveSection = active?.dataset.careerTab || active?.textContent?.trim().slice(0, 28) || 'overview';
  elevateModal();
}

async function enhance() {
  if (enhancing) return;
  enhancing = true;
  try {
    ensureStylesheet();
    const root = app();
    const c = career();
    if (!root?.classList.contains('is-open') || !c) {
      elevateModal();
      return;
    }
    const layout = root.querySelector('.career-layout');
    const nav = root.querySelector('.career-nav');
    const header = root.querySelector('.career-header');
    const content = root.querySelector('.career-content');
    if (!layout || !nav || !header || !content) return;

    root.classList.add('flm-cm-shell');
    root.dataset.flmShellVersion = SHELL_VERSION;

    let sidebar = root.querySelector('.flm-cm-sidebar');
    let workspace = root.querySelector('.flm-cm-workspace');
    if (!sidebar || !workspace) {
      workspace = document.createElement('section');
      workspace.className = 'flm-cm-workspace';
      layout.replaceChildren();
      sidebar = buildSidebar(layout, nav);
      layout.appendChild(workspace);
      workspace.append(header, content);
    }
    buildTopTools(header);
    await syncShell(root);
  } finally {
    enhancing = false;
  }
}

function queueEnhance() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    enhance();
  });
}

function keyboardShortcuts(event) {
  if (!app()?.classList.contains('is-open')) return;
  const target = event.target;
  const editing = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || target?.isContentEditable;
  if (event.key === '/' && !editing && !event.ctrlKey && !event.metaKey && !event.altKey) {
    event.preventDefault();
    openDatabaseSearch();
    return;
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
    event.preventDefault();
    clickOriginal('.career-header [data-save-career]');
  }
}

ensureStylesheet();
document.addEventListener('keydown', keyboardShortcuts);
new MutationObserver(queueEnhance).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'disabled'] });
queueEnhance();

window.FLMShellV1 = Object.freeze({ version: SHELL_VERSION, refresh: queueEnhance, openDatabaseSearch });