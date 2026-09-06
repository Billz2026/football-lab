export const MATCH_DRAMA_VERSION='3.0.0';

export const DRAMA_RATES=Object.freeze({
  penaltySituation:0.0050,
  dangerousFreeKick:0.0120,
  disallowedGoal:0.0014,
  lastManChallenge:0.0009,
  simulation:0.0010
});

const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const round2=v=>Math.round(Number(v||0)*100)/100;

function hashString(value){
  let hash=2166136261;
  for(const character of String(value||'')){
    hash^=character.charCodeAt(0);
    hash=Math.imul(hash,16777619);
  }
  return hash>>>0;
}

function seededRandom(seed){
  let state=hashString(seed)||1;
  return()=>{
    state+=0x6D2B79F5;
    let value=state;
    value=Math.imul(value^(value>>>15),value|1);
    value^=value+Math.imul(value^(value>>>7),value|61);
    return((value^(value>>>14))>>>0)/4294967296;
  };
}

export function deterministicUnit(seed){return seededRandom(seed)();}

function player(db,id){return db?.players?.find(item=>item.id===id)||null;}
function club(db,id){return db?.clubs?.find(item=>item.id===id)||null;}
function clubName(db,id){const item=club(db,id);return item?.shortName||item?.name||'the team';}
function lineup(state,side){return side==='home'?state.homeLineupIds:state.awayLineupIds;}
function clubId(state,side){return side==='home'?state.homeClubId:state.awayClubId;}
function otherSide(side){return side==='home'?'away':'home';}
function activeIds(state,side){return(lineup(state,side)||[]).filter(id=>!(state.sentOffIds||[]).includes(id));}
function playerAbility(p){return Number(p?.currentAbility||120);}

function choosePlayer(state,db,side,random,groups=null){
  let pool=activeIds(state,side).map(id=>player(db,id)).filter(Boolean);
  if(groups?.length){const filtered=pool.filter(p=>groups.includes(p.positionGroup));if(filtered.length)pool=filtered;}
  if(!pool.length)return null;
  const weighted=[];
  for(const p of pool){
    const weight=p.positionGroup==='ATT'?5:p.positionGroup==='MID'?4:p.positionGroup==='DEF'?2:1;
    for(let i=0;i<weight;i+=1)weighted.push(p);
  }
  return weighted[Math.floor(random()*weighted.length)]||pool[0];
}

function chooseSetPieceTaker(state,db,side,random){
  const pool=activeIds(state,side).map(id=>player(db,id)).filter(p=>p&&p.positionGroup!=='GK');
  if(!pool.length)return null;
  const ranked=pool.map(p=>({p,score:playerAbility(p)+(p.positionGroup==='MID'?12:p.positionGroup==='ATT'?7:0)})).sort((a,b)=>b.score-a.score);
  const shortlist=ranked.slice(0,Math.min(4,ranked.length));
  const weights=[7,4,2,1];
  const bag=[];
  shortlist.forEach((entry,index)=>{for(let i=0;i<(weights[index]||1);i+=1)bag.push(entry.p);});
  return bag[Math.floor(random()*bag.length)]||shortlist[0]?.p||pool[0];
}

function goalkeeper(state,db,side){return activeIds(state,side).map(id=>player(db,id)).find(p=>p?.positionGroup==='GK')||player(db,activeIds(state,side)[0]);}

function ensureState(state){
  state.events||=[];
  state.sentOffIds||=[];
  state.yellowByPlayer||={};
  state.ratings||={};
  state.stats||={home:{},away:{}};
  for(const side of ['home','away']){
    state.stats[side]||={};
    state.stats[side].shots=Number(state.stats[side].shots||0);
    state.stats[side].onTarget=Number(state.stats[side].onTarget||0);
    state.stats[side].fouls=Number(state.stats[side].fouls||0);
    state.stats[side].yellowCards=Number(state.stats[side].yellowCards||0);
    state.stats[side].redCards=Number(state.stats[side].redCards||0);
    state.stats[side].xG=Number(state.stats[side].xG||0);
    state.stats[side].xgShots=Number(state.stats[side].xgShots||0);
    state.stats[side].bigChances=Number(state.stats[side].bigChances||0);
    state.stats[side].penalties=Number(state.stats[side].penalties||0);
  }
  state.matchDrama||={version:MATCH_DRAMA_VERSION,serial:0,counts:{},atmosphere:[]};
  state.matchDrama.version=MATCH_DRAMA_VERSION;
  state.matchDrama.counts||={};
  state.matchDrama.atmosphere||=[];
  return state;
}

