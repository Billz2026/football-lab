export const MATCHDAY_MANAGER_MODAL_INTENT_VERSION='1.0.0';

const LIVE_SELECTOR='.flm-live-match,[data-live-match]';
const MODAL_SELECTOR='[data-manager-modal]';
const USER_MANAGER_TRIGGER=[
  '[data-open-tactics]',
  '[data-open-subs]',
  '[data-open-shape]',
  '[data-open-ratings]',
  '[data-open-opposition]',
  '[data-cm33-subs]',
  '[data-cm33-tactics]',
  '[data-cm4-subs]',
  '[data-cm4-tactics]'
].join(',');

let queued=false;
let trustedIntentUntil=0;

function now(){
  return typeof performance!=='undefined'&&typeof performance.now==='function'?performance.now():Date.now();
}

function closeUnintendedModal(modal){
  const close=modal.querySelector('[data-manager-dialog] [data-close-manager]');
  if(close){
    close.click();
    return;
  }
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden','true');
}

function guardLive(live){
  const modal=live.querySelector(MODAL_SELECTOR);
  if(!modal)return;

  if(!modal.classList.contains('is-open')){
    delete modal.dataset.flTrustedManagerOpen;
    return;
  }

  if(modal.dataset.flTrustedManagerOpen==='1')return;

  if(now()<=trustedIntentUntil){
    modal.dataset.flTrustedManagerOpen='1';
    trustedIntentUntil=0;
    return;
  }

  // Match presentation helpers may inspect native management views internally.
  // They must never leave an overlay open and pause/intercept the live match.
  closeUnintendedModal(modal);
}

function sync(){
  queued=false;
  document.querySelectorAll(LIVE_SELECTOR).forEach(guardLive);
}

function queue(){
  if(queued)return;
  queued=true;
  requestAnimationFrame(sync);
}

if(typeof window!=='undefined'&&typeof document!=='undefined'){
  document.addEventListener('click',event=>{
    if(!event.isTrusted)return;
    if(!event.target?.closest?.(USER_MANAGER_TRIGGER))return;
    // Proxy controls synchronously click the hidden native management button.
    // Keep the intent alive through the following mutation-observer frame.
    trustedIntentUntil=now()+750;
    queue();
  },true);

  new MutationObserver(queue).observe(document.documentElement,{
    childList:true,
    subtree:true,
    attributes:true,
    attributeFilter:['class','aria-hidden']
  });
  queue();

  window.FLMMatchdayManagerModalIntent=Object.freeze({
    version:MATCHDAY_MANAGER_MODAL_INTENT_VERSION,
    refresh:queue
  });
}
