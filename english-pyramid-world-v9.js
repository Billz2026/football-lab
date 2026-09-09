import {
  finaliseEnglishPyramidBackground as baseFinaliseEnglishPyramidBackground,
  nextPyramidSeasonLabel,
  NATIONAL_LEAGUE_STEP_FIVE_AGGREGATE_ID
} from './english-pyramid-world-v8.js';
import {
  STEP_FIVE_DIVISION_IDS
} from './national-league-step-five-world-v1.js';
import {
  STEP_SIX_DIVISION_IDS,
  STEP_SIX_2026_27_MEMBERSHIPS,
  STEP_SIX_2026_27_TOTAL_CLUBS,
  STEP_SIX_TO_STEP_FIVE_PREFERENCES
} from './national-league-step-six-world-v1.js';
import { simulateResolvedStepSixDivisionSeason } from './national-league-step-six-simulation-resolved-v1.js';

export * from './english-pyramid-world-v8.js';
export const ENGLISH_PYRAMID_WORLD_V9_VERSION=9;
export const NATIONAL_LEAGUE_STEP_SIX_AGGREGATE_ID='eng-national-league-step-six';

const clone=value=>JSON.parse(JSON.stringify(value));
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
function ensureState(career){career.worldHistory||=[];career.lowerLeagueHistory||=[];career.worldMemberships||=[];career.worldBoundaries||=[];return career;}
function key(competitionId,season){return `${competitionId}:${season}`;}
function findMembership(career,competitionId,season){return(career?.worldMemberships||[]).find(record=>record?.key===key(competitionId,season))||null;}
function upsertMembership(career,record){ensureState(career);const index=career.worldMemberships.findIndex(item=>item?.key===record.key);if(index>=0)career.worldMemberships[index]=clone(record);else career.worldMemberships.push(clone(record));return record;}
function upsertBoundary(career,record){ensureState(career);const index=career.worldBoundaries.findIndex(item=>item?.key===record.key);if(index>=0)career.worldBoundaries[index]=clone(record);else career.worldBoundaries.push(clone(record));return record;}
function outcomeIn(career,competitionId,season){return(career?.lowerLeagueHistory||[]).find(record=>record?.competitionId===competitionId&&record?.season===season)||null;}
function compactClub(club,overrides={}){return{id:club.id,slug:club.slug||String(club.id||'').split('-').slice(2).join('-'),name:club.name||club.id,strength:Number(club.strength??club.backgroundStrength??40),geoNorthing:Number.isFinite(Number(club.geoNorthing))?Number(club.geoNorthing):null,geoEasting:Number.isFinite(Number(club.geoEasting))?Number(club.geoEasting):null,...overrides};}

function stepSixClubsForSeason(career,competitionId,season){
  if(season==='2026/27')return STEP_SIX_2026_27_MEMBERSHIPS[competitionId]||null;
  const membership=findMembership(career,competitionId,season);
  return membership?.status==='complete'?membership.clubs:null;
}
function simulateStepSixV9(career,competitionId,season,completedAt){
  const existing=outcomeIn(career,competitionId,season);if(existing)return{status:'already-finalised',outcome:existing};
  const clubs=stepSixClubsForSeason(career,competitionId,season);
  if(!clubs)return{status:'unsupported-membership',outcome:{schemaVersion:ENGLISH_PYRAMID_WORLD_V9_VERSION,key:key(competitionId,season),competitionId,season,status:'unsupported-membership',promotedClubIds:[],relegatedClubIds:[],reason:`${season} Step 6 membership requires Step 7 feeder promotions plus FA Committee Step 6 relegation/reprieve decisions.`}};
  const outcome=simulateResolvedStepSixDivisionSeason({competitionId,season,clubs,seed:`${career.seed||career.id||'career'}:${competitionId}:v9`,completedAt});
  career.lowerLeagueHistory.push(outcome);
  return{status:outcome.status==='complete'?'finalised':outcome.status,outcome};
}

