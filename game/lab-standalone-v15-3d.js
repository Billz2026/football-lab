const $ = (selector) => document.querySelector(selector);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (value) => {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};
const TAU = Math.PI * 2;
const GOAL = Object.freeze({ halfWidth: 3.66, width: 7.32, height: 2.44 });

const SCENARIOS = Object.freeze([
  { name:"THE OPENER", label:"20 YARDS · LEFT CHANNEL", distance:20, ballX:-2.7, wallPlayers:4, protectedX:-1.65, keeperX:0.72, wind:0.02, windVariance:0.012, keeper:0.18, aimSpeed:0.92 },
  { name:"CENTRAL TEST", label:"20 YARDS · CENTRAL", distance:20, ballX:0, wallPlayers:4, protectedX:-1.45, keeperX:0.86, wind:-0.035, windVariance:0.014, keeper:0.24, aimSpeed:0.98 },
  { name:"RIGHT CHANNEL", label:"22 YARDS · RIGHT CHANNEL", distance:22, ballX:3.2, wallPlayers:4, protectedX:1.75, keeperX:-0.76, wind:0.055, windVariance:0.016, keeper:0.29, aimSpeed:1.03 },
  { name:"FIVE-MAN TEST", label:"24 YARDS · CENTRAL · 5-MAN WALL", distance:24, ballX:-0.45, wallPlayers:5, protectedX:-1.3, keeperX:0.74, wind:-0.07, windVariance:0.018, keeper:0.35, aimSpeed:1.08 },
  { name:"BEND THE LINE", label:"26 YARDS · LEFT CHANNEL", distance:26, ballX:-4.8, wallPlayers:5, protectedX:-2.0, keeperX:0.92, wind:0.095, windVariance:0.022, keeper:0.40, aimSpeed:1.12 },
  { name:"REVERSE BEND", label:"27 YARDS · RIGHT CHANNEL", distance:27, ballX:5.2, wallPlayers:5, protectedX:2.05, keeperX:-0.94, wind:-0.11, windVariance:0.024, keeper:0.45, aimSpeed:1.16 },
  { name:"CROSSWIND", label:"30 YARDS · CENTRAL · CROSSWIND", distance:30, ballX:0.75, wallPlayers:5, protectedX:-1.1, keeperX:0.62, wind:0.16, windVariance:0.03, keeper:0.50, aimSpeed:1.20 },
  { name:"WIDE LEFT", label:"31 YARDS · WIDE LEFT", distance:31, ballX:-7.4, wallPlayers:5, protectedX:-2.35, keeperX:1.0, wind:-0.14, windVariance:0.03, keeper:0.54, aimSpeed:1.23 },
  { name:"WIDE RIGHT", label:"32 YARDS · WIDE RIGHT", distance:32, ballX:7.8, wallPlayers:5, protectedX:2.4, keeperX:-1.02, wind:0.18, windVariance:0.032, keeper:0.58, aimSpeed:1.27 },
  { name:"THE SIX", label:"34 YARDS · CENTRAL · 6-MAN WALL", distance:34, ballX:-0.8, wallPlayers:6, protectedX:-1.25, keeperX:0.7, wind:-0.19, windVariance:0.034, keeper:0.62, aimSpeed:1.31 },
  { name:"LONG LEFT", label:"36 YARDS · LEFT OF CENTRE", distance:36, ballX:-3.8, wallPlayers:5, protectedX:-1.8, keeperX:0.9, wind:0.21, windVariance:0.036, keeper:0.66, aimSpeed:1.35 },
  { name:"LONG RIGHT", label:"38 YARDS · RIGHT OF CENTRE", distance:38, ballX:4.2, wallPlayers:6, protectedX:1.9, keeperX:-0.92, wind:-0.22, windVariance:0.038, keeper:0.70, aimSpeed:1.39 },
  { name:"THE GALE", label:"40 YARDS · CENTRAL · HEAVY WIND", distance:40, ballX:0.35, wallPlayers:6, protectedX:-1.15, keeperX:0.64, wind:0.27, windVariance:0.045, keeper:0.74, aimSpeed:1.43 },
  { name:"FORTY-TWO WIDE", label:"42 YARDS · WIDE LEFT · 6-MAN WALL", distance:42, ballX:-8.2, wallPlayers:6, protectedX:-2.45, keeperX:1.05, wind:-0.25, windVariance:0.044, keeper:0.78, aimSpeed:1.47 },
  { name:"THE DISTANCE KING", label:"45 YARDS · CENTRAL · 6-MAN WALL", distance:45, ballX:-1.1, wallPlayers:6, protectedX:-1.2, keeperX:0.68, wind:0.30, windVariance:0.05, keeper:0.82, aimSpeed:1.52 }
]);

