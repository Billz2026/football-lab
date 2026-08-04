import { test, expect } from "@playwright/test";

async function startClassicRun(page, viewport) {
  await page.setViewportSize(viewport);
  await page.goto("/index.html");
  await expect.poll(() => page.evaluate(() => window.__footballLabMobileShellV161 === true), { timeout: 15000 }).toBe(true);
  await expect(page.locator("#kickerSelectV13")).toHaveCount(1, { timeout: 15000 });
  await page.locator("#playClassic").click();
  await expect(page.locator("#kickerSelectV13")).toHaveClass(/is-open/);
  await page.locator(".kicker-card").first().click();
  await page.locator("#kickerConfirmV13").click();
  await expect(page.locator("#gameScreen")).toHaveClass(/is-active/);
  await expect(page.locator("body")).toHaveClass(/is-game-active/);
}

test("foldable mobile shell shows the complete match HUD without oversized panels", async ({ page }) => {
  await startClassicRun(page, { width: 884, height: 1100 });

  await expect(page.locator("#mobileGameHudV161")).toBeVisible();
  await expect(page.locator("#mobileRunStripV161")).toBeVisible();
  await expect(page.locator(".game-topbar")).toBeHidden();
  await expect(page.locator(".run-rules-v152")).toBeHidden();
  await expect(page.locator(".active-wall-chip-v15")).toBeHidden();
  await expect(page.locator(".active-keeper-chip-v14")).toBeHidden();

  await expect(page.locator(".mobile-life-pip-v161")).toHaveCount(5);
  await expect(page.locator(".mobile-life-pip-v161.is-active")).toHaveCount(5);
  await expect(page.locator(".mobile-run-life-v161")).toHaveCount(5);
  await expect(page.locator(".mobile-run-recovery-pip-v161")).toHaveCount(3);
  await expect(page.locator("[data-run-lives-copy]")).toHaveText("5 / 5");
  await expect(page.locator("[data-run-recovery-copy]")).toHaveText("0 / 3 GOALS");
  await expect(page.locator("[data-hud-keeper] strong")).toContainText("T1");
  await expect(page.locator("[data-hud-wall] strong")).toContainText("T1");

  const viewportHeight = await page.evaluate(() => window.innerHeight);
  const actionBox = await page.locator("#shotAction").boundingBox();
  expect(actionBox).not.toBeNull();
  expect(actionBox.y + actionBox.height).toBeLessThan(viewportHeight);
});

test("phone portrait keeps the mobile HUD, control status and action button visible", async ({ page }) => {
  await startClassicRun(page, { width: 390, height: 844 });

  await expect(page.locator("#mobileGameHudV161")).toBeVisible();
  await expect(page.locator("#mobileRunStripV161")).toBeVisible();
  await expect(page.locator(".mobile-fullscreen-v161")).toBeVisible();
  await expect.poll(() => page.evaluate(() => Boolean(document.getElementById("mobileGameShellCompactStylesV161")?.sheet))).toBe(true);

  const metrics = await page.evaluate(() => {
    const rect = (selector) => document.querySelector(selector)?.getBoundingClientRect();
    const action = rect("#shotAction");
    const frame = rect(".game-frame");
    const hud = rect("#mobileGameHudV161");
    return {
      viewportHeight: window.innerHeight,
      actionBottom: action ? action.bottom : null,
      frameRatio: frame ? frame.height / frame.width : null,
      hudRatio: frame && hud ? hud.height / frame.height : null
    };
  });

  expect(metrics.actionBottom).not.toBeNull();
  expect(metrics.actionBottom).toBeLessThan(metrics.viewportHeight);
  expect(metrics.frameRatio).toBeGreaterThan(.56);
  expect(metrics.frameRatio).toBeLessThan(.65);
  expect(metrics.hudRatio).not.toBeNull();
  expect(metrics.hudRatio).toBeLessThan(.34);
});

test("PWA manifest and service worker are available", async ({ page, request }) => {
  await page.goto("/index.html");
  await expect.poll(() => page.evaluate(() => window.__footballLabMobileShellV161 === true), { timeout: 15000 }).toBe(true);

  await expect(page.locator('link[rel="manifest"]')).toHaveAttribute("href", /manifest\.webmanifest/);
  await expect(page.locator("#installFootballLabV161")).toHaveCount(1);

  const manifestResponse = await request.get("/manifest.webmanifest?v=161");
  expect(manifestResponse.ok()).toBe(true);
  const manifest = await manifestResponse.json();
  expect(manifest.display).toBe("standalone");
  expect(manifest.icons).toHaveLength(2);

  const serviceWorkerResponse = await request.get("/sw.js");
  expect(serviceWorkerResponse.ok()).toBe(true);

  await expect.poll(async () => page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration();
    return Boolean(registration);
  }), { timeout: 15000 }).toBe(true);
});
