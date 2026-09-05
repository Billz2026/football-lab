const STYLE_HREF='./match-centre-v45.css?v=4.5.0';
const PRESEASON_DATES=['2026-07-11','2026-07-18','2026-07-25','2026-08-01','2026-08-08'];
const stateByLive=new WeakMap();
let dbPromise=null;
let launching=false;

const clean=value=>String(value||'').replace(/\s+/g,' ').trim();
const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const manager=()=>window.FLMManager;
const career=()=>manager()?.activeCareer||null;

function ensureStyles(){
  if(document.querySelector('link[data-cm45-style]'))return;
  const link=document.createElement('link');
  link.rel='stylesheet';link.href=STYLE_HREF;link.dataset.cm45Style='1';document.head.appendChild(link);
}
function database(){
  if(!dbPromise&&manager()?.loadDatabase)dbPromise=manager().loadDatabase().catch(()=>null);
  return dbPromise||Promise.resolve(null);
}
function stateFor(live){
  let state=stateByLive.get(live);
  if(!state){state={seenGoals:0,goalTimer:0,lastGoalKey:''};stateByLive.set(live,state);}
  return state;
}
function nextFriendly(c){return c?.preseason?.fixtures?.find(f=>!f.played)||null;}
function nextFriendlyDate(c){
  const played=c?.preseason?.fixtures?.filter(f=>f.played).length||0;
  return PRESEASON_DATES[Math.min(played,PRESEASON_DATES.length-1)]||null;
}
function nextLeagueFixture(c){
  const round=c?.fixtures?.[c?.roundIndex||0];
  if(!Array.isArray(round))return null;
  return round.find(f=>f.homeClubId===c.clubId||f.awayClubId===c.clubId)||round[0]||null;
}
function dateReady(current,target){return !target||String(current||'')>=String(target);}
function clubName(db,id){const club=db?.clubs?.find(item=>item.id===id);return club?.shortName||club?.name||'Unknown';}
function currentGoals(){return (window.__flmLiveStateV332?.events||[]).filter(event=>event.type==='goal');}
function playerName(db,id){return db?.players?.find(player=>player.id===id)?.name||'Unknown scorer';}
function goalMinute(goal){
  const minute=Math.max(1,Math.round(Number(goal?.minute)||0));
  const flag=goal?.isOwnGoal||goal?.ownGoal?' OG':goal?.isPenalty||goal?.penalty?' P':'';
  return `${minute}'${flag}`;
}

function pollFor(selector,{timeout=2500,interval=35}={}){
  return new Promise(resolve=>{
    const started=performance.now();
    const tick=()=>{
      const node=document.querySelector(selector);
      if(node)return resolve(node);
      if(performance.now()-started>=timeout)return resolve(null);
      setTimeout(tick,interval);
    };
    tick();
  });
}
function continueWorld(){
  const button=document.querySelector('.career-header [data-v060-continue]')||document.querySelector('.career-content [data-v060-continue]');
  if(button&&!button.disabled)button.click();
}
async function startFriendlyDirect(){
  if(launching||document.querySelector('[data-live-match]'))return;
  launching=true;
  try{
    let play=document.querySelector('[data-v047-play]');
    if(!play){
      const tab=document.querySelector('.career-nav [data-v047-preseason-tab]');
      if(tab&&!tab.disabled)tab.click();
      play=await pollFor('[data-v047-play]',{timeout:3500});
    }
    if(play&&!play.disabled)play.click();
  }finally{setTimeout(()=>{launching=false;},250);}
}
async function startCompetitiveDirect(){
  if(launching||document.querySelector('[data-live-match]'))return;
  launching=true;
  try{
    const tab=document.querySelector('.career-nav [data-career-tab="matchday"]');
    if(tab&&!tab.disabled)tab.click();
    const play=await pollFor('[data-play-match]',{timeout:3500});
    if(play&&!play.disabled)play.click();
  }finally{setTimeout(()=>{launching=false;},250);}
}

