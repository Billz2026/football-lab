(() => {
  'use strict';

  const modal = document.getElementById('appModal');
  const modalTitle = document.getElementById('modalTitle');
  const modalEyebrow = document.getElementById('modalEyebrow');
  const modalCopy = document.getElementById('modalCopy');
  const modalBody = document.getElementById('modalBody');
  const modalActions = document.getElementById('modalActions');
  const settingsTemplate = document.getElementById('settingsTemplate');

  const settings = {
    autosave: localStorage.getItem('flm-autosave') !== 'false',
    reducedMotion: localStorage.getItem('flm-reduced-motion') === 'true',
    compact: localStorage.getItem('flm-compact') === 'true'
  };

  function applySettings() {
    document.body.classList.toggle('reduced-motion', settings.reducedMotion);
    document.body.classList.toggle('compact', settings.compact);
  }

  function button(label, className = '', handler) {
    const el = document.createElement('button');
    el.type = 'button';
    el.textContent = label;
    if (className) el.className = className;
    if (handler) el.addEventListener('click', handler);
    return el;
  }

  function openModal({ eyebrow = 'FOOTBALL LAB MANAGER', title, copy, body, actions = [] }) {
    modalEyebrow.textContent = eyebrow;
    modalTitle.textContent = title;
    modalCopy.textContent = copy || '';
    modalBody.innerHTML = '';
    modalActions.innerHTML = '';

    if (typeof body === 'string') {
      modalBody.innerHTML = body;
    } else if (body instanceof Node) {
      modalBody.appendChild(body);
    }

    actions.forEach(action => modalActions.appendChild(button(action.label, action.primary ? 'action-gold' : '', action.onClick)));
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    setTimeout(() => modal.querySelector('.modal-close')?.focus(), 30);
  }

  function closeModal() {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function foundationPanel(headline, message) {
    const panel = document.createElement('div');
    panel.className = 'notice-panel';
    panel.innerHTML = `<strong>${headline}</strong><p>${message}</p>`;
    return panel;
  }

  function showNewGame() {
    const wrap = document.createElement('div');
    wrap.appendChild(foundationPanel('CAREER CREATION IS THE NEXT BUILD', 'The old arcade game has been removed from the public homepage. The next implementation phase is the actual manager engine: database, club selection, fixtures, tactics and save structure.'));
    const stats = document.createElement('div');
    stats.className = 'stat-row';
    stats.innerHTML = `
      <div class="stat-chip"><small>V1 TARGET</small><strong>20 CLUBS</strong></div>
      <div class="stat-chip"><small>CORE LOOP</small><strong>1 SEASON</strong></div>
      <div class="stat-chip"><small>FOCUS</small><strong>MATCH ENGINE</strong></div>`;
    wrap.appendChild(stats);
    openModal({
      eyebrow: '01 · NEW CAREER',
      title: 'START NEW GAME',
      copy: 'This button is now wired into the manager interface. Career creation will replace the old playable football modes.',
      body: wrap,
      actions: [{ label: 'CLOSE', onClick: closeModal }]
    });
  }

  function showQuickStart() {
    openModal({
      eyebrow: '02 · FAST TRACK',
      title: 'QUICK START',
      copy: 'Quick Start will launch a preconfigured career with a recommended league setup once the management database is connected.',
      body: foundationPanel('DESIGNED FOR SPEED', 'The goal is Championship Manager-style flow: choose a club, set your team and get to the first fixture quickly.'),
      actions: [{ label: 'CLOSE', onClick: closeModal }]
    });
  }

  function showLoadGame() {
    const hasSave = Boolean(localStorage.getItem('flm-career-save'));
    openModal({
      eyebrow: '03 · CONTINUE',
      title: 'LOAD GAME',
      copy: hasSave ? 'A local Football Lab Manager career was detected.' : 'There are no Football Lab Manager careers saved on this device yet.',
      body: foundationPanel(hasSave ? 'LOCAL CAREER DETECTED' : 'NO SAVES YET', hasSave ? 'Save-slot support is active and will be connected to career state during the engine build.' : 'Once careers are playable, saved games will appear here with club, season, date and manager details.'),
      actions: [{ label: 'CLOSE', onClick: closeModal }]
    });
  }

  function showSettings() {
    const content = settingsTemplate.content.cloneNode(true);
    const container = document.createElement('div');
    container.appendChild(content);
    const autosave = container.querySelector('#settingAutosave');
    const motion = container.querySelector('#settingMotion');
    const compact = container.querySelector('#settingCompact');
    autosave.checked = settings.autosave;
    motion.checked = settings.reducedMotion;
    compact.checked = settings.compact;

    const save = () => {
      settings.autosave = autosave.checked;
      settings.reducedMotion = motion.checked;
      settings.compact = compact.checked;
      localStorage.setItem('flm-autosave', String(settings.autosave));
      localStorage.setItem('flm-reduced-motion', String(settings.reducedMotion));
      localStorage.setItem('flm-compact', String(settings.compact));
      applySettings();
      closeModal();
    };

    openModal({
      eyebrow: '04 · CONFIGURATION',
      title: 'GAME SETTINGS',
      copy: 'The first interface settings are live now and are saved locally on this device.',
      body: container,
      actions: [{ label: 'SAVE SETTINGS', primary: true, onClick: save }, { label: 'CANCEL', onClick: closeModal }]
    });
  }

  function showHallOfFame() {
    openModal({
      eyebrow: '05 · LEGACY',
      title: 'HALL OF FAME',
      copy: 'This area will record your best careers and managerial achievements.',
      body: foundationPanel('YOUR LEGACY STARTS AT ZERO', 'League titles, cup wins, promotions, unbeaten runs, club records and long-term manager rankings will live here.'),
      actions: [{ label: 'CLOSE', onClick: closeModal }]
    });
  }

  function showDatabase() {
    openModal({
      eyebrow: '06 · FOOTBALL WORLD',
      title: 'FOOTBALL DATABASE',
      copy: 'The database browser will become the front door to clubs, players, leagues and competitions.',
      body: foundationPanel('DATABASE ARCHITECTURE NEXT', 'We will build our own player ratings and simulation data model rather than copying another management game database.'),
      actions: [{ label: 'CLOSE', onClick: closeModal }]
    });
  }

  const actionMap = {
    'new-game': showNewGame,
    'quick-start': showQuickStart,
    'load-game': showLoadGame,
    'settings': showSettings,
    'hall-of-fame': showHallOfFame,
    'database': showDatabase
  };

  document.addEventListener('click', event => {
    const actionButton = event.target.closest('[data-action]');
    if (actionButton && actionMap[actionButton.dataset.action]) actionMap[actionButton.dataset.action]();
    if (event.target.closest('[data-close-modal]')) closeModal();
  });

  document.getElementById('headerSettings')?.addEventListener('click', showSettings);
  document.getElementById('brandHome')?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: settings.reducedMotion ? 'auto' : 'smooth' }));

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
  });

  applySettings();
})();
