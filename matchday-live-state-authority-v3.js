export const MATCHDAY_LIVE_STATE_AUTHORITY_VERSION = '3.0.0';

const KEY = '__flmLiveStateV332';
const AUTH_SOURCE = 'matchday-engine-v069';

function isObject(value) {
  return Boolean(value && typeof value === 'object');
}

function isAuthoritative(value) {
  return isObject(value)
    && value.source === AUTH_SOURCE
    && value.structuredCommentarySnapshotVersion === MATCHDAY_LIVE_STATE_AUTHORITY_VERSION;
}

function sequenceIdFor(event) {
  return event?.attack?.sequenceId || event?.flow?.sequenceId || null;
}

function mergeAuthoritativeSnapshots(previous, next) {
  if (!isAuthoritative(previous) || previous.fixtureId !== next.fixtureId) return next;

  const orderedIds = [];
  const byId = new Map();
  const unkeyed = [];

  for (const event of [...(previous.events || []), ...(next.events || [])]) {
    const sequenceId = sequenceIdFor(event);
    if (!sequenceId) {
      unkeyed.push(event);
      continue;
    }
    if (!byId.has(sequenceId)) orderedIds.push(sequenceId);
    byId.set(sequenceId, event);
  }

  return {
    ...next,
    initialHomeLineupIds: next.initialHomeLineupIds || previous.initialHomeLineupIds,
    initialAwayLineupIds: next.initialAwayLineupIds || previous.initialAwayLineupIds,
    events: [...orderedIds.map(id => byId.get(id)), ...unkeyed]
  };
}

function publishAuthorityStatus(fixtureId, rejectedLegacyWrites, structuredEventCount) {
  window.__flmLiveStateAuthorityV3 = {
    version: MATCHDAY_LIVE_STATE_AUTHORITY_VERSION,
    source: AUTH_SOURCE,
    fixtureId: fixtureId || null,
    rejectedLegacyWrites,
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

  Object.defineProperty(window, KEY, {
    configurable: true,
    enumerable: true,
    get() {
      return current;
    },
    set(next) {
      if (isAuthoritative(next)) {
        current = mergeAuthoritativeSnapshots(current, next);
        authorityClaimed = true;
        lockedFixtureId = current.fixtureId || lockedFixtureId;
        publishAuthorityStatus(lockedFixtureId, rejectedLegacyWrites, current.events?.length);
        return;
      }

      if (authorityClaimed) {
        rejectedLegacyWrites += 1;
        publishAuthorityStatus(lockedFixtureId, rejectedLegacyWrites, current?.events?.length);
        return;
      }

      // Legacy snapshots may initialise read-only presentation consumers before
      // Matchday starts. The first direct engine publication permanently claims
      // ownership for the session; no later legacy write can downgrade it.
      current = next;
    }
  });

  if (authorityClaimed) publishAuthorityStatus(lockedFixtureId, rejectedLegacyWrites, current?.events?.length);
}

installLiveStateAuthority();
