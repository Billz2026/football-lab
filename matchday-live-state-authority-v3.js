export const MATCHDAY_LIVE_STATE_AUTHORITY_VERSION = '3.0.0';

const KEY = '__flmLiveStateV332';
const AUTH_SOURCE = 'matchday-engine-v069';
const fixtureHistory = new Map();
const fixtureLineups = new Map();

function isObject(value) {
  return Boolean(value && typeof value === 'object');
}

function isAuthoritative(value) {
  return isObject(value)
    && value.source === AUTH_SOURCE
    && value.structuredCommentarySnapshotVersion === MATCHDAY_LIVE_STATE_AUTHORITY_VERSION;
}

function eventStorageKey(event) {
  if (event?.liveEventId) return `event:${event.liveEventId}`;
  if (event?.attack?.sequenceId) return `attack:${event.attack.sequenceId}`;
  if (event?.flow?.sequenceId) return `flow:${event.flow.sequenceId}`;
  if (event?.type) {
    return `legacy:${[
      event.type,event.minute,event.clubId,event.playerId,event.assistPlayerId,
      event.subtype,event.outcome,event.text,(event.lines || []).join('|')
    ].map(value => String(value ?? '')).join(':')}`;
  }
  return null;
}

function fixtureStore(fixtureId) {
  if (!fixtureHistory.has(fixtureId)) {
    fixtureHistory.set(fixtureId, { order: [], byKey: new Map() });
    if (fixtureHistory.size > 12) {
      const oldest = fixtureHistory.keys().next().value;
      fixtureHistory.delete(oldest);
      fixtureLineups.delete(oldest);
    }
  }
  return fixtureHistory.get(fixtureId);
}

function rememberAuthoritativeSnapshot(next) {
  const fixtureId = next.fixtureId;
  const store = fixtureStore(fixtureId);
  for (const event of next.events || []) {
    const key = eventStorageKey(event);
    if (!key) continue;
    if (!store.byKey.has(key)) store.order.push(key);
    store.byKey.set(key, event);
  }

  if (!fixtureLineups.has(fixtureId)) {
    fixtureLineups.set(fixtureId, {
      home: [...(next.initialHomeLineupIds || next.homeLineupIds || [])],
      away: [...(next.initialAwayLineupIds || next.awayLineupIds || [])]
    });
  }

  return {
    events: store.order.map(key => store.byKey.get(key)),
    lineups: fixtureLineups.get(fixtureId)
  };
}

function mergeAuthoritativeSnapshots(previous, next) {
  const remembered = rememberAuthoritativeSnapshot(next);
  return {
    ...next,
    initialHomeLineupIds: remembered.lineups?.home || next.initialHomeLineupIds || previous?.initialHomeLineupIds,
    initialAwayLineupIds: remembered.lineups?.away || next.initialAwayLineupIds || previous?.initialAwayLineupIds,
    events: remembered.events
  };
}

function forgetFixture(fixtureId) {
  if (!fixtureId) return;
  fixtureHistory.delete(fixtureId);
  fixtureLineups.delete(fixtureId);
}

function hasMountedLiveMatch() {
  return Boolean(document.querySelector('[data-live-match], .flm-live-match'));
}

function publishAuthorityStatus(fixtureId, rejectedLegacyWrites, structuredEventCount, rejectedCrossFixtureWrites = 0) {
  window.__flmLiveStateAuthorityV3 = {
    version: MATCHDAY_LIVE_STATE_AUTHORITY_VERSION,
    source: AUTH_SOURCE,
    fixtureId: fixtureId || null,
    rejectedLegacyWrites,
    rejectedCrossFixtureWrites,
    structuredEventCount: Number(structuredEventCount || 0)
  };
}

function installLiveStateAuthority() {
  if (typeof window === 'undefined' || window.__flmLiveStateAuthorityV3Installed) return;
  window.__flmLiveStateAuthorityV3Installed = true;

  const descriptor = Object.getOwnPropertyDescriptor(window, KEY);
  if (descriptor && descriptor.configurable === false) return;

  let current = window[KEY];
  let authorityClaimed = isAuthoritative(current);
  let lockedFixtureId = authorityClaimed ? current.fixtureId : null;
  let rejectedLegacyWrites = 0;
  let rejectedCrossFixtureWrites = 0;

  if (authorityClaimed) current = mergeAuthoritativeSnapshots(null, current);

  Object.defineProperty(window, KEY, {
    configurable: true,
    enumerable: true,
    get() {
      return current;
    },
    set(next) {
      if (isAuthoritative(next)) {
        const nextFixtureId = next.fixtureId || null;
        const fixtureWouldChange = Boolean(lockedFixtureId && nextFixtureId && nextFixtureId !== lockedFixtureId);
        if (fixtureWouldChange && hasMountedLiveMatch()) {
          rejectedCrossFixtureWrites += 1;
          publishAuthorityStatus(lockedFixtureId, rejectedLegacyWrites, current?.events?.length, rejectedCrossFixtureWrites);
          return;
        }

        current = mergeAuthoritativeSnapshots(current, next);
        authorityClaimed = true;
        lockedFixtureId = current.fixtureId || lockedFixtureId;
        publishAuthorityStatus(lockedFixtureId, rejectedLegacyWrites, current.events?.length, rejectedCrossFixtureWrites);
        return;
      }

      if (authorityClaimed) {
        rejectedLegacyWrites += 1;
        publishAuthorityStatus(lockedFixtureId, rejectedLegacyWrites, current?.events?.length, rejectedCrossFixtureWrites);
        return;
      }

      current = next;
    }
  });

  window.addEventListener('flm:live-state-complete', event => {
    const fixtureId = event?.detail?.fixtureId;
    forgetFixture(fixtureId);
    if (fixtureId && fixtureId === lockedFixtureId) lockedFixtureId = null;
    publishAuthorityStatus(lockedFixtureId, rejectedLegacyWrites, current?.events?.length, rejectedCrossFixtureWrites);
  });

  if (authorityClaimed) publishAuthorityStatus(lockedFixtureId, rejectedLegacyWrites, current?.events?.length, rejectedCrossFixtureWrites);
}

installLiveStateAuthority();
