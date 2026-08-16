from pathlib import Path

path = Path('game/character-3d-v46.js')
text = path.read_text()

old = '''function installKeeperNow() {
  if (keeperInstalled) return true;
  const original = window.__footballLabPremiumKeeperSceneDrawV3852;
  if (typeof original !== "function") return false;

  window.__footballLabPremiumKeeperSceneDrawV3852 = function footballLabKeeperSceneV46(time) {'''
new = '''function installKeeperNow() {
  const current = window.__footballLabPremiumKeeperSceneDrawV3852;
  if (keeperInstalled && current?.__footballLabV46KeeperHook === true) return true;
  if (!window.__footballLabKeeperRendererV44) return false;
  if (typeof current !== "function") return false;
  if (current.__footballLabV46KeeperHook === true) {
    keeperInstalled = true;
    return true;
  }
  const original = current;

  const v46KeeperHook = function footballLabKeeperSceneV46(time) {'''
if old not in text:
    raise SystemExit('installKeeperNow opening block not found')
text = text.replace(old, new, 1)

old = '''    return result;
  };

  keeperInstalled = true;
  return true;
}'''
new = '''    return result;
  };

  Object.defineProperty(v46KeeperHook, "__footballLabV46KeeperHook", {
    value: true,
    configurable: false,
    enumerable: false,
    writable: false
  });
  window.__footballLabPremiumKeeperSceneDrawV3852 = v46KeeperHook;
  keeperInstalled = true;
  return true;
}'''
if old not in text:
    raise SystemExit('installKeeperNow closing block not found')
text = text.replace(old, new, 1)

old = '''export function drawHeroCharacterV46(time) {
  const entry = activeOutfieldEntry();'''
new = '''export function drawHeroCharacterV46(time) {
  if (keeperInstalled && window.__footballLabPremiumKeeperSceneDrawV3852?.__footballLabV46KeeperHook !== true) {
    keeperInstalled = false;
    installKeeperNow();
  }
  const entry = activeOutfieldEntry();'''
if old not in text:
    raise SystemExit('hero hook repair insertion point not found')
text = text.replace(old, new, 1)

path.write_text(text)
print('Patched deterministic V46 keeper hook ownership')
