// Smoke test for the private analytics collector (P1).
//
// The collector is gated by a non-empty `ANALYTICS_ENDPOINT` const in the built page (which is ''
// off-by-default in the committed build). This runner temporarily flips that const in a COPY of
// docs/index.html to a dummy endpoint, stubs navigator.sendBeacon to capture payloads, drives a
// few actions, and asserts the expected event types fire with no JS errors. It never modifies the
// committed docs/index.html.
//
//   node scripts/test/collector-smoke.mjs
//
// Requires Playwright (used elsewhere in this repo's dev tooling).
import playwright from '/root/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const { chromium } = playwright;
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const SRC = path.join(ROOT, 'docs/index.html');

// Build a temp copy with the endpoint enabled (so the collector is live for the test).
const html = fs.readFileSync(SRC, 'utf8');
const enabled = html.replace(
  "const ANALYTICS_ENDPOINT = '';",
  "const ANALYTICS_ENDPOINT = 'https://test.invalid/event';"
);
if (enabled === html) { console.error('FAIL: could not find ANALYTICS_ENDPOINT const to enable'); process.exit(1); }
const tmp = path.join(os.tmpdir(), 'sa-collector-smoke.html');
fs.writeFileSync(tmp, enabled);

const URL = 'file://' + tmp + '?lang=zh';
const errs = [];
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => {
    window.__beacons = [];
    navigator.sendBeacon = (u, body) => { try { window.__beacons.push(JSON.parse(body)); } catch (e) {} return true; };
  });
  await page.goto(URL);
  await page.waitForTimeout(700);

  // use_open
  await page.evaluate(() => document.querySelector('.use-this').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(300);
  await page.click('.use-this');
  await page.waitForTimeout(200);
  // copy_plugin (popover's first copy button = plugin command)
  await page.click('#usePop .up-cmd .src-act');
  await page.waitForTimeout(200);
  // search (debounced ~900ms)
  await page.fill('#search', 'seo');
  await page.waitForTimeout(1100);
  // flush
  await page.evaluate(() => window.dispatchEvent(new Event('pagehide')));
  await page.waitForTimeout(200);

  const types = await page.evaluate(() => (window.__beacons || []).flatMap(b => (b.events || []).map(e => e.type)));
  const sample = await page.evaluate(() => (window.__beacons || []).flatMap(b => b.events || [])[0] || null);
  console.log('captured types:', JSON.stringify(types));
  console.log('sample event:', JSON.stringify(sample));
  console.log('JS errors:', errs.length ? errs.join(' | ') : 'NONE');

  const need = ['use_open', 'copy_plugin', 'search'];
  const missing = need.filter(t => !types.includes(t));
  if (errs.length || missing.length) {
    console.error('SMOKE FAIL — missing:', missing, '| errors:', errs.length);
    process.exit(1);
  }
  console.log('SMOKE OK');
} finally {
  await browser.close();
  try { fs.unlinkSync(tmp); } catch (e) {}
}
