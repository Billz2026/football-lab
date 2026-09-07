import { test, expect } from '@playwright/test';

test.setTimeout(60000);

test.beforeEach(async ({ page }) => {
  await page.goto('/index.html');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('new career creates a named manager with experience-based reputation and respect', async ({ page }) => {
  await page.locator('[data-action="new-game"]').first().click();
  await expect(page.locator('[data-manager-setup-v064="identity"]')).toBeVisible();

  await page.locator('[data-mgr-first]').fill('Alex');
  await page.locator('[data-mgr-last]').fill('Morgan');
  await page.locator('[data-mgr-nationality]').selectOption({ label: 'England' });
  await page.locator('[data-mgr-next]').click();

  await expect(page.locator('[data-manager-setup-v064="experience"]')).toBeVisible();
  await page.locator('[data-mgr-exp="professional"]').click();
  await expect(page.locator('[data-mgr-summary]')).toContainText('Reputation 70/100');
  await page.locator('[data-mgr-finish]').click();

  await expect(page.getByRole('heading', { name: 'CHOOSE YOUR CLUB' })).toBeVisible();
  await page.locator('[data-start-club]').filter({ hasText: 'Arsenal' }).click();
  await expect(page.locator('.career-app')).toHaveClass(/is-open/);

  await expect.poll(async () => page.evaluate(() => window.FLMManager?.activeCareer?.managerProfile?.name || '')).toBe('Alex Morgan');
  const career = await page.evaluate(() => JSON.parse(localStorage.getItem('flm-career-save')));
  expect(career.managerName).toBe('Alex Morgan');
  expect(career.managerProfile.experienceId).toBe('professional');
  expect(career.managerReputation).toBe(70);
  expect(career.managerProfile.startingSquadRespect).toBe(68);
  expect(career.squadRespect).toBe(68 + (career.appointmentExperience?.initialSquadReaction || 0));
  expect(Object.values(career.playerRelationships || {}).length).toBeGreaterThan(10);
  expect(Object.values(career.playerRelationships).every(item => Number.isFinite(item.managerRespect))).toBeTruthy();
  expect(career.boardExpectations.transferBudget).toBeGreaterThan(0);
  expect(career.transfers.transferBudget).toBe(career.boardExpectations.transferBudget);
  expect(career.news.items.find(item => item.key === 'board-expectation')?.body).toContain('Transfer budget: £');
  await expect(page.locator('[data-manager-strip-v064]')).toContainText('Alex Morgan');
});

test('fixture release briefing lists the opening six while full schedule remains in fixtures', async ({ page }) => {
  await page.getByRole('button', { name: /QUICK START/ }).click();
  await expect(page.locator('.career-app')).toHaveClass(/is-open/);
  await page.evaluate(() => {
    const career = window.FLMManager.activeCareer;
    career.news ||= { schemaVersion: 1, items: [], generatedRounds: [] };
    career.news.items.push({
      id: `news-${career.id}-fixture-release`, key: 'fixture-release', round: 0, period: 'AM',
      dateLabel: '19 JUN', category: 'Competitions', source: 'Premier League',
      title: 'Premier League fixtures released', body: 'placeholder', priority: 'important',
      relatedClubId: career.clubId, relatedPlayerId: null, order: 38000, read: false
    });
    document.body.appendChild(document.createElement('i')).remove();
  });
  await expect.poll(async () => page.evaluate(() => window.FLMManager.activeCareer.news.items.find(i => i.key === 'fixture-release')?.body || '')).toContain('opening six');
  const body = await page.evaluate(() => window.FLMManager.activeCareer.news.items.find(i => i.key === 'fixture-release').body);
  expect((body.match(/\([HA]\)/g) || []).length).toBe(6);
  expect(body).toContain('complete 38-match schedule');
});

test('full time exposes only the centre continue action', async ({ page }) => {
  await page.evaluate(() => {
    const live = document.createElement('section');
    live.className = 'flm-live-match is-full-time';
    live.dataset.cm44State = 'fulltime';
    live.dataset.cm44FullTime = '1';
    live.innerHTML = '<div class="cm4-shell"><aside class="cm4-rail"><button data-cm4-pause>CONTINUE</button></aside><div class="cm4-stage"><button data-cm44-continue>CONTINUE</button></div></div>';
    document.body.appendChild(live);
  });
  const rail = page.locator('.flm-live-match [data-cm4-pause]');
  const centre = page.locator('.flm-live-match [data-cm44-continue]');
  await expect(rail).toBeHidden();
  await expect(centre).toBeVisible();
  await expect(centre).toBeEnabled();
});
