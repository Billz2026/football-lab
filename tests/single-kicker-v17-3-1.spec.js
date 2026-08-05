import { test, expect } from "@playwright/test";

async function openPowerKicker(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 884, height: 1100 });
  await page.goto("/index.html?v=1731");
  await expect.poll(() => page.evaluate(() => window.__footballLabMainV1731 === true), { timeout: 20000 }).toBe(true);
  await expect.poll(() => page.evaluate(() => window.__footballLabRendererV1731 === true), { timeout: 20000 }).toBe(true);
  await page.locator("#playClassic").click();
  await expect(page.locator("#kickerSelectV13")).toHaveClass(/is-open/);
  await page.locator(".kicker-card").first().click();
  await page.locator("#kickerConfirmV13").click();
  await expect(page.locator("#gameScreen")).toHaveClass(/is-active/);
  await expect(page.locator("#shotAction")).toHaveText(/START SHOT/, { timeout: 7000 });
  return errors;
}

async function lockShotInputs(page) {
  const action = page.locator("#shotAction");
  await action.click();
  await page.waitForTimeout(130);
  await action.click();
  await page.waitForTimeout(130);
  await action.click();
  await page.waitForTimeout(130);
  await action.click();
}

test("V17.3.1 renders exactly one Power Kicker at idle and during the shot", async ({ page }) => {
  const errors = await openPowerKicker(page);

  await expect.poll(() => page.evaluate(() => window.__footballLabVisibleKickersV1731?.total), { timeout: 7000 }).toBe(1);
  let rendererState = await page.evaluate(() => window.__footballLabVisibleKickersV1731);
  expect(rendererState).toMatchObject({ base: 0, hero: 1, total: 1, character: "dax-ryder" });
  expect(await page.evaluate(() => window.__footballLabBaseKickerSuppressedV1731)).toBe(true);

  await lockShotInputs(page);
  await expect(page.locator("#phaseTitle")).toContainText(/WATCH|FLIGHT/);
  await expect.poll(() => page.evaluate(() => window.__footballLabVisibleKickersV1731?.total), { timeout: 7000 }).toBe(1);
  rendererState = await page.evaluate(() => window.__footballLabVisibleKickersV1731);
  expect(rendererState).toMatchObject({ base: 0, hero: 1, total: 1, character: "dax-ryder" });
  expect(await page.evaluate(() => window.__footballLabHeroFrameV1731?.active)).toBe(true);
  expect(errors).toEqual([]);
});

test("V17.3.1 uses a landing recovery step before neutral", async ({ page }) => {
  const errors = await openPowerKicker(page);
  await lockShotInputs(page);

  await expect.poll(
    () => page.evaluate(() => window.__footballLabMotionSnapshotV173?.phase),
    { timeout: 9000 }
  ).toMatch(/recovery-step|recovery-neutral/);

  const snapshot = await page.evaluate(() => window.__footballLabMotionSnapshotV173);
  expect(snapshot.phase).toMatch(/recovery-step|recovery-neutral/);
  expect(snapshot.bodyRotation).toBeGreaterThanOrEqual(0);
  expect(errors).toEqual([]);
});
