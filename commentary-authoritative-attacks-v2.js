export const AUTHORITATIVE_ATTACK_COMMENTARY_VERSION='2.0.0';

const clean=value=>String(value||'').replace(/\s+/g,' ').trim();
const upper=value=>clean(value||'').toUpperCase();
const memories=new WeakMap();
let queued=false;
let dbPromise=null;

function hashString(value){
  let hash=2166136261;
  for(const character of String(value||'')){
    hash^=character.charCodeAt(0);
    hash=Math.imul(hash,16777619);
  }
  return hash>>>0;
}

export function createAuthoritativeAttackMemory(){
  return {linesBySequence:new Map(),lastVariant:{},recentFamilies:[],processedSequences:new Set(),latestProtectedRow:null};
}

function choose(list,key,memory,family){
  if(!list?.length)return'';
  let index=hashString(key)%list.length;
  const previous=memory?.lastVariant?.[family];
  if(list.length>1&&index===previous)index=(index+1)%list.length;
  if(memory?.lastVariant)memory.lastVariant[family]=index;
  return list[index];
}

function database(){
  if(!dbPromise)dbPromise=Promise.resolve(window.FLMManager?.loadDatabase?.()).catch(()=>null);
  return dbPromise;
}

function playerName(db,id,fallback='The attacker'){
  return clean(db?.players?.find(player=>player.id===id)?.name)||fallback;
}

function clubName(db,id,fallback='The team'){
  const club=db?.clubs?.find(item=>item.id===id);
  return clean(club?.shortName||club?.name)||fallback;
}

function sideFor(snapshot,clubId){
  if(clubId===snapshot?.homeClubId)return'home';
  if(clubId===snapshot?.awayClubId)return'away';
  return'neutral';
}

function margin(score,side){
  if(side==='home')return Number(score?.home||0)-Number(score?.away||0);
  if(side==='away')return Number(score?.away||0)-Number(score?.home||0);
  return 0;
}

function deficit(score,side){return Math.max(0,-margin(score,side));}

function eventIndex(snapshot,event){
  const events=snapshot?.events||[];
  const byIdentity=events.indexOf(event);
  if(byIdentity>=0)return byIdentity;
  return events.findIndex(item=>item.sequenceId&&item.sequenceId===event?.sequenceId);
}

export function attackNarrativeContext(event,attack,snapshot={}){
  const side=sideFor(snapshot,event?.clubId);
  const before=attack?.scoreBefore||{home:0,away:0};
  const after=attack?.scoreAfter||before;
  const beforeMargin=margin(before,side);
  const afterMargin=margin(after,side);
  const minute=Number(event?.minute||0);
  const index=eventIndex(snapshot,event);
  const earlier=(snapshot?.events||[]).slice(0,index>=0?index+1:undefined);
  const scorerGoals=earlier.filter(item=>item.type==='goal'&&item.playerId===event?.playerId).length;
  let maxDeficit=0;
  for(const item of earlier){
    if(item?.attack?.scoreBefore)maxDeficit=Math.max(maxDeficit,deficit(item.attack.scoreBefore,side));
    if(item?.attack?.scoreAfter)maxDeficit=Math.max(maxDeficit,deficit(item.attack.scoreAfter,side));
  }
  const tags=[];
  if(minute>=89&&beforeMargin<=0&&afterMargin>0)tags.push('late-winner');
  if(minute>=89&&beforeMargin<0&&afterMargin===0)tags.push('late-equaliser');
  if(maxDeficit>=2&&beforeMargin===0&&afterMargin>0)tags.push('comeback-complete');
  else if(maxDeficit>=2&&beforeMargin<0&&afterMargin===0)tags.push('comeback-level');
  if(scorerGoals===3)tags.push('hat-trick');
  if(beforeMargin===0&&afterMargin>0)tags.push('takes-lead');
  else if(beforeMargin<0&&afterMargin===0)tags.push('equaliser');
  else if(afterMargin<0)tags.push('goal-back');
  return{side,beforeMargin,afterMargin,scorerGoals,maxDeficit,tags};
}

function channelLabel(attack){
  if(attack?.side==='left')return'left channel';
  if(attack?.side==='right')return'right channel';
  return'inside channel';
}

function zoneLabel(zone){
  return {
    six_yard_box:'inside the six-yard box',
    central_box:'in the middle of the box',
    left_box:'on the left side of the box',
    right_box:'on the right side of the box',
    edge_of_box:'on the edge of the area',
    left_channel:'in the left channel',
    right_channel:'in the right channel',
    long_range:'well outside the area'
  }[zone]||'in shooting range';
}

