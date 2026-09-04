import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/index.html');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('new career completes the playable manager loop and persists', async ({ page }) => {
  await page.getByRole('button', { name: 'START NEW GAME', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'CHOOSE YOUR CLUB' })).toBeVisible();
  await page.locator('[data-start-club]').first().click();

  await expect(page.getByRole('heading', { name: /AFC Bournemouth|Arsenal|Aston Villa|Brentford|Brighton|Chelsea|Coventry|Crystal Palace/ })).toBeVisible();
  await expect(page.locator('[data-career-save-status]')).toContainText(/AUTOSAVE|SAVED/);
  await page.getByRole('button', { name: 'Squad' }).click();
  await expect(page.locator('[data-lineup-counter]')).toHaveText('11 / 11 SELECTED');

  await page.getByRole('button', { name: 'Tactics' }).click();
  await page.locator('[data-tactic="mentality"]').selectOption('Attacking');
  await page.locator('[data-tactic="pressing"]').selectOption('High');
  await page.getByRole('button', { name: 'SAVE MATCH PLAN' }).click();

  await page.getByRole('button', { name: 'Matchday' }).click();
  for (let round = 0; round < 7; round += 1) {
    await page.getByRole('button', { name: 'PLAY MATCH' }).click();
  }
  await expect(page.getByRole('heading', { name: 'Invitational complete.' })).toBeVisible();
  await page.getByRole('button', { name: 'VIEW FINAL TABLE' }).click();
  await expect(page.locator('.career-table tbody tr')).toHaveCount(8);
  await expect(page.locator('.career-table tbody tr').first()).toContainText(/\d+/);

  await page.getByRole('button', { name: 'EXIT' }).click();
  await page.getByRole('button', { name: /LOAD GAME/ }).click();
  await expect(page.getByRole('button', { name: 'CONTINUE CAREER' })).toBeVisible();
});

test('quick start launches Arsenal and mobile navigation remains usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: /QUICK START/ }).click();
  await expect(page.locator('.career-app')).toHaveClass(/is-open/);
  await expect(page.locator('.career-content')).toContainText('Arsenal');
  await page.getByRole('button', { name: 'Table' }).click();
  await expect(page.getByRole('heading', { name: 'League Table' })).toBeVisible();
});
