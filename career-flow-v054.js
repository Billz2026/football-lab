const SAVE_KEY = 'flm-career-save';
const VERSION = 'V0.5.4';
const TAKEOVER_DATE = '2026-06-05';
const TRANSFER_OPEN = '2026-06-15';
const FIXTURE_RELEASE = '2026-06-19';
const SEASON_START = '2026-08-21';
const FIXTURE_RELEASE_TIME = '10:00 BST';
const PRESEASON_DATES = ['2026-07-11','2026-07-18','2026-07-25','2026-08-01','2026-08-08'];
let queued = false;
let browserContext = [];
let browserDb = null;

const manager = () => window.FLMManager;
const career = () => manager()?.activeCareer || null;
const esc = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');

function isoDay(value){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value||''))) return null;
  return Math.floor(Date.parse(`${value}T00:00:00Z`)/86400000);
}
function atOrAfter(a,b){const x=isoDay(a),y=isoDay(b);return x!==null&&y!==null&&x>=y;}
function formatDate(value){
  if(!value) return '—';
  const d=new Date(`${value}T12:00:00Z`);
  if(Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat('en-GB',{weekday:'short',day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(d).toUpperCase();
}
function persist(c){
  if(!c) return;
  c.updatedAt=new Date().toISOString();
  localStorage.setItem(SAVE_KEY,JSON.stringify(c));
  const status=document.querySelector('[data-career-save-status]');
  if(status) status.textContent='SAVED';
}
function toast(message,error=false){
  document.querySelector('.career-toast.v054-toast')?.remove();
  const el=document.createElement('div');
  el.className=`career-toast v054-toast${error?' is-error':''}`;
  el.textContent=message;
  document.body.appendChild(el);
  requestAnimationFrame(()=>el.classList.add('is-visible'));
  setTimeout(()=>el.remove(),2800);
}

function inferredDate(c){
  if(!c) return TAKEOVER_DATE;
  if((c.roundIndex||0)>0 || c.lastMatch){
    const idx=Math.min(Math.max(c.roundIndex||0,0),Math.max(0,(c.fixtures?.length||1)-1));
    return c.fixtures?.[idx]?.find(f=>f.date)?.date || c.fixtures?.[idx]?.[0]?.date || SEASON_START;
  }
  const ps=c.preseason;
  if(ps?.fixtures?.some(f=>f.played)){
    const played=ps.fixtures.filter(f=>f.played).length;
    return PRESEASON_DATES[Math.min(Math.max(played-1,0),PRESEASON_DATES.length-1)];
  }
  if(ps?.phase==='complete') return c.fixtures?.[0]?.[0]?.date || SEASON_START;
  return TAKEOVER_DATE;
}

function ensureCalendar(c){
  if(!c) return false;
  let changed=false;
  if(!c.calendar || typeof c.calendar!=='object'){
    c.calendar={
      schemaVersion:1,
      takeoverDate:TAKEOVER_DATE,
      currentDate:inferredDate(c),
      transferWindowOpenDate:TRANSFER_OPEN,
      fixtureReleaseDate:FIXTURE_RELEASE,
      fixtureReleaseTime:FIXTURE_RELEASE_TIME,
      fixturesReleased:false
    };
    changed=true;
  }
  const cal=c.calendar;
  for(const [key,val] of Object.entries({takeoverDate:TAKEOVER_DATE,transferWindowOpenDate:TRANSFER_OPEN,fixtureReleaseDate:FIXTURE_RELEASE,fixtureReleaseTime:FIXTURE_RELEASE_TIME})){
    if(!cal[key]){cal[key]=val;changed=true;}
  }
  if(!cal.currentDate){cal.currentDate=inferredDate(c);changed=true;}
  const released=atOrAfter(cal.currentDate,FIXTURE_RELEASE) || (c.roundIndex||0)>0 || c.preseason?.fixtures?.some(f=>f.played);
  if(Boolean(cal.fixturesReleased)!==Boolean(released)){cal.fixturesReleased=Boolean(released);changed=true;}
  c.currentDate=cal.currentDate;
  return changed;
}

function addNews(c,{key,category='Competitions',source='Club Secretary',dateLabel,title,body,order=0,priority='normal'}){
  if(!c?.news?.items) return false;
  const id=`news-${c.id}-${key}`;
  if(c.news.items.some(item=>item.id===id)) return false;
  c.news.items.push({id,key,round:0,period:'AM',dateLabel,category,source,title,body,priority,relatedClubId:c.clubId,relatedPlayerId:null,order,read:false});
  return true;
}
function syncCalendarNews(c){
  if(!c?.news?.items) return false;
  let changed=false;
  const briefing=c.news.items.find(item=>item.key==='competition-briefing');
  if(briefing && !c.calendar?.fixturesReleased){
    const title='Premier League fixture release scheduled';
    const body='The 2026/27 Premier League fixtures will be published at 10:00 BST on Friday 19 June. Competitive fixtures remain unavailable until Fixture Release Day.';
    if(briefing.title!==title){briefing.title=title;briefing.body=body;briefing.dateLabel='5 JUN';briefing.source='Competition Office';changed=true;}
  }
  if(atOrAfter(c.calendar?.currentDate,TRANSFER_OPEN)){
    changed=addNews(c,{key:'summer-window-opens',category:'Transfers',source:'Football Operations',dateLabel:'15 JUN',title:'Summer transfer window opens',body:'Premier League clubs can now complete permanent transfers. The summer window remains open until 23:00 BST on 1 September.',order:33,priority:'important'})||changed;
  }
  if(c.calendar?.fixturesReleased){
    changed=addNews(c,{key:'fixture-release',category:'Competitions',source:'Premier League',dateLabel:'19 JUN',title:'Premier League fixtures released',body:'The full 38-match 2026/27 league schedule has been published. Every club will play 19 home matches and 19 away matches, with the opening round beginning on 21 August.',order:38,priority:'important'})||changed;
  }
  return changed;
}

function nextMilestone(c){
  const d=c?.calendar?.currentDate || TAKEOVER_DATE;
  if(!atOrAfter(d,TRANSFER_OPEN)) return {date:TRANSFER_OPEN,label:'SUMMER TRANSFER WINDOW OPENS',button:'CONTINUE TO 15 JUNE'};
  if(!atOrAfter(d,FIXTURE_RELEASE)) return {date:FIXTURE_RELEASE,label:'PREMIER LEAGUE FIXTURE RELEASE',button:'CONTINUE TO 19 JUNE'};
  return null;
}
function setDate(c,date){
  ensureCalendar(c);
  c.calendar.currentDate=date;
  c.currentDate=date;
  if(atOrAfter(date,FIXTURE_RELEASE)) c.calendar.fixturesReleased=true;
  syncCalendarNews(c);
  persist(c);
}

function injectStyles(){
  if(document.getElementById('flm-v054-style')) return;
  const s=document.createElement('style');
  s.id='flm-v054-style';
  s.textContent=`
.version-chip{font-size:0!important}.version-chip::after{content:'V0.5.4'!important;font-size:11px!important}.footer-build{font-size:0!important}.footer-build::after{content:'V0.5.4 · CAREER CALENDAR & PLAYER BROWSER'!important;font-size:10px!important}
.v054-date-chip{display:grid;gap:1px;padding:6px 9px;border:1px solid rgba(239,185,63,.2);border-radius:8px;background:#0b0906;min-width:132px}.v054-date-chip small{color:#7f7669;font-size:7px;letter-spacing:.1em}.v054-date-chip strong{color:#ffd66a;font-size:9px;letter-spacing:.04em}
.v054-calendar{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;margin:0 0 12px;padding:13px 14px;border:1px solid rgba(239,185,63,.24);border-radius:10px;background:linear-gradient(135deg,#151006,#090805)}.v054-calendar small{display:block;color:#8a8174;font-size:7px;letter-spacing:.1em}.v054-calendar strong{display:block;margin-top:3px;color:#f2eadc;font-size:11px}.v054-calendar span{display:block;margin-top:4px;color:#8e867b;font-size:9px}.v054-calendar button,.v054-locked button{min-height:38px;padding:0 13px;border:1px solid #efb93f;border-radius:8px;background:#efb93f;color:#171005;font-size:8px;font-weight:950;cursor:pointer}
.v054-lock-nav{opacity:.58}.v054-lock-nav small{display:block;margin-top:2px;color:#d8ad47;font-size:7px}.v054-locked{display:grid;place-items:center;min-height:420px;padding:30px;text-align:center;border:1px solid rgba(239,185,63,.18);border-radius:12px;background:radial-gradient(circle at 50% 20%,rgba(239,185,63,.08),transparent 35%),#080704}.v054-locked .stamp{display:inline-block;padding:6px 9px;border:1px solid #5b451e;color:#ffd66a;font-size:8px;font-weight:950;letter-spacing:.12em}.v054-locked h2{margin:12px 0 6px;font-size:30px}.v054-locked p{max-width:560px;margin:0 auto 16px;color:#91897e;line-height:1.6}.v054-locked .date{margin-bottom:7px;color:#efb93f;font-size:13px;font-weight:950}
.v054-browser{position:sticky;top:0;z-index:20;display:grid;grid-template-columns:auto minmax(0,1fr) minmax(180px,330px) auto;gap:7px;align-items:center;margin:-4px 0 12px;padding:8px;border:1px solid rgba(239,185,63,.2);border-radius:9px;background:rgba(9,8,5,.97);backdrop-filter:blur(10px)}.v054-browser button{min-width:40px;min-height:36px;border:1px solid #4a3920;border-radius:7px;background:#151108;color:#ffd66a;font-size:16px;font-weight:900;cursor:pointer}.v054-browser button:disabled{opacity:.3;cursor:not-allowed}.v054-browser-meta small{display:block;color:#81786c;font-size:7px;letter-spacing:.1em}.v054-browser-meta strong{display:block;margin-top:2px;color:#f1eadf;font-size:9px}.v054-browser select{min-height:36px;border:1px solid rgba(239,185,63,.2);border-radius:7px;background:#0c0a07;color:#eee7da;padding:0 8px;font-size:9px}.modal-card.modal-wide{max-height:92vh;overflow:auto}.flm-profile-tabs{position:sticky;top:54px;z-index:15;background:#0b0906;padding-top:4px}
@media(max-width:760px){.career-header{gap:7px}.v054-date-chip{grid-column:1/-1;width:100%}.v054-calendar{grid-template-columns:1fr}.v054-browser{grid-template-columns:auto 1fr auto}.v054-browser select{grid-column:1/-1;grid-row:2}.modal-card.modal-wide{width:min(100vw,100%)!important;max-width:none!important;height:100dvh!important;max-height:100dvh!important;border-radius:0!important}.flm-profile-tabs{top:97px}}
`;
  document.head.appendChild(s);
}

function renderLocked(kind,c){
  const root=document.querySelector('.career-content');
  if(!root) return;
  const fixture=kind==='fixtures';
  root.innerHTML=`<section class="v054-locked"><div><span class="stamp">${fixture?'FIXTURE RELEASE DAY':'TRANSFER WINDOW'}</span><h2>${fixture?'Fixtures not released yet':'Transfer window not open yet'}</h2><div class="date">${fixture?'FRIDAY 19 JUNE 2026 · 10:00 BST':'MONDAY 15 JUNE 2026'}</div><p>${fixture?'The Premier League schedule is still under embargo. Continue the calendar to 19 June and the full 38-match programme will be revealed in one announcement.':'Your recruitment team can scout and prepare targets, but permanent registrations cannot be completed before the summer window opens.'}</p><button type="button" data-v054-advance>${esc(nextMilestone(c)?.button||'CONTINUE')}</button></div></section>`;
  root.querySelector('[data-v054-advance]')?.addEventListener('click',()=>advanceCalendar(c));
}

function advanceCalendar(c){
  const next=nextMilestone(c);
  if(!next) return;
  setDate(c,next.date);
  toast(next.date===TRANSFER_OPEN?'Summer transfer window is now open.':'Premier League fixtures have been released.');
  document.querySelector('[data-career-tab="overview"]')?.click();
  queueSync();
}

function syncHeaderAndOverview(c){
  const header=document.querySelector('.career-header');
  if(header){
    let chip=header.querySelector('.v054-date-chip');
    if(!chip){chip=document.createElement('div');chip.className='v054-date-chip';const actions=header.querySelector('.career-header-actions');header.insertBefore(chip,actions||null);}
    const stage=!atOrAfter(c.currentDate,TRANSFER_OPEN)?'PRE-SEASON · WINDOW CLOSED':!c.calendar.fixturesReleased?'PRE-SEASON · FIXTURE RELEASE PENDING':c.preseason?.phase==='complete'?'COMPETITIVE SEASON':'PRE-SEASON';
    const html=`<small>${esc(stage)}</small><strong>${esc(formatDate(c.currentDate))}</strong>`;
    if(chip.innerHTML!==html) chip.innerHTML=html;
  }
  const content=document.querySelector('.career-content');
  if(!content || content.querySelector('.v054-calendar') || content.dataset.v047Preseason==='1' || content.dataset.v046News==='1') return;
  const heading=content.querySelector('.career-page-heading');
  const next=nextMilestone(c);
  if(!heading || !next) return;
  const panel=document.createElement('section');
  panel.className='v054-calendar';
  panel.innerHTML=`<div><small>CAREER CALENDAR · ${esc(formatDate(c.currentDate))}</small><strong>${esc(next.label)}</strong><span>${next.date===FIXTURE_RELEASE?'The full 38-match Premier League schedule will be announced at 10:00 BST.':'Permanent transfers become available from this date.'}</span></div><button type="button" data-v054-advance>${esc(next.button)}</button>`;
  panel.querySelector('button').addEventListener('click',()=>advanceCalendar(c));
  heading.after(panel);
}

function syncNavigation(c){
  const fixtures=document.querySelector('[data-v051-fixtures]');
  if(fixtures){
    fixtures.classList.toggle('v054-lock-nav',!c.calendar.fixturesReleased);
    fixtures.title=c.calendar.fixturesReleased?'':'Fixtures will be released on 19 June 2026 at 10:00 BST.';
    if(!c.calendar.fixturesReleased){fixtures.innerHTML='Fixtures<small>19 JUN</small>';}
    else if(fixtures.textContent.trim()!=='Fixtures') fixtures.textContent='Fixtures';
  }
  const transfer=document.querySelector('[data-v050-transfer-tab]');
  const open=atOrAfter(c.currentDate,TRANSFER_OPEN);
  if(transfer){
    transfer.classList.toggle('v054-lock-nav',!open);
    transfer.title=open?'':'Summer transfer window opens 15 June 2026.';
    if(!open) transfer.innerHTML='Transfers<small>15 JUN</small>';
  }
}

function nextFixtureDate(c){
  const ps=c.preseason?.fixtures||[];
  const index=ps.findIndex(f=>!f.played);
  return index>=0 ? PRESEASON_DATES[index] : null;
}

async function ensureBrowserDb(){return browserDb ||= await manager()?.loadDatabase?.();}
function visibleIds(selector,attr){return [...document.querySelectorAll(selector)].map(el=>el.getAttribute(attr)).filter(Boolean);}
async function contextFromTarget(target){
  const c=career();
  const db=await ensureBrowserDb();
  if(!db) return [];
  if(target.closest('[data-v044-row]') || target.closest('.v050-own-row')) return db.players.filter(p=>p.clubId===c?.clubId&&!p.isPlaceholder).sort((a,b)=>(a.positionGroup||'').localeCompare(b.positionGroup||'')||a.name.localeCompare(b.name)).map(p=>p.id);
  if(target.closest('[data-v050-player]')) return visibleIds('[data-v050-player]','data-v050-player');
  if(target.closest('[data-v052-offer-row]')) return (c?.transfers?.incomingOffers||[]).map(o=>o.playerId).filter(Boolean);
  if(target.closest('.db-player-row')) return visibleIds('.db-player-row[data-player-profile]','data-player-profile');
  if(target.closest('[data-player-id]')) return [...new Set(visibleIds('[data-player-id]','data-player-id'))];
  return [];
}
function directPlayerId(target,c){
  return target.closest('[data-player-profile]')?.dataset.playerProfile || target.closest('[data-v044-row]')?.dataset.v044Row || target.closest('[data-v050-player]')?.dataset.v050Player || target.closest('[data-player-id]')?.dataset.playerId || (target.closest('[data-v052-offer-row]') ? c?.transfers?.incomingOffers?.find(o=>o.id===target.closest('[data-v052-offer-row]').dataset.v052OfferRow)?.playerId : null);
}

async function defaultContext(playerId){
  const db=await ensureBrowserDb();
  const player=db?.players?.find(p=>p.id===playerId);
  if(!player) return [];
  return db.players.filter(p=>p.clubId===player.clubId&&!p.isPlaceholder).sort((a,b)=>(a.positionGroup||'').localeCompare(b.positionGroup||'')||a.name.localeCompare(b.name)).map(p=>p.id);
}
async function openBrowserPlayer(playerId){
  if(!playerId || !window.FLMPlayerProfile?.open) return;
  await window.FLMPlayerProfile.open(playerId);
  setTimeout(decorateBrowser,0);
}
async function decorateBrowser(){
  const body=document.getElementById('modalBody');
  const profile=body?.querySelector('.flm-profile');
  const active=window.FLMPlayerProfile?.activePlayerId;
  if(!profile || !active) return;
  const db=await ensureBrowserDb();
  if(!db) return;
  if(!browserContext.includes(active)) browserContext=await defaultContext(active);
  const ids=browserContext.filter(id=>db.players.some(p=>p.id===id));
  const index=Math.max(0,ids.indexOf(active));
  profile.querySelector('.v054-browser')?.remove();
  const nav=document.createElement('div');
  nav.className='v054-browser';
  nav.innerHTML=`<button type="button" data-v054-prev ${index<=0?'disabled':''} aria-label="Previous player">‹</button><div class="v054-browser-meta"><small>QUICK PLAYER BROWSER</small><strong>${index+1} OF ${ids.length}</strong></div><select data-v054-jump aria-label="Jump to player">${ids.map(id=>{const p=db.players.find(x=>x.id===id);return `<option value="${esc(id)}" ${id===active?'selected':''}>${esc(p?.name||'Player')} · ${esc(p?.primaryPosition||'—')}</option>`;}).join('')}</select><button type="button" data-v054-next ${index>=ids.length-1?'disabled':''} aria-label="Next player">›</button>`;
  profile.prepend(nav);
  nav.querySelector('[data-v054-prev]')?.addEventListener('click',()=>openBrowserPlayer(ids[index-1]));
  nav.querySelector('[data-v054-next]')?.addEventListener('click',()=>openBrowserPlayer(ids[index+1]));
  nav.querySelector('[data-v054-jump]')?.addEventListener('change',e=>openBrowserPlayer(e.currentTarget.value));
}

function syncCalendarProgress(c){
  if(!c) return false;
  let changed=ensureCalendar(c);
  if(c.preseason?.phase==='complete' && !atOrAfter(c.currentDate,SEASON_START)){
    c.calendar.currentDate=c.fixtures?.[0]?.[0]?.date||SEASON_START;
    c.currentDate=c.calendar.currentDate;
    c.calendar.fixturesReleased=true;
    changed=true;
  } else if(c.preseason?.phase==='complete' && (c.roundIndex||0)>0){
    const idx=Math.min(c.roundIndex,Math.max(0,(c.fixtures?.length||1)-1));
    const date=c.fixtures?.[idx]?.find(f=>f.date)?.date||c.fixtures?.[idx]?.[0]?.date;
    if(date && c.currentDate!==date){c.currentDate=date;c.calendar.currentDate=date;changed=true;}
  }
  changed=syncCalendarNews(c)||changed;
  if(changed) persist(c);
  return changed;
}

function sync(){
  injectStyles();
  const c=career();
  if(!c) return;
  syncCalendarProgress(c);
  syncHeaderAndOverview(c);
  syncNavigation(c);
  if(document.querySelector('.flm-profile')) decorateBrowser();
}
function queueSync(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;sync();});}

document.addEventListener('click',async event=>{
  const c=career();
  if(!c) return;
  const fixtureTab=event.target.closest('[data-v051-fixtures]');
  if(fixtureTab && !c.calendar?.fixturesReleased){event.preventDefault();event.stopImmediatePropagation();renderLocked('fixtures',c);return;}
  const transferTab=event.target.closest('[data-v050-transfer-tab]');
  if(transferTab && !atOrAfter(c.currentDate,TRANSFER_OPEN)){event.preventDefault();event.stopImmediatePropagation();renderLocked('transfers',c);return;}
  const friendly=event.target.closest('[data-v047-play],[data-v047-sim]');
  if(friendly){
    if(!c.calendar?.fixturesReleased){event.preventDefault();event.stopImmediatePropagation();toast('Continue to Fixture Release Day on 19 June before moving into the friendly schedule.',true);return;}
    const date=nextFixtureDate(c);if(date)setDate(c,date);
  }
  if(event.target.closest('[data-v047-start]')) setTimeout(()=>{const live=career();if(live?.preseason?.phase==='complete'){setDate(live,live.fixtures?.[0]?.[0]?.date||SEASON_START);queueSync();}},0);
  if(event.target.closest('[data-finish-live-match]')) setTimeout(()=>{const live=career();if(live?.preseason?.phase==='complete')syncCalendarProgress(live);queueSync();},0);

  const id=directPlayerId(event.target,c);
  if(id){const ctx=await contextFromTarget(event.target);if(ctx.length)browserContext=[...new Set(ctx)];setTimeout(decorateBrowser,0);}
},true);

document.addEventListener('keydown',event=>{
  if(!document.querySelector('#appModal.is-open .flm-profile')) return;
  if(event.target.matches('input,select,textarea')) return;
  const active=window.FLMPlayerProfile?.activePlayerId;
  const index=browserContext.indexOf(active);
  if(event.key==='ArrowRight' && index>=0 && index<browserContext.length-1){event.preventDefault();openBrowserPlayer(browserContext[index+1]);}
  if(event.key==='ArrowLeft' && index>0){event.preventDefault();openBrowserPlayer(browserContext[index-1]);}
});

new MutationObserver(queueSync).observe(document.body,{childList:true,subtree:true});
sync();
