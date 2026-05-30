# [v2.2] Release notes

> Use the examples in the notes to test endpoints directly.
> Use the &include= parameter to embed related datasets in one call (for example &include=match_events,match_stats) and reduce round trips.
>Use the &utc= parameter to get date/time values in your preferred timezone (for example &utc=4 or &utc=4.5).

## 🛡️ API Token Usage (2025-11-04)
- **API Token usage tracking** — monitor token consumption, see usage by endpoint, and review historical trends.
- **Token dashboard** — quick overview of all tokens and their activity.
- **Usage insights** — identify high-traffic endpoints and optimize token allocation.

---

## 🚀 Highlights (quick glance)
- **Media / highlights** endpoints (beta) — fetch highlights by league, team, event, date.  
- **Standings Live** endpoint — live/rolling standings while matches are in progress.  
- **Broadcast / TV** improvements — TV-by-country, TV-by-match, fixtures-by-TV-channel.  
- **Odds enhancements** — new bookmaker (Betika), per-bookmaker match odds endpoint and custom sort.  
- **Includes** support: include `match_events` and `match_stats` inline in many endpoints.  
- **Language additions** and **default images** for missing entities.  
- **Historical data** extended (up to 10 years).

---

## 📺 Broadcast & TV (new & improved)
**What’s included**
- `TV Channels by Country` (`#tv_channels_country`)  
- `All TV Channels` (`#tv_channels_all`)  
- `TV Channel by ID` (`#tv_info`)  
- Improved `TV Channels by Match` coverage (`#match_tv`)  
- `Fixtures by TV Channel` (2-week forecast) (`#fixtures_tv_channel`)  
- `TV Schedule by Date` (Broadcast section)  

**Commentary**  
Use these endpoints for “Where to watch” features. You can filter broadcasts per country to show local channels only.

**Example**
```txt
GET /v2.2/broadcast/?user=USER&token=TOKEN&t=match_tvs&id=1910954&country_broadcast_id=5
```

---

## 🎞️ Media (beta)
**What’s included**
- Media / highlights endpoint in beta. Query by: `event`, `league`, `season`, `team`, `round`, `date` (use `type=date&d=YYYY-MM-DD`).

**Example**
```txt
GET /v2.2/media/?user=USER&token=TOKEN&t=league&id=637
```

**Commentary**  
Good for editorial UIs, highlight carousels and social previews. Beta feature — expect small improvements.

---

## 📊 Standings & Live Standings
**What’s included**
- New endpoint: **Standings Live** (`#standings_live`) — rolling/temporary standings while matches are being played.  
- `number_standings` added to support competitions with multiple tables (e.g., split groups).

**Commentary**  
Use for live leaderboard views and competition pages that need in-play table updates.

---

## ⚽ Matches, Fixtures & Includes
**New & improved**
- `related_id` parameter in fixtures: track postponed / rescheduled / related events.  
- `info` dataset added to today’s fixtures (federation decisions, special notes).  
- **Includes** support across many endpoints — you can now request `&include=match_events,match_stats` inline in:  
  - `Livescores`, `Fixtures`, `MatchByID`, `MatchByMultipleID`  
- `timestamp` added to today’s match events for more precise timing.  
- `aggregate_id` and `country_code` added in fixtures and MatchByID endpoints.

**Usage tip**
```txt
GET /v2.2/fixtures/?user=USER&token=TOKEN&t=match_by_id&id=XXXX&include=match_events,match_stats
```

**Commentary**  
`&include=` reduces roundtrips and gives richer payloads in a single call.

---

## 🧾 Players / Teams / Lineups
**Added**
- `team_id` and `national_team_id` on player object.  
- `position_name` in lineups (e.g., left winger, right winger).  
- `market_value` in player info.  
- Player seasons & roles in Player by ID.  
- Team seasons and extended `leagues` array in Team by ID.  
- Basic player stats included in Match Lineups endpoint (default: formation without per-player stats; add `&include=stats` for full stats).

**Commentary**  
Easier to render detailed player/team pages without additional joins. For performance, lineups omit heavy per-player stats by default.

---

## 🏟️ Venues / Coaches / Catalog
**New endpoints**
- `Coaches by Country`, `All Coaches`  
- `Venues by Country`, `All Venues`  
- `All Continents`, `Continent by ID`

**Images & logos**
- Logos added for 800+ leagues.  
- Venue images now in PNG and available in sizes: **100**, **80**, **50**, **18** px.

**Commentary**  
Useful for directory pages and localized UI elements.

