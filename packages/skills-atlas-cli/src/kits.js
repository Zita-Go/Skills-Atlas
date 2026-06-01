// Curated project kits: a universal core dev workflow plus per-archetype add-ons.
// Each skill carries a one-line reason. EVERY name here must exist in the catalog
// (enforced by test/kits.test.js — it already caught a non-existent 'openapi').
'use strict';

// [skillName, reason]
const CORE = [
  ['brainstorming', 'turn an idea into a spec'],
  ['writing-plans', 'break the work into a plan'],
  ['executing-plans', 'run the plan task by task'],
  ['systematic-debugging', 'root-cause a stubborn bug'],
  ['test-driven-development', 'write tests first'],
  ['requesting-code-review', 'get a structured review'],
];

const ARCHETYPES = {
  'web-frontend': [
    ['frontend-design', 'component/layout guidance'],
    ['web-design-guidelines', 'accessibility + performance'],
    ['webapp-testing', 'browser/E2E testing'],
  ],
  'backend-service': [
    ['sql-queries', 'natural-language → SQL'],
    ['mcp-builder', 'build an MCP server'],
  ],
  'data-ml': [
    ['data-analysis', 'analyze datasets'],
    ['exploratory-data-analysis', 'EDA workflow'],
  ],
  'infra-devops': [
    ['security-best-practices', 'secure coding + threat modeling'],
    ['using-git-worktrees', 'isolated workspace workflow'],
  ],
  'cli-library': [],
  'generic': [],
};

const ARCHETYPE_NAMES = Object.keys(ARCHETYPES);

// archetypes[] -> [{ name, reason, group }]  (core first, then add-ons, deduped)
function kitFor(archetypes) {
  const out = CORE.map(([name, reason]) => ({ name, reason, group: 'core' }));
  const seen = new Set(out.map(s => s.name));
  for (const a of archetypes || []) {
    for (const [name, reason] of (ARCHETYPES[a] || [])) {
      if (!seen.has(name)) { seen.add(name); out.push({ name, reason, group: a }); }
    }
  }
  return out;
}

// Add an `installed` flag (from a set of already-present skill names).
function buildKitPlan(archetypes, installedNames = new Set()) {
  const skills = kitFor(archetypes).map(s => ({ ...s, installed: installedNames.has(s.name) }));
  return { archetypes: [...archetypes], skills };
}

const allKitSkills = () => [
  ...new Set([...CORE.map(c => c[0]), ...Object.values(ARCHETYPES).flat().map(s => s[0])]),
];

module.exports = { CORE, ARCHETYPES, ARCHETYPE_NAMES, kitFor, buildKitPlan, allKitSkills };
