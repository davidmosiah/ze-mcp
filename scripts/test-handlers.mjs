import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { TokenStore } from "../dist/services/token-store.js";
import { ZeClient } from "../dist/services/ze-client.js";
import { peekConfig } from "../dist/services/config.js";
import {
  handleApplyCoupon,
  handleBulkAddToCart,
  handleCancelOrder,
  handleCheckoutPreview,
  handleClearCartItems,
  handleCompleteCheckout,
  handleLogout,
  handlePlaceOrder
} from "../dist/services/handlers.js";

let fetches = 0;
const bodies = [];
const fetchImpl = async (_url, init = {}) => {
  fetches += 1;
  bodies.push(String(init.body || ""));
  return new Response(JSON.stringify({ ok: true, data: {} }), {
    status: 200,
    headers: { "content-type": "application/json" }
  });
};

const home = mkdtempSync(join(tmpdir(), "ze-handlers-"));
const tokenPath = join(home, ".ze-mcp", "tokens.json");
mkdirSync(join(home, ".ze-mcp"), { recursive: true, mode: 0o700 });
writeFileSync(tokenPath, JSON.stringify({ access_token: "fixture-token", source: "user" }), { mode: 0o600 });
process.env.HOME = home;
process.env.ZE_TOKEN_PATH = tokenPath;
delete process.env.ZE_ALLOW_MUTATIONS;
delete process.env.ZE_ACCESS_TOKEN;

const tokens = new TokenStore(tokenPath);
const config = peekConfig(process.env, home);
const client = new ZeClient(config, tokens, fetchImpl);

fetches = 0;
const deniedMutations = await handlePlaceOrder(
  { explicit_user_intent: true, response_format: "json" },
  { client, tokens, allowMutations: false, fetchImpl }
);
assert.equal(deniedMutations.isError, true);
assert.match(JSON.stringify(deniedMutations.structuredContent), /USER_ACTION_REQUIRED|ZE_ALLOW_MUTATIONS/);
assert.equal(fetches, 0, "place-order must not hit Zé when mutations are off");

fetches = 0;
const deniedIntent = await handlePlaceOrder(
  { explicit_user_intent: false, response_format: "json" },
  { client, tokens, allowMutations: true, fetchImpl }
);
assert.equal(deniedIntent.isError, true);
assert.match(JSON.stringify(deniedIntent.structuredContent), /explicit_user_intent/);
assert.equal(fetches, 0, "place-order must not hit Zé without explicit_user_intent");

const deniedLogout = await handleLogout({ response_format: "json" }, { tokens });
assert.equal(deniedLogout.isError, true);
assert.equal(existsSync(tokenPath), true, "token remains when logout is gated");

const guestPath = join(home, "guest.json");
writeFileSync(guestPath, JSON.stringify({ access_token: "g", source: "guest" }), { mode: 0o600 });
const guestTokens = new TokenStore(guestPath);
const guestClient = new ZeClient(config, guestTokens, fetchImpl);
fetches = 0;
const guestPay = await handlePlaceOrder(
  { explicit_user_intent: true, confirmed_legal_age: true, response_format: "json" },
  { client: guestClient, tokens: guestTokens, allowMutations: true, fetchImpl }
);
assert.equal(guestPay.isError, true);
assert.match(JSON.stringify(guestPay.structuredContent), /guest/i);
assert.equal(fetches, 0);

fetches = 0;
const deniedAge = await handlePlaceOrder(
  { explicit_user_intent: true, confirmed_legal_age: false, response_format: "json" },
  { client, tokens, allowMutations: true, fetchImpl }
);
assert.equal(deniedAge.isError, true);
assert.match(JSON.stringify(deniedAge.structuredContent), /legal|18/i);
assert.equal(fetches, 0);

fetches = 0;
const deniedBulk = await handleBulkAddToCart(
  { bulk_add_to_cart_input: { items: [] }, explicit_user_intent: true, confirmed_legal_age: true, response_format: "json" },
  { client, tokens, allowMutations: false, fetchImpl }
);
assert.equal(deniedBulk.isError, true);
assert.equal(fetches, 0);

