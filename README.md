# Football Lab

Football Lab is a browser-based arcade free-kick game hosted on GitHub Pages. Players lock three timed inputs—power, placement and curve—then compete through escalating stages with specialist kickers, defensive walls, goalkeepers, wind, lives, streak recovery, medals and persistent progression.

## Public build

- Game: `https://billz2026.github.io/football-lab/index.html`
- Entry point: `/index.html`
- Current public release: V51.2.0
- Static runtime architecture: V23

## Run locally

Use a local HTTP server rather than opening the file directly so modules and the service worker use the same environment as production.

```bash
python3 -m http.server 4173 --bind 127.0.0.1
```

Open `http://127.0.0.1:4173/`.

## Browser tests

```bash
npm install
npm run test:browser
```

Pull requests run `npm run test:ci`, which executes the current automated Playwright specifications with zero retries and retained failure traces. Retired mode contracts, superseded renderer internals, obsolete duplicates and manual visual-capture specifications are excluded from the blocking gate; every exclusion and its reason are documented in `playwright.ci.config.js`.

## Static runtime

V23 boots from `game/runtime-v23-main.js`. The gameplay, physics and renderer modules are normal static ES modules; the public route no longer downloads JavaScript as text or executes generated Blob modules.

The frozen runtime can be regenerated from the last verified legacy chain with:

```bash
npm run build:runtime:v23
npm run verify:runtime:v23
```

The build command uses the explicit `?runtime-capture=v23` development route. Normal visitors never use that route. Generated files and their source mapping are recorded in `game/runtime-v23-manifest.json`.

## Deployment

GitHub Pages deploys from the repository's `main` branch and root directory. V51.2.0 is the single public release identifier used by the page entry point, application metadata, service worker URL and shell cache. Run `npm run verify:release:v51` before publishing so those values cannot drift apart.

## Release checklist

- Run the release contract, runtime verification and Playwright browser suite.
- Test 320px, 390px, tablet and desktop layouts.
- Complete one full run with mouse, touch and keyboard.
- Verify sound, haptics, reduced motion and high-contrast settings.
- Verify the first-run tutorial and score sharing.
- Test an offline reload after one online visit.
- Confirm no stale service worker remains after deployment.
- Confirm the public route creates zero JavaScript Blob URLs and does not request legacy generator modules.

## Architecture note

Historical source-generator files remain temporarily as the auditable input for the V23 capture command and as a rollback reference. They are not part of normal production startup. Future product work should extend the static runtime through ordinary ES modules rather than adding source-text replacement layers.
