const STYLE_HREF = './matchday-mode-v34.css?v=3.4.1';
let queued = false;
let databasePromise = null;

const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
const esc = value => String(value ?? '')
  .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
  .replaceAll('"','&quot;').replaceAll("'",'&#039;');

function ensureStyles(){
  if ([...document.styleSheets].some(sheet => sheet.href?.includes('matchday-mode-v34.css'))) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = STYLE_HREF;
  document.head.appendChild(link);
}

function database(){
  if (!databasePromise) databasePromise = Promise.resolve(window.FLMManager?.loadDatabase?.()).catch(() => null);
  return databasePromise;
}

/* Read-only observer: the match engine already serialises its immutable state every minute.
   This wrapper delegates JSON.stringify unchanged and only copies the fields needed by V3.4 UI. */
function installStateObserver(){
  if (window.__flmNativeJSONStringifyV34) return;
  const native = JSON.stringify;
  window.__flmNativeJSONStringifyV34 = native;
  JSON.stringify = function(value,...rest){
    try {
      const isLiveState = value && typeof value === 'object'
        && typeof value.minute === 'number'
        && typeof value.fixtureId === 'string'
        && Array.isArray(value.homeLineupIds)
        && Array.isArray(value.awayLineupIds)
        && value.ratings && value.conditions && value.stats;
      if (isLiveState) {
        window.__flmLiveStateV34 = {
          minute:value.minute,
          fixtureId:value.fixtureId,
          homeClubId:value.homeClubId,
          awayClubId:value.awayClubId,
          userClubId:value.userClubId,
          homeLineupIds:[...value.homeLineupIds],
          awayLineupIds:[...value.awayLineupIds],
          ratings:{...value.ratings},
          conditions:{...value.conditions},
          minutesPlayed:{...(value.minutesPlayed || {})},
          subbedOffIds:[...(value.subbedOffIds || [])],
          events:(value.events || []).map(event => ({
            minute:event.minute,
            type:event.type,
            clubId:event.clubId,
            playerId:event.playerId,
            assistPlayerId:event.assistPlayerId
          }))
        };
      }
    } catch (_) {}
    return Reflect.apply(native,this,[value,...rest]);
  };
}

function compactCommentary(input){
  let text = clean(input);
  if (!text) return text;
  const rules = [
    [/^(.+?) takes a touch and looks up\.?$/i, '$1 looks up'],
    [/^(.+?) keeps the ball moving as (.+?) finds space between the lines\.?$/i, '$1 finds $2 between the lines'],
    [/^(.+?) recycle possession patiently\.?$/i, '$1 recycle possession'],
    [/^(.+?) are trying to pull (.+?) out of their shape\.?$/i, '$1 probe for space'],
    [/^(.+?) move it from side to side\.?$/i, '$1 switch the play'],
    [/^(.+?) are being made to work without the ball\.?$/i, '$1 drop into shape'],
    [/^(.+?) squeeze the pitch and win possession high up the field\.?$/i, '$1 win it high'],
    [/^(.+?) press in numbers, refusing to let the opposition settle\.?$/i, '$1 press aggressively'],
    [/^(.+?) sees the run and threads the ball into space\.\.\.$/i, '$1 slides the pass through'],
    [/^(.+?) is in behind (.+?)!$/i, '$1 is through!'],
    [/^(.+?) opens up the defence with a clever pass\.?$/i, '$1 splits the defence'],
    [/^(.+?) gets the shot away\.\.\.$/i, '$1 shoots...'],
    [/^(.+?) lets fly from the edge of the area\.\.\.$/i, '$1 shoots from range...'],
    [/^(.+?) finds (.+?) in a pocket of space\.?$/i, '$1 finds $2'],
    [/^(.+?) drags the effort wide of the post\.?$/i, '$1 drags it wide'],
    [/^(.+?) drives toward goal but the shot is blocked\.?$/i, '$1 shoots — blocked'],
    [/^(.+?) have a corner and the defenders come forward\.?$/i, '$1 win a corner'],
    [/^(.+?) gets down the flank and crosses early\.?$/i, '$1 crosses early'],
    [/^(.+?) cannot quite get there and the danger passes\.?$/i, '$1 cannot reach it'],
    [/^(.+?) is caught late by (.+?)\.?$/i, '$2 fouls $1'],
    [/^(.+?) stops (.+?) with a foul\. Free kick\.?$/i, '$1 fouls $2'],
    [/^(.+?) darts beyond the back line\.\.\.$/i, '$1 makes the run...'],
    [/^The flag is up\. Offside\.?$/i, 'Offside'],
    [/^(.+?) drops deep and keeps possession moving\.?$/i, '$1 keeps possession moving'],
    [/^(.+?) keep possession and probe for space\.?$/i, '$1 probe for space'],
    [/^(.+?) push forward in search of a chance\.?$/i, '$1 push forward'],
    [/^(.+?) stretches the defence\.?$/i, '$1 stretches the back line'],
    [/^(.+?) breaks into a dangerous area\.?$/i, '$1 breaks forward'],
    [/^(.+?) reads the danger and clears\.?$/i, '$1 clears'],
    [/^(.+?) holds his position and cuts out the danger\.?$/i, '$1 intercepts'],
    [/^(.+?) is starting to tire\.?$/i, '$1 is tiring']
  ];
  for (const [pattern,replacement] of rules) {
    if (pattern.test(text)) {
      text = text.replace(pattern,replacement);
      break;
    }
  }
  text = text
    .replace(/\s+in the [A-Za-z -]+ role\b/gi, '')
    .replace(/\s+exactly as instructed/gi, '')
    .replace(/\s+as part of the tactical plan/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= 84) return text;
  const firstSentence = text.match(/^(.{18,84}?[.!?])(?:\s|$)/);
  if (firstSentence) return firstSentence[1];
  const slice = text.slice(0,81);
  const cut = slice.lastIndexOf(' ');
  return `${slice.slice(0,cut > 52 ? cut : 81).replace(/[,:;.-]+$/,'')}...`;
}

