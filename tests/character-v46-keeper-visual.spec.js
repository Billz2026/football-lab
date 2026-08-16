import fs from "node:fs";
import { test, expect } from "@playwright/test";

async function enterClassic(page) {
  await page.goto("/index.html?capture=mikkel-v46-dive", { waitUntil: "networkidle" });
  await page.locator("#classicCard").click();
  await expect.poll(
    () => page.evaluate(() => (
      document.querySelector("#gameScreen")?.classList.contains("is-active") ||
      document.querySelector("#kickerSelectV13")?.classList.contains("is-open")
    )), { timeout: 8000 }
  ).toBe(true);
  const state = await page.evaluate(() => ({
    game: document.querySelector("#gameScreen")?.classList.contains("is-active"),
    picker: document.querySelector("#kickerSelectV13")?.classList.contains("is-open")
  }));
  if (!state.game && state.picker) await page.locator("#kickerConfirmV13").click();
  await expect(page.locator("#gameScreen")).toHaveClass(/is-active/);
}

async function dismissCoach(page) {
  const skip = page.getByRole("button", { name: "SKIP TUTORIAL" });
  if (await skip.isVisible().catch(() => false)) await skip.click({ force: true });
  await page.evaluate(() => document.activeElement?.blur?.());
}

async function forceMikkelStageThroughWorldContract(page) {
  await page.evaluate(async () => {
    const core = await import("/game/core-v6.js?v=32.4");
    const world = await import("/game/world-v6.js?v=32.4");
    core.state.stage = 4;
    core.state.currentStage = world.scenarioForStage(4);
    window.__footballLabPremiumKeeperSceneDrawV3852?.(performance.now());
  });
  await expect.poll(
    () => page.evaluate(() => window.__footballLabKeeperFrameV46?.renderer),
    { timeout: 12000 }
  ).toBe("real-skinned-glb-3d");
  await expect.poll(
    () => page.evaluate(() => window.__footballLabKeeperFrameV46?.character),
    { timeout: 3000 }
  ).toBe("mikkel-storm");
}

async function browserKeyboardAction(page) {
  const before = await page.evaluate(() => ({
    phase: document.documentElement.dataset.strikePhaseV324 || "",
    label: document.querySelector("#shotAction")?.textContent?.trim() || ""
  }));
  await page.keyboard.press("Enter");
  const after = await page.evaluate(() => ({
    phase: document.documentElement.dataset.strikePhaseV324 || "",
    label: document.querySelector("#shotAction")?.textContent?.trim() || ""
  }));
  return { before, after };
}

async function executeLiveShot(page) {
  await dismissCoach(page);
  await expect(page.locator("#shotAction")).toHaveText("START SHOT", { timeout: 6000 });
  await expect.poll(
    () => page.evaluate(() => document.documentElement.dataset.strikePhaseV324),
    { timeout: 3000 }
  ).toBe("ready");

  const trace = [];

  trace.push(await browserKeyboardAction(page));
  await expect.poll(
    () => page.evaluate(() => document.documentElement.dataset.strikePhaseV324),
    { timeout: 2500 }
  ).toBe("aim");

  await page.evaluate(async () => {
    const core = await import("/game/core-v6.js?v=32.4");
    core.state.shot.previewAimX = 0.78;
    core.state.shot.previewAimY = 0.20;
    core.state.shot.previewCurve = 0;
  });
  trace.push(await browserKeyboardAction(page));
  await expect.poll(
    () => page.evaluate(() => document.documentElement.dataset.strikePhaseV324),
    { timeout: 2500 }
  ).toBe("power");

  await page.evaluate(async () => {
    const core = await import("/game/core-v6.js?v=32.4");
    core.state.meterValue = core.idealPower();
    core.state.lastTime = performance.now();
  });
  trace.push(await browserKeyboardAction(page));
  await expect.poll(
    () => page.evaluate(() => document.documentElement.dataset.strikePhaseV324),
    { timeout: 2500 }
  ).toBe("contact");

  await page.evaluate(async () => {
    const core = await import("/game/core-v6.js?v=32.4");
    core.state.meterValue = 0.5;
    core.state.lastTime = performance.now();
  });
  trace.push(await browserKeyboardAction(page));
  await expect.poll(
    () => page.evaluate(() => document.documentElement.dataset.strikePhaseV324),
    { timeout: 2500 }
  ).toBe("shooting");

  const shot = await page.evaluate(async () => {
    const core = await import("/game/core-v6.js?v=32.4");
    return {
      outcome: core.state.shot?.outcome,
      keeperPlan: core.state.shot?.keeperPlan,
      diagnostics: core.state.shot?.diagnostics,
      aimX: core.state.shot?.aimX,
      aimY: core.state.shot?.aimY,
      power: core.state.shot?.power,
      contactQuality: core.state.shot?.contactQuality
    };
  });
  console.log("MIKKEL_V46_SHOT_INPUT_TRACE", JSON.stringify(trace));
  console.log("MIKKEL_V46_REAL_SHOT", JSON.stringify(shot));
  expect(shot.keeperPlan).toBeTruthy();
  expect(["GOAL", "SAVE"]).toContain(shot.outcome);
}

