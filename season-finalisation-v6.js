import * as base from './season-finalisation-v5.js';
import { finaliseEnglishPyramidBackground } from './english-pyramid-world-v6.js';

export * from './season-finalisation-v5.js';

export function finaliseSeason(career, options = {}) {
  const result = base.finaliseSeason(career, options);
  if (!career || (career.competitionId || career.leagueId) !== 'eng-premier-league') return result;
  const completedAt = options.completedAt || career.seasonOutcome?.completedAt || new Date().toISOString();
  const pyramid = finaliseEnglishPyramidBackground(career, { completedAt });
  return {
    ...result,
    pyramid,
    championship: pyramid?.championship || result.championship || null,
    leagueOne: pyramid?.leagueOne || result.leagueOne || null,
    leagueTwo: pyramid?.leagueTwo || result.leagueTwo || null,
    nationalLeague: pyramid?.nationalLeague || result.nationalLeague || null,
    nationalLeagueNorth: pyramid?.nationalLeagueNorth || result.nationalLeagueNorth || null,
    nationalLeagueSouth: pyramid?.nationalLeagueSouth || result.nationalLeagueSouth || null,
    stepThreeDivisions: pyramid?.stepThreeDivisions || null,
    nextChampionshipMembership: pyramid?.membership || result.nextChampionshipMembership || null,
    nextLeagueOneMembership: pyramid?.leagueOneMembership || result.nextLeagueOneMembership || null,
    nextLeagueTwoMembership: pyramid?.leagueTwoMembership || result.nextLeagueTwoMembership || null,
    nextNationalLeagueMembership: pyramid?.nationalLeagueMembership || result.nextNationalLeagueMembership || null,
    nextStepTwoMembership: pyramid?.stepThreeMembership || null,
    nextStepThreeBoundary: pyramid?.stepFourBoundary || null
  };
}
