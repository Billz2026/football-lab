import { test, expect } from '@playwright/test';

test.setTimeout(60000);

test.beforeEach(async ({ page }) => {
  await page.goto('/index.html');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('Football Database player profiles are read-only even after a career has existed', async ({ page }) => {
  await page.getByRole('button', { name: /QUICK START/ }).click();
  await expect(page.locator('.career-app')).toHaveClass(/is-open/);

  const exit = page.locator('[data-exit-career]').first();
  if (await exit.count()) await exit.click();
  else await page.evaluate(() => document.querySelector('.career-app')?.classList.remove('is-open'));

  await page.locator('[data-action="database"]').first().click();
  await expect(page.locator('.database-browser')).toBeVisible();
  await page.locator('.db-player-row').first().click();
  await expect(page.locator('#appModal .flm-profile')).toBeVisible();
  await expect(page.locator('.flm-readonly-badge')).toContainText('DATABASE VIEW · READ ONLY');

  await page.waitForTimeout(100);
  await expect(page.locator('[data-v061-profile-bid]')).toHaveCount(0);
  await expect(page.locator('[data-profile-shortlist]')).toHaveCount(0);
  await expect(page.locator('[data-profile-compare]')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /MAKE TRANSFER OFFER|SUBMIT BID|SUBMIT CONTRACT OFFER/i })).toHaveCount(0);
});
