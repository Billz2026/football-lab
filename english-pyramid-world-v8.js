import {
  finaliseEnglishPyramidBackground as baseFinaliseEnglishPyramidBackground,
  nextPyramidSeasonLabel,
  NATIONAL_LEAGUE_STEP_FOUR_AGGREGATE_ID
} from './english-pyramid-world-v7.js';
import {
  ISTHMIAN_PREMIER_ID,
  NORTHERN_PREMIER_ID,
  SOUTHERN_PREMIER_CENTRAL_ID,
  SOUTHERN_PREMIER_SOUTH_ID
} from './national-league-step-three-world-v1.js';
import {
  STEP_FOUR_DIVISION_IDS,
  ISTHMIAN_SOUTH_CENTRAL_ID,
  ISTHMIAN_NORTH_ID,
  ISTHMIAN_SOUTH_EAST_ID,
  NORTHERN_PREMIER_EAST_ID,
  NORTHERN_PREMIER_WEST_ID,
  NORTHERN_PREMIER_MIDLANDS_ID,
  SOUTHERN_LEAGUE_CENTRAL_ID,
  SOUTHERN_LEAGUE_SOUTH_ID
} from './national-league-step-four-world-v1.js';
import {
  STEP_FIVE_DIVISION_IDS,
  STEP_FIVE_TO_STEP_FOUR_PREFERENCES,
  simulateStepFiveDivisionSeason
} from './national-league-step-five-world-v1.js';
import {
  RESOLVED_STEP_FIVE_2026_27_MEMBERSHIPS as STEP_FIVE_2026_27_MEMBERSHIPS,
  RESOLVED_STEP_FIVE_2026_27_TOTAL_CLUBS as STEP_FIVE_2026_27_TOTAL_CLUBS
} from './national-league-step-five-membership-resolved-v1.js';

export * from './english-pyramid-world-v7.js';
export const ENGLISH_PYRAMID_WORLD_V8_VERSION = 8;
export const NATIONAL_LEAGUE_STEP_FIVE_AGGREGATE_ID = 'eng-national-league-step-five';

const clone = value => JSON.parse(JSON.stringify(value));
const clamp = (value,min,max) => Math.max(min,Math.min(max,value));
function ensureState(career){career.worldHistory||=[];career.lowerLeagueHistory||=[];career.worldMemberships||=[];career.worldBoundaries||=[];return career;}
function key(competitionId,season){return `${competitionId}:${season}`;}
function findMembership(career,competitionId,season){return(career?.worldMemberships||[]).find(record=>record?.key===key(competitionId,season))||null;}
function upsertMembership(career,record){ensureState(career);const index=career.worldMemberships.findIndex(item=>item?.key===record.key);if(index>=0)career.worldMemberships[index]=clone(record);else career.worldMemberships.push(clone(record));return record;}
function upsertBoundary(career,record){ensureState(career);const index=career.worldBoundaries.findIndex(item=>item?.key===record.key);if(index>=0)career.worldBoundaries[index]=clone(record);else career.worldBoundaries.push(clone(record));return record;}
function outcomeIn(career,competitionId,season){return(career?.lowerLeagueHistory||[]).find(record=>record?.competitionId===competitionId&&record?.season===season)||null;}
function compactClub(club,overrides={}){return{id:club.id,slug:club.slug||String(club.id||'').split('-').slice(2).join('-'),name:club.name||club.id,strength:Number(club.strength??club.backgroundStrength??44),geoNorthing:Number.isFinite(Number(club.geoNorthing))?Number(club.geoNorthing):null,geoEasting:Number.isFinite(Number(club.geoEasting))?Number(club.geoEasting):null,...overrides};}
function hashString(value){let hash=2166136261;for(const ch of String(value)){hash^=ch.charCodeAt(0);hash=Math.imul(hash,16777619);}return hash>>>0;}

