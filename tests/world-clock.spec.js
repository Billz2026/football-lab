import { test, expect } from '@playwright/test';

test.setTimeout(90000);

test.beforeEach(async ({ page }) => {
  await page.goto('/index.html');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

async function quickStart(page) {
  await page.getByRole('button', { name: /QUICK START/ }).click();
  await expect(page.locator('.career-app')).toHaveClass(/is-open/);
  await expect(page.locator('[data-v060-continue]').first()).toBeVisible();
}

async function continueUntil(page, targetDate, maxSteps = 30) {
  for (let step = 0; step < maxSteps; step += 1) {
    const current = await page.evaluate(() => window.FLMManager.activeCareer?.currentDate || '');
    if (current >= targetDate) return current;
    await page.locator('.career-header [data-v060-continue]').click();
    await page.waitForTimeout(80);
  }
  throw new Error(`Continue Game did not reach ${targetDate}`);
}

test('Continue Game advances the career day by day and stops on June milestones', async ({ page }) => {
  await quickStart(page);
  await expect(page.locator('.v054-date-chip')).toContainText('5 JUN 2026');
  await expect(page.locator('.v060-world-panel')).toContainText('Summer transfer window opens');

  await page.locator('.v060-world-panel [data-v060-continue]').click();
  await expect(page.locator('.v054-date-chip')).toContainText('15 JUN 2026');
  await expect(page.locator('[data-v050-transfer-tab]')).toBeVisible();

  await page.locator('.v060-world-panel [data-v060-continue]').click();
  await expect(page.locator('.v054-date-chip')).toContainText('19 JUN 2026');
  await expect(page.locator('[data-v051-fixtures]')).not.toHaveClass(/v054-lock-nav/);

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('flm-career-save')));
  expect(saved.currentDate).toBe('2026-06-19');
  expect(saved.calendar.schemaVersion).toBe(2);
  expect(saved.worldClock.schemaVersion).toBe(1);
  expect(saved.worldClock.totalDaysAdvanced).toBe(14);
  expect(saved.worldClock.history.length).toBeGreaterThanOrEqual(2);
});

test('future friendlies cannot be played early and Continue Game stops on the scheduled date', async ({ page }) => {
  await quickStart(page);
  await page.locator('.v060-world-panel [data-v060-continue]').click();
  await page.locator('.v060-world-panel [data-v060-continue]').click();
  await expect(page.locator('.v054-date-chip')).toContainText('19 JUN 2026');

  await page.locator('[data-v047-preseason-tab]').click();
  await expect(page.getByRole('heading', { name: 'Pre-Season' })).toBeVisible();
  await page.locator('[data-v047-sim]').click();
  await expect(page.locator('.career-toast')).toContainText('11 JUL 2026');
  let saved = await page.evaluate(() => JSON.parse(localStorage.getItem('flm-career-save')));
  expect(saved.currentDate).toBe('2026-06-19');
  expect(saved.preseason.fixtures.filter(item => item.played)).toHaveLength(0);

  await continueUntil(page, '2026-07-11');
  await expect(page.locator('.v054-date-chip')).toContainText('11 JUL 2026');
  await expect(page.getByRole('heading', { name: 'Pre-Season' })).toBeVisible();
  saved = await page.evaluate(() => JSON.parse(localStorage.getItem('flm-career-save')));
  expect(saved.currentDate).toBe('2026-07-11');
  expect(saved.worldClock.lastStopReason.type).toBe('friendly');
});

test('finishing pre-season no longer jumps straight to opening day; Continue Game takes the manager there', async ({ page }) => {
  await quickStart(page);
  await page.evaluate(() => {
    const c = window.FLMManager.activeCareer;
    c.calendar.currentDate = '2026-08-08';
    c.currentDate = '2026-08-08';
    c.calendar.fixturesReleased = true;
    c.worldClock.acknowledgedMilestones = ['summer-window-open', 'fixture-release'];
    c.preseason.fixtures.forEach(fixture => { fixture.played = true; });
    c.preseason.phase = 'ready';
    localStorage.setItem('flm-career-save', JSON.stringify(c));
  });
  await page.locator('[data-v047-preseason-tab]').click();
  await expect(page.locator('[data-v047-start]')).toBeVisible();
  await page.locator('[data-v047-start]').click();
  await expect(page.locator('.v054-date-chip')).toContainText('8 AUG 2026');

  let saved = await page.evaluate(() => JSON.parse(localStorage.getItem('flm-career-save')));
  expect(saved.preseason.phase).toBe('complete');
  expect(saved.currentDate).toBe('2026-08-08');

  await continueUntil(page, '2026-08-21');
  await expect(page.locator('.v054-date-chip')).toContainText('21 AUG 2026');
  await expect(page.getByRole('heading', { name: 'Matchday' })).toBeVisible();
  saved = await page.evaluate(() => JSON.parse(localStorage.getItem('flm-career-save')));
  expect(saved.currentDate).toBe('2026-08-21');
  expect(saved.worldClock.lastStopReason.type).toBe('matchday');
});

test('a Premier League fixture cannot be played before its calendar date', async ({ page }) => {
  await quickStart(page);
  await page.evaluate(() => {
    const c = window.FLMManager.activeCareer;
    c.preseason.fixtures.forEach(fixture => { fixture.played = true; });
    c.preseason.phase = 'complete';
    c.calendar.currentDate = '2026-08-20';
    c.currentDate = '2026-08-20';
    c.calendar.fixturesReleased = true;
    c.worldClock.acknowledgedMilestones = ['summer-window-open', 'fixture-release'];
    localStorage.setItem('flm-career-save', JSON.stringify(c));
  });
  await page.locator('.career-nav [data-career-tab="matchday"]').click();
  await expect(page.locator('[data-play-match]')).toBeVisible();
  await page.locator('[data-play-match]').click();
  await expect(page.locator('.career-toast')).toContainText('21 AUG 2026');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('flm-career-save')));
  expect(saved.roundIndex).toBe(0);
  expect(saved.currentDate).toBe('2026-08-20');
});
