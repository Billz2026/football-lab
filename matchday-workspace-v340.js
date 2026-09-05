const STYLE_HREF = './matchday-workspace-v340.css?v=3.4.0';
let queued = false;

const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
const esc = value => String(value ?? '')
  .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
  .replaceAll('"','&quot;').replaceAll("'",'&#039;');

function ensureStyles(){
  if ([...document.styleSheets].some(sheet => sheet.href?.includes('matchday-workspace-v340.css'))) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = STYLE_HREF;
  document.head.appendChild(link);
}

function nativeViewButton(live, view){
  if (view === 'zones') return live.querySelector('[data-cm31-view="zones"]');
  if (view === 'ratings') return live.querySelector('[data-cm32-view="ratings"]');
  return live.querySelector(`[data-cm-v2-view="${view}"]`);
}

function selectView(live, view){
  const native = nativeViewButton(live, view);
  if (native) native.click();
  else live.dataset.cmView = view;
  queue();
}

function ensureRail(live){
  let rail = live.querySelector(':scope > .cm340-nav');
  if (rail) return rail;
  const scoreboard = live.querySelector(':scope > .flm-live-scoreboard');
  if (!scoreboard) return null;
  rail = document.createElement('aside');
  rail.className = 'cm340-nav';
  rail.setAttribute('aria-label','Match Centre navigation');
  rail.innerHTML = `
    <div class="cm340-nav-context">
      <small>MATCH CENTRE</small>
      <strong data-cm340-mini-score>0–0</strong>
      <span data-cm340-mini-clock>00:00</span>
    </div>
    <div class="cm340-nav-section">
      <small>VIEW</small>
      <button type="button" data-cm340-view="overview">Overview</button>
      <button type="button" data-cm340-view="stats">Stats</button>
      <button type="button" data-cm340-view="zones">Action Zones</button>
      <button type="button" data-cm340-view="ratings">Player Ratings</button>
      <button type="button" data-cm340-view="report">Match Report</button>
    </div>
    <div class="cm340-nav-section cm340-manage">
      <small>MANAGE</small>
      <button type="button" data-cm340-subs>Make Sub</button>
      <button type="button" data-cm340-tactics>Tactics</button>
    </div>
    <div class="cm340-nav-section cm340-speed">
      <small>MATCH SPEED</small>
      <button type="button" data-cm340-pause>Pause</button>
      <div>
        <button type="button" data-cm340-speed="1">1×</button>
        <button type="button" data-cm340-speed="2">2×</button>
        <button type="button" data-cm340-speed="4">4×</button>
      </div>
    </div>`;
  scoreboard.after(rail);

  rail.querySelectorAll('[data-cm340-view]').forEach(button => {
    button.addEventListener('click', () => selectView(live, button.dataset.cm340View));
  });
  rail.querySelector('[data-cm340-subs]')?.addEventListener('click', () => live.querySelector('[data-open-subs]')?.click());
  rail.querySelector('[data-cm340-tactics]')?.addEventListener('click', () => live.querySelector('[data-open-tactics]')?.click());
  rail.querySelector('[data-cm340-pause]')?.addEventListener('click', () => {
    const paused = live.querySelector('[data-match-speed="0"]')?.classList.contains('is-active');
    live.querySelector(`[data-match-speed="${paused ? '1' : '0'}"]`)?.click();
    queue();
  });
  rail.querySelectorAll('[data-cm340-speed]').forEach(button => {
    button.addEventListener('click', () => {
      live.querySelector(`[data-match-speed="${button.dataset.cm340Speed}"]`)?.click();
      queue();
    });
  });
  return rail;
}

function syncRail(live, rail){
  if (!rail) return;
  const view = live.dataset.cmView || 'overview';
  rail.querySelectorAll('[data-cm340-view]').forEach(button => {
    const active = button.dataset.cm340View === view;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-current', active ? 'page' : 'false');
  });
  const scores = live.querySelectorAll('.flm-live-score b');
  const score = `${clean(scores[0]?.textContent) || '0'}–${clean(scores[1]?.textContent) || '0'}`;
  const clock = clean(live.querySelector('[data-live-clock]')?.textContent) || '00:00';
  const scoreNode = rail.querySelector('[data-cm340-mini-score]');
  const clockNode = rail.querySelector('[data-cm340-mini-clock]');
  if (scoreNode && scoreNode.textContent !== score) scoreNode.textContent = score;
  if (clockNode && clockNode.textContent !== clock) clockNode.textContent = clock;

  const paused = live.querySelector('[data-match-speed="0"]')?.classList.contains('is-active');
  const pause = rail.querySelector('[data-cm340-pause]');
  if (pause) {
    pause.textContent = live.classList.contains('is-full-time') ? 'Full Time' : paused ? 'Resume' : 'Pause';
    pause.classList.toggle('is-active', Boolean(paused));
  }
  rail.querySelectorAll('[data-cm340-speed]').forEach(button => {
    const native = live.querySelector(`[data-match-speed="${button.dataset.cm340Speed}"]`);
    button.classList.toggle('is-active', Boolean(native?.classList.contains('is-active')));
  });
}

function ensureSequence(live){
  const centre = live.querySelector('.cm33-centre');
  if (!centre) return null;
  let sequence = centre.querySelector('.cm340-sequence');
  if (sequence) return sequence;
  sequence = document.createElement('section');
  sequence.className = 'cm340-sequence';
  sequence.innerHTML = '<small>PASSAGE OF PLAY</small><div data-cm340-sequence-steps><span>Waiting for the next sequence...</span></div>';
  const latest = centre.querySelector('.cm33-latest');
  if (latest) latest.after(sequence);
  else centre.prepend(sequence);
  return sequence;
}

