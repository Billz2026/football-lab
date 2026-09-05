import { test, expect } from '@playwright/test';

test.setTimeout(90000);

test.beforeEach(async ({ page }) => {
  await page.goto('/index.html');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

async function continueUntil(page, targetDate, maxSteps = 30) {
  for (let step = 0; step < maxSteps; step += 1) {
    const current = await page.evaluate(() => window.FLMManager.activeCareer?.currentDate || '');
    if (current >= targetDate) return;
    await page.locator('.career-header [data-v060-continue]').click();
    await page.waitForTimeout(80);
  }
  throw new Error(`Continue Game did not reach ${targetDate}`);
}

test('V0.4.7 pre-season blocks Round 1, builds readiness and hands off to the season', async ({ page }) => {
  await page.getByRole('button', { name: /QUICK START/ }).click();
  await expect(page.locator('.career-app')).toHaveClass(/is-open/);

  const preseason = page.locator('[data-v047-preseason-tab]');
  await expect(preseason).toBeVisible();
  await expect(preseason).toContainText('0/5 FRIENDLIES');
  await expect(page.getByRole('button', { name: 'Matchday', exact: true })).toBeDisabled();

  await preseason.click();
  await expect(page.getByRole('heading', { name: 'Pre-Season' })).toBeVisible();
  await expect(page.locator('.v047-fixture')).toHaveCount(5);
  await expect(page.locator('.v047-card')).toHaveCount(4);
  await page.locator('[data-v047-focus]').selectOption('Tactical');

  await continueUntil(page, '2026-07-11');
  await page.locator('[data-v047-preseason-tab]').click();
  await page.locator('[data-v047-play]').click();
  await expect(page.locator('[data-live-match]')).toBeVisible();
  await page.getByRole('button', { name: '4×' }).click();
  await expect(page.locator('[data-resume-second-half]')).toBeVisible({ timeout: 30000 });
  await expect(page.locator('[data-live-clock]')).toHaveText('45:00');
  await page.locator('[data-resume-second-half]').click();
  await expect(page.locator('[data-live-clock]')).toHaveText('90:00', { timeout: 30000 });
  await page.locator('[data-finish-live-match]').click();

  await expect(page.getByRole('heading', { name: 'Pre-Season' })).toBeVisible();
  await expect(page.locator('.v047-fixture.is-played')).toHaveCount(1);
  const savedAfterOne = await page.evaluate(() => JSON.parse(localStorage.getItem('flm-career-save')));
  expect(savedAfterOne.preseason.trainingFocus).toBe('Tactical');
  expect(savedAfterOne.preseason.tacticalFamiliarity).toBeGreaterThanOrEqual(54);
  expect(savedAfterOne.table.every(row => row.played === 0)).toBeTruthy();

  const dates = ['2026-07-18','2026-07-25','2026-08-01','2026-08-08'];
  for (let count = 2; count <= 5; count += 1) {
    await continueUntil(page, dates[count - 2]);
    await page.locator('[data-v047-preseason-tab]').click();
    await page.locator('[data-v047-sim]').click();
    await expect(page.locator('.v047-fixture.is-played')).toHaveCount(count);
  }

  await expect(page.locator('[data-v047-start]')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Matchday', exact: true })).toBeDisabled();
  await page.locator('[data-v047-start]').click();
  await expect(page.getByRole('button', { name: 'Matchday', exact: true })).toBeEnabled();

  let saved = await page.evaluate(() => JSON.parse(localStorage.getItem('flm-career-save')));
  expect(saved.preseason.phase).toBe('complete');
  expect(saved.currentDate).toBe('2026-08-08');
  expect(saved.preseason.fixtures.filter(fixture => fixture.played)).toHaveLength(5);
  expect(saved.roundIndex).toBe(0);
  expect(saved.table.every(row => row.played === 0)).toBeTruthy();
  expect(saved.news.items.some(item => item.key === 'preseason-complete')).toBeTruthy();
  expect(saved.news.items.some(item => item.key === 'competitive-season-begins')).toBeTruthy();

  await continueUntil(page, '2026-08-21');
  saved = await page.evaluate(() => JSON.parse(localStorage.getItem('flm-career-save')));
  expect(saved.currentDate).toBe('2026-08-21');
  expect(saved.worldClock.lastStopReason.type).toBe('matchday');
});
