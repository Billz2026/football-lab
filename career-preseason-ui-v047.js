import { validateLineup } from './manager-core.js?v=0.3.0';
import {
  PRESEASON_TRAINING_FOCI,
  beginCompetitiveSeason,
  buildPreseasonFriendlyCareer,
  completePreseasonFriendly,
  ensurePreseason,
  getNextPreseasonFixture,
  getPreseasonReadiness,
  setPreseasonTrainingFocus
} from './preseason-v047.js?v=0.4.7';
import { syncCareerNews } from './career-news-v047.js?v=0.4.7';
import {
  advanceInteractiveMatch,
  completeInteractiveRound,
  createInteractiveMatch
} from './matchday-engine-v0431.js?v=0.4.3.1';

const SAVE_KEY = 'flm-career-save';
const STYLE_ID = 'flm-preseason-v047-style';
let open = false;
let queued = false;
let rendering = false;
let db = null;

const esc = value => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;').replaceAll("'", '&#039;');
const manager = () => window.FLMManager;
const career = () => manager()?.activeCareer || null;

function persist(c) {
  if (!c) return;
  c.updatedAt = new Date().toISOString();
  localStorage.setItem(SAVE_KEY, JSON.stringify(c));
  const status = document.querySelector('[data-career-save-status]');
  if (status) status.textContent = 'SAVED';
}