function eventId(state,family){
  state.matchDrama.serial=Number(state.matchDrama.serial||0)+1;
  return`${state.fixtureId||'match'}:${state.minute}:${family}:${state.matchDrama.serial}`;
}

function record(state,event){
  const stored={
    minute:Number(state.minute)||0,
    type:event.type||'commentary',
    clubId:event.clubId||null,
    playerId:event.playerId||null,
    assistPlayerId:event.assistPlayerId||null,
    text:event.text||(event.lines||[]).join(' '),
    lines:[...(event.lines|| (event.text?[event.text]:[]))],
    incidentId:event.incidentId||null,
    incidentType:event.incidentType||null,
    source:event.source||null,
    reason:event.reason||null,
    decision:event.decision||null,
    reviewOutcome:event.reviewOutcome||null,
    distance:Number.isFinite(Number(event.distance))?Number(event.distance):null,
    disallowed:Boolean(event.disallowed),
    xg:Number.isFinite(Number(event.xg))?round2(event.xg):null
  };
  state.events.push(stored);
  return stored;
}

function addRating(state,id,delta){if(id)state.ratings[id]=clamp(Number(state.ratings[id]??6.5)+delta,4,10);}
function incrementCount(state,key){state.matchDrama.counts[key]=Number(state.matchDrama.counts[key]||0)+1;}
function underCap(state,key,max){return Number(state.matchDrama.counts[key]||0)<max;}

function addShot(state,side,{onTarget=false,xg=0.1,bigChance=false}={}){
  state.stats[side].shots+=1;
  if(onTarget)state.stats[side].onTarget+=1;
  state.stats[side].xG=round2(state.stats[side].xG+xg);
  state.stats[side].xgShots+=1;
  if(bigChance||xg>=0.30)state.stats[side].bigChances+=1;
}

function addGoal(state,side,scorer,xg,source,lines,incidentId){
  if(side==='home')state.homeGoals=Number(state.homeGoals||0)+1;
  else state.awayGoals=Number(state.awayGoals||0)+1;
  addRating(state,scorer?.id,.72);
  return record(state,{type:'goal',clubId:clubId(state,side),playerId:scorer?.id||null,source,incidentType:source,incidentId,xg,lines});
}

function removeFromPitch(state,side,id){
  if(side==='home')state.homeLineupIds=(state.homeLineupIds||[]).filter(item=>item!==id);
  else state.awayLineupIds=(state.awayLineupIds||[]).filter(item=>item!==id);
}

function sendOff(state,db,side,offender,{lines,incidentId,source='discipline',reason=''}={}){
  if(!offender||state.sentOffIds.includes(offender.id))return null;
  removeFromPitch(state,side,offender.id);
  state.sentOffIds.push(offender.id);
  state.stats[side].redCards+=1;
  addRating(state,offender.id,-.65);
  return record(state,{type:'red',clubId:clubId(state,side),playerId:offender.id,incidentId,incidentType:'red-card',source,reason,decision:'red',lines:lines||[`RED CARD! ${offender.name} is sent off.`]});
}

function bookPlayer(state,db,side,offender,{lines,incidentId,source='discipline',reason=''}={}){
  if(!offender)return null;
  state.yellowByPlayer[offender.id]=Number(state.yellowByPlayer[offender.id]||0)+1;
  state.stats[side].yellowCards+=1;
  addRating(state,offender.id,-.08);
  if(state.yellowByPlayer[offender.id]>=2){
    const second=[...(lines||[]),`SECOND YELLOW! ${offender.name} is still off — that booking ends his match.`];
    return sendOff(state,db,side,offender,{lines:second,incidentId,source,reason:'second-yellow'});
  }
  return record(state,{type:'yellow',clubId:clubId(state,side),playerId:offender.id,incidentId,incidentType:'yellow-card',source,reason,decision:'yellow',lines:lines||[`YELLOW CARD! ${offender.name} is booked.`]});
}

