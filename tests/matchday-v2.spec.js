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
    if (current >= targetDate) return;
    await page.locator('.career-header [data-v060-continue]').click();
    await page.waitForTimeout(80);
  }
  throw new Error(`Continue Game did not reach ${targetDate}`);
}

async function selectXI(page) {
  await page.getByRole('button', { name: 'Squad', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Squad' })).toBeVisible();
  await page.locator('[data-v044-auto-pick]').click();
  await expect(page.locator('[data-v044-lineup]:checked')).toHaveCount(11);
}

async function completePreseason(page) {
  const dates = ['2026-07-11','2026-07-18','2026-07-25','2026-08-01','2026-08-08'];
  const tab = page.locator('[data-v047-preseason-tab]');
  await expect(tab).toBeVisible();
  for (let count = 1; count <= dates.length; count += 1) {
    await continueUntil(page, dates[count - 1]);
    await tab.click();
    await page.locator('[data-v047-sim]').click();
    await expect(page.locator('.v047-fixture.is-played')).toHaveCount(count);
  }
  await page.locator('[data-v047-start]').click();
  await continueUntil(page, '2026-08-21');
}

test('Match Centre V4 delivers CM-style event focus with stable match controls', async ({ page }) => {
  await page.getByRole('button', { name: 'START NEW GAME', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'CHOOSE YOUR CLUB' })).toBeVisible();
  await page.locator('[data-start-club]').first().click();
  await selectXI(page);
  await completePreseason(page);

  await page.getByRole('button', { name: 'Matchday', exact: true }).click();
  await page.getByRole('button', { name: 'PLAY MATCH', exact: true }).click();

  const live = page.locator('[data-live-match]');
  await expect(live).toHaveAttribute('data-cm4', '1');
  const shell = page.locator('.cm4-shell');
  await expect(shell).toBeVisible();
  await expect(shell).toHaveAttribute('data-cm41', '1');

  // V4.5 keeps the classic vertical rail while deliberately filling the unfolded Fold viewport.
  await page.setViewportSize({ width: 720, height: 900 });
  const foldGeometry = await page.evaluate(() => {
    const shell = document.querySelector('.cm4-shell');
    const rail = document.querySelector('.cm4-rail');
    const workspace = document.querySelector('.cm4-workspace');
    const scorebar = document.querySelector('.cm4-scorebar');
    const tabs = document.querySelector('.cm4-tabs');
    const bottom = document.querySelector('.cm4-bottom-player');
    const rr = rail.getBoundingClientRect();
    const wr = workspace.getBoundingClientRect();
    const sr = shell.getBoundingClientRect();
    return {
      railTop: rr.top,
      railRight: rr.right,
      workspaceTop: wr.top,
      workspaceLeft: wr.left,
      shellHeight: sr.height,
      viewportHeight: innerHeight,
      scorePosition: getComputedStyle(scorebar).position,
      tabsDisplay: getComputedStyle(tabs).display,
      bottomDisplay: bottom ? getComputedStyle(bottom).display : 'none'
    };
  });
  expect(Math.abs(foldGeometry.railTop - foldGeometry.workspaceTop)).toBeLessThanOrEqual(2);
  expect(foldGeometry.railRight).toBeLessThanOrEqual(foldGeometry.workspaceLeft + 2);
  expect(foldGeometry.shellHeight).toBeGreaterThanOrEqual(foldGeometry.viewportHeight * 0.9);
  expect(foldGeometry.shellHeight).toBeLessThanOrEqual(foldGeometry.viewportHeight + 2);
  expect(foldGeometry.scorePosition).toBe('sticky');
  expect(foldGeometry.tabsDisplay).toBe('grid');
  expect(foldGeometry.bottomDisplay).toBe('none');
  await page.setViewportSize({ width: 1280, height: 720 });

  // V4 owns the full match workspace: the career shell collapses, leaving one navigation system.
  await expect(page.locator('.flm-cm-sidebar')).toBeHidden();
  await expect(page.locator('.career-header')).toBeHidden();
  await expect(shell.locator('[data-cm4-home-name]')).toBeVisible();
  await expect(shell.locator('[data-cm4-away-name]')).toBeVisible();
  await expect(shell.locator('[data-cm4-home-score]')).toHaveText(/^\d+$/);
  await expect(shell.locator('[data-cm4-away-score]')).toHaveText(/^\d+$/);
  await expect(shell.locator('[data-cm4-clock]')).toHaveText(/^\d{2}:\d{2}$/);
  await expect(shell.locator('[data-cm4-view]')).toHaveCount(5);
  await expect(shell.locator('[data-cm4-view="overview"]')).toHaveClass(/is-active/);
  await expect(shell.locator('[data-cm4-event]')).toBeVisible();
  await expect(page.locator('.cm340-nav')).toHaveCount(0);

  const colours = await live.evaluate(node => ({
    home: getComputedStyle(node).getPropertyValue('--home-color').trim(),
    away: getComputedStyle(node).getPropertyValue('--away-color').trim()
  }));
  expect(colours.home).toBeTruthy();
  expect(colours.away).toBeTruthy();
  expect(colours.home).not.toBe(colours.away);

  // Run the match and make sure the focused event card tracks real commentary.
  await shell.locator('[data-cm4-speed="4"]').click();
  await expect.poll(async () => page.locator('[data-commentary-feed] .flm-commentary-line').count(), { timeout: 15000 }).toBeGreaterThanOrEqual(5);
  await expect.poll(async () => (await shell.locator('[data-cm4-event-text]').getAttribute('data-cm41-text'))?.trim().length || 0, { timeout: 10000 }).toBeGreaterThan(5);
  const eventText = (await shell.locator('[data-cm4-event-text]').getAttribute('data-cm41-text')) || '';
  expect(eventText).not.toContain('Waiting for kick-off');
  expect(eventText).not.toMatch(/\b(?:LCM|RCM|Central Midfielder role)\b/i);

  // V4 clock is visible and has real geometry rather than being clipped under another layer.
  const clockGeometry = await shell.locator('[data-cm4-clock]').evaluate(node => {
    const rect = node.getBoundingClientRect();
    const board = node.closest('.cm4-scorebar').getBoundingClientRect();
    return { top:rect.top,bottom:rect.bottom,height:rect.height,boardTop:board.top,boardBottom:board.bottom };
  });
  expect(clockGeometry.height).toBeGreaterThanOrEqual(20);
  expect(clockGeometry.top).toBeGreaterThanOrEqual(clockGeometry.boardTop - 1);
  expect(clockGeometry.bottom).toBeLessThanOrEqual(clockGeometry.boardBottom + 1);

  // Player Ratings use one readable team table with names, numbers, minutes and live ratings.
  await shell.locator('[data-cm4-view="ratings"]').click();
  await expect(shell.locator('[data-cm4-panel="ratings"]')).toHaveClass(/is-active/);
  await expect.poll(async () => shell.locator('.cm4-rating-row').count(), { timeout: 10000 }).toBeGreaterThanOrEqual(11);
  const firstRating = shell.locator('.cm4-rating-row').first();
  const firstCells = await firstRating.locator(':scope > *').allTextContents();
  expect(firstCells).toHaveLength(8);
  expect(firstCells[1].trim().length).toBeGreaterThan(2);
  expect(firstCells[0].trim()).toMatch(/^(?:\d{1,2}|—)$/);
  expect(firstCells[3].trim()).toMatch(/^\d{1,3}'$/);
  expect(firstCells[7].trim()).toMatch(/^\d\.\d$/);

  await shell.locator('[data-cm4-view="overview"]').click();
  await expect(shell.locator('[data-cm4-panel="overview"]')).toHaveClass(/is-active/);

  // Clock progression is a hard regression gate: presentation work must never starve the engine.
  await expect(shell.locator('[data-cm4-clock]')).toHaveText('45:00', { timeout: 30000 });
  await expect(page.locator('[data-resume-second-half]')).toBeAttached();
  await expect(shell.locator('[data-cm4-pause]')).toHaveText('Resume 2nd Half');

  // On an unfolded Fold the substitution board is a full-screen XI ↔ bench workspace.
  await page.setViewportSize({ width: 720, height: 900 });
  await shell.locator('[data-cm4-subs]').click();
  await expect(page.locator('.v2-sub-shell')).toBeVisible();
  const confirm = page.locator('[data-apply-sub]');
  await expect(confirm).toHaveText('CONFIRM SUBSTITUTION');
  await expect(confirm).toBeDisabled();
  await expect(page.locator('.v2-sub-column').nth(0).locator('.v2-sub-player')).toHaveCount(11);
  await expect.poll(async () => page.locator('.cm332-bench-preview').count(), { timeout: 5000 }).toBeGreaterThan(0);

  const subGeometry = await page.evaluate(() => {
    const columns=[...document.querySelectorAll('.v2-sub-column')];
    const confirm=document.querySelector('[data-apply-sub]');
    const modal=document.querySelector('[data-manager-modal]');
    const a=columns[0]?.getBoundingClientRect();
    const b=columns[1]?.getBoundingClientRect();
    const c=confirm?.getBoundingClientRect();
    return {
      modalPosition: modal ? getComputedStyle(modal).position : '',
      sideBySide: Boolean(a && b && Math.abs(a.top-b.top)<=2 && a.right<=b.left+2),
      confirmVisible: Boolean(c && c.top>=0 && c.bottom<=window.innerHeight+1),
      viewportHeight: window.innerHeight
    };
  });
  expect(subGeometry.modalPosition).toBe('fixed');
  expect(subGeometry.sideBySide).toBe(true);
  expect(subGeometry.confirmVisible).toBe(true);

  const offColumn = page.locator('.v2-sub-column').nth(0);
  const inColumn = page.locator('.v2-sub-column').nth(1);
  const outfield = offColumn.locator('.v2-sub-player').filter({ hasNot: page.locator('.pos', { hasText: /^GK$/ }) }).first();
  await outfield.click();
  const replacement = inColumn.locator('.v2-sub-player:not(:disabled)').first();
  await expect(replacement).toBeEnabled();
  await replacement.click();
  await expect(confirm).toBeEnabled();
  await confirm.click();
  await expect(page.locator('.flm-sub-status')).toContainText('4 of 5 substitutions remaining');

  // Close the management screen, resume through the V4 halftime bridge and prove play continues.
  await page.locator('.flm-match-dialog [data-close-manager]').first().click();
  await expect(page.locator('[data-manager-modal]')).not.toHaveClass(/is-open/);
  await expect(shell.locator('[data-cm4-pause]')).toHaveText('Resume 2nd Half');
  await shell.locator('[data-cm4-pause]').click();
  await expect.poll(async () => Number(((await shell.locator('[data-cm4-clock]').textContent()) || '0').split(':')[0]), { timeout: 8000 }).toBeGreaterThan(45);
});