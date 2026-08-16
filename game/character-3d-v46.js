import { clamp, state, ctx, canvasView, WORLD } from "./core-v6.js?v=32.4";
import { buildCamera, kickerWorld, ballWorld, keeperWorld } from "./world-v7.js?v=32.4";
import { activeCharacter } from "./characters-v13.js?v=32.4";
import { keeperForStage } from "./keepers-v14.js?v=32.4";
import {
  characterAssetBySourceIdV1,
  characterAssetV1,
  requiredClipsForAssetV1
} from "./character-production-v1.js?v=1.0.0";
import { drawHeroCharacterV44 } from "./hero-character-v44.js?v=44.0.0";

const BUILD = "46.0.0";
const THREE_VERSION = "0.180.0";
const THREE_URL = `https://esm.sh/three@${THREE_VERSION}`;
const GLTF_LOADER_URL = `https://esm.sh/three@${THREE_VERSION}/examples/jsm/loaders/GLTFLoader.js`;
const VIEW_ASPECT = WORLD.width / WORLD.height;
const MODEL_FORWARD_AXIS = "+Z";
const ASSET_TIMEOUT_MS = 2500;

let runtimePromise = null;
let runtime = null;
let renderer = null;
let renderCanvas = null;
let scene = null;
let camera3d = null;
let shadowPlane = null;
let directionalLight = null;
let currentRenderModel = null;
let activeAction = null;
let activeActionName = null;
let keeperInstalled = false;
let keeperRetryTimer = null;

const loaded = new Map();
const loading = new Map();
const failed = new Map();

function liveState() {
  if (typeof window !== "undefined" && window.__footballLabAuthoritativeStateV46) {
    return window.__footballLabAuthoritativeStateV46;
  }
  return state;
}

function publish(status, extra = {}) {
  if (typeof window === "undefined") return;
  window.__footballLabCharacter3DV46 = Object.freeze({
    build: BUILD,
    target: "real-skinned-glb-human",
    renderer: "three-webgl-offscreen-composite",
    threeVersion: THREE_VERSION,
    forwardAxis: MODEL_FORWARD_AXIS,
    status,
    loaded: [...loaded.keys()],
    failed: [...failed.entries()].map(([id, reason]) => ({ id, reason })),
    localAssetsOnly: true,
    fallback: "v44-articulated-2.5d",
    gameplayPhysicsChanged: false,
    keeperAIChanged: false,
    ...extra
  });
}

function assetUrl(entry) {
  if (!entry?.model) return null;
  return new URL(entry.model, import.meta.url).href;
}

