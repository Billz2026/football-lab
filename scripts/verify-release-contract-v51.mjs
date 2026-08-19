import { readFile } from "node:fs/promises";

const RELEASE_BUILD = "51.1.0";
const CACHE_NAME = "football-lab-shell-v51-1-0";

const files = await Promise.all(Object.entries({
  index: "index.html",
  app: "app.js",
  worker: "sw.js",
  readme: "README.md",
  duel: "game/penalty-duel-v51.js",
  bridge: "game/penalty-shootout-v49.js",
  trainingGuard: "game/training-guard-v35.js",
  transitionGuard: "game/penalty-duel-transition-guard-v51.js"
}).map(async ([name, path]) => [name, await readFile(path, "utf8")]));

const source = Object.fromEntries(files);
const checks = [
  ["index loads the canonical app version", source.index.includes(`./app.js?v=${RELEASE_BUILD}`)],
  ["app declares the canonical release", source.app.includes(`const RELEASE_BUILD = "${RELEASE_BUILD}";`)],
  ["app registers the versioned worker", source.app.includes("./sw.js?v=${RELEASE_BUILD}")],
  ["app publishes the current release alias", source.app.includes("window.__footballLabReleaseV511 = release")],
  ["worker declares the canonical release", source.worker.includes(`const RELEASE_BUILD = "${RELEASE_BUILD}";`)],
  ["worker derives the shell cache from the release", source.worker.includes("RELEASE_BUILD.replaceAll")],
  ["worker cache resolves to the expected name", `football-lab-shell-v${RELEASE_BUILD.replaceAll(".", "-")}` === CACHE_NAME],
  ["worker caches the canonical app URL", source.worker.includes("./app.js?v=${RELEASE_BUILD}")],
  ["penalty duel publishes the canonical build", source.duel.includes(`const BUILD = "${RELEASE_BUILD}";`)],
  ["penalty duel stylesheet follows its build", source.duel.includes("penalty-duel-v51.css?v=${BUILD}")],
  ["training guard loads the canonical duel", source.trainingGuard.includes(`penalty-duel-v51.js?v=${RELEASE_BUILD}`)],
  ["training guard loads the canonical transition guard", source.trainingGuard.includes(`penalty-duel-transition-guard-v51.js?v=${RELEASE_BUILD}`)],
  ["legacy penalty bridge reports the canonical build", source.bridge.includes(`build: "${RELEASE_BUILD}"`)],
  ["transition guard reports the canonical build", source.transitionGuard.includes(`build: "${RELEASE_BUILD}"`)],
  ["README identifies the current public release", source.readme.includes(`Current public release: V${RELEASE_BUILD}`)],
  ["README distinguishes the V23 runtime architecture", source.readme.includes("Static runtime architecture: V23")]
];

const failures = checks.filter(([, passed]) => !passed).map(([label]) => label);
if (failures.length) {
  console.error("Release contract verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log(`Release contract verified: V${RELEASE_BUILD} / ${CACHE_NAME}`);
}
