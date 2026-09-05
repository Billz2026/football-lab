const SAVE_KEY = 'flm-career-save';
const STYLE_ID = 'flm-team-selection-v1-style';
let queued = false;

const manager = () => window.FLMManager;
const career = () => manager()?.activeCareer || null;

function persist(c) {
  if (!c) return;
  c.updatedAt = new Date().toISOString();
  localStorage.setItem(SAVE_KEY, JSON.stringify(c));
  const status = document.querySelector('[data-career-save-status]');
  if (status) status.textContent = 'SAVED';
}

function initialiseManualOwnership() {
  const c = career();
  if (!c || Object.prototype.hasOwnProperty.call(c, 'manualLineupSelection')) return;

  // Careers created before this UX layer may already contain the core engine's
  // auto-picked XI. Before the first competitive match, ownership belongs to the
  // manager: clear that generated XI and make the user build it deliberately.
  const untouchedCareer = Number(c.roundIndex || 0) === 0 && !c.lastMatch;
  if (untouchedCareer) {
    c.lineupIds = [];
    c.manualLineupSelection = true;
    delete c.tacticalSetup;
  } else {
    // Never destroy a historic XI in an existing career that is already underway.
    c.manualLineupSelection = false;
  }
  persist(c);
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .flm-xi-toolbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
    .flm-xi-toolbar [data-clear-xi]{border-color:rgba(255,255,255,.22)!important;background:#111!important;color:#f0ede6!important}
    .flm-xi-toolbar [data-clear-xi]:hover{border-color:#e8b83f!important;color:#ffd66a!important}
    .flm-manual-note{font-size:9px!important;color:#8d877d!important;letter-spacing:.03em}
    .lineup-counter.is-building{border-color:rgba(239,185,63,.42)!important;color:#e8b83f!important}
    @media(max-width:700px){.flm-xi-toolbar{width:100%}.flm-xi-toolbar button{flex:1 1 140px}}
  `;
  document.head.appendChild(style);
}

function selectedIds(root = document) {
  return [...root.querySelectorAll('[data-lineup-player]:checked')].map(input => input.value);
}

function hasGoalkeeper(ids) {
  const dbPromise = manager()?.loadDatabase?.();
  if (!dbPromise) return Promise.resolve(false);
  return dbPromise.then(db => ids.some(id => db.players.find(player => player.id === id)?.positionGroup === 'GK'));
}

async function refreshSelectionUI(root = document) {
  const ids = selectedIds(root);
  const counter = root.querySelector('[data-lineup-counter]');
  if (counter) {
    const goalkeeper = await hasGoalkeeper(ids);
    const valid = ids.length === 11 && goalkeeper;
    counter.textContent = `${ids.length} / 11 SELECTED`;
    counter.classList.toggle('is-valid', valid);
    counter.classList.toggle('is-building', ids.length > 0 && !valid);
  }
  root.querySelectorAll('.career-player-row').forEach(row => {
    const input = row.querySelector('[data-lineup-player]');
    if (input) row.classList.toggle('is-selected', input.checked);
  });
}

function persistManualSelection(root = document) {
  const c = career();
  if (!c) return;
  const ids = selectedIds(root);
  if (ids.length > 11) return;
  c.lineupIds = ids;
  c.manualLineupSelection = true;
  persist(c);
  refreshSelectionUI(root);
}

function clearXI(root = document) {
  const c = career();
  if (!c) return;
  root.querySelectorAll('[data-lineup-player]').forEach(input => { input.checked = false; });
  c.lineupIds = [];
  c.manualLineupSelection = true;
  delete c.tacticalSetup;
  persist(c);
  refreshSelectionUI(root);
}

function enhanceSquad() {
  initialiseManualOwnership();
  const actions = document.querySelector('.career-squad-actions');
  const list = document.querySelector('.career-squad-list');
  if (!actions || !list || actions.dataset.manualXiV1 === '1') return;
  actions.dataset.manualXiV1 = '1';

  const auto = actions.querySelector('[data-auto-pick]');
  if (auto) auto.textContent = 'AUTO PICK XI · OPTIONAL';

  const toolbar = document.createElement('div');
  toolbar.className = 'flm-xi-toolbar';
  const clear = document.createElement('button');
  clear.type = 'button';
  clear.className = 'career-secondary';
  clear.dataset.clearXi = '1';
  clear.textContent = 'CLEAR XI';
  clear.addEventListener('click', () => clearXI(document));

  if (auto) {
    auto.parentNode.insertBefore(toolbar, auto);
    toolbar.append(auto, clear);
  } else {
    toolbar.append(clear);
    actions.prepend(toolbar);
  }

  const helper = [...actions.children].find(node => node.tagName === 'SPAN' && !node.closest('.flm-xi-toolbar'));
  if (helper) {
    helper.classList.add('flm-manual-note');
    helper.textContent = 'Your XI starts empty. Pick exactly 11 players including a goalkeeper. Auto Pick is optional.';
  }

  refreshSelectionUI(document);
}

function queueEnhance() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    initialiseManualOwnership();
    injectStyles();
    enhanceSquad();
  });
}

document.addEventListener('change', event => {
  if (!event.target.matches?.('[data-lineup-player]')) return;
  // The base squad handler runs on the checkbox first. Persist the user's partial
  // selection afterwards so 0-10 players survive navigation and page renders.
  setTimeout(() => persistManualSelection(document), 0);
});

document.addEventListener('click', event => {
  if (!event.target.closest?.('[data-auto-pick]')) return;
  const c = career();
  if (c) {
    c.manualLineupSelection = false;
    setTimeout(() => persist(c), 0);
  }
});

new MutationObserver(queueEnhance).observe(document.body, { childList: true, subtree: true });
queueEnhance();
