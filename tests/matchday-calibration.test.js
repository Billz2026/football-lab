import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceInteractiveMatch,
  createInteractiveMatch
} from '../matchday-engine-v0431.js';

const RUNS = Math.max(24, Number.parseInt(process.env.MATCH_CALIBRATION_RUNS || '64', 10) || 64);
const GROUPS = ['GK','DEF','DEF','DEF','DEF','MID','MID','MID','ATT','ATT','ATT','MID','ATT','DEF','MID','ATT','DEF','MID'];
const POSITIONS = ['GK','DR','DC','DC','DL','MC','MC','AMC','AMR','ST','AML','DMC','ST','DC','MC','ST','DR','ML'];

const BALANCED = Object.freeze({
  formation:'4-3-3', mentality:'Balanced', pressing:'Standard', tempo:'Standard',
  passing:'Mixed', width:'Balanced', defensiveLine:'Standard'
});
const ALL_OUT = Object.freeze({
  formation:'3-4-3', mentality:'Attacking', pressing:'High', tempo:'High',
  passing:'Direct', width:'Wide', defensiveLine:'High'
});
const LOW_BLOCK = Object.freeze({
  formation:'5-3-2', mentality:'Defensive', pressing:'Low', tempo:'Slow',
  passing:'Mixed', width:'Narrow', defensiveLine:'Low'
});

function round(value, places = 3) {
  const factor = 10 ** places;
  return Math.round(value * factor) / factor;
}

function buildDb(userAbility = 116, opponentAbility = 116) {
  const clubs = [
    {id:'cal-user', name:'Calibration United', shortName:'CAL', reputation:7000, isPlaceholder:false},
    {id:'cal-opp', name:'Control City', shortName:'CTL', reputation:7000, isPlaceholder:false}
  ];
  const players = clubs.flatMap((club, clubIndex) => GROUPS.map((positionGroup, playerIndex) => ({
    id:`${club.id}-p${playerIndex + 1}`,
    clubId:club.id,
    name:`${club.shortName} Player ${playerIndex + 1}`,
    positionGroup,
    primaryPosition:POSITIONS[playerIndex],
    currentAbility:clubIndex === 0 ? userAbility : opponentAbility,
    isPlaceholder:false
  })));
  return {clubs, players};
}

function buildCareer({db, seed, tactics = BALANCED, userHome = true}) {
  const userClubId = 'cal-user';
  const opponentClubId = 'cal-opp';
  const userPlayers = db.players.filter(player => player.clubId === userClubId);
  const fixture = {
    id:`cal-${seed}`,
    round:1,
    homeClubId:userHome ? userClubId : opponentClubId,
    awayClubId:userHome ? opponentClubId : userClubId,
    played:false,
    homeGoals:null,
    awayGoals:null,
    events:[]
  };
  return {
    version:1,
    clubId:userClubId,
    seed:String(seed),
    status:'active',
    roundIndex:0,
    fixtures:[[fixture]],
    table:db.clubs.map(club => ({clubId:club.id,played:0,won:0,drawn:0,lost:0,goalsFor:0,goalsAgainst:0,goalDifference:0,points:0})),
    lineupIds:userPlayers.slice(0,11).map(player => player.id),
    tactics:{...tactics},
    playerStatus:Object.fromEntries(userPlayers.map(player => [player.id,{condition:100,sharpness:88,morale:'Good',appearances:0,goals:0}])),
    preseason:{tacticalFamiliarity:90}
  };
}

function validateFinishedState(state) {
  assert.equal(state.minute, 90, 'every calibration match must reach 90 minutes');
  assert.equal(new Set(state.homeLineupIds).size, state.homeLineupIds.length, 'home XI cannot contain duplicate players');
  assert.equal(new Set(state.awayLineupIds).size, state.awayLineupIds.length, 'away XI cannot contain duplicate players');
  assert.equal(new Set(state.sentOffIds || []).size, (state.sentOffIds || []).length, 'a player cannot be sent off twice');

  for (const sentOffId of state.sentOffIds || []) {
    assert.ok(!state.homeLineupIds.includes(sentOffId) && !state.awayLineupIds.includes(sentOffId), 'sent-off players must leave the pitch');
  }

  for (const side of ['home','away']) {
    const stats = state.stats[side];
    assert.ok(Number.isFinite(stats.shots) && stats.shots >= 0, `${side} shots must be valid`);
    assert.ok(Number.isFinite(stats.onTarget) && stats.onTarget >= 0, `${side} shots on target must be valid`);
    assert.ok(stats.onTarget <= stats.shots, `${side} shots on target cannot exceed shots`);
    assert.ok(Number.isFinite(stats.xG) && stats.xG >= 0, `${side} xG must be valid`);
    assert.ok(Number.isFinite(stats.xgShots) && stats.xgShots >= 0, `${side} xG shot count must be valid`);
    assert.ok(stats.xgShots <= stats.shots, `${side} xG shot count cannot exceed shots`);
    assert.ok(Number.isFinite(stats.redCards) && stats.redCards >= 0, `${side} red cards must be valid`);
  }

  assert.ok(state.homeGoals <= state.stats.home.onTarget, 'home goals cannot exceed shots on target');
  assert.ok(state.awayGoals <= state.stats.away.onTarget, 'away goals cannot exceed shots on target');
  assert.ok((state.events || []).every(event => Number.isFinite(event.minute) && event.minute >= 1 && event.minute <= 90), 'match events must stay inside regulation time');
}

function simulate({seed, userAbility = 116, opponentAbility = 116, tactics = BALANCED, userHome = true}) {
  const db = buildDb(userAbility, opponentAbility);
  const career = buildCareer({db, seed, tactics, userHome});
  let state = createInteractiveMatch(career, db);
  while (state.minute < 90) state = advanceInteractiveMatch(state, career, db).state;
  validateFinishedState(state);
  return state;
}

