# Football Lab

Football Lab is a browser-based arcade free-kick game hosted on GitHub Pages. Players lock three timed inputs—power, placement and curve—then compete through escalating stages with specialist kickers, defensive walls, goalkeepers, wind, lives, streak recovery, medals and persistent progression.

## Public build

- Game: `https://billz2026.github.io/football-lab/index.html`
- Entry point: `/index.html`
- Current product layer: V22

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

## Deployment

GitHub Pages deploys from the repository's `main` branch and root directory. Static assets are cached by `sw.js`; production updates should rotate the cache name and update the application version together.

## Release checklist

- Run the Playwright browser suite.
- Test 320px, 390px, tablet and desktop layouts.
- Complete one full run with mouse, touch and keyboard.
- Verify sound, haptics, reduced motion and high-contrast settings.
- Verify the first-run tutorial and score sharing.
- Test an offline reload after one online visit.
- Confirm no stale service worker remains after deployment.

## Architecture note

The tuned game currently includes historical version adapters. New product features should be added as isolated ES modules rather than additional source-text rewrite layers. A future structural refactor should preserve the verified physics and scoring behaviour while consolidating the runtime into a normal build pipeline.
