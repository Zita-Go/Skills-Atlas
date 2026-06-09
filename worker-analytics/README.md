# skills-atlas-analytics

Sibling worker to `../worker`; collects anonymous usage/diagnostic events into Cloudflare D1; no IP, no identity.

## Deploy

```bash
cd worker-analytics
wrangler d1 create skills-atlas-analytics      # paste the id into wrangler.toml
wrangler d1 execute skills-atlas-analytics --remote --file=schema.sql
wrangler deploy                                # note the workers.dev URL
```

Then set `ANALYTICS_ENDPOINT` in `scripts/templates/index.html.tmpl` to `<that URL>/event`, run `python3 scripts/gen_html.py`, and commit `docs/index.html`. (For CLI telemetry, also set `BUILTIN_ENDPOINT` in `packages/skills-atlas-cli/src/telemetry.js` and `ENDPOINT` in the plugin's `hooks/hook-telemetry.js` to the same `<URL>/event`, then publish.)

## Read-out (private)

A token-gated `GET /stats` returns canned aggregates (web + CLI + onboarding funnel). Set the token and redeploy:

```bash
wrangler secret put STATS_TOKEN      # choose a long random value
wrangler deploy
```

Then open `worker-analytics/dashboard.html` **locally** (it is NOT served by GitHub Pages — it does not live under `docs/`), paste the worker base URL + the token, and Load. Or query directly:

```bash
curl "https://<worker-url>/stats?token=$STATS_TOKEN&days=30"
```

`/stats` is the only authenticated route: missing token → `503`, wrong token → `401`. The dashboard is inert until you paste a working endpoint + token, so it is safe to keep in the repo.

## Test

```bash
npm test
```

Or equivalently: `node --test`.