---

## 🔎 Search & H2H
**Added**
- `search_all` improvements: you can now search **matches** and **TV channels**.  
- H2H endpoints: `H2H Team vs Team` and `Match H2H`.

**Commentary**  
Power autocompletes and quick lookup features with the search endpoints.

---

## 🧩 Odds & Bookmakers
**Added / Improved**
- New bookmaker: **Betika** (`#match_odds`).  
- Bookmakers custom sort (control ordering returned).  
- New endpoint: `Match Odds by Bookmaker`.  
- Markets: 1X2 (primary), Asian Handicap (AH), Over/Under (Goal Line).

**Commentary**  
Odds coverage varies by match/popularity. Use `match_odds` endpoints and custom sort to prioritize affiliate/bookmaker display order.

---

## 🌐 Languages & Localization
**Added languages**
- Korean (`ko`)  
- Chinese simplified (`zh_cn`) and Chinese (`zh`)  
- Portuguese (`pt`)  
- Turkish (`tr`)  
- Polish (`pl`)  
- French (`fr`)  
**Beta:** Arabic, Greek, Italian

**Usage**
```txt
...&lang=ko
```

**Commentary**  
Pass `&lang=` to localize names and descriptions in responses.

---

## 🖼️ UX / Images / Defaults
**Added**
- Default images for missing leagues, teams and players (prevent broken UIs).  
- Team kit colors on fixtures endpoints.  
- TV channel images in four sizes (100, 80, 50, 18).

**Commentary**  
Better visual fallback handling and consistent front-end rendering.

---

## 🔧 Improvements / Changes / Fixes
**Performance / API behavior**
- Match lineups now return formation without per-player stats by default to avoid latency. Add `&include=stats` when you need full player stats.  
- `Fixtures` endpoints datetime values normalized to **UTC**.  
- `Standings` improvements: `number_standings` for competitions with multiple standing groups (e.g., Indian I-League).  
- `Fixtures` got `info` dataset — federation decisions and special flags included.

**Other fixes**
- `Season Stats > goal_line` recalculated/fixed.  
- Historical data extended to **10 years**.  
- `timestamp` parameter added in match events for today (higher precision).  
- `Attendance` field added.  
- `Aggregate_id` in fixtures and MatchByID endpoints.

---

## ➕ New Endpoints (summary)
- `Standings Live` (`#standings_live`)  
- `Media` (highlights) (beta)  
- `TV Channels by Country`, `All TV Channels`, `TV Channel by ID`  
- `Fixtures Next & Last`  
- `Match Sidelined`  
- `Match by Multiple IDs` (includes support)  
- `Player Stats by Match ID` (`#player_stats_match`)  
- `Cup Draw (Tournament Bracket)` (`#cup_draw`)  
- `Fixtures by TV Channel` (2 weeks forecast)  
- `Match Odds by Bookmaker`  
- `Teams National`  
- `Team Transfers`  
- `Team Trophies`  
- `Search by Keyword`  
- `Stages by Season`, `Stage by ID`, `Group by ID`  
- `Venues by Country`, `All Venues`  
- `Coaches by Country`, `All Coaches`

---

## 🧾 Coverage & Data
- **Historical data**: up to **10 years** available where applicable.  
- **Logos**: +800 leagues now have logos.  
- **Fixtures**: `country_code` & `aggregate_id` for improved grouping and filtering.

---

## ✅ Migration tips & examples
- If you use **match lineups** and previously relied on per-player stats, add `&include=stats` to your request now:
```txt
GET /v2.2/fixtures/?user=USER&token=TOKEN&t=match_lineups&id=1234&include=stats
```
- To fetch **live standings**:
```txt
GET /v2.2/leagues/?user=USER&token=TOKEN&t=standings_live&season_id=SEASON_ID
```
- To request **media highlights** (beta):
```txt
GET /v2.2/media/?user=USER&token=TOKEN&t=league&id=637
```
- To get richer match payloads in one call:
```txt
GET /v2.2/fixtures/?user=USER&token=TOKEN&t=match_by_id&id=XXXX&include=match_events,match_stats
```

---

## 📣 Final notes & recommendations
- Use `&utc=` for timezone-correct responses where useful (e.g., `&utc=4` or `&utc=4.5`).  
- Use `&include=` to avoid multiple roundtrips (match events / match stats / lineups).  
- For heavy live polling (odds/last-minute updates), ensure your plan supports the required requests/hour.  
- Media endpoints are **beta** — expect iterative improvements.

---
