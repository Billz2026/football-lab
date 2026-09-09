/*
 * Football Lab Manager — Match Centre v5
 * Canonical consolidated runtime generated from the proven v4-v4.6 stack.
 *
 * Each former ES module is kept in an isolated lexical scope so duplicate
 * const/let/var/function names cannot collide. Runtime evaluation order is
 * identical to the previous eight-import chain.
 *
 * Do not add another Match Centre patch file. Future Match Centre changes
 * belong in this canonical module (or in its source generator workflow
 * until the legacy sections are fully refactored internally).
 */

/* ===== BEGIN CONSOLIDATED SOURCE: match-centre-v4.js ===== */
(() => {
'use strict';
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

})();
/* ===== END CONSOLIDATED SOURCE: match-centre-v4.js ===== */

/* ===== BEGIN CONSOLIDATED SOURCE: match-centre-v4-ratings-integrity-v1.js ===== */
(() => {
'use strict';
const MATCH_CENTRE_RATINGS_INTEGRITY_VERSION='1.0.0';

let dbPromise=null;
let queued=false;

function database(){
  if(!dbPromise)dbPromise=Promise.resolve(window.FLMManager?.loadDatabase?.()).catch(()=>null);
  return dbPromise;
}

function esc(value){
  return String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
}

function contributionMap(events=[]){
  const map=new Map();
  for(const event of events){
    if(event?.type!=='goal')continue;
    if(event.playerId){const item=map.get(event.playerId)||{g:0,a:0};item.g+=1;map.set(event.playerId,item);}
    if(event.assistPlayerId){const item=map.get(event.assistPlayerId)||{g:0,a:0};item.a+=1;map.set(event.assistPlayerId,item);}
  }
  return map;
}

function rowMarkup(player,snapshot,returns){
  const c=returns.get(player.id)||{g:0,a:0};
  const rating=Number(snapshot.ratings?.[player.id]??6.5);
  const condition=Math.round(Number(snapshot.conditions?.[player.id]??100));
  const mins=Math.round(Number(snapshot.minutesPlayed?.[player.id]??snapshot.minute??0));
  const tone=rating>=8?'elite':rating>=7?'good':rating<6?'poor':'';
  return `<div class="cm4-rating-row cm4-rating-row-history is-off" data-cm4-history-player="${esc(player.id)}"><span>${esc(player.shirtNumber??'—')}</span><strong>${esc(player.name)}</strong><span>${esc(player.primaryPosition||player.positionGroup||'—')}</span><span>${mins}'</span><span>${condition}%</span><span>${c.g||'—'}</span><span>${c.a||'—'}</span><b class="${tone}">${rating.toFixed(1)}</b></div>`;
}

async function syncLive(live){
  const snapshot=window.__flmLiveStateV332;
  if(!snapshot||snapshot.fixtureId==null)return;
  const panel=live.querySelector('[data-cm4-panel="ratings"].is-active');
  const table=panel?.querySelector('.cm4-rating-table');
  if(!table)return;
  const db=await database();
  if(!db)return;
  const activeSide=panel.querySelector('[data-cm4-rating-side].is-active')?.dataset.cm4RatingSide||'home';
  const clubId=activeSide==='away'?snapshot.awayClubId:snapshot.homeClubId;
  const initial=activeSide==='away'?(snapshot.initialAwayLineupIds||[]):(snapshot.initialHomeLineupIds||[]);
  const current=activeSide==='away'?(snapshot.awayLineupIds||[]):(snapshot.homeLineupIds||[]);
  const appeared=new Set([...initial,...current]);
  for(const [id,minutes] of Object.entries(snapshot.minutesPlayed||{})){
    if(Number(minutes)<=0)continue;
    const player=db.players?.find(item=>item.id===id);
    if(player?.clubId===clubId)appeared.add(id);
  }
  const existingNames=new Set([...table.querySelectorAll('.cm4-rating-row > strong')].map(node=>node.textContent?.trim()).filter(Boolean));
  const returns=contributionMap(snapshot.events||[]);
  for(const id of appeared){
    const player=db.players?.find(item=>item.id===id);
    if(!player||existingNames.has(player.name))continue;
    table.insertAdjacentHTML('beforeend',rowMarkup(player,snapshot,returns));
    existingNames.add(player.name);
  }
  live.dataset.cm4RatingsIntegrity=MATCH_CENTRE_RATINGS_INTEGRITY_VERSION;
}

async function syncAll(){
  queued=false;
  for(const live of document.querySelectorAll('[data-live-match],.flm-live-match'))await syncLive(live);
}

function queue(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(syncAll);
}

window.addEventListener('flm:live-state-v332',queue);
document.addEventListener('click',event=>{
  if(event.target?.closest?.('[data-cm4-view="ratings"],[data-cm4-rating-side]'))queue();
});
queue();

})();
/* ===== END CONSOLIDATED SOURCE: match-centre-v4-ratings-integrity-v1.js ===== */

