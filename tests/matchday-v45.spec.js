import { test, expect } from '@playwright/test';

test.setTimeout(120000);

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

test('V4.5 starts the next friendly directly, fills the viewport and keeps scorer history', async ({ page }) => {
  await page.getByRole('button', { name: 'START NEW GAME', exact: true }).click();
  await page.locator('[data-start-club]').first().click();
  await selectXI(page);
  await continueUntil(page, '2026-07-11');

  const continueButton = page.locator('[data-shell-continue]');
  await expect(page.locator('[data-shell-continue-label]')).toHaveText('PLAY FRIENDLY', { timeout: 5000 });
  await continueButton.click();

  const live = page.locator('[data-live-match]');
  const shell = page.locator('.cm4-shell');
  await expect(live).toHaveAttribute('data-cm4', '1', { timeout: 7000 });
  await expect(shell).toHaveAttribute('data-cm45', '1', { timeout: 5000 });
  await expect(shell.locator('[data-cm4-comp]')).toHaveAttribute('data-cm45-label', 'Pre-Season Friendly');

  const geometry = await live.evaluate(node => {
    const rect = node.getBoundingClientRect();
    return { width: rect.width, height: rect.height, vw: innerWidth, vh: innerHeight };
  });
  expect(geometry.width / geometry.vw).toBeGreaterThan(0.94);
  expect(geometry.height / geometry.vh).toBeGreaterThan(0.9);

  const scorers = shell.locator('[data-cm45-scorers]');
  await expect(scorers).toHaveAttribute('aria-hidden', 'true');

  await shell.locator('[data-cm4-speed="4"]').click();
  await expect(shell.locator('[data-cm4-clock]')).toHaveText('45:00', { timeout: 30000 });
  await shell.locator('[data-cm4-pause]').click();
  await expect(shell.locator('[data-cm4-clock]')).toHaveText('90:00', { timeout: 35000 });

  const goalInfo = await page.evaluate(async () => {
    const goals = (window.__flmLiveStateV332?.events || []).filter(event => event.type === 'goal');
    const db = await window.FLMManager.loadDatabase();
    return goals.map(goal => ({
      playerId: goal.playerId,
      name: db.players.find(player => player.id === goal.playerId)?.name || '',
      minute: goal.minute
    }));
  });
  await expect(shell).toHaveAttribute('data-cm45-goal-count', String(goalInfo.length));
  if (goalInfo.length) {
    await expect(scorers).toHaveAttribute('aria-hidden', 'false');
    const scorerText = await scorers.innerText();
    expect(goalInfo.some(goal => goal.name && scorerText.includes(goal.name))).toBeTruthy();
    expect(scorerText).toMatch(/\d+'/);
  } else {
    await expect(scorers).toHaveAttribute('aria-hidden', 'true');
  }
});
