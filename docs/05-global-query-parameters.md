# Global Query Parameters

| Param    | Type     | Required | Values/Example                               | Notes |
|----------|----------|----------|----------------------------------------------|------|
| user     | string   | Yes      | `{{USERNAME}}`                               | Authentication |
| token    | string   | Yes      | `{{TOKEN}}`                                  | Authentication |
| lang     | string   | No       | `en`, `es`, `de`, `fr`, `it`, `pt`, `tr`, `pl`, `ko` | Localized labels (when available) |
| utc      | integer  | No       | `0` (default), `1`                           | `1` returns times in UTC |
| include  | string   | No       | `events,stats,odds_prematch,odds_inplay, commentary,broadcasters` | Only where supported |
| page     | integer  | No       | `1…`                                         | Pagination (where supported) |
| per_page | integer  | No       | `20` default (unless stated), max varies     | Pagination (where supported) |

> Tip: prefer `utc=1` in examples for consistent timestamps across time zones.
