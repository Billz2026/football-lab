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

async function productionPointerAction(page) {
  return page.evaluate(() => {
    const action = document.querySelector("#shotAction");
    if (!action) throw new Error("#shotAction is missing");
    const before = action.textContent?.trim() || "";
    const beforePhase = document.documentElement.dataset.strikePhaseV324 || "";
    const event = new PointerEvent("pointerdown", {
      bubbles: true,
      cancelable: true,
      composed: true,
      pointerId: 1,
      pointerType: "mouse",
      isPrimary: true,
      button: 0,
      buttons: 1
    });
    const dispatched = action.dispatchEvent(event);
    return {
      before,
      beforePhase,
      after: action.textContent?.trim() || "",
      afterPhase: document.documentElement.dataset.strikePhaseV324 || "",
      dispatched,
      frame: window.__footballLabHeroFrameV46 || null,
      lastInput: window.__footballLabLastInputSample || null
    };
  });
}

async function executeLiveShot(page) {
  await dismissCoach(page);
  await expect(page.locator("#shotAction")).toHaveText("START SHOT", { timeout: 6000 });
  await expect.poll(
    () => page.evaluate(() => document.documentElement.dataset.strikePhaseV324),
    { timeout: 3000 }
  ).toBe("ready");

  // READY -> AIM -> POWER -> CONTACT -> SHOOTING.
  // These are genuine PointerEvents sent to the production #shotAction listener.
  // No state or animation clip is mutated by the test.
  const expected = [
    ["aim", "STRIKE"],
    ["power", "LOCK POWER"],
    ["contact", "LOCK CONTACT"],
    ["shooting", "SHOT IN PLAY"]
  ];
  const delays = [120, 180, 180, 0];
  const trace = [];

  for (let index = 0; index < expected.length; index += 1) {
    const sample = await productionPointerAction(page);
    trace.push(sample);
    const [expectedPhase, expectedLabel] = expected[index];

    await expect.poll(
      () => page.evaluate(() => document.documentElement.dataset.strikePhaseV324),
      { timeout: 2500 }
    ).toBe(expectedPhase);
    await expect.poll(
      () => page.locator("#shotAction").textContent(),
      { timeout: 2500 }
    ).toContain(expectedLabel);

    if (delays[index]) await page.waitForTimeout(delays[index]);
  }

  console.log("VIKTOR_V46_STRIKE_INPUT_TRACE", JSON.stringify(trace));
  await expect.poll(
    () => page.evaluate(() => Boolean(window.__footballLabHeroFrameV46?.clip && window.__footballLabHeroFrameV46.clip !== "idle")),
    { timeout: 3000 }
  ).toBe(true);
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
