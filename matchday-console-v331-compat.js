const STYLE_HREF='./matchday-console-v331-compat.css?v=3.3.1';
let queued=false;
function ensureStyles(){if([...document.styleSheets].some(sheet=>sheet.href?.includes('matchday-console-v331-compat.css')))return;const link=document.createElement('link');link.rel='stylesheet';link.href=STYLE_HREF;document.head.appendChild(link);}
function sync(){
  ensureStyles();
  document.querySelectorAll('.flm-live-match[data-cm-console="3.3"]').forEach(live=>{
    live.querySelector('[data-cm33-subs]')?.setAttribute('aria-label','MAKE SUB');
    live.querySelector('[data-cm33-tactics]')?.setAttribute('aria-label','TACTICS');
    live.querySelector('[data-cm33-speed="0"]')?.setAttribute('aria-label','PAUSE MATCH');
  });
}
function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;sync();});}
new MutationObserver(queue).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-cm-console']});
queue();
