import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import net from 'node:net';
import path from 'node:path';
import process from 'node:process';

// Release-critical source: changes here intentionally retrigger both V46 character visual gates.
const ROOT = process.cwd();
const GAME_DIR = path.join(ROOT, 'game');
const HOST = '127.0.0.1';
const PORT = 4173;
const ORIGIN = `http://${HOST}:${PORT}`;
const ENTRY_URL = `${ORIGIN}/index.html?runtime-capture=v23`;
const GENERATED_PREFIX = 'runtime-v23-';
const FORBIDDEN = [
  'URL.createObjectURL',
  'new Blob(',
  'fetch(sourceUrl',
  'fetch(upstreamUrl'
];

const normaliseUrl = (value) => {
  const url = new URL(value);
  url.hash = '';
  return url.href;
};

const shortHash = (value) => createHash('sha256').update(value).digest('hex').slice(0, 10);
const slug = (value) => value
  .replace(/\.js$/i, '')
  .replace(/[^a-z0-9]+/gi, '-')
  .replace(/^-+|-+$/g, '')
  .toLowerCase();

function waitForPort(host, port, timeoutMs = 15000) {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    const attempt = () => {
      const socket = net.createConnection({ host, port });
      socket.once('connect', () => {
        socket.end();
        resolve();
      });
      socket.once('error', () => {
        socket.destroy();
        if (Date.now() - startedAt >= timeoutMs) {
          reject(new Error(`Timed out waiting for ${host}:${port}`));
          return;
        }
        setTimeout(attempt, 100);
      });
    };
    attempt();
  });
}

function generatorSource(source) {
  return FORBIDDEN.some((needle) => source.includes(needle));
}

function stackUrls(stack) {
  const matches = String(stack || '').match(/(?:blob:)?https?:\/\/[^\s)]+/g) || [];
  return matches.map((value) => value.replace(/:\d+:\d+$/, ''));
}

