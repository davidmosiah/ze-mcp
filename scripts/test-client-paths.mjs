import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MUTATIONS, QUERIES, ZeClient } from "../dist/services/ze-client.js";
import { PATHS as CONST_PATHS } from "../dist/constants.js";
import { peekConfig } from "../dist/services/config.js";
import { TokenStore } from "../dist/services/token-store.js";
const home = mkdtempSync(join(tmpdir(), "ze-client-paths-"));
const tokenPath = join(home, ".ze-mcp", "tokens.json");
mkdirSync(join(home, ".ze-mcp"), { recursive: true, mode: 0o700 });
writeFileSync(tokenPath, JSON.stringify({ access_token: "fixture-token", source: "user" }), { mode: 0o600 });
process.env.HOME = home;
process.env.ZE_TOKEN_PATH = tokenPath;
process.env.ZE_DEVICE_ID = "11111111-1111-1111-1111-111111111111";
delete process.env.ZE_ACCESS_TOKEN;
delete process.env.ZE_ALLOW_MUTATIONS;

const captured = [];

function headerMap(headers) {
  if (!headers) return {};
  if (typeof headers.forEach === "function") {
    const out = {};
    headers.forEach((value, key) => {
      out[String(key).toLowerCase()] = String(value);
    });
    return out;
  }
  return Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), String(v)]));
}

const fetchImpl = async (url, init = {}) => {
  captured.push({
    url: String(url),
    method: String(init.method || "GET").toUpperCase(),
    headers: headerMap(init.headers),
    body: String(init.body || "")
  });
  return new Response(JSON.stringify({ data: { ok: true } }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
};

const config = peekConfig(process.env, home);
const tokens = new TokenStore(tokenPath);
const client = new ZeClient(config, tokens, fetchImpl);

await client.listCategories();
await client.listGroups();
await client.search("heineken");
await client.orderHistory();
await client.trackOrder("order-1");
await client.placeOrder({ items: [] });
await client.cancelOrder("order-1");

for (const row of captured) {
  assert.equal(row.method, "POST");
  assert.equal(row.url, `${config.apiBase}${CONST_PATHS.graphql}`);
  assert.match(row.headers["x-visitorid"] || "", /11111111/);
  assert.equal(row.headers.origin, "https://www.ze.delivery");
  assert.doesNotMatch(row.url, /pocSearch/);
  assert.doesNotMatch(row.body, /pocSearch/);
}

const bodies = captured.map((row) => row.body);
assert.ok(bodies.some((b) => b.includes("listCategories")));
assert.ok(bodies.some((b) => b.includes("listRootProductGroups")));
assert.ok(bodies.some((b) => b.includes("searchProducts")));
assert.ok(bodies.some((b) => b.includes("listOrders")));
assert.ok(bodies.some((b) => b.includes("loadOrder")));
assert.ok(bodies.some((b) => b.includes("createOrder")));
assert.ok(bodies.some((b) => b.includes("cancelOrder")));
assert.equal(QUERIES.categories.includes("listCategories"), true);
assert.equal(MUTATIONS.place.includes("createOrder"), true);

console.log(
  JSON.stringify(
    {
      ok: true,
      suite: "client-paths",
      graphql: CONST_PATHS.graphql,
      captured: captured.map((row) => `${row.method} ${row.url.replace(config.apiBase, "")}`)
    },
    null,
    2
  )
);
