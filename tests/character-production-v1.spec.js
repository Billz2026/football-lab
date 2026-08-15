import { test, expect } from "@playwright/test";

async function waitForProductionContract(page) {
  await page.goto("/index.html?test=character-production-v1");
  await expect.poll(
    () => page.evaluate(() => window.__footballLabCharacterProductionV1?.build),
    { timeout: 15000 }
  ).toBe("1.0.0");
  await expect.poll(
    () => page.evaluate(() => window.__footballLabCharacterEngineV1?.build),
    { timeout: 15000 }
  ).toBe("1.0.0");
}

test("production character contract keeps premium 3D integration gated until assets are approved", async ({ page }) => {
  await waitForProductionContract(page);
  const state = await page.evaluate(() => ({
    contract: window.__footballLabCharacterProductionV1,
    engine: window.__footballLabCharacterEngineV1,
    snapshot: window.__footballLabCharacterEngineV1.snapshot,
    readiness: window.__footballLabCharacterEngineV1.readiness
  }));

  expect(state.contract.rendererTarget).toBe("rigged-3d-human-realism");
  expect(state.contract.masterOutfield).toBe("viktor-kane");
  expect(state.contract.masterGoalkeeper).toBe("mikkel-storm");
  expect(state.contract.assetCount).toBe(8);
  expect(state.contract.liveIntegration).toBe(false);
  expect(state.contract.explicitApprovalRequired).toBe(true);
  expect(state.contract.directCelebrityLikenesses).toBe(false);

  expect(state.engine.target).toBe("rigged-3d-human-realism");
  expect(state.snapshot.mode).toBe("v42-fallback");
  expect(state.snapshot.fallbackRenderer).toBe("v42.1-layered-canvas");
  expect(state.snapshot.productionRendererAvailable).toBe(false);
  expect(state.readiness.total).toBe(8);
  expect(state.readiness.ready).toBe(0);
  expect(state.readiness.awaiting).toBe(8);
  expect(state.readiness.mastersReady).toBe(false);
  expect(state.readiness.canEnableLiveIntegration).toBe(false);
});

test("Viktor Kane remains the active production identity while the approved fallback still renders", async ({ page }) => {
  await page.goto("/index.html?test=character-production-v1");
  await page.evaluate(() => localStorage.setItem("footballLabSelectedKickerV13", "dax-ryder"));
  await page.reload();
  await waitForProductionContract(page);

  await page.locator("#classicCard").click();
  await page.locator("#kickerConfirmV13").click();
  await expect(page.locator("#gameScreen")).toHaveClass(/is-active/);

  await expect.poll(
    () => page.evaluate(() => window.__footballLabCharacterEngineV1.snapshot.activeCharacter),
    { timeout: 5000 }
  ).toBe("viktor-kane");
  await expect.poll(
    () => page.evaluate(() => window.__footballLabHeroFrameV42?.character),
    { timeout: 5000 }
  ).toBe("viktor-kane");
});
