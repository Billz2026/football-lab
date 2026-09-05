const STYLE_HREF = './matchday-density-v332.css?v=3.3.2';
let queued = false;
let databasePromise = null;

const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
const esc = value => String(value ?? '')
  .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
  .replaceAll('"','&quot;').replaceAll("'",'&#039;');

function ensureStyles(){
  if ([...document.styleSheets].some(sheet => sheet.href?.includes('matchday-density-v332.css'))) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = STYLE_HREF;
  document.head.appendChild(link);
}

function database(){
  if (!databasePromise) databasePromise = Promise.resolve(window.FLMManager?.loadDatabase?.()).catch(() => null);
  return databasePromise;
}

/* Read-only capture of the immutable state the engine already serialises.
   It does not alter match calculations or the serialized value returned. */
function installStateObserver(){
  if (window.__flmV332StateObserverInstalled) return;
  window.__flmV332StateObserverInstalled = true;
  const native = JSON.stringify;
  JSON.stringify = function(value, ...rest){
    try {
      const isLiveState = value && typeof value === 'object'
        && typeof value.minute === 'number'
        && typeof value.fixtureId === 'string'
        && Array.isArray(value.homeLineupIds)
        && Array.isArray(value.awayLineupIds)
        && value.ratings && value.conditions && value.stats;
      if (isLiveState) {
        window.__flmLiveStateV332 = {
          minute: value.minute,
          fixtureId: value.fixtureId,
          homeClubId: value.homeClubId,
          awayClubId: value.awayClubId,
          userClubId: value.userClubId,
          homeLineupIds: [...value.homeLineupIds],
          awayLineupIds: [...value.awayLineupIds],
          ratings: {...value.ratings},
          conditions: {...value.conditions},
          minutesPlayed: {...(value.minutesPlayed || {})},
          subbedOffIds: [...(value.subbedOffIds || [])],
          events: (value.events || []).map(event => ({
            minute: event.minute,
            type: event.type,
            clubId: event.clubId,
            playerId: event.playerId,
            assistPlayerId: event.assistPlayerId
          }))
        };
      }
    } catch (_) {}
    return Reflect.apply(native, this, [value, ...rest]);
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
    if (pattern.test(text)) { text = text.replace(pattern,replacement); break; }
  }
  text = text
    .replace(/\s+in the [A-Za-z -]+ role\b/gi, '')
    .replace(/\s+exactly as instructed/gi, '')
    .replace(/\s+as part of the tactical plan/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= 92) return text;
  const firstSentence = text.match(/^(.{18,92}?[.!?])(?:\s|$)/);
  if (firstSentence) return firstSentence[1];
  const slice = text.slice(0,89);
  const cut = slice.lastIndexOf(' ');
  return `${slice.slice(0,cut > 58 ? cut : 89).replace(/[,:;.-]+$/,'')}...`;
}

function classifyEvent(text, row){
  const normal = clean(text).toLowerCase();
  if (row.classList.contains('goal') || /\bgoal\b|scores for|finds the net/.test(normal)) return 'major goal';
  if (row.classList.contains('red') || /red card|sent off|penalty/.test(normal)) return 'major danger';
  if (row.classList.contains('yellow') || /yellow card|booked/.test(normal)) return 'card';
  if (row.classList.contains('injury') || /injur|treatment|cannot continue/.test(normal)) return 'major injury';
  if (row.classList.contains('save') || /\bsave\b|saved by|makes the save|hits the post|hits the bar|shoots|shot|effort|one-on-one|is through|chance|header/.test(normal)) return 'chance';
  if (/corner|free kick|crosses|dangerous area|breaks forward|counter/.test(normal)) return 'attack';
  return 'normal';
}

function syncCommentary(live){
  const rows = live.querySelectorAll('.cm33-line');
  rows.forEach(row => {
    const span = row.querySelector('span');
    if (!span) return;
    const source = [...live.querySelectorAll('[data-commentary-feed] .flm-commentary-line')]
      .find(line => clean(line.querySelector('b')?.textContent) === clean(row.querySelector('b')?.textContent)
        && clean(line.querySelector('span')?.textContent).slice(0,28) === clean(span.dataset.cm332Raw || span.textContent).slice(0,28));
    const raw = clean(source?.querySelector('span')?.textContent || span.dataset.cm332Raw || span.textContent);
    if (!span.dataset.cm332Raw) span.dataset.cm332Raw = raw;
    const compact = compactCommentary(raw);
    if (span.textContent !== compact) span.textContent = compact;
    row.classList.remove('cm332-normal','cm332-chance','cm332-attack','cm332-card','cm332-major','cm332-goal','cm332-danger','cm332-injury');
    classifyEvent(compact,row).split(' ').forEach(type => row.classList.add(`cm332-${type}`));
  });
  const latest = live.querySelector('.cm33-latest > span');
  if (latest) {
    const source = [...live.querySelectorAll('[data-commentary-feed] .flm-commentary-line')].at(-1);
    const raw = clean(source?.querySelector('span')?.textContent || latest.dataset.cm332Raw || latest.textContent);
    latest.dataset.cm332Raw = raw;
    const compact = compactCommentary(raw);
    if (latest.textContent !== compact) latest.textContent = compact;
  }
}