function sourceUrlNames(source) {
  return [...String(source || '').matchAll(/^\/\/# sourceURL=([^\s]+)$/gm)].map((match) => match[1]);
}

function sourceSpecifiers(source) {
  const values = new Set();
  const patterns = [
    /\bfrom\s*["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g,
    /\bimport\s*["']([^"']+)["']/g,
    /\bnew\s+URL\s*\(\s*["']([^"']+)["']/g
  ];
  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) values.add(match[1]);
  }
  return [...values];
}

function resolveSpecifier(specifier, baseUrl) {
  if (!/^(?:\.|https?:)/.test(specifier)) return null;
  try {
    return normaliseUrl(new URL(specifier, baseUrl).href);
  } catch {
    return null;
  }
}

function relativeOutputSpecifier(filename) {
  return `./${filename}`;
}

function originalGameSpecifier(urlValue) {
  const url = new URL(urlValue);
  if (url.origin !== ORIGIN || !url.pathname.startsWith('/game/')) return urlValue;
  return `.${url.pathname.slice('/game'.length)}${url.search}`;
}

function replaceSpecifierLiterals(source, baseUrl, replacementMap) {
  const specifiers = sourceSpecifiers(source).sort((a, b) => b.length - a.length);
  let output = source;
  for (const specifier of specifiers) {
    const resolved = resolveSpecifier(specifier, baseUrl);
    if (!resolved) continue;
    const replacement = replacementMap.get(resolved)
      ? relativeOutputSpecifier(replacementMap.get(resolved))
      : originalGameSpecifier(resolved);
    if (replacement === specifier) continue;
    output = output.split(specifier).join(replacement);
  }
  return output;
}

function terminalBlob(startId, children, blobs) {
  let current = startId;
  const visited = new Set();
  while (current && !visited.has(current)) {
    visited.add(current);
    const childIds = children.get(current) || [];
    if (!generatorSource(blobs.get(current)?.source || '') || childIds.length === 0) return current;
    if (childIds.length !== 1) {
      throw new Error(`Generator ${current} created ${childIds.length} JavaScript blobs; expected one.`);
    }
    current = childIds[0];
  }
  throw new Error(`Unable to resolve terminal generated module for ${startId}`);
}

async function cleanGeneratedFiles() {
  await mkdir(GAME_DIR, { recursive: true });
  for (const name of await readdir(GAME_DIR)) {
    if (name.startsWith(GENERATED_PREFIX) && (name.endsWith('.js') || name.endsWith('.json'))) {
      await rm(path.join(GAME_DIR, name));
    }
  }
}

async function captureRuntime() {
  const server = spawn('python3', ['-m', 'http.server', String(PORT), '--bind', HOST], {
    cwd: ROOT,
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let serverErrors = '';
  server.stderr.on('data', (chunk) => { serverErrors += chunk; });

  try {
    await waitForPort(HOST, PORT);
    const browser = await chromium.launch({ headless: true });
    try {
      const context = await browser.newContext({ serviceWorkers: 'block' });
      const page = await context.newPage();
      const httpModules = new Map();
      const blobs = new Map();
      const pageErrors = [];

      page.on('pageerror', (error) => pageErrors.push(error.stack || error.message));
      page.on('response', async (response) => {
        const url = response.url();
        if (!url.startsWith(`${ORIGIN}/game/`) || !/\.js(?:\?|$)/.test(url)) return;
        try {
          httpModules.set(normaliseUrl(url), await response.text());
        } catch {
          // A response may have been consumed or cancelled; required modules are checked later.
        }
      });

      await page.exposeFunction('__captureFootballLabBlobV23', ({ url, source, stack }) => {
        blobs.set(url, { source, stack });
      });

      await page.addInitScript(() => {
        const createObjectURL = URL.createObjectURL.bind(URL);
        URL.createObjectURL = function captureObjectUrl(blob) {
          const stack = new Error('football-lab-v23-blob').stack || '';
          const url = createObjectURL(blob);
          if (blob instanceof Blob && /javascript|ecmascript/i.test(blob.type || '')) {
            blob.text()
              .then((source) => window.__captureFootballLabBlobV23({ url, source, stack }))
              .catch(() => {});
          }
          return url;
        };
      });

      await page.goto(ENTRY_URL, { waitUntil: 'networkidle' });
      await page.waitForTimeout(1800);

      const startupError = await page.evaluate(() => window.__footballLabStartupError);
      if (startupError) throw new Error(`Football Lab startup failed during capture:\n${startupError}`);
      if (pageErrors.length) throw new Error(`Browser errors during capture:\n${pageErrors.join('\n\n')}`);

      return { httpModules, blobs };
    } finally {
      await browser.close();
    }
  } finally {
    server.kill('SIGTERM');
    if (serverErrors && !/Serving HTTP/.test(serverErrors)) process.stderr.write(serverErrors);
  }
}

async function buildStaticRuntime({ httpModules, blobs }) {
  if (!blobs.size) throw new Error('No generated JavaScript blobs were captured.');

  const children = new Map();
  const allNodeIds = new Set([...httpModules.keys(), ...blobs.keys()]);
  const sourceNameParents = new Map();
  for (const [blobUrl, record] of blobs) {
    for (const name of sourceUrlNames(record.source)) sourceNameParents.set(name, blobUrl);
  }

  for (const [blobUrl, record] of blobs) {
    const candidates = stackUrls(record.stack).filter((url) => url !== blobUrl);
    const namedParent = [...sourceNameParents.entries()]
      .find(([name, candidate]) => candidate !== blobUrl && String(record.stack || '').includes(name))?.[1];
    const parent = candidates.find((url) => allNodeIds.has(url))
      || candidates.find((url) => url.startsWith(`${ORIGIN}/game/`))
      || namedParent;
    if (!parent) {
      throw new Error(`Unable to identify generator for captured blob ${blobUrl}. Stack: ${record.stack}`);
    }
    const childList = children.get(parent) || [];
    childList.push(blobUrl);
    children.set(parent, childList);
  }

  const generatorUrls = [...httpModules.entries()]
    .filter(([url, source]) => generatorSource(source) && (children.get(url) || []).length > 0)
    .map(([url]) => url);
  if (!generatorUrls.some((url) => new URL(url).pathname.endsWith('/main-v18.js'))) {
    throw new Error('The V18 gameplay generator was not captured.');
  }

  const modules = new Map();
  const replacementMap = new Map();
  for (const generatorUrl of generatorUrls) {
    const directChildren = children.get(generatorUrl) || [];
    if (directChildren.length !== 1) {
      throw new Error(`Generator ${generatorUrl} created ${directChildren.length} direct blobs; expected one.`);
    }
    const terminalId = terminalBlob(directChildren[0], children, blobs);
    const terminal = blobs.get(terminalId);
    if (!terminal) throw new Error(`Missing terminal blob source for ${generatorUrl}`);
    const basename = path.posix.basename(new URL(generatorUrl).pathname);
    const filename = basename === 'main-v18.js'
      ? 'runtime-v23-main.js'
      : `runtime-v23-generated-${slug(basename)}-${shortHash(generatorUrl)}.js`;
    replacementMap.set(generatorUrl, filename);
    modules.set(filename, {
      source: terminal.source,
      baseUrl: generatorUrl,
      kind: 'generated',
      origin: generatorUrl
    });
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (const [url, source] of httpModules) {
      if (replacementMap.has(url) || generatorSource(source)) continue;
      const dependsOnReplacement = sourceSpecifiers(source).some((specifier) => {
        const resolved = resolveSpecifier(specifier, url);
        return resolved && replacementMap.has(resolved);
      });
      if (!dependsOnReplacement) continue;
      const basename = path.posix.basename(new URL(url).pathname);
      const filename = `runtime-v23-bridge-${slug(basename)}-${shortHash(url)}.js`;
      replacementMap.set(url, filename);
      modules.set(filename, { source, baseUrl: url, kind: 'bridge', origin: url });
      changed = true;
    }
  }

  if (!replacementMap.has(normaliseUrl(`${ORIGIN}/game/render-v17-3-1.js?v=1731`))) {
    throw new Error('The public V17.3.1 renderer bridge was not materialised.');
  }

  const written = [];
  for (const [filename, record] of modules) {
    let source = replaceSpecifierLiterals(record.source, record.baseUrl, replacementMap);
    source = source.replace(/^\/\/# sourceURL=.*$/gm, '');
    if (filename === 'runtime-v23-main.js') {
      source += `\nwindow.__footballLabRuntimeV23 = Object.freeze({ staticModules: true, generatedModuleCount: ${modules.size} });\n`;
    }
    for (const needle of FORBIDDEN) {
      if (source.includes(needle)) throw new Error(`${filename} still contains runtime generator code: ${needle}`);
    }
    for (const generatorUrl of generatorUrls) {
      if (source.includes(generatorUrl)) throw new Error(`${filename} still references generator ${generatorUrl}`);
    }
    await writeFile(path.join(GAME_DIR, filename), `${source.trim()}\n`, 'utf8');
    written.push(filename);
  }

  const manifest = {
    version: 23,
    entry: 'runtime-v23-main.js',
    generatedAt: new Date().toISOString(),
    generatorCount: generatorUrls.length,
    moduleCount: written.length,
    modules: written.sort(),
    replacements: [...replacementMap.entries()]
      .map(([url, filename]) => ({ url: new URL(url).pathname + new URL(url).search, filename }))
      .sort((a, b) => a.url.localeCompare(b.url))
  };
  await writeFile(
    path.join(GAME_DIR, 'runtime-v23-manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );
  return manifest;
}

await cleanGeneratedFiles();
const capture = await captureRuntime();
const manifest = await buildStaticRuntime(capture);
console.log(`Captured Football Lab V23 static runtime: ${manifest.moduleCount} modules from ${manifest.generatorCount} generators.`);
