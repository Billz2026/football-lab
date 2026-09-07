import { test, expect } from '@playwright/test';

test.setTimeout(140000);

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({width:1366,height:900});
  await page.goto('/index.html');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

async function continueUntil(page,targetDate,maxSteps=30){
  for(let step=0;step<maxSteps;step+=1){
    const current=await page.evaluate(()=>window.FLMManager?.activeCareer?.currentDate||'');
    if(current>=targetDate)return;
    await page.locator('.career-header [data-v060-continue]').click();
    await page.waitForTimeout(80);
  }
  throw new Error(`Continue Game did not reach ${targetDate}`);
}

async function selectXI(page){
  await page.getByRole('button',{name:'Squad',exact:true}).click();
  await page.locator('[data-v044-auto-pick]').click();
  await expect(page.locator('[data-v044-lineup]:checked')).toHaveCount(11);
}

test('V0.7 keeps the full XI subbable, applies kits and exits full time in one click',async({page})=>{
  await page.getByRole('button',{name:/QUICK START/}).click();
  await expect(page.locator('.career-app')).toHaveClass(/is-open/);
  await selectXI(page);
  await continueUntil(page,'2026-07-11');
  await expect(page.locator('[data-shell-continue-label]')).toHaveText('PLAY FRIENDLY');
  await page.locator('[data-shell-continue]').click();

  const live=page.locator('[data-live-match]');
  const shell=page.locator('.cm4-shell');
  await expect(live).toHaveAttribute('data-cm4','1');
  await expect.poll(async()=>page.evaluate(()=>window.FLMMatchdayRuntimeFixesV070?.version||''),{timeout:8000}).toBe('0.7.0');

  await expect(live).toHaveAttribute('data-home-kit','home');
  await expect(live).toHaveAttribute('data-away-kit',/^(away|third|home|contrast)$/);
  const kitVars=await live.evaluate(node=>({
    home:getComputedStyle(node).getPropertyValue('--home-color').trim(),
    away:getComputedStyle(node).getPropertyValue('--away-color').trim(),
    homeInk:getComputedStyle(node).getPropertyValue('--home-ink').trim(),
    awayInk:getComputedStyle(node).getPropertyValue('--away-ink').trim()
  }));
  expect(kitVars.home).not.toBe('');
  expect(kitVars.away).not.toBe('');
  expect(kitVars.homeInk).not.toBe('');
  expect(kitVars.awayInk).not.toBe('');

  await shell.locator('[data-cm4-subs]').click();
  const dialog=page.locator('.flm-match-dialog.v2-sub-dialog');
  const outList=dialog.locator('[data-v2-out-list]');
  await expect(outList.locator('.v2-sub-player')).toHaveCount(11);
  await expect.poll(async()=>page.evaluate(()=>{
    const snapshot=window.__flmLiveStateV332;
    if(!snapshot)return false;
    const active=snapshot.userClubId===snapshot.homeClubId?snapshot.homeLineupIds:snapshot.awayLineupIds;
    const select=document.querySelector('.flm-match-dialog.v2-sub-dialog [data-sub-out]');
    if(!select)return false;
    const options=new Set([...select.options].map(option=>option.value));
    return active.length===11&&active.every(id=>options.has(id));
  }),{timeout:8000}).toBe(true);
  const xiGeometry=await outList.evaluate(node=>({clientHeight:node.clientHeight,scrollHeight:node.scrollHeight}));
  expect(xiGeometry.scrollHeight).toBeLessThanOrEqual(xiGeometry.clientHeight+3);
  await dialog.locator('[data-close-manager]').first().click();

  await shell.locator('[data-cm4-speed="4"]').click();
  await expect(shell.locator('[data-cm4-clock]')).toHaveText('45:00',{timeout:40000});
  await shell.locator('[data-cm4-pause]').click();
  await expect(shell.locator('[data-cm4-clock]')).toHaveText('90:00',{timeout:45000});
  await expect(live).toHaveClass(/is-full-time/);

  const visibleContinue=live.locator('[data-v068-ft-continue]');
  await expect(visibleContinue).toBeVisible();
  await visibleContinue.click();
  await expect(live).toHaveCount(0,{timeout:10000});
  await expect(page.locator('.v047-head h2')).toHaveText('Pre-Season');
  await expect(page.locator('.v047-fixture.is-played')).toHaveCount(1);
});
