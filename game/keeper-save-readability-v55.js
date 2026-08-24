import { clamp, state } from "./core-v6.js?v=32.4";
import { GOAL, keeperWorld } from "./world-v7.js?v=32.4";

const BUILD = "55.0.0";
const SAVE_BODY_CLASSES = Object.freeze([
  "CATCH",
  "PARRY",
  "LOW_COLLAPSE",
  "FULL_STRETCH",
  "RECOVERY"
]);
const INSTALL_RETRY_MS = 16;
const MAX_INSTALL_RETRIES = 750;

let installed = false;
let installTimer = 0;
let installRetries = 0;
let wrappedSource = null;
let lastFrame = null;

function mix(a, b, amount) {
  return a + (b - a) * clamp(amount, 0, 1);
}

function isPenaltyDuel() {
  return document.documentElement.classList.contains("penalty-duel-v51");
}

function saveMetrics({ contactX = 0, contactY = 0, baseX = 0 }) {
  const halfGoal = Math.max(0.1, Number(GOAL.width) * 0.5 || 3.66);
  const goalHeight = Math.max(0.1, Number(GOAL.height) || 2.44);
  return {
    lateralReach: clamp(Math.abs(Number(contactX) - Number(baseX)) / halfGoal, 0, 1.5),
    heightNorm: clamp(Number(contactY) / goalHeight, 0, 1.5)
  };
}

export function classifyKeeperSaveBodyV55({
  outcome,
  saveType,
  contactX = 0,
  contactY = 0,
  baseX = 0,
  recovery = 0
} = {}) {
  if (String(outcome || "").toUpperCase() !== "SAVE") return null;
  if (Number(recovery) > 0.1) return "RECOVERY";

  const { lateralReach, heightNorm } = saveMetrics({ contactX, contactY, baseX });
  if (heightNorm <= 0.34 && lateralReach <= 0.64) return "LOW_COLLAPSE";
  if (lateralReach >= 0.68 || (heightNorm >= 0.68 && lateralReach >= 0.5)) return "FULL_STRETCH";
  return String(saveType || "").toUpperCase() === "CATCH" ? "CATCH" : "PARRY";
}

function adjustLocalJoint(joint, dx = 0, dy = 0) {
  if (!joint) return;
  joint.x = Number(joint.x || 0) + dx;
  joint.y = Number(joint.y || 0) + dy;
}

function adjustWorldHand(hand, dx = 0, dy = 0, dz = 0) {
  if (!hand) return;
  hand.x = Number(hand.x || 0) + dx;
  hand.y = Number(hand.y || 0) + dy;
  hand.z = Number(hand.z || 0) + dz;
}

function enhanceLowCollapse(keeper, pose, direction) {
  keeper.world.y = Math.max(0, Number(keeper.world.y || 0) * 0.34);
  pose.crouch = clamp(Number(pose.crouch || 0) + 0.13, 0, 0.5);
  pose.torsoLean = Number(pose.torsoLean || 0) + direction * 0.105;
  pose.rotation = Number(pose.rotation || 0) + direction * 0.075;
  pose.chestX = Number(pose.chestX || 0) + direction * 0.022;
  pose.gloveScale = Number(pose.gloveScale || 1) + 0.035;

  adjustLocalJoint(pose.leftKnee, direction * -0.012, 0.038);
  adjustLocalJoint(pose.rightKnee, direction * -0.012, 0.038);
  adjustLocalJoint(pose.leftAnkle, direction * -0.018, 0.018);
  adjustLocalJoint(pose.rightAnkle, direction * -0.018, 0.018);

  const drop = 0.035;
  adjustWorldHand(pose.absoluteLeftHand, direction * 0.012, -drop, 0);
  adjustWorldHand(pose.absoluteRightHand, direction * 0.012, -drop, 0);
}

function enhanceFullStretch(keeper, pose, direction, heightNorm) {
  keeper.world.x = Number(keeper.world.x || 0) + direction * 0.045;
  keeper.world.y = Math.max(0, Number(keeper.world.y || 0) + 0.018 + Math.max(0, heightNorm - 0.58) * 0.045);
  pose.crouch = clamp(Number(pose.crouch || 0) - 0.045, 0, 0.48);
  pose.torsoLean = Number(pose.torsoLean || 0) + direction * 0.072;
  pose.rotation = Number(pose.rotation || 0) + direction * 0.045;
  pose.gloveScale = Number(pose.gloveScale || 1) + 0.075;

  const lead = direction > 0 ? pose.absoluteRightHand : pose.absoluteLeftHand;
  const trail = direction > 0 ? pose.absoluteLeftHand : pose.absoluteRightHand;
  adjustWorldHand(lead, direction * 0.09, Math.max(-0.015, (heightNorm - 0.5) * 0.075), 0.012);
  adjustWorldHand(trail, direction * 0.035, Math.max(-0.02, (heightNorm - 0.5) * 0.035), 0.006);

  adjustLocalJoint(pose.leftAnkle, direction * -0.028, -0.012);
  adjustLocalJoint(pose.rightAnkle, direction * -0.028, -0.012);
}

function enhanceCatch(keeper, pose) {
  pose.crouch = clamp(Number(pose.crouch || 0) + 0.024, 0, 0.5);
  pose.rotation = Number(pose.rotation || 0) * 0.84;
  pose.torsoLean = Number(pose.torsoLean || 0) * 0.88;
  pose.gloveScale = Number(pose.gloveScale || 1) + 0.045;
  if (pose.catchBallWorld) {
    pose.catchBallWorld.y = mix(Number(pose.catchBallWorld.y || 0), Number(keeper.world.y || 0) + 0.98, 0.12);
  }
}

