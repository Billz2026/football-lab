/*
 * Squad v2 compatibility surface.
 *
 * Keep the stable selectors used by older runtime helpers and browser
 * regressions while the visible Squad UI is owned by team-selection-v2.js.
 * This does not restore the old UI; it mirrors authoritative career state.
 */

let queued = false;

function syncCompatibilitySurface() {
  const root = document.querySelector('.flm-selection-v2');
  const career = window.FLMManager?.activeCareer;
  if (!root || !career) return;

  const heading = document.querySelector('.career-content .career-page-heading h2');
  if (heading) heading.textContent = 'Squad';

  const autoPick = document.querySelector('[data-flm-v2-auto-xi]');
  if (autoPick) autoPick.setAttribute('data-v044-auto-pick', '');

  let mirror = root.querySelector('[data-flm-v2-legacy-mirror]');
  if (!mirror) {
    mirror = document.createElement('div');
    mirror.dataset.flmV2LegacyMirror = '1';
    mirror.hidden = true;
    mirror.setAttribute('aria-hidden', 'true');
    root.appendChild(mirror);
  }

  const ids = [...new Set((career.lineupIds || []).filter(Boolean))];
  const signature = ids.join('|');
  if (mirror.dataset.signature === signature) return;
  mirror.dataset.signature = signature;
  mirror.replaceChildren(...ids.map(id => {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = true;
    input.value = id;
    input.dataset.v044Lineup = '';
    input.tabIndex = -1;
    return input;
  }));
}

function queueSync() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(() => {
    queued = false;
    syncCompatibilitySurface();
  });
}

new MutationObserver(queueSync).observe(document.body, { childList: true, subtree: true });
window.addEventListener('storage', queueSync);
queueSync();
