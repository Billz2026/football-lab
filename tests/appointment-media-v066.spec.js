import { test, expect } from '@playwright/test';

test.setTimeout(60000);

test.beforeEach(async ({ page }) => {
  await page.goto('/index.html');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('new manager appointment flows through fans and a three-question press conference', async ({ page }) => {
  await page.locator('[data-action="new-game"]').first().click();
  await page.locator('[data-mgr-first]').fill('Alex');
  await page.locator('[data-mgr-last]').fill('Morgan');
  await page.locator('[data-mgr-nationality]').selectOption({ label: 'England' });
  await page.locator('[data-mgr-next]').click();
  await page.locator('[data-mgr-exp="none"]').click();
  await page.locator('[data-mgr-finish]').click();
  await page.locator('[data-start-club]').filter({ hasText: 'Arsenal' }).click();
  await expect(page.locator('.career-app')).toHaveClass(/is-open/);

  await expect(page.locator('[data-appointment-v066="announcement"]')).toBeVisible();
  await expect(page.locator('[data-appointment-v066="announcement"]')).toContainText('Alex Morgan');
  await page.locator('[data-appt-fans]').click();

  await expect(page.locator('[data-appointment-v066="fans"]')).toBeVisible();
  await expect(page.locator('[data-appointment-v066="fans"]')).toContainText('FAN SENTIMENT');
  await page.locator('[data-appt-media]').click();

  for (const style of ['humble','demanding','protective']) {
    await expect(page.locator('[data-appointment-v066="press"]')).toBeVisible();
    await expect(page.locator('[data-media-answer]')).toHaveCount(5);
    await page.locator(`[data-media-answer="${style}"]`).click();
  }

  await expect(page.locator('[data-appointment-v066="summary"]')).toBeVisible();
  const state = await page.evaluate(() => window.FLMManager.activeCareer.appointmentExperience);
  expect(state.completed).toBe(true);
  expect(state.answers).toHaveLength(3);
  expect(state.fanSentiment).toBeGreaterThanOrEqual(10);
  expect(state.fanSentiment).toBeLessThanOrEqual(95);
  expect(state.communicationStyle).toBeTruthy();

  const news = await page.evaluate(() => window.FLMManager.activeCareer.news.items.map(item => item.key));
  expect(news).toContain('manager-appointed');
  expect(news).toContain('fan-reaction-appointment');
  expect(news).toContain('first-press-conference');

  await page.locator('[data-appt-enter]').click();
  await expect(page.locator('#appModal')).not.toHaveClass(/is-open/);
  await expect.poll(async () => page.evaluate(() => window.FLMManager.activeCareer.appointmentExperience.dismissed)).toBe(true);
  const relationshipDeltas = await page.evaluate(() => Object.values(window.FLMManager.activeCareer.playerRelationships || {}).map(r => r.lastMediaReaction?.delta).filter(Number.isFinite));
  expect(relationshipDeltas.length).toBeGreaterThan(5);
});
