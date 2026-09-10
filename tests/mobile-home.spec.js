import { test, expect } from '@playwright/test';

test.describe('V0.4.11 responsive photographic home screen', () => {
  test('unfolded Fold keeps the desktop stadium identity with a compact two-column overlay', async ({ page }) => {
    // Reproduce a real returning-device state too: Compact Menu must not alter
    // the Fold title-screen proportions.
    await page.addInitScript(() => localStorage.setItem('flm-compact', 'true'));
    await page.setViewportSize({ width: 884, height: 900 });
    await page.goto('/index.html');

    await expect(page.locator('html')).toHaveAttribute('data-mobile-home', 'v049');
    await expect(page.locator('body')).toHaveClass(/compact/);
    await expect(page.locator('.hero-brand')).toBeHidden();
    await expect(page.locator('.tactical-stage')).toBeHidden();
    await expect(page.locator('.menu-tile')).toHaveCount(6);
    await expect(page.locator('.tile-number').first()).toBeHidden();
    await expect(page.locator('.tile-icon').first()).toBeHidden();
    await expect(page.locator('.tile-copy small').first()).toBeHidden();
    await expect(page.locator('.section-heading .eyebrow')).toHaveText('MAIN MENU');

    const layout = await page.evaluate(() => {
      const grid = document.querySelector('.menu-grid');
      const hero = document.querySelector('.hero');
      const menu = document.querySelector('.menu-section');
      const tiles = [...document.querySelectorAll('.menu-tile')];
      const heroStyle = getComputedStyle(hero);
      const heroRect = hero.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();
      const columns = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length;

      return {
        columns,
        heroHeight: heroRect.height,
        heroBackgroundImage: heroStyle.backgroundImage,
        heroBottom: heroRect.bottom,
        menuTop: menuRect.top,
        menuBottom: menuRect.bottom,
        maxTileHeight: Math.max(...tiles.map(tile => tile.getBoundingClientRect().height)),
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      };
    });

    expect(layout.columns).toBe(2);
    expect(layout.heroBackgroundImage).toContain('stadium-home.webp');
    expect(layout.heroHeight).toBeGreaterThan(700);
    expect(layout.menuTop).toBeLessThan(layout.heroBottom);
    expect(layout.menuBottom).toBeLessThanOrEqual(layout.heroBottom + 1);
    expect(layout.maxTileHeight).toBeLessThan(100);
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
  });

  test('folded narrow phone keeps the stadium image with compact single-column menu', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/index.html');

    await expect(page.locator('.hero-brand')).toBeHidden();
    await expect(page.locator('.tactical-stage')).toBeHidden();

    const layout = await page.evaluate(() => {
      const grid = document.querySelector('.menu-grid');
      const hero = document.querySelector('.hero');
      const menu = document.querySelector('.menu-section');
      const tiles = [...document.querySelectorAll('.menu-tile')];
      const heroRect = hero.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();

      return {
        columns: getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length,
        heroBackgroundImage: getComputedStyle(hero).backgroundImage,
        heroBottom: heroRect.bottom,
        menuTop: menuRect.top,
        menuBottom: menuRect.bottom,
        maxTileHeight: Math.max(...tiles.map(tile => tile.getBoundingClientRect().height)),
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      };
    });

    expect(layout.columns).toBe(1);
    expect(layout.heroBackgroundImage).toContain('stadium-home.webp');
    expect(layout.menuTop).toBeLessThan(layout.heroBottom);
    expect(layout.menuBottom).toBeLessThanOrEqual(layout.heroBottom + 1);
    expect(layout.maxTileHeight).toBeLessThan(90);
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
  });
});
