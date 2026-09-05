const STYLE_ID = 'flm-match-centre-v4-mode';

function ensureModeStyle(){
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .career-app.flm-cm-shell .career-layout:has(.flm-live-match[data-cm4="1"]){
      grid-template-columns:minmax(0,1fr)!important;
    }
    .career-app.flm-cm-shell .career-layout:has(.flm-live-match[data-cm4="1"]) > .flm-cm-sidebar{
      display:none!important;
    }
    .career-app.flm-cm-shell .flm-cm-workspace:has(.flm-live-match[data-cm4="1"]){
      grid-template-rows:minmax(0,1fr)!important;
    }
    .career-app.flm-cm-shell .flm-cm-workspace:has(.flm-live-match[data-cm4="1"]) > .career-header{
      display:none!important;
    }
    .career-app.flm-cm-shell .career-content:has(.flm-live-match[data-cm4="1"]){
      padding:6px!important;
      overflow:auto!important;
      background:#050a10!important;
    }
  `;
  document.head.appendChild(style);
}

function syncHalftimeBridge(){
  document.querySelectorAll('.flm-live-match[data-cm4="1"], [data-live-match][data-cm4="1"]').forEach(live => {
    const pause = live.querySelector('.cm4-shell [data-cm4-pause]');
    const resume = live.querySelector('[data-resume-second-half]');
    const clock = live.querySelector('.cm4-shell [data-cm4-clock]')?.textContent?.trim();
    if (!pause) return;
    const halftimeReady = Boolean(resume && !resume.disabled && (live.classList.contains('is-half-time') || clock === '45:00'));
    if (halftimeReady) {
      pause.textContent = 'Resume 2nd Half';
      pause.dataset.cm4Halftime = '1';
    } else {
      delete pause.dataset.cm4Halftime;
    }
  });
}

ensureModeStyle();
syncHalftimeBridge();

document.addEventListener('click',event => {
  const button = event.target.closest?.('[data-cm4-pause]');
  if (!button) return;
  const live = button.closest('.flm-live-match[data-cm4="1"], [data-live-match][data-cm4="1"]');
  const resume = live?.querySelector('[data-resume-second-half]');
  const clock = live?.querySelector('.cm4-shell [data-cm4-clock]')?.textContent?.trim();
  if (!live || !resume || resume.disabled || !(live.classList.contains('is-half-time') || clock === '45:00')) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  resume.click();
  requestAnimationFrame(syncHalftimeBridge);
},true);

new MutationObserver(syncHalftimeBridge).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class','disabled'],characterData:true});