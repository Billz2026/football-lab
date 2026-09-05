const STYLE_HREF = './match-centre-v4.css?v=4.0.0';
let queued = false;
let databasePromise = null;
const stateByLive = new WeakMap();

const esc = value => String(value ?? '')
  .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
  .replaceAll('"','&quot;').replaceAll("'",'&#039;');
const clean = value => String(value || '').replace(/\s+/g,' ').trim();

function ensureStyles(){
  if ([...document.styleSheets].some(sheet => sheet.href?.includes('match-centre-v4.css'))) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = STYLE_HREF;
  document.head.appendChild(link);
}

function db(){
  if (!databasePromise) databasePromise = Promise.resolve(window.FLMManager?.loadDatabase?.()).catch(() => null);
  return databasePromise;
}

function stateFor(live){
  let state = stateByLive.get(live);
  if (!state) {
    state = { view:'overview', ratingsSide:'home', goalCount:null, goalTimer:0, goalKey:'', context:null };
    stateByLive.set(live,state);
  }
  return state;
}

function nativeView(live,view){
  if (view === 'zones') return live.querySelector('[data-cm31-view="zones"]');
  if (view === 'ratings') return live.querySelector('[data-cm32-view="ratings"]');
  return live.querySelector(`[data-cm-v2-view="${view}"]`);
}

function setView(live,view){
  const state = stateFor(live);
  state.view = view;
  const native = nativeView(live,view);
  if (native) native.click();
  const shell = live.querySelector(':scope > .cm4-shell');
  shell?.querySelectorAll('[data-cm4-view]').forEach(button => button.classList.toggle('is-active',button.dataset.cm4View === view));
  shell?.querySelectorAll('[data-cm4-panel]').forEach(panel => panel.classList.toggle('is-active',panel.dataset.cm4Panel === view));
  queue();
}

function shellMarkup(){
  return `
    <header class="cm4-scorebar">
      <div class="cm4-team cm4-home-team"><strong data-cm4-home-name>HOME</strong></div>
      <div class="cm4-scorebox" data-cm4-home-score>0</div>
      <div class="cm4-clockbox"><b data-cm4-clock>00:00</b><span data-cm4-half>FIRST HALF</span></div>
      <div class="cm4-scorebox" data-cm4-away-score>0</div>
      <div class="cm4-team cm4-away-team"><strong data-cm4-away-name>AWAY</strong></div>
    </header>

    <nav class="cm4-tabs" aria-label="Match centre views">
      <button type="button" class="is-active" data-cm4-view="overview">Match Overview</button>
      <button type="button" data-cm4-view="stats">Match Stats</button>
      <button type="button" data-cm4-view="zones">Action Zones</button>
      <button type="button" data-cm4-view="ratings">Player Ratings</button>
      <button type="button" data-cm4-view="report">Match Report</button>
    </nav>

    <div class="cm4-main">
      <aside class="cm4-rail">
        <div class="cm4-minute" data-cm4-minute>0'</div>
        <button type="button" data-cm4-pause>Pause Match</button>
        <button type="button" data-cm4-tactics>Tactics</button>
        <button type="button" data-cm4-subs>Substitutions</button>
        <div class="cm4-speed-label">Commentary<br>Speed</div>
        <div class="cm4-speed">
          <button type="button" data-cm4-speed="1">1x</button>
          <button type="button" data-cm4-speed="2">2x</button>
          <button type="button" data-cm4-speed="4">4x</button>
        </div>
      </aside>

      <section class="cm4-workspace">
        <section class="cm4-panel cm4-overview is-active" data-cm4-panel="overview">
          <header class="cm4-phase">
            <strong data-cm4-phase>First Half</strong>
            <div><span data-cm4-date>Matchday</span><span data-cm4-comp>League Match</span></div>
          </header>

          <div class="cm4-stage" data-cm4-stage>
            <div class="cm4-stadium-shade"></div>
            <div class="cm4-event is-neutral" data-cm4-event>
              <div class="cm4-event-context"><span data-cm4-event-minute>0'</span><small data-cm4-event-team>MATCH UPDATE</small></div>
              <strong data-cm4-event-text>Waiting for kick-off...</strong>
            </div>
            <div class="cm4-goal-sequence" data-cm4-goal aria-live="assertive"></div>
          </div>

          <div class="cm4-pressure">
            <strong>Last 5 Mins</strong>
            <div class="cm4-pressure-track"><span class="home" data-cm4-pressure-home></span><span class="away" data-cm4-pressure-away></span></div>
            <b data-cm4-pressure-copy>50% — 50%</b>
          </div>

          <footer class="cm4-meta">
            <span data-cm4-referee>Referee — Match Official</span>
            <span data-cm4-attendance>Attendance —</span>
            <span data-cm4-weather>Weather —</span>
          </footer>
        </section>

        <section class="cm4-panel cm4-detail" data-cm4-panel="stats"><div data-cm4-stats></div></section>
        <section class="cm4-panel cm4-detail" data-cm4-panel="zones"><div data-cm4-zones></div></section>
        <section class="cm4-panel cm4-detail" data-cm4-panel="ratings"><div data-cm4-ratings></div></section>
        <section class="cm4-panel cm4-detail" data-cm4-panel="report"><div data-cm4-report></div></section>
      </section>
    </div>

    <footer class="cm4-bottom-player" data-cm4-bottom-player>Football Lab Match Centre</footer>`;
}

