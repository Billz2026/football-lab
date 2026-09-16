import { test, expect } from '@playwright/test';

for (const viewport of [{width:1366,height:768},{width:1440,height:900},{width:884,height:900}]) {
  test(`squad columns and controls remain readable at ${viewport.width}x${viewport.height}`, async ({page}) => {
    await page.setViewportSize(viewport);
    await page.goto('/index.html');
    await page.getByRole('button',{name:'QUICK START',exact:true}).click();
    await page.getByRole('button',{name:'Squad',exact:true}).click();
    const squad=page.locator('.v044-squad-browser');
    await expect(squad).toBeVisible();
    await expect(page.locator('.flm-cm-shell')).toBeVisible();
    await expect(page.locator('.v044-row').first()).toHaveCSS('grid-template-columns', /.+/);
    // Wait for the asynchronously loaded presentation stylesheet, not a fixed delay.
    await expect(page.locator('.v044-name strong').first()).toHaveCSS('font-size','13px');
    const geometry=await squad.evaluate(root=>{
      const rows=[...root.querySelectorAll('.v044-row')];
      const heads=[...root.querySelectorAll('.v044-head')].filter(h=>h.getBoundingClientRect().width>0);
      return {
        client:root.clientHeight,scroll:root.scrollHeight,
        overflow:rows.some(r=>r.scrollWidth>r.clientWidth+1),
        widths:rows.slice(0,heads.length).map(r=>r.getBoundingClientRect().width),
        headerWidths:heads.map(h=>h.getBoundingClientRect().width),
        templates:heads.map(h=>getComputedStyle(h).gridTemplateColumns),
        rowTemplates:rows.slice(0,heads.length).map(r=>getComputedStyle(r).gridTemplateColumns)
      };
    });
    console.log('Squad geometry',viewport,geometry);
    expect(geometry.overflow).toBe(false);
    expect(geometry.widths).toEqual(geometry.headerWidths);
    expect(geometry.templates).toEqual(geometry.rowTemplates);
    if(viewport.width>=1200)expect(geometry.scroll).toBeLessThanOrEqual(geometry.client+1);
    await page.getByRole('button',{name:'GK',exact:true}).click();
    await expect.poll(()=>page.locator('.v044-row:visible').count()).toBeGreaterThan(0);
    expect(await page.locator('.v044-row:visible').evaluateAll(rows=>rows.every(r=>r.dataset.group==='GK'))).toBe(true);
    await page.getByRole('button',{name:'ALL',exact:true}).click();
    await page.locator('[data-v044-auto-pick]').click();
    await expect(page.locator('[data-v044-lineup]:checked')).toHaveCount(11);
    await expect(page.locator('[data-lineup-counter]')).toContainText('11 / 11');
    await page.locator('[data-v044-clear-squad]').click();
    await expect(page.locator('[data-v044-lineup]:checked')).toHaveCount(0);
    await page.locator('[data-v044-profile]').first().click();
    await expect(page.locator('.flm-instant-profile')).toBeVisible();
    await expect(page.locator('#appModal')).not.toHaveClass(/is-open/);
  });
}
