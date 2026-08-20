import { readdir, readFile } from "node:fs/promises";

const RELEASE_BUILD = "51.2.0";
const CACHE_NAME = "football-lab-shell-v51-2-0";

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
const gameFiles = (await readdir("game", { recursive: true }))
  .filter((path) => path.endsWith(".js"));
const legacyGlobalBuildWriters = [];
for (const path of gameFiles) {
  if (path === "penalty-duel-v51.js") continue;
  const contents = await readFile(`game/${path}`, "utf8");
  if (contents.includes("dataset.footballLabBuild")) legacyGlobalBuildWriters.push(path);
}
const checks = [
  ["index loads the canonical app version", source.index.includes(`./app.js?v=${RELEASE_BUILD}`)],
  ["app declares the canonical release", source.app.includes(`const RELEASE_BUILD = "${RELEASE_BUILD}";`)],
  ["app registers the versioned worker", source.app.includes("./sw.js?v=${RELEASE_BUILD}")],
  ["app publishes the current release alias", source.app.includes("window.__footballLabReleaseV512 = release")],
  ["app exposes the on-demand gameplay loader", source.app.includes("loadGameplay: loadGameplayBundle")],
  ["production runtime is imported by the gameplay loader", source.app.includes(".then(() => import(runtimeEntry))")],
  ["current build presentation is protected after deferred modules load", source.app.includes("protectCurrentBuildPresentation()")],
  ["worker declares the canonical release", source.worker.includes(`const RELEASE_BUILD = "${RELEASE_BUILD}";`)],
  ["worker derives the shell cache from the release", source.worker.includes("RELEASE_BUILD.replaceAll")],
  ["worker cache resolves to the expected name", `football-lab-shell-v${RELEASE_BUILD.replaceAll(".", "-")}` === CACHE_NAME],
  ["worker caches the canonical app URL", source.worker.includes("./app.js?v=${RELEASE_BUILD}")],
  ["worker preserves the offline menu shell", source.worker.includes("./game/product-polish-v22.js?v=32.4") && source.worker.includes("./game/hub-v35-4.js?v=35.6.2")],
  ["penalty duel publishes the canonical build", source.duel.includes(`const BUILD = "${RELEASE_BUILD}";`)],
  ["penalty duel stylesheet follows its build", source.duel.includes("penalty-duel-v51.css?v=${BUILD}")],
  ["app lazy-loads the canonical duel", source.app.includes('import(`./game/penalty-duel-v51.js?v=${RELEASE_BUILD}`)')],
  ["app lazy-loads the canonical transition guard", source.app.includes('import(`./game/penalty-duel-transition-guard-v51.js?v=${RELEASE_BUILD}`)')],
  ["training guard remains penalty-bundle independent", !source.trainingGuard.includes("penalty-duel-v51.js")],
  ["legacy penalty bridge reports the canonical build", source.bridge.includes(`build: "${RELEASE_BUILD}"`)],
  ["transition guard reports the canonical build", source.transitionGuard.includes(`build: "${RELEASE_BUILD}"`)],
  ["legacy game modules cannot overwrite the public build marker", legacyGlobalBuildWriters.length === 0],
  ["README identifies the current public release", source.readme.includes(`Current public release: V${RELEASE_BUILD}`)],
  ["README distinguishes the V23 runtime architecture", source.readme.includes("Static runtime architecture: V23")]
];

const failures = checks.filter(([, passed]) => !passed).map(([label]) => label);
if (failures.length) {
  console.error("Release contract verification failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  if (legacyGlobalBuildWriters.length) console.error(`  writers: ${legacyGlobalBuildWriters.join(", ")}`);
  process.exitCode = 1;
} else {
  console.log(`Release contract verified: V${RELEASE_BUILD} / ${CACHE_NAME}`);
}
