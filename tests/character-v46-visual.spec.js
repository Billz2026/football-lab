import { test, expect } from "@playwright/test";

// Visual approval must come from the authoritative Football Lab camera after
// the V46 runtime bridge is rebuilt; Blender previews are not accepted here.
// This gate now proves both the approved standing model and the live strike deformation.
async function enterClassic(page) {
  await page.goto("/index.html?capture=viktor-v46-strike", { waitUntil: "networkidle" });
  await page.locator("#classicCard").click();

  await expect.poll(
    () => page.evaluate(() => (
      document.querySelector("#gameScreen")?.classList.contains("is-active") ||
      document.querySelector("#kickerSelectV13")?.classList.contains("is-open")
    )),
    { timeout: 8000 }
  ).toBe(true);

  const state = await page.evaluate(() => ({
    game: document.querySelector("#gameScreen")?.classList.contains("is-active"),
    picker: document.querySelector("#kickerSelectV13")?.classList.contains("is-open")
  }));

  if (!state.game && state.picker) {
    await page.locator("#kickerConfirmV13").click();
  }
  await expect(page.locator("#gameScreen")).toHaveClass(/is-active/);
}

async function dismissCoach(page) {
  const skip = page.getByRole("button", { name: "SKIP TUTORIAL" });
  if (await skip.isVisible().catch(() => false)) {
    await skip.click({ force: true });
  }
}

async function waitForClip(page, clip, path) {
  await page.waitForFunction(
    (expected) => window.__footballLabHeroFrameV46?.clip === expected,
    clip,
    { timeout: 8000, polling: "raf" }
  );

  await page.locator("#gameCanvas").screenshot({ path });

  const frame = await page.evaluate(() => window.__footballLabHeroFrameV46);
  expect(frame?.renderer).toBe("real-skinned-glb-3d");
  expect(frame?.production3D).toBe(true);
  expect(frame?.clip).toBe(clip);
}

async function executeLiveShot(page) {
  await dismissCoach(page);
  await expect(page.locator("#shotAction")).toHaveText("START SHOT", { timeout: 6000 });

  // READY -> AIM -> POWER -> CONTACT -> SHOOTING.
  // The short delays deliberately respect the runtime's 70 ms input lock while
  // still exercising the real interactive shot path rather than mutating state.
  await page.locator("#shotAction").click({ force: true });
  await page.waitForTimeout(120);
  await page.locator("#shotAction").click({ force: true });
  await page.waitForTimeout(180);
  await page.locator("#shotAction").click({ force: true });
  await page.waitForTimeout(180);
  await page.locator("#shotAction").click({ force: true });
}

test("capture Viktor Kane V46 standing and striking in the authoritative gameplay camera", async ({ page }) => {
  await enterClassic(page);

  await expect.poll(
    () => page.evaluate(() => window.__footballLabHeroFrameV46?.renderer),
    { timeout: 20000 }
  ).toBe("real-skinned-glb-3d");

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

  expect(diagnostics.renderer?.production3D).toBe(true);
  expect(diagnostics.visible?.production3D).toBe(true);
  expect(diagnostics.visible?.productionCharacterMode).toBe("real-skinned-glb-3d");

  await page.locator("#gameCanvas").screenshot({
    path: "test-results/viktor-v46-gameplay-ready.png"
  });

  await page.screenshot({
    path: "test-results/viktor-v46-full-ui-ready.png",
    fullPage: true
  });

  await executeLiveShot(page);
  await waitForClip(page, "windup", "test-results/viktor-v46-strike-windup.png");
  await waitForClip(page, "contact", "test-results/viktor-v46-strike-contact.png");
  await waitForClip(page, "follow-through", "test-results/viktor-v46-strike-follow-through.png");
});
