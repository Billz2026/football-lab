import fs from 'node:fs';

const basePath = 'game/runtime-v23-generated-render-v17-1-base-v1731-33ac3afcb7.js';
const stadiumSourcePath = 'tools/v40-3a-stadium-source.txt';
const filesToBump = [
  'game/runtime-v23-bridge-render-v9-v17-3-1-daf59fdc4b.js',
  'game/runtime-v23-generated-render-v15-v1731-1b04a249af.js',
  'game/runtime-v23-generated-render-v17-v1731-7f257084b1.js',
  'game/runtime-v23-bridge-render-v17-3-1-64b7ab3399.js',
  'game/runtime-v23-main.js',
  'app.js',
  'sw.js'
];

function read(path) { return fs.readFileSync(path, 'utf8'); }
function write(path, value) { fs.writeFileSync(path, value); }

let base = read(basePath);
const start = base.indexOf('const VENUE_THEMES = Object.freeze({');
const end = base.indexOf('function drawGoalContrastV402C()');
if (start < 0 || end < 0 || end <= start) throw new Error('Unable to locate stadium renderer block');

const replacement = read(stadiumSourcePath).trimEnd() + '\n\n';
base = base.slice(0, start) + replacement + base.slice(end);
write(basePath, base);

for (const path of filesToBump) {
  let src = read(path);
  src = src.replaceAll('40.2.3', '40.3.0');
  if (path === 'app.js') {
    src = src.replace('// Football Lab V40.2D authoritative canvas outcome feedback', '// Football Lab V40.3A stadium progression architecture');
    src = src.replace('badge.textContent = "V40.2D"', 'badge.textContent = "V40.3A"');
    src = src.replace(
      'outcomeCanvasSting: "visible-on-desktop-fold-mobile",',
      'outcomeCanvasSting: "visible-on-desktop-fold-mobile",\n          stadiumProgression: "six-distinct-chapter-venues-academy-to-summit",\n          stadiumArchitecture: "scaled-tiers-concourse-roof-aisles-rails-crowd-silhouettes",\n          stadiumQualityScaling: "fold-mobile-reduced-crowd-detail",'
    );
    src = src.replace(
      'window.__footballLabReleaseV402D = release;',
      'window.__footballLabReleaseV402D = release;\n        window.__footballLabReleaseV403A = release;'
    );
  }
  if (path === 'sw.js') {
    src = src.replace('// Football Lab V40.2D authoritative canvas outcome feedback cache reset', '// Football Lab V40.3A stadium progression architecture cache reset');
    src = src.replace('football-lab-shell-v40-2-3', 'football-lab-shell-v40-3-0');
  }
  write(path, src);
}

console.log('Applied Football Lab V40.3A stadium progression architecture');
