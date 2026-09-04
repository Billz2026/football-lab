import { test, expect } from '@playwright/test';

test.setTimeout(45000);

test.beforeEach(async ({ page }) => {
  await page.goto('/index.html');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('V0.4.4 squad and pre-match tactics expose position fit without visible overall ability', async ({ page }) => {
  await page.getByRole('button', { name: /QUICK START/ }).click();
  await expect(page.locator('.career-app')).toHaveClass(/is-open/);

  await page.getByRole('button', { name: 'Squad', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Squad' })).toBeVisible();
  await expect(page.locator('.v044-list')).toBeVisible();
  await expect(page.locator('.v044-star')).toHaveCount(3);
  await expect(page.locator('.v044-head')).not.toContainText('CA');
  await expect(page.locator('.v044-head')).toContainText('PREFERRED');
  await expect(page.locator('.v044-head')).toContainText('ALTERNATIVES');
  expect(await page.locator('.v044-row').count()).toBeGreaterThan(11);

  await page.getByRole('button', { name: 'Tactics', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Tactics Centre' })).toBeVisible();
  await expect(page.locator('.v044-player')).toHaveCount(11);
  await expect(page.locator('[data-v044-tactic="formation"] option')).toHaveCount(8);
  expect(await page.locator('.v044-player.fit-preferred').count()).toBeGreaterThan(0);
  const fitted = await page.locator('.v044-player.fit-preferred,.v044-player.fit-secondary,.v044-player.fit-unfamiliar').count();
  expect(fitted).toBe(11);

  await page.locator('[data-v044-tactic="formation"]').selectOption('5-3-2');
  await expect(page.locator('.v044-player')).toHaveCount(11);
  await expect(page.locator('.v044-player').filter({ hasText: 'RWB' })).toHaveCount(1);
  await page.locator('[data-v044-apply]').click();

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('flm-career-save')));
  expect(saved.tactics.formation).toBe('5-3-2');
  expect(saved.tacticalSetup.formation).toBe('5-3-2');
  expect(saved.tacticalSetup.assignments).toHaveLength(11);
});

test('V0.4.5 Match Centre exposes immersive live views and still hard-stops at half-time', async ({ page }) => {
  await page.getByRole('button', { name: 'START NEW GAME', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'CHOOSE YOUR CLUB' })).toBeVisible();
  await page.locator('[data-start-club]').first().click();
  await expect(page.locator('[data-career-save-status]')).toContainText(/AUTOSAVE|SAVED/);

  await page.getByRole('button', { name: 'Matchday', exact: true }).click();
  await page.getByRole('button', { name: 'PLAY MATCH' }).click();
  await expect(page.locator('[data-live-match]')).toHaveAttribute('data-v045-match', '1');
  await expect(page.getByRole('heading', { name: 'Match Centre' })).toBeVisible();
  await expect(page.locator('[data-v045-context]')).toContainText('VENUE');
  await expect(page.locator('[data-v045-context]')).toContainText('ATTENDANCE');
  await expect(page.locator('[data-v045-context]')).toContainText('REFEREE');
  await expect(page.locator('[data-v045-context]')).toContainText('WEATHER');
  await expect(page.locator('[data-v045-view]')).toHaveCount(4);
  await expect(page.locator('[data-v045-event]')).toBeVisible();

  await page.locator('[data-v045-view="stats"]').click();
  await expect(page.locator('[data-v045-custom-view]')).toContainText('Match Stats');
  await page.locator('[data-v045-view="zones"]').click();
  await expect(page.locator('[data-v045-custom-view]')).toContainText('Action Zones');
  await page.locator('[data-v045-bottom="latest"]').click();
  await expect(page.locator('[data-v045-custom-view]')).toContainText('Latest Scores');
  expect(await page.locator('.v045-score-row').count()).toBeGreaterThanOrEqual(4);
  await page.locator('[data-v045-bottom="table"]').click();
  await expect(page.locator('[data-v045-custom-view]')).toContainText('Live League Table');
  await expect(page.locator('.v045-table tr.is-user')).toHaveCount(1);
  await page.locator('[data-v045-view="overview"]').click();

  await page.getByRole('button', { name: '4×' }).click();
  await expect(page.locator('[data-resume-second-half]')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('[data-live-clock]')).toHaveText('45:00');
  await expect(page.locator('[data-match-status]')).toHaveText('HALF TIME');
  await expect(page.locator('[data-v045-event]')).toContainText('HALF TIME');
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
  await page.locator('[data-sub-out]').selectOption({ index: 1 });
  await page.locator('[data-apply-sub]').click();
  await expect(page.locator('.flm-sub-status')).toContainText('4 of 5 substitutions remaining');
  await page.locator('[data-close-manager]').last().click();
  await expect(page.locator('[data-match-status]')).toHaveText('HALF TIME');

  await page.locator('[data-resume-second-half]').click();
  await expect(page.locator('[data-live-clock]')).toHaveText('90:00', { timeout: 15000 });
  await expect(page.locator('[data-finish-live-match]')).toBeVisible();
  await expect(page.locator('[data-v045-event]')).toContainText('FULL TIME');
  await expect.poll(async () => page.locator('[data-commentary-feed] .flm-commentary-line').count(), { timeout: 15000 }).toBeGreaterThanOrEqual(35);
  await page.locator('[data-finish-live-match]').click();

  await expect(page.locator('.career-page-heading')).toContainText('ROUND 2');
  await expect(page.locator('.career-commentary')).toContainText('PREVIOUS MATCH');
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