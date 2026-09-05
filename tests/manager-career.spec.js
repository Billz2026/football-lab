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
    if (current >= targetDate) return current;
    await page.locator('.career-header [data-v060-continue]').click();
    await page.waitForTimeout(80);
  }
  throw new Error(`Continue Game did not reach ${targetDate}`);
}

async function autoPickOptionalXI(page) {
  await page.getByRole('button', { name: 'Squad', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Squad' })).toBeVisible();
  await page.locator('[data-v044-auto-pick]').click();
  await expect(page.locator('[data-v044-lineup]:checked')).toHaveCount(11);
}

async function completePreseason(page) {
  const dates = ['2026-07-11','2026-07-18','2026-07-25','2026-08-01','2026-08-08'];
  const tab = page.locator('[data-v047-preseason-tab]');
  await expect(tab).toBeVisible();
  for (let count = 1; count <= 5; count += 1) {
    await continueUntil(page, dates[count - 1]);
    await tab.click();
    await expect(page.getByRole('heading', { name: 'Pre-Season' })).toBeVisible();
    await page.locator('[data-v047-sim]').click();
    await expect(page.locator('.v047-fixture.is-played')).toHaveCount(count);
  }
  await page.locator('[data-v047-start]').click();
  await expect(page.getByRole('button', { name: 'Matchday', exact: true })).toBeEnabled();
  await continueUntil(page, '2026-08-21');
}

test('squad and tactics remain manager-controlled and position-aware', async ({ page }) => {
  await page.getByRole('button', { name: /QUICK START/ }).click();
  await expect(page.locator('.career-app')).toHaveClass(/is-open/);

  await page.getByRole('button', { name: 'Squad', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Squad' })).toBeVisible();
  await expect(page.locator('[data-v044-lineup]:checked')).toHaveCount(0);
  await expect(page.locator('[data-lineup-counter]')).toContainText('0 / 11');
  await expect(page.locator('[data-v044-auto-pick]')).toHaveText('AUTO PICK XI');
  await page.locator('[data-v044-auto-pick]').click();
  await expect(page.locator('[data-v044-lineup]:checked')).toHaveCount(11);

  await page.getByRole('button', { name: 'Tactics', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Tactics', exact: true })).toBeVisible();
  await expect(page.locator('.v048-player')).toHaveCount(11);
  await expect(page.locator('[data-v048-formation] option')).toHaveCount(8);
  const fitted = await page.locator('.v048-player.fit-preferred,.v048-player.fit-secondary,.v048-player.fit-unfamiliar').count();
  expect(fitted).toBe(11);

  await page.locator('[data-v048-formation]').selectOption('5-3-2');
  await expect(page.locator('[data-v048-slot="RWB"]')).toHaveCount(1);
  await page.locator('[data-v048-tab="with-ball"]').click();
  await page.locator('[data-v048-option="tempo"][data-value="High"]').click();
  await page.locator('[data-v048-save]').click();

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('flm-career-save')));
  expect(saved.tactics.formation).toBe('5-3-2');
  expect(saved.tactics.tempo).toBe('High');
  expect(saved.tacticalSetup.assignments).toHaveLength(11);
});

test('Matchday V2 is CM-clear, team-coloured and makes legal substitutions obvious', async ({ page }) => {
  await page.getByRole('button', { name: 'START NEW GAME', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'CHOOSE YOUR CLUB' })).toBeVisible();
  await page.locator('[data-start-club]').first().click();
  await autoPickOptionalXI(page);
  await completePreseason(page);

  await page.getByRole('button', { name: 'Matchday', exact: true }).click();
  await page.getByRole('button', { name: 'PLAY MATCH' }).click();

  const live = page.locator('[data-live-match]');
  await expect(live).toHaveAttribute('data-cm-match-v2', '1');
  await expect(page.locator('.flm-cm-v2-tabs [data-cm-v2-view]')).toHaveCount(4);
  await expect(page.locator('.flm-cm-v2-focus')).toBeVisible();
  await expect(page.getByRole('button', { name: 'PAUSE MATCH', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'MAKE SUB', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'TACTICS', exact: true }).last()).toBeVisible();

  const typography = await page.locator('.flm-cm-v2-focus').evaluate(node => {
    const text = node.querySelector('.flm-cm-v2-text');
    const style = getComputedStyle(text);
    return { fontFamily: style.fontFamily, fontSize: parseFloat(style.fontSize) };
  });
  expect(typography.fontFamily.toLowerCase()).toContain('tahoma');
  expect(typography.fontSize).toBeGreaterThanOrEqual(24);

  await page.getByRole('button', { name: '4×', exact: true }).click();
  await expect.poll(async () => page.locator('[data-commentary-feed] .flm-commentary-line').count(), { timeout: 15000 }).toBeGreaterThanOrEqual(5);
  const colouredPassages = await page.locator('[data-commentary-feed] .flm-commentary-line[data-cm-side="home"], [data-commentary-feed] .flm-commentary-line[data-cm-side="away"]').count();
  expect(colouredPassages).toBeGreaterThan(0);
  const teamColours = await live.evaluate(node => ({
    home: getComputedStyle(node).getPropertyValue('--home-color').trim(),
    away: getComputedStyle(node).getPropertyValue('--away-color').trim()
  }));
  expect(teamColours.home).not.toBe('');
  expect(teamColours.away).not.toBe('');
  expect(teamColours.home).not.toBe(teamColours.away);

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
  const keeperOff = offColumn.locator('.v2-sub-player').filter({ has: page.locator('.pos', { hasText: /^GK$/ }) }).first();
  if (await keeperOff.count()) {
    await keeperOff.click();
    const enabledIncomingPositions = await inColumn.locator('.v2-sub-player:not(:disabled) .pos').allTextContents();
    expect(enabledIncomingPositions.every(position => position.trim() === 'GK')).toBeTruthy();
    await expect(confirm).toBeDisabled();
  }

  const outfield = offColumn.locator('.v2-sub-player').filter({ hasNot: page.locator('.pos', { hasText: /^GK$/ }) }).first();
  await outfield.click();
  await expect(confirm).toBeDisabled();
  const incoming = inColumn.locator('.v2-sub-player:not(:disabled)').first();
  await expect(incoming).toBeEnabled();
  await incoming.click();
  await expect(page.locator('[data-v2-plan]')).toContainText('READY TO CONFIRM');
  await expect(confirm).toBeEnabled();
  await confirm.click();
  await expect(page.locator('.flm-sub-status')).toContainText('4 of 5 substitutions remaining');
  await page.locator('[data-close-manager]').last().click();

  await page.locator('[data-resume-second-half]').click();
  await expect(page.locator('[data-live-clock]')).toHaveText('90:00', { timeout: 30000 });
  await expect(page.locator('[data-match-status]')).toHaveText('FULL TIME');
  await expect(page.locator('[data-finish-live-match]')).toBeVisible();
});

test('quick start launches Arsenal and mobile navigation remains usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: /QUICK START/ }).click();
  await expect(page.locator('.career-app')).toHaveClass(/is-open/);
  await expect(page.locator('.career-content')).toContainText('Arsenal');
  await page.getByRole('button', { name: 'Table' }).click();
  await expect(page.getByRole('heading', { name: 'League Table' })).toBeVisible();
});
