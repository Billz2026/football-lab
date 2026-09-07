import { expect } from '@playwright/test';

async function completeAppointmentExperience(page){
  const appointment=page.locator('#appModal.flm-appointment-open');
  if(!(await appointment.isVisible({timeout:3000}).catch(()=>false)))return;

  const fanButton=appointment.locator('[data-appt-fans]');
  if(await fanButton.isVisible({timeout:1200}).catch(()=>false))await fanButton.click();

  const mediaButton=appointment.locator('[data-appt-media]');
  if(await mediaButton.isVisible({timeout:1200}).catch(()=>false))await mediaButton.click();

  // Complete the real first press conference rather than closing an incomplete
  // modal. The appointment feature intentionally reopens until it is finished.
  for(let answer=0;answer<12;answer+=1){
    const enter=appointment.locator('[data-appt-enter]');
    if(await enter.isVisible({timeout:250}).catch(()=>false))break;
    const option=appointment.locator('[data-media-answer]:not(:disabled)').first();
    if(!(await option.isVisible({timeout:700}).catch(()=>false)))break;
    await option.click();
  }

  const enter=appointment.locator('[data-appt-enter]');
  await expect(enter).toBeVisible({timeout:3000});
  await enter.click();
  await expect(appointment).toBeHidden({timeout:3000});
}

export async function startCareerThroughCurrentOnboarding(page,{clubIndex=0,firstName='Test',lastName='Manager',experience='professional',completeAppointment=true}={}){
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

  if(completeAppointment)await completeAppointmentExperience(page);
}
