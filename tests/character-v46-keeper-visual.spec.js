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

async function productionKeyboardAction(page) {
  return page.evaluate(() => {
    const action = document.querySelector("#shotAction");
    const before = {
      phase: document.documentElement.dataset.strikePhaseV324 || "",
      label: action?.textContent?.trim() || ""
    };
    document.dispatchEvent(new KeyboardEvent("keydown", {
      key: "Enter",
      code: "Enter",
      bubbles: true,
      cancelable: true,
      repeat: false
    }));
    return {
      before,
      after: {
        phase: document.documentElement.dataset.strikePhaseV324 || "",
        label: action?.textContent?.trim() || ""
      }
    };
  });
}

async function executeLiveShot(page) {
  await dismissCoach(page);
  await expect(page.locator("#shotAction")).toHaveText("START SHOT", { timeout: 6000 });
  await expect.poll(
    () => page.evaluate(() => document.documentElement.dataset.strikePhaseV324),
    { timeout: 3000 }
  ).toBe("ready");

  const expected = [
    ["aim", "STRIKE"],
    ["power", "LOCK POWER"],
    ["contact", "LOCK CONTACT"],
    ["shooting", "SHOT IN PLAY"]
  ];
  const delays = [120, 180, 180, 0];
  const trace = [];
  for (let index = 0; index < expected.length; index += 1) {
    trace.push(await productionKeyboardAction(page));
    const [phase, label] = expected[index];
    await expect.poll(
      () => page.evaluate(() => document.documentElement.dataset.strikePhaseV324),
      { timeout: 2500 }
    ).toBe(phase);
    await expect.poll(
      () => page.locator("#shotAction").textContent(),
      { timeout: 2500 }
    ).toContain(label);
    if (delays[index]) await page.waitForTimeout(delays[index]);
  }
  console.log("MIKKEL_V46_SHOT_INPUT_TRACE", JSON.stringify(trace));
}

async function armKeeperCaptures(page) {
  await page.evaluate(() => {
    window.__mikkelV46Captures = {};
    function sample() {
      const frame = window.__footballLabKeeperFrameV46;
      const clip = frame?.clip || "";
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
        const canvas = document.querySelector("#gameCanvas");
        window.__mikkelV46Captures[target] = {
          frame: { ...frame },
          keeperMotion: { ...(window.__footballLabKeeperMotionV32 || {}) },
          dataUrl: canvas?.toDataURL("image/png") || null
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
  const capture = await page.evaluate((name) => window.__mikkelV46Captures?.[name], key);
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
  await page.waitForFunction(() => Boolean(window.__mikkelV46Captures?.set?.dataUrl), null, { timeout: 5000 });
  const setCapture = await writeCapture(page, "set", "test-results/mikkel-v46-set.png");
  expect(setCapture.frame.clip).toBe("set");

  await executeLiveShot(page);
  await page.waitForFunction(
    () => Boolean(window.__mikkelV46Captures?.dive?.dataUrl),
    null,
    { timeout: 10000, polling: "raf" }
  );
  const diveCapture = await writeCapture(page, "dive", "test-results/mikkel-v46-dive.png");
  expect(diveCapture.frame.clip).toMatch(/^dive-(left|right)-(low|mid|high)$/);
  expect(diveCapture.keeperMotion.airborne).toBe(true);

  await page.waitForFunction(
    () => Boolean(window.__mikkelV46Captures?.landing?.dataUrl || window.__mikkelV46Captures?.recovery?.dataUrl),
    null,
    { timeout: 10000, polling: "raf" }
  );
  const finishKey = await page.evaluate(() => window.__mikkelV46Captures?.landing ? "landing" : "recovery");
  const finishCapture = await writeCapture(page, finishKey, `test-results/mikkel-v46-${finishKey}.png`);
  expect(["landing", "recovery"]).toContain(finishCapture.frame.clip);

  const diagnostics = await page.evaluate(() => ({
    contract: window.__footballLabCharacter3DV46,
    keeper: window.__footballLabKeeperFrameV46,
    motion: window.__footballLabKeeperMotionV32
  }));
  console.log("MIKKEL_V46_VISUAL_DIAGNOSTICS", JSON.stringify(diagnostics));
  await page.screenshot({ path: "test-results/mikkel-v46-full-ui.png", fullPage: true });
});
