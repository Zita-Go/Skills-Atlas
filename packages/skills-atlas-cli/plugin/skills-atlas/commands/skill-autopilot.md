---
description: Turn the Skills Atlas autopilot on/off, check its status, or tune its sub-toggles
argument-hint: [on | off | status | suggest on|off | gaps on|off | prune on|off | lang en|zh]
allowed-tools: Bash(skills-atlas:*)
---

!`skills-atlas hook $ARGUMENTS`

Relay the result to the user plainly. Context for framing your reply:

- The autopilot proactively suggests catalog skills when a prompt fits one the user
  doesn't have, flags recurring capability gaps, and offers to craft a skill from a
  repeated workflow. It is **ON by default**.
- `on` / `off` is the **master switch**. With no argument, the command shows **status**.
- Sub-toggles let them keep the autopilot on but mute one behavior:
  `suggest on|off` (per-prompt suggestions), `gaps on|off` (gap + craft nudges),
  `prune on|off` (removal suggestions). `lang en|zh` sets the reply language;
  `model <name>` sets the background analysis model.
- Changes take effect from the next prompt. Nothing leaves the machine.
