import { test, expect } from "@playwright/test";

async function startDuel(page, difficulty = "pro", keeper = "reader") {
  await page.goto("/?test=penalty-v51");
  await page.locator(".hub-mode-penalties").click();
  await page.waitForFunction(() => window.__footballLabPenaltyShootoutV49?.build === "49.0.0");
  await page.waitForFunction(() => window.__footballLabPenaltyDuelV51?.build === "51.2.0");
  await page.waitForFunction(() => window.__footballLabPenaltyDuelTransitionGuardV51?.build === "51.2.0");
  await page.locator("#shootoutDifficultyV49").selectOption(difficulty);
  await page.locator("#shootoutKeeperV49").selectOption(keeper);
  await page.locator("#startShootoutV49").click();
  await expect(page.locator("#gameScreen")).toHaveClass(/is-active/);
  await expect.poll(() => page.evaluate(() => window.__footballLabPenaltyDuelV51?.snapshot?.()?.active), { timeout: 8000 }).toBe(true);
}

async function recordPlayerKick(page, goal) {
  await page.evaluate(async (scored) => {
    const core = await import("/game/core-v6.js?v=32.4");
    core.state.shot.outcome = scored ? "GOAL" : "MISS";
    delete core.state.shot.__duelCountedV51;
    window.dispatchEvent(new CustomEvent("footballlab:phasechange", { detail: { phase: "result" } }));
  }, goal);
  await expect.poll(
    () => page.evaluate(() => window.__footballLabPenaltyDuelV51.snapshot().turn),
    { timeout: 5000 }
  ).toBe("cpu");
}

async function settleCpuKick(page, goal) {
  const settled = await page.evaluate((scored) => window.__footballLabPenaltyDuelV51.testControl?.settleCpuResult(scored), goal);
  expect(settled).toBe(true);
}

async function playRound(page, playerGoal, cpuGoal, complete = false) {
  await recordPlayerKick(page, playerGoal);
  await settleCpuKick(page, cpuGoal);
  await expect.poll(
    () => page.evaluate(() => window.__footballLabPenaltyDuelV51.snapshot().turn),
    { timeout: 3000 }
  ).toBe(complete ? "complete" : "player");
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

  await page.evaluate(() => {
    const shift = document.querySelector('[data-v51-shift="left"]');
    const dive = document.querySelector('[data-v51-dive="high-left"]');
    window.__footballLabDiveCommittedTest = false;
    window.__footballLabDiveCommittedSnapshotTest = null;
    window.__footballLabOpponentResultsAfterStallTest = null;
    if (!(shift instanceof HTMLButtonElement) || !(dive instanceof HTMLButtonElement)) return;
    shift.click();
    let observer;
    const commitWhenReady = () => {
      if (dive.disabled) return false;
      dive.click();
      observer?.disconnect();
      window.__footballLabDiveCommittedTest = true;
      window.__footballLabDiveCommittedSnapshotTest = window.__footballLabPenaltyDuelV51.snapshot().defense?.committed;
      const end = performance.now() + 1200;
      while (performance.now() < end) {}
      window.__footballLabOpponentResultsAfterStallTest = window.__footballLabPenaltyDuelV51.snapshot().opponentResults.length;
      return true;
    };
    if (commitWhenReady()) return;
    observer = new MutationObserver(commitWhenReady);
    observer.observe(dive, { attributes: true, attributeFilter: ["disabled"] });
    setTimeout(() => observer.disconnect(), 4000);
  });

  await expect(page.locator("#penaltyDefenseV51")).toBeVisible();
  await expect(page.locator("#defenseDifficultyV51")).toHaveText("WORLD CLASS");
  await expect(page.locator("[data-v51-shift]")).toHaveCount(3);
  await expect(page.locator("[data-v51-dive]")).toHaveCount(6);
  await expect(page.locator("#stageName")).toHaveText("YOU ARE THE GOALKEEPER");
  const runUpMeter = page.locator("#defenseRunUpProgressV51");
  await expect(runUpMeter).toBeVisible();
  await expect(runUpMeter).toHaveAttribute("role", "progressbar");
  await expect(runUpMeter).toHaveAttribute("aria-label", "CPU run-up progress");
  await expect(runUpMeter).toHaveAttribute("aria-valuenow", /\d+/);

  const leftShift = page.locator('[data-v51-shift="left"]');
  await expect(leftShift).toHaveClass(/is-selected/);
  await expect.poll(() => page.evaluate(() => window.__footballLabDiveCommittedTest), { timeout: 4000 }).toBe(true);
  expect(await page.evaluate(() => window.__footballLabDiveCommittedSnapshotTest)).toBe("high-left");
  expect(await page.evaluate(() => window.__footballLabOpponentResultsAfterStallTest)).toBe(0);

  await expect.poll(() => page.evaluate(() => window.__footballLabPenaltyDuelV51.snapshot().opponentResults.length), { timeout: 5000 }).toBe(1);
  await expect.poll(() => page.evaluate(() => window.__footballLabPenaltyDuelV51.snapshot().turn), { timeout: 5000 }).toBe("player");

  const snapshot = await page.evaluate(() => window.__footballLabPenaltyDuelV51.snapshot());
  expect(snapshot.playerResults).toEqual([true]);
  expect(snapshot.opponentResults).toHaveLength(1);
});