const KICKERS = Object.freeze([
  { id:"dax-ryder", name:"DAX RYDER", role:"POWER KICKER", accent:"#dafe4d", speed:1.12, error:1.12, curve:0.94, powerMeter:1.07, aimMeter:1.05, curveMeter:1.03, keeper:-0.025 },
  { id:"leo-vale", name:"LEO VALE", role:"PRECISION SPECIALIST", accent:"#74dcff", speed:0.96, error:0.66, curve:0.99, powerMeter:0.96, aimMeter:0.82, curveMeter:0.94, keeper:0.012 },
  { id:"zion-arc", name:"ZION ARC", role:"CURVE MASTER", accent:"#ff9bd4", speed:0.97, error:0.90, curve:1.22, powerMeter:1.00, aimMeter:0.98, curveMeter:0.82, keeper:0 },
  { id:"kai-mori", name:"KAI MORI", role:"COMPOSURE PLAYER", accent:"#c7b7ff", speed:0.98, error:0.82, curve:1.00, powerMeter:0.88, aimMeter:0.88, curveMeter:0.88, keeper:0.008 }
]);

const KEEPERS = Object.freeze([
  { id:"default", name:"MILO KENT", role:"BALANCED KEEPER", nickname:"THE FOUNDATION", accent:"#dafe4d", reaction:1.00, reachX:1.00, reachY:1.00, threshold:-0.01, central:0, low:0, high:0, pace:0, tracking:0, height:1.90 },
  { id:"reflex", name:"RAFA SOL", role:"REFLEX KEEPER", nickname:"QUICK HANDS", accent:"#67d9ff", reaction:0.74, reachX:0.93, reachY:0.95, threshold:0.025, central:0.07, low:0, high:0, pace:0, tracking:0.025, height:1.86 },
  { id:"giant", name:"BRUNO HALE", role:"GIANT KEEPER", nickname:"THE TOWER", accent:"#ffb36b", reaction:1.16, reachX:1.14, reachY:1.20, threshold:0.018, central:0.015, low:0.13, high:-0.035, pace:0, tracking:0.015, height:2.04 },
  { id:"reader", name:"ELI VOSS", role:"SHOT READER", nickname:"THE READER", accent:"#d2a7ff", reaction:0.88, reachX:1.01, reachY:1.00, threshold:0.020, central:0.025, low:0, high:0, pace:0.115, tracking:0.13, height:1.91 },
  { id:"aggressive", name:"JAX MERCER", role:"AGGRESSIVE KEEPER", nickname:"THE CLOSER", accent:"#ff718f", reaction:0.90, reachX:1.00, reachY:0.97, threshold:0.015, central:0.105, low:0, high:0.085, pace:0, tracking:0.07, height:1.90 }
]);

const WALLS = Object.freeze([
  { id:"default", name:"ACADEMY LINE", role:"BALANCED WALL", nickname:"THE BASICS", accent:"#7ca98b", secondary:"#355044", spacing:0.56, count:0, radius:1.00, jump:1.00, tracking:0, stagger:0 },
  { id:"compact", name:"IRON BLOCK", role:"COMPACT WALL", nickname:"THE LOCK", accent:"#63d49a", secondary:"#234c38", spacing:0.49, count:0, radius:1.08, jump:0.98, tracking:0.035, stagger:0.004 },
  { id:"leaping", name:"SKYLINE FOUR", role:"LEAPING WALL", nickname:"THE LEAPERS", accent:"#ffb457", secondary:"#60411d", spacing:0.58, count:0, radius:0.98, jump:1.36, tracking:0.02, stagger:0.006 },
  { id:"reading", name:"VECTOR UNIT", role:"READING WALL", nickname:"THE READERS", accent:"#b995ff", secondary:"#463263", spacing:0.54, count:0, radius:1.03, jump:1.08, tracking:0.18, stagger:0.006 },
  { id:"staggered", name:"BROKEN RHYTHM", role:"STAGGERED WALL", nickname:"THE STAGGER", accent:"#ff718f", secondary:"#632535", spacing:0.60, count:1, radius:1.02, jump:1.16, tracking:0.07, stagger:0.026 }
]);

const dom = Object.freeze({
  stage:$("#labStage"), kicker:$("#labKicker"), keeper:$("#labKeeper"), wall:$("#labWall"), tier:$("#labTier"), wind:$("#labWind"),
  apply:$("#labApply"), reset:$("#labReset"), copy:$("#labCopy"), summary:$("#labMatchupSummary"),
  shots:$("#labShots"), goalRate:$("#labGoalRate"), saves:$("#labSaves"), wallBlocks:$("#labWallBlocks"), frameHits:$("#labFrameHits"), misses:$("#labMisses"),
  pace:$("#labAveragePace"), clearance:$("#labAverageClearance"), margin:$("#labAverageMargin"), last:$("#labLastResult"),
  canvas:$("#gameCanvas"), phaseTitle:$("#phaseTitle"), phaseHelp:$("#phaseHelp"), action:$("#shotAction"),
  powerReadout:$("#powerReadout"), aimReadout:$("#aimReadout"), curveReadout:$("#curveReadout"), meterFill:$("#meterFill"), meterMarker:$("#meterMarker"), meterLabel:$("#meterLabel"), meterNumber:$("#meterNumber"),
  stageNumber:$("#stageNumber"), stageName:$("#stageName"), score:$("#scoreValue"), goals:$("#streakValue"), windArrow:$("#windArrow"), windValue:$("#windValue"), result:$("#resultBanner"), prompt:$("#canvasPrompt"), exit:$("#exitGame")
});
const ctx = dom.canvas.getContext("2d");

