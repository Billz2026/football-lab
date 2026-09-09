import test from 'node:test';
import assert from 'node:assert/strict';
import { STEP_FIVE_DIVISION_IDS } from '../national-league-step-five-world-v1.js';
import { RESOLVED_STEP_FIVE_2026_27_MEMBERSHIPS } from '../national-league-step-five-membership-resolved-v1.js';
import {
  STEP_SIX_DIVISION_IDS,
  STEP_SIX_PLAYOFF_DIVISION_IDS,
  STEP_SIX_2026_27_MEMBERSHIPS,
  STEP_SIX_2026_27_TOTAL_CLUBS,
  SWPW_ID,
  SWPE_ID,
  ECLN_ID,
  simulateStepSixDivisionSeason
} from '../national-league-step-six-world-v1.js';
import { finaliseSeason } from '../season-finalisation-v9.js';
import { rolloverPremierLeagueSeason, validatePremierLeagueRollover } from '../premier-league-rollover-v3.js';

const clubIds=()=>Array.from({length:20},(_,i)=>`v9-pl-${String(i+1).padStart(2,'0')}`);
function fixtures(ids){const matches=[];let serial=0;for(let a=0;a<ids.length;a++)for(let b=a+1;b<ids.length;b++){matches.push({id:`v9-${++serial}-a`,played:true,homeClubId:ids[a],awayClubId:ids[b],homeGoals:1,awayGoals:0});matches.push({id:`v9-${++serial}-b`,played:true,homeClubId:ids[b],awayClubId:ids[a],homeGoals:0,awayGoals:1});}return[matches];}
function table(ids,protectedId){const ordered=[protectedId,...ids.filter(id=>id!==protectedId)];return ordered.map((clubId,index)=>({clubId,played:38,won:Math.max(1,29-index),drawn:3,lost:6+index,goalsFor:90-index,goalsAgainst:30+index,goalDifference:60-index*2,points:100-index*4}));}
function dbFixture(){const ids=clubIds(),clubs=ids.map((id,index)=>({id,name:`V9 Premier Club ${index+1}`,shortName:`V9 ${index+1}`,providerName:`V9 Premier Club ${index+1}`,countryCode:'ENG',leagueId:'eng-premier-league',venue:`Ground ${index+1}`,reputation:7100-index*20,isPlaceholder:false})),shape=[['GK','GK'],['DEF','DR'],['DEF','DC'],['DEF','DC'],['DEF','DL'],['MID','DMC'],['MID','MC'],['MID','AMC'],['ATT','AMR'],['ATT','ST'],['ATT','AML']],players=clubs.flatMap((club,ci)=>shape.map(([positionGroup,primaryPosition],pi)=>({id:`${club.id}-p${pi+1}`,name:`${club.name} Player ${pi+1}`,clubId:club.id,positionGroup,primaryPosition,currentAbility:137+(20-ci)+(pi%3),potentialAbility:165,isPlaceholder:false})));return{clubs,players};}
function careerFixture(){const ids=clubIds();return{version:2,id:'pyramid-v9-career',seed:'pyramid-v9-seed',managerName:'V9 Manager',clubId:ids[0],leagueId:'eng-premier-league',competitionId:'eng-premier-league',competitionName:'Premier League',season:'2026/27',status:'complete',roundIndex:38,fixtures:fixtures(ids),table:table(ids,ids[0]),seasonClubs:ids.map((id,index)=>({id,name:`V9 Premier Club ${index+1}`,strength:82-index*.4})),seasonClubIds:ids,seasonHistory:[],worldHistory:[],lowerLeagueHistory:[],worldMemberships:[],worldBoundaries:[],seasonEndDate:'2027-05-30',currentDate:'2027-05-30',lastMatch:{date:'2027-05-30'},calendar:{currentDate:'2027-05-30',fixturesReleased:true},preseason:{phase:'complete'},worldClock:{schemaVersion:2,season:'2026/27',acknowledgedMilestones:[],history:[],totalDaysAdvanced:300},tactics:{formation:'4-3-3',mentality:'Balanced',pressing:'Standard'},lineupIds:Array.from({length:11},(_,index)=>`${ids[0]}-p${index+1}`),playerStatus:{}};}
function completeActiveSeason(career){const ids=[...career.seasonClubIds];career.table=table(ids,career.clubId);career.fixtures=career.fixtures.map(round=>round.map(match=>({...match,played:true,homeGoals:1,awayGoals:0})));career.status='complete';career.roundIndex=38;career.currentDate=career.seasonEndDate;career.calendar.currentDate=career.seasonEndDate;career.lastMatch={date:career.seasonEndDate};const result=finaliseSeason(career,{completedAt:`${career.seasonEndDate}T18:00:00.000Z`});assert.equal(result.status,'finalised');return result;}