function footLabel(bodyPart){
  if(bodyPart==='left_foot')return'left foot';
  if(bodyPart==='right_foot')return'right foot';
  return'';
}

function buildupLines({attack,team,shooter,creator,memory}){
  const key=`${attack.sequenceId}:buildup`;
  const side=attack.side||'wide area';
  switch(attack.delivery){
    case'through_ball':
      return choose(creator?
        [`${creator} sees the run early and threads ${shooter} into the ${channelLabel(attack)}.`,`${creator} waits for the gap, then slides ${shooter} beyond the defensive line.`,`A perfectly weighted pass from ${creator} releases ${shooter} through the ${channelLabel(attack)}.`]:
        [`${team} split the defensive line with a pass into the ${channelLabel(attack)}.`,`${team} find the gap and send ${shooter} running beyond the back line.`],key,memory,'through_ball');
    case'low_cross':
      return choose(creator?
        [`${creator} gets free on the ${side} and drills a low cross towards ${shooter}.`,`${creator} drives the ball hard across the area from the ${side}, with ${shooter} attacking it.`]:
        [`${team} work it down the ${side} and drive a low cross into the danger area.`,`A low delivery is fired across the box from the ${side} for ${team}.`],key,memory,'low_cross');
    case'cutback':
      return choose(creator?
        [`${creator} reaches the byline on the ${side} and cuts it back for ${shooter}.`,`${creator} gets to the byline and pulls the ball back into ${shooter}'s path.`]:
        [`${team} reach the byline on the ${side} and pull the ball back into the area.`,`The cutback comes from the ${side} as ${team} flood the box.`],key,memory,'cutback');
    case'high_cross':
    case'near_post_cross':
    case'far_post_cross':{
      const target=attack.delivery==='near_post_cross'?'near post':attack.delivery==='far_post_cross'?'far post':'middle of the area';
      return choose(creator?
        [`${creator} shapes to cross and sends it towards the ${target}.`,`${creator} delivers from the ${side}, aiming for the ${target}.`]:
        [`${team} send a high delivery towards the ${target}.`,`The cross is lifted towards the ${target} for ${team}.`],key,memory,'cross');
    }
    case'one_two':
      return choose(creator?
        [`${creator} and ${shooter} exchange a sharp one-two that opens the defence.`,`${shooter} bounces it off ${creator} and accelerates into the space beyond.`]:
        [`${team} work a quick one-two through the middle and open a shooting lane.`],key,memory,'one_two');
    case'switch_then_cross':
      return choose(creator?
        [`${creator} switches the point of attack before the delivery comes in from the ${side}.`,`${team} move the defence across the pitch and ${creator} delivers from the ${side}.`]:
        [`${team} switch play quickly and attack from the ${side}.`],key,memory,'switch_cross');
    case'layoff':
      return choose([`${shooter} receives a neat layoff ${zoneLabel(attack.zoneFrom)}.`,`${team} work the ball into ${shooter}, waiting ${zoneLabel(attack.zoneFrom)}.`],key,memory,'layoff');
    case'second_ball':
      return choose([`${team} recover the second ball and it drops invitingly for ${shooter}.`,`${shooter} is first onto the loose second ball ${zoneLabel(attack.zoneFrom)}.`],key,memory,'second_ball');
    default:
      return choose(creator?
        [`${creator} combines through the middle and finds ${shooter} ${zoneLabel(attack.zoneFrom)}.`,`${creator} works the ball into ${shooter} as the defence narrows.`]:
        [`${team} combine through the middle and create an opening for ${shooter}.`],key,memory,'central');
  }
}

function penetrationLine({attack,shooter,memory}){
  const key=`${attack.sequenceId}:penetration`;
  if(attack.firstTime)return choose([
    `${shooter} attacks the delivery without taking a touch.`,
    `${shooter} arrives onto it first time ${zoneLabel(attack.zoneFrom)}.`
  ],key,memory,'first_time_arrival');
  if(attack.pressure==='high')return choose([
    `${shooter} gets there with a defender tight on his shoulder.`,
    `${shooter} protects the ball under heavy pressure and still finds room to strike.`
  ],key,memory,'pressure_high');
  if(attack.pressure==='none')return choose([
    `${shooter} has escaped his marker and is completely free ${zoneLabel(attack.zoneFrom)}.`,
    `Nobody closes ${shooter} down as he sets himself ${zoneLabel(attack.zoneFrom)}.`
  ],key,memory,'pressure_none');
  return choose([
    `${shooter} takes the opening ${zoneLabel(attack.zoneFrom)}.`,
    `${shooter} finds just enough room between the defenders ${zoneLabel(attack.zoneFrom)}.`
  ],key,memory,'pressure_normal');
}

