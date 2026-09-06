export const COMMENTARY_V3_VERSION='3.0.0';

const clean=value=>String(value||'').replace(/\s+/g,' ').trim();
const lower=value=>clean(value).toLowerCase();
const memories=new WeakMap();
let queued=false;

function memoryFor(live){
  if(!memories.has(live))memories.set(live,{
    seen:new Set(),
    centreKey:'',
    woodwork:{home:0,away:0},
    saves:{home:0,away:0},
    misses:{home:0,away:0},
    lastObserved:new WeakSet()
  });
  return memories.get(live);
}

function minuteText(row){return clean(row?.querySelector?.('b')?.textContent)||'—';}
function minuteNumber(row){return parseInt(minuteText(row),10)||0;}
function side(row){return row?.dataset?.cmSide==='home'?'home':row?.dataset?.cmSide==='away'?'away':'neutral';}
function visibleText(row){return clean(row?.querySelector?.('span')?.textContent||row?.textContent);}
function rawText(row){const span=row?.querySelector?.('span');return clean(span?.dataset?.cv2Raw||span?.dataset?.cm332Raw||span?.textContent||row?.textContent);}
function normalKey(text){return lower(text).replace(/[^a-z0-9]+/g,' ').trim();}

function teams(live){
  const native=[...live.querySelectorAll('.flm-live-team strong')];
  return{
    home:clean(live.querySelector('[data-cm4-home-name]')?.textContent||native[0]?.textContent||'Home'),
    away:clean(live.querySelector('[data-cm4-away-name]')?.textContent||native[1]?.textContent||'Away')
  };
}

function teamFor(live,s){const names=teams(live);return s==='home'?names.home:s==='away'?names.away:'MATCH';}

