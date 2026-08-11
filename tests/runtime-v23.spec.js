import { test, expect } from "@playwright/test";

const FORBIDDEN_RUNTIME_PATHS = [
  "/game/main-v18.js",
  "/game/main-v15-2.js",
  "/game/main-v11-3.js",
  "/game/physics-v15.js",
  "/game/render-v17-v1731.js",
  "/game/render-v15-v1731.js",
  "/game/render-v17-1-base-v1731.js",
  "/game/hero-kicker-v17-3-1.js"
];

test("V23 boots from static modules without browser-time source execution", async ({ page }) => {
  const errors = [];
  const requestedPaths = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("request", (request) => {
    requestedPaths.push(new URL(request.url()).pathname);
  });

  await page.addInitScript(() => {
    window.__footballLabJavascriptBlobCountV23 = 0;
    const originalCreateObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = function monitoredCreateObjectURL(value) {
      if (value instanceof Blob && /javascript|ecmascript/i.test(value.type || "")) {
        window.__footballLabJavascriptBlobCountV23 += 1;
      }
      return originalCreateObjectURL(value);
    };
  });

  await page.goto("/index.html");
  await page.waitForFunction(() => window.__footballLabReleaseV23?.build === "23.0.0", null, {
    timeout: 20000
  });

  const runtime = await page.evaluate(() => ({
    generated: window.__footballLabRuntimeV23,
    release: window.__footballLabReleaseV23,
    captureMode: window.__footballLabRuntimeCaptureMode,
    javascriptBlobCount: window.__footballLabJavascriptBlobCountV23,
    startupError: window.__footballLabStartupError
  }));

  expect(runtime.generated).toMatchObject({ staticModules: true });
  expect(runtime.release).toEqual({
    build: "23.0.0",
    runtime: "static-es-modules",
    legacySourceExecution: false
  });
  expect(runtime.captureMode).toBe(false);
  expect(runtime.javascriptBlobCount).toBe(0);
  expect(runtime.startupError).toBeNull();
  expect(requestedPaths.some((value) => value.endsWith("/game/runtime-v23-main.js"))).toBe(true);
  for (const forbidden of FORBIDDEN_RUNTIME_PATHS) {
    expect(requestedPaths.some((value) => value.endsWith(forbidden)), forbidden).toBe(false);
  }
  expect(errors).toEqual([]);
});

test("V23 static runtime preserves the playable five-life flow", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem("footballLabTutorialV22", "complete");
  });

  await page.goto("/index.html");
  await page.waitForFunction(() => window.__footballLabReleaseV23?.build === "23.0.0", null, {
    timeout: 20000
  });
  await page.locator("#playClassic").click();
  await expect(page.locator("#kickerSelectV13")).toHaveClass(/is-open/);
  await page.locator(".kicker-card").first().click();
  await page.locator("#kickerConfirmV13").click();
  await expect(page.locator("#gameScreen")).toHaveClass(/is-active/);
  await expect(page.locator("#livesValue")).toContainText("● ● ● ● ●");
  await expect(page.locator("#shotAction")).toHaveText("START SHOT", { timeout: 5000 });

  await page.locator("#shotAction").click();
  await expect(page.locator("#phaseTitle")).toHaveText("SET POWER");
  await page.waitForTimeout(90);
  await page.locator("#shotAction").click();
  await expect(page.locator("#phaseTitle")).toHaveText("AIM SHOT");
  await page.waitForTimeout(90);
  await expect(page.locator("#aimPlannerV322")).toBeVisible();

  const contracts = await page.evaluate(() => ({
    main: window.__footballLabMainV19,
    fastFlow: window.__footballLabFastFlowV174,
    precision: window.__footballLabInputPrecisionV18,
    physics: window.__footballLabPhysicsRouteV19,
    renderer: window.__footballLabRendererV1731
  }));
  expect(contracts.main).toBe(true);
  expect(contracts.fastFlow.stageIntroMs).toBe(700);
  expect(contracts.precision.eventTimeSampling).toBe(true);
  expect(contracts.physics.worldDistanceResampling).toBe(true);
  expect(contracts.renderer).toBe(true);
  expect(errors).toEqual([]);
});