function syncEntryRoutes(db){
  const c=career();
  if(!c||document.querySelector('[data-live-match]'))return;
  const shellContinue=document.querySelector('[data-shell-continue]');
  const shellLabel=document.querySelector('[data-shell-continue-label]');
  const shellDetail=document.querySelector('[data-shell-continue-detail]');
  if(shellContinue)delete shellContinue.dataset.cm45Direct;

  if(c.preseason&&c.preseason.phase!=='complete'){
    const friendly=nextFriendly(c);
    const targetDate=nextFriendlyDate(c);
    const ready=Boolean(friendly)&&dateReady(c.currentDate,targetDate);
    if(friendly&&shellContinue?.dataset.shellAction==='preseason'){
      if(ready){
        if(shellLabel)shellLabel.textContent='PLAY FRIENDLY';
        if(shellDetail)shellDetail.textContent=`${clubName(db,friendly.homeClubId)} vs ${clubName(db,friendly.awayClubId)}`;
        shellContinue.dataset.cm45Direct='friendly';
      }else{
        if(shellLabel)shellLabel.textContent='CONTINUE GAME';
        if(shellDetail)shellDetail.textContent=targetDate?`Advance to ${targetDate.split('-').reverse().slice(0,2).join('/')}`:'Advance calendar';
        shellContinue.dataset.cm45Direct='calendar';
      }
      const fixtureTeams=document.querySelector('[data-shell-fixture-teams]');
      const fixtureMeta=document.querySelector('[data-shell-fixture-meta]');
      if(fixtureTeams)fixtureTeams.textContent=`${clubName(db,friendly.homeClubId)} vs ${clubName(db,friendly.awayClubId)}`;
      if(fixtureMeta)fixtureMeta.textContent=`${friendly.dateLabel||targetDate||'Pre-season'} · FRIENDLY`;
    }
  }else{
    const fixture=nextLeagueFixture(c);
    const ready=fixture&&dateReady(c.currentDate,fixture.date);
    if(shellContinue?.dataset.shellAction==='matchday'){
      if(ready){
        if(shellLabel)shellLabel.textContent='PLAY MATCH';
        shellContinue.dataset.cm45Direct='competitive';
      }else{
        if(shellLabel)shellLabel.textContent='CONTINUE GAME';
        if(shellDetail)shellDetail.textContent=fixture?.date?`Advance to ${fixture.date}`:'Advance calendar';
        shellContinue.dataset.cm45Direct='calendar';
      }
    }
    document.querySelectorAll('.career-next-match [data-career-tab="matchday"]').forEach(button=>{
      button.textContent=ready?'PLAY MATCH':'GO TO MATCHDAY';
      if(ready)button.dataset.cm45DirectMatch='1';else delete button.dataset.cm45DirectMatch;
    });
  }
}

function ensureScorers(shell){
  const stage=shell.querySelector('[data-cm4-stage]');
  if(!stage)return null;
  let panel=stage.querySelector('[data-cm45-scorers]');
  if(panel)return panel;
  panel=document.createElement('div');
  panel.className='cm45-scorers';panel.dataset.cm45Scorers='1';panel.setAttribute('aria-hidden','true');
  panel.innerHTML='<section class="home"><div data-cm45-home-goals></div></section><section class="away"><div data-cm45-away-goals></div></section>';
  stage.prepend(panel);
  return panel;
}
function aggregateGoals(goals,clubId,db){
  const grouped=new Map();
  for(const goal of goals.filter(item=>item.clubId===clubId)){
    const key=goal.playerId||`unknown-${goal.minute}`;
    const item=grouped.get(key)||{name:playerName(db,goal.playerId),minutes:[]};
    item.minutes.push(goalMinute(goal));grouped.set(key,item);
  }
  return [...grouped.values()];
}
function renderGoalRows(items){
  if(!items.length)return '';
  return items.map(item=>`<div class="cm45-scorer-row"><strong>${esc(item.name)}</strong><span>${esc(item.minutes.join(', '))}</span></div>`).join('');
}
function syncScorers(live,shell,db){
  const panel=ensureScorers(shell);if(!panel)return;
  const snapshot=window.__flmLiveStateV332;
  const goals=currentGoals();
  const home=aggregateGoals(goals,snapshot?.homeClubId,db);
  const away=aggregateGoals(goals,snapshot?.awayClubId,db);
  panel.querySelector('[data-cm45-home-goals]').innerHTML=renderGoalRows(home);
  panel.querySelector('[data-cm45-away-goals]').innerHTML=renderGoalRows(away);
  const visible=home.length+away.length>0;
  panel.setAttribute('aria-hidden',String(!visible));
  panel.classList.toggle('is-visible',visible);
  shell.querySelector('[data-cm4-stage]')?.setAttribute('data-cm45-has-scorers',visible?'1':'0');
  shell.dataset.cm45GoalCount=String(goals.length);
}