function attemptLine({attack,shooter,memory}){
  const key=`${attack.sequenceId}:attempt`;
  const foot=footLabel(attack.bodyPart);
  const distance=Number(attack.distance||0);
  const fromDistance=distance>=20?` from ${distance} yards`:'';
  switch(attack.subtype){
    case'header':return choose([`${shooter} rises and powers the header goalwards!`,`${shooter} meets it in the air and directs the header at goal!`],key,memory,'header');
    case'volley':return choose([`${shooter} meets it on the volley${fromDistance} — what a connection!`,`${shooter} strikes it before it can drop${fromDistance}!`],key,memory,'volley');
    case'chip':return choose([`${shooter} sees the goalkeeper advance and tries the chip!`,`${shooter} attempts to lift it over the goalkeeper!`],key,memory,'chip');
    case'long_range_drive':return choose([`${shooter} sets himself and drives it${fromDistance}!`,`${shooter} lets fly${fromDistance} with ${foot||'a powerful strike'}!`],key,memory,'long_drive');
    case'curler':return choose([`${shooter} opens his body and tries to bend it towards goal${fromDistance}!`,`${shooter} shapes a curling ${foot||'effort'}${fromDistance}!`],key,memory,'curler');
    case'placed':return choose([`${shooter} opens his body and guides the ${foot||'shot'} towards goal.`,`${shooter} chooses placement, steering it with his ${foot||'instep'}.`],key,memory,'placed');
    case'first_time':return choose([`${shooter} meets it first time with his ${foot||'foot'}!`,`${shooter} does not hesitate — first-time ${foot||'strike'}!`],key,memory,'first_time_shot');
    default:return choose([`${shooter} drives the ${foot||'shot'} goalwards!`,`${shooter} puts his ${foot||'foot'} through it!`],key,memory,'drive');
  }
}

function goalLine({event,team,shooter,context}){
  const tags=new Set(context.tags||[]);
  const teamUpper=upper(team);
  const scorerUpper=upper(shooter);
  if(tags.has('late-winner'))return`GOAL! ${teamUpper} HAVE WON IT AT THE DEATH!`;
  if(tags.has('comeback-complete'))return`GOAL! ${teamUpper} COMPLETE THE COMEBACK!`;
  if(tags.has('late-equaliser'))return`GOAL! ${teamUpper} HAVE FOUND A LAST-GASP EQUALISER!`;
  if(tags.has('comeback-level'))return`GOAL! ${teamUpper} HAVE FOUGHT ALL THE WAY BACK!`;
  if(tags.has('hat-trick'))return`GOAL! HAT-TRICK FOR ${scorerUpper}!`;
  if(tags.has('takes-lead'))return`GOAL! ${teamUpper} TAKE THE LEAD!`;
  if(tags.has('equaliser'))return`GOAL! ${teamUpper} ARE LEVEL!`;
  if(tags.has('goal-back'))return`GOAL! ${teamUpper} HAVE ONE BACK!`;
  if(event.finishType==='volley')return`GOAL! ${scorerUpper} BURIES THE VOLLEY!`;
  if(event.finishType==='chip')return`GOAL! ${scorerUpper} LIFTS IT OVER THE KEEPER!`;
  if(event.finishType==='screamer')return`WHAT A GOAL! ${scorerUpper} HAS SCORED FROM DISTANCE!`;
  return`GOAL! ${shooter} finishes the move for ${team}.`;
}

