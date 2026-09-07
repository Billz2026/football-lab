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

function publishAuthorityStatus(fixtureId, rejectedLegacyWrites) {
  window.__flmLiveStateAuthorityV3 = {
    version: MATCHDAY_LIVE_STATE_AUTHORITY_VERSION,
    source: AUTH_SOURCE,
    fixtureId: fixtureId || null,
    rejectedLegacyWrites
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
        current = next;
        authorityClaimed = true;
        lockedFixtureId = next.fixtureId || lockedFixtureId;
        publishAuthorityStatus(lockedFixtureId, rejectedLegacyWrites);
        return;
      }

      if (authorityClaimed) {
        rejectedLegacyWrites += 1;
        publishAuthorityStatus(lockedFixtureId, rejectedLegacyWrites);
        return;
      }

      // Legacy snapshots may initialise read-only presentation consumers before
      // Matchday starts. The first direct engine publication permanently claims
      // ownership for the session; no later legacy write can downgrade it.
      current = next;
    }
  });

  if (authorityClaimed) publishAuthorityStatus(lockedFixtureId, rejectedLegacyWrites);
}

installLiveStateAuthority();
