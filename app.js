// Football Lab V52 release and cache contract
const RELEASE_BUILD = "52.0.0";

function registerFootballLabServiceWorker() {
  if (!("serviceWorker" in navigator) || !/^https?:$/.test(location.protocol)) return;
  navigator.serviceWorker.register(`./sw.js?v=${RELEASE_BUILD}`, {
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
  : "./game/runtime-v23-main.js?v=41.0.0";
window.__footballLabRuntimeCaptureMode = runtimeCaptureMode;

let gameplayBundlePromise = null;
let gameplayBundleLoaded = false;
let buildPresentationObserver = null;

function restoreCurrentBuildPresentation() {
  document.documentElement.dataset.footballLabBuild = RELEASE_BUILD;
  const badge = document.querySelector(".build-badge-v22");
  if (badge && badge.textContent !== "V52") badge.textContent = "V52";
  if (badge && badge.title !== `Football Lab build ${RELEASE_BUILD}`) {
    badge.title = `Football Lab build ${RELEASE_BUILD}`;
  }
  const version = document.querySelector(".settings-version-v22 strong");
  if (version && version.textContent !== RELEASE_BUILD) version.textContent = RELEASE_BUILD;
}

function protectCurrentBuildPresentation() {
  restoreCurrentBuildPresentation();
  if (buildPresentationObserver) return;
  const badge = document.querySelector(".build-badge-v22");
  const version = document.querySelector(".settings-version-v22 strong");
  if (!badge || !version) return;
  buildPresentationObserver = new MutationObserver(restoreCurrentBuildPresentation);
  buildPresentationObserver.observe(badge, { attributes: true, childList: true, subtree: true });
  buildPresentationObserver.observe(version, { childList: true, subtree: true });
}

const bootPromise = runtimeCaptureMode
  ? import(runtimeEntry).then(() => {
      window.__footballLabMainV19 = true;
      window.__footballLabCaptureReadyV23 = true;
    })
  : Promise.resolve()
      .then(() => import("./game/product-polish-v22.js?v=32.4"))
      .then(() => import("./game/progression-v20.js?v=32.4"))
      .then(() => import("./game/hub-v35-1.js?v=35.1"))
      .then(() => import("./game/hub-v35-3.js?v=35.3"))
      .then(() => import("./game/hub-v35-4.js?v=35.6.2"))
      .then(() => {
        document.documentElement.dataset.footballLabBuild = RELEASE_BUILD;
        const badge = document.querySelector(".build-badge-v22");
        if (badge) {
          badge.textContent = "V52";
          badge.title = `Football Lab build ${RELEASE_BUILD}`;
        }
        const version = document.querySelector(".settings-version-v22 strong");
        if (version) version.textContent = RELEASE_BUILD;
        const release = Object.freeze({
          build: RELEASE_BUILD,
          shell: "premium-black-gold-photographic-mosaic",
          navigation: "play-progress-settings-only",
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
          trainingActivities: "free-kicks-and-penalties-live-corners-finishing-scenarios-reserved",
          trainingDistanceYards: "12-45",
          trainingBalls: "standard-curve-power-control-knuckle",
          trainingRecords: "isolated-from-career",
          trainingSetupFreezeFix: "self-observing-summary-loop-removed",
          duplicateTrainingTileFix: "legacy-bridge-hidden-internal-only",
          penaltyTraining: "12-yard-one-v-one-unlimited-practice",
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
          visualFoundation: "v56-premium-broadcast-scene-pass",
          goalBackdrop: "no-rectangle-soft-radial-keeper-contrast",
          advertisingArchitecture: "muted-side-only-clear-goalmouth",
          outcomeFeedback: "canvas-goal-save-parry-post-bar-block-wide-sting-plus-control-panel",
          outcomeCanvasSting: "visible-on-desktop-fold-mobile",
          stadiumProgression: "six-distinct-chapter-venues-academy-to-summit",
          stadiumArchitecture: "scaled-tiers-concourse-roof-aisles-rails-crowd-silhouettes",
          stadiumQualityScaling: "fold-mobile-reduced-crowd-detail",
          stadiumProgressionV41: "venue-tier-crowd-energy-scoreboards-supporter-flags-final-occasion-boost",
          campaignLevelIdentity: "six-football-identities-five-stages-each",
          chapterFinalPresentation: "stages-05-10-15-20-25-30-major-occasion",
          campaignProgressPersistence: "highest-stage-local-profile-v41",
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
          cacheGeneration: RELEASE_BUILD
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
        window.__footballLabReleaseV410 = release;
        window.__footballLabReleaseV480 = release;
        window.__footballLabReleaseV511 = release;
        window.__footballLabReleaseV512 = release;
        window.__footballLabReleaseV520 = release;
        window.__footballLabReleaseCurrent = release;
        protectCurrentBuildPresentation();
      });

function loadGameplayBundle() {
  if (runtimeCaptureMode) return bootPromise;
  if (!gameplayBundlePromise) {
    gameplayBundlePromise = bootPromise
      .then(() => import(runtimeEntry))
      .then(() => import("./game/keeper-ai-v34.js?v=35.1"))
      .then(() => import("./game/keeper-polish-v36.js?v=36.0"))
      .then(() => import("./game/keeper-realism-v36-2.js?v=36.2"))
      .then(() => import("./game/keeper-readability-v36-3.js?v=36.3"))
      .then(() => import("./game/keeper-visuals-v38-1.js?v=40.3.0"))
      .then(() => import("./game/flight-v33.js?v=40.3.0"))
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
      .then(() => import("./game/clarity-v21.js?v=32.4"))
      .then(() => import("./game/release-v23.js?v=32.4"))
      .then(() => import("./game/immersive-ui-v24.js?v=32.4"))
      .then(() => import("./game/infinite-runs-v25.js?v=32.4"))
      .then(() => import("./game/campaign-v31.js?v=32.4"))
      .then(() => import("./game/campaign-v41.js?v=41.0.0"))
      .then(() => {
        gameplayBundleLoaded = true;
        return true;
      })
      .catch((error) => {
        gameplayBundlePromise = null;
        throw error;
      });
  }
  return gameplayBundlePromise;
}

let trainingBundlePromise = null;
let penaltyBundlePromise = null;
let trainingBundleLoaded = false;
let penaltyBundleLoaded = false;

function modeTileStatus(tile) {
  return tile?.querySelector(".hub-mode-status") || null;
}

function setModeTileBusy(tile, busy) {
  if (!tile) return;
  tile.toggleAttribute("aria-busy", busy);
  tile.classList.toggle("is-loading-mode", busy);
  const status = modeTileStatus(tile);
  if (status) {
    if (busy) {
      status.dataset.readyCopy = status.textContent;
      status.textContent = "LOADING";
    } else if (status.dataset.readyCopy) {
      status.textContent = status.dataset.readyCopy;
      delete status.dataset.readyCopy;
    }
  }
}

function reportModeLoadFailure(tile, error) {
  window.__footballLabStartupError = error?.stack || error?.message || String(error);
  console.error("Football Lab mode failed to load", error);
  const status = modeTileStatus(tile);
  if (status) status.textContent = "LOAD FAILED · TRY AGAIN";
}

function wirePenaltyActivityLoader() {
  const button = [...document.querySelectorAll("#trainingModalV35 .training-activity-v35")]
    .find((item) => item.textContent.includes("PENALTIES"));
  if (!button || button.dataset.lazyPenaltyWired === "true") return;
  button.dataset.lazyPenaltyWired = "true";
  button.disabled = false;
  button.removeAttribute("disabled");
  button.innerHTML = "<strong>PENALTIES</strong><small>PLAYABLE NOW</small>";
  button.addEventListener("click", async (event) => {
    if (penaltyBundleLoaded) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    button.disabled = true;
    try {
      await loadPenaltyBundle();
      button.disabled = false;
      button.click();
    } catch (error) {
      button.disabled = false;
      reportModeLoadFailure(document.querySelector(".hub-mode-penalties"), error);
    }
  }, true);
}

function loadTrainingBundle() {
  if (!trainingBundlePromise) {
    trainingBundlePromise = loadGameplayBundle()
      .then(() => import("./game/training-v35.js?v=35.0"))
      .then(() => import("./game/training-guard-v35.js?v=35.1"))
      .then(() => import("./game/training-ui-v35-5.js?v=35.5"))
      .then(() => import("./game/training-ui-v35-6.js?v=35.6.1"))
      .then(() => {
        trainingBundleLoaded = true;
        wirePenaltyActivityLoader();
        return true;
      })
      .catch((error) => {
        trainingBundlePromise = null;
        throw error;
      });
  }
  return trainingBundlePromise;
}

function loadPenaltyBundle() {
  if (!penaltyBundlePromise) {
    penaltyBundlePromise = loadTrainingBundle()
      .then(() => import("./game/penalty-training-v48.js?v=48.0.0"))
      .then(() => import(`./game/penalty-duel-v51.js?v=${RELEASE_BUILD}`))
      .then(() => import(`./game/penalty-duel-transition-guard-v51.js?v=${RELEASE_BUILD}`))
      .then(() => {
        penaltyBundleLoaded = true;
        return true;
      })
      .catch((error) => {
        penaltyBundlePromise = null;
        throw error;
      });
  }
  return penaltyBundlePromise;
}

const classicTile = document.getElementById("classicCard");
const classicEntries = [
  classicTile,
  document.getElementById("playClassic"),
  document.getElementById("modalPlay"),
  document.getElementById("howToPlay")
].filter(Boolean);

classicEntries.forEach((entry) => {
  entry.addEventListener("click", async (event) => {
    if (gameplayBundleLoaded) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    setModeTileBusy(classicTile, true);
    try {
      await loadGameplayBundle();
      entry.click();
    } catch (error) {
      reportModeLoadFailure(classicTile, error);
    } finally {
      setModeTileBusy(classicTile, false);
    }
  }, true);
});

const trainingTile = document.getElementById("trainingCardV35");
trainingTile?.addEventListener("click", async (event) => {
  event.preventDefault();
  event.stopImmediatePropagation();
  setModeTileBusy(trainingTile, true);
  try {
    await loadTrainingBundle();
    document.querySelector(".training-card-v35")?.click();
  } catch (error) {
    reportModeLoadFailure(trainingTile, error);
  } finally {
    setModeTileBusy(trainingTile, false);
  }
}, true);

const penaltyTile = document.querySelector(".hub-mode-penalties");
penaltyTile?.addEventListener("click", async (event) => {
  if (penaltyBundleLoaded) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  setModeTileBusy(penaltyTile, true);
  try {
    await loadPenaltyBundle();
    penaltyTile.click();
  } catch (error) {
    reportModeLoadFailure(penaltyTile, error);
  } finally {
    setModeTileBusy(penaltyTile, false);
  }
}, true);

window.__footballLabModeBundles = Object.freeze({
  build: RELEASE_BUILD,
  loadGameplay: loadGameplayBundle,
  loadTraining: loadTrainingBundle,
  loadPenalties: loadPenaltyBundle,
  snapshot: () => Object.freeze({
    gameplayLoaded: gameplayBundleLoaded,
    trainingLoaded: trainingBundleLoaded,
    penaltiesLoaded: penaltyBundleLoaded
  })
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
