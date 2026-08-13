import { state, ctx } from "./core-v6.js?v=32.4";

const TAG = "__footballLabNoCircleV3816";
const CLARITY_TAG = "__footballLabNoKeeperFocusV3816";

function normaliseColour(value) {
  return String(value || "").replace(/\s+/g, "").toLowerCase();
}

function cleanDom() {
  document.querySelectorAll("#aimRiskHaloV371,.aim-risk-halo-v371").forEach((node) => node.remove());
  if (!document.getElementById("noAimCircleV3816")) {
    const style = document.createElement("style");
    style.id = "noAimCircleV3816";
    style.textContent = "#aimRiskHaloV371,.aim-risk-halo-v371{display:none!important;opacity:0!important;visibility:hidden!important}";
    document.head.appendChild(style);
  }
}

function patchBaseAimCircle() {
  if (ctx.arc && ctx.arc[TAG]) return;
  const previous = ctx.arc.bind(ctx);
  const wrapped = function footballLabNoBaseAimCircleV3816(x, y, radius, startAngle, endAngle, counterclockwise) {
    const stroke = normaliseColour(this.strokeStyle);
    const isBaseAimCircle = (
      state.screen === "game"
      && state.phase === "aim"
      && Number(x) === 0
      && Number(y) === 0
      && Number(radius) >= 5.5
      && Number(radius) <= 14
      && stroke.includes("218,254,77")
    );
    if (isBaseAimCircle) {
      window.__footballLabAimCircleRemovedV3816 = (window.__footballLabAimCircleRemovedV3816 || 0) + 1;
      return undefined;
    }
    return previous(x, y, radius, startAngle, endAngle, counterclockwise);
  };
  Object.defineProperty(wrapped, TAG, { value: true });
  ctx.arc = wrapped;
}

function patchClarityKeeperFocus() {
  const overlay = document.getElementById("clarityOverlayV21");
  if (!overlay) return;
  const overlayCtx = overlay.getContext("2d");
  if (!overlayCtx || (overlayCtx.ellipse && overlayCtx.ellipse[CLARITY_TAG])) return;

  const previous = overlayCtx.ellipse.bind(overlayCtx);
  const wrapped = function footballLabNoKeeperFocusOvalV3816(
    x,
    y,
    radiusX,
    radiusY,
    rotation,
    startAngle,
    endAngle,
    counterclockwise
  ) {
    const stroke = normaliseColour(this.strokeStyle);
    const rx = Math.abs(Number(radiusX) || 0);
    const ry = Math.abs(Number(radiusY) || 0);
    const aspect = rx > 0 ? ry / rx : 0;
    const isKeeperFocusOval = (
      state.screen === "game"
      && stroke.includes("239,255,231")
      && aspect > 1.75
      && aspect < 2.6
      && rx > 3
      && ry > 8
    );

    if (isKeeperFocusOval) {
      window.__footballLabKeeperFocusOvalRemovedV3816 =
        (window.__footballLabKeeperFocusOvalRemovedV3816 || 0) + 1;
      return undefined;
    }

    return previous(
      x,
      y,
      radiusX,
      radiusY,
      rotation,
      startAngle,
      endAngle,
      counterclockwise
    );
  };

  Object.defineProperty(wrapped, CLARITY_TAG, { value: true });
  overlayCtx.ellipse = wrapped;
  window.__footballLabClarityKeeperFocusPatchV3816 = true;
}

function enforce() {
  cleanDom();
  patchBaseAimCircle();
  patchClarityKeeperFocus();
}

function loop() {
  enforce();
  requestAnimationFrame(loop);
}

enforce();
requestAnimationFrame(loop);

window.__footballLabFinalAimCleanupV3814 = {
  build: "38.1.6",
  largeAimCircleRemoved: true,
  domRiskHaloRemoved: true,
  clarityKeeperFocusOvalRemoved: true,
  premiumGroundShadowRetained: true,
  aimingMechanicsChanged: false,
  goalkeeperAIChanged: false,
  physicsChanged: false
};
window.__footballLabFinalVisualCleanupV3816 = window.__footballLabFinalAimCleanupV3814;
