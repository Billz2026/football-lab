import fs from "node:fs";
import { test, expect } from "@playwright/test";

async function installInputDiagnostics(page) {
  await page.addInitScript(() => {
    const original = EventTarget.prototype.addEventListener;
    let nextId = 0;
    window.__v46ListenerRegistrations = [];
    window.__v46ListenerEvents = [];

    EventTarget.prototype.addEventListener = function(type, listener, options) {
      const tracked = (
        (this === document && type === "keydown")
        || (this === window && (type === "footballlab:phasechange" || type === "footballlab:beginstrike"))
      );
      if (tracked && typeof listener === "function") {
        const id = ++nextId;
        const stack = new Error(`${type}-listener-${id}`).stack || "";
        window.__v46ListenerRegistrations.push({ id, type, stack, options: String(options ?? "") });
        const wrapped = function(event) {
          const before = {
            phase: document.documentElement.dataset.strikePhaseV324 || "",
            label: document.querySelector("#shotAction")?.textContent?.trim() || ""
          };
          const result = listener.call(this, event);
          const after = {
            phase: document.documentElement.dataset.strikePhaseV324 || "",
            label: document.querySelector("#shotAction")?.textContent?.trim() || ""
          };
          window.__v46ListenerEvents.push({
            id,
            type,
            key: event.key || "",
            code: event.code || "",
            detail: event.detail || null,
            before,
            after
          });
          return result;
        };
        return original.call(this, type, wrapped, options);
      }
      return original.call(this, type, listener, options);
    };
  });
}

async function installPhaseMutationTrap(page) {
  await page.evaluate(async () => {
    const core = await import("/game/core-v6.js?v=32.4");
    let current = core.state.phase;
    window.__v46PhaseMutations = [];
    Object.defineProperty(core.state, "phase", {
      configurable: true,
      enumerable: true,
      get() { return current; },
      set(value) {
        window.__v46PhaseMutations.push({
          from: current,
          to: value,
          at: performance.now(),
          stack: new Error(`phase ${current} -> ${value}`).stack || ""
        });
        current = value;
      }
    });
    window.__v46CoreState = core.state;
  });
}

async function enterClassic(page) {
  await page.goto("/index.html?capture=viktor-v46-strike", { waitUntil: "networkidle" });
  await installPhaseMutationTrap(page);
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
  const before = await page.evaluate(() => ({
    internal: window.__v46CoreState?.phase,
    dom: document.documentElement.dataset.strikePhaseV324 || "",
    label: document.querySelector("#shotAction")?.textContent?.trim() || ""
  }));
  const skip = page.getByRole("button", { name: "SKIP TUTORIAL" });
  if (await skip.isVisible().catch(() => false)) await skip.click({ force: true });
  await page.evaluate(() => document.activeElement?.blur?.());
  const after = await page.evaluate(() => ({
    internal: window.__v46CoreState?.phase,
    dom: document.documentElement.dataset.strikePhaseV324 || "",
    label: document.querySelector("#shotAction")?.textContent?.trim() || "",
    mutations: window.__v46PhaseMutations
  }));
  console.log("VIKTOR_COACH_PHASE_DIAGNOSTIC", JSON.stringify({ before, after }));
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
      if (Object.keys(window.__v46StrikeCaptures).length < targets.size) requestAnimationFrame(sample);
    }
    requestAnimationFrame(sample);
  });
}

async function saveCapturedClip(page, clip, path) {
  await page.waitForFunction(
    (expected) => Boolean(window.__v46StrikeCaptures?.[expected]?.dataUrl),
    clip,
    { timeout: 10000, polling: "raf" }
  );
  const capture = await page.evaluate((expected) => window.__v46StrikeCaptures[expected], clip);
  expect(capture?.frame?.renderer).toBe("real-skinned-glb-3d");
  expect(capture?.frame?.production3D).toBe(true);
  expect(capture?.frame?.clip).toBe(clip);
  expect(capture?.dataUrl).toMatch(/^data:image\/png;base64,/);
  fs.writeFileSync(path, Buffer.from(capture.dataUrl.split(",")[1], "base64"));
}

