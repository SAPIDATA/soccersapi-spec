# Errors and Request Limits

## Common HTTP errors

- **400 Bad Request** — invalid `t` value, invalid parameter value or a missing
  operation-specific parameter, for example a date not in `YYYY-MM-DD`, a
  non-numeric `id` or a search term under 3 characters.
- **401 Unauthorized** — missing or invalid `user`/`token`.
- **403 Forbidden** — the league is outside the account plan (`meta.msg` =
  `League not available for your plan.`), the operation is not in the plan
  (`Endpoint not available for your plan.`) or a requested include is not in
  the plan (`Include not available for your plan.`); see
  [Plans and Data Access](./10-plans-and-access.md).
- **404 Not Found** — endpoint or resource does not exist; check the route and
  resource ID.
- **429 Too Many Requests** — request limit exceeded.
- **5xx** — temporary upstream or internal error.

## Error bodies

The body shape depends on where the request failed:

| Status | Body | Example |
| --- | --- | --- |
| 401 | `{"ok": false, "message": "…"}` | `{"ok":false,"message":"User or token incorrect!"}` |
| 400 | Normal envelope with an empty `data` and the reason in `meta.msg` | `{"data":[],"meta":{"…":"…","msg":"Invalid 't' parameter value"}}` |
| 403 | Normal envelope with an empty `data` and the reason in `meta.msg` | `{"data":[],"meta":{"…":"…","msg":"League not available for your plan."}}` |
| 404 (unknown resource) | Normal envelope with an empty `data` object and `meta.msg` | `{"data":{},"meta":{"…":"…","msg":"League not found"}}` |
| 404 (unknown route) | `{"msg": "Endpoint not found"}` | |

Do not infer success from a JSON body alone; always check the HTTP status, then
inspect `meta.msg`. A `200` with an empty `data` array is a valid empty result,
not an error.

### Backoff guidance
On **429** or a retryable **5xx**, use exponential backoff with jitter (for
example 1s, 2s, 4s, 8s). Respect `Retry-After` when the response provides it.
Do not retry 400, 401, 403 or 404 responses without changing the request.

Successful responses include `meta.requests_left`; monitor it and reduce polling
before the limit is exhausted. Adding `include=events` to an existing livescores
call avoids a separate event request.
