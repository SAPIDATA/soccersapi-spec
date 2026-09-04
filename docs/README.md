# SoccersAPI — OpenAPI specification

The official OpenAPI 3.1 specification for [SoccersAPI](https://soccersapi.com),
a REST API for football (soccer) data: search, livescores, fixtures, leagues,
teams, seasons, players, coaches, referees, venues, statistics, head-to-head,
bookmakers, markets, broadcasts and media.

The file [`openapi.yaml`](./openapi.yaml) is the machine-readable API contract.
SoccersAPI v2.2 uses a query operation selector (`t`) on resource routes. Each
route documents every accepted `t` value with its required and optional
parameters in an operations table, and repeats the same list in a machine-readable
`x-operations` extension. Narrative guides are listed in [`docs-README.md`](./docs-README.md).

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
source-of-truth contract. This copy under `docs/` is kept byte-for-byte
identical for documentation publishing workflows.

## Authentication

Every request requires your SoccersAPI credentials, passed as query parameters:

```
https://api.soccersapi.com/v2.2/leagues/?user=YOUR_USERNAME&token=YOUR_TOKEN&t=info&id=1005
```

Get your credentials from your [SoccersAPI account](https://soccersapi.com).

## Versioning

This spec tracks the **v2.2** API. Endpoint paths are prefixed accordingly
(e.g. `/v2.2/fixtures/`).

## Match events

Use `include=events` to embed timelines in livescores or match-returning fixture
operations. Use `t=match_events&id=MATCH_ID` only for the standalone timeline.
See [`09-match-events-and-includes.md`](./09-match-events-and-includes.md).
