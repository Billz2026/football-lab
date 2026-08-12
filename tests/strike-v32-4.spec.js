import { test, expect } from "@playwright/test";

async function openStrikeSetup(page) {
  await page.goto("/index.html?test=strike-v32-4");
  await expect.poll(
    () => page.evaluate(() => window.__footballLabStrikeV324?.build),
    { timeout: 15000 }
  ).toBe("32.4.0");
  expect(await page.evaluate(() => window.__footballLabStartupError)).toBeNull();

  await page.locator("#playClassic").click();
  await page.locator(".kicker-card").first().click();
  await page.locator("#kickerConfirmV13").click();
  await expect(page.locator("#shotAction")).toHaveText("START SHOT", { timeout: 5000 });
  await page.waitForTimeout(120);
  await page.locator("#shotAction").click();
  await expect(page.locator("#phaseTitle")).toHaveText("PLAN THE STRIKE");
  await expect(page.locator("#strikeConsoleV324")).toBeVisible();
}

async function lockMeter(page, value) {
  await page.evaluate((target) => new Promise((resolve) => {
    const sample = () => {
      if (Math.abs(window.__footballLabExecutionV324?.meterValue() - target) < 0.012) {
        document.querySelector("#shotAction").click();
        resolve();
        return;
      }
      requestAnimationFrame(sample);
    };
    sample();
  }), value);
}

test("Build 32.4 keeps the pitch visible and removes the solved trajectory", async ({ page }) => {
  await openStrikeSetup(page);
  const contract = await page.evaluate(() => window.__footballLabStrikeV324);
  expect(contract).toMatchObject({
    build: "32.4.0",
    livePitchAim: true,
    solvedTrajectory: false,
    automaticRoutes: false,
    twoStopExecution: ["power", "contact"],
    defaultMode: "standard",
    modes: ["guided", "standard", "expert"],
    bounds: { minX: -0.35, maxX: 1.35, minY: -0.3, maxY: 1.15 }
  });
  await expect.poll(
    () => page.evaluate(() => window.__footballLabReleaseV324?.build),
    { timeout: 5000 }
  ).toBe("32.4.0");
  await expect(page.locator("#gameCanvas")).toBeVisible();
  await expect(page.locator("#strikeModeV324 strong")).toHaveText("STANDARD");
  await expect(page.locator("#aimPlannerV322")).toHaveCount(0);
  await expect(page.locator("[data-aim-route]")).toHaveCount(0);
  await expect(page.getByText(/ON TARGET|POST RISK|CROSSBAR RISK|WALL BLOCKED/)).toHaveCount(0);

  const before = await page.evaluate(() => window.__footballLabStrikeFrameV324.target);
  const canvas = await page.locator("#gameCanvas").boundingBox();
  await page.mouse.click(canvas.x + canvas.width * 0.58, canvas.y + canvas.height * 0.48);
  const after = await page.evaluate(() => window.__footballLabStrikeFrameV324.target);
  expect(after).not.toEqual(before);
});

test("target and curl are intentions, then power and contact require separate stops", async ({ page }) => {
  await openStrikeSetup(page);
  await page.evaluate(() => {
    window.__footballLabStrikeV324.setTarget(0.82, 0.16);
    window.__footballLabStrikeV324.setCurve(-0.68);
  });
  await expect(page.locator("#strikeTargetLabelV324")).toContainText("HIGH RIGHT");
  await expect(page.locator("#strikeCurveLabelV324")).toContainText("LEFT WHIP");

  await page.locator("#strikeStartV324").click();
  await expect(page.locator("#phaseTitle")).toHaveText("STOP POWER");
  await lockMeter(page, 0.72);
  await expect(page.locator("#phaseTitle")).toHaveText("STOP CONTACT");
  await expect(page.locator("#contactZoneV324")).toBeVisible();
  await lockMeter(page, 0.5);
  await expect(page.locator("#phaseTitle")).toHaveText("WATCH THE FLIGHT");

  const shot = await page.evaluate(async () => {
    const { state } = await import("/game/core-v6.js?v=32.4");
    return {
      aimX: state.shot.aimX,
      aimY: state.shot.aimY,
      curve: state.shot.curve,
      power: state.shot.power,
      contactQuality: state.shot.contactQuality,
      diagnostics: state.shot.diagnostics
    };
  });
  expect(shot.aimX).toBeCloseTo(0.82, 2);
  expect(shot.aimY).toBeCloseTo(0.16, 2);
  expect(shot.curve).toBeCloseTo(-0.68, 2);
  expect(shot.contactQuality).toBeGreaterThan(0.9);
  expect(shot.diagnostics.contactQuality).toBeGreaterThan(0.9);
});

