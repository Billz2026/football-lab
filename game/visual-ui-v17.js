import "./final-aim-cleanup-v38-1-4.js?v=38.1.6";
import "./fold-shell-v38-2-2.js?v=38.2.2";
import "./fold-balance-cinema-v38-3-4.js?v=38.4.0";

const STYLE_ID = "visualSliceStylesV17";

if (!document.getElementById(STYLE_ID)) {
  const link = document.createElement("link");
  link.id = STYLE_ID;
  link.rel = "stylesheet";
  link.href = "./visual-v17.css?v=17";
  document.head.appendChild(link);
}

document.body.classList.add("visual-v17");
document.documentElement.dataset.visualBuild = "17";
window.__footballLabVisualV17 = true;
