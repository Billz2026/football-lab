# V23 Runtime Refactor

The current verified browser-generated gameplay and renderer modules have been captured as static ES modules. Normal startup now uses `game/runtime-v23-main.js`; the legacy chain is available only through the explicit `?runtime-capture=v23` development route so the frozen runtime remains reproducible and auditable.
