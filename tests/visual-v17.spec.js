import { test, expect } from "@playwright/test";

async function startRun(page, viewport = { width: 1180, height: 820 }) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize(viewport);
  await page.goto("/index.html?v=17");
  await expect.poll(() => page.evaluate(() => window.__footballLabMainV17 === true), { timeout: 20000 }).toBe(true);
  await expect.poll(() => page.evaluate(() => window.__footballLabRendererV17 === true), { timeout: 20000 }).toBe(true);
  await expect.poll(() => page.evaluate(() => window.__footballLabVisualV17 === true), { timeout: 20000 }).toBe(true);
  await expect(page.locator("#kickerSelectV13")).toHaveCount(1, { timeout: 15000 });
  await page.locator("#playClassic").click();
  await expect(page.locator("#kickerSelectV13")).toHaveClass(/is-open/);
  await page.locator(".kicker-card").first().click();
  await page.locator("#kickerConfirmV13").click();
  await expect(page.locator("#gameScreen")).toHaveClass(/is-active/);
  await expect(page.locator("#shotAction")).toHaveText(/START SHOT/, { timeout: 6000 });
  await page.waitForTimeout(250);
  return errors;
}

async function canvasSignature(page) {
  return page.evaluate(() => {
    const canvas = document.getElementById("gameCanvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const columns = 12;
    const rows = 8;
    const samples = [];
    let brightness = 0;
    for (let row = 0; row < rows; row += 1) {
      for (let column = 0; column < columns; column += 1) {
        const x = Math.min(canvas.width - 1, Math.round((column + .5) * canvas.width / columns));
        const y = Math.min(canvas.height - 1, Math.round((row + .5) * canvas.height / rows));
        const pixel = context.getImageData(x, y, 1, 1).data;
        samples.push(`${Math.round(pixel[0] / 16)}-${Math.round(pixel[1] / 16)}-${Math.round(pixel[2] / 16)}`);
        brightness += pixel[0] + pixel[1] + pixel[2];
      }
    }
    return {
      unique: new Set(samples).size,
      averageBrightness: brightness / (columns * rows * 3),
      filter: getComputedStyle(canvas).filter,
      visualBuild: document.documentElement.dataset.visualBuild
    };
  });
}

test("V17 boots the cinematic renderer and produces a graded stadium frame", async ({ page }) => {
  const errors = await startRun(page);
  const signature = await canvasSignature(page);

  expect(signature.visualBuild).toBe("17");
  expect(signature.unique).toBeGreaterThan(18);
  expect(signature.averageBrightness).toBeGreaterThan(8);
  expect(signature.filter).toContain("saturate");
  expect(errors).toEqual([]);
});

test("V17 completes an actual three-input shot without breaking the renderer", async ({ page }) => {
  const errors = await startRun(page);
  const action = page.locator("#shotAction");

  await action.click();
  await expect(page.locator("#phaseTitle")).toContainText(/POWER/);
  await page.waitForTimeout(140);
  await action.click();
  await expect(page.locator("#phaseTitle")).toContainText(/PICK|PLACEMENT|SIDE/);
  await page.waitForTimeout(130);
  await action.click();
  await expect(page.locator("#phaseTitle")).toContainText(/ADD|CURVE|BEND/);
  await page.waitForTimeout(130);
  await action.click();
  await expect(page.locator("#phaseTitle")).toContainText(/WATCH|FLIGHT/);
  await page.waitForTimeout(1800);

  await expect.poll(() => page.evaluate(() => window.__footballLabRendererV17 === true)).toBe(true);
  expect(errors).toEqual([]);
});

test("V17 retains the installed-game Fold layout and visible shot button", async ({ page }) => {
  const errors = await startRun(page, { width: 884, height: 1100 });
  const metrics = await page.evaluate(() => {
    const action = document.getElementById("shotAction").getBoundingClientRect();
    const frame = document.querySelector(".game-frame").getBoundingClientRect();
    const controls = document.querySelector(".control-panel").getBoundingClientRect();
    return {
      viewportHeight: window.innerHeight,
      actionBottom: action.bottom,
      frameRight: frame.right,
      controlsLeft: controls.left
    };
  });

  expect(metrics.actionBottom).toBeLessThan(metrics.viewportHeight);
  expect(metrics.controlsLeft).toBeGreaterThanOrEqual(metrics.frameRight - 2);
  expect(errors).toEqual([]);
});