function statNumber(value){
  const number = Number(String(value || '').replace(/[^0-9.-]/g,''));
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

function syncStatBars(live){
  live.querySelectorAll('[data-live-stats] .flm-stat-row').forEach(row => {
    const values = row.querySelectorAll('strong');
    if (values.length < 2) return;
    const home = statNumber(values[0].textContent);
    const away = statNumber(values[1].textContent);
    const total = home + away;
    const homePct = total > 0 ? home / total * 100 : 50;
    let bar = row.querySelector('.cm332-statbar');
    if (!bar) {
      bar = document.createElement('i');
      bar.className = 'cm332-statbar';
      bar.innerHTML = '<span class="home"></span><span class="away"></span>';
      row.appendChild(bar);
    }
    bar.querySelector('.home').style.width = `${homePct}%`;
    bar.querySelector('.away').style.width = `${100-homePct}%`;
  });
}

function optionData(option){
  const parts = String(option?.textContent || '').split('·').map(part => part.trim());
  return { id: option?.value || '', name: parts[0] || option?.value || '', position: parts[1] || '', condition: parts[2] || '' };
}

function syncSubs(live){
  const dialog = live.querySelector('.flm-match-dialog.v2-sub-dialog');
  if (!dialog) return;
  const outList = dialog.querySelector('[data-v2-out-list]');
  const inList = dialog.querySelector('[data-v2-in-list]');
  const hiddenBench = dialog.querySelector('[data-sub-in]');
  const help = dialog.querySelector('[data-v2-bench-help]');
  const selectedOut = outList?.querySelector('.v2-sub-player.is-selected-out');
  if (inList && hiddenBench && !selectedOut) {
    const preview = [...hiddenBench.options].map(optionData).filter(item => item.id && item.name);
    const signature = preview.map(item => `${item.id}|${item.name}|${item.position}|${item.condition}`).join('||');
    if (inList.dataset.cm332Preview !== signature || !inList.querySelector('.cm332-bench-preview')) {
      inList.dataset.cm332Preview = signature;
      inList.innerHTML = preview.length ? preview.map(item => `
        <button type="button" class="v2-sub-player cm332-bench-preview" disabled aria-disabled="true">
          <span class="pos">${esc(item.position || 'BENCH')}</span>
          <strong>${esc(item.name)}</strong>
          <small>${esc(item.condition || '')}</small>
          <span class="v2-sub-fit cm332-ready">BENCH</span>
        </button>`).join('') : '<div class="v2-sub-empty">No substitutes are available.</div>';
    }
    if (help) help.textContent = 'Bench always visible · select a player off to rank positional fit';
  } else if (inList && selectedOut) {
    delete inList.dataset.cm332Preview;
  }
  const apply = dialog.querySelector('[data-apply-sub]');
  if (apply) apply.textContent = 'CONFIRM SUBSTITUTION';
}

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

function playedIds(snapshot, side, db){
  const current = side === 'home' ? snapshot.homeLineupIds : snapshot.awayLineupIds;
  const clubId = side === 'home' ? snapshot.homeClubId : snapshot.awayClubId;
  const set = new Set(current);
  for (const [id,minutes] of Object.entries(snapshot.minutesPlayed || {})) {
    const player = db.players?.find(item => item.id === id);
    if (Number(minutes) > 0 && player?.clubId === clubId) set.add(id);
  }
  return [...current, ...[...set].filter(id => !current.includes(id))];
}

function ratingTone(value){ return value >= 8 ? 'elite' : value >= 7 ? 'good' : value < 6 ? 'poor' : 'steady'; }

function ratingRow(player, snapshot, returns, active){
  const contribution = returns.get(player.id) || {goals:0,assists:0};
  const rating = Number(snapshot.ratings?.[player.id] ?? 6.5);
  const condition = Math.round(Number(snapshot.conditions?.[player.id] ?? 100));
  return `<div class="cm332-rating-row ${active ? '' : 'is-off'}">
    <span class="no">${esc(player.shirtNumber ?? '—')}</span>
    <span class="player"><strong>${esc(player.name)}</strong>${active ? '' : '<small>OFF</small>'}</span>
    <span class="pos">${esc(player.primaryPosition || player.positionGroup || '—')}</span>
    <span class="con">${condition}%</span>
    <span class="return ${contribution.goals ? 'has' : ''}">${contribution.goals || '—'}</span>
    <span class="return ${contribution.assists ? 'has' : ''}">${contribution.assists || '—'}</span>
    <strong class="rate ${ratingTone(rating)}">${rating.toFixed(1)}</strong>
  </div>`;
}

function ensureDualRatings(live){
  const grid = live.querySelector('.flm-live-grid');
  if (!grid) return null;
  let panel = grid.querySelector('.cm332-dual-ratings');
  if (!panel) {
    panel = document.createElement('section');
    panel.className = 'cm332-dual-ratings';
    panel.innerHTML = '<div class="cm332-ratings-empty">Live ratings initialise after kick-off.</div>';
    grid.appendChild(panel);
  }
  return panel;
}

async function syncDualRatings(live){
  const panel = ensureDualRatings(live);
  if (!panel) return;
  const snapshot = window.__flmLiveStateV332;
  const db = await database();
  if (!snapshot || !db) { live.classList.remove('cm332-has-dual-ratings'); return; }
  live.classList.add('cm332-has-dual-ratings');
  const homeClub = db.clubs?.find(item => item.id === snapshot.homeClubId);
  const awayClub = db.clubs?.find(item => item.id === snapshot.awayClubId);
  const returns = contributions(snapshot);
  const buildTeam = side => {
    const ids = playedIds(snapshot,side,db);
    const current = new Set(side === 'home' ? snapshot.homeLineupIds : snapshot.awayLineupIds);
    return ids.map(id => db.players?.find(item => item.id === id)).filter(Boolean)
      .map(player => ratingRow(player,snapshot,returns,current.has(player.id))).join('');
  };
  const signature = JSON.stringify([
    snapshot.fixtureId,snapshot.minute,snapshot.homeLineupIds,snapshot.awayLineupIds,
    snapshot.ratings,snapshot.conditions,(snapshot.events || []).filter(event => event.type === 'goal')
  ]);
  if (panel.dataset.signature === signature) return;
  panel.dataset.signature = signature;
  panel.innerHTML = `
    <header class="cm332-ratings-title">
      <div><small>LIVE PERFORMANCE</small><h3>PLAYER RATINGS</h3></div>
      <span>${snapshot.minute}' · BOTH TEAMS</span>
    </header>
    <div class="cm332-ratings-teams">
      <section>
        <header><strong>${esc(homeClub?.name || 'HOME')}</strong><span>HOME</span></header>
        <div class="cm332-rating-head"><span>NO.</span><span>PLAYER</span><span>POS</span><span>CON</span><span>G</span><span>A</span><span>RTG</span></div>
        <div class="cm332-rating-list">${buildTeam('home')}</div>
      </section>
      <section>
        <header><strong>${esc(awayClub?.name || 'AWAY')}</strong><span>AWAY</span></header>
        <div class="cm332-rating-head"><span>NO.</span><span>PLAYER</span><span>POS</span><span>CON</span><span>G</span><span>A</span><span>RTG</span></div>
        <div class="cm332-rating-list">${buildTeam('away')}</div>
      </section>
    </div>`;
}

async function syncTopPerformers(live){
  const snapshot = window.__flmLiveStateV332;
  const db = await database();
  if (!snapshot || !db) return;
  const byName = new Map((db.players || []).map(player => [clean(player.name).toLowerCase(), player]));
  const returns = contributions(snapshot);
  live.querySelectorAll('.cm33-top-row').forEach(row => {
    const nameNode = row.querySelector('strong');
    const small = row.querySelector('small');
    const player = byName.get(clean(nameNode?.textContent).toLowerCase());
    if (!player || !small) return;
    const data = returns.get(player.id) || {goals:0,assists:0};
    const condition = Math.round(Number(snapshot.conditions?.[player.id] ?? 100));
    const bits = [player.primaryPosition || player.positionGroup].filter(Boolean);
    if (data.goals) bits.push(`${data.goals}G`);
    if (data.assists) bits.push(`${data.assists}A`);
    bits.push(`${condition}%`);
    small.textContent = bits.join(' · ');
  });
}

function syncPressure(live){
  const copy = live.querySelector('[data-cm33-pressure-copy]');
  if (!copy) return;
  const teams = [...live.querySelectorAll('.flm-live-team strong')].map(node => clean(node.textContent));
  const code = name => {
    const parts = name.split(/\s+/).filter(Boolean).filter(part => !/^(fc|afc|united|city)$/i.test(part));
    if (!parts.length) return 'TEAM';
    if (parts.length === 1) return parts[0].slice(0,3).toUpperCase();
    return parts.map(part => part[0]).join('').slice(0,4).toUpperCase();
  };
  const source = live.querySelector('.cm31-pressure');
  const home = clean(source?.querySelector('[data-cm31-pressure-home]')?.textContent) || '50%';
  const away = clean(source?.querySelector('[data-cm31-pressure-away]')?.textContent) || '50%';
  const text = `${code(teams[0] || 'HOME')} ${home} — ${away} ${code(teams[1] || 'AWAY')}`;
  if (copy.textContent !== text) copy.textContent = text;
}

async function enhance(live){
  if (!live?.isConnected) return;
  live.dataset.cmDensity = '3.3.2';
  syncCommentary(live);
  syncStatBars(live);
  syncSubs(live);
  syncPressure(live);
  await syncTopPerformers(live);
  if (live.dataset.cmView === 'ratings') await syncDualRatings(live);
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
installStateObserver();
queue();
new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','data-cm-view']});
