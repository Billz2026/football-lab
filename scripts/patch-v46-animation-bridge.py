from pathlib import Path

main = Path("game/main-v18.js")
text = main.read_text()
old = 'source += "\\n//# sourceURL=football-lab-main-v19-generated.js\\n";'
new = 'source += "\\nwindow.__footballLabAuthoritativeStateV46 = state;\\n//# sourceURL=football-lab-main-v19-generated.js\\n";'
if old not in text:
    raise SystemExit("main-v18 authoritative state insertion point missing")
main.write_text(text.replace(old, new, 1))

path = Path("game/character-3d-v46.js")
text = path.read_text()

old = "const failed = new Map();\n\nfunction publish(status, extra = {}) {"
new = '''const failed = new Map();

function liveState() {
  if (typeof window !== "undefined" && window.__footballLabAuthoritativeStateV46) {
    return window.__footballLabAuthoritativeStateV46;
  }
  return state;
}

function publish(status, extra = {}) {'''
if old not in text:
    raise SystemExit("character bridge liveState insertion point missing")
text = text.replace(old, new, 1)

old = '''function activeKeeperEntry() {
  const source = keeperForStage(state.stage);
  return characterAssetBySourceIdV1(source.id)
    || (source.id === "aggressive" ? characterAssetV1("mikkel-storm") : null);
}

function outfieldProgress(time) {
  if (!state.animation) return { run: 0, contact: 0, flight: 0, settle: 0, replay: false };
  const animation = state.animation;'''
new = '''function activeKeeperEntry() {
  const gameState = liveState();
  const source = keeperForStage(gameState.stage);
  return characterAssetBySourceIdV1(source.id)
    || (source.id === "aggressive" ? characterAssetV1("mikkel-storm") : null);
}

function outfieldProgress(time) {
  const gameState = liveState();
  if (!gameState.animation) return { run: 0, contact: 0, flight: 0, settle: 0, replay: false };
  const animation = gameState.animation;'''
if old not in text:
    raise SystemExit("character bridge progress replacement missing")
text = text.replace(old, new, 1)

old = '  if (!state.animation) return { clip: "idle", t: (time % 2400) / 2400, p };'
new = '  if (!liveState().animation) return { clip: "idle", t: (time % 2400) / 2400, p };'
if old not in text:
    raise SystemExit("outfield phase state guard missing")
text = text.replace(old, new, 1)

old = '  if (!state.animation) return 0;\n  if (p.replay) return 1;'
new = '  if (!liveState().animation) return 0;\n  if (p.replay) return 1;'
if old not in text:
    raise SystemExit("root travel state guard missing")
text = text.replace(old, new, 1)

marker = '''function keeperClip(frame) {
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
'''
replacement = marker + '''
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
'''
if marker not in text:
    raise SystemExit("keeper clip marker missing")
text = text.replace(marker, replacement, 1)

old = '''  const phase = outfieldPhase(time);
  const world = kickerWorld(state.currentStage, rootTravel(phase.p));
  const target = ballWorld(state.currentStage);'''
new = '''  const gameState = liveState();
  const phase = outfieldPhase(time);
  const world = kickerWorld(gameState.currentStage, rootTravel(phase.p));
  const target = ballWorld(gameState.currentStage);'''
if old not in text:
    raise SystemExit("hero world replacement missing")
text = text.replace(old, new, 1)

old = '  const cameraState = buildCamera(state.currentStage);'
new = '  const cameraState = buildCamera(gameState.currentStage);'
if old not in text:
    raise SystemExit("hero camera replacement missing")
text = text.replace(old, new, 1)

old = '''function renderKeeper3D(time, frame, configured) {
  const keeper = frame?.keeper;
  if (!keeper?.world || !keeper?.pose) return false;
  const clip = keeperClip(frame);
  const flight = outfieldProgress(time).flight;
  const t = /set/.test(clip) ? (time % 2200) / 2200 : clamp(flight, 0, 1);
  if (!scrubAction(configured, clip, t)) return false;

  const target = ballWorld(state.currentStage);
  faceTarget(configured.model, keeper.world, target, configured.yawOffset);
  return renderConfigured(configured, buildCamera(state.currentStage));
}'''
new = '''function renderKeeper3D(time, frame, configured) {
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
}'''
if old not in text:
    raise SystemExit("keeper render replacement missing")
text = text.replace(old, new, 1)

path.write_text(text)
print("Patched V46 authoritative animation bridge")
