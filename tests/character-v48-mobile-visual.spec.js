import fs from "node:fs";
import { test, expect } from "@playwright/test";

async function enterClassic(page) {
  await page.goto("/index.html?capture=viktor-v48-mobile", { waitUntil: "networkidle" });
  await page.locator("#classicCard").click();
  await expect.poll(
    () => page.evaluate(() => (
      document.querySelector("#gameScreen")?.classList.contains("is-active") ||
      document.querySelector("#kickerSelectV13")?.classList.contains("is-open")
    )), { timeout: 8000 }
  ).toBe(true);

  const picker = page.locator("#kickerSelectV13");
  if (await picker.evaluate(el => el.classList.contains("is-open")).catch(() => false)) {
    await page.locator("#kickerConfirmV13").click();
  }
  await expect(page.locator("#gameScreen")).toHaveClass(/is-active/);

  const skip = page.getByRole("button", { name: "SKIP TUTORIAL" });
  if (await skip.isVisible().catch(() => false)) await skip.click({ force: true });
}

function readGlbJson(buffer) {
  const length = buffer.readUInt32LE(12);
  const type = buffer.readUInt32LE(16);
  if (type !== 0x4e4f534a) throw new Error("GLB JSON chunk missing");
  return JSON.parse(buffer.subarray(20, 20 + length).toString("utf8").replace(/[\u0000\s]+$/g, ""));
}

test.use({
  viewport: { width: 393, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
});

test("V48.4 Viktor reads as the final inherited-surface striker candidate from the real mobile gameplay camera", async ({ page }) => {
  const glb = readGlbJson(fs.readFileSync("game/assets/characters/v1/outfield/viktor-kane/viktor-kane.glb"));
  const body = glb.nodes.find(node => node.name === "Viktor_Kane_Body");
  expect(body?.extras?.football_lab_build).toBe("48.4.0");
  expect(body?.extras?.football_lab_art_revision).toBe("V48.4");
  expect(body?.extras?.football_lab_visual_archetype).toBe("premium-elite-english-striker");
  expect(body?.extras?.football_lab_gameplay_camera_polish).toBe(true);
  expect(body?.extras?.football_lab_inherited_surface_only_polish).toBe(true);
  expect(body?.extras?.football_lab_floating_overlay_geometry).toBe(false);
  expect(body?.extras?.football_lab_face_material_mask).toBe(false);
  expect(body?.extras?.football_lab_integrated_face_sculpt).toBe(true);
  expect(body?.extras?.football_lab_contiguous_sleeve_shell).toBe(true);
  expect(body?.extras?.football_lab_smoothed_boot_forefoot).toBe(true);

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
    frame: window.__footballLabHeroFrameV46,
    visible: window.__footballLabVisibleKickersV30,
    contract: window.__footballLabCharacter3DV46,
  }));
  console.log("VIKTOR_V48_4_MOBILE_DIAGNOSTICS", JSON.stringify(diagnostics));
  expect(diagnostics.frame?.production3D).toBe(true);
  expect(diagnostics.visible?.production3D).toBe(true);

  await page.locator("#gameCanvas").screenshot({ path: "test-results/viktor-v48-mobile-gameplay.png" });
  await page.screenshot({ path: "test-results/viktor-v48-mobile-full-ui.png", fullPage: true });
});
