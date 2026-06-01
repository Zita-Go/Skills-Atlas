# skills-atlas-cli

[![npm](https://img.shields.io/npm/v/skills-atlas-cli)](https://www.npmjs.com/package/skills-atlas-cli)
[![license](https://img.shields.io/npm/l/skills-atlas-cli)](https://github.com/Zita-Go/Skills-Atlas/blob/main/LICENSE)

**Find, install, and use the right AI agent skill for any task, right inside Claude
Code.** Stop guessing which skill fits or copy-pasting from random repos. Search a
curated catalog of **800+ skills** and drop the right one into `.claude/skills/` in seconds.

> **New to "skills"?** A skill is a reusable `SKILL.md` instruction pack that teaches
> Claude Code a specialized workflow: systematic debugging, pre-mortems, SEO audits,
> PDF translation, and hundreds more. This tool finds and installs them for you.

### Two ways to get the right skill

1. **🔍 Find and install it.** Search the catalog, then `use` it. It's live in Claude Code in seconds.
2. **🤖 Let it find you.** Turn on autopilot and Claude offers the fitting skill as you work, no searching.

<img src="https://raw.githubusercontent.com/Zita-Go/Skills-Atlas/main/docs/cli-demo.png" alt="skills-atlas: search then install a skill" width="760">

## Quickstart

```bash
npm install -g skills-atlas-cli      # adds the `skills-atlas` command (alias sa). Or run any command with `npx`.

skills-atlas search "stress test my launch plan"   # pre-mortem tops the results
skills-atlas use pre-mortem                          # installs it, prints its SKILL.md so Claude applies it now
skills-atlas hook on                                 # optional: turn on autopilot, skip the search next time
```

Now `pre-mortem` lives in `~/.claude/skills/` and auto-loads in new Claude Code sessions.

## 🌐 Browse the catalog online

<table>
<tr>
<td><a href="https://zita-go.github.io/Skills-Atlas/"><img src="https://raw.githubusercontent.com/Zita-Go/Skills-Atlas/main/docs/screenshot-light.png" alt="Skills Atlas — light theme" width="400"></a></td>
<td><a href="https://zita-go.github.io/Skills-Atlas/"><img src="https://raw.githubusercontent.com/Zita-Go/Skills-Atlas/main/docs/screenshot-dark.png" alt="Skills Atlas — dark theme" width="400"></a></td>
</tr>
</table>

Explore the catalog visually at **[zita-go.github.io/Skills-Atlas](https://zita-go.github.io/Skills-Atlas/)**, then install what you find with the CLI.

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
skills-atlas use brainstorming                 # install + activate now (prints SKILL.md, no restart)
skills-atlas install brainstorming --dry-run   # preview the files, write nothing

# 🗂️ Manage what you've installed   (like a package manager)
skills-atlas installed                         # list installed (global + project)
skills-atlas outdated                          # which have a newer upstream version
skills-atlas upgrade brainstorming             # re-fetch to latest (--all; won't clobber local edits)
skills-atlas remove brainstorming              # delete it
skills-atlas doctor                            # health check: orphans, drift, license/script risks

# 📦 Set up a whole project at once
skills-atlas kit                               # detect this project & install the right skills for it
skills-atlas sync                              # reproduce a project's kit (skills-atlas.kit.json)

# 🤖 Autopilot & capability gaps   (opt-in)
skills-atlas hook on                           # Claude proactively offers a fitting skill as you work
skills-atlas gaps                              # Claude spots kinds of work you keep doing without a skill

# 🌐 Catalog & sources
skills-atlas categories                        # the 20 top-level categories
skills-atlas list marketing                    # skill groups within a category
skills-atlas registry add <url|path>           # add a private org catalog source (merges into search/install)
skills-atlas update                            # pull the latest catalog

# 🔌 Integrations
skills-atlas mcp                               # run as an MCP server (any MCP client: Claude Desktop, …)
```

**⛓ Workflows, not just skills.** Many skills belong to a curated chain (e.g.
`brainstorming → writing-plans → executing-plans → …`). `install <skill> --chain`
installs the whole pipeline in one archive download, ready to run in order.

**📦 Project kits.** `skills-atlas kit` detects what this project is (frontend / backend /
data / infra) and installs a tailored set (a universal dev workflow plus archetype
add-ons) into `./.claude/skills/`, then writes a committable `skills-atlas.kit.json`.
A teammate runs `skills-atlas sync` to reproduce it exactly.

Output is English by default; add `--zh` for Chinese, or `--json` to any command for machine-readable output.
After installing a skill, start a new Claude Code session to load it.

## How install works

The real value is the **catalog**: `search` / `info` / `categories` work fully
offline and map *which* skill fits. It's function-organized, bilingual, tagged with
use-case / when-to-use / personas / ⛓ chains. That's what `npx skills add` and
GitHub search don't give you.

On top of that, `install` can place a skill straight into `.claude/skills/`:

- For a repo that exposes a **per-skill folder**, it downloads only that folder
  (via the repo archive, with **no GitHub API rate limit**) into
  `<target>/.claude/skills/<skill>/`, not the whole repo.
- Several sources? The best installable one is auto-picked. Pass `--source <id>` to
  choose, `--yes` for non-interactive runs.
- Other sources (whole-repo / marketplace) print their official command instead
  (e.g. `npx skills add owner/repo`).
- `GITHUB_TOKEN` is only needed if you fall back to the API and hit its 60/h limit.

## Keeping the catalog fresh

The catalog ships inside the package and works offline. `skills-atlas update` pulls
the latest from the public feed (cached under `~/.cache/skills-atlas/`).

## Private / org catalog sources

Point the CLI at your organization's own catalog (a `data.json` in the same
schema) so internal skills show up in `search` / `info` / `install` / `kit`
alongside the public Atlas:

```bash
skills-atlas registry add https://skills.acme.internal/data.json   # or a local path
skills-atlas registry list
skills-atlas registry remove https://skills.acme.internal/data.json
```

Private skills **merge** with the public catalog (a private source wins a same-name
clash). Sources are cached locally and merged offline. For a private URL behind
auth, set `SKILLS_ATLAS_TOKEN` (sent as a Bearer header); in CI,
`SKILLS_ATLAS_SOURCES=url1,url2` adds sources without touching config.

## In Claude Code

A thin [Claude Code plugin](./plugin) lets Claude do all of this in-conversation.
Just describe what you need, or use `/skills-atlas:skill-search`, `:skill-info`,
`:skill-install`:

```text
/plugin marketplace add Zita-Go/Skills-Atlas
/plugin install skills-atlas@skills-atlas
```

## In any MCP client

`skills-atlas mcp` runs a zero-dependency [MCP](https://modelcontextprotocol.io)
server over stdio, so any MCP-capable client (Claude Desktop, other agents) can use
the catalog. Add it to your client's config:

```json
{ "mcpServers": { "skills-atlas": { "command": "npx", "args": ["-y", "skills-atlas-cli", "mcp"] } } }
```

It exposes four tools: **search_skills**, **skill_info**, **install_skill**, and
**list_categories**. Discover, inspect, install, and browse the catalog from
anywhere.

## Autopilot (opt-in): the right skill finds you

```bash
skills-atlas hook on      # enable    (skills-atlas hook off / status)
```

Registers a Claude Code `UserPromptSubmit` hook. When what you ask matches the
territory of a catalog skill you don't have, the hook hands Claude a short
shortlist of candidates and **Claude decides** whether any genuinely fits. If it
does, Claude explains **what it does and why it fits your task**, then offers a choice:
use it now, see what it covers first (`skills-atlas info`), or skip. You don't
have to know the skill exists. The split is deliberate: the hook does **recall**
(a distinctive-word match against the catalog, so the right skill is on the
table), Claude does **precision** (it understands your intent and stays silent
unless one truly fits, or searches further itself). It's:

- **Off by default.** You turn it on explicitly; `hook off` removes it cleanly.
- **Quiet.** Only fires on a distinctive match (greetings and generic actions
  like "fix the typo" stay silent), never for an already-installed skill, never
  the same skill twice, with a cooldown between suggestions. Claude is the
  final filter on relevance.
- **Local and private.** Your prompt is matched against the bundled catalog
  on your machine; nothing is sent anywhere.
- **Safe.** Never auto-installs (always your call), and fails open (a hook
  error never blocks your prompt).

**🔭 Capability gaps.** `skills-atlas gaps` shows Claude your *recent activity* and
lets **Claude** spot the recurring kinds of work you keep doing that no installed
skill covers yet, then recommend one with the pattern as evidence. We don't guess
with heuristics; we just give Claude the memory it lacks (your recent prompts, read
from Claude Code's own local transcripts; **nothing is stored or sent**) plus the
catalog. With the hook on, it also nudges in-conversation now and then. The two
layers are independent: `skills-atlas hook suggest on|off` (per-prompt) and
`skills-atlas hook gaps on|off` (the proactive nudge).

## License

MIT. Each installed skill keeps its own source repository's license.
