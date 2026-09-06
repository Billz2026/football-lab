import { syncCareerNews } from './career-news-v046.js?v=0.4.6';
import { ensureTransferState, getTransferBudget } from './transfers-v050-legacy.js?v=0.5.0';

const VERSION='0.6.4';
const STYLE_ID='flm-manager-start-v064-style';
const SAVE_KEY='flm-career-save';
let bypassNewGame=false;
let pendingProfile=null;
let pendingTimer=0;
let queued=false;
let dbPromise=null;

const EXPERIENCE=Object.freeze([
  {id:'none',label:'No Playing Experience',reputation:20,respect:28,copy:'You begin with very little automatic credibility. Senior and elite players will expect you to prove yourself quickly.'},
  {id:'sunday',label:'Sunday League Footballer',reputation:35,respect:38,copy:'You understand the game, but professional players will still judge you mainly on results and decisions.'},
  {id:'semi-pro',label:'Semi-Professional Footballer',reputation:50,respect:52,copy:'You arrive with a credible football background and a neutral starting position with most squads.'},
  {id:'professional',label:'Professional Footballer',reputation:70,respect:68,copy:'Your professional career gives you immediate credibility, although established stars can still challenge you.'},
  {id:'international',label:'International Footballer',reputation:85,respect:82,copy:'Your playing career commands strong initial respect. Poor management and results can still erode it.'}
]);
const NATIONALITIES=['England','Scotland','Wales','Northern Ireland','Republic of Ireland','France','Spain','Germany','Italy','Portugal','Netherlands','Belgium','Denmark','Norway','Sweden','Poland','Croatia','Serbia','Türkiye','Morocco','Nigeria','Ghana','Senegal','South Africa','Brazil','Argentina','Uruguay','Colombia','Mexico','United States','Canada','Japan','South Korea','Australia'];

const clean=v=>String(v??'').replace(/\s+/g,' ').trim();
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
function hash(value){let h=2166136261;for(const char of String(value)){h^=char.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function manager(){return window.FLMManager||null;}
function career(){return manager()?.activeCareer||null;}
function database(){if(!dbPromise&&manager()?.loadDatabase)dbPromise=Promise.resolve(manager().loadDatabase()).catch(()=>null);return dbPromise||Promise.resolve(null);}
function formatMoney(value){try{return new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(Number(value)||0);}catch{return `£${Math.round(Number(value)||0).toLocaleString('en-GB')}`;}}
function shortDate(value){if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value||'')))return value||'TBC';return new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(`${value}T12:00:00Z`)).toUpperCase();}

