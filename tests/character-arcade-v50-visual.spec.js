import { test, expect } from "@playwright/test";

async function enterClassic(page) {
  await page.goto("/index.html?capture=arcade-v50", { waitUntil: "networkidle" });
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
      hero: window.__footballLabHeroFrameV50 || null,
      visible: window.__footballLabVisibleKickersV30 || null,
      keeper: window.__footballLabKeeperFrameV44 || null,
      system: window.__footballLabArcadeCharacterSystemV50 || null
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

test("V50 uses lightweight arcade characters for the player and goalkeeper", async ({ page }) => {
  test.setTimeout(45000);
  await enterClassic(page);

  await expect.poll(
    () => page.evaluate(() => window.__footballLabHeroFrameV50?.renderer),
    { timeout: 10000 }
  ).toBe("modern-arcade-articulated-2.5d");

  await expect.poll(
    () => page.evaluate(() => window.__footballLabKeeperFrameV44?.renderer),
    { timeout: 10000 }
  ).toBe("articulated-layered-2.5d");

  const ready = await phaseSnapshot(page);
  expect(ready.hero?.production3D).toBe(false);
  expect(ready.visible?.production3D).toBe(false);
  expect(ready.visible?.productionCharacterMode).toBe("modern-arcade-articulated-2.5d");
  expect(ready.system?.realismRequired).toBe(false);
  expect(ready.system?.glbRequired).toBe(false);

  await page.locator("#gameCanvas").screenshot({ path: "test-results/arcade-v50-ready.png" });
  await page.screenshot({ path: "test-results/arcade-v50-full-ui.png", fullPage: true });

  await executeShot(page);
  await page.waitForTimeout(180);
  const strike = await phaseSnapshot(page);
  expect(strike.hero?.renderer).toBe("modern-arcade-articulated-2.5d");
  expect(strike.hero?.phase).not.toBe("idle");
  await page.locator("#gameCanvas").screenshot({ path: "test-results/arcade-v50-strike.png" });
});