function ensureShell(live){
  let shell = live.querySelector(':scope > .cm4-shell');
  if (shell) return shell;
  shell = document.createElement('section');
  shell.className = 'cm4-shell';
  shell.innerHTML = shellMarkup();
  live.prepend(shell);
  live.dataset.cm4 = '1';

  shell.querySelectorAll('[data-cm4-view]').forEach(button => button.addEventListener('click',() => setView(live,button.dataset.cm4View)));
  shell.querySelector('[data-cm4-pause]')?.addEventListener('click',() => {
    const paused = live.querySelector('[data-match-speed="0"]')?.classList.contains('is-active');
    live.querySelector(`[data-match-speed="${paused ? '1' : '0'}"]`)?.click();
    queue();
  });
  shell.querySelector('[data-cm4-tactics]')?.addEventListener('click',() => live.querySelector('[data-open-tactics]')?.click());
  shell.querySelector('[data-cm4-subs]')?.addEventListener('click',() => live.querySelector('[data-open-subs]')?.click());
  shell.querySelectorAll('[data-cm4-speed]').forEach(button => button.addEventListener('click',() => {
    live.querySelector(`[data-match-speed="${button.dataset.cm4Speed}"]`)?.click();
    queue();
  }));
  return shell;
}

function matchMinute(live){
  const clock = clean(live.querySelector('[data-live-clock]')?.textContent);
  const parsed = Number(clock.split(':')[0]);
  const snapshotMinute = Number(window.__flmLiveStateV332?.minute);
  const minute = Number.isFinite(parsed) ? parsed : Number.isFinite(snapshotMinute) ? snapshotMinute : 0;
  return { minute, clock: /^\d{2}:\d{2}$/.test(clock) ? clock : `${String(Math.max(0,Math.round(minute))).padStart(2,'0')}:00` };
}

function halfLabel(live,minute){
  if (live.classList.contains('is-full-time') || minute >= 90) return 'Full Time';
  if (live.classList.contains('is-half-time')) return 'Half Time';
  return minute >= 45 ? 'Second Half' : 'First Half';
}

function formatCareerDate(){
  const raw = window.FLMManager?.activeCareer?.currentDate;
  if (!raw) return 'Matchday';
  try {
    return new Date(`${raw}T12:00:00`).toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  } catch (_) { return raw; }
}

async function contextFor(live){
  const state = stateFor(live);
  const nativeNames = [...live.querySelectorAll('.flm-live-team strong')].map(node => clean(node.textContent));
  const snapshot = window.__flmLiveStateV332;
  const database = await db();
  if (!database) return {homeName:nativeNames[0] || 'Home',awayName:nativeNames[1] || 'Away',homeClub:null,awayClub:null,league:null,database:null};
  const homeClub = database.clubs?.find(club => club.id === snapshot?.homeClubId) || database.clubs?.find(club => club.name === nativeNames[0]);
  const awayClub = database.clubs?.find(club => club.id === snapshot?.awayClubId) || database.clubs?.find(club => club.name === nativeNames[1]);
  const league = database.leagues?.find(item => item.id === homeClub?.leagueId) || null;
  const context = {homeName:homeClub?.name || nativeNames[0] || 'Home',awayName:awayClub?.name || nativeNames[1] || 'Away',homeClub,awayClub,league,database};
  state.context = context;
  return context;
}

