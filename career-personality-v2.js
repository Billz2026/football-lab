export const PERSONALITY_SCHEMA_VERSION = 2;
export const PERSONALITY_TRAITS = Object.freeze([
  'professionalism','ambition','determination','discipline','temperament','resilience','teamOrientation','adaptability','loyalty'
]);

const SAVE_KEY='flm-career-save';
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const clean=v=>String(v??'').trim();

function hash(value){let h=2166136261;for(const ch of String(value)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
function seededValue(seed,key,min=4,max=18){const span=max-min+1;return min+(hash(`${seed}:${key}`)%span);}
function mental(player,key,fallback=10){const value=Number(player?.attributes?.mental?.[key]);return Number.isFinite(value)?value:fallback;}
function physical(player,key,fallback=10){const value=Number(player?.attributes?.physical?.[key]);return Number.isFinite(value)?value:fallback;}
function blend(base,observed,weight=.45){return clamp(Math.round(base*(1-weight)+observed*weight),1,20);}

export function createPersonalityProfile(player,seed='football-lab'){
  const id=player?.id||clean(player?.name)||'unknown-player';
  const base=key=>seededValue(`${seed}:${id}`,key);
  const determination=blend(base('determination'),mental(player,'determination',10),.62);
  const temperament=blend(base('temperament'),mental(player,'composure',10),.52);
  const teamOrientation=blend(base('teamOrientation'),mental(player,'teamwork',10),.58);
  const professionalism=blend(base('professionalism'),Math.round((mental(player,'workRate',10)+physical(player,'naturalFitness',10))/2),.48);
  const discipline=blend(base('discipline'),clamp(21-mental(player,'aggression',10),1,20),.28);
  const resilience=blend(base('resilience'),Math.round((determination+mental(player,'composure',10))/2),.42);
  const age=Number(player?.reportedAge)||26;
  const ability=Number(player?.currentAbility)||120;
  const ambition=clamp(blend(base('ambition'),clamp(Math.round(7+(ability-100)/11+(age<=23?2:0)),1,20),.34),1,20);
  const adaptability=base('adaptability');
  const loyalty=clamp(base('loyalty')+(age>=30?1:0),1,20);
  const traits={professionalism,ambition,determination,discipline,temperament,resilience,teamOrientation,adaptability,loyalty};
  const archetype=classifyPersonality(traits);
  const descriptors=describePersonality(traits);
  return {
    schemaVersion:PERSONALITY_SCHEMA_VERSION,
    playerId:id,
    individualityKey:`${id}-${hash(`${seed}:${id}:individuality`).toString(36)}`,
    traits,
    visibleId:archetype.id,
    label:archetype.label,
    family:archetype.family,
    descriptors,
    effects:behaviorEffects(traits,player),
    history:[]
  };
}

export function classifyPersonality(t){
  if(t.professionalism>=18&&t.discipline>=15&&t.teamOrientation>=14)return{id:'exemplary-professional',label:'Exemplary Professional',family:'elite'};
  if(t.professionalism>=16&&t.determination>=16)return{id:'driven-professional',label:'Driven Professional',family:'elite'};
  if(t.teamOrientation>=16&&t.determination>=15&&t.temperament>=13)return{id:'natural-leader',label:'Natural Leader',family:'elite'};
  if(t.temperament>=17&&t.determination>=14)return{id:'composed-competitor',label:'Composed Competitor',family:'elite'};
  if(t.discipline>=17)return{id:'disciplined',label:'Disciplined',family:'elite'};
  if(t.determination>=17&&t.resilience>=16)return{id:'relentless',label:'Relentless',family:'elite'};
  if(t.professionalism>=16&&t.temperament>=14)return{id:'highly-focused',label:'Highly Focused',family:'elite'};
  if(t.temperament<=6&&t.discipline<=9)return{id:'temperamental',label:'Temperamental',family:'risk'};
  if(t.discipline<=6&&t.temperament<=10)return{id:'impulsive',label:'Impulsive',family:'risk'};
  if(t.teamOrientation<=6&&t.ambition>=14)return{id:'self-centred',label:'Self-Centred',family:'risk'};
  if(t.loyalty<=6&&t.ambition>=14)return{id:'restless',label:'Restless',family:'risk'};
  if(t.resilience<=6)return{id:'fragile-confidence',label:'Fragile Confidence',family:'risk'};
  if(t.ambition<=6)return{id:'low-ambition',label:'Low Ambition',family:'risk'};
  if(t.ambition>=16)return{id:'ambitious',label:'Ambitious',family:'positive'};
  if(t.determination>=16)return{id:'determined',label:'Determined',family:'positive'};
  if(t.resilience>=16)return{id:'resilient',label:'Resilient',family:'positive'};
  if(t.loyalty>=17)return{id:'loyal',label:'Loyal',family:'positive'};
  if(t.teamOrientation>=16)return{id:'team-oriented',label:'Team-Oriented',family:'positive'};
  if(t.adaptability>=17)return{id:'adaptable',label:'Adaptable',family:'positive'};
  if(t.determination>=14&&t.ambition>=13)return{id:'competitive',label:'Competitive',family:'positive'};
  if(t.teamOrientation<=8)return{id:'independent',label:'Independent',family:'mixed'};
  if(t.determination<=8&&t.ambition<=8&&t.temperament>=12)return{id:'easy-going',label:'Easy-Going',family:'mixed'};
  if(t.determination>=13&&t.resilience>=13)return{id:'confident',label:'Confident',family:'mixed'};
  return{id:'balanced',label:'Balanced',family:'mixed'};
}

function band(value,high,mid,low){return value>=16?high:value>=11?mid:low;}
export function describePersonality(t){
  return {
    professionalism:band(t.professionalism,'Highly professional','Professional','Variable standards'),
    temperament:band(t.temperament,'Composed','Generally calm','Emotional'),
    ambition:band(t.ambition,'Highly ambitious','Driven','Content'),
    teamStyle:band(t.teamOrientation,'Team-first','Co-operative','Independent'),
    resilience:band(t.resilience,'Very resilient','Steady','Confidence can dip'),
    loyalty:band(t.loyalty,'Loyal','Open-minded','Restless'),
    adaptability:band(t.adaptability,'Adapts quickly','Settles normally','Needs time to settle')
  };
}

export function behaviorEffects(t,player={}){
  const aggression=mental(player,'aggression',10);
  return {
    development:clamp(0.72+t.professionalism*.018+t.determination*.012,0.82,1.28),
    disciplineRisk:clamp(1.42-t.discipline*.025-t.temperament*.014+aggression*.012,.62,1.48),
    moraleStability:clamp(.68+t.resilience*.019+t.temperament*.012,.82,1.26),
    transferRestlessness:clamp(.72+t.ambition*.025+(20-t.loyalty)*.025,.78,1.55),
    teamHarmony:clamp(.72+t.teamOrientation*.022+t.professionalism*.009,.8,1.3),
    managerAuthoritySensitivity:clamp(.7+t.ambition*.018+(20-t.teamOrientation)*.012,.82,1.38)
  };
}

export function managerRespectAdjustment(profile,player,managerReputation=50){
  if(!profile?.traits)return 0;
  const t=profile.traits;
  const ability=Number(player?.currentAbility)||120;
  let delta=0;
  if(managerReputation<40)delta-=Math.round((t.ambition-10)/3);
  if(managerReputation>=70)delta+=Math.round((t.professionalism+t.teamOrientation-20)/7);
  if(ability>=155&&managerReputation<55)delta-=2;
  if(t.professionalism>=16)delta+=1;
  if(t.teamOrientation<=7)delta-=1;
  return clamp(delta,-8,7);
}

export function resultRespectAdjustment(profile,outcome,managerReputation=50){
  const t=profile?.traits;if(!t)return 0;
  if(outcome==='win')return clamp(1+(t.teamOrientation>=15?1:0)+(t.ambition>=16?1:0),1,3);
  if(outcome==='draw')return t.temperament<=7?-1:0;
  let delta=-1;
  if(t.resilience<=7)delta-=1;
  if(t.temperament<=7)delta-=1;
  if(t.ambition>=16&&managerReputation<55)delta-=1;
  if(t.professionalism>=16&&t.resilience>=14)delta+=1;
  return clamp(delta,-4,0);
}

export function ensurePersonalityState(career,db){
  if(!career||!db?.players)return false;
  let changed=false;
  if(!career.personalityEngine||career.personalityEngine.schemaVersion!==PERSONALITY_SCHEMA_VERSION){
    career.personalityEngine={schemaVersion:PERSONALITY_SCHEMA_VERSION,lastRelationshipRound:Number(career.roundIndex)||0};changed=true;
  }
  if(!career.playerPersonalities||typeof career.playerPersonalities!=='object'||Array.isArray(career.playerPersonalities)){career.playerPersonalities={};changed=true;}
  for(const player of db.players.filter(p=>!p.isPlaceholder)){
    const existing=career.playerPersonalities[player.id];
    if(!existing||existing.schemaVersion!==PERSONALITY_SCHEMA_VERSION){career.playerPersonalities[player.id]=createPersonalityProfile(player,career.seed||career.id);changed=true;}
  }
  return changed;
}

export function applyPersonalityToManagerRelationships(career,db){
  if(!career?.managerProfile?.schemaVersion||!career.playerRelationships)return false;
  let changed=false;
  for(const player of db.players.filter(p=>p.clubId===career.clubId&&!p.isPlaceholder)){
    const relation=career.playerRelationships[player.id];const profile=career.playerPersonalities?.[player.id];
    if(!relation||!profile||relation.personalitySchemaVersion===PERSONALITY_SCHEMA_VERSION)continue;
    relation.managerRespect=clamp((Number(relation.managerRespect)||50)+managerRespectAdjustment(profile,player,Number(career.managerReputation)||50),5,100);
    relation.personalitySchemaVersion=PERSONALITY_SCHEMA_VERSION;relation.lastUpdated=career.currentDate||career.updatedAt;changed=true;
  }
  return changed;
}

export function processPersonalityResults(career,db){
  if(!career?.managerProfile?.schemaVersion||!career.personalityEngine)return false;
  const from=Number(career.personalityEngine.lastRelationshipRound)||0;const to=Number(career.roundIndex)||0;if(to<=from)return false;
  let changed=false;
  for(let index=from;index<to;index++){
    const fixture=(career.fixtures?.[index]||[]).find(f=>f.homeClubId===career.clubId||f.awayClubId===career.clubId);if(!fixture?.played)continue;
    const home=fixture.homeClubId===career.clubId;const gf=home?fixture.homeGoals:fixture.awayGoals;const ga=home?fixture.awayGoals:fixture.homeGoals;const outcome=gf>ga?'win':gf<ga?'loss':'draw';
    for(const player of db.players.filter(p=>p.clubId===career.clubId&&!p.isPlaceholder)){
      const relation=career.playerRelationships?.[player.id];const profile=career.playerPersonalities?.[player.id];if(!relation||!profile)continue;
      const delta=resultRespectAdjustment(profile,outcome,Number(career.managerReputation)||50);if(delta){relation.managerRespect=clamp((Number(relation.managerRespect)||50)+delta,5,100);changed=true;}
      relation.lastPersonalityReaction={round:index+1,outcome,delta};relation.lastUpdated=career.currentDate||career.updatedAt;
    }
  }
  career.personalityEngine.lastRelationshipRound=to;return changed;
}

export function getPlayerPersonality(career,playerId){return career?.playerPersonalities?.[playerId]||null;}

if(typeof window!=='undefined'){
  let queued=false;let dbPromise=null;let syncing=false;
  const manager=()=>window.FLMManager;
  const database=()=>dbPromise||=(Promise.resolve(manager()?.loadDatabase?.()).catch(()=>null));
  const persist=career=>{try{career.updatedAt=new Date().toISOString();localStorage.setItem(SAVE_KEY,JSON.stringify(career));}catch{}};
  const sync=async()=>{
    queued=false;if(syncing)return;const career=manager()?.activeCareer;if(!career)return;const db=await database();if(!db)return;syncing=true;
    try{let changed=ensurePersonalityState(career,db);changed=applyPersonalityToManagerRelationships(career,db)||changed;changed=processPersonalityResults(career,db)||changed;if(changed){persist(career);window.dispatchEvent(new CustomEvent('flm:personality-v2',{detail:{careerId:career.id}}));}}
    finally{syncing=false;}
  };
  const queue=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>sync().catch(error=>console.error('Personality Engine V2:',error)));};
  window.FLMPlayerPersonalityV2=Object.freeze({version:'2.0.0',ensure:ensurePersonalityState,get:(playerId)=>getPlayerPersonality(manager()?.activeCareer,playerId),describe:describePersonality,effects:(playerId)=>getPlayerPersonality(manager()?.activeCareer,playerId)?.effects||null,refresh:queue});
  new MutationObserver(queue).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','data-career-tab']});
  document.addEventListener('click',queue,true);setInterval(queue,1200);queue();
}
