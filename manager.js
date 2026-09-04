(() => {
  'use strict';

  const databaseStyles = document.createElement('link');
  databaseStyles.rel = 'stylesheet';
  databaseStyles.href = './database.css?v=58.0.0';
  document.head.appendChild(databaseStyles);

  const modal = document.getElementById('appModal');
  const modalCard = modal?.querySelector('.modal-card');
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

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

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

  function openModal({ eyebrow = 'FOOTBALL LAB MANAGER', title, copy, body, actions = [], wide = false }) {
    modalEyebrow.textContent = eyebrow;
    modalTitle.textContent = title;
    modalCopy.textContent = copy || '';
    modalBody.innerHTML = '';
    modalActions.innerHTML = '';
    modalCard?.classList.toggle('modal-wide', wide);

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
    modalCard?.classList.remove('modal-wide');
  }

  function foundationPanel(headline, message) {
    const panel = document.createElement('div');
    panel.className = 'notice-panel';
    panel.innerHTML = `<strong>${escapeHtml(headline)}</strong><p>${escapeHtml(message)}</p>`;
    return panel;
  }

  function showNewGame() {
    const wrap = document.createElement('div');
    wrap.appendChild(foundationPanel('DATABASE FOUNDATION IS NOW LIVE', 'Career creation will be connected after the England 2026/27 database is populated and validated. We are building the data layer before fixtures, transfers and the match engine.'));
    const stats = document.createElement('div');
    stats.className = 'stat-row';
    stats.innerHTML = `
      <div class="stat-chip"><small>V1 SCOPE</small><strong>5 LEAGUES</strong></div>
      <div class="stat-chip"><small>TARGET</small><strong>116 CLUBS</strong></div>
      <div class="stat-chip"><small>PHASE</small><strong>DATABASE</strong></div>`;
    wrap.appendChild(stats);
    openModal({
      eyebrow: '01 · NEW CAREER',
      title: 'START NEW GAME',
      copy: 'The career flow is deliberately waiting for the real football database rather than being built on temporary assumptions.',
      body: wrap,
      actions: [{ label: 'VIEW DATABASE', primary: true, onClick: showDatabase }, { label: 'CLOSE', onClick: closeModal }]
    });
  }

  function showQuickStart() {
    openModal({
      eyebrow: '02 · FAST TRACK',
      title: 'QUICK START',
      copy: 'Quick Start will launch a preconfigured English career once the current 2026/27 squads are connected.',
      body: foundationPanel('DESIGNED FOR SPEED', 'The target flow is simple: choose a club, confirm the manager profile and reach the first management dashboard quickly.'),
      actions: [{ label: 'CLOSE', onClick: closeModal }]
    });
  }

  function showLoadGame() {
    const hasSave = Boolean(localStorage.getItem('flm-career-save'));
    openModal({
      eyebrow: '03 · CONTINUE',
      title: 'LOAD GAME',
      copy: hasSave ? 'A local Football Lab Manager career was detected.' : 'There are no Football Lab Manager careers saved on this device yet.',
      body: foundationPanel(hasSave ? 'LOCAL CAREER DETECTED' : 'NO SAVES YET', hasSave ? 'Save-slot support will be connected to the versioned database and career state.' : 'Once careers are playable, saved games will appear here with club, season, date and manager details.'),
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
      copy: 'Interface settings are stored locally on this device.',
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

  async function loadDatabase() {
    const names = ['metadata', 'leagues', 'clubs', 'players', 'managers'];
    const responses = await Promise.all(names.map(name => fetch(`./data/current/${name}.json?v=58`, { cache: 'no-store' })));
    responses.forEach((response, index) => {
      if (!response.ok) throw new Error(`Could not load ${names[index]}.json (${response.status})`);
    });
    const [metadata, leagues, clubs, players, managers] = await Promise.all(responses.map(response => response.json()));
    return { metadata, leagues, clubs, players, managers };
  }

  function renderDatabase(browser, db) {
    const { metadata, leagues, clubs, players } = db;
    const realClubs = clubs.filter(club => !club.isPlaceholder).length;
    const realPlayers = players.filter(player => !player.isPlaceholder).length;

    browser.innerHTML = `
      <div class="db-warning">${escapeHtml(metadata.warning || 'Development database.')}</div>
      <div class="db-summary">
        <div class="db-summary-card"><small>DATABASE</small><strong>${escapeHtml(metadata.databaseVersion)}</strong></div>
        <div class="db-summary-card"><small>TARGET LEAGUES</small><strong>${leagues.length}</strong></div>
        <div class="db-summary-card"><small>REAL CLUBS LOADED</small><strong>${realClubs} / ${metadata.scope?.targetClubCount ?? 116}</strong></div>
        <div class="db-summary-card"><small>REAL PLAYERS LOADED</small><strong>${realPlayers}</strong></div>
      </div>
      <div class="db-league-grid" data-db-leagues></div>
      <div class="db-toolbar">
        <input type="search" data-db-search placeholder="Search clubs or players" aria-label="Search football database" />
        <select data-db-filter aria-label="Filter by league"><option value="all">All five leagues</option></select>
      </div>
      <div class="db-layout">
        <div class="db-club-list" data-db-clubs></div>
        <div class="db-detail" data-db-detail></div>
      </div>`;

    const leagueGrid = browser.querySelector('[data-db-leagues]');
    const filter = browser.querySelector('[data-db-filter]');
    const search = browser.querySelector('[data-db-search]');
    const clubList = browser.querySelector('[data-db-clubs]');
    const detail = browser.querySelector('[data-db-detail]');

    leagues.forEach(league => {
      const loaded = clubs.filter(club => club.leagueId === league.id && !club.isPlaceholder).length;
      const percent = Math.min(100, Math.round((loaded / league.expectedClubCount) * 100));
      const card = document.createElement('div');
      card.className = 'db-league-card';
      card.innerHTML = `<small>LEVEL ${league.level} · ${loaded}/${league.expectedClubCount} REAL CLUBS</small><strong>${escapeHtml(league.name)}</strong><div class="db-league-progress"><span style="width:${percent}%"></span></div>`;
      leagueGrid.appendChild(card);

      const option = document.createElement('option');
      option.value = league.id;
      option.textContent = league.name;
      filter.appendChild(option);
    });

    let selectedClubId = clubs[0]?.id || null;

    function showClub(clubId) {
      selectedClubId = clubId;
      const club = clubs.find(item => item.id === clubId);
      if (!club) {
        detail.innerHTML = '<div class="db-empty">Select a club to view its squad.</div>';
        return;
      }
      const league = leagues.find(item => item.id === club.leagueId);
      const squad = players.filter(player => player.clubId === club.id).sort((a, b) => {
        const order = { GK: 0, DEF: 1, MID: 2, ATT: 3 };
        return (order[a.positionGroup] ?? 9) - (order[b.positionGroup] ?? 9) || a.name.localeCompare(b.name);
      });

      detail.innerHTML = `
        <div class="db-detail-head">
          <div><p class="eyebrow">${escapeHtml(league?.name || 'Football Lab')}</p><h3>${escapeHtml(club.name)}</h3><span class="db-club-meta">${escapeHtml(club.preferredFormation || 'Formation pending')} · ${squad.length} players loaded</span></div>
          ${club.isPlaceholder ? '<span class="db-placeholder-badge">PLACEHOLDER</span>' : ''}
        </div>
        <div class="db-squad">
          ${squad.length ? squad.map(player => `
            <div class="db-player-row">
              <span class="db-player-pos">${escapeHtml(player.primaryPosition)}</span>
              <div><strong>${escapeHtml(player.name)}</strong><small>${escapeHtml(player.nationalityCode || '—')} · #${escapeHtml(player.shirtNumber || '—')}</small></div>
              <div class="db-player-rating"><small>CA</small><b>${escapeHtml(player.currentAbility ?? '—')}</b></div>
              <div class="db-player-rating"><small>PA</small><b>${escapeHtml(player.potentialAbility ?? '—')}</b></div>
            </div>`).join('') : '<div class="db-empty">No squad records loaded for this club yet.</div>'}
        </div>`;

      clubList.querySelectorAll('.db-club-button').forEach(item => item.classList.toggle('is-active', item.dataset.clubId === selectedClubId));
    }

    function renderClubList() {
      const term = search.value.trim().toLowerCase();
      const leagueId = filter.value;
      const matchingPlayerClubIds = new Set(players.filter(player => player.name.toLowerCase().includes(term)).map(player => player.clubId));
      const filtered = clubs.filter(club => {
        const leagueMatch = leagueId === 'all' || club.leagueId === leagueId;
        const textMatch = !term || club.name.toLowerCase().includes(term) || matchingPlayerClubIds.has(club.id);
        return leagueMatch && textMatch;
      });

      clubList.innerHTML = '';
      if (!filtered.length) {
        clubList.innerHTML = '<div class="db-empty">No matching clubs or players.</div>';
        detail.innerHTML = '<div class="db-empty">Adjust the database filters.</div>';
        return;
      }

      if (!filtered.some(club => club.id === selectedClubId)) selectedClubId = filtered[0].id;

      filtered.forEach(club => {
        const league = leagues.find(item => item.id === club.leagueId);
        const clubPlayers = players.filter(player => player.clubId === club.id).length;
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'db-club-button';
        item.dataset.clubId = club.id;
        item.innerHTML = `<strong>${escapeHtml(club.name)}</strong><span>${escapeHtml(league?.name || '')} · ${clubPlayers} players${club.isPlaceholder ? ' · placeholder' : ''}</span>`;
        item.addEventListener('click', () => showClub(club.id));
        clubList.appendChild(item);
      });
      showClub(selectedClubId);
    }

    search.addEventListener('input', renderClubList);
    filter.addEventListener('change', renderClubList);
    renderClubList();
  }

  async function showDatabase() {
    const browser = document.createElement('div');
    browser.className = 'database-browser';
    browser.innerHTML = '<div class="db-loading">Loading Football Lab Manager database…</div>';

    openModal({
      eyebrow: '06 · FOOTBALL WORLD',
      title: 'FOOTBALL DATABASE',
      copy: 'England 2026/27 database foundation. Current real-world squads will replace the clearly labelled development placeholders after the provider import is connected.',
      body: browser,
      wide: true,
      actions: [{ label: 'CLOSE', onClick: closeModal }]
    });

    try {
      const db = await loadDatabase();
      renderDatabase(browser, db);
    } catch (error) {
      browser.innerHTML = `<div class="db-empty"><div><strong>DATABASE LOAD FAILED</strong><br />${escapeHtml(error.message)}</div></div>`;
    }
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
