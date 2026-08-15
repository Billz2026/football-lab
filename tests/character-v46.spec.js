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

test("V46 keeps the proven V44 renderer authoritative until approved local GLBs exist", async ({ page }) => {
  await page.goto("/index.html?test=character-v46");

  await expect.poll(
    () => page.evaluate(() => window.__footballLabCharacter3DV46?.build),
    { timeout: 15000 }
  ).toBe("46.0.0");

  await expect.poll(
    () => page.evaluate(() => window.__footballLabCharacter3DV46?.failed?.length || 0),
    { timeout: 8000 }
  ).toBeGreaterThanOrEqual(2);

  const contract = await page.evaluate(() => window.__footballLabCharacter3DV46);
  expect(contract.target).toBe("real-skinned-glb-human");
  expect(contract.renderer).toBe("three-webgl-offscreen-composite");
  expect(contract.localAssetsOnly).toBe(true);
  expect(contract.fallback).toBe("v44-articulated-2.5d");
  expect(contract.gameplayPhysicsChanged).toBe(false);
  expect(contract.keeperAIChanged).toBe(false);
  expect(contract.loaded).toEqual([]);
  expect(contract.failed.map((entry) => entry.id).sort()).toEqual(["mikkel-storm", "viktor-kane"]);
  expect(contract.failed.every((entry) => entry.reason === "missing-local-glb")).toBe(true);

  await enterClassic(page);

  await expect.poll(
    () => page.evaluate(() => window.__footballLabHeroFrameV46?.renderer),
    { timeout: 5000 }
  ).toBe("v44-fallback");

  const live = await page.evaluate(() => ({
    v46: window.__footballLabHeroFrameV46,
    v44: window.__footballLabHeroFrameV44,
    visible: window.__footballLabVisibleKickersV30
  }));
  expect(live.v46.production3D).toBe(false);
  expect(live.v44.renderer).toBe("articulated-layered-2.5d");
  expect(live.visible.production3D).toBe(false);
  expect(live.visible.productionCharacterMode).toBe("articulated-2.5d-fallback");
  expect(live.visible.staticSpriteFrames).toBe(false);
});