function outcomeLine({event,attack,team,opponent,shooter,keeper,context,memory}){
  const key=`${attack.sequenceId}:outcome`;
  if(attack.outcome==='goal')return goalLine({event,team,shooter,context});
  if(attack.outcome==='saved_held')return choose([`${keeper} reads it and holds cleanly.`,`${keeper} gets his body behind it and makes the catch.`],key,memory,'save_hold');
  if(attack.outcome==='saved_parried')return choose([`${keeper} gets down and parries it back into the area!`,`${keeper} cannot hold it — the ball is pushed back into danger.`],key,memory,'save_parry');
  if(attack.outcome==='saved_tipped')return choose([`${keeper} gets fingertips to it and turns it away!`,`${keeper} stretches and tips it beyond the frame of the goal.`],key,memory,'save_tip');
  if(attack.outcome==='saved_blocked')return choose([`${keeper} makes himself big and blocks the effort!`,`${keeper} stands up to the shot and gets enough behind it.`],key,memory,'save_block');
  if(attack.outcome==='saved_smothered')return choose([`${keeper} is quickly off his line and smothers it.`,`${keeper} closes the angle and gathers at ${shooter}'s feet.`],key,memory,'save_smother');
  if(attack.outcome==='post')return choose([`OFF THE POST! ${opponent} are rescued by the upright.`,`It beats ${keeper} — but crashes back off the post!`],key,memory,'post');
  if(attack.outcome==='crossbar')return choose([`OFF THE BAR! ${opponent} survive by inches.`,`It sails beyond ${keeper} and smashes against the crossbar!`],key,memory,'bar');
  if(attack.outcome==='wide')return choose([`It flashes wide of the post.`,`The finish bends past ${keeper}, but also past the far post.`],key,memory,'miss_wide');
  if(attack.outcome==='over')return choose([`The effort climbs over the crossbar.`,`Too much on it — the shot clears the bar.`],key,memory,'miss_over');
  return`${opponent} deal with the danger.`;
}

export function renderAuthoritativeAttackLines({event,db,snapshot={},memory=createAuthoritativeAttackMemory()}){
  const attack=event?.attack;
  if(!attack?.sequenceId)return event?.lines||[event?.text].filter(Boolean);
  if(memory.linesBySequence?.has(attack.sequenceId))return memory.linesBySequence.get(attack.sequenceId);
  const team=clubName(db,event.clubId,'The attacking side');
  const opponent=clubName(db,attack.opponentClubId,'The defending side');
  const shooter=playerName(db,event.playerId,'The attacker');
  const creator=event.assistPlayerId?playerName(db,event.assistPlayerId,''):'';
  const keeper=playerName(db,attack.opponentPlayerId,'The goalkeeper');
  const context=attackNarrativeContext(event,attack,snapshot);
  const lines=[
    buildupLines({attack,team,shooter,creator,memory}),
    penetrationLine({attack,shooter,memory}),
    attemptLine({attack,shooter,memory}),
    outcomeLine({event,attack,team,opponent,shooter,keeper,context,memory})
  ].filter(Boolean);
  attack.contextTags=[...new Set([...(attack.contextTags||[]),...context.tags])];
  if(memory.linesBySequence)memory.linesBySequence.set(attack.sequenceId,lines);
  return lines;
}

export function goalFlashCopy(event,snapshot={},db=null){
  if(event?.type!=='goal'||!event?.attack)return null;
  const context=attackNarrativeContext(event,event.attack,snapshot);
  const tags=new Set(context.tags||[]);
  if(tags.has('late-winner'))return{word:'LATE WINNER!',detail:'LAST-GASP WINNER'};
  if(tags.has('comeback-complete'))return{word:'COMEBACK!',detail:'COMEBACK COMPLETE'};
  if(tags.has('late-equaliser'))return{word:'LATE GOAL!',detail:'LAST-GASP EQUALISER'};
  if(tags.has('hat-trick'))return{word:'HAT-TRICK!',detail:upper(playerName(db,event.playerId,''))};
  if(event.finishType==='screamer')return{word:'WHAT A GOAL!',detail:'LONG-RANGE STRIKE'};
  if(event.finishType==='volley')return{word:'GOAL!',detail:'VOLLEY'};
  if(event.finishType==='chip')return{word:'GOAL!',detail:'CHIP'};
  return{word:'GOAL!',detail:''};
}

function minuteOfRow(row){return parseInt(clean(row?.querySelector?.('b')?.textContent),10)||0;}
function sourceRows(live){return[...live.querySelectorAll('[data-commentary-feed] .flm-commentary-line')];}
function memoryFor(live){if(!memories.has(live))memories.set(live,createAuthoritativeAttackMemory());return memories.get(live);}
function isStructuredEvent(event){return Boolean(event?.attack?.sequenceId&&['goal','save','woodwork','miss'].includes(event.type));}
function structuredEvents(snapshot){return(snapshot?.events||[]).filter(isStructuredEvent);}
function pendingStructuredEvents(snapshot,memory){
  const pending=[];
  for(const event of snapshot?.events||[]){
    const sequenceId=event?.attack?.sequenceId;
    if(isStructuredEvent(event)&&!memory.processedSequences?.has(sequenceId))pending.push(event);
  }
  return pending;
}

