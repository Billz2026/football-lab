import { test, expect } from "@playwright/test";
import { loadGameplay } from "./helpers/load-gameplay.js";

async function startClassic(page) {
  await page.goto("/index.html");
  await loadGameplay(page);

  await expect.poll(
    () => page.evaluate(() => Boolean(window.__footballLabMainV18)),
    { timeout: 5000 }
  ).toBe(true);

  await page.locator("#classicCard").click();
  await expect(page.locator("#kickerSelectV13")).toHaveClass(/is-open/);
  await page.locator("#kickerConfirmV13").click();
  await expect(page.locator("#gameScreen")).toHaveClass(/is-active/);
  await expect(page.locator("#shotAction")).toHaveText("START SHOT", { timeout: 4000 });
}

test("V18 button input advances exactly one phase per physical click", async ({ page }) => {
  await startClassic(page);

  await page.locator("#shotAction").click();
  await expect(page.locator("#phaseTitle")).toHaveText("PLAN THE STRIKE");

  await page.waitForTimeout(220);
  await expect(page.locator("#phaseTitle")).toHaveText("PLAN THE STRIKE");

  await page.locator("#strikeStartV324").click();
  await expect(page.locator("#phaseTitle")).toHaveText("STOP POWER");
  await page.waitForTimeout(90);
  await page.locator("#shotAction").click();
  await expect(page.locator("#phaseTitle")).toHaveText("STOP CONTACT");

  const sample = await page.evaluate(() => window.__footballLabLastInputSample);
  expect(sample.phase).toBe("power");
  expect(Math.abs(sample.correctionMs)).toBeLessThanOrEqual(50);
  expect(sample.meterValue).toBeGreaterThanOrEqual(0);
  expect(sample.meterValue).toBeLessThanOrEqual(1);
});

test("V18 exposes precision guidance and its timing contract", async ({ page }) => {
  await startClassic(page);

  await expect.poll(
    () => page.evaluate(() => window.__footballLabInputPrecisionV18 || null),
    { timeout: 5000 }
  ).toEqual({
    eventTimeSampling: true,
    signedFrameCorrection: true,
    actionLockMs: 70,
    pointerDownActivation: true,
    clickDeduplicationMs: 450,
    powerPerfectWindow: 0.07
  });

  await page.locator("#shotAction").click();
  await expect(page.locator(".meter")).toHaveAttribute("data-precision-phase", "aim");
  await expect(page.locator("#strikeConsoleV324")).toBeVisible();
  await expect(page.locator("#strikeCurveV324")).toBeVisible();
  await expect(page.locator(".precision-hint-v18")).toContainText("NO SOLVED ROUTE");

  await page.locator("#strikeStartV324").click();
  await expect(page.locator(".meter")).toHaveAttribute("data-precision-phase", "power");
  await expect(page.locator(".precision-hint-v18")).toContainText("PERFECT CONTACT ZONE");
  await expect(page.locator(".precision-zone-v18")).toHaveCSS("width", /[1-9][0-9.]*px/);

  await page.waitForTimeout(100);
  await page.locator("#shotAction").click();
  await expect(page.locator(".meter")).toHaveAttribute("data-precision-phase", "contact");
  await expect(page.locator(".precision-hint-v18")).toContainText("MEET THE CENTRE ZONE");
  await expect(page.locator("#contactZoneV324")).toBeVisible();
});
