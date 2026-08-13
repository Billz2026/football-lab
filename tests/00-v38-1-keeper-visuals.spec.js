import { test, expect } from "@playwright/test";

async function ready(page) {
  await page.goto("/index.html?test=v38-1-keeper");
  await expect.poll(
    () => page.evaluate(() => Boolean(window.__footballLabKeeperVisualsV381)),
    { timeout: 10000 }
  ).toBe(true);
}

test("V38.1 replaces the legacy keeper visual rig without touching gameplay balance", async ({ page }) => {
  await ready(page);
  const contract = await page.evaluate(() => window.__footballLabKeeperVisualsV381);

  expect(contract.build).toBe("38.1.0");
  expect(contract.legacyKeeperSuppressed).toBe(true);
  expect(contract.ovalMarkerRemoved).toBe(true);
  expect(contract.hardEllipseShadowRemoved).toBe(true);
  expect(contract.shadow).toBe("soft-grounded-radial");
  expect(contract.visualScale).toBe(1.18);
  expect(contract.readyStance).toBe("athletic-wide-crouch");
  expect(contract.wallReadabilityOverlay).toBe(true);
  expect(contract.contactRingRemoved).toBe(true);
  expect(contract.preservesKeeperAI).toBe(true);
  expect(contract.preservesShotOutcome).toBe(true);
  expect(contract.preservesAiming).toBe(true);
  expect(contract.preservesDifficulty).toBe(true);
});

test("V38.1 publishes the live build marker after startup", async ({ page }) => {
  await ready(page);
  await expect.poll(
    () => page.evaluate(() => document.documentElement.dataset.footballLabBuild),
    { timeout: 5000 }
  ).toBe("38.1");

  const release = await page.evaluate(() => window.__footballLabReleaseV381);
  expect(release.build).toBe("38.1.0");
  expect(release.keeperOvalMarker).toBe("removed");
  expect(release.keeperGroundShadow).toBe("soft-radial-no-ring");
  expect(release.aimingChanged).toBe(false);
  expect(release.difficultyChanged).toBe(false);
  expect(release.physicsChanged).toBe(false);
  expect(release.shotOutcomeChanged).toBe(false);
});
