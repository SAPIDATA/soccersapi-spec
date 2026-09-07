# SoccersAPI — OpenAPI specification

The official OpenAPI 3.1 specification for [SoccersAPI](https://soccersapi.com),
a REST API for football (soccer) data: search, livescores, fixtures, leagues,
teams, seasons, players, coaches, referees, venues, statistics, head-to-head,
bookmakers, markets, broadcasts and media.

The file [`openapi.yaml`](./openapi.yaml) is the machine-readable API contract.
SoccersAPI v2.2 uses a query operation selector (`t`) on resource routes. Each
route documents every accepted `t` value with its required and optional
parameters in an operations table, and repeats the same list in a machine-readable
`x-operations` extension. Narrative guides live under [`docs/`](./docs/docs-README.md).

## Using the spec

Point any OpenAPI-compatible tool at the raw file:

```
https://raw.githubusercontent.com/SAPIDATA/soccersapi-spec/main/openapi.yaml
```

- **Postman / Apidog / Insomnia** — import the URL above (or the `openapi.yaml`
  file) to get every endpoint ready to call.
- **SDK generators** (openapi-generator, Swagger Codegen, etc.) — feed it the
  spec to scaffold a typed client in your language.
- **Docs viewers** (Redoc, Swagger UI, Scalar) — render an interactive reference
  from the spec.

For Apidog, re-import or synchronize the root `openapi.yaml`; it is the
source-of-truth contract. The copy under `docs/` is kept byte-for-byte identical
for documentation publishing workflows.

## Authentication

Every request requires your SoccersAPI credentials, passed as query parameters:

```
https://api.soccersapi.com/v2.2/leagues/?user=YOUR_USERNAME&token=YOUR_TOKEN&t=info&id=1005
```

Get your credentials from your [SoccersAPI account](https://soccersapi.com).

## Versioning

This spec tracks the **v2.2** API. Endpoint paths are prefixed accordingly
(e.g. `/v2.2/fixtures/`).

## Working on the spec

```bash
npm install
npm run lint          # Spectral, full report
npm run lint:redocly  # Redocly validation
npm run preview       # local Redoc preview
```

To exercise every documented operation against the live API, copy
[`.env.example`](./.env.example) to `.env`, fill in the credentials of a
development account and run:

```bash
npm run probe
```

The probe reads [`scripts/operations.json`](./scripts/operations.json), calls
each operation once and writes the responses and a status summary under
`tmp/probe/` (git-ignored). Add `--only=fixtures` to restrict it to one route,
or `--dry` to print the requests without calling the API. Never commit `.env`
or the captured responses.

## Documentation site

The public documentation is a static site built from the contract and the
guides by `scripts/build-docs.mjs`: a [Scalar API Reference](https://github.com/scalar/scalar)
with one sidebar entry per operation and an interactive client that stores
`user` and `token` in the browser, plus a static page per operation, route and
guide with its own URL and meta tags, `sitemap.xml`, `robots.txt`, `llms.txt`
and `llms-full.txt`. Run it locally with:

```bash
npm run docs:serve
```

Then open http://localhost:8090. `npm run docs:build` writes everything to
`dist/`; the Scalar bundle is downloaded once into `tmp/vendor/` and served
from the site. Environment variables: `SCALAR_VERSION` (pinned in the script),
`DOCS_SITE_URL` (canonical URLs, default `https://docs.soccersapi.com`),
`DOCS_ANALYTICS=0` to leave out the Google tag, `DOCS_SCALAR_CDN=1` to load
Scalar from jsdelivr instead of the vendored file.

### Hosting on Cloudflare Pages

`.github/workflows/docs.yml` builds on every push and pull request and deploys
`dist/` with Wrangler: pushes to `main` go to production, pull requests get a
preview URL. It needs two repository secrets, `CLOUDFLARE_API_TOKEN` (Pages
edit permission) and `CLOUDFLARE_ACCOUNT_ID`, and a Pages project named
`soccersapi-docs`. Alternatively connect the repository in the Cloudflare
dashboard with build command `npm run docs:build` and output directory `dist`.

To serve the site at `docs.soccersapi.com`, add the custom domain to the Pages
project and point the DNS record to it. `dist/_redirects` sends every URL of
the previous documentation (listed in `scripts/legacy-urls.json`) to the new
page with a 301, and `dist/_headers` sets caching and security headers.

## Match events

Use `include=events` to embed timelines in livescores or match-returning fixture
operations. Use `t=match_events&id=MATCH_ID` only for the standalone timeline.
See [`docs/09-match-events-and-includes.md`](./docs/09-match-events-and-includes.md).
