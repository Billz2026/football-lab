import { test, expect } from "@playwright/test";

const KICKERS = [
  ["dax-ryder", "viktor-kane"],
  ["leo-vale", "bruno-silva"],
  ["zion-arc", "david-beckett"],
  ["kai-mori", "wayne-redman"]
];

async function waitForArcadeSystem(page) {
  await page.goto("/index.html?test=character-arcade-roster");
  await expect.poll(
    () => page.evaluate(() => window.__footballLabCharacterSystemV42?.build),
    { timeout: 15000 }
  ).toBe("50.0.0-arcade-profile");
}

async function enterClassic(page) {
  await page.locator("#classicCard").click();
  await expect.poll(
    () => page.evaluate(() => (
      document.querySelector("#gameScreen")?.classList.contains("is-active") ||
      document.querySelector("#kickerSelectV13")?.classList.contains("is-open")
    )),
    { timeout: 5000 }
  ).toBe(true);

  const state = await page.evaluate(() => ({
    gameActive: document.querySelector("#gameScreen")?.classList.contains("is-active"),
    pickerOpen: document.querySelector("#kickerSelectV13")?.classList.contains("is-open")
  }));
  if (!state.gameActive && state.pickerOpen) await page.locator("#kickerConfirmV13").click();
  await expect(page.locator("#gameScreen")).toHaveClass(/is-active/);

  const skip = page.getByRole("button", { name: "SKIP TUTORIAL" });
  if (await skip.isVisible().catch(() => false)) await skip.click({ force: true });
}

test("V50 exposes the reusable arcade character roster", async ({ page }) => {
  await waitForArcadeSystem(page);
  const contract = await page.evaluate(() => window.__footballLabCharacterSystemV42);
  expect(contract.rendererTarget).toBe("modern-arcade-articulated-2.5d");
  expect(contract.artDirection).toBe("modern-arcade-football");
  expect(contract.realismRequired).toBe(false);
  expect(contract.readabilityPriority).toBe(true);
  expect(contract.exaggeratedSilhouettes).toBe(true);
  expect(contract.sharedOutfieldKit).toBe(true);
  expect(contract.outfieldCount).toBe(4);
  expect(contract.goalkeeperCount).toBe(4);
  expect(contract.outfield).toEqual(["viktor-kane", "bruno-silva", "david-beckett", "wayne-redman"]);
  expect(contract.goalkeepers).toEqual(["mikkel-storm", "rafael-dantas", "diego-varela", "simon-henshaw"]);
  expect(contract.reusableAcrossModes).toBe(true);
  expect(contract.directCelebrityLikenesses).toBe(false);
});

test("all four outfield characters use the same live arcade renderer", async ({ page }) => {
  for (const [sourceId, visualId] of KICKERS) {
    await page.goto("/index.html?test=character-arcade-roster-live");
    await page.evaluate((id) => localStorage.setItem("footballLabSelectedKickerV13", id), sourceId);
    await page.reload();

    await expect.poll(
      () => page.evaluate(() => window.__footballLabCharacterSystemV42?.build),
      { timeout: 15000 }
    ).toBe("50.0.0-arcade-profile");

    await enterClassic(page);

    await expect.poll(
      () => page.evaluate(() => window.__footballLabHeroFrameV50?.character),
      { timeout: 10000 }
    ).toBe(visualId);

    const frame = await page.evaluate(() => window.__footballLabHeroFrameV50);
    expect(frame.renderer).toBe("modern-arcade-articulated-2.5d");
    expect(frame.production3D).toBe(false);
    expect(frame.rig).toBe("continuous-skeletal-canvas");

    const visible = await page.evaluate(() => window.__footballLabVisibleKickersV30);
    expect(visible.productionCharacterMode).toBe("modern-arcade-articulated-2.5d");
    expect(visible.production3D).toBe(false);
    expect(visible.staticSpriteFrames).toBe(false);

    await page.screenshot({
      path: `test-results/arcade-live-${visualId}.png`,
      fullPage: true
    });
  }
});
