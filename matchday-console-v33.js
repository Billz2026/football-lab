const STYLE_HREF = './matchday-console-v33.css?v=3.3.0';
let queued = false;
let databasePromise = null;
const stateByLive = new WeakMap();

const esc = value => String(value ?? '')
  .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
  .replaceAll('"','&quot;').replaceAll("'",'&#039;');
const clean = value => String(value || '').replace(/\s+/g,' ').trim();
const keyName = value => clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').trim();

function ensureStyles(){
  if ([...document.styleSheets].some(sheet => sheet.href?.includes('matchday-console-v33.css'))) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = STYLE_HREF;
  document.head.appendChild(link);
}

function getState(live){
  let state = stateByLive.get(live);
  if (!state) {
    state = { ratings:new Map(), lastCapture:0, goalKey:'', renderSig:'' };
    stateByLive.set(live,state);
  }
  return state;
}

function db(){
  if (!databasePromise) databasePromise = Promise.resolve(window.FLMManager?.loadDatabase?.()).catch(() => null);
  return databasePromise;
}

function clubForName(database,name){
  const target = keyName(name);
  if (!database || !target) return null;
  return database.clubs?.find(club => [club.name,club.shortName,club.providerName].filter(Boolean).some(value => keyName(value) === target))
    || database.clubs?.find(club => [club.name,club.shortName,club.providerName].filter(Boolean).some(value => {
      const candidate = keyName(value); return candidate && (candidate.includes(target) || target.includes(candidate));
    })) || null;
}

function nativeViewButton(live,view){
  if (view === 'zones') return live.querySelector('[data-cm31-view="zones"]');
  if (view === 'ratings') return live.querySelector('[data-cm32-view="ratings"]');
  return live.querySelector(`[data-cm-v2-view="${view}"]`);
}

function selectView(live,view){
  const button = nativeViewButton(live,view);
  if (button) button.click();
  else live.dataset.cmView = view;
  queue();
}

function ensureConsole(live){
  let console = live.querySelector('.cm33-console');
  if (console) return console;
  const grid = live.querySelector('.flm-live-grid');
  if (!grid) return null;

  console = document.createElement('section');
  console.className = 'cm33-console';
  console.innerHTML = `
    <aside class="cm33-rail" aria-label="Match controls">
      <div class="cm33-rail-section">
        <small>MATCH</small>
        <button type="button" data-cm33-view="overview">Overview</button>
        <button type="button" data-cm33-view="stats">Stats</button>
        <button type="button" data-cm33-view="zones">Action Zones</button>
        <button type="button" data-cm33-view="ratings">Player Ratings</button>
        <button type="button" data-cm33-view="report">Match Report</button>
      </div>
      <div class="cm33-rail-section cm33-management">
        <small>MANAGE</small>
        <button type="button" data-cm33-subs>Make Sub</button>
        <button type="button" data-cm33-tactics>Tactics</button>
      </div>
      <div class="cm33-rail-section cm33-speed">
        <small>SPEED</small>
        <button type="button" data-cm33-speed="0">Pause</button>
        <div><button type="button" data-cm33-speed="1">1×</button><button type="button" data-cm33-speed="2">2×</button><button type="button" data-cm33-speed="4">4×</button></div>
      </div>
    </aside>
    <div class="cm33-centre">
      <header class="cm33-section-head"><div><small>LIVE MATCH</small><strong>COMMENTARY</strong></div><b data-cm33-phase>LIVE</b></header>
      <div class="cm33-latest" data-cm33-latest><b>0'</b><span>Waiting for kick-off...</span></div>
      <div class="cm33-feed" data-cm33-feed></div>
    </div>
    <aside class="cm33-insights">
      <header class="cm33-section-head"><div><small>LIVE</small><strong>MATCH INFO</strong></div></header>
      <div class="cm33-pressure"><div><span>LAST 5 MINS</span><strong data-cm33-pressure-copy>50% · 50%</strong></div><div class="cm33-pressure-track"><i class="home" data-cm33-pressure-home></i><i class="away" data-cm33-pressure-away></i></div></div>
      <div class="cm33-quickstats" data-cm33-quickstats></div>
      <div class="cm33-top"><div class="cm33-top-head"><span>TOP PERFORMERS</span><small>LIVE RATING</small></div><div data-cm33-top-list></div></div>
    </aside>
    <div class="cm33-goal" data-cm33-goal aria-live="assertive"></div>`;
  grid.before(console);

  console.querySelectorAll('[data-cm33-view]').forEach(button => button.addEventListener('click', () => selectView(live,button.dataset.cm33View)));
  console.querySelector('[data-cm33-subs]')?.addEventListener('click', () => live.querySelector('[data-open-subs]')?.click());
  console.querySelector('[data-cm33-tactics]')?.addEventListener('click', () => live.querySelector('[data-open-tactics]')?.click());
  console.querySelectorAll('[data-cm33-speed]').forEach(button => button.addEventListener('click', () => {
    live.querySelector(`[data-match-speed="${button.dataset.cm33Speed}"]`)?.click();
    queue();
  }));
  return console;
}

