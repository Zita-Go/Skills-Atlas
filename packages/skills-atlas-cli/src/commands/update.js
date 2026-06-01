'use strict';

const { parse } = require('../args');
const { refreshData, refreshSources } = require('../data');

module.exports = async function update(argv) {
  const { values } = parse(argv, ['json']);
  if (values.help) {
    console.log('usage: skills-atlas update\n\nRefresh the local catalog cache from the public data feed.');
    return;
  }

  try {
    const res = await refreshData();
    const sources = await refreshSources();
    if (values.json) { console.log(JSON.stringify({ ...res, sources }, null, 2)); return; }
    if (!res.changed) {
      console.log(`catalog already up to date (${res.counts.vendors} vendors, ${res.counts.groups} groups).`);
    } else {
      const p = res.prevCounts;
      const was = p ? `  ${'(was ' + p.vendors + ' vendors / ' + p.groups + ' groups)'}` : '';
      console.log(`updated: ${res.counts.sections} sections, ${res.counts.groups} groups, ${res.counts.vendors} vendors.${was}`);
    }
    if (sources.length) {
      const ok = sources.filter(s => s.ok).length;
      const failed = sources.filter(s => !s.ok).map(s => s.url);
      console.log(`private sources: ${ok}/${sources.length} refreshed${failed.length ? ' (failed: ' + failed.join(', ') + ')' : ''}.`);
    }
  } catch (e) {
    console.error(`update failed: ${e.message}`);
    process.exitCode = 1;
  }
};
