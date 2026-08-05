import { test, expect } from "@playwright/test";

async function waitForProgression(page) {
  await page.goto("/index.html");
  await expect.poll(
    () => page.evaluate(() => Boolean(window.__footballLabProgressionV20)),
    { timeout: 5000 }
  ).toBe(true);
}

test("V20 exposes an exact auditable scoring receipt", async ({ page }) => {
  await waitForProgression(page);
  const result = await page.evaluate(() => {
    const tools = window.__footballLabProgressionToolsV20;
    const receipt = tools.scoreComponentsForShot({
      outcome: "GOAL",
      strikeQuality: 1,
      topCorner: true
    }, {
      stageIndex: 3,
      distanceYards: 30,
      streak: 4,
      wind: 0.1
    });
    return { contract: window.__footballLabProgressionV20, receipt };
  });

  expect(result.contract.scoreReceipts).toBe(true);
  expect(result.contract.scoreCorrection).toBe(true);
  expect(result.receipt).toEqual({
    baseGoal: 1000,
    stage: 255,
    streak: 375,
    strike: 350,
    distance: 340,
    topCorner: 700,
    wind: 170,
    total: 3190
  });
});

test("V20 progression rewards and visible profile title are deterministic", async ({ page }) => {
  await waitForProgression(page);
  const result = await page.evaluate(() => {
    const tools = window.__footballLabProgressionToolsV20;
    const medal = tools.medalForScore(17000);
    const xp = tools.xpForRun({
      stageReached: 8,
      goals: 7,
      perfectStrikes: 3,
      topCorners: 2
    }, medal, true, false);
    return {
      medal,
      xp,
      title1: tools.titleForLevel(1),
      title5: tools.titleForLevel(5)
    };
  });

  expect(result.medal.id).toBe("GOLD");
  expect(result.xp).toBe(895);
  expect(result.title1).toBe("THE PROSPECT");
  expect(result.title5).toBe("FREE-KICK ARTIST");
  await expect(page.locator(".player-card-top h2")).toHaveText(/THE PROSPECT|SET-PIECE STUDENT|DEAD-BALL SPECIALIST|FREE-KICK ARTIST|ELITE FINISHER/);
  await expect(page.locator("#profileMedalV20")).toBeVisible();
  await expect(page.locator("#runSummaryV20")).toHaveCount(1);
});

async function startClassic(page) {
  await page.locator("#playClassic").click();
  await expect(page.locator("#kickerSelectV13")).toHaveClass(/is-open/);
  await page.locator("#kickerConfirmV13").click();
  await expect(page.locator("#gameScreen")).toHaveClass(/is-active/);
  await expect(page.locator("#shotAction")).toHaveText("START SHOT", { timeout: 1800 });
}

test("V20 starts a fresh run tracker and personal-best chase", async ({ page }) => {
  await waitForProgression(page);
  await startClassic(page);

  await expect(page.locator("#pbChaseV20")).toHaveCount(1);
  await expect.poll(
    () => page.evaluate(() => window.__footballLabRunStatsV20?.shots),
    { timeout: 2000 }
  ).toBe(0);

  const stats = await page.evaluate(() => window.__footballLabRunStatsV20);
  expect(stats.goals).toBe(0);
  expect(stats.integrityFailures).toBe(0);
  expect(stats.pointsBySource.baseGoal).toBe(0);
});
