# Getting Started

Four steps take you from no account to a first authenticated call.

## 1. Create your account

Register at [admin.soccersapi.com/register](https://admin.soccersapi.com/register)
or log in at [admin.soccersapi.com/login](https://admin.soccersapi.com/login).
Registration is free and every account starts on a trial or on the Free plan.

## 2. Check your plan and your leagues

The [dashboard](https://admin.soccersapi.com) shows the plan assigned to the
account and, under [Leagues](https://admin.soccersapi.com/leagues), the
competitions it can read. Standard plans let you pick the leagues; themed plans
come with a fixed league set; see [Plans and Data Access](./08-plans-and-access.md).
The [coverage page](https://soccersapi.com/coverage) lists every competition
the API offers, and [pricing](https://soccersapi.com/pricing) the plans and
request tiers.

## 3. Generate an API token

Create and manage tokens at
[admin.soccersapi.com/api-tokens](https://admin.soccersapi.com/api-tokens).
You can create several, one per project or environment. Every request needs
both `user` (your username) and `token` as query parameters. Never expose a
production token in browser code, screenshots, support tickets or a public
repository; use a separate token for development and rotate it if it leaks.

## 4. Make your first call

Pick a league enabled on the account and ask for its profile:

```bash
curl -L -g "https://api.soccersapi.com/v2.2/leagues/?user={{USERNAME}}&token={{TOKEN}}&t=info&id=1005"
```

```json
{
  "data": { "id": 1005, "name": "Tipico Bundesliga", "id_current_season": "21096", "seasons": [ { "id": 21096, "name": "26/27", "is_current": "1" } ], "…": "…" },
  "meta": { "requests_left": 2950, "plan": "Soccer API 50", "page": 1, "pages": 1, "count": 1, "total": 1, "msg": "" }
}
```

Every route works the same way: the `t` parameter selects the operation and
the reference lists, per route, the accepted values with their parameters. List
operations return 100 items per page and report the page count in
`meta.pages`.

## Next steps

- [Shared Query Parameters](./02-shared-query-parameters.md) for pagination,
  `include`, `utc` and `lang`.
- [Data Model](./03-data-model.md) to see how leagues, seasons, matches and
  teams link together.
- [Recipes](./09-recipes.md) for the call sequences behind the usual products.
- [Interactive API Explorer](./11-interactive-api-explorer.md) to try any
  operation from the browser with your credentials.
