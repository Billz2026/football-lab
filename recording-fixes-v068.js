const VERSION='0.6.8';
const STYLE_ID='flm-recording-fixes-v068-style';
let queued=false;
let dbPromise=null;
const clean=value=>String(value||'').replace(/\s+/g,' ').trim();
const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const manager=()=>window.FLMManager;
const career=()=>manager()?.activeCareer||null;
const database=()=>dbPromise||=(Promise.resolve(manager()?.loadDatabase?.()).catch(()=>null));

function ensureStyles(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
  .version-chip{font-size:0!important}.version-chip::after{content:'V0.6.8'!important;font-size:11px!important}
  .flm-live-match.is-full-time[data-v068-fulltime="1"] .cm4-stage>.cm4-event{visibility:hidden!important}
  .v068-fulltime-result{position:absolute;z-index:7;left:50%;top:50%;transform:translate(-50%,-50%);width:min(760px,86%);padding:24px 26px;border:1px solid #315979;background:linear-gradient(180deg,#0e2c48,#0a2035);box-shadow:0 20px 60px #0008;text-align:center;color:#f1cf4a}
  .v068-fulltime-result small{display:block;margin-bottom:8px;color:#dce7ef;font-size:10px;font-weight:900;letter-spacing:.12em}.v068-fulltime-result strong{display:block;font-size:clamp(24px,3vw,38px);font-weight:950;line-height:1.15}
  .flm-live-match.is-full-time[data-v068-fulltime="1"] [data-cm44-continue],.flm-live-match.is-full-time[data-v068-fulltime="1"] [data-cm4-pause]{display:none!important}
  .v068-ft-continue{position:absolute;left:50%;bottom:24px;transform:translateX(-50%);z-index:9;min-width:220px;min-height:44px;padding:0 28px;border:1px solid #f1cf4a;background:linear-gradient(180deg,#f5d85c,#d9ad2f);color:#101820;font:950 12px/1 Tahoma,Verdana,Arial,sans-serif;letter-spacing:.04em;cursor:pointer;box-shadow:0 8px 24px #0008}
  .v068-postmatch{position:absolute;inset:0;z-index:120;display:grid;place-items:center;padding:18px;background:rgba(2,8,14,.94);backdrop-filter:blur(7px)}
  .v068-postmatch-card{width:min(840px,100%);max-height:92%;overflow:auto;border:1px solid #315979;background:#071725;color:#f5f7fa;box-shadow:0 28px 90px #000b}
  .v068-post-head{padding:22px;text-align:center;border-bottom:1px solid #244b6a;background:linear-gradient(180deg,#10304d,#081d30)}.v068-post-head small{color:#f1cf4a;font-size:9px;letter-spacing:.13em}.v068-post-head h3{margin:7px 0 0;font-size:clamp(25px,4vw,42px)}
  .v068-post-body{padding:18px}.v068-post-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}.v068-post-stat{padding:12px;border:1px solid #1f435f;background:#091e31;text-align:center}.v068-post-stat span{display:block;color:#91aabd;font-size:8px;letter-spacing:.08em}.v068-post-stat strong{display:block;margin-top:5px;color:#fff;font-size:14px}
  .v068-post-notes{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:10px}.v068-post-note{padding:12px;border:1px solid #1f435f;background:#091e31}.v068-post-note span{display:block;color:#f1cf4a;font-size:8px;letter-spacing:.08em}.v068-post-note strong{display:block;margin-top:5px;font-size:12px}.v068-post-actions{display:flex;justify-content:center;padding:0 18px 20px}.v068-post-actions button{min-width:240px;min-height:44px;border:1px solid #f1cf4a;background:linear-gradient(180deg,#f5d85c,#d9ad2f);color:#101820;font-weight:950;cursor:pointer}
  .flm-live-match[data-cm4="1"] .cm4-event.is-home.is-chance{--event-color:var(--home-color,#d84b54)!important}.flm-live-match[data-cm4="1"] .cm4-event.is-away.is-chance{--event-color:var(--away-color,#d9ad2f)!important}
  @media(max-width:720px){.v068-post-stats{grid-template-columns:1fr 1fr}.v068-post-notes{grid-template-columns:1fr}.v068-fulltime-result{width:82%;padding:18px}.v068-ft-continue{bottom:16px;min-width:180px}}
  `;
  document.head.appendChild(style);
}

function clubName(db,id){const club=db?.clubs?.find(item=>item.id===id);return club?.shortName||club?.name||'Unknown';}
function playerName(db,id){return db?.players?.find(item=>item.id===id)?.name||'';}
function formatGBP(value){const n=Number(String(value||'').replace(/[^0-9.-]/g,''));return Number.isFinite(n)&&n>0?new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(n):'';}
function rawMoney(value){return String(value||'').replace(/[^0-9]/g,'');}

function scoreContext(live){
  const shell=live.querySelector('.cm4-shell');
  const home=clean(shell?.querySelector('[data-cm4-home-name]')?.textContent)||clean(live.querySelectorAll('.flm-live-team strong')[0]?.textContent)||'Home';
  const away=clean(shell?.querySelector('[data-cm4-away-name]')?.textContent)||clean(live.querySelectorAll('.flm-live-team strong')[1]?.textContent)||'Away';
  const homeScore=clean(shell?.querySelector('[data-cm4-home-score]')?.textContent)||clean(live.querySelectorAll('.flm-live-score b')[0]?.textContent)||'0';
  const awayScore=clean(shell?.querySelector('[data-cm4-away-score]')?.textContent)||clean(live.querySelectorAll('.flm-live-score b')[1]?.textContent)||'0';
  return{shell,home,away,homeScore,awayScore,text:`${home} ${homeScore}–${awayScore} ${away}`};
}

function statRows(live){
  const rows={};
  for(const row of live.querySelectorAll('[data-live-stats] .flm-stat-row')){
    const label=clean(row.querySelector('span')?.textContent).toLowerCase();
    const values=row.querySelectorAll('strong');
    if(label&&values.length>=2)rows[label]=[clean(values[0].textContent),clean(values[1].textContent)];
  }
  return rows;
}

async function buildPostMatch(live){
  if(live.querySelector('[data-v068-postmatch]'))return;
  const db=await database();if(!live.isConnected)return;
  const score=scoreContext(live);const stats=statRows(live);const snapshot=window.__flmLiveStateV332||{};const xg=window.__flmLiveXg||{};
  const injuries=(snapshot.events||[]).filter(event=>event.type==='injury').map(event=>playerName(db,event.playerId)).filter(Boolean);
  const ratingEntries=Object.entries(snapshot.ratings||{}).filter(([,value])=>Number.isFinite(Number(value))).sort((a,b)=>Number(b[1])-Number(a[1]));
  const top=ratingEntries[0];const topPlayer=top?playerName(db,top[0]):'';const topRating=top?Number(top[1]).toFixed(1):'';
  const cards=stats.cards||['0','0'];const reds=stats.reds||['0','0'];
  const overlay=document.createElement('section');overlay.className='v068-postmatch';overlay.dataset.v068Postmatch='1';
  overlay.innerHTML=`<article class="v068-postmatch-card"><header class="v068-post-head"><small>FULL-TIME MATCH SUMMARY</small><h3>${esc(score.text)}</h3></header><div class="v068-post-body"><div class="v068-post-stats">
    <div class="v068-post-stat"><span>xG</span><strong>${Number(xg.home||0).toFixed(2)} — ${Number(xg.away||0).toFixed(2)}</strong></div>
    <div class="v068-post-stat"><span>POSSESSION</span><strong>${esc((stats.possession||['—','—']).join(' — '))}</strong></div>
    <div class="v068-post-stat"><span>SHOTS</span><strong>${esc((stats.shots||['—','—']).join(' — '))}</strong></div>
    <div class="v068-post-stat"><span>ON TARGET</span><strong>${esc((stats['on target']||['—','—']).join(' — '))}</strong></div>
    <div class="v068-post-stat"><span>YELLOW CARDS</span><strong>${esc(cards.join(' — '))}</strong></div>
    <div class="v068-post-stat"><span>RED CARDS</span><strong>${esc(reds.join(' — '))}</strong></div>
    <div class="v068-post-stat"><span>INJURIES</span><strong>${injuries.length}</strong></div>
    <div class="v068-post-stat"><span>PLAYER OF MATCH</span><strong>${esc(topPlayer?`${topPlayer} · ${topRating}`:'—')}</strong></div>
  </div><div class="v068-post-notes"><div class="v068-post-note"><span>FINAL RESULT</span><strong>${esc(score.text)}</strong></div><div class="v068-post-note"><span>INJURY REPORT</span><strong>${esc(injuries.length?injuries.join(', '):'No match injuries recorded')}</strong></div></div></div><div class="v068-post-actions"><button type="button" data-v068-career>CONTINUE TO CAREER</button></div></article>`;
  live.appendChild(overlay);
  overlay.querySelector('[data-v068-career]').addEventListener('click',()=>{
    live.dataset.postmatchConfirmed='1';
    const finish=live.querySelector('[data-finish-live-match]');
    if(finish){finish.click();return;}
    live.querySelector('[data-cm44-continue]')?.click();
  },{once:true});
}

function repairFullTime(live){
  if(!live.classList.contains('is-full-time'))return;
  const {shell,text}=scoreContext(live);if(!shell)return;
  live.dataset.v068Fulltime='1';
  let result=shell.querySelector('[data-v068-fulltime-result]');
  if(!result){result=document.createElement('div');result.className='v068-fulltime-result';result.dataset.v068FulltimeResult='1';result.innerHTML='<small>FULL TIME</small><strong></strong>';shell.querySelector('[data-cm4-stage]')?.appendChild(result);}
  const strong=result?.querySelector('strong');if(strong&&strong.textContent!==text)strong.textContent=text;
  let button=shell.querySelector('[data-v068-ft-continue]');
  if(!button){button=document.createElement('button');button.type='button';button.className='v068-ft-continue';button.dataset.v068FtContinue='1';button.textContent='CONTINUE';shell.querySelector('[data-cm4-stage]')?.appendChild(button);button.addEventListener('click',()=>buildPostMatch(live));}
}

function formatResult(result,db){if(!result)return'';return`${clubName(db,result.homeClubId)} ${result.homeGoals}–${result.awayGoals} ${clubName(db,result.awayClubId)}`;}
async function repairOverview(){
  const c=career();if(!c?.preseason||c.preseason.phase==='complete')return;
  const overview=document.querySelector('.career-nav [data-career-tab="overview"].is-active');const root=document.querySelector('.career-content');if(!overview||!root)return;
  const db=await database();if(!db||!root.isConnected)return;
  const friendly=c.preseason.fixtures?.find(item=>!item.played);const card=root.querySelector('.career-next-match');
  if(card&&friendly){
    const signature=`${friendly.id}|${friendly.played}`;
    if(card.dataset.v068Fixture!==signature){card.dataset.v068Fixture=signature;card.innerHTML=`<p class="eyebrow">NEXT FIXTURE · PRE-SEASON</p><div class="fixture-teams"><strong>${esc(clubName(db,friendly.homeClubId))}</strong><span>VS</span><strong>${esc(clubName(db,friendly.awayClubId))}</strong></div><small>${esc(friendly.dateLabel||'Pre-season friendly')} · FRIENDLY</small><button class="career-primary" type="button" data-v068-preseason>GO TO PRE-SEASON</button>`;card.querySelector('[data-v068-preseason]')?.addEventListener('click',()=>document.querySelector('[data-v047-preseason-tab]')?.click());}
  }
  const last=[...root.querySelectorAll('.career-dashboard-grid .career-panel')].find(panel=>clean(panel.querySelector('.eyebrow')?.textContent).toUpperCase()==='LAST RESULT');
  if(last){const result=c.preseason.lastMatch;if(result?.played){const copy=formatResult(result,db);if(last.dataset.v068Result!==copy){last.dataset.v068Result=copy;last.innerHTML=`<p class="eyebrow">LAST RESULT · PRE-SEASON</p><h3>${esc(copy)}</h3><p>Friendly completed. Fitness, sharpness and tactical familiarity continue into the next pre-season week.</p>`;}}else if(!c.lastMatch&&last.dataset.v068Result!=='none'){last.dataset.v068Result='none';last.innerHTML='<p class="eyebrow">LAST RESULT</p><h3>NO MATCHES PLAYED</h3><p>Your first pre-season friendly is the next step.</p>';}}
}

function enhanceMoneyInput(input){
  if(!input||input.dataset.v068Money==='1')return;input.dataset.v068Money='1';input.type='text';input.inputMode='numeric';if(rawMoney(input.value))input.value=formatGBP(input.value);
  input.addEventListener('focus',()=>{input.value=rawMoney(input.value);input.select?.();});
  input.addEventListener('blur',()=>{if(rawMoney(input.value))input.value=formatGBP(input.value);});
}
function repairTransferMoney(){document.querySelectorAll('[data-v052-counter-fee],[data-v050-fee],[data-v061-fee]').forEach(enhanceMoneyInput);}
function normalizeMoneyBeforeAction(target){
  const counter=target.closest?.('[data-v052-counter]');if(counter){const id=counter.dataset.v052Counter;const input=document.querySelector(`[data-v052-counter-fee="${CSS.escape(id)}"]`);if(input)input.value=rawMoney(input.value);return;}
  const offer=target.closest?.('[data-v050-offer]');if(offer){const input=offer.closest('.v050-offer-box')?.querySelector('[data-v050-fee]');if(input)input.value=rawMoney(input.value);return;}
  const bid=target.closest?.('[data-v061-submit-bid]');if(bid){const input=bid.closest('.v061-negotiation')?.querySelector('[data-v061-fee]');if(input)input.value=rawMoney(input.value);}
}

async function sync(){queued=false;ensureStyles();repairTransferMoney();await repairOverview();document.querySelectorAll('.flm-live-match').forEach(repairFullTime);}
function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>sync().catch(()=>{}));}
window.addEventListener('click',event=>normalizeMoneyBeforeAction(event.target),true);
new MutationObserver(queue).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','data-career-tab','data-cm44-state','data-cm44-full-time']});
setInterval(queue,700);ensureStyles();queue();
window.FLMRecordingFixesV068=Object.freeze({version:VERSION,refresh:queue});