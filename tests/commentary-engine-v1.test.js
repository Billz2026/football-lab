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
import {
  COMMENTARY_V2_VERSION,
  commentaryFamilyFor,
  rewriteCommentaryText
} from '../commentary-v2.js';

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

test('Commentary V2 recognises woodwork, red-card and injury incidents',()=>{
  assert.equal(commentaryFamilyFor('Saka hits the crossbar!'),'crossbar');
  assert.equal(commentaryFamilyFor('RED CARD! Rice is sent off.'),'red');
  assert.equal(commentaryFamilyFor('Saliba cannot continue after that injury.'),'injury');
  assert.equal(COMMENTARY_V2_VERSION,'2.0.0');
});

test('Commentary V2 rotates repeated family wording instead of using one fixed line',()=>{
  const memory={lastVariant:{}};
  const first=rewriteCommentaryText({text:'Saka hits the post',family:'post',player:'Bukayo Saka',team:'Arsenal',key:'post-1',memory});
  const second=rewriteCommentaryText({text:'Saka hits the post',family:'post',player:'Bukayo Saka',team:'Arsenal',key:'post-2',memory});
  assert.notEqual(first,second);
  assert.match(first,/POST|post|upright|fraction/i);
  assert.match(second,/POST|post|upright|fraction/i);
});
