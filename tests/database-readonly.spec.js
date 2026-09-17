import { test, expect } from '@playwright/test';
import { exitCareer } from './helpers/current-ui.js';

test.setTimeout(60000);

test.beforeEach(async ({ page }) => {
  await page.goto('/index.html');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('Football Database player profiles are read-only even after a career has existed', async ({ page }) => {
  await page.getByRole('button', { name: /QUICK START/ }).click();
  await expect(page.locator('.career-app')).toHaveClass(/is-open/);

  await exitCareer(page);

  await page.locator('[data-action="database"]:visible').first().click();
  await expect(page.locator('.database-browser')).toBeVisible();
  await page.locator('.db-player-row:visible').first().click();
  await expect(page.locator('#appModal')).toHaveClass(/is-open/);
  await expect(page.locator('#appModal .flm-profile')).toBeVisible();
  await expect(page.locator('.flm-readonly-badge')).toContainText('DATABASE VIEW · READ ONLY');

  await page.waitForTimeout(100);
  await expect(page.locator('[data-v061-profile-bid]')).toHaveCount(0);
  await expect(page.locator('[data-profile-shortlist]')).toHaveCount(0);
  await expect(page.locator('[data-profile-compare]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /MAKE TRANSFER OFFER|SUBMIT BID|SUBMIT CONTRACT OFFER/i })).toHaveCount(0);
});
