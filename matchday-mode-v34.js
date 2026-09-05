const STYLE_HREF = './matchday-mode-v34.css?v=3.4.0';
let queued = false;

const clean = value => String(value || '').replace(/\s+/g, ' ').trim();

function ensureStyles(){
  if ([...document.styleSheets].some(sheet => sheet.href?.includes('matchday-mode-v34.css'))) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = STYLE_HREF;
  document.head.appendChild(link);
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

function syncRatingsHeader(live){
  const panel = live.querySelector('.cm33-ratings-panel');
  if (!panel) return;
  const teams = [...live.querySelectorAll('.flm-live-team strong')].map(node => clean(node.textContent));
  const header = panel.querySelector('.cm33-ratings-head');
  if (!header) return;
  const note = header.querySelector(':scope > span');
  if (note) note.textContent = `${teams[0] || 'HOME'} · live XI ratings`;
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

function sync(live){
  if (!live?.isConnected || live.dataset.cmConsole !== '3.3') return;
  ensureStyles();
  enterMatchMode(live);
  syncRail(live);
  syncCommentary(live);
  syncPressure(live);
  syncManagerWorkspace(live);
  syncRatingsHeader(live);
  syncHalfTime(live);
}

function queue(){
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    const lives = [...document.querySelectorAll('.flm-live-match[data-cm-console="3.3"]')];
    lives.forEach(sync);
    if (!lives.length) leaveMatchMode();
  });
}

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
