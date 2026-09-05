import { test, expect } from '@playwright/test';

test.setTimeout(120000);

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
  await page.locator('[data-v044-auto-pick]').click();
  await expect(page.locator('[data-v044-lineup]:checked')).toHaveCount(11);
}

test('V4.3 fixes Fold substitutions, duplicate commentary and full-time continuation', async ({ page }) => {
  await page.getByRole('button', { name: 'START NEW GAME', exact: true }).click();
  await page.locator('[data-start-club]').first().click();
  await selectXI(page);
  await continueUntil(page, '2026-07-11');

  await page.locator('[data-v047-preseason-tab]').click();
  await expect(page.locator('[data-v047-play]')).toBeVisible();
  await page.locator('[data-v047-play]').click();

  const live = page.locator('[data-live-match]');
  const shell = page.locator('.cm4-shell');
  await expect(live).toHaveAttribute('data-cm4', '1');
  await expect(shell).toHaveAttribute('data-cm43', '1');
  await expect(shell.locator('[data-cm4-comp]')).toHaveText('Pre-Season Friendly');

  await page.setViewportSize({ width: 720, height: 900 });
  await shell.locator('[data-cm4-subs]').click();
  const dialog = page.locator('.flm-match-dialog.v2-sub-dialog');
  await expect(dialog).toHaveAttribute('data-cm43', '1');
  const xi = dialog.locator('.v2-sub-column').nth(0).locator('.v2-sub-list');
  const bench = dialog.locator('.v2-sub-column').nth(1).locator('.v2-sub-list');
  await expect(xi.locator('.v2-sub-player')).toHaveCount(11);
  await expect.poll(async () => bench.locator('.v2-sub-player').count()).toBeGreaterThan(0);

  const xiGeometry = await xi.evaluate(node => ({ clientHeight:node.clientHeight, scrollHeight:node.scrollHeight }));
  expect(xiGeometry.scrollHeight).toBeLessThanOrEqual(xiGeometry.clientHeight + 3);

  const benchPreview = dialog.locator('.cm332-bench-preview');
  if (await benchPreview.count()) await expect(benchPreview.first()).toBeHidden();

  const dialogSkin = await dialog.evaluate(node => ({
    background:getComputedStyle(node).backgroundColor,
    navy:getComputedStyle(node).getPropertyValue('--cm43-navy').trim()
  }));
  expect(dialogSkin.navy).toBe('#071725');
  expect(dialogSkin.background).not.toBe('rgb(11, 10, 8)');

  await dialog.locator('[data-close-manager]').first().click();
  await expect(page.locator('[data-manager-modal]')).not.toHaveClass(/is-open/);

  await shell.locator('[data-cm4-speed="4"]').click();
  await expect(shell.locator('[data-cm4-clock]')).toHaveText('45:00', { timeout: 30000 });
  await expect(shell.locator('[data-cm4-pause]')).toHaveText('Resume 2nd Half');
  await shell.locator('[data-cm4-pause]').click();
  await expect(shell.locator('[data-cm4-clock]')).toHaveText('90:00', { timeout: 35000 });

  await expect(live).toHaveAttribute('data-cm43-full-time', '1');
  await expect(shell.locator('[data-cm4-pause]')).toHaveText('Continue');
  await expect(shell.locator('[data-cm4-tactics]')).toBeHidden();
  await expect(shell.locator('[data-cm4-subs]')).toBeHidden();
  const eventText = shell.locator('[data-cm4-event-text]');
  await expect(eventText).toHaveAttribute('data-cm41-text', /^FULL TIME · /);
  const commentaryGeometry = await eventText.evaluate(node => ({
    nativeSize:getComputedStyle(node).fontSize,
    pseudo:getComputedStyle(node,'::after').content
  }));
  expect(commentaryGeometry.nativeSize).toBe('0px');
  expect(commentaryGeometry.pseudo).not.toBe('none');

  await shell.locator('[data-cm4-pause]').click();
  await expect(live).toBeDetached({ timeout: 10000 });
  await expect(page.locator('.v047-head h2')).toHaveText('Pre-Season');
  await expect(page.locator('.v047-fixture.is-played')).toHaveCount(1);
});
