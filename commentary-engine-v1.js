export const COMMENTARY_ENGINE_VERSION = '1.0.0';

const clamp = (value,min,max) => Math.max(min,Math.min(max,value));
const clean = value => String(value || '').replace(/\s+/g,' ').trim();

function hashString(value){
  let hash=2166136261;
  for(const character of String(value)){
    hash^=character.charCodeAt(0);
    hash=Math.imul(hash,16777619);
  }
  return hash>>>0;
}

function seededUnit(value){
  let state=hashString(value)||1;
  state+=0x6D2B79F5;
  let next=state;
  next=Math.imul(next^(next>>>15),next|1);
  next^=next+Math.imul(next^(next>>>7),next|61);
  return ((next^(next>>>14))>>>0)/4294967296;
}

export function createCommentaryMemory(){
  return {
    maxDeficit:{home:0,away:0},
    lastGoalMinute:null,
    lastGoalSide:null,
    scorerGoals:{},
    leadChanges:0,
    analysedGoals:new Map(),
    activeGoal:null,
    latestAnalysis:null,
    lastFlashKey:null
  };
}

function deficit(score,side){
  return side==='home'
    ? Math.max(0,Number(score.away||0)-Number(score.home||0))
    : Math.max(0,Number(score.home||0)-Number(score.away||0));
}

function marginFor(score,side){
  return side==='home'
    ? Number(score.home||0)-Number(score.away||0)
    : Number(score.away||0)-Number(score.home||0);
}

function updateDeficits(memory,score){
  memory.maxDeficit.home=Math.max(memory.maxDeficit.home,deficit(score,'home'));
  memory.maxDeficit.away=Math.max(memory.maxDeficit.away,deficit(score,'away'));
}

export function classifyGoalMoment({minute,side,before,after,scorerId},memory=createCommentaryMemory()){
  updateDeficits(memory,before);
  const beforeMargin=marginFor(before,side);
  const afterMargin=marginFor(after,side);
  const previousMaxDeficit=memory.maxDeficit[side]||0;
  const tags=[];

  const late=Number(minute)>=85;
  const veryLate=Number(minute)>=89;
  const lateWinner=veryLate && beforeMargin<=0 && afterMargin>0;
  const lateEqualiser=veryLate && beforeMargin<0 && afterMargin===0;
  const comebackLevelled=previousMaxDeficit>=2 && beforeMargin<0 && afterMargin===0;
  const comebackCompleted=previousMaxDeficit>=2 && beforeMargin===0 && afterMargin>0;
  const immediateResponse=memory.lastGoalMinute!=null
    && memory.lastGoalSide!==side
    && Number(minute)-Number(memory.lastGoalMinute)<=3;

  if(lateWinner)tags.push('late-winner');
  if(lateEqualiser)tags.push('late-equaliser');
  if(comebackCompleted)tags.push('comeback-complete');
  else if(comebackLevelled)tags.push('comeback-level');
  if(immediateResponse)tags.push('immediate-response');
  if(beforeMargin===0 && afterMargin>0)tags.push('takes-lead');
  else if(beforeMargin<0 && afterMargin===0)tags.push('equaliser');
  else if(afterMargin<0)tags.push('goal-back');

  const key=String(scorerId||'unknown');
  memory.scorerGoals[key]=(memory.scorerGoals[key]||0)+1;
  const scorerGoalCount=memory.scorerGoals[key];
  if(scorerGoalCount===3)tags.push('hat-trick');

  let importance=20;
  const afterGap=Math.abs(Number(after.home||0)-Number(after.away||0));
  if(late && afterGap<=1)importance+=12;
  if(veryLate && afterGap<=1)importance+=12;
  if(tags.includes('immediate-response'))importance+=14;
  if(tags.includes('hat-trick'))importance=Math.max(importance,72);
  if(tags.includes('comeback-level'))importance=Math.max(importance,82);
  if(tags.includes('late-equaliser'))importance=Math.max(importance,88);
  if(tags.includes('comeback-complete'))importance=Math.max(importance,93);
  if(tags.includes('late-winner'))importance=Math.max(importance,96);
  importance=clamp(importance,0,100);

  if(beforeMargin<=0 && afterMargin>0 && (Number(before.home)!==Number(before.away)))memory.leadChanges+=1;
  updateDeficits(memory,after);
  memory.lastGoalMinute=Number(minute);
  memory.lastGoalSide=side;

  return {importance,tags,scorerGoalCount,previousMaxDeficit};
}

