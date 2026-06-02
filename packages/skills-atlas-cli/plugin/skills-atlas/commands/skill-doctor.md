---
description: Health-check your installed skills — orphans, drift, missing SKILL.md, license/script risks
argument-hint: (no arguments)
allowed-tools: Bash(skills-atlas:*)
---

!`skills-atlas doctor`

Summarize the health report above for the user: anything that needs attention
(orphaned folders, drift from upstream, missing SKILL.md, license or script risks) and
the suggested fix for each. If everything is clean, say so in one line. Only carry out a
fix (removing, reinstalling, upgrading) if the user asks.
