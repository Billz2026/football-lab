// Shared by the engine, Match Plan and injury prompt. Never infer eligibility
// from rendered controls or supplement the registered bench from the database.
export function userMatchLineup(state) {
  return [...(state.userClubId === state.homeClubId ? state.homeLineupIds : state.awayLineupIds) || []];
}

export function eligibleBenchIds(state, db) {
  const unavailable = new Set([
    ...userMatchLineup(state), ...(state.subbedOffIds || []),
    ...(state.sentOffIds || []), ...(state.injuredIds || [])
  ]);
  const players = new Map((db?.players || []).map(player => [player.id, player]));
  return [...new Set(state.userBenchIds || [])].filter(id => {
    const player = players.get(id);
    return player && player.clubId === state.userClubId && !player.isPlaceholder && !unavailable.has(id);
  });
}

export function substitutionStatus(state, db, outId = null) {
  const lineupIds = userMatchLineup(state);
  const benchIds = eligibleBenchIds(state, db);
  const remaining = Math.max(0, (state.substitutionLimit ?? 5) - (state.substitutions || []).length);
  const minute = Math.max(0, Math.floor(Number(state.minute) || 0));
  const windows = [...new Set(state.substitutionWindowMinutes || [])];
  const windowAvailable = state.substitutionWindowLimit == null || minute === 45
    || windows.includes(minute) || windows.length < state.substitutionWindowLimit;
  const players = new Map((db?.players || []).map(player => [player.id, player]));
  const replacementIds = outId ? benchIds.filter(inId =>
    lineupIds.map(id => id === outId ? inId : id).some(id => players.get(id)?.positionGroup === 'GK')
  ) : benchIds;
  let reason = '';
  if (minute >= 90) reason = 'The match is already over.';
  else if (!remaining) reason = `You have used all ${state.substitutionLimit ?? 5} substitutions.`;
  else if (!windowAvailable) reason = 'You have used all three in-play substitution windows. Half-time changes do not use a window.';
  else if (outId && (!lineupIds.includes(outId) || (state.sentOffIds || []).includes(outId))) reason = 'Choose a player currently on the pitch.';
  else if (!benchIds.length) reason = 'No eligible substitutes remain on the matchday bench.';
  else if (!replacementIds.length) reason = 'No eligible goalkeeper replacement is available.';
  return { lineupIds, benchIds, replacementIds, remaining, windowAvailable, reason, canSubstitute: !reason };
}
