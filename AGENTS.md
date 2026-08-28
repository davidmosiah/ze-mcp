# Agent notes

Unofficial local-first Zé Delivery MCP. Personal drinks delivery for David / Life / Grok Bot.

## Commands

- `npm ci`
- `npm test` (typecheck, build, smoke, mutation gate, redaction, handlers, secret-scan)
- `npx ze-mcp-unofficial doctor`

## Rules

- Never commit tokens or `~/.ze-mcp/`.
- Never enable `ZE_ALLOW_MUTATIONS` in default examples.
- `ze_place_order` must stay fail-closed in tests without both gates.
- Do not add this connector to the Delx Wellness registry (commerce, not wellness).
- Live Zé login is not required for CI.
- Ship only GraphQL operations that live-probe as JSON 200/400/401. `pocSearch` is gone.
