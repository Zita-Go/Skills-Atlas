// `skills-atlas registry add|list|remove` — manage private catalog sources.
'use strict';

const { parse } = require('../args');
const { fetchSource, counts, PUBLIC_URL } = require('../data');
const registry = require('../registry');
const { green, dim, cyan, bold } = require('../format');

const HELP = `usage: skills-atlas registry <add|list|remove> [url|path]

Manage private catalog sources (a data.json in the same schema). Their skills
merge into search / info / install / kit; a private source wins a name clash.

  add <url|path>     add a source (--name <label>); fetches + caches it now
  list               show the public default + your private sources
  remove <url|path>  drop a source

A source can be an https URL or a local file path. For a private URL behind auth,
set SKILLS_ATLAS_TOKEN (sent as a Bearer header). CI: SKILLS_ATLAS_SOURCES=url1,url2`;

module.exports = async function registryCmd(argv) {
  const { values, positionals } = parse(argv, ['json', 'name']);
  if (values.help) { console.log(HELP); return; }
  const sub = positionals[0] || 'list';
  const url = positionals[1];

  if (sub === 'list') {
    const srcs = registry.effectiveSources();
    if (values.json) { console.log(JSON.stringify(srcs, null, 2)); return; }
    console.log(`${bold('public')}  ${PUBLIC_URL}  ${dim('(default)')}`);
    if (!srcs.length) { console.log(dim('no private sources. add one: skills-atlas registry add <url|path>')); return; }
    for (const s of srcs) {
      const cached = registry.readCachedSource(s.url);
      const n = cached ? Object.keys(cached.vendors || {}).length : 0;
      console.log(`${green('•')} ${s.name ? bold(s.name) + '  ' : ''}${s.url}  ${dim(cached ? n + ' vendors' : 'not fetched — run skills-atlas update')}`);
    }
    return;
  }

  if (sub === 'add') {
    if (!url) { console.error('usage: skills-atlas registry add <url|path>'); process.exitCode = 1; return; }
    try {
      const d = await fetchSource(url);
      registry.cacheSource(url, d);
      registry.addSource(url, { name: values.name });
      const c = counts(d);
      if (values.json) { console.log(JSON.stringify({ added: url, counts: c })); return; }
      console.log(`${green('✓')} added private source ${cyan(url)}  ${dim(`(${c.vendors} vendors, ${c.groups} groups)`)}`);
      console.log(dim('its skills now appear in search / info / install / kit.'));
    } catch (e) { console.error(`failed to add ${url}: ${e.message}`); process.exitCode = 1; }
    return;
  }

  if (sub === 'remove') {
    if (!url) { console.error('usage: skills-atlas registry remove <url|path>'); process.exitCode = 1; return; }
    const removed = registry.removeSource(url);
    registry.removeCachedSource(url);
    if (values.json) { console.log(JSON.stringify({ removed: removed ? url : null })); if (!removed) process.exitCode = 1; return; }
    if (removed) console.log(`${green('✓')} removed ${url}`);
    else { console.error(`not a configured source: ${url}`); process.exitCode = 1; }
    return;
  }

  console.error(`unknown registry subcommand '${sub}'. use: add | list | remove`);
  process.exitCode = 1;
};