function enhanceParry(pose, direction, heightNorm) {
  pose.torsoLean = Number(pose.torsoLean || 0) + direction * 0.035;
  pose.gloveScale = Number(pose.gloveScale || 1) + 0.035;
  const lead = direction > 0 ? pose.absoluteRightHand : pose.absoluteLeftHand;
  adjustWorldHand(lead, direction * 0.06, heightNorm > 0.55 ? 0.028 : -0.012, 0.008);
}

function enhanceRecovery(keeper, pose) {
  keeper.world.y = Math.max(0, Number(keeper.world.y || 0) * 0.2);
  pose.crouch = clamp(Number(pose.crouch || 0) * 0.72 + 0.055, 0, 0.4);
  pose.rotation = Number(pose.rotation || 0) * 0.64;
  pose.torsoLean = Number(pose.torsoLean || 0) * 0.68;
  pose.chestX = Number(pose.chestX || 0) * 0.55;
}

function enhanceFrame(frame, shot = state.shot) {
  if (isPenaltyDuel()) return frame;
  const keeper = frame?.keeper;
  const pose = keeper?.pose;
  const plan = shot?.keeperPlan;
  if (!keeper?.world || !pose || !plan?.contact) return frame;

  const baseIdle = keeperWorld(state.currentStage);
  const baseX = Number(plan.start?.x ?? baseIdle?.x ?? 0);
  const contactX = Number(plan.contact.x || 0);
  const contactY = Number(plan.contact.y || 0);
  const recovery = Number(pose.recovery || 0);
  const { lateralReach, heightNorm } = saveMetrics({ contactX, contactY, baseX });
  const saveBodyClass = classifyKeeperSaveBodyV55({
    outcome: shot?.outcome,
    saveType: shot?.saveType,
    contactX,
    contactY,
    baseX,
    recovery
  });

  pose.saveBodyClass = saveBodyClass;
  pose.saveBodyReadabilityBuild = BUILD;
  pose.lateralReachV55 = lateralReach;
  pose.heightNormV55 = heightNorm;
  frame.saveBodyClass = saveBodyClass;
  frame.saveBodyReadabilityBuild = BUILD;

  if (!saveBodyClass) return frame;

  const direction = Math.sign(contactX - baseX || Number(pose.rotation || 0) || 1);
  if (saveBodyClass === "LOW_COLLAPSE") enhanceLowCollapse(keeper, pose, direction);
  else if (saveBodyClass === "FULL_STRETCH") enhanceFullStretch(keeper, pose, direction, heightNorm);
  else if (saveBodyClass === "CATCH") enhanceCatch(keeper, pose);
  else if (saveBodyClass === "PARRY") enhanceParry(pose, direction, heightNorm);
  else if (saveBodyClass === "RECOVERY") enhanceRecovery(keeper, pose);

  lastFrame = Object.freeze({
    build: BUILD,
    saveBodyClass,
    saveType: shot?.saveType || null,
    lateralReach,
    heightNorm,
    motion: pose.motion || null,
    penaltyDuel: false
  });
  window.__footballLabKeeperSaveBodyFrameV55 = lastFrame;
  return frame;
}

function publishContract() {
  window.__footballLabKeeperSaveReadabilityV55 = Object.freeze({
    build: BUILD,
    installed,
    wrappedSource,
    saveBodyClasses: [...SAVE_BODY_CLASSES],
    classification: "resolved-save-type-plus-contact-geometry",
    presentationOnly: true,
    preservesKeeperAI: true,
    preservesSaveThresholds: true,
    preservesShotOutcome: true,
    preservesPhysics: true,
    preservesScoring: true,
    penaltyDuelChanged: false,
    classify: (input) => classifyKeeperSaveBodyV55(input),
    snapshot: () => lastFrame ? { ...lastFrame } : null
  });
}

function installNow() {
  if (installed) return true;
  const current = window.__footballLabPremiumKeeperSceneDrawV3852;
  if (typeof current !== "function") return false;
  if (current.__footballLabV55SaveReadabilityHook === true) {
    installed = true;
    wrappedSource = current.__footballLabV55WrappedSource || current.name || "existing-v55-hook";
    publishContract();
    return true;
  }

  wrappedSource = current.name || "anonymous";
  const wrapped = function footballLabKeeperSaveReadabilityV55(time) {
    const result = current(time);
    const frame = window.__footballLabPremiumKeeperSceneFrameV3852;
    if (frame && !isPenaltyDuel()) enhanceFrame(frame);
    return result;
  };
  Object.defineProperty(wrapped, "__footballLabV55SaveReadabilityHook", {
    value: true,
    configurable: false,
    enumerable: false,
    writable: false
  });
  Object.defineProperty(wrapped, "__footballLabV55WrappedSource", {
    value: wrappedSource,
    configurable: false,
    enumerable: false,
    writable: false
  });

  window.__footballLabPremiumKeeperSceneDrawV3852 = wrapped;
  installed = true;
  clearTimeout(installTimer);
  installTimer = 0;
  publishContract();
  return true;
}

function retryInstall() {
  if (installNow() || installRetries >= MAX_INSTALL_RETRIES) {
    publishContract();
    return;
  }
  installRetries += 1;
  installTimer = setTimeout(retryInstall, INSTALL_RETRY_MS);
}

publishContract();
retryInstall();
