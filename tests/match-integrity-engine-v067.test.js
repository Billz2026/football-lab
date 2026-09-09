import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInteractiveMatch,
  advanceInteractiveMatch,
  makeSubstitution,
  substitutionRulesForFixture
} from '../matchday-engine-v069.js';
import { eligibleBenchIds, substitutionStatus, userMatchLineup } from '../matchday-substitution-state-v1.js';

const positions=['GK','DR','DC','DC','DL','MC','MC','AMC','AMR','ST','AML','DMC','ST','DC','MC','ST','DR','ML','MR','DC','GK','ST','MC','DL'];
const groups=['GK','DEF','DEF','DEF','DEF','MID','MID','MID','ATT','ATT','ATT','MID','ATT','DEF','MID','ATT','DEF','MID','MID','DEF','GK','ATT','MID','DEF'];
const clubs=[{id:'home',name:'Home FC',reputation:7000},{id:'away',name:'Away FC',reputation:7000}];
const players=clubs.flatMap((club,ci)=>positions.map((primaryPosition,index)=>({id:`${club.id}-${index}`,clubId:club.id,name:`${club.name} ${index}`,primaryPosition,positionGroup:groups[index],currentAbility:140-index+ci,isPlaceholder:false})));
const db={clubs,players};

function career(type='friendly'){
  const user=players.filter(player=>player.clubId==='home');
  return {id:`career-${type}`,version:1,clubId:'home',seed:`seed-${type}`,status:'active',roundIndex:0,competitionName:type==='friendly'?'Pre-Season Friendly':'Premier League',fixtures:[[{id:`fixture-${type}`,round:1,type,competitionName:type==='friendly'?'Pre-Season Friendly':'Premier League',homeClubId:'home',awayClubId:'away',played:false,events:[]}]],table:clubs.map(club=>({clubId:club.id,played:0,won:0,drawn:0,lost:0,goalsFor:0,goalsAgainst:0,goalDifference:0,points:0})),lineupIds:user.slice(0,11).map(player=>player.id),tactics:{formation:'4-3-3',mentality:'Balanced',pressing:'Standard'},playerStatus:Object.fromEntries(user.map(player=>[player.id,{condition:90,sharpness:80,morale:'Good'}]))};
}

function makeNextSub(state,c,number,minute=state.minute){
  state={...state,minute};
  const side=state.userClubId===state.homeClubId?'home':'away';
  const lineup=side==='home'?state.homeLineupIds:state.awayLineupIds;
  const outId=lineup.find(id=>db.players.find(player=>player.id===id)?.positionGroup!=='GK'&&!state.subbedOffIds.includes(id));
  const inId=state.userBenchIds.find(id=>!lineup.includes(id)&&!state.subbedOffIds.includes(id));
  assert.ok(outId,`out player ${number}`);assert.ok(inId,`bench player ${number}`);
  return {state:makeSubstitution(state,outId,inId,db,c).state,outId,inId};
}

test('rule contract exposes real-life Football Lab matchday limits',()=>{
  assert.deepEqual(substitutionRulesForFixture({type:'friendly'}),{
    kind:'friendly',benchLimit:null,maxSubstitutions:11,maxInPlayWindows:null,halfTimeUsesWindow:false,reentryAllowed:false
  });
  assert.deepEqual(substitutionRulesForFixture({type:'league',competitionName:'Premier League'}),{
    kind:'competitive',benchLimit:9,maxSubstitutions:5,maxInPlayWindows:3,halfTimeUsesWindow:false,reentryAllowed:false
  });
});

