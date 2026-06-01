// Detect a project's archetype(s) from on-disk signals. Best-effort and dependency
// free; always returns at least ['generic']. Pure w.r.t. its `dir` argument.
'use strict';

const fs = require('fs');
const path = require('path');

const readText = p => { try { return fs.readFileSync(p, 'utf8'); } catch { return null; } };
const readJson = p => { const t = readText(p); if (!t) return null; try { return JSON.parse(t); } catch { return null; } };
const listdir = d => { try { return fs.readdirSync(d); } catch { return []; } };

function detect(dir = process.cwd()) {
  const archetypes = new Set();
  const signals = [];
  const add = (a, why) => { archetypes.add(a); signals.push(why); };

  // --- Node / package.json ---
  const pkg = readJson(path.join(dir, 'package.json'));
  if (pkg) {
    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    const names = Object.keys(deps);
    const anyDep = res => names.some(d => res.some(re => re.test(d)));
    if (anyDep([/^react$/, /^vue$/, /^svelte$/, /^next$/, /^nuxt$/, /^vite$/, /^@angular\//, /^solid-js$/]))
      add('web-frontend', 'package.json: a frontend framework (react/vue/next/…)');
    if (anyDep([/^express$/, /^fastify$/, /^@nestjs\//, /^koa$/, /^hapi$/]))
      add('backend-service', 'package.json: a web-server framework');
    if (pkg.bin) add('cli-library', 'package.json: bin field (CLI)');
  }

  // --- Python ---
  const py = `${readText(path.join(dir, 'pyproject.toml')) || ''}\n${readText(path.join(dir, 'requirements.txt')) || ''}`.toLowerCase();
  const hasNotebook = listdir(dir).some(f => f.endsWith('.ipynb'));
  if (/pandas|numpy|scikit-learn|tensorflow|torch|jupyter/.test(py) || hasNotebook)
    add('data-ml', 'python: data/ML libraries or notebooks');
  if (/fastapi|flask|django/.test(py)) add('backend-service', 'python: a web framework');

  // --- Infra ---
  const entries = listdir(dir);
  if (entries.some(f => f.endsWith('.tf')) ||
      fs.existsSync(path.join(dir, 'Dockerfile')) ||
      entries.some(f => /^docker-compose\.ya?ml$/.test(f)))
    add('infra-devops', 'infra: terraform/docker files');

  return { archetypes: archetypes.size ? [...archetypes] : ['generic'], signals };
}

module.exports = { detect };
