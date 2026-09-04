# Introduction

SoccersAPI is a REST API for football data. Version 2.2 exposes resource routes
such as `/livescores/`, `/fixtures/`, `/leagues/`, `/teams/` and `/players/`.
Every route uses the required `t` query parameter to select an operation; the
reference documents each route with a table of its `t` values and the
parameters each one needs.

Common product use cases include:

- Live and day-based match feeds.
- Fixtures, results, match status and event timelines.
- Match, team and player statistics.
- Leagues, seasons, stages, groups, rounds and standings.
- Team, player, coach, referee and venue profiles.
- Pre-match and in-play odds where enabled.
- Broadcast listings and media/highlight metadata where available.

Every request requires an account username (`user`) and API token (`token`).
Successful responses normally contain `data` and `meta`; `meta` reports request
quota and pagination information.

## Coverage and completeness

Access and field availability depend on three separate factors:

1. The account plan and its selected leagues/datasets.
2. Coverage for the competition and season.
3. What the upstream source has published for the specific match.

For this reason, a successful response can contain an empty array or nullable
fields. Clients should handle missing lineups, events, stats, odds, broadcasts,
player IDs and assist attribution without treating them as transport errors.

Live scores, match events and attribution can update at different times. Data
may also be corrected or backfilled during and shortly after a match. Consumers
should merge newer snapshots and avoid assuming that the first goal update is
already fully attributed.

## Plans and pricing

Plan names, league allowances, trial terms, request limits and prices can
change. The account dashboard and the [current pricing
page](https://soccersapi.com/pricing) are the authoritative sources for a
subscription. Use [coverage](https://soccersapi.com/coverage) to confirm the
competitions currently available to the account.

For plan or coverage questions, contact
[support@soccersapi.com](mailto:support@soccersapi.com).

## Recommended next steps

1. Follow [Getting Started](./02-getting-started.md) to create a token and make
   a first authenticated call.
2. Read [Shared Query Parameters](./05-global-query-parameters.md), especially
   the difference between operation selectors and dataset includes.
3. For live timelines, read [Match Events and Dataset
   Includes](./09-match-events-and-includes.md).
4. Check [Plans and Data Access](./10-plans-and-access.md) to understand which
   leagues and datasets the account can read.
5. Use the reference for the accepted `t` values and conditional parameters of
   each route, and the [Interactive API Explorer](./07-interactive-api-explorer.md)
   to try them.
