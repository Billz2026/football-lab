import { test, expect } from '@playwright/test';

test.setTimeout(60000);

test.beforeEach(async ({ page }) => {
  await page.goto('/index.html');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: /QUICK START/ }).click();
  await expect(page.locator('.career-app')).toHaveClass(/is-open/);
});

test('V0.6.2 player profiles expose persistent squad roles, happiness, agents and renewal controls', async ({ page }) => {
  await page.getByRole('button', { name: 'Squad', exact: true }).click();
  const playerName = page.locator('[data-v044-row] .v044-name strong').first();
  await playerName.click();

  const dynamics = page.locator('[data-v062-dynamics]');
  await expect(dynamics).toBeVisible({ timeout: 15000 });
  await expect(dynamics).toContainText('PLAYER DYNAMICS');
  await expect(dynamics).toContainText('HAPPINESS');
  await expect(dynamics).toContainText('MORALE');
  await expect(dynamics).toContainText('AGENT');
  await expect(dynamics.locator('[data-v062-role]')).toBeVisible();
  await expect(dynamics.locator('[data-v062-renew]')).toBeVisible();

  const playerId = await dynamics.getAttribute('data-v062-dynamics');
  const currentRole = await dynamics.locator('[data-v062-role]').inputValue();
  const nextRole = currentRole === 'Rotation' ? 'Important' : 'Rotation';
  await dynamics.locator('[data-v062-role]').selectOption(nextRole);
  await dynamics.locator('[data-v062-role-save]').click();

  await expect.poll(async () => page.evaluate(id => {
    const save = JSON.parse(localStorage.getItem('flm-career-save'));
    return save.playerDynamics?.players?.[id]?.squadRole || null;
  }, playerId)).toBe(nextRole);

  await expect(page.locator('[data-v062-dynamics]')).toContainText(nextRole);
});
