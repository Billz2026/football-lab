import { test, expect } from "@playwright/test";

async function ready(page) {
  await page.goto("/index.html?test=v37-1-early");
  await expect.poll(
    () => page.evaluate(() => Boolean(window.__footballLabRefinementV371)),
    { timeout: 10000 }
  ).toBe(true);
}

test("V37.1 refinement contract is live and Standard balance is unchanged", async ({ page }) => {
  await ready(page);
  const contract = await page.evaluate(() => window.__footballLabRefinementV371);
  expect(contract.build).toBe("37.1.0");
  expect(contract.standardDifficultyChanged).toBe(false);
  expect(contract.solvedTrajectory).toBe(false);
});

test("V37.1 training accuracy isolates the visible percentage", async ({ page }) => {
  await ready(page);
  await page.evaluate(async () => {
    const core = await import("/game/core-v6.js?v=32.4");
    core.state.gameMode = "training";
    core.state.trainingAttempts = 7;
    core.state.trainingGoals = 2;
    document.documentElement.classList.add("training-active-v35");
  });
  await expect(page.locator("#trainingAccuracyV371")).toHaveText("29%");
  await expect(page.locator("#trainingAccuracyV371")).toBeVisible();
});

test("V37.1 feedback reports intended versus actual execution", async ({ page }) => {
  await ready(page);
  const feedback = await page.evaluate(() => {
    const contract = window.__footballLabRefinementV371;
    return contract.getExecutionFeedback({
      intendedAimX: 0.78,
      intendedAimY: 0.22,
      aimX: 0.78,
      aimY: 0.22,
      actualX: 0.91,
      actualY: 0.31,
      contactQuality: 0.52,
      contactOffset: 0.42
    });
  });
  expect(feedback.intended).toBe("HIGH RIGHT");
  expect(feedback.actual).not.toBe(feedback.intended);
  expect(feedback.total).toBeGreaterThan(0);
  expect(feedback.contact).toBe("MISHIT LATE");
});