async function browserKeyboardAction(page) {
  await page.evaluate(() => { window.__v46ListenerEvents = []; });
  const before = await page.evaluate(() => ({
    internal: window.__v46CoreState?.phase,
    dom: document.documentElement.dataset.strikePhaseV324 || "",
    label: document.querySelector("#shotAction")?.textContent?.trim() || ""
  }));
  await page.keyboard.press("Enter");
  const after = await page.evaluate(() => ({
    internal: window.__v46CoreState?.phase,
    dom: document.documentElement.dataset.strikePhaseV324 || "",
    label: document.querySelector("#shotAction")?.textContent?.trim() || ""
  }));
  const diagnostic = await page.evaluate(() => ({
    registrations: window.__v46ListenerRegistrations,
    events: window.__v46ListenerEvents,
    mutations: window.__v46PhaseMutations
  }));
  return { before, after, diagnostic };
}

async function executeLiveShot(page) {
  await dismissCoach(page);
  await expect(page.locator("#shotAction")).toHaveText("START SHOT", { timeout: 6000 });
  const preInput = await page.evaluate(() => ({
    internal: window.__v46CoreState?.phase,
    dom: document.documentElement.dataset.strikePhaseV324 || "",
    label: document.querySelector("#shotAction")?.textContent?.trim() || "",
    mutations: window.__v46PhaseMutations
  }));
  console.log("VIKTOR_PRE_INPUT_PHASE_DIAGNOSTIC", JSON.stringify(preInput));

  const expected = [
    ["aim", "STRIKE"],
    ["power", "LOCK POWER"],
    ["contact", "LOCK CONTACT"],
    ["shooting", "SHOT IN PLAY"]
  ];
  const delays = [120, 180, 180, 0];
  const trace = [];

  for (let index = 0; index < expected.length; index += 1) {
    const sample = await browserKeyboardAction(page);
    trace.push(sample);
    console.log("VIKTOR_INPUT_DIAGNOSTIC", JSON.stringify(sample));
    const [phase, label] = expected[index];
    await expect.poll(
      () => page.evaluate(() => window.__v46CoreState?.phase),
      { timeout: 2500 }
    ).toBe(phase);
    await expect.poll(
      () => page.evaluate(() => document.documentElement.dataset.strikePhaseV324),
      { timeout: 2500 }
    ).toBe(phase);
    await expect.poll(
      () => page.locator("#shotAction").textContent(),
      { timeout: 2500 }
    ).toContain(label);
    if (delays[index]) await page.waitForTimeout(delays[index]);
  }

  console.log("VIKTOR_V46_STRIKE_INPUT_TRACE", JSON.stringify(trace));
}

test("capture Viktor Kane V46 standing and striking in the authoritative gameplay camera", async ({ page }) => {
  await installInputDiagnostics(page);
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
    visible: window.__footballLabVisibleKickersV30,
    internalPhase: window.__v46CoreState?.phase,
    domPhase: document.documentElement.dataset.strikePhaseV324 || "",
    mutations: window.__v46PhaseMutations
  }));
  console.log("VIKTOR_V46_CAPTURE_DIAGNOSTICS", JSON.stringify(diagnostics));
  expect(diagnostics.renderer?.production3D).toBe(true);
  expect(diagnostics.visible?.production3D).toBe(true);
  expect(diagnostics.visible?.productionCharacterMode).toBe("real-skinned-glb-3d");

  await page.locator("#gameCanvas").screenshot({ path: "test-results/viktor-v46-gameplay-ready.png" });
  await page.screenshot({ path: "test-results/viktor-v46-full-ui-ready.png", fullPage: true });

  await armStrikeCaptures(page);
  await executeLiveShot(page);
  await saveCapturedClip(page, "windup", "test-results/viktor-v46-strike-windup.png");
  await saveCapturedClip(page, "contact", "test-results/viktor-v46-strike-contact.png");
  await saveCapturedClip(page, "follow-through", "test-results/viktor-v46-strike-follow-through.png");
});
