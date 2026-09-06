import { resolveMatchKits } from './kit-colours-v1.js?v=1.0.0';

const VERSION='0.7.0';
const STYLE_ID='flm-matchday-runtime-fixes-v070-style';
let queued=false;
let dbPromise=null;
const clean=value=>String(value||'').replace(/\s+/g,' ').trim();
const esc=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const database=()=>dbPromise||=(Promise.resolve(window.FLMManager?.loadDatabase?.()).catch(()=>null));

function ensureStyles(){
  if(document.getElementById(STYLE_ID))return;
  const style=document.createElement('style');
  style.id=STYLE_ID;
  style.textContent=`
    .flm-live-match[data-cm4="1"] .cm4-home-team strong{color:var(--home-ink,#fff)!important}
    .flm-live-match[data-cm4="1"] .cm4-away-team strong{color:var(--away-ink,#fff)!important}
    .flm-match-dialog.v2-sub-dialog .v2-sub-list[data-v2-out-list]{max-height:none!important;overflow:visible!important}
    .flm-match-dialog.v2-sub-dialog .v2-sub-list[data-v2-out-list] .v2-sub-player{min-height:44px!important;padding-top:5px!important;padding-bottom:5px!important}
    .flm-match-dialog.v2-sub-dialog .v2-sub-shell{align-items:start}
    .flm-match-dialog.v2-sub-dialog .v2-sub-column:first-child{align-self:start}
    @media(max-width:760px){
      .flm-match-dialog.v2-sub-dialog .v2-sub-list[data-v2-out-list]{max-height:430px!important;overflow:auto!important}
      .flm-match-dialog.v2-sub-dialog .v2-sub-list[data-v2-out-list] .v2-sub-player{min-height:48px!important}
    }
  `;
  document.head.appendChild(style);
}

function teamNames(live){
  const shell=live.querySelector(':scope > .cm4-shell');
  const native=[...live.querySelectorAll('.flm-live-team strong')];
  return {
    home:clean(shell?.querySelector('[data-cm4-home-name]')?.textContent)||clean(native[0]?.textContent)||'Home',
    away:clean(shell?.querySelector('[data-cm4-away-name]')?.textContent)||clean(native[1]?.textContent)||'Away'
  };
}

function applyKits(live){
  if(!live?.isConnected)return;
  const names=teamNames(live);
  const signature=`${names.home}|${names.away}`;
  if(live.dataset.v070KitSignature===signature)return;
  const resolved=resolveMatchKits(names.home,names.away);
  live.dataset.v070KitSignature=signature;
  live.dataset.homeKit=resolved.home.type;
  live.dataset.awayKit=resolved.away.type;
  live.style.setProperty('--home-color',resolved.home.primary);
  live.style.setProperty('--away-color',resolved.away.primary);
  live.style.setProperty('--home-ink',resolved.home.ink);
  live.style.setProperty('--away-ink',resolved.away.ink);
  if(live._cmV2Context){
    live._cmV2Context.homeColour=resolved.home.primary;
    live._cmV2Context.awayColour=resolved.away.primary;
  }
}

function isFullTime(live){
  if(!live)return false;
  const clock=clean(live.querySelector('[data-live-clock]')?.textContent||live.querySelector('[data-cm4-clock]')?.textContent);
  return live.classList.contains('is-full-time')||live.dataset.cm44State==='fulltime'||live.dataset.cm44FullTime==='1'||clock==='90:00';
}

function finishDirect(live){
  const finish=live?.querySelector('[data-finish-live-match]');
  if(!finish||finish.disabled)return false;
  live.dataset.postmatchConfirmed='1';
  live.dataset.v070FinishRequested='1';
  live.querySelector('[data-v068-postmatch]')?.remove();
  live.querySelector('[data-postmatch-v067]')?.remove();
  finish.click();
  return true;
}

function optionData(option){
  const parts=String(option?.textContent||'').split('·').map(part=>part.trim());
  return {id:option?.value||'',name:parts[0]||option?.value||'',position:parts[1]||'',condition:parts[2]||''};
}

function userActiveIds(snapshot){
  if(!snapshot)return[];
  return snapshot.userClubId===snapshot.homeClubId?[...(snapshot.homeLineupIds||[])]:[...(snapshot.awayLineupIds||[])];
}

function positionFamily(code){
  const value=String(code||'').toUpperCase().replace(/[^A-Z]/g,'');
  if(value.includes('GK'))return'GK';
  if(/(RCB|LCB|CB|DC)/.test(value))return'CB';
  if(/(RWB|LWB|WBR|WBL|RB|LB|DR|DL)/.test(value))return'FB';
  if(/(RDM|LDM|DMC|DM|RCM|LCM|MC|CM|AMC|AM)/.test(value))return'MID';
  if(/(AMR|AML|MR|ML|RW|LW|FR|FL)/.test(value))return'W';
  if(/(RST|LST|ST|CF|FC|SC)/.test(value))return'ST';
  return'OTHER';
}

function fit(outgoing,incoming){
  const out=positionFamily(outgoing.position),inside=positionFamily(incoming.position);
  if(out==='GK')return inside==='GK'?{allowed:true,label:'GOALKEEPER',tone:'natural'}:{allowed:false,label:'GK REQUIRED',tone:'poor'};
  if(inside==='GK')return{allowed:false,label:'GOALKEEPER',tone:'poor'};
  if(out===inside)return{allowed:true,label:'NATURAL FIT',tone:'natural'};
  const related=(out==='CB'&&inside==='FB')||(out==='FB'&&inside==='CB')||(out==='MID'&&inside==='W')||(out==='W'&&inside==='MID')||(out==='W'&&inside==='ST')||(out==='ST'&&inside==='W');
  return related?{allowed:true,label:'CAN COVER',tone:'cover'}:{allowed:true,label:'OUT OF POSITION',tone:'poor'};
}

