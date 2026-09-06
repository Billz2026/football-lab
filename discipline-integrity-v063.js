const VERSION = '0.6.3';
const INSTALL_FLAG = '__flmDisciplineIntegrityV063Installed';
const STYLE_ID = 'flm-discipline-integrity-v063-style';

const clean = value => String(value || '').replace(/\s+/g, ' ').trim();
const esc = value => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');
const normal = value => clean(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim();

function isLiveMatchState(value) {
  return Boolean(value
    && typeof value === 'object'
    && typeof value.minute === 'number'
    && typeof value.fixtureId === 'string'
    && Array.isArray(value.homeLineupIds)
    && Array.isArray(value.awayLineupIds)
    && Array.isArray(value.events));
}

function yellowCounts(state) {
  const counts = new Map();
  for (const event of state?.events || []) {
    if (event?.type !== 'yellow' || !event.playerId) continue;
    counts.set(event.playerId, (counts.get(event.playerId) || 0) + 1);
  }
  for (const [playerId, count] of Object.entries(state?.yellowByPlayer || {})) {
    counts.set(playerId, Math.max(counts.get(playerId) || 0, Number(count) || 0));
  }
  return counts;
}

export function collectSentOffIds(state) {
  const sent = new Set(state?.sentOffIds || []);
  for (const event of state?.events || []) {
    if (event?.type === 'red' && event.playerId) sent.add(event.playerId);
  }
  for (const [playerId, count] of yellowCounts(state)) {
    if (count >= 2) sent.add(playerId);
  }
  return sent;
}

function eventSide(state, playerId, homeBefore, awayBefore) {
  if (homeBefore.has(playerId)) return 'home';
  if (awayBefore.has(playerId)) return 'away';
  const event = [...(state.events || [])].reverse().find(item =>
    item?.playerId === playerId && (item.type === 'red' || item.type === 'yellow')
  );
  if (event?.clubId === state.homeClubId) return 'home';
  if (event?.clubId === state.awayClubId) return 'away';
  return null;
}

function ensureSecondYellowRedEvents(state, sent, counts) {
  const existing = new Set((state.events || [])
    .filter(event => event?.type === 'red' && event.playerId)
    .map(event => event.playerId));

  for (const playerId of sent) {
    if ((counts.get(playerId) || 0) < 2 || existing.has(playerId)) continue;
    const lastYellow = [...(state.events || [])].reverse().find(event => event?.type === 'yellow' && event.playerId === playerId);
    state.events.push({
      minute: Number(lastYellow?.minute ?? state.minute ?? 0),
      type: 'red',
      clubId: lastYellow?.clubId || null,
      playerId,
      assistPlayerId: null,
      text: 'Second yellow card — player sent off.',
      lines: ['SECOND YELLOW — player sent off.']
    });
    existing.add(playerId);
  }
}

export function reconcileDisciplineState(state) {
  if (!isLiveMatchState(state)) return state;

  state.sentOffIds ||= [];
  state.yellowByPlayer ||= {};
  state.stats ||= { home: {}, away: {} };
  state.stats.home ||= {};
  state.stats.away ||= {};

  const homeBefore = new Set(state.homeLineupIds);
  const awayBefore = new Set(state.awayLineupIds);
  const counts = yellowCounts(state);
  const sent = collectSentOffIds(state);
  if (!sent.size) return state;

  ensureSecondYellowRedEvents(state, sent, counts);
  state.sentOffIds = [...sent];
  state.homeLineupIds = state.homeLineupIds.filter(id => !sent.has(id));
  state.awayLineupIds = state.awayLineupIds.filter(id => !sent.has(id));

  if (Array.isArray(state.userShape?.assignments)) {
    state.userShape.assignments = state.userShape.assignments.filter(assignment => !sent.has(assignment?.playerId));
  }

  const dismissed = { home: new Set(), away: new Set() };
  for (const playerId of sent) {
    const side = eventSide(state, playerId, homeBefore, awayBefore);
    if (side) dismissed[side].add(playerId);
  }
  state.stats.home.redCards = Math.max(Number(state.stats.home.redCards || 0), dismissed.home.size);
  state.stats.away.redCards = Math.max(Number(state.stats.away.redCards || 0), dismissed.away.size);

  return state;
}

function enrichPublishedSnapshot(state) {
  if (typeof window === 'undefined' || !isLiveMatchState(state)) return;
  const snapshot = window.__flmLiveStateV332;
  if (!snapshot || snapshot.fixtureId !== state.fixtureId) return;
  snapshot.homeLineupIds = [...state.homeLineupIds];
  snapshot.awayLineupIds = [...state.awayLineupIds];
  snapshot.sentOffIds = [...(state.sentOffIds || [])];
  snapshot.yellowByPlayer = { ...(state.yellowByPlayer || {}) };
  snapshot.events = (state.events || []).map(event => ({
    minute: event.minute,
    type: event.type,
    clubId: event.clubId,
    playerId: event.playerId,
    assistPlayerId: event.assistPlayerId
  }));
}

function installStateGuard() {
  if (typeof window === 'undefined' || window[INSTALL_FLAG]) return;
  window[INSTALL_FLAG] = true;
  const previous = JSON.stringify;
  JSON.stringify = function(value, ...rest) {
    try { reconcileDisciplineState(value); } catch (_) {}
    const output = Reflect.apply(previous, this, [value, ...rest]);
    try { enrichPublishedSnapshot(value); } catch (_) {}
    return output;
  };
}

function ensureStyles() {
  if (typeof document === 'undefined' || document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .flm-match-dialog.v2-sub-dialog .v2-sub-player.is-sent-off {
      border-color: rgba(235,74,82,.58) !important;
      background: rgba(134,24,31,.20) !important;
      opacity: .78;
      cursor: not-allowed !important;
    }
    .flm-match-dialog.v2-sub-dialog .v2-sub-player.is-sent-off strong {
      color: #ff8c92 !important;
    }
    .flm-sent-off-badge {
      justify-self: end;
      padding: 3px 6px;
      border: 1px solid rgba(255,92,100,.65);
      border-radius: 4px;
      color: #ffb2b6;
      background: rgba(134,24,31,.32);
      font-size: .58rem;
      font-weight: 950;
      letter-spacing: .06em;
      white-space: nowrap;
    }
  `;
  document.head.appendChild(style);
}

let dbPromise = null;
let playerByName = null;

async function database() {
  if (typeof window === 'undefined') return null;
  if (!dbPromise && window.FLMManager?.loadDatabase) {
    dbPromise = Promise.resolve(window.FLMManager.loadDatabase()).catch(() => null);
  }
  return dbPromise || Promise.resolve(null);
}

function buildPlayerIndex(db) {
  if (playerByName || !db?.players) return playerByName;
  playerByName = new Map();
  for (const player of db.players) {
    const key = normal(player.name);
    if (key && !playerByName.has(key)) playerByName.set(key, player);
    const parts = key.split(' ').filter(Boolean);
    const surname = parts.at(-1);
    if (surname && parts.length > 1) {
      const short = `${parts[0][0]} ${surname}`;
      if (!playerByName.has(short)) playerByName.set(short, player);
    }
  }
  return playerByName;
}

function playerForName(db, name) {
  const index = buildPlayerIndex(db);
  const key = normal(name);
  if (index?.has(key)) return index.get(key);
  const parts = key.split(' ').filter(Boolean);
  const surname = parts.at(-1);
  if (!surname) return null;
  const candidates = (db?.players || []).filter(player => normal(player.name).split(' ').at(-1) === surname);
  if (candidates.length === 1) return candidates[0];
  if (parts.length > 1) {
    const initial = parts[0][0];
    return candidates.find(player => normal(player.name).split(' ')[0]?.startsWith(initial)) || null;
  }
  return null;
}

function redCommentaryTexts() {
  if (typeof document === 'undefined') return [];
  return [...document.querySelectorAll('[data-commentary-feed] .flm-commentary-line')]
    .filter(line => line.classList.contains('red') || /red card|sent off|second yellow/i.test(clean(line.textContent)))
    .map(line => normal(line.querySelector('span')?.textContent || line.textContent));
}

function nameMatchesRed(name, redTexts) {
  const key = normal(name);
  if (!key) return false;
  const parts = key.split(' ').filter(Boolean);
  const surname = parts.at(-1);
  return redTexts.some(text => text.includes(key) || (surname?.length >= 4 && text.includes(` ${surname} `)));
}

function sentOffSet(snapshot) {
  const ids = new Set(snapshot?.sentOffIds || []);
  const yellows = new Map();
  for (const event of snapshot?.events || []) {
    if (!event?.playerId) continue;
    if (event.type === 'red') ids.add(event.playerId);
    if (event.type === 'yellow') yellows.set(event.playerId, (yellows.get(event.playerId) || 0) + 1);
  }
  for (const [playerId, count] of Object.entries(snapshot?.yellowByPlayer || {})) {
    yellows.set(playerId, Math.max(yellows.get(playerId) || 0, Number(count) || 0));
  }
  for (const [playerId, count] of yellows) if (count >= 2) ids.add(playerId);
  return ids;
}

function blockMessage(dialog) {
  const status = dialog?.querySelector('.flm-sub-status');
  if (!status) return;
  status.innerHTML = '<strong>SENT-OFF PLAYERS CANNOT BE SUBSTITUTED</strong><span>TEAM REMAINS WITH 10</span>';
}

async function syncSubDialog() {
  if (typeof document === 'undefined') return;
  const dialog = document.querySelector('[data-manager-modal].is-open .flm-match-dialog.v2-sub-dialog');
  if (!dialog) return;
  const db = await database();
  const snapshot = window.__flmLiveStateV332;
  const sent = sentOffSet(snapshot);
  const redTexts = redCommentaryTexts();
  const off = dialog.querySelector('[data-sub-out]');
  const apply = dialog.querySelector('[data-apply-sub]');
  const outList = dialog.querySelector('[data-v2-out-list]');

  for (const option of off?.options || []) {
    const dataName = String(option.textContent || '').split('·')[0].trim();
    const player = db ? playerForName(db, dataName) : null;
    const isSent = Boolean((player && sent.has(player.id)) || nameMatchesRed(dataName, redTexts));
    option.disabled = isSent;
    if (isSent && !/sent off/i.test(option.textContent)) option.textContent = `${option.textContent} · SENT OFF`;
  }

  for (const row of outList?.querySelectorAll('.v2-sub-player') || []) {
    const name = clean(row.querySelector('strong')?.textContent);
    const player = db ? playerForName(db, name) : null;
    if (player) row.dataset.flmDisciplinePlayerId = player.id;
    const isSent = Boolean((player && sent.has(player.id)) || nameMatchesRed(name, redTexts));
    row.classList.toggle('is-sent-off', isSent);
    if (!isSent) continue;
    row.disabled = true;
    row.setAttribute('aria-disabled', 'true');
    row.classList.remove('is-selected-out');
    let badge = row.querySelector('.flm-sent-off-badge');
    if (!badge) {
      badge = document.createElement('span');
      badge.className = 'flm-sent-off-badge';
      row.appendChild(badge);
    }
    badge.textContent = 'RC · SENT OFF';
  }

  if (db && outList && snapshot?.userClubId) {
    for (const playerId of sent) {
      const player = db.players?.find(item => item.id === playerId && item.clubId === snapshot.userClubId);
      if (!player || [...outList.querySelectorAll('[data-flm-discipline-player-id]')].some(row => row.dataset.flmDisciplinePlayerId === playerId)) continue;
      const row = document.createElement('button');
      row.type = 'button';
      row.disabled = true;
      row.className = 'v2-sub-player is-sent-off';
      row.dataset.flmDisciplinePlayerId = playerId;
      row.setAttribute('aria-disabled', 'true');
      row.innerHTML = `<span class="pos">${esc(player.primaryPosition || player.positionGroup || '—')}</span><strong>${esc(player.name)}</strong><span class="flm-sent-off-badge">RC · SENT OFF</span>`;
      outList.appendChild(row);
    }
  }

  const selectedId = off?.value || '';
  const selectedOption = selectedId ? [...(off?.options || [])].find(option => option.value === selectedId) : null;
  if (selectedOption?.disabled) {
    const next = [...off.options].find(option => !option.disabled);
    if (next) off.value = next.value;
    if (apply) apply.disabled = true;
    blockMessage(dialog);
  }
}

let syncQueued = false;
function queueSync() {
  if (typeof window === 'undefined' || syncQueued) return;
  syncQueued = true;
  requestAnimationFrame(() => {
    syncQueued = false;
    syncSubDialog();
  });
}

function installSubstitutionGuard() {
  if (typeof document === 'undefined') return;
  ensureStyles();
  document.addEventListener('click', event => {
    const dialog = event.target.closest?.('.flm-match-dialog.v2-sub-dialog');
    if (!dialog) return;
    const sentRow = event.target.closest?.('.v2-sub-player.is-sent-off');
    if (sentRow) {
      event.preventDefault();
      event.stopImmediatePropagation();
      blockMessage(dialog);
      return;
    }
    const apply = event.target.closest?.('[data-apply-sub]');
    if (!apply) return;
    const off = dialog.querySelector('[data-sub-out]');
    const option = off?.selectedOptions?.[0];
    if (option?.disabled || /sent off/i.test(option?.textContent || '')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      apply.disabled = true;
      blockMessage(dialog);
    }
  }, true);

  new MutationObserver(queueSync).observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['class', 'disabled', 'data-cm46-player-id']
  });
  window.addEventListener('flm:live-xg', queueSync);
  queueSync();
}

if (typeof window !== 'undefined') {
  installStateGuard();
  installSubstitutionGuard();
  window.FLMDisciplineIntegrityV063 = Object.freeze({
    version: VERSION,
    reconcileDisciplineState,
    collectSentOffIds,
    refresh: queueSync
  });
}
