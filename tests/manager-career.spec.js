import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/index.html');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('live match hard-stops at half-time, supports positional roles and persists', async ({ page }) => {
  await page.getByRole('button', { name: 'START NEW GAME', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'CHOOSE YOUR CLUB' })).toBeVisible();
  await page.locator('[data-start-club]').first().click();
  await expect(page.locator('[data-career-save-status]')).toContainText(/AUTOSAVE|SAVED/);

  await page.getByRole('button', { name: 'Matchday' }).click();
  await page.getByRole('button', { name: 'PLAY MATCH' }).click();
  await expect(page.getByRole('heading', { name: 'Live Match Centre' })).toBeVisible();
  await page.getByRole('button', { name: '4×' }).click();

  await expect(page.locator('[data-resume-second-half]')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('[data-live-clock]')).toHaveText('45:00');
  await expect(page.locator('[data-match-status]')).toHaveText('HALF TIME');
  await page.waitForTimeout(350);
  await expect(page.locator('[data-live-clock]')).toHaveText('45:00');

  await page.locator('[data-open-tactics]').click();
  await page.locator('[data-live-tactic="formation"]').selectOption('5-3-2');
  await page.locator('[data-live-tactic="mentality"]').selectOption('Defensive');
  await page.locator('[data-apply-live-tactics]').click();
  await expect(page.locator('[data-shape-label]')).toHaveText('5-3-2');
  await expect(page.locator('[data-match-status]')).toHaveText('HALF TIME');

  await page.locator('[data-open-shape]').click();
  await expect(page.getByRole('heading', { name: 'Roles & Positional Shape' })).toBeVisible();
  await expect(page.locator('.flm-shape-player')).toHaveCount(11);
  await page.locator('[data-role-slot="RST"]').selectOption('Target Man');
  await page.locator('[data-apply-roles]').click();
  await expect(page.locator('[data-match-status]')).toHaveText('HALF TIME');

  await page.locator('[data-open-subs]').click();
  await expect(page.locator('[data-sub-in] option')).not.toHaveCount(0);
  await page.locator('[data-apply-sub]').click();
  await expect(page.locator('.flm-sub-status')).toContainText('4 of 5 substitutions remaining');
  await page.locator('[data-close-manager]').last().click();
  await expect(page.locator('[data-match-status]')).toHaveText('HALF TIME');

  await page.locator('[data-resume-second-half]').click();
  await expect(page.getByRole('button', { name: 'CONTINUE' })).toBeVisible({ timeout: 15000 });
  await expect(page.locator('[data-live-clock]')).toHaveText('90:00');
  await expect.poll(async () => page.locator('[data-commentary-feed] .flm-commentary-line').count(), { timeout: 15000 }).toBeGreaterThanOrEqual(35);
  await page.getByRole('button', { name: 'CONTINUE' }).click();

  await expect(page.locator('.career-content')).toContainText(/LAST RESULT|NEXT FIXTURE/);
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
