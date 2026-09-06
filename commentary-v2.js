export const COMMENTARY_V2_VERSION='2.0.0';

const clean=v=>String(v||'').replace(/\s+/g,' ').trim();
const lower=v=>clean(v).toLowerCase();
const esc=v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
const memories=new WeakMap();
let dbPromise=null,queued=false;

function hash(v){let h=2166136261;for(const c of String(v||'')){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function memoryFor(live){if(!memories.has(live))memories.set(live,{lastVariant:{},seen:new Set(),recent:[],pressure:{home:-99,away:-99},injuries:new Set(),incidentSig:'',centreKey:''});return memories.get(live);}
function database(){return dbPromise||=(Promise.resolve(window.FLMManager?.loadDatabase?.()).catch(()=>null));}
function minute(row){return parseInt(clean(row?.querySelector?.('b')?.textContent),10)||0;}
function side(row){return row?.dataset?.cmSide==='home'?'home':row?.dataset?.cmSide==='away'?'away':'neutral';}
function names(live){const native=[...live.querySelectorAll('.flm-live-team strong')];return{home:clean(live.querySelector('[data-cm4-home-name]')?.textContent||native[0]?.textContent||'Home'),away:clean(live.querySelector('[data-cm4-away-name]')?.textContent||native[1]?.textContent||'Away')};}
function team(live,s){const n=names(live);return s==='home'?n.home:s==='away'?n.away:'The attacking side';}
function playerName(db,id){return db?.players?.find(p=>p.id===id)?.name||'';}

export function commentaryFamilyFor(text,row=null){
  const t=lower(text);
  if(row?.dataset?.flcFinal==='1'||row?.classList?.contains('goal')||/\bgoal\b|scores for|finds the net/.test(t))return'goal';
  if(row?.classList?.contains('red')||/red card|sent off|dismissed/.test(t))return'red';
  if(row?.classList?.contains('injury')||/cannot continue|injur|needs treatment|forced off/.test(t))return'injury';
  if(/crossbar|hits? the bar|off the bar|woodwork/.test(t))return'crossbar';
  if(/hits? the post|off the post|upright/.test(t))return'post';
  if(/one[- ]on[- ]one|clean through|only the keeper|through on goal/.test(t))return'one-on-one';
  if(row?.classList?.contains('save')||/saved by|makes? the save|keeper saves|goalkeeper saves|parries|turns? .* away/.test(t))return'save';
  if(/blocked|blocks? the shot/.test(t))return'blocked';
  if(/wide of|drags? .* wide|over the bar|blazes? .* over|misses? the target/.test(t))return'miss';
  if(row?.classList?.contains('yellow')||/yellow card|booked/.test(t))return'yellow';
  if(/corner/.test(t))return'corner';
  if(/free kick|free-kick/.test(t))return'free-kick';
  if(/counter|breaks? forward|transition/.test(t))return'counter';
  if(/crosses?|whips? .* in|delivery|low ball across/.test(t))return'cross';
  if(/offside|flag is up/.test(t))return'offside';
  if(/foul|caught late|brings? .* down/.test(t))return'foul';
  if(/shoots?|shot|effort|lets fly|header|strikes?/.test(t))return'shot';
  if(/press|win it high|wins possession high/.test(t))return'press';
  if(/possession|recycle|probe|switch the play/.test(t))return'possession';
  return'normal';
}

function leadName(text){const m=clean(text).match(/^(.+?)\s+(?:shoots?|fires?|drags?|heads?|gets|lets|drives?|meets|hits?|rattles?|smashes?|is|breaks?|crosses?|finds|turns?|looks|sees|stops?|fouls?|wins?|takes?|tries|strikes?)(?:\s|\b)/i);const n=clean(m?.[1]||'');return n.length<=38?n:'';}
function playerFromText(text,db){const lead=leadName(text);if(lead)return lead;const hay=` ${lower(text).normalize('NFD').replace(/[\u0300-\u036f]/g,'')} `;let best='';for(const p of db?.players||[]){const n=clean(p.name);if(!n||n.length<=best.length)continue;const key=` ${n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')} `;if(hay.includes(key))best=n;}return best;}
function keeperFrom(text){return clean(clean(text).match(/(?:saved by|parried by|keeper,?\s+)([A-ZÀ-ÖØ-Þ][A-Za-zÀ-ÖØ-öø-ÿ'’.-]+(?:\s+[A-ZÀ-ÖØ-Þ][A-Za-zÀ-ÖØ-öø-ÿ'’.-]+){0,2})/)?.[1]||'');}
function possessive(v){const n=clean(v);return !n?'':/s$/i.test(n)?`${n}'`:`${n}'s`;}
function choose(list,key,memory,family){let i=hash(key)%list.length;if(list.length>1&&i===memory.lastVariant[family])i=(i+1)%list.length;memory.lastVariant[family]=i;return list[i];}
function fill(t,{player='',keeper='',team=''}){return t.replaceAll('{p}',player||'The attacker').replaceAll('{pp}',possessive(player)||"The attacker's").replaceAll('{gk}',keeper||'the goalkeeper').replaceAll('{t}',team||'The attacking side');}

const BANK={
  crossbar:['OFF THE BAR! {pp} strike crashes against the crossbar and stays out.','{p} has the keeper beaten — but the crossbar comes to the rescue!','So close! {p} rattles the bar and the ball drops back into play.','OFF THE CROSSBAR! {p} was inches away.'],
  post:['OFF THE POST! {p} beats the goalkeeper but not the upright.','{p} finds the corner — almost. It comes back off the post!','So close! {pp} effort clips the post and stays out.','THE POST SAVES THEM! {p} was a fraction away.'],
  'one-on-one':['{p} is clean through — only the goalkeeper to beat...','{p} races clear! The goalkeeper comes off his line...','Big chance! {p} is through on goal...','{p} has broken the line — this is a real opening...'],
  save:['{p} gets the effort away — {gk} reacts sharply to save.','{gk} gets down well and keeps {p} out.','{p} tests the goalkeeper — a strong stop from {gk}.','Saved! {gk} reads it early and turns {pp} effort away.'],
  blocked:['{p} pulls the trigger — blocked at the last second!','Important defending! {pp} effort is charged down.','{p} shoots through traffic — a defender throws himself in the way.','{p} sees the opening, but the shot is blocked.'],
  miss:['{p} has the chance — but drags it wide.','{p} gets a sight of goal and sends it past the post.','Chance gone. {p} cannot keep the effort on target.','{p} should do better there — the finish is off target.'],
  corner:['{t} win a corner. The centre-backs are coming forward.','Corner to {t} — another chance to load the penalty area.','{t} force a corner and keep the pressure on.','The ball is turned behind. Corner for {t}.'],
  'free-kick':['{t} have a free-kick in a useful position.','Free-kick to {t}. They can put this into the area.','{t} win the foul and have a chance to deliver.','A set-piece opportunity now for {t}.'],
  counter:['{t} break at pace — numbers are pouring forward.','Suddenly {t} are away on the counter!','{t} turn defence into attack in an instant.','Space opens up and {t} race into transition.'],
  cross:['{p} gets his head up and whips it into the danger area.','{p} delivers early — runners are attacking the box.','{p} drives the ball across the face of goal.','{p} swings it into a dangerous area.'],
  offside:['{p} went too early. The flag is up.','Offside. {p} had strayed beyond the defensive line.','{p} makes the run, but the assistant has the flag raised.','The move is stopped — {p} is offside.'],
  foul:['{p} arrives late. Free-kick.','{p} mistimes the challenge and concedes the foul.','The referee stops play after a late challenge from {p}.','{p} brings the move to an end illegally.'],
  yellow:['YELLOW CARD! {p} goes into the book.','{p} is booked. The referee had seen enough.','Yellow card for {p} after that challenge.','{p} will have to be careful now — booked.'],
  red:['RED CARD! {p} HAS BEEN SENT OFF!','{p} IS OFF! The referee produces a red card.','A huge moment — {p} is dismissed!','RED CARD! {p} leaves his side a player short.'],
  shot:['{p} makes room and gets the shot away...','{p} sees the opening and lets fly...','{p} shifts it onto his shooting foot...','{p} takes aim from here...'],
  press:['{t} squeeze the pitch and win it back high.','{t} press aggressively and force the mistake.','{t} swarm the ball and recover possession.','{t} do not let the opposition settle.'],
  possession:['{t} keep the ball moving and probe for an opening.','{t} recycle possession and look for a way through.','{t} switch the play, trying to move the defence.','{t} stay patient in possession.']
};

export function rewriteCommentaryText({text,family,player='',keeper='',team='',key='',memory}){
  let list=BANK[family];
  if(family==='injury')list=/cannot continue|forced off|unable to continue/i.test(text)?['{p} cannot continue — a change is needed.','That is the end of {pp} match. He has to come off.','{p} signals to the bench — he cannot carry on.']:['{p} is down and needs treatment.','Concern for {p} here. The physio is coming on.','Play stops with {p} needing attention.','{p} stays down after the challenge.'];
  if(!list)return clean(text);
  return fill(choose(list,key,memory,family),{player,keeper,team});
}

function pressurePrefix(memory,s,m,fam,t){if(s==='neutral'||!['corner','cross','shot','blocked','save'].includes(fam))return'';const recent=memory.recent.filter(x=>x.side===s&&m-x.minute<=8&&['corner','cross','shot','blocked','save','one-on-one','post','crossbar'].includes(x.family));if(recent.length>=4&&m-memory.pressure[s]>=6){memory.pressure[s]=m;return`${t} are turning the screw — `;}return'';}
function dedupeKey(row,family,player,raw){const m=minute(row),s=side(row);if(family==='crossbar'||family==='post')return`${m}|${s}|${family}`;if(family==='red'||family==='injury')return`${m}|${s}|${family}|${lower(player)}`;return`${m}|${lower(raw).replace(/[^a-z0-9]+/g,' ')}`;}

function processFeed(live,db,memory){
  for(const row of live.querySelectorAll('[data-commentary-feed] .flm-commentary-line')){
    if(row.dataset.cv2Processed==='1')continue;row.dataset.cv2Processed='1';
    if(row.dataset.flcV1==='1'||row.dataset.flcFinal==='1')continue;
    const span=row.querySelector('span');if(!span)continue;
    const raw=clean(span.textContent),family=commentaryFamilyFor(raw,row),p=playerFromText(raw,db),key=dedupeKey(row,family,p,raw);
    row.dataset.cv2Family=family;
    if(memory.seen.has(key)){row.dataset.cv2Duplicate='1';row.setAttribute('aria-hidden','true');continue;}
    memory.seen.add(key);
    const s=side(row),t=team(live,s),m=minute(row),prefix=pressurePrefix(memory,s,m,family,t);
    const replacement=rewriteCommentaryText({text:raw,family,player:p,keeper:keeperFrom(raw),team:t,key:`${key}|${raw}`,memory});
    if(replacement&&replacement!==raw){span.dataset.cv2Raw=raw;span.textContent=prefix+replacement;}
    memory.recent.push({minute:m,side:s,family});memory.recent=memory.recent.filter(x=>m-x.minute<=12).slice(-18);
  }
}

function latestRow(live){return[...live.querySelectorAll('[data-commentary-feed] .flm-commentary-line')].filter(r=>r.dataset.cv2Duplicate!=='1').at(-1)||null;}
function syncCentre(live,memory){
  if(live.dataset.cm44State==='fulltime'||live.dataset.cm44FullTime==='1')return;
  const row=latestRow(live);if(!row)return;const text=clean(row.querySelector('span')?.textContent);if(!text)return;
  const min=clean(row.querySelector('b')?.textContent)||'—',fam=commentaryFamilyFor(text,row),s=side(row),key=`${min}|${fam}|${text}`;if(memory.centreKey===key)return;memory.centreKey=key;
  const event=live.querySelector('[data-cm4-event]'),textNode=live.querySelector('[data-cm4-event-text]');
  if(textNode){textNode.textContent=text;textNode.dataset.cm44Text=text;textNode.setAttribute('aria-label',text);}
  const minNode=live.querySelector('[data-cm4-event-minute]');if(minNode)minNode.textContent=min;
  const teamNode=live.querySelector('[data-cm4-event-team]');if(teamNode)teamNode.textContent=s==='neutral'?'MATCH UPDATE':team(live,s);
  if(event){event.dataset.cm44Type=fam==='red'?'red':fam==='injury'?'injury':fam==='yellow'?'yellow':fam==='goal'?'goal':['save','crossbar','post','one-on-one','shot','miss','blocked'].includes(fam)?'chance':'normal';event.dataset.cm46Major=['red','injury','crossbar','post'].includes(fam)?'1':'0';}
}

function incidentHosts(shell){
  const panel=shell.querySelector('[data-cm45-scorers]');if(!panel)return null;
  const out={};for(const s of ['home','away']){const sec=panel.querySelector(`section.${s}`);if(!sec)continue;let host=sec.querySelector(`[data-cv2-${s}-incidents]`);if(!host){host=document.createElement('div');host.className='cv2-incidents';host.setAttribute(`data-cv2-${s}-incidents`,'1');sec.appendChild(host);}out[s]=host;}return out;
}
function renderIncidents(live,db,memory){
  const snap=window.__flmLiveStateV332,shell=live.querySelector(':scope > .cm4-shell')||live.querySelector('.cm4-shell');if(!snap||!shell)return;const hosts=incidentHosts(shell);if(!hosts)return;
  const incidents=(snap.events||[]).filter(e=>e.type==='red'||e.type==='injury'),sig=incidents.map(e=>`${e.type}|${e.minute}|${e.clubId}|${e.playerId}`).join('||');
  const panel=shell.querySelector('[data-cm45-scorers]');if(incidents.length&&panel){panel.classList.add('is-visible');panel.setAttribute('aria-hidden','false');shell.querySelector('[data-cm4-stage]')?.setAttribute('data-cm45-has-scorers','1');}
  if(sig===memory.incidentSig)return;memory.incidentSig=sig;
  for(const s of ['home','away']){const club=s==='home'?snap.homeClubId:snap.awayClubId;const html=incidents.filter(e=>e.clubId===club).map(e=>`<div class="cv2-incident-row ${e.type}"><strong>${esc(playerName(db,e.playerId)||'Player')}</strong><span>${e.type==='red'?'🟥':'✚'} ${Math.max(1,Math.round(Number(e.minute)||0))}'</span></div>`).join('');if(hosts[s]&&hosts[s].innerHTML!==html)hosts[s].innerHTML=html;}
}

function injuryPrompt(live,event,db,memory){
  const snap=window.__flmLiveStateV332;if(!snap||event.clubId!==snap.userClubId)return;const key=`${event.minute}|${event.playerId}`;if(memory.injuries.has(key))return;memory.injuries.add(key);
  const name=playerName(db,event.playerId)||'Your player',stage=live.querySelector('[data-cm4-stage]')||live;let banner=live.querySelector('[data-cv2-injury-prompt]');
  if(!banner){banner=document.createElement('div');banner.className='cv2-injury-prompt';banner.dataset.cv2InjuryPrompt='1';stage.appendChild(banner);}banner.dataset.playerId=event.playerId||'';banner.innerHTML=`<strong>INJURY · ${esc(name)}</strong><span>Match paused. Select a replacement.</span>`;banner.hidden=false;
  const pause=live.querySelector('[data-match-speed="0"]');if(pause&&!pause.classList.contains('is-active'))pause.click();const open=live.querySelector('[data-open-subs]');if(open&&!open.disabled)open.click();
  let tries=0;const timer=setInterval(()=>{tries++;const dialog=live.querySelector('[data-manager-dialog]')||document.querySelector('[data-manager-dialog]');if(dialog){let note=dialog.querySelector('[data-cv2-injury-dialog]');const head=dialog.querySelector('.flm-dialog-head');if(!note&&head){note=document.createElement('div');note.className='cv2-injury-dialog';note.dataset.cv2InjuryDialog='1';head.after(note);}const bench=[...(dialog.querySelector('[data-sub-in]')?.options||[])].some(o=>clean(o.value));if(note)note.textContent=bench?`${name} is injured. Select the replacement and confirm the substitution.`:`${name} is injured, but no substitutes are available.`;const rows=[...dialog.querySelectorAll('[data-v2-out-list] .v2-sub-player')],target=rows.find(r=>r.dataset.cm46PlayerId===event.playerId)||rows.find(r=>lower(r.querySelector('strong')?.textContent)===lower(name));target?.click();if(!bench)banner.querySelector('span').textContent='No substitutes available. You must continue short-handed.';clearInterval(timer);}else if(tries>=20){banner.querySelector('span').textContent='Open substitutions to replace the injured player.';clearInterval(timer);}},80);
}
function syncInjuries(live,db,memory){const snap=window.__flmLiveStateV332;if(!snap||live.dataset.cm44State==='fulltime')return;const banner=live.querySelector('[data-cv2-injury-prompt]');if(banner&&!banner.hidden&&banner.dataset.playerId&&snap.subbedOffIds?.includes(banner.dataset.playerId)){banner.hidden=true;document.querySelector('[data-cv2-injury-dialog]')?.remove();}for(const e of (snap.events||[]).filter(x=>x.type==='injury'))injuryPrompt(live,e,db,memory);}

function ensureStyles(){if(document.getElementById('fl-commentary-v2-style'))return;const style=document.createElement('style');style.id='fl-commentary-v2-style';style.textContent=`
[data-commentary-feed] .flm-commentary-line[data-cv2-duplicate="1"]{display:none!important}
.cv2-incidents{display:flex;flex-direction:column;gap:3px;margin-top:3px}.cv2-incident-row{width:max-content;max-width:100%;display:inline-flex;align-items:center;gap:7px;padding:3px 8px;background:rgba(4,10,15,.78);color:#f4f7f9;font-size:11px;font-weight:900;border-radius:2px}.cm45-scorers section.away .cv2-incident-row{margin-left:auto}.cv2-incident-row.red{border-left:3px solid #d51f2f}.cm45-scorers section.away .cv2-incident-row.red{border-left:0;border-right:3px solid #d51f2f}.cv2-incident-row.injury{border-left:3px solid #e8b54b}.cm45-scorers section.away .cv2-incident-row.injury{border-left:0;border-right:3px solid #e8b54b}.cv2-incident-row span{color:#f5df62;font-size:10px;white-space:nowrap}
.cv2-injury-prompt{position:absolute;z-index:65;left:50%;bottom:20px;transform:translateX(-50%);width:min(620px,88%);padding:12px 16px;border:1px solid #e8b54b;border-left:6px solid #e8b54b;background:#0b1d2c;color:#fff;box-shadow:0 12px 40px #0009}.cv2-injury-prompt strong{display:block;color:#f5d967;font-size:13px;font-weight:1000}.cv2-injury-prompt span{display:block;margin-top:4px;color:#d8e4ec;font-size:11px;font-weight:800}.cv2-injury-dialog{margin:-2px 0 8px;padding:8px 10px;border:1px solid #b88935;background:#2b1f0d;color:#ffe89a;font-size:10px;font-weight:900;text-align:center}@media(max-width:760px){.cv2-incident-row{padding:2px 5px;font-size:9px}.cv2-incident-row span{font-size:8px}.cv2-injury-prompt{bottom:10px;padding:10px 12px}}
`;document.head.appendChild(style);}

async function sync(){queued=false;ensureStyles();const db=await database();for(const live of document.querySelectorAll('.flm-live-match,[data-live-match]')){if(!live.isConnected)continue;try{const memory=memoryFor(live);processFeed(live,db,memory);syncCentre(live,memory);renderIncidents(live,db,memory);syncInjuries(live,db,memory);live.dataset.commentaryV2=COMMENTARY_V2_VERSION;}catch(_){}}}
function queue(){if(queued)return;queued=true;requestAnimationFrame(sync);}
if(typeof window!=='undefined'&&typeof document!=='undefined'){ensureStyles();queue();new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class','data-cm-side','data-cm44-state','data-flc-final']});setInterval(queue,600);window.FLMCommentaryV2=Object.freeze({version:COMMENTARY_V2_VERSION,refresh:queue});}
