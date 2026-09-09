import {
  finaliseEnglishPyramidBackground as baseFinaliseEnglishPyramidBackground,
  getNationalLeagueStepTwoMembership,
  nextPyramidSeasonLabel,
  NATIONAL_LEAGUE_STEP_TWO_AGGREGATE_ID
} from './english-pyramid-world-v5.js';
import { NATIONAL_LEAGUE_ID } from './national-league-world-v1.js';
import {
  NATIONAL_LEAGUE_NORTH_ID,
  NATIONAL_LEAGUE_SOUTH_ID
} from './national-league-step-two-world-v1.js';
import {
  STEP_THREE_DIVISION_IDS,
  STEP_THREE_2026_27_MEMBERSHIPS,
  simulateStepThreeDivisionSeason
} from './national-league-step-three-world-v1.js';

export * from './english-pyramid-world-v5.js';

export const ENGLISH_PYRAMID_WORLD_V6_VERSION = 6;
export const NATIONAL_LEAGUE_STEP_THREE_AGGREGATE_ID = 'eng-national-league-step-three';

const clone = value => JSON.parse(JSON.stringify(value));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function ensureState(career) {
  career.worldHistory ||= [];
  career.lowerLeagueHistory ||= [];
  career.worldMemberships ||= [];
  career.worldBoundaries ||= [];
  return career;
}
function key(competitionId, season) { return `${competitionId}:${season}`; }
function findMembership(career, competitionId, season) { return (career?.worldMemberships || []).find(record => record?.key === key(competitionId, season)) || null; }
function upsertMembership(career, record) {
  ensureState(career); const index = career.worldMemberships.findIndex(item => item?.key === record.key);
  if (index >= 0) career.worldMemberships[index] = clone(record); else career.worldMemberships.push(clone(record));
  return record;
}
function upsertBoundary(career, record) {
  ensureState(career); const index = career.worldBoundaries.findIndex(item => item?.key === record.key);
  if (index >= 0) career.worldBoundaries[index] = clone(record); else career.worldBoundaries.push(clone(record));
  return record;
}
function outcomeIn(career, competitionId, season) { return (career?.lowerLeagueHistory || []).find(record => record?.competitionId === competitionId && record?.season === season) || null; }
function compactClub(club, overrides={}) {
  return { id:club.id, slug:club.slug || String(club.id||'').split('-').slice(3).join('-'), name:club.name || club.id, strength:Number(club.strength ?? club.backgroundStrength ?? 52), geoNorthing:Number.isFinite(Number(club.geoNorthing))?Number(club.geoNorthing):null, ...overrides };
}

const ORIGINAL_NL_GEO = Object.freeze({
  'afc-fylde':80,'aldershot-town':29,'altrincham':77,'barrow':91,'boreham-wood':39,'boston-united':66,'carlisle-united':96,'eastleigh':24,'fc-halifax-town':82,'forest-green-rovers':48,'gateshead':94,'harrogate-town':84,'hartlepool-united':91,'hornchurch':31,'kidderminster-harriers':59,'scunthorpe-united':75,'solihull-moors':61,'southend-united':34,'sutton-united':27,'tamworth':64,'wealdstone':34,'woking':27,'worthing':19,'yeovil-town':29
});

function geoNorthing(club, sourceCompetitionId=null) {
  if (Number.isFinite(Number(club?.geoNorthing))) return Number(club.geoNorthing);
  const origin = String(club?.pyramidOrigin || ''); const id = String(club?.id || ''); const slug = club?.slug || id.replace(/^eng-national-league-/, '');
  if (origin.includes('north') || id.startsWith(`${NATIONAL_LEAGUE_NORTH_ID}-`)) return 74;
  if (origin.includes('south') || id.startsWith(`${NATIONAL_LEAGUE_SOUTH_ID}-`)) return 28;
  if (sourceCompetitionId === NATIONAL_LEAGUE_NORTH_ID) return 74;
  if (sourceCompetitionId === NATIONAL_LEAGUE_SOUTH_ID) return 28;
  if (Object.prototype.hasOwnProperty.call(ORIGINAL_NL_GEO, slug)) return ORIGINAL_NL_GEO[slug];
  const hash = [...id].reduce((sum,ch)=>((sum*33)+ch.charCodeAt(0))>>>0,5381);
  return 38 + (hash % 31);
}

