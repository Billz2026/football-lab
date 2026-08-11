import { test, expect } from "@playwright/test";

function collectRuntimeErrors(page) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  return errors;
}

async function startMatch(page) {
  await page.goto("/index.html?test=matchday-v32");
  await expect.poll(
    () => page.evaluate(() => window.__footballLabMatchdayV32?.build),
    { timeout: 12000 }
  ).toBe("32.0.0");
  await page.locator("#playClassic").click();
  await page.locator(".kicker-card").first().click();
  await page.locator("#kickerConfirmV13").click();
  await expect(page.locator("#gameScreen")).toHaveClass(/is-active/);
  await expect(page.locator("#shotAction")).toHaveText("START SHOT", { timeout: 4000 });
}

test("V32 exposes the complete Matchday Impact contract", async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await page.goto("/index.html?test=matchday-v32-contract");
  await expect.poll(
    () => page.evaluate(() => window.__footballLabMatchdayV32?.build),
    { timeout: 12000 }
  ).toBe("32.0.0");

  const contract = await page.evaluate(() => window.__footballLabMatchdayV32);
  expect(contract.keeperMotions).toEqual(["DIVE", "CATCH", "PARRY", "RECOVERY"]);
  expect(contract.localNetPhysics).toBe(true);
  expect(contract.ballFollowCamera).toBe(true);
  expect(contract.reactiveCrowd).toBe(true);
  expect(contract.layeredAudio).toBe(true);
  expect(contract.specialistReactions).toBe(true);
  expect(contract.chapterMoments).toBe(true);
  expect(contract.closeBallFollow).toBe(true);
  expect(contract.outcomeCallouts).toBe(true);
  expect(contract.readableFlightTiming).toBe(true);
  expect(contract.reducedMotionAware).toBe(true);
  expect(await page.evaluate(() => window.__footballLabAudioV32)).toEqual({
    layered: true,
    crowdReactive: true,
    stereoImpact: true
  });
  expect(errors).toEqual([]);
});

test("V32 completes a real shot with ball-follow presentation and no runtime errors", async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await startMatch(page);

  for (const phase of ["SET POWER", "AIM SHOT"]) {
    await page.locator("#shotAction").click();
    await expect(page.locator("#phaseTitle")).toHaveText(phase);
    await page.waitForTimeout(110);
  }
  await page.locator("#aimTakeShotV322").click();
  await expect(page.locator("#phaseTitle")).toHaveText("WATCH THE FLIGHT");
  await expect.poll(
    () => page.evaluate(() => window.__footballLabCameraV32?.ballFollow),
    { timeout: 4000 }
  ).toBe(true);
  expect(await page.evaluate(() => window.__footballLabCameraV32?.closeFollow)).toBe(true);
  await expect(page.locator("#shotAction")).toHaveText(/START SHOT|START NEXT STAGE/, { timeout: 8000 });
  expect(await page.evaluate(() => window.__footballLabWallMotionV32?.reactive)).toBe(true);
  expect(await page.evaluate(() => window.__footballLabNetV32?.localised)).toBe(true);
  expect(errors).toEqual([]);
});

test("V32 renders catch recovery and chapter-complete presentation states", async ({ page }) => {
  const errors = collectRuntimeErrors(page);
  await startMatch(page);

  await page.evaluate(async () => {
    const { state } = await import("/game/core-v6.js?v=32.3");
    const startedAt = performance.now() - 1150;
    state.shot = {
      ...state.shot,
      outcome: "SAVE",
      saveType: "CATCH",
      speedMps: 30,
      impactIndex: 2,
      path: [
        { x: 0, y: 0.1, z: 7 },
        { x: 0.2, y: 0.8, z: 3.5 },
        { x: 0.42, y: 1.25, z: 0 }
      ],
      keeperPlan: {
        reaction: 0.18,
        flightSeconds: 2,
        start: { x: 0, y: 0, z: 0.08 },
        contact: { x: 0.42, y: 1.25, z: 0 }
      }
    };
    state.animation = {
      id: "v32-catch-test",
      startedAt,
      runUpDuration: 1,
      contactHoldDuration: 0,
      flightDuration: 2000,
      settleDuration: 800,
      totalDuration: 4000,
      impactPlayed: true,
      isReplay: false
    };
  });

  await expect.poll(
    () => page.evaluate(() => window.__footballLabKeeperMotionV32?.motion),
    { timeout: 3000 }
  ).toBe("CATCH");

  await page.evaluate(async () => {
    const { state } = await import("/game/core-v6.js?v=32.3");
    state.animation = null;
    state.presentation = {
      phase: "chapter-complete",
      startedAt: performance.now(),
      chapterNumber: 1,
      chapterName: "FIRST TOUCH",
      venue: "FOUNDATION GROUND",
      scoreLabel: "5,000 PTS"
    };
  });
  await expect.poll(
    () => page.evaluate(() => window.__footballLabMatchdayFrameV32?.chapterMoment),
    { timeout: 3000 }
  ).toBe(true);
  expect(errors).toEqual([]);
});