function digest(state) {
  return {
    homeGoals:state.homeGoals,
    awayGoals:state.awayGoals,
    homeStats:state.stats.home,
    awayStats:state.stats.away,
    sentOffIds:state.sentOffIds,
    injuredIds:state.injuredIds,
    events:state.events.map(event => ({minute:event.minute,type:event.type,clubId:event.clubId,playerId:event.playerId,xg:event.xg ?? null}))
  };
}

function scenario(name, options = {}) {
  const totals = {
    goalsFor:0, goalsAgainst:0, shotsFor:0, shotsAgainst:0, xgFor:0, xgAgainst:0,
    wins:0, draws:0, losses:0, redsFor:0, redsAgainst:0
  };

  for (let index = 0; index < RUNS; index += 1) {
    const userHome = index % 2 === 0;
    const state = simulate({...options, userHome, seed:`${name}-${index}`});
    const userSide = userHome ? 'home' : 'away';
    const opponentSide = userHome ? 'away' : 'home';
    const goalsFor = userHome ? state.homeGoals : state.awayGoals;
    const goalsAgainst = userHome ? state.awayGoals : state.homeGoals;
    totals.goalsFor += goalsFor;
    totals.goalsAgainst += goalsAgainst;
    totals.shotsFor += state.stats[userSide].shots;
    totals.shotsAgainst += state.stats[opponentSide].shots;
    totals.xgFor += state.stats[userSide].xG;
    totals.xgAgainst += state.stats[opponentSide].xG;
    totals.redsFor += state.stats[userSide].redCards;
    totals.redsAgainst += state.stats[opponentSide].redCards;
    if (goalsFor > goalsAgainst) totals.wins += 1;
    else if (goalsFor < goalsAgainst) totals.losses += 1;
    else totals.draws += 1;
  }

  return {
    name,
    matches:RUNS,
    goalsFor:round(totals.goalsFor / RUNS),
    goalsAgainst:round(totals.goalsAgainst / RUNS),
    totalGoals:round((totals.goalsFor + totals.goalsAgainst) / RUNS),
    shotsFor:round(totals.shotsFor / RUNS),
    shotsAgainst:round(totals.shotsAgainst / RUNS),
    xgFor:round(totals.xgFor / RUNS),
    xgAgainst:round(totals.xgAgainst / RUNS),
    winRate:round(totals.wins / RUNS),
    drawRate:round(totals.draws / RUNS),
    lossRate:round(totals.losses / RUNS),
    pointsPerMatch:round((totals.wins * 3 + totals.draws) / RUNS),
    goalDifference:round((totals.goalsFor - totals.goalsAgainst) / RUNS),
    redsPerMatch:round((totals.redsFor + totals.redsAgainst) / RUNS)
  };
}

test('same seed and setup produce the same 90-minute match', () => {
  const first = digest(simulate({seed:'determinism', tactics:BALANCED}));
  const second = digest(simulate({seed:'determinism', tactics:BALANCED}));
  assert.deepEqual(second, first);
});

test('calibration matrix stays sane and team strength remains causal', () => {
  const report = [
    scenario('equal-balanced', {tactics:BALANCED}),
    scenario('equal-all-out', {tactics:ALL_OUT}),
    scenario('equal-low-block', {tactics:LOW_BLOCK}),
    scenario('strong-user', {userAbility:132, opponentAbility:104, tactics:BALANCED}),
    scenario('weak-user', {userAbility:104, opponentAbility:132, tactics:BALANCED})
  ];
  const byName = Object.fromEntries(report.map(row => [row.name,row]));
  const equal = byName['equal-balanced'];
  const strong = byName['strong-user'];
  const weak = byName['weak-user'];
  const attack = byName['equal-all-out'];
  const defend = byName['equal-low-block'];

  console.log(`MATCH_ENGINE_CALIBRATION ${JSON.stringify(report)}`);

  // Broad guardrails catch catastrophic simulation drift without pretending these are
  // final real-world tuning targets. Tightening them belongs to the V1 balance pass.
  assert.ok(equal.totalGoals >= 0.8 && equal.totalGoals <= 6.5, `equal-team goals/match out of guardrail: ${equal.totalGoals}`);
  assert.ok(equal.shotsFor + equal.shotsAgainst >= 5 && equal.shotsFor + equal.shotsAgainst <= 40, 'equal-team shot volume is implausible');
  assert.ok(equal.drawRate >= 0.03 && equal.drawRate <= 0.60, `equal-team draw rate out of guardrail: ${equal.drawRate}`);

  // Ability must matter strongly enough that a 28-point XI advantage cannot disappear
  // into presentation randomness or tactical noise.
  assert.ok(strong.pointsPerMatch > weak.pointsPerMatch, `strong XI PPM ${strong.pointsPerMatch} must exceed weak XI PPM ${weak.pointsPerMatch}`);
  assert.ok(strong.goalDifference > weak.goalDifference, `strong XI GD ${strong.goalDifference} must exceed weak XI GD ${weak.goalDifference}`);

  // Extreme tactical presets must not collapse into the same statistical fingerprint.
  const tacticalDelta = Math.abs(attack.goalsFor - defend.goalsFor)
    + Math.abs(attack.goalsAgainst - defend.goalsAgainst)
    + Math.abs(attack.shotsFor - defend.shotsFor)
    + Math.abs(attack.xgFor - defend.xgFor);
  assert.ok(tacticalDelta >= 0.10, 'all-out attack and low block are statistically indistinguishable');
});