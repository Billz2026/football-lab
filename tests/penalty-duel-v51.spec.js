import { test, expect } from "@playwright/test";

async function startDuel(page, difficulty = "pro", keeper = "reader") {
  await page.goto("/");
  await page.waitForFunction(() => window.__footballLabPenaltyShootoutV49?.build === "49.0.0");
  await page.waitForFunction(() => window.__footballLabPenaltyDuelV51?.build === "51.1.0");
  await page.waitForFunction(() => window.__footballLabPenaltyDuelTransitionGuardV51?.build === "51.1.0");
  await page.locator(".hub-mode-penalties").click();
  await page.locator("#shootoutDifficultyV49").selectOption(difficulty);
  await page.locator("#shootoutKeeperV49").selectOption(keeper);
  await page.locator("#startShootoutV49").click();
  await expect(page.locator("#gameScreen")).toHaveClass(/is-active/);
  await expect.poll(() => page.evaluate(() => window.__footballLabPenaltyDuelV51?.snapshot?.()?.active), { timeout: 8000 }).toBe(true);
}

test("V51 player penalties use placement, run-up and one composure strike instead of free-kick controls", async ({ page }) => {
  await startDuel(page, "elite", "reader");

  await expect(page.locator("html")).toHaveClass(/penalty-duel-v51/);
  await expect(page.locator("#penaltyDuelControlV51")).toBeVisible();
  await expect(page.locator("#strikeConsoleV324")).toBeHidden();
  await expect(page.locator("#shotAction")).toBeHidden();
  await expect(page.locator("#penaltyControlV50")).toHaveCount(0);
  await expect(page.locator("#shootoutDifficultyV49")).toHaveValue("elite");

  const initial = await page.evaluate(() => window.__footballLabPenaltyDuelV51.snapshot());
  expect(initial.turn).toBe("player");
  expect(initial.difficultyId).toBe("elite");
  expect(initial.userKeeperId).toBe("reader");

  await page.locator("#duelStepUpV51").click();
  await expect.poll(() => page.evaluate(() => window.__footballLabPenaltyDuelV51.snapshot().phase), { timeout: 4000 }).toBe("aim");
  await expect(page.locator("#penaltyDuelZonesV51")).toBeVisible();
  await expect(page.locator("[data-v51-attack-zone]")).toHaveCount(6);

  await page.locator('[data-v51-attack-zone="high-right"]').click();
  await expect(page.locator('[data-v51-attack-zone="high-right"]')).toHaveClass(/is-selected/);
  await expect(page.locator("#duelRunUpV51")).toBeEnabled();

  const planned = await page.evaluate(async () => {
    const core = await import("/game/core-v6.js?v=32.4");
    return {
      zone: window.__footballLabPenaltyDuelV51.snapshot().attackZone,
      aimX: core.state.shot?.previewAimX,
      aimY: core.state.shot?.previewAimY,
      curve: core.state.shot?.previewCurve
    };
  });
  expect(planned.zone).toBe("high-right");
  expect(planned.aimX).toBeCloseTo(0.82, 5);
  expect(planned.aimY).toBeCloseTo(0.18, 5);
  expect(planned.curve).toBe(0);

  await page.locator("#duelRunUpV51").click();
  await expect.poll(() => page.evaluate(() => window.__footballLabPenaltyDuelV51.snapshot().phase), { timeout: 5000 }).toBe("contact");
  await expect(page.locator("#duelComposureV51")).toBeVisible();
  await expect(page.locator("#phaseTitle")).toHaveText("KEEP YOUR NERVE");
});

test("V51 alternates into a playable CPU kick with user goalkeeper control", async ({ page }) => {
  await startDuel(page, "world", "reader");

  const transition = await page.evaluate(async () => {
    const core = await import("/game/core-v6.js?v=32.4");
    core.state.shot.outcome = "GOAL";
    delete core.state.shot.__duelCountedV51;
    window.dispatchEvent(new CustomEvent("footballlab:phasechange", { detail: { phase: "result" } }));
    return window.__footballLabPenaltyDuelTransitionGuardV51.snapshot();
  });
  expect(transition.transitionActive).toBe(true);
  await expect(page.locator("html")).toHaveClass(/penalty-duel-transition-v51/);

  await expect.poll(() => page.evaluate(() => window.__footballLabPenaltyDuelV51.snapshot().turn), { timeout: 5000 }).toBe("cpu");
  await expect(page.locator("html")).toHaveClass(/is-defending-v51/);
  await expect(page.locator("html")).not.toHaveClass(/penalty-duel-transition-v51/);
  await expect(page.locator("#penaltyDefenseV51")).toBeVisible();
  await expect(page.locator("#defenseDifficultyV51")).toHaveText("WORLD CLASS");
  await expect(page.locator("[data-v51-shift]")).toHaveCount(3);
  await expect(page.locator("[data-v51-dive]")).toHaveCount(6);
  await expect(page.locator("#stageName")).toHaveText("YOU ARE THE GOALKEEPER");

  const leftShift = page.locator('[data-v51-shift="left"]');
  await expect(leftShift).toBeEnabled();
  await leftShift.click();
  await expect(leftShift).toHaveClass(/is-selected/);

  await page.waitForFunction(() => window.__footballLabPenaltyDuelV51.snapshot().defense?.runUpStarted);
  const highLeftDive = page.locator('[data-v51-dive="high-left"]');
  await expect(highLeftDive).toBeEnabled();
  await highLeftDive.click();
  await expect.poll(
    () => page.evaluate(() => window.__footballLabPenaltyDuelV51.snapshot().defense?.committed),
    { timeout: 1500 }
  ).toBe("high-left");

  await expect.poll(() => page.evaluate(() => window.__footballLabPenaltyDuelV51.snapshot().opponentResults.length), { timeout: 5000 }).toBe(1);
  await expect.poll(() => page.evaluate(() => window.__footballLabPenaltyDuelV51.snapshot().turn), { timeout: 5000 }).toBe("player");

  const snapshot = await page.evaluate(() => window.__footballLabPenaltyDuelV51.snapshot());
  expect(snapshot.playerResults).toEqual([true]);
  expect(snapshot.opponentResults).toHaveLength(1);
});

test("V51 CPU difficulties change readable behaviour, disguise and reaction", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => window.__footballLabPenaltyDuelV51?.build === "51.1.0");
  const models = await page.evaluate(() => window.__footballLabPenaltyDuelV51.difficulties);

  expect(models.academy.runUpMs).toBeGreaterThan(models.world.runUpMs);
  expect(models.academy.cueReliability).toBeGreaterThan(models.world.cueReliability);
  expect(models.academy.reactsToEarly).toBeLessThan(models.world.reactsToEarly);
  expect(models.academy.missChance).toBeGreaterThan(models.world.missChance);
  expect(models.academy.saveThreshold).toBeLessThan(models.world.saveThreshold);
  expect(models.world.disguise).toBeGreaterThan(models.pro.disguise);
});