function ensureRatings(live){
  let panel = live.querySelector('.cm33-ratings-panel');
  if (panel) return panel;
  const grid = live.querySelector('.flm-live-grid');
  if (!grid) return null;
  panel = document.createElement('section');
  panel.className = 'cm33-ratings-panel';
  panel.innerHTML = `
    <header class="cm33-ratings-head"><div><small>LIVE PERFORMANCE</small><h3>PLAYER RATINGS</h3></div><span>Ratings change with match events</span></header>
    <div class="cm33-rating-head"><span>NO.</span><span>PLAYER</span><span>POS</span><span>CON</span><span>G</span><span>A</span><span>RATING</span></div>
    <div class="cm33-rating-list" data-cm33-rating-list></div>`;
  grid.appendChild(panel);
  return panel;
}

function rowText(row){
  return {
    name: clean(row.querySelector('strong')?.textContent),
    position: clean(row.children[0]?.textContent),
    condition: Number(([...row.querySelectorAll('small')].map(node => node.textContent || '').find(value => /CON/i.test(value)) || '').replace(/[^0-9.]/g,'')) || 100,
    rating: Number(row.querySelector('b')?.textContent) || 6.5
  };
}

function captureRatings(live){
  if (live.dataset.cmView !== 'overview') return;
  const state = getState(live);
  const now = Date.now();
  if (now - state.lastCapture < 750 || live.dataset.cm33Capturing === '1') return;
  const modal = live.querySelector('[data-manager-modal]');
  const trigger = live.querySelector('[data-open-ratings]');
  if (!modal || modal.classList.contains('is-open') || !trigger || trigger.disabled) return;
  state.lastCapture = now;
  live.dataset.cm33Capturing = '1';
  live.classList.add('cm33-capturing');
  try {
    trigger.click();
    const dialog = live.querySelector('[data-manager-dialog]');
    const rows = [...dialog?.querySelectorAll('.flm-player-live-row') || []];
    const active = new Set();
    rows.forEach((row,index) => {
      const item = rowText(row);
      if (!item.name) return;
      const key = keyName(item.name);
      active.add(key);
      const prior = state.ratings.get(key) || {};
      state.ratings.set(key,{...prior,...item,active:true,order:prior.order ?? index});
    });
    for (const [key,item] of state.ratings) item.active = active.has(key);
    dialog?.querySelector('[data-close-manager]')?.click();
  } finally {
    live.classList.remove('cm33-capturing');
    delete live.dataset.cm33Capturing;
  }
}

function eventType(line){
  return ['goal','red','yellow','injury','save','miss','corner','substitution','tactical','role-change','shape-change'].find(type => line.classList.contains(type)) || 'commentary';
}

