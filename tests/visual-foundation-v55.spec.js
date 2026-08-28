import { test, expect } from "@playwright/test";
import { loadGameplay } from "./helpers/load-gameplay.js";

async function startClassic(page) {
  await page.goto("/index.html?test=v55-visual-foundation");
  await loadGameplay(page);
  await expect.poll(
    () => page.evaluate(() => window.__footballLabVisualFoundationV55?.build),
    { timeout: 15000 }
  ).toBe("55.0.0");
  await page.locator("#classicCard").click();
  await page.locator(".kicker-card").first().click();
  await page.locator("#kickerConfirmV13").click();
  await expect(page.locator("#gameScreen")).toHaveClass(/is-active/);
}

test("V55 exposes the shared visual foundation without changing gameplay rules", async ({ page }) => {
  await startClassic(page);

  const contract = await page.evaluate(() => ({
    visual: window.__footballLabVisualFoundationV55,
    camera: window.__footballLabCameraV32,
    pitch: window.__footballLabPitchV401,
    net: window.__footballLabNetV32,
    kickers: window.__footballLabVisibleKickersV30
  }));

  expect(contract.visual).toMatchObject({
    build: "55.0.0",
    scene: "shared-training-and-classic-free-kick",
    stadium: "broadcast-depth-fascia-and-edge-light",
    pitch: "cross-cut-turf-with-perspective-cuts",
    goal: "volumetric-frame-net-and-rear-uprights",
    ball: "grounded-match-ball-shadow-and-existing-panel-renderer",
    physicsChanged: false,
    outcomesChanged: false
  });
  expect(contract.pitch.quality).toMatch(/full|fold-mobile/);
  expect(contract.net.localised).toBe(true);
  expect(contract.kickers.total).toBe(1);
  expect(contract.camera.impactHoldThroughSettle).toBe(true);
});

test("V55 keeps the Training Ground on the same visual foundation", async ({ page }) => {
  await page.goto("/index.html?test=v55-training-visual-foundation");
  await loadGameplay(page);
  await page.locator("#trainingCardV35").click();
  await expect(page.locator("#trainingModalV35")).toHaveClass(/is-open/);
  await page.locator(".training-activity-v35").first().click();
  await expect.poll(
    () => page.evaluate(() => window.__footballLabVisualFoundationV55?.scene),
    { timeout: 15000 }
  ).toBe("shared-training-and-classic-free-kick");
});