export function resolvePenaltyOutcome({roll,takerAbility=130,keeperAbility=130}){
  const edge=clamp((Number(takerAbility)-Number(keeperAbility))/500,-.06,.06);
  const goalCut=clamp(.755+edge,.68,.82);
  const saveCut=clamp(goalCut+.155-edge*.35,goalCut+.10,.93);
  const woodworkCut=Math.min(.965,saveCut+.035);
  if(roll<goalCut)return'goal';
  if(roll<saveCut)return'save';
  if(roll<woodworkCut)return'woodwork';
  return'miss';
}

export function resolveFreeKickOutcome({roll,takerAbility=130,keeperAbility=130}){
  const edge=clamp((Number(takerAbility)-Number(keeperAbility))/650,-.035,.035);
  const goalCut=.055+edge;
  const saveCut=goalCut+.285;
  const woodworkCut=saveCut+.055;
  const wallCut=woodworkCut+.285;
  if(roll<goalCut)return'goal';
  if(roll<saveCut)return'save';
  if(roll<woodworkCut)return'woodwork';
  if(roll<wallCut)return'wall';
  return'miss';
}

export function resolveDogsoDecision({decisionRoll,varRoll,alreadyBooked=false}){
  const provisional=decisionRoll<.58?'red':'yellow';
  const review=provisional==='red'&&varRoll<.34;
  const overturned=review&&varRoll<.055;
  const final=overturned?'yellow':provisional;
  return{provisional,review,overturned,final,stillSentOff:final==='yellow'&&alreadyBooked};
}

function descriptor(p){
  const ability=playerAbility(p);
  if(ability>=160&&p?.positionGroup==='MID')return'the playmaker';
  if(ability>=160&&p?.positionGroup==='ATT')return'the talisman';
  if(ability>=150)return'the set-piece specialist';
  return'';
}

function penaltySituation(state,db,random){
  const attack=random()<.52?'home':'away',defend=otherSide(attack);
  const team=clubName(db,clubId(state,attack)),defTeam=clubName(db,clubId(state,defend));
  const attacker=choosePlayer(state,db,attack,random,['ATT','MID']);
  const defender=choosePlayer(state,db,defend,random,['DEF','MID']);
  const taker=chooseSetPieceTaker(state,db,attack,random)||attacker;
  const keeper=goalkeeper(state,db,defend);
  if(!attacker||!taker)return[];
  const incidentId=eventId(state,'penalty');
  incrementCount(state,'penaltySituation');
  state.stats[defend].fouls+=1;
  const handball=random()<.22;
  const initialPenalty=random()<.52;
  const reviewChance=initialPenalty?.30:.24;
  const reviewed=random()<reviewChance;
  const overturned=reviewed&&random()<(initialPenalty?.075:.12);
  const finalPenalty=overturned?!initialPenalty:initialPenalty;
  const lines=[];
  lines.push(handball
    ?`${team} fire the ball into the box — huge appeals for handball!`
    :`${attacker.name} drives into the ${defTeam} penalty area and goes down under the challenge!`);
  if(initialPenalty)lines.push(`PENALTY TO ${team.toUpperCase()}! The referee points straight to the spot.`);
  else lines.push(`The referee waves play on. ${team} are demanding a penalty.`);
  if(reviewed){
    lines.push(`VAR CHECK — they are looking closely at ${handball?'the defender\'s arm':'the contact inside the area'}...`);
    if(overturned)lines.push(initialPenalty?`DECISION OVERTURNED — NO PENALTY!`:`THE REFEREE CHANGES HIS MIND — PENALTY!`);
    else lines.push(initialPenalty?`VAR CHECK COMPLETE — THE PENALTY STANDS.`:`VAR CHECK COMPLETE — NO PENALTY.`);
  }
  if(!finalPenalty){
    return[record(state,{type:'var',clubId:clubId(state,attack),playerId:attacker.id,incidentId,incidentType:'penalty-appeal',source:'var',reason:handball?'handball':'foul',decision:'no-penalty',reviewOutcome:reviewed?(overturned?'overturned':'confirmed'):'none',lines})];
  }
  state.stats[attack].penalties+=1;
  const label=descriptor(taker);
  lines.push(`${taker.name} places the ball on the spot${label?` — ${label} has the responsibility`:''}.`);
  lines.push(`${taker.name.toUpperCase()} STEPS UP—`);
  const outcome=resolvePenaltyOutcome({roll:random(),takerAbility:playerAbility(taker),keeperAbility:playerAbility(keeper)});
  addShot(state,attack,{onTarget:outcome==='goal'||outcome==='save',xg:.76,bigChance:true});
  if(outcome==='goal'){
    lines.push(`GOAL! ${taker.name} scores for ${team}!`);
    return[addGoal(state,attack,taker,.76,'penalty',lines,incidentId)];
  }
  if(outcome==='save'){
    addRating(state,keeper?.id,.32);addRating(state,taker.id,-.18);
    lines.push(`SAVED! ${keeper?.name||'The goalkeeper'} guesses correctly and keeps it out!`);
  }else if(outcome==='woodwork'){
    addRating(state,taker.id,-.10);
    lines.push(`OFF THE POST! ${taker.name} sends the keeper the wrong way but hits the woodwork!`);
  }else{
    addRating(state,taker.id,-.16);
    lines.push(`MISSED! ${taker.name} sends it wide of the target!`);
  }
  return[record(state,{type:outcome==='save'?'save':outcome==='woodwork'?'woodwork':'miss',clubId:clubId(state,attack),playerId:taker.id,incidentId,incidentType:'penalty',source:'penalty',reason:handball?'handball':'foul',decision:'penalty',reviewOutcome:reviewed?(overturned?'overturned':'confirmed'):'none',xg:.76,lines})];
}

