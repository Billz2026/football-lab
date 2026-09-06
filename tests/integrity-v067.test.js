import test from 'node:test';
import assert from 'node:assert/strict';
import { boardTierForClub, getBoardExpectation } from '../board-expectations-v067.js';
import { FRIENDLY_SUBSTITUTION_LIMIT, COMPETITIVE_SUBSTITUTION_LIMIT, substitutionLimitForFixture, scaledConditionAfterMinute } from '../match-integrity-core-v067.js';

test('Manchester United board expectation is Champions League qualification',()=>{
  const club={name:'Manchester United',leagueId:'eng-premier-league',reputation:1000};
  assert.equal(boardTierForClub(club),'championsLeague');
  const expectation=getBoardExpectation(club);
  assert.equal(expectation.primary,'Qualify for the UEFA Champions League');
  assert.equal(expectation.targetPosition,4);
  assert.equal(expectation.minimumPosition,6);
});

test('Coventry board expectation is survival regardless of noisy provider reputation',()=>{
  const club={name:'Coventry City',leagueId:'eng-premier-league',reputation:9999};
  assert.equal(boardTierForClub(club),'survival');
  const expectation=getBoardExpectation(club);
  assert.equal(expectation.primary,'Avoid relegation');
  assert.equal(expectation.minimum,'Finish 17th or higher');
  assert.equal(expectation.minimumPosition,17);
});

test('unknown Premier League clubs receive a neutral mid-table fallback',()=>{
  assert.equal(boardTierForClub({name:'Future FC',leagueId:'eng-premier-league'}),'midtable');
});

test('friendly and competitive substitution limits are distinct',()=>{
  assert.equal(substitutionLimitForFixture({type:'friendly'}),FRIENDLY_SUBSTITUTION_LIMIT);
  assert.equal(FRIENDLY_SUBSTITUTION_LIMIT,9);
  assert.equal(substitutionLimitForFixture({type:'league'}),COMPETITIVE_SUBSTITUTION_LIMIT);
  assert.equal(COMPETITIVE_SUBSTITUTION_LIMIT,5);
});

test('friendly fatigue is gentler and low condition is not pinned to 48 percent',()=>{
  const friendly=scaledConditionAfterMinute(55,54.9,{type:'friendly'});
  const competitive=scaledConditionAfterMinute(55,54.9,{type:'league'});
  assert.ok(friendly>competitive);
  assert.ok(scaledConditionAfterMinute(48,48,{type:'league'})<48);
  assert.ok(scaledConditionAfterMinute(48,48,{type:'friendly'})<48);
});
