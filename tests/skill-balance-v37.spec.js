import { test, expect } from "@playwright/test";
import { loadGameplay } from "./helpers/load-gameplay.js";

async function waitForV37(page) {
  await page.goto("/index.html");
  await loadGameplay(page);
  await expect.poll(
    () => page.evaluate(() => Boolean(window.__footballLabSkillBalanceV37)),
    { timeout: 5000 }
  ).toBe(true);
}

test("V37 keeps perfect execution close to the intended target", async ({ page }) => {
  await waitForV37(page);

  const result = await page.evaluate(async () => {
    const core = await import("/game/core-v6.js?v=32.4");
    core.state.stage = 0;
    core.syncStage();
    core.state.controlMode = "standard";
    return window.__footballLabSkillBalanceV37.preview({
      aimX: 0.82,
      aimY: 0.19,
      power: core.idealPower(),
      contactQuality: 1,
      contactOffset: 0,
      curve: 0.42
    });
  });

  expect(result.executionAimX).toBeCloseTo(result.intendedAimX, 5);
  expect(result.executionAimY).toBeCloseTo(result.intendedAimY, 5);
  expect(result.severity).toBeLessThan(0.01);
});

test("V37 magnifies poor execution with curl and distance without RNG", async ({ page }) => {
  await waitForV37(page);

  const result = await page.evaluate(async () => {
    const core = await import("/game/core-v6.js?v=32.4");
    core.state.stage = 14;
    core.syncStage();
    core.state.controlMode = "standard";

    const inputs = {
      aimX: 0.82,
      aimY: 0.19,
      power: Math.min(1, core.idealPower() + 0.22),
      contactQuality: 0.36,
      contactOffset: 0.72,
      curve: 0.88
    };

    const first = window.__footballLabSkillBalanceV37.preview(inputs);
    const second = window.__footballLabSkillBalanceV37.preview(inputs);
    return { first, second };
  });

  expect(result.first.executionAimX).toBe(result.second.executionAimX);
  expect(result.first.executionAimY).toBe(result.second.executionAimY);
  expect(result.first.severity).toBeGreaterThan(0.45);
  expect(Math.abs(result.first.executionAimX - result.first.intendedAimX)).toBeGreaterThan(0.035);
  expect(result.first.rng).toBeUndefined();
});

test("V37 guided mode is more forgiving than expert mode", async ({ page }) => {
  await waitForV37(page);

  const comparison = await page.evaluate(async () => {
    const core = await import("/game/core-v6.js?v=32.4");
    core.state.stage = 10;
    core.syncStage();
    const inputs = {
      aimX: 0.2,
      aimY: 0.25,
      power: core.idealPower() - 0.18,
      contactQuality: 0.48,
      contactOffset: -0.62,
      curve: -0.76
    };
    core.state.controlMode = "guided";
    const guided = window.__footballLabSkillBalanceV37.preview(inputs);
    core.state.controlMode = "expert";
    const expert = window.__footballLabSkillBalanceV37.preview(inputs);
    return { guided, expert };
  });

  const guidedError = Math.hypot(
    comparison.guided.executionAimX - comparison.guided.intendedAimX,
    comparison.guided.executionAimY - comparison.guided.intendedAimY
  );
  const expertError = Math.hypot(
    comparison.expert.executionAimX - comparison.expert.intendedAimX,
    comparison.expert.executionAimY - comparison.expert.intendedAimY
  );

  expect(expertError).toBeGreaterThan(guidedError);
});
