// Copy the canonical docs/data.json into this package as the offline snapshot.
// Mirrors packages/skills-atlas-data/build.js. Run before publish (prepublishOnly).
const fs = require('fs');
const path = require('path');

const src = path.join(__dirname, '..', '..', 'docs', 'data.json');
const dst = path.join(__dirname, 'data.json');

fs.copyFileSync(src, dst);
const data = JSON.parse(fs.readFileSync(dst, 'utf8'));
const groups = data.sections.reduce(
  (n, s) => n + s.subsections.reduce((m, ss) => m + ss.rows.length, 0), 0);
console.log(
  `copied data.json (${data.sections.length} sections, ${groups} groups, ` +
  `${Object.keys(data.vendors).length} vendors)`);
