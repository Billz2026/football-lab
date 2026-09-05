const STYLE_HREF = './match-centre-v4-mobile-v42.css?v=4.2.0';
const liveState = new WeakMap();
const textDescriptor = Object.getOwnPropertyDescriptor(Node.prototype,'textContent');
const classDescriptor = Object.getOwnPropertyDescriptor(Element.prototype,'className');

function ensureStyles(){
  if ([...document.styleSheets].some(sheet => sheet.href?.includes('match-centre-v4-mobile-v42.css'))) return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href=STYLE_HREF;
  document.head.appendChild(link);
}

function patchText(node){
  if (!node || node.__cm42TextPatched || !textDescriptor?.get || !textDescriptor?.set) return;
  try {
    Object.defineProperty(node,'textContent',{
      configurable:true,
      get(){ return textDescriptor.get.call(this); },
      set(value){
        const next=String(value ?? '');
        if (textDescriptor.get.call(this) === next) return;
        textDescriptor.set.call(this,next);
      }
    });
    node.__cm42TextPatched=true;
  } catch (_) {}
}

function patchClass(node){
  if (!node || node.__cm42ClassPatched || !classDescriptor?.get || !classDescriptor?.set) return;
  try {
    Object.defineProperty(node,'className',{
      configurable:true,
      get(){ return classDescriptor.get.call(this); },
      set(value){
        const next=String(value ?? '');
        if (String(classDescriptor.get.call(this)) === next) return;
        classDescriptor.set.call(this,next);
      }
    });
    node.__cm42ClassPatched=true;
  } catch (_) {}
}

function patchHotNodes(live){
  const selectors=[
    '[data-cm4-home-name]','[data-cm4-away-name]','[data-cm4-home-score]','[data-cm4-away-score]',
    '[data-cm4-clock]','[data-cm4-half]','[data-cm4-minute]','[data-cm4-phase]','[data-cm4-date]',
    '[data-cm4-comp]','[data-cm4-event-minute]','[data-cm4-event-team]','[data-cm4-event-text]',
    '[data-cm4-pressure-copy]','[data-cm4-referee]','[data-cm4-attendance]','[data-cm4-weather]',
    '[data-cm4-pause]','[data-cm4-bottom-player]',
    '.flm-cm-v2-team','.flm-cm-v2-minute','.flm-cm-v2-text'
  ];
  live.querySelectorAll(selectors.join(',')).forEach(patchText);
  patchClass(live.querySelector('[data-cm4-event]'));
}

function minuteFromClock(clock){
  const value=Number(String(clock||'').split(':')[0]);
  return Number.isFinite(value)?value:0;
}

function activeNativeSpeed(live){
  for (const value of [4,2,1]) if (live.querySelector(`[data-match-speed="${value}"]`)?.classList.contains('is-active')) return value;
  return 0;
}

function stateFor(live){
  let state=liveState.get(live);
  if (!state){
    state={lastClock:'',lastAdvanceAt:performance.now(),lastSpeed:1,managerRequested:false,managerWasRunning:false,modalOpen:false};
    liveState.set(live,state);
  }
  return state;
}

function keepMatchAlive(live){
  const state=stateFor(live);
  const clock=live.querySelector('[data-live-clock]')?.textContent?.trim() || live.querySelector('[data-cm4-clock]')?.textContent?.trim() || '';
  const minute=minuteFromClock(clock);
  const now=performance.now();
  const modal=live.querySelector('[data-manager-modal]');
  const modalOpen=Boolean(modal?.classList.contains('is-open'));
  const halfTime=live.classList.contains('is-half-time') || clock==='45:00';
  const fullTime=live.classList.contains('is-full-time') || minute>=90;
  const paused=Boolean(live.querySelector('[data-match-speed="0"]')?.classList.contains('is-active'));
  const speed=activeNativeSpeed(live);

  if (speed) state.lastSpeed=speed;
  if (clock && clock!==state.lastClock){ state.lastClock=clock; state.lastAdvanceAt=now; }

  if (state.modalOpen && !modalOpen && state.managerRequested){
    if (state.managerWasRunning && !halfTime && !fullTime && paused){
      live.querySelector(`[data-match-speed="${state.lastSpeed || 1}"]`)?.click();
    }
    state.managerRequested=false;
  }
  state.modalOpen=modalOpen;

  if (modalOpen || halfTime || fullTime || paused) return;
  if (!clock || minute<=0) return;

  // A running interactive match should never sit on the same minute for several seconds.
  // Re-asserting the current speed safely clears accidental legacy pause races without
  // overriding a genuine user pause, which is represented by the native 0x control.
  if (now-state.lastAdvanceAt>3200){
    live.querySelector(`[data-match-speed="${state.lastSpeed || speed || 1}"]`)?.click();
    state.lastAdvanceAt=now;
  }
}

function enhance(live){
  if (!live?.isConnected || live.dataset.cm4!=='1') return;
  patchHotNodes(live);
  keepMatchAlive(live);
}

ensureStyles();

// Capture management intent before the native dialog pauses the engine so we know
// whether closing the dialog should restore live play.
document.addEventListener('click',event=>{
  const trigger=event.target.closest?.('[data-cm4-subs],[data-cm4-tactics]');
  if (!trigger) return;
  const live=trigger.closest('.flm-live-match[data-cm4="1"]');
  if (!live) return;
  const state=stateFor(live);
  state.managerRequested=true;
  state.managerWasRunning=!live.querySelector('[data-match-speed="0"]')?.classList.contains('is-active');
  state.lastSpeed=activeNativeSpeed(live)||state.lastSpeed||1;
},true);

// Polling is intentionally used here instead of another broad MutationObserver.
// It keeps the UI responsive on mobile and avoids observer feedback loops starving
// the match timer around the end of the first half.
setInterval(()=>document.querySelectorAll('.flm-live-match[data-cm4="1"]').forEach(enhance),180);
