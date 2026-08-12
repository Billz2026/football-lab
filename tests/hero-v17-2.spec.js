import { test, expect } from "@playwright/test";

async function openHeroKicker(page, viewport = { width: 884, height: 1100 }) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize(viewport);
  await page.goto("/index.html?v=172");
  await expect.poll(() => page.evaluate(() => window.__footballLabMainV172 === true), { timeout: 20000 }).toBe(true);
  await page.locator("#playClassic").click();
  await expect(page.locator("#kickerSelectV13")).toHaveClass(/is-open/);
  await page.locator(".kicker-card").first().click();
  await page.locator("#kickerConfirmV13").click();
  await expect(page.locator("#gameScreen")).toHaveClass(/is-active/);
  await expect(page.locator("#shotAction")).toHaveText(/START SHOT/, { timeout: 7000 });
  await expect.poll(() => page.evaluate(() => window.__footballLabVisibleKickersV30?.total), { timeout: 7000 }).toBe(1);
  await page.waitForTimeout(1850);
  return errors;
}

async function measureHeroLayers(page) {
  return page.evaluate(() => {
    const canvas = document.getElementById("gameCanvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const { width, height } = canvas;
    const pixels = context.getImageData(0, 0, width, height).data;
    const step = 2;
    const sampleWidth = Math.floor(width / step);
    const sampleHeight = Math.floor(height / step);
    const mask = new Uint8Array(sampleWidth * sampleHeight);
    const lime = (r, g, b) => g > 135 && r > 70 && b < 165 && g > b * 1.22 && g > r * 0.82;

    for (let sy = Math.floor(sampleHeight * 0.46); sy < sampleHeight; sy += 1) {
      for (let sx = 0; sx < sampleWidth; sx += 1) {
        const x = sx * step;
        const y = sy * step;
        const i = (y * width + x) * 4;
        if (lime(pixels[i], pixels[i + 1], pixels[i + 2])) mask[sy * sampleWidth + sx] = 1;
      }
    }

    const visited = new Uint8Array(mask.length);
    const queueX = new Int32Array(mask.length);
    const queueY = new Int32Array(mask.length);
    let largest = null;

    for (let sy = Math.floor(sampleHeight * 0.46); sy < sampleHeight; sy += 1) {
      for (let sx = 0; sx < sampleWidth; sx += 1) {
        const start = sy * sampleWidth + sx;
        if (!mask[start] || visited[start]) continue;
        let head = 0;
        let tail = 0;
        let area = 0;
        let minX = sx;
        let maxX = sx;
        let minY = sy;
        let maxY = sy;
        queueX[tail] = sx;
        queueY[tail] = sy;
        tail += 1;
        visited[start] = 1;

        while (head < tail) {
          const x = queueX[head];
          const y = queueY[head];
          head += 1;
          area += 1;
          minX = Math.min(minX, x);
          maxX = Math.max(maxX, x);
          minY = Math.min(minY, y);
          maxY = Math.max(maxY, y);
          const neighbours = [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]];
          for (const [nx, ny] of neighbours) {
            if (nx < 0 || ny < 0 || nx >= sampleWidth || ny >= sampleHeight) continue;
            const next = ny * sampleWidth + nx;
            if (!mask[next] || visited[next]) continue;
            visited[next] = 1;
            queueX[tail] = nx;
            queueY[tail] = ny;
            tail += 1;
          }
        }

        if (!largest || area > largest.area) largest = { area, minX, maxX, minY, maxY };
      }
    }

    if (!largest || largest.area < 20) return { error: "hero jersey not found", largest };
    const torso = {
      left: largest.minX * step,
      right: (largest.maxX + 1) * step,
      top: largest.minY * step,
      bottom: (largest.maxY + 1) * step,
      pixels: largest.area
    };
    torso.width = torso.right - torso.left;
    torso.height = torso.bottom - torso.top;

    const centreX = (torso.left + torso.right) / 2;
    const regionLeft = Math.max(0, Math.floor(centreX - torso.width * 1.45));
    const regionRight = Math.min(width - 1, Math.ceil(centreX + torso.width * 1.45));
    const regionTop = Math.max(0, Math.floor(torso.top - torso.height * 1.2));
    const regionBottom = Math.min(height - 1, Math.ceil(torso.bottom + torso.height * 2.1));
    const bootStart = torso.bottom + torso.height * 0.65;

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
        if (y > bootStart && r > 185 && g > 190 && b > 180 && Math.max(r, g, b) - Math.min(r, g, b) < 70) whiteBootPixels += 1;
        if (r > 95 && r < 215 && g > 45 && g < 165 && b > 25 && b < 130 && r > g * 1.12) skinPixels += 1;
        if (r < 52 && g < 68 && b < 90 && y > torso.top) navyPixels += 1;
        if (r > 205 && g > 225 && b < 150 && y >= torso.top && y <= torso.bottom) highlightPixels += 1;
      }
    }

    return { torso, whiteBootPixels, skinPixels, navyPixels, highlightPixels };
  });
}

test("V17.2 renders one layered hero on the Fold viewport", async ({ page }) => {
  const errors = await openHeroKicker(page);
  const hero = await page.evaluate(() => ({
    visible: window.__footballLabVisibleKickersV30,
    frame: window.__footballLabHeroFrameV30,
    motion: window.__footballLabMotionSnapshotV173
  }));
  expect(hero.visible).toMatchObject({ base: 0, hero: 1, total: 1, character: "dax-ryder" });
  expect(hero.frame).toMatchObject({ character: "dax-ryder", active: true });
  expect(Number.isFinite(hero.motion.world.x)).toBe(true);
  expect(Number.isFinite(hero.motion.leftAnkle.y)).toBe(true);
  expect(errors).toEqual([]);
});

test("V17.2 hero remains attached through a complete shot", async ({ page }) => {
  const errors = await openHeroKicker(page, { width: 1180, height: 820 });
  const action = page.locator("#shotAction");
  await action.click();
  await page.waitForTimeout(120);
  await page.locator("#strikeStartV324").click();
  await page.waitForTimeout(120);
  await action.click();
  await page.waitForTimeout(120);
  await action.click();
  await expect(page.locator("#phaseTitle")).toContainText(/WATCH|FLIGHT/);
  await page.waitForTimeout(1800);
  await expect.poll(() => page.evaluate(() => window.__footballLabRendererV172 === true)).toBe(true);
  await expect.poll(() => page.evaluate(() => window.__footballLabHeroFrameV30?.active === true)).toBe(true);
  expect(errors).toEqual([]);
});
