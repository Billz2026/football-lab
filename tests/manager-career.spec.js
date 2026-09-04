import { test, expect } from '@playwright/test';

test.setTimeout(60000);

test.beforeEach(async ({ page }) => {
  await page.goto('/index.html');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

async function completePreseason(page) {
  const tab = page.locator('[data-v047-preseason-tab]');
  await expect(tab).toBeVisible();
  await tab.click();
  for (let count = 1; count <= 5; count += 1) {
    await page.locator('[data-v047-sim]').click();
    await expect(page.locator('.v047-fixture.is-played')).toHaveCount(count);
  }
  await page.locator('[data-v047-start]').click();
  await expect(page.getByRole('button', { name: 'Matchday', exact: true })).toBeEnabled();
}

test('V0.4.8 squad stars and CM-style drag/drop tactics are accurate and usable', async ({ page }) => {
  await page.getByRole('button', { name: /QUICK START/ }).click();
  await expect(page.locator('.career-app')).toHaveClass(/is-open/);

  await page.getByRole('button', { name: 'Squad', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Squad' })).toBeVisible();
  await expect(page.locator('.v044-list')).toBeVisible();
  await expect(page.locator('.v048-star')).toHaveCount(3);
  await expect(page.locator('.v044-list')).toContainText('B. Saka');
  await expect(page.locator('.v044-list')).toContainText('D. Rice');
  await expect(page.locator('.v044-list')).toContainText('M. Ødegaard');
  await expect(page.locator('.v044-head')).not.toContainText('CA');
  expect(await page.locator('.v044-row').count()).toBeGreaterThan(11);

  await page.getByRole('button', { name: 'Tactics', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Tactics', exact: true })).toBeVisible();
  await expect(page.locator('.v048-tactics')).toBeVisible();
  await expect(page.locator('.v048-player')).toHaveCount(11);
  await expect(page.locator('[data-v048-formation] option')).toHaveCount(8);
  expect(await page.locator('.v048-player.fit-preferred').count()).toBeGreaterThan(0);
  const fitted = await page.locator('.v048-player.fit-preferred,.v048-player.fit-secondary,.v048-player.fit-unfamiliar').count();
  expect(fitted).toBe(11);
  await expect(page.locator('[data-v048-tab]')).toHaveCount(3);

  await page.locator('[data-v048-formation]').selectOption('5-3-2');
  await expect(page.locator('.v048-player')).toHaveCount(11);
  await expect(page.locator('[data-v048-slot="RWB"]')).toHaveCount(1);

  const incomingId = await page.locator('.v048-squad-row:not(.is-picked)').evaluateAll(rows => {
    const row = rows.find(item => item.querySelector('.v048-pos')?.textContent?.trim() !== 'GK');
    return row?.dataset.v048SquadPlayer || null;
  });
  expect(incomingId).toBeTruthy();
  const incoming = page.locator(`[data-v048-squad-player="${incomingId}"]`);
  const target = page.locator('.v048-player:not([data-v048-slot="GK"])').first();
  const oldId = await target.getAttribute('data-player-id');
  await incoming.dragTo(target);
  await expect(target).toHaveAttribute('data-player-id', incomingId);
  expect(await target.getAttribute('data-player-id')).not.toBe(oldId);

  const firstPitch = page.locator('.v048-player:not([data-v048-slot="GK"])').nth(0);
  const secondPitch = page.locator('.v048-player:not([data-v048-slot="GK"])').nth(1);
  const firstBefore = await firstPitch.getAttribute('data-player-id');
  const secondBefore = await secondPitch.getAttribute('data-player-id');
  await firstPitch.dragTo(secondPitch);
  await expect(firstPitch).toHaveAttribute('data-player-id', secondBefore);
  await expect(secondPitch).toHaveAttribute('data-player-id', firstBefore);

  await page.locator('[data-v048-tab="with-ball"]').click();
  await page.locator('[data-v048-option="tempo"][data-value="High"]').click();
  await page.locator('[data-v048-save]').click();

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('flm-career-save')));
  expect(saved.tactics.formation).toBe('5-3-2');
  expect(saved.tactics.tempo).toBe('High');
  expect(saved.tacticalSetup.formation).toBe('5-3-2');
  expect(saved.tacticalSetup.assignments).toHaveLength(11);
  expect(new Set(saved.tacticalSetup.assignments.map(item => item.playerId)).size).toBe(11);
});

test('V0.4.8 Match Centre keeps the hard half-time stop with simplified tactics and drag substitutions', async ({ page }) => {
  await page.getByRole('button', { name: 'START NEW GAME', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'CHOOSE YOUR CLUB' })).toBeVisible();
  await page.locator('[data-start-club]').first().click();
  await expect(page.locator('[data-career-save-status]')).toContainText(/AUTOSAVE|SAVED/);
  await completePreseason(page);

  await page.getByRole('button', { name: 'Matchday', exact: true }).click();
  await page.getByRole('button', { name: 'PLAY MATCH' }).click();
  await expect(page.locator('[data-live-match]')).toHaveAttribute('data-v045-match', '1');
  await expect(page.getByRole('heading', { name: 'Match Centre' })).toBeVisible();
  await expect(page.locator('[data-v045-context]')).toContainText('VENUE');
  await expect(page.locator('[data-v045-context]')).toContainText('ATTENDANCE');
  await expect(page.locator('[data-v045-view]')).toHaveCount(4);

  await page.locator('[data-v045-view="stats"]').click();
  await expect(page.locator('[data-v045-custom-view]')).toContainText('Match Stats');
  await page.locator('[data-v045-bottom="latest"]').click();
  await expect(page.locator('[data-v045-custom-view]')).toContainText('Latest Scores');
  expect(await page.locator('.v045-score-row').count()).toBeGreaterThanOrEqual(4);
  await page.locator('[data-v045-view="overview"]').click();

  await page.getByRole('button', { name: '4×' }).click();
  await expect(page.locator('[data-resume-second-half]')).toBeVisible({ timeout: 15000 });
  await expect(page.locator('[data-live-clock]')).toHaveText('45:00');
  await expect(page.locator('[data-match-status]')).toHaveText('HALF TIME');
  await page.waitForTimeout(350);
  await expect(page.locator('[data-live-clock]')).toHaveText('45:00');

  await page.locator('[data-open-tactics]').click();
  await expect(page.locator('.v048-live-tactics')).toBeVisible();
  await page.locator('[data-v048-live-formation]').selectOption('5-3-2');
  await page.locator('[data-v048-live-key="mentality"][data-value="Defensive"]').click();
  await page.locator('[data-apply-live-tactics]').click();
  await expect(page.locator('[data-shape-label]')).toHaveText('5-3-2');
  await expect(page.locator('[data-match-status]')).toHaveText('HALF TIME');

  await page.locator('[data-open-shape]').click();
  await expect(page.getByRole('heading', { name: 'Roles & Positional Shape' })).toBeVisible();
  await expect(page.locator('.flm-shape-player')).toHaveCount(11);
  await page.locator('.flm-shape-player[data-v048-shape-slot="RST"]').click();
  await page.locator('[data-v048-one-role]').selectOption('Target Man');
  await page.locator('[data-apply-roles]').click();
  await expect(page.locator('[data-match-status]')).toHaveText('HALF TIME');

  await page.locator('[data-open-subs]').click();
  await expect(page.locator('.v048-sub-shell')).toBeVisible();
  const benchId = await page.locator('[data-v048-bench]').evaluateAll(rows => {
    const row = rows.find(item => item.querySelector('span')?.textContent?.trim() !== 'GK');
    return row?.dataset.v048Bench || null;
  });
  expect(benchId).toBeTruthy();
  const bench = page.locator(`[data-v048-bench="${benchId}"]`);
  const off = page.locator('.v048-sub-player:not([data-slot="GK"])').first();
  await bench.dragTo(off);
  await expect(page.locator('[data-v048-sub-plan]')).toContainText('PLANNED CHANGE');
  await page.locator('[data-apply-sub]').click();
  await expect(page.locator('.flm-sub-status')).toContainText('4 of 5 substitutions remaining');
  await expect(page.locator('.v048-sub-shell')).toBeVisible();
  await page.locator('[data-close-manager]').last().click();
  await expect(page.locator('[data-match-status]')).toHaveText('HALF TIME');
  await expect(page.locator('[data-live-clock]')).toHaveText('45:00');

  await page.locator('[data-resume-second-half]').click();
  await expect(page.locator('[data-live-clock]')).toHaveText('90:00', { timeout: 15000 });
  await expect(page.locator('[data-finish-live-match]')).toBeVisible();
  await expect(page.locator('[data-v045-event]')).toContainText('FULL TIME');
  await expect.poll(async () => page.locator('[data-commentary-feed] .flm-commentary-line').count(), { timeout: 15000 }).toBeGreaterThanOrEqual(35);
  await page.locator('[data-finish-live-match]').click();

  await expect(page.locator('.career-page-heading')).toContainText('ROUND 2');
  await expect(page.locator('.career-commentary')).toContainText('PREVIOUS MATCH');
  await page.getByRole('button', { name: 'EXIT' }).click();
  await page.getByRole('button', { name: /LOAD GAME/ }).click();
  await expect(page.getByRole('button', { name: 'CONTINUE CAREER' })).toBeVisible();
});

test('quick start launches Arsenal and mobile navigation remains usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: /QUICK START/ }).click();
  await expect(page.locator('.career-app')).toHaveClass(/is-open/);
  await expect(page.locator('.career-content')).toContainText('Arsenal');
  await page.getByRole('button', { name: 'Table' }).click();
  await expect(page.getByRole('heading', { name: 'League Table' })).toBeVisible();
});
