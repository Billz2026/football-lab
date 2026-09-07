export const MATCH_CENTRE_RATINGS_INTEGRITY_VERSION='1.0.0';

let dbPromise=null;
let queued=false;

function database(){
  if(!dbPromise)dbPromise=Promise.resolve(window.FLMManager?.loadDatabase?.()).catch(()=>null);
  return dbPromise;
}

function esc(value){
  return String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
}

function contributionMap(events=[]){
  const map=new Map();
  for(const event of events){
    if(event?.type!=='goal')continue;
    if(event.playerId){const item=map.get(event.playerId)||{g:0,a:0};item.g+=1;map.set(event.playerId,item);}
    if(event.assistPlayerId){const item=map.get(event.assistPlayerId)||{g:0,a:0};item.a+=1;map.set(event.assistPlayerId,item);}
  }
  return map;
}

function rowMarkup(player,snapshot,returns){
  const c=returns.get(player.id)||{g:0,a:0};
  const rating=Number(snapshot.ratings?.[player.id]??6.5);
  const condition=Math.round(Number(snapshot.conditions?.[player.id]??100));
  const mins=Math.round(Number(snapshot.minutesPlayed?.[player.id]??snapshot.minute??0));
  const tone=rating>=8?'elite':rating>=7?'good':rating<6?'poor':'';
  return `<div class="cm4-rating-row cm4-rating-row-history is-off" data-cm4-history-player="${esc(player.id)}"><span>${esc(player.shirtNumber??'—')}</span><strong>${esc(player.name)}</strong><span>${esc(player.primaryPosition||player.positionGroup||'—')}</span><span>${mins}'</span><span>${condition}%</span><span>${c.g||'—'}</span><span>${c.a||'—'}</span><b class="${tone}">${rating.toFixed(1)}</b></div>`;
}

async function syncLive(live){
  const snapshot=window.__flmLiveStateV332;
  if(!snapshot||snapshot.fixtureId==null)return;
  const panel=live.querySelector('[data-cm4-panel="ratings"].is-active');
  const table=panel?.querySelector('.cm4-rating-table');
  if(!table)return;
  const db=await database();
  if(!db)return;
  const activeSide=panel.querySelector('[data-cm4-rating-side].is-active')?.dataset.cm4RatingSide||'home';
  const clubId=activeSide==='away'?snapshot.awayClubId:snapshot.homeClubId;
  const initial=activeSide==='away'?(snapshot.initialAwayLineupIds||[]):(snapshot.initialHomeLineupIds||[]);
  const current=activeSide==='away'?(snapshot.awayLineupIds||[]):(snapshot.homeLineupIds||[]);
  const appeared=new Set([...initial,...current]);
  for(const [id,minutes] of Object.entries(snapshot.minutesPlayed||{})){
    if(Number(minutes)<=0)continue;
    const player=db.players?.find(item=>item.id===id);
    if(player?.clubId===clubId)appeared.add(id);
  }
  const existingNames=new Set([...table.querySelectorAll('.cm4-rating-row > strong')].map(node=>node.textContent?.trim()).filter(Boolean));
  const returns=contributionMap(snapshot.events||[]);
  for(const id of appeared){
    const player=db.players?.find(item=>item.id===id);
    if(!player||existingNames.has(player.name))continue;
    table.insertAdjacentHTML('beforeend',rowMarkup(player,snapshot,returns));
    existingNames.add(player.name);
  }
  live.dataset.cm4RatingsIntegrity=MATCH_CENTRE_RATINGS_INTEGRITY_VERSION;
}

async function syncAll(){
  queued=false;
  for(const live of document.querySelectorAll('[data-live-match],.flm-live-match'))await syncLive(live);
}

function queue(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(syncAll);
}

window.addEventListener('flm:live-state-v332',queue);
document.addEventListener('click',event=>{
  if(event.target?.closest?.('[data-cm4-view="ratings"],[data-cm4-rating-side]'))queue();
});
queue();
