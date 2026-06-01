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
skills-atlas install brainstorming --chain     # install the whole ⛓ workflow it belongs to
skills-atlas use brainstorming                 # install AND activate now — prints SKILL.md, no restart
skills-atlas install brainstorming --dry-run   # preview the files, write nothing

# 🗂️ Manage what you've installed   (like a package manager)
skills-atlas installed                         # list installed (global + project)
skills-atlas outdated                          # which have a newer upstream version
skills-atlas upgrade brainstorming             # re-fetch to latest (--all; won't clobber local edits)
skills-atlas remove brainstorming              # delete it
skills-atlas doctor                            # health check: orphans, drift, license/script risks

# 🌐 Catalog
skills-atlas categories                        # the 20 top-level categories
skills-atlas list marketing                    # skill groups within a category
skills-atlas update                            # pull the latest catalog
```

**⛓ Workflows, not just skills.** Many skills belong to a curated chain (e.g.
`brainstorming → writing-plans → executing-plans → …`). `install <skill> --chain`
installs the whole pipeline in one archive download, ready to run in order.

Output is English by default; add `--zh` for Chinese, or `--json` to any command for machine-readable output.
After installing a skill, start a new Claude Code session to load it.

## How install works

The real value is the **catalog**: `search` / `info` / `categories` work fully
offline and map *which* skill fits — function-organized, bilingual, tagged with
use-case / when-to-use / personas / ⛓ chains. That's what `npx skills add` and
GitHub search don't give you.

On top of that, `install` can place a skill straight into `.claude/skills/`:

- For a repo that exposes a **per-skill folder**, it downloads only that folder
  (via the repo archive — **no GitHub API rate limit**) into
  `<target>/.claude/skills/<skill>/`, not the whole repo.
- Several sources? The best installable one is auto-picked — `--source <id>` to
  choose, `--yes` for non-interactive runs.
- Other sources (whole-repo / marketplace) print their official command instead
  (e.g. `npx skills add owner/repo`).
- `GITHUB_TOKEN` is only needed if you fall back to the API and hit its 60/h limit.

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

## Autopilot (opt-in) — the right skill finds you

```bash
skills-atlas hook on      # enable    (skills-atlas hook off / status)
```

Registers a Claude Code `UserPromptSubmit` hook. When what you ask matches the
territory of a catalog skill you don't have, the hook hands Claude a short
shortlist of candidates and **Claude decides** whether any genuinely fits — and
if so, explains **what it does and why it fits your task**, then offers a choice:
use it now, see what it covers first (`skills-atlas info`), or skip. You don't
have to know the skill exists. The split is deliberate: the hook does **recall**
(a distinctive-word match against the catalog, so the right skill is on the
table), Claude does **precision** (it understands your intent and stays silent
unless one truly fits, or searches further itself). It's:

- **off by default** — you turn it on explicitly; `hook off` removes it cleanly.
- **quiet** — only fires on a distinctive match (greetings and generic actions
  like "fix the typo" stay silent), never for an already-installed skill, never
  the same skill twice, with a cooldown between suggestions — and Claude is the
  final filter on relevance.
- **local & private** — your prompt is matched against the bundled catalog
  on your machine; nothing is sent anywhere.
- **safe** — never auto-installs (always your call), and fails open (a hook
  error never blocks your prompt).

## License

MIT. Each installed skill keeps its own source repository's license.
