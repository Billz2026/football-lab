import { test, expect } from "@playwright/test";

async function waitForRefinement(page) {
  await page.goto("/index.html?test=v37-1");
  await expect.poll(
    () => page.evaluate(() => Boolean(window.__footballLabRefinementV371)),
    { timeout: 10000 }
  ).toBe(true);
}

test("V37.1 exposes refinement contract without changing Standard difficulty", async ({ page }) => {
  await waitForRefinement(page);
  const contract = await page.evaluate(() => window.__footballLabRefinementV371);
  expect(contract.build).toBe("37.1.0");
  expect(contract.trainingAccuracyIsolation).toBe(true);
  expect(contract.intendedVsActualFeedback).toBe(true);
  expect(contract.aimRiskHalo).toBe(true);
  expect(contract.solvedTrajectory).toBe(false);
  expect(contract.standardDifficultyChanged).toBe(false);
});

test("Training accuracy shows goals divided by attempts instead of personal best", async ({ page }) => {
  await waitForRefinement(page);
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

test("Aim risk halo grows with curl and distance without exposing a solved path", async ({ page }) => {
  await waitForRefinement(page);

  const low = await page.evaluate(async () => {
    const core = await import("/game/core-v6.js?v=32.4");
    core.state.screen = "game";
    core.state.phase = "aim";
    core.state.controlMode = "standard";
    core.state.currentStage = { ...core.state.currentStage, distanceYards: 18 };
    core.state.shot = { ...core.createShot(), previewAimX: 0.78, previewAimY: 0.22, previewCurve: 0 };
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return { ...window.__footballLabAimRiskV371 };
  });

  const high = await page.evaluate(async () => {
    const core = await import("/game/core-v6.js?v=32.4");
    core.state.currentStage = { ...core.state.currentStage, distanceYards: 45 };
    core.state.shot.previewCurve = 1;
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return { ...window.__footballLabAimRiskV371 };
  });

  expect(low.solvedTrajectory).toBe(false);
  expect(high.solvedTrajectory).toBe(false);
  expect(high.risk).toBeGreaterThan(low.risk);
  expect(high.diameter).toBeGreaterThan(low.diameter);
});

test("Breakdown explains intended versus actual placement and execution error", async ({ page }) => {
  await waitForRefinement(page);

  const result = await page.evaluate(async () => {
    const core = await import("/game/core-v6.js?v=32.4");
    core.state.shot = {
      ...core.createShot(),
      intendedAimX: 0.78,
      intendedAimY: 0.22,
      aimX: 0.78,
      aimY: 0.22,
      actualX: 0.91,
      actualY: 0.31,
      contactQuality: 0.52,
      contactOffset: 0.42
    };
    core.state.presentation = {
      phase: "breakdown",
      breakdown: {
        placement: "HIGH RIGHT",
        reason: "Base outcome reason."
      }
    };
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    return {
      placement: core.state.presentation.breakdown.placement,
      reason: core.state.presentation.breakdown.reason,
      feedback: window.__footballLabLastFeedbackV371
    };
  });

  expect(result.placement).toContain("→");
  expect(result.reason).toContain("EXECUTION");
  expect(result.reason).toContain("MISHIT LATE");
  expect(result.feedback.executionMetres).toBeGreaterThan(0);
});
