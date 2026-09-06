const VERSION='0.6.7';
const SAVE_KEY='flm-career-save';
let queued=false;
let dbPromise=null;
const clean=value=>String(value||'').replace(/\s+/g,' ').trim();
const database=()=>dbPromise||=(Promise.resolve(window.FLMManager?.loadDatabase?.()).catch(()=>null));
const career=()=>window.FLMManager?.activeCareer||null;
const formatExact=value=>{const n=Number(String(value||'').replace(/[^0-9.-]/g,''));return Number.isFinite(n)?new Intl.NumberFormat('en-GB',{style:'currency',currency:'GBP',maximumFractionDigits:0}).format(n):'';};
const rawMoney=value=>String(value||'').replace(/[^0-9]/g,'');

function persist(c){try{c.updatedAt=new Date().toISOString();localStorage.setItem(SAVE_KEY,JSON.stringify(c));}catch{}}

function removeRumourSpam(){
  const c=career();if(!c?.news?.items)return;
  const before=c.news.items.length;
  c.news.items=c.news.items.filter(item=>!String(item.key||'').startsWith('v61-rumour-')&&!/\bconsider move for\b/i.test(String(item.title||'')));
  if(c.news.items.length!==before)persist(c);
}

function playerClubMap(db){return new Map((db?.players||[]).map(player=>[player.id,player.clubId]));}
function eventTypeForRow(row){
  for(const type of ['goal','save','woodwork','miss','corner','yellow','red','injury','substitution','foul','offside','commentary','marker'])if(row.classList.contains(type))return type;
  return 'commentary';
}
function minuteForRow(row){return Number(clean(row.querySelector('b')?.textContent).replace(/[^0-9]/g,''));}

async function repairCommentaryOwnership(live){
  const snapshot=window.__flmLiveStateV332;if(!snapshot?.events?.length)return;const db=await database();if(!db||!live.isConnected)return;
  const playerClubs=playerClubMap(db);const rows=[...live.querySelectorAll('[data-commentary-feed] .flm-commentary-line')];
  for(const row of rows){
    if(row.dataset.integritySide==='1')continue;
    const minute=minuteForRow(row);if(!Number.isFinite(minute))continue;
    const type=eventTypeForRow(row);
    let candidates=snapshot.events.filter(event=>Number(event.minute)===minute);
    const typed=candidates.filter(event=>event.type===type);if(typed.length)candidates=typed;
    let event=candidates.at(-1);if(!event)continue;
    if(event.playerId){const playerClub=playerClubs.get(event.playerId);if(playerClub===snapshot.homeClubId||playerClub===snapshot.awayClubId)event={...event,clubId:playerClub};}
    const side=event.clubId===snapshot.homeClubId?'home':event.clubId===snapshot.awayClubId?'away':'neutral';row.dataset.cmSide=side;row.dataset.integritySide='1';
    if(row===rows.at(-1)&&side!=='neutral'){
      const club=db.clubs?.find(item=>item.id===event.clubId);const label=live.querySelector('[data-cm4-event-team]');if(label)label.textContent=club?.name||club?.shortName||(side==='home'?'HOME':'AWAY');
      const card=live.querySelector('[data-cm4-event]');if(card){card.classList.remove('is-home','is-away','is-neutral');card.classList.add(`is-${side}`);}
    }
  }
}

function isFriendlyLive(live){
  const text=clean(live.textContent).toLowerCase();const c=career();
  return /pre[- ]?season friendly|friendly match/.test(text)||Boolean(c?.preseason?.activeFriendlyId)||Boolean(c?.preseason?.currentFriendlyId);
}
function repairFriendlySubs(live){
  if(!isFriendlyLive(live))return;
  const dialog=live.querySelector('.flm-match-dialog');if(!dialog||!dialog.querySelector('[data-sub-out]'))return;
  const status=dialog.querySelector('.flm-sub-status strong');if(!status)return;
  const match=clean(status.textContent).match(/(-?\d+)\s+of\s+(\d+)/i);if(!match)return;
  const nativeRemaining=Number(match[1]);const nativeTotal=Number(match[2]);if(!Number.isFinite(nativeRemaining)||nativeTotal!==5)return;
  const used=Math.max(0,5-nativeRemaining);const remaining=Math.max(0,9-used);
  status.textContent=`${remaining} of 9 substitutions remaining`;
  const apply=dialog.querySelector('[data-apply-sub]');const bench=dialog.querySelector('[data-sub-in]');
  if(apply&&remaining>0&&bench&&!bench.disabled&&bench.options?.length)apply.disabled=false;
}

function enhanceMoneyInput(input){
  if(input.dataset.moneyIntegrity==='1')return;input.dataset.moneyIntegrity='1';input.type='text';input.inputMode='numeric';input.value=formatExact(input.value);
  input.addEventListener('focus',()=>{input.value=rawMoney(input.value);input.select();});
  input.addEventListener('blur',()=>{if(rawMoney(input.value))input.value=formatExact(input.value);});
}
function repairTransferMoney(){document.querySelectorAll('[data-v061-fee]').forEach(enhanceMoneyInput);}

async function sync(){
  queued=false;removeRumourSpam();repairTransferMoney();
  for(const live of document.querySelectorAll('.flm-live-match')){repairFriendlySubs(live);await repairCommentaryOwnership(live);}
}
function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>sync().catch(()=>{}));}

document.addEventListener('click',event=>{
  const submit=event.target.closest?.('[data-v061-submit-bid]');if(submit){const input=submit.closest('.v061-negotiation')?.querySelector('[data-v061-fee]');if(input)input.value=rawMoney(input.value);}
},true);
new MutationObserver(queue).observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','disabled','data-cm-side']});
setInterval(queue,900);queue();
window.FLMCareerIntegrityV067=Object.freeze({version:VERSION,refresh:queue});
