const STYLE_ID = 'flm-live-match-v04-style';
const BASE_STEP_MS = 145;

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
    .flm-live-match{position:relative;display:grid;gap:18px;min-height:640px}
    .flm-live-scoreboard{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:18px;padding:18px 22px;border:1px solid rgba(255,255,255,.12);background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(255,255,255,.015));border-radius:18px}
    .flm-live-team{display:grid;gap:4px}.flm-live-team:last-child{text-align:right}.flm-live-team small{opacity:.62;font-size:.72rem;letter-spacing:.14em}.flm-live-team strong{font-size:1.2rem}
    .flm-live-score{display:grid;grid-template-columns:auto auto auto;gap:12px;align-items:center;text-align:center}.flm-live-score b{font-size:2.2rem;line-height:1}.flm-live-score span{opacity:.45}.flm-live-clock{grid-column:1/-1;font-variant-numeric:tabular-nums;font-weight:800;letter-spacing:.12em;font-size:.78rem;opacity:.8}
    .flm-live-grid{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(260px,.75fr);gap:18px}
    .flm-commentary-panel,.flm-stats-panel{border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.025);border-radius:18px;padding:18px}
    .flm-panel-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}.flm-panel-head p{margin:0;font-size:.72rem;letter-spacing:.14em;opacity:.62}.flm-panel-head strong{font-size:.78rem}
    .flm-commentary-feed{height:360px;overflow:auto;display:flex;flex-direction:column;gap:8px;padding-right:4px;scroll-behavior:smooth}
    .flm-commentary-line{display:grid;grid-template-columns:46px 1fr;gap:10px;padding:10px 12px;border-radius:10px;background:rgba(255,255,255,.025);border:1px solid transparent}.flm-commentary-line b{font-variant-numeric:tabular-nums}.flm-commentary-line.goal{border-color:rgba(230,191,82,.42);background:rgba(230,191,82,.1)}.flm-commentary-line.yellow{border-color:rgba(255,221,69,.28)}
    .flm-speed-controls{display:flex;gap:8px;flex-wrap:wrap}.flm-speed-controls button{min-width:48px;border:1px solid rgba(255,255,255,.14);background:#141414;color:#fff;border-radius:10px;padding:9px 11px;font-weight:800;cursor:pointer}.flm-speed-controls button.is-active{border-color:#e6bf52;color:#e6bf52}.flm-speed-controls button:disabled{opacity:.45;cursor:not-allowed}
    .flm-stat-list{display:grid;gap:13px}.flm-stat-row{display:grid;grid-template-columns:36px 1fr 36px;gap:8px;align-items:center}.flm-stat-row span:nth-child(2){text-align:center;font-size:.76rem;opacity:.66}.flm-stat-row strong:last-child{text-align:right}
    .flm-ft-card{display:none;border:1px solid rgba(230,191,82,.35);background:rgba(230,191,82,.075);border-radius:16px;padding:16px;align-items:center;justify-content:space-between;gap:16px}.flm-live-match.is-full-time .flm-ft-card{display:flex}.flm-ft-card h3{margin:0 0 4px}.flm-ft-card p{margin:0;opacity:.72}.flm-ft-card button{border:0;border-radius:12px;padding:12px 18px;background:#e6bf52;color:#080704;font-weight:900;cursor:pointer}
    .flm-goal-flash{position:absolute;inset:0;z-index:8;display:grid;place-items:center;pointer-events:none;background:rgba(230,191,82,.96);color:#080704;border-radius:22px;opacity:0;transform:scale(.98);transition:opacity .12s ease,transform .12s ease}
    .flm-goal-flash.is-visible{opacity:1;transform:scale(1)}
    .flm-goal-flash-inner{text-align:center;padding:30px}.flm-goal-flash .goal-word{display:block;font-size:clamp(3.4rem,10vw,7rem);line-height:.9;font-weight:1000;letter-spacing:-.04em}.flm-goal-flash strong{display:block;font-size:1.25rem;margin-top:15px}.flm-goal-flash small{display:block;margin-top:7px;font-weight:800;letter-spacing:.12em}
    .flm-live-lock-note{font-size:.72rem;opacity:.56}
    @media(max-width:820px){.flm-live-grid{grid-template-columns:1fr}.flm-commentary-feed{height:300px}.flm-live-scoreboard{grid-template-columns:1fr auto 1fr;padding:14px}.flm-live-team strong{font-size:1rem}.flm-live-score b{font-size:1.75rem}}
    @media(prefers-reduced-motion:reduce){.flm-goal-flash{transition:none}.flm-commentary-feed{scroll-behavior:auto}}
  `;
  document.head.appendChild(style);
}

function hash(value) {
  let h = 2166136261;
  for (const ch of String(value)) {
    h ^= ch.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function rng(seed) {
  let state = hash(seed) || 1;
  return () => {
    state += 0x6D2B79F5;
    let v = state;
    v = Math.imul(v ^ (v >>> 15), v | 1);
    v ^= v + Math.imul(v ^ (v >>> 7), v | 61);
    return ((v ^ (v >>> 14)) >>> 0) / 4294967296;
  };
}

function club(db, id) {
  return db.clubs.find(item => item.id === id);
}

function clubName(db, id) {
  const item = club(db, id);
  return item?.shortName || item?.name || 'Unknown';
}

function buildPresentationEvents(result, db, seed) {
  const random = rng(`${seed}:${result.id}:commentary`);
  const home = clubName(db, result.homeClubId);
  const away = clubName(db, result.awayClubId);
  const generic = [
    () => `${home} work the ball patiently through midfield.`,
    () => `${away} press higher and force play back toward the goalkeeper.`,
    () => `${home} switch the play quickly to the opposite flank.`,
    () => `${away} win a second ball and look to break forward.`,
    () => `A loose pass gives ${home} another chance to build.`,
    () => `${away} are compact without the ball.`,
    () => `${home} try to create an overload down the right.`,
    () => `${away} move the ball sharply between the lines.`,
    () => `The tempo rises as both sides trade possession.`,
    () => `${home} probe around the edge of the penalty area.`,
    () => `${away} clear their lines and reset their shape.`,
    () => `The midfield battle is getting increasingly physical.`
  ];
  const chances = [
    team => `${team} carve out a shooting lane, but the effort is blocked.`,
    team => `${team} deliver into the area and the goalkeeper claims cleanly.`,
    team => `${team} get in behind, but the final pass is overhit.`,
    team => `${team} test the goalkeeper from distance.`,
    team => `${team} win a corner after sustained pressure.`
  ];

  const events = [];
  [4,9,15,21,27,33,39,45,51,57,63,69,75,81,86].forEach((minute, index) => {
    const attacking = random() > .5 ? home : away;
    const text = index % 3 === 1
      ? chances[Math.floor(random() * chances.length)](attacking)
      : generic[Math.floor(random() * generic.length)]();
    events.push({ minute, type: 'commentary', text });
  });

  for (const raw of result.events || []) {
    if (raw.type === 'goal') {
      const scorer = db.players.find(p => p.id === raw.playerId)?.name || raw.text?.replace(/ scores\.$/, '') || 'A player';
      const scoringClub = clubName(db, raw.clubId);
      events.push({ minute: Math.max(1, raw.minute - 1), type: 'commentary', text: `${scoringClub} break into the final third...` });
      events.push({ minute: raw.minute, type: 'goal', clubId: raw.clubId, playerId: raw.playerId, scorer, text: `${scorer} finishes it! GOAL for ${scoringClub}!` });
    } else if (raw.type === 'yellow') {
      events.push({ ...raw, text: raw.text || 'Yellow card after a late challenge.' });
    } else {
      events.push(raw);
    }
  }

  events.push({ minute: 45, type: 'marker', text: 'HALF TIME.' });
  events.push({ minute: 90, type: 'marker', text: 'FULL TIME.' });
  return events
    .map((event, index) => ({ ...event, index }))
    .sort((a, b) => a.minute - b.minute || a.index - b.index);
}

function makeStats(result, seed) {
  const random = rng(`${seed}:${result.id}:stats`);
  const homePoss = 45 + Math.floor(random() * 11);
  const awayPoss = 100 - homePoss;
  const homeShots = Math.max(result.homeGoals + 3, 7 + Math.floor(random() * 8));
  const awayShots = Math.max(result.awayGoals + 3, 6 + Math.floor(random() * 8));
  const homeOn = Math.min(homeShots, Math.max(result.homeGoals, 2 + Math.floor(random() * 5)));
  const awayOn = Math.min(awayShots, Math.max(result.awayGoals, 2 + Math.floor(random() * 5)));
  return [
    ['Possession', `${homePoss}%`, `${awayPoss}%`],
    ['Shots', homeShots, awayShots],
    ['On target', homeOn, awayOn],
    ['Corners', 2 + Math.floor(random() * 7), 2 + Math.floor(random() * 7)],
    ['Fouls', 7 + Math.floor(random() * 8), 7 + Math.floor(random() * 8)]
  ];
}

function lockShell(locked) {
  document.querySelectorAll('[data-career-tab], [data-exit-career], [data-save-career]').forEach(button => {
    button.disabled = locked;
    button.setAttribute('aria-disabled', String(locked));
  });
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function playLiveMatch({ root, career, completedCareer, db, reducedMotion = false }) {
  ensureStyles();
  const result = completedCareer.lastMatch;
  if (!root || !result) throw new Error('Live match presentation could not initialise.');

  const home = club(db, result.homeClubId);
  const away = club(db, result.awayClubId);
  const events = buildPresentationEvents(result, db, career.seed);
  const stats = makeStats(result, career.seed);
  let minute = 0;
  let speed = 1;
  let paused = false;
  let homeGoals = 0;
  let awayGoals = 0;
  let eventCursor = 0;
  let finished = false;

  lockShell(true);
  root.innerHTML = `
    <section class="flm-live-match" data-live-match aria-label="Live match centre">
      <div class="flm-goal-flash" data-goal-flash aria-hidden="true"><div class="flm-goal-flash-inner"><span class="goal-word">GOAL!</span><strong data-goal-scorer></strong><small data-goal-score></small></div></div>
      <div class="career-page-heading"><div><p class="eyebrow">ROUND ${esc(result.round)}</p><h2>Live Match Centre</h2></div><span class="career-round" data-match-status>LIVE</span></div>
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
        <aside class="flm-stats-panel">
          <div class="flm-panel-head"><p>MATCH STATS</p><strong>LIVE VIEW</strong></div>
          <div class="flm-stat-list">${stats.map(([label,h,a]) => `<div class="flm-stat-row"><strong>${esc(h)}</strong><span>${esc(label)}</span><strong>${esc(a)}</strong></div>`).join('')}</div>
        </aside>
      </div>
      <div class="career-match-actions">
        <div><strong>MATCH SPEED</strong><span class="flm-live-lock-note">Squad and tactical intervention arrive in the next V0.4 slice.</span></div>
        <div class="flm-speed-controls" aria-label="Match speed">
          <button type="button" data-match-speed="0">PAUSE</button>
          <button type="button" data-match-speed="1" class="is-active">1×</button>
          <button type="button" data-match-speed="2">2×</button>
          <button type="button" data-match-speed="4">4×</button>
        </div>
      </div>
      <div class="flm-ft-card">
        <div><h3>FULL TIME</h3><p>${esc(home?.name || 'Home')} ${result.homeGoals}–${result.awayGoals} ${esc(away?.name || 'Away')}</p></div>
        <button type="button" data-finish-live-match>CONTINUE</button>
      </div>
    </section>`;

  const shell = root.querySelector('[data-live-match]');
  const feed = root.querySelector('[data-commentary-feed]');
  const clock = root.querySelector('[data-live-clock]');
  const homeScore = root.querySelector('[data-home-score]');
  const awayScore = root.querySelector('[data-away-score]');
  const stateLabel = root.querySelector('[data-commentary-state]');
  const matchStatus = root.querySelector('[data-match-status]');
  const flash = root.querySelector('[data-goal-flash]');

  const addLine = event => {
    const line = document.createElement('div');
    line.className = `flm-commentary-line ${event.type || ''}`;
    line.innerHTML = `<b>${event.minute}'</b><span>${esc(event.text)}</span>`;
    feed.appendChild(line);
    feed.scrollTop = feed.scrollHeight;
    stateLabel.textContent = event.type === 'goal' ? 'GOAL' : event.type === 'yellow' ? 'BOOKING' : event.type === 'marker' ? event.text : 'LIVE';
  };

  const goalFlash = async event => {
    if (event.clubId === result.homeClubId) homeGoals += 1;
    else if (event.clubId === result.awayClubId) awayGoals += 1;
    homeScore.textContent = homeGoals;
    awayScore.textContent = awayGoals;
    flash.querySelector('[data-goal-scorer]').textContent = event.scorer || 'GOAL';
    flash.querySelector('[data-goal-score]').textContent = `${homeGoals} — ${awayGoals}`;
    flash.classList.add('is-visible');
    flash.setAttribute('aria-hidden', 'false');
    await sleep(reducedMotion ? 220 : 780);
    flash.classList.remove('is-visible');
    flash.setAttribute('aria-hidden', 'true');
  };

  root.querySelectorAll('[data-match-speed]').forEach(control => control.addEventListener('click', () => {
    const next = Number(control.dataset.matchSpeed);
    paused = next === 0;
    if (!paused) speed = next;
    root.querySelectorAll('[data-match-speed]').forEach(btn => btn.classList.toggle('is-active', Number(btn.dataset.matchSpeed) === (paused ? 0 : speed)));
    stateLabel.textContent = paused ? 'PAUSED' : 'LIVE';
  }));

  const playback = (async () => {
    addLine({ minute: 0, type: 'marker', text: 'KICK-OFF.' });
    while (minute < 90 && shell.isConnected) {
      while (paused && shell.isConnected) await sleep(80);
      await sleep(Math.max(24, BASE_STEP_MS / speed));
      minute += 1;
      const seconds = Math.min(59, Math.floor((minute % 1) * 60));
      clock.textContent = `${String(minute).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

      while (eventCursor < events.length && events[eventCursor].minute <= minute) {
        const event = events[eventCursor++];
        addLine(event);
        if (event.type === 'goal') await goalFlash(event);
      }
    }

    if (!shell.isConnected) return;
    finished = true;
    paused = true;
    clock.textContent = '90:00';
    homeScore.textContent = result.homeGoals;
    awayScore.textContent = result.awayGoals;
    stateLabel.textContent = 'FULL TIME';
    matchStatus.textContent = 'FULL TIME';
    shell.classList.add('is-full-time');
    root.querySelectorAll('[data-match-speed]').forEach(button => button.disabled = true);
  })();

  await playback;

  if (!finished || !shell.isConnected) {
    lockShell(false);
    throw new Error('Live match was interrupted before full time.');
  }

  await new Promise(resolve => {
    root.querySelector('[data-finish-live-match]').addEventListener('click', resolve, { once: true });
  });

  lockShell(false);
}
