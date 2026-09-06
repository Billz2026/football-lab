export const COMMENTARY_MATCH_FIXES_VERSION='1.1.0';

const clean=value=>String(value||'').replace(/\s+/g,' ').trim();
const memories=new WeakMap();
let queued=false;

function memoryFor(live){
  if(!memories.has(live))memories.set(live,{goalKey:'',goalTimer:0});
  return memories.get(live);
}

function esc(value){
  return String(value??'')
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#039;');
}

function hash(value){
  let result=2166136261;
  for(const character of String(value||'')){
    result^=character.charCodeAt(0);
    result=Math.imul(result,16777619);
  }
  return result>>>0;
}

function teamNames(live){
  const native=[...live.querySelectorAll('.flm-live-team strong')];
  return {
    home:clean(live.querySelector('[data-cm4-home-name]')?.textContent||native[0]?.textContent||'Home'),
    away:clean(live.querySelector('[data-cm4-away-name]')?.textContent||native[1]?.textContent||'Away')
  };
}

function scoreNodes(live,side){
  const selectors=side==='home'
    ? ['[data-home-score]','[data-cm4-home-score]','[data-cm45-home-score]']
    : ['[data-away-score]','[data-cm4-away-score]','[data-cm45-away-score]'];
  return [...new Set(selectors.flatMap(selector=>[...live.querySelectorAll(selector)]))];
}

function readScore(live){
  const read=side=>{
    const value=Number(clean(scoreNodes(live,side)[0]?.textContent));
    return Number.isFinite(value)?value:0;
  };
  return {home:read('home'),away:read('away')};
}

function writeScore(live,score){
  for(const node of scoreNodes(live,'home'))node.textContent=String(score.home);
  for(const node of scoreNodes(live,'away'))node.textContent=String(score.away);
}

function isFullTime(live){
  const clock=clean(live.querySelector('[data-live-clock]')?.textContent||live.querySelector('[data-cm4-clock]')?.textContent);
  return live.classList.contains('is-full-time')
    || live.dataset.cm44State==='fulltime'
    || live.dataset.cm44FullTime==='1'
    || clock==='90:00';
}

function authoritativeScore(){
  const snapshot=window.__flmLiveStateV332;
  if(!snapshot||!Array.isArray(snapshot.events))return null;
  let home=0,away=0;
  for(const event of snapshot.events){
    if(event?.type!=='goal')continue;
    if(event.clubId===snapshot.homeClubId)home+=1;
    else if(event.clubId===snapshot.awayClubId)away+=1;
  }
  return {home,away};
}

function repairFullTime(live){
  if(!isFullTime(live))return;
  const score=authoritativeScore();
  if(!score)return;
  const names=teamNames(live);
  writeScore(live,score);
  const result=`${names.home} ${score.home}–${score.away} ${names.away}`;

  const nativeResult=live.querySelector('[data-full-time-score]');
  if(nativeResult)nativeResult.textContent=result;

  const eventText=live.querySelector('[data-cm4-event-text]');
  if(eventText){
    eventText.textContent=`FULL TIME · ${result}`;
    eventText.dataset.cm44Text=`FULL TIME · ${result}`;
    eventText.setAttribute('aria-label',`FULL TIME · ${result}`);
  }

  const phase=live.querySelector('[data-cm4-phase]');
  if(phase)phase.textContent='Full Time';
  const half=live.querySelector('[data-cm4-half]');
  if(half)half.textContent='FULL TIME';
  live.dataset.flc11AuthoritativeScore=`${score.home}-${score.away}`;
}

function groupRows(live,key){
  if(!key)return[];
  return [...live.querySelectorAll('[data-commentary-feed] .flm-commentary-line[data-flc-goal-key]')]
    .filter(row=>row.dataset.flcGoalKey===key);
}

function scorerFromRows(rows){
  for(const row of rows){
    const text=clean(row.querySelector('span')?.textContent);
    let match=text.match(/^(.+?)\s+is in(?:\b|\.\.\.)/i);
    if(match)return clean(match[1]);
    match=text.match(/^(.+?)\s+takes it in stride\b/i);
    if(match)return clean(match[1]);
    match=text.match(/^(.+?)\s+gets goal-side\b/i);
    if(match)return clean(match[1]);
    match=text.match(/^(.+?)\s+has half a yard\b/i);
    if(match)return clean(match[1]);
  }
  return '';
}

function lastName(name){
  const parts=clean(name).split(' ').filter(Boolean);
  return parts.at(-1)||clean(name)||'The striker';
}