function simulateStepThree(career, competitionId, season, completedAt) {
  const existing = outcomeIn(career, competitionId, season); if (existing) return {status:'already-finalised', outcome:existing};
  const clubs = season === '2026/27' ? STEP_THREE_2026_27_MEMBERSHIPS[competitionId] : null;
  if (!clubs) return {status:'unsupported-membership',outcome:{schemaVersion:ENGLISH_PYRAMID_WORLD_V6_VERSION,key:key(competitionId,season),competitionId,season,status:'unsupported-membership',promotedClubIds:[],relegatedClubIds:[],reason:`${season} Step 3 membership requires Step 4 promotion and FA geographic allocation data.`}};
  const outcome = simulateStepThreeDivisionSeason({competitionId,season,clubs,seed:`${career.seed||career.id||'career'}:${competitionId}`,completedAt});
  career.lowerLeagueHistory.push(outcome); return {status:outcome.status==='complete'?'finalised':outcome.status,outcome};
}

function survivorRecords(outcome, sourceCompetitionId) {
  const leaving = new Set([...(outcome?.promotedClubIds||[]),...(outcome?.relegatedClubIds||[])]);
  return (outcome?.clubs||[]).filter(c=>!leaving.has(c.id)).map(c=>compactClub(c,{geoNorthing:geoNorthing(c,sourceCompetitionId),pyramidOrigin:sourceCompetitionId===NATIONAL_LEAGUE_NORTH_ID?'national-league-north-survivor':'national-league-south-survivor'}));
}
function relegatedNationalLeagueRecords(outcome) {
  const map=new Map((outcome?.clubs||[]).map(c=>[c.id,c]));
  return (outcome?.relegatedClubIds||[]).map(id=>{const c=map.get(id)||{id,name:id,strength:57};return compactClub(c,{strength:clamp(Number(c.strength||57)-2,50,62),geoNorthing:geoNorthing(c,NATIONAL_LEAGUE_ID),pyramidOrigin:'national-league-relegation'});});
}
function promotedStepThreeRecords(outcomes) {
  return outcomes.flatMap(outcome=>{const map=new Map((outcome?.clubs||[]).map(c=>[c.id,c]));return (outcome?.promotedClubIds||[]).map(id=>{const c=map.get(id);if(!c)throw new Error('Step 3 promotion is missing club metadata.');return compactClub(c,{strength:clamp(Number(c.strength||52)+2,49,60),geoNorthing:geoNorthing(c,outcome.competitionId),pyramidOrigin:`${outcome.competitionId}-promotion`});});});
}

function allocateStepTwoGeographically(clubs) {
  if (clubs.length !== 48 || new Set(clubs.map(c=>c.id)).size !== 48) throw new Error('Step 2 geographic allocation requires exactly 48 unique clubs.');
  const ranked=[...clubs].map(c=>({...c,geoNorthing:geoNorthing(c)})).sort((a,b)=>b.geoNorthing-a.geoNorthing || a.name.localeCompare(b.name));
  const north=ranked.slice(0,24), south=ranked.slice(24);
  return {north,south,method:'geographic-northing-feeder-pool',northThreshold:Math.min(...north.map(c=>c.geoNorthing)),southThreshold:Math.max(...south.map(c=>c.geoNorthing))};
}

