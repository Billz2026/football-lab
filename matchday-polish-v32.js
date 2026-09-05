const STYLE_HREF = './matchday-polish-v32.css?v=3.2.0';
let queued = false;
let databasePromise = null;
const ratingCache = new WeakMap();
const goalKeys = new WeakMap();

const esc = value => String(value ?? '')
  .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
  .replaceAll('"','&quot;').replaceAll("'",'&#039;');

const clean = value => String(value || '')
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
  .replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').trim();

function ensureStyles(){
  if ([...document.styleSheets].some(sheet => sheet.href?.includes('matchday-polish-v32.css'))) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = STYLE_HREF;
  document.head.appendChild(link);
}

function manager(){ return window.FLMManager; }
function database(){
  if (!databasePromise) databasePromise = Promise.resolve(manager()?.loadDatabase?.()).catch(() => null);
  return databasePromise;
}

function findClub(db,name){
  const key = clean(name);
  return db?.clubs?.find(club => [club.name,club.shortName,club.providerName].filter(Boolean).some(value => clean(value) === key))
    || db?.clubs?.find(club => [club.name,club.shortName,club.providerName].filter(Boolean).some(value => {
      const candidate = clean(value); return candidate && (candidate.includes(key) || key.includes(candidate));
    })) || null;
}

function playerAliases(name){
  const normalized = clean(name);
  if (!normalized) return [];
  const parts = normalized.split(' ');
  const aliases = new Set([normalized]);
  if (parts.length > 1 && parts.at(-1).length >= 4) aliases.add(parts.at(-1));
  if (parts.length >= 3) aliases.add(parts.slice(-2).join(' '));
  return [...aliases];
}

function mentionedPlayer(text,players,excludeId=null){
  const haystack = ` ${clean(text)} `;
  const scored = [];
  for (const player of players || []) {
    if (player.id === excludeId) continue;
    let score = 0;
    for (const alias of playerAliases(player.name)) {
      if (haystack.includes(` ${alias} `)) score = Math.max(score, alias.includes(' ') ? 5 : 2);
    }
    if (score) scored.push({player,score});
  }
  scored.sort((a,b)=>b.score-a.score || b.player.name.length-a.player.name.length);
  return scored[0]?.player || null;
}

function goalBatches(live){
  const lines = [...live.querySelectorAll('[data-commentary-feed] .flm-commentary-line.goal')];
  const batches = [];
  let current = [];
  for (const line of lines) {
    current.push(line);
    const text = line.querySelector('span')?.textContent || line.textContent || '';
    if (/\bGOAL!|\bscores for\b/i.test(text)) {
      batches.push(current);
      current = [];
    }
  }
  return batches;
}

async function contributionData(live){
  const db = await database();
  if (!db) return { byId:new Map(), latest:null, userPlayers:[] };
  const teamNames = [...live.querySelectorAll('.flm-live-team strong')].map(node=>node.textContent?.trim() || '');
  const homeClub = findClub(db,teamNames[0]);
  const awayClub = findClub(db,teamNames[1]);
  const cache = ratingCache.get(live) || new Map();
  const cachedNames = new Set([...cache.values()].map(item=>clean(item.name)));
  let userClub = [homeClub,awayClub].filter(Boolean).sort((a,b)=>{
    const ac = db.players.filter(player=>player.clubId===a.id && cachedNames.has(clean(player.name))).length;
    const bc = db.players.filter(player=>player.clubId===b.id && cachedNames.has(clean(player.name))).length;
    return bc-ac;
  })[0] || null;
  const userPlayers = userClub ? db.players.filter(player=>player.clubId===userClub.id && !player.isPlaceholder) : [];
  const allMatchPlayers = [homeClub,awayClub].filter(Boolean).flatMap(club=>db.players.filter(player=>player.clubId===club.id && !player.isPlaceholder));
  const byId = new Map(userPlayers.map(player=>[player.id,{goals:0,assists:0}]));
  let latest = null;

  for (const batch of goalBatches(live)) {
    const minute = batch.at(-1)?.querySelector('b')?.textContent?.trim() || '';
    const texts = batch.map(line=>line.querySelector('span')?.textContent?.trim() || '').filter(Boolean);
    const finalText = texts.at(-1) || '';
    let scorer = mentionedPlayer(finalText,allMatchPlayers);
    if (!scorer) scorer = mentionedPlayer(texts.join(' '),allMatchPlayers);
    let assist = null;
    if (scorer) {
      for (const text of texts.slice(0,-1)) {
        const candidate = mentionedPlayer(text,allMatchPlayers,scorer.id);
        if (candidate) { assist = candidate; break; }
      }
    }
    if (scorer && byId.has(scorer.id)) byId.get(scorer.id).goals += 1;
    if (assist && byId.has(assist.id)) byId.get(assist.id).assists += 1;
    latest = { scorer,assist,minute,texts,homeClub,awayClub };
  }
  return { byId,latest,userPlayers,userClub,homeClub,awayClub,allMatchPlayers };
}