const state = {
  stageIndex:0, scenario:SCENARIOS[0], kicker:KICKERS[0], keeper:KEEPERS[0], wall:WALLS[0], tier:1, wind:null, stageWind:0,
  phase:"ready", meterClock:0, meterValue:0, shot:null, animation:null, frameId:0, lastTime:performance.now(), resetTimer:null,
  stats:null, canvas:{ dpr:1, scale:1, x:0, y:0 }
};

function emptyStats() {
  return { shots:0, goals:0, saves:0, wallBlocks:0, frameHits:0, misses:0, paceTotal:0, paceCount:0, clearTotal:0, clearCount:0, marginTotal:0, marginCount:0, last:null };
}

function addOption(select, value, label) {
  const option = document.createElement("option");
  option.value = String(value);
  option.textContent = label;
  select.append(option);
}

function populate() {
  SCENARIOS.forEach((scenario, index) => addOption(dom.stage, index, `STAGE ${index + 1} · ${scenario.distance} YDS · ${scenario.name}`));
  KICKERS.forEach((item) => addOption(dom.kicker, item.id, `${item.name} · ${item.role}`));
  addOption(dom.keeper, "default", "STAGE DEFAULT");
  KEEPERS.slice(1).forEach((item) => addOption(dom.keeper, item.id, `${item.name} · ${item.role}`));
  addOption(dom.wall, "default", "STAGE DEFAULT");
  WALLS.slice(1).forEach((item) => addOption(dom.wall, item.id, `${item.name} · ${item.role}`));
  [1,2,3,4].forEach((tier) => addOption(dom.tier, tier, `TIER ${tier}`));
  [["stage","SCENARIO WIND"],[0,"CALM"],[-0.35,"3.5 M/S LEFT"],[-0.25,"2.5 M/S LEFT"],[-0.15,"1.5 M/S LEFT"],[0.15,"1.5 M/S RIGHT"],[0.25,"2.5 M/S RIGHT"],[0.35,"3.5 M/S RIGHT"]].forEach(([value,label]) => addOption(dom.wind,value,label));
}

function idealPower() {
  return clamp(0.63 + (state.scenario.distance - 18) * 0.0082, 0.66, 0.86);
}
function strikeQuality(power) {
  const deviation = Math.abs(power - idealPower());
  if (deviation <= 0.035) return 1;
  return 1 - smooth(clamp((deviation - 0.035) / 0.28, 0, 1));
}
function qualityLabel(power) {
  const quality = strikeQuality(power);
  if (quality >= 0.9) return "PERFECT";
  if (quality >= 0.68) return "CLEAN";
  if (quality >= 0.38) return "RISKY";
  return power < idealPower() ? "UNDERHIT" : "OVERHIT";
}
function aimTarget() {
  const sweep = (Math.sin(state.meterClock * 2.22 * state.scenario.aimSpeed - Math.PI / 2) + 1) / 2;
  const x = 0.065 + smooth(sweep) * 0.87;
  const power = state.shot?.power ?? idealPower();
  const delta = clamp((power - idealPower()) / 0.34, -1.35, 1.15);
  const y = clamp(0.47 - delta * 0.255 - Math.sign(delta) * delta * delta * 0.055, 0.12, 0.83);
  const horizontal = x < 0.33 ? "LEFT" : x > 0.67 ? "RIGHT" : "CENTRE";
  const vertical = y < 0.31 ? "HIGH" : y > 0.59 ? "LOW" : "MID";
  return { x, y, label:`${vertical} ${horizontal}` };
}

function setPhase(phase) {
  state.phase = phase;
  state.meterClock = 0;
  state.meterValue = phase === "curve" ? 0.5 : 0;
  const copy = {
    ready:["READY","The selected matchup repeats after every attempt.","START SHOT","SHOT METER"],
    power:["SET POWER","Stop inside the clean contact zone.","LOCK POWER","POWER"],
    aim:["PICK YOUR SIDE","Read the keeper and wall before committing.","LOCK PLACEMENT","PLACEMENT"],
    curve:["ADD CURVE","Counter the wind and bend around the wall.","TAKE SHOT","CURVE"],
    shooting:["WATCH THE FLIGHT","The fixed matchup is being resolved.","SHOT IN PLAY","LOCKED"],
    result:["SHOT COMPLETE","The same matchup will reset automatically.","NEXT SHOT","RESULT"]
  }[phase];
  dom.phaseTitle.textContent = copy[0]; dom.phaseHelp.textContent = copy[1]; dom.action.textContent = copy[2]; dom.meterLabel.textContent = copy[3];
  dom.action.disabled = phase === "shooting";
  dom.prompt.textContent = phase === "ready" ? state.scenario.label : phase === "shooting" ? "SHOT IN PLAY" : copy[2];
  document.querySelectorAll(".shot-step").forEach((step,index) => {
    const phases = ["power","aim","curve"];
    const phaseIndex = phases.indexOf(phase);
    step.classList.toggle("is-current", (phase === "ready" && index === 0) || phaseIndex === index);
    step.classList.toggle("is-complete", phaseIndex > index || ["shooting","result"].includes(phase));
  });
}

