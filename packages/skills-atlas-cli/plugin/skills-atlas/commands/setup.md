---
description: Show what Skills Atlas gives you and how to use it (run after installing the plugin)
argument-hint: (no arguments)
allowed-tools: Bash(skills-atlas:*)
---

!`skills-atlas setup`

If the line above is an error like "skills-atlas: command not found", the Skills Atlas
**engine (its CLI) isn't installed yet** — tell the user, in one friendly line, to run:

    npm i -g skills-atlas-cli

…then re-run `/skills-atlas:setup`. (The plugin's commands and autopilot all call that CLI.)

Otherwise, relay the status and the "what you can do" list from the output above plainly,
and offer to help with whatever they want first.
