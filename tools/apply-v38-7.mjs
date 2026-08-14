import fs from "node:fs";

const paths = {
  base: "game/runtime-v23-generated-render-v17-1-base-v1731-33ac3afcb7.js",
  bridgeV9: "game/runtime-v23-bridge-render-v9-v17-3-1-daf59fdc4b.js",
  genV15: "game/runtime-v23-generated-render-v15-v1731-1b04a249af.js",
  genV17: "game/runtime-v23-generated-render-v17-v1731-7f257084b1.js",
  bridgeV17: "game/runtime-v23-bridge-render-v17-3-1-64b7ab3399.js",
  runtime: "game/runtime-v23-main.js",
  flight: "game/flight-v33.js",
  app: "app.js"
};

const files = Object.fromEntries(Object.entries(paths).map(([key, path]) => [key, fs.readFileSync(path, "utf8")]));
function replaceOnce(text, from, to, label) {
  if (!text.includes(from)) throw new Error(`V38.7 patch failed: ${label}`);
  return text.replace(from, to);
}

files.base = replaceOnce(files.base,
`  if (state.animation && progress.motionFlight > 0 && !reducedMotion) {
    const follow = easeOutCubic(progress.motionFlight);
    const ball = sampleShotPath(state.shot?.path, progress.motionFlight);
    camera.position.z -= follow * (progress.replay ? 4.9 : 3.8);
    camera.position.y += follow * 0.24;
    camera.fovY = lerp(camera.fovY, progress.replay ? 27.8 : 30.4, follow * 0.76);
    if (ball) {
      camera.target.x = lerp(camera.target.x, ball.x, follow * 0.76);
      camera.target.y = lerp(camera.target.y, ball.y, follow * 0.64);
      camera.target.z = lerp(camera.target.z, ball.z, follow * (1 - progress.motionFlight) * 0.36);
    }
  }`,
`  if (state.animation && progress.motionFlight > 0 && !reducedMotion) {
    const composition = easeOutCubic(clamp((progress.motionFlight - 0.085) / 0.915, 0, 1));
    const finalApproach = smooth01(clamp((progress.motionFlight - 0.66) / 0.34, 0, 1));
    const ball = sampleShotPath(state.shot?.path, progress.motionFlight);
    camera.position.z -= composition * (progress.replay ? 5.55 : 4.55) + finalApproach * (progress.replay ? 0.55 : 0.42);
    camera.position.y += composition * 0.14;
    camera.fovY = lerp(
      camera.fovY,
      progress.replay ? 25.9 : 27.9,
      clamp(composition * 0.82 + finalApproach * 0.12, 0, 0.94)
    );
    if (ball) {
      camera.target.x = lerp(camera.target.x, ball.x, clamp(composition * 0.84 + finalApproach * 0.1, 0, 0.94));
      camera.target.y = lerp(camera.target.y, ball.y, clamp(composition * 0.72 + finalApproach * 0.12, 0, 0.9));
      camera.target.z = lerp(camera.target.z, ball.z, composition * (1 - progress.motionFlight) * 0.26);
    }
  }`, "base cinematic composition");
files.base = replaceOnce(files.base,
`    closeFollow: true,
    fovY: camera.fovY,`,
`    closeFollow: true,
    kickerClearsFrame: true,
    finalApproachEmphasis: true,
    impactHoldThroughSettle: true,
    fovY: camera.fovY,`, "camera metadata");

files.flight = replaceOnce(files.flight, 'const BUILD = "38.6.0";', 'const BUILD = "38.7.0";', "flight build");
files.flight = replaceOnce(files.flight,
`  const focus = easeOutCubic(clamp((progress - 0.012) / 0.988, 0, 1));
  const latePush = smoothStep(clamp((progress - 0.52) / 0.48, 0, 1));`,
`  const focus = easeOutCubic(clamp((progress - 0.06) / 0.94, 0, 1));
  const latePush = smoothStep(clamp((progress - 0.64) / 0.36, 0, 1));`, "flight composition timing");
files.flight = replaceOnce(files.flight,
`  const originX = clamp(50 + (targetX - 0.5) * 22, 41.5, 58.5);
  const originY = replay ? 43 : 46;`,
`  const originX = clamp(50 + (targetX - 0.5) * 34, 34, 66);
  const originY = replay ? 37 : 39;`, "destination-biased transform origin");
files.flight = replaceOnce(files.flight,
`  const scale = 1
    + focus * (replay ? 0.138 : 0.108)
    + latePush * (replay ? 0.016 : 0.013);
  const settleLift = focus * (replay ? 0.3 : 0.12);

  canvas.style.transformOrigin = \`${originX}% ${originY}%\`;
  canvas.style.transform = \`translate3d(0, ${settleLift}%, 0) scale(${scale.toFixed(4)})\`;`,
`  const scale = 1
    + focus * (replay ? 0.165 : 0.135)
    + latePush * (replay ? 0.065 : 0.052);

  canvas.style.transformOrigin = \`${originX}% ${originY}%\`;
  canvas.style.transform = \`translate3d(0, 0, 0) scale(${scale.toFixed(4)})\`;`, "goal-first canvas composition");
files.flight = replaceOnce(files.flight,
`  camera: "cinematic-target-biased-ball-follow",
  readableCurl: true,
  presentationOnly: true`,
`  camera: "goal-first-destination-biased-flight-composition",
  readableCurl: true,
  kickerClearsFrameAfterContact: true,
  finalApproachEmphasis: true,
  impactHoldThroughSettle: true,
  presentationOnly: true`, "flight metadata");

for (const key of ["bridgeV9","genV15","genV17","bridgeV17","runtime"]) {
  files[key] = files[key].replaceAll("v=38.6.0", "v=38.7.0");
}
files.app = files.app.replaceAll("38.6.0", "38.7.0");
files.app = files.app.replace("Football Lab V38.6 ball flight and impact feel", "Football Lab V38.7 flight camera and shot composition");
files.app = files.app.replace('badge.textContent = "V38.6";', 'badge.textContent = "V38.7";');
files.app = files.app.replace('camera: "cinematic-target-biased-ball-follow",', 'camera: "goal-first-destination-biased-flight-composition",\n          cameraKickerClearance: "post-contact-frame-clear",\n          cameraFinalApproach: "late-flight-goalmouth-emphasis",\n          cameraImpactHold: "through-settle",');
files.app = files.app.replace('        window.__footballLabReleaseV386 = release;', '        window.__footballLabReleaseV386 = release;\n        window.__footballLabReleaseV387 = release;');

for (const [key, path] of Object.entries(paths)) fs.writeFileSync(path, files[key]);
console.log("Applied Football Lab V38.7 flight camera and shot composition");
