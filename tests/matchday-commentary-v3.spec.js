import { test, expect } from '@playwright/test';
import { startCareerThroughCurrentOnboarding } from './helpers/start-career.js';

test.setTimeout(150000);

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

test('Commentary V3 renders structured defensive flow in the live Match Centre without generic filler', async ({ page }) => {
  await startCareerThroughCurrentOnboarding(page);
  await selectXI(page);
  await completePreseason(page);

  await page.getByRole('button', { name: 'Matchday', exact: true }).click();
  const previousFixtureId = await page.evaluate(() => window.__flmLiveStateV332?.fixtureId || null);
  await page.getByRole('button', { name: 'PLAY MATCH', exact: true }).click();

  const live = page.locator('[data-live-match]');
  const shell = page.locator('.cm4-shell');
  await expect(live).toHaveAttribute('data-cm4', '1');
  await expect(shell).toBeVisible();

  // Wait until the live match has replaced any snapshot left by pre-season simulation.
  await expect.poll(async () => page.evaluate(previous => {
    const fixtureId = window.__flmLiveStateV332?.fixtureId || null;
    return Boolean(fixtureId && fixtureId !== previous);
  }, previousFixtureId), { timeout: 10000 }).toBe(true);
  const liveFixtureId = await page.evaluate(() => window.__flmLiveStateV332?.fixtureId || null);
  expect(liveFixtureId).toBeTruthy();

  await shell.locator('[data-cm4-speed="4"]').click();

  // Engine contract: one real non-shot flow sequence from this live fixture must reach the authoritative snapshot.
  await expect.poll(async () => page.evaluate(fixtureId => {
    const snapshot = window.__flmLiveStateV332;
    if (snapshot?.fixtureId !== fixtureId) return 0;
    return (snapshot.events || []).filter(event => event?.flow?.sequenceId).length;
  }, liveFixtureId), { timeout: 20000 }).toBeGreaterThanOrEqual(1);

  const firstSequenceId = await page.evaluate(fixtureId => {
    const snapshot = window.__flmLiveStateV332;
    if (snapshot?.fixtureId !== fixtureId) return null;
    return (snapshot.events || []).find(event => event?.flow?.sequenceId)?.flow?.sequenceId || null;
  }, liveFixtureId);
  expect(firstSequenceId).toBeTruthy();

  // Persistence contract: later presentation/state ticks must not replace the rich engine snapshot.
  await page.waitForTimeout(1200);
  const authorityState = await page.evaluate(({ fixtureId, sequenceId }) => ({
    fixtureId: window.__flmLiveStateV332?.fixtureId,
    source: window.__flmLiveStateV332?.source,
    version: window.__flmLiveStateV332?.structuredCommentarySnapshotVersion,
    authoritySource: window.__flmLiveStateAuthorityV3?.source,
    stillPresent: window.__flmLiveStateV332?.fixtureId === fixtureId && (window.__flmLiveStateV332?.events || []).some(event => event?.flow?.sequenceId === sequenceId),
    flowCount: window.__flmLiveStateV332?.fixtureId === fixtureId ? (window.__flmLiveStateV332?.events || []).filter(event => event?.flow?.sequenceId).length : 0
  }), { fixtureId: liveFixtureId, sequenceId: firstSequenceId });
  expect(authorityState.fixtureId).toBe(liveFixtureId);
  expect(authorityState.source).toBe('matchday-engine-v069');
  expect(authorityState.version).toBe('3.0.0');
  expect(authorityState.authoritySource).toBe('matchday-engine-v069');
  expect(authorityState.stillPresent).toBe(true);
  expect(authorityState.flowCount).toBeGreaterThanOrEqual(1);

  const snapshotFlow = await page.evaluate(fixtureId => {
    const snapshot = window.__flmLiveStateV332;
    if (snapshot?.fixtureId !== fixtureId) return [];
    return (snapshot.events || [])
      .filter(event => event?.flow?.sequenceId)
      .map(event => ({
        type: event.type,
        subtype: event.flow.subtype,
        sequenceId: event.flow.sequenceId,
        phases: (event.flow.beats || []).map(beat => beat.phase),
        attackerId: event.flow.attackerId,
        defenderId: event.flow.defenderId,
        outcome: event.flow.outcome
      }));
  }, liveFixtureId);
  expect(snapshotFlow.length).toBeGreaterThanOrEqual(1);
  for (const event of snapshotFlow) {
    expect(event.sequenceId).toBeTruthy();
    expect(event.phases).toEqual(['development','duel','resolution']);
    expect(event.outcome).toBeTruthy();
  }

  // Presentation contract: the three beats must be visible and protected from legacy commentary rewrites.
  const authoritative = page.locator('[data-commentary-feed] .flm-commentary-line[data-fl-authoritative-flow="3.0.0"]');
  await expect.poll(async () => authoritative.count(), { timeout: 15000 }).toBeGreaterThanOrEqual(3);

  const phases = new Set(await authoritative.evaluateAll(rows => rows.map(row => row.dataset.flFlowPhase)));
  expect(phases.has('development')).toBe(true);
  expect(phases.has('duel')).toBe(true);
  expect(phases.has('resolution')).toBe(true);

  const visibleText = (await authoritative.allTextContents()).join(' ');
  expect(visibleText.length).toBeGreaterThan(80);
  expect(visibleText).toMatch(/tackle|intercept|block|header|claim|press|turnover|offside|second ball|recycle|first touch|delivery|cross/i);
  expect(visibleText).not.toMatch(/move it from side to side|danger passes|gets down the flank and crosses early|closes down aggressively and forces the hurried pass/i);

  const flowDiagnostics = await page.evaluate(fixtureId => {
    const snapshot = window.__flmLiveStateV332;
    return {
      fixtureId: snapshot?.fixtureId || null,
      source: snapshot?.source || null,
      minute: snapshot?.minute ?? null,
      flows: snapshot?.fixtureId === fixtureId
        ? (snapshot.events || []).filter(event => event?.flow?.sequenceId).map(event => ({
            type: event.type,
            sequenceId: event.flow.sequenceId,
            subtype: event.flow.subtype,
            action: event.flow.action,
            category: event.flow.category,
            outcome: event.flow.outcome
          }))
        : []
    };
  }, liveFixtureId);
  const subtypes = [...new Set(flowDiagnostics.flows.map(event => event.subtype))];
  const allowed = new Set([
    'interception','standing_tackle','sliding_tackle','poor_touch','overhit_pass','forced_back',
    'second_ball_win','blocked_cross','defensive_header','keeper_claim','overhit_cross','press_regain',
    'offside_trap','defensive_header_corner','blocked_cross_corner','last_ditch_block_corner'
  ]);
  expect(
    subtypes.some(subtype => allowed.has(subtype)),
    `Unexpected V3 flow state: ${JSON.stringify(flowDiagnostics)}`
  ).toBe(true);

  // Performance contract: V3 commentary must not starve the calibrated match clock.
  await expect(shell.locator('[data-cm4-clock]')).toHaveText('45:00', { timeout: 30000 });
});