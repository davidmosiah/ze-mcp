# Grok Bot / local agent stdio

Read-only. Do **not** set `ZE_ALLOW_MUTATIONS` in the Bot environment.

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

Personal token stays in `~/.ze-mcp/tokens.json` on the machine that runs the Bot VM, or as `ZE_ACCESS_TOKEN` in Runtime Secrets — never in the prompt, Drive, or git.

Place-order remains listed but returns `USER_ACTION_REQUIRED` until both gates are on **and** the user set `explicit_user_intent`.

Recipe — “Zé — só listar, nunca fechar”: `ze_connection_status` → `ze_list_categories` / `ze_search`. Stop. Do not call `ze_place_order` or `ze_complete_checkout`.

Skill path (no MCP client): copy `skill/SKILL.md` into the Bot skills dir and use `ze-mcp-unofficial call …`. Same gates. Do not set mutation flags in the Bot environment.
