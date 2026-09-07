import { expect } from '@playwright/test';

async function appointmentState(page){
  return page.evaluate(()=>{
    const state=window.FLMManager?.activeCareer?.appointmentExperience;
    return state?{stage:state.stage||'',completed:Boolean(state.completed),dismissed:Boolean(state.dismissed)}:null;
  });
}

async function completeAppointmentExperience(page){
  // Appointment initialisation is asynchronous after the career shell opens.
  // Do not treat "modal not visible yet" as "no appointment"; that race was
  // letting the modal appear later and block every Matchday interaction.
  await expect.poll(async()=>Boolean(await appointmentState(page)),{timeout:10000}).toBeTruthy();
  if((await appointmentState(page))?.dismissed)return;

  await page.evaluate(()=>window.FLMAppointmentMedia?.refresh?.());
  const appointment=page.locator('#appModal.flm-appointment-open');
  await expect(appointment).toBeVisible({timeout:10000});

  for(let step=0;step<20;step+=1){
    const state=await appointmentState(page);
    if(state?.dismissed)break;

    if(!(await appointment.isVisible({timeout:500}).catch(()=>false))){
      await page.evaluate(()=>window.FLMAppointmentMedia?.refresh?.());
      await expect(appointment).toBeVisible({timeout:4000});
    }

    const fanButton=appointment.locator('[data-appt-fans]');
    if(await fanButton.isVisible({timeout:300}).catch(()=>false)){
      await fanButton.click();
      continue;
    }

    const mediaButton=appointment.locator('[data-appt-media]');
    if(await mediaButton.isVisible({timeout:300}).catch(()=>false)){
      await mediaButton.click();
      continue;
    }

    const answer=appointment.locator('[data-media-answer]:not(:disabled)').first();
    if(await answer.isVisible({timeout:300}).catch(()=>false)){
      await answer.click();
      continue;
    }

    const enter=appointment.locator('[data-appt-enter]');
    if(await enter.isVisible({timeout:300}).catch(()=>false)){
      await enter.click();
      continue;
    }

    await page.waitForTimeout(100);
  }

  await expect.poll(async()=>Boolean((await appointmentState(page))?.dismissed),{timeout:5000}).toBeTruthy();
  await expect(page.locator('#appModal')).not.toHaveClass(/flm-appointment-open/,{timeout:5000});
  await expect(page.locator('#appModal')).toHaveAttribute('aria-hidden','true',{timeout:5000});
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