export function selectFinishType({fixtureId,minute,playerId,currentAbility=120,eventIndex=0}){
  const abilityFactor=clamp((Number(currentAbility||120)-105)/70,0,1);
  const multiplier=.72+abilityFactor*.56;
  const roll=seededUnit(`${fixtureId}:${minute}:${playerId}:${eventIndex}:finish-v1`);
  if(roll<.0010*multiplier)return'bicycle-kick';
  if(roll<.0022*multiplier)return'backheel';
  if(roll<.0110*multiplier)return'volley';
  if(roll<.0280*multiplier)return'screamer';
  if(roll<.0360*multiplier)return'chip';
  return'normal';
}

export function goalQualityFor({finishType,fixtureId,minute,playerId,eventIndex=0}){
  const variation=Math.floor(seededUnit(`${fixtureId}:${minute}:${playerId}:${eventIndex}:quality-v1`)*7);
  const bases={
    'bicycle-kick':94,
    backheel:84,
    volley:82,
    screamer:88,
    chip:78,
    normal:38
  };
  return clamp((bases[finishType]??38)+variation,0,100);
}

function teamCall(teamName){
  return clean(teamName||'They').toUpperCase();
}

function surname(name){
  const bits=clean(name).split(' ').filter(Boolean);
  return (bits.at(-1)||'HE').toUpperCase();
}

function finalGoalCall({teamName,moment,finishType}){
  const team=teamCall(teamName);
  const tags=new Set(moment.tags||[]);
  const special=finishType!=='normal';
  if(tags.has('late-winner'))return special
    ? `WHAT A GOAL! ${team} HAVE WON IT AT THE DEATH!`
    : `GOAL! ${team} HAVE WON IT AT THE DEATH!`;
  if(tags.has('comeback-complete'))return special
    ? `WHAT A GOAL! THE COMEBACK IS COMPLETE!`
    : `GOAL! THE COMEBACK IS COMPLETE!`;
  if(tags.has('late-equaliser'))return `GOAL! ${team} HAVE FOUND A LATE EQUALISER!`;
  if(tags.has('comeback-level'))return `GOAL! ${team} HAVE DRAGGED THEMSELVES LEVEL!`;
  if(tags.has('immediate-response'))return `GOAL! ${team} RESPOND IMMEDIATELY!`;
  if(tags.has('hat-trick'))return `GOAL! HAT-TRICK!`;
  if(finishType==='bicycle-kick')return `INCREDIBLE! A BICYCLE-KICK GOAL!`;
  if(finishType==='screamer')return `WHAT A GOAL! AN ABSOLUTE SCREAMER!`;
  if(finishType==='volley')return `WHAT A STRIKE! THE VOLLEY FLIES IN!`;
  if(finishType==='chip')return `GOAL! A DELICIOUS CHIP!`;
  if(finishType==='backheel')return `GOAL! AN OUTRAGEOUS BACKHEEL!`;
  if(tags.has('takes-lead'))return `GOAL! ${team} TAKE THE LEAD!`;
  if(tags.has('equaliser'))return `GOAL! ${team} ARE LEVEL!`;
  if(tags.has('goal-back'))return `GOAL! ${team} HAVE ONE BACK!`;
  return `GOAL! ${team} SCORE!`;
}

