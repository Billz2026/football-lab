import { test, expect } from '@playwright/test';
import { continueGame, openFirstSquadProfile } from './helpers/current-ui.js';

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

  const transferGate = page.locator('[data-v054-transfer-gate]');
  await expect(transferGate).toHaveClass(/v054-lock-nav/);
  await expect(transferGate).toContainText('15 JUN');
  await expect(page.locator('[data-v050-transfer-tab]')).toHaveCount(0);
  const beforeWindow = await page.evaluate(() => JSON.parse(localStorage.getItem('flm-career-save')));
  expect(beforeWindow.currentDate).toBe('2026-06-05');
  expect(beforeWindow.transfers?.completed || []).toHaveLength(0);
  expect(beforeWindow.transfers?.incomingOffers || []).toHaveLength(0);

  const fixtures = page.locator('[data-v051-fixtures]');
  await expect(fixtures).toHaveClass(/v054-lock-nav/);
  await fixtures.click();
  await expect(page.getByRole('heading', { name: 'Fixtures not released yet' })).toBeVisible();
  await expect(page.locator('.v054-locked')).toContainText('19 JUN 2026 · 10:00 BST');

  await continueGame(page);
  await expect(page.locator('.v054-date-chip')).toContainText('15 JUN 2026');
  await expect(transferGate).toHaveCount(0);
  await expect(page.locator('[data-v050-transfer-tab]')).toBeVisible();

  await continueGame(page);
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

test('integrated player profiles browse instantly with previous and next controls', async ({ page }) => {
  await page.getByRole('button', { name: /QUICK START/ }).click();
  await page.getByRole('button', { name: 'Squad', exact: true }).click();
  await expect(page.locator('.v044-list')).toBeVisible();

  await openFirstSquadProfile(page);
  const profile = page.locator('[data-flm-instant-profile]');
  await expect(profile).toBeVisible();
  await expect(page.locator('#appModal')).not.toHaveClass(/is-open/);

  const heading = profile.locator('.flm-ip-title h2');
  const firstName = (await heading.textContent()) || '';
  const previous = profile.getByRole('button', { name: /PREVIOUS/ });
  const next = profile.getByRole('button', { name: /NEXT/ });
  await expect(previous).toBeVisible();
  await expect(next).toBeVisible();

  await next.click();
  await expect(heading).not.toHaveText(firstName);
  const secondName = (await heading.textContent()) || '';
  expect(secondName).not.toBe(firstName);

  await previous.click();
  await expect(heading).toHaveText(firstName);

  await profile.getByRole('button', { name: 'TRANSFER', exact: true }).click();
  await expect(profile.locator('[data-flm-profile-panel]')).toContainText('TRANSFER STATUS');
  await profile.getByRole('button', { name: 'PROFILE', exact: true }).click();
  await expect(profile.locator('[data-flm-profile-panel]')).toContainText('STATUS');
});
