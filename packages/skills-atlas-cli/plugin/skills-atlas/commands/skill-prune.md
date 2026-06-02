---
description: Review installed skills and suggest ones you no longer use that could be removed
argument-hint: (no arguments)
allowed-tools: Bash(skills-atlas:*)
---

!`skills-atlas prune`

The output above lists installed skills plus an instruction addressed to YOU. Follow it:

- Suggest any installed skills that no longer fit the user's recent work and could be
  removed, each with the exact removal command (`skills-atlas remove <skill>` — add
  `--project` for a project-scoped skill).
- Suggest removing **only** skills listed above. If nothing clearly stands out as unused,
  say so — don't pad the list.
