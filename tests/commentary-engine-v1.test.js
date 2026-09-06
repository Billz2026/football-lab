import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COMMENTARY_ENGINE_VERSION,
  analyseGoal,
  buildGoalBeats,
  classifyGoalMoment,
  createCommentaryMemory,
  goalQualityFor,
  selectFinishType
} from '../commentary-engine-v1.js';
import { commentaryFamilyFor, rewriteCommentaryText } from '../commentary-v2.js';
import {
  MATCH_DRAMA_VERSION,
  DRAMA_RATES,
  crowdNarrativeFor,
  resolveDogsoDecision,
  resolveFreeKickOutcome,
  resolvePenaltyOutcome
} from '../match-drama-v3.js';

test('late winner receives premium moment importance', () => {
  const memory=createCommentaryMemory();
  const result=classifyGoalMoment({
    minute:90,
    side:'home',
    before:{home:1,away:1},
    after:{home:2,away:1},
    scorerId:'striker-9'
  },memory);
  assert.ok(result.tags.includes('late-winner'));
  assert.ok(result.importance>=95);
});

test('two-goal deficit can become a level comeback and then a completed comeback', () => {
  const memory=createCommentaryMemory();
  classifyGoalMoment({minute:22,side:'away',before:{home:0,away:0},after:{home:0,away:1},scorerId:'away-1'},memory);
  classifyGoalMoment({minute:31,side:'away',before:{home:0,away:1},after:{home:0,away:2},scorerId:'away-2'},memory);
  classifyGoalMoment({minute:55,side:'home',before:{home:0,away:2},after:{home:1,away:2},scorerId:'home-1'},memory);
  const level=classifyGoalMoment({minute:71,side:'home',before:{home:1,away:2},after:{home:2,away:2},scorerId:'home-2'},memory);
  const winner=classifyGoalMoment({minute:84,side:'home',before:{home:2,away:2},after:{home:3,away:2},scorerId:'home-3'},memory);
  assert.ok(level.tags.includes('comeback-level'));
  assert.ok(level.importance>=80);
  assert.ok(winner.tags.includes('comeback-complete'));
  assert.ok(winner.importance>=90);
});

test('immediate response is recognised without pretending it is automatically a late winner', () => {
  const memory=createCommentaryMemory();
  classifyGoalMoment({minute:61,side:'away',before:{home:0,away:0},after:{home:0,away:1},scorerId:'away-1'},memory);
  const response=classifyGoalMoment({minute:63,side:'home',before:{home:0,away:1},after:{home:1,away:1},scorerId:'home-1'},memory);
  assert.ok(response.tags.includes('immediate-response'));
  assert.ok(response.tags.includes('equaliser'));
  assert.ok(!response.tags.includes('late-winner'));
});

test('special finish selection is deterministic for the same goal', () => {
  const input={fixtureId:'fixture-44',minute:67,playerId:'player-10',currentAbility:168,eventIndex:0};
  const first=selectFinishType(input);
  const second=selectFinishType(input);
  assert.equal(first,second);
  assert.ok(['normal','bicycle-kick','backheel','volley','screamer','chip'].includes(first));
});

test('special finishes receive clearly higher goal quality than routine finishes', () => {
  const base={fixtureId:'fixture-q',minute:70,playerId:'player-q',eventIndex:0};
  const routine=goalQualityFor({...base,finishType:'normal'});
  const bicycle=goalQualityFor({...base,finishType:'bicycle-kick'});
  const screamer=goalQualityFor({...base,finishType:'screamer'});
  assert.ok(bicycle>=94);
  assert.ok(screamer>=88);
  assert.ok(routine<bicycle);
});

test('bicycle-kick commentary stays short and gives the finish special treatment', () => {
  const beats=buildGoalBeats({
    teamName:'Arsenal',
    scorerName:'Kai Havertz',
    assistName:'Bukayo Saka',
    finishType:'bicycle-kick',
    moment:{tags:[]}
  });
  assert.match(beats.setup,/Saka/);
  assert.match(beats.action,/BICYCLE KICK/);
  assert.match(beats.final,/INCREDIBLE|BICYCLE/i);
  assert.ok(Object.values(beats).every(line=>line.length<90));
});

test('a spectacular last-minute winner combines finish quality with match drama', () => {
  const memory=createCommentaryMemory();
  const result=analyseGoal({
    fixtureId:'fixture-final',
    minute:90,
    side:'home',
    before:{home:2,away:2},
    after:{home:3,away:2},
    playerId:'hero',
    currentAbility:175,
    teamName:'Arsenal',
    opponentName:'Liverpool',
    scorerName:'Bukayo Saka',
    assistName:'Martin Odegaard',
    eventIndex:0
  },memory);
  assert.ok(result.momentTags.includes('late-winner'));
  assert.ok(result.momentImportance>=95);
  assert.match(result.beats.final,/AT THE DEATH/);
  assert.equal(COMMENTARY_ENGINE_VERSION,'1.0.0');
});