function dangerousFreeKick(state,db,random){
  const attack=random()<.52?'home':'away',defend=otherSide(attack);
  const team=clubName(db,clubId(state,attack)),defTeam=clubName(db,clubId(state,defend));
  const taker=chooseSetPieceTaker(state,db,attack,random);
  const offender=choosePlayer(state,db,defend,random,['DEF','MID']);
  const keeper=goalkeeper(state,db,defend);
  if(!taker)return[];
  const incidentId=eventId(state,'free-kick'),distance=18+Math.floor(random()*10),label=descriptor(taker);
  incrementCount(state,'dangerousFreeKick');state.stats[defend].fouls+=1;
  const setups=[
    `${team} have a free-kick ${distance} yards from goal. This is a dangerous position.`,
    `Free-kick to ${team}, ${distance} yards out — close enough to go straight for goal.`,
    `${offender?.name||defTeam} concedes the foul. ${team} have a free-kick just ${distance} yards out.`
  ];
  const lines=[setups[Math.floor(random()*setups.length)]];
  lines.push(label?`${taker.name} stands over it. ${label.charAt(0).toUpperCase()+label.slice(1)} is eyeing the top corner.`:`${taker.name} stands over it. The wall is set.`);
  const strikes=[`${taker.name.toUpperCase()} CURLS IT OVER THE WALL—`,`${taker.name.toUpperCase()} GOES FOR GOAL—`,`${taker.name.toUpperCase()} STRIKES IT CLEANLY—`];
  lines.push(strikes[Math.floor(random()*strikes.length)]);
  const outcome=resolveFreeKickOutcome({roll:random(),takerAbility:playerAbility(taker),keeperAbility:playerAbility(keeper)});
  addShot(state,attack,{onTarget:outcome==='goal'||outcome==='save',xg:.06});
  if(outcome==='goal'){
    lines.push(`GOAL! ${taker.name} scores for ${team}!`);
    addRating(state,taker.id,.15);
    return[addGoal(state,attack,taker,.06,'free-kick',lines,incidentId)];
  }
  if(outcome==='save'){
    addRating(state,keeper?.id,.12);lines.push(`SUPERB SAVE! ${keeper?.name||'The goalkeeper'} gets across and turns it away!`);
  }else if(outcome==='woodwork'){
    lines.push(`OFF THE BAR! ${taker.name} had the goalkeeper beaten — inches from a brilliant free-kick.`);
  }else if(outcome==='wall'){
    lines.push(`It smashes into the wall and ${defTeam} scramble the danger away.`);
  }else lines.push(`Just over! ${taker.name} was trying to find the top corner.`);
  return[record(state,{type:outcome==='save'?'save':outcome==='woodwork'?'woodwork':'free-kick',clubId:clubId(state,attack),playerId:taker.id,incidentId,incidentType:'dangerous-free-kick',source:'free-kick',distance,xg:.06,lines})];
}