function ensureRatingsView(live){
  const tabs = live.querySelector('.flm-cm-v2-tabs');
  const grid = live.querySelector('.flm-live-grid');
  if (!tabs || !grid) return null;
  let panel = grid.querySelector('.cm32-ratings-panel');
  if (!panel) {
    panel = document.createElement('section');
    panel.className = 'cm32-ratings-panel';
    panel.innerHTML = `
      <header class="cm32-ratings-head">
        <div><small>LIVE PERFORMANCE</small><h3>PLAYER RATINGS</h3></div>
        <span>Ratings update as the match changes</span>
      </header>
      <div class="cm32-ratings-columns">
        <span>#</span><span>POS</span><span>PLAYER</span><span>G</span><span>A</span><span>CON</span><span>RATING</span>
      </div>
      <div class="cm32-ratings-list" data-cm32-ratings-list></div>`;
    grid.appendChild(panel);
  }
  let button = tabs.querySelector('[data-cm32-view="ratings"]');
  if (!button) {
    button = document.createElement('button');
    button.type = 'button';
    button.textContent = 'PLAYER RATINGS';
    button.dataset.cm32View = 'ratings';
    const report = tabs.querySelector('[data-cm-v2-view="report"]');
    tabs.insertBefore(button,report || null);
    button.addEventListener('click',()=>{
      live.dataset.cmView = 'ratings';
      tabs.querySelectorAll('button').forEach(item=>item.classList.toggle('is-active',item===button));
      queue();
    });
    tabs.addEventListener('click',event=>{
      if (event.target === button) return;
      if (event.target.closest('button')) button.classList.remove('is-active');
    });
  }
  return panel;
}

function captureNativeRatings(live){
  if (live.dataset.cm32Capturing === '1') return;
  const modal = live.querySelector('[data-manager-modal]');
  if (!modal || modal.classList.contains('is-open')) return;
  const trigger = live.querySelector('[data-open-ratings]');
  if (!trigger || trigger.disabled) return;
  live.dataset.cm32Capturing = '1';
  live.classList.add('cm32-capturing');
  try {
    trigger.click();
    const dialog = live.querySelector('[data-manager-dialog]');
    const rows = [...dialog?.querySelectorAll('.flm-player-live-row') || []];
    const cache = ratingCache.get(live) || new Map();
    const activeNames = new Set();
    rows.forEach((row,index)=>{
      const parts = [...row.children];
      const position = parts[0]?.textContent?.trim() || '';
      const name = row.querySelector('strong')?.textContent?.trim() || '';
      const role = row.querySelector('small.role')?.textContent?.trim() || '';
      const conditionText = [...row.querySelectorAll('small')].map(node=>node.textContent || '').find(text=>/CON/i.test(text)) || '';
      const ratingText = row.querySelector('b')?.textContent?.trim() || '6.5';
      if (!name) return;
      activeNames.add(clean(name));
      cache.set(clean(name),{
        ...(cache.get(clean(name)) || {}),
        name,position,role,
        condition:Number(conditionText.replace(/[^0-9.]/g,'')) || 100,
        rating:Number(ratingText) || 6.5,
        active:true,
        order:cache.get(clean(name))?.order ?? index
      });
    });
    for (const item of cache.values()) item.active = activeNames.has(clean(item.name));
    ratingCache.set(live,cache);
    dialog?.querySelector('[data-close-manager]')?.click();
  } finally {
    live.classList.remove('cm32-capturing');
    delete live.dataset.cm32Capturing;
  }
}

function ratingClass(value){
  if (value >= 8) return 'elite';
  if (value >= 7) return 'good';
  if (value < 6) return 'poor';
  return 'steady';
}

