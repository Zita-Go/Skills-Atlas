**English** · [中文](README.zh-CN.md)

<div align="center">

# 🗺️ Skills Atlas

**A panorama of AI Agent Skills organized by function**
Stop asking "what skills exist" and start asking "which skill should I use to do X".

[![Skills](https://img.shields.io/badge/skills-826-blue)](data/skills.yaml)
[![Repos](https://img.shields.io/badge/repositories-111-green)](data/repositories.yaml)
[![Categories](https://img.shields.io/badge/categories-20_×_115-orange)](data/categories.yaml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[**🌐 Visit online**](https://zita-go.github.io/Skills-Atlas/?lang=en) · [**⌨️ Use it as a tool**](packages/skills-atlas-cli) · [📦 Data download](data/) · [🤝 Contribute a new skill](CONTRIBUTING.md) · [💬 Discussions](../../discussions)

<a href="https://zita-go.github.io/Skills-Atlas/?lang=en"><img src="docs/screenshot-dark.png" alt="Skills Atlas — browse the catalog online" width="760"></a>

</div>

---

## Quick start

A **skill** is a reusable `SKILL.md` instruction pack that teaches Claude Code a
specialized workflow: systematic debugging, pre-mortems, SEO audits, PDF translation,
and hundreds more. **Skills Atlas** is a curated catalog of 800+ of them, with two
ways to get the right one:

1. **🔍 Find and install it.** Browse [online](https://zita-go.github.io/Skills-Atlas/?lang=en) or search from your terminal, then install in seconds.
2. **🤖 Let it find you.** Turn on autopilot and Claude surfaces the fitting skill as you work, no searching.

```bash
npm install -g skills-atlas-cli
skills-atlas search "stress test my launch plan"   # pre-mortem tops the results
skills-atlas use pre-mortem                          # install it, Claude applies it now
skills-atlas hook on                                 # optional: autopilot surfaces skills as you work
```

Full tool docs: [**`skills-atlas-cli`**](packages/skills-atlas-cli).

## Why this project exists

The AI Agent Skills ecosystem exploded in 2025, but it's scattered across ~111 GitHub repositories.
Existing awesome lists only give you names plus a one-line description, and they **don't tell you which ones work together**.

**Skills Atlas** reorganizes everything along a "functional dimension":
- Want to do SEO? Jump straight to § 4.1, where 6 SEO skills across repos are presented together
- Want a complete development workflow? See § 1.1, where the ⛓ strong-binding markers tell you which 5 must be chained together
- Looking for document-processing tools? See § 2.1, where the Office 4-piece suite + the heavy-duty PDF API + the multi-format extraction engine are laid out at a glance

And it's not just a catalog to read: a [terminal CLI + Claude Code plugin](packages/skills-atlas-cli)
lets you **search, install, and use** any of these skills, with an opt-in autopilot that
surfaces the right one as you work.

## Data scale

| Dimension | Count |
|---|---:|
| Standalone skills | 826 |
| Functional groups | 249 |
| Categories / Subgroups | 20 / 115 |
| Source repositories | 111 |
| ⛓ Strong-binding workflows | 18 |

Coverage spans **20 functional categories**, from software engineering, PM, marketing and design to the professional verticals **legal, healthcare, finance, DevOps/SRE, security, education and Web3**.

## How to use

### Find and install from the terminal (CLI + plugin)

**The fastest way to actually use a skill.** The [`skills-atlas-cli`](packages/skills-atlas-cli)
package turns the catalog into a real tool: search, **install**, and use skills straight from
your shell:

<a href="packages/skills-atlas-cli"><img src="docs/cli-demo.png" alt="skills-atlas: search → info → install a skill" width="760"></a>

```bash
npx skills-atlas-cli search seo
npx skills-atlas-cli info brainstorming
npx skills-atlas-cli install brainstorming --global   # → ~/.claude/skills/brainstorming/
```

`install` downloads **only that skill's folder** (not the whole repo) into
`.claude/skills/`. The CLI has grown into a full toolkit:

- **Package manager.** `use` (install + activate now), `installed`, `outdated`, `upgrade`, `remove`, `doctor`.
- **Project kits.** `kit` detects your project (frontend / backend / data / infra) and installs a tailored set; `sync` reproduces it from a committable `skills-atlas.kit.json`.
- **Private sources.** `registry add <your data.json>` merges your org's internal skills into search / install (private wins a name clash).
- **In Claude Code.** A bundled [plugin](packages/skills-atlas-cli/plugin) (`/skills-atlas:skill-search` / `:skill-install`).
- **Any MCP client.** `skills-atlas mcp` runs a zero-dep MCP server (search / info / install / categories) for Claude Desktop and other agents.

→ [full CLI docs](packages/skills-atlas-cli)

### 🤖 Autopilot: let the right skill find you

You shouldn't have to know a skill exists to use it. Turn autopilot on, and whenever
your task matches one, Claude surfaces it, explained, with one command to apply:

```bash
skills-atlas hook on
```

> 🗣️ *"run a pre-mortem before we launch"*
>
> 🤖 *"That's exactly what the **pre-mortem** skill does: it stress-tests your plan before launch. **Use it now**, see details, or skip?"*

Off by default, the per-prompt match runs locally, never auto-installs. Configure the
reply language (`hook lang en|zh`) and more. [How it works →](packages/skills-atlas-cli)

**🔭 Capability gaps & 🧹 cleanup.** `skills-atlas gaps` reads your *recent activity*
(from Claude Code's local transcripts) and a **background sub-agent** — a small model
of your choice (`hook model`, default Haiku), reusing your Claude Code login — spots
the recurring work no installed skill covers and recommends one. `skills-atlas prune`
does the reverse: flags installed skills you no longer use. [Details →](packages/skills-atlas-cli)

### Visit online
👉 [Open the website](https://zita-go.github.io/Skills-Atlas/?lang=en)

## Contributing

New skills, fixes, better descriptions, translations — all welcome. See **[CONTRIBUTING.md](CONTRIBUTING.md)**.

## Related projects / inspiration

This project's skill data is sourced from the excellent repositories below (only the top contributors are listed here; see `data/repositories.yaml` for the full list):

- [obra/superpowers](https://github.com/obra/superpowers) - Claude Code software-development methodology
- [phuryn/pm-skills](https://github.com/phuryn/pm-skills) - 65 PM skills
- [openai/skills](https://github.com/openai/skills) - OpenAI Codex 41 skills
- [anthropics/skills](https://github.com/anthropics/skills) - Anthropic 17 skills
- [coreyhaines31/marketingskills](https://github.com/coreyhaines31/marketingskills) - 41 marketing skills
- [deanpeters/Product-Manager-Skills](https://github.com/deanpeters/Product-Manager-Skills) - 47 PM skills
- [muratcankoylan/Agent-Skills-for-Context-Engineering](https://github.com/muratcankoylan/Agent-Skills-for-Context-Engineering) - 15 Context Engineering skills

## License

[MIT](LICENSE). Code / data / content all use MIT uniformly. You can use it freely, modify it freely, and commercialize it freely, as long as you keep attribution.

> Note: the skill metadata / descriptions collected in this project are curated by us; but the actual SKILL.md content of these skills still lives in their respective original repositories (see `data/repositories.yaml`), each under its own license.

## Maintainers

Maintained collectively by the community. This project grew out of an internal documentation-organization effort; all skill authors are welcome to PR improvements to their own repository's description.