function syncFeed(live,console){
  const source = [...live.querySelectorAll('[data-commentary-feed] .flm-commentary-line')];
  const recent = source.slice(-11);
  const signature = recent.map(line => `${clean(line.querySelector('b')?.textContent)}|${clean(line.querySelector('span')?.textContent)}|${eventType(line)}|${line.dataset.cmSide || ''}`).join('||');
  const feed = console.querySelector('[data-cm33-feed]');
  if (feed.dataset.signature !== signature) {
    feed.dataset.signature = signature;
    feed.innerHTML = recent.length ? recent.map((line,index) => {
      const minute = clean(line.querySelector('b')?.textContent) || '—';
      const text = clean(line.querySelector('span')?.textContent) || clean(line.textContent);
      const type = eventType(line);
      const side = line.dataset.cmSide === 'away' ? 'away' : line.dataset.cmSide === 'home' ? 'home' : 'neutral';
      return `<div class="cm33-line ${type} ${side} ${index === recent.length - 1 ? 'is-current' : ''}"><b>${esc(minute)}</b><span>${esc(text)}</span></div>`;
    }).join('') : '<div class="cm33-empty">Kick-off commentary will appear here.</div>';
  }

  const current = source.at(-1);
  const latest = console.querySelector('[data-cm33-latest]');
  if (current && latest) {
    latest.className = `cm33-latest ${eventType(current)} ${current.dataset.cmSide || 'neutral'}`;
    latest.innerHTML = `<b>${esc(clean(current.querySelector('b')?.textContent) || '—')}</b><span>${esc(clean(current.querySelector('span')?.textContent) || clean(current.textContent))}</span>`;
  }
  console.querySelector('[data-cm33-phase]').textContent = clean(live.querySelector('[data-commentary-state]')?.textContent || live.querySelector('.flm-panel-head strong')?.textContent || 'LIVE').toUpperCase();
}

function statValue(live,label){
  const row = [...live.querySelectorAll('[data-live-stats] .flm-stat-row')].find(item => clean(item.querySelector('span')?.textContent).toLowerCase() === label.toLowerCase());
  if (!row) return ['—','—'];
  const strong = row.querySelectorAll('strong');
  return [clean(strong[0]?.textContent) || '0', clean(strong[1]?.textContent) || '0'];
}

function syncStats(live,console){
  const labels = ['Possession','Shots','On target','xG','Big chances','Corners'];
  const stats = labels.map(label => ({label,values:statValue(live,label)})).filter(item => item.values[0] !== '—' || item.values[1] !== '—');
  const names = [...live.querySelectorAll('.flm-live-team strong')].map(node => clean(node.textContent));
  const host = console.querySelector('[data-cm33-quickstats]');
  const signature = JSON.stringify(stats);
  if (host.dataset.signature !== signature) {
    host.dataset.signature = signature;
    host.innerHTML = `<div class="cm33-stat-team"><span>${esc(names[0] || 'HOME')}</span><span>${esc(names[1] || 'AWAY')}</span></div>${stats.map(item => `<div class="cm33-stat"><b>${esc(item.values[0])}</b><span>${esc(item.label)}</span><b>${esc(item.values[1])}</b></div>`).join('')}`;
  }

  const pressure = live.querySelector('.cm31-pressure');
  const homeText = clean(pressure?.querySelector('[data-cm31-pressure-home]')?.textContent) || '50%';
  const awayText = clean(pressure?.querySelector('[data-cm31-pressure-away]')?.textContent) || '50%';
  const home = Math.max(0,Math.min(100,Number(homeText.replace('%','')) || 50));
  console.querySelector('[data-cm33-pressure-copy]').textContent = `${homeText} · ${awayText}`;
  console.querySelector('[data-cm33-pressure-home]').style.width = `${home}%`;
  console.querySelector('[data-cm33-pressure-away]').style.width = `${100-home}%`;
}

function aliases(name){
  const key = keyName(name);
  if (!key) return [];
  const parts = key.split(' '), set = new Set([key]);
  if (parts.length > 1 && parts.at(-1).length >= 4) set.add(parts.at(-1));
  if (parts.length > 2) set.add(parts.slice(-2).join(' '));
  return [...set];
}

function mentioned(text,players,exclude=''){
  const haystack = ` ${keyName(text)} `;
  const hits = [];
  for (const player of players || []) {
    if (keyName(player.name) === exclude) continue;
    let score = 0;
    for (const alias of aliases(player.name)) if (haystack.includes(` ${alias} `)) score = Math.max(score,alias.includes(' ') ? 5 : 2);
    if (score) hits.push({player,score});
  }
  hits.sort((a,b) => b.score - a.score || b.player.name.length - a.player.name.length);
  return hits[0]?.player || null;
}

