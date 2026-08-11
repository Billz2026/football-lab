import { test, expect } from "@playwright/test";

async function startMatch(page) {
  await page.goto("/index.html?test=free-aim-v32-1");
  await expect.poll(
    () => page.evaluate(() => window.__footballLabFreeAimV321?.build),
    { timeout: 12000 }
  ).toBe("32.1.0");
  await page.locator("#playClassic").click();
  await page.locator(".kicker-card").first().click();
  await page.locator("#kickerConfirmV13").click();
  await expect(page.locator("#shotAction")).toHaveText("START SHOT", { timeout: 4000 });
  await page.locator("#shotAction").click();
  await expect(page.locator("#phaseTitle")).toHaveText("SET POWER");
  await page.waitForTimeout(120);
  await page.locator("#shotAction").click();
  await expect(page.locator("#phaseTitle")).toHaveText("PLACE YOUR SHOT");
}

test("Build 32.1 exposes unrestricted direct 2D placement", async ({ page }) => {
  await startMatch(page);
  const contract = await page.evaluate(() => window.__footballLabFreeAimV321);
  expect(contract).toMatchObject({
    build: "32.1.0",
    directPitchAim: true,
    dragPadAim: true,
    keyboardAim: true,
    unrestrictedHeight: true,
    outsidePostLanes: true,
    progressiveReturnCurl: true,
    powerIndependentHeight: true,
    bounds: { minX: -0.22, maxX: 1.22, minY: -0.2, maxY: 1.08 }
  });
  await expect(page.locator("#freeAimControlV321")).toBeVisible();
  await expect(page.locator(".meter-wrap")).toBeHidden();

  const canvas = page.locator("#gameCanvas");
  const canvasBox = await canvas.boundingBox();
  await canvas.click({ position: { x: canvasBox.width * 0.56, y: canvasBox.height * 0.32 } });
  await expect(page.locator("#phaseTitle")).toHaveText("PLACE YOUR SHOT");
  expect(await page.evaluate(() => window.__footballLabFreeAimFrameV321?.source)).toBe("pitch");

  const pad = page.locator("#freeAimPadV321");
  const box = await pad.boundingBox();
  await pad.click({ position: { x: box.width * 0.04, y: box.height * 0.22 } });

  const frame = await page.evaluate(() => window.__footballLabFreeAimFrameV321);
  expect(frame.x).toBeLessThan(0);
  expect(frame.label).toContain("OUTSIDE LEFT");
  await expect(page.locator("#freeAimCoachV321")).toHaveText("ADD RIGHT BEND TO RETURN");

  await page.locator("#shotAction").click();
  await expect(page.locator("#phaseTitle")).toHaveText("ADD CURVE");
  await expect(page.locator("#phaseHelp")).toContainText("RIGHT curl");
  await expect.poll(
    () => page.evaluate(() => window.__footballLabClarityFrameV21?.targetVisible),
    { timeout: 3000 }
  ).toBe(true);
});

test("Build 32.1 separates height from power and supports around-wall return curl", async ({ page }) => {
  await page.goto("/index.html?test=free-aim-physics-v32-1");
  await expect.poll(
    () => page.evaluate(() => window.__footballLabFreeAimV321?.build),
    { timeout: 12000 }
  ).toBe("32.1.0");

  const result = await page.evaluate(async () => {
    const core = await import("/game/core-v6.js?v=31");
    const physics = await import("/game/runtime-v23-bridge-physics-v19-f1d39f9409.js?v=31");

    function simulate({ power, aimX, aimY, curve, stage = 0 }) {
      core.state.stage = stage;
      core.syncStage();
      core.state.stageWind = 0;
      core.state.shot = {
        ...core.createShot(),
        power,
        aimX,
        aimY,
        previewAimX: aimX,
        previewAimY: aimY,
        curve
      };
      const resolution = physics.resolveShotPhysics();
      const shot = core.state.shot;
      return {
        outcome: shot.outcome,
        wallLane: shot.diagnostics.wallLane,
        wallClearance: shot.diagnostics.wallClearanceMetres,
        selectedX: shot.diagnostics.selectedTarget.x,
        finalX: shot.diagnostics.finalTarget.x,
        finalY: shot.diagnostics.finalTarget.y,
        curveMetres: shot.diagnostics.curveMetres,
        path: shot.path.map(({ x, y, z }) => ({ x, y, z }))
      };
    }

    return {
      powers: [0.64, 0.74, 0.84].map((power) => simulate({ power, aimX: 0.24, aimY: 0.2, curve: 0 })),
      around: simulate({ power: 0.72, aimX: -0.1, aimY: 0.24, curve: 1 })
    };
  });

  expect(result.powers.every((shot) => shot.outcome !== "WALL")).toBe(true);
  expect(result.powers.every((shot) => shot.finalY > 0 && shot.finalY < 2.44)).toBe(true);

  expect(result.around.selectedX).toBeLessThan(-3.66);
  expect(result.around.finalX).toBeGreaterThan(-3.66);
  expect(result.around.finalX).toBeLessThan(3.66);
  expect(result.around.curveMetres).toBeGreaterThan(0.9);
  expect(result.around.wallLane).toBe("AROUND");
  expect(result.around.outcome).not.toBe("WALL");
  expect(result.around.path.every((point) => Number.isFinite(point.x) && Number.isFinite(point.y) && Number.isFinite(point.z))).toBe(true);
});

test("Build 32.1 keeps the complete aim range usable on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await startMatch(page);
  await page.waitForTimeout(1000);

  const pad = page.locator("#freeAimPadV321");
  const action = page.locator("#shotAction");
  const padBox = await pad.boundingBox();
  const actionBox = await action.boundingBox();
  expect(padBox.x).toBeGreaterThanOrEqual(0);
  expect(padBox.x + padBox.width).toBeLessThanOrEqual(390);
  expect(padBox.y + padBox.height).toBeLessThanOrEqual(actionBox.y);

  const aimPoint = { x: padBox.x + padBox.width * 0.92, y: padBox.y + padBox.height * 0.35 };
  expect(await page.evaluate(({ x, y }) => document.elementFromPoint(x, y)?.id, aimPoint)).toBe("freeAimPadV321");
  await page.mouse.click(aimPoint.x, aimPoint.y);
  const frame = await page.evaluate(() => window.__footballLabFreeAimFrameV321);
  expect(frame.x).toBeGreaterThan(1);
  expect(frame.label).toContain("OUTSIDE RIGHT");
  await expect(page.locator("#freeAimCoachV321")).toHaveText("ADD LEFT BEND TO RETURN");
});