function stepFiveSurvivors(outcome){
  const leaving=new Set([...(outcome?.promotedClubIds||[]),...(outcome?.relegatedClubIds||[])]);
  return(outcome?.clubs||[]).filter(c=>!leaving.has(c.id)).map(c=>compactClub(c,{sourceStepFiveDivisionId:outcome.competitionId,pyramidOrigin:`${outcome.competitionId}-survivor`}));
}
function stepFourRelegatedRecords(baseResult){
  return Object.values(baseResult?.stepFourDivisions||{}).flatMap(item=>{
    const outcome=item?.outcome;if(!outcome||outcome.status!=='complete')return[];
    const map=new Map((outcome.clubs||[]).map(c=>[c.id,c]));
    return(outcome.relegatedClubIds||[]).map(id=>{const club=map.get(id)||{id,name:id,strength:44};return compactClub(club,{strength:clamp(Number(club.strength||44)-2,36,49),pyramidOrigin:`${outcome.competitionId}-relegation-to-step-five`});});
  });
}
function promotedStepSixRecords(stepSixOutcomes){
  return stepSixOutcomes.flatMap(outcome=>{
    const map=new Map((outcome?.clubs||[]).map(c=>[c.id,c]));
    return(outcome?.promotedClubIds||[]).map(id=>{
      const club=map.get(id);if(!club)throw new Error('Step 6 promotion is missing club metadata.');
      return compactClub(club,{strength:clamp(Number(club.strength||39)+2,38,49),sourceStepSixDivisionId:outcome.competitionId,preferredStepFiveDivisionIds:[...(club.preferredStepFiveDivisionIds||STEP_SIX_TO_STEP_FIVE_PREFERENCES[outcome.competitionId]||STEP_FIVE_DIVISION_IDS)],pyramidOrigin:`${outcome.competitionId}-promotion`});
    });
  });
}
function centre(clubs){
  const valid=clubs.filter(c=>Number.isFinite(Number(c.geoNorthing))&&Number.isFinite(Number(c.geoEasting)));
  if(!valid.length)return{n:50,e:50};
  return{n:valid.reduce((s,c)=>s+Number(c.geoNorthing),0)/valid.length,e:valid.reduce((s,c)=>s+Number(c.geoEasting),0)/valid.length};
}
function distance(club,c){const n=Number.isFinite(Number(club.geoNorthing))?Number(club.geoNorthing):50,e=Number.isFinite(Number(club.geoEasting))?Number(club.geoEasting):50;return(n-c.n)**2+(e-c.e)**2;}
function allocateIncomingStepFive(incoming,survivorsByDivision){
  if(incoming.length!==64||new Set(incoming.map(c=>c.id)).size!==64)throw new Error('Step 5 feeder allocation requires exactly 64 unique incoming clubs.');
  const capacity=new Map(STEP_FIVE_DIVISION_IDS.map(id=>[id,4])),assignments=new Map(STEP_FIVE_DIVISION_IDS.map(id=>[id,[]])),centres=new Map(STEP_FIVE_DIVISION_IDS.map(id=>[id,centre(survivorsByDivision.get(id)||[])]));
  const ordered=[...incoming].sort((a,b)=>{
    const ar=[...STEP_FIVE_DIVISION_IDS].sort((x,y)=>distance(a,centres.get(x))-distance(a,centres.get(y))),br=[...STEP_FIVE_DIVISION_IDS].sort((x,y)=>distance(b,centres.get(x))-distance(b,centres.get(y)));
    const am=distance(a,centres.get(ar[1]))-distance(a,centres.get(ar[0])),bm=distance(b,centres.get(br[1]))-distance(b,centres.get(br[0]));
    return bm-am||a.name.localeCompare(b.name);
  });
  for(const club of ordered){
    const geographic=[...STEP_FIVE_DIVISION_IDS].sort((a,b)=>distance(club,centres.get(a))-distance(club,centres.get(b)));
    const preferences=[...(club.preferredStepFiveDivisionIds||[]),...geographic].filter((id,index,list)=>STEP_FIVE_DIVISION_IDS.includes(id)&&list.indexOf(id)===index);
    const chosen=preferences.find(id=>(capacity.get(id)||0)>0);if(!chosen)throw new Error('Step 5 feeder allocation ran out of division capacity.');
    capacity.set(chosen,capacity.get(chosen)-1);assignments.get(chosen).push(compactClub(club,{assignedStepFiveDivisionId:chosen}));
  }
  if([...capacity.values()].some(v=>v!==0))throw new Error('Step 5 feeder allocation did not fill all sixteen divisions.');
  return assignments;
}
function completeNextStepFiveMemberships(career,baseResult,stepSixOutcomes){
  const stepFiveOutcomes=Object.values(baseResult?.stepFiveDivisions||{}).map(item=>item?.outcome).filter(Boolean);
  if(stepFiveOutcomes.length!==16||stepFiveOutcomes.some(o=>o.status!=='complete'||o.promotedClubIds?.length!==2||o.relegatedClubIds?.length!==2))return null;
  if(stepSixOutcomes.length!==17||stepSixOutcomes.some(o=>o.status!=='complete'))return null;
  if(stepSixOutcomes.flatMap(o=>o.promotedClubIds||[]).length!==32)return null;
  const sourceSeason=stepFiveOutcomes[0].season,targetSeason=nextPyramidSeasonLabel(sourceSeason);if(!targetSeason)return null;
  const survivorsByDivision=new Map(STEP_FIVE_DIVISION_IDS.map(id=>{
    const outcome=stepFiveOutcomes.find(o=>o.competitionId===id),survivors=stepFiveSurvivors(outcome),expected=outcome.clubCount-4;
    if(survivors.length!==expected)throw new Error(`Step 5 ${id} requires ${expected} survivors before feeder allocation.`);
    return[id,survivors];
  }));
  const relegated=stepFourRelegatedRecords(baseResult),promoted=promotedStepSixRecords(stepSixOutcomes),incoming=[...relegated,...promoted];
  if(relegated.length!==32||promoted.length!==32||incoming.length!==64)return null;
  const assignments=allocateIncomingStepFive(incoming,survivorsByDivision),records={};
  for(const competitionId of STEP_FIVE_DIVISION_IDS){
    const sourceOutcome=stepFiveOutcomes.find(o=>o.competitionId===competitionId),clubs=[...survivorsByDivision.get(competitionId),...assignments.get(competitionId)];
    if(clubs.length!==sourceOutcome.clubCount||new Set(clubs.map(c=>c.id)).size!==clubs.length)throw new Error(`Step 5 ${competitionId} ${targetSeason} membership must preserve its ${sourceOutcome.clubCount}-club allocation size.`);
    records[competitionId]=upsertMembership(career,{schemaVersion:ENGLISH_PYRAMID_WORLD_V9_VERSION,key:key(competitionId,targetSeason),competitionId,competitionName:sourceOutcome.competitionName,season:targetSeason,status:'complete',clubCount:clubs.length,membershipSource:`${sourceSeason} cascade: Step 5 survivors plus four clubs from the FA geographic feeder pool`,allocationMethod:'geographic-feeder-preference-with-four-incoming-per-division',clubs});
  }
  const all=STEP_FIVE_DIVISION_IDS.flatMap(id=>records[id].clubs);
  if(all.length!==320||new Set(all.map(c=>c.id)).size!==320)throw new Error(`Step 5 ${targetSeason} aggregate must contain 320 unique clubs.`);
  const aggregate=upsertMembership(career,{schemaVersion:ENGLISH_PYRAMID_WORLD_V9_VERSION,key:key(NATIONAL_LEAGUE_STEP_FIVE_AGGREGATE_ID,targetSeason),competitionId:NATIONAL_LEAGUE_STEP_FIVE_AGGREGATE_ID,competitionName:'National League Step 5',season:targetSeason,status:'complete',clubCount:320,targetClubCount:320,targetDivisionCount:16,membershipSource:`${sourceSeason} cascade: 256 Step 5 survivors + 32 Step 4 relegated + 32 Step 6 promoted`,clubs:all,promotedFromStepSixClubIds:promoted.map(c=>c.id),relegatedFromStepFourClubIds:relegated.map(c=>c.id),allocationMethod:'geographic-feeder-preference-with-four-incoming-per-division'});
  return{divisions:records,aggregate};
}

