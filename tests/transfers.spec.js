import { test, expect } from '@playwright/test';

test.setTimeout(45000);

test.beforeEach(async ({ page }) => {
  await page.goto('/index.html');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('V0.5.2 transfer market completes a signing and exposes the living football world', async ({ page }) => {
  await page.getByRole('button', { name: /QUICK START/ }).click();
  await expect(page.locator('.career-app')).toHaveClass(/is-open/);

  const transferTab = page.locator('[data-v050-transfer-tab]');
  await expect(transferTab).toBeVisible();
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

  const targetRow = page.locator('.v050-player-row').last();
  const targetName = (await targetRow.locator('strong').textContent()).trim();
  await targetRow.click();
  await expect(page.locator('.v050-detail')).toContainText(targetName);
  await expect(page.locator('.v050-detail')).not.toContainText(/\bCA\b|overall ability/i);

  await page.locator('[data-v050-asking]').click();
  await page.locator('[data-v050-offer]').click();
  await expect(page.locator('[data-v050-contract]')).toBeVisible();
  await page.locator('[data-v050-contract]').click();

  await expect(page.locator('.v050-own-list')).toContainText(targetName);
  await expect(page.locator('.v050-message.good')).toContainText(/has signed/i);

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('flm-career-save')));
  const transfer = saved.transfers.completed.find(item => item.playerId && item.toClubId === saved.clubId);
  expect(transfer).toBeTruthy();
  expect(saved.transfers.ownership[transfer.playerId]).toBe(saved.clubId);
  expect(saved.news.items.some(item => item.category === 'Transfers' && item.relatedPlayerId === transfer.playerId)).toBeTruthy();
  expect(saved.transfers.completed.some(item => item.source === 'ai')).toBeTruthy();
  expect(saved.transfers.rumours.length).toBeGreaterThan(0);

  await page.getByRole('button', { name: 'Squad', exact: true }).click();
  await expect(page.locator('.career-content')).toContainText(targetName);
});

test('transfer market remains usable on a Fold-sized viewport', async ({ page }) => {
  await page.setViewportSize({ width: 760, height: 900 });
  await page.getByRole('button', { name: /QUICK START/ }).click();
  await page.locator('[data-v050-transfer-tab]').click();
  await expect(page.getByRole('heading', { name: 'Transfers' })).toBeVisible();
  await expect(page.locator('.v050-market-layout')).toBeVisible();
  await page.getByRole('button', { name: 'WORLD', exact: true }).click();
  await expect(page.locator('.v052-world-grid')).toBeVisible();
  const widths = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(widths.scroll).toBeLessThanOrEqual(widths.client);
});
