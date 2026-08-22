import { test, expect } from "@playwright/test";

test("V53 unified black and gold theme is loaded as the product-wide design system", async ({ page }) => {
  await page.goto("/index.html");

  const contract = await page.evaluate(() => {
    const root = getComputedStyle(document.documentElement);
    const primary = getComputedStyle(document.getElementById("modalPlay"));
    const stylesheets = [...document.styleSheets].map((sheet) => sheet.href || "");
    const accentProbe = document.createElement("i");
    accentProbe.style.color = "var(--lime)";
    document.body.appendChild(accentProbe);
    const legacyAccentColor = getComputedStyle(accentProbe).color;
    accentProbe.remove();

    return {
      themeStylesheet: stylesheets.some((href) => href.includes("/game/theme-v53.css")),
      componentStylesheet: stylesheets.some((href) => href.includes("/game/theme-components-v53.css")),
      themeColor: document.querySelector('meta[name="theme-color"]')?.content || "",
      gold: root.getPropertyValue("--fl-gold").trim(),
      goldBright: root.getPropertyValue("--fl-gold-bright").trim(),
      legacyAccentColor,
      background: root.getPropertyValue("--fl-bg").trim(),
      primaryBackground: primary.backgroundImage
    };
  });

  expect(contract.themeStylesheet).toBe(true);
  expect(contract.componentStylesheet).toBe(true);
  expect(contract.themeColor).toBe("#080806");
  expect(contract.gold).toBe("#e6b94f");
  expect(contract.goldBright).toBe("#ffd86a");
  expect(contract.legacyAccentColor).toBe("rgb(230, 185, 79)");
  expect(contract.background).toBe("#020202");
  expect(contract.primaryBackground).toContain("rgb(255, 216, 106)");

  await expect(page.locator("#trainingCardV35")).toBeVisible();
  await expect(page.locator("#classicCard")).toBeVisible();
  await expect(page.locator(".hub-mode-penalties")).toBeVisible();
});
