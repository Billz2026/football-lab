import { test, expect } from "@playwright/test";

async function waitForCampaign(page) {
  await page.goto("/index.html?test=campaign-v31");
  await expect.poll(
    () => page.evaluate(() => window.__footballLabCampaignV31?.handcraftedStages),
    { timeout: 10000 }
  ).toBe(30);
}

test("V31 exposes six premium chapters and thirty handcrafted stages", async ({ page }) => {
  await waitForCampaign(page);
  await expect(page.locator("#campaignMapV31")).toBeVisible();
  await expect(page.locator(".campaign-chapters-v31 article")).toHaveCount(6);
  await expect(page.locator("#campaignMapTitleV31")).toHaveText("SIX VENUES. THIRTY STAGES.");

  const contract = await page.evaluate(() => window.__footballLabCampaignV31);
  expect(contract.chapters).toBe(6);
  expect(contract.handcraftedStages).toBe(30);
  expect(contract.endlessMastery).toBe(true);
  expect(contract.environments).toEqual(["academy", "city", "night", "storm", "world", "summit"]);
});

test("V31 starts with full stage, venue and condition context", async ({ page }) => {
  await waitForCampaign(page);
  await page.locator("#playClassic").click();
  await page.locator("#kickerConfirmV13").click();
  await expect(page.locator("#gameScreen")).toHaveClass(/is-active/);
  await expect(page.locator("#stageNumber")).toContainText("CH 1 · STAGE 01");
  await expect(page.locator("#stageName")).toHaveText("THE FIRST STRIKE");
  await expect(page.locator("#stageContextV31")).toContainText("FIRST TOUCH");
  await expect(page.locator("#stageContextV31")).toContainText("FOUNDATION GROUND");
  await expect(page.locator("#stageContextV31")).toContainText("CLEAR MORNING");
  await expect(page.locator("html")).toHaveAttribute("data-football-lab-environment", "academy");

  await expect.poll(
    () => page.evaluate(() => window.__footballLabEnvironmentV31?.venue),
    { timeout: 3000 }
  ).toBe("FOUNDATION GROUND");
  const environment = await page.evaluate(() => window.__footballLabEnvironmentV31);
  expect(environment.venue).toBe("FOUNDATION GROUND");
  expect(environment.weather).toBe("clear");
});
