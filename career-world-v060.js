import { beginCompetitiveSeason } from './preseason-v047.js?v=0.4.7';
import {
  FIXTURE_RELEASE_DATE,
  TRANSFER_OPEN_DATE,
  compareDates,
  continueCareer,
  ensureWorldClock,
  formatCareerDate,
  getCurrentAttention,
  getNextPreseasonDate,
  getNextScheduledEvent,
  getUserLeagueFixture,
  syncWorldCalendarNews
} from './world-clock-v060.js?v=0.6.0';

const SAVE_KEY = 'flm-career-save';
let queued = false;
let running = false;
let browserDb = null;

const manager = () => window.FLMManager;
const career = () => manager()?.activeCareer || null;
const esc = value => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

function persist(c) {
  if (!c) return;
  c.updatedAt = new Date().toISOString();
  if (localStorage.getItem('flm-autosave') !== 'false') localStorage.setItem(SAVE_KEY, JSON.stringify(c));
  const status = document.querySelector('[data-career-save-status]');
  if (status) status.textContent = localStorage.getItem('flm-autosave') === 'false' ? 'MANUAL SAVE' : 'SAVED';
}

function toast(message, error = false) {
  document.querySelector('.career-toast.v060-toast')?.remove();
  const element = document.createElement('div');
  element.className = `career-toast v060-toast${error ? ' is-error' : ''}`;
  element.textContent = message;
  document.body.appendChild(element);
  requestAnimationFrame(() => element.classList.add('is-visible'));
  setTimeout(() => element.remove(), 3000);
}

