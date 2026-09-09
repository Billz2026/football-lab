import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STEP_THREE_DIVISION_IDS,
  STEP_THREE_2026_27_MEMBERSHIPS,
  simulateStepThreeDivisionSeason
} from '../national-league-step-three-world-v1.js';
import { finaliseSeason } from '../season-finalisation-v1.js';
import { rolloverPremierLeagueSeason, validatePremierLeagueRollover } from '../premier-league-rollover-v3.js';

const clubIds = () => Array.from({ length: 20 }, (_, index) => `v6-pl-${String(index + 1).padStart(2, '0')}`);
function fixtures(ids) {
  const matches=[]; let serial=0;
  for(let a=0;a<ids.length;a++)for(let b=a+1;b<ids.length;b++){
    matches.push({id:`v6-${++serial}-a`,played:true,homeClubId:ids[a],awayClubId:ids[b],homeGoals:1,awayGoals:0});
    matches.push({id:`v6-${++serial}-b`,played:true,homeClubId:ids[b],awayClubId:ids[a],homeGoals:0,awayGoals:1});
  }
  return [matches];
}
function table(ids, protectedId) {
  const ordered=[protectedId,...ids.filter(id=>id!==protectedId)];
  return ordered.map((clubId,index)=>({clubId,played:38,won:Math.max(1,29-index),drawn:3,lost:6+index,goalsFor:90-index,goalsAgainst:30+index,goalDifference:60-index*2,points:100-index*4}));
}
function dbFixture() {
  const ids=clubIds(); const clubs=ids.map((id,index)=>({id,name:`V6 Premier Club ${index+1}`,shortName:`V6 ${index+1}`,providerName:`V6 Premier Club ${index+1}`,countryCode:'ENG',leagueId:'eng-premier-league',venue:`Ground ${index+1}`,reputation:7100-index*20,isPlaceholder:false}));
  const shape=[['GK','GK'],['DEF','DR'],['DEF','DC'],['DEF','DC'],['DEF','DL'],['MID','DMC'],['MID','MC'],['MID','AMC'],['ATT','AMR'],['ATT','ST'],['ATT','AML']];
  const players=clubs.flatMap((club,ci)=>shape.map(([positionGroup,primaryPosition],pi)=>({id:`${club.id}-p${pi+1}`,name:`${club.name} Player ${pi+1}`,clubId:club.id,positionGroup,primaryPosition,currentAbility:137+(20-ci)+(pi%3),potentialAbility:165,isPlaceholder:false})));
  return {clubs,players};
}
function careerFixture() {
  const ids=clubIds();
  return {version:2,id:'pyramid-v6-career',seed:'pyramid-v6-seed',managerName:'V6 Manager',clubId:ids[0],leagueId:'eng-premier-league',competitionId:'eng-premier-league',competitionName:'Premier League',season:'2026/27',status:'complete',roundIndex:38,fixtures:fixtures(ids),table:table(ids,ids[0]),seasonClubs:ids.map((id,index)=>({id,name:`V6 Premier Club ${index+1}`,strength:82-index*.4})),seasonClubIds:ids,seasonHistory:[],worldHistory:[],lowerLeagueHistory:[],worldMemberships:[],worldBoundaries:[],seasonEndDate:'2027-05-30',currentDate:'2027-05-30',lastMatch:{date:'2027-05-30'},calendar:{currentDate:'2027-05-30',fixturesReleased:true},preseason:{phase:'complete'},worldClock:{schemaVersion:2,season:'2026/27',acknowledgedMilestones:[],history:[],totalDaysAdvanced:300},tactics:{formation:'4-3-3',mentality:'Balanced',pressing:'Standard'},lineupIds:Array.from({length:11},(_,index)=>`${ids[0]}-p${index+1}`),playerStatus:{}};
}
function completeActiveSeason(career) {
  const ids=[...career.seasonClubIds]; career.table=table(ids,career.clubId); career.fixtures=career.fixtures.map(round=>round.map(match=>({...match,played:true,homeGoals:1,awayGoals:0})));
  career.status='complete'; career.roundIndex=38; career.currentDate=career.seasonEndDate; career.calendar.currentDate=career.seasonEndDate; career.lastMatch={date:career.seasonEndDate};
  const result=finaliseSeason(career,{completedAt:`${career.seasonEndDate}T18:00:00.000Z`}); assert.equal(result.status,'finalised'); return result;
}

