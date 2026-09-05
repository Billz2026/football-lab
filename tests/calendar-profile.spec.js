import { test, expect } from '@playwright/test';

test.setTimeout(60000);

test.beforeEach(async ({ page }) => {
  await page.goto('/index.html');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('career starts in June, gates transfers and releases fixtures on 19 June', async ({ page }) => {
  await page.getByRole('button', { name: /QUICK START/ }).click();
  await expect(page.locator('.career-app')).toHaveClass(/is-open/);
  await expect(page.locator('.v054-date-chip')).toContainText('5 JUN 2026');

  const transfer = page.locator('[data-v050-transfer-tab]');
  await expect(transfer).toHaveClass(/v054-lock-nav/);
  await expect(transfer).toContainText('15 JUN');

  const fixtures = page.locator('[data-v051-fixtures]');
  await expect(fixtures).toHaveClass(/v054-lock-nav/);
  await fixtures.click();
  await expect(page.getByRole('heading', { name: 'Fixtures not released yet' })).toBeVisible();
  await expect(page.locator('.v054-locked')).toContainText('FRIDAY 19 JUNE 2026 · 10:00 BST');

  await page.locator('[data-v054-advance]').click();
  await expect(page.locator('.v054-date-chip')).toContainText('15 JUN 2026');
  await expect(transfer).not.toHaveClass(/v054-lock-nav/);

  await expect(page.locator('[data-v054-advance]')).toBeVisible();
  await page.locator('[data-v054-advance]').click();
  await expect(page.locator('.v054-date-chip')).toContainText('19 JUN 2026');
  await expect(fixtures).not.toHaveClass(/v054-lock-nav/);

  await fixtures.click();
  await expect(page.getByRole('heading', { name: 'Fixtures & Results' })).toBeVisible();
  await expect(page.locator('.v051-fixture-row')).toHaveCount(38);

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('flm-career-save')));
  expect(saved.currentDate).toBe('2026-06-19');
  expect(saved.calendar.fixturesReleased).toBeTruthy();
  expect(saved.news.items.some(item => item.key === 'fixture-release')).toBeTruthy();
  expect(saved.news.items.some(item => item.key === 'summer-window-opens')).toBeTruthy();
});

test('player profiles browse instantly with next previous and jump controls', async ({ page }) => {
  await page.getByRole('button', { name: /QUICK START/ }).click();
  await page.getByRole('button', { name: 'Squad', exact: true }).click();
  await expect(page.locator('.v044-list')).toBeVisible();

  await page.locator('.v044-name strong').first().click();
  await expect(page.locator('#appModal')).toHaveClass(/is-open/);
  await expect(page.locator('.v054-browser')).toBeVisible();
  const firstName = await page.locator('#modalTitle').textContent();
  await expect(page.locator('[data-v054-jump] option')).toHaveCount(await page.locator('.v044-row').count());

  const next = page.locator('[data-v054-next]');
  await expect(next).toBeEnabled();
  await next.click();
  await expect(page.locator('#modalTitle')).not.toHaveText(firstName || '');
  const secondName = await page.locator('#modalTitle').textContent();

  await page.locator('[data-v054-prev]').click();
  await expect(page.locator('#modalTitle')).toHaveText(firstName || '');

  const jump = page.locator('[data-v054-jump]');
  const values = await jump.locator('option').evaluateAll(options => options.map(option => option.value));
  expect(values.length).toBeGreaterThan(2);
  await jump.selectOption(values[2]);
  await expect(page.locator('#modalTitle')).not.toHaveText(firstName || '');
  expect(await page.locator('#modalTitle').textContent()).not.toBe(secondName);
});
