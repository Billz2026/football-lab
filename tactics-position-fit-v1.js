/* Football Lab Manager — tactical position fit v1.
 * The compact V0.4.10 pitch retained the fit model/CSS but stopped emitting the
 * fit classes. Re-attach those classes from the authoritative player data.
 */
(() => {
  'use strict';

  let dbPromise = null;
  let queued = false;

  const clean = value => String(value || '').toUpperCase().replaceAll(' ', '');

  function database() {
    if (!dbPromise && window.FLMManager?.loadDatabase) {
      dbPromise = Promise.resolve(window.FLMManager.loadDatabase()).catch(() => null);
    }
    return dbPromise || Promise.resolve(null);
  }

  function sideOf(slotId) {
    const id = String(slotId || '');
    if (/^(R|RAM|RCM|RDM|RWB|RB|RM|RW|RST)/.test(id)) return 'R';
    if (/^(L|LAM|LCM|LDM|LWB|LB|LM|LW|LST)/.test(id)) return 'L';
    return 'C';
  }

  function familyOf(slotId) {
    const id = String(slotId || '').toUpperCase();
    if (id === 'GK') return 'GK';
    if (/CB$|^RCB$|^LCB$|^DC$/.test(id)) return 'CB';
    if (/^RB$|^LB$/.test(id)) return 'FB';
    if (/RWB|LWB/.test(id)) return 'WB';
    if (/DM/.test(id)) return 'DM';
    if (/CM$|RCM|LCM/.test(id)) return 'CM';
    if (/AM$|CAM|RAM|LAM/.test(id)) return 'AM';
    if (/^RW$|^LW$|^RM$|^LM$/.test(id)) return 'W';
    if (/ST|CF/.test(id)) return 'ST';
    return '';
  }

  function positionSets(slotId) {
    const side = sideOf(slotId);
    const family = familyOf(slotId);
    if (family === 'GK') return { natural:['GK'], cover:[] };
    if (family === 'CB') return { natural:['DC','CB'], cover:side==='R'?['DR','RB','DMC','DM']:side==='L'?['DL','LB','DMC','DM']:['DMC','DM','DR','DL'] };
    if (family === 'FB') return side==='R'?{natural:['DR','RB'],cover:['WBR','RWB','MR','AMR']}:{natural:['DL','LB'],cover:['WBL','LWB','ML','AML']};
    if (family === 'WB') return side==='R'?{natural:['WBR','RWB'],cover:['DR','RB','MR','AMR']}:{natural:['WBL','LWB'],cover:['DL','LB','ML','AML']};
    if (family === 'DM') return { natural:['DMC','DM'], cover:['MC','CM','DC','CB'] };
    if (family === 'CM') return { natural:['MC','CM'], cover:['DMC','DM','AMC','AM'] };
    if (family === 'AM') return { natural:['AMC','AM'], cover:['MC','CM','ST','FC','CF'] };
    if (family === 'W') return side==='R'?{natural:['AMR','MR','RW','FR'],cover:['WBR','RWB','ST','FC','AMC']}:{natural:['AML','ML','LW','FL'],cover:['WBL','LWB','ST','FC','AMC']};
    if (family === 'ST') return { natural:['ST','FC','CF','SC'], cover:['AMC','AMR','AML','AM'] };
    return { natural:[], cover:[] };
  }

  function fitFor(player, slotId) {
    if (!player || !slotId) return 'unfamiliar';
    const sets = positionSets(slotId);
    const primary = clean(player.primaryPosition);
    const alternatives = (player.secondaryPositions || []).map(clean);
    if (sets.natural.includes(primary)) return 'preferred';
    if (alternatives.some(code => sets.natural.includes(code))) return 'secondary';
    if (sets.cover.includes(primary) || alternatives.some(code => sets.cover.includes(code))) return 'secondary';
    return 'unfamiliar';
  }

  async function sync() {
    queued = false;
    const pitch = document.querySelector('.v048-pitch');
    if (!pitch) return;
    const db = await database();
    if (!db || !pitch.isConnected) return;
    const players = new Map((db.players || []).map(player => [player.id, player]));
    pitch.querySelectorAll('.v048-player[data-v048-slot]').forEach(node => {
      node.classList.remove('fit-preferred', 'fit-secondary', 'fit-unfamiliar');
      const player = players.get(node.dataset.playerId);
      if (!player) return;
      const fit = fitFor(player, node.dataset.v048Slot);
      node.classList.add(`fit-${fit}`);
      node.dataset.positionFit = fit;
      node.title = fit === 'preferred' ? 'Natural position' : fit === 'secondary' ? 'Can play this position' : 'Out of position';
    });
  }

  function queue() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => sync().catch(() => { queued = false; }));
  }

  new MutationObserver(queue).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('change', event => {
    if (event.target?.matches?.('[data-v048-formation]')) queue();
  }, true);
  document.addEventListener('click', event => {
    if (event.target?.closest?.('[data-v048-auto],[data-v048-clear],[data-v048-slot],[data-v048-bench-player]')) queue();
  }, true);
  queue();

  window.FLMTacticsPositionFitV1 = Object.freeze({ version: '1.0.0', refresh: queue });
})();
