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

# 🤖 Autopilot, gaps & cleanup   (opt-in)
skills-atlas hook on                           # Claude proactively offers a fitting skill as you work
skills-atlas hook lang en|zh                   # language the autopilot replies in (default English)
skills-atlas hook model                        # pick the model for background gap analysis (default Haiku)
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

Registers a Claude Code `UserPromptSubmit` hook. When what you ask lines up with the
territory of a catalog skill you don't have, the hook hands Claude a short shortlist
and **Claude decides** whether any genuinely fits — if so it explains **what it does
and why it fits your task** and offers a choice: use it now, see what it covers first
(`skills-atlas info`), or skip. The split is deliberate: the hook does **recall** (a
distinctive-word match against skill names *and* their curated function text, English
or Chinese), Claude does **precision** (it stays silent unless one truly fits). It's:

- **Off by default.** Turn it on explicitly; `hook off` removes it cleanly.
- **Quiet.** Fires only on a distinctive match — greetings and generic actions
  ("implement the function", "fix the typo") stay silent — never for an installed
  skill, never the same one twice, with a cooldown. Claude is the final filter.
- **Local for the per-prompt match.** Your prompt is matched against the on-machine
  catalog; the per-prompt suggestion sends nothing anywhere.
- **Safe.** Never auto-installs, and fails open (a hook error never blocks your prompt).

**🔭 Capability gaps & 🧹 cleanup.** Two slower, proactive layers read your *recent
activity* (from Claude Code's own local transcripts) and let a model judge:

- `skills-atlas gaps` — spots recurring kinds of work no installed skill covers yet
  and recommends one. To keep this off the main agent's back, a **background
  sub-agent** does the judging: a small model (default `claude-haiku-4-5`) gets your
  recent prompts plus a candidate shortlist and returns a one-line suggestion that the
  hook surfaces next turn. The model call uses `claude -p`, which **reuses your Claude
  Code login** (no API key) — so your recent prompts go to that model (the same
  provider Claude Code already uses); if `claude` isn't available it falls back to a
  fully-local digest. Pick the model with `skills-atlas hook model`.
- `skills-atlas prune` — flags installed skills that no longer fit your recent work and
  offers to remove them (never auto-removes; skills installed in the last 2 weeks are
  left alone).

Each layer is an independent toggle, and you can set the reply language:

```bash
skills-atlas hook suggest on|off    # per-prompt suggestions
skills-atlas hook gaps on|off       # gap recommendations          (on by default)
skills-atlas hook prune on|off      # removal suggestions          (off by default)
skills-atlas hook model [name]      # model for the background gap/prune analysis (default Haiku)
skills-atlas hook lang en|zh        # language the autopilot replies in           (default English)
```

The catalog also auto-refreshes in the background (~daily) so new skills appear on
their own; set `SKILLS_ATLAS_NO_REFRESH=1` to keep it fully offline.

## License

MIT. Each installed skill keeps its own source repository's license.
