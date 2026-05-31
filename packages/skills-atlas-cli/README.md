# skills-atlas-cli

Search, install and learn AI agent skills from the terminal — powered by the
[Skills Atlas](https://zita-go.github.io/Skills-Atlas/) catalog (hundreds of
Claude Code / Codex skills across 100+ source repos).

```bash
npx skills-atlas-cli search seo
npx skills-atlas-cli install brainstorming --global
```

Zero runtime dependencies. The catalog snapshot ships with the package and works
offline; `update` refreshes it from the public feed.

## Commands

```text
skills-atlas <command> [args]

search <query>     find skills      (-c category, -p persona, -t type, --chain, --limit, --json)
info <skill>       description, usage guidance, sources & install command   (--json)
install <skill>    download the skill folder into .claude/skills/
                     -g/--global (default ~/.claude/skills)  --project (./.claude/skills)
                     -s/--source <id>  -f/--force  -y/--yes  --dry-run  --json
update             refresh the catalog from the public data feed
categories         list the top-level categories
list [category]    list skill groups (optionally within one category)

global flags: --en (English output), --json, -h/--help
```

## How install works

Every skill in the catalog records the **exact in-repo path** of its `SKILL.md`.
`install` reads that, lists the skill's folder via one GitHub API call, then
downloads each file (preserving subfolders) into `<target>/.claude/skills/<skill>/`.

- Unlike `git clone`, it fetches **only that skill's folder**, not the whole repo.
- If a skill has several sources, the best installable one is auto-picked
  (pass `--source <id>` to choose); use `--yes` for non-interactive runs.
- Some sources are whole-repo / marketplace / CLI installers with no per-skill
  folder — for those, `install` prints the exact command to run (e.g.
  `npx skills add owner/repo`, `/plugin marketplace add owner/repo`).
- Set `GITHUB_TOKEN` to raise the GitHub API rate limit (60/h → 5000/h).

After installing, start a new Claude Code session to load the skill.

## Data

Offline-first. The bundled snapshot is `data.json` (built from the canonical
`docs/data.json`). `update` caches a fresh copy under
`~/.cache/skills-atlas/` (or `$XDG_CACHE_HOME`).

## In Claude Code

See [`plugin/`](./plugin) for a thin Claude Code plugin that exposes
`/skills-atlas:skill-search`, `:skill-info`, and `:skill-install` so Claude can do
all of this in-conversation.
