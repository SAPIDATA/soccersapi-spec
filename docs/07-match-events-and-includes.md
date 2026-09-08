# Match Events and Dataset Includes

SoccersAPI can embed a match timeline in the livescores or fixtures response.
This avoids a separate event request when the client already polls a match feed.

## `events` vs `match_events`

These names serve different purposes and are not interchangeable:

| Context | Correct value | Result |
| --- | --- | --- |
| `include` dataset | `events` | Adds an `events` array to every returned match. |
| Standalone fixture operation | `t=match_events` | Returns only the event array for one match ID. |

`include=match_events` is not valid. Unsupported include values can be ignored,
so the request may succeed without adding an events array.

## Supported match operations

Use `include=events` or `include=events,stats` with operations that return match
objects:

| Endpoint | Operation | Example |
| --- | --- | --- |
| `/v2.2/livescores/` | `t=live` | Live matches and their events. |
| `/v2.2/livescores/` | `t=today`, `tomorrow`, `yesterday`, `notstarted` or `ended` | Day/status feed; event arrays can be empty when no events exist. |
| `/v2.2/fixtures/` | `t=schedule` | Date-based fixture list. |
| `/v2.2/fixtures/` | `t=season` or `t=round` | Season or round fixture list. |
| `/v2.2/fixtures/` | `t=info` | One match by `id`. |
| `/v2.2/fixtures/` | `t=sort` | Multiple matches by comma-separated `ids`. |

The v2.2 match-detail operation is `/v2.2/fixtures/?t=info&id=...`.
`t=match_by_id` is not valid, and `/v2.2/matches/` is not a v2.2 endpoint.

## Request examples

Live scores with event timelines:

```bash
curl -G "https://api.soccersapi.com/v2.2/livescores/" \
  --data-urlencode "user={{USERNAME}}" \
  --data-urlencode "token={{TOKEN}}" \
  --data-urlencode "t=live" \
  --data-urlencode "include=events"
```

One match with events and team statistics:

```bash
curl -G "https://api.soccersapi.com/v2.2/fixtures/" \
  --data-urlencode "user={{USERNAME}}" \
  --data-urlencode "token={{TOKEN}}" \
  --data-urlencode "t=info" \
  --data-urlencode "id=2589310" \
  --data-urlencode "include=events,stats"
```

Standalone event timeline:

```bash
curl -G "https://api.soccersapi.com/v2.2/fixtures/" \
  --data-urlencode "user={{USERNAME}}" \
  --data-urlencode "token={{TOKEN}}" \
  --data-urlencode "t=match_events" \
  --data-urlencode "id=2589310"
```

Do not put spaces in a comma-separated `include` value.

Other datasets can be embedded the same way. On fixture operations `broadcast`
adds the TV channels showing each match; on livescores and fixtures
`odds_prematch` and `odds_inplay` add odds by market and bookmaker where the
plan and coverage provide them. Livescores feeds do not support `broadcast`.

## Included response

With `include=events`, each match has an `events` array:

```json
{
  "data": [
    {
      "id": 2589310,
      "status": 1,
      "status_name": "Inplay",
      "events": [
        {
          "team_id": 20,
          "type": "goal",
          "period": "1st half",
          "player_id": 311,
          "player_name": "Scorer Name",
          "related_player_id": 99608,
          "related_player_name": "Assist Provider",
          "minute": "14",
          "extra_minute": null,
          "timestamp": null,
          "reason": null,
          "injuried": null,
          "own_goal": false,
          "penalty": false,
          "result": null,
          "info": "Assist by: Assist Provider"
        }
      ]
    }
  ],
  "meta": {
    "requests_left": 12345,
    "count": 1,
    "total": 1,
    "msg": ""
  }
}
```

For a goal:

- `player_id` and `player_name` identify the scorer.
- `related_player_id` and `related_player_name` identify the assist provider
  when the source supplies an assist.
- Any attribution field can be `null`. A name can be present while its ID is
  still unavailable.
- `own_goal` and `penalty` distinguish common goal variants.
- `minute` and `extra_minute` describe match-clock time. `timestamp` is higher
  precision when supplied and can otherwise be `null`.
- IDs can be JSON numbers or numeric strings depending on the operation. Treat
  them as opaque identifiers and normalize before strict comparisons.

Event availability varies by match and competition. An empty `events` array is
valid and does not by itself indicate an API error.

## Live timing and polling

The score and the attributed event are separate live updates. A score can
therefore change before the goal event, scorer name or assist is available.
SoccersAPI does not guarantee a fixed maximum attribution delay because the
source publication time varies by competition and event.

Recommended behavior:

1. Add `include=events` to the livescores call already used by the client.
2. Continue the normal live polling cadence; do not add a second immediate
   event request after every score change.
3. If the goal event or attribution is incomplete, check it again on the next
   scheduled livescores poll.
4. Accept corrections and backfills to existing events during and shortly after
   the match.

The included timeline is delivered in the same HTTP/API request. It does not
require the separate `t=match_events` call, although plan access and match
coverage still apply.
