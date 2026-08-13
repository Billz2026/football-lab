import { state, ctx } from "./core-v6.js?v=32.4";
const TAG = "__footballLabNoCircleV3814";
function cleanDom(){
  document.querySelectorAll("#aimRiskHaloV371,.aim-risk-halo-v371").forEach((n)=>n.remove());
  if(!document.getElementById("noAimCircleV3814")){
    const s=document.createElement("style");
    s.id="noAimCircleV3814";
    s.textContent="#aimRiskHaloV371,.aim-risk-halo-v371{display:none!important;opacity:0!important;visibility:hidden!important}";
    document.head.appendChild(s);
  }
}
function patchArc(){
  if(ctx.arc && ctx.arc[TAG]) return;
  const previous=ctx.arc.bind(ctx);
  const wrapped=function(x,y,r,a,b,c){
    const stroke=String(this.strokeStyle||"").replace(/\s+/g,"").toLowerCase();
    if(state.screen==="game" && state.phase==="aim" && stroke.includes("218,254,77") && Number(r)>=5.5){
      window.__footballLabAimCircleRemovedV3814=(window.__footballLabAimCircleRemovedV3814||0)+1;
      return;
    }
    return previous(x,y,r,a,b,c);
  };
  Object.defineProperty(wrapped,TAG,{value:true});
  ctx.arc=wrapped;
}
function enforce(){cleanDom();patchArc();}
function loop(){enforce();requestAnimationFrame(loop);}
enforce();requestAnimationFrame(loop);
window.__footballLabFinalAimCleanupV3814={build:"38.1.4",largeAimCircleRemoved:true,domRiskHaloRemoved:true,aimingMechanicsChanged:false};