function enhanceBuildRows(live){
  const rows=[...live.querySelectorAll('[data-commentary-feed] .flm-commentary-line[data-flc-v1="1"][data-flc-suspense="build"]')];
  for(const row of rows){
    if(row.dataset.flc11Enhanced==='1')continue;
    const span=row.querySelector('span');
    if(!span)continue;
    const text=clean(span.textContent);
    const key=row.dataset.flcGoalKey||'';
    const siblings=groupRows(live,key);
    const scorer=scorerFromRows(siblings);
    const variant=hash(`${key}:${text}`)%4;
    let replacement='';

    let match=text.match(/^(.+?)\s+threads it into space/i);
    if(match){
      const creator=clean(match[1]);
      replacement=[
        `${creator} sees the gap and punches the pass through the defensive line...`,
        `${creator} looks up and slides a perfectly weighted ball into the channel...`,
        `${creator} turns away from pressure and releases the attack through the middle...`,
        `${creator} spots the run early and threads the defence open...`
      ][variant];
    }else if(/\bfinds space in the final third\b/i.test(text)){
      const attacker=clean(text.split(' finds space')[0])||scorer||'The attacker';
      replacement=[
        `${attacker} receives on the turn and drives straight at the back line...`,
        `${attacker} finds a pocket between midfield and defence — danger here...`,
        `${attacker} takes a sharp first touch and attacks the space ahead...`,
        `${attacker} is allowed to turn in the final third and immediately goes forward...`
      ][variant];
    }else if(/^(.+?)\s+is in\.\.\.$/i.test(text)){
      const attacker=clean(text.match(/^(.+?)\s+is in/i)?.[1]||scorer||'The attacker');
      replacement=[
        `${attacker} takes it in stride — one touch to set himself...`,
        `${attacker} gets goal-side and carries it into the box...`,
        `${attacker} has half a yard — the chance opens up...`,
        `${attacker} is through the gap and suddenly has sight of goal...`
      ][variant];
    }else if(/^[A-ZÀ-ÖØ-Þ' -]+!$/.test(text)){
      const surname=lastName(scorer||text.replace(/!+$/,''));
      replacement=[
        `${surname} opens his body and drives it toward the corner...`,
        `${surname} sets himself and hits it cleanly...`,
        `${surname} takes aim for the far corner...`,
        `${surname} strikes through it with conviction...`
      ][variant];
    }

    if(replacement)span.textContent=replacement;
    row.dataset.flc11Enhanced='1';
  }
}

function finalCallFor(live,row){
  const span=row.querySelector('span');
  if(!span)return'';
  const minute=parseInt(clean(row.querySelector('b')?.textContent),10)||0;
  const side=row.dataset.cmSide==='away'?'away':row.dataset.cmSide==='home'?'home':null;
  const names=teamNames(live);
  const score=readScore(live);
  const team=side==='home'?names.home:side==='away'?names.away:'';
  let text=clean(span.textContent);

  if(side&&minute>=85){
    const margin=side==='home'?score.home-score.away:score.away-score.home;
    if(margin===0)text=`GOAL! ${team.toUpperCase()} HAVE FOUND A LATE EQUALISER!`;
    else if(margin===1)text=`GOAL! ${team.toUpperCase()} HAVE STRUCK LATE!`;
  }

  if(side&&/\bSCORE!$/i.test(text)){
    const margin=side==='home'?score.home-score.away:score.away-score.home;
    if(margin>=3)text=`GOAL! ${team.toUpperCase()} ARE RUNNING AWAY WITH IT!`;
    else if(margin===2)text=`GOAL! ${team.toUpperCase()} DOUBLE THEIR ADVANTAGE!`;
  }

  span.textContent=text;
  return text;
}

function showSingleGoal(live,row){
  const key=row.dataset.flcGoalKey||`${clean(row.querySelector('b')?.textContent)}:${clean(row.querySelector('span')?.textContent)}`;
  const memory=memoryFor(live);
  if(!key||memory.goalKey===key)return;
  memory.goalKey=key;
  clearTimeout(memory.goalTimer);

  const stage=live.querySelector('[data-cm4-stage]')||live;
  let host=stage.querySelector(':scope > [data-flc11-goal-once]');
  if(!host){
    host=document.createElement('div');
    host.className='flc11-goal-once';
    host.dataset.flc11GoalOnce='1';
    host.setAttribute('aria-live','assertive');
    stage.appendChild(host);
  }

  const rows=groupRows(live,row.dataset.flcGoalKey);
  const scorer=scorerFromRows(rows);
  const minute=clean(row.querySelector('b')?.textContent)||'';
  const side=row.dataset.cmSide==='away'?'away':row.dataset.cmSide==='home'?'home':null;
  const names=teamNames(live);
  const team=side==='home'?names.home:side==='away'?names.away:'GOAL';
  const score=readScore(live);
  const final=finalCallFor(live,row)||`GOAL! ${team.toUpperCase()}!`;
  const scoreline=`${names.home} ${score.home}–${score.away} ${names.away}`;

  host.innerHTML=`<div class="flc11-goal-card"><small>${esc(minute)} · ${esc(team).toUpperCase()}</small>${scorer?`<strong>${esc(scorer)}</strong>`:''}<span>${esc(final)}</span><em>${esc(scoreline)}</em></div>`;
  host.classList.add('is-visible');
  live.classList.add('flc11-goal-showing');
  memory.goalTimer=setTimeout(()=>{
    host.classList.remove('is-visible');
    host.innerHTML='';
    live.classList.remove('flc11-goal-showing');
  },2300);
}

function syncFinalGoals(live){
  const rows=[...live.querySelectorAll('[data-commentary-feed] .flm-commentary-line[data-flc-final="1"]')];
  for(const row of rows){
    if(row.dataset.flc11Final!=='1'){
      finalCallFor(live,row);
      row.dataset.flc11Final='1';
    }
  }
  const latest=rows.at(-1);
  if(latest)showSingleGoal(live,latest);
}

function ensureStyles(){
  if(document.getElementById('fl-commentary-match-fixes-v11-style'))return;
  const style=document.createElement('style');
  style.id='fl-commentary-match-fixes-v11-style';
  style.textContent=`
    .flm-live-match .cm4-goal-sequence,
    .flm-live-match .cm45-goal-overlay,
    .flm-live-match .flm-goal-flash{display:none!important}
    .flc11-goal-once{position:absolute;inset:0;z-index:70;display:none;place-items:center;padding:28px;background:rgba(2,12,22,.72);backdrop-filter:blur(2px)}
    .flc11-goal-once.is-visible{display:grid}
    .flc11-goal-card{width:min(720px,92%);padding:26px 24px;border:2px solid #f1cf4a;background:linear-gradient(180deg,#103759,#081d31);box-shadow:0 20px 70px #000b;text-align:center;color:#fff}
    .flc11-goal-card small{display:block;color:#72d5d0;font-size:10px;font-weight:950;letter-spacing:.12em}
    .flc11-goal-card strong{display:block;margin-top:9px;color:#fff;font-size:clamp(25px,4vw,44px);font-weight:1000;line-height:1}
    .flc11-goal-card span{display:block;margin-top:13px;color:#f1cf4a;font-size:clamp(18px,2.4vw,29px);font-weight:1000;line-height:1.15}
    .flc11-goal-card em{display:block;margin-top:13px;color:#d6e3eb;font-size:12px;font-style:normal;font-weight:850}
    .flm-live-match.flc11-goal-showing .cm4-event{visibility:hidden!important}
    .flm-live-match[data-cm44-state="fulltime"] .cm4-phase [data-cm4-phase]{font-size:0!important}
    .flm-live-match[data-cm44-state="fulltime"] .cm4-phase [data-cm4-phase]::after{content:'FULL TIME'!important;display:block!important;font-size:21px!important;font-weight:950!important;color:#f1cf4a!important}
    @media(max-width:760px){.flc11-goal-once{padding:12px}.flc11-goal-card{padding:20px 14px}.flc11-goal-card em{font-size:10px}}
  `;
  document.head.appendChild(style);
}

function sync(){
  queued=false;
  ensureStyles();
  for(const live of document.querySelectorAll('.flm-live-match,[data-live-match]')){
    try{
      enhanceBuildRows(live);
      syncFinalGoals(live);
      repairFullTime(live);
      live.dataset.commentaryMatchFixes=COMMENTARY_MATCH_FIXES_VERSION;
    }catch(_){/* presentation hardening must never interrupt simulation */}
  }
}

function queue(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(sync);
}

if(typeof window!=='undefined'&&typeof document!=='undefined'){
  ensureStyles();
  queue();
  new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','data-flc-v1','data-flc-final','data-flc-goal-key','data-cm44-state','data-cm44-full-time']});
  setInterval(()=>{
    document.querySelectorAll('.flm-live-match,[data-live-match]').forEach(repairFullTime);
  },500);
  window.FLMCommentaryMatchFixesV11=Object.freeze({version:COMMENTARY_MATCH_FIXES_VERSION,refresh:queue});
}
