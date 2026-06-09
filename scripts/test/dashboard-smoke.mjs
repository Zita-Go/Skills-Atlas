// Smoke: stub fetch to return canned /stats JSON, load the dashboard, assert sections render.
//   node scripts/test/dashboard-smoke.mjs
import playwright from '/root/.npm/_npx/e41f203b7505f1fb/node_modules/playwright/index.js';
const { chromium } = playwright;
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DASHBOARD_HTML } from '../../worker-analytics/dashboard.js';

// Single source: render the exact HTML the worker serves at GET /dashboard.
const tmp = path.join(os.tmpdir(), 'sa-dashboard-smoke.html');
fs.writeFileSync(tmp, DASHBOARD_HTML);
const URL = 'file://' + tmp;
const errs = [];
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  page.on('pageerror', e => errs.push(String(e)));
  await page.addInitScript(() => {
    window.fetch = async () => ({ ok: true, status: 200, json: async () => ({
      generatedAt: 1, days: 7,
      stats: { topSkills: [{ target: 'brainstorming', n: 9 }], clientTotals: [{ client: 'web', n: 100 }, { client: 'cli', n: 20 }] },
    }) });
  });
  await page.goto(URL);
  await page.fill('#ep', 'https://x.workers.dev');
  await page.fill('#tok', 'secret');
  await page.click('#load');
  await page.waitForTimeout(300);
  const out = await page.$eval('#out', e => e.innerText);
  const ok = out.includes('Top skills') && out.includes('brainstorming') && out.includes('Volume');
  console.log('rendered sections:', ok, '| JS errors:', errs.length ? errs.join(' | ') : 'NONE');
  if (!ok || errs.length) process.exit(1);
  console.log('DASHBOARD SMOKE OK');
} finally { await browser.close(); try { fs.unlinkSync(tmp); } catch (e) {} }