async function renderRatings(live){
  const panel = ensureRatingsView(live);
  if (!panel) return;
  captureNativeRatings(live);
  const list = panel.querySelector('[data-cm32-ratings-list]');
  const cache = ratingCache.get(live) || new Map();
  const contributions = await contributionData(live);
  const db = await database();
  if (!db || !cache.size) {
    list.innerHTML = '<div class="cm32-ratings-empty">Live player data will appear once the match begins.</div>';
    return;
  }
  const userPlayers = contributions.userPlayers || [];
  const byName = new Map(userPlayers.map(player=>[clean(player.name),player]));
  const rows = [...cache.values()].map(item=>{
    const p = byName.get(clean(item.name));
    const contribution = p ? contributions.byId.get(p.id) : null;
    return {
      ...item,
      shirtNumber:p?.shirtNumber ?? '—',
      primaryPosition:p?.primaryPosition || item.position || '—',
      goals:contribution?.goals || 0,
      assists:contribution?.assists || 0
    };
  }).sort((a,b)=>a.order-b.order || a.name.localeCompare(b.name));

  list.innerHTML = rows.map(item=>`
    <div class="cm32-rating-row ${item.active?'is-playing':'is-off'}">
      <span class="number">${esc(item.shirtNumber)}</span>
      <span class="position">${esc(item.position || item.primaryPosition)}</span>
      <span class="player"><strong>${esc(item.name)}</strong><small>${item.active?'ON PITCH':'SUBBED OFF'}${item.role?` · ${esc(item.role)}`:''}</small></span>
      <span class="stat ${item.goals?'has-return':''}">${item.goals || '—'}</span>
      <span class="stat ${item.assists?'has-return':''}">${item.assists || '—'}</span>
      <span class="condition">${Math.round(item.condition)}%</span>
      <strong class="rating ${ratingClass(item.rating)}">${Number(item.rating).toFixed(1)}</strong>
    </div>`).join('');
}

function canonicalPosition(raw){
  const value = String(raw || '').toUpperCase().replace(/[()]/g,'').replace(/[^A-Z/,-]/g,'');
  const tokens = value.split(/[\/,-]+/).filter(Boolean);
  const out = new Set();
  for (const token of tokens.length ? tokens : [value]) {
    if (/^(GK)$/.test(token)) out.add('GK');
    else if (/^(RCB|CB|DC)$/.test(token)) out.add('CB');
    else if (/^(LCB)$/.test(token)) out.add('CB');
    else if (/^(RB|DR|RWB|WBR)$/.test(token)) out.add('RB');
    else if (/^(LB|DL|LWB|WBL)$/.test(token)) out.add('LB');
    else if (/^(RDM|LDM|DM|DMC)$/.test(token)) out.add('DM');
    else if (/^(RCM|LCM|CM|MC)$/.test(token)) out.add('CM');
    else if (/^(AM|AMC)$/.test(token)) out.add('AM');
    else if (/^(RAM|RW|AMR|MR|FR)$/.test(token)) out.add('RW');
    else if (/^(LAM|LW|AML|ML|FL)$/.test(token)) out.add('LW');
    else if (/^(RST|LST|ST|CF|FC|SC)$/.test(token)) out.add('ST');
    else if (token === 'RM') out.add('RW');
    else if (token === 'LM') out.add('LW');
  }
  return out.size ? out : new Set(['OTHER']);
}

function macro(pos){
  if (pos === 'GK') return 'GK';
  if (['CB','RB','LB'].includes(pos)) return 'DEF';
  if (['DM','CM','AM'].includes(pos)) return 'MID';
  if (['RW','LW','ST'].includes(pos)) return 'ATT';
  return 'OTHER';
}