function teamCode(name){
  const parts = clean(name).split(/\s+/).filter(Boolean);
  if (!parts.length) return 'TEAM';
  if (parts.length === 1) return parts[0].slice(0,3).toUpperCase();
  const initials = parts.filter(part => !/^(fc|afc|cf)$/i.test(part)).map(part => part[0]).join('').toUpperCase();
  return initials.length >= 2 && initials.length <= 4 ? initials : parts[0].slice(0,3).toUpperCase();
}

function enterMatchMode(live){
  const app = document.getElementById('careerApp');
  if (!app) return;
  document.body.classList.add('flm-match-mode-v34');
  app.classList.add('flm-match-mode-v34');
  live.dataset.cmMode = '3.4';
}

function leaveMatchMode(){
  if (document.querySelector('[data-live-match]')) return;
  document.body.classList.remove('flm-match-mode-v34');
  document.getElementById('careerApp')?.classList.remove('flm-match-mode-v34');
}

function syncCommentary(live){
  const console = live.querySelector('.cm33-console');
  if (!console) return;
  console.querySelectorAll('.cm33-line > span').forEach(node => {
    const raw = node.dataset.cm34Raw || node.textContent || '';
    if (!node.dataset.cm34Raw) node.dataset.cm34Raw = raw;
    const compact = compactCommentary(raw);
    if (node.textContent !== compact) node.textContent = compact;
  });
  const latest = console.querySelector('.cm33-latest > span');
  if (latest) {
    const source = [...live.querySelectorAll('[data-commentary-feed] .flm-commentary-line')].at(-1);
    const raw = clean(source?.querySelector('span')?.textContent || latest.dataset.cm34Raw || latest.textContent);
    latest.dataset.cm34Raw = raw;
    const compact = compactCommentary(raw);
    if (latest.textContent !== compact) latest.textContent = compact;
  }
}

function syncPressure(live){
  const console = live.querySelector('.cm33-console');
  const pressure = console?.querySelector('.cm33-pressure');
  if (!pressure) return;
  const teams = [...live.querySelectorAll('.flm-live-team strong')].map(node => clean(node.textContent));
  const source = live.querySelector('.cm31-pressure');
  const homeText = clean(source?.querySelector('[data-cm31-pressure-home]')?.textContent) || '50%';
  const awayText = clean(source?.querySelector('[data-cm31-pressure-away]')?.textContent) || '50%';
  const copy = pressure.querySelector('[data-cm33-pressure-copy]');
  if (copy) copy.textContent = `${teamCode(teams[0])} ${homeText} — ${awayText} ${teamCode(teams[1])}`;
  pressure.dataset.home = teamCode(teams[0]);
  pressure.dataset.away = teamCode(teams[1]);
}

