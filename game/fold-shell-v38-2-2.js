// Football Lab V38.2.2 — unfolded foldable / tablet-touch Classic gameplay shell
const STYLE_ID = "foldShellStylesV3822";

function touchFoldEligible() {
  const coarse = window.matchMedia?.("(hover: none) and (pointer: coarse)")?.matches;
  const touch = coarse || Number(navigator.maxTouchPoints || 0) > 0;
  return Boolean(touch && Math.min(window.innerWidth, window.innerHeight) >= 600);
}

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    @media (hover:none) and (pointer:coarse) and (min-width:600px) {
      html[data-touch-gameplay-v382="active"] body.is-game-active {
        width:100%;
        min-height:100dvh;
        overflow-x:hidden;
        background:#020604;
      }

      html[data-touch-gameplay-v382="active"] body.is-game-active main {
        width:100%;
        min-height:100dvh;
        padding:max(5px,env(safe-area-inset-top)) max(5px,env(safe-area-inset-right)) max(5px,env(safe-area-inset-bottom)) max(5px,env(safe-area-inset-left)) !important;
      }

      html[data-touch-gameplay-v382="active"] body.is-game-active #gameScreen.is-active {
        width:100%;
        min-height:calc(100dvh - max(10px,env(safe-area-inset-top)) - max(10px,env(safe-area-inset-bottom)));
        display:block !important;
      }

      html[data-touch-gameplay-v382="active"] body.is-game-active .screen-game .game-layout {
        width:100% !important;
        min-height:0 !important;
        display:grid !important;
        grid-template-columns:minmax(0,1fr) !important;
        grid-template-rows:auto auto !important;
        gap:7px !important;
        margin:0 !important;
        align-items:start !important;
      }

      html[data-touch-gameplay-v382="active"] body.is-game-active .screen-game .game-frame {
        width:100% !important;
        height:auto !important;
        min-height:0 !important;
        max-height:none !important;
        aspect-ratio:5 / 3 !important;
        border-radius:17px !important;
      }

      html[data-touch-gameplay-v382="active"] body.is-game-active .screen-game #gameCanvas {
        width:100% !important;
        height:100% !important;
        min-height:0 !important;
        max-height:none !important;
      }

      html[data-touch-gameplay-v382="active"] body.is-game-active .screen-game .control-panel {
        position:relative !important;
        inset:auto !important;
        transform:none !important;
        width:100% !important;
        height:auto !important;
        min-height:0 !important;
        max-height:none !important;
        display:grid !important;
        grid-template-columns:minmax(0,1fr) minmax(240px,.42fr) !important;
        grid-template-areas:
          "steps steps"
          "meter action" !important;
        gap:7px 9px !important;
        padding:8px !important;
        align-items:center !important;
        border-radius:15px !important;
      }

      html[data-touch-gameplay-v382="active"] body.is-game-active .screen-game .control-panel > * {
        min-width:0 !important;
      }

      html[data-touch-gameplay-v382="active"] body.is-game-active .screen-game .control-heading,
      html[data-touch-gameplay-v382="active"] body.is-game-active .mobile-run-strip-v161,
      html[data-touch-gameplay-v382="active"] body.is-game-active .run-rules-v152,
      html[data-touch-gameplay-v382="active"] body.is-game-active .infinite-rules-v25,
      html[data-touch-gameplay-v382="active"] body.is-game-active #finishRunV25,
      html[data-touch-gameplay-v382="active"] body.is-game-active #pbChaseV20,
      html[data-touch-gameplay-v382="active"] body.is-game-active .input-note {
        display:none !important;
      }

      html[data-touch-gameplay-v382="active"] body.is-game-active .screen-game .shot-steps {
        grid-area:steps !important;
        position:relative !important;
        inset:auto !important;
        transform:none !important;
        width:100% !important;
        display:grid !important;
        grid-template-columns:repeat(3,minmax(0,1fr)) !important;
        gap:5px !important;
        margin:0 !important;
      }

      html[data-touch-gameplay-v382="active"] body.is-game-active .screen-game .shot-step {
        min-width:0 !important;
        min-height:42px !important;
        padding:5px 7px !important;
        gap:5px !important;
        border-radius:10px !important;
      }

      html[data-touch-gameplay-v382="active"] body.is-game-active .screen-game .meter-wrap {
        grid-area:meter !important;
        position:relative !important;
        inset:auto !important;
        transform:none !important;
        width:100% !important;
        margin:0 !important;
        align-self:center !important;
      }

      html[data-touch-gameplay-v382="active"] body.is-game-active .screen-game .action-button {
        grid-area:action !important;
        position:relative !important;
        inset:auto !important;
        transform:none !important;
        width:100% !important;
        min-height:52px !important;
        height:52px !important;
        max-height:52px !important;
        margin:0 !important;
        border-radius:13px !important;
        font-size:12px !important;
      }

      html[data-touch-gameplay-v382="active"] .touch-power-v382 {
        grid-area:power !important;
        position:relative !important;
        inset:auto !important;
        transform:none !important;
        width:100% !important;
      }

      html[data-touch-gameplay-v382="active"][data-strike-phase-v324="power"] body.is-game-active .screen-game .control-panel {
        grid-template-columns:minmax(0,1fr) !important;
        grid-template-areas:
          "steps"
          "power" !important;
      }
    }

    /* Only genuinely wide, short landscape phones may use a side tray.
       Near-square unfolded foldables must stay in the full-width stacked shell. */
    @media (hover:none) and (pointer:coarse) and (max-height:560px) and (min-aspect-ratio:3/2) {
      html[data-touch-gameplay-v382="active"] body.is-game-active .screen-game .game-layout {
        grid-template-columns:minmax(0,1fr) minmax(250px,32vw) !important;
        grid-template-rows:minmax(0,1fr) !important;
        align-items:stretch !important;
      }

      html[data-touch-gameplay-v382="active"] body.is-game-active .screen-game .game-frame {
        aspect-ratio:auto !important;
        height:calc(100dvh - 12px) !important;
      }

      html[data-touch-gameplay-v382="active"] body.is-game-active .screen-game .control-panel {
        grid-template-columns:1fr !important;
        grid-template-areas:
          "steps"
          "meter"
          "action" !important;
        align-content:center !important;
      }

      html[data-touch-gameplay-v382="active"] body.is-game-active .screen-game .shot-steps {
        grid-template-columns:1fr !important;
      }
    }
  `;
  document.head.appendChild(style);
}

function sync() {
  const active = touchFoldEligible();
  document.documentElement.dataset.foldShellV3822 = active ? "active" : "inactive";
  document.body.classList.toggle("fold-shell-v3822", active);
  if (active) ensureStyles();
}

sync();
window.addEventListener("resize", sync, { passive:true });
window.addEventListener("orientationchange", () => setTimeout(sync, 120), { passive:true });
window.__footballLabFoldShellV3822 = Object.freeze({
  build:"38.2.2",
  unfoldedFoldFullWidth:true,
  legacyRunPanelHiddenOnTouch:true,
  genuineShortLandscapeMinAspect:"3/2",
  physicsChanged:false,
  aimingChanged:false,
  difficultyChanged:false
});
