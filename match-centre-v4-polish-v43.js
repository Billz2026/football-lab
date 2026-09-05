const STYLE_HREF = './match-centre-v4-polish-v43.css?v=4.3.0';

function ensureStyles(){
  if ([...document.styleSheets].some(sheet => sheet.href?.includes('match-centre-v4-polish-v43.css'))) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = STYLE_HREF;
  document.head.appendChild(link);
}

const clean = value => String(value || '').replace(/\s+/g,' ').trim();

function fullTime(live){
  const clock = clean(live.querySelector('[data-live-clock]')?.textContent || live.querySelector('[data-cm4-clock]')?.textContent);
  return live.classList.contains('is-full-time') || /^90:00$/.test(clock);
}

function resultText(shell){
  const home = clean(shell.querySelector('[data-cm4-home-name]')?.textContent) || 'Home';
  const away = clean(shell.querySelector('[data-cm4-away-name]')?.textContent) || 'Away';
  const hs = clean(shell.querySelector('[data-cm4-home-score]')?.textContent) || '0';
  const as = clean(shell.querySelector('[data-cm4-away-score]')?.textContent) || '0';
  return `${home} ${hs}–${as} ${away}`;
}

function syncCompetition(shell){
  const career = window.FLMManager?.activeCareer;
  const comp = shell.querySelector('[data-cm4-comp]');
  if (!comp || !career) return;
  if (career.preseason?.phase && career.preseason.phase !== 'complete') {
    comp.textContent = 'Pre-Season Friendly';
  }
}

function syncFullTime(live,shell){
  const isFullTime = fullTime(live);
  live.dataset.cm43FullTime = isFullTime ? '1' : '0';
  if (!isFullTime) return;

  const pause = shell.querySelector('[data-cm4-pause]');
  if (pause) {
    pause.textContent = 'Continue';
    pause.disabled = false;
    pause.classList.add('cm43-continue');
  }

  const event = shell.querySelector('[data-cm4-event]');
  const textNode = event?.querySelector('[data-cm4-event-text]');
  const minute = event?.querySelector('[data-cm4-event-minute]');
  const team = event?.querySelector('[data-cm4-event-team]');
  const result = `FULL TIME · ${resultText(shell)}`;
  if (event) event.className = 'cm4-event is-neutral cm43-full-time-event';
  if (minute) minute.textContent = "90'";
  if (team) team.textContent = 'FULL TIME';
  if (textNode) {
    textNode.textContent = result;
    textNode.dataset.cm41Text = result;
  }
}

function syncSubs(live){
  const dialog = live.querySelector('.flm-match-dialog.v2-sub-dialog');
  if (!dialog) return;
  dialog.dataset.cm43 = '1';
}

function enhance(live){
  if (!live?.isConnected || live.dataset.cm4 !== '1') return;
  const shell = live.querySelector(':scope > .cm4-shell');
  if (!shell) return;
  shell.dataset.cm43 = '1';
  syncCompetition(shell);
  syncFullTime(live,shell);
  syncSubs(live);
}

ensureStyles();

// At full time the visible V4 rail owns the exit. Bridge it to the native
// completion button so the calling career/pre-season screen can resume normally.
document.addEventListener('click',event => {
  const button = event.target.closest?.('[data-cm4-pause]');
  if (!button) return;
  const live = button.closest('.flm-live-match[data-cm4="1"]');
  if (!live || !fullTime(live)) return;
  const finish = live.querySelector('[data-finish-live-match]');
  if (!finish) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  finish.click();
},true);

// A light poll avoids another broad MutationObserver feedback loop while keeping
// the full-time bridge and responsive management styling in sync with legacy layers.
setInterval(() => document.querySelectorAll('.flm-live-match[data-cm4="1"]').forEach(enhance),160);
