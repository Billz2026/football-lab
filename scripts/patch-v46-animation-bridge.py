from pathlib import Path

main18 = Path("game/main-v18.js")
text = main18.read_text()
old = 'source += "\\nwindow.__footballLabAuthoritativeStateV46 = state;\\n//# sourceURL=football-lab-main-v19-generated.js\\n";'
new = 'source += "\\n//# sourceURL=football-lab-main-v19-generated.js\\n";'
if old not in text:
    raise SystemExit("main-v18 erroneous state publication point missing")
main18.write_text(text.replace(old, new, 1))

main11 = Path("game/main-v11-3.js")
text = main11.read_text()
old = 'state.debugDiagnostics = false;'
new = 'window.__footballLabAuthoritativeStateV46 = state;\nstate.debugDiagnostics = false;'
if old not in text:
    raise SystemExit("main-v11 authoritative state publication point missing")
main11.write_text(text.replace(old, new, 1))

print("Moved V46 authoritative state publication into the real gameplay module")
