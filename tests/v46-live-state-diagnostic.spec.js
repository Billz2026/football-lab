import { test, expect } from "@playwright/test";

async function enterClassic(page) {
  await page.goto("/index.html?diag=v46-live-state", { waitUntil: "networkidle" });
  await page.locator("#classicCard").click();
  await expect.poll(() => page.evaluate(() => (
    document.querySelector("#gameScreen")?.classList.contains("is-active") ||
    document.querySelector("#kickerSelectV13")?.classList.contains("is-open")
  )), { timeout: 8000 }).toBe(true);
  const picker = await page.locator("#kickerSelectV13").isVisible().catch(() => false);
  if (picker) await page.locator("#kickerConfirmV13").click();
  const skip = page.getByRole("button", { name: "SKIP TUTORIAL" });
  if (await skip.isVisible().catch(() => false)) await skip.click({ force: true });
  await page.evaluate(() => document.activeElement?.blur?.());
  await expect(page.locator("#shotAction")).toHaveText("START SHOT", { timeout: 6000 });
}

async function pressAndWait(page, phase) {
  await page.keyboard.press("Enter");
  await expect.poll(async () => (await page.evaluate(() => import("/game/core-v6.js?v=32.4"))).state.phase, { timeout: 2500 }).toBe(phase);
}

test("trace authoritative V46 live animation state", async ({ page }) => {
  await enterClassic(page);
  await expect.poll(() => page.evaluate(() => window.__footballLabHeroFrameV46?.renderer), { timeout: 20000 }).toBe("real-skinned-glb-3d");
  await pressAndWait(page, "aim");
  await page.waitForTimeout(120);
  await pressAndWait(page, "power");
  await page.waitForTimeout(180);
  await pressAndWait(page, "contact");
  await page.waitForTimeout(180);
  await pressAndWait(page, "shooting");

  const samples = [];
  for (let i = 0; i < 24; i += 1) {
    samples.push(await page.evaluate(async () => {
      const core = await import("/game/core-v6.js?v=32.4");
      const globalState = window.__footballLabAuthoritativeStateV46;
      const anim = core.state.animation;
      const globalAnim = globalState?.animation;
      return {
        now: performance.now(),
        phase: core.state.phase,
        sameState: globalState === core.state,
        coreAnimation: anim ? {
          id: anim.id,
          startedAt: anim.startedAt,
          runUpDuration: anim.runUpDuration,
          contactHoldDuration: anim.contactHoldDuration,
          flightDuration: anim.flightDuration,
          settleDuration: anim.settleDuration,
          totalDuration: anim.totalDuration
        } : null,
        globalAnimation: globalAnim ? {
          id: globalAnim.id,
          startedAt: globalAnim.startedAt,
          totalDuration: globalAnim.totalDuration
        } : null,
        hero: window.__footballLabHeroFrameV46 ? { ...window.__footballLabHeroFrameV46 } : null,
        keeper: window.__footballLabKeeperFrameV46 ? { ...window.__footballLabKeeperFrameV46 } : null
      };
    }));
    await page.waitForTimeout(50);
  }
  console.log("V46_LIVE_STATE_TRACE", JSON.stringify(samples));
  expect(samples.some((s) => s.coreAnimation)).toBe(true);
});