const STEP_FOUR_NAMES=Object.freeze({
  [ISTHMIAN_SOUTH_CENTRAL_ID]:'Isthmian League South Central',[ISTHMIAN_NORTH_ID]:'Isthmian League North',[ISTHMIAN_SOUTH_EAST_ID]:'Isthmian League South East',
  [NORTHERN_PREMIER_EAST_ID]:'Northern Premier League East',[NORTHERN_PREMIER_WEST_ID]:'Northern Premier League West',[NORTHERN_PREMIER_MIDLANDS_ID]:'Northern Premier League Midlands',
  [SOUTHERN_LEAGUE_CENTRAL_ID]:'Southern League Division One Central',[SOUTHERN_LEAGUE_SOUTH_ID]:'Southern League Division One South'
});
const STEP_FOUR_CENTRES=Object.freeze({
  [ISTHMIAN_SOUTH_CENTRAL_ID]:[30,38],[ISTHMIAN_NORTH_ID]:[49,74],[ISTHMIAN_SOUTH_EAST_ID]:[24,84],
  [NORTHERN_PREMIER_EAST_ID]:[76,62],[NORTHERN_PREMIER_WEST_ID]:[76,28],[NORTHERN_PREMIER_MIDLANDS_ID]:[63,50],
  [SOUTHERN_LEAGUE_CENTRAL_ID]:[45,58],[SOUTHERN_LEAGUE_SOUTH_ID]:[24,42]
});
const STEP_THREE_TO_STEP_FOUR=Object.freeze({
  [ISTHMIAN_PREMIER_ID]:[ISTHMIAN_SOUTH_EAST_ID,ISTHMIAN_NORTH_ID,ISTHMIAN_SOUTH_CENTRAL_ID,SOUTHERN_LEAGUE_CENTRAL_ID,SOUTHERN_LEAGUE_SOUTH_ID,NORTHERN_PREMIER_MIDLANDS_ID,NORTHERN_PREMIER_EAST_ID,NORTHERN_PREMIER_WEST_ID],
  [NORTHERN_PREMIER_ID]:[NORTHERN_PREMIER_EAST_ID,NORTHERN_PREMIER_WEST_ID,NORTHERN_PREMIER_MIDLANDS_ID,SOUTHERN_LEAGUE_CENTRAL_ID,ISTHMIAN_NORTH_ID,SOUTHERN_LEAGUE_SOUTH_ID,ISTHMIAN_SOUTH_CENTRAL_ID,ISTHMIAN_SOUTH_EAST_ID],
  [SOUTHERN_PREMIER_CENTRAL_ID]:[SOUTHERN_LEAGUE_CENTRAL_ID,NORTHERN_PREMIER_MIDLANDS_ID,ISTHMIAN_SOUTH_CENTRAL_ID,NORTHERN_PREMIER_EAST_ID,NORTHERN_PREMIER_WEST_ID,ISTHMIAN_NORTH_ID,SOUTHERN_LEAGUE_SOUTH_ID,ISTHMIAN_SOUTH_EAST_ID],
  [SOUTHERN_PREMIER_SOUTH_ID]:[SOUTHERN_LEAGUE_SOUTH_ID,ISTHMIAN_SOUTH_CENTRAL_ID,SOUTHERN_LEAGUE_CENTRAL_ID,ISTHMIAN_SOUTH_EAST_ID,NORTHERN_PREMIER_MIDLANDS_ID,ISTHMIAN_NORTH_ID,NORTHERN_PREMIER_WEST_ID,NORTHERN_PREMIER_EAST_ID]
});

function stepFiveClubsForSeason(career,competitionId,season){if(season==='2026/27')return STEP_FIVE_2026_27_MEMBERSHIPS[competitionId]||null;const membership=findMembership(career,competitionId,season);return membership?.status==='complete'?membership.clubs:null;}
function simulateStepFiveV8(career,competitionId,season,completedAt){const existing=outcomeIn(career,competitionId,season);if(existing)return{status:'already-finalised',outcome:existing};const clubs=stepFiveClubsForSeason(career,competitionId,season);if(!clubs)return{status:'unsupported-membership',outcome:{schemaVersion:ENGLISH_PYRAMID_WORLD_V8_VERSION,key:key(competitionId,season),competitionId,season,status:'unsupported-membership',promotedClubIds:[],relegatedClubIds:[],reason:`${season} Step 5 membership requires the 32 Step 6 promotion places and FA geographic allocation data.`}};const outcome=simulateStepFiveDivisionSeason({competitionId,season,clubs,seed:`${career.seed||career.id||'career'}:${competitionId}:v8`,completedAt});career.lowerLeagueHistory.push(outcome);return{status:outcome.status==='complete'?'finalised':outcome.status,outcome};}

