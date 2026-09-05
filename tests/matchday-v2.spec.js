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

async function selectXI(page) {
  await page.getByRole('button', { name: 'Squad', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Squad' })).toBeVisible();
  await page.locator('[data-v044-auto-pick]').click();
  await expect(page.locator('[data-v044-lineup]:checked')).toHaveCount(11);
}

async function completePreseason(page) {
  const dates = ['2026-07-11','2026-07-18','2026-07-25','2026-08-01','2026-08-08'];
  const tab = page.locator('[data-v047-preseason-tab]');
  await expect(tab).toBeVisible();
  for (let count = 1; count <= dates.length; count += 1) {
    await continueUntil(page, dates[count - 1]);
    await tab.click();
    await page.locator('[data-v047-sim]').click();
    await expect(page.locator('.v047-fixture.is-played')).toHaveCount(count);
  }
  await page.locator('[data-v047-start]').click();
  await continueUntil(page, '2026-08-21');
}

test('Matchday V2 delivers CM-style clarity, club colours and safe click substitutions', async ({ page }) => {
  await page.getByRole('button', { name: 'START NEW GAME', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'CHOOSE YOUR CLUB' })).toBeVisible();
  await page.locator('[data-start-club]').first().click();
  await selectXI(page);
  await completePreseason(page);

  await page.getByRole('button', { name: 'Matchday', exact: true }).click();
  await page.getByRole('button', { name: 'PLAY MATCH' }).click();

  const live = page.locator('[data-live-match]');
  await expect(live).toHaveAttribute('data-cm-match-v2', '1');
  await expect(page.locator('.flm-cm-v2-tabs [data-cm-v2-view]')).toHaveCount(4);
  await expect(page.locator('.flm-cm-v2-focus')).toBeVisible();

  const typography = await page.locator('.flm-cm-v2-focus .flm-cm-v2-text').evaluate(node => {
    const style = getComputedStyle(node);
    return { family: style.fontFamily.toLowerCase(), size: parseFloat(style.fontSize) };
  });
  expect(typography.family).toContain('tahoma');
  expect(typography.size).toBeGreaterThanOrEqual(24);

  const controls = ['PAUSE MATCH', 'MAKE SUB', 'TACTICS'];
  for (const label of controls) await expect(page.getByRole('button', { name: label, exact: true }).last()).toBeVisible();

  const colours = await live.evaluate(node => ({
    home: getComputedStyle(node).getPropertyValue('--home-color').trim(),
    away: getComputedStyle(node).getPropertyValue('--away-color').trim()
  }));
  expect(colours.home).toBeTruthy();
  expect(colours.away).toBeTruthy();
  expect(colours.home).not.toBe(colours.away);

  await page.getByRole('button', { name: '4×', exact: true }).click();
  await expect.poll(async () => page.locator('[data-commentary-feed] .flm-commentary-line').count(), { timeout: 15000 }).toBeGreaterThanOrEqual(5);
  const teamPassages = page.locator('[data-commentary-feed] .flm-commentary-line[data-cm-side="home"], [data-commentary-feed] .flm-commentary-line[data-cm-side="away"]');
  await expect.poll(async () => teamPassages.count(), { timeout: 15000 }).toBeGreaterThan(0);
  const currentTextSize = await page.locator('.flm-cm-v2-focus .flm-cm-v2-text').evaluate(node => parseFloat(getComputedStyle(node).fontSize));
  expect(currentTextSize).toBeGreaterThanOrEqual(24);

  await expect(page.locator('[data-resume-second-half]')).toBeVisible({ timeout: 30000 });
  await expect(page.locator('[data-live-clock]')).toHaveText('45:00');
  await page.waitForTimeout(300);
  await expect(page.locator('[data-live-clock]')).toHaveText('45:00');

  await page.getByRole('button', { name: 'MAKE SUB', exact: true }).click();
  await expect(page.locator('.v2-sub-shell')).toBeVisible();
  const confirm = page.locator('[data-apply-sub]');
  await expect(confirm).toHaveText('CONFIRM SUBSTITUTION');
  await expect(confirm).toBeDisabled();

  const offColumn = page.locator('.v2-sub-column').nth(0);
  const inColumn = page.locator('.v2-sub-column').nth(1);
  const goalkeeper = offColumn.locator('.v2-sub-player').filter({ has: page.locator('.pos', { hasText: /^GK$/ }) }).first();
  if (await goalkeeper.count()) {
    await goalkeeper.click();
    const enabled = await inColumn.locator('.v2-sub-player:not(:disabled) .pos').allTextContents();
    expect(enabled.every(position => position.trim() === 'GK')).toBeTruthy();
    await expect(confirm).toBeDisabled();
  }

  const outfield = offColumn.locator('.v2-sub-player').filter({ hasNot: page.locator('.pos', { hasText: /^GK$/ }) }).first();
  await outfield.click();
  const replacement = inColumn.locator('.v2-sub-player:not(:disabled)').first();
  await expect(replacement).toBeEnabled();
  await replacement.click();
  await expect(page.locator('[data-v2-plan]')).toContainText('READY TO CONFIRM');
  await expect(confirm).toBeEnabled();
  await confirm.click();
  await expect(page.locator('.flm-sub-status')).toContainText('4 of 5 substitutions remaining');
});
