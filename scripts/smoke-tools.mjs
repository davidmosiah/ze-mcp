import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const expected = [
  "ze_apply_coupon",
  "ze_bulk_add_to_cart",
  "ze_cancel_order",
  "ze_capabilities",
  "ze_checkout_preview",
  "ze_clear_cart_items",
  "ze_complete_checkout",
  "ze_connection_status",
  "ze_get_cart",
  "ze_list_categories",
  "ze_list_groups",
  "ze_list_payment_methods",
  "ze_load_category",
  "ze_load_checkout",
  "ze_logout",
  "ze_order_history",
  "ze_place_order",
  "ze_privacy_audit",
  "ze_product_detail",
  "ze_rate_order",
  "ze_search",
  "ze_track_order"
];

const homeDir = mkdtempSync(join(tmpdir(), "ze-mcp-smoke-"));
const env = { ...process.env, HOME: homeDir };
delete env.ZE_ACCESS_TOKEN;
delete env.ZE_ALLOW_MUTATIONS;
delete env.ZE_TOKEN_PATH;

const client = new Client({ name: "ze-mcp-smoke", version: "0.0.0" });
const transport = new StdioClientTransport({
  command: "node",
  args: ["dist/index.js"],
  env
});
await client.connect(transport);
try {
  const tools = await client.listTools();
  const names = tools.tools.map((t) => t.name).sort();
  assert.deepEqual(names, expected.sort());

  const place = await client.callTool({
    name: "ze_place_order",
    arguments: { response_format: "json" }
  });
  const text = JSON.stringify(place.structuredContent ?? {}) + (place.content?.map((c) => c.text || "").join("") || "");
  assert.match(text, /USER_ACTION_REQUIRED|ZE_ALLOW_MUTATIONS|explicit_user_intent/i);
  assert.equal(place.isError, true);

  const status = await client.callTool({
    name: "ze_connection_status",
    arguments: { response_format: "json" }
  });
  assert.equal(status.structuredContent?.unofficial, true);
  assert.equal(status.structuredContent?.mutations_enabled, false);
  assert.equal(status.structuredContent?.never_pays_by_default, true);

  console.log(JSON.stringify({ ok: true, tools: names.length, gated_place_order: true }, null, 2));
} finally {
  await client.close();
}
