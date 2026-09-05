const STYLE_HREF = './matchday-stability-v333.css?v=3.3.3';
let queued = false;
let databasePromise = null;

const esc = value => String(value ?? '')
  .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
  .replaceAll('"','&quot;').replaceAll("'",'&#039;');

function ensureStyles(){
  if ([...document.styleSheets].some(sheet => sheet.href?.includes('matchday-stability-v333.css'))) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = STYLE_HREF;
  document.head.appendChild(link);
}

function database(){
  if (!databasePromise) databasePromise = Promise.resolve(window.FLMManager?.loadDatabase?.()).catch(() => null);
  return databasePromise;
}

function ratingTone(value){
  return value >= 8 ? 'elite' : value >= 7 ? 'good' : value < 6 ? 'poor' : 'steady';
}

function contributionMap(snapshot){
  const map = new Map();
  for (const event of snapshot?.events || []) {
    if (event.type !== 'goal') continue;
    if (event.playerId) {
      const item = map.get(event.playerId) || { goals:0, assists:0 };
      item.goals += 1;
      map.set(event.playerId,item);
    }
    if (event.assistPlayerId) {
      const item = map.get(event.assistPlayerId) || { goals:0, assists:0 };
      item.assists += 1;
      map.set(event.assistPlayerId,item);
    }
  }
  return map;
}

function playedIds(snapshot,side,db){
  const current = side === 'home' ? snapshot.homeLineupIds : snapshot.awayLineupIds;
  const clubId = side === 'home' ? snapshot.homeClubId : snapshot.awayClubId;
  const seen = new Set(current);
  for (const [id,minutes] of Object.entries(snapshot.minutesPlayed || {})) {
    if (Number(minutes) <= 0) continue;
    const player = db.players?.find(item => item.id === id);
    if (player?.clubId === clubId) seen.add(id);
  }
  return [...current,...[...seen].filter(id => !current.includes(id))];
}

function shirtNumber(player){
  const value = Number(player?.shirtNumber);
  return Number.isInteger(value) && value >= 1 && value <= 99 ? String(value) : '—';
}

function playerRow(player,snapshot,returns,active){
  const contribution = returns.get(player.id) || { goals:0, assists:0 };
  const rating = Number(snapshot.ratings?.[player.id] ?? 6.5);
  const condition = Math.max(0,Math.min(100,Math.round(Number(snapshot.conditions?.[player.id] ?? 100))));
  const minutes = Math.max(0,Math.round(Number(snapshot.minutesPlayed?.[player.id] ?? snapshot.minute ?? 0)));
  return `<div class="cm332-rating-row cm333-rating-row ${active ? '' : 'is-off'}" data-player-id="${esc(player.id)}">
    <span class="no cm333-no">${shirtNumber(player)}</span>
    <span class="cm333-player-name"><strong>${esc(player.name || 'Unknown player')}</strong>${active ? '' : `<small>OFF · ${minutes}'</small>`}</span>
    <span class="pos cm333-pos">${esc(player.primaryPosition || player.positionGroup || '—')}</span>
    <span class="con cm333-con">${condition}%</span>
    <span class="return cm333-goals ${contribution.goals ? 'has' : ''}">${contribution.goals || '—'}</span>
    <span class="return cm333-assists ${contribution.assists ? 'has' : ''}">${contribution.assists || '—'}</span>
    <strong class="rate cm333-rate ${ratingTone(rating)}">${Number.isFinite(rating) ? rating.toFixed(1) : '6.5'}</strong>
  </div>`;
}

async function rebuildRatings(live){
  if (live.dataset.cmView !== 'ratings') return;
  const snapshot = window.__flmLiveStateV332;
  const db = await database();
  const panel = live.querySelector('.cm332-dual-ratings');
  if (!snapshot || !db || !panel) return;

  const homeClub = db.clubs?.find(item => item.id === snapshot.homeClubId);
  const awayClub = db.clubs?.find(item => item.id === snapshot.awayClubId);
  const returns = contributionMap(snapshot);

  const build = side => {
    const ids = playedIds(snapshot,side,db);
    const active = new Set(side === 'home' ? snapshot.homeLineupIds : snapshot.awayLineupIds);
    return ids.map(id => db.players?.find(item => item.id === id))
      .filter(Boolean)
      .map(player => playerRow(player,snapshot,returns,active.has(player.id)))
      .join('');
  };

  const signature = JSON.stringify([
    snapshot.fixtureId,snapshot.minute,snapshot.homeLineupIds,snapshot.awayLineupIds,
    snapshot.ratings,snapshot.conditions,snapshot.minutesPlayed,
    (snapshot.events || []).filter(event => event.type === 'goal')
  ]);
  if (panel.dataset.cm333Signature === signature) return;
  panel.dataset.cm333Signature = signature;
  panel.innerHTML = `
    <header class="cm332-ratings-title">
      <div><small>LIVE PERFORMANCE</small><h3>PLAYER RATINGS</h3></div>
      <span>${Math.max(0,Math.min(90,Math.round(Number(snapshot.minute) || 0)))}' · BOTH TEAMS</span>
    </header>
    <div class="cm332-ratings-teams">
      <section data-cm333-side="home">
        <header><strong>${esc(homeClub?.name || 'HOME')}</strong><span>HOME</span></header>
        <div class="cm332-rating-head"><span>NO.</span><span>PLAYER</span><span>POS</span><span>CON</span><span>G</span><span>A</span><span>RTG</span></div>
        <div class="cm332-rating-list">${build('home')}</div>
      </section>
      <section data-cm333-side="away">
        <header><strong>${esc(awayClub?.name || 'AWAY')}</strong><span>AWAY</span></header>
        <div class="cm332-rating-head"><span>NO.</span><span>PLAYER</span><span>POS</span><span>CON</span><span>G</span><span>A</span><span>RTG</span></div>
        <div class="cm332-rating-list">${build('away')}</div>
      </section>
    </div>`;
}

function repairClock(live){
  const clock = live.querySelector('[data-live-clock]');
  if (!clock) return;
  const snapshot = window.__flmLiveStateV332;
  const raw = String(clock.textContent || '').trim();
  if (!/^\d{2}:\d{2}$/.test(raw) && snapshot && Number.isFinite(Number(snapshot.minute))) {
    clock.textContent = `${String(Math.max(0,Math.min(90,Math.round(Number(snapshot.minute))))).padStart(2,'0')}:00`;
  }
  clock.setAttribute('aria-label',`Match time ${clock.textContent.trim()}`);
}

function repairBenchNames(live){
  live.querySelectorAll('.cm332-bench-preview').forEach(row => {
    const name = row.querySelector('strong');
    if (name) name.classList.add('cm333-bench-name');
  });
}

async function enhance(live){
  if (!live?.isConnected) return;
  live.dataset.cmStability = '3.3.3';
  repairClock(live);
  repairBenchNames(live);
  await rebuildRatings(live);
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
new MutationObserver(queue).observe(document.documentElement,{
  childList:true,
  subtree:true,
  characterData:true,
  attributes:true,
  attributeFilter:['class','data-cm-view']
});
