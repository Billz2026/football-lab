import { expect } from '@playwright/test';

async function currentUserInjuryPause(page) {
  return page.evaluate(() => {
    const live = document.querySelector('[data-live-match]');
    const snapshot = window.__flmLiveStateV332;
    if (!live || !snapshot) return null;

    const paused = live.querySelector('[data-match-speed="0"]')?.classList.contains('is-active');
    if (!paused || live.classList.contains('is-half-time') || live.classList.contains('is-full-time')) return null;

    const userLineup = snapshot.userClubId === snapshot.homeClubId
      ? snapshot.homeLineupIds
      : snapshot.awayLineupIds;
    const injury = [...(snapshot.events || [])]
      .reverse()
      .find(event => event?.type === 'injury' && event?.playerId && userLineup?.includes(event.playerId));

    return injury ? { playerId: injury.playerId, minute: Number(snapshot.minute || 0) } : null;
  });
}

async function replaceInjuredPlayer(page, shell, injury) {
  await shell.locator('[data-cm4-subs]').click();
  const dialog = page.locator('.flm-match-dialog.v2-sub-dialog');
  await expect(dialog).toBeVisible();

  const option = dialog.locator(`[data-sub-out] option[value="${injury.playerId}"]`);
  await expect(option).toHaveCount(1);
  const optionText = await option.textContent();
  const injuredName = String(optionText || '').split('·')[0].trim();
  if (!injuredName) throw new Error(`Could not resolve injured player ${injury.playerId}`);

  const outgoing = dialog.locator('[data-v2-out-list] .v2-sub-player').filter({ hasText: injuredName }).first();
  await expect(outgoing).toBeVisible();
  await outgoing.click();

  const incoming = dialog.locator('[data-v2-in-list] .v2-sub-player:not(:disabled)').first();
  await expect(incoming).toBeEnabled();
  await incoming.click();

  const confirm = dialog.locator('[data-apply-sub]');
  await expect(confirm).toBeEnabled();
  await confirm.click();

  if (await dialog.isVisible()) {
    await dialog.locator('[data-close-manager]').first().click();
  }
  await shell.locator('[data-cm4-speed="4"]').click();
}

export async function finishSecondHalf(page, live, shell, timeout = 90000) {
  await shell.locator('[data-cm4-speed="4"]').click();
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    const fullTime = await live.evaluate(node => node.classList.contains('is-full-time'));
    const clock = String(await shell.locator('[data-cm4-clock]').textContent() || '').trim();
    if (fullTime || clock === '90:00') {
      await expect(shell.locator('[data-cm4-clock]')).toHaveText('90:00');
      await expect(live).toHaveClass(/is-full-time/);
      return;
    }

    const injury = await currentUserInjuryPause(page);
    if (injury) {
      await replaceInjuredPlayer(page, shell, injury);
      continue;
    }

    await page.waitForTimeout(250);
  }

  throw new Error(`Match did not reach full time within ${timeout}ms`);
}