/* ===== BEGIN CONSOLIDATED SOURCE: match-centre-v4-mode.js ===== */
(() => {
'use strict';
const STYLE_ID = 'flm-match-centre-v4-mode';

function ensureModeStyle(){
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .career-app.flm-cm-shell .career-layout:has(.flm-live-match[data-cm4="1"]){
      grid-template-columns:minmax(0,1fr)!important;
    }
    .career-app.flm-cm-shell .career-layout:has(.flm-live-match[data-cm4="1"]) > .flm-cm-sidebar{
      display:none!important;
    }
    .career-app.flm-cm-shell .flm-cm-workspace:has(.flm-live-match[data-cm4="1"]){
      grid-template-rows:minmax(0,1fr)!important;
    }
    .career-app.flm-cm-shell .flm-cm-workspace:has(.flm-live-match[data-cm4="1"]) > .career-header{
      display:none!important;
    }
    .career-app.flm-cm-shell .career-content:has(.flm-live-match[data-cm4="1"]){
      padding:6px!important;
      overflow:auto!important;
      background:#050a10!important;
    }
  `;
  document.head.appendChild(style);
}

function syncHalftimeBridge(){
  document.querySelectorAll('.flm-live-match[data-cm4="1"], [data-live-match][data-cm4="1"]').forEach(live => {
    const pause = live.querySelector('.cm4-shell [data-cm4-pause]');
    const resume = live.querySelector('[data-resume-second-half]');
    const clock = live.querySelector('.cm4-shell [data-cm4-clock]')?.textContent?.trim();
    if (!pause) return;
    const halftimeReady = Boolean(resume && !resume.disabled && (live.classList.contains('is-half-time') || clock === '45:00'));
    if (halftimeReady) {
      pause.textContent = 'Resume 2nd Half';
      pause.dataset.cm4Halftime = '1';
    } else {
      delete pause.dataset.cm4Halftime;
    }
  });
}

ensureModeStyle();
syncHalftimeBridge();

document.addEventListener('click',event => {
  const button = event.target.closest?.('[data-cm4-pause]');
  if (!button) return;
  const live = button.closest('.flm-live-match[data-cm4="1"], [data-live-match][data-cm4="1"]');
  const resume = live?.querySelector('[data-resume-second-half]');
  const clock = live?.querySelector('.cm4-shell [data-cm4-clock]')?.textContent?.trim();
  if (!live || !resume || resume.disabled || !(live.classList.contains('is-half-time') || clock === '45:00')) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  resume.click();
  requestAnimationFrame(syncHalftimeBridge);
},true);

new MutationObserver(syncHalftimeBridge).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','disabled'],characterData:true});
})();
/* ===== END CONSOLIDATED SOURCE: match-centre-v4-mode.js ===== */

/* ===== BEGIN CONSOLIDATED SOURCE: match-centre-v4-fold-v41.js ===== */
(() => {
'use strict';
const STYLE_HREF = './match-centre-v4-fold-v41.css?v=4.1.0';
let queued = false;

const clean = value => String(value || '').replace(/\s+/g,' ').trim();

function ensureStyles(){
  if ([...document.styleSheets].some(sheet => sheet.href?.includes('match-centre-v4-fold-v41.css'))) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = STYLE_HREF;
  document.head.appendChild(link);
}

function simplifyCommentary(raw){
  let text = clean(raw);
  if (!text) return '';

  text = text.replace(/^(.+?) finds space from\s+[A-Z]{1,4},\s*linking the play in the .+? role\.?$/i, '$1 finds space in midfield.');
  text = text.replace(/^(.+?) stops (.+?) with a foul\.?\s*Free kick\.?$/i, '$1 fouls $2. Free kick.');
  text = text.replace(/,\s*linking the play in the [^.]+ role\.?/i, '.');
  text = text.replace(/\s+in the (?:Central Midfielder|Defensive Midfielder|Attacking Midfielder|Advanced Playmaker|Box-to-Box Midfielder|Inside Forward|Winger|Full Back|Centre Back|Ball Playing Defender|Sweeper Keeper|Poacher|Target Forward|Complete Forward) role\.?/gi, '.');
  text = text.replace(/\s+operating in the [^.]+ role\.?/gi, '.');
  text = text.replace(/\s+as the [^.]+ role\.?/gi, '.');
  text = text.replace(/\s+from\s+(?:LCM|RCM|CM|DM|AM|AMC|AML|AMR|LW|RW|ST|CF|LB|RB|CB|GK)(?=[,\s])/gi, '');
  text = text.replace(/\s{2,}/g,' ').replace(/\.\s*\./g,'.').trim();

  if (text.length > 125) {
    const first = text.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim();
    if (first && first.length >= 28 && first.length <= 125) text = first;
  }
  return text;
}

function teamCode(name){
  const words = clean(name).toUpperCase().replace(/[^A-Z0-9 ]/g,'').split(/\s+/).filter(Boolean);
  if (!words.length) return 'TEAM';
  if (words.length >= 2 && words[0].length <= 3) return `${words[0]}${words[1][0] || ''}`.slice(0,3);
  return words[0].slice(0,3);
}

function parseColour(value){
  const text = clean(value);
  if (/^#[0-9a-f]{3}$/i.test(text)) return text.slice(1).split('').map(ch => parseInt(ch + ch,16));
  if (/^#[0-9a-f]{6}$/i.test(text)) return [1,3,5].map(index => parseInt(text.slice(index,index+2),16));
  const rgb = text.match(/rgba?\(\s*(\d+)\D+(\d+)\D+(\d+)/i);
  return rgb ? rgb.slice(1,4).map(Number) : null;
}

function coloursClash(live){
  const style = getComputedStyle(live);
  const home = parseColour(style.getPropertyValue('--home-color'));
  const away = parseColour(style.getPropertyValue('--away-color'));
  if (!home || !away) return false;
  const distance = Math.sqrt(home.reduce((sum,value,index) => sum + ((value - away[index]) ** 2),0));
  return distance < 105;
}

function syncEvent(shell){
  const event = shell.querySelector('[data-cm4-event]');
  const textNode = event?.querySelector('[data-cm4-event-text]');
  if (!event || !textNode) return;

  let text = clean(textNode.textContent);
  if (event.classList.contains('is-yellow')) text = 'YELLOW CARD!';
  else if (event.classList.contains('is-red')) text = 'RED CARD!';
  else text = simplifyCommentary(text);

  if (text && textNode.dataset.cm41Text !== text) textNode.dataset.cm41Text = text;
}

function syncPressure(live,shell){
  const copy = shell.querySelector('[data-cm4-pressure-copy]');
  const homeName = clean(shell.querySelector('[data-cm4-home-name]')?.textContent) || 'Home';
  const awayName = clean(shell.querySelector('[data-cm4-away-name]')?.textContent) || 'Away';
  const source = clean(copy?.textContent);
  const values = source.match(/(\d+)%\D+(\d+)%/);
  const home = Number(values?.[1] || 50);
  const away = Number(values?.[2] || Math.max(0,100-home));
  const label = `${teamCode(homeName)} ${home}% — ${away}% ${teamCode(awayName)}`;
  if (copy && copy.dataset.cm41Copy !== label) copy.dataset.cm41Copy = label;
  shell.dataset.cm41PressureClash = coloursClash(live) ? '1' : '0';
}

function enhance(live){
  const shell = live?.querySelector(':scope > .cm4-shell');
  if (!shell) return;
  shell.dataset.cm41 = '1';
  syncEvent(shell);
  syncPressure(live,shell);
}

function queue(){
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    document.querySelectorAll('.flm-live-match[data-cm4="1"]').forEach(enhance);
  });
}

ensureStyles();
queue();
new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true,characterData:true});

})();
/* ===== END CONSOLIDATED SOURCE: match-centre-v4-fold-v41.js ===== */

/* ===== BEGIN CONSOLIDATED SOURCE: match-centre-v4-mobile-v42.js ===== */
(() => {
'use strict';
const STYLE_HREF = './match-centre-v4-mobile-v42.css?v=4.2.0';
const liveState = new WeakMap();
const textDescriptor = Object.getOwnPropertyDescriptor(Node.prototype,'textContent');
const classDescriptor = Object.getOwnPropertyDescriptor(Element.prototype,'className');

function ensureStyles(){
  if ([...document.styleSheets].some(sheet => sheet.href?.includes('match-centre-v4-mobile-v42.css'))) return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href=STYLE_HREF;
  document.head.appendChild(link);
}

function patchText(node){
  if (!node || node.__cm42TextPatched || !textDescriptor?.get || !textDescriptor?.set) return;
  try {
    Object.defineProperty(node,'textContent',{
      configurable:true,
      get(){ return textDescriptor.get.call(this); },
      set(value){
        const next=String(value ?? '');
        if (textDescriptor.get.call(this) === next) return;
        textDescriptor.set.call(this,next);
      }
    });
    node.__cm42TextPatched=true;
  } catch (_) {}
}

function patchClass(node){
  if (!node || node.__cm42ClassPatched || !classDescriptor?.get || !classDescriptor?.set) return;
  try {
    Object.defineProperty(node,'className',{
      configurable:true,
      get(){ return classDescriptor.get.call(this); },
      set(value){
        const next=String(value ?? '');
        if (String(classDescriptor.get.call(this)) === next) return;
        classDescriptor.set.call(this,next);
      }
    });
    node.__cm42ClassPatched=true;
  } catch (_) {}
}

function patchHotNodes(live){
  const selectors=[
    '[data-cm4-home-name]','[data-cm4-away-name]','[data-cm4-home-score]','[data-cm4-away-score]',
    '[data-cm4-clock]','[data-cm4-half]','[data-cm4-minute]','[data-cm4-phase]','[data-cm4-date]',
    '[data-cm4-comp]','[data-cm4-event-minute]','[data-cm4-event-team]','[data-cm4-event-text]',
    '[data-cm4-pressure-copy]','[data-cm4-referee]','[data-cm4-attendance]','[data-cm4-weather]',
    '[data-cm4-pause]','[data-cm4-bottom-player]',
    '.flm-cm-v2-team','.flm-cm-v2-minute','.flm-cm-v2-text'
  ];
  live.querySelectorAll(selectors.join(',')).forEach(patchText);
  patchClass(live.querySelector('[data-cm4-event]'));
}

function minuteFromClock(clock){
  const value=Number(String(clock||'').split(':')[0]);
  return Number.isFinite(value)?value:0;
}

function activeNativeSpeed(live){
  for (const value of [4,2,1]) if (live.querySelector(`[data-match-speed="${value}"]`)?.classList.contains('is-active')) return value;
  return 0;
}

function stateFor(live){
  let state=liveState.get(live);
  if (!state){
    state={lastClock:'',lastAdvanceAt:performance.now(),lastSpeed:1,managerRequested:false,managerWasRunning:false,modalOpen:false};
    liveState.set(live,state);
  }
  return state;
}

function keepMatchAlive(live){
  const state=stateFor(live);
  const clock=live.querySelector('[data-live-clock]')?.textContent?.trim() || live.querySelector('[data-cm4-clock]')?.textContent?.trim() || '';
  const minute=minuteFromClock(clock);
  const now=performance.now();
  const modal=live.querySelector('[data-manager-modal]');
  const modalOpen=Boolean(modal?.classList.contains('is-open'));
  const halfTime=live.classList.contains('is-half-time') || clock==='45:00';
  const fullTime=live.classList.contains('is-full-time') || minute>=90;
  const paused=Boolean(live.querySelector('[data-match-speed="0"]')?.classList.contains('is-active'));
  const speed=activeNativeSpeed(live);

  if (speed) state.lastSpeed=speed;
  if (clock && clock!==state.lastClock){ state.lastClock=clock; state.lastAdvanceAt=now; }

  if (state.modalOpen && !modalOpen && state.managerRequested){
    if (state.managerWasRunning && !halfTime && !fullTime && paused){
      live.querySelector(`[data-match-speed="${state.lastSpeed || 1}"]`)?.click();
    }
    state.managerRequested=false;
  }
  state.modalOpen=modalOpen;

  if (modalOpen || halfTime || fullTime || paused) return;
  if (!clock || minute<=0) return;

  // A running interactive match should never sit on the same minute for several seconds.
  // Re-asserting the current speed safely clears accidental legacy pause races without
  // overriding a genuine user pause, which is represented by the native 0x control.
  if (now-state.lastAdvanceAt>3200){
    live.querySelector(`[data-match-speed="${state.lastSpeed || speed || 1}"]`)?.click();
    state.lastAdvanceAt=now;
  }
}

function enhance(live){
  if (!live?.isConnected || live.dataset.cm4!=='1') return;
  patchHotNodes(live);
  keepMatchAlive(live);
}

ensureStyles();

// Capture management intent before the native dialog pauses the engine so we know
// whether closing the dialog should restore live play.
document.addEventListener('click',event=>{
  const trigger=event.target.closest?.('[data-cm4-subs],[data-cm4-tactics]');
  if (!trigger) return;
  const live=trigger.closest('.flm-live-match[data-cm4="1"]');
  if (!live) return;
  const state=stateFor(live);
  state.managerRequested=true;
  state.managerWasRunning=!live.querySelector('[data-match-speed="0"]')?.classList.contains('is-active');
  state.lastSpeed=activeNativeSpeed(live)||state.lastSpeed||1;
},true);

// Polling is intentionally used here instead of another broad MutationObserver.
// It keeps the UI responsive on mobile and avoids observer feedback loops starving
// the match timer around the end of the first half.
setInterval(()=>document.querySelectorAll('.flm-live-match[data-cm4="1"]').forEach(enhance),180);

})();
/* ===== END CONSOLIDATED SOURCE: match-centre-v4-mobile-v42.js ===== */

/* ===== BEGIN CONSOLIDATED SOURCE: match-centre-v4-discipline-v44.js ===== */
(() => {
'use strict';
const STYLE_HREF = './match-centre-v4-discipline-v44.css?v=4.4.1';
const liveState = new WeakMap();

const clean = value => String(value || '').replace(/\s+/g,' ').trim();
const POSITION_LABELS = Object.freeze({
  DMC:'DM', AMC:'AM', MC:'CM', DC:'CB', DL:'LB', DR:'RB', AML:'LW', AMR:'RW',
  WBL:'LWB', WBR:'RWB', SC:'ST', FC:'ST'
});
const REFEREES = ['Daniel Mercer','Oliver Grant','Nathan Cole','Lewis Hart','Adam Fletcher','Samuel Price','James Whitmore','Michael Rowe'];
const WEATHER = ['Clear, 18°C','Dry, 20°C','Light cloud, 16°C','Overcast, 17°C','Light rain, 14°C','Clear, 15°C'];

function ensureStyles(){
  if ([...document.styleSheets].some(sheet => sheet.href?.includes('match-centre-v4-discipline-v44.css'))) return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href=STYLE_HREF;
  document.head.appendChild(link);
}

function stateFor(live){
  let state=liveState.get(live);
  if (!state){
    state={ftLatched:false,ftResult:'',major:null,metadataKey:'',lastRenderedKey:''};
    liveState.set(live,state);
  }
  return state;
}

function clockOf(live){
  return clean(live.querySelector('[data-live-clock]')?.textContent || live.querySelector('[data-cm4-clock]')?.textContent);
}

function scoreOf(shell){
  const home=clean(shell.querySelector('[data-cm4-home-name]')?.textContent)||'Home';
  const away=clean(shell.querySelector('[data-cm4-away-name]')?.textContent)||'Away';
  const hs=clean(shell.querySelector('[data-cm4-home-score]')?.textContent)||'0';
  const as=clean(shell.querySelector('[data-cm4-away-score]')?.textContent)||'0';
  return {home,away,hs,as,text:`${home} ${hs}–${as} ${away}`};
}

function isFullTime(live){
  const clock=clockOf(live);
  return live.classList.contains('is-full-time') || clock==='90:00';
}

function isHalfTime(live){
  return !isFullTime(live) && live.classList.contains('is-half-time');
}

function hash(input){
  let value=2166136261;
  for (const char of String(input||'')){ value^=char.charCodeAt(0); value=Math.imul(value,16777619); }
  return value>>>0;
}

function contextKey(shell){
  const score=scoreOf(shell);
  return `${window.__flmLiveStateV332?.fixtureId||''}|${score.home}|${score.away}|${window.FLMManager?.activeCareer?.currentDate||''}`;
}

function syncMetadata(shell){
  const state=stateFor(shell.closest('.flm-live-match'));
  const key=contextKey(shell);
  if (state.metadataKey===key) return;
  state.metadataKey=key;
  const seeded=hash(key);
  const referee=REFEREES[seeded%REFEREES.length];
  const weather=WEATHER[(seeded>>>3)%WEATHER.length];
  const refNode=shell.querySelector('[data-cm4-referee]');
  const weatherNode=shell.querySelector('[data-cm4-weather]');
  if (refNode) refNode.textContent=`Referee — ${referee}`;
  if (weatherNode) weatherNode.textContent=`Weather — ${weather}`;
}

function syncCompetition(shell){
  const career=window.FLMManager?.activeCareer;
  const comp=shell.querySelector('[data-cm4-comp]');
  if (!comp || !career) return;
  if (career.preseason?.phase && career.preseason.phase!=='complete') comp.textContent='Pre-Season Friendly';
}

function normalizePosition(value){
  const raw=clean(value).toUpperCase();
  return POSITION_LABELS[raw] || raw;
}

function normalizePositionLabels(dialog){
  dialog.querySelectorAll('.v2-sub-player .pos').forEach(node=>{
    const value=normalizePosition(node.textContent);
    if (node.textContent!==value) node.textContent=value;
  });
}

function syncSubs(live){
  const dialog=live.querySelector('.flm-match-dialog.v2-sub-dialog');
  if (!dialog) return;
  dialog.dataset.cm44='1';
  normalizePositionLabels(dialog);
  const help=dialog.querySelector('[data-v2-bench-help]');
  if (help && !dialog.querySelector('[data-v2-out-list] .is-selected-out')) help.textContent='Select a player off · bench shown alongside your XI';
  const apply=dialog.querySelector('[data-apply-sub]');
  if (apply && apply.textContent!=='CONFIRM SUBSTITUTION') apply.textContent='CONFIRM SUBSTITUTION';
}

function eventType(line,text){
  const normal=clean(text).toLowerCase();
  if (!line) return 'neutral';
  if (line.classList.contains('goal') || /\bgoal\b|scores for|finds the net/.test(normal)) return 'goal';
  if (line.classList.contains('red') || /red card|sent off/.test(normal)) return 'red';
  if (line.classList.contains('yellow') || /yellow card|booked/.test(normal)) return 'yellow';
  if (line.classList.contains('injury') || /injur|treatment|cannot continue/.test(normal)) return 'injury';
  if (line.classList.contains('substitution') || /comes on|replaces|takes over at/.test(normal)) return 'substitution';
  if (line.classList.contains('save') || /\bsave\b|saved by|shoots|shot|effort|header|post|crossbar/.test(normal)) return 'chance';
  return 'normal';
}

function lowValue(line,text){
  if (!line) return true;
  if (line.classList.contains('role') || line.classList.contains('role-change') || line.classList.contains('shape-change') || line.classList.contains('tactical')) return true;
  const value=clean(text);
  return /\b(?:LCB|RCB|LCM|RCM|DMC|AMC|AML|AMR)\b|\b(?:role|tactical plan|attacking instruction|defensive instruction|holds the shape as|normal position|exactly as instructed)\b/i.test(value)
    && !/goal|shot|save|foul|corner|free kick|card|injur|replaces|comes on/i.test(value);
}

function positionWords(code){
  const map={LW:'left wing',RW:'right wing',ST:'striker',CF:'striker',CM:'midfield',DM:'defensive midfield',AM:'attacking midfield',LB:'left-back',RB:'right-back',CB:'centre-back'};
  return map[normalizePosition(code)] || 'position';
}

function cleanCommentary(input){
  let text=clean(input);
  if (!text) return '';
  const rules=[
    [/^(.+?) finds space from\s+[A-Z]{1,4},\s*linking the play in the .+? role\.?$/i,'$1 finds space in midfield.'],
    [/^(.+?) reads the danger from\s+[A-Z]{1,4}\s+and holds the shape as a [^.]+\.?$/i,'$1 reads the danger.'],
    [/^(.+?) keeps stretching the defence as a [^.]+\.?$/i,'$1 stretches the defence.'],
    [/^(.+?) keeps pushing beyond (?:his|her) normal position, trying to turn the attacking instruction into an overload\.?$/i,'$1 pushes forward to overload the attack.'],
    [/^(.+?) stops (.+?) with a foul\.?\s*Free kick\.?$/i,'$1 fouls $2. Free kick.'],
    [/^(.+?) have a corner and the defenders come forward\.?$/i,'$1 win a corner.'],
    [/^(.+?) takes a touch and looks up\.?$/i,'$1 looks up.'],
    [/^(.+?) gets the shot away\.\.\.$/i,'$1 shoots...'],
    [/^(.+?) lets fly from the edge of the area\.\.\.$/i,'$1 shoots from range...']
  ];
  for (const [pattern,replacement] of rules){
    if (pattern.test(text)){ text=text.replace(pattern,replacement); break; }
  }
  const takeover=text.match(/^(.+?) takes over at\s+([A-Z]{2,4})\s+as\s+[^.]+\.?$/i);
  if (takeover) text=`${takeover[1]} comes on at ${positionWords(takeover[2])}.`;
  text=text
    .replace(/\s+from\s+(?:LCB|RCB|LCM|RCM|CM|DMC|DM|AMC|AM|AML|AMR|LW|RW|ST|CF|LB|RB|CB|GK)(?=[,\s])/gi,'')
    .replace(/\s+(?:in|as|operating in) the [A-Za-z -]+ role\b/gi,'')
    .replace(/\s+as a (?:Central Defender|Ball Playing Defender|Inside Forward|Winger|Poacher|Target Forward|Complete Forward|Advanced Playmaker|Box-to-Box Midfielder|Central Midfielder|Defensive Midfielder|Attacking Midfielder|Full Back|Sweeper Keeper)\b/gi,'')
    .replace(/\s+exactly as instructed/gi,'')
    .replace(/\s+as part of the tactical plan/gi,'')
    .replace(/\s{2,}/g,' ')
    .replace(/\.\s*\./g,'.')
    .trim();
  if (text.length>112){
    const first=text.match(/^(.{20,112}?[.!?])(?:\s|$)/)?.[1];
    if (first) text=first;
    else {
      const slice=text.slice(0,109); const cut=slice.lastIndexOf(' ');
      text=`${slice.slice(0,cut>70?cut:109).replace(/[,:;.-]+$/,'')}...`;
    }
  }
  return text;
}

function linePayload(line,shell){
  if (!line) return null;
  const raw=clean(line.querySelector('span')?.textContent || line.textContent);
  const type=eventType(line,raw);
  const side=line.dataset.cmSide==='away'?'away':line.dataset.cmSide==='home'?'home':'neutral';
  const score=scoreOf(shell);
  const minute=clean(line.querySelector('b')?.textContent) || "—";
  let text=cleanCommentary(raw);
  if (type==='yellow') text='YELLOW CARD!';
  if (type==='red') text='RED CARD!';
  return {key:`${minute}|${type}|${raw}`,minute,type,side,text,team:side==='home'?score.home:side==='away'?score.away:'MATCH UPDATE'};
}

function choosePayload(live,shell){
  const lines=[...live.querySelectorAll('[data-commentary-feed] .flm-commentary-line')];
  if (!lines.length) return null;
  const latest=lines.at(-1);
  const latestRaw=clean(latest.querySelector('span')?.textContent || latest.textContent);
  const latestType=eventType(latest,latestRaw);
  if (['goal','red','yellow','injury','substitution','chance'].includes(latestType)) return linePayload(latest,shell);
  const recent=lines.slice(-10).reverse().find(line=>{
    const raw=clean(line.querySelector('span')?.textContent || line.textContent);
    return !lowValue(line,raw);
  });
  return linePayload(recent || latest,shell);
}

function renderPayload(live,shell,payload){
  if (!payload || !payload.text) return;
  const state=stateFor(live);
  const now=performance.now();
  if (['goal','red','yellow','injury'].includes(payload.type) && state.major?.key!==payload.key){
    state.major={...payload,until:now+(payload.type==='goal'?2300:payload.type==='red'?1900:1600)};
  }
  const shown=state.major && state.major.until>now ? state.major : payload;
  if (state.major && state.major.until<=now) state.major=null;
  const key=`${shown.key}|${shown.text}`;
  state.lastRenderedKey=key;
  const event=shell.querySelector('[data-cm4-event]');
  const textNode=shell.querySelector('[data-cm4-event-text]');
  if (!event || !textNode) return;
  const desiredClass=`cm4-event is-${shown.type} is-${shown.side}`;
  if (event.dataset.cm44Type!==shown.type) event.dataset.cm44Type=shown.type;
  if (event.className!==desiredClass) event.className=desiredClass;
  const minute=shell.querySelector('[data-cm4-event-minute]');
  const team=shell.querySelector('[data-cm4-event-team]');
  if (minute && minute.textContent!==shown.minute) minute.textContent=shown.minute;
  if (team && team.textContent!==shown.team) team.textContent=shown.team;
  if (textNode.dataset.cm44Text!==shown.text) textNode.dataset.cm44Text=shown.text;
  if (textNode.getAttribute('aria-label')!==shown.text) textNode.setAttribute('aria-label',shown.text);
}

function ensureContinueButton(shell){
  let button=shell.querySelector('[data-cm44-continue]');
  if (!button){
    button=document.createElement('button');
    button.type='button';
    button.dataset.cm44Continue='1';
    button.className='cm44-continue-main';
    button.textContent='CONTINUE';
    shell.querySelector('[data-cm4-stage]')?.appendChild(button);
  }
  return button;
}

function lockHalfTime(live,shell){
  live.dataset.cm44State='halftime';
  const score=scoreOf(shell);
  const result=`HALF TIME · ${score.text}`;
  const phase=shell.querySelector('[data-cm4-phase]');
  const half=shell.querySelector('[data-cm4-half]');
  const pause=shell.querySelector('[data-cm4-pause]');
  const minute=shell.querySelector('[data-cm4-minute]');
  const event=shell.querySelector('[data-cm4-event]');
  const text=shell.querySelector('[data-cm4-event-text]');
  if (phase && phase.textContent!=='Half Time') phase.textContent='Half Time';
  if (half && half.textContent!=='HALF TIME') half.textContent='HALF TIME';
  if (minute && minute.textContent!=="45'") minute.textContent="45'";
  if (pause){
    if (pause.textContent!=='Resume 2nd Half') pause.textContent='Resume 2nd Half';
    if (pause.getAttribute('aria-label')!=='Resume Second Half') pause.setAttribute('aria-label','Resume Second Half');
  }
  if (event){
    const desired='cm4-event is-neutral cm44-halftime-event';
    if (event.className!==desired) event.className=desired;
  }
  const eventMinute=event?.querySelector('[data-cm4-event-minute]');
  const eventTeam=event?.querySelector('[data-cm4-event-team]');
  if (eventMinute && eventMinute.textContent!=="45'") eventMinute.textContent="45'";
  if (eventTeam && eventTeam.textContent!=='HALF TIME') eventTeam.textContent='HALF TIME';
  if (text){
    if (text.dataset.cm44Text!==result) text.dataset.cm44Text=result;
    if (text.getAttribute('aria-label')!==result) text.setAttribute('aria-label',result);
  }
}

function lockFullTime(live,shell){
  const state=stateFor(live);
  if (!state.ftLatched){ state.ftLatched=true; state.ftResult=`FULL TIME · ${scoreOf(shell).text}`; }
  live.dataset.cm44State='fulltime';
  live.dataset.cm44FullTime='1';
  const result=state.ftResult;
  const phase=shell.querySelector('[data-cm4-phase]');
  const half=shell.querySelector('[data-cm4-half]');
  const pause=shell.querySelector('[data-cm4-pause]');
  const minute=shell.querySelector('[data-cm4-minute]');
  const event=shell.querySelector('[data-cm4-event]');
  const text=shell.querySelector('[data-cm4-event-text]');
  if (phase && phase.textContent!=='Full Time') phase.textContent='Full Time';
  if (half && half.textContent!=='FULL TIME') half.textContent='FULL TIME';
  if (minute && minute.textContent!=="90'") minute.textContent="90'";
  if (pause){
    if (pause.textContent!=='Continue') pause.textContent='Continue';
    pause.disabled=false;
    if (pause.getAttribute('aria-label')!=='Continue') pause.setAttribute('aria-label','Continue');
  }
  if (event){
    const desired='cm4-event is-neutral cm44-fulltime-event';
    if (event.className!==desired) event.className=desired;
  }
  const eventMinute=event?.querySelector('[data-cm4-event-minute]');
  const eventTeam=event?.querySelector('[data-cm4-event-team]');
  if (eventMinute && eventMinute.textContent!=="90'") eventMinute.textContent="90'";
  if (eventTeam && eventTeam.textContent!=='FULL TIME') eventTeam.textContent='FULL TIME';
  if (text){
    if (text.dataset.cm44Text!==result) text.dataset.cm44Text=result;
    if (text.getAttribute('aria-label')!==result) text.setAttribute('aria-label',result);
  }
  const goal=shell.querySelector('[data-cm4-goal]');
  if (goal && !goal.classList.contains('cm44-suppressed')) goal.classList.add('cm44-suppressed');
  ensureContinueButton(shell);
}

function syncLiveState(live,shell){
  if (isFullTime(live)){ lockFullTime(live,shell); return; }
  if (isHalfTime(live)){ lockHalfTime(live,shell); return; }
  if (live.dataset.cm44State!=='live') live.dataset.cm44State='live';
  const continueButton=shell.querySelector('[data-cm44-continue]');
  if (continueButton) continueButton.remove();
  renderPayload(live,shell,choosePayload(live,shell));
}

function enhance(live){
  if (!live?.isConnected || live.dataset.cm4!=='1') return;
  const shell=live.querySelector(':scope > .cm4-shell');
  if (!shell) return;
  shell.dataset.cm44='1';
  syncCompetition(shell);
  syncMetadata(shell);
  syncSubs(live);
  syncLiveState(live,shell);
}

function finishMatch(live){
  const finish=live.querySelector('[data-finish-live-match]');
  if (finish) finish.click();
}

ensureStyles();

document.addEventListener('click',event=>{
  const button=event.target.closest?.('[data-cm44-continue],[data-cm4-pause]');
  if (!button) return;
  const live=button.closest('.flm-live-match[data-cm4="1"]');
  if (!live || !isFullTime(live)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  finishMatch(live);
},true);

// V4.4 deliberately avoids a document-wide MutationObserver. The match engine owns
// simulation state; this small poll only makes the V4 presentation authoritative.
setInterval(()=>document.querySelectorAll('.flm-live-match[data-cm4="1"]').forEach(enhance),100);

})();
/* ===== END CONSOLIDATED SOURCE: match-centre-v4-discipline-v44.js ===== */

/* ===== BEGIN CONSOLIDATED SOURCE: match-centre-v45.js ===== */
(() => {
'use strict';
const STYLE_HREF='./match-centre-v45.css?v=4.5.2';
const PRESEASON_DATES=['2026-07-11','2026-07-18','2026-07-25','2026-08-01','2026-08-08'];
const stateByLive=new WeakMap();
let dbPromise=null;
let launching=false;
let lastEntrySignature='';

const clean=value=>String(value||'').replace(/\s+/g,' ').trim();
const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const manager=()=>window.FLMManager;
const career=()=>manager()?.activeCareer||null;

function ensureStyles(){
  if(document.querySelector('link[data-cm45-style]'))return;
  const link=document.createElement('link');
  link.rel='stylesheet';link.href=STYLE_HREF;link.dataset.cm45Style='1';document.head.appendChild(link);
}
function database(){
  if(!dbPromise&&manager()?.loadDatabase)dbPromise=manager().loadDatabase().catch(()=>null);
  return dbPromise||Promise.resolve(null);
}
function stateFor(live){
  let state=stateByLive.get(live);
  if(!state){
    state={seenGoals:0,goalTimer:0,lastGoalKey:'',scorerSignature:'',competitionLabel:'',ftOverlayCleared:false};
    stateByLive.set(live,state);
  }
  return state;
}
function nextFriendly(c){return c?.preseason?.fixtures?.find(f=>!f.played)||null;}
function nextFriendlyDate(c){
  const played=c?.preseason?.fixtures?.filter(f=>f.played).length||0;
  return PRESEASON_DATES[Math.min(played,PRESEASON_DATES.length-1)]||null;
}
function nextLeagueFixture(c){
  const round=c?.fixtures?.[c?.roundIndex||0];
  if(!Array.isArray(round))return null;
  return round.find(f=>f.homeClubId===c.clubId||f.awayClubId===c.clubId)||round[0]||null;
}
function dateReady(current,target){return !target||String(current||'')>=String(target);}
function clubName(db,id){const club=db?.clubs?.find(item=>item.id===id);return club?.shortName||club?.name||'Unknown';}
function currentGoals(){return (window.__flmLiveStateV332?.events||[]).filter(event=>event.type==='goal');}
function playerName(db,id){return db?.players?.find(player=>player.id===id)?.name||'Unknown scorer';}
function goalMinute(goal){
  const minute=Math.max(1,Math.round(Number(goal?.minute)||0));
  const flag=goal?.isOwnGoal||goal?.ownGoal?' OG':goal?.isPenalty||goal?.penalty?' P':'';
  return `${minute}'${flag}`;
}
function goalSignature(goals,snapshot){
  return `${snapshot?.homeClubId||''}|${snapshot?.awayClubId||''}|${goals.map(goal=>[
    goal.minute,goal.clubId,goal.playerId,goal.assistPlayerId,Boolean(goal.isPenalty||goal.penalty),Boolean(goal.isOwnGoal||goal.ownGoal)
  ].join(':')).join('|')}`;
}
function setText(node,value){if(node&&node.textContent!==value)node.textContent=value;}
function setData(node,key,value){if(node&&node.dataset[key]!==String(value))node.dataset[key]=String(value);}
function setAttr(node,key,value){if(node&&node.getAttribute(key)!==String(value))node.setAttribute(key,String(value));}

function pollFor(selector,{timeout=5000,interval=35,ready=()=>true}={}){
  return new Promise(resolve=>{
    const started=performance.now();
    const tick=()=>{
      const node=document.querySelector(selector);
      if(node&&ready(node))return resolve(node);
      if(performance.now()-started>=timeout)return resolve(null);
      setTimeout(tick,interval);
    };
    tick();
  });
}
function continueWorld(){
  const button=document.querySelector('.career-header [data-v060-continue]')||document.querySelector('.career-content [data-v060-continue]');
  if(button&&!button.disabled)button.click();
}
async function startFriendlyDirect(){
  if(launching||document.querySelector('[data-live-match]'))return;
  launching=true;
  try{
    let play=document.querySelector('[data-v047-play]');
    if(!play||play.disabled){
      const tab=document.querySelector('.career-nav [data-v047-preseason-tab]');
      if(tab&&!tab.disabled)tab.click();
      play=await pollFor('[data-v047-play]',{ready:node=>!node.disabled});
    }
    if(play&&!play.disabled)play.click();
  }finally{setTimeout(()=>{launching=false;},250);}
}
async function startCompetitiveDirect(){
  if(launching||document.querySelector('[data-live-match]'))return;
  launching=true;
  try{
    const tab=document.querySelector('.career-nav [data-career-tab="matchday"]');
    if(tab&&!tab.disabled)tab.click();
    const play=await pollFor('[data-play-match]',{timeout:3500});
    if(play&&!play.disabled)play.click();
  }finally{setTimeout(()=>{launching=false;},250);}
}

function syncEntryRoutes(db){
  const c=career();
  if(!c||document.querySelector('[data-live-match]'))return;
  const friendly=c.preseason&&c.preseason.phase!=='complete'?nextFriendly(c):null;
  const friendlyDate=friendly?nextFriendlyDate(c):null;
  const league=(!c.preseason||c.preseason.phase==='complete')?nextLeagueFixture(c):null;
  const signature=[c.currentDate,c.preseason?.phase,friendly?.id,friendly?.played,friendlyDate,league?.round,league?.date,c.roundIndex].join('|');
  if(signature===lastEntrySignature)return;
  lastEntrySignature=signature;

  const shellContinue=document.querySelector('[data-shell-continue]');
  const shellLabel=document.querySelector('[data-shell-continue-label]');
  const shellDetail=document.querySelector('[data-shell-continue-detail]');
  if(shellContinue)delete shellContinue.dataset.cm45Direct;

  if(c.preseason&&c.preseason.phase!=='complete'){
    const ready=Boolean(friendly)&&dateReady(c.currentDate,friendlyDate);
    if(friendly&&shellContinue?.dataset.shellAction==='preseason'){
      if(ready){
        setText(shellLabel,'PLAY FRIENDLY');
        setText(shellDetail,`${clubName(db,friendly.homeClubId)} vs ${clubName(db,friendly.awayClubId)}`);
        shellContinue.dataset.cm45Direct='friendly';
      }else{
        setText(shellLabel,'CONTINUE GAME');
        setText(shellDetail,friendlyDate?`Advance to ${friendlyDate.split('-').reverse().slice(0,2).join('/')}`:'Advance calendar');
        shellContinue.dataset.cm45Direct='calendar';
      }
      setText(document.querySelector('[data-shell-fixture-teams]'),`${clubName(db,friendly.homeClubId)} vs ${clubName(db,friendly.awayClubId)}`);
      setText(document.querySelector('[data-shell-fixture-meta]'),`${friendly.dateLabel||friendlyDate||'Pre-season'} · FRIENDLY`);
    }
  }else{
    const ready=Boolean(league)&&dateReady(c.currentDate,league?.date);
    if(shellContinue?.dataset.shellAction==='matchday'){
      if(ready){setText(shellLabel,'PLAY MATCH');shellContinue.dataset.cm45Direct='competitive';}
      else{
        setText(shellLabel,'CONTINUE GAME');
        setText(shellDetail,league?.date?`Advance to ${league.date}`:'Advance calendar');
        shellContinue.dataset.cm45Direct='calendar';
      }
    }
    document.querySelectorAll('.career-next-match [data-career-tab="matchday"]').forEach(button=>{
      setText(button,ready?'PLAY MATCH':'GO TO MATCHDAY');
      if(ready)button.dataset.cm45DirectMatch='1';else delete button.dataset.cm45DirectMatch;
    });
  }
}

function ensureScorers(shell){
  const stage=shell.querySelector('[data-cm4-stage]');
  if(!stage)return null;
  let panel=stage.querySelector('[data-cm45-scorers]');
  if(panel)return panel;
  panel=document.createElement('div');
  panel.className='cm45-scorers';panel.dataset.cm45Scorers='1';panel.setAttribute('aria-hidden','true');
  panel.innerHTML='<section class="home"><div data-cm45-home-goals></div></section><section class="away"><div data-cm45-away-goals></div></section>';
  stage.prepend(panel);
  return panel;
}
function aggregateGoals(goals,clubId,db){
  const grouped=new Map();
  for(const goal of goals.filter(item=>item.clubId===clubId)){
    const key=goal.playerId||`unknown-${goal.minute}`;
    const item=grouped.get(key)||{name:playerName(db,goal.playerId),minutes:[]};
    item.minutes.push(goalMinute(goal));grouped.set(key,item);
  }
  return [...grouped.values()];
}
function renderGoalRows(items){
  if(!items.length)return '';
  return items.map(item=>`<div class="cm45-scorer-row"><strong>${esc(item.name)}</strong><span>${esc(item.minutes.join(', '))}</span></div>`).join('');
}
function syncScorers(live,shell,db){
  const panel=ensureScorers(shell);if(!panel)return;
  const state=stateFor(live);
  const snapshot=window.__flmLiveStateV332;
  const goals=currentGoals();
  const signature=goalSignature(goals,snapshot);
  if(signature===state.scorerSignature)return;
  state.scorerSignature=signature;

  const home=aggregateGoals(goals,snapshot?.homeClubId,db);
  const away=aggregateGoals(goals,snapshot?.awayClubId,db);
  const homeNode=panel.querySelector('[data-cm45-home-goals]');
  const awayNode=panel.querySelector('[data-cm45-away-goals]');
  const homeHtml=renderGoalRows(home);const awayHtml=renderGoalRows(away);
  if(homeNode&&homeNode.innerHTML!==homeHtml)homeNode.innerHTML=homeHtml;
  if(awayNode&&awayNode.innerHTML!==awayHtml)awayNode.innerHTML=awayHtml;
  const visible=home.length+away.length>0;
  setAttr(panel,'aria-hidden',String(!visible));
  panel.classList.toggle('is-visible',visible);
  setAttr(shell.querySelector('[data-cm4-stage]'),'data-cm45-has-scorers',visible?'1':'0');
  setData(shell,'cm45GoalCount',goals.length);
}

function ensureGoalOverlay(shell){
  const stage=shell.querySelector('[data-cm4-stage]');if(!stage)return null;
  let overlay=stage.querySelector('[data-cm45-goal-overlay]');
  if(!overlay){overlay=document.createElement('div');overlay.className='cm45-goal-overlay';overlay.dataset.cm45GoalOverlay='1';stage.appendChild(overlay);}
  return overlay;
}
function scoreFromGoals(goals,snapshot){
  let home=0,away=0;
  for(const goal of goals){if(goal.clubId===snapshot?.homeClubId)home+=1;else if(goal.clubId===snapshot?.awayClubId)away+=1;}
  return{home,away};
}
function playGoalMoment(live,shell,goal,db){
  if(live.dataset.cm44State==='fulltime')return;
  const state=stateFor(live);const host=ensureGoalOverlay(shell);if(!host)return;
  clearTimeout(state.goalTimer);
  const snapshot=window.__flmLiveStateV332;const goals=currentGoals();const score=scoreFromGoals(goals,snapshot);
  const homeName=clean(shell.querySelector('[data-cm4-home-name]')?.textContent)||'Home';
  const awayName=clean(shell.querySelector('[data-cm4-away-name]')?.textContent)||'Away';
  const homeGoal=goal.clubId===snapshot?.homeClubId;const team=homeGoal?homeName:awayName;
  const scorer=playerName(db,goal.playerId);const assist=playerName(db,goal.assistPlayerId);
  const minute=goalMinute(goal);const scoreText=`${homeName} ${score.home}–${score.away} ${awayName}`;
  const frames=[
    `<div class="cm45-goal-card announce"><strong>GOAL FOR ${esc(team).toUpperCase()}!</strong></div>`,
    `<div class="cm45-goal-card scorer"><small>${esc(minute)}</small><strong>${esc(scorer)} SCORES!</strong></div>`,
    `<div class="cm45-goal-card result"><strong>${esc(scoreText)}</strong>${goal.assistPlayerId?`<span>Assist: ${esc(assist)}</span>`:''}<small>${esc(minute)}</small></div>`
  ];
  host.className=`cm45-goal-overlay is-visible ${homeGoal?'home':'away'}`;
  let index=0;
  const show=()=>{
    host.innerHTML=frames[index++];
    if(index<frames.length)state.goalTimer=setTimeout(show,index===1?600:850);
    else state.goalTimer=setTimeout(()=>{host.className='cm45-goal-overlay';host.innerHTML='';},950);
  };
  show();
}
function syncGoalMoment(live,shell,db){
  const state=stateFor(live);const goals=currentGoals();
  if(goals.length<=state.seenGoals)return;
  const goal=goals.at(-1);state.seenGoals=goals.length;
  const key=`${goal?.minute}|${goal?.clubId}|${goal?.playerId}|${goals.length}`;
  if(key===state.lastGoalKey)return;state.lastGoalKey=key;
  playGoalMoment(live,shell,goal,db);
}

function syncCompetition(live,shell){
  const node=shell.querySelector('[data-cm4-comp]');if(!node)return;
  const state=stateFor(live);const c=career();
  let label='League Match';
  if(c?.preseason&&c.preseason.phase!=='complete')label='Pre-Season Friendly';
  else label=c?.competitionName||clean(node.textContent)||'League Match';
  if(label===state.competitionLabel)return;
  state.competitionLabel=label;setData(node,'cm45Label',label);
}
function syncLive(live,db){
  const shell=live.querySelector(':scope > .cm4-shell');if(!shell)return;
  if(shell.dataset.cm45!=='1')shell.dataset.cm45='1';
  syncCompetition(live,shell);syncScorers(live,shell,db);syncGoalMoment(live,shell,db);
  const state=stateFor(live);
  if(live.dataset.cm44State==='fulltime'&&!state.ftOverlayCleared){
    state.ftOverlayCleared=true;
    const overlay=shell.querySelector('[data-cm45-goal-overlay]');
    if(overlay){clearTimeout(state.goalTimer);overlay.className='cm45-goal-overlay';overlay.innerHTML='';}
  }
}

async function syncAll(){
  ensureStyles();const db=await database();
  if(document.querySelector('.flm-live-match[data-cm4="1"]')){
    document.querySelectorAll('.flm-live-match[data-cm4="1"]').forEach(live=>syncLive(live,db));
  }else syncEntryRoutes(db);
}

document.addEventListener('click',event=>{
  const control=event.target.closest?.('[data-shell-continue],[data-v060-continue],[data-cm45-direct-match],.career-next-match [data-career-tab="matchday"]');
  if(!control)return;
  const c=career();
  const friendlyReady=Boolean(c?.preseason&&c.preseason.phase!=='complete'&&nextFriendly(c)&&dateReady(c.currentDate,nextFriendlyDate(c)));
  const fixture=(!c?.preseason||c.preseason.phase==='complete')?nextLeagueFixture(c):null;
  const competitiveReady=Boolean(fixture&&dateReady(c?.currentDate,fixture.date));

  if(control.matches('[data-v060-continue]')){
    if(friendlyReady){event.preventDefault();event.stopImmediatePropagation();startFriendlyDirect();}
    else if(competitiveReady){event.preventDefault();event.stopImmediatePropagation();startCompetitiveDirect();}
    return;
  }
  if(control.matches('[data-shell-continue]')){
    if(control.dataset.cm45Direct==='calendar'){
      event.preventDefault();event.stopImmediatePropagation();continueWorld();
    }else if(control.dataset.cm45Direct==='friendly'||(control.dataset.shellAction==='preseason'&&friendlyReady)){
      event.preventDefault();event.stopImmediatePropagation();startFriendlyDirect();
    }else if(control.dataset.cm45Direct==='competitive'||(control.dataset.shellAction==='matchday'&&competitiveReady)){
      event.preventDefault();event.stopImmediatePropagation();startCompetitiveDirect();
    }
    return;
  }
  if(control.closest('.career-next-match')&&competitiveReady){
    event.preventDefault();event.stopImmediatePropagation();startCompetitiveDirect();
  }
},true);

ensureStyles();
setInterval(()=>syncAll().catch(()=>{}),250);
syncAll();

})();
/* ===== END CONSOLIDATED SOURCE: match-centre-v45.js ===== */

