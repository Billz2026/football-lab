import { test, expect } from "@playwright/test";

async function enterClassic(page) {
  await page.goto("/");
  await page.locator("#classicCard").click();
  await expect.poll(
    () => page.evaluate(() => (
      document.querySelector("#gameScreen")?.classList.contains("is-active")
      || document.querySelector("#kickerSelectV13")?.classList.contains("is-open")
    )),
    { timeout: 8000 }
  ).toBe(true);

  const pickerOpen = await page.evaluate(() => document.querySelector("#kickerSelectV13")?.classList.contains("is-open"));
  if (pickerOpen) await page.locator("#kickerConfirmV13").click();
  await expect(page.locator("#gameScreen")).toHaveClass(/is-active/);
}

test("V55 classifies resolved saves into five presentation-only body reads", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => window.__footballLabKeeperSaveReadabilityV55?.build === "55.0.0");

  const result = await page.evaluate(() => {
    const api = window.__footballLabKeeperSaveReadabilityV55;
    return {
      classes: api.saveBodyClasses,
      catch: api.classify({ outcome: "SAVE", saveType: "CATCH", contactX: 0.35, contactY: 1.18, baseX: 0, recovery: 0 }),
      parry: api.classify({ outcome: "SAVE", saveType: "PARRY", contactX: 0.9, contactY: 1.2, baseX: 0, recovery: 0 }),
      lowCollapse: api.classify({ outcome: "SAVE", saveType: "PARRY", contactX: 0.65, contactY: 0.32, baseX: 0, recovery: 0 }),
      fullStretch: api.classify({ outcome: "SAVE", saveType: "PARRY", contactX: 2.75, contactY: 1.55, baseX: 0, recovery: 0 }),
      recovery: api.classify({ outcome: "SAVE", saveType: "CATCH", contactX: 0.4, contactY: 1.1, baseX: 0, recovery: 0.35 }),
      nonSave: api.classify({ outcome: "GOAL", saveType: "PARRY", contactX: 2.9, contactY: 2.1, baseX: 0, recovery: 0 }),
      contract: {
        presentationOnly: api.presentationOnly,
        preservesKeeperAI: api.preservesKeeperAI,
        preservesSaveThresholds: api.preservesSaveThresholds,
        preservesShotOutcome: api.preservesShotOutcome,
        preservesPhysics: api.preservesPhysics,
        preservesScoring: api.preservesScoring,
        penaltyDuelChanged: api.penaltyDuelChanged
      }
    };
  });

  expect(result.classes).toEqual(["CATCH", "PARRY", "LOW_COLLAPSE", "FULL_STRETCH", "RECOVERY"]);
  expect(result.catch).toBe("CATCH");
  expect(result.parry).toBe("PARRY");
  expect(result.lowCollapse).toBe("LOW_COLLAPSE");
  expect(result.fullStretch).toBe("FULL_STRETCH");
  expect(result.recovery).toBe("RECOVERY");
  expect(result.nonSave).toBeNull();
  expect(result.contract).toEqual({
    presentationOnly: true,
    preservesKeeperAI: true,
    preservesSaveThresholds: true,
    preservesShotOutcome: true,
    preservesPhysics: true,
    preservesScoring: true,
    penaltyDuelChanged: false
  });
});

test("V55 wraps the base keeper frame before V44/V46 and never mutates authoritative save data", async ({ page }) => {
  await enterClassic(page);
  await page.waitForFunction(() => window.__footballLabKeeperSaveReadabilityV55?.installed === true, null, { timeout: 10000 });

  const diagnostics = await page.evaluate(async () => {
    const core = await import("/game/core-v6.js?v=32.4");
    const world = await import("/game/world-v7.js?v=32.4");
    const base = world.keeperWorld(core.state.currentStage);
    const originalShot = core.state.shot;
    const originalAnimation = core.state.animation;
    const now = performance.now();
    const plan = {
      start: { ...base },
      contact: { x: base.x + 0.62, y: 0.31, z: base.z },
      target: { x: base.x + 0.62, y: 0.31, z: base.z },
      reaction: 0.12,
      flightSeconds: 1,
      diveDirection: 1,
      wrongFooted: false
    };
    const syntheticShot = {
      ...originalShot,
      outcome: "SAVE",
      saveType: "PARRY",
      keeperPlan: plan,
      path: null,
      impactIndex: null
    };
    const before = JSON.stringify({
      outcome: syntheticShot.outcome,
      saveType: syntheticShot.saveType,
      keeperPlan: syntheticShot.keeperPlan
    });

    core.state.shot = syntheticShot;
    core.state.animation = {
      id: "v55-test-save",
      startedAt: now - 1500,
      runUpDuration: 420,
      contactHoldDuration: 80,
      flightDuration: 1100,
      settleDuration: 500,
      isReplay: false
    };

    try {
      window.__footballLabPremiumKeeperSceneDrawV3852(now);
      const frame = window.__footballLabPremiumKeeperSceneFrameV3852;
      const after = JSON.stringify({
        outcome: core.state.shot.outcome,
        saveType: core.state.shot.saveType,
        keeperPlan: core.state.shot.keeperPlan
      });
      return {
        installed: window.__footballLabKeeperSaveReadabilityV55.installed,
        wrappedSource: window.__footballLabKeeperSaveReadabilityV55.wrappedSource,
        saveBodyClass: frame?.keeper?.pose?.saveBodyClass,
        frameBuild: frame?.keeper?.pose?.saveBodyReadabilityBuild,
        lastFrame: window.__footballLabKeeperSaveBodyFrameV55,
        authoritativeDataUnchanged: before === after
      };
    } finally {
      core.state.shot = originalShot;
      core.state.animation = originalAnimation;
    }
  });

  expect(diagnostics.installed).toBe(true);
  expect(diagnostics.wrappedSource).toBe("drawPremiumKeeperInScene");
  expect(diagnostics.saveBodyClass).toBe("LOW_COLLAPSE");
  expect(diagnostics.frameBuild).toBe("55.0.0");
  expect(diagnostics.lastFrame).toMatchObject({
    build: "55.0.0",
    saveBodyClass: "LOW_COLLAPSE",
    saveType: "PARRY",
    penaltyDuel: false
  });
  expect(diagnostics.authoritativeDataUnchanged).toBe(true);
});

test("V55 is explicitly inactive for Penalty Duel keeper presentation", async ({ page }) => {
  await page.goto("/?test=penalty-v51");
  await page.waitForFunction(() => window.__footballLabKeeperSaveReadabilityV55?.build === "55.0.0");
  await page.locator(".hub-mode-penalties").click();
  await page.waitForFunction(() => window.__footballLabPenaltyDuelV51?.build === "52.0.0");
  await page.locator("#startShootoutV49").click();
  await expect.poll(
    () => page.evaluate(() => window.__footballLabPenaltyDuelV51?.snapshot?.()?.active),
    { timeout: 8000 }
  ).toBe(true);

  const contract = await page.evaluate(() => ({
    penaltyClass: document.documentElement.classList.contains("penalty-duel-v51"),
    penaltyDuelChanged: window.__footballLabKeeperSaveReadabilityV55.penaltyDuelChanged,
    snapshot: window.__footballLabKeeperSaveReadabilityV55.snapshot()
  }));
  expect(contract.penaltyClass).toBe(true);
  expect(contract.penaltyDuelChanged).toBe(false);
  expect(contract.snapshot).toBeNull();
});
