from pathlib import Path

capture = Path('scripts/capture-runtime-v23.mjs')
text = capture.read_text()
old = '''    if (filename === 'runtime-v23-main.js') {
      source += `\nwindow.__footballLabRuntimeV23 = Object.freeze({ staticModules: true, generatedModuleCount: ${modules.size} });\n`;
    }'''
new = '''    if (filename === 'runtime-v23-main.js') {
      source += `\nwindow.__footballLabAuthoritativeStateV46 = state;\n`;
      source += `window.__footballLabRuntimeV23 = Object.freeze({ staticModules: true, generatedModuleCount: ${modules.size} });\n`;
    }'''
if old not in text:
    raise SystemExit('runtime-v23 final-state insertion point missing')
capture.write_text(text.replace(old, new, 1))

main11 = Path('game/main-v11-3.js')
text = main11.read_text()
old = 'window.__footballLabAuthoritativeStateV46 = state;\nstate.debugDiagnostics = false;'
new = 'state.debugDiagnostics = false;'
if old not in text:
    raise SystemExit('main-v11 temporary state publication missing')
main11.write_text(text.replace(old, new, 1))
print('Moved V46 authoritative state publication to final runtime-v23-main materialisation')
