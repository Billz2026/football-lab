from pathlib import Path

path = Path("game/character-3d-v46.js")
text = path.read_text()
old = '''  if (p.run < 0.55) return { clip: "approach", t: p.run / 0.55, p };
  if (p.run < 0.72) return { clip: "plant", t: (p.run - 0.55) / 0.17, p };
  if (p.run < 0.9) return { clip: "windup", t: (p.run - 0.72) / 0.18, p };
  return { clip: "contact", t: (p.run - 0.9) / 0.1, p };
'''
new = '''  // Keep the authoritative 560 ms run-up unchanged, but give the kicking leg enough
  // visual preparation to read as a real strike at gameplay frame rates.
  if (p.run < 0.4) return { clip: "approach", t: p.run / 0.4, p };
  if (p.run < 0.55) return { clip: "plant", t: (p.run - 0.4) / 0.15, p };
  if (p.run < 0.9) return { clip: "windup", t: (p.run - 0.55) / 0.35, p };
  return { clip: "contact", t: (p.run - 0.9) / 0.1, p };
'''

if new in text:
    raise SystemExit(0)
if old not in text:
    raise SystemExit("V46 outfield timing block not found")
path.write_text(text.replace(old, new))
