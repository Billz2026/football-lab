import { test, expect } from "@playwright/test";

async function startClassicRun(page) {
  await page.goto("/index.html");
  await page.locator("#classicCard").click();
  await expect(page.locator("#kickerSelectV13")).toHaveCount(1, { timeout: 15000 });
  await expect(page.locator("#kickerSelectV13")).toHaveClass(/is-open/);
  await page.locator(".kicker-card").first().click();
  await page.locator("#kickerConfirmV13").click();
  await expect(page.locator("#gameScreen")).toHaveClass(/is-active/);
  await expect(page.locator("body")).toHaveClass(/is-game-active/);
  await expect.poll(async () => page.evaluate(() => Boolean(document.getElementById("mobileGameplayStylesV16")?.sheet))).toBe(true);
}

function layoutMetrics(page) {
  return page.evaluate(() => {
    const rect = (selector) => {
      const box = document.querySelector(selector)?.getBoundingClientRect();
      if (!box) return null;
      return {
        top: box.top,
        right: box.right,
        bottom: box.bottom,
        left: box.left,
        width: box.width,
        height: box.height
      };
    };

    return {
      viewport: { width: window.innerWidth, height: window.innerHeight },
      frame: rect(".game-frame"),
      controls: rect(".control-panel"),
      action: rect("#shotAction"),
      topbar: rect(".game-topbar")
    };
  });
}

test("unfolded foldable keeps pitch and shot controls in one playable viewport", async ({ page }) => {
  await page.setViewportSize({ width: 884, height: 1100 });
  await startClassicRun(page);

  const metrics = await layoutMetrics(page);
  expect(metrics.frame).not.toBeNull();
  expect(metrics.controls).not.toBeNull();
  expect(metrics.action).not.toBeNull();
  expect(metrics.controls.top).toBeGreaterThanOrEqual(metrics.frame.bottom - 2);
  expect(metrics.controls.left).toBeGreaterThanOrEqual(metrics.frame.left - 2);
  expect(metrics.action.bottom).toBeLessThan(metrics.viewport.height - 4);
  expect(metrics.frame.height).toBeLessThan(metrics.viewport.height * 0.7);
});

test("phone portrait keeps the shot button visible without scrolling", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await startClassicRun(page);

  const metrics = await layoutMetrics(page);
  expect(metrics.frame).not.toBeNull();
  expect(metrics.controls).not.toBeNull();
  expect(metrics.action).not.toBeNull();
  expect(metrics.controls.top).toBeGreaterThan(metrics.frame.bottom - 2);
  expect(metrics.action.bottom).toBeLessThan(metrics.viewport.height - 4);
  expect(metrics.frame.height / metrics.frame.width).toBeGreaterThan(0.75);
  expect(metrics.frame.height / metrics.frame.width).toBeLessThan(1.2);
});