function disallowedGoal(state,db,random){
  const attack=random()<.52?'home':'away';
  const team=clubName(db,clubId(state,attack));
  const scorer=choosePlayer(state,db,attack,random,['ATT','MID']);
  if(!scorer)return[];
  const incidentId=eventId(state,'disallowed-goal');
  incrementCount(state,'disallowedGoal');
  const reason=['offside','foul in the build-up','handball'][Math.floor(random()*3)];
  const close=random()<.78;
  const lines=[
    `GOAL! ${scorer.name} has the ball in the net for ${team}!`,
    `But wait — VAR are checking the goal...`,
    reason==='offside'?`They are drawing the lines. This is extremely tight.`:reason==='handball'?`VAR are checking for a possible handball in the build-up.`:`VAR are looking at a possible foul before the finish.`
  ];
  lines.push(close?`NO GOAL! VAR overturn it for ${reason}.`:`NO GOAL! The review confirms ${reason}.`);
  return[record(state,{type:'var',clubId:clubId(state,attack),playerId:scorer.id,incidentId,incidentType:'disallowed-goal',source:'var',reason,decision:'no-goal',reviewOutcome:'overturned',disallowed:true,lines})];
}

function lastManChallenge(state,db,random){
  const attack=random()<.52?'home':'away',defend=otherSide(attack);
  const team=clubName(db,clubId(state,attack)),defTeam=clubName(db,clubId(state,defend));
  const attacker=choosePlayer(state,db,attack,random,['ATT','MID']);
  const offender=choosePlayer(state,db,defend,random,['DEF','MID']);
  if(!attacker||!offender)return[];
  const incidentId=eventId(state,'dogso');
  incrementCount(state,'lastManChallenge');state.stats[defend].fouls+=1;
  const alreadyBooked=Number(state.yellowByPlayer[offender.id]||0)>0;
  const decision=resolveDogsoDecision({decisionRoll:random(),varRoll:random(),alreadyBooked});
  const crowd=attack==='home'?`THE CROWD ARE SCREAMING FOR A RED CARD!`:`${team} players surround the referee — they want a red card.`;
  const baseLines=[`${attacker.name} is clean through on goal — ${offender.name} is the last defender!`,`${offender.name} brings him down just outside the area!`,crowd];
  if(decision.provisional==='red'){
    if(decision.overturned){
      const lines=[...baseLines,`RED CARD! ${offender.name} is sent off!`,`VAR are checking whether this really denied a clear goal-scoring opportunity...`,`The referee goes to the monitor...`,`DECISION OVERTURNED — YELLOW CARD!`];
      if(attack==='home')lines.push(`The home crowd are furious with that decision.`);
      if(alreadyBooked)lines.push(`${offender.name} was already booked, though — this will still be a second yellow.`);
      return[bookPlayer(state,db,defend,offender,{lines,incidentId,source:'var-dogso',reason:'denial-of-goal-scoring-opportunity'})].filter(Boolean);
    }
    const lines=[...baseLines,`RED CARD! ${offender.name} IS OFF!`];
    if(decision.review)lines.push(`VAR CHECK COMPLETE — RED CARD CONFIRMED.`);
    lines.push(`${defTeam} are down to ten men.`);
    return[sendOff(state,db,defend,offender,{lines,incidentId,source:'dogso',reason:'denial-of-goal-scoring-opportunity'})].filter(Boolean);
  }
  const lines=[...baseLines,`YELLOW CARD! ${offender.name} is only booked.`];
  if(attack==='home')lines.push(`The home crowd cannot believe it — they wanted a dismissal.`);
  return[bookPlayer(state,db,defend,offender,{lines,incidentId,source:'dogso',reason:'last-man-challenge'})].filter(Boolean);
}

function simulationIncident(state,db,random){
  const attack=random()<.52?'home':'away';
  const team=clubName(db,clubId(state,attack));
  const attacker=choosePlayer(state,db,attack,random,['ATT','MID']);
  if(!attacker)return[];
  const incidentId=eventId(state,'simulation');
  incrementCount(state,'simulation');
  const lines=[`${attacker.name} darts into the penalty area and goes down!`,`${team} appeal for a penalty...`,`The referee waves the appeals away.`,`YELLOW CARD! ${attacker.name} is booked for simulation — the referee says he dived.`];
  return[bookPlayer(state,db,attack,attacker,{lines,incidentId,source:'simulation',reason:'diving'})].filter(Boolean);
}

