import { test, expect } from "@playwright/test";
import { loadGameplay } from "./helpers/load-gameplay.js";

async function ready(page) {
  await page.goto("/index.html?test=v54-strike-motion");
  await loadGameplay(page);
  await expect.poll(
    () => page.evaluate(() => Boolean(window.__footballLabStrikeMotionV54 && window.__footballLabStrikeMotionBridgeV54)),
    { timeout: 10000 }
  ).toBe(true);
}

test("V54 visual run-up remap expands the decisive strike phases without moving launch timing", async ({ page }) => {
  await ready(page);
  const sample = await page.evaluate(() => {
    const contract = window.__footballLabStrikeMotionV54;
    return {
      build: contract.build,
      physicsChanged: contract.physicsChanged,
      launchTimingChanged: contract.launchTimingChanged,
      runUpDurationChanged: contract.runUpDurationChanged,
      early: contract.sample(0.15, "balanced"),
      middle: contract.sample(0.5, "power"),
      late: contract.sample(0.82, "curve"),
      contact: contract.sample(1, "power")
    };
  });

  expect(sample.build).toBe("54.1.0");
  expect(sample.physicsChanged).toBe(false);
  expect(sample.launchTimingChanged).toBe(false);
  expect(sample.runUpDurationChanged).toBe(false);
  expect(sample.early).toBeGreaterThan(0.15);
  expect(sample.middle).toBeGreaterThan(0.6);
  expect(sample.late).toBeGreaterThan(0.82);
  expect(sample.contact).toBe(1);
});
