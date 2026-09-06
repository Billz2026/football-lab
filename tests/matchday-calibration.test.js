import test from 'node:test';
import assert from 'node:assert/strict';
import {
  advanceInteractiveMatch,
  createInteractiveMatch
} from '../matchday-engine-v0431.js';

const RUNS = Math.max(48, Number.parseInt(process.env.MATCH_CALIBRATION_RUNS || '96', 10) || 96);
const GROUPS = ['GK','DEF','DEF','DEF','DEF','MID','MID','MID','ATT','ATT','ATT','MID','ATT','DEF','MID','ATT','DEF','MID'];
const POSITIONS = ['GK','DR','DC','DC','DL','MC','MC','AMC','AMR','ST','AML','DMC','ST','DC','MC','ST','DR','ML'];
const DIRECT_SHOT_TYPES = new Set(['goal','save','woodwork','miss']);

const BALANCED = Object.freeze({
  formation:'4-3-3', mentality:'Balanced', pressing:'Standard', tempo:'Standard',
  passing:'Mixed', width:'Balanced', defensiveLine:'Standard'
});
const MIRRORED = Object.freeze({
  formation:'4-2-3-1', mentality:'Balanced', pressing:'Standard', tempo:'Standard',
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

function eventText(event) {
  return `${event?.text || ''} ${(event?.lines || []).join(' ')}`.toLowerCase();
}

function representsShot(event) {
  if (DIRECT_SHOT_TYPES.has(event?.type)) return true;
  if (event?.type !== 'corner') return false;
  return /shot is blocked|drives toward goal/.test(eventText(event));
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
    playerStatus:Object.fromEntries(userPlayers.map(player => [player.id,{condition:100,sharpness:90,morale:'Good',appearances:0,goals:0}])),
    preseason:{tacticalFamiliarity:90}
  };
}

function validateFinishedState(state, db) {
  const events = state.events || [];
  const playersById = new Map(db.players.map(player => [player.id, player]));
  const matchClubIds = new Set([state.homeClubId, state.awayClubId]);

  assert.equal(state.minute, 90, 'every calibration match must reach 90 minutes');
  assert.equal(new Set(state.homeLineupIds).size, state.homeLineupIds.length, 'home XI cannot contain duplicate players');
  assert.equal(new Set(state.awayLineupIds).size, state.awayLineupIds.length, 'away XI cannot contain duplicate players');
  assert.equal(state.homeLineupIds.filter(id => state.awayLineupIds.includes(id)).length, 0, 'a player cannot appear for both teams');
  assert.equal(new Set(state.sentOffIds || []).size, (state.sentOffIds || []).length, 'a player cannot be sent off twice');
  assert.equal(new Set(state.injuredIds || []).size, (state.injuredIds || []).length, 'a player cannot be injured twice in one match');
  assert.ok((state.substitutions || []).length <= 5, 'user substitutions cannot exceed the five-sub limit');

  for (const sentOffId of state.sentOffIds || []) {
    assert.ok(!state.homeLineupIds.includes(sentOffId) && !state.awayLineupIds.includes(sentOffId), 'sent-off players must leave the pitch');
  }

  const totalReds = Number(state.stats.home.redCards || 0) + Number(state.stats.away.redCards || 0);
  assert.equal(totalReds, (state.sentOffIds || []).length, 'red-card stats must reconcile with sent-off players');

  for (const value of Object.values(state.conditions || {})) {
    assert.ok(Number.isFinite(value) && value >= 0 && value <= 100, `player condition out of bounds: ${value}`);
  }
  for (const value of Object.values(state.ratings || {})) {
    assert.ok(Number.isFinite(value) && value >= 4 && value <= 10, `player rating out of bounds: ${value}`);
  }

  for (const side of ['home','away']) {
    const stats = state.stats[side];
    const clubId = side === 'home' ? state.homeClubId : state.awayClubId;
    const shotEvents = events.filter(event => event.clubId === clubId && representsShot(event));
    const goalEvents = events.filter(event => event.clubId === clubId && event.type === 'goal');
    const yellowEvents = events.filter(event => event.clubId === clubId && event.type === 'yellow');
    const redEvents = events.filter(event => event.clubId === clubId && event.type === 'red');
    const goals = side === 'home' ? state.homeGoals : state.awayGoals;
    const lineup = side === 'home' ? state.homeLineupIds : state.awayLineupIds;
    const eventXg = round(shotEvents.reduce((sum, event) => sum + Number(event.xg || 0), 0), 2);
    const eventBigChances = shotEvents.filter(event => Number(event.xg) >= 0.30).length;

    assert.ok(Number.isFinite(stats.shots) && stats.shots >= 0, `${side} shots must be valid`);
    assert.ok(Number.isFinite(stats.onTarget) && stats.onTarget >= 0, `${side} shots on target must be valid`);
    assert.ok(stats.onTarget <= stats.shots, `${side} shots on target cannot exceed shots`);
    assert.ok(Number.isFinite(stats.xG) && stats.xG >= 0, `${side} xG must be valid`);
    assert.ok(Number.isFinite(stats.xgShots) && stats.xgShots >= 0, `${side} xG shot count must be valid`);
    assert.equal(stats.xgShots, stats.shots, `${side} every shot must enter xG accounting exactly once`);
    assert.equal(shotEvents.length, stats.shots, `${side} shot stats must reconcile with explicit shot events`);
    assert.ok(shotEvents.every(event => Number.isFinite(event.xg) && event.xg > 0), `${side} every shot event must carry positive xG`);
    assert.equal(eventXg, round(stats.xG, 2), `${side} event xG must reconcile with aggregate xG`);
    assert.equal(eventBigChances, stats.bigChances, `${side} big-chance count must reconcile with shot events`);
    assert.ok(Number.isFinite(stats.redCards) && stats.redCards >= 0, `${side} red cards must be valid`);
    assert.equal(redEvents.length, stats.redCards, `${side} red-card events must reconcile with red-card stats`);
    assert.equal(yellowEvents.length, stats.yellowCards, `${side} yellow-card events must reconcile with yellow-card stats`);
    assert.equal(lineup.length, 11 - stats.redCards, `${side} on-pitch player count must reflect dismissals`);
    assert.equal(goalEvents.length, goals, `${side} scoreline must reconcile with goal events`);
    assert.ok(goals <= stats.onTarget, `${side} goals cannot exceed shots on target`);
  }

  assert.ok(events.every(event => Number.isFinite(event.minute) && event.minute >= 1 && event.minute <= 90), 'match events must stay inside regulation time');
  for (let index = 1; index < events.length; index += 1) {
    assert.ok(events[index].minute >= events[index - 1].minute, 'match event history must remain chronological');
  }

  for (const event of events) {
    assert.ok(event.clubId == null || matchClubIds.has(event.clubId), `event references a club outside the match: ${event.clubId}`);
    if (event.playerId) {
      const player = playersById.get(event.playerId);
      assert.ok(player, `event references unknown player ${event.playerId}`);
      if (event.clubId) assert.equal(player.clubId, event.clubId, `event player ${event.playerId} is attributed to the wrong club`);
    }
    if (event.assistPlayerId) {
      const assister = playersById.get(event.assistPlayerId);
      assert.ok(assister, `event references unknown assister ${event.assistPlayerId}`);
      if (event.clubId) assert.equal(assister.clubId, event.clubId, `assist ${event.assistPlayerId} is attributed to the wrong club`);
    }
  }
}

function simulate({seed, userAbility = 116, opponentAbility = 116, tactics = BALANCED, userHome = true}) {
  const db = buildDb(userAbility, opponentAbility);
  const career = buildCareer({db, seed, tactics, userHome});
  let state = createInteractiveMatch(career, db);
  while (state.minute < 90) state = advanceInteractiveMatch(state, career, db).state;
  validateFinishedState(state, db);
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

test('calibration matrix stays fair, sane and causally responsive', () => {
  const report = [
    scenario('equal-balanced', {tactics:BALANCED}),
    scenario('equal-mirrored', {tactics:MIRRORED}),
    scenario('equal-all-out', {tactics:ALL_OUT}),
    scenario('equal-low-block', {tactics:LOW_BLOCK}),
    scenario('strong-user', {userAbility:132, opponentAbility:104, tactics:BALANCED}),
    scenario('weak-user', {userAbility:104, opponentAbility:132, tactics:BALANCED})
  ];
  const byName = Object.fromEntries(report.map(row => [row.name,row]));
  const equal = byName['equal-balanced'];
  const mirror = byName['equal-mirrored'];
  const strong = byName['strong-user'];
  const weak = byName['weak-user'];
  const attack = byName['equal-all-out'];
  const defend = byName['equal-low-block'];

  console.log(`MATCH_ENGINE_CALIBRATION ${JSON.stringify(report)}`);

  // Plausibility guardrails are deliberately narrower than the first-pass smoke test.
  assert.ok(equal.totalGoals >= 1.5 && equal.totalGoals <= 4.2, `equal-team goals/match out of guardrail: ${equal.totalGoals}`);
  assert.ok(equal.shotsFor + equal.shotsAgainst >= 14 && equal.shotsFor + equal.shotsAgainst <= 28, 'equal-team shot volume is implausible');
  assert.ok(equal.drawRate >= 0.15 && equal.drawRate <= 0.48, `equal-team draw rate out of guardrail: ${equal.drawRate}`);
  assert.ok(equal.redsPerMatch <= 0.30, `red-card rate is implausibly high: ${equal.redsPerMatch}`);

  // With identical ability and the same baseline formation, alternating home/away must
  // not expose a persistent user-side privilege from hidden role/instruction layers.
  const mirrorShotShare = mirror.shotsFor / Math.max(1, mirror.shotsFor + mirror.shotsAgainst);
  assert.ok(mirrorShotShare >= 0.46 && mirrorShotShare <= 0.54, `mirrored user shot share is biased: ${round(mirrorShotShare,4)}`);
  assert.ok(Math.abs(mirror.xgFor - mirror.xgAgainst) <= 0.30, `mirrored xG gap is too large: ${mirror.xgFor} vs ${mirror.xgAgainst}`);
  assert.ok(Math.abs(mirror.goalsFor - mirror.goalsAgainst) <= 0.45, `mirrored goal gap is too large: ${mirror.goalsFor} vs ${mirror.goalsAgainst}`);

  // Ability must be materially causal, not just technically non-zero.
  assert.ok(strong.pointsPerMatch - weak.pointsPerMatch >= 0.35, `28-point XI advantage produces too little PPM separation: ${strong.pointsPerMatch} vs ${weak.pointsPerMatch}`);
  assert.ok(strong.goalDifference - weak.goalDifference >= 0.50, `28-point XI advantage produces too little GD separation: ${strong.goalDifference} vs ${weak.goalDifference}`);
  assert.ok(strong.winRate > weak.winRate, `strong XI win rate ${strong.winRate} must exceed weak XI ${weak.winRate}`);

  // Extreme tactics must move output in the intended direction, not merely produce a
  // different random fingerprint.
  assert.ok(attack.shotsFor > defend.shotsFor, `all-out attack should create more shots: ${attack.shotsFor} vs ${defend.shotsFor}`);
  assert.ok(attack.goalsFor > defend.goalsFor, `all-out attack should score more: ${attack.goalsFor} vs ${defend.goalsFor}`);
  assert.ok(attack.goalsAgainst > defend.goalsAgainst, `low block should concede less than all-out attack: ${defend.goalsAgainst} vs ${attack.goalsAgainst}`);
  assert.ok(attack.totalGoals > defend.totalGoals, `all-out attack should create a more open match: ${attack.totalGoals} vs ${defend.totalGoals}`);
});