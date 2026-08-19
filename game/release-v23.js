const BUILD = "25.0.0";

Object.assign(window, {
  __footballLabMainV17: true,
  __footballLabMainV171: true,
  __footballLabMainV172: true,
  __footballLabMainV173: true,
  __footballLabMainV1731: true,
  __footballLabMainV174: true,
  __footballLabMainV18: true,
  __footballLabMainV19: true,
  __footballLabCinematicRendererV1731: true,
  __footballLabPresentationV1731: true,
  __footballLabSingleKickerBaseV1731: true,
  __footballLabHeroV1731: true
});

window.__footballLabFastFlowV174 = Object.freeze({
  stageIntroMs: 700,
  breakdownMs: 650,
  replayMs: 751,
  replayPolicy: "top-corner-or-frame"
});

window.__footballLabInputPrecisionV18 = Object.freeze({
  eventTimeSampling: true,
  signedFrameCorrection: true,
  actionLockMs: 70,
  pointerDownActivation: true,
  clickDeduplicationMs: 450,
  powerPerfectWindow: 0.07
});

window.__footballLabPhysicsRouteV19 = Object.freeze({
  module: "physics-v19-static-v23",
  worldDistanceResampling: true,
  distanceTimedFlight: true
});

window.__footballLabReleaseV25 = Object.freeze({
  build: BUILD,
  runtime: "static-es-modules",
  legacySourceExecution: false
});

document.documentElement.dataset.footballLabRuntimeReleaseBuild = BUILD;
document.documentElement.dataset.footballLabRuntime = "static-es-modules";

if (window.__footballLabRecoverySeenV1731 === undefined) {
  window.__footballLabRecoverySeenV1731 = null;
}

function trackRecovery(time) {
  const snapshot = window.__footballLabMotionSnapshotV173;
  if (snapshot && /recovery-step|recovery-neutral/.test(snapshot.phase || "")) {
    window.__footballLabRecoverySeenV1731 = { ...snapshot, seenAt: time };
  }
  requestAnimationFrame(trackRecovery);
}
requestAnimationFrame(trackRecovery);

const badge = document.querySelector(".build-badge-v22");
if (badge) {
  badge.textContent = "V25";
  badge.title = `Football Lab build ${BUILD}`;
}
const version = document.querySelector(".settings-version-v22 strong");
if (version) version.textContent = BUILD;
