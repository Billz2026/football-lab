import { test, expect } from "@playwright/test";

async function ready(page) {
  await page.goto("/index.html?test=v38-1-2-keeper-ghost");
  await expect.poll(
    () => page.evaluate(() => Boolean(window.__footballLabKeeperGhostCleanupV3812)),
    { timeout: 10000 }
  ).toBe(true);
}

test("V38.1.2 suppresses the legacy goalkeeper rig and preserves gameplay systems", async ({ page }) => {
  await ready(page);
  const contract = await page.evaluate(() => window.__footballLabKeeperGhostCleanupV3812);

  expect(contract.build).toBe("38.1.2");
  expect(contract.bodyHaloRemoved).toBe(true);
  expect(contract.legacyGoalkeeperRigSuppressed).toBe(true);
  expect(contract.suppressionTrigger).toBe("goalmouth-transform-with-shadow-fallback");
  expect(contract.premiumGroundShadowRetained).toBe(true);
  expect(contract.preservesPremiumKeeperRig).toBe(true);
  expect(contract.preservesKeeperAI).toBe(true);
  expect(contract.preservesAiming).toBe(true);
  expect(contract.preservesDifficulty).toBe(true);
  expect(contract.preservesPhysics).toBe(true);
  expect(contract.preservesShotOutcome).toBe(true);
});

test("V38.1.2 goalmouth transform guard actually arms at runtime", async ({ page }) => {
  await ready(page);

  const result = await page.evaluate(async () => {
    const core = await import("./game/core-v6.js?v=32.4");
    const world = await import("./game/world-v7.js?v=32.4");
    const projection = await import("./game/projection-v6.js?v=32.4");
    const canvas = document.getElementById("gameCanvas");
    const context = canvas.getContext("2d");
    const stage = core.state.currentStage;
    if (!stage) return { armed: false, reason: "no-stage" };

    const originalScreen = core.state.screen;
    core.state.screen = "game";
    const point = projection.projectWorld(
      world.keeperWorld(stage),
      world.buildCamera(stage),
      { width: 1200, height: 720 }
    );
    const before = window.__footballLabKeeperGhostSuppressedFramesV3812 || 0;

    context.clearRect(0, 0, 1, 1);
    context.save();
    context.translate(point.x, point.y);
    context.restore();

    const after = window.__footballLabKeeperGhostSuppressedFramesV3812 || 0;
    core.state.screen = originalScreen;
    return { armed: after > before, before, after, visible: point.visible };
  });

  expect(result.visible).toBe(true);
  expect(result.armed).toBe(true);
});
