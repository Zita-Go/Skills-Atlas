# Releasing `skills-atlas-cli`

Maintainer guide for cutting a new release. (Not shipped in the npm tarball.)

## Prerequisites

- An npm account with publish access to `skills-atlas-cli`.
- 2FA enabled → publishing asks for a 6-digit one-time code (OTP) from your
  authenticator app. Pass it with `--otp=<code>`.

## Steps

```bash
cd packages/skills-atlas-cli

# 1. Refresh the offline snapshot + run tests
npm run build      # copies ../../docs/data.json → ./data.json (gitignored)
npm test           # node --test (search-core unit tests)

# 2. Bump the version (updates package.json, commits, tags)
npm version patch  # or: minor / major

# 3. Publish (prepublishOnly re-runs build automatically)
npm publish --otp=<6-digit code>

# 4. Push the version commit + tag
git push origin main --follow-tags

# 5. Verify
npm view skills-atlas-cli version
```

## What ships

The tarball contains only what `files` in `package.json` lists: `bin/`, `src/`,
`data.json`, `README.md`. The Claude Code plugin (`plugin/`) and the tests are
**not** published to npm — the plugin is distributed through the repo marketplace
(`/plugin marketplace add Zita-Go/Skills-Atlas`).

## When do I actually need to republish?

Data changes do **not** require a new npm release. The flow:

- The bundled `data.json` is a point-in-time snapshot, refreshed at each publish.
- Users get fresher data without upgrading by running `skills-atlas update`, which
  pulls `https://zita-go.github.io/Skills-Atlas/data.json`.
- That public feed auto-refreshes whenever `data/**` changes land on `main`
  (handled by `.github/workflows/build-docs.yml`).

So republish only when the **CLI code** changes, or when you want the offline
default snapshot (for users who never run `update`) to be fresher.

## CI

`.github/workflows/validate.yml` has a `cli-test` job that runs
`npm run build && npm test` on any change under `packages/skills-atlas-cli/**`.
