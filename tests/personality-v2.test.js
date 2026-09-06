import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PERSONALITY_SCHEMA_VERSION,
  createPersonalityProfile,
  classifyPersonality,
  managerRespectAdjustment,
  resultRespectAdjustment,
  ensurePersonalityState
} from '../career-personality-v2.js';

const player=(id,overrides={})=>({
  id,name:id,clubId:'club-a',reportedAge:24,currentAbility:145,isPlaceholder:false,
  attributes:{mental:{aggression:10,composure:13,determination:14,teamwork:12,workRate:14},physical:{naturalFitness:13}},
  ...overrides
});

test('Personality V2 is deterministic but individual to the player',()=>{
  const a=createPersonalityProfile(player('alpha'),'career-seed');
  const again=createPersonalityProfile(player('alpha'),'career-seed');
  const b=createPersonalityProfile(player('bravo'),'career-seed');
  assert.deepEqual(a,again);
  assert.equal(a.schemaVersion,PERSONALITY_SCHEMA_VERSION);
  assert.notEqual(a.individualityKey,b.individualityKey);
  assert.notDeepEqual(a.traits,b.traits);
  assert.equal(Object.keys(a.traits).length,9);
});

test('visible archetype is derived from hidden traits rather than player-id lookup',()=>{
  const elite=classifyPersonality({professionalism:19,ambition:12,determination:16,discipline:17,temperament:15,resilience:15,teamOrientation:16,adaptability:12,loyalty:13});
  const risk=classifyPersonality({professionalism:8,ambition:17,determination:10,discipline:5,temperament:5,resilience:8,teamOrientation:5,adaptability:11,loyalty:5});
  assert.equal(elite.id,'exemplary-professional');
  assert.ok(['temperamental','impulsive','self-centred','restless'].includes(risk.id));
});

test('personality changes how players react to manager authority and results',()=>{
  const ambitious=createPersonalityProfile(player('star',{currentAbility:170}),'seed');
  ambitious.traits.ambition=19;ambitious.traits.teamOrientation=6;ambitious.traits.professionalism=9;ambitious.traits.resilience=6;ambitious.traits.temperament=6;
  assert.ok(managerRespectAdjustment(ambitious,player('star',{currentAbility:170}),25)<0);
  assert.ok(resultRespectAdjustment(ambitious,'loss',25)<=-2);
  assert.ok(resultRespectAdjustment(ambitious,'win',25)>=1);
});

test('career personality state covers every real loaded player',()=>{
  const career={id:'c1',seed:'s1',roundIndex:0};
  const db={players:[player('one'),player('two'),player('placeholder',{isPlaceholder:true})]};
  assert.equal(ensurePersonalityState(career,db),true);
  assert.deepEqual(Object.keys(career.playerPersonalities).sort(),['one','two']);
  assert.equal(career.personalityEngine.schemaVersion,PERSONALITY_SCHEMA_VERSION);
});