function nonPromotedStepSixRecords(stepSixOutcomes){
  return stepSixOutcomes.flatMap(outcome=>{const promoted=new Set(outcome.promotedClubIds||[]);return(outcome.clubs||[]).filter(c=>!promoted.has(c.id)).map(c=>compactClub(c,{sourceStepSixDivisionId:outcome.competitionId,pyramidOrigin:`${outcome.competitionId}-non-promoted`}));});
}
function stepFiveRelegatedRecords(baseResult){
  return Object.values(baseResult?.stepFiveDivisions||{}).flatMap(item=>{const outcome=item?.outcome;if(!outcome||outcome.status!=='complete')return[];const map=new Map((outcome.clubs||[]).map(c=>[c.id,c]));return(outcome.relegatedClubIds||[]).map(id=>{const club=map.get(id)||{id,name:id,strength:40};return compactClub(club,{strength:clamp(Number(club.strength||40)-2,34,46),pyramidOrigin:`${outcome.competitionId}-relegation-to-step-six`});});});
}
function buildStepSevenBoundary(career,baseResult,stepSixOutcomes){
  if(stepSixOutcomes.length!==17||stepSixOutcomes.some(o=>o?.status!=='complete'))return null;
  const sourceSeason=stepSixOutcomes[0].season,targetSeason=nextPyramidSeasonLabel(sourceSeason);if(!targetSeason)return null;
  const nonPromoted=nonPromotedStepSixRecords(stepSixOutcomes),relegated=stepFiveRelegatedRecords(baseResult),provisional=[...nonPromoted,...relegated];
  if(nonPromoted.length!==STEP_SIX_2026_27_TOTAL_CLUBS-32||relegated.length!==32||provisional.length!==STEP_SIX_2026_27_TOTAL_CLUBS||new Set(provisional.map(c=>c.id)).size!==provisional.length)throw new Error(`Step 6 ${targetSeason} provisional pool requires 308 non-promoted Step 6 clubs plus 32 Step 5 relegated clubs.`);
  const candidates=stepSixOutcomes.flatMap(o=>o.relegationCandidateClubIds||[]);
  return upsertMembership(career,{schemaVersion:ENGLISH_PYRAMID_WORLD_V9_VERSION,key:key(NATIONAL_LEAGUE_STEP_SIX_AGGREGATE_ID,targetSeason),competitionId:NATIONAL_LEAGUE_STEP_SIX_AGGREGATE_ID,competitionName:'National League Step 6',season:targetSeason,status:'incomplete-step-seven-feeder-and-relegation-resolution',membershipSource:`${sourceSeason} provisional Step 6 retained pool plus Step 5 relegations; Step 7 and FA Committee decisions not yet modelled`,clubs:provisional,clubCount:provisional.length,baselineClubCount:STEP_SIX_2026_27_TOTAL_CLUBS,targetDivisionCount:17,stepSixNonPromotedClubIds:nonPromoted.map(c=>c.id),relegatedFromStepFiveClubIds:relegated.map(c=>c.id),promotedToStepFiveClubIds:stepSixOutcomes.flatMap(o=>o.promotedClubIds||[]),relegationCandidateClubIds:candidates,under18DivisionIds:stepSixOutcomes.filter(o=>o.clubCount<18).map(o=>o.competitionId),reason:`Step 6 ${targetSeason} cannot be finalised until Regional NLS Feeder League promotions, final Step 6 relegation numbers/reprieves and FA geographic allocations are known. The 340-club pool is provisional because some Step 6 non-promoted clubs may be relegated and replaced by Step 7 feeder clubs.`});
}
function updateBoundaryV9(career,baseResult,nextStepFive,stepSevenBoundary){
  const targetSeason=nextStepFive?.aggregate?.season||stepSevenBoundary?.season||baseResult?.boundary?.season;if(!targetSeason)return baseResult?.boundary||null;
  const upper=baseResult?.boundary||{};
  if(!nextStepFive?.aggregate||!stepSevenBoundary)return upper;
  return upsertBoundary(career,{...clone(upper),schemaVersion:ENGLISH_PYRAMID_WORLD_V9_VERSION,key:`english-pyramid:${targetSeason}`,season:targetSeason,status:'step-five-ready-step-seven-boundary',stepFiveStatus:'complete',stepSixStatus:stepSevenBoundary.status,reason:stepSevenBoundary.reason});
}