function loadStyles() {
  if (document.getElementById('flm-v060-style')) return;
  const style = document.createElement('style');
  style.id = 'flm-v060-style';
  style.textContent = `
.version-chip{font-size:0!important}.version-chip::after{content:'V0.6'!important;font-size:11px!important}.footer-build{font-size:0!important}.footer-build::after{content:'V0.6 · CONTINUE GAME & WORLD CLOCK'!important;font-size:10px!important}
.v054-date-chip{display:inline-flex;gap:7px;align-items:center;margin-top:5px;padding:3px 6px;border:1px solid rgba(239,185,63,.18);border-radius:6px;background:#0b0906;max-width:100%}.v054-date-chip small{color:#81786c;font-size:6px;letter-spacing:.08em;white-space:nowrap}.v054-date-chip strong{color:#ffd66a;font-size:8px;white-space:nowrap}.career-club{align-self:center}
.v054-lock-nav{opacity:.58}.v054-lock-nav small{display:block;margin-top:2px;color:#d8ad47;font-size:7px}.v054-locked{display:grid;place-items:center;min-height:420px;padding:30px;text-align:center;border:1px solid rgba(239,185,63,.18);border-radius:12px;background:radial-gradient(circle at 50% 20%,rgba(239,185,63,.08),transparent 35%),#080704}.v054-locked .stamp{display:inline-block;padding:6px 9px;border:1px solid #5b451e;color:#ffd66a;font-size:8px;font-weight:950;letter-spacing:.12em}.v054-locked h2{margin:12px 0 6px;font-size:30px}.v054-locked p{max-width:580px;margin:0 auto 16px;color:#91897e;line-height:1.6}.v054-locked .date{margin-bottom:7px;color:#efb93f;font-size:13px;font-weight:950}.v054-locked button{min-height:40px;padding:0 16px;border:1px solid #efb93f;border-radius:8px;background:#efb93f;color:#171005;font-size:8px;font-weight:950;cursor:pointer}
.v060-continue{min-height:38px!important;padding:0 14px!important;border-color:#f2c14e!important;color:#171005!important;background:linear-gradient(180deg,#ffd86b,#e8ab2f)!important;box-shadow:0 8px 20px rgba(239,185,63,.13);font-weight:950!important}.v060-continue.is-running{opacity:.62;cursor:wait}.v060-continue small{display:none}
.v060-world-panel{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:center;margin:0 0 14px;padding:14px 16px;border:1px solid rgba(239,185,63,.26);border-radius:12px;background:linear-gradient(135deg,rgba(30,23,10,.94),rgba(8,8,5,.96));box-shadow:inset 0 1px rgba(255,255,255,.025)}.v060-world-panel small{display:block;color:#897f70;font-size:7px;font-weight:900;letter-spacing:.12em}.v060-world-panel strong{display:block;margin-top:4px;color:#f2eadc;font-size:12px}.v060-world-panel span{display:block;margin-top:4px;color:#948c80;font-size:9px;line-height:1.45}.v060-world-panel .v060-date{color:#ffd66a}.v060-world-panel .v060-actions{display:grid;gap:5px;justify-items:end}.v060-world-panel .v060-actions em{color:#776f63;font-size:7px;font-style:normal;letter-spacing:.08em}
.v054-browser{position:sticky;top:0;z-index:20;display:grid;grid-template-columns:auto minmax(0,1fr) minmax(180px,330px) auto;gap:7px;align-items:center;margin:-4px 0 12px;padding:8px;border:1px solid rgba(239,185,63,.2);border-radius:9px;background:rgba(9,8,5,.97);backdrop-filter:blur(10px)}.v054-browser button{min-width:40px;min-height:36px;border:1px solid #4a3920;border-radius:7px;background:#151108;color:#ffd66a;font-size:16px;font-weight:900;cursor:pointer}.v054-browser button:disabled{opacity:.3;cursor:not-allowed}.v054-browser-meta small{display:block;color:#81786c;font-size:7px;letter-spacing:.1em}.v054-browser-meta strong{display:block;margin-top:2px;color:#f1eadf;font-size:9px}.v054-browser select{min-height:36px;border:1px solid rgba(239,185,63,.2);border-radius:7px;background:#0c0a07;color:#eee7da;padding:0 8px;font-size:9px}.modal-card.modal-wide{max-height:92vh;overflow:auto}.flm-profile-tabs{position:sticky;top:54px;z-index:15;background:#0b0906;padding-top:4px}
.v054-calendar{display:none!important}
@media(max-width:980px){.career-header{grid-template-columns:minmax(145px,205px) minmax(130px,1fr) auto!important;gap:8px!important;padding-inline:14px!important}.career-header-actions>span{display:none}.v054-date-chip small{display:none}.career-header-actions{gap:5px!important}.career-header-actions button{padding-inline:9px!important}}
@media(max-width:760px){.v054-date-chip{display:none}.v060-world-panel{grid-template-columns:1fr}.v060-world-panel .v060-actions{justify-items:stretch}.v060-world-panel .v060-actions button{width:100%}.career-header-actions [data-save-career]{display:none}.v060-continue{min-width:88px}.v054-browser{grid-template-columns:auto 1fr auto}.v054-browser select{grid-column:1/-1;grid-row:2}.modal-card.modal-wide{width:100vw!important;max-width:none!important;height:100dvh!important;max-height:100dvh!important;border-radius:0!important}.flm-profile-tabs{top:97px}}
@media(max-width:480px){.career-header-actions [data-exit-career]{padding-inline:7px!important}.v060-continue{padding-inline:9px!important;font-size:0!important}.v060-continue::after{content:'CONTINUE';font-size:8px}.career-header{padding-inline:9px!important}}
`;
  document.head.appendChild(style);
}

function stageLabel(c) {
  if (c.status === 'complete') return 'SEASON COMPLETE';
  if (c.preseason?.phase !== 'complete') {
    if (compareDates(c.currentDate, TRANSFER_OPEN_DATE) < 0) return 'PRE-SEASON · WINDOW CLOSED';
    if (!c.calendar?.fixturesReleased) return 'PRE-SEASON · FIXTURES PENDING';
    if (c.preseason?.phase === 'ready') return 'PRE-SEASON · COMPLETE';
    return 'PRE-SEASON';
  }
  return 'COMPETITIVE SEASON';
}

