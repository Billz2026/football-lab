import { test, expect } from "@playwright/test";

const RELEASE_BUILD = "52.0.0";
const CACHE_NAME = "football-lab-shell-v52-0-0";

test("V52 installs one current shell and reloads the clean menu offline", async ({ page, context }) => {
  await page.goto("/index.html");
  await page.waitForFunction(
    (build) => window.__footballLabReleaseV520?.build === build,
    RELEASE_BUILD,
    { timeout: 20000 }
  );

  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) {
      await new Promise((resolve) => navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true }));
    }
  });

  const online = await page.evaluate(async () => {
    const registration = await navigator.serviceWorker.ready;
    const worker = registration.active || registration.waiting || registration.installing;
    return {
      build: document.documentElement.dataset.footballLabBuild,
      release: window.__footballLabReleaseV520?.build,
      workerUrl: worker?.scriptURL || "",
      caches: await caches.keys()
    };
  });

  expect(online.build).toBe(RELEASE_BUILD);
  expect(online.release).toBe(RELEASE_BUILD);
  expect(new URL(online.workerUrl).searchParams.get("v")).toBe(RELEASE_BUILD);
  expect(online.caches.filter((name) => name.startsWith("football-lab-shell-"))).toEqual([CACHE_NAME]);

  await context.setOffline(true);
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator("#modeHub")).toBeVisible();
  await expect(page.locator(".brand-logo-v52")).toBeVisible();
  await expect(page.locator(".hub-tile-art")).toHaveCount(6);
  await expect(page.getByRole("heading", { name: "PENALTY DUEL" })).toBeVisible();
  await expect(page.locator(".hub-hero")).toHaveCount(0);
  await expect(page.getByText("MASTER EVERY MOMENT.", { exact: true })).toHaveCount(0);
  await expect.poll(() => page.evaluate(() => window.__footballLabStartupError)).toBeNull();
});
