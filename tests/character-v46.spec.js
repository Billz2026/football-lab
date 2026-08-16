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

test("V46 promotes only approved local GLBs while preserving V44 fallback for the incomplete roster", async ({ page }) => {
  await page.goto("/index.html?test=character-v46");

  await expect.poll(
    () => page.evaluate(() => window.__footballLabCharacter3DV46?.build),
    { timeout: 15000 }
  ).toBe("46.0.0");

  await expect.poll(
    () => page.evaluate(() => {
      const contract = window.__footballLabCharacter3DV46;
      return Boolean(
        contract?.loaded?.includes("viktor-kane") &&
        contract?.loaded?.includes("mikkel-storm")
      );
    }),
    { timeout: 20000 }
  ).toBe(true);

  const contract = await page.evaluate(() => window.__footballLabCharacter3DV46);
  expect(contract.target).toBe("real-skinned-glb-human");
  expect(contract.renderer).toBe("three-webgl-offscreen-composite");
  expect(contract.localAssetsOnly).toBe(true);
  expect(contract.fallback).toBe("v44-articulated-2.5d");
  expect(contract.gameplayPhysicsChanged).toBe(false);
  expect(contract.keeperAIChanged).toBe(false);
  expect(contract.loaded).toEqual(expect.arrayContaining(["viktor-kane", "mikkel-storm"]));
  expect(contract.failed.some((entry) => entry.id === "mikkel-storm")).toBe(false);

  await enterClassic(page);

  await expect.poll(
    () => page.evaluate(() => window.__footballLabHeroFrameV46?.renderer),
    { timeout: 12000 }
  ).toBe("real-skinned-glb-3d");

  const live = await page.evaluate(() => ({
    v46: window.__footballLabHeroFrameV46,
    visible: window.__footballLabVisibleKickersV30
  }));
  expect(live.v46.character).toBe("viktor-kane");
  expect(live.v46.production3D).toBe(true);
  expect(live.visible.production3D).toBe(true);
  expect(live.visible.productionCharacterMode).toBe("real-skinned-glb-3d");
  expect(live.visible.staticSpriteFrames).toBe(false);

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

  const keeper = await page.evaluate(() => window.__footballLabKeeperFrameV46);
  expect(keeper.character).toBe("mikkel-storm");
  expect(keeper.build).toBe("46.0.0");
  expect(keeper.production3D).toBe(true);
  expect(keeper.sceneDepth).toBe(true);
});
