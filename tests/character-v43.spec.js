import { test, expect } from "@playwright/test";

async function waitForV43Atlas(page) {
  await expect.poll(
    () => page.evaluate(() => window.__footballLabCharacterSpritesV43?.status),
    { timeout: 15000 }
  ).toBe("ready");
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

  const state = await page.evaluate(() => ({
    gameActive: document.querySelector("#gameScreen")?.classList.contains("is-active"),
    pickerOpen: document.querySelector("#kickerSelectV13")?.classList.contains("is-open")
  }));
  if (!state.gameActive && state.pickerOpen) await page.locator("#kickerConfirmV13").click();
  await expect(page.locator("#gameScreen")).toHaveClass(/is-active/);
}

test("V43.2 high-resolution sprite atlas loads with the approved master frames", async ({ page }) => {
  await page.goto("/index.html?test=character-v43");
  await waitForV43Atlas(page);
  const atlas = await page.evaluate(() => window.__footballLabCharacterSpritesV43);
  expect(atlas.build).toBe("43.2.0");
  expect(atlas.atlasWidth).toBe(1024);
  expect(atlas.atlasHeight).toBe(448);
  expect(atlas.base64Length).toBe(100124);
  expect(atlas.partCount).toBe(10);
  expect(atlas.fidelity).toBe("approved-reference-high-resolution");
  expect(atlas.frames).toEqual([
    "viktor-idle-back",
    "viktor-windup-side",
    "mikkel-set",
    "viktor-contact",
    "mikkel-dive"
  ]);
});

test("Viktor Kane renders through the V43.2 high-resolution 2.5D path", async ({ page }) => {
  await page.goto("/index.html?test=character-v43-viktor");
  await page.evaluate(() => localStorage.setItem("footballLabSelectedKickerV13", "dax-ryder"));
  await page.reload();
  await waitForV43Atlas(page);

  await enterClassic(page);

  await expect.poll(
    () => page.evaluate(() => window.__footballLabHeroFrameV43?.renderer),
    { timeout: 5000 }
  ).toBe("premium-sprite-2.5d");
  await expect.poll(
    () => page.evaluate(() => window.__footballLabHeroFrameV43?.character),
    { timeout: 5000 }
  ).toBe("viktor-kane");
  await expect.poll(
    () => page.evaluate(() => window.__footballLabHeroFrameV43?.build),
    { timeout: 5000 }
  ).toBe("43.2.0");

  await page.screenshot({ path: "test-results/v43-viktor-kane.png", fullPage: true });
});

test("Mikkel Storm replaces the giant keeper through the V43.2 scene-depth path", async ({ page }) => {
  await page.goto("/index.html?test=character-v43-mikkel");
  await page.evaluate(() => localStorage.setItem("footballLabSelectedKickerV13", "dax-ryder"));
  await page.reload();
  await waitForV43Atlas(page);

  await enterClassic(page);
  await expect.poll(
    () => page.evaluate(() => window.__footballLabKeeperRendererV43?.build),
    { timeout: 5000 }
  ).toBe("43.2.0");

  await page.evaluate(async () => {
    const core = await import("/game/core-v6.js?v=32.4");
    const world = await import("/game/world-v6.js?v=32.4");
    core.state.stage = 4;
    core.state.currentStage = world.scenarioForStage(4);
    window.__footballLabPremiumKeeperSceneDrawV3852?.(performance.now());
  });

  await expect.poll(
    () => page.evaluate(() => window.__footballLabKeeperFrameV43?.renderer),
    { timeout: 5000 }
  ).toBe("premium-sprite-2.5d");
  await expect.poll(
    () => page.evaluate(() => window.__footballLabKeeperFrameV43?.character),
    { timeout: 5000 }
  ).toBe("mikkel-storm");
  await expect.poll(
    () => page.evaluate(() => window.__footballLabKeeperFrameV43?.sourceKeeperId),
    { timeout: 5000 }
  ).toBe("giant");

  await page.screenshot({ path: "test-results/v43-mikkel-storm.png", fullPage: true });
});

test("non-master outfield players stay safely on the V42 fallback", async ({ page }) => {
  await page.goto("/index.html?test=character-v43-fallback");
  await page.evaluate(() => localStorage.setItem("footballLabSelectedKickerV13", "leo-vale"));
  await page.reload();
  await waitForV43Atlas(page);

  await enterClassic(page);
  await expect.poll(
    () => page.evaluate(() => window.__footballLabHeroFrameV43?.renderer),
    { timeout: 5000 }
  ).toBe("v42-fallback");
});
