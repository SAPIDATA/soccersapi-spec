# SoccersAPI — OpenAPI spec

This repository is the **single source of truth** for the SoccersAPI contract.
The file [`openapi.yaml`](./openapi.yaml) (OpenAPI 3.1.0) is the canonical
definition; every other tool consumes it **one-directionally**.

```
                 ┌──────────────────────┐
   you edit ───▶ │  openapi.yaml (git)  │  ◀── source of truth
                 └──────────┬───────────┘
                            │ (CI: spectral lint)
              ┌─────────────┼──────────────┐
              ▼             ▼               ▼
          Postman        Apidog        Rendered docs
        (git sync)   (bind data src)   (Redoc / Scalar)
```

**The golden rule: never hand-edit the spec inside Postman or Apidog.** They are
read-only consumers. All changes happen here, in `openapi.yaml`, via pull request.

## Layout

| File | Purpose |
| --- | --- |
| `openapi.yaml` | The API contract. Edit this and nothing else. |
| `.spectral.yaml` | Lint ruleset (style + correctness checks). |
| `.github/workflows/lint.yml` | Runs the linter on every push and PR. |
| `package.json` | Dev tooling: Spectral (lint) + Redocly (bundle/preview). |

## Working on the spec

```bash
npm install          # one-time
npm run lint         # check the spec
npm run preview      # live Redoc preview at http://localhost:8080
```

Then commit and open a PR. CI lints automatically.

## Connecting the consumers

**Apidog** — Settings → Import Data → Scheduled Import (Bind Data Sources) → New.
Choose **Git Repository**, point it at this repo / `main` / `openapi.yaml`. In
Advanced Settings set conflict resolution to **overwrite** (the spec always wins).
Grant the GitHub App **read-only** access to **this repo only**.

**Postman** — API Builder → link this GitHub repo to the API definition and
generate the collection from it. Don't edit the generated collection by hand.

## Linter status & cleanup backlog

`npm run lint` currently reports **0 errors** and a set of **warnings** that
form the cleanup backlog from the original Apidog export. CI fails only on
errors, so the spec is mergeable today; clear the warnings over time and then
promote the relevant rules to `error` in `.spectral.yaml`.

Current backlog (warnings):

| Count | Rule | What to do |
| --- | --- | --- |
| 89 | `oas3-parameter-description` | Fill in the empty `description:` on query params. |
| 22 | `operation-operationId` | Add a unique `operationId` to each operation (e.g. `searchMatches`, `listLeagues`). Drives clean SDK/codegen names. |
| 21 | `operation-tags` | Tag each operation by category. Currently everything is tagged `Search`; split into `Search`, `Reference`, `Fixtures`, `Stats`, `Odds`, `People`, `Media`, etc. |
| 17 | `operation-description` | Add a short `description:` to operations that lack one. |

### Notes on what was changed from the raw export

The original Apidog export was adjusted only at the metadata level — endpoint
definitions are untouched:

- `info.title` `"Default module"` → `"SoccersAPI"`, added description, contact,
  and a placeholder `license` (**confirm or change** — set to `Proprietary`).
- `info.version` `1.0.0` → `2.2.0` to match the documented API version.
- Added `servers: [https://api.soccersapi.com]` (the export had none).
- Removed a duplicate empty `servers: []` key that the export left at the end.

### Known linter caveat

`duplicated-entry-in-enum` is disabled in `.spectral.yaml`. It crashes on this
spec (`Cannot read properties of null (reading 'enum')`) due to an upstream
Spectral/nimma bug triggered by the legitimate `null` values inside the response
examples. Re-enable it once the upstream fix lands. All other rules — including
example-vs-schema validation — run normally.

## Recommended next steps (not done automatically)

- **Auth as a security scheme.** Every endpoint repeats `user` and `token` query
  params. Consider defining them once under `components.securitySchemes`
  (two `apiKey` schemes, `in: query`) and referencing them with `security`,
  instead of repeating the params on all 22 operations.
- **Reusable schemas.** `components.schemas` is empty; response shapes are inline.
  Extracting shared objects (Country, Team, Fixture…) into `components.schemas`
  with `$ref` will shrink the file and keep responses consistent.
