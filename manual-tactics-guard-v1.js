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
    .flm-xi-tactics-lock{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;margin:0 0 10px;padding:12px 14px;border:1px solid rgba(232,184,63,.35);border-radius:8px;background:#171306;color:#eee}
    .flm-xi-tactics-lock strong{display:block;font-size:11px;letter-spacing:.04em;color:#f1d16d}
    .flm-xi-tactics-lock span{display:block;margin-top:3px;font-size:9px;color:#aaa}
    .flm-xi-tactics-lock button{min-height:36px;padding:0 13px;border:1px solid #e8b83f;border-radius:5px;background:#e8b83f;color:#110d04;font-size:9px;font-weight:950;cursor:pointer}
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

  const state = await lineupState();
  tactics.classList.toggle('is-xi-locked', !state.complete);
  tactics.dataset.manualXiComplete = state.complete ? '1' : '0';

  let notice = tactics.parentElement?.querySelector(':scope > .flm-xi-tactics-lock');
  if (state.complete) {
    notice?.remove();
    return;
  }

  if (!notice) {
    notice = document.createElement('div');
    notice.className = 'flm-xi-tactics-lock';
    notice.innerHTML = '<div><strong>COMPLETE YOUR STARTING XI FIRST</strong><span data-xi-lock-copy></span></div><button type="button" data-xi-lock-squad>SELECT STARTING XI</button>';
    tactics.before(notice);
    notice.querySelector('[data-xi-lock-squad]')?.addEventListener('click', goToSquad);
  }
  const missing = Math.max(0, 11 - state.count);
  const copy = notice.querySelector('[data-xi-lock-copy]');
  if (copy) copy.textContent = `${state.count} / 11 selected${state.goalkeeper ? '' : ' · goalkeeper required'}. Pick ${missing} more player${missing === 1 ? '' : 's'} in Team Selection. Tactics will not auto-fill your team.`;
}

function isLockedTacticsTarget(target) {
  const tactics = target?.closest?.('.v048-tactics.is-xi-locked');
  if (!tactics) return false;
  return Boolean(target.closest('[data-v048-formation],[data-v048-option],[data-v048-save],[data-v048-auto],[data-v048-role],[data-v048-squad-player],[data-v048-slot],[data-v048-pitch]'));
}

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
