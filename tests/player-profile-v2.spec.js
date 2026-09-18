import { test, expect } from '@playwright/test';
import { openFirstSquadProfile } from './helpers/current-ui.js';

test.setTimeout(60000);

test.beforeEach(async ({ page }) => {
  await page.goto('/index.html');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('integrated player profile exposes attributes, status, development and navigation without a legacy modal', async ({ page }) => {
  await page.getByRole('button', { name: /QUICK START/ }).click();
  await page.getByRole('button', { name: 'Squad', exact: true }).click();
  await expect(page.locator('.v044-list')).toBeVisible();

  await openFirstSquadProfile(page);
  const profile = page.locator('[data-flm-instant-profile]');
  await expect(profile).toBeVisible();
  await expect(page.locator('#appModal')).not.toHaveClass(/is-open/);
  await expect(page.locator('link[data-flm-fast-profile]')).toHaveCount(1);

  await expect(profile.locator('.flm-ip-tabs [data-flm-profile-tab]')).toHaveCount(6);
  await expect(profile.locator('.flm-ip-card-title', { hasText: 'TECHNICAL' })).toHaveCount(1);
  await expect(profile.locator('.flm-ip-card-title', { hasText: 'MENTAL' })).toHaveCount(1);
  await expect(profile.locator('.flm-ip-card-title', { hasText: 'PHYSICAL' })).toHaveCount(1);
  await expect(profile.locator('.flm-ip-card-title', { hasText: 'STATUS' })).toHaveCount(1);
  await expect(profile.locator('.flm-ip-card-title', { hasText: 'PERSONAL' })).toHaveCount(1);
  await expect(profile.locator('.flm-ip-card-title', { hasText: 'POSITIONS' })).toHaveCount(1);

  const attributes = profile.locator('.flm-ip-attribute-row');
  expect(await attributes.count()).toBeGreaterThan(20);
  const values = await attributes.locator('strong').allTextContents();
  expect(values.every(value => {
    const number = Number(value.trim());
    return Number.isFinite(number) && number >= 1 && number <= 20;
  })).toBeTruthy();

  await profile.getByRole('button', { name: 'DEVELOPMENT', exact: true }).click();
  await expect(profile.locator('[data-flm-profile-panel]')).toContainText('DEVELOPMENT');
  await expect(profile.locator('[data-flm-profile-panel]')).toContainText('Personality');
  await expect(profile.locator('[data-flm-profile-panel]')).toContainText(/Current Ability.*Potential Ability.*remain concealed/i);

  await profile.getByRole('button', { name: 'CONTRACT', exact: true }).click();
  await expect(profile.locator('[data-flm-profile-panel]')).toContainText('Weekly wage');
  await expect(profile.locator('[data-flm-profile-panel]')).toContainText('Expiry');
});
