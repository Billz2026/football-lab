from pathlib import Path

capture = Path('scripts/capture-runtime-v23.mjs')
lines = capture.read_text().splitlines()
needle = 'window.__footballLabRuntimeV23 = Object.freeze'
insert = '      source += `\\nwindow.__footballLabAuthoritativeStateV46 = state;\\n`;'
indices = [i for i, line in enumerate(lines) if needle in line]
if len(indices) != 1:
    raise SystemExit(f'expected one runtime-v23 final assignment, found {len(indices)}')
idx = indices[0]
if any('__footballLabAuthoritativeStateV46 = state' in line for line in lines):
    raise SystemExit('capture script already publishes authoritative V46 state')
lines.insert(idx, insert)
capture.write_text('\n'.join(lines) + '\n')

main11 = Path('game/main-v11-3.js')
text = main11.read_text()
old = 'window.__footballLabAuthoritativeStateV46 = state;\nstate.debugDiagnostics = false;'
new = 'state.debugDiagnostics = false;'
if old not in text:
    raise SystemExit('main-v11 temporary state publication missing')
main11.write_text(text.replace(old, new, 1))
print('Moved V46 authoritative state publication to final runtime-v23-main materialisation')