function goalBatches(live){
  const batches = []; let batch = [];
  for (const line of live.querySelectorAll('[data-commentary-feed] .flm-commentary-line.goal')) {
    batch.push(line);
    const text = clean(line.querySelector('span')?.textContent || line.textContent);
    if (/\bGOAL!|\bscores for\b/i.test(text)) { batches.push(batch); batch = []; }
  }
  return batches;
}

async function playerContext(live){
  const database = await db();
  const state = getState(live);
  if (!database) return { players:[],contrib:new Map() };
  const teamNames = [...live.querySelectorAll('.flm-live-team strong')].map(node => clean(node.textContent));
  const candidates = teamNames.map(name => clubForName(database,name)).filter(Boolean);
  const cachedNames = new Set([...state.ratings.values()].map(item => keyName(item.name)));
  candidates.sort((a,b) => database.players.filter(p => p.clubId === b.id && cachedNames.has(keyName(p.name))).length - database.players.filter(p => p.clubId === a.id && cachedNames.has(keyName(p.name))).length);
  const userClub = candidates[0] || null;
  const players = userClub ? database.players.filter(player => player.clubId === userClub.id && !player.isPlaceholder) : [];
  const contrib = new Map(players.map(player => [keyName(player.name),{goals:0,assists:0}]));
  const matchPlayers = candidates.flatMap(club => database.players.filter(player => player.clubId === club.id && !player.isPlaceholder));
  for (const batch of goalBatches(live)) {
    const texts = batch.map(line => clean(line.querySelector('span')?.textContent || '')).filter(Boolean);
    const final = texts.at(-1) || '';
    const scorer = mentioned(final,matchPlayers) || mentioned(texts.join(' '),matchPlayers);
    let assist = null;
    for (const text of texts.slice(0,-1)) {
      const candidate = mentioned(text,matchPlayers,scorer ? keyName(scorer.name) : '');
      if (candidate) { assist = candidate; break; }
    }
    if (scorer && contrib.has(keyName(scorer.name))) contrib.get(keyName(scorer.name)).goals += 1;
    if (assist && contrib.has(keyName(assist.name))) contrib.get(keyName(assist.name)).assists += 1;
  }
  return { database,userClub,players,contrib };
}

function ratingTone(value){ return value >= 8 ? 'elite' : value >= 7 ? 'good' : value < 6 ? 'poor' : 'steady'; }

async function ratingRows(live){
  const state = getState(live);
  const context = await playerContext(live);
  const byName = new Map(context.players.map(player => [keyName(player.name),player]));
  return [...state.ratings.values()].map(item => {
    const player = byName.get(keyName(item.name));
    const contribution = context.contrib.get(keyName(item.name)) || {goals:0,assists:0};
    return {
      ...item,
      shirt: player?.shirtNumber ?? '—',
      primary: player?.primaryPosition || item.position || '—',
      goals: contribution.goals,
      assists: contribution.assists
    };
  }).sort((a,b) => a.order - b.order || a.name.localeCompare(b.name));
}

async function syncRatings(live,console){
  captureRatings(live);
  const rows = await ratingRows(live);
  const top = [...rows].sort((a,b) => b.rating - a.rating || a.name.localeCompare(b.name)).slice(0,5);
  const topHost = console.querySelector('[data-cm33-top-list]');
  const topSig = JSON.stringify(top.map(row => [row.name,row.rating,row.goals,row.assists,row.active]));
  if (topHost.dataset.signature !== topSig) {
    topHost.dataset.signature = topSig;
    topHost.innerHTML = top.length ? top.map((row,index) => `<div class="cm33-top-row"><span>${index+1}</span><strong>${esc(row.name)}</strong><small>${row.goals ? `${row.goals}G` : ''}${row.goals && row.assists ? ' · ' : ''}${row.assists ? `${row.assists}A` : ''}</small><b class="${ratingTone(row.rating)}">${Number(row.rating).toFixed(1)}</b></div>`).join('') : '<div class="cm33-top-empty">Ratings appear after kick-off.</div>';
  }

  const panel = ensureRatings(live);
  if (!panel) return;
  const list = panel.querySelector('[data-cm33-rating-list]');
  const signature = JSON.stringify(rows.map(row => [row.shirt,row.name,row.position,row.condition,row.goals,row.assists,row.rating,row.active]));
  if (list.dataset.signature === signature) return;
  list.dataset.signature = signature;
  list.innerHTML = rows.length ? rows.map(row => `<div class="cm33-rating-row ${row.active ? '' : 'is-off'}"><span class="cm33-no">${esc(row.shirt)}</span><span class="cm33-player"><strong>${esc(row.name)}</strong>${row.active ? '' : '<small>OFF</small>'}</span><span class="cm33-pos">${esc(row.position || row.primary)}</span><span class="cm33-con">${Math.round(row.condition)}%</span><span class="cm33-return ${row.goals ? 'has' : ''}">${row.goals || '—'}</span><span class="cm33-return ${row.assists ? 'has' : ''}">${row.assists || '—'}</span><strong class="cm33-rate ${ratingTone(row.rating)}">${Number(row.rating).toFixed(1)}</strong></div>`).join('') : '<div class="cm33-ratings-empty">Live ratings will appear once the match begins.</div>';
}

