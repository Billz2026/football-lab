document.body.dataset.labReady = "true";
window.__footballLabStandaloneLabReady = true;

const $ = (selector) => document.querySelector(selector);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (value) => {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};

const SCENARIOS = [
  ["THE OPENER",20,-2.7,4,-1.65,0.02,0.18,0.92],
  ["CENTRAL TEST",20,0,4,-1.45,-0.035,0.24,0.98],
  ["RIGHT CHANNEL",22,3.2,4,1.75,0.055,0.29,1.03],
  ["FIVE-MAN TEST",24,-0.45,5,-1.3,-0.07,0.35,1.08],
  ["BEND THE LINE",26,-4.8,5,-2,0.095,0.4,1.12],
  ["REVERSE BEND",27,5.2,5,2.05,-0.11,0.45,1.16],
  ["CROSSWIND",30,0.75,5,-1.1,0.16,0.5,1.2],
  ["WIDE LEFT",31,-7.4,5,-2.35,-0.14,0.54,1.23],
  ["WIDE RIGHT",32,7.8,5,2.4,0.18,0.58,1.27],
  ["THE SIX",34,-0.8,6,-1.25,-0.19,0.62,1.31],
  ["LONG LEFT",36,-3.8,5,-1.8,0.21,0.66,1.35],
  ["LONG RIGHT",38,4.2,6,1.9,-0.22,0.7,1.39],
  ["THE GALE",40,0.35,6,-1.15,0.27,0.74,1.43],
  ["FORTY-TWO WIDE",42,-8.2,6,-2.45,-0.25,0.78,1.47],
  ["THE DISTANCE KING",45,-1.1,6,-1.2,0.3,0.82,1.52]
].map(([name,distance,ballX,wallPlayers,protectedX,wind,keeper,aimSpeed]) => ({ name,distance,ballX,wallPlayers,protectedX,wind,keeper,aimSpeed }));

const KICKERS = [
  { id:"dax-ryder",name:"DAX RYDER",role:"POWER KICKER",accent:"#dafe4d",speed:1.12,error:1.12,curve:0.94,meter:[1.07,1.05,1.03] },
  { id:"leo-vale",name:"LEO VALE",role:"PRECISION SPECIALIST",accent:"#74dcff",speed:0.96,error:0.66,curve:0.99,meter:[0.96,0.82,0.94] },
  { id:"zion-arc",name:"ZION ARC",role:"CURVE MASTER",accent:"#ff9bd4",speed:0.97,error:0.9,curve:1.22,meter:[1,0.98,0.82] },
  { id:"kai-mori",name:"KAI MORI",role:"COMPOSURE PLAYER",accent:"#c7b7ff",speed:0.98,error:0.82,curve:1,meter:[0.88,0.88,0.88] }
];
const KEEPERS = [
  { id:"default",name:"MILO KENT",role:"BALANCED KEEPER",accent:"#dafe4d",reach:1,reaction:1,low:0,high:0,central:0 },
  { id:"reflex",name:"RAFA SOL",role:"REFLEX KEEPER",accent:"#67d9ff",reach:0.94,reaction:1.13,low:0,high:0,central:0.08 },
  { id:"giant",name:"BRUNO HALE",role:"GIANT KEEPER",accent:"#ffb36b",reach:1.18,reaction:0.88,low:-0.14,high:0.05,central:0.02 },
  { id:"reader",name:"ELI VOSS",role:"SHOT READER",accent:"#d2a7ff",reach:1.03,reaction:1.02,low:0,high:0,central:0.04 },
  { id:"aggressive",name:"JAX MERCER",role:"AGGRESSIVE KEEPER",accent:"#ff718f",reach:1,reaction:1.04,low:0,high:-0.1,central:0.12 }
];
const WALLS = [
  { id:"default",name:"ACADEMY LINE",role:"BALANCED WALL",accent:"#7ca98b",spacing:1,jump:1,count:0,tracking:0 },
  { id:"compact",name:"IRON BLOCK",role:"COMPACT WALL",accent:"#63d49a",spacing:0.86,jump:1,count:0,tracking:0.04 },
  { id:"leaping",name:"SKYLINE FOUR",role:"LEAPING WALL",accent:"#ffb457",spacing:1,jump:1.36,count:0,tracking:0.02 },
  { id:"reading",name:"VECTOR UNIT",role:"READING WALL",accent:"#b995ff",spacing:0.93,jump:1.1,count:0,tracking:0.18 },
  { id:"staggered",name:"BROKEN RHYTHM",role:"STAGGERED WALL",accent:"#ff718f",spacing:1.04,jump:1.16,count:1,tracking:0.07 }
];

