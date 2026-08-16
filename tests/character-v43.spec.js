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

async function chooseKicker(page, characterId) {
  await page.goto("/index.html?test=character-v44");
  await page.evaluate((id) => localStorage.setItem("footballLabSelectedKickerV13", id), characterId);
  await page.reload();
  await enterClassic(page);
}

test("live outfield rendering keeps the five-frame sprite path retired after Viktor V46 promotion", async ({ page }) => {
  await chooseKicker(page, "dax-ryder");

  await expect.poll(
    () => page.evaluate(() => window.__footballLabHeroFrameV46?.renderer),
    { timeout: 12000 }
  ).toBe("real-skinned-glb-3d");

  const state = await page.evaluate(() => ({
    frame: window.__footballLabHeroFrameV46,
    production3D: window.__footballLabVisibleKickersV30?.production3D,
    productionCharacterMode: window.__footballLabVisibleKickersV30?.productionCharacterMode,
    spriteAtlasReady: window.__footballLabVisibleKickersV30?.spriteAtlasReady,
    staticSpriteFrames: window.__footballLabVisibleKickersV30?.staticSpriteFrames
  }));

  expect(state.frame.character).toBe("viktor-kane");
  expect(state.frame.production3D).toBe(true);
  expect(state.production3D).toBe(true);
  expect(state.productionCharacterMode).toBe("real-skinned-glb-3d");
  expect(state.spriteAtlasReady).toBe(false);
  expect(state.staticSpriteFrames).toBe(false);
});

test("Mikkel uses V46 3D while keepers without approved GLBs remain on V44", async ({ page }) => {
  await chooseKicker(page, "dax-ryder");

  await expect.poll(
    () => page.evaluate(() => window.__footballLabKeeperRendererV44?.build),
    { timeout: 6000 }
  ).toBe("44.0.0");
  await expect.poll(
    () => page.evaluate(() => window.__footballLabCharacter3DV46?.loaded?.includes("mikkel-storm")),
    { timeout: 12000 }
  ).toBe(true);

  // Stage 0 uses the academy/SIMON HENSHAW visual profile. With no Simon GLB,
  // the continuous articulated V44 scene-depth keeper must remain intact.
  await page.evaluate(async () => {
    const core = await import("/game/core-v6.js?v=32.4");
    const world = await import("/game/world-v6.js?v=32.4");
    core.state.stage = 0;
    core.state.currentStage = world.scenarioForStage(0);
    window.__footballLabPremiumKeeperSceneDrawV3852?.(performance.now());
  });

  await expect.poll(
    () => page.evaluate(() => window.__footballLabKeeperFrameV44?.renderer),
    { timeout: 5000 }
  ).toBe("articulated-layered-2.5d");
  const fallbackKeeper = await page.evaluate(() => window.__footballLabKeeperFrameV44);
  expect(fallbackKeeper.character).toBe("simon-henshaw");
  expect(fallbackKeeper.staticSpriteFrames).toBe(false);
  expect(fallbackKeeper.sceneDepth).toBe(true);

  // Stage 4 maps to the giant keeper and therefore the approved Mikkel master.
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

  const mikkel = await page.evaluate(() => window.__footballLabKeeperFrameV46);
  expect(mikkel.character).toBe("mikkel-storm");
  expect(mikkel.build).toBe("46.0.0");
  expect(mikkel.production3D).toBe(true);
  expect(mikkel.sceneDepth).toBe(true);
});
