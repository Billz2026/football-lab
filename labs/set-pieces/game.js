
function bindTap(el, fn){
  if (!el) return;
  // pointer events cover mouse + touch on most browsers
  el.addEventListener("pointerup", (e) => { e.preventDefault(); e.stopPropagation(); fn(); }, { passive:false });
  // fallback
  el.addEventListener("touchend", (e) => { e.preventDefault(); e.stopPropagation(); fn(); }, { passive:false });
  el.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); fn(); });
}
// prevent overlay clicks from reaching canvas-wrap
overlay.addEventListener("pointerdown", (e) => { e.stopPropagation(); }, { passive:true });
overlay.addEventListener("click", (e) => { e.stopPropagation(); });

function showOverlay(title, text, canNext){
  overlay.hidden = false;
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  overlayNext.style.display = canNext ? "inline-flex" : "none";

  // Stop canvas stealing taps when overlay is shown
  canvas.style.pointerEvents = "none";
}
function hideOverlay(){
  overlay.hidden = true;

  // Re-enable canvas input after overlay closes
  canvas.style.pointerEvents = "auto";
}


// Buttons (robust mobile bindings)
bindTap(nextBtn, nextLevel);
bindTap(restartBtn, restartLevel);
bindTap(backBtn, () => { location.href = "../../index.html"; });

bindTap(overlayNext, () => { hideOverlay(); nextLevel(); });
bindTap(overlayRetry, () => { hideOverlay(); restartLevel(); });