function syncHeader(c) {
  const header = document.querySelector('.career-header');
  if (!header) return;
  const club = header.querySelector('.career-club');
  if (club) {
    let chip = club.querySelector('.v054-date-chip');
    if (!chip) { chip = document.createElement('div'); chip.className = 'v054-date-chip'; club.appendChild(chip); }
    const html = `<small>${esc(stageLabel(c))}</small><strong>${esc(formatCareerDate(c.currentDate))}</strong>`;
    if (chip.innerHTML !== html) chip.innerHTML = html;
  }
  const actions = header.querySelector('.career-header-actions');
  if (!actions) return;
  let button = actions.querySelector('[data-v060-continue]');
  if (!button) {
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'v060-continue';
    button.dataset.v060Continue = '1';
    const save = actions.querySelector('[data-save-career]');
    actions.insertBefore(button, save || actions.firstChild);
  }
  const attention = getCurrentAttention(c);
  button.disabled = running || Boolean(document.querySelector('[data-live-match]'));
  button.classList.toggle('is-running', running);
  button.textContent = running ? 'PROCESSING…' : attention?.blocking ? 'ACTION REQUIRED' : 'CONTINUE GAME';
  button.title = attention?.title || 'Advance the career day by day until the next event that needs your attention.';
}

function nextEventCopy(c) {
  const event = getNextScheduledEvent(c);
  if (!event) return { title: 'No scheduled event', date: c.currentDate, detail: 'The career has no further scheduled event.' };
  let detail = 'Continue advances one day at a time and stops automatically when action is required.';
  if (event.type === 'transfer-offer') detail = 'An incoming bid is waiting. You can review it now or continue and risk the club withdrawing it later.';
  if (event.type === 'friendly') detail = event.blocking ? 'Play or quick-sim this friendly before the calendar can move on.' : 'The next pre-season friendly is scheduled for this date.';
  if (event.type === 'matchday') detail = event.blocking ? 'Complete Matchday before continuing.' : 'The calendar will stop here for your Premier League fixture.';
  if (event.type === 'preseason-ready') detail = 'Confirm the competitive season before continuing toward opening day.';
  return { title: event.title, date: event.date || c.currentDate, detail };
}

function syncOverview(c) {
  const content = document.querySelector('.career-content');
  const overview = document.querySelector('.career-nav [data-career-tab="overview"]');
  if (!content || !overview?.classList.contains('is-active')) return;
  if (content.dataset.v046News === '1' || content.dataset.v047Preseason === '1' || content.dataset.v050Transfers === '1') return;
  const heading = content.querySelector('.career-page-heading');
  if (!heading) return;
  let panel = content.querySelector('.v060-world-panel');
  if (!panel) { panel = document.createElement('section'); panel.className = 'v060-world-panel'; heading.after(panel); }
  const next = nextEventCopy(c);
  panel.innerHTML = `<div><small>WORLD CALENDAR · <b class="v060-date">${esc(formatCareerDate(c.currentDate))}</b></small><strong>${esc(next.title)}</strong><span>${esc(next.detail)}</span></div><div class="v060-actions"><button type="button" class="v060-continue" data-v060-continue data-v054-advance>${running ? 'PROCESSING…' : 'CONTINUE GAME'}</button><em>NEXT SCHEDULED · ${esc(formatCareerDate(next.date))}</em></div>`;
  const button = panel.querySelector('[data-v060-continue]');
  button.disabled = running || Boolean(document.querySelector('[data-live-match]'));
  button.classList.toggle('is-running', running);
}

function renderFixtureLock(c) {
  const root = document.querySelector('.career-content');
  if (!root) return;
  root.innerHTML = `<section class="v054-locked"><div><span class="stamp">FIXTURE RELEASE DAY</span><h2>Fixtures not released yet</h2><div class="date">FRIDAY 19 JUNE 2026 · 10:00 BST</div><p>The Premier League schedule remains under embargo. Continue Game advances the calendar day by day and will stop automatically on Fixture Release Day.</p><button type="button" data-v060-continue data-v054-advance>CONTINUE GAME</button></div></section>`;
}