function syncHeader(live,shell,context){
  const scores = live.querySelectorAll('.flm-live-score b');
  const {minute,clock} = matchMinute(live);
  const phase = halfLabel(live,minute);
  shell.querySelector('[data-cm4-home-name]').textContent = context.homeName;
  shell.querySelector('[data-cm4-away-name]').textContent = context.awayName;
  shell.querySelector('[data-cm4-home-score]').textContent = clean(scores[0]?.textContent) || '0';
  shell.querySelector('[data-cm4-away-score]').textContent = clean(scores[1]?.textContent) || '0';
  shell.querySelector('[data-cm4-clock]').textContent = clock;
  shell.querySelector('[data-cm4-half]').textContent = phase.toUpperCase();
  shell.querySelector('[data-cm4-minute]').textContent = `${Math.max(0,Math.round(minute))}'`;
  shell.querySelector('[data-cm4-phase]').textContent = phase;
  shell.querySelector('[data-cm4-date]').textContent = formatCareerDate();
  shell.querySelector('[data-cm4-comp]').textContent = context.league?.name || 'League Match';

  const paused = live.querySelector('[data-match-speed="0"]')?.classList.contains('is-active');
  const pause = shell.querySelector('[data-cm4-pause]');
  pause.textContent = live.classList.contains('is-full-time') ? 'Full Time' : paused ? 'Resume Match' : 'Pause Match';
  pause.classList.toggle('is-active',Boolean(paused));
  shell.querySelectorAll('[data-cm4-speed]').forEach(button => {
    const native = live.querySelector(`[data-match-speed="${button.dataset.cm4Speed}"]`);
    button.classList.toggle('is-active',Boolean(native?.classList.contains('is-active')));
  });
}

function eventType(line){
  const text = clean(line?.querySelector('span')?.textContent || line?.textContent).toLowerCase();
  if (!line) return 'neutral';
  if (line.classList.contains('goal') || /\bgoal\b|scores for|finds the net/.test(text)) return 'goal';
  if (line.classList.contains('red') || /red card|sent off/.test(text)) return 'red';
  if (line.classList.contains('yellow') || /yellow card|booked/.test(text)) return 'yellow';
  if (line.classList.contains('injury') || /injur|treatment|cannot continue/.test(text)) return 'injury';
  if (line.classList.contains('save') || /\bsave\b|saved by|shoots|shot|effort|header|post|crossbar/.test(text)) return 'chance';
  return 'normal';
}

function syncEvent(live,shell,context){
  const lines = [...live.querySelectorAll('[data-commentary-feed] .flm-commentary-line')];
  const current = lines.at(-1);
  if (!current) return;
  const type = eventType(current);
  const side = current.dataset.cmSide === 'away' ? 'away' : current.dataset.cmSide === 'home' ? 'home' : 'neutral';
  const minute = clean(current.querySelector('b')?.textContent) || `${matchMinute(live).minute}'`;
  const raw = clean(current.querySelector('span')?.textContent || current.textContent);
  const event = shell.querySelector('[data-cm4-event]');
  event.className = `cm4-event is-${type} is-${side}`;
  event.querySelector('[data-cm4-event-minute]').textContent = minute;
  event.querySelector('[data-cm4-event-team]').textContent = side === 'home' ? context.homeName : side === 'away' ? context.awayName : 'MATCH UPDATE';

  let text = raw;
  if (type === 'yellow') text = 'YELLOW CARD!';
  else if (type === 'red') text = 'RED CARD!';
  event.querySelector('[data-cm4-event-text]').textContent = text || 'Match in progress...';

  const playerBanner = shell.querySelector('[data-cm4-bottom-player]');
  if (type === 'goal') playerBanner.textContent = raw;
  else if (raw) playerBanner.textContent = `${minute} · ${raw}`;
}

function pressureValues(live){
  const source = live.querySelector('.cm31-pressure');
  const homeText = clean(source?.querySelector('[data-cm31-pressure-home]')?.textContent) || '50%';
  const awayText = clean(source?.querySelector('[data-cm31-pressure-away]')?.textContent) || '50%';
  const home = Math.max(0,Math.min(100,Number(homeText.replace('%','')) || 50));
  const away = Math.max(0,100-home);
  return {home,away};
}

function syncPressure(live,shell){
  const {home,away} = pressureValues(live);
  shell.querySelector('[data-cm4-pressure-home]').style.width = `${home}%`;
  shell.querySelector('[data-cm4-pressure-away]').style.width = `${away}%`;
  shell.querySelector('[data-cm4-pressure-copy]').textContent = `${Math.round(home)}% — ${Math.round(away)}%`;
}

