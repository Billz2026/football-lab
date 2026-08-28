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
}

async function metrics(page, removeHistoricalMarker = false) {
  return page.evaluate((removeMarker) => {
    if (removeMarker) {
      delete document.documentElement.dataset.foldShellV3822;
      document.body.classList.remove("fold-shell-v3822");
    }

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
      foldState: document.documentElement.dataset.foldShellV3822 || null,
      foldClass: document.body.classList.contains("fold-shell-v3822"),
      screen: rect("#gameScreen"),
      frame: rect(".game-frame"),
      controls: rect(".control-panel"),
      action: rect("#shotAction")
    };
  }, removeHistoricalMarker);
}

function expectImmersiveLayout(value) {
  expect(value.screen).not.toBeNull();
  expect(value.frame).not.toBeNull();
  expect(value.controls).not.toBeNull();
  expect(value.action).not.toBeNull();

  // No large dead zone after the command deck.
  expect(value.viewport.height - value.controls.bottom).toBeLessThanOrEqual(18);
  expect(value.controls.top - value.frame.bottom).toBeLessThanOrEqual(10);

  // The football scene, not empty page chrome, absorbs spare Fold height.
  expect(value.frame.height).toBeGreaterThan(value.viewport.height * 0.68);
  expect(value.action.bottom).toBeLessThanOrEqual(value.viewport.height - 4);
}

test("wide unfolded Fold uses the full gameplay viewport", async ({ page }) => {
  await startClassicRun(page);
  expectImmersiveLayout(await metrics(page));
});

test("Fold immersive layout survives a missing historical runtime marker", async ({ page }) => {
  await startClassicRun(page);

  // Reproduce the real-device failure mode atomically. The legacy V38 runtime
  // may heal its own marker on later browser events; this assertion proves the
  // geometry-driven V53.4 layout does not require that marker to be present.
  const value = await metrics(page, true);
  expect(value.foldState).toBeNull();
  expect(value.foldClass).toBe(false);
  expectImmersiveLayout(value);
});
