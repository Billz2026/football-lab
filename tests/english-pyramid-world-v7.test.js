import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STEP_FOUR_DIVISION_IDS,
  STEP_FOUR_2026_27_MEMBERSHIPS,
  simulateStepFourDivisionSeason
} from '../national-league-step-four-world-v1.js';
import { STEP_THREE_DIVISION_IDS } from '../national-league-step-three-world-v1.js';
import { finaliseSeason } from '../season-finalisation-v7.js';
import { rolloverPremierLeagueSeason, validatePremierLeagueRollover } from '../premier-league-rollover-v3.js';

const clubIds = () => Array.from({ length: 20 }, (_, index) => `v7-pl-${String(index + 1).padStart(2, '0')}`);
function fixtures(ids) {
  const matches=[]; let serial=0;
  for(let a=0;a<ids.length;a++)for(let b=a+1;b<ids.length;b++){
    matches.push({id:`v7-${++serial}-a`,played:true,homeClubId:ids[a],awayClubId:ids[b],homeGoals:1,awayGoals:0});
    matches.push({id:`v7-${++serial}-b`,played:true,homeClubId:ids[b],awayClubId:ids[a],homeGoals:0,awayGoals:1});
  }
  return [matches];
}
function table(ids, protectedId) {
  const ordered=[protectedId,...ids.filter(id=>id!==protectedId)];
  return ordered.map((clubId,index)=>({clubId,played:38,won:Math.max(1,29-index),drawn:3,lost:6+index,goalsFor:90-index,goalsAgainst:30+index,goalDifference:60-index*2,points:100-index*4}));
}
function dbFixture() {
  const ids=clubIds();
  const clubs=ids.map((id,index)=>({id,name:`V7 Premier Club ${index+1}`,shortName:`V7 ${index+1}`,providerName:`V7 Premier Club ${index+1}`,countryCode:'ENG',leagueId:'eng-premier-league',venue:`Ground ${index+1}`,reputation:7100-index*20,isPlaceholder:false}));
  const shape=[['GK','GK'],['DEF','DR'],['DEF','DC'],['DEF','DC'],['DEF','DL'],['MID','DMC'],['MID','MC'],['MID','AMC'],['ATT','AMR'],['ATT','ST'],['ATT','AML']];
  const players=clubs.flatMap((club,ci)=>shape.map(([positionGroup,primaryPosition],pi)=>({id:`${club.id}-p${pi+1}`,name:`${club.name} Player ${pi+1}`,clubId:club.id,positionGroup,primaryPosition,currentAbility:137+(20-ci)+(pi%3),potentialAbility:165,isPlaceholder:false})));
  return {clubs,players};
}
function careerFixture() {
  const ids=clubIds();
  return {version:2,id:'pyramid-v7-career',seed:'pyramid-v7-seed',managerName:'V7 Manager',clubId:ids[0],leagueId:'eng-premier-league',competitionId:'eng-premier-league',competitionName:'Premier League',season:'2026/27',status:'complete',roundIndex:38,fixtures:fixtures(ids),table:table(ids,ids[0]),seasonClubs:ids.map((id,index)=>({id,name:`V7 Premier Club ${index+1}`,strength:82-index*.4})),seasonClubIds:ids,seasonHistory:[],worldHistory:[],lowerLeagueHistory:[],worldMemberships:[],worldBoundaries:[],seasonEndDate:'2027-05-30',currentDate:'2027-05-30',lastMatch:{date:'2027-05-30'},calendar:{currentDate:'2027-05-30',fixturesReleased:true},preseason:{phase:'complete'},worldClock:{schemaVersion:2,season:'2026/27',acknowledgedMilestones:[],history:[],totalDaysAdvanced:300},tactics:{formation:'4-3-3',mentality:'Balanced',pressing:'Standard'},lineupIds:Array.from({length:11},(_,index)=>`${ids[0]}-p${index+1}`),playerStatus:{}};
}
function completeActiveSeason(career) {
  const ids=[...career.seasonClubIds];
  career.table=table(ids,career.clubId);
  career.fixtures=career.fixtures.map(round=>round.map(match=>({...match,played:true,homeGoals:1,awayGoals:0})));
  career.status='complete'; career.roundIndex=38; career.currentDate=career.seasonEndDate; career.calendar.currentDate=career.seasonEndDate; career.lastMatch={date:career.seasonEndDate};
  const result=finaliseSeason(career,{completedAt:`${career.seasonEndDate}T18:00:00.000Z`});
  assert.equal(result.status,'finalised');
  return result;
}

test('confirmed 2026/27 Step 4 constitution is eight unique 22-club divisions',()=>{
  assert.equal(STEP_FOUR_DIVISION_IDS.length,8);
  const all=[];
  for(const id of STEP_FOUR_DIVISION_IDS){
    assert.equal(STEP_FOUR_2026_27_MEMBERSHIPS[id].length,22);
    all.push(...STEP_FOUR_2026_27_MEMBERSHIPS[id].map(club=>club.id));
  }
  assert.equal(all.length,176);
  assert.equal(new Set(all).size,176);
  const names=STEP_FOUR_DIVISION_IDS.flatMap(id=>STEP_FOUR_2026_27_MEMBERSHIPS[id].map(club=>club.name));
  assert.ok(names.includes('Peacehaven & Telscombe'));
  assert.ok(!names.includes('Guernsey'));
});

