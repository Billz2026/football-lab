import { test, expect } from "@playwright/test";

async function startClassic(page) {
  await page.goto("/index.html");

  await expect.poll(
    () => page.evaluate(() => Boolean(window.__footballLabClarityV21)),
    { timeout: 7000 }
  ).toBe(true);

  await page.locator("#playClassic").click();
  await expect(page.locator("#kickerSelectV13")).toHaveClass(/is-open/);
  await page.locator("#kickerConfirmV13").click();
  await expect(page.locator("#gameScreen")).toHaveClass(/is-active/);
  await expect(page.locator("#shotAction")).toHaveText("START SHOT", { timeout: 1600 });
}

test("V21 exposes the gameplay clarity contract and overlay canvas", async ({ page }) => {
  await startClassic(page);

  await expect(page.locator("#clarityOverlayV21")).toHaveCount(1);
  await expect.poll(
    () => page.evaluate(() => window.__footballLabClarityV21 || null),
    { timeout: 5000 }
  ).toEqual({
    separateOverlayCanvas: true,
    targetMinimumRadius: 15,
    targetMaximumRadius: 24,
    targetContrastLayers: 4,
    aimGuideUnderStroke: true,
    goalThirdGuides: true,
    lockConfirmationMs: 480,
    advertisementBoardQuieting: true,
    goalkeeperFocusRim: true,
    ballContrastOutline: true
  });

  await expect.poll(
    () => page.evaluate(() => window.__footballLabClarityFrameV21?.boardMuted),
    { timeout: 3000 }
  ).toBe(true);
  await expect.poll(
    () => page.evaluate(() => window.__footballLabClarityFrameV21?.keeperFocus),
    { timeout: 3000 }
  ).toBe(true);
});

test("V21 aim marker is prominent and confirms the locked target", async ({ page }) => {
  await startClassic(page);

  await page.locator("#shotAction").click();
  await expect(page.locator("#phaseTitle")).toHaveText("SET POWER");
  await page.locator("#shotAction").click();
  await expect(page.locator("#phaseTitle")).toHaveText("PICK YOUR SIDE");

  const aimFrame = await expect.poll(
    () => page.evaluate(() => window.__footballLabClarityFrameV21 || null),
    { timeout: 3000 }
  ).toMatchObject({ targetVisible: true, boardMuted: true });

  const targetRadius = await page.evaluate(() => window.__footballLabClarityFrameV21.targetRadius);
  expect(targetRadius).toBeGreaterThanOrEqual(15);
  expect(targetRadius).toBeLessThanOrEqual(24);

  await page.locator("#shotAction").click();
  await expect(page.locator("#phaseTitle")).toHaveText("ADD CURVE");
  await expect.poll(
    () => page.evaluate(() => window.__footballLabClarityFrameV21?.lockFlash),
    { timeout: 1000 }
  ).toBe(true);
});
