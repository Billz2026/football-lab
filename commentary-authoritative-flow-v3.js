export const AUTHORITATIVE_FLOW_COMMENTARY_VERSION = '3.0.0';

const FLOW_TYPES = new Set(['commentary', 'corner', 'offside', 'instruction']);
const ROW_GRACE_MS = 900;
const memories = new WeakMap();
const liveObservers = new WeakMap();
let dbPromise = null;
let queued = false;
let scaffoldTimer = 0;

const clean = value => String(value || '').replace(/\s+/g, ' ').trim();

function hashString(value) {
  let hash = 2166136261;
  for (const character of String(value || '')) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function createAuthoritativeFlowMemory() {
  return { linesBySequence: new Map(), lastVariant: {}, processedSequences: new Set(), latestProtectedRow: null };
}

function choose(list, key, memory, family) {
  if (!list?.length) return '';
  let index = hashString(key) % list.length;
  const previous = memory?.lastVariant?.[family];
  if (list.length > 1 && index === previous) index = (index + 1) % list.length;
  if (memory?.lastVariant) memory.lastVariant[family] = index;
  return list[index];
}

function database() {
  if (!dbPromise) dbPromise = Promise.resolve(window.FLMManager?.loadDatabase?.()).catch(() => null);
  return dbPromise;
}

function playerName(db, id, fallback) {
  return clean(db?.players?.find(player => player.id === id)?.name) || fallback;
}

function clubName(db, id, fallback) {
  const club = db?.clubs?.find(item => item.id === id);
  return clean(club?.shortName || club?.name) || fallback;
}

function sideLabel(side) {
  return side === 'left' ? 'left' : side === 'right' ? 'right' : 'central';
}

function hasTag(flow, tag) {
  return (flow?.contextTags || []).includes(tag);
}

function developmentLine({ flow, attacking, attacker, creator, memory }) {
  const key = `${flow.sequenceId}:development`;
  const side = sideLabel(flow.side);
  switch (flow.subtype) {
    case 'interception':
      return choose([
        `${creator} tries to thread ${attacker} through the inside channel.`,
        `${attacking} look to punch a pass between midfield and defence for ${attacker}.`,
        `${attacker} checks into the final third as ${creator} attempts the forward pass.`,
        `${attacking} try to accelerate through the middle rather than recycle again.`
      ], key, memory, 'dev_interception');
    case 'standing_tackle':
    case 'sliding_tackle':
      return choose([
        `${attacker} carries the ball directly at the back line.`,
        `${attacker} turns and drives into the final third with space opening ahead.`,
        `${attacking} break the first line and ${attacker} attacks the defender one against one.`,
        `${attacker} pushes forward, trying to commit the last defender.`
      ], key, memory, 'dev_tackle');
    case 'poor_touch':
      return choose([
        `${creator} finds ${attacker} between the lines with room to turn.`,
        `${attacker} receives in a promising pocket just ahead of the defence.`,
        `${attacking} work the ball into ${attacker}'s feet in the final third.`
      ], key, memory, 'dev_touch');
    case 'overhit_pass':
    case 'offside_trap':
      return choose([
        `${creator} sees ${attacker} threatening the space behind the defence.`,
        `${attacker} bends his run and ${creator} tries to release him early.`,
        `${attacking} look in behind as ${attacker} accelerates beyond the midfield line.`
      ], key, memory, 'dev_run');
    case 'forced_back':
      return choose([
        `${attacker} takes possession in the ${side} channel and tries to advance.`,
        `${attacking} switch the ball towards ${attacker} on the ${side}.`,
        `${attacker} receives wide and immediately looks for a route towards the area.`
      ], key, memory, 'dev_forced_back');
    case 'second_ball_win':
      return choose([
        `The first clearance hangs in midfield and both sides attack the second ball.`,
        `A loose ball drops after the initial challenge and the midfield compresses around it.`,
        `The ball breaks free in midfield with possession suddenly there to be won.`
      ], key, memory, 'dev_second_ball');
    case 'press_regain':
      return choose([
        `${attacking} try to play through the first wave of pressure.`,
        `${attacking} attempt to build from the back despite the press closing around them.`,
        `${attacking} take a risk in possession as the space disappears quickly.`
      ], key, memory, 'dev_press');
    case 'blocked_cross':
    case 'blocked_cross_corner':
      return choose([
        `${attacker} reaches crossing range down the ${side} and shapes to deliver.`,
        `${attacker} gets half a yard on the ${side} and tries to whip the ball into the area.`,
        `${attacking} create the overload wide and ${attacker} prepares the cross.`
      ], key, memory, 'dev_block_cross');
    case 'defensive_header':
    case 'defensive_header_corner':
      return choose([
        `${attacking} work the opening wide and send a dangerous delivery into the area.`,
        `The cross is hung into a crowded penalty area with runners attacking it.`,
        `${attacking} put real pace on the delivery towards the centre of the box.`
      ], key, memory, 'dev_header');
    case 'keeper_claim':
      return choose([
        `${attacking} load the box and send the cross in from the ${side}.`,
        `The delivery is lifted towards a crowd of players in the penalty area.`,
        `${attacking} send another ball into the danger zone from the ${side}.`
      ], key, memory, 'dev_claim');
    case 'overhit_cross':
      return choose([
        `${attacker} gets forward down the ${side} and looks for the runners in the box.`,
        `${attacking} create space for ${attacker} to deliver from the ${side}.`,
        `${attacker} has time to measure the cross from the ${side}.`
      ], key, memory, 'dev_overhit_cross');
    case 'last_ditch_block_corner':
      return choose([
        `${attacker} finds a yard in the penalty area as ${attacking} threaten to break through.`,
        `${attacking} work the ball into the box and ${attacker} turns towards goal.`,
        `${attacker} takes the ball in a dangerous central position with defenders scrambling.`
      ], key, memory, 'dev_last_ditch');
    default:
      return `${attacking} try to work the ball into the final third.`;
  }
}

function duelLine({ flow, attacker, defender, keeper, memory }) {
  const key = `${flow.sequenceId}:duel`;
  switch (flow.subtype) {
    case 'interception':
      return choose([
        `${defender} reads the intention before ${attacker} can receive it and steps straight into the lane.`,
        `${defender} anticipates it superbly, moving across ${attacker} and taking the pass cleanly.`,
        `${defender} is alert to the danger and cuts the ball out before it reaches ${attacker}.`,
        `${defender} has seen that pass coming and gets there a fraction ahead of ${attacker}.`
      ], key, memory, 'duel_interception');
    case 'standing_tackle':
      return choose([
        `${defender} stays on his feet, waits for the touch and takes the ball cleanly from ${attacker}.`,
        `${defender} refuses to dive in and wins the one-against-one with a perfectly timed challenge.`,
        `${attacker} tries to shift it past him, but ${defender} gets a strong foot on the ball.`,
        `${defender} stands ${attacker} up and picks the exact moment to make the tackle.`
      ], key, memory, 'duel_standing');
    case 'sliding_tackle':
      return choose([
        `${defender} commits to the slide — and gets it absolutely right.`,
        `${defender} comes across at full stretch and hooks the ball away from ${attacker}.`,
        `${attacker} looks to be away, but ${defender} launches a perfectly timed recovery tackle.`,
        `${defender} slides across the danger and reaches the ball before ${attacker} can take the next touch.`
      ], key, memory, 'duel_slide');
    case 'poor_touch':
      return choose([
        `${attacker}'s first touch runs away from him and ${defender} reacts instantly.`,
        `${attacker} cannot bring it under control cleanly — ${defender} is onto the loose touch.`,
        `The control lets ${attacker} down at the crucial moment and ${defender} pounces.`
      ], key, memory, 'duel_touch');
    case 'overhit_pass':
      return choose([
        `The pass has too much weight and races beyond ${attacker}.`,
        `${creatorSafe(attacker)} cannot reach it — the ball is simply overhit.`,
        `The idea is right, but the execution is too heavy and the run is wasted.`
      ], key, memory, 'duel_overhit_pass');
    case 'forced_back':
      return choose([
        `${defender} closes the lane, shows ${attacker} away from goal and gives him nowhere to go.`,
        `${defender} matches the run and blocks off the route towards the area.`,
        `${attacker} tries to engage him, but ${defender} holds the ground and kills the forward momentum.`
      ], key, memory, 'duel_forced_back');
    case 'second_ball_win':
      return choose([
        `${defender} judges the bounce first and wins the second-ball duel.`,
        `${defender} gets his body between opponent and ball and comes away with it.`,
        `${defender} reacts quickest to the loose ball and secures possession.`
      ], key, memory, 'duel_second_ball');
    case 'press_regain':
      return choose([
        `${defender} arrives on the receiver's blind side and forces the turnover.`,
        `${defender} closes at speed, locks the passing lane and wins it high.`,
        `${defender} times the press perfectly and strips possession before the escape pass can be made.`
      ], key, memory, 'duel_press');
    case 'blocked_cross':
    case 'blocked_cross_corner':
      return choose([
        `${defender} gets out quickly and blocks the cross before it can enter the six-yard area.`,
        `${defender} throws himself into the delivery and stops it at source.`,
        `${attacker} tries to whip it around him, but ${defender} gets the block in.`,
        `${defender} closes the angle and takes the sting out of the cross.`
      ], key, memory, 'duel_block_cross');
    case 'defensive_header':
    case 'defensive_header_corner':
      return choose([
        `${defender} attacks the flight of the ball and wins the header decisively.`,
        `${defender} rises above the crowd and meets the cross first.`,
        `${defender} holds his position, judges the delivery and powers the header away.`
      ], key, memory, 'duel_header');
    case 'keeper_claim':
      return choose([
        `${keeper} comes through the traffic, takes it at the highest point and holds on.`,
        `${keeper} reads the delivery early and claims it confidently above the crowd.`,
        `${keeper} leaves his line, commands the area and gathers the cross cleanly.`
      ], key, memory, 'duel_claim');
    case 'overhit_cross':
      return choose([
        `The delivery is too deep and carries beyond every runner in the area.`,
        `${attacker} puts too much on the cross and nobody can keep it alive.`,
        `The cross sails beyond the far post with the runners unable to reach it.`
      ], key, memory, 'duel_overhit_cross');
    case 'offside_trap':
      return choose([
        `The back line step together just as ${attacker} makes his run.`,
        `${attacker} goes a fraction too early and the defence hold their line.`,
        `The defenders squeeze up in unison and leave ${attacker} beyond them.`
      ], key, memory, 'duel_offside');
    case 'last_ditch_block_corner':
      return choose([
        `${defender} throws himself across the danger and makes a huge block.`,
        `${defender} reacts desperately but brilliantly, getting his body between ${attacker} and goal.`,
        `${attacker} tries to force the opening, but ${defender} makes the last-ditch intervention.`
      ], key, memory, 'duel_last_ditch');
    default:
      return `${defender} reads the danger and stops the move.`;
  }
}

function creatorSafe(attacker) {
  return attacker || 'The runner';
}

function resolutionLine({ flow, attacking, defending, defender, keeper, memory }) {
  const key = `${flow.sequenceId}:resolution`;
  let line;
  switch (flow.outcome) {
    case 'corner_conceded':
      line = choose([
        `It goes behind. ${attacking} have the corner, but ${defending} have prevented the clear chance.`,
        `${defending} concede the corner rather than allow the move to develop any further.`,
        `Corner to ${attacking} — the defensive intervention was essential.`
      ], key, memory, 'res_corner');
      break;
    case 'keeper_possession':
      line = choose([
        `${keeper} slows everything down with the ball secure in his hands.`,
        `${defending} can push out now as ${keeper} takes control of the situation.`,
        `The attack ends with ${keeper} in possession and ${defending} able to reset.`
      ], key, memory, 'res_keeper');
      break;
    case 'offside':
      line = choose([
        `The flag is up immediately. The defensive line got that exactly right.`,
        `Offside. ${defending} step out and the move is killed before a shot can develop.`,
        `The assistant raises the flag — ${defending}'s line has done its job.`
      ], key, memory, 'res_offside');
      break;
    case 'recycled':
      line = choose([
        `${attacking} have to turn back and start the move again.`,
        `There is no route through, so ${attacking} recycle all the way out of the danger area.`,
        `${defending} force the attack backwards without needing to make a challenge.`
      ], key, memory, 'res_recycle');
      break;
    case 'ball_runs_safe':
      line = choose([
        `${defending} let it run harmlessly away and the attack is over.`,
        `The promising position comes to nothing and ${defending} can reset.`,
        `No touch is needed — the ball runs safe and the danger disappears.`
      ], key, memory, 'res_runs_safe');
      break;
    case 'possession_won':
      line = choose([
        `${defending} have turned defence into possession and can break the other way.`,
        `${defending} emerge with the ball and the momentum of the move has completely changed.`,
        `Turnover complete. ${defending} now have space to play forward.`
      ], key, memory, 'res_turnover');
      break;
    default:
      line = choose([
        `${defending} win the ball back and the attack is finished.`,
        `That intervention ends the move before it can become a chance.`,
        `${attacking} lose the momentum and ${defending} come away with possession.`
      ], key, memory, 'res_stopped');
      break;
  }

  if (hasTag(flow, 'repeat-defender') && defender) {
    line += ` ${defender} has read that danger well again.`;
  } else if (hasTag(flow, 'protecting-lead')) {
    line += ` That is exactly the sort of defending ${defending} need while protecting the lead.`;
  } else if (hasTag(flow, 'attack-frustration')) {
    line += ` ${attacking} are finding the final third increasingly difficult to unlock.`;
  } else if (hasTag(flow, 'pressure-resisted')) {
    line += ` ${defending} have survived another spell of pressure.`;
  }
  return line;
}

export function renderAuthoritativeFlowLines({ event, db, snapshot = {}, memory = createAuthoritativeFlowMemory() }) {
  const flow = event?.flow;
  if (!flow?.sequenceId) return event?.lines || [event?.text].filter(Boolean);
  if (memory.linesBySequence?.has(flow.sequenceId)) return memory.linesBySequence.get(flow.sequenceId);
  const attacking = clubName(db, flow.attackingClubId, 'The attacking side');
  const defending = clubName(db, flow.defendingClubId, 'The defending side');
  const attacker = playerName(db, flow.attackerId, 'The attacker');
  const creator = playerName(db, flow.creatorId, attacking);
  const defender = playerName(db, flow.defenderId, 'The defender');
  const keeper = playerName(db, flow.keeperId, 'The goalkeeper');
  const lines = [
    developmentLine({ flow, attacking, attacker, creator, memory }),
    duelLine({ flow, attacker, defender, keeper, memory }),
    resolutionLine({ flow, attacking, defending, defender, keeper, memory })
  ].filter(Boolean);
  if (memory.linesBySequence) memory.linesBySequence.set(flow.sequenceId, lines);
  return lines;
}

function minuteOfRow(row) {
  return parseInt(clean(row?.querySelector?.('b')?.textContent), 10) || 0;
}

function sourceRows(live) {
  return [...live.querySelectorAll('[data-commentary-feed] .flm-commentary-line')];
}

function memoryFor(live) {
  if (!memories.has(live)) memories.set(live, createAuthoritativeFlowMemory());
  return memories.get(live);
}

function isFlowEvent(event) {
  return Boolean(event?.flow?.sequenceId && FLOW_TYPES.has(event.type));
}

function pendingFlowEvents(snapshot, memory) {
  return (snapshot?.events || []).filter(event => isFlowEvent(event) && !memory.processedSequences.has(event.flow.sequenceId));
}

function protectRow(row, line, event, lineIndex) {
  let span = row.querySelector('span');
  if (!span) {
    span = document.createElement('span');
    row.appendChild(span);
  }
  if (clean(span.textContent) !== clean(line)) span.textContent = line;
  span.dataset.cv2Raw = line;
  span.dataset.cm332Raw = line;
  row.dataset.flAuthoritativeFlow = AUTHORITATIVE_FLOW_COMMENTARY_VERSION;
  row.dataset.flSequenceId = event.flow.sequenceId;
  row.dataset.flFlowPhase = event.flow.beats?.[lineIndex]?.phase || ['development', 'duel', 'resolution'][lineIndex] || 'resolution';
  row.dataset.flcV1 = '1';
  row.dataset.cv2Processed = '1';
  delete row.dataset.cv2Duplicate;
  delete row.dataset.cv3Duplicate;
  row.removeAttribute('aria-hidden');
}

function applyFlowRows(live, snapshot, db, memory) {
  const pending = pendingFlowEvents(snapshot, memory);
  if (!pending.length) return false;
  const rows = sourceRows(live);
  const groups = new Map();
  for (const event of pending) {
    const key = `${Number(event.minute)}|${event.type}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(event);
  }
  let changed = false;
  for (const [key, events] of groups) {
    const [minuteText, type] = key.split('|');
    const minute = Number(minuteText);
    const candidates = rows.filter(row => !row.dataset.flSequenceId && minuteOfRow(row) === minute && row.classList.contains(type));
    const rendered = events.map(event => ({ event, lines: renderAuthoritativeFlowLines({ event, db, snapshot, memory }) }));
    const expectedCount = rendered.reduce((sum, item) => sum + item.lines.length, 0);
    if (candidates.length < expectedCount) continue;
    const usable = candidates.length > expectedCount ? candidates.slice(-expectedCount) : candidates;
    let cursor = 0;
    for (const item of rendered) {
      item.event.lines = item.lines;
      item.event.text = item.lines.join(' ');
      item.lines.forEach((line, index) => {
        const row = usable[cursor++];
        if (!row) return;
        protectRow(row, line, item.event, index);
        memory.latestProtectedRow = row;
      });
      memory.processedSequences.add(item.event.flow.sequenceId);
      changed = true;
    }
  }
  return changed;
}

function createScaffoldRow(feed, event) {
  const row = document.createElement('div');
  row.className = `flm-commentary-line ${event.type || 'commentary'}`;
  row.dataset.flFlowScaffold = AUTHORITATIVE_FLOW_COMMENTARY_VERSION;
  const clock = document.createElement('b');
  clock.textContent = `${Math.max(0, Math.round(Number(event.minute) || 0))}'`;
  const span = document.createElement('span');
  row.append(clock, span);
  feed.appendChild(row);
  return row;
}

function ensureFlowRows(live, snapshot, db, memory) {
  const feed = live.querySelector('[data-commentary-feed]');
  if (!feed) return false;
  const pending = pendingFlowEvents(snapshot, memory);
  if (!pending.length) return false;
  const groups = new Map();
  for (const event of pending) {
    const key = `${Number(event.minute)}|${event.type}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(event);
  }
  let changed = false;
  for (const [key, events] of groups) {
    const [minuteText, type] = key.split('|');
    const minute = Number(minuteText);
    const expected = events.reduce((sum, event) => sum + renderAuthoritativeFlowLines({ event, db, snapshot, memory }).length, 0);
    const available = sourceRows(live).filter(row => !row.dataset.flSequenceId && minuteOfRow(row) === minute && row.classList.contains(type)).length;
    for (let index = available; index < expected; index += 1) {
      createScaffoldRow(feed, events[0]);
      changed = true;
    }
  }
  if (changed) feed.scrollTop = feed.scrollHeight;
  return changed;
}

function syncCentre(live, event, row, db) {
  if (!row || !event || live.dataset.cm44State === 'fulltime' || live.dataset.cm44FullTime === '1') return;
  const absoluteLatest = sourceRows(live).at(-1);
  if (row !== absoluteLatest) return;
  const text = clean(row.querySelector('span')?.textContent);
  const minute = clean(row.querySelector('b')?.textContent) || '—';
  const textNode = live.querySelector('[data-cm4-event-text]');
  if (textNode && clean(textNode.textContent) !== text) {
    textNode.textContent = text;
    textNode.dataset.cm44Text = text;
    textNode.setAttribute('aria-label', text);
  }
  const minuteNode = live.querySelector('[data-cm4-event-minute]');
  if (minuteNode && clean(minuteNode.textContent) !== minute) minuteNode.textContent = minute;
  const teamNode = live.querySelector('[data-cm4-event-team]');
  if (teamNode) teamNode.textContent = clubName(db, event.flow?.defendingClubId || event.clubId, 'MATCH UPDATE');
  const eventNode = live.querySelector('[data-cm4-event]');
  if (eventNode) {
    eventNode.dataset.cm44Type = 'commentary';
    eventNode.dataset.cm46Major = '0';
  }
}

async function syncLive(live) {
  const snapshot = window.__flmLiveStateV332;
  if (!snapshot || !live?.isConnected) return;
  const db = await database();
  if (!db) return;
  const memory = memoryFor(live);
  if (memory.latestProtectedRow && !memory.latestProtectedRow.isConnected) {
    memory.processedSequences.clear();
    memory.latestProtectedRow = null;
  }
  const changed = applyFlowRows(live, snapshot, db, memory);
  if (changed && memory.latestProtectedRow) {
    const event = [...(snapshot.events || [])].reverse().find(item => item?.flow?.sequenceId === memory.latestProtectedRow.dataset.flSequenceId);
    if (event) syncCentre(live, event, memory.latestProtectedRow, db);
  }
  live.dataset.authoritativeFlowCommentary = AUTHORITATIVE_FLOW_COMMENTARY_VERSION;
}

function sync() {
  queued = false;
  for (const live of document.querySelectorAll('.flm-live-match,[data-live-match]')) syncLive(live).catch(() => {});
}

function queue() {
  if (queued) return;
  queued = true;
  requestAnimationFrame(sync);
}

async function scaffoldSync() {
  scaffoldTimer = 0;
  const snapshot = window.__flmLiveStateV332;
  if (!snapshot) return;
  const db = await database();
  if (!db) return;
  let changed = false;
  for (const live of document.querySelectorAll('.flm-live-match,[data-live-match]')) {
    changed = ensureFlowRows(live, snapshot, db, memoryFor(live)) || changed;
  }
  if (changed) queue();
}

function queueScaffold() {
  if (scaffoldTimer) clearTimeout(scaffoldTimer);
  scaffoldTimer = setTimeout(() => scaffoldSync().catch(() => {}), ROW_GRACE_MS);
}

function bindFeedObserver(live, state) {
  if (!live?.isConnected) return;
  const feed = live.querySelector('[data-commentary-feed]');
  if (feed === state.feed) return;
  state.feedObserver?.disconnect();
  state.feed = feed || null;
  state.feedObserver = null;
  if (!feed) return;
  const observer = new MutationObserver(() => queue());
  observer.observe(feed, { childList: true, subtree: true, characterData: true });
  state.feedObserver = observer;
  queue();
}

function observeLive(live) {
  if (!live?.isConnected) return;
  let state = liveObservers.get(live);
  if (state) {
    bindFeedObserver(live, state);
    return;
  }
  state = { feed: null, feedObserver: null, shellObserver: null };
  const shellObserver = new MutationObserver(mutations => {
    if (mutations.some(mutation => mutation.addedNodes.length || mutation.removedNodes.length)) bindFeedObserver(live, state);
  });
  shellObserver.observe(live, { childList: true, subtree: true });
  state.shellObserver = shellObserver;
  liveObservers.set(live, state);
  bindFeedObserver(live, state);
}

function discoverLives(nodes = null) {
  if (!nodes) {
    for (const live of document.querySelectorAll('.flm-live-match,[data-live-match]')) observeLive(live);
    return;
  }
  for (const node of nodes) {
    if (node?.nodeType !== 1) continue;
    if (node.matches?.('.flm-live-match,[data-live-match]')) observeLive(node);
    for (const live of node.querySelectorAll?.('.flm-live-match,[data-live-match]') || []) observeLive(live);
  }
}

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  discoverLives();
  new MutationObserver(mutations => {
    for (const mutation of mutations) if (mutation.addedNodes.length) discoverLives(mutation.addedNodes);
  }).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('flm:live-state-v332', () => {
    queue();
    queueScaffold();
  });
  queue();
  window.FLMCommentaryAuthoritativeFlowV3 = Object.freeze({
    version: AUTHORITATIVE_FLOW_COMMENTARY_VERSION,
    refresh: queue
  });
}