test('FA 2026/27 Step 6 constitution contains 17 divisions and 340 clubs with real variable sizes',()=>{
  assert.equal(STEP_SIX_DIVISION_IDS.length,17);assert.equal(STEP_SIX_PLAYOFF_DIVISION_IDS.length,15);assert.equal(STEP_SIX_2026_27_TOTAL_CLUBS,340);
  const all=STEP_SIX_DIVISION_IDS.flatMap(id=>STEP_SIX_2026_27_MEMBERSHIPS[id].map(c=>c.id));assert.equal(all.length,340);assert.equal(new Set(all).size,340);
  const sizes=STEP_SIX_DIVISION_IDS.map(id=>STEP_SIX_2026_27_MEMBERSHIPS[id].length);
  assert.deepEqual([...sizes].sort((a,b)=>a-b),[17,18,18,18,18,19,20,20,20,20,20,22,22,22,22,22,22]);
  const falmouth=STEP_SIX_2026_27_MEMBERSHIPS[SWPW_ID].find(c=>c.name==='Falmouth Town (Reserves)');assert.equal(falmouth.promotionEligible,false);
  const university=STEP_SIX_2026_27_MEMBERSHIPS[SWPE_ID].find(c=>c.name==='University of Exeter');assert.equal(university.promotionEligible,true);
});

test('Step 6 produces exactly 32 promotions and models odd-sized fixture lists plus unresolved FA relegation liability',()=>{
  let promoted=0,matches=0;
  for(const id of STEP_SIX_DIVISION_IDS){
    const clubs=STEP_SIX_2026_27_MEMBERSHIPS[id],outcome=simulateStepSixDivisionSeason({competitionId:id,season:'2026/27',clubs,seed:'v9-step6-test'});
    assert.equal(outcome.status,'complete');assert.equal(outcome.regularSeasonMatches,clubs.length*(clubs.length-1));assert.equal(outcome.regularSeasonMatchesPerClub,(clubs.length-1)*2);
    const expectedPromotions=(id===SWPW_ID||id===SWPE_ID)?1:2;assert.equal(outcome.promotedClubIds.length,expectedPromotions);
    assert.equal(outcome.playoffClubIds.length,(id===SWPW_ID||id===SWPE_ID)?0:4);
    assert.equal(outcome.relegatedClubIds.length,0);assert.equal(outcome.relegationCandidateClubIds.length,3);
    if(clubs.length<18){assert.equal(outcome.relegationLiableClubIds.length,0);assert.equal(outcome.relegationLiabilityStatus,'committee-discretion-required-under-18-division');}
    else assert.equal(outcome.relegationLiableClubIds.length,3);
    promoted+=outcome.promotedClubIds.length;matches+=outcome.regularSeasonMatches;
  }
  assert.equal(promoted,32);assert.equal(matches,6510);
});

test('reserve teams cannot take a Step 5 promotion place even when simulated as division champion',()=>{
  const reserveIds=STEP_SIX_2026_27_MEMBERSHIPS[ECLN_ID].filter(c=>c.promotionEligible===false).map(c=>c.id),forcedChampionId=reserveIds[0];
  const clubs=STEP_SIX_2026_27_MEMBERSHIPS[ECLN_ID].map(c=>({...c,strength:c.id===forcedChampionId?95:(c.promotionEligible===false?8:42)}));
  const outcome=simulateStepSixDivisionSeason({competitionId:ECLN_ID,season:'2026/27',clubs,seed:'v9-reserve-eligibility'});
  assert.equal(outcome.status,'complete');
  const champion=clubs.find(c=>c.id===outcome.championClubId);assert.equal(champion.promotionEligible,false);
  assert.notEqual(outcome.automaticPromotionClubId,outcome.championClubId);
  assert.ok(outcome.promotedClubIds.every(id=>clubs.find(c=>c.id===id)?.promotionEligible!==false));
});