test('each Step 4 division runs 462 matches with two promoted and four relegated',()=>{
  for(const id of STEP_FOUR_DIVISION_IDS){
    const outcome=simulateStepFourDivisionSeason({competitionId:id,season:'2026/27',clubs:STEP_FOUR_2026_27_MEMBERSHIPS[id],seed:'v7-step4-test'});
    assert.equal(outcome.status,'complete');
    assert.equal(outcome.clubCount,22);
    assert.equal(outcome.regularSeasonMatches,462);
    assert.equal(outcome.promotedClubIds.length,2);
    assert.equal(outcome.relegatedClubIds.length,4);
    assert.equal(outcome.playoffClubIds.length,4);
    assert.equal(outcome.playoffs.semiFinals.length,2);
    assert.ok(outcome.playoffs.final.hostClubId);
  }
});

test('Step 4 completes 2027/28 Step 3 membership and moves the honest boundary to Step 5',()=>{
  const career=careerFixture();
  const result=finaliseSeason(career,{completedAt:'2027-05-30T18:00:00.000Z'});
  assert.equal(Object.keys(result.stepFourDivisions).length,8);
  for(const division of Object.values(result.stepFourDivisions)) assert.equal(division.status,'finalised');

  const aggregate=career.worldMemberships.find(record=>record.key==='eng-national-league-step-three:2027/28');
  assert.ok(aggregate);
  assert.equal(aggregate.status,'complete');
  assert.equal(aggregate.clubCount,88);
  assert.equal(aggregate.promotedFromStepFourClubIds.length,16);
  assert.equal(aggregate.relegatedFromStepTwoClubIds.length,8);
  assert.equal(new Set(aggregate.clubs.map(club=>club.id)).size,88);

  for(const id of STEP_THREE_DIVISION_IDS){
    const membership=career.worldMemberships.find(record=>record.key===`${id}:2027/28`);
    assert.ok(membership);
    assert.equal(membership.status,'complete');
    assert.equal(membership.clubCount,22);
    assert.equal(new Set(membership.clubs.map(club=>club.id)).size,22);
  }

  const stepFive=career.worldMemberships.find(record=>record.key==='eng-national-league-step-four:2027/28');
  assert.ok(stepFive);
  assert.equal(stepFive.status,'incomplete-step-five-feeder');
  assert.equal(stepFive.clubCount,144);
  assert.equal(stepFive.targetClubCount,176);
  assert.equal(stepFive.missingPromotionSlots,32);
  assert.equal(stepFive.relegatedFromStepThreeClubIds.length,16);
  assert.equal(stepFive.relegatedToStepFiveClubIds.length,32);

  const boundary=career.worldBoundaries.find(record=>record.key==='english-pyramid:2027/28');
  assert.equal(boundary.status,'step-three-ready-step-five-boundary');
  assert.equal(boundary.stepThreeStatus,'complete');
  assert.equal(boundary.stepFourStatus,'incomplete-step-five-feeder');
});

test('derived 2027/28 Step 3 season completes 2028/29 National League North and South',()=>{
  const career=careerFixture(), db=dbFixture();
  finaliseSeason(career,{completedAt:'2027-05-30T18:00:00.000Z'});
  assert.equal(rolloverPremierLeagueSeason(career,{db}).status,'rolled-over');
  assert.equal(career.season,'2027/28');
  const result=completeActiveSeason(career);
  for(const division of Object.values(result.stepThreeDivisions)) assert.ok(['finalised','already-finalised'].includes(division.status));
  const aggregate=career.worldMemberships.find(record=>record.key==='eng-national-league-step-two:2028/29');
  const north=career.worldMemberships.find(record=>record.key==='eng-national-league-north:2028/29');
  const south=career.worldMemberships.find(record=>record.key==='eng-national-league-south:2028/29');
  assert.equal(aggregate.status,'complete');
  assert.equal(aggregate.clubCount,48);
  assert.equal(aggregate.promotedFromStepThreeClubIds.length,8);
  assert.equal(north.clubCount,24);
  assert.equal(south.clubCount,24);
});

test('Step 4 feeder unlocks a legitimate Premier League rollover into START 2033/34',()=>{
  const career=careerFixture(),db=dbFixture();
  finaliseSeason(career,{completedAt:'2027-05-30T18:00:00.000Z'});
  for(const expectedSeason of ['2027/28','2028/29','2029/30','2030/31','2031/32','2032/33']){
    assert.equal(rolloverPremierLeagueSeason(career,{db}).status,'rolled-over');
    assert.equal(career.season,expectedSeason);
    completeActiveSeason(career);
  }
  assert.equal(career.nextSeasonContext.promotedFromChampionshipClubIds.length,3);
  const validation=validatePremierLeagueRollover(career,db);
  assert.equal(validation.ok,true);
  assert.equal(validation.sourceSeason,'2032/33');
  assert.equal(validation.targetSeason,'2033/34');
  assert.equal(rolloverPremierLeagueSeason(career,{db}).status,'rolled-over');
  assert.equal(career.season,'2033/34');
  assert.equal(career.seasonClubIds.length,20);
  assert.equal(new Set(career.seasonClubIds).size,20);
});