function syncNavigation(c) {
  const fixtures = document.querySelector('[data-v051-fixtures]');
  if (fixtures) {
    const locked = !c.calendar?.fixturesReleased;
    fixtures.classList.toggle('v054-lock-nav', locked);
    fixtures.title = locked ? 'Fixtures will be released on 19 June 2026 at 10:00 BST.' : '';
    const html = locked ? 'Fixtures<small>19 JUN</small>' : 'Fixtures';
    if (fixtures.innerHTML !== html) fixtures.innerHTML = html;
  }
}

async function loadBrowserDb() {
  browserDb ||= await manager()?.loadDatabase?.();
  return browserDb;
}

async function browserIds(active) {
  const db = await loadBrowserDb();
  const player = db?.players?.find(item => item.id === active);
  if (!player) return [];
  const order = { GK: 0, DEF: 1, MID: 2, ATT: 3 };
  return db.players
    .filter(item => item.clubId === player.clubId && !item.isPlaceholder)
    .sort((a, b) => (order[a.positionGroup] ?? 9) - (order[b.positionGroup] ?? 9) || a.name.localeCompare(b.name))
    .map(item => item.id);
}

async function openBrowserPlayer(id) {
  if (!id || !window.FLMPlayerProfile?.open) return;
  await window.FLMPlayerProfile.open(id);
  queueMicrotask(decorateBrowser);
}

async function decorateBrowser() {
  const profile = document.querySelector('#appModal.is-open .flm-profile');
  const active = window.FLMPlayerProfile?.activePlayerId;
  if (!profile || !active) return;
  const existing = profile.querySelector('.v054-browser');
  if (existing?.dataset.v054Active === active) return;
  existing?.remove();
  const db = await loadBrowserDb();
  const ids = await browserIds(active);
  if (!db || !ids.length) return;
  const index = Math.max(0, ids.indexOf(active));
  const nav = document.createElement('div');
  nav.className = 'v054-browser';
  nav.dataset.v054Active = active;
  nav.innerHTML = `<button type="button" data-v054-prev ${index <= 0 ? 'disabled' : ''} aria-label="Previous player">‹</button><div class="v054-browser-meta"><small>QUICK PLAYER BROWSER</small><strong>${index + 1} OF ${ids.length}</strong></div><select data-v054-jump aria-label="Jump to player">${ids.map(id => { const p = db.players.find(item => item.id === id); return `<option value="${esc(id)}" ${id === active ? 'selected' : ''}>${esc(p?.name || 'Player')} · ${esc(p?.primaryPosition || '—')}</option>`; }).join('')}</select><button type="button" data-v054-next ${index >= ids.length - 1 ? 'disabled' : ''} aria-label="Next player">›</button>`;
  profile.prepend(nav);
  nav.querySelector('[data-v054-prev]')?.addEventListener('click', () => openBrowserPlayer(ids[index - 1]));
  nav.querySelector('[data-v054-next]')?.addEventListener('click', () => openBrowserPlayer(ids[index + 1]));
  nav.querySelector('[data-v054-jump]')?.addEventListener('change', event => openBrowserPlayer(event.currentTarget.value));
}

function routeForReason(reason) {
  if (!reason) return;
  const route = () => {
    if (reason.type === 'friendly' || reason.type === 'preseason-ready') {
      document.querySelector('[data-v047-preseason-tab]')?.click();
      return;
    }
    if (reason.type === 'matchday') {
      document.querySelector('.career-nav [data-career-tab="matchday"]')?.click();
      return;
    }
    if (reason.type === 'transfer-offer') {
      const transfer = document.querySelector('[data-v050-transfer-tab]');
      transfer?.click();
      setTimeout(() => document.querySelector('[data-v050-tab="Offers"]')?.click(), 30);
      return;
    }
    if (reason.type === 'season-complete') document.querySelector('.career-nav [data-career-tab="table"]')?.click();
  };
  setTimeout(route, 50);
}