function syncSequence(live){
  const sequence = ensureSequence(live);
  if (!sequence) return;
  const rows = [...live.querySelectorAll('.cm33-feed .cm33-line')];
  if (!rows.length) return;
  const recent = rows.slice(-7);
  const current = recent.at(-1);
  const side = current?.classList.contains('home') ? 'home' : current?.classList.contains('away') ? 'away' : 'neutral';
  let chosen = recent.filter(row => side === 'neutral' || row.classList.contains(side)).slice(-4);
  if (chosen.length < 2) chosen = recent.slice(-3);
  const steps = chosen.map(row => clean(row.querySelector('span')?.textContent)).filter(Boolean);
  if (!steps.length) return;
  const signature = steps.join('||');
  const host = sequence.querySelector('[data-cm340-sequence-steps]');
  if (!host || host.dataset.signature === signature) return;
  host.dataset.signature = signature;
  host.innerHTML = steps.map((text,index) => `<span${index === steps.length - 1 ? ' class="is-current"' : ''}>${esc(text)}</span>`).join('<i aria-hidden="true">→</i>');
  sequence.dataset.side = side;
}

function syncRatingMinutes(live){
  if (live.dataset.cmView !== 'ratings') return;
  const snapshot = window.__flmLiveStateV332;
  if (!snapshot) return;
  live.querySelectorAll('.cm332-ratings-teams .cm332-rating-head').forEach(head => {
    if (head.querySelector('.cm340-min-head')) return;
    const pos = head.children[2];
    const cell = document.createElement('span');
    cell.className = 'cm340-min-head';
    cell.textContent = 'MIN';
    pos?.after(cell);
  });
  live.querySelectorAll('.cm333-rating-row[data-player-id]').forEach(row => {
    const id = row.dataset.playerId;
    let cell = row.querySelector('.cm340-min');
    if (!cell) {
      cell = document.createElement('span');
      cell.className = 'cm340-min';
      row.querySelector('.cm333-pos')?.after(cell);
    }
    const recorded = Number(snapshot.minutesPlayed?.[id]);
    const fallback = Number(snapshot.minute) || 0;
    const minutes = Number.isFinite(recorded) && recorded >= 0 ? recorded : fallback;
    const label = `${Math.max(0, Math.min(120, Math.round(minutes)))}'`;
    if (cell.textContent !== label) cell.textContent = label;
  });
}

function enhanceSubBoard(live){
  const dialog = live.querySelector('.flm-match-dialog.v2-sub-dialog');
  const shell = dialog?.querySelector('.v2-sub-shell');
  if (!dialog || !shell) return;
  dialog.classList.add('cm340-sub-dialog');
  shell.classList.add('cm340-squad-board');

  let summary = dialog.querySelector('.cm340-sub-summary');
  if (!summary) {
    summary = document.createElement('div');
    summary.className = 'cm340-sub-summary';
    summary.innerHTML = `
      <div><small>MATCHDAY SQUAD</small><strong>SUBSTITUTION BOARD</strong></div>
      <div class="cm340-sub-context"><span data-cm340-sub-score>0–0</span><b data-cm340-sub-clock>00:00</b></div>
      <p>Select the player leaving the XI, then choose the replacement from the bench.</p>`;
    shell.before(summary);
  }
  const scores = live.querySelectorAll('.flm-live-score b');
  const score = `${clean(scores[0]?.textContent) || '0'}–${clean(scores[1]?.textContent) || '0'}`;
  const clock = clean(live.querySelector('[data-live-clock]')?.textContent) || '00:00';
  const scoreNode = summary.querySelector('[data-cm340-sub-score]');
  const clockNode = summary.querySelector('[data-cm340-sub-clock]');
  if (scoreNode && scoreNode.textContent !== score) scoreNode.textContent = score;
  if (clockNode && clockNode.textContent !== clock) clockNode.textContent = clock;

  const columns = shell.querySelectorAll('.v2-sub-column');
  if (columns[0]) {
    const title = columns[0].querySelector('.v2-sub-column-head strong');
    const hint = columns[0].querySelector('.v2-sub-column-head span');
    if (title && title.textContent !== 'STARTING XI · PLAYER OFF') title.textContent = 'STARTING XI · PLAYER OFF';
    if (hint && hint.textContent !== 'Choose the player leaving the pitch') hint.textContent = 'Choose the player leaving the pitch';
  }
  if (columns[1]) {
    const title = columns[1].querySelector('.v2-sub-column-head strong');
    if (title && title.textContent !== 'BENCH · PLAYER ON') title.textContent = 'BENCH · PLAYER ON';
  }
  shell.querySelectorAll('[data-v2-out-list] > .v2-sub-player').forEach((row,index) => row.dataset.cm340Row = String(index + 1));
  shell.querySelectorAll('[data-v2-in-list] > .v2-sub-player').forEach((row,index) => row.dataset.cm340Row = String(index + 1));
}

async function enhance(live){
  if (!live?.isConnected) return;
  live.dataset.cmWorkspace = '3.4.0';
  const rail = ensureRail(live);
  syncRail(live, rail);
  syncSequence(live);
  syncRatingMinutes(live);
  enhanceSubBoard(live);
}

function queue(){
  if (queued) return;
  queued = true;
  requestAnimationFrame(async () => {
    queued = false;
    ensureStyles();
    for (const live of document.querySelectorAll('[data-live-match], .flm-live-match')) await enhance(live);
  });
}

ensureStyles();
queue();
new MutationObserver(queue).observe(document.documentElement, {
  childList:true,
  subtree:true,
  characterData:true,
  attributes:true,
  attributeFilter:['class','data-cm-view']
});