# Soccer's API

**Soccer's API** is a comprehensive and versatile RESTful service that delivers **real-time soccer data** with speed, accuracy, and reliability. Built for businesses and developers alike — from experienced professionals to newcomers — it's the easiest way to integrate rich soccer information into any application.

With a focus on **accuracy** and **up-to-date coverage**, it unlocks a wide spectrum of soccer data:

- **Leagues coverage** — nearly **1,000 leagues worldwide**.
- **Live scores** — real-time goals, cards, substitutions, and key events.
- **Lineups** — confirmed starting lineups before kickoff.
- **Statistics** — detailed match, team, and player stats, plus historical records.
- **Betting odds** — live odds from multiple bookmakers.
- **Broadcast TV listings** — live broadcast schedules.
- **Player profiles** — biographies, career stats, transfer history, images, and form.
- **Detailed profiles** — leagues, teams, coaches, referees, stadiums, bookmakers, and TV channels.

---

## Getting started

> 💡 Follow these steps to start quickly. If you hit any issue, reach our support team at [support@soccersapi.com](mailto:support@soccersapi.com).

### 1. Register or log in
- **Register**: [admin.soccersapi.com/register](https://admin.soccersapi.com/register)
- **Login**: [admin.soccersapi.com/login](https://admin.soccersapi.com/login)

Registration is free and takes a minute. Once registered, the **Free Plan** is instantly active — no credit card required — with three major leagues: **Austria Bundesliga**, **Australia A-League**, and **Denmark Superligaen**.

### 2. Access your dashboard
Go to [admin.soccersapi.com](https://admin.soccersapi.com) to view your current plan, upgrade if needed, and manage your tokens and leagues.

### 3. Generate an API token
Create and manage tokens at [admin.soccersapi.com/api-tokens](https://admin.soccersapi.com/api-tokens). Every request requires both `user` (your username) and `token`. You can generate multiple tokens for different projects.

### 4. Select your leagues
Manage active leagues at [admin.soccersapi.com/leagues](https://admin.soccersapi.com/leagues). Free Plan leagues are pre-selected; paid plans let you choose from hundreds. Full coverage: [soccersapi.com/coverage](https://soccersapi.com/coverage).

### 5. Make your first call
Use your username and token in every request:

```bash
curl -L -g "https://api.soccersapi.com/v2.2/league/?user={{USERNAME}}&token={{TOKEN}}&id=1004"
```

---

## Global query parameters

These parameters apply across endpoints (where supported):

| Param | Type | Required | Values / example | Notes |
|---|---|---|---|---|
| `user` | string | Yes | `{{USERNAME}}` | Authentication |
| `token` | string | Yes | `{{TOKEN}}` | Authentication |
| `lang` | string | No | `en`, `es`, `de`, `fr`, `it`, `pt`, `tr`, `pl`, `ko` | Localized labels (when available) |
| `utc` | integer | No | `0` (default), `1` | `1` returns times in UTC |
| `include` | string | No | `events,stats,odds_prematch,odds_inplay,commentary,broadcasters` | Only where supported |
| `page` | integer | No | `1…` | Pagination (where supported) |
| `per_page` | integer | No | `20` default, max varies | Pagination (where supported) |

> Tip: prefer `utc=1` for consistent timestamps across time zones.

---

## Errors & rate limits

### Common errors
- **401 Unauthorized** — invalid `user` / `token`
- **403 Forbidden** — not included in your plan
- **404 Not Found** — resource does not exist (check IDs / season)
- **422 Unprocessable** — invalid parameter value
- **429 Too Many Requests** — rate limit exceeded
- **5xx** — upstream or internal error

### Backoff guidance
On **429**, retry with exponential backoff: 1s → 2s → 4s → 8s.

---

## Plans & pricing

Flexible plans from free testing to enterprise scale. All plans include **24/7 support**, **access to all endpoints**, and **monthly or yearly billing** (up to 20% off yearly). Most paid plans also include **50% off the first billing period**.

### Free
- **Soccer API Free** — no payment
  - 3 leagues (incl. Austria Bundesliga) · 100 requests/day · all endpoints · 24/7 support

### Standard (Basic / Advanced / Premium tiers)
- **Soccer API 3** — from **€20/mo** · 3 leagues · 2k–8k req/hour · historical & custom
- **Soccer API 10** — from **€30/mo** · 10 leagues · 3k–12k req/hour · historical & custom
- **Soccer API 20** — from **€40/mo** · 20 leagues · 4k–16k req/hour
- **Soccer API 50** *(most popular)* — from **€70/mo** · 50 leagues · 5k–20k req/hour
- **Soccer API 100** — from **€110/mo** · 100 leagues · 6k–24k req/hour
- **Soccer API 200** — from **€160/mo** · 200 leagues · 7k–28k req/hour
- **Soccer API 500** — from **€220/mo** · 500 leagues · 8k–32k req/hour
- **Soccer API +1000** — from **€280/mo** · 1000+ leagues · 9k–36k req/hour

### Custom
- **Soccer API World Cup** — from **€30/mo** · global competitions · 3k–12k req/hour
- **Soccer API Odds** — from **€50/mo** · bookmaker odds · 3k–12k req/hour
- **Soccer API Broadcast** — from **€60/mo** · TV & streaming schedules · 3k–12k req/hour

### Discounts
- **50% off the first month** (most paid plans)
- **20% off yearly billing**

👉 Full details on the [pricing page](https://soccersapi.com/pricing), or contact **support@soccersapi.com** for a custom offer.

---

## Why choose Soccer's API?

Build better apps faster — live score apps, fantasy leagues, betting platforms, or analytics tools. Its ease of use, breadth of data, and real-time accuracy make it an essential building block for any soccer data-driven solution.