function protectRow(row,line,event,lineIndex){
  const span=row.querySelector('span');
  if(!span)return;
  if(clean(span.textContent)!==clean(line))span.textContent=line;
  if(span.dataset.cv2Raw!==line)span.dataset.cv2Raw=line;
  if(span.dataset.cm332Raw!==line)span.dataset.cm332Raw=line;
  if(row.dataset.flAuthoritativeAttack!==AUTHORITATIVE_ATTACK_COMMENTARY_VERSION)row.dataset.flAuthoritativeAttack=AUTHORITATIVE_ATTACK_COMMENTARY_VERSION;
  if(row.dataset.flSequenceId!==event.attack.sequenceId)row.dataset.flSequenceId=event.attack.sequenceId;
  const phase=event.attack.beats?.[lineIndex]?.phase||['buildup','penetration','attempt','outcome'][lineIndex]||'outcome';
  if(row.dataset.flAttackPhase!==phase)row.dataset.flAttackPhase=phase;
  if(row.dataset.flcV1!=='1')row.dataset.flcV1='1';
  if(row.dataset.cv2Processed!=='1')row.dataset.cv2Processed='1';
  if(row.dataset.cv2Duplicate)delete row.dataset.cv2Duplicate;
  if(row.dataset.cv3Duplicate)delete row.dataset.cv3Duplicate;
  if(row.hasAttribute('aria-hidden'))row.removeAttribute('aria-hidden');
  if(event.type==='goal'&&lineIndex===3){if(row.dataset.flcFinal!=='1')row.dataset.flcFinal='1';}
  else if(row.dataset.flcFinal)delete row.dataset.flcFinal;
}

function applyStructuredRows(live,snapshot,db,memory){
  const pending=pendingStructuredEvents(snapshot,memory);
  if(!pending.length)return false;
  const rows=sourceRows(live);
  const groups=new Map();
  for(const event of pending){
    const key=`${Number(event.minute)}|${event.type}`;
    if(!groups.has(key))groups.set(key,[]);
    groups.get(key).push(event);
  }
  let changed=false;
  for(const [key,events] of groups){
    const [minuteText,type]=key.split('|');
    const minute=Number(minuteText);
    const candidates=rows.filter(row=>!row.dataset.flSequenceId&&minuteOfRow(row)===minute&&row.classList.contains(type));
    const rendered=events.map(event=>({event,lines:renderAuthoritativeAttackLines({event,db,snapshot,memory})}));
    const expectedCount=rendered.reduce((sum,item)=>sum+item.lines.length,0);
    if(candidates.length<expectedCount)continue;
    const usable=candidates.length>expectedCount?candidates.slice(-expectedCount):candidates;
    let cursor=0;
    for(const item of rendered){
      item.event.lines=item.lines;
      item.event.text=item.lines.join(' ');
      item.event.attack.contextTags=[...new Set(item.event.attack.contextTags||[])];
      item.lines.forEach((line,index)=>{
        const row=usable[cursor++];
        if(!row)return;
        protectRow(row,line,item.event,index);
        memory.latestProtectedRow=row;
      });
      memory.processedSequences?.add(item.event.attack.sequenceId);
      changed=true;
    }
  }
  return changed;
}

function syncCentre(live,snapshot,db,memory,rows=null){
  if(live.dataset.cm44State==='fulltime'||live.dataset.cm44FullTime==='1')return;
  const latest=memory.latestProtectedRow;
  if(!latest?.isConnected)return;
  const absoluteLatest=(rows||sourceRows(live)).at(-1);
  if(latest!==absoluteLatest)return;
  const text=clean(latest.querySelector('span')?.textContent);
  const minute=clean(latest.querySelector('b')?.textContent)||'—';
  const textNode=live.querySelector('[data-cm4-event-text]');
  if(textNode&&clean(textNode.textContent)!==text){textNode.textContent=text;textNode.dataset.cm44Text=text;textNode.setAttribute('aria-label',text);}
  const minuteNode=live.querySelector('[data-cm4-event-minute]');if(minuteNode&&clean(minuteNode.textContent)!==minute)minuteNode.textContent=minute;
  const event=[...structuredEvents(snapshot)].reverse().find(item=>item.attack?.sequenceId===latest.dataset.flSequenceId);
  const teamNode=live.querySelector('[data-cm4-event-team]');
  if(teamNode&&event){const label=clubName(db,event.clubId,'MATCH UPDATE');if(clean(teamNode.textContent)!==label)teamNode.textContent=label;}
  const eventNode=live.querySelector('[data-cm4-event]');
  if(eventNode&&event){
    const type=event.type==='goal'?'goal':'chance';
    const major=event.type==='goal'?'1':'0';
    if(eventNode.dataset.cm44Type!==type)eventNode.dataset.cm44Type=type;
    if(eventNode.dataset.cm46Major!==major)eventNode.dataset.cm46Major=major;
  }
}

