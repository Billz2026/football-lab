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

function installLiveStateAuthority() {
  if (typeof window === 'undefined' || window.__flmLiveStateAuthorityV3Installed) return;
  window.__flmLiveStateAuthorityV3Installed = true;

  const descriptor = Object.getOwnPropertyDescriptor(window, KEY);
  if (descriptor && descriptor.configurable === false) return;

  let current = window[KEY];
  let lockedFixtureId = isAuthoritative(current) ? current.fixtureId : null;
  let rejectedLegacyWrites = 0;

  Object.defineProperty(window, KEY, {
    configurable: true,
    enumerable: true,
    get() {
      return current;
    },
    set(next) {
      if (!isObject(next)) {
        if (!lockedFixtureId) current = next;
        return;
      }

      if (isAuthoritative(next)) {
        current = next;
        lockedFixtureId = next.fixtureId || lockedFixtureId;
        window.__flmLiveStateAuthorityV3 = {
          version: MATCHDAY_LIVE_STATE_AUTHORITY_VERSION,
          source: AUTH_SOURCE,
          fixtureId: lockedFixtureId,
          rejectedLegacyWrites
        };
        return;
      }

      const sameLockedFixture = Boolean(lockedFixtureId && next.fixtureId === lockedFixtureId);
      if (sameLockedFixture) {
        rejectedLegacyWrites += 1;
        window.__flmLiveStateAuthorityV3 = {
          version: MATCHDAY_LIVE_STATE_AUTHORITY_VERSION,
          source: AUTH_SOURCE,
          fixtureId: lockedFixtureId,
          rejectedLegacyWrites
        };
        return;
      }

      // Before the match engine publishes its first authoritative snapshot, keep
      // legacy readers working. A different fixture can also initialise normally
      // until that fixture's direct engine publisher claims ownership.
      current = next;
      if (!lockedFixtureId || next.fixtureId !== lockedFixtureId) lockedFixtureId = null;
    }
  });

  if (isAuthoritative(current)) {
    window.__flmLiveStateAuthorityV3 = {
      version: MATCHDAY_LIVE_STATE_AUTHORITY_VERSION,
      source: AUTH_SOURCE,
      fixtureId: current.fixtureId || null,
      rejectedLegacyWrites
    };
  }
}

installLiveStateAuthority();