function resolveWall(path, targetX) {
  const scenario = state.scenario;
  const wall = state.wall;
  const distanceM = scenario.distance * 0.9144;
  const wallZ = Math.max(4, distanceM - 9.15);
  const ratio = wallZ / distanceM;
  const centreX = lerp(targetX, scenario.ballX, ratio) + (targetX - scenario.protectedX) * wall.tracking;
  const count = Math.max(2, scenario.wallPlayers + wall.count);
  const start = -((count - 1) * wall.spacing) / 2;
  const tierScale = 1 + (state.tier - 1) * 0.02;
  const players = Array.from({length:count},(_,index) => ({ index, x:centreX + start + index * wall.spacing, z:wallZ, timing:(index - (count - 1) / 2) * wall.stagger }));
  let closest = null;
  let collision = null;
  path.forEach((point,index) => {
    players.forEach((player) => {
      const progress = index / Math.max(1,path.length - 1);
      const pass = ratio;
      const jumpPulse = Math.max(0,Math.sin(clamp((progress - pass + 0.11 - player.timing) / 0.23,0,1) * Math.PI));
      const height = 1.84 + 0.34 * wall.jump * tierScale * jumpPulse;
      const radius = 0.35 * wall.radius * tierScale;
      const ground = Math.hypot(point.x - player.x, point.z - player.z);
      const clearance = point.y - height - 0.11;
      const lateral = ground - radius - 0.11;
      const score = Math.hypot(Math.max(0,lateral),Math.abs(point.z-player.z));
      if (!closest || score < closest.score) closest = { score, clearance, lateral, playerIndex:index, players, centreX, wallZ };
      if (!collision && ground <= radius + 0.11 && point.y <= height + 0.11 && point.y >= 0.03) collision = { index, point:{...point}, playerIndex:player.index, players, centreX, wallZ };
    });
  });
  return { collision, clearance:closest?.clearance ?? null, lane:closest && closest.lateral > 0.18 ? "AROUND" : "OVER", players, centreX, wallZ };
}

