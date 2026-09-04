# Statuses

| Status | Name | Description |
| ---: | --- | --- |
| 0 | Not Started | The match has not started. |
| 1 | In Play | The match clock is running. |
| 2 | Update Later | The provider has not finalized the match state/data yet. Do not treat this as not started or finished. |
| 3 | Finished | The match finished in regular time. |
| 4 | Postponed | The match did not start at the scheduled time and is awaiting/rescheduled for another date. |
| 5 | Cancelled | The match was cancelled and is terminal. |
| 6 | Abandoned | Play started but the match was abandoned. The displayed score is not necessarily a final result. |
| 7 | Interrupted | Play is temporarily interrupted and may resume. |
| 8 | Suspended | Play is suspended; resumption or an administrative decision is pending. |
| 9 | Awarded | The result was awarded administratively. |
| 10 | Delayed | Kickoff is delayed. |
| 11 | Half Time | The match is at the half-time interval. |
| 12 | Extra Time | Extra time is in play. |
| 13 | Penalty Shootout | A penalty shootout is in play. |
| 14 | Break Time | Interval before extra time, between extra-time periods or before penalties. |
| 15 | Awarding | An administrative awarding decision is in progress; it is not yet a final awarded result. |
| 17 | To Be Announced | The schedule or match state is not confirmed. |
| 18 | Pending Update | A provider update is pending. Do not infer a regular match state. |
| 31 | After Penalties | The match finished after a penalty shootout. |
| 32 | After Extra Time | The match finished after extra time. |

Status codes describe the match lifecycle, not items in the `events` timeline.
Keep unknown future codes visible as an unknown state instead of coercing them
to `0` (not started) or `3` (finished).
