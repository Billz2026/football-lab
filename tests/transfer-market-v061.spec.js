import { test, expect } from '@playwright/test';

test.setTimeout(70000);

test.beforeEach(async ({ page }) => {
  await page.goto('/index.html');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: /QUICK START/ }).click();
  await expect(page.locator('.career-app')).toHaveClass(/is-open/);
  await page.locator('.v060-world-panel [data-v060-continue]').click();
  await expect(page.locator('.v054-date-chip')).toContainText('15 JUN 2026');
});

test('elite Premier League stars show high market values and major seller premiums', async ({ page }) => {
  const values = await page.evaluate(async () => {
    const db = await window.FLMManager.loadDatabase();
    const transfers = await import('./transfers-v050.js?v=0.5.2');
    const c = window.FLMManager.activeCareer;
    const saka = db.players.find(player => /(^|\s)Saka$/i.test(player.name));
    const haaland = db.players.find(player => /Haaland/i.test(player.name));
    return {
      saka: saka ? { name: saka.name, value: transfers.estimatePlayerValue(saka), stance: transfers.getTransferStance(saka, db, c, c.clubId) } : null,
      haaland: haaland ? { name: haaland.name, value: transfers.estimatePlayerValue(haaland), stance: transfers.getTransferStance(haaland, db, c, c.clubId) } : null
    };
  });
  expect(values.saka).toBeTruthy();
  expect(values.haaland).toBeTruthy();
  expect(values.saka.value).toBeGreaterThanOrEqual(90_000_000);
  expect(values.haaland.value).toBeGreaterThanOrEqual(130_000_000);
  expect(values.saka.stance.askingPrice).toBeGreaterThan(values.saka.value);
  expect(values.haaland.stance.askingPrice).toBeGreaterThan(values.haaland.value);
});

test('a player profile can run the full live club negotiation and go straight to personal terms', async ({ page }) => {
  const target = await page.evaluate(async () => {
    const db = await window.FLMManager.loadDatabase();
    const transfers = await import('./transfers-v050.js?v=0.5.2');
    const c = window.FLMManager.activeCareer;
    transfers.ensureTransferState(c, db);
    const budget = transfers.getTransferBudget(c).transferBudget;
    const candidates = transfers.searchTransferMarket(c, db)
      .map(player => ({ player, stance: transfers.getTransferStance(player, db, c, c.clubId) }))
      .filter(item => item.stance.askingPrice < budget * .72)
      .sort((a, b) => b.stance.value - a.stance.value);
    const picked = candidates[0];
    if (!picked) throw new Error('No affordable profile-negotiation target found.');
    await window.FLMPlayerProfile.open(picked.player.id);
    return { id: picked.player.id, name: picked.player.name, asking: picked.stance.askingPrice };
  });

  await expect(page.locator('#appModal')).toHaveClass(/is-open/);
  await expect(page.locator('#modalTitle')).toHaveText(target.name);
  await expect(page.locator('[data-v061-profile-bid]')).toBeVisible();
  await page.locator('[data-v061-profile-bid]').click();
  await expect(page.locator('[data-v061-negotiation]')).toBeVisible();
  await expect(page.locator('[data-v061-negotiation]')).toContainText('LIVE TRANSFER NEGOTIATION');

  await page.locator('[data-v061-fee]').fill(String(target.asking));
  await page.locator('[data-v061-submit-bid]').click();
  await expect(page.locator('[data-v061-submit-contract]')).toBeVisible();
  await expect(page.locator('[data-v061-negotiation]')).toContainText('FEE AGREED');

  await page.locator('[data-v061-submit-contract]').click();
  await expect(page.locator('[data-v061-negotiation]')).toContainText('DEAL COMPLETED');
  await expect.poll(async () => page.evaluate(id => {
    const c = window.FLMManager.activeCareer;
    return c.transfers?.ownership?.[id] === c.clubId;
  }, target.id)).toBe(true);
});
