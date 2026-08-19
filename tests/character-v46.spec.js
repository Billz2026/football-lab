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

test("V46 keeps the production keeper GLB but renders Viktor through the shared arcade fallback", async ({ page }) => {
  const glbRequests = [];
  const threeRequests = [];
  page.on("request", (request) => {
    if (request.url().endsWith(".glb")) glbRequests.push({ url: request.url(), method: request.method() });
    if (request.url().startsWith("https://esm.sh/three@")) threeRequests.push(request.url());
  });
  await page.goto("/index.html?test=character-v46");

  await expect.poll(
    () => page.evaluate(() => window.__footballLabCharacter3DV46?.build),
    { timeout: 15000 }
  ).toBe("46.0.0");

  await page.waitForFunction(() => window.__footballLabReleaseV511?.build === "51.1.0");

  const contract = await page.evaluate(() => ({
    v46: window.__footballLabCharacter3DV46,
    production: window.__footballLabCharacterProductionV1
  }));
  expect(contract.v46.target).toBe("real-skinned-glb-human");
  expect(contract.v46.renderer).toBe("three-webgl-offscreen-composite");
  expect(contract.v46.localAssetsOnly).toBe(true);
  expect(contract.v46.fallback).toBe("v44-articulated-2.5d");
  expect(contract.v46.gameplayPhysicsChanged).toBe(false);
  expect(contract.v46.keeperAIChanged).toBe(false);
  expect(contract.v46.loaded).toEqual([]);
  expect(contract.v46.failed.some((entry) => entry.id === "mikkel-storm")).toBe(false);
  expect(contract.production.liveArcadeFallback).toContain("viktor-kane");
  expect(glbRequests).toEqual([]);
  expect(threeRequests).toEqual([]);

  await enterClassic(page);

  await expect.poll(
    () => page.evaluate(() => window.__footballLabHeroFrameV46?.renderer),
    { timeout: 12000 }
  ).toBe("v44-fallback");

  const live = await page.evaluate(() => ({
    v46: window.__footballLabHeroFrameV46,
    visible: window.__footballLabVisibleKickersV30
  }));
  expect(live.v46.character).toBe("dax-ryder");
  expect(live.v46.production3D).toBe(false);
  expect(live.visible.character).toBe("dax-ryder");
  expect(live.visible.production3D).toBe(false);
  expect(live.visible.productionCharacterMode).toBe("articulated-2.5d-fallback");
  expect(live.visible.staticSpriteFrames).toBe(false);
  expect(glbRequests.some((request) => request.url.includes("viktor-kane"))).toBe(false);

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
  expect(glbRequests).toHaveLength(1);
  expect(glbRequests[0].url).toContain("mikkel-storm.glb");
  expect(glbRequests[0].method).toBe("GET");
  expect(threeRequests.length).toBeGreaterThan(0);
});
