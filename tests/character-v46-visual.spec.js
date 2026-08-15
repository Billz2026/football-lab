import { test, expect } from "@playwright/test";

async function enterClassic(page) {
  await page.goto("/index.html?capture=viktor-v46", { waitUntil: "networkidle" });
  await page.locator("#classicCard").click();

  await expect.poll(
    () => page.evaluate(() => ({
      game: document.querySelector("#gameScreen")?.classList.contains("is-active"),
      picker: document.querySelector("#kickerSelectV13")?.classList.contains("is-open")
    })),
    { timeout: 8000 }
  ).toMatchObject({ picker: expect.any(Boolean) });

  const state = await page.evaluate(() => ({
    game: document.querySelector("#gameScreen")?.classList.contains("is-active"),
    picker: document.querySelector("#kickerSelectV13")?.classList.contains("is-open")
  }));

  if (!state.game && state.picker) {
    await page.locator("#kickerConfirmV13").click();
  }
  await expect(page.locator("#gameScreen")).toHaveClass(/is-active/);
}

test("capture Viktor Kane V46 in the authoritative gameplay camera", async ({ page }) => {
  await enterClassic(page);

  await expect.poll(
    () => page.evaluate(() => window.__footballLabHeroFrameV46?.renderer),
    { timeout: 20000 }
  ).toBe("three-webgl-skinned-glb");

  await expect.poll(
    () => page.evaluate(() => window.__footballLabCharacter3DV46?.loaded?.includes("viktor-kane")),
    { timeout: 10000 }
  ).toBe(true);

  const diagnostics = await page.evaluate(() => ({
    renderer: window.__footballLabHeroFrameV46,
    contract: window.__footballLabCharacter3DV46,
    visible: window.__footballLabVisibleKickersV30
  }));
  console.log("VIKTOR_V46_CAPTURE_DIAGNOSTICS", JSON.stringify(diagnostics));

  await page.locator("#gameCanvas").screenshot({
    path: "test-results/viktor-v46-gameplay-ready.png"
  });

  await page.screenshot({
    path: "test-results/viktor-v46-full-ui-ready.png",
    fullPage: true
  });
});
