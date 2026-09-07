import './commentary-authoritative-flow-v3.js?v=3.0.0';

export const COMMENTARY_AUTHORITATIVE_ROW_HOST_VERSION='1.0.2';

const AUTHORITATIVE_VERSION='2.0.0';
const STRUCTURED_TYPES=new Set(['goal','save','woodwork','miss']);
const NATIVE_RENDER_GRACE_MS=900;
let timer=0;

function minuteOfRow(row){
  return parseInt(String(row?.querySelector?.('b')?.textContent||''),10)||0;
}

function structuredEvents(snapshot){
  return (snapshot?.events||[]).filter(event=>Boolean(
    event?.attack?.sequenceId&&STRUCTURED_TYPES.has(event.type)
  ));
}

function createRow(feed,minute,type){
  const row=document.createElement('div');
  row.className=`flm-commentary-line ${type||''}`;
  row.dataset.flAuthoritativeScaffold=COMMENTARY_AUTHORITATIVE_ROW_HOST_VERSION;
  const clock=document.createElement('b');
  clock.textContent=`${Math.max(0,Math.round(Number(minute)||0))}'`;
  const text=document.createElement('span');
  row.append(clock,text);
  feed.appendChild(row);
  return row;
}

function ensureRows(live,snapshot){
  const feed=live.querySelector('[data-commentary-feed]');
  if(!feed)return false;

  const rows=[...feed.querySelectorAll('.flm-commentary-line')];
  const protectedSequences=new Set(rows.map(row=>row.dataset.flSequenceId).filter(Boolean));
  const pending=structuredEvents(snapshot).filter(event=>!protectedSequences.has(event.attack.sequenceId));
  if(!pending.length)return false;

  const groups=new Map();
  for(const event of pending){
    const key=`${Number(event.minute)}|${event.type}`;
    groups.set(key,(groups.get(key)||0)+1);
  }

  let changed=false;
  for(const [key,eventCount] of groups){
    const [minuteText,type]=key.split('|');
    const minute=Number(minuteText);
    const expected=eventCount*4;
    const available=[...feed.querySelectorAll('.flm-commentary-line')]
      .filter(row=>!row.dataset.flSequenceId&&minuteOfRow(row)===minute&&row.classList.contains(type))
      .length;
    for(let index=available;index<expected;index+=1){
      createRow(feed,minute,type);
      changed=true;
    }
  }

  if(changed)feed.scrollTop=feed.scrollHeight;
  return changed;
}

function sync(){
  timer=0;
  const snapshot=window.__flmStructuredCommentaryV2||window.__flmLiveStateV332;
  if(!snapshot)return;
  let changed=false;
  for(const live of document.querySelectorAll('.flm-live-match,[data-live-match]')){
    if(live.dataset.authoritativeAttackCommentary!==AUTHORITATIVE_VERSION)continue;
    changed=ensureRows(live,snapshot)||changed;
  }
  if(changed)window.FLMCommentaryAuthoritativeAttacksV2?.refresh?.();
}

function queue(){
  if(timer)return;
  // The engine publishes its structured state before the native live view has
  // finished appending event lines. Give that renderer first refusal, then fill
  // only any remaining four-beat deficit. This prevents duplicate commentary.
  timer=setTimeout(sync,NATIVE_RENDER_GRACE_MS);
}

if(typeof window!=='undefined'&&typeof document!=='undefined'){
  window.addEventListener('flm:live-state-v332',queue);
  queue();
  window.FLMCommentaryAuthoritativeRowHost=Object.freeze({
    version:COMMENTARY_AUTHORITATIVE_ROW_HOST_VERSION,
    refresh:queue
  });
}