function stepFourSurvivors(outcome){const leaving=new Set([...(outcome?.promotedClubIds||[]),...(outcome?.relegatedClubIds||[])]);return(outcome?.clubs||[]).filter(club=>!leaving.has(club.id)).map(club=>compactClub(club,{assignedStepFourDivisionId:outcome.competitionId,pyramidOrigin:`${outcome.competitionId}-survivor`}));}
function stepThreeRelegatedRecords(stepThreeOutcomes){return stepThreeOutcomes.flatMap(outcome=>{const map=new Map((outcome?.clubs||[]).map(c=>[c.id,c]));const preferences=STEP_THREE_TO_STEP_FOUR[outcome.competitionId]||STEP_FOUR_DIVISION_IDS;return(outcome?.relegatedClubIds||[]).map(id=>{const club=map.get(id)||{id,name:id,strength:50};const h=hashString(id);return compactClub(club,{strength:clamp(Number(club.strength||50)-2,43,55),geoNorthing:Number.isFinite(Number(club.geoNorthing))?Number(club.geoNorthing):(40+(h%35)),geoEasting:Number.isFinite(Number(club.geoEasting))?Number(club.geoEasting):(30+((h>>>8)%50)),preferredStepFourDivisionIds:[...preferences],pyramidOrigin:`${outcome.competitionId}-relegation-to-step-four`});});});}
function promotedStepFiveRecords(stepFiveOutcomes){return stepFiveOutcomes.flatMap(outcome=>{const map=new Map((outcome?.clubs||[]).map(c=>[c.id,c]));return(outcome?.promotedClubIds||[]).map(id=>{const club=map.get(id);if(!club)throw new Error('Step 5 promotion is missing club metadata.');return compactClub(club,{strength:clamp(Number(club.strength||43)+2,41,53),sourceStepFiveDivisionId:outcome.competitionId,preferredStepFourDivisionIds:[...(club.preferredStepFourDivisionIds||STEP_FIVE_TO_STEP_FOUR_PREFERENCES[outcome.competitionId]||STEP_FOUR_DIVISION_IDS)],pyramidOrigin:`${outcome.competitionId}-promotion`});});});}
function distance(club,competitionId){const [n,e]=STEP_FOUR_CENTRES[competitionId];const cn=Number.isFinite(Number(club.geoNorthing))?Number(club.geoNorthing):50,ce=Number.isFinite(Number(club.geoEasting))?Number(club.geoEasting):50;return(cn-n)**2+(ce-e)**2;}
function allocateIncomingStepFour(incoming){if(incoming.length!==48||new Set(incoming.map(c=>c.id)).size!==48)throw new Error('Step 4 feeder allocation requires exactly 48 unique incoming clubs.');const capacity=new Map(STEP_FOUR_DIVISION_IDS.map(id=>[id,6])),assignments=new Map(STEP_FOUR_DIVISION_IDS.map(id=>[id,[]]));const ordered=[...incoming].sort((a,b)=>{const ar=[...STEP_FOUR_DIVISION_IDS].sort((x,y)=>distance(a,x)-distance(a,y)),br=[...STEP_FOUR_DIVISION_IDS].sort((x,y)=>distance(b,x)-distance(b,y));const am=distance(a,ar[1])-distance(a,ar[0]),bm=distance(b,br[1])-distance(b,br[0]);return bm-am||a.name.localeCompare(b.name);});for(const club of ordered){const geographic=[...STEP_FOUR_DIVISION_IDS].sort((a,b)=>distance(club,a)-distance(club,b));const preferences=[...(club.preferredStepFourDivisionIds||[]),...geographic].filter((id,index,list)=>STEP_FOUR_DIVISION_IDS.includes(id)&&list.indexOf(id)===index);const chosen=preferences.find(id=>(capacity.get(id)||0)>0);if(!chosen)throw new Error('Step 4 feeder allocation ran out of division capacity.');capacity.set(chosen,capacity.get(chosen)-1);assignments.get(chosen).push(compactClub(club,{assignedStepFourDivisionId:chosen}));}if([...capacity.values()].some(v=>v!==0))throw new Error('Step 4 feeder allocation did not fill all eight divisions.');return assignments;}

