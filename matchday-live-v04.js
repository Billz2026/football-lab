import {
  MAX_SUBSTITUTIONS,
  PLAYER_DUTIES,
  TACTIC_OPTIONS,
  advanceInteractiveMatch,
  changeTactics,
  completeInteractiveRound,
  createInteractiveMatch,
  getOpponentSnapshot,
  makeSubstitution,
  setPlayerDuty
} from './matchday-engine-v042.js?v=0.4.2';

const STYLE_ID = 'flm-live-match-v042-style';
const BASE_STEP_MS = 700;

function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .flm-live-match{position:relative;display:grid;gap:18px;min-height:700px}
    .flm-live-scoreboard{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:18px;padding:18px 22px;border:1px solid rgba(255,255,255,.12);background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.015));border-radius:18px}
    .flm-live-team{display:grid;gap:4px}.flm-live-team:last-child{text-align:right}.flm-live-team small{opacity:.62;font-size:.72rem;letter-spacing:.14em}.flm-live-team strong{font-size:1.2rem}
    .flm-live-score{display:grid;grid-template-columns:auto auto auto;gap:12px;align-items:center;text-align:center}.flm-live-score b{font-size:2.2rem;line-height:1}.flm-live-score span{opacity:.45}.flm-live-clock{grid-column:1/-1;font-variant-numeric:tabular-nums;font-weight:900;letter-spacing:.12em;font-size:.84rem;color:#e6bf52}
    .flm-live-grid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(300px,.85fr);gap:18px}
    .flm-commentary-panel,.flm-side-panel{border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.025);border-radius:18px;padding:18px}.flm-side-panel{display:grid;align-content:start;gap:18px}
    .flm-panel-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.flm-panel-head p{margin:0;font-size:.72rem;letter-spacing:.14em;opacity:.62}.flm-panel-head strong{font-size:.78rem}
    .flm-commentary-feed{height:450px;overflow:auto;display:flex;flex-direction:column;gap:7px;padding-right:4px;scroll-behavior:smooth}
    .flm-commentary-line{display:grid;grid-template-columns:46px 1fr;gap:10px;padding:9px 11px;border-radius:10px;background:rgba(255,255,255,.024);border:1px solid transparent;line-height:1.42}.flm-commentary-line b{font-variant-numeric:tabular-nums;color:#928a79}.flm-commentary-line.goal{border-color:rgba(230,191,82,.52);background:rgba(230,191,82,.12);font-weight:850}.flm-commentary-line.yellow{border-color:rgba(255,221,69,.3)}.flm-commentary-line.red{border-color:rgba(255,84,84,.52);background:rgba(255,84,84,.09);font-weight:850}.flm-commentary-line.injury{border-color:rgba(255,145,77,.42);background:rgba(255,145,77,.07)}.flm-commentary-line.substitution,.flm-commentary-line.tactical,.flm-commentary-line.instruction,.flm-commentary-line.instruction-change{border-color:rgba(100,183,255,.26);background:rgba(100,183,255,.06)}.flm-commentary-line.situation{border-color:rgba(180,160,255,.2);background:rgba(180,160,255,.045)}.flm-commentary-line.marker{opacity:.86;font-weight:900;letter-spacing:.04em}
    .flm-speed-controls{display:flex;gap:8px;flex-wrap:wrap}.flm-speed-controls button,.flm-manager-actions button{min-width:48px;border:1px solid rgba(255,255,255,.14);background:#141414;color:#fff;border-radius:10px;padding:9px 11px;font-weight:850;cursor:pointer}.flm-speed-controls button.is-active{border-color:#e6bf52;color:#e6bf52}.flm-speed-controls button:disabled,.flm-manager-actions button:disabled{opacity:.45;cursor:not-allowed}
    .flm-stat-list{display:grid;gap:10px}.flm-stat-row{display:grid;grid-template-columns:42px 1fr 42px;gap:8px;align-items:center;padding:4px 0}.flm-stat-row span{text-align:center;font-size:.72rem;opacity:.64}.flm-stat-row strong:last-child{text-align:right}
    .flm-manager-box{padding-top:15px;border-top:1px solid rgba(255,255,255,.08)}.flm-manager-box h3{margin:0 0 10px;font-size:.82rem;letter-spacing:.12em}.flm-tactic-summary{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:12px}.flm-tactic-summary span{padding:8px;border-radius:9px;background:rgba(255,255,255,.035);font-size:.68rem}.flm-tactic-summary b{display:block;margin-top:2px;color:#e6bf52;font-size:.78rem}.flm-manager-actions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.flm-manager-actions button{width:100%;border-color:rgba(230,191,82,.28)}
    .flm-goal-flash{position:absolute;inset:0;z-index:12;display:grid;place-items:center;pointer-events:none;background:rgba(230,191,82,.97);color:#080704;border-radius:22px;opacity:0;transform:scale(.985);transition:opacity .12s ease,transform .12s ease}.flm-goal-flash.is-visible{opacity:1;transform:scale(1)}.flm-goal-flash-inner{text-align:center;padding:30px}.flm-goal-flash .goal-word{display:block;font-size:clamp(3.6rem,11vw,7.4rem);line-height:.88;font-weight:1000;letter-spacing:-.05em}.flm-goal-flash strong{display:block;font-size:1.35rem;margin-top:16px}.flm-goal-flash small{display:block;margin-top:7px;font-weight:900;letter-spacing:.12em}
    .flm-match-modal{position:absolute;inset:0;z-index:10;display:none;align-items:center;justify-content:center;padding:18px;background:rgba(0,0,0,.82);backdrop-filter:blur(7px);border-radius:22px}.flm-match-modal.is-open{display:flex}.flm-match-dialog{width:min(940px,100%);max-height:90%;overflow:auto;border:1px solid rgba(230,191,82,.26);border-radius:18px;background:#0b0a08;padding:20px;box-shadow:0 26px 80px rgba(0,0,0,.45)}
    .flm-dialog-head{display:flex;justify-content:space-between;gap:15px;align-items:flex-start;margin-bottom:16px}.flm-dialog-head h3{margin:3px 0 0;font-size:1.5rem}.flm-dialog-head p{margin:0;font-size:.7rem;letter-spacing:.12em;color:#e6bf52}.flm-dialog-head button{border:1px solid rgba(255,255,255,.14);background:#141414;color:#fff;border-radius:9px;padding:8px 10px;cursor:pointer}
    .flm-preset-row{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px}.flm-preset-row button{border:1px solid rgba(230,191,82,.23);background:rgba(230,191,82,.05);color:#fff;border-radius:10px;padding:10px;font-weight:850;cursor:pointer}.flm-tactic-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.flm-tactic-field{display:grid;gap:6px}.flm-tactic-field span{font-size:.67rem;letter-spacing:.11em;opacity:.62}.flm-tactic-field select,.flm-sub-select select,.flm-duty-row select{width:100%;min-height:43px;border:1px solid rgba(255,255,255,.14);border-radius:10px;background:#141414;color:#fff;padding:0 10px}
    .flm-dialog-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}.flm-dialog-actions button{border:1px solid rgba(255,255,255,.14);background:#141414;color:#fff;border-radius:10px;padding:10px 15px;font-weight:850;cursor:pointer}.flm-dialog-actions button.primary{background:#e6bf52;color:#080704;border-color:#e6bf52}
    .flm-sub-status{display:flex;justify-content:space-between;gap:12px;padding:10px 12px;margin-bottom:12px;border-radius:10px;background:rgba(230,191,82,.06);font-size:.76rem}.flm-sub-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.flm-sub-select{display:grid;gap:6px}.flm-sub-select span{font-size:.68rem;letter-spacing:.1em;opacity:.62}
    .flm-player-live-list,.flm-duty-list{display:grid;gap:6px;margin-top:14px;max-height:360px;overflow:auto}.flm-player-live-row{display:grid;grid-template-columns:50px 1fr 74px 64px;gap:8px;align-items:center;padding:8px 9px;border:1px solid rgba(255,255,255,.06);border-radius:9px;background:rgba(255,255,255,.02)}.flm-player-live-row span:first-child{font-size:.67rem;color:#e6bf52;font-weight:900}.flm-player-live-row strong{font-size:.78rem}.flm-player-live-row small{text-align:right;font-size:.67rem;opacity:.68}.flm-player-live-row b{text-align:right;font-size:.78rem}.flm-player-live-row.is-injured{border-color:rgba(255,145,77,.32)}
    .flm-duty-row{display:grid;grid-template-columns:48px minmax(0,1fr) 145px;gap:10px;align-items:center;padding:8px 9px;border:1px solid rgba(255,255,255,.06);border-radius:9px}.flm-duty-row span{font-size:.68rem;color:#e6bf52;font-weight:900}.flm-duty-row strong{font-size:.78rem}
    .flm-half-time-card{display:none;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:center;padding:18px;border:1px solid rgba(230,191,82,.45);border-radius:16px;background:linear-gradient(135deg,rgba(230,191,82,.12),rgba(230,191,82,.035))}.flm-live-match.is-half-time .flm-half-time-card{display:grid}.flm-half-time-card h3{margin:0 0 5px;font-size:1.3rem}.flm-half-time-card p{margin:0;opacity:.72}.flm-half-time-actions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px}.flm-half-time-actions button{border:1px solid rgba(255,255,255,.14);background:#141414;color:#fff;border-radius:10px;padding:10px 12px;font-weight:850;cursor:pointer}.flm-half-time-actions button.primary{background:#e6bf52;color:#080704;border-color:#e6bf52}
    .flm-ft-card{display:none;border:1px solid rgba(230,191,82,.35);background:rgba(230,191,82,.075);border-radius:16px;padding:16px;align-items:center;justify-content:space-between;gap:16px}.flm-live-match.is-full-time .flm-ft-card{display:flex}.flm-ft-card h3{margin:0 0 4px}.flm-ft-card p{margin:0;opacity:.72}.flm-ft-card button{border:0;border-radius:12px;padding:12px 18px;background:#e6bf52;color:#080704;font-weight:900;cursor:pointer}
    .flm-opposition-card{display:grid;gap:12px}.flm-opposition-shape{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.flm-opposition-shape span{padding:10px;border-radius:10px;background:rgba(255,255,255,.035);font-size:.72rem}.flm-opposition-shape b{display:block;color:#e6bf52;margin-top:3px}.flm-live-lock-note{font-size:.72rem;opacity:.6}
    @media(max-width:860px){.flm-live-grid{grid-template-columns:1fr}.flm-commentary-feed{height:360px}.flm-live-scoreboard{grid-template-columns:1fr auto 1fr;padding:14px}.flm-live-team strong{font-size:.95rem}.flm-live-score b{font-size:1.7rem}.flm-tactic-form,.flm-sub-grid{grid-template-columns:1fr}.flm-preset-row{grid-template-columns:1fr}.flm-tactic-summary{grid-template-columns:1fr 1fr}.flm-half-time-card{grid-template-columns:1fr}.flm-half-time-actions{justify-content:flex-start}.flm-duty-row{grid-template-columns:45px 1fr}.flm-duty-row select{grid-column:1/-1}}
    @media(prefers-reduced-motion:reduce){.flm-goal-flash{transition:none}.flm-commentary-feed{scroll-behavior:auto}}
  `;
  document.head.appendChild(style);
}

function club(db, id) { return db.clubs.find(item => item.id === id); }
function player(db, id) { return db.players.find(item => item.id === id); }
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
function userSide(state) { return state.userClubId === state.homeClubId ? 'home' : 'away'; }
function currentUserLineup(state) { return userSide(state) === 'home' ? state.homeLineupIds : state.awayLineupIds; }
function rating(value) { return Number(value || 6.5).toFixed(1); }
function tacticLabel(key) { return key === 'defensiveLine' ? 'DEFENSIVE LINE' : key.toUpperCase(); }

function lockShell(locked) {
  document.querySelectorAll('[data-career-tab], [data-exit-career], [data-save-career]').forEach(button => {
    button.disabled = locked;
    button.setAttribute('aria-disabled', String(locked));
  });
}

function possession(state) {
  const total = state.stats.home.possessionTicks + state.stats.away.possessionTicks;
  const home = total ? Math.round(state.stats.home.possessionTicks / total * 100) : 50;
  return [home, 100 - home];
}

function preset(name) {
  if (name === 'protect') return { formation: '5-3-2', mentality: 'Defensive', pressing: 'Low', tempo: 'Slow', passing: 'Mixed', width: 'Narrow', defensiveLine: 'Low' };
  if (name === 'chase') return { formation: '3-4-3', mentality: 'Attacking', pressing: 'High', tempo: 'High', passing: 'Direct', width: 'Wide', defensiveLine: 'High' };
  return { formation: '4-2-3-1', mentality: 'Balanced', pressing: 'Standard', tempo: 'Standard', passing: 'Mixed', width: 'Balanced', defensiveLine: 'Standard' };
}

export async function playLiveMatch({ root, career, completedCareer, db, reducedMotion = false }) {
  ensureStyles();
  if (!root) throw new Error('Live match presentation could not initialise.');

  let state = createInteractiveMatch(career, db);
  const home = club(db, state.homeClubId);
  const away = club(db, state.awayClubId);
  let speed = 1;
  let paused = false;
  let finished = false;
  let halfTimeBreak = false;
  let managerWasPaused = false;

  lockShell(true);
  root.innerHTML = `
    <section class="flm-live-match" data-live-match aria-label="Live match centre">
      <div class="flm-goal-flash" data-goal-flash aria-hidden="true"><div class="flm-goal-flash-inner"><span class="goal-word">GOAL!</span><strong data-goal-scorer></strong><small data-goal-score></small></div></div>
      <div class="flm-match-modal" data-manager-modal aria-hidden="true"><div class="flm-match-dialog" data-manager-dialog></div></div>
      <div class="career-page-heading"><div><p class="eyebrow">ROUND ${esc(state.round)}</p><h2>Live Match Centre</h2></div><span class="career-round" data-match-status>LIVE</span></div>
      <div class="flm-live-scoreboard">
        <div class="flm-live-team"><small>HOME</small><strong>${esc(home?.name || 'Home')}</strong></div>
        <div class="flm-live-score"><b data-home-score>0</b><span>—</span><b data-away-score>0</b><div class="flm-live-clock" data-live-clock>00:00</div></div>
        <div class="flm-live-team"><small>AWAY</small><strong>${esc(away?.name || 'Away')}</strong></div>
      </div>
      <div class="flm-live-grid">
        <article class="flm-commentary-panel">
          <div class="flm-panel-head"><p>LIVE COMMENTARY</p><strong data-commentary-state>KICK-OFF</strong></div>
          <div class="flm-commentary-feed" data-commentary-feed aria-live="polite"></div>
        </article>
        <aside class="flm-side-panel">
          <div><div class="flm-panel-head"><p>MATCH STATS</p><strong>LIVE</strong></div><div class="flm-stat-list" data-live-stats></div></div>
          <div class="flm-manager-box">
            <h3>MANAGER CONTROL</h3>
            <div class="flm-tactic-summary" data-tactic-summary></div>
            <div class="flm-manager-actions">
              <button type="button" data-open-tactics>TACTICS</button>
              <button type="button" data-open-subs>SUBSTITUTIONS</button>
              <button type="button" data-open-instructions>PLAYER DUTIES</button>
              <button type="button" data-open-ratings>RATINGS</button>
              <button type="button" data-open-opposition>OPPOSITION</button>
            </div>
          </div>
        </aside>
      </div>
      <div class="career-match-actions">
        <div><strong>MATCH SPEED</strong><span class="flm-live-lock-note">1× is deliberately paced for commentary depth. The match stops automatically at half-time.</span></div>
        <div class="flm-speed-controls" aria-label="Match speed">
          <button type="button" data-match-speed="0">PAUSE</button>
          <button type="button" data-match-speed="1" class="is-active">1×</button>
          <button type="button" data-match-speed="2">2×</button>
          <button type="button" data-match-speed="4">4×</button>
        </div>
      </div>
      <div class="flm-half-time-card" data-half-time-card>
        <div><h3>HALF TIME · <span data-half-time-score></span></h3><p>The clock is stopped. Make any changes you need, then resume the second half.</p></div>
        <div class="flm-half-time-actions">
          <button type="button" data-ht-tactics>TACTICS</button>
          <button type="button" data-ht-subs>SUBSTITUTIONS</button>
          <button type="button" data-ht-instructions>PLAYER DUTIES</button>
          <button type="button" class="primary" data-resume-second-half>RESUME SECOND HALF</button>
        </div>
      </div>
      <div class="flm-ft-card"><div><h3>FULL TIME</h3><p data-full-time-score></p></div><button type="button" data-finish-live-match>CONTINUE</button></div>
    </section>`;

  const shell = root.querySelector('[data-live-match]');
  const feed = root.querySelector('[data-commentary-feed]');
  const clock = root.querySelector('[data-live-clock]');
  const homeScore = root.querySelector('[data-home-score]');
  const awayScore = root.querySelector('[data-away-score]');
  const stateLabel = root.querySelector('[data-commentary-state]');
  const matchStatus = root.querySelector('[data-match-status]');
  const flash = root.querySelector('[data-goal-flash]');
  const statsRoot = root.querySelector('[data-live-stats]');
  const tacticSummary = root.querySelector('[data-tactic-summary]');
  const modal = root.querySelector('[data-manager-modal]');
  const dialog = root.querySelector('[data-manager-dialog]');

  const refreshScore = () => { homeScore.textContent = state.homeGoals; awayScore.textContent = state.awayGoals; };

  const refreshStats = () => {
    const [homePoss, awayPoss] = possession(state);
    const rows = [
      ['Possession', `${homePoss}%`, `${awayPoss}%`], ['Shots', state.stats.home.shots, state.stats.away.shots],
      ['On target', state.stats.home.onTarget, state.stats.away.onTarget], ['Corners', state.stats.home.corners, state.stats.away.corners],
      ['Fouls', state.stats.home.fouls, state.stats.away.fouls], ['Yellows', state.stats.home.yellowCards, state.stats.away.yellowCards],
      ['Reds', state.stats.home.redCards || 0, state.stats.away.redCards || 0]
    ];
    statsRoot.innerHTML = rows.map(([label, h, a]) => `<div class="flm-stat-row"><strong>${esc(h)}</strong><span>${esc(label)}</span><strong>${esc(a)}</strong></div>`).join('');
  };

  const refreshTactics = () => {
    tacticSummary.innerHTML = [['Formation', state.tactics.formation], ['Mentality', state.tactics.mentality], ['Pressing', state.tactics.pressing], ['Tempo', state.tactics.tempo]]
      .map(([label, value]) => `<span>${esc(label)}<b>${esc(value)}</b></span>`).join('');
  };

  const updateSpeedButtons = () => {
    root.querySelectorAll('[data-match-speed]').forEach(btn => {
      btn.classList.toggle('is-active', Number(btn.dataset.matchSpeed) === (paused ? 0 : speed));
      btn.disabled = finished || halfTimeBreak;
    });
  };

  const statusText = () => halfTimeBreak ? 'HALF TIME' : paused ? 'PAUSED' : 'LIVE';

  const addSingleLine = async (minute, text, type) => {
    const line = document.createElement('div');
    line.className = `flm-commentary-line ${type || ''}`;
    line.innerHTML = `<b>${minute}'</b><span>${esc(text)}</span>`;
    feed.appendChild(line);
    feed.scrollTop = feed.scrollHeight;
    await sleep(Math.max(40, 170 / Math.max(1, speed)));
  };

  const addEvent = async event => {
    const labels = { goal: 'GOAL', yellow: 'BOOKING', red: 'RED CARD', injury: 'INJURY', substitution: 'SUBSTITUTION', tactical: 'TACTICAL CHANGE', instruction: 'PLAYER DUTY', 'instruction-change': 'PLAYER DUTY', situation: 'MATCH SITUATION', marker: event.text };
    stateLabel.textContent = labels[event.type] || 'LIVE';
    const lines = event.lines?.length ? event.lines : [event.text];
    for (const text of lines.filter(Boolean)) await addSingleLine(event.minute, text, event.type);
  };

  const goalFlash = async event => {
    const scorer = player(db, event.playerId)?.name || 'GOAL';
    flash.querySelector('[data-goal-scorer]').textContent = scorer;
    flash.querySelector('[data-goal-score]').textContent = `${state.homeGoals} — ${state.awayGoals}`;
    flash.classList.add('is-visible'); flash.setAttribute('aria-hidden', 'false');
    await sleep(reducedMotion ? 300 : Math.max(900, 1450 / Math.max(1, speed)));
    flash.classList.remove('is-visible'); flash.setAttribute('aria-hidden', 'true');
  };

  const closeManager = () => {
    modal.classList.remove('is-open'); modal.setAttribute('aria-hidden', 'true');
    paused = managerWasPaused;
    updateSpeedButtons();
    stateLabel.textContent = statusText();
  };

  const openManager = renderer => {
    managerWasPaused = paused;
    paused = true;
    updateSpeedButtons();
    stateLabel.textContent = halfTimeBreak ? 'HALF TIME' : 'PAUSED';
    renderer(); modal.classList.add('is-open'); modal.setAttribute('aria-hidden', 'false');
  };

  const bindClose = () => dialog.querySelectorAll('[data-close-manager]').forEach(button => button.addEventListener('click', closeManager));

  const renderTacticsDialog = () => {
    dialog.innerHTML = `
      <div class="flm-dialog-head"><div><p>IN-MATCH MANAGEMENT</p><h3>Tactical Changes</h3></div><button type="button" data-close-manager>✕</button></div>
      <div class="flm-preset-row"><button type="button" data-tactic-preset="protect">PROTECT LEAD</button><button type="button" data-tactic-preset="balanced">BALANCED</button><button type="button" data-tactic-preset="chase">CHASE GAME</button></div>
      <div class="flm-tactic-form">${Object.entries(TACTIC_OPTIONS).map(([key, values]) => `<label class="flm-tactic-field"><span>${tacticLabel(key)}</span><select data-live-tactic="${key}">${values.map(value => `<option value="${esc(value)}" ${state.tactics[key] === value ? 'selected' : ''}>${esc(value)}</option>`).join('')}</select></label>`).join('')}</div>
      <div class="flm-dialog-actions"><button type="button" data-close-manager>CANCEL</button><button type="button" class="primary" data-apply-live-tactics>APPLY CHANGES</button></div>`;
    bindClose();
    dialog.querySelectorAll('[data-tactic-preset]').forEach(button => button.addEventListener('click', () => {
      const values = preset(button.dataset.tacticPreset);
      dialog.querySelectorAll('[data-live-tactic]').forEach(field => { field.value = values[field.dataset.liveTactic]; });
    }));
    dialog.querySelector('[data-apply-live-tactics]').addEventListener('click', async () => {
      const patch = Object.fromEntries([...dialog.querySelectorAll('[data-live-tactic]')].map(field => [field.dataset.liveTactic, field.value]));
      const changed = changeTactics(state, patch); state = changed.state; refreshTactics(); await addEvent(changed.event); closeManager();
    });
  };

  const playerStatus = id => {
    const flags = [];
    if (state.injuredIds?.includes(id)) flags.push('INJ');
    if (state.sentOffIds?.includes(id)) flags.push('RED');
    return flags.join(' · ');
  };

  const renderSubsDialog = () => {
    const lineup = currentUserLineup(state);
    const available = state.userBenchIds.filter(id => !lineup.includes(id) && !state.subbedOffIds.includes(id));
    const remaining = MAX_SUBSTITUTIONS - state.substitutions.length;
    dialog.innerHTML = `
      <div class="flm-dialog-head"><div><p>IN-MATCH MANAGEMENT</p><h3>Substitutions</h3></div><button type="button" data-close-manager>✕</button></div>
      <div class="flm-sub-status"><strong>${remaining} of ${MAX_SUBSTITUTIONS} substitutions remaining</strong><span>${state.minute}'</span></div>
      <div class="flm-sub-grid">
        <label class="flm-sub-select"><span>PLAYER OFF</span><select data-sub-out>${lineup.map(id => { const p = player(db, id); return `<option value="${esc(id)}">${esc(p?.name || id)} · ${esc(p?.primaryPosition || '')} · ${Math.round(state.conditions[id] || 100)}% ${state.injuredIds?.includes(id) ? '· INJURED' : ''}</option>`; }).join('')}</select></label>
        <label class="flm-sub-select"><span>PLAYER ON</span><select data-sub-in ${available.length ? '' : 'disabled'}>${available.map(id => { const p = player(db, id); return `<option value="${esc(id)}">${esc(p?.name || id)} · ${esc(p?.primaryPosition || '')} · ${Math.round(state.conditions[id] || 100)}%</option>`; }).join('')}</select></label>
      </div>
      <div class="flm-player-live-list">${lineup.map(id => { const p = player(db, id); return `<div class="flm-player-live-row ${state.injuredIds?.includes(id) ? 'is-injured' : ''}"><span>${esc(p?.primaryPosition || '')}</span><strong>${esc(p?.name || id)} ${playerStatus(id) ? `· ${esc(playerStatus(id))}` : ''}</strong><small>${Math.round(state.conditions[id] || 100)}% CON</small><b>${rating(state.ratings[id])}</b></div>`; }).join('')}</div>
      <div class="flm-dialog-actions"><button type="button" data-close-manager>CLOSE</button><button type="button" class="primary" data-apply-sub ${remaining > 0 && available.length ? '' : 'disabled'}>MAKE SUB</button></div>`;
    bindClose();
    dialog.querySelector('[data-apply-sub]')?.addEventListener('click', async () => {
      try {
        const result = makeSubstitution(state, dialog.querySelector('[data-sub-out]').value, dialog.querySelector('[data-sub-in]').value, db);
        state = result.state; await addEvent(result.event); refreshTactics(); renderSubsDialog();
      } catch (error) {
        dialog.querySelector('.flm-sub-status').innerHTML = `<strong>${esc(error.message)}</strong><span>${state.minute}'</span>`;
      }
    });
  };

  const renderInstructionsDialog = () => {
    const lineup = currentUserLineup(state);
    dialog.innerHTML = `
      <div class="flm-dialog-head"><div><p>PLAYER-SPECIFIC MANAGEMENT</p><h3>Player Duties</h3></div><button type="button" data-close-manager>✕</button></div>
      <div class="flm-sub-status"><strong>Defend · Support · Attack</strong><span>${state.minute}'</span></div>
      <div class="flm-duty-list">${lineup.map(id => { const p = player(db, id); const current = state.playerDuties?.[id] || (p?.positionGroup === 'ATT' ? 'Attack' : p?.positionGroup === 'DEF' || p?.positionGroup === 'GK' ? 'Defend' : 'Support'); const choices = p?.positionGroup === 'GK' ? ['Defend'] : PLAYER_DUTIES; return `<label class="flm-duty-row"><span>${esc(p?.primaryPosition || '')}</span><strong>${esc(p?.name || id)}</strong><select data-player-duty="${esc(id)}">${choices.map(duty => `<option ${current === duty ? 'selected' : ''}>${duty}</option>`).join('')}</select></label>`; }).join('')}</div>
      <div class="flm-dialog-actions"><button type="button" data-close-manager>CANCEL</button><button type="button" class="primary" data-apply-duties>APPLY DUTIES</button></div>`;
    bindClose();
    dialog.querySelector('[data-apply-duties]').addEventListener('click', async () => {
      const changes = [...dialog.querySelectorAll('[data-player-duty]')].filter(field => state.playerDuties?.[field.dataset.playerDuty] !== field.value);
      for (const field of changes) {
        const result = setPlayerDuty(state, field.dataset.playerDuty, field.value, db); state = result.state; await addEvent(result.event);
      }
      closeManager();
    });
  };

  const renderRatingsDialog = () => {
    const lineup = currentUserLineup(state);
    const bench = state.userBenchIds.filter(id => !lineup.includes(id) && !state.subbedOffIds.includes(id));
    const row = id => { const p = player(db, id); return `<div class="flm-player-live-row ${state.injuredIds?.includes(id) ? 'is-injured' : ''}"><span>${esc(p?.primaryPosition || '')}</span><strong>${esc(p?.name || id)} ${playerStatus(id) ? `· ${esc(playerStatus(id))}` : ''}</strong><small>${Math.round(state.conditions[id] || 100)}% CON</small><b>${rating(state.ratings[id])}</b></div>`; };
    dialog.innerHTML = `<div class="flm-dialog-head"><div><p>LIVE PERFORMANCE</p><h3>Player Ratings</h3></div><button type="button" data-close-manager>✕</button></div><div class="flm-sub-status"><strong>ON THE PITCH</strong><span>${state.minute}'</span></div><div class="flm-player-live-list">${lineup.map(row).join('')}</div><div class="flm-sub-status" style="margin-top:16px"><strong>AVAILABLE BENCH</strong><span>${bench.length}</span></div><div class="flm-player-live-list">${bench.map(row).join('')}</div><div class="flm-dialog-actions"><button type="button" data-close-manager>CLOSE</button></div>`;
    bindClose();
  };

  const renderOppositionDialog = () => {
    const snapshot = getOpponentSnapshot(state, db);
    dialog.innerHTML = `<div class="flm-dialog-head"><div><p>OPPOSITION VIEW</p><h3>${esc(snapshot.clubName)}</h3></div><button type="button" data-close-manager>✕</button></div><div class="flm-opposition-card"><div class="flm-opposition-shape">${[['Formation', snapshot.tactics.formation], ['Mentality', snapshot.tactics.mentality], ['Pressing', snapshot.tactics.pressing], ['Tempo', snapshot.tactics.tempo], ['Width', snapshot.tactics.width], ['Red cards', snapshot.redCards]].map(([label,value]) => `<span>${esc(label)}<b>${esc(value)}</b></span>`).join('')}</div><div class="flm-player-live-list">${snapshot.lineupIds.map(id => { const p = player(db, id); return `<div class="flm-player-live-row"><span>${esc(p?.primaryPosition || '')}</span><strong>${esc(p?.name || id)}</strong><small>${Math.round(state.conditions[id] || 100)}% CON</small><b>${rating(state.ratings[id])}</b></div>`; }).join('')}</div></div><div class="flm-dialog-actions"><button type="button" data-close-manager>CLOSE</button></div>`;
    bindClose();
  };

  const openTactics = () => openManager(renderTacticsDialog);
  const openSubs = () => openManager(renderSubsDialog);
  const openInstructions = () => openManager(renderInstructionsDialog);
  root.querySelector('[data-open-tactics]').addEventListener('click', openTactics);
  root.querySelector('[data-open-subs]').addEventListener('click', openSubs);
  root.querySelector('[data-open-instructions]').addEventListener('click', openInstructions);
  root.querySelector('[data-open-ratings]').addEventListener('click', () => openManager(renderRatingsDialog));
  root.querySelector('[data-open-opposition]').addEventListener('click', () => openManager(renderOppositionDialog));
  root.querySelector('[data-ht-tactics]').addEventListener('click', openTactics);
  root.querySelector('[data-ht-subs]').addEventListener('click', openSubs);
  root.querySelector('[data-ht-instructions]').addEventListener('click', openInstructions);

  root.querySelectorAll('[data-match-speed]').forEach(control => control.addEventListener('click', () => {
    if (halfTimeBreak || finished) return;
    const next = Number(control.dataset.matchSpeed); paused = next === 0; if (!paused) speed = next; updateSpeedButtons(); stateLabel.textContent = statusText();
  }));

  root.querySelector('[data-resume-second-half]').addEventListener('click', async () => {
    if (!halfTimeBreak) return;
    halfTimeBreak = false; paused = false; shell.classList.remove('is-half-time'); matchStatus.textContent = 'LIVE'; stateLabel.textContent = 'SECOND HALF'; updateSpeedButtons();
    await addSingleLine(46, 'The manager has made the half-time call. The second half is ready to begin.', 'marker');
  });

  refreshScore(); refreshStats(); refreshTactics(); updateSpeedButtons();

  const playback = (async () => {
    while (state.minute < 90 && shell.isConnected) {
      while (paused && shell.isConnected) await sleep(70);
      await sleep(Math.max(60, BASE_STEP_MS / speed));
      if (!shell.isConnected) break;

      const advanced = advanceInteractiveMatch(state, career, db); state = advanced.state;
      clock.textContent = `${String(state.minute).padStart(2, '0')}:00`; refreshScore(); refreshStats();

      for (const event of advanced.events) {
        await addEvent(event);
        if (event.type === 'goal') { refreshScore(); await goalFlash(event); }
      }

      if (state.minute === 45) {
        halfTimeBreak = true; paused = true; shell.classList.add('is-half-time'); clock.textContent = '45:00'; matchStatus.textContent = 'HALF TIME'; stateLabel.textContent = 'HALF TIME';
        root.querySelector('[data-half-time-score]').textContent = `${state.homeGoals}–${state.awayGoals}`;
        updateSpeedButtons();
        while (halfTimeBreak && shell.isConnected) await sleep(80);
      }
    }

    if (!shell.isConnected) return;
    finished = true; paused = true; clock.textContent = '90:00'; refreshScore(); refreshStats(); stateLabel.textContent = 'FULL TIME'; matchStatus.textContent = 'FULL TIME'; shell.classList.remove('is-half-time'); shell.classList.add('is-full-time');
    root.querySelector('[data-full-time-score]').textContent = `${home?.name || 'Home'} ${state.homeGoals}–${state.awayGoals} ${away?.name || 'Away'}`;
    root.querySelectorAll('[data-match-speed], [data-open-tactics], [data-open-subs], [data-open-instructions], [data-open-ratings], [data-open-opposition]').forEach(button => button.disabled = true);
  })();

  await playback;
  if (!finished || !shell.isConnected) { lockShell(false); throw new Error('Live match was interrupted before full time.'); }

  const finalCareer = completeInteractiveRound(career, state, db);
  for (const key of Object.keys(completedCareer || {})) delete completedCareer[key];
  Object.assign(completedCareer, finalCareer);

  await new Promise(resolve => root.querySelector('[data-finish-live-match]').addEventListener('click', resolve, { once: true }));
  lockShell(false);
}
