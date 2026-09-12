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

  // Some career modules can mark the appointment dismissed during the same
  // render cycle that leaves the summary frame on screen. In that state the
  // career is complete but the normal ENTER CAREER control still owns modal
  // cleanup. Exercise that control rather than mutating modal classes in tests.
  const modal=page.locator('#appModal');
  if(await modal.evaluate(node=>node.classList.contains('flm-appointment-open'))){
    const enter=modal.locator('[data-appt-enter]');
    if(await enter.isVisible({timeout:500}).catch(()=>false))await enter.click();
  }

  await expect(modal).not.toHaveClass(/flm-appointment-open/,{timeout:5000});
  await expect(modal).toHaveAttribute('aria-hidden','true',{timeout:5000});
}

export async function startCareerThroughCurrentOnboarding(page,{clubIndex=0,firstName='Test',lastName='Manager',experience='professional',managerOrigin='tactical-specialist',completeAppointment=true}={}){
  await page.getByRole('button',{name:'START NEW GAME',exact:true}).click();

  await expect(page.locator('[data-manager-setup-v064="identity"]')).toBeVisible();
  await page.locator('[data-mgr-first]').fill(firstName);
  await page.locator('[data-mgr-last]').fill(lastName);
  await page.locator('[data-mgr-next]').click();

  await expect(page.locator('[data-manager-setup-v064="experience"]')).toBeVisible();
  await page.locator(`[data-mgr-exp="${experience}"]`).click();
  await page.locator('[data-mgr-finish]').click();

  // New Career now includes an explicit manager-origin step before club choice.
  // Select deterministically so existing match/career tests exercise the real flow.
  await expect(page.getByRole('heading',{name:'CHOOSE YOUR MANAGER ORIGIN'})).toBeVisible();
  const origin=page.locator(`input[name="manager-origin"][value="${managerOrigin}"]`);
  await expect(origin).toBeVisible();
  await origin.check();
  const originContinue=page.getByRole('button',{name:'CONTINUE',exact:true});
  await expect(originContinue).toBeEnabled();
  await originContinue.click();

  await expect(page.getByRole('heading',{name:'CHOOSE YOUR CLUB'})).toBeVisible();
  const clubs=page.locator('[data-start-club]');
  await expect(clubs.first()).toBeVisible();
  await clubs.nth(clubIndex).click();

  // Club rows now select a club; TAKE CONTROL is the explicit confirmation
  // that creates the career. Keep the test helper aligned with the real UI.
  const takeControl=page.getByRole('button',{name:'TAKE CONTROL',exact:true});
  await expect(takeControl).toBeEnabled();
  await takeControl.click();
  await expect(page.locator('.career-app')).toHaveClass(/is-open/);

  // The origin must be part of the canonical active career, not just UI state.
  await expect.poll(()=>page.evaluate(()=>window.FLMManager?.activeCareer?.managerOrigin?.id||null),{timeout:5000}).toBe(managerOrigin);
  await expect.poll(()=>page.evaluate(()=>Boolean(window.FLMManager?.activeCareer?.managerModifiers)),{timeout:5000}).toBeTruthy();

  if(completeAppointment)await completeAppointmentExperience(page);
}
