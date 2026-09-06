import { test, expect } from '@playwright/test';

test.setTimeout(120000);

const TEST_TIME = new Date('2026-07-01T12:00:00Z');

test.beforeEach(async ({ page }) => {
  // Install before the application creates any timers, but let time flow during
  // page/bootstrap interactions. Playwright explicitly recommends pausing only
  // after the page has loaded so timer-driven UI cannot deadlock during setup.
  await page.clock.install({ time: TEST_TIME });
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

async function stateLabelStyle(locator) {
  return locator.evaluate(node => ({
    fontSize: getComputedStyle(node).fontSize,
    after: getComputedStyle(node, '::after').content
  }));
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

  // User-device Fold regression: the 11th XI row must be physically reachable,
  // and a striker substitution must complete through the real native workflow.
  await page.setViewportSize({ width:720, height:760 });
  await shell.locator('[data-cm4-subs]').click();
  let dialog=page.locator('.flm-match-dialog.v2-sub-dialog');
  await expect(dialog).toHaveAttribute('data-cm44','1');
  const xi=dialog.locator('.v2-sub-column').nth(0).locator('.v2-sub-list');
  await expect(xi.locator('.v2-sub-player')).toHaveCount(11);
  const xiGeometry=await xi.evaluate(node=>({clientHeight:node.clientHeight,scrollHeight:node.scrollHeight}));
  expect(xiGeometry.scrollHeight).toBeLessThanOrEqual(xiGeometry.clientHeight+3);
  const positions=(await dialog.locator('.v2-sub-player .pos').allTextContents()).join(' ');
  expect(positions).not.toMatch(/\b(?:DMC|AMC|MC|DC|DL|DR|AML|AMR)\b/);

  // Position is rendered in a child .pos node, not at the start of the row text.
  // Target the semantic position field so this regression proves the actual ST row
  // is present/reachable without depending on incidental name/text ordering.
  const striker=xi.locator('.v2-sub-player').filter({
    has: page.locator('.pos').filter({hasText:/^ST$/})
  });
  await expect(striker).toHaveCount(1);
  const strikerName=(await striker.locator('strong').textContent())?.trim() || '';
  expect(strikerName.length).toBeGreaterThan(1);
  const strikerGeometry=await striker.evaluate(node=>{
    const row=node.getBoundingClientRect();
    const list=node.parentElement.getBoundingClientRect();
    return {rowTop:row.top,rowBottom:row.bottom,listTop:list.top,listBottom:list.bottom};
  });
  expect(strikerGeometry.rowTop).toBeGreaterThanOrEqual(strikerGeometry.listTop-1);
  expect(strikerGeometry.rowBottom).toBeLessThanOrEqual(strikerGeometry.listBottom+1);

  await striker.click();
  const bench=dialog.locator('.v2-sub-column').nth(1).locator('.v2-sub-player:not(:disabled)');
  await expect(bench.first()).toBeVisible();
  await bench.first().click();
  const confirm=dialog.locator('[data-apply-sub]');
  await expect(confirm).toBeEnabled();
  await confirm.click();
  await expect(dialog).toBeHidden();

  // Re-open to prove the substitution was committed, not merely selectable.
  await shell.locator('[data-cm4-subs]').click();
  dialog=page.locator('.flm-match-dialog.v2-sub-dialog');
  await expect(dialog.locator('.flm-sub-status')).toContainText('4 of 5 substitutions remaining');
  await expect(dialog.locator('.v2-sub-column').nth(0).getByText(strikerName,{exact:true})).toHaveCount(0);
  await dialog.locator('[data-close-manager]').first().click();
  await page.setViewportSize({ width:720, height:900 });

  // Setup is complete. Freeze the browser at its current installed-clock time
  // only now, then drive the real Matchday scheduler deterministically.
  const currentBrowserTime = await page.evaluate(() => Date.now());
  await page.clock.pauseAt(currentBrowserTime);

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
  const halfPhaseStyle=await stateLabelStyle(shell.locator('[data-cm4-phase]'));
  const halfClockStyle=await stateLabelStyle(shell.locator('[data-cm4-half]'));
  expect(halfPhaseStyle.fontSize).toBe('0px');
  expect(halfPhaseStyle.after).toContain('HALF TIME');
  expect(halfClockStyle.fontSize).toBe('0px');
  expect(halfClockStyle.after).toContain('HALF TIME');

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

  // Guard the exact Fold cascade that produced Full TimeFULL TIME. Native text
  // stays suppressed and only the authoritative generated state label is visible.
  const fullPhaseStyle=await stateLabelStyle(shell.locator('[data-cm4-phase]'));
  const fullClockStyle=await stateLabelStyle(shell.locator('[data-cm4-half]'));
  expect(fullPhaseStyle.fontSize).toBe('0px');
  expect(fullPhaseStyle.after).toContain('FULL TIME');
  expect(fullClockStyle.fontSize).toBe('0px');
  expect(fullClockStyle.after).toContain('FULL TIME');

  // Full time must expose exactly one authoritative Continue action. The rail
  // pause/continue control is removed; the large central button remains.
  await expect(shell.locator('[data-cm4-pause]')).toBeHidden();
  await expect(shell.locator('[data-cm44-continue]')).toBeVisible();
  await expect(live.getByRole('button',{name:'CONTINUE',exact:true})).toHaveCount(1);

  await page.clock.runFor(5000);
  await expect(shell.locator('[data-cm4-clock]')).toHaveText('90:00');
  await expect(shell.locator('[data-cm4-event-text]')).toHaveAttribute('data-cm44-text',finalText);
  await expect(shell.locator('[data-cm4-tactics]')).toBeHidden();
  await expect(shell.locator('[data-cm4-subs]')).toBeHidden();

  await shell.locator('[data-cm44-continue]').click();
  await page.clock.runFor(250);
  await expect(live).toHaveCount(0,{timeout:10000});
  await expect(page.locator('.v047-head h2')).toHaveText('Pre-Season');
  await expect(page.locator('.v047-fixture.is-played')).toHaveCount(1);
});