test("extreme curl and later stages visibly tighten the contact window", async ({ page }) => {
  await openStrikeSetup(page);
  const widths = await page.evaluate(async () => {
    const core = await import("/game/core-v6.js?v=32.4");
    const values = [];
    for (const [stage, curve] of [[0, 0], [0, 1], [29, 1]]) {
      core.state.stage = stage;
      core.syncStage();
      core.state.shot = core.createShot();
      core.state.shot.previewCurve = curve;
      values.push(window.__footballLabExecutionV324.contactWindow());
    }
    return values;
  });
  expect(widths[1]).toBeLessThan(widths[0]);
  expect(widths[2]).toBeLessThan(widths[1]);
  expect(widths[2]).toBeGreaterThanOrEqual(0.052);
});

test("contact timing creates deterministic execution drift instead of random misses", async ({ page }) => {
  await page.goto("/index.html?test=execution-physics-v32-4");
  await expect.poll(() => page.evaluate(() => window.__footballLabStrikeV324?.build), { timeout: 15000 }).toBe("32.4.0");
  const report = await page.evaluate(async () => {
    const core = await import("/game/core-v6.js?v=32.4");
    const physics = await import("/game/runtime-v23-bridge-physics-v19-f1d39f9409.js?v=32.4");
    core.state.stage = 0;
    core.syncStage();
    core.state.stageWind = 0;
    const resolve = (offset, quality) => {
      core.state.shot = {
        ...core.createShot(), power: core.idealPower(), aimX: 0.78, aimY: 0.2,
        curve: 0.65, contactOffset: offset, contactQuality: quality, contactTiming: 0.5 + offset * 0.5,
        contactWindow: 0.1
      };
      physics.resolveShotPhysics();
      return { final: core.state.shot.diagnostics.finalTarget, outcome: core.state.shot.outcome };
    };
    return { early: resolve(-0.65, 0.3), perfect: resolve(0, 1), late: resolve(0.65, 0.3), repeat: resolve(0.65, 0.3) };
  });
  expect(report.early.final.x).toBeLessThan(report.perfect.final.x - 0.25);
  expect(report.late.final.x).toBeGreaterThan(report.perfect.final.x + 0.25);
  expect(report.repeat).toEqual(report.late);
});

test("phone strike controls stay inside the match view and remain touchable", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openStrikeSetup(page);
  const canvas = await page.locator("#gameCanvas").boundingBox();
  const panel = await page.locator("#strikeConsoleV324").boundingBox();
  const strike = await page.locator("#strikeStartV324").boundingBox();
  expect(canvas.width).toBeGreaterThan(330);
  expect(panel.x).toBeGreaterThanOrEqual(0);
  expect(panel.x + panel.width).toBeLessThanOrEqual(390);
  expect(panel.y).toBeGreaterThanOrEqual(canvas.y);
  expect(panel.y + panel.height).toBeLessThanOrEqual(canvas.y + canvas.height + 2);
  expect(strike.y + strike.height).toBeLessThanOrEqual(844);
  const control = await page.locator(".control-panel").boundingBox();
  expect(control.height).toBeLessThan(180);
  await page.locator("#strikeCurveV324").fill("72");
  await expect(page.locator("#strikeCurveLabelV324")).toContainText("RIGHT");
  await page.locator("#strikeStartV324").click();
  await expect(page.locator("#phaseTitle")).toHaveText("STOP POWER");
  const powerButton = await page.locator("#shotAction").boundingBox();
  expect(powerButton.y + powerButton.height).toBeLessThanOrEqual(844);
});

test("every active module URL is cache-busted as Build 32.4", async ({ page }) => {
  const responses = [];
  page.on("response", (response) => {
    const url = response.url();
    if (url.includes("/game/") && url.endsWith(".js?v=32.4")) responses.push(url);
  });
  await page.goto("/index.html?test=cache-v32-4");
  await expect.poll(() => page.evaluate(() => window.__footballLabStrikeV324?.build), { timeout: 15000 }).toBe("32.4.0");
  expect(await page.evaluate(() => window.__footballLabStartupError)).toBeNull();
  expect(responses.length).toBeGreaterThan(15);
  const stale = await page.evaluate(() => performance.getEntriesByType("resource")
    .map((entry) => entry.name)
    .filter((url) => /\/game\/.*\.js\?v=(31|32|32\.1|32\.2|32\.3)$/.test(url)));
  expect(stale).toEqual([]);
});