function smartFit(outRaw,inRaw){
  const targets = canonicalPosition(outRaw);
  const options = canonicalPosition(inRaw);
  if (targets.has('GK')) return options.has('GK') ? {rank:0,label:'NATURAL FIT',cls:'natural'} : {rank:9,label:'GK REQUIRED',cls:'poor'};
  if (options.has('GK')) return {rank:9,label:'GOALKEEPER',cls:'poor'};
  for (const target of targets) if (options.has(target)) return {rank:0,label:'NATURAL FIT',cls:'natural'};
  const goodPairs = new Set([
    'RB:CB','LB:CB','CB:RB','CB:LB','CB:DM','DM:CB','DM:CM','CM:DM','CM:AM','AM:CM',
    'RW:AM','LW:AM','AM:RW','AM:LW','RW:ST','LW:ST','ST:RW','ST:LW','RB:RW','LB:LW','RW:RB','LW:LB'
  ]);
  for (const target of targets) for (const option of options) {
    if (goodPairs.has(`${target}:${option}`)) return {rank:1,label:'GOOD COVER',cls:'cover'};
  }
  for (const target of targets) for (const option of options) {
    if (macro(target) === macro(option) && macro(target) !== 'OTHER') return {rank:2,label:'EMERGENCY',cls:'emergency'};
  }
  return {rank:3,label:'OUT OF POSITION',cls:'poor'};
}

function polishSubPlan(dialog){
  const plan = dialog.querySelector('[data-v2-plan]');
  if (!plan) return;
  const out = dialog.querySelector('[data-v2-out-list] .v2-sub-player.is-selected-out');
  const incoming = dialog.querySelector('[data-v2-in-list] .v2-sub-player.is-selected-in');
  if (!out || !incoming) return;
  const get = row => ({
    pos:row.querySelector('.pos')?.textContent?.trim() || '—',
    name:row.querySelector('strong')?.textContent?.trim() || '—',
    condition:[...row.querySelectorAll('small')].map(n=>n.textContent?.trim()||'').find(value=>/%/.test(value)) || ''
  });
  const a = get(out), b = get(incoming);
  plan.innerHTML = `
    <div class="cm32-plan-player out"><span>OFF</span><b>${esc(a.pos)}</b><strong>${esc(a.name)}</strong><small>${esc(a.condition)}</small></div>
    <div class="cm32-plan-arrow">→</div>
    <div class="cm32-plan-player in"><span>ON</span><b>${esc(b.pos)}</b><strong>${esc(b.name)}</strong><small>${esc(b.condition)}</small></div>
    <em>READY TO CONFIRM</em>`;
}

function polishSubs(live){
  const dialog = live.querySelector('.flm-match-dialog.v2-sub-dialog');
  if (!dialog || !dialog.classList.contains('v2-sub-dialog')) return;
  const out = dialog.querySelector('[data-v2-out-list] .v2-sub-player.is-selected-out');
  const list = dialog.querySelector('[data-v2-in-list]');
  if (!list) return;
  if (out) {
    const outPos = out.querySelector('.pos')?.textContent?.trim() || '';
    const rows = [...list.querySelectorAll(':scope > .v2-sub-player')];
    const groups = new Map([[0,[]],[1,[]],[2,[]],[3,[]],[9,[]]]);
    rows.forEach(row=>{
      const inPos = row.querySelector('.pos')?.textContent?.trim() || '';
      const fit = smartFit(outPos,inPos);
      row.dataset.cm32Rank = String(fit.rank);
      const badge = row.querySelector('.v2-sub-fit');
      if (badge) {
        badge.textContent = fit.label;
        badge.className = `v2-sub-fit ${fit.cls}`;
      }
      (groups.get(fit.rank) || groups.get(3)).push(row);
    });
    list.querySelectorAll('.cm32-fit-group').forEach(node=>node.remove());
    const labels = {0:'NATURAL FIT',1:'GOOD COVER',2:'EMERGENCY OPTIONS',3:'OUT OF POSITION',9:'UNAVAILABLE'};
    for (const rank of [0,1,2,3,9]) {
      const members = groups.get(rank) || [];
      if (!members.length) continue;
      const head = document.createElement('div');
      head.className = `cm32-fit-group rank-${rank}`;
      head.textContent = labels[rank];
      list.appendChild(head);
      members.sort((a,b)=>{
        const an=a.querySelector('strong')?.textContent||'', bn=b.querySelector('strong')?.textContent||'';
        return an.localeCompare(bn);
      }).forEach(row=>list.appendChild(row));
    }
  }
  polishSubPlan(dialog);
  const apply = dialog.querySelector('[data-apply-sub]');
  if (apply) apply.textContent = 'CONFIRM SUBSTITUTION';
}

