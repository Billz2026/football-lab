(() => {
  'use strict';

  const DATA_VERSION = '60';
  let dataPromise = null;
  let activePlayerId = null;

  const esc = value => String(value ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

  const label = key => String(key || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/^./, c => c.toUpperCase());

  const hash = value => {
    let h = 2166136261;
    for (const char of String(value)) { h ^= char.charCodeAt(0); h = Math.imul(h, 16777619); }
    return Math.abs(h >>> 0);
  };

  async function loadData() {
    if (dataPromise) return dataPromise;
    const urls = [
      './data/model/player-model-v1.json',
      './data/current/metadata.json',
      './data/current/leagues.json',
      './data/current/clubs.json',
      './data/current/players.json'
    ];
    dataPromise = Promise.all(urls.map(url => fetch(`${url}?v=${DATA_VERSION}`, { cache: 'no-store' }).then(r => {
      if (!r.ok) throw new Error(`Profile data failed to load (${r.status})`);
      return r.json();
    }))).then(([model, metadata, leagues, clubs, players]) => ({ model, metadata, leagues, clubs, players }));
    return dataPromise;
  }

  function calcAge(dateOfBirth, snapshot = '2026-09-04') {
    if (!dateOfBirth) return null;
    const dob = new Date(`${dateOfBirth}T00:00:00Z`);
    const ref = new Date(`${snapshot}T00:00:00Z`);
    if (Number.isNaN(dob.getTime())) return null;
    let age = ref.getUTCFullYear() - dob.getUTCFullYear();
    const beforeBirthday = ref.getUTCMonth() < dob.getUTCMonth() || (ref.getUTCMonth() === dob.getUTCMonth() && ref.getUTCDate() < dob.getUTCDate());
    if (beforeBirthday) age -= 1;
    return age;
  }

  function playerAge(player, snapshot = '2026-09-04') {
    const calculated = calcAge(player.dateOfBirth, snapshot);
    if (calculated != null) return calculated;
    const reported = Number(player.reportedAge);
    return Number.isFinite(reported) && reported >= 15 && reported <= 50 ? reported : null;
  }

  function ratingClass(value) {
    if (value >= 18) return 'r-elite';
    if (value >= 15) return 'r-high';
    if (value >= 11) return 'r-mid';
    return '';
  }

  function positionBias(player, key) {
    const pos = player.positionGroup;
    const attacking = ['finishing','dribbling','offTheBall','flair','pace','acceleration','technique'];
    const defensive = ['tackling','positioning','heading','strength','anticipation'];
    const midfield = ['passing','vision','decisions','teamwork','workRate','firstTouch'];
    if (pos === 'ATT' && attacking.includes(key)) return 2;
    if (pos === 'DEF' && defensive.includes(key)) return 2;
    if (pos === 'MID' && midfield.includes(key)) return 2;
    if (pos === 'GK' && ['positioning','anticipation','composure','decisions','strength'].includes(key)) return 1;
    return 0;
  }

  function attributeValue(player, group, key) {
    const real = player.attributes?.[group]?.[key];
    if (Number.isInteger(real)) return real;
    const base = Math.max(5, Math.min(16, Math.round((player.currentAbility || 90) / 10)));
    const jitter = (hash(`${player.id}:${group}:${key}`) % 5) - 2;
    return Math.max(1, Math.min(20, base + jitter + positionBias(player, key)));
  }

  function personalityFor(player, model) {
    const stored = player.personality?.visibleId || player.personalityId;
    const found = stored && model.personalities.find(p => p.id === stored);
    if (found) return found;
    return model.personalities[hash(player.id) % model.personalities.length];
  }

  function statusFor(player) {
    return {
      condition: player.status?.condition ?? 100,
      sharpness: player.status?.matchSharpness ?? 90,
      morale: player.status?.morale ?? 'Good',
      form: player.status?.form ?? null,
      injuries: player.status?.injuries ?? 'None',
      suspension: player.status?.suspension ?? 'None'
    };
  }

  function seasonRows(player) {
    const rows = player.seasonStats;
    if (Array.isArray(rows) && rows.length) return rows;
    return [{ competition: 'No match data loaded', apps: 0, goals: 0, assists: 0, playerOfMatch: 0, passPct: null, tackles: null, dribbles: null, shots: null, averageRating: null }];
  }

  function formatMoney(value, currency = 'GBP') {
    if (value == null) return 'Not loaded';
    try { return new Intl.NumberFormat('en-GB', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value); }
    catch { return `${value}`; }
  }

  function developmentBand(age, model) {
    return model.development.ageBands.find(b => age != null && age >= b.min && age <= b.max) || model.development.ageBands.at(-1);
  }

  function initials(name) {
    return String(name || '?').split(/\s+/).filter(Boolean).slice(0,2).map(part => part[0]).join('').toUpperCase();
  }

  function attributeCard(player, model, group) {
    return `<section class="flm-attr-card"><div class="flm-card-title">${esc(group.toUpperCase())}</div><div class="flm-attr-list">${model.attributeGroups[group].map(key => {
      const value = attributeValue(player, group, key);
      return `<div class="flm-attr-row"><span>${esc(label(key))}</span><b class="flm-attr-value ${ratingClass(value)}">${value}</b></div>`;
    }).join('')}</div></section>`;
  }

  function renderStats(player) {
    const rows = seasonRows(player);
    return `<section class="flm-section-card flm-stats"><div class="flm-card-title">SEASON STATISTICS</div><table><thead><tr><th>Competition</th><th>Apps</th><th>Gls</th><th>Ast</th><th>POM</th><th>Pass %</th><th>Tck</th><th>Drb</th><th>Shots</th><th>Avg</th></tr></thead><tbody>${rows.map(row => `<tr><td>${esc(row.competition)}</td><td>${row.apps ?? '—'}</td><td>${row.goals ?? '—'}</td><td>${row.assists ?? '—'}</td><td>${row.playerOfMatch ?? '—'}</td><td>${row.passPct ?? '—'}</td><td>${row.tackles ?? '—'}</td><td>${row.dribbles ?? '—'}</td><td>${row.shots ?? '—'}</td><td>${row.averageRating ?? '—'}</td></tr>`).join('')}</tbody></table></section>`;
  }

  function renderProfileTab(root, player, db) {
    const status = statusFor(player);
    const personality = personalityFor(player, db.model);
    const age = playerAge(player, db.metadata.snapshotDate || '2026-09-04');
    const positions = [player.primaryPosition, ...(player.secondaryPositions || [])].filter(Boolean);
    root.innerHTML = `
      <div class="flm-profile-grid">
        ${attributeCard(player, db.model, 'technical')}
        ${attributeCard(player, db.model, 'mental')}
        ${attributeCard(player, db.model, 'physical')}
        <section class="flm-info-card">
          <div class="flm-card-title">CURRENT STATUS</div>
          <div class="flm-info-list">
            <div class="flm-info-row"><span>Condition</span><strong class="good">${esc(status.condition)}%</strong></div>
            <div class="flm-info-row"><span>Match Sharpness</span><strong class="good">${esc(status.sharpness)}%</strong></div>
            <div class="flm-info-row"><span>Morale</span><strong>${esc(status.morale)}</strong></div>
            <div class="flm-info-row"><span>Form</span><strong>${status.form ?? '—'}</strong></div>
            <div class="flm-info-row"><span>Injuries</span><strong class="good">${esc(status.injuries)}</strong></div>
            <div class="flm-info-row"><span>Suspension</span><strong class="good">${esc(status.suspension)}</strong></div>
          </div>
          <div class="flm-card-title">PERSONAL</div>
          <div class="flm-info-list">
            <div class="flm-info-row"><span>Nationality</span><strong>${esc(player.nationalityCode || '—')}</strong></div>
            <div class="flm-info-row"><span>Age</span><strong>${age ?? '—'}</strong></div>
            <div class="flm-info-row"><span>Height</span><strong>${player.heightCm ? `${player.heightCm} cm` : '—'}</strong></div>
            <div class="flm-info-row"><span>Weight</span><strong>${player.weightKg ? `${player.weightKg} kg` : '—'}</strong></div>
            <div class="flm-info-row"><span>Preferred Foot</span><strong>${esc(label(player.preferredFoot || 'unknown'))}</strong></div>
            <div class="flm-info-row"><span>Personality</span><strong>${esc(personality.label)}</strong></div>
            <div class="flm-info-row"><span>Squad Status</span><strong>${esc(player.contract?.squadStatus || '—')}</strong></div>
          </div>
          <div class="flm-card-title">POSITIONS</div>
          <div class="flm-pills">${positions.map((p,i) => `<span class="flm-pill ${i===0?'primary':''}">${esc(p)}</span>`).join('')}</div>
        </section>
      </div>
      ${renderStats(player)}`;
  }

  function renderFormTab(root, player) {
    const status = statusFor(player);
    root.innerHTML = `<div class="flm-secondary-grid">
      <section class="flm-section-card"><div class="flm-card-title">CURRENT FORM</div><div class="flm-info-list">
        <div class="flm-info-row"><span>Average Rating</span><strong>${status.form ?? '—'}</strong></div>
        <div class="flm-info-row"><span>Condition</span><strong>${status.condition}%</strong></div>
        <div class="flm-info-row"><span>Match Sharpness</span><strong>${status.sharpness}%</strong></div>
        <div class="flm-info-row"><span>Morale</span><strong>${esc(status.morale)}</strong></div>
      </div></section>
      <section class="flm-section-card"><div class="flm-card-title">RECENT MATCHES</div><div class="flm-empty-panel">Match-by-match form will populate once fixtures and the match engine are connected.</div></section>
    </div>${renderStats(player)}`;
  }

  function renderContractTab(root, player) {
    const c = player.contract || {};
    root.innerHTML = `<div class="flm-secondary-grid">
      <section class="flm-section-card"><div class="flm-card-title">CONTRACT</div><div class="flm-info-list">
        <div class="flm-info-row"><span>Weekly Wage</span><strong>${esc(formatMoney(c.weeklyWage, c.currency || 'GBP'))}</strong></div>
        <div class="flm-info-row"><span>Start Date</span><strong>${esc(c.startDate || 'Not loaded')}</strong></div>
        <div class="flm-info-row"><span>Expiry</span><strong>${esc(c.endDate || 'Not loaded')}</strong></div>
        <div class="flm-info-row"><span>Squad Status</span><strong>${esc(c.squadStatus || 'Not set')}</strong></div>
      </div></section>
      <section class="flm-section-card"><div class="flm-card-title">CONTRACT ENGINE</div><div class="flm-copy"><strong>V1 rule:</strong> wages, promises, bonuses and contract expectations will be driven by club level, reputation, playing status and player ambition. Real contract terms are not fabricated when the data provider does not supply them.</div></section>
    </div>`;
  }

  function renderTransferTab(root, player) {
    root.innerHTML = `<div class="flm-secondary-grid">
      <section class="flm-section-card"><div class="flm-card-title">TRANSFER STATUS</div><div class="flm-info-list">
        <div class="flm-info-row"><span>Estimated Value</span><strong>${esc(player.estimatedValue || 'Not rated')}</strong></div>
        <div class="flm-info-row"><span>Transfer Listed</span><strong>${player.transfer?.listed ? 'Yes' : 'No'}</strong></div>
        <div class="flm-info-row"><span>Loan Listed</span><strong>${player.transfer?.loanListed ? 'Yes' : 'No'}</strong></div>
        <div class="flm-info-row"><span>Known Interest</span><strong>${esc(player.transfer?.interest || 'None')}</strong></div>
      </div></section>
      <section class="flm-section-card"><div class="flm-card-title">MARKET LOGIC</div><div class="flm-copy">Football Lab Manager will calculate dynamic values from ability, age, reputation, form, contract length, potential, league strength and buying-club demand rather than copying another management game's valuation database.</div></section>
    </div>`;
  }

  function renderDevelopmentTab(root, player, db) {
    const age = playerAge(player, db.metadata.snapshotDate || '2026-09-04');
    const band = developmentBand(age, db.model);
    const personality = personalityFor(player, db.model);
    const history = player.personality?.history || [];
    root.innerHTML = `<div class="flm-secondary-grid">
      <section class="flm-section-card"><div class="flm-card-title">DEVELOPMENT PROFILE</div><div class="flm-info-list">
        <div class="flm-info-row"><span>Development Stage</span><strong>${esc(band?.developmentLabel || '—')}</strong></div>
        <div class="flm-info-row"><span>Personality</span><strong>${esc(personality.label)}</strong></div>
        <div class="flm-info-row"><span>Personality Malleability</span><strong>${band ? `${Math.round(band.personalityMalleability*100)}%` : '—'}</strong></div>
        <div class="flm-info-row"><span>Mentoring</span><strong>${age != null && age <= 24 ? 'High impact' : age != null && age <= 28 ? 'Moderate impact' : 'Limited impact'}</strong></div>
      </div><div class="flm-dev-meter"><span style="width:${band ? Math.round(band.personalityMalleability*100) : 0}%"></span></div></section>
      <section class="flm-section-card"><div class="flm-card-title">HIDDEN ENGINE</div><div class="flm-copy">Current Ability, Potential Ability and the nine underlying personality traits are intentionally hidden from the manager. Scouting, coaching and long-term observation should reveal the player indirectly rather than exposing engine numbers.</div></section>
      <section class="flm-section-card"><div class="flm-card-title">PERSONALITY HISTORY</div><div class="flm-copy">${history.length ? history.map(item => `<strong>${esc(item.age ?? '')}</strong> — ${esc(item.label || item.personality || '')}<br>`).join('') : `Current classification: <strong>${esc(personality.label)}</strong>. Future changes can be caused by age, mentoring, club culture and career events.`}</div></section>
      <section class="flm-section-card"><div class="flm-card-title">MENTORING MODEL</div><div class="flm-copy">Influence is based on seniority, leadership, professionalism, reputation, relationship strength, age gap, time together and personality compatibility. Mentoring can improve or damage traits; it is never an automatic upgrade.</div></section>
    </div>`;
  }

  function renderHistoryTab(root, player, db) {
    const club = db.clubs.find(c => c.id === player.clubId);
    const history = player.careerHistory || [];
    root.innerHTML = `<section class="flm-section-card"><div class="flm-card-title">CAREER HISTORY</div>${history.length ? `<div class="flm-info-list">${history.map(item => `<div class="flm-info-row"><span>${esc(item.season || item.year || '—')}</span><strong>${esc(item.clubName || item.club || '')} · ${item.apps ?? 0} apps · ${item.goals ?? 0} goals</strong></div>`).join('')}</div>` : `<div class="flm-empty-panel">No historical season records are loaded for this development player yet.<br>Current club: ${esc(club?.name || '—')}</div>`}</section>`;
  }

  function shortlistSet() {
    try { return new Set(JSON.parse(localStorage.getItem('flm-shortlist') || '[]')); }
    catch { return new Set(); }
  }

  function toggleShortlist(playerId, button) {
    const set = shortlistSet();
    if (set.has(playerId)) set.delete(playerId); else set.add(playerId);
    localStorage.setItem('flm-shortlist', JSON.stringify([...set]));
    button.textContent = set.has(playerId) ? '★ SHORTLISTED' : '☆ ADD TO SHORTLIST';
  }

  function backToDatabase() {
    document.querySelector('[data-action="database"]')?.click();
  }

  function renderCompare(player, db, root) {
    const candidates = db.players.filter(p => p.id !== player.id);
    const defaultOther = candidates.find(p => p.clubId === player.clubId) || candidates[0];
    if (!defaultOther) { root.innerHTML = '<div class="flm-empty-panel">No other player is loaded to compare.</div>'; return; }
    root.innerHTML = `<div class="flm-compare-controls"><select data-compare-select>${candidates.map(p => `<option value="${esc(p.id)}" ${p.id===defaultOther.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select><button class="flm-profile-action" data-compare-back>BACK TO PROFILE</button></div><div data-compare-body></div>`;
    const select = root.querySelector('[data-compare-select]');
    const body = root.querySelector('[data-compare-body]');
    const draw = () => {
      const other = db.players.find(p => p.id === select.value) || defaultOther;
      body.innerHTML = `<section class="flm-section-card"><div class="flm-compare-grid"><div class="flm-compare-name">${esc(player.name)}</div><div class="flm-compare-name">${esc(other.name)}</div></div>${Object.entries(db.model.attributeGroups).map(([group, keys]) => `<div class="flm-card-title">${group.toUpperCase()}</div>${keys.map(key => {
        const a = attributeValue(player, group, key), b = attributeValue(other, group, key);
        return `<div class="flm-compare-row"><b class="${a>b?'winner':''}">${a}</b><span>${esc(label(key))}</span><b class="${b>a?'winner':''}">${b}</b></div>`;
      }).join('')}`).join('')}</section>`;
    };
    select.addEventListener('change', draw);
    root.querySelector('[data-compare-back]').addEventListener('click', () => renderPlayer(player, db));
    draw();
  }

  function renderPlayer(player, db) {
    activePlayerId = player.id;
    const club = db.clubs.find(c => c.id === player.clubId);
    const league = db.leagues.find(l => l.id === club?.leagueId);
    const personality = personalityFor(player, db.model);
    const age = playerAge(player, db.metadata.snapshotDate || '2026-09-04');
    const modal = document.getElementById('appModal');
    const card = modal?.querySelector('.modal-card');
    const title = document.getElementById('modalTitle');
    const eyebrow = document.getElementById('modalEyebrow');
    const copy = document.getElementById('modalCopy');
    const body = document.getElementById('modalBody');
    const actions = document.getElementById('modalActions');
    if (!modal || !body) return;

    card?.classList.add('modal-wide');
    eyebrow.textContent = `PLAYER PROFILE · ${league?.name || 'FOOTBALL LAB'}`;
    title.textContent = player.name;
    copy.textContent = player.isPlaceholder ? 'Development player used to validate the locked Football Lab Manager Player Model v1.' : `${club?.name || ''} player profile.`;

    const short = shortlistSet();
    body.innerHTML = `<div class="flm-profile">
      <div class="flm-profile-head">
        <div class="flm-player-avatar"><strong>${esc(initials(player.name))}</strong><span>NO PHOTO</span></div>
        <div class="flm-profile-name"><h3>${esc(player.firstName || player.name.split(' ')[0])} <span>${esc(player.lastName || player.name.split(' ').slice(1).join(' '))}</span></h3>
          <div class="flm-profile-sub">${esc(club?.name || 'Unattached')} · ${esc(player.nationalityCode || '—')}</div>
          <div class="flm-profile-position">${esc([player.primaryPosition, ...(player.secondaryPositions || [])].filter(Boolean).join(' / '))}</div>
          <div class="flm-profile-facts"><span>Age ${age ?? '—'}</span><span>${player.heightCm ? `${player.heightCm} cm` : 'Height —'}</span><span>${player.weightKg ? `${player.weightKg} kg` : 'Weight —'}</span><span>${esc(label(player.preferredFoot || 'unknown'))} foot</span><span>#${esc(player.shirtNumber || '—')}</span></div>
        </div>
        <div class="flm-profile-actions">
          <div class="flm-profile-value"><small>ESTIMATED VALUE</small><strong>${esc(player.estimatedValue || 'NOT RATED')}</strong></div>
          <div class="flm-profile-value"><small>PERSONALITY</small><strong>${esc(personality.label)}</strong></div>
          <button class="flm-profile-action" data-profile-compare>COMPARE PLAYER</button>
          <button class="flm-profile-action" data-profile-shortlist>${short.has(player.id) ? '★ SHORTLISTED' : '☆ ADD TO SHORTLIST'}</button>
        </div>
      </div>
      <div class="flm-profile-tabs">${db.model.profileTabs.map((tab,i) => `<button class="flm-profile-tab ${i===0?'is-active':''}" data-profile-tab="${esc(tab)}">${esc(tab.toUpperCase())}</button>`).join('')}</div>
      <div data-profile-panel></div>
    </div>`;

    const panel = body.querySelector('[data-profile-panel]');
    const tabs = [...body.querySelectorAll('[data-profile-tab]')];
    const drawTab = tab => {
      tabs.forEach(button => button.classList.toggle('is-active', button.dataset.profileTab === tab));
      if (tab === 'profile') renderProfileTab(panel, player, db);
      if (tab === 'form') renderFormTab(panel, player);
      if (tab === 'contract') renderContractTab(panel, player);
      if (tab === 'transfer') renderTransferTab(panel, player);
      if (tab === 'development') renderDevelopmentTab(panel, player, db);
      if (tab === 'history') renderHistoryTab(panel, player, db);
    };
    tabs.forEach(button => button.addEventListener('click', () => drawTab(button.dataset.profileTab)));
    body.querySelector('[data-profile-compare]').addEventListener('click', () => {
      tabs.forEach(button => button.classList.remove('is-active'));
      renderCompare(player, db, panel);
    });
    body.querySelector('[data-profile-shortlist]').addEventListener('click', event => toggleShortlist(player.id, event.currentTarget));

    actions.innerHTML = '';
    const back = document.createElement('button'); back.type='button'; back.textContent='BACK TO DATABASE'; back.addEventListener('click', backToDatabase);
    const close = document.createElement('button'); close.type='button'; close.textContent='CLOSE'; close.setAttribute('data-close-modal','');
    actions.append(back, close);
    drawTab('profile');
  }

  async function openFromRow(row) {
    try {
      const db = await loadData();
      const name = row.querySelector('strong')?.textContent?.trim();
      const small = row.querySelector('small')?.textContent || '';
      const shirt = /#(\d+)/.exec(small)?.[1];
      const clubName = row.closest('.db-detail')?.querySelector('.db-detail-head h3')?.textContent?.trim();
      const club = db.clubs.find(c => c.name === clubName);
      const player = db.players.find(p => p.clubId === club?.id && p.name === name && (!shirt || String(p.shirtNumber) === shirt)) || db.players.find(p => p.clubId === club?.id && p.name === name);
      if (player) renderPlayer(player, db);
    } catch (error) {
      console.error('FLM player profile:', error);
    }
  }

  function prepareRows(root = document) {
    root.querySelectorAll?.('.db-player-row').forEach(row => {
      if (row.dataset.profileReady) return;
      row.dataset.profileReady = 'true';
      row.querySelectorAll('.db-player-rating').forEach(item => item.remove());
      row.tabIndex = 0;
      row.setAttribute('role','button');
      row.setAttribute('aria-label', `Open ${row.querySelector('strong')?.textContent || 'player'} profile`);
      row.title = 'Open player profile';
    });
  }

  document.addEventListener('click', event => {
    const row = event.target.closest('.db-player-row');
    if (row) openFromRow(row);
  });
  document.addEventListener('keydown', event => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('.db-player-row')) {
      event.preventDefault(); openFromRow(event.target);
    }
  });

  const observer = new MutationObserver(mutations => mutations.forEach(m => m.addedNodes.forEach(node => { if (node.nodeType === 1) prepareRows(node); })));
  observer.observe(document.body, { childList:true, subtree:true });
  prepareRows();

  window.FLMPlayerProfile = { open: async playerId => { const db = await loadData(); const player = db.players.find(p => p.id === playerId); if (player) renderPlayer(player, db); }, get activePlayerId(){ return activePlayerId; } };
})();