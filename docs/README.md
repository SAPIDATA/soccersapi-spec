# SoccersAPI — OpenAPI specification

The official OpenAPI 3.1 specification for [SoccersAPI](https://soccersapi.com),
a REST API for football (soccer) data: search, livescores, fixtures, leagues,
teams, seasons, players, coaches, referees, venues, statistics, head-to-head,
bookmakers, markets, broadcasts and media.

The file [`openapi.yaml`](./openapi.yaml) is a machine-readable description of
every endpoint, its parameters, and its responses. You can use it to explore the
API, generate client SDKs, set up request collections, or render your own
documentation.

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

## Authentication

Every request requires your SoccersAPI credentials, passed as query parameters:

```
https://api.soccersapi.com/v2.2/leagues/?user=YOUR_USERNAME&token=YOUR_TOKEN
```

Get your credentials from your [SoccersAPI account](https://soccersapi.com).

## Versioning

This spec tracks the **v2.2** API. Endpoint paths are prefixed accordingly
(e.g. `/v2.2/fixtures/`).
