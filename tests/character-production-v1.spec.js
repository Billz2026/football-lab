import { test, expect } from "@playwright/test";
import { loadGameplay } from "./helpers/load-gameplay.js";

async function waitForProductionContract(page) {
  await page.goto("/index.html?test=character-production-v1");
  await loadGameplay(page);
  await expect.poll(
    () => page.evaluate(() => window.__footballLabCharacterProductionV1?.build),
    { timeout: 15000 }
  ).toBe("1.0.2");
  await expect.poll(
    () => page.evaluate(() => window.__footballLabCharacterEngineV1?.build),
    { timeout: 15000 }
  ).toBe("1.0.2");
}

async function enterClassic(page) {
  await page.locator("#classicCard").click();
  await expect.poll(
    () => page.evaluate(() => (
      document.querySelector("#gameScreen")?.classList.contains("is-active") ||
      document.querySelector("#kickerSelectV13")?.classList.contains("is-open")
    )),
    { timeout: 5000 }
  ).toBe(true);

  const gameActive = await page.evaluate(() => document.querySelector("#gameScreen")?.classList.contains("is-active"));
  if (!gameActive) await page.locator("#kickerConfirmV13").click();
  await expect(page.locator("#gameScreen")).toHaveClass(/is-active/);
}

test("production character contract keeps premium 3D integration gated and records Viktor arcade fallback", async ({ page }) => {
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
  expect(state.contract.liveArcadeFallback).toContain("viktor-kane");
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

test("Viktor Kane remains the active identity but uses the shared arcade renderer live", async ({ page }) => {
  await page.goto("/index.html?test=character-production-v1");
  await page.evaluate(() => localStorage.setItem("footballLabSelectedKickerV13", "dax-ryder"));
  await page.reload();
  await waitForProductionContract(page);

  await enterClassic(page);

  await expect.poll(
    () => page.evaluate(() => window.__footballLabCharacterEngineV1.snapshot.activeCharacter),
    { timeout: 5000 }
  ).toBe("viktor-kane");
  await expect.poll(
    () => page.evaluate(() => window.__footballLabHeroFrameV46?.renderer),
    { timeout: 12000 }
  ).toBe("v44-fallback");

  const live = await page.evaluate(() => ({
    frame: window.__footballLabHeroFrameV46,
    visible: window.__footballLabVisibleKickersV30
  }));

  expect(live.frame.character).toBe("dax-ryder");
  expect(live.frame.build).toBe("46.0.0");
  expect(live.frame.production3D).toBe(false);
  expect(live.visible.production3D).toBe(false);
  expect(live.visible.productionCharacterMode).toBe("articulated-2.5d-fallback");
  expect(live.visible.staticSpriteFrames).toBe(false);
});
