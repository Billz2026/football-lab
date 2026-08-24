import { test, expect } from "@playwright/test";
import { loadGameplay } from "./helpers/load-gameplay.js";

async function ready(page) {
  await page.goto("/index.html?test=v54-game-feel");
  await loadGameplay(page);
  await expect.poll(
    () => page.evaluate(() => Boolean(window.__footballLabGameFeelV54 && window.__footballLabStrikeAudioV54)),
    { timeout: 10000 }
  ).toBe(true);
}

test("V54 game-feel contract is live without changing physics or outcomes", async ({ page }) => {
  await ready(page);
  const contract = await page.evaluate(() => ({
    build: window.__footballLabGameFeelV54.build,
    physicsChanged: window.__footballLabGameFeelV54.physicsChanged,
    outcomesChanged: window.__footballLabGameFeelV54.outcomesChanged,
    strikeAudio: window.__footballLabGameFeelV54.strikeAudio,
    contactSync: window.__footballLabGameFeelV54.contactSync,
    signatures: [...window.__footballLabGameFeelV54.shotSignatures],
    bridge: window.__footballLabGameFeelBridgeV54,
    audio: window.__footballLabStrikeAudioV54
  }));

  expect(contract.build).toBe("54.0.0");
  expect(contract.physicsChanged).toBe(false);
  expect(contract.outcomesChanged).toBe(false);
  expect(contract.strikeAudio).toBe(true);
  expect(contract.contactSync).toBe("ball-launch-frame");
  expect(contract.signatures).toEqual(["balanced", "controlled", "driven", "curl", "knuckle", "mishit"]);
  expect(contract.bridge).toBe(true);
  expect(contract.audio.sharedAudioContext).toBe(true);
  expect(contract.audio.respectsSoundSetting).toBe(true);
});

test("V54 classifies specialist and execution-driven shot signatures deterministically", async ({ page }) => {
  await ready(page);
  const styles = await page.evaluate(() => {
    const classify = window.__footballLabGameFeelV54.classifyShot;
    return {
      balanced: classify({ power: 0.68, contactQuality: 0.88, curve: 0.18 }, { trainingBallId: "standard" }),
      driven: classify({ power: 0.92, contactQuality: 0.9, curve: 0.08 }, { trainingBallId: "standard" }),
      curl: classify({ power: 0.72, contactQuality: 0.9, curve: -0.82 }, { trainingBallId: "standard" }),
      knuckle: classify({ power: 0.82, contactQuality: 0.84, curve: 0 }, { trainingBallId: "knuckle" }),
      controlled: classify({ power: 0.72, contactQuality: 0.82, curve: 0.18 }, { trainingBallId: "control" }),
      mishit: classify({ power: 0.91, contactQuality: 0.31, curve: 0.72 }, { trainingBallId: "standard" })
    };
  });

  expect(styles).toEqual({
    balanced: "balanced",
    driven: "driven",
    curl: "curl",
    knuckle: "knuckle",
    controlled: "controlled",
    mishit: "mishit"
  });
});