function completeNextStepFourMemberships(career,baseResult,stepFiveOutcomes){const stepThreeOutcomes=Object.values(baseResult?.stepThreeDivisions||{}).map(item=>item?.outcome).filter(Boolean),stepFourOutcomes=Object.values(baseResult?.stepFourDivisions||{}).map(item=>item?.outcome).filter(Boolean);if(stepThreeOutcomes.length!==4||stepFourOutcomes.length!==8||stepThreeOutcomes.some(o=>o.status!=='complete')||stepFourOutcomes.some(o=>o.status!=='complete')||stepFiveOutcomes.some(o=>o.status!=='complete'||o.promotedClubIds?.length!==2))return null;const sourceSeason=stepFourOutcomes[0].season,targetSeason=nextPyramidSeasonLabel(sourceSeason);if(!targetSeason)return null;const survivorsByDivision=new Map(STEP_FOUR_DIVISION_IDS.map(id=>{const outcome=stepFourOutcomes.find(o=>o.competitionId===id),survivors=stepFourSurvivors(outcome);if(survivors.length!==16)throw new Error(`Step 4 ${id} requires exactly 16 survivors before feeder allocation.`);return[id,survivors];}));const incoming=[...stepThreeRelegatedRecords(stepThreeOutcomes),...promotedStepFiveRecords(stepFiveOutcomes)];if(incoming.length!==48)return null;const assignments=allocateIncomingStepFour(incoming),records={};for(const competitionId of STEP_FOUR_DIVISION_IDS){const clubs=[...survivorsByDivision.get(competitionId),...assignments.get(competitionId)];if(clubs.length!==22||new Set(clubs.map(c=>c.id)).size!==22)throw new Error(`Step 4 ${competitionId} ${targetSeason} membership must contain 22 unique clubs.`);records[competitionId]=upsertMembership(career,{schemaVersion:ENGLISH_PYRAMID_WORLD_V8_VERSION,key:key(competitionId,targetSeason),competitionId,competitionName:STEP_FOUR_NAMES[competitionId],season:targetSeason,status:'complete',clubCount:22,membershipSource:`${sourceSeason} cascade: 16 Step 4 survivors plus 6 clubs from the FA geographic feeder pool`,allocationMethod:'geographic-feeder-preference-with-fixed-22-club-capacity',clubs});}const all=STEP_FOUR_DIVISION_IDS.flatMap(id=>records[id].clubs),aggregate=upsertMembership(career,{schemaVersion:ENGLISH_PYRAMID_WORLD_V8_VERSION,key:key(NATIONAL_LEAGUE_STEP_FOUR_AGGREGATE_ID,targetSeason),competitionId:NATIONAL_LEAGUE_STEP_FOUR_AGGREGATE_ID,competitionName:'National League Step 4',season:targetSeason,status:'complete',clubCount:176,targetClubCount:176,targetDivisionCount:8,targetClubsPerDivision:22,membershipSource:`${sourceSeason} cascade: 128 Step 4 survivors + 16 Step 3 relegated + 32 Step 5 promoted`,clubs:all,promotedFromStepFiveClubIds:stepFiveOutcomes.flatMap(o=>o.promotedClubIds),relegatedFromStepThreeClubIds:stepThreeRelegatedRecords(stepThreeOutcomes).map(c=>c.id),allocationMethod:'geographic-feeder-preference-with-fixed-22-club-capacity'});return{divisions:records,aggregate};}

