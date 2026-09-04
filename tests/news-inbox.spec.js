import { test, expect } from '@playwright/test';

test.setTimeout(45000);

test.beforeEach(async ({ page }) => {
  await page.goto('/index.html');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('News & Inbox persists read state and generates real round stories', async ({ page }) => {
  await page.getByRole('button', { name: /QUICK START/ }).click();
  await expect(page.locator('.career-app')).toHaveClass(/is-open/);

  const newsTab = page.locator('[data-v046-news-tab]');
  await expect(newsTab).toBeVisible();
  await expect(newsTab.locator('.v046-news-badge')).toHaveText('3');
  await newsTab.click();

  await expect(page.getByRole('heading', { name: 'News & Inbox' })).toBeVisible();
  await expect(page.locator('[data-v046-filter]')).toHaveCount(6);
  await expect(page.locator('.v046-row')).toHaveCount(3);
  await expect(page.locator('.v046-detail')).toContainText(/Welcome|fixtures confirmed|Board sets season expectations/);

  await page.locator('[data-v046-filter="Board"]').click();
  await expect(page.locator('.v046-row')).toHaveCount(1);
  await expect(page.locator('.v046-detail')).toContainText('Board sets season expectations');
  await page.locator('[data-v046-filter="All"]').click();
  await page.locator('[data-v046-all]').click();
  await expect(page.locator('[data-v046-news-tab] .v046-news-badge')).toBeHidden();

  await page.getByRole('button', { name: 'Matchday', exact: true }).click();
  await page.getByRole('button', { name: 'PLAY MATCH' }).click();
  await page.getByRole('button', { name: '4×' }).click();
  await expect(page.locator('[data-resume-second-half]')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('[data-live-clock]')).toHaveText('45:00');
  await page.locator('[data-resume-second-half]').click();
  await expect(page.locator('[data-live-clock]')).toHaveText('90:00', { timeout: 15000 });
  await page.locator('[data-finish-live-match]').click();

  const newsAfterMatch = page.locator('[data-v046-news-tab]');
  await expect(newsAfterMatch).toBeVisible();
  await expect(newsAfterMatch.locator('.v046-news-badge')).toBeVisible();
  await newsAfterMatch.click();
  await expect.poll(async () => page.locator('.v046-row').count()).toBeGreaterThanOrEqual(6);
  await expect(page.locator('.v046-list')).toContainText('Board Confidence Update');
  await expect(page.locator('.v046-list')).toContainText('R1 PM');

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('flm-career-save')));
  expect(saved.news.items.some(item => item.key === 'match-r1')).toBeTruthy();
  expect(saved.news.items.some(item => item.key === 'board-r1')).toBeTruthy();
  expect(saved.news.generatedRounds).toEqual([1]);
});