function completeStepTwoMemberships(career, baseResult, stepThreeOutcomes) {
  const northOutcome=baseResult?.nationalLeagueNorth?.outcome, southOutcome=baseResult?.nationalLeagueSouth?.outcome, nlOutcome=baseResult?.nationalLeague?.outcome;
  if (!northOutcome || northOutcome.status!=='complete' || !southOutcome || southOutcome.status!=='complete' || !nlOutcome || nlOutcome.status!=='complete') return null;
  if (stepThreeOutcomes.some(o=>o?.status!=='complete' || o.promotedClubIds?.length!==2)) return null;
  const sourceSeason=nlOutcome.season, targetSeason=nextPyramidSeasonLabel(sourceSeason); if(!targetSeason)return null;
  const candidates=[...survivorRecords(northOutcome,NATIONAL_LEAGUE_NORTH_ID),...survivorRecords(southOutcome,NATIONAL_LEAGUE_SOUTH_ID),...relegatedNationalLeagueRecords(nlOutcome),...promotedStepThreeRecords(stepThreeOutcomes)];
  const allocation=allocateStepTwoGeographically(candidates);
  const common={schemaVersion:ENGLISH_PYRAMID_WORLD_V6_VERSION,season:targetSeason,status:'complete',clubCount:24,sourceSeason,allocationMethod:allocation.method};
  const northRecord=upsertMembership(career,{...common,key:key(NATIONAL_LEAGUE_NORTH_ID,targetSeason),competitionId:NATIONAL_LEAGUE_NORTH_ID,competitionName:'National League North',membershipSource:`${sourceSeason} FA-style geographic feeder allocation`,clubs:allocation.north,northThreshold:allocation.northThreshold});
  const southRecord=upsertMembership(career,{...common,key:key(NATIONAL_LEAGUE_SOUTH_ID,targetSeason),competitionId:NATIONAL_LEAGUE_SOUTH_ID,competitionName:'National League South',membershipSource:`${sourceSeason} FA-style geographic feeder allocation`,clubs:allocation.south,southThreshold:allocation.southThreshold});
  const aggregate=upsertMembership(career,{schemaVersion:ENGLISH_PYRAMID_WORLD_V6_VERSION,key:key(NATIONAL_LEAGUE_STEP_TWO_AGGREGATE_ID,targetSeason),competitionId:NATIONAL_LEAGUE_STEP_TWO_AGGREGATE_ID,competitionName:'National League Step 2',season:targetSeason,status:'complete',clubCount:48,targetClubCount:48,targetDivisionCount:2,targetClubsPerDivision:24,membershipSource:`${sourceSeason} cascade: 36 Step 2 survivors + 4 National League relegated + 8 Step 3 promoted, geographically allocated`,clubs:[...allocation.north,...allocation.south],northClubIds:allocation.north.map(c=>c.id),southClubIds:allocation.south.map(c=>c.id),promotedFromStepThreeClubIds:stepThreeOutcomes.flatMap(o=>o.promotedClubIds),relegatedFromNationalLeagueClubIds:[...nlOutcome.relegatedClubIds],allocationMethod:allocation.method});
  return {north:northRecord,south:southRecord,aggregate};
}

function stepThreeSurvivors(outcome) {
  const leaving=new Set([...(outcome?.promotedClubIds||[]),...(outcome?.relegatedClubIds||[])]);
  return (outcome?.clubs||[]).filter(c=>!leaving.has(c.id)).map(c=>compactClub(c,{geoNorthing:geoNorthing(c,outcome.competitionId),pyramidOrigin:`${outcome.competitionId}-survivor`}));
}
function stepTwoRelegated(outcome, competitionId) {
  const map=new Map((outcome?.clubs||[]).map(c=>[c.id,c]));
  return (outcome?.relegatedClubIds||[]).map(id=>{const c=map.get(id)||{id,name:id,strength:54};return compactClub(c,{strength:clamp(Number(c.strength||54)-2,48,59),geoNorthing:geoNorthing(c,competitionId),pyramidOrigin:'step-two-relegation-unallocated-step-three'});});
}
function buildStepFourBoundary(career, baseResult, stepThreeOutcomes) {
  const north=baseResult?.nationalLeagueNorth?.outcome,south=baseResult?.nationalLeagueSouth?.outcome;if(!north||north.status!=='complete'||!south||south.status!=='complete'||stepThreeOutcomes.some(o=>o?.status!=='complete'))return null;
  const sourceSeason=north.season,targetSeason=nextPyramidSeasonLabel(sourceSeason);if(!targetSeason)return null;
  const survivors=stepThreeOutcomes.flatMap(stepThreeSurvivors), relegated=[...stepTwoRelegated(north,NATIONAL_LEAGUE_NORTH_ID),...stepTwoRelegated(south,NATIONAL_LEAGUE_SOUTH_ID)], known=[...survivors,...relegated];
  if(survivors.length!==64||relegated.length!==8||known.length!==72||new Set(known.map(c=>c.id)).size!==72)throw new Error(`Step 3 ${targetSeason} boundary requires 64 survivors and 8 Step 2 relegated clubs.`);
  return upsertMembership(career,{schemaVersion:ENGLISH_PYRAMID_WORLD_V6_VERSION,key:key(NATIONAL_LEAGUE_STEP_THREE_AGGREGATE_ID,targetSeason),competitionId:NATIONAL_LEAGUE_STEP_THREE_AGGREGATE_ID,competitionName:'National League Step 3',season:targetSeason,status:'incomplete-step-four-feeder',membershipSource:`${sourceSeason} Step 3 survivors plus unallocated Step 2 relegation pool; Step 4 not yet modelled`,clubs:known,clubCount:72,targetClubCount:88,targetDivisionCount:4,targetClubsPerDivision:22,stepThreeSurvivorClubIds:survivors.map(c=>c.id),unallocatedRelegatedFromStepTwoClubIds:relegated.map(c=>c.id),promotedToStepTwoClubIds:stepThreeOutcomes.flatMap(o=>o.promotedClubIds),relegatedToStepFourClubIds:stepThreeOutcomes.flatMap(o=>o.relegatedClubIds),missingPromotionSlots:16,reason:`Step 3 ${targetSeason} has 72 known clubs. It still requires 16 promoted clubs from the eight Step 4 divisions plus FA geographic allocation across the four Step 3 divisions.`});
}

