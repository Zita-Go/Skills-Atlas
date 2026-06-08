// Regenerate the README hero screenshots from docs/ so they track the data.
// Run AFTER scripts/gen_html.py (which rebuilds docs/index.html + docs/data.json).
//
//   npm i -D playwright && npx playwright install chromium
//   node scripts/gen_screenshots.mjs
//
// Produces (1.5x DPI):
//   docs/screenshot-dark.png       — English UI, dark   (README.md hero, CLI README)
//   docs/screenshot-light.png      — English UI, light  (CLI README)
//   docs/screenshot-dark.zh-CN.png — 中文界面, dark      (README.zh-CN.md hero)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const docs = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'docs');
const MIME = { '.html': 'text/html', '.json': 'application/json', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.js': 'text/javascript', '.css': 'text/css', '.ico': 'image/x-icon' };

const SHOTS = [
  { file: 'screenshot-dark.png',       lang: 'en', theme: 'dark'  },
  { file: 'screenshot-light.png',      lang: 'en', theme: 'light' },
  { file: 'screenshot-dark.zh-CN.png', lang: 'zh', theme: 'dark'  },
];

const server = http.createServer((req, res) => {
  let f = path.join(docs, decodeURIComponent(req.url.split('?')[0]));
  if (f.endsWith(path.sep)) f = path.join(f, 'index.html');
  fs.readFile(f, (e, buf) => {
    if (e) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' });
    res.end(buf);
  });
});

let chromium;
try { ({ chromium } = await import('playwright')); }
catch { console.error('Missing dependency. Run:  npm i -D playwright && npx playwright install chromium'); process.exit(1); }

await new Promise(r => server.listen(0, r));
const port = server.address().port;
const browser = await chromium.launch();
for (const sh of SHOTS) {
  const ctx = await browser.newContext({ viewport: { width: 1680, height: 800 }, deviceScaleFactor: 1.5, colorScheme: sh.theme });
  const p = await ctx.newPage();
  await p.goto(`http://localhost:${port}/index.html?lang=${sh.lang}`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(700);
  if (sh.theme === 'light') await p.evaluate(() => { if (!document.documentElement.classList.contains('light')) document.querySelector('.js-theme').click(); });
  await p.evaluate(() => document.fonts && document.fonts.ready);
  await p.waitForTimeout(1400);                 // fonts + treemap settle
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.screenshot({ path: path.join(docs, sh.file) });
  console.log('captured', sh.file);
  await ctx.close();
}
await browser.close();
server.close();
