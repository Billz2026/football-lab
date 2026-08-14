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
  ).toBe("42.0.0");
}

test("V42 exposes four outfield and four goalkeeper visual identities", async ({ page }) => {
  await waitForV42(page);
  const contract = await page.evaluate(() => window.__footballLabCharacterSystemV42);
  expect(contract.rendererTarget).toBe("layered-2.5d-skeletal");
  expect(contract.outfieldCount).toBe(4);
  expect(contract.goalkeeperCount).toBe(4);
  expect(contract.outfield).toEqual(["viktor-kane", "bruno-silva", "david-beckett", "wayne-redman"]);
  expect(contract.goalkeepers).toEqual(["mikkel-storm", "rafael-dantas", "diego-varela", "simon-henshaw"]);
  expect(contract.reusableAcrossModes).toBe(true);
  expect(contract.directCelebrityLikenesses).toBe(false);
});

test("V42 renders every selectable outfield player through the new character layer", async ({ page }) => {
  for (const [sourceId, visualId] of KICKERS) {
    await page.goto("/index.html?test=character-v42");
    await page.evaluate((id) => localStorage.setItem("footballLabSelectedKickerV13", id), sourceId);
    await page.reload();
    await expect.poll(
      () => page.evaluate(() => window.__footballLabCharacterSystemV42?.build),
      { timeout: 15000 }
    ).toBe("42.0.0");

    await page.locator("#classicCard").click();
    await expect(page.locator("#kickerSelectV13")).toHaveClass(/is-open/);
    await expect(page.locator(`[data-kicker-id="${sourceId}"]`)).toHaveClass(/is-selected/);
    await page.locator("#kickerConfirmV13").click();
    await expect(page.locator("#gameScreen")).toHaveClass(/is-active/);

    await expect.poll(
      () => page.evaluate(() => window.__footballLabHeroFrameV42?.sourceCharacterId),
      { timeout: 5000 }
    ).toBe(sourceId);
    await expect.poll(
      () => page.evaluate(() => window.__footballLabHeroFrameV42?.character),
      { timeout: 5000 }
    ).toBe(visualId);

    await page.screenshot({
      path: `test-results/v42-${visualId}.png`,
      fullPage: true
    });
  }
});
