const STYLE_HREF = './matchday-cm-v2.css?v=2.0.0';
let queued = false;
let databasePromise = null;

const TEAM_COLOURS = Object.freeze({
  'afc bournemouth': '#ef5a60',
  'bournemouth': '#ef5a60',
  'arsenal': '#ef4b55',
  'aston villa': '#de6b87',
  'brentford': '#ef5158',
  'brighton hove albion': '#57a9ff',
  'brighton and hove albion': '#57a9ff',
  'brighton': '#57a9ff',
  'chelsea': '#5c94ff',
  'coventry city': '#65bfff',
  'coventry': '#65bfff',
  'crystal palace': '#638cff',
  'everton': '#5f86ff',
  'fulham': '#f1eee6',
  'hull city': '#f2b63f',
  'hull': '#f2b63f',
  'ipswich town': '#668cff',
  'ipswich': '#668cff',
  'leeds united': '#f2efe7',
  'leeds': '#f2efe7',
  'liverpool': '#ff5964',
  'manchester city': '#72c9eb',
  'man city': '#72c9eb',
  'manchester united': '#f05259',
  'man united': '#f05259',
  'newcastle united': '#e8e8e4',
  'newcastle': '#e8e8e4',
  'nottingham forest': '#ee5057',
  'nottm forest': '#ee5057',
  'sunderland': '#ef565c',
  'tottenham hotspur': '#dce8ff',
  'tottenham': '#dce8ff',
  'spurs': '#dce8ff'
});

const esc = value => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

