import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STRUCTURED_FLOW_TYPES,
  STRUCTURED_FLOW_VERSION,
  advanceInteractiveMatch as flowAdvance,
  createInteractiveMatch as flowCreate,
  deriveStructuredFlowFacts
} from '../matchday-structured-flow-v1.js';
import {
  advanceInteractiveMatch as attackAdvance,
  createInteractiveMatch as attackCreate
} from '../matchday-structured-attacks-v1.js';
import {
  AUTHORITATIVE_FLOW_COMMENTARY_VERSION,
  createAuthoritativeFlowMemory,
  renderAuthoritativeFlowLines
} from '../commentary-authoritative-flow-v3.js';

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

function career(seed='structured-flow-v1'){
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
    stats:result.state.stats,
    substitutions:result.state.substitutions,
    sentOffIds:result.state.sentOffIds,
    injuredIds:result.state.injuredIds
  };
}

test('structured defensive flow preserves the calibrated structured-attack match result',()=>{
  const c=career('flow-preserves-match-seed');
  const attacks=run(attackCreate,attackAdvance,c);
  const flow=run(flowCreate,flowAdvance,c);
  assert.deepEqual(digest(flow),digest(attacks));
  assert.equal(flow.state.structuredFlowVersion,STRUCTURED_FLOW_VERSION);
});

test('non-shot match events gain deterministic football flow facts and three phases',()=>{
  const seeds=['flow-coverage-a','flow-coverage-b','flow-coverage-c'];
  const all=[];
  for(const seed of seeds){
    const first=run(flowCreate,flowAdvance,career(seed));
    const second=run(flowCreate,flowAdvance,career(seed));
    const firstFlow=first.events.filter(event=>event.flow?.sequenceId);
    const secondFlow=second.events.filter(event=>event.flow?.sequenceId);
    assert.ok(firstFlow.length>8,`expected non-shot flow coverage for ${seed}`);
    assert.deepEqual(
      firstFlow.map(event=>({minute:event.minute,type:event.type,flow:event.flow,lines:event.lines})),
      secondFlow.map(event=>({minute:event.minute,type:event.type,flow:event.flow,lines:event.lines}))
    );
    for(const event of firstFlow){
      assert.equal(event.flow.version,STRUCTURED_FLOW_VERSION);
      assert.ok(STRUCTURED_FLOW_TYPES.includes(event.flow.subtype));
      assert.deepEqual(event.flow.beats.map(beat=>beat.phase),['development','duel','resolution']);
      assert.ok(event.flow.attackingClubId);
      assert.ok(event.flow.defendingClubId);
      assert.equal(event.lines.length,3);
      assert.doesNotMatch(event.lines.join(' '),/move it from side to side|danger passes|gets down the flank and crosses early|closes down aggressively and forces the hurried pass/i);
    }
    all.push(...firstFlow);
  }
  assert.ok(new Set(all.map(event=>event.flow.subtype)).size>=7,'expected broad defensive-flow variety across deterministic matches');
});

test('flow memory tags repeated defensive resistance instead of treating every event in isolation',()=>{
  const state={
    seed:'flow-memory-seed',fixtureId:'memory-fixture',minute:82,
    homeClubId:'club-1',awayClubId:'club-2',
    homeLineupIds:players.filter(p=>p.clubId==='club-1').slice(0,11).map(p=>p.id),
    awayLineupIds:players.filter(p=>p.clubId==='club-2').slice(0,11).map(p=>p.id),
    homeGoals:0,awayGoals:1
  };
  const event={minute:82,type:'commentary',clubId:'club-1',playerId:null,lines:['Club 1 recycle possession patiently.']};
  const initial=deriveStructuredFlowFacts(state,event,db,4,{defenderActions:{},teamBreakdowns:{},history:[]});
  assert.ok(initial?.defenderId);
  const memory={
    defenderActions:{[initial.defenderId]:2},
    teamBreakdowns:{[initial.attackingClubId]:3},
    history:[
      {minute:77,attackingClubId:initial.attackingClubId,defenderId:initial.defenderId,subtype:'interception'},
      {minute:80,attackingClubId:initial.attackingClubId,defenderId:initial.defenderId,subtype:'standing_tackle'}
    ]
  };
  const repeated=deriveStructuredFlowFacts(state,event,db,4,memory);
  assert.ok(repeated.contextTags.includes('repeat-defender'));
  assert.ok(repeated.contextTags.includes('attack-frustration'));
  assert.ok(repeated.contextTags.includes('pressure-resisted'));
  assert.ok(repeated.contextTags.includes('chasing-game'));
});

