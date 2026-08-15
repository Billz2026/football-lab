import { test, expect } from "@playwright/test";

const KICKERS = [
  ["dax-ryder", "viktor-kane"],
  ["leo-vale", "bruno-silva"],
  ["zion-arc", "david-beckett"],
  ["kai-mori", "wayne-redman"]
];

async function waitForV42(page) {
  await page.goto("/index.html?test=character-v42");
  await expect.poll(
    () => page.evaluate(() => window.__footballLabCharacterSystemV42?.build),
    { timeout: 15000 }
  ).toBe("42.1.0");
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
}

test("V42.1 exposes the reusable premium character roster", async ({ page }) => {
  await waitForV42(page);
  const contract = await page.evaluate(() => window.__footballLabCharacterSystemV42);
  expect(contract.rendererTarget).toBe("layered-2.5d-skeletal");
  expect(contract.artDirection).toBe("premium-stylised-realism");
  expect(contract.sharedOutfieldKit).toBe(true);
  expect(contract.outfieldCount).toBe(4);
  expect(contract.goalkeeperCount).toBe(4);
  expect(contract.outfield).toEqual(["viktor-kane", "bruno-silva", "david-beckett", "wayne-redman"]);
  expect(contract.goalkeepers).toEqual(["mikkel-storm", "rafael-dantas", "diego-varela", "simon-henshaw"]);
  expect(contract.reusableAcrossModes).toBe(true);
  expect(contract.directCelebrityLikenesses).toBe(false);
});

test("all V42 character profiles feed the V44 articulated live renderer", async ({ page }) => {
  for (const [sourceId, visualId] of KICKERS) {
    await page.goto("/index.html?test=character-v44-roster");
    await page.evaluate((id) => localStorage.setItem("footballLabSelectedKickerV13", id), sourceId);
    await page.reload();
    await expect.poll(
      () => page.evaluate(() => window.__footballLabCharacterSystemV42?.build),
      { timeout: 15000 }
    ).toBe("42.1.0");

    await enterClassic(page);

    await expect.poll(
      () => page.evaluate(() => window.__footballLabHeroFrameV44?.sourceCharacterId),
      { timeout: 5000 }
    ).toBe(sourceId);
    await expect.poll(
      () => page.evaluate(() => window.__footballLabHeroFrameV44?.character),
      { timeout: 5000 }
    ).toBe(visualId);
    await expect.poll(
      () => page.evaluate(() => window.__footballLabHeroFrameV44?.build),
      { timeout: 5000 }
    ).toBe("44.0.0");
    await expect.poll(
      () => page.evaluate(() => window.__footballLabHeroFrameV44?.renderer),
      { timeout: 5000 }
    ).toBe("articulated-layered-2.5d");

    const frame = await page.evaluate(() => window.__footballLabHeroFrameV44);
    expect(frame.staticSpriteFrames).toBe(false);
    expect(frame.rig).toBe("continuous-skeletal-canvas");

    await page.screenshot({
      path: `test-results/v44-${visualId}.png`,
      fullPage: true
    });
  }
});
