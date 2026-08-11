import { test, expect } from "@playwright/test";

async function openAimPlanner(page) {
  await page.goto("/index.html?test=aiming-v32-2");
  await expect.poll(
    () => page.evaluate(() => window.__footballLabAimingV322?.build),
    { timeout: 15000 }
  ).toBe("32.2.0");
  expect(await page.evaluate(() => window.__footballLabStartupError)).toBeNull();

  await page.locator("#playClassic").click();
  await page.locator(".kicker-card").first().click();
  await page.locator("#kickerConfirmV13").click();
  await expect(page.locator("#shotAction")).toHaveText("START SHOT", { timeout: 5000 });
  await page.waitForTimeout(120);
  await page.locator("#shotAction").click();
  await expect(page.locator("#phaseTitle")).toHaveText("SET POWER");
  await page.waitForTimeout(180);
  await page.locator("#shotAction").click();
  await expect(page.locator("#phaseTitle")).toHaveText("AIM SHOT");
  await expect(page.locator("#aimPlannerV322")).toBeVisible();
}

test("Build 32.2 presents one obvious direct aiming flow", async ({ page }) => {
  await openAimPlanner(page);

  const contract = await page.evaluate(() => window.__footballLabAimingV322);
  expect(contract).toMatchObject({
    build: "32.2.0",
    directGoalAim: true,
    targetMeansFinish: true,
    curveChangesRouteOnly: true,
    exactWallPreview: true,
    quickRoutes: ["over", "left", "right"],
    mobileFullScreenPlanner: true,
    bounds: { minX: -0.35, maxX: 1.35, minY: -0.3, maxY: 1.15 }
  });
  await expect.poll(
    () => page.evaluate(() => window.__footballLabReleaseV322?.build),
    { timeout: 5000 }
  ).toBe("32.2.0");

  await expect(page.locator("#aimTakeShotV322")).toContainText("TAKE FREE KICK");
  await expect(page.locator("[data-aim-route='over']")).toBeVisible();
  await expect(page.locator("[data-aim-route='left']")).toBeVisible();
  await expect(page.locator("[data-aim-route='right']")).toBeVisible();
  await expect(page.locator(".meter-wrap")).toBeHidden();

  const frame = await page.evaluate(() => window.__footballLabAimFrameV322);
  expect(frame.active).toBe(true);
  expect(frame.route).toBe("over");
  expect(frame.outcome).not.toBe("WALL");
  expect(frame.wallLane).toBe("OVER");
});

test("target remains the intended finish while bend changes the flight route", async ({ page }) => {
  await page.goto("/index.html?test=aiming-physics-v32-2");
  await expect.poll(
    () => page.evaluate(() => window.__footballLabAimingV322?.build),
    { timeout: 15000 }
  ).toBe("32.2.0");

  const result = await page.evaluate(async () => {
    const core = await import("/game/core-v6.js?v=32.2");
    const physics = await import("/game/runtime-v23-bridge-physics-v19-f1d39f9409.js?v=32.2");
    core.state.stage = 0;
    core.syncStage();
    core.state.stageWind = 0;
    const power = core.idealPower();
    const shots = [-1, 0, 1].map((curve) => physics.previewShotPhysics({
      power,
      aimX: 0.78,
      aimY: 0.2,
      curve
    }));
    return shots.map((shot) => ({
      final: shot.diagnostics.finalTarget,
      midpoint: shot.path[Math.floor(shot.path.length * 0.55)],
      outcome: shot.outcome
    }));
  });

  expect(Math.abs(result[0].final.x - result[1].final.x)).toBeLessThan(0.03);
  expect(Math.abs(result[2].final.x - result[1].final.x)).toBeLessThan(0.03);
  expect(result[0].midpoint.x).toBeLessThan(result[1].midpoint.x - 0.6);
  expect(result[2].midpoint.x).toBeGreaterThan(result[1].midpoint.x + 0.6);
});

test("around-wall presets visibly choose a clear lateral route", async ({ page }) => {
  await openAimPlanner(page);
  await page.locator("[data-aim-route='left']").click();
  await expect(page.locator("[data-aim-route='left']")).toHaveClass(/is-active/);

  const left = await page.evaluate(() => window.__footballLabAimFrameV322);
  expect(left.route).toBe("left");
  expect(left.curve).toBeLessThan(-0.6);
  expect(left.outcome).not.toBe("WALL");
  expect(left.wallLane).toBe("AROUND");
  expect(left.finalTarget.x).toBeGreaterThan(-3.66);
  expect(left.finalTarget.x).toBeLessThan(3.66);

  await page.locator("[data-aim-route='right']").click();
  const right = await page.evaluate(() => window.__footballLabAimFrameV322);
  expect(right.route).toBe("right");
  expect(right.curve).toBeGreaterThan(0.6);
  expect(right.outcome).not.toBe("WALL");
  expect(right.wallLane).toBe("AROUND");
});

