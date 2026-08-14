import { test, expect } from "@playwright/test";

async function ready(page) {
  await page.goto("/index.html?test=keeper-visuals-current-contract");
  await expect.poll(
    () => page.evaluate(() => Boolean(window.__footballLabKeeperVisualsV3852)),
    { timeout: 10000 }
  ).toBe(true);
}

test("current premium keeper rig replaces the legacy visual rig without changing gameplay balance", async ({ page }) => {
  await ready(page);
  const contract = await page.evaluate(() => window.__footballLabKeeperVisualsV3852);

  expect(contract.build).toBe("38.5.2");
  expect(contract.legacyKeeperSuppressed).toBe(true);
  expect(contract.ovalMarkerRemoved).toBe(true);
  expect(contract.hardEllipseShadowRemoved).toBe(true);
  expect(contract.shadow).toBe("soft-grounded-radial");
  expect(contract.visualScale).toBe(1.20);
  expect(contract.readyStance).toBe("athletic-wide-crouch");
  expect(contract.wallReadabilityOverlay).toBe(false);
  expect(contract.trueSceneDepth).toBe(true);
  expect(contract.contactRingRemoved).toBe(true);
  expect(contract.preservesKeeperAI).toBe(true);
  expect(contract.preservesShotOutcome).toBe(true);
  expect(contract.preservesAiming).toBe(true);
  expect(contract.preservesDifficulty).toBe(true);
});

test("V41 publishes authoritative release and campaign markers while preserving keeper visual safeguards", async ({ page }) => {
  await ready(page);
  await expect.poll(
    () => page.evaluate(() => window.__footballLabReleaseV410?.build),
    { timeout: 10000 }
  ).toBe("41.0.0");
  await expect.poll(
    () => page.evaluate(() => window.__footballLabCampaignProgressionV41?.build),
    { timeout: 10000 }
  ).toBe("41.0.0");

  const release = await page.evaluate(() => window.__footballLabReleaseV410);
  expect(release.build).toBe("41.0.0");
  expect(release.keeperBodyHalo).toBe("removed");
  expect(release.keeperGroundShadow).toBe("soft-ground-only");
  expect(release.keeperContactRing).toBe("removed");
  expect(release.keeperProjectedPenaltyArc).toBe("suppressed-in-free-kick-view");
});