function syncGoal(live,console){
  const source = live.querySelector('.cm32-goal-overlay.is-visible');
  if (!source) return;
  const goal = console.querySelector('[data-cm33-goal]');
  const scorer = clean(source.querySelector(':scope > strong')?.textContent) || 'GOAL';
  const minute = clean(source.querySelector(':scope > b')?.textContent) || '';
  const score = clean(source.querySelector('.cm32-goal-score em')?.textContent) || `${clean(live.querySelector('[data-home-score]')?.textContent)}–${clean(live.querySelector('[data-away-score]')?.textContent)}`;
  const teams = [...source.querySelectorAll('.cm32-goal-score span')].map(node => clean(node.textContent));
  const assist = clean(source.querySelector(':scope > small')?.textContent) || '';
  const key = `${minute}|${score}|${scorer}`;
  const state = getState(live);
  if (state.goalKey === key) return;
  state.goalKey = key;
  goal.innerHTML = `<span>GOAL</span><strong>${esc(scorer)}</strong><b>${esc(minute)}</b><div><em>${esc(teams[0] || 'HOME')}</em><strong>${esc(score)}</strong><em>${esc(teams[1] || 'AWAY')}</em></div><small>${esc(assist)}</small>`;
  goal.classList.remove('is-visible'); void goal.offsetWidth; goal.classList.add('is-visible');
  clearTimeout(state.goalTimer); state.goalTimer = setTimeout(() => goal.classList.remove('is-visible'),1900);
}

function syncRail(live,console){
  const view = live.dataset.cmView || 'overview';
  console.querySelectorAll('[data-cm33-view]').forEach(button => button.classList.toggle('is-active',button.dataset.cm33View === view));
  console.querySelectorAll('[data-cm33-speed]').forEach(button => {
    const native = live.querySelector(`[data-match-speed="${button.dataset.cm33Speed}"]`);
    button.classList.toggle('is-active',Boolean(native?.classList.contains('is-active')));
  });
  const pause = console.querySelector('[data-cm33-speed="0"]');
  if (pause) pause.textContent = live.querySelector('[data-match-speed="0"]')?.classList.contains('is-active') ? 'Resume' : 'Pause';
}

function polishSubs(live){
  const dialog = live.querySelector('.flm-match-dialog.v2-sub-dialog');
  if (!dialog) return;
  dialog.dataset.cm33Compact = '1';
}

async function sync(live){
  if (!live?.isConnected || live.dataset.cmPolish !== '3.2') return;
  ensureStyles();
  live.dataset.cmConsole = '3.3';
  const console = ensureConsole(live);
  ensureRatings(live);
  if (!console) return;
  syncRail(live,console);
  syncFeed(live,console);
  syncStats(live,console);
  polishSubs(live);
  await syncRatings(live,console);
  syncGoal(live,console);
}

function queue(){
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    document.querySelectorAll('.flm-live-match[data-cm-polish="3.2"]').forEach(live => sync(live));
  });
}

ensureStyles();
window.addEventListener('flm:live-xg',queue);
new MutationObserver(queue).observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','data-cm-view','data-cm-polish']});
queue();
