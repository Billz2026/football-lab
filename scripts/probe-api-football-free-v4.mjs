#!/usr/bin/env node

const realFetch = globalThis.fetch;
const MIN_GAP_MS = 7000;
let lastCallStartedAt = 0;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

globalThis.fetch = async (...args) => {
  const now = Date.now();
  const elapsed = now - lastCallStartedAt;
  const wait = lastCallStartedAt === 0 ? MIN_GAP_MS : Math.max(0, MIN_GAP_MS - elapsed);
  if (wait > 0) await sleep(wait);
  lastCallStartedAt = Date.now();
  return realFetch(...args);
};

await import('./probe-api-football-free-v3.mjs');
