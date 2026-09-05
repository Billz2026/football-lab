const VERSION='4.6.2';
const STYLE_HREF=`./match-centre-v46-lock.css?v=${VERSION}`;
let queued=false;
let dbPromise=null;
let nameIndex=null;
let playersBySurname=null;

const manager=()=>window.FLMManager;
const career=()=>manager()?.activeCareer||null;
const clean=value=>String(value||'').replace(/\s+/g,' ').trim();
const norm=value=>clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();

function ensureStyles(){
  if(document.querySelector('link[data-cm46-style]'))return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href=STYLE_HREF;
  link.dataset.cm46Style=VERSION;
  document.head.appendChild(link);
}
function database(){
  if(!dbPromise&&manager()?.loadDatabase)dbPromise=Promise.resolve(manager().loadDatabase()).catch(()=>null);
  return dbPromise||Promise.resolve(null);
}
function setText(node,value){if(node&&node.textContent!==value)node.textContent=value;}
function visible(node){return Boolean(node&&node.isConnected&&getComputedStyle(node).display!=='none'&&getComputedStyle(node).visibility!=='hidden');}

function buildNameIndex(db){
  if(nameIndex||!db?.players)return nameIndex;
  nameIndex=new Map();
  playersBySurname=new Map();
  for(const player of db.players){
    const key=norm(player.name);
    if(key&&!nameIndex.has(key))nameIndex.set(key,player);
    const parts=key.split(' ').filter(Boolean);
    const surname=parts.at(-1);
    if(surname){
      const list=playersBySurname.get(surname)||[];
      list.push(player);
      playersBySurname.set(surname,list);
      if(parts.length>1){
        const short=`${parts[0][0]} ${surname}`;
        if(!nameIndex.has(short))nameIndex.set(short,player);
      }
    }
  }
  return nameIndex;
}
function playerForName(db,name){
  const index=buildNameIndex(db);
  const key=norm(name);
  const direct=index?.get(key);
  if(direct)return direct;
  const parts=key.split(' ').filter(Boolean);
  const surname=parts.at(-1);
  const candidates=playersBySurname?.get(surname)||[];
  if(candidates.length===1)return candidates[0];
  if(parts.length>1){
    const initial=parts[0][0];
    return candidates.find(player=>norm(player.name).split(' ')[0]?.startsWith(initial))||null;
  }
  return null;
}

function syncScorerPresentation(shell){
  const panel=shell?.querySelector('[data-cm45-scorers]');
  if(!panel)return;
  panel.dataset.cm46='1';
  panel.querySelectorAll('.cm45-scorer-row').forEach(row=>{
    row.classList.add('cm46-scorer-row');
    const name=clean(row.querySelector('strong')?.textContent);
    const minute=clean(row.querySelector('span')?.textContent);
    if(name&&minute)row.setAttribute('aria-label',`${name} ${minute}`);
  });
}

function syncRoutineEventScale(shell){
  const event=shell?.querySelector('.cm4-event');
  if(!event)return;
  const type=event.dataset.cm44Type||'';
  const major=['goal','yellow','red','injury'].includes(type)||event.classList.contains('is-yellow')||event.classList.contains('is-red')||event.classList.contains('is-injury');
  event.dataset.cm46Major=major?'1':'0';
}

function currentFriendly(c){return c?.preseason?.fixtures?.find(fixture=>!fixture.played)||null;}
function clubName(db,id){const club=db?.clubs?.find(item=>item.id===id);return club?.shortName||club?.name||'Unknown';}
function syncSidebarFixture(db){
  const c=career();
  if(!c||document.querySelector('[data-live-match]')||!c.preseason||c.preseason.phase==='complete')return;
  const friendly=currentFriendly(c);
  if(!friendly)return;
  setText(document.querySelector('[data-shell-fixture-teams]'),`${clubName(db,friendly.homeClubId)} vs ${clubName(db,friendly.awayClubId)}`);
  setText(document.querySelector('[data-shell-fixture-meta]'),`${friendly.dateLabel||'Pre-season'} · FRIENDLY`);
}

