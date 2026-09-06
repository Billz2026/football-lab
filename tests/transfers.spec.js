import { test, expect } from '@playwright/test';

test.setTimeout(45000);

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

test('V0.6.1 transfer market completes a signing and exposes the living football world without forcing an AI deal', async ({ page }) => {
  await page.getByRole('button', { name: /QUICK START/ }).click();
  await expect(page.locator('.career-app')).toHaveClass(/is-open/);
  await openTransferWindow(page);

  // This is a transfer-workflow regression, not a budget-balancing test. Give the
  // fixture enough headroom to complete one deterministic non-rival deal; separate
  // core tests enforce real club budgets, scarcity and rivalry pricing.
  await page.evaluate(() => {
    const c = window.FLMManager.activeCareer;
    c.transfers.transferBudget = 500_000_000;
    c.transfers.initialTransferBudget = Math.max(c.transfers.initialTransferBudget || 0, 500_000_000);
    c.transfers.wageRoom = 1_000_000;
    c.transfers.initialWageRoom = Math.max(c.transfers.initialWageRoom || 0, 1_000_000);
    localStorage.setItem('flm-career-save', JSON.stringify(c));
  });

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
  await expect(page.locator('.v050-budget')).toContainText('£500');

  // Arsenal's North London rivalry can legitimately block Tottenham business.
  // Select a non-Tottenham player so the test exercises a completable negotiation.
  const targetRow = page.locator('.v050-player-row').filter({ hasNotText: 'Tottenham Hotspur' }).last();
  await expect(targetRow).toBeVisible();
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
  expect(saved.transfers.aiClubs && Object.keys(saved.transfers.aiClubs).length).toBeGreaterThan(0);
  expect(Array.isArray(saved.transfers.processedWorldPhases)).toBeTruthy();
  expect(Array.isArray(saved.transfers.rumours)).toBeTruthy();

  await page.getByRole('button', { name: 'Squad', exact: true }).click();
  await expect(page.locator('.career-content')).toContainText(targetName);
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