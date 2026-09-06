import {
  COMMENTARY_ENGINE_VERSION,
  buildGoalBeats,
  classifyGoalMoment,
  createCommentaryMemory,
  goalQualityFor,
  selectFinishType
} from './commentary-engine-v1.js?v=1.0.0';

export const COMMENTARY_REALTIME_VERSION='1.0.0';

const clean=value=>String(value||'').replace(/\s+/g,' ').trim();
const memories=new WeakMap();
let queued=false;

function memoryFor(live){
  if(!memories.has(live))memories.set(live,{story:createCommentaryMemory(),active:null,latest:null,goalSerial:0});
  return memories.get(live);
}

function minuteOf(row){return parseInt(clean(row.querySelector('b')?.textContent),10)||0;}
function textOf(row){return clean(row.querySelector('span')?.textContent||row.textContent);}
function spanOf(row){return row.querySelector('span');}

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
  const value=side=>{
    const parsed=Number(clean(scoreNodes(live,side)[0]?.textContent));
    return Number.isFinite(parsed)?parsed:0;
  };
  return {home:value('home'),away:value('away')};
}

function writeScore(live,score){
  for(const node of scoreNodes(live,'home'))node.textContent=String(score.home);
  for(const node of scoreNodes(live,'away'))node.textContent=String(score.away);
}

function phase(live,value){
  const label=live.querySelector('[data-commentary-state]');
  if(label)label.textContent=value;
  const consolePhase=live.querySelector('[data-cm33-phase]');
  if(consolePhase)consolePhase.textContent=value;
}

function sideForRow(row,text,live){
  if(row.dataset.cmSide==='home'||row.dataset.cmSide==='away')return row.dataset.cmSide;
  const names=teamNames(live);
  const normal=clean(text).toLowerCase();
  if(names.home&&normal.includes(names.home.toLowerCase()))return'home';
  if(names.away&&normal.includes(names.away.toLowerCase()))return'away';
  return null;
}

function firstNameFrom(text,pattern){
  const match=clean(text).match(pattern);
  return clean(match?.[1]||'');
}

function parseCreator(text){
  return firstNameFrom(text,/^(.+?)\s+(?:sees the run|opens up the defence|finds .+? in a pocket|slips|threads)/i);
}

function parseScorer(text){
  const source=clean(text);
  let match=source.match(/^(.+?)\s+is in behind\b/i);
  if(match)return clean(match[1]);
  match=source.match(/^[^!]+!\s*(.+?)\s+is through\b/i);
  if(match)return clean(match[1]);
  match=source.match(/^(.+?)\s+(?:SHOOTS|attacks the space|breaks forward)/i);
  if(match)return clean(match[1]);
  match=source.match(/^GOAL!\s*(.+?)\s+scores for\b/i);
  return clean(match?.[1]||'');
}

function parseTeam(text){
  const match=clean(text).match(/scores for\s+(.+?)[!.]?$/i);
  return clean(match?.[1]||'').replace(/[!.]+$/,'');
}

function seedFor(live,group){
  const names=teamNames(live);
  return `${names.home}|${names.away}|${group.minute}|${group.serial}`;
}

function chooseRealtimeFinish(live,group){
  if(group.finishType)return group.finishType;
  if(!group.scorerName)return'normal';
  const selected=selectFinishType({
    fixtureId:seedFor(live,group),
    minute:group.minute,
    playerId:group.scorerName,
    currentAbility:125,
    eventIndex:group.serial
  });
  group.finishType=group.kind==='through'&&selected!=='chip'?'normal':selected;
  group.goalQuality=goalQualityFor({
    finishType:group.finishType,
    fixtureId:seedFor(live,group),
    minute:group.minute,
    playerId:group.scorerName,
    eventIndex:group.serial
  });
  return group.finishType;
}

function startGroup(live,row,memory,raw){
  const minute=minuteOf(row);
  const side=sideForRow(row,raw,live);
  if(!side)return null;
  const after=readScore(live);
  const before={...after,[side]:Math.max(0,Number(after[side]||0)-1)};
  const scorerName=parseScorer(raw);
  const creatorName=parseCreator(raw);
  const kind=/sees the run|threads the ball|opens up the defence|is in behind/i.test(raw)?'through':'role';
  const group={
    minute,
    side,
    before,
    after,
    serial:memory.goalSerial++,
    kind,
    scorerName,
    creatorName,
    teamName:'',
    finishType:null,
    goalQuality:0,
    lineIndex:0,
    closed:false,
    key:`rt:${minute}:${memory.goalSerial}`
  };
  memory.active=group;
  writeScore(live,before);
  phase(live,'ATTACK');
  return group;
}

