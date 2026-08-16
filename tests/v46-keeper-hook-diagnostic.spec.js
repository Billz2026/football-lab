import { test, expect } from "@playwright/test";

async function enterClassic(page) {
  await page.goto("/index.html?diag=v46-keeper-hook", { waitUntil: "networkidle" });
  await page.locator("#classicCard").click();
  await expect.poll(() => page.evaluate(() => (
    document.querySelector("#gameScreen")?.classList.contains("is-active") ||
    document.querySelector("#kickerSelectV13")?.classList.contains("is-open")
  )), { timeout: 8000 }).toBe(true);
  if (await page.locator("#kickerSelectV13").isVisible().catch(() => false)) {
    await page.locator("#kickerConfirmV13").click();
  }
  const skip = page.getByRole("button", { name: "SKIP TUTORIAL" });
  if (await skip.isVisible().catch(() => false)) await skip.click({ force: true });
  await page.evaluate(() => document.activeElement?.blur?.());
}

async function forceMikkel(page) {
  await page.evaluate(async () => {
    const core = await import("/game/core-v6.js?v=32.4");
    const world = await import("/game/world-v6.js?v=32.4");
    core.state.stage = 4;
    core.state.currentStage = world.scenarioForStage(4);
    window.__footballLabPremiumKeeperSceneDrawV3852?.(performance.now());
  });
  await expect.poll(() => page.evaluate(() => window.__footballLabKeeperFrameV46?.character), { timeout: 12000 }).toBe("mikkel-storm");
}

async function press(page, phase) {
  await page.keyboard.press("Enter");
  await expect.poll(() => page.evaluate(() => document.documentElement.dataset.strikePhaseV324), { timeout: 2500 }).toBe(phase);
}

test("trace V46 keeper hook ownership through a real SAVE", async ({ page }) => {
  await enterClassic(page);
  await forceMikkel(page);

  await page.evaluate(() => {
    window.__keeperHookDiag = { calls: 0, samples: [] };
    const original = window.__footballLabPremiumKeeperSceneDrawV3852;
    window.__keeperHookDiag.initialV46 = original?.__footballLabV46KeeperHook === true;
    const diagnosticKeeperHook = function diagnosticKeeperHook(time) {
      window.__keeperHookDiag.calls += 1;
      const result = original(time);
      if (window.__keeperHookDiag.samples.length < 220) {
        const s = window.__footballLabAuthoritativeStateV46;
        const frame = window.__footballLabKeeperFrameV46;
        window.__keeperHookDiag.samples.push({
          time,
          animation: s?.animation ? {
            startedAt: s.animation.startedAt,
            runUpDuration: s.animation.runUpDuration,
            contactHoldDuration: s.animation.contactHoldDuration,
            flightDuration: s.animation.flightDuration,
            settleDuration: s.animation.settleDuration
          } : null,
          plan: s?.shot?.keeperPlan ? {
            reaction: s.shot.keeperPlan.reaction,
            flightSeconds: s.shot.keeperPlan.flightSeconds,
            diveDirection: s.shot.keeperPlan.diveDirection,
            targetY: s.shot.keeperPlan.contact?.y ?? s.shot.keeperPlan.target?.y
          } : null,
          frame: frame ? { clip: frame.clip, time: frame.time, renderer: frame.renderer, character: frame.character } : null
        });
      }
      return result;
    };
    Object.defineProperty(diagnosticKeeperHook, "__footballLabV46KeeperHook", { value: true });
    window.__footballLabPremiumKeeperSceneDrawV3852 = diagnosticKeeperHook;
  });

  await expect(page.locator("#shotAction")).toHaveText("START SHOT", { timeout: 6000 });
  await press(page, "aim");
  await page.evaluate(async () => {
    const core = await import("/game/core-v6.js?v=32.4");
    core.state.shot.previewAimX = 0.78;
    core.state.shot.previewAimY = 0.20;
    core.state.shot.previewCurve = 0;
  });
  await press(page, "power");
  await page.evaluate(async () => {
    const core = await import("/game/core-v6.js?v=32.4");
    core.state.meterValue = core.idealPower();
    core.state.lastTime = performance.now();
  });
  await press(page, "contact");
  await page.evaluate(async () => {
    const core = await import("/game/core-v6.js?v=32.4");
    core.state.meterValue = 0.5;
    core.state.lastTime = performance.now();
  });
  await press(page, "shooting");
  await page.waitForTimeout(2300);

  const diag = await page.evaluate(() => window.__keeperHookDiag);
  console.log("V46_KEEPER_HOOK_DIAG", JSON.stringify(diag));
  expect(diag.initialV46).toBe(true);
  expect(diag.calls).toBeGreaterThan(20);
  expect(diag.samples.some((s) => s.animation)).toBe(true);
  expect(diag.samples.some((s) => s.plan)).toBe(true);
});
