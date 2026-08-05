const obsoleteOverlay = document.querySelector("#clarityOverlayV21");
if (obsoleteOverlay) obsoleteOverlay.remove();

window.__footballLabV22OverlayCleanup = Object.freeze({
  removedV21Overlay: !document.querySelector("#clarityOverlayV21")
});
