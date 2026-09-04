# Soccer's API

**Soccer's API** is a REST API for football data. It provides live and scheduled
matches, events, lineups, statistics, odds, broadcasts and football entities.
The exact competitions, datasets and fields available depend on the account
plan, competition coverage and what the source has published for each match.

Every route takes a `t` query parameter that selects the operation. The
reference lists, for each route, the accepted `t` values with their required
and optional parameters, a captured response example per operation and an
interactive client to send requests with your own credentials.

---

## Getting started

> 💡 Follow these steps to start quickly. If you hit any issue, reach our support team at [support@soccersapi.com](mailto:support@soccersapi.com).

### 1. Register or log in
- **Register**: [admin.soccersapi.com/register](https://admin.soccersapi.com/register)
- **Login**: [admin.soccersapi.com/login](https://admin.soccersapi.com/login)

After registration, use the dashboard to confirm the plan or trial assigned to
the account. Plan terms and included leagues can change.

### 2. Access your dashboard
Go to [admin.soccersapi.com](https://admin.soccersapi.com) to view your current plan, upgrade if needed, and manage your tokens and leagues.

### 3. Generate an API token
Create and manage tokens at [admin.soccersapi.com/api-tokens](https://admin.soccersapi.com/api-tokens). Every request requires both `user` (your username) and `token`. You can generate multiple tokens for different projects.

### 4. Select your leagues
Manage active leagues at [admin.soccersapi.com/leagues](https://admin.soccersapi.com/leagues).
Use the dashboard and [coverage page](https://soccersapi.com/coverage) to verify
which competitions are available to the account.

### 5. Make your first call
Use your username and token in every request:

```bash
curl -L -g "https://api.soccersapi.com/v2.2/leagues/?user={{USERNAME}}&token={{TOKEN}}&t=info&id=1005"
```

---

## Global query parameters

These parameters apply across endpoints (where supported):

| Param | Type | Required | Values / example | Notes |
|---|---|---|---|---|
| `user` | string | Yes | `{{USERNAME}}` | Authentication |
| `token` | string | Yes | `{{TOKEN}}` | Authentication |
| `lang` | string | No | `en`, `es`, `de`, `fr`, `it`, `pt`, `tr`, `pl`, `ko` | Localized labels (when available) |
| `utc` | number | No | `2`, `4.5`, `-3` | UTC offset for supported date/time values |
| `include` | string | No | `events,stats` | Comma-separated datasets; support depends on the operation |
| `page` | integer | No | `1…` | Pagination (where supported) |
| `odds_format` | string | No | `decimal`, `fractional`, `american` | Odds format on odds datasets |

> Match-event include values and examples are documented in [Match Events and Dataset Includes](./09-match-events-and-includes.md). Use `include=events`; `t=match_events` is the separate event-only operation.

---

## Errors & rate limits

### Common errors
- **401 Unauthorized** — invalid `user` / `token`
- **403 Forbidden** — not included in your plan
- **404 Not Found** — resource does not exist (check IDs / season)
- **400 Bad Request** — invalid `t`, missing conditional parameter or invalid value
- **429 Too Many Requests** — rate limit exceeded
- **5xx** — upstream or internal error

### Backoff guidance
On **429** or a retryable **5xx**, use exponential backoff with jitter and
respect `Retry-After` when present.

---

## Plans & pricing

League allowances, datasets, request tiers, trials, billing periods and prices
can change. Check the account dashboard and the [current pricing
page](https://soccersapi.com/pricing) for the authoritative plan details. Use
[coverage](https://soccersapi.com/coverage) to confirm available competitions.

---

## Data availability

A successful response can contain empty arrays or nullable fields when a
dataset is not available for a match. Live scores and their event attribution
can arrive at different times and may be corrected or backfilled.
