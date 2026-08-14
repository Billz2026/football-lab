// Football Lab V40.3A stadium progression architecture
function registerFootballLabServiceWorker() {
  if (!("serviceWorker" in navigator) || !/^https?:$/.test(location.protocol)) return;
  navigator.serviceWorker.register("./sw.js?v=40.3.0", {
    scope: "./",
    updateViaCache: "none"
  })
    .then(async (registration) => {
      window.__footballLabServiceWorkerReady = true;
      window.__footballLabServiceWorkerRegistration = registration;
      window.dispatchEvent(new CustomEvent("footballlab:swready", { detail: { registration } }));
      await registration.update();
    })
    .catch((error) => console.info("Offline shell was not registered", error));
}

if (document.readyState === "complete") registerFootballLabServiceWorker();
else window.addEventListener("load", registerFootballLabServiceWorker, { once: true });

window.__footballLabStartupError = null;

const localCaptureHost = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
const runtimeCaptureMode = localCaptureHost
  && new URLSearchParams(location.search).get("runtime-capture") === "v23";
const runtimeEntry = runtimeCaptureMode
  ? "./game/main-v18.js?v=32.4"
  : "./game/runtime-v23-main.js?v=40.3.0";
window.__footballLabRuntimeCaptureMode = runtimeCaptureMode;

