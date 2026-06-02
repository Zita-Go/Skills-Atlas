**English** · [中文](CONTRIBUTING.zh-CN.md)

# Contributing Guide

Thanks for wanting to contribute to Skills Atlas! Here are the most common ways to contribute.

## TL;DR

1. **Add a new skill / edit a description** → Edit `data/skills.yaml`, run `python3 scripts/validate.py`, open a PR
2. **Add a new source repository** → Also edit `data/repositories.yaml`
3. **Report a broken link / wrong categorization** → Open an issue using the corresponding template

## Adding a new skill

### Step 1: Find the correct category and subcategory

Open `data/categories.yaml` to view the 20 categories / 115 subcategories, and find the closest fit.

If you feel there's no suitable subcategory, **prefer** adding a new subcategory under an existing category first, and avoid adding new top-level categories.

### Step 2: Add an entry in `data/skills.yaml`

```yaml
- id: <category>--<subcategory>--<3-digit-counter>
  skills:
    - <skill-name>          # multiple entries with + mean this group is used together
  group: The Chinese name of this group
  category: <category-id>
  subcategory: <subcategory-id>
  chain: false              # true means this group must be chained together
  description: One-sentence functional description. May mix Chinese and English.
  sources:
    - <vendor-id>           # must be defined in repositories.yaml
```

When you regenerate the md via `python3 scripts/parse_md.py`, the `id` is automatically numbered in order;
but when you edit the yaml directly, you can also use any meaningful string (as long as it's globally unique).

### Step 3: If the source is a new repository, add it to `data/repositories.yaml`

```yaml
- id: <vendor-id>           # this is the id used in the sources of skills.yaml
  author: github-owner
  repo: github-repo-name
  url: https://github.com/owner/repo
  type: skill               # see the type list below
  skill_group_count: 1      # number of groups this repo contributes (does not affect validation)
```

Allowed `type` values:

| type | Description |
|---|---|
| `skill` | Single-skill repository (one SKILL.md) |
| `skill-pack` | Multi-skill repository (multiple SKILL.md) |
| `plugin` | Claude Code plugin (not a skill, e.g. one with hooks) |
| `cli` | CLI tool, possibly with a skill entry point |
| `cli-framework` | Workflow framework (e.g. OpenSpec) |
| `cli-mcp` | CLI + MCP server hybrid (e.g. claude-mem) |
| `python-library` | Python library (e.g. notebooklm-py) |
| `desktop-app` | Desktop application (e.g. Dorothy) |
| `multi-skill-suite` | Multi-skill suite (with runtime) |
| `marketplace` | Plugin marketplace |
| `claude-md-template` | Just a CLAUDE.md template, not a real skill |
| `extraction-engine` | Core tooling (e.g. kreuzberg) |
| `video-engine` | Video engine (e.g. OpenMontage) |
| `sdd-framework` | Spec-Driven Development framework |

### Step 4: Validate + regenerate HTML

```bash
python3 scripts/validate.py     # must show "All checks passed"
python3 scripts/gen_html.py     # regenerate docs/index.html + docs/data.json
```

### Step 5: Open a PR

PR title format: `feat: add <skill-name> from <vendor>`
In the PR description, briefly note the source + why it belongs in this category.

## Adding a ⛓ strongly-bound workflow

If you find a group of skills that **must be used together** to be effective (e.g. the Figma 8-piece set, the copywriting trio), merge this combination into a single group:

```yaml
- skills:
    - figma
    - figma-use
    - figma-create-new-file
    - figma-generate-design
    # ...
  chain: true              # key: mark as strongly bound
  group: Figma 8-piece set
  description: The 8 figma skills must be chained into a complete ecosystem: figma is the main entry point...
```

## Changing the 20 categories / 115 subcategories structure

Be careful, because this affects the category / subcategory fields of all skills.

If you think the existing categorization is unreasonable, open an issue to discuss first, then make the larger changes.

## Translation

Currently the website / yaml is mainly in Chinese. If you want to make an English version:

1. Add a `description_en` field in `data/skills.yaml` (same structure as above)
2. Add `title_en` / `subtitle_en` in `data/categories.yaml`
3. Modify `scripts/templates/index.html.tmpl` to add a language switcher

We will gradually improve i18n support.

## Reporting issues

| Issue type | What to use |
|---|---|
| Broken link | issue → "fix-source" template |
| Wrong description / wrong categorization | issue → "fix-description" template |
| Add a new skill | PR editing the yaml directly; or issue → "add-skill" template |
| Feature suggestion | issue → "feature-request" template |

## Repository layout

```
skills-atlas/
├── docs/                    # GitHub Pages site
│   ├── index.html           # single-file website
│   └── data.json            # structured data for frontends to fetch
├── data/                    # source data (edit here)
│   ├── categories.yaml      # 20 categories / 115 subgroups
│   ├── skills.yaml          # 249 skill groups
│   └── repositories.yaml    # metadata for 111 source repositories
├── scripts/                 # parse_md / gen_html / validate / fetch_metadata
├── packages/
│   ├── skills-atlas-data/   # npm data package (canonical data.json + types)
│   └── skills-atlas-cli/    # terminal CLI + Claude Code plugin
└── .github/                 # CI / Issue / PR templates
```

## How new skills are discovered

Every day a workflow scans GitHub Search, queues newly-appearing skill repos onto a
candidate list, and renders them into an Issue for maintainers to review. **The LLM
never writes to the main data automatically** — humans decide what goes into
`data/repositories.yaml` + `data/skills.yaml`.

```
.github/workflows/daily-discover.yml   # daily at 02:00 UTC
  └─ scripts/discover_candidates.py    # GitHub Search → diff against the repo
       ↓ data/_inbox/raw/YYYY-MM-DD.json (auto PR)
       ↓ scripts/render_candidate_issue.py → gh issue create --label discover-bot
```

Rejected repos go in `data/_inbox/blocklist.yaml` and are skipped next run.

## Use the catalog data directly

The catalog is open data. A JSON build lives at `docs/data.json` (for frontends / MCP
servers / APIs); the source YAML is under `data/`:

```python
import yaml
skills = yaml.safe_load(open('data/skills.yaml'))
chains = [s for s in skills if s['chain']]   # all ⛓ strong-binding workflows
print(f'{len(chains)} chain workflows')
```

## Code of Conduct

By participating in this project, you agree to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md).

Short version: Be kind to everyone. Criticize the work, not the person. Discrimination, harassment, and personal attacks are not tolerated.
