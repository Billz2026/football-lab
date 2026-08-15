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

test("V46 only replaces V44 when an approved local GLB passes the full asset gate", async ({ page }) => {
  await page.goto("/index.html?test=character-v46");

  await expect.poll(
    () => page.evaluate(() => window.__footballLabCharacter3DV46?.build),
    { timeout: 15000 }
  ).toBe("46.0.0");

  await expect.poll(
    () => page.evaluate(() => {
      const contract = window.__footballLabCharacter3DV46;
      return Boolean(contract && (
        contract.loaded?.includes("viktor-kane") ||
        contract.failed?.some((entry) => entry.id === "viktor-kane")
      ) && contract.failed?.some((entry) => entry.id === "mikkel-storm"));
    }),
    { timeout: 15000 }
  ).toBe(true);

  const contract = await page.evaluate(() => window.__footballLabCharacter3DV46);
  expect(contract.target).toBe("real-skinned-glb-human");
  expect(contract.renderer).toBe("three-webgl-offscreen-composite");
  expect(contract.localAssetsOnly).toBe(true);
  expect(contract.fallback).toBe("v44-articulated-2.5d");
  expect(contract.gameplayPhysicsChanged).toBe(false);
  expect(contract.keeperAIChanged).toBe(false);

  const mikkelFailure = contract.failed.find((entry) => entry.id === "mikkel-storm");
  expect(mikkelFailure?.reason).toBe("missing-local-glb");

  const viktorLoaded = contract.loaded.includes("viktor-kane");
  if (!viktorLoaded) {
    const viktorFailure = contract.failed.find((entry) => entry.id === "viktor-kane");
    expect(viktorFailure).toBeTruthy();
  }

  await enterClassic(page);

  await expect.poll(
    () => page.evaluate(() => window.__footballLabHeroFrameV46?.renderer),
    { timeout: 12000 }
  ).toBe(viktorLoaded ? "real-skinned-glb-3d" : "v44-fallback");

  const live = await page.evaluate(() => ({
    v46: window.__footballLabHeroFrameV46,
    v44: window.__footballLabHeroFrameV44,
    visible: window.__footballLabVisibleKickersV30
  }));

  expect(live.v46.production3D).toBe(viktorLoaded);
  if (viktorLoaded) {
    expect(live.visible.production3D).toBe(true);
    expect(live.visible.productionCharacterMode).toBe("real-skinned-glb-3d");
  } else {
    expect(live.v44.renderer).toBe("articulated-layered-2.5d");
    expect(live.visible.production3D).toBe(false);
    expect(live.visible.productionCharacterMode).toBe("articulated-2.5d-fallback");
  }
  expect(live.visible.staticSpriteFrames).toBe(false);
});