const VENUES={
  arsenal:'the Emirates',
  liverpool:'Anfield',
  'manchester united':'Old Trafford',
  'man united':'Old Trafford',
  'manchester city':'the Etihad',
  'man city':'the Etihad',
  chelsea:'Stamford Bridge',
  'tottenham hotspur':'the Tottenham Hotspur Stadium',
  tottenham:'the Tottenham Hotspur Stadium',
  newcastle:'St James\' Park',
  'newcastle united':'St James\' Park'
};
function venueFor(name){const key=String(name||'').toLowerCase();return Object.entries(VENUES).find(([clubKey])=>key.includes(clubKey))?.[1]||'the stadium';}

export function crowdNarrativeFor({minute,homeGoals,awayGoals,homeName='the home side',awayName='the visitors',seen=[]}){
  const gap=Number(awayGoals||0)-Number(homeGoals||0),venue=venueFor(homeName),used=new Set(seen||[]);
  if(minute>=76&&gap>=4&&!used.has('mass-exit'))return{key:'mass-exit',tone:'leaving',lines:[`Large sections of the home support have seen enough. Streams of fans are heading for the exits at ${venue}.`]};
  if(minute>=39&&minute<=45&&gap>=3&&!used.has('early-exit'))return{key:'early-exit',tone:'hostile',lines:[`Boos are starting to ring around ${venue}.`,`Some of the ${homeName} supporters have had enough of this performance and are already heading for the exits.`]};
  if(minute>=60&&gap>=3&&!used.has('humiliation'))return{key:'humiliation',tone:'hostile',lines:[`${homeName} are being jeered by sections of their own support. This is becoming a miserable afternoon at ${venue}.`]};
  if(minute>=70&&gap===2&&!used.has('restless'))return{key:'restless',tone:'restless',lines:[`The mood inside ${venue} is turning. The home crowd are growing increasingly frustrated.`]};
  if(minute>=82&&gap<0&&Math.abs(gap)===1&&!used.has('protect-lead'))return{key:'protect-lead',tone:'tense',lines:[`Every clearance is being cheered now. ${homeName} are trying to drag this lead over the line.`]};
  if(minute>=82&&gap===0&&!used.has('late-tension'))return{key:'late-tension',tone:'tense',lines:[`The noise rises around ${venue}. One moment could decide this match now.`]};
  if(minute>=40&&minute<=45&&gap<=-3&&!used.has('home-party'))return{key:'home-party',tone:'jubilant',lines:[`${venue} is bouncing. ${homeName} are giving their supporters a first-half performance to remember.`]};
  return null;
}

function atmosphereEvent(state,db){
  const homeName=clubName(db,state.homeClubId),awayName=clubName(db,state.awayClubId);
  const story=crowdNarrativeFor({minute:Number(state.minute),homeGoals:state.homeGoals,awayGoals:state.awayGoals,homeName,awayName,seen:state.matchDrama.atmosphere});
  if(!story)return[];
  state.matchDrama.atmosphere.push(story.key);
  return[record(state,{type:'atmosphere',clubId:state.homeClubId,incidentId:eventId(state,`crowd-${story.key}`),incidentType:'crowd',source:'atmosphere',decision:story.tone,lines:story.lines})];
}

export function applyMatchDrama(inputState,db,baseEvents=[]){
  const state=ensureState(inputState);
  const minute=Number(state.minute)||0;
  if(minute<5||minute>89)return{state,events:[]};
  const major=(baseEvents||[]).some(event=>['goal','red','injury'].includes(event?.type));
  if(major)return{state,events:atmosphereEvent(state,db)};
  const random=seededRandom(`${state.seed||'seed'}:${state.fixtureId||'fixture'}:match-drama-v3:${minute}`);
  const roll=random();
  let cursor=0;
  let events=[];
  if(roll<(cursor+=DRAMA_RATES.penaltySituation)&&underCap(state,'penaltySituation',2))events=penaltySituation(state,db,random);
  else if(roll<(cursor+=DRAMA_RATES.dangerousFreeKick)&&underCap(state,'dangerousFreeKick',3))events=dangerousFreeKick(state,db,random);
  else if(roll<(cursor+=DRAMA_RATES.disallowedGoal)&&underCap(state,'disallowedGoal',1))events=disallowedGoal(state,db,random);
  else if(roll<(cursor+=DRAMA_RATES.lastManChallenge)&&underCap(state,'lastManChallenge',1))events=lastManChallenge(state,db,random);
  else if(roll<(cursor+=DRAMA_RATES.simulation)&&underCap(state,'simulation',1))events=simulationIncident(state,db,random);
  if(!events.length)events=atmosphereEvent(state,db);
  return{state,events};
}