function latestStructuredGoal(snapshot){
  const events=snapshot?.events||[];
  for(let index=events.length-1;index>=0;index-=1){
    const event=events[index];
    if(event?.type==='goal'&&event?.attack?.sequenceId)return event;
  }
  return null;
}

function syncFlash(live,snapshot,db){
  const flash=live.querySelector('.flm-goal-flash.is-visible');
  if(!flash)return;
  const event=latestStructuredGoal(snapshot);
  if(!event)return;
  const copy=goalFlashCopy(event,snapshot,db);
  if(!copy)return;
  const word=flash.querySelector('.goal-word');if(word&&word.textContent!==copy.word)word.textContent=copy.word;
  const inner=flash.querySelector('.flm-goal-flash-inner');
  if(inner){
    let detail=inner.querySelector('.flc-goal-detail');
    if(!detail){detail=document.createElement('span');detail.className='flc-goal-detail';inner.appendChild(detail);}
    if(detail.textContent!==(copy.detail||''))detail.textContent=copy.detail||'';
    detail.hidden=!copy.detail;
  }
  if(flash.dataset.flAuthoritativeAttack!==AUTHORITATIVE_ATTACK_COMMENTARY_VERSION)flash.dataset.flAuthoritativeAttack=AUTHORITATIVE_ATTACK_COMMENTARY_VERSION;
}

async function syncLive(live){
  const snapshot=window.__flmLiveStateV332;
  if(!snapshot||!live?.isConnected)return;
  const db=await database();
  if(!db)return;
  const memory=memoryFor(live);
  if(memory.latestProtectedRow&&!memory.latestProtectedRow.isConnected){
    memory.processedSequences?.clear();
    memory.latestProtectedRow=null;
  }
  const changed=applyStructuredRows(live,snapshot,db,memory);
  if(changed)syncCentre(live,snapshot,db,memory);
  syncFlash(live,snapshot,db);
  if(live.dataset.authoritativeAttackCommentary!==AUTHORITATIVE_ATTACK_COMMENTARY_VERSION)live.dataset.authoritativeAttackCommentary=AUTHORITATIVE_ATTACK_COMMENTARY_VERSION;
}

function sync(){
  queued=false;
  for(const live of document.querySelectorAll('.flm-live-match,[data-live-match]'))syncLive(live).catch(()=>{});
}

function queue(){if(queued)return;queued=true;requestAnimationFrame(sync);}

function relevantMutation(mutation){
  const target=mutation.target?.nodeType===1?mutation.target:mutation.target?.parentElement;
  if(target?.closest?.('[data-commentary-feed],.flm-goal-flash'))return true;
  for(const node of mutation.addedNodes||[]){
    if(node?.nodeType!==1)continue;
    if(node.matches?.('.flm-live-match,[data-live-match],[data-commentary-feed],.flm-commentary-line,.flm-goal-flash'))return true;
    if(node.querySelector?.('[data-live-match],[data-commentary-feed],.flm-commentary-line,.flm-goal-flash'))return true;
  }
  return false;
}

if(typeof window!=='undefined'&&typeof document!=='undefined'){
  queue();
  // Only commentary/goal-flash mutations can request a pass. Structured sequences are
  // processed once, so the cost does not grow with every unrelated Match Centre update.
  new MutationObserver(mutations=>{if(mutations.some(relevantMutation))queue();}).observe(document.documentElement,{childList:true,subtree:true,characterData:true});
  window.FLMCommentaryAuthoritativeAttacksV2=Object.freeze({version:AUTHORITATIVE_ATTACK_COMMENTARY_VERSION,refresh:queue});
}