function managerType(dialog){
  const title = clean(dialog?.querySelector('.flm-dialog-head h3')?.textContent).toLowerCase();
  if (title.includes('substitution')) return 'subs';
  if (title.includes('tactical')) return 'tactics';
  if (title.includes('role') || title.includes('shape')) return 'shape';
  if (title.includes('rating')) return 'ratings';
  if (title.includes('opposition')) return 'opposition';
  return 'manager';
}

function syncManagerWorkspace(live){
  const modal = live.querySelector('[data-manager-modal]');
  const dialog = live.querySelector('[data-manager-dialog]');
  if (!modal || !dialog) return;
  if (live.classList.contains('cm33-capturing') || live.classList.contains('cm32-capturing')) {
    delete live.dataset.cm34Manager;
    return;
  }
  const open = modal.classList.contains('is-open');
  if (!open) {
    delete live.dataset.cm34Manager;
    return;
  }
  const type = managerType(dialog);
  live.dataset.cm34Manager = type;
  dialog.dataset.cm34Workspace = type;
  const headClose = dialog.querySelector('.flm-dialog-head [data-close-manager]');
  if (headClose && headClose.textContent !== 'BACK TO MATCH') {
    headClose.textContent = 'BACK TO MATCH';
    headClose.setAttribute('aria-label','Back to match');
  }
  if (type === 'subs') {
    const empty = dialog.querySelector('[data-v2-in-list] .v2-sub-empty');
    if (empty) empty.textContent = 'Select a player from your XI. The bench will then rank the best positional replacements.';
    const apply = dialog.querySelector('[data-apply-sub]');
    if (apply) apply.textContent = 'CONFIRM SUBSTITUTION';
  }
}

function ratingTone(value){ return value >= 8 ? 'elite' : value >= 7 ? 'good' : value < 6 ? 'poor' : 'steady'; }

function contributions(snapshot){
  const map = new Map();
  for (const event of snapshot?.events || []) {
    if (event.type !== 'goal') continue;
    if (event.playerId) {
      const item = map.get(event.playerId) || {goals:0,assists:0};
      item.goals += 1; map.set(event.playerId,item);
    }
    if (event.assistPlayerId) {
      const item = map.get(event.assistPlayerId) || {goals:0,assists:0};
      item.assists += 1; map.set(event.assistPlayerId,item);
    }
  }
  return map;
}

function playedIds(snapshot,side,database){
  const current = side === 'home' ? snapshot.homeLineupIds : snapshot.awayLineupIds;
  const clubId = side === 'home' ? snapshot.homeClubId : snapshot.awayClubId;
  const set = new Set(current);
  for (const [id,minutes] of Object.entries(snapshot.minutesPlayed || {})) {
    const player = database.players?.find(item => item.id === id);
    if (minutes > 0 && player?.clubId === clubId) set.add(id);
  }
  return [...current,...[...set].filter(id => !current.includes(id))];
}

function ratingRow(player,snapshot,contrib,active){
  const returnData = contrib.get(player.id) || {goals:0,assists:0};
  const value = Number(snapshot.ratings?.[player.id] ?? 6.5);
  const condition = Math.round(Number(snapshot.conditions?.[player.id] ?? 100));
  return `<div class="cm34-rating-row ${active?'':'is-off'}">
    <span class="no">${esc(player.shirtNumber ?? '—')}</span>
    <span class="player"><strong>${esc(player.name)}</strong>${active?'':'<small>OFF</small>'}</span>
    <span class="pos">${esc(player.primaryPosition || player.positionGroup || '—')}</span>
    <span class="con">${condition}%</span>
    <span class="return ${returnData.goals?'has':''}">${returnData.goals || '—'}</span>
    <span class="return ${returnData.assists?'has':''}">${returnData.assists || '—'}</span>
    <strong class="rate ${ratingTone(value)}">${value.toFixed(1)}</strong>
  </div>`;
}

async function ensureDualRatings(live){
  const grid = live.querySelector('.flm-live-grid');
  if (!grid) return null;
  let panel = grid.querySelector('.cm34-dual-ratings');
  if (!panel) {
    panel = document.createElement('section');
    panel.className = 'cm34-dual-ratings';
    panel.innerHTML = '<div class="cm34-ratings-empty">Live ratings initialise after kick-off.</div>';
    grid.appendChild(panel);
  }
  return panel;
}

