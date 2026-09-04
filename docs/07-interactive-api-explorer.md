# Interactive API Explorer

The reference lets you send real requests to the API from the browser. Every
call goes straight to `api.soccersapi.com` with your own credentials, so the
responses are exactly what your application will receive.

## 1. Enter your credentials once

Open **Authentication** at the top of the reference and fill in `user` and
`token`. The values are stored in your browser's local storage and reused by
every request until you clear them; they are never sent anywhere except the
API. Use a development token from
[admin.soccersapi.com/api-tokens](https://admin.soccersapi.com/api-tokens).

## 2. Pick the route and the operation

Choose a route in the sidebar, for example **Fixtures**. Its operations table
lists every accepted `t` value with the required and optional parameters. In
the request panel select the `t` value and fill in the parameters that the
operation needs; parameters that do not apply to the selected operation are
ignored by the API.

## 3. Send the request

Press **Send**. The response panel shows the HTTP status, the response time and
the JSON body. The **Examples** selector in the response section shows a
captured response for each `t` value, so you can see the shape before calling.

## 4. Copy the request

The code snippet next to the request is generated for the language selected at
the top of the panel (curl, JavaScript, Python and others) and includes the
query parameters you filled in. Remove the credentials before sharing it.

## Notes

- The token travels in the query string, as the API requires, so it appears in
  browser history and server logs. Use a development token and rotate it if it
  leaks.
- Requests made from the explorer count against the request allowance of the
  account; `meta.requests_left` shows what is left.
- The explorer is a static page built from the OpenAPI contract with
  `npm run docs:build`; see the repository README to run it locally.
