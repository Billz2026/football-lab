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

async function completePreseason(page) {
  const dates = ['2026-07-11','2026-07-18','2026-07-25','2026-08-01','2026-08-08'];
  for (let count = 1; count <= 5; count += 1) {
    await continueUntil(page, dates[count - 1]);
    await page.locator('[data-v047-preseason-tab]').click();
    await expect(page.getByRole('heading', { name: 'Pre-Season' })).toBeVisible();
    await page.locator('[data-v047-sim]').click();
    await expect(page.locator('.v047-fixture.is-played')).toHaveCount(count);
  }
  await page.locator('[data-v047-start]').click();
  await continueUntil(page, '2026-08-21');
}

test('News & Inbox persists read state and generates pre-season plus real round stories', async ({ page }) => {
  await page.getByRole('button', { name: /QUICK START/ }).click();
  await expect(page.locator('.career-app')).toHaveClass(/is-open/);

  const newsTab = page.locator('[data-v046-news-tab]');
  await expect(newsTab).toBeVisible();
  await expect.poll(async () => Number(await newsTab.locator('.v046-news-badge').textContent())).toBeGreaterThanOrEqual(4);
  await newsTab.click();

  await expect(page.getByRole('heading', { name: 'News & Inbox' })).toBeVisible();
  await expect(page.locator('[data-v046-filter]')).toHaveCount(6);
  await expect.poll(async () => page.locator('.v046-row').count()).toBeGreaterThanOrEqual(4);
  await expect(page.locator('.v046-list')).toContainText('Pre-season programme confirmed');

  await page.locator('[data-v046-filter="Board"]').click();
  await expect(page.locator('.v046-row')).toHaveCount(1);
  await expect(page.locator('.v046-detail')).toContainText('Board sets season expectations');
  await page.locator('[data-v046-filter="All"]').click();
  await page.locator('[data-v046-all]').click();
  await expect(page.locator('[data-v046-news-tab] .v046-news-badge')).toBeHidden();

  await completePreseason(page);
  await page.getByRole('button', { name: 'Matchday', exact: true }).click();
  await page.getByRole('button', { name: 'PLAY MATCH' }).click();
  await page.getByRole('button', { name: '4×' }).click();
  await expect(page.locator('[data-resume-second-half]')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('[data-live-clock]')).toHaveText('45:00');
  await page.locator('[data-resume-second-half]').click();
  await expect(page.locator('[data-live-clock]')).toHaveText('90:00', { timeout: 20000 });
  await page.locator('[data-finish-live-match]').click();

  const newsAfterMatch = page.locator('[data-v046-news-tab]');
  await expect(newsAfterMatch).toBeVisible();
  await expect(newsAfterMatch.locator('.v046-news-badge')).toBeVisible();
  await newsAfterMatch.click();
  await expect.poll(async () => page.locator('.v046-row').count()).toBeGreaterThanOrEqual(12);
  await expect(page.locator('.v046-list')).toContainText('Board Confidence Update');
  await expect(page.locator('.v046-list')).toContainText('R1 PM');
  await expect(page.locator('.v046-list')).toContainText('Competitive season begins');

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('flm-career-save')));
  expect(saved.news.items.some(item => item.key === 'preseason-complete')).toBeTruthy();
  expect(saved.news.items.some(item => item.key === 'match-r1')).toBeTruthy();
  expect(saved.news.items.some(item => item.key === 'board-r1')).toBeTruthy();
  expect(saved.news.items.some(item => item.category === 'Transfers')).toBeTruthy();
  expect(saved.news.generatedRounds).toEqual([1]);
});