test("all 30 campaign stages keep an overhead and lateral wall solution", async ({ page }) => {
  await page.goto("/index.html?test=aiming-balance-v32-2");
  await expect.poll(
    () => page.evaluate(() => window.__footballLabAimingV322?.build),
    { timeout: 15000 }
  ).toBe("32.2.0");

  const stages = await page.evaluate(async () => {
    const core = await import("/game/core-v6.js?v=32.2");
    core.state.screen = "game";
    core.state.phase = "aim";
    core.state.stageWind = 0;
    const report = [];
    for (let stage = 0; stage < 30; stage += 1) {
      core.state.stage = stage;
      core.syncStage();
      const routes = {};
      for (const route of ["over", "left", "right"]) {
        core.state.shot = core.createShot();
        core.state.shot.power = core.idealPower();
        window.__footballLabAimingV322.chooseRoute(route);
        routes[route] = { ...window.__footballLabAimFrameV322 };
      }
      report.push(routes);
    }
    return report;
  });

  stages.forEach((routes) => {
    expect(routes.over.outcome).not.toBe("WALL");
    expect(routes.over.wallLane).toBe("OVER");
    expect(routes.over.finalTarget.y).toBeGreaterThan(0.08);
    expect(routes.over.finalTarget.y).toBeLessThan(2.36);
    expect([routes.left, routes.right].some(
      (route) => route.outcome !== "WALL" && route.wallLane === "AROUND"
    )).toBe(true);
  });
});

test("manual aim keeps all angles and takes the shot without a hidden curve meter", async ({ page }) => {
  await openAimPlanner(page);
  const surface = page.locator("#aimSurfaceV322");
  const box = await surface.boundingBox();
  await surface.click({ position: { x: box.width * 0.04, y: box.height * 0.17 } });
  const outside = await page.evaluate(() => window.__footballLabAimFrameV322);
  expect(outside.target.x).toBeLessThan(0);
  expect(outside.target.y).toBeLessThan(0);
  expect(outside.route).toBe("manual");

  await page.locator("[data-aim-route='right']").click();
  await page.locator("#aimTakeShotV322").click();
  await expect(page.locator("#phaseTitle")).toHaveText("WATCH THE FLIGHT");
  expect(await page.evaluate(() => window.__footballLabStartupError)).toBeNull();
});

test("phone planner is full-screen, touchable and keeps the action visible", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openAimPlanner(page);

  const planner = page.locator("#aimPlannerV322");
  const surface = page.locator("#aimSurfaceV322");
  const action = page.locator("#aimTakeShotV322");
  const plannerBox = await planner.boundingBox();
  const surfaceBox = await surface.boundingBox();
  const actionBox = await action.boundingBox();

  expect(plannerBox.x).toBeGreaterThanOrEqual(0);
  expect(plannerBox.x + plannerBox.width).toBeLessThanOrEqual(390);
  expect(plannerBox.height).toBeGreaterThan(800);
  expect(surfaceBox.width).toBeGreaterThan(320);
  expect(actionBox.y + actionBox.height).toBeLessThanOrEqual(844);

  await surface.click({ position: { x: surfaceBox.width * 0.92, y: surfaceBox.height * 0.3 } });
  const frame = await page.evaluate(() => window.__footballLabAimFrameV322);
  expect(frame.target.x).toBeGreaterThan(1);
  const targetLabelBox = await page.locator("#aimTargetLabelV322").boundingBox();
  expect(targetLabelBox.x).toBeGreaterThanOrEqual(0);
  expect(targetLabelBox.x + targetLabelBox.width).toBeLessThanOrEqual(390);
});

test("every active module URL is cache-busted as Build 32.2", async ({ page }) => {
  const responses = [];
  page.on("response", (response) => {
    const url = response.url();
    if (url.includes("/game/") && url.endsWith(".js?v=32.2")) responses.push(url);
  });
  await page.goto("/index.html?test=cache-v32-2");
  await expect.poll(
    () => page.evaluate(() => window.__footballLabAimingV322?.build),
    { timeout: 15000 }
  ).toBe("32.2.0");
  expect(await page.evaluate(() => window.__footballLabStartupError)).toBeNull();
  expect(responses.length).toBeGreaterThan(15);
  const stale = await page.evaluate(() => performance.getEntriesByType("resource")
    .map((entry) => entry.name)
    .filter((url) => /\/game\/.*\.js\?v=(31|32|32\.1)$/.test(url)));
  expect(stale).toEqual([]);
});
