import { test, expect } from "@playwright/test";

test("V53 unified black and gold theme is loaded as the product-wide design system", async ({ page }) => {
  await page.goto("/index.html");

  const contract = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const primary = getComputedStyle(document.getElementById("modalPlay"));
    const stylesheet = [...document.styleSheets]
      .map((sheet) => sheet.href || "")
      .find((href) => href.includes("/game/theme-v53.css"));

    return {
      stylesheet: Boolean(stylesheet),
      themeColor: document.querySelector('meta[name="theme-color"]')?.content || "",
      gold: root.getPropertyValue("--fl-gold").trim(),
      goldBright: root.getPropertyValue("--fl-gold-bright").trim(),
      legacyAccent: root.getPropertyValue("--lime").trim(),
      background: root.getPropertyValue("--fl-bg").trim(),
      primaryBackground: primary.backgroundImage
    };
  });

  expect(contract.stylesheet).toBe(true);
  expect(contract.themeColor).toBe("#080806");
  expect(contract.gold).toBe("#e6b94f");
  expect(contract.goldBright).toBe("#ffd86a");
  expect(contract.legacyAccent).toBe("var(--fl-gold)");
  expect(contract.background).toBe("#020202");
  expect(contract.primaryBackground).toContain("rgb(255, 216, 106)");

  await expect(page.locator("#trainingCardV35")).toBeVisible();
  await expect(page.locator("#classicCard")).toBeVisible();
  await expect(page.locator(".hub-mode-penalties")).toBeVisible();
});
