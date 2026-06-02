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

### Offline (single-file HTML)
```bash
git clone https://github.com/Zita-Go/Skills-Atlas.git
cd skills-atlas/docs
python3 -m http.server 8000
# Visit http://localhost:8000
```

Or just double-click `docs/index.html` to open it in a browser.

### Use it as a data source
```python
import yaml
skills = yaml.safe_load(open('data/skills.yaml'))
repos = yaml.safe_load(open('data/repositories.yaml'))

# Find all strong-binding ⛓ workflows
chains = [s for s in skills if s['chain']]
print(f'{len(chains)} chain workflows')
```

A JSON version lives at `docs/data.json`, for consumption by frontends / MCP servers / APIs.
## Project structure

```
skills-atlas/
├── docs/                    # GitHub Pages deployment directory
│   ├── index.html           # 🌟 Single-file website
│   └── data.json            # Structured data for frontends to fetch
├── data/                    # Source data (contributors mainly edit here)
│   ├── categories.yaml      # 20 categories / 115 subgroups
│   ├── skills.yaml          # 249 skill groups
│   └── repositories.yaml    # Metadata for 111 source repositories
├── scripts/                 # Data-processing scripts
│   ├── parse_md.py          # md → yaml (for the initial migration)
│   ├── gen_html.py          # yaml → html (regenerate after editing yaml)
│   ├── validate.py          # Validate yaml integrity
│   ├── fetch_metadata.py    # Sync GitHub stars (used by CI)
│   └── templates/
│       └── index.html.tmpl  # HTML template
├── packages/
│   ├── skills-atlas-data/   # npm data package (canonical data.json + types)
│   └── skills-atlas-cli/    # 🌟 terminal CLI: search / install / guidance + Claude Code plugin
├── docs-md/                 # Original md docs (archive)
└── .github/                 # CI / Issue / PR templates
```

## Auto-discovery pipeline

Every day it scans GitHub Search, queues newly appearing skill repositories onto a candidate list, and lets maintainers manually review and admit them.

```
.github/workflows/daily-discover.yml   # Runs daily at 02:00 UTC
  └─ scripts/discover_candidates.py    # GitHub Search × N queries → diff against the main repo
       ↓
     data/_inbox/raw/YYYY-MM-DD.json   # That day's candidates (automatic PR)
       ↓
     scripts/render_candidate_issue.py # Render into an Issue body
       ↓
     gh issue create --label discover-bot   # Human-review entry point
```

Human review decides which ones go into `data/repositories.yaml` + `data/skills.yaml`. **The LLM never writes to the main data automatically**.

| Stage | Status | Content |
|---|---|---|
| **PR-1** | ✅ Delivered | Pure discovery + Issue output (no LLM) |
| **PR-2** | Planned | Cheap OpenRouter model to do is-skill-repo filtering |
| **PR-3** | Planned | GPT-5.5 drafts type / category / Chinese description for candidates |

Repositories rejected by PR-1 can be appended to `data/_inbox/blocklist.yaml`, and the next discovery run skips them automatically.

Manual trigger:
```bash
GITHUB_TOKEN=ghp_xxx python3 scripts/discover_candidates.py
python3 scripts/render_candidate_issue.py --out /tmp/issue.md
```

## Main features

- **Left navigation** 20 categories collapse/expand / jump directly to any of the 115 subgroups
- **Live search** Full-text search over skill name / description / repository / group name
- **3 filters** All / ⛓ Strong-binding / Multi-source / Single skill
- **Dark / light theme** One-click toggle + remembers your preference
- **Responsive design** The sidebar collapses automatically on mobile
- **Lightweight** Only fonts go through the jsdelivr CDN (with a system-font fallback); the data and scripts have zero runtime dependencies

## Contributing

Contributions are welcome: new skills / fixes to source-repo errors / improved descriptions / added translations.

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

### Adding a new skill in four steps

1. Edit `data/skills.yaml` and add an entry
2. Run `python3 scripts/validate.py` to validate
3. Run `python3 scripts/gen_html.py` to regenerate the website
4. Open a PR

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
