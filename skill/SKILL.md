---
name: ze
description: >
  Unofficial Zé Delivery (Brazil) for catalog, product search and order
  tracking. Use when the user wants Zé without opening the app. Prefer MCP
  tools if connected; otherwise the package CLI. Never pays unless both gates
  are already on and the user said to place this order.
---

# Zé Delivery — skill or MCP

Unofficial. Not a partner B2B API.

Same binary either way. Mutation gates live in the server, not in this file.

## Choose a surface

**MCP** — tools appear natively:

```json
{ "mcpServers": { "ze": { "command": "npx", "args": ["-y", "ze-mcp-unofficial"] } } }
```

Do not put mutation flags in that snippet.

**Skill / CLI** — no MCP client required:

```bash
npx -y ze-mcp-unofficial doctor --json
npx -y ze-mcp-unofficial call ze_capabilities --json '{}'
npx -y ze-mcp-unofficial call ze_search --json '{"query":"brahma"}'
```

If MCP tools named `ze_*` are already available, use them. Do not also shell out.

## Setup (once)

```bash
npx -y ze-mcp-unofficial setup
npx -y ze-mcp-unofficial auth --from-header "Bearer …"
```

Token is a captured `Authorization` from `api.ze.delivery`, stored at `~/.ze-mcp/tokens.json` (0600). Catalog/search work without a token; place-order stays blocked.

## Loop

1. `ze_connection_status` (or `doctor --json`). Expect `unofficial` and `never_pays_by_default`.
2. Categories / search / history as asked. Street, phone, GPS stay redacted. “Só listar” = `ze_list_categories` / `ze_search` then stop.
3. **Stop.** Do not call `ze_place_order`, `ze_complete_checkout` or `ze_cancel_order` unless the user clearly asked. Alcohol writes also need `confirmed_legal_age`. If the tool returns `USER_ACTION_REQUIRED`, report that and stop. Do not invent env flags.

## Never

- Enable mutations from this skill
- Paste tokens into git, chat logs, or the prompt
- Treat guest as able to pay
