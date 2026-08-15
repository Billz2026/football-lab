import { test, expect } from "@playwright/test";

async function enterClassic(page) {
  await page.locator("#classicCard").click();
  await expect.poll(
    () => page.evaluate(() => (
      document.querySelector("#gameScreen")?.classList.contains("is-active") ||
      document.querySelector("#kickerSelectV13")?.classList.contains("is-open")
    )),
    { timeout: 5000 }
  ).toBe(true);

  const state = await page.evaluate(() => ({
    gameActive: document.querySelector("#gameScreen")?.classList.contains("is-active"),
    pickerOpen: document.querySelector("#kickerSelectV13")?.classList.contains("is-open")
  }));
  if (!state.gameActive && state.pickerOpen) await page.locator("#kickerConfirmV13").click();
  await expect(page.locator("#gameScreen")).toHaveClass(/is-active/);
}

async function loadViktor(page) {
  await page.goto("/index.html?test=character-v45");
  await page.evaluate(() => localStorage.setItem("footballLabSelectedKickerV13", "dax-ryder"));
  await page.reload();
  await enterClassic(page);
}

test("V45 renders Viktor through the volumetric anatomical 2.5D body system", async ({ page }) => {
  await loadViktor(page);

  await expect.poll(
    () => page.evaluate(() => window.__footballLabHeroFrameV45?.build),
    { timeout: 5000 }
  ).toBe("45.0.0");

  const frame = await page.evaluate(() => ({
    frame: window.__footballLabHeroFrameV45,
    renderer: window.__footballLabCharacterRendererV45,
    motion: window.__footballLabMotionSnapshotV45
  }));

  expect(frame.frame.character).toBe("viktor-kane");
  expect(frame.frame.renderer).toBe("volumetric-articulated-2.5d");
  expect(frame.frame.rig).toBe("anatomical-tapered-volume-canvas");
  expect(frame.frame.volumetricBody).toBe(true);
  expect(frame.frame.staticSpriteFrames).toBe(false);
  expect(frame.renderer.volumetricTorso).toBe(true);
  expect(frame.renderer.anatomicalLimbTaper).toBe(true);
  expect(frame.renderer.muscleVolume).toBe(true);
  expect(frame.motion.volumetric).toBe(true);

  await page.screenshot({ path: "test-results/v45-viktor-volumetric.png", fullPage: true });
});

test("V45 goalkeeper uses the volumetric scene-depth body without changing keeper AI", async ({ page }) => {
  await loadViktor(page);

  await expect.poll(
    () => page.evaluate(() => window.__footballLabKeeperRendererV45?.build),
    { timeout: 6000 }
  ).toBe("45.0.0");

  await page.evaluate(async () => {
    const core = await import("/game/core-v6.js?v=32.4");
    const world = await import("/game/world-v6.js?v=32.4");
    core.state.stage = 4;
    core.state.currentStage = world.scenarioForStage(4);
    window.__footballLabPremiumKeeperSceneDrawV3852?.(performance.now());
  });

  await expect.poll(
    () => page.evaluate(() => window.__footballLabKeeperFrameV45?.renderer),
    { timeout: 5000 }
  ).toBe("volumetric-articulated-2.5d");

  const keeper = await page.evaluate(() => ({
    frame: window.__footballLabKeeperFrameV45,
    renderer: window.__footballLabKeeperRendererV45
  }));

  expect(keeper.frame.character).toBe("mikkel-storm");
  expect(keeper.frame.volumetricBody).toBe(true);
  expect(keeper.frame.sceneDepth).toBe(true);
  expect(keeper.frame.staticSpriteFrames).toBe(false);
  expect(keeper.renderer.keeperAIChanged).toBe(false);
  expect(keeper.renderer.shotOutcomeChanged).toBe(false);

  await page.screenshot({ path: "test-results/v45-mikkel-volumetric.png", fullPage: true });
});
