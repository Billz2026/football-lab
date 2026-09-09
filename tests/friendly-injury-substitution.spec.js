import { test, expect } from '@playwright/test';
import { startCareerThroughCurrentOnboarding } from './helpers/start-career.js';
import { reachHalfTime, finishSecondHalf } from './helpers/live-match.js';

test.setTimeout(240000);
test.use({ actionTimeout: 10000 });

test('friendly entry → injury → registered substitute → match resumes', async ({ page }) => {
  // Inject one deterministic injury at the engine boundary, not into the UI or
  // snapshot. The real engine, dialog, substitution and playback still run.
  await page.route('**/matchday-engine-v069.js*', async route => {
    const response = await route.fetch();
    const source = await response.text();
    const anchor = '  const events = [...(result.events || []), ...(drama.events || [])];';
    expect(source).toContain(anchor);
    await route.fulfill({ response, body: source.replace(anchor, `${anchor}
  if (state.minute === 2) {
    const ids = state.userClubId === state.homeClubId ? state.homeLineupIds : state.awayLineupIds;
    const injured = db.players.find(p => ids.includes(p.id) && p.positionGroup !== 'GK');
    state.injuredIds = [...new Set([...(state.injuredIds || []), injured.id])];
    state.conditions[injured.id] = 38;
    const injury = { minute: 2, type: 'injury', clubId: state.userClubId, playerId: injured.id,
      text: injured.name + ' is injured.', lines: [injured.name + ' is injured.'] };
    state.events.push(injury);
    events.push(injury);
  }`) });
  });

  await page.goto('/index.html');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await startCareerThroughCurrentOnboarding(page);
  await page.getByRole('button', { name: 'Squad', exact: true }).click();
  await page.locator('[data-v044-auto-pick]').click();
  for (let step = 0; step < 60; step++) {
    if (await page.evaluate(() => window.FLMManager.activeCareer.currentDate >= '2026-07-11')) break;
    await page.locator('[data-shell-continue]').click();
    await page.waitForTimeout(100);
  }
  await expect(page.locator('[data-shell-continue-label]')).toHaveText('PLAY FRIENDLY');
  await page.locator('[data-shell-continue]').click();
  const live = page.locator('[data-live-match]');
  await expect(live).toBeVisible({ timeout: 10000 });
  const dialog = live.locator('[data-manager-dialog]');
  await expect(live.locator('[data-cv2-injury-prompt]')).toBeVisible({ timeout: 15000 });
  await expect(live.locator('[data-manager-modal]')).toHaveAttribute('aria-hidden', 'false');
  await expect(live.locator('[data-cv2-injury-prompt]')).not.toContainText('No substitutes available');

  const before = await page.evaluate(() => window.__flmLiveStateV332);
  const injury = before.events.find(event => event.type === 'injury' && event.minute === 2);
  expect(injury).toBeTruthy();
  const outRow = dialog.locator(`[data-v049-out="${injury.playerId}"]`);
  await expect(outRow).toHaveClass(/is-off/);
  const benchIds = await dialog.locator('[data-v049-in]').evaluateAll(rows => rows.map(row => row.dataset.v049In));
  expect(benchIds.length).toBeGreaterThan(0);
  expect(benchIds.every(id => before.userBenchIds.includes(id))).toBe(true);
  const incoming = await page.evaluate(ids => window.FLMManager.loadDatabase().then(db => ids.find(id => db.players.find(p => p.id === id)?.positionGroup !== 'GK')), benchIds);
  await dialog.locator(`[data-v049-in="${incoming}"]`).click();
  await expect(dialog.locator('[data-v049-confirm]')).toBeEnabled();
  await dialog.locator('[data-v049-confirm]').click();
  await expect.poll(() => page.evaluate(() => window.__flmLiveStateV332.substitutions?.length)).toBe(1);
  await expect(live.locator('[data-cv2-injury-prompt]')).toBeHidden();
  await expect(dialog.locator(`[data-v049-out="${incoming}"]`)).toBeVisible();
  await expect(dialog.locator(`[data-v049-in="${injury.playerId}"]`)).toHaveCount(0);
  const after = await page.evaluate(() => window.__flmLiveStateV332);
  const lineup = after.userClubId === after.homeClubId ? after.homeLineupIds : after.awayLineupIds;
  expect(lineup).toHaveLength(11);
  expect(lineup).toContain(incoming);
  expect(lineup).not.toContain(injury.playerId);
  expect(after.subbedOffIds).toContain(injury.playerId);
  expect(after.substitutions[0]).toMatchObject({ outId: injury.playerId, inId: incoming });
  expect(after.events.filter(event => event.type === 'substitution' && event.playerId === incoming)).toHaveLength(1);
  // The clock cannot race ahead while the substitution sheet owns the pause.
  await page.waitForTimeout(800);
  expect(await page.evaluate(() => window.__flmLiveStateV332.minute)).toBe(after.minute);
  await dialog.locator('[data-close-manager]').first().click();
  // Automatic injury intent must not allow later unrelated programmatic opens.
  await live.locator('[data-open-tactics]').evaluate(button => button.click());
  await expect(live.locator('[data-manager-modal]')).toHaveAttribute('aria-hidden', 'true');
  await page.locator('.cm4-shell [data-cm4-tactics]').click();
  await expect(live.locator('[data-manager-modal]')).toHaveAttribute('aria-hidden', 'false');
  await dialog.locator('[data-close-manager]').first().click();
  await page.locator('.cm4-shell [data-cm4-speed="4"]').click();
  await expect.poll(() => page.evaluate(() => window.__flmLiveStateV332.minute), { timeout: 10000 }).toBeGreaterThan(after.minute);
  const shell = page.locator('.cm4-shell');
  await reachHalfTime(page, live, shell);
  await shell.locator('[data-cm4-pause]').click();
  await finishSecondHalf(page, live, shell);
});
