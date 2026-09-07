import { test, expect } from '@playwright/test';

test.setTimeout(60000);

test.beforeEach(async ({ page }) => {
  await page.goto('/index.html');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

async function openTransferWindow(page) {
  await expect(page.locator('.v054-date-chip')).toContainText('5 JUN 2026');
  await page.locator('[data-v054-advance]').click();
  await expect(page.locator('.v054-date-chip')).toContainText('15 JUN 2026');
  await expect(page.locator('[data-v050-transfer-tab]')).toBeVisible();
}

test('V0.6.1 transfer market completes a signing through club and player negotiations and exposes the living football world', async ({ page }) => {
  await page.getByRole('button', { name: /QUICK START/ }).click();
  await expect(page.locator('.career-app')).toHaveClass(/is-open/);
  await openTransferWindow(page);

  const transferTab = page.locator('[data-v050-transfer-tab]');
  await transferTab.click();
  await expect(page.getByRole('heading', { name: 'Transfers' })).toBeVisible();
  await expect(page.locator('.v052-window-strip')).toBeVisible();
  await expect(page.locator('.v052-window-strip')).toContainText(/OPEN|DEADLINE/);
  await expect(page.getByRole('button', { name: /^OFFERS/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'WORLD', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'WORLD', exact: true }).click();
  await expect(page.locator('.v052-world-grid')).toBeVisible();
  await expect(page.locator('.v052-world-grid')).toContainText('COMPLETED DEALS');
  await page.getByRole('button', { name: 'MARKET', exact: true }).click();

  await expect(page.locator('.v050-player-row')).not.toHaveCount(0);
  await expect(page.locator('.v050-budget')).toContainText('TRANSFER BUDGET');

  const firstRow = page.locator('.v050-player-row').first();
  const firstName = (await firstRow.locator('strong').textContent()).trim();
  await firstRow.click();
  await expect(page.locator('.v050-detail')).toContainText(firstName);
  await expect(page.locator('.v050-detail')).not.toContainText(/\bCA\b|overall ability/i);

  // Rivalry premiums can make a low-value market row unaffordable. Resolve a real target
  // from the live asking-price model instead of assuming list position equals affordability.
  const target = await page.evaluate(async () => {
    const db = await window.FLMManager.loadDatabase();
    const transfers = await import('./transfers-v050.js?v=0.5.2');
    const c = window.FLMManager.activeCareer;
    transfers.ensureTransferState(c, db);
    const budget = transfers.getTransferBudget(c).transferBudget;
    const candidates = transfers.searchTransferMarket(c, db)
      .map(player => ({ player, stance: transfers.getTransferStance(player, db, c, c.clubId) }))
      .filter(item => item.stance.askingPrice > 0 && item.stance.askingPrice < budget * 0.72)
      .sort((a, b) => b.stance.value - a.stance.value);
    const picked = candidates[0];
    if (!picked) throw new Error('No affordable profile-negotiation target found.');
    await window.FLMPlayerProfile.open(picked.player.id);
    return { id: picked.player.id, name: picked.player.name, asking: picked.stance.askingPrice };
  });

  await expect(page.locator('#appModal')).toHaveClass(/is-open/);
  await expect(page.locator('#modalTitle')).toContainText(target.name);
  const bidAction = page.locator('[data-v061-profile-bid]');
  await expect(bidAction).toBeVisible();
  await expect(bidAction).toBeEnabled();
  await bidAction.click();

  const negotiation = page.locator('[data-v061-negotiation]');
  await expect(negotiation).toBeVisible();
  const playerId = await negotiation.getAttribute('data-v061-negotiation');
  expect(playerId).toBe(target.id);
  const terms = await page.evaluate(id => {
    const c = window.FLMManager.activeCareer;
    const n = c.transfers.negotiations[id];
    return {
      askingPrice: n?.askingPrice || 0,
      transferBudget: c.transfers.transferBudget,
      wageRoom: c.transfers.wageRoom
    };
  }, playerId);
  expect(terms.askingPrice).toBe(target.asking);
  expect(terms.askingPrice).toBeGreaterThan(0);
  expect(terms.askingPrice).toBeLessThanOrEqual(terms.transferBudget);

  await negotiation.locator('[data-v061-fee]').fill(String(terms.askingPrice));
  await negotiation.locator('[data-v061-submit-bid]').click();
  await expect(page.locator('[data-v061-submit-contract]')).toBeVisible();

  const wageDemand = await page.evaluate(id => window.FLMManager.activeCareer.transfers.negotiations[id]?.wageDemand || 0, playerId);
  const wageRoom = await page.evaluate(() => window.FLMManager.activeCareer.transfers.wageRoom);
  expect(wageDemand).toBeGreaterThan(0);
  expect(wageDemand).toBeLessThanOrEqual(wageRoom);
  await page.locator('[data-v061-wage]').fill(String(wageDemand));
  await page.locator('[data-v061-submit-contract]').click();
  await expect(page.locator('.v061-complete')).toContainText('DEAL COMPLETED');

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('flm-career-save')));
  const transfer = saved.transfers.completed.find(item => item.playerId === playerId && item.toClubId === saved.clubId);
  expect(transfer).toBeTruthy();
  expect(saved.transfers.ownership[playerId]).toBe(saved.clubId);
  expect(saved.news.items.some(item => item.category === 'Transfers' && item.relatedPlayerId === playerId)).toBeTruthy();
  expect(saved.transfers.aiClubs && Object.keys(saved.transfers.aiClubs).length).toBeGreaterThan(0);
  expect(Array.isArray(saved.transfers.processedWorldPhases)).toBeTruthy();
  expect(Array.isArray(saved.transfers.rumours)).toBeTruthy();

  await page.locator('[data-v061-close]').click();
  await page.locator('.modal-close').click();
  await page.getByRole('button', { name: 'Squad', exact: true }).click();
  await expect(page.locator('.career-content')).toContainText(target.name);
});

test('transfer market remains usable on a Fold-sized viewport', async ({ page }) => {
  await page.setViewportSize({ width: 760, height: 900 });
  await page.getByRole('button', { name: /QUICK START/ }).click();
  await openTransferWindow(page);
  await page.locator('[data-v050-transfer-tab]').click();
  await expect(page.getByRole('heading', { name: 'Transfers' })).toBeVisible();
  await expect(page.locator('.v050-market-layout')).toBeVisible();
  await page.getByRole('button', { name: 'WORLD', exact: true }).click();
  await expect(page.locator('.v052-world-grid')).toBeVisible();
  const widths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.client);
});