export function finaliseEnglishPyramidBackground(career,{completedAt=null}={}){
  const baseResult=baseFinaliseEnglishPyramidBackground(career,{completedAt});
  if(!career||(career.competitionId||career.leagueId)!=='eng-premier-league')return{...baseResult,stepSixDivisions:null,nextStepFiveMembership:null,stepSevenBoundary:null};
  ensureState(career);const season=career.season||'2026/27';
  const stepSixDivisions=Object.fromEntries(STEP_SIX_DIVISION_IDS.map(id=>[id,simulateStepSixV9(career,id,season,completedAt)])),stepSixOutcomes=STEP_SIX_DIVISION_IDS.map(id=>stepSixDivisions[id].outcome);
  const nextStepFiveMembership=stepSixOutcomes.every(o=>o?.status==='complete')?completeNextStepFiveMemberships(career,baseResult,stepSixOutcomes):null;
  const stepSevenBoundary=stepSixOutcomes.every(o=>o?.status==='complete')?buildStepSevenBoundary(career,baseResult,stepSixOutcomes):null;
  const boundary=updateBoundaryV9(career,baseResult,nextStepFiveMembership,stepSevenBoundary);
  return{...baseResult,stepSixDivisions,nextStepFiveMembership,stepFiveBoundary:nextStepFiveMembership?.aggregate||baseResult.stepFiveBoundary,stepSixBoundary:stepSevenBoundary||baseResult.stepSixBoundary,stepSevenBoundary,boundary};
}
