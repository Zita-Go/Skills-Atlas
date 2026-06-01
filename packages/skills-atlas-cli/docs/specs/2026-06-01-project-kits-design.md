# Project Kits — Design

- **Date:** 2026-06-01
- **Status:** Approved (design), pending spec review → implementation plan
- **Package:** `packages/skills-atlas-cli`
- **Target version:** 0.5.0 (new feature)

## Summary

Add **project-aware skill kits**: a `skills-atlas kit` command that inspects the
current project, proposes a tailored set of catalog skills (the work this project
involves, not its tech stack), installs them to project scope after the user
confirms, and writes a **committable, reproducible manifest** (`skills-atlas.kit.json`).
A companion `skills-atlas sync` reads that manifest and reproduces the exact set —
for teammates and CI. The manifest is also the foundation for a future team registry.

## Key decisions (settled in brainstorming)

1. **Kits are built around the WORK, not the tech stack.** The catalog is organized
   by function/role (verified: it has 9 personas / 20 categories and is thin on
   stack-specific skills — `typescript→0`, `docker→1`, `kubernetes→1` rows). So a
   kit maps a project *archetype* → high-value **functional** skills, not "React →
   React skills."
2. **Hybrid mapping.** Everyone gets a curated universal *core dev workflow*; each
   detected archetype adds a small curated *add-on* set.
3. **Reproducible declaration.** `kit` writes a committable `skills-atlas.kit.json`;
   `sync` restores it exactly. Bridges to the future team-registry capability.

## Detailed design

### 1. Commands

**`skills-atlas kit`** — the main entry point.
Flow: detect project → propose kit (each skill with a one-line reason) → user
confirms / edits → install to `./.claude/skills/` (project scope) → write
`skills-atlas.kit.json`.

Flags:
- `--yes` — skip the confirm prompt (install the proposed set as-is)
- `--edit` — interactively toggle individual skills before installing
- `--archetype <name>` — override detection (e.g. `web-frontend`)
- `--global` — install to `~/.claude/skills/` instead of project scope
- `--dry-run` — show the proposed kit and write nothing
- `--json` — machine-readable proposal/output

**`skills-atlas sync`** — read `skills-atlas.kit.json` and install/upgrade the
project to match it exactly. Idempotent; for teammates and CI.
Flags: `--yes`, `--global`, `--dry-run`, `--json`, `--update` (re-resolve every
skill to its latest upstream and rewrite the manifest).

### 2. Detection (signals → archetype)

Read, in the project root (cwd, walking up to the nearest project marker):
- `package.json` dependencies:
  - frontend: `react`, `vue`, `svelte`, `next`, `nuxt`, `vite`, `@angular/*`, `solid-js`
  - backend/service: `express`, `fastify`, `@nestjs/*`, `koa`, `hapi`
  - cli/library: a `bin` field, or a library with no server/UI deps
- Python (`pyproject.toml` / `requirements.txt` / imports):
  - data/ML: `pandas`, `numpy`, `scikit-learn`, `torch`, `tensorflow`, `jupyter`, `.ipynb` files
  - backend/service: `fastapi`, `flask`, `django`
- Other language markers: `go.mod`, `Cargo.toml`, `pom.xml`, `build.gradle`
- Infra: `*.tf`, `Dockerfile`, `docker-compose.yml`, k8s/helm yaml, `Pulumi.yaml`, `ansible.cfg`
- Fallback: file-extension histogram (`.tsx/.py/.go/.rs/...`)

Maps to **one or more** archetypes (a fullstack repo → frontend + backend add-ons,
unioned). The **universal core is always included**. If no signal is strong enough,
the archetype is `generic` (core only).

### 3. Kit mapping (curated hybrid — all skills verified to exist in the catalog)

- **Universal core (always):** `brainstorming → writing-plans → executing-plans`
  (installed as the ⛓ chain it already is) + `systematic-debugging` +
  `test-driven-development` + `requesting-code-review`
