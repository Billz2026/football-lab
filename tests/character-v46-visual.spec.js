import fs from "node:fs";
import { test, expect } from "@playwright/test";

// Visual approval must come from the authoritative Football Lab camera after
// the V46 runtime bridge is rebuilt; Blender previews are not accepted here.
// This gate proves both the approved standing model and live strike deformation.
async function enterClassic(page) {
  await page.goto("/index.html?capture=viktor-v46-strike", { waitUntil: "networkidle" });
  await page.locator("#classicCard").click();

  await expect.poll(
    () => page.evaluate(() => (
      document.querySelector("#gameScreen")?.classList.contains("is-active") ||
      document.querySelector("#kickerSelectV13")?.classList.contains("is-open")
    )),
    { timeout: 8000 }
  ).toBe(true);

  const state = await page.evaluate(() => ({
    game: document.querySelector("#gameScreen")?.classList.contains("is-active"),
    picker: document.querySelector("#kickerSelectV13")?.classList.contains("is-open")
  }));

  if (!state.game && state.picker) {
    await page.locator("#kickerConfirmV13").click();
  }
  await expect(page.locator("#gameScreen")).toHaveClass(/is-active/);
}

async function dismissCoach(page) {
  const skip = page.getByRole("button", { name: "SKIP TUTORIAL" });
  if (await skip.isVisible().catch(() => false)) {
    await skip.click({ force: true });
  }
}

async function armStrikeCaptures(page) {
  await page.evaluate(() => {
    const targets = new Set(["windup", "contact", "follow-through"]);
    window.__v46StrikeCaptures = {};

    function sample() {
      const frame = window.__footballLabHeroFrameV46;
      const clip = frame?.clip;
      if (targets.has(clip) && !window.__v46StrikeCaptures[clip]) {
        const canvas = document.querySelector("#gameCanvas");
        window.__v46StrikeCaptures[clip] = {
          frame: { ...frame },
          dataUrl: canvas?.toDataURL("image/png") || null
        };
      }
      if (Object.keys(window.__v46StrikeCaptures).length < targets.size) {
        requestAnimationFrame(sample);
      }
    }
    requestAnimationFrame(sample);
  });
}

async function saveCapturedClip(page, clip, path) {
  await page.waitForFunction(
    (expected) => Boolean(window.__v46StrikeCaptures?.[expected]?.dataUrl),
    clip,
    { timeout: 8000, polling: "raf" }
  );

  const capture = await page.evaluate((expected) => window.__v46StrikeCaptures[expected], clip);
  expect(capture?.frame?.renderer).toBe("real-skinned-glb-3d");
  expect(capture?.frame?.production3D).toBe(true);
  expect(capture?.frame?.clip).toBe(clip);
  expect(capture?.dataUrl).toMatch(/^data:image\/png;base64,/);

  fs.writeFileSync(path, Buffer.from(capture.dataUrl.split(",")[1], "base64"));
}

async function executeLiveShot(page) {
  await dismissCoach(page);
  await expect(page.locator("#shotAction")).toHaveText("START SHOT", { timeout: 6000 });

  // READY -> AIM -> POWER -> CONTACT -> SHOOTING.
  // Space is a first-class production input handled by the same handleAction()
  // path as pointer input, and avoids relying on a button that is intentionally
  // hidden during parts of the compact gameplay layout.
  for (const delay of [120, 180, 180, 0]) {
    await page.keyboard.press("Space");
    if (delay) await page.waitForTimeout(delay);
  }
}

test("capture Viktor Kane V46 standing and striking in the authoritative gameplay camera", async ({ page }) => {
  await enterClassic(page);

  await expect.poll(
    () => page.evaluate(() => window.__footballLabHeroFrameV46?.renderer),
    { timeout: 20000 }
  ).toBe("real-skinned-glb-3d");

  await expect.poll(
    () => page.evaluate(() => window.__footballLabCharacter3DV46?.loaded?.includes("viktor-kane")),
    { timeout: 10000 }
  ).toBe(true);

  const diagnostics = await page.evaluate(() => ({
    renderer: window.__footballLabHeroFrameV46,
    contract: window.__footballLabCharacter3DV46,
    visible: window.__footballLabVisibleKickersV30
  }));
  console.log("VIKTOR_V46_CAPTURE_DIAGNOSTICS", JSON.stringify(diagnostics));

  expect(diagnostics.renderer?.production3D).toBe(true);
  expect(diagnostics.visible?.production3D).toBe(true);
  expect(diagnostics.visible?.productionCharacterMode).toBe("real-skinned-glb-3d");

  await page.locator("#gameCanvas").screenshot({
    path: "test-results/viktor-v46-gameplay-ready.png"
  });

  await page.screenshot({
    path: "test-results/viktor-v46-full-ui-ready.png",
    fullPage: true
  });

  await armStrikeCaptures(page);
  await executeLiveShot(page);
  await saveCapturedClip(page, "windup", "test-results/viktor-v46-strike-windup.png");
  await saveCapturedClip(page, "contact", "test-results/viktor-v46-strike-contact.png");
  await saveCapturedClip(page, "follow-through", "test-results/viktor-v46-strike-follow-through.png");
});
