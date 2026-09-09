import {
  STEP_SIX_2026_27_MEMBERSHIPS,
  simulateStepSixDivisionSeason
} from './national-league-step-six-world-v1.js';

const clone=value=>JSON.parse(JSON.stringify(value));
function hashString(value){let hash=2166136261;for(const ch of String(value)){hash^=ch.charCodeAt(0);hash=Math.imul(hash,16777619);}return hash>>>0;}

function stabilisePromotionEligibility(clubs){
  return(clubs||[]).map(club=>{
    if(club?.promotionEligible!==false)return clone(club);
    const hash=hashString(club.id||club.name||'reserve');
    return{...clone(club),strength:30+(hash%4)};
  });
}

export function simulateResolvedStepSixDivisionSeason({competitionId,season='2026/27',clubs=STEP_SIX_2026_27_MEMBERSHIPS[competitionId],seed='football-lab-step-six',completedAt=null,maxResolutionAttempts=32}={}){
  const stableClubs=stabilisePromotionEligibility(clubs);
  let outcome=simulateStepSixDivisionSeason({competitionId,season,clubs:stableClubs,seed,completedAt});
  if(outcome.status==='complete')return{...outcome,resolutionAttempts:0,resolutionSeed:seed};

  for(let attempt=1;attempt<=maxResolutionAttempts;attempt+=1){
    const resolutionSeed=`${seed}:promotion-resolution:${attempt}`;
    outcome=simulateStepSixDivisionSeason({competitionId,season,clubs:stableClubs,seed:resolutionSeed,completedAt});
    if(outcome.status==='complete'){
      return{...outcome,resolutionAttempts:attempt,resolutionSeed,initialResolutionStatus:attempt===1?null:'promotion-or-ranking-resolution-required'};
    }
  }

  return{...outcome,status:'promotion-resolution-exhausted',resolutionAttempts:maxResolutionAttempts,resolutionSeed:null,reason:`Step 6 ${competitionId} could not resolve an eligible promotion outcome after ${maxResolutionAttempts} deterministic attempts.`};
}

export function simulateAllResolvedStepSixDivisions({season='2026/27',seed='football-lab-step-six',memberships=STEP_SIX_2026_27_MEMBERSHIPS,completedAt=null,maxResolutionAttempts=32}={}){
  return Object.fromEntries(Object.keys(memberships).map(competitionId=>[competitionId,simulateResolvedStepSixDivisionSeason({competitionId,season,clubs:memberships[competitionId],seed,completedAt,maxResolutionAttempts})]));
}
