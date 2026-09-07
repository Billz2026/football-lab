import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STRUCTURED_ATTACK_VERSION,
  STRUCTURED_XG_MODEL,
  advanceInteractiveMatch as structuredAdvance,
  createInteractiveMatch as structuredCreate,
  deriveStructuredAttackFacts,
  structuredXgFor
} from '../matchday-structured-attacks-v1.js';
import {
  advanceInteractiveMatch as legacyAdvance,
  createInteractiveMatch as legacyCreate
} from '../matchday-engine-v0431.js';

const groups = ['GK','DEF','DEF','DEF','DEF','MID','MID','MID','ATT','ATT','ATT','MID','ATT','DEF','MID','ATT','DEF','MID'];
const positions = ['GK','DR','DC','DC','DL','MC','MC','AMC','AMR','ST','AML','DMC','ST','DC','MC','ST','DR','ML'];
const clubs = Array.from({length:8},(_,index)=>({id:`club-${index+1}`,name:`Club ${index+1}`,shortName:`C${index+1}`,reputation:7000+index*60,isPlaceholder:false}));
const players = clubs.flatMap((club,clubIndex)=>groups.map((group,playerIndex)=>({
  id:`${club.id}-player-${playerIndex+1}`,
  clubId:club.id,
  name:`${club.name} Player ${playerIndex+1}`,
  positionGroup:group,
  primaryPosition:positions[playerIndex],
  currentAbility:110+clubIndex*2+playerIndex,
  isPlaceholder:false
})));
const db={clubs,players};

function fixtures(){
  const ids=clubs.map(c=>c.id); let rotation=[...ids]; const rounds=[];
  for(let r=0;r<ids.length-1;r+=1){
    const round=[];
    for(let p=0;p<rotation.length/2;p+=1){
      round.push({id:`r${r+1}-m${p+1}`,round:r+1,homeClubId:rotation[p],awayClubId:rotation[rotation.length-1-p],played:false,homeGoals:null,awayGoals:null,events:[]});
    }
    rounds.push(round); rotation=[rotation[0],rotation.at(-1),...rotation.slice(1,-1)];
  }
  return rounds;
}

function career(seed='structured-attacks-v1'){
  const userPlayers=players.filter(p=>p.clubId===clubs[0].id);
  return {
    version:1,
    clubId:clubs[0].id,
    seed,
    status:'active',
    roundIndex:0,
    fixtures:fixtures(),
    table:clubs.map(c=>({clubId:c.id,played:0,won:0,drawn:0,lost:0,goalsFor:0,goalsAgainst:0,goalDifference:0,points:0})),
    lineupIds:userPlayers.slice(0,11).map(p=>p.id),
    tactics:{formation:'4-3-3',mentality:'Balanced',pressing:'Standard'},
    playerStatus:Object.fromEntries(userPlayers.map(p=>[p.id,{condition:100,sharpness:88,morale:'Good',appearances:0,goals:0}]))
  };
}

function run(create,advance,c){
  let state=create(c,db);
  const events=[];
  while(state.minute<90){
    const step=advance(state,c,db);
    state=step.state;
    events.push(...step.events);
  }
  return {state,events};
}

function digest(result){
  return {
    score:[result.state.homeGoals,result.state.awayGoals],
    shots:[result.state.stats.home.shots,result.state.stats.away.shots],
    onTarget:[result.state.stats.home.onTarget,result.state.stats.away.onTarget],
    corners:[result.state.stats.home.corners,result.state.stats.away.corners]
  };
}

test('structured attack facts are deterministic and contain canonical football fields',()=>{
  const state={seed:'facts-seed',fixtureId:'f-1',minute:67,homeClubId:'club-1',awayClubId:'club-2',homeLineupIds:players.filter(p=>p.clubId==='club-1').slice(0,11).map(p=>p.id),awayLineupIds:players.filter(p=>p.clubId==='club-2').slice(0,11).map(p=>p.id),homeGoals:1,awayGoals:0};
  const event={minute:67,type:'save',clubId:'club-1',playerId:'club-1-player-10',assistPlayerId:'club-1-player-8',xg:.34};
  const first=deriveStructuredAttackFacts(state,event,db,0);
  const second=deriveStructuredAttackFacts(state,event,db,0);
  assert.deepEqual(first,second);
  assert.equal(first.version,STRUCTURED_ATTACK_VERSION);
  assert.equal(first.action,'shot');
  assert.equal(first.phase,'outcome');
  assert.ok(['placed','drive','first_time','header','volley','chip','long_range_drive','curler'].includes(first.subtype));
  assert.ok(['none','low','medium','high'].includes(first.pressure));
  assert.ok(Number.isFinite(first.distance));
  assert.ok(Number.isFinite(first.xg));
  assert.equal(first.beats.length,4);
  assert.deepEqual(first.beats.map(beat=>beat.phase),['buildup','penetration','attempt','outcome']);
});

test('structured xG responds to actual shot context instead of commentary wording',()=>{
  const closeCentral=structuredXgFor({distance:7,angle:'central',pressure:'low',subtype:'placed'});
  const distantPressed=structuredXgFor({distance:27,angle:'wide_right',pressure:'high',subtype:'long_range_drive'});
  assert.ok(closeCentral>=0.30);
  assert.ok(distantPressed<=0.06);
  assert.ok(closeCentral>distantPressed*5);
  assert.equal(STRUCTURED_XG_MODEL.method,'structured-shot-context');
});

test('structured attack layer preserves calibrated match outcomes',()=>{
  const c=career('preserve-results-seed');
  const legacy=run(legacyCreate,legacyAdvance,c);
  const structured=run(structuredCreate,structuredAdvance,c);
  assert.deepEqual(digest(structured),digest(legacy));
});

test('every generated shot outcome carries a deterministic four-beat attack sequence',()=>{
  const c=career('full-match-structured-seed');
  const first=run(structuredCreate,structuredAdvance,c);
  const second=run(structuredCreate,structuredAdvance,c);
  const shotTypes=new Set(['goal','save','woodwork','miss']);
  const shots=first.events.filter(event=>shotTypes.has(event.type));
  assert.ok(shots.length>0,'expected at least one shot event in the deterministic match');
  for(const event of shots){
    assert.equal(event.attack?.version,STRUCTURED_ATTACK_VERSION);
    assert.equal(event.action,'shot');
    assert.equal(event.attack?.beats?.length,4);
    assert.ok(event.sequenceId);
    assert.equal(event.xg,event.attack.xg);
    assert.ok(event.lines.length>=4);
    assert.ok(!/gets the shot away/i.test(event.lines.join(' ')),'generic legacy shot sentence should have been replaced');
  }
  const firstDigest=shots.map(event=>({type:event.type,minute:event.minute,sequenceId:event.sequenceId,attack:event.attack,lines:event.lines}));
  const secondDigest=second.events.filter(event=>shotTypes.has(event.type)).map(event=>({type:event.type,minute:event.minute,sequenceId:event.sequenceId,attack:event.attack,lines:event.lines}));
  assert.deepEqual(firstDigest,secondDigest);
  assert.equal(first.state.xgModel.method,'structured-shot-context');
});
