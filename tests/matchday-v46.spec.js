import { test, expect } from '@playwright/test';

test.setTimeout(150000);

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
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

test('V4.6 locks matchday presentation and management screens', async ({ page }) => {
  await page.getByRole('button', { name: 'START NEW GAME', exact: true }).click();
  await page.locator('[data-start-club]').first().click();
  await selectXI(page);
  await continueUntil(page, '2026-07-11');

  await expect(page.locator('[data-shell-continue-label]')).toHaveText('PLAY FRIENDLY');
  await page.locator('[data-v047-preseason-tab]').click();
  await expect(page.locator('[data-shell-fixture-meta]')).toContainText('FRIENDLY');
  await expect(page.locator('[data-shell-fixture-meta]')).not.toContainText('19 Jun');
  await expect(page.locator('[data-v047-play]')).toBeHidden();
  await expect(page.locator('[data-v047-sim]')).toBeVisible();

  await page.locator('[data-shell-continue]').click();
  const live = page.locator('[data-live-match]');
  const shell = page.locator('.cm4-shell');
  await expect(shell).toHaveAttribute('data-cm46', '1', { timeout: 7000 });

  await shell.locator('[data-cm4-speed="4"]').click();
  await expect.poll(async () => Number(await shell.getAttribute('data-cm45-goal-count') || 0), { timeout: 45000 }).toBeGreaterThan(0);
  await shell.locator('[data-cm4-pause]').click();

  const firstScorer = shell.locator('.cm45-scorer-row').first();
  await expect(firstScorer).toBeVisible();
  const scorerGeometry = await firstScorer.evaluate(row => {
    const name = row.querySelector('strong')?.getBoundingClientRect();
    const minute = row.querySelector('span')?.getBoundingClientRect();
    if (!name || !minute) return { gap: 999, rowWidth: 0, contentWidth: 0 };
    const gap = Math.max(0, minute.left - name.right, name.left - minute.right);
    return { gap, rowWidth: row.getBoundingClientRect().width, contentWidth: name.width + minute.width + gap };
  });
  expect(scorerGeometry.gap).toBeLessThanOrEqual(18);
  expect(scorerGeometry.rowWidth - scorerGeometry.contentWidth).toBeLessThanOrEqual(28);

  await shell.locator('[data-cm4-tactics]').click();
  const tactics = page.locator('[data-manager-dialog][data-cm46-dialog="tactics"]');
  await expect(tactics).toBeVisible();
  await expect(tactics.locator('[data-cm46-manager-context]')).toBeVisible();
  const tacticsWidth = await tactics.evaluate(node => node.getBoundingClientRect().width / innerWidth);
  expect(tacticsWidth).toBeGreaterThan(0.8);
  await tactics.locator('[data-close-manager]').first().click();

  await shell.locator('[data-cm4-subs]').click();
  const subs = page.locator('.v2-sub-dialog[data-cm46-dialog="subs"]');
  await expect(subs).toBeVisible();
  await expect(subs.locator('[data-cm46-manager-context]')).toBeVisible();
  await expect(subs.locator('.cm46-rating')).toHaveCount(await subs.locator('.v2-sub-player').count());
  await expect(subs.locator('.v2-sub-column').first().locator('.v2-sub-player')).toHaveCount(11);
});