function baseSetup(raw,group){
  if(group.kind==='through'&&group.creatorName)return `${group.creatorName} threads it into space...`;
  if(group.scorerName)return `${group.scorerName} finds space in the final third...`;
  return clean(raw).replace(/\.$/,'')+'...';
}

function provisionalBeats(live,group){
  const names=teamNames(live);
  const teamName=group.teamName||(group.side==='home'?names.home:names.away);
  const finishType=chooseRealtimeFinish(live,group);
  return buildGoalBeats({
    teamName,
    scorerName:group.scorerName||'The attacker',
    assistName:group.creatorName||'',
    finishType,
    moment:{tags:[]}
  });
}

function setBuildPresentation(live,row,group,index){
  row.classList.remove('goal');
  row.classList.add(index===0?'flc-build':'flc-chance');
  row.dataset.flcV1='1';
  row.dataset.flcGoalKey=group.key;
  row.dataset.flcSuspense='build';
  writeScore(live,group.before);
  phase(live,index===0?'ATTACK':'CHANCE');
}

function finaliseGoal(live,row,group,memory,raw){
  group.scorerName=group.scorerName||parseScorer(raw)||'The scorer';
  group.teamName=parseTeam(raw)||(group.side==='home'?teamNames(live).home:teamNames(live).away);
  const finishType=chooseRealtimeFinish(live,group);
  const moment=classifyGoalMoment({
    minute:group.minute,
    side:group.side,
    before:group.before,
    after:group.after,
    scorerId:group.scorerName
  },memory.story);
  const beats=buildGoalBeats({
    teamName:group.teamName,
    scorerName:group.scorerName,
    assistName:group.creatorName||'',
    finishType,
    moment
  });
  const quality=group.goalQuality||goalQualityFor({finishType,fixtureId:seedFor(live,group),minute:group.minute,playerId:group.scorerName,eventIndex:group.serial});
  const tier=quality>=86&&moment.importance>=86?'iconic':moment.importance>=80?'dramatic':quality>=78?'signature':'standard';
  spanOf(row).textContent=beats.final;
  row.classList.add('goal');
  row.classList.remove('flc-build','flc-chance');
  row.dataset.flcV1='1';
  row.dataset.flcGoalKey=group.key;
  row.dataset.flcFinal='1';
  row.dataset.flcTier=tier;
  row.dataset.flcSuspense='final';
  writeScore(live,group.after);
  phase(live,'GOAL');
  group.closed=true;
  memory.latest={
    key:group.key,
    minute:group.minute,
    scorerName:group.scorerName,
    teamName:group.teamName,
    finishType,
    goalQuality:quality,
    momentImportance:moment.importance,
    momentTags:moment.tags,
    tier
  };
}

function processRow(live,row,memory){
  if(row.dataset.flcV1==='1')return;
  const raw=textOf(row);
  const minute=minuteOf(row);
  let group=memory.active;
  if(!group||group.closed||group.minute!==minute)group=startGroup(live,row,memory,raw);
  if(!group)return;

  const final=/^GOAL!|scores for|finds the net/i.test(raw);
  if(final){
    finaliseGoal(live,row,group,memory,raw);
    return;
  }

  group.creatorName=group.creatorName||parseCreator(raw);
  group.scorerName=group.scorerName||parseScorer(raw);
  const index=group.lineIndex++;
  const beats=provisionalBeats(live,group);
  let replacement;
  if(index===0){
    if(group.kind==='role'&&group.scorerName&&group.finishType!=='normal')replacement=beats.setup;
    else replacement=baseSetup(raw,group);
  }else if(index===1){
    replacement=group.scorerName?beats.action:clean(raw);
  }else{
    replacement=group.scorerName?beats.shot:clean(raw);
  }
  spanOf(row).textContent=replacement;
  setBuildPresentation(live,row,group,index);
}

