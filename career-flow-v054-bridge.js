const SAVE_KEY='flm-career-save';
const FIXTURE_RELEASE='2026-06-19';

document.addEventListener('click',event=>{
  if(!event.target.closest('[data-v047-play],[data-v047-sim]')) return;
  const c=window.FLMManager?.activeCareer;
  if(!c?.calendar || c.calendar.fixturesReleased) return;
  c.calendar.currentDate=FIXTURE_RELEASE;
  c.calendar.fixturesReleased=true;
  c.currentDate=FIXTURE_RELEASE;
  c.updatedAt=new Date().toISOString();
  localStorage.setItem(SAVE_KEY,JSON.stringify(c));
},true);
