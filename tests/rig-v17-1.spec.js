import { test, expect } from "@playwright/test";

async function openFirstKicker(page, viewport = { width: 884, height: 1100 }) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize(viewport);
  await page.goto("/index.html?v=171");
  await expect.poll(() => page.evaluate(() => window.__footballLabMainV171 === true), { timeout: 20000 }).toBe(true);
  await expect.poll(() => page.evaluate(() => window.__footballLabRigV171 === true), { timeout: 20000 }).toBe(true);
  await page.locator("#playClassic").click();
  await expect(page.locator("#kickerSelectV13")).toHaveClass(/is-open/);
  await page.locator(".kicker-card").first().click();
  await page.locator("#kickerConfirmV13").click();
  await expect(page.locator("#gameScreen")).toHaveClass(/is-active/);
  await expect(page.locator("#shotAction")).toHaveText(/START SHOT/, { timeout: 7000 });
  await page.waitForTimeout(1850);
  return errors;
}

async function measureKickerRig(page) {
  return page.evaluate(() => {
    const canvas = document.getElementById("gameCanvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    const { width, height } = canvas;
    const pixels = context.getImageData(0, 0, width, height).data;
    const step = 2;
    const sampleWidth = Math.floor(width / step);
    const sampleHeight = Math.floor(height / step);
    const mask = new Uint8Array(sampleWidth * sampleHeight);

    const lime = (r, g, b) => g > 175 && r > 120 && b < 145 && g > b * 1.65;
    const skin = (r, g, b) => r > 90 && r < 235 && g > 45 && g < 185 && b > 25 && b < 155 && r > g * 1.12 && g > b * 1.08;

    for (let sy = Math.floor(sampleHeight * 0.46); sy < sampleHeight; sy += 1) {
      for (let sx = 0; sx < sampleWidth; sx += 1) {
        const px = sx * step;
        const py = sy * step;
        const index = (py * width + px) * 4;
        if (lime(pixels[index], pixels[index + 1], pixels[index + 2])) {
          mask[sy * sampleWidth + sx] = 1;
        }
      }
    }

    const visited = new Uint8Array(mask.length);
    let largest = null;
    const queueX = new Int32Array(mask.length);
    const queueY = new Int32Array(mask.length);

    for (let sy = Math.floor(sampleHeight * 0.46); sy < sampleHeight; sy += 1) {
      for (let sx = 0; sx < sampleWidth; sx += 1) {
        const start = sy * sampleWidth + sx;
        if (!mask[start] || visited[start]) continue;
        let head = 0;
        let tail = 0;
        queueX[tail] = sx;
        queueY[tail] = sy;
        tail += 1;
        visited[start] = 1;
        let area = 0;
        let minX = sx;
        let maxX = sx;
        let minY = sy;
        let maxY = sy;

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

    if (!largest) return { error: "kicker shirt not found" };
    const torso = {
      left: largest.minX * step,
      right: (largest.maxX + 1) * step,
      top: largest.minY * step,
      bottom: (largest.maxY + 1) * step
    };
    torso.width = torso.right - torso.left;
    torso.height = torso.bottom - torso.top;
    const centreX = (torso.left + torso.right) / 2;
    const searchLeft = Math.max(0, Math.floor(centreX - torso.width * 0.34));
    const searchRight = Math.min(width - 1, Math.ceil(centreX + torso.width * 0.34));
    const searchTop = Math.max(0, Math.floor(torso.top - torso.height * 1.25));
    const searchBottom = Math.max(searchTop, Math.floor(torso.top - 1));
    let skinMinX = width;
    let skinMaxX = -1;
    let skinMinY = height;
    let skinMaxY = -1;
    let skinCount = 0;

    for (let y = searchTop; y <= searchBottom; y += 1) {
      for (let x = searchLeft; x <= searchRight; x += 1) {
        const index = (y * width + x) * 4;
        if (!skin(pixels[index], pixels[index + 1], pixels[index + 2])) continue;
        skinCount += 1;
        skinMinX = Math.min(skinMinX, x);
        skinMaxX = Math.max(skinMaxX, x);
        skinMinY = Math.min(skinMinY, y);
        skinMaxY = Math.max(skinMaxY, y);
      }
    }

    if (!skinCount) return { error: "kicker head not found", torso };
    return {
      torso,
      head: {
        left: skinMinX,
        right: skinMaxX,
        top: skinMinY,
        bottom: skinMaxY,
        width: skinMaxX - skinMinX + 1,
        height: skinMaxY - skinMinY + 1,
        pixels: skinCount
      },
      gap: torso.top - skinMaxY,
      gapRatio: (torso.top - skinMaxY) / Math.max(1, torso.height)
    };
  });
}

test("V17.1 keeps the kicker head attached to the torso on Fold layout", async ({ page }) => {
  const errors = await openFirstKicker(page);
  const rig = await measureKickerRig(page);

  expect(rig.error).toBeUndefined();
  expect(rig.torso.width).toBeGreaterThan(25);
  expect(rig.head.pixels).toBeGreaterThan(20);
  expect(rig.head.width).toBeLessThan(rig.torso.width * 0.9);
  expect(rig.gapRatio).toBeLessThan(0.25);
  expect(errors).toEqual([]);
});

test("V17.1 completes a shot with the repaired shared rig", async ({ page }) => {
  const errors = await openFirstKicker(page, { width: 1180, height: 820 });
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
  await expect.poll(() => page.evaluate(() => window.__footballLabRigV171 === true)).toBe(true);
  expect(errors).toEqual([]);
});
