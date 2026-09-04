# Errors and Request Limits

## Common HTTP errors

- **400 Bad Request** — invalid `t` value, invalid parameter value or a missing
  operation-specific parameter.
- **401 Unauthorized** — missing or invalid `user`/`token`.
- **403 Forbidden** — the requested league or dataset is not included in the
  account plan.
- **404 Not Found** — endpoint or resource does not exist; check the route and
  resource ID.
- **429 Too Many Requests** — request limit exceeded.
- **5xx** — temporary upstream or internal error.

Error bodies can contain `msg` directly or under `meta.msg`. Do not infer success
from a JSON body alone; always check the HTTP status, then inspect `meta.msg`.

### Backoff guidance
On **429** or a retryable **5xx**, use exponential backoff with jitter (for
example 1s, 2s, 4s, 8s). Respect `Retry-After` when the response provides it.
Do not retry 400, 401, 403 or 404 responses without changing the request.

Successful responses include `meta.requests_left`; monitor it and reduce polling
before the limit is exhausted. Adding `include=events` to an existing livescores
call avoids a separate event request.
