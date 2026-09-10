(() => {
  'use strict';

  const MODEL_URL = './data/model/player-model-v1.json?v=1.0.0';
  let profileDataPromise = null;
  let resolvedData = null;
  let activePlayerId = null;
  let sourceTab = 'squad';
  let legacyProfile = null;

  const esc = value => String(value ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

  const label = key => String(key || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, c => c.toUpperCase());

  function ensureStylesheet() {
    if (document.querySelector('link[data-flm-fast-profile]')) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = './player-profile-fast-v1.css?v=1.0.0';
    link.dataset.flmFastProfile = 'true';
    document.head.appendChild(link);
  }

  function manager() {
    return window.FLMManager || null;
  }

  async function loadData() {
    if (resolvedData) return resolvedData;
    if (profileDataPromise) return profileDataPromise;

    profileDataPromise = (async () => {
      const mgr = manager();
      if (!mgr?.loadDatabase) throw new Error('Football Lab database is not ready.');
      const [db, modelResponse] = await Promise.all([
        mgr.loadDatabase(),
        fetch(MODEL_URL, { cache: 'force-cache' })
      ]);
      if (!modelResponse.ok) throw new Error(`Player model failed to load (${modelResponse.status})`);
      const model = await modelResponse.json();
      resolvedData = { ...db, model };
      return resolvedData;
    })().catch(error => {
      profileDataPromise = null;
      throw error;
    });

    return profileDataPromise;
  }

  function warmData() {
    if (!manager()?.loadDatabase) return;
    loadData().catch(error => console.warn('FLM profile preload:', error));
  }

  function ageFor(player, snapshot = '2026-09-04') {
    if (player.dateOfBirth) {
      const dob = new Date(`${player.dateOfBirth}T00:00:00Z`);
      const ref = new Date(`${snapshot}T00:00:00Z`);
      if (!Number.isNaN(dob.getTime())) {
        let age = ref.getUTCFullYear() - dob.getUTCFullYear();
        if (ref.getUTCMonth() < dob.getUTCMonth() || (ref.getUTCMonth() === dob.getUTCMonth() && ref.getUTCDate() < dob.getUTCDate())) age -= 1;
        return age;
      }
    }
    const reported = Number(player.reportedAge);
    return Number.isFinite(reported) ? reported : null;
  }

  function personalityFor(player, model) {
    const id = player.personality?.visibleId || player.personalityId;
    return model.personalities?.find(item => item.id === id)?.label || 'Balanced';
  }

  function statusFor(player) {
    const careerStatus = manager()?.activeCareer?.playerStatus?.[player.id] || {};
    const base = player.status || {};
    return {
      condition: careerStatus.condition ?? base.condition ?? 100,
      sharpness: careerStatus.sharpness ?? base.matchSharpness ?? 90,
      morale: careerStatus.morale ?? base.morale ?? 'Good',
      form: careerStatus.form ?? base.form ?? '—',
      injuries: careerStatus.alert || base.injuries || 'None',
      suspension: base.suspension || 'None'
    };
  }

  function money(value, currency = 'GBP') {
    if (value == null) return 'Not loaded';
    try {
      return new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);
    } catch {
      return String(value);
    }
  }

  function ratingClass(value) {
    const number = Number(value);
    if (number >= 15) return 'is-strong';
    if (number >= 11) return 'is-good';
    if (number <= 7) return 'is-weak';
    return '';
  }

  function attributeValue(player, group, key) {
    const value = player.attributes?.[group]?.[key];
    return Number.isFinite(Number(value)) ? Number(value) : '—';
  }

  function attributeCard(player, data, group) {
    const keys = data.model.attributeGroups?.[group] || [];
    return `<section class="flm-ip-card flm-ip-attributes">
      <div class="flm-ip-card-title">${esc(group.toUpperCase())}</div>
      <div class="flm-ip-attribute-list">
        ${keys.map(key => {
          const value = attributeValue(player, group, key);
          return `<div class="flm-ip-attribute-row"><span>${esc(label(key))}</span><strong class="${ratingClass(value)}">${esc(value)}</strong></div>`;
        }).join('')}
      </div>
    </section>`;
  }

  function seasonStats(player) {
    const rows = Array.isArray(player.seasonStats) && player.seasonStats.length ? player.seasonStats : [];
    if (!rows.length) return '<div class="flm-ip-empty">No competitive match data yet.</div>';
    return `<div class="flm-ip-table-wrap"><table class="flm-ip-table"><thead><tr><th>Competition</th><th>Apps</th><th>Goals</th><th>Assists</th><th>Avg</th></tr></thead><tbody>${rows.map(row => `<tr><td>${esc(row.competition || '—')}</td><td>${esc(row.apps ?? '—')}</td><td>${esc(row.goals ?? '—')}</td><td>${esc(row.assists ?? '—')}</td><td>${esc(row.averageRating ?? '—')}</td></tr>`).join('')}</tbody></table></div>`;
  }

  function profileTab(player, data) {
    const status = statusFor(player);
    const positions = [player.primaryPosition, ...(player.secondaryPositions || [])].filter(Boolean);
    const age = ageFor(player, data.metadata?.snapshotDate || '2026-09-04');
    return `<div class="flm-ip-profile-grid">
      ${attributeCard(player, data, 'technical')}
      ${attributeCard(player, data, 'mental')}
      ${attributeCard(player, data, 'physical')}
      <section class="flm-ip-card flm-ip-side-card">
        <div class="flm-ip-card-title">STATUS</div>
        <div class="flm-ip-info-list">
          <div><span>Condition</span><strong class="is-strong">${esc(status.condition)}%</strong></div>
          <div><span>Sharpness</span><strong class="is-strong">${esc(status.sharpness)}%</strong></div>
          <div><span>Morale</span><strong>${esc(status.morale)}</strong></div>
          <div><span>Form</span><strong>${esc(status.form)}</strong></div>
          <div><span>Injury</span><strong>${esc(status.injuries)}</strong></div>
          <div><span>Suspension</span><strong>${esc(status.suspension)}</strong></div>
        </div>
        <div class="flm-ip-card-title">PERSONAL</div>
        <div class="flm-ip-info-list">
          <div><span>Age</span><strong>${esc(age ?? '—')}</strong></div>
          <div><span>Nationality</span><strong>${esc(player.nationalityCode || '—')}</strong></div>
          <div><span>Preferred foot</span><strong>${esc(label(player.preferredFoot || 'unknown'))}</strong></div>
          <div><span>Height</span><strong>${player.heightCm ? `${esc(player.heightCm)} cm` : '—'}</strong></div>
          <div><span>Weight</span><strong>${player.weightKg ? `${esc(player.weightKg)} kg` : '—'}</strong></div>
        </div>
        <div class="flm-ip-card-title">POSITIONS</div>
        <div class="flm-ip-pills">${positions.map((position, index) => `<span class="${index === 0 ? 'is-primary' : ''}">${esc(position)}</span>`).join('')}</div>
      </section>
    </div>
    <section class="flm-ip-card flm-ip-season-card"><div class="flm-ip-card-title">SEASON STATISTICS</div>${seasonStats(player)}</section>`;
  }

  function formTab(player) {
    const status = statusFor(player);
    return `<div class="flm-ip-two-col">
      <section class="flm-ip-card"><div class="flm-ip-card-title">CURRENT FORM</div><div class="flm-ip-info-list flm-ip-info-large">
        <div><span>Average rating</span><strong>${esc(status.form)}</strong></div>
        <div><span>Condition</span><strong class="is-strong">${esc(status.condition)}%</strong></div>
        <div><span>Match sharpness</span><strong class="is-strong">${esc(status.sharpness)}%</strong></div>
        <div><span>Morale</span><strong>${esc(status.morale)}</strong></div>
      </div></section>
      <section class="flm-ip-card"><div class="flm-ip-card-title">RECENT MATCHES</div><div class="flm-ip-empty">Match-by-match form will populate from competitive fixtures.</div></section>
    </div>`;
  }

  function contractTab(player) {
    const contract = player.contract || {};
    return `<div class="flm-ip-two-col">
      <section class="flm-ip-card"><div class="flm-ip-card-title">CONTRACT</div><div class="flm-ip-info-list flm-ip-info-large">
        <div><span>Weekly wage</span><strong>${esc(money(contract.weeklyWage, contract.currency || 'GBP'))}</strong></div>
        <div><span>Start date</span><strong>${esc(contract.startDate || 'Not loaded')}</strong></div>
        <div><span>Expiry</span><strong>${esc(contract.endDate || 'Not loaded')}</strong></div>
        <div><span>Squad status</span><strong>${esc(contract.squadStatus || 'Not set')}</strong></div>
      </div></section>
      <section class="flm-ip-card"><div class="flm-ip-card-title">CONTRACT NOTES</div><div class="flm-ip-copy">Contract values stay data-driven. Missing terms remain hidden rather than being fabricated.</div></section>
    </div>`;
  }

  function transferTab(player) {
    const transfer = player.transfer || {};
    return `<div class="flm-ip-two-col">
      <section class="flm-ip-card"><div class="flm-ip-card-title">TRANSFER STATUS</div><div class="flm-ip-info-list flm-ip-info-large">
        <div><span>Estimated value</span><strong>${esc(player.estimatedValue || 'Not rated')}</strong></div>
        <div><span>Transfer listed</span><strong>${transfer.listed ? 'Yes' : 'No'}</strong></div>
        <div><span>Loan listed</span><strong>${transfer.loanListed ? 'Yes' : 'No'}</strong></div>
        <div><span>Known interest</span><strong>${esc(transfer.interest || 'None')}</strong></div>
      </div></section>
      <section class="flm-ip-card"><div class="flm-ip-card-title">MARKET</div><div class="flm-ip-copy">Value is driven by age, ability, form, contract position, reputation and demand.</div></section>
    </div>`;
  }

  function developmentTab(player, data) {
    const age = ageFor(player, data.metadata?.snapshotDate || '2026-09-04');
    const band = data.model.development?.ageBands?.find(item => age != null && age >= item.min && age <= item.max);
    return `<div class="flm-ip-two-col">
      <section class="flm-ip-card"><div class="flm-ip-card-title">DEVELOPMENT</div><div class="flm-ip-info-list flm-ip-info-large">
        <div><span>Development stage</span><strong>${esc(band?.developmentLabel || '—')}</strong></div>
        <div><span>Personality</span><strong>${esc(personalityFor(player, data.model))}</strong></div>
        <div><span>Mentoring impact</span><strong>${age != null && age <= 24 ? 'High' : age != null && age <= 28 ? 'Moderate' : 'Limited'}</strong></div>
      </div></section>
      <section class="flm-ip-card"><div class="flm-ip-card-title">SCOUTING PRINCIPLE</div><div class="flm-ip-copy">Current Ability, Potential Ability and hidden personality traits remain concealed. Development should be read through performance, coaching and observation.</div></section>
    </div>`;
  }

  function historyTab(player, data) {
    const club = data.clubs.find(item => item.id === player.clubId);
    const history = Array.isArray(player.careerHistory) ? player.careerHistory : [];
    return `<section class="flm-ip-card"><div class="flm-ip-card-title">CAREER HISTORY</div>${history.length ? `<div class="flm-ip-info-list flm-ip-info-large">${history.map(item => `<div><span>${esc(item.season || item.year || '—')}</span><strong>${esc(item.clubName || item.club || '')} · ${esc(item.apps ?? 0)} apps · ${esc(item.goals ?? 0)} goals</strong></div>`).join('')}</div>` : `<div class="flm-ip-empty">No historical season records loaded yet. Current club: ${esc(club?.name || '—')}.</div>`}</section>`;
  }

  function tabContent(tab, player, data) {
    if (tab === 'form') return formTab(player);
    if (tab === 'contract') return contractTab(player);
    if (tab === 'transfer') return transferTab(player);
    if (tab === 'development') return developmentTab(player, data);
    if (tab === 'history') return historyTab(player, data);
    return profileTab(player, data);
  }

  function clubPlayers(player, data) {
    const order = { GK: 0, DEF: 1, MID: 2, ATT: 3 };
    return data.players
      .filter(item => item.clubId === player.clubId && !item.isPlaceholder)
      .sort((a, b) => (order[a.positionGroup] ?? 9) - (order[b.positionGroup] ?? 9) || String(a.lastName || a.name).localeCompare(String(b.lastName || b.name)));
  }

  function shortlistSet() {
    try { return new Set(JSON.parse(localStorage.getItem('flm-shortlist') || '[]')); }
    catch { return new Set(); }
  }

  function toggleShortlist(id, button) {
    const set = shortlistSet();
    if (set.has(id)) set.delete(id); else set.add(id);
    localStorage.setItem('flm-shortlist', JSON.stringify([...set]));
    button.textContent = set.has(id) ? '★ SHORTLISTED' : '☆ SHORTLIST';
  }

  function backToSource() {
    activePlayerId = null;
    const target = document.querySelector(`[data-career-tab="${CSS.escape(sourceTab || 'squad')}"]`) || document.querySelector('[data-career-tab="squad"]');
    target?.click();
  }

  function renderIntegrated(player, data, initialTab = 'profile') {
    const content = document.querySelector('.career-app.is-open .career-content');
    if (!content) return false;

    activePlayerId = player.id;
    const club = data.clubs.find(item => item.id === player.clubId);
    const league = data.leagues.find(item => item.id === club?.leagueId);
    const age = ageFor(player, data.metadata?.snapshotDate || '2026-09-04');
    const personality = personalityFor(player, data.model);
    const short = shortlistSet();
    const squad = clubPlayers(player, data);
    const index = squad.findIndex(item => item.id === player.id);
    const previous = index > 0 ? squad[index - 1] : squad.at(-1);
    const next = index >= 0 && index < squad.length - 1 ? squad[index + 1] : squad[0];

    content.innerHTML = `<div class="flm-instant-profile" data-flm-instant-profile>
      <div class="flm-ip-toolbar">
        <button type="button" data-flm-profile-back>← BACK</button>
        <div class="flm-ip-context">PLAYER PROFILE <span>· ${esc(league?.name || 'FOOTBALL LAB')}</span></div>
        <div class="flm-ip-player-nav">
          <button type="button" data-flm-profile-player="${esc(previous?.id || player.id)}">← PREVIOUS</button>
          <button type="button" data-flm-profile-player="${esc(next?.id || player.id)}">NEXT →</button>
        </div>
      </div>

      <header class="flm-ip-header">
        <div class="flm-ip-title">
          <h2>${esc(player.firstName || '')} <strong>${esc(player.lastName || player.name)}</strong></h2>
          <div class="flm-ip-subline">${esc(club?.name || 'Unattached')} · ${esc(player.nationalityCode || '—')} · ${esc(player.primaryPosition || '—')} · Age ${esc(age ?? '—')} · #${esc(player.shirtNumber || '—')}</div>
        </div>
        <div class="flm-ip-summary">
          <div><span>ESTIMATED VALUE</span><strong>${esc(player.estimatedValue || 'Not rated')}</strong></div>
          <div><span>PERSONALITY</span><strong>${esc(personality)}</strong></div>
          <button type="button" data-flm-shortlist>${short.has(player.id) ? '★ SHORTLISTED' : '☆ SHORTLIST'}</button>
        </div>
      </header>

      <nav class="flm-ip-tabs" aria-label="Player profile sections">
        ${['profile','form','contract','transfer','development','history'].map(tab => `<button type="button" class="${tab === initialTab ? 'is-active' : ''}" data-flm-profile-tab="${tab}">${tab.toUpperCase()}</button>`).join('')}
      </nav>

      <div class="flm-ip-panel" data-flm-profile-panel>${tabContent(initialTab, player, data)}</div>
    </div>`;

    content.scrollTop = 0;

    content.querySelector('[data-flm-profile-back]')?.addEventListener('click', backToSource);
    content.querySelectorAll('[data-flm-profile-player]').forEach(button => button.addEventListener('click', () => openPlayer(button.dataset.flmProfilePlayer)));
    content.querySelector('[data-flm-shortlist]')?.addEventListener('click', event => toggleShortlist(player.id, event.currentTarget));
    content.querySelectorAll('[data-flm-profile-tab]').forEach(button => button.addEventListener('click', () => {
      content.querySelectorAll('[data-flm-profile-tab]').forEach(item => item.classList.toggle('is-active', item === button));
      const panel = content.querySelector('[data-flm-profile-panel]');
      if (panel) panel.innerHTML = tabContent(button.dataset.flmProfileTab, player, data);
    }));

    return true;
  }

  async function openPlayer(id) {
    if (!id) return;
    const content = document.querySelector('.career-app.is-open .career-content');
    if (!content) {
      if (legacyProfile?.open) return legacyProfile.open(id);
      return;
    }

    const activeNav = document.querySelector('.career-nav-button.is-active[data-career-tab]');
    if (!activePlayerId && activeNav?.dataset.careerTab) sourceTab = activeNav.dataset.careerTab;

    if (!resolvedData) {
      content.innerHTML = '<div class="flm-ip-loading">LOADING PLAYER…</div>';
    }

    try {
      const data = await loadData();
      const player = data.players.find(item => item.id === id);
      if (!player) throw new Error(`Player not found: ${id}`);
      renderIntegrated(player, data);
    } catch (error) {
      console.error('FLM instant profile:', error);
      content.innerHTML = `<div class="flm-ip-error"><strong>PLAYER PROFILE UNAVAILABLE</strong><span>${esc(error.message)}</span><button type="button" data-flm-profile-back>BACK</button></div>`;
      content.querySelector('[data-flm-profile-back]')?.addEventListener('click', backToSource);
    }
  }

  async function playerIdFromDatabaseRow(row) {
    const data = await loadData();
    const name = row.querySelector('strong')?.textContent?.trim();
    const small = row.querySelector('small')?.textContent || '';
    const shirt = /#(\d+)/.exec(small)?.[1];
    const clubName = row.closest('.db-detail')?.querySelector('.db-detail-head h3')?.textContent?.trim();
    const club = data.clubs.find(item => item.name === clubName || item.shortName === clubName);
    return data.players.find(item => item.clubId === club?.id && item.name === name && (!shirt || String(item.shirtNumber) === shirt))?.id
      || data.players.find(item => item.clubId === club?.id && item.name === name)?.id
      || null;
  }

  function directIdFromTarget(target) {
    const direct = target.closest('[data-v044-profile],[data-player-profile],[data-inbox-player]');
    if (direct) return direct.dataset.v044Profile || direct.dataset.playerProfile || direct.dataset.inboxPlayer || null;
    const v044Name = target.closest('.v044-name')?.closest('[data-v044-row]');
    if (v044Name) return v044Name.dataset.v044Row || null;
    const careerName = target.closest('.career-player-name')?.closest('.career-player-row');
    if (careerName) return careerName.querySelector('[data-lineup-player]')?.value || null;
    return null;
  }

  document.addEventListener('click', event => {
    const careerContent = document.querySelector('.career-app.is-open .career-content');
    if (!careerContent) return;

    const directId = directIdFromTarget(event.target);
    if (directId) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openPlayer(directId);
      return;
    }

    const dbRow = event.target.closest('.db-player-row');
    if (dbRow) {
      event.preventDefault();
      event.stopImmediatePropagation();
      playerIdFromDatabaseRow(dbRow).then(id => id && openPlayer(id));
    }
  }, true);

  document.addEventListener('keydown', event => {
    if (!activePlayerId) return;
    if (event.target.matches('input,select,textarea')) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight' && event.key !== 'Escape') return;

    if (event.key === 'Escape') {
      event.preventDefault();
      backToSource();
      return;
    }

    const button = document.querySelector(event.key === 'ArrowLeft' ? '[data-flm-profile-player]:first-of-type' : '[data-flm-profile-player]:last-of-type');
    if (button) {
      event.preventDefault();
      openPlayer(button.dataset.flmProfilePlayer);
    }
  });

  function installOverride() {
    const current = window.FLMPlayerProfile;
    if (current && current.open !== openPlayer) legacyProfile = current;
    const api = {
      open: openPlayer,
      preload: warmData,
      get activePlayerId() { return activePlayerId; }
    };
    window.FLMPlayerProfile = api;
  }

  ensureStylesheet();

  const waitForRuntime = setInterval(() => {
    if (manager()?.loadDatabase) {
      clearInterval(waitForRuntime);
      if ('requestIdleCallback' in window) requestIdleCallback(warmData, { timeout: 1800 });
      else setTimeout(warmData, 300);
    }
  }, 50);

  const keepOverride = setInterval(() => {
    installOverride();
  }, 100);
  setTimeout(() => clearInterval(keepOverride), 5000);
  installOverride();
})();