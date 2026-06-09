# skills-atlas-analytics

Sibling worker to `../worker`; collects anonymous usage/diagnostic events into Cloudflare D1; no IP, no identity.

## Deploy

```bash
cd worker-analytics
wrangler d1 create skills-atlas-analytics      # paste the id into wrangler.toml
wrangler d1 execute skills-atlas-analytics --remote --file=schema.sql
wrangler deploy                                # note the workers.dev URL
```

Then set `ANALYTICS_ENDPOINT` in `scripts/templates/index.html.tmpl` to `<that URL>/event`, run `python3 scripts/gen_html.py`, and commit `docs/index.html`.

## Test

```bash
npm test
```

Or equivalently: `node --test`.
