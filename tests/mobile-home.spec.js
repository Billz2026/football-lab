import { test, expect } from '@playwright/test';

test.describe('V0.4.10 responsive home dashboard', () => {
  test('unfolded Fold viewport uses a compact two-column dashboard with no inherited desktop overlap', async ({ page }) => {
    // Representative unfolded Fold / small-tablet CSS viewport. The previous
    // regression used 760px and missed the broken wider Fold layout.
    await page.setViewportSize({ width: 884, height: 900 });
    await page.goto('/index.html');
    await expect(page.locator('html')).toHaveAttribute('data-mobile-home', 'v049');

    await expect(page.locator('.tactical-stage')).toBeHidden();
    await expect(page.locator('.hero-actions')).toBeHidden();
    await expect(page.locator('.menu-tile')).toHaveCount(6);
    await expect(page.locator('.tile-number').first()).toBeVisible();
    await expect(page.locator('.tile-icon').first()).toBeVisible();
    await expect(page.locator('.tile-copy small').first()).toBeVisible();

    const layout = await page.evaluate(() => {
      const grid = document.querySelector('.menu-grid');
      const hero = document.querySelector('.hero');
      const heroBrand = document.querySelector('.hero-brand');
      const menu = document.querySelector('.menu-section');
      const tiles = [...document.querySelectorAll('.menu-tile')];
      const heroRect = hero.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();
      const columns = getComputedStyle(grid).gridTemplateColumns.split(' ').filter(Boolean).length;
      return {
        columns,
        heroHeight: heroRect.height,
        heroBrandMinHeight: getComputedStyle(heroBrand).minHeight,
        heroBottom: heroRect.bottom,
        menuTop: menuRect.top,
        maxTileHeight: Math.max(...tiles.map(tile => tile.getBoundingClientRect().height)),
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth
      };
    });

    expect(layout.columns).toBe(2);
    expect(layout.heroHeight).toBeLessThan(260);
    expect(layout.heroBrandMinHeight).toBe('0px');
    expect(layout.menuTop).toBeGreaterThanOrEqual(layout.heroBottom - 1);
    expect(layout.maxTileHeight).toBeLessThan(170);
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.clientWidth);
  });

  test('folded narrow phone uses compact single-column horizontal tiles', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/index.html');
    await expect(page.locator('.tactical-stage')).toBeHidden();
    await expect(page.locator('.hero-actions')).toBeHidden();

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