test('pre-season friendly exposes the full available bench and can replace all eleven starters',()=>{
  const c=career('friendly');let state=createInteractiveMatch(c,db);
  const originalXI=[...state.homeLineupIds];
  assert.equal(state.substitutionLimit,11);
  assert.equal(state.substitutionWindowLimit,null);
  assert.equal(state.userBenchIds.length,positions.length-11);

  for(let i=0;i<originalXI.length;i+=1){
    const outId=originalXI[i];
    const out=players.find(player=>player.id===outId);
    const lineup=state.homeLineupIds;
    const inId=state.userBenchIds.find(id=>{
      if(lineup.includes(id)||state.subbedOffIds.includes(id))return false;
      const incoming=players.find(player=>player.id===id);
      return out?.positionGroup==='GK' ? incoming?.positionGroup==='GK' : incoming?.positionGroup!=='GK';
    });
    assert.ok(inId,`replacement for starter ${i+1}`);
    state={...state,minute:10+i};
    state=makeSubstitution(state,outId,inId,db,c).state;
  }

  assert.equal(state.substitutions.length,11);
  assert.equal(originalXI.some(id=>state.homeLineupIds.includes(id)),false);
  assert.throws(()=>makeNextSub(state,c,12,30),/used all 11 substitutions/i);
});

test('a substituted-off player cannot re-enter a friendly',()=>{
  const c=career('friendly');let state=createInteractiveMatch(c,db);
  const first=makeNextSub(state,c,1,20);state=first.state;
  const currentLineup=state.homeLineupIds;
  const currentPlayer=currentLineup.find(id=>id!==first.inId&&db.players.find(player=>player.id===id)?.positionGroup!=='GK');
  assert.throws(()=>makeSubstitution(state,currentPlayer,first.outId,db,c),/cannot return/i);
});

test('Premier League matchday bench is nine and no more than five players may enter',()=>{
  const c=career('league');let state=createInteractiveMatch(c,db);
  assert.equal(state.userBenchIds.length,9);
  assert.equal(state.substitutionLimit,5);
  state=makeNextSub(state,c,1,20).state;
  state=makeNextSub(state,c,2,20).state;
  state=makeNextSub(state,c,3,45).state;
  state=makeNextSub(state,c,4,60).state;
  state=makeNextSub(state,c,5,60).state;
  assert.equal(state.substitutions.length,5);
  assert.deepEqual(state.substitutionWindowMinutes,[20,60]);
  assert.throws(()=>makeNextSub(state,c,6,75),/used all five substitutions|used all 5 substitutions/i);
});

test('Premier League allows only three in-play substitution windows while same-minute changes share a window',()=>{
  const c=career('league');let state=createInteractiveMatch(c,db);
  state=makeNextSub(state,c,1,20).state;
  state=makeNextSub(state,c,2,20).state;
  state=makeNextSub(state,c,3,55).state;
  state=makeNextSub(state,c,4,70).state;
  assert.deepEqual(state.substitutionWindowMinutes,[20,55,70]);
  assert.throws(()=>makeNextSub(state,c,5,80),/all three in-play substitution windows/i);
});

test('half-time substitutions do not consume a Premier League substitution window',()=>{
  const c=career('league');let state=createInteractiveMatch(c,db);
  state=makeNextSub(state,c,1,30).state;
  state=makeNextSub(state,c,2,45).state;
  state=makeNextSub(state,c,3,60).state;
  assert.deepEqual(state.substitutionWindowMinutes,[30,60]);
});