- **web-frontend:** + `frontend-design`, `web-design-guidelines`, `webapp-testing`
- **data-ml:** + `data-analysis`, `exploratory-data-analysis`
- **infra-devops:** + `security-best-practices`, `using-git-worktrees`
- **backend-service:** + `sql-queries` (when a database/ORM is detected) and/or
  `mcp-builder` (when it's an MCP/agent server); core-only if neither signal fires
- **cli-library / generic:** core only

The mapping lives as a small data structure in `src/kits.js` (archetype → skill
names + a one-line reason per skill). Skill names reference catalog identity.

### 4. Interaction (transparent, consistent with the autopilot UX)

```
Detected: React + TypeScript web app  (package.json: react, vite, vitest)
Proposed kit "web-frontend" — 9 skills → ./.claude/skills/

  core dev workflow
    • brainstorming          turn an idea into a spec
    • writing-plans          break the work into a plan
    • executing-plans        run the plan task by task
    • systematic-debugging   root-cause a stubborn bug
    • test-driven-development
    • requesting-code-review
  frontend
    • frontend-design        component/layout guidance
    • web-design-guidelines  accessibility + perf best practices
    • webapp-testing         browser/E2E testing

Install all and write skills-atlas.kit.json?  [Y / n / edit]
```

- Each skill shows a one-line "why it's here."
- `edit` lets the user toggle individual skills before installing.
- Non-TTY / `--yes` installs the proposed set without prompting.

### 5. Reproducibility (the manifest)

`skills-atlas kit` writes `skills-atlas.kit.json` at the project root (committable):

```json
{
  "version": 1,
  "archetypes": ["web-frontend"],
  "scope": "project",
  "skills": [
    { "name": "systematic-debugging", "source": "obra", "ref": "main", "commit": "<sha>", "hash": "<content-hash>" }
  ]
}
```

- `sync` reads it and, for each skill, installs if missing or upgrades if it drifts
  from the recorded `ref`/`commit` (reusing `installFolder` + manifest + the existing
  drift guard). Idempotent.
- **Pinning:** record the resolved `commit` (and the existing content `hash`) so a
  teammate reproduces the same bytes. `sync --update` re-resolves to latest and
  rewrites the manifest.
- The existing per-directory `.skills-atlas.json` (install state) is unchanged and
  complementary; `skills-atlas.kit.json` is the *intent* declaration.

### 6. Reuse vs. new code (low implementation cost)

- **Reused:** `installer.installFolder`, the chain installer, `manifest`,
  `fsutil.scopesFor` / drift guard, `search-core` (for showing reasons), `format`.
- **New:**
  - `src/detect.js` — project detector (signals → archetypes)
  - `src/kits.js` — archetype → skills mapping (+ reasons)
  - `src/commands/kit.js` — detect / propose / confirm / install / write manifest
  - `src/commands/sync.js` — read manifest / install-upgrade to match
  - `src/kitmanifest.js` — read/write `skills-atlas.kit.json`
  - bin wiring (`kit`, `sync`) + HELP entries
  - test: **every skill referenced by every kit must exist in the catalog**
    (this already caught a non-existent `openapi` during design)

### 7. Error handling / edge cases

- **No detectable signals** → propose the `generic` core; offer `--archetype` to pick.
- **Skill already installed** → skip (idempotent), note it in the summary.
- **Per-skill fetch failure** (network) → best-effort like the chain installer:
  report the failures, install the rest, write the manifest for what succeeded.
- **Existing `skills-atlas.kit.json`** → `kit` re-detects and offers to update it;
  `sync` just applies it (no detection).
- **Run outside a project** → still offer the core (generic), scoped to cwd.
- **Sandbox/network note:** folder installs need codeload/raw (blocked in this dev
  sandbox); detection, proposal, and manifest writing are testable offline.

### 8. Out of scope (future)

- A full **team/org registry** (private catalog source, org-approved lists) — the
  `skills-atlas.kit.json` + `sync` here is its on-ramp, but the registry itself is a
  separate capability.
- Auto-running `kit` proactively (e.g. on entering a fresh project) — manual for now.

## Success criteria

1. In a real repo, `skills-atlas kit` detects the archetype(s) correctly and
   proposes a sensible, transparent set with per-skill reasons.
2. Confirming installs them to `./.claude/skills/` and writes a valid, committable
   `skills-atlas.kit.json`.
3. A teammate's `skills-atlas sync` reproduces the same set; re-running is a no-op.
4. A unit test fails if any kit references a skill not in the catalog.
5. `--dry-run` writes nothing; `--yes` is non-interactive; `--archetype` overrides
   detection.
