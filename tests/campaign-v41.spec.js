import { test, expect } from "@playwright/test";

async function waitForCampaign(page) {
  await page.goto("/index.html?test=campaign-v41");
  await expect.poll(
    () => page.evaluate(() => window.__footballLabCampaignProgressionV41?.stages),
    { timeout: 10000 }
  ).toBe(30);
}

test("V41 exposes six premium chapters, thirty stages and six chapter finals", async ({ page }) => {
  await waitForCampaign(page);
  await expect(page.locator("#classicCard")).toBeVisible();
  await expect(page.locator("#classicCard")).toContainText("CLASSIC FREE KICKS");
  await expect(page.locator("#classicCard")).toContainText("FLAGSHIP MODE");

  const contract = await page.evaluate(() => window.__footballLabCampaignProgressionV41);
  expect(contract.build).toBe("41.0.0");
  expect(contract.chapters).toBe(6);
  expect(contract.stages).toBe(30);
  expect(contract.chapterFinals).toEqual([5, 10, 15, 20, 25, 30]);
  expect(contract.levelIdentity).toBe(true);
  expect(contract.venueIdentity).toBe(true);
});

test("V41 starts with full stage, venue and condition context", async ({ page }) => {
  await waitForCampaign(page);
  await page.locator("#classicCard").click();
  await expect(page.locator("#kickerSelectV13")).toHaveClass(/is-open/);
  await page.locator("#kickerConfirmV13").click();
  await expect(page.locator("#gameScreen")).toHaveClass(/is-active/);
  await expect(page.locator("#stageNumber")).toContainText("CH 1 · STAGE 01");
  await expect(page.locator("#stageName")).toHaveText("THE FIRST STRIKE");
  await expect(page.locator("#stageContextV31")).toContainText("FIRST TOUCH");
  await expect(page.locator("#stageContextV31")).toContainText("FOUNDATION GROUND");
  await expect(page.locator("#stageContextV31")).toContainText("CLEAR MORNING");
  await expect(page.locator("#venueNameV41")).toHaveText("FOUNDATION GROUND");
  await expect(page.locator("html")).toHaveAttribute("data-football-lab-environment", "academy");

  await expect.poll(
    () => page.evaluate(() => window.__footballLabCampaignV41?.venue),
    { timeout: 3000 }
  ).toBe("FOUNDATION GROUND");
  const stage = await page.evaluate(() => window.__footballLabCampaignV41);
  expect(stage.build).toBe("41.0.0");
  expect(stage.venue).toBe("FOUNDATION GROUND");
  expect(stage.environment).toBe("academy");
  expect(stage.weather).toBe("CLEAR MORNING");
  expect(stage.chapter).toBe(1);
  expect(stage.chapterStage).toBe(1);
  expect(stage.chapterFinal).toBe(false);
});