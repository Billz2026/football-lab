import {
  APPOINTMENT_SCHEMA_VERSION,
  MEDIA_STYLES,
  FIRST_PRESS_QUESTIONS,
  initialFanSentiment,
  fanSentimentLabel,
  fanReactionCopy,
  fanSquadAdjustment,
  mediaFanImpact,
  mediaPlayerImpact,
  applyCommunicationStyle,
  dominantCommunicationStyle
} from './appointment-media-core-v1.js?v=1.0.0';

const VERSION='0.6.7';
const STYLE_ID='flm-appointment-media-v067-style';
const SAVE_KEY='flm-career-save';
let dbPromise=null;
let queued=false;
let opening=false;

const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const manager=()=>window.FLMManager||null;
const career=()=>manager()?.activeCareer||null;
const database=()=>dbPromise||=(Promise.resolve(manager()?.loadDatabase?.()).catch(()=>null));

function ensureStyles(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');style.id=STYLE_ID;style.textContent=`
    .flm-appointment{display:grid;gap:14px;color:#ece8ef}.flm-appt-hero{padding:22px;border:1px solid #4a376c;border-radius:10px;background:radial-gradient(circle at 90% 0,rgba(101,63,155,.22),transparent 28rem),linear-gradient(135deg,#0c0a15,#151024)}.flm-appt-kicker{color:#8fa0b5;font-size:8px;font-weight:950;letter-spacing:.15em}.flm-appt-hero h3{margin:7px 0 4px;color:#f4f0f5;font-size:clamp(28px,4vw,46px);line-height:1}.flm-appt-hero p{margin:0;color:#a8a0b2;font-size:11px;line-height:1.65}.flm-appt-badges{display:flex;flex-wrap:wrap;gap:6px;margin-top:13px}.flm-appt-badge{padding:7px 9px;border:1px solid #4d3b70;border-radius:6px;background:#0d0a16;color:#d8d1df;font-size:8px;font-weight:900;letter-spacing:.07em}.flm-appt-badge strong{color:#efe15a}.flm-appt-reaction{display:grid;grid-template-columns:180px minmax(0,1fr);gap:12px}.flm-fan-score,.flm-appt-copy{padding:16px;border:1px solid #44325f;border-radius:9px;background:#0b0912}.flm-fan-score small,.flm-appt-copy small{display:block;color:#7f8ea2;font-size:8px;font-weight:950;letter-spacing:.14em}.flm-fan-score strong{display:block;margin-top:5px;color:#efe15a;font-size:22px}.flm-fan-score span{display:block;margin-top:6px;color:#a19aa9;font-size:9px}.flm-appt-copy p{margin:7px 0 0;color:#c4bdcb;font-size:11px;line-height:1.7}.flm-appt-meter{height:8px;margin-top:12px;border-radius:99px;background:#242134;overflow:hidden}.flm-appt-meter span{display:block;height:100%;width:var(--fan-score,50%);background:linear-gradient(90deg,#684e9f,#eadb53)}.flm-press-progress{display:flex;gap:5px}.flm-press-progress span{height:4px;flex:1;border-radius:99px;background:#2d2142}.flm-press-progress span.done,.flm-press-progress span.active{background:#eadb53}.flm-press-question{padding:16px;border:1px solid #49376c;border-radius:9px;background:#0d0a17}.flm-press-question small{color:#7f8ea2;font-size:8px;font-weight:950;letter-spacing:.13em}.flm-press-question h4{margin:8px 0 0;color:#f0ebf3;font-size:17px;line-height:1.35}.flm-press-options{display:grid;gap:7px}.flm-press-option{display:grid;grid-template-columns:92px minmax(0,1fr);gap:11px;align-items:start;padding:12px 13px;border:1px solid #49376c;border-radius:8px;background:linear-gradient(145deg,#141020,#0b0912);color:#d8d2dc;text-align:left;cursor:pointer}.flm-press-option:hover,.flm-press-option:focus-visible{border-color:#eadb53;background:#1b1428;outline:none}.flm-press-option b{color:#eadb53;font-size:9px;letter-spacing:.08em}.flm-press-option span{font-size:10px;line-height:1.55}.flm-appt-actions{display:flex;justify-content:flex-end;gap:8px}.flm-appt-actions button{min-height:42px;padding:0 16px;border:1px solid #503b73;border-radius:7px;background:#25183a;color:#eee8f3;font-size:9px;font-weight:950;cursor:pointer}.flm-appt-actions .primary{border-color:#eadb53;background:#d4bd39;color:#16120a}.flm-press-impact{padding:11px 12px;border-left:3px solid #eadb53;background:#120e1c;color:#aaa2b1;font-size:9px;line-height:1.6}.flm-appt-summary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.flm-appt-summary>div{padding:13px;border:1px solid #44325f;border-radius:8px;background:#0b0912}.flm-appt-summary small{display:block;color:#7f8ea2;font-size:7px;font-weight:950;letter-spacing:.12em}.flm-appt-summary strong{display:block;margin-top:5px;color:#ece7f0;font-size:11px}.flm-appt-summary .accent strong{color:#eadb53}@media(max-width:700px){.flm-appt-reaction,.flm-appt-summary{grid-template-columns:1fr}.flm-press-option{grid-template-columns:1fr;gap:5px}}
  `;const override=document.createElement('style');override.textContent=`
    .flm-appointment-open .modal-close{display:none!important}.flm-appointment-open .modal-backdrop{pointer-events:none}
    .flm-appointment{display:grid;gap:10px;color:#eef3f6}.flm-appt-hero{padding:18px;border:1px solid #24558e;border-radius:2px;background:linear-gradient(135deg,#071c38,#061326)}.flm-appt-kicker{color:#8ee7a8}.flm-appt-hero h3{color:#eef3f6}.flm-appt-hero p{color:#9caebe}.flm-appt-badge{border-color:#24558e;border-radius:2px;background:#061326;color:#dce7ee}.flm-appt-badge strong{color:#f4c342}.flm-fan-score,.flm-appt-copy{border-color:#24558e;border-radius:2px;background:#071c38}.flm-fan-score small,.flm-appt-copy small,.flm-press-question small{color:#8fa9bd}.flm-fan-score strong{color:#f4c342}.flm-fan-score span,.flm-appt-copy p{color:#9caebe}.flm-appt-meter{border-radius:0;background:#1f4674}.flm-appt-meter span{background:linear-gradient(90deg,#2d6dbb,#55dc7c)}.flm-press-clubbar{display:flex;align-items:center;gap:10px;padding:10px;border:1px solid #24558e;border-radius:2px;background:#071c38}.flm-press-clubbar>span{display:grid;place-items:center;width:34px;height:34px;border:1px solid #2d6dbb;border-radius:50%;background:#0b315c;color:#8ee7a8;font-size:9px;font-weight:950}.flm-press-clubbar>div{display:grid;gap:2px;min-width:0}.flm-press-clubbar small{color:#8fa9bd;font-size:7px;font-weight:950;letter-spacing:.12em}.flm-press-clubbar strong{color:#eef3f6;font-size:11px}.flm-press-clubbar em{color:#9caebe;font-size:9px;font-style:normal}.flm-press-clubbar>b{margin-left:auto;color:#f4c342;font-size:8px;white-space:nowrap}.flm-press-progress span{border-radius:0;background:#1f4674}.flm-press-progress span.done,.flm-press-progress span.active{background:#55dc7c}.flm-press-question{border-color:#24558e;border-radius:2px;background:#061326}.flm-press-question h4{color:#eef3f6}.flm-press-option{border-color:#24558e;border-radius:2px;background:#071c38;color:#dce7ee}.flm-press-option:hover,.flm-press-option:focus-visible{border-color:#55dc7c;background:#0b315c}.flm-press-option b{color:#f4c342}.flm-appt-actions button{border-color:#2b63a4;border-radius:2px;background:#0a2242;color:#eef3f6}.flm-appt-actions .primary{border-color:#f4c342;background:#f4c342;color:#071326}.flm-press-impact{border-left-color:#f4c342;background:#071c38;color:#9caebe}.flm-appt-summary>div{border-color:#24558e;border-radius:2px;background:#071c38}.flm-appt-summary .accent strong{color:#f4c342}@media(max-width:700px){.flm-press-clubbar{align-items:flex-start;flex-wrap:wrap}.flm-press-clubbar>b{width:100%;margin-left:44px}}
  `;document.head.appendChild(style);document.head.appendChild(override);
  const polish=document.createElement('style');polish.textContent=`
    .flm-appointment-open{place-items:stretch!important;padding:0!important}
    .flm-appointment-open .modal-card{width:100vw!important;max-width:none!important;height:100vh!important;max-height:none!important;display:flex!important;flex-direction:column!important;overflow:hidden!important;padding:clamp(24px,3vw,48px) clamp(28px,5vw,88px) 26px!important;border:0!important;border-radius:0!important;background:linear-gradient(135deg,rgba(3,14,29,.98),rgba(5,25,49,.93)),url('./assets/homepage/stadium-home.webp') center/cover no-repeat!important}
    .flm-appointment-open #modalEyebrow{color:#8ee7a8!important}
    .flm-appointment-open #modalTitle{font-size:clamp(30px,3.6vw,56px)!important;letter-spacing:-.04em!important}
    .flm-appointment-open #modalCopy{max-width:900px!important;margin:10px 0 0!important;color:#b7c7d5!important;font-size:13px!important}
    .flm-appointment-open #modalBody{min-height:0!important;display:flex!important;flex:1 1 auto!important;overflow:auto!important;margin-top:20px!important;padding-right:4px!important;scrollbar-color:#2d6dbb #061326}
    .flm-appointment-open #modalActions{display:none!important}
    .flm-appointment-open .flm-appointment[data-appointment-v066="press"]{width:100%;min-height:100%;display:grid;grid-template-columns:minmax(0,1.05fr) minmax(420px,.95fr);grid-template-rows:auto auto minmax(0,1fr);align-content:stretch;gap:12px 18px}
    .flm-appointment-open .flm-press-clubbar{grid-column:1/-1;grid-row:1;min-height:64px;padding:12px 16px;border-color:#2d6dbb;background:rgba(7,28,56,.9);box-shadow:inset 4px 0 #55dc7c}
    .flm-appointment-open .flm-press-clubbar>span{width:40px;height:40px;border-color:#55dc7c;background:#174d36;color:#bfe8cc}
    .flm-appointment-open .flm-press-clubbar>b{color:#8ee7a8}
    .flm-appointment-open .flm-press-progress{grid-column:1/-1;grid-row:2;height:5px;gap:6px}
    .flm-appointment-open .flm-press-progress span{height:5px;background:#1f4674}
    .flm-appointment-open .flm-press-progress span.done,.flm-appointment-open .flm-press-progress span.active{background:#55dc7c}
    .flm-appointment-open .flm-press-question{grid-column:1;grid-row:3;min-height:100%;display:flex;flex-direction:column;justify-content:center;padding:clamp(24px,3.2vw,58px);border-color:#2d6dbb;border-left:4px solid #55dc7c;background:linear-gradient(145deg,rgba(7,28,56,.96),rgba(5,19,39,.92))}
    .flm-appointment-open .flm-press-question small{color:#8ee7a8!important;font-size:9px!important}
    .flm-appointment-open .flm-press-question h4{max-width:760px;margin-top:16px;font-size:clamp(24px,2.7vw,44px);line-height:1.12;letter-spacing:-.025em}
    .flm-appointment-open .flm-press-question h4::before{content:'“';display:block;margin-bottom:4px;color:#55dc7c;font-size:clamp(38px,5vw,76px);line-height:.55}
    .flm-appointment-open .flm-press-options{grid-column:2;grid-row:3;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-content:center;gap:10px}
    .flm-appointment-open .flm-press-options::before{content:'YOUR RESPONSE  ·  SELECT ONE ANSWER';grid-column:1/-1;color:#8ee7a8;font-size:9px;font-weight:950;letter-spacing:.14em}
    .flm-appointment-open .flm-press-option{position:relative;min-height:96px;grid-template-columns:100px minmax(0,1fr);align-items:start;padding:16px;border-color:#2d6dbb;background:rgba(7,28,56,.94);transition:transform .16s ease,border-color .16s ease,background .16s ease}
    .flm-appointment-open .flm-press-option b{color:#bfe8cc;font-size:10px}
    .flm-appointment-open .flm-press-option span{font-size:12px;line-height:1.5}
    .flm-appointment-open .flm-press-option::after{content:'→';position:absolute;right:13px;bottom:9px;color:#55dc7c;font-size:15px;opacity:.4}
    .flm-appointment-open .flm-press-option:hover,.flm-appointment-open .flm-press-option:focus-visible{border-color:#55dc7c;background:#174d36;transform:translateY(-2px);outline:none}
    .flm-appointment-open .flm-press-option:hover::after,.flm-appointment-open .flm-press-option:focus-visible::after{opacity:1}
    .flm-appointment-open .flm-press-impact{grid-column:1/-1;grid-row:3;border-left-color:#55dc7c;background:#071c38;color:#b7c7d5}
    .flm-appointment-open .flm-appointment[data-appointment-v066="press"]:has(.flm-press-impact){grid-template-rows:auto auto auto minmax(0,1fr)}
    .flm-appointment-open .flm-appointment[data-appointment-v066="press"]:has(.flm-press-impact) .flm-press-question{grid-row:4}
    .flm-appointment-open .flm-appointment[data-appointment-v066="press"]:has(.flm-press-impact) .flm-press-options{grid-row:4}
    .flm-appointment-open .flm-appointment[data-appointment-v066="summary"]{width:min(980px,100%);margin:auto;align-content:center}
    .flm-appointment-open .flm-appt-summary .accent strong,.flm-appointment-open .flm-fan-score strong,.flm-appointment-open .flm-appt-summary .accent strong{color:#8ee7a8}
    .flm-appointment-open .flm-appt-actions .primary{border-color:#55dc7c;background:#174d36;color:#fff}
    @media(max-width:1100px){.flm-appointment-open .flm-appointment[data-appointment-v066="press"]{grid-template-columns:1fr}.flm-appointment-open .flm-press-question,.flm-appointment-open .flm-press-options{grid-column:1}.flm-appointment-open .flm-press-options{grid-row:4}.flm-appointment-open .flm-press-question{grid-row:3;min-height:260px}}
    @media(max-width:620px){.flm-appointment-open .modal-card{padding:20px 16px 18px!important}.flm-appointment-open #modalCopy{font-size:12px!important}.flm-appointment-open .flm-press-options{grid-template-columns:1fr}.flm-appointment-open .flm-press-option{grid-template-columns:1fr;min-height:82px;gap:6px}.flm-appointment-open .flm-press-clubbar{align-items:flex-start;flex-wrap:wrap}.flm-appointment-open .flm-press-clubbar>b{width:100%;margin-left:50px}}
  `;document.head.appendChild(polish);
}

function modalParts(){return{modal:document.getElementById('appModal'),card:document.querySelector('#appModal .modal-card'),eyebrow:document.getElementById('modalEyebrow'),title:document.getElementById('modalTitle'),copy:document.getElementById('modalCopy'),body:document.getElementById('modalBody'),actions:document.getElementById('modalActions')};}
function openFrame(){const p=modalParts();if(!p.modal||!p.body)return null;p.modal.classList.add('is-open');p.modal.setAttribute('aria-hidden','false');p.card?.classList.add('modal-wide');p.modal.classList.add('flm-appointment-open');document.body.style.overflow='hidden';p.actions?.replaceChildren();return p;}
function closeFrame(){const p=modalParts();p.modal?.classList.remove('is-open','flm-appointment-open');p.modal?.setAttribute('aria-hidden','true');p.card?.classList.remove('modal-wide');document.body.style.overflow=document.querySelector('.career-app.is-open')?'hidden':'';opening=false;}
function persist(c){try{c.updatedAt=new Date().toISOString();localStorage.setItem(SAVE_KEY,JSON.stringify(c));}catch{}}
function clubFor(c,db){return db.clubs.find(x=>x.id===c.clubId)||null;}
function addNews(c,item){
  c.news ||= {schemaVersion:1,items:[],generatedRounds:[]};c.news.items ||= [];
  const existing=c.news.items.find(x=>x.key===item.key);if(existing){Object.assign(existing,item);return;}
  c.news.items.push({id:`news-${c.id}-${item.key}`,round:0,period:'AM',dateLabel:'TODAY',priority:'important',relatedClubId:c.clubId,relatedPlayerId:null,read:false,...item});
}
function relationSummary(c,db){
  const squad=db.players.filter(p=>p.clubId===c.clubId&&!p.isPlaceholder);const values=squad.map(p=>Number(c.playerRelationships?.[p.id]?.managerRespect)).filter(Number.isFinite);if(!values.length)return{average:Number(c.squadRespect)||50,sceptical:0,supportive:0};
  return{average:Math.round(values.reduce((a,b)=>a+b,0)/values.length),sceptical:values.filter(x=>x<40).length,supportive:values.filter(x=>x>=65).length};
}
function initializeAppointment(c,db){
  if(!c?.managerProfile?.schemaVersion)return false;
  if(c.appointmentExperience?.schemaVersion===APPOINTMENT_SCHEMA_VERSION)return false;
  if((Number(c.roundIndex)||0)>0){c.appointmentExperience={schemaVersion:APPOINTMENT_SCHEMA_VERSION,completed:true,legacySkipped:true};return true;}
  try{window.FLMPlayerPersonalityV2?.ensure?.(c,db);}catch{}
  const club=clubFor(c,db);const initial=initialFanSentiment(c.managerReputation,club?.reputation);
  c.appointmentExperience={schemaVersion:APPOINTMENT_SCHEMA_VERSION,stage:'press',completed:false,fanSentiment:initial,initialFanSentiment:initial,fanApplied:false,questionIndex:0,answers:[],communicationProfile:{authority:50,diplomacy:50,motivation:50,mediaHandling:50,playerProtection:50},createdAt:new Date().toISOString()};
  applyInitialFanReaction(c,db);
  addNews(c,{key:'manager-appointed',category:'Club',source:club?.name||'Club',title:`${c.managerProfile.name} appointed as manager`,body:`${club?.name||'The club'} have appointed ${c.managerProfile.name} as manager. ${c.managerProfile.experienceLabel} background · starting reputation ${c.managerReputation}/100.`,order:52000});
  addNews(c,{key:'fan-reaction-appointment',category:'Supporters',source:'Supporter reaction',title:`Supporters react to ${c.managerProfile.name}'s appointment`,body:`${fanReactionCopy(initial,c.managerProfile.name,club?.name||'the club')} Initial supporter sentiment: ${fanSentimentLabel(initial)} (${initial}/100).`,order:51990});
  return true;
}
function applyInitialFanReaction(c,db){
  const state=c.appointmentExperience;if(!state||state.fanApplied)return;
  const squad=db.players.filter(p=>p.clubId===c.clubId&&!p.isPlaceholder);let total=0,count=0;
  for(const player of squad){const relation=c.playerRelationships?.[player.id];if(!relation)continue;const personality=c.playerPersonalities?.[player.id];const delta=fanSquadAdjustment(personality,state.fanSentiment,c.managerReputation,player);relation.managerRespect=clamp((Number(relation.managerRespect)||50)+delta,5,100);relation.appointmentFanDelta=delta;relation.lastUpdated=c.currentDate||c.updatedAt;total+=delta;count++;}
  const avg=count?Math.round(total/count):0;c.squadRespect=clamp((Number(c.squadRespect)||50)+avg,10,95);state.fanApplied=true;state.initialSquadReaction=avg;
}
function fanClass(score){const label=fanSentimentLabel(score);return label;}

function renderAnnouncement(c,db){
  c.appointmentExperience.stage='press';
  persist(c);
  renderPress(c,db);
}
function renderFans(c,db){
  c.appointmentExperience.stage='press';
  persist(c);
  renderPress(c,db);
}
function answerImpactText(styleId,fanDelta,avgPlayerDelta){
  const style=MEDIA_STYLES[styleId]?.label||styleId;const fan=fanDelta>0?`Fans +${fanDelta}`:fanDelta<0?`Fans ${fanDelta}`:'Fans unchanged';const squad=avgPlayerDelta>0?`squad response +${avgPlayerDelta}`:avgPlayerDelta<0?`squad response ${avgPlayerDelta}`:'squad response mixed';return`${style} answer recorded · ${fan} · ${squad}. Individual players may react differently.`;
}
function applyPressAnswer(c,db,question,styleId){
  const s=c.appointmentExperience;if(!s||s.completed)return;
  const fanDelta=mediaFanImpact(question.id,styleId,c.managerReputation,s.fanSentiment);s.fanSentiment=clamp(s.fanSentiment+fanDelta,10,95);s.communicationProfile=applyCommunicationStyle(s.communicationProfile,styleId);
  const squad=db.players.filter(p=>p.clubId===c.clubId&&!p.isPlaceholder);let total=0,count=0;
  for(const player of squad){const relation=c.playerRelationships?.[player.id];if(!relation)continue;const personality=c.playerPersonalities?.[player.id];const delta=mediaPlayerImpact(question.id,styleId,personality,c.managerReputation,player);relation.managerRespect=clamp((Number(relation.managerRespect)||50)+delta,5,100);relation.lastMediaReaction={questionId:question.id,styleId,delta};relation.lastUpdated=c.currentDate||c.updatedAt;total+=delta;count++;}
  const avg=count?Math.round(total/count):0;c.squadRespect=clamp((Number(c.squadRespect)||50)+avg,10,95);s.answers.push({questionId:question.id,styleId,fanDelta,averageSquadDelta:avg});s.questionIndex+=1;s.lastImpact=answerImpactText(styleId,fanDelta,avg);persist(c);
}
function renderPress(c,db){
  const p=openFrame();if(!p)return;opening=true;const s=c.appointmentExperience;const club=clubFor(c,db);const index=Math.min(Number(s.questionIndex)||0,FIRST_PRESS_QUESTIONS.length);s.stage='press';persist(c);
  if(index>=FIRST_PRESS_QUESTIONS.length){completePress(c,db);renderSummary(c,db);return;}
  const q=FIRST_PRESS_QUESTIONS[index];const context={clubName:club?.name||'the club',experienceLabel:c.managerProfile.experienceLabel,managerName:c.managerProfile.name};const clubCode=String(club?.shortName||club?.name||'FLM').replace(/[^A-Za-z]/g,'').slice(0,3).toUpperCase();p.eyebrow.textContent='NEW CAREER · FIRST DAY';p.title.textContent='FIRST PRESS CONFERENCE';p.copy.textContent='The cameras are waiting. Every answer will shape your first reputation with the board, supporters and the dressing room.';
  p.body.innerHTML=`<div class="flm-appointment" data-appointment-v066="press"><section class="flm-press-clubbar"><span>${esc(clubCode)}</span><div><small>MEDIA ROOM · DAY 1</small><strong>${esc(club?.name||'The club')}</strong><em>${esc(c.managerProfile.name)} · New manager</em></div><b>QUESTION ${index+1} / ${FIRST_PRESS_QUESTIONS.length}</b></section><div class="flm-press-progress">${FIRST_PRESS_QUESTIONS.map((_,i)=>`<span class="${i<index?'done':i===index?'active':''}"></span>`).join('')}</div>${s.lastImpact?`<div class="flm-press-impact">${esc(s.lastImpact)}</div>`:''}<section class="flm-press-question"><small>THE QUESTION</small><h4>${esc(q.prompt(context))}</h4></section><div class="flm-press-options">${Object.keys(MEDIA_STYLES).map(styleId=>`<button class="flm-press-option" data-media-answer="${styleId}"><b>${esc(MEDIA_STYLES[styleId].label.toUpperCase())}</b><span>${esc(q.responses[styleId])}</span></button>`).join('')}</div></div>`;
  p.body.querySelectorAll('[data-media-answer]').forEach(button=>button.addEventListener('click',()=>{p.body.querySelectorAll('[data-media-answer]').forEach(x=>x.disabled=true);applyPressAnswer(c,db,q,button.dataset.mediaAnswer);if(s.questionIndex>=FIRST_PRESS_QUESTIONS.length){completePress(c,db);renderSummary(c,db);}else renderPress(c,db);}));
}
function completePress(c,db){
  const s=c.appointmentExperience;if(!s||s.completed)return;const club=clubFor(c,db);s.completed=true;s.stage='complete';s.completedAt=new Date().toISOString();s.communicationStyle=dominantCommunicationStyle(s.communicationProfile);const relations=relationSummary(c,db);s.finalSquadRespect=relations.average;
  addNews(c,{key:'first-press-conference',category:'Media',source:'Press conference',title:`${c.managerProfile.name} faces the media for the first time`,body:`First press conference complete. Communication profile: ${s.communicationStyle}. Supporter sentiment: ${fanSentimentLabel(s.fanSentiment)} (${Math.round(s.fanSentiment)}/100). Squad respect: ${Math.round(c.squadRespect)}/100.`,order:51980});persist(c);window.dispatchEvent(new CustomEvent('flm:appointment-complete',{detail:{careerId:c.id}}));
}
function renderSummary(c,db){
  const p=openFrame();if(!p)return;opening=true;const s=c.appointmentExperience;const relations=relationSummary(c,db);p.eyebrow.textContent='NEW CAREER · PRESS CONFERENCE COMPLETE';p.title.textContent='FIRST IMPRESSION SET';p.copy.textContent='Your answers have started to define how supporters, players and the media see you.';
  p.body.innerHTML=`<div class="flm-appointment" data-appointment-v066="summary"><div class="flm-appt-summary"><div class="accent"><small>FAN SENTIMENT</small><strong>${esc(fanSentimentLabel(s.fanSentiment))} · ${Math.round(s.fanSentiment)}/100</strong></div><div><small>COMMUNICATION STYLE</small><strong>${esc(s.communicationStyle)}</strong></div><div><small>SQUAD RESPECT</small><strong>${Math.round(c.squadRespect)}/100</strong></div></div><section class="flm-appt-copy"><small>DRESSING ROOM</small><p>${relations.supportive} players currently show strong support. ${relations.sceptical} remain sceptical. Those positions can change through results, selection decisions and future media handling.</p></section><div class="flm-appt-actions"><button class="primary" data-appt-enter>ENTER CAREER</button></div></div>`;
  p.body.querySelector('[data-appt-enter]')?.addEventListener('click',()=>{s.dismissed=true;persist(c);closeFrame();});
}
function maybeOpen(c,db){
  const s=c.appointmentExperience;if(!s||s.legacySkipped||s.dismissed)return;if(opening)return;const modal=document.getElementById('appModal');if(modal?.classList.contains('is-open')&&!modal.classList.contains('flm-appointment-open'))return;
  if(s.completed){renderSummary(c,db);return;}renderPress(c,db);
}
async function sync(){
  queued=false;ensureStyles();const c=career();if(!c?.managerProfile?.schemaVersion)return;const db=await database();if(!db)return;let changed=initializeAppointment(c,db);if(changed)persist(c);if(document.querySelector('.career-app.is-open'))setTimeout(()=>maybeOpen(c,db),180);
}
function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>sync().catch(error=>console.error('Appointment Media V0.6.6:',error)));}
ensureStyles();new MutationObserver(queue).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});document.addEventListener('click',queue,true);window.addEventListener('flm:personality-v2',queue);setInterval(queue,1400);queue();
window.FLMAppointmentMedia=Object.freeze({version:VERSION,refresh:queue});
