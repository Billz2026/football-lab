import test from 'node:test';
import assert from 'node:assert/strict';
import {
  initialFanSentiment,
  fanSentimentLabel,
  fanSquadAdjustment,
  mediaFanImpact,
  mediaPlayerImpact,
  applyCommunicationStyle,
  dominantCommunicationStyle
} from '../appointment-media-core-v1.js';

test('high-reputation managers receive stronger initial fan sentiment',()=>{
  const low=initialFanSentiment(20,8200);
  const high=initialFanSentiment(85,8200);
  assert.ok(low<high);
  assert.ok(low<=40);
  assert.ok(high>=60);
  assert.notEqual(fanSentimentLabel(low),fanSentimentLabel(high));
});

test('fan reaction hits players differently by personality',()=>{
  const sceptical={traits:{teamOrientation:17,ambition:18,resilience:5,professionalism:8}};
  const professional={traits:{teamOrientation:15,ambition:10,resilience:17,professionalism:18}};
  const player={currentAbility:160};
  const a=fanSquadAdjustment(sceptical,30,25,player);
  const b=fanSquadAdjustment(professional,30,25,player);
  assert.ok(a<b);
});

test('media responses have contextual rather than universally positive fan effects',()=>{
  assert.ok(mediaFanImpact('credentials','confident',25,35)<0);
  assert.ok(mediaFanImpact('credentials','humble',25,35)>0);
  assert.ok(mediaFanImpact('expectations','demanding',55,50)>mediaFanImpact('expectations','humble',55,50));
});

test('player personality changes response to the same media answer',()=>{
  const demandingFit={traits:{ambition:15,professionalism:17,determination:18,temperament:15,teamOrientation:12,resilience:15}};
  const demandingRisk={traits:{ambition:10,professionalism:8,determination:9,temperament:5,teamOrientation:10,resilience:6}};
  const player={currentAbility:145};
  assert.ok(mediaPlayerImpact('expectations','demanding',demandingFit,55,player)>mediaPlayerImpact('expectations','demanding',demandingRisk,55,player));
});

test('communication profile evolves from repeated answer styles',()=>{
  let profile={authority:50,diplomacy:50,motivation:50,mediaHandling:50,playerProtection:50};
  profile=applyCommunicationStyle(profile,'protective');
  profile=applyCommunicationStyle(profile,'protective');
  profile=applyCommunicationStyle(profile,'humble');
  assert.equal(dominantCommunicationStyle(profile),'Player-first');
});
