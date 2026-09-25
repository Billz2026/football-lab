import { test, expect } from '@playwright/test';
import { startCareerThroughCurrentOnboarding } from './helpers/start-career.js';

test.setTimeout(60000);

test.beforeEach(async ({ page }) => {
  await page.goto('/index.html');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('new manager completes the press conference and explicitly dismisses the summary', async ({ page }) => {
  await page.locator('[data-action="new-game"]').first().click();
  await page.locator('[data-mgr-first]').fill('Alex');
  await page.locator('[data-mgr-last]').fill('Morgan');
  await page.locator('[data-mgr-nationality]').selectOption({ label: 'England' });
  await page.locator('[data-mgr-next]').click();
  await page.locator('[data-mgr-exp="none"]').click();
  await page.locator('[data-mgr-finish]').click();
  await page.locator('[data-start-club]').filter({ hasText: 'Arsenal' }).click();
  await page.getByRole('button', { name: 'TAKE CONTROL', exact: true }).click();
  await expect(page.locator('.career-app')).toHaveClass(/is-open/);

  await expect(page.locator('[data-appointment-v066="press"]')).toContainText('Alex Morgan');

  for (const style of ['humble','demanding','protective']) {
    await expect(page.locator('[data-appointment-v066="press"]')).toBeVisible();
    await expect(page.locator('[data-media-answer]')).toHaveCount(5);
    await page.locator(`[data-media-answer="${style}"]`).click();
  }

  await expect(page.locator('[data-appointment-v066="summary"]')).toBeVisible();
  const state = await page.evaluate(() => window.FLMManager.activeCareer.appointmentExperience);
  expect(state.completed).toBe(true);
  expect(Boolean(state.dismissed)).toBe(false);
  expect(state.answers).toHaveLength(3);
  expect(state.fanSentiment).toBeGreaterThanOrEqual(10);
  expect(state.fanSentiment).toBeLessThanOrEqual(95);
  expect(state.communicationStyle).toBeTruthy();

  const news = await page.evaluate(() => window.FLMManager.activeCareer.news.items.map(item => item.key));
  expect(news).toContain('first-press-conference');
  expect(news).not.toContain('manager-appointed');
  expect(news).not.toContain('fan-reaction-appointment');

  await page.locator('[data-appt-enter]').click();
  await expect(page.locator('#appModal')).not.toHaveClass(/is-open/);
  await expect.poll(async () => page.evaluate(() => window.FLMManager.activeCareer.appointmentExperience.dismissed)).toBe(true);
  const relationshipDeltas = await page.evaluate(() => Object.values(window.FLMManager.activeCareer.playerRelationships || {}).map(r => r.lastMediaReaction?.delta).filter(Number.isFinite));
  expect(relationshipDeltas.length).toBeGreaterThan(5);
});

test('dismissed appointment does not reopen when loading the career or opening a player', async ({ page }) => {
  await startCareerThroughCurrentOnboarding(page);
  await page.reload();
  await page.getByRole('button', { name: 'LOAD GAME', exact: true }).click();
  await expect(page.locator('.career-app')).toHaveClass(/is-open/);
  await page.getByRole('button', { name: 'Squad', exact: true }).click();
  await page.locator('[data-v044-profile]').first().click();
  await expect(page.locator('.flm-instant-profile')).toBeVisible();
  await expect(page.locator('#appModal')).not.toHaveClass(/is-open/);
});
