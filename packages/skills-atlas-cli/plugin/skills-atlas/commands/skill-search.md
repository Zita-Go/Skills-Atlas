---
description: Search the Skills Atlas catalog for AI agent skills
argument-hint: <query> [-c category] [-p persona] [--chain]
allowed-tools: Bash(skills-atlas:*)
---

Search results (JSON) for `$ARGUMENTS`:

!`skills-atlas search $ARGUMENTS --json --limit 12`

Summarize the matches for the user: the skill name(s), what each does (`use_case`),
the best source repo (highest stars), and the exact command to install each
(`/skills-atlas:skill-install <skill>`).

Recommend **only** skills present in the JSON above — do not add skills from your
own knowledge, and quote names / repos / install commands verbatim from it. If the
result is empty, say so and suggest a couple of alternative queries or broader terms.