export function buildGoalBeats({teamName,scorerName,assistName,finishType='normal',moment={tags:[]}}){
  const scorer=clean(scorerName||'The attacker');
  const assist=clean(assistName||'');
  const last=surname(scorer);
  let setup;
  let action;
  let shot;

  if(finishType==='bicycle-kick'){
    setup=assist?`${assist} hangs it into the area...`:`The ball hangs in the area...`;
    action=`${last} GOES FOR THE BICYCLE KICK—`;
    shot=`HE CATCHES IT PERFECTLY—`;
  }else if(finishType==='volley'){
    setup=assist?`${assist} lifts it toward ${scorer}...`:`The ball drops for ${scorer}...`;
    action=`${last} HITS IT FIRST TIME—`;
    shot=`WHAT A CONNECTION—`;
  }else if(finishType==='screamer'){
    setup=`${scorer} has space from distance...`;
    action=`${last} LETS FLY—`;
    shot=`IT'S FLYING—`;
  }else if(finishType==='chip'){
    setup=assist?`${assist} releases ${scorer} in behind...`:`${scorer} breaks clear...`;
    action=`THE KEEPER COMES— ${last} CHIPS HIM!`;
    shot=`IT'S OVER THE KEEPER—`;
  }else if(finishType==='backheel'){
    setup=assist?`${assist} fires it into ${scorer}...`:`${scorer} meets it inside the box...`;
    action=`${last} TRIES THE BACKHEEL—`;
    shot=`AUDACIOUS—`;
  }else{
    setup=assist?`${assist} slips ${scorer} through.`:`${scorer} finds a yard of space.`;
    action=`${scorer} is in...`;
    shot=`${last}!`;
  }

  return {
    setup,
    action,
    shot,
    final:finalGoalCall({teamName,moment,finishType})
  };
}

export function analyseGoal({fixtureId,minute,side,before,after,playerId,currentAbility,teamName,opponentName,scorerName,assistName,eventIndex=0},memory=createCommentaryMemory()){
  const moment=classifyGoalMoment({minute,side,before,after,scorerId:playerId},memory);
  const finishType=selectFinishType({fixtureId,minute,playerId,currentAbility,eventIndex});
  const goalQuality=goalQualityFor({finishType,fixtureId,minute,playerId,eventIndex});
  const tier=goalQuality>=86&&moment.importance>=86?'iconic'
    :moment.importance>=80?'dramatic'
    :goalQuality>=78?'signature'
    :'standard';
  const beats=buildGoalBeats({teamName,opponentName,scorerName,assistName,finishType,moment});
  return {finishType,goalQuality,momentImportance:moment.importance,momentTags:moment.tags,tier,beats};
}

function runtimeAvailable(){return typeof window!=='undefined'&&typeof document!=='undefined';}