function styleVisibleFeed(live){
  const raw=[...live.querySelectorAll('[data-commentary-feed] .flm-commentary-line[data-flc-v1="1"]')];
  for(const row of live.querySelectorAll('.cm33-line')){
    const minute=clean(row.querySelector('b')?.textContent);
    const text=clean(row.querySelector('span')?.textContent);
    const source=raw.find(item=>clean(item.querySelector('b')?.textContent)===minute&&clean(item.querySelector('span')?.textContent)===text);
    if(!source)continue;
    row.classList.toggle('goal',source.dataset.flcFinal==='1');
    row.classList.toggle('flc-build',source.classList.contains('flc-build'));
    row.classList.toggle('flc-chance',source.classList.contains('flc-chance'));
    if(source.dataset.flcTier)row.dataset.flcTier=source.dataset.flcTier;
    if(source.dataset.flcFinal==='1')row.dataset.flcFinal='1';
  }
}

function enhanceFlash(live,memory){
  const flash=live.querySelector('.flm-goal-flash.is-visible');
  const latest=memory.latest;
  if(!flash||!latest||flash.dataset.flcRealtimeKey===latest.key)return;
  flash.dataset.flcRealtimeKey=latest.key;
  flash.dataset.flcTier=latest.tier;
  const tags=new Set(latest.momentTags||[]);
  const word=flash.querySelector('.goal-word');
  if(word){
    if(tags.has('late-winner'))word.textContent='LATE WINNER!';
    else if(tags.has('comeback-complete'))word.textContent='COMEBACK!';
    else if(tags.has('late-equaliser'))word.textContent='LATE GOAL!';
    else if(latest.tier==='iconic')word.textContent='UNBELIEVABLE!';
    else if(latest.tier==='signature')word.textContent='WHAT A GOAL!';
    else word.textContent='GOAL!';
  }
  const inner=flash.querySelector('.flm-goal-flash-inner');
  if(inner){
    let detail=inner.querySelector('.flc-goal-detail');
    if(!detail){detail=document.createElement('span');detail.className='flc-goal-detail';inner.appendChild(detail);}
    const finish=latest.finishType==='normal'?'':latest.finishType.replaceAll('-',' ');
    const moment=tags.has('late-winner')?'last-minute winner':tags.has('comeback-complete')?'comeback complete':tags.has('late-equaliser')?'late equaliser':tags.has('comeback-level')?'comeback level':'';
    detail.textContent=[finish,moment].filter(Boolean).join(' · ');
    detail.hidden=!detail.textContent;
  }
}

function ensureStyles(){
  if(document.getElementById('fl-commentary-realtime-v1-style'))return;
  const style=document.createElement('style');
  style.id='fl-commentary-realtime-v1-style';
  style.textContent=`
    .flm-commentary-line.flc-build,.cm33-line.flc-build{border-color:rgba(100,183,255,.2)!important;background:rgba(100,183,255,.035)!important;font-weight:750}
    .flm-commentary-line.flc-chance,.cm33-line.flc-chance{border-color:rgba(230,191,82,.28)!important;background:rgba(230,191,82,.045)!important;font-weight:850}
    .flm-commentary-line[data-flc-final="1"] span,.cm33-line[data-flc-final="1"] span{font-weight:1000!important}
  `;
  document.head.appendChild(style);
}

function sync(){
  queued=false;
  ensureStyles();
  for(const live of document.querySelectorAll('.flm-live-match,[data-live-match]')){
    const memory=memoryFor(live);
    try{
      const rows=[...live.querySelectorAll('[data-commentary-feed] .flm-commentary-line.goal')].filter(row=>row.dataset.flcV1!=='1');
      for(const row of rows)processRow(live,row,memory);
      styleVisibleFeed(live);
      enhanceFlash(live,memory);
      live.dataset.commentaryRealtime=COMMENTARY_REALTIME_VERSION;
      live.dataset.commentaryEngine=COMMENTARY_ENGINE_VERSION;
    }catch(_){/* commentary enhancement must never interrupt match simulation */}
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
  new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','data-cm-side','data-flc-v1','data-flc-final']});
  window.FLMCommentaryRealtimeV1=Object.freeze({version:COMMENTARY_REALTIME_VERSION,refresh:queue});
}