for (const side of ['home', 'away']) {
  test(`injured ${side} player can be replaced and engine snapshot remains consistent on resume`, () => {
    const c = career('friendly');
    c.fixtures[0][0].id += `-injury-${side}`;
    if (side === 'away') Object.assign(c.fixtures[0][0], { homeClubId: 'away', awayClubId: 'home' });
    const previousWindow = globalThis.window;
    globalThis.window = { dispatchEvent() {} };
    try {
      let state = createInteractiveMatch(c, db);
      const registered = [...state.userBenchIds];
      const outId = userMatchLineup(state).find(id => players.find(p => p.id === id).positionGroup !== 'GK');
      const slot = state.userShape.assignments.find(a => a.playerId === outId).slotId;
      state.minute = 5;
      state.injuredIds.push(outId);
      state.conditions[outId] = 38;
      const availability = substitutionStatus(state, db, outId);
      assert.equal(availability.canSubstitute, true);
      const inId = availability.replacementIds[0];
      state = makeSubstitution(state, outId, inId, db, c).state;
      assert.equal(userMatchLineup(state).length, 11);
      assert.ok(userMatchLineup(state).includes(inId));
      assert.ok(!userMatchLineup(state).includes(outId));
      assert.equal(state.userShape.assignments.find(a => a.playerId === inId).slotId, slot);
      assert.deepEqual(state.userBenchIds, registered);
      assert.ok(!eligibleBenchIds(state, db).includes(inId));
      assert.ok(!eligibleBenchIds(state, db).includes(outId));
      let snapshot = globalThis.window.__flmLiveStateV332;
      for (const key of ['userBenchIds', 'substitutions', 'injuredIds', 'subbedOffIds', 'sentOffIds', 'substitutionWindowMinutes']) {
        assert.deepEqual(snapshot[key], state[key]);
        assert.notEqual(snapshot[key], state[key]);
      }
      assert.equal(snapshot.substitutionLimit, 11);
      assert.equal(snapshot.substitutionWindowLimit, null);
      state = advanceInteractiveMatch(state, c, db).state;
      snapshot = globalThis.window.__flmLiveStateV332;
      assert.equal(state.minute, 6);
      assert.ok(userMatchLineup(snapshot).includes(inId));
      assert.equal(snapshot.events.filter(e => e.type === 'substitution' && e.playerId === inId).length, 1);
      assert.equal(snapshot.substitutions.length, 1);
    } finally {
      if (previousWindow === undefined) delete globalThis.window;
      else globalThis.window = previousWindow;
    }
  });
}

test('eligibility excludes reserves, substituted players, injuries and dismissals', () => {
  const c = career('league');
  const state = createInteractiveMatch(c, db);
  const registered = [...state.userBenchIds];
  state.injuredIds = [registered[0]];
  state.sentOffIds = [registered[1]];
  state.subbedOffIds = [registered[2]];
  const available = eligibleBenchIds(state, db);
  assert.deepEqual(available, registered.slice(3));
  const outId = state.homeLineupIds[1];
  const reserve = players.find(p => p.clubId === c.clubId && !state.homeLineupIds.includes(p.id) && !registered.includes(p.id));
  for (const inId of [registered[0], registered[1], reserve.id]) {
    assert.throws(() => makeSubstitution(state, outId, inId, db, c), /eligible player from your matchday bench/);
  }
  state.userBenchIds = [];
  assert.deepEqual(eligibleBenchIds(state, db), []);
  assert.match(substitutionStatus(state, db, outId).reason, /No eligible substitutes/);
});

test('the same availability rules describe limits, windows, half-time and goalkeeper requirements', () => {
  const state = createInteractiveMatch(career('league'), db);
  const outId = state.homeLineupIds[1];
  state.minute = 80;
  state.substitutionWindowMinutes = [20, 55, 70];
  assert.match(substitutionStatus(state, db, outId).reason, /three in-play substitution windows/);
  state.minute = 45;
  assert.equal(substitutionStatus(state, db, outId).canSubstitute, true);
  state.substitutions = Array.from({ length: 5 }, () => ({}));
  assert.match(substitutionStatus(state, db, outId).reason, /all 5 substitutions/);
  state.substitutions = [];
  state.userBenchIds = state.userBenchIds.filter(id => players.find(p => p.id === id).positionGroup !== 'GK');
  const keeper = state.homeLineupIds.find(id => players.find(p => p.id === id).positionGroup === 'GK');
  assert.match(substitutionStatus(state, db, keeper).reason, /goalkeeper replacement/);
  state.minute = 90;
  assert.match(substitutionStatus(state, db, outId).reason, /already over/);
});

test('friendly bench registration does not admit newly added reserve players mid-match', () => {
  const c = career('friendly');
  let state = createInteractiveMatch(c, db);
  const before = [...state.userBenchIds];
  const expanded = { ...db, players: [...players, { ...players[12], id: 'late-arrival' }] };
  state = advanceInteractiveMatch(state, c, expanded).state;
  assert.deepEqual(state.userBenchIds, before);
  assert.ok(!eligibleBenchIds(state, expanded).includes('late-arrival'));
});