const runtimePromise = import(runtimeEntry);
const bootPromise = runtimeCaptureMode
  ? runtimePromise.then(() => {
      window.__footballLabMainV19 = true;
      window.__footballLabCaptureReadyV23 = true;
    })
  : runtimePromise
      .then(() => import("./game/keeper-ai-v34.js?v=35.1"))
      .then(() => import("./game/keeper-polish-v36.js?v=36.0"))
      .then(() => import("./game/keeper-realism-v36-2.js?v=36.2"))
      .then(() => import("./game/keeper-readability-v36-3.js?v=36.3"))
      .then(() => import("./game/keeper-visuals-v38-1.js?v=40.3.0"))
      .then(() => import("./game/flight-v33.js?v=40.3.0"))
      .then(() => import("./game/training-v35.js?v=35.1"))
      .then(() => import("./game/training-guard-v35.js?v=35.1"))
      .then(() => import("./game/hub-v35-1.js?v=35.1"))
      .then(() => import("./game/polish-v10-2.js?v=32.4"))
      .then(() => import("./game/polish-v11-4.js?v=32.4"))
      .then(() => import("./game/characters-ui-v13.js?v=32.4"))
      .then(() => import("./game/keepers-ui-v14.js?v=32.4"))
      .then(() => import("./game/walls-ui-v15.js?v=32.4"))
      .then(() => import("./game/mobile-ui-v16.js?v=32.4"))
      .then(() => import("./game/mobile-shell-v16-1.js?v=32.4"))
      .then(() => import("./game/mobile-shell-compact-v16-1.js?v=32.4"))
      .then(() => import("./game/visual-ui-v17.js?v=32.4"))
      .then(() => import("./game/strike-v32-4.js?v=32.4"))
      .then(() => import("./game/skill-balance-v37.js?v=37.0"))
      .then(() => import("./game/input-precision-ui-v18.js?v=32.4"))
      .then(() => import("./game/progression-v20.js?v=32.4"))
      .then(() => import("./game/clarity-v21.js?v=32.4"))
      .then(() => import("./game/product-polish-v22.js?v=32.4"))
      .then(() => import("./game/hub-v35-3.js?v=35.3"))
      .then(() => import("./game/hub-v35-4.js?v=35.6.2"))
      .then(() => import("./game/release-v23.js?v=32.4"))
      .then(() => import("./game/immersive-ui-v24.js?v=32.4"))
      .then(() => import("./game/infinite-runs-v25.js?v=32.4"))
      .then(() => import("./game/campaign-v31.js?v=32.4"))
      .then(() => {
        document.documentElement.dataset.footballLabBuild = "40.3.0";
        const badge = document.querySelector(".build-badge-v22");
        if (badge) {
          badge.textContent = "V40.3A";
          badge.title = "Football Lab build 40.3.0";
        }
        const version = document.querySelector(".settings-version-v22 strong");
        if (version) version.textContent = "40.3.0";
        const release = Object.freeze({
          build: "40.3.0",
          shell: "premium-asymmetric-console-mosaic",
          navigation: "play-training-profile-in-settings",
          primaryModes: "training-free-kicks-penalties-corners-finishing-match-scenarios",
          aiming: "direct-intended-target-unsolved-route",
          execution: "deterministic-execution-cone-contact-weighted",
          skillBalance: "power-contact-curl-distance-mode",
          executionRng: false,
          doubleFaultProtection: "slow-mishit-recovery-window",
          premiumFinishes: "clean-execution-gated",
          physics: "progressive-magnus-dip",
          keeperAI: "early-lane-commit-correct",
          keeperPresentation: "weighted-true-scene-depth-save-motion",
          keeperVisualRig: "v38-5-2-athletic-scene-depth-rig",
          keeperVisualScale: "base-1.20",
          keeperContactRing: "removed",
          keeperBodyHalo: "removed",
          keeperProjectedPenaltyArc: "suppressed-in-free-kick-view",
          keeperGroundShadow: "soft-ground-only",
          keeperGloves: "smaller-readable-cuffs",
          keeperReflexPresentation: "sharper-archetype-capped-visible-reaction",
          keeperWrongFootMotion: "two-phase-commit-recovery",
          keeperReadability: "jersey-colour-long-sleeves-wall-depth-aware",
          keeperSavePresentation: "archetype-and-contact-classified",
          keeperArchetypes: "reading-reflex-reach-aggression",
          trainingGround: "shared-sandbox-framework",
          trainingActivities: "free-kicks-live-penalties-corners-finishing-scenarios-reserved",
          trainingDistanceYards: "16-45",
          trainingBalls: "standard-curve-power-control-knuckle",
          trainingRecords: "isolated-from-career",
          trainingSetupFreezeFix: "self-observing-summary-loop-removed",
          duplicateTrainingTileFix: "legacy-bridge-hidden-internal-only",
          camera: "goal-first-destination-biased-flight-composition",
          cameraKickerClearance: "post-contact-frame-clear",
          cameraFinalApproach: "late-flight-goalmouth-emphasis",
          cameraImpactHold: "clean-contact-before-result",
          cinematicFinalApproach: "final-13-percent-subtle-time-remap",
          resultReveal: "authoritative-canvas-sting-after-impact-hold",
          duplicateImpactLabels: "retired",
          characterMotion: "root-locked-plant-hip-drive-leg-snap-controlled-cross-step",
          plantFootLock: "root-and-support-foot-fixed-through-contact",
          upperBodyCounterRotation: "shoulder-arm-momentum-through-follow-through",
          characterRendering: "refined-proportions-grounded-shadows",
          pitchSurface: "depth-graded-procedural-turf",
          pitchMowing: "cross-cut-directional-bands",
          pitchWear: "localized-free-kick-and-goalmouth",
          pitchLighting: "controlled-goalmouth-falloff",
          pitchQualityScaling: "fold-mobile-reduced-micro-detail",
          goalBackdrop: "no-rectangle-soft-radial-keeper-contrast",
          advertisingArchitecture: "muted-side-only-clear-goalmouth",
          outcomeFeedback: "canvas-goal-save-parry-post-bar-block-wide-sting-plus-control-panel",
          outcomeCanvasSting: "visible-on-desktop-fold-mobile",
          stadiumProgression: "six-distinct-chapter-venues-academy-to-summit",
          stadiumArchitecture: "scaled-tiers-concourse-roof-aisles-rails-crowd-silhouettes",
          stadiumQualityScaling: "fold-mobile-reduced-crowd-detail",
          keeperBackdropContrast: "radial-continuous-stadium-no-block",
          goalLayering: "backdrop-before-pitch-goal-keeper",
          wallMotion: "five-behaviour-individual-anticipation-jump-head-arm-turn-landing",
          ballPresentation: "one-authoritative-black-white-panel-match-ball-no-circular-ghost-overlays",
          singleBallRenderer: "base-scene-authoritative",
          legacyBallEnergy: "retired",
          legacyContactOrb: "retired",
          netPresentation: "stronger-localised-persistent-impact-ripple",
          impactPresentation: "glove-net-frame-contact-flash-particles",
          impactAudio: "net-thump-glove-slap-frame-ring",
          prediction: "unsolved-short-launch-guide",
          defaultMode: "standard",
          cacheGeneration: "40.3.0"
        });
        window.__footballLabReleaseV322 = release;
        window.__footballLabReleaseV323 = release;
        window.__footballLabReleaseV324 = release;
        window.__footballLabReleaseV331 = release;
        window.__footballLabReleaseV332 = release;
        window.__footballLabReleaseV333 = release;
        window.__footballLabReleaseV341 = release;
        window.__footballLabReleaseV350 = release;
        window.__footballLabReleaseV351 = release;
        window.__footballLabReleaseV352 = release;
        window.__footballLabReleaseV353 = release;
        window.__footballLabReleaseV354 = release;
        window.__footballLabReleaseV355 = release;
        window.__footballLabReleaseV356 = release;
        window.__footballLabReleaseV3561 = release;
        window.__footballLabReleaseV3562 = release;
        window.__footballLabReleaseV360 = release;
        window.__footballLabReleaseV361 = release;
        window.__footballLabReleaseV362 = release;
        window.__footballLabReleaseV363 = release;
        window.__footballLabReleaseV370 = release;
        window.__footballLabReleaseV381 = release;
        window.__footballLabReleaseV3811 = release;
        window.__footballLabReleaseV386 = release;
        window.__footballLabReleaseV387 = release;
        window.__footballLabReleaseV3871 = release;
        window.__footballLabReleaseV3872 = release;
        window.__footballLabReleaseV388 = release;
        window.__footballLabReleaseV390 = release;
        window.__footballLabReleaseV391 = release;
        window.__footballLabReleaseV401 = release;
        window.__footballLabReleaseV402A = release;
        window.__footballLabReleaseV402B = release;
        window.__footballLabReleaseV402C = release;
        window.__footballLabReleaseV402D = release;
        window.__footballLabReleaseV403A = release;
      });

bootPromise.catch((error) => {
  window.__footballLabStartupError = error?.stack || error?.message || String(error);
  console.error("Football Lab failed to start", error);
  const message = document.createElement("div");
  message.className = "football-lab-startup-error";
  message.setAttribute("role", "alert");
  message.textContent = `The game failed to load: ${error?.message || "unknown startup error"}.`;
  Object.assign(message.style, {
    position: "fixed",
    inset: "auto 20px 20px",
    zIndex: "9999",
    padding: "16px 18px",
    borderRadius: "12px",
    background: "#260b0b",
    color: "#fff",
    font: "700 14px system-ui"
  });
  document.body.appendChild(message);
});
