import { test, expect } from "@playwright/test";

async function startShootout(page) {
  await page.goto("/");
  await page.waitForFunction(() => window.__footballLabPenaltyShootoutV49?.build === "49.0.0");
  await page.waitForFunction(() => window.__footballLabPenaltyExperienceV50?.build === "50.0.0");
  await page.waitForFunction(() => Boolean(window.__footballLabStrikeV324));

  await page.locator(".hub-mode-penalties").click();
  await page.locator("#shootoutDifficultyV49").selectOption("pro");
  await page.locator("#startShootoutV49").click();
  await expect(page.locator("#gameScreen")).toHaveClass(/is-active/);
  await expect.poll(
    () => page.evaluate(() => window.__footballLabPenaltyExperienceV50?.snapshot?.().active),
    { timeout: 8000 }
  ).toBe(true);
}

test("V50 penalties use a dedicated camera and six-zone no-curl interaction", async ({ page }) => {
  await startShootout(page);

  await expect(page.locator("html")).toHaveClass(/penalty-experience-v50/);
  await expect(page.locator("#penaltyControlV50")).toBeVisible();
  await expect(page.locator("#strikeConsoleV324")).toBeHidden();
  await expect(page.locator(".control-heading .section-label")).toHaveText("PENALTY CONTROL");
  await expect(page.locator("#shotAction")).toHaveText("STEP UP");

  const camera = await page.evaluate(() => window.__footballLabPenaltyExperienceV50.snapshot().camera);
  expect(camera).toEqual({
    sideOffset: 0,
    backDistance: 7.5,
    height: 1.9,
    fovY: 36,
    targetHeight: 1.12
  });

  await page.locator("#shotAction").click();
  await expect.poll(
    () => page.evaluate(() => window.__footballLabPenaltyExperienceV50.snapshot().phase),
    { timeout: 5000 }
  ).toBe("aim");

  await expect(page.locator("#phaseTitle")).toHaveText("PICK YOUR FINISH");
  await expect(page.locator("#penaltyGoalZonesV50")).toBeVisible();
  await expect(page.locator("[data-penalty-zone-v50]")).toHaveCount(6);
  await expect(page.locator("#penaltyRunUpV50")).toBeDisabled();

  await page.locator('[data-penalty-zone-v50="high-right"]').click();
  await expect(page.locator('[data-penalty-zone-v50="high-right"]')).toHaveClass(/is-selected/);
  await expect(page.locator("#penaltyPlacementV50")).toHaveText("TOP RIGHT");
  await expect(page.locator("#penaltyRunUpV50")).toBeEnabled();

  const planned = await page.evaluate(async () => {
    const core = await import("/game/core-v6.js?v=32.4");
    return {
      selectedZone: window.__footballLabPenaltyExperienceV50.snapshot().selectedZone,
      aimX: core.state.shot?.previewAimX,
      aimY: core.state.shot?.previewAimY,
      curve: core.state.shot?.previewCurve
    };
  });
  expect(planned.selectedZone).toBe("high-right");
  expect(planned.aimX).toBeCloseTo(0.82, 5);
  expect(planned.aimY).toBeCloseTo(0.18, 5);
  expect(planned.curve).toBe(0);

  await page.locator("#penaltyRunUpV50").click();
  await expect.poll(
    () => page.evaluate(() => window.__footballLabPenaltyExperienceV50.snapshot().phase),
    { timeout: 5000 }
  ).toBe("power");
  await expect(page.locator("#phaseTitle")).toHaveText("RUN-UP");
  await expect(page.locator("#meterLabel")).toHaveText("STRIKE POWER");
  await expect(page.locator("#penaltyGoalZonesV50")).toBeHidden();
});

test("V50 penalty pressure increases as a shootout advances", async ({ page }) => {
  await startShootout(page);

  const initial = await page.evaluate(() => window.__footballLabPenaltyExperienceV50.snapshot().pressure);
  expect(initial).toBe(24);

  await page.evaluate(() => {
    const shootout = window.__footballLabPenaltyShootoutV49;
    const original = shootout.snapshot;
    Object.defineProperty(window, "__footballLabPenaltyShootoutV49", {
      configurable: true,
      value: Object.freeze({
        ...shootout,
        snapshot: () => ({
          ...(original?.() || {}),
          playerResults: [true, false, true, true, false, true],
          opponentResults: [true, true, false, true, false, false],
          difficultyId: "pro"
        })
      })
    });
    window.dispatchEvent(new CustomEvent("footballlab:phasechange", { detail: { phase: "ready" } }));
  });

  await expect.poll(
    () => page.evaluate(() => window.__footballLabPenaltyExperienceV50.snapshot().pressure),
    { timeout: 3000 }
  ).toBe(100);
  await expect(page.locator("html")).toHaveClass(/penalty-pressure-high-v50/);
});
