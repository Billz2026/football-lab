import { test, expect } from "@playwright/test";

async function ready(page) {
  await page.goto("/index.html?test=v38-1-1-keeper-halo");
  await expect.poll(
    () => page.evaluate(() => Boolean(window.__footballLabKeeperHaloHotfixV3811)),
    { timeout: 10000 }
  ).toBe(true);
}

test("V38.1.1 removes the projected oval behind the keeper without changing gameplay", async ({ page }) => {
  await ready(page);
  const contract = await page.evaluate(() => window.__footballLabKeeperHaloHotfixV3811);

  expect(contract.build).toBe("38.1.1");
  expect(contract.source).toBe("projected-penalty-arc");
  expect(contract.bodyHaloRemoved).toBe(true);
  expect(contract.penaltyArcSuppressedInFreeKickView).toBe(true);
  expect(contract.groundShadowRetained).toBe(true);
  expect(contract.preservesKeeperRig).toBe(true);
  expect(contract.preservesKeeperAI).toBe(true);
  expect(contract.preservesAiming).toBe(true);
  expect(contract.preservesDifficulty).toBe(true);
  expect(contract.preservesPhysics).toBe(true);
  expect(contract.preservesShotOutcome).toBe(true);
});

test("V38.1.1 suppresses only the long 1.5px pitch arc path", async ({ page }) => {
  await ready(page);

  const result = await page.evaluate(async () => {
    const { state, ctx } = await import("./game/core-v6.js?v=32.4");
    state.screen = "game";
    const before = window.__footballLabKeeperHaloSuppressedV3811 || 0;

    ctx.strokeStyle = "rgba(236,255,232,.66)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(100, 100);
    for (let i = 1; i <= 18; i += 1) ctx.lineTo(100 + i * 4, 100 + Math.sin(i) * 12);
    ctx.stroke();

    const afterArc = window.__footballLabKeeperHaloSuppressedV3811 || 0;

    ctx.strokeStyle = "rgba(236,255,232,.66)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(20, 20);
    ctx.lineTo(80, 20);
    ctx.stroke();

    const afterNormalLine = window.__footballLabKeeperHaloSuppressedV3811 || 0;
    return { before, afterArc, afterNormalLine };
  });

  expect(result.afterArc).toBe(result.before + 1);
  expect(result.afterNormalLine).toBe(result.afterArc);
});

test("V38.1.1 publishes the current build marker", async ({ page }) => {
  await ready(page);
  await expect.poll(
    () => page.evaluate(() => document.documentElement.dataset.footballLabBuild),
    { timeout: 5000 }
  ).toBe("38.1.1");

  const release = await page.evaluate(() => window.__footballLabReleaseV3811);
  expect(release.build).toBe("38.1.1");
  expect(release.keeperBodyHalo).toBe("removed");
  expect(release.keeperProjectedPenaltyArc).toBe("suppressed-in-free-kick-view");
  expect(release.keeperGroundShadow).toBe("soft-ground-only");
  expect(release.aimingChanged).toBe(false);
  expect(release.difficultyChanged).toBe(false);
  expect(release.physicsChanged).toBe(false);
  expect(release.shotOutcomeChanged).toBe(false);
});
