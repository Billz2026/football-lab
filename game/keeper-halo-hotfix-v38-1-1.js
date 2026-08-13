import { state, ctx } from "./core-v6.js?v=32.4";
import { buildCamera, keeperWorld } from "./world-v7.js?v=32.4";
import { projectWorld } from "./projection-v6.js?v=32.4";

const BUILD = "38.1.2";
const PATCH_TAG = "__footballLabV3812";
const VIEWPORT = Object.freeze({ width: 1200, height: 720 });

let saveDepth = 0;
let suppressLegacyRig = false;
let suppressDepth = -1;
let legacyRigSeenThisFrame = false;
let moveCount = 0;
let lineCount = 0;
let suppressionCount = 0;

function normaliseColour(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, "");
}
function tagged(fn) { return Boolean(fn && fn[PATCH_TAG]); }
function mark(fn) { try { Object.defineProperty(fn, PATCH_TAG, { value: true }); } catch { fn[PATCH_TAG] = true; } return fn; }
function resetFrameState() { saveDepth=0; suppressLegacyRig=false; suppressDepth=-1; legacyRigSeenThisFrame=false; moveCount=0; lineCount=0; }
function armLegacySuppression(source) { if (legacyRigSeenThisFrame || state.screen !== "game") return; legacyRigSeenThisFrame=true; suppressLegacyRig=true; suppressDepth=Math.max(0,saveDepth); suppressionCount+=1; window.__footballLabKeeperGhostSuppressedFramesV3812=suppressionCount; window.__footballLabKeeperGhostLastTriggerV3812=source; }
function projectedKeeperFoot(){ if(!state.currentStage)return null; try{ const point=projectWorld(keeperWorld(state.currentStage),buildCamera(state.currentStage),VIEWPORT); return point?.visible?point:null;}catch{return null;} }
function nearKeeperFoot(x,y){ const foot=projectedKeeperFoot(); if(!foot)return false; return Math.abs(Number(x)-foot.x)<=82&&Math.abs(Number(y)-foot.y)<=42; }
function installClearRectGuard(){if(tagged(ctx.clearRect))return;const p=ctx.clearRect.bind(ctx);ctx.clearRect=mark(function(...a){const r=p(...a);resetFrameState();return r;});}
function installSaveGuard(){if(tagged(ctx.save))return;const p=ctx.save.bind(ctx);ctx.save=mark(function(...a){saveDepth+=1;return p(...a);});}
function installRestoreGuard(){if(tagged(ctx.restore))return;const p=ctx.restore.bind(ctx);ctx.restore=mark(function(...a){const r=p(...a);saveDepth=Math.max(0,saveDepth-1);if(suppressLegacyRig&&saveDepth<suppressDepth){suppressLegacyRig=false;suppressDepth=-1;}return r;});}
function installTranslateGuard(){if(tagged(ctx.translate))return;const p=ctx.translate.bind(ctx);ctx.translate=mark(function(x,y,...rest){if(!legacyRigSeenThisFrame&&nearKeeperFoot(x,y))armLegacySuppression("goalmouth-transform");return p(x,y,...rest);});}
function installEllipseGuard(){if(tagged(ctx.ellipse))return;const p=ctx.ellipse.bind(ctx);ctx.ellipse=mark(function(x,y,rx,ry,rot,a,b,c){const colour=normaliseColour(this.fillStyle);const shadow=colour==="rgba(0,0,0,0.22)"||colour==="rgba(0,0,0,.22)";if(!legacyRigSeenThisFrame&&state.screen==="game"&&shadow)armLegacySuppression("legacy-shadow-signature");return p(x,y,rx,ry,rot,a,b,c);});}
function installBeginPathGuard(){if(tagged(ctx.beginPath))return;const p=ctx.beginPath.bind(ctx);ctx.beginPath=mark(function(...a){moveCount=0;lineCount=0;return p(...a);});}
function installMoveToGuard(){if(tagged(ctx.moveTo))return;const p=ctx.moveTo.bind(ctx);ctx.moveTo=mark(function(...a){moveCount+=1;return p(...a);});}
function installLineToGuard(){if(tagged(ctx.lineTo))return;const p=ctx.lineTo.bind(ctx);ctx.lineTo=mark(function(...a){lineCount+=1;return p(...a);});}
function installFillGuard(){if(tagged(ctx.fill))return;const p=ctx.fill.bind(ctx);ctx.fill=mark(function(...a){if(suppressLegacyRig)return;return p(...a);});}
function installStrokeGuard(){if(tagged(ctx.stroke))return;const p=ctx.stroke.bind(ctx);ctx.stroke=mark(function(...a){if(suppressLegacyRig){moveCount=0;lineCount=0;return;}const colour=normaliseColour(this.strokeStyle);const width=Number(this.lineWidth)||0;const white=colour==="rgba(236,255,232,0.66)"||colour==="rgba(236,255,232,.66)";if(state.screen==="game"&&white&&Math.abs(width-1.5)<0.06&&moveCount>=1&&lineCount>=10){moveCount=0;lineCount=0;return;}const r=p(...a);moveCount=0;lineCount=0;return r;});}
function installFillTextGuard(){if(tagged(ctx.fillText))return;const p=ctx.fillText.bind(ctx);ctx.fillText=mark(function(...a){if(suppressLegacyRig)return;return p(...a);});}
function installStrokeTextGuard(){if(tagged(ctx.strokeText))return;const p=ctx.strokeText.bind(ctx);ctx.strokeText=mark(function(...a){if(suppressLegacyRig)return;return p(...a);});}
function installRectGuards(){if(!tagged(ctx.fillRect)){const p=ctx.fillRect.bind(ctx);ctx.fillRect=mark(function(...a){if(suppressLegacyRig)return;return p(...a);});}if(!tagged(ctx.strokeRect)){const p=ctx.strokeRect.bind(ctx);ctx.strokeRect=mark(function(...a){if(suppressLegacyRig)return;return p(...a);});}}
function ensureCanvasGuards(){installClearRectGuard();installSaveGuard();installRestoreGuard();installTranslateGuard();installEllipseGuard();installBeginPathGuard();installMoveToGuard();installLineToGuard();installFillGuard();installStrokeGuard();installFillTextGuard();installStrokeTextGuard();installRectGuards();}
function publishBuildMarker(){window.__footballLabReleaseV3812={build:BUILD};}
function reinforcePresentationGuard(){ensureCanvasGuards();publishBuildMarker();}
ensureCanvasGuards();publishBuildMarker();
let guardFrames=0;function guardBootChain(){reinforcePresentationGuard();guardFrames+=1;if(guardFrames<360)requestAnimationFrame(guardBootChain);}requestAnimationFrame(guardBootChain);
for(const eventName of ["footballlab:phasechange","footballlab:trainingstart","footballlab:keeperchange"]){window.addEventListener(eventName,reinforcePresentationGuard,true);}

import("./final-aim-cleanup-v38-1-4.js?v=38.1.4").catch((error)=>console.error("V38.1.4 final aim cleanup failed",error));
