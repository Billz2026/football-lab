import { test, expect } from '@playwright/test';

test.setTimeout(120000);

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
  await page.locator('[data-v044-auto-pick]').click();
  await expect(page.locator('[data-v044-lineup]:checked')).toHaveCount(11);
}

test('V4.4 latches match states and keeps Fold matchday playable', async ({ page }) => {
  await page.getByRole('button', { name: 'START NEW GAME', exact: true }).click();
  await page.locator('[data-start-club]').first().click();
  await selectXI(page);
  await continueUntil(page, '2026-07-11');

  await page.locator('[data-v047-preseason-tab]').click();
  await page.locator('[data-v047-play]').click();

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

  // Live commentary should expose football actions, not tactical/database jargon.
  await shell.locator('[data-cm4-speed="4"]').click();
  await expect.poll(async()=>page.locator('[data-commentary-feed] .flm-commentary-line').count(),{timeout:15000}).toBeGreaterThanOrEqual(5);
  await expect.poll(async()=>((await shell.locator('[data-cm4-event-text]').getAttribute('data-cm44-text'))||'').length,{timeout:10000}).toBeGreaterThan(5);
  const displayed=(await shell.locator('[data-cm4-event-text]').getAttribute('data-cm44-text'))||'';
  expect(displayed).not.toMatch(/\b(?:LCB|RCB|LCM|RCM|DMC|AMC|AML|AMR|Central Defender|Inside Forward|Poacher|tactical plan|attacking instruction)\b/i);

  // Half time is authoritative until the user resumes. The wider CI budget still fails a real 43/44 freeze.
  await expect(shell.locator('[data-cm4-clock]')).toHaveText('45:00',{timeout:35000});
  await expect(live).toHaveAttribute('data-cm44-state','halftime');
  await expect(shell.locator('[data-cm4-phase]')).toHaveText('Half Time');
  await expect(shell.locator('[data-cm4-pause]')).toHaveText('Resume 2nd Half');
  await expect(shell.locator('[data-cm4-event-text]')).toHaveAttribute('data-cm44-text',/^HALF TIME · /);

  await shell.locator('[data-cm4-pause]').click();
  await expect.poll(async()=>Number(((await shell.locator('[data-cm4-clock]').textContent())||'0').split(':')[0]),{timeout:8000}).toBeGreaterThan(45);

  // Full time is latched: no ordinary commentary can overwrite it while waiting to continue.
  await expect(shell.locator('[data-cm4-clock]')).toHaveText('90:00',{timeout:40000});
  await expect(live).toHaveAttribute('data-cm44-state','fulltime');
  await expect(shell.locator('[data-cm4-phase]')).toHaveText('Full Time');
  const finalText=await shell.locator('[data-cm4-event-text]').getAttribute('data-cm44-text');
  expect(finalText).toMatch(/^FULL TIME · /);
  await page.waitForTimeout(700);
  await expect(shell.locator('[data-cm4-event-text]')).toHaveAttribute('data-cm44-text',finalText);
  await expect(shell.locator('[data-cm4-tactics]')).toBeHidden();
  await expect(shell.locator('[data-cm4-subs]')).toBeHidden();
  await expect(shell.locator('[data-cm44-continue]')).toBeVisible();

  await shell.locator('[data-cm44-continue]').click();
  await expect(live).toHaveCount(0,{timeout:10000});
  await expect(page.locator('.v047-head h2')).toHaveText('Pre-Season');
  await expect(page.locator('.v047-fixture.is-played')).toHaveCount(1);
});