async function assetExists(url) {
  if (!url) return false;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ASSET_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      method: "HEAD",
      cache: "no-store",
      signal: controller.signal
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function ensureRuntime() {
  if (runtime) return runtime;
  if (runtimePromise) return runtimePromise;
  runtimePromise = Promise.all([
    import(THREE_URL),
    import(GLTF_LOADER_URL)
  ]).then(([THREE, loaderModule]) => {
    runtime = { THREE, GLTFLoader: loaderModule.GLTFLoader };
    initialiseRenderer();
    publish("runtime-ready");
    return runtime;
  }).catch((error) => {
    publish("runtime-error", { error: error?.message || String(error) });
    throw error;
  });
  return runtimePromise;
}

function initialiseRenderer() {
  if (renderer || !runtime) return;
  const { THREE } = runtime;
  renderCanvas = document.createElement("canvas");
  renderCanvas.width = WORLD.width;
  renderCanvas.height = WORLD.height;
  renderCanvas.setAttribute("aria-hidden", "true");

  renderer = new THREE.WebGLRenderer({
    canvas: renderCanvas,
    alpha: true,
    antialias: true,
    premultipliedAlpha: true,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(1);
  renderer.setSize(WORLD.width, WORLD.height, false);
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.02;

  scene = new THREE.Scene();
  camera3d = new THREE.PerspectiveCamera(36, VIEW_ASPECT, 0.1, 180);
  camera3d.up.set(0, 1, 0);

  const hemisphere = new THREE.HemisphereLight(0xe8f3ff, 0x29402f, 1.45);
  scene.add(hemisphere);

  directionalLight = new THREE.DirectionalLight(0xffefd5, 2.1);
  directionalLight.position.set(-4.5, 9.5, 8.5);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.set(1024, 1024);
  directionalLight.shadow.camera.near = 0.5;
  directionalLight.shadow.camera.far = 45;
  directionalLight.shadow.camera.left = -10;
  directionalLight.shadow.camera.right = 10;
  directionalLight.shadow.camera.top = 12;
  directionalLight.shadow.camera.bottom = -5;
  scene.add(directionalLight);

  const planeGeometry = new THREE.PlaneGeometry(60, 80);
  const planeMaterial = new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.2 });
  shadowPlane = new THREE.Mesh(planeGeometry, planeMaterial);
  shadowPlane.rotation.x = -Math.PI / 2;
  shadowPlane.position.set(0, 0.002, -18);
  shadowPlane.receiveShadow = true;
  scene.add(shadowPlane);
}

function normaliseClipName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function findClipMap(animations) {
  const map = new Map();
  for (const clip of animations || []) {
    map.set(normaliseClipName(clip.name), clip);
  }
  return map;
}

function validateClips(entry, animations) {
  const clipMap = findClipMap(animations);
  const required = requiredClipsForAssetV1(entry).map(normaliseClipName);
  const missing = required.filter((name) => !clipMap.has(name));
  return { clipMap, required, missing, complete: missing.length === 0 };
}

function heightForAsset(entry) {
  const heights = {
    "viktor-kane": 1.88,
    "bruno-silva": 1.82,
    "david-beckett": 1.86,
    "wayne-redman": 1.78,
    "mikkel-storm": 2.04,
    "rafael-dantas": 1.93,
    "diego-varela": 1.91,
    "simon-henshaw": 1.9
  };
  return heights[entry?.id] || (entry?.kind === "goalkeeper" ? 1.92 : 1.84);
}

function configureModel(entry, gltf) {
  const { THREE } = runtime;
  const model = gltf.scene;
  model.name = `football-lab-${entry.id}`;
  model.updateMatrixWorld(true);

  const box = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  box.getSize(size);
  const sourceHeight = Math.max(0.001, size.y);
  const targetHeight = heightForAsset(entry);
  const scale = targetHeight / sourceHeight;
  model.scale.setScalar(scale);
  model.updateMatrixWorld(true);

  const scaledBox = new THREE.Box3().setFromObject(model);
  const minimumY = scaledBox.min.y;
  model.position.y -= minimumY;

  model.traverse((node) => {
    if (!node?.isMesh) return;
    node.castShadow = true;
    node.receiveShadow = false;
    node.frustumCulled = true;
    const materials = Array.isArray(node.material) ? node.material : [node.material];
    for (const material of materials) {
      if (!material) continue;
      if ("roughness" in material) material.roughness = Math.max(0.42, Number(material.roughness) || 0.62);
      if ("metalness" in material) material.metalness = Math.min(0.08, Number(material.metalness) || 0);
      material.needsUpdate = true;
    }
  });

  const clips = validateClips(entry, gltf.animations);
  const mixer = new THREE.AnimationMixer(model);
  const actions = new Map();
  for (const [name, clip] of clips.clipMap) {
    const action = mixer.clipAction(clip);
    action.enabled = true;
    action.clampWhenFinished = true;
    actions.set(name, action);
  }

  return {
    entry,
    model,
    mixer,
    actions,
    animations: gltf.animations || [],
    clips,
    targetHeight,
    sourceHeight,
    scale,
    yawOffset: 0
  };
}

async function loadEntry(entry) {
  if (!entry) return null;
  if (loaded.has(entry.id)) return loaded.get(entry.id);
  if (failed.has(entry.id)) return null;
  if (loading.has(entry.id)) return loading.get(entry.id);

  const promise = (async () => {
    const url = assetUrl(entry);
    if (!(await assetExists(url))) {
      failed.set(entry.id, "missing-local-glb");
      publish("fallback-missing-assets");
      return null;
    }

    const { GLTFLoader } = await ensureRuntime();
    const loader = new GLTFLoader();
    const gltf = await loader.loadAsync(url);
    const configured = configureModel(entry, gltf);
    if (!configured.clips.complete) {
      failed.set(entry.id, `missing-clips:${configured.clips.missing.join(",")}`);
      publish("fallback-incomplete-glb", {
        asset: entry.id,
        missingClips: configured.clips.missing
      });
      return null;
    }

    loaded.set(entry.id, configured);
    publish("asset-ready", { asset: entry.id });
    return configured;
  })().catch((error) => {
    failed.set(entry.id, error?.message || String(error));
    publish("asset-error", { asset: entry.id, error: error?.message || String(error) });
    return null;
  }).finally(() => loading.delete(entry.id));

  loading.set(entry.id, promise);
  return promise;
}

function activeOutfieldEntry() {
  return characterAssetBySourceIdV1(activeCharacter().id);
}

function activeKeeperEntry() {
  const gameState = liveState();
  const source = keeperForStage(gameState.stage);
  return characterAssetBySourceIdV1(source.id)
    || (source.id === "aggressive" ? characterAssetV1("mikkel-storm") : null);
}

function outfieldProgress(time) {
  const gameState = liveState();
  if (!gameState.animation) return { run: 0, contact: 0, flight: 0, settle: 0, replay: false };
  const animation = gameState.animation;
  const elapsed = time - animation.startedAt;
  const runDuration = Math.max(1, animation.runUpDuration || 1);
  const contactDuration = Math.max(0, animation.contactHoldDuration || 0);
  const flightDuration = Math.max(1, animation.flightDuration || 1);
  const flightStart = runDuration + contactDuration;
  const flightEnd = flightStart + flightDuration;
  return {
    run: clamp(elapsed / runDuration, 0, 1),
    contact: contactDuration ? clamp((elapsed - runDuration) / contactDuration, 0, 1) : 0,
    flight: clamp((elapsed - flightStart) / flightDuration, 0, 1),
    settle: clamp((elapsed - flightEnd) / Math.max(1, animation.settleDuration || 1), 0, 1),
    replay: Boolean(animation.isReplay)
  };
}

function outfieldPhase(time) {
  const p = outfieldProgress(time);
  if (!liveState().animation) return { clip: "idle", t: (time % 2400) / 2400, p };
  if (p.replay || p.flight > 0 || p.settle > 0) {
    if (p.flight < 0.58) return { clip: "follow-through", t: clamp(p.flight / 0.58, 0, 1), p };
    return { clip: "recovery", t: Math.max(clamp((p.flight - 0.58) / 0.42, 0, 1), p.settle), p };
  }
  if (p.contact > 0) return { clip: "contact", t: p.contact, p };
  // Keep the authoritative 560 ms run-up unchanged, but give the kicking leg enough
  // visual preparation to read as a real strike at gameplay frame rates.
  if (p.run < 0.35) return { clip: "approach", t: p.run / 0.35, p };
  if (p.run < 0.45) return { clip: "plant", t: (p.run - 0.35) / 0.1, p };
  if (p.run < 1) return { clip: "windup", t: (p.run - 0.45) / 0.55, p };
  return { clip: "contact", t: 0, p };
}

function rootTravel(p) {
  if (!liveState().animation) return 0;
  if (p.replay) return 1;
  const t = clamp(p.run / 0.72, 0, 1);
  return t < 0.5 ? 4 * t ** 3 : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function keeperClip(frame) {
  const pose = frame?.keeper?.pose;
  const motion = String(pose?.motion || "READY").toUpperCase();
  const right = Number(pose?.rotation || 0) >= 0;
  const side = right ? "right" : "left";
  if (/RECOVER/.test(motion)) return "recovery";
  if (/LAND/.test(motion)) return "landing";
  if (/CATCH/.test(motion)) return "catch";
  if (/PARRY/.test(motion)) return "parry";
  if (/HIGH_DIVE/.test(motion)) return `dive-${side}-high`;
  if (/LOW_DIVE/.test(motion)) return `dive-${side}-low`;
  if (/DIVE/.test(motion)) return `dive-${side}-mid`;
  if (/WRONG_FOOT|READ_SET|PLANT/.test(motion)) return right ? "shuffle-right" : "shuffle-left";
  return "set";
}

function keeperClipFromAuthoritativePlan(time, frameClip) {
  const gameState = liveState();
  const animation = gameState.animation;
  const plan = gameState.shot?.keeperPlan;
  if (!animation || !plan || animation.isReplay) return frameClip;

  const p = outfieldProgress(time);
  if (p.flight <= 0) return frameClip;

  const flightSeconds = Math.max(0.05, Number(plan.flightSeconds) || 1);
  const reactionRatio = clamp((Number(plan.reaction) || 0.15) / flightSeconds, 0.04, 0.72);
  const direction = Number(plan.diveDirection || ((plan.target?.x || 0) - (plan.start?.x || 0))) >= 0
    ? "right"
    : "left";
  const targetY = Number(plan.contact?.y ?? plan.target?.y ?? 1.1);
  const height = targetY >= 1.72 ? "high" : targetY <= 0.78 ? "low" : "mid";

  if (p.flight < reactionRatio * 0.82) return `shuffle-${direction}`;
  if (p.flight < 0.84) return `dive-${direction}-${height}`;
  if (gameState.shot?.saveType === "CATCH" && p.flight < 0.94) return "catch";
  if (p.settle < 0.46) return "landing";
  return "recovery";
}

function scrubAction(configured, clipName, normalisedTime) {
  const name = normaliseClipName(clipName);
  const action = configured.actions.get(name);
  if (!action) return false;

  if (activeAction && (activeAction !== action || currentRenderModel !== configured)) {
    activeAction.stop();
  }
  currentRenderModel = configured;
  activeAction = action;
  activeActionName = name;

  action.enabled = true;
  action.setEffectiveWeight(1);
  action.setEffectiveTimeScale(0);
  action.paused = true;
  const duration = Math.max(0.001, action.getClip().duration || 1);
  action.time = clamp(normalisedTime, 0, 0.9999) * duration;
  action.play();
  configured.mixer.update(0);
  return true;
}

function applyCamera(cameraState) {
  camera3d.fov = cameraState.fovY;
  camera3d.aspect = VIEW_ASPECT;
  camera3d.near = cameraState.near || 0.2;
  camera3d.far = 180;
  camera3d.position.set(cameraState.position.x, cameraState.position.y, cameraState.position.z);
  camera3d.up.set(0, 1, 0);
  camera3d.lookAt(cameraState.target.x, cameraState.target.y, cameraState.target.z);
  camera3d.updateProjectionMatrix();
  directionalLight.target.position.set(cameraState.target.x, 0.7, cameraState.target.z);
  if (!directionalLight.target.parent) scene.add(directionalLight.target);
}

function faceTarget(model, world, target, yawOffset = 0) {
  model.position.set(world.x, world.y, world.z);
  const dx = target.x - world.x;
  const dz = target.z - world.z;
  model.rotation.set(0, Math.atan2(dx, dz) + yawOffset, 0);
}

function compositeWebGL() {
  const { dpr, scale, offsetX, offsetY } = canvasView;
  ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offsetX, dpr * offsetY);
  ctx.drawImage(renderCanvas, 0, 0, WORLD.width, WORLD.height);
}

function renderConfigured(configured, cameraState) {
  if (!configured || !renderer) return false;
  scene.add(configured.model);
  applyCamera(cameraState);
  renderer.clear();
  renderer.render(scene, camera3d);
  compositeWebGL();
  scene.remove(configured.model);
  return true;
}

function preloadBenchmarks() {
  for (const entry of [characterAssetV1("viktor-kane"), characterAssetV1("mikkel-storm")]) {
    const url = assetUrl(entry);
    assetExists(url).then((exists) => {
      if (exists) loadEntry(entry);
      else {
        failed.set(entry.id, "missing-local-glb");
        publish("fallback-missing-assets");
      }
    });
  }
}

export function drawHeroCharacterV46(time) {
  if (keeperInstalled && window.__footballLabPremiumKeeperSceneDrawV3852?.__footballLabV46KeeperHook !== true) {
    keeperInstalled = false;
    installKeeperNow();
  }
  const entry = activeOutfieldEntry();
  const configured = entry ? loaded.get(entry.id) : null;
  if (!configured) {
    if (entry && !failed.has(entry.id) && !loading.has(entry.id)) loadEntry(entry);
    drawHeroCharacterV44(time);
    window.__footballLabHeroFrameV46 = Object.freeze({
      build: BUILD,
      character: entry?.id || activeCharacter().id,
      renderer: "v44-fallback",
      production3D: false,
      time
    });
    return;
  }

  const gameState = liveState();
  const phase = outfieldPhase(time);
  const world = kickerWorld(gameState.currentStage, rootTravel(phase.p));
  const target = ballWorld(gameState.currentStage);
  if (!scrubAction(configured, phase.clip, phase.t)) {
    drawHeroCharacterV44(time);
    return;
  }
  faceTarget(configured.model, world, target, configured.yawOffset);
  const cameraState = buildCamera(gameState.currentStage);
  renderConfigured(configured, cameraState);

  window.__footballLabHeroFrameV46 = Object.freeze({
    build: BUILD,
    character: configured.entry.id,
    renderer: "real-skinned-glb-3d",
    production3D: true,
    clip: activeActionName,
    world: { x: world.x, y: world.y, z: world.z },
    time
  });
}

function renderKeeper3D(time, frame, configured) {
  const keeper = frame?.keeper;
  if (!keeper?.world || !keeper?.pose) return false;
  const gameState = liveState();
  const frameClip = keeperClip(frame);
  const clip = frameClip === "set"
    ? keeperClipFromAuthoritativePlan(time, frameClip)
    : frameClip;
  const progress = outfieldProgress(time);
  const flight = progress.flight;
  const t = /set/.test(clip)
    ? (time % 2200) / 2200
    : /shuffle/.test(clip)
      ? clamp(flight / 0.28, 0, 1)
      : /landing|recovery/.test(clip)
        ? clamp(progress.settle, 0, 1)
        : clamp(flight, 0, 1);
  if (!scrubAction(configured, clip, t)) return false;

  const target = ballWorld(gameState.currentStage);
  faceTarget(configured.model, keeper.world, target, configured.yawOffset);
  return renderConfigured(configured, buildCamera(gameState.currentStage));
}

function installKeeperNow() {
  const current = window.__footballLabPremiumKeeperSceneDrawV3852;
  if (keeperInstalled && current?.__footballLabV46KeeperHook === true) return true;
  if (!window.__footballLabKeeperRendererV44) return false;
  if (typeof current !== "function") return false;
  if (current.__footballLabV46KeeperHook === true) {
    keeperInstalled = true;
    return true;
  }
  const original = current;

  const v46KeeperHook = function footballLabKeeperSceneV46(time) {
    const entry = activeKeeperEntry();
    const configured = entry ? loaded.get(entry.id) : null;
    if (!configured) {
      if (entry && !failed.has(entry.id) && !loading.has(entry.id)) loadEntry(entry);
      return original(time);
    }

    ctx.save();
    const previousAlpha = ctx.globalAlpha;
    ctx.globalAlpha = 0;
    const result = original(time);
    ctx.globalAlpha = previousAlpha;
    ctx.restore();

    const frame = window.__footballLabPremiumKeeperSceneFrameV3852;
    if (!renderKeeper3D(time, frame, configured)) return original(time);

    window.__footballLabKeeperFrameV46 = Object.freeze({
      build: BUILD,
      character: configured.entry.id,
      renderer: "real-skinned-glb-3d",
      production3D: true,
      clip: activeActionName,
      sceneDepth: true,
      time
    });
    return result;
  };

  Object.defineProperty(v46KeeperHook, "__footballLabV46KeeperHook", {
    value: true,
    configurable: false,
    enumerable: false,
    writable: false
  });
  window.__footballLabPremiumKeeperSceneDrawV3852 = v46KeeperHook;
  keeperInstalled = true;
  return true;
}

function retryKeeperInstall() {
  if (installKeeperNow()) return;
  clearTimeout(keeperRetryTimer);
  keeperRetryTimer = setTimeout(retryKeeperInstall, 100);
}

export function installCharacter3DV46() {
  publish("asset-gated-fallback");
  preloadBenchmarks();
  retryKeeperInstall();
}

if (typeof window !== "undefined") installCharacter3DV46();