function resolveShot() {
  const scenario = state.scenario;
  const shot = state.shot;
  const power = clamp(shot.power,0,1);
  const quality = strikeQuality(power);
  const rawCurve = clamp(shot.curve * state.kicker.curve,-1.15,1.15);
  const signedCurve = Math.sign(rawCurve) * Math.pow(Math.abs(rawCurve),1.32);
  const selectedX = -GOAL.halfWidth + shot.aimX * GOAL.width;
  const selectedY = GOAL.height * (1 - shot.aimY);
  const finalCurve = signedCurve * (0.19 + scenario.distance * 0.0052);
  const finalWind = state.stageWind * (0.21 + scenario.distance * 0.006);
  const error = (1 - quality) * 0.17 * state.kicker.error * (((state.stageIndex + (shot.aimX > .5 ? 1 : 0)) % 2) ? -1 : 1);
  const underhit = power < 0.33 ? smooth((0.33-power)/0.33) * 0.19 : 0;
  const overhit = power > 0.89 ? smooth((power-0.89)/0.11) * 0.125 : 0;
  const target = { x:selectedX + finalCurve + finalWind + error, y:selectedY - underhit * GOAL.height + overhit * GOAL.height, z:0 };
  shot.speed = lerp(15.5,36.5,smooth(power)) * lerp(0.86,1,quality) * state.kicker.speed;
  const distanceM = scenario.distance * 0.9144;
  const arcHeight = clamp(0.82 + distanceM * 0.0175 + (0.69-power)*0.58 + Math.max(0,target.y-1.05)*0.1,0.9,1.62);
  const curveBulge = signedCurve * (0.45 + distanceM * 0.0195);
  const windBulge = state.stageWind * (0.42 + distanceM * 0.0135);
  const path = Array.from({length:181},(_,index) => {
    const t=index/180;
    return { x:lerp(scenario.ballX,target.x,t)+curveBulge*Math.sin(Math.PI*t)*Math.pow(t,1.18)+windBulge*Math.sin(Math.PI*t)*Math.pow(t,1.42), y:Math.max(0.03,lerp(0.11,target.y,t)+arcHeight*4*t*(1-t)), z:lerp(distanceM,0,t) };
  });
  const wallResult = resolveWall(path,target.x);
  shot.wall = wallResult;
  if (wallResult.collision) {
    shot.outcome="WALL"; shot.impact=wallResult.collision; shot.path=path.slice(0,wallResult.collision.index+1); shot.reason="Trajectory intersected the wall.";
  } else {
    const nearPost = Math.abs(Math.abs(target.x)-GOAL.halfWidth) <= 0.14 && target.y >= -0.14 && target.y <= GOAL.height+0.14;
    const nearBar = Math.abs(target.y-GOAL.height) <= 0.14 && target.x >= -GOAL.halfWidth-0.14 && target.x <= GOAL.halfWidth+0.14;
    const inside = target.x > -GOAL.halfWidth+0.11 && target.x < GOAL.halfWidth-0.11 && target.y > 0.08 && target.y < GOAL.height-0.08;
    if (nearPost) { shot.outcome="POST"; shot.path=path; shot.reason="Final target clipped the post."; }
    else if (nearBar) { shot.outcome="BAR"; shot.path=path; shot.reason="Final target clipped the crossbar."; }
    else if (!inside) { shot.outcome="MISS"; shot.path=path; shot.reason=target.y>GOAL.height?"Shot finished above the crossbar.":"Shot finished outside the posts."; }
    else {
      const keeper = state.keeper;
      const keeperX = lerp(scenario.keeperX,target.x,keeper.tracking);
      const dx=target.x-keeperX, dy=target.y-1.08;
      const tierReach=1+(state.tier-1)*0.018;
      const skill=clamp(0.34+scenario.keeper*0.66+(state.tier-1)*0.012,0.4,0.95);
      const flight=distanceM/Math.max(15,shot.speed);
      const reaction=clamp(lerp(0.32,0.115,skill)*keeper.reaction,0.085,0.42);
      const available=Math.min(0.6,Math.max(0,flight-reaction));
      const reachX=(0.98+skill*1.18+available*lerp(1.6,2.45,skill))*keeper.reachX*tierReach;
      const reachY=(0.72+skill*0.88+available*lerp(0.56,0.86,skill))*keeper.reachY*tierReach;
      const reachScore=Math.sqrt((dx/reachX)**2+(dy/reachY)**2);
      const central=Math.abs(target.x)/GOAL.halfWidth<0.38;
      const low=target.y<GOAL.height*0.34, high=target.y>GOAL.height*0.68;
      const paceFactor=smooth(clamp((shot.speed-27)/10,0,1));
      const threshold=clamp(0.84+skill*0.15+lerp(0.14,-0.11,smooth(power))+(1-quality)*0.11+keeper.threshold+state.kicker.keeper+(central?keeper.central:0)-(low?keeper.low:0)-(high?keeper.high:0)-paceFactor*keeper.pace,0.72,1.12);
      shot.keeper={ startX:keeperX, contactX:target.x, contactY:target.y, reachScore, threshold, reaction, flight };
      if (reachScore<=threshold) { shot.outcome="SAVE"; shot.saveType=reachScore<0.53&&shot.speed<27.5?"CATCH":"PARRY"; shot.reason=shot.saveType==="CATCH"?"Pace and placement allowed a clean catch.":"The goalkeeper reached the ball and parried it."; }
      else { shot.outcome="GOAL"; shot.reason="Placement, pace and curve beat the goalkeeper."; }
      shot.path=path;
    }
  }
  shot.target=target; shot.quality=quality; shot.topCorner=shot.outcome==="GOAL"&&target.y>GOAL.height*.71&&Math.abs(target.x)>GOAL.halfWidth*.55;
  shot.diagnostics={ outcome:shot.outcome,powerPercent:Math.round(power*100),speedMps:shot.speed,wallClearanceMetres:wallResult.clearance,keeperReachScore:shot.keeper?.reachScore??null,keeperThreshold:shot.keeper?.threshold??null,reason:shot.reason };
  return clamp(distanceM/Math.max(15,shot.speed)*1000,650,1380)+(["WALL","SAVE","POST","BAR"].includes(shot.outcome)?280:100);
}

function resetAttempt() {
  clearTimeout(state.resetTimer); state.animation=null; state.shot={ power:null,aimX:null,aimY:null,curve:null,path:[],outcome:null };
  dom.powerReadout.textContent="—"; dom.aimReadout.textContent="—"; dom.curveReadout.textContent="—"; dom.result.textContent=""; dom.result.className="result-banner";
  setPhase("ready"); renderHud(); renderOnce();
}

