import { test, expect } from "@playwright/test";

async function openHeroKicker(page, viewport = { width: 884, height: 1100 }) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize(viewport);
  await page.goto("/index.html?v=172");
  await expect.poll(() => page.evaluate(() => window.__footballLabMainV172 === true), { timeout: 20000 }).toBe(true);
  await expect.poll(() => page.evaluate(() => window.__footballLabHeroArtV172 === true), { timeout: 20000 }).toBe(true);
  await page.locator("#playClassic").click();
  await expect(page.locator("#kickerSelectV13")).toHaveClass(/is-open/);
  await page.locator(".kicker-card").first().click();
  await page.locator("#kickerConfirmV13").click();
  await expect(page.locator("#gameScreen")).toHaveClass(/is-active/);
  await expect(page.locator("#shotAction")).toHaveText(/START SHOT/, { timeout: 7000 });
  await page.waitForTimeout(1850);
  return errors;
}

async function measureHeroLayers(page) {
  return page.evaluate(() => {
    const canvas = document.getElementById("gameCanvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const { width, height } = canvas;
    const pixels = context.getImageData(0, 0, width, height).data;
    const lime = (r, g, b) => g > 175 && r > 115 && b < 150 && g > b * 1.5;

    let minX = width;
    let maxX = -1;
    let minY = height;
    let maxY = -1;
    let limeCount = 0;
    for (let y = Math.floor(height * 0.45); y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const i = (y * width + x) * 4;
        if (!lime(pixels[i], pixels[i + 1], pixels[i + 2])) continue;
        limeCount += 1;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
    if (limeCount < 40) return { error: "hero jersey not found", limeCount };

    const torsoWidth = maxX - minX + 1;
    const torsoHeight = maxY - minY + 1;
    const centreX = (minX + maxX) / 2;
    const regionLeft = Math.max(0, Math.floor(centreX - torsoWidth * 0.95));
    const regionRight = Math.min(width - 1, Math.ceil(centreX + torsoWidth * 0.95));
    const regionTop = Math.max(0, Math.floor(minY - torsoHeight * 1.1));
    const regionBottom = Math.min(height - 1, Math.ceil(maxY + torsoHeight * 1.35));

    let whiteBootPixels = 0;
    let skinPixels = 0;
    let navyPixels = 0;
    let highlightPixels = 0;
    for (let y = regionTop; y <= regionBottom; y += 1) {
      for (let x = regionLeft; x <= regionRight; x += 1) {
        const i = (y * width + x) * 4;
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        if (y > maxY && r > 205 && g > 210 && b > 200 && Math.max(r, g, b) - Math.min(r, g, b) < 45) whiteBootPixels += 1;
        if (r > 105 && r < 210 && g > 55 && g < 155 && b > 35 && b < 120 && r > g * 1.18) skinPixels += 1;
        if (r < 48 && g < 62 && b < 82 && y > minY) navyPixels += 1;
        if (r > 215 && g > 235 && b < 135 && y >= minY && y <= maxY) highlightPixels += 1;
      }
    }

    return {
      limeCount,
      torso: { minX, maxX, minY, maxY, width: torsoWidth, height: torsoHeight },
      whiteBootPixels,
      skinPixels,
      navyPixels,
      highlightPixels
    };
  });
}

test("V17.2 renders the layered hero kit on the Fold viewport", async ({ page }) => {
  const errors = await openHeroKicker(page);
  const layers = await measureHeroLayers(page);
  expect(layers.error).toBeUndefined();
  expect(layers.torso.width).toBeGreaterThan(30);
  expect(layers.whiteBootPixels).toBeGreaterThan(18);
  expect(layers.skinPixels).toBeGreaterThan(45);
  expect(layers.navyPixels).toBeGreaterThan(90);
  expect(layers.highlightPixels).toBeGreaterThan(12);
  expect(errors).toEqual([]);
});

test("V17.2 hero remains attached through a complete shot", async ({ page }) => {
  const errors = await openHeroKicker(page, { width: 1180, height: 820 });
  const action = page.locator("#shotAction");
  await action.click();
  await page.waitForTimeout(120);
  await action.click();
  await page.waitForTimeout(120);
  await action.click();
  await page.waitForTimeout(120);
  await action.click();
  await expect(page.locator("#phaseTitle")).toContainText(/WATCH|FLIGHT/);
  await page.waitForTimeout(1800);
  await expect.poll(() => page.evaluate(() => window.__footballLabRendererV172 === true)).toBe(true);
  await expect.poll(() => page.evaluate(() => window.__footballLabHeroArtV172 === true)).toBe(true);
  expect(errors).toEqual([]);
});
