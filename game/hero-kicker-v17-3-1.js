const upstreamUrl = new URL("./hero-kicker-v17-3.js?v=173", import.meta.url);
const response = await fetch(upstreamUrl, { cache: "no-store" });
if (!response.ok) throw new Error(`Unable to load V17.3 hero kicker (${response.status})`);
let source = await response.text();

source = source.replace(/from\s+"(\.\/[^"\n]+)"/g, (_, specifier) => {
  return `from "${new URL(specifier, upstreamUrl).href}"`;
});

const oldRecovery = 'const recover = { ...idle, phase: "recovery", crouch: .04, pelvisX: -.01, chestX: .012, lean: .01, rotate: .012 };';
const newRecovery = `const recover = {
  phase: "recovery-step", crouch: .052, pelvisX: -.025, chestX: .028, lean: .032, rotate: .034, shoulder: .018,
  lk: P(-.135, -.155), rk: P(.025, -.19), la: P(-.205, -.006), ra: P(.105, -.018),
  lt: P(-.275, -.002), rt: P(.18, -.004), le: P(-.22, -.48), re: P(.245, -.5),
  lh: P(-.275, -.37), rh: P(.315, -.41)
};
const neutral = { ...idle, phase: "recovery-neutral", crouch: .034, lean: 0, rotate: .004 };`;
if (!source.includes(oldRecovery)) throw new Error("V17.3.1 recovery-pose marker missing");
source = source.replace(oldRecovery, newRecovery);

const oldReplayRecovery = '    return blend(follow, recover, smooth((p.flight - .5) / .5));';
const newReplayRecovery = '    if (p.flight < .84) return blend(follow, recover, smooth((p.flight - .5) / .34));\n    return blend(recover, neutral, smooth((p.flight - .84) / .16));';
if (!source.includes(oldReplayRecovery)) throw new Error("V17.3.1 replay recovery marker missing");
source = source.replace(oldReplayRecovery, newReplayRecovery);

const oldLiveRecovery = '    return blend(follow, recover, Math.max(smooth((p.flight - .48) / .42), p.settle));';
const newLiveRecovery = '    if (p.flight < .84) return blend(follow, recover, smooth((p.flight - .48) / .36));\n    return blend(recover, neutral, Math.max(smooth((p.flight - .84) / .16), p.settle));';
if (!source.includes(oldLiveRecovery)) throw new Error("V17.3.1 live recovery marker missing");
source = source.replace(oldLiveRecovery, newLiveRecovery);

const oldDraw = '  transform(); draw(world, currentPose(p, time), time, character, p);';
const newDraw = '  window.__footballLabHeroFrameV1731 = { time, character: character.id, active: true };\n  transform(); draw(world, currentPose(p, time), time, character, p);';
if (!source.includes(oldDraw)) throw new Error("V17.3.1 hero draw marker missing");
source = source.replace(oldDraw, newDraw);

source += "\n//# sourceURL=football-lab-hero-kicker-v17-3-1-generated.js\n";
const moduleUrl = URL.createObjectURL(new Blob([source], { type: "text/javascript" }));
let generated;
try {
  generated = await import(moduleUrl);
} finally {
  URL.revokeObjectURL(moduleUrl);
}

window.__footballLabHeroV1731 = true;
window.__footballLabRecoverySeenV1731 = null;

export function drawHeroKicker(time) {
  generated.drawHeroKicker(time);
  const snapshot = window.__footballLabMotionSnapshotV173;
  if (snapshot && /recovery-step|recovery-neutral/.test(snapshot.phase || "")) {
    window.__footballLabRecoverySeenV1731 = { ...snapshot, seenAt: time };
  }
}
