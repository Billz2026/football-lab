import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STEP_SIX_DIVISION_IDS,
  STEP_SIX_2026_27_MEMBERSHIPS,
  SWPW_ID,
  SWPE_ID
} from '../national-league-step-six-world-v1.js';
import { simulateResolvedStepSixDivisionSeason } from '../national-league-step-six-simulation-resolved-v1.js';

test('resolved Step 6 simulation maintains all 32 promotion places across a broad seed sample',()=>{
  for(let sample=0;sample<100;sample+=1){
    let promoted=0;
    for(const competitionId of STEP_SIX_DIVISION_IDS){
      const outcome=simulateResolvedStepSixDivisionSeason({competitionId,season:'2026/27',clubs:STEP_SIX_2026_27_MEMBERSHIPS[competitionId],seed:`step-six-stress-${sample}`});
      assert.equal(outcome.status,'complete',`${competitionId} failed at seed ${sample}`);
      assert.ok(outcome.resolutionAttempts>=0&&outcome.resolutionAttempts<=32);
      const expected=(competitionId===SWPW_ID||competitionId===SWPE_ID)?1:2;
      assert.equal(outcome.promotedClubIds.length,expected);
      assert.ok(outcome.promotedClubIds.every(id=>outcome.clubs.find(c=>c.id===id)?.promotionEligible!==false));
      promoted+=outcome.promotedClubIds.length;
    }
    assert.equal(promoted,32);
  }
});
