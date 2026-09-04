# Plans and Data Access

Every SoccersAPI account has a plan. The plan decides three things: which
leagues the account can read, how many requests it can make, and, for themed
plans, which datasets are available. Prices, allowances and trial terms change
over time; the [pricing page](https://soccersapi.com/pricing) and the account
dashboard are authoritative. This page explains how the plan model affects API
responses so that clients can handle it correctly.

## Plan families

| Family | What it includes | Typical use |
| --- | --- | --- |
| Free | 3 leagues, a daily request allowance, access to every endpoint. | Prototypes and evaluation. |
| Standard (`Soccer API 3` … `Soccer API +1000`) | Every endpoint and dataset for the number of leagues in the plan. Request volume is set by the tier: Basic, Advanced or Premium (hourly limits). | Livescore apps, fixtures, stats, TV listings and odds for a chosen set of competitions. |
| Themed (`Soccer API World Cup`, `Soccer API Odds`, `Soccer API Broadcast`) | All leagues, focused on one data theme. Same billing and request tiers as Standard. | Products built around a single dataset, such as an odds comparison or a "where to watch" service. |

A Standard plan is the right choice when a product mixes datasets, for example a
TV schedule that also shows live scores and lineups. Themed plans trade breadth
of datasets for breadth of leagues.

## League selection

Standard plans read only the leagues enabled in the dashboard under
[Leagues](https://admin.soccersapi.com/leagues). Requests for a league outside
the selection return `403`. Entity endpoints such as countries, continents,
bookmakers and markets are catalogue data and are not filtered by league.

## Request allowance

Every successful response reports the remaining allowance in
`meta.requests_left` and the plan name in `meta.plan`. When the allowance is
exhausted the API returns `429`. Poll live feeds at a fixed cadence and use
`include` to embed related datasets instead of issuing separate calls; see
[Errors and Request Limits](./06-error-and-rate-limits.md) for backoff rules.

## How access shows up in responses

| Situation | Response |
| --- | --- |
| Endpoint or dataset not in the plan | `403` with an explanatory `msg`. |
| League not enabled on the account | `403`, or an empty `data` array on list feeds. |
| Dataset not covered for a match or competition | `200` with an empty array or `null` fields. |
| Request allowance exhausted | `429`. |

Clients should treat `403` as a configuration problem to surface to the account
owner, and empty or `null` data as normal coverage variance.

## Reference operations by theme

The reference groups operations by tag. Odds operations live under **Betting**
and in the fixture operations `match_odds`, `match_oddsinplay` and
`match_odds_info`. Broadcast operations live under **Broadcast** and in the
fixture include `broadcast` and the operation `t=tv`. Everything else belongs
to the core football data model available on every plan. The **Media** route is
announced but not live yet and is marked "coming soon" in the reference.