if(runtimeAvailable()){
  const STYLE_ID='fl-commentary-engine-v1-style';
  const liveMemory=new WeakMap();
  let queued=false;
  let dbPromise=null;

  const database=()=>dbPromise||=Promise.resolve(window.FLMManager?.loadDatabase?.()).catch(()=>null);
  const minuteOf=row=>parseInt(clean(row.querySelector('b')?.textContent),10)||0;
  const lineText=row=>clean(row.querySelector('span')?.textContent);

  function ensureStyles(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      .flm-commentary-line.goal[data-flc-tier="signature"],.cm33-line.goal[data-flc-tier="signature"]{border-color:rgba(230,191,82,.78)!important;box-shadow:inset 3px 0 rgba(230,191,82,.78)}
      .flm-commentary-line.goal[data-flc-tier="dramatic"],.cm33-line.goal[data-flc-tier="dramatic"]{border-color:rgba(255,218,82,.9)!important;box-shadow:inset 4px 0 rgba(255,218,82,.9)}
      .flm-commentary-line.goal[data-flc-tier="iconic"],.cm33-line.goal[data-flc-tier="iconic"]{border-color:#fff0a0!important;box-shadow:inset 5px 0 #fff0a0,0 0 22px rgba(230,191,82,.12)}
      .flm-commentary-line.goal[data-flc-final="1"] span,.cm33-line.goal[data-flc-final="1"] span{font-weight:1000;letter-spacing:.01em}
      .flm-goal-flash[data-flc-tier="signature"] .goal-word,.flm-goal-flash[data-flc-tier="dramatic"] .goal-word{font-size:clamp(2.8rem,8vw,6rem)}
      .flm-goal-flash[data-flc-tier="iconic"] .goal-word{font-size:clamp(2.4rem,7vw,5.2rem)}
      .flc-goal-detail{display:block;margin-top:8px;font-size:.72rem;font-weight:1000;letter-spacing:.14em;text-transform:uppercase}
    `;
    document.head.appendChild(style);
  }

  function memoryFor(live){
    if(!liveMemory.has(live))liveMemory.set(live,createCommentaryMemory());
    return liveMemory.get(live);
  }

  function scoreFromLive(live){
    const home=Number(clean(live.querySelector('[data-home-score]')?.textContent||live.querySelector('[data-cm4-home-score]')?.textContent)||0);
    const away=Number(clean(live.querySelector('[data-away-score]')?.textContent||live.querySelector('[data-cm4-away-score]')?.textContent)||0);
    return {home,away};
  }

  function goalEventsAt(snapshot,minute){
    return (snapshot?.events||[]).filter(event=>event.type==='goal'&&Number(event.minute)===Number(minute));
  }

  function eventKey(event,minute,index){
    return `${minute}:${event?.clubId||'club'}:${event?.playerId||'player'}:${index}`;
  }

  async function analysisForRow(live,row,memory){
    const snapshot=window.__flmLiveStateV332;
    if(!snapshot)return null;
    const minute=minuteOf(row);
    const events=goalEventsAt(snapshot,minute);
    if(!events.length)return null;

    if(!memory.activeGoal||memory.activeGoal.minute!==minute||memory.activeGoal.closed){
      const usedAtMinute=[...memory.analysedGoals.keys()].filter(key=>key.startsWith(`${minute}:`)).length;
      const event=events[Math.min(usedAtMinute,events.length-1)];
      const index=Math.min(usedAtMinute,events.length-1);
      const key=eventKey(event,minute,index);
      const db=await database();
      if(!db)return null;
      const player=db.players?.find(item=>item.id===event.playerId);
      const assist=db.players?.find(item=>item.id===event.assistPlayerId);
      const homeClub=db.clubs?.find(item=>item.id===snapshot.homeClubId);
      const awayClub=db.clubs?.find(item=>item.id===snapshot.awayClubId);
      const side=event.clubId===snapshot.awayClubId?'away':'home';
      const after=scoreFromLive(live);
      const before={...after};
      before[side]=Math.max(0,Number(before[side]||0)-1);
      const teamName=side==='home'?(homeClub?.shortName||homeClub?.name||'Home'):(awayClub?.shortName||awayClub?.name||'Away');
      const opponentName=side==='home'?(awayClub?.shortName||awayClub?.name||'Away'):(homeClub?.shortName||homeClub?.name||'Home');
      const analysis=analyseGoal({
        fixtureId:snapshot.fixtureId,
        minute,
        side,
        before,
        after,
        playerId:event.playerId,
        currentAbility:player?.currentAbility||120,
        teamName,
        opponentName,
        scorerName:player?.name||'The scorer',
        assistName:assist?.name||'',
        eventIndex:index
      },memory);
      memory.analysedGoals.set(key,analysis);
      memory.activeGoal={minute,key,index,event,analysis,lineIndex:0,closed:false};
      memory.latestAnalysis={key,minute,event,analysis};
    }
    return memory.activeGoal;
  }

  async function enhanceRawGoalRows(live){
    const memory=memoryFor(live);
    const rows=[...live.querySelectorAll('[data-commentary-feed] .flm-commentary-line.goal')].filter(row=>row.dataset.flcV1!=='1');
    for(const row of rows){
      const group=await analysisForRow(live,row,memory);
      if(!group)continue;
      const span=row.querySelector('span');
      if(!span)continue;
      const original=lineText(row);
      const final=/\bGOAL\b|scores for|finds the net/i.test(original);
      const index=group.lineIndex++;
      const beats=group.analysis.beats;
      const replacement=final?beats.final:index===0?beats.setup:index===1?beats.action:beats.shot;
      span.textContent=replacement;
      row.dataset.flcV1='1';
      row.dataset.flcTier=group.analysis.tier;
      row.dataset.flcGoalKey=group.key;
      if(final){
        row.dataset.flcFinal='1';
        group.closed=true;
      }
    }
  }

  function mirrorTierToVisible(live){
    const raw=[...live.querySelectorAll('[data-commentary-feed] .flm-commentary-line.goal[data-flc-v1="1"]')];
    const visible=[...live.querySelectorAll('.cm33-line.goal')];
    for(const row of visible){
      const minute=clean(row.querySelector('b')?.textContent);
      const text=clean(row.querySelector('span')?.textContent);
      const source=raw.find(candidate=>clean(candidate.querySelector('b')?.textContent)===minute
        && clean(candidate.querySelector('span')?.textContent)===text);
      if(!source)continue;
      row.dataset.flcTier=source.dataset.flcTier||'standard';
      if(source.dataset.flcFinal==='1')row.dataset.flcFinal='1';
    }
  }

  function enhanceFlash(live,memory){
    const flash=live.querySelector('.flm-goal-flash.is-visible');
    if(!flash||!memory.latestAnalysis)return;
    const {key,analysis}=memory.latestAnalysis;
    if(flash.dataset.flcGoalKey===key)return;
    flash.dataset.flcGoalKey=key;
    flash.dataset.flcTier=analysis.tier;
    const word=flash.querySelector('.goal-word');
    const tags=new Set(analysis.momentTags||[]);
    if(word){
      if(tags.has('late-winner'))word.textContent='LATE WINNER!';
      else if(tags.has('comeback-complete'))word.textContent='COMEBACK!';
      else if(tags.has('late-equaliser'))word.textContent='LATE GOAL!';
      else if(analysis.tier==='iconic')word.textContent='UNBELIEVABLE!';
      else if(analysis.tier==='signature')word.textContent='WHAT A GOAL!';
      else word.textContent='GOAL!';
    }
    const inner=flash.querySelector('.flm-goal-flash-inner');
    if(inner){
      let detail=inner.querySelector('.flc-goal-detail');
      if(!detail){detail=document.createElement('span');detail.className='flc-goal-detail';inner.appendChild(detail);}
      const finish=analysis.finishType==='normal'?'':analysis.finishType.replaceAll('-',' ');
      const moment=tags.has('late-winner')?'last-minute winner'
        :tags.has('comeback-complete')?'comeback complete'
        :tags.has('late-equaliser')?'late equaliser'
        :tags.has('comeback-level')?'comeback level'
        :'';
      detail.textContent=[finish,moment].filter(Boolean).join(' · ');
      detail.hidden=!detail.textContent;
    }
  }

  async function enhanceLive(live){
    if(!live?.isConnected)return;
    live.dataset.commentaryEngine=COMMENTARY_ENGINE_VERSION;
    const memory=memoryFor(live);
    await enhanceRawGoalRows(live);
    mirrorTierToVisible(live);
    enhanceFlash(live,memory);
  }

  function queue(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(async()=>{
      queued=false;
      for(const live of document.querySelectorAll('.flm-live-match,[data-live-match]')){
        try{await enhanceLive(live);}catch(_){/* presentation enhancement must never break matchday */}
      }
    });
  }

  ensureStyles();
  queue();
  new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['class']});
  window.FLMCommentaryEngineV1=Object.freeze({version:COMMENTARY_ENGINE_VERSION,refresh:queue});
}