function clean(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function hash(value) {
  let result = 0;
  for (const char of String(value || '')) result = ((result << 5) - result + char.charCodeAt(0)) | 0;
  return Math.abs(result);
}

function colourFor(teamName) {
  const key = clean(teamName);
  if (TEAM_COLOURS[key]) return TEAM_COLOURS[key];
  const match = Object.keys(TEAM_COLOURS).find(name => key.includes(name) || name.includes(key));
  if (match) return TEAM_COLOURS[match];
  return `hsl(${hash(key) % 360} 72% 70%)`;
}

function ensureStyles() {
  if ([...document.styleSheets].some(sheet => sheet.href?.includes('matchday-cm-v2.css'))) return;
  const old = [...document.querySelectorAll('link[rel="stylesheet"]')].find(link => link.href?.includes('matchday-cm-v1.css'));
  if (old) old.disabled = true;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = STYLE_HREF;
  document.head.appendChild(link);
}

function button(label, className = '') {
  const node = document.createElement('button');
  node.type = 'button';
  node.textContent = label;
  if (className) node.className = className;
  return node;
}

function manager() { return window.FLMManager; }

async function database() {
  if (!databasePromise) {
    databasePromise = Promise.resolve(manager()?.loadDatabase?.()).catch(() => null);
  }
  return databasePromise;
}

function findClub(db, displayName) {
  if (!db?.clubs?.length) return null;
  const key = clean(displayName);
  return db.clubs.find(club => [club.name, club.shortName, club.providerName].filter(Boolean).some(name => clean(name) === key))
    || db.clubs.find(club => [club.name, club.shortName, club.providerName].filter(Boolean).some(name => {
      const candidate = clean(name);
      return candidate && (candidate.includes(key) || key.includes(candidate));
    }))
    || null;
}

function playerAliases(name) {
  const raw = String(name || '').trim();
  const cleaned = clean(raw);
  if (!cleaned) return [];
  const parts = cleaned.split(' ');
  const aliases = new Set([cleaned]);
  const last = parts.at(-1);
  if (last?.length >= 4) aliases.add(last);
  if (parts.length >= 3) {
    const lastTwo = parts.slice(-2).join(' ');
    if (lastTwo.length >= 7) aliases.add(lastTwo);
  }
  return [...aliases];
}

function mentions(text, aliases) {
  const haystack = ` ${clean(text)} `;
  return aliases.some(alias => haystack.includes(` ${alias} `));
}

async function hydrateContext(live) {
  if (live._cmV2Context?.ready) return live._cmV2Context;
  const teams = [...live.querySelectorAll('.flm-live-team strong')];
  const homeName = teams[0]?.textContent?.trim() || 'Home';
  const awayName = teams[1]?.textContent?.trim() || 'Away';
  const context = live._cmV2Context || {
    ready: false,
    homeName,
    awayName,
    homeColour: colourFor(homeName),
    awayColour: colourFor(awayName),
    homeAliases: [],
    awayAliases: []
  };
  live._cmV2Context = context;
  live.style.setProperty('--home-color', context.homeColour);
  live.style.setProperty('--away-color', context.awayColour);

  const db = await database();
  if (!db) return context;
  const homeClub = findClub(db, homeName);
  const awayClub = findClub(db, awayName);
  const aliasesForClub = clubId => (db.players || [])
    .filter(player => player.clubId === clubId && !player.isPlaceholder)
    .flatMap(player => playerAliases(player.name));
  context.homeAliases = homeClub ? aliasesForClub(homeClub.id) : [];
  context.awayAliases = awayClub ? aliasesForClub(awayClub.id) : [];
  context.ready = true;
  updateCommentary(live);
  return context;
}

function classifyLine(line, context, previousSide = 'neutral') {
  const text = line.querySelector('span')?.textContent || line.textContent || '';
  const normal = clean(text);
  if (/half time|full time|kick off|match paused|second half/.test(normal)) return 'neutral';

  const homeTeam = clean(context.homeName);
  const awayTeam = clean(context.awayName);
  if (homeTeam && normal.includes(homeTeam)) return 'home';
  if (awayTeam && normal.includes(awayTeam)) return 'away';

  let home = 0;
  let away = 0;
  for (const alias of context.homeAliases || []) if (mentions(text, [alias])) home += alias.includes(' ') ? 3 : 1;
  for (const alias of context.awayAliases || []) if (mentions(text, [alias])) away += alias.includes(' ') ? 3 : 1;
  if (home > away) return 'home';
  if (away > home) return 'away';
  return previousSide;
}

function focusCard(live) {
  let card = live.querySelector('.flm-cm-v2-focus');
  if (card) return card;
  const feed = live.querySelector('[data-commentary-feed]');
  const panel = feed?.closest('.flm-panel');
  if (!feed || !panel) return null;
  card = document.createElement('div');
  card.className = 'flm-cm-v2-focus is-neutral';
  card.innerHTML = '<span class="flm-cm-v2-team">MATCH IN PROGRESS</span><b class="flm-cm-v2-minute">0\'</b><div class="flm-cm-v2-text">Waiting for the next passage of play...</div>';
  feed.before(card);
  return card;
}

function updateCommentary(live) {
  if (!live?.isConnected) return;
  const context = live._cmV2Context || {
    homeName: live.querySelectorAll('.flm-live-team strong')[0]?.textContent?.trim() || 'Home',
    awayName: live.querySelectorAll('.flm-live-team strong')[1]?.textContent?.trim() || 'Away',
    homeColour: getComputedStyle(live).getPropertyValue('--home-color').trim() || '#ef535b',
    awayColour: getComputedStyle(live).getPropertyValue('--away-color').trim() || '#6aa9ff',
    homeAliases: [], awayAliases: []
  };
  const lines = [...live.querySelectorAll('[data-commentary-feed] .flm-commentary-line')];
  if (!lines.length) return;

  let previousSide = live.dataset.cmPossessionSide || 'neutral';
  lines.forEach((line, index) => {
    const side = classifyLine(line, context, previousSide);
    if (side !== 'neutral') previousSide = side;
    line.dataset.cmSide = side;
    const colour = side === 'home' ? context.homeColour : side === 'away' ? context.awayColour : '#d9d2c6';
    line.style.setProperty('--line-color', colour);
    line.classList.toggle('is-recent', index >= Math.max(0, lines.length - 4));
    line.classList.toggle('is-current', index === lines.length - 1);
  });
  live.dataset.cmPossessionSide = previousSide;

  const current = lines.at(-1);
  const side = current.dataset.cmSide || 'neutral';
  const colour = side === 'home' ? context.homeColour : side === 'away' ? context.awayColour : '#f0cd69';
  const team = side === 'home' ? context.homeName : side === 'away' ? context.awayName : 'MATCH UPDATE';
  const minute = current.querySelector('b')?.textContent?.trim() || live.querySelector('[data-live-clock]')?.textContent?.trim() || '';
  const text = current.querySelector('span')?.textContent?.trim() || current.textContent?.trim() || '';
  const card = focusCard(live);
  if (card) {
    card.style.setProperty('--event-color', colour);
    card.classList.toggle('is-neutral', side === 'neutral');
    card.classList.toggle('is-goal', current.classList.contains('goal'));
    card.querySelector('.flm-cm-v2-team').textContent = team;
    card.querySelector('.flm-cm-v2-minute').textContent = minute;
    card.querySelector('.flm-cm-v2-text').textContent = text;
  }
  live.style.setProperty('--active-team-color', colour);
}

function setView(live, view) {
  live.dataset.cmView = view;
  live.querySelectorAll('[data-cm-v2-view]').forEach(item => item.classList.toggle('is-active', item.dataset.cmV2View === view));
}

function syncControls(live) {
  const pause = live.querySelector('[data-cm-v2-pause]');
  const paused = live.querySelector('[data-match-speed="0"]')?.classList.contains('is-active');
  const halfTime = live.classList.contains('is-half-time');
  const fullTime = live.classList.contains('is-full-time');
  if (pause) {
    pause.textContent = fullTime ? 'FULL TIME' : halfTime ? 'HALF TIME' : paused ? 'RESUME MATCH' : 'PAUSE MATCH';
    pause.disabled = fullTime || halfTime;
    pause.classList.toggle('is-paused', Boolean(paused));
  }
  live.querySelectorAll('[data-cm-v2-speed]').forEach(item => {
    const native = live.querySelector(`[data-match-speed="${item.dataset.cmV2Speed}"]`);
    item.classList.toggle('is-active', Boolean(native?.classList.contains('is-active')));
  });
}

function enhanceLiveMatch(live) {
  if (!live || live.dataset.cmMatchV2 === '1') return;
  const scoreboard = live.querySelector('.flm-live-scoreboard');
  const grid = live.querySelector('.flm-live-grid');
  if (!scoreboard || !grid) return;

  live.dataset.cmMatchV2 = '1';
  live.dataset.cmView = 'overview';
  hydrateContext(live);

  const tabs = document.createElement('nav');
  tabs.className = 'flm-cm-v2-tabs';
  tabs.setAttribute('aria-label', 'Match centre');
  [
    ['overview', 'MATCH OVERVIEW'],
    ['stats', 'MATCH STATS'],
    ['tactics', 'TACTICS'],
    ['report', 'MATCH REPORT']
  ].forEach(([id, label]) => {
    const item = button(label, id === 'overview' ? 'is-active' : '');
    item.dataset.cmV2View = id;
    item.addEventListener('click', () => {
      if (id === 'tactics') {
        live.querySelector('[data-open-tactics]')?.click();
        return;
      }
      setView(live, id);
    });
    tabs.appendChild(item);
  });
  scoreboard.after(tabs);

  const controls = document.createElement('div');
  controls.className = 'flm-cm-v2-controls';
  const pause = button('PAUSE MATCH', 'flm-cm-v2-primary');
  pause.dataset.cmV2Pause = '1';
  pause.addEventListener('click', () => {
    const paused = live.querySelector('[data-match-speed="0"]')?.classList.contains('is-active');
    live.querySelector(`[data-match-speed="${paused ? '1' : '0'}"]`)?.click();
    setTimeout(() => syncControls(live), 0);
  });
  controls.appendChild(pause);

  const subs = button('MAKE SUB');
  subs.addEventListener('click', () => live.querySelector('[data-open-subs]')?.click());
  controls.appendChild(subs);

  const tactics = button('TACTICS');
  tactics.addEventListener('click', () => live.querySelector('[data-open-tactics]')?.click());
  controls.appendChild(tactics);

  const speedLabel = document.createElement('span');
  speedLabel.className = 'flm-cm-v2-speed-label';
  speedLabel.textContent = 'SPEED';
  controls.appendChild(speedLabel);
  [1, 2, 4].forEach(value => {
    const item = button(`${value}×`);
    item.dataset.cmV2Speed = String(value);
    item.addEventListener('click', () => {
      live.querySelector(`[data-match-speed="${value}"]`)?.click();
      setTimeout(() => syncControls(live), 0);
    });
    controls.appendChild(item);
  });
  tabs.after(controls);

  focusCard(live);
  updateCommentary(live);
  syncControls(live);

  const feed = live.querySelector('[data-commentary-feed]');
  if (feed) new MutationObserver(() => updateCommentary(live)).observe(feed, { childList: true, subtree: true, characterData: true });
  new MutationObserver(() => syncControls(live)).observe(live, { attributes: true, attributeFilter: ['class'] });
}

function optionData(option) {
  const parts = String(option?.textContent || '').split('·').map(part => part.trim());
  return {
    id: option?.value || '',
    name: parts[0] || option?.value || '',
    position: parts[1] || '',
    condition: parts[2] || ''
  };
}

function positionFamily(code) {
  const value = String(code || '').toUpperCase().replace(/[^A-Z]/g, '');
  if (value.includes('GK')) return 'GK';
  if (/(RCB|LCB|CB|DC)/.test(value)) return 'CB';
  if (/(RWB|LWB|WBR|WBL|RB|LB|DR|DL)/.test(value)) return 'FB';
  if (/(RDM|LDM|DMC|DM|RCM|LCM|MC|CM|AMC|AM)/.test(value)) return 'MID';
  if (/(AMR|AML|MR|ML|RW|LW|FR|FL)/.test(value)) return 'W';
  if (/(RST|LST|ST|CF|FC|SC)/.test(value)) return 'ST';
  return 'OTHER';
}

function fitFor(outgoing, incoming) {
  const out = positionFamily(outgoing.position);
  const inside = positionFamily(incoming.position);
  if (out === 'GK') return inside === 'GK'
    ? { rank: 0, label: 'GOALKEEPER', className: 'natural', allowed: true }
    : { rank: 99, label: 'GK REQUIRED', className: 'poor', allowed: false };
  if (inside === 'GK') return { rank: 98, label: 'GOALKEEPER', className: 'poor', allowed: false };
  if (out === inside) return { rank: 0, label: 'NATURAL FIT', className: 'natural', allowed: true };
  const related = (out === 'CB' && inside === 'FB') || (out === 'FB' && inside === 'CB')
    || (out === 'MID' && inside === 'W') || (out === 'W' && inside === 'MID')
    || (out === 'W' && inside === 'ST') || (out === 'ST' && inside === 'W');
  if (related) return { rank: 1, label: 'CAN COVER', className: 'cover', allowed: true };
  return { rank: 2, label: 'OUT OF POSITION', className: 'poor', allowed: true };
}

function enhanceSubDialog(dialog) {
  const off = dialog.querySelector('[data-sub-out]');
  const on = dialog.querySelector('[data-sub-in]');
  const apply = dialog.querySelector('[data-apply-sub]');
  if (!off || !on || !apply || dialog.querySelector('.v2-sub-shell')) return;

  dialog.classList.add('v2-sub-dialog');
  apply.textContent = 'CONFIRM SUBSTITUTION';
  apply.disabled = true;

  const outgoing = [...off.options].map(optionData);
  const incoming = [...on.options].map(optionData);
  let selectedOut = null;
  let selectedIn = null;

  const shell = document.createElement('section');
  shell.className = 'v2-sub-shell';
  shell.innerHTML = `
    <div class="v2-sub-column">
      <div class="v2-sub-column-head"><strong>1 · PLAYER OFF</strong><span>Choose from your XI</span></div>
      <div class="v2-sub-list" data-v2-out-list></div>
    </div>
    <div class="v2-sub-column">
      <div class="v2-sub-column-head"><strong>2 · PLAYER ON</strong><span data-v2-bench-help>Select player off first</span></div>
      <div class="v2-sub-list" data-v2-in-list></div>
    </div>
    <div class="v2-sub-plan" data-v2-plan>
      <div><span>PLANNED CHANGE</span><strong>Select a player to take off.</strong></div>
      <em>SUBSTITUTION NOT READY</em>
    </div>`;
  dialog.querySelector('.flm-dialog-actions')?.before(shell);

  const outList = shell.querySelector('[data-v2-out-list]');
  const inList = shell.querySelector('[data-v2-in-list]');
  const help = shell.querySelector('[data-v2-bench-help]');
  const plan = shell.querySelector('[data-v2-plan]');

  function drawPlan() {
    if (!selectedOut) {
      plan.innerHTML = '<div><span>PLANNED CHANGE</span><strong>Select a player to take off.</strong></div><em>SUBSTITUTION NOT READY</em>';
      apply.disabled = true;
      return;
    }
    if (!selectedIn) {
      const keeper = positionFamily(selectedOut.position) === 'GK';
      plan.innerHTML = `<div><span>PLAYER OFF</span><strong><b class="out">OUT · ${esc(selectedOut.name)}</b></strong></div><em>${keeper ? 'SELECT A GOALKEEPER' : 'SELECT A REPLACEMENT'}</em>`;
      apply.disabled = true;
      return;
    }
    plan.innerHTML = `<div><span>PLANNED CHANGE</span><strong><b class="in">IN · ${esc(selectedIn.name)}</b> &nbsp;→&nbsp; <b class="out">OUT · ${esc(selectedOut.name)}</b></strong></div><em>READY TO CONFIRM</em>`;
    apply.disabled = false;
  }

  function drawIncoming() {
    inList.innerHTML = '';
    if (!selectedOut) {
      inList.innerHTML = '<div class="v2-sub-empty">Select the player you want to take off. Football Lab will then rank the bench by positional fit.</div>';
      help.textContent = 'Select player off first';
      return;
    }
    const ranked = incoming
      .map(item => ({ item, fit: fitFor(selectedOut, item) }))
      .sort((a, b) => a.fit.rank - b.fit.rank || a.item.name.localeCompare(b.item.name));
    const anyAllowed = ranked.some(entry => entry.fit.allowed);
    help.textContent = positionFamily(selectedOut.position) === 'GK'
      ? (anyAllowed ? 'Only goalkeepers can replace your goalkeeper' : 'No goalkeeper available on bench')
      : 'Best positional fits shown first';
    if (!ranked.length) {
      inList.innerHTML = '<div class="v2-sub-empty">No substitutes are available.</div>';
      return;
    }
    ranked.forEach(({ item, fit }) => {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = `v2-sub-player ${selectedIn?.id === item.id ? 'is-selected-in' : ''}`;
      row.disabled = !fit.allowed;
      row.innerHTML = `<span class="pos">${esc(item.position || 'SUB')}</span><span><strong>${esc(item.name)}</strong><small class="v2-sub-fit ${fit.className}">${esc(fit.label)}</small></span><small>${esc(item.condition || '')}</small>`;
      row.addEventListener('click', () => {
        if (!fit.allowed) return;
        selectedIn = item;
        on.value = item.id;
        drawIncoming();
        drawPlan();
      });
      inList.appendChild(row);
    });
  }

  outgoing.forEach(item => {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = `v2-sub-player ${selectedOut?.id === item.id ? 'is-selected-out' : ''}`;
    row.innerHTML = `<span class="pos">${esc(item.position || 'XI')}</span><strong>${esc(item.name)}</strong><small>${esc(item.condition || '')}</small>`;
    row.addEventListener('click', () => {
      selectedOut = item;
      selectedIn = null;
      off.value = item.id;
      [...outList.children].forEach(child => child.classList.toggle('is-selected-out', child === row));
      drawIncoming();
      drawPlan();
    });
    outList.appendChild(row);
  });

  drawIncoming();
  drawPlan();
}

function enhanceOpenDialog() {
  const dialog = document.querySelector('[data-manager-dialog]');
  if (dialog) enhanceSubDialog(dialog);
}

function queueEnhance() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    ensureStyles();
    const live = document.querySelector('[data-live-match]');
    if (live) {
      enhanceLiveMatch(live);
      updateCommentary(live);
    }
    enhanceOpenDialog();
  });
}

new MutationObserver(queueEnhance).observe(document.body, { childList: true, subtree: true });
queueEnhance();
