// game.js not found in base build. Please paste the fix manually.
function showOverlay(title, text, canNext){
  overlay.hidden = false;
  overlayTitle.textContent = title;
  overlayText.textContent = text;
  overlayNext.style.display = canNext ? "inline-flex" : "none";

  // IMPORTANT: stop canvas stealing taps when overlay is shown
  canvas.style.pointerEvents = "none";
}
function hideOverlay(){
  overlay.hidden = true;

  // Re-enable canvas input after overlay closes
  canvas.style.pointerEvents = "auto";
}