function goalEvents(){
  return (window.__flmLiveStateV332?.events || []).filter(event => event.type === 'goal');
}

function playerName(database,id){
  return database?.players?.find(player => player.id === id)?.name || '';
}

function startGoalSequence(live,shell,goal,context){
  const state = stateFor(live);
  const host = shell.querySelector('[data-cm4-goal]');
  if (!host || !goal) return;
  clearTimeout(state.goalTimer);
  const database = context.database;
  const scorer = playerName(database,goal.playerId) || 'Goal scorer';
  const assist = playerName(database,goal.assistPlayerId);
  const scoringHome = goal.clubId === window.__flmLiveStateV332?.homeClubId;
  const team = scoringHome ? context.homeName : context.awayName;
  const scores = live.querySelectorAll('.flm-live-score b');
  const scoreText = `${context.homeName} ${clean(scores[0]?.textContent) || '0'}–${clean(scores[1]?.textContent) || '0'} ${context.awayName}`;
  const minute = `${Math.round(Number(goal.minute) || matchMinute(live).minute)}'`;
  host.className = `cm4-goal-sequence is-visible ${scoringHome ? 'home' : 'away'}`;

  const frames = [
    `<div class="cm4-goal-frame announce"><strong>GOAL FOR ${esc(team).toUpperCase()}!</strong></div>`,
    `<div class="cm4-goal-frame scorer"><small>${esc(minute)}</small><strong>${esc(scorer)} SCORES!</strong></div>`,
    `<div class="cm4-goal-frame detail"><strong>${esc(scoreText)}</strong>${assist ? `<span>Assist: ${esc(assist)}</span>` : ''}<small>${esc(minute)}</small></div>`
  ];
  let index = 0;
  const show = () => {
    host.innerHTML = frames[index];
    index += 1;
    if (index < frames.length) state.goalTimer = setTimeout(show,index === 1 ? 650 : 850);
    else state.goalTimer = setTimeout(() => { host.className = 'cm4-goal-sequence'; host.innerHTML = ''; },900);
  };
  show();
}

function syncGoalSequence(live,shell,context){
  const state = stateFor(live);
  const goals = goalEvents();
  if (state.goalCount === null) { state.goalCount = goals.length; return; }
  if (goals.length <= state.goalCount) return;
  const goal = goals.at(-1);
  const key = `${goal?.minute}|${goal?.clubId}|${goal?.playerId}|${goals.length}`;
  state.goalCount = goals.length;
  if (key === state.goalKey) return;
  state.goalKey = key;
  startGoalSequence(live,shell,goal,context);
}

function statRows(live){
  return [...live.querySelectorAll('[data-live-stats] .flm-stat-row')].map(row => {
    const values = row.querySelectorAll('strong');
    return { label:clean(row.querySelector('span')?.textContent), home:clean(values[0]?.textContent), away:clean(values[1]?.textContent) };
  }).filter(row => row.label);
}

function renderStats(live,shell,context){
  const host = shell.querySelector('[data-cm4-stats]');
  const rows = statRows(live);
  host.innerHTML = `<header class="cm4-detail-head"><div><small>LIVE MATCH DATA</small><h3>Match Stats</h3></div><span>${esc(context.homeName)} vs ${esc(context.awayName)}</span></header>
    <div class="cm4-stats-table"><div class="cm4-stats-team"><strong>${esc(context.homeName)}</strong><span>STAT</span><strong>${esc(context.awayName)}</strong></div>${rows.map(row => `<div class="cm4-stat-row"><b>${esc(row.home || '0')}</b><span>${esc(row.label)}</span><b>${esc(row.away || '0')}</b></div>`).join('')}</div>`;
}

function renderZones(live,shell){
  const host = shell.querySelector('[data-cm4-zones]');
  const source = live.querySelector('.cm31-action-zones');
  host.innerHTML = `<header class="cm4-detail-head"><div><small>TERRITORY</small><h3>Action Zones</h3></div></header><div class="cm4-zone-clone">${source?.innerHTML || '<p>Action-zone data will appear as the match develops.</p>'}</div>`;
}

function contributionMap(snapshot){
  const map = new Map();
  for (const event of snapshot?.events || []) {
    if (event.type !== 'goal') continue;
    if (event.playerId) { const item = map.get(event.playerId) || {g:0,a:0}; item.g += 1; map.set(event.playerId,item); }
    if (event.assistPlayerId) { const item = map.get(event.assistPlayerId) || {g:0,a:0}; item.a += 1; map.set(event.assistPlayerId,item); }
  }
  return map;
}

