# Plans and Data Access

Every SoccersAPI account has a plan. The plan decides three things: which
leagues the account can read, which operations and datasets it can request,
and how many requests it can make per hour. Prices and allowances change over
time; the [pricing page](https://soccersapi.com/pricing) and the account
dashboard are authoritative. This page explains how the plan model shows up
in API responses.

## Plan families

| Family | Leagues | Operations and datasets |
| --- | --- | --- |
| Free | 3 leagues chosen in the dashboard, with a daily request allowance. | The Standard datasets. |
| Standard (`Soccer API 3` … `Soccer API +1000`) | The number of leagues in the plan, chosen in the dashboard. | Every operation and every include. |
| World Cup | The FIFA World Cup competitions. | Every operation and every include, like Standard. |
| Odds | Every league with odds coverage. | The catalogue, the match feeds and the odds datasets. |
| Broadcast | Every league with TV coverage. | The catalogue, the match feeds and the broadcast datasets. |

Themed plans trade breadth of datasets for breadth of leagues: they cover
every league that carries their theme, but only return the datasets of that
theme on top of the shared catalogue and match feeds.

## What every plan can read

- **Catalogue**: search, continents, countries, leagues (`list`, `info`,
  `sort`), seasons, stages, groups, rounds, and teams (`info`, `list`, `sort`,
  `byseason`, `national`).
- **Match feeds**: every livescores feed and the fixture lists and match
  details (`schedule`, `season`, `round`, `last_next`, `info`, `sort`), without
  includes other than those of the plan.

## Datasets by plan

| Dataset | Operations and includes | Plans |
| --- | --- | --- |
| Match events, lineups, bench, commentary, sidelined | `fixtures?t=match_events`, `match_lineups`, `match_bench`, `match_comments`, `match_sidelined`; includes `events`, `stats` | Standard, World Cup |
| Standings and cup draws | `leagues?t=standings`, `standings_live`, `cup_draw` | Standard, World Cup |
| Statistics, head to head, leaders | every `stats`, `h2h` and `leaders` operation | Standard, World Cup |
| Team squads, transfers, sidelined, trophies | `teams?t=squad`, `transfers`, `sidelined`, `trophies` | Standard, World Cup |
| People and venues | every `players`, `coaches`, `referees` and `venues` operation | Standard, World Cup |
| Odds | `fixtures?t=match_odds`, `match_oddsinplay`, `match_odds_info`; `bookmakers` and `markets`; includes `odds_prematch`, `odds_inplay` | Standard, World Cup, Odds |
| Broadcast | every `broadcast` operation; `fixtures?t=tv`; includes `broadcast`, `tvs` | Standard, World Cup, Broadcast |
| Media highlights (coming soon) | every `media` operation | Standard, World Cup |

Free plans carry the Standard datasets. The reference shows the plans of every
operation in its operations table and on each operation page, and the contract
carries them in `x-operations[].plans` and `x-includes` so that tools can read
them.

## Which leagues does my plan include?

`leagues?t=list` returns only the leagues the account can read, so it is the
reliable way for an application to build its competition menu. Every match
feed (`livescores`, `fixtures?t=schedule`, `broadcast?t=schedule`) is filtered
the same way and never includes matches of leagues outside the plan.

## How access shows up in responses

| Situation | Response |
| --- | --- |
| League not in the plan (`leagues?t=info`, `standings`, `fixtures?t=season`, `teams?t=byseason`, `fixtures?t=schedule&league_id=…`) | `403` with an empty `data` and `meta.msg` = `League not available for your plan.` |
| Operation not in the plan | `403` with an empty `data` and `meta.msg` = `Endpoint not available for your plan.` |
| Include not in the plan | `403` with an empty `data` and `meta.msg` = `Include not available for your plan.` |
| Match feed without a league filter | `200` with only the matches of the leagues in the plan. |
| Dataset not covered for a match or competition | `200` with an empty array or `null` fields. |
| Request allowance exhausted | `429`. |

Treat `403` as a configuration problem to surface to the account owner, with
the `meta.msg` text as the explanation, and empty or `null` data as normal
coverage variance. Every successful response also reports the plan name in
`meta.plan` and the remaining allowance in `meta.requests_left`.

## Request allowance

Standard and themed plans share the same request tiers (Basic, Advanced,
Premium) with hourly limits. When the allowance is exhausted the API returns
`429`. Poll live feeds at a fixed cadence and use `include` to embed related
datasets instead of issuing separate calls; see
[Errors and Request Limits](./06-error-and-rate-limits.md) for backoff rules.
