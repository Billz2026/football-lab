export const LIVE_ENGINE_VERSION = 2;
export const MAX_SUBSTITUTIONS = 5;
export const FORMATION_OPTIONS = ['4-3-3', '4-2-3-1', '4-4-2', '4-1-4-1', '4-5-1', '3-5-2', '3-4-3', '5-3-2'];
export const DEFAULT_LIVE_TACTICS = {
  formation: '4-3-3',
  mentality: 'Balanced',
  pressing: 'Standard',
  tempo: 'Standard',
  passing: 'Mixed',
  width: 'Balanced',
  defensiveLine: 'Standard'
};

export const TACTIC_OPTIONS = {
  formation: FORMATION_OPTIONS,
  mentality: ['Defensive', 'Balanced', 'Attacking'],
  pressing: ['Low', 'Standard', 'High'],
  tempo: ['Slow', 'Standard', 'High'],
  passing: ['Short', 'Mixed', 'Direct'],
  width: ['Narrow', 'Balanced', 'Wide'],
  defensiveLine: ['Low', 'Standard', 'High']
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const clone = value => JSON.parse(JSON.stringify(value));

function hashString(value) {
  let hash = 2166136261;
  for (const character of String(value)) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededRandom(seed) {
  let state = hashString(seed) || 1;
  return () => {
    state += 0x6D2B79F5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function poisson(lambda, random) {
  const limit = Math.exp(-lambda);
  let product = 1;
  let count = 0;
  do {
    count += 1;
    product *= random();
  } while (product > limit && count < 9);
  return clamp(count - 1, 0, 6);
}

function normalizeTactics(tactics = {}) {
  const next = { ...DEFAULT_LIVE_TACTICS };
  for (const [key, values] of Object.entries(TACTIC_OPTIONS)) {
    if (values.includes(tactics[key])) next[key] = tactics[key];
  }
  return next;
}

function club(db, id) {
  return db.clubs.find(item => item.id === id);
}

function clubName(db, id) {
  return club(db, id)?.shortName || club(db, id)?.name || 'Unknown';
}

function playerById(db, id) {
  return db.players.find(player => player.id === id);
}

function squadFor(db, clubId) {
  return db.players.filter(player => player.clubId === clubId && !player.isPlaceholder);
}

function autoPickLineup(players, clubId) {
  const squad = players
    .filter(player => player.clubId === clubId && !player.isPlaceholder)
    .sort((a, b) => (b.currentAbility || 0) - (a.currentAbility || 0));
  const picked = [];
  const quotas = { GK: 1, DEF: 4, MID: 3, ATT: 3 };
  for (const [group, required] of Object.entries(quotas)) {
    picked.push(...squad.filter(player => player.positionGroup === group).slice(0, required));
  }
  for (const player of squad) {
    if (picked.length < 11 && !picked.some(selected => selected.id === player.id)) picked.push(player);
  }
  return picked.slice(0, 11).map(player => player.id);
}

function validateUserLineup(career, db) {
  const unique = [...new Set(career.lineupIds || [])];
  const squadIds = new Set(squadFor(db, career.clubId).map(player => player.id));
  if (unique.length !== 11) throw new Error('Select exactly 11 players before kick-off.');
  if (unique.some(id => !squadIds.has(id))) throw new Error('Every selected player must belong to your club.');
  if (!unique.some(id => playerById(db, id)?.positionGroup === 'GK')) throw new Error('Your starting XI needs a goalkeeper.');
}

function sideForClub(state, clubId) {
  return clubId === state.homeClubId ? 'home' : 'away';
}

function otherSide(side) {
  return side === 'home' ? 'away' : 'home';
}

function userSide(state) {
  return sideForClub(state, state.userClubId);
}

function lineupsFor(state, side) {
  return side === 'home' ? state.homeLineupIds : state.awayLineupIds;
}

function setLineup(state, side, ids) {
  if (side === 'home') state.homeLineupIds = ids;
  else state.awayLineupIds = ids;
}

function formationProfile(formation) {
  return {
    '4-3-3': { attack: 1.06, defense: 1.00, control: 1.02 },
    '4-2-3-1': { attack: 1.04, defense: 1.02, control: 1.04 },
    '4-4-2': { attack: 1.02, defense: 1.00, control: .98 },
    '4-1-4-1': { attack: .98, defense: 1.08, control: 1.03 },
    '4-5-1': { attack: .94, defense: 1.11, control: 1.05 },
    '3-5-2': { attack: 1.08, defense: .98, control: 1.05 },
    '3-4-3': { attack: 1.13, defense: .92, control: 1.00 },
    '5-3-2': { attack: .96, defense: 1.13, control: .98 }
  }[formation] || { attack: 1, defense: 1, control: 1 };
}

function tacticalProfile(tactics) {
  const base = formationProfile(tactics.formation);
  const profile = { ...base, fatigue: 1 };

  if (tactics.mentality === 'Defensive') { profile.attack *= .84; profile.defense *= 1.13; profile.control *= .96; }
  if (tactics.mentality === 'Attacking') { profile.attack *= 1.17; profile.defense *= .89; profile.control *= 1.03; }
  if (tactics.pressing === 'Low') { profile.attack *= .96; profile.defense *= .98; profile.fatigue *= .76; }
  if (tactics.pressing === 'High') { profile.attack *= 1.06; profile.defense *= 1.04; profile.control *= 1.03; profile.fatigue *= 1.34; }
  if (tactics.tempo === 'Slow') { profile.attack *= .94; profile.defense *= 1.03; profile.control *= 1.05; profile.fatigue *= .88; }
  if (tactics.tempo === 'High') { profile.attack *= 1.07; profile.defense *= .96; profile.control *= .98; profile.fatigue *= 1.16; }
  if (tactics.passing === 'Short') { profile.attack *= .98; profile.control *= 1.07; }
  if (tactics.passing === 'Direct') { profile.attack *= 1.05; profile.control *= .95; }
  if (tactics.width === 'Narrow') { profile.defense *= 1.03; profile.control *= 1.02; }
  if (tactics.width === 'Wide') { profile.attack *= 1.04; profile.defense *= .97; }
  if (tactics.defensiveLine === 'Low') { profile.attack *= .95; profile.defense *= 1.07; }
  if (tactics.defensiveLine === 'High') { profile.attack *= 1.03; profile.defense *= .96; profile.fatigue *= 1.05; }

  return profile;
}

function aiTactics(state, side) {
  const goalsFor = side === 'home' ? state.homeGoals : state.awayGoals;
  const goalsAgainst = side === 'home' ? state.awayGoals : state.homeGoals;
  const trailing = goalsFor < goalsAgainst;
  const leading = goalsFor > goalsAgainst;
  const baseFormation = hashString(side === 'home' ? state.homeClubId : state.awayClubId) % 2 ? '4-2-3-1' : '4-3-3';

  if (state.minute >= 68 && trailing) {
    return { ...DEFAULT_LIVE_TACTICS, formation: state.minute >= 80 ? '3-4-3' : baseFormation, mentality: 'Attacking', pressing: 'High', tempo: 'High', passing: 'Direct', width: 'Wide', defensiveLine: 'High' };
  }
  if (state.minute >= 74 && leading) {
    return { ...DEFAULT_LIVE_TACTICS, formation: '4-5-1', mentality: 'Defensive', pressing: 'Low', tempo: 'Slow', passing: 'Mixed', width: 'Narrow', defensiveLine: 'Low' };
  }
  return { ...DEFAULT_LIVE_TACTICS, formation: baseFormation };
}

function tacticsFor(state, side) {
  return side === userSide(state) ? state.tactics : aiTactics(state, side);
}

function averageAbility(state, db, side) {
  const ids = lineupsFor(state, side);
  if (!ids.length) return 100;
  const total = ids.reduce((sum, id) => {
    const player = playerById(db, id);
    const condition = state.conditions[id] ?? 100;
    const readiness = .62 + .38 * (condition / 100);
    return sum + (player?.currentAbility || 100) * readiness;
  }, 0);
  return total / ids.length;
}

function sidePower(state, db, side) {
  const tactics = tacticsFor(state, side);
  const profile = tacticalProfile(tactics);
  const clubId = side === 'home' ? state.homeClubId : state.awayClubId;
  const reputation = clamp(((club(db, clubId)?.reputation || 7000) - 7000) / 5000, -.15, .15);
  const ability = averageAbility(state, db, side) / 120;
  const home = side === 'home' ? .035 : 0;
  return {
    attack: Math.max(.45, ability * profile.attack + reputation + home),
    defense: Math.max(.45, ability * profile.defense + reputation + home * .35),
    control: Math.max(.45, ability * profile.control + reputation * .5 + home * .2),
    fatigue: profile.fatigue
  };
}

function weightedPlayer(ids, db, random, groups = null) {
  let pool = ids.map(id => playerById(db, id)).filter(Boolean);
  if (groups?.length) {
    const filtered = pool.filter(player => groups.includes(player.positionGroup));
    if (filtered.length) pool = filtered;
  }
  if (!pool.length) return null;
  const weighted = [];
  for (const player of pool) {
    const weight = player.positionGroup === 'ATT' ? 5 : player.positionGroup === 'MID' ? 4 : player.positionGroup === 'DEF' ? 2 : 1;
    for (let i = 0; i < weight; i += 1) weighted.push(player);
  }
  return weighted[Math.floor(random() * weighted.length)] || pool[0];
}

function goalkeeper(ids, db) {
  return ids.map(id => playerById(db, id)).find(player => player?.positionGroup === 'GK') || playerById(db, ids[0]);
}

function addRating(state, playerId, delta) {
  if (!playerId) return;
  state.ratings[playerId] = clamp((state.ratings[playerId] ?? 6.5) + delta, 4.0, 10.0);
}

function recordEvent(state, event) {
  const stored = {
    minute: state.minute,
    type: event.type || 'commentary',
    clubId: event.clubId || null,
    playerId: event.playerId || null,
    assistPlayerId: event.assistPlayerId || null,
    text: event.text || (event.lines || []).join(' '),
    lines: event.lines || (event.text ? [event.text] : [])
  };
  state.events.push(stored);
  return stored;
}

function possessionText(state, db, side, random) {
  const team = clubName(db, side === 'home' ? state.homeClubId : state.awayClubId);
  const opponent = clubName(db, side === 'home' ? state.awayClubId : state.homeClubId);
  const ids = lineupsFor(state, side);
  const passer = weightedPlayer(ids, db, random, ['DEF', 'MID']) || weightedPlayer(ids, db, random);
  const receiver = weightedPlayer(ids.filter(id => id !== passer?.id), db, random, ['MID', 'ATT']) || weightedPlayer(ids, db, random);
  const templates = [
    [`${passer?.name || team} takes a touch and looks up.`, `${team} keep the ball moving as ${receiver?.name || 'a teammate'} finds space between the lines.`],
    [`${passer?.name || team} switches play quickly.`, `${receiver?.name || team} brings it under control and ${opponent} drop back into shape.`],
    [`${team} recycle possession patiently.`, `${passer?.name || 'The midfielder'} steps forward with nobody closing him down.`],
    [`${passer?.name || team} wins the second ball.`, `${team} immediately look to turn defence into attack.`],
    [`${receiver?.name || team} drops into midfield to offer an option.`, `${team} are trying to pull ${opponent} out of their shape.`],
    [`${team} move it from side to side.`, `${opponent} are being made to work without the ball.`]
  ];
  return templates[Math.floor(random() * templates.length)];
}

function pressingText(state, db, side, random) {
  const team = clubName(db, side === 'home' ? state.homeClubId : state.awayClubId);
  const ids = lineupsFor(state, side);
  const player = weightedPlayer(ids, db, random, ['MID', 'ATT']) || weightedPlayer(ids, db, random);
  const templates = [
    `${player?.name || team} closes down aggressively and forces the hurried pass.`,
    `${team} squeeze the pitch and win possession high up the field.`,
    `${player?.name || team} snaps into the challenge and the crowd respond.`,
    `${team} press in numbers, refusing to let the opposition settle.`
  ];
  return [templates[Math.floor(random() * templates.length)]];
}

function attackSequence(state, db, side, random, attackPower, defensePower) {
  const opponentSide = otherSide(side);
  const teamId = side === 'home' ? state.homeClubId : state.awayClubId;
  const opponentId = opponentSide === 'home' ? state.homeClubId : state.awayClubId;
  const team = clubName(db, teamId);
  const opponent = clubName(db, opponentId);
  const ids = lineupsFor(state, side);
  const opponentIds = lineupsFor(state, opponentSide);
  const creator = weightedPlayer(ids, db, random, ['MID', 'ATT']) || weightedPlayer(ids, db, random);
  const shooter = weightedPlayer(ids.filter(id => id !== creator?.id), db, random, ['ATT', 'MID']) || weightedPlayer(ids, db, random);
  const keeper = goalkeeper(opponentIds, db);
  const quality = clamp((attackPower / Math.max(.4, defensePower)) * (.88 + random() * .28), .55, 1.55);
  const roll = random();

  state.stats[side].shots += 1;
  if (roll < .145 * quality) {
    state.stats[side].onTarget += 1;
    if (side === 'home') state.homeGoals += 1; else state.awayGoals += 1;
    addRating(state, shooter?.id, .82);
    addRating(state, creator?.id, .28);
    addRating(state, keeper?.id, -.12);
    for (const id of opponentIds) {
      if (playerById(db, id)?.positionGroup === 'DEF') addRating(state, id, -.04);
    }
    return recordEvent(state, {
      type: 'goal', clubId: teamId, playerId: shooter?.id, assistPlayerId: creator?.id,
      lines: [
        `${creator?.name || team} sees the run and threads the ball into space...`,
        `${shooter?.name || team} is in behind ${opponent}!`,
        `${shooter?.name || 'He'} SHOOTS!`,
        `GOAL! ${shooter?.name || team} scores for ${team}!`
      ]
    });
  }

  if (roll < .49) {
    state.stats[side].onTarget += 1;
    addRating(state, keeper?.id, .12);
    addRating(state, shooter?.id, .03);
    return recordEvent(state, {
      type: 'save', clubId: teamId, playerId: shooter?.id,
      lines: [
        `${creator?.name || team} opens up the defence with a clever pass.`,
        `${shooter?.name || team} gets the shot away...`,
        `${keeper?.name || 'The goalkeeper'} makes the save!`
      ]
    });
  }

  if (roll < .58) {
    state.stats[side].onTarget += 1;
    addRating(state, shooter?.id, .04);
    return recordEvent(state, {
      type: 'woodwork', clubId: teamId, playerId: shooter?.id,
      lines: [
        `${shooter?.name || team} lets fly from the edge of the area...`,
        `OFF THE WOODWORK! ${opponent} survive.`
      ]
    });
  }

  if (roll < .76) {
    addRating(state, shooter?.id, -.03);
    return recordEvent(state, {
      type: 'miss', clubId: teamId, playerId: shooter?.id,
      lines: [
        `${creator?.name || team} finds ${shooter?.name || 'the forward'} in a pocket of space.`,
        `${shooter?.name || 'He'} drags the effort wide of the post.`
      ]
    });
  }

  state.stats[side].corners += 1;
  return recordEvent(state, {
    type: 'corner', clubId: teamId, playerId: shooter?.id,
    lines: [
      `${shooter?.name || team} drives toward goal but the shot is blocked.`,
      `${team} have a corner and the defenders come forward.`
    ]
  });
}

function foulSequence(state, db, side, random) {
  const offenderSide = otherSide(side);
  const attackingTeamId = side === 'home' ? state.homeClubId : state.awayClubId;
  const defendingTeamId = offenderSide === 'home' ? state.homeClubId : state.awayClubId;
  const attacker = weightedPlayer(lineupsFor(state, side), db, random, ['MID', 'ATT']) || weightedPlayer(lineupsFor(state, side), db, random);
  const offender = weightedPlayer(lineupsFor(state, offenderSide), db, random, ['DEF', 'MID']) || weightedPlayer(lineupsFor(state, offenderSide), db, random);
  state.stats[offenderSide].fouls += 1;
  const booking = random() < .18;
  if (booking) {
    state.stats[offenderSide].yellowCards += 1;
    addRating(state, offender?.id, -.12);
  }
  return recordEvent(state, {
    type: booking ? 'yellow' : 'foul', clubId: defendingTeamId, playerId: offender?.id,
    lines: booking
      ? [`${attacker?.name || clubName(db, attackingTeamId)} is caught late by ${offender?.name || 'the defender'}.`, `Yellow card for ${offender?.name || clubName(db, defendingTeamId)}.`]
      : [`${offender?.name || clubName(db, defendingTeamId)} stops ${attacker?.name || 'the attack'} with a foul. Free kick.`]
  });
}

function offsideSequence(state, db, side, random) {
  const teamId = side === 'home' ? state.homeClubId : state.awayClubId;
  const runner = weightedPlayer(lineupsFor(state, side), db, random, ['ATT']) || weightedPlayer(lineupsFor(state, side), db, random);
  return recordEvent(state, {
    type: 'offside', clubId: teamId, playerId: runner?.id,
    lines: [`${runner?.name || clubName(db, teamId)} darts beyond the back line...`, `The flag is up. Offside.`]
  });
}

function crossSequence(state, db, side, random) {
  const teamId = side === 'home' ? state.homeClubId : state.awayClubId;
  const team = clubName(db, teamId);
  const ids = lineupsFor(state, side);
  const wide = weightedPlayer(ids, db, random, ['MID', 'ATT']) || weightedPlayer(ids, db, random);
  const target = weightedPlayer(ids.filter(id => id !== wide?.id), db, random, ['ATT']) || weightedPlayer(ids, db, random);
  if (random() < .34) {
    state.stats[side].corners += 1;
    return recordEvent(state, { type: 'corner', clubId: teamId, lines: [`${wide?.name || team} swings a dangerous ball toward ${target?.name || 'the striker'}.`, `It is headed behind. Corner to ${team}.`] });
  }
  return recordEvent(state, { type: 'commentary', clubId: teamId, lines: [`${wide?.name || team} gets down the flank and crosses early.`, `${target?.name || 'The forward'} cannot quite get there and the danger passes.`] });
}

function fatigueMinute(state, db) {
  for (const side of ['home', 'away']) {
    const profile = sidePower(state, db, side);
    for (const id of lineupsFor(state, side)) {
      state.minutesPlayed[id] = (state.minutesPlayed[id] || 0) + 1;
      const baseLoss = .075 * profile.fatigue;
      state.conditions[id] = clamp((state.conditions[id] ?? 100) - baseLoss, 48, 100);
    }
  }
}

function possessionMinute(state, db, random) {
  const home = sidePower(state, db, 'home').control;
  const away = sidePower(state, db, 'away').control;
  const homeChance = home / (home + away);
  const side = random() < homeChance ? 'home' : 'away';
  state.stats[side].possessionTicks += 1;
  return side;
}

export function createInteractiveMatch(career, db) {
  validateUserLineup(career, db);
  if (career.status === 'complete' || !career.fixtures?.[career.roundIndex]) throw new Error('This demo season is complete.');
  const fixture = career.fixtures[career.roundIndex].find(item => item.homeClubId === career.clubId || item.awayClubId === career.clubId);
  if (!fixture) throw new Error('Your next fixture could not be found.');

  const homeLineupIds = fixture.homeClubId === career.clubId ? [...career.lineupIds] : autoPickLineup(db.players, fixture.homeClubId);
  const awayLineupIds = fixture.awayClubId === career.clubId ? [...career.lineupIds] : autoPickLineup(db.players, fixture.awayClubId);
  const userSquad = squadFor(db, career.clubId).sort((a, b) => (b.currentAbility || 0) - (a.currentAbility || 0));
  const benchIds = userSquad.filter(player => !career.lineupIds.includes(player.id)).slice(0, 9).map(player => player.id);
  const allIds = [...new Set([...homeLineupIds, ...awayLineupIds, ...benchIds])];
  const conditions = {};
  const ratings = {};
  const minutesPlayed = {};
  for (const id of allIds) {
    const player = playerById(db, id);
    const status = career.playerStatus?.[id];
    conditions[id] = player?.clubId === career.clubId ? (status?.condition ?? 100) : 100;
    ratings[id] = 6.5;
    minutesPlayed[id] = 0;
  }

  return {
    version: LIVE_ENGINE_VERSION,
    fixtureId: fixture.id,
    round: fixture.round,
    minute: 0,
    homeClubId: fixture.homeClubId,
    awayClubId: fixture.awayClubId,
    userClubId: career.clubId,
    homeLineupIds,
    awayLineupIds,
    userBenchIds: benchIds,
    substitutions: [],
    subbedOffIds: [],
    tactics: normalizeTactics(career.tactics),
    homeGoals: 0,
    awayGoals: 0,
    stats: {
      home: { possessionTicks: 0, shots: 0, onTarget: 0, corners: 0, fouls: 0, yellowCards: 0 },
      away: { possessionTicks: 0, shots: 0, onTarget: 0, corners: 0, fouls: 0, yellowCards: 0 }
    },
    conditions,
    ratings,
    minutesPlayed,
    events: [],
    seed: String(career.seed)
  };
}

export function advanceInteractiveMatch(inputState, career, db) {
  const state = clone(inputState);
  if (state.minute >= 90) return { state, events: [] };
  state.minute += 1;
  const random = seededRandom(`${state.seed}:${state.fixtureId}:minute:${state.minute}:${JSON.stringify(state.tactics)}:${state.substitutions.length}`);
  fatigueMinute(state, db);
  const possessionSide = possessionMinute(state, db, random);
  const generated = [];

  if (state.minute === 1) {
    generated.push(recordEvent(state, { type: 'marker', lines: ['KICK-OFF.'] }));
  }
  if (state.minute === 45) {
    generated.push(recordEvent(state, { type: 'marker', lines: ['HALF TIME.'] }));
  }
  if (state.minute === 46) {
    generated.push(recordEvent(state, { type: 'marker', lines: ['The second half is underway.'] }));
  }

  const eventChance = state.minute === 45 || state.minute === 46 ? .18 : .64;
  if (random() < eventChance) {
    const homePower = sidePower(state, db, 'home');
    const awayPower = sidePower(state, db, 'away');
    const attackingSide = random() < .68 ? possessionSide : otherSide(possessionSide);
    const attackPower = attackingSide === 'home' ? homePower.attack : awayPower.attack;
    const defensePower = attackingSide === 'home' ? awayPower.defense : homePower.defense;
    const roll = random();

    if (roll < .24) {
      generated.push(recordEvent(state, { type: 'commentary', clubId: attackingSide === 'home' ? state.homeClubId : state.awayClubId, lines: possessionText(state, db, attackingSide, random) }));
    } else if (roll < .34) {
      generated.push(recordEvent(state, { type: 'commentary', clubId: attackingSide === 'home' ? state.homeClubId : state.awayClubId, lines: pressingText(state, db, attackingSide, random) }));
    } else if (roll < .45) {
      generated.push(foulSequence(state, db, attackingSide, random));
    } else if (roll < .54) {
      generated.push(offsideSequence(state, db, attackingSide, random));
    } else if (roll < .68) {
      generated.push(crossSequence(state, db, attackingSide, random));
    } else {
      generated.push(attackSequence(state, db, attackingSide, random, attackPower, defensePower));
    }
  }

  if (state.minute === 90) {
    generated.push(recordEvent(state, { type: 'marker', lines: ['FULL TIME.'] }));
  }

  return { state, events: generated.filter(Boolean) };
}

export function makeSubstitution(inputState, outId, inId, db) {
  const state = clone(inputState);
  if (state.minute >= 90) throw new Error('The match is already over.');
  if (state.substitutions.length >= MAX_SUBSTITUTIONS) throw new Error('You have used all five substitutions.');
  const side = userSide(state);
  const lineup = [...lineupsFor(state, side)];
  if (!lineup.includes(outId)) throw new Error('Choose a player currently on the pitch.');
  if (lineup.includes(inId)) throw new Error('That player is already on the pitch.');
  if (!state.userBenchIds.includes(inId)) throw new Error('Choose a player from your matchday bench.');
  if (state.subbedOffIds.includes(inId)) throw new Error('A substituted player cannot return to the match.');

  const nextLineup = lineup.map(id => id === outId ? inId : id);
  if (!nextLineup.some(id => playerById(db, id)?.positionGroup === 'GK')) throw new Error('Your team must keep a goalkeeper on the pitch.');
  setLineup(state, side, nextLineup);
  state.subbedOffIds.push(outId);
  state.substitutions.push({ minute: state.minute, outId, inId });
  if (state.conditions[inId] == null) state.conditions[inId] = 100;
  if (state.ratings[inId] == null) state.ratings[inId] = 6.5;
  if (state.minutesPlayed[inId] == null) state.minutesPlayed[inId] = 0;

  const outPlayer = playerById(db, outId);
  const inPlayer = playerById(db, inId);
  const event = recordEvent(state, {
    type: 'substitution', clubId: state.userClubId, playerId: inId,
    lines: [`${state.minute}' — ${clubName(db, state.userClubId)} make a change.`, `${inPlayer?.name || 'The substitute'} replaces ${outPlayer?.name || 'the outgoing player'}.`]
  });
  return { state, event };
}

export function changeTactics(inputState, patch) {
  const state = clone(inputState);
  const next = { ...state.tactics };
  for (const [key, values] of Object.entries(TACTIC_OPTIONS)) {
    if (patch[key] != null && values.includes(patch[key])) next[key] = patch[key];
  }
  const changed = Object.keys(next).filter(key => next[key] !== state.tactics[key]);
  state.tactics = next;
  const summary = changed.length
    ? changed.map(key => `${key === 'defensiveLine' ? 'line' : key}: ${next[key]}`).join(' · ')
    : 'No tactical changes';
  const event = recordEvent(state, { type: 'tactical', clubId: state.userClubId, lines: [`Tactical change: ${summary}.`] });
  return { state, event };
}

function aiTeamStrength(db, clubId) {
  const lineup = autoPickLineup(db.players, clubId).map(id => playerById(db, id)).filter(Boolean);
  const ability = lineup.reduce((sum, player) => sum + (player.currentAbility || 100), 0) / Math.max(1, lineup.length);
  const reputation = clamp(((club(db, clubId)?.reputation || 7000) - 7000) / 350, -5, 5);
  return ability + reputation;
}

function aiScorer(db, clubId, random) {
  return weightedPlayer(autoPickLineup(db.players, clubId), db, random, ['ATT', 'MID']);
}

function simulateAIFixture(career, db, fixture) {
  const random = seededRandom(`${career.seed}:${fixture.id}:ai-v2`);
  const homeStrength = aiTeamStrength(db, fixture.homeClubId) + 2.2;
  const awayStrength = aiTeamStrength(db, fixture.awayClubId);
  const difference = clamp((homeStrength - awayStrength) / 28, -1.35, 1.35);
  const homeGoals = poisson(clamp(1.35 + difference, .25, 3.2), random);
  const awayGoals = poisson(clamp(1.1 - difference, .2, 3.0), random);
  const events = [];
  for (let i = 0; i < homeGoals; i += 1) {
    const scorer = aiScorer(db, fixture.homeClubId, random);
    events.push({ minute: 4 + Math.floor(random() * 86), type: 'goal', clubId: fixture.homeClubId, playerId: scorer?.id || null, text: `${scorer?.name || 'A player'} scores.` });
  }
  for (let i = 0; i < awayGoals; i += 1) {
    const scorer = aiScorer(db, fixture.awayClubId, random);
    events.push({ minute: 4 + Math.floor(random() * 86), type: 'goal', clubId: fixture.awayClubId, playerId: scorer?.id || null, text: `${scorer?.name || 'A player'} scores.` });
  }
  return { ...fixture, played: true, homeGoals, awayGoals, events: events.sort((a, b) => a.minute - b.minute) };
}

function applyResult(table, result) {
  const home = table.find(row => row.clubId === result.homeClubId);
  const away = table.find(row => row.clubId === result.awayClubId);
  home.played += 1;
  away.played += 1;
  home.goalsFor += result.homeGoals;
  home.goalsAgainst += result.awayGoals;
  away.goalsFor += result.awayGoals;
  away.goalsAgainst += result.homeGoals;
  if (result.homeGoals > result.awayGoals) {
    home.won += 1; home.points += 3; away.lost += 1;
  } else if (result.homeGoals < result.awayGoals) {
    away.won += 1; away.points += 3; home.lost += 1;
  } else {
    home.drawn += 1; away.drawn += 1; home.points += 1; away.points += 1;
  }
  home.goalDifference = home.goalsFor - home.goalsAgainst;
  away.goalDifference = away.goalsFor - away.goalsAgainst;
}

function possessionPercent(stats) {
  const total = stats.home.possessionTicks + stats.away.possessionTicks;
  const home = total ? Math.round(stats.home.possessionTicks / total * 100) : 50;
  return { home, away: 100 - home };
}

function updateUserStatus(career, state, db, result) {
  const isHome = result.homeClubId === career.clubId;
  const goalsFor = isHome ? result.homeGoals : result.awayGoals;
  const goalsAgainst = isHome ? result.awayGoals : result.homeGoals;
  const morale = goalsFor > goalsAgainst ? 'Excellent' : goalsFor < goalsAgainst ? 'Okay' : 'Good';
  const squad = squadFor(db, career.clubId);
  const goalEvents = state.events.filter(event => event.type === 'goal' && event.clubId === career.clubId && event.playerId);

  for (const player of squad) {
    const status = career.playerStatus[player.id] || { condition: 100, sharpness: 88, morale: 'Good', appearances: 0, goals: 0 };
    const minutes = state.minutesPlayed[player.id] || 0;
    if (minutes > 0) {
      status.condition = Math.round(clamp(state.conditions[player.id] ?? status.condition, 48, 100));
      status.sharpness = clamp(status.sharpness + (minutes >= 45 ? 3 : 1), 1, 100);
      status.appearances += 1;
      status.morale = morale;
    } else {
      status.condition = clamp(status.condition + 4, 1, 100);
      status.sharpness = clamp(status.sharpness - 1, 1, 100);
    }
    status.goals += goalEvents.filter(event => event.playerId === player.id).length;
    career.playerStatus[player.id] = status;
  }
}

export function completeInteractiveRound(career, inputState, db) {
  const state = clone(inputState);
  if (state.minute < 90) throw new Error('The live match has not reached full time.');
  const next = clone(career);
  const roundFixtures = next.fixtures[next.roundIndex];
  if (!roundFixtures) throw new Error('The current round could not be finalised.');
  const possession = possessionPercent(state.stats);
  const userResult = {
    ...roundFixtures.find(fixture => fixture.id === state.fixtureId),
    played: true,
    homeGoals: state.homeGoals,
    awayGoals: state.awayGoals,
    events: state.events,
    matchStats: {
      home: { ...state.stats.home, possession: possession.home },
      away: { ...state.stats.away, possession: possession.away }
    },
    playerRatings: state.ratings,
    playerConditions: state.conditions,
    substitutions: state.substitutions,
    tacticsAtFullTime: state.tactics
  };

  const results = roundFixtures.map(fixture => fixture.id === state.fixtureId ? userResult : simulateAIFixture(next, db, fixture));
  next.fixtures[next.roundIndex] = results;
  results.forEach(result => applyResult(next.table, result));
  updateUserStatus(next, state, db, userResult);
  next.tactics = { ...state.tactics };
  next.lastMatch = userResult;
  next.roundIndex += 1;
  if (next.roundIndex >= next.fixtures.length) next.status = 'complete';
  next.updatedAt = new Date().toISOString();
  return next;
}
