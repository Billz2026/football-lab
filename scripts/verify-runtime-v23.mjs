import { readFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const game = path.join(root, 'game');
const manifest = JSON.parse(await readFile(path.join(game, 'runtime-v23-manifest.json'), 'utf8'));
const forbidden = [
  'URL.createObjectURL',
  'new Blob(',
  'fetch(sourceUrl',
  'fetch(upstreamUrl',
  'blob:http:',
  'blob:https:'
];

if (manifest.version !== 23 || manifest.entry !== 'runtime-v23-main.js') {
  throw new Error('Invalid V23 runtime manifest.');
}
if (!Array.isArray(manifest.modules) || manifest.modules.length < 4) {
  throw new Error('V23 runtime capture produced too few static modules.');
}

for (const filename of manifest.modules) {
  const source = await readFile(path.join(game, filename), 'utf8');
  for (const needle of forbidden) {
    if (source.includes(needle)) throw new Error(`${filename} contains forbidden runtime code: ${needle}`);
  }
}

const entry = await readFile(path.join(game, manifest.entry), 'utf8');
if (!entry.includes('__footballLabRuntimeV23')) throw new Error('V23 static runtime marker is missing.');
if (!entry.includes('requestAnimationFrame(frame)')) throw new Error('V23 entry does not contain the gameplay frame loop.');

console.log(`Verified Football Lab V23 static runtime (${manifest.modules.length} modules).`);