test("V51 CPU difficulties change readable behaviour, disguise and reaction", async ({ page }) => {
  await page.goto("/?test=penalty-v51");
  await page.locator(".hub-mode-penalties").click();
  await page.waitForFunction(() => window.__footballLabPenaltyDuelV51?.build === "51.2.0");
  const models = await page.evaluate(() => window.__footballLabPenaltyDuelV51.difficulties);

  expect(models.academy.runUpMs).toBeGreaterThan(models.world.runUpMs);
  expect(models.academy.cueReliability).toBeGreaterThan(models.world.cueReliability);
  expect(models.academy.reactsToEarly).toBeLessThan(models.world.reactsToEarly);
  expect(models.academy.missChance).toBeGreaterThan(models.world.missChance);
  expect(models.academy.saveThreshold).toBeLessThan(models.world.saveThreshold);
  expect(models.world.disguise).toBeGreaterThan(models.pro.disguise);
});

test("V51.2 mobile goalkeeper controls keep every dive target at least 44 pixels high", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await startDuel(page, "pro", "reflex");
  await recordPlayerKick(page, true);
  await expect.poll(
    () => page.evaluate(() => window.__footballLabPenaltyDuelV51.snapshot().defense?.runUpStarted),
    { timeout: 3000 }
  ).toBe(true);

  const targets = await page.locator("[data-v51-dive]").evaluateAll((buttons) => buttons.map((button) => {
    const rect = button.getBoundingClientRect();
    return { width: rect.width, height: rect.height };
  }));
  expect(targets).toHaveLength(6);
  for (const target of targets) {
    expect(target.width).toBeGreaterThanOrEqual(44);
    expect(target.height).toBeGreaterThanOrEqual(44);
  }
});

test("V51.2 completes a regulation shootout, persists the win and returns cleanly to the menu", async ({ page }) => {
  await startDuel(page, "pro", "reader");
  await page.evaluate(() => {
    window.__footballLabCompletedDuelTest = null;
    window.addEventListener("footballlab:penaltyduelcomplete", (event) => {
      window.__footballLabCompletedDuelTest = event.detail;
    }, { once: true });
  });

  await playRound(page, true, true);
  await playRound(page, false, false);
  await playRound(page, true, true);
  await playRound(page, false, false);
  await playRound(page, true, false, true);

  await expect(page.locator("#penaltyDuelResultV51")).toHaveClass(/is-open/);
  await expect(page.locator("#duelResultTitleV51")).toHaveText("SHOOTOUT WON.");
  await expect(page.locator("#duelFinalYouV51")).toHaveText("3");
  await expect(page.locator("#duelFinalCpuV51")).toHaveText("2");
  expect(await page.evaluate(() => window.__footballLabCompletedDuelTest)).toEqual({
    winner: "player",
    playerScore: 3,
    cpuScore: 2,
    suddenDeathRounds: 0
  });
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("footballLabPenaltyShootoutRecordV49")))).toMatchObject({
    shootouts: 1,
    wins: 1,
    losses: 0,
    currentWinStreak: 1,
    bestWinStreak: 1
  });

  await page.locator("#duelMenuV51").click();
  await expect(page.locator("#modeHub")).toBeVisible();
  await expect(page.locator("#gameScreen")).not.toHaveClass(/is-active/);
  await expect.poll(() => page.evaluate(() => window.__footballLabPenaltyDuelV51.snapshot())).toBeNull();
});

test("V51.2 resolves sudden death, records its length and reopens setup for play again", async ({ page }) => {
  await startDuel(page, "elite", "giant");

  await playRound(page, true, true);
  await playRound(page, false, false);
  await playRound(page, true, true);
  await playRound(page, false, false);
  await playRound(page, true, true);
  await playRound(page, true, false, true);

  await expect(page.locator("#penaltyDuelResultV51")).toHaveClass(/is-open/);
  await expect(page.locator("#duelResultCopyV51")).toContainText("after 1 sudden-death round");
  await expect(page.locator("#duelFinalYouV51")).toHaveText("4");
  await expect(page.locator("#duelFinalCpuV51")).toHaveText("3");
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem("footballLabPenaltyShootoutRecordV49")))).toMatchObject({
    shootouts: 1,
    wins: 1,
    longestSuddenDeath: 1
  });

  await page.locator("#duelAgainV51").click();
  await expect(page.locator("#shootoutDifficultyV49")).toBeVisible();
  await expect(page.locator("#penaltyShootoutSetupV49")).toHaveClass(/is-open/);
  await expect.poll(() => page.evaluate(() => window.__footballLabPenaltyDuelV51.snapshot())).toBeNull();
});
