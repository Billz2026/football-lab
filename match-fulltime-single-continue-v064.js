const VERSION='0.6.4';
const STYLE_ID='flm-single-fulltime-continue-v064-style';
let queued=false;

function ensureStyles(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');style.id=STYLE_ID;style.textContent=`
  .flm-live-match[data-cm44-state="fulltime"] .cm4-rail [data-cm4-pause],
  .flm-live-match[data-cm44-full-time="1"] .cm4-rail [data-cm4-pause],
  .flm-live-match.is-full-time .cm4-rail [data-cm4-pause]{display:none!important}
  .flm-live-match[data-cm44-state="fulltime"] [data-cm44-continue]{display:inline-flex!important;align-items:center;justify-content:center}
  `;document.head.appendChild(style);
}
function isFullTime(live){return Boolean(live&&(live.dataset.cm44State==='fulltime'||live.dataset.cm44FullTime==='1'||live.classList.contains('is-full-time')||live.querySelector('[data-cm4-clock]')?.textContent?.trim()==='90:00'));}
function syncLive(live){
  if(!isFullTime(live))return;
  const rail=live.querySelector('.cm4-rail [data-cm4-pause]');
  if(rail){rail.hidden=true;rail.disabled=true;rail.setAttribute('aria-hidden','true');rail.tabIndex=-1;rail.dataset.singleContinueSuppressed='1';}
  const centre=live.querySelector('[data-cm44-continue]');
  if(centre){centre.hidden=false;centre.disabled=false;centre.removeAttribute('aria-hidden');centre.removeAttribute('tabindex');centre.setAttribute('aria-label','Continue after full time');}
}
function sync(){queued=false;ensureStyles();document.querySelectorAll('.flm-live-match').forEach(syncLive);}
function queue(){if(queued)return;queued=true;requestAnimationFrame(sync);}

ensureStyles();new MutationObserver(queue).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','data-cm44-state','data-cm44-full-time','hidden']});queue();
window.FLMFullTimeSingleContinueV064=Object.freeze({version:VERSION,refresh:queue});
