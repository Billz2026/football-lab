import fs from "node:fs";
import { test, expect } from "@playwright/test";

async function enterClassic(page) {
  await page.goto("/index.html?capture=viktor-v46-strike", { waitUntil: "networkidle" });
  await page.locator("#classicCard").click();
  await expect.poll(
    () => page.evaluate(() => (
      document.querySelector("#gameScreen")?.classList.contains("is-active") ||
      document.querySelector("#kickerSelectV13")?.classList.contains("is-open")
    )), { timeout: 8000 }
  ).toBe(true);

  const state = await page.evaluate(() => ({
    game: document.querySelector("#gameScreen")?.classList.contains("is-active"),
    picker: document.querySelector("#kickerSelectV13")?.classList.contains("is-open")
  }));
  if (!state.game && state.picker) await page.locator("#kickerConfirmV13").click();
  await expect(page.locator("#gameScreen")).toHaveClass(/is-active/);
}

async function dismissCoach(page) {
  const skip = page.getByRole("button", { name: "SKIP TUTORIAL" });
  if (await skip.isVisible().catch(() => false)) await skip.click({ force: true });
  await page.evaluate(() => document.activeElement?.blur?.());
}

async function armStrikeCaptures(page) {
  await page.evaluate(() => {
    const targets = new Set(["windup", "contact", "follow-through"]);
    window.__v46StrikeCaptures = {};
    window.__v46StrikeTrace = [];
    let previousClip = null;

    function copyCanvas(source) {
      if (!source) return null;
      const snapshot = document.createElement("canvas");
      snapshot.width = source.width;
      snapshot.height = source.height;
      snapshot.getContext("2d", { alpha: true })?.drawImage(source, 0, 0);
      return snapshot;
    }

    function sample() {
      const frame = window.__footballLabHeroFrameV46;
      const clip = frame?.clip || "";
      if (clip && clip !== previousClip) {
        window.__v46StrikeTrace.push({ clip, time: frame?.time ?? performance.now() });
        previousClip = clip;
      }
      if (targets.has(clip) && !window.__v46StrikeCaptures[clip]) {
        window.__v46StrikeCaptures[clip] = {
          frame: { ...frame },
          snapshot: copyCanvas(document.querySelector("#gameCanvas"))
        };
      }
      if (Object.keys(window.__v46StrikeCaptures).length < targets.size) requestAnimationFrame(sample);
    }
    requestAnimationFrame(sample);
  });
}

async function saveCapturedClip(page, clip, path) {
  await page.waitForFunction(
    (expected) => Boolean(window.__v46StrikeCaptures?.[expected]?.snapshot),
    clip,
    { timeout: 10000, polling: "raf" }
  );
  const capture = await page.evaluate((expected) => {
    const stored = window.__v46StrikeCaptures?.[expected];
    return stored ? {
      frame: stored.frame,
      dataUrl: stored.snapshot?.toDataURL("image/png") || null,
      trace: [...(window.__v46StrikeTrace || [])]
    } : null;
  }, clip);
  expect(capture?.frame?.renderer).toBe("real-skinned-glb-3d");
  expect(capture?.frame?.production3D).toBe(true);
  expect(capture?.frame?.clip).toBe(clip);
  expect(capture?.dataUrl).toMatch(/^data:image\/png;base64,/);
  fs.writeFileSync(path, Buffer.from(capture.dataUrl.split(",")[1], "base64"));
  return capture;
}

async function phaseSnapshot(page) {
  return page.evaluate(async () => {
    const core = await import("/game/core-v6.js?v=32.4");
    return {
      internal: core.state.phase,
      dom: document.documentElement.dataset.strikePhaseV324 || "",
      label: document.querySelector("#shotAction")?.textContent?.trim() || ""
    };
  });
}

async function executeLiveShot(page) {
  await dismissCoach(page);
  await expect(page.locator("#shotAction")).toHaveText("START SHOT", { timeout: 6000 });

  const expected = [
    ["aim", "STRIKE"],
    ["power", "LOCK POWER"],
    ["contact", "LOCK CONTACT"],
    ["shooting", "SHOT IN PLAY"]
  ];
  const delays = [120, 180, 180, 0];
  const trace = [{ before: await phaseSnapshot(page) }];

  for (let index = 0; index < expected.length; index += 1) {
    await page.keyboard.press("Enter");
    const [phase, label] = expected[index];
    await expect.poll(() => phaseSnapshot(page), { timeout: 2500 }).toMatchObject({
      internal: phase,
      dom: phase,
      label
    });
    trace.push({ afterInput: index + 1, ...(await phaseSnapshot(page)) });
    if (delays[index]) await page.waitForTimeout(delays[index]);
  }

  console.log("VIKTOR_V46_STRIKE_INPUT_TRACE", JSON.stringify(trace));
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

  await page.locator("#gameCanvas").screenshot({ path: "test-results/viktor-v46-gameplay-ready.png" });
  await page.screenshot({ path: "test-results/viktor-v46-full-ui-ready.png", fullPage: true });

  await armStrikeCaptures(page);
  await executeLiveShot(page);

  await expect.poll(
    () => page.evaluate(() => (window.__v46StrikeTrace || []).map((entry) => entry.clip)),
    { timeout: 10000 }
  ).toEqual(expect.arrayContaining(["windup", "contact", "follow-through"]));

  const windup = await saveCapturedClip(page, "windup", "test-results/viktor-v46-strike-windup.png");
  await saveCapturedClip(page, "contact", "test-results/viktor-v46-strike-contact.png");
  await saveCapturedClip(page, "follow-through", "test-results/viktor-v46-strike-follow-through.png");
  console.log("VIKTOR_V46_LIVE_CLIP_TRACE", JSON.stringify(windup.trace));
});
