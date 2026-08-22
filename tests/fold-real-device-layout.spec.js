import { test, expect } from "@playwright/test";

test.use({
  hasTouch: true,
  viewport: { width: 1280, height: 1400 }
});

async function startClassicRun(page) {
  await page.goto("/index.html");
  await page.locator("#classicCard").click();
  await expect(page.locator("#kickerSelectV13")).toHaveCount(1, { timeout: 15000 });
  await expect(page.locator("#kickerSelectV13")).toHaveClass(/is-open/);
  await page.locator(".kicker-card").first().click();
  await page.locator("#kickerConfirmV13").click();
  await expect(page.locator("#gameScreen")).toHaveClass(/is-active/);
  await expect(page.locator("body")).toHaveClass(/is-game-active/);
  await expect.poll(async () => page.evaluate(() => document.documentElement.dataset.foldShellV3822)).toBe("active");
}

test("wide unfolded Fold uses the full gameplay viewport", async ({ page }) => {
  await startClassicRun(page);

  const metrics = await page.evaluate(() => {
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
      foldState: document.documentElement.dataset.foldShellV3822,
      screen: rect("#gameScreen"),
      frame: rect(".game-frame"),
      controls: rect(".control-panel"),
      action: rect("#shotAction")
    };
  });

  expect(metrics.foldState).toBe("active");
  expect(metrics.screen).not.toBeNull();
  expect(metrics.frame).not.toBeNull();
  expect(metrics.controls).not.toBeNull();
  expect(metrics.action).not.toBeNull();

  // Real-device contract: no large dead zone after the command deck.
  expect(metrics.viewport.height - metrics.controls.bottom).toBeLessThanOrEqual(18);
  expect(metrics.controls.top - metrics.frame.bottom).toBeLessThanOrEqual(10);

  // The football scene, not empty page chrome, should absorb spare Fold height.
  expect(metrics.frame.height).toBeGreaterThan(metrics.viewport.height * 0.68);
  expect(metrics.action.bottom).toBeLessThanOrEqual(metrics.viewport.height - 4);
});
