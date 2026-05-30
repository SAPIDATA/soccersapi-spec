## Common Errors
- **401 Unauthorized** — invalid `user`/`token`
- **403 Forbidden** — not included in your plan
- **404 Not Found** — resource does not exist (check IDs / season)
- **422 Unprocessable** — invalid parameter value
- **429 Too Many Requests** — rate limit exceeded
- **5xx** — upstream or internal error

### Backoff guidance
On **429**, retry with exponential backoff: 1s → 2s → 4s → 8s.