const dom = {
  stage:$("#labStage"),kicker:$("#labKicker"),keeper:$("#labKeeper"),wall:$("#labWall"),tier:$("#labTier"),wind:$("#labWind"),
  apply:$("#labApply"),reset:$("#labReset"),copy:$("#labCopy"),summary:$("#labMatchupSummary"),
  shots:$("#labShots"),goalRate:$("#labGoalRate"),saves:$("#labSaves"),wallBlocks:$("#labWallBlocks"),frameHits:$("#labFrameHits"),misses:$("#labMisses"),pace:$("#labAveragePace"),clearance:$("#labAverageClearance"),margin:$("#labAverageMargin"),last:$("#labLastResult"),
  canvas:$("#gameCanvas"),phase:$("#phaseTitle"),help:$("#phaseHelp"),action:$("#shotAction"),power:$("#powerReadout"),aim:$("#aimReadout"),curve:$("#curveReadout"),fill:$("#meterFill"),marker:$("#meterMarker"),meterLabel:$("#meterLabel"),meterNumber:$("#meterNumber"),
  stageNumber:$("#stageNumber"),stageName:$("#stageName"),score:$("#scoreValue"),goals:$("#streakValue"),windArrow:$("#windArrow"),windValue:$("#windValue"),result:$("#resultBanner"),prompt:$("#canvasPrompt"),exit:$("#exitGame")
};
const ctx = dom.canvas.getContext("2d");
const state = { stageIndex:0,scenario:SCENARIOS[0],kicker:KICKERS[0],keeper:KEEPERS[0],wall:WALLS[0],tier:1,wind:0,phase:"ready",meter:0,clock:0,timer:null,shot:null,stats:null };

const emptyStats = () => ({ shots:0,goals:0,saves:0,wallBlocks:0,frameHits:0,misses:0,paceTotal:0,clearTotal:0,clearCount:0,marginTotal:0,marginCount:0,last:null });
function option(select,value,label){const node=document.createElement("option");node.value=String(value);node.textContent=label;select.append(node);}
function populate(){
  SCENARIOS.forEach((s,i)=>option(dom.stage,i,`STAGE ${i+1} · ${s.distance} YDS · ${s.name}`));
  KICKERS.forEach(x=>option(dom.kicker,x.id,`${x.name} · ${x.role}`));
  KEEPERS.forEach((x,i)=>option(dom.keeper,x.id,i?`${x.name} · ${x.role}`:"STAGE DEFAULT"));
  WALLS.forEach((x,i)=>option(dom.wall,x.id,i?`${x.name} · ${x.role}`:"STAGE DEFAULT"));
  [1,2,3,4].forEach(x=>option(dom.tier,x,`TIER ${x}`));
  [["stage","SCENARIO WIND"],[0,"CALM"],[-.35,"3.5 M/S LEFT"],[-.25,"2.5 M/S LEFT"],[-.15,"1.5 M/S LEFT"],[.15,"1.5 M/S RIGHT"],[.25,"2.5 M/S RIGHT"],[.35,"3.5 M/S RIGHT"]].forEach(([v,l])=>option(dom.wind,v,l));
}
function idealPower(){return clamp(.63+(state.scenario.distance-18)*.0082,.66,.86);}
function quality(power){const d=Math.abs(power-idealPower());return d<=.035?1:1-smooth(clamp((d-.035)/.28,0,1));}
function qualityLabel(power){const q=quality(power);return q>=.9?"PERFECT":q>=.68?"CLEAN":q>=.38?"RISKY":power<idealPower()?"UNDERHIT":"OVERHIT";}
function aimTarget(){const sweep=(Math.sin(state.clock*2.22*state.scenario.aimSpeed-Math.PI/2)+1)/2,x=.065+smooth(sweep)*.87,p=state.shot?.power??idealPower(),d=clamp((p-idealPower())/.34,-1.35,1.15),y=clamp(.47-d*.255-Math.sign(d)*d*d*.055,.12,.83);return{x,y,label:`${y<.31?"HIGH":y>.59?"LOW":"MID"} ${x<.33?"LEFT":x>.67?"RIGHT":"CENTRE"}`};}
function setPhase(phase){
  clearInterval(state.timer);state.timer=null;state.phase=phase;state.clock=0;state.meter=phase==="curve"?.5:0;
  const copy={ready:["READY","The selected matchup repeats after every attempt.","START SHOT","SHOT METER"],power:["SET POWER","Stop inside the clean contact zone.","LOCK POWER","POWER"],aim:["PICK YOUR SIDE","Read the keeper and wall before committing.","LOCK PLACEMENT","PLACEMENT"],curve:["ADD CURVE","Counter the wind and bend around the wall.","TAKE SHOT","CURVE"],result:["SHOT COMPLETE","The same matchup is ready again.","NEXT SHOT","RESULT"]}[phase];
  dom.phase.textContent=copy[0];dom.help.textContent=copy[1];dom.action.textContent=copy[2];dom.meterLabel.textContent=copy[3];dom.prompt.textContent=phase==="ready"?`${state.scenario.distance} YARDS · ${state.scenario.name}`:copy[2];
  document.querySelectorAll(".shot-step").forEach((step,index)=>{const current=["power","aim","curve"].indexOf(phase);step.classList.toggle("is-current",phase==="ready"?index===0:current===index);step.classList.toggle("is-complete",current>index||phase==="result");});
  if(["power","aim","curve"].includes(phase))state.timer=setInterval(updateMeter,30);
}
function updateMeter(){state.clock+=.03;const pressure=1+(state.tier-1)*.035;if(state.phase==="power")state.meter=(Math.sin(state.clock*(3.35+state.scenario.aimSpeed*.18)*state.kicker.meter[0]*pressure-Math.PI/2)+1)/2;else if(state.phase==="aim")state.meter=aimTarget().x;else if(state.phase==="curve")state.meter=(Math.sin(state.clock*(2.78+state.scenario.aimSpeed*.2)*state.kicker.meter[2]*pressure)+1)/2;const pct=state.meter*100;dom.fill.style.width=`${pct}%`;dom.marker.style.left=`${pct}%`;dom.meterNumber.textContent=state.phase==="aim"?aimTarget().label:state.phase==="curve"?`${state.meter<.44?"L":state.meter>.56?"R":"C"} ${Math.round(Math.abs((state.meter-.5)*2)*100)}%`:`${qualityLabel(state.meter)} ${Math.round(pct)}%`;if(state.phase==="aim")draw();}

