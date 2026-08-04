import("./game/lab-controller-v15-3b.js?v=1531").catch((error) => {
  console.error("Standalone Matchup Lab failed to start", error);
  const message = document.createElement("div");
  message.className = "lab-startup-error";
  message.textContent = `Matchup Lab failed to load: ${error?.message || String(error)}`;
  Object.assign(message.style, {
    position: "fixed",
    inset: "auto 20px 20px",
    zIndex: "9999",
    padding: "16px 18px",
    borderRadius: "12px",
    background: "#350b0b",
    color: "#fff",
    font: "700 14px system-ui"
  });
  document.body.appendChild(message);
});