function ensureGoalOverlay(shell){
  const stage=shell.querySelector('[data-cm4-stage]');if(!stage)return null;
  let overlay=stage.querySelector('[data-cm45-goal-overlay]');
  if(!overlay){overlay=document.createElement('div');overlay.className='cm45-goal-overlay';overlay.dataset.cm45GoalOverlay='1';stage.appendChild(overlay);}
  return overlay;
}
function scoreFromGoals(goals,snapshot){
  let home=0,away=0;
  for(const goal of goals){if(goal.clubId===snapshot?.homeClubId)home+=1;else if(goal.clubId===snapshot?.awayClubId)away+=1;}
  return{home,away};
}
function playGoalMoment(live,shell,goal,db){
  if(live.dataset.cm44State==='fulltime')return;
  const state=stateFor(live);const host=ensureGoalOverlay(shell);if(!host)return;
  clearTimeout(state.goalTimer);
  const snapshot=window.__flmLiveStateV332;const goals=currentGoals();const score=scoreFromGoals(goals,snapshot);
  const homeName=clean(shell.querySelector('[data-cm4-home-name]')?.textContent)||'Home';
  const awayName=clean(shell.querySelector('[data-cm4-away-name]')?.textContent)||'Away';
  const homeGoal=goal.clubId===snapshot?.homeClubId;const team=homeGoal?homeName:awayName;
  const scorer=playerName(db,goal.playerId);const assist=playerName(db,goal.assistPlayerId);
  const minute=goalMinute(goal);const scoreText=`${homeName} ${score.home}–${score.away} ${awayName}`;
  const frames=[
    `<div class="cm45-goal-card announce"><strong>GOAL FOR ${esc(team).toUpperCase()}!</strong></div>`,
    `<div class="cm45-goal-card scorer"><small>${esc(minute)}</small><strong>${esc(scorer)} SCORES!</strong></div>`,
    `<div class="cm45-goal-card result"><strong>${esc(scoreText)}</strong>${goal.assistPlayerId?`<span>Assist: ${esc(assist)}</span>`:''}<small>${esc(minute)}</small></div>`
  ];
  host.className=`cm45-goal-overlay is-visible ${homeGoal?'home':'away'}`;
  let index=0;
  const show=()=>{
    host.innerHTML=frames[index++];
    if(index<frames.length)state.goalTimer=setTimeout(show,index===1?600:850);
    else state.goalTimer=setTimeout(()=>{host.className='cm45-goal-overlay';host.innerHTML='';},950);
  };
  show();
}
function syncGoalMoment(live,shell,db){
  const state=stateFor(live);const goals=currentGoals();
  if(goals.length<=state.seenGoals)return;
  const goal=goals.at(-1);state.seenGoals=goals.length;
  const key=`${goal?.minute}|${goal?.clubId}|${goal?.playerId}|${goals.length}`;
  if(key===state.lastGoalKey)return;state.lastGoalKey=key;
  playGoalMoment(live,shell,goal,db);
}

function syncCompetition(shell){
  const node=shell.querySelector('[data-cm4-comp]');if(!node)return;
  const c=career();
  let label='League Match';
  if(c?.preseason&&c.preseason.phase!=='complete')label='Pre-Season Friendly';
  else label=c?.competitionName||clean(node.textContent)||'League Match';
  node.dataset.cm45Label=label;
}
function syncLive(live,db){
  const shell=live.querySelector(':scope > .cm4-shell');if(!shell)return;
  shell.dataset.cm45='1';
  syncCompetition(shell);syncScorers(live,shell,db);syncGoalMoment(live,shell,db);
  if(live.dataset.cm44State==='fulltime'){
    const overlay=shell.querySelector('[data-cm45-goal-overlay]');if(overlay){overlay.className='cm45-goal-overlay';overlay.innerHTML='';}
  }
}

async function syncAll(){
  ensureStyles();const db=await database();
  syncEntryRoutes(db);
  document.querySelectorAll('.flm-live-match[data-cm4="1"]').forEach(live=>syncLive(live,db));
}

document.addEventListener('click',event=>{
  const control=event.target.closest?.('[data-shell-continue],[data-v060-continue],[data-cm45-direct-match],.career-next-match [data-career-tab="matchday"]');
  if(!control)return;
  const c=career();
  const friendlyReady=Boolean(c?.preseason&&c.preseason.phase!=='complete'&&nextFriendly(c)&&dateReady(c.currentDate,nextFriendlyDate(c)));
  const fixture=(!c?.preseason||c.preseason.phase==='complete')?nextLeagueFixture(c):null;
  const competitiveReady=Boolean(fixture&&dateReady(c?.currentDate,fixture.date));

  if(control.matches('[data-v060-continue]')){
    if(friendlyReady){event.preventDefault();event.stopImmediatePropagation();startFriendlyDirect();}
    else if(competitiveReady){event.preventDefault();event.stopImmediatePropagation();startCompetitiveDirect();}
    return;
  }
  if(control.matches('[data-shell-continue]')){
    if(control.dataset.cm45Direct==='calendar'){
      event.preventDefault();event.stopImmediatePropagation();continueWorld();
    }else if(control.dataset.cm45Direct==='friendly'||(control.dataset.shellAction==='preseason'&&friendlyReady)){
      event.preventDefault();event.stopImmediatePropagation();startFriendlyDirect();
    }else if(control.dataset.cm45Direct==='competitive'||(control.dataset.shellAction==='matchday'&&competitiveReady)){
      event.preventDefault();event.stopImmediatePropagation();startCompetitiveDirect();
    }
    return;
  }
  if(control.closest('.career-next-match')&&competitiveReady){
    event.preventDefault();event.stopImmediatePropagation();startCompetitiveDirect();
  }
},true);

ensureStyles();
setInterval(()=>syncAll().catch(()=>{}),140);
syncAll();
