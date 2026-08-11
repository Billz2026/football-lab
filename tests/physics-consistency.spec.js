import { test, expect } from "@playwright/test";

async function waitForPhysics(page) {
  await page.goto("/index.html");
  await expect.poll(
    () => page.evaluate(() => Boolean(
      window.__footballLabMainV19
      && window.__footballLabPhysicsConsistencyV19
    )),
    { timeout: 5000 }
  ).toBe(true);
}

test("V19 resamples uneven paths by world distance and remaps impact timing", async ({ page }) => {
  await waitForPhysics(page);

  const result = await page.evaluate(async () => {
    const physics = await import("/game/physics-v19.js?v=19");
    const path = [
      { x: 0, y: 0, z: 0 },
      { x: 0.1, y: 0, z: 0 },
      { x: 4, y: 0, z: 0 },
      { x: 7, y: 0, z: 0 }
    ];
    const normalised = physics.normalisePathByDistance(path, 2);
    const lengths = normalised.path.slice(1).map((point, index) => {
      const previous = normalised.path[index];
      return Math.hypot(
        point.x - previous.x,
        point.y - previous.y,
        point.z - previous.z
      );
    });
    const mean = lengths.reduce((sum, value) => sum + value, 0) / lengths.length;
    const maximumDeviationRatio = Math.max(
      ...lengths.map((value) => Math.abs(value - mean) / mean)
    );

    return {
      contract: window.__footballLabPhysicsConsistencyV19,
      samples: normalised.path.length,
      totalDistance: normalised.totalDistance,
      primaryDistance: normalised.primaryDistance,
      impactProgress: normalised.impactProgress,
      impactIndex: normalised.impactIndex,
      impactPoint: normalised.path[normalised.impactIndex],
      maximumDeviationRatio,
      sectionDeviationRatio: normalised.spacing.maximumDeviationRatio
    };
  });

  expect(result.contract).toEqual({
    worldDistanceResampling: true,
    distanceTimedFlight: true,
    collisionIndexRemapping: true,
    keeperTimingAlignment: true,
    minimumSamples: 96,
    maximumSamples: 420
  });
  expect(result.samples).toBe(96);
  expect(result.totalDistance).toBeCloseTo(7, 6);
  expect(result.primaryDistance).toBeCloseTo(4, 6);
  expect(result.impactProgress).toBeCloseTo(4 / 7, 6);
  expect(result.impactIndex).toBe(Math.round((4 / 7) * 95));
  expect(result.impactPoint).toEqual({ x: 4, y: 0, z: 0 });
  expect(result.maximumDeviationRatio).toBeLessThan(0.02);
  expect(result.sectionDeviationRatio).toBeLessThan(0.001);
});

test("V19 produces deterministic finite trajectories for identical live inputs", async ({ page }) => {
  await waitForPhysics(page);

  const comparison = await page.evaluate(async () => {
    const core = await import("/game/core-v6.js?v=32.2");
    const physics = await import("/game/physics-v19.js?v=19");

    function simulate() {
      core.state.stage = 1;
      core.syncStage();
      core.state.stageWind = 0.075;
      core.state.shot = {
        ...core.createShot(),
        power: 0.76,
        aimX: 0.79,
        aimY: 0.27,
        curve: 0.48
      };
      const result = physics.resolveShotPhysics();
      const shot = core.state.shot;
      const finite = shot.path.every((point) => (
        Number.isFinite(point.x)
        && Number.isFinite(point.y)
        && Number.isFinite(point.z)
      ));
      const fingerprint = JSON.stringify({
        outcome: shot.outcome,
        impactIndex: shot.impactIndex,
        impactProgress: shot.impactProgress,
        flightDuration: result.flightDuration,
        target: result.target,
        path: shot.path.map((point) => [
          Number(point.x.toFixed(6)),
          Number(point.y.toFixed(6)),
          Number(point.z.toFixed(6))
        ])
      });
      return {
        fingerprint,
        finite,
        outcome: shot.outcome,
        samples: shot.path.length,
        distance: shot.pathDistanceMetres,
        primaryDistance: shot.primaryDistanceMetres,
        continuationDistance: shot.continuationDistanceMetres,
        impactProgress: shot.impactProgress,
        impactPoint: Number.isInteger(shot.impactIndex)
          ? shot.path[shot.impactIndex]
          : null,
        spacingDeviationRatio: shot.diagnostics.pathSpacingDeviationRatio,
        primarySpacingDeviationRatio: shot.diagnostics.primarySpacingDeviationRatio,
        continuationSpacingDeviationRatio: shot.diagnostics.continuationSpacingDeviationRatio,
        flightDuration: result.flightDuration
      };
    }

    return { first: simulate(), second: simulate() };
  });

  expect(comparison.first.fingerprint).toBe(comparison.second.fingerprint);
  expect(comparison.first.finite).toBe(true);
  expect(comparison.first.samples).toBeGreaterThanOrEqual(96);
  expect(comparison.first.samples).toBeLessThanOrEqual(420);
  expect(comparison.first.distance).toBeGreaterThan(0);
  expect(comparison.first.primaryDistance).toBeGreaterThan(0);
  expect(comparison.first.continuationDistance).toBeGreaterThanOrEqual(0);
  expect(comparison.first.spacingDeviationRatio).toBeLessThan(0.12);
  expect(comparison.first.primarySpacingDeviationRatio).toBeLessThan(0.12);
  expect(comparison.first.continuationSpacingDeviationRatio).toBeLessThan(0.12);
  expect(comparison.first.flightDuration).toBeGreaterThanOrEqual(650);
  expect(comparison.first.flightDuration).toBeLessThanOrEqual(1840);
  if (comparison.first.impactProgress != null) {
    expect(comparison.first.impactProgress).toBeGreaterThanOrEqual(0);
    expect(comparison.first.impactProgress).toBeLessThanOrEqual(1);
    expect(comparison.first.impactPoint).not.toBeNull();
  }
});
