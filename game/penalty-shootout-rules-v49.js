export const REGULATION_KICKS = 5;

function goals(results = []) {
  return results.reduce((total, value) => total + (value === true ? 1 : 0), 0);
}

export function shootoutDecision(playerResults = [], opponentResults = []) {
  const playerTaken = playerResults.length;
  const opponentTaken = opponentResults.length;
  const playerGoals = goals(playerResults);
  const opponentGoals = goals(opponentResults);
  const playerRemaining = Math.max(0, REGULATION_KICKS - playerTaken);
  const opponentRemaining = Math.max(0, REGULATION_KICKS - opponentTaken);
  const stillInRegulation = playerTaken <= REGULATION_KICKS && opponentTaken <= REGULATION_KICKS;

  if (stillInRegulation && playerGoals > opponentGoals + opponentRemaining) {
    return {
      complete: true,
      winner: "player",
      phase: "regulation",
      reason: "unreachable-lead",
      playerGoals,
      opponentGoals,
      playerTaken,
      opponentTaken
    };
  }

  if (stillInRegulation && opponentGoals > playerGoals + playerRemaining) {
    return {
      complete: true,
      winner: "opponent",
      phase: "regulation",
      reason: "unreachable-lead",
      playerGoals,
      opponentGoals,
      playerTaken,
      opponentTaken
    };
  }

  if (playerTaken < REGULATION_KICKS || opponentTaken < REGULATION_KICKS) {
    return {
      complete: false,
      winner: null,
      phase: "regulation",
      reason: "kicks-remaining",
      playerGoals,
      opponentGoals,
      playerTaken,
      opponentTaken
    };
  }

  const playerExtra = playerTaken - REGULATION_KICKS;
  const opponentExtra = opponentTaken - REGULATION_KICKS;

  if (playerExtra === opponentExtra && playerGoals !== opponentGoals) {
    return {
      complete: true,
      winner: playerGoals > opponentGoals ? "player" : "opponent",
      phase: playerExtra > 0 ? "sudden-death" : "regulation",
      reason: playerExtra > 0 ? "sudden-death-pair" : "five-kicks-complete",
      playerGoals,
      opponentGoals,
      playerTaken,
      opponentTaken
    };
  }

  return {
    complete: false,
    winner: null,
    phase: playerExtra > 0 || opponentExtra > 0 ? "sudden-death" : "regulation",
    reason: playerExtra === opponentExtra ? "level" : "awaiting-reply",
    playerGoals,
    opponentGoals,
    playerTaken,
    opponentTaken
  };
}

export function shootoutPhaseLabel(playerResults = [], opponentResults = []) {
  const decision = shootoutDecision(playerResults, opponentResults);
  if (decision.complete) return decision.phase === "sudden-death" ? "SUDDEN DEATH COMPLETE" : "FULL TIME";
  if (decision.phase === "sudden-death") {
    const round = Math.max(playerResults.length, opponentResults.length) - REGULATION_KICKS + 1;
    return `SUDDEN DEATH · ROUND ${Math.max(1, round)}`;
  }
  const kick = Math.min(REGULATION_KICKS, playerResults.length + 1);
  return `KICK ${kick} OF ${REGULATION_KICKS}`;
}

export function goalCount(results = []) {
  return goals(results);
}
