# skills-atlas-cli

Search, install and learn AI agent skills from the terminal — powered by the
[Skills Atlas](https://zita-go.github.io/Skills-Atlas/) catalog (hundreds of
Claude Code / Codex skills across 100+ source repos).

## Install

```bash
npm install -g skills-atlas-cli      # adds the `skills-atlas` command (alias: `sa`)
```

Or run it without installing:

```bash
npx skills-atlas-cli search seo
```

## Quick start

```bash
skills-atlas search seo                        # find skills
skills-atlas info brainstorming                # what it does + when/how to use it
skills-atlas install brainstorming             # → ~/.claude/skills/   (default)
skills-atlas install translate-book --project  # → ./.claude/skills/   (this project)
```

Zero dependencies, works offline. After installing a skill, start a new Claude
Code session to load it, then invoke it by name.

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

## Search by words, not exact string

Search matches on words, so multiple keywords and loose phrases both work:

```bash
skills-atlas search pdf 翻译
skills-atlas search "translate a whole pdf"
skills-atlas search seo -c marketing --chain
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

## Keeping the catalog fresh

The catalog ships inside the package and works offline. To pull the latest skills
without upgrading:

```bash
skills-atlas update
```

(cached under `~/.cache/skills-atlas/`, or `$XDG_CACHE_HOME`).

## In Claude Code

A thin [Claude Code plugin](./plugin) lets Claude do all of this in-conversation —
just describe what you need, or use `/skills-atlas:skill-search`, `:skill-info`,
`:skill-install`:

```text
/plugin marketplace add Zita-Go/Skills-Atlas
/plugin install skills-atlas@skills-atlas
```

## License

MIT. Each installed skill keeps its own source repository's license.
