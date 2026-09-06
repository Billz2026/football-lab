export const COMMENTARY_SIDE_GUARD_VERSION='1.0.0';

const clean=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/&/g,' and ').replace(/[^a-z0-9]+/g,' ').trim();
let queued=false;

function mentions(text,alias){
  const haystack=` ${clean(text)} `;
  const needle=clean(alias);
  return Boolean(needle&&haystack.includes(` ${needle} `));
}

function identityScore(text,aliases=[]){
  let score=0;
  const seen=new Set();
  for(const alias of aliases){
    const key=clean(alias);if(!key||seen.has(key)||!mentions(text,key))continue;seen.add(key);
    const words=key.split(' ').filter(Boolean).length;
    score+=words>1?4:key.length>=6?2:1;
  }
  return score;
}

function syncLive(live){
  const context=live?._cmV2Context;
  if(!context)return;
  const homeAliases=context.homeAliases||[],awayAliases=context.awayAliases||[];
  if(!homeAliases.length&&!awayAliases.length)return;
  for(const row of live.querySelectorAll('[data-commentary-feed] .flm-commentary-line')){
    const text=row.querySelector('span')?.textContent||row.textContent||'';
    const home=identityScore(text,homeAliases),away=identityScore(text,awayAliases);
    if(home>away&&home>0){row.dataset.cmSide='home';row.dataset.cvSideGuard='home';}
    else if(away>home&&away>0){row.dataset.cmSide='away';row.dataset.cvSideGuard='away';}
  }
}

function sync(){queued=false;document.querySelectorAll('.flm-live-match,[data-live-match]').forEach(syncLive);}
function queue(){if(queued)return;queued=true;requestAnimationFrame(sync);}

if(typeof window!=='undefined'&&typeof document!=='undefined'){
  queue();
  new MutationObserver(queue).observe(document.documentElement,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['data-cm-side']});
  window.FLMCommentarySideGuardV1=Object.freeze({version:COMMENTARY_SIDE_GUARD_VERSION,refresh:queue});
}
