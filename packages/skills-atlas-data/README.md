# skills-atlas-data

Structured data for [**Skills Atlas**](https://zita-go.github.io/Skills-Atlas/) — a functional directory of AI agent skills across many GitHub repos, with one-click install commands, SKILL.md paths, licenses, and use-case metadata.

```bash
npm install skills-atlas-data
```

```js
const data = require('skills-atlas-data');

// every ⛓ strong-binding workflow
const chains = data.sections
  .flatMap(s => s.subsections).flatMap(ss => ss.rows)
  .filter(r => r.chain);

// install command + SKILL.md path for a skill's source repo
const v = data.vendors['superpowers'];
console.log(v.install.command);              // npx skills add obra/superpowers
console.log(v.skill_docs['brainstorming']);  // skills/brainstorming/SKILL.md
```

TypeScript types are bundled (`SkillsAtlasData`).

## CLI

```bash
npx skills-atlas seo
# lists matching skill groups with use-case + install command
```

## Schema

See [API.md](https://github.com/Zita-Go/Skills-Atlas/blob/main/docs/API.md). The same data is served at `https://zita-go.github.io/Skills-Atlas/data.json`.

## Maintainers

`npm run build` copies the canonical `docs/data.json` into this package; `npm publish` does it automatically via `prepublishOnly`. Bump `version` when the upstream data changes.

MIT. The catalog metadata is MIT; each underlying skill's SKILL.md stays under its own repo's license (see the `license` field per source).
