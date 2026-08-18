import { test, expect } from "@playwright/test";

test("V49 exposes a competitive penalty shootout from the hub", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => window.__footballLabPenaltyShootoutV49?.build === "49.0.0");

  const tile = page.locator(".hub-mode-penalties");
  await expect(tile).toBeEnabled();
  await expect(tile.locator(".hub-mode-status")).toHaveText("PLAYABLE");
  await expect(tile.locator("h3")).toHaveText("PENALTY SHOOTOUT");

  await tile.click();
  const setup = page.locator("#penaltyShootoutSetupV49");
  await expect(setup).toHaveClass(/is-open/);
  await expect(page.locator("#startShootoutV49")).toBeVisible();

  await page.locator("#shootoutDifficultyV49").selectOption("pro");
  await page.locator("#shootoutKeeperV49").selectOption("reader");
  await page.locator("#startShootoutV49").click();

  await expect(page.locator("#gameScreen")).toHaveClass(/is-active/);
  await expect(page.locator("html")).toHaveClass(/penalty-shootout-active-v49/);
  await expect(page.locator("#stageNumber")).toContainText("PENALTY SHOOTOUT");
  await expect(page.locator("#shootoutScoreboardV49")).toBeVisible();
  await expect(page.locator(".training-session-chip-v35")).toContainText("PENALTY SHOOTOUT");

  const scenario = await page.evaluate(() => {
    const value = globalThis.__footballLabTrainingScenario;
    const snapshot = window.__footballLabPenaltyShootoutV49?.snapshot?.();
    return {
      id: value?.id,
      competitivePenalty: value?.competitivePenalty,
      distanceYards: value?.distanceYards,
      wallPlayers: value?.wallPlayers,
      wind: value?.wind,
      windVariance: value?.windVariance,
      activity: snapshot ? "shootout" : null,
      difficultyId: snapshot?.difficultyId,
      userKeeperId: snapshot?.userKeeperId
    };
  });

  expect(scenario).toEqual({
    id: "penalty-shootout",
    competitivePenalty: true,
    distanceYards: 12,
    wallPlayers: 0,
    wind: 0,
    windVariance: 0,
    activity: "shootout",
    difficultyId: "pro",
    userKeeperId: "reader"
  });
});

test("V49 applies regulation clinches and paired sudden death correctly", async ({ page }) => {
  await page.goto("/");

  const result = await page.evaluate(async () => {
    const { shootoutDecision } = await import("./game/penalty-shootout-rules-v49.js?v=49.0.0");
    return {
      playerClinch: shootoutDecision([true, true, true, true], [false, false, false]),
      opponentClinch: shootoutDecision([false, false, false, false], [true, true, true]),
      tiedAfterFive: shootoutDecision([true, false, true, false, true], [true, false, true, false, true]),
      awaitingSuddenReply: shootoutDecision([true, false, true, false, true, true], [true, false, true, false, true]),
      suddenPlayerWin: shootoutDecision([true, false, true, false, true, true], [true, false, true, false, true, false])
    };
  });

  expect(result.playerClinch.complete).toBe(true);
  expect(result.playerClinch.winner).toBe("player");
  expect(result.playerClinch.reason).toBe("unreachable-lead");

  expect(result.opponentClinch.complete).toBe(true);
  expect(result.opponentClinch.winner).toBe("opponent");

  expect(result.tiedAfterFive.complete).toBe(false);
  expect(result.tiedAfterFive.phase).toBe("regulation");

  expect(result.awaitingSuddenReply.complete).toBe(false);
  expect(result.awaitingSuddenReply.phase).toBe("sudden-death");
  expect(result.awaitingSuddenReply.reason).toBe("awaiting-reply");

  expect(result.suddenPlayerWin.complete).toBe(true);
  expect(result.suddenPlayerWin.winner).toBe("player");
  expect(result.suddenPlayerWin.phase).toBe("sudden-death");
  expect(result.suddenPlayerWin.reason).toBe("sudden-death-pair");
});
