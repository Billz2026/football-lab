import { test, expect } from "@playwright/test";

async function startClassic(page) {
  await page.goto("/index.html");

  await expect.poll(
    () => page.evaluate(() => Boolean(window.__footballLabMainV18)),
    { timeout: 5000 }
  ).toBe(true);

  await page.locator("#playClassic").click();
  await expect(page.locator("#kickerSelectV13")).toHaveClass(/is-open/);
  await page.locator("#kickerConfirmV13").click();
  await expect(page.locator("#gameScreen")).toHaveClass(/is-active/);
  await expect(page.locator("#shotAction")).toHaveText("START SHOT", { timeout: 1600 });
}

test("V18 button input advances exactly one phase per physical click", async ({ page }) => {
  await startClassic(page);

  await page.locator("#shotAction").click();
  await expect(page.locator("#phaseTitle")).toHaveText("SET POWER");

  await page.waitForTimeout(220);
  await expect(page.locator("#phaseTitle")).toHaveText("SET POWER");

  await page.locator("#shotAction").click();
  await expect(page.locator("#phaseTitle")).toHaveText("PICK YOUR SIDE");

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
  await expect(page.locator(".meter")).toHaveAttribute("data-precision-phase", "power");
  await expect(page.locator(".precision-hint-v18")).toContainText("PERFECT CONTACT ZONE");
  await expect(page.locator(".precision-zone-v18")).toHaveCSS("width", /[1-9][0-9.]*px/);

  await page.locator("#shotAction").click();
  await expect(page.locator(".meter")).toHaveAttribute("data-precision-phase", "aim");
  await expect(page.locator(".precision-hint-v18")).toContainText("GOAL THIRDS");
});
