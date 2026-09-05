let queued=false;
function sync(){
  document.querySelectorAll('.flm-live-match[data-cm-console="3.3"]').forEach(live=>{
    live.querySelector('[data-cm33-subs]')?.setAttribute('aria-label','MAKE SUB');
    live.querySelector('[data-cm33-tactics]')?.setAttribute('aria-label','TACTICS');
    live.querySelector('[data-cm33-speed="0"]')?.setAttribute('aria-label','PAUSE MATCH');
  });
}
function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;sync();});}
new MutationObserver(queue).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['data-cm-console']});
queue();