function renderHud() {
  dom.stageNumber.textContent=`STAGE ${String(state.stageIndex+1).padStart(2,"0")} · ${state.scenario.distance} YDS`;
  dom.stageName.textContent=state.scenario.name; dom.score.textContent=String(state.stats.shots); dom.goals.textContent=String(state.stats.goals);
  dom.windArrow.textContent=state.stageWind<-.015?"←":state.stageWind>.015?"→":"•"; dom.windValue.textContent=`${Math.abs(state.stageWind*10).toFixed(1)} m/s`;
}
function renderStats() {
  const s=state.stats; dom.shots.textContent=s.shots; dom.goalRate.textContent=s.shots?`${Math.round(s.goals/s.shots*100)}%`:"0%"; dom.saves.textContent=s.saves; dom.wallBlocks.textContent=s.wallBlocks; dom.frameHits.textContent=s.frameHits; dom.misses.textContent=s.misses;
  dom.pace.textContent=s.paceCount?`${(s.paceTotal/s.paceCount).toFixed(1)} m/s`:"—"; dom.clearance.textContent=s.clearCount?`${(s.clearTotal/s.clearCount).toFixed(2)} m`:"—"; dom.margin.textContent=s.marginCount?(s.marginTotal/s.marginCount).toFixed(3):"—";
  dom.last.textContent=s.last?`${s.last.outcome} · ${s.last.powerPercent}% power · ${s.last.speedMps.toFixed(1)} m/s · ${s.last.reason}`:"No shots recorded."; renderHud();
}
function record() {
  const d=state.shot.diagnostics,s=state.stats;s.shots++;s.goals+=d.outcome==="GOAL";s.saves+=d.outcome==="SAVE";s.wallBlocks+=d.outcome==="WALL";s.frameHits+=["POST","BAR"].includes(d.outcome);s.misses+=d.outcome==="MISS";
  s.paceTotal+=d.speedMps;s.paceCount++;if(Number.isFinite(d.wallClearanceMetres)){s.clearTotal+=d.wallClearanceMetres;s.clearCount++;}if(Number.isFinite(d.keeperReachScore)&&Number.isFinite(d.keeperThreshold)){s.marginTotal+=d.keeperReachScore-d.keeperThreshold;s.marginCount++;}s.last=d;window.__footballLabMatchupStats={...s};renderStats();
}

