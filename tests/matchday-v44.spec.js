import { test, expect } from '@playwright/test';

test.setTimeout(120000);

const TEST_TIME = new Date('2026-07-01T12:00:00Z');

test.beforeEach(async ({ page }) => {
  // Install before the application creates any timers. V4.4 is explicitly a
  // scheduler/latch acceptance test, so the test owns passage of browser time.
  await page.clock.install({ time: TEST_TIME });
  await page.clock.pauseAt(TEST_TIME);
  await page.goto('/index.html');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.clock.runFor(250);
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

async function runMatchClockTo(page, shell, targetMinute, maxVirtualMs = 180000) {
  const clock = shell.locator('[data-cm4-clock]');
  let elapsed = 0;
  while (elapsed < maxVirtualMs) {
    const raw = (await clock.textContent()) || '0:00';
    const minute = Number(raw.split(':')[0]) || 0;
    if (minute >= targetMinute) return minute;
    await page.clock.runFor(1000);
    elapsed += 1000;
  }
  const finalClock = (await clock.textContent()) || 'unknown';
  throw new Error(`Virtual Matchday clock did not reach ${targetMinute}:00 after ${maxVirtualMs} ms; stopped at ${finalClock}`);
}

test('V4.4 latches match states and keeps Fold matchday playable', async ({ page }) => {
  await page.getByRole('button', { name: 'START NEW GAME', exact: true }).click();
  await page.locator('[data-start-club]').first().click();
  await selectXI(page);
  await continueUntil(page, '2026-07-11');

  // V4.6 deliberately removes the duplicate central PLAY FRIENDLY CTA.
  await expect(page.locator('[data-shell-continue-label]')).toHaveText('PLAY FRIENDLY');
  await page.locator('[data-shell-continue]').click();

  const live=page.locator('[data-live-match]');
  const shell=page.locator('.cm4-shell');
  await expect(live).toHaveAttribute('data-cm4','1');
  await expect(shell).toHaveAttribute('data-cm44','1');
  await expect(shell.locator('[data-cm4-comp]')).toHaveText('Pre-Season Friendly');

  // Metadata should look like a real match rather than placeholders.
  await expect(shell.locator('[data-cm4-referee]')).not.toHaveText('Referee — Match Official');
  await expect(shell.locator('[data-cm4-weather]')).not.toHaveText('Weather —');

  // Fold substitutions: full XI visible, normalised positions and coherent V4 skin.
  await page.setViewportSize({ width:720, height:900 });
  await shell.locator('[data-cm4-subs]').click();
  const dialog=page.locator('.flm-match-dialog.v2-sub-dialog');
  await expect(dialog).toHaveAttribute('data-cm44','1');
  const xi=dialog.locator('.v2-sub-column').nth(0).locator('.v2-sub-list');
  await expect(xi.locator('.v2-sub-player')).toHaveCount(11);
  const xiGeometry=await xi.evaluate(node=>({clientHeight:node.clientHeight,scrollHeight:node.scrollHeight}));
  expect(xiGeometry.scrollHeight).toBeLessThanOrEqual(xiGeometry.clientHeight+3);
  const positions=(await dialog.locator('.v2-sub-player .pos').allTextContents()).join(' ');
  expect(positions).not.toMatch(/\b(?:DMC|AMC|MC|DC|DL|DR|AML|AMR)\b/);
  await dialog.locator('[data-close-manager]').first().click();

  // Advance the real Matchday scheduler with Playwright's controlled browser clock.
  // Small slices execute every nested timer consistently, including commentary and
  // goal-flash sleeps, while the engine's own 45' latch stops first-half progress.
  await runMatchClockTo(page, shell, 45);

  // Live commentary should expose football actions, not tactical/database jargon.
  expect(await page.locator('[data-commentary-feed] .flm-commentary-line').count()).toBeGreaterThanOrEqual(5);
  const displayed=(await shell.locator('[data-cm4-event-text]').getAttribute('data-cm44-text'))||'';
  expect(displayed.length).toBeGreaterThan(5);
  expect(displayed).not.toMatch(/\b(?:LCB|RCB|LCM|RCM|DMC|AMC|AML|AMR|Central Defender|Inside Forward|Poacher|tactical plan|attacking instruction)\b/i);

  // Half time is authoritative until the user resumes.
  await expect(shell.locator('[data-cm4-clock]')).toHaveText('45:00');
  await expect(live).toHaveAttribute('data-cm44-state','halftime');
  await expect(shell.locator('[data-cm4-phase]')).toHaveText('Half Time');
  await expect(shell.locator('[data-cm4-pause]')).toHaveText('Resume 2nd Half');
  await expect(shell.locator('[data-cm4-event-text]')).toHaveAttribute('data-cm44-text',/^HALF TIME · /);

  // Prove the latch is authoritative: virtual time alone cannot advance the match.
  await page.clock.runFor(5000);
  await expect(shell.locator('[data-cm4-clock]')).toHaveText('45:00');

  await shell.locator('[data-cm4-pause]').click();
  await page.clock.runFor(1000);
  expect(Number((((await shell.locator('[data-cm4-clock]').textContent())||'0').split(':')[0]))).toBeGreaterThan(45);

  // Full time is latched: no ordinary commentary can overwrite it while waiting to continue.
  await runMatchClockTo(page, shell, 90);
  await expect(shell.locator('[data-cm4-clock]')).toHaveText('90:00');
  await expect(live).toHaveAttribute('data-cm44-state','fulltime');
  await expect(shell.locator('[data-cm4-phase]')).toHaveText('Full Time');
  const finalText=await shell.locator('[data-cm4-event-text]').getAttribute('data-cm44-text');
  expect(finalText).toMatch(/^FULL TIME · /);
  await page.clock.runFor(5000);
  await expect(shell.locator('[data-cm4-clock]')).toHaveText('90:00');
  await expect(shell.locator('[data-cm4-event-text]')).toHaveAttribute('data-cm44-text',finalText);
  await expect(shell.locator('[data-cm4-tactics]')).toBeHidden();
  await expect(shell.locator('[data-cm4-subs]')).toBeHidden();
  await expect(shell.locator('[data-cm44-continue]')).toBeVisible();

  await shell.locator('[data-cm44-continue]').click();
  await expect(live).toHaveCount(0,{timeout:10000});
  await expect(page.locator('.v047-head h2')).toHaveText('Pre-Season');
  await expect(page.locator('.v047-fixture.is-played')).toHaveCount(1);
});