import { test, expect } from "@playwright/test";

async function enterClassic(page) {
  await page.goto("/index.html?capture=arcade-v51", { waitUntil: "networkidle" });
  await page.locator("#classicCard").click();
  await expect.poll(
    () => page.evaluate(() => (
      document.querySelector("#gameScreen")?.classList.contains("is-active") ||
      document.querySelector("#kickerSelectV13")?.classList.contains("is-open")
    )), { timeout: 8000 }
  ).toBe(true);

  const pickerOpen = await page.locator("#kickerSelectV13").evaluate(
    (el) => el.classList.contains("is-open")
  ).catch(() => false);
  if (pickerOpen) await page.locator("#kickerConfirmV13").click();
  await expect(page.locator("#gameScreen")).toHaveClass(/is-active/);

  const skip = page.getByRole("button", { name: "SKIP TUTORIAL" });
  if (await skip.isVisible().catch(() => false)) await skip.click({ force: true });
}

async function phaseSnapshot(page) {
  return page.evaluate(async () => {
    const core = await import("/game/core-v6.js?v=32.4");
    return {
      phase: core.state.phase,
      label: document.querySelector("#shotAction")?.textContent?.trim() || "",
      hero: window.__footballLabHeroFrameV51 || null,
      visible: window.__footballLabVisibleKickersV30 || null,
      keeper: window.__footballLabKeeperFrameV44 || null,
      system: window.__footballLabArcadeCharacterSystemV51 || null,
      profiles: window.__footballLabCharacterSystemV42 || null,
      geometry: window.__footballLabCharacterRendererV42 || null
    };
  });
}

async function executeShot(page) {
  await expect(page.locator("#shotAction")).toHaveText("START SHOT", { timeout: 6000 });
  const expected = [
    ["aim", "STRIKE"],
    ["power", "LOCK POWER"],
    ["contact", "LOCK CONTACT"],
    ["shooting", "SHOT IN PLAY"]
  ];
  const delays = [120, 180, 180, 0];

  for (let index = 0; index < expected.length; index += 1) {
    await page.keyboard.press("Enter");
    const [phase, label] = expected[index];
    await expect.poll(() => phaseSnapshot(page), { timeout: 2500 }).toMatchObject({ phase, label });
    if (delays[index]) await page.waitForTimeout(delays[index]);
  }
}

test("V51 uses polished lightweight arcade characters for player and goalkeeper", async ({ page }) => {
  test.setTimeout(45000);
  await enterClassic(page);

  await expect.poll(
    () => page.evaluate(() => window.__footballLabHeroFrameV51?.renderer),
    { timeout: 10000 }
  ).toBe("polished-modern-arcade-articulated-2.5d");

  await expect.poll(
    () => page.evaluate(() => window.__footballLabKeeperFrameV44?.renderer),
    { timeout: 10000 }
  ).toBe("articulated-layered-2.5d");

  const ready = await phaseSnapshot(page);
  expect(ready.hero?.production3D).toBe(false);
  expect(ready.hero?.geometryPass).toBe("rounded-athletic-v51.1");
  expect(ready.visible?.production3D).toBe(false);
  expect(ready.visible?.productionCharacterMode).toBe("polished-modern-arcade-articulated-2.5d");
  expect(ready.system?.realismRequired).toBe(false);
  expect(ready.system?.glbRequired).toBe(false);
  expect(ready.system?.lockedStyleRules?.simpleFaces).toBe(true);
  expect(ready.system?.lockedStyleRules?.athleticExaggeration).toBe(true);
  expect(ready.system?.lockedStyleRules?.highContrastKits).toBe(true);
  expect(ready.system?.lockedStyleRules?.roundedShirtSilhouette).toBe(true);
  expect(ready.system?.lockedStyleRules?.balancedStrikePose).toBe(true);
  expect(ready.profiles?.build).toBe("51.0.0-arcade-profile");
  expect(ready.profiles?.largerHeadsForReadability).toBe(true);
  expect(ready.profiles?.oversizedKeeperGloves).toBe(true);
  expect(ready.geometry?.roundedAthleticGeometry).toBe(true);
  expect(ready.geometry?.enlargedBootsAndHands).toBe(true);

  // Allow the chapter title card to clear so the evidence frame shows the actual characters.
  await page.waitForTimeout(1300);
  await page.locator("#gameCanvas").screenshot({ path: "test-results/arcade-v51-ready.png" });
  await page.screenshot({ path: "test-results/arcade-v51-full-ui.png", fullPage: true });

  await executeShot(page);
  await page.waitForTimeout(180);
  const strike = await phaseSnapshot(page);
  expect(strike.hero?.renderer).toBe("polished-modern-arcade-articulated-2.5d");
  expect(strike.hero?.phase).not.toBe("idle");
  await page.locator("#gameCanvas").screenshot({ path: "test-results/arcade-v51-strike.png" });
});
