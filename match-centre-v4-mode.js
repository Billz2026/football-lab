const STYLE_ID = 'flm-match-centre-v4-mode';

function ensureModeStyle(){
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .career-app.flm-cm-shell .career-layout:has(.flm-live-match[data-cm4="1"]){
      grid-template-columns:minmax(0,1fr)!important;
    }
    .career-app.flm-cm-shell .career-layout:has(.flm-live-match[data-cm4="1"]) > .flm-cm-sidebar{
      display:none!important;
    }
    .career-app.flm-cm-shell .flm-cm-workspace:has(.flm-live-match[data-cm4="1"]){
      grid-template-rows:minmax(0,1fr)!important;
    }
    .career-app.flm-cm-shell .flm-cm-workspace:has(.flm-live-match[data-cm4="1"]) > .career-header{
      display:none!important;
    }
    .career-app.flm-cm-shell .career-content:has(.flm-live-match[data-cm4="1"]){
      padding:6px!important;
      overflow:auto!important;
      background:#050a10!important;
    }
  `;
  document.head.appendChild(style);
}

ensureModeStyle();