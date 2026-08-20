import { test, expect } from "@playwright/test";
import { loadGameplay } from "./helpers/load-gameplay.js";

async function ready(page) {
  await page.goto("/index.html?test=keeper-ghost-current");
  await loadGameplay(page);
  await expect.poll(
    () => page.evaluate(() => Boolean(window.__footballLabKeeperVisualsV3852)),
    { timeout: 10000 }
  ).toBe(true);
}

test("current keeper renderer suppresses the legacy goalkeeper rig and preserves gameplay systems", async ({ page }) => {
  await ready(page);
  const contract = await page.evaluate(() => window.__footballLabKeeperVisualsV3852);

  expect(contract.build).toBe("38.5.2");
  expect(contract.legacyKeeperSuppressed).toBe(true);
  expect(contract.trueSceneDepth).toBe(true);
  expect(contract.postSceneOverlay).toBe(false);
  expect(contract.wallReadabilityOverlay).toBe(false);
  expect(contract.preservesKeeperAI).toBe(true);
  expect(contract.preservesAiming).toBe(true);
  expect(contract.preservesDifficulty).toBe(true);
  expect(contract.preservesShotOutcome).toBe(true);
});

test("premium keeper scene draw is the authoritative keeper presentation", async ({ page }) => {
  await ready(page);

  const result = await page.evaluate(() => ({
    sceneDraw: typeof window.__footballLabPremiumKeeperSceneDrawV3852,
    postSceneDisabled: window.__footballLabKeeperPostSceneOverlayDisabledV3852,
    legacyCanvasMonkeyPatch: window.__footballLabKeeperVisualsV3852?.legacyCanvasMonkeyPatch,
    sceneOrder: window.__footballLabKeeperVisualsV3852?.keeperSceneOrder
  }));

  expect(result.sceneDraw).toBe("function");
  expect(result.postSceneDisabled).toBe(true);
  expect(result.legacyCanvasMonkeyPatch).toBe(false);
  expect(result.sceneOrder).toBe("goal-keeper-wall-ball");
});
