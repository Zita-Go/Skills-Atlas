**English** · [中文](README.zh-CN.md)

<div align="center">

# 🗺️ Skills Atlas

**A panorama of AI Agent Skills organized by function**
Stop asking "what skills exist" and start asking "which skill should I use to do X".

[![Skills](https://img.shields.io/badge/skills-369-blue)](data/skills.yaml)
[![Repos](https://img.shields.io/badge/repositories-61-green)](data/repositories.yaml)
[![Categories](https://img.shields.io/badge/categories-13_×_74-orange)](data/categories.yaml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

[**🌐 Visit online**](https://zita-go.github.io/Skills-Atlas/?lang=en) · [📦 Data download](data/) · [🤝 Contribute a new skill](CONTRIBUTING.md) · [💬 Discussions](../../discussions)

</div>

---

## Why this project exists

The AI Agent Skills ecosystem exploded in 2025, but it's scattered across ~61 GitHub repositories.
Existing awesome lists only give you names plus a one-line description — they **don't tell you which ones work together**.

**Skills Atlas** reorganizes everything along a "functional dimension":
- Want to do SEO? Jump straight to § 4.1, where 6 SEO skills across repos are presented together
- Want a complete development workflow? See § 1.1, where the ⛓ strong-binding markers tell you which 5 must be chained together
- Looking for document-processing tools? See § 2.1, where the Office 4-piece suite + the heavy-duty PDF API + the multi-format extraction engine are laid out at a glance

## Data scale

| Dimension | Count |
|---|---:|
| Standalone skills | 369 |
| Functional groups | 185 |
| Categories / Subgroups | 13 / 74 |
| Source repositories | 61 |
| ⛓ Strong-binding workflows | 18 |

## How to use

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
│   ├── categories.yaml      # 13 categories / 74 subgroups
│   ├── skills.yaml          # 185 skill groups
│   └── repositories.yaml    # Metadata for 61 source repositories
├── scripts/                 # Data-processing scripts
│   ├── parse_md.py          # md → yaml (for the initial migration)
│   ├── gen_html.py          # yaml → html (regenerate after editing yaml)
│   ├── validate.py          # Validate yaml integrity
│   ├── fetch_metadata.py    # Sync GitHub stars (used by CI)
│   └── templates/
│       └── index.html.tmpl  # HTML template
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

- **Left navigation** 13 categories collapse/expand / jump directly to any of the 74 subgroups
- **Live search** Full-text search over skill name / description / repository / group name
- **3 filters** All / ⛓ Strong-binding / Multi-source / Single skill
- **Dark / light theme** One-click toggle + remembers your preference
- **Responsive design** The sidebar collapses automatically on mobile
- **Lightweight** Only fonts go through the jsdelivr CDN (with a system-font fallback); the data and scripts have zero runtime dependencies

## Contributing

Contributions are welcome — new skills / fixes to source-repo errors / improved descriptions / added translations.

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

[MIT](LICENSE) — code / data / content all use MIT uniformly. You can use it freely, modify it freely, and commercialize it freely, as long as you keep attribution.

> Note: the skill metadata / descriptions collected in this project are curated by us; but the actual SKILL.md content of these skills still lives in their respective original repositories (see `data/repositories.yaml`), each under its own license.

## Maintainers

Maintained collectively by the community. This project grew out of an internal documentation-organization effort; all skill authors are welcome to PR improvements to their own repository's description.
