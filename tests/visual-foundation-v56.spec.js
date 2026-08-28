import { test, expect } from "@playwright/test";
import { loadGameplay } from "./helpers/load-gameplay.js";

async function startClassic(page) {
  await page.goto("/index.html?test=v56-visual-foundation");
  await loadGameplay(page);
  await expect.poll(
    () => page.evaluate(() => window.__footballLabVisualFoundationV56?.build),
    { timeout: 15000 }
  ).toBe("56.0.0");
  await page.locator("#classicCard").click();
  await page.locator(".kicker-card").first().click();
  await page.locator("#kickerConfirmV13").click();
  await expect(page.locator("#gameScreen")).toHaveClass(/is-active/);
}

test("V56 exposes the premium broadcast scene without changing gameplay", async ({ page }) => {
  await startClassic(page);

  const state = await page.evaluate(() => ({
    visual: window.__footballLabVisualFoundationV56,
    release: window.__footballLabReleaseV520,
    camera: window.__footballLabCameraV32,
    pitch: window.__footballLabPitchV401,
    net: window.__footballLabNetV32
  }));

  expect(state.visual).toMatchObject({
    build: "56.0.0",
    scene: "premium-broadcast-material-pass",
    stadium: "atmospheric-bowl-structure-and-led-ribbons",
    pitch: "clipped-broadcast-sheen-and-pitch-edge-definition",
    goal: "shaded-interior-metal-finish-and-post-caps",
    physicsChanged: false,
    outcomesChanged: false
  });
  expect(state.release.visualFoundation).toBe("v56-premium-broadcast-scene-pass");
  expect(state.camera.impactHoldThroughSettle).toBe(true);
  expect(state.pitch.quality).toMatch(/full|fold-mobile/);
  expect(state.net.localised).toBe(true);
});

test("V56 keeps Training Ground on the shared broadcast scene", async ({ page }) => {
  await page.goto("/index.html?test=v56-training-visual-foundation");
  await loadGameplay(page);
  await page.locator("#trainingCardV35").click();
  await expect(page.locator("#trainingModalV35")).toHaveClass(/is-open/);
  await page.locator(".training-activity-v35").first().click();
  await expect.poll(
    () => page.evaluate(() => window.__footballLabVisualFoundationV56?.scene),
    { timeout: 15000 }
  ).toBe("premium-broadcast-material-pass");
});
