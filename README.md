<h1 align="center">Zé Delivery MCP</h1>

<h3 align="center">
  Give your AI agent Zé catalog, product search and order tracking.<br>
  Local-first MCP &mdash; <strong>credentials never leave your machine</strong>.<br>
  Placing an order is <strong>fail-closed</strong> unless you opt in twice.
</h3>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/LICENSE-MIT-22C55E?style=for-the-badge&labelColor=0F172A" alt="License MIT" /></a>
  <a href="https://modelcontextprotocol.io"><img src="https://img.shields.io/badge/BUILT_FOR-MCP-7C3AED?style=for-the-badge&labelColor=0F172A" alt="Built for MCP" /></a>
</p>

> **Unofficial.** Not affiliated with, endorsed by, or supported by Zé Delivery or Ambev. The consumer GraphQL at `api.ze.delivery/public-api` can change without notice.

> **Never pays by default.** `ze_place_order` and `ze_cancel_order` do nothing unless `ZE_ALLOW_MUTATIONS` is enabled **and** `explicit_user_intent` is true. Guest tokens cannot charge. Street, phone, email and GPS/latlng polylines are redacted.

## Setup in 60 seconds

```bash
npx -y ze-mcp-unofficial setup
npx -y ze-mcp-unofficial auth --from-header "Bearer eyJ…"
npx -y ze-mcp-unofficial doctor
```

Token is **not** OAuth. Capture a consumer request to `api.ze.delivery` → copy the `Authorization` header. Catalog/search still run without a token; pay tools stay blocked.

Stdio snippet (Claude Desktop, Cursor, Grok Bot). Do **not** set mutations in the snippet:

```json
{
  "mcpServers": {
    "ze": {
      "command": "npx",
      "args": ["-y", "ze-mcp-unofficial"]
    }
  }
}
```

See [examples/claude-desktop.json](examples/claude-desktop.json) and [examples/grok-bot.md](examples/grok-bot.md).

## Skill or MCP

Same package, two doors. MCP registers tools on stdio/HTTP. The [skill](skill/SKILL.md) is the workflow (search → stop before order) and can drive the **same** tools through the CLI when the client has no MCP:

```bash
npx -y ze-mcp-unofficial call ze_search --json '{"query":"brahma"}'
```

Gates are identical. Copy `skill/SKILL.md` into your agent skills dir (`~/.agents/skills/ze/` or Claude/Grok equivalent).

## Tools

| Kind | Tools |
| --- | --- |
| Read · catalog | `ze_list_categories`, `ze_list_groups`, `ze_search`, `ze_load_category`, `ze_product_detail` |
| Read · cart / pay | `ze_get_cart`, `ze_list_payment_methods`, `ze_load_checkout`, `ze_checkout_preview` |
| Read · account | `ze_order_history`, `ze_track_order` |
| Meta | `ze_connection_status`, `ze_capabilities` (includes `honest_gaps`), `ze_privacy_audit` |
| Gated cart | `ze_bulk_add_to_cart` (also 18+), `ze_clear_cart_items`, `ze_apply_coupon` |
| Gated pay (mutations **and** intent) | `ze_place_order` (also 18+), `ze_complete_checkout` (also 18+), `ze_cancel_order` |
| Intent only | `ze_logout`, `ze_rate_order` |

## HTTP (optional, loopback)

Default transport is **stdio**. Streamable HTTP binds `127.0.0.1` and checks `Origin` against `http://127.0.0.1:<port>` (override with `ZE_MCP_ALLOWED_ORIGIN`). This is DNS-rebinding mitigation, not a public server.

```bash
npx -y ze-mcp-unofficial --http
# GET  http://127.0.0.1:3000/health
# POST http://127.0.0.1:3000/mcp
```

## Security

Tokens live in `~/.ze-mcp/tokens.json` (0600). They are not in git, the npm tarball, or default examples. Full notes: [SECURITY.md](SECURITY.md). Agents: [llms.txt](llms.txt).

## Tests

```bash
npm test
```

No live Zé login required.
