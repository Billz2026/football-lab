import("./game/main-v15-3.js?v=153")
  .then(() => import("./game/polish-v10-2.js?v=114"))
  .then(() => import("./game/polish-v11-4.js?v=114"))
  .then(() => import("./game/characters-ui-v13.js?v=13"))
  .then(() => import("./game/keepers-ui-v14.js?v=14"))
  .then(() => import("./game/walls-ui-v15.js?v=15"))
  .then(() => import("./game/run-rules-ui-v15-2.js?v=152"))
  .then(() => import("./game/matchup-lab-ui-v15-3.js?v=153"))
  .catch((error) => {
    console.error("Football Lab failed to start", error);
    const message = document.createElement("div");
    message.textContent = "The game failed to load. Refresh the page and try again.";
    Object.assign(message.style, {
      position: "fixed",
      inset: "auto 20px 20px",
      zIndex: "9999",
      padding: "16px 18px",
      borderRadius: "12px",
      background: "#260b0b",
      color: "#fff",
      font: "700 14px system-ui"
    });
    document.body.appendChild(message);
  });