function ensureStyles(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');style.id=STYLE_ID;style.textContent=`
  .flm-manager-setup{display:grid;gap:16px}.flm-manager-progress{display:grid;grid-template-columns:1fr 1fr;gap:5px}.flm-manager-progress span{height:4px;border-radius:9px;background:#31204b}.flm-manager-progress span.is-active{background:#eadb53;box-shadow:0 0 16px #eadb5338}.flm-manager-form{display:grid;grid-template-columns:1fr 1fr;gap:12px}.flm-manager-field{display:grid;gap:6px}.flm-manager-field.is-wide{grid-column:1/-1}.flm-manager-field span{color:#9da6b7;font-size:9px;font-weight:900;letter-spacing:.12em}.flm-manager-field input,.flm-manager-field select{min-height:46px;padding:0 13px;border:1px solid #4d3b70;border-radius:8px;background:#0c0a15;color:#f3eef7;font:800 13px inherit;outline:none}.flm-manager-field input:focus,.flm-manager-field select:focus{border-color:#eadb53;box-shadow:0 0 0 2px #eadb5317}.flm-manager-error{min-height:18px;color:#ff7d86;font-size:10px;font-weight:800}.flm-manager-actions{display:flex;justify-content:flex-end;gap:8px}.flm-manager-actions button{min-height:42px;padding:0 15px;border:1px solid #513b78;border-radius:7px;background:#251439;color:#e9e1f0;font-size:9px;font-weight:950;cursor:pointer}.flm-manager-actions .primary{border-color:#eadb53;background:#d6bd39;color:#14100a}.flm-exp-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:7px}.flm-exp-card{min-height:145px;padding:12px;border:1px solid #49366b;border-radius:8px;background:linear-gradient(150deg,#160e25,#090812);color:#d8d0df;text-align:left;cursor:pointer}.flm-exp-card strong{display:block;color:#f1ecf4;font-size:11px;line-height:1.3}.flm-exp-card small{display:block;margin-top:8px;color:#938aa0;font-size:9px;line-height:1.5}.flm-exp-card em{display:block;margin-top:10px;color:#d6c94f;font:900 8px/1.2 inherit;letter-spacing:.08em;font-style:normal}.flm-exp-card.is-selected{border-color:#eadb53;background:linear-gradient(150deg,#342153,#171022);box-shadow:0 0 0 1px #eadb5333}.flm-manager-summary{padding:13px;border:1px solid #4b376d;border-radius:8px;background:#0b0912;color:#aaa1b4;font-size:10px;line-height:1.6}.flm-manager-summary strong{color:#ede451}.flm-manager-strip-v064{display:grid;grid-template-columns:minmax(180px,1.4fr) repeat(3,minmax(110px,.65fr));gap:7px;margin:-2px 0 12px}.flm-manager-strip-v064>div{padding:10px 12px;border:1px solid #44345f;background:linear-gradient(145deg,#100d18,#090a12)}.flm-manager-strip-v064 small{display:block;color:#79879a;font-size:7px;font-weight:950;letter-spacing:.12em}.flm-manager-strip-v064 strong{display:block;margin-top:4px;color:#eee8f2;font-size:11px}.flm-manager-strip-v064 .identity strong{color:#e6da50}.flm-manager-strip-v064 .value strong{color:#8cc9ff}.flm-manager-strip-v064 .respect strong{color:#83e3a6}
  @media(max-width:900px){.flm-exp-grid{grid-template-columns:1fr 1fr}.flm-manager-strip-v064{grid-template-columns:1fr 1fr}}@media(max-width:620px){.flm-manager-form,.flm-exp-grid,.flm-manager-strip-v064{grid-template-columns:1fr}.flm-exp-card{min-height:0}.flm-manager-actions{flex-direction:column-reverse}.flm-manager-actions button{width:100%}}
  `;document.head.appendChild(style);
}

function modalParts(){return{modal:document.getElementById('appModal'),card:document.querySelector('#appModal .modal-card'),eyebrow:document.getElementById('modalEyebrow'),title:document.getElementById('modalTitle'),copy:document.getElementById('modalCopy'),body:document.getElementById('modalBody'),actions:document.getElementById('modalActions')};}
function openModalFrame(){const p=modalParts();if(!p.modal||!p.body)return null;p.modal.classList.add('is-open');p.modal.setAttribute('aria-hidden','false');p.card?.classList.add('modal-wide');document.body.style.overflow='hidden';p.actions?.replaceChildren();return p;}
function closeWizard(){const p=modalParts();p.modal?.classList.remove('is-open');p.modal?.setAttribute('aria-hidden','true');p.card?.classList.remove('modal-wide');document.body.style.overflow='';}
function progress(step){return `<div class="flm-manager-progress"><span class="${step>=1?'is-active':''}"></span><span class="${step>=2?'is-active':''}"></span></div>`;}

function startWizard(trigger){
  pendingProfile=null;clearTimeout(pendingTimer);
  const priorCareerId=career()?.id||null;
  const draft={firstName:'',lastName:'',nationality:'England',experienceId:null,priorCareerId,trigger};
  renderIdentity(draft);
}
function renderIdentity(draft){
  const p=openModalFrame();if(!p)return;
  p.eyebrow.textContent='NEW CAREER · CREATE MANAGER';p.title.textContent='YOUR MANAGER';p.copy.textContent='Create the person who will lead the club. Your playing background sets your starting reputation and squad credibility.';
  p.body.innerHTML=`<div class="flm-manager-setup" data-manager-setup-v064="identity">${progress(1)}<div class="flm-manager-form"><label class="flm-manager-field"><span>FIRST NAME</span><input data-mgr-first autocomplete="given-name" maxlength="32" value="${esc(draft.firstName)}"></label><label class="flm-manager-field"><span>SURNAME</span><input data-mgr-last autocomplete="family-name" maxlength="32" value="${esc(draft.lastName)}"></label><label class="flm-manager-field is-wide"><span>NATIONALITY</span><select data-mgr-nationality>${NATIONALITIES.map(n=>`<option ${n===draft.nationality?'selected':''}>${esc(n)}</option>`).join('')}</select></label></div><div class="flm-manager-error" data-mgr-error></div><div class="flm-manager-actions"><button data-mgr-cancel>CANCEL</button><button class="primary" data-mgr-next>CONTINUE</button></div></div>`;
  p.body.querySelector('[data-mgr-first]')?.focus();
  p.body.querySelector('[data-mgr-cancel]')?.addEventListener('click',closeWizard);
  p.body.querySelector('[data-mgr-next]')?.addEventListener('click',()=>{
    draft.firstName=clean(p.body.querySelector('[data-mgr-first]')?.value);draft.lastName=clean(p.body.querySelector('[data-mgr-last]')?.value);draft.nationality=clean(p.body.querySelector('[data-mgr-nationality]')?.value)||'England';
    const err=p.body.querySelector('[data-mgr-error]');
    if(draft.firstName.length<1||draft.lastName.length<1){if(err)err.textContent='Enter both a first name and surname.';return;}
    renderExperience(draft);
  });
}
function renderExperience(draft){
  const p=openModalFrame();if(!p)return;
  p.eyebrow.textContent='NEW CAREER · CREATE MANAGER';p.title.textContent='PLAYING EXPERIENCE';p.copy.textContent='This is not cosmetic. Your background determines the reputation and respect you carry into the dressing room on day one.';
  p.body.innerHTML=`<div class="flm-manager-setup" data-manager-setup-v064="experience">${progress(2)}<div class="flm-exp-grid">${EXPERIENCE.map(x=>`<button class="flm-exp-card ${x.id===draft.experienceId?'is-selected':''}" data-mgr-exp="${x.id}"><strong>${esc(x.label)}</strong><small>${esc(x.copy)}</small><em>STARTING REPUTATION ${x.reputation}</em></button>`).join('')}</div><div class="flm-manager-summary" data-mgr-summary>Select your playing background to see the starting dressing-room effect.</div><div class="flm-manager-error" data-mgr-error></div><div class="flm-manager-actions"><button data-mgr-back>BACK</button><button class="primary" data-mgr-finish>CHOOSE CLUB</button></div></div>`;
  const update=()=>{const selected=EXPERIENCE.find(x=>x.id===draft.experienceId);p.body.querySelectorAll('[data-mgr-exp]').forEach(b=>b.classList.toggle('is-selected',b.dataset.mgrExp===draft.experienceId));const summary=p.body.querySelector('[data-mgr-summary]');if(summary&&selected)summary.innerHTML=`<strong>${esc(draft.firstName)} ${esc(draft.lastName)}</strong> · ${esc(selected.label)} · Reputation ${selected.reputation}/100 · Initial squad respect ${selected.respect}/100. Results will move those values after the career begins.`;};
  p.body.querySelectorAll('[data-mgr-exp]').forEach(b=>b.addEventListener('click',()=>{draft.experienceId=b.dataset.mgrExp;update();}));
  p.body.querySelector('[data-mgr-back]')?.addEventListener('click',()=>renderIdentity(draft));
  p.body.querySelector('[data-mgr-finish]')?.addEventListener('click',()=>{
    const exp=EXPERIENCE.find(x=>x.id===draft.experienceId);const err=p.body.querySelector('[data-mgr-error]');if(!exp){if(err)err.textContent='Choose your playing experience.';return;}
    pendingProfile={schemaVersion:1,firstName:draft.firstName,lastName:draft.lastName,name:`${draft.firstName} ${draft.lastName}`,nationality:draft.nationality,experienceId:exp.id,experienceLabel:exp.label,startingReputation:exp.reputation,startingSquadRespect:exp.respect,priorCareerId:draft.priorCareerId,createdAt:new Date().toISOString()};
    pendingTimer=setTimeout(()=>{pendingProfile=null;},300000);
    closeWizard();
    const original=document.querySelector(draft.trigger==='hero'?'[data-action="new-game"]':'[data-action="new-game"]');
    if(original){bypassNewGame=true;original.click();queueMicrotask(()=>{bypassNewGame=false;});}
  });
  update();
}

function playerRespect(profile,player,careerId){
  const ca=Number(player.currentAbility)||120;const age=Number(player.reportedAge)||26;
  const star=ca>=165?-9:ca>=150?-6:ca>=135?-3:ca<=105?3:0;const seniority=age<=21?4:age>=31?-2:0;const variance=(hash(`${careerId}:${player.id}:respect`)%7)-3;
  return clamp(profile.startingSquadRespect+star+seniority+variance,10,95);
}
function applyPendingProfile(c,db){
  if(!pendingProfile||!c?.id||c.id===pendingProfile.priorCareerId||c.managerProfile?.schemaVersion)return false;
  const profile={...pendingProfile};delete profile.priorCareerId;
  c.managerName=profile.name;c.managerProfile=profile;c.managerReputation=profile.startingReputation;c.squadRespect=profile.startingSquadRespect;c.boardConfidence=50;
  c.playerRelationships=c.playerRelationships&&typeof c.playerRelationships==='object'?c.playerRelationships:{};
  for(const player of db.players.filter(p=>p.clubId===c.clubId&&!p.isPlaceholder))c.playerRelationships[player.id]={...(c.playerRelationships[player.id]||{}),managerRespect:playerRespect(profile,player,c.id),trust:50,lastUpdated:c.currentDate||c.createdAt};
  c.managerProfile.lastRespectRound=Number(c.roundIndex)||0;
  pendingProfile=null;clearTimeout(pendingTimer);return true;
}
function updateRespectFromResults(c){
  if(!c?.managerProfile?.schemaVersion)return false;
  let from=Number(c.managerProfile.lastRespectRound)||0;const to=Number(c.roundIndex)||0;if(to<=from)return false;
  let changed=false;
  for(let index=from;index<to;index++){
    const fixture=(c.fixtures?.[index]||[]).find(f=>f.homeClubId===c.clubId||f.awayClubId===c.clubId);if(!fixture?.played)continue;
    const home=fixture.homeClubId===c.clubId;const gf=home?fixture.homeGoals:fixture.awayGoals;const ga=home?fixture.awayGoals:fixture.homeGoals;const delta=gf>ga?3:gf===ga?1:-2;
    c.squadRespect=clamp((Number(c.squadRespect)||50)+delta,10,95);c.managerReputation=clamp((Number(c.managerReputation)||50)+(gf>ga?1:gf<ga?-1:0),10,95);c.boardConfidence=clamp((Number(c.boardConfidence)||50)+(gf>ga?2:gf<ga?-2:0),5,100);
    for(const relation of Object.values(c.playerRelationships||{}))if(relation&&Number.isFinite(Number(relation.managerRespect)))relation.managerRespect=clamp(Number(relation.managerRespect)+delta,5,100);
    changed=true;
  }
  c.managerProfile.lastRespectRound=to;return changed;
}

function expectationFor(c,db){
  const ids=new Set((c.table||[]).map(r=>r.clubId));const clubs=db.clubs.filter(x=>ids.has(x.id)).sort((a,b)=>(b.reputation||0)-(a.reputation||0));const rank=clubs.findIndex(x=>x.id===c.clubId)+1;
  if(rank>0&&rank<=3)return{primary:'Challenge for the Premier League title',minimum:'Finish in the top four',stretch:'Win the Premier League'};
  if(rank>0&&rank<=6)return{primary:'Qualify for the UEFA Champions League',minimum:'Finish in the top six',stretch:'Mount a title challenge'};
  if(rank>0&&rank<=10)return{primary:'Finish in the top half',minimum:'Avoid a bottom-half collapse',stretch:'Qualify for Europe'};
  return{primary:'Establish the club safely in the league',minimum:'Avoid relegation',stretch:'Finish in the top half'};
}
function openingFixtures(c,db){
  const fixtures=(c.fixtures||[]).map(round=>(round||[]).find(f=>f.homeClubId===c.clubId||f.awayClubId===c.clubId)).filter(Boolean).slice(0,6);
  return fixtures.map((f,i)=>{const home=f.homeClubId===c.clubId;const opp=db.clubs.find(x=>x.id===(home?f.awayClubId:f.homeClubId));return `${i+1}. ${opp?.shortName||opp?.name||'TBC'} (${home?'H':'A'}) · ${shortDate(f.date)}`;});
}
function patchBriefings(c,db){
  ensureTransferState(c,db);syncCareerNews(c,db);
  const budget=getTransferBudget(c);const expectation=expectationFor(c,db);
  c.boardExpectations={schemaVersion:1,...expectation,transferBudget:budget.transferBudget,wageRoom:budget.wageRoom,confidence:Number(c.boardConfidence)||50};
  const items=c.news?.items||[];const board=items.find(i=>i.key==='board-expectation');
  if(board){board.title='Board expectations and transfer budget';board.body=`Season objective: ${expectation.primary}. Minimum acceptable: ${expectation.minimum}. Stretch target: ${expectation.stretch}. Transfer budget: ${formatMoney(budget.transferBudget)}. Available wage room: ${formatMoney(budget.wageRoom)} per week. These budgets are enforced by the transfer system.`;board.priority='important';}
  const welcome=items.find(i=>i.key==='welcome');if(welcome&&c.managerProfile?.schemaVersion)welcome.body=`${c.managerProfile.name}, welcome to ${db.clubs.find(x=>x.id===c.clubId)?.name||'the club'}. Your background as a ${c.managerProfile.experienceLabel.toLowerCase()} gives you a starting manager reputation of ${c.managerReputation}/100 and squad respect of ${c.squadRespect}/100. Results and decisions will change both.`;
  const early=items.find(i=>i.key==='competition-briefing');if(early)early.body='The Premier League fixture list will be formally released on 19 June. Once published, your opening run will appear in the Inbox and the complete 38-match schedule will remain available in Fixtures.';
  const released=items.find(i=>i.key==='fixture-release');if(released){const first=openingFixtures(c,db);released.body=`Your opening six league fixtures: ${first.join(' · ')}. The complete 38-match schedule is available in the Fixtures menu.`;released.title='Premier League fixtures released · opening six confirmed';}
}
function persist(c){try{c.updatedAt=new Date().toISOString();localStorage.setItem(SAVE_KEY,JSON.stringify(c));}catch{}}
function syncManagerStrip(c){
  if(!c?.managerProfile?.schemaVersion)return;const root=document.querySelector('.career-content');const overview=document.querySelector('.career-nav [data-career-tab="overview"].is-active');if(!root||!overview)return;
  let strip=root.querySelector('[data-manager-strip-v064]');if(!strip){strip=document.createElement('section');strip.className='flm-manager-strip-v064';strip.dataset.managerStripV064='1';root.querySelector('.career-page-heading')?.after(strip);}if(!strip)return;
  const signature=[c.managerProfile.name,c.managerProfile.experienceLabel,c.managerReputation,c.squadRespect,c.boardConfidence].join('|');if(strip.dataset.signature===signature)return;strip.dataset.signature=signature;
  strip.innerHTML=`<div class="identity"><small>MANAGER</small><strong>${esc(c.managerProfile.name)}</strong></div><div><small>BACKGROUND</small><strong>${esc(c.managerProfile.experienceLabel)}</strong></div><div class="value"><small>REPUTATION</small><strong>${Math.round(c.managerReputation)}/100</strong></div><div class="respect"><small>SQUAD RESPECT</small><strong>${Math.round(c.squadRespect)}/100</strong></div>`;
}

async function sync(){
  queued=false;ensureStyles();const c=career();if(!c)return;const db=await database();if(!db)return;let changed=false;
  changed=applyPendingProfile(c,db)||changed;changed=updateRespectFromResults(c)||changed;patchBriefings(c,db);syncManagerStrip(c);if(changed||c.boardExpectations?.schemaVersion)persist(c);
}
function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>sync().catch(error=>console.error('Manager start V0.6.4:',error)));}

document.addEventListener('click',event=>{
  const start=event.target.closest?.('[data-action="new-game"]');
  if(start&&!bypassNewGame){event.preventDefault();event.stopImmediatePropagation();startWizard(start.closest('.hero')?'hero':'menu');return;}
  if(event.target.closest?.('[data-close-modal]')&&document.querySelector('[data-manager-setup-v064]')){pendingProfile=null;}
  if(event.target.closest?.('[data-action]:not([data-action="new-game"])')&&pendingProfile&&!career()?.id)pendingProfile=null;
  queue();
},true);

ensureStyles();new MutationObserver(queue).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','data-career-tab']});setInterval(queue,1000);queue();
window.FLMManagerStartV064=Object.freeze({version:VERSION,experience:EXPERIENCE,refresh:queue});
