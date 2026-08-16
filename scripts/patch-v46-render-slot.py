from pathlib import Path

path = Path("game/render-v11-4-base.js")
text = path.read_text()
label = "V46 keeper scene slot"

if label in text:
    raise SystemExit(0)

marker = "// Blob modules need absolute dependency URLs because their own URL has no directory."
if marker not in text:
    raise SystemExit("render-v11-4-base marker missing")

block = r'''
// V46: replace the legacy keeper exactly where the base scene draws it so depth remains
// goal -> keeper -> wall -> ball. The premium callback falls back to the V38 keeper
// until a production GLB is ready; V46 wraps the same callback when Mikkel is available.
replaceRequired(
  "V46 keeper scene slot",
  "  drawKeeper(time);\n  drawWallSprayLine();",
  "  const premiumKeeperDraw = window.__footballLabPremiumKeeperSceneDrawV3852;\n  if (typeof premiumKeeperDraw === \"function\") {\n    const keeperHandled = premiumKeeperDraw(time);\n    if (!keeperHandled) drawKeeper(time);\n  } else {\n    drawKeeper(time);\n  }\n  drawWallSprayLine();"
);

'''

path.write_text(text.replace(marker, block + marker))
