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

async function replaceInjuredPlayer(page, shell, injury) {
  const dialog = page.locator('[data-manager-dialog]');
  if (!(await dialog.isVisible())) await shell.locator('[data-cm4-tactics]').click();
  await expect(dialog).toBeVisible();
  const outgoing = dialog.locator(`[data-v049-out="${injury.playerId}"]`);
  await expect(outgoing).toBeVisible();
  await outgoing.click();
  const availability = await page.evaluate(async outId => {
    const db = await window.FLMManager.loadDatabase();
    const { substitutionStatus } = await import('/matchday-substitution-state-v1.js?v=1.0.0');
    return substitutionStatus(window.__flmLiveStateV332, db, outId);
  }, injury.playerId);
  if (!availability.canSubstitute) {
    if (await dialog.isVisible()) {
      await dialog.locator('[data-close-manager]').first().click();
    }
    await shell.locator('[data-cm4-speed="4"]').click();
    return;
  }
  const incoming = dialog.locator(`[data-v049-in="${availability.replacementIds[0]}"]`);
  await expect(incoming).toBeEnabled();
  await incoming.click();

  const confirm = dialog.locator('[data-v049-confirm]');
  await expect(confirm).toBeEnabled();
  await confirm.click();
  await expect.poll(() => page.evaluate(id => window.__flmLiveStateV332.subbedOffIds.includes(id), injury.playerId)).toBe(true);

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