test('FA 2026/27 Step 3 constitution is four unique 22-club divisions',()=>{
  assert.equal(STEP_THREE_DIVISION_IDS.length,4);
  const all=[];
  for(const id of STEP_THREE_DIVISION_IDS){assert.equal(STEP_THREE_2026_27_MEMBERSHIPS[id].length,22);all.push(...STEP_THREE_2026_27_MEMBERSHIPS[id].map(c=>c.id));}
  assert.equal(all.length,88); assert.equal(new Set(all).size,88);
});

test('each Step 3 division runs 462 matches with 2 up and 4 down',()=>{
  for(const id of STEP_THREE_DIVISION_IDS){
    const outcome=simulateStepThreeDivisionSeason({competitionId:id,season:'2026/27',clubs:STEP_THREE_2026_27_MEMBERSHIPS[id],seed:'v6-step3-test'});
    assert.equal(outcome.status,'complete'); assert.equal(outcome.clubCount,22); assert.equal(outcome.regularSeasonMatches,462); assert.equal(outcome.promotedClubIds.length,2); assert.equal(outcome.relegatedClubIds.length,4);
    assert.equal(outcome.playoffClubIds.length,4); assert.equal(outcome.playoffs.semiFinals.length,2); assert.ok(outcome.playoffs.final.hostClubId);
  }
});

test('Step 3 completes 2027/28 National League North and South and moves boundary to Step 4',()=>{
  const career=careerFixture(); const result=finaliseSeason(career,{completedAt:'2027-05-30T18:00:00.000Z'});
  assert.equal(Object.keys(result.stepThreeDivisions).length,4);
  for(const division of Object.values(result.stepThreeDivisions)) assert.equal(division.status,'finalised');
  const aggregate=career.worldMemberships.find(r=>r.key==='eng-national-league-step-two:2027/28');
  const north=career.worldMemberships.find(r=>r.key==='eng-national-league-north:2027/28');
  const south=career.worldMemberships.find(r=>r.key==='eng-national-league-south:2027/28');
  assert.equal(aggregate.status,'complete'); assert.equal(aggregate.clubCount,48); assert.equal(aggregate.promotedFromStepThreeClubIds.length,8);
  assert.equal(north.status,'complete'); assert.equal(north.clubCount,24); assert.equal(south.status,'complete'); assert.equal(south.clubCount,24);
  assert.equal(new Set([...north.clubs.map(c=>c.id),...south.clubs.map(c=>c.id)]).size,48);
  const stepFour=career.worldMemberships.find(r=>r.key==='eng-national-league-step-three:2027/28');
  assert.equal(stepFour.status,'incomplete-step-four-feeder'); assert.equal(stepFour.clubCount,72); assert.equal(stepFour.targetClubCount,88); assert.equal(stepFour.missingPromotionSlots,16);
  const boundary=career.worldBoundaries.find(r=>r.key==='english-pyramid:2027/28'); assert.equal(boundary.status,'step-two-ready-step-four-boundary'); assert.equal(boundary.stepTwoStatus,'complete');
});

test('Step 3 feeder unlocks a legitimate Premier League rollover into START 2032/33',()=>{
  const career=careerFixture(),db=dbFixture(); finaliseSeason(career,{completedAt:'2027-05-30T18:00:00.000Z'});
  for(const expectedSeason of ['2027/28','2028/29','2029/30','2030/31','2031/32']){
    assert.equal(rolloverPremierLeagueSeason(career,{db}).status,'rolled-over'); assert.equal(career.season,expectedSeason); completeActiveSeason(career);
  }
  assert.equal(career.nextSeasonContext.promotedFromChampionshipClubIds.length,3);
  const validation=validatePremierLeagueRollover(career,db); assert.equal(validation.ok,true); assert.equal(validation.sourceSeason,'2031/32'); assert.equal(validation.targetSeason,'2032/33');
  assert.equal(rolloverPremierLeagueSeason(career,{db}).status,'rolled-over'); assert.equal(career.season,'2032/33'); assert.equal(career.seasonClubIds.length,20); assert.equal(new Set(career.seasonClubIds).size,20);
});