function wireRecoveredOutgoing(dialog,row,item){
  if(row.dataset.v070Wired==='1')return;
  row.dataset.v070Wired='1';
  row.addEventListener('click',event=>{
    event.preventDefault();
    const off=dialog.querySelector('[data-sub-out]');
    const on=dialog.querySelector('[data-sub-in]');
    const apply=dialog.querySelector('[data-apply-sub]');
    const inList=dialog.querySelector('[data-v2-in-list]');
    const help=dialog.querySelector('[data-v2-bench-help]');
    const plan=dialog.querySelector('[data-v2-plan]');
    if(!off||!on||!apply||!inList)return;
    off.value=item.id;
    dialog.querySelectorAll('[data-v2-out-list] .v2-sub-player').forEach(node=>node.classList.toggle('is-selected-out',node===row));
    const incoming=[...on.options].map(optionData).filter(entry=>entry.id);
    const ranked=incoming.map(entry=>({entry,fit:fit(item,entry)})).sort((a,b)=>Number(!a.fit.allowed)-Number(!b.fit.allowed)||a.fit.tone.localeCompare(b.fit.tone)||a.entry.name.localeCompare(b.entry.name));
    inList.innerHTML='';
    for(const candidate of ranked){
      const button=document.createElement('button');
      button.type='button';
      button.className='v2-sub-player';
      button.disabled=!candidate.fit.allowed;
      button.innerHTML=`<span class="pos">${esc(candidate.entry.position||'SUB')}</span><span><strong>${esc(candidate.entry.name)}</strong><small class="v2-sub-fit ${candidate.fit.tone}">${esc(candidate.fit.label)}</small></span><small>${esc(candidate.entry.condition||'')}</small>`;
      button.addEventListener('click',()=>{
        if(!candidate.fit.allowed)return;
        on.value=candidate.entry.id;
        inList.querySelectorAll('.v2-sub-player').forEach(node=>node.classList.toggle('is-selected-in',node===button));
        apply.disabled=false;
        if(plan)plan.innerHTML=`<div><span>PLANNED CHANGE</span><strong><b class="in">IN · ${esc(candidate.entry.name)}</b> &nbsp;→&nbsp; <b class="out">OUT · ${esc(item.name)}</b></strong></div><em>READY TO CONFIRM</em>`;
      });
      inList.appendChild(button);
    }
    if(help)help.textContent=positionFamily(item.position)==='GK'?'Only goalkeepers can replace your goalkeeper':'Best positional fits shown first';
    if(plan)plan.innerHTML=`<div><span>PLAYER OFF</span><strong><b class="out">OUT · ${esc(item.name)}</b></strong></div><em>SELECT A REPLACEMENT</em>`;
    apply.disabled=true;
  });
}

async function repairOutgoingPlayers(dialog){
  if(!dialog?.classList.contains('v2-sub-dialog'))return;
  const snapshot=window.__flmLiveStateV332;
  const activeIds=userActiveIds(snapshot);
  const off=dialog.querySelector('[data-sub-out]');
  const outList=dialog.querySelector('[data-v2-out-list]');
  if(!activeIds.length||!off||!outList)return;
  const current=new Set([...off.options].map(option=>option.value));
  const missing=activeIds.filter(id=>id&&!current.has(id)&&!(snapshot.subbedOffIds||[]).includes(id));
  if(!missing.length){
    dialog.dataset.v070OutgoingCount=String(activeIds.length);
    return;
  }
  const db=await database();
  if(!db||!dialog.isConnected)return;
  for(const id of missing){
    const player=db.players?.find(entry=>entry.id===id);
    if(!player)continue;
    const condition=Math.round(Number(snapshot.conditions?.[id]??100));
    const item={id,name:player.name||id,position:player.primaryPosition||player.positionGroup||'XI',condition:`${condition}%`};
    const option=document.createElement('option');
    option.value=id;
    option.textContent=`${item.name} · ${item.position} · ${item.condition}`;
    off.appendChild(option);
    const row=document.createElement('button');
    row.type='button';
    row.className='v2-sub-player v070-recovered-player';
    row.dataset.v070PlayerId=id;
    row.innerHTML=`<span class="pos">${esc(item.position)}</span><strong>${esc(item.name)}</strong><small>${esc(item.condition)}</small>`;
    wireRecoveredOutgoing(dialog,row,item);
    outList.appendChild(row);
  }
  dialog.dataset.v070OutgoingCount=String(activeIds.length);
}

async function sync(){
  queued=false;
  ensureStyles();
  for(const live of document.querySelectorAll('.flm-live-match'))applyKits(live);
  for(const dialog of document.querySelectorAll('.flm-match-dialog.v2-sub-dialog'))await repairOutgoingPlayers(dialog);
}

function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>sync().catch(()=>{}));}

document.addEventListener('click',event=>{
  const button=event.target.closest?.('[data-v068-ft-continue],[data-v068-career],[data-postmatch-exit]');
  if(!button)return;
  const live=button.closest('.flm-live-match');
  if(!isFullTime(live))return;
  event.preventDefault();
  event.stopImmediatePropagation();
  finishDirect(live);
},true);

new MutationObserver(queue).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','data-cm4','data-cm44-state','data-cm44-full-time']});
setInterval(queue,500);
ensureStyles();queue();
window.FLMMatchdayRuntimeFixesV070=Object.freeze({version:VERSION,refresh:queue,finishDirect});