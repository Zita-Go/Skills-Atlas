# skills-atlas-cli

[![npm](https://img.shields.io/npm/v/skills-atlas-cli)](https://www.npmjs.com/package/skills-atlas-cli)
[![license](https://img.shields.io/npm/l/skills-atlas-cli)](https://github.com/Zita-Go/Skills-Atlas/blob/main/LICENSE)

**Find, install, and use the right AI agent skill for any task, right inside Claude
Code.** Stop guessing which skill fits or copy-pasting from random repos. Search a
curated catalog of **800+ skills** and drop the right one into `.claude/skills/` in seconds.

> 🧩 **Using Claude Code? The easiest way is the [Skills Atlas plugin](./plugin).** It runs
> on this CLI and brings everything into the conversation — an **autopilot that's on by
> default** (the right skill finds you as you work) plus slash commands. Install this CLI as
> the engine, then add the plugin (two lines). → [**plugin docs**](./plugin)

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

# 🤖 Autopilot, gaps & cleanup   (opt-in)
skills-atlas hook on                           # Claude proactively offers a fitting skill as you work
skills-atlas hook lang en|zh                   # language the autopilot replies in (default English)
skills-atlas hook model                        # which model powers gaps/cleanup (default Haiku)
skills-atlas gaps                              # Claude spots kinds of work you keep doing without a skill
skills-atlas prune                             # Claude flags installed skills you no longer use

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
installs the whole pipeline in one step, ready to run in order.

**📦 Project kits.** `skills-atlas kit` detects what this project is (frontend / backend /
data / infra) and installs a tailored set (a universal dev workflow plus archetype
add-ons) into `./.claude/skills/`, then writes a committable `skills-atlas.kit.json`.
A teammate runs `skills-atlas sync` to reproduce it exactly.

**Where skills land.** Running `install` / `use` yourself installs **globally**
(`~/.claude/skills/`, every project) — for general workflows you want everywhere. Skills
suggested by autopilot, installed via the Claude Code plugin, or set up by `kit` go into
**this project** (`./.claude/skills/`, committable for teammates). Override either way
with `--global` / `--project`.

Output is English by default; add `--zh` for Chinese.
After installing a skill, start a new Claude Code session to load it.

## Why a catalog

`search` / `info` / `categories` work fully offline and tell you *which* skill fits —
organized by function, bilingual, tagged with use-case, when-to-use, personas and ⛓
chains. `install` then drops just that skill's folder into `.claude/skills/` (not the
whole repo); when several repos offer the same skill, the best one is picked for you.

The catalog ships with the tool and works offline, and refreshes itself in the
background so new skills show up on their own. Run `skills-atlas update` to pull the
latest on demand.

## Your org's private skills

Point the CLI at your organization's own catalog so internal skills show up in
`search` / `info` / `install` / `kit` alongside the public Atlas:

```bash
skills-atlas registry add https://skills.acme.internal/data.json   # or a local path
skills-atlas registry list
skills-atlas registry remove https://skills.acme.internal/data.json
```

Private skills merge with the public catalog (your own wins a name clash) and are cached locally.

## In Claude Code — the plugin (recommended)

The **[Skills Atlas plugin](./plugin)** wraps this CLI so Claude does it all
in-conversation: an **autopilot on by default** that surfaces the fitting skill as you
work, plus slash commands (`/skills-atlas:skill-search`, `:skill-install`, `:skill-kit`,
`:skill-craft`, …). Install this CLI first (the engine), then add the plugin:

```text
npm i -g skills-atlas-cli                      # the engine (Node 18+)
/plugin marketplace add Zita-Go/Skills-Atlas   # then, inside Claude Code:
/plugin install skills-atlas@skills-atlas
```

Restart Claude Code, run `/skills-atlas:setup`, and you're set. → [**plugin docs**](./plugin)

<img src="https://raw.githubusercontent.com/Zita-Go/Skills-Atlas/main/docs/plugin-demo.png" alt="Skills Atlas plugin — the autopilot surfaces a fitting skill in-conversation" width="820">


## In any MCP client

`skills-atlas mcp` runs an [MCP](https://modelcontextprotocol.io) server so any
MCP-capable client (Claude Desktop, other agents) can use the catalog. Add it to your
client's config:

```json
{ "mcpServers": { "skills-atlas": { "command": "npx", "args": ["-y", "skills-atlas-cli", "mcp"] } } }
```

It exposes four tools: **search_skills**, **skill_info**, **install_skill**, and
**list_categories**. Discover, inspect, install, and browse the catalog from
anywhere.

## Autopilot (opt-in): the right skill finds you

```bash
skills-atlas hook on      # turn it on   (hook off / hook status)
```

With autopilot on, whenever what you're doing lines up with a catalog skill you don't
have, Claude offers it — explained, with one tap to use it now, see what it covers, or
skip. You don't have to know the skill exists. It's **off by default**, **quiet** (stays
silent on greetings and generic asks, never repeats itself, never suggests a skill you
already have), and **safe** (never auto-installs; a hiccup never blocks your prompt).

Two more proactive helpers:

- **🔭 Capability gaps** — `skills-atlas gaps` notices the recurring kinds of work you
  keep doing without a skill, and recommends one.
- **🧹 Cleanup** — `skills-atlas prune` flags installed skills you no longer use and
  offers to remove them (never on its own; recent installs are left alone).

Tune it to taste:

```bash
skills-atlas hook suggest on|off    # the per-prompt suggestions
skills-atlas hook gaps on|off       # gap recommendations            (on by default)
skills-atlas hook prune on|off      # cleanup suggestions            (off by default)
skills-atlas hook model [name]      # which model powers gaps/cleanup   (default Haiku)
skills-atlas hook lang en|zh        # the language it replies in        (default English)
```

The per-prompt suggestions are matched on your own machine and sent nowhere. The gaps
and cleanup helpers hand your recent activity to the model you picked (the same provider
Claude Code already uses) to judge it.

## License

MIT. Each installed skill keeps its own source repository's license.
