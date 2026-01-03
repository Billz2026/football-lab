const STORE_KEY = "footballlab_progress_v1";

function readProgress(){
  try{
    return JSON.parse(localStorage.getItem(STORE_KEY) || "{}") || {};
  }catch{
    return {};
  }
}
function writeProgress(p){
  localStorage.setItem(STORE_KEY, JSON.stringify(p));
}
function formatLevel(n){
  return n ? `Level ${n}` : "Level 1";
}

function init(){
  const p = readProgress();
  const setPiecesLevel = (p.setPieces && p.setPieces.unlockedLevel) ? p.setPieces.unlockedLevel : 1;

  const sp = document.getElementById("setPiecesProgress");
  const spMeta = document.getElementById("setPiecesMeta");
  if (sp) sp.textContent = `Unlocked: ${formatLevel(setPiecesLevel)}`;
  if (spMeta) spMeta.textContent = `Unlocked: ${formatLevel(setPiecesLevel)}`;

  const resetBtn = document.getElementById("resetProgressBtn");
  resetBtn?.addEventListener("click", () => {
    localStorage.removeItem(STORE_KEY);
    location.reload();
  });
}
init();
