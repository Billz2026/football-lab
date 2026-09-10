/* Football Lab Manager — squad number registration v1
 * User-club squad numbers start unassigned and are registered by the manager.
 * Source numbers are never treated as career assignments.
 */
(() => {
  'use strict';

  const VERSION = '1.0.0';
  const SAVE_KEY = 'flm-career-save';
  const NEWS_KEY = 'squad-number-registration';
  const STYLE_ID = 'flm-squad-number-registration-v1-style';
  let dbCache = null;
  let wrapped = false;
  let queued = false;

  const manager = () => window.FLMManager || null;
  const career = () => manager()?.activeCareer || null;
  const esc = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  const fullName = player => {
    const first = String(player?.firstName || '').trim();
    const last = String(player?.lastName || '').trim();
    return first && last ? `${first} ${last}` : String(player?.name || 'Unknown player').trim();
  };
  const validNumber = value => Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 99;

  function persist(c) {
    if (!c) return;
    try {
      c.updatedAt = new Date().toISOString();
      localStorage.setItem(SAVE_KEY, JSON.stringify(c));
    } catch (error) {
      console.warn('FLM squad number save failed:', error);
    }
  }

  function seasonKey(c) {
    return String(c?.season?.label || c?.seasonLabel || c?.currentSeason || '2026/27');
  }

  function squadFor(c, db) {
    const order = { GK:0, DEF:1, MID:2, ATT:3 };
    return (db?.players || [])
      .filter(player => player.clubId === c?.clubId && !player.isPlaceholder)
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

  function ensureRegistration(c, db) {
    if (!c?.clubId || !db?.players) return false;
    let changed = ensureNewsState(c);
    const season = seasonKey(c);
    let state = c.squadNumberRegistration;
    if (!state || state.schemaVersion !== 1 || state.season !== season) {
      state = c.squadNumberRegistration = {
        schemaVersion:1,
        season,
        status:'pending',
        assignments:{},
        submittedAt:null,
        updatedAt:new Date().toISOString()
      };
      changed = true;
    }
    if (!state.assignments || typeof state.assignments !== 'object') {
      state.assignments = {};
      changed = true;
    }

    const squad = squadFor(c, db);
    const missing = squad.filter(player => !validNumber(state.assignments[player.id]));
    if (state.status === 'submitted' && missing.length) {
      state.status = 'pending';
      state.submittedAt = null;
      state.updatedAt = new Date().toISOString();
      changed = true;
    }

    // Career numbers are authoritative for the user's club. Until the manager
    // assigns one, the player deliberately has no displayed squad number.
    for (const player of squad) {
      const assigned = state.assignments[player.id];
      const next = validNumber(assigned) ? Number(assigned) : null;
      if (player.shirtNumber !== next) player.shirtNumber = next;
    }

    const id = `news-${c.id}-${NEWS_KEY}`;
    let item = c.news.items.find(entry => entry.id === id || entry.key === NEWS_KEY);
    const submitted = state.status === 'submitted' && !missing.length;
    const title = submitted ? 'Squad numbers registered' : 'Squad numbers must be registered';
    const body = submitted
      ? `Your ${season} squad numbers have been registered. The assigned number now appears prominently on each player profile. You can review the list if a squad change requires an amendment.`
      : `Please assign a unique shirt number from 1 to 99 to every first-team player before the opening Premier League fixture. Source squad numbers are not carried into your career automatically — these are your registrations as manager.`;

    if (!item) {
      item = {
        id,
        key:NEWS_KEY,
        round:0,
        period:'AM',
        dateLabel:'PRE-SEASON',
        category:'Messages',
        source:'Club Secretary',
        title,
        body,
        priority:'important',
        relatedClubId:c.clubId,
        relatedPlayerId:null,
        order:95,
        read:false
      };
      c.news.items.push(item);
      changed = true;
    } else {
      if (item.title !== title) { item.title = title; changed = true; }
      if (item.body !== body) { item.body = body; changed = true; }
      if (item.relatedClubId !== c.clubId) { item.relatedClubId = c.clubId; changed = true; }
      if (item.order !== 95) { item.order = 95; changed = true; }
    }

    if (changed) persist(c);
    return changed;
  }

  function apply(db = dbCache) {
    const c = career();
    if (!c || !db) return;
    ensureRegistration(c, db);
  }

  function ensureStyles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = `
      .flm-number-modal{position:fixed;inset:0;z-index:30000;display:grid;place-items:center;padding:22px;background:#010812d9;backdrop-filter:blur(7px)}
      .flm-number-card{width:min(900px,96vw);max-height:min(760px,92vh);display:grid;grid-template-rows:auto minmax(0,1fr) auto;border:1px solid #28639d;background:#061326;box-shadow:0 28px 80px #000b;color:#eaf2f8}
      .flm-number-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;padding:17px 19px;border-bottom:1px solid #23527f;background:#0a3158}
      .flm-number-head small{display:block;color:#74e3a0;font:900 8px/1.2 inherit;letter-spacing:.13em}.flm-number-head h2{margin:4px 0 0;font-size:21px}.flm-number-head p{margin:5px 0 0;color:#9fb4c7;font-size:10px;line-height:1.5}
      .flm-number-close{width:36px;height:32px;border:1px solid #3a6d9b;background:#061a31;color:#dcebf6;cursor:pointer}
      .flm-number-list{overflow:auto;padding:8px 10px}.flm-number-row{display:grid;grid-template-columns:62px minmax(0,1fr) 90px 92px;gap:10px;align-items:center;min-height:46px;padding:5px 8px;border-bottom:1px solid #173a5d}
      .flm-number-row label{color:#7f9cb4;font:900 8px/1.2 inherit;letter-spacing:.08em}.flm-number-row strong{font-size:12px}.flm-number-row span{color:#8ca6bc;font-size:9px}.flm-number-row input{width:72px;height:34px;padding:0 8px;border:1px solid #31699b;background:#031124;color:#fff;font:900 14px/1 inherit;text-align:center;outline:none}.flm-number-row input:focus{border-color:#58dc84;box-shadow:0 0 0 1px #58dc84}
      .flm-number-actions{display:flex;align-items:center;justify-content:flex-end;gap:7px;padding:12px 14px;border-top:1px solid #23527f;background:#04101f}.flm-number-error{margin-right:auto;color:#ff858d;font-size:9px;font-weight:800}.flm-number-actions button{min-height:36px;padding:0 12px;border:1px solid #326b9f;background:#0a294b;color:#e7f0f6;font-size:8px;font-weight:950;cursor:pointer}.flm-number-actions .primary{border-color:#55dc7c;background:#174d36;color:#eaffef}
      .v046-detail [data-flm-number-open]{border-color:#55dc7c!important;background:#174d36!important;color:#eaffef!important}
      @media(max-width:650px){.flm-number-modal{padding:8px}.flm-number-row{grid-template-columns:52px minmax(0,1fr) 74px}.flm-number-row>span{display:none}.flm-number-actions{flex-wrap:wrap}.flm-number-error{width:100%;margin:0 0 4px}.flm-number-actions button{flex:1}}
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

  function openRegistration() {
    ensureStyles();
    const c = career();
    const db = dbCache;
    if (!c || !db) return;
    ensureRegistration(c, db);
    document.querySelector('.flm-number-modal')?.remove();
    const squad = squadFor(c, db);
    const assignments = { ...(c.squadNumberRegistration?.assignments || {}) };
    const club = db.clubs?.find(item => item.id === c.clubId);

    const modal = document.createElement('div');
    modal.className = 'flm-number-modal';
    modal.innerHTML = `<section class="flm-number-card" role="dialog" aria-modal="true" aria-label="Squad number registration">
      <header class="flm-number-head"><div><small>CLUB SECRETARY · ${esc(seasonKey(c))}</small><h2>REGISTER SQUAD NUMBERS</h2><p>${esc(club?.name || 'Your club')} · Every current first-team player must have one unique number from 1–99.</p></div><button class="flm-number-close" type="button" data-number-close aria-label="Close">✕</button></header>
      <div class="flm-number-list">${squad.map(player => `<div class="flm-number-row"><label for="num-${esc(player.id)}">NUMBER</label><div><strong>${esc(fullName(player))}</strong><br><span>${esc(player.primaryPosition || player.positionGroup || '—')}</span></div><span>${esc(player.positionGroup || '—')} · ${esc(player.primaryPosition || '—')}</span><input id="num-${esc(player.id)}" type="number" inputmode="numeric" min="1" max="99" step="1" placeholder="—" value="${validNumber(assignments[player.id]) ? esc(assignments[player.id]) : ''}" data-number-player="${esc(player.id)}"></div>`).join('')}</div>
      <footer class="flm-number-actions"><div class="flm-number-error" data-number-error></div><button type="button" data-number-cancel>CANCEL</button><button type="button" data-number-draft>SAVE DRAFT</button><button type="button" class="primary" data-number-submit>SUBMIT NUMBERS</button></footer>
    </section>`;
    document.body.appendChild(modal);

    const readInputs = () => {
      const next = {};
      modal.querySelectorAll('[data-number-player]').forEach(input => {
        const value = input.value.trim();
        if (value !== '') next[input.dataset.numberPlayer] = Number(value);
      });
      return next;
    };
    const close = () => modal.remove();
    const save = submit => {
      const next = readInputs();
      const error = validate(next, squad, submit);
      const errorNode = modal.querySelector('[data-number-error]');
      if (error) { if (errorNode) errorNode.textContent = error; return; }
      c.squadNumberRegistration.assignments = next;
      c.squadNumberRegistration.status = submit ? 'submitted' : 'pending';
      c.squadNumberRegistration.submittedAt = submit ? new Date().toISOString() : null;
      c.squadNumberRegistration.updatedAt = new Date().toISOString();
      persist(c);
      apply(db);
      document.dispatchEvent(new CustomEvent('flm:squad-numbers-updated', { detail:{ submitted:submit } }));
      close();
      queue();
    };

    modal.querySelector('[data-number-close]')?.addEventListener('click', close);
    modal.querySelector('[data-number-cancel]')?.addEventListener('click', close);
    modal.querySelector('[data-number-draft]')?.addEventListener('click', () => save(false));
    modal.querySelector('[data-number-submit]')?.addEventListener('click', () => save(true));
    modal.addEventListener('click', event => { if (event.target === modal) close(); });
    modal.querySelector('input')?.focus();
  }

  function decorateInbox() {
    const c = career();
    if (!c?.news?.items) return;
    const selected = document.querySelector('.v046-row.is-selected[data-v046-item]');
    const detail = document.querySelector('.v046-detail');
    if (!selected || !detail || detail.querySelector('[data-flm-number-open]')) return;
    const item = c.news.items.find(entry => entry.id === selected.dataset.v046Item);
    if (item?.key !== NEWS_KEY) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.flmNumberOpen = '1';
    button.textContent = c.squadNumberRegistration?.status === 'submitted' ? 'REVIEW SQUAD NUMBERS' : 'ASSIGN SHIRT NUMBERS';
    button.addEventListener('click', openRegistration);
    detail.appendChild(button);
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      apply();
      decorateInbox();
    });
  }

  function install() {
    const mgr = manager();
    if (!mgr?.loadDatabase || wrapped) return false;
    const base = mgr.loadDatabase.bind(mgr);
    mgr.loadDatabase = async (...args) => {
      const db = await base(...args);
      dbCache = db;
      apply(db);
      return db;
    };
    wrapped = true;
    mgr.loadDatabase().then(db => { dbCache = db; apply(db); queue(); }).catch(error => console.error('FLM squad number init failed:', error));
    return true;
  }

  ensureStyles();
  if (!install()) {
    const wait = setInterval(() => { if (install()) clearInterval(wait); }, 25);
    setTimeout(() => clearInterval(wait), 10000);
  }
  new MutationObserver(queue).observe(document.body, { childList:true, subtree:true });
  ['flm:career-opened','flm:career-created','flm:career-data-refresh','flm:career-sync-complete','flm:career-tab-changed']
    .forEach(name => document.addEventListener(name, queue));
  document.addEventListener('flm:squad-numbers-open', openRegistration);
  queue();

  window.FLMSquadNumbers = Object.freeze({ version:VERSION, open:openRegistration, refresh:queue });
})();
