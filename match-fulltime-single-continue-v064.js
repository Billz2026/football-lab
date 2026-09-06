const VERSION='0.6.7';
const STYLE_ID='flm-single-fulltime-continue-v067-style';
let queued=false;
let dbPromise=null;
const clean=value=>String(value||'').replace(/\s+/g,' ').trim();
const database=()=>dbPromise||=(Promise.resolve(window.FLMManager?.loadDatabase?.()).catch(()=>null));

function ensureStyles(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');style.id=STYLE_ID;style.textContent=`
  .flm-live-match[data-cm44-state="fulltime"] .cm4-rail [data-cm4-pause],.flm-live-match[data-cm44-full-time="1"] .cm4-rail [data-cm4-pause],.flm-live-match.is-full-time .cm4-rail [data-cm4-pause]{display:none!important}
  .flm-live-match[data-cm44-state="fulltime"] [data-cm44-continue]{display:inline-flex!important;align-items:center;justify-content:center}
  .flm-postmatch-v067{position:absolute;inset:0;z-index:120;display:grid;place-items:center;padding:22px;background:rgba(3,7,13,.94);backdrop-filter:blur(10px)}.flm-postmatch-card{width:min(760px,100%);border:1px solid rgba(111,91,160,.55);border-radius:14px;background:linear-gradient(150deg,#121020,#070811);box-shadow:0 28px 90px rgba(0,0,0,.6);overflow:hidden;color:#eee9f2}.flm-postmatch-head{padding:18px 20px;border-bottom:1px solid rgba(255,255,255,.07);text-align:center}.flm-postmatch-head small{display:block;color:#8290a3;font-size:8px;font-weight:950;letter-spacing:.15em}.flm-postmatch-head h3{margin:7px 0 2px;font-size:24px}.flm-postmatch-head p{margin:0;color:#aaa1b2;font-size:10px}.flm-postmatch-score{color:#eadb53}.flm-postmatch-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:1px;background:rgba(255,255,255,.06)}.flm-postmatch-grid>div{padding:14px;background:#0a0911;text-align:center}.flm-postmatch-grid small{display:block;color:#74859a;font-size:7px;font-weight:950;letter-spacing:.11em}.flm-postmatch-grid strong{display:block;margin-top:5px;font-size:13px}.flm-postmatch-best{padding:14px 18px;border-top:1px solid rgba(255,255,255,.06);background:#0d0a16}.flm-postmatch-best small{color:#7c8ca0;font-size:7px;font-weight:950;letter-spacing:.12em}.flm-postmatch-best strong{display:block;margin-top:5px;color:#87dfa5;font-size:12px}.flm-postmatch-actions{display:flex;justify-content:flex-end;padding:14px 18px;border-top:1px solid rgba(255,255,255,.06)}.flm-postmatch-actions button{min-height:42px;padding:0 17px;border:1px solid #eadb53;border-radius:8px;background:#d4bd39;color:#151109;font-size:9px;font-weight:950;cursor:pointer}@media(max-width:620px){.flm-postmatch-v067{padding:10px}.flm-postmatch-grid{grid-template-columns:1fr 1fr}.flm-postmatch-actions button{width:100%}}
  `;document.head.appendChild(style);
}
function isFullTime(live){return Boolean(live&&(live.dataset.cm44State==='fulltime'||live.dataset.cm44FullTime==='1'||live.classList.contains('is-full-time')||live.querySelector('[data-cm4-clock]')?.textContent?.trim()==='90:00'));}
function syncLive(live){
  if(!isFullTime(live))return;
  const rail=live.querySelector('.cm4-rail [data-cm4-pause]');
  if(rail){rail.hidden=true;rail.disabled=true;rail.setAttribute('aria-hidden','true');rail.tabIndex=-1;rail.dataset.singleContinueSuppressed='1';}
  const centre=live.querySelector('[data-cm44-continue]');
  if(centre){centre.hidden=false;centre.disabled=false;centre.removeAttribute('aria-hidden');centre.removeAttribute('tabindex');centre.setAttribute('aria-label','Review full-time summary');}
}
function stat(live,label){
  const row=[...live.querySelectorAll('[data-live-stats] .flm-stat-row')].find(item=>clean(item.querySelector('span')?.textContent).toLowerCase()===label.toLowerCase());
  const values=row?.querySelectorAll('strong');return values?.length>=2?[clean(values[0].textContent),clean(values[1].textContent)]:['—','—'];
}
function scoreContext(live){
  const home=clean(live.querySelector('[data-cm4-home-name]')?.textContent)||clean([...live.querySelectorAll('.flm-live-team strong')][0]?.textContent)||'Home';
  const away=clean(live.querySelector('[data-cm4-away-name]')?.textContent)||clean([...live.querySelectorAll('.flm-live-team strong')][1]?.textContent)||'Away';
  const hs=clean(live.querySelector('[data-cm4-home-score]')?.textContent)||clean([...live.querySelectorAll('.flm-live-score b')][0]?.textContent)||'0';
  const as=clean(live.querySelector('[data-cm4-away-score]')?.textContent)||clean([...live.querySelectorAll('.flm-live-score b')][1]?.textContent)||'0';
  return{home,away,hs,as};
}
async function bestPlayer(){
  const snapshot=window.__flmLiveStateV332;const ratings=snapshot?.ratings||{};const entries=Object.entries(ratings).filter(([,value])=>Number.isFinite(Number(value))).sort((a,b)=>Number(b[1])-Number(a[1]));if(!entries.length)return'Not available';
  const db=await database();const [id,value]=entries[0];const player=db?.players?.find(item=>item.id===id);return`${player?.name||'Player'} · ${Number(value).toFixed(1)}`;
}
async function renderSummary(live,centre){
  if(live.querySelector('[data-postmatch-v067]'))return;const context=scoreContext(live);const possession=stat(live,'Possession'),shots=stat(live,'Shots'),onTarget=stat(live,'On target'),cards=stat(live,'Cards'),reds=stat(live,'Reds');const xg=window.__flmLiveXg;const snapshot=window.__flmLiveStateV332;const injuries=(snapshot?.events||[]).filter(event=>event.type==='injury').length;const best=await bestPlayer();if(!live.isConnected)return;
  const overlay=document.createElement('section');overlay.className='flm-postmatch-v067';overlay.dataset.postmatchV067='1';overlay.innerHTML=`<article class="flm-postmatch-card"><header class="flm-postmatch-head"><small>FULL TIME · MATCH SUMMARY</small><h3>${context.home} <span class="flm-postmatch-score">${context.hs}–${context.as}</span> ${context.away}</h3><p>Review the key numbers before returning to your career.</p></header><div class="flm-postmatch-grid"><div><small>EXPECTED GOALS</small><strong>${xg?`${Number(xg.home||0).toFixed(2)} · ${Number(xg.away||0).toFixed(2)}`:'—'}</strong></div><div><small>POSSESSION</small><strong>${possession[0]} · ${possession[1]}</strong></div><div><small>SHOTS</small><strong>${shots[0]} · ${shots[1]}</strong></div><div><small>ON TARGET</small><strong>${onTarget[0]} · ${onTarget[1]}</strong></div><div><small>CARDS / REDS</small><strong>${cards[0]}/${reds[0]} · ${cards[1]}/${reds[1]}</strong></div><div><small>INJURIES</small><strong>${injuries}</strong></div></div><div class="flm-postmatch-best"><small>PLAYER OF THE MATCH</small><strong>${best}</strong></div><div class="flm-postmatch-actions"><button type="button" data-postmatch-exit>CONTINUE TO CAREER</button></div></article>`;live.appendChild(overlay);
  overlay.querySelector('[data-postmatch-exit]')?.addEventListener('click',()=>{live.dataset.postmatchConfirmed='1';overlay.remove();centre.click();});
}
function sync(){queued=false;ensureStyles();document.querySelectorAll('.flm-live-match').forEach(syncLive);}
function queue(){if(queued)return;queued=true;requestAnimationFrame(sync);}

document.addEventListener('click',event=>{
  const centre=event.target.closest?.('[data-cm44-continue]');if(!centre)return;const live=centre.closest('.flm-live-match');if(!isFullTime(live))return;
  if(live.dataset.postmatchConfirmed==='1'){delete live.dataset.postmatchConfirmed;return;}
  event.preventDefault();event.stopImmediatePropagation();renderSummary(live,centre).catch(()=>{live.dataset.postmatchConfirmed='1';centre.click();});
},true);
ensureStyles();new MutationObserver(queue).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','data-cm44-state','data-cm44-full-time','hidden']});queue();
window.FLMFullTimeSingleContinueV064=Object.freeze({version:VERSION,refresh:queue});
