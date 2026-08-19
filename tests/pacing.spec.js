import { test, expect } from "@playwright/test";

test("fast-flow build loads and clears the opening stage reveal quickly", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("footballLabTutorialV22", "complete"));
  await page.goto("/index.html");

  await expect.poll(
    () => page.evaluate(() => Boolean(window.__footballLabMainV174)),
    { timeout: 5000 }
  ).toBe(true);

  await page.locator("#classicCard").click();
  await expect(page.locator("#kickerSelectV13")).toHaveClass(/is-open/);
  await page.locator(".kicker-card").first().click();
  await page.locator("#kickerConfirmV13").click();

  await expect(page.locator("#gameScreen")).toHaveClass(/is-active/);
  await expect(page.locator("#shotAction")).toHaveText("START SHOT", { timeout: 1600 });
});

test("fast-flow timing contract is exposed for regression checks", async ({ page }) => {
  await page.goto("/index.html");

  await expect.poll(
    () => page.evaluate(() => window.__footballLabFastFlowV174 || null),
    { timeout: 5000 }
  ).toEqual({
    stageIntroMs: 700,
    breakdownMs: 650,
    replayMs: 751,
    replayPolicy: "top-corner-or-frame"
  });
});