function currentGoalInfo(live,contributions){
  const batch = goalBatches(live).at(-1);
  if (!batch?.length) return null;
  const last = batch.at(-1);
  const minute = last.querySelector('b')?.textContent?.trim() || '';
  const score = `${live.querySelector('[data-home-score]')?.textContent || '0'}–${live.querySelector('[data-away-score]')?.textContent || '0'}`;
  const latest = contributions?.latest;
  const scorer = latest?.scorer;
  const assist = latest?.assist;
  const teamNames = [...live.querySelectorAll('.flm-live-team strong')].map(node=>node.textContent?.trim() || '');
  let side = last.dataset.cmSide;
  if (scorer && latest?.homeClub?.id === scorer.clubId) side = 'home';
  if (scorer && latest?.awayClub?.id === scorer.clubId) side = 'away';
  const team = side === 'away' ? teamNames[1] : teamNames[0];
  return { minute,score,scorer,assist,side,team,key:`${minute}|${score}|${scorer?.id || clean(last.textContent)}` };
}

async function showGoalIfNew(live){
  const contributions = await contributionData(live);
  const info = currentGoalInfo(live,contributions);
  if (!info) return;
  const previous = goalKeys.get(live);
  if (previous === info.key) return;
  goalKeys.set(live,info.key);
  let overlay = live.querySelector('.cm32-goal-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'cm32-goal-overlay';
    live.querySelector('.flm-live-grid > .flm-panel')?.appendChild(overlay);
  }
  const home = live.querySelectorAll('.flm-live-team strong')[0]?.textContent?.trim() || 'HOME';
  const away = live.querySelectorAll('.flm-live-team strong')[1]?.textContent?.trim() || 'AWAY';
  const colour = getComputedStyle(live).getPropertyValue(info.side === 'away' ? '--away-color' : '--home-color').trim() || '#d8aa35';
  overlay.style.setProperty('--cm32-goal-colour',colour);
  overlay.innerHTML = `
    <span class="cm32-goal-label">GOAL!</span>
    <strong>${esc(info.scorer?.name || info.team || 'GOAL')}</strong>
    <b>${esc(info.minute)}</b>
    <div class="cm32-goal-score"><span>${esc(home)}</span><em>${esc(info.score)}</em><span>${esc(away)}</span></div>
    <small>${info.assist ? `ASSIST · ${esc(info.assist.name)}` : 'UNASSISTED / ASSIST NOT RECORDED'}</small>`;
  overlay.classList.remove('is-visible');
  void overlay.offsetWidth;
  overlay.classList.add('is-visible');
  const scoreboard = live.querySelector('.flm-live-scoreboard');
  scoreboard?.classList.remove('cm32-score-bump');
  void scoreboard?.offsetWidth;
  scoreboard?.classList.add('cm32-score-bump');
  clearTimeout(live._cm32GoalTimer);
  live._cm32GoalTimer = setTimeout(()=>overlay.classList.remove('is-visible'),1850);
}

function polishEventCard(live){
  const card = live.querySelector('.flm-cm-v2-focus');
  const current = live.querySelector('[data-commentary-feed] .flm-commentary-line:last-child');
  if (!card || !current) return;
  const classes = ['goal','yellow','red','injury','save','miss','corner','substitution'];
  classes.forEach(type=>card.classList.toggle(`cm32-${type}`,current.classList.contains(type)));
  const text = card.querySelector('.flm-cm-v2-text');
  if (text) text.setAttribute('role','status');
}

async function sync(live){
  if (!live?.isConnected || live.dataset.cmMatchV3 !== '1') return;
  ensureStyles();
  live.dataset.cmPolish = '3.2';
  ensureRatingsView(live);
  polishEventCard(live);
  polishSubs(live);
  const hasGoal = [...live.querySelectorAll('[data-commentary-feed] .flm-commentary-line.goal')]
    .some(line=>/\bGOAL!|\bscores for\b/i.test(line.textContent || ''));
  if (hasGoal) showGoalIfNew(live);
  if (live.dataset.cmView === 'ratings') renderRatings(live);
}

function queue(){
  if (queued) return;
  queued = true;
  requestAnimationFrame(()=>{
    queued = false;
    document.querySelectorAll('.flm-live-match[data-cm-match-v3="1"]').forEach(sync);
  });
}

ensureStyles();
database();
window.addEventListener('flm:live-xg',queue);
new MutationObserver(queue).observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','data-cm-match-v3','data-cm-view']});
queue();