function updateBoundary(career, baseResult, completedStepTwo, stepFourBoundary) {
  const targetSeason=completedStepTwo?.aggregate?.season||stepFourBoundary?.season||baseResult?.boundary?.season;if(!targetSeason)return baseResult?.boundary||null;
  const championshipStatus=baseResult?.membership?.status||baseResult?.boundary?.championshipStatus||'unknown';
  const leagueOneStatus=baseResult?.leagueOneMembership?.status||baseResult?.boundary?.leagueOneStatus||'unknown';
  const leagueTwoStatus=baseResult?.leagueTwoMembership?.status||baseResult?.boundary?.leagueTwoStatus||'unknown';
  const nationalLeagueStatus=baseResult?.nationalLeagueMembership?.status||baseResult?.boundary?.nationalLeagueStatus||'unknown';
  const stepTwoStatus=completedStepTwo?.aggregate?.status||baseResult?.stepTwoBoundary?.status||'unknown';
  const ready=championshipStatus==='complete'&&leagueOneStatus==='complete'&&leagueTwoStatus==='complete'&&nationalLeagueStatus==='complete'&&stepTwoStatus==='complete';
  return upsertBoundary(career,{schemaVersion:ENGLISH_PYRAMID_WORLD_V6_VERSION,key:`english-pyramid:${targetSeason}`,season:targetSeason,status:ready?'step-two-ready-step-four-boundary':'blocked-by-lower-pyramid',championshipStatus,leagueOneStatus,leagueTwoStatus,nationalLeagueStatus,stepTwoStatus,stepThreeStatus:stepFourBoundary?.status||'unknown',reason:stepFourBoundary?.reason||baseResult?.boundary?.reason||null});
}

export function finaliseEnglishPyramidBackground(career,{completedAt=null}={}) {
  const baseResult=baseFinaliseEnglishPyramidBackground(career,{completedAt});
  if(!career||(career.competitionId||career.leagueId)!=='eng-premier-league')return {...baseResult,stepThreeDivisions:null,stepThreeMembership:null,stepFourBoundary:null};
  ensureState(career); const season=career.season||'2026/27';
  const stepThreeDivisions=Object.fromEntries(STEP_THREE_DIVISION_IDS.map(id=>[id,simulateStepThree(career,id,season,completedAt)]));
  const outcomes=STEP_THREE_DIVISION_IDS.map(id=>stepThreeDivisions[id].outcome);
  let stepThreeMembership=null;
  if(outcomes.every(o=>o?.status==='complete'))stepThreeMembership=completeStepTwoMemberships(career,baseResult,outcomes);
  const stepFourBoundary=outcomes.every(o=>o?.status==='complete')?buildStepFourBoundary(career,baseResult,outcomes):null;
  const boundary=updateBoundary(career,baseResult,stepThreeMembership,stepFourBoundary);
  return {...baseResult,stepThreeDivisions,stepThreeMembership,stepTwoBoundary:stepThreeMembership?.aggregate||baseResult.stepTwoBoundary,stepFourBoundary,boundary};
}