test('Step 6 completes 2027/28 Step 5 and moves the honest boundary to Step 7',()=>{
  const career=careerFixture(),result=finaliseSeason(career,{completedAt:'2027-05-30T18:00:00.000Z'});
  assert.equal(Object.keys(result.stepSixDivisions).length,17);for(const division of Object.values(result.stepSixDivisions))assert.equal(division.status,'finalised');
  const aggregate=career.worldMemberships.find(r=>r.key==='eng-national-league-step-five:2027/28');assert.equal(aggregate.status,'complete');assert.equal(aggregate.clubCount,320);assert.equal(aggregate.promotedFromStepSixClubIds.length,32);assert.equal(aggregate.relegatedFromStepFourClubIds.length,32);assert.equal(new Set(aggregate.clubs.map(c=>c.id)).size,320);
  for(const id of STEP_FIVE_DIVISION_IDS){const membership=career.worldMemberships.find(r=>r.key===`${id}:2027/28`);assert.equal(membership.status,'complete');assert.equal(membership.clubCount,RESOLVED_STEP_FIVE_2026_27_MEMBERSHIPS[id].length);}
  const stepSeven=career.worldMemberships.find(r=>r.key==='eng-national-league-step-six:2027/28');assert.equal(stepSeven.status,'incomplete-step-seven-feeder-and-relegation-resolution');assert.equal(stepSeven.clubCount,340);assert.equal(stepSeven.stepSixNonPromotedClubIds.length,308);assert.equal(stepSeven.relegatedFromStepFiveClubIds.length,32);assert.equal(stepSeven.promotedToStepFiveClubIds.length,32);assert.equal(stepSeven.under18DivisionIds.length,1);
  const boundary=career.worldBoundaries.find(r=>r.key==='english-pyramid:2027/28');assert.equal(boundary.status,'step-five-ready-step-seven-boundary');assert.equal(boundary.stepFiveStatus,'complete');assert.equal(boundary.stepSixStatus,'incomplete-step-seven-feeder-and-relegation-resolution');
});

test('derived 2027/28 Step 5 season completes 2028/29 Step 4 membership',()=>{
  const career=careerFixture(),db=dbFixture();finaliseSeason(career,{completedAt:'2027-05-30T18:00:00.000Z'});assert.equal(rolloverPremierLeagueSeason(career,{db}).status,'rolled-over');
  const result=completeActiveSeason(career);for(const division of Object.values(result.stepFiveDivisions))assert.ok(['finalised','already-finalised'].includes(division.status));
  const aggregate=career.worldMemberships.find(r=>r.key==='eng-national-league-step-four:2028/29');assert.equal(aggregate.status,'complete');assert.equal(aggregate.clubCount,176);assert.equal(aggregate.promotedFromStepFiveClubIds.length,32);
});

test('Step 6 feeder unlocks a legitimate Premier League rollover into START 2035/36',()=>{
  const career=careerFixture(),db=dbFixture();finaliseSeason(career,{completedAt:'2027-05-30T18:00:00.000Z'});
  for(const expectedSeason of ['2027/28','2028/29','2029/30','2030/31','2031/32','2032/33','2033/34','2034/35']){assert.equal(rolloverPremierLeagueSeason(career,{db}).status,'rolled-over');assert.equal(career.season,expectedSeason);completeActiveSeason(career);}
  const validation=validatePremierLeagueRollover(career,db);assert.equal(validation.ok,true);assert.equal(validation.sourceSeason,'2034/35');assert.equal(validation.targetSeason,'2035/36');assert.equal(rolloverPremierLeagueSeason(career,{db}).status,'rolled-over');assert.equal(career.season,'2035/36');assert.equal(career.seasonClubIds.length,20);assert.equal(new Set(career.seasonClubIds).size,20);
});