async function renderRatings(live,shell,context){
  const host = shell.querySelector('[data-cm4-ratings]');
  const snapshot = window.__flmLiveStateV332;
  if (!snapshot || !context.database) { host.innerHTML = '<div class="cm4-empty">Ratings initialise after kick-off.</div>'; return; }
  const state = stateFor(live);
  const side = state.ratingsSide;
  const ids = side === 'home' ? snapshot.homeLineupIds : snapshot.awayLineupIds;
  const club = side === 'home' ? context.homeClub : context.awayClub;
  const returns = contributionMap(snapshot);
  const rows = ids.map(id => context.database.players?.find(player => player.id === id)).filter(Boolean);
  host.innerHTML = `<header class="cm4-detail-head"><div><small>LIVE PERFORMANCE</small><h3>Player Ratings</h3></div><div class="cm4-rating-toggle"><button data-cm4-rating-side="home" class="${side === 'home' ? 'is-active' : ''}">${esc(context.homeName)}</button><button data-cm4-rating-side="away" class="${side === 'away' ? 'is-active' : ''}">${esc(context.awayName)}</button></div></header>
    <div class="cm4-rating-table"><div class="cm4-rating-head"><span>NO.</span><span>PLAYER</span><span>POS</span><span>MIN</span><span>CON</span><span>G</span><span>A</span><span>RTG</span></div>${rows.map(player => { const c=returns.get(player.id)||{g:0,a:0}; const rating=Number(snapshot.ratings?.[player.id]??6.5); const condition=Math.round(Number(snapshot.conditions?.[player.id]??100)); const mins=Math.round(Number(snapshot.minutesPlayed?.[player.id]??snapshot.minute??0)); return `<div class="cm4-rating-row"><span>${esc(player.shirtNumber ?? '—')}</span><strong>${esc(player.name)}</strong><span>${esc(player.primaryPosition || player.positionGroup || '—')}</span><span>${mins}'</span><span>${condition}%</span><span>${c.g||'—'}</span><span>${c.a||'—'}</span><b class="${rating>=8?'elite':rating>=7?'good':rating<6?'poor':''}">${rating.toFixed(1)}</b></div>`; }).join('')}</div>`;
  host.querySelectorAll('[data-cm4-rating-side]').forEach(button => button.addEventListener('click',() => { state.ratingsSide = button.dataset.cm4RatingSide; renderRatings(live,shell,context); }));
  if (club?.venue) shell.querySelector('[data-cm4-attendance]').dataset.venue = club.venue;
}

function renderReport(live,shell){
  const host = shell.querySelector('[data-cm4-report]');
  const lines = [...live.querySelectorAll('[data-commentary-feed] .flm-commentary-line')];
  host.innerHTML = `<header class="cm4-detail-head"><div><small>FULL TIMELINE</small><h3>Match Report</h3></div></header><div class="cm4-report-list">${lines.map(line => `<div class="cm4-report-row ${eventType(line)}"><b>${esc(clean(line.querySelector('b')?.textContent) || '—')}</b><span>${esc(clean(line.querySelector('span')?.textContent || line.textContent))}</span></div>`).join('')}</div>`;
}

function syncMeta(shell,context){
  const venue = context.homeClub?.venue;
  const attendance = shell.querySelector('[data-cm4-attendance]');
  if (attendance) attendance.textContent = venue ? `Venue — ${venue}` : 'Attendance —';
}

async function enhance(live){
  if (!live?.isConnected) return;
  const shell = ensureShell(live);
  const context = await contextFor(live);
  syncHeader(live,shell,context);
  syncEvent(live,shell,context);
  syncPressure(live,shell);
  syncGoalSequence(live,shell,context);
  syncMeta(shell,context);

  const state = stateFor(live);
  if (state.view === 'stats') renderStats(live,shell,context);
  if (state.view === 'zones') renderZones(live,shell);
  if (state.view === 'ratings') await renderRatings(live,shell,context);
  if (state.view === 'report') renderReport(live,shell);
}

function queue(){
  if (queued) return;
  queued = true;
  requestAnimationFrame(async () => {
    queued = false;
    for (const live of document.querySelectorAll('[data-live-match], .flm-live-match')) await enhance(live);
  });
}

ensureStyles();
queue();
new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','data-cm-view']});
