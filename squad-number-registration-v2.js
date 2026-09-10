/* Football Lab Manager — squad number registration v2
 * Career-owned shirt numbers with an explicit manager workflow.
 * Numbers are season-scoped, new signings require registration and departed
 * players immediately release their number.
 */
(() => {
  'use strict';

  const VERSION = '2.0.0';
  const SAVE_KEY = 'flm-career-save';
  const STYLE_ID = 'flm-squad-number-registration-v2-style';
  const BASE_KEY = 'squad-number-registration';
  let dbPromise = null;
  let queued = false;

  const manager = () => window.FLMManager || null;
  const career = () => manager()?.activeCareer || null;
  const esc = value => String(value ?? '')
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const validNumber = value => Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 99;

  function loadDb() {
    if (!dbPromise && manager()?.loadDatabase) {
      dbPromise = Promise.resolve(manager().loadDatabase()).catch(error => {
        dbPromise = null;
        console.warn('FLM squad numbers database load failed:', error);
        return null;
      });
    }
    return dbPromise || Promise.resolve(null);
  }

  function persist(c) {
    if (!c) return;
    try {
      c.updatedAt = new Date().toISOString();
      localStorage.setItem(SAVE_KEY, JSON.stringify(c));
      const status = document.querySelector('[data-career-save-status]');
      if (status) status.textContent = 'SAVED';
    } catch (error) {
      console.warn('FLM squad number save failed:', error);
    }
  }

  function fullName(player) {
    const first = String(player?.firstName || '').trim();
    const last = String(player?.lastName || '').trim();
    return first && last ? `${first} ${last}` : String(player?.name || 'Unknown player').trim();
  }

  function seasonKey(c) {
    if (typeof c?.season === 'string' && c.season.trim()) return c.season.trim();
    if (c?.season?.label) return String(c.season.label);
    if (c?.seasonLabel) return String(c.seasonLabel);
    if (c?.currentSeason) return String(c.currentSeason);

    const date = String(c?.currentDate || c?.date || '').slice(0, 10);
    const match = date.match(/^(\d{4})-(\d{2})-/);
    if (match) {
      const year = Number(match[1]);
      const month = Number(match[2]);
      const start = month >= 6 ? year : year - 1;
      return `${start}/${String(start + 1).slice(-2)}`;
    }
    return '2026/27';
  }

  function safeSeason(season) {
    return String(season || 'season').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase();
  }

  function effectiveClubId(c, player) {
    return c?.transfers?.ownership?.[player?.id] || player?.clubId || null;
  }

  function squadFor(c, db) {
    const order = { GK:0, DEF:1, MID:2, ATT:3 };
    return (db?.players || [])
      .filter(player => effectiveClubId(c, player) === c?.clubId && !player.isPlaceholder)
      .sort((a,b) => (order[a.positionGroup] ?? 9) - (order[b.positionGroup] ?? 9)
        || String(a.lastName || a.name).localeCompare(String(b.lastName || b.name)));
  }

  function ensureNewsState(c) {
    let changed = false;
    if (!c.news || typeof c.news !== 'object') {
      c.news = { schemaVersion:1, items:[], generatedRounds:[] };
      changed = true;
    }
    if (!Array.isArray(c.news.items)) { c.news.items = []; changed = true; }
    if (!Array.isArray(c.news.generatedRounds)) { c.news.generatedRounds = []; changed = true; }
    return changed;
  }

  function archivePreviousSeason(c, previous) {
    if (!previous?.season || !previous.assignments || !Object.keys(previous.assignments).length) return false;
    if (!Array.isArray(c.squadNumberHistory)) c.squadNumberHistory = [];
    if (c.squadNumberHistory.some(entry => entry.season === previous.season)) return false;
    c.squadNumberHistory.push({
      season: previous.season,
      assignments: { ...previous.assignments },
      submittedAt: previous.submittedAt || null,
      archivedAt: new Date().toISOString()
    });
    return true;
  }

  function initialMessageId(c, season) {
    const reusable = (c.news?.items || []).find(item =>
      item.key === BASE_KEY && (!item.registrationSeason || item.registrationSeason === season));
    return reusable?.id || `news-${c.id}-${BASE_KEY}-${safeSeason(season)}`;
  }

  function currentDateLabel(c) {
    if (c?.preseason && c.preseason.phase !== 'complete') return 'PRE-SEASON';
    const round = Number(c?.roundIndex || 0);
    return round > 0 ? `R${round}` : 'PRE-SEASON';
  }

  function ensureMessage(c, state, { freshSeason = false, newPlayerNames = [] } = {}) {
    ensureNewsState(c);
    let item = c.news.items.find(entry => entry.id === state.messageId);
    if (!item && state.season === seasonKey(c)) {
      item = c.news.items.find(entry => entry.key === BASE_KEY && (!entry.registrationSeason || entry.registrationSeason === state.season));
      if (item) state.messageId = item.id;
    }
    if (!item) {
      item = {
        id: state.messageId,
        key: `${BASE_KEY}-${safeSeason(state.season)}`,
        registrationSeason: state.season,
        round:0,
        period:'AM',
        dateLabel:currentDateLabel(c),
        category:'Messages',
        source:'Club Secretary',
        title:'Squad numbers must be registered',
        body:'',
        priority:'important',
        relatedClubId:c.clubId,
        relatedPlayerId:null,
        order:95,
        read:false
      };
      c.news.items.push(item);
    }

    item.registrationSeason = state.season;
    item.relatedClubId = c.clubId;
    item.category = 'Messages';
    item.source = 'Club Secretary';
    item.priority = 'important';
    item.order = 95;

    const submitted = state.status === 'submitted';
    if (submitted) {
      item.title = `Squad numbers registered for ${state.season}`;
      item.body = `Your ${state.season} squad numbers are registered. Open Squad → SQUAD NUMBERS at any time to review them. If a player leaves, his number becomes available immediately. Any new signing will need a number before he is fully registered in your squad.`;
    } else if (newPlayerNames.length === 1) {
      item.title = `${newPlayerNames[0]} needs a squad number`;
      item.body = `Your new signing has no registered shirt number. Select ASSIGN SQUAD NUMBERS below, or open Squad → SQUAD NUMBERS. Existing registrations stay unchanged and any number released by a departed player is available again.`;
    } else if (newPlayerNames.length > 1) {
      item.title = `${newPlayerNames.length} players need squad numbers`;
      item.body = `New arrivals need shirt numbers. Select ASSIGN SQUAD NUMBERS below, or open Squad → SQUAD NUMBERS. Existing registrations stay unchanged and numbers released by departed players are available again.`;
    } else {
      item.title = 'Squad numbers must be registered';
      item.body = `Assign one unique shirt number from 1 to 99 to every first-team player for ${state.season}. Select ASSIGN SQUAD NUMBERS below, or open Squad → SQUAD NUMBERS. These registrations last for this season only and reset when the next pre-season begins.`;
    }

    if (freshSeason || newPlayerNames.length) {
      item.read = false;
      item.dateLabel = currentDateLabel(c);
    }
    return item;
  }

  function createState(c, db, season) {
    const squad = squadFor(c, db);
    return {
      schemaVersion:2,
      season,
      status:'pending',
      assignments:{},
      knownSquadIds:squad.map(player => player.id),
      messageId:initialMessageId(c, season),
      submittedAt:null,
      updatedAt:new Date().toISOString()
    };
  }

  function reconcile(c, db) {
    if (!c?.clubId || !db?.players) return null;
    let changed = ensureNewsState(c);
    const season = seasonKey(c);
    let state = c.squadNumberRegistration;
    let freshSeason = false;

    if (!state || state.schemaVersion < 2 || state.season !== season) {
      const previous = state ? JSON.parse(JSON.stringify(state)) : null;
      if (previous?.season === season) {
        state = c.squadNumberRegistration = {
          ...previous,
          schemaVersion:2,
          assignments: previous.assignments && typeof previous.assignments === 'object' ? previous.assignments : {},
          knownSquadIds: Array.isArray(previous.knownSquadIds) ? previous.knownSquadIds : squadFor(c, db).map(player => player.id),
          messageId: previous.messageId || initialMessageId(c, season)
        };
      } else {
        if (archivePreviousSeason(c, previous)) changed = true;
        state = c.squadNumberRegistration = createState(c, db, season);
        freshSeason = true;
      }
      changed = true;
    }

    if (!state.assignments || typeof state.assignments !== 'object' || Array.isArray(state.assignments)) {
      state.assignments = {};
      changed = true;
    }

    const squad = squadFor(c, db);
    const currentIds = squad.map(player => player.id);
    const currentSet = new Set(currentIds);
    const oldKnown = new Set(Array.isArray(state.knownSquadIds) ? state.knownSquadIds : currentIds);
    const newPlayers = squad.filter(player => !oldKnown.has(player.id));
    const departedIds = [...oldKnown].filter(id => !currentSet.has(id));

    for (const playerId of departedIds) {
      const oldNumber = state.assignments[playerId];
      const player = db.players.find(item => item.id === playerId);
      if (player && validNumber(oldNumber) && Number(player.shirtNumber) === Number(oldNumber)) player.shirtNumber = null;
      if (Object.prototype.hasOwnProperty.call(state.assignments, playerId)) {
        delete state.assignments[playerId];
        changed = true;
      }
    }

    if (JSON.stringify(state.knownSquadIds || []) !== JSON.stringify(currentIds)) {
      state.knownSquadIds = currentIds;
      changed = true;
    }

    for (const player of squad) {
      const assigned = state.assignments[player.id];
      const careerNumber = validNumber(assigned) ? Number(assigned) : null;
      if (player.shirtNumber !== careerNumber) player.shirtNumber = careerNumber;
    }

    const missing = squad.filter(player => !validNumber(state.assignments[player.id]));
    if (missing.length && state.status === 'submitted') {
      state.status = 'pending';
      state.submittedAt = null;
      changed = true;
    }

    const item = ensureMessage(c, state, {
      freshSeason,
      newPlayerNames:newPlayers.map(fullName)
    });
    if (newPlayers.length) changed = true;

    state.updatedAt ||= new Date().toISOString();
    if (changed) {
      state.updatedAt = new Date().toISOString();
      persist(c);
    }

    return { state, squad, missing, item, departedIds, newPlayers };
  }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .flm-number-modal{position:fixed;inset:0;z-index:30000;display:grid;place-items:center;padding:22px;background:#010812e8;backdrop-filter:blur(7px)}
      .flm-number-card{width:min(940px,96vw);max-height:min(790px,94vh);display:grid;grid-template-rows:auto auto minmax(0,1fr) auto;border:1px solid #28639d;background:#061326;box-shadow:0 28px 80px #000b;color:#eaf2f8}
      .flm-number-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;padding:17px 19px;border-bottom:1px solid #23527f;background:#0a3158}.flm-number-head small{display:block;color:#74e3a0;font-size:8px;font-weight:950;letter-spacing:.13em}.flm-number-head h2{margin:4px 0 0;font-size:21px}.flm-number-head p{margin:5px 0 0;color:#a9bfd1;font-size:10px;line-height:1.5}.flm-number-close{width:36px;height:32px;border:1px solid #3a6d9b;background:#061a31;color:#dcebf6;cursor:pointer}
      .flm-number-progress{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:9px 18px;border-bottom:1px solid #173a5d;background:#041426;color:#91a9bc;font-size:9px}.flm-number-progress strong{color:#55dc7c;font-size:10px}.flm-number-progress span:last-child{text-align:right}
      .flm-number-list{overflow:auto;padding:8px 10px}.flm-number-row{display:grid;grid-template-columns:62px minmax(0,1fr) 104px 92px;gap:10px;align-items:center;min-height:48px;padding:5px 8px;border-bottom:1px solid #173a5d}.flm-number-row.is-focus{outline:1px solid #55dc7c;background:#0b2942}.flm-number-row label{color:#7f9cb4;font-size:8px;font-weight:900;letter-spacing:.08em}.flm-number-row strong{font-size:12px}.flm-number-row span{color:#8ca6bc;font-size:9px}.flm-number-row input{width:72px;height:34px;padding:0 8px;border:1px solid #31699b;background:#031124;color:#fff;font-size:14px;font-weight:950;text-align:center;outline:none}.flm-number-row input:focus{border-color:#58dc84;box-shadow:0 0 0 1px #58dc84}.flm-number-row input.is-duplicate{border-color:#ef6b76;color:#ffb2b8}
      .flm-number-actions{display:flex;align-items:center;justify-content:flex-end;gap:7px;padding:12px 14px;border-top:1px solid #23527f;background:#04101f}.flm-number-error{margin-right:auto;color:#ff858d;font-size:9px;font-weight:850}.flm-number-actions button{min-height:36px;padding:0 12px;border:1px solid #326b9f;background:#0a294b;color:#e7f0f6;font-size:8px;font-weight:950;cursor:pointer}.flm-number-actions .primary{border-color:#55dc7c;background:#174d36;color:#eaffef}
      .career-inbox-detail .flm-number-inbox-action,.v046-detail .flm-number-inbox-action{display:inline-flex;align-items:center;justify-content:center;min-height:40px;margin-top:14px!important;padding:0 16px!important;border:1px solid #55dc7c!important;background:#174d36!important;color:#eaffef!important;font-size:9px!important;font-weight:950!important;letter-spacing:.04em;cursor:pointer}
      .flm-squad-number-entry{white-space:nowrap!important;border-color:#55dc7c!important;color:#dffff0!important}.flm-squad-number-toolbar{display:flex;justify-content:flex-end;margin:0 0 8px}.flm-squad-number-toolbar button{min-height:34px;padding:0 11px;border:1px solid #55dc7c;background:#123d2d;color:#eaffef;font-size:8px;font-weight:950;cursor:pointer}
      .flm-cm-number{position:relative}.flm-cm-number-manage{display:block;width:calc(100% - 12px);min-height:20px;margin:5px 6px 0;padding:2px 4px;border:1px solid #3b739f;background:#092744;color:#b9d0e0;font-size:6px;font-weight:950;letter-spacing:.04em;cursor:pointer}.flm-cm-number.is-unassigned .flm-cm-number-manage{border-color:#55dc7c;background:#174d36;color:#eaffef}.flm-cm-number-manage:hover,.flm-cm-number-manage:focus-visible{border-color:#74e3a0;color:#fff;outline:none}
      @media(max-width:650px){.flm-number-modal{padding:8px}.flm-number-row{grid-template-columns:50px minmax(0,1fr) 78px}.flm-number-row>span{display:none}.flm-number-actions{flex-wrap:wrap}.flm-number-error{width:100%;margin:0 0 4px}.flm-number-actions button{flex:1}.flm-number-progress{align-items:flex-start;flex-direction:column}.flm-number-progress span:last-child{text-align:left}}
    `;
    document.head.appendChild(style);
  }

  function validate(assignments, squad, requireAll) {
    const used = new Map();
    for (const player of squad) {
      const raw = assignments[player.id];
      if (raw == null || raw === '') {
        if (requireAll) return `Assign a number to ${fullName(player)}.`;
        continue;
      }
      if (!validNumber(raw)) return `${fullName(player)} needs a whole number from 1 to 99.`;
      const num = Number(raw);
      if (used.has(num)) return `Number ${num} is already assigned to ${used.get(num)}.`;
      used.set(num, fullName(player));
    }
    return '';
  }

  function openRegistration(focusPlayerId = null) {
    ensureStyles();
    Promise.all([loadDb()]).then(([db]) => {
      const c = career();
      if (!c || !db) return;
      const sync = reconcile(c, db);
      if (!sync) return;
      document.querySelector('.flm-number-modal')?.remove();
      const { state, squad } = sync;
      const assignments = { ...state.assignments };
      const club = db.clubs?.find(item => item.id === c.clubId);

      const modal = document.createElement('div');
      modal.className = 'flm-number-modal';
      modal.innerHTML = `<section class="flm-number-card" role="dialog" aria-modal="true" aria-label="Squad number registration">
        <header class="flm-number-head"><div><small>CLUB SECRETARY · ${esc(state.season)}</small><h2>REGISTER SQUAD NUMBERS</h2><p>${esc(club?.name || 'Your club')} · Assign one unique number from 1–99. These numbers apply to ${esc(state.season)} only.</p></div><button class="flm-number-close" type="button" data-number-close aria-label="Close">✕</button></header>
        <div class="flm-number-progress"><strong data-number-count>0 / ${squad.length} ASSIGNED</strong><span>Departed players release their number automatically. New signings appear here unassigned.</span></div>
        <div class="flm-number-list">${squad.map(player => `<div class="flm-number-row ${player.id === focusPlayerId ? 'is-focus' : ''}" data-number-row="${esc(player.id)}"><label for="num-${esc(player.id)}">NUMBER</label><div><strong>${esc(fullName(player))}</strong><br><span>${esc(player.primaryPosition || player.positionGroup || '—')}</span></div><span>${esc(player.positionGroup || '—')} · ${esc(player.primaryPosition || '—')}</span><input id="num-${esc(player.id)}" type="number" inputmode="numeric" min="1" max="99" step="1" placeholder="—" value="${validNumber(assignments[player.id]) ? esc(assignments[player.id]) : ''}" data-number-player="${esc(player.id)}" aria-label="Squad number for ${esc(fullName(player))}"></div>`).join('')}</div>
        <footer class="flm-number-actions"><div class="flm-number-error" data-number-error></div><button type="button" data-number-cancel>CANCEL</button><button type="button" data-number-draft>SAVE DRAFT</button><button type="button" class="primary" data-number-submit>REGISTER NUMBERS</button></footer>
      </section>`;
      document.body.appendChild(modal);

      const readInputs = () => {
        const next = {};
        modal.querySelectorAll('[data-number-player]').forEach(input => {
          const value = input.value.trim();
          if (value !== '' && validNumber(value)) next[input.dataset.numberPlayer] = Number(value);
          else if (value !== '') next[input.dataset.numberPlayer] = value;
        });
        return next;
      };

      const refreshProgress = () => {
        const next = readInputs();
        const values = new Map();
        let assigned = 0;
        modal.querySelectorAll('[data-number-player]').forEach(input => {
          input.classList.remove('is-duplicate');
          const value = input.value.trim();
          if (!value || !validNumber(value)) return;
          assigned += 1;
          const num = Number(value);
          if (!values.has(num)) values.set(num, []);
          values.get(num).push(input);
        });
        values.forEach(inputs => { if (inputs.length > 1) inputs.forEach(input => input.classList.add('is-duplicate')); });
        const count = modal.querySelector('[data-number-count]');
        if (count) count.textContent = `${assigned} / ${squad.length} ASSIGNED`;
        const error = validate(next, squad, false);
        const errorNode = modal.querySelector('[data-number-error]');
        if (errorNode) errorNode.textContent = error && /already assigned|whole number/.test(error) ? error : '';
      };

      const close = () => modal.remove();
      const save = submit => {
        const next = readInputs();
        const error = validate(next, squad, submit);
        const errorNode = modal.querySelector('[data-number-error]');
        if (error) { if (errorNode) errorNode.textContent = error; return; }

        state.assignments = Object.fromEntries(Object.entries(next).map(([id,value]) => [id, Number(value)]));
        state.status = submit ? 'submitted' : 'pending';
        state.submittedAt = submit ? new Date().toISOString() : null;
        state.updatedAt = new Date().toISOString();
        const item = ensureMessage(c, state);
        if (submit) item.read = true;
        persist(c);
        reconcile(c, db);
        document.dispatchEvent(new CustomEvent('flm:squad-numbers-updated', { detail:{ submitted:submit, season:state.season } }));
        close();
        queue();
      };

      modal.querySelector('[data-number-close]')?.addEventListener('click', close);
      modal.querySelector('[data-number-cancel]')?.addEventListener('click', close);
      modal.querySelector('[data-number-draft]')?.addEventListener('click', () => save(false));
      modal.querySelector('[data-number-submit]')?.addEventListener('click', () => save(true));
      modal.querySelectorAll('[data-number-player]').forEach(input => input.addEventListener('input', refreshProgress));
      modal.addEventListener('click', event => { if (event.target === modal) close(); });
      refreshProgress();

      const focus = focusPlayerId ? modal.querySelector(`[data-number-player="${CSS.escape(focusPlayerId)}"]`) : modal.querySelector('[data-number-player]');
      if (focus) {
        requestAnimationFrame(() => {
          focus.scrollIntoView({ block:'center', behavior:'smooth' });
          focus.focus();
          focus.select();
        });
      }
    }).catch(error => console.warn('FLM squad number modal failed:', error));
  }

  function selectedInboxItem(c) {
    const selected = document.querySelector('.career-inbox-row.is-selected[data-inbox-item], .v046-row.is-selected[data-v046-item]');
    if (!selected) return null;
    const id = selected.dataset.inboxItem || selected.dataset.v046Item;
    return c?.news?.items?.find(item => item.id === id) || null;
  }

  function isRegistrationMessage(item) {
    return !!item && (item.id === career()?.squadNumberRegistration?.messageId || String(item.key || '').startsWith(BASE_KEY));
  }

  function decorateInbox(c) {
    const detail = document.querySelector('.career-inbox-detail, .v046-detail');
    const item = selectedInboxItem(c);
    if (!detail || !isRegistrationMessage(item)) return;
    let button = detail.querySelector('[data-flm-number-open]');
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'career-inbox-detail-action flm-number-inbox-action';
      button.dataset.flmNumberOpen = '1';
      button.addEventListener('click', () => openRegistration());
      const source = detail.querySelector('.career-inbox-detail-source, .v046-source');
      if (source) source.insertAdjacentElement('afterend', button); else detail.appendChild(button);
    }
    button.textContent = c.squadNumberRegistration?.status === 'submitted' ? 'REVIEW SQUAD NUMBERS' : 'ASSIGN SQUAD NUMBERS';
  }

  function decorateSquad(c, sync) {
    const active = document.querySelector('.career-nav-button.is-active[data-career-tab="squad"], [data-career-tab="squad"].is-active');
    if (!active) return;
    const content = document.querySelector('.career-app.is-open .career-content');
    if (!content) return;
    const missing = sync?.missing?.length ?? 0;
    let button = content.querySelector('[data-flm-squad-number-entry]');
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'career-secondary flm-squad-number-entry';
      button.dataset.flmSquadNumberEntry = '1';
      button.addEventListener('click', () => openRegistration());
      const actions = content.querySelector('.career-squad-actions');
      if (actions) actions.insertBefore(button, actions.firstChild);
      else {
        const toolbar = document.createElement('div');
        toolbar.className = 'flm-squad-number-toolbar';
        toolbar.appendChild(button);
        const heading = content.querySelector('.career-page-heading');
        if (heading) heading.insertAdjacentElement('afterend', toolbar); else content.prepend(toolbar);
      }
    }
    button.textContent = missing ? `SQUAD NUMBERS · ${missing} UNASSIGNED` : 'SQUAD NUMBERS';
  }

  function decorateProfile(c, db) {
    const root = document.querySelector('.career-app.is-open .flm-instant-profile');
    const playerId = window.FLMPlayerProfile?.activePlayerId;
    const block = root?.querySelector('.flm-cm-number');
    if (!root || !playerId || !block) return;
    const player = db.players?.find(item => item.id === playerId);
    if (!player || effectiveClubId(c, player) !== c.clubId) {
      block.querySelector('[data-flm-profile-number-manage]')?.remove();
      return;
    }

    const assigned = c.squadNumberRegistration?.assignments?.[player.id];
    let button = block.querySelector('[data-flm-profile-number-manage]');
    if (!button) {
      button = document.createElement('button');
      button.type = 'button';
      button.className = 'flm-cm-number-manage';
      button.dataset.flmProfileNumberManage = '1';
      button.addEventListener('click', event => {
        event.stopPropagation();
        openRegistration(player.id);
      });
      block.appendChild(button);
    }
    button.textContent = validNumber(assigned) ? 'CHANGE NUMBER' : 'ASSIGN NUMBER';
    block.title = validNumber(assigned) ? 'Review or change this season squad number' : 'Assign this player a squad number';
  }

  async function syncUi() {
    queued = false;
    ensureStyles();
    const c = career();
    if (!c) return;
    const db = await loadDb();
    if (!db) return;
    const sync = reconcile(c, db);
    decorateInbox(c);
    decorateSquad(c, sync);
    decorateProfile(c, db);
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => syncUi().catch(error => console.warn('FLM squad number sync failed:', error)));
  }

  ensureStyles();
  new MutationObserver(queue).observe(document.body, { childList:true, subtree:true });
  ['flm:career-opened','flm:career-created','flm:career-data-refresh','flm:career-sync-complete','flm:career-tab-changed','flm:squad-numbers-updated']
    .forEach(name => document.addEventListener(name, queue));
  document.addEventListener('click', event => {
    if (event.target.closest('[data-career-tab],[data-inbox-item],[data-v046-item],[data-player-profile],[data-flm-profile-player]')) queue();
  }, true);
  document.addEventListener('flm:squad-numbers-open', event => openRegistration(event.detail?.playerId || null));
  queue();

  window.FLMSquadNumbers = Object.freeze({
    version:VERSION,
    open:openRegistration,
    refresh:queue,
    getNumber(playerId) {
      const value = career()?.squadNumberRegistration?.assignments?.[playerId];
      return validNumber(value) ? Number(value) : null;
    }
  });
})();
