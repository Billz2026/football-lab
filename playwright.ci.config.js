import { defineConfig } from "@playwright/test";
import baseConfig from "./playwright.config.js";

export default defineConfig({
  ...baseConfig,
  forbidOnly: true,
  retries: 0,
  workers: 2,
  testIgnore: [
    // Manual screenshot capture: useful for art review, not a deterministic release gate.
    "**/character-v46-keeper-visual.spec.js",
    "**/character-v46-visual.spec.js",
    "**/character-v47-mobile-visual.spec.js",
    // Superseded by the live V51 player-vs-CPU penalty duel.
    "**/penalty-experience-v50.spec.js",
    // Retains the removed five-lives HUD contract; current responsive coverage lives in mobile-layout.spec.js.
    "**/mobile-shell.spec.js"
  ],
  use: {
    ...baseConfig.use,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure"
  }
});
