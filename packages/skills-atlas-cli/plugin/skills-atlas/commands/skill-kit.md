---
description: Detect this project's type and propose a curated kit of agent skills (review before installing)
argument-hint: [--archetype <name>]
allowed-tools: Bash(skills-atlas:*)
---

!`skills-atlas kit --dry-run $ARGUMENTS`

The kit above is a DRY RUN — **nothing was installed**. Present it to the user: the
detected project type and the skills it proposes (grouped as core dev workflow +
archetype add-ons), with a word on what each is for. Then let them choose:

- Install the whole kit → run `skills-atlas kit --yes --project` (installs to
  ./.claude/skills/ and writes a committable skills-atlas.kit.json teammates can `sync`).
- Install only some → `skills-atlas use <skill> --yes --project` for each they want.
- Skip → do nothing.

Install **only after they confirm** — this command itself writes nothing. If detection
looks wrong, they can re-run with `--archetype <name>` (web-frontend, backend-service,
data-ml, infra-devops, cli-library, generic).
