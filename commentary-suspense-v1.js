export const COMMENTARY_SUSPENSE_VERSION='1.0.0';

const clean=value=>String(value||'').replace(/\s+/g,' ').trim();
const memories=new WeakMap();
let queued=false;

function memoryFor(live){
  if(!memories.has(live))memories.set(live,{goals:new Map()});
  return memories.get(live);
}

function scoreNodes(live,side){
  const selectors=side==='home'
    ? ['[data-home-score]','[data-cm4-home-score]','[data-cm45-home-score]']
    : ['[data-away-score]','[data-cm4-away-score]','[data-cm45-away-score]'];
  return [...new Set(selectors.flatMap(selector=>[...live.querySelectorAll(selector)]))];
}

function readScore(live){
  const read=side=>{
    const node=scoreNodes(live,side)[0];
    const value=Number(clean(node?.textContent));
    return Number.isFinite(value)?value:0;
  };
  return {home:read('home'),away:read('away')};
}

function writeScore(live,score){
  for(const node of scoreNodes(live,'home'))node.textContent=String(score.home);
  for(const node of scoreNodes(live,'away'))node.textContent=String(score.away);
}

function phase(live,text){
  const label=live.querySelector('[data-commentary-state]');
  if(label)label.textContent=text;
  const consolePhase=live.querySelector('[data-cm33-phase]');
  if(consolePhase)consolePhase.textContent=text;
}

function sideForKey(live,key){
  const snapshot=window.__flmLiveStateV332;
  if(!snapshot)return null;
  const minute=Number(String(key||'').split(':')[0]);
  const candidates=(snapshot.events||[]).filter(event=>event.type==='goal'&&Number(event.minute)===minute);
  const clubId=String(key||'').split(':')[1]||candidates.at(-1)?.clubId;
  if(clubId===snapshot.homeClubId)return'home';
  if(clubId===snapshot.awayClubId)return'away';
  const event=candidates.at(-1);
  if(event?.clubId===snapshot.homeClubId)return'home';
  if(event?.clubId===snapshot.awayClubId)return'away';
  return null;
}

function ensureGoalMemory(live,row,memory){
  const key=row.dataset.flcGoalKey;
  if(!key)return null;
  if(memory.goals.has(key))return memory.goals.get(key);
  const side=sideForKey(live,key);
  if(!side)return null;
  const after=readScore(live);
  const before={...after,[side]:Math.max(0,Number(after[side]||0)-1)};
  const goal={key,side,before,after,revealed:false};
  memory.goals.set(key,goal);
  return goal;
}

function suspenseRows(live){
  const memory=memoryFor(live);
  const rows=[...live.querySelectorAll('[data-commentary-feed] .flm-commentary-line[data-flc-v1="1"]')];
  for(const row of rows){
    const goal=ensureGoalMemory(live,row,memory);
    if(!goal)continue;
    const final=row.dataset.flcFinal==='1';
    if(final){
      if(row.dataset.flcSuspense!=='final'){
        row.classList.add('goal');
        row.classList.remove('flc-build','flc-chance');
        row.dataset.flcSuspense='final';
      }
      writeScore(live,goal.after);
      phase(live,'GOAL');
      goal.revealed=true;
      continue;
    }

    if(row.dataset.flcSuspense==='build')continue;
    const prior=[...rows].filter(candidate=>candidate.dataset.flcGoalKey===goal.key&&candidate!==row&&candidate.dataset.flcSuspense==='build').length;
    row.classList.remove('goal');
    row.classList.add(prior===0?'flc-build':'flc-chance');
    row.dataset.flcSuspense='build';
    writeScore(live,goal.before);
    phase(live,prior===0?'ATTACK':'CHANCE');
  }
}

function styleVisibleFeed(live){
  const raw=[...live.querySelectorAll('[data-commentary-feed] .flm-commentary-line[data-flc-v1="1"]')];
  const visible=[...live.querySelectorAll('.cm33-line')];
  for(const row of visible){
    const minute=clean(row.querySelector('b')?.textContent);
    const text=clean(row.querySelector('span')?.textContent);
    const source=raw.find(item=>clean(item.querySelector('b')?.textContent)===minute&&clean(item.querySelector('span')?.textContent)===text);
    if(!source)continue;
    if(source.dataset.flcFinal==='1'){
      row.classList.add('goal');
      row.classList.remove('flc-build','flc-chance');
      row.dataset.flcTier=source.dataset.flcTier||'standard';
      row.dataset.flcFinal='1';
    }else{
      row.classList.remove('goal');
      row.classList.add(source.classList.contains('flc-chance')?'flc-chance':'flc-build');
    }
  }
}

function ensureStyles(){
  if(document.getElementById('fl-commentary-suspense-v1-style'))return;
  const style=document.createElement('style');
  style.id='fl-commentary-suspense-v1-style';
  style.textContent=`
    .flm-commentary-line.flc-build,.cm33-line.flc-build{border-color:rgba(100,183,255,.2)!important;background:rgba(100,183,255,.035)!important;font-weight:750}
    .flm-commentary-line.flc-chance,.cm33-line.flc-chance{border-color:rgba(230,191,82,.28)!important;background:rgba(230,191,82,.045)!important;font-weight:850}
    .cm33-latest.flc-build,.cm33-latest.flc-chance{border-color:rgba(230,191,82,.28)!important}
  `;
  document.head.appendChild(style);
}

function sync(){
  queued=false;
  ensureStyles();
  for(const live of document.querySelectorAll('.flm-live-match,[data-live-match]')){
    try{
      suspenseRows(live);
      styleVisibleFeed(live);
      live.dataset.commentarySuspense=COMMENTARY_SUSPENSE_VERSION;
    }catch(_){/* suspense is presentation-only and must never interrupt the match */}
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
  new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','data-flc-v1','data-flc-final']});
  window.FLMCommentarySuspenseV1=Object.freeze({version:COMMENTARY_SUSPENSE_VERSION,refresh:queue});
}
