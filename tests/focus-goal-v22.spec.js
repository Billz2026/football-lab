import { test, expect } from "@playwright/test";

async function startClassic(page) {
  await page.goto("/index.html");

  await expect.poll(
    () => page.evaluate(() => Boolean(window.__footballLabMainV18)),
    { timeout: 7000 }
  ).toBe(true);

  await page.locator("#playClassic").click();
  await expect(page.locator("#kickerSelectV13")).toHaveClass(/is-open/);
  await page.locator("#kickerConfirmV13").click();
  await expect(page.locator("#gameScreen")).toHaveClass(/is-active/);
  await expect(page.locator("#shotAction")).toHaveText("START SHOT", { timeout: 1800 });
}

test("V22 removes the keeper oval and exposes the brighter clarity layer", async ({ page }) => {
  await startClassic(page);

  await expect.poll(
    () => page.evaluate(() => window.__footballLabClarityV22 || null),
    { timeout: 7000 }
  ).toMatchObject({
    separateOverlayCanvas: true,
    replacesV21Overlay: true,
    goalkeeperOvalRemoved: true,
    goalkeeperGroundShadow: true,
    ballContrastOutline: true,
    windChipRestyled: true
  });

  await expect(page.locator("#clarityOverlayV22")).toHaveCount(1);
  await expect(page.locator("#clarityOverlayV21")).toHaveCount(0);

  await page.locator("#shotAction").click();
  await page.locator("#shotAction").click();
  await expect(page.locator("#phaseTitle")).toHaveText("PICK YOUR SIDE");

  await expect.poll(
    () => page.evaluate(() => window.__footballLabClarityFrameV22 || null),
    { timeout: 5000 }
  ).toMatchObject({
    active: true,
    keeperOvalVisible: false,
    targetVisible: true
  });

  const targetRadius = await page.evaluate(() => window.__footballLabClarityFrameV22.targetRadius);
  expect(targetRadius).toBeGreaterThanOrEqual(15);
});

test("V22 rotates curated stadium themes and renders a deforming goal net", async ({ page }) => {
  await startClassic(page);

  await expect.poll(
    () => page.evaluate(() => window.__footballLabVisualV22 || null),
    { timeout: 7000 }
  ).toMatchObject({
    advertisementCentreQuieting: true,
    advertisementTextOpacity: 0.105,
    crowdDensity: 72,
    themeSelection: "per-run",
    goalAreaLighting: true,
    netRipple: true,
    impactPointDeformation: true
  });

  const themes = await page.evaluate(() => window.__footballLabVisualV22.curatedThemes);
  expect(themes).toHaveLength(4);

  await expect.poll(
    () => page.evaluate(() => window.__footballLabVisualFrameV22?.theme || null),
    { timeout: 5000 }
  ).toBeTruthy();

  await page.evaluate(() => window.__footballLabV22ForceGoalRipple(900));
  await expect.poll(
    () => page.evaluate(() => Boolean(window.__footballLabVisualFrameV22?.netRippleActive)),
    { timeout: 2000 }
  ).toBe(true);
});
