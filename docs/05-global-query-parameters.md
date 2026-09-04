# Shared Query Parameters

Authentication parameters are required on every endpoint. The other parameters
apply only where the endpoint reference lists them.

| Parameter | Type | Required | Example | Notes |
| --- | --- | --- | --- | --- |
| `user` | string | Yes | `{{USERNAME}}` | Account username. |
| `token` | string | Yes | `{{TOKEN}}` | API token from the account dashboard. |
| `lang` | string | No | `en` | Localizes supported names/labels. Availability varies by dataset. |
| `utc` | number | No | `2`, `4.5`, `-3` | UTC offset applied to supported date/time values. Decimal offsets are accepted. |
| `include` | string | No | `events,stats` | Comma-separated datasets, with no spaces. Values and support depend on the operation. |
| `page` | integer | No | `1` | Page number on paginated operations. |
| `per_page` | integer | No | `20` | Page size where supported; the maximum varies by operation. |

## Dataset includes

The most common match datasets are:

| Include value | Returned property | Typical support |
| --- | --- | --- |
| `events` | `events` | Livescores, fixture schedules, `fixtures?t=info`, `fixtures?t=sort`. |
| `stats` | `stats` | Livescores, fixture schedules, `fixtures?t=info`, `fixtures?t=sort`. |
| `odds_prematch` | `odds_prematch` | Livescores/fixtures where the plan and match coverage provide odds. |
| `odds_inplay` | `odds_inplay` | Live matches where the plan and match coverage provide in-play odds. |
| `broadcast` | `broadcast` | Match details where broadcast coverage is available. |

Use dataset names in `include`; do not use standalone operation values. For
example, `include=events` embeds the timeline, while `t=match_events` calls the
standalone timeline operation.

See [Match Events and Dataset Includes](./09-match-events-and-includes.md) for
endpoint examples, event fields and live polling guidance.

> Tip: Store times internally from the returned Unix `timestamp` where
> available. Use `utc` only when a projected local date/time string is useful
> for display or date grouping.
