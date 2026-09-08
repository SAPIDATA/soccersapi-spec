# Shared Query Parameters

Authentication parameters are required on every endpoint. The other parameters
apply only where the endpoint reference lists them.

| Parameter | Type | Required | Example | Notes |
| --- | --- | --- | --- | --- |
| `user` | string | Yes | `{{USERNAME}}` | Account username. |
| `token` | string | Yes | `{{TOKEN}}` | API token from the account dashboard. |
| `lang` | string | No | `en` | Localizes catalogue names (countries, continents, leagues). Match, event and statistics payloads are not translated. |
| `utc` | number | No | `2`, `4.5`, `-3` | UTC offset applied to supported date/time values; `time.timezone` reports it (`UTC+4.5`). Invalid values fall back to UTC. |
| `include` | string | No | `events,stats` | Comma-separated datasets, with no spaces. Values and support depend on the operation. |
| `page` | integer | No | `1` | Page number on paginated operations. Pages hold 100 items; the response reports `meta.page`, `meta.pages`, `meta.count` and `meta.total`. |
| `odds_format` | string | No | `decimal` | Odds format on odds datasets: `decimal` (default), `fractional` or `american`. |

## Pagination

List operations return at most 100 items per page and cannot change the page
size: `per_page` and `nopag` are ignored. Read `meta.pages` and request the
following pages with `page`, starting at 1; a page beyond the last returns an
empty `data` array with the same `meta.total`. The paginated operations are the country, league,
team, player, coach, referee, venue and TV channel lists, every livescores feed,
`fixtures?t=schedule` and `broadcast?t=schedule`. Season fixtures, leaders,
match datasets and search results are returned in full; search reports
`meta.count` and `meta.total` as `0`, so use the length of `data`.

## Operation selector

`t` is required on every route. When it is omitted the route falls back to its
default list operation instead of returning an error, so always send it
explicitly and check the operations table of the route for the accepted values.

## Dataset includes

The most common match datasets are:

| Include value | Returned property | Where | Plans |
| --- | --- | --- | --- |
| `events` | `events` | Livescores and `fixtures?t=schedule`, `season`, `round`, `info`, `sort`. | Standard, World Cup |
| `stats` | `stats` | Livescores and `fixtures?t=schedule`, `season`, `round`, `info`, `sort`. | Standard, World Cup |
| `odds_prematch` | `odds_prematch` | Livescores and fixture operations where match coverage provides odds. | Standard, World Cup, Odds |
| `odds_inplay` | `odds_inplay` | Livescores and `fixtures?t=info` for matches in play. | Standard, World Cup, Odds |
| `broadcast` | `broadcast` | `fixtures?t=schedule`, `season`, `round`, `info` and `sort`: TV channels showing the match. Not supported by livescores or `last_next`. | Standard, World Cup, Broadcast |
| `tvs` | `tvs` | `broadcast?t=schedule`: embeds the channel details in each match. | Standard, World Cup, Broadcast |

Free plans carry the Standard datasets. An include outside the plan returns
`403` with `meta.msg` = `Include not available for your plan.`; see
[Plans and Data Access](./08-plans-and-access.md).

Use dataset names in `include`; do not use standalone operation values. For
example, `include=events` embeds the timeline, while `t=match_events` calls the
standalone timeline operation.

See [Match Events and Dataset Includes](./07-match-events-and-includes.md) for
endpoint examples, event fields and live polling guidance.

> Tip: Store times internally from the returned Unix `timestamp` where
> available. Use `utc` only when a projected local date/time string is useful
> for display or date grouping.
