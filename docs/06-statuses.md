# Statuses

`status` is the numeric code and `status_name` its label as returned by the
API. `status_period` carries `1st Half` or `2nd Half` while the match is in
play and is empty otherwise. Codes marked verified were observed in live feeds
on 2026-09-04; the others come from the provider's status list.

| Status | `status_name` | Description | Verified |
| ---: | --- | --- | --- |
| 0 | Notstarted | The match has not started. | yes |
| 1 | Inplay | The match clock is running; `status_period` tells the half. | yes |
| 2 | Update Later | The provider has not finalized the match state/data yet. Do not treat this as not started or finished. | |
| 3 | Finished | The match finished in regular time. | yes |
| 4 | Postponed | The match did not start at the scheduled time and is awaiting/rescheduled for another date. | yes |
| 5 | Canceled | The match was cancelled and is terminal. | yes |
| 6 | Abandoned | Play started but the match was abandoned. The displayed score is not necessarily a final result. | |
| 7 | Interrupted | Play is temporarily interrupted and may resume. | |
| 8 | Suspended | Play is suspended; resumption or an administrative decision is pending. | |
| 9 | Awarded | The result was awarded administratively. | |
| 10 | Delayed | Kickoff is delayed. | |
| 11 | Half Time | The match is at the half-time interval; `status_period` is `1st Half`. | yes |
| 12 | Extra Time | Extra time is in play. | |
| 13 | Penalty Shootout | A penalty shootout is in play. | |
| 14 | Break Time | Interval before extra time, between extra-time periods or before penalties. | |
| 15 | Awarding | An administrative awarding decision is in progress; it is not yet a final awarded result. | |
| 17 | To Be Announced | The schedule or match state is not confirmed. | |
| 18 | Pending update | A provider update is pending. Do not infer a regular match state. | yes |
| 31 | Finished with pen. | The match finished after a penalty shootout. | yes |
| 32 | After Extra Time | The match finished after extra time. | |

Status codes describe the match lifecycle, not items in the `events` timeline.
Keep unknown future codes visible as an unknown state instead of coercing them
to `0` (not started) or `3` (finished).