async function performContinue() {
  if (running) return;
  const c = career();
  if (!c || !manager()?.loadDatabase) return;
  running = true;
  queueSync();
  try {
    const db = await manager().loadDatabase();
    ensureWorldClock(c);
    const result = continueCareer(c, db);
    syncWorldCalendarNews(c);
    persist(c);
    const reason = result.reason;
    const message = result.daysAdvanced
      ? `${formatCareerDate(result.toDate)} · ${reason?.title || 'Calendar advanced'}`
      : reason?.title || 'Action required before continuing.';
    toast(message, reason?.type === 'horizon');
    document.querySelector('.career-nav [data-career-tab="overview"]')?.click();
    routeForReason(reason);
  } catch (error) {
    toast(error.message, true);
  } finally {
    running = false;
    queueSync();
  }
}

function sync() {
  loadStyles();
  const c = career();
  if (!c) return;
  const changed = ensureWorldClock(c);
  if (changed) persist(c);
  syncHeader(c);
  syncOverview(c);
  syncNavigation(c);
  decorateBrowser();
}

function queueSync() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => { queued = false; sync(); });
}

document.addEventListener('click', event => {
  const c = career();
  if (!c) return;

  const continueControl = event.target.closest('[data-v060-continue],[data-v054-advance]');
  if (continueControl) {
    event.preventDefault();
    event.stopImmediatePropagation();
    performContinue();
    return;
  }

  const fixtures = event.target.closest('[data-v051-fixtures]');
  if (fixtures && !c.calendar?.fixturesReleased) {
    event.preventDefault();
    event.stopImmediatePropagation();
    renderFixtureLock(c);
    return;
  }

  const friendly = event.target.closest('[data-v047-play],[data-v047-sim]');
  if (friendly) {
    const due = getNextPreseasonDate(c);
    if (due && compareDates(c.currentDate, due) < 0) {
      event.preventDefault();
      event.stopImmediatePropagation();
      toast(`That friendly is scheduled for ${formatCareerDate(due)}. Use Continue Game to advance the calendar.`, true);
      return;
    }
  }

  const startSeason = event.target.closest('[data-v047-start]');
  if (startSeason) {
    event.preventDefault();
    event.stopImmediatePropagation();
    try {
      beginCompetitiveSeason(c);
      syncWorldCalendarNews(c);
      persist(c);
      toast('Pre-season complete. Continue Game will now take you toward opening day.');
      document.querySelector('.career-nav [data-career-tab="overview"]')?.click();
    } catch (error) {
      toast(error.message, true);
    }
    return;
  }

  const playMatch = event.target.closest('[data-play-match]');
  if (playMatch) {
    const fixture = getUserLeagueFixture(c);
    if (fixture?.date && compareDates(c.currentDate, fixture.date) < 0) {
      event.preventDefault();
      event.stopImmediatePropagation();
      toast(`Matchweek ${fixture.matchweek || fixture.round} is on ${formatCareerDate(fixture.date)}. Use Continue Game first.`, true);
    }
  }
}, true);

document.addEventListener('keydown', async event => {
  if (!document.querySelector('#appModal.is-open .flm-profile') || event.target.matches('input,select,textarea')) return;
  const active = window.FLMPlayerProfile?.activePlayerId;
  const ids = await browserIds(active);
  const index = ids.indexOf(active);
  if (event.key === 'ArrowRight' && index >= 0 && index < ids.length - 1) { event.preventDefault(); openBrowserPlayer(ids[index + 1]); }
  if (event.key === 'ArrowLeft' && index > 0) { event.preventDefault(); openBrowserPlayer(ids[index - 1]); }
});

new MutationObserver(queueSync).observe(document.body, { childList: true, subtree: true });
loadStyles();
sync();