async function armKeeperCaptures(page) {
  await page.evaluate(() => {
    window.__mikkelV46Captures = {};
    window.__mikkelV46Trace = [];
    let previousClip = null;

    function copyCanvas(source) {
      if (!source) return null;
      const snapshot = document.createElement("canvas");
      snapshot.width = source.width;
      snapshot.height = source.height;
      snapshot.getContext("2d", { alpha: true })?.drawImage(source, 0, 0);
      return snapshot;
    }

    function sample() {
      const frame = window.__footballLabKeeperFrameV46;
      const clip = frame?.clip || "";
      if (clip && clip !== previousClip) {
        window.__mikkelV46Trace.push({
          clip,
          time: frame?.time ?? performance.now(),
          motion: { ...(window.__footballLabKeeperMotionV32 || {}) }
        });
        previousClip = clip;
      }
      const target = clip === "set"
        ? "set"
        : /^dive-(left|right)-(low|mid|high)$/.test(clip)
          ? "dive"
          : clip === "landing"
            ? "landing"
            : clip === "recovery"
              ? "recovery"
              : null;
      if (target && !window.__mikkelV46Captures[target]) {
        window.__mikkelV46Captures[target] = {
          frame: { ...frame },
          keeperMotion: { ...(window.__footballLabKeeperMotionV32 || {}) },
          snapshot: copyCanvas(document.querySelector("#gameCanvas"))
        };
      }
      if (!window.__mikkelV46Captures.dive || (!window.__mikkelV46Captures.landing && !window.__mikkelV46Captures.recovery)) {
        requestAnimationFrame(sample);
      }
    }
    requestAnimationFrame(sample);
  });
}

async function writeCapture(page, key, path) {
  const capture = await page.evaluate((name) => {
    const stored = window.__mikkelV46Captures?.[name];
    return stored ? {
      frame: stored.frame,
      keeperMotion: stored.keeperMotion,
      dataUrl: stored.snapshot?.toDataURL("image/png") || null,
      trace: [...(window.__mikkelV46Trace || [])]
    } : null;
  }, key);
  expect(capture?.frame?.renderer).toBe("real-skinned-glb-3d");
  expect(capture?.frame?.production3D).toBe(true);
  expect(capture?.frame?.character).toBe("mikkel-storm");
  expect(capture?.dataUrl).toMatch(/^data:image\/png;base64,/);
  fs.writeFileSync(path, Buffer.from(capture.dataUrl.split(",")[1], "base64"));
  return capture;
}

test("capture Mikkel Storm V46 set stance and a real AI-driven dive in the gameplay camera", async ({ page }) => {
  await enterClassic(page);
  await expect.poll(
    () => page.evaluate(() => window.__footballLabCharacter3DV46?.loaded?.includes("mikkel-storm")),
    { timeout: 20000 }
  ).toBe(true);

  await forceMikkelStageThroughWorldContract(page);
  await armKeeperCaptures(page);
  await page.evaluate(() => window.__footballLabPremiumKeeperSceneDrawV3852?.(performance.now()));
  await page.waitForFunction(() => Boolean(window.__mikkelV46Captures?.set?.snapshot), null, { timeout: 5000 });
  const setCapture = await writeCapture(page, "set", "test-results/mikkel-v46-set.png");
  expect(setCapture.frame.clip).toBe("set");

  await executeLiveShot(page);
  await expect.poll(
    () => page.evaluate(() => (window.__mikkelV46Trace || []).map((entry) => entry.clip)),
    { timeout: 10000 }
  ).toEqual(expect.arrayContaining([expect.stringMatching(/^dive-(left|right)-(low|mid|high)$/)]));

  await page.waitForFunction(
    () => Boolean(window.__mikkelV46Captures?.dive?.snapshot),
    null,
    { timeout: 10000, polling: "raf" }
  );
  const diveCapture = await writeCapture(page, "dive", "test-results/mikkel-v46-dive.png");
  expect(diveCapture.frame.clip).toMatch(/^dive-(left|right)-(low|mid|high)$/);

  await page.waitForFunction(
    () => Boolean(window.__mikkelV46Captures?.landing?.snapshot || window.__mikkelV46Captures?.recovery?.snapshot),
    null,
    { timeout: 10000, polling: "raf" }
  );
  const finishKey = await page.evaluate(() => window.__mikkelV46Captures?.landing ? "landing" : "recovery");
  const finishCapture = await writeCapture(page, finishKey, `test-results/mikkel-v46-${finishKey}.png`);
  expect(["landing", "recovery"]).toContain(finishCapture.frame.clip);
  console.log("MIKKEL_V46_LIVE_CLIP_TRACE", JSON.stringify(diveCapture.trace));

  const diagnostics = await page.evaluate(() => ({
    contract: window.__footballLabCharacter3DV46,
    keeper: window.__footballLabKeeperFrameV46,
    motion: window.__footballLabKeeperMotionV32
  }));
  console.log("MIKKEL_V46_VISUAL_DIAGNOSTICS", JSON.stringify(diagnostics));
  await page.screenshot({ path: "test-results/mikkel-v46-full-ui.png", fullPage: true });
});