test('Commentary V2 identifies woodwork, discipline and injury event families',()=>{
  assert.equal(commentaryFamilyFor('The shot smashes against the crossbar.'),'crossbar');
  assert.equal(commentaryFamilyFor('He hits the post and it stays out.'),'post');
  assert.equal(commentaryFamilyFor('RED CARD! He has been sent off.'),'red');
  assert.equal(commentaryFamilyFor('He cannot continue after the injury.'),'injury');
});

test('Commentary V2 variation avoids immediately repeating the same template',()=>{
  const memory={lastVariant:{}};
  const first=rewriteCommentaryText({text:'Bukayo Saka hits the post.',family:'post',player:'Bukayo Saka',team:'Arsenal',key:'same-key',memory});
  const second=rewriteCommentaryText({text:'Bukayo Saka hits the post.',family:'post',player:'Bukayo Saka',team:'Arsenal',key:'same-key',memory});
  assert.notEqual(first,second);
  assert.match(first,/post|upright/i);
  assert.match(second,/post|upright/i);
});

test('penalty resolver produces the full football outcome range',()=>{
  assert.equal(resolvePenaltyOutcome({roll:0.10,takerAbility:150,keeperAbility:130}),'goal');
  assert.equal(resolvePenaltyOutcome({roll:0.84,takerAbility:130,keeperAbility:130}),'save');
  assert.equal(resolvePenaltyOutcome({roll:0.93,takerAbility:130,keeperAbility:130}),'woodwork');
  assert.equal(resolvePenaltyOutcome({roll:0.99,takerAbility:130,keeperAbility:130}),'miss');
});

test('dangerous free-kick resolver allows goals, saves, woodwork, walls and misses',()=>{
  assert.equal(resolveFreeKickOutcome({roll:0.01,takerAbility:160,keeperAbility:130}),'goal');
  assert.equal(resolveFreeKickOutcome({roll:0.20,takerAbility:130,keeperAbility:130}),'save');
  assert.equal(resolveFreeKickOutcome({roll:0.37,takerAbility:130,keeperAbility:130}),'woodwork');
  assert.equal(resolveFreeKickOutcome({roll:0.55,takerAbility:130,keeperAbility:130}),'wall');
  assert.equal(resolveFreeKickOutcome({roll:0.95,takerAbility:130,keeperAbility:130}),'miss');
});

test('VAR can downgrade a straight red to yellow while respecting an existing booking',()=>{
  const overturned=resolveDogsoDecision({decisionRoll:0.20,varRoll:0.03,alreadyBooked:false});
  assert.equal(overturned.provisional,'red');
  assert.equal(overturned.review,true);
  assert.equal(overturned.overturned,true);
  assert.equal(overturned.final,'yellow');
  assert.equal(overturned.stillSentOff,false);

  const secondYellow=resolveDogsoDecision({decisionRoll:0.20,varRoll:0.03,alreadyBooked:true});
  assert.equal(secondYellow.final,'yellow');
  assert.equal(secondYellow.stillSentOff,true);
});

test('three-goal first-half humiliation at Arsenal can trigger boos and early exits',()=>{
  const story=crowdNarrativeFor({
    minute:42,
    homeGoals:0,
    awayGoals:3,
    homeName:'Arsenal',
    awayName:'Ipswich Town',
    seen:[]
  });
  assert.equal(story.key,'early-exit');
  assert.match(story.lines.join(' '),/Emirates/i);
  assert.match(story.lines.join(' '),/exits/i);
});

test('crowd humiliation commentary does not trigger for an ordinary one-goal deficit',()=>{
  const story=crowdNarrativeFor({
    minute:42,
    homeGoals:0,
    awayGoals:1,
    homeName:'Arsenal',
    awayName:'Ipswich Town',
    seen:[]
  });
  assert.equal(story,null);
});

test('Match Drama V3 stays deliberately rare rather than firing every few minutes',()=>{
  const total=Object.values(DRAMA_RATES).reduce((sum,value)=>sum+value,0);
  assert.equal(MATCH_DRAMA_VERSION,'3.0.0');
  assert.ok(total<0.03);
  assert.ok(DRAMA_RATES.dangerousFreeKick>DRAMA_RATES.disallowedGoal);
  assert.ok(DRAMA_RATES.disallowedGoal<0.003);
});
