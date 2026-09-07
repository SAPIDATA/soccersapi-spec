# The Match Object

Livescores, fixture lists, `fixtures?t=info` and `broadcast?t=schedule` all
return the same match object. This page walks through a real one, a finished
Premier League match, field by field. Datasets requested with `include` are
appended to it.

```json
{
  "id": 2589310,
  "status": 3,
  "status_name": "Finished",
  "status_period": null,
  "round_id": "216028",  "round_name": "2",
  "season_id": "21033",  "season_name": "26/27",
  "stage_id": "3461",    "stage_name": "Regular Season - Premier League 26/27",
  "group_id": "13583",   "group_name": "Premier League 26/27",
  "week": "35",
  "leg": null,
  "aggregate_id": null,
  "related_id": null,
  "winner_team_id": 20,
  "venue_id": "1166",
  "referee_id": null,
  "pitch": null,
  "attendance": null,
  "deleted": "0",
  "info": null,
  "time": {
    "datetime": "2026-08-30 13:00:00", "date": "2026-08-30", "time": "13:00:00",
    "minute": 90, "timestamp": 1788094800, "timezone": "UTC"
  },
  "teams": {
    "home": {
      "id": 20, "name": "Chelsea FC", "short_code": "CFC",
      "img": "https://cdn.soccersapi.com/images/soccer/teams/80/20.png",
      "form": null, "coach_id": 12680,
      "kit_colors": { "home_main_color": "#1532c1", "home_second_color": "#1532c1", "home_number_color": "#f7d444",
                      "home_gk_main_color": "#1d5160", "home_gk_second_color": "#121212", "home_gk_number_color": "#fcfcfc" }
    },
    "away": { "id": 12, "name": "Brighton & Hove Albion", "short_code": "BRI", "img": "…/teams/80/12.png", "form": null, "coach_id": 9291, "kit_colors": { "away_main_color": "#ffffff", "…": "…" } }
  },
  "league": {
    "id": 583, "name": "Premier League", "type": "Premier League 26/27",
    "country_id": "3", "country_name": "England", "country_code": "en",
    "country_flag": "https://cdn.soccersapi.com/images/countries/30/en.png"
  },
  "scores": { "home_score": "4", "away_score": "3", "ht_score": "3-1", "ft_score": "4-3", "et_score": null, "ps_score": null },
  "standings": { "home_position": 8, "away_position": 5 },
  "assistants": { "first_assistant_id": null, "second_assistant_id": null, "fourth_assistant_id": null },
  "coverage": { "has_lineups": 1, "has_tvs": 1, "has_standings": 1 },
  "weather_report": { "desc": "cloudy", "temp": { "celsius": 21.2, "fahrenheit": 70.2 }, "wind": { "kmph": 13.7, "miles": 8.51, "direction": "SW" }, "humidity_percent": 56, "pressure": 1009 }
}
```

## State

| Field | Meaning |
| --- | --- |
| `status`, `status_name` | Lifecycle code and label; see [Statuses](./08-statuses.md). Drive the UI from the code, never from the scores. |
| `status_period` | `1st Half` or `2nd Half` while in play, otherwise `null`. |
| `time.minute` | Match clock while in play, `null` before and after. |
| `winner_team_id` | Set once the match is decided, `null` for draws and unfinished matches. |
| `deleted` | `"1"` when the match was removed from the schedule; drop it from your lists. |
| `info` | Free text with federation decisions or special notes when the source provides them. |

## Placement in the competition

`league`, `season_id`, `stage_id`, `group_id` and `round_id` place the match
in the competition tree, each with its display name next to it. `week` is the
match week; `leg` is `"1"` or `"2"` in two-legged ties and `aggregate_id`
links both legs so you can show the aggregate. `related_id` points to the
match this one replaces or continues, for postponed and rescheduled games.

## Scores

`home_score` and `away_score` are the current score, updated live. The period
scores are strings in `home-away` form and are filled as the match progresses:
`ht_score` at half time, `ft_score` after 90 minutes, `et_score` after extra
time and `ps_score` after a penalty shootout. For a finished match, the final
result is `ps_score` when present, otherwise `et_score`, otherwise `ft_score`;
`status` `31` and `32` tell you which one applies.

## Teams

Each side carries its identity, logo, `coach_id`, recent `form` where
available and the colours of the kit it wears in this match: `home_*` keys on
the home side and `away_*` keys on the away side, with main, secondary and
number colours for outfield players and goalkeeper. `standings.home_position`
and `away_position` are the current table positions.

## Coverage and context

`coverage` says which datasets exist for the match: use `has_lineups` before
offering lineups, `has_tvs` before a "where to watch" block and `has_standings`
before linking the table. `venue_id` and `referee_id` link to the venue and
referee profiles when known. `weather_report` and `attendance` are present
when the source supplies them.

## Included datasets

Requested with `include`, appended as top-level arrays:

| Key | Include value | Content |
| --- | --- | --- |
| `events` | `events` | Timeline of goals, cards, substitutions, corners and shots; see [Match Events](./09-match-events-and-includes.md). |
| `stats` | `stats` | One entry per team with possession, shots, passes, fouls, cards and more. |
| `broadcast` | `broadcast` | TV channels showing the match, each with its country. |
| `tvs` | `tvs` | Same content on `broadcast?t=schedule`. |
| `odds_prematch` | `odds_prematch` | Pre-match markets with the odds of every bookmaker. |
| `odds_inplay` | `odds_inplay` | In-play markets, each price tagged with the score and minute it refers to. |

An included key can be an empty array or `null` when the dataset is not
covered for the match; the request still succeeds.
