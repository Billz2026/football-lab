import { test, expect } from "@playwright/test";

async function openPowerKicker(page, viewport = { width: 884, height: 1100 }) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize(viewport);
  await page.goto("/index.html?v=173");
  await expect.poll(() => page.evaluate(() => window.__footballLabMainV173 === true), { timeout: 20000 }).toBe(true);
  await expect.poll(() => page.evaluate(() => window.__footballLabMotionV173 === true), { timeout: 20000 }).toBe(true);
  await page.locator("#playClassic").click();
  await expect(page.locator("#kickerSelectV13")).toHaveClass(/is-open/);
  await page.locator(".kicker-card").first().click();
  await page.locator("#kickerConfirmV13").click();
  await expect(page.locator("#gameScreen")).toHaveClass(/is-active/);
  await expect(page.locator("#shotAction")).toHaveText(/START SHOT/, { timeout: 7000 });
  return errors;
}

async function launchShot(page) {
  const action = page.locator("#shotAction");
  await action.click();
  await page.waitForTimeout(120);
  await action.click();
  await page.waitForTimeout(120);
  await action.click();
  await page.waitForTimeout(120);
  await action.click();
  await expect(page.locator("#phaseTitle")).toContainText(/WATCH|FLIGHT/);
}

test("V17.3 locks travel before plant and contact", async ({ page }) => {
  const errors = await openPowerKicker(page);
  await launchShot(page);

  await expect.poll(() => page.evaluate(() => window.__footballLabMotionSnapshotV173?.plantLocked === true), { timeout: 6000 }).toBe(true);
  const first = await page.evaluate(() => window.__footballLabMotionSnapshotV173);
  await page.waitForTimeout(90);
  const second = await page.evaluate(() => window.__footballLabMotionSnapshotV173);

  expect(first.travel).toBeGreaterThan(0.995);
  expect(second.travel).toBeGreaterThan(0.995);
  expect(Math.abs(second.world.x - first.world.x)).toBeLessThan(0.003);
  expect(Math.abs(second.world.z - first.world.z)).toBeLessThan(0.003);
  expect(first.leftAnkle.y).toBeGreaterThan(-0.01);
  expect(second.leftAnkle.y).toBeGreaterThan(-0.01);
  expect(errors).toEqual([]);
});

test("V17.3 holds a rotated follow-through before recovery", async ({ page }) => {
  const errors = await openPowerKicker(page, { width: 1180, height: 820 });
  await launchShot(page);

  await expect.poll(() => page.evaluate(() => {
    const motion = window.__footballLabMotionSnapshotV173;
    return Boolean(
      motion &&
      motion.flight > 0 &&
      motion.bodyRotation > 0.07 &&
      motion.rightAnkle.y < -0.28
    );
  }), { timeout: 7000 }).toBe(true);

  const first = await page.evaluate(() => window.__footballLabMotionSnapshotV173);
  await page.waitForTimeout(70);
  const second = await page.evaluate(() => window.__footballLabMotionSnapshotV173);

  expect(first.bodyRotation).toBeGreaterThan(0.07);
  expect(first.rightAnkle.y).toBeLessThan(-0.28);
  expect(second.bodyRotation).toBeGreaterThan(0.02);
  expect(second.rightAnkle.y).toBeLessThan(-0.16);
  expect(errors).toEqual([]);
});
