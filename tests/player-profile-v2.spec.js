import { test, expect } from '@playwright/test';

test.setTimeout(60000);

test.beforeEach(async ({ page }) => {
  await page.goto('/index.html');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('Player Profile V2.1 uses one status/value presentation, visual meters and personality behaviour', async ({ page }) => {
  await page.getByRole('button', { name: /QUICK START/ }).click();
  await page.getByRole('button', { name: 'Squad', exact: true }).click();
  await expect(page.locator('.v044-list')).toBeVisible();

  await page.locator('.v044-name strong').first().click();
  await expect(page.locator('#appModal')).toHaveClass(/is-open/);
  await expect(page.locator('#appModal')).toHaveClass(/flm-profile-v2-open/);

  const profile = page.locator('.flm-profile');
  await expect(profile).toHaveAttribute('data-profile-version', '2.1.0');
  await expect(page.locator('link[data-flm-profile-v2-style]')).toHaveCount(1);
  await expect(profile.locator('.flm-profile-status-strip .flm-status-chip')).toHaveCount(6);
  await expect(profile.locator('.flm-card-title', { hasText: 'CURRENT STATUS' })).toHaveCount(0);
  await expect(profile.locator('.v053-profile-summary small', { hasText: 'LIVE VALUE' })).toHaveCount(0);

  const meters = profile.locator('.flm-attr-meter');
  expect(await meters.count()).toBeGreaterThan(20);
  const widths = await meters.evaluateAll(nodes => nodes.map(node => node.style.getPropertyValue('--attribute-fill')));
  expect(widths.every(value => /%$/.test(value))).toBeTruthy();
  await expect(profile.locator('.flm-attr-row.is-top-attribute')).toHaveCount(5);

  const firstValue = await profile.locator('.flm-attr-value').first().textContent();
  expect(Number(firstValue)).toBeGreaterThanOrEqual(1);
  expect(Number(firstValue)).toBeLessThanOrEqual(20);

  await expect.poll(async () => page.evaluate(() => Object.keys(window.FLMManager?.activeCareer?.playerPersonalities || {}).length)).toBeGreaterThan(100);
  await expect(profile.locator('[data-personality-v2-card]')).toBeVisible();
  await expect(profile.locator('[data-personality-v2-card]')).toContainText('PLAYER CHARACTER');
  await expect(profile.locator('[data-personality-v2-card]')).toContainText('TEMPERAMENT');
});