function allRows(live){return[...live.querySelectorAll('[data-commentary-feed] .flm-commentary-line')];}
function rowsAtMinute(live,minute){return allRows(live).filter(row=>minuteText(row)===String(minute).replace(/'$/,''));}

function minuteContext(live,row){
  const minute=minuteText(row);
  const rows=rowsAtMinute(live,minute);
  const raw=rows.map(rawText).join(' ');
  return{
    minute,
    rows,
    raw,
    penalty:/\bpenalty\b|\bspot\b/i.test(raw),
    freeKick:/free[- ]kick|yards? (?:from goal|out)|wall is set|over the wall/i.test(raw),
    var:/\bvar\b|video assistant|monitor|decision overturned|check complete/i.test(raw),
    disallowed:/no goal|disallow|goal ruled out|overturn it for offside/i.test(raw),
    dogso:/last defender|clean through on goal|screaming for a red|wanted a dismissal|denied a clear goal/i.test(raw),
    simulation:/simulation|he dived|booked for diving/i.test(raw),
    crowd:/crowd|supporters|home support|fans|boos|jeered|stadium|emirates|anfield|old trafford|etihad|stamford bridge|exits/i.test(raw)
  };
}

function shouldRestore(context,row){
  if(row.dataset.flcV1==='1')return false;
  const raw=rawText(row);
  if(!raw)return false;
  if(context.penalty||context.freeKick||context.var||context.dogso||context.simulation||context.crowd)return true;
  return false;
}

function restoreDramaSequences(live){
  const visited=new Set();
  for(const row of allRows(live)){
    const minute=minuteText(row);
    if(visited.has(minute))continue;
    visited.add(minute);
    const context=minuteContext(live,row);
    if(!(context.penalty||context.freeKick||context.var||context.dogso||context.simulation||context.crowd))continue;
    for(const item of context.rows){
      if(!shouldRestore(context,item))continue;
      const span=item.querySelector('span');
      const raw=rawText(item);
      if(span&&raw&&span.textContent!==raw)span.textContent=raw;
      item.dataset.cv3Drama='1';
      if(context.penalty)item.dataset.cv3Family='penalty';
      else if(context.freeKick)item.dataset.cv3Family='free-kick';
      else if(context.dogso)item.dataset.cv3Family='dogso';
      else if(context.simulation)item.dataset.cv3Family='simulation';
      else if(context.var)item.dataset.cv3Family='var';
      else if(context.crowd)item.dataset.cv3Family='atmosphere';
      if(context.disallowed)item.dataset.cv3Disallowed='1';
    }
  }
}

function dedupe(live,memory){
  const perMinute=new Set();
  for(const row of allRows(live)){
    if(row.dataset.cv2Duplicate==='1')continue;
    const text=visibleText(row);
    if(!text)continue;
    const key=`${minuteText(row)}|${side(row)}|${normalKey(text)}`;
    if(perMinute.has(key)){
      row.dataset.cv3Duplicate='1';
      row.setAttribute('aria-hidden','true');
      continue;
    }
    perMinute.add(key);
    if(row.dataset.cv3Duplicate==='1'){
      delete row.dataset.cv3Duplicate;
      row.removeAttribute('aria-hidden');
    }
  }
}

function classifyCurrent(live,row){
  const context=minuteContext(live,row),text=lower(visibleText(row));
  if(context.disallowed&&(/no goal|overturn|disallow/.test(text)))return{label:'NO GOAL · VAR',type:'var'};
  if(context.var&&/var|monitor|check|decision/.test(text))return{label:'VAR CHECK',type:'var'};
  if(context.penalty&&/penalty|spot|steps up|saved|missed|post/.test(text))return{label:'PENALTY',type:'penalty'};
  if(context.freeKick)return{label:'DANGEROUS FREE KICK',type:'free-kick'};
  if(context.dogso&&/red card|yellow card|referee|crowd|last defender|dismissal/.test(text))return{label:'REFEREE DECISION',type:'discipline'};
  if(context.simulation)return{label:'SIMULATION',type:'discipline'};
  if(context.crowd)return{label:'STADIUM',type:'atmosphere'};
  if(/red card|sent off|dismissed/.test(text))return{label:'RED CARD',type:'discipline'};
  return null;
}

function latestVisibleRow(live){return allRows(live).filter(row=>row.dataset.cv2Duplicate!=='1'&&row.dataset.cv3Duplicate!=='1').at(-1)||null;}

function syncCentre(live,memory){
  if(live.dataset.cm44State==='fulltime'||live.dataset.cm44FullTime==='1')return;
  const row=latestVisibleRow(live);if(!row)return;
  const classified=classifyCurrent(live,row);if(!classified)return;
  const text=visibleText(row),minute=minuteText(row),s=side(row);
  const key=`${minute}|${classified.label}|${text}`;if(memory.centreKey===key)return;memory.centreKey=key;
  const event=live.querySelector('[data-cm4-event]');
  const textNode=live.querySelector('[data-cm4-event-text]');
  const minuteNode=live.querySelector('[data-cm4-event-minute]');
  const teamNode=live.querySelector('[data-cm4-event-team]');
  if(textNode){textNode.textContent=text;textNode.dataset.cm44Text=text;textNode.setAttribute('aria-label',text);}
  if(minuteNode)minuteNode.textContent=minute;
  if(teamNode)teamNode.textContent=classified.label;
  if(event){
    event.dataset.cv3Type=classified.type;
    event.dataset.cm46Major=['var','penalty','discipline'].includes(classified.type)?'1':'0';
    if(classified.type==='discipline'&&/red card|sent off|dismissed/i.test(text))event.dataset.cm44Type='red';
    else if(classified.type==='penalty'||classified.type==='free-kick')event.dataset.cm44Type='chance';
    else event.dataset.cm44Type='normal';
  }
  const phase=live.querySelector('[data-commentary-state]');
  if(phase)phase.textContent=classified.label;
}

function rememberMatchNarrative(live,memory){
  for(const row of allRows(live)){
    if(memory.lastObserved.has(row)||row.dataset.cv2Duplicate==='1'||row.dataset.cv3Duplicate==='1')continue;
    memory.lastObserved.add(row);
    const text=lower(visibleText(row)),s=side(row);
    if(s==='neutral')continue;
    if(/off the post|off the bar|crossbar|woodwork/.test(text)){
      memory.woodwork[s]+=1;
      if(memory.woodwork[s]===2){
        const span=row.querySelector('span');
        if(span&&!/twice|second time/i.test(span.textContent))span.textContent=`${clean(span.textContent)} That's twice ${teamFor(live,s)} have hit the woodwork.`;
      }
    }
    if(/superb save|makes the save|keeper saves|goalkeeper.*save|turns it away/.test(text))memory.saves[s]+=1;
    if(/drags it wide|off target|sends it wide|just over|missed!/.test(text))memory.misses[s]+=1;
  }
}

function ensureStyles(){
  if(document.getElementById('football-lab-commentary-v3-style'))return;
  const style=document.createElement('style');
  style.id='football-lab-commentary-v3-style';
  style.textContent=`
    .flm-commentary-line[data-cv2-duplicate="1"],.flm-commentary-line[data-cv3-duplicate="1"]{display:none!important}
    .flm-commentary-line[data-cv3-family="var"]{border-color:rgba(117,188,255,.62)!important;background:rgba(36,104,168,.12)!important}
    .flm-commentary-line[data-cv3-disallowed="1"]{border-color:rgba(245,112,112,.68)!important;background:rgba(145,34,44,.12)!important;font-weight:900}
    .flm-commentary-line[data-cv3-family="penalty"]{border-color:rgba(241,207,74,.62)!important;background:rgba(241,207,74,.08)!important}
    .flm-commentary-line[data-cv3-family="free-kick"]{border-color:rgba(98,198,239,.48)!important;background:rgba(98,198,239,.06)!important}
    .flm-commentary-line[data-cv3-family="dogso"]{border-color:rgba(238,85,85,.56)!important;background:rgba(238,85,85,.07)!important}
    .flm-commentary-line[data-cv3-family="simulation"]{border-color:rgba(242,218,74,.48)!important;background:rgba(242,218,74,.055)!important}
    .flm-commentary-line[data-cv3-family="atmosphere"]{border-color:rgba(157,133,210,.38)!important;background:rgba(93,67,145,.08)!important;font-style:italic}
    .cm4-event[data-cv3-type="var"]>strong{background:linear-gradient(180deg,#153c60,#0c2841)!important;color:#d8efff!important}
    .cm4-event[data-cv3-type="penalty"]>strong{background:linear-gradient(180deg,#4a4216,#29250e)!important;color:#fff1a1!important}
    .cm4-event[data-cv3-type="discipline"]>strong{background:linear-gradient(180deg,#511d25,#2b1116)!important;color:#fff!important}
    .cm4-event[data-cv3-type="free-kick"]>strong{background:linear-gradient(180deg,#12374a,#0b2633)!important;color:#d9f5ff!important}
    .cm4-event[data-cv3-type="atmosphere"]>strong{background:linear-gradient(180deg,#29203c,#181425)!important;color:#ddd2ff!important}
  `;
  document.head.appendChild(style);
}

function sync(){
  queued=false;ensureStyles();
  for(const live of document.querySelectorAll('.flm-live-match,[data-live-match]')){
    try{
      const memory=memoryFor(live);
      restoreDramaSequences(live);
      dedupe(live,memory);
      rememberMatchNarrative(live,memory);
      syncCentre(live,memory);
      live.dataset.commentaryV3=COMMENTARY_V3_VERSION;
    }catch(_){/* commentary must never interrupt the simulation */}
  }
}

function queue(){if(queued)return;queued=true;requestAnimationFrame(sync);}

if(typeof window!=='undefined'&&typeof document!=='undefined'){
  ensureStyles();queue();
  new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','data-cm-side','data-cv2-processed','data-flc-v1','data-flc-final']});
  window.FLMCommentaryV3=Object.freeze({version:COMMENTARY_V3_VERSION,refresh:queue});
}
