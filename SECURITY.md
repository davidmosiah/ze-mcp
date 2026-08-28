# Security Policy

## Reporting

Report vulnerabilities privately. Never paste Zé Delivery tokens, addresses, phone numbers, or GPS polylines in public issues.

## Data this server may touch

- Personal Zé access token in `ZE_ACCESS_TOKEN` or `~/.ze-mcp/tokens.json` (0600).
- Catalog, search, order history and active-order status from the unofficial GraphQL.

## Fail-closed money rules

- Default is read-only. Placing an order does **not** run.
- `ze_place_order` and `ze_cancel_order` require **both** `ZE_ALLOW_MUTATIONS` enabled and `explicit_user_intent`.
- Guest tokens cannot place, cancel, or charge.
- Logout requires `explicit_user_intent` only.
- Default privacy mode redacts street, phone, email, lat/lng and polylines.

## Local hardening

- Store tokens on a trusted machine only, outside iCloud/Dropbox.
- Do not put `ZE_ACCESS_TOKEN` in a committed MCP config; prefer `ze-mcp-unofficial auth --token`.
- Keep `ZE_ALLOW_MUTATIONS` unset unless you intentionally want an agent to be able to charge you.
- The npm tarball does not include `~/.ze-mcp`, `.env`, or live credentials.

## Optional HTTP

`--http` listens on `127.0.0.1` by default. Requests with an `Origin` header must match `ZE_MCP_ALLOWED_ORIGIN` or `http://127.0.0.1:<port>`. Binding a non-loopback host is an operator choice; Origin checks are DNS-rebinding mitigation, not a remote multi-tenant product.

The HTTP client only calls the allowlisted unofficial GraphQL path (`/public-api`). Arbitrary URLs are rejected in-process.

## Unofficial surface

Zé Delivery does not publish a personal consumer API. This package talks to the same undocumented GraphQL (`api.ze.delivery/public-api` by default). It can change without notice.