function styles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
  .version-chip{font-size:0!important}.version-chip::after{content:'V0.4.7';font-size:11px}.footer-build{font-size:0!important}.footer-build::after{content:'V0.4.7 · PRE-SEASON';font-size:10px}
  .v047-nav{position:relative}.v047-nav small{display:block;margin-top:2px;color:#e7cf62;font-size:7px}.v047-nav.is-complete small{color:#76c98a}.v047-lock{opacity:.42!important;cursor:not-allowed!important}
  .v047-banner{margin:0 0 12px;padding:9px 12px;border:1px solid #5d4786;background:#25133f;color:#ddd3e8;font-size:10px}.v047-banner b{color:#f2df55}.v047-head{display:flex;justify-content:space-between;gap:15px;align-items:end;margin-bottom:14px}.v047-head h2{margin:3px 0 0}.v047-head span{color:#e6d35b;font-size:9px;font-weight:900;letter-spacing:.08em}
  .v047-readiness{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin-bottom:12px}.v047-card{padding:13px;border:1px solid #ffffff16;background:#15101f}.v047-card small{display:block;color:#91899d;font-size:8px;font-weight:900}.v047-card strong{display:block;margin-top:4px;color:#fff;font-size:1.45rem}.v047-card span{display:block;margin-top:3px;color:#8e8796;font-size:8px}.v047-card.is-good strong{color:#77ce91}.v047-card.is-mid strong{color:#e5c95c}
  .v047-grid{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(300px,.85fr);gap:12px}.v047-panel{border:1px solid #4d3b6b;background:#08070d}.v047-panel-head{display:flex;justify-content:space-between;gap:10px;align-items:center;padding:11px 12px;border-bottom:1px solid #ffffff12;background:#211430}.v047-panel-head strong{color:#eadc58;font-size:11px}.v047-panel-head span{color:#8f8798;font-size:8px}
  .v047-schedule{display:grid}.v047-fixture{display:grid;grid-template-columns:66px 1fr auto;gap:10px;align-items:center;padding:11px 12px;border-bottom:1px solid #ffffff10}.v047-fixture:last-child{border-bottom:0}.v047-fixture .date{padding:5px;background:#123a8e;color:#d8e3ff;text-align:center;font-size:8px;font-weight:900}.v047-fixture strong{display:block;font-size:10px}.v047-fixture small{display:block;margin-top:3px;color:#888191;font-size:8px}.v047-result{min-width:56px;padding:5px 7px;background:#18131f;color:#eee;text-align:center;font-size:9px;font-weight:950}.v047-fixture.is-played .v047-result{background:#24563a;color:#c9f5d5}.v047-fixture.is-next{background:#2f1e491f;box-shadow:inset 3px 0 #eadb57}
  .v047-side{display:grid;gap:12px}.v047-training{padding:13px}.v047-training label{display:grid;gap:6px}.v047-training label span{font-size:8px;color:#a69db0;font-weight:900}.v047-training select{min-height:42px;border:1px solid #5b4380;background:#17111f;color:#fff;padding:0 9px}.v047-training p{margin:9px 0 0;color:#928b98;font-size:9px;line-height:1.55}
  .v047-next{padding:15px}.v047-next .teams{display:grid;grid-template-columns:1fr auto 1fr;gap:10px;align-items:center;margin:12px 0}.v047-next .teams strong:last-child{text-align:right}.v047-next .teams span{color:#e6d65c;font-size:10px}.v047-actions{display:grid;grid-template-columns:1fr 1fr;gap:7px}.v047-actions button,.v047-start{min-height:42px;border:1px solid #5d4786;background:#24143b;color:#eee;font-size:8px;font-weight:950;cursor:pointer}.v047-actions button.primary,.v047-start{border-color:#e3cb50;background:#e3cb50;color:#17110a}.v047-actions button:disabled{opacity:.4;cursor:not-allowed}
  .v047-ready{padding:18px;text-align:center}.v047-ready h3{margin:4px 0 8px;color:#f0df5c;font-size:1.5rem}.v047-ready p{margin:0 auto 14px;max-width:600px;color:#aaa2ae;line-height:1.6}.v047-start{padding:0 20px}.v047-complete{border-color:#2f6b46;background:#102519}.v047-complete h3{color:#83da9c}
  @media(max-width:900px){.v047-readiness{grid-template-columns:1fr 1fr}.v047-grid{grid-template-columns:1fr}}@media(max-width:560px){.v047-readiness{grid-template-columns:1fr 1fr}.v047-fixture{grid-template-columns:58px 1fr}.v047-result{grid-column:2}.v047-actions{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);
}

function clubName(database, id) {
  const club = database.clubs.find(item => item.id === id);
  return club?.shortName || club?.name || 'Unknown club';
}

async function sync() {
  const c = career();
  if (!c || !manager()?.loadDatabase) return null;
  db ||= await manager().loadDatabase();
  let changed = ensurePreseason(c, db);
  changed = syncCareerNews(c, db) || changed;
  if (changed) persist(c);
  return { c, db };
}

function readinessClass(value) {
  return value >= 82 ? 'is-good' : value >= 68 ? 'is-mid' : '';
}

async function ensureNav() {
  const nav = document.querySelector('.career-nav');
  const synced = await sync();
  if (!nav || !synced) return;
  const { c } = synced;
  let button = nav.querySelector('[data-v047-preseason-tab]');
  if (!button) {
    button = document.createElement('button');
    button.type = 'button';
    button.className = 'career-nav-button v047-nav';
    button.dataset.v047PreseasonTab = '1';
    const tactics = nav.querySelector('[data-career-tab="tactics"]');
    tactics?.after(button);
    button.addEventListener('click', () => {
      if (button.disabled) return;
      open = true;
      render(true);
    });
  }
  const played = c.preseason?.fixtures?.filter(fixture => fixture.played).length || 0;
  const total = c.preseason?.fixtures?.length || 0;
  const complete = c.preseason?.phase === 'complete';
  const label = complete ? 'Pre-Season' : 'Pre-Season';
  const sub = complete ? 'COMPLETE' : `${played}/${total} FRIENDLIES`;
  const html = `${label}<small>${sub}</small>`;
  if (button.innerHTML !== html) button.innerHTML = html;
  button.classList.toggle('is-active', open);
  button.classList.toggle('is-complete', complete);
  button.disabled = Boolean(document.querySelector('[data-live-match]'));

  const matchday = nav.querySelector('[data-career-tab="matchday"]');
  if (matchday) {
    const locked = !complete;
    matchday.disabled = locked;
    matchday.classList.toggle('v047-lock', locked);
    matchday.title = locked ? 'Complete pre-season before the competitive Matchday opens.' : '';
  }
}

function addOverviewBanner(c) {
  if (open || c.preseason?.phase === 'complete') return;
  const content = document.querySelector('.career-content');
  if (!content || content.querySelector('[data-v047-banner]') || content.dataset.v046News === '1') return;
  const heading = content.querySelector('.career-page-heading');
  if (!heading) return;
  const played = c.preseason.fixtures.filter(fixture => fixture.played).length;
  const banner = document.createElement('div');
  banner.className = 'v047-banner';
  banner.dataset.v047Banner = '1';
  banner.innerHTML = `<b>PRE-SEASON IN PROGRESS</b> · ${played}/${c.preseason.fixtures.length} friendlies complete · Competitive Matchday remains locked until preparation is finished.`;
  heading.after(banner);
  const round = heading.querySelector('.career-round');
  if (round && !round.textContent.includes('PRE-SEASON')) round.textContent = `PRE-SEASON · ${played}/${c.preseason.fixtures.length}`;
}

function resultText(fixture, database) {
  if (!fixture.played) return '—';
  return `${fixture.homeGoals}–${fixture.awayGoals}`;
}

async function quickSim(c, database, fixture) {
  const pseudo = buildPreseasonFriendlyCareer(c, fixture);
  let state = createInteractiveMatch(pseudo, database);
  while (state.minute < 90) state = advanceInteractiveMatch(state, pseudo, database).state;
  return completeInteractiveRound(pseudo, state, database);
}

async function finishFriendly(c, database, completed) {
  completePreseasonFriendly(c, completed, database);
  syncCareerNews(c, database);
  persist(c);
  await render(true);
}

async function playFriendly(c, database, fixture) {
  const validation = validateLineup(c.lineupIds, database.players, c.clubId);
  if (!validation.valid) throw new Error(validation.errors.join(' '));
  const root = document.querySelector('.career-content');
  const navButton = document.querySelector('[data-v047-preseason-tab]');
  if (navButton) navButton.disabled = true;
  const pseudo = buildPreseasonFriendlyCareer(c, fixture);
  const completed = {};
  const { playLiveMatch } = await import('./matchday-live-v04.js?v=0.4.0');
  await playLiveMatch({ root, career: pseudo, completedCareer: completed, db: database, reducedMotion: false });
  await finishFriendly(c, database, completed);
}

async function render(force = false) {
  if (!open || rendering) return;
  const root = document.querySelector('.career-content');
  const synced = await sync();
  if (!root || !synced) return;
  if (!force && root.dataset.v047Preseason === '1') return;
  rendering = true;
  const { c, db: database } = synced;
  const p = c.preseason;
  const ready = getPreseasonReadiness(c, database);
  const next = getNextPreseasonFixture(c);
  const focus = PRESEASON_TRAINING_FOCI[p.trainingFocus] || PRESEASON_TRAINING_FOCI.Balanced;
  document.querySelectorAll('.career-nav-button').forEach(button => button.classList.remove('is-active'));
  document.querySelector('[data-v047-preseason-tab]')?.classList.add('is-active');
  root.dataset.v047Preseason = '1';

  const schedule = p.fixtures.length ? p.fixtures.map(fixture => {
    const isNext = next?.id === fixture.id;
    return `<div class="v047-fixture ${fixture.played ? 'is-played' : ''} ${isNext ? 'is-next' : ''}"><span class="date">${esc(fixture.dateLabel)}</span><div><strong>${esc(clubName(database, fixture.homeClubId))} vs ${esc(clubName(database, fixture.awayClubId))}</strong><small>${fixture.played ? 'Friendly completed' : isNext ? 'Next friendly' : 'Scheduled friendly'}</small></div><span class="v047-result">${resultText(fixture, database)}</span></div>`;
  }).join('') : '<div class="v047-fixture"><div><strong>No pre-season fixtures required for this existing save.</strong></div></div>';

  root.innerHTML = `
    <div class="v047-head"><div><p class="eyebrow">SEASON PREPARATION</p><h2>Pre-Season</h2></div><span>${p.phase === 'complete' ? 'COMPLETE' : p.phase === 'ready' ? 'READY FOR ROUND 1' : `FRIENDLY ${ready.friendliesPlayed + 1} OF ${ready.totalFriendlies}`}</span></div>
    <div class="v047-readiness">
      <div class="v047-card ${readinessClass(ready.condition)}"><small>AVG CONDITION</small><strong>${ready.condition}%</strong><span>Physical readiness</span></div>
      <div class="v047-card ${readinessClass(ready.sharpness)}"><small>MATCH SHARPNESS</small><strong>${ready.sharpness}%</strong><span>Competitive rhythm</span></div>
      <div class="v047-card ${readinessClass(ready.familiarity)}"><small>TACTICAL FAMILIARITY</small><strong>${ready.familiarity}%</strong><span>Feeds match readiness</span></div>
      <div class="v047-card"><small>FRIENDLIES</small><strong>${ready.friendliesPlayed}/${ready.totalFriendlies}</strong><span>Results do not affect table</span></div>
    </div>
    <div class="v047-grid">
      <section class="v047-panel"><div class="v047-panel-head"><strong>PRE-SEASON SCHEDULE</strong><span>5-WEEK PROGRAMME</span></div><div class="v047-schedule">${schedule}</div></section>
      <div class="v047-side">
        <section class="v047-panel"><div class="v047-panel-head"><strong>TRAINING FOCUS</strong><span>APPLIED AFTER EACH FRIENDLY</span></div><div class="v047-training"><label><span>FOCUS</span><select data-v047-focus ${p.phase === 'complete' ? 'disabled' : ''}>${Object.keys(PRESEASON_TRAINING_FOCI).map(name => `<option ${name === p.trainingFocus ? 'selected' : ''}>${esc(name)}</option>`).join('')}</select></label><p data-v047-focus-copy>${esc(focus.description)}</p></div></section>
        ${next ? `<section class="v047-panel"><div class="v047-panel-head"><strong>NEXT FRIENDLY</strong><span>${esc(next.dateLabel)}</span></div><div class="v047-next"><div class="teams"><strong>${esc(clubName(database, next.homeClubId))}</strong><span>VS</span><strong>${esc(clubName(database, next.awayClubId))}</strong></div><div class="v047-actions"><button class="primary" data-v047-play>PLAY FRIENDLY</button><button data-v047-sim>QUICK SIM</button></div></div></section>` : ''}
        ${p.phase === 'ready' ? `<section class="v047-panel v047-ready"><p class="eyebrow">PREPARATION COMPLETE</p><h3>Ready for Round 1</h3><p>Your friendlies are finished. Condition, sharpness and tactical familiarity now carry into the competitive match engine.</p><button class="v047-start" data-v047-start>BEGIN COMPETITIVE SEASON</button></section>` : ''}
        ${p.phase === 'complete' ? `<section class="v047-panel v047-ready v047-complete"><p class="eyebrow">SEASON UNDERWAY</p><h3>Pre-season complete</h3><p>Your preparation is locked into the career record. Competitive Matchday is now available.</p></section>` : ''}
      </div>
    </div>`;

  root.querySelector('[data-v047-focus]')?.addEventListener('change', event => {
    setPreseasonTrainingFocus(c, event.currentTarget.value);
    persist(c);
    const copy = root.querySelector('[data-v047-focus-copy]');
    if (copy) copy.textContent = PRESEASON_TRAINING_FOCI[event.currentTarget.value].description;
  });
  root.querySelector('[data-v047-sim]')?.addEventListener('click', async event => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      const completed = await quickSim(c, database, next);
      await finishFriendly(c, database, completed);
    } catch (error) {
      button.disabled = false;
      alert(error.message);
    }
  });
  root.querySelector('[data-v047-play]')?.addEventListener('click', async event => {
    const button = event.currentTarget;
    button.disabled = true;
    try {
      await playFriendly(c, database, next);
    } catch (error) {
      button.disabled = false;
      alert(error.message);
    }
  });
  root.querySelector('[data-v047-start]')?.addEventListener('click', () => {
    beginCompetitiveSeason(c);
    syncCareerNews(c, database);
    persist(c);
    open = false;
    document.querySelector('[data-career-tab="overview"]')?.click();
  });
  rendering = false;
}

async function scan() {
  queued = false;
  if (!window.FLMManager) return;
  styles();
  const synced = await sync();
  if (!synced) return;
  await ensureNav();
  addOverviewBanner(synced.c);
  if (open) await render();
}

function queue() {
  if (queued) return;
  queued = true;
  queueMicrotask(() => scan().catch(() => { queued = false; }));
}

document.addEventListener('click', event => {
  if (event.target.closest('[data-career-tab]')) open = false;
}, true);

styles();
new MutationObserver(queue).observe(document.documentElement, { childList: true, subtree: true });
queue();