/* ===== BEGIN CONSOLIDATED SOURCE: match-centre-v46-lock.js ===== */
(() => {
'use strict';
const VERSION='4.6.2';
const STYLE_HREF=`./match-centre-v46-lock.css?v=${VERSION}`;
let queued=false;
let dbPromise=null;
let nameIndex=null;
let playersBySurname=null;

const manager=()=>window.FLMManager;
const career=()=>manager()?.activeCareer||null;
const clean=value=>String(value||'').replace(/\s+/g,' ').trim();
const norm=value=>clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

function ensureStyles(){
  if(document.querySelector('link[data-cm46-style]'))return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href=STYLE_HREF;
  link.dataset.cm46Style=VERSION;
  document.head.appendChild(link);
}
function database(){
  if(!dbPromise&&manager()?.loadDatabase)dbPromise=Promise.resolve(manager().loadDatabase()).catch(()=>null);
  return dbPromise||Promise.resolve(null);
}
function setText(node,value){if(node&&node.textContent!==value)node.textContent=value;}
function visible(node){return Boolean(node&&node.isConnected&&getComputedStyle(node).display!=='none'&&getComputedStyle(node).visibility!=='hidden');}

function buildNameIndex(db){
  if(nameIndex||!db?.players)return nameIndex;
  nameIndex=new Map();
  playersBySurname=new Map();
  for(const player of db.players){
    const key=norm(player.name);
    if(key&&!nameIndex.has(key))nameIndex.set(key,player);
    const parts=key.split(' ').filter(Boolean);
    const surname=parts.at(-1);
    if(surname){
      const list=playersBySurname.get(surname)||[];
      list.push(player);
      playersBySurname.set(surname,list);
      if(parts.length>1){
        const short=`${parts[0][0]} ${surname}`;
        if(!nameIndex.has(short))nameIndex.set(short,player);
      }
    }
  }
  return nameIndex;
}
function playerForName(db,name){
  const index=buildNameIndex(db);
  const key=norm(name);
  const direct=index?.get(key);
  if(direct)return direct;
  const parts=key.split(' ').filter(Boolean);
  const surname=parts.at(-1);
  const candidates=playersBySurname?.get(surname)||[];
  if(candidates.length===1)return candidates[0];
  if(parts.length>1){
    const initial=parts[0][0];
    return candidates.find(player=>norm(player.name).split(' ')[0]?.startsWith(initial))||null;
  }
  return null;
}

function syncScorerPresentation(shell){
  const panel=shell?.querySelector('[data-cm45-scorers]');
  if(!panel)return;
  panel.dataset.cm46='1';
  panel.querySelectorAll('.cm45-scorer-row').forEach(row=>{
    row.classList.add('cm46-scorer-row');
    const name=clean(row.querySelector('strong')?.textContent);
    const minute=clean(row.querySelector('span')?.textContent);
    if(name&&minute)row.setAttribute('aria-label',`${name} ${minute}`);
  });
}

function syncRoutineEventScale(shell){
  const event=shell?.querySelector('.cm4-event');
  if(!event)return;
  const type=event.dataset.cm44Type||'';
  const major=['goal','yellow','red','injury'].includes(type)||event.classList.contains('is-yellow')||event.classList.contains('is-red')||event.classList.contains('is-injury');
  event.dataset.cm46Major=major?'1':'0';
}

function currentFriendly(c){return c?.preseason?.fixtures?.find(fixture=>!fixture.played)||null;}
function clubName(db,id){const club=db?.clubs?.find(item=>item.id===id);return club?.shortName||club?.name||'Unknown';}
function syncSidebarFixture(db){
  const c=career();
  if(!c||document.querySelector('[data-live-match]')||!c.preseason||c.preseason.phase==='complete')return;
  const friendly=currentFriendly(c);
  if(!friendly)return;
  setText(document.querySelector('[data-shell-fixture-teams]'),`${clubName(db,friendly.homeClubId)} vs ${clubName(db,friendly.awayClubId)}`);
  setText(document.querySelector('[data-shell-fixture-meta]'),`${friendly.dateLabel||'Pre-season'} · FRIENDLY`);
}

function syncPreseasonCTA(){
  const play=document.querySelector('[data-v047-play]');
  const actions=play?.closest('.v047-actions');
  if(!play||!actions)return;
  const shellButton=document.querySelector('[data-shell-continue]');
  const shellLabel=clean(document.querySelector('[data-shell-continue-label]')?.textContent).toUpperCase();
  const shouldHide=visible(shellButton)&&shellLabel==='PLAY FRIENDLY';
  if(shouldHide){
    play.dataset.cm46Hidden='1';
    play.hidden=true;
    play.setAttribute('aria-hidden','true');
    play.tabIndex=-1;
    actions.dataset.cm46ShellPlay='1';
    let note=actions.querySelector('[data-cm46-ready-note]');
    if(!note){
      note=document.createElement('div');
      note.className='cm46-ready-note';
      note.dataset.cm46ReadyNote='1';
      note.textContent='READY TO PLAY · Use the highlighted PLAY FRIENDLY control';
      actions.prepend(note);
    }
  }else if(play.dataset.cm46Hidden==='1'){
    play.hidden=false;
    play.removeAttribute('aria-hidden');
    play.removeAttribute('tabindex');
    delete play.dataset.cm46Hidden;
    delete actions.dataset.cm46ShellPlay;
    actions.querySelector('[data-cm46-ready-note]')?.remove();
  }
}

function scoreContext(){
  const shell=document.querySelector('.cm4-shell');
  if(!shell)return '';
  const home=clean(shell.querySelector('[data-cm4-home-name]')?.textContent);
  const away=clean(shell.querySelector('[data-cm4-away-name]')?.textContent);
  const scores=[...shell.querySelectorAll('.cm4-scorebox')].map(node=>clean(node.textContent));
  const minute=clean(shell.querySelector('[data-cm4-clock]')?.textContent);
  if(!home||!away)return minute;
  return `${home} ${scores[0]||'0'}–${scores[1]||'0'} ${away}${minute?` · ${minute}`:''}`;
}
function ensureManagerContext(dialog){
  const head=dialog.querySelector('.flm-dialog-head');
  if(!head)return;
  let node=dialog.querySelector('[data-cm46-manager-context]');
  if(!node){
    node=document.createElement('div');
    node.className='cm46-manager-context';
    node.dataset.cm46ManagerContext='1';
    head.after(node);
  }
  setText(node,scoreContext());
}
function clearManagerContext(dialog){
  delete dialog.dataset.cm46Dialog;
  dialog.querySelector('[data-cm46-manager-context]')?.remove();
}
function cardForPlayer(snapshot,id){
  if(!id)return '';
  const events=snapshot?.events||[];
  if(events.some(event=>event.playerId===id&&event.type==='red'))return 'RC';
  if(events.some(event=>event.playerId===id&&event.type==='yellow'))return 'YC';
  return '';
}
function annotateSubRows(dialog,db){
  const snapshot=window.__flmLiveStateV332;
  dialog.querySelectorAll('.v2-sub-player').forEach(row=>{
    const name=clean(row.querySelector('strong')?.textContent);
    const player=playerForName(db,name);
    if(player)row.dataset.cm46PlayerId=player.id;
    let rating=row.querySelector('.cm46-rating');
    if(!rating){rating=document.createElement('span');rating.className='cm46-rating';row.appendChild(rating);}
    const value=player&&snapshot?.ratings?.[player.id];
    setText(rating,Number.isFinite(Number(value))?Number(value).toFixed(1):'—');
    let card=row.querySelector('.cm46-card');
    const cardText=player?cardForPlayer(snapshot,player.id):'';
    if(cardText){
      if(!card){card=document.createElement('span');card.className='cm46-card';row.appendChild(card);}
      card.className=`cm46-card ${cardText==='RC'?'red':'yellow'}`;
      setText(card,cardText);
    }else card?.remove();
  });
}
function syncDialog(db){
  const modal=document.querySelector('[data-manager-modal].is-open');
  const dialog=modal?.querySelector('[data-manager-dialog]');
  if(!dialog)return;
  if(dialog.classList.contains('v2-sub-dialog')){
    dialog.dataset.cm46Dialog='subs';
    ensureManagerContext(dialog);
    annotateSubRows(dialog,db);
  }else if(dialog.querySelector('[data-live-tactic]')){
    dialog.dataset.cm46Dialog='tactics';
    ensureManagerContext(dialog);
  }else if(dialog.dataset.cm46Dialog){
    clearManagerContext(dialog);
  }
}

async function sync(){
  ensureStyles();
  const db=await database();
  const shell=document.querySelector('.cm4-shell');
  if(shell){
    shell.dataset.cm46='1';
    syncScorerPresentation(shell);
    syncRoutineEventScale(shell);
  }else{
    syncSidebarFixture(db);
    syncPreseasonCTA();
  }
  syncDialog(db);
}
function queue(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;sync();});
}

ensureStyles();
new MutationObserver(queue).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','aria-hidden','data-cm44-type']});
setInterval(queue,700);
queue();
window.FLMMatchCentreV46=Object.freeze({version:VERSION,refresh:queue});

})();
/* ===== END CONSOLIDATED SOURCE: match-centre-v46-lock.js ===== */

