let transitionActive = false;
let transitionTimer = 0;

function duelOwnsShootout() {
  return Boolean(window.__footballLabPenaltyDuelV51?.shouldInterceptLegacyResult?.());
}

function beginTransitionGuard() {
  if (!duelOwnsShootout()) return;
  transitionActive = true;
  document.documentElement.classList.add("penalty-duel-transition-v51");
  clearTimeout(transitionTimer);
  transitionTimer = setTimeout(endTransitionGuard, 900);
}

function endTransitionGuard() {
  transitionActive = false;
  clearTimeout(transitionTimer);
  transitionTimer = 0;
  document.documentElement.classList.remove("penalty-duel-transition-v51");
}

function shouldBlockTarget(target) {
  return Boolean(target?.closest?.("#duelStepUpV51,#duelRunUpV51,#duelStrikeV51,[data-v51-attack-zone],#shotAction,#gameCanvas"));
}

function blockTransitionPointer(event) {
  if (!transitionActive || !duelOwnsShootout() || !shouldBlockTarget(event.target)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
}

window.addEventListener("footballlab:phasechange", (event) => {
  if (event.detail?.phase === "result") beginTransitionGuard();
  if (event.detail?.phase === "ready" && document.documentElement.classList.contains("is-defending-v51")) endTransitionGuard();
});

document.addEventListener("pointerdown", blockTransitionPointer, { capture: true, passive: false });
document.addEventListener("click", blockTransitionPointer, true);
window.addEventListener("keydown", (event) => {
  if (!transitionActive || !duelOwnsShootout()) return;
  if (![" ", "enter", "1", "2", "3", "4", "5", "6"].includes(event.key.toLowerCase())) return;
  event.preventDefault();
  event.stopImmediatePropagation();
}, { capture: true });

const observer = new MutationObserver(() => {
  if (transitionActive && document.documentElement.classList.contains("is-defending-v51")) endTransitionGuard();
});
observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

window.__footballLabPenaltyDuelTransitionGuardV51 = Object.freeze({
  build: "52.0.0",
  playerInputBlockedBetweenResultAndCpuTurn: true,
  snapshot: () => ({ transitionActive })
});
