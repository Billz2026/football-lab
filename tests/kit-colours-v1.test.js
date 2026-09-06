import test from 'node:test';
import assert from 'node:assert/strict';
import { PREMIER_LEAGUE_KIT_TEAMS, getTeamKits, kitsClash, resolveMatchKits } from '../kit-colours-v1.js';

test('Manchester United home vs Liverpool uses Liverpool away colours without a clash',()=>{
  const kits=resolveMatchKits('Manchester United','Liverpool');
  assert.equal(kits.home.type,'home');
  assert.equal(kits.away.type,'away');
  assert.equal(kits.home.primary,getTeamKits('Manchester United').home);
  assert.equal(kits.away.primary,getTeamKits('Liverpool').away);
  assert.equal(kitsClash(kits.home.primary,kits.away.primary),false);
});

test('Liverpool home vs Manchester United uses Manchester United away colours without a clash',()=>{
  const kits=resolveMatchKits('Liverpool','Manchester United');
  assert.equal(kits.home.type,'home');
  assert.equal(kits.away.type,'away');
  assert.equal(kits.away.primary,getTeamKits('Manchester United').away);
  assert.equal(kitsClash(kits.home.primary,kits.away.primary),false);
});

test('away side switches kit when its nominal away colour clashes with the home side',()=>{
  const kits=resolveMatchKits('Arsenal','Fulham');
  assert.equal(kits.home.type,'home');
  assert.notEqual(kits.away.type,'away');
  assert.equal(kitsClash(kits.home.primary,kits.away.primary),false);
});

test('every current Premier League pairing resolves to distinguishable primary colours in both directions',()=>{
  for(const home of PREMIER_LEAGUE_KIT_TEAMS){
    for(const away of PREMIER_LEAGUE_KIT_TEAMS){
      if(home===away)continue;
      const kits=resolveMatchKits(home,away);
      assert.equal(kitsClash(kits.home.primary,kits.away.primary),false,`${home} vs ${away}: ${kits.home.primary} / ${kits.away.primary}`);
    }
  }
});

test('unknown clubs still receive deterministic non-clashing kits',()=>{
  const first=resolveMatchKits('Example Red FC','Example Red Athletic');
  const second=resolveMatchKits('Example Red FC','Example Red Athletic');
  assert.deepEqual(first,second);
  assert.equal(kitsClash(first.home.primary,first.away.primary),false);
});