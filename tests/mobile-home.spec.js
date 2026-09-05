import { test, expect } from '@playwright/test';

test.describe('V0.4.9 responsive home dashboard', () => {
  test('unfolded Fold viewport uses a compact two-column tile dashboard with no horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 760, height: 900 });
    await page.goto('/index.html');
    await expect(page.locator('html')).toHaveAttribute('data-mobile-home', 'v049');

    await expect(page.locator('.tactical-stage')).toBeHidden();
    await expect(page.locator('.menu-tile')).toHaveCount(6);

    const layout = await page.evaluate(() => {
      const grid = document.querySelector('.menu-grid');
      const hero = document.querySelector('.hero');
      const menu = document.querySelector('.menu-section');
      const tiles = [...document.querySelectorAll('.menu-tile')];
      const columns = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length;
      return {
        columns,
        heroHeight: hero.getBoundingClientRect().height,
        menuTop: menu.getBoundingClientRect().top,
        maxTileHeight: Math.max(...tiles.map(tile => tile.getBoundingClientRect().height)),
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      };
    });

    expect(layout.columns).toBe(2);
    expect(layout.heroHeight).toBeLessThan(330);
    expect(layout.menuTop).toBeLessThan(450);
    expect(layout.maxTileHeight).toBeLessThan(180);
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
  });

  test('folded narrow phone uses compact single-column horizontal tiles', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/index.html');
    await expect(page.locator('.tactical-stage')).toBeHidden();

    const layout = await page.evaluate(() => {
      const grid = document.querySelector('.menu-grid');
      const tiles = [...document.querySelectorAll('.menu-tile')];
      return {
        columns: getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length,
        maxTileHeight: Math.max(...tiles.map(tile => tile.getBoundingClientRect().height)),
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      };
    });

    expect(layout.columns).toBe(1);
    expect(layout.maxTileHeight).toBeLessThan(130);
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
  });
});
