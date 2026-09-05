const STYLE_HREF = './matchday-cm-v1.css?v=1.0.0';
let queued = false;

function ensureStyles() {
  if ([...document.styleSheets].some(sheet => sheet.href?.includes('matchday-cm-v1.css'))) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = STYLE_HREF;
  document.head.appendChild(link);
}

function click(selector) {
  document.querySelector(selector)?.click();
}

function navTo(tab) {
  const target = document.querySelector(`.career-nav [data-career-tab="${tab}"]`)
    || document.querySelector(`[data-career-tab="${tab}"]`);
  target?.click();
}

function makeButton(label, className = '') {
  const button = document.createElement('button');
  button.type = 'button';
  button.textContent = label;
  if (className) button.className = className;
  return button;
}

function enhancePrematch() {
  const content = document.querySelector('.career-content');
  const matchCard = content?.querySelector('.career-match-card');
  if (!content || !matchCard || content.querySelector('[data-live-match]') || content.dataset.cmPrematchV1 === '1') return;
  const heading = content.querySelector('.career-page-heading');
  if (!heading || !/matchday/i.test(heading.textContent || '')) return;
  content.dataset.cmPrematchV1 = '1';

  const tabs = document.createElement('div');
  tabs.className = 'flm-cm-prematch-tabs';
  const items = [
    ['MATCH OVERVIEW', null, true],
    ['TEAM SELECTION', 'squad'],
    ['TACTICS', 'tactics'],
    ['LEAGUE TABLE', 'table']
  ];
  items.forEach(([label, tab, active]) => {
    const button = makeButton(label, active ? 'is-active' : '');
    if (tab) button.addEventListener('click', () => navTo(tab));
    tabs.appendChild(button);
  });
  heading.after(tabs);

  const actions = content.querySelector('.career-match-actions');
  if (actions && !actions.querySelector('.flm-cm-prematch-shortcuts')) {
    const shortcuts = document.createElement('div');
    shortcuts.className = 'flm-cm-prematch-shortcuts';
    const xi = makeButton('EDIT STARTING XI');
    const tactics = makeButton('EDIT TACTICS');
    xi.addEventListener('click', () => navTo('squad'));
    tactics.addEventListener('click', () => navTo('tactics'));
    shortcuts.append(xi, tactics);
    actions.prepend(shortcuts);
  }
}

function syncPauseButton(live) {
  const button = live.querySelector('[data-cm-pause]');
  if (!button) return;
  const paused = live.querySelector('[data-match-speed="0"]')?.classList.contains('is-active');
  const halfTime = live.classList.contains('is-half-time');
  const fullTime = live.classList.contains('is-full-time');
  button.textContent = fullTime ? 'FULL TIME' : halfTime ? 'HALF TIME' : paused ? 'RESUME MATCH' : 'PAUSE MATCH';
  button.disabled = fullTime || halfTime;
  button.classList.toggle('is-paused', Boolean(paused));
}

function setView(live, view) {
  live.dataset.cmView = view;
  live.querySelectorAll('[data-cm-view-button]').forEach(button => {
    button.classList.toggle('is-active', button.dataset.cmViewButton === view);
  });
}

function enhanceLiveMatch() {
  const live = document.querySelector('[data-live-match]');
  if (!live || live.dataset.cmMatchV1 === '1') return;
  live.dataset.cmMatchV1 = '1';
  live.dataset.cmView = 'overview';

  const scoreboard = live.querySelector('.flm-live-scoreboard');
  const grid = live.querySelector('.flm-live-grid');
  if (!scoreboard || !grid) return;

  const tabs = document.createElement('nav');
  tabs.className = 'flm-cm-match-tabs';
  tabs.setAttribute('aria-label', 'Match centre views');
  const tabDefs = [
    ['overview', 'MATCH OVERVIEW'],
    ['stats', 'MATCH STATS'],
    ['tactics', 'TACTICS'],
    ['analysis', 'ANALYSIS'],
    ['report', 'MATCH REPORT']
  ];
  tabDefs.forEach(([id, label]) => {
    const button = makeButton(label, id === 'overview' ? 'is-active' : '');
    button.dataset.cmViewButton = id;
    button.addEventListener('click', () => {
      if (id === 'tactics') {
        live.querySelector('[data-open-tactics]')?.click();
        return;
      }
      if (id === 'analysis') {
        live.querySelector('[data-open-opposition]')?.click();
        return;
      }
      setView(live, id);
    });
    tabs.appendChild(button);
  });
  scoreboard.after(tabs);

  const rail = document.createElement('aside');
  rail.className = 'flm-cm-match-rail';
  rail.innerHTML = '<div class="flm-cm-rail-label">MATCH CONTROL</div>';

  const pause = makeButton('PAUSE MATCH', 'flm-cm-primary-control');
  pause.dataset.cmPause = '1';
  pause.addEventListener('click', () => {
    const paused = live.querySelector('[data-match-speed="0"]')?.classList.contains('is-active');
    live.querySelector(`[data-match-speed="${paused ? '1' : '0'}"]`)?.click();
    setTimeout(() => syncPauseButton(live), 0);
  });
  rail.appendChild(pause);

  const actionDefs = [
    ['MY TACTICS', '[data-open-tactics]'],
    ['SUBSTITUTIONS', '[data-open-subs]'],
    ['ROLES & SHAPE', '[data-open-shape]'],
    ['PLAYER RATINGS', '[data-open-ratings]'],
    ['OPPOSITION', '[data-open-opposition]']
  ];
  actionDefs.forEach(([label, selector]) => {
    const button = makeButton(label);
    button.addEventListener('click', () => live.querySelector(selector)?.click());
    rail.appendChild(button);
  });

  const speed = document.createElement('div');
  speed.className = 'flm-cm-speed';
  speed.innerHTML = '<span>COMMENTARY SPEED</span>';
  [1, 2, 4].forEach(value => {
    const button = makeButton(`${value}×`);
    button.dataset.cmSpeed = String(value);
    button.addEventListener('click', () => {
      live.querySelector(`[data-match-speed="${value}"]`)?.click();
      speed.querySelectorAll('button').forEach(item => item.classList.toggle('is-active', item === button));
      syncPauseButton(live);
    });
    if (value === 1) button.classList.add('is-active');
    speed.appendChild(button);
  });
  rail.appendChild(speed);
  tabs.after(rail);

  const observer = new MutationObserver(() => syncPauseButton(live));
  observer.observe(live, { attributes: true, subtree: true, attributeFilter: ['class'] });
  syncPauseButton(live);
}

function queueEnhance() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    ensureStyles();
    enhancePrematch();
    enhanceLiveMatch();
  });
}

new MutationObserver(queueEnhance).observe(document.body, { childList: true, subtree: true });
queueEnhance();
