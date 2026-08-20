import { test, expect } from "@playwright/test";
import { loadGameplay } from "./helpers/load-gameplay.js";

test("V17.1 startup reports the exact loader result", async ({ page }) => {
  await page.goto("/index.html?v=171");
  await loadGameplay(page);
  await page.waitForTimeout(3000);
  const startup = await page.evaluate(() => ({
    error: window.__footballLabStartupError,
    mainV17: window.__footballLabMainV17 === true,
    mainV171: window.__footballLabMainV171 === true,
    rig: window.__footballLabRigV171 === true,
    banner: document.querySelector(".football-lab-startup-error")?.textContent || null
  }));

  expect(startup.error, startup.error || startup.banner || JSON.stringify(startup)).toBeNull();
  expect(startup.mainV17).toBe(true);
  expect(startup.mainV171).toBe(true);
  expect(startup.rig).toBe(true);
});
