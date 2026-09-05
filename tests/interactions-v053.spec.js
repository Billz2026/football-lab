import { test, expect } from '@playwright/test';

test.setTimeout(60000);

test.beforeEach(async ({ page }) => {
  await page.goto('/index.html');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: /QUICK START/ }).click();
  await expect(page.locator('.career-app')).toHaveClass(/is-open/);
});

async function openTransferWindow(page) {
  if (await page.locator('[data-v050-transfer-tab]').count()) return;
  await page.getByRole('button', { name: 'Overview', exact: true }).click();
  await page.locator('[data-v054-advance]').click();
  await expect(page.locator('.v054-date-chip')).toContainText('15 JUN 2026');
  await expect(page.locator('[data-v050-transfer-tab]')).toBeVisible();
}

test('V0.5.3 opens player profiles from career lists and exposes live value plus comparison data', async ({ page }) => {
  await page.getByRole('button', { name: 'Squad', exact: true }).click();
  const squadName = page.locator('[data-v044-row] .v044-name strong').first();
  const squadPlayerName = (await squadName.textContent()).trim().replace('★', '').trim();
  await squadName.click();

  await expect(page.locator('#appModal')).toHaveClass(/is-open/);
  await expect(page.locator('#modalTitle')).toContainText(squadPlayerName.split(' ')[0]);
  await expect(page.locator('.flm-profile')).toBeVisible();
  await expect(page.locator('.v053-profile-summary')).toBeVisible();
  await expect(page.locator('.v053-profile-summary')).toContainText('LIVE VALUE');

  await page.locator('[data-profile-compare]').click();
  await expect(page.locator('.v053-compare-summary')).toBeVisible();
  await expect(page.locator('.v053-compare-card')).toHaveCount(2);
  await expect(page.locator('.v053-compare-summary')).toContainText('Apps / Goals / Assists');
  await page.locator('.modal-close').click();

  await openTransferWindow(page);
  await page.locator('[data-v050-transfer-tab]').click();
  await expect(page.getByRole('heading', { name: 'Transfers' })).toBeVisible();
  const marketName = page.locator('[data-v050-player] strong').first();
  const marketPlayerName = (await marketName.textContent()).trim();
  await marketName.click();
  await expect(page.locator('#appModal')).toHaveClass(/is-open/);
  await expect(page.locator('#modalTitle')).toHaveText(marketPlayerName);
  await expect(page.locator('.v053-profile-summary')).toContainText('LIVE VALUE');
});

async function seedListedOffer(page, phaseNumber) {
  return page.evaluate(async number => {
    const c = window.FLMManager.activeCareer;
    const db = await window.FLMManager.loadDatabase();
    const transfers = await import('./transfers-v050.js?v=0.6.0');
    const own = transfers.listOwnPlayersForTransfer(c, db).find(player => player.positionGroup !== 'GK');
    if (!own) throw new Error('No outfield player available to list.');
    if (!c.transfers.listedPlayerIds.includes(own.id)) transfers.toggleTransferListed(c, db, own.id);
    const dates = ['2026-06-19','2026-06-23','2026-06-27','2026-07-01'];
    const date = dates[Math.min(Math.max(number - 1, 0), dates.length - 1)];
    c.currentDate = date;
    c.calendar.currentDate = date;
    c.calendar.fixturesReleased = date >= '2026-06-19';
    const result = transfers.processTransferWorld(c, db);
    localStorage.setItem('flm-career-save', JSON.stringify(c));
    const offer = [...c.transfers.incomingOffers].reverse().find(item => item.status === 'pending');
    if (!offer) throw new Error(`No pending offer generated in phase ${result.phaseKey}.`);
    return { id: offer.id, playerId: offer.playerId, offeredFee: offer.offeredFee };
  }, phaseNumber);
}

test('V0.5.3 incoming transfer offers can be rejected, countered and accepted from the UI', async ({ page }) => {
  await openTransferWindow(page);
  const rejected = await seedListedOffer(page, 1);
  await page.locator('[data-v050-transfer-tab]').click();
  await page.getByRole('button', { name: /^OFFERS/ }).click();
  let row = page.locator(`[data-v052-offer-row="${rejected.id}"]`);
  await expect(row).toBeVisible();
  await row.locator('[data-v052-reject]').click();
  await expect.poll(async () => page.evaluate(id => JSON.parse(localStorage.getItem('flm-career-save')).transfers.incomingOffers.find(item => item.id === id)?.status, rejected.id)).toBe('rejected');

  const countered = await seedListedOffer(page, 2);
  await page.locator('[data-v050-transfer-tab]').click();
  await page.getByRole('button', { name: /^OFFERS/ }).click();
  row = page.locator(`[data-v052-offer-row="${countered.id}"]`);
  await expect(row).toBeVisible();
  await row.locator('[data-v052-counter-fee]').fill(String(countered.offeredFee));
  await row.locator('[data-v052-counter]').click();
  await expect.poll(async () => page.evaluate(id => JSON.parse(localStorage.getItem('flm-career-save')).transfers.incomingOffers.find(item => item.id === id)?.status, countered.id)).toBe('completed');

  const accepted = await seedListedOffer(page, 3);
  await page.locator('[data-v050-transfer-tab]').click();
  await page.getByRole('button', { name: /^OFFERS/ }).click();
  row = page.locator(`[data-v052-offer-row="${accepted.id}"]`);
  await expect(row).toBeVisible();
  await row.locator('[data-v052-accept]').click();
  await expect.poll(async () => page.evaluate(id => JSON.parse(localStorage.getItem('flm-career-save')).transfers.incomingOffers.find(item => item.id === id)?.status, accepted.id)).toBe('completed');
  await expect.poll(async () => page.evaluate(playerId => JSON.parse(localStorage.getItem('flm-career-save')).transfers.ownership[playerId], accepted.playerId)).not.toBe(await page.evaluate(() => window.FLMManager.activeCareer.clubId));
});
