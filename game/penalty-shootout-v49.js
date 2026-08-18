const nativeAddEventListenerV51 = window.addEventListener;
const legacyPhaseListenersV51 = new WeakMap();

window.addEventListener = function footballLabV51AddEventListener(type, listener, options) {
  if (type === "footballlab:phasechange" && typeof listener === "function") {
    const wrapped = function footballLabV51LegacyPhaseBridge(event) {
      const duel = window.__footballLabPenaltyDuelV51;
      if (event?.detail?.phase === "result" && duel?.shouldInterceptLegacyResult?.()) return;
      return listener.call(this, event);
    };
    legacyPhaseListenersV51.set(listener, wrapped);
    return nativeAddEventListenerV51.call(this, type, wrapped, options);
  }
  return nativeAddEventListenerV51.call(this, type, listener, options);
};

try {
  await import("./penalty-shootout-v49-base.js?v=49.0.0");
} finally {
  window.addEventListener = nativeAddEventListenerV51;
}

window.__footballLabPenaltyShootoutLegacyBridgeV51 = Object.freeze({
  build: "51.0.0",
  legacyResultSimulationSuppressedWhenDuelOwnsTurn: true
});
