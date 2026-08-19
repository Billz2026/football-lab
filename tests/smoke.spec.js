import { test, expect } from "@playwright/test";

function collectRuntimeErrors(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

test("public Classic Kicks boots and starts an unlimited run", async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto("/index.html");
  await expect(page.locator("#kickerSelectV13")).toHaveCount(1, { timeout: 15000 });
  await page.locator("#playClassic").click();
  await expect(page.locator("#kickerSelectV13")).toHaveClass(/is-open/);
  await page.locator(".kicker-card").first().click();
  await page.locator("#kickerConfirmV13").click();
  await expect(page.locator("#gameScreen")).toHaveClass(/is-active/);
  await expect(page.locator("#livesValue")).toHaveText(/0|[1-9][0-9,]*/);
  await expect(page.locator("#finishRunV25")).toHaveText("FINISH & SUBMIT RUN");
  await expect(page.locator("body")).not.toContainText("Five lives available");
  await expect(page.getByText("failed to load", { exact: false })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("main menu permanently starts with the mode tile mosaic", async ({ page }) => {
  await page.goto("/index.html");

  await expect(page.locator(".hub-hero")).toHaveCount(0);
  await expect(page.getByText("MASTER EVERY MOMENT.", { exact: true })).toHaveCount(0);
  await expect(page.locator("#modeHub")).toBeVisible();
  await expect(page.locator(".hub-mode-grid > .hub-mode-tile")).toHaveCount(6);
  await expect(page.locator("#trainingCardV35")).toBeVisible();
  await expect(page.locator("#classicCard")).toBeVisible();
});

test("a complete shot can be played before the run is voluntarily submitted", async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto("/index.html");
  await expect(page.locator("#kickerSelectV13")).toHaveCount(1, { timeout: 15000 });
  await page.locator("#playClassic").click();
  await page.locator(".kicker-card").first().click();
  await page.locator("#kickerConfirmV13").click();
  await expect(page.locator("#shotAction")).toHaveText("START SHOT", { timeout: 3000 });

  await page.locator("#shotAction").click();
  await expect(page.locator("#phaseTitle")).toHaveText("PLAN THE STRIKE");
  await page.locator("#strikeStartV324").click();
  await expect(page.locator("#phaseTitle")).toHaveText("STOP POWER");
  await page.waitForTimeout(90);
  await page.locator("#shotAction").click();
  await expect(page.locator("#phaseTitle")).toHaveText("STOP CONTACT");
  await page.waitForTimeout(90);
  await page.locator("#shotAction").click();
  await expect(page.locator("#phaseTitle")).toHaveText("WATCH THE FLIGHT");
  await expect(page.locator("#shotAction")).toHaveText(/START SHOT|START NEXT STAGE/, { timeout: 7000 });

  await page.locator("#finishRunV25").click();
  await expect(page.locator("#finishRunModalV25")).toHaveClass(/is-open/);
  await page.locator("#confirmFinishV25").click();
  await expect(page.locator("#gameOverModal")).toHaveClass(/is-open/);
  await expect(page.locator("#gameOverTitle")).toHaveText(/FULL TIME|NEW PERSONAL BEST/);
  expect(errors).toEqual([]);
});

test("standalone Matchup Lab boots and applies a late scenario", async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto("/lab.html");
  await expect(page.locator("body")).toHaveAttribute("data-lab-ready", "true", { timeout: 10000 });
  await expect(page.locator("#gameCanvas")).toBeVisible();
  await expect(page.locator(".lab-startup-error")).toHaveCount(0);

  await page.locator("#labStage").selectOption("14");
  await page.locator("#labKeeper").selectOption("giant");
  await page.locator("#labWall").selectOption("staggered");
  await page.locator("#labTier").selectOption("3");
  await page.locator("#labApply").click();

  await expect(page.locator("#stageNumber")).toContainText("STAGE 15");
  await page.locator("#shotAction").click();
  await expect(page.locator("#phaseTitle")).toHaveText("SET POWER");
  expect(errors).toEqual([]);
});
