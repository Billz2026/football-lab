// Prevent the tactics editor from fabricating or saving placeholder assignments while
// the manager is deliberately building a partial XI. Team Selection owns the XI;
// Tactics unlocks once exactly eleven real players, including a goalkeeper, are chosen.

const STYLE_ID = 'flm-manual-tactics-guard-v1-style';
let queued = false;

const manager = () => window.FLMManager;
const career = () => manager()?.activeCareer || null;

function realLineupIds(c) {
  return [...new Set((c?.lineupIds || []).filter(id => typeof id === 'string' && id.length))];
}

async function lineupState() {
  const c = career();
  if (!c || !manager()?.loadDatabase) return { complete:false, count:0, goalkeeper:false };
  const ids = realLineupIds(c);
  const db = await manager().loadDatabase();
  const goalkeeper = ids.some(id => db.players.find(player => player.id === id)?.positionGroup === 'GK');
  return { complete: ids.length === 11 && goalkeeper, count: ids.length, goalkeeper };
}

function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .v048-tactics.is-xi-locked .v048-workspace,.v048-tactics.is-xi-locked .v048-topbar{filter:saturate(.7);opacity:.62}
    .flm-xi-tactics-lock{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;margin:0 0 8px;padding:10px 12px;border:1px solid #23558e;border-radius:0;background:#071c38;color:#eef3f6}
    .flm-xi-tactics-lock strong{display:block;font-size:10px;letter-spacing:.04em;color:#f4c342}
    .flm-xi-tactics-lock span{display:block;margin-top:3px;font-size:8px;color:#9caebe}
    .flm-xi-tactics-lock button{min-height:32px;padding:0 12px;border:1px solid #55dc7c;border-radius:0;background:#174d36;color:#eef3f6;font-size:8px;font-weight:950;cursor:pointer}
    @media(max-width:620px){.flm-xi-tactics-lock{grid-template-columns:1fr}.flm-xi-tactics-lock button{width:100%}}
  `;
  document.head.appendChild(style);
}

function goToSquad() {
  const button = document.querySelector('.career-nav [data-career-tab="squad"]') || document.querySelector('[data-career-tab="squad"]');
  button?.click();
}

async function enhance() {
  injectStyles();
  const tactics = document.querySelector('.v048-tactics');
  const c = career();
  if (!tactics || !c) return;
  tactics.classList.remove('is-xi-locked');
  tactics.dataset.manualXiComplete = '1';
  tactics.parentElement?.querySelector(':scope > .flm-xi-tactics-lock')?.remove();
}

function isLockedTacticsTarget() { return false; }

// Capture-phase guards run before the existing tactics handlers. This prevents a
// partial/empty XI from being converted into undefined tactical assignments and saved.
document.addEventListener('click', event => {
  if (!isLockedTacticsTarget(event.target)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
}, true);

document.addEventListener('change', event => {
  if (!isLockedTacticsTarget(event.target)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  queue();
}, true);

document.addEventListener('dragstart', event => {
  if (!isLockedTacticsTarget(event.target)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
}, true);

document.addEventListener('drop', event => {
  if (!isLockedTacticsTarget(event.target)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
}, true);

function queue() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(async () => {
    queued = false;
    try { await enhance(); } catch (error) { console.error('Manual XI tactics guard failed', error); }
  });
}

new MutationObserver(queue).observe(document.body, { childList:true, subtree:true });
queue();
