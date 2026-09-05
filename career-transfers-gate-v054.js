const TRANSFER_OPEN = '2026-06-15';
let loaded = false;
let loading = false;
let queued = false;

const manager = () => window.FLMManager;
const career = () => manager()?.activeCareer || null;
const day = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) ? Date.parse(`${value}T00:00:00Z`) : NaN;
const isOpen = c => Number.isFinite(day(c?.currentDate || c?.calendar?.currentDate)) && day(c?.currentDate || c?.calendar?.currentDate) >= day(TRANSFER_OPEN);

function lockedView(){
  const root=document.querySelector('.career-content');
  if(!root)return;
  root.innerHTML=`<section class="v054-locked"><div><span class="stamp">TRANSFER WINDOW</span><h2>Transfer window not open yet</h2><div class="date">MONDAY 15 JUNE 2026</div><p>Your recruitment team can prepare targets, but permanent transfers and AI market activity do not begin until the summer window officially opens.</p><button type="button" data-career-tab="overview">BACK TO OVERVIEW</button></div></section>`;
  root.querySelector('[data-career-tab="overview"]')?.addEventListener('click',()=>document.querySelector('.career-nav [data-career-tab="overview"]')?.click());
}

function ensureGate(c){
  const nav=document.querySelector('.career-nav');
  if(!nav || isOpen(c) || loaded){
    nav?.querySelector('[data-v054-transfer-gate]')?.remove();
    return;
  }
  let gate=nav.querySelector('[data-v054-transfer-gate]');
  if(!gate){
    gate=document.createElement('button');
    gate.type='button';
    gate.className='career-nav-button v054-lock-nav';
    gate.dataset.v054TransferGate='1';
    gate.innerHTML='Transfers<small>15 JUN</small>';
    gate.title='Summer transfer window opens 15 June 2026.';
    nav.querySelector('[data-career-tab="squad"]')?.after(gate);
    gate.addEventListener('click',lockedView);
  }
}

async function loadTransfers(){
  if(loaded || loading)return;
  const c=career();
  if(!c || !isOpen(c)){ensureGate(c);return;}
  loading=true;
  document.querySelector('[data-v054-transfer-gate]')?.remove();
  try{
    await import('./career-transfers-ui-v050.js?v=0.5.2');
    loaded=true;
  } finally {
    loading=false;
  }
}

function sync(){const c=career();if(!c)return;ensureGate(c);loadTransfers();}
function queue(){if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;sync();});}
new MutationObserver(queue).observe(document.body,{childList:true,subtree:true});
sync();