fetches = 0;
const deniedCouponMutations = await handleApplyCoupon(
  { coupon_code: "PROBE", explicit_user_intent: true, response_format: "json" },
  { client, tokens, allowMutations: false, fetchImpl }
);
assert.equal(deniedCouponMutations.isError, true);
assert.match(JSON.stringify(deniedCouponMutations.structuredContent), /USER_ACTION_REQUIRED|ZE_ALLOW_MUTATIONS/);
assert.equal(fetches, 0, "applyCoupon must not hit Zé when mutations are off");

fetches = 0;
const deniedCouponIntent = await handleApplyCoupon(
  { coupon_code: "PROBE", explicit_user_intent: false, response_format: "json" },
  { client, tokens, allowMutations: true, fetchImpl }
);
assert.equal(deniedCouponIntent.isError, true);
assert.match(JSON.stringify(deniedCouponIntent.structuredContent), /explicit_user_intent/);
assert.equal(fetches, 0, "applyCoupon must not hit Zé without explicit_user_intent");

fetches = 0;
const deniedClearMutations = await handleClearCartItems(
  { explicit_user_intent: true, response_format: "json" },
  { client, tokens, allowMutations: false, fetchImpl }
);
assert.equal(deniedClearMutations.isError, true);
assert.match(JSON.stringify(deniedClearMutations.structuredContent), /USER_ACTION_REQUIRED|ZE_ALLOW_MUTATIONS/);
assert.equal(fetches, 0, "clearCartItems must not hit Zé when mutations are off");

fetches = 0;
const deniedClearIntent = await handleClearCartItems(
  { explicit_user_intent: false, response_format: "json" },
  { client, tokens, allowMutations: true, fetchImpl }
);
assert.equal(deniedClearIntent.isError, true);
assert.match(JSON.stringify(deniedClearIntent.structuredContent), /explicit_user_intent/);
assert.equal(fetches, 0, "clearCartItems must not hit Zé without explicit_user_intent");

fetches = 0;
const deniedCompleteMutations = await handleCompleteCheckout(
  { explicit_user_intent: true, confirmed_legal_age: true, response_format: "json" },
  { client, tokens, allowMutations: false, fetchImpl }
);
assert.equal(deniedCompleteMutations.isError, true);
assert.match(JSON.stringify(deniedCompleteMutations.structuredContent), /USER_ACTION_REQUIRED|ZE_ALLOW_MUTATIONS/);
assert.equal(fetches, 0, "completeCheckout must not hit Zé when mutations are off");

fetches = 0;
const deniedCompleteIntent = await handleCompleteCheckout(
  { explicit_user_intent: false, confirmed_legal_age: true, response_format: "json" },
  { client, tokens, allowMutations: true, fetchImpl }
);
assert.equal(deniedCompleteIntent.isError, true);
assert.match(JSON.stringify(deniedCompleteIntent.structuredContent), /explicit_user_intent/);
assert.equal(fetches, 0, "completeCheckout must not hit Zé without explicit_user_intent");

fetches = 0;
bodies.length = 0;
const preview = await handleCheckoutPreview({ response_format: "json" }, { client, tokens, fetchImpl });
assert.notEqual(preview.isError, true, "checkout preview is a query and must not fail-closed as a write");
assert.ok(fetches >= 1, "preview hits GraphQL");
assert.ok(bodies.length >= 1);
for (const body of bodies) {
  assert.match(body, /loadCheckout/);
  assert.doesNotMatch(body, /manageCheckout/);
  assert.doesNotMatch(body, /mutation\s*\{/i);
}

fetches = 0;
const deniedCancel = await handleCancelOrder(
  { order_id: "order-1", explicit_user_intent: true, response_format: "json" },
  { client, tokens, allowMutations: false, fetchImpl }
);
assert.equal(deniedCancel.isError, true);
assert.equal(fetches, 0);

fetches = 0;
const guestCancel = await handleCancelOrder(
  { order_id: "order-1", explicit_user_intent: true, response_format: "json" },
  { client: guestClient, tokens: guestTokens, allowMutations: true, fetchImpl }
);
assert.equal(guestCancel.isError, true);
assert.match(JSON.stringify(guestCancel.structuredContent), /guest/i);
assert.equal(fetches, 0);

console.log(JSON.stringify({ ok: true, suite: "handlers", fetches }, null, 2));