function syncPreseasonCTA(){
  const play=document.querySelector('[data-v047-play]');
  const actions=play?.closest('.v047-actions');
  if(!play||!actions)return;
  const shellButton=document.querySelector('[data-shell-continue]');
  const shellLabel=clean(document.querySelector('[data-shell-continue-label]')?.textContent).toUpperCase();
  const shouldHide=visible(shellButton)&&shellLabel==='PLAY FRIENDLY';
  if(shouldHide){
    play.dataset.cm46Hidden='1';
    play.hidden=true;
    play.setAttribute('aria-hidden','true');
    play.tabIndex=-1;
    actions.dataset.cm46ShellPlay='1';
    let note=actions.querySelector('[data-cm46-ready-note]');
    if(!note){
      note=document.createElement('div');
      note.className='cm46-ready-note';
      note.dataset.cm46ReadyNote='1';
      note.textContent='READY TO PLAY · Use the highlighted PLAY FRIENDLY control';
      actions.prepend(note);
    }
  }else if(play.dataset.cm46Hidden==='1'){
    play.hidden=false;
    play.removeAttribute('aria-hidden');
    play.removeAttribute('tabindex');
    delete play.dataset.cm46Hidden;
    delete actions.dataset.cm46ShellPlay;
    actions.querySelector('[data-cm46-ready-note]')?.remove();
  }
}

function scoreContext(){
  const shell=document.querySelector('.cm4-shell');
  if(!shell)return '';
  const home=clean(shell.querySelector('[data-cm4-home-name]')?.textContent);
  const away=clean(shell.querySelector('[data-cm4-away-name]')?.textContent);
  const scores=[...shell.querySelectorAll('.cm4-scorebox')].map(node=>clean(node.textContent));
  const minute=clean(shell.querySelector('[data-cm4-clock]')?.textContent);
  if(!home||!away)return minute;
  return `${home} ${scores[0]||'0'}–${scores[1]||'0'} ${away}${minute?` · ${minute}`:''}`;
}
function ensureManagerContext(dialog){
  const head=dialog.querySelector('.flm-dialog-head');
  if(!head)return;
  let node=dialog.querySelector('[data-cm46-manager-context]');
  if(!node){
    node=document.createElement('div');
    node.className='cm46-manager-context';
    node.dataset.cm46ManagerContext='1';
    head.after(node);
  }
  setText(node,scoreContext());
}
function clearManagerContext(dialog){
  delete dialog.dataset.cm46Dialog;
  dialog.querySelector('[data-cm46-manager-context]')?.remove();
}
function cardForPlayer(snapshot,id){
  if(!id)return '';
  const events=snapshot?.events||[];
  if(events.some(event=>event.playerId===id&&event.type==='red'))return 'RC';
  if(events.some(event=>event.playerId===id&&event.type==='yellow'))return 'YC';
  return '';
}
function annotateSubRows(dialog,db){
  const snapshot=window.__flmLiveStateV332;
  dialog.querySelectorAll('.v2-sub-player').forEach(row=>{
    const name=clean(row.querySelector('strong')?.textContent);
    const player=playerForName(db,name);
    if(player)row.dataset.cm46PlayerId=player.id;
    let rating=row.querySelector('.cm46-rating');
    if(!rating){rating=document.createElement('span');rating.className='cm46-rating';row.appendChild(rating);}
    const value=player&&snapshot?.ratings?.[player.id];
    setText(rating,Number.isFinite(Number(value))?Number(value).toFixed(1):'—');
    let card=row.querySelector('.cm46-card');
    const cardText=player?cardForPlayer(snapshot,player.id):'';
    if(cardText){
      if(!card){card=document.createElement('span');card.className='cm46-card';row.appendChild(card);}
      card.className=`cm46-card ${cardText==='RC'?'red':'yellow'}`;
      setText(card,cardText);
    }else card?.remove();
  });
}
function syncDialog(db){
  const modal=document.querySelector('[data-manager-modal].is-open');
  const dialog=modal?.querySelector('[data-manager-dialog]');
  if(!dialog)return;
  if(dialog.classList.contains('v2-sub-dialog')){
    dialog.dataset.cm46Dialog='subs';
    ensureManagerContext(dialog);
    annotateSubRows(dialog,db);
  }else if(dialog.querySelector('[data-live-tactic]')){
    dialog.dataset.cm46Dialog='tactics';
    ensureManagerContext(dialog);
  }else if(dialog.dataset.cm46Dialog){
    clearManagerContext(dialog);
  }
}

async function sync(){
  ensureStyles();
  const db=await database();
  const shell=document.querySelector('.cm4-shell');
  if(shell){
    shell.dataset.cm46='1';
    syncScorerPresentation(shell);
    syncRoutineEventScale(shell);
  }else{
    syncSidebarFixture(db);
    syncPreseasonCTA();
  }
  syncDialog(db);
}
function queue(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;sync();});
}

ensureStyles();
new MutationObserver(queue).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden','aria-hidden','data-cm44-type']});
setInterval(queue,700);
queue();
window.FLMMatchCentreV46=Object.freeze({version:VERSION,refresh:queue});
