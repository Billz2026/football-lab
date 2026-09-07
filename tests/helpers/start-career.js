import { expect } from '@playwright/test';

export async function startCareerThroughCurrentOnboarding(page,{clubIndex=0,firstName='Test',lastName='Manager',experience='professional'}={}){
  await page.getByRole('button',{name:'START NEW GAME',exact:true}).click();

  await expect(page.locator('[data-manager-setup-v064="identity"]')).toBeVisible();
  await page.locator('[data-mgr-first]').fill(firstName);
  await page.locator('[data-mgr-last]').fill(lastName);
  await page.locator('[data-mgr-next]').click();

  await expect(page.locator('[data-manager-setup-v064="experience"]')).toBeVisible();
  await page.locator(`[data-mgr-exp="${experience}"]`).click();
  await page.locator('[data-mgr-finish]').click();

  await expect(page.getByRole('heading',{name:'CHOOSE YOUR CLUB'})).toBeVisible();
  const clubs=page.locator('[data-start-club]');
  await expect(clubs.first()).toBeVisible();
  await clubs.nth(clubIndex).click();
  await expect(page.locator('.career-app')).toHaveClass(/is-open/);
}
