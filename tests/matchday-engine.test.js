import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FORMATION_LAYOUTS,
  MAX_SUBSTITUTIONS,
  advanceInteractiveMatch,
  assignPlayersToFormation,
  changeTactics,
  completeInteractiveRound,
  createInteractiveMatch,
  getUserShape,
  makeSubstitution,
  setPlayerRole,
  swapShapePlayers
} from '../matchday-engine-v043.js';

const groups = ['GK','DEF','DEF','DEF','DEF','MID','MID','MID','ATT','ATT','ATT','MID','ATT','DEF','MID','ATT','DEF','MID'];
const positions = ['GK','DR','DC','DC','DL','MC','MC','AMC','AMR','ST','AML','DMC','ST','DC','MC','ST','DR','ML'];
const clubs = Array.from({length:8},(_,index)=>({id:`club-${index+1}`,name:`Club ${index+1}`,reputation:7000+index*60,isPlaceholder:false}));
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
function career(){
  const userPlayers=players.filter(p=>p.clubId===clubs[0].id);
  return {version:1,clubId:clubs[0].id,seed:'v043-shape-test',status:'active',roundIndex:0,fixtures:fixtures(),table:clubs.map(c=>({clubId:c.id,played:0,won:0,drawn:0,lost:0,goalsFor:0,goalsAgainst:0,goalDifference:0,points:0})),lineupIds:userPlayers.slice(0,11).map(p=>p.id),tactics:{formation:'4-3-3',mentality:'Balanced',pressing:'Standard'},playerStatus:Object.fromEntries(userPlayers.map(p=>[p.id,{condition:100,sharpness:88,morale:'Good',appearances:0,goals:0}]))};
}

test('all supported formations define eleven real positional slots',()=>{
  for(const [formation,slots] of Object.entries(FORMATION_LAYOUTS)){
    assert.equal(slots.length,11,formation);
    assert.equal(new Set(slots.map(s=>s.id)).size,11,formation);
    assert.ok(slots.some(s=>s.family==='GK'),formation);
  }
});

test('formation assignment maps eleven unique players into tactical slots',()=>{
  const c=career();
  const shape=assignPlayersToFormation(c.lineupIds,'4-2-3-1',db);
  assert.equal(shape.assignments.length,11);
  assert.equal(new Set(shape.assignments.map(a=>a.playerId)).size,11);
  assert.equal(shape.formation,'4-2-3-1');
  assert.ok(shape.assignments.every(a=>a.role));
});

test('changing formation rebuilds the live positional shape and roles can be edited',()=>{
  const c=career(); let state=createInteractiveMatch(c,db);
  const changed=changeTactics(state,{formation:'5-3-2',mentality:'Defensive'},c,db);
  state=changed.state;
  const shape=getUserShape(state,c,db);
  assert.equal(shape.formation,'5-3-2');
  assert.ok(shape.slots.some(s=>s.id==='RWB'));
  assert.ok(shape.slots.some(s=>s.id==='LCB'));
  const striker=shape.slots.find(s=>s.family==='ST');
  const role=setPlayerRole(state,striker.id,'Target Man',c,db);
  state=role.state;
  assert.equal(getUserShape(state,c,db).assignments.find(a=>a.slotId===striker.id).role,'Target Man');
});

test('positional swaps and substitutions keep the live shape valid',()=>{
  const c=career(); let state=createInteractiveMatch(c,db);
  const shape=getUserShape(state,c,db);
  const cmSlots=shape.slots.filter(s=>['CM','DM'].includes(s.family));
  state=swapShapePlayers(state,cmSlots[0].id,cmSlots[1].id,c,db).state;
  assert.equal(new Set(getUserShape(state,c,db).assignments.map(a=>a.playerId)).size,11);
  const lineup=state.userClubId===state.homeClubId?state.homeLineupIds:state.awayLineupIds;
  const result=makeSubstitution(state,lineup.at(-1),state.userBenchIds[0],db,c);
  state=result.state;
  assert.equal(state.substitutions.length,1);
  assert.equal(MAX_SUBSTITUTIONS,5);
  assert.ok(getUserShape(state,c,db).assignments.some(a=>a.playerId===state.userBenchIds[0]));
});

test('full-time career persists tactical setup for the next match',()=>{
  const c=career(); let state=createInteractiveMatch(c,db);
  state=changeTactics(state,{formation:'3-5-2',mentality:'Attacking'},c,db).state;
  const st=getUserShape(state,c,db).slots.find(s=>s.family==='ST');
  state=setPlayerRole(state,st.id,'Poacher',c,db).state;
  while(state.minute<90) state=advanceInteractiveMatch(state,c,db).state;
  const finished=completeInteractiveRound(c,state,db);
  assert.equal(finished.roundIndex,1);
  assert.equal(finished.tacticalSetup.formation,'3-5-2');
  assert.ok(finished.tacticalSetup.assignments.some(a=>a.role==='Poacher'));
  assert.equal(finished.lastMatch.tacticalSetup.formation,'3-5-2');
  assert.ok(finished.lastMatch.commentaryHistory.length>=finished.lastMatch.events.length);
});
