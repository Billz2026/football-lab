import test from 'node:test';
import assert from 'node:assert/strict';
import { createInteractiveMatch, makeSubstitution } from '../matchday-engine-v0431.js';

const positions=['GK','DR','DC','DC','DL','MC','MC','AMC','AMR','ST','AML','DMC','ST','DC','MC','ST','DR','ML','MR','DC'];
const groups=['GK','DEF','DEF','DEF','DEF','MID','MID','MID','ATT','ATT','ATT','MID','ATT','DEF','MID','ATT','DEF','MID','MID','DEF'];
const clubs=[{id:'home',name:'Home FC',reputation:7000},{id:'away',name:'Away FC',reputation:7000}];
const players=clubs.flatMap((club,ci)=>positions.map((primaryPosition,index)=>({id:`${club.id}-${index}`,clubId:club.id,name:`${club.name} ${index}`,primaryPosition,positionGroup:groups[index],currentAbility:130-index+ci,isPlaceholder:false})));
const db={clubs,players};

function career(type='friendly'){
  const user=players.filter(player=>player.clubId==='home');
  return {id:`career-${type}`,version:1,clubId:'home',seed:`seed-${type}`,status:'active',roundIndex:0,competitionName:type==='friendly'?'Pre-Season Friendly':'Premier League',fixtures:[[{id:`fixture-${type}`,round:1,type,homeClubId:'home',awayClubId:'away',played:false,events:[]}]],table:clubs.map(club=>({clubId:club.id,played:0,won:0,drawn:0,lost:0,goalsFor:0,goalsAgainst:0,goalDifference:0,points:0})),lineupIds:user.slice(0,11).map(player=>player.id),tactics:{formation:'4-3-3',mentality:'Balanced',pressing:'Standard'},playerStatus:Object.fromEntries(user.map(player=>[player.id,{condition:90,sharpness:80,morale:'Good'}]))};
}

function makeNextSub(state,c,number){
  const side=state.userClubId===state.homeClubId?'home':'away';
  const lineup=side==='home'?state.homeLineupIds:state.awayLineupIds;
  const outId=lineup.find(id=>db.players.find(player=>player.id===id)?.positionGroup!=='GK'&&!state.subbedOffIds.includes(id));
  const inId=state.userBenchIds.find(id=>!lineup.includes(id)&&!state.subbedOffIds.includes(id));
  assert.ok(outId,`out player ${number}`);assert.ok(inId,`bench player ${number}`);
  return makeSubstitution(state,outId,inId,db,c).state;
}

test('pre-season friendlies allow a sixth substitution and expose a nine-sub limit',()=>{
  const c=career('friendly');let state=createInteractiveMatch(c,db);
  assert.equal(state.substitutionLimit,9);
  for(let i=1;i<=6;i+=1)state=makeNextSub(state,c,i);
  assert.equal(state.substitutions.length,6);
});

test('competitive matches still stop after five substitutions',()=>{
  const c=career('league');let state=createInteractiveMatch(c,db);
  assert.equal(state.substitutionLimit,5);
  for(let i=1;i<=5;i+=1)state=makeNextSub(state,c,i);
  assert.equal(state.substitutions.length,5);
  assert.throws(()=>makeNextSub(state,c,6),/used all five substitutions|used all 5 substitutions/i);
});
