import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const ui = await readFile(new URL('../career-transfers-cm-v1.js', import.meta.url), 'utf8');
const css = await readFile(new URL('../career-transfers-cm-v1.css', import.meta.url), 'utf8');
const gate = await readFile(new URL('../career-transfers-gate-v054.js', import.meta.url), 'utf8');

test('transfer centre exposes the required recruitment filters', () => {
  for (const filter of ['position', 'age', 'contract', 'value', 'stance', 'club', 'sort']) {
    assert.match(ui, new RegExp(`data-cm-filter=\\"${filter}\\"`));
  }
  assert.match(ui, /21 or under/);
  assert.match(ui, /Expiring ≤1 yr/);
  assert.match(ui, /£50m\+/);
  assert.match(ui, /Not for sale/);
});

test('transfer market is a dense information table rather than the legacy card list', () => {
  for (const column of ['Player', 'Pos', 'Age', 'Club', 'Contract', 'Value', 'Asking', 'Status']) {
    assert.match(ui, new RegExp(`>${column}<`));
  }
  assert.match(css, /\.cm-market-header,.cm-market-row\{display:grid/);
  assert.match(css, /height:calc\(100vh - 282px\)/);
  assert.match(css, /position:relative/);
});

test('new transfer presentation removes the black and gold v050 palette', () => {
  assert.doesNotMatch(css, /#efb93f|#ffd66a|rgba\(239,185,63/i);
  assert.match(css, /--cm-accent:#58a6b8/);
  assert.match(css, /--cm-panel:#16232d/);
});

test('transfer gate always loads the recruitment workspace and no longer blocks scouting until June', () => {
  assert.match(gate, /career-transfers-cm-v1\.js/);
  assert.doesNotMatch(gate, /TRANSFER_OPEN|Transfer window not open yet|career-transfers-ui-v050/);
});