function resize() {
  const rect=dom.canvas.getBoundingClientRect();state.canvas.dpr=clamp(devicePixelRatio||1,1,2);dom.canvas.width=Math.round(rect.width*state.canvas.dpr);dom.canvas.height=Math.round(rect.height*state.canvas.dpr);state.canvas.scale=Math.min(rect.width/1200,rect.height/720);state.canvas.x=(rect.width-1200*state.canvas.scale)/2;state.canvas.y=(rect.height-720*state.canvas.scale)/2;
}
function point(world) {
  const distanceM=state.scenario.distance*.9144;const depth=clamp(world.z/Math.max(1,distanceM),-.1,1.15);const scale=.58+depth*.68;return{x:600+world.x*40*scale,y:242+depth*360-world.y*82*scale,scale};
}
function actor(world,height,shirt,pose={}) {
  const p=point(world),size=clamp(52*p.scale*(height/1.84),28,108),foot=p.y-(pose.lift||0)*size,body=size*.56,lean=(pose.lean||0)*size*.35;ctx.save();ctx.lineCap="round";ctx.strokeStyle="#07110b";ctx.lineWidth=Math.max(4,size*.095);ctx.beginPath();ctx.moveTo(p.x-size*.11,foot-body*.06);ctx.lineTo(p.x-size*.15-(pose.leftLeg||0)*size*.13,foot);ctx.moveTo(p.x+size*.11,foot-body*.06);ctx.lineTo(p.x+size*.15+(pose.rightLeg||0)*size*.13,foot);ctx.stroke();ctx.fillStyle=shirt;ctx.lineWidth=Math.max(2,size*.035);ctx.beginPath();ctx.roundRect(p.x-size*.23+lean,foot-body,size*.46,body*.78,size*.1);ctx.fill();ctx.stroke();ctx.strokeStyle="#c99774";ctx.lineWidth=Math.max(4,size*.075);ctx.beginPath();ctx.moveTo(p.x-size*.18+lean,foot-body*.78);ctx.lineTo(p.x-size*(.34+(pose.arm||0)*.12),foot-body*.33);ctx.moveTo(p.x+size*.18+lean,foot-body*.78);ctx.lineTo(p.x+size*(.34+(pose.arm||0)*.12),foot-body*.33);ctx.stroke();ctx.fillStyle="#c99774";ctx.strokeStyle="#07110b";ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x+lean*.4,foot-body-size*.12,size*.13,0,TAU);ctx.fill();ctx.stroke();ctx.restore();
}
function samplePath(progress) { const path=state.shot?.path;if(!path?.length)return null;const scaled=clamp(progress,0,1)*(path.length-1),a=Math.floor(scaled),b=Math.min(path.length-1,a+1),m=scaled-a;return{x:lerp(path[a].x,path[b].x,m),y:lerp(path[a].y,path[b].y,m),z:lerp(path[a].z,path[b].z,m)}; }
function animationProgress(time) { const a=state.animation;if(!a)return{run:0,flight:0,settle:0,complete:false};const elapsed=time-a.startedAt,flightStart=a.runUp+a.hold,flightEnd=flightStart+a.flight;return{run:clamp(elapsed/a.runUp,0,1),flight:clamp((elapsed-flightStart)/a.flight,0,1),settle:clamp((elapsed-flightEnd)/a.settle,0,1),complete:elapsed>=a.total}; }
function render(time=performance.now()) {
  ctx.setTransform(state.canvas.dpr*state.canvas.scale,0,0,state.canvas.dpr*state.canvas.scale,state.canvas.dpr*state.canvas.x,state.canvas.dpr*state.canvas.y);ctx.clearRect(0,0,1200,720);const pr=animationProgress(time);const bg=ctx.createLinearGradient(0,0,0,720);bg.addColorStop(0,"#06160d");bg.addColorStop(.42,"#0b2116");bg.addColorStop(1,"#164b2c");ctx.fillStyle=bg;ctx.fillRect(0,0,1200,720);ctx.fillStyle="rgba(1,6,3,.74)";ctx.fillRect(0,85,1200,180);ctx.fillStyle="#174f2e";ctx.beginPath();ctx.moveTo(75,720);ctx.lineTo(1125,720);ctx.lineTo(940,250);ctx.lineTo(260,250);ctx.closePath();ctx.fill();ctx.strokeStyle="rgba(225,242,222,.65)";ctx.lineWidth=2;ctx.strokeRect(270,347,660,188);ctx.strokeStyle="#f6faf4";ctx.lineWidth=6;ctx.strokeRect(430,190,340,160);ctx.lineWidth=1;ctx.strokeStyle="rgba(236,246,233,.22)";for(let x=464;x<770;x+=34){ctx.beginPath();ctx.moveTo(x,190);ctx.lineTo(x,350);ctx.stroke();}for(let y=222;y<350;y+=32){ctx.beginPath();ctx.moveTo(430,y);ctx.lineTo(770,y);ctx.stroke();}
  const wallData=state.shot?.wall||resolveWall([{x:state.scenario.ballX,y:.1,z:state.scenario.distance*.9144}],state.scenario.protectedX);wallData.players.forEach((player,index)=>actor({x:player.x,z:player.z,y:0},1.84,index%2?state.wall.secondary:state.wall.accent,{lift:Math.max(0,Math.sin(clamp((pr.flight-.38-player.timing)/.3,0,1)*Math.PI))*.35*state.wall.jump,lean:state.shot?.outcome==="WALL"&&state.shot?.impact?.playerIndex===index?pr.settle*.4:0}));
  let keeperPos={x:state.scenario.keeperX,z:.3,y:0},dive=0;if(state.shot?.keeper&&pr.flight>0){const k=state.shot.keeper;dive=smooth((pr.flight-clamp(k.reaction/k.flight,0,.85))/Math.max(.12,1-clamp(k.reaction/k.flight,0,.85)));keeperPos.x=lerp(k.startX,k.contactX,dive*.78);}actor(keeperPos,state.keeper.height,state.keeper.accent,{lean:state.shot?.keeper?Math.sign(state.shot.keeper.contactX-state.shot.keeper.startX||1)*dive*.65:0,lift:Math.sin(dive*Math.PI)*.2,arm:dive});
  const distanceM=state.scenario.distance*.9144,run=smooth(pr.run);actor({x:lerp(state.scenario.ballX-.8,state.scenario.ballX-.25,run),z:lerp(distanceM+1.8,distanceM+.4,run),y:0},1.82,state.kicker.accent,{lean:run*.13,leftLeg:Math.sin(run*Math.PI*4)*.28,rightLeg:-Math.sin(run*Math.PI*4)*.28+(pr.flight>0?Math.max(0,1-pr.flight*4)*.7:0),arm:run*.15});
  const ball=pr.flight>0?samplePath(pr.flight):{x:state.scenario.ballX,y:.11,z:distanceM},bp=point(ball),radius=clamp(8*bp.scale,5,13);ctx.fillStyle="#f7faf5";ctx.strokeStyle="#0a100c";ctx.lineWidth=2;ctx.beginPath();ctx.arc(bp.x,bp.y,radius,0,TAU);ctx.fill();ctx.stroke();if(state.phase==="aim"){const t=aimTarget(),x=430+t.x*340,y=190+t.y*160;ctx.strokeStyle=state.kicker.accent;ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,22,0,TAU);ctx.moveTo(x-30,y);ctx.lineTo(x+30,y);ctx.moveTo(x,y-30);ctx.lineTo(x,y+30);ctx.stroke();}
  ctx.fillStyle="rgba(2,8,4,.76)";ctx.beginPath();ctx.roundRect(18,670,500,32,10);ctx.fill();ctx.fillStyle="#f0f7ed";ctx.font="850 11px system-ui";ctx.fillText(`${state.kicker.name} · ${state.keeper.nickname} · ${state.wall.nickname}`,32,691);
  if(pr.complete&&state.animation){state.animation=null;record();setPhase("result");dom.result.textContent=state.shot.outcome==="SAVE"?(state.shot.saveType==="CATCH"?"HELD":"PARRIED"):(state.shot.outcome==="BAR"?"CROSSBAR":state.shot.outcome);dom.result.className=`result-banner is-visible${state.shot.outcome==="GOAL"?"":" is-miss"}`;state.resetTimer=setTimeout(resetAttempt,1250);}
}
function renderOnce(){requestAnimationFrame(render);}
function updateMeter(delta){if(!["power","aim","curve"].includes(state.phase))return;state.meterClock+=delta;const tierPressure=1+(state.tier-1)*.035;if(state.phase==="power")state.meterValue=(Math.sin(state.meterClock*(3.35+state.scenario.aimSpeed*.18)*state.kicker.powerMeter*tierPressure-Math.PI/2)+1)/2;else if(state.phase==="aim")state.meterValue=aimTarget().x;else state.meterValue=(Math.sin(state.meterClock*(2.78+state.scenario.aimSpeed*.2)*state.kicker.curveMeter*tierPressure)+1)/2;const pct=state.meterValue*100;dom.meterFill.style.width=`${pct}%`;dom.meterMarker.style.left=`${pct}%`;dom.meterNumber.textContent=state.phase==="aim"?aimTarget().label:state.phase==="curve"?`${state.meterValue<.44?"L":state.meterValue>.56?"R":"C"} ${Math.round(Math.abs((state.meterValue-.5)*2)*100)}%`:`${qualityLabel(state.meterValue)} ${Math.round(pct)}%`;}
function loop(time){state.frameId=0;const delta=Math.min((time-state.lastTime)/1000,.05);state.lastTime=time;updateMeter(delta);render(time);if(state.animation||["power","aim","curve"].includes(state.phase))state.frameId=requestAnimationFrame(loop);}
function ensureLoop(){if(!state.frameId){state.lastTime=performance.now();state.frameId=requestAnimationFrame(loop);}}
function action(){if(state.animation)return;if(["ready","result"].includes(state.phase)){resetAttempt();setPhase("power");ensureLoop();return;}if(state.phase==="power"){state.shot.power=state.meterValue;dom.powerReadout.textContent=`${Math.round(state.shot.power*100)}% · ${qualityLabel(state.shot.power)}`;setPhase("aim");return;}if(state.phase==="aim"){const t=aimTarget();state.shot.aimX=t.x;state.shot.aimY=t.y;dom.aimReadout.textContent=t.label;setPhase("curve");return;}if(state.phase==="curve"){state.shot.curve=(state.meterValue-.5)*2;dom.curveReadout.textContent=Math.abs(state.shot.curve)<.12?"STRAIGHT":`${state.shot.curve<0?"LEFT":"RIGHT"} ${Math.round(Math.abs(state.shot.curve)*100)}%`;setPhase("shooting");const flight=resolveShot();const settle=["WALL","SAVE","POST","BAR"].includes(state.shot.outcome)?320:260,startedAt=performance.now();state.animation={startedAt,runUp:560,hold:64,flight,settle,total:560+64+flight+settle};ensureLoop();}}

