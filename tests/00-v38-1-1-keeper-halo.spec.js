import { test, expect } from "@playwright/test";

async function ready(page) {
  await page.goto("/index.html?test=keeper-visuals-current");
  await expect.poll(
    () => page.evaluate(() => Boolean(window.__footballLabKeeperVisualsV3852)),
    { timeout: 10000 }
  ).toBe(true);
}

test("current keeper visuals keep the legacy oval and hard halo removed", async ({ page }) => {
  await ready(page);
  const contract = await page.evaluate(() => window.__footballLabKeeperVisualsV3852);

  expect(contract.build).toBe("38.5.2");
  expect(contract.ovalMarkerRemoved).toBe(true);
  expect(contract.hardEllipseShadowRemoved).toBe(true);
  expect(contract.shadow).toBe("soft-grounded-radial");
  expect(contract.contactRingRemoved).toBe(true);
  expect(contract.legacyKeeperSuppressed).toBe(true);
  expect(contract.preservesKeeperAI).toBe(true);
  expect(contract.preservesAiming).toBe(true);
  expect(contract.preservesDifficulty).toBe(true);
  expect(contract.preservesShotOutcome).toBe(true);
});

test("current keeper renderer no longer depends on the retired halo monkey patch", async ({ page }) => {
  await ready(page);
  const contract = await page.evaluate(() => ({
    visuals: window.__footballLabKeeperVisualsV3852,
    postSceneDisabled: window.__footballLabKeeperPostSceneOverlayDisabledV3852,
    sceneDraw: typeof window.__footballLabPremiumKeeperSceneDrawV3852
  }));

  expect(contract.visuals.legacyCanvasMonkeyPatch).toBe(false);
  expect(contract.visuals.postSceneOverlay).toBe(false);
  expect(contract.visuals.trueSceneDepth).toBe(true);
  expect(contract.postSceneDisabled).toBe(true);
  expect(contract.sceneDraw).toBe("function");
});

test("V41 release preserves the keeper halo and ground-shadow decisions", async ({ page }) => {
  await ready(page);
  await expect.poll(
    () => page.evaluate(() => window.__footballLabReleaseV410?.build),
    { timeout: 10000 }
  ).toBe("41.0.0");

  const release = await page.evaluate(() => window.__footballLabReleaseV410);
  expect(release.keeperBodyHalo).toBe("removed");
  expect(release.keeperProjectedPenaltyArc).toBe("suppressed-in-free-kick-view");
  expect(release.keeperGroundShadow).toBe("soft-ground-only");
});
