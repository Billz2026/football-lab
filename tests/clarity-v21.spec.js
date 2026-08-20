import { test, expect } from "@playwright/test";
import { loadGameplay } from "./helpers/load-gameplay.js";

async function startClassic(page) {
  await page.goto("/index.html");
  await loadGameplay(page);

  await expect.poll(
    () => page.evaluate(() => Boolean(window.__footballLabClarityV21)),
    { timeout: 7000 }
  ).toBe(true);

  await page.locator("#classicCard").click();
  await expect(page.locator("#kickerSelectV13")).toHaveClass(/is-open/);
  await page.locator("#kickerConfirmV13").click();
  await expect(page.locator("#gameScreen")).toHaveClass(/is-active/);
  await expect(page.locator("#shotAction")).toHaveText("START SHOT", { timeout: 4000 });
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
    lockedTargetVisibleDuringCurve: true,
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

test("V21 keeps the live-pitch target clear without revealing the answer", async ({ page }) => {
  await startClassic(page);

  await page.locator("#shotAction").click();
  await expect(page.locator("#phaseTitle")).toHaveText("PLAN THE STRIKE");
  await expect(page.locator("#strikeConsoleV324")).toBeVisible();

  await expect(page.locator("#gameCanvas")).toBeVisible();
  await expect(page.locator("#strikeCurveLabelV324")).toContainText("CLEAN STRIKE");
  await expect(page.locator("[data-aim-route]")).toHaveCount(0);
  await expect.poll(
    () => page.evaluate(() => window.__footballLabStrikeFrameV324?.active),
    { timeout: 1000 }
  ).toBe(true);
  expect(await page.evaluate(() => window.__footballLabStrikeFrameV324?.prediction)).toBeNull();
});
