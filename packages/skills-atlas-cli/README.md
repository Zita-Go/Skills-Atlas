# skills-atlas-cli

[![npm](https://img.shields.io/npm/v/skills-atlas-cli)](https://www.npmjs.com/package/skills-atlas-cli)
[![license](https://img.shields.io/npm/l/skills-atlas-cli)](https://github.com/Zita-Go/Skills-Atlas/blob/main/LICENSE)

**Stop guessing which agent skill to use.** Find, install, and learn the right
specialized skill for the task — in seconds, straight into Claude Code.

Powered by the [**Skills Atlas**](https://zita-go.github.io/Skills-Atlas/) catalog:
hundreds of Claude Code / Codex skills across 100+ source repos, organized by what
they actually do.

<img src="https://raw.githubusercontent.com/Zita-Go/Skills-Atlas/main/docs/cli-demo.png" alt="skills-atlas: search then install a skill" width="760">

## 🌐 Browse the whole catalog online

<table>
<tr>
<td><a href="https://zita-go.github.io/Skills-Atlas/"><img src="https://raw.githubusercontent.com/Zita-Go/Skills-Atlas/main/docs/screenshot-light.png" alt="Skills Atlas — light theme" width="400"></a></td>
<td><a href="https://zita-go.github.io/Skills-Atlas/"><img src="https://raw.githubusercontent.com/Zita-Go/Skills-Atlas/main/docs/screenshot-dark.png" alt="Skills Atlas — dark theme" width="400"></a></td>
</tr>
</table>

**[→ zita-go.github.io/Skills-Atlas](https://zita-go.github.io/Skills-Atlas/)** —
explore by category, then install what you find with the CLI.

## Install

```bash
npm install -g skills-atlas-cli      # adds the `skills-atlas` command (alias: `sa`)
```

Or run it without installing: `npx skills-atlas-cli search seo`

## Usage

```bash
# 🔍 Find a skill
skills-atlas search seo                        # keyword, ranked by relevance + stars
skills-atlas search "pdf 翻译"                  # multiple words & loose phrases work
skills-atlas search test --chain -c marketing  # filters: --chain, -c/-p/-t

# 📖 Learn what it does + when to use it
skills-atlas info brainstorming

# 📥 Install it (into .claude/skills/)
skills-atlas install brainstorming             # → ~/.claude/skills/   (default, all projects)
skills-atlas install brainstorming --project   # → ./.claude/skills/   (this project only)
skills-atlas install brainstorming --dry-run   # preview the files, write nothing

# 🗂️ Browse & refresh
skills-atlas categories                        # the 20 top-level categories
skills-atlas list marketing                    # skill groups within a category
skills-atlas update                            # pull the latest catalog
```

Output is English by default; add `--zh` for Chinese, or `--json` to any command for machine-readable output.
After installing a skill, start a new Claude Code session to load it.

## How install works

Every skill records the **exact in-repo path** of its `SKILL.md`. `install` reads
that, lists the skill's folder via one GitHub API call, then downloads each file
(preserving subfolders) into `<target>/.claude/skills/<skill>/`.

- Unlike `git clone`, it fetches **only that skill's folder**, not the whole repo.
- Several sources? The best installable one is auto-picked — `--source <id>` to
  choose, `--yes` for non-interactive runs.
- Whole-repo / marketplace sources (no per-skill folder) → `install` prints the
  exact command to run instead (e.g. `npx skills add owner/repo`).
- Set `GITHUB_TOKEN` to raise the GitHub API rate limit (60/h → 5000/h).

## Keeping the catalog fresh

The catalog ships inside the package and works offline. `skills-atlas update` pulls
the latest from the public feed (cached under `~/.cache/skills-atlas/`).

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
