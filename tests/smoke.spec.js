import { test, expect } from "@playwright/test";

function collectRuntimeErrors(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

test("public Classic Kicks boots and starts a five-life run", async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto("/index.html");
  await expect(page.locator("#kickerSelectV13")).toHaveCount(1, { timeout: 15000 });
  await page.locator("#playClassic").click();
  await expect(page.locator("#kickerSelectV13")).toHaveClass(/is-open/);
  await page.locator(".kicker-card").first().click();
  await page.locator("#kickerConfirmV13").click();
  await expect(page.locator("#gameScreen")).toHaveClass(/is-active/);
  await expect(page.locator("#livesValue")).toContainText("● ● ● ● ●");
  await expect(page.getByText("failed to load", { exact: false })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("standalone Matchup Lab boots and applies a late scenario", async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto("/lab.html");
  await page.waitForTimeout(3000);
  const startupError = await page.locator(".lab-startup-error").textContent().catch(() => null);
  if (startupError || errors.length) {
    console.log("LAB STARTUP ERROR:", startupError || "none");
    console.log("LAB PAGE ERRORS:", errors);
  }
  await expect(page.locator("body")).toHaveAttribute("data-lab-ready", "true", { timeout: 17000 });
  await expect(page.locator("#gameCanvas")).toBeVisible();
  await page.locator("#labStage").selectOption("14");
  await page.locator("#labKeeper").selectOption("giant");
  await page.locator("#labWall").selectOption("staggered");
  await page.locator("#labTier").selectOption("3");
  await page.locator("#labApply").click();
  await expect(page.locator("#stageNumber")).toContainText("STAGE 15");
  await page.locator("#shotAction").click();
  await expect(page.locator("#phaseTitle")).toHaveText("SET POWER");
  await expect(page.locator(".lab-startup-error")).toHaveCount(0);
  expect(errors).toEqual([]);
});
