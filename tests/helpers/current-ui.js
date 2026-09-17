import { expect } from '@playwright/test';

export async function clickVisibleNewGame(page) {
  const button = page.locator('[data-action="new-game"]:visible').first();
  await expect(button).toBeVisible();
  await button.click();
}

export async function continueGame(page) {
  const button = page.locator('[data-shell-continue]');
  await expect(button).toBeVisible();
  await expect(button).toBeEnabled();
  await button.click();
}

export async function openFirstSquadProfile(page) {
  const button = page.locator('[data-v044-profile]:visible').first();
  await expect(button).toBeVisible();
  await button.click();
}

export async function exitCareer(page) {
  const button = page.locator('[data-shell-exit]');
  await expect(button).toBeVisible();
  await button.click();
  await expect(page.locator('.career-app')).not.toHaveClass(/is-open/);
}
