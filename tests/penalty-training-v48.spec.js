import { test, expect } from "@playwright/test";

test("V48 keeps playable penalty practice inside the Training Ground", async ({ page }) => {
  await page.goto("/");

  const trainingTile = page.locator(".hub-mode-training");
  await expect(trainingTile).toBeEnabled();
  await trainingTile.click();
  await page.waitForFunction(() => window.__footballLabTrainingV35?.build?.startsWith("35.0"));

  const modal = page.locator("#trainingModalV35");
  await expect(modal).toHaveClass(/is-open/);

  const penaltyActivity = modal.locator(".training-activity-v35", { hasText: "PENALTIES" });
  await expect(penaltyActivity).toBeEnabled();
  await expect(penaltyActivity).toContainText("PLAYABLE NOW");
  await penaltyActivity.click();
  await page.waitForFunction(() => window.__footballLabPenaltyTrainingV48?.build?.startsWith("48.0"));

  await expect(page.locator("#trainingStartV35")).toHaveText("START PENALTY TRAINING");
  await expect(page.locator("#trainingDistanceV35")).toHaveValue("12");
  await expect(page.locator("#trainingWallCountV35")).toHaveValue("0");
  await expect(page.locator("#trainingWindV35")).toHaveValue("off");

  await page.locator("#trainingStartV35").click();

  await expect(page.locator("#gameScreen")).toHaveClass(/is-active/);
  await expect(page.locator("#stageNumber")).toContainText("PENALTY TRAINING");
  await expect(page.locator("#stageNumber")).toContainText("12 YDS");
  await expect(page.locator("#stageName")).toHaveText("ONE VS ONE · PENALTY SPOT");
  await expect(page.locator(".training-session-chip-v35")).toContainText("PENALTY TRAINING");
  await expect(page.locator(".training-session-mode-v355")).toHaveText("PENALTY TRAINING");

  const scenario = await page.evaluate(() => {
    const value = globalThis.__footballLabTrainingScenario;
    return {
      id: value?.id,
      training: value?.training,
      trainingPenalty: value?.trainingPenalty,
      distanceYards: value?.distanceYards,
      ballX: value?.ballX,
      wallPlayers: value?.wallPlayers,
      wind: value?.wind,
      windVariance: value?.windVariance
    };
  });

  expect(scenario).toEqual({
    id: "training-penalty",
    training: true,
    trainingPenalty: true,
    distanceYards: 12,
    ballX: 0,
    wallPlayers: 0,
    wind: 0,
    windVariance: 0
  });
});

test("training matchup badges expose a real base tier", async ({ page }) => {
  await page.goto("/");
  const trainingTile = page.locator(".hub-mode-training");
  await trainingTile.click();
  await page.waitForFunction(() => window.__footballLabTrainingV35?.build?.startsWith("35.0"));

  await page.locator("#trainingStartV35").click();
  await expect(page.locator("#gameScreen")).toHaveClass(/is-active/);
  await expect(page.locator(".active-keeper-chip-v14 em")).toHaveText(/T1/);
  await expect(page.locator(".active-wall-chip-v15 em")).toHaveText(/T1/);
  await expect(page.locator("body")).not.toContainText("Tundefined");
});
