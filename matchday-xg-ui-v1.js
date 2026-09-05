// Live Match Centre xG presentation. The engine owns the numbers; this layer only
// surfaces them without coupling the legacy match renderer to the new stat model.
(() => {
  'use strict';

  let queued = false;

  function esc(value) {
    return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
      .replaceAll('"','&quot;').replaceAll("'",'&#039;');
  }

  function statRow(label, home, away, key) {
    const row = document.createElement('div');
    row.className = 'flm-stat-row flm-xg-stat-row';
    row.dataset.xgStat = key;
    row.innerHTML = `<strong>${esc(home)}</strong><span>${esc(label)}</span><strong>${esc(away)}</strong>`;
    return row;
  }

  function insertAfter(reference, node) {
    if (!reference?.parentNode) return;
    reference.parentNode.insertBefore(node, reference.nextSibling);
  }

  function sync() {
    const live = document.querySelector('[data-live-match]');
    const stats = live?.querySelector('[data-live-stats]');
    const data = window.__flmLiveXg;
    if (!live || !stats || !data) return;

    const existingXg = stats.querySelector('[data-xg-stat="xg"]');
    const existingBig = stats.querySelector('[data-xg-stat="big-chances"]');
    const values = {
      home: Number(data.home || 0).toFixed(2),
      away: Number(data.away || 0).toFixed(2),
      homeBig: Number(data.homeBigChances || 0),
      awayBig: Number(data.awayBigChances || 0)
    };

    if (existingXg) {
      existingXg.querySelector('strong:first-child').textContent = values.home;
      existingXg.querySelector('strong:last-child').textContent = values.away;
    } else {
      const shots = [...stats.querySelectorAll('.flm-stat-row')].find(row => /shots/i.test(row.querySelector('span')?.textContent || ''));
      const row = statRow('xG', values.home, values.away, 'xg');
      if (shots) insertAfter(shots, row); else stats.prepend(row);
    }

    if (existingBig) {
      existingBig.querySelector('strong:first-child').textContent = String(values.homeBig);
      existingBig.querySelector('strong:last-child').textContent = String(values.awayBig);
    } else {
      const xg = stats.querySelector('[data-xg-stat="xg"]');
      const row = statRow('Big chances', values.homeBig, values.awayBig, 'big-chances');
      if (xg) insertAfter(xg, row); else stats.prepend(row);
    }

    live.dataset.xgModel = data.model?.spatial ? 'spatial' : 'contextual-v1';
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      sync();
    });
  }

  window.addEventListener('flm:live-xg', queue);
  new MutationObserver(queue).observe(document.body, { childList: true, subtree: true });
  queue();
})();