async function syncDualRatings(live){
  const panel = await ensureDualRatings(live);
  if (!panel) return;
  const snapshot = window.__flmLiveStateV34;
  const db = await database();
  if (!snapshot || !db || snapshot.fixtureId !== window.__flmLiveStateV34?.fixtureId) return;
  const homeClub = db.clubs?.find(item => item.id === snapshot.homeClubId);
  const awayClub = db.clubs?.find(item => item.id === snapshot.awayClubId);
  const contrib = contributions(snapshot);
  const buildTeam = side => {
    const ids = playedIds(snapshot,side,db);
    const current = new Set(side === 'home' ? snapshot.homeLineupIds : snapshot.awayLineupIds);
    const players = ids.map(id => db.players?.find(item => item.id === id)).filter(Boolean);
    return players.map(player => ratingRow(player,snapshot,contrib,current.has(player.id))).join('');
  };
  const signature = JSON.stringify([
    snapshot.minute,snapshot.homeLineupIds,snapshot.awayLineupIds,snapshot.ratings,
    snapshot.conditions,(snapshot.events || []).filter(event => event.type === 'goal')
  ]);
  if (panel.dataset.signature === signature) return;
  panel.dataset.signature = signature;
  panel.innerHTML = `
    <header class="cm34-ratings-title"><div><small>LIVE PERFORMANCE</small><h3>PLAYER RATINGS</h3></div><span>${snapshot.minute}' · both teams</span></header>
    <div class="cm34-ratings-teams">
      <section><header><strong>${esc(homeClub?.name || 'HOME')}</strong><span>HOME</span></header><div class="cm34-rating-head"><span>NO.</span><span>PLAYER</span><span>POS</span><span>CON</span><span>G</span><span>A</span><span>RTG</span></div><div class="cm34-rating-list">${buildTeam('home')}</div></section>
      <section><header><strong>${esc(awayClub?.name || 'AWAY')}</strong><span>AWAY</span></header><div class="cm34-rating-head"><span>NO.</span><span>PLAYER</span><span>POS</span><span>CON</span><span>G</span><span>A</span><span>RTG</span></div><div class="cm34-rating-list">${buildTeam('away')}</div></section>
    </div>`;
}

function syncRail(live){
  const rail = live.querySelector('.cm33-rail');
  if (!rail) return;
  const labels = {
    overview:'OVERVIEW', stats:'MATCH STATS', zones:'ACTION ZONES', ratings:'PLAYER RATINGS', report:'MATCH REPORT'
  };
  rail.querySelectorAll('[data-cm33-view]').forEach(button => {
    const label = labels[button.dataset.cm33View];
    if (label) button.textContent = label;
  });
  const subs = rail.querySelector('[data-cm33-subs]');
  if (subs) subs.textContent = 'SUBSTITUTIONS';
  const tactics = rail.querySelector('[data-cm33-tactics]');
  if (tactics) tactics.textContent = 'TACTICS';
}

function syncHalfTime(live){
  const card = live.querySelector('.flm-ht-card');
  if (!card) return;
  const button = card.querySelector('[data-resume-second-half]');
  if (button) button.textContent = 'START SECOND HALF';
}

async function sync(live){
  if (!live?.isConnected || live.dataset.cmConsole !== '3.3') return;
  ensureStyles();
  enterMatchMode(live);
  syncRail(live);
  syncCommentary(live);
  syncPressure(live);
  syncManagerWorkspace(live);
  syncHalfTime(live);
  if (live.dataset.cmView === 'ratings') await syncDualRatings(live);
}

function queue(){
  if (queued) return;
  queued = true;
  requestAnimationFrame(async () => {
    queued = false;
    const lives = [...document.querySelectorAll('.flm-live-match[data-cm-console="3.3"]')];
    for (const live of lives) await sync(live);
    if (!lives.length) leaveMatchMode();
  });
}

installStateObserver();
ensureStyles();
window.addEventListener('flm:live-xg',queue);
new MutationObserver(queue).observe(document.body,{
  childList:true,
  subtree:true,
  characterData:true,
  attributes:true,
  attributeFilter:['class','data-cm-view','data-cm-console']
});
queue();