function applyMatchup(){state.stageIndex=clamp(Number(dom.stage.value)||0,0,14);state.scenario=SCENARIOS[state.stageIndex];state.kicker=KICKERS.find(x=>x.id===dom.kicker.value)||KICKERS[0];state.keeper=KEEPERS.find(x=>x.id===dom.keeper.value)||KEEPERS[0];state.wall=WALLS.find(x=>x.id===dom.wall.value)||WALLS[0];state.tier=clamp(Number(dom.tier.value)||1,1,4);state.wind=dom.wind.value==="stage"?null:Number(dom.wind.value);const gust=Math.sin((state.stageIndex+1)*1.73)*state.scenario.windVariance;state.stageWind=Number.isFinite(state.wind)?state.wind:clamp(state.scenario.wind+gust,-.36,.36);state.stats=emptyStats();renderStats();dom.summary.innerHTML=`<strong>${state.kicker.name} VS ${state.keeper.name}</strong>${state.wall.name} · Tier ${state.tier} defence · ${state.scenario.distance} yards · ${Math.abs(state.stageWind*10).toFixed(1)} m/s wind`;resetAttempt();resize();renderOnce();}
async function copyResults(){const s=state.stats,text=["FOOTBALL LAB · MATCHUP TEST",`Stage: ${state.stageIndex+1} · ${state.scenario.distance} yards`,`Kicker: ${state.kicker.name}`,`Goalkeeper: ${state.keeper.name} · Tier ${state.tier}`,`Wall: ${state.wall.name} · Tier ${state.tier}`,`Shots: ${s.shots}`,`Goal rate: ${s.shots?Math.round(s.goals/s.shots*100):0}%`,`Saves: ${s.saves}`,`Wall blocks: ${s.wallBlocks}`,`Frame hits: ${s.frameHits}`,`Misses: ${s.misses}`].join("\n");try{await navigator.clipboard.writeText(text);const old=dom.copy.textContent;dom.copy.textContent="COPIED";setTimeout(()=>dom.copy.textContent=old,900);}catch{console.info(text);}}

populate();state.stats=emptyStats();dom.apply.addEventListener("click",applyMatchup);dom.reset.addEventListener("click",()=>{state.stats=emptyStats();renderStats();});dom.copy.addEventListener("click",copyResults);dom.action.addEventListener("click",action);dom.canvas.addEventListener("pointerdown",action);dom.exit.addEventListener("click",()=>location.href="./index.html");window.addEventListener("keydown",event=>{if(event.code==="Space"){event.preventDefault();action();}});window.addEventListener("resize",()=>{resize();renderOnce();});applyMatchup();window.__footballLabStandaloneLabReady=true;document.body.dataset.labReady="true";
