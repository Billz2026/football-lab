import { expect } from '@playwright/test';

async function currentActivePause(page) {
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
      .find(event => event?.type === 'injury' && event?.playerId);

    return {
      minute: Number(snapshot.minute || 0),
      userInjury: injury && userLineup?.includes(injury.playerId)
        ? { playerId: injury.playerId }
        : null
    };
  });
}

async function resumeShortHandedIfNeeded(page, shell) {
  const notice = page.getByText('No substitutes available. You must continue short-handed.', { exact: false }).last();
  if (!(await notice.count())) return false;
  if (!(await notice.isVisible().catch(() => false))) return false;
  await shell.locator('[data-cm4-speed="4"]').click();
  return true;
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
  if (!(await incoming.count())) {
    if (await dialog.isVisible()) {
      await dialog.locator('[data-close-manager]').first().click();
    }
    await shell.locator('[data-cm4-speed="4"]').click();
    return;
  }

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

async function runMatchToClock(page, live, shell, targetClock, timeout) {
  await shell.locator('[data-cm4-speed="4"]').click();
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    const clock = String(await shell.locator('[data-cm4-clock]').textContent() || '').trim();
    if (clock === targetClock) return;

    if (await resumeShortHandedIfNeeded(page, shell)) {
      await page.waitForTimeout(250);
      continue;
    }

    const pause = await currentActivePause(page);
    if (pause?.userInjury) {
      await replaceInjuredPlayer(page, shell, pause.userInjury);
      continue;
    }
    if (pause) {
      await shell.locator('[data-cm4-speed="4"]').click();
      await page.waitForTimeout(250);
      continue;
    }

    await page.waitForTimeout(250);
  }

  const current = String(await shell.locator('[data-cm4-clock]').textContent() || '').trim();
  throw new Error(`Match did not reach ${targetClock} within ${timeout}ms (stopped at ${current})`);
}

export async function reachHalfTime(page, live, shell, timeout = 90000) {
  await runMatchToClock(page, live, shell, '45:00', timeout);
  await expect(shell.locator('[data-cm4-clock]')).toHaveText('45:00');
}

export async function finishSecondHalf(page, live, shell, timeout = 90000) {
  await runMatchToClock(page, live, shell, '90:00', timeout);
  await expect(shell.locator('[data-cm4-clock]')).toHaveText('90:00');
  await expect(live).toHaveClass(/is-full-time/);
}