function stepFiveSurvivors(outcome){const leaving=new Set([...(outcome?.promotedClubIds||[]),...(outcome?.relegatedClubIds||[])]);return(outcome?.clubs||[]).filter(c=>!leaving.has(c.id)).map(c=>compactClub(c,{sourceStepFiveDivisionId:outcome.competitionId,pyramidOrigin:`${outcome.competitionId}-survivor`}));}
function stepFourRelegatedRecords(baseResult){return Object.values(baseResult?.stepFourDivisions||{}).flatMap(item=>{const outcome=item?.outcome;if(!outcome||outcome.status!=='complete')return[];const map=new Map((outcome.clubs||[]).map(c=>[c.id,c]));return(outcome.relegatedClubIds||[]).map(id=>{const club=map.get(id)||{id,name:id,strength:46};return compactClub(club,{strength:clamp(Number(club.strength||46)-2,38,50),pyramidOrigin:`${outcome.competitionId}-relegation-to-step-five`});});});}
function buildStepSixBoundary(career,baseResult,stepFiveOutcomes){if(stepFiveOutcomes.some(o=>o?.status!=='complete'))return null;const sourceSeason=stepFiveOutcomes[0].season,targetSeason=nextPyramidSeasonLabel(sourceSeason);if(!targetSeason)return null;const survivors=stepFiveOutcomes.flatMap(stepFiveSurvivors),relegated=stepFourRelegatedRecords(baseResult),known=[...survivors,...relegated];if(survivors.length!==256||relegated.length!==32||known.length!==288||new Set(known.map(c=>c.id)).size!==288)throw new Error(`Step 5 ${targetSeason} boundary requires 256 survivors and 32 Step 4 relegated clubs.`);return upsertMembership(career,{schemaVersion:ENGLISH_PYRAMID_WORLD_V8_VERSION,key:key(NATIONAL_LEAGUE_STEP_FIVE_AGGREGATE_ID,targetSeason),competitionId:NATIONAL_LEAGUE_STEP_FIVE_AGGREGATE_ID,competitionName:'National League Step 5',season:targetSeason,status:'incomplete-step-six-feeder',membershipSource:`${sourceSeason} Step 5 survivors plus Step 4 relegation pool; Step 6 not yet modelled`,clubs:known,clubCount:288,targetClubCount:STEP_FIVE_2026_27_TOTAL_CLUBS,targetDivisionCount:16,sourceDivisionClubCounts:Object.fromEntries(stepFiveOutcomes.map(o=>[o.competitionId,o.clubCount])),stepFiveSurvivorClubIds:survivors.map(c=>c.id),relegatedFromStepFourClubIds:relegated.map(c=>c.id),promotedToStepFourClubIds:stepFiveOutcomes.flatMap(o=>o.promotedClubIds),relegatedToStepSixClubIds:stepFiveOutcomes.flatMap(o=>o.relegatedClubIds),missingPromotionSlots:32,reason:`Step 5 ${targetSeason} has 288 known clubs. It still requires 32 promoted clubs from Step 6 plus FA geographic allocation across the sixteen Step 5 divisions.`});}
function updateBoundaryV8(career,baseResult,nextStepFour,stepSixBoundary){const targetSeason=nextStepFour?.aggregate?.season||stepSixBoundary?.season||baseResult?.boundary?.season;if(!targetSeason)return baseResult?.boundary||null;const upper=baseResult?.boundary||{};return upsertBoundary(career,{...clone(upper),schemaVersion:ENGLISH_PYRAMID_WORLD_V8_VERSION,key:`english-pyramid:${targetSeason}`,season:targetSeason,status:nextStepFour?.aggregate?.status==='complete'&&stepSixBoundary?'step-four-ready-step-six-boundary':(upper.status||'blocked-by-lower-pyramid'),stepFourStatus:nextStepFour?.aggregate?.status||upper.stepFourStatus||'unknown',stepFiveStatus:stepSixBoundary?.status||'unsupported-step-six-feeder',reason:stepSixBoundary?.reason||upper.reason||null});}

export function finaliseEnglishPyramidBackground(career,{completedAt=null}={}){
  const baseResult=baseFinaliseEnglishPyramidBackground(career,{completedAt});if(!career||(career.competitionId||career.leagueId)!=='eng-premier-league')return{...baseResult,stepFiveDivisions:null,nextStepFourMembership:null,stepSixBoundary:null};ensureState(career);const season=career.season||'2026/27';
  const stepFiveDivisions=Object.fromEntries(STEP_FIVE_DIVISION_IDS.map(id=>[id,simulateStepFiveV8(career,id,season,completedAt)])),stepFiveOutcomes=STEP_FIVE_DIVISION_IDS.map(id=>stepFiveDivisions[id].outcome);
  const nextStepFourMembership=stepFiveOutcomes.every(o=>o?.status==='complete')?completeNextStepFourMemberships(career,baseResult,stepFiveOutcomes):null;
  const stepSixBoundary=stepFiveOutcomes.every(o=>o?.status==='complete')?buildStepSixBoundary(career,baseResult,stepFiveOutcomes):null;
  const boundary=updateBoundaryV8(career,baseResult,nextStepFourMembership,stepSixBoundary);
  return{...baseResult,stepFiveDivisions,nextStepFourMembership,stepFourBoundary:nextStepFourMembership?.aggregate||baseResult.stepFourBoundary,stepFiveBoundary:stepSixBoundary||baseResult.stepFiveBoundary,stepSixBoundary,boundary};
}