function calculate(){
  const s=state.scenario,shot=state.shot,p=shot.power,q=quality(p),curve=shot.curve*state.kicker.curve,targetX=-3.66+shot.aimX*7.32+curve*(.55+s.distance*.012)+state.wind*(.55+s.distance*.012)+(1-q)*.2*state.kicker.error,targetY=2.44*(1-shot.aimY)+(p>idealPower()?p-idealPower():-(idealPower()-p))*.7;
  const speed=lerp(15.5,36.5,smooth(p))*lerp(.86,1,q)*state.kicker.speed,wallCoverage=(s.wallPlayers+state.wall.count)*.18*state.wall.spacing*(1+(state.tier-1)*.03),wallCentre=s.protectedX+(targetX-s.protectedX)*state.wall.tracking,wallGap=Math.abs(targetX-wallCentre)-wallCoverage,requiredHeight=1.72+.25*state.wall.jump*(1+(state.tier-1)*.03),estimatedWallHeight=targetY+(.82+s.distance*.015)*.95,clearance=estimatedWallHeight-requiredHeight;
  let outcome,margin=null,reason;
  if(wallGap<0&&clearance<0){outcome="WALL";reason="Trajectory intersected the wall.";}
  else if(Math.abs(Math.abs(targetX)-3.66)<=.13&&targetY>0&&targetY<2.58){outcome="POST";reason="Final target clipped the post.";}
  else if(Math.abs(targetY-2.44)<=.13&&Math.abs(targetX)<3.8){outcome="BAR";reason="Final target clipped the crossbar.";}
  else if(Math.abs(targetX)>=3.66||targetY<=.05||targetY>=2.44){outcome="MISS";reason=targetY>=2.44?"Shot finished above the crossbar.":"Shot finished outside the posts.";}
  else {const central=Math.abs(targetX)<1.35,low=targetY<.82,high=targetY>1.66,reach=Math.hypot((targetX-s.protectedX)/(2.25*state.keeper.reach),(targetY-1.08)/(1.25*state.keeper.reach)),threshold=.92+s.keeper*.12+(state.tier-1)*.025+(central?state.keeper.central:0)+(low?state.keeper.low:0)+(high?state.keeper.high:0)-smooth(clamp((speed-27)/10,0,1))*.08;margin=reach-threshold;if(margin<=0){outcome="SAVE";reason="The goalkeeper reached the ball.";}else{outcome="GOAL";reason="Placement, pace and curve beat the goalkeeper.";}}
  return{outcome,powerPercent:Math.round(p*100),speedMps:speed,wallClearanceMetres:clearance,keeperMargin:margin,reason,targetX,targetY};
}
function record(result){const s=state.stats;s.shots++;s.goals+=result.outcome==="GOAL";s.saves+=result.outcome==="SAVE";s.wallBlocks+=result.outcome==="WALL";s.frameHits+=["POST","BAR"].includes(result.outcome);s.misses+=result.outcome==="MISS";s.paceTotal+=result.speedMps;if(Number.isFinite(result.wallClearanceMetres)){s.clearTotal+=result.wallClearanceMetres;s.clearCount++;}if(Number.isFinite(result.keeperMargin)){s.marginTotal+=result.keeperMargin;s.marginCount++;}s.last=result;window.__footballLabMatchupStats={...s};renderStats();}
function renderStats(){const s=state.stats;dom.shots.textContent=s.shots;dom.goalRate.textContent=s.shots?`${Math.round(s.goals/s.shots*100)}%`:"0%";dom.saves.textContent=s.saves;dom.wallBlocks.textContent=s.wallBlocks;dom.frameHits.textContent=s.frameHits;dom.misses.textContent=s.misses;dom.pace.textContent=s.shots?`${(s.paceTotal/s.shots).toFixed(1)} m/s`:"—";dom.clearance.textContent=s.clearCount?`${(s.clearTotal/s.clearCount).toFixed(2)} m`:"—";dom.margin.textContent=s.marginCount?(s.marginTotal/s.marginCount).toFixed(3):"—";dom.last.textContent=s.last?`${s.last.outcome} · ${s.last.powerPercent}% power · ${s.last.speedMps.toFixed(1)} m/s · ${s.last.reason}`:"No shots recorded.";dom.score.textContent=s.shots;dom.goals.textContent=s.goals;}
function draw(result=null){const width=dom.canvas.width=1200,height=dom.canvas.height=720;const gradient=ctx.createLinearGradient(0,0,0,height);gradient.addColorStop(0,"#06160d");gradient.addColorStop(.45,"#0b2116");gradient.addColorStop(1,"#174f2e");ctx.fillStyle=gradient;ctx.fillRect(0,0,width,height);ctx.fillStyle="rgba(1,6,3,.72)";ctx.fillRect(0,90,width,180);ctx.fillStyle="#174f2e";ctx.beginPath();ctx.moveTo(70,720);ctx.lineTo(1130,720);ctx.lineTo(935,270);ctx.lineTo(265,270);ctx.closePath();ctx.fill();ctx.strokeStyle="#f4faf2";ctx.lineWidth=6;ctx.strokeRect(430,185,340,165);ctx.lineWidth=1;ctx.strokeStyle="rgba(240,248,237,.25)";for(let x=464;x<770;x+=34){ctx.beginPath();ctx.moveTo(x,185);ctx.lineTo(x,350);ctx.stroke();}for(let y=218;y<350;y+=33){ctx.beginPath();ctx.moveTo(430,y);ctx.lineTo(770,y);ctx.stroke();}const count=state.scenario.wallPlayers+state.wall.count,start=600-(count-1)*28*state.wall.spacing;for(let i=0;i<count;i++){ctx.fillStyle=state.wall.accent;ctx.strokeStyle="#07110b";ctx.lineWidth=3;ctx.beginPath();ctx.roundRect(start+i*56*state.wall.spacing-13,322,26,64,8);ctx.fill();ctx.stroke();ctx.fillStyle="#c99774";ctx.beginPath();ctx.arc(start+i*56*state.wall.spacing,309,10,0,Math.PI*2);ctx.fill();}ctx.fillStyle=state.keeper.accent;ctx.beginPath();ctx.roundRect(586,250,28,65,8);ctx.fill();ctx.fillStyle=state.kicker.accent;ctx.beginPath();ctx.roundRect(568,575,38,88,10);ctx.fill();ctx.fillStyle="#c99774";ctx.beginPath();ctx.arc(587,561,15,0,Math.PI*2);ctx.fill();ctx.fillStyle="#f7faf5";ctx.strokeStyle="#07110b";ctx.beginPath();ctx.arc(620,650,10,0,Math.PI*2);ctx.fill();ctx.stroke();if(state.phase==="aim"){const t=aimTarget(),x=430+t.x*340,y=185+t.y*165;ctx.strokeStyle=state.kicker.accent;ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,22,0,Math.PI*2);ctx.moveTo(x-30,y);ctx.lineTo(x+30,y);ctx.moveTo(x,y-30);ctx.lineTo(x,y+30);ctx.stroke();}if(result){const endX=600+result.targetX*46,endY=350-result.targetY*68;ctx.strokeStyle=state.kicker.accent;ctx.lineWidth=4;ctx.setLineDash([10,8]);ctx.beginPath();ctx.moveTo(620,650);ctx.quadraticCurveTo((620+endX)/2,330,endX,endY);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=state.kicker.accent;ctx.beginPath();ctx.arc(endX,endY,9,0,Math.PI*2);ctx.fill();}}
function resetAttempt(){state.shot={};dom.power.textContent="—";dom.aim.textContent="—";dom.curve.textContent="—";dom.result.textContent="";dom.result.className="result-banner";setPhase("ready");draw();}
function action(){if(state.phase==="ready"||state.phase==="result"){resetAttempt();setPhase("power");return;}if(state.phase==="power"){state.shot.power=state.meter;dom.power.textContent=`${Math.round(state.meter*100)}% · ${qualityLabel(state.meter)}`;setPhase("aim");return;}if(state.phase==="aim"){const target=aimTarget();state.shot.aimX=target.x;state.shot.aimY=target.y;dom.aim.textContent=target.label;setPhase("curve");return;}if(state.phase==="curve"){state.shot.curve=(state.meter-.5)*2;dom.curve.textContent=Math.abs(state.shot.curve)<.12?"STRAIGHT":`${state.shot.curve<0?"LEFT":"RIGHT"} ${Math.round(Math.abs(state.shot.curve)*100)}%`;clearInterval(state.timer);state.timer=null;const result=calculate();record(result);setPhase("result");dom.result.textContent=result.outcome==="BAR"?"CROSSBAR":result.outcome;dom.result.className=`result-banner is-visible${result.outcome==="GOAL"?"":" is-miss"}`;draw(result);}}
function apply(){state.stageIndex=clamp(Number(dom.stage.value)||0,0,14);state.scenario=SCENARIOS[state.stageIndex];state.kicker=KICKERS.find(x=>x.id===dom.kicker.value)||KICKERS[0];state.keeper=KEEPERS.find(x=>x.id===dom.keeper.value)||KEEPERS[0];state.wall=WALLS.find(x=>x.id===dom.wall.value)||WALLS[0];state.tier=clamp(Number(dom.tier.value)||1,1,4);state.wind=dom.wind.value==="stage"?state.scenario.wind:Number(dom.wind.value);state.stats=emptyStats();dom.stageNumber.textContent=`STAGE ${String(state.stageIndex+1).padStart(2,"0")} · ${state.scenario.distance} YDS`;dom.stageName.textContent=state.scenario.name;dom.windArrow.textContent=state.wind<-.01?"←":state.wind>.01?"→":"•";dom.windValue.textContent=`${Math.abs(state.wind*10).toFixed(1)} m/s`;dom.summary.innerHTML=`<strong>${state.kicker.name} VS ${state.keeper.name}</strong>${state.wall.name} · Tier ${state.tier} defence · ${state.scenario.distance} yards`;renderStats();resetAttempt();}
async function copyResults(){const s=state.stats,text=["FOOTBALL LAB · MATCHUP TEST",`Stage: ${state.stageIndex+1} · ${state.scenario.distance} yards`,`Kicker: ${state.kicker.name}`,`Goalkeeper: ${state.keeper.name} · Tier ${state.tier}`,`Wall: ${state.wall.name} · Tier ${state.tier}`,`Shots: ${s.shots}`,`Goal rate: ${s.shots?Math.round(s.goals/s.shots*100):0}%`,`Saves: ${s.saves}`,`Wall blocks: ${s.wallBlocks}`,`Frame hits: ${s.frameHits}`,`Misses: ${s.misses}`].join("\n");try{await navigator.clipboard.writeText(text);const old=dom.copy.textContent;dom.copy.textContent="COPIED";setTimeout(()=>dom.copy.textContent=old,900);}catch{console.info(text);}}

setTimeout(() => {
  populate();state.stats=emptyStats();dom.apply.addEventListener("click",apply);dom.reset.addEventListener("click",()=>{state.stats=emptyStats();renderStats();});dom.copy.addEventListener("click",copyResults);dom.action.addEventListener("click",action);dom.canvas.addEventListener("pointerdown",action);dom.exit.addEventListener("click",()=>location.href="./index.html");window.addEventListener("keydown",event=>{if(event.code==="Space"){event.preventDefault();action();}});apply();
},0);
