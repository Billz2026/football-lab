export async function loadGameplay(page) {
  await page.waitForFunction(() => typeof window.__footballLabModeBundles?.loadGameplay === "function", null, {
    timeout: 10000
  });
  await page.evaluate(() => window.__footballLabModeBundles.loadGameplay());
}