test('authoritative V3 renderer describes the actual defensive duel with named players',()=>{
  const event={
    minute:71,
    type:'commentary',
    clubId:'club-1',
    flow:{
      version:STRUCTURED_FLOW_VERSION,
      sequenceId:'flow-render-1',
      category:'broken_attack',
      action:'interception',
      subtype:'interception',
      attackingClubId:'club-1',
      defendingClubId:'club-2',
      possessionClubId:'club-2',
      attackerId:'club-1-player-10',
      creatorId:'club-1-player-7',
      defenderId:'club-2-player-3',
      keeperId:'club-2-player-1',
      side:'centre',
      zone:'final_third',
      pressure:'medium',
      outcome:'attack_stopped',
      contextTags:['repeat-defender','attack-frustration'],
      beats:[{phase:'development'},{phase:'duel'},{phase:'resolution'}]
    }
  };
  const lines=renderAuthoritativeFlowLines({event,db,snapshot:{events:[event]},memory:createAuthoritativeFlowMemory()});
  const text=lines.join(' ');
  assert.equal(AUTHORITATIVE_FLOW_COMMENTARY_VERSION,'3.0.0');
  assert.equal(lines.length,3);
  assert.match(text,/Club 1 Player 10/);
  assert.match(text,/Club 1 Player 7/);
  assert.match(text,/Club 2 Player 3/);
  assert.match(text,/intercept|cuts the ball out|pass|lane|reads/i);
  assert.match(text,/again|increasingly difficult/i);
  assert.doesNotMatch(text,/danger passes|gets the shot away|move it from side to side/i);
});

test('goalkeeper claims and offside traps are football-specific rather than generic dead ends',()=>{
  const memory=createAuthoritativeFlowMemory();
  const keeperEvent={
    minute:33,type:'commentary',clubId:'club-1',
    flow:{version:STRUCTURED_FLOW_VERSION,sequenceId:'claim-1',subtype:'keeper_claim',attackingClubId:'club-1',defendingClubId:'club-2',possessionClubId:'club-2',attackerId:'club-1-player-9',creatorId:'club-1-player-7',defenderId:'club-2-player-3',keeperId:'club-2-player-1',side:'right',zone:'penalty_area',pressure:'medium',outcome:'keeper_possession',contextTags:[],beats:[{phase:'development'},{phase:'duel'},{phase:'resolution'}]}
  };
  const offsideEvent={
    minute:41,type:'offside',clubId:'club-1',
    flow:{version:STRUCTURED_FLOW_VERSION,sequenceId:'offside-1',subtype:'offside_trap',attackingClubId:'club-1',defendingClubId:'club-2',possessionClubId:'club-2',attackerId:'club-1-player-10',creatorId:'club-1-player-7',defenderId:'club-2-player-3',keeperId:'club-2-player-1',side:'centre',zone:'final_third',pressure:'low',outcome:'offside',contextTags:[],beats:[{phase:'development'},{phase:'duel'},{phase:'resolution'}]}
  };
  const claim=renderAuthoritativeFlowLines({event:keeperEvent,db,memory});
  const offside=renderAuthoritativeFlowLines({event:offsideEvent,db,memory});
  assert.match(claim.join(' '),/Club 2 Player 1/);
  assert.match(claim.join(' '),/claims|gathers|hands|area/i);
  assert.match(offside.join(' '),/Club 1 Player 10/);
  assert.match(offside.join(' '),/flag|offside|line/i);
});
